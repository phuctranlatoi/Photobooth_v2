# Hardware Integration Specification (Canon SDK & DNP RX1HS)

This document provides complete, unabridged technical documentation for hardware integrations in the legacy V1 system (`E:\HK1_2026_2027\PhotoboothDesktop`). It serves as the primary handoff reference for `camera-engineer` and `printer-engineer`.

---

## Part 1: Camera Subsystem (Canon EDSDK & Capture Sources)
**Handoff to:** `camera-engineer`

### 1.1 Source Files & Native Binaries
| Component | V1 Relative File Path | Role | Evidence Tag |
|---|---|---|---|
| Primary Camera Service | `src/main/kotlin/.../services/NativeEosCaptureService.kt` | Manages EDSDK session, EVF live view, exposure, and capture | **Observed in code** |
| Custom Safe Shutter Command | `src/main/java/edsdk/api/commands/SafeShootCommand.java` | Custom EDSDK command preventing AF crashes and array overflows | **Observed in code** |
| EDSDK4J Java Wrapper | `edsdk/api/CanonCamera.java`, `BaseCanonCamera.java` | Object-oriented Java JNA wrapper for Canon C API | **Observed in code** |
| Native EDSDK 64-bit DLL | `app-resources/windows/EDSDK_64/EDSDK.dll` | Canon Digital Camera SDK shared library (x64) | **Observed in code** |
| Native EdsImage 64-bit DLL | `app-resources/windows/EDSDK_64/EdsImage.dll` | Canon Image processing library for image extraction (x64) | **Observed in code** |
| Hot Folder Capture Service | `src/main/kotlin/.../services/HotFolderCaptureService.kt` | Fallback directory watcher for external cameras (Sony + clicker) | **Observed in code** |
| SARXOS Webcam Service | `src/main/kotlin/.../services/WebcamStillCaptureService.kt` | Fallback DirectShow USB webcam capture service | **Observed in code** |
| EOS Utility Scraper | `src/main/kotlin/.../services/EosUtilityCaptureService.kt` | Fallback window scraping from running `EOS Utility 3.exe` | **Observed in code** |
| CLI Camera Service | `src/main/kotlin/.../services/CliCaptureService.kt` | Fallback invoking `CameraControlCmd.exe` via CLI | **Observed in code** |

---

### 1.2 Canon SDK Entry Points, Lifecycle & Reconnection
- **Initialization:**
  ```kotlin
  // NativeEosCaptureService.kt:37-48
  var camera: CanonCamera = CanonCamera()
  sessionOpen = camera.openSession()
  ```
  `camera.openSession()` scans for connected Canon EOS cameras over USB, opens an EDSDK session handle (`EdsOpenSession`), and initializes property listeners.
- **Heartbeat & Auto-Reconnect Loop:**
  - Implemented in `startAutoReconnectLoop()` running on a dedicated coroutine in `Dispatchers.IO` (`NativeEosCaptureService.kt:50-82`).
  - **Connection Heartbeat:** When `sessionOpen == true`, the loop verifies liveness every 2000ms by reading a volatile camera property:
    ```kotlin
    camera.apertureValue // Heartbeat probe
    ```
    If the USB cable is unplugged or the camera sleeps, this read throws an exception. The service immediately sets `sessionOpen = false` and calls `stopLiveView()`.
  - **Reconnection Mechanism:** When `sessionOpen == false`, the loop cleans up the dead reference:
    ```kotlin
    runCatching { camera.closeSession() }
    camera = CanonCamera() // Re-instantiate to clear dead USB JNA pointer
    sessionOpen = camera.openSession()
    ```
    Once reconnected, if `currentEffectId.isNotEmpty()`, it automatically restarts live view.
- **Cleanup & Teardown:**
  - `stopLiveView()`: Invokes `camera.endLiveView()` to close EVF pipeline on camera body.
  - `close()`: Shuts down coroutines and closes the EDSDK session cleanly.

---

### 1.3 Live View (EVF) Pipeline & Face Tracking AF
- **Live View Initiation:**
  - `startLiveView(effectId: String)` (`NativeEosCaptureService.kt:114-173`).
  - Retries up to 10 times with 500ms backoff if the camera reports device busy (`EdsError.EDS_ERR_DEVICE_BUSY`).
  - Upon starting, forces Canon Face Tracking AF mode:
    ```kotlin
    // NativeEosCaptureService.kt:131
    camera.setProperty(edsdk.utils.CanonConstants.EdsPropertyID.kEdsPropID_Evf_AFMode, 2L)
    ```
    *Value 2L corresponds to Face Detection Live View AF on supported Canon EOS bodies.*
