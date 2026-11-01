# LE SOUVENIR Photobooth V2 — Real-Mode Integration Matrix & Legacy Audit

**Milestone 1 Deliverable — Full Real-Integration Gap Audit**  
**Document ID:** `REAL_MODE_INTEGRATION_MATRIX.md`  
**Author:** Specialist Legacy System Auditor  
**Date:** November 2026  
**Status:** Approved Audit Baseline  
**Boundaries Enforced:** Legacy V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) is strictly read-only. All outputs written to V2 (`E:\HK1_2026_2027\PhotoboothDesktop_v2`). No secrets or customer PII inspected or disclosed.

---

## 1. Executive Summary & Audit Scope

This document provides an exhaustive, code-level gap audit between the legacy production implementation (V1) and the newly created V2 architecture. 

During the initial phase of V2 development, foundation tests, the touchscreen UI, and IPC bridges were established using **simulators, stubs, and synthetic fixtures** (`SimulatorCamera`, `SimulatorCompositor`, `IsolatedHotFolder`, `SafeTransport`, `InMemoryRecognitionJournal`). While this enabled frontend and UI state-machine validation without requiring connected hardware, **none of the physical hardware, native computer-vision models, local database ledgers, or real cloud payment endpoints are wired to live execution in V2.**

This audit establishes the concrete matrix of:
1. Every real implementation in V1 (with exact source file paths and line numbers).
2. The current synthetic/mock state in V2.
3. Native library, SDK, and third-party API dependencies.
4. Blockers preventing real-mode execution.
5. Verification procedures and exact next engineering actions for Milestone 2 (Real Camera) and Milestone 3 (Real Image Processing).

---

## 2. Master Real-Mode Integration Matrix

| Subsystem | V1 Production Implementation | V2 Current State | Adapter Availability | Criticality | Primary Blocker / Gap |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Camera** | `NativeEosCaptureService.kt` (Canon EDSDK JNA), `EosUtilityCaptureService.kt`, `WebcamStillCaptureService.kt`, `HotFolderCaptureService.kt` | `SimulatorCamera.kt` (synthetic RGB blocks), `LegacyCameraPort.kt` (reflection stub behind disabled gate), `IsolatedHotFolder.kt` | Reflection stub only; EDSDK unlinked | **Critical** (P0) | Missing `EDSDK.dll`/`EdsImage.dll` in V2 runtime; missing JNA wrapper, Windows message pump thread, and `SafeShootCommand` in V2 classpath |
| **2. Printer** | `DesktopIoServices.kt` (`SystemPrinterService` via Java AWT `PrinterJob`), `DesktopCompositor.kt` (600 DPI, 2-up 5x15 cut composite) | `SimulatorCompositor.kt` (mock composite file), `LegacyPrinter.kt` (gated behind `PrintAuthorization { false }`) | Code ported, gated behind authorization | **Critical** (P0) | `LegacyPrinter` not connected to `IpcMain`/`SimulatorSessionEngine`; print dry-run only returns `printAccepted: false` |
| **3. Beauty & CV** | `BeautyProcessor.kt` (YCbCr luma/color filter), `YuNetFaceDetector.kt` (ONNX), `OnnxFaceParsingService.kt` (BiSeNet ONNX), `DesktopImageProcessor.kt` (3D LUTs) | `SimulatorCompositor.kt` (basic synthetic rectangle draw; no CV, no LUT, no face detect) | Models exist in V1 assets; logic unported | **Important** (P1) | V2 `build.gradle.kts` lacks `com.microsoft.onnxruntime:onnxruntime`; ONNX model files not copied to V2; Beauty pipeline unported |
| **4. Payments** | `PaymentService.kt` (official `vn.payos:payos-java:2.0.1` SDK client) | `PayOsClient.kt` (direct HTTP client with HMAC-SHA256 signature, behind `SafeTransport`) | Wire client implemented, offline gated | **Important** (P1) | `IpcMain` only implements `payment.mockComplete`; no real QR generation or status polling wired to UI session flow |
| **5. Revenue & Ledger** | Dual-route: `NeonDirectRevenueClient.kt` (PostgreSQL JDBC) + `DesktopRevenueClient.kt` (REST); `SalesRepository.kt` (SQLite `sales.db`) | `RevenueRecognition.kt` (pure logic gate + in-memory journal), `SharedApiClients.kt:RevenueClient` (REST only) | Logic verified, DB drivers unlinked | **Critical** (P0) | V2 lacks local SQLite persistence and Neon direct JDBC client; no PostgreSQL/SQLite JDBC drivers in `build.gradle.kts` |
| **6. Cloud & QR** | `DesktopAlbumUploader.kt`, `DesktopCloudinaryClient.kt` (multipart), `DesktopWebAlbumClient.kt`, `QrCodeView.kt` / `DesktopCompositor.drawQRCode` (ZXing) | `CloudinaryClient.kt` (multipart via `SafeTransport`), `WebAlbumClient` (REST client), no QR rendering in backend | Wire clients implemented, unhooked | **Important** (P1) | Delivery flow not triggered from session engine; ZXing not in V2 dependencies; QR stamp omitted from composition |

---

## 3. Subsystem 1: Camera Subsystem

### 3.1 V1 Legacy Architecture & Code Audit

V1 supports four camera sources configured via operator settings, defaulting to native Canon DSLR/Mirrorless via Canon EDSDK.

#### A. Native Canon EDSDK (`NativeEosCaptureService.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/services/NativeEosCaptureService.kt`
* **Symbols:** `class NativeEosCaptureService(config: DesktopBoothConfig, imageProcessor: DesktopImageProcessor) : StillCaptureService`
* **Discovery & Session Initialization (Lines 29–48):**
  - Instantiates `camera = CanonCamera()` (`edsdk.api.CanonCamera`).
  - Calls `sessionOpen = camera.openSession()` synchronously during instantiation.
  - If open fails, logs `Native EDSDK: Failed to open camera session. Will auto-retry in background.` and triggers background auto-reconnect.
