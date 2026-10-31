package com.lesouvenir.v2.integrations

import com.google.gson.Gson
import com.google.gson.JsonObject
import java.net.URLEncoder

private fun segment(value: String) = URLEncoder.encode(value, Charsets.UTF_8)
data class SaleTransaction(val externalSessionId: String, val layoutId: String, val layoutTitle: String,
    val printSize: String, val quantity: Int, val includedQuantity: Int, val extraQuantity: Int,
    val basePrice: String, val extraUnitPrice: String, val extraAmount: String, val totalAmount: String,
    val paymentMethod: String, val createdAt: Long)
data class CreateAlbumRequest(val externalSessionId: String, val expectedAssets: Int, val expiresInDays: Int = 7)
data class CreateAlbumResponse(val albumId: String, val accessToken: String, val albumUrl: String, val status: String, val expiresAt: String)
data class FinalizeAssetRequest(val kind: String, val position: Int, val assetId: String, val publicId: String,
    val version: String, val format: String, val resourceType: String, val deliveryType: String,
    val width: Int, val height: Int, val bytes: Int)

/** Source: remote/DesktopRevenueClient HTTP branch only. No Neon direct route, DDL, retries or session wiring. */
class RevenueClient(private val base: String, private val authorization: String, private val transport: SafeTransport = SafeTransport()) {
    private fun request(path: String, body: Any? = null) = transport.json(if (body == null) "GET" else "POST",
        "${base.trimEnd('/')}/api/v1/revenue/$path", mapOf("Authorization" to authorization), body?.let { Gson().toJson(it) } ?: "")
    fun recordTransaction(transaction: SaleTransaction): Boolean { request("transactions", transaction); return true }
    fun adjustTransaction(sessionId: String, actualQuantity: Int, reason: String?): Boolean {
        require(actualQuantity >= 2); request("transactions/${segment(sessionId)}/adjust", mapOf("actualQuantity" to actualQuantity, "reason" to reason)); return true
    }
    fun voidTransaction(sessionId: String, reason: String?): Boolean { request("transactions/${segment(sessionId)}/void", mapOf("reason" to reason)); return true }
    fun getDashboard(startTime: Long, endTime: Long, timeZone: String): JsonObject = request("summary?startTime=$startTime&endTime=$endTime&timeZone=${segment(timeZone)}")
    fun getRecentTransactions(startTime: Long, endTime: Long, limit: Int = 20): JsonObject = request("transactions?startTime=$startTime&endTime=$endTime&limit=${limit.coerceIn(1, 100)}")
}

/** Source: remote/DesktopWebAlbumClient. The server owns QR URL and access token. */
class WebAlbumClient(private val base: String, private val authorization: String, private val transport: SafeTransport = SafeTransport()) {
    private fun post(path: String, body: String) = transport.send(WireRequest("POST", java.net.URI.create("${base.trimEnd('/')}/api/v1/albums$path"),
        mapOf("Authorization" to authorization) + if (body.isEmpty()) emptyMap() else mapOf("Content-Type" to "application/json"), body.toByteArray(Charsets.UTF_8)))
    fun createAlbum(request: CreateAlbumRequest): CreateAlbumResponse {
        transport.requireAllowed()
        val root = try { com.google.gson.JsonParser.parseString(post("", Gson().toJson(request)).body).asJsonObject } catch (e: IntegrationException) { throw e } catch (_: Exception) { throw IntegrationException(Failure.MALFORMED) }
        fun required(key: String, optional: Boolean = false): String {
            val value = root.get(key) ?: if (optional) return "" else throw IntegrationException(Failure.MALFORMED)
            if (!value.isJsonPrimitive || !value.asJsonPrimitive.isString) throw IntegrationException(Failure.MALFORMED)
            return value.asString
        }
        return CreateAlbumResponse(required("albumId"), required("accessToken", true), required("albumUrl"), required("status", true), required("expiresAt", true))
    }
    fun finalizeAsset(albumId: String, request: FinalizeAssetRequest): Boolean { post("/${segment(albumId)}/assets", Gson().toJson(request)); return true }
    fun completeAlbum(albumId: String): Boolean { post("/${segment(albumId)}/complete", ""); return true }
}
