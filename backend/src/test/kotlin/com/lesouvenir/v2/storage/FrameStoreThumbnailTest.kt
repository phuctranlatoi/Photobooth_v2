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
        assertEquals(380 to 253, decoded().let { it.width to it.height })
        Files.delete(thumbnail)
        assertEquals(380 to 253, decoded().let { it.width to it.height })
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
        assertEquals(295 to 380, coverImage.width to coverImage.height)
    }

    @Test fun discoversCanonicalCompactAndDirectFrames() {
        val store=FrameStore(workspace,null)
        for (relative in listOf("5x15/strip-5x15/Standard/first.png","5x15/5154003.png","10154012.png")) {
            val path=workspace.resolve("data/frames/$relative"); Files.createDirectories(path.parent)
            ImageIO.write(BufferedImage(600,1800,BufferedImage.TYPE_INT_ARGB),"png",path.toFile())
        }
        assertEquals(1,store.loadFrames("strip-5x15").size)
        assertEquals(0,store.loadFrames("print-10x15").size)
        assertEquals(1,store.loadFrames("5x15").size)
    }

    @Test fun layoutFoldersDoNotMixFramesFromOtherLayoutsWithSamePaperSize() {
        for (relative in listOf(
            "5x15/strip-5x15/Standard/strip.png",
            "10x15/print-10x15/Standard/landscape.png"
        )) {
            val path = workspace.resolve("data/frames/$relative")
            Files.createDirectories(path.parent)
            ImageIO.write(BufferedImage(8, 8, BufferedImage.TYPE_INT_ARGB), "png", path.toFile())
        }
        val store = FrameStore(workspace, null)
        assertEquals(emptyList(), store.loadFrames("515_4_anh"))
        for (id in listOf("1015_4_base", "1015_4_ILCL")) {
            assertEquals(emptyList(), store.loadFrames(id))
        }
        assertEquals(emptyList(), store.loadFrames("unknown", "5 x 15 cm"))
        assertEquals(listOf("5x15"), store.loadFrames(printSize = "5 x 15 cm").map { it.targetPrintSize })
        assertEquals(listOf("10x15"), store.loadFrames(printSize = "10 x 15 cm").map { it.targetPrintSize })
        assertEquals(emptyList(), store.loadFrames("unknown", "unknown"))
    }

    @Test fun readsLegacyNamedLayoutsAndEventCoversFromPrettyBoothWithoutWritingThere() {
        val local = workspace.resolve("fake-local-app-data")
        val legacy = local.resolve("PrettyBoothDesktop/data")
        val strip = legacy.resolve("frames/5x15_4_anh_wed/5154wed/Standard/strip.png")
        val event = legacy.resolve("frames/10x15_4_anh_SP_BTS/BTS_1015_4_SP/Special/BTS/event.png")
        val cover = legacy.resolve("covers/10x15_4_anh_SP_BTS/BTS_1015_4_SP/Special/BTS/cover.png")
        val alternate = local.resolve("PrettyBoothDesktop/frames/15x10_1_anh_VP/1510_1_VP/Standard/alt.png")
        val other = local.resolve("LeSouvenirDesktop/data/frames/5x15_4_anh/TNN001/Standard/other.png")
        val store = FrameStore(workspace, local.toString())
        for (path in listOf(strip, event, cover, alternate, other)) {
            Files.createDirectories(path.parent)
            ImageIO.write(BufferedImage(8, 8, BufferedImage.TYPE_INT_ARGB), "png", path.toFile())
        }
        store.invalidate()
        assertEquals(setOf(strip), store.loadFrames("5154wed").map { it.customImagePath }.toSet())
        assertEquals(setOf(other), store.loadFrames("TNN001").map { it.customImagePath }.toSet())
        assertEquals(setOf(event), store.loadFrames("BTS_1015_4_SP").map { it.customImagePath }.toSet())
        assertEquals(setOf(alternate), store.loadFrames("1510_1_VP").map { it.customImagePath }.toSet())
        assertEquals(emptyList(), store.loadFrames("strip-5x15"))
        val bundle = store.loadBundles().single()
        assertEquals(event, bundle.frames.single().customImagePath)
        assertNotNull(bundle.coverDataUrl)
    }
}
