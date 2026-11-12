# V1 → V2 Parity Matrix

> Maps every V1 behavior to its proposed V2 module.
> Priority: **Critical** (booth revenue path), **Important** (core UX), **Optional** (admin / tooling).
> Evidence labels: **Observed**, **Inferred**, **Unverified hardware**, **Missing evidence**.

---

## A. Session State Machine

| V1 Behavior | V1 Evidence | V2 Proposed Module | Priority | Status |
|---|---|---|---|---|
| 17-state `SessionState` enum | Observed (`SessionStateMachine.kt`) | `domain/SessionState.kt` (TS/React state or Kotlin sidecar) | Critical | Must replicate all 17 values; `RECOVERY`/`OUT_OF_SERVICE`/`COMPOSING` may be intentionally unused but must exist |
| No transition guards (any state → any state) | Observed | V2 should add guard rails: e.g., no `PRINTING` without `PRINT_PENDING` | Critical | Gap: V1 has none; V2 must decide policy |
| `transitionTo()` on controller drives UI | Observed (`DesktopBoothController.kt:222-243`) | React state + `useBoothStore` (Zustand or similar) | Critical | — |
| Inactivity timers (photo / frame / post-capture) | Observed (`DesktopBoothController.kt:245-290`) | V2 `useInactivityTimer` hook; same timeout values from config | Critical | Timeout seconds must be configurable, not hardcoded |
| Auto-select + auto-print on timeout (`userConfirmed=false`) | Observed (`handleInactivityTimeout()`) | V2 must preserve: auto-select remaining photos, auto-select first frame, call `startPrinting(userConfirmed=false)` | Critical | Revenue NOT recorded for auto-printed sessions (see §F) |
| `cancelSession()` only valid from `SELECTING_PHOTOS` / `EDITING` | Observed (`DesktopBoothController.kt:926-948`) | V2 `cancelSession()` with same guard | Critical | Must clean `data/sessions/<id>/` on cancel |
| `goBack()` mapping (SELECTING_QUANTITY→SELECTING, etc.) | Observed | V2 back-navigation hook | Important | — |

---

## B. Customer Screens

| V1 Screen | V1 File | V2 Proposed Module | Priority |
|---|---|---|---|
| StartScreen (special bundle picker + "CHẠM ĐỂ BẮT ĐẦU") | `StartScreen.kt` | `screens/StartScreen.tsx` | Important |
| StudioModeScreen (layout pager + effect dock) | `StudioModeScreen.kt` | `screens/StudioModeScreen.tsx` | Critical |
| QuantityScreen (copies stepper, price preview) | `QuantityScreen.kt` | `screens/QuantityScreen.tsx` | Critical |
| PaymentScreen (PayOS QR + staff cash panel) | `PaymentScreen.kt` | `screens/PaymentScreen.tsx` | Critical |
| PrepareScreen | `PrepareScreen.kt` | `screens/PrepareScreen.tsx` | Optional |
| CaptureScreen (shutter, countdown, flash, crop guide) | `CaptureScreen.kt` | `screens/CaptureScreen.tsx` | Critical |
| SelectPhotosScreen (photo grid) | `SelectPhotosScreen.kt` | `screens/SelectPhotosScreen.tsx` | Critical |
| FrameScreen (overlay picker) | `FrameScreen.kt` | `screens/FrameScreen.tsx` | Critical |
| ConfirmScreen (final print preview) | `ConfirmScreen.kt` | `screens/ConfirmScreen.tsx` | Critical |
| PrintingScreen (progress) | `PrintingScreen.kt` | `screens/PrintingScreen.tsx` | Important |
| DeliveryScreen (QR + open album/folder) | `DeliveryScreen.kt` | `screens/DeliveryScreen.tsx` | Critical |

### Touch Interaction Requirements (V1 Observed)

- Horizontal drag for layout pager (`kioskPagerDrag`)
- Shutter button with scale press animation (`animateFloatAsState`, spring)
- Photo selection via tap toggle (up to `selectCount` max)
- Staff-only long-press panel on PaymentScreen (`detectTapGestures(onLongPress)`)
- 5-tap on "LE SOUVENIR" title → Admin (V1: `tapCount >= 5`)
- `kioskHorizontalDrag` on event bundle slider
- No mouse/keyboard requirement for customer flow (touchscreen kiosk)

---

## C. Admin & Studio Screens

