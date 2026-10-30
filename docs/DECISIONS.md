# Architecture Decision Records (ADR) — V2

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| 001 | Frontend: React + TypeScript + Vite + Tailwind | ✅ Accepted | 2026-10-30 |
| 002 | Desktop Shell: Tauri v2 (candidate) | 🟡 Pending POC | 2026-10-30 |
| 003 | Backend: Kotlin/JVM sidecar (reuse V1 logic) | ✅ Accepted | 2026-10-30 |
| 004 | IPC: JSON-RPC 2.0 over stdio + named pipes | ✅ Accepted | 2026-10-30 |
| 005 | Auth: HMAC-SHA256 per message | ✅ Accepted | 2026-10-30 |
| 006 | Live View: Named pipe JPEG streaming | ✅ Accepted | 2026-10-30 |
| 007 | State Machine: Backend sole authority | ✅ Accepted | 2026-10-30 |
| 008 | Idempotency Keys for Print/Payment | ✅ Accepted | 2026-10-30 |
| 009 | Beauty: Bounded async, fallback to original | ✅ Accepted | 2026-10-30 |
| 010 | Canon EDSDK: Dynamic DLL resolution | ✅ Accepted | 2026-10-30 |
| 011 | Path Isolation: Separate V2 app identity | ✅ Accepted | 2026-10-30 |
| 012 | Simulator Mode for Milestone 2 | ✅ Accepted | 2026-10-30 |

---

## ADR-001: Frontend Technology Stack

**Date**: 2026-10-30  
**Status**: Accepted

### Context
Need a modern, touch-first UI framework for 16:10 landscape kiosk display. V1 used Compose Desktop (Kotlin). V2 requires web technology for broader talent pool and animation library ecosystem.

### Decision
Use **React 18 + TypeScript + Vite + Tailwind CSS + Motion (framer-motion)**.

### Rationale
- React: Large ecosystem, TypeScript support, touch-friendly
- Vite: Fast HMR, optimized production builds
- Tailwind: Utility-first, responsive, kiosk-friendly sizing
- Motion: Declarative animations, gesture support for touch
- WebView2 (Tauri): Hardware-accelerated, evergreen on Windows 10+

### Alternatives Considered
| Option | Rejected Reason |
|--------|-----------------|
| Compose Desktop | Kotlin-only UI talent pool; animation complexity |
| Flutter | Dart learning curve; larger binary |
| Electron + React | Heavier; Tauri v2 preferred for sidecar model |
| Svelte | Smaller ecosystem; team familiarity with React |

### Consequences
- New UI codebase (no V1 Compose reuse)
- WebView2 runtime dependency (Windows 10 1909+)
- CSS-based theming instead of Compose theming

---

## ADR-002: Desktop Shell — Tauri v2 (Candidate)

**Date**: 2026-10-30  
**Status**: Pending POC Validation

### Context
Need a lightweight desktop shell that can spawn a JVM sidecar and manage its lifecycle. Tauri v2 offers sidecar support, Rust security, and small binary size.

### Decision
**Tauri v2 as candidate**, but **only after proving**:
1. JVM sidecar starts/stops reliably
2. StdIO JSON-RPC works bidirectionally
3. Named pipe Live View streaming feasible
4. Crash detection + auto-restart works
5. Windows MSI/MSIX packaging succeeds

**Fallback**: Electron + `child_process` if Tauri sidecar fails POC.

### Rationale
- Tauri v2 sidecar API designed for this pattern
- Rust memory safety for shell
- Smaller bundle than Electron
- Active development, v2 stable

### Risks
- Tauri v2 sidecar + JNA + Windows message pump untested combination
- Named pipe permissions on Windows
- Updater + sidecar version sync

### POC Criteria (Gate 2)
See `HARDWARE_POC_PLAN.md` — Sidecar POC must pass before commitment.

---

## ADR-003: Backend — Kotlin/JVM Sidecar (Reuse V1)

**Date**: 2026-10-30  
**Status**: Accepted

