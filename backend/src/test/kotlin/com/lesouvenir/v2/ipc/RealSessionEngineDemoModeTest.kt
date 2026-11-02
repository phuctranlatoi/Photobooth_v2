package com.lesouvenir.v2.ipc

import com.google.gson.JsonObject
import com.lesouvenir.v2.camera.real.*
import com.lesouvenir.v2.catalog.FirebaseCatalogService
import com.lesouvenir.v2.data.SqliteSalesRepository
import com.lesouvenir.v2.foundation.PricingCalculator
import com.lesouvenir.v2.printing.legacy.PrinterManager
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.awt.image.BufferedImage
import java.nio.file.Files
import java.nio.file.Path
import java.util.UUID
import javax.imageio.ImageIO
import kotlin.test.*

class RealSessionEngineDemoModeTest {
    @TempDir lateinit var root: Path
    @Test fun demoPrintNeverCreatesSale() {
        val config = root.resolve("backend/config")
        Files.createDirectories(config)
        Files.writeString(config.resolve("production-layouts.json"),
            """{"layouts":[{"id":"demo","title":"Demo","family":"Column","shotCount":2,"selectCount":1,"countdownSeconds":0,"printSizeLabel":"5x15","gridColumns":1}]}""")
        val frames = root.resolve("data/frames/5x15/demo/Standard")
        Files.createDirectories(frames)
        ImageIO.write(BufferedImage(592, 1790, BufferedImage.TYPE_INT_ARGB), "png", frames.resolve("simple.png").toFile())
        val ledger = SqliteSalesRepository(root)
        val offline = object : CameraController {
            override fun getAvailableCameras() = emptyList<CameraDescriptor>()
            override fun setMode(mode: CameraMode) = error("offline")
            override fun isHardwareConnected() = false
            override fun startLiveView(onFrame: (String) -> Unit) = error("offline")
            override fun stopLiveView() {}
            override fun capturePhoto(outputDir: Path, shotIndex: Int, aspectRatio: Float): Path = error("offline")
            override fun close() {}
        }
        RealSessionEngine(root, offline, PrinterManager(), ledger,
            firebaseCatalog = FirebaseCatalogService(root, remote = { emptyList() },
                localAppData = null, credentialOverride = null)).use { engine ->
            val sid = UUID.randomUUID().toString()
            val generation = UUID.randomUUID().toString()
            fun call(method: String, configure: JsonObject.() -> Unit = {}): JsonObject = engine.dispatch(method, JsonObject().apply {
                addProperty("sessionId", sid); addProperty("generationId", generation)
                addProperty("commandId", UUID.randomUUID().toString()); configure()
            })
            val layoutId = engine.dispatch("catalog.get", JsonObject())["layouts"].asJsonArray.first().asJsonObject["id"].asString
            assertEquals("DEMO", call("session.start") { addProperty("layoutId", layoutId); addProperty("captureMode", "DEMO") }["captureMode"].asString)
            call("session.confirmSetup")
            call("session.setQuantity") { addProperty("quantity", 2) }
            val payment = call("payment.createLink")
            assertEquals("CONFIG_MISSING", payment["status"].asString)
            assertEquals(PricingCalculator.calculatePrice("5x15", 2).totalAmount, payment["amount"].asLong)
            assertEquals("PAYMENT_PENDING", payment["state"].asString)
            assertFalse(payment["paid"].asBoolean)
            val confirmed = call("payment.mockComplete") { addProperty("staffOverride", true); addProperty("method", "Tiền mặt") }
            assertEquals("LIVE_VIEW", confirmed["state"].asString)
            assertTrue(confirmed["paid"].asBoolean)
            assertEquals("Tiền mặt", confirmed["paymentMethod"].asString)
            assertFalse(confirmed["revenueRecorded"].asBoolean)
            assertNull(ledger.getSale(sid))
            call("capture.startSequence")
            val deadline = System.currentTimeMillis() + 25000
            while (call("session.getState")["state"].asString != "SELECTING_PHOTOS" && System.currentTimeMillis() < deadline) Thread.sleep(100)
            assertEquals("SELECTING_PHOTOS", call("session.getState")["state"].asString)
            assertEquals(90, call("session.getState")["secondsRemaining"].asInt)
            call("selection.toggle") { addProperty("shotIndex", 0) }
            val editing = call("selection.confirm")
            assertEquals(60, editing["secondsRemaining"].asInt)
            assertEquals("EDITING", editing["state"].asString)
            assertFalse(editing["compositionDataUrl"].isJsonNull)
            assertEquals(90, call("session.back")["secondsRemaining"].asInt)
            assertEquals(60, call("selection.confirm")["secondsRemaining"].asInt)
            val frameId = call("frame.list")["frames"].asJsonArray.first().asJsonObject["id"].asString
            assertEquals(frameId, editing["frameId"].asString)
            assertEquals("PRINT_PENDING", call("frame.confirm") { addProperty("frameId", frameId) }["state"].asString)
            val result = call("print.confirmReal")
            assertTrue(result["printAccepted"].asBoolean)
            assertFalse(result["revenueRecorded"].asBoolean)
            assertNull(ledger.getSale(sid))
            assertTrue(ledger.getPendingSales().isEmpty())
        }
    }
}
