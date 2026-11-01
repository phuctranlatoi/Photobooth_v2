package com.lesouvenir.v2.integrations

import com.lesouvenir.v2.config.DesktopConfigLoader
import org.junit.jupiter.api.Assumptions.assumeTrue
import org.junit.jupiter.api.Test
import java.nio.file.Path
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class NeonLiveDiagnosticTest {
    @Test
    fun readOnlyConnection() {
        assumeTrue(System.getenv("V2_RUN_LIVE_NEON_TEST") == "true" || System.getProperty("V2_RUN_LIVE_NEON_TEST") == "true", "Live Neon test requires V2_RUN_LIVE_NEON_TEST=true")
        val config = DesktopConfigLoader.load(Path.of(".."))
        assertEquals(true, config.status()["databaseConfigured"])
        val connected = NeonDirectRevenueClient().testConnection(config)
        println("Neon database connected: $connected")
        assertTrue(connected)
    }
}
