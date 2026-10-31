# UI Integration Review — V2 React/Kotlin Contract Boundaries

**Date:** 2026-10-30  
**Scope:** Frontend App/Simulator, types, current Kotlin safe commands, native bridge allowlist.  
**No mutation** of frontend/backend/shared; V1 read-only source used for factual reference only.

---

## 1. Executive Summary

The V2 React frontend (`App.tsx`, `Simulator.tsx`) is a narrow **health + simulator** demo over Tauri stdio bridge. The Kotlin backend (installed JVM launcher) exposes a **strictly allowlisted** JSON-RPC 2.0 surface for simulator flows only. Production customer/Admin/Studio paths **do not exist** in the bridge layer yet.

This review defines:
- Stable **state/action boundaries** for full premium customer + Admin/Studio + Operator views.
- **Command/allowlist extensions** needed for real backend integration without protocol churn.
- **Persistence prerequisites** for safe settings across restarts (no production gates bypass).
- **CDP harness semantics** to preserve or update.
- **Idempotency/reload/reconciliation/command latch** rules aligned with installed simulator engine behavior.

---

## 2. Current V2 Contract Snapshot (source of truth)

### 2.1 Frontend → Tauri allowlist (`src-tauri/src/main.rs:24`)

```rust
"catalog.get" | "device.getStatus" | "session.start" | "session.confirmSetup" |
"session.getState" | "session.cancel" | "session.finish" | "session.setLayout" |
"session.setQuantity" | "session.back" | "payment.mockComplete" |
"capture.startSequence" | "selection.toggle" | "selection.confirm" |
"frame.list" | "frame.select" | "frame.confirm" | "print.confirmDryRun"
```

**No other method reaches the JVM.** `health.check` is separate (always permitted).

### 2.2 Simulator session contract (`frontend/src/shared/simulator-contract.ts`)

```ts
type SessionState = 'IDLE' | 'SELECTING' | 'SELECTING_QUANTITY' | 'PAYMENT_PENDING' |
  'PREPARING' | 'LIVE_VIEW' | 'COUNTDOWN' | 'CAPTURING' | 'SELECTING_PHOTOS' |
  'EDITING' | 'PRINT_PENDING' | 'PRINTING' | 'DELIVERY' | 'RECOVERY';

type SimulatorMethod = /* 18 allowlisted methods above */;
```

### 2.3 Backend snapshot shape (`frontend/src/shared/connected-simulator.ts`)

```ts
interface Snapshot extends SessionGetStateResult {
  generationId: string;
  secondsRemaining: number;
  shots: { shotIndex: number; shotId: string; preview: string }[];
  livePreviewDataUrl: string | null;
  previewDataUrl: string | null;
  frameId: string | null;
  failure: string | null;
  userConfirmed: boolean;
  revenueRecorded: false;
  printAccepted: false;
}
```

### 2.4 Key behavioral guarantees from installed simulator (`SIMULATOR_SESSION_RESULTS.md`)

| Property | Guarantee |
|---|---|
| **Polling** | `session.getState` is the **only** state source; no unsolicited events |
| **Generation ID** | Optional but if supplied on `session.start` must be echoed on **every** later call; stale generation rejected |
| **Command ID** | UUID v4 per mutation inside params; dedup by `(sessionId, commandId)` with same serialized payload → stored response; different payload → `-32602` |
| **Idempotency window** | 2048 mutations per process; then locked; restart requires new `sessionId` |
| **State edges (source-derived only)** | `session.back`: SELECTING→IDLE, SELECTING_QUANTITY→SELECTING, PAYMENT_PENDING→SELECTING_QUANTITY, EDITING→SELECTING_PHOTOS, PRINT_PENDING→EDITING |
| **Cancel** | Only SELECTING_PHOTOS/EDITING → IDLE |
| **Finish** | Only DELIVERY → IDLE |
| **Inactivity timeout** | Configurable (default 30s); on SELECTING_PHOTOS/EDITING auto-fills remaining photos, picks first frame, renders dryrun → DELIVERY with `userConfirmed=false`, `printAccepted=false`, `revenueRecorded=false` |
| **Duplicate dryrun** | After DELIVERY, repeated `print.confirmDryRun` returns byte-identical JSON, creates no new artifacts, leaves composition/print files byte-identical |
| **Unknown methods** | `session.transition`, `capture.abort`, arbitrary reset → `-32601` |
| **No FINISHED state** | Session lifecycle ends at DELIVERY → IDLE via `session.finish` |

