# Settings Migration Matrix - CORRECTED

**Authority Sources (V1 Read-only):**
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\config\DesktopBoothConfig.kt:8-35` (26 config fields)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\SettingsTabContent.kt` (6 operator UI controls)

---

## 1. Migration Strategy - CORRECTED

### 1.1 Philosophy: Clean Break ONLY
**Decision: Clean isolation, NO hybrid/fallback**

| Approach | Status | Rationale |
|----------|--------|-----------|
| **Clean Break** | **SELECTED** (Current V2) | No V1 dependency, fresh start, isolated |
| **Automatic Migration** | **FORBIDDEN** | Complex migration logic, validation differences |
| **Hybrid (read V1 .env fallback)** | **FORBIDDEN** | No V1 .env reading allowed |

**V2 Implementation**: Uses own JSON store at `workspace/backend/config/operator-settings.json`. **NO reading of V1 `.env` files**.

### 1.2 Scope of Migration
| Category | V1 Fields | Migrate? | Status |
|----------|-----------|----------|--------|
| **Operator Settings** | 6 fields | **YES** (manual re-entry) | **IMPLEMENTED** in OperatorSettingsStore |
| **Deployment Config** | 20 fields | **NOT STARTED/BLOCKED** pending safe config contract | **NOT STARTED** |
| **Canon Live Params** | 5 parameters | **NOT STARTED/BLOCKED** pending camera contract | **NOT STARTED** |

---

## 2. Field-by-Field Migration - CORRECTED

### 2.1 Operator Settings (6 Fields - Manual Migration Required)
| V1 Field | V1 Env Key | V1 Default | V2 Field | V2 Default | Migration | V2 Status |
|----------|------------|------------|----------|------------|-----------|-----------|
| `enableSystemPrint` | `ENABLE_SYSTEM_PRINT` | `false` | `enableSystemPrint` | `false` | 1:1 boolean | **IMPLEMENTED** |
| `useHotFolder` | `USE_HOT_FOLDER` | `true` | `useHotFolder` | `true` | 1:1 boolean | **IMPLEMENTED** |
| `hotFolderPath` | `HOT_FOLDER_PATH` | `E:\\Photobooth\\HotFolder` | `hotFolderPath` | `workspace/backend/build/hot-folder` | Path translation | **IMPLEMENTED** |
| `postCaptureTimeoutSeconds` | `POST_CAPTURE_TIMEOUT_SECONDS` | `90` | `postCaptureTimeoutSeconds` | `90` | 1:1 integer | **IMPLEMENTED** |
| `photoSelectionTimeoutSeconds` | `PHOTO_SELECTION_TIMEOUT_SECONDS` | `90` | `photoSelectionTimeoutSeconds` | `90` | 1:1 integer | **IMPLEMENTED** |
| `frameSelectionTimeoutSeconds` | `FRAME_SELECTION_TIMEOUT_SECONDS` | `60` | `frameSelectionTimeoutSeconds` | `60` | 1:1 integer | **IMPLEMENTED** |

**Migration Instructions**: Operator must manually re-enter 6 values in V2 UI.

