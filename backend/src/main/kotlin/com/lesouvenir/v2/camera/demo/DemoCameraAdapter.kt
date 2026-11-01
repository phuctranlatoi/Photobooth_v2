package com.lesouvenir.v2.camera.demo

import com.lesouvenir.v2.camera.real.CameraDevice
import java.awt.BasicStroke
import java.awt.Color
import java.awt.Font
import java.awt.GradientPaint
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.nio.file.Path
import javax.imageio.ImageIO

/** Synthetic, visibly watermarked imagery. Never represents a real customer capture. */
class DemoCameraAdapter : CameraDevice {
    @Volatile private var running = false
    private var preview: Thread? = null
    override fun isConnected() = true
    override fun startPreview(onFrame: (ByteArray) -> Unit) {
        stopPreview(); running = true
        preview = Thread({
            while (running && !Thread.currentThread().isInterrupted) {
                try {
                    val image = portrait(640, 426, 0, true)
                    ByteArrayOutputStream().use { out -> ImageIO.write(image, "jpg", out); onFrame(out.toByteArray()) }
                    Thread.sleep(55)
                } catch (_: InterruptedException) { Thread.currentThread().interrupt(); break }
                  catch (_: Exception) { break }
            }
        }, "v2-demo-preview").apply { isDaemon = true; start() }
    }
    override fun stopPreview() { running = false; preview?.interrupt(); preview = null }
    override fun capture(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path {
        require(aspectRatio.isFinite() && aspectRatio > 0f && shotIndex >= 0)
        Thread.sleep(300)
        val width = 2400
        val height = (width / aspectRatio).toInt().coerceIn(1200, 7200)
        Files.createDirectories(outputDir)
        val target = outputDir.resolve("original-shot-$shotIndex.jpg")
        check(ImageIO.write(portrait(width, height, shotIndex, false), "jpg", target.toFile()))
        return target
    }
    private fun portrait(w: Int, h: Int, index: Int, viewfinder: Boolean): BufferedImage {
        val image = BufferedImage(w, h, BufferedImage.TYPE_INT_RGB)
        val g = image.createGraphics()
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
            g.paint = GradientPaint(0f, 0f, Color(243, 222, 192), w.toFloat(), h.toFloat(), Color(155, 120, 100))
            g.fillRect(0, 0, w, h)
            val x = w / 2 + (index % 4 - 1) * w / 24
            val y = h * 34 / 100
            val unit = minOf(w / 8, h / 5)
            g.color = listOf(Color(104, 132, 111), Color(172, 91, 72), Color(48, 69, 100), Color(181, 154, 122))[index % 4]
            g.fillOval(x - unit * 2, y + unit, unit * 4, h)
            g.color = Color(180, 116, 83); g.fillOval(x - unit / 3, y + unit / 2, unit * 2 / 3, unit)
            g.color = Color(219, 158, 120); g.fillOval(x - unit, y - unit, unit * 2, unit * 5 / 2)
            g.color = Color(61, 47, 42); g.fillArc(x - unit, y - unit, unit * 2, unit, 0, 180)
            g.color = Color(54, 43, 39)
            val tilt = (index % 4 - 1) * unit / 12
            g.fillOval(x - unit / 2, y + tilt, unit / 7, unit / 10)
            g.fillOval(x + unit / 3, y - tilt, unit / 7, unit / 10)
            g.stroke = BasicStroke((unit / 30f).coerceAtLeast(2f))
            g.drawArc(x - unit / 3, y + unit / 3, unit * 2 / 3, unit / 3, 190, 150)
            if (index % 4 == 3) {
                g.color = Color(219, 158, 120)
                g.fillRoundRect(x + unit, y, unit / 5, unit * 2, unit / 10, unit / 10)
                g.fillRoundRect(x + unit * 5 / 4, y - unit / 4, unit / 5, unit * 2, unit / 10, unit / 10)
            }
            g.color = Color(255, 255, 255, 190)
            g.font = Font("SansSerif", Font.BOLD, (w / 60).coerceAtLeast(12))
            g.drawString("LE SOUVENIR TEST PORTRAIT #$index", w / 20, h - h / 20)
            if (viewfinder) {
                g.color = Color(255, 255, 255, 170)
                g.drawRect(x - unit * 6 / 5, y - unit * 6 / 5, unit * 12 / 5, unit * 14 / 5)
                g.drawLine(w / 2 - 15, h / 2, w / 2 + 15, h / 2)
                g.drawLine(w / 2, h / 2 - 15, w / 2, h / 2 + 15)
            }
        } finally { g.dispose() }
        return image
    }
    override fun close() = stopPreview()
}
