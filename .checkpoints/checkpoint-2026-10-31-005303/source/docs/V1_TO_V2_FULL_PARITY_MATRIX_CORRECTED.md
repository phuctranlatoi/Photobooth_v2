# V1 to V2 Full Parity Matrix - CORRECTED

**Authority Sources (V1 Read-only):**
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\domain\SessionStateMachine.kt:7-25` (17 SessionState enum)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\AdminScreen.kt:123` (6 admin tabs)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\config\DesktopBoothConfig.kt:8-35` (26 config fields)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\SettingsTabContent.kt` (6 operator UI controls)

---

## 1. EXACT Admin Tab Structure (AdminScreen.kt:123-141,226-241)

| Tab Index | V1 Label | Content | Line Reference | V2 Status |
|-----------|----------|---------|----------------|-----------|
| **0** | "Khung" | Frame management (standard + special frames) | AdminScreen.kt:142-191 | **NOT STARTED** (no backend contract) |
| **1** | "Bố cục" | Layout configuration | AdminScreen.kt:192-226 | **NOT STARTED** (no backend contract) |
| **2** | "Cài đặt" | `SettingsTabContent()` | AdminScreen.kt:227-236 | **PARTIAL** (V1Settings.tsx) |
| **3** | "Công cụ" | `CalculatorApp(config, layouts)` | AdminScreen.kt:237-239 | **NOT STARTED** (no backend contract) |
| **4** | "Màu ảnh" | `FilterAdminView(effects, onSaveEffects, onImportLut, onPreviewEffect)` | AdminScreen.kt:240-241 | **NOT STARTED** (no backend contract) |
| **5** | "Doanh thu" | `RevenueScreen(salesRepository, DesktopRevenueClient(), config)` | AdminScreen.kt:139-141 | **NOT STARTED** (no backend contract) |

---

## 2. Configuration Fields Parity - CORRECTED

### 2.1 V1 Configuration (26 Fields - DesktopBoothConfig.kt:8-35)
| # | Field | Type | Env Key | Default | UI Control | V2 Status |
|---|-------|------|---------|---------|------------|-----------|
| 1 | `boothId` | String | `BOOTH_ID` | `"booth_1"` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 2 | `boothApiKey` | String | `BOOTH_API_KEY` | `""` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 3 | `neonDatabaseUrl` | String | `NEON_DATABASE_URL` | `""` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 4 | `neonRevenueBoothId` | String | `NEON_REVENUE_BOOTH_ID` | `""` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 5 | `webAlbumBaseUrl` | String | `WEB_ALBUM_BASE_URL` | `"https://web-photobooth-pink.vercel.app/"` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 6 | `cloudinaryCloudName` | String | `CLOUDINARY_CLOUD_NAME` | `""` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 7 | `cloudinaryUploadPreset` | String | `CLOUDINARY_UPLOAD_PRESET` | `""` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 8 | `albumExpiresInDays` | Int | `ALBUM_EXPIRES_IN_DAYS` | `7` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 9 | `enableSystemPrint` | Boolean | `ENABLE_SYSTEM_PRINT` | `false` | Switch (SettingsTabContent.kt:62-63) | **IMPLEMENTED** (OperatorSettingsStore.kt:22) |
| 10 | `useHotFolder` | Boolean | `USE_HOT_FOLDER` | `true` | Cards (:73-76) | **IMPLEMENTED** (:22) |
| 11 | `hotFolderPath` | String | `HOT_FOLDER_PATH` | `"E:\\Photobooth\\HotFolder"` | TextField + Chooser (:82-90) | **IMPLEMENTED** (:23) |
| 12 | `useNativeSdk` | Boolean | `USE_NATIVE_SDK` | `true` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 13 | `useCliCamera` | Boolean | `USE_CLI_CAMERA` | `false` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 14 | `cliCaptureCommand` | String | `CLI_CAPTURE_COMMAND` | `"CameraControlCmd.exe ..."` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 15 | `enableLocalServer` | Boolean | `ENABLE_LOCAL_SERVER` | `true` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 16 | `localServerPort` | Int | `LOCAL_SERVER_PORT` | `8080` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 17 | `payosClientId` | String | `PAYOS_CLIENT_ID` | `""` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 18 | `payosApiKey` | String | `PAYOS_API_KEY` | `""` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 19 | `payosChecksumKey` | String | `PAYOS_CHECKSUM_KEY` | `""` | **None** | **NOT STARTED/BLOCKED** pending config contract |
| 20 | `postCaptureTimeoutSeconds` | Int | `POST_CAPTURE_TIMEOUT_SECONDS` | `90` | Stepper ±10s (:125) | **IMPLEMENTED** (:24) |
| 21 | `photoSelectionTimeoutSeconds` | Int | `PHOTO_SELECTION_TIMEOUT_SECONDS` | `90` | Stepper ±10s (:121) | **IMPLEMENTED** (:24) |
| 22 | `frameSelectionTimeoutSeconds` | Int | `FRAME_SELECTION_TIMEOUT_SECONDS` | `60` | Stepper ±10s (:123) | **IMPLEMENTED** (:25) |
| 23 | `printerNameStrip` | String | `PRINTER_NAME_STRIP` | `""` | Info chip (:67) | **NOT STARTED/BLOCKED** pending config contract |
| 24 | `printerNameFull` | String | `PRINTER_NAME_FULL` | `""` | Info chip (:68) | **NOT STARTED/BLOCKED** pending config contract |
| 25 | `isBeautyEnabled` | Boolean | `BEAUTY_ENABLED` | `false` | **None** | **NOT STARTED/BLOCKED** (Beauty UNVERIFIED) |
| 26 | `beautyPreset` | BeautyPreset | `BEAUTY_PRESET` | `BRIGHT` | **None** | **NOT STARTED/BLOCKED** (Beauty UNVERIFIED) |

