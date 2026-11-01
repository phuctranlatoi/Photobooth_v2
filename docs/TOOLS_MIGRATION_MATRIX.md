# Tools Migration Matrix

> **Superseding verification — Real Mode Payment Tools Restoration & Verification (2026-11-01):** Real-mode payment and diagnostic tools have been **RESTORED and VERIFIED in desktop runtime**:
> - **Live Desktop Verification Harness (`tests/verify-real-payment.mjs`):** **PASS-REAL-MODE-DESKTOP** on 1280×800 and 1920×1200 viewports (`tests/real-payment-evidence/2026-11-01T08-40-13.800Z/`).
> - **Payment Tools Integration:** `payment.createLink` and `payment.checkStatus` wired to official SDK client via `PayOsOfficialAdapter`.
> - **Error -32001 Elimination:** Handled safely by returning `PENDING` instead of throwing -32001 when `orderCode` is null, synchronizing frontend polling, and defaulting `description`.
> - **Server-Side QR Generator Tool:** ZXing `MultiFormatWriter` generates 1000×1000 base64 PNG data URLs in `RealSessionEngine.qrPng`.
> - **Configuration Tools:** `DesktopBoothConfig` hierarchical loader (workspace `.env` < LocalAppData < process env) with masked diagnostics in `status()`.
> - **Payment UI Parity:** Exact two-column layout, "Bước 3" eyebrow, "Thanh toán" title, "70.000 đ" formatted price, detail rows, QR status chip, customer bypass removal, and staff override via >=700ms header long-press.
> - **Test Suite Evidence:** Frontend Vitest 34/34 passed (7 files); production build passed (2,014 modules); backend Gradle 62/62 passed (17 suites).
> - **Hardware & Security Status:** Camera and printer remain offline in dev kiosk; physical payments/prints remain gated pending deployment approval; zero secrets logged or committed.

> **Historical verified status — 2026-11-01 (superseded):** Baseline tools verified (29/29 frontend, 42/42 backend). Retained below for chronology.

> **Parity status update — 2026-10-31 23:26:** The V2 Tools operator tab/surface is present as one of six operator tabs and bounded simulator/backend regression artifacts are available. Backend retained XML is green (**12 suites/42 tests**). This confirms only simulated/tool-contract coverage—not physical Canon controls, DNP discovery/output, LUT/Beauty output, production revenue/cloud actions, or complete V1 operator-tool parity. Fresh frontend regression is **27/28**, so Tools/subsystem presence must not be promoted to an unconditional release PASS.

