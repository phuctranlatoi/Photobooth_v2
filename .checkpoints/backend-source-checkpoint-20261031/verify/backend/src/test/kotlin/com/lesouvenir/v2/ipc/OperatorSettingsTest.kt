package com.lesouvenir.v2.ipc

import com.google.gson.*
import java.nio.file.*
import java.util.UUID
import kotlin.test.*

class OperatorSettingsTest {
    @Test fun persistedZeroPhotoTimeoutCompletesSyntheticWithoutFinancialSideEffects() {
        val root=root()
        val store=OperatorSettingsStore(root)
        store.update(store.settings.deepCopy().apply { addProperty("photoSelectionTimeoutSeconds",0); addProperty("frameSelectionTimeoutSeconds",3600) })
        val cfg=config()
        cfg["layouts"].asJsonArray.forEach { it.asJsonObject.addProperty("countdownSeconds",0) }
        SimulatorSessionEngine(root,cfg,true,prepareMillis=1,localOperatorEnabled=true).use { engine ->
            val session=UUID.randomUUID().toString()
            fun call(method: String, extra: JsonObject=JsonObject()): JsonObject {
                val p=extra.deepCopy(); p.addProperty("sessionId",session)
                if(method!="session.getState") p.addProperty("commandId",UUID.randomUUID().toString())
                return engine.dispatch(method,p)
            }
            call("session.start",JsonObject().apply { addProperty("layoutId","strip-2") })
            call("session.confirmSetup")
            call("session.setQuantity",JsonObject().apply { addProperty("quantity",2) })
            call("payment.mockComplete")
            fun awaitState(wanted: String): JsonObject {
                val deadline=System.nanoTime()+10_000_000_000
                var latest=call("session.getState")
                while(latest["state"].asString!=wanted && System.nanoTime()<deadline) { Thread.sleep(5); latest=call("session.getState") }
                assertEquals(wanted,latest["state"].asString)
                return latest
            }
            awaitState("LIVE_VIEW"); call("capture.startSequence")
            val done=awaitState("DELIVERY")
            assertFalse(done["userConfirmed"].asBoolean)
            assertFalse(done["printAccepted"].asBoolean)
            assertFalse(done["revenueRecorded"].asBoolean)
            assertEquals(done["layout"].asJsonObject["selectCount"].asInt,done["selectedCount"].asInt)
        }
    }
    private fun root() = Files.createDirectories(Path.of("build/settings-tests/${UUID.randomUUID()}/PhotoboothDesktop_v2").toAbsolutePath())
    private fun config() = JsonParser.parseString(Files.readString(Path.of("config/simulator-layouts.json"))).asJsonObject
    @Test fun saveReloadInvalidAndNoHardwareAuthorization() {
        val root=root(); val store=OperatorSettingsStore(root)
        assertEquals(90,store.settings["photoSelectionTimeoutSeconds"].asInt)
        val desired=store.settings.deepCopy().apply {
            addProperty("enableSystemPrint",true); addProperty("photoSelectionTimeoutSeconds",3600)
            addProperty("frameSelectionTimeoutSeconds",0)
        }
        store.update(desired)
        assertEquals(desired,OperatorSettingsStore(root).settings)
        assertTrue(store.response()["productionGates"].asJsonObject.entrySet().all { !it.value.asBoolean })
        val file=root.resolve("backend/config/operator-settings.json"); val before=Files.readString(file)
        listOf(JsonPrimitive(-1),JsonPrimitive(3601),JsonPrimitive(1.5),JsonPrimitive("90"),JsonPrimitive(true)).forEach { bad ->
            assertFailsWith<SimulatorError> { store.update(desired.deepCopy().apply { add("photoSelectionTimeoutSeconds",bad) }) }
            assertEquals(before,Files.readString(file)); assertEquals(desired,store.settings)
        }
        Files.writeString(file,"{broken")
        assertFails { OperatorSettingsStore(root) }
    }
    @Test fun optInBusyAndRestart() {
        val root=root()
        SimulatorSessionEngine(root,config(),false).use {
            assertEquals(-32010,assertFailsWith<SimulatorError> { it.dispatch("operator.getSettings",JsonObject()) }.code)
        }
        var desired=JsonObject()
        SimulatorSessionEngine(root,config(),false,localOperatorEnabled=true).use { engine ->
            desired=engine.dispatch("operator.getSettings",JsonObject())["settings"].asJsonObject
            desired.addProperty("postCaptureTimeoutSeconds",123)
            assertTrue(engine.dispatch("operator.updateSettings",desired)["saved"].asBoolean)
            val start=JsonObject().apply {
                addProperty("sessionId",UUID.randomUUID().toString()); addProperty("commandId",UUID.randomUUID().toString())
                addProperty("layoutId","strip-2")
            }
            engine.dispatch("session.start",start)
            assertEquals(-32001,assertFailsWith<SimulatorError> { engine.dispatch("operator.updateSettings",desired) }.code)
        }
        SimulatorSessionEngine(root,config(),false,localOperatorEnabled=true).use {
            assertEquals(desired,it.dispatch("operator.getSettings",JsonObject())["settings"])
        }
    }
}
