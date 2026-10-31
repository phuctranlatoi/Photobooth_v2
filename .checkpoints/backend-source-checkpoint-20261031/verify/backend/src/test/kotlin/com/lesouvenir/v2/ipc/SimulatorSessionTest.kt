package com.lesouvenir.v2.ipc

import com.google.gson.*
import java.nio.file.*
import java.security.MessageDigest
import java.util.UUID
import javax.imageio.ImageIO
import kotlin.test.*

class SimulatorSessionTest {
    private val root=Path.of("..").toRealPath()
    private fun config()=JsonParser.parseString(Files.readString(Path.of("config/simulator-layouts.json"))).asJsonObject
    private fun id()=UUID.randomUUID().toString()
    private class Client(val engine: SimulatorSessionEngine) {
        val sid=UUID.randomUUID().toString(); val gen=UUID.randomUUID().toString()
        fun params(vararg pairs: Pair<String,Any>)=Gson().toJsonTree(mapOf("sessionId" to sid,"generationId" to gen,"commandId" to UUID.randomUUID().toString())+mapOf(*pairs)).asJsonObject
        fun call(method:String,vararg pairs:Pair<String,Any>):JsonObject {
            val p=params(*pairs)
            if(method in setOf("session.getState","frame.list")) p.remove("commandId")
            return engine.dispatch(method,p)
        }
        fun state()=call("session.getState")["state"].asString
        fun waitFor(target:String) { val end=System.nanoTime()+10_000_000_000; while(state()!=target && System.nanoTime()<end) Thread.sleep(10); assertEquals(target,state()) }
        fun capture(layout:String) {
            call("session.start","layoutId" to layout)
            call("session.confirmSetup")
            call("session.setQuantity","quantity" to 3)
            call("payment.mockComplete"); waitFor("LIVE_VIEW")
            assertTrue(call("session.getState")["livePreviewDataUrl"].asString.startsWith("data:image/jpeg;base64,"))
            call("capture.startSequence"); waitFor("SELECTING_PHOTOS")
        }
    }
    @Test fun twoLayoutsRealFilesDedupStaleAndLegalGates() {
        for(layout in listOf("strip-2","grid-4")) {
            val out=root.resolve("backend/build/session-test-${id()}")
            SimulatorSessionEngine(root,config(),true,1,1,60000,out).use { engine ->
                val c=Client(engine); c.capture(layout)
                val dir=out.resolve(c.sid)
                val originals=Files.list(dir).use { it.filter { p->p.fileName.toString().startsWith("original-") }.toList() }
                assertEquals(if(layout=="strip-2") 3 else 5, originals.size)
                fun hashes()=originals.map { MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(it)).toList() }
                val before=hashes()
                val n=if(layout=="strip-2") 2 else 4
                repeat(n) { c.call("selection.toggle","shotIndex" to it) }
                c.call("selection.confirm")
                c.call("frame.select","frameId" to "synthetic-border")
                c.call("frame.confirm")
                val p=c.params(); val first=engine.dispatch("print.confirmDryRun",p)
                assertEquals(first,engine.dispatch("print.confirmDryRun",p))
                assertEquals(-32602,assertFailsWith<SimulatorError> { engine.dispatch("session.back",p) }.code)
                assertEquals("DELIVERY",first["state"].asString)
                assertFalse(first["printAccepted"].asBoolean); assertFalse(first["revenueRecorded"].asBoolean)
                assertTrue(first["userConfirmed"].asBoolean)
                assertEquals(-32001,assertFailsWith<SimulatorError> { c.call("print.confirmDryRun") }.code)
                assertEquals(before,hashes())
                fun output(prefix:String)=Files.list(dir).use { it.filter { p->p.fileName.toString().startsWith(prefix) }.findFirst().orElseThrow() }
                val comp=ImageIO.read(output("composition-").toFile()); assertEquals(if(n==2)1184 else 2368,comp.width); assertEquals(3580,comp.height)
                val paper=ImageIO.read(output("print-image-").toFile()); assertEquals(2452,paper.width); assertEquals(3658,paper.height)
                assertTrue(ImageIO.read(dir.resolve("synthetic-transparent-frame.png").toFile()).colorModel.hasAlpha())
                assertTrue(first.toString().toByteArray().size<MAX_FRAME)
                c.call("session.finish"); assertEquals("IDLE",c.state())
                assertEquals(-32004,assertFailsWith<SimulatorError> { engine.dispatch("session.getState",c.params().apply { remove("commandId"); addProperty("generationId",UUID.randomUUID().toString()) }) }.code)
                println("$layout originals=${originals.size}; original hashes unchanged; composition=${comp.width}x${comp.height}; paper=${paper.width}x${paper.height}; dryrun accepted=false revenue=false")
            }
        }
    }
    @Test fun timeoutAutoPrintNoSaleAndCancelMatrix() {
        SimulatorSessionEngine(root,config(),true,1,1,500,root.resolve("backend/build/timeout-${id()}")).use { e ->
            val c=Client(e); c.capture("strip-2"); c.waitFor("DELIVERY")
            val snap=c.call("session.getState"); assertFalse(snap["userConfirmed"].asBoolean); assertFalse(snap["revenueRecorded"].asBoolean)
        }
        SimulatorSessionEngine(root,config(),true,1,30,60000,root.resolve("backend/build/cancel-${id()}")).use { e ->
            val c=Client(e); c.call("session.start","layoutId" to "strip-2")
            for(target in listOf("SELECTING_QUANTITY","PAYMENT_PENDING")) {
                assertEquals(-32001,assertFailsWith<SimulatorError> { c.call("session.cancel") }.code)
                assertEquals(-32001,assertFailsWith<SimulatorError> { c.call("session.finish") }.code)
                if(target=="SELECTING_QUANTITY") c.call("session.confirmSetup") else c.call("session.setQuantity","quantity" to 2)
            }
            c.call("session.back"); assertEquals("SELECTING_QUANTITY",c.state())
            c.call("session.setQuantity","quantity" to 2); c.call("payment.mockComplete")
            assertEquals(-32001,assertFailsWith<SimulatorError> { c.call("session.cancel") }.code)
            c.waitFor("LIVE_VIEW"); c.call("capture.startSequence"); c.waitFor("SELECTING_PHOTOS")
            c.call("session.cancel"); assertEquals("IDLE",c.state())
        }
    }
    @Test fun strictDispatcherAndDisabledCapture() {
        SimulatorSessionEngine(root,config(),false,1,1,60000).use { e ->
            val bridge=HealthBridge(e)
            val req="""{"jsonrpc":"2.0","id":"catalog","method":"catalog.get","params":{},"protocolVersion":1}"""
            assertEquals(2,bridge.response(req.toByteArray())["result"].asJsonObject["layouts"].asJsonArray.size())
            assertEquals(-32601,e.run { assertFailsWith<SimulatorError> { dispatch("print.confirmReal",JsonObject()) }.code })
            for(method in listOf("session.transition","capture.abort","session.reset")) assertEquals(-32601,assertFailsWith<SimulatorError> { e.dispatch(method,JsonObject()) }.code)
            val c=Client(e); c.call("session.start","layoutId" to "strip-2"); c.call("session.confirmSetup"); c.call("session.setQuantity","quantity" to 2); c.call("payment.mockComplete"); c.waitFor("LIVE_VIEW")
            assertEquals(-32000,assertFailsWith<SimulatorError> { c.call("capture.startSequence") }.code)
        }
    }
    @Test fun changingSelectionInvalidatesArtifactsAndFailedCompositionCannotConfirm() {
        val out=root.resolve("backend/build/stale-artifact-${id()}")
        SimulatorSessionEngine(root,config(),true,1,1,60000,out).use { e ->
            val c=Client(e); c.capture("strip-2")
            c.call("selection.toggle","shotIndex" to 0); c.call("selection.toggle","shotIndex" to 1)
            c.call("selection.confirm"); c.call("frame.select","frameId" to "synthetic-border")
            assertFalse(c.call("session.getState")["previewDataUrl"].isJsonNull)
            c.call("session.back"); c.call("selection.toggle","shotIndex" to 0); c.call("selection.toggle","shotIndex" to 2)
            assertTrue(c.call("session.getState")["previewDataUrl"].isJsonNull)
            c.call("selection.confirm")
            assertEquals(-32001,assertFailsWith<SimulatorError> { c.call("frame.confirm") }.code)
            c.call("frame.select","frameId" to "synthetic-border")
            // Simulate unavailable decoder input without corrupting an original: replace fixture overlay output directory.
            val overlay=out.resolve(c.sid).resolve("synthetic-transparent-frame.png")
            Files.delete(overlay); Files.createDirectory(overlay)
            Files.writeString(overlay.resolve("block-write.txt"),"synthetic failure fixture")
            assertFails { c.call("frame.select","frameId" to "synthetic-border") }
            assertTrue(c.call("session.getState")["previewDataUrl"].isJsonNull)
            assertEquals(-32001,assertFailsWith<SimulatorError> { c.call("frame.confirm") }.code)
        }
    }
}
