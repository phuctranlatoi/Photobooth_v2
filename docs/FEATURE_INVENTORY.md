# Feature Inventory (Photobooth V1)

This document contains an exhaustive inventory of all functional features discovered in the legacy V1 codebase (`E:\HK1_2026_2027\PhotoboothDesktop`), categorized by domain. Each entry includes its relative file path, primary symbols/classes, inputs/outputs, operational stage, and strict evidence classification.

---

## 1. System Boot, Packaging & Lifecycle

| Feature | V1 Relative Path | Class / Symbol | Expected Inputs & Outputs | Lifecycle Stage | Evidence Tag |
|---|---|---|---|---|---|
| Compose Window Bootstrap | `src/main/kotlin/.../Main.kt` | `fun main()` | In: None. Out: Fullscreen Compose Desktop Window. | Application Boot | **Observed in code** |
| Runtime Path Resolution | `src/main/kotlin/.../config/DesktopAppPaths.kt` | `object DesktopAppPaths` | In: OS environment. Out: AppData path (`%LOCALAPPDATA%/LeSouvenirDesktop`). | Application Boot | **Observed in code** |
| Hierarchical Config Loader | `src/main/kotlin/.../config/DesktopBoothConfig.kt` | `object DesktopConfigLoader` | In: `appDataDir`, `.env` files. Out: `DesktopBoothConfig` data instance. | Application Boot / Settings | **Observed in code** |
| Compose Native MSI Packaging | `build.gradle.kts` | `compose.desktop.nativeDistributions` | In: Gradle build tasks. Out: Native MSI/Portable Windows packages. | Build & Distribution | **Observed in code** |
| Native EDSDK DLL Bundling | `app-resources/windows/EDSDK_64/` | `EDSDK.dll`, `EdsImage.dll` | In: JNA native call. Out: C-level native Canon SDK execution. | Runtime Native Execution | **Observed in code** |
| Service Disposal Hook | `src/main/kotlin/.../Main.kt` | `DisposableEffect(Unit)` | In: App close event. Out: Invokes `controller.close()`. | Application Shutdown | **Observed in code** |

---

## 2. Customer Journey & Session Experience

