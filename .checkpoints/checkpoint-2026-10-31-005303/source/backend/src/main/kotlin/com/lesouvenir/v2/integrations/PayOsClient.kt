package com.lesouvenir.v2.integrations

import com.google.gson.Gson
import com.google.gson.JsonObject
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/** V1 services/PaymentService.createPaymentLink/checkPaymentStatus. V1 SDK wire details require independent SDK review. */
class PayOsClient(private val transport: SafeTransport = SafeTransport(), private val base: String = "https://api-merchant.payos.vn",
    private val clientId: String = "", private val apiKey: String = "", private val checksumKey: String = "") {
    private val headers get() = mapOf("x-client-id" to clientId, "x-api-key" to apiKey)
    fun signature(orderCode: Long, amount: Int, description: String): String {
        transport.requireAllowed()
        val canonical = "amount=$amount&cancelUrl=https://localhost/cancel&description=$description&orderCode=$orderCode&returnUrl=https://localhost/success"
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(checksumKey.toByteArray(Charsets.UTF_8), "HmacSHA256"))
        return mac.doFinal(canonical.toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it) }
    }
    fun createPaymentLink(orderCode: Long, amount: Int, description: String): String {
        transport.requireAllowed()
        val body = mapOf("orderCode" to orderCode, "amount" to amount.toLong(), "description" to description,
            "items" to listOf(mapOf("name" to "Le Souvenir", "quantity" to 1, "price" to amount.toLong())),
            "cancelUrl" to "https://localhost/cancel", "returnUrl" to "https://localhost/success", "signature" to signature(orderCode, amount, description))
        return field(data(transport.json("POST", "$base/v2/payment-requests", headers, Gson().toJson(body))), "qrCode")
    }
    fun checkPaymentStatus(orderCode: Long): Boolean = status(orderCode) == "PAID"
    fun status(orderCode: Long): String = field(data(transport.json("GET", "$base/v2/payment-requests/$orderCode", headers)), "status")
    private fun field(root: JsonObject, key: String): String {
        val value = root.get(key)
        if (value == null || !value.isJsonPrimitive || !value.asJsonPrimitive.isString) throw IntegrationException(Failure.MALFORMED)
        return value.asString
    }
    private fun data(root: JsonObject): JsonObject {
        if (field(root, "code") != "00") throw IntegrationException(Failure.HTTP)
        val value = root.get("data")
        if (value == null || !value.isJsonObject) throw IntegrationException(Failure.MALFORMED)
        return value.asJsonObject
    }
}
