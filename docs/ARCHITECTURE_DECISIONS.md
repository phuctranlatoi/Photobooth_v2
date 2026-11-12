# LE SOUVENIR Photobooth V2 — Architecture Decisions

**Status:** Proposed architecture baseline; hardware, manifest/license, and shell gates remain open  
**Date:** 2026-11-12  
**Scope:** V2 only  
**Evidence basis:** `V1_FEATURE_INVENTORY.md`, `V1_SOURCE_INDEX.md`,
`V1_PARITY_MATRIX.md`, `CAMERA_ANALYSIS.md`, and `PRINTER_ANALYSIS.md`

This document establishes boundaries and decisions for the independent V2 app. It
does not report a compiled proof, a packaged build, or physical hardware
validation. Source-observed V1 behavior is distinguished from V2 proposals. The
audit records Beauty/LUT/model code and parameters, but the accepted source/model
manifest and redistribution disposition still require explicit confirmation. A
mock or simulator result must never be reported as Canon or DNP validation.
Historical V2 implementation/evidence documents, where present, must be mapped to
the explicit evidence classes and rerun criteria in `TAURI_FEASIBILITY.md`; their
existence does not silently close this architecture's gates.

### Normative document set and precedence

For the architecture established by this task, the normative set is:

1. `ARCHITECTURE_DECISIONS.md` for boundaries and decisions;
2. `IPC_CONTRACTS.md` for wire/interface semantics;
3. `V2_PROJECT_STRUCTURE.md` for target ownership/isolation;
4. `TAURI_FEASIBILITY.md` for shell/hardware evidence gates;
5. `MILESTONE_PLAN.md` for delivery gates;
6. the updated ADRs for individual decision rationale.

If an older proposal elsewhere in `docs/` conflicts—for example HMAC stored in
`.env`, base64 Live View JSON, a five-frame queue, immediate photo selection
instead of the audited Beauty aggregate wait, arbitrary state transitions, a
public local file server, permissive printer fallback, or a claim that EOS Utility
is a proven EDSDK prerequisite—this normative set supersedes that proposal.
Historical implementation/test reports remain evidence of exactly what they ran;
they are not rewritten into stronger evidence by this precedence rule.

## 1. Decision status and non-negotiable invariants

| ID | Decision | Status |
|---|---|---|
| AD-01 | React + TypeScript + Vite + Tailwind CSS + restrained Motion | **Confirmed** |
| AD-02 | Tauri 2 as the first shell candidate | **Conditional; not selected until Phase 2 passes** |
| AD-03 | Electron as the prepared fallback shell | **Contingency** |
| AD-04 | Kotlin/JVM backend sidecar, copying the designated stable V1 implementation into V2 without retuning | **Confirmed, subject to manifest, native/hardware feasibility and licenses** |
| AD-05 | Versioned JSON-RPC control contract over private inherited pipes | **Proposed for POC and contract tests** |
| AD-06 | Private binary latest-frame channel for Live View | **Proposed; must meet measured POC criteria** |
| AD-07 | Backend is the sole business and hardware authority | **Confirmed** |
| AD-08 | Separate V2 identity and every writable path | **Confirmed** |
| AD-09 | Preserve V1 state outcomes, layout counts, countdowns, image order, and business rules | **Confirmed** |
| AD-10 | No customer-facing or public sidecar listener | **Confirmed** |
| AD-11 | JSON Schema 2020-12 is canonical; TypeScript/Kotlin types and golden fixtures are generated/validated from it | **Proposed contract baseline** |

The following invariants apply regardless of shell choice:

1. The frontend renders authoritative backend snapshots; it does not command
   Canon, submit printer jobs, decide payment success, write Neon, or create final
   files.
2. No V1 runtime directory, configuration, Hot Folder, database, capture,
   installer identity, mutex, log, cache, or secret is reused implicitly.
3. A real print, physical shutter/capture, production payment, production cloud
   write, or live Neon write requires explicit authorization. Dry runs are the
   default.
4. A repeated customer tap cannot create a second payment intent or print job.
5. V1 Kotlin algorithms designated by the project guardrails are copied into V2
   only after an exact source/model manifest and license disposition, then
   characterized before any refactor. Beauty/LUT/composition retuning is out of
   scope.
