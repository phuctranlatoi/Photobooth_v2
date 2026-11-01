package com.lesouvenir.v2.ipc

import com.google.gson.JsonObject

enum class RuntimeMode { SIMULATOR, REAL }

interface SessionEngine : AutoCloseable {
    val mode: RuntimeMode
    fun dispatch(method: String, p: JsonObject): JsonObject
    override fun close()
}
