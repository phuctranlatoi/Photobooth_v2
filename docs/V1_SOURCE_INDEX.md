# V1 Source Index — Le Souvenir Photobooth Desktop

> Complete file-by-file inventory of `E:\HK1_2026_2027\PhotoboothDesktop`.
> V1 paths are relative to the V1 root. No V1 file was modified during this audit.

---

## Root Configuration Files

| File | Purpose |
|---|---|
| `build.gradle.kts` | Gradle build: Kotlin 1.9.24, Compose Desktop 1.6.11, JVM 17/21, all dependencies, native packaging config |
| `settings.gradle.kts` | Root project name `PhotoboothDesktop`, `google()` + `mavenCentral()` repos |
| `gradle.properties` | JVM args (2 GB heap, `--add-opens`), `org.gradle.java.home` → JDK 21 |
| `edsdk4j.jar` | Canon EDSDK Java wrapper (bitplan `com.bitplan:edsdk4j:0.0.1`) — primary artifact |
| `edsdk4j-sources.jar` | Sources jar for edsdk4j |
| `serviceAccountKey.json` | Firebase Admin SDK credentials — **DO NOT COPY TO V2** |
| `.env` | Local runtime configuration — **DO NOT READ OR COPY** |
| `.env.example` | Template for env vars (safe to reference) |
| `DESIGN.md` | Design documentation |
| `PRODUCT.md` | Product specification |
| `Photobooth.pdf` | Print visualizer reference document |
| `PrintVisualizer.html` | Browser-based print layout preview tool |
| `frame_template.png` / `base.png` | Reference frame templates |
| `build-portable.ps1` | Portable build script |
| `build-windows-installer.ps1` | Windows MSI installer build script |
| `check-desktop-readiness.ps1` | Pre-build readiness check |
| `test_capture.py` / `test_capture_3.py` | Python capture test scripts (hot-folder / CLI verification) |
| `test.mp4` | Sample test video |

---

## `EDSDK_64/` (V1 root level)

Native Canon EDSDK DLLs (64-bit Windows) — deployed to `app-resources/EDSDK_64/` for packaging.

---

## `edsdk/` (V1 root level)

Unpacked edsdk4j JAR source (for reference):
- `edsdk/api/CanonCamera.java`
- `edsdk/api/commands/SafeShootCommand.java`
- `edsdk/utils/CanonConstants.java`

---

## `frame/` (V1 root level)

Custom frame PNG assets (not part of the app runtime data; used by designer tools).

---

## `gettingstarted/`

Instructions for setting up the V1 development environment.

---

## `probe/`

Exploratory / diagnostic code (camera probes, EDSDK tests).

---

## `scripts/`

Helper scripts (build, deploy, etc.).

---

## `release/`

Packaged release artifacts (MSI, portable zip) — build outputs.

---

## `src/main/kotlin/com/phuctran/photobooth/desktop/`

### Root Package

| File | Class / Function | Lines |
|---|---|---|
| `Main.kt` | `fun main()` — Compose app entry, full-screen window, controller wiring, screen dispatch | 296 |
| `TestEosCapture.kt` | `fun main()` — standalone EDSDK capture test harness | n/a |

### `controller/`

| File | Class | Purpose |
|---|---|---|
| `DesktopBoothController.kt` | `DesktopBoothController` | Central controller: all state transitions, capture flow, print flow, album upload, payment polling, inactivity timers, settings persistence |

### `config/`

| File | Class | Purpose |
|---|---|---|
| `DesktopBoothConfig.kt` | `DesktopBoothConfig` + `DesktopConfigLoader` | All configuration fields; `.env` loading logic |
| `SettingsManager.kt` | `SettingsManager` | Updates keys in `.env` file (upsert semantics) |
| `DesktopAppPaths.kt` | `DesktopAppPaths` | Resolves `appDataDir` (portable vs. `%LOCALAPPDATA%`) and `workingDir` |

### `domain/`

| File | Class | Purpose |
|---|---|---|
| `SessionStateMachine.kt` | `SessionState` (17-state enum), `SessionStateMachine` | State container; no transition guards |