| Feature | V1 Relative Path | Class / Symbol | Expected Inputs & Outputs | Lifecycle Stage | Evidence Tag |
|---|---|---|---|---|---|
| Kiosk Welcome & Start | `src/main/kotlin/.../ui/screens/StartScreen.kt` | `fun StartScreen()` | In: `layouts`, `specialFrames`. Out: `onStart()`, `onAdmin()`. | `IDLE` | **Observed in code** |
| Special Event Bundles | `src/main/kotlin/.../ui/screens/StartScreen.kt` | `SpecialEventItem()` | In: `groupedFrames`. Out: Filters layouts, selects bundle frame. | `IDLE` | **Observed in code** |
| Hidden Operator Entry | `src/main/kotlin/.../ui/screens/StartScreen.kt` | Title click counter (`tapCount >= 5`) | In: 5 rapid taps on "LE SOUVENIR". Out: Transitions to `ADMIN`. | `IDLE` | **Observed in code** |
| Studio Layout & Filter Mode | `src/main/kotlin/.../ui/screens/StudioModeScreen.kt` | `fun StudioModeScreen()` | In: `availableLayouts`, `effects`. Out: Selected layout & effect ID. | `SELECTING` | **Observed in code** |
| Print Quantity Selection | `src/main/kotlin/.../ui/screens/QuantityScreen.kt` | `fun QuantityScreen()` | In: `printSizeLabel`, `currentCopies`. Out: Updated copies, pricing snapshot. | `SELECTING_QUANTITY` | **Observed in code** |
| Even Quantity Enforcement | `src/main/kotlin/.../model/PricingCalculator.kt` | `fun sanitizeQuantity()` | In: `5x15` strip label, copy count. Out: Clamped even copy count (min 2, step 2). | `SELECTING_QUANTITY` | **Observed in code** |
| Payment Gateway Presentation | `src/main/kotlin/.../ui/screens/PaymentScreen.kt` | `fun PaymentScreen()` | In: `orderTotal`, `paymentQrData`. Out: QR render, cash override trigger. | `PAYMENT_PENDING` | **Observed in code** |
| Pre-Capture Breathing Screen | `src/main/kotlin/.../ui/screens/PrepareScreen.kt` | `fun PrepareScreen()` | In: Selected layout/effect info. Out: 1.6s delay before camera ready. | `PREPARING` | **Observed in code** |
| Fullscreen Live View & Shutter | `src/main/kotlin/.../ui/screens/CaptureScreen.kt` | `fun CaptureScreen()` | In: `liveViewStream`, `countdown`. Out: Shutter trigger / automated countdown. | `LIVE_VIEW`, `COUNTDOWN`, `CAPTURING` | **Observed in code** |
| Live View Horizontal Mirroring | `src/main/kotlin/.../imaging/DesktopImageProcessor.kt` | `saveBoothCapture()` | In: Input frame. Out: Horizontally flipped RGB image (`scale(-1.0, 1.0)`). | Live View & Capture | **Observed in code** |
| Multi-Photo Review & Selection | `src/main/kotlin/.../ui/screens/SelectPhotosScreen.kt` | `fun SelectPhotosScreen()` | In: `capturedMoments`, `layout.selectCount`. Out: `selectedMoments`. | `SELECTING_PHOTOS` | **Observed in code** |
| Frame Overlay Selection | `src/main/kotlin/.../ui/screens/FrameScreen.kt` | `fun FrameScreen()` | In: `availableFrames`. Out: `selectedFrame`. | `EDITING` | **Observed in code** |
| Custom Frame Upload | `src/main/kotlin/.../ui/screens/FrameScreen.kt` | Custom PNG chooser | In: Local PNG file path. Out: Persisted custom frame pack in `data/frames/`. | `EDITING` | **Observed in code** |
| Final Order Checklist | `src/main/kotlin/.../ui/screens/ConfirmScreen.kt` | `fun ConfirmScreen()` | In: Print preview, copy count, pricing. Out: User confirmation to print. | `PRINT_PENDING` | **Observed in code** |
| Print & Process Status Screen | `src/main/kotlin/.../ui/screens/PrintingScreen.kt` | `fun PrintingScreen()` | In: Backend pipeline status. Out: Dispatches async render, print & upload. | `PRINTING` | **Observed in code** |
| Output & Album Delivery Screen | `src/main/kotlin/.../ui/screens/DeliveryScreen.kt` | `fun DeliveryScreen()` | In: `exportSummary`, QR url. Out: Guest scans QR, resets session. | `DELIVERY` | **Observed in code** |
| Customer Inactivity Watchdog | `src/main/kotlin/.../controller/DesktopBoothController.kt` | `fun startInactivityTimer()` | In: Configured timeout seconds. Out: Auto-selects photos, auto-prints without revenue. | `SELECTING_PHOTOS`, `EDITING` | **Observed in code** |

---

## 3. Camera & Live View Hardware Subsystem

