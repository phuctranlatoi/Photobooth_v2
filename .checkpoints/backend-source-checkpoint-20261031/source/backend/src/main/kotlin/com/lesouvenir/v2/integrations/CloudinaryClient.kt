package com.lesouvenir.v2.integrations

import java.io.ByteArrayOutputStream
import java.net.URI
import com.google.gson.JsonParser

data class UploadedCloudAsset(val secureUrl: String, val finalizeRequest: FinalizeAssetRequest)
/** Source: remote/DesktopCloudinaryClient. Byte input deliberately avoids arbitrary/customer file access. */
class CloudinaryClient(private val cloudName: String, private val uploadPreset: String,
    private val transport: SafeTransport = SafeTransport(), private val base: String = "https://api.cloudinary.com",
    private val maxContentBytes: Int = 32 * 1024 * 1024) {
    fun uploadAsset(fileName: String, content: ByteArray, position: Int, kind: String = "ORIGINAL"): UploadedCloudAsset {
        transport.requireAllowed()
        require(maxContentBytes in 1..32 * 1024 * 1024)
        require(fileName.length <= 255 && fileName.matches(Regex("[A-Za-z0-9_.-]+")) && content.isNotEmpty() && content.size <= maxContentBytes)
        require(cloudName.matches(Regex("[A-Za-z0-9_-]{1,128}")) && uploadPreset.matches(Regex("[A-Za-z0-9_-]{1,256}")))
        val extension = fileName.substringAfterLast('.').lowercase()
        require(extension in setOf("jpg", "jpeg", "png", "mp4"))
        val video = extension == "mp4"
        val resource = if (video) "video" else "image"
        val mime = if (video) "video/mp4" else if (extension == "png") "image/png" else "image/jpeg"
        val boundary = "----LeSouvenir${java.util.UUID.randomUUID().toString().replace("-", "")}"
        val output = ByteArrayOutputStream()
        fun write(s: String) { output.write(s.toByteArray(Charsets.UTF_8)) }
        write("--$boundary\r\nContent-Disposition: form-data; name=\"upload_preset\"\r\n\r\n$uploadPreset\r\n")
        write("--$boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"$fileName\"\r\nContent-Type: $mime\r\n\r\n")
        output.write(content); write("\r\n--$boundary--\r\n")
        val response = transport.send(WireRequest("POST", URI.create("$base/v1_1/$cloudName/$resource/upload"), mapOf("Content-Type" to "multipart/form-data; boundary=$boundary"), output.toByteArray()))
        try {
            val root = JsonParser.parseString(response.body).asJsonObject
            fun s(key: String, default: String = "") = root.get(key)?.asString ?: default
            fun n(key: String, default: Int = 0) = root.get(key)?.asInt ?: default
            val raw = s("secure_url").ifEmpty { throw IntegrationException(Failure.MALFORMED) }
            val transform = if (video) "f_auto,q_auto,vc_h264" else "f_auto,q_auto"
            val url = if (raw.contains("/upload/v")) raw.replaceFirst("/upload/", "/upload/$transform/") else raw
            return UploadedCloudAsset(url, FinalizeAssetRequest(kind, position, s("asset_id", s("public_id")), s("public_id"), s("version", "1"),
                s("format", extension), s("resource_type", "image"), s("type", "upload"), n("width"), n("height"), n("bytes", content.size)))
        } catch (e: IntegrationException) { throw e } catch (_: Exception) { throw IntegrationException(Failure.MALFORMED) }
    }
}
