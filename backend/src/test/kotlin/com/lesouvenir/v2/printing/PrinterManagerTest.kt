package com.lesouvenir.v2.printing

import com.lesouvenir.v2.printing.legacy.*
import java.awt.image.BufferedImage
import java.nio.file.Files
import kotlin.test.*
import javax.imageio.ImageIO

class PrinterManagerTest {
    private fun fixture(w: Int, h: Int) = Files.createTempFile("print-test", ".png").also {
        ImageIO.write(BufferedImage(w, h, BufferedImage.TYPE_INT_RGB), "png", it.toFile())
    }

    @Test fun discoveryAndUnavailableFailClosed() {
        val manager = PrinterManager(discovery = PrinterDiscovery { listOf("DNP DS-RX1HS") })
        assertEquals("DNP DS-RX1HS", manager.detectDnpRx1hs())
        val file = fixture(2452, 3658)
        try {
            val unavailable = PrinterManager(discovery = PrinterDiscovery { emptyList() }, dryRun = false)
            val outcome = unavailable.print(ManagedPrintRequest("s1", file, 1, "missing", PrintLayout.CUT_5X15_2UP))
            assertFalse(outcome.printAccepted)
            assertIs<PrintResult.Rejected>(outcome.result)
        } finally { Files.deleteIfExists(file) }
    }

    @Test fun validatesSupportedDimensionsAndDuplicateKey() {
        val portrait = fixture(2452, 3658); val landscape = fixture(3658, 2452); val wrong = fixture(100, 100)
        try {
            val manager = PrinterManager(dryRun = true)
            assertIs<PrintResult.Rejected>(manager.print(ManagedPrintRequest("a", wrong, 1, "x", PrintLayout.CUT_5X15_2UP)).result)
            assertIs<PrintResult.Rejected>(manager.print(ManagedPrintRequest("b", portrait, 1, "x", PrintLayout.CUT_5X15_2UP)).result)
            assertIs<PrintResult.Rejected>(manager.print(ManagedPrintRequest("c", landscape, 1, "x", PrintLayout.PHOTO_10X15)).result)
            val same = ManagedPrintRequest("d", landscape, 1, "x", PrintLayout.PHOTO_10X15)
            manager.print(same)
            assertIs<PrintResult.Rejected>(manager.print(same).result)
        } finally { listOf(portrait, landscape, wrong).forEach(Files::deleteIfExists) }
    }
}