### 2.2 Deployment Configuration (20 Fields - Individual Enumeration)
| # | V1 Field | V1 Env Key | V1 Default | V2 Status | Rationale |
|---|----------|------------|------------|-----------|-----------|
| 1 | `boothId` | `BOOTH_ID` | `"booth_1"` | **NOT STARTED/BLOCKED** | Identity config |
| 2 | `boothApiKey` | `BOOTH_API_KEY` | `""` | **NOT STARTED/BLOCKED** | Secret, no UI |
| 3 | `neonDatabaseUrl` | `NEON_DATABASE_URL` | `""` | **NOT STARTED/BLOCKED** | Database config |
| 4 | `neonRevenueBoothId` | `NEON_REVENUE_BOOTH_ID` | `""` | **NOT STARTED/BLOCKED** | Revenue attribution |
| 5 | `webAlbumBaseUrl` | `WEB_ALBUM_BASE_URL` | `"https://web-photobooth-pink.vercel.app/"` | **NOT STARTED/BLOCKED** | Service URL |
| 6 | `cloudinaryCloudName` | `CLOUDINARY_CLOUD_NAME` | `""` | **NOT STARTED/BLOCKED** | Cloud service |
| 7 | `cloudinaryUploadPreset` | `CLOUDINARY_UPLOAD_PRESET` | `""` | **NOT STARTED/BLOCKED** | Cloud service |
| 8 | `albumExpiresInDays` | `ALBUM_EXPIRES_IN_DAYS` | `7` | **NOT STARTED/BLOCKED** | Service config |
| 9 | `useNativeSdk` | `USE_NATIVE_SDK` | `true` | **NOT STARTED/BLOCKED** | Runtime hardware selection |
| 10 | `useCliCamera` | `USE_CLI_CAMERA` | `false` | **NOT STARTED/BLOCKED** | Runtime hardware selection |
| 11 | `cliCaptureCommand` | `CLI_CAPTURE_COMMAND` | `"CameraControlCmd.exe ..."` | **NOT STARTED/BLOCKED** | Runtime hardware selection |
| 12 | `enableLocalServer` | `ENABLE_LOCAL_SERVER` | `true` | **NOT STARTED/BLOCKED** | Runtime service config |
| 13 | `localServerPort` | `LOCAL_SERVER_PORT` | `8080` | **NOT STARTED/BLOCKED** | Runtime service config |
| 14 | `payosClientId` | `PAYOS_CLIENT_ID` | `""` | **NOT STARTED/BLOCKED** | Secret, no UI |
| 15 | `payosApiKey` | `PAYOS_API_KEY` | `""` | **NOT STARTED/BLOCKED** | Secret, no UI |
| 16 | `payosChecksumKey` | `PAYOS_CHECKSUM_KEY` | `""` | **NOT STARTED/BLOCKED** | Secret, no UI |
| 17 | `printerNameStrip` | `PRINTER_NAME_STRIP` | `""` | **NOT STARTED/BLOCKED** | Runtime printer config |
| 18 | `printerNameFull` | `PRINTER_NAME_FULL` | `""` | **NOT STARTED/BLOCKED** | Runtime printer config |
| 19 | `isBeautyEnabled` | `BEAUTY_ENABLED` | `false` | **NOT STARTED/BLOCKED** | Beauty UNVERIFIED |
| 20 | `beautyPreset` | `BEAUTY_PRESET` | `BRIGHT` | **NOT STARTED/BLOCKED** | Beauty UNVERIFIED |

**Preserve runtime config semantics**: NOT "hardcoded/buildconfig" - requires safe config contract.

### 2.3 Canon EDSDK Live Parameters (No Migration)
| Parameter | V1 Storage | V2 Status | Rationale |
|-----------|------------|-----------|-----------|
| ISO, Av, Tv, WB, Picture Style | No persistence | **NOT STARTED/BLOCKED** pending camera contract | Hardware-specific controls |

---

## 3. Storage Format Migration

### 3.1 V1 Storage (`.env`)
```env
# V1 .env format (example)
ENABLE_SYSTEM_PRINT=false
USE_HOT_FOLDER=true
HOT_FOLDER_PATH=E:\Photobooth\HotFolder
POST_CAPTURE_TIMEOUT_SECONDS=90
...
```

**Characteristics**: Key=value, comments, in-place updates, no validation on write.

### 3.2 V2 Storage (JSON)
```json
// V2 operator-settings.json
{
  "schemaVersion": 1,
  "settings": {
    "enableSystemPrint": false,
    "useHotFolder": true,
    "hotFolderPath": "C:\\PhotoboothDesktop_v2\\backend\\build\\hot-folder",
    "postCaptureTimeoutSeconds": 90,
    "photoSelectionTimeoutSeconds": 90,
    "frameSelectionTimeoutSeconds": 60
  }
}
```

**Characteristics**: JSON with schema, atomic writes, strict validation, isolated.

### 3.3 NO Migration Helper
**FORBIDDEN**: No automatic `.env` → JSON conversion. Clean break only.

---

## 4. Semantic Differences

### 4.1 Apply Timing
| Setting | V1 Semantics | V2 Semantics | Correction |
|---------|--------------|--------------|------------|
| Operator 6 fields | Mixed immediate/restart via `activeConfig` | Explicit: `appliesTo: "NEXT_SESSION"`, `hardwareApply: "PENDING_DISABLED"` | V2 more conservative |
| Deployment 20 fields | Restart required | **NOT STARTED/BLOCKED** | Preserve runtime config semantics |
| Canon params | Immediate hardware (no persistence) | **NOT STARTED/BLOCKED** | Hardware contract needed |

### 4.2 Validation Differences
| Validation | V1 (DesktopConfigLoader) | V2 (OperatorSettingsStore) | Impact |
|------------|--------------------------|----------------------------|--------|
| Booleans | `toBooleanFlag()` (lenient) | Strict JSON boolean | V2 rejects "yes"/"1" |
| Timeouts | `toIntOrNull() ?: default` (no clamp) | `0..3600` integer | V2 rejects out of range |
| Path | No validation | 1-1024 chars, no control chars | V2 stricter |