* **Auto-Reconnect Loop (Lines 50–82):**
  - Runs in `scope.launch(Dispatchers.IO + SupervisorJob())`.
  - While disconnected: calls `camera.closeSession()`, instantiates new `CanonCamera()` to reset dead native USB handles, and calls `camera.openSession()`. If successful, resumes live view automatically if `currentEffectId.isNotEmpty()`.
  - While connected: polls `camera.apertureValue` every 2000 ms. If a native communication exception occurs (camera switched off or USB unplugged), sets `sessionOpen = false` and calls `stopLiveView()`.
* **Native Binaries & JNA Dispatch Engine:**
  - **DLL Dependencies:** `EDSDK.dll` and `EdsImage.dll` (located in `EDSDK_64/` and `app-resources/windows/EDSDK_64/`).
  - **JNA Bindings:** `net.java.dev.jna:jna:4.5.2` and `jna-platform:4.5.2`. Dynamic library loaded via `DLL_Setup.initLibrary("EdSdk")` and `Native.loadLibrary(CanonCamera.libraryInfo.dllLoc, EdSdkLibrary.class, CanonCamera.options)`.
  - **STA Windows Message Pump (Critical Architectural Constraint):**  
    Canon EDSDK on Windows requires an active Windows Message Loop to receive USB object events (`kEdsObjectEvent_DirItemCreated`, `kEdsObjectEvent_DirItemRequestTransfer`).  
    In `edsdk/api/CanonCamera.java:98–178`, a dedicated background thread `CanonCamera.dispatcherThread` runs `User32.INSTANCE.PeekMessage(msg, null, 0, 0, 1)`, `TranslateMessage(msg)`, `DispatchMessage(msg)` in a 1 ms polling loop.
  - **Single-Threaded Command Queue:**  
    EDSDK is strictly single-threaded; concurrent JNA calls from different JVM threads cause hard access violations (JVM segfault). `CanonCamera.java:128–165` processes a `ConcurrentLinkedQueue<CanonCommand<?>>` sequentially on the dispatcher thread.
* **Live View Stream (Lines 114–173):**
  - `startLiveView(effectId)` launches an IO coroutine.
  - Calls `camera.beginLiveView()` with up to 10 retries (500 ms delay) if the camera reports busy.
  - Sets Face Tracking AF mode: `camera.setProperty(CanonConstants.EdsPropertyID.kEdsPropID_Evf_AFMode, 2L)`.
  - Polling loop runs at ~30 fps (`delay(30)`):
    - Downloads EVF frame: `val image = camera.downloadLiveView()` (reads memory stream `EdsDownloadEvfImage`).
    - Applies live filter/LUT: `val processed = imageProcessor.applyEffectForLiveView(image, effectId)`.
    - Updates Compose state flow: `_liveViewStream.value = processed.toComposeImageBitmap()`.
    - Disconnect fallback: If `image` returns null 20 consecutive times, treats camera as disconnected, resets `sessionOpen = false`, and halts live view.
    - Error rendering: `emitErrorFrame(msg)` renders red diagnostic text onto a 640x480 black `BufferedImage`.
  - `stopLiveView()` (Lines 189–195): Cancels coroutine job and invokes `camera.endLiveView()`.
* **Photo Capture & File Transfer (Lines 197–235):**
  - Invokes `camera.execute(SafeShootCommand(EdsSaveTo.kEdsSaveTo_Host, 3)).get()`.
  - **Custom Patch in `SafeShootCommand.java:101–105`:**  
    V1 explicitly commented out `CanonUtils.endLiveView(camera.getEdsCamera())` prior to shutter release to prevent the camera from resetting its continuous Servo autofocus!
  - `SafeShootCommand` triggers `EdsCameraCommand_TakePicture`.
  - Upon `EdsObjectEvent_DirItemCreated` / `DirItemRequestTransfer`, downloads raw JPEG to temporary file via `CanonUtils.download(inRef, dest, ...)`.
  - Post-processing: Passes temp JPEG to `imageProcessor.saveBoothCapture(...)`, which:
    1. Decodes image.
    2. Applies selected LUT / filter.
    3. **Mirrors horizontally:** `graphics.scale(-1.0, 1.0)` with translation so that the captured photo matches the mirror perspective seen by customers on screen.
    4. Saves to destination directory as `Photo_$shotIndex.jpg`.
    5. Deletes temporary downloaded capture file.
  - Error recovery: If capture fails (AF lock failure / `AF NG`), attempts to restart Live View via `camera.beginLiveView()`.
* **Hardware Parameter Controls (Lines 84–108):**
  - ISO: `getAvailableIsoSpeeds()`, `getCurrentIso()`, `setIso(desc)`.
  - Aperture: `getAvailableApertures()`, `getCurrentAperture()`, `setAperture(desc)`.
  - Shutter Speed: `getAvailableShutterSpeeds()`, `getCurrentShutterSpeed()`, `setShutterSpeed(desc)`.
  - White Balance: `setWhiteBalanceSafe(wbEnumName)`.
  - Picture Style: `setPictureStyleSafe(psEnumName)`.

#### B. EOS Utility Hot Folder Service (`EosUtilityCaptureService.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/services/EosUtilityCaptureService.kt:16–169`
* **Process Detection:** Checks `tasklist /FI "IMAGENAME eq EOS Utility 3.exe"`.
* **Live View:** Captures the OS window titled `"Live View"` via `WindowCaptureHelper.captureWindow("Live View")` (Windows GDI `PrintWindow`/`BitBlt`), with fallback to Sarxos webcam.
* **Capture Trigger:** Sends simulated Spacebar key directly to the EOS Utility window handle via `WindowCaptureHelper.sendSpaceToWindow("EOS Utility")` without stealing window focus.
* **Hot Folder Wait:** Polls configured folder for newly created `.jpg` files for up to 15 seconds (150 attempts * 100 ms). Waits 500 ms for file write completion before ingesting.

