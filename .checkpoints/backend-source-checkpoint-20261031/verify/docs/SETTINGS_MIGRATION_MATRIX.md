# Settings Migration Matrix

**Authority Sources (V1 Read-only):**
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\config\DesktopBoothConfig.kt` (26 config fields)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\config\DesktopConfigLoader.kt` (Loading semantics)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\config\SettingsManager.kt` (Persistence)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\SettingsTabContent.kt` (UI controls)

**V2 Current Implementation:**
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\backend\src\main\kotlin\com\lesouvenir\v2\ipc\OperatorSettingsStore.kt` (JSON store)
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\frontend\src\V1Settings.tsx` (React UI)
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\backend\src\test\kotlin\com\lesouvenir\v2\ipc\OperatorSettingsTest.kt` (Tests)

---

## 1. Migration Strategy Overview

### 1.1 Philosophy: Clean Break vs. Migration
| Approach | Pros | Cons | Recommendation |
|----------|------|------|---------------|
| **Clean Break** | No V1 dependency, fresh start, isolated | Operator re-entry required, potential confusion | **SELECTED** (Current V2) |
| **Automatic Migration** | Smooperator transition, preserves settings | Complex migration logic, versioning issues | Consider for production rollout |
| **Hybrid** | Read V1 .env as fallback | Best of both worlds | Future option if needed |

**Current V2 Decision**: Clean isolation. V2 uses its own JSON store at `workspace/backend/config/operator-settings.json`. No reading of V1 `.env` files.

### 1.2 Scope of Migration
| Category | V1 Fields | Migrate? | Rationale |
|----------|-----------|----------|-----------|
| **Operator Settings** | 6 fields | **YES** (via manual re-entry) | Core operator workflow |
| **Deployment Config** | 20 fields | **NO** | Deployment-specific, not operator |
| **Canon Live Params** | 5 parameters | **NO** | Hardware-specific, no persistence |

---

## 2. Field-by-Field Migration Matrix

### 2.1 Operator Settings (6 Fields - Manual Migration Required)

| # | V1 Field | V1 Env Key | V1 Default | V2 Field | V2 Default | Migration Mapping | Notes |
|---|----------|------------|------------|----------|------------|------------------|-------|
| 1 | `enableSystemPrint` | `ENABLE_SYSTEM_PRINT` | `false` | `enableSystemPrint` | `false` | 1:1 boolean | Same semantics |
| 2 | `useHotFolder` | `USE_HOT_FOLDER` | `true` | `useHotFolder` | `true` | 1:1 boolean | V2 default matches V1 |
| 3 | `hotFolderPath` | `HOT_FOLDER_PATH` | `E:\\Photobooth\\HotFolder` | `hotFolderPath` | `workspace/backend/build/hot-folder` | **Path translation required** | V2 uses isolated test path |
| 4 | `postCaptureTimeoutSeconds` | `POST_CAPTURE_TIMEOUT_SECONDS` | `90` | `postCaptureTimeoutSeconds` | `90` | 1:1 integer | Same default |
| 5 | `photoSelectionTimeoutSeconds` | `PHOTO_SELECTION_TIMEOUT_SECONDS` | `90` | `photoSelectionTimeoutSeconds` | `90` | 1:1 integer | Same default |
| 6 | `frameSelectionTimeoutSeconds` | `FRAME_SELECTION_TIMEOUT_SECONDS` | `60` | `frameSelectionTimeoutSeconds` | `60` | 1:1 integer | Same default |

**Migration Instructions for Operators**:
1. Launch V2 Admin interface
2. Navigate to Settings tab
3. Re-enter values for 6 settings from memory/documentation
4. Save settings
5. **Note**: Hot folder path should be updated to V2 isolated location

### 2.2 Deployment Configuration (20 Fields - No UI Migration)

| Category | V1 Fields | V1 Env Keys | Migration Approach | V2 Location |
|----------|-----------|-------------|-------------------|-------------|
| **Identity/Secrets** | `boothId`, `boothApiKey` | `BOOTH_ID`, `BOOTH_API_KEY` | New V2 config system | TBD (environment variables) |
| **Database** | `neonDatabaseUrl`, `neonRevenueBoothId` | `NEON_DATABASE_URL`, `NEON_REVENUE_BOOTH_ID` | New V2 config system | TBD (environment variables) |
| **Cloud Services** | `webAlbumBaseUrl`, `cloudinaryCloudName`, `cloudinaryUploadPreset`, `albumExpiresInDays` | `WEB_ALBUM_BASE_URL`, etc. | New V2 config system | TBD (environment variables) |
| **Hardware Selection** | `useNativeSdk`, `useCliCamera`, `cliCaptureCommand` | `USE_NATIVE_SDK`, etc. | V2 architecture decision | Hardcoded or build config |
| **Local Server** | `enableLocalServer`, `localServerPort` | `ENABLE_LOCAL_SERVER`, `LOCAL_SERVER_PORT` | V2 architecture decision | Hardcoded or build config |
| **Payment** | `payosClientId`, `payosApiKey`, `payosChecksumKey` | `PAYOS_CLIENT_ID`, etc. | New V2 config system | Secure credential store |
| **Printer Names** | `printerNameStrip`, `printerNameFull` | `PRINTER_NAME_STRIP`, `PRINTER_NAME_FULL` | Display only in V2 | Info display in UI |
| **Beauty** | `isBeautyEnabled`, `beautyPreset` | `BEAUTY_ENABLED`, `BEAUTY_PRESET` | V2 feature toggle | Build-time configuration |

### 2.3 Canon EDSDK Live Parameters (No Migration)
| Parameter | V1 Storage | V2 Approach | Rationale |
|-----------|------------|-------------|-----------|
| ISO, Aperture, Shutter Speed | No persistence | Camera IPC surface | Hardware-specific controls |
| White Balance, Picture Style | No persistence | Camera IPC surface | One-way set in V1 |

---

## 3. Storage Format Migration

### 3.1 V1 Storage Format (`.env`)
```env
# V1 .env file example (observed patterns)
BOOTH_ID=booth_1
BOOTH_API_KEY=sk_live_...
ENABLE_SYSTEM_PRINT=false
USE_HOT_FOLDER=true
HOT_FOLDER_PATH=E:\Photobooth\HotFolder
POST_CAPTURE_TIMEOUT_SECONDS=90
PHOTO_SELECTION_TIMEOUT_SECONDS=90
FRAME_SELECTION_TIMEOUT_SECONDS=60
# ... 18 more fields
```

**V1 Characteristics**:
- Key=value pairs
- Supports comments (`#`)
- Preserves blank lines
- In-place updates (SettingsManager.kt)
- No validation on write
- Precedence: appData/.env → working/.env → system env