6. Full frontend–real-backend integration is not greenlit until the Canon native
   path and installed Windows spooler/DNP path satisfy the Phase 2 hardware gate.
7. Simulator/diagnostic mode is an explicit operator/deployment policy with
   unmistakable status; Real mode never silently substitutes generated captures,
   mock payment, dry-run printing, or fake device health.

Canon is the required primary feasibility gate. Hot Folder, CLI, or webcam remain
explicitly selected adapters and possible product-approved operational
alternatives; their existence cannot be used to declare the Canon gate passed.
Likewise, “render to file” cannot substitute for proving the installed spooler
route required for full integration.

## 2. Logical architecture (C4 style)

### 2.1 Context

```text
Customer / operator
        |
        v
+------------------------ LE SOUVENIR V2 -------------------------+
| React kiosk UI -> desktop shell -> Kotlin/JVM authority         |
+------------------------------------------------------------------+
       |                 |                 |                |
       v                 v                 v                v
 Canon camera       Windows spooler    PayOS / album     V2-only disk
 (EDSDK/adapter)     + installed DNP    / Cloudinary /   and local ledger
                                          Neon
```

External services are reached by the backend only. The V2 desktop does not host
a public webhook or LAN download server. PayOS webhook receipt belongs to the
trusted remote service; the sidecar learns a verified result by authenticated
polling or a trusted API response.

### 2.2 Containers and components

```text
+ React renderer --------------------------------------------------+
| Screens | view store | typed IPC client | media/object-URL view |
+-------------------------------|----------------------------------+
                                | Tauri invoke/events (allowlisted)
+ Desktop shell ----------------v----------------------------------+
| kiosk window | lifecycle supervisor | JSON-RPC bridge            |
| latest-frame buffer | scoped media protocol | crash detector      |
+-------------------------------|----------------------------------+
                                | inherited stdin/stdout + private
                                | frame pipe; no TCP listener
+ Kotlin/JVM sidecar -----------v----------------------------------+
| IPC adapter | session orchestrator | operation/idempotency journal|
| camera ports | printer port | processing/compositor              |
| payment/revenue/delivery adapters | config/secrets | storage      |
+---------|----------------|-------------------|--------------------+
          v                v                   v
   Canon adapters    Java Print Service     HTTPS/JDBC integrations
```

The shell is an adapter, not a second business layer. It supervises the child,
enforces an IPC method allowlist, transfers bytes, and integrates with Windows.
Session rules remain in Kotlin.

## 3. Frontend decision

Use **React + TypeScript + Vite + Tailwind CSS + Motion**.

Frontend responsibilities:

- touch-first 16:10 presentation and accessible interaction;
- render `SessionSnapshot`, progress, errors, and device health;
- generate one UUID idempotency key for one deliberate user action and reuse it
  while retrying that same action;
- subscribe/unsubscribe to Live View with screen lifetime;
- keep only ephemeral view state such as open panels and animation state.

Frontend prohibitions:

- no Canon, printer, database, payment, filesystem, or cloud SDK;
- no authoritative state transition, pricing calculation, payment override, or
  path construction;
- no secret values, `.env` parsing, service-account JSON, API keys, database URLs,
  or native DLL paths;
- no base64 copies of full-resolution captures in application state.

Motion is limited to feedback and state transitions. It must honor reduced-motion
settings and cannot delay an authoritative command or disguise an error.

## 4. Desktop shell: Tauri 2 versus Electron

### 4.1 Decision rule

Tauri 2 is the preferred candidate because the hardware and business work stays
in the JVM sidecar, while Tauri can provide a small Windows host and WebView2.
This is a hypothesis, not evidence. Select Tauri only after a **packaged x64
Windows POC**, not merely `tauri dev`, passes all mandatory criteria in
`TAURI_FEASIBILITY.md`.

| Criterion | Tauri 2 must demonstrate | Electron fallback expectation |
|---|---|---|
| Sidecar lifecycle | Bundled JVM starts, handshakes, shuts down, and leaves no orphan | `child_process.spawn` plus Windows Job Object |
| Native environment | Correct x64 JRE and approved EDSDK DLL directory survive MSI installation | Same launcher/environment passed by Electron main |
| Control IPC | Framing remains synchronized under load and after errors | Node streams provide equivalent framing |
| Live View | Sustained latest-frame transport without unbounded memory or command starvation | MessagePort/transferable `ArrayBuffer` |
| Crash handling | Exit detected, UI notified, bounded restart works, no mutation replay | Main-process child exit/restart |
| Installer | Clean-VM install, launch, upgrade, uninstall, path isolation, measured size | Larger bundled Chromium but deterministic runtime |
| Kiosk behavior | Fullscreen, single-instance V2 mutex, CSP, navigation lock, touch operation | BrowserWindow kiosk controls |

