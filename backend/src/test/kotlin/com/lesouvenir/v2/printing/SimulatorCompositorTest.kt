package com.lesouvenir.v2.printing

import com.lesouvenir.v2.foundation.*
import java.awt.Color
import java.awt.image.BufferedImage
import java.nio.file.Files
import javax.imageio.ImageIO
import kotlin.test.*

class SimulatorCompositorTest {
    private fun layout(label: String) = LayoutMode("fixture", "fixture", "", "", LayoutFamily.Grid, 1, 1,
        basePrice = 0, mediaLabel = "", accentColor = 0, printSizeLabel = label,
        absoluteSlots = listOf(LayoutSlot(0, 0f, 0f, 1f, 1f)))

    @Test fun geometryAlphaCropAndFiles() {
        val dir = Files.createTempDirectory(java.nio.file.Paths.get("."), "simulator-fixture-")
        try {
            val photo = BufferedImage(30, 10, BufferedImage.TYPE_INT_RGB)
            val g = photo.createGraphics()
            g.color = Color.RED; g.fillRect(0, 0, 10, 10)
            g.color = Color.GREEN; g.fillRect(10, 0, 10, 10)
            g.color = Color.BLUE; g.fillRect(20, 0, 10, 10); g.dispose()
            val frame = BufferedImage(10, 10, BufferedImage.TYPE_INT_ARGB)
            frame.setRGB(0, 0, Color.MAGENTA.rgb)
            for ((label, dimensions) in listOf("5x15" to (1226 to 1829), "15x10" to (1829 to 1226), "10x15" to (1226 to 1829))) {
                val c = dir.resolve("$label.png"); val p = dir.resolve("$label-print.png")
                assertEquals("FILE_GENERATED", SimulatorCompositor.generate(layout(label), listOf(photo), frame, c, p).status)
                val image = ImageIO.read(c.toFile()); val paper = ImageIO.read(p.toFile())
                assertEquals(dimensions.first, paper.width); assertEquals(dimensions.second, paper.height)
                assertEquals(if (label == "5x15") 592 else if (label == "15x10") 1790 else 1184, image.width)
                assertEquals(if (label == "15x10") 1184 else 1790, image.height)
                assertEquals(Color.MAGENTA.rgb, image.getRGB(0, 0))
                assertEquals(Color.GREEN.rgb, image.getRGB(image.width / 2, image.height / 2))
                if (label == "5x15") {
                    assertEquals(paper.getRGB(14 + 200, 27 + 1000), paper.getRGB(14 + 592 + 2 + 200, 27 + 1000))
                    assertEquals(Color.WHITE.rgb, paper.getRGB(0, 0))
                    // Last pixels of each strip and the complete four-pixel gap.
                    assertEquals(image.getRGB(591, 1000), paper.getRGB(605, 1027))
                    for (x in 606..607) assertEquals(Color.WHITE.rgb, paper.getRGB(x, 1027))
                    assertEquals(image.getRGB(0, 1000), paper.getRGB(608, 1027))
                    assertEquals(image.getRGB(591, 1789), paper.getRGB(1199, 1816))
                    assertEquals(Color.WHITE.rgb, paper.getRGB(1200, 1816))
                    assertEquals(Color.WHITE.rgb, paper.getRGB(1199, 1817))
                }
            }
            // Generating full-sized output does not resize or mutate the supplied inputs.
            assertEquals(30, photo.width); assertEquals(10, photo.height)
            assertEquals(Color.RED.rgb, photo.getRGB(0, 0))
            assertEquals(10, frame.width); assertEquals(10, frame.height)
            assertEquals(0, frame.getRGB(5, 5))
        } finally {
            Files.walk(dir).use { paths -> paths.sorted(Comparator.reverseOrder()).forEach { Files.deleteIfExists(it) } }
        }
    }

    @Test fun legacyLabelMatchingIsCaseInsensitiveButDoesNotNormalizeArbitrarySpaces() {
        val dir = Files.createTempDirectory(java.nio.file.Paths.get("."), "simulator-label-")
        try {
            val photo = BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB)
            val frame = BufferedImage(1, 1, BufferedImage.TYPE_INT_ARGB)
            for ((label, expectedWidth) in listOf("5 X 15 CM" to 592, "15 X 10 CM" to 1790, "5x 15" to 1184)) {
                val c = dir.resolve("composition.png"); val p = dir.resolve("print.png")
                SimulatorCompositor.generate(layout(label), listOf(photo), frame, c, p)
                assertEquals(expectedWidth, ImageIO.read(c.toFile()).width, label)
            }
        } finally {
            Files.walk(dir).use { paths -> paths.sorted(Comparator.reverseOrder()).forEach { Files.deleteIfExists(it) } }
        }
    }
}
