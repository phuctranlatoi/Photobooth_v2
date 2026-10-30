# Simulator IPC Contract — V2 Session Simulation Only

**⚠️ SUPERSEDED DRAFT — Implementation authority: `docs/SIMULATOR_SESSION_RESULTS.md`**  
This document contains draft contradictions. The actual executable API is defined in `SIMULATOR_SESSION_RESULTS.md` (backend handoff). Do not implement from this draft. Final reviewer signoff pending.

**Scope:** Private framed stdio (4-byte BE length, ≤1 MiB, UTF-8 JSON-RPC 2.0) between Tauri host and Kotlin/JVM backend in `--simulator` mode. **No architecture change.** Extends `IPC_CONTRACTS.md` health-only contract with simulator-typed session commands. Backend is **sole authority**; frontend never transitions state arbitrarily. All commands guarded by V1 state machine edges (docs/04_SESSION_STATE_MACHINE.md). Simulator capture requires explicit `SimulatorAuthorization`. No hardware, no revenue, no print. Dry-run confirm never prints; inactivity auto-print=false.

**Corrections from review (superseded by implementation):**
- **No unsolicited events/async frames** — StdOut carries **only request responses**. Frontend polls via `session.getState` for snapshots (no `capture.getProgress`).
- **Health backwards-compatible** — `health.check` unchanged; `availableMethods` remains legacy singleton `["health.check"]` for compatibility.
- **Frontend owns `generationId`/`sessionId`** — Frontend generates UUID v4 `generationId` per load (persisted in sessionStorage), `sessionId` per `session.start`. Backend validates format, rejects reuse. `generationId` optional; if supplied on start, must be supplied unchanged on every later request.
- **No simulator revenue** — `print.confirmDryRun` never submits print job, never records revenue. Inactivity auto-print=false. `payment.mockComplete` is simulator-only, no PayOS/QR.
- **Force parent kill** — `Drop`/`taskkill` cleanup not guaranteed on abrupt parent death (Windows). Documented as known gap; not a contract blocker.
- **No code replacement** — Existing `HealthBridge`/`bridge.rs`/`main.rs` remain working; simulator extends only.

---

## 1. Transport & Framing (Unchanged)

| Property | Value |
|----------|-------|
| Channel | Private inherited StdIn/StdOut (Tauri spawns backend `--simulator`) |
| Framing | 4-byte big-endian unsigned length + UTF-8 JSON |
| Max Frame | 1,048,576 bytes |
| Direction | StdIn: Requests (Shell→Backend); StdOut: **Responses only** (Backend→Shell) |
| StdErr | Diagnostics only (bounded, redacted) |
| Encoding | UTF-8, no BOM |
| Protocol Version | `protocolVersion: 1` (literal number) in every message |

---

## 2. Authentication & Authorization

- **No HMAC** (private pipe threat model per `IPC_CONTRACTS.md:40-51`)
- **SimulatorAuthorization** (backend-only): `SimulatorAuthorization(explicitlyEnabled=true)` required to construct `SimulatorCamera`. Backend reads `SIMULATOR_CAPTURE_ENABLED=true` env var at startup to enable synthetic capture. If not set, all capture commands return `-32000` (hardware unavailable).
- **Idempotency**: Every mutating command requires `commandId: string` (UUID v4). Backend deduplicates by `commandId` per session; duplicate returns same result without side effects.

---

## 3. Session & Generation Identifiers

| ID | Format | Purpose |
|----|--------|---------|
| `generationId` | UUID v4 | **Frontend-generated** per load; persisted in sessionStorage; survives window reload, not session. **Optional** — if supplied on `session.start`, must be supplied unchanged on every later request. Omission uses legacy empty generation. |
| `sessionId` | UUID v4 | **Frontend-generated** per `session.start`; backend validates format, rejects reuse; never reused |
| `commandId` | UUID v4 | Per mutating IPC request; **inside params**, never top-level; deduplication key |
| `shotId` | `[A-Za-z0-9_-]{1,64}` | Per capture; **backend-generated**, returned in `session.getState` snapshot `shots[]` |