| Feature | V1 Relative Path | Class / Symbol | Expected Inputs & Outputs | Lifecycle Stage | Evidence Tag |
|---|---|---|---|---|---|
| Native Canon Session Init | `src/main/kotlin/.../services/NativeEosCaptureService.kt` | `CanonCamera.openSession()` | In: USB camera attached. Out: `Boolean` connection status. | Hardware Boot | **Observed in code** |
| Camera Heartbeat & Auto-Reconnect | `src/main/kotlin/.../services/NativeEosCaptureService.kt` | `startAutoReconnectLoop()` | In: Coroutine timer (2s). Out: Polls `camera.apertureValue`, restarts session if dead. | Hardware Daemon | **Observed in code** |
| Native EVF Live View Stream | `src/main/kotlin/.../services/NativeEosCaptureService.kt` | `camera.downloadLiveView()` | In: EVF buffer. Out: Processed `BufferedImage` emitted at ~30 fps. | `LIVE_VIEW`, `COUNTDOWN` | **Observed in code** |
| Face Tracking Auto-Focus Set | `src/main/kotlin/.../services/NativeEosCaptureService.kt` | `kEdsPropID_Evf_AFMode` | In: Value `2L`. Out: Activates Face Detection AF on EOS body. | Live View Start | **Observed in code** |
| Safe Take Picture Trigger | `src/main/java/edsdk/api/commands/SafeShootCommand.java` | `SafeShootCommand.run()` | In: `kEdsSaveTo_Host`, retry count 3. Out: JPEG downloaded to host without crashing AF. | `CAPTURING` | **Observed in code** |
| Camera Exposure Controls | `src/main/kotlin/.../services/NativeEosCaptureService.kt` | `setIso()`, `setAperture()`, `setShutterSpeed()` | In: Enum descriptions. Out: Changes EDSDK camera exposure settings. | Admin Settings | **Observed in code** |
| Hot Folder Bluetooth Clicker | `src/main/kotlin/.../services/HotFolderCaptureService.kt` | `HotFolderCaptureService` | In: Directory watcher with 15s timeout. Out: Captured JPEG from Sony camera. | `CAPTURING` | **Observed in code** |
| Sarxos Webcam Fallback | `src/main/kotlin/.../services/WebcamStillCaptureService.kt` | `WebcamStillCaptureService` | In: DirectShow webcam feed. Out: 16:9 center-cropped `BufferedImage`. | `LIVE_VIEW`, `CAPTURING` | **Observed in code** |
| EOS Utility Window Scraper | `src/main/kotlin/.../services/EosUtilityCaptureService.kt` | `EosUtilityCaptureService` | In: Window handle of `EOS Utility 3.exe`. Out: Screen capture buffer. | `LIVE_VIEW` Fallback | **Observed in code** |
| External CLI Camera Trigger | `src/main/kotlin/.../services/CliCaptureService.kt` | `CliCaptureService` | In: `cliCaptureCommand`. Out: Executes external `.exe` to write JPEG. | `CAPTURING` Fallback | **Observed in code** |

---

## 4. Image Processing, AI Beauty & Video Compilation

