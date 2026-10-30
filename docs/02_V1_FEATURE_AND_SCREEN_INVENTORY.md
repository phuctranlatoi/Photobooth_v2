# 02 – V1 Feature & Screen Inventory

## 1. Top‑level screens (Compose UI) and their state mapping
| UI screen (Kotlin file) | SessionState shown | Primary UI elements | Navigation triggers (controller calls) |
|------------------------|--------------------|--------------------|---------------------------------------|
| `StartScreen.kt` | **IDLE** | Layout list, special‑bundle list, hidden admin tap | `controller.transitionTo(SessionState.SELECTING)` on start; `controller.transitionTo(SessionState.ADMIN)` on admin tap. |
| `StudioModeScreen.kt` | **SELECTING** | Layout grid, effect selector, *Start* button | `controller.chooseLayout(it)`, `controller.chooseEffect(it)`, `controller.confirmStudioSetup()` → transition to `SELECTING_QUANTITY`. |
| `QuantityScreen.kt` | **SELECTING_QUANTITY** | Quantity selector, price breakdown | `controller.setQuantityAndStartPayment(it)` → transition to `PAYMENT_PENDING`. |
| `PaymentScreen.kt` | **PAYMENT_PENDING** | QR code, amount, PayOS status | `controller.completePayment()` → transition to `PREPARING` (if paid). |
| `PrepareScreen.kt` | **PREPARING** | Brief “Get ready” message | `controller.transitionTo(SessionState.LIVE_VIEW)` after timeout. |
| `CaptureScreen.kt` (used for LIVE_VIEW, COUNTDOWN, CAPTURING) | **LIVE_VIEW / COUNTDOWN / CAPTURING** | Live‑view stream, countdown timer, capture button | `controller.startLiveView(...)`, `controller.startCaptureSequence()` → internal state transitions. |
| `SelectPhotosScreen.kt` | **SELECTING_PHOTOS** | Grid of captured moments, selection toggles | `controller.selectMoment(it)`; `controller.transitionTo(SessionState.EDITING)` on confirm. |
| `FilterAdminView.kt` (admin edit of frames/effects) | **EDITING** | Frame/effect browser, apply button | `controller.transitionTo(SessionState.PRINT_PENDING)` when done. |
| `PrintingScreen.kt` | **PRINT_PENDING / PRINTING** | Print preview, *In và tạo QR* button | `controller.startPrinting(userConfirmed = true)` → calls `PrinterService`. |
| `DeliveryScreen.kt` | **DELIVERY** | “In xong, lấy tại …” message, Done button | `controller.transitionTo(SessionState.IDLE)` when finished. |
| `AdminScreen.kt` | **ADMIN** | Toggle system print, hot‑folder path, timeout settings, QR‑album switch | Calls `controller.saveDeviceSettings(...)` which persists to `DesktopBoothConfig`. |
| `RevenueScreen.kt` | **REVENUE** (debug admin view) | Summary of sales, extra prints, revenue chart | Reads from `SalesRepository`. |

**Evidence**: Screen files are present under `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/`. Transition calls are seen in `DesktopBoothController.transitionTo` (grep output). UI composables reference controller state via `collectAsState()` (see `Main.kt` lines 50‑65). 

## 2. Settings / hidden actions (admin panel)
| Setting | Source (V1) | UI location | Runtime effect |
|---------|-------------|------------|----------------|
| `enableSystemPrint` (bool) | `DesktopBoothConfig.enableSystemPrint` (default false) – `src/main/kotlin/com/phuctran/photobooth/desktop/config/DesktopBoothConfig.kt` line 16 | Admin → *Print* toggle (AdminScreen) | Enables `SystemPrinterService` usage in printing flow. |
| `useNativeSdk` (bool) | `DesktopBoothConfig.useNativeSdk` – same config file | Admin → *Camera* toggle (SettingsTabContent) | Chooses `NativeEosCaptureService`. |
| `useHotFolder` (bool) | `DesktopBoothConfig.useHotFolder` – same config file | Admin → *Hot Folder* toggle (SettingsTabContent) | Chooses `HotFolderCaptureService`. |
| `hotFolderPath` (String) | `DesktopBoothConfig.hotFolderPath` – same config file | Admin → *Hot Folder Path* text field (SettingsTabContent) | Directory polled by `HotFolderCaptureService`. |
| `postCaptureTimeoutSeconds` | `DesktopBoothConfig.postCaptureTimeoutSeconds` – same config file | Admin → *Post‑capture timeout* (SettingsTabContent) | Controls how long the UI stays on the “Preparing” screen before moving to live view. |
| `photoSelectionTimeoutSeconds` | `DesktopBoothConfig.photoSelectionTimeoutSeconds` – same config file | Admin → *Photo selection timeout* (SettingsTabContent) | Timeout for selecting photos before auto‑proceed. |
| `frameSelectionTimeoutSeconds` | `DesktopBoothConfig.frameSelectionTimeoutSeconds` – same config file | Admin → *Frame selection timeout* (SettingsTabContent) | Timeout for selecting a frame layout. |
| `enableLocalServer` (bool) | `DesktopBoothConfig.enableLocalServer` – same config file | Admin → *Local file server* toggle (SettingsTabContent) | Starts `LocalFileServer` (non‑printing). |
| `localServerPort` (int) | `DesktopBoothConfig.localServerPort` – same config file | Admin → *Port* field (SettingsTabContent) | Port for local HTTP server. |
| `appDataDir` (path) | `DesktopAppPaths.appDataDir()` – computed from OS user directory | Internal – not exposed in UI | Base directory for all persisted data (configs, frames, LUTs, output). |

