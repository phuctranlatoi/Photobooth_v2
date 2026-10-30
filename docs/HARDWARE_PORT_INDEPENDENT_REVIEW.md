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