### Context
V1 has stable, production-hardened Kotlin code for: Canon SDK, DNP printing, Beauty (ONNX), composition, pricing, Neon sync. Rewriting risks regression.

### Decision
**Copy V1 backend code into V2** as a separate JVM module (`backend/`), exposed via IPC. No algorithm changes. Preserve:
- `DesktopBoothController` orchestration
- `NativeEosCaptureService` / `HotFolderCaptureService` / `WebcamStillCaptureService`
- `SystemPrinterService` (javax.print)
- `DesktopBeautyService` + ONNX models
- `DesktopCompositor` + `DesktopVideoCompositor`
- `SessionStateMachine` (with guard enforcement added)
- `PricingCalculator`, `SalesRepository`, `NeonDirectRevenueClient`

### Rationale
- Zero behavior change for proven logic
- Faster delivery
- Isolated in sidecar process (crash isolation)

### Consequences
- JVM 21 bundled (via Compose Desktop `nativeDistributions` or jpackage)
- JNA for Canon EDSDK
- ONNX Runtime 1.18.0 for Beauty
- ffmpeg subprocess for video

---

## ADR-004: IPC Protocol — JSON-RPC 2.0 over StdIO + Named Pipes

**Date**: 2026-10-30  
**Status**: Accepted

### Context
Need typed, versioned, authenticated communication between React frontend (Tauri WebView) and Kotlin backend (sidecar).

### Decision
- **Control Plane**: JSON-RPC 2.0 over StdIO (Tauri sidecar spawn)
- **Streaming Plane**: Windows Named Pipes for Live View frames
- **Auth**: HMAC-SHA256 per message (shared secret `PHOTOBOOTH_IPC_SECRET`)
- **Versioning**: `protocolVersion` in envelope; major = breaking

### Rationale
- StdIO: Natural for sidecar, no port conflicts, Tauri-native
- Named Pipes: High-throughput, low-latency, Windows-native, backpressure via read blocking
- JSON-RPC 2.0: Widely supported, typed, batchable
- HMAC: Replay protection, integrity, no TLS complexity for local IPC

### Alternatives Considered
| Option | Rejected Reason |
|--------|-----------------|
| gRPC | Overhead; protobuf complexity for simple IPC |
| WebSocket | Port binding; firewall issues; no stdio simplicity |
| Shared Memory | Complex synchronization; crash recovery hard |
| D-Bus | Linux-only |

---

## ADR-005: Authentication — HMAC-SHA256 Per Message

**Date**: 2026-10-30  
**Status**: Accepted

### Context
Local IPC must be protected against injection, replay, and spoofing. Both processes run as same user.

### Decision
Each JSON-RPC request includes:
```json
{
  "auth": {
    "hmac": "sha256(key, id+method+params+timestamp+nonce)",
    "timestamp": 1234567890,
    "nonce": "uuid-v4"
  }
}
```
- Secret: 32-byte hex, generated at install, stored in `.env`
- Timestamp window: ±5 minutes
- Nonce: Single-use (tracked in memory LRU)

### Rationale
- Stateless verification
- Replay protection via timestamp + nonce
- No certificate management
- Fast (single HMAC per message)

---

## ADR-006: Live View Transport — Named Pipe JPEG Streaming

**Date**: 2026-10-30  
**Status**: Accepted

### Context
Canon EDSDK Live View at ~30fps needs efficient transport to React frontend.

### Decision
- **Backend**: Canon → BufferedImage → Effect → Resize 1280×720 → JPEG q=75 → Base64 → Named Pipe
- **Pipe**: `\\.\pipe\photobooth_v2_lv_<sessionId>`
- **Frontend**: `<img src="data:image/jpeg;base64,...">` update
- **Backpressure**: Ring buffer (5 frames); frontend ACKs via StdIO `liveView.ack`
- **Reconnect**: Exponential backoff (1s, 2s, 4s, max 30s)