Tauri fails the gate if any mandatory criterion remains nondeterministic after a
bounded remediation cycle, if the release build cannot package the JVM/native
layout, or if Live View blocks control traffic. Canon or DNP failure is first
treated as a backend/driver finding; it causes a shell switch only when evidence
shows the shell's process or packaging model is the cause.

### 4.2 Electron trade-off

Electron keeps the React and Kotlin contracts intact and changes only the shell
adapter. It offers mature child-process and transferable-binary APIs and bundles
a known Chromium version. Costs are a larger installer/RAM footprint, an
additional Chromium patch obligation, and a broader Node/main-process security
surface. Node integration stays disabled; context isolation and a narrow preload
API are mandatory.

No shell rewrite begins in parallel “just in case.” The POC records enough data
to execute the fallback, then one shell is selected at the gate.

## 5. Kotlin/JVM sidecar process model

### 5.1 Runtime process tree

```text
LeSouvenirPhotoboothV2.exe                 app lifetime (Tauri candidate)
|- WebView2 renderer                       window lifetime (Chromium renderer if Electron)
`- lesouvenir-backend-v2.exe              app lifetime, supervised child
   |- protocol reader                      sidecar lifetime, one thread
   |- protocol writer                      sidecar lifetime, one serialized writer
   |- session dispatcher                   sidecar lifetime, serialized mutations
   |- Canon/EDSDK dispatcher               adapter lifetime, one dedicated thread
   |- Live View acquisition                subscription/camera lifetime
   |- printer executor                     sidecar lifetime, bounded/single submitter
   |- Beauty/ONNX pool                     bounded job lifetime
   |- blocking I/O pool                    bounded, sidecar lifetime
   |- cloud sync workers                   bounded operation lifetime
   `- ffmpeg child processes               per video job, timeout + process-tree kill
```

The sidecar is a single instance per V2 shell. A V2-specific mutex prevents two
V2 authorities from controlling the same resources; it does not use or alter a
V1 mutex. If V1 is concurrently holding the camera, V2 reports
`CAMERA_BUSY_EXTERNAL` rather than taking over.

JNA/EDSDK and ONNX native code still live inside the JVM process, so the sidecar
isolates a native crash from the shell/UI but not from other backend work. Do not
split native camera into another process speculatively; introduce that boundary
only if the packaged Canon POC demonstrates JVM-wide instability and record the
trade-off in an ADR.

### 5.2 Startup

1. Shell resolves only V2 install and writable roots and acquires the V2 mutex.
2. Shell starts the native sidecar launcher with its bundled x64 runtime. The
   launch must work with `JAVA_HOME` and Java removed from `PATH`.
3. Shell supplies non-secret path/profile arguments and establishes inherited
   pipes. A random per-launch nonce is passed through the private bootstrap pipe,
   not a URL, command line, log, or frontend value.
4. Backend validates writable roots, opens its local journal/ledger, initializes
   adapters, and responds to `system.hello` with supported contract versions.
5. `health.get` progresses from `STARTING` to `READY` or `DEGRADED`. Camera or
   network degradation is explicit; it is not hidden behind mock data.
6. Only after a compatible handshake does the shell expose the backend as
   connected to React.

Cold readiness target is at most 8 seconds, preserving V1's observed readiness
window as the initial budget. The POC must report actual percentiles.

### 5.3 Health and supervision

- Shell sends `health.get` every 2 seconds while a customer session is active and
  every 5 seconds while idle. Three missed deadlines or process exit produces a
  shell-originated `connection.lost` event.
- Health separates **liveness**, **readiness**, and dependency states. A running
  process with an unavailable camera is `DEGRADED`, not healthy-by-omission.
- Restart is bounded (maximum three attempts with 1 s, 2 s, and 5 s delays). The
  shell never replays a mutating request automatically.
- After restart, the frontend obtains `session.getSnapshot`. The backend reads its
  operation journal before deciding whether an operation is safe to continue.