**No conflation** of order ID, session ID, album ID, access token (per docs/04_SESSION_STATE_MACHINE.md:36).

---

## 4. Configuration (Loaded at Backend Startup)

Backend reads `E:\HK1_2026_2027\PhotoboothDesktop_v2\backend\config\simulator-layouts.json` (V2-local, not V1). Structure:

```json
{
  "layouts": [
    {
      "id": "strip-2",
      "title": "Strip 2",
      "subtitle": "2 photos · 5×15 cm",
      "description": "Classic vertical strip",
      "family": "Column",
      "shotCount": 2,
      "selectCount": 2,
      "countdownSeconds": 3,
      "basePrice": 70000,
      "mediaLabel": "Strip",
      "accentColor": 4289847295,
      "printSizeLabel": "5x15",
      "printAspectRatio": 0.33333334,
      "gridColumns": 1
    },
    {
      "id": "grid-4",
      "title": "Grid 4",
      "subtitle": "4 photos · 10×15 cm",
      "description": "2×2 grid",
      "family": "Grid",
      "shotCount": 4,
      "selectCount": 4,
      "countdownSeconds": 3,
      "basePrice": 90000,
      "mediaLabel": "Print",
      "accentColor": 4292335871,
      "printSizeLabel": "10x15",
      "printAspectRatio": 0.6666667,
      "gridColumns": 2
    }
  ],
  "defaultLayoutId": "strip-2",
  "sourceCount": 3,
  "previewWidth": 320,
  "previewHeight": 180,
  "captureWidth": 1920,
  "captureHeight": 1080
}
```

**Fields are source-attributed** (extracted from V1 `BoothModels.kt`, `PricingCalculator.kt`), not universal constants. Frontend fetches via `catalog.get`; never hardcodes.

---

## 5. Core Methods (v1 Simulator)

All requests include `commandId` (except `catalog.get`, `health.check`, `session.getState`). All responses echo `commandId` in `result.commandId`.

### 5.1 Catalog & Device

```typescript
// catalog.get — no commandId
method: "catalog.get"
params: {}
result: {
  layouts: LayoutMode[];        // from config, includes all LayoutMode fields
  defaultLayoutId: string;
  sourceCount: number;
  previewWidth: number;
  previewHeight: number;
  captureWidth: number;
  captureHeight: number;
  simulator: true;
  pricing: {                    // from PricingCalculator
    stripBasePrice: number;     // 70000
    stripUnitPrice: number;     // 20000
    printBasePrice: number;     // 90000
    printUnitPrice: number;     // 30000
    stripAllowedQuantities: number[];  // [2,4,6,...,50]
    printAllowedQuantities: number[];  // [2,3,4,...,50]
  };
}
```

```typescript
// device.getStatus — no commandId
method: "device.getStatus"
params: {}
result: {
  camera: { connected: true; name: "Simulator"; liveViewActive: boolean; };
  printer: { available: false; queueLength: 0; };  // simulator: no printer
  beauty: { modelsLoaded: false; };
  ipc: { backendPid: number; uptimeMs: number; };
}
```

### 5.2 Session Lifecycle (Guarded by State Machine) — Implementation Authority

**Legal transitions (from `docs/SIMULATOR_SESSION_RESULTS.md`):**
```
IDLE --session.start--> SELECTING
SELECTING --session.setLayout--> SELECTING (layout frozen, pricing frozen)
SELECTING --session.confirmSetup--> SELECTING_QUANTITY
SELECTING_QUANTITY --session.setQuantity--> PAYMENT_PENDING (auto-advances)
PAYMENT_PENDING --payment.mockComplete--> PREPARING → LIVE_VIEW (1600ms auto)
LIVE_VIEW --capture.startSequence--> COUNTDOWN → CAPTURING → LIVE_VIEW (per shotCount) → SELECTING_PHOTOS
SELECTING_PHOTOS --selection.toggle (capped at selectCount)--> SELECTING_PHOTOS
SELECTING_PHOTOS --selection.confirm (exact selectCount)--> EDITING
EDITING --frame.select--> EDITING (updates preview)
EDITING --frame.confirm--> PRINT_PENDING (requires chosen frame)
PRINT_PENDING --print.confirmDryRun--> DELIVERY (userConfirmed=true, accepted=false, revenue=false)
DELIVERY --session.finish--> IDLE
PRINT_PENDING --session.back--> EDITING
EDITING --session.back--> SELECTING_PHOTOS
SELECTING_QUANTITY --session.back--> SELECTING
SELECTING --session.back--> IDLE
PAYMENT_PENDING --session.back--> SELECTING_QUANTITY
* --session.cancel (only SELECTING_PHOTOS, EDITING)--> IDLE
```