#### C. Webcam Service (`WebcamStillCaptureService.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/services/WebcamStillCaptureService.kt:25–130`
* **Dependency:** `com.github.sarxos:webcam-capture:0.3.12`.
* **Device Selection:** Enumerates all connected webcams, prioritizes device names containing `"DroidCam"`, otherwise uses default webcam.
* **Resolution & Crop:** Opens webcam at maximum supported resolution (`maxByOrNull { it.width * it.height }`). Center-crops frames to 16:9 (`centerCropToAspect(16f / 9f)`).
* **Live View & Capture:** Feeds frames to coroutine loop at ~30 fps; capture grabs single frame, applies filter/mirroring, and writes JPEG.

#### D. Hot Folder Watcher (`HotFolderCaptureService.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/services/HotFolderCaptureService.kt:12–78`
* **Mode:** Passive hot folder listener for Sony cameras / Bluetooth hardware clickers.
* **Operation:** No live view stream (`MutableStateFlow(null)`). Capture snapshots directory contents, waits up to 15 seconds for a newly arrived `.jpg` file > 0 bytes, waits 500 ms for file lock release, processes through `imageProcessor.saveBoothCapture`, and deletes file from the hot folder.

---

### 3.2 V2 Current State & Implementation Comparison

* **`SimulatorCamera.kt` (`backend/.../camera/simulator/SimulatorCamera.kt:17–100`):**
  - Completely synthetic image generator.
  - Generates colored rectangular test patterns (`Color((index * 53) and 255, ...)`), draws text label `"synthetic-$index"`.
  - Preview downscaled to 320x180 JPEG and returned as Base64 data URL.
* **`LegacyCameraPort.kt` (`backend/.../camera/legacy/LegacyCameraPort.kt:1–117`):**
  - Contains class skeletons `LegacyCanonPort`, `LegacyWebcamPort`, `LegacyHotFolderPort`.
  - All access is guarded by `HardwareAuthorization(explicitlyApproved = false)`.
  - `LegacyCanonPort` attempts dynamic reflection: `Class.forName("edsdk.api.CanonCamera")`.
  - **Severe Limitation:** Stubs only `open()`, `beginLiveView()`, `downloadLiveView()`, `close()`. Contains NO capture method, NO shoot command, NO auto-reconnect loop, and NO property control methods.
* **`IsolatedHotFolder.kt` (`backend/.../camera/legacy/IsolatedHotFolder.kt:1–80`):**
  - Path-isolated hot folder utility strictly restricted to folders named `synthetic-hotfolder-*` and `synthetic-sessions-*`.
  - Enforces strict SHA-256 stability checks and JPEG magic-byte verification (`FF D8 ... FF D9`).

---

### 3.3 Dependencies & Gaps

* **Native DLLs Required:**
  - `EDSDK.dll` (Canon EDSDK v13.x 64-bit)
  - `EdsImage.dll` (Canon EVF / raw processing)
* **JVM Libraries Required in `backend/build.gradle.kts`:**
  - `net.java.dev.jna:jna:5.14.0` (or 4.5.2)
  - `net.java.dev.jna:jna-platform:5.14.0`
  - `edsdk4j` classes (`edsdk.api.CanonCamera`, `edsdk.bindings.EdSdkLibrary`, `edsdk.utils.CanonUtils`)
  - `com.github.sarxos:webcam-capture:0.3.12` (for fallback webcam support)
* **Current Blockers:**
  1. `backend/build.gradle.kts` has zero camera/JNA dependencies.
  2. The `edsdk` Java wrapper package and `SafeShootCommand.java` have not been copied into V2 backend sources.
  3. Canon DLLs (`EDSDK_64/`) are not packaged into V2 distribution directory.
  4. The Windows Message Pump (`User32.INSTANCE.PeekMessage`) thread is absent in V2.
  5. IPC protocol (`SimulatorSessionEngine`) has no camera property get/set methods (`camera.setIso`, `camera.setShutterSpeed`, `camera.setAperture`).

---

### 3.4 Verification Procedure
1. Place Canon 64-bit DLLs into `backend/app-resources/windows/EDSDK_64/`.
2. Connect Canon EOS DSLR/Mirrorless camera via USB.
3. Execute camera discovery integration test verifying:
   - SDK initialization (`EdsInitializeSDK`).
   - Session open (`EdsOpenSession`).
   - Live view frame stream delivery (>20 fps).
   - Test capture command with local file download and verification of non-empty JPEG file.
   - Clean SDK shutdown (`EdsTerminateSDK`).

---

## 4. Subsystem 2: Printer Subsystem

### 4.1 V1 Legacy Architecture & Code Audit

#### A. Discovery & Print Job Submission (`DesktopIoServices.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/services/DesktopIoServices.kt:36–92`
* **Symbols:** `class SystemPrinterService : PrinterService`
* **Printer Discovery (Line 45):**
  - Calls Java Print API: `PrinterJob.lookupPrintServices()`.
  - Matches printer by substring: `services.find { it.name.contains(printerName, ignoreCase = true) }`.
  - Target production printer: **DNP DS-RX1HS** (or Windows default printer if `printerName` is null).
* **Print Attributes & Borderless Margin Bypass (Lines 51–59):**
  - Attributes: `val attributes = HashPrintRequestAttributeSet(); attributes.add(Copies(copies))`.
  - **Critical Borderless Fix:** Standard Java `PrinterJob` enforces default 1-inch printable margins, shrinking the photo and creating white borders. V1 strips the printable margin to absolute zero:
    ```kotlin
    val pageFormat = printJob.defaultPage()
    val paper = pageFormat.paper
    paper.setImageableArea(0.0, 0.0, paper.width, paper.height)
    pageFormat.paper = paper
    ```
