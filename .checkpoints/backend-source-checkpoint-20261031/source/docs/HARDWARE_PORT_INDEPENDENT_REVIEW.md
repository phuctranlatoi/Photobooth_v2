# Hardware port independent review

**Date:** 2026-10-30  
**Verdict:** **PARTIAL / BLOCKED for hardware parity.** Offline compilation and denial/fake-boundary tests pass. No Canon/webcam/printer discovery, native loading, capture, spooler submission, cut, or physical output was authorized or performed.

## Independent execution

From V2 `backend/`, with all cache/temp/output V2-local:

```powershell
$env:TEMP="$PWD/.tmp"; $env:TMP=$env:TEMP
$env:GRADLE_USER_HOME="$PWD/.gradle-user-home"
$env:JAVA_TOOL_OPTIONS="-Djava.io.tmpdir=$PWD/.tmp -Duser.home=$PWD/.toolchain-home"
& ./.toolchain/gradle-8.14.3/bin/gradle.bat --no-daemon --project-cache-dir .gradle-project test --rerun-tasks *> independent-hardware-port-test.log
$code=$LASTEXITCODE; Get-Content independent-hardware-port-test.log -Tail 25; exit $code
```

Exit **0**, `BUILD SUCCESSFUL in 53s`. The current seven suites contain **22 tests, 0 failures/errors** per the synchronized handoff/XML. Independent log: `backend/independent-hardware-port-test.log`. No `installDist` was run and no hardware path was enabled.

## Findings

### HIGH — Canon port is a partial reflective skeleton, not V1 parity

`LegacyCameraPort.kt:53-78` provides only construction, `openSession`, begin/download Live View and close. V1 `NativeEosCaptureService.kt:29-79,114-173,189-234` also has reconnect/disconnect monitoring, Live View retries/end, SafeShootCommand transfer, failed-shoot recovery, effects and capture persistence. V2 has no shutter/capture/transfer method, reconnect owner, deadline containment, endLiveView, USB-unplug recovery, dispatcher/message-loop proof, or disposal test. **BLOCKED** pending legal SDK/native setup and separately authorized real Canon testing.

The reflected names `CanonCamera()`, `openSession()`, `beginLiveView()`, `downloadLiveView()`, and `closeSession()` match exact methods used by V1 source. That only reduces signature suspicion; reflection was not resolved against an actual edsdk4j artifact and native compatibility remains unproved.

### HIGH — printer return is submission-only and physical/cut status is unknown

`LegacyPrinter.kt:53-70` truthfully distinguishes preparation rejection, `Submitted` after `PrinterJob.print` returns, and `Uncertain` after submission may have begun. It must not trigger automatic retry or revenue as physical success. No queue reconciliation exists. `LegacyPrintable.kt:75-93` matches V1 `DesktopIoServices.kt:60-85` stretch/rotate callback. Exact-name/ambiguity rejection is a deliberate safety improvement over V1 substring/default fallback.

There is no media, DPI, driver preset, RX1HS status or 2-inch cut configuration. No cut behavior may be inferred or invented. DNP parity remains **BLOCKED** until the staged protocol in `HARDWARE_VALIDATION.md` is separately authorized and completed.

### MEDIUM — defaults deny before native/printer operations

- `HardwareAuthorization(false)` is default and every Canon/webcam operation checks it before `Class.forName`/enumeration (`LegacyCameraPort.kt:13-15,55-60,83-86`).
- Hot Folder operations check authorization before listing (`107-115`), although constructor path metadata validation occurs first.
- Original retention checks authorization before reading/copying transfer (`LegacyOriginalStore.kt:12-24`).
- `LegacyPrinter` defaults to deny and returns before image decode/facade/printer discovery (`LegacyPrinter.kt:35-44`).
- Tests establish these narrow facts with absent native classes and injected fake printer facade. This is **PASS-AUTOMATED**, not hardware evidence.

### MEDIUM — webcam and Hot Folder are incomplete

Webcam only enumerates names; it lacks V1 default selection, best-size open, frames, capture, close and unplug behavior. Hot Folder only snapshots/new-JPG candidates; it has no stable-size/mtime/decode readiness, bounded wait, duplicate identity, late-file ordering or repeated-capture orchestration. No real or synthetic readiness regression exists.

