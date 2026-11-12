# V1 Feature Inventory — Le Souvenir Photobooth Desktop

> Read-only audit of `E:\HK1_2026_2027\PhotoboothDesktop`.
> All paths are V1-relative. No V1 file was written, built, or executed during this audit.
> Evidence labels: **Observed** (code read directly), **Inferred**, **Unverified hardware**.

---

## 1. App Boot & Shell

| Feature | V1 File | Symbol / Function | Evidence |
|---|---|---|---|
| Compose Desktop application entry point | `src/main/kotlin/.../Main.kt` | `fun main() = application { … }` | Observed |
| Undecorated fullscreen window, title "Le Souvenir Kiosk" | `Main.kt:37-42` | `Window(undecorated=true, WindowPlacement.Fullscreen)` | Observed |
| Config load at startup | `Main.kt:43` | `DesktopConfigLoader.load(DesktopAppPaths.appDataDir())` | Observed |
| Firebase Admin SDK init | `Main.kt:35` | `FirebaseManager.initialize()` | Observed |
| Controller construction | `Main.kt:45` | `DesktopBoothController(projectDir, config, salesRepository)` | Observed |
| `isAppReady` gate — 8 s timeout with Admin / "Bỏ qua & Chụp ngay" buttons | `Main.kt:77-119` | `LaunchedEffect` + `delay(8000)` | Observed |
| Crossfade animation between all session states (400 ms tween) | `Main.kt:121-124` | `Crossfade(targetState=state, tween(400))` | Observed |

---

## 2. Screens & Layouts

All screens live under `src/main/kotlin/.../ui/screens/`.

### Customer Flow

| Screen | V1 File | `SessionState` | Key Inputs / Callbacks | Evidence |
|---|---|---|---|---|
| StartScreen (welcome + special-bundle picker) | `StartScreen.kt` | `IDLE` | `onStart`, `onAdmin`, `onSpecialSelected` | Observed |
| StudioModeScreen (layout pager + effect dock) | `StudioModeScreen.kt` | `SELECTING` | `onLayoutSelected`, `onEffectSelected`, `onConfirm`, `onBack` | Observed |
| QuantityScreen (copies 2–50 stepper) | `QuantityScreen.kt` | `SELECTING_QUANTITY` | `onQuantitySelected(Int)` | Observed |
| PaymentScreen (PayOS QR + cash staff panel) | `PaymentScreen.kt` | `PAYMENT_PENDING` | `onPaid()`, `onBack` | Observed |
| PrepareScreen | `PrepareScreen.kt` | `PREPARING` | layout + effect display | Observed |
| CaptureScreen (live view, shutter, countdown, flash) | `CaptureScreen.kt` | `LIVE_VIEW`, `COUNTDOWN`, `CAPTURING` | `onStartCapture`, `onImportSources`, `onRefreshCameraDevices` | Observed |
| SelectPhotosScreen (photo grid selection) | `SelectPhotosScreen.kt` | `SELECTING_PHOTOS` | `onMomentSelect`, `onConfirm`, `onBack` | Observed |
| FrameScreen (frame overlay picker) | `FrameScreen.kt` | `EDITING` | `onFrameSelected`, `onAddFrame`, `onConfirm`, `onBack` | Observed |
| ConfirmScreen (final print preview) | `ConfirmScreen.kt` | `PRINT_PENDING` | `onPrint`, `onBack` | Observed |
| PrintingScreen (progress + status) | `PrintingScreen.kt` | `PRINTING` | `statusMessage` | Observed |
| DeliveryScreen (QR + open album / output folder) | `DeliveryScreen.kt` | `DELIVERY` | `onFinish`, `onOpenAlbum`, `onOpenOutput` | Observed |

### Admin / Studio

| Screen | V1 File | Key Tabs / Sections | Evidence |
|---|---|---|---|
| AdminScreen | `AdminScreen.kt` | 6 tabs: Khung (frames), Bố cục (layouts), Cài đặt (settings), Công cụ (calculator), Màu ảnh (filters), Doanh thu (revenue) | Observed |
| SettingsTabContent | `SettingsTabContent.kt` | Printer, camera source, hot folder path, Canon EDSDK exposure (ISO/Av/Tv/WB/PictureStyle), timeout steppers, save to `.env` | Observed |
| RevenueScreen | `RevenueScreen.kt` | Period selector (today/7d/month/last-month), summary, daily points, size breakdowns, recent transactions, adjust/void | Observed |
| FilterAdminView | `FilterAdminView.kt` | Effect list, LUT import, preview, enable/disable | Observed |
| CalculatorApp (`LayoutCalculatorTool.kt`) | `LayoutCalculatorTool.kt` | PNG slot detection, layout save to Firebase, frame save local, QR coordinate editor | Observed |

---

## 3. Session State Machine

**File:** `src/main/kotlin/.../domain/SessionStateMachine.kt`

`SessionState` enum (17 values):