| Feature | V1 Relative Path | Class / Symbol | Expected Inputs & Outputs | Lifecycle Stage | Evidence Tag |
|---|---|---|---|---|---|
| Real-time Color Matrix Filter | `src/main/kotlin/.../model/BoothModels.kt` | `EffectMode.toComposeColorMatrix()` | In: Contrast, brightness, saturation, warmth, tint. Out: 5x4 Compose ColorMatrix. | Live View UI | **Observed in code** |
| CPU Pixel Filter Implementation | `src/main/kotlin/.../imaging/DesktopImageProcessor.kt` | `applyEffect()` | In: `BufferedImage`, `EffectMode`. Out: Filtered `BufferedImage`. | Capture & Live View | **Observed in code** |
| 3D Cube LUT Parsing | `src/main/kotlin/.../imaging/lut/CubeLutParser.kt` | `CubeLutParser.parse()` | In: `.cube` LUT file path. Out: `Lut3D` data structure with 3D table. | Filter Init | **Observed in code** |
| 3D LUT Trilinear Interpolation | `src/main/kotlin/.../imaging/lut/Lut3D.kt` | `Lut3D.apply()` | In: Input image, intensity float. Out: Color-transformed image via trilinear interpolation. | Image Processing | **Observed in code** |
| YuNet Face Detection ONNX | `src/main/kotlin/.../facemask/YuNetFaceDetector.kt` | `YuNetFaceDetector.detectAll()` | In: `BufferedImage`. Out: List of detected faces with 5-point landmarks. | AI Beauty Pipeline | **Observed in code** |
| Installed YuNet Model Weight | `app-resources/models/face_detection_yunet_2023mar.onnx` | Model file | Model input: [1, 3, H, W]. Output: Bounding boxes & landmarks. | AI Beauty Pipeline | **Observed in code** |
| Customer Face Classification | `src/main/kotlin/.../facemask/CustomerFaceSelector.kt` | `CustomerFaceSelector.classify()` | In: Image dimensions, detected faces. Out: Faces labeled `FOREGROUND_CUSTOMER` or `BACKGROUND`. | AI Beauty Pipeline | **Observed in code** |
| Face Affine Alignment | `src/main/kotlin/.../facemask/FaceAlignment.kt` | `FaceAlignment.crop()` | In: Landmarks, target size (512x512). Out: Aligned upright face crop. | AI Beauty Pipeline | **Observed in code** |
| BiSeNet Face Parsing ONNX | `src/main/kotlin/.../facemask/OnnxFaceParsingService.kt` | `OnnxFaceParsingService.parse()` | In: 512x512 face crop. Out: 19-class semantic segmentation map. | AI Beauty Pipeline | **Observed in code** |
| Installed BiSeNet Model Weight | `app-resources/models/bisenet_face_parsing.onnx` | Model file | Model input: [1, 3, 512, 512]. Output: Semantic segmentation logits. | AI Beauty Pipeline | **Observed in code** |
| SCRFD 500M Model Weight | `app-resources/models/scrfd_500m.onnx` | Model file | Present in repo but only referenced by evaluation scripts. Not wired in app. | Offline Research | **Observed in code** |
| Guided Luminance Skin Smoothing | `src/main/kotlin/.../beauty/GuidedLuminanceFilter.kt` | `GuidedLuminanceFilter.filter()` | In: Input face crop, guide, radius, eps. Out: Edge-preserved smoothed skin. | AI Beauty Pipeline | **Observed in code** |
| Beauty Presets Configuration | `src/main/kotlin/.../beauty/BeautyConfig.kt` | `enum class BeautyPreset` | `NATURAL`, `STUDIO`, `BRIGHT`, `STRONG` parameters. | AI Beauty Pipeline | **Observed in code** |
| Fail-Safe Beauty Fallback | `src/main/kotlin/.../services/DesktopBeautyService.kt` | `processCapture()` catch block | In: Any exception or timeout. Out: Silently returns original source image. | AI Beauty Pipeline | **Observed in code** |
| Countdown Video Frame Recording | `src/main/kotlin/.../controller/DesktopBoothController.kt` | Lines 467–498 | In: Live view frames during countdown. Out: JPEG frame buffer at 24 fps. | `COUNTDOWN` | **Observed in code** |
| Background FFmpeg Video Encode | `src/main/kotlin/.../controller/DesktopBoothController.kt` | `encodeVideo()` | In: Captured JPEG frames. Out: H.264 MP4 clip via external `ffmpeg.exe`. | `CAPTURING` Background | **Observed in code** |
| Master Video Grid Compilation | `src/main/kotlin/.../imaging/DesktopVideoCompositor.kt` | `createCompositeVideo()` | In: Per-shot MP4 clips, layout slots. Out: Multi-panel boomerang/composite MP4. | `DELIVERY` Background | **Observed in code** |

---

## 5. Print Composition & DNP Hardware Integration

| Feature | V1 Relative Path | Class / Symbol | Expected Inputs & Outputs | Lifecycle Stage | Evidence Tag |
|---|---|---|---|---|---|
| 600 DPI Master Print Composition | `src/main/kotlin/.../imaging/DesktopCompositor.kt` | `renderFinal()` | In: Layout, frame, selected photos. Out: 600 DPI `finalImagePath` (clean) and `printImagePath`. | `PRINTING` | **Observed in code** |
| Dynamic Slot Aspect Crop | `src/main/kotlin/.../imaging/DesktopCompositor.kt` | `computeSlots()` | In: Layout slots or mathematical grid. Out: Scaled rectangle coordinates with 2px bleed. | `PRINTING` | **Observed in code** |
| 5×15 Double-Strip Duplication | `src/main/kotlin/.../imaging/DesktopCompositor.kt` | Lines 110–138 | In: Single strip (1184x3580 px). Out: Duplicated 2-up on 2452x3658 px canvas with 4px gap. | `PRINTING` | **Observed in code** |
| 2-Inch Cut Sheet Halving | `src/main/kotlin/.../controller/DesktopBoothController.kt` | Lines 764–766 | In: Requested copies (e.g. 2). Out: Actual sheets = `copies / 2` (1 sheet = 2 strips). | `PRINTING` | **Observed in code** |
| Java Print Service Spooling | `src/main/kotlin/.../services/DesktopIoServices.kt` | `SystemPrinterService.printImage()` | In: `printImagePath`, sheets, printer name. Out: Dispatched to Windows Print Spooler. | `PRINTING` | **Observed in code** |
| Borderless Page Formatting | `src/main/kotlin/.../services/DesktopIoServices.kt` | `paper.setImageableArea()` | In: `paper.width`, `paper.height`. Out: Zero-margin borderless printable area. | `PRINTING` | **Observed in code** |
| Orientation Mismatch Correction | `src/main/kotlin/.../services/DesktopIoServices.kt` | Graphics rotation 90° | In: Landscape image on Portrait paper or vice versa. Out: Rotated 90° to fit. | `PRINTING` | **Observed in code** |
| QR Code Embedding on Print | `src/main/kotlin/.../imaging/DesktopCompositor.kt` | `drawQRCode()` | In: Web album URL, layout/frame QR config. Out: Stamped QR on `printImagePath` (clean on master). | `PRINTING` | **Observed in code** |