- A print whose submission outcome is uncertain becomes `OUTCOME_UNKNOWN`; it is
  never auto-resubmitted. An operator reconciles the spooler first.

### 5.4 Threading, serialization, and lifetime rules

- One session dispatcher serializes every state mutation, revision increment,
  timeout decision, and operation-journal transition. Blocking hardware/network
  calls never run on it.
- Canon initialization, callback/message processing, Live View commands, capture,
  reconnect, and disposal are serialized through one dedicated adapter executor.
  The hardware POC must establish any EDSDK message-pump/thread-affinity details;
  source audit alone did not validate them.
- Live View acquisition is a child of one subscription and camera session. Frame
  encode/publish is bounded latest-value work; unsubscribe cancels it without
  closing unrelated session work.
- Printer submission uses a bounded single submitter per configured queue until
  driver behavior proves greater concurrency safe. Status polling cannot submit.
- Beauty uses a bounded pool and per-session structured jobs. ONNX detector/parser
  access retains the audited V1 locking requirements; a late generation cannot
  publish into a new session.
- Payment polling, cloud upload, revenue sync, and FFmpeg processes are children
  of explicit operation scopes with deadlines. JVM cancellation always includes
  process-tree cleanup for owned native children.
- Protocol reads may parse concurrently, but all responses/events pass through
  one serialized writer so byte frames cannot interleave.

### 5.5 Graceful shutdown

1. Shell stops accepting customer commands and sends `system.shutdown`.
2. Backend unsubscribes Live View, prevents new mutations, checkpoints the
   operation journal, closes camera sessions/native SDK, database, and executors,
   and terminates owned ffmpeg children.
3. Backend returns `ShutdownAccepted`, closes protocol output, and exits within a
   measured 5-second target.
4. After the deadline the shell terminates the complete child process tree using
   a Windows Job Object and records an unclean shutdown.

The V1 camera audit found no deterministic public disposal method and an
unbounded blocking capture future. The V2 adapter must add bounded lifecycle
control around copied behavior without changing capture/image algorithms.

## 6. IPC decision and transport boundaries

### 6.1 Control plane

- **React → shell:** typed Tauri commands (or Electron preload calls) generated
  from the contract. The renderer cannot spawn arbitrary processes.
- **Shell ↔ Kotlin:** JSON-RPC 2.0, UTF-8 JSON, framed by a 4-byte big-endian
  payload length on inherited stdin/stdout. Control frames are capped at 1 MiB.
- **Backend events:** JSON-RPC notifications on the same framed stdout, serialized
  by one writer. `stderr` is diagnostics only and can never carry protocol data.
- **Schema:** versioned JSON Schema is canonical; generated TypeScript and Kotlin
  representations plus golden fixtures prevent drift.
- **No loopback/public server:** no WebSocket, HTTP callback, or LAN listener is
  needed for desktop IPC.

The shell exposes a fixed method allowlist. The renderer cannot choose an
executable, arbitrary filesystem path, native library, printer name, SQL, URL, or
JSON-RPC method outside that allowlist.

### 6.2 Live View plane

The POC candidate is compressed JPEG bytes over a random private Windows named
pipe between Kotlin and the shell. The pipe is scoped to the current user/session
and launch nonce. The shell holds exactly the latest complete frame. React pulls
the next frame through a binary shell command and creates/revokes an object URL.

- Canon acquisition target: preserve V1's approximately 30 fps request cadence.
- Negotiated UI delivery: preferred 20–30 fps; 15 fps is the minimum POC pass
  rate at 1280×720 and requires product acceptance if selected for release.
- Encoding candidate: JPEG, quality 75–85, maximum 1280×720 preview only.
- Queue: one frame per subscriber; a new frame replaces an unread old frame.
- One frontend request may be outstanding. There is no accumulating ACK queue.
- Captures and full-resolution images never traverse the Live View channel.
- Unsubscribe is mandatory on screen exit, session generation change,
  connection loss, or app backgrounding.

If this path misses the latency/CPU/stability gate, test raw/shared buffers as a
targeted second POC. Do not introduce shared memory merely for novelty. Electron
may use transferable `ArrayBuffer` while preserving the same subscription API.

### 6.3 Contract domain summary

`IPC_CONTRACTS.md` is normative. The domains below show ownership and required
messages.

