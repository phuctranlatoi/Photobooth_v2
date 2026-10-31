# V1 to V2 Full Parity Matrix

> **Superseding automated status — 2026-11-01:** The current automated baseline is **100% green**: frontend **29/29 tests across 7/7 files**, backend **42/42 tests across 12/12 suites**, and the frontend production build succeeds. The timeout/cancel matrix now passes. Migration inventory confirms **11 customer screens**, **6 operator tabs**, and migrated Tools/Settings surfaces. This is completion of the automated baseline migration/integration scope—not a claim that mocks prove Canon/DNP, physical touch, production providers, packaging, Beauty/model licensing, or print-output parity. Those remain release gates.

> **Gatekeeper update — 2026-10-31 23:26:** V2 contains the reported **11 customer screens**, **6 operator tabs**, Settings and Tools surfaces. Retained backend JUnit reports are green (**12 suites/42 tests, 0 failures/errors/skips**) and resolve the prior timeout fixture regression. However, the fresh frontend run is **27/28**, not 28/28: the unacknowledged Settings save incorrectly permits registered Admin exit. Presence and simulated coverage do not establish full parity; real Canon/DNP, production providers, Beauty/LUT output, physical touch, packaging and licensing remain unverified. This document's older completion language is therefore not release signoff.

**Authority Sources (V1 Read-only):**
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\controller\DesktopBoothController.kt` (Core logic)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\config\DesktopBoothConfig.kt` (26 config fields)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\SettingsTabContent.kt` (UI controls)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\config\SettingsManager.kt` (Persistence)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\services\*.kt` (Hardware services)

**V2 Current State:**
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\backend\src\main\kotlin\com\lesouvenir\v2\ipc\OperatorSettingsStore.kt` (6 operator settings)
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\frontend\src\V1Settings.tsx` (UI implementation)
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\docs\V1_SETTINGS_PARITY_MATRIX.md` (Existing analysis)

---

## 1. Configuration Fields Parity Matrix

### 1.1 Complete V1 Configuration Inventory (26 Fields)

