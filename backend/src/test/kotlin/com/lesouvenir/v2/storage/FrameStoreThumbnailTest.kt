package com.lesouvenir.v2.storage

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.awt.image.BufferedImage
import java.nio.file.Files
import java.nio.file.Path
import javax.imageio.ImageIO
import kotlin.test.*

class FrameStoreThumbnailTest {
    @TempDir lateinit var workspace: Path

    @Test fun catalogIndexesOriginalsButUsesBoundedThumbnails() {
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
        assertTrue(store.frameThumbDataUrl(original)!!.length < 25_000)
        Files.delete(thumbnail)
        assertTrue(store.frameThumbDataUrl(original)!!.length < 25_000)
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
        assertTrue(bundle.coverDataUrl!!.length < 25_000)
    }
}
