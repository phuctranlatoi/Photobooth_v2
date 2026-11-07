package com.lesouvenir.v2.camera.real

import com.lesouvenir.v2.camera.legacy.HardwareAuthorization
import java.awt.Color
import java.awt.image.BufferedImage
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.imageio.ImageIO
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class CameraPipelineTest {
    private val workspace = Path.of("").toAbsolutePath().normalize()

    @Test fun managerRequiresAuthorizationBeforeDiscoveryOrCapture() {
        var discoveries = 0
        CameraManager(HardwareAuthorization()) { discoveries++; emptyList() }.use { manager ->
            assertFailsWith<IllegalStateException> { manager.getAvailableCameras() }
            assertFailsWith<IllegalStateException> { manager.setMode(CameraMode.HOT_FOLDER) }
            assertFailsWith<IllegalStateException> { manager.startLiveView {} }
            assertFailsWith<IllegalStateException> { manager.capturePhoto(workspace, 0, 1f) }
            assertEquals(0, discoveries)
        }
    }

    @Test fun managerNeverInventsCaptureWhenNoCameraIsConnected() {
        CameraManager(HardwareAuthorization(true)) { emptyList() }.use { manager ->
            assertTrue(manager.getAvailableCameras().isEmpty())
            assertFailsWith<IllegalStateException> { manager.setMode(CameraMode.CANON_DSLR) }
            assertFalse(manager.isHardwareConnected())
            assertFailsWith<IllegalStateException> { manager.capturePhoto(workspace, 0, 1f) }
        }
    }

    @Test fun managerDiscoversCanonBeforeWebcamWithoutExplicitModeSelection() {
        val canon = StubCameraDevice(true)
        var webcamDiscoveries = 0
        CameraManager(HardwareAuthorization(true)) { mode ->
            when (mode) {
                CameraMode.CANON_DSLR -> listOf(canon)
                CameraMode.WEBCAM -> { webcamDiscoveries++; listOf(StubCameraDevice(true)) }
                CameraMode.HOT_FOLDER -> emptyList()
            }
        }.use { manager ->
            assertTrue(manager.isHardwareConnected())
            assertTrue(manager.isHardwareConnected())
            assertEquals(0, webcamDiscoveries)
        }
        assertTrue(canon.closed)
    }

    @Test fun managerFallsBackToWebcamWhenCanonIsUnavailable() {
        val webcam = StubCameraDevice(true)
        CameraManager(HardwareAuthorization(true)) { mode ->
            when (mode) {
                CameraMode.CANON_DSLR -> listOf(StubCameraDevice(false))
                CameraMode.WEBCAM -> listOf(webcam)
                CameraMode.HOT_FOLDER -> emptyList()
            }
        }.use { manager -> assertTrue(manager.isHardwareConnected()) }
        assertTrue(webcam.closed)
    }

    @Test fun hotFolderDeniesCaptureAndDoesNotGenerateSyntheticFiles() {
        val root = Files.createTempDirectory(workspace, "camera-denied-")
        try {
            val output = root.resolve("output")
            HotFolderCameraAdapter(HardwareAuthorization(), root, 300).use { adapter ->
                assertFailsWith<IllegalStateException> { adapter.capture(output, 0, 1f) }
                assertFalse(Files.exists(output))
            }
            HotFolderCameraAdapter(HardwareAuthorization(true), root, 250).use { adapter ->
                assertFailsWith<IllegalStateException> { adapter.capture(output, 0, 1f) }
                assertFalse(Files.exists(output))
            }
        } finally { Files.deleteIfExists(root) }
    }

    @Test fun hotFolderPicksUpOnlyNewReadyJpegAndKeepsSource() {
        val root = Files.createTempDirectory(workspace, "camera-pickup-")
        val executor = Executors.newSingleThreadExecutor()
        try {
            val input = Files.createDirectory(root.resolve("input"))
            val output = root.resolve("output")
            val stale = input.resolve("old.jpg")
            writeJpeg(stale)
            HotFolderCameraAdapter(HardwareAuthorization(true), input, 5_000).use { adapter ->
                val result = executor.submit<Path> { adapter.capture(output, 1, 1f) }
                Thread.sleep(350) // Capture has taken its input snapshot before the new file arrives.
                val fresh = input.resolve("new.jpg")
                writeJpeg(fresh)
                val target = result.get(5, TimeUnit.SECONDS)
                assertEquals(output.resolve("original-shot-1.jpg"), target)
                assertEquals(12, assertNotNull(ImageIO.read(target.toFile())).width)
                assertTrue(Files.exists(stale))
                assertTrue(Files.exists(fresh))
            }
        } finally {
            executor.shutdownNow()
            Files.walk(root).use { paths -> paths.sorted(Comparator.reverseOrder()).forEach(Files::deleteIfExists) }
        }
    }

    @Test fun canonFailsClosedWithoutAuthorizationOrConnection() {
        CanonCameraAdapter(HardwareAuthorization(), autoReconnect = false).use { adapter ->
            assertFalse(adapter.isConnected())
            assertFailsWith<IllegalStateException> { adapter.startPreview {} }
            assertFailsWith<IllegalStateException> { adapter.capture(workspace, 0, 1f) }
        }
        CanonCameraAdapter(HardwareAuthorization(true), autoReconnect = false).use { adapter ->
            assertFalse(adapter.isConnected())
            assertFailsWith<IllegalStateException> { adapter.startPreview {} }
            assertFailsWith<IllegalStateException> { adapter.capture(workspace, 0, 1f) }
        }
        assertFalse(Files.exists(workspace.resolve("original-shot-0.jpg")))
    }

    private fun writeJpeg(path: Path) {
        val image = BufferedImage(12, 12, BufferedImage.TYPE_INT_RGB)
        val graphics = image.createGraphics()
        try { graphics.color = Color.RED; graphics.fillRect(0, 0, 12, 12) } finally { graphics.dispose() }
        assertTrue(ImageIO.write(image, "jpg", path.toFile()))
    }

    private class StubCameraDevice(private val connected: Boolean) : CameraDevice {
        var closed = false
        override fun isConnected() = connected
        override fun startPreview(onFrame: (ByteArray) -> Unit) = Unit
        override fun stopPreview() = Unit
        override fun capture(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path = error("Not used")
        override fun close() { closed = true }
    }
}
