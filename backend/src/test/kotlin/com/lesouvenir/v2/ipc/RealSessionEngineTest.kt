package com.lesouvenir.v2.ipc

import com.google.gson.JsonObject
import com.lesouvenir.v2.camera.real.*
import com.lesouvenir.v2.data.SqliteSalesRepository
import com.lesouvenir.v2.printing.legacy.PrinterDiscovery
import com.lesouvenir.v2.printing.legacy.PrinterManager
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Path
import java.util.UUID
import kotlin.test.*

class RealSessionEngineTest {
    @TempDir lateinit var workspace: Path
    private class OfflineCamera : CameraController {
        override fun getAvailableCameras() = emptyList<CameraDescriptor>()
        override fun setMode(mode: CameraMode) = error("Offline")
        override fun isHardwareConnected() = false
        override fun startLiveView(onFrame: (String) -> Unit) = error("Offline")
        override fun stopLiveView() {}
        override fun capturePhoto(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path = error("Offline")
        override fun close() {}
    }
    @Test fun offlineHardwareAndMockPaymentFailClosed() {
        val config = workspace.resolve("backend/config")
        java.nio.file.Files.createDirectories(config)
        java.nio.file.Files.copy(Path.of("config/simulator-layouts.json"), config.resolve("simulator-layouts.json"))
        val ledger = SqliteSalesRepository(workspace)
        RealSessionEngine(workspace, OfflineCamera(), PrinterManager(discovery = PrinterDiscovery { emptyList() }), ledger).use { engine ->
            val status = engine.dispatch("device.getStatus", JsonObject())
            assertEquals("REAL", status["runtimeMode"].asString)
            assertFalse(status["camera"].asJsonObject["connected"].asBoolean)
            val sid = UUID.randomUUID().toString()
            fun params(vararg fields: Pair<String, String>) = JsonObject().apply {
                addProperty("sessionId", sid); addProperty("commandId", UUID.randomUUID().toString())
                fields.forEach { (k, v) -> addProperty(k, v) }
            }
            val layout = engine.dispatch("catalog.get", JsonObject())["defaultLayoutId"].asString
            engine.dispatch("session.start", params("layoutId" to layout))
            engine.dispatch("session.confirmSetup", params())
            engine.dispatch("session.setQuantity", params().apply { addProperty("quantity", 2) })
            assertEquals(-32001, assertFailsWith<SimulatorError> { engine.dispatch("payment.mockComplete", params()) }.code)
            assertEquals(-32001, assertFailsWith<SimulatorError> { engine.dispatch("payment.mockComplete", params().apply { addProperty("staffOverride", true) }) }.code)
            assertEquals(-32001, assertFailsWith<SimulatorError> { engine.dispatch("print.confirmReal", params()) }.code)
            assertTrue(ledger.getPendingSales().isEmpty())
        }
    }
}