---

## 3. Required State/Action Boundaries for Full Product

### 3.1 Unified Session State Machine (extends V1 `SessionState` + simulator subset)

```ts
// Frontend canonical states — single source for all views
type AppSessionState =
  // Customer journey
  | 'IDLE'
  | 'SELECTING_LAYOUT'
  | 'SELECTING_QUANTITY'
  | 'PAYMENT_PENDING'       // QR/cash; PayOS polling backend-owned
  | 'PREPARING'             // Camera warmup, effect applied
  | 'LIVE_VIEW'             // Streaming preview; tap "Start capture"
  | 'COUNTDOWN'             // Per-shot countdown (configurable per layout)
  | 'CAPTURING'             // Shutter + transfer; backend-owned
  | 'SELECTING_PHOTOS'      // Choose N of M (layout.selectCount)
  | 'EDITING_FRAME'         // Pick frame; live composed preview
  | 'PRINT_PENDING'         // Final preview; Confirm dryrun
  | 'PRINTING'              // Spooler accepted; background upload/video
  | 'DELIVERY'              // QR displayed; auto-advance after timeout
  // Admin/Studio (operator-gated, separate entry)
  | 'ADMIN_DASHBOARD'
  | 'STUDIO_CONFIG'         // Layout/frame/effect/pricing management
  | 'ADMIN_REVENUE'         // Sales sync status, pending queue
  | 'ADMIN_DEVICES'         // Camera/printer health, test capture/print
  // Operator recovery
  | 'RECOVERY'              // Backend restart mid-session; reconcile or abandon
  | 'OUT_OF_SERVICE';       // Hardware error requiring operator
```

**Rule:** Customer states are a strict linear DAG with **only** the documented back edges. Admin/Studio states are **orthogonal** — entered only via operator gesture (long-press + PIN / hardware key), never from customer flow.

### 3.2 Per-View State Visibility Matrix

| View | Visible States | Allowed Actions | Data Requirements |
|---|---|---|---|
| **Customer** | All customer journey states | Layout pick, quantity, payment, capture start, photo select, frame pick, confirm print | Layout catalog, pricing, live preview frames, composed preview, QR |
| **Admin Dashboard** | `ADMIN_DASHBOARD` + read-only session snapshot | Navigate to Studio/Revenue/Devices | Aggregated sales, session counts, backend health |
| **Studio Config** | `STUDIO_CONFIG` | CRUD layouts, frames, effects, pricing; push to Firebase | Full `LayoutMode`, `FramePack`, `EffectMode`, pricing tables |
| **Admin Revenue** | `ADMIN_REVENUE` | View pending/failed sales, trigger re-sync | `SaleTransaction[]`, sync status |
| **Admin Devices** | `ADMIN_DEVICES` | Test capture (1 frame), test print (1 sheet), view device status | Camera enumeration, printer queue, hot folder watch |

---

## 4. Backend Command Allowlist Extensions (Tauri + JVM)

### 4.1 New Methods for Customer Journey (append to `main.rs` allowlist)

