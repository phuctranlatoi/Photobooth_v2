# 01 – V1 Architecture Audit (Read‑only)

## 1. High‑level boot sequence
| Step | Symbol / Class | Source (V1) | What it does |
|------|----------------|-------------|--------------|
| 1 | `fun main()` | `src/main/kotlin/com/phuctran/photobooth/desktop/Main.kt` (lines 33‑45) | Compose‑Desktop `application {}` creates a fullscreen window, **initialises Firebase Admin via `FirebaseManager.initialize()`** (no `.env` file is read), loads `DesktopBoothController` and starts the UI. |
| 2 | `DesktopBoothController` constructor | `src/main/kotlin/com/phuctran/photobooth/desktop/controller/DesktopBoothController.kt` (lines 52‑69) | Instantiates core services (config loader, session store, compositor, camera & printer adapters, payment, remote API clients). |
| 3 | `SessionStateMachine` | `src/main/kotlin/com/phuctran/photobooth/desktop/domain/SessionStateMachine.kt` (import only) | Finite‑state machine that drives the session lifecycle. **The current implementation does not enforce guard checks on illegal transitions.** |
| 4 | UI composables | `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/*.kt` | Each `SessionState` maps to a Compose screen (Start, StudioMode, Quantity, Payment, Preparing, Capture, Printing, Delivery, Admin, Revenue). |
| 5 | Config loader | `src/main/kotlin/com/phuctran/photobooth/desktop/config/DesktopConfigLoader.kt` (referenced) | Reads JSON configuration from `DesktopAppPaths.appDataDir()`.

## 2. Core service interfaces (V1)
| Interface | Implementations (V1) | Source files inspected |
|-----------|----------------------|------------------------|
| `StillCaptureService` | `NativeEosCaptureService`, `WebcamStillCaptureService`, `HotFolderCaptureService`, `CliCaptureService`, `EosUtilityCaptureService` | `NativeEosCaptureService.kt`, `WebcamStillCaptureService.kt`, `HotFolderCaptureService.kt` (CLI & Utility only discovered via imports). |
| `PrinterService` | `SystemPrinterService` (Windows print driver wrapper) | `DesktopIoServices.kt` |
| `AlbumUploadService` | `DesktopAlbumUploader`, `LocalOnlyAlbumUploadService` | `DesktopIoServices.kt` |
| `PaymentService` | `PaymentService` (uses PayOS, **source not opened**) | – |
| `NetworkUtility` | helper class for simple HTTP calls – **source not opened**. |

## 3. State machine transitions (observed calls)
`DesktopBoothController.transitionTo()` is invoked at many points (see grep results, lines 222‑986). The flow **mirrors the user journey**, but the V1 implementation **does not enforce any guard** that would prevent illegal jumps (e.g., `IDLE → PRINTING`).

Observed transitions (partial list):
- `IDLE → SELECTING` (StartScreen button)
- `SELECTING → SELECTING_QUANTITY` (layout/effect confirmed)
- `SELECTING_QUANTITY → PAYMENT_PENDING` (quantity selected)
- `PAYMENT_PENDING → PREPARING` (payment confirmed)
- `PREPARING → LIVE_VIEW` (auto‑advance after timeout)
- `LIVE_VIEW → COUNTDOWN → CAPTURING`
- `CAPTURING → SELECTING_PHOTOS`
- `SELECTING_PHOTOS → EDITING`
- `EDITING → PRINT_PENDING`
- `PRINT_PENDING → PRINTING`
- `PRINTING → DELIVERY`
- `DELIVERY → IDLE`

**No inactivity‑auto‑print** logic is present; the code only resets to `IDLE` after inactivity (`_inactivityTimeLeft`).

### Guard details:
- The only guard used is `enableSystemPrint` before calling `PrinterService` (see `DesktopBoothController.kt` line 762).
- No guard prevents skipping payment or jumping directly to printing.


## 4. Camera adapters – entry points
| Adapter | Class | Constructor call (controller) | Key responsibilities |
|--------|-------|------------------------------|-----------------------|
| Native Canon SDK | `NativeEosCaptureService` | `config.useNativeSdk` → `NativeEosCaptureService(config, imageProcessor)` (line 64) | Opens EDSDK session, provides live view, auto‑reconnect, capture JPEG to output directory. |
| Webcam | `WebcamStillCaptureService` | default branch (line 67) | Uses Sarxos `Webcam`, provides live view & capture, crops to 16:9, applies `DesktopImageProcessor` effects. |
| Hot‑Folder | `HotFolderCaptureService` | `config.useHotFolder` → `HotFolderCaptureService(Path.of(config.hotFolderPath), imageProcessor)` (line 66) | Polls a directory for a new JPEG, copies it through the image processor. |
| CLI wrapper | `CliCaptureService` | `config.useCliCamera` → `CliCaptureService(config, imageProcessor)` (line 65) – source not opened in this audit. |
| Utility wrapper | `EosUtilityCaptureService` – source not opened. |

**Status**: **Observed in code** for the three adapters whose source files were read; CLI & Utility existence confirmed via imports but not inspected.

## 5. Printer integration – entry point
`SystemPrinterService.printImage` (lines 36‑92) uses `java.awt.print.PrinterJob`, forces borderless printing, selects printer by name if supplied, and returns a human‑readable result string.

**Evidence**: `DesktopIoServices.kt` file read.

---
**Files inspected for this audit** (read‑only):
- `src/main/kotlin/com/phuctran/photobooth/desktop/Main.kt`
- `src/main/kotlin/com/phuctran/photobooth/desktop/controller/DesktopBoothController.kt`
- `src/main/kotlin/com/phuctran/photobooth/desktop/services/NativeEosCaptureService.kt`
- `src/main/kotlin/com/phuctran/photobooth/desktop/services/WebcamStillCaptureService.kt`
- `src/main/kotlin/com/phuctran/photobooth/desktop/services/HotFolderCaptureService.kt`
- `src/main/kotlin/com/phuctran/photobooth/desktop/services/DesktopIoServices.kt`
- `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/*` (screen list gathered via grep, not fully opened)
- `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/StartScreen.kt` (partial read for UI flow)
- `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/StudioModeScreen.kt` (partial read for layout filtering)

---
**Coverage gaps** (to be filled by specialist sub‑agents):
- Detailed inspection of `CliCaptureService.kt` and `EosUtilityCaptureService.kt`.
- Full review of `PaymentService.kt`, PayOS request/response handling.
- Remote API clients (`DesktopWebAlbumClient`, `DesktopCloudinaryClient`, `DesktopRevenueClient`).
- Beauty pipeline (`DesktopBeautyService`, ONNX model loading, YuNet/BiSeNet usage). 
- Neon backend integration (`RemoteModels.kt`, `FirebaseManager.kt`).
- Layout/Frame model parsing (`FrameModels.kt`, `LayoutCalculatorTool.kt`).
- Configuration contracts (`DesktopBoothConfig.kt`).
- Test suites for each service (currently only a few unit tests in `src/test/kotlin`).

*All above are flagged as **Missing evidence** until a deeper read is performed.*