```
IDLE, SELECTING, SELECTING_QUANTITY, PAYMENT_PENDING, PREPARING,
LIVE_VIEW, COUNTDOWN, CAPTURING, SELECTING_PHOTOS, EDITING,
COMPOSING, PRINT_PENDING, PRINTING, DELIVERY, RECOVERY,
OUT_OF_SERVICE, ADMIN
```

- `SessionStateMachine` is a plain `MutableStateFlow<SessionState>` wrapper — **no guard rails or transition validation**.
- All state transitions are driven by `DesktopBoothController.transitionTo(newState)` which calls `stateMachine.transitionTo(newState)` directly.
- `RECOVERY` and `OUT_OF_SERVICE` are declared but **never assigned** in V1 code (Observed: no callers found).
- `COMPOSING` is declared but **never assigned** (composition happens inside `startPrinting`).

### `DesktopBoothController` — Full State Transition Map

**File:** `src/main/kotlin/.../controller/DesktopBoothController.kt`

```
IDLE ──onStart──► SELECTING
IDLE ──onAdmin──► ADMIN
IDLE ◄──onBack──  SELECTING

SELECTING ──confirmStudioSetup()──► SELECTING_QUANTITY
SELECTING_QUANTITY ──setQuantityAndStartPayment(qty)──► PAYMENT_PENDING
PAYMENT_PENDING ──completePayment()──► PREPARING (delay 1.6s) ──► LIVE_VIEW
LIVE_VIEW ──startCaptureFlow()──► COUNTDOWN (× shotCount)
COUNTDOWN ──(countdown=0)──► CAPTURING (captureStill) ──► LIVE_VIEW (delay 700ms)
after all shots ──► SELECTING_PHOTOS

SELECTING_PHOTOS ──confirmSelection()──► EDITING
EDITING ──confirmFrameSelection()──► PRINT_PENDING
PRINT_PENDING ──startPrinting(userConfirmed=true)──► PRINTING
PRINTING ──(album + render + print + upload)──► DELIVERY
DELIVERY ──finishSession()──► IDLE

cancelSession(): only valid from SELECTING_PHOTOS or EDITING
  → cancels beauty jobs, video encoding, captureJob, inactivityJob
  → deletes data/sessions/<sessionId>/ directory
  → resets all state → IDLE

goBack():
  SELECTING_QUANTITY → SELECTING
  PAYMENT_PENDING → SELECTING_QUANTITY (cancels payment polling)
  EDITING → SELECTING_PHOTOS
  PRINT_PENDING → EDITING
```

### Inactivity Timeout Rules

| State | Timer Name | Timeout Source | On Timeout |
|---|---|---|---|
| `SELECTING_PHOTOS` | `photoSelectionTimeoutSeconds` (default 90 s) | `config.photoSelectionTimeoutSeconds` | Auto-select remaining photos → `startPrinting(userConfirmed=false)` |
| `EDITING` | `frameSelectionTimeoutSeconds` (default 60 s) | `config.frameSelectionTimeoutSeconds` | Auto-select first available frame → `startPrinting(userConfirmed=false)` |
| `PRINT_PENDING` | `postCaptureTimeoutSeconds` (default 90 s) | `config.postCaptureTimeoutSeconds` | Same auto-print path |

`resetInactivityTimer()` is exposed and called from UI interactions; it restarts the countdown from the current remaining time.

---

## 4. Camera Capture Modes

**Interface:** `StillCaptureService` defined in `WebcamStillCaptureService.kt:16-23`.

### 4a. Canon EDSDK (Native) — `NativeEosCaptureService.kt`

| Feature | Detail | Evidence |
|---|---|---|
| Session open in `init {}` | `camera.openSession()` — falls back to auto-retry loop | Observed |
| Auto-reconnect loop | Checks `camera.apertureValue` every 2 s; on failure re-instantiates `CanonCamera()`, calls `openSession()`; restarts live view if active | Observed |
| Live view | `camera.beginLiveView()` with up to 10 retries; 30 fps request rate; `downloadLiveView()` → `imageProcessor.applyEffectForLiveView()` → `ImageBitmap` | Observed |
| Face Tracking AF | Sets `EdsPropertyID.kEdsPropID_Evf_AFMode = 2` after live view start | Observed |
| Capture | `camera.execute(SafeShootCommand(kEdsSaveTo_Host, 3)).get()` — `SafeShootCommand` is a custom extension in `edsdk4j-sources.jar` (jar unpacked in `app-resources/bin/`) | Observed |
| Post-capture | `imageProcessor.saveBoothCapture()` — crops to `photoAspectRatio`, applies effect, mirrors horizontally, saves as JPEG `Photo_N.jpg` | Observed |
| Re-open LiveView after failed capture | `if (liveViewJob?.isActive == true) camera.beginLiveView()` | Observed |
| 20 consecutive null frames → disconnect detection | `nullCount > 20` → `sessionOpen = false`, `stopLiveView()` | Observed |
| ISO / Aperture / Shutter / WB / PictureStyle controls | Exposed via `getAvailableIsoSpeeds()`, `setIso()`, `setAperture()`, `setShutterSpeed()`, `setWhiteBalanceSafe()`, `setPictureStyleSafe()` | Observed |
| Error frame emission | `emitErrorFrame(msg)` draws 640×480 red-text black frame into `_liveViewStream` | Observed |

