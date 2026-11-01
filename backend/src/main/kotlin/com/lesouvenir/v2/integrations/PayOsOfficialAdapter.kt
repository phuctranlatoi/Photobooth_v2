package com.lesouvenir.v2.integrations

import vn.payos.PayOS
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest
import vn.payos.model.v2.paymentRequests.PaymentLinkItem
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus

enum class PayOsReadiness { CONFIG_MISSING, CONFIG_INVALID, SDK_INIT_FAILED, READY }

data class CreatePaymentResult(val qrCode: String?, val checkoutUrl: String?, val error: String? = null)

/** V1 PaymentService SDK request and PAID comparison. */
class PayOsOfficialAdapter(clientId: String, apiKey: String, checksumKey: String) {
    val readiness: PayOsReadiness
    @Volatile var lastError: String? = null
        private set
    private val payOS: PayOS?

    init {
        if (clientId.isBlank() || apiKey.isBlank() || checksumKey.isBlank()) {
            readiness = PayOsReadiness.CONFIG_MISSING
            payOS = null
        } else {
            val initialized = try { PayOS(clientId, apiKey, checksumKey) }
                catch (e: Exception) { lastError = e.message; null }
            payOS = initialized
            readiness = if (initialized == null) PayOsReadiness.SDK_INIT_FAILED else PayOsReadiness.READY
        }
    }

    val isConfigured: Boolean get() = payOS != null

    fun createPaymentLink(orderCode: Long, amount: Int, description: String): CreatePaymentResult {
        val client = payOS ?: return CreatePaymentResult(null, null, readiness.name)
        val safeDescription = description.replace(Regex("[^a-zA-Z0-9 ]"), "").trim().take(25).ifBlank { "Le Souvenir" }
        return try {
            val item = PaymentLinkItem.builder().name("Le Souvenir").quantity(1).price(amount.toLong()).build()
            val request = CreatePaymentLinkRequest.builder().orderCode(orderCode).amount(amount.toLong())
                .description(safeDescription).items(listOf(item)).cancelUrl("https://localhost/cancel")
                .returnUrl("https://localhost/success").build()
            val response = client.paymentRequests().create(request)
            lastError = null
            CreatePaymentResult(response.qrCode, response.checkoutUrl)
        } catch (e: Exception) {
            lastError = e.message
            CreatePaymentResult(null, null, lastError)
        }
    }

    fun checkPaymentStatus(orderCode: Long): Boolean {
        val client = payOS ?: return false
        return try { client.paymentRequests().get(orderCode).status == PaymentLinkStatus.PAID }
        catch (_: Exception) { false }
    }
}