### 2.2 Canon EDSDK Live Parameters (No Persistence)
| Parameter | V1 UI Control | V1 Method | V2 Status |
|-----------|---------------|-----------|-----------|
| ISO | Dropdown (SettingsTabContent.kt:100) | `nativeCamera.setIso()` | **NOT STARTED/BLOCKED** pending camera contract |
| Aperture (Av) | Dropdown (:101) | `nativeCamera.setAperture()` | **NOT STARTED/BLOCKED** pending camera contract |
| Shutter Speed (Tv) | Dropdown (:102) | `nativeCamera.setShutterSpeed()` | **NOT STARTED/BLOCKED** pending camera contract |
| White Balance | Hardcoded dropdown (:106-110) | `nativeCamera.setWhiteBalanceSafe()` | **NOT STARTED/BLOCKED** pending camera contract |
| Picture Style | Hardcoded dropdown (:111-116) | `nativeCamera.setPictureStyleSafe()` | **NOT STARTED/BLOCKED** pending camera contract |

---

## 3. Tools Parity - CORRECTED

### 3.1 Real Tools with Exact References
| Tool | V1 Implementation | Line Reference | V2 Status |
|------|-------------------|----------------|-----------|
| **CalculatorApp** | `engine.CalculatorApp(config, layouts)` | AdminScreen.kt:239 | **NOT STARTED** (no backend contract) |
| **FilterAdminView** | `FilterAdminView(effects, onSaveEffects, onImportLut, onPreviewEffect)` | AdminScreen.kt:241 | **NOT STARTED** (no backend contract) |
| **previewEffect** | `onPreviewEffect: (EffectMode, BufferedImage) -> BufferedImage` | FilterAdminView.kt:45 | **NOT STARTED** (no backend contract) |
| **importLut** | `onImportLut: (Path) -> Unit` | FilterAdminView.kt:44 | **NOT STARTED** (no backend contract) |
| **saveEffects** | `onSaveEffects: (List<EffectMode>) -> Unit` | FilterAdminView.kt:43 | **NOT STARTED** (no backend contract) |
| **addCustomFrame** | `controller.addCustomFrame()` | AdminScreen.kt:266 | **NOT STARTED** (no backend contract) |
| **saveLayoutConfig** | `controller.saveLayoutConfig()` | AdminScreen.kt:272 | **NOT STARTED** (no backend contract) |
| **deleteLayout** | `controller.deleteLayout()` | AdminScreen.kt:275 | **NOT STARTED** (no backend contract) |
| **RevenueScreen** | `RevenueScreen(salesRepository, DesktopRevenueClient(), config)` | AdminScreen.kt:141 | **NOT STARTED** (no backend contract) |

### 3.2 NOT Tools (Previously Misclassified)
| Item | Classification | Reason |
|------|---------------|--------|
| **Session state transitions** | Core application flow | Not operator tools |
| **Camera parameter controls** | Hardware integration | Not operator tools |
| **Print job submission** | Customer flow | Not operator tools |
| **Beauty processing** | Image pipeline | Not operator tools |

---

## 4. V2 Current Implementation Status