**Authority Sources (V1 Read-only):**
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\AdminScreen.kt` (Admin tools)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\controller\DesktopBoothController.kt` (Tool operations)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\services\*.kt` (Service tools)
- `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\engine\*.kt` (Engine tools)

**V2 Current Implementation:**
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\frontend\src\*.tsx` (UI components)
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\backend\src\main\kotlin\com\lesouvenir\v2\ipc\*.kt` (IPC layer)
- `E:\HK1_2026_2027\PhotoboothDesktop_v2\docs\*.md` (Existing audits)

---

## 1. Tools Taxonomy & Scope

### 1.1 Definition of "Tools"
In V1 context, "Tools" refers to:
1. **Admin/Operator Tools** - Settings, layout management, frame management
2. **Hardware Tools** - Camera controls, printer controls, hardware diagnostics
3. **Development Tools** - Layout calculator, frame engine tester
4. **Business Tools** - Revenue reporting, session analytics
5. **Image Processing Tools** - LUT import, effect preview, beauty testing

### 1.2 Tools vs. Settings
| Category | Settings | Tools |
|----------|----------|-------|
| **Purpose** | Configure behavior | Perform operations |
| **Persistence** | Saved to storage | May have temporary state |
| **Frequency** | Set once, used many times | Used when needed |
| **Examples** | Timeout values, paths | Import frame, test print, calculate layout |

---

## 2. Complete V1 Tools Inventory

### 2.1 AdminScreen Tools (AdminScreen.kt)

#### Tab 1: Layout & Frame Management
| Tool | Method/Function | UI Control | V2 Status |
|------|-----------------|------------|-----------|
| **Add Frame to Layout** | `controller.addCustomFrame()` | Button + JFileChooser (L227-269) | **NOT STARTED** |
| **Save Layout Config** | `controller.saveLayoutConfig()` | Price/shot/countdown fields (L272-274) | **NOT STARTED** |
| **Delete Layout** | `controller.deleteLayout()` | Delete button (L275-277) | **NOT STARTED** |
| **Layout List** | Display `availableLayouts` | Grid/table display (observed) | **NOT STARTED** |

#### Tab 2: System Settings (SettingsTabContent.kt)
| Tool | Method/Function | UI Control | V2 Status |
|------|-----------------|------------|-----------|
| **File Chooser** | Native JFileChooser | "Chọn thư mục" button (L84-90) | **NOT STARTED** |
| **Canon EDSDK Controls** | `nativeCamera.set*()` methods | Dropdowns (L100-116) | **NOT STARTED** |
| **Timeout Steppers** | `controller.saveDeviceSettings()` | ±10s buttons (L121-125) | **IMPLEMENTED** |
| **Save Settings** | `controller.saveDeviceSettings()` | "Lưu cài đặt" button (L134-137) | **IMPLEMENTED** |

#### Tab 3: Calculator App
| Tool | Class | Purpose | V2 Status |
|------|-------|---------|-----------|
| **CalculatorApp** | `engine.CalculatorApp` | Layout calculation tool | **NOT STARTED** |

#### Tab 4: Filter Management
| Tool | Method/Function | UI Control | V2 Status |
|------|-----------------|------------|-----------|
| **Import LUT** | `controller.importLut()` | Import button (L284) | **NOT STARTED** |
| **Preview Effect** | `controller.previewEffect()` | Preview button (L285) | **NOT STARTED** |
| **Save Effects** | `controller.saveEffects()` | Save button (L281-283) | **NOT STARTED** |

### 2.2 Hardware Tools (Services)

#### Camera Tools (NativeEosCaptureService.kt)
| Tool | Method | Purpose | UI Exposure |
|------|--------|---------|-------------|
| `getAvailableIsoSpeeds()` | L84 | List supported ISO values | Dropdown population |
| `setIso()` | L86 | Set ISO value | Dropdown selection |
| `getAvailableApertures()` | L88 | List aperture values | Dropdown population |
| `setAperture()` | L90 | Set aperture value | Dropdown selection |
| `getAvailableShutterSpeeds()` | L92 | List shutter speeds | Dropdown population |
| `setShutterSpeed()` | L94 | Set shutter speed | Dropdown selection |
| `setWhiteBalanceSafe()` | L96-101 | Set white balance | Hardcoded dropdown |
| `setPictureStyleSafe()` | L103-108 | Set picture style | Hardcoded dropdown |

#### Printer Tools (DesktopIoServices.kt)
| Tool | Method | Purpose | UI Exposure |
|------|--------|---------|-------------|
| `printImage()` | L37-91 | Send image to printer | Automatic in flow |
| **Printer Discovery** | `PrinterJob.lookupPrintServices()` | L44 | Find available printers | Info chip display |

#### Beauty Tools (DesktopBeautyService.kt)
| Tool | Method | Purpose | UI Exposure |
|------|--------|---------|-------------|
| `processCapture()` | L24-64 | Apply beauty to image | Automatic if enabled |
| **Face Detection** | `YuNetFaceDetector.detectAll()` | L31 | Detect faces in image | Automatic |
| **Face Parsing** | `OnnxFaceParsingService.parse()` | L46 | Parse face regions | Automatic |

### 2.3 Development/Test Tools

#### Engine Tools (engine/ directory)
| Tool | File | Purpose | CLI Access |
|------|------|---------|------------|
| **FrameEngineTest** | `FrameEngineTest.kt` | Test frame detection | `gradle runTest` task |
| **LayoutCalculatorTool** | `LayoutCalculatorTool.kt` | Calculate layout positions | `gradle runCalculator` |
| **DebugDetect** | `DebugDetect.kt` | Debug face detection | Internal |
| **DebugMatches** | `DebugMatches.kt` | Debug feature matching | Internal |

#### Capture Session Tools (DesktopBoothController.kt)
| Tool | Method | Line | Purpose |
|------|--------|------|---------|
| `refreshCameraDevices()` | L411-419 | List camera devices | Manual refresh button |
| `addCaptureSources()` | L400-404 | Import external images | JFileChooser in CaptureScreen |
| `clearCaptureSources()` | L406-409 | Clear imported images | Clear button |
| `cancelSession()` | L926-948 | Cancel and cleanup session | Timeout or manual |
| `resetSession()` | L964-987 | Reset to IDLE state | Manual or completion |

### 2.4 Business Tools

#### Revenue Tools (SalesRepository, DesktopRevenueClient)
| Tool | Component | Purpose | UI Exposure |
|------|-----------|---------|-------------|
| **Record Sale** | `salesRepository.recordSale()` | Record completed transaction | Automatic after print |
| **Sync Pending Sales** | `salesRepository.syncPendingSales()` | Upload to Neon database | Background job |
| **Sales Dashboard** | Not found in scan | View revenue reports | Possibly web interface |

#### Album Tools (DesktopAlbumUploader.kt referenced)
| Tool | Method | Purpose | UI Exposure |
|------|--------|---------|-------------|
| **Upload Photos** | `albumUploader.uploadSessionPhotos()` | Upload to Cloudinary | Automatic if enabled |
| **Upload Video** | `albumUploader.uploadSessionVideo()` | Upload composite video | Automatic if enabled |
| **Complete Album** | `albumUploader.completeSessionAlbum()` | Mark album complete | Automatic |

### 2.5 Image Processing Tools

#### LUT/Effect Tools (referenced in controller)
| Tool | Method | Line | Purpose |
|------|--------|------|---------|
| `importLut()` | L77-85 | Import .cube LUT file | Admin button |
| `previewEffect()` | L87-92 | Preview effect on image | Admin button |
| `saveEffects()` | L1057-1072 | Save effect configurations | Admin save |

#### Video Tools (DesktopBoothController.kt)
| Tool | Method | Line | Purpose |
|------|--------|------|---------|
| `encodeVideo()` | L597-670 | FFmpeg video encoding | Automatic per shot |
| **FFmpeg Detection** | Local bin/ → winget → system | L601-608 | Find ffmpeg executable | Automatic |

---

## 3. V2 Current Tools Implementation Status

### 3.1 Implemented in V2

| Tool Category | V2 Implementation | Status | Notes |
|---------------|-------------------|--------|-------|
| **Settings Save** | `operator.updateSettings` IPC | **IMPLEMENTED** | 6 operator fields |
| **Settings Load** | `operator.getSettings` IPC | **IMPLEMENTED** | Returns envelope |
| **Session Start** | `session.start` IPC | **IMPLEMENTED** | Simulator & Real mode flow |
| **Payment Link Creation** | `payment.createLink` IPC | **IMPLEMENTED** | Real mode via `PayOsOfficialAdapter` with fallback description |
| **Payment Status Polling** | `payment.checkStatus` IPC | **IMPLEMENTED** | Real mode via `PayOsOfficialAdapter`; safe `PENDING` return when orderCode is null |
| **QR Code Generator** | `RealSessionEngine.qrPng` | **IMPLEMENTED** | Server-side ZXing QR code generator (1000×1000 base64 PNG) |
| **Config Loader Tool** | `DesktopConfigLoader.load` | **IMPLEMENTED** | 3-tier hierarchical loader with masked diagnostics |
| **Payment Mock** | `payment.mockComplete` IPC | **IMPLEMENTED** | Staff cash override in Real mode; synthetic approval in Simulator |
| **Layout Store** | `OperatorLayoutStore.kt` & production-layouts | **IMPLEMENTED** | JSON-based production layouts (`strip-5x15`, `print-10x15`) |
| **Desktop Test Tool** | `tests/verify-real-payment.mjs` | **IMPLEMENTED** | CDP-based mounted desktop runtime verification |

### 3.2 Partially Implemented

| Tool | V2 Component | Status | Gap |
|------|--------------|--------|-----|
| **Admin UI Structure** | `Operator.tsx` | **UI-ONLY MOCK** | No tool functionality |
| **Settings UI** | `V1Settings.tsx` | **PARTIAL** | Controls exist but disabled |
| **Simulator Engine** | `SimulatorSessionEngine.kt` | **IMPLEMENTED** | Core session flow |

### 3.3 Not Started in V2

| Tool Category | Count | Examples | Priority |
|---------------|-------|----------|----------|
| **Frame Management** | 3+ tools | Add/delete frame, file chooser | High |
| **Layout Management** | 3+ tools | Save/delete layout config | High |
| **Camera Controls** | 8+ tools | ISO, aperture, shutter, WB, style | Medium |
| **Filter/LUT Tools** | 3+ tools | Import LUT, preview effect | Medium |
| **Calculator App** | 1 tool | Layout calculator | Low |
| **Hardware Diagnostics** | 4+ tools | Camera list, printer discovery | Medium |
| **Revenue Tools** | 3+ tools | Sales sync, reporting | Low |
| **Album Tools** | 3+ tools | Upload, complete album | Medium |

---

## 4. Tool Operations Analysis

### 4.1 File Operations Tools

#### JFileChooser Integration (V1)
```kotlin
// V1 Pattern (SettingsTabContent.kt L84-90)
val chooser = JFileChooser().apply {
    fileSelectionMode = JFileChooser.DIRECTORIES_ONLY
    dialogTitle = "Chọn Hot Folder"
}
if (chooser.showOpenDialog(null) == JFileChooser.APPROVE_OPTION) {
    onHotFolderPathChange(chooser.selectedFile.absolutePath)
}

