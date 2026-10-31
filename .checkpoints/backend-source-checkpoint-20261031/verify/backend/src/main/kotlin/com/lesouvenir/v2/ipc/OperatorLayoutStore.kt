package com.lesouvenir.v2.ipc

import com.google.gson.*
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
import java.nio.file.*

/** Simulator-only overrides. No caller-controlled paths, secrets, prices or native settings. */
internal class OperatorLayoutStore(workspace: Path) {
    private val root = workspace.toAbsolutePath().normalize()
    private val file = root.resolve("backend/config/local-operator-layouts.json")
    private val fields = setOf("layoutId", "shotCount", "selectCount", "countdownSeconds")
    private fun invalid(): Nothing = throw SimulatorError(-32602,"Invalid simulator layout settings")
    private fun safePath() {
        require(root.fileName.toString()=="PhotoboothDesktop_v2")
        var cursor: Path? = file
        while(cursor!=null && cursor.startsWith(root)) {
            require(!Files.isSymbolicLink(cursor)) { "Linked operator configuration path rejected" }
            cursor=cursor.parent
        }
    }
    private fun apply(config: JsonObject, patch: JsonObject) {
        if(patch.keySet()!=fields) invalid()
        val id=patch["layoutId"].takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }?.asString ?: invalid()
        fun integer(key: String): Int {
            val value=patch[key]
            if(!value.toString().matches(Regex("[0-9]{1,2}"))) invalid()
            return value.asInt
        }
        val shots=integer("shotCount"); val select=integer("selectCount"); val countdown=integer("countdownSeconds")
        if(shots !in 1..12 || select !in 1..shots || countdown !in 0..30) invalid()
        val target=config["layouts"].asJsonArray.map { it.asJsonObject }.find { it["id"].asString==id } ?: invalid()
        target.addProperty("shotCount",shots); target.addProperty("selectCount",select); target.addProperty("countdownSeconds",countdown)
    }
    fun load(config: JsonObject) {
        safePath()
        if(!Files.exists(file)) return
        require(Files.size(file)<=16384) { "Operator configuration exceeds limit" }
        val candidate=config.deepCopy()
        val entries=JsonParser.parseString(Files.readString(file)).asJsonArray
        val ids=mutableSetOf<String>()
        entries.forEach { val patch=it.asJsonObject; apply(candidate,patch); require(ids.add(patch["layoutId"].asString)) }
        config.add("layouts",candidate["layouts"])
    }
    fun update(config: JsonObject, patch: JsonObject) {
        val candidate=config.deepCopy(); apply(candidate,patch)
        safePath()
        val entries=JsonArray()
        candidate["layouts"].asJsonArray.forEach { value ->
            val layout=value.asJsonObject
            entries.add(JsonObject().apply {
                add("layoutId",layout["id"])
                fields.filter { it!="layoutId" }.forEach { add(it,layout[it]) }
            })
        }
        val bytes=entries.toString().toByteArray(Charsets.UTF_8)
        Files.createDirectories(file.parent)
        val temp=Files.createTempFile(file.parent,"operator-",".tmp")
        try {
            FileChannel.open(temp,StandardOpenOption.WRITE).use { channel ->
                val buffer=ByteBuffer.wrap(bytes); while(buffer.hasRemaining()) channel.write(buffer); channel.force(true)
            }
            Files.move(temp,file,StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING)
            config.add("layouts",candidate["layouts"])
        } finally { Files.deleteIfExists(temp) }
    }
}
