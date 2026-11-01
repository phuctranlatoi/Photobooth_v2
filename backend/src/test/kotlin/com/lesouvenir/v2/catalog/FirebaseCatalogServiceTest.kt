package com.lesouvenir.v2.catalog

import com.lesouvenir.v2.foundation.LayoutFamily
import com.lesouvenir.v2.foundation.LayoutMode
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.*

class FirebaseCatalogServiceTest {
    @TempDir lateinit var root: Path
    private val production = """{"layouts":[{"id":"local","title":"Local","family":"Grid","shotCount":4,"selectCount":2,"countdownSeconds":5,"printSizeLabel":"10x15"}]}"""
    @Test fun productionCacheAndRemoteHierarchy() {
        val config = root.resolve("backend/config")
        Files.createDirectories(config)
        Files.writeString(config.resolve("production-layouts.json"), production)
        val remoteLayout = LayoutMode("remote", "Remote", "", "", LayoutFamily.Grid, 3, 2, 1, 0, "", 0,
            absoluteSlots = listOf(com.lesouvenir.v2.foundation.LayoutSlot(0, 0f, 0f, 1f, 1f)))
        fun catalog(remote: () -> List<LayoutMode>) = FirebaseCatalogService(
            workspace = root, remote = remote, localAppData = null, credentialOverride = null)
        assertEquals("local", catalog { throw IllegalStateException("offline") }.getLayouts().single().id)
        assertEquals("remote", catalog { listOf(remoteLayout) }.sync(true).single().id)
        assertTrue(Files.readString(config.resolve("firebase-layouts-cache.json")).contains("remote"))
        assertEquals("remote", catalog { throw IllegalStateException("offline") }.sync(true).single().id)
    }
}
