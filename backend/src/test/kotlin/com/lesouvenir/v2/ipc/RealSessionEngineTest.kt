package com.lesouvenir.v2.ipc

import com.google.gson.JsonObject
import com.lesouvenir.v2.camera.real.*
import com.lesouvenir.v2.catalog.FirebaseCatalogService
import com.lesouvenir.v2.data.SqliteSalesRepository
import com.lesouvenir.v2.foundation.PricingCalculator
import com.lesouvenir.v2.printing.legacy.PrinterDiscovery
import com.lesouvenir.v2.printing.legacy.PrinterManager
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Path
import java.nio.file.Files
import java.awt.image.BufferedImage
import javax.imageio.ImageIO
import java.util.UUID
import kotlin.test.*

class RealSessionEngineTest {
    @TempDir lateinit var workspace: Path
    private fun offlineCatalog(root: Path) = FirebaseCatalogService(root,
        remote = { emptyList() }, localAppData = null, credentialOverride = null)
    @Test fun malformedLocalLayoutOverridesDoNotPreventOfflineIpcBootstrap() {
        val root = workspace.resolve("PhotoboothDesktop_v2")
        val config = root.resolve("backend/config")
        Files.createDirectories(config)
        Files.copy(Path.of("config/production-layouts.json"), config.resolve("production-layouts.json"))
        Files.writeString(config.resolve("local-operator-layouts.json"), """[{"layoutId":"removed-layout","shotCount":2,"selectCount":1,"countdownSeconds":1}]""")
        RealSessionEngine(root, OfflineCamera(), PrinterManager(discovery = PrinterDiscovery { emptyList() }),
            SqliteSalesRepository(root), firebaseCatalog = offlineCatalog(root)).use { engine ->
            assertEquals("REAL", engine.dispatch("device.getStatus", JsonObject())["runtimeMode"].asString)
            assertEquals("IDLE", engine.dispatch("operator.getStatus", JsonObject())["state"].asString)
            assertTrue(engine.dispatch("catalog.get", JsonObject())["layouts"].asJsonArray.size() > 0)
        }
        assertTrue(Files.readString(config.resolve("local-operator-layouts.json")).contains("removed-layout"))
    }
    private class OfflineCamera : CameraController {
        override fun getAvailableCameras() = emptyList<CameraDescriptor>()
        override fun setMode(mode: CameraMode) = error("Offline")
        override fun isHardwareConnected() = false
        override fun startLiveView(onFrame: (String) -> Unit) = error("Offline")
        override fun stopLiveView() {}
        override fun capturePhoto(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path = error("Offline")
        override fun close() {}
    }
    @Test fun realCatalogPricingAndOperatorStatusExposeActualMode() {
        session(StubCamera()).use { engine ->
            val catalog = engine.dispatch("catalog.get", JsonObject())
            assertFalse(catalog["simulator"].asBoolean)
            assertEquals(catalog["layouts"].asJsonArray.first().asJsonObject["id"].asString,
                catalog["defaultLayoutId"].asString)
            val pricing = catalog["pricing"].asJsonObject
            assertEquals(70000, pricing["stripBasePrice"].asInt)
            assertEquals(20000, pricing["stripUnitPrice"].asInt)
            assertEquals(70000, pricing["printBasePrice"].asInt)
            assertEquals(30000, pricing["printUnitPrice"].asInt)
            assertEquals(PricingCalculator.allowedOptions("5x15"), pricing["stripAllowedQuantities"].asJsonArray.map { it.asInt })
            assertEquals(PricingCalculator.allowedOptions("10x15"), pricing["printAllowedQuantities"].asJsonArray.map { it.asInt })

            val status = engine.dispatch("operator.getStatus", JsonObject())
            assertEquals("LOCAL_DEVELOPMENT_ONLY", status["accessMode"].asString)
            assertFalse(status["productionAdminAcl"].asBoolean)
            assertEquals("IDLE", status["state"].asString)
            assertTrue(status["canEditLayouts"].asBoolean)
            assertFalse(status["simulator"].asBoolean)
            assertFalse(status["pricingEditable"].asBoolean)
            assertEquals(catalog["layouts"], status["layouts"])
            val capabilities = status["capabilities"].asJsonObject
            assertFalse(capabilities["simulatorStudio"].asBoolean)
            assertTrue(capabilities["simulatorLayoutSettings"].asBoolean)
            assertTrue(capabilities["nativeCamera"].asBoolean)
            assertFalse(capabilities["nativePrint"].asBoolean)
            assertTrue(capabilities["beauty"].asBoolean)
            assertTrue(capabilities["effects"].asBoolean)
            assertFalse(capabilities["cloudAlbumQr"].asBoolean)
            assertTrue(capabilities["revenue"].asBoolean)
            assertFalse(capabilities["paymentSettings"].asBoolean)
            assertFalse(capabilities["productionAdminAcl"].asBoolean)
            assertEquals(-32602, assertFailsWith<SimulatorError> {
                engine.dispatch("operator.getStatus", JsonObject().apply { addProperty("unexpected", true) })
            }.code)
        }
    }
    @Test fun catalogAndSyncNeverInlineFullResolutionFrames() {
        val frame = workspace.resolve("data/frames/10x15/test/Standard/large.png")
        Files.createDirectories(frame.parent)
        ImageIO.write(BufferedImage(1600, 2400, BufferedImage.TYPE_INT_ARGB), "png", frame.toFile())
        session(StubCamera()).use { engine ->
            for (method in listOf("catalog.get", "catalog.sync")) {
                val response = engine.dispatch(method, JsonObject())
                assertFalse(response.has("frames"))
                assertTrue(response["framesCount"].asInt >= 1)
                assertTrue(response.toString().length < 1_048_576)
            }
        }
    }
    @Test fun offlineHardwareAndMockPaymentFailClosed() {
        val config = workspace.resolve("backend/config")
        java.nio.file.Files.createDirectories(config)
        java.nio.file.Files.copy(Path.of("config/production-layouts.json"), config.resolve("production-layouts.json"))
        val ledger = SqliteSalesRepository(workspace)
        RealSessionEngine(workspace, OfflineCamera(), PrinterManager(discovery = PrinterDiscovery { emptyList() }), ledger,
            firebaseCatalog = offlineCatalog(workspace)).use { engine ->
            val status = engine.dispatch("device.getStatus", JsonObject())
            assertEquals("REAL", status["runtimeMode"].asString)
            assertFalse(status["camera"].asJsonObject["connected"].asBoolean)
            val sid = UUID.randomUUID().toString()
            fun params(vararg fields: Pair<String, String>) = JsonObject().apply {
                addProperty("sessionId", sid); addProperty("commandId", UUID.randomUUID().toString())
                fields.forEach { (k, v) -> addProperty(k, v) }
            }
            val layout = engine.dispatch("catalog.get", JsonObject())["defaultLayoutId"].asString
            engine.dispatch("session.start", params("layoutId" to layout, "captureMode" to "REAL"))
            engine.dispatch("session.confirmSetup", params())
            engine.dispatch("session.setQuantity", params().apply { addProperty("quantity", 2) })
            val pending = engine.dispatch("payment.checkStatus", params())
            assertEquals("PENDING", pending["status"].asString)
            assertFalse(pending["paid"].asBoolean)
            assertTrue(pending["orderCode"] == null || pending["orderCode"].isJsonNull)
            assertFalse(engine.dispatch("session.getState", params())["payOsConfigured"].asBoolean)
            assertEquals(-32001, assertFailsWith<SimulatorError> { engine.dispatch("payment.mockComplete", params()) }.code)
            assertEquals(-32000, assertFailsWith<SimulatorError> { engine.dispatch("payment.mockComplete", params().apply { addProperty("staffOverride", true) }) }.code)
            assertEquals(-32001, assertFailsWith<SimulatorError> { engine.dispatch("print.confirmReal", params()) }.code)
            assertTrue(ledger.getPendingSales().isEmpty())
        }
    }