| Method | Params | Returns | When Permitted |
|---|---|---|---|
| `session.getCatalog` | `{}` | `{ layouts: LayoutMode[], pricing: PricingConfig }` | Any customer state |
| `device.getStatus` | `{}` | `{ camera: CameraStatus, printer: PrinterStatus, beauty: boolean, hotFolder: boolean }` | Any state |
| `session.start` | `{ layoutId, generationId? }` | `{ sessionId, generationId, state: 'SELECTING_LAYOUT' }` | IDLE |
| `session.setLayout` | `{ layoutId }` | `Snapshot` | SELECTING_LAYOUT |
| `session.confirmSetup` | `{}` | `Snapshot` (→ SELECTING_QUANTITY) | SELECTING_LAYOUT |
| `session.setQuantity` | `{ quantity: number }` | `Snapshot` (→ PAYMENT_PENDING) | SELECTING_QUANTITY |
| `payment.createLink` | `{ amount: number, orderCode: string }` | `{ qrDataUrl: string, orderCode: string }` | PAYMENT_PENDING (backend starts polling) |
| `payment.checkStatus` | `{ orderCode: string }` | `{ paid: boolean }` | PAYMENT_PENDING (frontend may poll as fallback) |
| `payment.cancel` | `{ orderCode: string }` | `{ cancelled: boolean }` | PAYMENT_PENDING (on back/cancel) |
| `capture.startSequence` | `{}` | `{ shotIndex: 1, totalShots: number, countdownSeconds: number }` | LIVE_VIEW |
| `capture.abort` | `{}` | `{ aborted: boolean, state: 'LIVE_VIEW' }` | COUNTDOWN, CAPTURING |
| `session.getState` | `{}` | `Snapshot` | Any customer state (poll 250–500ms) |
| `selection.toggle` | `{ shotIndex: number }` | `Snapshot` | SELECTING_PHOTOS |
| `selection.confirm` | `{}` | `Snapshot` (→ EDITING_FRAME) | SELECTING_PHOTOS (exact selectCount) |
| `frame.list` | `{}` | `{ frames: FrameOption[] }` | EDITING_FRAME |
| `frame.select` | `{ frameId: string }` | `Snapshot` (composed previews ready) | EDITING_FRAME |
| `frame.confirm` | `{}` | `Snapshot` (→ PRINT_PENDING) | EDITING_FRAME |
| `print.confirmDryRun` | `{}` | `Snapshot` (→ DELIVERY, `userConfirmed=true`) | PRINT_PENDING |
| `session.back` | `{}` | `Snapshot` (source edges only) | SELECTING_LAYOUT, SELECTING_QUANTITY, PAYMENT_PENDING, EDITING_FRAME, PRINT_PENDING |
| `session.cancel` | `{}` | `{ cancelled: true, state: 'IDLE' }` | SELECTING_PHOTOS, EDITING_FRAME |
| `session.finish` | `{}` | `{ state: 'IDLE' }` | DELIVERY |

### 4.2 Admin/Studio Methods (separate allowlist gate; operator auth required)

| Method | Params | Returns | Auth |
|---|---|---|---|
| `admin.getDashboard` | `{}` | `{ salesToday, sessionsToday, pendingSync, backendUptime }` | Operator PIN |
| `admin.listLayouts` | `{}` | `{ layouts: LayoutMode[] }` | Operator PIN |
| `admin.upsertLayout` | `{ layout: LayoutMode }` | `{ layoutId: string }` | Operator PIN |
| `admin.deleteLayout` | `{ layoutId: string }` | `{ deleted: boolean }` | Operator PIN |
| `admin.listFrames` | `{ layoutId? }` | `{ frames: FramePack[] }` | Operator PIN |
| `admin.upsertFrame` | `{ frame: FramePack, layoutId: string }` | `{ frameId: string }` | Operator PIN |
| `admin.deleteFrame` | `{ frameId: string }` | `{ deleted: boolean }` | Operator PIN |
| `admin.listEffects` | `{}` | `{ effects: EffectMode[] }` | Operator PIN |
| `admin.upsertEffect` | `{ effect: EffectMode }` | `{ effectId: string }` | Operator PIN |
| `admin.deleteEffect` | `{ effectId: string }` | `{ deleted: boolean }` | Operator PIN |
| `admin.getPricing` | `{}` | `{ strip: PricingConfig, print: PricingConfig }` | Operator PIN |
| `admin.setPricing` | `{ printSize: 'strip'|'print', config: PricingConfig }` | `{ updated: boolean }` | Operator PIN |
| `admin.testCapture` | `{ layoutId: string }` | `{ previewDataUrl: string }` | Operator PIN |
| `admin.testPrint` | `{ printSize: '5x15'|'10x15' }` | `{ accepted: boolean, message: string }` | Operator PIN |
| `admin.getDeviceStatus` | `{}` | `{ camera: CameraStatus, printer: PrinterStatus, hotFolder: HotFolderStatus }` | Operator PIN |
| `admin.syncSales` | `{}` | `{ synced: number, failed: number }` | Operator PIN |

