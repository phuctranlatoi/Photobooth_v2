package com.lesouvenir.v2.storage

import com.google.gson.JsonParser
import com.lesouvenir.v2.imaging.FramePack
import java.nio.file.Files
import java.nio.file.Path
import java.util.Base64
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.util.concurrent.ConcurrentHashMap
import javax.imageio.ImageIO

data class BundlePack(val id: String, val name: String, val coverDataUrl: String?, val layoutId: String, val frames: List<FramePack>)

/** Only V2-owned frame directories are inspected; invalid images are ignored. */
class FrameStore(private val workspace: Path, localAppData: String? = System.getenv("LOCALAPPDATA")) {
    private val thumbCache = ConcurrentHashMap<Path, String>()
    private val roots = listOfNotNull(workspace.resolve("data"), localAppData?.let { Path.of(it).resolve("LeSouvenirDesktop/data") })
    fun loadFrames(layoutId: String? = null, printSize: String? = null): List<FramePack> = roots.flatMap { root ->
        val directory = root.resolve("frames")
        if (!Files.isDirectory(directory)) emptyList() else Files.walk(directory).use { paths ->
            paths.filter { Files.isRegularFile(it) && it.fileName.toString().endsWith(".png", true) &&
                !it.fileName.toString().startsWith("thumb_", true) }
                .map { path -> frame(directory, path) }.filter { it != null }.map { it!! }.toList()
        }
    }.distinctBy { it.id }.filter { frame ->
        if (layoutId == null && printSize == null) true
        else {
            val size = normalizedPrintSize(layoutId) ?: normalizedPrintSize(printSize)
            frame.targetLayoutId == layoutId || when (size) {
                "5x15" -> frame.targetPrintSize == size || frame.targetLayoutId == "strip-5x15"
                "10x15" -> frame.targetPrintSize == size || frame.targetLayoutId == "print-10x15"
                else -> false
            }
        }
    }

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
        val size = pieces.firstOrNull()?.lowercase()
        val printSize = when (size) { "5x15", "10x15" -> size; else -> null }
        val canonical = pieces.size in 4..5 && pieces[2] in listOf("Standard", "Special") &&
            (pieces[2] == "Special") == (pieces.size == 5)
        if (!canonical && (pieces.size != 2 || printSize == null) && pieces.size != 1) return null
        val special = canonical && pieces[2] == "Special"
        if (imageSize(path) == null) return null
        val name = path.fileName.toString().removeSuffix(".png")
        val json = path.resolveSibling("$name.json")
        val coordinates = if (Files.isRegularFile(json)) runCatching { JsonParser.parseString(Files.readString(json)).asJsonObject }.getOrNull() else null
        val event = if (special) pieces[3] else null
        val resolvedSize = if (canonical) pieces[0] else printSize ?: when {
            name.startsWith("515", true) -> "5x15"
            name.startsWith("1015", true) -> "10x15"
            else -> return null
        }
        val resolvedLayout = if (canonical) pieces[1] else if (resolvedSize == "5x15") "strip-5x15" else "print-10x15"
        FramePack(id = pieces.joinToString("/").removeSuffix(".png"), title = name,
            description = "", accentColor = 0L, isCustom = true, isSpecial = special,
            specialEventName = event, customImagePath = path, targetPrintSize = resolvedSize, targetLayoutId = resolvedLayout,
            qrCodeX = coordinates?.get("qrCodeX")?.asInt, qrCodeY = coordinates?.get("qrCodeY")?.asInt,
            qrCodeSize = coordinates?.get("qrCodeSize")?.asInt)
    }.getOrNull()

    fun loadBundles(): List<BundlePack> = loadFrames().filter { it.isSpecial }.groupBy { Triple(it.targetPrintSize, it.targetLayoutId, it.specialEventName) }
        .map { (key, frames) ->
            val event = key.third.orEmpty()
            val cover = roots.asSequence().map { it.resolve("covers").resolve(key.first.orEmpty()).resolve(key.second.orEmpty())
                .resolve("Special").resolve(event).resolve("cover.png") }
                .firstOrNull { Files.isRegularFile(it) && runCatching { ImageIO.read(it.toFile()) != null }.getOrDefault(false) }
            BundlePack("${key.first}/${key.second}/$event", event, cover?.let { thumbDataUrl(it) }, key.second.orEmpty(), frames)
        }

    /** Read only image metadata when building the catalog; full images remain on disk for composition. */
    fun imageSize(path: Path): Pair<Int, Int>? = runCatching {
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
        val scale = minOf(1.0, 800.0 / maxOf(image.width, image.height))
        val width = (image.width * scale).toInt().coerceAtLeast(1)
        val height = (image.height * scale).toInt().coerceAtLeast(1)
        val scaled = BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB)
        val graphics = scaled.createGraphics()
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC)
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY)
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