**Native DLLs:** `app-resources/EDSDK_64/EDSDK.dll`, `app-resources/EDSDK_64/EdsImage.dll` (packaged via `appResourcesRootDir = app-resources`).

### 4b. Hot Folder — `HotFolderCaptureService.kt`

| Feature | Detail | Evidence |
|---|---|---|
| File-wait polling | `runBlocking { for (i in 1..150) { … } }` — 15 s timeout, 100 ms poll interval | Observed |
| Trigger | No software trigger; comment says "Khách hàng sẽ tự dùng Clicker Bluetooth" | Observed |
| Post-capture | `imageProcessor.saveBoothCapture()`, then deletes the source file from hot folder | Observed |
| `cameraNames()` returns `["Sony Camera (Hot Folder)"]` | Inferred — actual camera model not in code | Unverified hardware |

### 4c. CLI Camera — `CliCaptureService.kt`

| Feature | Detail | Evidence |
|---|---|---|
| Live view | `WindowCaptureHelper.captureWindow("Live view")` → fallback `captureWindow("EOS Utility")`; 16 ms poll (~60 fps) | Observed |
| Capture | Runs `config.cliCaptureCommand` (default `CameraControlCmd.exe /capturenoaf /filename "%s"`) via `Runtime.exec()`; 5 s file-wait | Observed |
| `cameraNames()` returns `["Canon R100 (CLI)"]` | Inferred — actual model depends on which Canon camera is connected | Unverified hardware |

### 4d. Webcam (DroidCam) — `WebcamStillCaptureService.kt`

| Feature | Detail | Evidence |
|---|---|
| Device selection | `Webcam.getWebcams()` — prefers DroidCam (USB-OTG); falls back to default webcam | Observed |
| Live view | `webcam.image` at best available size; center-crops to 16:9; 33 ms delay (~30 fps) | Observed |
| Capture | `webcam.image` → centerCropToAspect(16:9) → `saveBoothCapture()` | Observed |

### 4e. EOS Utility 3 (legacy, not selected in controller) — `EosUtilityCaptureService.kt`

| Feature | Detail | Evidence |
|---|---|---|
| Detection | `tasklist /FI "IMAGENAME eq EOS Utility 3.exe"` | Observed |
| Live view | `WindowCaptureHelper.captureWindow("Live View")` with webcam fallback (OBS virtual camera preferred) | Observed |
| Trigger | `WindowCaptureHelper.sendSpaceToWindow("EOS Utility")` — sends hardware SPACE key via `Robot()` | Observed |
| Hot-folder poll | 15 s (triggered) / 1 s (mock) timeout | Observed |

---

## 5. Image Processing & LUT Pipeline

**File:** `DesktopImageProcessor.kt`

### `saveBoothCapture(image: BufferedImage, outputDir, shotIndex, photoAspectRatio, effectId)`

1. `applyEffect(image, effectId)` — applies LUT or ColorMatrix
2. Create white-backed `TYPE_INT_RGB` buffer
3. **Mirror horizontally** (`graphics.scale(-1.0, 1.0)`) so the saved photo matches what the customer saw in live view
4. Write JPEG → `Photo_N.jpg` in `data/sessions/<sessionId>/`

### `applyEffect(image, effectId)`

- **LUT path:** loads `.cube` file from `data/filters/luts/<lutPath>`; cached in `ConcurrentHashMap<Path, Lut3D>`; applies trilinear interpolation with `lutIntensity` blending; on error returns original image unchanged.
- **ColorMatrix path:** applies saturation, contrast, brightness, warmth, tint in pixel loop (RGB space); skip if all values are neutral.

### `Lut3D` + `CubeLutParser` (`imaging/lut/`)

- Parses `.cube` files: `LUT_3D_SIZE` (2–65), `DOMAIN_MIN`, `DOMAIN_MAX`, and `size³` rows of 3-float values.
- `Lut3D.apply(bufferedImage, intensity)`: trilinear interpolation; `result = input + intensity × (lutValue − input)` per channel.

### `ensureJpeg(source, outputDir, prefix)`

- If source is already JPEG, returns it directly.
- Otherwise reads, composites onto white, writes `prefix_<timestamp>.jpg` to `data/sessions/<sessionId>/exports/`.

---

## 6. Composition & Print Rendering

**File:** `DesktopCompositor.kt`

### `renderFinal(layout, frame, photoPaths, outputDir, qrCodeUrl)`