### 4.3 Persistence/Config Methods (safe, no production bypass)

| Method | Params | Returns | Notes |
|---|---|---|---|
| `config.getDeviceSettings` | `{}` | `DeviceSettings` | Reads V2 `.env` (not V1) |
| `config.saveDeviceSettings` | `DeviceSettings` | `{ saved: boolean, requiresRestart: boolean }` | Writes V2 `.env`; backend reloads on next start |
| `config.getPaths` | `{}` | `{ captures, assets, logs, temp, hotFolder }` | V2-isolated paths only |

**DeviceSettings shape:**
```ts
interface DeviceSettings {
  enableSystemPrint: boolean;
  useHotFolder: boolean;
  hotFolderPath: string;
  postCaptureTimeoutSeconds: number;
  photoSelectionTimeoutSeconds: number;
  frameSelectionTimeoutSeconds: number;
  printerNameStrip: string;
  printerNameFull: string;
  boothId: string;
}
```

---

## 5. Live View Transport & Backpressure

### 5.1 Current Simulator
- `livePreviewDataUrl` in `Snapshot` (base64 JPEG, ~300 KB) polled via `session.getState` at 250–500ms.
- **Not suitable** for production 1080p@30fps.

### 5.2 Production Design (Tauri-native, no sidecar port)

| Layer | Mechanism |
|---|---|
| **Backend** | Canon SDK Live View → `BufferedImage` → JPEG encode (quality 75) → shared memory ring buffer (Windows `CreateFileMapping`) or named pipe |
| **Tauri bridge** | `liveview.start` / `liveview.stop` commands; frontend receives `ArrayBuffer` via Tauri `ipc:channel` (zero-copy) |
| **Frontend** | `ImageBitmap` decoding off-main-thread → `<canvas>` draw; target 30fps, drop frames if decode > 33ms |
| **Backpressure** | Backend publishes at camera rate; frontend signals `liveview.ack({ frameId, receivedAt })` every N frames; backend drops oldest if buffer full |
| **Unsubscribe** | `liveview.stop` on state exit (LIVE_VIEW → COUNTDOWN, or any back/cancel) |
| **Reconnect** | On backend restart, new `session.start` issues new `liveview.start`; frontend treats as new stream |

**Do not** use base64 data URLs for production live view. Simulator keeps data URL for test parity only.

---

## 6. Frontend Architecture: Latch, Reload, Reconciliation

### 6.1 Command Latch (already in `Simulator.tsx:45-62`)

```ts
const intent = useRef(false);   // prevents concurrent user gestures
const lock = useRef(false);     // serializes in-flight RPC
const epoch = useRef(0);        // invalidates stale poll callbacks
```

**Extend to all customer actions:** every mutation (layout, quantity, payment, capture, selection, frame, print) goes through a single `dispatch(command, params)` that enforces:
- `intent` guard: ignore rapid taps
- `lock` guard: await in-flight RPC before next
- `epoch` guard: discard responses from previous generation/session

### 6.2 Reload / Hot-Reload Safety

- **Session IDs** are UUID v4; survive frontend reload only if `sessionId` + `generationId` persisted in `sessionStorage` (already done in Simulator).
- On reload: frontend reads stored IDs → calls `session.getState` → reconciles UI to authoritative snapshot.
- **No optimistic UI** for state transitions; always wait for backend snapshot.

