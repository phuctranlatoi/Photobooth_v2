# Test Results — Initial Audit Review

**Date:** 2026-10-30  
**Test type:** Static source review only. No shell/build/run/network/hardware actions authorized or performed.

## 2026-10-30 independent backend foundation rerun

Authorization later permitted isolated V2 shell tests. From V2 `backend`:

```powershell
$ErrorActionPreference='Stop'
Get-FileHash '.toolchain\gradle-8.14.3-bin.zip' -Algorithm SHA256
& .\test-foundation.ps1
```

- Exit **0**; `BUILD SUCCESSFUL in 8s`; four tasks UP-TO-DATE.
- XML: `backend/build/test-results/test/TEST-com.lesouvenir.v2.foundation.FoundationTest.xml`: 5 tests, 0 failures, 0 errors, 0 skipped.
- **PASS-AUTOMATED** only for layout fields, geometry/copy characterization, unrestricted legacy state behavior, pricing, and simulator denied-by-default.
- Incremental rerun, not clean dependency resolution. No V1, hardware, business network, UI, or IPC execution.
- ZIP SHA-256: `BD71102213493060956EC229D946BEEE57158DBD89D0E62B91BCA0FA2C5F3531`. Trusted publisher checksum/signature comparison was not completed; provenance remains open. HTTPS origin plus a local hash is not independent integrity verification.
- Gradle warns of deprecated features incompatible with Gradle 9 and used a stopped single-use daemon despite `--no-daemon`.

## 2026-10-30 independent health-bridge milestone

See `BRIDGE_MILESTONE_REVIEW.md` for commands and security/lifecycle analysis.

| Case | Status | Independent evidence |
|---|---|---|
| Backend tests + installDist | PASS-AUTOMATED | V2-local Gradle exit 0, 8 total tests, build success in 9 s |
| Private frame/request validation | PASS-AUTOMATED | 3 backend bridge tests plus source review of 1 MiB bound, strict request JSON/UTF-8 and EOF behavior |
| Frontend component behavior | PASS-AUTOMATED | `npm run test` exit 0, 4 tests |
| Frontend production build | PASS-AUTOMATED | `npm run build` exit 0 |
| Rust/Tauri binary compilation | PASS-AUTOMATED | Explicit installed MSVC cargo `test --bins`/`build --bins` exit 0; no fresh per-test lines, so not counted as fresh Rust unit execution |
| Rust bridge → installed JVM | PASS-SIMULATED | Probe exit 0; JVM 21.0.12, simulator true, health-only, EOF cleanup |
| Native window opens/closes | NOT-RUN | Prior report is not independent evidence for this review |
| React WebView invoke → JVM | NOT-RUN | Component tests inject a fake; probe bypasses WebView/Tauri invoke |
| Window close with active JVM | NOT-RUN | Requires live invoke then child PID termination observation |
| Forced timeout/tree cleanup | NOT-RUN | Source has 10 s timeout/3 s graceful wait/taskkill fallback; fallback not exercised |
| Gradle ZIP publisher checksum | PASS-AUTOMATED | HTTPS publisher checksum equals local ZIP SHA-256 exactly |


