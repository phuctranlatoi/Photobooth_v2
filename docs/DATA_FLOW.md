# Data Flow — V2 Architecture

## Overview

This document traces data flow through the V2 system for the **shell bridge proof** (simulator mode) and documents the **intended production flows** for reference. Production flows are **not implemented** until Hardware POC passes.

---

## 1. Shell Bridge Proof Data Flow (Simulator Only)

```
┌─────────────┐     stdio JSON-RPC      ┌──────────────────┐
│   Tauri     │ ◄─────────────────────► │  Kotlin Sidecar  │
│  (Shell)    │   Length-prefixed       │  (Simulator)     │
└──────┬──────┘         │                └────────┬─────────┘
       │                │                         │
       │  health.check  │                         │
       │───────────────►│                         │
       │                │  {simulator: true}      │
       │◄───────────────│                         │
       │                │                         │
       │ session.create │                         │
       │───────────────►│  Generate UUID          │
       │                │  Init in-memory state   │
       │◄───────────────│  {sessionId, state}     │
       │                │                         │
       │ session.transition                    │
       │───────────────►│  Validate transition  │
       │                │  Update state         │
       │◄───────────────│  {newState}           │
       │                │                         │
       │ capture.simulateSequence              │
       │───────────────►│  Spawn coroutine      │
       │                │  Emit events (async)  │
       │◄───────────────│  {started: true}      │
       │                │                         │
       │  Event: capture.countdown             │
       │◄───────────────│  {shotIndex, seconds} │
       │                │                         │
       │  Event: capture.captured              │
       │◄───────────────│  {mockPhotoPath}      │
       │                │                         │
       │  Event: capture.completed             │
       │◄───────────────│  {capturedCount,      │
       │                │   newState}           │
       │                │                         │
```

### 1.1 Session State (In-Memory)

```kotlin
// Simulator session state (no persistence)
data class SimSession(
    val sessionId: String,
    var state: SessionState = SessionState.SELECTING_QUANTITY,
    val layout: LayoutSnapshot,
    val effect: EffectSnapshot,
    val printCopies: Int,
    val createdAt: Long = System.currentTimeMillis(),
    var capturedCount: Int = 0,
    var selectedIndices: MutableList<Int> = mutableListOf(),
    var beautyResults: Map<Int, String> = emptyMap(),
    var printJobId: String? = null,
    var idempotencyKeys: MutableSet<String> = mutableSetOf()
)
```

### 1.2 Event Emission (Async, No Auth)

Events are written to **stdout** as JSON-RPC notifications (no `id`, no `auth`):

```kotlin
fun emitEvent(method: String, params: JSONObject) {
    val event = JSONObject().apply {
        put("jsonrpc", "2.0")
        put("method", method)
        put("params", params)
        put("protocolVersion", 1)
    }
    println(event.toString()) // Stdout = event stream
}
```

---

## 2. Intended Production Data Flows (Reference Only)

### 2.1 Live View Flow (Production)

```
Canon EDSDK (native)
      │
      ▼
JNA → CanonCamera.downloadLiveView() → BufferedImage
      │
      ▼
DesktopImageProcessor.applyEffectForLiveView(effectId)
      │
      ▼
Resize 1280×720 → JPEG (q=75) → Base64
      │
      ▼
Named Pipe Write (\\.\pipe\photobooth_v2_lv_<sessionId>)
      │
      ▼
Frontend (WebView) → <img src="data:image/jpeg;base64,...">
      │
      ▼
Frontend ACK → Named Pipe Read (backpressure)
```

**Backpressure**: Ring buffer (5 frames); drop oldest if unacked > 200ms

### 2.2 Capture Flow (Production)