| V1 Screen / Tab | V1 File | V2 Proposed Module | Priority |
|---|---|---|---|
| AdminScreen tab "Khung" (frame management) | `AdminScreen.kt` | `screens/AdminFrames.tsx` | Important |
| AdminScreen tab "Bố cục" (layout edit + delete) | `AdminScreen.kt` | `screens/AdminLayouts.tsx` | Important |
| SettingsTabContent (printer, camera, EDSDK exposure, timeouts) | `SettingsTabContent.kt` | `screens/SettingsTab.tsx` | Important |
| CalculatorApp ("Công cụ" tab) | `LayoutCalculatorTool.kt` | `screens/AdminTools.tsx` | Optional |
| FilterAdminView ("Màu ảnh" tab) | `FilterAdminView.kt` | `screens/AdminFilters.tsx` | Important |
| RevenueScreen ("Doanh thu" tab) | `RevenueScreen.kt` | `screens/AdminRevenue.tsx` | Critical |

### Admin Screen Sub-Features

- `NativeCameraParamDropdown`: ISO, Aperture, Shutter (fetched live from EDSDK) — **Unverified hardware**
- `HardcodedCameraParamDropdown`: White Balance (5 options), Picture Style (7 options) — **Unverified hardware**
- `TimeoutStepper`: ±10 s, range 0–3600 s
- `LayoutEditDialog`: price (VND), shotCount, countdownSeconds — writes to Firebase + local state
- `LayoutAdminCard`: delete with confirmation
- `EventAdminCard`: event cover image, delete all event frames
- `FrameAdminCard`: preview thumbnail, delete frame

---

## D. Camera & Capture

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| `StillCaptureService` interface (4 implementations) | Observed | V2 `camera-service` sidecar (Kotlin/JVM) or Tauri commands | Critical |
| Canon EDSDK live view (30 fps) | Observed (`NativeEosCaptureService.kt`) | `edsdk` module in V2 Kotlin sidecar | Critical |
| EDSDK auto-reconnect (2 s poll) | Observed | Must replicate | Critical |
| EDSDK face-tracking AF mode 2 | Observed | `kEdsPropID_Evf_AFMode = 2` | Important |
| `SafeShootCommand(kEdsSaveTo_Host, 3)` | Observed | Must preserve (custom edsdk4j extension) | Critical |
| Post-capture horizontal mirror | Observed (`DesktopImageProcessor.kt:47-48`) | V2 post-capture pipeline | Critical |
| Hot folder polling (15 s, 100 ms interval) | Observed (`HotFolderCaptureService.kt`) | V2 hot-folder watcher | Important |
| CLI capture (`CameraControlCmd.exe`) | Observed | V2 CLI camera driver | Optional |
| Webcam (DroidCam USB) | Observed | V2 webcam fallback | Optional |
| EOS Utility 3 (Space-key trigger) | Observed | V2 optional legacy mode | Optional |
| Live view crop guide (white outline + dimmed borders) | Observed (`CaptureScreen.kt:178-235`) | V2 React overlay | Important |
| Countdown number display (240 sp font) | Observed | V2 React component | Important |
| White flash on `CAPTURING` state | Observed (`AnimatedVisibility` in `CaptureScreen.kt`) | V2 React animation | Optional |
| Video frame capture during countdown (24 fps, scaled to 1080 p max) | Observed (`DesktopBoothController.kt:465-498`) | V2 video capture pipeline | Important |
| Dummy image fallback (no camera) | Observed (`DesktopBoothController.kt:510-533`) | V2 must support for testing | Optional |

### Per-Layout Capture Parameters (configurable, NEVER hardcoded)

| Parameter | Source | V1 Default |
|---|---|---|
| `shotCount` | `LayoutMode.shotCount` (Firebase) | From Firestore document |
| `countdownSeconds` | `LayoutMode.countdownSeconds` (Firebase) | `3` seconds |
| `selectCount` | `LayoutMode.selectCount` (Firebase) | `slots.size` |
| `photoAspectRatio` | `LayoutMode.photoAspectRatio` (computed or Firestore) | Derived from print size + slots |

**Note:** `countdownSeconds` defaults to `3` in `LayoutMode` data class (`BoothModels.kt:28`) but is always overridden by Firebase. The V2 UI must read and display the actual value per layout — never assume 5 or 6.

---

