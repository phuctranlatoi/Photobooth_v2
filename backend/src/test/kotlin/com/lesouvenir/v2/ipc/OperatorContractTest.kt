package com.lesouvenir.v2.ipc

import com.google.gson.*
import java.nio.file.*
import java.util.UUID
import java.awt.image.BufferedImage
import javax.imageio.ImageIO
import kotlin.test.*

class OperatorContractTest {
    @Test fun operatorFrameStatusAndExplicitReload() {
        val root = fixture()
        SimulatorSessionEngine(root, config(), false, localOperatorEnabled = true).use { engine ->
            assertEquals(0, engine.dispatch("operator.getStatus", JsonObject())["frames"].asJsonArray.size())
            val image = root.resolve("data/frames/10x15/layout/Standard/new.png")
            Files.createDirectories(image.parent)
            ImageIO.write(BufferedImage(8, 8, BufferedImage.TYPE_INT_ARGB), "png", image.toFile())
            assertEquals(-32602, assertFailsWith<SimulatorError> {
                engine.dispatch("operator.reloadFrames", JsonObject().apply { addProperty("unexpected", true) })
            }.code)
            val frames = engine.dispatch("operator.reloadFrames", JsonObject())["frames"].asJsonArray
            assertEquals(1, frames.size())
            val frame = frames[0].asJsonObject
            assertEquals("10x15/layout/Standard/new", frame["id"].asString)
            assertEquals("new", frame["title"].asString)
            assertEquals("10x15", frame["targetPrintSize"].asString)
            assertEquals("layout", frame["targetLayoutId"].asString)
            assertFalse(frame["isSpecial"].asBoolean)
            assertEquals("", frame["specialEventName"].asString)
            assertTrue(frame["thumbDataUrl"].asString.startsWith("data:image/png;base64,"))
            assertEquals(frames, engine.dispatch("operator.getStatus", JsonObject())["frames"].asJsonArray)
        }
    }
    private fun config()=JsonParser.parseString(Files.readString(Path.of("config/simulator-layouts.json"))).asJsonObject
    private fun fixture(): Path {
        val parent=Path.of("build/operator-tests/${UUID.randomUUID()}").toAbsolutePath()
        return Files.createDirectories(parent.resolve("PhotoboothDesktop_v2"))
    }
    private fun patch()=JsonParser.parseString("""{"layoutId":"strip-2","shotCount":7,"selectCount":3,"countdownSeconds":4}""").asJsonObject
    @Test fun framedAccessGuardAndOptIn() {
        val root=fixture()
        fun request(method: String, params: JsonObject=JsonObject())=JsonObject().apply {
            addProperty("jsonrpc","2.0"); addProperty("id","operator-test"); addProperty("protocolVersion",1)
            addProperty("method",method); add("params",params)
        }.toString().toByteArray()
        SimulatorSessionEngine(root,config(),false).use {
            assertEquals(-32010,HealthBridge(it).response(request("operator.getStatus"))["error"].asJsonObject["code"].asInt)
        }
        SimulatorSessionEngine(root,config(),false,localOperatorEnabled=true).use {
            val bridge=HealthBridge(it)
            assertEquals("LOCAL_DEVELOPMENT_ONLY",bridge.response(request("operator.getStatus"))["result"].asJsonObject["accessMode"].asString)
            assertTrue(bridge.response(request("operator.updateLayout",patch()))["result"].asJsonObject["saved"].asBoolean)
        }
    }
    @Test fun disabledByDefaultAndExactParameters() {
        val root=fixture()
        SimulatorSessionEngine(root,config(),false).use { engine ->
            assertEquals(-32010,assertFailsWith<SimulatorError> { engine.dispatch("operator.getStatus",JsonObject()) }.code)
        }
        SimulatorSessionEngine(root,config(),false,localOperatorEnabled=true).use { engine ->
            val p=patch(); p.addProperty("price",1)
            assertEquals(-32602,assertFailsWith<SimulatorError> { engine.dispatch("operator.updateLayout",p) }.code)
            val status=engine.dispatch("operator.getStatus",JsonObject())
            assertFalse(status["productionAdminAcl"].asBoolean)
            assertFalse(status["pricingEditable"].asBoolean)
            assertTrue(status["cloud"].asJsonObject["cloudSyncReady"].asBoolean)
            assertTrue(status["cloud"].asJsonObject["simulator"].asBoolean)
            assertTrue(status["printer"].asJsonObject["detected"].asBoolean)
            assertFalse(status["camera"].asJsonObject["connected"].asBoolean)
        }
    }
    @Test fun atomicPersistenceRestartValidationAndBusyGuard() {
        val root=fixture(); val file=root.resolve("backend/config/local-operator-layouts.json")
        SimulatorSessionEngine(root,config(),true,prepareMillis=1,localOperatorEnabled=true).use { engine ->
            engine.dispatch("operator.updateLayout",patch())
            val saved=Files.readString(file)
            val invalid=patch().apply { addProperty("selectCount",8) }
            assertFailsWith<SimulatorError> { engine.dispatch("operator.updateLayout",invalid) }
            assertEquals(saved,Files.readString(file))
            val start=JsonObject().apply {
                addProperty("sessionId",UUID.randomUUID().toString()); addProperty("generationId",UUID.randomUUID().toString())
                addProperty("commandId",UUID.randomUUID().toString()); addProperty("layoutId","strip-2")
            }
            assertEquals(7,engine.dispatch("session.start",start)["layout"].asJsonObject["shotCount"].asInt)
            assertEquals(-32001,assertFailsWith<SimulatorError> { engine.dispatch("operator.updateLayout",patch()) }.code)
            assertEquals(saved,Files.readString(file))
            fun command(method: String, key: String?=null, value: Int=0) {
                val p=start.deepCopy(); p.remove("layoutId"); p.addProperty("commandId",UUID.randomUUID().toString())
                if(key!=null) p.addProperty(key,value)
                engine.dispatch(method,p)
            }
            command("session.confirmSetup"); command("session.setQuantity","quantity",2); command("payment.mockComplete")
            val stateParams=start.deepCopy().apply { remove("layoutId"); remove("commandId") }
            val end=System.nanoTime()+2_000_000_000
            while(engine.dispatch("session.getState",stateParams)["state"].asString!="LIVE_VIEW" && System.nanoTime()<end) Thread.sleep(2)
            command("capture.startSequence")
            assertEquals(-32001,assertFailsWith<SimulatorError> { engine.dispatch("operator.updateLayout",patch()) }.code)
            assertEquals(saved,Files.readString(file))
        }
        SimulatorSessionEngine(root,config(),false,localOperatorEnabled=true).use { engine ->
            val layout=engine.dispatch("catalog.get",JsonObject())["layouts"].asJsonArray[0].asJsonObject
            assertEquals(7,layout["shotCount"].asInt); assertEquals(3,layout["selectCount"].asInt); assertEquals(4,layout["countdownSeconds"].asInt)
        }
        Files.writeString(file,"corrupted")
        assertFails { SimulatorSessionEngine(root,config(),false,localOperatorEnabled=true) }
    }
}
