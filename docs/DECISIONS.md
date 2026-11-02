# Architecture Decision Records (ADR) — V2

## Evidence boundary update (2026-10-31; no implementation approval)

- Record frontend 20/6 tests and build as reported passing; backend 42 tests / 1 failure as reported. No rerun is claimed here.
- Three implementation attempts are blocked pending an independently verified V2 checkpoint. Next evidence must be an actual source snapshot plus manifest/hash verification—not a speculative source-copy or HEAD-only assertion.
- Master-audit 17-state enumeration correction and acceptance remain unresolved. The prior accepted-Beauty claim was rejected and is not an accepted baseline.
- No independent forensic verification of V1 integrity/untouched status is claimed.

## Coordination status record (2026-10-31; no checkpoint approval)

- Reject the initial HEAD-only checkpoint claim and conditional archive containing stale tests. Architect correction remains in progress; backend conditional implementation is blocked until a verified backup manifest exists. No app edits before an independently verified checkpoint.
- Preserve the 42-test backend suite's persisted/shared-settings integration intent while isolating the diagnosed six-engine test fixtures and offline harness. The approved remedy is test-only; do not remove integration checks merely to make tests independent.
- Frontend/camera slices remain conditional on verified snapshot evidence. No migration/audit completion or V1 forensic integrity conclusion follows from current agent reports.

## Coordination record (2026-10-31; not an architecture approval)

- Scope authorized: V2-only shell checkpoint and offline tests/builds; temp/cache/output must remain within V2. This does not authorize V1 execution, production calls, hardware/device operations, or physical printing.
- Preserve existing V2 source during baseline work; no redesign decision is made here. Architecture checkpoint owned by architect `ses_e709d20e1ffewRrzeoisMXvDQ9` remains pending.
- Agent status reports and baseline documents are not proof of checkpoint completion, complete audits, hardware support, or parity. V1 untouched forensic verification is **NOT VERIFIED**; only agents' read-only operation reports are available.

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
| 013 | Simulator IPC Contract Corrections | ✅ Accepted | 2026-10-30 |
| 014 | Checkpoint Source Snapshot Created | ✅ Completed | 2026-10-31 |
| 015 | Dual Runtime Engine Architecture & Revenue Gate | ✅ Accepted | 2026-11-01 |
| 016 | Firebase Catalog Service & Disk Frame Hierarchy | ✅ Accepted | 2026-11-01 |
| 017 | Camera-Free Demo Capture Mode in Engine | ✅ Accepted | 2026-11-01 |
| 018 | Korean Touchscreen UI Design Tokens & Layout Plan | ✅ Accepted | 2026-11-01 |
| 019 | V1 Horizontal Snapping Carousel Restoration, Vector Slot Geometry Previews, and Tauri Bridge Failure Teardown | ✅ Accepted | 2026-11-01 |
| 020 | Direct Manipulation Touchscreen Architecture, One-Tap Selection Flows, Staff Payment Authorization, and Liquid Glass 16:10 Geometry | ✅ Accepted | 2026-11-02 |

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

## ADR-019: V1 Horizontal Snapping Carousel Restoration, Vector Slot Geometry Previews, and Tauri Bridge Failure Teardown

**Date**: 2026-11-01  
**Status**: Accepted  
**Authors**: Specialist Solutions Architect (V2)  
**Supersedes/Extends**: Extends ADR-001 (Frontend Stack), ADR-002 (Desktop Shell), ADR-004 (IPC Protocol), and ADR-018 (Korean Design Tokens)