| # | Field | Type | Default | Env Key | Source (Line) | UI Control | Persistence | Apply Semantics |
|---|-------|------|---------|---------|---------------|------------|-------------|-----------------|
| 1 | `boothId` | String | `"booth_1"` | `BOOTH_ID` | DesktopBoothConfig.kt L8 | **None** | `.env` | Restart required |
| 2 | `boothApiKey` | String | `""` | `BOOTH_API_KEY` | L9 | **None** | `.env` | Restart required |
| 3 | `neonDatabaseUrl` | String | `""` | `NEON_DATABASE_URL` | L10 | **None** | `.env` | Restart required |
| 4 | `neonRevenueBoothId` | String | `""` | `NEON_REVENUE_BOOTH_ID` | L11 | **None** | `.env` | Restart required |
| 5 | `webAlbumBaseUrl` | String | `"https://web-photobooth-pink.vercel.app/"` | `WEB_ALBUM_BASE_URL` | L12 | **None** | `.env` | Restart required |
| 6 | `cloudinaryCloudName` | String | `""` | `CLOUDINARY_CLOUD_NAME` | L13 | **None** | `.env` | Restart required |
| 7 | `cloudinaryUploadPreset` | String | `""` | `CLOUDINARY_UPLOAD_PRESET` | L14 | **None** | `.env` | Restart required |
| 8 | `albumExpiresInDays` | Int | `7` | `ALBUM_EXPIRES_IN_DAYS` | L15 | **None** | `.env` | Restart required |
| 9 | `enableSystemPrint` | Boolean | `false` | `ENABLE_SYSTEM_PRINT` | L16 | **Switch** (SettingsTabContent L62-63) | `.env` via `saveDeviceSettings()` | Immediate for next print |
| 10 | `useHotFolder` | Boolean | `true` | `USE_HOT_FOLDER` | L17 | **Cards** (L73-76) | `.env` via `saveDeviceSettings()` | Requires restart (service constructor) |
| 11 | `hotFolderPath` | String | `"E:\\Photobooth\\HotFolder"` | `HOT_FOLDER_PATH` | L18 | **TextField + Chooser** (L82-90) | `.env` via `saveDeviceSettings()` | Requires restart |
| 12 | `useNativeSdk` | Boolean | `true` | `USE_NATIVE_SDK` | L19 | **None** | `.env` | Requires restart |
| 13 | `useCliCamera` | Boolean | `false` | `USE_CLI_CAMERA` | L20 | **None** | `.env` | Requires restart |
| 14 | `cliCaptureCommand` | String | `"CameraControlCmd.exe ..."` | `CLI_CAPTURE_COMMAND` | L21 | **None** | `.env` | Requires restart |
| 15 | `enableLocalServer` | Boolean | `true` | `ENABLE_LOCAL_SERVER` | L22 | **None** | `.env` | Requires restart |
| 16 | `localServerPort` | Int | `8080` | `LOCAL_SERVER_PORT` | L23 | **None** | `.env` | Requires restart |
| 17 | `payosClientId` | String | `""` | `PAYOS_CLIENT_ID` | L26 | **None** | `.env` | Restart required |
| 18 | `payosApiKey` | String | `""` | `PAYOS_API_KEY` | L27 | **None** | `.env` | Restart required |
| 19 | `payosChecksumKey` | String | `""` | `PAYOS_CHECKSUM_KEY` | L28 | **None** | `.env` | Restart required |
| 20 | `postCaptureTimeoutSeconds` | Int | `90` | `POST_CAPTURE_TIMEOUT_SECONDS` | L29 | **Stepper ±10s** (L125) | `.env` via `saveDeviceSettings()` | Immediate for next timer |
| 21 | `photoSelectionTimeoutSeconds` | Int | `90` | `PHOTO_SELECTION_TIMEOUT_SECONDS` | L30 | **Stepper ±10s** (L121) | `.env` via `saveDeviceSettings()` | Immediate for next timer |
| 22 | `frameSelectionTimeoutSeconds` | Int | `60` | `FRAME_SELECTION_TIMEOUT_SECONDS` | L31 | **Stepper ±10s** (L123) | `.env` via `saveDeviceSettings()` | Immediate for next timer |
| 23 | `printerNameStrip` | String | `""` | `PRINTER_NAME_STRIP` | L32 | **Info chip** (L67) | `.env` | Restart required |
| 24 | `printerNameFull` | String | `""` | `PRINTER_NAME_FULL` | L33 | **Info chip** (L68) | `.env` | Restart required |
| 25 | `isBeautyEnabled` | Boolean | `false` | `BEAUTY_ENABLED` | L34 | **None** | `.env` | Restart required |
| 26 | `beautyPreset` | BeautyPreset | `BRIGHT` | `BEAUTY_PRESET` | L35 | **None** | `.env` | Restart required |

### 1.2 Canon EDSDK Live Parameters (No Persistence)
| # | Parameter | Type | UI Control | Source | Apply |
|---|-----------|------|------------|--------|-------|
| 27 | ISO | String | Dropdown (L100) | NativeEosCaptureService.kt L84-86 | Immediate hardware |
| 28 | Aperture (Av) | String | Dropdown (L101) | L88-90 | Immediate hardware |
| 29 | Shutter Speed (Tv) | String | Dropdown (L102) | L92-94 | Immediate hardware |
| 30 | White Balance | Enum | Hardcoded dropdown (L106-110) | L96-101 | Immediate hardware |
| 31 | Picture Style | Enum | Hardcoded dropdown (L111-116) | L103-108 | Immediate hardware |

---

## 2. V2 Current Implementation Status

