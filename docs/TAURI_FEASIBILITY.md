# Tauri 2 + Kotlin/JVM Sidecar Feasibility on Windows

**Status:** Gate specification; Tauri remains a candidate, not a final shell  
**Date:** 2026-11-12  
**Scope:** Packaged Windows x64 proof only

## 1. Decision to be made

Use Tauri 2 only if a packaged, installed V2 POC can supervise the Kotlin/JVM
authority, load the approved Canon native runtime, enumerate the installed
Windows printer path, move Live View without starving commands, and recover from
a backend failure. Passing a dev-server health call is useful but insufficient.

This plan starts with Tauri because it keeps the renderer small and leaves stable
Kotlin hardware/business behavior in one backend. It does not assume that Rust
should replace Kotlin hardware adapters. Electron is the prepared shell fallback
if Tauri's process, binary transport, or packaging model is the demonstrated
cause of failure.

## 2. Evidence labels

Every result must carry exactly one evidence class:

| Label | What it establishes |
|---|---|
| **PROPOSED** | Interface or procedure exists only in documentation |
| **COMPILED_POC** | Source compiled and ran in a stated development environment |
| **SIMULATED_TEST** | Fake camera/printer/payment behavior exercised; no hardware claim |
| **PACKAGED_WINDOWS_TEST** | Installed release artifact exercised on Windows; device may be absent |
| **ACTUAL_DEVICE_TEST** | Named physical device and installed driver/SDK exercised under approval |

No mocked frame, virtual/PDF queue, DLL-existence check, or simulator result is
an actual Canon or DNP test.

## 3. Minimal runnable POC request

Create one deliberately small V2 POC—no production UI and no business feature
port—with these artifacts:

```text
poc/tauri-sidecar-feasibility/
├── frontend/                 # one diagnostics page and latest-frame viewer
├── src-tauri/                # sidecar supervisor + fixed allowlist
├── backend/                  # tiny JVM app packaged with runtime image
├── fixtures/                 # generated JPEG frames only
└── scripts/                  # build, install, smoke, uninstall, evidence capture
```

Required backend methods/events:

```text
system.hello
health.get
diagnostic.echo
diagnostic.cpuArchitecture
diagnostic.nativeLoad
printer.list
liveView.testSubscribe          # generated JPEG source for transport only
liveView.testUnsubscribe
diagnostic.crash
system.shutdown
connection.lost / connection.recovered (shell-originated)
```

The POC must build a signed-or-test-signed x64 MSI, install it into a clean V2
identity, run without a machine Java installation, and produce a machine-readable
result bundle. It must not submit a print, trigger a shutter, call production
services, read V1 configuration, or open a listening TCP/HTTP port.

POC modes are explicit:

- `Simulator`: generated frames, fake durable side-effect boundary, printer
  enumeration only;
- `CanonDevice`: opt-in actual camera session/Live View/capture, authorization ID
  required;
- `DnpPhysical`: opt-in one controlled spool submission, authorization ID and
  media plan required.

No mode automatically falls through to another. A missing device yields
`BLOCKED`/`FAIL`, never generated success.

Implementation request ownership: Desktop/Shell Engineer owns the host and Job
Object; Backend/Release Engineer owns the tiny JVM launcher/runtime image; Camera
Engineer owns only the native-load/device opt-in module; Printer Engineer owns
enumeration/physical opt-in; QA owns the runner and evidence verdict. These owners
must not edit the same files concurrently.

Suggested safe execution interface (to be implemented later, not by this design
task):

```powershell
# Run only from V2 and only after implementation/execution approval.
.\poc\tauri-sidecar-feasibility\scripts\build-package.ps1 -Configuration Release
.\poc\tauri-sidecar-feasibility\scripts\run-smoke.ps1 `
  -Installer <path-to-msi> `
  -Mode Simulator `
  -EvidenceRoot <v2-evidence-directory>