### 6.3 Reconciliation Rules

| Scenario | Frontend Action |
|---|---|
| Frontend reload mid-session | Restore `sessionId`/`generationId` from `sessionStorage`; poll `session.getState`; render snapshot |
| Backend restart (JVM crash) | `session.getState` fails → show `RECOVERY` overlay; operator must `session.cancel` or `session.finish` (if DELIVERY) |
| Stale generation (backend reset) | Backend returns `-32004` → frontend clears `sessionStorage`, returns to IDLE |
| Duplicate confirm (user double-tap) | Backend dedup by `commandId` → returns stored response; frontend idempotent |
| Network partition (Tauri bridge down) | `invoke` rejects → frontend shows offline banner; retry `health.check` every 5s; on success, `session.getState` to reconcile |

### 6.4 CDP Harness Semantics (preserve for regression)

- **Current:** `verify-webview.mjs` spawns Tauri, attaches CDP to `127.0.0.1:9223`, clicks `Check JVM bridge` button, asserts rendered health text + PID.
- **Required updates for full integration:**
  1. Add selector for **customer Start button** (data-testid="customer-start") and verify it enables after `health.check` + `catalog.get` success.
  2. Add selector for **operator PIN entry** (data-testid="operator-pin") and verify Admin Dashboard loads.
  3. Extend harness to **simulate full customer flow** (mock backend via simulator allowlist) and assert DOM state at each step.
  4. **Do not enable CDP in production** `tauri.conf.json`; keep test-only env var `V2_CDP_ENABLED=1`.
- **Port collision:** Fixed port 9223; pre/post `Get-NetTCPConnection` checks already in `webview-health-close.ps1`. Acceptable for CI.

---

## 7. Idempotency Keys & Duplicate Prevention

### 7.1 Backend-Owned Idempotency (simulator model)

- Every mutation carries `commandId` (UUID v4).
- Backend stores `(sessionId, commandId, serializedRequest, response)` for 2048 entries.
- Repeat same `commandId` + identical payload → cached response.
- Repeat same `commandId` + different payload → `-32602`.
- After DELIVERY, `print.confirmDryRun` with **new** `commandId` → `-32001` (not permitted).

### 7.2 Frontend Responsibility

- Generate `commandId = crypto.randomUUID()` per user gesture (already in `Simulator.tsx:51`).
- Store pending `commandId` in `sessionStorage` **before** RPC (already done: `v2-simulator-uncertain`).
- On response, remove pending key.
- On reload, if pending key exists → **do not replay**; poll `session.getState` to learn outcome.

### 7.3 Payment Idempotency

- `payment.createLink` uses `orderCode = Date.now()` (backend-owned).
- PayOS webhook/ polling uses same `orderCode`; backend records sale **only once** per `orderCode` (V1 `SalesRepository` logic preserved).
- Frontend never retries payment creation; only polls `payment.checkStatus`.

---

## 8. Safe Persistence Prerequisites (V2-Isolated)

| Artifact | V2 Path | Persistence | Notes |
|---|---|---|---|
| **App config (`.env`)** | `E:\HK1_2026_2027\PhotoboothDesktop_v2\.env` | File (SettingsManager) | Device settings only; no secrets |
| **Layout/Frame/Effect config** | `backend/config/` + Firebase | Firebase + local JSON fallback | Admin Studio writes both |
| **Session data (originals, compositions, prints)** | `backend/build/simulator-sessions/<sessionId>/` (sim) / `data/sessions/<sessionId>/` (prod) | Per-session directory | Cleaned on `session.cancel`; retained on `session.finish` |
| **Logs** | `logs/` (Tauri) + `backend/logs/` (JVM) | Rotating files | No PII |
| **Hot Folder** | Configurable via `config.saveDeviceSettings` | Directory watch | V2-only path; never V1 |
| **ONNX models / LUTs** | `appDataDir/data/filters/luts/` + `models/` | Bundled in installer | Read-only at runtime |
| **Sales DB (SQLite)** | `data/sales.db` | V2-isolated | `SalesRepository` writes; `DesktopRevenueClient` syncs |