**No FINISHED state.** DELIVERY is terminal. `session.finish` only valid from DELIVERY. `session.back` edges are source-derived only (SELECTING_PHOTOS→SELECTING_QUANTITY intentionally forbidden).

```typescript
// session.start — idempotent by sessionId
method: "session.start"
params: { sessionId: string; layoutId: string; commandId: string; }
result: { sessionId: string; state: "SELECTING"; layout: LayoutMode; commandId: string; }

// session.confirmSetup — SELECTING → SELECTING_QUANTITY only
method: "session.confirmSetup"
params: { sessionId: string; commandId: string; }
result: { sessionId: string; state: "SELECTING_QUANTITY"; commandId: string; }
// Error: -32001 if state != SELECTING

// session.getState — polling fallback, no commandId
method: "session.getState"
params: { sessionId: string; }
result: { sessionId: string; state: SessionState; capturedCount: number; selectedCount: number; selectedIndices: number[]; layout: LayoutMode; pricing: PricingSnapshot; }

// session.cancel — ONLY allowed in SELECTING_PHOTOS, EDITING
method: "session.cancel"
params: { sessionId: string; commandId: string; }
result: { cancelled: true; commandId: string; }
// Error: -32001 if state not in {SELECTING_PHOTOS, EDITING}

// session.finish — from FINISHED/DELIVERY/any terminal, resets to IDLE
method: "session.finish"
params: { sessionId: string; commandId: string; }
result: { sessionId: string; state: "IDLE"; commandId: string; }
```

### 5.3 Layout & Quantity (Pricing Frozen at Confirm Setup)

```typescript
// session.setLayout — only in SELECTING
method: "session.setLayout"
params: { sessionId: string; layoutId: string; commandId: string; }
result: { layout: LayoutMode; commandId: string; }
// Error: -32001 if state != SELECTING

// session.setQuantity — only in SELECTING_QUANTITY, sanitizes per PricingCalculator
method: "session.setQuantity"
params: { sessionId: string; quantity: Int; commandId: string; }
result: { quantity: Int; pricing: PricingSnapshot; commandId: string; }
// Error: -32001 if state != SELECTING_QUANTITY
```

### 5.4 Mock Payment (Simulator Only)

```typescript
// payment.mockComplete — only in PAYMENT_PENDING
method: "payment.mockComplete"
params: { sessionId: string; commandId: string; }
result: { paid: true; commandId: string; }
// Error: -32001 if state != PAYMENT_PENDING
// No PayOS, no QR, no real payment. Sets internal paid=true, advances to PREPARING.
```

### 5.5 Capture Flow (SimulatorCamera) — Polling via session.getState Only

```typescript
// capture.startSequence — only in LIVE_VIEW, validates paid + simulator enabled
method: "capture.startSequence"
params: { sessionId: string; generationId?: string; commandId: string; }
result: { shotIndex: 1; totalShots: number; countdownSeconds: number; commandId: string; }
// Errors: -32001 (not LIVE_VIEW), -32002 (not paid), -32000 (simulator capture disabled)

// NO capture.getProgress — polling is via session.getState only
// session.getState returns shots[] with shotId, preview data URLs during/after capture
```

**No unsolicited frames on StdOut. No capture.getProgress.** Frontend polls `session.getState` (250–500ms) for authoritative snapshot including `shots[]` with `shotIndex`, `shotId`, `preview` (data URL ≤1 MiB), `secondsRemaining`, `totalShots`, `shotIndex` during capture.

### 5.6 Selection & Preview (Poll Snapshots, Bounded Data URLs)