* **Orientation Correction (`Printable.print()`, Lines 60–86):**
  - Compares aspect ratios: `val isImageLandscape = image.width > image.height`, `val isPaperLandscape = destWidth > destHeight`.
  - If orientations mismatch (e.g. Portrait photo strip on Landscape paper feed), rotates canvas 90 degrees around center:
    ```kotlin
    g2d.translate(destWidth / 2.0, destHeight / 2.0)
    g2d.rotate(Math.PI / 2)
    g2d.drawImage(image, -destHeight / 2, -destWidth / 2, destHeight, destWidth, null)
    ```
  - Dispatches job via `printJob.print(attributes)`.

#### B. Print Geometries & 2-Inch Cut Support (`DesktopCompositor.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/imaging/DesktopCompositor.kt:42–187`
* **Resolution & DPI:**
  - Standard baseline is 300 DPI.
  - Compositor uses `renderScale = 2`, effectively rendering at **600 DPI** for sharp thermal dye-sublimation output.
* **Exact Dimensions & Paper Placement:**
  1. **5x15 cm Photo Strip (2x6 inch):**
     - Single customer strip canvas: `592 * 2 = 1184 px` width by `1790 * 2 = 3580 px` height.
     - Physical paper sheet (4x6 inch / 10x15 cm): `paperWidth = 1226 * 2 = 2452 px`, `paperHeight = 1829 * 2 = 3658 px`.
     - Layout is rendered as a **2-up side-by-side composite**:
       - `paddingTop = 27 * 2 = 54 px`
       - `paddingLeft = 14 * 2 = 28 px`
       - `gap = 2 * 2 = 4 px`
       - Strip 1 placed at `(paddingLeft, paddingTop) -> (28, 54)`
       - Strip 2 placed at `(paddingLeft + scaledWidth + gap, paddingTop) -> (28 + 1184 + 4, 54) = (1216, 54)`
     - **Hardware 2-Inch Cut Support:**  
       The DNP RX1HS Windows print driver has an internal hardware rotary cutter. When "2-inch cut" is enabled in Windows printer driver preferences, the printer automatically cuts down the vertical center of the 4x6 sheet, outputting two distinct 2x6 inch (5x15 cm) strips. The composite layout aligns with this cut line with 4px gap and balanced side margins.
  2. **10x15 cm Postcard (4x6 inch Portrait):**
     - Single canvas: `1184 * 2 = 2368 px` by `1790 * 2 = 3580 px`.
     - Paper sheet: `1226 * 2 = 2452 px` by `1829 * 2 = 3658 px`.
     - Positioned at `paddingLeft = 28 px`, `paddingTop = 54 px`.
  3. **15x10 cm Postcard (6x4 inch Landscape):**
     - Single canvas: `1790 * 2 = 3580 px` by `1184 * 2 = 2368 px`.
     - Paper sheet: `1829 * 2 = 3658 px` by `1226 * 2 = 2452 px`.
     - Positioned at `paddingLeft = 54 px`, `paddingTop = 28 px`.
* **Output Artifacts:**  
  Generates two files:
  - `finalImagePath`: Canvas without border margins (used for web album / Cloudinary upload, includes customer QR code).
  - `printImagePath` (`print_$fileName`): Composite canvas on physical paper size with margins and strip duplication (sent directly to `SystemPrinterService`).

---

### 4.2 V2 Current State & Implementation Comparison

* **`SimulatorCompositor.kt` (`backend/.../printing/SimulatorCompositor.kt:15–94`):**
  - Accurately ported the geometry calculations and 2-up composite generation from V1 lines 24–47.
  - Generates `composition` and `printImage` file artifacts on disk.
  - Does NOT embed dynamic QR codes onto the image.
* **`LegacyPrinter.kt` (`backend/.../printing/legacy/LegacyPrinter.kt:35–94`):**
  - Directly ports V1's `PrinterJob.lookupPrintServices()`, `Copies(copies)`, and borderless `setImageableArea(0,0,w,h)`.
  - Provides `AwtPrintFacade` and `LegacyPrintable`.
  - Guards execution behind `PrintAuthorization { false }`.
  - Enforces fail-closed printer matching (`matches.size != 1` rejects ambiguous printers).
* **`SimulatorSessionEngine.kt`:**
  - `print.confirmDryRun` (Line 214) calls `complete(true)`.
  - It generates simulator files on disk, but returns `printAccepted: false` and NEVER calls `LegacyPrinter`.

---

### 4.3 Dependencies & Gaps

* **Dependencies:** Standard Java Desktop `java.desktop` module (`java.awt.print`, `javax.print`). No external third-party JARs required.
* **Driver Requirements:** DNP DS-RX1HS Windows Print Driver installed on host OS.
* **Current Blockers:**
  1. `LegacyPrinter` is completely disconnected from the active IPC session engine (`SimulatorSessionEngine.kt`).
  2. No printer discovery IPC endpoint exists to enumerate installed Windows printers to the operator screen.
  3. Windows print queue status (paper empty, ribbon out, paper jam) is not polled; AWT `PrinterJob` only knows if spooling was accepted.

---

### 4.4 Verification Procedure
1. Install DNP DS-RX1HS driver in Windows.
2. In Windows Printer Properties, configure Paper Size to `4x6 (10x15cm)` and enable `2-inch cut` option.
3. Run safe test harness sending a generated 2-up 2452x3658 PNG to `LegacyPrinter.submit()`.
4. Verify physical cut cleanly divides the two 5x15 strips without clipping text or photo slots.

---

## 5. Subsystem 3: Image Processing & Beauty Subsystem

### 5.1 V1 Legacy Architecture & Code Audit