### 3.2 V2 Storage Format (JSON)
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

**V2 Characteristics**:
- JSON with schema version
- Atomic writes via temp file
- Strict validation before write
- Single source (no precedence chain)
- Isolated from V1
- No comments preserved

### 3.3 Format Conversion (If Migration Implemented)
```kotlin
// Pseudo-code for potential migration helper
fun migrateV1ToV2(v1EnvPath: Path, v2Store: OperatorSettingsStore) {
    val env = readDotEnv(v1EnvPath)  // From DesktopConfigLoader
    
    val migrated = JsonObject().apply {
        // Operator settings
        addProperty("enableSystemPrint", 
            env["ENABLE_SYSTEM_PRINT"].toBooleanFlag(default = false))
        addProperty("useHotFolder",
            env["USE_HOT_FOLDER"]?.toBooleanStrictOrNull() ?: true)
        addProperty("hotFolderPath",
            env["HOT_FOLDER_PATH"].orDefault("E:\\Photobooth\\HotFolder"))
        // Note: Would need path translation for V2 isolation
        
        // Timeouts - V1 has no validation, V2 validates 0-3600
        fun safeTimeout(key: String, default: Int): Int {
            val value = env[key]?.toIntOrNull() ?: default
            return value.coerceIn(0, 3600)
        }
        addProperty("postCaptureTimeoutSeconds",
            safeTimeout("POST_CAPTURE_TIMEOUT_SECONDS", 90))
        addProperty("photoSelectionTimeoutSeconds",
            safeTimeout("PHOTO_SELECTION_TIMEOUT_SECONDS", 90))
        addProperty("frameSelectionTimeoutSeconds",
            safeTimeout("FRAME_SELECTION_TIMEOUT_SECONDS", 60))
    }
    
    v2Store.update(migrated)
}
```