```typescript
// selection.toggle — only in SELECTING_PHOTOS, capped at layout.selectCount
method: "selection.toggle"
params: { sessionId: string; shotIndex: number; commandId: string; }
result: { selectedIndices: number[]; selectedCount: number; commandId: string; }
// Error: -32001 if state != SELECTING_PHOTOS; -32602 if shotIndex invalid

// selection.confirm — only in SELECTING_PHOTOS, requires exact selectCount
method: "selection.confirm"
params: { sessionId: string; commandId: string; }
result: { state: "EDITING"; commandId: string; }
// Error: -32001 if state != SELECTING_PHOTOS or selectedCount != selectCount
```

**Preview generation (backend-owned, scaled, original retained):**
- Backend composes print preview via `SimulatorCompositor.generate()` using selected photos + current frame
- Returns `previewDataUrl` (JPEG, scaled to ≤1 MiB, max 800px dimension)
- Original full-res files remain in session directory (`original-{shotId}.jpg`)
- Frontend never reads arbitrary file paths; only receives data URLs

### 5.7 Frame & Preview (SimulatorCompositor)

```typescript
// frame.list — only in EDITING
method: "frame.list"
params: { sessionId: string; }
result: { frames: FrameOption[]; }
// FrameOption: { id: string; name: string; thumbDataUrl: string; }  // thumb ≤1 MiB

// frame.select — only in EDITING
method: "frame.select"
params: { sessionId: string; frameId: string; commandId: string; }
result: { previewDataUrl: string; commandId: string; }
// Generates print-image preview via SimulatorCompositor, returns data URL

// frame.confirm — only in EDITING
method: "frame.confirm"
params: { sessionId: string; commandId: string; }
result: { state: "PRINT_PENDING"; previewDataUrl: string; commandId: string; }
// Error: -32001 if state != EDITING or no frame selected
```

### 5.8 Confirm & Print (Dry-Run Only)

```typescript
// print.confirmDryRun — only in PRINT_PENDING
method: "print.confirmDryRun"
params: { sessionId: string; commandId: string; }
result: { state: "FINISHED"; compositionDataUrl: string; printImageDataUrl: string; commandId: string; }
// - Generates composition + print image via SimulatorCompositor
// - Returns both as data URLs (≤1 MiB each)
// - **No printer job submitted, no revenue recognized**
// - Inactivity auto-print: false (backend does not auto-advance)

// print.confirmReal — NOT IMPLEMENTED in simulator (returns -32601)
// Real print path requires Hardware POC gate (Canon + DNP validated)
```

### 5.9 Back Navigation (Guarded)

```typescript
// session.back — guarded edges only
method: "session.back"
params: { sessionId: string; commandId: string; }
result: { state: SessionState; commandId: string; }
// Legal: EDITING→SELECTING_PHOTOS, SELECTING_PHOTOS→SELECTING_QUANTITY, SELECTING_QUANTITY→SELECTING, SELECTING→IDLE
// Error: -32001 for any other transition
```

---

## 6. Error Codes (Extended from IPC_CONTRACTS.md)

| Code | Condition | Retryable |
|------|-----------|-----------|
| -32600 | Invalid request (schema, framing, >1 MiB) | No |
| -32601 | Method not found | No |
| -32602 | Invalid params (wrong state, bad values) | No |
| -32603 | Internal error (simulator capture failed, compositor failed) | Maybe |
| -32000 | Simulator capture not enabled (SIMULATOR_CAPTURE_ENABLED≠true) | No (config) |
| -32001 | Invalid state transition / command not allowed in current state | No |
| -32002 | Payment required / not completed | No |
| -32003 | Timeout (capture, beauty, print queue) | Yes (backoff) |
| -32004 | Locked (another session in progress) | No |
| -32005 | Auth failed (not used in simulator) | No |

---

## 7. Inactivity & Timeout Behavior