### `data/`

| File | Class | Purpose |
|---|---|---|
| `SalesRepository.kt` | `SalesRepository` | SQLite `sales` table: record, adjust, void, sync-pending |
| `SalesModels.kt` | `SaleTransaction`, `SalesSummary`, `DailyRevenuePoint`, `SizeBreakdown` | Data classes for revenue records |

### `engine/`

| File | Class | Purpose |
|---|---|---|
| `SlotDetectionEngine.kt` | `SlotDetectionEngine` | PNG frame slot detection: 4-pass (TRANSPARENT, DARK, LIGHT, UNIFORM_COLOR), rectangle fitting, background punching, QR slot identification |
| `PhotoCompositor.kt` | `PhotoCompositor` | Legacy compositor (predecessor to `DesktopCompositor`) |
| `FrameModels.kt` | `FrameSlot`, `DetectionResult`, `DetectionConfig` | Data classes for slot detection |
| `LayoutCalculatorTool.kt` | `CalculatorApp` + `main()` | Admin "Công cụ" tab: PNG analysis, layout save to Firebase, frame save, QR editor |
| `FrameEngineTest.kt` | `FrameEngineTestKt` | Standalone main for frame engine verification |
| `DebugMatches.kt` | `DebugMatchesKt` | Debug output tool |
| `DebugDetect.kt` | `DebugDetectKt` | Debug detection tool |

### `facemask/`

| File | Class | Purpose |
|---|---|---|
| `YuNetFaceDetector.kt` | `YuNetFaceDetector` | ONNX YuNet face detection (640×640, threshold 0.85, NMS 0.30) |
| `OnnxFaceParsingService.kt` | `OnnxFaceParsingService` | ONNX BiSeNet 19-class face parsing (512/640/768) |
| `ModelPathResolver.kt` | `ModelPathResolver` | Resolves `.onnx` model files from packaged or local `app-resources` |
| `LetterboxTransform.kt` | `LetterboxTransform` | Letterbox resize + coordinate mapping for YuNet input |
| `FastGuidedMaskFilter.kt` | `FastGuidedMaskFilter` | Box-guided filter for mask feathering |
| `FaceOvalMaskBuilder.kt` | `FaceOvalMaskBuilder` | Semantic mask builder: geometry oval, protected zones, geodesic growth, guided filter, projection |
| `FaceDetectionModels.kt` | `FaceDetector` interface, `DetectedFace`, `FaceBounds`, `FaceLandmarks` | Shared face-detection data types |
| `FaceAlignment.kt` | `FaceAlignment` | Affine alignment of face crop for BiSeNet input |
| `CustomerFaceSelector.kt` | `CustomerFaceSelector`, `FaceRole`, `ClassifiedFace` | Classifies detected faces into FOREGROUND_CUSTOMER / BACKGROUND_BYSTANDER / REJECTED |

### `imaging/`

| File | Class | Purpose |
|---|---|---|
| `DesktopCompositor.kt` | `DesktopCompositor` | Final print rendering: canvas, slots, photo placement, frame overlay, QR, strip/15×10 print file generation |
| `DesktopVideoCompositor.kt` | `DesktopVideoCompositor` | FFmpeg master video composition (selected shots + frame overlay) |
| `DesktopImageProcessor.kt` | `DesktopImageProcessor` | Post-capture processing: LUT/ColorMatrix effect, horizontal mirror, JPEG save, `ensureJpeg` |

### `imaging/lut/`

| File | Class | Purpose |
|---|---|---|
| `Lut3D.kt` | `Lut3D` | Trilinear 3D LUT application with intensity blending |
| `CubeLutParser.kt` | `CubeLutParser` | `.cube` file parser (LUT_3D_SIZE 2–65, DOMAIN_MIN/MAX, row data) |

### `model/`