```

Camera and real printer procedures are separate opt-in switches and require the
operator to name the approved device. A default invocation is simulator and
read-only printer enumeration.

## 4. Test matrix and order

Run tests in order. Do not spend hardware time before lifecycle and packaging are
stable.

### TF-01 — Toolchain and x64 closure

**Steps**

1. Pin Tauri/Rust, WebView2 bootstrap policy, Kotlin/JDK, Gradle, Node, and npm
   lockfile versions.
2. Produce `x86_64-pc-windows-msvc` shell and an x64 JVM runtime image.
3. Record PE architecture for shell/launcher/native libraries and JVM
   `os.arch`, data model, vendor and version.
4. Fail startup before SDK initialization if any architecture is not x64.

**Pass:** all executable and native components are x64; version/hash manifest is
complete; no accidental x86 artifact.  
**Fail:** architecture ambiguity, `BadImageFormat`/`UnsatisfiedLinkError`, or an
untracked native binary.

### TF-02 — Bundled JVM, no ambient Java

**Steps**

1. Build a minimized runtime image with required modules and package it as a
   Tauri external binary/resource layout.
2. On a clean Windows x64 VM with no Java in `PATH` and no `JAVA_HOME`, install
   the MSI and launch from Start Menu.
3. Confirm the native backend launcher uses only the bundled runtime and works
   from a path containing spaces and non-ASCII characters.
4. Run as a standard kiosk user, not an administrator.

**Pass:** compatible hello/health is reached in <=8 seconds for at least 30 cold
runs; p95 is reported; 30/30 launches succeed without ambient Java.  
**Fail:** reliance on `.bat`, current working directory, registry Java, admin
rights, shell quoting, or machine-global environment mutation.

### TF-02A — Backend startup deadline and diagnostics

Inject invalid writable roots, incompatible contract version, corrupt local
journal, missing model, missing native runtime and occupied V2 mutex. Startup must
either reach a truthful `READY`/`DEGRADED` state or return a structured,
redacted failure before the shell deadline; the shell remains responsive and
offers diagnostics/exit rather than an indefinite splash screen.

**Pass:** every injected condition has deterministic status/error, no credential
or raw private path leaks to renderer logs, and no partial second authority stays
running.  
**Fail:** hang, mock-ready status, retry storm, unredacted secret/path, or partial
sidecar left alive.

### TF-03 — Sidecar ownership, stop and orphan prevention

**Steps**

1. Exercise normal close, `system.shutdown`, logout, shell termination, backend
   hang, backend child process (fixture), and installer/uninstaller interaction.
2. Assign the backend and its children to a kill-on-close Windows Job Object.
3. Verify graceful close of protocol, camera fixture, files and executors, then
   force the process tree after a five-second deadline.
4. Repeat 100 launch/close cycles and inspect process handles/PIDs.

**Pass:** 100/100 normal cycles leave no backend/fixture child; forced shell
termination also leaves no owned process after the bounded cleanup mechanism;
shutdown p95 and forced-cleanup counts are recorded.  
**Fail:** orphan JVM/FFmpeg process, indefinite exit, duplicate sidecar, or reused
V1 process/mutex identity.

### TF-04 — Framed control IPC correctness

**Steps**

1. Use 4-byte big-endian length-prefixed UTF-8 JSON-RPC, never line-delimited
   JSON; reserve stdout for protocol and stderr for diagnostics.
2. Test fragmented writes, coalesced frames, Unicode, 1 MiB boundary, oversized
   frame rejection, malformed JSON, unknown method, slow consumer, and 1,000
   concurrent request IDs.
3. Confirm one serialized writer prevents event/response byte interleaving.
4. Attempt renderer calls outside the shell allowlist.

**Pass:** zero framing desynchronization/deadlock across 100,000 echo calls and
fault cases; invalid calls fail safely; memory remains bounded.  
**Fail:** a malformed/large frame crashes the shell/backend, response IDs mix, or
renderer can invoke arbitrary methods/processes.

### TF-05 — IPC latency and command priority

Measure on the target kiosk class, release package, after warm-up:

- 10,000 sequential `diagnostic.echo` round trips;
- 1,000 calls while generated Live View runs at 1280x720;
- health and unsubscribe latency while the backend simulates blocking I/O on its
  bounded worker;
- CPU, working set, handles and dropped-frame counters.

**Pass:** control p50 <=10 ms, p95 <=25 ms and p99 <=50 ms; no control call
exceeds 250 ms because of frame transport; no upward memory trend over 30
minutes. These are local bridge targets, not camera shutter-latency targets.  
**Fail:** control starvation, unbounded queue/memory, or frequent >250 ms stalls.

### TF-06 — Live View binary transport and backpressure

**Steps**

1. Send generated JPEG bytes (quality 75–85, max 1280x720) over a private,
   per-launch Windows named pipe; do not base64 frames in control JSON.
2. Shell stores one latest complete frame. Renderer allows at most one pending
   pull and revokes the prior object URL.
3. Slow/stop the renderer, background the window, navigate away, unsubscribe,
   kill/restart backend, then resubscribe with a new stream ID.
4. Corrupt/truncate a frame and verify reconnect without accepting stale bytes.

**Pass:** sustained >=20 delivered fps preferred (>=15 fps is conditional product
acceptance) for 30 minutes; capture/control simulation remains responsive;
resident memory plateaus; stale generation frames never display; unsubscribe
stops acquisition/encoding within one second.  
**Fail:** accumulating frames, base64 in JSON, stale frames after reconnect,
unbounded object URLs, or command starvation.

If JPEG fails only on measured CPU/latency, conduct one targeted shared-buffer
spike with explicit ownership sequence numbers and ACLs. Do not add shared memory
without this evidence.

### TF-07 — Native Canon DLL lookup and 64-bit initialization

**Precondition:** Canon runtime use/redistribution is legally authorized for the
test arrangement. Do not copy DLLs from V1 merely to make the test pass.

Passing TF-07 proves the camera/backend packaging route. It selects against Tauri
only if a byte-identical standalone packaged JVM passes while Tauri supervision
fails; Canon feasibility remains mandatory under Electron too.

**Steps**

1. Resolve an explicit approved x64 directory before loading edsdk4j/JNA; record
   only redacted path class and SHA-256/version metadata.
2. Set child-only DLL search/JNA properties. Do not mutate machine `PATH`, copy
   into System32, or search arbitrary current directories.
3. Test missing DLL, wrong architecture, missing dependent DLL, duplicate DLL,
   installed path with spaces, and package upgrade.
4. In the approved device test, initialize/terminate EDSDK repeatedly, discover
   the actual camera, open/close sessions, run Live View, perform an authorized
   capture/host transfer using the V1-observed `SafeShootCommand` semantics, and
   test unplug/reconnect and shutdown during Live View. Record model/firmware,
   transfer type/count and whether dual-file camera settings are handled.
5. When testing coexistence/resource contention, confirm Canon/EOS Utility/V1
   ownership is reported as external busy; V2 must not terminate or take over the
   other process.

**Packaged pass:** approved native runtime loads from the installed layout under
the bundled x64 JVM for 30/30 initialization/termination cycles; failures are
structured and do not crash the shell.  
**Actual-device pass:** named supported camera passes discovery, 30-minute Live
View, at least 20 authorized captures/transfers, unplug/reconnect, and clean
disposal with no orphan/native crash. Exact counts may be raised by QA.  
**Fail:** existence-only proof, dependence on V1/EOS Utility/current directory by
accident, bitness mismatch, nondeterministic load order, or native crash.

Canon failure by itself does not prove Tauri failure. Repeat the same packaged
backend launcher outside Tauri. If both fail identically, fix/switch the Canon
adapter or runtime arrangement rather than changing shells.

### TF-08 — Installed Windows printer/spooler path

Passing TF-08 proves the intended backend/spooler adapter. It is also a shell
selection criterion only insofar as the same packaged standalone JVM succeeds
while the Tauri-supervised arrangement fails. A generally feasible DNP path is a
full-integration gate regardless of which shell owns the child process.

**Steps (safe/read-only first)**

1. Enumerate installed queues through the same x64 bundled JVM and Java Print
   Service path intended for production.
2. Record exact queue names, driver name/version, port, default media, supported
   categories/values and availability without silently selecting the default.
3. Configure an exact queue ID/name and prove mismatch is a visible failure.
4. Validate printer-ready fixture dimensions without calling `print()`.
5. Compare exact media/orientation/imageable-area and supported attributes with
   the V1-observed borderless/full-page request and 5x15 two-up versus full-size
   payloads; do not infer cutter support from a queue name.

**Enumeration pass:** packaged app consistently discovers the exact installed
DNP candidate and capabilities under the kiosk account; absent/offline queue is
reported distinctly; no job is submitted.  
**Physical-path pass (separate approval):** one controlled DNP job is submitted,
job identity/status is observed as far as the driver permits, expected 10x15 and
5x15 two-up/cut behavior is physically verified, and unplug/paper/ribbon/error
cases are documented where safely possible.  
**Fail:** substring match with fallback to default, inability to bind the queue,
incorrect geometry/cut, or claiming physical completion from `PrinterJob.print()`
return alone.

As with Canon, compare standalone packaged JVM behavior before attributing a
spooler failure to Tauri.

### TF-09 — Crash detection, restart and operation safety

**Steps**

1. Crash the backend before handshake, while idle, during generated stream, after
   a durable fake operation is `PENDING`, and after its fake external boundary
   but before result persistence.
2. Detect process exit/EOF immediately and heartbeat loss within the documented
   bound; emit `connection.lost`, clear stream, and reject mutations.
3. Restart at most three times (1s/2s/5s), renegotiate protocol, fetch the
   authoritative snapshot, and emit `connection.recovered`.
4. Verify no mutating request is automatically replayed. A fake print boundary
   interrupted after submission must become `OUTCOME_UNKNOWN`.

**Pass:** all crash points are detected, UI never presents stale connected state,
restart is bounded, no duplicate fake side effect occurs, and restart storms
terminate in actionable out-of-service diagnostics.  
**Fail:** silent hang, infinite restart, replayed mutation, duplicate operation,
or recovery into an invented state.

### TF-10 — Installer, identity and path isolation

**Steps**

1. On a disposable machine or image with a separately installed V1 release where
   coexistence testing is authorized, install V2 concurrently. Do not run V1 from
   the legacy source workspace and do not mutate V1 source/Git/runtime data. An
   authorized operator may exercise installed-app resource contention later as a
   separate hardware scenario.
2. Verify unique product/upgrade code, executable, AppUserModelID, shortcut,
   mutex, logs, config, secrets, temp, webview, Hot Folder, captures, outputs,
   assets, caches, state/ledger and update channel.
3. Run standard-user first launch, repair, same-version reinstall, upgrade,
   rollback and uninstall. Verify intended data preservation/purge policy.
4. Inspect package manifest for unexpected credentials, customer media, build
   caches, V1 artifacts or unapproved DLL/model files.

**Pass:** zero implicit writable-path overlap; V1 files/timestamps are unchanged;
upgrade and rollback preserve compatible V2 state; uninstall leaves no process or
auto-start entry; package contents match the approved manifest.  
**Fail:** identity collision, V1 path lookup, secret in package/frontend, writable
install resources, or destructive rollback.

### TF-11 — Size, resources and WebView2

Record—not estimate—the following for the MSI and installed application:

- installer and installed byte size by shell, WebView policy, JVM runtime,
  backend dependencies, models, approved native SDK, FFmpeg and symbols;
- cold/warm startup p50/p95, idle and streaming working set/CPU;
- behavior with WebView2 present and absent according to the selected bootstrap
  policy; offline install behavior.

**Initial acceptance budget:** compressed installer <=500 MiB, installed footprint
<=1 GiB, readiness p95 <=8 seconds, idle combined working set <=350 MiB, and
30-minute generated stream without sustained CPU saturation on the target kiosk.
These are gate budgets, not marketing promises; product/release may tighten them.

**Fail:** missing size attribution, network-only first launch, target-class CPU
saturation, or a package too large for the agreed deployment channel.

### TF-12 — Kiosk/security smoke

Verify fullscreen 16:10 operation, single V2 instance, blocked remote navigation,
production CSP, disabled devtools, fixed invoke allowlist, named-pipe ACL/nonce,
frame/message limits, redacted logs and renderer inability to read credentials or
arbitrary files.

**Pass:** all controls remain effective in the installed release build.  
**Fail:** renderer process spawn, arbitrary path access, secret exposure, remote
navigation, or public sidecar listener.

## 5. Consolidated Tauri pass/fail gate

Tauri is selected only if:

1. TF-01, TF-02/02A, TF-03 through TF-06, and TF-09 through TF-12 pass as
   packaged Windows tests;
2. TF-07 packaged native loading and actual Canon device criteria pass;
3. TF-08 exact DNP enumeration/spooler route is feasible and the authorized
   physical validation plan has passed before production claims;
4. redistribution/license dispositions allow the selected package;
5. no unresolved P0/P1 correctness or security defect remains;
6. Tester-Reviewer independently signs the evidence matrix.

The full frontend–real-backend integration gate remains **closed** until Canon and
spooler feasibility are proven. Simulator UI work may continue without implying
that gate passed.

## 6. Failure attribution and bounded remediation

For each failure record:

- failing test ID and exact package hash;
- evidence class and target-machine profile;
- whether the standalone packaged JVM reproduces it;
- shell-specific mechanism, backend/adapter mechanism, driver/hardware issue, or
  unresolved attribution;
- one bounded remediation and rerun result;
- recommended alternative and its cost.

Allow one focused remediation cycle (normally no more than five engineering days)
for a shell-specific issue. Do not keep redesigning the product around Tauri if a
mandatory criterion remains nondeterministic.

## 7. Electron fallback plan

Electron fallback preserves React, canonical schemas, Kotlin authority, runtime
image, hardware adapters, data roots and operation journal. Replace only the host:

```text
Tauri Rust host                    Electron equivalent
-------------------------------   -------------------------------------------
Tauri command allowlist           context-isolated preload API allowlist
Rust child supervisor             main-process child_process.spawn supervisor
Windows Job Object wrapper        native Job Object helper / launcher
Tauri event delivery              MessagePort / ipcMain-to-preload messages
private named-pipe frame reader   Node named-pipe reader + transferable ArrayBuffer
scoped media protocol             custom protocol with strict MediaRef validation
Tauri MSI/updater                 electron-builder/forge + signed staged updater
```

Security requirements:

- `nodeIntegration: false`, `contextIsolation: true`, sandbox where compatible;
- no generic `ipcRenderer` exposure; preload exports named typed methods only;
- remote module disabled, navigation/window creation denied, production CSP;
- renderer receives no process environment, path API, credentials or raw
  arbitrary filesystem access.

Fallback execution:

1. Freeze canonical contract and Tauri evidence; create an ADR stating the failed
   criterion and why it is shell-specific.
2. Implement the smallest Electron host against the same POC backend—do not port
   business/hardware code to Node.
3. Rerun TF-01 through TF-12 with equivalent criteria and report Electron's
   installer/RAM/startup deltas.
4. Select Electron only after it passes the failed criterion and all other
   mandatory gates. A larger package is acceptable only as a documented tradeoff
   for demonstrated reliability.

If Electron also fails the standalone JVM's Canon or printer test, switching
shells is not a remedy. Escalate the backend/driver blocker and evaluate a
vendor-supported native helper or approved alternative capture/print adapter.

## 8. Ownership and required evidence

| Work | Accountable owner | Supporting owners | Evidence |
|---|---|---|---|
| Tauri lifecycle/control bridge | Desktop/Shell Engineer | Backend Lead | Packaged runs, PID/process-tree logs |
| Runtime image/backend launcher | Backend/Release Engineer | Shell Engineer | Module/runtime manifest, no-Java VM runs |
| Live View transport | Shell + Camera Engineers | Frontend Lead, Performance QA | fps/latency/drop/CPU/memory report |
| Canon native/device test | Camera Engineer | Operator, QA Hardware, Legal | DLL manifest and named-device lab report |
| Printer enumeration/physical path | Printer Engineer | Operator, QA Hardware | queue/driver report and authorized output evidence |
| Installer/update/rollback | Release Engineer | Security, QA Installer | MSI hashes, clean-VM and rollback matrix |
| Independent gate verdict | Tester-Reviewer | Architect | Signed criterion table with gaps |
| Shell selection | Solutions Architect | Leads, Release, Product | ADR based on evidence, not preference |

## 9. Evidence bundle manifest

Each run should produce under a V2-only evidence root:

```text
run.json                    # date, evidence class, machine profile, operator
artifacts.json              # hashes, versions, architecture and license IDs
criteria.json               # each TF check: PASS/FAIL/BLOCKED/NOT_RUN
latency.csv                 # p50/p95/p99 and raw sample reference
resources.csv               # CPU/RSS/handles/fps/drop counters over time
process-tree-before.txt
process-tree-after.txt
installer.log
application-redacted.log
screenshots/                # only when useful; no secrets/customer media
hardware.json               # device/driver identity only for actual tests
verdict.md                  # limitations and recommended next action
```

`BLOCKED` is not `PASS`. Missing physical hardware or legal authorization must be
reported as such, with no promise inferred from simulator or source evidence.