**Migration Risks**:
1. **Path differences**: V1 uses production path, V2 uses isolated test path
2. **Validation differences**: V1 accepts invalid values, V2 rejects
3. **Boolean parsing**: V1 `toBooleanFlag()` vs V2 strict JSON boolean

---

## 4. Loading Semantics Migration

### 4.1 V1 Loading Precedence (DesktopConfigLoader.kt L46-54)
```
workingDir()/.env (project config)
    ↓
appDataDir/.env (user config - OVERRIDES working)
    ↓
System.getenv() (environment - OVERRIDES both)
    ↓
DesktopBoothConfig with defaults for missing
```

**V1 Example Paths**:
- `workingDir()/.env`: `E:\HK1_2026_2027\PhotoboothDesktop\.env`
- `appDataDir/.env`: `%LOCALAPPDATA%\LeSouvenirDesktop\.env`

### 4.2 V2 Loading (Single Source)
```
workspace/backend/config/operator-settings.json
    ↓
If missing → use defaults in OperatorSettingsStore
    ↓
No environment variable overrides
```

**V2 Path**: `E:\HK1_2026_2027\PhotoboothDesktop_v2\backend\config\operator-settings.json`

### 4.3 Semantic Differences
| Aspect | V1 | V2 | Migration Impact |
|--------|----|----|-----------------|
| **Precedence Chain** | 3 layers (working → appData → system) | Single JSON file | Simpler, less confusing |
| **Environment Overrides** | System env overrides files | No env overrides | More predictable |
| **Default Fallbacks** | Constructor defaults after parsing | Defaults if file missing | Similar concept |
| **Validation Timing** | During parsing (lenient) | Before write (strict) | V2 prevents bad data |

---

## 5. Persistence Semantics Migration

### 5.1 V1 Persistence (SettingsManager.kt)
```kotlin
// V1 update logic
fun updateSettings(envFile: Path, updates: Map<String, String>) {
    // 1. Read all lines
    // 2. Find and replace existing keys
    // 3. Append new keys at end
    // 4. Write back with trailing newline
    // NO validation during write
}
```

**V1 Characteristics**:
- In-place file editing
- Preserves file structure (comments, blank lines)
- Append-only for new keys
- No atomicity (corruptible on crash)
- No validation on write

### 5.2 V2 Persistence (OperatorSettingsStore.kt L50-66)
```kotlin
// V2 update logic
fun update(value: JsonObject) {
    // 1. Validate input (strict)
    // 2. Create temp file
    // 3. Write complete JSON
    // 4. Atomic move to replace
    // 5. Update in-memory state only after successful write
}
```

**V2 Characteristics**:
- Atomic write via temp file + move
- Complete file replacement
- No preservation of comments/formatting
- Validation before write
- Crash-safe (temp file or old file intact)

### 5.3 Migration Safety Considerations
| Risk | V1 | V2 | Mitigation |
|------|----|----|------------|
| **File Corruption** | High (in-place edit) | Low (atomic write) | V2 improvement |
| **Partial Write** | Possible on crash | Impossible (atomic) | V2 improvement |
| **Validation Errors** | Silent (bad data saved) | Loud (exception thrown) | V2 improvement |
| **Concurrent Access** | Possible corruption | Safe (file locks) | Assume single UI |

---

## 6. Validation Rules Migration

### 6.1 V1 Validation (DesktopConfigLoader.kt)
| Field Type | V1 Validation | Example |
|------------|---------------|---------|
| **Boolean** | `toBooleanFlag()`: "1"/"true"/"yes"/"y"/"on" → true | `ENABLE_SYSTEM_PRINT=yes` → `true` |
| `useHotFolder` | `toBooleanStrictOrNull()`: only "true"/"false" | `USE_HOT_FOLDER=true` → `true` |
| **Integer** | `toIntOrNull() ?: default` (no range check) | `POST_CAPTURE_TIMEOUT_SECONDS=9999` → `9999` |
| `albumExpiresInDays` | `coerceAtLeast(1)` | `ALBUM_EXPIRES_IN_DAYS=0` → `1` |
| **String** | `.orDefault(default)` if blank | `BOOTH_ID=` → `"booth_1"` |