| File | Class | Purpose |
|---|---|---|
| `BoothModels.kt` | `LayoutMode`, `EffectMode`, `FramePack`, `CapturedMoment`, `ExportSummary`, `BoothSession`, `LayoutSlot`, `RenderResult`, `DefaultLayoutModes`, `DefaultEffectModes`, `DefaultFramePacks` | All domain data classes + defaults |
| `PricingCalculator.kt` | `PricingCalculator`, `PricingSnapshot` | Price calculation (strip vs. full), quantity sanitization |

### `remote/`

| File | Class | Purpose |
|---|---|---|
| `FirebaseManager.kt` | `FirebaseManager` | Firebase Admin SDK: Firestore `layouts` + `frames` collections; Storage bucket `photop-bf902.appspot.com` |
| `DesktopCloudinaryClient.kt` | `DesktopCloudinaryClient` | Cloudinary REST upload (image + video), URL transform injection |
| `DesktopWebAlbumClient.kt` | `DesktopWebAlbumClient` | Web album API: create, finalize asset, complete |
| `RemoteModels.kt` | `CreateAlbumRequest`, `CreateAlbumResponse`, `FinalizeAssetRequest`, `UploadedCloudAsset`, `AlbumUploadResult` | Album API data classes |
| `SimpleJson.kt` | `SimpleJson` | Minimal JSON builder/parser (no dependency) |
| `DesktopRevenueClient.kt` | `DesktopRevenueClient` | Revenue API client (HTTP fallback + Neon JDBC delegation) |
| `NeonDirectRevenueClient.kt` | `NeonDirectRevenueClient` | Direct JDBC to Neon Postgres `revenue_transactions` table |

### `services/`

| File | Class | Purpose |
|---|---|---|
| `WebcamStillCaptureService.kt` | `StillCaptureService` interface + `WebcamStillCaptureService` | DroidCam / USB webcam capture; center-crop to 16:9 |
| `NativeEosCaptureService.kt` | `NativeEosCaptureService` | Canon EDSDK: live view, capture, reconnect, exposure controls |
| `HotFolderCaptureService.kt` | `HotFolderCaptureService` | Polls hot folder for new JPEG (15 s timeout, no trigger) |
| `CliCaptureService.kt` | `CliCaptureService` | CLI capture (`CameraControlCmd.exe`); live view via window capture |
| `EosUtilityCaptureService.kt` | `EosUtilityCaptureService` | EOS Utility 3 integration (Space-key trigger + hot folder); legacy, not selected by controller |
| `WindowCaptureHelper.kt` | `WindowCaptureHelper` | JNA-based Windows window capture (`PrintWindow`); `sendSpaceToWindow()` |
| `DesktopIoServices.kt` | `SystemPrinterService`, `LocalOnlyAlbumUploadService`, `PrinterService`, `CameraService`, `AlbumUploadService` interfaces | Java `PrinterJob` printing; borderless paper setup |
| `PaymentService.kt` | `PaymentService` | PayOS SDK: create payment link, poll status |
| `DesktopAlbumUploader.kt` | `DesktopAlbumUploader` | Orchestrate: ensureJpeg → Cloudinary upload (parallel) → create album → finalize assets (sequential) → video upload |
| `DesktopBeautyService.kt` | `DesktopBeautyService` | Lazy YuNet + BiSeNet pipeline; thread-safe; writes beauty PNG derivatives |
| `LocalFileServer.kt` | `LocalFileServer` | `com.sun.net.httpserver.HttpServer` on 0.0.0.0; serves `data/output/` |

### `storage/`

| File | Class | Purpose |
|---|---|---|
| `FrameStore.kt` | `FrameStore` | Filesystem frame store: `data/frames/<size>/<layout>/<Standard|Special>/<event>/`; JSON QR config; event cover images |
| `DesktopSessionStore.kt` | `DesktopSessionStore` | Appends JSONL session records to `data/sessions/sessions.jsonl` |

### `beauty/`

