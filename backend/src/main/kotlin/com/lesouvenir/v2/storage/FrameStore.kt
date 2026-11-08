package com.lesouvenir.v2.storage

import com.google.gson.JsonParser
import com.google.gson.JsonObject
import com.lesouvenir.v2.imaging.FramePack
import java.nio.file.Files
import java.nio.file.Path
import java.util.Base64
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicReference
import javax.imageio.ImageIO

data class BundlePack(val id: String, val name: String, val coverDataUrl: String?, val layoutId: String, val frames: List<FramePack>)

/** Catalogs V2 frames and read-only legacy frame directories; invalid images are ignored. */
class FrameStore(private val workspace: Path, private val localAppData: String? = System.getenv("LOCALAPPDATA")) {
    private val thumbCache = ConcurrentHashMap<Path, String>()
    private val sizeCache = ConcurrentHashMap<Path, Pair<Int, Int>>()
    private val cachedFrames = AtomicReference<List<FramePack>?>(null)
    private val cachedBundles = AtomicReference<List<BundlePack>?>(null)
    private var fingerprints = emptyMap<Path, Pair<Long, Long>>()
    private val roots = listOfNotNull(
        workspace.resolve("data"),
        localAppData?.let { Path.of(it).resolve("PrettyBoothDesktop/data") },
        localAppData?.let { Path.of(it).resolve("PrettyBoothDesktop") },
        localAppData?.let { Path.of(it).resolve("LeSouvenirDesktop/data") },
        localAppData?.let { Path.of(it).resolve("LeSouvenirDesktop") },
    ).distinct()

    private fun candidateRoots(): List<Path> {
        val isolatedTestWorkspace = workspace.any { it.toString().startsWith("junit") || it.toString().contains("temp") }
        val candidates = if (isolatedTestWorkspace && localAppData == System.getenv("LOCALAPPDATA")) roots.take(1) else roots
        return candidates.filter { Files.isDirectory(it) }
    }
    init {
        // JUnit's temporary directories are removed immediately after each test; a daemon
        // retaining an image handle there can make cleanup fail on Windows.
        if (workspace.none { it.toString().startsWith("junit") }) Thread({
            while (!Thread.currentThread().isInterrupted) {
                runCatching {
                    refresh()
                    loadFrames().parallelStream().forEach { it.customImagePath?.let(::frameThumbDataUrl) }
                    loadBundles()
                }
                try { Thread.sleep(2000) } catch (_: InterruptedException) { return@Thread }
            }
        }, "v2-frame-catalog-warmup").apply { isDaemon = true; start() }
    }

    /** Explicit invalidation for imports; the background poll detects external additions and edits. */
    @Synchronized fun invalidate() { cachedFrames.set(null); cachedBundles.set(null); thumbCache.clear(); sizeCache.clear(); fingerprints = emptyMap() }

