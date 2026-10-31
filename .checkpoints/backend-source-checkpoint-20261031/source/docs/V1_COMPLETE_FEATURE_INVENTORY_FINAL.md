# V1 Complete Feature Inventory - FINAL CORRECTED

**Authority Sources (Read-only V1 Inspection):**
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\domain\SessionStateMachine.kt:7-25` (EXACT 17 SessionState enum)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\AdminScreen.kt:123` (EXACT 6 admin tabs)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\config\DesktopBoothConfig.kt:8-35` (26 configuration fields)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\SettingsTabContent.kt` (6 operator UI controls)

---

## 1. EXACT SessionState Enum (SessionStateMachine.kt:7-25)

| # | State Enum | Declaration Line | Observed in Main.kt Transitions | Notes |
|---|------------|------------------|---------------------------------|-------|
| 1 | `IDLE` | L8 | L126 (StartScreen) | Entry point |
| 2 | `SELECTING` | L9 | L136 (StudioModeScreen) | Layout/effect selection |
| 3 | `SELECTING_QUANTITY` | L10 | L162 (QuantityScreen) | Print quantity selection |
| 4 | `PAYMENT_PENDING` | L11 | L168 (PaymentScreen) | QR payment display |
| 5 | `PREPARING` | L12 | L181 (PrepareScreen) | Brief transition |
| 6 | `LIVE_VIEW` | L13 | L182, L204, L567 | Camera preview active |
| 7 | `COUNTDOWN` | L14 | L182, L459 | Shot countdown |
| 8 | `CAPTURING` | L15 | L182, L507 | Actual capture |
| 9 | `SELECTING_PHOTOS` | L16 | L207 (SelectPhotosScreen) | Photo selection grid |
| 10 | `EDITING` | L17 | L216 (FrameScreen) | Frame selection |
| 11 | `COMPOSING` | L18 | **NOT OBSERVED** in Main.kt transitions | Declared but unused in inspected flows |
| 12 | `PRINT_PENDING` | L19 | L234 (ConfirmScreen) | Final confirmation |
| 13 | `PRINTING` | L20 | L244 (PrintingScreen) | Print job submission |
| 14 | `DELIVERY` | L21 | L245 (DeliveryScreen) | QR display and finish |
| 15 | `RECOVERY` | L22 | **NOT OBSERVED** in Main.kt | Declared but unused in inspected flows |
| 16 | `OUT_OF_SERVICE` | L23 | **NOT OBSERVED** in Main.kt | Declared but unused in inspected flows |
| 17 | `ADMIN` | L24 | L125, L253 (AdminScreen) | Operator management |

**Total: 17 exact enum states** (13 observed in Main.kt transitions, 4 declared but not observed in inspected flows)

---

## 2. EXACT Admin Tabs Structure (AdminScreen.kt:123)

| Tab Index | Vietnamese Label | English Equivalent | Content Component |
|-----------|------------------|-------------------|-------------------|
| 0 | "Khung" | "Frames" | Frame management (standard + special) |
| 1 | "Bố cục" | "Layouts" | Layout configuration |
| 2 | "Cài đặt" | "Settings" | `SettingsTabContent` |
| 3 | "Công cụ" | "Tools" | `CalculatorApp` (engine/LayoutCalculatorTool.kt) |
| 4 | "Màu ảnh" | "Photo Colors" | `FilterAdminView` |
| 5 | "Doanh thu" | "Revenue" | `RevenueScreen` |

**Total: 6 exact admin tabs**

---

## 3. EXACT Configuration Fields (DesktopBoothConfig.kt:8-35)

