# Printer baseline inventory (Phase A, read-only audit)

Scope: code-level source inventory only. V1 was inspected through read/glob/grep; no hardware, spooler, production service, customer/runtime data, or secrets were accessed. No print was initiated. Line references below are source line numbers. “Unknown” means not established by inspected code, not a claim about connected hardware.

## V1 path and printer behavior

| Concern | Evidence / finding |
|---|---|
| Adapter boundary | `src/main/kotlin/com/phuctran/photobooth/desktop/services/DesktopIoServices.kt:22-24` declares `PrinterService.printImage(path, copies, printerName?)`. `:36-49` reads the image, obtains Java `PrinterJob`, and looks up services. A supplied name is matched by substring; if no match is found, it silently keeps the default service. There is no visible printer discovery/status API here. |
| Spool submission | Same file `:51-58` adds `Copies(copies)` and clears the default imageable margin to full paper. `:60-88` uses a one-page `Printable`; `:88-90` invokes `printJob.print` and reports “sent” based on return. No job ID/queue confirmation is obtained. |
| Orientation/scaling | `DesktopIoServices.kt:67-82` compares image and imageable-area orientation, rotates when unequal, and draws the image to the full imageable area. It does not preserve aspect ratio in that draw call; it stretches to the destination dimensions. Imageable area comes from default driver page format; no explicit media-size selection is evident. |
| Selection/settings | `src/main/kotlin/com/phuctran/photobooth/desktop/controller/DesktopBoothController.kt:764-775` classifies strip by label substring, chooses `printerNameStrip` or `printerNameFull`, and supplies `actualSheets`. Exact configured name resolution, defaults, and setting UI are not established in this audit. `DesktopIoServices.kt:43-49` has the permissive substring/fallback behavior. |
| Print count / economics boundary | `DesktopBoothController.kt:756-779` submits rendered print file only when `enableSystemPrint`; otherwise it reports local render/no print. `:831-850` snapshots sale pricing and records local sale only after user confirmation and successful awaited print result. `src/test/kotlin/com/phuctran/photobooth/desktop/RevenueAccountingTest.kt:140-179` covers disabled print, success, and failure accounting with a fake printer. Exact sheet conversion is at controller `:764-775` (strip path computes `actualSheets`; inspect this code in implementation phase before parity port). |
| Composition/output | `src/main/kotlin/com/phuctran/photobooth/desktop/imaging/DesktopCompositor.kt:27-57` chooses output dimensions by size label and doubles base pixel dimensions (`renderScale = 2`); `:75` applies bleed and `:111-145` contains strip/full-page geometry. `DesktopBoothController.kt:742-756` renders via compositor and routes `printImagePath` to printer. Layout labels/dimension mapping need fixture-based verification before treating as parity. |
| Cut handling | No printer cut/media/cutter command is evidenced in the inspected printer adapter. Do not infer RX1HS 2-inch cut support from strip label or printer model. Confirm V1 driver configuration/workflow with authorized operator evidence before implementation. |
| Errors/retries | V1 service wraps failures as `Result`; controller reports result status (`DesktopBoothController.kt:756-788`). No idempotency key, duplicate-submission guard, queue polling, timeout/reconciliation, or safe retry policy is visible in the inspected path. A returned print call is not proof of physical output. |
| Driver/hardware | Code uses installed Java Print Services, but selected driver identity/version, RX1HS presence, paper loaded, status, supported media, cut settings, queue semantics, and handoff slot arrangement are unknown. No device operation was performed. |

## V2 existing work and gaps

Existing implementation is `backend/src/main/kotlin/com/lesouvenir/v2/printing/legacy/LegacyPrinter.kt`. It is explicitly gated by backend `PrintAuthorization` defaulting deny (`:14-18,35-45`), validates positive copies and explicit printer name, reads image, and injects a `PrintFacade` (`:30-44`). AWT matching is exact/case-insensitive and rejects absent/ambiguous printer names rather than falling back (`:48-58`). It carries over V1 copies, margin, and printable orientation behavior (`:59-93`), and distinguishes rejected/pre-submit from uncertain/post-boundary errors (`:21-27,52-71`).

`backend/src/test/kotlin/com/lesouvenir/v2/printing/legacy/LegacyPrinterTest.kt:13-39` tests deny-before-facade, input validation and injected fake submission; `:42-57` tests printable dimensions/orientation behavior using synthetic images. Tests do not access printer services.

This is a partial legacy port, not an RX1HS-ready adapter. No inspected V2 implementation provides discovery, read-only status, preview contract, prepare/submit separation, queue status, job metadata/IDs, idempotency, retry/reconciliation, media selection, calibration/settings, cut flow, 5x15/10x15 layout mapping, or architect IPC integration. Existing V2 composition and output equivalence to V1, driver-specific dimensions, and revenue gating integration require verification. No physical support claim is made.

## Bounded parity implementation candidates (pending checkpoint)

1. Define backend-owned IPC DTOs for discovery, status, dry-run preview, prepare, submit, queue status, structured error and idempotency; keep real submission denied by default and require explicit backend authorization. Never let UI supply an unchecked print-enable boolean.
2. Preserve the exact-match/fail-closed selection and uncertain-submission result semantics already present in V2. Do not automatically retry an uncertain job; give operator reconciliation guidance.
3. Audit exact V1 `actualSheets` logic and frozen print-count/pricing semantics; port only after documenting its formula and adding tests. Enforce revenue/sale success boundary against confirmed application-level outcome without representing driver return as physical confirmation.
4. Verify compositor mapping/output pixel dimensions with synthetic fixtures for every supported layout and compare V1/V2; separately measure preview-to-file orientation/crop. Avoid claiming DPI/media/cut parity until driver evidence exists.
5. Add fake-spooler tests for missing/ambiguous/offline, pre-submit rejection, post-submit uncertainty, delayed queue, duplicate key, partial success and no-duplicate retry. Keep all tests dry-run.
6. Hardware/driver validation, installed driver identity, media dimensions, margins, 2-inch cut support, queue confirmation behavior, and licensing remain operator/SDK/driver dependencies. Obtain explicit authorization specifying media and expected consumption before any real DNP test.

## Safety / audit status

No V1 files were modified. No V1 shell/build/run or print/device operation occurred. No customer photos, secrets, production calls, or runtime settings were read or copied. Only this V2 document was written.
