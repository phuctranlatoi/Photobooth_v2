# V1 Settings Parity Matrix

**Authority sources (read-only V1):**
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\config\SettingsManager.kt`
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\config\DesktopBoothConfig.kt`
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\SettingsTabContent.kt`
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\controller\DesktopBoothController.kt` (lines 245-310, 999-1030)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\config\DesktopAppPaths.kt`

**V2 current implementation:**
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\backend\src\main\kotlin\com\lesouvenir\v2\ipc\OperatorSettingsStore.kt`
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\backend\src\test\kotlin\com\lesouvenir\v2\ipc\OperatorSettingsTest.kt`
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\frontend\src\V1Settings.tsx`

---

## 1. Complete V1 Setting Inventory

| # | Field | Type | Default | Env Key | Source Loader | UI Control | Persistence | Apply Behavior |
|---|-------|------|---------|---------|---------------|------------|-------------|----------------|
| 1 | `boothId` | String | `"booth_1"` | `BOOTH_ID` | `DesktopConfigLoader.load()` | **No** | `.env` | Requires restart (used for API calls, session IDs) |
| 2 | `boothApiKey` | String | `""` | `BOOTH_API_KEY` | `DesktopConfigLoader.load()` | **No** | `.env` | Requires restart (auth header for Neon/Cloudinary) |
| 3 | `neonDatabaseUrl` | String | `""` | `NEON_DATABASE_URL` / `DATABASE_URL` | `DesktopConfigLoader.load()` | **No** | `.env` | Requires restart (Neon DB connection) |
| 4 | `neonRevenueBoothId` | String | `""` | `NEON_REVENUE_BOOTH_ID` | `DesktopConfigLoader.load()` | **No** | `.env` | Requires restart (revenue attribution) |
| 5 | `webAlbumBaseUrl` | String | `"https://web-photobooth-pink.vercel.app/"` | `WEB_ALBUM_BASE_URL` / `ALBUM_BASE_URL` | `DesktopConfigLoader.load()` | **No** | `.env` | Requires restart (album API base, trailing `/a` stripped) |
| 6 | `cloudinaryCloudName` | String | `""` | `CLOUDINARY_CLOUD_NAME` | `DesktopConfigLoader.load()` | **No** | `.env` | Requires restart (upload preset resolution) |
| 7 | `cloudinaryUploadPreset` | String | `""` | `CLOUDINARY_UPLOAD_PRESET` | `DesktopConfigLoader.load()` | **No** | `.env` | Requires restart (unsigned upload) |
| 8 | `albumExpiresInDays` | Int | `7` | `ALBUM_EXPIRES_IN_DAYS` | `DesktopConfigLoader.load()` (clamped ≥1) | **No** | `.env` | Requires restart |
| 9 | `enableSystemPrint` | Boolean | `false` | `ENABLE_SYSTEM_PRINT` | `DesktopConfigLoader.load()` (`toBooleanFlag`) | **Switch** (SettingsTabContent L56-63) | `.env` via `saveDeviceSettings()` → `activeConfig` immediate | **Active immediately for next print submission**; printer driver NOT reinitialized. V1 text: "Khởi động lại ứng dụng sau khi lưu" |
| 10 | `useHotFolder` | Boolean | `true` | `USE_HOT_FOLDER` | `DesktopConfigLoader.load()` (`toBooleanStrictOrNull`) | **Two clickable cards** (SettingsTabContent L73-76) | `.env` via `saveDeviceSettings()` → `activeConfig` immediate | **Requires restart** — capture service is constructor-selected (DesktopBoothController L63-68). `activeConfig` updates but hardware path unchanged until process restart |
| 11 | `hotFolderPath` | String | `"E:\\Photobooth\\HotFolder"` | `HOT_FOLDER_PATH` | `DesktopConfigLoader.load()` | **Text field + native JFileChooser** (SettingsTabContent L82-90) visible when `useHotFolder=true` | `.env` via `saveDeviceSettings()` → `activeConfig` immediate | **Requires restart** — HotFolderCaptureService constructed with path at startup. No folder access on save |
| 12 | `useNativeSdk` | Boolean | `true` | `USE_NATIVE_SDK` | `DesktopConfigLoader.load()` (`toBooleanStrictOrNull`) | **No** | `.env` | Requires restart (selects NativeEosCaptureService vs others) |
| 13 | `useCliCamera` | Boolean | `false` | `USE_CLI_CAMERA` | `DesktopConfigLoader.load()` (`toBooleanStrictOrNull`) | **No** | `.env` | Requires restart (selects CliCaptureService) |
| 14 | `cliCaptureCommand` | String | `"CameraControlCmd.exe /capturenoaf /filename \"%s\""` | `CLI_CAPTURE_COMMAND` | `DesktopConfigLoader.load()` | **No** | `.env` | Requires restart |
| 15 | `enableLocalServer` | Boolean | `true` | `ENABLE_LOCAL_SERVER` | `DesktopConfigLoader.load()` (`toBooleanFlag`) | **No** | `.env` | Requires restart (LocalFileServer start/stop) |
| 16 | `localServerPort` | Int | `8080` | `LOCAL_SERVER_PORT` | `DesktopConfigLoader.load()` | **No** (displayed in status card only) | `.env` | Requires restart |
| 17 | `payosClientId` | String | `""` | `PAYOS_CLIENT_ID` | `DesktopConfigLoader.load()` | **No** | `.env` | Requires restart (PaymentService init) |
| 18 | `payosApiKey` | String | `""` | `PAYOS_API_KEY` | `DesktopConfigLoader.load()` | **No** | `.env` | Requires restart |
| 19 | `payosChecksumKey` | String | `""` | `PAYOS_CHECKSUM_KEY` | `DesktopConfigLoader.load()` | **No** | `.env` | Requires restart |
| 20 | `postCaptureTimeoutSeconds` | Int | `90` | `POST_CAPTURE_TIMEOUT_SECONDS` | `DesktopConfigLoader.load()` | **Stepper ±10s** (SettingsTabContent L125) 0..3600 | `.env` via `saveDeviceSettings()` → `activeConfig` immediate | **Active immediately** for next `PRINT_PENDING` inactivity timer (DesktopBoothController L255). Name misleading — used for non-selection timed state |
| 21 | `photoSelectionTimeoutSeconds` | Int | `90` | `PHOTO_SELECTION_TIMEOUT_SECONDS` | `DesktopConfigLoader.load()` | **Stepper ±10s** (SettingsTabContent L121) 0..3600 | `.env` via `saveDeviceSettings()` → `activeConfig` immediate | **Active immediately** for next `SELECTING_PHOTOS` timer (DesktopBoothController L249). Zero invokes timeout handler without countdown delay |
| 22 | `frameSelectionTimeoutSeconds` | Int | `60` | `FRAME_SELECTION_TIMEOUT_SECONDS` | `DesktopConfigLoader.load()` | **Stepper ±10s** (SettingsTabContent L123) 0..3600 | `.env` via `saveDeviceSettings()` → `activeConfig` immediate | **Active immediately** for next `EDITING` timer (DesktopBoothController L253). Zero invokes timeout handler without countdown delay |
| 23 | `printerNameStrip` | String | `""` | `PRINTER_NAME_STRIP` | `DesktopConfigLoader.load()` | **Info chip only** (SettingsTabContent L65-69) | `.env` | Requires restart (printer selection at print time) |
| 24 | `printerNameFull` | String | `""` | `PRINTER_NAME_FULL` | `DesktopConfigLoader.load()` | **Info chip only** (SettingsTabContent L65-69) | `.env` | Requires restart |
| 25 | `isBeautyEnabled` | Boolean | `false` | `BEAUTY_ENABLED` | `DesktopConfigLoader.load()` (`toBooleanFlag`) | **No** | `.env` | Requires restart (DesktopBeautyService init) |
| 26 | `beautyPreset` | BeautyPreset enum | `BRIGHT` | `BEAUTY_PRESET` | `DesktopConfigLoader.load()` (case-insensitive match) | **No** | `.env` | Requires restart |

