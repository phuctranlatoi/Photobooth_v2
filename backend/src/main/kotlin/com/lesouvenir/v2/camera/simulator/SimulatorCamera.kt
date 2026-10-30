package com.lesouvenir.v2.camera.simulator

import com.lesouvenir.v2.foundation.SimulatorAuthorization
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.nio.file.LinkOption
import java.nio.file.Path
import java.util.concurrent.atomic.AtomicReference
import javax.imageio.ImageIO

data class SimulatorCapture(val sourceIndex: Int, val sourceId: String, val original: Path)
data class SimulatorPreview(val sourceIndex: Int, val sourceId: String, val jpeg: ByteArray)

/** Local synthetic source, deliberately unrelated to hardware camera selection or session timing. */
class SimulatorCamera(
    authorization: SimulatorAuthorization,
    workspace: Path,
    private val sourceCount: Int,
    private val width: Int = 1920,
    private val height: Int = 1080,
    private val previewWidth: Int = 320,
    private val previewHeight: Int = 180,
) {
    private val root: Path
    private val latest = AtomicReference<SimulatorPreview?>(null)
    private val sources = mutableMapOf<Int, ByteArray>()

    init {
        authorization.requireSyntheticCapturePermission()
        require(sourceCount > 0 && width in 1..4096 && height in 1..4096)
        require(previewWidth in 1..640 && previewHeight in 1..640)
        root = workspace.toRealPath()
        require(root.fileName.toString().equals("PhotoboothDesktop_v2", ignoreCase = true)) {
            "Simulator workspace must be the V2 workspace"
        }
    }

    private fun id(index: Int): String {
        require(index in 0 until sourceCount) { "Source index out of range" }
        return "synthetic-$index"
    }

    private fun jpeg(index: Int): ByteArray = sources.getOrPut(index) {
        val image = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)
        val graphics = image.createGraphics()
        try {
            graphics.color = Color((index * 53) and 255, (index * 97 + 80) and 255, (index * 31 + 160) and 255)
            graphics.fillRect(0, 0, width, height)
            graphics.color = Color.WHITE
            graphics.drawString(id(index), 10, 24)
        } finally { graphics.dispose() }
        ByteArrayOutputStream().use { out ->
            check(ImageIO.write(image, "jpeg", out)) { "JPEG encoder unavailable" }
            out.toByteArray()
        }
    }

    /** Publishes one downscaled JPEG; the previous preview is discarded. */
    @Synchronized fun publishPreview(index: Int) {
        val identity = id(index)
        val image = ImageIO.read(jpeg(index).inputStream()) ?: error("Invalid synthetic JPEG")
        val scale = minOf(1.0, previewWidth.toDouble() / image.width, previewHeight.toDouble() / image.height)
        val thumb = BufferedImage(maxOf(1, (image.width * scale).toInt()), maxOf(1, (image.height * scale).toInt()), BufferedImage.TYPE_INT_RGB)
        val g = thumb.createGraphics()
        try { g.drawImage(image, 0, 0, thumb.width, thumb.height, null) } finally { g.dispose() }
        val bytes = ByteArrayOutputStream().use { out ->
            check(ImageIO.write(thumb, "jpeg", out)); out.toByteArray()
        }
        latest.set(SimulatorPreview(index, identity, bytes))
    }

    fun latestPreview(): SimulatorPreview? = latest.get()?.let { it.copy(jpeg = it.jpeg.copyOf()) }

    /** Session directory must already exist inside V2, without symbolic-link components.
     * Publication is atomic and fails rather than replacing an existing original. */
    @Synchronized fun capture(index: Int, sessionDirectory: Path, shotId: String): SimulatorCapture {
        val identity = id(index)
        require(shotId.matches(Regex("[A-Za-z0-9_-]{1,64}"))) { "Invalid shot ID" }
        val dir = sessionDirectory.toAbsolutePath().normalize()
        require(dir.startsWith(root) && dir != root) { "Session directory must be inside V2" }
        var current = root
        for (part in root.relativize(dir)) {
            current = current.resolve(part)
            require(!Files.isSymbolicLink(current)) { "Symbolic links are not allowed" }
        }
        require(Files.isDirectory(dir, LinkOption.NOFOLLOW_LINKS) && dir.toRealPath() == dir) { "Invalid session directory" }
        val destination = dir.resolve("original-$shotId.jpg")
        val temp = Files.createTempFile(dir, ".simulator-", ".tmp")
        try {
            Files.write(temp, jpeg(index))
            // Creating a hard link publishes the complete file atomically, without replacing an existing name.
            Files.createLink(destination, temp)
        } finally { Files.deleteIfExists(temp) }
        return SimulatorCapture(index, identity, destination)
    }
}