### 2.1 OperatorSettingsStore (6/26 Fields Implemented)
| V1 Field | V2 Implementation | Status | Validation | Gap Analysis |
|----------|-------------------|--------|------------|--------------|
| `enableSystemPrint` | `OperatorSettingsStore.defaults` L22 | **IMPLEMENTED** | Boolean check L43 | ✓ Parity |
| `useHotFolder` | `OperatorSettingsStore.defaults` L22 | **IMPLEMENTED** | Boolean check L43 | ✓ Parity |
| `hotFolderPath` | `OperatorSettingsStore.defaults` L23 | **IMPLEMENTED** | String 1-1024 chars L44 | Default path differs (V2 isolated) |
| `postCaptureTimeoutSeconds` | `OperatorSettingsStore.defaults` L24 | **IMPLEMENTED** | 0-3600 integer L45 | ✓ Parity |
| `photoSelectionTimeoutSeconds` | `OperatorSettingsStore.defaults` L24 | **IMPLEMENTED** | 0-3600 integer L45 | ✓ Parity |
| `frameSelectionTimeoutSeconds` | `OperatorSettingsStore.defaults` L25 | **IMPLEMENTED** | 0-3600 integer L45 | ✓ Parity |

### 2.2 Frontend V1Settings.tsx Implementation
| UI Component | V1 Source | V2 Implementation | Status | Fidelity |
|--------------|-----------|-------------------|--------|----------|
| **Header & Status Cards** | SettingsTabContent L44-55 | V1Settings.tsx L15 | **IMPLEMENTED** | ✓ Visual match |
| **Print Switch** | L62-63 | V1Settings.tsx (partial) | **PARTIAL** | Control exists, disabled |
| **Camera Option Cards** | L73-76 | V1Settings.tsx (partial) | **PARTIAL** | Control exists, disabled |
| **Hot Folder Path Field** | L82-90 | **MISSING** | **NOT STARTED** | No file chooser |
| **Timeout Steppers** | L121-125 | V1Settings.tsx L14 | **IMPLEMENTED** | ✓ 10s increments, 0-3600 |
| **Save Button** | L134-137 | V1Settings.tsx L12 | **IMPLEMENTED** | ✓ Vietnamese text |
| **Canon EDSDK Controls** | L96-118 | **ABSENT** | **NOT STARTED** | Hardware-specific |
| **Printer Info Chips** | L65-69 | **ABSENT** | **NOT STARTED** | Config display only |

### 2.3 IPC Contract (OperatorSettingsTest.kt)
| IPC Method | V2 Implementation | V1 Equivalent | Status |
|------------|-------------------|---------------|--------|
| `operator.getSettings` | `OperatorSettingsStore.response()` L67-74 | `activeConfig` flow | **IMPLEMENTED** |
| `operator.updateSettings` | `OperatorSettingsStore.update()` L50-66 | `saveDeviceSettings()` | **IMPLEMENTED** |
| **Session Gating** | Error `-32001` if active session | Allowed anytime | **STRICTER (V2)** |
| **Opt-in Requirement** | `localOperatorEnabled=true` | Always available | **EXPLICIT (V2)** |
| **Production Gates** | All false in envelope | Implicit hardware | **HONEST (V2)** |

---

## 3. Detailed Parity Analysis by Category

### 3.1 Deployment Configuration (Not Operator UI)
**V1 Fields**: `boothId`, `boothApiKey`, `neonDatabaseUrl`, `neonRevenueBoothId`, `webAlbumBaseUrl`, `cloudinaryCloudName`, `cloudinaryUploadPreset`, `albumExpiresInDays`, `payosClientId`, `payosApiKey`, `payosChecksumKey`

| Aspect | V1 | V2 | Recommendation |
|--------|----|----|---------------|
| **Storage** | `.env` files | **NOT STARTED** | New config system needed |
| **UI Exposure** | Never in operator UI | **NOT APPLICABLE** | Keep as deployment config |
| **Validation** | Minimal (not blank) | **NOT STARTED** | Strong validation required |
| **Apply Timing** | Restart required | **NOT STARTED** | Document as restart-only |

### 3.2 Hardware Selection (Partial Operator UI)
**V1 Fields**: `useNativeSdk`, `useCliCamera`, `cliCaptureCommand`, `enableLocalServer`, `localServerPort`

