package com.lesouvenir.v2.ipc

import com.google.gson.JsonParser
import java.io.*
import java.util.concurrent.TimeUnit
import kotlin.test.*

class BridgeTest {
    private val request = """{"jsonrpc":"2.0","id":"héalth","method":"health.check","params":{},"protocolVersion":1}"""
    private fun frame(text: String) = ByteArrayOutputStream().apply {
        val bytes = text.toByteArray(); DataOutputStream(this).apply { writeInt(bytes.size); write(bytes) }
    }.toByteArray()
    private fun decode(input: InputStream) = DataInputStream(input).let {
        val length = it.readInt(); assertTrue(length in 1..MAX_FRAME)
        JsonParser.parseString(String(it.readNBytes(length), Charsets.UTF_8)).asJsonObject
    }
    private fun code(text: String) = HealthBridge().response(text.toByteArray())["error"].asJsonObject["code"].asInt

    @Test fun strictValidation() {
        assertEquals(-32601, code(request.replace("health.check", "session.create")))
        for (version in listOf("2", "\"1\"", "1.0", "true", "null"))
            assertEquals(-32602, code(request.replace("\"protocolVersion\":1", "\"protocolVersion\":$version")))
        assertEquals(-32602, code(request.replace("{}", "[]")))
        assertEquals(-32600, code(request.replace("\"héalth\"", "42")))
        assertEquals(-32600, code(request.replace("\"params\":{}", "\"params\":{},\"auth\":null")))
        assertEquals(-32600, code(request.replace("\"id\":", "\"id\":\"x\",\"id\":")))
        for (bad in listOf("", "[]", "null", "{bad}", "$request {}", "\uFEFF$request")) assertEquals(-32600, code(bad))
        assertTrue(HealthBridge().response(byteArrayOf(0xC3.toByte(), 0x28))["error"].isJsonObject)
    }

    @Test fun framingAndEof() {
        val output = ByteArrayOutputStream()
        // readFully must tolerate partial reads.
        val partial = object : FilterInputStream(ByteArrayInputStream(frame(request) + frame(request))) {
            override fun read(b: ByteArray, off: Int, len: Int) = super.read(b, off, minOf(len, 1))
        }
        HealthBridge().serve(partial, output)
        val responses = ByteArrayInputStream(output.toByteArray())
        repeat(2) { assertEquals("héalth", decode(responses)["id"].asString) }
        assertEquals(-1, responses.read())
        for (bytes in listOf(byteArrayOf(0), byteArrayOf(0,0,0,5,123), byteArrayOf(0,16,0,1), byteArrayOf(-1,-1,-1,-1), byteArrayOf(0,0,0,0))) {
            val result = ByteArrayOutputStream()
            HealthBridge().serve(ByteArrayInputStream(bytes), result)
            assertEquals(-32600, decode(ByteArrayInputStream(result.toByteArray()))["error"].asJsonObject["code"].asInt)
        }
        val empty = ByteArrayOutputStream()
        HealthBridge().serve(ByteArrayInputStream(byteArrayOf()), empty)
        assertEquals(0, empty.size())
    }

    @Test fun healthReportsRunningJvmOnly() {
        val result = HealthBridge().response(request.toByteArray())["result"].asJsonObject
        assertEquals("ok", result["status"].asString)
        assertEquals(1, result["protocolVersion"].asInt)
        assertTrue(result["simulator"].asBoolean)
        assertEquals(ProcessHandle.current().pid(), result["backendPid"].asLong)
        assertTrue(result["uptimeMs"].asLong >= 0)
        assertEquals(System.getProperty("java.version"), result["jvmVersion"].asString)
        assertEquals(listOf("health.check"), result["availableMethods"].asJsonArray.map { it.asString })
    }

    @Test fun installedLauncherRejectsNonSimulatorStartup() {
        val windows = System.getProperty("os.name").startsWith("Windows")
        val launcher = File("build/install/backend/bin/backend" + if (windows) ".bat" else "").absolutePath
        for (args in listOf(emptyList(), listOf("--hardware"), listOf("--simulator", "--hardware"))) {
            val command = (if (windows) listOf("cmd.exe", "/c", launcher) else listOf(launcher)) + args
            val child = ProcessBuilder(command).apply {
                environment()["JAVA_HOME"] = System.getProperty("java.home")
            }.start()
            try {
                child.outputStream.close()
                assertTrue(child.waitFor(10, TimeUnit.SECONDS))
                assertEquals(2, child.exitValue())
                assertEquals(-1, child.inputStream.read())
                assertTrue(child.errorStream.readAllBytes().toString(Charsets.UTF_8).contains("Bridge requires --simulator only"))
            } finally { child.destroyForcibly() }
        }
    }

    @Test fun installedLauncherRealChildRoundtripAndShutdown() {
        val windows = System.getProperty("os.name").startsWith("Windows")
        val launcher = File("build/install/backend/bin/backend" + if (windows) ".bat" else "").absolutePath
        assertTrue(File(launcher).isFile)
        val command = if (windows) listOf("cmd.exe", "/c", launcher, "--simulator") else listOf(launcher, "--simulator")
        val child = ProcessBuilder(command).apply {
            environment()["JAVA_HOME"] = System.getProperty("java.home")
        }.start()
        try {
            child.outputStream.write(frame(request)); child.outputStream.flush()
            val executor = java.util.concurrent.Executors.newSingleThreadExecutor()
            val reply = try { executor.submit<com.google.gson.JsonObject> { decode(child.inputStream) }.get(10, TimeUnit.SECONDS) }
                catch (failure: Exception) {
                    if (child.waitFor(2, TimeUnit.SECONDS)) error("Launcher failed: " + child.errorStream.readAllBytes().toString(Charsets.UTF_8))
                    throw failure
                } finally { executor.shutdownNow() }
            assertEquals("héalth", reply["id"].asString)
            val result = reply["result"].asJsonObject
            assertTrue(result["simulator"].asBoolean)
            assertEquals("ok", result["status"].asString)
            val jvmPid = result["backendPid"].asLong
            assertTrue(ProcessHandle.of(jvmPid).orElseThrow().isAlive)
            child.outputStream.close()
            assertTrue(child.waitFor(10, TimeUnit.SECONDS))
            assertEquals(0, child.exitValue())
            assertEquals(-1, child.inputStream.read()) // no textual stdout pollution
            assertFalse(ProcessHandle.of(jvmPid).map { it.isAlive }.orElse(false))
            val diagnostics = child.errorStream.readAllBytes().toString(Charsets.UTF_8)
            assertFalse(diagnostics.contains("\"jsonrpc\""))
            println("Installed simulator lifecycle: backendPid=$jvmPid; health=ok; EOF launcherExit=${child.exitValue()}; backendAlive=false; stdout=framed-only")
        } finally { child.destroyForcibly() }
    }
}
