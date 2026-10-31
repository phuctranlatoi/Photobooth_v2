package com.lesouvenir.v2.integrations

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.net.URI
import java.net.http.*
import java.time.Duration
import java.nio.ByteBuffer
import java.util.concurrent.Flow
import java.util.concurrent.CompletableFuture

enum class IntegrationMode { DENY, FAKE, LOCAL_FIXTURE, PRODUCTION }
enum class Failure { DENIED, TIMEOUT, OFFLINE, HTTP, MALFORMED }
class IntegrationException(val failure: Failure, val status: Int? = null) : RuntimeException("Integration failure: $failure")
data class WireRequest(val method: String, val uri: URI, val headers: Map<String, String>, val body: ByteArray)
data class WireResponse(val status: Int, val body: String)
fun interface FixtureTransport { fun send(request: WireRequest): WireResponse }

/** No environment variable can open production. Redirects disabled to prevent loopback escape. No body/credential logging. */
class SafeTransport(
    private val mode: IntegrationMode = IntegrationMode.DENY,
    private val fixture: FixtureTransport? = null,
    private val http: HttpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
        .followRedirects(HttpClient.Redirect.NEVER).build(),
    private val timeout: Duration = Duration.ofSeconds(10)
) {
    fun requireAllowed() {
        if (mode == IntegrationMode.DENY || mode == IntegrationMode.PRODUCTION) throw IntegrationException(Failure.DENIED)
    }
    fun send(request: WireRequest): WireResponse {
        requireAllowed()
        if (http.followRedirects() != HttpClient.Redirect.NEVER) throw IntegrationException(Failure.DENIED)
        val response = if (mode == IntegrationMode.FAKE) {
            (fixture ?: throw IntegrationException(Failure.DENIED)).send(request)
        } else {
            if (request.uri.scheme != "http" || request.uri.rawUserInfo != null || request.uri.fragment != null || request.uri.host !in setOf("127.0.0.1", "[::1]"))
                throw IntegrationException(Failure.DENIED)
            try {
                val builder = HttpRequest.newBuilder(request.uri).timeout(timeout)
                request.headers.forEach { (k, v) -> builder.header(k, v) }
                val pending = http.sendAsync(builder.method(request.method, HttpRequest.BodyPublishers.ofByteArray(request.body)).build(), HttpResponse.BodyHandler { BoundedBody() })
                val r = try { pending.get(timeout.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS) }
                catch (_: java.util.concurrent.TimeoutException) { pending.cancel(true); throw IntegrationException(Failure.TIMEOUT) }
                catch (e: java.util.concurrent.ExecutionException) {
                    var cause: Throwable? = e.cause
                    while (cause != null) {
                        if (cause is IntegrationException) throw cause
                        if (cause is HttpTimeoutException) throw IntegrationException(Failure.TIMEOUT)
                        cause = cause.cause
                    }
                    throw IntegrationException(Failure.OFFLINE)
                }
                WireResponse(r.statusCode(), r.body().toString(Charsets.UTF_8))
            } catch (_: HttpTimeoutException) { throw IntegrationException(Failure.TIMEOUT) }
            catch (_: java.io.IOException) { throw IntegrationException(Failure.OFFLINE) }
            catch (_: InterruptedException) { Thread.currentThread().interrupt(); throw IntegrationException(Failure.OFFLINE) }
        }
        if (response.status !in 200..299) throw IntegrationException(Failure.HTTP, response.status)
        return response
    }
    fun json(method: String, url: String, headers: Map<String, String> = emptyMap(), body: String = ""): JsonObject {
        requireAllowed()
        val response = send(WireRequest(method, URI.create(url), headers + if (body.isEmpty()) emptyMap() else mapOf("Content-Type" to "application/json"), body.toByteArray(Charsets.UTF_8)))
        return try { JsonParser.parseString(response.body).asJsonObject } catch (_: Exception) { throw IntegrationException(Failure.MALFORMED) }
    }
}

/** Cancels at the byte limit; completion includes the entire body, not only headers. */
private class BoundedBody : HttpResponse.BodySubscriber<ByteArray> {
    private val result = CompletableFuture<ByteArray>()
    private val bytes = java.io.ByteArrayOutputStream()
    private lateinit var subscription: Flow.Subscription
    override fun getBody(): java.util.concurrent.CompletionStage<ByteArray> = result
    override fun onSubscribe(value: Flow.Subscription) { subscription = value; value.request(1) }
    override fun onNext(items: MutableList<ByteBuffer>) {
        for (item in items) {
            if (item.remaining() > 1024 * 1024 - bytes.size()) {
                subscription.cancel(); result.completeExceptionally(IntegrationException(Failure.MALFORMED)); return
            }
            val part = ByteArray(item.remaining()); item.get(part); bytes.write(part)
        }
        subscription.request(1)
    }
    override fun onError(error: Throwable) { result.completeExceptionally(error) }
    override fun onComplete() { result.complete(bytes.toByteArray()) }
}