### Rationale
- Named pipes: Kernel-mode, no loopback TCP overhead
- JPEG Base64: Universal browser decode, ~150KB/frame
- 15fps target: Balances smoothness vs CPU
- ACK-based flow control: Simple, effective

---

## ADR-007: State Machine — Backend Sole Authority

**Date**: 2026-10-30  
**Status**: Accepted

### Context
V1 `SessionStateMachine` had no transition guards. Frontend could request invalid transitions.

### Decision
**Backend enforces all transitions**. Frontend only requests via `session.transition`. Backend validates against transition table, rejects invalid with `-32001`.

### Transition Table (Enforced)
```
IDLE → SELECTING
SELECTING → SELECTING_QUANTITY
SELECTING_QUANTITY → PAYMENT_PENDING
PAYMENT_PENDING → PREPARING
PREPARING → LIVE_VIEW
LIVE_VIEW → COUNTDOWN
COUNTDOWN → CAPTURING
CAPTURING → LIVE_VIEW | SELECTING_PHOTOS
SELECTING_PHOTOS → EDITING
EDITING → PRINT_PENDING
PRINT_PENDING → PRINTING
PRINTING → DELIVERY
DELIVERY → IDLE
ANY → IDLE (cancel/reset)
ANY → ADMIN (authenticated)
ANY → OUT_OF_SERVICE (hardware failure)
```

### Consequences
- Frontend becomes "dumb" renderer of backend state
- No local state duplication
- Recovery trivial: backend state = source of truth

---

## ADR-008: Idempotency Keys for Print & Payment

**Date**: 2026-10-30  
**Status**: Accepted

### Context
Touchscreens prone to double-tap. V1 had no protection against duplicate print/payment.

### Decision
- **Print**: Client generates `idempotencyKey: UUIDv4()` per "Confirm & Print"
- **Backend**: Stores processed keys (memory LRU 1000 + persisted `data/ipc_idempotency.json`)
- **Duplicate**: Returns existing `printJobId`, `duplicate: true`
- **Payment**: `orderCode` = timestamp (unique); backend tracks pending orders

### Rationale
- Simple client-side generation
- Survives backend restart (persisted)
- No UI locking needed

---

## ADR-009: Beauty Processing — Bounded Async + Fallback

**Date**: 2026-10-30  
**Status**: Accepted

### Context
V1 Beauty runs after capture with 15s timeout, but photo selection screen waits. Need non-blocking UX.

### Decision
- **Capture → SELECTING_PHOTOS immediately** (originals available)
- **Beauty runs in background** (coroutine, 15s/photo timeout, 30s batch)
- **If beauty completes before confirm**: Swap `photoPath` to beauty version
- **If confirm before beauty**: Use originals; beauty continues for album
- **Fallback**: Timeout/error/cancel → return original unchanged
- **Originals always preserved**: `originals/Photo_N.jpg` never overwritten

### Rationale
- UX never blocked by Beauty
- Preserves V1 algorithm/presets exactly
- Album gets beauty version if ready

---

## ADR-010: Canon EDSDK — Dynamic DLL Resolution (No Bundling)

**Date**: 2026-10-30  
**Status**: Accepted

### Context
Canon EDSDK redistribution requires ISV license (unlikely for small vendor).

### Decision
**Do not bundle EDSDK DLLs**. Resolve at runtime:
1. Bundled (if licensed) — `resources/EDSDK_64/`
2. System PATH (user installed EOS Utility)
3. Canon default install paths

**Error if not found**: Clear message to install Canon EOS Utility.

### Rationale
- Legal compliance
- EOS Utility commonly installed by photographers
- HotFolder/Webcam fallbacks documented

---

## ADR-011: Path Isolation — Separate V2 Identity

**Date**: 2026-10-30  
**Status**: Accepted