| Step | Detail | Evidence |
|---|---|---|
| Canvas size (600 DPI, `renderScale=2`) | 5×15 strip: 1184×3580 px; 15×10: 3580×2368 px; 10×15: 2368×3580 px | Observed |
| Slot computation | `computeSlots()` — uses `absoluteSlots` if present, else grid math from `gridColumns`, `padding*Ratio`, `gap*Ratio`, `photoAspectRatio` | Observed |
| Photo placement | `drawCenterCrop()` per slot; bleed = 2 px × renderScale per side | Observed |
| Custom frame overlay | If `frame.isCustom && frame.customImagePath != null`, draws full-size PNG on top | Observed |
| Default frame | Draws rounded-rect border + footer with frame title and print size label | Observed |
| Master image (no QR) | Saved as `print_<timestamp>_<layout>_<frame>.png` (600 DPI master, used for web/Cloudinary) | Observed |
| QR code drawn | `drawQRCode()` — uses `frame.qrCodeSize` or `layout.qrCodeSize` (default 10% canvas width); position from `frame.qrCodeX/Y` or `layout.qrCodeX/Y` (default bottom-right); ZXing `QRCodeWriter` with `ErrorCorrectionLevel.M` | Observed |
| Strip print file | Two 592×1790 images side-by-side on 1226×1829 paper canvas → `print_<name>.png` | Observed |
| 15×10 print file | 1790×1184 on 1829×1226 paper → `print_<name>.png` | Observed |
| 10×15 print file | 1184×1790 on 1226×1829 paper → `print_<name>.png` | Observed |

---

## 7. Video Composition (Post-Capture)

**File:** `DesktopVideoCompositor.kt`

- `createCompositeVideo(layout, frame, selectedMoments, outputDir, sessionId)`
- Builds FFmpeg `filter_complex`: each per-shot video (from `DesktopBoothController.encodeVideo()`) is scaled/cropped to its slot; white background; frame PNG overlaid; output scaled to 1080 p height with even width; `libx264 main 3.1 fast crf=23 yuv420p +faststart`
- FFmpeg resolution order: `projectDir/bin/ffmpeg.exe` → WinGet path → system PATH
- Per-shot video encoding (`DesktopBoothController.encodeVideo()`):
  - Primary: 24 fps frame sequence from live-view frames (`frame_%03d.jpg`)
  - Fallback: 3-second static image from the captured photo (if no frames recorded)
  - 20 s process timeout

---

## 8. Printer Pipeline

**File:** `DesktopIoServices.kt` — `SystemPrinterService`

| Feature | Detail | Evidence |
|---|---|---|
| Interface | `PrinterService.printImage(path, copies, printerName): Result<String>` | Observed |
| Printer selection | `PrinterJob.lookupPrintServices()`; matches by name substring (case-insensitive) | Observed |
| Copies | `HashPrintRequestAttributeSet().add(Copies(copies))` | Observed |
| Borderless | `paper.setImageableArea(0, 0, paper.width, paper.height)` — removes Java's default 1-inch margin | Observed |
| Orientation handling | If image orientation ≠ paper orientation, rotates 90° before drawing | Observed |
| Copies calculation in controller | `actualSheets = isStrip ? max(copies/2, 1) : copies` — strip uses 2-per-sheet | Observed |
| Printer name routing | `config.printerNameStrip` for 5×15; `config.printerNameFull` for 10×15/15×10 | Observed |
| `enableSystemPrint` gate | If false, render print file but skip `printerService.printImage()`; status message: "Đã render file in local (chế độ không in)" | Observed |

**Note:** No DNP RX1HS-specific driver code is in V1. The app sends a PNG to the Windows print spooler via Java `PrinterJob`; DNP behavior is driver-side and **Unverified hardware**.

---

## 9. Beauty / Face Mask Pipeline

**Files:** `beauty/`, `facemask/`

### Model Files (V1 `app-resources/models/`)

| File | Use | Evidence |
|---|---|---|
| `face_detection_yunet_2023mar.onnx` | YuNet face detection (ONNX Runtime) | Observed |
| `bisenet_face_parsing.onnx` | BiSeNet semantic face parsing (ONNX Runtime) | Observed |
| `scrfd_500m.onnx` | Present in `app-resources/models/` but **no code references it** in V1 | Observed |

### `ModelPathResolver`

- Resolves: `System.getProperty("compose.application.resources.dir")/models/<name>` → fallback `app-resources/models/<name>`

### `YuNetFaceDetector`

- Input: 640×640, 3-channel float tensor
- Score threshold: `0.85f` (square root of cls × obj)
- NMS IoU threshold: `0.30f`
- Multi-scale strided convolutions: 8, 16, 32
- 10 keypoints per face (5 landmarks)

### `CustomerFaceSelector`

- Classifies faces: `FOREGROUND_CUSTOMER`, `BACKGROUND_BYSTANDER`, `REJECTED`
- Thresholds: `minConfidence=0.80f`, `minAreaRatio=0.28f`, `minImageAreaFraction=0.0035f`, `clusterAffinityRatio=0.22f`
- Priority score: `0.60√areaRatio + 0.25×centrality + 0.15×confidence`

### `OnnxFaceParsingService`

- BiSeNet: 19-class face parsing at 512×512 (or 640/768 if model is dynamic)
- Per-pixel semantic classes: skin+nose, neck, cloth, background, hair, lips, eyes, glasses, brows

### `FaceOvalMaskBuilder`

- Geometry oval (upper + jaw fade), semantic protections (eyes, mouth, glasses, hair, neck), 8-connected geodesic growth from confident skin seeds
- `FastGuidedMaskFilter` for feathering; projects mask back to full image via bilinear interpolation through `FaceAlignment`

