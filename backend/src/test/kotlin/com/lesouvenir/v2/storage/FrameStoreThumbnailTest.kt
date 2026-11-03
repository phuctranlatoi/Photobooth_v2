package com.lesouvenir.v2.storage

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.awt.image.BufferedImage
import java.nio.file.Files
import java.nio.file.Path
import java.util.Base64
import java.io.ByteArrayInputStream
import javax.imageio.ImageIO
import kotlin.test.*

class FrameStoreThumbnailTest {
    @TempDir lateinit var workspace: Path

    @Test fun catalogIndexesOriginalsAndProducesHighResolutionTransparentThumbnails() {
        val root = workspace.resolve("data/frames/10x15/test/Standard")
        Files.createDirectories(root)
        val original = root.resolve("sample.png")
        val thumbnail = root.resolve("thumb_sample.png")
        val image = BufferedImage(1200, 800, BufferedImage.TYPE_INT_ARGB)
        for (x in 0 until image.width) for (y in 0 until image.height) image.setRGB(x, y, (x * 101 + y * 37) or (0xff shl 24))
        ImageIO.write(image, "png", original.toFile())
        ImageIO.write(BufferedImage(32, 32, BufferedImage.TYPE_INT_ARGB), "png", thumbnail.toFile())
        val store = FrameStore(workspace, null)
        assertEquals(listOf(original), store.loadFrames().map { it.customImagePath })
        fun decoded() = ImageIO.read(ByteArrayInputStream(Base64.getDecoder().decode(store.frameThumbDataUrl(original)!!.substringAfter(','))))
        assertEquals(960 to 640, decoded().let { it.width to it.height })
        Files.delete(thumbnail)
        assertEquals(960 to 640, decoded().let { it.width to it.height })
        assertEquals(1200 to 800, store.imageSize(original))
    }

    @Test fun bundleCoverIsSmallAndKeepsOriginalFramePath() {
        val frame = workspace.resolve("data/frames/10x15/test/Special/Event/one.png")
        val cover = workspace.resolve("data/covers/10x15/test/Special/Event/cover.png")
        Files.createDirectories(frame.parent); Files.createDirectories(cover.parent)
        val image = BufferedImage(700, 900, BufferedImage.TYPE_INT_ARGB)
        ImageIO.write(image, "png", frame.toFile()); ImageIO.write(image, "png", cover.toFile())
        val bundle = FrameStore(workspace, null).loadBundles().single()
        assertEquals(frame, bundle.frames.single().customImagePath)
        val coverImage = ImageIO.read(ByteArrayInputStream(Base64.getDecoder().decode(bundle.coverDataUrl!!.substringAfter(','))))
        assertEquals(700 to 900, coverImage.width to coverImage.height)
    }

    @Test fun discoversCanonicalCompactAndDirectFrames() {
        val store=FrameStore(workspace,null)
        for (relative in listOf("5x15/strip-5x15/Standard/first.png","5x15/5154003.png","10154012.png")) {
            val path=workspace.resolve("data/frames/$relative"); Files.createDirectories(path.parent)
            ImageIO.write(BufferedImage(600,1800,BufferedImage.TYPE_INT_ARGB),"png",path.toFile())
        }
        assertEquals(2,store.loadFrames("strip-5x15").size)
        assertEquals(1,store.loadFrames("print-10x15").size)
    }

    @Test fun catalogIdsAndSizeLabelsFindCompatibleFramesWithoutMixingPaperSizes() {
        for (relative in listOf(
            "5x15/strip-5x15/Standard/strip.png",
            "10x15/print-10x15/Standard/landscape.png"
        )) {
            val path = workspace.resolve("data/frames/$relative")
            Files.createDirectories(path.parent)
            ImageIO.write(BufferedImage(8, 8, BufferedImage.TYPE_INT_ARGB), "png", path.toFile())
        }
        val store = FrameStore(workspace, null)
        assertEquals(listOf("5x15"), store.loadFrames("515_4_anh").map { it.targetPrintSize })
        for (id in listOf("1015_4_base", "1015_4_ILCL")) {
            assertEquals(listOf("10x15"), store.loadFrames(id).map { it.targetPrintSize })
        }
        assertEquals(listOf("5x15"), store.loadFrames("unknown", "5 x 15 cm").map { it.targetPrintSize })
        assertEquals(listOf("10x15"), store.loadFrames("unknown", "10 x 15 cm").map { it.targetPrintSize })
        assertEquals(emptyList(), store.loadFrames("unknown", "unknown"))
    }
}
