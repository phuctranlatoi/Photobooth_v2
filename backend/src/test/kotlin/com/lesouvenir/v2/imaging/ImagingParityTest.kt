package com.lesouvenir.v2.imaging

import com.lesouvenir.v2.foundation.LayoutFamily
import com.lesouvenir.v2.imaging.beauty.BeautyConfig
import com.lesouvenir.v2.imaging.beauty.DesktopBeautyService
import com.lesouvenir.v2.imaging.lut.CubeLutParser
import java.awt.Color
import java.awt.image.BufferedImage
import java.nio.file.Files
import javax.imageio.ImageIO
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse

class ImagingParityTest {
    @Test fun beautyDisabledAndMissingSourceNeverReplaceOriginal() {
        val dir = Files.createTempDirectory("imaging-beauty-test")
        try {
            val source = dir.resolve("missing.jpg").toFile()
            val output = dir.resolve("beautified.png").toFile()
            DesktopBeautyService().use { beauty ->
                assertEquals(source, beauty.processCapture(source, output, BeautyConfig(enabled = false)))
                assertEquals(source, beauty.processCapture(source, output, BeautyConfig()))
            }
            assertFalse(output.exists())
        } finally { dir.toFile().deleteRecursively() }
    }

    @Test fun lutIdentityAndMalformedRow() {
        val identity = "LUT_3D_SIZE 2\n" + buildString {
            for (b in 0..1) for (g in 0..1) for (r in 0..1) append("$r $g $b\n")
        }
        val lut = CubeLutParser.parse(identity)
        val input = BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB)
        input.setRGB(0, 0, Color(80, 130, 210).rgb)
        val result = lut.apply(input, 1f)
        assertEquals(input.getRGB(0, 0), result.getRGB(0, 0))
        assertFailsWith<IllegalArgumentException> { CubeLutParser.parse("LUT_3D_SIZE 2\n0 0 0") }
    }

    private fun layout(size: String) = LayoutMode(
        id = "parity", title = "Parity", subtitle = "", description = "", family = LayoutFamily.Column,
        shotCount = 1, selectCount = 1, basePrice = 0, mediaLabel = "", accentColor = 0,
        printSizeLabel = size, gridColumns = 1
    )

    @Test fun stripTwoUpDimensionsAndPixelPlacement() {
        val dir = Files.createTempDirectory("imaging-strip-test")
        try {
            val photo = dir.resolve("photo.png")
            ImageIO.write(BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB).apply {
                val g = createGraphics()
                try { g.color = Color.RED; g.fillRect(0, 0, width, height) } finally { g.dispose() }
            }, "png", photo.toFile())
            val frame = FramePack("frame", "Frame", "", 0L, isCustom = true, customImagePath = photo)
            val result = DesktopCompositor().renderFinal(layout("5x15"), frame, listOf(photo), dir, "https://example.invalid/album")
            ImageIO.read(result.finalImagePath.toFile()).let { assertEquals(1184, it.width); assertEquals(3580, it.height) }
            ImageIO.read(result.printImagePath.toFile()).let { print ->
                assertEquals(2452, print.width)
                assertEquals(3658, print.height)
                assertEquals(Color.WHITE.rgb, print.getRGB(0, 0))
                assertEquals(Color.RED.rgb, print.getRGB(28 + 100, 54 + 100))
                assertEquals(Color.RED.rgb, print.getRGB(28 + 1184 + 4 + 100, 54 + 100))
            }
        } finally { dir.toFile().deleteRecursively() }
    }

    @Test fun landscapePrintDimensions() {
        val dir = Files.createTempDirectory("imaging-landscape-test")
        try {
            val photo = dir.resolve("photo.png")
            ImageIO.write(BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB), "png", photo.toFile())
            val result = DesktopCompositor().renderFinal(layout("15x10"), FramePack("f", "F", "", 0), listOf(photo), dir)
            ImageIO.read(result.finalImagePath.toFile()).let { assertEquals(3580, it.width); assertEquals(2368, it.height) }
            ImageIO.read(result.printImagePath.toFile()).let { assertEquals(3658, it.width); assertEquals(2452, it.height) }
        } finally { dir.toFile().deleteRecursively() }
    }
}