| Field | V1 UI | V2 Status | Rationale |
|-------|-------|-----------|-----------|
| `useNativeSdk` | None (hardcoded true) | **NOT STARTED** | Architecture decision, not operator |
| `useCliCamera` | None | **NOT STARTED** | Niche fallback, not operator |
| `cliCaptureCommand` | None | **NOT STARTED** | Technical config, not operator |
| `enableLocalServer` | None (status display) | **NOT STARTED** | Internal service, not operator |
| `localServerPort` | None (status display) | **NOT STARTED** | Port config, not operator |

### 3.3 Printer Configuration
**V1 Fields**: `printerNameStrip`, `printerNameFull`, `enableSystemPrint`

| Field | V1 UI | V2 Status | Gap |
|-------|-------|-----------|-----|
| `enableSystemPrint` | Switch control | **IMPLEMENTED** | ✓ Parity |
| `printerNameStrip` | Info chip only | **NOT STARTED** | Display only, not operator control |
| `printerNameFull` | Info chip only | **NOT STARTED** | Display only, not operator control |

### 3.4 Beauty Configuration
**V1 Fields**: `isBeautyEnabled`, `beautyPreset`

| Field | V1 UI | V2 Status | Provenance |
|-------|-------|-----------|------------|
| `isBeautyEnabled` | None | **NOT STARTED** | Feature toggle, not per-session |
| `beautyPreset` | None | **NOT STARTED** | Algorithm preset, not operator |

**Beauty Provenance**: All beauty components (`desktop/beauty/`, `desktop/facemask/`) exist in production V1. ONNX runtime dependency confirmed. No evidence of experimental code.

### 3.5 Timeout Configuration
**V1 Fields**: `postCaptureTimeoutSeconds`, `photoSelectionTimeoutSeconds`, `frameSelectionTimeoutSeconds`

| Aspect | V1 Implementation | V2 Implementation | Parity |
|--------|-------------------|-------------------|--------|
| **Defaults** | 90, 90, 60 seconds | 90, 90, 60 seconds | ✓ Exact |
| **UI Control** | Steppers ±10s, 0-3600 | Steppers ±10s, 0-3600 | ✓ Exact |
| **Validation** | Loader: `toIntOrNull() ?: default` | Store: strict 0-3600 integer | ✓ Stricter (V2) |
| **Apply Timing** | Immediate via `activeConfig` | `appliesTo: "NEXT_SESSION"` | ✓ Explicit (V2) |
| **Zero Behavior** | Immediate timeout handler | Not tested | **UNVERIFIED** |

### 3.6 Hot Folder Configuration
**V1 Fields**: `useHotFolder`, `hotFolderPath`

| Aspect | V1 Implementation | V2 Implementation | Gap |
|--------|-------------------|-------------------|-----|
| **Default Path** | `"E:\\Photobooth\\HotFolder"` | `workspace/backend/build/hot-folder` | **V2 isolated** |
| **UI Control** | Cards + text field + file chooser | Cards only (path missing) | **INCOMPLETE** |
| **File Chooser** | Native JFileChooser | **MISSING** | **NOT STARTED** |
| **Apply Semantics** | Requires restart (service constructor) | `hardwareApply: "PENDING_DISABLED"` | ✓ Explicit |

---

## 4. Settings Load/Save Semantics Comparison

### 4.1 Loading Precedence
| Layer | V1 (DesktopConfigLoader.kt L46-54) | V2 (OperatorSettingsStore.kt) |
|-------|------------------------------------|-------------------------------|
| **Primary** | `appDataDir/.env` (user config) | `workspace/backend/config/operator-settings.json` |
| **Fallback** | `workingDir()/.env` (project) | `defaults` in code |
| **Override** | System environment variables | **None** (isolated) |
| **Merge Logic** | Later overrides earlier | Single source of truth |