### 6.2 V2 Validation (OperatorSettingsStore.kt L36-49)
| Field Type | V2 Validation | Error Action |
|------------|---------------|--------------|
| **Boolean** | Must be JSON boolean `true`/`false` | Reject with `-32602` |
| **Integer** | Must be integer 0-3600, no decimal | Reject with `-32602` |
| **String Path** | 1-1024 chars, no control chars | Reject with `-32602` |
| **Key Set** | Exact 6 keys required | Reject with `-32602` |

### 6.3 Validation Migration Table
| V1 Value | V1 Result | V2 Result | Migration Action |
|----------|-----------|-----------|-----------------|
| `ENABLE_SYSTEM_PRINT=yes` | `true` | **Rejected** | Convert to `true` |
| `POST_CAPTURE_TIMEOUT_SECONDS=-1` | `-1` | **Rejected** | Clamp to 0 |
| `POST_CAPTURE_TIMEOUT_SECONDS=3601` | `3601` | **Rejected** | Clamp to 3600 |
| `PHOTO_SELECTION_TIMEOUT_SECONDS=1.5` | `1` (truncated) | **Rejected** | Round to 2? |
| `HOT_FOLDER_PATH=` (empty) | `"E:\\Photobooth\\HotFolder"` | **Rejected** | Use default |

**Migration Helper Logic Needed**:
```kotlin
fun migrateAndValidateV1Value(key: String, v1Value: String?): Any {
    return when (key) {
        "enableSystemPrint", "useHotFolder" -> 
            v1Value.toBooleanFlag(default = false) // Convert lenient to strict
        
        "hotFolderPath" -> 
            v1Value.takeIf { !it.isNullOrBlank() } ?: V2_DEFAULT_PATH
        
        else -> { // Timeout fields
            val intVal = v1Value?.toIntOrNull() ?: DEFAULT_TIMEOUT
            intVal.coerceIn(0, 3600) // Clamp to valid range
        }
    }
}
```

---

## 7. UI/UX Migration

### 7.1 V1 UI Controls (SettingsTabContent.kt)
| Control | Location | Behavior | Migration Status |
|---------|----------|----------|-----------------|
| **Status Cards** | L50-55 (4 cards) | Read-only config display | **IMPLEMENTED** (V1Settings.tsx) |
| **Print Switch** | L62-63 | Toggle `enableSystemPrint` | **PARTIAL** (disabled) |
| **Camera Option Cards** | L73-76 | Select `useHotFolder` true/false | **PARTIAL** (disabled) |
| **Hot Folder Text Field** | L82-83 | Edit `hotFolderPath` | **MISSING** |
| **File Chooser Button** | L84-90 | Native JFileChooser dialog | **MISSING** |
| **Timeout Steppers** | L121-125 | ±10s, 0-3600 range | **IMPLEMENTED** |
| **Save Button** | L134-137 | Calls `onSaveSettings()` | **IMPLEMENTED** |
| **Printer Info Chips** | L65-69 | Display `printerNameStrip/Full` | **MISSING** |
| **Canon EDSDK Dropdowns** | L96-118 | Live hardware controls | **OUT OF SCOPE** |

### 7.2 V2 UI Migration Tasks
| Task | Priority | Estimated Effort | Owner |
|------|----------|-----------------|-------|
| **Enable existing controls** | High | 2 hours | Frontend Coder |
| **Add hot folder text field** | High | 4 hours | Frontend Coder |
| **Implement file chooser** | Medium | 8 hours | Frontend + Tauri |
| **Add printer info chips** | Low | 3 hours | Frontend Coder |
| **Connect real production gates** | Medium | 4 hours | Backend Engineer |
| **Polish visual fidelity** | Low | 6 hours | UI Designer |

