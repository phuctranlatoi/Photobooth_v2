package com.lesouvenir.v2.config

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.*

class DesktopBoothConfigTest {
    @TempDir lateinit var workspace: Path

    @Test fun cloudSyncFlagsDescribeConfigurationWithoutExposingCredentials() {
        val empty = DesktopBoothConfig(emptyMap()).status()
        assertEquals(false, empty["canUploadAlbum"])
        assertEquals(false, empty["cloudSyncConfigured"])
        val album = DesktopBoothConfig(mapOf("BOOTH_API_KEY" to "secret-test", "WEB_ALBUM_BASE_URL" to "https://example.test",
            "CLOUDINARY_CLOUD_NAME" to "cloud-test", "CLOUDINARY_UPLOAD_PRESET" to "preset-test")).status()
        assertEquals(true, album["canUploadAlbum"])
        assertEquals(true, album["cloudSyncConfigured"])
        assertEquals(false, album["databaseConfigured"])
        assertFalse(album.toString().contains("secret-test"))
        val db = DesktopBoothConfig(mapOf("DATABASE_URL" to "jdbc:postgresql://example.test/db")).status()
        assertEquals(true, db["databaseConfigured"])
        assertEquals(true, db["cloudSyncConfigured"])
        assertEquals(false, db["canUploadAlbum"])
    }

    @Test fun albumUrlFallbackAndBoothIdentity() {
        val defaults = DesktopConfigLoader.load(workspace, emptyMap(), null)
        assertEquals("https://web-photobooth-pink.vercel.app", defaults.get("WEB_ALBUM_BASE_URL"))
        assertEquals("booth_1", defaults.get("BOOTH_ID"))
        val legacy = DesktopConfigLoader.load(workspace, mapOf("ALBUM_BASE_URL" to "https://example.test/a/"), null)
        assertEquals("https://example.test", legacy.get("WEB_ALBUM_BASE_URL"))
        val explicit = DesktopConfigLoader.load(workspace, mapOf("WEB_ALBUM_BASE_URL" to "https://another.test/", "BOOTH_ID" to "kiosk"), null)
        assertEquals("https://another.test", explicit.get("WEB_ALBUM_BASE_URL"))
        assertEquals("kiosk", explicit.get("BOOTH_ID"))
    }

    @Test fun configurationPrecedenceAndMaskedDiagnostics() {
        val local = workspace.resolve("local")
        Files.createDirectories(local.resolve("LeSouvenirDesktop"))
        Files.writeString(workspace.resolve(".env"), "PAYOS_API_KEY=workspace-secret\nBOOTH_ID=desk\n")
        Files.writeString(local.resolve("LeSouvenirDesktop/.env"), "PAYOS_API_KEY=local-secret\nBEAUTY_ENABLED=true\n")
        val config = DesktopConfigLoader.load(workspace, mapOf("PAYOS_API_KEY" to "system-secret",
            "PAYOS_CLIENT_ID" to "client-secret", "PAYOS_CHECKSUM_KEY" to "checksum-secret"), local)
        assertEquals("system-secret", config.get("PAYOS_API_KEY"))
        assertEquals("desk", config.get("BOOTH_ID"))
        assertTrue(config.enabled("BEAUTY_ENABLED"))
        assertEquals(true, config.status()["payOsConfigured"])
        val diagnostic = config.status().toString()
        listOf("system-secret", "local-secret", "client-secret", "checksum-secret").forEach {
            assertFalse(diagnostic.contains(it))
        }
    }

    @Test fun productionLayoutsHaveIndependentCountsAndNoSyntheticFixtures() {
        val json = com.google.gson.JsonParser.parseString(Files.readString(Path.of("config/production-layouts.json"))).asJsonObject
        val layouts = json["layouts"].asJsonArray.map { it.asJsonObject }
        assertEquals(listOf("strip-5x15", "print-10x15"), layouts.map { it["id"].asString })
        assertEquals(listOf(4, 6), layouts.map { it["shotCount"].asInt })
        assertEquals(listOf(3, 4), layouts.map { it["selectCount"].asInt })
        assertTrue(layouts.all { it["countdownSeconds"].asInt == 5 })
    }

    @Test fun extendedKeysLoadAndHotFolderStatusIsMasked() {
        val supplied = mapOf(
            "USE_HOT_FOLDER" to "true", "HOT_FOLDER_PATH" to "test-folder",
            "ALBUM_BASE_URL" to "test-album", "ALBUM_TOKEN_PEPPER" to "test-pepper",
            "BOOTH_KEY_PEPPER" to "test-key-pepper", "CRON_SECRET" to "test-cron",
            "ALBUM_RETENTION_DAYS" to "7", "SIGNED_URL_TTL_SECONDS" to "900",
            "ALBUM_EXPIRES_IN_DAYS" to "7"
        )
        val config = DesktopConfigLoader.load(workspace, supplied, null)
        supplied.forEach { (key, value) -> assertEquals(value, config.get(key)) }
        assertEquals(true, config.status()["hotFolderConfigured"])
        assertTrue(config.status().values.all { it is Boolean })
        supplied.values.filter { it.startsWith("test-") }.forEach {
            assertFalse(config.status().toString().contains(it))
        }
        val disabled = DesktopConfigLoader.load(workspace, supplied + ("USE_HOT_FOLDER" to "false"), null)
        assertEquals(false, disabled.status()["hotFolderConfigured"])
    }
}
