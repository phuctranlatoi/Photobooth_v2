package com.lesouvenir.v2.printing.legacy

import java.awt.Graphics
import java.awt.Graphics2D
import java.awt.image.BufferedImage
import java.awt.print.PageFormat
import java.awt.print.Printable
import java.awt.print.PrinterJob
import java.nio.file.Path
import javax.imageio.ImageIO
import javax.print.attribute.HashPrintRequestAttributeSet
import javax.print.attribute.standard.Copies

/** Explicit per-job authority is checked by the backend, never supplied by an IPC boolean. */
fun interface PrintAuthorization {
    fun allows(request: PrintRequest): Boolean
}

data class PrintRequest(val image: Path, val copies: Int, val printerName: String)

sealed interface PrintResult {
    data object Denied : PrintResult
    data class Rejected(val reason: String) : PrintResult
    /** The driver call returned; this does not confirm queueing or physical output. */
    data class Submitted(val printerName: String) : PrintResult
    /** Submission may have happened: reconcile manually, do not automatically retry. */
    data class Uncertain(val cause: Throwable) : PrintResult
}

/** Injection boundary: implementations must not touch a print service until called. */
fun interface PrintFacade {
    fun submit(request: PrintRequest, image: BufferedImage): PrintResult
}

class LegacyPrinter(
    private val authorization: PrintAuthorization = PrintAuthorization { false },
    private val facade: PrintFacade = AwtPrintFacade()
) {
    fun submit(request: PrintRequest): PrintResult {
        if (!authorization.allows(request)) return PrintResult.Denied
        if (request.copies < 1 || request.printerName.isBlank()) return PrintResult.Rejected("A printer name and positive copy count are required")
        val image = try { ImageIO.read(request.image.toFile()) } catch (_: Exception) { null }
            ?: return PrintResult.Rejected("Print image cannot be read")
        return facade.submit(request, image)
    }
}

/** V1 DesktopIoServices.kt SystemPrinterService.printImage, with fail-closed selection. */
private class AwtPrintFacade : PrintFacade {
    override fun submit(request: PrintRequest, image: BufferedImage): PrintResult {
        // Recheck at the boundary; direct use cannot select the system default accidentally.
        if (request.copies < 1 || request.printerName.isBlank()) return PrintResult.Rejected("A printer name and positive copy count are required")
        var printingStarted = false
        return try {
            val matches = PrinterJob.lookupPrintServices().filter { it.name.equals(request.printerName, ignoreCase = true) }
            if (matches.size != 1) return PrintResult.Rejected("Printer name is missing or ambiguous")
            val job = PrinterJob.getPrinterJob()
            job.printService = matches.single()
            val attributes = HashPrintRequestAttributeSet()
            attributes.add(Copies(request.copies))
            val format = job.defaultPage()
            val paper = format.paper
            paper.setImageableArea(0.0, 0.0, paper.width, paper.height)
            format.paper = paper
            job.setPrintable(LegacyPrintable(image), format)
            printingStarted = true
            job.print(attributes)
            PrintResult.Submitted(matches.single().name)
        } catch (e: Exception) {
            if (printingStarted) PrintResult.Uncertain(e) else PrintResult.Rejected("Printer preparation failed: ${e.javaClass.simpleName}")
        }
    }
}

/** Direct port of V1's single-page callback; actual imageable dimensions come from the driver. */
class LegacyPrintable(private val image: BufferedImage) : Printable {
    override fun print(graphics: Graphics, pf: PageFormat, pageIndex: Int): Int {
        if (pageIndex > 0) return Printable.NO_SUCH_PAGE
        val g2d = graphics as Graphics2D
        g2d.translate(pf.imageableX, pf.imageableY)
        val destWidth = pf.imageableWidth.toInt()
        val destHeight = pf.imageableHeight.toInt()
        val isImageLandscape = image.width > image.height
        val isPaperLandscape = destWidth > destHeight
        if (isImageLandscape != isPaperLandscape) {
            g2d.translate(destWidth / 2.0, destHeight / 2.0)
            g2d.rotate(Math.PI / 2)
            g2d.drawImage(image, -destHeight / 2, -destWidth / 2, destHeight, destWidth, null)
        } else {
            g2d.drawImage(image, 0, 0, destWidth, destHeight, null)
        }
        return Printable.PAGE_EXISTS
    }
}