#### A. Beauty Skin Enhancement Algorithm (`BeautyProcessor.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/beauty/BeautyProcessor.kt:5–53`
* **Algorithm & Color Space Pipeline:**
  - **100% Pure Kotlin implementation** (no OpenCV or native C++ dependencies required for the filter math!).
  - Converts RGB pixels to YCbCr:
    ```kotlin
    val color = BeautyColorMath.toYCbCr(original[i])
    luma[i] = color.y; cb[i] = color.cb; cr[i] = color.cr
    ```
  - **Guided Luminance Smoothing:** `GuidedLuminanceFilter` filters the luma channel `y`.
    `ySmooth = luma[i] - s * (1f - 0.70f * d) * (luma[i] - base[i])`
    where `s` is `smoothingStrength / 100f` and `d` is `detailPreservation / 100f`.
  - **Adaptive Whitening Tone Curve:**
    `h = if (ySmooth < 0.75f) 1f else ((0.98f - ySmooth) / (0.98f - 0.75f)).coerceIn(0f, 1f)`
    `y = (ySmooth + 0.28f * w * ySmooth * (1f - ySmooth) * h).coerceIn(0f, 1f)`
    Prevents highlight blowout while brightening skin tones.
  - **Rosy Tone Tint:**
    `weight = 4f * y * (1f - y)`
    `cbNew = cb[i] - 0.012f * r * weight`
    `crNew = cr[i] + 0.025f * r * weight`
  - **Alpha Mask Blending:** Blends filtered pixel with original using `PixelSafeCompositor.blend(original[i], enhanced, alpha)` where `alpha` is the face skin mask.
  - **Audit Metrics:** Computes `meanYBefore`, `meanYAfter`, `deltaY`, `activePixels`, `outsideMaskMaxDiff`.

#### B. YuNet Face Detection (`YuNetFaceDetector.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/facemask/YuNetFaceDetector.kt:12–109`
* **Runtime:** Microsoft ONNX Runtime (`com.microsoft.onnxruntime:onnxruntime:1.18.0`).
* **Model Weight:** `face_detection_yunet_2023mar.onnx` (`app-resources/models/face_detection_yunet_2023mar.onnx`).
* **Inference Pipeline:**
  - Letterboxes input image to 640x640 RGB float tensor via `LetterboxTransform.kt`.
  - Model outputs cls, obj, bbox, and 10 landmark points across strides 8, 16, 32.
  - Score threshold `SCORE_THRESHOLD = 0.85f`.
  - Non-Maximum Suppression (NMS) IoU threshold `NMS_IOU_THRESHOLD = 0.30f`.
  - Extracts 5 facial landmarks: right eye, left eye, nose, right mouth corner, left mouth corner.

#### C. BiSeNet Semantic Face Parsing (`OnnxFaceParsingService.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/facemask/OnnxFaceParsingService.kt:12–120`
* **Model Weight:** `bisenet_face_parsing.onnx` (`app-resources/models/bisenet_face_parsing.onnx`).
* **Inference Pipeline:**
  - 19 semantic classes (0: background, 1: skin, 2-3: eyebrows, 4-5: eyes, 6: glasses, 10: nose, 11-13: lips/mouth, 14-15: neck, 16: cloth, 17: hair).
  - Aligns and crops face to 512x512 via `FaceAlignment.kt`.
  - Runs inference, normalizes with ImageNet mean `[0.485, 0.456, 0.406]` and std `[0.229, 0.224, 0.225]`.
  - Softmax probabilities combined by `FaceOvalMaskBuilder.kt` to create a precise face-skin-only alpha mask, excluding eyes, eyebrows, glasses frames, nostrils, and lips.

#### D. Customer Face Selection & Fail-Safe Fallback (`DesktopBeautyService.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/services/DesktopBeautyService.kt:14–76`
* **Customer Selection:** Uses `CustomerFaceSelector.kt` to classify detected faces into `FOREGROUND_CUSTOMER` vs `BACKGROUND_PASSERBY` based on face size, position, and orientation. Only foreground customer faces receive beauty treatment.
* **Fail-Safe Fallback:** If any error occurs (model missing, out of memory, detection failure, zero mask), logs the warning and returns `sourceImageFile` unmodified without interrupting customer flow.

#### E. Color Grading & 3D LUTs (`DesktopImageProcessor.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/imaging/DesktopImageProcessor.kt:16–160`
* **3D LUT Engine:** `CubeLutParser.kt` parses standard `.cube` Adobe 3D LUT files into `Lut3D.kt`, cached in `ConcurrentHashMap<Path, Lut3D>`. Applied with configurable `lutIntensity`.
* **Mirroring:** Reverses X-axis (`graphics.scale(-1.0, 1.0)`) on saved captures to maintain parity with Live View mirror reflection.

---

### 5.2 V2 Current State & Implementation Comparison

* **V2 Status:** **Completely absent / synthetic.**
* `SimulatorCompositor.kt` only draws synthetic boxes.
* Neither `BeautyProcessor.kt`, `YuNetFaceDetector.kt`, `OnnxFaceParsingService.kt`, `CubeLutParser.kt`, nor `DesktopImageProcessor.kt` exist in V2 codebase.

---

### 5.3 Dependencies & Gaps

* **JVM Libraries Required in `backend/build.gradle.kts`:**
  - `com.microsoft.onnxruntime:onnxruntime:1.18.0` (includes native ONNX Runtime DLLs for Windows x64).
* **Model Assets Required:**
  - `face_detection_yunet_2023mar.onnx` (~337 KB)
  - `bisenet_face_parsing.onnx` (~53 MB)
* **Current Blockers:**
  1. `onnxruntime` dependency missing in `backend/build.gradle.kts`.
  2. Model files not copied from V1 `app-resources/models/` to V2.
  3. Pure Kotlin beauty/mask files (`BeautyProcessor.kt`, `GuidedLuminanceFilter.kt`, `BeautyColorMath.kt`, `PixelSafeCompositor.kt`, `FaceOvalMaskBuilder.kt`, `FaceAlignment.kt`, `LetterboxTransform.kt`, `CustomerFaceSelector.kt`) have not been migrated into V2.