| Domain | Requests/queries | Backend or shell events |
|---|---|---|
| System | `system.hello`, `health.get`, `system.shutdown` | `connection.lost`, `connection.recovered`, `health.changed` |
| Devices | `device.getStatus`, `camera.getCapabilities`, `printer.list` | `device.statusChanged` |
| Camera | `liveView.subscribe`, `liveView.unsubscribe`, `capture.startSequence`, `capture.getStatus` | `liveView.status`, `capture.progress`, `photo.ready`, `capture.completed` |
| Session | `session.start`, setup/effect/layout, quantity, back, activity, snapshot, cancel, finish | `session.stateChanged`, `session.timeoutChanged` |
| Selection/frame | `selection.set`, `selection.confirm`, `frame.list`, `frame.select`, `frame.confirm` | snapshot/state events and composition progress |
| Beauty/LUT | `processing.request`, `processing.getStatus`, `operation.cancel` | `processing.progress`, `processing.completed` |
| Printer | `print.confirm`, `print.getStatus`, `operation.cancel` | `print.statusChanged`, structured printer error |
| Payment | `payment.create`, `payment.verify`, authorized cash confirm | `payment.statusChanged`, `payment.webhookObserved` |
| Delivery | `delivery.getStatus`, `delivery.retry` | upload, Neon sync, album and `delivery.ready` events |
| Admin/studio | sanitized settings, diagnostics, layout/asset operations | diagnostic progress/results |

### 6.4 Media references

Control messages contain opaque `MediaRef` identifiers, dimensions, MIME type,
and revision—not absolute paths or full-resolution base64. The shell/backend
resolves the identifier under an allowlisted V2 root. This prevents renderer path
traversal and avoids large JSON frames.

### 6.5 Command ownership and contract mapping

The renderer requests intents; it never requests a generic target state or sends
authoritative totals/paths. Representative mappings are:

| User/system intent | Backend command | Authority/result |
|---|---|---|
| Start/setup | `session.start`, `session.setLayout`, `session.setEffect`, `session.confirmSetup` | Kotlin validates revision and returns snapshot |
| Quantity/payment | `session.setQuantity`, `payment.create`, `payment.verify`, authorized `payment.confirmCash` | Kotlin freezes price/amount and decides paid status |
| Capture/live preview | `liveView.subscribe`, `capture.startSequence`, `liveView.unsubscribe` | Kotlin serializes Canon and uses layout counts/countdown |
| Select/frame | `selection.set`, `selection.confirm`, `frame.select`, `frame.confirm` | Kotlin enforces select count and owns composition |
| Processing | automatic capture Beauty or authorized `processing.request` | Kotlin applies bounded fallback and emits `photo.ready` |
| Confirm/print | `print.confirm` with durable idempotency key | Kotlin chooses payload/queue/copies and journals spool boundary |
| Delivery | `delivery.getStatus`, scoped `delivery.retry` | Kotlin owns upload ordering, Neon/ledger state and QR URL |
| Admin/studio | typed settings/catalog/import/diagnostic commands | Kotlin validates grant, revision, files and secret-safe output |

PayOS webhook receipt is not a desktop listener. A trusted remote endpoint verifies
it; the backend receives authenticated observation or queries PayOS, revalidates
session/order/amount, and emits a sanitized event. Full per-domain TypeScript and
Kotlin shapes, cancellation outcomes, error codes, and event semantics are in
`IPC_CONTRACTS.md`.

## 7. Backend authority and V1 parity

### 7.1 Authoritative areas

Only Kotlin may:

- discover/reconnect Canon and serialize Live View/capture commands;
- transition sessions and run inactivity timers;
- freeze pricing and determine PayOS/payment status;
- render output, choose a configured exact printer, and submit a print;
- record the SQLite ledger and write/sync Neon;
- upload Cloudinary/Web Album assets and generate trusted delivery QR data;
- select canonical original versus Beauty fallback;
- create, move, or delete session/output files.

### 7.2 Preserved state outcomes

All 17 V1 enum values remain contract values:

```text
IDLE, SELECTING, SELECTING_QUANTITY, PAYMENT_PENDING, PREPARING,
LIVE_VIEW, COUNTDOWN, CAPTURING, SELECTING_PHOTOS, EDITING,
COMPOSING, PRINT_PENDING, PRINTING, DELIVERY, RECOVERY,
OUT_OF_SERVICE, ADMIN
```

