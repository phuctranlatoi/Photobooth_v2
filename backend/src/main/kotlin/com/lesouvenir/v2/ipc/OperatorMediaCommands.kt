package com.lesouvenir.v2.ipc

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.lesouvenir.v2.data.SqliteSalesRepository
import com.lesouvenir.v2.config.DesktopBoothConfig
import com.lesouvenir.v2.imaging.DesktopImageProcessor
import com.lesouvenir.v2.imaging.EffectMode
import com.lesouvenir.v2.integrations.NeonDirectRevenueClient
import com.lesouvenir.v2.storage.FilterStore
import com.lesouvenir.v2.storage.FrameStore
import java.time.LocalDate
import java.time.ZoneId
import java.util.Base64

/** Shared operator DTOs; the engines retain their existing operator access policy. */
internal class OperatorMediaCommands(
    private val frames: FrameStore, private val filters: FilterStore,
    private val processor: DesktopImageProcessor? = null,
    private val sales: SqliteSalesRepository? = null,
    private val config: DesktopBoothConfig? = null,
    private val neon: NeonDirectRevenueClient? = null
) {
    private val gson = Gson()
    private fun obj(vararg values: Pair<String, Any?>) = gson.toJsonTree(mapOf(*values)).asJsonObject
    private fun text(p: JsonObject, key: String): String = p[key]?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }?.asString
        ?: throw IllegalArgumentException("$key required")
    private fun optional(p: JsonObject, key: String) = p[key]?.takeUnless { it.isJsonNull }?.asString
    fun dispatch(method: String, p: JsonObject): JsonObject {
      return when (method) {
        "operator.addFrame" -> {
            val encoded = text(p, "image").substringAfter("base64,", text(p, "image"))
            val bytes = Base64.getDecoder().decode(encoded)
            val frame = frames.addCustomFrame(text(p, "name"), bytes, text(p, "printSize"), text(p, "layoutId"),
                p["isSpecial"]?.asBoolean ?: false, optional(p, "specialEventName"),
                p["qrCodeX"]?.asInt, p["qrCodeY"]?.asInt, p["qrCodeSize"]?.asInt)
            obj("saved" to true, "frame" to mapOf("id" to frame.id, "title" to frame.title))
        }
        "operator.getFilters" -> obj("filters" to filters.loadFilters())
        "operator.saveFilter" -> {
            filters.saveFilter(gson.fromJson(p["filter"] ?: throw IllegalArgumentException("filter required"), EffectMode::class.java))
            processor?.availableEffects = filters.loadFilters()
            obj("saved" to true)
        }
        "operator.deleteFilter" -> {
            val deleted = filters.deleteFilter(text(p, "id"))
            processor?.availableEffects = filters.loadFilters()
            obj("deleted" to deleted)
        }
        "operator.importLut" -> {
            val raw = text(p, "content")
            val content = if (raw.startsWith("data:") && raw.contains("base64,"))
                String(Base64.getDecoder().decode(raw.substringAfter("base64,")), Charsets.UTF_8) else raw
            obj("lutPath" to filters.importLut(text(p, "name"), content))
        }
        "operator.getRevenue" -> {
            val ledger = requireNotNull(sales)
            val today = LocalDate.now()
            val beginning = today.withDayOfMonth(1)
            val (from, until) = when (optional(p, "period")) {
                "7days", "7 ngày qua" -> today.minusDays(6) to today.plusDays(1)
                "this_month", "Tháng này" -> beginning to beginning.plusMonths(1)
                "last_month", "Tháng trước" -> beginning.minusMonths(1) to beginning
                else -> today to today.plusDays(1)
            }
            val zone = ZoneId.systemDefault()
            val start = p["startMs"]?.asLong ?: from.atStartOfDay(zone).toInstant().toEpochMilli()
            val end = p["endMs"]?.asLong ?: until.atStartOfDay(zone).toInstant().toEpochMilli()
            require(start < end) { "Invalid revenue interval" }
            if (config != null && neon != null && (config.get("NEON_DATABASE_URL").isNotBlank() || config.get("DATABASE_URL").isNotBlank())) {
                // Remote writes only reconcile already-recorded local sales, never create a new sale.
                runCatching { ledger.syncPendingSales(requireNotNull(neon), requireNotNull(config)) }
                val cloud = requireNotNull(neon).getDashboard(requireNotNull(config), start, end)
                if (cloud != null) {
                    val recent = neon.getRecentTransactions(config, start, end)
                    if (recent != null) return obj("summary" to cloud.first, "dailyPoints" to cloud.second,
                        "sizeBreakdowns" to cloud.third, "recentTransactions" to recent, "cloud" to true)
                }
            }
            obj("summary" to ledger.getSummary(start, end), "dailyPoints" to ledger.getDailyPoints(start, end),
                "sizeBreakdowns" to ledger.getSizeBreakdowns(start, end),
                "recentTransactions" to ledger.getRecentTransactions(start, end), "cloud" to false)
        }
        "operator.voidTransaction" -> {
            val ledger = requireNotNull(sales)
            val changed = ledger.voidTransaction(text(p, "sessionId"), optional(p, "reason"))
            if (changed && config != null && neon != null && (config.get("NEON_DATABASE_URL").isNotBlank() || config.get("DATABASE_URL").isNotBlank()))
                runCatching { ledger.syncPendingSales(requireNotNull(neon), requireNotNull(config)) }
            obj("voided" to changed)
        }
        else -> throw IllegalArgumentException("Unknown operator command")
      }
    }
    companion object {
        val methods = setOf("operator.addFrame", "operator.getFilters", "operator.saveFilter", "operator.deleteFilter",
            "operator.importLut", "operator.getRevenue", "operator.voidTransaction")
    }
}