**No V1 paths** (`.env`, `data/`, `photos/`, `logs/`) are ever read or written by V2.

---

## 9. Operator Separation (Customer vs Admin/Studio)

### 9.1 Entry Gates
- **Customer flow:** Default on app launch; no authentication.
- **Admin/Studio:** Long-press "LE SOUVENIR" wordmark (3s) + 4-digit PIN (stored hashed in V2 `.env` as `ADMIN_PIN_HASH`).
- **Operator hardware key:** Optional USB HID token (future); not in MVP.

### 9.2 UI Separation
- **Customer views:** Full-screen, touch-optimized, no chrome, no exit.
- **Admin views:** Windowed (non-kiosk), keyboard/mouse allowed, sidebar navigation.
- **Shared components:** Design system (Tailwind + Motion) only; zero business logic sharing.

### 9.3 Backend Enforcement
- Admin methods **rejected** (`-32003` unauthorized) unless `X-Operator-Token` header present in RPC envelope (Tauri adds after PIN verification).
- Token: short-lived JWT (5 min) signed by backend startup secret; stored in frontend `sessionStorage` only.

---

## 10. Required Frontend Extensions (Non-Breaking)

### 10.1 New React Contexts
```tsx
// AppContext — single source for session + config
interface AppContextValue {
  // Customer
  sessionState: AppSessionState;
  snapshot: Snapshot | null;
  dispatch: (command: CustomerCommand, params: object) => Promise<void>;
  // Admin (null unless operator authenticated)
  adminToken: string | null;
  adminDispatch: (command: AdminCommand, params: object) => Promise<void>;
  // Config
  deviceSettings: DeviceSettings;
  saveDeviceSettings: (s: DeviceSettings) => Promise<void>;
}
```

### 10.2 View Router (no react-router; state-driven)
```tsx
function ViewRouter() {
  const { sessionState, adminToken } = useAppContext();
  if (adminToken) return <AdminShell />;
  switch (sessionState) {
    case 'IDLE': return <StartScreen />;
    case 'SELECTING_LAYOUT': return <LayoutScreen />;
    // ... all customer states
    case 'RECOVERY': return <RecoveryScreen />;
    case 'OUT_OF_SERVICE': return <OutOfServiceScreen />;
  }
}
```

### 10.3 Live View Component (production)
```tsx
function LiveViewCanvas({ onFrame }: { onFrame: (bitmap: ImageBitmap) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const channel = await invoke<Channel>('liveview_start');
    channel.onmessage = (e) => {
      createImageBitmap(e.data).then(onFrame);
      channel.postMessage({ type: 'ack', frameId: e.data.frameId });
    };
    return () => invoke('liveview_stop');
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0" />;
}
```

---

## 11. Test Scope & Pass/Fail Criteria (No Hardware)

| Test | Method | Pass Criteria |
|---|---|---|
| **Contract conformance** | TypeScript `simulator-contract.ts` + JVM `SimulatorSessionTest` | All 18 allowlisted methods return expected shapes; unknown → -32601 |
| **State machine edges** | Simulator regression (`framed-jvm-regression.mjs`) | All source-derived back edges work; forbidden edges rejected |
| **Idempotency** | Duplicate `print.confirmDryRun` + `commandId` reuse | Byte-identical response, no new artifacts, -32602 on payload change |
| **Generation guard** | Restart JVM mid-session, reuse `sessionId` + new `generationId` | Backend rejects stale generation (-32004) |
| **Reload reconciliation** | Frontend reload at each customer state | `session.getState` restores correct UI; no duplicate commands |
| **CDP harness** | `verify-webview.mjs` extended | Clicks customer Start → Layout → Quantity → Payment mock → Capture → Select → Frame → Confirm dryrun → Delivery; asserts DOM at each step |
| **Admin gate** | UI Automation + PIN entry | Long-press wordmark → PIN dialog → Admin Dashboard renders; customer flow inaccessible |
| **Persistence** | Restart Tauri + JVM | `.env` device settings survive; session directories isolated; no V1 pollution |
| **Live view backpressure** | Mock 30fps stream for 60s | Zero frame drops > 5%; memory < 200MB; `liveview_stop` on state exit |

