package com.lesouvenir.v2.imaging

import java.awt.image.BufferedImage
import java.nio.file.Files
import javax.imageio.ImageIO
import kotlin.test.Test
import kotlin.test.assertEquals

class PrintImageWriterTest {
    @Test fun pngAndJpegCarry300DpiDensity() {
        val dir = Files.createTempDirectory(java.nio.file.Paths.get("."), "density-test-")
        try {
            val image = BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB)
            for (extension in listOf("png", "jpg")) {
                val file = dir.resolve("image.$extension")
                PrintImageWriter.write(image, file)
                ImageIO.createImageInputStream(file.toFile()).use { stream ->
                    val reader = ImageIO.getImageReaders(stream).next()
                    try {
                        reader.input = stream
                        val format = if (extension == "png") "javax_imageio_png_1.0" else "javax_imageio_jpeg_image_1.0"
                        val root = reader.getImageMetadata(0).getAsTree(format)
                        val node = (root as org.w3c.dom.Element).getElementsByTagName(if (extension == "png") "pHYs" else "app0JFIF").item(0)
                        if (extension == "png") {
                            assertEquals("11811", node.attributes.getNamedItem("pixelsPerUnitXAxis").nodeValue)
                            assertEquals("11811", node.attributes.getNamedItem("pixelsPerUnitYAxis").nodeValue)
                            assertEquals("meter", node.attributes.getNamedItem("unitSpecifier").nodeValue)
                        } else {
                            assertEquals("1", node.attributes.getNamedItem("resUnits").nodeValue)
                            assertEquals("300", node.attributes.getNamedItem("Xdensity").nodeValue)
                            assertEquals("300", node.attributes.getNamedItem("Ydensity").nodeValue)
                        }
                    } finally { reader.dispose() }
                }
            }
        } finally { dir.toFile().deleteRecursively() }
    }
}