The observed customer path remains:

```text
IDLE -> SELECTING -> SELECTING_QUANTITY -> PAYMENT_PENDING
     -> PREPARING -> LIVE_VIEW -> (COUNTDOWN -> CAPTURING -> LIVE_VIEW)*
     -> SELECTING_PHOTOS -> EDITING -> PRINT_PENDING -> PRINTING
     -> DELIVERY -> IDLE
```

Back/cancel/timeout behavior remains exactly as audited:

- back: quantity→selecting, payment→quantity (and stop polling),
  editing→photo selection, print pending→editing;
- cancel only from photo selection or editing, with job cancellation and V2
  session-directory cleanup;
- configurable 90/60/90-second defaults remain config values, never frontend
  constants;
- inactivity auto-selection/auto-print preserves `userConfirmed=false`, hence no
  revenue record.

V1 declared `COMPOSING`, `RECOVERY`, and `OUT_OF_SERVICE` but did not assign them
in observed code. Activating those as customer-flow states, changing the 1.6 s
prepare delay or 700 ms post-capture delay, changing allowed back/cancel paths,
or moving timers to the frontend requires an explicit product/parity approval.
Connection recovery can initially be represented by overlay/events without
silently changing session state.

Transition guards are a V2 safety addition at the backend command boundary: only
the audited intent routes above are callable, stale revisions/generations fail,
and the renderer cannot issue `transitionTo(target)`. This does not authorize new
customer states or changed outcomes; any guard that blocks an observed V1 route
is a parity defect unless explicitly approved.

Layout `shotCount`, `selectCount`, `countdownSeconds`, slot geometry, aspect ratio,
and pricing are taken from the backend layout snapshot. Examples in UI tests are
fixtures only and must never become production constants.

### 7.3 Idempotency and revisions

Every mutating request contains:

- `commandId`: unique attempt identifier;
- `idempotencyKey`: stable identifier for one logical side effect where required;
- `sessionId` and `generationId` when session-scoped;
- `expectedRevision` for stale-screen protection.

The backend persists a `PENDING` operation record **before** an external side
effect and stores the result atomically afterward. A duplicate key with identical
canonical parameters returns the original result. The same key with different
parameters returns `IDEMPOTENCY_CONFLICT`.

Print and payment idempotency records survive a sidecar restart. A crash between
spool submission and result persistence yields `OUTCOME_UNKNOWN`; there is no
automatic print retry. The frontend disabling a button is useful UX but is not
the duplicate-prevention boundary.

## 8. Image, LUT, Beauty, and composition decision

Preserve the audited V1 order:

```text
immutable transferred/source file
  -> designated V1 effect (3D LUT or ColorMatrix)
  -> horizontal mirror
  -> canonical JPEG original (Photo_N.jpg)
  -> YuNet/BiSeNet/Beauty derivative (when enabled)
  -> composition uses derivative if ready, otherwise canonical original
```

V2 additionally retains the immutable transferred source under the V2 session
root where licensing/privacy policy permits; it never overwrites the canonical
original. Hot Folder ingestion copies into the session before any source cleanup.
This storage safety change does not authorize retuning pixels.

The immutable transferred source and canonical processed original are therefore
distinct: V1 called the effect+mirror JPEG `Photo_N.jpg`; V2 preserves that image
as the canonical customer original for parity while optionally retaining a raw
ingest/source copy for recovery and audit under the retention/privacy policy.

After each save, Beauty runs in a bounded worker using the designated, manifest-
verified thresholds, presets, model files, and fallback. Preserve V1's
**15-second aggregate wait cap**
before photo selection as the initial behavior: completed derivatives are used;
unfinished/failed items fall back to originals and selection proceeds. There is
never an unbounded wait. A proposal to enter selection immediately is a UX/parity
change and needs explicit approval.

Progress events are advisory. The authoritative `photo.ready` message identifies
which immutable original and optional derivative are available. Cancelling a
session cancels queued processing; already-running native inference is bounded
and its late result cannot mutate a newer generation.

## 9. Printing, payment, revenue, and delivery contracts

### 9.1 Printing

- Printer selection is exact against an enumerated installed queue. Missing
  configured printers fail visibly; V2 never silently falls back to the Windows
  default.
