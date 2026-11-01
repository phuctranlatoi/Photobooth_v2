package com.lesouvenir.v2.integrations

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertEquals

class PayOsOfficialAdapterTest {
    @Test fun unconfiguredFailsClosedWithoutNetwork() {
        for (credentials in listOf(Triple("", "api", "checksum"), Triple("client", "", "checksum"),
            Triple("client", "api", ""), Triple(" ", "api", "checksum"))) {
            val adapter = PayOsOfficialAdapter(credentials.first, credentials.second, credentials.third)
            assertFalse(adapter.isConfigured)
            assertEquals(PayOsReadiness.CONFIG_MISSING, adapter.readiness)
            assertNull(adapter.createPaymentLink(1L, 100, "offline test").qrCode)
            assertFalse(adapter.checkPaymentStatus(1L))
        }
    }
}
