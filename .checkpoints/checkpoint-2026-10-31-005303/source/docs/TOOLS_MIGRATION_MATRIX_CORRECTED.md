# Tools Migration Matrix - CORRECTED

**Authority Sources (V1 Read-only):**
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\AdminScreen.kt:123,139-141,226-241` (6 admin tabs with exact content)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\engine\LayoutCalculatorTool.kt:56` (CalculatorApp)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\FilterAdminView.kt:43-45` (FilterAdminView callbacks)

---

## 1. EXACT Admin Tools Structure (AdminScreen.kt)

### 1.1 Tab 3: "Công cụ" (Tools)
| Tool | Implementation | Line Reference | Purpose | V2 Status |
|------|----------------|----------------|---------|-----------|
| **CalculatorApp** | `engine.CalculatorApp(config, layouts)` | AdminScreen.kt:239 | Layout/frame geometry calculator | **NOT STARTED** (no backend contract) |

**Exact source**: `AdminScreen.kt:237-239`:
```kotlin
} else if (selectedTab == 3) {
    // Calculator App (Firebase Tool)
    com.phuctran.photobooth.desktop.engine.CalculatorApp(config, layouts)
}
```

### 1.2 Tab 4: "Màu ảnh" (Photo Colors)
| Tool | Callback Signature | Line Reference | Purpose | V2 Status |
|------|-------------------|----------------|---------|-----------|
| **FilterAdminView** | Component with 4 callbacks | AdminScreen.kt:240-241 | LUT/effect management | **NOT STARTED** (no backend contract) |
| **onSaveEffects** | `(List<EffectMode>) -> Unit` | FilterAdminView.kt:43 | Save effect configurations | **NOT STARTED** |
| **onImportLut** | `(Path) -> Unit` | FilterAdminView.kt:44 | Import .cube LUT file | **NOT STARTED** |
| **onPreviewEffect** | `(EffectMode, BufferedImage) -> BufferedImage` | FilterAdminView.kt:45 | Preview effect on sample image | **NOT STARTED** |

**Exact source**: `AdminScreen.kt:240-241`:
```kotlin
} else if (selectedTab == 4) {
    FilterAdminView(effects = effects, onSaveEffects = onSaveEffects, onImportLut = onImportLut, onPreviewEffect = onPreviewEffect)
}
```

**Note**: `onPreviewEffect` callback exists, but implementation is `controller.previewEffect()` (DesktopBoothController.kt:87-92).

---

## 2. REAL Tools vs Utility Distinction

### 2.1 REAL Tools (Operator-facing, Admin tabs)
| Tool | Admin Tab | Classification | Evidence |
|------|-----------|----------------|----------|
| **CalculatorApp** | Tab 3 "Công cụ" | **REAL TOOL** | Layout/frame geometry calculator |
| **FilterAdminView** | Tab 4 "Màu ảnh" | **REAL TOOL** | LUT/effect management UI |
| **Frame management** | Tab 0 "Khung" | **REAL TOOL** | Add/delete frames |
| **Layout configuration** | Tab 1 "Bố cục" | **REAL TOOL** | Save/delete layout config |
| **RevenueScreen** | Tab 5 "Doanh thu" | **REAL TOOL** | Sales reporting |

### 2.2 NOT Tools (Core application flow)
| Item | Classification | Reason |
|------|---------------|--------|
| **Session state transitions** | Core application flow | Customer session, not operator tool |
| **Camera parameter controls** | Hardware integration | Part of camera service, not standalone tool |
| **Print job submission** | Customer flow | Automatic after confirmation |
| **Beauty processing** | Image pipeline | Automatic if enabled, not operator tool |
| **File chooser dialogs** | UI utility | Component, not standalone tool |

---

## 3. Tools Implementation Status

### 3.1 V1 Tools (ALL NOT STARTED in V2)
| Tool Category | V1 Implementation | V2 Status | Blocked On |
|---------------|-------------------|-----------|------------|
| **CalculatorApp** | `engine.CalculatorApp(config, layouts)` | **NOT STARTED** | Backend contract |
| **FilterAdminView** | LUT/effect management UI | **NOT STARTED** | Backend contract |
| **Frame management** | Add/delete frames with JFileChooser | **NOT STARTED** | Backend contract + file chooser |
| **Layout configuration** | Save/delete layout config | **NOT STARTED** | Backend contract |
| **Revenue reporting** | Sales metrics and graphs | **NOT STARTED** | Backend contract |

### 3.2 File Operation Tools
| Tool | V1 Implementation | V2 Requirement | Status |
|------|-------------------|----------------|--------|
| **JFileChooser** | Native Swing dialog | Tauri dialog API or equivalent | **NOT STARTED** |
| **File import** | PNG frame import, .cube LUT import | Secure file access | **NOT STARTED** |

---

## 4. Beauty Tools Status - CORRECTED

**STATUS: ❌ UNVERIFIED/BLOCKED**

**Affected tools:**
- `FilterAdminView` (Tab 4 "Màu ảnh")
- Beauty-related configuration (`isBeautyEnabled`, `beautyPreset`)

**Evidence:**
- Source files exist but candidate5d65460 unapproved
- **No approved manifest** found in source inspection
- **Cannot copy/retune** without approval

**Blocked from migration until approved.**

---

## 5. V2 Current Tools Implementation

### 5.1 Implemented
| Tool/Component | V2 Implementation | Status | Test Evidence |
|----------------|-------------------|--------|---------------|
| **Settings UI structure** | V1Settings.tsx | **PARTIAL** (controls disabled) | UI mock present |
| **Admin tab structure** | Operator.tsx | **PARTIAL** (6 tab UI mock) | UI structure exists |
| **Session flow simulator** | SimulatorSessionEngine.kt | **IMPLEMENTED SYNTHETIC FLOW** | 20/42 tests |

### 5.2 NOT Implemented (Tools specifically)
| V1 Tool | V2 Status | Reason |
|---------|-----------|--------|
| **CalculatorApp** | **NOT STARTED** | No backend contract |
| **FilterAdminView** | **NOT STARTED** | No backend contract |
| **Frame management** | **NOT STARTED** | No backend contract |
| **Layout configuration** | **NOT STARTED** | No backend contract |
| **Revenue reporting** | **NOT STARTED** | No backend contract |

### 5.3 Tauri Desktop Framework
- **Present**: `src-tauri/` directory exists
- **File dialog API**: Available but not integrated
- **Status**: Framework present, tools not implemented

---

## 6. Priority Correction

### 6.1 HIGH PRIORITY (User Tools)
1. **Enable V1Settings controls** - With backend auth (not blindly)
2. **File chooser integration** - Tauri dialog API for actual tools
3. **Complete hot folder UI** - For hot folder configuration tool
4. **Admin tools backend contracts** - CalculatorApp, frame management

### 6.2 Corrected: NOT "medium priority"
**Previous error**: "User Tools high priority not medium" - CORRECTED

**Actual priority**:
- **HIGH**: User settings/tools (operator-facing)
- **MEDIUM**: Hardware integration (camera/printer)
- **BLOCKED**: Beauty (UNVERIFIED)

### 6.3 Enable Controls Safely
**Requirement**: Backend auth to enable UI controls, not blindly enable.

**Current V1Settings.tsx status**: Controls `disabled` - correct until backend auth implemented.

---

## 7. Exact Source Citations

### 7.1 Admin Tabs Structure
- `AdminScreen.kt:123` - 6 tab labels: "Khung", "Bố cục", "Cài đặt", "Công cụ", "Màu ảnh", "Doanh thu"
- `:139-141` - Tab 5: `RevenueScreen(salesRepository, DesktopRevenueClient(), config)`
- `:226-236` - Tab 2: `SettingsTabContent(...)`
- `:237-239` - Tab 3: `CalculatorApp(config, layouts)`
- `:240-241` - Tab 4: `FilterAdminView(effects, onSaveEffects, onImportLut, onPreviewEffect)`

### 7.2 Tools Implementation
- `engine/LayoutCalculatorTool.kt:56` - `CalculatorApp(config, layouts)` implementation
- `FilterAdminView.kt:43-45` - Callback signatures for LUT/effect tools
- `DesktopBoothController.kt:87-92` - `previewEffect` implementation (called by FilterAdminView)

### 7.3 NOT Tools
- **SessionState transitions** - Core flow, not tools
- **Camera controls** - Hardware service, not tools
- **Print submission** - Customer flow, not tools

---

## 8. Remaining Audit Limits

### 8.1 Verified Through Source
- ✅ 6 admin tabs with exact content references
- ✅ CalculatorApp real tool existence
- ✅ FilterAdminView callbacks signature
- ✅ Tools vs non-tools distinction
- ✅ V2 current implementation state

### 8.2 NOT Verified
- ❌ Beauty tool approval status (UNVERIFIED/BLOCKED)
- ❌ Backend contract feasibility for tools
- ❌ File chooser integration complexity
- ❌ Performance of CalculatorApp geometry calculations
- ❌ Security of file import operations

### 8.3 Partial Completion
**This audit**: Tools identification and classification complete
**Remaining**: Implementation blocked on:
1. Backend contracts for tools
2. Beauty approval manifest
3. File chooser API integration

---

## 9. Summary of Corrections

### 9.1 Previously Incorrect - Now Corrected
| Previous Error | Correction | Source Evidence |
|----------------|------------|-----------------|
| "4 admin screens" | **6 ADMIN TABS** | AdminScreen.kt:123 |
| "CalculatorApp invented" | **REAL TOOL** | AdminScreen.kt:239 |
| "previewEffect assumption" | **CALLBACK EXISTS** | FilterAdminView.kt:45 |
| "User tools medium priority" | **HIGH PRIORITY** | Operator-facing tools |
| "Tools taxonomy invented" | **REAL vs UTILITY distinction** | Core flow vs operator tools |

### 9.2 Exact Tools Inventory
1. **Tab 3 "Công cụ"**: CalculatorApp (layout/frame calculator)
2. **Tab 4 "Màu ảnh"**: FilterAdminView (LUT/effect management)
3. **Tab 0 "Khung"**: Frame management (add/delete)
4. **Tab 1 "Bố cục"**: Layout configuration
5. **Tab 5 "Doanh thu"**: Revenue reporting

**Total: 5 real operator tools** across admin tabs.

### 9.3 Beauty Status Remains
**UNVERIFIED/BLOCKED** - candidate5d65460 unapproved, no manifest.

---

**Correction Complete**: Exact admin tools structure documented. REAL tools vs utility distinction established. Beauty UNVERIFIED/BLOCKED. All claims reference specific source file paths and line numbers.