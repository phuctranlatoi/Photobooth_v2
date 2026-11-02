package com.lesouvenir.v2.imaging

import java.awt.image.BufferedImage
import java.nio.file.Path
import javax.imageio.ImageIO
import javax.imageio.metadata.IIOMetadataNode
import javax.imageio.stream.ImageOutputStream

/** Encode native 300 DPI density, not just 300 DPI-sized pixel dimensions. */
object PrintImageWriter {
    fun write(image: BufferedImage, path: Path) {
        val extension = path.fileName.toString().substringAfterLast('.', "").lowercase()
        require(extension in setOf("png", "jpg", "jpeg")) { "Expected PNG or JPEG output" }
        val format = if (extension == "png") "png" else "jpeg"
        val writer = ImageIO.getImageWritersByFormatName(format).asSequence().firstOrNull()
            ?: error("No $format image writer available")
        try {
            val metadata = writer.getDefaultImageMetadata(javax.imageio.ImageTypeSpecifier.createFromRenderedImage(image), writer.defaultWriteParam)
            val treeName = if (format == "png") "javax_imageio_png_1.0" else "javax_imageio_jpeg_image_1.0"
            val root = metadata.getAsTree(treeName) as IIOMetadataNode
            if (format == "png") {
                val phys = (0 until root.length).map { root.item(it) }.firstOrNull { it.nodeName == "pHYs" } as? IIOMetadataNode
                    ?: IIOMetadataNode("pHYs").also { root.appendChild(it) }
                phys.setAttribute("pixelsPerUnitXAxis", "11811")
                phys.setAttribute("pixelsPerUnitYAxis", "11811")
                phys.setAttribute("unitSpecifier", "meter")
            } else {
                val jfif = (root.getElementsByTagName("app0JFIF").item(0) as? IIOMetadataNode)
                    ?: error("JPEG writer does not support JFIF density")
                jfif.setAttribute("resUnits", "1")
                jfif.setAttribute("Xdensity", "300")
                jfif.setAttribute("Ydensity", "300")
            }
            metadata.setFromTree(treeName, root)
            ImageIO.createImageOutputStream(path.toFile()).use { stream: ImageOutputStream ->
                writer.output = stream
                writer.write(null, javax.imageio.IIOImage(image, null, metadata), writer.defaultWriteParam)
            }
        } finally { writer.dispose() }
    }
}
