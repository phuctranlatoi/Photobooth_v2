package com.lesouvenir.v2.integrations

import com.lesouvenir.v2.config.DesktopBoothConfig
import com.lesouvenir.v2.imaging.DesktopImageProcessor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import java.nio.file.Path

data class CapturedMoment(val index: Int, val photoPath: Path?, val videoPath: Path? = null)
data class AlbumUploadResult(val albumId: String?, val albumUrl: String?, val originalPhotoUrls: List<String>,
    val finalPhotoUrl: String?, val uploadedCount: Int, val finalizedCount: Int, val errorMessage: String? = null)

class DesktopAlbumUploader(private val projectDir: Path, private val config: DesktopBoothConfig,
    private val cloudinaryClient: DesktopCloudinaryClient = DesktopCloudinaryClient(),
    private val webAlbumClient: DesktopWebAlbumClient = DesktopWebAlbumClient(),
    private val imageProcessor: DesktopImageProcessor = DesktopImageProcessor()) {
    suspend fun uploadSessionPhotos(sessionId: String, preCreatedAlbumId: String?, capturedMoments: List<CapturedMoment>, masterPrint: Path?): AlbumUploadResult {
        if (!canUpload()) return AlbumUploadResult(null, null, emptyList(), null, 0, 0, "Album configuration missing")
        return try {
            coroutineScope {
                val dir = projectDir.resolve("data/sessions").resolve(sessionId).resolve("exports")
                val originals = capturedMoments.map { moment -> async(Dispatchers.IO) {
                    moment.photoPath?.let { imageProcessor.ensureJpeg(it, dir, "original_${moment.index}") }
                } }.awaitAll().filterNotNull()
                val final = masterPrint?.let { async(Dispatchers.IO) { imageProcessor.ensureJpeg(it, dir, "final") } }?.await()
                val uploads = originals.mapIndexed { index, file -> async(Dispatchers.IO) {
                    cloudinaryClient.uploadAssetToCloudinary(config, sessionId, file, index, "ORIGINAL")
                } }
                val finalUpload = final?.let { async(Dispatchers.IO) {
                    cloudinaryClient.uploadAssetToCloudinary(config, sessionId, it, originals.size, "FINAL")
                } }
                val originalAssets = uploads.awaitAll().filterNotNull()
                val finalAsset = finalUpload?.await()
                val assets = originalAssets + listOfNotNull(finalAsset)
                if (assets.isEmpty()) return@coroutineScope AlbumUploadResult(null, null, emptyList(), null, 0, 0, "No assets uploaded")
                val albumId = preCreatedAlbumId ?: withContext(Dispatchers.IO) {
                    webAlbumClient.createAlbum(config, CreateAlbumRequest(sessionId, assets.size, expiresDays())).albumId
                }
                var finalized = 0
                for (asset in assets) if (withContext(Dispatchers.IO) { webAlbumClient.finalizeAsset(config, albumId, asset.finalizeRequest) }) finalized++
                AlbumUploadResult(albumId, "${config.get("WEB_ALBUM_BASE_URL").trimEnd('/')}/album/$sessionId",
                    originalAssets.map { it.secureUrl }, finalAsset?.secureUrl, assets.size, finalized)
            }
        } catch (e: Exception) {
            AlbumUploadResult(preCreatedAlbumId, null, emptyList(), null, 0, 0, e.javaClass.simpleName)
        }
    }
    fun uploadSessionVideo(sessionId: String, albumId: String, masterVideo: Path, startPosition: Int): Boolean =
        canUpload() && runCatching {
            val asset = cloudinaryClient.uploadAssetToCloudinary(config, sessionId, masterVideo, startPosition, "GIF") ?: return false
            webAlbumClient.finalizeAsset(config, albumId, asset.finalizeRequest)
        }.getOrDefault(false)
    fun completeSessionAlbum(albumId: String): Boolean = canUpload() && runCatching { webAlbumClient.completeAlbum(config, albumId) }.getOrDefault(false)
    private fun canUpload() = config.get("WEB_ALBUM_BASE_URL").isNotBlank() && config.get("BOOTH_API_KEY").isNotBlank() &&
        config.get("CLOUDINARY_CLOUD_NAME").isNotBlank() && config.get("CLOUDINARY_UPLOAD_PRESET").isNotBlank()
    private fun expiresDays() = config.get("ALBUM_EXPIRES_IN_DAYS").toIntOrNull()?.coerceAtLeast(1) ?: 7
}
