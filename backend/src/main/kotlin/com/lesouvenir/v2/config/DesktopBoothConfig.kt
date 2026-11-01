package com.lesouvenir.v2.config

import java.nio.file.Files
import java.nio.file.Path

/** Configuration values are never rendered in diagnostics or exception messages. */
data class DesktopBoothConfig(private val values: Map<String, String>) {
    fun get(key: String): String = values[key].orEmpty()
    fun enabled(key: String): Boolean = get(key).equals("true", ignoreCase = true)
    fun seconds(key: String): Int? = get(key).toIntOrNull()?.takeIf { it >= 0 }
    fun status(): Map<String, Any> = mapOf(
        "payOsConfigured" to listOf("PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY").all { get(it).isNotBlank() },
        "cloudinaryConfigured" to listOf("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_UPLOAD_PRESET").all { get(it).isNotBlank() },
        "webAlbumConfigured" to (get("WEB_ALBUM_BASE_URL").isNotBlank() && get("BOOTH_API_KEY").isNotBlank()),
        "revenueEndpointConfigured" to (get("WEB_ALBUM_BASE_URL").isNotBlank() && get("BOOTH_API_KEY").isNotBlank()),
        "databaseConfigured" to (get("NEON_DATABASE_URL").isNotBlank() || get("DATABASE_URL").isNotBlank()),
        "printerConfigured" to (get("PRINTER_NAME_STRIP").isNotBlank() || get("PRINTER_NAME_FULL").isNotBlank()),
        "systemPrintEnabled" to enabled("ENABLE_SYSTEM_PRINT"),
        "beautyEnabled" to enabled("BEAUTY_ENABLED"),
        "hotFolderConfigured" to (enabled("USE_HOT_FOLDER") && get("HOT_FOLDER_PATH").isNotBlank()),
    )
}

object DesktopConfigLoader {
    private val keys = setOf("PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY",
        "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_UPLOAD_PRESET", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET",
        "WEB_ALBUM_BASE_URL", "BOOTH_ID", "BOOTH_API_KEY", "NEON_DATABASE_URL", "DATABASE_URL", "NEON_REVENUE_BOOTH_ID",
        "PRINTER_NAME_STRIP", "PRINTER_NAME_FULL", "ENABLE_SYSTEM_PRINT", "BEAUTY_ENABLED", "BEAUTY_PRESET",
        "POST_CAPTURE_TIMEOUT_SECONDS", "PHOTO_SELECTION_TIMEOUT_SECONDS", "FRAME_SELECTION_TIMEOUT_SECONDS",
        "USE_HOT_FOLDER", "HOT_FOLDER_PATH", "ALBUM_BASE_URL", "ALBUM_TOKEN_PEPPER",
        "BOOTH_KEY_PEPPER", "CRON_SECRET", "ALBUM_RETENTION_DAYS", "SIGNED_URL_TTL_SECONDS",
        "ALBUM_EXPIRES_IN_DAYS")

    fun load(workspace: Path, environment: Map<String, String> = System.getenv(),
             localAppData: Path? = environment["LOCALAPPDATA"]?.let { Path.of(it) }): DesktopBoothConfig {
        val values = mutableMapOf<String, String>()
        fun read(path: Path) {
            if (!Files.isRegularFile(path)) return
            Files.newBufferedReader(path).useLines { lines -> lines.forEach { line ->
                val clean = line.trim().removePrefix("export ")
                if (clean.isEmpty() || clean.startsWith('#') || '=' !in clean) return@forEach
                val key = clean.substringBefore('=').trim()
                if (key !in keys) return@forEach
                val raw = clean.substringAfter('=').trim()
                values[key] = if (raw.length >= 2 && raw.first() == raw.last() && raw.first() in "\"'") raw.substring(1, raw.length - 1) else raw.substringBefore(" #").trim()
            } }
        }
        read(workspace.resolve(".env"))
        localAppData?.let { read(it.resolve("LeSouvenirDesktop/.env")) }
        keys.forEach { key -> environment[key]?.let { values[key] = it } }
        return DesktopBoothConfig(values)
    }
}
