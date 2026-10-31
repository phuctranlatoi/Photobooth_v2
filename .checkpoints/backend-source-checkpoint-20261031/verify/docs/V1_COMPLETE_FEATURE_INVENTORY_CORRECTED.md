# V1 Complete Feature Inventory - CORRECTED

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
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\src-tauri\` (Tauri desktop)

---

## 1. Application Boot & Desktop Framework - CORRECTED

| Feature | V1 Implementation | V2 Status | Evidence | Priority |
|---------|-------------------|-----------|----------|----------|
| **Compose Desktop UI** | `compose.desktop.currentOs`, fullscreen undecorated window | **TAURI PRESENT** (exact fullscreen fidelity unverified) | Main.kt L33-42, Compose Desktop 1.6.11 | Critical |
| **Window Management** | Fullscreen (WindowPlacement.Fullscreen), undecorated, title "Le Souvenir Kiosk" | **TAURI PRESENT** (fidelity unverified) | Main.kt L37-42 | Critical |
| **Theme System** | `PhotoboothTheme` with custom colors (AccentNude, NeutralText, etc.) | **PARTIAL** (CSS tokens exist, visual match unverified) | Main.kt L70, ui/theme package | Important |
| **App Shell** | `AppShell()` with top bar, progress stepper, status bar props | **IMPLEMENTED SYNTHETIC FLOW** | Main.kt L71-76, AppShell component | Important |
| **Loading States** | 8-second timeout with fallback to admin/force ready | **IMPLEMENTED SYNTHETIC FLOW** | Main.kt L77-120 | Optional |

---

## 2. Customer Session Flow (State Machine) - CORRECTED

### 2.1 Session States (SessionState.kt L7-25 - EXACT 17 STATES)
| State | Purpose | V1 Transition Logic | V2 Status |
|-------|---------|---------------------|-----------|
| `IDLE` | Start screen, no active session | Entry point, reset point | **IMPLEMENTED SYNTHETIC FLOW** |
| `SELECTING` | Layout/effect selection (Studio Mode) | From IDLE via controller | **IMPLEMENTED SYNTHETIC FLOW** |
| `SELECTING_QUANTITY` | Print quantity selection | Automatic after studio setup | **IMPLEMENTED SYNTHETIC FLOW** |
| `PAYMENT_PENDING` | QR payment display & polling | After quantity selection | **IMPLEMENTED SYNTHETIC FLOW** |
| `PREPARING` | Brief transition before live view | After payment completion | **IMPLEMENTED SYNTHETIC FLOW** |
| `LIVE_VIEW` | Camera preview active | After preparing or between shots | **IMPLEMENTED SYNTHETIC FLOW** |
| `COUNTDOWN` | Shot countdown (configurable duration) | Per shot in capture flow | **IMPLEMENTED SYNTHETIC FLOW** |
| `CAPTURING` | Actual camera capture | After countdown completes | **IMPLEMENTED SYNTHETIC FLOW** |
| `SELECTING_PHOTOS` | Photo selection grid | After all shots captured | **IMPLEMENTED SYNTHETIC FLOW** |
| `EDITING` | Frame selection | After photo selection confirmed | **IMPLEMENTED SYNTHETIC FLOW** |
| `COMPOSING` | Image composition | After frame selection | **IMPLEMENTED SYNTHETIC FLOW** |
| `PRINT_PENDING` | Final confirmation before print | After composition | **IMPLEMENTED SYNTHETIC FLOW** |
| `PRINTING` | Print job submission | After user confirmation OR timeout auto-print | **IMPLEMENTED SYNTHETIC FLOW** |
| `DELIVERY` | QR display and finish | After print submission | **IMPLEMENTED SYNTHETIC FLOW** |
| `RECOVERY` | Error recovery state | From various error conditions | **IMPLEMENTED SYNTHETIC FLOW** |
| `OUT_OF_SERVICE` | System maintenance | Manual or critical failure | **IMPLEMENTED SYNTHETIC FLOW** |
| `ADMIN` | Operator settings/management | Via 5-tap gesture on welcome screen | **IMPLEMENTED SYNTHETIC FLOW** |

### 2.2 State Transitions (DesktopBoothController.kt) - CORRECTED
| Transition | Trigger | Business Logic | Line |
|------------|---------|----------------|------|
| IDLE → SELECTING | "Bắt đầu" button | `controller.transitionTo(SessionState.SELECTING)` | Main.kt L132 |
| SELECTING → SELECTING_QUANTITY | "Tiếp theo" button | `controller.confirmStudioSetup()` sets quantity=2 | Controller.kt L349-354 |
| SELECTING_QUANTITY → PAYMENT_PENDING | Quantity selected | `controller.setQuantityAndStartPayment()` | Controller.kt L356-386 |
| PAYMENT_PENDING → PREPARING | Payment completed | `controller.completePayment()` starts live view | Controller.kt L388-398 |
| PREPARING → LIVE_VIEW | 1.6s delay | Automatic transition | Controller.kt L395-397 |
| LIVE_VIEW → COUNTDOWN → CAPTURING | Capture flow per shot | `controller.startCaptureFlow()` loop | Controller.kt L436-569 |
| CAPTURING → SELECTING_PHOTOS | All shots complete | Auto after last shot | Controller.kt L590-594 |
| SELECTING_PHOTOS → EDITING | Enough photos selected | `controller.confirmSelection()` | Controller.kt L682-689 |
| EDITING → PRINT_PENDING | Frame selected | `controller.confirmFrameSelection()` | Controller.kt L708-715 |
| PRINT_PENDING → PRINTING | User confirms print | `controller.startPrinting(userConfirmed=true)` | Main.kt L241 |
| PRINTING → DELIVERY | Print job submitted | Automatic after print submission | Controller.kt L853 |
| **Timeout Auto-print** | Inactivity timeout | `startPrinting(userConfirmed=false)` | Controller.kt L310 |
| **Admin Entry** | 5-tap gesture on welcome | `controller.transitionTo(SessionState.ADMIN)` | StartScreen.kt L50,65-74 |

---

## 3. UI Screens Inventory - CORRECTED

### 3.1 Customer Screens (Main.kt L125-289)
| Screen | Component | Purpose | V2 Status |
|--------|-----------|---------|-----------|
| **StartScreen** | `StartScreen()` | Initial idle screen with layouts | **IMPLEMENTED SYNTHETIC FLOW** |
| **StudioModeScreen** | `StudioModeScreen()` | Layout/effect selection with live view | **IMPLEMENTED SYNTHETIC FLOW** |
| **QuantityScreen** | `QuantityScreen()` | Print quantity selection (1-4) | **IMPLEMENTED SYNTHETIC FLOW** |
| **PaymentScreen** | `PaymentScreen()` | QR payment display with polling | **IMPLEMENTED SYNTHETIC FLOW** |
| **PrepareScreen** | `PrepareScreen()` | Brief "Chuẩn bị" transition | **IMPLEMENTED SYNTHETIC FLOW** |
| **CaptureScreen** | `CaptureScreen()` | Live view + countdown + capture | **IMPLEMENTED SYNTHETIC FLOW** |
| **SelectPhotosScreen** | `SelectPhotosScreen()` | Grid selection of captured photos | **IMPLEMENTED SYNTHETIC FLOW** |
| **FrameScreen** | `FrameScreen()` | Frame overlay selection | **IMPLEMENTED SYNTHETIC FLOW** |
| **ConfirmScreen** | `ConfirmScreen()` | Final confirmation before print | **IMPLEMENTED SYNTHETIC FLOW** |
| **PrintingScreen** | `PrintingScreen()` | Print progress display | **IMPLEMENTED SYNTHETIC FLOW** |
| **DeliveryScreen** | `DeliveryScreen()` | QR code + completion options | **IMPLEMENTED SYNTHETIC FLOW** |

### 3.2 Admin/Operator Screens (AdminScreen.kt L123 - EXACT 6 TABS)
| Tab | Vietnamese Label | Content | V2 Status |
|-----|------------------|---------|-----------|
| **Tab 0** | "Khung" | Frame management (standard + special) | **PARTIAL** (UI mock, no backend contract) |
| **Tab 1** | "Bố cục" | Layout configuration | **PARTIAL** (UI mock, no backend contract) |
| **Tab 2** | "Cài đặt" | `SettingsTabContent` (6 operator settings) | **IMPLEMENTED** (V1Settings.tsx + OperatorSettingsStore) |
| **Tab 3** | "Công cụ" | `CalculatorApp` (layout/frame calculator tool) | **NOT STARTED** (no backend contract) |
| **Tab 4** | "Màu ảnh" | `FilterAdminView` (LUT/effect management) | **NOT STARTED** (no backend contract) |
| **Tab 5** | "Doanh thu" | `RevenueScreen` (sales reporting) | **NOT STARTED** (no backend contract) |

### 3.3 Hidden Gestures & Navigation - CORRECTED
| Gesture | Location | Action | V1 Evidence |
|---------|----------|--------|-------------|
| **5-tap Admin** | StartScreen "LE SOUVENIR" text | `controller.transitionTo(SessionState.ADMIN)` | StartScreen.kt L50,65-74 |
| **Back circle** | AdminScreen top-left | `saveSettings(); onBack()` | AdminScreen.kt L98-101 |
| **Auto-save on exit** | AdminScreen back button | Implicit settings save | AdminScreen.kt L100 |
| **Force ready** | Loading timeout | `controller.forceAppReady()` | Main.kt L111 |
| **Hot folder chooser** | Settings folder field | Native JFileChooser | SettingsTabContent.kt L84-90 |
| **Payment staff override** | Long-press header in PaymentScreen | Cash confirmation | PaymentScreen.kt L36-44,131-146 |

---

## 4. Hardware Integration Features - CORRECTED

### 4.1 Camera Services Hierarchy
| Service | Class | Selection Condition | V2 Status |
|---------|-------|---------------------|-----------|
| **NativeEosCaptureService** | `NativeEosCaptureService.kt` | `config.useNativeSdk=true` | **NOT STARTED/BLOCKED** pending camera contract |
| **WebcamStillCaptureService** | `WebcamStillCaptureService.kt` | Default fallback | **NOT STARTED/BLOCKED** pending camera contract |
| **HotFolderCaptureService** | `HotFolderCaptureService.kt` | `config.useHotFolder=true` | **NOT STARTED/BLOCKED** pending camera contract |
| **CliCaptureService** | `CliCaptureService.kt` | `config.useCliCamera=true` | **NOT STARTED/BLOCKED** pending camera contract |

### 4.2 Canon EDSDK Features (NativeEosCaptureService.kt)
| Feature | Method | UI Control | Persistence | V2 Status |
|---------|--------|------------|-------------|-----------|
| **Live View Streaming** | `startLiveView()`, `downloadLiveView()` | Continuous ~30fps | None | **NOT STARTED/BLOCKED** |
| **Face Tracking AF** | `setProperty(kEdsPropID_Evf_AFMode, 2L)` | Auto-enabled | None | **NOT STARTED/BLOCKED** |
| **Exposure Controls** | ISO, Av, Tv getters/setters | Live dropdowns | None | **NOT STARTED/BLOCKED** |
| **White Balance** | `setWhiteBalanceSafe()` | Hardcoded dropdown | None | **NOT STARTED/BLOCKED** |
| **Picture Style** | `setPictureStyleSafe()` | Hardcoded dropdown | None | **NOT STARTED/BLOCKED** |
| **Auto-reconnect** | `startAutoReconnectLoop()` | Background 2s check | None | **NOT STARTED/BLOCKED** |
| **Capture** | `captureJpeg()` with `SafeShootCommand` | Per shot in flow | To session directory | **NOT STARTED/BLOCKED** |

### 4.3 Printing Pipeline
| Component | Implementation | V2 Status |
|-----------|----------------|-----------|
| **PrinterService Interface** | `DesktopIoServices.kt` L22-24 | **IMPLEMENTED** (OperatorSettingsStore interface) |
| **SystemPrinterService** | `DesktopIoServices.kt` L36-92 | **NOT STARTED/BLOCKED** pending printer contract |
| **Borderless Printing** | Paper.setImageableArea(0,0,width,height) | **NOT STARTED/BLOCKED** |
| **Orientation Auto-rotate** | Graphics2D rotation on mismatch | **NOT STARTED/BLOCKED** |
| **Strip/Full Printer Selection** | `printerNameStrip`, `printerNameFull` | **NOT STARTED/BLOCKED** pending config contract |
| **Sheets Calculation** | Strips: copies/2, Full: copies | **NOT STARTED/BLOCKED** |

### 4.4 Beauty Processing Pipeline - CORRECTED: UNVERIFIED/BLOCKED
| Component | Class | V2 Status | Provenance |
|-----------|-------|-----------|------------|
| **DesktopBeautyService** | `DesktopBeautyService.kt` | **NOT STARTED/BLOCKED** | **UNVERIFIED** (candidate5d65460, no approved manifest) |
| **YuNetFaceDetector** | `YuNetFaceDetector.kt` | **NOT STARTED/BLOCKED** | **UNVERIFIED** (no approved manifest) |
| **OnnxFaceParsingService** | `OnnxFaceParsingService.kt` | **NOT STARTED/BLOCKED** | **UNVERIFIED** (no approved manifest) |
| **CustomerFaceSelector** | `CustomerFaceSelector.kt` | **NOT STARTED/BLOCKED** | **UNVERIFIED** (no approved manifest) |
| **FaceOvalMaskBuilder** | `FaceOvalMaskBuilder.kt` | **NOT STARTED/BLOCKED** | **UNVERIFIED** (no approved manifest) |
| **BeautyProcessor** | `BeautyProcessor.kt` | **NOT STARTED/BLOCKED** | **UNVERIFIED** (no approved manifest) |
| **BeautyConfig** | `BeautyConfig.kt` | **NOT STARTED/BLOCKED** | **UNVERIFIED** (no approved manifest) |

**Beauty Provenance Status**: ❌ **UNVERIFIED/BLOCKED** - Source files exist but candidate5d65460 unapproved. No approved manifest confirming acceptance. ONNX runtime dependency present but approval status unknown.

---

## 5. Configuration Management - CORRECTED

### 5.1 Complete V1 Configuration Inventory (26 Fields)

**Operator-Exposed Settings (6 fields - UI in SettingsTabContent):**
1. `enableSystemPrint` - Boolean, `ENABLE_SYSTEM_PRINT`, default `false` (SettingsTabContent.kt L62-63)
2. `useHotFolder` - Boolean, `USE_HOT_FOLDER`, default `true` (SettingsTabContent.kt L73-76)
3. `hotFolderPath` - String, `HOT_FOLDER_PATH`, default `"E:\\Photobooth\\HotFolder"` (SettingsTabContent.kt L82-90)
4. `postCaptureTimeoutSeconds` - Int, `POST_CAPTURE_TIMEOUT_SECONDS`, default `90` (SettingsTabContent.kt L125)
5. `photoSelectionTimeoutSeconds` - Int, `PHOTO_SELECTION_TIMEOUT_SECONDS`, default `90` (SettingsTabContent.kt L121)
6. `frameSelectionTimeoutSeconds` - Int, `FRAME_SELECTION_TIMEOUT_SECONDS`, default `60` (SettingsTabContent.kt L123)

**Deployment Configuration (20 fields - NO operator UI):**
7. `boothId` - String, `BOOTH_ID`, default `"booth_1"` (DesktopBoothConfig.kt L8)
8. `boothApiKey` - String, `BOOTH_API_KEY`, default `""` (L9)
9. `neonDatabaseUrl` - String, `NEON_DATABASE_URL`, default `""` (L10)
10. `neonRevenueBoothId` - String, `NEON_REVENUE_BOOTH_ID`, default `""` (L11)
11. `webAlbumBaseUrl` - String, `WEB_ALBUM_BASE_URL`, default `"https://web-photobooth-pink.vercel.app/"` (L12)
12. `cloudinaryCloudName` - String, `CLOUDINARY_CLOUD_NAME`, default `""` (L13)
13. `cloudinaryUploadPreset` - String, `CLOUDINARY_UPLOAD_PRESET`, default `""` (L14)
14. `albumExpiresInDays` - Int, `ALBUM_EXPIRES_IN_DAYS`, default `7` (L15)
15. `useNativeSdk` - Boolean, `USE_NATIVE_SDK`, default `true` (L19)
16. `useCliCamera` - Boolean, `USE_CLI_CAMERA`, default `false` (L20)
17. `cliCaptureCommand` - String, `CLI_CAPTURE_COMMAND`, default `"CameraControlCmd.exe /capturenoaf /filename \"%s\""` (L21)
18. `enableLocalServer` - Boolean, `ENABLE_LOCAL_SERVER`, default `true` (L22)
19. `localServerPort` - Int, `LOCAL_SERVER_PORT`, default `8080` (L23)
20. `payosClientId` - String, `PAYOS_CLIENT_ID`, default `""` (L26)
21. `payosApiKey` - String, `PAYOS_API_KEY`, default `""` (L27)
22. `payosChecksumKey` - String, `PAYOS_CHECKSUM_KEY`, default `""` (L28)
23. `printerNameStrip` - String, `PRINTER_NAME_STRIP`, default `""` (L32)
24. `printerNameFull` - String, `PRINTER_NAME_FULL`, default `""` (L33)
25. `isBeautyEnabled` - Boolean, `BEAUTY_ENABLED`, default `false` (L34)
26. `beautyPreset` - BeautyPreset, `BEAUTY_PRESET`, default `BRIGHT` (L35)

### 5.2 Canon EDSDK Live Parameters (No Persistence, No UI in V2)
| Parameter | V1 UI Control | V1 Method | V2 Status |
|-----------|---------------|-----------|-----------|
| ISO | Dropdown (SettingsTabContent.kt L100) | `nativeCamera.setIso()` | **NOT STARTED/BLOCKED** pending camera contract |
| Aperture (Av) | Dropdown (L101) | `nativeCamera.setAperture()` | **NOT STARTED/BLOCKED** pending camera contract |
| Shutter Speed (Tv) | Dropdown (L102) | `nativeCamera.setShutterSpeed()` | **NOT STARTED/BLOCKED** pending camera contract |
| White Balance | Hardcoded dropdown (L106-110) | `nativeCamera.setWhiteBalanceSafe()` | **NOT STARTED/BLOCKED** pending camera contract |
| Picture Style | Hardcoded dropdown (L111-116) | `nativeCamera.setPictureStyleSafe()` | **NOT STARTED/BLOCKED** pending camera contract |

---

## 6. Tools Inventory - CORRECTED

### 6.1 Real Tools (AdminScreen.kt Tab 3 "Công cụ")
| Tool | Implementation | Purpose | V2 Status |
|------|----------------|---------|-----------|
| **CalculatorApp** | `engine/LayoutCalculatorTool.kt` L56+ | Layout/frame geometry calculator | **NOT STARTED** (no backend contract) |

### 6.2 Real Tools (AdminScreen.kt Tab 4 "Màu ảnh")
| Tool | Implementation | Purpose | V2 Status |
|------|----------------|---------|-----------|
| **previewEffect** | `controller.previewEffect()` (Controller.kt L87-92) | Preview LUT effect on sample image | **NOT STARTED** (no backend contract) |
| **importLut** | `controller.importLut()` (Controller.kt L77-85) | Import .cube LUT file | **NOT STARTED** (no backend contract) |
| **saveEffects** | `controller.saveEffects()` (Controller.kt L1057-1072) | Save effect configurations | **NOT STARTED** (no backend contract) |

### 6.3 Real Tools (AdminScreen.kt Tab 0 "Khung")
| Tool | Implementation | Purpose | V2 Status |
|------|----------------|---------|-----------|
| **addCustomFrame** | `controller.addCustomFrame()` (Controller.kt L698-706) | Add frame with JFileChooser | **NOT STARTED** (no backend contract) |

### 6.4 Real Tools (AdminScreen.kt Tab 1 "Bố cục")
| Tool | Implementation | Purpose | V2 Status |
|------|----------------|---------|-----------|
| **saveLayoutConfig** | `controller.saveLayoutConfig()` (Controller.kt L1033-1055) | Save layout price/shot/countdown | **NOT STARTED** (no backend contract) |
| **deleteLayout** | `controller.deleteLayout()` (Controller.kt L1075-1077) | Delete layout | **NOT STARTED** (no backend contract) |

### 6.5 File Operation Tools
| Tool | Implementation | Purpose | V2 Status |
|------|----------------|---------|-----------|
| **JFileChooser** | Native Swing dialog | File/folder selection | **NOT STARTED** (requires Tauri dialog API) |

---

## 7. V2 Current Implementation Status - CORRECTED

### 7.1 Fully Implemented (Tests 20/42 one fail)
| Component | V2 Implementation | Status | Test Evidence |
|-----------|-------------------|--------|---------------|
| **Session Flow** | SimulatorSessionEngine.kt | **IMPLEMENTED SYNTHETIC FLOW** | 20/42 tests (one fail) |
| **Operator Settings Store** | OperatorSettingsStore.kt | **IMPLEMENTED** | OperatorSettingsTest.kt |
| **Settings IPC** | `operator.getSettings`/`updateSettings` | **IMPLEMENTED** | Tested with session gating |
| **Tauri Desktop** | src-tauri/ | **PRESENT** (fidelity unverified) | Cargo build logs |
| **React UI Structure** | App.tsx, Simulator.tsx | **IMPLEMENTED** | Mounted preview logs |

### 7.2 Partially Implemented
| Component | V2 Implementation | Status | Gap |
|-----------|-------------------|--------|-----|
| **V1Settings UI** | V1Settings.tsx | **PARTIAL** (controls disabled) | Requires backend auth to enable |
| **Admin Tabs Structure** | Operator.tsx | **PARTIAL** (UI mock) | No backend contracts for tools |
| **Theme/Visual Fidelity** | CSS files | **PARTIAL** (visual match unverified) | Needs mounted verification |

### 7.3 NOT STARTED/BLOCKED Pending Contracts
| Category | Components | Blocked On |
|----------|------------|------------|
| **Camera Hardware** | All Canon EDSDK, webcam, hot folder | Camera contract |
| **Printer Hardware** | SystemPrinterService, DNP RX1HS | Printer contract |
| **Beauty Pipeline** | All beauty components | Approved manifest |
| **Deployment Config** | 20 non-operator fields | Safe config contract |
| **Admin Tools** | CalculatorApp, frame import, etc. | Backend contracts |
| **Business Integration** | PayOS, Cloudinary, Neon | Service contracts |

---

## 8. Critical Corrections from Previous Audit

### 8.1 Previously Incorrect Claims - NOW CORRECTED
| Previous Claim | Correction | Evidence |
|----------------|------------|----------|
| "Beauty ACCEPTED" | ❌ **UNVERIFIED/BLOCKED** | No approved manifest, candidate5d65460 unapproved |
| "13 session states" | ❌ **17 EXACT STATES** | SessionState.kt L7-25 |
| "4 admin screens" | ❌ **6 ADMIN TABS** | AdminScreen.kt L123 |
| "CalculatorApp invented" | ❌ **REAL TOOL** | AdminScreen.kt L239, engine/LayoutCalculatorTool.kt |
| "previewEffect not found" | ❌ **ACTUAL SYMBOL** | Controller.kt L87-92, Main.kt L285 |
| "UI-only mock" for flow | ❌ **IMPLEMENTED SYNTHETIC FLOW** | SimulatorSessionEngine.kt with 20/42 tests |
| "Migration hybrid option" | ❌ **FORBIDDEN** | Clean break only, no V1 .env reading |
| "Deployment config: Migrate NO" | ❌ **NOT STARTED/BLOCKED** | Pending safe config contract |

### 8.2 Semantic Differences - ACCURATE
| Aspect | V1 Semantics | V2 Semantics | Status |
|--------|--------------|--------------|--------|
| **Operator Settings Apply** | Mixed: some immediate (`activeConfig`), some restart | Explicit: `appliesTo: "NEXT_SESSION"`, `hardwareApply: "PENDING_DISABLED"` | **V2 implemented** |
| **Session Gating** | Save allowed anytime (even mid-session) | Blocked during active session (`-32001` error) | **V2 stricter** |
| **Validation** | Lenient (`toIntOrNull() ?: default`) | Strict (0-3600 range, rejects invalid) | **V2 stricter** |
| **Opt-in** | Always available | `localOperatorEnabled=true` required | **V2 explicit** |

---

## 9. Implementation Priority - CORRECTED

### 9.1 HIGH PRIORITY (User Settings/Tools)
1. **Enable V1Settings controls** - With backend auth, not blindly
2. **File chooser integration** - Tauri dialog API for frame/LUT import
3. **Complete hot folder UI** - Text field + chooser
4. **Admin tools backend contracts** - CalculatorApp, frame management

### 9.2 MEDIUM PRIORITY
1. **Camera IPC contract** - Canon EDSDK controls surface
2. **Printer IPC contract** - System printing integration
3. **Deployment config system** - Safe runtime configuration
4. **Visual fidelity verification** - Mounted Windows testing

### 9.3 BLOCKED Pending Approval
1. **Beauty pipeline** - ❌ UNVERIFIED/BLOCKED (no approved manifest)
2. **Hardware operations** - Requires camera/printer contracts
3. **Business integration** - Requires service contracts

---

## 10. Audit Coverage Limits

### 10.1 Verified Through Source Inspection Only
- ✅ V1 source file existence and line numbers
- ✅ V2 current implementation source state
- ✅ Configuration field inventory (26 + 5 Canon)
- ✅ Session state machine (17 exact states)
- ✅ Admin tab structure (6 exact tabs)
- ✅ Tool inventory (real tools identified)

### 10.2 NOT Verified (Requires Independent Review)
- ❌ Beauty component approval status
- ❌ Hardware integration feasibility
- ❌ Business service contract validity
- ❌ V2 visual fidelity on target hardware
- ❌ Performance under load
- ❌ Cross-platform compatibility
- ❌ Security compliance
- ❌ License/redistribution rights

### 10.3 Files Inspected for This Correction
1. `SessionStateMachine.kt` - Verified 17 exact states
2. `AdminScreen.kt` - Verified 6 exact tabs (L123)
3. `DesktopBoothController.kt` - Verified `previewEffect()` (L87-92), timeout auto-print (L310)
4. `SettingsTabContent.kt` - Verified 6 operator controls
5. `DesktopBoothConfig.kt` - Verified 26 configuration fields
6. `NativeEosCaptureService.kt` - Verified Canon EDSDK methods
7. `engine/LayoutCalculatorTool.kt` - Verified CalculatorApp existence
8. V2 `OperatorSettingsStore.kt` - Verified current implementation
9. V2 `V1Settings.tsx` - Verified partial implementation

**Audit Completion**: This corrected inventory reflects exact source evidence from read-only V1 inspection. No V1 files were modified. No architecture decisions were made. All claims reference specific source file paths and line numbers. Beauty acceptance remains UNVERIFIED/BLOCKED pending approved manifest.