- Preserve V1 composition geometry, orientation behavior, borderless request,
  printer routing, and strip sheet calculation until fixture and physical tests
  approve a change.
- Status distinguishes `PREPARING`, `SUBMITTING`, `ACCEPTED_BY_SPOOLER`,
  `COMPLETED` (only when proven), `FAILED`, `CANCELLED`, and `OUTCOME_UNKNOWN`.
- Java `PrinterJob.print()` returning means spooler acceptance, not a physically
  completed DNP print.
- Cancellation is guaranteed only before submission. After acceptance, return
  `TOO_LATE`; do not pretend the physical job was cancelled.

### 9.2 Payment and revenue

The backend computes the amount from the frozen layout/quantity snapshot. It
creates and verifies PayOS orders and validates any webhook-originated evidence.
The renderer cannot send an amount or a “paid=true” value that becomes
authoritative. Staff cash confirmation requires an authenticated operator path.

Preserve the V1 revenue gate:

```text
userConfirmed
AND print accepted by the configured spooler path
AND current session still equals the submitted session
AND idempotent local ledger insert succeeds or already exists
```

Auto-print, dry-run, mock, preview, or outcome-unknown paths do not create new
revenue. Cloud/Neon synchronization follows the local idempotent ledger and does
not decide whether the customer may proceed.

### 9.3 Cloudinary, Web Album, Neon, and QR

Uploads and syncs are backend operations with independent, retryable statuses.
Asset finalization remains ordered as in V1. QR encodes only a backend-approved
HTTPS album/delivery URL. With no network, final files remain local in V2 and the
UI reports deferred delivery; V2 does not revive V1's `0.0.0.0:8080` server by
default.

## 10. Error propagation, cancellation, and recovery

Every error has a stable domain code, safe message key, retry classification,
operation/session identifiers, and sanitized details. Stack traces, SQL, secrets,
absolute private paths, and raw vendor payloads remain in redacted backend logs.

| Classification | Example | Contract behavior |
|---|---|---|
| Validation | invalid count or schema | reject; no side effect; not retryable unchanged |
| State conflict | stale revision/wrong state | return latest snapshot reference; refresh first |
| Dependency unavailable | camera/printer/network absent | recoverable status event; bounded/manual retry |
| Timeout before side effect | Beauty or HTTP deadline | cancel/fallback or safe retry per operation |
| Outcome unknown | crash during print/payment boundary | no automatic retry; operator reconciliation |
| Fatal backend | protocol corruption/native crash | shell emits connection lost and bounded restart |

`operation.cancel` returns one of `CANCELLED`, `CANCEL_REQUESTED`, `TOO_LATE`, or
`NOT_CANCELLABLE`. It never guarantees cancellation merely because the request
was received. Session cancellation retains the narrower audited V1 state guard.

Recovery examples:

| Disaster | Detection | Safe response |
|---|---|---|
| Sidecar exits | child exit/pipe EOF/heartbeat failure | overlay, stop frame subscription, restart boundedly, fetch journal snapshot; no mutation replay |
| Camera unavailable/unplugged | adapter status and frame deadline | stop capture commands, report disconnected, serialized reconnect; never substitute a mock silently |
| Printer unplugged/error | enumeration/submission/spool status | fail before submit where possible; after uncertain submit mark unknown, never duplicate |
| Hot Folder stalls | stable-file deadline | retain session, structured timeout, operator retry; never consume partial file |
| Power loss | unclean journal marker on restart | reconcile payment/print operations before resume/discard |
| Network/payment failure | bounded HTTPS failure/poll deadline | keep payment pending or authorized staff path; queue eligible cloud sync only |
| Repeated tap | idempotency journal | return the same operation/result |
| V1 and V2 concurrently run | exclusive camera/queue status plus separate paths | V2 reports resource busy; no V1 storage/config access |

## 11. Security and isolation

### 11.1 Secret boundary

Business credentials live only in the Kotlin process and an ACL-protected V2
secret provider (Windows Credential Manager or DPAPI-protected file). They are not
bundled into JavaScript, returned by settings APIs, logged, placed in command-line
arguments, or inherited from V1. Production admin settings expose only
`configured: true/false` and non-secret fields. Secret provisioning is an
operator/install workflow outside the customer renderer.