---

## 6. Business Rules, Payments & Accounting

| Feature | V1 Relative Path | Class / Symbol | Expected Inputs & Outputs | Lifecycle Stage | Evidence Tag |
|---|---|---|---|---|---|
| Pricing Model Calculation | `src/main/kotlin/.../model/PricingCalculator.kt` | `PricingCalculator.calculatePrice()` | In: Print size (`5x15` or `10x15`), copy count. Out: `PricingSnapshot` (base, extra, total). | `SELECTING_QUANTITY` | **Observed in code** |
| PayOS Payment Link Creation | `src/main/kotlin/.../services/PaymentService.kt` | `createPaymentLink()` | In: Order code, amount. Out: VietQR code payload string. | `PAYMENT_PENDING` | **Observed in code** |
| PayOS Payment Status Polling | `src/main/kotlin/.../services/PaymentService.kt` | `checkPaymentStatus()` | In: Order code. Out: `Boolean` (true when `PAID`). Polled every 3000ms. | `PAYMENT_PENDING` | **Observed in code** |
| Cash / Staff Payment Override | `src/main/kotlin/.../controller/DesktopBoothController.kt` | `completePayment("Tiền mặt")` | In: Staff click / PIN. Out: Cancels polling, sets payment method to cash, advances. | `PAYMENT_PENDING` | **Observed in code** |
| Transactional Revenue Gate | `src/main/kotlin/.../controller/DesktopBoothController.kt` | Lines 842–852 | In: `userConfirmed`, `printJob.await()`. Out: Records revenue ONLY if confirmed and print queued. | `PRINTING` | **Observed in code** |
| Zero Revenue on Auto-Print | `src/main/kotlin/.../controller/DesktopBoothController.kt` | `handleInactivityTimeout()` | In: Timeout triggered. Out: `startPrinting(userConfirmed = false)` -> No sale recorded. | Timeout Recovery | **Observed in code** |
| Zero Revenue on Cancel | `src/main/kotlin/.../controller/DesktopBoothController.kt` | `resetSession()` | In: Session cancel / exit. Out: Clears `currentSessionId`, freezes state -> No sale recorded. | Cancellation | **Observed in code** |
| Local SQLite Sales Ledger | `src/main/kotlin/.../data/SalesRepository.kt` | `recordSale()` | In: `SaleTransaction`. Out: Row inserted into `sales.db` with `sync_status = 'PENDING'`. | Revenue Recording | **Observed in code** |
| Neon Remote Revenue Sync | `src/main/kotlin/.../remote/NeonDirectRevenueClient.kt` | `recordTransaction()` | In: `SaleTransaction`. Out: Inserted into Neon PostgreSQL `revenue_transactions` table. | Async Revenue Sync | **Observed in code** |
| Transaction Adjustment & Void | `src/main/kotlin/.../data/SalesRepository.kt` | `adjustTransaction()`, `voidTransaction()` | In: `sessionId`, reason, actual quantity. Out: Updates local SQLite and remote PostgreSQL. | Admin Revenue | **Observed in code** |

