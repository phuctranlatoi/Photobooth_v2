# V1 Printer Implementation Analysis (read-only audit)

Scope: inspected V1 `SystemPrinterService` in `services/DesktopIoServices.kt` (lines 36–92), submission logic in `controller/DesktopBoothController.kt` (around lines 755–790), `DesktopBoothConfig.kt`, and `ui/screens/PrintingScreen.kt`. This is source inspection only; no build, spooler operation, or physical print was performed.

## V1 print flow

1. `SystemPrinterService.printImage(path, copies, printerName)` is wrapped in `runCatching`. It requires the file to exist and loads it with `ImageIO.read`; null decode raises an exception.
2. It creates a Java `PrinterJob` with `PrinterJob.getPrinterJob()`.
3. If a non-null printer name was supplied, it calls `PrinterJob.lookupPrintServices()`, selecting the first service whose name `contains(printerName, ignoreCase = true)`. If none matches, it does not fail or report the miss; the job retains its current/default print service. This is substring matching, not exact name resolution.
4. It creates `HashPrintRequestAttributeSet`, adding `Copies(copies)`.
5. It takes `printJob.defaultPage()`, obtains its `Paper`, sets the imageable area to `(0, 0, paper.width, paper.height)` (borderless/full-page request), assigns the paper back to the page format, and registers a `Printable` with that `PageFormat`.
6. The printable supports only page index 0. It translates graphics to `imageableX/Y`, then compares image orientation (`width > height`) with destination orientation (`destWidth > destHeight`). If different, it translates to destination center, rotates +90 degrees, and draws the image with swapped destination dimensions; otherwise it draws the image directly to the full destination rectangle. The direct draw fills the page rectangle, so aspect ratio is not independently preserved here. No explicit DPI, crop/bleed policy, media-size selection, or print-quality attribute is set by this method.
7. It calls `printJob.print(attributes)` synchronously. On return it reports “sent” and the selected service name, or “default printer” if absent. This means accepted by the Java print call, not confirmed physically printed.

## Layout routing and copies

The controller reads `renderResult.printImagePath`; system printing occurs only when that path exists and `enableSystemPrint` is true. It detects strip layout from `printSizeLabel` containing `5x15` or `5 x 15`, case-insensitively. For strip, `actualSheets = max(1, requestedCopies / 2)` using integer division, then routes to configured `printerNameStrip`; for other layouts it routes to `printerNameFull` and uses configured copies unchanged. Blank configured names become `null`, causing default-printer use. The print service's success result sets the local `accepted` flag; failures are converted to a status string. Disabled printing leaves the rendered local print file and states that system printing is disabled.

For strip, composition is in the compositor, not the printer service: the 5×15 print canvas is 1226×1829 and places two 592×1790 strip images side-by-side on 10×15 stock. Thus requested copies count individual strips, while spooler `Copies` counts sheets (integer division, minimum one). Odd strip counts are rounded down to whole sheets, with the minimum-one rule producing one sheet for requested 1. This is important behavior to verify before V2 adopts it.

For full formats, the compositor produces the selected full print image and the controller routes directly to `printerNameFull`; copies are not halved. The `printSizeLabel` may cover 10×15 or 15×10 orientation. The printer service does not itself choose paper size or orientation beyond auto-rotating the image to match the driver-provided page dimensions.

Configuration facts: `DesktopBoothConfig` declares `printerNameStrip` and `printerNameFull` as blank-by-default strings, loaded from `PRINTER_NAME_STRIP` and `PRINTER_NAME_FULL`. The inspected config has no `paperSize` or `printQuality` fields. Do not assume undocumented configuration/driver options exist.

## Queue, errors, and UI

The Java `print()` call is synchronous from the service's perspective. The controller invokes it inside `scope.async(Dispatchers.IO)` so the broader workflow can proceed concurrently, but V1 has no explicit asynchronous spooler queue polling, job identifier tracking, completion confirmation, or retry policy in the inspected path. A returned success is submission acceptance only.

`runCatching` converts exceptions (including `PrinterException`) to `Result.failure`; the controller turns failure into a human-readable “could not send to Windows Print” message. The inspected print branch does not directly transition to `SessionState.ERROR`; do not claim that printer exceptions are translated to that state. `PrintingScreen` is progress/status UI: it displays pipeline steps and supplied status text with a spinner; it has no printer-status or queue monitoring logic.

## DNP RX1HS findings and gaps

**No DNP-specific code found.** V1 uses generic Java Print Service / Windows print spooler calls. DNP RX1HS driver behavior—including cutter handling, media selection, color profile, borderless capability, and bidirectional status—is entirely unverified from this implementation. Do not invent cutter or driver options.

Not implemented/verified in the inspected path: paper-out, ribbon-out, cover-open detection; cutter control; per-job monitoring/completion; robust exact printer-name validation; reprint capability; explicit duplicate suppression/idempotency; and safe classification of partial success. V1 has no explicit retry policy. Driver/provider may expose capabilities beyond this code, but that has not been established.

## V2 reuse guidance

### Preserve as behavioral reference (not blind copy)
- Preserve source-image path validation and decode failure reporting.
- Preserve configured routing intent (strip vs full), the documented layout pixel geometry, copy semantics, and orientation decision as measured against V1 fixtures.
- Preserve the fact that borderless is requested by using the entire page imageable area, but make unsupported media/borderless capability explicit rather than silently implying it worked.
- Preserve the rendered image as the print payload; keep composition separate from submission.

### Adapt for the V2 backend adapter
- Keep all printer access in Kotlin/backend behind architect IPC. Provide discovery, status, dry-run preview, prepare/submit, queue status, structured errors, and idempotency keys. Default to dry-run; never print as a side effect of preview or preparation.
- Replace permissive substring matching/fallback-to-default with validated selection and explicit operator-visible mismatch. Resolve a stable selected device and verify the selected service before submission.
- Expose accepted/submitted separately from completed/failed/unknown. Do not infer physical completion from synchronous `PrinterJob.print()` return.
- Preserve exact pixel dimensions/orientation and test fit/crop behavior; do not silently stretch or add scaling changes. Establish driver media/DPI behavior only through read-only capability evidence and authorized testing.
- Add bounded, safe retry semantics only when idempotency/partial-success behavior is understood; otherwise report outcome unknown and require operator reconciliation to avoid duplicate prints.
- UI should consume backend status and actionable errors, not run printer logic itself.

## Licensing

Java Print Service (`javax.print`) is part of the JDK; no additional license dependency is identified for this API usage. This does not establish licensing/redistribution rights for the DNP driver or any separate vendor SDK. No DNP SDK use was found.

## Verification status

This document records source-level facts only. No V1/V2 pixel comparison, simulated spooler test, driver capability inspection, or physical RX1HS test has been performed. Physical testing requires explicit authorization and a stated media type and expected paper consumption.