### Context
V1 and V2 must run independently (or at least not corrupt each other's data).

### Decision
| V1 | V2 |
|----|-----|
| `%LOCALAPPDATA%\LeSouvenirPhotobooth\` | `%LOCALAPPDATA%\LeSouvenirPhotoboothV2\` |
| `.env` in V1 root | `.env` in V2 root |
| `data/sessions/` | `data/sessions/` |
| `HotFolder` at `E:\Photobooth\HotFolder` | `HotFolder` at V2 root |
| Compose MSI `PrettyBoothDesktop` | Tauri MSI `LeSouvenirPhotoboothV2` |
| Upgrade UUID `ce637e69...` | **New UUID** |

### Rationale
- Zero collision risk
- Parallel testing possible
- Clean uninstall separation

---

## ADR-012: Simulator Mode for Milestone 2

**Date**: 2026-10-30  
**Status**: Accepted

### Context
Hardware POC (Canon, DNP) may fail or be unavailable. Need to prove architecture without hardware.

### Decision
**Backend starts with `--simulator` flag**:
- All hardware calls return mock data
- IPC contract fully functional (health, session, capture sim, beauty sim, print sim)
- No Canon, ONNX, Print, Firebase, Neon, PayOS dependencies
- Minimal deps: `org.json`, `bcprov`, `slf4j`

### Rationale
- Unblocks architecture validation
- Frontend can develop against stable IPC
- Hardware POC runs in parallel
- Clear separation: Simulator = Milestone 2, Hardware = Gate 2

---

## ADR-013: Simulator IPC Contract Corrections (2026-10-30)

**Date**: 2026-10-30  
**Status**: Accepted (Contract NOT Finalized — Reviewer Mismatch Open)

### Context
Initial `SIMULATOR_IPC_CONTRACT.md` included unsolicited async events on StdOut and generic `session.transition`/`capture.abort` methods that violate backend-sole-authority and V1 guardrails.

### Corrections Applied
1. **No unsolicited StdOut frames** — StdOut carries only request responses. Frontend polls `capture.getProgress` for snapshots (returns `CaptureShotResult[]` with data URLs ≤1 MiB).
2. **No arbitrary state transitions** — `session.transition(targetState)` removed. Named command `session.confirmSetup` (SELECTING→SELECTING_QUANTITY) only.
3. **No capture abort to IDLE** — `capture.abort` removed. Paid capture completes or times out; backend manages internal state.
4. **Health backwards-compatible** — `health.check` unchanged; `availableMethods` advertises simulator methods; Rust validation updated by Frontend Lead.
5. **Frontend owns immutable IDs** — `generationId` (per load, sessionStorage), `sessionId` (per `session.start`) — frontend-generated UUID v4, backend validates format/rejects reuse.
6. **No simulator revenue** — `print.confirmDryRun` returns data URLs only, never submits print job, never records revenue. `payment.mockComplete` simulator-only. Inactivity auto-print=false.
7. **Force parent kill gap documented** — `Drop`/`taskkill` not guaranteed on abrupt parent death (Windows). Known gap, not contract blocker.

### Exact Allowlist (No Count Claims)
**Queries (no commandId):** `catalog.get`, `device.getStatus`, `session.getState`, `capture.getProgress`, `frame.list`, `health.check`
**Mutating (require commandId, idempotent):** `session.start`, `session.confirmSetup`, `session.setLayout`, `session.setQuantity`, `session.back`, `session.cancel`, `session.finish`, `payment.mockComplete`, `capture.startSequence`, `selection.toggle`, `selection.confirm`, `frame.select`, `frame.confirm`, `print.confirmDryRun`

### Implementation Status
- **Contract NOT finalized** — `docs/SIMULATOR_IPC_CONTRACT.md` reviewer mismatch open; implementers reconciling exact wire format
- **Frontend types** in `frontend/src/shared/simulator-contract.ts` (owned by Frontend Lead, Architect does not edit)
- **Backend implementation** `SimulatorIpcServer.kt` extending `HealthBridge` — IN PROGRESS (Task2)
- **Integration blocker** — Contract draft discrepancies remain integration blocker until backend/frontend agree on exact wire format

---

*All ADRs recorded in `docs/ADR/` as individual files for version control.*