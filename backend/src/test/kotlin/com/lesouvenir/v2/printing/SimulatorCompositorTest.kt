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
            for ((label, dimensions) in listOf("5x15" to (2452 to 3658), "15x10" to (3658 to 2452), "10x15" to (2452 to 3658))) {
                val c = dir.resolve("$label.png"); val p = dir.resolve("$label-print.png")
                assertEquals("FILE_GENERATED", SimulatorCompositor.generate(layout(label), listOf(photo), frame, c, p).status)
                val image = ImageIO.read(c.toFile()); val paper = ImageIO.read(p.toFile())
                assertEquals(dimensions.first, paper.width); assertEquals(dimensions.second, paper.height)
                assertEquals(Color.MAGENTA.rgb, image.getRGB(0, 0))
                assertEquals(Color.GREEN.rgb, image.getRGB(image.width / 2, image.height / 2))
                if (label == "5x15") {
                    assertEquals(paper.getRGB(28 + 592, 54 + 1000), paper.getRGB(28 + 1184 + 4 + 592, 54 + 1000))
                    assertEquals(Color.WHITE.rgb, paper.getRGB(0, 0))
                }
            }
        } finally {
            Files.walk(dir).use { paths -> paths.sorted(Comparator.reverseOrder()).forEach { Files.deleteIfExists(it) } }
        }
    }
}
