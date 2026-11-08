package com.lesouvenir.v2.ipc

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonNull
import com.lesouvenir.v2.config.DesktopBoothConfig
import com.lesouvenir.v2.config.DesktopConfigLoader
import com.lesouvenir.v2.camera.CameraConnectionManager
import com.lesouvenir.v2.camera.legacy.HardwareAuthorization
import com.lesouvenir.v2.camera.real.*
import com.lesouvenir.v2.camera.demo.DemoCameraAdapter
import com.lesouvenir.v2.catalog.FirebaseCatalogService
import com.lesouvenir.v2.storage.FrameStore
import com.lesouvenir.v2.storage.FilterStore
import com.lesouvenir.v2.data.*
import com.lesouvenir.v2.data.SaleTransaction
import com.lesouvenir.v2.foundation.LayoutMode
import com.lesouvenir.v2.foundation.PricingCalculator
import com.lesouvenir.v2.imaging.DesktopImageProcessor
import com.lesouvenir.v2.imaging.DesktopCompositor
import com.lesouvenir.v2.imaging.DesktopVideoCompositor
import com.lesouvenir.v2.imaging.FramePack
import com.lesouvenir.v2.imaging.RenderResult
import com.lesouvenir.v2.imaging.beauty.DesktopBeautyService
import com.lesouvenir.v2.imaging.beauty.BeautyConfig
import com.lesouvenir.v2.integrations.*
import com.lesouvenir.v2.printing.legacy.*
import com.lesouvenir.v2.printing.SystemPrinterService
import kotlinx.coroutines.runBlocking
import java.awt.Color
import java.awt.image.BufferedImage
import java.nio.file.Files
import java.nio.file.Path
import java.util.UUID
import java.util.concurrent.*
import javax.imageio.ImageIO
import javax.imageio.IIOImage
import javax.imageio.ImageWriteParam
import javax.imageio.stream.MemoryCacheImageOutputStream
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
    frameStore: FrameStore? = null,
) : SessionEngine {
    override val mode = RuntimeMode.REAL
    private val gson = Gson()
    private val processor = DesktopImageProcessor().apply { appDataDir = workspace }
    private val systemPrinterService = SystemPrinterService()
    private val webAlbumClient = DesktopWebAlbumClient()
    private val albumUploader = DesktopAlbumUploader(workspace, boothConfig, DesktopCloudinaryClient(), webAlbumClient, processor)
    private val neonRevenue = NeonDirectRevenueClient()
    private val filterStore = FilterStore(workspace)
    private val beauty = DesktopBeautyService()
    private val compositor = DesktopCompositor()
    private val videoCompositor = DesktopVideoCompositor(workspace)
    private val frameStore: FrameStore = frameStore ?: FrameStore(
        workspace,
        if (workspace.any { it.toString().startsWith("junit") || it.toString().contains("temp") }) null
        else System.getenv("LOCALAPPDATA"),
    )
    private val operatorMedia by lazy { OperatorMediaCommands(this.frameStore, filterStore, processor, ledger, boothConfig, neonRevenue) }
    init { processor.availableEffects = runCatching { filterStore.loadFilters() }.getOrDefault(processor.availableEffects) }
    private val thumbCache = ConcurrentHashMap<String, String>()
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
    private val albumExecutor = Executors.newSingleThreadExecutor { r -> Thread(r, "v2-real-album").apply { isDaemon = true } }
    private var albumJob: Future<*>? = null
    // The QR URL is part of the rendered print canvas; never reuse a print made before album prefetch completed.
    private val compositionCache = mutableMapOf<String, Pair<RenderResult, String?>>()
    private var epoch = 0L
    private var job: ScheduledFuture<*>? = null
    private var inactivityJob: ScheduledFuture<*>? = null
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
    private var albumId: String? = null
    private var uploadJob: Future<*>? = null
    private var videoGenerated = false
    private var videoUploaded = false
    private var albumCompleted = false
    /** Test seam for validating composition without making an external album request. */
    @Synchronized internal fun setAlbumUrlForTesting(url: String?) {
        require(state != "IDLE") { "Start a session before setting its album URL" }
        albumUrl = url
    }
    private var printAccepted = false
    private var revenueRecorded = false
    private var printStatusMessage: String? = null
    private val seen = mutableSetOf<String>()
    private val commands = mutableMapOf<String, Pair<String, JsonObject>>()
    private fun directory() = workspace.resolve("data").resolve("sessions").resolve(sid)
    private fun obj(vararg fields: Pair<String, Any?>): JsonObject = gson.toJsonTree(mapOf(*fields)).asJsonObject
    private fun thumbData(path: Path, max: Int): String {
        val key = "${path.toAbsolutePath()}_${runCatching { Files.getLastModifiedTime(path).toMillis() }.getOrDefault(0L)}_$max"
        return thumbCache.computeIfAbsent(key) {
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
        val writer = ImageIO.getImageWritersByFormatName("jpeg").next()
        try {
            MemoryCacheImageOutputStream(out).use { stream ->
                writer.output = stream
                writer.write(null, IIOImage(thumb, null, null), writer.defaultWriteParam.apply {
                    compressionMode = ImageWriteParam.MODE_EXPLICIT
                    compressionQuality = 0.82f
                })
            }
        } finally { writer.dispose() }
        "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(out.toByteArray())
        }
    }
    private fun frameDto(f: FramePack): Map<String, Any?> {
        val thumb = f.customImagePath?.let { frameStore.frameThumbDataUrl(it) }
        return mapOf("id" to f.id, "name" to f.title, "title" to f.title,
        "isCustom" to f.isCustom, "isSpecial" to f.isSpecial, "specialEventName" to f.specialEventName,
        "targetPrintSize" to f.targetPrintSize, "targetLayoutId" to f.targetLayoutId,
        "thumbDataUrl" to thumb,
        "width" to f.customImagePath?.let { frameStore.imageSize(it)?.first },
        "height" to f.customImagePath?.let { frameStore.imageSize(it)?.second },
        "qrCodeX" to f.qrCodeX, "qrCodeY" to f.qrCodeY, "qrCodeSize" to f.qrCodeSize)
    }
    private fun operatorFrames() = frameStore.loadFrames().map { pack -> mapOf(
        "id" to pack.id, "title" to pack.title,
        "targetPrintSize" to (pack.targetPrintSize ?: ""),
        "targetLayoutId" to (pack.targetLayoutId ?: ""),
        "isSpecial" to pack.isSpecial, "specialEventName" to (pack.specialEventName ?: ""),
        "thumbDataUrl" to (pack.customImagePath?.let { frameStore.frameThumbDataUrl(it) } ?: "")) }
    private fun availableFrames() = frameStore.loadFrames(layout.id, layout.printSizeLabel).ifEmpty { listOf(FramePack("default", "Khung mặc định", "", 0L)) }
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
            "printBasePrice" to 70000, "printUnitPrice" to 30000,
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
        "printAccepted" to printAccepted, "revenueRecorded" to revenueRecorded,
        "printStatus" to printStatusMessage,
        "printImagePath" to printImage?.toAbsolutePath()?.toString(),
        "finalImagePath" to composition?.toAbsolutePath()?.toString(),
        "payOsConfigured" to (payOs?.isConfigured == true),
        "catalogSource" to firebaseCatalog.source.name,
        "payOsStatus" to (payOs?.readiness?.name ?: "CONFIG_MISSING"),
        "lastPaymentError" to payOs?.lastError,
        "orderCode" to orderCode, "paymentQr" to qrCode, "paymentMethod" to paymentMethod,
        "userConfirmed" to printAccepted, "albumUrl" to albumUrl, "masterUrl" to albumUrl,
        "qrCodeUrl" to albumUrl?.let { runCatching { qrPng(it) }.getOrNull() }, "simulator" to false,
        "videoGenerated" to videoGenerated, "videoUploaded" to videoUploaded, "albumCompleted" to albumCompleted,
        "captureMode" to captureMode, "bundles" to bundleDto(),
        "livePreviewDataUrl" to liveFrameDataUrl,
        "cameraConnected" to cameraManager.isHardwareConnected(),
        "cameraState" to cameraManager.connectionState.name,
        "shots" to shots.mapIndexed { index, path -> mapOf("shotIndex" to index, "shotId" to "shot-$index", "preview" to runCatching { thumbData(readyBeauty[index] ?: path, 960) }.getOrDefault("")) },
        "previewDataUrl" to composition?.let { runCatching { thumbData(it, 960) }.getOrNull() },
        "compositionDataUrl" to composition?.let { runCatching { thumbData(it, 960) }.getOrNull() },
        "availableFramesCount" to availableFrames().size)

    private fun stopInactivity() {
        inactivityJob?.cancel(false)
        inactivityJob = null
        remaining = 0
    }
    private fun timeoutSeconds(setting: String): Int = runCatching { settingsStore.settings[setting].asInt }
        .getOrDefault(if (setting == "frameSelectionTimeoutSeconds") 60 else 90)
    private fun startInactivity(target: String) {
        stopInactivity()
        val setting = if (target == "SELECTING_PHOTOS") "photoSelectionTimeoutSeconds" else "frameSelectionTimeoutSeconds"
        remaining = timeoutSeconds(setting)
        val token = epoch
        fun tick(delay: Long) {
            inactivityJob = executor.schedule({ synchronized(this@RealSessionEngine) {
                if (token != epoch || state != target) return@synchronized
                remaining--
                if (remaining <= 0) {
                    stopInactivity()
                    shots.indices.forEach { if (selected.size < layout.selectCount) selected.add(it) }
                    if (frame == null) frame = availableFrames().firstOrNull()
                    try { compose() } catch (_: Exception) { composition = null; printImage = null }
                    // Timeout is a dry-run acceptance only: never submit hardware print or record revenue.
                    printAccepted = true
                    revenueRecorded = false
                    state = "DELIVERY"
                } else tick(1000)
            } }, delay, TimeUnit.MILLISECONDS)
        }
        tick(if (remaining <= 0) 0 else 1000)
    }

    @Synchronized override fun dispatch(method: String, p: JsonObject): JsonObject {
        if (method.startsWith("operator.")) return when (method) {
            in OperatorMediaCommands.methods -> {
                if (!operatorAuthorized()) fail(-32001, "Operator authorization required")
                operatorMedia.dispatch(method, p)
            }
            "operator.getStatus" -> {
                if (p.size() != 0) fail(-32602, "Invalid params")
                obj("accessMode" to "LOCAL_DEVELOPMENT_ONLY", "productionAdminAcl" to false,
                    "state" to state, "canEditLayouts" to (state == "IDLE"), "simulator" to false,
                    "layouts" to layouts, "pricingEditable" to false, "cloud" to cloudStatus(),
                    "frames" to operatorFrames(),
                    "camera" to cameraManager.getStatus(),
                    "printer" to mapOf("name" to printerName, "detected" to (printerName.isNotBlank() && printerName in runCatching { printer.getAvailablePrinters() }.getOrDefault(emptyList())),
                        "systemPrintEnabled" to (boothConfig.enabled("ENABLE_SYSTEM_PRINT") ||
                            runCatching { settingsStore.settings["enableSystemPrint"]?.asBoolean == true }.getOrDefault(false))),
                    "capabilities" to mapOf(
                        "simulatorStudio" to false, "simulatorLayoutSettings" to true,
                        "nativeCamera" to camera.isHardwareConnected(), "nativePrint" to printerName.isNotBlank(),
                        "beauty" to true, "effects" to true, "cloudAlbumQr" to (album != null),
                        "revenue" to true, "paymentSettings" to (payOs != null), "productionAdminAcl" to false))
            }
            "operator.reloadFrames" -> {
                if (p.size() != 0) fail(-32602, "Invalid params")
                frameStore.invalidate()
                obj("frames" to operatorFrames())
            }
            "operator.getSettings" -> {
                if (p.size() != 0) fail(-32602, "Invalid params")
                settingsStore.response().apply {
                    addProperty("effectiveTimerSource", "OPERATOR_SETTINGS")
                    add("effectiveTimeoutSeconds", obj("photoSelection" to settingsStore.settings["photoSelectionTimeoutSeconds"].asInt,
                        "frameSelection" to settingsStore.settings["frameSelectionTimeoutSeconds"].asInt,
                        "postCapture" to settingsStore.settings["postCaptureTimeoutSeconds"].asInt))
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
        if (method != "session.start" && (requested != sid || (gen.isNotEmpty() && generation.isNotEmpty() && gen != generation))) fail(-32004, "Stale session or generation")
        if (method == "session.getState") return snapshot()
        if (method == "frame.list") { requireState("EDITING"); return obj("frames" to availableFrames().parallelStream().map(::frameDto).toList(), "bundles" to bundleDto()) }
        if (method == "payment.checkStatus") {
            requireState("PAYMENT_PENDING")
            val code = orderCode
            if (code == null) return snapshot().apply {
                add("orderCode", JsonNull.INSTANCE); addProperty("status", "PENDING"); addProperty("paid", false)
                addProperty("amount", PricingCalculator.calculatePrice(layout.printSizeLabel, quantity).totalAmount)
            }
            if (p.has("orderCode") && runCatching { p["orderCode"].asLong }.getOrNull() != code) fail(-32602, "Order code mismatch")
            val status = if (payOs?.checkPaymentStatus(code) == true) "PAID" else "PENDING"
            if (status == "PAID") { paid = true; state = "PREPARING"; if (captureMode == "REAL") hardwareCamera(); startPreview(); state = "LIVE_VIEW" }
            return snapshot().apply {
                addProperty("orderCode", code); addProperty("status", status); addProperty("paid", paid)
                addProperty("amount", PricingCalculator.calculatePrice(layout.printSizeLabel, quantity).totalAmount)
                addProperty("nextState", state)
            }
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
                sid = requested; generation = gen; state = "SELECTING"; Files.createDirectories(directory())
                Files.createDirectories(workspace.resolve("data/output")); snapshot()
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
                val amount = PricingCalculator.calculatePrice(layout.printSizeLabel, quantity).totalAmount
                if (payOs?.readiness != PayOsReadiness.READY) {
                    qrCode = "ERROR"
                    return snapshot().apply {
                        addProperty("payOsConfigured", false)
                        addProperty("status", "CONFIG_MISSING")
                        addProperty("amount", amount)
                        addProperty("paymentQr", "ERROR")
                        addProperty("message", "PayOS not configured; vui lòng thanh toán tiền mặt / nhân viên xác nhận")
                    }
                }
                val client = payOs
                val code = orderCode ?: System.currentTimeMillis().also { orderCode = it }
                if (qrCode == null || qrCode == "ERROR") {
                    val result = try { client.createPaymentLink(code, Math.toIntExact(amount), "Le Souvenir $code") }
                        catch (e: Exception) { qrCode = "ERROR"; return snapshot().apply {
                            addProperty("orderCode", code); addProperty("status", "ERROR"); addProperty("paymentQr", "ERROR")
                            addProperty("payOsConfigured", true); addProperty("error", client.lastError ?: e.javaClass.simpleName) } }
                    if (result.qrCode.isNullOrBlank()) { qrCode = "ERROR"; return snapshot().apply {
                        addProperty("orderCode", code); addProperty("status", "ERROR"); addProperty("paymentQr", "ERROR")
                        addProperty("payOsConfigured", true); addProperty("error", client.lastError ?: result.error ?: "Payment gateway unavailable") } }
                    qrCode = try { qrPng(result.qrCode) } catch (_: Exception) {
                        qrCode = "ERROR"; return snapshot().apply {
                            addProperty("orderCode", code); addProperty("status", "ERROR"); addProperty("paymentQr", "ERROR")
                            addProperty("payOsConfigured", true); addProperty("error", "Invalid payment QR") }
                    }
                }
                snapshot().apply { addProperty("orderCode", code); addProperty("qrCode", qrCode)
                    addProperty("paymentQr", qrCode); addProperty("amount", amount)
                    addProperty("status", "READY"); addProperty("payOsConfigured", true) }
            }
            "payment.mockComplete" -> {
                requireState("PAYMENT_PENDING")
                val staff = p["staffOverride"]?.asBoolean == true || p["method"]?.asString in setOf("CASH", "TIEN_MAT", "DEMO")
                if (!operatorAuthorized() && !staff) fail(-32001, "Staff authorization required")
                if (captureMode == "REAL") hardwareCamera()
                paid = true
                paymentMethod = if (p["staffOverride"]?.asBoolean == true) {
                    p["method"]?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }?.asString ?: "Tiền mặt"
                } else if (staff) "TIEN_MAT" else "STAFF_COMP"
                state = "PREPARING"
                startPreview()
                state = "LIVE_VIEW"
                snapshot()
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
                if (before != selected.toList()) { composition = null; printImage = null; frame = availableFrames().firstOrNull() }
                snapshot()
            }
            "selection.confirm" -> {
                requireState("SELECTING_PHOTOS")
                selectionIndices(p, shots.size)?.let { indices ->
                    if (indices.size != layout.selectCount) fail(-32001, "Exact selection required")
                    selected.clear(); selected.addAll(indices)
                }
                if (selected.size != layout.selectCount) fail(-32001, "Exact selection required")
                if (frame == null) frame = availableFrames().firstOrNull()
                composeSafely()
                state = "EDITING"; startInactivity("EDITING"); snapshot()
            }
            "frame.select" -> {
                requireState("EDITING")
                frame = availableFrames().find { it.id == string(p, "frameId") }
                    ?: fail(-32602, "Unknown frame")
                composition = null; printImage = null
                snapshot()
            }
            "frame.confirm" -> {
                requireState("EDITING")
                val previousFrameId = frame?.id
                if (p.has("frameId")) frame = availableFrames().find { it.id == string(p, "frameId") }
                    ?: fail(-32602, "Unknown frame")
                if (frame == null) frame = availableFrames().firstOrNull()
                if (previousFrameId != frame?.id) { composition = null; printImage = null }
                if (printImage == null || composition == null) composeSafely()
                if (printImage == null || composition == null) fail(-32001, "Complete composition required")
                stopInactivity(); state = "PRINT_PENDING"; startInactivity("PRINT_PENDING"); snapshot()
            }
            "print.confirmDryRun" -> confirmPrint()
            "print.confirmReal" -> confirmPrint()
            "session.back" -> {
                state = when (state) {
                    "SELECTING" -> { reset(); "IDLE" }
                    "SELECTING_QUANTITY" -> "SELECTING"
                    "PAYMENT_PENDING" -> { orderCode = null; qrCode = null; "SELECTING_QUANTITY" }
                    "EDITING" -> { stopInactivity(); "SELECTING_PHOTOS" }
                    "PRINT_PENDING" -> "EDITING"
                    else -> fail(-32001, "Back not permitted")
                }
                if (state == "SELECTING_PHOTOS" || state == "EDITING") startInactivity(state)
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
                    activeSequence = false; stopPreview(); state = "SELECTING_PHOTOS"; prefetchAlbum(); startInactivity("SELECTING_PHOTOS")
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
        epoch++; job?.cancel(false); stopInactivity(); activeSequence = false; remaining = 0
        state = "RECOVERY"; failure = "Camera capture failed: ${error.javaClass.simpleName}"
        runCatching { stopPreview() }
    }
    private fun composeSafely() {
        try { compose() } catch (_: Exception) { composition = null; printImage = null }
    }
    private fun prefetchAlbum() {
        if (boothConfig.get("WEB_ALBUM_BASE_URL").isBlank() || boothConfig.get("BOOTH_API_KEY").isBlank()) return
        if (albumUrl != null || albumJob != null) return
        val token = epoch
        val session = sid
        val expectedAssets = layout.selectCount + 2
        albumJob = albumExecutor.submit {
            val created = runCatching { webAlbumClient.createAlbum(boothConfig, CreateAlbumRequest(session, expectedAssets,
                boothConfig.get("ALBUM_EXPIRES_IN_DAYS").toIntOrNull()?.coerceAtLeast(1) ?: 7)) }.getOrNull()
            synchronized(this@RealSessionEngine) {
                if (token == epoch && sid == session && created != null && albumUrl == null) {
                    albumId = created.albumId
                    albumUrl = created.albumUrl
                    // A preview rendered before the URL arrived cannot be reused as the QR print canvas.
                    if (state == "EDITING") { composition = null; printImage = null }
                }
            }
        }
    }
    private fun compose() {
        composition = null; printImage = null
        val chosen = frame ?: fail(-32001, "Frame required")
        val paths = selected.map { index -> readyBeauty[index]?.takeIf {
            runCatching { Files.isRegularFile(it) && ImageIO.read(it.toFile()) != null }.getOrDefault(false)
        } ?: shots[index] }
        check(paths.size == layout.selectCount && paths.all { Files.isRegularFile(it) && ImageIO.read(it.toFile()) != null })
        // Never wait for an HTTP request while holding the synchronized IPC dispatch lock.
        prefetchAlbum()
        val key = "${layout.id}_${chosen.id}_${paths.joinToString(",")}"
        compositionCache[key]?.let { (cached, qrUrl) ->
            if (qrUrl == albumUrl && Files.isRegularFile(cached.finalImagePath) && Files.isRegularFile(cached.printImagePath) &&
                runCatching { ImageIO.read(cached.finalImagePath.toFile()) != null && ImageIO.read(cached.printImagePath.toFile()) != null }.getOrDefault(false)) {
                composition = cached.finalImagePath; printImage = cached.printImagePath
                saveMaster(cached.finalImagePath)
                return
            }
            compositionCache.remove(key)
        }
        // Keep the selected frame identity, but render the default layout border if its graphic is unavailable.
        val renderFrame = if (chosen.isCustom && chosen.customImagePath?.let {
            runCatching { Files.isRegularFile(it) && ImageIO.read(it.toFile()) != null }.getOrDefault(false)
        } != true) chosen.copy(isCustom = false, customImagePath = null) else chosen
        val result = try { compositor.renderFinal(layout, renderFrame, paths, directory(), qrCodeUrl = albumUrl) }
            catch (e: Exception) {
                if (!chosen.isCustom || renderFrame !== chosen) throw e
                compositor.renderFinal(layout, chosen.copy(isCustom = false, customImagePath = null), paths, directory(), qrCodeUrl = albumUrl)
            }
        check(Files.isRegularFile(result.finalImagePath) && Files.isRegularFile(result.printImagePath) &&
            ImageIO.read(result.finalImagePath.toFile()) != null && ImageIO.read(result.printImagePath.toFile()) != null)
        compositionCache[key] = result to albumUrl
        composition = result.finalImagePath; printImage = result.printImagePath
        saveMaster(result.finalImagePath)
    }
    private fun saveMaster(source: Path) {
        // A delivery JPEG is best-effort; the original PNG print canvas remains authoritative.
        runCatching {
            val output = workspace.resolve("data/output")
            Files.createDirectories(output)
            val image = ImageIO.read(source.toFile()) ?: return@runCatching
            val rgb = BufferedImage(image.width, image.height, BufferedImage.TYPE_INT_RGB)
            val graphics = rgb.createGraphics()
            try {
                graphics.color = java.awt.Color.WHITE
                graphics.fillRect(0, 0, image.width, image.height)
                graphics.drawImage(image, 0, 0, null)
            } finally { graphics.dispose() }
            ImageIO.write(rgb, "jpg", output.resolve("master_$sid.jpg").toFile())
        }
    }
    private fun confirmPrint(): JsonObject {
        requireState("PRINT_PENDING")
        if (!paid || printImage == null || composition == null) fail(-32001, "Paid session and complete composition required")
        val dryRun = captureMode == "DEMO"
        if (!dryRun) ledger.getSale(sid)?.let { fail(-32004, "Existing sale requires spooler reconciliation") }
        val name = boothConfig.get("PRINTER_NAME_STRIP").takeIf { it.isNotBlank() }
            ?: boothConfig.get("PRINTER_NAME_FULL").takeIf { it.isNotBlank() }
            ?: printerName.takeIf { it.isNotBlank() }
        val image = printImage!!
        if (ImageIO.read(image.toFile()) == null) fail(-32002, "Invalid print canvas")
        val enabled = boothConfig.enabled("ENABLE_SYSTEM_PRINT") ||
            runCatching { settingsStore.settings["enableSystemPrint"]?.asBoolean == true }.getOrDefault(false)
        val sheets = if (layout.printSizeLabel.replace(" ", "").contains("5x15", ignoreCase = true))
            (quantity / 2).coerceAtLeast(1) else quantity
        // A spooler failure can be ambiguous. Never resubmit automatically after an exception.
        val printed = if (dryRun) {
            Result.success("Demo capture: no physical print submitted")
        } else if (enabled) {
            systemPrinterService.printImage(image, sheets, name)
        } else {
            Result.success("Chế độ mô phỏng in: Đã hoàn tất bản in ảo.")
        }
        // Keep delivery available on spooler errors, but never treat an uncertain submission
        // as a successful print or record revenue. A retry requires operator reconciliation.
        printAccepted = printed.isSuccess && (dryRun || enabled)
        printStatusMessage = printed.fold({ it }, { "Không gửi được sang Windows Print (${it.javaClass.simpleName}); cần kiểm tra hàng đợi in." })
        if (!dryRun && printAccepted) {
            val price = PricingCalculator.calculatePrice(layout.printSizeLabel, quantity)
            val transaction = SaleTransaction(sessionId = sid, boothId = boothId, layoutId = layout.id,
                layoutTitle = layout.title, printSize = price.printSize, quantity = quantity,
                includedQuantity = price.includedQuantity, extraQuantity = price.extraQuantity,
                basePrice = price.basePrice, extraUnitPrice = price.extraUnitPrice, extraAmount = price.extraAmount,
                totalAmount = price.totalAmount, paymentMethod = paymentMethod, createdAt = System.currentTimeMillis())
            try { ledger.recordSale(transaction) }
            catch (_: Exception) { state = "RECOVERY"; fail(-32603, "Print submitted but ledger failed; reconcile manually before retry") }
            revenueRecorded = true
            if (boothConfig.get("NEON_DATABASE_URL").isNotBlank() || boothConfig.get("DATABASE_URL").isNotBlank()) {
                albumExecutor.submit {
                    if (neonRevenue.recordTransaction(boothConfig, transaction)) ledger.markSaleSynced(transaction.sessionId)
                }
            }
        }
        state = "DELIVERY"
        val session = sid
        val moments = shots.mapIndexed { index, path -> CapturedMoment(index, readyBeauty[index] ?: path) }
        val selectedMoments = selected.map { moments[it] }
        val preCreated = albumId
        val finalPrint = composition ?: image
        val layoutForUpload = layout
        val frameForUpload = frame ?: availableFrames().firstOrNull() ?: FramePack("default", "Khung mặc định", "", 0L)
        val outputForUpload = directory()
        val tokenForUpload = epoch
        uploadJob = albumExecutor.submit {
            val result = runBlocking { albumUploader.uploadSessionPhotos(session, preCreated, moments, finalPrint) }
            val id = result.albumId ?: preCreated
            try {
                val video = videoCompositor.createCompositeVideo(layoutForUpload, frameForUpload, selectedMoments, outputForUpload, session)
                synchronized(this@RealSessionEngine) { if (sid == session && tokenForUpload == epoch) videoGenerated = video != null }
                if (video != null && id != null) {
                    val uploaded = albumUploader.uploadSessionVideo(session, id, video, moments.size + 2)
                    synchronized(this@RealSessionEngine) { if (sid == session && tokenForUpload == epoch) videoUploaded = uploaded }
                }
            } finally {
                if (id != null) {
                    val completed = albumUploader.completeSessionAlbum(id)
                    synchronized(this@RealSessionEngine) { if (sid == session && tokenForUpload == epoch) albumCompleted = completed }
                }
                synchronized(this@RealSessionEngine) {
                    if (sid == session && tokenForUpload == epoch && result.albumUrl != null) albumUrl = result.albumUrl
                }
            }
        }
        return snapshot().apply {
            addProperty("dryRun", dryRun)
            addProperty("printSignalTransmitted", !dryRun && enabled && printAccepted)
            addProperty("printerName", if (dryRun) "" else name)
            addProperty("targetPrinter", if (dryRun) "" else name)
            if (dryRun) addProperty("printStatus", "Đã tạo bản in; không gửi lệnh in vật lý (chế độ DEMO)")
        }
    }
    private fun reset() { epoch++; job?.cancel(false); stopInactivity(); albumJob?.cancel(true); albumJob = null; uploadJob?.cancel(true); uploadJob = null
        compositionCache.clear(); beautyJobs.forEach { it.cancel(true) }; beautyJobs.clear(); readyBeauty.clear()
        activeSequence = false; remaining = 0; failure = null; stopPreview(); state = "IDLE"; paid = false; orderCode = null; qrCode = null
        shots.clear(); selected.clear(); frame = null; printImage = null; composition = null; albumUrl = null; albumId = null
        printAccepted = false; revenueRecorded = false; printStatusMessage = null; videoGenerated = false; videoUploaded = false; albumCompleted = false; paymentMethod = "PAYOS" }
    @Synchronized override fun close() { epoch++; job?.cancel(true); stopInactivity(); albumJob?.cancel(true); uploadJob?.cancel(true); compositionCache.clear(); beautyJobs.forEach { it.cancel(true) }
        executor.shutdownNow(); albumExecutor.shutdownNow(); beautyExecutor.shutdownNow(); cameraManager.close(); beauty.close()
        listOf(executor, albumExecutor, beautyExecutor).forEach { runCatching { it.awaitTermination(5, TimeUnit.SECONDS) } }
    }
    private fun cloudStatus(): Map<String, Any> {
        val configured = boothConfig.status()
        return configured + mapOf("payOsConfigured" to (payOs?.isConfigured == true),
        "catalogSource" to firebaseCatalog.source.name,
        "payOsStatus" to (payOs?.readiness?.name ?: "CONFIG_MISSING"),
        "cloudinaryConfigured" to (cloudinary != null || configured["cloudinaryConfigured"] == true),
        "webAlbumConfigured" to (album != null || configured["webAlbumConfigured"] == true),
        "revenueEndpointConfigured" to (revenue != null || configured["revenueEndpointConfigured"] == true),
        "canUploadAlbum" to (configured["canUploadAlbum"] == true),
        "databaseConfigured" to (configured["databaseConfigured"] == true),
        "cloudSyncReady" to (configured["canUploadAlbum"] == true || configured["databaseConfigured"] == true))
    }

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
            val systemPrintEnabled = config.enabled("ENABLE_SYSTEM_PRINT") ||
                runCatching { OperatorSettingsStore(workspace).settings["enableSystemPrint"]?.asBoolean == true }.getOrDefault(false)
            return RealSessionEngine(workspace, camera, PrinterManager(LegacyPrinter(PrintAuthorization { true }), dryRun = !systemPrintEnabled),
                SqliteSalesRepository(workspace), payOs = payOs, revenue = revenue,
                album = album, cloudinary = cloudinary, printerName = config.get("PRINTER_NAME_STRIP"),
                boothId = config.get("BOOTH_ID"), boothConfig = config, operatorAuthorized = { true })
        }
    }
}
