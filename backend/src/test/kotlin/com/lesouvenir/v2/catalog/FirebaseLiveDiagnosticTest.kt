package com.lesouvenir.v2.catalog

import com.google.gson.JsonParser
import org.junit.jupiter.api.Assumptions.assumeTrue
import org.junit.jupiter.api.Test
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class FirebaseLiveDiagnosticTest {
    @Test fun liveCatalogAndAtomicCacheDiagnostic() {
        val workspace = Path.of("..").toAbsolutePath().normalize()
        val override = System.getProperty("FIREBASE_SERVICE_ACCOUNT_PATH") ?: System.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        val local = System.getenv("LOCALAPPDATA")?.let { Path.of(it).resolve("LeSouvenirDesktop/serviceAccountKey.json") }
        val credentials = listOfNotNull(workspace.resolve("serviceAccountKey.json"),
            workspace.resolve("backend/serviceAccountKey.json"), local, override?.let(Path::of))
        val present = credentials.any(Files::isRegularFile)
        if (!present) println("Firebase diagnostic: credential absent; live check skipped (no network request)")
        assumeTrue(present, "No discoverable service account; live diagnostic requires explicit credentials")

        val service = FirebaseCatalogService(workspace = workspace)
        val layouts = service.sync(forceRemote = true)
        println("Firebase diagnostic: source=${service.source}; Firestore layout count=${if (service.source == CatalogSource.FIREBASE_LIVE) layouts.size else 0}")
        assertEquals(CatalogSource.FIREBASE_LIVE, service.source, "Live fetch failed: ${service.lastSyncError}")
        assertTrue(layouts.isNotEmpty())
        layouts.forEach { layout ->
            println("Layout: id=${layout.id}, title=${layout.title}, printSizeLabel=${layout.printSizeLabel}, " +
                "slotCount=${layout.absoluteSlots.size}, shotCount=${layout.shotCount}, " +
                "selectCount=${layout.selectCount}, countdownSeconds=${layout.countdownSeconds}, basePrice=${layout.basePrice}")
        }
        val cache = workspace.resolve("backend/config/firebase-layouts-cache.json")
        assertTrue(Files.isRegularFile(cache), "Live cache was not written")
        val ids = JsonParser.parseString(Files.readString(cache)).asJsonObject.getAsJsonArray("layouts")
            .map { it.asJsonObject.get("id").asString }
        assertEquals(layouts.map { it.id }, ids)
        println("Firebase diagnostic: cache contains ${ids.size} fetched layouts")
    }
}
