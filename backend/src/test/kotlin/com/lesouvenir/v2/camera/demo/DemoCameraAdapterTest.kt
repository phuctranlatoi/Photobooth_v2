package com.lesouvenir.v2.camera.demo

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Files
import java.nio.file.Path
import javax.imageio.ImageIO
import kotlin.test.*

class DemoCameraAdapterTest {
    @TempDir lateinit var root: Path
    @Test fun distinctJpegCapturesRespectAspectRatio() {
        DemoCameraAdapter().use { camera ->
            val images = (0..3).map { i -> camera.capture(root, i, 1.5f) }
            assertEquals(4, images.map { Files.readAllBytes(it).contentHashCode() }.toSet().size)
            images.forEach { path ->
                val image = ImageIO.read(path.toFile())
                assertEquals(2400, image.width)
                assertEquals(1600, image.height)
            }
        }
    }
}