## E. Image Processing & Composition

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| `saveBoothCapture()` — effect + mirror + JPEG | Observed | V2 `image-processing` module | Critical |
| LUT application (`.cube`, trilinear, intensity blend) | Observed (`Lut3D.kt`, `CubeLutParser.kt`) | V2 `lut` module | Important |
| ColorMatrix effect (saturation, contrast, brightness, warmth, tint) | Observed (`DesktopImageProcessor.kt:84-138`) | V2 `color-matrix` module | Important |
| `renderFinal()` — 600 DPI print canvas | Observed (`DesktopCompositor.kt:48-58`) | V2 `compositor` module | Critical |
| Strip 5×15: 592×1790 px (×2 scale = 1184×3580) | Observed | V2 compositor | Critical |
| 10×15: 1184×1790 px (×2 = 2368×3580) | Observed | V2 compositor | Critical |
| 15×10: 1790×1184 px (×2 = 3580×2368) | Observed | V2 compositor | Critical |
| Two-up strip print file (1226×1829 px paper, 2× 592×1790 images) | Observed | V2 compositor | Critical |
| 15×10 print file (1829×1226 px paper) | Observed | V2 compositor | Critical |
| 10×15 print file (1226×1829 px paper) | Observed | V2 compositor | Critical |
| QR code on print (ZXing, position + size from layout/frame config) | Observed | V2 `qr` module | Critical |
| Custom frame PNG overlay | Observed | V2 compositor | Important |
| Default frame (rounded border + footer) | Observed | V2 compositor | Important |
| `DesktopVideoCompositor` — FFmpeg master video | Observed | V2 `video` module | Important |
| Per-shot video encoding (24 fps frames or 3 s static fallback) | Observed | V2 `video` module | Important |
| FFmpeg resolution: `bin/ffmpeg.exe` → WinGet → PATH | Observed | V2 video module | Important |

---

## F. Printer

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| `SystemPrinterService` — Java `PrinterJob` | Observed (`DesktopIoServices.kt:36-92`) | V2 `printer` module | Critical |
| Borderless: `paper.setImageableArea(0,0,width,height)` | Observed | V2 printer module | Critical |
| 90° rotation on orientation mismatch | Observed | V2 printer module | Critical |
| Copies = `copies/2` for strip (2-per-sheet) | Observed (`DesktopBoothController.kt:766`) | V2 print logic | Critical |
| Printer name routing (`printerNameStrip` / `printerNameFull`) | Observed | V2 config + printer module | Important |
| `enableSystemPrint=false` → render only, no print | Observed | V2 print mode toggle | Important |
| DNP RX1HS model-specific behavior | **Unverified hardware** | V2 must confirm with printer engineer | Critical |
| 2-inch cut flow | **Unverified hardware** | No V1 code references DNP cut settings | Important |

> **Source path for printer-engineer:** `src/main/kotlin/.../services/DesktopIoServices.kt` (SystemPrinterService) and `DesktopBoothController.kt:760-784` (copies calculation + printer name routing).

---

## G. Beauty / Face Mask

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| YuNet face detection (ONNX, 640×640, threshold 0.85, NMS 0.30) | Observed | V2 `face-detection` module | Important |
| BiSeNet face parsing (ONNX, 512/640/768, 19 classes) | Observed | V2 `face-parsing` module | Important |
| `CustomerFaceSelector` (foreground/background classification) | Observed | V2 `face-selector` module | Important |
| `FaceOvalMaskBuilder` (geometry + semantic + geodesic + guided filter) | Observed | V2 `mask-builder` module | Important |
| `GuidedLuminanceFilter` (box-guided, radius ≈1.2%, epsilon 0.002) | Observed | V2 `guided-filter` module | Important |
| `BeautyProcessor` (YCbCr smoothing/whitening/rosy) | Observed | V2 `beauty-processor` module | Important |
| `BeautyPreset` (NATURAL/STUDIO/BRIGHT/STRONG) | Observed | V2 `beauty-preset` config | Important |
| `DesktopBeautyService` (lazy, thread-safe, fallback to original) | Observed | V2 `beauty-service` module | Important |
| `BEAUTY_ENABLED` + `BEAUTY_PRESET` in `.env` | Observed | V2 config | Important |
| `scrfd_500m.onnx` (present, unused) | **Missing evidence** | Do not include unless explicitly required | Optional |

### Model Files Required in V2