**Evidence**: All config fields are declared in `DesktopBoothConfig.kt`. Admin UI reads/writes via `controller.saveDeviceSettings(...)` (see `Main.kt` line 278). 

## 3. Feature parity matrix (V1 ➜ V2) – placeholder (to be filled by specialists)
| Feature | V1 source location | V2 target (planned) | Preservation strategy | Test status |
|---------|-------------------|---------------------|-----------------------|------------|
| Compose Desktop boot | `Main.kt::fun main` | New Tauri+React front‑end, Kotlin sidecar retains `DesktopBoothController` logic | Copy controller & services as a separate JVM module; keep same entry‑point `MainKt.main` for side‑car. | **Missing evidence** – need integration test. |
| Camera adapters | `NativeEosCaptureService`, `WebcamStillCaptureService`, `HotFolderCaptureService` | Same classes compiled into side‑car JAR | Direct copy, adjust package if needed. | **Missing** – verify native DLL loading path. |
| Printer service | `SystemPrinterService` | Same wrapper (Java AWT print) | Copy class; ensure Windows driver present on target machines. | **Missing** – need print‑job mock test. |
| Layout/Frame editor | `FrameStore`, `LayoutCalculatorTool`, UI screens | Re‑implement UI in React; keep model JSON format unchanged. | Export/import JSON; copy persistence logic. | **Missing** – need schema validation. |
| Beauty pipeline | `DesktopBeautyService`, ONNX models (`face_detection_yunet_2023mar.onnx`, `bisenet_face_parsing.onnx`) | Same service called from Kotlin side‑car; expose via IPC to React. | Copy service + model files; confirm ONNX runtime version. | **Missing** – need model‑load unit test. |
| Payment (PayOS) | `PaymentService` (source not opened) | Keep same API, expose via IPC. | Copy class; hide credentials in V2 config template. | **Missing** – need sandboxed payment flow test. |
| Cloudinary/QR album | `DesktopWebAlbumClient`, `DesktopCloudinaryClient` | Same logic, called from side‑car. | Copy classes; provide V2 config placeholders. | **Missing** – need mock HTTP test. |
| Revenue accounting | `RevenueAccountingTest.kt` (unit test) | Preserve same repository logic. | Copy `SalesRepository`, `DesktopRevenueClient`. | **Observed** – test exists, runs in JVM. |

**Note**: The matrix rows above are based on files that have been **observed**; any feature not listed (e.g., remote Firebase layout sync) is currently **Missing evidence** and must be investigated by the appropriate specialist.

---
**Files changed in this audit** (V2 only):
- `docs/01_V1_ARCHITECTURE_AUDIT.md` (created)
- `docs/02_V1_FEATURE_AND_SCREEN_INVENTORY.md` (created)

**Files inspected (V1 – read‑only)**: same list as in the previous audit plus the UI screen files (via glob). No other V1 files were opened.

---
**Open coverage gaps** (to be assigned):
- Deep dive into `CliCaptureService.kt` & `EosUtilityCaptureService.kt` (camera adapters). 
- Full read of `PaymentService.kt` and PayOS integration. 
- Review of `DesktopBeautyService.kt` and ONNX model loading. 
- Verification of remote API clients (`DesktopWebAlbumClient`, `DesktopCloudinaryClient`, `DesktopRevenueClient`). 
- Validation of configuration contracts (`DesktopBoothConfig.kt`). 
- Unit‑test coverage for each service (currently only a few tests exist).

*These gaps are explicitly marked as incomplete; no claim of completeness is made.*