- **Frame Download Loop:**
  - Runs in a tight while loop polling `camera.downloadLiveView()` every 30ms (~30 fps).
  - Each live view frame is a JPEG image stream fetched from camera EVF buffer.
  - Passed to `imageProcessor.applyEffectForLiveView(image, effectId)`.
  - Disconnect watchdog: If `downloadLiveView()` returns null 20 consecutive times, the service flags the camera as disconnected (`sessionOpen = false`) and aborts live view.

---

### 1.4 Capture Execution & `SafeShootCommand`
Standard `edsdk4j`'s default `ShootCommand` suffers from severe bugs when handling continuous EVF and image transfers. V1 replaced it with `SafeShootCommand.java` (`src/main/java/edsdk/api/commands/SafeShootCommand.java`):

1. **Servo AF Preservation:**
   Standard `ShootCommand` forcibly closed live view before shooting (`CanonUtils.endLiveView()`). `SafeShootCommand` deliberately comments this out (lines 101–104) so that active Servo AF / Face Tracking remains latched during shutter release.
2. **Buffer Bounds Clamping:**
   Standard wrapper threw `ArrayIndexOutOfBoundsException` if Canon sent multiple directory item events. `SafeShootCommand` clamps event processing (`processedFiles < dest.length`, line 147) and ignores extraneous notifications.
3. **Mirror Lockup Support:**
   If the camera has mirror lockup enabled, `SafeShootCommand` automatically sends non-AF shutter pulses (`kEdsCameraCommand_ShutterButton_Completely_NonAF` followed by `OFF`, lines 118–121).
4. **Host-Direct JPEG Transfer:**
   Configured with `EdsSaveTo.kEdsSaveTo_Host`. The captured full-resolution JPEG is transferred directly across USB into host memory without requiring an SD card inside the camera body.

---

### 1.5 Alternative Capture Sources
- **Hot Folder (`HotFolderCaptureService.kt`):**
  - Monitors folder `config.hotFolderPath` (`E:\Photobooth\HotFolder` by default).
  - Snapshot takes existing files, then polls for up to 15 seconds (150 iterations x 100ms) for newly appeared `.jpg` file.
  - Once file size > 0, waits 500ms for OS file write completion, then processes and crops image.
  - Used in production when paired with an external Sony/Nikon camera and a wireless Bluetooth shutter clicker held by guests.
- **Webcam (`WebcamStillCaptureService.kt`):**
  - Uses `com.github.sarxos:webcam-capture:0.3.12`.
  - Auto-selects highest available resolution (or defaults to 1280x720).
  - Centers and crops the frame to 16:9 aspect ratio before applying filters.

---

## Part 2: Print Subsystem (DNP DS-RX1HS & Windows Driver)
**Handoff to:** `printer-engineer`

### 2.1 Source Files & Architecture
| Component | V1 Relative File Path | Role | Evidence Tag |
|---|---|---|---|
| System Print Service | `src/main/kotlin/.../services/DesktopIoServices.kt` | Java Print Service Windows spooler dispatcher | **Observed in code** |
| Print Compositor | `src/main/kotlin/.../imaging/DesktopCompositor.kt` | 600 DPI composition, double-strip duplication, QR placement | **Observed in code** |
| Print Controller Logic | `src/main/kotlin/.../controller/DesktopBoothController.kt` | Layout sizing check, copy count calculation, async dispatch | **Observed in code** |
| Color Profile (ICC) | `frame/RX1HS_MK.icc` | DNP DS-RX1HS Matte/Glossy color profile fixture | **Observed in code** |

---

### 2.2 Print Dimensions, Canvas Resolution & DPI
V1 implements a 2x render scale over standard 300 DPI print specifications, generating super-sharp **600 DPI** output:
- **Base Resolution Unit:** 300 DPI
- **Render Scale Multiplier:** `renderScale = 2` (Effective 600 DPI)
- **Exact Pixel Dimension Matrix:**

