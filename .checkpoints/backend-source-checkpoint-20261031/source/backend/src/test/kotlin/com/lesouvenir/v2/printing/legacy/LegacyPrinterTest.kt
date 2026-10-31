package com.lesouvenir.v2.printing.legacy

import java.awt.Color
import java.awt.image.BufferedImage
import java.awt.print.PageFormat
import java.awt.print.Paper
import java.awt.print.Printable
import java.nio.file.Files
import java.nio.file.Paths
import javax.imageio.ImageIO
import kotlin.test.*

class LegacyPrinterTest {
    @Test fun denyBeforeFacadeOrImageAccess() {
        var calls = 0
        val facade = PrintFacade { _, _ -> calls++; error("must not access printer") }
        val request = PrintRequest(Paths.get("nonexistent-fixture.png"), 1, "synthetic")
        assertEquals(PrintResult.Denied, LegacyPrinter(facade = facade).submit(request))
        assertEquals(PrintResult.Denied, LegacyPrinter(PrintAuthorization { false }, facade).submit(request))
        assertEquals(0, calls)
    }

    @Test fun authorizedValidationAndFakeSubmission() {
        val file = Files.createTempFile(Paths.get("."), "printer-fixture-", ".png")
        try {
            val image = BufferedImage(2, 3, BufferedImage.TYPE_INT_RGB)
            assertTrue(ImageIO.write(image, "png", file.toFile()))
            var calls = 0
            val facade = PrintFacade { request, decoded ->
                calls++; assertEquals(2, decoded.width); assertEquals(3, decoded.height)
                PrintResult.Submitted(request.printerName)
            }
            val printer = LegacyPrinter(PrintAuthorization { true }, facade)
            assertIs<PrintResult.Rejected>(printer.submit(PrintRequest(file, 0, "fixture")))
            assertIs<PrintResult.Rejected>(printer.submit(PrintRequest(file, 1, " ")))
            assertEquals(0, calls)
            assertEquals(PrintResult.Submitted("fixture"), printer.submit(PrintRequest(file, 2, "fixture")))
            assertEquals(1, calls)
        } finally { Files.deleteIfExists(file) }
    }

    @Test fun printableUsesImageableAreaAndRotatesMismatch() {
        val image = BufferedImage(2, 4, BufferedImage.TYPE_INT_RGB)
        val ig = image.createGraphics(); ig.color = Color.RED; ig.fillRect(0, 0, 2, 2)
        ig.color = Color.BLUE; ig.fillRect(0, 2, 2, 2); ig.dispose()
        val format = PageFormat().apply { paper = Paper().apply { setSize(20.0, 12.0); setImageableArea(2.0, 1.0, 16.0, 8.0) } }
        val output = BufferedImage(20, 12, BufferedImage.TYPE_INT_RGB)
        val graphics = output.createGraphics()
        try {
            assertEquals(Printable.PAGE_EXISTS, LegacyPrintable(image).print(graphics, format, 0))
        } finally { graphics.dispose() }
        assertEquals(Color.BLACK.rgb, output.getRGB(0, 0))
        assertEquals(Color.BLUE.rgb, output.getRGB(4, 4))
        assertEquals(Color.RED.rgb, output.getRGB(15, 4))
        val other = output.createGraphics()
        try { assertEquals(Printable.NO_SUCH_PAGE, LegacyPrintable(image).print(other, format, 1)) } finally { other.dispose() }
    }
}