| File | Location in V1 | Required? |
|---|---|---|
| `face_detection_yunet_2023mar.onnx` | `app-resources/models/` | Yes (if YuNet accepted) |
| `bisenet_face_parsing.onnx` | `app-resources/models/` | Yes (if BiSeNet accepted) |
| `scrfd_500m.onnx` | `app-resources/models/` | No — no V1 code references it |

> **Note:** The AGENTS.md states "preserve existing accepted YuNet/BiSeNet/Beauty algorithm, models, thresholds, presets, and fallback." Confirm with the team which revision is actually accepted before copying model files.

---

## H. Payment (PayOS)

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| PayOS SDK (`vn.payos:payos-java:2.0.1`) | Observed | V2 `payment` module (Kotlin or JS) | Critical |
| `createPaymentLink(orderCode, amount, description)` | Observed | V2 payment module | Critical |
| `orderCode = System.currentTimeMillis()` | Observed | V2 must use same or session-based ID | Critical |
| QR polling every 3000 ms | Observed | V2 payment polling | Critical |
| `completePayment(method)` — cancels polling, transitions to PREPARING | Observed | V2 state transition | Critical |
| `goBack()` from PAYMENT_PENDING cancels polling | Observed | V2 navigation | Important |
| Cash fallback (`"Tiền mặt"`) when PayOS not configured | Observed | V2 payment screen | Important |
| `cancelUrl` / `returnUrl` = `https://localhost/…` | Observed (placeholder) | V2 must set actual web URLs | Important |

---

## I. Revenue & Persistence

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| SQLite `sales` table (local ledger) | Observed (`SalesRepository.kt`) | V2 `sales-repository` module | Critical |
| `INSERT OR IGNORE` by `session_id` (idempotent) | Observed | V2 must preserve | Critical |
| `adjustTransaction()` — recalc extra fees from base_price | Observed | V2 revenue module | Critical |
| `voidTransaction()` | Observed | V2 revenue module | Critical |
| `syncPendingSales()` — push PENDING to cloud | Observed | V2 sync module | Critical |
| Neon Postgres direct JDBC (`revenue_transactions`) | Observed (`NeonDirectRevenueClient.kt`) | V2 `neon-client` module | Critical |
| `ON CONFLICT (external_session_id) DO NOTHING` | Observed | V2 must preserve | Critical |
| HTTP fallback (`/api/v1/revenue/`) when Neon not configured | Observed | V2 revenue client | Important |
| Money as decimal strings (never Double) | Observed | V2 revenue module | Critical |
| `DesktopSessionStore` — JSONL session log | Observed | V2 session store | Important |
| Revenue recorded only when `userConfirmed && printJob.await() && currentSessionId == sessionId` | Observed (`DesktopBoothController.kt:842`) | V2 must preserve exact condition | Critical |
| Auto-print (inactivity timeout) → `userConfirmed=false` → **no revenue recorded** | Observed | V2 business rule | Critical |

---

## J. Cloudinary / Web Album / QR

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| Cloudinary upload (image + video) | Observed (`DesktopCloudinaryClient.kt`) | V2 `cloudinary` module | Critical |
| Video URL transform: `f_auto,q_auto,vc_h264` | Observed | V2 must preserve | Important |
| Image URL transform: `f_auto,q_auto` | Observed | V2 must preserve | Important |
| Web Album API: `POST /api/v1/albums` | Observed (`DesktopWebAlbumClient.kt`) | V2 `web-album` module | Critical |
| `finalizeAsset()` (sequential, preserves order) | Observed | V2 must preserve sequential finalize | Critical |
| `completeAlbum()` | Observed | V2 web album module | Important |
| `albumUrl = <webAlbumBaseUrl>/album/<sessionId>` | Observed | V2 delivery QR | Critical |
| `expectedAssets = selectedPhotos.size + 2` (photos + 1 print + 1 video) | Observed | V2 album creation | Important |
| `LocalFileServer` (0.0.0.0, port 8080, `/download/`) | Observed | V2 local file server | Important |
| QR fallback: LAN IP + port when album not available | Observed | V2 delivery screen | Important |
| `NetworkUtility.getLocalIpAddress()` | Observed | V2 network utility | Important |

---

