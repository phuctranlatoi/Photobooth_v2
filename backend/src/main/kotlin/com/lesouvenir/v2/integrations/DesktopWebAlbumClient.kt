package com.lesouvenir.v2.integrations

import com.google.gson.JsonParser
import com.google.gson.Gson
import com.lesouvenir.v2.config.DesktopBoothConfig
import java.net.URI
import java.net.URLEncoder
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.charset.StandardCharsets
import java.time.Duration

/** V1 album API route; errors intentionally omit response bodies (which can contain tokens). */
class DesktopWebAlbumClient(private val httpClient: HttpClient = HttpClient.newBuilder()
    .followRedirects(HttpClient.Redirect.NORMAL).connectTimeout(Duration.ofSeconds(10)).build()) {
    fun createAlbum(config: DesktopBoothConfig, request: CreateAlbumRequest): CreateAlbumResponse {
        val json = JsonParser.parseString(postJson(config, "api/v1/albums", Gson().toJson(request))).asJsonObject
        fun field(name: String) = json.get(name)?.takeUnless { it.isJsonNull }?.asString.orEmpty()
        val id = field("albumId").ifBlank { error("Album response missing albumId") }
        return CreateAlbumResponse(id, field("accessToken"), field("albumUrl").ifBlank { error("Album response missing albumUrl") }, field("status"), field("expiresAt"))
    }

    fun finalizeAsset(config: DesktopBoothConfig, albumId: String, request: FinalizeAssetRequest): Boolean {
        postJson(config, "api/v1/albums/${segment(albumId)}/assets", Gson().toJson(request))
        return true
    }

    fun completeAlbum(config: DesktopBoothConfig, albumId: String): Boolean {
        postJson(config, "api/v1/albums/${segment(albumId)}/complete", "")
        return true
    }

    private fun segment(value: String) = URLEncoder.encode(value, StandardCharsets.UTF_8)
    private fun postJson(config: DesktopBoothConfig, path: String, body: String): String {
        val builder = HttpRequest.newBuilder().uri(URI.create(config.get("WEB_ALBUM_BASE_URL").trimEnd('/') + "/" + path))
            .timeout(Duration.ofSeconds(30)).header("Authorization", "Bearer ${config.get("BOOTH_API_KEY")}")
            .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
        if (body.isNotEmpty()) builder.header("Content-Type", "application/json")
        val response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8))
        check(response.statusCode() in 200..299) { "Album API HTTP ${response.statusCode()} ($path)" }
        return response.body()
    }
}