    private class StubCamera(private val broken: Boolean = false) : CameraController {
        var captures = 0
        var stopped = false
        override fun getAvailableCameras() = emptyList<CameraDescriptor>()
        override fun setMode(mode: CameraMode) {}
        override fun isHardwareConnected() = true
        override fun startLiveView(onFrame: (String) -> Unit) {}
        override fun stopLiveView() { stopped = true }
        override fun capturePhoto(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path {
            if (broken) error("Stub camera failure")
            captures++
            Files.createDirectories(outputDir)
            return outputDir.resolve("camera-$shotIndex.jpg").also {
                check(ImageIO.write(BufferedImage(40, 60, BufferedImage.TYPE_INT_RGB), "jpg", it.toFile()))
            }
        }
        override fun close() {}
    }

    private fun session(camera: StubCamera, countdown: Int = 0): RealSessionEngine {
        val config = workspace.resolve("backend/config")
        Files.createDirectories(config)
        Files.writeString(config.resolve("production-layouts.json"), """{"layouts":[{"id":"test","title":"Test","family":"Grid","shotCount":1,"selectCount":1,"countdownSeconds":$countdown,"gridColumns":1,"printSizeLabel":"10x15"}]}""")
        return RealSessionEngine(workspace, camera, PrinterManager(discovery = PrinterDiscovery { emptyList() }),
            SqliteSalesRepository(workspace), operatorAuthorized = { true }, firebaseCatalog = offlineCatalog(workspace))
    }