## K. Firebase (Layouts + Frames)

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| Firestore `layouts` collection | Observed (`FirebaseManager.kt`) | V2 `firebase` module | Critical |
| `fetchLayouts()` → `LayoutMode` list | Observed | V2 layout fetcher | Critical |
| `updateLayoutConfig(layoutId, price, shotCount, countdownSeconds)` | Observed | V2 admin layout save | Important |
| `deleteLayout(layoutId)` | Observed | V2 admin layout delete | Important |
| `updateLayoutQRConfig(layoutId, x, y, size)` | Observed | V2 layout QR config | Important |
| `uploadFrameMetadata(frameId, layoutId, publicUrl)` | Observed | V2 frame metadata | Optional |
| `serviceAccountKey.json` in working dir | Observed | **V2 must use separate credentials** | Critical |
| 5 s timeout on `fetchLayouts()` | Observed | V2 must preserve timeout | Important |

---

## L. Configuration

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| `DesktopBoothConfig` (27 fields) | Observed | V2 `config` module (Kotlin sidecar) | Critical |
| `.env` loading (working dir + app data dir, merged) | Observed | V2 config loader | Critical |
| `SettingsManager.updateSettings()` (upsert to `.env`) | Observed | V2 settings persistence | Important |
| `DesktopAppPaths` (portable vs. `%LOCALAPPDATA%`) | Observed | V2 app paths module | Important |
| V2 must use separate app identity + data dir from V1 | AGENTS.md requirement | V2 `app-paths` module | Critical |

---

## M. Build & Packaging

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| Compose Desktop 1.6.11 + Kotlin 1.9.24 + JVM 17/21 | Observed | V2: React + Vite + Tauri v2 (per AGENTS.md) | Critical |
| Canon EDSDK DLL packaging | Observed (`app-resources/EDSDK_64/`) | V2 sidecar must bundle EDSDK DLLs | Critical |
| ONNX model packaging (`app-resources/models/`) | Observed | V2 sidecar must bundle accepted models | Important |
| `SafeShootCommand.class` (custom edsdk4j extension) | Observed (`app-resources/bin/`) | V2 must include this bytecode | Critical |
| FFmpeg local binary (`bin/ffmpeg.exe`) | Observed | V2 video pipeline | Important |
| JNA 4.5.2 (Windows GDI window capture) | Observed | V2 CLI camera / EOS Utility mode | Optional |
| Native distribution: MSI, per-user install, "Pretty Booth" menu group | Observed | V2 installer must use different identity | Critical |
| Upgrade UUID `ce637e69-93f0-41d6-8092-8e4635c729ad` | Observed | V2 must use a **different** UUID | Critical |

---

## N. UI Theme & Design Tokens

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| `PhotoboothTheme` (Compose Material) | Observed | V2 Tailwind design system | Important |
| `KioskSpacing` (4/8/12/16/20/24/32 dp) | Observed (`DesignTokens.kt`) | V2 spacing scale | Important |
| `KioskControlTokens` (corner 16/24 dp, min height 56 dp, press scale 0.97) | Observed | V2 touch tokens | Important |
| `AdminTokens` (group corner 16, row min 60 dp, etc.) | Observed | V2 admin tokens | Optional |
| Undecorated fullscreen window | Observed | V2 Tauri window config | Critical |
| `AppShell` conditional backgrounds (full-screen for capture states, neutral for admin) | Observed | V2 screen wrapper | Important |

---

## O. Pricing

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| Strip 5×15: base 70 000 VND, extra 20 000/copy, min 2, even only | Observed | V2 `pricing` module | Critical |
| Full 10×15/15×10: base 90 000 VND, extra 30 000/copy, min 2 | Observed | V2 `pricing` module | Critical |
| `frozenPricingSnapshot` set at quantity selection | Observed | V2 pricing snapshot | Critical |
| `isStrip()` detection: `"5x15"` in normalized print size (excluding "10x15"/"15x10") | Observed | V2 pricing helper | Critical |
| `allowedOptions()`: strip = 2..50 step 2; full = 2..50 step 1 | Observed | V2 quantity validation | Critical |
| `LayoutMode.basePrice` from Firebase overrides default | Observed | V2 layout price | Important |

---

## P. Video Pipeline (Detailed)