### Context
Legacy V1 Compose UI used `HorizontalPager` with centered active item and scale interpolation (active item scale 1.0, adjacent items scaled down to 0.84, smooth touch swipe, and floating navigation chevrons). In initial V2 iterations:
1. `StudioModeScreen.tsx` fell back to a vertical list layout or unaligned grid with sterile, blank preview rectangles that failed to convey photo slot geometry and counts.
2. Frame selection displayed generic placeholder blocks rather than actual decorative frame artwork because `FrameStore` did not expose rendered thumbnail data URLs to IPC callers.
3. On `ConfirmScreen.tsx`, customer copy stated "In ảnh ngay" even in zero-revenue DEMO mode, misleading customers when no physical print would be produced. On `DeliveryScreen.tsx`, CTA buttons extended below the fold on compact 1280×800 touchscreens.
4. When long-running 600-DPI composition operations exceeded the initial Tauri bridge IPC timeout, the Rust process desynchronized from the Kotlin sidecar. Subsequent requests failed because stale child handle references persisted in memory without proper teardown.

### Decision
1. **Restored V1 Horizontal Snapping Carousel (`StudioModeScreen.tsx`):**
   - Implemented `.v1-layout-carousel` with CSS scroll-snapping and smooth-scroll settling mechanics.
   - Scaled active layout card to `1.0` and centered it within the viewport; adjacent peek cards scale down to `0.84` with graceful opacity reduction (`0.85`), replicating V1 Compose `HorizontalPager` dynamics.
   - Click-to-center / click-to-select interaction allows customers to tap an adjacent peeking card to smoothly center and select it.
   - Added floating navigation chevrons (`‹` and `›`) positioned symmetrically for swift one-touch paging.
2. **Vector Slot Geometry Previews (`LayoutArtwork.tsx`):**
   - Replaced blank rectangles with vector-drawn photo cards rendering exact aspect ratios, custom slot geometries, numbered slot indicators, and aesthetic silhouette portraits.
   - Display customer-friendly layout titles (`formatLayoutTitle`, `formatLayoutSubtitle`) while preserving canonical layout IDs (`515_4_anh`, `1015_4_ILCL`) in subtle `.v1-layout-tag` badges.
3. **Actual Frame Artwork Thumbnails:**
   - Updated `RealSessionEngine.kt` to serialize `thumbDataUrl` via `FrameStore.frameThumbDataUrl`.
   - Updated `FrameOption` in `simulator-contract.ts` to consume and render Base64 artwork thumbnails for decorative frames and seasonal covers.
4. **Truthful Action Copy and Viewport Fit:**
   - Set CTA copy on `ConfirmScreen.tsx` to `"Hoàn thành trải nghiệm →"` during `DEMO` sessions.
   - Implemented a sticky finish bar on `DeliveryScreen.tsx` ensuring zero vertical scroll on 1280×800 touchscreens.
5. **Tauri Bridge Resilience and Failure Teardown:**
   - In `src-tauri/src/main.rs`: Added failure teardown `guard.take()` on IPC errors and process exit events, ensuring that dead or desynchronized sidecar child handles are promptly evicted and cleanly restarted.
   - In `src-tauri/src/bridge.rs`: Extended JSON-RPC execution timeout from 10s to 25s (`Duration::from_secs(25)`), accommodating 600-DPI composite rendering operations without premature timeout drops.

### Consequences
- Touchscreen UX matches and exceeds V1 Compose fidelity with silky smooth 60fps horizontal snapping and authentic Korean photo atelier aesthetic.
- Vector slot illustrations give immediate clarity on photo counts and orientations without heavy network image downloads.
- Rust-to-JVM sidecar IPC is robust against heavy computational workloads and gracefully evicts stale processes without hanging the desktop shell.
- Physical Canon DSLR, DNP printer, and live PayOS charges remain isolated behind truthful boundary gates until physical studio kiosk hardware is attached.

---

## ADR-020: Direct Manipulation Touchscreen Architecture, One-Tap Selection Flows, Staff Payment Authorization, and Liquid Glass 16:10 Geometry

**Date**: 2026-11-02  
**Status**: Accepted  
**Authors**: Specialist Solutions Architect (V2)  
**Supersedes/Extends**: Extends ADR-001, ADR-007, ADR-018, ADR-019