    @Test fun omittedGenerationOnQueryUsesSessionIdButExplicitMismatchIsStale() {
        session(StubCamera()).use { engine ->
            val sid = UUID.randomUUID().toString()
            val start = JsonObject().apply {
                addProperty("sessionId", sid)
                addProperty("generationId", UUID.randomUUID().toString())
                addProperty("commandId", UUID.randomUUID().toString())
                addProperty("layoutId", "test")
            }
            engine.dispatch("session.start", start)
            assertEquals(sid, engine.dispatch("session.getState", JsonObject().apply { addProperty("sessionId", sid) })["sessionId"].asString)
            assertEquals(-32004, assertFailsWith<SimulatorError> {
                engine.dispatch("session.getState", JsonObject().apply {
                    addProperty("sessionId", sid)
                    addProperty("generationId", UUID.randomUUID().toString())
                })
            }.code)
        }
    }

    @Test fun timedRealCaptureSelectionAndCompositionUseOriginalWithoutBeauty() {
        val camera = StubCamera()
        session(camera).use { engine ->
            val sid = UUID.randomUUID().toString()
            fun call(method: String, vararg fields: Pair<String, String>) = engine.dispatch(method, JsonObject().apply {
                addProperty("sessionId", sid); addProperty("commandId", UUID.randomUUID().toString())
                fields.forEach { (k, v) -> addProperty(k, v) }
            })
            val layoutId = engine.dispatch("catalog.get", JsonObject())["layouts"].asJsonArray.first().asJsonObject["id"].asString
            call("session.start", "layoutId" to layoutId)
            call("session.confirmSetup")
            engine.dispatch("session.setQuantity", JsonObject().apply {
                addProperty("sessionId", sid); addProperty("commandId", UUID.randomUUID().toString()); addProperty("quantity", 2)
            })
            call("payment.mockComplete", "staffOverride" to "true")
            call("capture.startSequence")
            var snapshot = call("session.getState")
            val deadline = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(5)
            while (snapshot["state"].asString !in setOf("SELECTING_PHOTOS", "RECOVERY") && System.nanoTime() < deadline) {
                Thread.sleep(10); snapshot = call("session.getState")
            }
            assertEquals("SELECTING_PHOTOS", snapshot["state"].asString)
            assertEquals(1, camera.captures)
            assertTrue(camera.stopped)
            assertTrue(Files.isRegularFile(workspace.resolve("backend/build/real-sessions/$sid/original-shot-0.jpg")))
            assertEquals(-32001, assertFailsWith<SimulatorError> { call("selection.confirm") }.code)
            engine.dispatch("selection.toggle", JsonObject().apply {
                addProperty("sessionId", sid); addProperty("commandId", UUID.randomUUID().toString()); addProperty("shotIndex", 0)
            })
            call("selection.confirm")
            assertEquals("default", call("frame.list")["frames"].asJsonArray[0].asJsonObject["id"].asString)
            val selectedFrame = call("frame.select", "frameId" to "default")
            assertEquals("default", selectedFrame["frameId"].asString)
            assertTrue(selectedFrame["compositionDataUrl"]?.isJsonNull != false)
            assertTrue(selectedFrame["printImagePath"]?.isJsonNull != false)
            val confirmedFrame = call("frame.confirm")
            assertEquals("PRINT_PENDING", confirmedFrame["state"].asString)
            assertFalse(confirmedFrame["compositionDataUrl"].isJsonNull)
            assertFalse(confirmedFrame["printImagePath"].isJsonNull)
            val files = Files.list(workspace.resolve("backend/build/real-sessions/$sid")).use { it.map { p -> p.fileName.toString() }.toList() }
            assertTrue(files.any { it.startsWith("print_") && it.endsWith(".png") })
            assertEquals(1, camera.captures)
        }
    }

    @Test fun failedCaptureNeverSubstitutesFakeImage() {
        val camera = StubCamera(broken = true)
        session(camera).use { engine ->
            val sid = UUID.randomUUID().toString()
            fun call(method: String, vararg fields: Pair<String, String>) = engine.dispatch(method, JsonObject().apply {
                addProperty("sessionId", sid); addProperty("commandId", UUID.randomUUID().toString())
                fields.forEach { (k, v) -> addProperty(k, v) }
            })
            val layoutId = engine.dispatch("catalog.get", JsonObject())["layouts"].asJsonArray.first().asJsonObject["id"].asString
            call("session.start", "layoutId" to layoutId); call("session.confirmSetup")
            engine.dispatch("session.setQuantity", JsonObject().apply {
                addProperty("sessionId", sid); addProperty("commandId", UUID.randomUUID().toString()); addProperty("quantity", 2)
            })
            call("payment.mockComplete", "staffOverride" to "true"); call("capture.startSequence")
            var snapshot = call("session.getState")
            val deadline = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(5)
            while (snapshot["state"].asString != "RECOVERY" && System.nanoTime() < deadline) {
                Thread.sleep(10); snapshot = call("session.getState")
            }
            assertEquals("RECOVERY", snapshot["state"].asString)
            assertEquals(0, snapshot["capturedCount"].asInt)
            assertTrue(snapshot["failure"].asString.startsWith("Camera capture failed:"))
        }
    }
}