### 11.2 Shell and renderer controls

- production CSP permits packaged resources only; remote navigation and arbitrary
  downloads are blocked;
- Tauri capabilities/Electron preload expose a minimal allowlist;
- devtools are disabled in production kiosk mode;
- media handles are scoped to a session/generation and V2 roots;
- named pipes use random names, current-user/session ACLs, size limits, and a
  per-launch nonce;
- protocol payloads have depth, string, array, and frame-size limits;
- all logs redact credentials, QR payment secrets, customer URLs where required,
  and customer image bytes.

### 11.3 Writable-path isolation

The release design uses a read-only install root and explicit V2 roots for config,
secrets, logs, temp, Hot Folder, captures, outputs, operator assets, cache, and
state. Exact paths are in `V2_PROJECT_STRUCTURE.md`. Portable-mode auto-discovery
and migration from V1 are not allowed.

## 12. Changes requiring explicit approval

The following are not “architecture cleanup” and cannot be introduced silently:

- changing any per-layout photo count, selection count, countdown, pricing, copy
  rule, delay, back route, cancel route, or inactivity outcome;
- activating previously unused session states as customer states;
- changing LUT/mirror/Beauty/composition order, thresholds, presets, models,
  dimensions, crop, DPI, or printer cut behavior;
- interpreting spooler acceptance as physical completion;
- recording revenue for inactivity, dry-run, mock, or failed/unknown print paths;
- exposing a local public port, sharing V1 writable storage, or putting secrets in
  frontend configuration;
- switching shell before recording the failed criterion and reviewing the
  Electron trade-off.

## 13. Distribution and release architecture

The shell, React bundle, Kotlin backend, minimized x64 JRE, schemas, and legally
approved native/model resources form one versioned release unit. The installer
must not depend on an ambient Java installation and must not install the backend
as an independently updatable service.

| Concern | Decision / gate |
|---|---|
| Bundled JRE | Generate a pinned, minimized x64 runtime image; test with `JAVA_HOME`/Java absent |
| Canon DLLs | Restricted until authoritative redistribution/use terms and exact dependency/load manifest are approved; no V1 binary copy by assumption |
| edsdk4j/custom command | Establish artifact/source provenance and distribution terms before package inclusion |
| ONNX Runtime/weights | Runtime and each exact YuNet/BiSeNet weight/source need separate hash/provenance/license disposition; unused SCRFD is excluded |
| DNP | Installed supported Windows driver/queue is a prerequisite unless a separately approved redistributable driver package exists |
| FFmpeg | Pin binary/source provenance and satisfy the exact build's license/notice obligations; separate process alone is not legal clearance |
| Identity/paths | New package/product/upgrade codes, executable, mutex, AppUserModelID, shortcuts, update channel and all writable roots |
| Smoke checks | Runtime/contract, approved native resources, exact printer enumeration, model hashes, roots/ACLs, secret configured flags, clean shutdown—never surprise-print |

Updates are signed and staged. They run only from an idle/safe state, ship all
processes/contracts/resources together, verify compatibility and back up V2
config/state first. There is no independent JVM hot patch and no V1 migration.
The last known-good signed installer is retained; rollback must be rehearsed and
must not delete captures/ledger or point to V1. Installer size, installed size,
startup, WebView2 policy, update interruption, repair, uninstall, data retention,
and rollback are measured on clean Windows machines. Detailed criteria live in
`TAURI_FEASIBILITY.md` and `MILESTONE_PLAN.md`.

## 14. Exit decision

This architecture authorizes only contract work, simulator/mock UI work, and the
minimal feasibility POCs. **It does not authorize full real-backend integration.**
Current architecture verdict: **NO-GO for full integration; GO for the bounded
Phase 2 POCs and contract/design work.**
That gate opens only when evidence shows:

1. packaged sidecar lifecycle and IPC are reliable on Windows;
2. an x64 JVM loads the approved Canon native runtime and an actual supported
   camera completes session, Live View, capture/transfer, reconnect, and cleanup;
3. the installed DNP queue is enumerated exactly and the spooler bridge is proven,
   including an explicitly authorized physical test before claiming DNP output;
4. licensing and separate V2 installation/storage constraints are satisfiable.

If a criterion fails, the owner records the failure and recommended adapter or
Electron alternative. No mock-based hardware promise is acceptable.