### `BeautyProcessor`

- Operates in YCbCr space
- Stages: `COMBINED`, `SMOOTHING_ONLY`, `WHITENING_ONLY`, `ROSY_ONLY`
- Smoothing: `GuidedLuminanceFilter` (box-guided filter, radius ≈ 1.2% of image, epsilon=0.002)
- Whitening: `y + 0.28 × w × y × (1−y) × h` where `h` is a smoothstep over brightness
- Rosy: shifts Cb/Cr toward pink; weight peaks at mid-luminance
- All parameters 0–100, applied as `strength/100f` multipliers
- `PixelSafeCompositor.blend()` composites enhanced pixel with original using mask alpha
- Falls back to original image (copy) on: invalid mask, zero strength, empty mask, any exception

### `DesktopBeautyService`

- Lazy singleton; `detectorLock` and `parserLock` for thread-safe ONNX session access
- `processCapture(source, derivative, config, isCancelled)`:
  1. Load image
  2. Detect faces → classify → filter `FOREGROUND_CUSTOMER` only
  3. Per face: align → crop → BiSeNet parse → `FaceOvalMaskBuilder.build()` → composite masks
  4. `BeautyProcessor.process(image, composite, config)`
  5. Write `Photo_N_beauty.png` to `data/sessions/<id>/beauty/`
  6. On any failure: return original source file (graceful fallback)

### `BeautyPreset` Enum

| Preset | Smoothing | Whitening | Rosy | Detail Preservation |
|---|---|---|---|---|
| `NATURAL` | 30 | 20 | 12 | 85 |
| `STUDIO` | 60 | 50 | 25 | 65 |
| `BRIGHT` (default) | 70 | 75 | 20 | 55 |
| `STRONG` | 85 | 95 | 25 | 40 |

### `DesktopBoothController` Beauty Integration

- After each shot: if `config.isBeautyEnabled`, launches `beautyJobs[index] = scope.async { getBeautyService().processCapture(...) }`
- After all shots: `withTimeoutOrNull(15_000L)` to await all beauty jobs
- Successful beauty derivative replaces `moment.photoPath` in `_capturedMoments`

---

## 10. Payment — PayOS

**File:** `PaymentService.kt`

| Feature | Detail | Evidence |
|---|---|---|
| SDK | `vn.payos:payos-java:2.0.1` (Maven Central) | Observed |
| Configuration | `payosClientId`, `payosApiKey`, `payosChecksumKey` from `.env` | Observed |
| `isConfigured` | `payOS != null` (all three keys non-blank) | Observed |
| `createPaymentLink(orderCode, amount, description)` | `orderCode = System.currentTimeMillis()`; returns QR code string | Observed |
| `checkPaymentStatus(orderCode)` | Polls `PaymentLinkStatus.PAID` | Observed |
| Polling interval | 3000 ms in `setQuantityAndStartPayment()` | Observed |
| `completePayment(method)` | Called when `checkPaymentStatus` returns true or staff confirms cash | Observed |
| Cancel URL / Return URL | Both set to `https://localhost/…` (placeholders) | Observed |

**Idempotency:** `orderCode` is `System.currentTimeMillis()` — no session-ID-based deduplication in PayOS itself; the app prevents double-payment by canceling `paymentPollingJob` in `goBack()` and `completePayment()`.

---

## 11. Revenue & Persistence

### `SalesRepository` (SQLite)

**File:** `SalesRepository.kt`

- DB: `data/sales.db` (SQLite, per-booth local ledger)
- Table `sales`:
  - `id INTEGER PK AUTOINCREMENT`
  - `session_id TEXT UNIQUE`
  - `booth_id, layout_id, layout_title, print_size TEXT`
  - `quantity, included_quantity, extra_quantity INTEGER`
  - `base_price, extra_unit_price, extra_amount, total_amount INTEGER` (VND)
  - `payment_method TEXT, created_at INTEGER, status TEXT DEFAULT 'completed'`
  - Migrated columns: `sync_status TEXT DEFAULT 'PENDING'`, `original_quantity INTEGER`, `original_total_amount INTEGER`, `adjust_reason TEXT`, `adjusted_at INTEGER`
- `recordSale(txn)` — `INSERT OR IGNORE` (idempotent by `session_id`)
- `adjustTransaction(sessionId, actualQuantity, reason)` — recalculates extra fees from `base_price` + `extra_unit_price`; sets `sync_status='PENDING'`
- `voidTransaction(sessionId, reason)` — sets `status='VOIDED'`, `sync_status='PENDING'`
- `syncPendingSales(client, config)` — pushes all `PENDING` rows to cloud; marks `SYNCED` on success

### `NeonDirectRevenueClient` (PostgreSQL)

**File:** `NeonDirectRevenueClient.kt`