| File | Class | Purpose |
|---|---|---|
| `BeautyConfig.kt` | `BeautyPreset` (NATURAL/STUDIO/BRIGHT/STRONG), `BeautyConfig` | Preset values + 0–100 range validation |
| `BeautyProcessor.kt` | `BeautyProcessor` | YCbCr-based smoothing/whitening/rosy filter; fallback to original on any error |
| `BeautyResult.kt` | `BeautyResult` | Output data class (image, status, latencyMs, diagnostics) |
| `BeautyColorMath.kt` | `BeautyColorMath` | RGB ↔ YCbCr conversion |
| `GuidedLuminanceFilter.kt` | `GuidedLuminanceFilter` | Box-guided filter (radius ≈ 1.2% of image, epsilon 0.002) |
| `PixelSafeCompositor.kt` | `PixelSafeCompositor` | Alpha blending of beauty result; outside-mask diff diagnostic |

### `ui/theme/`

| File | Class | Purpose |
|---|---|---|
| `Theme.kt` | `PhotoboothTheme` | Compose Material theme: colors, typography |
| `DesignTokens.kt` | `KioskSpacing`, `KioskControlTokens`, `AdminTokens` | Spacing / corner-radius / press-scale tokens |

### `ui/components/`

| File | Composables | Purpose |
|---|---|---|
| `CoreComponents.kt` | `KioskPrimaryButton`, `KioskBackButton`, `BottomActionBar`, `OutputRow`, `InfoPill`, `SectionHeader`, `rememberImageBitmap`, `formatVnd`, `AdminStatusPill` | Shared UI primitives |
| `KioskTouchInteractions.kt` | `kioskHorizontalDrag`, `kioskPagerDrag` | Touch-drag extensions for HorizontalPager and scroll states |
| `PrintPreview.kt` | `PrintPreview` | Live layout preview with photo slots (used in ConfirmScreen, StudioModeScreen, QuantityScreen) |
| `QrCodeView.kt` | `QrCodeView` | ZXing QR code rendering (300 px default) |
| `Shell.kt` | `AppShell`, `CompactLocalHeader`, `StatusBar` | Root shell wrapper; conditional backgrounds per session state |

### `ui/screens/`

| File | Composable | `SessionState` |
|---|---|---|
| `StartScreen.kt` | `StartScreen`, `SpecialEventItem`, `LayoutSelectionCard`, `SpecialBundleItem`, `PhotostripGraphic`, `FeatureItem`, `LayoutThumbnail` | `IDLE` |
| `StudioModeScreen.kt` | `StudioModeScreen`, `StepIndicator`, `Step1Layout`, `Step2Effect`, `StudioLiveView`, `formatEffectDisplayName` | `SELECTING` |
| `QuantityScreen.kt` | `QuantityScreen`, `QuantityStepButton` | `SELECTING_QUANTITY` |
| `PaymentScreen.kt` | `PaymentScreen` (staff long-press panel) | `PAYMENT_PENDING` |
| `PrepareScreen.kt` | `PrepareScreen` | `PREPARING` |
| `CaptureScreen.kt` | `CaptureScreen`, `CaptureLiveView` | `LIVE_VIEW`, `COUNTDOWN`, `CAPTURING` |
| `SelectPhotosScreen.kt` | `SelectPhotosScreen` | `SELECTING_PHOTOS` |
| `FrameScreen.kt` | `FrameScreen` | `EDITING` |
| `ConfirmScreen.kt` | `ConfirmScreen`, `SummaryItem` | `PRINT_PENDING` |
| `PrintingScreen.kt` | `PrintingScreen` | `PRINTING` |
| `DeliveryScreen.kt` | `DeliveryScreen`, `DeliveryHeading`, `DeliveryQr`, `DeliveryDetails` | `DELIVERY` |
| `AdminScreen.kt` | `AdminScreen`, `NativeCameraParamDropdown`, `HardcodedCameraParamDropdown`, `FrameAdminCard`, `LayoutEditDialog`, `LayoutAdminCard`, `EventAdminCard`, `AdminStatusPill` | `ADMIN` |
| `SettingsTabContent.kt` | `SettingsTabContent`, `SettingsSection`, `StatusCard`, `InfoChip`, `CameraOption`, `TimeoutStepper`, `StepControl` | `ADMIN` (tab 2) |
| `RevenueScreen.kt` | `RevenueScreen` | `ADMIN` (tab 5) |
| `FilterAdminView.kt` | `FilterAdminView` | `ADMIN` (tab 4) |