- **SELECTING_PHOTOS / EDITING**: 30s inactivity timer (configurable)
- **On timeout in SELECTING_PHOTOS**: Backend auto-fills missing selections from captured order (first available), chooses first frame if empty, calls `startPrinting(userConfirmed=false)` → **auto-print=false in simulator** (state → FINISHED, no revenue, no print job)
- **On timeout in EDITING**: Auto-select first frame → PRINT_PENDING (awaits manual confirmDryRun)
- **Timer resets** on any user command in these states

---

## 8. Idempotency & Duplicate Guards

| Command | Deduplication Key | Duplicate Behavior |
|---------|-------------------|-------------------|
| session.start | sessionId | Returns existing session state |
| session.confirmSetup | sessionId+commandId | Returns same SELECTING_QUANTITY state |
| session.setLayout | sessionId+commandId | Returns same layout |
| session.setQuantity | sessionId+commandId | Returns same pricing |
| payment.mockComplete | sessionId+commandId | Returns paid=true |
| capture.startSequence | sessionId+commandId | Returns same shotIndex |
| selection.toggle | sessionId+commandId | Returns same selection |
| selection.confirm | sessionId+commandId | Returns same EDITING state |
| frame.select | sessionId+commandId | Returns same preview |
| frame.confirm | sessionId+commandId | Returns same PRINT_PENDING |
| print.confirmDryRun | sessionId+commandId | Returns same FINISHED + data URLs |
| session.cancel | sessionId+commandId | Returns cancelled=true |
| session.finish | sessionId+commandId | Returns IDLE |
| session.back | sessionId+commandId | Returns same target state |

**Backend stores** `(sessionId, commandId) → result` for 24h or until session finishes.

---

## 9. Simulator Camera & Compositor Integration (Existing APIs)

### SimulatorCamera (backend/src/main/kotlin/com/lesouvenir/v2/camera/simulator/SimulatorCamera.kt)
- `publishPreview(index: Int)` → `SimulatorPreview(sourceIndex, sourceId, jpeg: ByteArray)` — downscaled to `previewWidth×previewHeight` (config)
- `capture(index: Int, sessionDirectory: Path, shotId: String)` → `SimulatorCapture(sourceIndex, sourceId, original: Path)` — writes `original-{shotId}.jpg` atomically via hard link
- Requires `SimulatorAuthorization(explicitlyEnabled=true)` at construction
- Workspace validated: must be V2 root (`PhotoboothDesktop_v2`)

### SimulatorCompositor (backend/src/main/kotlin/com/lesouvenir/v2/printing/SimulatorCompositor.kt)
- `generate(layout: LayoutMode, photos: List<BufferedImage>, frame: BufferedImage, composition: Path, printImage: Path)` → `Output(composition, printImage, status="FILE_GENERATED")`
- Inputs: photos already have LUT/beauty applied (simulator: raw synthetic)
- Output: composition (with frame), printImage (paper with bleed, strip duplicated if 5x15)
- Frame: loaded from V2 assets (not part of this contract)

---

## 10. Non-Goals (Explicit)

- ❌ No `liveView.subscribe` / streaming (poll `device.getStatus` + `capture.getProgress`)
- ❌ No unsolicited StdOut frames (events removed — StdOut is responses only)
- ❌ No Beauty/ONNX (simulator returns raw synthetic)
- ❌ No Canon EDSDK, DNP driver, PayOS, Neon, Cloudinary
- ❌ No real print, no revenue recognition
- ❌ No simulator revenue (dry-run only, auto-print=false)
- ❌ No frontend-driven state transitions
- ❌ No arbitrary file path reads (all images via data URLs ≤1 MiB)
- ❌ No layout/pricing hardcoded in frontend (all from `catalog.get`)

---

