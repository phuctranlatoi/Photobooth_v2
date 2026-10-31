package com.lesouvenir.v2.ipc

import com.google.gson.*
import java.nio.file.*
import java.nio.ByteBuffer
import java.nio.channels.FileChannel

/** Nonsecret V1-visible intentions; never a hardware authorization source. */
class OperatorSettingsStore(workspace: Path) {
    private val root = workspace.toAbsolutePath().normalize()
    private val file = root.resolve("backend/config/operator-settings.json")
    private fun safePath() {
        require(root.fileName.toString()=="PhotoboothDesktop_v2")
        var cursor: Path? = file
        while(cursor!=null) {
            require(!Files.isSymbolicLink(cursor)) { "Linked settings path rejected" }
            cursor=cursor.parent
        }
    }
    init { safePath() }
    private val defaults = JsonObject().apply {
        addProperty("enableSystemPrint", false); addProperty("useHotFolder", true)
        addProperty("hotFolderPath", workspace.resolve("backend/build/hot-folder").toAbsolutePath().normalize().toString())
        addProperty("postCaptureTimeoutSeconds", 90); addProperty("photoSelectionTimeoutSeconds", 90)
        addProperty("frameSelectionTimeoutSeconds", 60)
    }
    var persisted = Files.exists(file); private set
    var settings: JsonObject = if (persisted) {
        require(Files.size(file)<=16384) { "Settings exceed limit" }
        val root = JsonParser.parseString(Files.readString(file)).asJsonObject
        require(root.keySet() == setOf("schemaVersion", "settings") && root["schemaVersion"].toString() == "1")
        validate(root["settings"].asJsonObject)
    } else defaults.deepCopy()
        private set

    private fun validate(value: JsonObject): JsonObject {
        fun invalid(): Nothing = throw SimulatorError(-32602, "Invalid settings")
        if (value.keySet() != defaults.keySet()) invalid()
        for ((key, v) in value.entrySet()) {
            if (!v.isJsonPrimitive) invalid()
            val p = v.asJsonPrimitive
            when (key) {
                "enableSystemPrint", "useHotFolder" -> if (!p.isBoolean) invalid()
                "hotFolderPath" -> if (!p.isString || p.asString.isBlank() || p.asString.length > 1024 || p.asString.any { it.code < 32 }) invalid()
                else -> if (!p.isNumber || !v.toString().matches(Regex("[0-9]{1,4}")) || p.asInt !in 0..3600) invalid()
            }
        }
        return value.deepCopy()
    }
    fun update(value: JsonObject) {
        val next = validate(value)
        safePath()
        Files.createDirectories(file.parent)
        val temporary = Files.createTempFile(file.parent, "operator-settings-", ".tmp")
        try {
            val root = JsonObject().apply { addProperty("schemaVersion", 1); add("settings", next) }
            FileChannel.open(temporary,StandardOpenOption.WRITE).use { channel ->
                val bytes=ByteBuffer.wrap(root.toString().toByteArray(Charsets.UTF_8))
                while(bytes.hasRemaining()) channel.write(bytes)
                channel.force(true)
            }
            safePath()
            Files.move(temporary, file, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
            settings = next; persisted = true
        } finally { Files.deleteIfExists(temporary) }
    }
    fun response(): JsonObject = JsonObject().apply {
        addProperty("schemaVersion", 1); add("settings", settings.deepCopy())
        addProperty("persisted", persisted)
        addProperty("appliesTo", "NEXT_SESSION"); addProperty("hardwareApply", "PENDING_DISABLED")
        add("productionGates", JsonObject().apply {
            listOf("nativeCamera", "systemPrint", "payments", "cloud", "database").forEach { addProperty(it, false) }
        })
    }
}
