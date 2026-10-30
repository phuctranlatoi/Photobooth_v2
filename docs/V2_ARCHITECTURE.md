# V2 Architecture Document

## Overview

This document defines the V2 architecture for the LE SOUVENIR Photobooth application. It is derived from a forensic audit of the V1 codebase (read-only at `E:\HK1_2026_2027\PhotoboothDesktop`) and establishes the contracts, component boundaries, and feasibility requirements for the new V2 application at `E:\HK1_2026_2027\PhotoboothDesktop_v2`.

## 1. C4-Style Logical Components

### 1.1 System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LE SOUVENIR Photobooth V2                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────────────┐    │
│  │   Frontend  │  │   Tauri v2   │  │        Kotlin/JVM Sidecar       │    │
│  │  (React +   │◄─┤   Shell      │◄─┤  ┌─────────┐ ┌───────────────┐  │    │
│  │   TypeScript│  │  (Candidate) │  │  │  IPC    │ │  Business     │  │    │
│  │   + Vite    │  │              │  │  │  Bridge │ │  Logic        │  │    │
│  │   + Tailwind│  │              │  │  │         │ │  (Controller) │  │    │
│  └─────────────┘  └──────────────┘  │  └────┬────┘ └───────┬───────┘  │    │
│                                     │       │              │          │    │
│                                     │  ┌────▼────┐ ┌───────▼───────┐  │    │
│                                     │  │ Hardware│ │   Services    │  │    │
│                                     │  │ Bridge  │ │               │  │    │
│                                     │  │         │ │ • Canon SDK   │  │    │
│                                     │  │ • Camera│ │ • DNP Print   │  │    │
│                                     │  │ • Print │ │ • Beauty ONNX │  │    │
│                                     │  │         │ │ • Neon/Cloud  │  │    │
│                                     │  └─────────┘ └───────────────┘  │    │
│                                     └─────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │                    │                      │
          ▼                    ▼                      ▼
    ┌──────────┐         ┌───────────┐           ┌───────────┐
    │ Touch    │         │  Windows  │           │  Neon DB  │
    │ Display  │         │  Print    │           │  PayOS    │
    │ 16:10    │         │  Spooler  │           │  Cloudinary│
    └──────────┘         └───────────┘           └───────────┘
```

### 1.2 Component Definitions

| Component | Responsibility | Technology | Process |
|-----------|---------------|------------|---------|
| **Frontend** | Touch-first UI, Live View rendering, state visualization, animations | React 18 + TypeScript + Vite + Tailwind CSS + Motion | Renderer (Tauri webview) |
| **Tauri Shell** | Window management, native menus, sidecar lifecycle, OS integration | Tauri v2 (Rust) | Main process |
| **IPC Bridge** | Typed request/response + event streams between Frontend ↔ Backend | JSON-RPC 2.0 over stdio + named pipes (Windows) | In-process (Tauri plugin) + Sidecar |
| **Backend Controller** | Session state machine, business logic, orchestration | Kotlin/JVM 17 + Coroutines | Sidecar process |
| **Hardware Bridge** | Canon EDSDK (Live View, capture), DNP RX1HS printing, ONNX Beauty | JNA (EDSDK), Java Print Service, ONNX Runtime | In-backend threads |
| **Services** | Neon DB, PayOS, Cloudinary, Local file server, Frame storage | Kotlin + JDBC + HTTP clients | In-backend coroutines |

### 1.3 Runtime Process Tree

```
tauri.exe (Main Process)
├── WebView (Frontend Renderer) — React app
│   └── IPC Client (TypeScript)
└── Sidecar: photobooth-backend.exe (JVM)
    ├── Main Thread (Coroutines Dispatchers.Default)
    │   ├── SessionStateMachine
    │   ├── DesktopBoothController (orchestrator)
    │   ├── IPC Server (stdio + named pipe)
    │   └── LocalFileServer (HTTP on localhost:8080)
    ├── IO Thread Pool (Dispatchers.IO)
    │   ├── Canon EDSDK Dispatcher Thread (JNA → native DLL)
    │   │   └── Windows Message Pump (required by EDSDK)
    │   ├── DNP Print Jobs (javax.print → Windows Spooler)
    │   ├── ONNX Runtime Sessions (YuNet + BiSeNet)
    │   ├── Neon/Cloudinary HTTP (OkHttp/coroutines)
    │   └── ffmpeg Video Encoding (ProcessBuilder)
    └── Cleanup / Shutdown Hook
```

### 1.4 Threading Model & Lifetimes

| Thread / Pool | Purpose | Lifetime | Notes |
|--------------|---------|----------|-------|
| Tauri Main | Window, menu, sidecar spawn | App lifetime | Rust |
| WebView / React | UI rendering, user input | App lifetime | Single-threaded |
| JVM Main (Dispatchers.Default) | Controller, state machine, IPC | Sidecar lifetime | Kotlin coroutines |
| Dispatchers.IO | Blocking I/O: Canon, Print, ONNX, ffmpeg, DB | Per-operation | Bounded by `Dispatchers.IO` |
| EDSDK Dispatcher | Windows message pump for EDSDK callbacks | Sidecar lifetime | **Single dedicated thread** (JNA) |
| ONNX Inference | YuNet (detect) + BiSeNet (parse) | Per-capture | Runs on Dispatchers.IO |
| ffmpeg | Video encoding (background) | Per-shot | ProcessBuilder, 20s timeout |

---

## 2. Frontend–Backend Contract (Versioned Typed IPC)

### 2.1 Transport

- **Primary**: JSON-RPC 2.0 over stdio (Tauri sidecar)
- **Events/Streaming**: Named pipe (`\\.\pipe\photobooth_v2_events`) for high-frequency Live View frames
- **Authentication**: HMAC-SHA256 per message using shared secret generated at sidecar startup, passed via env var `PHOTOBOOTH_IPC_SECRET`
- **Versioning**: `protocolVersion: 1` in all messages; breaking changes increment major version

### 2.2 Message Envelope

```typescript
// Request (Frontend → Backend)
interface IpcRequest<TParams> {
  jsonrpc: "2.0";
  id: string;                    // UUID v4
  method: string;                // e.g., "session.startCapture"
  params: TParams;
  protocolVersion: 1;
  auth: { hmac: string; timestamp: number; nonce: string };
}

// Response (Backend → Frontend)
interface IpcResponse<TResult> {
  jsonrpc: "2.0";
  id: string;
  result?: TResult;
  error?: IpcError;
  protocolVersion: 1;
}

// Async Event (Backend → Frontend, via named pipe)
interface IpcEvent<TData> {
  jsonrpc: "2.0";
  method: string;                // e.g., "liveView.frame", "session.stateChanged"
  params: TData;
  protocolVersion: 1;
}
```

### 2.3 Error Codes (Backend-Defined)

| Code | HTTP-like | Meaning | Retryable |
|------|-----------|---------|-----------|
| -32600 | 400 | Invalid request (schema validation failed) | No |
| -32601 | 404 | Method not found | No |
| -32602 | 422 | Invalid params | No |
| -32603 | 500 | Internal error (capture, print, beauty) | Maybe |
| -32000 | 503 | Hardware unavailable (camera/printer) | Yes (backoff) |
| -32001 | 409 | State conflict (invalid transition) | No |
| -32002 | 402 | Payment required / not configured | No |
| -32003 | 408 | Timeout (capture, beauty, print queue) | Yes |
| -32004 | 423 | Locked (another session in progress) | No |
| -32005 | 401 | Auth failed (HMAC mismatch) | No |

### 2.4 Core Methods (v1)

#### Device & Session Management
```typescript
// Get current device status
method: "device.getStatus"
params: {}
result: {
  camera: { connected: boolean; name: string; liveViewActive: boolean; },
  printer: { available: boolean; nameStrip?: string; nameFull?: string; queueLength: number; },
  beauty: { modelsLoaded: boolean; yunetPath: string; bisenetPath: string; },
  ipc: { backendPid: number; uptimeMs: number; }
}

// Start a new session (idempotent by sessionId)
method: "session.start"
params: { sessionId?: string; layoutId: string; effectId: string; printCopies: number; }
result: { sessionId: string; state: SessionState; }

// Transition session state (validated by state machine)
method: "session.transition"
params: { sessionId: string; targetState: SessionState; }
result: { state: SessionState; }

// Cancel current session (from SELECTING_PHOTOS or EDITING only)
method: "session.cancel"
params: { sessionId: string; }
result: { cancelled: boolean; }

// Get current session state (polling fallback)
method: "session.getState"
params: { sessionId: string; }
result: { state: SessionState; capturedCount: number; selectedCount: number; }
```

#### Capture Flow
```typescript
// Begin capture sequence (validates payment, starts countdown)
method: "capture.startSequence"
params: { sessionId: string; }
result: { shotIndex: 1; totalShots: number; countdownSeconds: number; }

// Abort capture mid-sequence
method: "capture.abort"
params: { sessionId: string; }
result: { aborted: boolean; }
```

#### Live View (Streaming via Named Pipe Events)
```typescript
// Subscribe to live view frames
method: "liveView.subscribe"
params: { sessionId: string; targetFps: number; maxWidth: number; }
result: { subscribed: boolean; pipeName: string; }

// Unsubscribe
method: "liveView.unsubscribe"
params: { sessionId: string; }
result: { unsubscribed: boolean; }

// Event: liveView.frame (via named pipe)
// { frameId: number; timestamp: number; width: number; height: number; jpegBase64: string; }
// Event: liveView.error
// { code: string; message: string; recoverable: boolean; }
```

#### Beauty Processing
```typescript
// Trigger beauty on captured photos (async, bounded)
method: "beauty.processBatch"
params: { sessionId: string; photoIndices: number[]; preset: BeautyPreset; }
result: { jobId: string; estimatedMs: number; }

// Event: beauty.progress
// { jobId: string; completed: number; total: number; currentIndex: number; }
// Event: beauty.completed
// { jobId: string; results: { index: number; success: boolean; outputPath?: string; error?: string }[]; }
```

#### Print & Delivery
```typescript
// Confirm and print (idempotent via idempotencyKey)
method: "print.confirmAndPrint"
params: { 
  sessionId: string; 
  idempotencyKey: string;       // Client-generated UUID
  selectedPhotoIndices: number[];
  frameId: string;
  printCopies: number;
}
result: { printJobId: string; status: "queued" | "printing" | "completed" | "failed"; }

// Event: print.status
// { printJobId: string; status: "queued" | "printing" | "completed" | "failed" | "error"; 
//   message?: string; printerName?: string; }
```

#### Payment & QR
```typescript
// Create PayOS payment link
method: "payment.createLink"
params: { sessionId: string; amountVnd: number; description: string; }
result: { qrCodeData: string; orderCode: number; expiresAt: number; }

// Event: payment.status
// { orderCode: number; status: "pending" | "paid" | "failed" | "expired"; }
```

### 2.5 Session State Machine (Preserved from V1)

```typescript
enum SessionState {
  IDLE = "IDLE",
  SELECTING = "SELECTING",
  SELECTING_QUANTITY = "SELECTING_QUANTITY",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  PREPARING = "PREPARING",
  LIVE_VIEW = "LIVE_VIEW",
  COUNTDOWN = "COUNTDOWN",
  CAPTURING = "CAPTURING",
  SELECTING_PHOTOS = "SELECTING_PHOTOS",
  EDITING = "EDITING",
  PRINT_PENDING = "PRINT_PENDING",
  PRINTING = "PRINTING",
  DELIVERY = "DELIVERY",
  ADMIN = "ADMIN",
  OUT_OF_SERVICE = "OUT_OF_SERVICE",
  RECOVERY = "RECOVERY"
}
```

**Valid Transitions** (enforced by backend):
```
IDLE → SELECTING → SELECTING_QUANTITY → PAYMENT_PENDING → PREPARING → LIVE_VIEW
LIVE_VIEW ↔ COUNTDOWN → CAPTURING → (repeat per shot) → LIVE_VIEW → SELECTING_PHOTOS
SELECTING_PHOTOS → EDITING → PRINT_PENDING → PRINTING → DELIVERY → IDLE
ANY → IDLE (via cancel/reset)
ANY → ADMIN (admin access)
ANY → OUT_OF_SERVICE (hardware failure)
```

### 2.6 Layout Configuration (Configurable, Not Hardcoded)

```typescript
interface LayoutMode {
  id: string;                  // e.g., "10x15_4", "5x15_2"
  title: string;               // "4 ảnh 10x15"
  mediaLabel: string;          // "10x15 cm"
  printSizeLabel: string;      // "10x15" or "5x15"
  shotCount: number;           // Photos to capture (e.g., 4)
  selectCount: number;         // Photos customer selects (e.g., 4)
  countdownSeconds: number;    // Per-shot countdown (e.g., 3)
  priceIncluded: number;       // Base quantity included
  basePriceVnd: number;        // Base price
  extraUnitPriceVnd: number;   // Per extra copy
}
```

---

## 3. Live View Transport Specification

### 3.1 Transport Choice: Named Pipe + JPEG Frames

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Transport | Windows Named Pipe (`\\.\pipe\photobooth_v2_lv_<sessionId>`) | Low latency, no HTTP overhead, natural backpressure |
| Frame Format | JPEG (quality 75), Base64 in JSON event | Universal decode in browser/webview; ~150KB/frame at 1920x1080 |
| Target FPS | 15–20 fps (configurable, default 15) | Balances smoothness vs CPU/bandwidth |
| Max Resolution | 1280×720 (downscaled from Canon LV) | Touchscreen 16:10; avoids huge payloads |
| Flow Control | Frontend sends `liveView.ack { frameId }` | Backpressure: backend pauses if unacked > 3 |
| Reconnect | Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s) | Handles backend restart, camera reconnect |
| Unsubscribe | Frontend calls `liveView.unsubscribe` on screen exit | Clean resource release |

### 3.2 Frame Pipeline (Backend)

```
Canon EDSDK (downloadLiveView) 
  → DesktopImageProcessor.applyEffectForLiveView(effectId) 
  → Resize to 1280×720 (bilinear) 
  → JPEG encode (quality 75) 
  → Base64 encode 
  → Named pipe write (non-blocking, bounded queue of 5)
```

### 3.3 Backpressure & Flow Control

- Backend maintains a **bounded ring buffer of 5 frames** per subscriber
- If frontend doesn't ack within 200ms, backend drops oldest frame
- Frontend must ack every frame: `liveView.ack { frameId }` (fire-and-forget over stdio)
- On pipe write error (broken pipe), backend tears down subscriber automatically

---

## 4. Backend as Sole Authority

### 4.1 Responsibilities (Backend Only)

| Domain | Backend Owns | Frontend Must NOT |
|--------|--------------|-------------------|
| **Canon Capture** | `captureJpeg`, `startLiveView`, `stopLiveView`, reconnect logic | Never call Canon APIs directly |
| **Session State** | `SessionStateMachine`, transitions, timeouts | Only request transitions; never set state locally |
| **Payment Status** | PayOS polling, QR generation, `payment.status` events | Never trust local payment state |
| **Printer Jobs** | `PrinterService.printImage`, queue monitoring, error recovery | Only request print via `print.confirmAndPrint` |
| **Neon Writes** | `NeonDirectRevenueClient`, local ledger, sync | Never write to DB directly |
| **Output Files** | `compositor.renderFinal`, `videoCompositor`, session directories | Never write to `data/output`, `data/sessions` |
| **Beauty Processing** | `DesktopBeautyService`, ONNX sessions, fallback logic | Never run ONNX inference |

### 4.2 Idempotency Keys (Prevent Duplicate Confirm/Print)

- Frontend generates `idempotencyKey: UUIDv4()` per user "Confirm & Print" tap
- Backend stores `processedIdempotencyKeys` (in-memory LRU, 1000 entries, persisted to `data/ipc_idempotency.json` on shutdown)
- On `print.confirmAndPrint`:
  1. If key exists → return existing `printJobId` (no duplicate work)
  2. If new → process, store key, return new `printJobId`
- Key expires after session completes (DELIVERY state) or 24h TTL

### 4.3 State Persistence

- Session state persisted to `data/sessions/<sessionId>/state.json` on every transition
- On backend restart: scan `data/sessions/`, recover incomplete sessions to `RECOVERY` state
- Frontend queries `session.getState` on connect to sync

---

## 5. Beauty Processing: Bounded Execution & Fallback

### 5.1 Requirements (From V1 Audit)

- **Preserve**: YuNet (face detect) + BiSeNet (parsing) + BeautyProcessor algorithm
- **Preserve**: Presets (NATURAL, STUDIO, BRIGHT, STRONG), thresholds, fallback behavior
- **Models**: `face_detection_yunet_2023mar.onnx`, `bisenet_face_parsing.onnx` (and `scrfd_500m.onnx` alternative)
- **Order**: Original → LUT/effect → Beauty → Output (LUT/mirror order preserved)

### 5.2 Bounded Execution Contract

```kotlin
// Backend: DesktopBeautyService.processCapture()
suspend fun processCapture(
  source: File, 
  output: File, 
  config: BeautyConfig,
  timeoutMs: Long = 15_000,       // Hard timeout per photo
  isCancelled: () -> Boolean
): File
```

- **Per-photo timeout**: 15 seconds (configurable, default 15s)
- **Batch timeout**: 30 seconds for full session (4 photos)
- **Cancellation**: Respects `isCancelled()` from controller (session cancel/back)
- **Fallback**: On timeout, error, or cancelled → return original file **unchanged**
- **Originals preserved**: Always keep `originals/Photo_N.jpg`; beauty writes to `beauty/Photo_N_beauty.png`

### 5.3 Photo Selection Screen: No Infinite Wait

- Frontend enters `SELECTING_PHOTOS` **immediately** after capture sequence
- Beauty runs **in background** (async coroutine)
- If beauty completes before user confirms selection → swap `photoPath` to beauty version
- If user confirms **before** beauty completes → use originals; beauty continues for album/upload
- **Never block photo selection on beauty**

---

## 6. Distribution & Packaging

### 6.1 Components to Package

| Component | Source | Redistribution Status | Notes |
|-----------|--------|----------------------|-------|
| **JRE 21** | Eclipse Temurin / Microsoft Build of OpenJDK | ✅ Free commercial | Bundled via `jpackage` / Compose Desktop |
| **Canon EDSDK DLLs** | `EDSDK.dll`, `EdsImage.dll` (64-bit) | ❌ **Requires Canon license** | Must verify redistribution rights; cannot bundle without agreement |
| **ONNX Runtime** | `onnxruntime.dll` (Windows x64) | ✅ MIT | Bundled via Maven `onnxruntime:1.18.0` |
| **ONNX Models** | YuNet, BiSeNet, SCRFD `.onnx` files | ⚠️ Check licenses | YuNet: Apache 2.0; BiSeNet: verify; SCRFD: verify |
| **DNP Driver** | Windows Print Driver (user-installed) | N/A | App only uses `javax.print`; documents driver requirement |
| **ffmpeg** | `ffmpeg.exe` (static build) | ✅ GPL/LGPL (separate process) | Bundled in `bin/ffmpeg.exe`; invoke via ProcessBuilder |

### 6.2 Installer Strategy (Compose Desktop → MSIX/MSI)

- **App Identity**: `com.lesouvenir.photobooth.v2` (distinct from V1)
- **Install Location**: `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\`
- **Data Directory**: `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\data\`
  - `sessions/` — per-session captures, beauty, videos
  - `output/` — final prints, master images
  - `config/` — `filters.json`, layout configs
  - `logs/` — rotating log files
  - `HotFolder/` — **separate test folder** (not V1's)
- **Config File**: `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\.env` (never reads V1's)

### 6.3 Canon DLL Loading Strategy

```kotlin
// At sidecar startup, before any Canon call:
fun initializeCanonSdk() {
  val dllDir = when {
    // 1. Bundled with app (if licensed)
    Files.isRegularFile(appDir.resolve("EDSDK_64/EDSDK.dll")) -> appDir.resolve("EDSDK_64")
    // 2. System PATH (user installed Canon EOS Utility)
    System.getenv("PATH")?.split(";")?.firstOrNull { Files.isRegularFile(Path.of(it).resolve("EDSDK.dll")) }?.let { Path.of(it) }
    // 3. Known Canon install locations
    else -> Path.of("C:/Program Files/Canon/EDSDK/EDSDK_64").takeIf { Files.isRegularFile(it.resolve("EDSDK.dll")) }
  } ?: throw IllegalStateException("Canon EDSDK DLLs not found. Install Canon EOS Utility or contact vendor for redistribution license.")
  
  System.setProperty("jna.library.path", dllDir.toString())
  // Load via JNA
  CanonCamera.initLibrary() // static init in edsdk4j
}
```

**Blocker**: Without Canon redistribution license, V2 **cannot bundle EDSDK**. Must document this as a deployment prerequisite.

### 6.4 Update Strategy

- Tauri updater (GitHub Releases) for frontend + shell
- Sidecar version pinned in `tauri.conf.json` → `sidecar.version`
- Full reinstall required for JVM/Canon DLL changes (no hot patch)

---

## 7. Disaster Cases & Recovery

| Scenario | Detection | Recovery Action | Frontend UX |
|----------|-----------|-----------------|-------------|
| **Sidecar crash** | Tauri detects process exit; IPC pipe broken | Restart sidecar (max 3 retries, 5s delay); recover sessions from `data/sessions/` | Show "Reconnecting..." overlay; auto-recover to last state |
| **Canon camera unplugged** | EDSDK returns `EDS_ERR_DEVICE_NOT_FOUND`; reconnect loop detects | Auto-reconnect loop (every 2s); `device.status` event → `camera.connected=false` | Live View shows "Camera disconnected" overlay; auto-resume on reconnect |
| **Camera unavailable at start** | `openSession()` fails | Start in `OUT_OF_SERVICE`; admin can retry via `device.retryConnect` | Start screen shows "Camera not found — check connection" |
| **Printer unplugged / error** | `PrinterJob.print()` throws; spooler returns error | `print.status` event → `error`; retry 3x with 5s delay; fallback to "save print file only" | Printing screen shows "Printer error — retrying..."; manual retry button |
| **Hot Folder stall** | `captureJpeg` timeout (15s default) | Return error; frontend shows "No photo detected — use Bluetooth clicker" | Countdown continues; manual "Skip" button |
| **Power loss mid-session** | N/A (unclean shutdown) | On restart: scan `data/sessions/` for incomplete → `RECOVERY` state; resume or allow cancel | "Previous session interrupted — Resume / Discard" |
| **Network / payment failure** | PayOS HTTP timeout / error | Local `paymentMethod = "Tiền mặt"`; queue transaction for sync | Show "Payment offline — cash accepted"; QR hidden |
| **Repeated tap (double Confirm)** | Idempotency key check | Backend detects duplicate key → returns existing `printJobId` | No double print; frontend disables button after first tap |
| **V1 + V2 running concurrently** | Lock file `%TEMP%\photobooth_v2.lock` | V2 refuses start if lock held; V1 unaffected (different paths) | "Another instance running" error |

---

## 8. File Ownership Matrix (V2 Implementation)

| Area | Owner Agent | Files (V2) |
|------|-------------|------------|
| **Architecture & Contracts** | Architect | `docs/V2_ARCHITECTURE.md`, `docs/IPC_CONTRACTS.md`, `docs/DECISIONS.md`, `docs/BLOCKERS.md` |
| **Hardware POC** | Camera/Printer Specialists | `poc/camera/`, `poc/printer/`, `docs/HARDWARE_POC_PLAN.md` |
| **Tauri Shell** | Frontend Lead | `tauri/`, `src-tauri/` |
| **Frontend (React)** | Frontend Lead | `src/`, `package.json`, `vite.config.ts` |
| **Backend (Kotlin/JVM)** | Backend Lead | `backend/` (copied from V1 + IPC server) |
| **IPC Bridge** | Backend + Frontend | `backend/src/main/kotlin/.../ipc/`, `src/ipc/` |
| **Design System** | UI Designer | `src/design-system/`, `tailwind.config.js` |
| **Testing** | Tester-Reviewer | `tests/`, `playwright.config.ts` |
| **Release/Installer** | Release Engineer | `release/`, `.github/workflows/` |

---

## 9. Milestone Gates (From AGENTS.md)

| Gate | Criteria | Evidence Required |
|------|----------|-------------------|
| **1. Legacy Audit** | All V1 features inventoried; docs written to V2 | `docs/V2_ARCHITECTURE.md`, `docs/IPC_CONTRACTS.md`, `docs/DEPENDENCY_AND_LICENSE_AUDIT.md` |
| **2. Hardware Bridge Proof** | React↔Kotlin IPC works; Canon SDK loads; DNP enumerated; sidecar packages | `poc/camera/Main.kt` runs; `poc/printer/PrintTest.kt` enumerates; `tauri sidecar` starts/stops cleanly |
| **3. Design System** | Touch-first components; mock-state UI complete | Storybook / component library; all screens implemented with mock data |
| **4. Feature Integration** | Real backend connected; all flows work end-to-end | E2E tests passing; no V1 code paths remain |
| **5. Release Readiness** | Installer builds; kiosk verified; rollback tested | Signed MSIX/MSI; smoke test checklist passed |

---

## 10. Open Blockers (Require Escalation)

| Blocker | Impact | Recommended Action |
|---------|--------|-------------------|
| **Canon EDSDK Redistribution License** | Cannot bundle DLLs; users must install Canon EOS Utility | Contact Canon Vietnam for ISV redistribution agreement; document as prerequisite |
| **Tauri v2 Sidecar + JNA + Windows Message Pump** | Unverified: JVM sidecar with dedicated EDSDK dispatcher thread | Build POC immediately (Milestone 2); fallback to Electron if fails |
| **ONNX Model Licenses** | BiSeNet / SCRFD commercial use unclear | Legal review; prepare fallback to YuNet-only (detection only, no parsing) |
| **DNP RX1HS Driver Dependency** | App assumes driver installed; no bundling | Document minimum driver version; test with DNP SDK if available |
| **Windows Named Pipe + Tauri Sidecar** | Unverified IPC pattern at scale | POC with 15fps JPEG stream; measure latency & CPU |

---

## 11. Source References (V1 Audit Trail)

All architectural decisions trace to V1 source files (read-only):

| V1 File | V2 Decision |
|---------|-------------|
| `src/main/kotlin/.../controller/DesktopBoothController.kt` | Session state machine, capture flow, print orchestration |
| `src/main/kotlin/.../services/NativeEosCaptureService.kt` | Canon EDSDK integration, Live View, reconnect logic |
| `src/main/kotlin/.../services/SystemPrinterService.kt` (in DesktopIoServices.kt) | DNP printing via `javax.print` |
| `src/main/kotlin/.../beauty/BeautyProcessor.kt` | Beauty algorithm, presets, fallback |
| `src/main/kotlin/.../facemask/YuNetFaceDetector.kt` | ONNX face detection |
| `src/main/kotlin/.../facemask/OnnxFaceParsingService.kt` | ONNX face parsing (BiSeNet) |
| `src/main/kotlin/.../config/DesktopBoothConfig.kt` | Configuration schema, env loading |
| `src/main/kotlin/.../domain/SessionStateMachine.kt` | State enum & transitions |
| `edsdk/api/CanonCamera.java` | JNA binding, Windows message pump requirement |
| `build.gradle.kts` | Dependencies: Compose Desktop, ONNX Runtime, EDSDK4J, PayOS, Firebase |

---

*Document Version: 1.0*  
*Author: V2 Solutions Architect*  
*Date: 2026-10-30*  
*Status: **PROPOSAL** — Awaiting Hardware POC validation (Milestone 2)*