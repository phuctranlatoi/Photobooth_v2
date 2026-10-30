package com.lesouvenir.v2.ipc

import com.google.gson.*
import com.lesouvenir.v2.foundation.*
import com.lesouvenir.v2.camera.simulator.SimulatorCamera
import com.lesouvenir.v2.printing.SimulatorCompositor
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.nio.file.*
import java.util.*
import java.util.concurrent.*
import javax.imageio.ImageIO

class SimulatorError(val code: Int, message: String): RuntimeException(message)

/** One authoritative, explicitly synthetic session. No production adapters or unsolicited frames. */
class SimulatorSessionEngine(
    private val workspace: Path,
    private val config: JsonObject,
    private val enabled: Boolean,
    private val tickMillis: Long = 1000,
    private val prepareMillis: Long = 1600,
    private val inactivityMillis: Long = config["inactivitySeconds"].asLong * 1000,
    private val outputRoot: Path = workspace.resolve("backend/build/simulator-sessions")
): AutoCloseable {
    private val gson = GsonBuilder().serializeNulls().create()
    private val layouts = config["layouts"].asJsonArray.map { value ->
        val o = value.asJsonObject
        val size = o["printSizeLabel"].asString
        val defaults = LayoutMode(o["id"].asString, o["title"].asString, "Synthetic fixture", "Generated V2 test assets; no real bundle", LayoutFamily.valueOf(o["family"].asString),
            o["shotCount"].asInt, o["selectCount"].asInt, o["countdownSeconds"].asInt,
            PricingCalculator.calculatePrice(size, 2).basePrice, "Synthetic", 0xffeeeeee,
            gridColumns=o["gridColumns"].asInt, printSizeLabel=size, printAspectRatio=if(size=="5x15") 1f/3 else 2f/3)
        val merged=gson.toJsonTree(defaults).asJsonObject
        o.entrySet().forEach { merged.add(it.key,it.value) }
        gson.fromJson(merged,LayoutMode::class.java)
    }
    private val executor = Executors.newSingleThreadScheduledExecutor { r -> Thread(r, "v2-simulator-session").apply { isDaemon=true } }
    private val camera by lazy { SimulatorCamera(SimulatorAuthorization(enabled), workspace, config["sourceCount"].asInt,
        config["captureWidth"].asInt, config["captureHeight"].asInt, config["previewWidth"].asInt, config["previewHeight"].asInt) }
    private var sid = ""
    private var generation = ""
    private var epoch = 0L
    private var state = "IDLE"
    private var layout = layouts.first()
    private var quantity = 2
    private var paid = false
    private var remaining = 0
    private var activeSequence = false
    private var activity = System.nanoTime()
    private var failure: String? = null
    private val shots = mutableListOf<Path>()
    private val selected = linkedSetOf<Int>()
    private var frameId: String? = null
    private var composition: Path? = null
    private var printImage: Path? = null
    private var userConfirmed = false
    private val seenSessions = mutableSetOf<String>()
    private val dedup = linkedMapOf<String, Pair<String, JsonObject>>()
    private var job: ScheduledFuture<*>? = null
    init {
        require(layouts.isNotEmpty() && layouts.map { it.id }.distinct().size == layouts.size)
        layouts.forEach { require(it.shotCount in 1..12 && it.selectCount in 1..it.shotCount && it.countdownSeconds in 0..30) }
        require(outputRoot.toAbsolutePath().normalize().startsWith(workspace.toAbsolutePath().normalize()))
        executor.scheduleWithFixedDelay({ synchronized(this) {
            if (state in setOf("SELECTING_PHOTOS", "EDITING") && TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-activity) >= inactivityMillis) {
                try {
                    shots.indices.forEach { if(selected.size < layout.selectCount) selected.add(it) }
                    frameId = frameId ?: "synthetic-border"
                    complete(false)
                } catch (_: Exception) { failure="Composition failed"; state="RECOVERY" }
            }
        } }, 25, 25, TimeUnit.MILLISECONDS)
    }
    private fun obj(vararg pairs: Pair<String, Any?>): JsonObject = gson.toJsonTree(mapOf(*pairs)).asJsonObject
    private fun bad(code: Int, message: String): Nothing = throw SimulatorError(code,message)
    private fun guard(vararg allowed: String) { if(state !in allowed) bad(-32001,"Command not allowed in current state") }
    private fun uuid(value: String) { if(!value.matches(Regex("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}"))) bad(-32602,"UUID v4 required") }
    private fun text(p: JsonObject, key: String): String = p[key]?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }?.asString ?: bad(-32602,"String parameter required")
    private fun number(p: JsonObject, key: String): Int { val v=p[key] ?: bad(-32602,"Integer required"); if(!v.toString().matches(Regex("-?[0-9]{1,8}"))) bad(-32602,"Integer required"); return v.asInt }
    private fun directory() = outputRoot.resolve(sid)
    private fun snapshot(): JsonObject {
        val live = if(enabled && state in setOf("LIVE_VIEW","COUNTDOWN")) {
            camera.publishPreview(shots.size % config["sourceCount"].asInt)
            camera.latestPreview()?.jpeg?.let { "data:image/jpeg;base64,"+Base64.getEncoder().encodeToString(it) }
        } else null
        return obj("sessionId" to sid,"generationId" to generation,"state" to state,"layout" to layout,
        "pricing" to PricingCalculator.calculatePrice(layout.printSizeLabel,quantity),"quantity" to quantity,"paid" to paid,
        "capturedCount" to shots.size,"selectedCount" to selected.size,"selectedIndices" to selected.toList(),
        "shotIndex" to (shots.size+1).coerceAtMost(layout.shotCount),"secondsRemaining" to remaining,"totalShots" to layout.shotCount,
        "shots" to shots.mapIndexed { index,path -> mapOf("shotIndex" to index,"shotId" to "shot-$index","preview" to data(path,240)) },
        "previewDataUrl" to printImage?.let { data(it,600) }, "compositionDataUrl" to composition?.let { data(it,600) },
        "printImageDataUrl" to printImage?.let { data(it,600) }, "frameId" to frameId,"userConfirmed" to userConfirmed,
        "printAccepted" to false,"revenueRecorded" to false,"simulator" to true,"failure" to failure,"livePreviewDataUrl" to live)
    }

    @Synchronized fun dispatch(method: String, p: JsonObject): JsonObject {
        val fields = schemas[method] ?: bad(-32601,"Method not found")
        val extra = p.keySet() - fields - setOf("generationId")
        if(extra.isNotEmpty() || !p.keySet().containsAll(fields)) bad(-32602,"Invalid parameters")
        if(method=="catalog.get") return obj("layouts" to layouts,"defaultLayoutId" to config["defaultLayoutId"].asString,
            "sourceCount" to config["sourceCount"].asInt,"previewWidth" to config["previewWidth"].asInt,"previewHeight" to config["previewHeight"].asInt,
            "captureWidth" to config["captureWidth"].asInt,"captureHeight" to config["captureHeight"].asInt,"simulator" to true,
            "pricing" to mapOf("stripBasePrice" to 70000,"stripUnitPrice" to 20000,"printBasePrice" to 90000,"printUnitPrice" to 30000,
                "stripAllowedQuantities" to PricingCalculator.allowedOptions("5x15"),"printAllowedQuantities" to PricingCalculator.allowedOptions("10x15")))
        if(method=="device.getStatus") return obj("camera" to mapOf("connected" to enabled,"name" to "Simulator","liveViewActive" to (state=="LIVE_VIEW")),
            "printer" to mapOf("available" to false,"queueLength" to 0),"beauty" to mapOf("modelsLoaded" to false),
            "ipc" to mapOf("backendPid" to ProcessHandle.current().pid(),"uptimeMs" to java.lang.management.ManagementFactory.getRuntimeMXBean().uptime))
        val requested = text(p,"sessionId"); uuid(requested)
        val gen = if(p.has("generationId")) text(p,"generationId").also { uuid(it) } else ""
        if(method=="session.start" && ((requested==sid && gen!=generation) || (requested!=sid && requested in seenSessions))) bad(-32004,"Stale session or generation")
        if(method!="session.start" && (requested!=sid || gen!=generation)) bad(-32004,"Stale session or generation")
        val mutation = method !in setOf("session.getState","frame.list")
        val cid = if(mutation) text(p,"commandId").also { uuid(it) } else ""
        val signature = method + p.toString()
        val key = "$requested:$cid"
        if(mutation) dedup[key]?.let { if(it.first!=signature) bad(-32602,"commandId reused with different request"); return it.second.deepCopy() }
        if(mutation && dedup.size>=2048) bad(-32004,"Command limit reached; restart simulator")
        var result: JsonObject? = null
        when(method) {
            "session.start" -> {
                if(requested==sid && state!="IDLE" && gen==generation) return snapshot().apply { addProperty("commandId",cid) }
                guard("IDLE")
                if(requested in seenSessions) bad(-32004,"Session ID already used")
                val chosen=layouts.find { it.id==text(p,"layoutId") } ?: bad(-32602,"Unknown layout")
                reset(); sid=requested; generation=gen; seenSessions.add(sid); layout=chosen; state="SELECTING"
                Files.createDirectories(directory())
            }
            "session.getState" -> return snapshot()
            "session.setLayout" -> { guard("SELECTING"); layout=layouts.find { it.id==text(p,"layoutId") } ?: bad(-32602,"Unknown layout"); quantity=2 }
            "session.setQuantity" -> { guard("SELECTING_QUANTITY"); val n=number(p,"quantity"); if(n !in 2..50) bad(-32602,"Quantity out of range"); quantity=PricingCalculator.sanitizeQuantity(layout.printSizeLabel,n); state="PAYMENT_PENDING" }
            "session.confirmSetup" -> { guard("SELECTING"); state="SELECTING_QUANTITY" }
            "payment.mockComplete" -> { guard("PAYMENT_PENDING"); paid=true; state="PREPARING"; schedule(prepareMillis) { state="LIVE_VIEW" }; result=obj("paid" to true) }
            "capture.startSequence" -> {
                guard("LIVE_VIEW"); if(!paid) bad(-32002,"Mock payment required"); if(!enabled) bad(-32000,"Simulator capture disabled")
                if(activeSequence) bad(-32004,"Capture active")
                shots.clear(); selected.clear(); activeSequence=true; countdown()
                result=obj("shotIndex" to 1,"totalShots" to layout.shotCount,"countdownSeconds" to layout.countdownSeconds)
            }
            "selection.toggle" -> { guard("SELECTING_PHOTOS"); val i=number(p,"shotIndex"); if(i !in shots.indices) bad(-32602,"Invalid shot index"); val before=selected.toList(); if(!selected.remove(i) && selected.size<layout.selectCount) selected.add(i); if(before!=selected.toList()) { composition=null; printImage=null; frameId=null } }
            "selection.confirm" -> { guard("SELECTING_PHOTOS"); if(selected.size!=layout.selectCount) bad(-32001,"Exact selection required"); state="EDITING" }
            "frame.list" -> { guard("EDITING"); return obj("frames" to listOf(mapOf("id" to "synthetic-border","name" to "V2 generated transparent test frame","thumbDataUrl" to frameThumb()))) }
            "frame.select" -> { guard("EDITING"); if(text(p,"frameId")!="synthetic-border") bad(-32602,"Unknown frame"); frameId="synthetic-border"; compose() }
            "frame.confirm" -> { guard("EDITING"); if(frameId==null || composition==null || printImage==null) bad(-32001,"Complete current composition required"); state="PRINT_PENDING" }
            "print.confirmDryRun" -> { guard("PRINT_PENDING"); complete(true); result=snapshot().apply { addProperty("compositionDataUrl",data(composition!!,600)); addProperty("printImageDataUrl",data(printImage!!,600)) } }
            "session.back" -> { state=when(state) { "SELECTING" -> "IDLE"; "SELECTING_QUANTITY" -> "SELECTING"; "PAYMENT_PENDING" -> "SELECTING_QUANTITY"; "EDITING" -> "SELECTING_PHOTOS"; "PRINT_PENDING" -> "EDITING"; else -> bad(-32001,"Back not permitted") }; if(state=="IDLE") reset() }
            "session.cancel" -> { guard("SELECTING_PHOTOS","EDITING"); reset(); result=obj("cancelled" to true,"state" to state) }
            "session.finish" -> { guard("DELIVERY"); reset() }
        }
        activity=System.nanoTime()
        val answer=(result ?: snapshot()).apply { addProperty("commandId",cid) }
        if(mutation) dedup[key]=signature to answer.deepCopy()
        return answer
    }
    private fun reset() { epoch++; job?.cancel(false); activeSequence=false; state="IDLE"; shots.clear(); selected.clear(); paid=false; quantity=2; frameId=null; composition=null; printImage=null; failure=null; remaining=0; userConfirmed=false }
    private fun schedule(delay: Long, action: () -> Unit) {
        val token=epoch; val id=sid
        job=executor.schedule({ synchronized(this) { if(token==epoch && id==sid) try { action() } catch (_: Exception) { failure="Synthetic processing failed"; activeSequence=false; state="RECOVERY" } } },delay,TimeUnit.MILLISECONDS)
    }
    private fun countdown() { state="COUNTDOWN"; remaining=layout.countdownSeconds; schedule(if(remaining==0) 0 else tickMillis) { step() } }
    private fun step() {
        if(remaining>0) remaining--
        if(remaining>0) schedule(tickMillis) { step() } else {
            state="CAPTURING"
            schedule(1) {
                val shot=camera.capture(shots.size % config["sourceCount"].asInt,directory(),"shot-${UUID.randomUUID()}")
                shots.add(shot.original)
                if(shots.size==layout.shotCount) { state="SELECTING_PHOTOS"; activeSequence=false; activity=System.nanoTime() }
                else { state="LIVE_VIEW"; schedule(1) { countdown() } }
            }
        }
    }
    private fun frame(): BufferedImage {
        val image=BufferedImage(240,360,BufferedImage.TYPE_INT_ARGB)
        val g=image.createGraphics()
        try { g.color=Color(130,35,75,255); g.fillRect(0,0,240,5); g.fillRect(0,355,240,5); g.fillRect(0,0,5,360); g.fillRect(235,0,5,360) } finally { g.dispose() }
        return image
    }
    private fun frameThumb(): String { val out=ByteArrayOutputStream(); ImageIO.write(frame(),"png",out); return "data:image/png;base64,"+Base64.getEncoder().encodeToString(out.toByteArray()) }
    private fun compose() {
        composition=null; printImage=null
        val overlay=directory().resolve("synthetic-transparent-frame.png"); ImageIO.write(frame(),"png",overlay.toFile())
        val token=UUID.randomUUID().toString()
        val c=directory().resolve("composition-$token.png"); val p=directory().resolve("print-image-$token.png")
        SimulatorCompositor.generate(layout,selected.map { ImageIO.read(shots[it].toFile()) ?: error("Corrupt original") },ImageIO.read(overlay.toFile()),c,p)
        // Publish only after both complete outputs decode successfully.
        check(ImageIO.read(c.toFile())!=null && ImageIO.read(p.toFile())!=null)
        composition=c; printImage=p
    }
    private fun complete(manual: Boolean) { compose(); userConfirmed=manual; state="DELIVERY" }
    private fun data(path: Path, max: Int): String {
        val image=ImageIO.read(path.toFile()) ?: error("Corrupt image")
        val scale=minOf(1.0,max.toDouble()/maxOf(image.width,image.height))
        val thumb=BufferedImage(maxOf(1,(image.width*scale).toInt()),maxOf(1,(image.height*scale).toInt()),BufferedImage.TYPE_INT_RGB)
        val g=thumb.createGraphics(); try { g.color=Color.WHITE; g.fillRect(0,0,thumb.width,thumb.height); g.drawImage(image,0,0,thumb.width,thumb.height,null) } finally { g.dispose() }
        val out=ByteArrayOutputStream(); check(ImageIO.write(thumb,"jpeg",out)); return "data:image/jpeg;base64,"+Base64.getEncoder().encodeToString(out.toByteArray())
    }
    @Synchronized override fun close() { epoch++; job?.cancel(true); executor.shutdownNow() }
    companion object {
        val schemas = mapOf(
            "catalog.get" to emptySet(), "device.getStatus" to emptySet(),
            "session.getState" to setOf("sessionId"),"frame.list" to setOf("sessionId"),
            "session.start" to setOf("sessionId","commandId","layoutId"),
            "session.setLayout" to setOf("sessionId","commandId","layoutId"),
            "session.setQuantity" to setOf("sessionId","commandId","quantity"),
            "selection.toggle" to setOf("sessionId","commandId","shotIndex"),
            "frame.select" to setOf("sessionId","commandId","frameId")
        ) + listOf("session.confirmSetup","session.cancel","session.finish","session.back","payment.mockComplete","capture.startSequence","selection.confirm","frame.confirm","print.confirmDryRun").associateWith { setOf("sessionId","commandId") }
        fun production(): SimulatorSessionEngine {
            val location=Path.of(SimulatorSessionEngine::class.java.protectionDomain.codeSource.location.toURI()).toAbsolutePath()
            var root: Path? = location
            while(root!=null && root.fileName?.toString()!="PhotoboothDesktop_v2") root=root.parent
            val workspace=root ?: error("V2 workspace unavailable")
            val config=JsonParser.parseString(Files.readString(workspace.resolve("backend/config/simulator-layouts.json"))).asJsonObject
            return SimulatorSessionEngine(workspace,config,System.getenv("SIMULATOR_CAPTURE_ENABLED")=="true")
        }
    }
}
