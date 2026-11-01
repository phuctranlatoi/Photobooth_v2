package com.lesouvenir.v2.ipc

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.lesouvenir.v2.config.DesktopBoothConfig
import com.lesouvenir.v2.config.DesktopConfigLoader
import com.lesouvenir.v2.camera.CameraConnectionManager
import com.lesouvenir.v2.camera.legacy.HardwareAuthorization
import com.lesouvenir.v2.camera.real.*
import com.lesouvenir.v2.camera.demo.DemoCameraAdapter
import com.lesouvenir.v2.catalog.FirebaseCatalogService
import com.lesouvenir.v2.storage.FrameStore
import com.lesouvenir.v2.data.*
import com.lesouvenir.v2.data.SaleTransaction
import com.lesouvenir.v2.foundation.LayoutMode
import com.lesouvenir.v2.foundation.PricingCalculator
import com.lesouvenir.v2.imaging.DesktopImageProcessor
import com.lesouvenir.v2.imaging.DesktopCompositor
import com.lesouvenir.v2.imaging.FramePack
import com.lesouvenir.v2.imaging.beauty.DesktopBeautyService
import com.lesouvenir.v2.imaging.beauty.BeautyConfig
import com.lesouvenir.v2.integrations.*
import com.lesouvenir.v2.printing.legacy.*
import java.awt.Color
import java.awt.image.BufferedImage
import java.nio.file.Files
import java.nio.file.Path
import java.util.UUID
import java.util.concurrent.*
import javax.imageio.ImageIO
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.MultiFormatWriter
import com.google.zxing.client.j2se.MatrixToImageWriter
import java.io.ByteArrayOutputStream
import java.util.Base64

