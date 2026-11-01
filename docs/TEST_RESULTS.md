# Test Results — Independent Consolidated Review

## 2026-11-01 live desktop external-integrations acceptance

| Case | Status | Exact result / boundary |
|---|---|---|
| Live Tauri desktop acceptance | **PASS-SIMULATED** | `tests/verify-demo-and-real-journey.mjs`: **37 checks, 0 failures**, at 1280×800 and 1920×1200. Result ledger: `tests/journey-evidence/2026-11-01T13-13-52.592Z/results.json`. The classification remains simulated because capture and printing were camera-free/dry-run. |
| Firebase layouts | **PASS-SIMULATED** | Live Firestore source identified as `FIREBASE_LIVE`; 10 named layouts displayed; disk-cache path retained. This was a live read, not a production write. |
| PayOS VietQR | **PASS-SIMULATED** | Live link creation reached `READY`; QR image rendered at both viewports from a 132-character payload. Recorded data URL length was 2746 (the archived 1920×1200 result records 2738). No payment settlement was attempted. |
| DEMO capture | **PASS-SIMULATED** | Camera-free touch flow completed through delivery; dry-run 600-DPI preview and `revenueRecorded=false` verified. |
| Backend JUnit | **PASS-AUTOMATED** | **70 passed, 1 skipped**. A skip is not counted as a pass. |
| Frontend Vitest | **PASS-AUTOMATED** | **40 passed**, 0 reported failures. |

### Screenshot artifacts (20)

Evidence root: `tests/journey-evidence/2026-11-01T13-13-52.592Z/`.

**1280×800:**

1. `1280x800-start.png`
2. `1280x800-layout.png`
3. `1280x800-quantity-2.png`
4. `1280x800-demo-payment.png`
5. `1280x800-demo-live.png`
6. `1280x800-demo-select.png`
7. `1280x800-demo-frame.png`
8. `1280x800-demo-confirm.png`
9. `1280x800-demo-delivery.png`
10. `1280x800-real-payment.png`

**1920×1200:**

11. `1920x1200-start.png`
12. `1920x1200-layout.png`
13. `1920x1200-quantity-2.png`
14. `1920x1200-demo-payment.png`
15. `1920x1200-demo-live.png`
16. `1920x1200-demo-select.png`
17. `1920x1200-demo-frame.png`
18. `1920x1200-demo-confirm.png`
19. `1920x1200-demo-delivery.png`
20. `1920x1200-real-payment.png`

No screenshot or CDP assertion is physical Canon, DNP, mounted-touchscreen, or successful-payment evidence.

## 2026-11-01 final software verification

| Case | Status | Exact evidence / limitation |
|---|---|---|
| Backend tests | PASS-AUTOMATED | **17/17 suites, 60/60 tests passed**, including ZXing QR decode verification and the PayOS SDK fail-closed test. Backend count is the consolidated backend result supplied for this update; this frontend-only rerun did not invoke Gradle. |
| Frontend tests | PASS-AUTOMATED | From V2 `frontend`, `npm test -- --run` exited **0**: Vitest 4.0.9 reported **7/7 suites and 31/31 tests passed**, with zero failed tests (duration 6.09 s). |
| Frontend production build | PASS-AUTOMATED | From V2 `frontend`, `npm run build` exited **0**: `tsc --noEmit && vite build`; **2,014 modules transformed**, build completed in 3.73 s with zero errors. |
| Physical Canon DSLR | BLOCKED | Still gated pending explicit authorization and a safe physical Canon DSLR setup. Software/mock evidence is not real-hardware evidence. |
| Physical DNP printer | BLOCKED | Still gated pending explicit authorization and a safe physical DNP printer setup. No physical print was submitted. |

Resolved software findings in the consolidated result:

- ZXing QR output is now verified by decoding it in a test.
- `albumUrl` is wired into the compositor.
- The PayOS SDK adapter is aligned with V1 and covered by a fail-closed test.

**Software test status:** 60/60 backend tests and 31/31 frontend tests passed; frontend production build passed. **Hardware release status remains gated** until authorized physical Canon DSLR and DNP printer verification is completed.

## 2026-11-01 release-gate rerun (latest)

