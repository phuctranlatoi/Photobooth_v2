package com.lesouvenir.v2.storage

import com.google.gson.JsonParser
import com.lesouvenir.v2.imaging.FramePack
import java.nio.file.Files
import java.nio.file.Path
import java.util.Base64
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO

data class BundlePack(val id: String, val name: String, val coverDataUrl: String?, val layoutId: String, val frames: List<FramePack>)

/** Only V2-owned frame directories are inspected; invalid images are ignored. */
class FrameStore(private val workspace: Path, localAppData: String? = System.getenv("LOCALAPPDATA")) {
    private val roots = listOfNotNull(workspace.resolve("data"), localAppData?.let { Path.of(it).resolve("LeSouvenirDesktop/data") })
    fun loadFrames(layoutId: String? = null): List<FramePack> = roots.flatMap { root ->
        val directory = root.resolve("frames")
        if (!Files.isDirectory(directory)) emptyList() else Files.walk(directory).use { paths ->
            paths.filter { Files.isRegularFile(it) && it.fileName.toString().endsWith(".png", true) &&
                !it.fileName.toString().startsWith("thumb_", true) }
                .map { path -> frame(directory, path) }.filter { it != null }.map { it!! }.toList()
        }
    }.distinctBy { it.id }.filter { layoutId == null || it.targetLayoutId == layoutId }

    private fun frame(root: Path, path: Path): FramePack? = runCatching {
        val pieces = root.relativize(path).map { it.toString() }.toList()
        if (pieces.size !in 4..5 || pieces[2] !in listOf("Standard", "Special")) return null
        val special = pieces[2] == "Special"
        if (special != (pieces.size == 5)) return null
        if (imageSize(path) == null) return null
        val name = path.fileName.toString().removeSuffix(".png")
        val json = path.resolveSibling("$name.json")
        val coordinates = if (Files.isRegularFile(json)) runCatching { JsonParser.parseString(Files.readString(json)).asJsonObject }.getOrNull() else null
        val event = if (special) pieces[3] else null
        FramePack(id = pieces.joinToString("/").removeSuffix(".png"), title = name,
            description = "", accentColor = 0L, isCustom = true, isSpecial = special,
            specialEventName = event, customImagePath = path, targetPrintSize = pieces[0], targetLayoutId = pieces[1],
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

    fun thumbDataUrl(path: Path): String? = runCatching {
        val image = ImageIO.read(path.toFile()) ?: return null
        // 18 KB of PNG gives < 25 KB after Base64 and the data URL prefix.
        var width = minOf(180, image.width, (180L * image.width / image.height).toInt().coerceAtLeast(1))
        var height = (image.height.toLong() * width / image.width).toInt().coerceAtLeast(1)
        if (height > 180) { width = (width.toLong() * 180 / height).toInt().coerceAtLeast(1); height = 180 }
        while (true) {
            val scaled = BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB)
            val graphics = scaled.createGraphics()
            try {
                graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR)
                graphics.drawImage(image, 0, 0, width, height, null)
            } finally { graphics.dispose() }
            val output = ByteArrayOutputStream()
            check(ImageIO.write(scaled, "png", output))
            if (output.size() <= 18_000) return@runCatching "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray())
            if (width == 1 && height == 1) return@runCatching null
            width = maxOf(1, width * 3 / 4)
            height = maxOf(1, height * 3 / 4)
        }
        @Suppress("UNREACHABLE_CODE") null
    }.getOrNull()

    fun frameThumbDataUrl(path: Path): String? {
        val sibling = listOf("thumb_${path.fileName}", "thumb_ui_${path.fileName}")
            .map(path::resolveSibling).firstOrNull { Files.isRegularFile(it) && imageSize(it) != null }
        return (sibling?.let(::thumbDataUrl) ?: thumbDataUrl(path))
    }
}