| Case | Status | Exact evidence / command |
|---|---|---|
| V1 entry point and UI state mapping | PASS-AUTOMATED | Static read (not runtime automation): `Main.kt:33-48,125-289`. Command: none. Findings recorded in `QA_REPORT.md`. |
| State enum and transition enforcement | FAIL | `SessionStateMachine.kt:7-37` shows enum plus unrestricted assignment; audit claimed a guarded FSM/chain. Command: none. |
| Camera startup selection precedence | PASS-AUTOMATED | Static read: `DesktopBoothController.kt:63-68`; defaults `DesktopBoothConfig.kt:16-35`. Command: none. |
| Admin camera selection parity claim | FAIL | UI only toggles Hot Folder (`SettingsTabContent.kt:72-95`); save callback lacks Native/CLI (`Main.kt:278-280`, controller `999-1027`). |
| Cancel guard and menu placement | PASS-AUTOMATED | Guard `DesktopBoothController.kt:926-948`; menus `SelectPhotosScreen.kt:104-107`, `FrameScreen.kt:78-81`. No interaction test run. |
| Inactivity behavior audit claim | FAIL | Timeout auto-selects and auto-prints, not IDLE: controller `291-310`. |
| Payment authorization condition | FAIL | UI callback reaches unguarded `completePayment`: `Main.kt:168-179`; controller `388-397`. `PaymentService` not yet traced in this review. |
| Print/revenue condition trace | PASS-AUTOMATED | Static trace: controller `758-790,830-853`; printer `DesktopIoServices.kt:36-91`. This validates code shape only, not correctness or physical output. |
| Duplicate print/revenue prevention | NOT-RUN | Static inspection found no state/once guard at `startPrinting` (`717-720`); repository idempotency not reviewed here. Runtime test requires later V2 test harness. |
| Local server exposure review | FAIL | Binds `0.0.0.0`, unauthenticated download route: `LocalFileServer.kt:19-71`. |
| Canon camera | BLOCKED | No authorized device operation. No command. Unit/mock evidence cannot qualify as real hardware. |
| Webcam | NOT-RUN | No device operation or tests. |
| Hot Folder readiness/repeat capture | NOT-RUN | No runtime operation; no test command. |
| DNP RX1HS print and cut | BLOCKED | No authorization/safe hardware setup; no physical print. |
| PayOS/Neon/Cloudinary | BLOCKED | Production/network operations prohibited; no sandbox test run. |
| Beauty/LUT/frame pixel parity | NOT-RUN | Outside current focused audit; no fixtures executed. |
| Touchscreen 16:10/scaling/repeated taps | NOT-RUN | Static audit only; no V2 UI or display run. |
| CPU/GPU/memory/live-view impact | NOT-RUN | No Mini PC/runtime access. |
| Print output comparison with V1 | NOT-RUN | No output generated or physical media used. |

> `PASS-AUTOMATED` above means a deterministic tool-assisted static source read established the narrow fact stated. It does **not** mean a compiled test, runtime flow, simulation, or hardware test passed.

## 2026-10-30 Task3 independent disabled-port rerun

From V2 `backend`, ran Gradle `test --rerun-tasks` with V2-local temp/cache/project cache. Exit **0**, `BUILD SUCCESSFUL in 53s`; 22 tests, 0 failures/errors. Log: `backend/independent-hardware-port-test.log`.

- PASS-AUTOMATED: default denial before Canon/webcam reflection and before printer facade/image access; fake printer validation; printable BufferedImage geometry.
- PARTIAL: Canon reflected method names match exact V1 usages, but V2 lacks shutter/transfer/reconnect/end-live-view/disposal parity.
- BLOCKED/NOT-RUN: native Canon, webcam device, Hot Folder readiness, DNP spool/cut/physical output, Mini-PC performance and V1 physical comparison.
- Task1 narrow bridge and Task2 framed-JVM/mounted-WebView simulator passes are recorded in their independent reviews; neither is hardware evidence.

## 2026-10-30 isolated Hot Folder final check

Requested `backend/test-foundation.ps1`: initial direct invocation exit 1 because its Stop policy treated Gradle's `JAVA_TOOL_OPTIONS` stderr as `NativeCommandError`; no test failure inferred. Rerun through fresh PowerShell with redirected output exited **0**, `BUILD SUCCESSFUL in 9s`, tasks up-to-date. XML aggregation: **8 suites, 24 tests, 0 failures/errors/skips**. Logs: `backend/independent-final-24-tests.log` and `backend/independent-final-24-tests-rerun.log`.

`IsolatedHotFolderTest` adds two synthetic tests for authorization/path denial, partial-write stability/decode, deterministic candidate handling, duplicate suppression, baseline late-file exclusion, cancellation, timeout, no-overwrite and source retention. **PASS-AUTOMATED synthetic fixture only**; real Hot Folder producer, restart persistence and cross-shot late-file ownership remain NOT-RUN.