```
Frontend: capture.startSequence
      │
      ▼
Backend: DesktopBoothController.startCaptureFlow()
      │
      ├──► For each shot (1..layout.shotCount):
      │      │
      │      ├──► transitionTo(COUNTDOWN)
      │      │      └──► Emit countdown events (1s intervals)
      │      │
      │      ├──► transitionTo(CAPTURING)
      │      │      └──► cameraService.captureJpeg() → Path
      │      │             ├──► NativeEosCaptureService: EDSDK shoot
      │      │             ├──► HotFolderCaptureService: poll folder
      │      │             └──► WebcamStillCaptureService: webcam.getImage()
      │      │
      │      ├──► ImageProcessor.saveBoothCapture() → originals/Photo_N.jpg
      │      │      └──► Apply effect, LUT, aspect ratio crop
      │      │
      │      ├──► Async: video frame recording (24fps → ffmpeg)
      │      │
      │      └──► Async: Beauty processing (if enabled)
      │             ├──► DesktopBeautyService.processCapture()
      │             │      ├──► YuNetFaceDetector.detectAll()
      │             │      ├──► OnnxFaceParsingService.parse()
      │             │      ├──► FaceOvalMaskBuilder.build()
      │             │      └──► BeautyProcessor.process()
      │             │
      │             └──► Fallback: return original on timeout/error
      │
      └──► transitionTo(SELECTING_PHOTOS)
             └──► Emit capture.completed event
```

### 2.3 Print & Delivery Flow (Production)

```
Frontend: print.confirmAndPrint { idempotencyKey, ... }
      │
      ▼
Backend: DesktopBoothController.startPrinting()
      │
      ├──► Check idempotency key (in-memory + persisted)
      │
      ├──► Compositor.renderFinal() → master.png, print.png
      │      ├──► LayoutCalculator: arrange photos in frame
      │      ├──► FrameEngine: apply frame overlay
      │      └──► QR code: album URL or local server URL
      │
      ├──► PrinterService.printImage(print.png, copies, printerName)
      │      └──► javax.print → Windows Spooler → DNP RX1HS
      │
      ├──► Async: Album upload (Neon + Cloudinary)
      │      ├──► DesktopAlbumUploader.uploadSessionPhotos()
      │      └──► DesktopWebAlbumClient → Cloudinary REST
      │
      ├──► Async: Video composition (ffmpeg)
      │      └──► DesktopVideoCompositor.createCompositeVideo()
      │
      └──► transitionTo(DELIVERY)
             ├──► Record sale (local SQLite + Neon sync)
             └──► Emit DELIVERY screen data (QR, summary)
```

### 2.4 Payment Flow (Production)

```
Frontend: payment.createLink { amount }
      │
      ▼
Backend: PaymentService.createPaymentLink()
      │
      ├──► PayOS API: POST /v2/payment-requests
      │
      └──► Return { qrCodeData, orderCode, expiresAt }
             │
             ▼
Frontend: Display QR (Polling or WebSocket)
      │
      ▼
Backend: Payment polling (3s interval)
      │
      ├──► PayOS API: GET /v2/payment-requests/{orderCode}
      │
      └──► On paid: session.transition(PREPARING) → emit payment.status
```

### 2.5 Configuration Flow

```
V1: .env (working dir) + .env (appDataDir) + System env
      │
      ▼
DesktopConfigLoader.load() → DesktopBoothConfig (data class)
      │
      ▼
Controller: activeConfig (MutableStateFlow)
      │
      ├──► Admin UI: saveDeviceSettings() → SettingsManager.updateSettings(.env)
      │
      └──► IPC: config.get / config.update (planned)
```

---

## 3. Data Stores (V2 Isolated)

| Store | Path | Contents | Access |
|-------|------|----------|--------|
| **Sessions** | `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\data\sessions\<sessionId>\` | originals/, beauty/, videos/, state.json | Backend only |
| **Output** | `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\data\output\` | master prints, print files, QR codes | Backend write, LocalFileServer read |
| **Config** | `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\data\config\` | filters.json, layout configs | Backend read/write |
| **LUTs** | `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\data\filters\luts\` | .cube files | Backend read/write |
| **Logs** | `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\logs\` | rotating .log files | Backend write |
| **HotFolder** | `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\HotFolder\` | incoming JPEGs (Sony) | HotFolderCaptureService read |
| **Models** | Bundled in sidecar (`compose.application.resources.dir/models/`) | YuNet, BiSeNet, SCRFD .onnx | Backend read-only |
| **Canon DLLs** | Bundled or system PATH | EDSDK.dll, EdsImage.dll | JNA load at startup |

---

## 4. Idempotency & Deduplication

### 4.1 Print Idempotency

```
Frontend generates: idempotencyKey = UUIDv4()
      │
      ▼
