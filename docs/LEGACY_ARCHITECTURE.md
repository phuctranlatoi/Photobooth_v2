# Legacy Architecture Overview (Photobooth V1)

## 1. Executive Summary & Purpose
This document provides an exhaustive, read-only architectural audit of the legacy Photobooth V1 application (`E:\HK1_2026_2027\PhotoboothDesktop`). V1 is a standalone Windows desktop kiosk application developed in Kotlin using Jetpack Compose for Desktop, Java 17, and Gradle. It integrates direct hardware control over Canon EOS DSLR cameras, SARXOS webcams, and DNP DS-RX1HS dye-sublimation photo printers, alongside AI-assisted portrait beauty filters, VietQR payment processing, local SQLite transaction logging, and cloud web album synchronization.

---

## 2. Application Boot & Runtime Lifecycle

### 2.1 Entry Point & Compose Desktop Bootstrap
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/Main.kt`
- **Symbols:** `fun main() = application { ... }`
- **Observed in code:**
  1. Bootstraps the Jetpack Compose Desktop runtime using `application { ... }`.
  2. Sets up a fullscreen, undecorated window:
     ```kotlin
     val windowState = rememberWindowState(placement = WindowPlacement.Fullscreen)
     Window(
         onCloseRequest = ::exitApplication,
         title = "Pretty Booth Desktop",
         state = windowState,
         undecorated = true
     )
     ```
  3. Prepares filesystem paths via `DesktopAppPaths.appDataDir()`.
  4. Initializes Firebase Admin SDK synchronously on the main thread via `FirebaseManager.initialize()`, loading credentials from `serviceAccountKey.json`.
  5. Reads configuration through `DesktopConfigLoader.load(DesktopAppPaths.appDataDir())`.
  6. Instantiates the central session coordinator `DesktopBoothController` and local SQLite ledger `SalesRepository`.
  7. Registers a Compose `DisposableEffect(Unit)` that ensures clean shutdown:
     ```kotlin
     DisposableEffect(Unit) {
         onDispose {
             controller.close()
         }
     }
     ```
  8. Monitors `controller.isAppReady`: while `false`, renders a splash loader `"Đang tải bố cục chụp..."`; once `true`, renders `AppShell` with reactive state flows driving the active screen according to `controller.sessionState`.

### 2.2 Coroutine & Threading Architecture
- **Observed in code:**
  - Controller scope: `private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())`.
  - Camera Live View loop: runs on `Dispatchers.IO` in a dedicated `liveViewJob`.
  - Camera Auto-reconnect loop: background coroutine checking camera alive heartbeat every 2000ms on `Dispatchers.IO`.
  - Beauty processing: executes in parallel using `beautyJobs[index] = scope.async(Dispatchers.IO) { ... }` with a 15-second timeout safeguard (`withTimeoutOrNull(15_000L)`).
  - Video frame capture: captures live view frames into JPEG every ~41ms (24 fps target) on `Dispatchers.IO`.
  - Video encoding: launches background `ProcessBuilder` invoking external `ffmpeg.exe` concurrently so camera capture is never blocked.
  - UI State dispatch: uses Kotlin `StateFlow` primitives collected in Compose via `collectAsState()`.

---

## 3. Build System, Dependencies & Native Packaging

### 3.1 Gradle Configuration
- **File:** `build.gradle.kts`
- **Gradle Plugins:**
  - `kotlin("jvm") version "1.9.24"`
  - `id("org.jetbrains.compose") version "1.6.11"`
- **JVM Toolchain:** Java 17 (`jvmToolchain(17)`).
- **Observed in code dependencies:**
  | Dependency Coordinate | Version | Role in V1 | Evidence Tag |
  |---|---|---|---|
  | `compose.desktop.currentOs` | 1.6.11 | Compose Desktop UI engine | Observed in code |
  | `org.jetbrains.kotlinx:kotlinx-coroutines-swing` | 1.8.1 | Swing Dispatcher for Compose UI | Observed in code |
  | `com.google.zxing:core` | 3.5.3 | QR Code generation for prints and screens | Observed in code |
  | `com.github.sarxos:webcam-capture` | 0.3.12 | DirectShow/USB webcam capture | Observed in code |
  | `net.java.dev.jna:jna` | 4.5.2 | Native Windows C library binding | Observed in code |
  | `net.java.dev.jna:jna-platform` | 4.5.2 | Win32 platform bindings | Observed in code |
  | `com.bitplan:edsdk4j` | 0.0.1 | Canon EDSDK Java/JNA wrapper | Observed in code |
  | `vn.payos:payos-java` | 2.0.1 | PayOS VietQR payment gateway client | Observed in code |
  | `com.google.firebase:firebase-admin` | 9.3.0 | Firestore & Firebase Storage client | Observed in code |
  | `com.google.code.gson:gson` | 2.10.1 | JSON serialization | Observed in code |
  | `org.xerial:sqlite-jdbc` | 3.45.3.0 | Local offline transaction SQLite database | Observed in code |
  | `org.postgresql:postgresql` | 42.7.2 | Neon PostgreSQL remote revenue database | Observed in code |
  | `com.microsoft.onnxruntime:onnxruntime` | 1.18.0 | Microsoft ONNX Runtime for AI Beauty | Observed in code |
  | `org.slf4j:slf4j-simple` | 2.0.12 | Logging backend | Observed in code |
  | `org.junit.jupiter:junit-jupiter` | 5.10.2 | JUnit 5 testing framework | Observed in code |

### 3.2 Native Windows Packaging & JRE Modules
- **File:** `build.gradle.kts` (lines 37–68)
- **Compose Native Distributions:**
  - Target formats: `Msi` (Windows installer), `Dmg`, `Deb`.
  - Package Name: `LeSouvenirDesktop` (Version `1.0.1`).
  - Upgrade UUID: `ce637e69-93f0-41d6-8092-8e4635c729ad`.
  - App Resources Root: `app-resources/` (bundled into distribution root).
  - Explicitly required JRE modules (fixing `jdeps` scanning omissions):
    `"java.net.http"`, `"jdk.crypto.ec"`, `"java.naming"`, `"java.sql"`, `"jdk.unsupported"`, `"java.management"`, `"jdk.httpserver"`.
  - Proguard: Disabled (`isEnabled.set(false)`).

### 3.3 Native DLL Resolution & Loading
- **Native Binaries:**
  - `EDSDK.dll` (Canon Digital Camera SDK 64-bit)
  - `EdsImage.dll` (Canon Image Processing library 64-bit)
- **Locations in Source Tree:**
  - `app-resources/windows/EDSDK_64/`
  - `app-resources/EDSDK_64/`
- **Loading Mechanism:**
  - Under `com.bitplan:edsdk4j`, JNA binds to `EDSDK.dll`.
  - In development, the working directory or `java.library.path` must point to the directory containing `EDSDK.dll` and `EdsImage.dll`.
  - In packaged production MSI, `app-resources` are bundled adjacent to the executable, and Compose Desktop sets `compose.application.resources.dir`.
- **Known Pitfall:** If `EdsImage.dll` is not colocated with `EDSDK.dll`, JNA successfully loads `EDSDK.dll` but capture commands fail with unspecified EDSDK errors when processing JPEG transfers.

---

## 4. Directory Layout & Runtime Data Architecture

```
E:\HK1_2026_2027\PhotoboothDesktop\
├── app-resources/                     # Bundled assets copied into native distribution
│   ├── EDSDK_64/                      # Canon EDSDK 64-bit DLLs
│   │   ├── EDSDK.dll
│   │   └── EdsImage.dll
│   ├── models/                        # Production ONNX Neural Network models
│   │   ├── face_detection_yunet_2023mar.onnx
│   │   ├── bisenet_face_parsing.onnx
│   │   ├── scrfd_500m.onnx            # (Unused in prod; experimental script artifact)
│   │   └── THIRD_PARTY_NOTICES.md
│   └── windows/EDSDK_64/              # Windows packaging fallback
├── bin/                               # Local command line tools
│   └── ffmpeg.exe                     # Optional bundled ffmpeg executable
├── data/                              # Local mutable runtime storage
│   ├── sales.db                       # SQLite local sales transaction ledger
│   ├── frames/                        # Saved custom frame PNG overlays
│   ├── filters/luts/                  # Saved .cube 3D LUT filter files
│   ├── output/                        # Composed print and master export images
│   └── sessions/{sessionId}/          # Ephemeral session artifacts
│       ├── originals/                 # Raw camera capture files (Photo_1.jpg, etc.)
│       ├── beauty/                    # AI beauty derivative images (Photo_1_beauty.png)
│       ├── videos/shot_{index}/       # 24fps live view captured JPEG frame buffer
│       └── exports/                   # Transcoded JPEGs ready for Cloudinary upload
├── serviceAccountKey.json             # Firebase Admin service account credentials
└── .env                               # Kiosk configuration & secrets (gitignored)
```

---

## 5. Configuration Architecture

### 5.1 Hierarchical Loading Order
- **Files:** `DesktopBoothConfig.kt`, `DesktopAppPaths.kt`
- **Loading Precedence:**
  1. `appDataDir/.env` (`C:\Users\<User>\AppData\Local\LeSouvenirDesktop\.env`)
  2. `workingDir/.env` (`E:\HK1_2026_2027\PhotoboothDesktop\.env`)
  3. `System.getenv()` (Process environment variables)
- If neither `.env` file exists, fallback defaults defined in `DesktopBoothConfig` are applied.
- Runtime settings updates (from the Admin Settings tab) are written back to `envSource` via `SettingsManager.updateSettings()`.

---

## 6. Subsystem Architectures

### 6.1 Canon Camera Subsystem
- **Class:** `NativeEosCaptureService` (`src/main/kotlin/.../services/NativeEosCaptureService.kt`)
- **Key Methods:**
  - `CanonCamera.openSession()`: Initializes USB connection with camera.
  - `startAutoReconnectLoop()`: Background coroutine periodically checking `sessionOpen`. Heartbeat verifies `camera.apertureValue`.
  - `startLiveView()`: Repeatedly invokes `camera.downloadLiveView()`, processes frame with `applyEffectForLiveView`, mirrors horizontally, and publishes to `StateFlow<ImageBitmap?>`.
  - `captureJpeg()`: Executes `SafeShootCommand(kEdsSaveTo_Host, 3)` which triggers shutter, suppresses mirror lockup issues, and downloads the raw JPEG from camera memory.
- **Fallbacks:**
  - `HotFolderCaptureService`: Watches directory for external captures (Clicker Bluetooth + Sony camera).
  - `WebcamStillCaptureService`: Uses Sarxos library to stream webcam, cropped to 16:9.
  - `EosUtilityCaptureService`: Scrapes EOS Utility window if running.

### 6.2 Print Subsystem
- **Class:** `SystemPrinterService` (`src/main/kotlin/.../services/DesktopIoServices.kt`)
- **Print Driver:** Uses standard Java Print Service (`PrinterJob`).
- **Borderless Execution:** Sets `paper.setImageableArea(0.0, 0.0, paper.width, paper.height)` to bypass default 1-inch printable margins.
- **Layout Splitting:** For 5×15 cm photo strips, the print compositor renders two identical strips side-by-side on a single 10×15 cm (4×6 inch) canvas (`1226 x 1829` base, rendered at `2452 x 3658` px @ 600 DPI). The physical DNP RX1HS driver handles the 2-inch center cut.

### 6.3 AI Beauty Subsystem
- **Class:** `DesktopBeautyService` (`src/main/kotlin/.../services/DesktopBeautyService.kt`)
- **Models:**
  - YuNet (`face_detection_yunet_2023mar.onnx`): Face detection & 5-point landmark localization.
  - BiSeNet (`bisenet_face_parsing.onnx`): 19-class semantic face parsing.
- **Pipeline:**
  1. Detect faces with YuNet.
  2. Classify foreground customers vs background bystanders using `CustomerFaceSelector`.
  3. Align and crop face to 512×512 using affine transform (`FaceAlignment`).
  4. Parse skin regions with BiSeNet.
  5. Build soft-edged skin mask with `FaceOvalMaskBuilder`.
  6. Smooth skin via `GuidedLuminanceFilter` while preserving edges, apply rosy tone and whitening.
  7. Fail-safe fallback: On any error or timeout, the pipeline silently returns the original camera capture without beauty modifications.

### 6.4 Revenue & Accounting Subsystem
- **Classes:** `SalesRepository`, `NeonDirectRevenueClient`
- **Dual-Ledger Design:**
  - **Local Ledger (`sales.db`):** Writes sale transactions immediately upon print confirmation into SQLite. Marked `sync_status = 'PENDING'`.
  - **Remote Ledger (`revenue_transactions` in Neon PostgreSQL):** Synchronized asynchronously in background.
- **Revenue Invariant:** Revenue is ONLY recorded if Confirm & Print was explicitly initiated by customer (`userConfirmed == true`), the print job succeeded (`printJob.await() == true`), and session identity remained un-reset. Auto-print on timeout sets `userConfirmed = false` and skips revenue recording.

---

## 7. Error Handling, Logging & Security Posture

### 7.1 Diagnostics & Logging
- SLF4J with `slf4j-simple` writes to stdout/stderr.
- FFmpeg process spawns a dedicated logging thread that prefixes console output with `FFMPEG LOG:`.
- Camera disconnects log detailed status and transition UI to warning state chips.

### 7.2 Security Constraints
- Secrets (PayOS API keys, Cloudinary upload secrets, Neon PostgreSQL credentials) are loaded strictly from `.env` or system environment variables.
- Direct JDBC connection to Neon uses URL encoding for password parsing and never logs credentials in exception messages.
- Customer session photos are stored in ephemeral directories (`data/sessions/{sessionId}/`) and not tracked in version control.
- Admin screen is secured behind a 5-tap gesture on the kiosk brand title.

---

*Evidence Tag: All statements in this document are **Observed in code** from direct examination of the V1 repository.*
