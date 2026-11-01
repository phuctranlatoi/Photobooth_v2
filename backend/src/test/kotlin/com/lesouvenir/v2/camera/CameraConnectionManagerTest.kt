package com.lesouvenir.v2.camera

import com.lesouvenir.v2.camera.demo.DemoCameraAdapter
import com.lesouvenir.v2.camera.real.CameraController
import com.lesouvenir.v2.camera.real.CameraDescriptor
import com.lesouvenir.v2.camera.real.CameraMode
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CameraConnectionManagerTest {
    private class FakeController(var connected: Boolean) : CameraController {
        var previewCalls = 0; var stopCalls = 0; var captures = 0; var closes = 0
        override fun getAvailableCameras(): List<CameraDescriptor> = emptyList()
        override fun setMode(mode: CameraMode) = Unit
        override fun isHardwareConnected() = connected
        override fun startLiveView(onFrame: (String) -> Unit) { previewCalls++ }
        override fun stopLiveView() { stopCalls++ }
        override fun capturePhoto(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path { captures++; return outputDir.resolve("real.jpg") }
        override fun close() { closes++ }
    }

    @Test fun choosesModeFromHardwareStatus() {
        CameraConnectionManager(FakeController(false), startMonitor = false).use { manager ->
            assertFalse(manager.isHardwareConnected()); assertEquals("DEMO", manager.resolveCaptureMode())
        }
        CameraConnectionManager(FakeController(true), startMonitor = false).use { manager ->
            assertTrue(manager.isHardwareConnected()); assertEquals("REAL", manager.resolveCaptureMode())
        }
    }

    @Test fun demoPreviewAndCaptureDispatchToMock() {
        val root = Files.createTempDirectory("camera-connection-")
        val controller = FakeController(false)
        val adapter = DemoCameraAdapter()
        try {
            CameraConnectionManager(controller, adapter, startMonitor = false).use { manager ->
                manager.startLiveView("DEMO") {}
                val captured = manager.capture("DEMO", root, 0, 1f)
                assertTrue(Files.exists(captured)); assertEquals(0, controller.previewCalls); assertEquals(0, controller.captures)
            }
        } finally { Files.walk(root).use { it.sorted(Comparator.reverseOrder()).forEach(Files::deleteIfExists) } }
    }

    @Test fun statusHasExpectedKeysAndCloseDisposesController() {
        val controller = FakeController(false)
        val manager = CameraConnectionManager(controller, startMonitor = false)
        val status = manager.getStatus()
        assertTrue(status.keys.containsAll(setOf("connected", "state", "lastError", "lastSeenTimestamp", "consecutiveNullFrames")))
        manager.close()
        assertEquals(1, controller.closes)
    }
}