Backend: print.confirmAndPrint(key, ...)
      │
      ├──► Check memory LRU (1000 entries)
      │
      ├──► Check persisted: data/ipc_idempotency.json
      │
      ├──► If EXISTS: return existing printJobId, duplicate=true
      │
      └──► If NEW: process print, store key, return new printJobId
```

### 4.2 Payment Idempotency

- PayOS `orderCode` = timestamp (unique per request)
- Backend tracks `pendingPaymentOrders` map
- Duplicate `payment.createLink` for same session returns existing QR

---

## 5. Failure & Recovery Flows

### 5.1 Sidecar Crash

```
Tauri detects sidecar exit
      │
      ├──► Read persisted sessions from data/sessions/
      │
      ├──► Restart sidecar (max 3 retries, 5s backoff)
      │
      └──► Frontend: session.getState → resume from RECOVERY
```

### 5.2 Camera Disconnect

```
NativeEosCaptureService: auto-reconnect loop (2s)
      │
      ├──► Detect: camera.apertureValue throws
      │
      ├──► sessionOpen = false
      │
      ├──► stopLiveView()
      │
      ├──► Emit device.status { camera: { connected: false } }
      │
      ├──► Reconnect: new CanonCamera(), openSession()
      │
      └──► On success: restart Live View if was active
```

### 5.3 Print Failure

```
PrinterService.printImage() → error
      │
      ├──► Retry 3x (5s delay)
      │
      ├──► If all fail: print.status { status: "failed", message }
      │
      └──► Frontend: show "Printer error — Retry / Save file only"
```

---

## 6. Security Boundaries

| Boundary | Protection |
|----------|------------|
| Frontend ↔ Backend | HMAC-SHA256 per message (shared secret) |
| Backend ↔ Canon DLL | JNA (in-process, no network) |
| Backend ↔ Printer | Local Windows print spooler |
| Backend ↔ Neon/Cloudinary | HTTPS + API keys (env vars, not logged) |
| Backend ↔ PayOS | HTTPS + checksum validation |
| Config (.env) | File permissions (user-only); never committed |
| IPC Secret | Generated at install; stored in env var only |

---

## 7. Simulator vs Production Data Flow Mapping

| Simulator Method | Production Equivalent | Status |
|------------------|----------------------|--------|
| `health.check` | `health.check` | ✅ Same |
| `session.create` | `session.start` | 🔲 Deferred |
| `session.snapshot` | `session.getState` | 🔲 Deferred |
| `session.transition` | `session.transition` | 🔲 Deferred |
| `capture.simulateSequence` | `capture.startSequence` + events | 🔲 Deferred |
| `beauty.simulateProcess` | `beauty.processBatch` + events | 🔲 Deferred |
| `print.simulateConfirm` | `print.confirmAndPrint` | 🔲 Deferred |

---

## 8. Validation Checkpoints

| Checkpoint | Simulator | Production |
|------------|-----------|------------|
| Session state consistency | In-memory map | Persisted JSON + IPC events |
| Event ordering | Sequential (coroutine) | Guaranteed by StateFlow |
| Idempotency | In-memory Set | Persisted JSON + memory |
| Cleanup on cancel | Delete session dir | Delete session dir + cancel jobs |
| Timeout handling | Fixed delays | Configurable timeouts |

---

*Document Version: 1.0*  
*Status: **REFERENCE** — Production flows documented for architecture alignment; only simulator flows implemented in Milestone 2*