/** Physical operations never substitute simulator assets. External services are opt-in and fail closed. */
class RealSessionEngine(
    private val workspace: Path,
    private val camera: CameraController,
    private val printer: PrinterManager,
    private val ledger: SqliteSalesRepository,
    private val payOs: PayOsOfficialAdapter? = null,
    private val revenue: RevenueClient? = null,
    private val album: WebAlbumClient? = null,
    private val cloudinary: CloudinaryClient? = null,
    private val printerName: String = "",
    private val boothId: String = "",
    private val operatorAuthorized: () -> Boolean = { false },
    private val boothConfig: DesktopBoothConfig = DesktopConfigLoader.load(workspace),
    private val firebaseCatalog: FirebaseCatalogService = FirebaseCatalogService(workspace),
    cameraManager: CameraConnectionManager? = null,
) : SessionEngine {
    override val mode = RuntimeMode.REAL
    private val gson = Gson()
    private val processor = DesktopImageProcessor().apply { appDataDir = workspace }
    private val beauty = DesktopBeautyService()
    private val compositor = DesktopCompositor()
    private val frameStore = FrameStore(workspace)
    private val demoCamera = DemoCameraAdapter()
    private val cameraManager: CameraConnectionManager = cameraManager ?: CameraConnectionManager(camera, demoCamera)
    private var captureMode = "REAL"
    @Volatile private var liveFrameDataUrl: String? = null
    private fun startPreview() {
        liveFrameDataUrl = null
        cameraManager.startLiveView(captureMode) { frameUrl -> liveFrameDataUrl = frameUrl }
    }
    private fun stopPreview() {
        cameraManager.stopLiveView(captureMode)
        liveFrameDataUrl = null
    }
    private val config = gson.fromJson(
        Files.readString(workspace.resolve("backend/config/production-layouts.json")), JsonObject::class.java
    )
    private val operatorStore by lazy { OperatorLayoutStore(workspace) }
    private val settingsStore by lazy { OperatorSettingsStore(workspace) }
    private fun readLayouts(): List<LayoutMode> = config["layouts"].asJsonArray.map { item ->
        val fields = item.asJsonObject
        val size = fields["printSizeLabel"].asString
        val defaults = LayoutMode(fields["id"].asString, fields["title"].asString, "", "",
            com.lesouvenir.v2.foundation.LayoutFamily.valueOf(fields["family"].asString),
            fields["shotCount"].asInt, fields["selectCount"].asInt, fields["countdownSeconds"].asInt,
            PricingCalculator.calculatePrice(size, 2).basePrice, "", 0L,
            gridColumns = fields["gridColumns"].asInt, printSizeLabel = size,
            printAspectRatio = if (size.replace(" ", "").contains("5x15")) 1f / 3 else 2f / 3)
        gson.toJsonTree(defaults).asJsonObject.apply { fields.entrySet().forEach { add(it.key, it.value) } }
            .let { gson.fromJson(it, LayoutMode::class.java) }
    }
    private var layouts: List<LayoutMode> = firebaseCatalog.getLayouts().ifEmpty { readLayouts() }
    init { if (Files.exists(workspace.resolve("backend/config/local-operator-layouts.json"))) {
        // A stale local override must not prevent the real IPC bridge from starting.
        // Leave the file untouched for operator inspection; use production defaults.
        if (runCatching { operatorStore.load(config) }.isSuccess) layouts = firebaseCatalog.getLayouts().ifEmpty { readLayouts() }
    } }
    private val executor = Executors.newSingleThreadScheduledExecutor { r -> Thread(r, "v2-real-session").apply { isDaemon = true } }
    private val beautyExecutor = ThreadPoolExecutor(1, 1, 0, TimeUnit.MILLISECONDS,
        ArrayBlockingQueue<Runnable>(12), { r -> Thread(r, "v2-real-beauty").apply { isDaemon = true } },
        ThreadPoolExecutor.AbortPolicy())
    private var epoch = 0L
    private var job: ScheduledFuture<*>? = null
    private var remaining = 0
    private var activeSequence = false
    private var failure: String? = null
    private val readyBeauty = mutableMapOf<Int, Path>()
    private val beautyJobs = mutableListOf<Future<*>>()
    private val beautyConfig = BeautyConfig(enabled = boothConfig.enabled("BEAUTY_ENABLED"))
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
    /** Test seam for validating composition without making an external album request. */
    @Synchronized internal fun setAlbumUrlForTesting(url: String?) {
        require(state != "IDLE") { "Start a session before setting its album URL" }
        albumUrl = url
    }
    private var printAccepted = false
    private var revenueRecorded = false
    private val seen = mutableSetOf<String>()
    private val commands = mutableMapOf<String, Pair<String, JsonObject>>()
    private fun directory() = workspace.resolve("backend/build/real-sessions").resolve(sid)
    private fun obj(vararg fields: Pair<String, Any?>): JsonObject = gson.toJsonTree(mapOf(*fields)).asJsonObject
    private fun thumbData(path: Path, max: Int): String {
        val image = ImageIO.read(path.toFile()) ?: error("Corrupt image")
        val scale = minOf(1.0, max.toDouble() / maxOf(image.width, image.height))
        val thumb = BufferedImage(maxOf(1, (image.width * scale).toInt()), maxOf(1, (image.height * scale).toInt()), BufferedImage.TYPE_INT_RGB)
        val g = thumb.createGraphics()
        try {
            g.color = Color.WHITE
            g.fillRect(0, 0, thumb.width, thumb.height)
            g.drawImage(image, 0, 0, thumb.width, thumb.height, null)
        } finally { g.dispose() }
        val out = ByteArrayOutputStream()
        check(ImageIO.write(thumb, "jpeg", out))
        return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(out.toByteArray())
    }
    private fun frameDto(f: FramePack) = mapOf("id" to f.id, "name" to f.title, "title" to f.title,
        "isCustom" to f.isCustom, "isSpecial" to f.isSpecial, "specialEventName" to f.specialEventName,
        "targetPrintSize" to f.targetPrintSize, "targetLayoutId" to f.targetLayoutId,
        "thumbDataUrl" to f.customImagePath?.let { frameStore.frameThumbDataUrl(it) },
        "thumbnailDataUrl" to f.customImagePath?.let { frameStore.frameThumbDataUrl(it) },
        "previewDataUrl" to f.customImagePath?.let { frameStore.frameThumbDataUrl(it) },
        "width" to f.customImagePath?.let { frameStore.imageSize(it)?.first },
        "height" to f.customImagePath?.let { frameStore.imageSize(it)?.second },
        "qrCodeX" to f.qrCodeX, "qrCodeY" to f.qrCodeY, "qrCodeSize" to f.qrCodeSize)
    private fun availableFrames() = frameStore.loadFrames(layout.id).ifEmpty { listOf(FramePack("default", "Default", "", 0L)) }
    private fun bundleDto() = frameStore.loadBundles().map { mapOf("id" to it.id, "name" to it.name,
        "coverDataUrl" to it.coverDataUrl, "layoutId" to it.layoutId, "frameCount" to it.frames.size) }
    private fun catalogDto() = obj(
        "layouts" to layouts, "framesCount" to frameStore.loadFrames().size, "bundles" to bundleDto(),
        "defaultLayoutId" to layouts.first().id, "simulator" to false,
        "catalogSource" to firebaseCatalog.source.name,
        "lastSyncError" to firebaseCatalog.lastSyncError,
        "lastSyncTimestamp" to firebaseCatalog.lastSyncTimestamp,
        "pricing" to mapOf(
            "stripBasePrice" to 70000, "stripUnitPrice" to 20000,
            "printBasePrice" to 90000, "printUnitPrice" to 30000,
            "stripAllowedQuantities" to PricingCalculator.allowedOptions("5x15"),
            "printAllowedQuantities" to PricingCalculator.allowedOptions("10x15")))
    private fun fail(code: Int, message: String): Nothing = throw SimulatorError(code, message)
    private fun requireState(vararg allowed: String) { if (state !in allowed) fail(-32001, "Command not allowed in current state") }
    private fun string(p: JsonObject, key: String): String = p[key]?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }?.asString ?: fail(-32602, "$key required")
    private fun hardwareCamera() {
        if (!camera.isHardwareConnected()) {
            runCatching { camera.setMode(CameraMode.CANON_DSLR) }
                .onFailure { runCatching { camera.setMode(CameraMode.WEBCAM) } }
        }
        if (!camera.isHardwareConnected()) {
            state = "RECOVERY"
            fail(-32000, "Camera disconnected; cắm máy ảnh Canon hoặc Webcam để tiếp tục")
        }
    }
    private fun hardwarePrinter(): String {
        val available = printer.getAvailablePrinters()
        val target = printerName.ifBlank { printer.detectDnpRx1hs() ?: available.firstOrNull() ?: "" }
        if (target.isBlank() || target !in available) {
            state = "RECOVERY"
            fail(-32000, "Printer disconnected; không tìm thấy máy in")
        }
        return target
    }
    private fun snapshot() = obj("sessionId" to sid, "generationId" to generation, "state" to state,
        "layout" to layout, "quantity" to quantity, "pricing" to PricingCalculator.calculatePrice(layout.printSizeLabel, quantity),
        "paid" to paid, "totalShots" to layout.shotCount, "capturedCount" to shots.size,
        "shotIndex" to (shots.size + 1).coerceAtMost(layout.shotCount), "secondsRemaining" to remaining,
        "failure" to failure,
        "selectedCount" to selected.size, "selectedIndices" to selected.toList(), "frameId" to frame?.id,
        "printAccepted" to printAccepted, "revenueRecorded" to revenueRecorded, "payOsConfigured" to (payOs?.isConfigured == true),
        "catalogSource" to firebaseCatalog.source.name,
        "payOsStatus" to (payOs?.readiness?.name ?: "CONFIG_MISSING"),
        "lastPaymentError" to payOs?.lastError,
        "orderCode" to orderCode, "paymentQr" to qrCode, "paymentMethod" to paymentMethod,
        "userConfirmed" to printAccepted, "albumUrl" to albumUrl, "simulator" to false,
        "captureMode" to captureMode, "bundles" to bundleDto(),
        "livePreviewDataUrl" to liveFrameDataUrl,
        "cameraConnected" to cameraManager.isHardwareConnected(),
        "cameraState" to cameraManager.connectionState.name,
        "shots" to shots.mapIndexed { index, path -> mapOf("shotIndex" to index, "shotId" to "shot-$index", "preview" to runCatching { thumbData(readyBeauty[index] ?: path, 240) }.getOrDefault("")) },
        "previewDataUrl" to composition?.let { runCatching { thumbData(it, 360) }.getOrNull() },
        "availableFramesCount" to availableFrames().size)

    @Synchronized override fun dispatch(method: String, p: JsonObject): JsonObject {
        if (method.startsWith("operator.")) return when (method) {
            "operator.getStatus" -> {
                if (p.size() != 0) fail(-32602, "Invalid params")
                obj("accessMode" to "LOCAL_DEVELOPMENT_ONLY", "productionAdminAcl" to false,
                    "state" to state, "canEditLayouts" to (state == "IDLE"), "simulator" to false,
                    "layouts" to layouts, "pricingEditable" to false, "cloud" to cloudStatus(),
                    "camera" to cameraManager.getStatus(),
                    "capabilities" to mapOf(
                        "simulatorStudio" to false, "simulatorLayoutSettings" to true,
                        "nativeCamera" to camera.isHardwareConnected(), "nativePrint" to printerName.isNotBlank(),
                        "beauty" to true, "effects" to true, "cloudAlbumQr" to (album != null),
                        "revenue" to true, "paymentSettings" to (payOs != null), "productionAdminAcl" to false))
            }
            "operator.getSettings" -> {
                if (p.size() != 0) fail(-32602, "Invalid params")
                settingsStore.response().apply {
                    addProperty("effectiveTimerSource", "REAL_SESSION_NO_AUTOMATIC_TIMEOUT")
                    add("effectiveTimeoutSeconds", obj("photoSelection" to 0, "frameSelection" to 0,
                        "postCapture" to 0))
                }
            }
            "operator.updateSettings" -> {
                requireState("IDLE")
                settingsStore.update(p)
                settingsStore.response().apply { addProperty("saved", true) }
            }
            "operator.updateLayout" -> {
                requireState("IDLE")
                operatorStore.update(config, p)
                layouts = readLayouts(); layout = layouts.first()
                obj("saved" to true, "appliesTo" to "NEXT_SESSION", "layouts" to layouts, "simulator" to false)
            }
            else -> fail(-32601, "Method not found")
        }
        if (method == "device.getStatus") {
            if (p.size() != 0) fail(-32602, "Invalid params")
            val names = runCatching { printer.getAvailablePrinters() }.getOrDefault(emptyList())
            return obj("runtimeMode" to "REAL", "camera" to cameraManager.getStatus(),
                "printer" to mapOf("name" to printerName, "detected" to (printerName.isNotBlank() && printerName in names), "availablePrinters" to names),
                "beauty" to mapOf("enabled" to false, "available" to false),
                "ledger" to mapOf("salesDbConnected" to true, "pendingSyncCount" to ledger.getPendingSales().size),
                 "cloud" to cloudStatus())
        }
        if (method == "catalog.sync") {
            layouts = firebaseCatalog.sync(true).ifEmpty { readLayouts() }
            return catalogDto()
        }
        if (method == "catalog.get") return catalogDto()
        if (method !in (SimulatorSessionEngine.schemas.keys + setOf("payment.createLink", "payment.checkStatus", "print.confirmReal"))) fail(-32601, "Method not found")
        val requested = string(p, "sessionId")
        if (runCatching { UUID.fromString(requested) }.getOrNull()?.version() != 4) fail(-32602, "UUID v4 required")
        val gen = p["generationId"]?.asString ?: ""
        if (method != "session.start" && (requested != sid || gen != generation)) fail(-32004, "Stale session or generation")
        if (method == "session.getState") return snapshot()
        if (method == "frame.list") { requireState("EDITING"); return obj("frames" to availableFrames().map(::frameDto), "bundles" to bundleDto()) }
        if (method == "payment.checkStatus") {
            requireState("PAYMENT_PENDING")
            val code = orderCode ?: return obj("orderCode" to null, "status" to "PENDING", "paid" to false,
                "amount" to PricingCalculator.calculatePrice(layout.printSizeLabel, quantity).totalAmount, "nextState" to state)
            if (p.has("orderCode") && runCatching { p["orderCode"].asLong }.getOrNull() != code) fail(-32602, "Order code mismatch")
            val status = if (payOs?.checkPaymentStatus(code) == true) "PAID" else "PENDING"
            if (status == "PAID") { paid = true; state = "PREPARING"; hardwareCamera(); startPreview(); state = "LIVE_VIEW" }
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
                reset()
                layout = layouts.find { it.id == string(p, "layoutId") } ?: fail(-32602, "Unknown layout")
                captureMode = p["captureMode"]?.asString ?: cameraManager.resolveCaptureMode()
                if (captureMode !in setOf("REAL", "DEMO")) fail(-32602, "Invalid captureMode")
                sid = requested; generation = gen; state = "SELECTING"; Files.createDirectories(directory()); snapshot()
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
                if (captureMode == "DEMO") { paid = true; paymentMethod = "DEMO"; state = "PREPARING"; startPreview(); state = "LIVE_VIEW"
                    return snapshot().apply { addProperty("status", "PAID"); addProperty("amount", 0) } }
                if (payOs?.readiness != PayOsReadiness.READY) {
                    return snapshot().apply {
                        addProperty("payOsConfigured", false)
                        addProperty("status", "CONFIG_MISSING")
                        addProperty("message", "PayOS not configured; vui lòng thanh toán tiền mặt / nhân viên xác nhận")
                    }
                }
                val client = payOs
                val code = orderCode ?: System.currentTimeMillis().also { orderCode = it }
                val amount = PricingCalculator.calculatePrice(layout.printSizeLabel, quantity).totalAmount
                if (qrCode == null) {
                    val result = try { client.createPaymentLink(code, Math.toIntExact(amount), "Le Souvenir $code") }
                        catch (e: Exception) { return obj("orderCode" to code, "status" to "ERROR", "payOsConfigured" to true,
                            "error" to (client.lastError ?: e.javaClass.simpleName)) }
                    if (result.qrCode.isNullOrBlank()) return obj("orderCode" to code, "status" to "ERROR",
                        "payOsConfigured" to true, "error" to (client.lastError ?: result.error ?: "Payment gateway unavailable"))
                    qrCode = try { qrPng(result.qrCode) } catch (_: Exception) {
                        return obj("orderCode" to code, "status" to "ERROR", "payOsConfigured" to true,
                            "error" to "Invalid payment QR")
                    }
                }
                obj("orderCode" to code, "qrCode" to qrCode, "paymentQr" to qrCode, "amount" to amount,
                    "status" to "READY", "payOsConfigured" to true)
            }
            "payment.mockComplete" -> {
                requireState("PAYMENT_PENDING")
                if (captureMode == "DEMO") {
                    if (p["method"]?.asString != "DEMO") fail(-32602, "DEMO payment method required")
                    paid = true; paymentMethod = "DEMO"; state = "PREPARING"; startPreview(); state = "LIVE_VIEW"; snapshot()
                } else {
                val staff = p["staffOverride"]?.asBoolean == true
                if (!operatorAuthorized() && !staff) fail(-32001, "Staff authorization required in REAL mode")
                hardwareCamera(); paid = true; paymentMethod = if (staff) "STAFF_COMP" else "TIEN_MAT"; state = "LIVE_VIEW"; startPreview(); snapshot()
                }
            }
            "capture.startSequence" -> {
                requireState("LIVE_VIEW"); if (!paid) fail(-32001, "Payment required")
                if (captureMode == "REAL" && !camera.isHardwareConnected()) {
                    recovery(IllegalStateException("Camera disconnected"))
                    fail(-32000, "Camera disconnected")
                }
                if (activeSequence) fail(-32004, "Capture active")
                activeSequence = true; shots.clear(); selected.clear(); readyBeauty.clear(); failure = null
                countdown()
                obj("shotIndex" to 1, "totalShots" to layout.shotCount, "countdownSeconds" to layout.countdownSeconds)
            }
            "selection.toggle" -> {
                requireState("SELECTING_PHOTOS")
                val i = p["shotIndex"]?.takeIf { it.isJsonPrimitive && it.toString().matches(Regex("[0-9]+")) }?.asInt
                    ?: fail(-32602, "Invalid shot index")
                if (i !in shots.indices) fail(-32602, "Invalid shot index")
                val before = selected.toList()
                if (!selected.remove(i) && selected.size < layout.selectCount) selected.add(i)
                if (before != selected.toList()) { composition = null; printImage = null; frame = null }
                snapshot()
            }
            "selection.confirm" -> { requireState("SELECTING_PHOTOS"); if (selected.size != layout.selectCount) fail(-32001, "Exact selection required"); state = "EDITING"; snapshot() }
            "frame.select" -> {
                requireState("EDITING")
                frame = availableFrames().find { it.id == string(p, "frameId") }
                    ?: fail(-32602, "Unknown frame")
                try { compose() } catch (_: Exception) { composition = null; printImage = null; fail(-32002, "Composition failed; check original images") }
                snapshot()
            }
            "frame.confirm" -> { requireState("EDITING"); if (printImage == null || composition == null) fail(-32001, "Complete composition required"); state = "PRINT_PENDING"; snapshot() }
            "print.confirmDryRun" -> confirmPrint()
            "print.confirmReal" -> confirmPrint()
            "session.back" -> {
                state = when (state) {
                    "SELECTING" -> { reset(); "IDLE" }
                    "SELECTING_QUANTITY" -> "SELECTING"
                    "PAYMENT_PENDING" -> { orderCode = null; qrCode = null; "SELECTING_QUANTITY" }
                    "EDITING" -> "SELECTING_PHOTOS"
                    "PRINT_PENDING" -> "EDITING"
                    else -> fail(-32001, "Back not permitted")
                }
                snapshot()
            }
            "session.cancel" -> { requireState("SELECTING_PHOTOS", "EDITING"); reset(); obj("cancelled" to true, "state" to state) }
            "session.finish" -> { requireState("DELIVERY"); reset(); snapshot() }
            else -> fail(-32001, "Real capture and composition pipeline not ready; no synthetic substitution")
        }
        result.addProperty("commandId", cid)
        commands[key] = signature to result.deepCopy()
        return result
    }
    private fun schedule(delayMillis: Long, action: () -> Unit) {
        val token = epoch
        job = executor.schedule({ synchronized(this) {
            if (token == epoch && activeSequence) try { action() }
            catch (e: Exception) { recovery(e) }
        } }, delayMillis, TimeUnit.MILLISECONDS)
    }
    private fun countdown() {
        state = "COUNTDOWN"; remaining = layout.countdownSeconds
        schedule(if (remaining == 0) 0 else 1000) { step() }
    }
    private fun step() {
        if (remaining > 0) remaining--
        if (remaining > 0) schedule(1000) { step() }
        else {
            state = "CAPTURING"
            schedule(0) {
                check(captureMode == "DEMO" || cameraManager.isHardwareConnected()) { "Camera disconnected" }
                val index = shots.size
                val source = cameraManager.capture(captureMode, directory(), index, layout.photoAspectRatio)
                val original = directory().resolve("original-shot-$index.jpg")
                check(Files.isRegularFile(source) && ImageIO.read(source.toFile()) != null) { "Invalid captured image" }
                if (source != original) Files.copy(source, original, java.nio.file.StandardCopyOption.REPLACE_EXISTING)
                shots.add(original)
                queueBeauty(index, original)
                if (shots.size == layout.shotCount) {
                    activeSequence = false; stopPreview(); state = "SELECTING_PHOTOS"
                } else { state = "LIVE_VIEW"; schedule(1) { countdown() } }
            }
        }
    }
    private fun queueBeauty(index: Int, original: Path) {
        if (!beautyConfig.enabled) return
        val token = epoch
        val target = directory().resolve("beauty-shot-$index.png")
        try {
            beautyJobs.add(beautyExecutor.submit {
                val output = beauty.processCapture(original.toFile(), target.toFile(), beautyConfig) { token != epoch }
                synchronized(this) {
                    if (token == epoch && output.toPath() == target && Files.isRegularFile(target) &&
                        runCatching { ImageIO.read(target.toFile()) != null }.getOrDefault(false)) readyBeauty[index] = target
                }
            })
        } catch (_: RejectedExecutionException) { /* Original is always retained. */ }
    }
    private fun recovery(error: Exception) {
        epoch++; job?.cancel(false); activeSequence = false; remaining = 0
        state = "RECOVERY"; failure = "Camera capture failed: ${error.javaClass.simpleName}"
        runCatching { stopPreview() }
    }
    private fun compose() {
        composition = null; printImage = null
        val chosen = frame ?: fail(-32001, "Frame required")
        val paths = selected.map { index -> readyBeauty[index] ?: shots[index] }
        check(paths.size == layout.selectCount && paths.all { Files.isRegularFile(it) && ImageIO.read(it.toFile()) != null })
        val albumClient = album
        if (captureMode == "REAL" && albumUrl == null && albumClient != null) {
            val preAlbum = runCatching {
                albumClient.createAlbum(CreateAlbumRequest(externalSessionId = sid, expectedAssets = selected.size + 2, expiresInDays = 7))
            }.getOrNull()
            if (preAlbum != null) albumUrl = preAlbum.albumUrl
        }
        val result = compositor.renderFinal(layout, chosen, paths, directory(), qrCodeUrl = albumUrl)
        check(Files.isRegularFile(result.finalImagePath) && Files.isRegularFile(result.printImagePath) &&
            ImageIO.read(result.finalImagePath.toFile()) != null && ImageIO.read(result.printImagePath.toFile()) != null)
        composition = result.finalImagePath; printImage = result.printImagePath
    }
    private fun confirmPrint(): JsonObject {
        requireState("PRINT_PENDING")
        if (!paid || printImage == null || composition == null) fail(-32001, "Paid session and complete composition required")
        if (captureMode == "DEMO") {
            val image = printImage!!
            if (ImageIO.read(image.toFile()) == null) fail(-32002, "Invalid print canvas")
            printAccepted = true; revenueRecorded = false; state = "DELIVERY"
            return snapshot().apply { addProperty("dryRun", true) }
        }
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
    private fun reset() { epoch++; job?.cancel(false); beautyJobs.forEach { it.cancel(true) }; beautyJobs.clear(); readyBeauty.clear()
        activeSequence = false; remaining = 0; failure = null; stopPreview(); state = "IDLE"; paid = false; orderCode = null; qrCode = null
        shots.clear(); selected.clear(); frame = null; printImage = null; composition = null; albumUrl = null
        printAccepted = false; revenueRecorded = false; paymentMethod = "PAYOS" }
    @Synchronized override fun close() { epoch++; job?.cancel(true); beautyJobs.forEach { it.cancel(true) }
        executor.shutdownNow(); beautyExecutor.shutdownNow(); cameraManager.close(); beauty.close() }
    private fun cloudStatus() = boothConfig.status() + mapOf("payOsConfigured" to (payOs?.isConfigured == true),
        "catalogSource" to firebaseCatalog.source.name,
        "payOsStatus" to (payOs?.readiness?.name ?: "CONFIG_MISSING"),
        "cloudinaryConfigured" to (cloudinary != null), "webAlbumConfigured" to (album != null),
        "revenueEndpointConfigured" to (revenue != null))

    private fun qrPng(raw: String): String {
        if (raw.startsWith("data:image/png;base64,")) return raw
        val hints = mapOf(EncodeHintType.MARGIN to 2, EncodeHintType.CHARACTER_SET to "UTF-8")
        val matrix = MultiFormatWriter().encode(raw, BarcodeFormat.QR_CODE, 1000, 1000, hints)
        val bytes = ByteArrayOutputStream().use { out -> MatrixToImageWriter.writeToStream(matrix, "PNG", out); out.toByteArray() }
        return "data:image/png;base64,${Base64.getEncoder().encodeToString(bytes)}"
    }
    companion object {
        fun production(): RealSessionEngine {
            val location = Path.of(RealSessionEngine::class.java.protectionDomain.codeSource.location.toURI()).toAbsolutePath()
            var root: Path? = location
            while (root != null && root.fileName?.toString() != "PhotoboothDesktop_v2") root = root.parent
            val workspace = root ?: error("V2 workspace unavailable")
            Files.createDirectories(workspace.resolve("data/hotfolder"))
            val authorization = HardwareAuthorization(explicitlyApproved = true)
            val camera = CameraManager(authorization) { mode ->
                when (mode) {
                    CameraMode.CANON_DSLR -> listOf(CanonCameraAdapter(authorization))
                    CameraMode.WEBCAM -> listOf(WebcamCameraAdapter(authorization).apply { open() })
                    CameraMode.HOT_FOLDER -> listOf(HotFolderCameraAdapter(authorization, workspace.resolve("data/hotfolder")))
                }
            }
            // Discovery may load native Canon libraries (which write to stdout) or
            // throw when no camera exists. Keep the framed stdio channel clean and
            // defer discovery until a paid session explicitly requests a camera.
            val config = DesktopConfigLoader.load(workspace)
            val payOs = PayOsOfficialAdapter(config.get("PAYOS_CLIENT_ID"), config.get("PAYOS_API_KEY"), config.get("PAYOS_CHECKSUM_KEY"))
            val base = config.get("WEB_ALBUM_BASE_URL").takeIf { it.startsWith("https://") || it.startsWith("http://localhost") }
            val key = config.get("BOOTH_API_KEY")
            val album = if (base != null && key.isNotBlank()) WebAlbumClient(base, "Bearer $key") else null
            val revenue = if (base != null && key.isNotBlank()) RevenueClient(base, "Bearer $key") else null
            val cloudinary = if (config.get("CLOUDINARY_CLOUD_NAME").isNotBlank() && config.get("CLOUDINARY_UPLOAD_PRESET").isNotBlank())
                CloudinaryClient(config.get("CLOUDINARY_CLOUD_NAME"), config.get("CLOUDINARY_UPLOAD_PRESET")) else null
            return RealSessionEngine(workspace, camera, PrinterManager(LegacyPrinter(), dryRun = !config.enabled("ENABLE_SYSTEM_PRINT")),
                SqliteSalesRepository(workspace), payOs = payOs, revenue = revenue,
                album = album, cloudinary = cloudinary, printerName = config.get("PRINTER_NAME_STRIP"),
                boothId = config.get("BOOTH_ID"), boothConfig = config)
        }
    }
}
