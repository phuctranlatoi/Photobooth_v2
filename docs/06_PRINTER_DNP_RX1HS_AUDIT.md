# V1 Windows printing and DNP RX1HS audit

Status: source audit only; no device enumeration, driver inspection, execution, or printing. RX1HS installation, media, cutting and physical results are **not verified**. References below are paths relative to the read-only V1 root `src/main/kotlin/com/phuctran/photobooth/desktop/` unless otherwise stated. No V2 implementation is authorized before the architect IPC contract.

## Confirm to printer and revenue

* `Main.kt:241` invokes `startPrinting(userConfirmed = true)`; `controller/DesktopBoothController.kt:682-715` validates selected photo count, enters editing, then print pending. `:717-757` enters printing, may create an album, and renders selected moment paths, layout, frame and optional album URL. A separate path calls `startPrinting(userConfirmed = false)` at `:310`; confirmation is therefore material to accounting, not a printer-level guard.
* `:758-791` launches printing asynchronously if render succeeded and system printing is enabled. Strip detection is a text match on `5x15` or `5 x 15`; sheets are `max(1, requestedCopies / 2)` using integer division, otherwise `max(1, requestedCopies)`. Strip and full use separate configured printer name strings. Odd strip quantities therefore round down except the minimum; do not silently reinterpret without a product decision.
* `:793-853` uploads in parallel, prepares delivery and a frozen-priced sale. Sale recording occurs only if `userConfirmed`, the print task returns accepted, and session ID still matches. Acceptance means the service returned success after `PrinterJob.print`, **not** independently observed spooler enqueue or physical completion. Disabled printing/render failure or a thrown print exception does not meet this condition. Recording itself can fail and is caught. The source comment at `:857` is not independent queue evidence.
* Duplicate risk: `:718` cancels the prior delivery coroutine but the source establishes neither a durable idempotency key nor an OS job reconciliation mechanism. Cancellation cannot prove a submitted physical job was canceled; never automatically re-submit an ambiguous result.

## Actual Java print implementation

`services/DesktopIoServices.kt:22-24,36-91` uses `ImageIO.read`, `java.awt.print.PrinterJob`, `lookupPrintServices` only when a non-null name is supplied, and first case-insensitive **substring** match. No match silently retains the job's default print service. Blank configured names become null in the controller. This fallback and ambiguous match can send to the wrong device. `config/DesktopBoothConfig.kt:32-33,84-85` defines independent strip/full names; values have not been read.

Only `Copies` is added to request attributes. The job uses `defaultPage`, requests its whole paper as imageable, and supplies a one-page `Printable`. It stretches to the actual callback imageable dimensions; if image and paper orientation differ, it rotates 90 degrees and draws with swapped dimensions. It does not preserve aspect ratio explicitly. Imported media/orientation/printable-area attribute classes are not applied. No explicit job name, paper size, DPI, quality, driver cut property, queue job ID, spooler query, status polling, retry, media detection, or physical-completion confirmation appears in this service. Driver clamping and defaults may override the intended zero margins. A successful `print()` return is only the application's submission-success signal; its exact spooler semantics require testing.

No RX1HS-specific command or 2-inch-cut implementation was found in the inspected Kotlin/Java source (`PrinterJob`/RX1HS/cutter search under V1 `src`). Two-up raster composition is evidence for paired strips, **not evidence of an enabled or supported physical cut**. No claim is made about installed driver presets, actual media, cut direction or printer capabilities. Driver defaults may be essential; verify with an operator and vendor documentation before any change. Hardware placement and handoff slot are physical concerns, not raster/driver options.

## Image pipeline and geometry

`imaging/DesktopImageProcessor.kt:19-57,64-78` applies the selected effect/LUT, falls back to the original on LUT failure, mirrors and saves the capture. Capture services call `saveBoothCapture` (e.g. `services/NativeEosCaptureService.kt:211`; webcam/hot-folder/CLI/EOS utility also do). `controller/DesktopBoothController.kt:549-584` optionally runs Beauty on capture paths, waits up to 15 seconds, substitutes available derivatives, otherwise keeps originals. `:672-679,741-756` selects those paths for the compositor. Validate each capture path and accepted Beauty lineage separately; do not apply LUT or Beauty a second time at print.

`imaging/DesktopCompositor.kt:26-59,67-108,110-186` fixes `renderScale=2`; comment calls this 600 DPI, but source does not establish physical DPI metadata or driver resolution. Dimensions below are actual pixels, not claimed paper measurements:

| Label branch | master canvas | print canvas | placement in print canvas |
|---|---:|---:|---|
| 5x15 | 1184×3580 | 2452×3658 | two masters, x=28 and 1216, y=54; gap 4 |
| 15x10 | 3580×2368 | 3658×2452 | x=54, y=28 |
| other/full | 2368×3580 | 2452×3658 | x=28, y=54 |

The pre-QR master PNG is saved first; QR is drawn only on the subsequent print canvas, with frame position/size taking precedence over layout defaults (`:99-107,330-358`). Strip duplicates the same QR-bearing canvas. Slots use normalized absolute rectangles in list order, otherwise width-based grid/padding/ratio (`:197-233`); photos are center-cropped with bicubic interpolation and a 4-pixel total bleed at this scale (`:67-83,235-265`). Custom frame image is stretched over the canvas; otherwise default frame is drawn (`:85-96,268-320`). Image-read failure leaves a placeholder. This is measurable source behavior, not proof of acceptable printed bleed or color.

`ui/components/PrintPreview.kt:24-82,93-100` renders a separate Compose preview rather than the generated raster. Notably absolute-slot preview indexes moments using `slot.index`, whereas compositor zips slots in list order: out-of-order slot indices can differ. Preview uses layout aspect and omits the printer-page pairing/padding shown above; preview parity is an explicit test/decision, not an assumed property.

## Safe V2 port scope and unresolved dependencies

After architect contract, isolate a Kotlin backend adapter with discovery, capability/status reporting where genuinely obtainable, dry-run render/preview, prepare, gated submit, job/queue observation, typed errors and persistent idempotency keys. Keep V1-derived raster geometry as a reference; reject ambiguous/missing printer identity rather than silently falling back, surface unsupported media/cut as unknown, and require operator reconciliation for uncertain or partial submission. Map V1 revenue to confirmed user action plus V1-equivalent successful submit signal, not physical completion; accounting must be idempotent independently of print submission. Any stricter queue criterion requires product approval.

Java AWT/Java Print Service is evidenced in V1; a packaged V2 JVM with `java.desktop`, Windows driver access, a desktop user session, and host-to-sidecar IPC remains unproved. Native Windows spooler access or a vendor SDK could provide further status, but no such integration is established here; check runtime architecture, permissions and distribution/SDK/driver licensing before selection or packaging. No driver or SDK binaries, runtime configuration, or customer data were inspected or copied. See `HARDWARE_VALIDATION.md` for gates and tests.