### `utils/`

| File | Class | Purpose |
|---|---|---|
| `NetworkUtility.kt` | `NetworkUtility.getLocalIpAddress()` | Finds best LAN IPv4 (skips loopback, virtual adapters) |

---

## `src/test/kotlin/`

| File | Purpose |
|---|---|
| `RevenueAccountingTest.kt` | Revenue summary math |
| `PricingCalculatorTest.kt` | Price + quantity rules |
| `SalesRepositoryTest.kt` | SQLite CRUD + sync |
| `CubeLutTest.kt` | LUT parser + apply |
| `beauty/RealArchiveBeautyAuditTest.kt` | End-to-end beauty on real archive images |
| `beauty/Phase5RebuildDiagnosticTest.kt` | Beauty pipeline diagnostics |
| `beauty/BeautyProcessorTest.kt` | BeautyProcessor math |
| `beauty/BeautyPortraitDiagnosticTest.kt` | Portrait-specific beauty diagnostics |
| `beauty/BeautyMaskPipeline.kt` | Mask pipeline test utility |
| `beauty/BeautyDiagnosticWriter.kt` | Diagnostic file writer |
| `facemask/Phase42DiagnosticTest.kt` | YuNet detection diagnostics |
| `facemask/OfflineFaceDetector.kt` | YuNet offline model test |
| `facemask/LetterboxTransformTest.kt` | Letterbox math |
| `facemask/FaceMaskDiagnosticTest.kt` | Mask diagnostics |
| `facemask/CustomerFaceSelectorTest.kt` | Face role classification |
| `services/DesktopBeautyServiceTest.kt` | Full beauty service integration |

---

## `app-resources/` (packaged at build time)

| Path | Purpose |
|---|---|
| `app-resources/EDSDK_64/EDSDK.dll` | Canon EDSDK native DLL (64-bit Windows) |
| `app-resources/EDSDK_64/EdsImage.dll` | EDSDK image support DLL |
| `app-resources/windows/EDSDK_64/EDSDK.dll` | Windows-specific copy (dual location) |
| `app-resources/windows/EDSDK_64/EdsImage.dll` | Windows-specific copy |
| `app-resources/models/face_detection_yunet_2023mar.onnx` | YuNet face detection model |
| `app-resources/models/bisenet_face_parsing.onnx` | BiSeNet face parsing model |
| `app-resources/models/scrfd_500m.onnx` | SCRFD model (present but **not referenced** in V1 code) |
| `app-resources/models/THIRD_PARTY_NOTICES.md` | Model license notices |
| `app-resources/bin/main/edsdk/api/commands/SafeShootCommand.class` | Custom edsdk4j extension (bytecode) |

---

## `bin/` (V1 root)

| File | Purpose |
|---|---|
| `bin/ffmpeg.exe` | Local FFmpeg executable (used by video encoding if present; falls back to WinGet or system PATH) |

---

## `build/` (V1 root)

Gradle build cache and outputs. **Do not inspect or copy.**

---

## Complete `SessionState` → Screen Mapping

| State | Screen Composable |
|---|---|
| `IDLE` | `StartScreen` |
| `SELECTING` | `StudioModeScreen` |
| `SELECTING_QUANTITY` | `QuantityScreen` |
| `PAYMENT_PENDING` | `PaymentScreen` |
| `PREPARING` | `PrepareScreen` |
| `LIVE_VIEW` / `COUNTDOWN` / `CAPTURING` | `CaptureScreen` |
| `SELECTING_PHOTOS` | `SelectPhotosScreen` |
| `EDITING` | `FrameScreen` |
| `COMPOSING` | *(never assigned — declared only)* |
| `PRINT_PENDING` | `ConfirmScreen` |
| `PRINTING` | `PrintingScreen` |
| `DELIVERY` | `DeliveryScreen` |
| `RECOVERY` | *(never assigned — declared only)* |
| `OUT_OF_SERVICE` | *(never assigned — declared only)* |
| `ADMIN` | `AdminScreen` |