### Canon EDSDK Parameters (visible only when `nativeCamera != null` — NO persistence, IMMEDIATE hardware apply)

| # | Field | Type | Default | Persistence | UI Control | Apply Behavior |
|---|-------|------|---------|-------------|------------|----------------|
| 27 | ISO | String (device value) | Current device | **None** | Live dropdown (SettingsTabContent L100) | `nativeCamera.setIso()` immediate |
| 28 | Aperture (Av) | String | Current device | **None** | Live dropdown (SettingsTabContent L101) | `nativeCamera.setAperture()` immediate |
| 29 | Shutter Speed (Tv) | String | Current device | **None** | Live dropdown (SettingsTabContent L102) | `nativeCamera.setShutterSpeed()` immediate |
| 30 | White Balance | Enum (hardcoded list) | Unsynchronized | **None** | Hardcoded dropdown (SettingsTabContent L106-110) | `nativeCamera.setWhiteBalanceSafe()` one-way; V1 enum token misspelled `"Tangsten"` for Tungsten |
| 31 | Picture Style | Enum (hardcoded list) | Unsynchronized | **None** | Hardcoded dropdown (SettingsTabContent L111-116) | `nativeCamera.setPictureStyleSafe()` one-way |

---

## 2. V1 Settings Load/Save Semantics