### 4.3 Session Gating
| Operation | V1 | V2 | Correction |
|-----------|----|----|------------|
| Save settings | Allowed mid-session | Blocked (`-32001` error) | V2 stricter |
| Operator access | Always via 5-tap | Requires `localOperatorEnabled=true` | V2 explicit |

---

## 5. Beauty Configuration - CORRECTED

**STATUS: ❌ UNVERIFIED/BLOCKED**

**Fields affected:**
- `isBeautyEnabled` - Boolean, `BEAUTY_ENABLED`, default `false`
- `beautyPreset` - BeautyPreset, `BEAUTY_PRESET`, default `BRIGHT`

**Migration**: **BLOCKED** - candidate5d65460 unapproved, no approved manifest.

**Preserve runtime config semantics**: NOT "build-time configuration".

---

## 6. V2 Implementation Status

### 6.1 COMPLETE
| Component | Status | Test Evidence |
|-----------|--------|---------------|
| OperatorSettingsStore | **IMPLEMENTED** (6 fields) | OperatorSettingsTest.kt |
| JSON persistence | **IMPLEMENTED** (atomic writes) | OperatorSettingsTest.kt |
| Validation | **IMPLEMENTED** (strict 0-3600) | OperatorSettingsTest.kt |
| Session gating | **IMPLEMENTED** (`-32001` error) | OperatorSettingsTest.kt |

### 6.2 PARTIAL
| Component | Status | Gap |
|-----------|--------|-----|
| V1Settings.tsx UI | **PARTIAL** (controls disabled) | Requires backend auth to enable |
| File chooser | **NOT STARTED** | Needs Tauri dialog API |
| Hot folder path UI | **INCOMPLETE** | Missing text field + chooser |

### 6.3 NOT STARTED/BLOCKED
| Category | Status | Blocked On |
|----------|--------|------------|
| Deployment config (20 fields) | **NOT STARTED/BLOCKED** | Safe config contract |
| Canon EDSDK controls | **NOT STARTED/BLOCKED** | Camera contract |
| Beauty configuration | **NOT STARTED/BLOCKED** | Approved manifest |

---

## 7. Migration Instructions

### 7.1 Operator Action Required
1. Launch V2 Admin interface
2. Navigate to Settings tab (when enabled)
3. **Manually re-enter** values for 6 settings:
   - Print enabled/disabled
   - Camera source (webcam/hot folder)
   - Hot folder path (note V2 isolated location)
   - Three timeout values (photo selection, frame selection, post-capture)
4. Save settings
5. **Note**: Changes apply to `NEXT_SESSION`, hardware `PENDING_DISABLED`

### 7.2 Deployment Config Action
**Pending safe config contract** - New V2 configuration system needed for 20 fields.

### 7.3 Secrets Handling
**User re-entry required** for:
- `boothApiKey`, `payosClientId`, `payosApiKey`, `payosChecksumKey`
- **NO V1 .env reading** for secrets

---

## 8. Risk Mitigation

### 8.1 Identified Risks
| Risk | Mitigation |
|------|------------|
| Operator confusion | Clear documentation: "Manual re-entry required" |
| Validation too strict | Document V2 strict validation vs V1 lenient |
| Missing file chooser | Implement Tauri dialog API or fallback text input |
| Beauty UNVERIFIED | **BLOCKED** - no copy/retune without approval |

### 8.2 Rollback Strategy
1. **V2 settings corrupted**: Delete `operator-settings.json`, defaults reload
2. **UI not working**: Disable operator tab, use defaults
3. **Critical failure**: Revert to V1 while fixing V2

---

## 9. Exact Source Citations

### 9.1 V1 Configuration
- `DesktopBoothConfig.kt:8-35` - 26 fields with defaults
- `SettingsTabContent.kt:62-125` - 6 operator UI controls
- **All 26 fields individually enumerated**

### 9.2 V2 Implementation
- `OperatorSettingsStore.kt:22-25` - 6 operator settings defaults
- `OperatorSettingsTest.kt` - Test coverage
- **NO hybrid/fallback migration** - clean break only

### 9.3 Beauty Status
- **UNVERIFIED/BLOCKED** - candidate5d65460 unapproved
- **NO approved manifest** found in source inspection
- **Preserve runtime config semantics** - not build-time

---

**Correction Complete**: Clean break migration only. All 26 configuration fields individually enumerated. Deployment config (20 fields) NOT STARTED/BLOCKED pending safe config contract. Beauty UNVERIFIED/BLOCKED. NO V1 .env reading allowed.