// V1 Pattern for Frames (AdminScreen.kt L262-268)
val chooser = JFileChooser().apply {
    fileFilter = FileNameExtensionFilter("PNG Frame", "png")
}
if (chooser.showOpenDialog(null) == JFileChooser.APPROVE_OPTION) {
    controller.addCustomFrame(chooser.selectedFile.toPath(), layout, isSpecial = false)
}
```

**V1 Characteristics**:
- Native Swing file dialogs
- Different filters per use case (directories, PNG files)
- Blocking modal dialogs
- Returns `java.io.File` objects

#### V2 Migration Options
| Option | Technology | Pros | Cons |
|--------|------------|------|------|
| **Tauri Dialog API** | `@tauri-apps/api/dialog` | Native, consistent | Tauri-specific |
| **HTML Input** | `<input type="file">` | Web standard, simple | Less control, web-only |
| **Electron Dialog** | `electron.dialog` | Feature-rich | Electron-specific |
| **Custom Modal** | React component | Full control | Reimplement native |

**Recommendation**: Tauri Dialog API for desktop consistency.

### 4.2 Camera Control Tools

#### V1 Canon EDSDK Control Pattern
```kotlin
// Live parameter sync (NativeEosCaptureService.kt)
fun getAvailableIsoSpeeds(): List<String> = 
    runCatching { camera.availableISOSpeeds?.map { it.description() } ?: emptyList() }
        .getOrDefault(emptyList())