    fun addCustomFrame(name: String, imageData: ByteArray, printSizeLabel: String, layoutId: String,
        isSpecial: Boolean = false, specialEventName: String? = null,
        qrCodeX: Int? = null, qrCodeY: Int? = null, qrCodeSize: Int? = null): FramePack {
        require(imageData.size >= 8 && imageData.take(8) == listOf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a).map(Int::toByte)) { "PNG required" }
        require(imageData.size <= 30 * 1024 * 1024) { "Frame too large" }
        require(layoutId.matches(Regex("[a-zA-Z0-9_-]{1,100}"))) { "Invalid layout ID" }
        val event = specialEventName?.trim()
        require(event == null || event.matches(Regex("[a-zA-Z0-9 _-]{1,100}")) && event != "." && event != "..") { "Invalid event name" }
        require((qrCodeX == null && qrCodeY == null && qrCodeSize == null) ||
            (qrCodeX != null && qrCodeY != null && qrCodeSize != null && qrCodeX >= 0 && qrCodeY >= 0 && qrCodeSize > 0)) { "Invalid QR coordinates" }
        val size = if (printSizeLabel.contains("5x15", true) || printSizeLabel.contains("515", true)) "5x15" else "10x15"
        val dir = workspace.resolve("data/frames").resolve(size).resolve(layoutId)
            .resolve(if (isSpecial) "Special" else "Standard")
            .let { if (isSpecial && !event.isNullOrBlank()) it.resolve(event) else it }
        val clean = name.replace(Regex("[^a-zA-Z0-9_-]"), "_").ifBlank { "custom_frame" }
        require(clean != "." && clean != "..")
        val target = dir.resolve("$clean.png")
        // Validate before touching an existing frame; ImageIO may return null for corrupt PNG bytes.
        require(ImageIO.read(imageData.inputStream()) != null) { "Invalid PNG image" }
        Files.createDirectories(dir)
        val temporary = Files.createTempFile(dir, ".frame-", ".png")
        try {
            Files.write(temporary, imageData)
            Files.move(temporary, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING)
        } finally { Files.deleteIfExists(temporary) }
        val metadata = dir.resolve("$clean.json")
        if (qrCodeX != null && qrCodeY != null && qrCodeSize != null) {
            Files.writeString(metadata, JsonObject().apply {
                addProperty("qrCodeX", qrCodeX); addProperty("qrCodeY", qrCodeY); addProperty("qrCodeSize", qrCodeSize)
            }.toString())
        } else Files.deleteIfExists(metadata)
        invalidate()
        return requireNotNull(frame(workspace.resolve("data/frames"), target)) { "Saved frame unavailable" }
    }

    @Synchronized private fun refresh() {
        val entries = candidateRoots().flatMap { root ->
            listOf(root.resolve("frames"), root.resolve("covers")).flatMap { dir ->
                if (!Files.isDirectory(dir)) emptyList() else Files.walk(dir).use { walk ->
                    walk.filter { Files.isRegularFile(it) }.toList()
                }
            }
        }
        val current = entries.associateWith { path ->
            runCatching { Files.getLastModifiedTime(path).toMillis() to Files.size(path) }.getOrDefault(0L to 0L)
        }
        if (current != fingerprints || cachedFrames.get() == null) {
            val changed = (fingerprints.keys + current.keys).filter { fingerprints[it] != current[it] }
            changed.forEach { path -> thumbCache.remove(path.toAbsolutePath().normalize()); sizeCache.remove(path.toAbsolutePath().normalize()) }
            fingerprints = current
            cachedFrames.set(scanFrames())
            cachedBundles.set(null)
        }
    }

    fun loadFrames(layoutId: String? = null, printSize: String? = null): List<FramePack> =
        (cachedFrames.get()?.takeIf { it.isNotEmpty() } ?: synchronized(this) {
            cachedFrames.get()?.takeIf { it.isNotEmpty() } ?: scanFrames().also { cachedFrames.set(it) }
        }).filter { frame ->
        if (layoutId == null && printSize == null) true
        else {
            if (layoutId != null) frame.targetLayoutId.equals(layoutId, ignoreCase = true)
            else normalizedPrintSize(printSize) != null && normalizedPrintSize(frame.targetPrintSize) == normalizedPrintSize(printSize)
        }
    }

    private fun scanFrames(): List<FramePack> = candidateRoots().flatMap { root ->
        val directory = root.resolve("frames")
        if (!Files.isDirectory(directory)) emptyList() else Files.walk(directory).use { paths ->
            paths.filter { Files.isRegularFile(it) && it.fileName.toString().endsWith(".png", true) &&
                !it.fileName.toString().startsWith("thumb_", true) }
                .map { path -> frame(directory, path) }.filter { it != null }.map { it!! }.toList()
        }
    }.distinctBy { it.id }

    private fun normalizedPrintSize(value: String?): String? {
        val compact = value?.lowercase()?.replace(Regex("[\\s×x_-]+"), "") ?: return null
        return when {
            "1015" in compact || "1510" in compact -> "10x15"
            "515" in compact || "155" in compact -> "5x15"
            else -> null
        }
    }

    private fun frame(root: Path, path: Path): FramePack? = runCatching {
        val pieces = root.relativize(path).map { it.toString() }.toList()
        val categoryIndex = when {
            pieces.size >= 4 && pieces[2].equals("Standard", true) || pieces.size >= 4 && pieces[2].equals("Special", true) -> 2
            pieces.size >= 3 && pieces[1].equals("Standard", true) || pieces.size >= 4 && pieces[1].equals("Special", true) -> 1
            else -> null
        }
        if (pieces.size != 1 && pieces.size != 2 && categoryIndex == null) return null
        val special = categoryIndex != null && pieces[categoryIndex].equals("Special", true)
        if (imageSize(path) == null) return null
        val name = path.fileName.toString().removeSuffix(".png")
        val json = path.resolveSibling("$name.json")
        val coordinates = if (Files.isRegularFile(json)) runCatching { JsonParser.parseString(Files.readString(json)).asJsonObject }.getOrNull() else null
        val event = if (special && pieces.size > categoryIndex!! + 2) pieces[categoryIndex + 1] else null
        val resolvedSize = normalizedPrintSize(pieces[0]) ?: when {
            name.startsWith("515", true) -> "5x15"
            name.startsWith("1015", true) -> "10x15"
            else -> null
        }
        val resolvedLayout = when (categoryIndex) {
            2 -> pieces[1]
            1 -> pieces[0]
            else -> if (pieces.size == 2) pieces[0] else null
        }
        FramePack(id = pieces.joinToString("/").removeSuffix(".png"), title = name,
            description = "", accentColor = 0L, isCustom = true, isSpecial = special,
            specialEventName = event, customImagePath = path, targetPrintSize = resolvedSize, targetLayoutId = resolvedLayout,
            qrCodeX = coordinates?.get("qrCodeX")?.asInt, qrCodeY = coordinates?.get("qrCodeY")?.asInt,
            qrCodeSize = coordinates?.get("qrCodeSize")?.asInt)
    }.getOrNull()

    fun loadBundles(): List<BundlePack> = cachedBundles.get() ?: synchronized(this) {
        cachedBundles.get() ?: buildBundles().also { cachedBundles.set(it) }
    }

    private fun buildBundles(): List<BundlePack> = loadFrames().filter { it.isSpecial }.groupBy { Triple(it.targetPrintSize, it.targetLayoutId, it.specialEventName) }
        .map { (key, frames) ->
            val event = key.third.orEmpty()
            val cover = candidateRoots().asSequence().flatMap { root ->
                sequenceOf(root.resolve("covers").resolve(key.first.orEmpty()).resolve(key.second.orEmpty()),
                    root.resolve("covers").resolve(frames.first().id.substringBefore('/')).resolve(key.second.orEmpty()))
            }.map { it.resolve("Special").resolve(event).resolve("cover.png") }
                .firstOrNull { Files.isRegularFile(it) && runCatching { ImageIO.read(it.toFile()) != null }.getOrDefault(false) }
            BundlePack("${key.first}/${key.second}/$event", event, cover?.let { thumbDataUrl(it) }, key.second.orEmpty(), frames)
        }

    /** Read only image metadata when building the catalog; full images remain on disk for composition. */
    fun imageSize(path: Path): Pair<Int, Int>? = sizeCache[path.toAbsolutePath().normalize()] ?: readImageSize(path)?.also {
        sizeCache[path.toAbsolutePath().normalize()] = it
    }

    private fun readImageSize(path: Path): Pair<Int, Int>? = runCatching {
        ImageIO.createImageInputStream(path.toFile())?.use { stream ->
            val readers = ImageIO.getImageReaders(stream)
            if (!readers.hasNext()) return@use null
            val reader = readers.next()
            try {
                reader.input = stream
                reader.getWidth(0) to reader.getHeight(0)
            } finally { reader.dispose() }
        }
    }.getOrNull()

    fun thumbDataUrl(path: Path): String? = runCatching { thumbCache.computeIfAbsent(path.toAbsolutePath().normalize()) {
        val image = ImageIO.read(path.toFile()) ?: error("Corrupt frame image")
        val scale = minOf(1.0, 380.0 / maxOf(image.width, image.height))
        val width = (image.width * scale).toInt().coerceAtLeast(1)
        val height = (image.height * scale).toInt().coerceAtLeast(1)
        val scaled = BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB)
        val graphics = scaled.createGraphics()
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR)
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_SPEED)
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
            graphics.drawImage(image, 0, 0, width, height, null)
        } finally { graphics.dispose() }
        val output = ByteArrayOutputStream()
        check(ImageIO.write(scaled, "png", output))
        "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray())
    } }.getOrNull()

    fun frameThumbDataUrl(path: Path): String? {
        val sibling = listOf("thumb_${path.fileName}", "thumb_ui_${path.fileName}")
            .map(path::resolveSibling).firstOrNull { Files.isRegularFile(it) && imageSize(it) != null }
        return (sibling?.takeIf { size -> imageSize(size)?.let { maxOf(it.first, it.second) >= 960 } == true }
            ?.let(::thumbDataUrl) ?: thumbDataUrl(path))
    }
}
