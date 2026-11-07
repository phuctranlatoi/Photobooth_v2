# Feature Parity & Gap Matrix (V1 Legacy vs V2 Target)

This document maps every capability from the legacy V1 system (`E:\HK1_2026_2027\PhotoboothDesktop`) to the architectural strategy of V2 (`E:\HK1_2026_2027\PhotoboothDesktop_v2`), categorizing each feature by parity priority (**Critical**, **Important**, **Optional**) and documenting evidence-backed implementation gaps.

---

## 1. Feature Parity Matrix

| Feature / Domain | V1 Implementation Reference | Priority | V2 Target Strategy | Evidence-Backed Gaps & Known Unknowns |
|---|---|---|---|---|
| **App Boot & Shell** | Compose Desktop `Main.kt`, fullscreen window | **Critical** | Tauri v2 / Electron Shell with React frontend and Kotlin sidecar | IPC bridge latency must stay under 16ms for live view; window management must remain fullscreen undecorated. |
| **Canon Camera EDSDK** | `NativeEosCaptureService.kt`, `SafeShootCommand.java`, JNA | **Critical** | Direct port of Kotlin/JNA EDSDK service into V2 JVM sidecar | Native DLLs (`EDSDK.dll`, `EdsImage.dll`) must be resolved reliably relative to sidecar binary. |
| **Face Tracking Live View AF** | `kEdsPropID_Evf_AFMode = 2L` in `NativeEosCaptureService.kt` | **Critical** | Preserved in Kotlin sidecar | Verified in V1 code; requires confirmation that target EOS model supports property 2L without error. |
| **Servo AF Shutter Release** | `SafeShootCommand.java` (omits `endLiveView`) | **Critical** | Preserved verbatim in Kotlin sidecar | Eliminates edsdk4j shutter crash; must be stress-tested across 100+ captures. |
| **Hot Folder Fallback** | `HotFolderCaptureService.kt` (15s timeout watcher) | **Critical** | Preserved in Kotlin sidecar | Sony camera + Bluetooth clicker support must remain available if Canon USB is detached. |
| **Webcam Fallback** | `WebcamStillCaptureService.kt` (Sarxos library) | **Important** | Preserved or standard WebRTC in frontend | WebRTC in React or Sarxos in sidecar can serve as backup video source. |
| **Live View Mirroring** | `graphics.scale(-1.0, 1.0)` in `DesktopImageProcessor.kt` | **Critical** | Applied on both live stream and saved captures | Mirror perspective is essential for kiosk user experience. |
| **Per-Layout Shot Count & Countdown** | `LayoutMode.shotCount`, `LayoutMode.countdownSeconds` | **Critical** | Dynamic layout schema in V2 state machine | **NEVER hardcode to 6 and 5.** Must be independently loaded per layout mode from Firestore/config. |
| **AI Beauty Pipeline (YuNet + BiSeNet)** | `DesktopBeautyService.kt`, ONNX Runtime | **Critical** | Direct port of Kotlin ONNX service into sidecar | Revision locked to `face_detection_yunet_2023mar.onnx` and `bisenet_face_parsing.onnx`. (SCRFD rejected). |
| **Beauty Presets & Math** | `BeautyConfig.kt`, `GuidedLuminanceFilter.kt` | **Critical** | Preserved verbatim in Kotlin sidecar | Presets: `NATURAL`, `STUDIO`, `BRIGHT`, `STRONG`. Edge-preserving guided smoothing. |
| **Beauty Fail-Safe Fallback** | `DesktopBeautyService.kt` (returns raw JPEG on error) | **Critical** | 15s timeout safeguard and catch block returning raw JPEG | Guarantees zero session crashes even if ONNX runtime faults. |
| **3D Cube LUT Engine** | `CubeLutParser.kt`, `Lut3D.kt` | **Important** | Preserved in Kotlin sidecar | Supports `.cube` files with trilinear interpolation in `data/filters/luts/`. |
| **Even Quantity Enforcement** | `PricingCalculator.sanitizeQuantity()` | **Critical** | Implemented in frontend stepper and backend validator | `5x15` strips MUST be even (min 2, step 2). `10x15` can be any integer >= 2. |
| **DNP RX1HS 2-Inch Cut Support** | `DesktopCompositor.kt:110-138` (2-up duplication) | **Critical** | Duplicate 5x15 canvas on 4x6" paper with 4px gap | Sheet count sent to printer must be divided by 2 (`requestedCopies / 2`). |
| **600 DPI Print Resolution** | `renderScale = 2` (2452x3658 px for 4x6" sheet) | **Critical** | 600 DPI composition pipeline in sidecar | Prevents print pixelation and matches DNP native head resolution. |
| **Zero-Margin Borderless Printing** | `paper.setImageableArea(0,0,w,h)` in `DesktopIoServices.kt` | **Critical** | Preserved in Java Print Service sidecar | Eliminates Java's default 1-inch printable margins. |
| **QR Code Web Album Stamp** | `DesktopCompositor.drawQRCode()` | **Critical** | Embedded on `printImagePath` (clean on `finalImagePath`) | QR pre-created before print composition so printed photos contain live album link. |
| **Transactional Revenue Gate** | `userConfirmed && printJob.await() && id == current` | **Critical** | Strict state machine gate before recording sale | Auto-prints on timeout set `userConfirmed = false` -> **Zero revenue**. Canceled sessions -> **Zero revenue**. |
| **Dual Ledger (SQLite + Neon)** | `sales.db` + `revenue_transactions` sync | **Critical** | Local SQLite persistence with async Neon PostgreSQL sync | Offline durability guaranteed; idempotency enforced via `external_session_id`. |
| **PayOS VietQR Gateway** | `PaymentService.kt` (3000ms polling loop) | **Critical** | Integrated via IPC or direct backend | Generates VietQR, polls status, supports cash override. |
| **Inactivity Watchdog & Auto-Print** | `startInactivityTimer()` (90s / 60s / 90s) | **Critical** | Centralized watchdog timer in state machine | Auto-selects photos, auto-selects frame, auto-prints with `userConfirmed = false`. |
| **Admin Operator Console** | `AdminScreen.kt` (5 tabs, 5-tap title entrance) | **Important** | Touch-friendly operator workspace in React UI | Frame manager, layout editor, camera controls, tools, color studio, revenue ledger. |
| **In-Session Video Recording** | 24fps live frames buffer + FFmpeg encode | **Important** | Background video capture and transcode | Compiles per-shot clips and master multi-slot boomerang MP4. |
| **Local HTTP File Server** | `LocalFileServer.kt` (embedded port 8080) | **Optional** | Standalone micro-server in sidecar | Serves photos over local Wi-Fi when cloud album is disabled. |
| **Slot Detection Engine** | `SlotDetectionEngine.kt` (CalculatorApp) | **Optional** | Admin diagnostic tool | Analyzes transparency in custom frame PNGs to detect photo slots. |

---

## 2. Evidence-Backed Gaps & Technical Unknowns

### Gap 1: Windows Printer Driver Preferences vs Java Print Service
- **V1 Observation:** V1's `SystemPrinterService.kt` relies entirely on standard `javax.print.PrinterJob`. It does not send proprietary DNP ESC/POS commands over USB.
- **Hardware Unknown:** The 2-inch cut feature on the physical DNP DS-RX1HS requires the Windows printer driver's "2-inch cut" check box to be turned ON in printer preferences. If a kiosk is re-imaged or reset, printing 5×15 strips without that driver setting produces an uncut 4×6 inch sheet.
- **Handoff Action for `printer-engineer`:** Document standard Windows driver configuration procedures or evaluate native driver capability queries.

### Gap 2: Live View Frame Transport across IPC Bridge
- **V1 Observation:** In V1, Compose Desktop and the EDSDK live view loop ran in the same JVM process. Live view frames were passed as in-memory `BufferedImage` directly to `toComposeImageBitmap()`.
- **V2 Architecture Gap:** In V2, the UI runs in a web runtime (React/Vite) while the camera engine runs in a Kotlin sidecar. Streaming 30 fps uncompressed 1080p frames over standard stdio JSON-RPC would cause severe CPU overhead and dropped frames.
- **Resolution Strategy:** Implement high-efficiency local HTTP MJPEG stream, shared memory, or base64 WebSocket stream for live view.

### Gap 3: Neural Network Model File Redistribution
- **V1 Observation:** Model weights `face_detection_yunet_2023mar.onnx` and `bisenet_face_parsing.onnx` are located under `app-resources/models/`.
- **Packaging Constraint:** Ensure licenses (Apache-2.0 and MIT) are maintained in `THIRD_PARTY_NOTICES.md` and packaged alongside the V2 sidecar distribution.

---

*Evidence Tag: All gaps, priorities, and code citations are **Observed in code** from direct comparative analysis.*