- Direct JDBC to `config.neonDatabaseUrl` (Neon Postgres)
- Auto-migrates: adds `original_quantity`, `original_total_amount`, `adjust_reason`, `adjusted_at` columns to `revenue_transactions` if missing
- Booth ID resolution: `NEON_REVENUE_BOOTH_ID` env var or first ACTIVE booth in `booths` table
- `recordTransaction()`: `INSERT … ON CONFLICT (external_session_id) DO NOTHING`
- `adjustTransaction()`: row-locked snapshot + recalc; `FOR UPDATE`
- `voidTransaction()`: idempotent — returns true if already `VOIDED`
- `getDashboard()`: summary + daily (Asia/Ho_Chi_Minh timezone) + size breakdowns
- `getRecentTransactions()`: includes `VOIDED` rows

### `DesktopRevenueClient` (HTTP API fallback)

- If `neonDatabaseUrl` is blank, uses `webAlbumBaseUrl/api/v1/revenue/` endpoints with `Bearer` auth
- Endpoints: `POST /api/v1/revenue/transactions`, `POST /…/{sessionId}/adjust`, `POST /…/{sessionId}/void`, `GET /…/summary`, `GET /…/transactions`
- Money values sent/received as **decimal strings**, never `Double`

### `DesktopSessionStore` (JSONL)

- Appends one JSON line per completed session to `data/sessions/sessions.jsonl`
- Fields: `id, boothId, productId, state, qrCodeUrl, photoUrls (pipe-delimited), videoUrls, masterUrl, startedAt, paidAt, completedAt`

### `FrameStore` (filesystem)

- `data/frames/<printSizeLabel>/<layoutId>/Standard/` or `/Special/<eventName>/`
- Each frame: PNG file + optional `<name>.json` with `qrCodeX`, `qrCodeY`, `qrCodeSize`
- Special event covers: `data/covers/<eventName>.png`

---

## 12. Cloudinary + Web Album

### `DesktopCloudinaryClient`

- Multipart upload to `https://api.cloudinary.com/v1_1/<cloudName>/{image|video}/upload`
- Required config: `cloudinaryCloudName` + `cloudinaryUploadPreset`
- Video: inserts `f_auto,q_auto,vc_h264` transform into URL
- Image: inserts `f_auto,q_auto` transform
- Returns `UploadedCloudAsset(secureUrl, finalizeRequest)`

### `DesktopWebAlbumClient`

- Base URL: `config.webAlbumBaseUrl` (from `WEB_ALBUM_BASE_URL` or `ALBUM_BASE_URL` env)
- Endpoints:
  - `POST /api/v1/albums` → `CreateAlbumResponse(albumId, accessToken, albumUrl, status, expiresAt)`
  - `POST /api/v1/albums/{albumId}/assets` → `finalizeAsset()`
  - `POST /api/v1/albums/{albumId}/complete`
- Auth: `Authorization: Bearer <boothApiKey>`

### `DesktopAlbumUploader`

- `uploadSessionPhotos(sessionId, preCreatedAlbumId, capturedMoments, masterPrint)`:
  1. `ensureJpeg()` all originals in parallel
  2. Upload to Cloudinary in parallel
  3. Create album (or reuse `preCreatedAlbumId`)
  4. Finalize assets sequentially (preserve order)
  5. Build `albumUrl = <webAlbumBaseUrl>/album/<sessionId>`
- `uploadSessionVideo()` — uploads master video as `kind="GIF"` (Cloudinary video resource)
- `completeSessionAlbum()` — marks album visible on web

### `LocalFileServer`