| Case | Status | Exact evidence / limitation |
|---|---|---|
| Frontend tests | PASS-AUTOMATED | `cd frontend; npm test -- --run` exit 0: **7/7 files, 31/31 tests**, Vitest 4.0.9, 5.49 s. |
| Frontend TypeScript/Vite build | PASS-AUTOMATED | `cd frontend; npm run build` exit 0: `tsc --noEmit && vite build`; **2,014 modules**, built in 4.39 s. |
| Backend retained results | PASS-AUTOMATED | PowerShell aggregation of `backend/build/test-results/test/*.xml`: **17/17 suites, 58/58 tests, 0 failures, 0 errors, 0 skipped**. This review inspected retained XML; it did not rerun Gradle. |
| Revenue ledger gate | PASS-SIMULATED | `RealSessionEngine.kt:325-343` calls `ledger.recordSale` only after `outcome.result is PrintResult.Submitted`; failures return `-32002`, and existing-sale reconciliation prevents duplicate submission. `Submitted` is driver handoff, not physical completion. |
| Real-mode fake fallback | PASS-SIMULATED | `RealSessionEngine.kt:224-259,280-293,325-345` has no synthetic fallback; missing camera/printer is `-32000`, capture failure enters `RECOVERY`, and spool/render failures are `-32002`. Fixture tests are not Canon/DNP evidence. |
| PayOS create/status | FAIL | Requests and polling exist (`PayOsClient.kt:12-27`, `RealSessionEngine.kt:179-188,209-217`), but tests prove only deterministic 64-character HMAC and fixture HTTP. They do **not** compare against an official PayOS signature vector/SDK or sandbox; validity remains unverified. |
| 600-DPI composition | PASS-SIMULATED | Tests verify 5×15 2-up **2452×3658**, duplicate placement, and landscape **3658×2452** (`ImagingParityTest.kt:48-76`). |
| Embedded ZXing QR correctness | FAIL | Production compositor contains ZXing rendering, but tests do not decode the rendered QR. More critically, real flow passes `albumUrl` at `RealSessionEngine.kt:320`, while no reviewed path assigns it, so real output is currently composed without an album QR. |
| V1 strict isolation | BLOCKED | Read-only `git status --short` in V1 showed pre-existing/unattributed changes: modified `.opencode/agents/architect.md`, `.opencode/agents/ui-designer.md`, plus two `.bak` files. Reviewer made no V1 write, but “completely untouched” cannot be established without a clean/baseline manifest. |

**Gate: BLOCK / NOT RELEASE READY.** Automated suites/build are green, but PayOS compatibility, real QR delivery, physical Canon/DNP/touch validation, installer/recovery, and licensing remain unresolved.

**Latest review:** 2026-10-31  
**Latest-review execution:** scoped V2-only offline baseline was authorized and run. Evidence is under `tests/full-baseline-migration/evidence/`. No hardware/provider/V1 operation occurred.

## Current regression matrix

| Case | Status | Exact evidence / limitation |
|---|---|---|
| Current backend suite | FAIL | Fresh offline rerun: 42 tests, 1 failure, exit 1. Timeout test remained `SELECTING_PHOTOS`, expected `DELIVERY`; see `22-backend-test-fresh-offline.log` and JUnit XML. The requested wrapper separately exited 1 due to Stop-policy handling of Gradle stderr. |
| Current frontend suite | PASS-AUTOMATED | `npm test -- --run`, offline/cache/temp V2-only, exit 0. Normalized Vitest output reports 6/6 files and 20/20 tests passed, duration 7.26 s (`tests/full-baseline-migration/evidence/10-frontend-test-normalized.txt:24-27`). |
| Current frontend build | PASS-AUTOMATED | `npm run build`, exit 0; 1,996 modules, built in 3.84 s. |
| Installed JVM smoke | NOT-RUN | Proposed command (V2 `backend`): `& .\smoke-installed.ps1`, only after V2 `installDist`. Simulator enabled at script line 6; script makes framed stdio calls and no external HTTP call. |
| Settings save/reload/validation | PASS-SIMULATED | Test source: `OperatorSettingsTest.kt:43-80`; frontend behavior: `V1Settings.test.tsx:10-14`. Historical aggregate result is recorded below; installed-user path remains untested. |
| Navigation, cancellation, repeated taps | PASS-SIMULATED | `SimulatorSessionTest.kt:33-116`, `Simulator.test.tsx:9-24`, `Operator.test.tsx:5-7`. Synthetic engine/jsdom only. |
| Revenue and integration fail-closed behavior | PASS-SIMULATED | `IntegrationContractTest.kt:10-123`, `RevenueRecognitionTest.kt:11-58`; local fixture server only, no live PayOS/Neon/Cloudinary. |
| Canon/DNP/touchscreen/performance | BLOCKED | Requires separately authorized safe hardware setup. Unit/mock results cannot upgrade this status. |

For test-by-test migration interpretation and next commands, see `docs/MIGRATION_TEST_RESULTS.md`.

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
