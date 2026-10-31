package com.lesouvenir.v2.integrations

import com.sun.net.httpserver.HttpServer
import java.net.InetSocketAddress
import java.net.URI
import kotlin.test.*
import org.junit.jupiter.api.Test

class IntegrationContractTest {
    @Test fun defaultDenyAllClientsBeforeKeysOrInput() {
        val calls = listOf<() -> Any>(
            { PayOsClient().createPaymentLink(1, 1, "x") }, { PayOsClient().signature(1, 1, "x") },
            { CloudinaryClient("", "").uploadAsset("", byteArrayOf(), 0) },
            { WebAlbumClient("invalid", "").createAlbum(CreateAlbumRequest("s", 1)) },
            { RevenueClient("invalid", "").getDashboard(0, 1, "UTC") })
        calls.forEach { assertEquals(Failure.DENIED, assertFailsWith<IntegrationException> { it() }.failure) }
    }
    @Test fun malformedPayOsAndAlbumEnvelopesAreNormalized() {
        for (body in listOf("null", "[]", "{}", "{\"code\":null}", "{\"code\":{}}", "{\"code\":true}",
            "{\"code\":\"00\",\"data\":[]}", "{\"code\":\"00\",\"data\":{\"status\":1}}")) {
            val t = SafeTransport(IntegrationMode.FAKE, FixtureTransport { WireResponse(200, body) })
            assertEquals(Failure.MALFORMED, assertFailsWith<IntegrationException> { PayOsClient(t).status(1) }.failure)
        }
        val t = SafeTransport(IntegrationMode.FAKE, FixtureTransport { WireResponse(200, "{\"code\":\"01\"}") })
        assertEquals(Failure.HTTP, assertFailsWith<IntegrationException> { PayOsClient(t).status(1) }.failure)
        for (body in listOf("null", "[]", "{\"albumId\":true}", "{\"albumId\":\"a\",\"albumUrl\":{}}")) {
            val fake = SafeTransport(IntegrationMode.FAKE, FixtureTransport { WireResponse(200, body) })
            assertEquals(Failure.MALFORMED, assertFailsWith<IntegrationException> { WebAlbumClient("https://fixture.invalid", "", fake).createAlbum(CreateAlbumRequest("s", 1)) }.failure)
        }
    }
    @Test fun cloudInputBoundedBeforeTransport() {
        var called = false
        val t = SafeTransport(IntegrationMode.FAKE, FixtureTransport { called = true; WireResponse(200, "{}") })
        assertFailsWith<IllegalArgumentException> { CloudinaryClient("fixture", "preset", t, maxContentBytes = 2).uploadAsset("a.png", byteArrayOf(1,2,3), 0) }
        assertFalse(called)
    }
    @Test fun loopbackRedirectTimeoutAndResponseBounds() {
        var targetCalls = 0
        val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
        server.createContext("/redirect") { e -> e.responseHeaders.add("Location", "/target"); e.sendResponseHeaders(302, -1); e.close() }
        server.createContext("/target") { e -> targetCalls++; e.sendResponseHeaders(200, -1); e.close() }
        server.createContext("/slow") { e -> Thread.sleep(200); e.close() }
        server.createContext("/stalled") { e -> e.sendResponseHeaders(200, 20); e.responseBody.write(1); e.responseBody.flush(); Thread.sleep(200); e.close() }
        server.createContext("/large") { e -> val bytes = ByteArray(1024 * 1024 + 1); e.sendResponseHeaders(200, bytes.size.toLong()); e.responseBody.use { it.write(bytes) } }
        server.start()
        try {
            val base = "http://127.0.0.1:${server.address.port}"
            val t = SafeTransport(IntegrationMode.LOCAL_FIXTURE)
            assertEquals(Failure.HTTP, assertFailsWith<IntegrationException> { t.json("GET", "$base/redirect") }.failure)
            assertEquals(0, targetCalls)
            assertEquals(Failure.MALFORMED, assertFailsWith<IntegrationException> { t.json("GET", "$base/large") }.failure)
            val short = SafeTransport(IntegrationMode.LOCAL_FIXTURE, timeout = java.time.Duration.ofMillis(30))
            assertEquals(Failure.TIMEOUT, assertFailsWith<IntegrationException> { short.json("GET", "$base/slow") }.failure)
            Thread.sleep(220)
            assertEquals(Failure.TIMEOUT, assertFailsWith<IntegrationException> { short.json("GET", "$base/stalled") }.failure)
            for (url in listOf("http://localhost:1", "http://2130706433:1", "http://127.0.0.1.example.invalid", "https://127.0.0.1", "http://user@127.0.0.1"))
                assertEquals(Failure.DENIED, assertFailsWith<IntegrationException> { t.json("GET", url) }.failure)
        } finally { server.stop(0) }
    }
    @Test fun denyIsUnconditional() {
        for (mode in listOf(IntegrationMode.DENY, IntegrationMode.PRODUCTION)) {
            var invoked = false
            val t = SafeTransport(mode, FixtureTransport { invoked = true; WireResponse(200, "{}") })
            assertEquals(Failure.DENIED, assertFailsWith<IntegrationException> { t.json("GET", "https://example.invalid") }.failure)
            assertFalse(invoked)
        }
        assertEquals(Failure.DENIED, assertFailsWith<IntegrationException> { SafeTransport(IntegrationMode.LOCAL_FIXTURE).json("GET", "https://127.0.0.1") }.failure)
    }
    @Test fun realLocalHttpSerializesAllFourClients() {
        val requests = mutableListOf<Triple<String, String, String>>()
        val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
        server.createContext("/") { exchange ->
            val body = exchange.requestBody.readAllBytes().toString(Charsets.UTF_8)
            requests.add(Triple(exchange.requestMethod, exchange.requestURI.toString(), body))
            val path = exchange.requestURI.path
            val response = when {
                path.endsWith("/image/upload") -> """{"secure_url":"https://fixture.invalid/upload/v1/p.png","public_id":"p","version":1}"""
                path == "/api/v1/albums" -> """{"albumId":"a/b","albumUrl":"https://fixture.invalid/a","accessToken":"synthetic"}"""
                path == "/v2/payment-requests" -> """{"code":"00","data":{"qrCode":"fixture-qr"}}"""
                path.startsWith("/v2/payment-requests/") -> """{"code":"00","data":{"status":"PAID"}}"""
                else -> "{}"
            }.toByteArray()
            exchange.sendResponseHeaders(200, response.size.toLong()); exchange.responseBody.use { it.write(response) }
        }
        server.start()
        try {
            val base = "http://127.0.0.1:${server.address.port}"
            val t = SafeTransport(IntegrationMode.LOCAL_FIXTURE)
            val pay = PayOsClient(t, base, "synthetic-client", "synthetic-api", "synthetic-key")
            assertEquals("fixture-qr", pay.createPaymentLink(123, 20000, "fixture")); assertTrue(pay.checkPaymentStatus(123))
            assertTrue(requests.first().third.contains("\"signature\"")); assertTrue(requests.first().third.contains("Le Souvenir"))
            val album = WebAlbumClient(base, "Bearer synthetic", t)
            assertEquals("a/b", album.createAlbum(CreateAlbumRequest("session-fixture", 1)).albumId)
            val asset = CloudinaryClient("fixture", "synthetic-preset", t, base).uploadAsset("fixture.png", byteArrayOf(1, 2, 3), 0)
            assertEquals("https://fixture.invalid/upload/f_auto,q_auto/v1/p.png", asset.secureUrl)
            album.finalizeAsset("a/b", asset.finalizeRequest); album.completeAlbum("a/b")
            val revenue = RevenueClient(base, "Bearer synthetic", t)
            revenue.recordTransaction(SaleTransaction("session-fixture", "layout", "Layout", "10x15", 2, 2, 0, "9007199254740993", "0", "0", "9007199254740993", "cash", 123))
            revenue.adjustTransaction("session-fixture", 2, "fixture"); revenue.voidTransaction("session-fixture", "fixture")
            revenue.getDashboard(1, 2, "Asia/Ho_Chi_Minh"); revenue.getRecentTransactions(1, 2, 200)
            assertTrue(requests.any { it.second.contains("a%2Fb/assets") })
            assertTrue(requests.any { it.third.contains("\"totalAmount\":\"9007199254740993\"") })
            assertTrue(requests.any { it.second.endsWith("limit=100") })
            assertTrue(requests.any { it.third.contains("name=\"upload_preset\"") })
            assertEquals(11, requests.size)
        } finally { server.stop(0) }
    }
    @Test fun fakeErrorsNeverLeakBodies() {
        val t = SafeTransport(IntegrationMode.FAKE, FixtureTransport { WireResponse(503, "synthetic-sensitive-body") })
        val error = assertFailsWith<IntegrationException> { t.json("GET", "https://fixture.invalid") }
        assertEquals(Failure.HTTP, error.failure); assertEquals(503, error.status)
        assertFalse(error.toString().contains("synthetic-sensitive"))
        assertEquals(Failure.MALFORMED, assertFailsWith<IntegrationException> {
            SafeTransport(IntegrationMode.FAKE, FixtureTransport { WireResponse(200, "broken") }).json("GET", "https://fixture.invalid")
        }.failure)
    }
    @Test fun signingIsStableAndNotSuccessfulForPending() {
        val t = SafeTransport(IntegrationMode.FAKE, FixtureTransport { WireResponse(200, """{"code":"00","data":{"status":"PENDING"}}""") })
        val p = PayOsClient(t, checksumKey = "synthetic-key")
        assertEquals(64, p.signature(123, 20000, "fixture").length)
        assertEquals(p.signature(123, 20000, "fixture"), p.signature(123, 20000, "fixture"))
        assertNotEquals(p.signature(123, 20000, "fixture"), p.signature(124, 20000, "fixture"))
        assertFalse(p.checkPaymentStatus(123))
    }
}