### 7.3 Visual Fidelity Requirements
| Aspect | V1 Example | V2 Target |
|--------|------------|-----------|
| **Spacing** | 20dp padding, 16dp gaps | Exact match |
| **Colors** | `AccentNude`, `NeutralText`, etc. | Color palette match |
| **Typography** | Material Theme typography scale | CSS equivalent |
| **Card styling** | White background, 1dp border, 16dp radius | Exact visual match |
| **Stepper buttons** | 52dp square, 12dp radius, border | Pixel-perfect |
| **Vietnamese text** | Exact strings from V1 | Copy verbatim |

---

## 8. Behavioral Semantics Migration

### 8.1 Apply Timing Differences
| Setting | V1 Apply | V2 Apply | Migration Consideration |
|---------|----------|----------|-------------------------|
| `enableSystemPrint` | Immediate (next print) | `NEXT_SESSION` | Similar enough |
| `useHotFolder` | Requires restart | `PENDING_DISABLED` + restart | V2 more explicit |
| `hotFolderPath` | Requires restart | `PENDING_DISABLED` + restart | V2 more explicit |
| Timeout fields | Immediate (next timer) | `NEXT_SESSION` | V2 more conservative |
| Canon params | Immediate hardware | Out of scope | Not applicable |

### 8.2 Save Feedback Differences
| Aspect | V1 | V2 | Migration Impact |
|--------|----|----|-----------------|
| **Success Message** | "Đã lưu cài đặt" for 3s | Returns `{saved: true}` | V2 programmatic |
| **Error Handling** | Silent (fire-and-forget) | Exception thrown | V2 more reliable |
| **Auto-save on Exit** | Admin back button saves | Optional `registerExit` | Similar concept |
| **Session Blocking** | Allowed mid-session | Blocked (`-32001`) | **BREAKING CHANGE** |

### 8.3 Session Gating Migration
**V1 Behavior**: Settings can be saved anytime, even during active customer session (AdminScreen.kt L100).

**V2 Behavior**: `operator.updateSettings` rejects with error `-32001` if session is active (OperatorSettingsTest.kt L76).

**Migration Strategy**:
1. Document this behavior change
2. Consider adding "save for next session" queuing
3. Or keep V2 stricter behavior (recommended)

### 8.4 Opt-in Requirement Migration
**V1**: Settings always available in Admin tab.

**V2**: Requires `localOperatorEnabled=true` flag in SimulatorSessionEngine.

**Migration**: This is a simulator/dev feature. Production V2 would always have operator enabled.

---

## 9. Test Migration Strategy

### 9.1 V1 Test Coverage Gaps
| Test Area | V1 Evidence | Coverage |
|-----------|-------------|----------|
| **Settings Persistence** | None found | **GAP** |
| **Validation Edge Cases** | None found | **GAP** |
| **Concurrent Access** | None found | **GAP** |
| **File Corruption Recovery** | None found | **GAP** |
| **Migration Paths** | N/A (no migration in V1) | **GAP** |

### 9.2 V2 Test Strategy
| Test Category | Test Cases | Status |
|---------------|------------|--------|
| **Validation** | Invalid types, out of range, missing keys | **IMPLEMENTED** |
| **Persistence** | Save/reload, atomic write, corruption recovery | **PARTIAL** |
| **Concurrency** | Multiple IPC calls, session gating | **PARTIAL** |
| **Migration** | V1 .env → V2 JSON conversion | **NOT STARTED** |
| **UI Integration** | Controls → IPC → persistence | **NOT STARTED** |

### 9.3 Migration Test Plan
```kotlin
// Suggested migration tests
@Test fun migrationFromV1Env() {
    // Create V1 .env file with various values
    val v1Env = """
        ENABLE_SYSTEM_PRINT=yes
        USE_HOT_FOLDER=true
        HOT_FOLDER_PATH=E:\Photobooth\HotFolder
        POST_CAPTURE_TIMEOUT_SECONDS=9999
        PHOTO_SELECTION_TIMEOUT_SECONDS=-5
        FRAME_SELECTION_TIMEOUT_SECONDS=60
    """.trimIndent()
    
    // Run migration
    val migrated = migrateV1ToV2(v1Env)
    
    // Verify migrated values are valid
    assertEquals(true, migrated["enableSystemPrint"].asBoolean)
    assertEquals(true, migrated["useHotFolder"].asBoolean)
    assertEquals(3600, migrated["postCaptureTimeoutSeconds"].asInt) // clamped
    assertEquals(0, migrated["photoSelectionTimeoutSeconds"].asInt) // clamped
}
```

