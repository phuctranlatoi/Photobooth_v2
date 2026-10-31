# V1 Complete Feature Inventory

**Authority Sources (Read-only V1 Inspection):**
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\Main.kt` (Entry point)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\controller\DesktopBoothController.kt` (Core logic)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\*.kt` (All UI screens)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\domain\SessionStateMachine.kt` (State machine)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\config\*.kt` (Configuration)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\services\*.kt` (Hardware services)
- `E:\HK1_2026_2027\PhotoboothDesktop\build.gradle.kts` (Dependencies)

**V2 Current Implementation References:**
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\frontend\src\*.tsx` (React UI)
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\backend\src\main\kotlin\com\lesouvenir\v2\ipc\*.kt` (IPC layer)
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\docs\*.md` (Existing audits)

---

## 1. Application Boot & Desktop Framework

| Feature | V1 Implementation | V2 Status | Evidence | Priority |
|---------|-------------------|-----------|----------|----------|
| **Compose Desktop UI** | `compose.desktop.currentOs`, fullscreen undecorated window | **NOT STARTED** | Main.kt L33-42, Compose Desktop 1.6.11 | Critical |
| **Window Management** | Fullscreen (WindowPlacement.Fullscreen), undecorated, title "Le Souvenir Kiosk" | **NOT STARTED** | Main.kt L37-42 | Critical |
| **Theme System** | `PhotoboothTheme` with custom colors (AccentNude, NeutralText, etc.) | **NOT STARTED** | Main.kt L70, ui/theme package | Important |
| **App Shell** | `AppShell()` with top bar, progress stepper, status bar props | **UI-ONLY MOCK** | Main.kt L71-76, AppShell component | Important |
| **Loading States** | 8-second timeout with fallback to admin/force ready | **NOT STARTED** | Main.kt L77-120 | Optional |

---

## 2. Customer Session Flow (State Machine)

### 2.1 Session States (SessionState.kt)
| State | Purpose | V1 Transition Logic | V2 Status |
|-------|---------|---------------------|-----------|
| `IDLE` | Start screen, no active session | Entry point, reset point | **UI-ONLY MOCK** |
| `SELECTING` | Layout/effect selection (Studio Mode) | From IDLE via controller | **UI-ONLY MOCK** |
| `SELECTING_QUANTITY` | Print quantity selection | Automatic after studio setup | **UI-ONLY MOCK** |
| `PAYMENT_PENDING` | QR payment display & polling | After quantity selection | **UI-ONLY MOCK** |
| `PREPARING` | Brief transition before live view | After payment completion | **UI-ONLY MOCK** |
| `LIVE_VIEW` | Camera preview active | After preparing or between shots | **NOT STARTED** |
| `COUNTDOWN` | Shot countdown (3,2,1) | Per shot in capture flow | **UI-ONLY MOCK** |
| `CAPTURING` | Actual camera capture | After countdown completes | **NOT STARTED** |
| `SELECTING_PHOTOS` | Photo selection grid | After all shots captured | **UI-ONLY MOCK** |
| `EDITING` | Frame selection | After photo selection confirmed | **UI-ONLY MOCK** |
| `PRINT_PENDING` | Final confirmation before print | After frame selection | **UI-ONLY MOCK** |
| `PRINTING` | Print job submission | After user confirmation | **NOT STARTED** |
| `DELIVERY` | QR display and finish | After print submission | **UI-ONLY MOCK** |
| `ADMIN` | Operator settings/management | From any state via timeout or button | **PARTIALLY IMPLEMENTED** |

### 2.2 State Transitions (DesktopBoothController.kt)
| Transition | Trigger | Business Logic |
|------------|---------|----------------|
| IDLE → SELECTING | "Bắt đầu" button | `controller.transitionTo(SessionState.SELECTING)` |
| SELECTING → SELECTING_QUANTITY | "Tiếp theo" button | `controller.confirmStudioSetup()` sets quantity=2 |
| SELECTING_QUANTITY → PAYMENT_PENDING | Quantity selected | `controller.setQuantityAndStartPayment()` |
| PAYMENT_PENDING → PREPARING | Payment completed | `controller.completePayment()` starts live view |
| PREPARING → LIVE_VIEW | 1.6s delay | Automatic transition |
| LIVE_VIEW → COUNTDOWN → CAPTURING | Capture flow per shot | `controller.startCaptureFlow()` loop |
| CAPTURING → SELECTING_PHOTOS | All shots complete | Auto after last shot |
| SELECTING_PHOTOS → EDITING | Enough photos selected | `controller.confirmSelection()` |
| EDITING → PRINT_PENDING | Frame selected | `controller.confirmFrameSelection()` |
| PRINT_PENDING → PRINTING | User confirms print | `controller.startPrinting(userConfirmed=true)` |
| PRINTING → DELIVERY | Print job submitted | Automatic after print submission |
| ANY → ADMIN | Back button/timeout | `controller.transitionTo(SessionState.ADMIN)` |
| BACK transitions | "Quay lại" button | `controller.goBack()` hierarchical back |

---

## 3. UI Screens Inventory

### 3.1 Customer Screens (Main.kt L125-289)
| Screen | Component | Purpose | V2 Status |
|--------|-----------|---------|-----------|
| **StartScreen** | `StartScreen()` | Initial idle screen with layouts | **UI-ONLY MOCK** |
| **StudioModeScreen** | `StudioModeScreen()` | Layout/effect selection with live view | **UI-ONLY MOCK** |
| **QuantityScreen** | `QuantityScreen()` | Print quantity selection (1-4) | **UI-ONLY MOCK** |
| **PaymentScreen** | `PaymentScreen()` | QR payment display with polling | **UI-ONLY MOCK** |
| **PrepareScreen** | `PrepareScreen()` | Brief "Chuẩn bị" transition | **UI-ONLY MOCK** |
| **CaptureScreen** | `CaptureScreen()` | Live view + countdown + capture | **PARTIALLY MOCK** |
| **SelectPhotosScreen** | `SelectPhotosScreen()` | Grid selection of captured photos | **UI-ONLY MOCK** |
| **FrameScreen** | `FrameScreen()` | Frame overlay selection | **UI-ONLY MOCK** |
| **ConfirmScreen** | `ConfirmScreen()` | Final confirmation before print | **UI-ONLY MOCK** |
| **PrintingScreen** | `PrintingScreen()` | Print progress display | **UI-ONLY MOCK** |
| **DeliveryScreen** | `DeliveryScreen()` | QR code + completion options | **UI-ONLY MOCK** |

### 3.2 Admin/Operator Screens
| Screen | Component | Purpose | V2 Status |
|--------|-----------|---------|-----------|
| **AdminScreen** | `AdminScreen()` | Multi-tab operator dashboard | **PARTIALLY IMPLEMENTED** |
| **SettingsTabContent** | `SettingsTabContent()` | Device settings (6 operator fields) | **IMPLEMENTED (V1Settings.tsx)** |
| **FilterAdminView** | Not found in scan | LUT/effect management | **NOT STARTED** |
| **CalculatorApp** | `CalculatorApp()` | Layout calculator tool | **NOT STARTED** |

### 3.3 Hidden Gestures & Navigation
| Gesture | Location | Action | V1 Evidence |
|---------|----------|--------|-------------|
| **Back circle** | AdminScreen top-left | `saveSettings(); onBack()` | AdminScreen.kt L98-101 |
| **Auto-save on exit** | AdminScreen back button | Implicit settings save | AdminScreen.kt L100 |
| **Force ready** | Loading timeout | `controller.forceAppReady()` | Main.kt L111 |
| **Hot folder chooser** | Settings folder field | Native JFileChooser | SettingsTabContent.kt L84-90 |

---

## 4. Hardware Integration Features

### 4.1 Camera Services Hierarchy
| Service | Class | Selection Condition | V2 Status |
|---------|-------|---------------------|-----------|
| **NativeEosCaptureService** | `NativeEosCaptureService.kt` | `config.useNativeSdk=true` | **NOT STARTED** |
| **WebcamStillCaptureService** | `WebcamStillCaptureService.kt` | Default fallback | **NOT STARTED** |
| **HotFolderCaptureService** | `HotFolderCaptureService.kt` | `config.useHotFolder=true` | **NOT STARTED** |
| **CliCaptureService** | `CliCaptureService.kt` | `config.useCliCamera=true` | **NOT STARTED** |

### 4.2 Canon EDSDK Features (NativeEosCaptureService.kt)
| Feature | Method | UI Control | Persistence |
|---------|--------|------------|-------------|
| **Live View Streaming** | `startLiveView()`, `downloadLiveView()` | Continuous ~30fps | None |
| **Face Tracking AF** | `setProperty(kEdsPropID_Evf_AFMode, 2L)` | Auto-enabled | None |
| **Exposure Controls** | ISO, Av, Tv getters/setters | Live dropdowns | None |
| **White Balance** | `setWhiteBalanceSafe()` | Hardcoded dropdown | None |
| **Picture Style** | `setPictureStyleSafe()` | Hardcoded dropdown | None |
| **Auto-reconnect** | `startAutoReconnectLoop()` | Background 2s check | None |
| **Capture** | `captureJpeg()` with `SafeShootCommand` | Per shot in flow | To session directory |

### 4.3 Printing Pipeline
| Component | Implementation | V2 Status |
|-----------|----------------|-----------|
| **PrinterService Interface** | `DesktopIoServices.kt` L22-24 | **IMPLEMENTED (OperatorSettingsStore)** |
| **SystemPrinterService** | `DesktopIoServices.kt` L36-92 | **NOT STARTED** |
| **Borderless Printing** | Paper.setImageableArea(0,0,width,height) | **NOT STARTED** |
| **Orientation Auto-rotate** | Graphics2D rotation on mismatch | **NOT STARTED** |
| **Strip/Full Printer Selection** | `printerNameStrip`, `printerNameFull` | **IMPLEMENTED (config)** |
| **Sheets Calculation** | Strips: copies/2, Full: copies | **NOT STARTED** |

### 4.4 Beauty Processing Pipeline
| Component | Class | V2 Status | Provenance |
|-----------|-------|-----------|------------|
| **DesktopBeautyService** | `DesktopBeautyService.kt` | **NOT STARTED** | **ACCEPTED** (Production code) |
| **YuNetFaceDetector** | `YuNetFaceDetector.kt` | **NOT STARTED** | **ACCEPTED** |
| **OnnxFaceParsingService** | `OnnxFaceParsingService.kt` | **NOT STARTED** | **ACCEPTED** |
| **CustomerFaceSelector** | `CustomerFaceSelector.kt` | **NOT STARTED** | **ACCEPTED** |
| **FaceOvalMaskBuilder** | `FaceOvalMaskBuilder.kt` | **NOT STARTED** | **ACCEPTED** |
| **BeautyProcessor** | `BeautyProcessor.kt` | **NOT STARTED** | **ACCEPTED** |
| **BeautyConfig** | `BeautyConfig.kt` | **NOT STARTED** | **ACCEPTED** |

**Beauty Provenance Status**: All beauty components exist in production V1 code (`desktop/beauty/`, `desktop/facemask/`). No evidence of experimental or rejected algorithms. ONNX runtime dependency confirmed.

---

## 5. Image Processing Pipeline

### 5.1 Core Processing Components
| Component | Class | Responsibilities | V2 Status |
|-----------|-------|-----------------|-----------|
| **DesktopImageProcessor** | Not found in scan | Effect application, LUT processing | **NOT STARTED** |
| **DesktopCompositor** | `PhotoCompositor.kt`? | Layout rendering with frames | **NOT STARTED** |
| **DesktopVideoCompositor** | Referenced in controller | Video creation from frames | **NOT STARTED** |
| **CubeLutParser** | Referenced in controller L79 | .cube LUT file parsing | **NOT STARTED** |

### 5.2 FFmpeg Integration (DesktopBoothController.kt L597-670)
| Feature | Implementation | Purpose |
|---------|----------------|---------|
| **Video Encoding** | ProcessBuilder with ffmpeg | Create videos from captured frames |
| **Fallback Static Video** | 3-second static from photo | When no frames captured |
| **Local FFmpeg Search** | `bin/ffmpeg.exe` → winget → system | Priority path search |
| **Frame Cleanup** | Delete static frames after encode | Storage management |

### 5.3 LUT/Effects System
| Feature | Evidence | V2 Status |
|---------|----------|-----------|
| **.cube file import** | `controller.importLut()` L77-85 | **NOT STARTED** |
| **Effect preview** | `controller.previewEffect()` L87-92 | **NOT STARTED** |
| **Live view effect** | `cameraService.startLiveView(effectId)` | **NOT STARTED** |
| **Effect persistence** | `controller.saveEffects()` L1057-1072 | **NOT STARTED** |

---

## 6. Business & Revenue Systems

### 6.1 Payment Integration
| Component | Implementation | V2 Status |
|-----------|----------------|-----------|
| **PayOS Java SDK** | `vn.payos:payos-java:2.0.1` | **NOT STARTED** |
| **PaymentService** | `PaymentService.kt` | **NOT STARTED** |
| **QR Generation** | `paymentService.createPaymentLink()` | **NOT STARTED** |
| **Payment Polling** | Background job in controller L374-385 | **NOT STARTED** |
| **Payment Status** | `paymentService.checkPaymentStatus()` | **NOT STARTED** |

### 6.2 Album/Cloud Services
| Service | Implementation | V2 Status |
|---------|----------------|-----------|
| **Cloudinary Upload** | `DesktopAlbumUploader.kt` | **NOT STARTED** |
| **Web Album Client** | `DesktopWebAlbumClient` | **NOT STARTED** |
| **QR Album URLs** | `webAlbumClient.createAlbum()` | **NOT STARTED** |
| **Local File Server** | `LocalFileServer.kt` port 8080 | **NOT STARTED** |
| **Firebase Layout Sync** | `FirebaseManager.fetchLayouts()` | **NOT STARTED** |

### 6.3 Revenue Tracking
| Component | Implementation | Revenue Gate |
|-----------|----------------|--------------|
| **SalesRepository** | `SalesRepository.kt` | Local SQLite/PostgreSQL |
| **RevenueClient** | `DesktopRevenueClient` | Neon API client |
| **Sale Transaction** | `SaleTransaction` data class | After successful print |
| **Revenue Recording** | `salesRepository.recordSale()` only if `userConfirmed && printJob.await()` | Controller L842-852 |

---

## 7. Configuration Management

### 7.1 Settings Taxonomy (26 Config Fields)
| Category | Count | Examples | Operator UI? |
|----------|-------|----------|--------------|
| **Identity/Secrets** | 4 | `boothId`, `boothApiKey`, PayOS keys | No |
| **Database/Cloud** | 6 | Neon URLs, Cloudinary config, album expiry | No |
| **Hardware Selection** | 5 | `useNativeSdk`, `useCliCamera`, `useHotFolder` | Partial |
| **Printer Config** | 3 | `enableSystemPrint`, printer names | Partial |
| **Timeout Settings** | 3 | Three timeout seconds fields | Yes |
| **Beauty Config** | 2 | `isBeautyEnabled`, `beautyPreset` | No |
| **Local Server** | 2 | `enableLocalServer`, `localServerPort` | No |
| **Hot Folder Path** | 1 | `hotFolderPath` | Yes |

### 7.2 Configuration Loading (DesktopConfigLoader.kt)
| Aspect | Implementation | V2 Parity |
|--------|----------------|-----------|
| **Precedence** | working.env → appData.env → process env | **SIMPLIFIED (JSON)** |
| **Boolean Parsing** | `toBooleanFlag()` (lenient), `toBooleanStrictOrNull()` (strict) | **STRICT (JSON)** |
| **Validation** | Minimal: `coerceAtLeast(1)` for days | **STRICT (0-3600)** |
| **Default Values** | In `DesktopBoothConfig` constructor | **MAPPED** |

### 7.3 Settings Persistence (SettingsManager.kt)
| Operation | Implementation | V2 Parity |
|-----------|----------------|-----------|
| **Update .env** | In-place key replacement, append new | **ATOMIC JSON** |
| **Preservation** | Keeps comments, blank lines, order | **REPLACEMENT** |
| **File Target** | `config.envSource ?: workingDir()/.env` | **FIXED PATH** |

---

## 8. Build & Dependencies

### 8.1 Gradle Configuration (build.gradle.kts)
| Dependency | Version | Purpose | Redistribution Check |
|------------|---------|---------|---------------------|
| `compose.desktop.currentOs` | 1.6.11 | UI Framework | OK (JetBrains) |
| `com.bitplan:edsdk4j` | 0.0.1 | Canon EDSDK wrapper | **NEEDS VERIFICATION** |
| `com.microsoft.onnxruntime` | 1.18.0 | Face detection | **NEEDS VERIFICATION** |
| `vn.payos:payos-java` | 2.0.1 | Payment integration | **NEEDS VERIFICATION** |
| `com.google.firebase:firebase-admin` | 9.3.0 | Remote config | **NEEDS VERIFICATION** |
| `com.github.sarxos:webcam-capture` | 0.3.12 | Webcam fallback | OK (MIT) |
| `org.xerial:sqlite-jdbc` | 3.45.3.0 | Local storage | OK (Apache 2.0) |

### 8.2 Native Distribution
| Feature | Configuration | V2 Target |
|---------|---------------|-----------|
| **Windows MSI** | `targetFormats(...Msi)` | Tauri/Electron |
| **Package Name** | `"LeSouvenirDesktop"` | New identity |
| **Java Modules** | `java.net.http`, `jdk.crypto.ec`, etc. | Tauri runtime |
| **App Resources** | `app-resources/` directory | Tauri resources |

### 8.3 Native Libraries
| Library | Location | Purpose |
|---------|----------|---------|
| **EDSDK_64/** | Root directory | Canon SDK native DLLs |
| **edsdk/** | Root directory | EDSDK wrapper resources |
| **bin/ffmpeg.exe** | `bin/` directory | Video encoding |

---

## 9. Test & Verification Coverage

### 9.1 Existing V1 Tests
| Test Class | Location | Coverage |
|------------|----------|----------|
| **RevenueAccountingTest** | `test/kotlin/com/phuctran/...` | Print/revenue integration |
| **FakePrinner** | In RevenueAccountingTest | Mock printer service |
| **FrameEngineTest** | `engine/FrameEngineTest.kt` | Layout calculation |
| **LayoutCalculatorTool** | `engine/LayoutCalculatorTool.kt` | CLI tool |

### 9.2 V2 Current Tests
| Test | Location | Status |
|------|----------|--------|
| **OperatorSettingsTest** | `backend/src/test/kotlin/...` | **AUTOMATED TESTED** |
| **V1Settings.test.tsx** | `frontend/src/V1Settings.test.tsx` | **NOT STARTED** |
| **Simulator Tests** | Various log files | **AUTOMATED TESTED** |

---

## 10. Critical Gaps & Unknowns

### 10.1 Hardware Verification Required
| Component | Evidence Status | Risk |
|-----------|----------------|------|
| **Canon EDSDK Compatibility** | Code exists, no specific model tests | HIGH |
| **DNP RX1HS Cutting** | Print logic exists, no cut command evidence | HIGH |
| **Webcam Device Compatibility** | Sarxos library used, no device matrix | MEDIUM |
| **FFmpeg Redistribution** | Bundled in bin/, no license audit | MEDIUM |

### 10.2 Business Logic Uncertainties
| Aspect | V1 Evidence | Gap |
|--------|-------------|-----|
| **Revenue Timing** | Only after `userConfirmed && printJob.await()` | Verified |
| **Auto-print on Timeout** | `startPrinting(userConfirmed=false)` | Verified |
| **Layout Countdown Config** | Per-layout `countdownSeconds` field | Verified |
| **Photo Count Config** | Per-layout `shotCount` field | Verified |

### 10.3 Security & Compliance
| Concern | V1 Approach | V2 Requirement |
|---------|------------|----------------|
| **Secret Storage** | `.env` files in app data directory | Secure credential management |
| **Customer Data** | Session directories under `data/sessions/` | GDPR-compliant cleanup |
| **Payment Data** | PayOS integration, no card storage | PCI DSS compliance |
| **Redistribution** | Canon SDK, ONNX models, FFmpeg | License verification required |

---

## 11. Implementation Priority Matrix

### 11.1 Critical Path (Must Preserve)
1. **Session State Machine** - Complete flow with all transitions
2. **Camera Service Abstraction** - Multi-source capture pipeline
3. **Printing Service** - Windows print driver integration
4. **Settings Contract** - 6 operator fields with validation
5. **Revenue Gating** - Sale recording only after successful print

### 11.2 High Priority
1. **Beauty Pipeline** - YuNet/BiSeNet face processing
2. **Image Composition** - Layout + frame rendering
3. **Payment Integration** - PayOS QR generation
4. **Album Upload** - Cloudinary with QR URLs
5. **Local Server** - File serving for local QR

### 11.3 Medium Priority
1. **Video Encoding** - FFmpeg integration
2. **LUT/Effects System** - .cube file support
3. **Firebase Sync** - Remote layout configuration
4. **Admin Tools** - Filter management, calculator
5. **Auto-reconnect** - Hardware resilience

### 11.4 Low Priority / Deferred
1. **CLI Camera Support** - `CameraControlCmd.exe` integration
2. **Advanced Canon Controls** - Full EDSDK parameter set
3. **Multiple Printer Support** - Strip/Full separate queues
4. **Sophisticated Timeout UI** - Visual countdown display

---

**Audit Completion**: This inventory enumerates all features discovered through read-only inspection of V1 source code. No V1 files were modified. No secrets or runtime data accessed. All evidence citations refer to actual V1 source file paths and line numbers observed during inspection.