### 2.1 Loader Precedence (DesktopConfigLoader.load, L46-89)
```kotlin
val env = readDotEnv(workingEnv) + readDotEnv(appEnv) + System.getenv()
// Later maps WIN — process env overrides app-data .env overrides working .env
```
- `workingEnv = workingDir()/.env`
- `appEnv = appDataDir/.env` (DesktopAppPaths.appDataDir → `%LOCALAPPDATA%\LeSouvenirDesktop`)
- `config.envSource` = whichever .env file actually exists (appEnv preferred, then workingEnv)

### 2.2 SettingsManager.updateSettings (SettingsManager.kt L8-39)
- Preserves blank lines, comments, unrelated keys
- Replaces matching keys in-place
- Appends absent keys at end
- Adds final newline
- Write target: `config.envSource ?: workingDir()/.env`

### 2.3 Validation & Clamping
| Field | Loader Validation | UI Constraint |
|-------|-------------------|---------------|
| Timeout seconds | `toIntOrNull() ?: default` — **no clamp**; negative/over-3600 accepted | Stepper enforces 0..3600 in 10s increments |
| `albumExpiresInDays` | `coerceAtLeast(1)` | N/A (no UI) |
| Booleans | `toBooleanFlag` (1/true/yes/y/on → true) | Switch/cards |
| `useHotFolder` | `toBooleanStrictOrNull` (only "true"/"false" strict) | Cards |

### 2.4 applyBehavior Taxonomy
| Category | Fields | When Effective |
|----------|--------|----------------|
| **Stored only** | boothId, API keys, DB URLs, Cloudinary, PayOS, printer names, beauty | Next process start |
| **activeConfig immediate** | enableSystemPrint, timeouts (3), useHotFolder, hotFolderPath | Next logical use (timer, print submit) |
| **Hardware immediate (no persistence)** | ISO, Av, Tv, WB, Picture Style | Instant on dropdown change |
| **Requires restart (service reconstruction)** | useHotFolder, useNativeSdk, useCliCamera, enableLocalServer, localServerPort, isBeautyEnabled | Next process start |

---

## 3. V1 Runtime Behavior Rules (from DesktopBoothController)