---

## 12. Blocker Escalation (No Unverified Promises)

| Blocker | Impact | Recommended Alternative |
|---|---|---|
| Canon SDK DLL redistribution unclear | Cannot ship packaged installer | Document exact DLLs needed; evaluate webcam/Hot Folder as fallback for V2.0 |
| DNP RX1HS driver not on test machine | `admin.testPrint` untestable | Use Microsoft Print to PDF as simulator printer; validate spooler interaction only |
| ONNX model license (YuNet/BiSeNet) | Beauty cannot ship commercially | Confirm MIT/Apache-2.0; if not, bundle as optional download with EULA |
| Tauri WebView2 accessibility flaky | UI Automation tests fail intermittently | Switch CDP harness to primary; UIA as secondary; record WebView2 version |
| JVM sidecar crash recovery unproven | `RECOVERY` state speculative | Implement `session.getState` epoch check; document as known gap for V2.1 |

---

## 13. Ownership & Next Actions

| Area | Owner | Deliverable | Target |
|---|---|---|---|
| **Frontend App/Simulator** | UI Designer + Frontend Coder | `AppContext`, `ViewRouter`, customer views, Admin shell, LiveViewCanvas | Milestone 3 |
| **Tauri Bridge Allowlist** | Architect (this review) | Updated `main.rs` + `bridge.rs` with 35 customer + 18 admin methods | Milestone 2 |
| **Kotlin Backend IPC** | Backend Engineer | `IpcMain.kt` routing + `SimulatorSessionEngine` parity + admin endpoints | Milestone 2 |
| **CDP Harness** | Tester-Reviewer | Extended `verify-webview.mjs` + `webview-health-close.ps1` full flow | Milestone 3 |
| **Persistence/Config** | Backend Engineer | `config.get/saveDeviceSettings`, V2 `.env` schema, isolated paths | Milestone 2 |
| **Operator Auth** | Frontend Coder + Backend Engineer | PIN hash in `.env`, JWT token, admin method guard | Milestone 3 |

---

## 14. Appendix: V1 Reference Mapping (No Migration)

| V1 Component | V2 Status | Notes |
|---|---|---|
| `DesktopBoothController` | **Copied → adapted** | State machine preserved; IPC layer replaces Compose state flows |
| `SessionStateMachine` | **Preserved** | Enum values match; `RECOVERY`/`OUT_OF_SERVICE` added |
| `PricingCalculator` | **Preserved** | Identical algorithm; `PricingSnapshot` reused |
| `SettingsManager` | **Preserved** | Writes V2 `.env` only |
| `NativeEosCaptureService` | **Behind IPC** | `capture.startSequence`/`abort` commands |
| `SystemPrinterService` | **Behind IPC** | `admin.testPrint` + `print.confirmDryRun` (dryrun only) |
| `DesktopBeautyService` | **Behind IPC** | Async, bounded 15s; fallback to original on timeout |
| `FirebaseManager` | **Admin-only** | Layout/frame/effect sync via `admin.upsert*` |
| `SalesRepository` + `DesktopRevenueClient` | **Backend-owned** | Revenue recorded **only** on `print.confirmDryRun` with `userConfirmed=true` |
| `LocalFileServer` | **Optional** | `config.enableLocalServer`; QR fallback if Cloudinary fails |

---

**End of UI Integration Review.**  
This document defines **actionable scope only** — no architecture redesign, no hardware claims, no production gates bypassed. All extensions are additive to the existing V2 simulator contract.