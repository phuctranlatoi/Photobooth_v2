package com.lesouvenir.v2.integrations

import com.google.gson.JsonParser
import com.lesouvenir.v2.config.DesktopBoothConfig
import java.io.ByteArrayOutputStream
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.nio.file.Path
import java.time.Duration
import java.util.UUID

class DesktopCloudinaryClient(private val httpClient: HttpClient = HttpClient.newBuilder()
    .followRedirects(HttpClient.Redirect.NORMAL).connectTimeout(Duration.ofSeconds(10)).build()) {
    fun uploadAssetToCloudinary(config: DesktopBoothConfig, sessionId: String, file: Path,
                                position: Int, kind: String = "ORIGINAL"): UploadedCloudAsset? {
        if (!Files.isRegularFile(file) || Files.size(file) <= 0L) return null
        val extension = file.fileName.toString().substringAfterLast('.', "").lowercase()
        if (extension !in setOf("jpg", "jpeg", "png", "mp4")) return null
        if (config.get("CLOUDINARY_CLOUD_NAME").isBlank() || config.get("CLOUDINARY_UPLOAD_PRESET").isBlank()) return null
        val resourceType = if (extension == "mp4") "video" else "image"
        val boundary = "----LeSouvenir${UUID.randomUUID().toString().replace("-", "")}" 
        val mimeType = when (extension) { "png" -> "image/png"; "mp4" -> "video/mp4"; else -> "image/jpeg" }
        val body = multipartBody(boundary, config.get("CLOUDINARY_UPLOAD_PRESET"), file.fileName.toString(), mimeType, Files.readAllBytes(file))
        val request = HttpRequest.newBuilder().uri(URI.create("https://api.cloudinary.com/v1_1/${config.get("CLOUDINARY_CLOUD_NAME")}/$resourceType/upload"))
            .timeout(Duration.ofMinutes(2)).header("Content-Type", "multipart/form-data; boundary=$boundary")
            .POST(HttpRequest.BodyPublishers.ofByteArray(body)).build()
        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8))
        if (response.statusCode() !in 200..299) return null // Never log remote response bodies.
        val json = JsonParser.parseString(response.body()).asJsonObject
        fun text(key: String) = json.get(key)?.takeUnless { it.isJsonNull }?.asString
        fun number(key: String) = json.get(key)?.takeUnless { it.isJsonNull }?.asInt
        val raw = text("secure_url") ?: return null
        val transform = if (extension == "mp4") "f_auto,q_auto,vc_h264" else "f_auto,q_auto"
        val optimized = if (raw.contains("/upload/v")) raw.replaceFirst("/upload/", "/upload/$transform/") else raw
        val publicId = text("public_id").orEmpty()
        return UploadedCloudAsset(optimized, FinalizeAssetRequest(kind, position, text("asset_id") ?: publicId,
            publicId, text("version") ?: "1", text("format") ?: extension,
            text("resource_type") ?: "image", text("type") ?: "upload", number("width") ?: 0,
            number("height") ?: 0, number("bytes") ?: Files.size(file).toInt()))
    }

    private fun multipartBody(boundary: String, preset: String, name: String, mime: String, bytes: ByteArray): ByteArray {
        val out = ByteArrayOutputStream()
        fun write(s: String) { out.write(s.toByteArray(StandardCharsets.UTF_8)) }
        write("--$boundary\r\nContent-Disposition: form-data; name=\"upload_preset\"\r\n\r\n$preset\r\n")
        write("--$boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"$name\"\r\nContent-Type: $mime\r\n\r\n")
        out.write(bytes)
        write("\r\n--$boundary--\r\n")
        return out.toByteArray()
    }
}