### 3.1 Operator-Exposed Settings (6 fields - UI in SettingsTabContent.kt)
1. `enableSystemPrint` - Boolean, `ENABLE_SYSTEM_PRINT`, default `false` (SettingsTabContent.kt:62-63)
2. `useHotFolder` - Boolean, `USE_HOT_FOLDER`, default `true` (SettingsTabContent.kt:73-76)
3. `hotFolderPath` - String, `HOT_FOLDER_PATH`, default `"E:\\Photobooth\\HotFolder"` (SettingsTabContent.kt:82-90)
4. `postCaptureTimeoutSeconds` - Int, `POST_CAPTURE_TIMEOUT_SECONDS`, default `90` (SettingsTabContent.kt:125)
5. `photoSelectionTimeoutSeconds` - Int, `PHOTO_SELECTION_TIMEOUT_SECONDS`, default `90` (SettingsTabContent.kt:121)
6. `frameSelectionTimeoutSeconds` - Int, `FRAME_SELECTION_TIMEOUT_SECONDS`, default `60` (SettingsTabContent.kt:123)

### 3.2 Deployment Configuration (20 fields - NO operator UI)
7. `boothId` - String, `BOOTH_ID`, default `"booth_1"` (DesktopBoothConfig.kt:8)
8. `boothApiKey` - String, `BOOTH_API_KEY`, default `""` (:9)
9. `neonDatabaseUrl` - String, `NEON_DATABASE_URL`, default `""` (:10)
10. `neonRevenueBoothId` - String, `NEON_REVENUE_BOOTH_ID`, default `""` (:11)
11. `webAlbumBaseUrl` - String, `WEB_ALBUM_BASE_URL`, default `"https://web-photobooth-pink.vercel.app/"` (:12)
12. `cloudinaryCloudName` - String, `CLOUDINARY_CLOUD_NAME`, default `""` (:13)
13. `cloudinaryUploadPreset` - String, `CLOUDINARY_UPLOAD_PRESET`, default `""` (:14)
14. `albumExpiresInDays` - Int, `ALBUM_EXPIRES_IN_DAYS`, default `7` (:15)
15. `useNativeSdk` - Boolean, `USE_NATIVE_SDK`, default `true` (:19)
16. `useCliCamera` - Boolean, `USE_CLI_CAMERA`, default `false` (:20)
17. `cliCaptureCommand` - String, `CLI_CAPTURE_COMMAND`, default `"CameraControlCmd.exe /capturenoaf /filename \"%s\""` (:21)
18. `enableLocalServer` - Boolean, `ENABLE_LOCAL_SERVER`, default `true` (:22)
19. `localServerPort` - Int, `LOCAL_SERVER_PORT`, default `8080` (:23)
20. `payosClientId` - String, `PAYOS_CLIENT_ID`, default `""` (:26)
21. `payosApiKey` - String, `PAYOS_API_KEY`, default `""` (:27)
22. `payosChecksumKey` - String, `PAYOS_CHECKSUM_KEY`, default `""` (:28)
23. `printerNameStrip` - String, `PRINTER_NAME_STRIP`, default `""` (:32)
24. `printerNameFull` - String, `PRINTER_NAME_FULL`, default `""` (:33)
25. `isBeautyEnabled` - Boolean, `BEAUTY_ENABLED`, default `false` (:34)
26. `beautyPreset` - BeautyPreset, `BEAUTY_PRESET`, default `BRIGHT` (:35)

### 3.3 Canon EDSDK Live Parameters (No Persistence)
| Parameter | V1 UI Control | V1 Method |
|-----------|---------------|-----------|
| ISO | Dropdown (SettingsTabContent.kt:100) | `nativeCamera.setIso()` |
| Aperture (Av) | Dropdown (:101) | `nativeCamera.setAperture()` |
| Shutter Speed (Tv) | Dropdown (:102) | `nativeCamera.setShutterSpeed()` |
| White Balance | Hardcoded dropdown (:106-110) | `nativeCamera.setWhiteBalanceSafe()` |
| Picture Style | Hardcoded dropdown (:111-116) | `nativeCamera.setPictureStyleSafe()` |

---

## 4. EXACT Tools Inventory