---

### 5.4 Verification Procedure
1. Copy model files into V2 and configure path resolver.
2. Run automated test passing fixture image with 2 faces (one foreground customer, one background bystander).
3. Verify:
   - YuNet detects face bounds and landmarks.
   - Customer face selector isolates foreground face.
   - BiSeNet generates 512x512 segmentation mask.
   - Mask excludes glasses and lips.
   - `BeautyProcessor` applies smoothing/whitening with `outsideMaskMaxDiff == 0` (zero bleeding outside skin area).

---

## 6. Subsystem 4: Payments (PayOS)

### 6.1 V1 Legacy Architecture & Code Audit

* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/services/PaymentService.kt:9–50`
* **Symbols:** `class PaymentService(private val config: DesktopBoothConfig)`
* **Library Dependency:** Official PayOS Java SDK `vn.payos:payos-java:2.0.1`.
* **Payment Request Structure (Lines 20–39):**
  - Parameters: `orderCode: Long`, `amount: Int`, `description: String`.
  - Item details: `PaymentLinkItem.builder().name("Le Souvenir").quantity(1).price(amount.toLong()).build()`.
  - Return/Cancel URLs: `cancelUrl = "https://localhost/cancel"`, `returnUrl = "https://localhost/success"`.
  - Creates link via `payOS.paymentRequests().create(paymentRequest)`.
  - Returns `response.qrCode` (VietQR payload string rendered on screen via `QrCodeView`).
* **Status Polling & Expiration (`DesktopBoothController.kt:367–386`):**
  - Generates `orderCode = System.currentTimeMillis()`.
  - Polling interval: **3000 ms** (`delay(3000)` in IO coroutine).
  - Status check: calls `payOS.paymentRequests().get(orderCode)` and checks `link.status == PaymentLinkStatus.PAID`.
  - On payment success: calls `completePayment("QR PayOS")`, transitions to `PREPARING` and starts camera live view.
  - Cancellation / Timeout: Going back or session cancel cancels `paymentPollingJob`.

---

### 6.2 V2 Current State & Implementation Comparison

* **`PayOsClient.kt` (`backend/.../integrations/PayOsClient.kt:9–39`):**
  - Implements direct lightweight HTTP client using `SafeTransport` (bypassing heavy third-party SDK).
  - Calculates standard PayOS HMAC-SHA256 signature locally:
    ```kotlin
    val canonical = "amount=$amount&cancelUrl=https://localhost/cancel&description=$description&orderCode=$orderCode&returnUrl=https://localhost/success"
    val mac = Mac.getInstance("HmacSHA256")
    mac.init(SecretKeySpec(checksumKey.toByteArray(Charsets.UTF_8), "HmacSHA256"))
    ```
  - Sends POST request to `https://api-merchant.payos.vn/v2/payment-requests` with headers `x-client-id` and `x-api-key`.
  - Polling check: GET `https://api-merchant.payos.vn/v2/payment-requests/$orderCode`, parses `data.status == "PAID"`.
* **Gating:** Protected by `SafeTransport.requireAllowed()`.
* **Bridge State:** `SimulatorSessionEngine.kt` only exposes `payment.mockComplete` (Line 202).

---

### 6.3 Dependencies & Gaps

* **Dependencies:** None (uses built-in `java.net.http.HttpClient` and `javax.crypto.Mac`).
* **API Credentials:** `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`.
* **Current Blockers:**
  1. No IPC method in `IpcMain` / `SimulatorSessionEngine` to trigger real payment link creation (`payment.create`).
  2. No background polling coroutine in session engine to emit payment completion events to the React UI.

---

### 6.4 Verification Procedure
1. Configure test PayOS merchant credentials in environment variables.
2. Call `payOsClient.createPaymentLink(...)` in test suite; verify valid VietQR response returned with code `"00"`.
3. Verify signature generation matches PayOS documentation HMAC-SHA256 test vectors.

---

## 7. Subsystem 5: Revenue & Neon PostgreSQL / Shared API

### 7.1 V1 Legacy Architecture & Code Audit

V1 implements a dual-mode revenue reporting system with local offline durability:

```
[Confirm & Print Success]
           │
           ▼
   [SalesRepository]  ───(writes locally)───►  SQLite `sales.db` (sync_status = 'PENDING')
           │
     (sync loop)
           ├──────────────────────────────┐
           ▼ (if NEON_DB_URL present)     ▼ (if BOOTH_API_KEY present)
 [NeonDirectRevenueClient]      [DesktopRevenueClient]
           │                              │
           ▼                              ▼
  Neon PostgreSQL Direct          Shared REST Web API
  `revenue_transactions`          `/api/v1/revenue/transactions`
```

#### A. Dual-Route Revenue Architecture (`DesktopRevenueClient.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/remote/DesktopRevenueClient.kt:14–111`
* **Route Selection:**
  - If `config.neonDatabaseUrl.isNotBlank()` -> delegates directly to `NeonDirectRevenueClient`.
  - Else if `config.boothApiKey.isNotBlank() && config.webAlbumBaseUrl.isNotBlank()` -> sends REST requests to `${webAlbumBaseUrl}/api/v1/revenue/transactions`.

#### B. Direct Neon PostgreSQL Driver (`NeonDirectRevenueClient.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/remote/NeonDirectRevenueClient.kt:17–120`
* **JDBC Driver:** `org.postgresql:postgresql:42.7.2`. Connection timeout: 5s, socket timeout: 10s.
* **Active Booth Resolution (Lines 39–49):**
  - `SELECT id FROM booths WHERE status = 'ACTIVE' ORDER BY created_at ASC LIMIT 1`.
