# Legacy Architecture Overview (Photobooth V1)

## 1. Application Entry Point
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/Main.kt`
- **Function:** `fun main() = application { … }` – launches the Compose Desktop UI.
- **Primary bootstrap class:** `DesktopBoothController` (instantiated in `Main.kt`).
- **Initialization flow:**
  1. `FirebaseManager.initialize()` – prepares Firebase Admin SDK (used for auth & optional backend). 
  2. Loads configuration via `DesktopConfigLoader.load(DesktopAppPaths.appDataDir())` (see `DesktopBoothConfig.kt`).
  3. Creates `SalesRepository` and `DesktopBoothController`.
  4. Registers a `DisposableEffect` to close the controller on exit.
  5. Exposes a large number of state `StateFlow`s to the UI (`AppShell` and screen composables).
  6. UI renders based on `SessionState` values emitted by the controller.

**Evidence tags:** `Observed in code`.

## 2. Canon Camera Integration
| Component | Path | Role | Key APIs | Native Dependency |
|-----------|------|------|----------|-------------------|
| `NativeEosCaptureService` | `src/main/kotlin/com/phuctran/photobooth/desktop/services/NativeEosCaptureService.kt` | Implements `StillCaptureService` using Canon EDSDK (native). | - `CanonCamera()` from `edsdk.api`\n- `camera.openSession()`\n- `camera.beginLiveView()`, `camera.downloadLiveView()`\n- `camera.execute(SafeShootCommand…)` for capture. | `EDSDK.dll` & `EdsImage.dll` (found under `EDSDK_64/` and duplicated under `app-resources/windows/EDSDK_64/`). |
| `EosUtilityCaptureService` | `src/main/kotlin/com/phuctran/photobooth/desktop/services/EosUtilityCaptureService.kt` | Fallback using EOS Utility window capture (no native SDK). | - Detects running `EOS Utility 3.exe` via `tasklist`\n- Captures window frames via `WindowCaptureHelper`\n- Triggers capture by sending Space keystroke to EOS Utility. | None (relies on external utility). |
| `CliCaptureService` (referenced in UI) | `src/main/kotlin/com/phuctran/photobooth/desktop/services/CliCaptureService.kt` (listed via grep) | Provides a command‑line based camera interface (optional). | Executes `cliCaptureCommand` from config. | None. |

**Initialization & Live View**
- `NativeEosCaptureService` constructor opens a camera session (`camera.openSession()`).
- Auto‑reconnect loop runs in a background coroutine, periodically checking `sessionOpen` and attempting reconnection.
- `startLiveView(effectId)` launches a coroutine that calls `camera.beginLiveView()` and repeatedly fetches frames (`camera.downloadLiveView()`). Frames are processed by `DesktopImageProcessor.applyEffectForLiveView` and emitted via `liveViewStream`.
- Capture via `captureJpeg` uses `camera.execute(SafeShootCommand…)` to command a JPEG capture stored on the host (`kEdsSaveTo_Host`).

**Configuration flags** (in `DesktopBoothConfig.kt`):
- `useNativeSdk: Boolean` – enables the native EDSDK path.
- `useCliCamera`, `useHotFolder` control alternative capture modes.

**Evidence tags:** `Observed in code`.

## 3. DNP Printer Integration
| Component | Path | Role | Key APIs | Printer specific handling |
|-----------|------|------|----------|---------------------------|
| `SystemPrinterService` | `src/main/kotlin/com/phuctran/photobooth/desktop/services/DesktopIoServices.kt` | Implements `PrinterService` – sends image to Windows printer queue. | - `PrinterJob.getPrinterJob()`\n- `printJob.printService` lookup by optional `printerName`\n- `printJob.setPrintable` with custom `Printable` that draws the image, handling orientation and borderless printing. | Uses standard Java Print Service; no DNP‑specific SDK. Printer name (strip vs full) is taken from config (`printerNameStrip`, `printerNameFull`). |
| `DesktopBoothController` (print workflow) | `src/main/kotlin/com/phuctran/photobooth/desktop/controller/DesktopBoothController.kt` (see lines ~758‑778) | Decides whether to send to `SystemPrinterService` based on `enableSystemPrint` flag and layout size (5×15 strip vs 10×15 full). Calculates sheet count (`actualSheets`). | Calls `printerService.printImage(printFile, actualSheets, targetPrinterName)` and records the status string. | No explicit DNP‑specific driver calls; relies on the OS‑installed DNP RX1HS printer driver.

**Print dimensions**
- Layout size labels (`layout.printSizeLabel`) are inspected for `5x15` substring to decide strip vs full.
- Actual image scaling to printable area is performed via `pageFormat.paper.setImageableArea(0,0,width,height)`, effectively borderless.

**Configuration** (`DesktopBoothConfig.kt`):
- `enableSystemPrint: Boolean`
- `printerNameStrip` & `printerNameFull` – optional overrides used when printing.

**Evidence tags:** `Observed in code`.

## 4. Configuration Files
- **`.env` (runtime, read via `DesktopConfigLoader`)** – holds secrets such as `PRINTER_NAME_STRIP`, `PRINTER_NAME_FULL`, `ENABLE_SYSTEM_PRINT`, and other environment variables.
- **`DesktopBoothConfig.kt`** – defines data class with default values and loading logic.
- **Gradle build files** – `build.gradle.kts` and `settings.gradle.kts` (not directly relevant to runtime but indicate dependencies on `androidx.compose.desktop`, `edsdk` Maven artifact, etc.).

**Evidence tags:** `Observed in code`.

---
*All references are based on direct reads of the V1 source tree; no assumptions about hardware behaviour are made beyond what the code expresses.*