### LOW — immutable original staging is safety adaptation

`LegacyOriginalStore` publishes via hard link and refuses replacement inside a validated V2 session directory. This is safer than V1's processed-only traced path, but compatibility and lifecycle integration require reviewer/architect signoff.

## Matrix

| Case | Status | Evidence |
|---|---|---|
| Offline backend rerun | PASS-AUTOMATED | Exit 0, 53s, 22 tests/0 failures-errors |
| Default Canon/webcam denial before reflection | PASS-AUTOMATED | Source + `LegacyCameraPortTest`; no class/native resolution |
| Default printer denial before image/facade | PASS-AUTOMATED | Source + fake-boundary test |
| Printable callback geometry | PASS-SIMULATED | BufferedImage/PageFormat test only |
| Canon capture/Live View/reconnect/unplug | BLOCKED | Partial code; no authorization/device/SDK |
| Webcam capture/unplug/repeat | NOT-RUN | Port incomplete |
| Hot Folder readiness/repeat | NOT-RUN | Port incomplete |
| DNP discovery/spool/cut/output | BLOCKED | No authorization/device; no cut implementation |
| CPU/GPU/memory/live-view impact | NOT-RUN | No Mini PC/hardware |
| Physical output comparison to V1 | NOT-RUN | No print |

V1 was inspected through read-only file tools only; no V1 command/build/write, secrets or photos. No hardware or production service was accessed.

## Appendix — isolated Hot Folder final review

Independent execution used the requested V2-local `backend/test-foundation.ps1`. The first direct PowerShell invocation exited **1 before Gradle execution was accepted by the shell** because `$ErrorActionPreference='Stop'` promoted Gradle's stderr `Picked up JAVA_TOOL_OPTIONS` line to `NativeCommandError`; log: `backend/independent-final-24-tests.log`. This is a runner/shell interaction, not a test failure. The same script was then launched through a fresh `powershell.exe` with output redirected by `cmd.exe`:

```powershell
cmd.exe /d /c "powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\test-foundation.ps1 > independent-final-24-tests-rerun.log 2>&1"
```

Exit **0**, `BUILD SUCCESSFUL in 9s`, six tasks up-to-date. Independent XML aggregation command reported **8 suites, 24 tests, 0 failures, 0 errors, 0 skipped**. This was an incremental test invocation, not `--rerun-tasks`; the immediately prior independent full rerun covered 22 tests, while the two new Hot Folder tests are accepted from current XML/up-to-date Gradle evidence. Logs remain V2-local.

Static review of `IsolatedHotFolder.kt` and its two tests establishes only the synthetic-fixture boundary:

- authorization is checked at `beginShot` before input enumeration (`38-44`) and on every polling iteration before filesystem reads (`59-64`);
- input/output must be pre-existing, non-symlink, disjoint directories under the real V2 root and carry synthetic fixture prefixes (`16-34`);
- timeout uses `System.nanoTime`, validates a 1–60,000 ms bound, supports cancellation/interruption, and closes the active shot (`55-95`);
- candidates require stable size/mtime over two observations, unchanged attributes during byte snapshot, JPEG SOI/EOI and successful ImageIO decode (`64-80`);
- publication is complete-byte, atomic no-overwrite via temp + hard link; source input is never deleted (`83-87`). Test cleanup deletes its own synthetic fixtures, not adapter input behavior;
- one active shot per adapter and baseline exclusion are tested; duplicate content/name tracking is in-memory only.

Important limitations: this is **not a real Hot Folder mode**. A late file arriving after the next shot starts is indistinguishable from that shot; duplicate state is not restart-persistent and same-content legitimate captures are suppressed; the 32 MiB compressed bound does not limit decoded pixel dimensions; stable metadata/EOI/decode are readiness heuristics; trusted local writers are assumed and symlink race resistance is incomplete. No production profile wiring, real producer, long-session, crash/restart, malicious filesystem or customer data test was run. Status remains **PASS-AUTOMATED synthetic fixture / NOT-RUN real mode**.