### 3.1 Inactivity Timer (L245-310)
```kotlin
// startInactivityTimer() uses activeConfig.value for timeouts
val timeoutSeconds = when (timerState) {
    SessionState.SELECTING_PHOTOS -> activeConfig.value.photoSelectionTimeoutSeconds
    SessionState.EDITING -> activeConfig.value.frameSelectionTimeoutSeconds
    else -> activeConfig.value.postCaptureTimeoutSeconds
}
```
- Timer runs on coroutine, updates `_inactivityTimeLeft` each second
- On timeout: `handleInactivityTimeout()` → auto-fills remaining photos from captured order → picks first frame **only if current frame.id == "empty"** → `startPrinting(userConfirmed=false)`

### 3.2 Timeout Path is Auto-Print (L309-310)
```kotlin
// Auto print on timeout
startPrinting(userConfirmed = false)
```
- Revenue gated separately: `userConfirmed && printJob.await()` (L842)
- Zero timeout → handler invoked without countdown delay

### 3.3 saveDeviceSettings (L999-1030)
```kotlin
fun saveDeviceSettings(
    enablePrint: Boolean,
    useHotFolder: Boolean,
    hotFolderPath: String,
    postCaptureTimeoutSeconds: Int,
    photoSelectionTimeoutSeconds: Int,
    frameSelectionTimeoutSeconds: Int
) {
    // 1. Write 6 keys to .env via SettingsManager
    // 2. On success: update activeConfig (MutableStateFlow) immediately
    // 3. Show "Đã lưu cài đặt. Khởi động lại ứng dụng để áp dụng." for 3s
}
```
- Callback returns `Unit` — UI shows success regardless of write result (SettingsTabContent L134-137: `onSaveSettings(); saved = true`)

### 3.4 AdminScreen Implicit Save (Authority source #4)
- AdminScreen "back" button (48×48 clickable circle) implicitly calls `saveSettings` before leaving

---

## 4. V2 Current Implementation Analysis

### 4.1 OperatorSettingsStore (backend/src/main/kotlin/com/lesouvenir/v2/ipc/OperatorSettingsStore.kt)
```kotlin
// Schema version 1, JSON file at workspace/backend/config/operator-settings.json
// Defaults match V1 for the 6 operator-exposed settings
private val defaults = JsonObject().apply {
    addProperty("enableSystemPrint", false)
    addProperty("useHotFolder", true)
    addProperty("hotFolderPath", workspace.resolve("backend/build/hot-folder").toString()) // V2 path, not V1
    addProperty("postCaptureTimeoutSeconds", 90)
    addProperty("photoSelectionTimeoutSeconds", 90)
    addProperty("frameSelectionTimeoutSeconds", 60)
}

// Strict validation: exact key set, type checks, range 0..3600 for timeouts
// Atomic write via temp file + ATOMIC_MOVE
```

**Response envelope (L48-54):**
```json
{
  "schemaVersion": 1,
  "settings": { ... },
  "appliesTo": "NEXT_SESSION",
  "hardwareApply": "PENDING_DISABLED",
  "productionGates": { "nativeCamera": false, "systemPrint": false, "payments": false, "cloud": false, "database": false }
}
```

### 4.2 IPC Contract (OperatorSettingsTest.kt)
- `operator.getSettings` → returns envelope above
- `operator.updateSettings` → validates, writes atomically, returns `{ "saved": true }`
- **Opt-in required**: `localOperatorEnabled=true` in SimulatorSessionEngine
- **Blocked during active session**: error `-32001` if `operator.updateSettings` called while session running
- **Not available without opt-in**: error `-32010` for `operator.getSettings`

### 4.3 Frontend V1Settings.tsx
- Currently **fully disabled/placeholder** — all controls `disabled` or `readOnly`
- Shows "simulator" status text, "Không khả dụng" messages
- No live data binding to IPC
- Layout mirrors V1 visual structure (sections, cards, steppers)

---

## 5. Parity Gap Analysis

