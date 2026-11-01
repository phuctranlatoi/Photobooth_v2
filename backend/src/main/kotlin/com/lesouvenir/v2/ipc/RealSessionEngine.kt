package com.lesouvenir.v2.ipc

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.lesouvenir.v2.camera.legacy.HardwareAuthorization
import com.lesouvenir.v2.camera.real.*
import com.lesouvenir.v2.data.*
import com.lesouvenir.v2.data.SaleTransaction
import com.lesouvenir.v2.foundation.LayoutMode
import com.lesouvenir.v2.foundation.PricingCalculator
import com.lesouvenir.v2.imaging.DesktopImageProcessor
import com.lesouvenir.v2.imaging.DesktopCompositor
import com.lesouvenir.v2.imaging.FramePack
import com.lesouvenir.v2.imaging.beauty.DesktopBeautyService
import com.lesouvenir.v2.integrations.*
import com.lesouvenir.v2.printing.legacy.*
import java.nio.file.Files
import java.nio.file.Path
import java.util.UUID

/** Physical operations never substitute simulator assets. External services are opt-in and fail closed. */
class RealSessionEngine(
    private val workspace: Path,
    private val camera: CameraController,
    private val printer: PrinterManager,
    private val ledger: SqliteSalesRepository,
    private val payOs: PayOsClient? = null,
    private val revenue: RevenueClient? = null,
    private val album: WebAlbumClient? = null,
    private val cloudinary: CloudinaryClient? = null,
    private val printerName: String = "",
    private val boothId: String = "",
    private val operatorAuthorized: () -> Boolean = { false },
) : SessionEngine {
    override val mode = RuntimeMode.REAL
    private val gson = Gson()
    private val processor = DesktopImageProcessor().apply { appDataDir = workspace }
    private val beauty = DesktopBeautyService()
    private val compositor = DesktopCompositor()
    private val layouts: List<LayoutMode> = gson.fromJson(
        Files.readString(workspace.resolve("backend/config/simulator-layouts.json")), JsonObject::class.java
    )["layouts"].asJsonArray.map { gson.fromJson(it, LayoutMode::class.java) }
    private var state = "IDLE"
    private var sid = ""
    private var generation = ""
    private var layout = layouts.first()
    private var quantity = 2
    private var paid = false
    private var paymentMethod = "PAYOS"
    private var orderCode: Long? = null
    private var qrCode: String? = null
    private var shots = mutableListOf<Path>()
    private val selected = linkedSetOf<Int>()
    private var frame: FramePack? = null
    private var printImage: Path? = null
    private var composition: Path? = null
    private var albumUrl: String? = null
    private var printAccepted = false
    private var revenueRecorded = false
    private val seen = mutableSetOf<String>()
    private val commands = mutableMapOf<String, Pair<String, JsonObject>>()
    private fun obj(vararg fields: Pair<String, Any?>): JsonObject = gson.toJsonTree(mapOf(*fields)).asJsonObject
    private fun fail(code: Int, message: String): Nothing = throw SimulatorError(code, message)
    private fun requireState(vararg allowed: String) { if (state !in allowed) fail(-32001, "Command not allowed in current state") }
    private fun string(p: JsonObject, key: String): String = p[key]?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }?.asString ?: fail(-32602, "$key required")
    private fun hardwareCamera() { if (!camera.isHardwareConnected()) { state = "RECOVERY"; fail(-32000, "Camera disconnected") } }
    private fun hardwarePrinter(): String {
        val available = printer.getAvailablePrinters()
        if (printerName.isBlank() || printerName !in available) { state = "RECOVERY"; fail(-32000, "Printer disconnected") }
        return printerName
    }
    private fun snapshot() = obj("sessionId" to sid, "generationId" to generation, "state" to state,
        "layout" to layout, "quantity" to quantity, "pricing" to PricingCalculator.calculatePrice(layout.printSizeLabel, quantity),
        "paid" to paid, "totalShots" to layout.shotCount, "capturedCount" to shots.size,
        "selectedCount" to selected.size, "selectedIndices" to selected.toList(), "frameId" to frame?.id,
        "printAccepted" to printAccepted, "revenueRecorded" to revenueRecorded,
        "userConfirmed" to printAccepted, "albumUrl" to albumUrl, "simulator" to false)

    @Synchronized override fun dispatch(method: String, p: JsonObject): JsonObject {
        if (method == "device.getStatus") {
            if (p.size() != 0) fail(-32602, "Invalid params")
            val names = runCatching { printer.getAvailablePrinters() }.getOrDefault(emptyList())
            return obj("runtimeMode" to "REAL", "camera" to mapOf("connected" to camera.isHardwareConnected()),
                "printer" to mapOf("name" to printerName, "detected" to (printerName.isNotBlank() && printerName in names), "availablePrinters" to names),
                "beauty" to mapOf("enabled" to false, "available" to false),
                "ledger" to mapOf("salesDbConnected" to true, "pendingSyncCount" to ledger.getPendingSales().size),
                "cloud" to mapOf("payOsConfigured" to (payOs != null), "cloudinaryConfigured" to (cloudinary != null),
                    "webAlbumConfigured" to (album != null), "revenueEndpointConfigured" to (revenue != null)))
        }
        if (method == "catalog.get") return obj("layouts" to layouts, "defaultLayoutId" to layouts.first().id,
            "simulator" to false)
        if (method !in (SimulatorSessionEngine.schemas.keys + setOf("payment.createLink", "payment.checkStatus", "print.confirmReal"))) fail(-32601, "Method not found")
        val requested = string(p, "sessionId")
        if (runCatching { UUID.fromString(requested) }.getOrNull()?.version() != 4) fail(-32602, "UUID v4 required")
        val gen = p["generationId"]?.asString ?: ""
        if (method != "session.start" && (requested != sid || gen != generation)) fail(-32004, "Stale session or generation")
        if (method == "session.getState") return snapshot()
        if (method == "frame.list") { requireState("EDITING"); return obj("frames" to listOf(mapOf("id" to "default", "name" to "Default"))) }
        if (method == "payment.checkStatus") {
            requireState("PAYMENT_PENDING")
            val code = orderCode ?: fail(-32001, "Create payment link first")
            if (p["orderCode"]?.asLong != code) fail(-32602, "Order code mismatch")
            val status = try { payOs?.status(code) ?: fail(-32003, "PayOS not configured") }
                catch (e: SimulatorError) { throw e } catch (_: Exception) { fail(-32003, "Payment gateway unavailable") }
            if (status == "PAID") { paid = true; state = "PREPARING"; hardwareCamera(); camera.startLiveView { }; state = "LIVE_VIEW" }
            return obj("orderCode" to code, "status" to status, "paid" to paid,
                "amount" to PricingCalculator.calculatePrice(layout.printSizeLabel, quantity).totalAmount,
                "nextState" to state)
        }
        val cid = string(p, "commandId")
        if (runCatching { UUID.fromString(cid) }.getOrNull()?.version() != 4) fail(-32602, "UUID v4 commandId required")
        val key = "$requested:$cid"
        val signature = "$method:${p}"
        commands[key]?.let { if (it.first != signature) fail(-32602, "commandId reused"); return it.second.deepCopy() }
        val result: JsonObject = when (method) {
            "session.start" -> {
                requireState("IDLE")
                if (!seen.add(requested)) fail(-32004, "Session already used")
                layout = layouts.find { it.id == string(p, "layoutId") } ?: fail(-32602, "Unknown layout")
                sid = requested; generation = gen; state = "SELECTING"; snapshot()
            }
            "session.confirmSetup" -> { requireState("SELECTING"); state = "SELECTING_QUANTITY"; snapshot() }
            "session.setLayout" -> { requireState("SELECTING"); layout = layouts.find { it.id == string(p, "layoutId") } ?: fail(-32602, "Unknown layout"); snapshot() }
            "session.setQuantity" -> {
                requireState("SELECTING_QUANTITY"); val n = p["quantity"]?.asInt ?: fail(-32602, "Quantity required")
                if (n !in 2..50) fail(-32602, "Quantity out of range")
                quantity = PricingCalculator.sanitizeQuantity(layout.printSizeLabel, n); state = "PAYMENT_PENDING"; snapshot()
            }
            "payment.createLink" -> {
                requireState("PAYMENT_PENDING")
                val client = payOs ?: fail(-32003, "PayOS not configured")
                val code = orderCode ?: (System.currentTimeMillis() + (sid.hashCode().toLong() and 0xffff)).also { orderCode = it }
                val qr = try { qrCode ?: client.createPaymentLink(code,
                    Math.toIntExact(PricingCalculator.calculatePrice(layout.printSizeLabel, quantity).totalAmount),
                    string(p, "description")).also { qrCode = it } } catch (_: Exception) { fail(-32003, "Payment gateway unavailable") }
                obj("orderCode" to code, "qrCode" to qr, "amount" to PricingCalculator.calculatePrice(layout.printSizeLabel, quantity).totalAmount,
                    "status" to "PENDING")
            }
            "payment.mockComplete" -> {
                requireState("PAYMENT_PENDING")
                if (p["staffOverride"]?.asBoolean != true || !operatorAuthorized()) fail(-32001, "Staff authorization required in REAL mode")
                hardwareCamera(); paid = true; paymentMethod = "STAFF_COMP"; state = "LIVE_VIEW"; camera.startLiveView { }; snapshot()
            }
            "capture.startSequence" -> {
                requireState("LIVE_VIEW"); if (!paid) fail(-32001, "Payment required"); hardwareCamera()
                // A synchronous shutter sequence would bypass the configured countdown. Do not pretend it has run.
                fail(-32001, "Real timed capture scheduler not configured")
            }
            "print.confirmDryRun" -> { requireState("PRINT_PENDING"); snapshot().apply { addProperty("dryRun", true) } }
            "print.confirmReal" -> confirmPrint()
            "session.back" -> { state = when(state) { "SELECTING" -> "IDLE"; "SELECTING_QUANTITY" -> "SELECTING"; "PAYMENT_PENDING" -> "SELECTING_QUANTITY"; "EDITING" -> "SELECTING_PHOTOS"; "PRINT_PENDING" -> "EDITING"; else -> fail(-32001, "Back not permitted") }; snapshot() }
            "session.cancel" -> { requireState("SELECTING_PHOTOS", "EDITING"); reset(); obj("cancelled" to true, "state" to state) }
            "session.finish" -> { requireState("DELIVERY"); reset(); snapshot() }
            else -> fail(-32001, "Real capture and composition pipeline not ready; no synthetic substitution")
        }
        result.addProperty("commandId", cid)
        commands[key] = signature to result.deepCopy()
        return result
    }
    private fun confirmPrint(): JsonObject {
        requireState("PRINT_PENDING")
        if (!paid || printImage == null || composition == null) fail(-32001, "Paid session and complete composition required")
        ledger.getSale(sid)?.let { fail(-32004, "Existing sale requires spooler reconciliation") }
        val name = hardwarePrinter()
        val image = printImage!!
        val printLayout = if (layout.printSizeLabel.replace(" ", "").contains("5x15")) PrintLayout.CUT_5X15_2UP else PrintLayout.PHOTO_10X15
        val outcome = try { printer.print(ManagedPrintRequest(sid, image, quantity, name, printLayout)) }
            catch (_: Exception) { fail(-32002, "Print spooler failed; reconcile before retry") }
        if (outcome.result !is PrintResult.Submitted) fail(-32002, "Print not submitted; verify printer before retry")
        printAccepted = true
        val price = PricingCalculator.calculatePrice(layout.printSizeLabel, quantity)
        try { ledger.recordSale(SaleTransaction(sessionId = sid, boothId = boothId, layoutId = layout.id,
            layoutTitle = layout.title, printSize = price.printSize, quantity = quantity,
            includedQuantity = price.includedQuantity, extraQuantity = price.extraQuantity,
            basePrice = price.basePrice, extraUnitPrice = price.extraUnitPrice, extraAmount = price.extraAmount,
            totalAmount = price.totalAmount, paymentMethod = paymentMethod, createdAt = System.currentTimeMillis())) }
        catch (_: Exception) { state = "RECOVERY"; fail(-32603, "Print submitted but ledger failed; reconcile manually before retry") }
        revenueRecorded = true; state = "DELIVERY"
        // Remote sync is deliberately deferred until explicit API credentials and reconciliation are configured.
        return snapshot().apply { addProperty("printerName", name) }
    }
    private fun reset() { camera.stopLiveView(); state = "IDLE"; paid = false; orderCode = null; qrCode = null
        shots.clear(); selected.clear(); frame = null; printImage = null; composition = null; albumUrl = null
        printAccepted = false; revenueRecorded = false; paymentMethod = "PAYOS" }
    @Synchronized override fun close() { camera.close(); beauty.close() }
    companion object {
        fun production(): RealSessionEngine {
            val location = Path.of(RealSessionEngine::class.java.protectionDomain.codeSource.location.toURI()).toAbsolutePath()
            var root: Path? = location
            while (root != null && root.fileName?.toString() != "PhotoboothDesktop_v2") root = root.parent
            val workspace = root ?: error("V2 workspace unavailable")
            val authorization = HardwareAuthorization(explicitlyApproved = true)
            val camera = CameraManager(authorization) { mode ->
                if (mode == CameraMode.CANON_DSLR) listOf(CanonCameraAdapter(authorization)) else emptyList()
            }
            return RealSessionEngine(workspace, camera, PrinterManager(LegacyPrinter(), dryRun = false),
                SqliteSalesRepository(workspace), printerName = System.getenv("V2_PRINTER_NAME") ?: "",
                boothId = System.getenv("V2_BOOTH_ID") ?: "")
        }
    }
}