| Layout Format | Single Strip / Image Canvas | Full Sheet Physical Paper | Actual Canvas Resolution @ 600 DPI | DNP RX1HS Physical Media |
|---|---|---|---|---|
| **5×15 cm Strip (2×6")** | `592 × 1790` (base) | `1226 × 1829` (base) | **`2452 × 3658 px`** | 4×6" roll with 2-inch cut enabled |
| **10×15 cm Full (4×6") Portrait** | `1184 × 1790` (base) | `1226 × 1829` (base) | **`2452 × 3658 px`** | 4×6" roll standard (no cut) |
| **15×10 cm Full (6×4") Landscape**| `1790 × 1184` (base) | `1829 × 1226` (base) | **`3658 × 2452 px`** | 4×6" roll standard (no cut) |

---

### 2.3 5×15 cm Double-Strip Duplication & 2-Inch Cut
The DNP DS-RX1HS printer uses continuous 4×6 inch dye-sublimation paper rolls. To produce two 2×6 inch (5×15 cm) strips, the printer driver features an internal motorized mechanical blade (the **2-inch cut** feature).

V1 accommodates this hardware behavior in `DesktopCompositor.kt` (lines 110–138):
1. The guest designs a single 5×15 cm strip (`canvas` of size `1184 x 3580 px`).
2. The compositor creates a full 4×6 inch composite paper canvas of size `2452 x 3658 px`.
3. It paints **two identical copies** of the strip onto the paper side-by-side:
   - **Strip 1 Position:** `paddingLeft = 28 px` (`14 * 2`), `paddingTop = 54 px` (`27 * 2`).
   - **Strip 2 Position:** `paddingLeft + width + gap = 28 + 1184 + 4 = 1216 px`, `paddingTop = 54 px`.
   - **Center Slit Gap:** Exactly 4 pixels (`2 * renderScale`) between strips to account for blade kerf.
4. **Copy Count Sheet Halving:**
   Because each printed sheet yields 2 physical strips, `DesktopBoothController.kt` (line 766) divides the requested print quantity by 2:
   ```kotlin
   val actualSheets = (if (isStrip) requestedCopies / 2 else requestedCopies).coerceAtLeast(1)
   ```
   *Example: If the guest orders 2 strips, exactly 1 physical 4x6" sheet is sent to the printer. The DNP hardware cuts it into 2 strips.*

---

### 2.4 Java Print Service & Borderless Windows Spooling
- Implemented in `SystemPrinterService.printImage()` (`DesktopIoServices.kt:37-92`):
  1. Locates print service by name matching `PRINTER_NAME_STRIP` or `PRINTER_NAME_FULL` using `PrinterJob.lookupPrintServices()`.
  2. Bypasses Java's default 1-inch printable margin to achieve true borderless edge-to-edge printing:
     ```kotlin
     val pageFormat = printJob.defaultPage()
     val paper = pageFormat.paper
     paper.setImageableArea(0.0, 0.0, paper.width, paper.height) // Borderless
     pageFormat.paper = paper
     ```
  3. Detects orientation mismatches between the rendered image and paper configuration:
     ```kotlin
     if (isImageLandscape != isPaperLandscape) {
         g2d.translate(destWidth / 2.0, destHeight / 2.0)
         g2d.rotate(Math.PI / 2)
         g2d.drawImage(image, -destHeight / 2, -destWidth / 2, destHeight, destWidth, null)
     }
     ```
  4. Dispatches the print job to Windows Print Spooler asynchronously.

---

### 2.5 Hardware Status & Evidence Summary
- **Canon EDSDK USB Communication:** **Observed in code** (Fully proven via JNA and `SafeShootCommand.java`).
- **Canon Autofocus & Face Detection Setting:** **Observed in code** (`kEdsPropID_Evf_AFMode = 2L`).
- **DNP RX1HS 2-Inch Cut Mechanical Blade:** **Observed in code** (Geometry and sheet count halving verified in compositor).
- **Physical DNP Driver Cut Toggle Setting:** **Unverified hardware** (The code relies on the Windows print driver preference dialog having the 2-inch cut option pre-checked in Windows OS settings; no direct ESC/POS or proprietary DNP USB commands are issued from Java).

---

*Handoff Notice: The paths, DLLs, pixel geometries, and JNA calls detailed above represent the exact, authoritative reference for hardware porting into V2.*
