package com.lesouvenir.v2.catalog

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.cloud.FirestoreClient
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.lesouvenir.v2.foundation.*
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.util.concurrent.TimeUnit

enum class CatalogSource { FIREBASE_LIVE, DISK_CACHE, STATIC_FALLBACK, MEMORY_FALLBACK, UNAVAILABLE }

/** Remote catalog is optional. A failed or slow fetch never prevents local operation. */
class FirebaseCatalogService(
    private val workspace: Path,
    private val remote: (() -> List<LayoutMode>)? = null,
    private val localAppData: String? = System.getenv("LOCALAPPDATA"),
    private val credentialOverride: String? = System.getProperty("FIREBASE_SERVICE_ACCOUNT_PATH") ?: System.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
) {
    private val gson = Gson()
    private val cache = workspace.resolve("backend/config/firebase-layouts-cache.json")
    private val production = workspace.resolve("backend/config/production-layouts.json")
    @Volatile private var current: List<LayoutMode>? = null
    @Volatile var source: CatalogSource = CatalogSource.UNAVAILABLE
        private set
    @Volatile var lastSyncError: String? = null
        private set
    @Volatile var lastSyncTimestamp: Long = 0L
        private set

    fun getLayouts(): List<LayoutMode> = current ?: sync()

    @Synchronized fun sync(forceRemote: Boolean = false): List<LayoutMode> {
        if (!forceRemote) current?.let { return it }
        val attempt = runCatching { remote?.invoke() ?: fetchRemote() }
        val fetched = attempt.getOrNull()?.takeIf { it.isNotEmpty() }
        if (fetched != null) {
            val saved = runCatching {
                Files.createDirectories(cache.parent)
                val temporary = Files.createTempFile(cache.parent, "firebase-layouts-", ".tmp")
                try {
                    Files.writeString(temporary, gson.toJson(mapOf("layouts" to fetched)))
                    Files.move(temporary, cache, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
                } finally { Files.deleteIfExists(temporary) }
            }
            current = fetched
            source = CatalogSource.FIREBASE_LIVE
            lastSyncError = saved.exceptionOrNull()?.let { "Cache write failed: ${it.javaClass.simpleName}" }
            lastSyncTimestamp = System.currentTimeMillis()
            return fetched
        }
        lastSyncError = attempt.exceptionOrNull()?.let { "Remote fetch failed: ${it.javaClass.simpleName}" }
            ?: "Remote catalog unavailable or empty"
        val disk = readFile(cache)
        val static = if (disk == null) readFile(production) else null
        val fallback = disk ?: static ?: current ?: emptyList()
        source = when {
            disk != null -> CatalogSource.DISK_CACHE
            static != null -> CatalogSource.STATIC_FALLBACK
            fallback.isNotEmpty() -> CatalogSource.MEMORY_FALLBACK
            else -> CatalogSource.UNAVAILABLE
        }
        current = fallback
        return fallback
    }

    private fun readFile(path: Path): List<LayoutMode>? = runCatching {
        val array = gson.fromJson(Files.readString(path), JsonObject::class.java).getAsJsonArray("layouts")
        mapLayouts(array.map { it.asJsonObject }, requireSlots = path == cache)
    }.getOrNull()

    private fun mapLayouts(fields: List<JsonObject>, requireSlots: Boolean = false): List<LayoutMode>? = fields.mapNotNull { f ->
        runCatching {
            fun string(key: String): String? = f.get(key)?.takeUnless { it.isJsonNull }?.asString
            fun number(key: String): Number? = f.get(key)?.takeUnless { it.isJsonNull }?.let {
                if (it.isJsonPrimitive && it.asJsonPrimitive.isNumber) it.asNumber else null
            }
            val id = string("id")?.takeIf { it.isNotBlank() } ?: return@runCatching null
            val slots = (f.get("slots") ?: f.get("absoluteSlots"))?.takeIf { it.isJsonArray }
                ?.asJsonArray?.mapNotNull { item ->
                    runCatching {
                        val slot = item.asJsonObject
                        fun value(key: String, default: Float): Float = slot.get(key)?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isNumber }?.asFloat ?: default
                        LayoutSlot(value("index", 0f).toInt(), value("x", 0f), value("y", 0f), value("width", .5f), value("height", .5f))
                    }.getOrNull()
                }?.sortedBy { it.index } ?: emptyList()
            if (requireSlots && slots.isEmpty()) return@runCatching null
            val width = number("width")?.toFloat() ?: 1200f
            val height = number("height")?.toFloat() ?: 1800f
            val label = string("printSizeLabel") ?: if (width / height <= .5f) "5 x 15 cm" else "15 x 10 cm"
            val aspect = number("printAspectRatio")?.toFloat() ?: (width / height)
            val first = slots.firstOrNull()
            val computedPhotoAspect = if (first != null && first.height != 0f) first.width / first.height * aspect else 1f
            val defaults = LayoutMode(
                id = id, title = string("title") ?: "Layout $id",
                subtitle = string("subtitle") ?: "${slots.size} ảnh",
                description = string("description") ?: "Kích thước ${width.toInt()}x${height.toInt()}",
                family = string("family")?.let { LayoutFamily.valueOf(it) } ?: LayoutFamily.Grid,
                shotCount = number("shotCount")?.toInt() ?: slots.size,
                selectCount = number("selectCount")?.toInt() ?: slots.size,
                countdownSeconds = number("countdownSeconds")?.toInt() ?: 3,
                basePrice = number("basePrice")?.toLong() ?: 50000L,
                mediaLabel = string("mediaLabel") ?: "Layout $id",
                accentColor = number("accentColor")?.toLong() ?: 0xFF4CAF50,
                absoluteSlots = slots, gridColumns = number("gridColumns")?.toInt() ?: 1,
                printSizeLabel = label, printAspectRatio = aspect,
                photoAspectRatio = number("photoAspectRatio")?.toFloat() ?: computedPhotoAspect,
                qrCodeX = number("qrCodeX")?.toInt(), qrCodeY = number("qrCodeY")?.toInt(),
                qrCodeSize = number("qrCodeSize")?.toInt()
            )
            gson.fromJson<LayoutMode>(gson.toJsonTree(defaults).asJsonObject.apply {
                f.entrySet().filter { it.key != "slots" && it.key != "absoluteSlots" && it.key != "width" && it.key != "height" }
                    .forEach { (key, value) -> add(key, value) }
            }, LayoutMode::class.java)
        }.getOrNull()
    }.takeIf { it.isNotEmpty() }

    private fun fetchRemote(): List<LayoutMode>? {
        val credential = sequenceOf(workspace.resolve("serviceAccountKey.json"),
            workspace.resolve("backend/serviceAccountKey.json"),
            localAppData?.let { Path.of(it).resolve("LeSouvenirDesktop/serviceAccountKey.json") },
            credentialOverride?.let { Path.of(it) }).filterNotNull().firstOrNull { Files.isRegularFile(it) } ?: return null
        val app = synchronized(FirebaseApp::class.java) {
            FirebaseApp.getApps().firstOrNull() ?: Files.newInputStream(credential).use { input ->
                FirebaseApp.initializeApp(FirebaseOptions.builder().setCredentials(GoogleCredentials.fromStream(input)).build())
            }
        }
        val documents = FirestoreClient.getFirestore(app).collection("layouts").get().get(5, TimeUnit.SECONDS).documents
        return mapLayouts(documents.map { doc ->
            gson.toJsonTree(doc.data.orEmpty() + mapOf("id" to doc.id)).asJsonObject
        }, requireSlots = true)
    }
}