### 4.2 Persistence Mechanism
| Aspect | V1 (SettingsManager.kt) | V2 (OperatorSettingsStore.kt) |
|--------|--------------------------|-------------------------------|
| **Format** | `.env` key=value | JSON with schema version |
| **Update** | In-place key replacement | Atomic write via temp file |
| **Preservation** | Keeps comments, blank lines | Complete replacement |
| **Validation** | None on write | Strict validation before write |
| **Error Handling** | Silent failure possible | Throws on validation error |

### 4.3 Apply Behavior Taxonomy
| Category | V1 Fields | V1 Behavior | V2 Equivalent |
|----------|-----------|-------------|---------------|
| **Restart Required** | 20 fields (all non-UI) | Next process start | `appliesTo: "NEXT_SESSION"` |
| `activeConfig` Immediate | 6 operator fields | Next logical use | `appliesTo: "NEXT_SESSION"` |
| **Hardware Immediate** | 5 Canon params | Instant on change | Out of scope (camera IPC) |
| **Never Persisted** | Canon params | Live only, no save | Not applicable |

### 4.4 Validation Rules Comparison
| Validation | V1 (DesktopConfigLoader) | V2 (OperatorSettingsStore) |
|------------|---------------------------|----------------------------|
| **Booleans** | `toBooleanFlag()` (lenient: 1/true/yes/y/on) | Strict JSON boolean |
| `useHotFolder` | `toBooleanStrictOrNull()` (only "true"/"false") | Strict JSON boolean |
| **Timeouts** | `toIntOrNull() ?: default` (no clamp) | `0..3600` integer, rejects invalid |
| **Path Length** | None | 1-1024 characters, no control chars |
| **Key Set** | Accepts any keys | Exact 6 keys required |

---

## 5. Runtime Behavior Parity

### 5.1 Inactivity Timer (DesktopBoothController.kt L245-310)
| Behavior | V1 Implementation | V2 Status |
|----------|-------------------|-----------|
| **Timer States** | `SELECTING_PHOTOS`, `EDITING`, `PRINT_PENDING` | **NOT STARTED** |
| **Timeout Source** | `activeConfig.value.*timeoutSeconds` | **NOT STARTED** |
| **Countdown Display** | Updates `_inactivityTimeLeft` each second | **NOT STARTED** |
| **Zero Timeout** | Immediate handler invocation | **UNVERIFIED** |
| **Auto-print on Timeout** | `startPrinting(userConfirmed=false)` | **NOT STARTED** |
| **Revenue Gate** | `userConfirmed && printJob.await()` | **NOT STARTED** |

### 5.2 Save Feedback & UI Flow
| Aspect | V1 (SettingsTabContent.kt) | V2 (V1Settings.tsx) |
|--------|----------------------------|---------------------|
| **Save Trigger** | Button click L134-137 | `save()` function L12 |
| **Success Feedback** | "Đã lưu cài đặt" toast for 3s L40-41 | Notice message L12 |
| **Error Feedback** | None (fire-and-forget) | Error state display L10 |
| **Auto-save on Exit** | AdminScreen back button L100 | `registerExit` callback L13 |
| **Session Blocking** | Allowed mid-session | Blocked (`-32001` error) |

### 5.3 Canon EDSDK Integration
| Feature | V1 (NativeEosCaptureService.kt) | V2 Status |
|---------|---------------------------------|-----------|
| **Live View** | `beginLiveView()`, `downloadLiveView()` ~30fps | **NOT STARTED** |
| **Auto-reconnect** | 2-second loop, re-instantiate on failure | **NOT STARTED** |
| **Face Tracking AF** | `setProperty(kEdsPropID_Evf_AFMode, 2L)` | **NOT STARTED** |
| **Parameter Sync** | One-way set (no readback guarantee) | **NOT STARTED** |
| **Error Frames** | Black screen with red error text | **NOT STARTED** |

---

## 6. Gap Analysis & Implementation Priority

