package com.lesouvenir.v2.printing

import java.awt.print.PageFormat
import java.awt.print.Printable
import java.awt.print.PrinterJob
import java.nio.file.Path
import javax.imageio.ImageIO
import javax.print.attribute.HashPrintRequestAttributeSet
import javax.print.attribute.standard.Copies

/** V1 Windows spooler path. A successful result means submitted to the spooler, not physically printed. */
class SystemPrinterService {
    fun printImage(path: Path, copies: Int = 1, printerName: String? = null): Result<String> = runCatching {
        require(path.toFile().exists()) { "File ảnh in không tồn tại." }
        val image = ImageIO.read(path.toFile()) ?: error("Không thể đọc file ảnh.")
        val printJob = PrinterJob.getPrinterJob()
        if (printerName != null) {
            PrinterJob.lookupPrintServices().find { it.name.contains(printerName, ignoreCase = true) }
                ?.let { printJob.printService = it }
        }
        val attributes = HashPrintRequestAttributeSet().apply { add(Copies(copies)) }
        val pageFormat = printJob.defaultPage()
        val paper = pageFormat.paper
        paper.setImageableArea(0.0, 0.0, paper.width, paper.height)
        pageFormat.paper = paper
        printJob.setPrintable(object : Printable {
            override fun print(graphics: java.awt.Graphics, pf: PageFormat, pageIndex: Int): Int {
                if (pageIndex > 0) return Printable.NO_SUCH_PAGE
                val g2d = graphics as java.awt.Graphics2D
                g2d.translate(pf.imageableX, pf.imageableY)
                val destWidth = pf.imageableWidth.toInt()
                val destHeight = pf.imageableHeight.toInt()
                if ((image.width > image.height) != (destWidth > destHeight)) {
                    g2d.translate(destWidth / 2.0, destHeight / 2.0)
                    g2d.rotate(Math.PI / 2)
                    g2d.drawImage(image, -destHeight / 2, -destWidth / 2, destHeight, destWidth, null)
                } else {
                    g2d.drawImage(image, 0, 0, destWidth, destHeight, null)
                }
                return Printable.PAGE_EXISTS
            }
        }, pageFormat)
        printJob.print(attributes)
        "Đã gửi lệnh in $copies bản tới ${printJob.printService?.name ?: "máy in mặc định"}."
    }
}
