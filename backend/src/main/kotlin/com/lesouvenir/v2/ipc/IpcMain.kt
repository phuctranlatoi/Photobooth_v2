package com.lesouvenir.v2.ipc

import com.google.gson.*
import com.google.gson.stream.JsonReader
import com.google.gson.stream.JsonToken
import java.io.*
import java.lang.management.ManagementFactory
import java.nio.ByteBuffer
import java.nio.charset.CodingErrorAction

const val MAX_FRAME = 1_048_576

/** Health-only bridge. Unrecoverable framing errors emit one error then close;
 * an oversize body is never allocated or mistaken for the next frame header.
 */
class HealthBridge {
    private fun error(id: String, code: Int, message: String) = envelope(id).apply {
        add("error", JsonObject().apply { addProperty("code", code); addProperty("message", message) })
    }
    private fun envelope(id: String) = JsonObject().apply {
        addProperty("jsonrpc", "2.0"); addProperty("id", id); addProperty("protocolVersion", 1)
    }

    fun response(bytes: ByteArray): JsonObject {
        var id = "" // Contract requires string IDs; empty means unavailable, never a fabricated caller ID.
        try {
            val text = Charsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString()
            require(!text.startsWith('\uFEFF'))
            val reader = JsonReader(StringReader(text)).apply { strictness = Strictness.STRICT }
            val req = JsonObject()
            reader.beginObject()
            while (reader.hasNext()) {
                val key = reader.nextName()
                require(!req.has(key))
                req.add(key, JsonParser.parseReader(reader))
            }
            reader.endObject()
            require(reader.peek() == JsonToken.END_DOCUMENT)
            fun string(key: String): String? = req[key]?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }?.asString
            id = string("id") ?: return error("", -32600, "String id required")
            if (req.keySet() != setOf("jsonrpc", "id", "method", "params", "protocolVersion") ||
                string("jsonrpc") != "2.0" || string("method") == null) {
                return error(id, -32600, "Invalid request")
            }
            val version = req["protocolVersion"]
            if (!version.isJsonPrimitive || !version.asJsonPrimitive.isNumber || version.toString() != "1" ||
                !req["params"].isJsonObject || req["params"].asJsonObject.size() != 0) {
                return error(id, -32602, "Invalid params or protocolVersion")
            }
            if (string("method") != "health.check") return error(id, -32601, "Method not found")
            return envelope(id).apply {
                add("result", JsonObject().apply {
                    addProperty("status", "ok"); addProperty("protocolVersion", 1)
                    addProperty("simulator", true); addProperty("backendPid", ProcessHandle.current().pid())
                    addProperty("uptimeMs", ManagementFactory.getRuntimeMXBean().uptime)
                    addProperty("jvmVersion", System.getProperty("java.version"))
                    add("availableMethods", JsonArray().apply { add("health.check") })
                })
            }
        } catch (_: Exception) { return error(id, -32600, "Invalid request encoding or JSON") }
    }

    fun serve(input: InputStream, output: OutputStream) {
        val source = DataInputStream(input.buffered())
        val sink = DataOutputStream(output.buffered())
        fun send(value: JsonObject) {
            val bytes = value.toString().toByteArray(Charsets.UTF_8)
            sink.writeInt(bytes.size); sink.write(bytes); sink.flush()
        }
        while (true) {
            val first = source.read()
            if (first == -1) return
            val length = try {
                (first.toLong() shl 24) or (source.readUnsignedByte().toLong() shl 16) or
                    (source.readUnsignedByte().toLong() shl 8) or source.readUnsignedByte().toLong()
            } catch (_: EOFException) { send(error("", -32600, "Truncated header")); return }
            if (length > MAX_FRAME) { send(error("", -32600, "Frame exceeds 1 MiB")); return }
            val bytes = ByteArray(length.toInt())
            try { source.readFully(bytes) } catch (_: EOFException) {
                send(error("", -32600, "Truncated payload")); return
            }
            send(response(bytes))
        }
    }
}

fun main(args: Array<String>) {
    if (args.toList() != listOf("--simulator")) {
        System.err.println("Bridge requires --simulator only")
        kotlin.system.exitProcess(2)
    }
    HealthBridge().serve(System.`in`, System.out)
}