### 4.1 Operator Settings (6/6 fields IMPLEMENTED)
| V1 Field | V2 Store Default | Validation | Test Coverage |
|----------|-----------------|------------|---------------|
| `enableSystemPrint` | `false` (OperatorSettingsStore.kt:22) | Boolean strict | OperatorSettingsTest.kt |
| `useHotFolder` | `true` (:22) | Boolean strict | OperatorSettingsTest.kt |
| `hotFolderPath` | `workspace/backend/build/hot-folder` (:23) | String 1-1024 chars | OperatorSettingsTest.kt |
| `postCaptureTimeoutSeconds` | `90` (:24) | 0-3600 integer | OperatorSettingsTest.kt |
| `photoSelectionTimeoutSeconds` | `90` (:24) | 0-3600 integer | OperatorSettingsTest.kt |
| `frameSelectionTimeoutSeconds` | `60` (:25) | 0-3600 integer | OperatorSettingsTest.kt |

### 4.2 Session States (17/17 IMPLEMENTED SYNTHETIC FLOW)
- **Source**: SessionStateMachine.kt:7-25 (17 exact states)
- **V2**: SimulatorSessionEngine.kt (synthetic flow)
- **Test**: 20/42 tests (one fail observed)

### 4.3 Admin Structure (PARTIAL)
- **6 Tab structure**: Operator.tsx (UI mock)
- **Settings tab**: V1Settings.tsx (partial - controls disabled)
- **Other tabs**: Placeholder UI only

### 4.4 Desktop Framework (PRESENT)
- **Tauri**: src-tauri/ directory present
- **Fullscreen fidelity**: Unverified

---

## 5. Semantic Differences V1 → V2

### 5.1 Apply Timing
| Setting | V1 Apply Semantics | V2 Apply Semantics | Difference |
|---------|-------------------|-------------------|------------|
| Operator settings | Mixed: some immediate via `activeConfig`, some require restart | Explicit: `appliesTo: "NEXT_SESSION"`, `hardwareApply: "PENDING_DISABLED"` | V2 more conservative |
| Canon params | Immediate hardware (no persistence) | **NOT STARTED/BLOCKED** | N/A |
| Deployment config | Restart required | **NOT STARTED/BLOCKED** | N/A |

### 5.2 Validation
| Aspect | V1 (DesktopConfigLoader) | V2 (OperatorSettingsStore) | Difference |
|--------|--------------------------|----------------------------|------------|
| Booleans | `toBooleanFlag()` (lenient: 1/true/yes/y/on) | Strict JSON boolean | V2 stricter |
| `useHotFolder` | `toBooleanStrictOrNull()` (only "true"/"false") | Strict JSON boolean | Similar |
| Timeouts | `toIntOrNull() ?: default` (no clamp) | `0..3600` integer, rejects invalid | V2 stricter |
| Key set | Accepts any keys | Exact 6 keys required | V2 stricter |

### 5.3 Session Gating
| Operation | V1 | V2 | Difference |
|-----------|----|----|------------|
| Save settings | Allowed mid-session (AdminScreen.kt:100) | Blocked during active session (`-32001` error) | V2 stricter |
| Operator access | Always available via 5-tap | Requires `localOperatorEnabled=true` | V2 explicit |

### 5.4 Error Handling
| Error Type | V1 Pattern | V2 Pattern | Difference |
|------------|------------|------------|------------|
| Validation | Silent fallback to defaults | Throws `-32602` with field details | V2 more explicit |
| Hardware | Error frames in live view | Production gates (all false) | V2 more honest |
| File ops | Exception in status text | Structured error response | V2 more structured |

---

## 6. Beauty Provenance - CORRECTED

**STATUS: ❌ UNVERIFIED/BLOCKED**

**Evidence:**
- Source files exist: `desktop/beauty/`, `desktop/facemask/`
- Candidate referenced: `candidate5d65460`
- **No approved manifest found** in source inspection
- ONNX runtime dependency present
- **Cannot copy/retune without approval**

**Components (all UNVERIFIED):**
- `DesktopBeautyService.kt` - Orchestration
- `YuNetFaceDetector.kt` - Face detection
- `OnnxFaceParsingService.kt` - Face parsing
- `CustomerFaceSelector.kt` - Role classification
- `FaceOvalMaskBuilder.kt` - Mask building
- `BeautyProcessor.kt` - Filter application
- `BeautyConfig.kt` - Configuration

---

## 7. Critical Gaps & Blockers

### 7.1 BLOCKED Pending Contracts
| Category | Components | Blocked On |
|----------|------------|------------|
| **Camera Hardware** | Canon EDSDK, webcam, hot folder | Camera contract |
| **Printer Hardware** | SystemPrinterService, DNP RX1HS | Printer contract |
| **Beauty Pipeline** | All beauty components | Approved manifest |
| **Deployment Config** | 20 non-operator fields | Safe config contract |
| **Admin Tools** | CalculatorApp, FilterAdminView, etc. | Backend contracts |