| Aspect | V1 | V2 Current | Gap | Action Required |
|--------|-----|------------|-----|-----------------|
| **Storage format** | `.env` (key=value) | JSON (schema v1) | Different persistence layer | Document mapping; decide if V2 reads V1 .env on migration |
| **Settings scope** | 26 config fields + 5 live Canon params | 6 operator settings | 20 config fields missing from V2 operator UI | Classify: "config fields not UI control" vs "need operator exposure" |
| **Canon live params** | 5 dropdowns, immediate hardware apply, no persistence | **Absent** | Hardware-specific, not portable | Defer to Camera Engineer; not part of operator settings parity |
| **Beauty settings** | `isBeautyEnabled`, `beautyPreset` in .env | **Absent** | Config fields not UI control | Document as non-operator |
| **Printer names** | `printerNameStrip`, `printerNameFull` in .env, displayed as info chips | **Absent** | Config fields not UI control | Document as non-operator |
| **Apply semantics** | Mixed: some immediate (activeConfig), some restart | Explicit: `appliesTo: "NEXT_SESSION"`, `hardwareApply: "PENDING_DISABLED"` | V2 is stricter/safer | **Keep V2 explicit model**; document V1 implicit behaviors |
| **Validation** | Loader: lenient (fallback to default); UI: stepper clamps | Store: strict (exact keys, types, ranges); rejects invalid atomically | V2 stronger | Keep V2 validation; ensure V1 loader fallback behavior documented |
| **Save feedback** | Fire-and-forget; shows success 3s regardless | Synchronous; returns `{saved: true}` or throws | V2 honest | Keep V2 |
| **Session gating** | Can save anytime (even mid-session per AdminScreen) | Blocked during active session (-32001) | V2 safer | Keep V2 gate |
| **Opt-in** | Always available in Admin tab | `localOperatorEnabled` flag | V2 explicit | Keep V2 opt-in for dev/simulator |
| **Production gates** | Implicit (real hardware works) | Explicit all-false envelope | V2 honest | Keep V2 |
| **Hot Folder default** | `"E:\\Photobooth\\HotFolder"` (machine-specific) | `workspace/backend/build/hot-folder` (V2-isolated) | **Correct isolation** | Keep V2 default |
| **Loader precedence** | working.env → appData.env → process env | Single JSON file | Simpler in V2 | Document; no migration needed for operator settings |

---

## 6. Config Fields NOT UI Controls (V1 Authority)

These exist in `DesktopBoothConfig` and `.env` but **never appear in SettingsTabContent**. V2 should NOT expose them in operator UI unless explicitly approved.

| Field | Reason |
|-------|--------|
| `boothId`, `boothApiKey` | Identity/secrets — deployment config |
| `neonDatabaseUrl`, `neonRevenueBoothId` | Backend infra — deployment config |
| `webAlbumBaseUrl`, `cloudinaryCloudName`, `cloudinaryUploadPreset`, `albumExpiresInDays` | Cloud services — deployment config |
| `useNativeSdk`, `useCliCamera`, `cliCaptureCommand` | Architecture selection — requires restart, not operator decision |
| `enableLocalServer`, `localServerPort` | Internal service — deployment config |
| `payosClientId`, `payosApiKey`, `payosChecksumKey` | Payment secrets — deployment config |
| `printerNameStrip`, `printerNameFull` | Driver names — set once at install, displayed as info only |
| `isBeautyEnabled`, `beautyPreset` | Feature toggle + algorithm preset — product decision, not per-session |

---

## 7. Recommended V2 Operator Settings Contract (Minimal IPC)

### 7.1 Get Settings
```json
// Request: operator.getSettings {}
// Response:
{
  "schemaVersion": 1,
  "settings": {
    "enableSystemPrint": false,
    "useHotFolder": true,
    "hotFolderPath": "C:\\PhotoboothDesktop_v2\\backend\\build\\hot-folder",
    "postCaptureTimeoutSeconds": 90,
    "photoSelectionTimeoutSeconds": 90,
    "frameSelectionTimeoutSeconds": 60
  },
  "appliesTo": "NEXT_SESSION",
  "hardwareApply": "PENDING_DISABLED",
  "productionGates": { "nativeCamera": false, "systemPrint": false, "payments": false, "cloud": false, "database": false },
  "meta": {
    "configSource": "workspace/backend/config/operator-settings.json",
    "v1EnvPath": "N/A (V2 isolated)",
    "restartRequired": ["useHotFolder", "hotFolderPath"]
  }
}
```

