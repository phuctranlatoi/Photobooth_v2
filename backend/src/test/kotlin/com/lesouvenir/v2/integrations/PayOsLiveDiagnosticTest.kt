package com.lesouvenir.v2.integrations

import com.lesouvenir.v2.config.DesktopConfigLoader
import java.net.URI
import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/** Explicit opt-in test: creates a real, unpaid 10,000 VND payment link. Never run in the default suite. */
class PayOsLiveDiagnosticTest {
    @Test fun createsRealVietQrLink() {
        org.junit.jupiter.api.Assumptions.assumeTrue(System.getenv("V2_RUN_LIVE_PAYOS_TEST") == "true" || System.getProperty("V2_RUN_LIVE_PAYOS_TEST") == "true", "Live PayOS test requires V2_RUN_LIVE_PAYOS_TEST=true")
        val config = DesktopConfigLoader.load(Path.of(".."))
        assertEquals(true, config.status()["payOsConfigured"], "PayOS configuration unavailable")
        val adapter = PayOsOfficialAdapter(config.get("PAYOS_CLIENT_ID"), config.get("PAYOS_API_KEY"), config.get("PAYOS_CHECKSUM_KEY"))
        assertEquals(PayOsReadiness.READY, adapter.readiness, "PayOS SDK not ready")
        val result = adapter.createPaymentLink(System.currentTimeMillis(), 10000, "Test V2")
        val vietQr = assertNotNull(result.qrCode, "PayOS did not provide a VietQR payload")
        assertTrue(vietQr.startsWith("000201"), "Unexpected VietQR header")
        assertTrue(vietQr.length > 50, "VietQR payload too short")
        val domain = result.checkoutUrl?.let { URI(it).host } ?: "unavailable"
        println("Status: READY")
        println("VietQR prefix: ${vietQr.take(6)}, length: ${vietQr.length}")
        println("Checkout URL domain: $domain")
    }
}