- `com.sun.net.httpserver.HttpServer` on `0.0.0.0:<localServerPort>` (default 8080)
- Serves `data/output/` directory via `GET /download/<filename>`
- Blocks path traversal (`..`, `/`, `\`)
- Used as fallback when `canUploadAlbum=false` — QR points to LAN IP instead of web album

---

## 13. Firebase (Layouts + Frames)

**File:** `FirebaseManager.kt`

- Credentials: `serviceAccountKey.json` in working directory (path: `CREDENTIALS_PATH = "serviceAccountKey.json"`)
- Storage bucket: `photop-bf902.appspot.com`
- Firestore collection `layouts`: `fetchLayouts()` → `LayoutMode` list; `uploadLayout()`, `deleteLayout()`, `updateLayoutConfig(price, shotCount, countdown)`, `updateLayoutQRConfig(x, y, size)`
- Firestore collection `frames`: `uploadFrameMetadata(frameId, layoutId, publicUrl)`
- 5-second timeout on `fetchLayouts()`

---

## 14. Pricing

**File:** `PricingCalculator.kt`

| Print Size | Base (2 copies) | Per Extra | Allowed Range |
|---|---|---|---|
| 5×15 (strip) | 70 000 VND | 20 000 VND | 2–50 even numbers |
| 10×15 / 15×10 | 90 000 VND | 30 000 VND | 2–50 any integer |

- `sanitizeQuantity()`: strips must be even; minimum 2
- `PricingSnapshot` is frozen at `confirmStudioSetup()` / `setQuantityAndStartPayment()` and stored in `frozenPricingSnapshot`
- Revenue recording condition: `userConfirmed && printJob.await() && currentSessionId == sessionId` — i.e., only after the print job was accepted by the OS **and** the session hasn't been reset

---

## 15. Configuration — `DesktopBoothConfig` Fields

All fields loaded from `.env` (working dir + app data dir, merged with `System.getenv()`):

| Field | Env Key | Default |
|---|---|---|
| `boothId` | `BOOTH_ID` | `"booth_1"` |
| `boothApiKey` | `BOOTH_API_KEY` | `""` |
| `neonDatabaseUrl` | `NEON_DATABASE_URL` or `DATABASE_URL` | `""` |
| `neonRevenueBoothId` | `NEON_REVENUE_BOOTH_ID` | `""` |
| `webAlbumBaseUrl` | `WEB_ALBUM_BASE_URL` or `ALBUM_BASE_URL` | `"https://web-photobooth-pink.vercel.app/"` |
| `cloudinaryCloudName` | `CLOUDINARY_CLOUD_NAME` | `""` |
| `cloudinaryUploadPreset` | `CLOUDINARY_UPLOAD_PRESET` | `""` |
| `albumExpiresInDays` | `ALBUM_EXPIRES_IN_DAYS` | `7` |
| `enableSystemPrint` | `ENABLE_SYSTEM_PRINT` | `false` |
| `useHotFolder` | `USE_HOT_FOLDER` | `true` |
| `hotFolderPath` | `HOT_FOLDER_PATH` | `"E:\Photobooth\HotFolder"` |
| `useNativeSdk` | `USE_NATIVE_SDK` | `true` |
| `useCliCamera` | `USE_CLI_CAMERA` | `false` |
| `cliCaptureCommand` | `CLI_CAPTURE_COMMAND` | `"CameraControlCmd.exe /capturenoaf /filename \"%s\""` |
| `enableLocalServer` | `ENABLE_LOCAL_SERVER` | `true` |
| `localServerPort` | `LOCAL_SERVER_PORT` | `8080` |
| `payosClientId` | `PAYOS_CLIENT_ID` | `""` |
| `payosApiKey` | `PAYOS_API_KEY` | `""` |
| `payosChecksumKey` | `PAYOS_CHECKSUM_KEY` | `""` |
| `postCaptureTimeoutSeconds` | `POST_CAPTURE_TIMEOUT_SECONDS` | `90` |
| `photoSelectionTimeoutSeconds` | `PHOTO_SELECTION_TIMEOUT_SECONDS` | `90` |
| `frameSelectionTimeoutSeconds` | `FRAME_SELECTION_TIMEOUT_SECONDS` | `60` |
| `printerNameStrip` | `PRINTER_NAME_STRIP` | `""` |
| `printerNameFull` | `PRINTER_NAME_FULL` | `""` |
| `isBeautyEnabled` | `BEAUTY_ENABLED` | `false` |
| `beautyPreset` | `BEAUTY_PRESET` | `BRIGHT` |

**Camera source selection** (mutually exclusive, in priority order):
1. `useNativeSdk=true` → `NativeEosCaptureService`
2. `useCliCamera=true` → `CliCaptureService`
3. `useHotFolder=true` → `HotFolderCaptureService`
4. else → `WebcamStillCaptureService`

Note: `useHotFolder` defaults to `true` in config; in practice `useNativeSdk=true` takes precedence.

### `DesktopAppPaths`

- `APP_DIR_NAME = "LeSouvenirDesktop"`
- Portable mode: if `workingDir/data/` exists or `workingDir/.portable` exists → use working dir as app data
- Otherwise: `%LOCALAPPDATA%/LeSouvenirDesktop/`

---

## 16. Build & Packaging

**File:** `build.gradle.kts`

| Item | Value | Evidence |
|---|---|---|
| Kotlin JVM | `1.9.24` | Observed |
| Compose Desktop | `org.jetbrains.compose:1.6.11` | Observed |
| JVM toolchain | `17` (but `gradle.properties` sets `org.gradle.java.home` to JDK 21) | Observed |
| Packaging | `nativeDistributions` → MSI (Windows), Dmg (macOS), Deb (Linux) | Observed |
| Package name | `"LeSouvenirDesktop"` | Observed |
| Version | `"1.0.1"` | Observed |
| Windows menu group | `"Pretty Booth"` | Observed |
| Upgrade UUID | `ce637e69-93f0-41d6-8092-8e4635c729ad` | Observed |
| `appResourcesRootDir` | `app-resources/` | Observed |
| Explicit JMOD modules | `java.net.http`, `jdk.crypto.ec`, `java.naming`, `java.sql`, `jdk.unsupported`, `java.management`, `jdk.httpserver` | Observed |
| ProGuard | disabled for release | Observed |

### Key Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| `edsdk4j` | `0.0.1` | Canon EDSDK Java wrapper (local jar: `edsdk4j.jar`) |
| `onnxruntime` | `1.18.0` | YuNet + BiSeNet inference |
| `payos-java` | `2.0.1` | PayOS payment QR |
| `firebase-admin` | `9.3.0` | Firestore + Storage |
| `sqlite-jdbc` | `3.45.3.0` | Local sales ledger |
| `postgresql` | `42.7.2` | Neon cloud revenue DB |
| `zxing` | `3.5.3` | QR code generation |
| `webcam-capture` | `0.3.12` | DroidCam / USB webcam |
| `jna` + `jna-platform` | `4.5.2` | Windows GDI window capture + space-key trigger |
| `gson` | `2.10.1` | JSON serialization |
| `slf4j-simple` | `2.0.12` | Logging |
| `kotlinx-coroutines-swing` | `1.8.1` | Swing coroutines |

### Native Binaries Packaged

- `app-resources/EDSDK_64/EDSDK.dll` + `EdsImage.dll` — Canon EDSDK
- `app-resources/models/*.onnx` — YuNet, BiSeNet, SCRFD models
- `app-resources/bin/main/edsdk/api/commands/SafeShootCommand.class` — custom edsdk4j extension

---

## 17. UI Components & Theming

| Component | File | Evidence |
|---|---|---|
| `PhotoboothTheme` | `ui/theme/Theme.kt` | Observed |
| Color tokens | `ui/theme/DesignTokens.kt` | Observed |
| `KioskTouchInteractions` (drag, pager) | `ui/components/KioskTouchInteractions.kt` | Observed |
| `PrintPreview` (live layout preview) | `ui/components/PrintPreview.kt` | Observed |
| `QrCodeView` (ZXing) | `ui/components/QrCodeView.kt` | Observed |
| `CoreComponents` (buttons, pills, sections) | `ui/components/CoreComponents.kt` | Observed |
| `AppShell` / `CompactLocalHeader` | `ui/components/Shell.kt` | Observed |
| Status bar | `ui/components/Shell.kt:StatusBar` | Observed |

---

## 18. Test Inventory (V1 `src/test/`)

| Test File | What It Covers | Evidence |
|---|---|---|
| `PricingCalculatorTest.kt` | Price calculation + quantity sanitization | Observed |
| `SalesRepositoryTest.kt` | SQLite CRUD + sync state | Observed |
| `RevenueAccountingTest.kt` | Revenue summary math | Observed |
| `CubeLutTest.kt` | LUT parser + application | Observed |
| `BeautyProcessorTest.kt` | Beauty filter math | Observed |
| `RealArchiveBeautyAuditTest.kt` | End-to-end beauty on archive images | Observed |
| `BeautyMaskPipeline.kt` | Mask generation pipeline | Observed |
| `LetterboxTransformTest.kt` | YuNet letterbox math | Observed |
| `CustomerFaceSelectorTest.kt` | Face role classification | Observed |
| `OfflineFaceDetector.kt` | YuNet with offline model file | Observed |
| `FaceMaskDiagnosticTest.kt` | Mask diagnostics | Observed |
| `DesktopBeautyServiceTest.kt` | Full beauty service integration | Observed |
| `Phase5RebuildDiagnosticTest.kt` | Diagnostic test | Observed |
| `Phase42DiagnosticTest.kt` | YuNet diagnostic | Observed |

No test touches real camera hardware, printer, or payment gateway.

---

## 19. Directory Layout (Runtime Data)

```
<appDataDir>/
├── .env                  ← runtime overrides (created by SettingsManager)
├── data/
│   ├── sales.db          ← SQLite sales ledger
│   ├── sessions/
│   │   ├── sessions.jsonl
│   │   └── <sessionId>/
│   │       ├── originals/Photo_1.jpg … Photo_N.jpg
│   │       ├── beauty/Photo_N_beauty.png
│   │       ├── videos/shot_N/frame_001.jpg … video_N.mp4
│   │       └── exports/original_N.jpg, final.jpg
│   ├── output/           ← master + print PNG files, final video
│   ├── frames/
│   │   └── <printSize>/<layoutId>/Standard|Special/<event>/<name>.png + <name>.json
│   ├── covers/           ← <eventName>.png
│   ├── filters/
│   │   └── luts/        ← imported .cube files
│   └── config/
│       └── filters.json ← EffectMode list
└── bin/ffmpeg.exe        ← optional local FFmpeg
```

---

## 20. Known Gaps & Unverified Items

| Item | Status |
|---|---|
| DNP RX1HS printer model, driver behavior, 2-inch cut | **Unverified hardware** — no V1 code references DNP directly; behavior is entirely driver-dependent |
| Canon camera model (EOS R100, R50, or other) | **Unverified hardware** — `CliCaptureService` says "Canon R100" but it's a label; EDSDK service is camera-agnostic |
| `scrfd_500m.onnx` usage | **Missing evidence** — file exists in `app-resources/models/` but no V1 code references it |
| `RECOVERY` / `OUT_OF_SERVICE` states | **Missing evidence** — declared in enum but never assigned in any code path |
| `COMPOSING` state | **Missing evidence** — declared but never used; composition is synchronous inside `startPrinting` |
| `safeShootCommand` timeout parameter (value `3`) | **Inferred** — likely seconds, but not documented in edsdk4j source |
| PayOS `cancelUrl` / `returnUrl` | **Inferred** — set to `https://localhost/…`; actual web redirect behavior not verified |
| `EDSDK_64` native DLL loading | **Unverified hardware** — DLL loading depends on `jna.library.path` or system PATH at runtime |