### Context
Following the comprehensive Touchscreen Interaction Audit (`docs/TOUCHSCREEN_INTERACTION_AUDIT.md`), four critical architectural refinements were mandated:
1. **Redundant Continue Buttons:** Frame selection (`FrameScreen.tsx`) and Studio layout selection (`StudioModeScreen.tsx`) retained redundant bottom "Tiếp tục →" buttons from web-form paradigms, creating double-action fatigue and kiosk hesitation.
2. **Programmatic Default Auto-Advance Hazard:** Programmatic default frame selection on mount must never inadvertently trigger auto-advance. Only an explicit customer pointer gesture may advance. Rapid taps also posed ghost-click hazards on incoming primary buttons.
3. **Payment Security Leak:** When PayOS failed or timed out after 15 seconds, V2 exposed a public "Nhân viên xác nhận tiền mặt" button that allowed customers to self-authorize payment.
4. **Nested Box Wrappers & Clutter:** Previews in `PrintPreview`, `FrameScreen`, and `SelectPhotosScreen` had redundant nested white borders and cards instead of floating photostrips with realistic drop shadows tailored for 16:10 kiosk screens (1280×800 and 1920×1200).

### Decision
1. **One-Tap Frame Selection with Auto-Advance & Transition Lockout:**
   - Remove the `ActionBar` and `Tiếp tục →` button from `FrameScreen.tsx`.
   - Customer pointer tap on a frame card immediately sets local optimistic selection, renders preview overlay, locks transitions (`isTransitioning.current = true`), dispatches `frame.select`, waits a 320ms visual confirmation delay, and dispatches `frame.confirm` to advance to `PRINT_PENDING`.
   - Programmatic default frame selection on mount is strictly isolated and NEVER triggers auto-advance.
   - Ghost-click armor: `ConfirmScreen.tsx` enforces a 500ms Input Arming Delay (`isArmed`) on the primary "Confirm & Print" button.
   - Inactivity timeout: Backend watchdog timer in `EDITING` automatically selects default frame and advances upon timeout.
2. **One-Tap Layout Selection (Centered Card Direct Advance):**
   - Remove the bottom `ActionBar` from `StudioModeScreen.tsx`.
   - Tapping an off-center card smoothly centers it and calls `session.setLayout`. Tapping the active centered card directly commits and dispatches `session.confirmSetup` to advance to `SELECTING_QUANTITY`.
3. **Ironclad Payment Security & Hidden Staff Authorization:**
   - Completely remove customer-facing cash buttons; `staffVisible` strictly equals `staffPanelVisible`.
   - PayOS failures display customer guidance and a retry QR button only.
   - Restore V1's hidden 1000ms title hold gesture with <12px movement cancellation threshold.
   - Require 4-digit Staff PIN modal verification before unlocking cash authorization.
   - Strictly gate transactional revenue recording on verified user-confirmed print spooling (`userConfirmed && printJob.await()`).
4. **Liquid Glass Design System & 16:10 Kiosk Geometry:**
   - Remove outer white backgrounds, borders, and shadows from `.v1-preview` and `.v1-preview-empty`.
   - Apply realistic multi-layered drop shadows (`filter: drop-shadow(...)`) to floating photostrip canvases.
   - Enforce strict viewport height budgeting ensuring zero vertical page scroll across 1280×800 and 1920×1200 screens.
   - Modernize operator tabs with a dark graphite Studio Workspace theme.
5. **Reaffirm 300 DPI Native Compositing Parity:**
   - Confirm DNP DS-RX1HS native 300 DPI dot grid (1226×1829 px paper; 592×1790 px strip).
   - Document that V1's `renderScale = 2` was an illusion that consumed 4× RAM without printer resolution benefit.

### Consequences
- Eliminates 10–25 seconds of kiosk hesitation per session, boosting retail throughput.
- Eliminates customer payment bypass vulnerabilities and ghost-click misprints.
- Establishes a floating, premium Korean atelier aesthetic with zero page scrolling.
- See `docs/TOUCHSCREEN_ARCHITECTURE_SPEC.md` for complete engineering specifications and IPC schemas.

---

*All ADRs recorded in `docs/ADR/` as individual files for version control.*