* **Schema & Idempotency (Lines 74–94):**
  - Table: `revenue_transactions`.
  - Columns: `id`, `booth_id`, `external_session_id`, `layout_id`, `layout_title`, `print_size`, `quantity`, `included_quantity`, `extra_quantity`, `base_price`, `extra_unit_price`, `extra_amount`, `total_amount`, `payment_method`, `status`, `created_at`, `original_quantity`, `original_total_amount`, `adjust_reason`, `adjusted_at`.
  - Idempotency constraint: `ON CONFLICT (external_session_id) DO NOTHING`.
* **Adjustment & Row Locking (Lines 97–120):**
  - Uses `SELECT ... FOR UPDATE` with `status = 'completed'` and explicit transaction commit to adjust quantity/price if extra reprints occur.

#### C. Local Offline Ledger (`SalesRepository.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/data/SalesRepository.kt:11–70`
* **Database:** SQLite `data/sales.db` via `org.xerial:sqlite-jdbc:3.45.3.0`.
* **Reliability:** Every transaction is recorded locally first with `sync_status = 'PENDING'`. A background job `syncPendingSales(...)` retries cloud delivery until acknowledged.

#### D. Strict Revenue Recognition Gate (`DesktopBoothController.kt:842–852`)
* **The Golden Business Rule:**
  ```kotlin
  if (userConfirmed && printJob.await() && currentSessionId == sessionId) {
      withContext(Dispatchers.IO) {
          runCatching { salesRepository.recordSale(sale) }
              .onSuccess {
                  scope.launch(Dispatchers.IO) {
                      runCatching { salesRepository.syncPendingSales(revenueClient, activeConfig.value) }
                  }
              }
      }
  }
  ```
* Revenue is recognized **ONLY AFTER**:
  1. The user explicitly presses "Confirm & Print" on the Confirm screen (`userConfirmed == true`).
  2. The printer job completes without throwing an error (`printJob.await() == true`).
  3. The session ID has not been invalidated or restarted (`currentSessionId == sessionId`).
* **Never recognized during payment, countdown, capture, or photo selection.**

---

### 7.2 V2 Current State & Implementation Comparison

* **`RevenueRecognition.kt` (`backend/.../integrations/RevenueRecognition.kt:1–56`):**
  - Formally encodes the V1 boundary rules into a pure finite state gate:
    `val canRecognize = id.isNotBlank() && id == activeSessionId && id == confirmationSessionId && id == printSessionId && userConfirmed && !dryRun && printResult is PrintResult.Submitted`.
  - Journaling: Only provides `InMemoryRecognitionJournal` (no durable disk persistence).
* **`SharedApiClients.kt:RevenueClient` (`backend/.../integrations/SharedApiClients.kt:19–29`):**
  - Implements the HTTP REST route for `/api/v1/revenue/transactions`, `adjust`, `void`, and `summary`.
  - Neon direct JDBC route is **NOT implemented in V2**.
  - Local SQLite `sales.db` is **NOT implemented in V2**.

---

### 7.3 Dependencies & Gaps

* **JVM Libraries Required in `backend/build.gradle.kts`:**
  - `org.xerial:sqlite-jdbc:3.45.3.0` (for local offline sales ledger)
  - `org.postgresql:postgresql:42.7.2` (for direct Neon database connection)
* **Current Blockers:**
  1. Missing SQLite and PostgreSQL JDBC dependencies in V2 backend.
  2. `SalesRepository.kt` and `NeonDirectRevenueClient.kt` not ported to V2.
  3. `SimulatorSessionEngine` hardcodes `revenueRecorded: false`.

---

### 7.4 Verification Procedure
1. Create a local test SQLite DB and verify `recordSale` writes valid schema with `sync_status = 'PENDING'`.
2. Execute revenue recognition tests with varying printer failure / session cancellation states; confirm zero revenue recorded if print fails or is aborted.
3. Test idempotent resubmission with duplicate `external_session_id`.

---

## 8. Subsystem 6: Cloudinary, Album & QR Delivery

### 8.1 V1 Legacy Architecture & Code Audit

#### A. Parallel Cloudinary Upload (`DesktopCloudinaryClient.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/remote/DesktopCloudinaryClient.kt:19–98`
* **Upload Endpoint:** `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/${resourceType}/upload`.
* **Contract:** Unsigned multipart HTTP POST using `upload_preset: ${cloudinaryUploadPreset}`.
* **Automatic Delivery Optimization (Lines 64–70):**
  - Rewrites secure URL to insert Cloudinary auto-optimization flags:
    - Images: `f_auto,q_auto` (e.g. `/upload/f_auto,q_auto/v...`)
    - Videos: `f_auto,q_auto,vc_h264` (forces H.264 video compatibility on iOS/Android browsers).
* **Asset Metadata:** Extracts `asset_id`, `public_id`, `version`, `format`, `resource_type`, `width`, `height`, `bytes`.

#### B. 3-Step Web Album Lifecycle (`DesktopWebAlbumClient.kt`)
* **Relative Path:** `src/main/kotlin/com/phuctran/photobooth/desktop/remote/DesktopWebAlbumClient.kt:15–65`
* **Step 1 — Create Album:**
  - `POST /api/v1/albums`
  - Body: `{ externalSessionId, expectedAssets, expiresInDays }`
  - Header: `Authorization: Bearer <boothApiKey>`
  - Response: `{ albumId, albumUrl, accessToken, status, expiresAt }`
* **Step 2 — Finalize Assets:**
  - `POST /api/v1/albums/${albumId}/assets`
  - Body: metadata from Cloudinary (`kind: "ORIGINAL" | "FINAL" | "GIF"`, `position`, `assetId`, `publicId`, `width`, `height`, etc.).
  - **Sequential Ordering:** In `DesktopAlbumUploader.kt:96–101`, asset finalizations are executed **sequentially** in order of photo index to prevent race conditions in album storage.