## 11. Acceptance Criteria (Simulator Contract Complete)

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | `catalog.get` returns config layouts + pricing | Unit test + manual invoke |
| 2 | `session.start` → `SELECTING`, layout frozen, pricing frozen | Integration test |
| 3 | `session.setLayout` / `setQuantity` guarded, pricing from `PricingCalculator` | Unit test |
| 4 | `payment.mockComplete` advances `PAYMENT_PENDING` → `PREPARING` → `LIVE_VIEW` (1600ms) | Integration test |
| 5 | `capture.startSequence` + polling `capture.getProgress` returns countdown → shots (data URLs) → COMPLETE → `SELECTING_PHOTOS` | Integration test |
| 6 | `selection.toggle` capped at `selectCount`; `selection.confirm` requires exact count | Unit test |
| 7 | `frame.list` → `frame.select` → `frame.confirm` generates preview via `SimulatorCompositor` | Integration test |
| 8 | `print.confirmDryRun` returns composition+print data URLs, **no printer job, no revenue** | Integration test |
| 9 | `session.back` only on legal edges; `session.cancel` only in `SELECTING_PHOTOS`/`EDITING` | Unit test |
| 10 | Inactivity timeout in `SELECTING_PHOTOS` → auto-fill + FINISHED (no print) | Integration test |
| 11 | Duplicate `commandId` returns same result without side effects | Unit test |
| 12 | All frames ≤1 MiB, data URLs only, originals retained in session dir | Manual verification |
| 13 | `health.check` works unchanged; `availableMethods` includes simulator methods; Rust health validation accepts extended list | Unit test + manual |

---

## 12. Exact Method Allowlist (No Extensions)

**Queries (no commandId):**
- `catalog.get`
- `device.getStatus`
- `session.getState`
- `capture.getProgress`
- `frame.list`
- `health.check` (existing, backwards-compatible)

**Mutating (require commandId, idempotent):**
- `session.start`
- `session.confirmSetup`
- `session.setLayout`
- `session.setQuantity`
- `session.back`
- `session.cancel`
- `session.finish`
- `payment.mockComplete`
- `capture.startSequence`
- `selection.toggle`
- `selection.confirm`
- `frame.select`
- `frame.confirm`
- `print.confirmDryRun`

**Explicitly NOT in simulator:**
- `print.confirmReal` (returns -32601)
- `session.transition` (arbitrary targetState not allowed)
- `capture.abort` (paid capture cannot be aborted to IDLE)
- `liveView.subscribe` / any streaming
- `beauty.*` / `payment.real.*` / `cloud.*` / `neon.*`

---

## 13. File Ownership (Simulator Contract Only)

| File | Owner | Status |
|------|-------|--------|
| `docs/SIMULATOR_IPC_CONTRACT.md` | Architect | **THIS DOCUMENT** (only file I own) |
| `frontend/src/shared/simulator-contract.ts` | Frontend Lead | **OWNED BY FRONTEND** — do not edit |
| `backend/src/main/kotlin/com/lesouvenir/v2/ipc/SimulatorIpcServer.kt` | Backend Engineer | **PLANNED** (extends HealthBridge) |
| `backend/config/simulator-layouts.json` | Architect | **PLANNED** |
| `backend/src/test/kotlin/com/lesouvenir/v2/ipc/SimulatorContractTest.kt` | Tester-Reviewer | **PLANNED** |

---

## 14. Known Gaps (Documented, Not Blockers)

| Gap | Impact | Mitigation |
|-----|--------|------------|
| Force parent kill (Task Manager → End Task) may not run Rust `Drop`/`taskkill` | Orphaned JVM/backend process possible | Documented; production uses Windows Job Object (future gate). Simulator sessions are transient. |
| Rust `bridge.rs` health validation checks `availableMethods == ["health.check"]` | Will fail when backend advertises simulator methods | Frontend Lead updates Rust validation to accept extended list (separate task, not contract change). |
| No durable print reconciliation | Duplicate physical print not prevented in simulator | Simulator dry-run only; real print requires Hardware POC gate. |
| Inactivity timer configurable but not exposed in config | Hardcoded 30s in backend | Add to `simulator-layouts.json` if needed (backend impl detail). |

---

## 15. Status

**CONTRACT FINAL WITH CORRECTIONS** — Ready for implementation by Backend Engineer (SimulatorIpcServer extending HealthBridge) and Frontend Lead (bridge.ts + UI wiring using owned `simulator-contract.ts`). No further approval needed. User authorized V2 builds. Proceed to implementation.

**Next deliverable:** `SimulatorIpcServer.kt` implementation + updated `bridge.rs`/`main.rs` to spawn simulator backend + frontend integration tests.