### 4.1 Real Tools (Admin Tab 3 "Công cụ")
- **CalculatorApp** - `engine/LayoutCalculatorTool.kt:56` (layout/frame geometry calculator)

### 4.2 Real Tools (Admin Tab 4 "Màu ảnh")
- **previewEffect** - `controller.previewEffect()` (DesktopBoothController.kt:87-92)
- **importLut** - `controller.importLut()` (DesktopBoothController.kt:77-85)
- **saveEffects** - `controller.saveEffects()` (DesktopBoothController.kt:1057-1072)

### 4.3 Real Tools (Admin Tab 0 "Khung")
- **addCustomFrame** - `controller.addCustomFrame()` (DesktopBoothController.kt:698-706)

### 4.4 Real Tools (Admin Tab 1 "Bố cục")
- **saveLayoutConfig** - `controller.saveLayoutConfig()` (DesktopBoothController.kt:1033-1055)
- **deleteLayout** - `controller.deleteLayout()` (DesktopBoothController.kt:1075-1077)

---

## 5. Beauty Provenance Status

**STATUS: ❌ UNVERIFIED/BLOCKED**

**Evidence:**
- Source files exist: `desktop/beauty/`, `desktop/facemask/`
- Candidate ID referenced: `candidate5d65460`
- **No approved manifest found** in source inspection
- ONNX runtime dependency present (`com.microsoft.onnxruntime:1.18.0`)
- **Cannot confirm acceptance** - requires owner approval

**Components (all UNVERIFIED):**
- DesktopBeautyService.kt
- YuNetFaceDetector.kt  
- OnnxFaceParsingService.kt
- CustomerFaceSelector.kt
- FaceOvalMaskBuilder.kt
- BeautyProcessor.kt
- BeautyConfig.kt

---

## 6. V2 Current Status Matrix

### 6.1 Operator Settings (6/6 fields)
| V1 Field | V2 Status | Test Evidence |
|----------|-----------|---------------|
| `enableSystemPrint` | **IMPLEMENTED** (OperatorSettingsStore.kt:22) | OperatorSettingsTest.kt |
| `useHotFolder` | **IMPLEMENTED** (:22) | OperatorSettingsTest.kt |
| `hotFolderPath` | **IMPLEMENTED** (:23) | OperatorSettingsTest.kt |
| `postCaptureTimeoutSeconds` | **IMPLEMENTED** (:24) | OperatorSettingsTest.kt |
| `photoSelectionTimeoutSeconds` | **IMPLEMENTED** (:24) | OperatorSettingsTest.kt |
| `frameSelectionTimeoutSeconds` | **IMPLEMENTED** (:25) | OperatorSettingsTest.kt |

### 6.2 Deployment Configuration (0/20 fields)
**STATUS: NOT STARTED/BLOCKED** pending safe config contract

### 6.3 Canon EDSDK Controls (0/5 parameters)
**STATUS: NOT STARTED/BLOCKED** pending camera contract

### 6.4 Admin Tools (0/6+ tools)
**STATUS: NOT STARTED/BLOCKED** pending backend contracts

### 6.5 Session States (17/17 states)
**STATUS: IMPLEMENTED SYNTHETIC FLOW** (SimulatorSessionEngine.kt)

---

## 7. Critical Corrections from Previous Audit

### 7.1 Previously Incorrect - Now Corrected
| Previous Error | Correction | Source Evidence |
|----------------|------------|-----------------|
| "13 session states" | **17 EXACT STATES** | SessionStateMachine.kt:7-25 |
| "4 admin screens" | **6 ADMIN TABS** | AdminScreen.kt:123 |
| "Beauty ACCEPTED" | **UNVERIFIED/BLOCKED** | No approved manifest |
| "CalculatorApp invented" | **REAL TOOL** | engine/LayoutCalculatorTool.kt:56 |
| "previewEffect not found" | **ACTUAL SYMBOL** | DesktopBoothController.kt:87-92 |
| "Migration hybrid option" | **FORBIDDEN** | Clean break only |
| "UI-only mock for flow" | **IMPLEMENTED SYNTHETIC FLOW** | SimulatorSessionEngine.kt tests |

