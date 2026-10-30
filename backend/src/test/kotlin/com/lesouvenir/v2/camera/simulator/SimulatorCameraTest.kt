package com.lesouvenir.v2.camera.simulator

import com.lesouvenir.v2.foundation.SimulatorAuthorization
import java.nio.file.Files
import java.nio.file.Path
import java.security.MessageDigest
import javax.imageio.ImageIO
import kotlin.test.*

class SimulatorCameraTest {
    private val workspace = Path.of("").toAbsolutePath().let { if (it.fileName.toString() == "backend") it.parent else it }

    @Test fun authorizationAndCapture() {
        assertFailsWith<IllegalStateException> { SimulatorCamera(SimulatorAuthorization(), workspace, 2) }
        assertFailsWith<IllegalArgumentException> { SimulatorCamera(SimulatorAuthorization(true), workspace, 0) }
        assertFailsWith<IllegalArgumentException> { SimulatorCamera(SimulatorAuthorization(true), workspace, SimulatorCamera.MAX_FIXTURE_SOURCES + 1) }
        SimulatorCamera(SimulatorAuthorization(true), workspace, SimulatorCamera.MAX_FIXTURE_SOURCES)
        val dir = Files.createTempDirectory(workspace, "simulator-test-")
        try {
            val camera = SimulatorCamera(SimulatorAuthorization(true), workspace, 3, 800, 600, 100, 100)
            camera.publishPreview(2)
            val preview = assertNotNull(camera.latestPreview())
            assertTrue(SimulatorCamera.MAX_PREVIEW_BYTES <= 384 * 1024)
            assertTrue(preview.jpeg.size <= 384 * 1024)
            assertEquals("synthetic-2", preview.sourceId)
            val decodedPreview = assertNotNull(ImageIO.read(preview.jpeg.inputStream()))
            assertTrue(decodedPreview.width <= 100 && decodedPreview.height <= 100)
            preview.jpeg.fill(0)
            assertNotNull(ImageIO.read(assertNotNull(camera.latestPreview()).jpeg.inputStream()))
            val first = camera.capture(2, dir, "shot-1")
            val bytes = Files.readAllBytes(first.original)
            val image = assertNotNull(ImageIO.read(bytes.inputStream()))
            assertEquals(800, image.width)
            assertEquals(600, image.height)
            val hash = MessageDigest.getInstance("SHA-256").digest(bytes)
            camera.publishPreview(0)
            assertEquals(0, assertNotNull(camera.latestPreview()).sourceIndex)
            val second = camera.capture(2, dir, "shot-2")
            assertContentEquals(bytes, Files.readAllBytes(second.original))
            assertContentEquals(hash, MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(second.original)))
            assertFails { camera.capture(1, dir, "shot-1") }
            assertContentEquals(bytes, Files.readAllBytes(first.original))
            assertFails { camera.capture(0, dir, "../bad") }
            assertFails { camera.capture(3, dir, "bad") }
            assertFails { camera.capture(0, workspace.parent, "outside") }
        } finally {
            Files.newDirectoryStream(dir).use { entries -> entries.forEach { Files.deleteIfExists(it) } }
            Files.deleteIfExists(dir)
        }
    }
}