### 6.1 Critical Gaps (Block V2 Release)
| Gap | Impact | Required Action |
|-----|--------|-----------------|
| **Hot Folder Path UI Missing** | Operator cannot configure path | Implement text field + file chooser |
| **Canon EDSDK Controls Absent** | No camera parameter control | Defer to Camera Engineer IPC |
| **Printer Info Display Missing** | Operator cannot see printer names | Implement config display chips |
| **Session Timer Integration** | No timeout behavior | Implement timer with `activeConfig` pattern |
| **Save During Session Block** | V1 allows, V2 blocks | Document behavior change |

### 6.2 Important Gaps (Feature Completeness)
| Gap | Impact | Recommended Action |
|-----|--------|-------------------|
| **File Chooser Integration** | No native folder selection | Tauri dialog API or fallback |
| **Production Gates Real Values** | Always false in simulator | Connect to hardware detection |
| **Apply Messaging Accuracy** | Generic "restart required" | Per-field apply semantics |
| **Validation Error Display** | Generic error messages | Field-specific validation feedback |
| **Zero Timeout Behavior** | Unverified auto-print | Test and document behavior |

### 6.3 Optional Gaps (Nice-to-Have)
| Gap | Impact | Defer Rationale |
|-----|--------|-----------------|
| **Canon Param Persistence** | Live-only in V1 | Hardware-specific, not operator |
| **Printer Enumeration** | Manual .env entry in V1 | Complex, low operator value |
| **Beauty Toggle in UI** | Deployment config in V1 | Product decision, not operator |
| **Multiple .env Source Support** | V1 has precedence chain | V2 isolation simplifies |

### 6.4 Non-Gaps (V2 Improvements)
| Aspect | V1 | V2 | Rationale |
|--------|----|----|-----------|
| **Validation Strictness** | Lenient fallbacks | Strict rejection | V2 safer |
| **Atomic Writes** | In-place .env edit | Temp file + atomic move | V2 more robust |
| **Session Gating** | Save anytime | Blocked during session | V2 prevents mid-session confusion |
| **Opt-in Requirement** | Always available | `localOperatorEnabled` flag | V2 explicit for simulator |
| **Production Gates** | Implicit hardware | Explicit all-false | V2 honest about capabilities |

---

## 7. Test Coverage Matrix

### 7.1 V1 Test Evidence
| Test Area | V1 Evidence | Coverage |
|-----------|-------------|----------|
| **Revenue/Print Integration** | `RevenueAccountingTest.kt` | Print gating, sale recording |
| **Layout Calculation** | `FrameEngineTest.kt`, `LayoutCalculatorTool.kt` | Layout math, frame positioning |
| **Settings Persistence** | None found | **GAP** |
| **Timer Behavior** | None found | **GAP** |
| **Hardware Integration** | None found | **GAP** |

### 7.2 V2 Current Tests (OperatorSettingsTest.kt)
| Test | Coverage | Status |
|------|----------|--------|
| **Persisted Zero Timeout** | Zero timeout auto-completes session | **AUTOMATED TESTED** |
| **Save/Reload Invalid** | Validation rejects invalid values | **AUTOMATED TESTED** |
| **Opt-in & Session Gating** | `localOperatorEnabled` flag, session block | **AUTOMATED TESTED** |
| **Atomic Write** | File integrity after failed validation | **AUTOMATED TESTED** |

### 7.3 Required Additional Tests
| Test Area | V1 Behavior to Verify | Test Strategy |
|-----------|-----------------------|---------------|
| **Zero Timeout Auto-print** | `startPrinting(userConfirmed=false)` | Simulator session with zero timeout |
| **Partial Update** | V1 updates 6 fields together | V2 should accept partial updates |
| **Concurrent Access** | V1 UI single-threaded (Compose) | V2 IPC concurrent safety |
| **Schema Migration** | N/A (V1 .env format) | Future V2 schema upgrades |
| **File Chooser Integration** | Native JFileChooser dialog | Tauri dialog API testing |

---

## 8. Implementation Recommendations