* **Step 3 — Complete Album:**
  - `POST /api/v1/albums/${albumId}/complete`
  - Final customer URL: `${config.webAlbumBaseUrl}/album/${sessionId}`.

#### C. QR Code Watermark & Delivery View
* **Print QR Stamp (`DesktopCompositor.kt:106–108`):**
  - Generates QR barcode matrix using ZXing (`com.google.zxing:core:3.5.3`).
  - Stamps the web album URL QR code directly onto the printed canvas bottom corner (`drawQRCode(canvas, qrCodeUrl, width, height, ...)`).
* **Kiosk Screen QR View (`QrCodeView.kt:14–41`):**
  - Encodes the QR data into a 300x300 bitmap and displays it prominently on `DeliveryScreen` for guest smartphone scanning.

---

### 8.2 V2 Current State & Implementation Comparison

* **`CloudinaryClient.kt` (`backend/.../integrations/CloudinaryClient.kt:9–40`):**
  - Direct HTTP client with multipart formatting and `f_auto,q_auto` transformation.
  - Gated by `SafeTransport`.
* **`SharedApiClients.kt:WebAlbumClient` (`backend/.../integrations/SharedApiClients.kt:32–47`):**
  - Implements `createAlbum`, `finalizeAsset`, `completeAlbum`.
* **Gaps:** Neither client is wired to the session lifecycle; ZXing barcode generation is missing in V2 backend.

---

### 8.3 Dependencies & Gaps

* **JVM Libraries Required in `backend/build.gradle.kts`:**
  - `com.google.zxing:core:3.5.3` (for QR code matrix generation)
* **Configuration Required:**
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`, `WEB_ALBUM_BASE_URL`, `BOOTH_API_KEY`.
* **Current Blockers:**
  1. ZXing dependency missing from V2 backend.
  2. QR drawing logic not included in `SimulatorCompositor.kt`.
  3. No delivery coordinator in V2 backend to orchestrate parallel Cloudinary upload + sequential album finalization.

---

### 8.4 Verification Procedure
1. Configure staging Cloudinary and Web Album test endpoints.
2. Ingest sample 4-photo session, trigger uploader test harness:
   - Verify 4 original JPEGs + 1 final composite PNG uploaded to Cloudinary.
   - Verify responsive URL contains `f_auto,q_auto`.
   - Verify album created and finalized in correct sequence.
   - Decode generated QR bitmap using ZXing reader and confirm URL matches `https://.../album/<sessionId>`.

---

## 9. Next Engineering Actions

### 9.1 Milestone 2: Real Camera Pipeline Execution Plan

1. **Gradle Dependencies (`backend/build.gradle.kts`):**
   - Add `implementation("net.java.dev.jna:jna:5.14.0")` and `implementation("net.java.dev.jna:jna-platform:5.14.0")`.
   - Add `implementation("com.github.sarxos:webcam-capture:0.3.12")`.
2. **Native DLL Assets:**
   - Copy Canon 64-bit DLLs (`EDSDK.dll`, `EdsImage.dll`) from V1 `EDSDK_64/` to `backend/app-resources/windows/EDSDK_64/`.
3. **Canon Wrapper Source Migration:**
   - Port `edsdk` package sources (`CanonCamera.java`, `BaseCanonCamera.java`, `CanonUtils.java`, `SafeShootCommand.java`) into `backend/src/main/java/edsdk/`.
   - Ensure the STA Windows message pump loop (`PeekMessage`/`DispatchMessage`) and sequential command queue are active.
   - Verify Servo AF preservation patch in `SafeShootCommand.java`.
4. **Camera Service & State Machine Integration:**
   - Implement `RealCanonCaptureService` in V2 with the 2000 ms auto-reconnect loop and live view ~30 fps frame pumping.
   - Add IPC camera methods:
     - `camera.setSettings(iso, aperture, shutter)`
     - `camera.getSettings()`
     - `camera.startLiveView()`
     - `camera.stopLiveView()`
5. **Fallback Implementations:**
   - Wire Sarxos webcam port for hardware setups without Canon DSLR.
   - Wire Hot Folder watcher for Sony wireless setups.

---

### 9.2 Milestone 3: Real Image Processing Pipeline Execution Plan

1. **Gradle Dependencies (`backend/build.gradle.kts`):**
   - Add `implementation("com.microsoft.onnxruntime:onnxruntime:1.18.0")`.
   - Add `implementation("com.google.zxing:core:3.5.3")`.
2. **Model Weights Migration:**
   - Copy `face_detection_yunet_2023mar.onnx` and `bisenet_face_parsing.onnx` from V1 `app-resources/models/` to `backend/app-resources/models/`.
3. **Computer Vision & Beauty Porting:**
   - Port `GuidedLuminanceFilter.kt`, `BeautyColorMath.kt`, `PixelSafeCompositor.kt`, and `BeautyProcessor.kt`.
   - Port `LetterboxTransform.kt`, `YuNetFaceDetector.kt`, `FaceAlignment.kt`, `OnnxFaceParsingService.kt`, `CustomerFaceSelector.kt`, and `FaceOvalMaskBuilder.kt`.
   - Implement `RealBeautyService` with fail-safe fallback to unmodified source images on any error.
4. **Compositor & 3D LUT Porting:**
   - Port `CubeLutParser.kt` and `Lut3D.kt` for Adobe 3D LUT grading.
   - Upgrade `SimulatorCompositor` to `RealCompositor`:
     - Render at 600 DPI (`renderScale = 2`).
     - Build 2-up composite for 5x15 cm strips (`paperWidth = 2452`, `paperHeight = 3658`, `gap = 4`).
     - Embed dynamic QR watermark using ZXing on printed sheet.
5. **Background Processing Coordination:**
   - Wire asynchronous background execution: while customer is picking frames on UI, the backend runs YuNet/BiSeNet beauty processing and LUT rendering concurrently.