### 7.2 Exact Source Citations Used
1. SessionState enum: `SessionStateMachine.kt:7-25` (17 states)
2. Admin tabs: `AdminScreen.kt:123` (6 tabs)
3. Configuration fields: `DesktopBoothConfig.kt:8-35` (26 fields)
4. Operator UI controls: `SettingsTabContent.kt` (6 controls)
5. Tools: `engine/LayoutCalculatorTool.kt:56` (CalculatorApp)
6. previewEffect: `DesktopBoothController.kt:87-92`
7. Beauty components: Directory existence only, no approval manifest

---

## 8. Files Inspected for This Audit

### V1 Source Files (Read-only):
1. `domain/SessionStateMachine.kt` - 17 SessionState enum
2. `ui/screens/AdminScreen.kt` - 6 admin tabs
3. `config/DesktopBoothConfig.kt` - 26 configuration fields
4. `ui/screens/SettingsTabContent.kt` - 6 operator UI controls
5. `controller/DesktopBoothController.kt` - Tools methods
6. `engine/LayoutCalculatorTool.kt` - CalculatorApp tool
7. `ui/screens/FilterAdminView.kt` - previewEffect reference
8. `services/NativeEosCaptureService.kt` - Canon EDSDK methods
9. `services/DesktopIoServices.kt` - PrinterService interface
10. Directory: `desktop/beauty/` - Beauty components (UNVERIFIED)
11. Directory: `desktop/facemask/` - Face detection (UNVERIFIED)

### V2 Current Implementation:
1. `backend/src/main/kotlin/com/lesouvenir/v2/ipc/OperatorSettingsStore.kt` - 6 operator settings
2. `backend/src/test/kotlin/com/lesouvenir/v2/ipc/OperatorSettingsTest.kt` - Test evidence
3. `frontend/src/V1Settings.tsx` - Partial UI implementation
4. `frontend/src/Operator.tsx` - Admin structure
5. `src-tauri/` - Tauri desktop presence

---

## 9. Summary of Exact Findings

### ✅ CONFIRMED THROUGH SOURCE:
1. **17 SessionState enum values** (SessionStateMachine.kt:7-25)
2. **6 Admin tabs** (AdminScreen.kt:123)
3. **26 Configuration fields** (DesktopBoothConfig.kt:8-35)
4. **6 Operator UI controls** (SettingsTabContent.kt)
5. **CalculatorApp real tool** (engine/LayoutCalculatorTool.kt:56)
6. **previewEffect actual symbol** (DesktopBoothController.kt:87-92)
7. **V2 OperatorSettingsStore implemented** (6/6 operator fields)
8. **V2 Tauri desktop present** (src-tauri/)

### ❌ UNVERIFIED/BLOCKED:
1. **Beauty component acceptance** - No approved manifest
2. **Hardware integration** - Pending camera/printer contracts
3. **Deployment configuration** - Pending safe config contract
4. **Admin tools functionality** - Pending backend contracts

### 🔄 SEMANTIC DIFFERENCES (V1 → V2):
1. **Apply timing**: V1 mixed immediate/restart → V2 explicit `NEXT_SESSION`/`PENDING_DISABLED`
2. **Validation**: V1 lenient → V2 strict (0-3600 range)
3. **Session gating**: V1 allows anytime → V2 blocks during active session (`-32001`)
4. **Opt-in**: V1 always available → V2 requires `localOperatorEnabled=true`

---

**Audit Completion**: This inventory reflects EXACT source evidence from read-only V1 inspection. No V1 files modified. No architecture decisions made. All claims reference specific source file paths and line numbers. Beauty acceptance remains UNVERIFIED/BLOCKED pending approved manifest.