### 8.1 Immediate Actions (Settings/Tools Parity)
1. **Complete Hot Folder UI** - Add text field and file chooser to V1Settings.tsx
2. **Implement Printer Info Display** - Add config display chips for printer names
3. **Connect Production Gates** - Real hardware detection for gate values
4. **Add Apply Semantics Display** - Per-field "restart required" messaging
5. **Test Zero Timeout Behavior** - Verify auto-print logic matches V1

### 8.2 Deferred to Specialists
1. **Canon EDSDK Controls** → Camera Engineer (hardware IPC surface)
2. **Beauty Configuration** → Product decision (deployment vs operator)
3. **Printer Enumeration** → Printer Engineer (Windows printer listing)
4. **File Chooser Native** → Tauri/Electron specialist (dialog API)

### 8.3 Architectural Decisions Needed
| Decision | Options | Recommendation |
|----------|---------|----------------|
| **V1 .env Migration** | Read on first run, Clean isolation | **Clean isolation** (current) |
| **Operator vs Deployment Config** | All in UI, Split as V1, New taxonomy | **Split as V1** (6 operator fields) |
| **Canon Params in IPC** | Dedicated camera IPC, Not in operator | **Dedicated camera IPC** |
| **Printer Name UI** | Enumeration dropdown, Manual .env entry | **Manual .env entry** (as V1) |

### 8.4 Files to Modify (Ownership)
| File | Owner | Changes Required |
|------|-------|------------------|
| `frontend/src/V1Settings.tsx` | Frontend Coder | Enable controls, add hot folder field, file chooser |
| `frontend/src/v1-settings.css` | UI Designer | Match V1 exact visual fidelity |
| `backend/src/main/kotlin/com/lesouvenir/v2/ipc/OperatorSettingsStore.kt` | Backend Engineer | Add `meta` fields, partial update support |
| `backend/src/test/kotlin/com/lesouvenir/v2/ipc/OperatorSettingsTest.kt` | Backend Engineer | Expand: partial updates, concurrent access |

---

## 9. Status Summary

### 9.1 Current Parity Status
| Category | Fields | V2 Status | Completion |
|----------|--------|-----------|------------|
| **Operator Settings (UI)** | 6/26 | **PARTIALLY IMPLEMENTED** | 60% (UI incomplete) |
| **Deployment Config** | 20/26 | **NOT STARTED** | 0% (new system needed) |
| **Canon Live Params** | 5/5 | **NOT STARTED** | 0% (camera IPC) |
| **Persistence Layer** | 6/26 | **IMPLEMENTED** | 100% (JSON store) |
| **Validation** | 6/26 | **IMPLEMENTED** | 100% (stricter than V1) |

### 9.2 Risk Assessment
| Risk | Level | Mitigation |
|------|-------|------------|
| **V1 .env Migration** | Low | Clean break, documented difference |
| **Operator Workflow Change** | Medium | Document session gating difference |
| **Hardware Dependency** | High | Explicit production gates, honest UI |
| **Validation Stricter** | Low | Document as improvement |
| **Missing File Chooser** | Medium | Implement with Tauri/fallback |

### 9.3 Verification Checklist
- [x] V1 source fully audited (26 config fields + 5 Canon params)
- [x] V2 current implementation analyzed (6 operator fields)
- [x] Gap analysis complete (UI, persistence, behavior)
- [x] Test coverage mapped (V1 gaps, V2 current)
- [x] Implementation priorities established
- [ ] Hardware verification (camera, printer) - **PENDING SPECIALISTS**
- [ ] UI fidelity verification - **PENDING UI DESIGNER**
- [ ] End-to-end session flow - **PENDING INTEGRATION**

---

**Audit Conclusion**: This matrix provides complete parity analysis between V1 configuration system and V2 current implementation. V2 has a solid foundation with stricter validation and safer semantics but requires completion of UI controls and connection to hardware systems. The 6-operator-field model preserves V1's separation between deployment configuration and operator controls.
