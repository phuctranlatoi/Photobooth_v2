package com.lesouvenir.v2.storage

import com.lesouvenir.v2.imaging.EffectMode
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.nio.file.Path
import javax.imageio.ImageIO
import kotlin.test.*

class OperatorStoresTest {
    @TempDir lateinit var workspace: Path
    @Test fun framesAreValidatedSavedAndIndexed() {
        val store = FrameStore(workspace, null)
        assertFailsWith<IllegalArgumentException> { store.addCustomFrame("bad", byteArrayOf(1, 2), "5x15", "strip") }
        assertFailsWith<IllegalArgumentException> { store.addCustomFrame("bad", byteArrayOf(1), "5x15", "../escape") }
        val out = ByteArrayOutputStream()
        ImageIO.write(BufferedImage(4, 4, BufferedImage.TYPE_INT_ARGB), "png", out)
        val frame = store.addCustomFrame("Holiday!", out.toByteArray(), "5x15", "strip", true, "Party", 1, 2, 3)
        assertEquals("5x15/strip/Special/Party/Holiday_", frame.id)
        assertEquals(3, frame.qrCodeSize)
        assertEquals(frame.id, store.loadFrames("strip", "5x15").single().id)
    }
    @Test fun filtersPersistAndInvalidLutsAreRejected() {
        val store = FilterStore(workspace)
        assertEquals(3, store.loadFilters().size)
        store.saveFilter(EffectMode("personal", "Custom"))
        assertTrue(Files.exists(workspace.resolve("data/config/filters.json")))
        assertEquals(4, FilterStore(workspace).loadFilters().size)
        assertTrue(store.deleteFilter("personal"))
        assertFalse(store.deleteFilter("personal"))
        assertFailsWith<IllegalArgumentException> { store.importLut("broken", "LUT_3D_SIZE 2") }
        val cube = "LUT_3D_SIZE 2\n" + List(8) { "0 0 0" }.joinToString("\n")
        val filename = store.importLut("test", cube)
        assertTrue(Files.isRegularFile(workspace.resolve("data/filters/luts/$filename")))
    }
}