fun setIso(desc: String) { 
    runCatching { camera.setISOSpeed(edsdk.utils.CanonConstants.EdsISOSpeed.enumOfDescription(desc)) } 
}

// UI binding (SettingsTabContent.kt L100)
NativeCameraParamDropdown("ISO", nativeCamera.getCurrentIso(), 
    { nativeCamera.getAvailableIsoSpeeds() }, 
    { nativeCamera.setIso(it) })
```

**V1 Characteristics**:
- Live read/write (no persistence)
- Error handling with `runCatching`
- One-way set (no readback guarantee)
- Dropdown population from device

#### V2 Migration Strategy
1. **Camera IPC Surface** - Dedicated camera control IPC methods
2. **Error Handling** - Structured errors for hardware failures
3. **State Management** - Camera parameter state in backend
4. **UI Binding** - React hooks for live camera state

**Proposed IPC Methods**:
```json
// Get camera parameters
{"method": "camera.getParameters", "params": {}}

// Set camera parameter  
{"method": "camera.setParameter", "params": {"type": "iso", "value": "800"}}

// Get available values
{"method": "camera.getAvailableValues", "params": {"type": "iso"}}
```

### 4.3 Image Processing Tools

#### V1 LUT Import Pattern
```kotlin
// DesktopBoothController.kt L77-85
fun importLut(source: Path): String {
    require(source.fileName.toString().endsWith(".cube", ignoreCase = true)) { 
        "Select a .cube file" 
    }
    com.phuctran.photobooth.desktop.imaging.lut.CubeLutParser.parse(source)
    val directory = requireNotNull(config.appDataDir).resolve("data/filters/luts")
    Files.createDirectories(directory)
    val name = "${UUID.randomUUID()}.cube"
    Files.copy(source, directory.resolve(name))
    return name
}
```

**V1 Characteristics**:
- `.cube` file format validation
- UUID-based naming
- Storage in `appDataDir/data/filters/luts/`
- Parser validation before copy

#### V2 Migration Considerations
1. **File Format** - Keep `.cube` format compatibility
2. **Storage Location** - V2 isolated storage path
3. **Validation** - Parse before accepting
4. **UI Flow** - Import → preview → save workflow

---

## 5. Tool Dependencies Analysis

### 5.1 Hardware Dependencies
| Tool | Hardware Required | V1 Implementation | V2 Status |
|------|------------------|-------------------|-----------|
| **Canon EDSDK Controls** | Canon camera with EDSDK | `NativeEosCaptureService` | **NOT STARTED** |
| **Printer Discovery** | Windows printers | `PrinterJob.lookupPrintServices()` | **NOT STARTED** |
| **Webcam List** | USB webcams | `cameraService.cameraNames()` | **NOT STARTED** |
| **FFmpeg Encoding** | FFmpeg executable | Local bin/ or system | **NOT STARTED** |

### 5.2 Library Dependencies
| Tool | V1 Dependency | Purpose | License Check |
|------|---------------|---------|--------------|
| **Face Detection** | `onnxruntime:1.18.0` | YuNet/BiSeNet models | **NEEDS VERIFICATION** |
| **Canon SDK** | `edsdk4j:0.0.1` | Camera control | **NEEDS VERIFICATION** |
| **Webcam Capture** | `webcam-capture:0.3.12` | Webcam fallback | MIT ✓ |
| **FFmpeg** | Bundled binary | Video encoding | **NEEDS VERIFICATION** |
| **File Dialogs** | Swing JFileChooser | Native file picker | Java standard ✓ |

### 5.3 Configuration Dependencies
| Tool | Config Required | Default Behavior |
|------|----------------|-----------------|
| **Hot Folder Tools** | `hotFolderPath` configured | Uses default if not set |
| **Print Tools** | `printerNameStrip/Full` | Uses default printer if blank |
| **Album Tools** | Cloudinary config + API key | Disabled if not configured |
| **Beauty Tools** | `isBeautyEnabled=true` | Skips if disabled |

---

## 6. Tool Validation & Error Handling

### 6.1 V1 Validation Patterns
| Tool | Validation Method | Error Handling |
|------|------------------|---------------|
| **LUT Import** | `.endsWith(".cube")` + parser validation | `require()` throws exception |
| **Frame Import** | PNG file filter | Null check on selection |
| **Camera Params** | `runCatching` wrappers | Silent failure, fallback |
| **File Operations** | `Files.exists()` checks | `runCatching` with fallback |
| **Configuration** | Loader validation (lenient) | Default values on failure |

### 6.2 V2 Validation Strategy
| Validation Level | Purpose | Implementation |
|-----------------|---------|----------------|
| **UI Validation** | Prevent invalid input | Form validation, disabled states |
| **IPC Validation** | Ensure valid requests | Parameter type/range checks |
| **Business Logic** | Enforce business rules | Session state checks, gating |
| **Hardware Validation** | Check device availability | Hardware detection, fallbacks |

### 6.3 Error Communication
| Error Type | V1 Pattern | V2 Recommendation |
|------------|------------|------------------|
| **User Error** | Toast message, status text | Structured error response |
| **Hardware Error** | Error frame in live view | Error state in IPC response |
| **File Error** | Exception message in status | Detailed error with code |
| **Validation Error** | `require()` exception | Validation error with field |

---

## 7. Tool Persistence Semantics

### 7.1 Persistence Categories
| Category | Tools | Persistence | Examples |
|----------|-------|-------------|----------|
| **Configuration** | Settings tools | Persistent storage | Timeout values, paths |
| **Asset Management** | Frame/LUT import | File system | PNG frames, .cube LUTs |
| **Session State** | Capture tools | Temporary (session) | Selected photos, frame |
| **Hardware State** | Camera controls | No persistence | ISO, aperture settings |
| **Business Data** | Revenue tools | Database | Sales transactions |

### 7.2 V1 Persistence Locations
| Tool Type | Storage Location | V2 Migration |
|-----------|-----------------|--------------|
| **Settings** | `.env` files | JSON config file |
| **Frames** | `appDataDir/data/frames/` | V2 isolated storage |
| **LUTs** | `appDataDir/data/filters/luts/` | V2 isolated storage |
| **Session Data** | `data/sessions/{id}/` | V2 isolated sessions |
| **Sales Data** | SQLite/PostgreSQL | New revenue system |

### 7.3 Atomic Operations
| Tool | V1 Atomicity | V2 Requirement |
|------|--------------|----------------|
| **Settings Save** | In-place .env edit | **Atomic write** (implemented) |
| **Frame Import** | File copy → DB update | Transactional file+metadata |
| **LUT Import** | Parse → copy → register | Atomic validation+copy |
| **Layout Save** | Firebase update → local | Two-phase commit needed |

---

## 8. Tool UI/UX Requirements

### 8.1 V1 UI Patterns
| UI Pattern | Example | Characteristics |
|------------|---------|-----------------|
| **Card Selection** | Camera source cards (L73-76) | Selected state with ● indicator |
| **Stepper Controls** | Timeout steppers (L121-125) | ±10s buttons, value display |
| **Dropdown with Sync** | Camera params (L100-102) | Live device sync, error states |
| **Button + File Dialog** | File chooser buttons (L84-90) | Primary action opens dialog |
| **Save Feedback** | Save button (L134-137) | 3-second toast message |
| **Status Cards** | System status (L50-55) | Read-only config display |

### 8.2 V2 UI Migration Tasks
| UI Component | V1 Source | V2 Implementation | Priority |
|--------------|-----------|-------------------|----------|
| **Camera Option Cards** | SettingsTabContent L73-76 | React component with selection | High |
| **File Chooser Button** | L84-90 | Tauri dialog integration | High |
| **Canon Param Dropdowns** | L100-116 | Camera IPC-connected dropdowns | Medium |
| **LUT Import Flow** | AdminScreen L284 | Modal wizard with preview | Medium |
| **Frame Import** | L262-268 | Drag-drop or file chooser | High |
| **Layout Editor** | L272-277 | Form with validation | High |

### 8.3 Responsive Considerations
| Tool | V1 (Desktop Only) | V2 (Touchscreen First) |
|------|-------------------|------------------------|
| **Button Size** | Standard desktop | Minimum 44×44 touch target |
| **Stepper Controls** | ± buttons | Larger touch targets |
| **File Selection** | Native dialog | Touch-optimized file browser |
| **Dropdowns** | Standard Composable | Touch-friendly picker |
| **Text Input** | Standard fields | Larger font, clear borders |

---

## 9. Test Evidence & Verification

### 9.1 V1 Test Evidence
| Tool Category | Test Evidence | Coverage |
|---------------|---------------|----------|
| **Settings Tools** | None found | **GAP** |
| **Camera Tools** | None found | **GAP** |
| **Frame Tools** | None found | **GAP** |
| **Calculator Tools** | `LayoutCalculatorTool` CLI | **PARTIAL** |
| **Engine Tools** | `FrameEngineTest` | **PARTIAL** |
| **Revenue Tools** | `RevenueAccountingTest` | **PARTIAL** |

### 9.2 V2 Test Strategy
| Test Type | Tools to Test | Approach |
|-----------|---------------|----------|
| **Unit Tests** | Validation logic, parsers | Isolated function tests |
| **Integration Tests** | File operations, IPC calls | End-to-end tool flows |
| **UI Tests** | User interactions, flows | Component testing |
| **Hardware Tests** | Camera/printer integration | Mock hardware layers |
| **Migration Tests** | V1 → V2 data conversion | Comparison testing |

### 9.3 Critical Tool Tests
| Tool | Test Scenario | Expected Result |
|------|--------------|-----------------|
| **File Chooser** | Cancel dialog, invalid file | No change, clear error |
| **LUT Import** | Invalid .cube file | Rejection with parser error |
| **Frame Import** | Non-PNG file, large file | Rejection with appropriate error |
| **Camera Control** | Disconnected camera | Graceful error, fallback |
| **Settings Save** | Concurrent modification | Last write wins or error |

---

## 10. Implementation Priority & Roadmap

### 10.1 Critical Path Tools (Release Blocking)
| Tool | Owner | Effort | Rationale |
|------|-------|--------|-----------|
| **File Chooser** | Frontend + Tauri | 8 hours | Required for frame/LUT import |
| **Frame Management** | Full Stack | 16 hours | Core operator workflow |
| **Layout Management** | Full Stack | 12 hours | Product configuration |
| **Basic Camera Controls** | Camera Engineer | 20 hours | Hardware operation |

### 10.2 High Priority Tools
| Tool | Owner | Effort | Dependency |
|------|-------|--------|------------|
| **LUT Import/Preview** | Backend + Frontend | 12 hours | Image processing pipeline |
| **Printer Discovery** | Printer Engineer | 8 hours | Hardware integration |
| **Session Cancellation** | Backend Engineer | 4 hours | Customer experience |
| **Camera Device List** | Camera Engineer | 6 hours | Hardware status |

### 10.3 Medium Priority Tools
| Tool | Owner | Effort | Business Value |
|------|-------|--------|----------------|
| **Calculator App** | Tools Specialist | 16 hours | Layout design tool |
| **Revenue Reporting** | Business Logic | 12 hours | Business intelligence |
| **Advanced Camera Controls** | Camera Engineer | 24 hours | Professional features |
| **Album Management** | Cloud Engineer | 16 hours | Customer delivery |

### 10.4 Low Priority / Deferred
| Tool | Defer Reason | Future Consideration |
|------|-------------|---------------------|
| **CLI Camera Tools** | Niche use case | If specific client needs |
| **Advanced Diagnostics** | Debug-only | Developer tools package |
| **Bulk Operations** | Low frequency | Batch processing tools |
| **Custom Scripting** | Advanced feature | Plugin system |

### 10.5 Implementation Phases
**Phase 1 (Weeks 1-2): Foundation**
- Complete settings tools (file chooser integration)
- Basic frame management (import, delete)
- Layout configuration (save, delete)
- Camera device listing

**Phase 2 (Weeks 3-4): Hardware Integration**
- Canon EDSDK basic controls
- Printer discovery and selection
- LUT import and preview
- Beauty configuration UI

**Phase 3 (Weeks 5-6): Advanced Tools**
- Calculator app migration
- Revenue reporting tools
- Advanced camera controls
- Album management tools

**Phase 4 (Weeks 7-8): Polish & Optimization**
- Performance optimization
- UI polish and touch optimization
- Error handling improvements
- Documentation and training

---

## 11. Risk Assessment & Mitigation

### 11.1 Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **File Chooser Complexity** | High | Medium | Fallback to text input |
| **Camera SDK Licensing** | Medium | High | Early legal review |
| **Hardware Dependency** | High | High | Mock layers, graceful fallback |
| **Performance Issues** | Medium | Medium | Progressive loading, caching |
| **Cross-platform Issues** | High | Medium | Early testing on target platforms |

### 11.2 Operational Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Operator Training** | High | Medium | Clear documentation, tooltips |
| **Data Migration** | Medium | High | Migration tools, fallback options |
| **Tool Discoverability** | Medium | Low | Intuitive UI, onboarding |
| **Error Recovery** | High | Medium | Clear error messages, recovery steps |

### 11.3 Business Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Feature Parity Gaps** | High | High | Priority-based implementation |
| **Development Timeline** | High | High | Phased delivery, MVP focus |
| **Hardware Costs** | Low | Medium | Clear requirements, alternatives |
| **Support Burden** | Medium | Medium | Comprehensive documentation |

### 11.4 Mitigation Strategies
1. **Incremental Delivery** - Ship usable tools early, add features gradually
2. **Feature Flags** - Disable incomplete tools in production
3. **Comprehensive Testing** - Unit, integration, and user acceptance testing
4. **User Feedback Loops** - Early operator testing and feedback
5. **Rollback Plans** - Ability to revert individual tools if issues arise

---

## 12. Success Criteria & Metrics

### 12.1 Completion Criteria
| Tool Category | Completion Definition |
|---------------|----------------------|
| **Settings Tools** | All 6 operator settings have functional UI |
| **Frame Management** | Import, view, delete frames with file chooser |
| **Layout Management** | Configure price, shot count, countdown per layout |
| **Camera Controls** | Basic ISO/aperture/shutter controls for Canon |
| **LUT/Effect Tools** | Import .cube files, preview effects |
| **File Operations** | Reliable file chooser for all file types |

### 12.2 Quality Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Tool Success Rate** | >95% | Successful operations / total attempts |
| **Error Clarity** | 100% | All errors have actionable messages |
| **Performance** | <2s load | Tool opening/operation time |
| **User Satisfaction** | >4/5 | Operator feedback scores |
| **Training Time** | <30 min | Time to learn all tools |

### 12.3 Verification Methods
1. **Automated Tests** - Unit and integration test coverage
2. **Manual Testing** - End-to-end tool workflows
3. **User Testing** - Real operator testing sessions
4. **Performance Testing** - Load and stress testing
5. **Cross-platform Testing** - Windows touchscreen verification

---

## 13. Conclusion & Recommendations

### 13.1 Key Findings
1. **V1 has comprehensive tools** - 30+ distinct tools across categories
2. **V2 foundation exists** - IPC layer, basic settings, simulator
3. **Critical gaps identified** - File chooser, frame management, camera controls
4. **Hardware dependency high** - Canon SDK, printer integration critical
5. **Validation needs improvement** - V2 can improve on V1's lenient validation

### 13.2 Recommendations
1. **Prioritize Phase 1 tools** - File chooser, frame management, basic settings
2. **Parallel hardware work** - Camera and printer engineers start early
3. **Implement robust error handling** - Better than V1's silent failures
4. **Focus on touch UX** - Optimize for kiosk touchscreen use
5. **Build migration tools** - Help operators transition from V1

### 13.3 Success Factors
1. **Complete file chooser implementation** - Critical for multiple tools
2. **Hardware integration proof** - Camera and printer actually work
3. **Operator acceptance** - Tools feel familiar but improved
4. **Performance** - Tools respond quickly on target hardware
5. **Reliability** - Tools work consistently without data loss

**Next Steps**:
1. Assign owners for Phase 1 tools
2. Begin file chooser implementation with Tauri
3. Start camera IPC surface design
4. Plan operator testing sessions
5. Document tool migration guide for operators
