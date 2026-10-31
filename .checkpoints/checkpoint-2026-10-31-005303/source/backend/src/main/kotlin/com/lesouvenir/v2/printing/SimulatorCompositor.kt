package com.lesouvenir.v2.printing

import com.lesouvenir.v2.foundation.LayoutMode
import java.awt.Color
import java.awt.Graphics2D
import java.awt.Rectangle
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.nio.file.Files
import java.nio.file.Path
import javax.imageio.ImageIO
import kotlin.math.roundToInt

/** File-only simulator. Inputs must already have any LUT/beauty applied. */
object SimulatorCompositor {
    data class Output(val composition: Path, val printImage: Path, val status: String = "FILE_GENERATED")

    /** V1 DesktopCompositor.renderFinal custom-frame branch, without QR or driver access. */
    fun generate(layout: LayoutMode, photos: List<BufferedImage>, frame: BufferedImage, composition: Path, printImage: Path): Output {
        require(layout.selectCount > 0 && photos.size >= layout.selectCount)
        require(composition.toAbsolutePath().normalize() != printImage.toAbsolutePath().normalize())
        val strip = layout.printSizeLabel.contains("5x15", true) || layout.printSizeLabel.contains("5 x 15", true)
        val landscape = !strip && (layout.printSizeLabel.contains("15x10", true) || layout.printSizeLabel.contains("15 x 10", true))
        val width = (if (strip) 592 else if (landscape) 1790 else 1184) * 2
        val height = (if (landscape) 1184 else 1790) * 2
        val canvas = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)
        val g = canvas.createGraphics()
        try {
            g.configure()
            g.color = Color.WHITE; g.fillRect(0, 0, width, height)
            slots(layout, width, height).zip(photos.take(layout.selectCount)).forEach { (slot, photo) ->
                g.color = Color(244, 244, 242); g.fill(slot)
                g.centerCrop(photo, Rectangle(slot.x - 2, slot.y - 2, slot.width + 4, slot.height + 4))
            }
            g.drawImage(frame, 0, 0, width, height, null)
        } finally { g.dispose() }
        val paper = BufferedImage((if (landscape) 1829 else 1226) * 2, (if (landscape) 1226 else 1829) * 2, BufferedImage.TYPE_INT_RGB)
        val pg = paper.createGraphics()
        try {
            pg.configure(); pg.color = Color.WHITE; pg.fillRect(0, 0, paper.width, paper.height)
            val x = (if (landscape) 27 else 14) * 2
            val y = (if (landscape) 14 else 27) * 2
            pg.drawImage(canvas, x, y, width, height, null)
            if (strip) pg.drawImage(canvas, x + width + 4, y, width, height, null)
        } finally { pg.dispose() }
        write(canvas, composition); write(paper, printImage)
        return Output(composition, printImage)
    }

    private fun write(image: BufferedImage, path: Path) {
        val extension = path.fileName.toString().substringAfterLast('.', "").lowercase()
        require(extension in setOf("png", "jpg", "jpeg")) { "Expected PNG or JPEG output" }
        path.toAbsolutePath().parent?.let { Files.createDirectories(it) }
        check(ImageIO.write(image, if (extension == "png") "png" else "jpeg", path.toFile()))
    }

    // V1 DesktopCompositor.computeSlots: absolute indices are intentionally not used.
    private fun slots(layout: LayoutMode, w: Int, h: Int): List<Rectangle> {
        if (layout.absoluteSlots.isNotEmpty()) return layout.absoluteSlots.map {
            Rectangle((w * it.x).roundToInt(), (h * it.y).roundToInt(), (w * it.width).roundToInt(), (h * it.height).roundToInt())
        }
        val width = w.toFloat()
        val top = (width * layout.paddingTopRatio).roundToInt()
        val left = (width * layout.paddingLeftRatio).roundToInt()
        val right = (width * layout.paddingRightRatio).roundToInt()
        val gapX = (width * layout.gapHorizontalRatio).roundToInt()
        val gapY = (width * layout.gapVerticalRatio).roundToInt()
        val columns = layout.gridColumns.coerceAtLeast(1)
        val sw = ((w - left - right - gapX * (columns - 1)).toFloat() / columns).roundToInt().coerceAtLeast(1)
        val sh = (sw / layout.photoAspectRatio).roundToInt().coerceAtLeast(1)
        return List(layout.selectCount) { i -> Rectangle(left + i % columns * (sw + gapX), top + i / columns * (sh + gapY), sw, sh) }
    }

    private fun Graphics2D.configure() {
        setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
        setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC)
        setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY)
        setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON)
    }

    // V1 DesktopCompositor.drawCenterCrop.
    private fun Graphics2D.centerCrop(image: BufferedImage, d: Rectangle) {
        val sourceRatio = image.width.toDouble() / image.height.toDouble()
        val destinationRatio = d.width.toDouble() / d.height.toDouble()
        val s = if (sourceRatio > destinationRatio) {
            val sw = (image.height * destinationRatio).roundToInt().coerceAtMost(image.width)
            Rectangle((image.width - sw) / 2, 0, sw, image.height)
        } else {
            val sh = (image.width / destinationRatio).roundToInt().coerceAtMost(image.height)
            Rectangle(0, (image.height - sh) / 2, image.width, sh)
        }
        drawImage(image, d.x, d.y, d.x + d.width, d.y + d.height, s.x, s.y, s.x + s.width, s.y + s.height, null)
    }
}