### 7.2 HIGH PRIORITY Gaps
| Gap | Impact | Required Action |
|-----|--------|-----------------|
| **Enable V1Settings controls** | Operator cannot configure | Backend auth to enable UI controls |
| **File chooser integration** | No frame/LUT import | Tauri dialog API implementation |
| **Complete hot folder UI** | Path configuration incomplete | Text field + file chooser |
| **Production gates real values** | Always false in simulator | Hardware detection integration |

### 7.3 NOT Gaps (V2 Improvements)
| Aspect | V1 | V2 | Rationale |
|--------|----|----|-----------|
| **Validation** | Lenient fallbacks | Strict rejection | V2 safer |
| **Atomic writes** | In-place .env edit | Temp file + atomic move | V2 more robust |
| **Session gating** | Save anytime | Blocked during session | V2 prevents confusion |
| **Opt-in requirement** | Always available | `localOperatorEnabled` flag | V2 explicit for simulator |

---

## 8. Test Coverage Matrix

### 8.1 V1 Test Evidence (Limited)
| Test Area | Evidence | Coverage |
|-----------|----------|----------|
| **Revenue/Print** | `RevenueAccountingTest.kt` | Print gating, sale recording |
| **Layout Calculation** | `FrameEngineTest.kt`, `LayoutCalculatorTool.kt` | Layout math |
| **Settings Persistence** | **NONE FOUND** | **GAP** |
| **Timer Behavior** | **NONE FOUND** | **GAP** |
| **Hardware Integration** | **NONE FOUND** | **GAP** |

### 8.2 V2 Current Tests (OperatorSettingsTest.kt)
| Test | Coverage | Status |
|------|----------|--------|
| **Persisted Zero Timeout** | Zero timeout auto-completes session | **AUTOMATED TESTED** |
| **Save/Reload Invalid** | Validation rejects invalid values | **AUTOMATED TESTED** |
| **Opt-in & Session Gating** | `localOperatorEnabled` flag, session block | **AUTOMATED TESTED** |
| **Atomic Write** | File integrity after failed validation | **AUTOMATED TESTED** |

### 8.3 Session Flow Tests
- **Total tests**: 42 (20 pass, 1 fail, 21 not run per logs)
- **Scope**: Synthetic session flow in simulator
- **Status**: **IMPLEMENTED SYNTHETIC FLOW** (not "UI-only mock")

---

## 9. Implementation Priority - CORRECTED

### 9.1 HIGH PRIORITY (User Settings/Tools)
1. **Enable V1Settings controls** - With backend auth (not blindly)
2. **File chooser integration** - Tauri dialog for frame/LUT import
3. **Complete hot folder UI** - Text field + file chooser
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

## 10. Exact Source Citations

### 10.1 Session States
- `SessionStateMachine.kt:7-25` - 17 exact enum values
- `Main.kt:125-289` - Observed transitions for 13 states
- `COMPOSING`, `RECOVERY`, `OUT_OF_SERVICE` declared but not observed in Main.kt flows

### 10.2 Admin Tabs
- `AdminScreen.kt:123` - 6 tab labels
- `:139-141` - Tab 5 RevenueScreen
- `:226-236` - Tab 2 SettingsTabContent
- `:237-239` - Tab 3 CalculatorApp(config, layouts)
- `:240-241` - Tab 4 FilterAdminView callbacks

### 10.3 Configuration
- `DesktopBoothConfig.kt:8-35` - 26 fields with defaults
- `SettingsTabContent.kt:62-125` - 6 operator UI controls

### 10.4 Tools
- `AdminScreen.kt:239` - CalculatorApp real tool
- `FilterAdminView.kt:43-45` - onSaveEffects, onImportLut, onPreviewEffect callbacks
- `DesktopBoothController.kt:87-92` - previewEffect implementation

### 10.5 V2 Implementation
- `OperatorSettingsStore.kt:22-25` - 6 operator settings defaults
- `OperatorSettingsTest.kt` - Test coverage
- `V1Settings.tsx` - Partial UI implementation
- `src-tauri/` - Tauri desktop presence

---

**Correction Complete**: This matrix reflects EXACT source evidence from read-only V1 inspection. All claims reference specific source file paths and line numbers. No V1 files modified. No architecture decisions made. Beauty acceptance remains UNVERIFIED/BLOCKED pending approved manifest.