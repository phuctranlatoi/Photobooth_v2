# Desktop bridge independent review

**Date:** 2026-10-30  
**Scope owned:** `tests/desktop-bridge/` and this document only. No app, frontend, Rust host, or backend files were edited.

## Release-gate result — superseded by independent CDP rerun

**PASS-SIMULATED (narrow Task 1 verdict):** one actual mounted React DOM → Tauri command → installed Kotlin/JVM health roundtrip, process ancestry, native window close, host exit, and returned JVM PID termination were independently reproduced. This is not a Rust-probe substitution and does not prove packaging, forced-kill cleanup, hardware, or Task 2 simulator behavior.

The earlier UI Automation result below remains a valid accessibility/automation failure, but it no longer blocks the narrow bridge proof because the opt-in CDP harness exercised the real mounted WebView DOM.

## Independent CDP rerun (2026-10-30)

Precondition check from V2 root found the existing Vite server on loopback: `Invoke-WebRequest http://127.0.0.1:1420` returned **200**. No build, Gradle, or install mutation was performed because backend simulator work was concurrent.

Exact command, from `frontend/`:

```powershell
$before=(Get-NetTCPConnection -LocalPort 9223 -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count
node .\verify-webview.mjs *>&1 |
  Tee-Object '..\tests\desktop-bridge\results\independent-cdp-health-close.log'
$code=$LASTEXITCODE
Start-Sleep -Milliseconds 500
$after=(Get-NetTCPConnection -LocalPort 9223 -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count
exit $code
```

Exit **0**. Independently observed:

- CDP listener count was **0 before** and **0 after** the harness.
- Real host PID **24068** and mounted page at `http://127.0.0.1:1420/`.
- Harness clicked the rendered `Check JVM bridge` DOM button twice synchronously; React's latch yielded one successful health state.
- Rendered status: `JVM responded · simulator confirmed`; rendered backend PID **17520**, JVM **21.0.12**, protocol v1, uptime 639 ms.
- Windows CIM: PID 17520 was `java.exe`, parent `cmd.exe` PID **34580**, whose parent was host PID 24068.
- Native `CloseMainWindow()` returned **True**, host exited **0**, and JVM PID 17520 was absent after close.
- Full output: `tests/desktop-bridge/results/independent-cdp-health-close.log`.

Review of `frontend/verify-webview.mjs:8-10` confirms CDP is enabled only in the spawned test process environment and explicitly requests address `127.0.0.1`. `src-tauri/tauri.conf.json` does not enable remote debugging. The listener was removed with process exit. Caveat: fixed port 9223 can collide with another local process; the independent pre/post checks reduce but do not eliminate race risk. CDP grants powerful local page control while the test is running and must never be enabled in production.

The current UI already rendered simulator sample content during this Task 1 run, and `src-tauri/src/main.rs:18,22-34` plus `bridge.rs:41-55` now contain simulator forwarding. Therefore the executable/source capability is no longer strictly “health only,” despite the diagnostic copy saying so. This rerun validates only health and lifecycle; it makes **no Task 2 claim**.

## Implemented independent test

`tests/desktop-bridge/webview-health-close.ps1`:

1. starts the real `src-tauri/target/debug/le-souvenir-v2.exe` with explicit Java 21;
2. obtains the native top-level window through its real HWND/UI Automation element;
3. requires the real React-rendered **Check JVM bridge** button from the WebView2 accessibility tree;
4. invokes it using `InvokePattern` (no injected frontend client and no Rust probe);
5. requires rendered success text and reads the rendered backend PID;
6. verifies that PID exists;
7. closes the native window through `WindowPattern.Close()`;
8. requires host exit and JVM PID disappearance.

The script has fail-safe cleanup for host/JVM processes. It performs no hardware, print, payment, database, cloud, deployment, or production network action.

## Exact execution and evidence

Working directory for all commands:

`E:\HK1_2026_2027\PhotoboothDesktop_v2`

Final command:

```powershell
& '.\tests\desktop-bridge\webview-health-close.ps1' *>&1 |
  Tee-Object '.\tests\desktop-bridge\results\webview-health-close-pass-attempt.log'
exit $LASTEXITCODE
```

Result: exit **1** after 30 seconds:

```text
Timed out waiting for the React-rendered Check JVM bridge button in WebView2
```

This run did establish that the actual compiled Tauri process opened a real native window. It did **not** establish a WebView invocation, JVM launch, health response, or cleanup. Earlier diagnostic runs and their unedited output are retained under `tests/desktop-bridge/results/`:

- `webview-health-close.log`: first UIA lookup selected an unnamed host-owned element; exit 1.
- `webview-health-close-rerun.log`: title-based UIA lookup did not locate a top-level element; exit 1.
- `webview-health-close-final.log`: HWND lookup found the actual title, rendered by this PowerShell host as `LE SOUVENIR � V2 architecture proof`; test rejected the encoding representation; exit 1.
- `webview-health-close-pass-attempt.log`: tolerant title check passed, but WebView descendants did not expose the React button; exit 1.

No PASS is inferred from the native window appearing.

## Matrix

| Case | Status | Independent evidence |
|---|---|---|
| Real compiled Tauri native window opens | PASS-SIMULATED | Actual `le-souvenir-v2.exe`; HWND converted to UIA window and title observed. This is simulator architecture proof, not hardware. |
| React WebView control discoverable by Windows UIA | FAIL | Real WebView window opened, but exact button was absent from UIA descendants for 30 seconds. Reproduction/log above. This may be WebView2 accessibility/environment behavior, not necessarily a React defect. |
| React WebView → Tauri `health_check` → JVM | PASS-SIMULATED | Independent CDP run clicked actual mounted DOM and observed rendered success; no direct invoke/probe. |
| Health PID displayed, alive, and owned by host | PASS-SIMULATED | Rendered PID 17520 matched live `java.exe`; ancestry `java.exe` → `cmd.exe` 34580 → host 24068. |
| Native window close terminates host and returned JVM PID | PASS-SIMULATED | `CloseMainWindow=True`; host exit 0; PID 17520 terminated. |
| Rust probe → JVM | NOT-RUN | Already reported elsewhere; specifically insufficient for this task and not rerun as substitute evidence. |
| Forced timeout / `taskkill /T` fallback | NOT-RUN | Would require controlled fault injection; no app edits authorized. |

## Source review findings

### HIGH — abnormal lifecycle proof remains absent

- `src-tauri/src/main.rs:17-20` normal `RunEvent::Exit` cleanup has now been independently exercised after a WebView-created child.
- `src-tauri/src/bridge.rs:57-66` sends EOF, waits three seconds, then uses `taskkill /T /F`. Normal EOF cleanup passed; forced fallback and abrupt host termination remain untested.
- Mitigation/test: enable WebView2 accessibility in the approved test environment or use an approved, real WebDriver/WebView2 automation channel; run this test and retain the returned PID plus process-liveness timestamps. Separately exercise fallback with a controlled test backend that ignores EOF, without changing production algorithms.

### MEDIUM — automation/accessibility gap

The diagnostic button was not exposed through Windows UI Automation in this run. This blocks independent touch/keyboard accessibility automation and may indicate an environment/WebView2 accessibility configuration issue. It is not enough to assert the button is visible. Mitigation: inspect with Accessibility Insights on the target kiosk, record WebView2 runtime version, and ensure the button/status/PID are exposed before rerunning.

### MEDIUM — development-only runtime dependency

`src-tauri/src/bridge.rs:15-25` uses a workspace-relative Gradle distribution launcher and requires externally supplied `V2_JAVA_HOME`. This cannot prove packaged startup or clean-install recovery.

## Upcoming simulator coverage (contract-dependent)

Dynamic layouts, file readiness, composition, cancellation, and confirm idempotency need simulator tests once their architect-ratified IPC/state contracts exist. No method names, payloads, expected transitions, or filesystem semantics are invented here. Required future cases should include configured (not hardcoded) layout/countdown values, incomplete/still-growing files, deterministic composition fixtures, cancellation at each permitted state, repeated confirm/retry with one durable effect, and crash/restart recovery. Until contracts and implementations are present, these are **NOT-RUN**, not failures and not passes.

## Safety/isolation statement

Only V2 paths were read, executed, or written. No V1 shell/build/write occurred; no secrets or customer photos were read; no hardware, capture, physical print, PayOS, Neon, Cloudinary, production network, database, or deployment operation occurred.
