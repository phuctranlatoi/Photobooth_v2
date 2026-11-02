package com.lesouvenir.v2.printing.legacy

import java.nio.file.Files
import java.nio.file.Path
import javax.imageio.ImageIO
import java.awt.print.PrinterJob

enum class PrintLayout(val width: Int, val height: Int) {
    CUT_5X15_2UP(1226, 1829),
    PHOTO_10X15(1829, 1226)
}

data class ManagedPrintRequest(
    val sessionId: String,
    val image: Path,
    val copies: Int,
    val printerName: String,
    val layout: PrintLayout
)

data class ManagedPrintOutcome(val result: PrintResult, val printAccepted: Boolean)

fun interface PrinterDiscovery { fun names(): List<String> }

/** Owns validation and duplicate protection; real device access remains delegated to LegacyPrinter. */
class PrinterManager(
    private val printer: LegacyPrinter = LegacyPrinter(),
    private val discovery: PrinterDiscovery = PrinterDiscovery { PrinterJob.lookupPrintServices().map { it.name } },
    private val dryRun: Boolean = true
) {
    private val submittedSessions = mutableSetOf<String>()
    @Synchronized fun getAvailablePrinters(): List<String> = discovery.names()
    fun detectDnpRx1hs(): String? = getAvailablePrinters().firstOrNull { it.contains("DS-RX1", true) || it.contains("RX1", true) }

    @Synchronized fun print(request: ManagedPrintRequest): ManagedPrintOutcome {
        if (request.sessionId.isBlank()) return ManagedPrintOutcome(PrintResult.Rejected("Session ID is required"), false)
        if (request.copies < 1) return ManagedPrintOutcome(PrintResult.Rejected("Copy count must be positive"), false)
        if (!Files.isRegularFile(request.image)) return ManagedPrintOutcome(PrintResult.Rejected("Print image does not exist"), false)
        val image = try { ImageIO.read(request.image.toFile()) } catch (_: Exception) { null }
            ?: return ManagedPrintOutcome(PrintResult.Rejected("Print image cannot be read"), false)
        if (image.width != request.layout.width || image.height != request.layout.height)
            return ManagedPrintOutcome(PrintResult.Rejected("Expected ${request.layout.width}x${request.layout.height} image; got ${image.width}x${image.height}"), false)
        if (submittedSessions.contains(request.sessionId)) return ManagedPrintOutcome(PrintResult.Rejected("This session already has a print submission"), false)
        if (dryRun) return ManagedPrintOutcome(PrintResult.Rejected("Dry run: no print submitted"), false)
        if (request.printerName !in getAvailablePrinters()) return ManagedPrintOutcome(PrintResult.Rejected("Selected printer is unavailable; no print was submitted"), false)
        val result = printer.submit(PrintRequest(request.image, request.copies, request.printerName))
        if (result is PrintResult.Submitted || result is PrintResult.Uncertain) submittedSessions.add(request.sessionId)
        return ManagedPrintOutcome(result, result is PrintResult.Submitted)
    }
}