---

## 7. Cloud Web Album & Remote Sync

| Feature | V1 Relative Path | Class / Symbol | Expected Inputs & Outputs | Lifecycle Stage | Evidence Tag |
|---|---|---|---|---|---|
| Pre-Creation of Cloud Album | `src/main/kotlin/.../remote/DesktopWebAlbumClient.kt` | `createAlbum()` | In: `externalSessionId`, expected assets. Out: `albumId`, `albumUrl` (for QR before print). | `PRINTING` Phase 1 | **Observed in code** |
| Parallel Cloudinary Upload | `src/main/kotlin/.../remote/DesktopCloudinaryClient.kt` | `uploadAssetToCloudinary()` | In: Original JPEGs, clean master image. Out: Cloudinary secure URLs. | `PRINTING` Phase 2 | **Observed in code** |
| Sequential Asset Finalization | `src/main/kotlin/.../services/DesktopAlbumUploader.kt` | Lines 95–101 | In: Uploaded asset references. Out: Calls `/api/albums/{id}/assets` sequentially to avoid races. | `PRINTING` Phase 3 | **Observed in code** |
| Local HTTP File Server Fallback | `src/main/kotlin/.../services/LocalFileServer.kt` | `LocalFileServer.start()` | In: Embedded Sun HttpServer on port 8080. Out: Direct download URL if internet offline. | Offline Fallback | **Observed in code** |
| Firestore Dynamic Layout Sync | `src/main/kotlin/.../remote/FirebaseManager.kt` | `fetchLayouts()` | In: Firestore `/layouts` collection. Out: List of `LayoutMode` definitions. | Application Boot / Refresh | **Observed in code** |
| Default Offline Layout Fallback | `src/main/kotlin/.../model/BoothModels.kt` | `DefaultLayoutModes` | In: Network timeout / Firebase failure. Out: Hardcoded fallback 10x15 single layout. | Offline Fallback | **Observed in code** |

---

## 8. Operator & Admin Tools

| Feature | V1 Relative Path | Class / Symbol | Expected Inputs & Outputs | Lifecycle Stage | Evidence Tag |
|---|---|---|---|---|---|
| Custom Frame Management | `src/main/kotlin/.../ui/screens/AdminScreen.kt` | Tab 0: Khung | In: Local frame storage. Out: List, filter by size, delete custom frame PNGs. | Operator Mode | **Observed in code** |
| Per-Layout Config Editor | `src/main/kotlin/.../ui/screens/AdminScreen.kt` | Tab 1: Bố cục (`LayoutEditDialog`) | In: `basePrice`, `shotCount`, `countdownSeconds`. Out: Updates Firestore layout config. | Operator Mode | **Observed in code** |
| Hardware & Timeout Settings | `src/main/kotlin/.../ui/screens/SettingsTabContent.kt` | Tab 2: Cài đặt | In: Native camera params, printer switch, timeouts. Out: Saves updates to `.env`. | Operator Mode | **Observed in code** |
| Slot Detection Engine Tool | `src/main/kotlin/.../engine/SlotDetectionEngine.kt` | Tab 3: Công cụ (`CalculatorApp`) | In: Frame PNG template with transparency. Out: Detected slot bounding boxes. | Diagnostic Tool | **Observed in code** |
| Filter & LUT Admin Studio | `src/main/kotlin/.../ui/screens/FilterAdminView.kt` | Tab 4: Màu ảnh | In: `.cube` files, RGB sliders, test image. Out: Real-time visual preview and save. | Operator Mode | **Observed in code** |
| Revenue Dashboard & Ledger | `src/main/kotlin/.../ui/screens/RevenueScreen.kt` | Tab 5: Doanh thu | In: `SalesRepository`, `startTime`, `endTime`. Out: Revenue graphs, summary, adjust/void tools. | Operator Mode | **Observed in code** |

---

*Summary of Evidence: All entries are tagged **Observed in code** through direct symbolic grep and line-by-line verification in the V1 source repository.*
