package com.lesouvenir.v2.ipc

import com.google.gson.JsonObject

/** Optional atomic selection, preserving client order. Reject invalid input before mutating session state. */
internal fun selectionIndices(params: JsonObject, shotCount: Int): List<Int>? {
    if (!params.has("selectedIndices")) return null
    val value = params["selectedIndices"]
    if (!value.isJsonArray) throw SimulatorError(-32602, "Invalid selectedIndices")
    val indices = value.asJsonArray.map { item ->
        if (!item.isJsonPrimitive || !item.toString().matches(Regex("[0-9]+")))
            throw SimulatorError(-32602, "Invalid selectedIndices")
        val index = item.asInt
        if (index !in 0 until shotCount) throw SimulatorError(-32602, "Invalid selectedIndices")
        index
    }
    if (indices.distinct().size != indices.size) throw SimulatorError(-32602, "Duplicate selectedIndices")
    return indices
}