| V1 Feature | V1 Evidence | V2 Proposed Module | Priority |
|---|---|---|---|
| Per-shot frame capture during countdown (24 fps, max 1080 p) | Observed | V2 video capture | Important |
| `encodeVideo()` — FFmpeg `libx264 main 3.1 fast crf=17` | Observed | V2 video encode | Important |
| Static 3 s fallback (`-loop 1 -framerate 15`, crf=23) | Observed | V2 video encode | Important |
| `DesktopVideoCompositor.createCompositeVideo()` — multi-input FFmpeg filter_complex | Observed | V2 video compositor | Important |
| Video URL: `f_auto,q_auto,vc_h264` in Cloudinary URL | Observed | V2 video upload | Important |
| Video kind in album: `"GIF"` (Cloudinary video resource) | Observed | V2 album upload | Important |
| 60 s FFmpeg process timeout | Observed | V2 video pipeline | Important |
| Video upload happens in background after delivery (non-blocking) | Observed | V2 delivery flow | Important |

---

## Q. Known Gaps & Unverified Items for V2

| Item | V1 Status | V2 Action |
|---|---|---|
| DNP RX1HS driver behavior, cut settings, paper size | **Unverified hardware** | Printer engineer must verify on real hardware before marking complete |
| Canon camera model | **Unverified hardware** | Camera engineer must confirm |
| `scrfd_500m.onnx` purpose | **Missing evidence** | Confirm with team if SCRFD was an experiment not accepted |
| `RECOVERY` / `OUT_OF_SERVICE` / `COMPOSING` states | **Missing evidence** (declared, never used) | V2 can omit or use as planned states |
| `EosUtilityCaptureService` selected by controller? | No — controller only selects Native/CLI/HotFolder/Webcam | V2 can omit EOS Utility mode unless explicitly required |
| PayOS `cancelUrl`/`returnUrl` are placeholders (`https://localhost/…`) | Observed | V2 must set actual web redirect URLs |
| `serviceAccountKey.json` in V1 working dir | **Security risk** | V2 must use separate credentials and never share with V1 |
| `bin/ffmpeg.exe` presence | Observed (optional) | V2 must bundle or install FFmpeg for video pipeline |
| EDSDK DLL loading mechanism | **Unverified hardware** | V2 sidecar must set `java.library.path` or use JNA `jna.library.path` |

---

## R. V2 Module Ownership Summary

| V2 Module | V1 Source Files to Reference | Specialist |
|---|---|---|
| `domain/session-state` | `SessionStateMachine.kt`, `DesktopBoothController.kt` | Architect |
| `camera/edsdk` | `NativeEosCaptureService.kt`, `edsdk4j.jar`, `SafeShootCommand.class` | Camera Engineer |
| `camera/hot-folder` | `HotFolderCaptureService.kt` | Camera Engineer |
| `camera/webcam` | `WebcamStillCaptureService.kt` | Camera Engineer |
| `camera/cli` | `CliCaptureService.kt`, `WindowCaptureHelper.kt` | Camera Engineer |
| `imaging/lut` | `Lut3D.kt`, `CubeLutParser.kt`, `DesktopImageProcessor.kt` | Backend Engineer |
| `imaging/compositor` | `DesktopCompositor.kt` | Backend Engineer |
| `imaging/video` | `DesktopVideoCompositor.kt`, `DesktopBoothController.encodeVideo()` | Backend Engineer |
| `printer` | `SystemPrinterService` (`DesktopIoServices.kt`), `DesktopBoothController.kt:760-784` | Printer Engineer |
| `beauty` | `beauty/*`, `facemask/*` (all files) | Backend Engineer |
| `payment` | `PaymentService.kt` | Backend Engineer |
| `revenue/sqlite` | `SalesRepository.kt`, `SalesModels.kt` | Backend Engineer |
| `revenue/neon` | `NeonDirectRevenueClient.kt` | Backend Engineer |
| `album/cloudinary` | `DesktopCloudinaryClient.kt` | Backend Engineer |
| `album/web` | `DesktopWebAlbumClient.kt`, `RemoteModels.kt` | Backend Engineer |
| `album/uploader` | `DesktopAlbumUploader.kt` | Backend Engineer |
| `firebase/layouts` | `FirebaseManager.kt` | Backend Engineer |
| `config` | `DesktopBoothConfig.kt`, `SettingsManager.kt`, `DesktopAppPaths.kt` | Architect |
| `pricing` | `PricingCalculator.kt` | Backend Engineer |
| `local-server` | `LocalFileServer.kt` | Backend Engineer |
| `ui/screens` | All `ui/screens/*` | UI Designer + Frontend |
| `ui/theme` | `ui/theme/*`, `ui/components/*` | UI Designer |
| `build/packaging` | `build.gradle.kts`, `app-resources/` | Backend Engineer |