---

## 10. Implementation Roadmap

### 10.1 Phase 1: Complete Current Implementation (Week 1)
1. **Enable V1Settings.tsx controls** - Remove `disabled` flags
2. **Add hot folder text field** - Basic input with validation
3. **Connect IPC fully** - Live load/save with error handling
4. **Add printer info display** - Read from config (not operator)

### 10.2 Phase 2: File Chooser & Polish (Week 2)
1. **Implement file chooser** - Tauri dialog API or fallback
2. **Production gate detection** - Real hardware/feature detection
3. **Visual fidelity polish** - Match V1 exactly
4. **Enhanced validation feedback** - Field-specific error messages

### 10.3 Phase 3: Migration Tools (Optional - Week 3)
1. **Migration helper utility** - CLI tool to convert V1 .env → V2 JSON
2. **Migration UI** - "Import from V1" button in settings
3. **Backward compatibility** - Read V1 .env as fallback if V2 JSON missing
4. **Documentation** - Operator migration guide

### 10.4 Phase 4: Advanced Features (Future)
1. **Partial updates** - Update single fields instead of all 6
2. **Settings profiles** - Save/load preset configurations
3. **Advanced validation** - Path existence check, printer availability
4. **Audit logging** - Who changed what when

---

## 11. Risk Mitigation Plan

### 11.1 Identified Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Operator confusion** | High | Medium | Clear documentation, migration guide |
| **Data loss** | Low | High | Backup V1 .env before migration |
| **Validation too strict** | Medium | Medium | Migration tool handles conversions |
| **UI incomplete** | High | High | Phase 1 completes critical UI |
| **File chooser complexity** | Medium | Low | Fallback to manual path entry |

### 11.2 Rollback Strategy
If migration issues occur:
1. **V2 settings corrupted**: Delete `operator-settings.json`, defaults reload
2. **UI not working**: Disable operator tab, use defaults
3. **Critical failure**: Revert to V1 while fixing V2
4. **Data preservation**: Always backup V1 .env files

### 11.3 Communication Plan
| Stakeholder | Message | Timing |
|-------------|---------|--------|
| **Operators** | "V2 requires re-entry of 6 settings values" | Pre-deployment |
| **Developers** | "Clean break from V1 .env system" | Implementation start |
| **Testers** | "Test migration path if implemented" | Test phase |
| **Support** | "V2 has stricter validation" | Training |

---

## 12. Summary & Recommendations

### 12.1 Migration Decision Summary
**Current Path**: Clean break, no automatic migration
- **Pros**: Simpler implementation, no migration bugs, fresh start
- **Cons**: Operator re-entry required, potential for errors
- **Recommended for**: Initial V2 rollout, controlled deployment

**Alternative Path**: Automatic migration helper
- **Pros**: Smooperator transition, preserves settings
- **Cons**: Complex, validation differences, edge cases
- **Consider for**: Mass production rollout

### 12.2 Critical Success Factors
1. **Complete UI parity** - Operators must recognize the interface
2. **Clear documentation** - Migration steps, behavior changes
3. **Strict validation** - Prevent bad data, but with helpful errors
4. **Reliable persistence** - No data loss, atomic operations
5. **Performance** - Settings load/save must be fast

### 12.3 Final Recommendations
1. **Proceed with clean break** - Current V2 approach is valid
2. **Complete Phase 1 immediately** - Enable controls, add missing fields
3. **Document behavior changes** - Session gating, stricter validation
4. **Prepare migration helper** - Optional tool for production rollout
5. **Test thoroughly** - Especially zero timeout and edge cases

**Migration Complete When**:
- [ ] All 6 operator settings have UI controls
- [ ] Settings persist correctly across restarts
- [ ] Validation rejects invalid values with clear errors
- [ ] UI matches V1 visual fidelity
- [ ] Documentation covers migration steps
- [ ] Operators can successfully configure V2