### 7.2 Update Settings
```json
// Request: operator.updateSettings { settings: { ...partial or full... } }
// Response on success: { "saved": true, "appliesTo": "NEXT_SESSION" }
// Response on error (session active): { "code": -32001, "message": "Settings locked during active session" }
// Response on error (not opted in): { "code": -32010, "message": "Operator settings not enabled" }
// Response on validation error: { "code": -32602, "message": "Invalid settings: <field>" }
```

### 7.3 Frontend Behavior (V1Settings.tsx target)
- **Enable controls** only when `localOperatorEnabled=true` (dev/simulator opt-in)
- **Live load** via `operator.getSettings` on mount
- **Debounced/confirmed save** via `operator.updateSettings` — show real result, not fake 3s toast
- **Display `appliesTo`/`hardwareApply`** honestly (no "restart required" blanket message for all)
- **Show production gates** — all false in simulator
- **Preserve V1 visual layout exactly** (section order, labels, Vietnamese text, stepper 10s increments, card style)

---

## 8. Test Criteria for Parity

| Test | V1 Behavior | V2 Target |
|------|-------------|-----------|
| Load defaults (no file) | 6 operator settings from `DesktopBoothConfig` defaults | 6 settings from `OperatorSettingsStore.defaults` |
| Save → reload persistence | `.env` keys updated, surviving restart | JSON file atomic, surviving process restart |
| Invalid timeout (-1, 3601, 1.5, "90", true) | Loader falls back to default; UI prevents | Store rejects with `-32602`, file unchanged |
| Save during active session | Allowed (AdminScreen implicit save) | Rejected `-32001` |
| Opt-in disabled | N/A | `operator.getSettings` → `-32010` |
| `useHotFolder` change | `activeConfig` updates immediately; camera service **unchanged until restart** | `appliesTo: NEXT_SESSION`, `hardwareApply: PENDING_DISABLED` |
| Timeout change mid-session | Next timer uses new value (activeConfig) | Next session uses new value (explicit) |
| Canon param dropdowns | Immediate hardware, no persistence | **Out of scope** for operator settings |
| Printer names in UI | Info chips only (read from config) | **Out of scope** (config fields) |

---

## 9. Open Questions for Architect Decision

1. **Migration**: Should V2 `OperatorSettingsStore` read V1 `.env` on first run to seed operator settings? (Current: No — clean isolation)
2. **Canon params in IPC**: If Camera Engineer proves Canon SDK works, should live params get an IPC surface? (Current: No — hardware-specific, not operator settings)
3. **Beauty toggle**: Is `isBeautyEnabled` an operator setting or deployment config? (V1: deployment; recommend keep deployment)
4. **Printer enumeration**: Should operator UI list installed Windows printers for `printerNameStrip/Full`? (V1: no — manual .env entry; recommend keep manual)

---

## 10. Files to Own / Modify (V2 Only)

| File | Owner | Purpose |
|------|-------|---------|
| `docs/V1_SETTINGS_PARITY_MATRIX.md` | **This subagent** | Complete — delivered |
| `backend/src/main/kotlin/com/lesouvenir/v2/ipc/OperatorSettingsStore.kt` | Backend Engineer | Harden validation, add `meta` fields, ensure atomicity |
| `backend/src/test/kotlin/com/lesouvenir/v2/ipc/OperatorSettingsTest.kt` | Backend Engineer | Expand coverage: partial updates, concurrent access, schema migration |
| `frontend/src/V1Settings.tsx` | Frontend Coder | Wire to IPC, enable controls under `localOperatorEnabled`, honest apply messaging |
| `frontend/src/v1-settings.css` | UI Designer | Match V1 visual fidelity exactly (spacing, colors, Vietnamese labels) |

---

**End of Matrix.** No ADR created. No migration overhaul. No new architecture. Exact fidelity mapping complete.