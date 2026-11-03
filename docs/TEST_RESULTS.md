# Test Results â€” Independent Consolidated Review

## 2026-11-03 09:25 full-stage liquid-glass payment regression

| Case | Status | Evidence / boundary |
|---|---|---|
| Frontend Vitest | **PASS-AUTOMATED** | **8/8 test files, 55/55 tests passed**. |
| Frontend production build | **PASS-AUTOMATED** | TypeScript/Vite build passed; **2,017 modules** transformed. |
| Backend offline tests | **PASS-AUTOMATED** | **80 passed / 2 skipped / 0 failed** (82 total). |
| Rust Cargo | **PASS-AUTOMATED (compile only)** | `%USERPROFILE%\.cargo\bin\cargo.exe test` exit 0; package compiled cleanly in 5.53s and no Rust test cases were reported. |
| Payment geometry | **PASS-SIMULATED (source/CSS only)** | Rigid 940×560px box was replaced by a full-stage 100% width/height responsive grid (`1.05fr : 1fr`), fluid 24–48px gap and 28–48px panel padding. Both panels stretch evenly. The porcelain QR card is square `clamp(290px, 37vh, 390px)` with transition/animation/transform disabled; instructions reserve 130px. Frost is `blur(28px) saturate(190%)` over a warm apricot/rose/champagne backdrop. No mounted viewport or QR scan was run. |
| V1 isolation | **BLOCKED (global proof)** | This reviewer ran no command in V1, made no V1 write, and read no V1 secret. Without a trusted before/after manifest, filesystem-wide untouched status cannot be certified. |

**Release gate: BLOCK.** Automated regression is green; physical viewport/touch/QR, hardware, packaging, provider and licensing gates remain open.

Commands: `frontend: npm test -- --run`; `frontend: npm run build`; `backend: .\.toolchain\gradle-8.14.3\bin\gradle.bat --offline test --console=plain`; `src-tauri: %USERPROFILE%\.cargo\bin\cargo.exe test`. Frontend: 8/8 files and 55/55 tests, build 2,017 modules. Backend XML: 28 suites, 82 total, 80 passed, 2 skipped, 0 failed/errors; build successful in 59s.

## 2026-11-03 00:40 payment QR-dimension regression rerun (latest)

| Case | Status | Evidence |
|---|---|---|
| Backend offline Gradle | **PASS-AUTOMATED** | `backend/.toolchain/gradle-8.14.3/bin/gradle.bat --offline test --console=plain` exit 0; `BUILD SUCCESSFUL in 26s`. JUnit XML aggregate: **28 suites, 82 total, 80 passed, 0 failures/errors, 2 skipped**. Gradle reported all seven actionable tasks up-to-date and warned about Gradle 9-incompatible deprecated features. |
| Frontend Vitest | **PASS-AUTOMATED** | `npm test -- --run` exit 0: **8/8 files, 55/55 tests**, 10.60s. |
| Frontend production build | **PASS-AUTOMATED** | `npm run build` exit 0; TypeScript and Vite passed, **2,017 modules**, CSS 121.26 kB and JS 392.17 kB. This is not installer or mounted-viewport evidence. |
| Rust | **PASS-AUTOMATED (compile only)** | `%USERPROFILE%/.cargo/bin/cargo.exe test` exit 0; one package compiled in 12.48s. Cargo reported no Rust test cases. |
| V1 isolation | **BLOCKED (global proof)** | This reviewer ran no command in V1, performed no V1 write, and read no V1 secret. The attempted V2 Git path query rejected the external V1 path and supplied no integrity evidence. Without a trusted pre-task V1 manifest, **100% untouched cannot be certified**. |
| Physical/release acceptance | **BLOCKED / NOT-RUN** | No fresh mounted 16:10/scaling/touch run, Canon capture, DNP print, Mini-PC metrics, installer/recovery, live-provider operation, or redistribution-license signoff. |

**Release gate: BLOCK.** The bounded automated regressions are green; payment QR visual stability and physical/release gates are not certified by unit tests or a web asset build.

## 2026-11-02 23:05 luxury-atelier UI regression rerun (latest)

| Case | Status | Evidence |
|---|---|---|
| Backend offline Gradle | **PASS-AUTOMATED** | Requested command exit 0; `BUILD SUCCESSFUL in 17s`. JUnit XML: **28 suites, 82 total, 80 passed, 0 failures/errors, 2 skipped**. |
| Frontend Vitest | **PASS-AUTOMATED** | `npm test -- --run` exit 0: **8/8 files, 55/55 tests**, 7.39s. |
| Frontend production build | **PASS-AUTOMATED** | `npm run build` exit 0; TypeScript/Vite passed, **2,017 modules**; JS 392.17 kB, CSS 121.96 kB. Not an installer test. |
| Rust | **PASS-AUTOMATED (compile only)** | Explicit installed Cargo fallback exit 0; one package compiled in 8.56s. No Rust test cases were reported. |
| V1 isolation | **BLOCKED (global proof)** | No command, write, build, or secret read was performed in V1. No trusted pre-task manifest exists, so filesystem-wide untouched status cannot be certified. |
| Physical/release acceptance | **BLOCKED / NOT-RUN** | No fresh rendered 16:10 screenshots, mounted touch, Canon, DNP, Mini-PC metrics, installer/recovery, live provider operation, or license signoff. |

**Release gate: BLOCK.** Automated software regression is green; visual, physical hardware, packaging, performance, provider, and redistribution gates remain open.

## 2026-11-02 22:48 V1 geometry-alignment rerun (latest)

| Case | Status | Evidence |
|---|---|---|
| Backend offline Gradle | **PASS-AUTOMATED** | Exact requested command exit 0; `BUILD SUCCESSFUL in 32s`. XML aggregate: **28 suites, 82 total, 80 passed, 0 failures/errors, 2 skipped**. |
| Frontend Vitest | **PASS-AUTOMATED** | Exact requested command exit 0: **8/8 files, 55/55 tests**, 10.66s. |
| Frontend production build | **PASS-AUTOMATED** | Exit 0; TypeScript/Vite passed, **2,017 modules**; JS 391.98 kB, CSS 113.70 kB. This is not an installer test. |
| Rust | **PASS-AUTOMATED (compile only)** | Cargo absent from `PATH`; explicit `%USERPROFILE%\.cargo\bin\cargo.exe test` exit 0 and compiled one package in 12.88s. No Rust test cases reported. |
| V1 isolation | **BLOCKED (global proof)** | No reviewer V1 command/write/secret read. No trusted before/after manifest exists, so â€œ100% untouchedâ€ cannot be certified. |
| Geometry/hardware release | **PASS-AUTOMATED (bounded) / BLOCKED** | Source compiles and existing component tests pass. No fresh mounted screenshot/golden comparison, Canon, DNP, Mini-PC, installer, or license evidence. |

**Release gate: BLOCK.** Software regression is green, but geometry parity is not physically or visually certified and all hardware/packaging/legal gates remain open.

## 2026-11-02 22:22 camera-studio/frame-assets release rerun (latest)

| Case | Status | Evidence |
|---|---|---|
| Backend offline Gradle | **PASS-AUTOMATED** | Requested command exit 0; `BUILD SUCCESSFUL in 1m 58s`. Fresh XML aggregate: **28 suites, 82 total, 80 passed, 0 failures/errors, 2 skipped**. |
| Frontend Vitest | **PASS-AUTOMATED** | Requested command exit 0: **8/8 files, 55/55 tests**, 7.94s. |
| Frontend production build | **PASS-AUTOMATED** | Exit 0; TypeScript/Vite passed, 2,017 modules; JS 391.34 kB, CSS 114.69 kB. Not an installer test. |
| Rust | **PASS-AUTOMATED (compile only)** | Plain `cargo test` failed because Cargo was absent from `PATH`; `%USERPROFILE%\.cargo\bin\cargo.exe test` exit 0, compiled 1 package in 4.48s. No Rust test cases were reported. |
| V1 isolation | **BLOCKED (global proof)** | No reviewer V1 command/write/secret read; no trusted before/after manifest exists, so â€œ100% untouchedâ€ cannot be certified. |
| Hardware/release | **BLOCKED / NOT-RUN** | Canon, DNP, mounted touch, Mini-PC metrics, physical V1 comparison, installer/recovery and redistribution licenses remain open. |

**Release gate: BLOCK.** Automated software regression is green; required physical, packaging, licensing and forensic-isolation evidence is absent.

## 2026-11-02 21:36 user-feedback parity rerun (latest)

| Case | Status | Evidence |
|---|---|---|
| Backend offline Gradle | **PASS-AUTOMATED** | Exact requested command exited 0, `BUILD SUCCESSFUL in 17s`, test UP-TO-DATE. JUnit XML: **28 suites, 80 total, 78 passed, 0 failed/errors, 2 skipped**. |
| Frontend Vitest | **PASS-AUTOMATED** | Exact requested command exited 0: **7/7 files, 53/53 tests**, 6.06s. |
| Frontend production build | **PASS-AUTOMATED** | `tsc --noEmit && vite build` exited 0; 2,016 modules; JS 391.35 kB, CSS 110.07 kB. This is a web asset build, not a Windows installer/package test. |
| Feedback parity audit | **FAIL** | HIGH: `KioskSimulator.tsx:47` suppresses every later queued command after one command resolves false. Other requested photo/frame/preview/layout items have bounded automated or source-simulated evidence in `PHOTO_FRAME_INTERACTION_REGRESSION.md`. |
| V1 isolation | **BLOCKED (global proof)** | No command used V1 as working directory; no V1 write or secret read was performed. Complete untouched status cannot be proven without a trusted pre-task V1 manifest. |
| Hardware/release | **BLOCKED / NOT-RUN** | No Canon, DNP, live PayOS/Neon/Cloudinary, physical touchscreen, Mini-PC metrics, V1 print comparison, installer or license verification. |

**Release gate: BLOCK.** Green suites do not cover the queue-poisoning failure.

## 2026-11-02 touchscreen/revenue regression rerun (latest)

| Case | Status | Exact result / boundary |
|---|---|---|
| Backend offline Gradle | **PASS-AUTOMATED** | `.\.toolchain\gradle-8.14.3\bin\gradle.bat --offline test --console=plain`: exit 0, `BUILD SUCCESSFUL in 21s`, test task UP-TO-DATE. XML aggregate: **28 suites / 79 tests / 77 passed / 0 failed / 2 skipped**. |
| Frontend Vitest | **PASS-AUTOMATED** | `npm test -- --run`: exit 0, **7/7 files and 50/50 tests passed**, 0 failed/skipped, 8.82s. |
| Frontend production build | **PASS-AUTOMATED** | `npm run build`: exit 0; `tsc --noEmit && vite build`, **2,016 modules**, built in 5.60s. |
| Touch interactions | **PASS-AUTOMATED** | Frame no-Continue/300ms/default/lockout, layout center-then-confirm, hidden cash plus 1000ms PIN hold, and 500ms Confirm arming are component-tested. |
| 300 DPI and revenue gate | **PASS-AUTOMATED** | Native scale-1 compositor plus encoded 300-DPI metadata tests; revenue is written only after spooler submission, while mock/frame/demo paths remain false. No real print/DB write. |
| V1 strict isolation | **BLOCKED (global proof)** | Reviewer ran no V1 command, made no V1 write and read no secret. â€œCompletely untouchedâ€ cannot be forensically established without a trusted pre-task manifest. |
| Hardware/performance | **BLOCKED / NOT-RUN** | No Canon, DNP, physical touchscreen, Mini-PC metrics, physical V1 print comparison, payment, upload or DB write. |

**Gate:** bounded software regression is green; production release remains blocked by hardware, physical touch/performance, packaging/recovery and license gates.

## 2026-11-02 live desktop acceptance & navigation geometry verification (latest)

| Case | Status | Exact result / boundary |
|---|---|---|
| Live Tauri desktop acceptance | **PASS-SIMULATED** | `tests/verify-demo-and-real-journey.mjs`: **63/63 checks passed, 0 failures, 26 screenshots** across 1280Ã—800 and 1920Ã—1200 viewports. Result ledger: `tests/journey-evidence/2026-11-02T07-41-35.569Z/results.json`. Verified DEMO Startâ†’Delivery flow and REAL payment display. |
| Navigation touch targets & geometry | **PASS-SIMULATED** | Back button minimum 56Ã—56 touch target confirmed ($56\text{px} \times 56\text{px}$); optical centering verified with $dx=0.5\text{px}, dy=0.0\text{px}$ ($\le 2.5\text{px}$ delta limit). Carousel chevrons 56Ã—56 touch targets confirmed; horizontal axis alignment verified with $y\Delta \le 3\text{px}$ ($y\Delta = 0.0\text{px}$). |
| Technical clutter elimination | **PASS-SIMULATED** | Clean start screen with zero technical metadata / mode toggles; zero raw layout IDs on customer layout cards; customer-formatted layout names verified across all screens. Window title verified as `"LE SOUVENIR Photobooth"`. |
| Customer copy & iconography | **PASS-SIMULATED** | Zero Unicode emoji assertion passed across customer and operator UI; truthful Vietnamese customer copy; real calculated price displayed without customer free photo bypass. |
| Interaction & authoritative timers | **PASS-SIMULATED** | Press-and-hold (500ms) photo zoom and release dismissal verified; active selection timer verified and decrements over time (`CÃ²n láº¡i 02:20` â†’ `CÃ²n láº¡i 02:17` at 1280Ã—800; `CÃ²n láº¡i 02:19` â†’ `CÃ²n láº¡i 02:17` at 1920Ã—1200). Live frame preview updates SVG photo slots in real time. |
| Composed 600-DPI preview | **PASS-SIMULATED** | Final confirmation composed preview loads correctly (`naturalWidth > 0`). |
| DEMO revenue guard | **PASS-AUTOMATED** | Backend `RealSessionEngineDemoModeTest` proves zero sales ledger writes and zero revenue recording in DEMO mode (`time="6.151s"`). |
| Frontend Vitest | **PASS-AUTOMATED** | `npm test -- --run` exited 0: **49/49 tests passed** across all component and screen suites. |
| Frontend production build | **PASS-AUTOMATED** | `tsc --noEmit && vite build` exited 0: **0 errors**, 2,015 modules transformed in 3.55s. |
| Backend JUnit | **PASS-AUTOMATED** | `gradle test installDist`: **76/76 unit tests passed** across 17 test suites (`BUILD SUCCESSFUL`). |
| Physical Canon DSLR | **BLOCKED / NOT-RUN** | Physical camera capture, Live View stream orientation, and reconnect remain gated pending attached camera hardware. |
| Physical DNP printer | **BLOCKED / NOT-RUN** | Spooler submission, paper cutting (2-inch cut flow), and physical print output remain gated pending attached printer hardware. |
| Live PayOS banking settlement | **BLOCKED / NOT-RUN** | Live payment settlement remains gated pending explicit production authorization. |

### Screenshot artifacts (26)

Evidence root: `tests/journey-evidence/2026-11-02T07-41-35.569Z/`.

**1280Ã—800:**
1. `1280x800-demo-start.png`
2. `1280x800-demo-layout.png`
3. `1280x800-demo-quantity-2.png`
4. `1280x800-demo-payment.png`
5. `1280x800-demo-live.png`
6. `1280x800-demo-select.png`
7. `1280x800-demo-frame.png`
8. `1280x800-demo-confirm.png`
9. `1280x800-demo-delivery.png`
10. `1280x800-real-start.png`
11. `1280x800-real-layout.png`
12. `1280x800-real-quantity-2.png`
13. `1280x800-real-payment.png`

**1920Ã—1200:**
14. `1920x1200-demo-start.png`
15. `1920x1200-demo-layout.png`
16. `1920x1200-demo-quantity-2.png`
17. `1920x1200-demo-payment.png`
18. `1920x1200-demo-live.png`
19. `1920x1200-demo-select.png`
20. `1920x1200-demo-frame.png`
21. `1920x1200-demo-confirm.png`
22. `1920x1200-demo-delivery.png`
23. `1920x1200-real-start.png`
24. `1920x1200-real-layout.png`
25. `1920x1200-real-quantity-2.png`
26. `1920x1200-real-payment.png`

No screenshot or CDP assertion is physical Canon, DNP, mounted-touchscreen, or successful-payment evidence.

---

## 2026-11-01 live desktop external-integrations acceptance

| Case | Status | Exact result / boundary |
|---|---|---|
| Live Tauri desktop acceptance | **PASS-SIMULATED** | `tests/verify-demo-and-real-journey.mjs`: **37 checks, 0 failures**, at 1280Ã—800 and 1920Ã—1200. Result ledger: `tests/journey-evidence/2026-11-01T13-13-52.592Z/results.json`. The classification remains simulated because capture and printing were camera-free/dry-run. |
| Firebase layouts | **PASS-SIMULATED** | Live Firestore source identified as `FIREBASE_LIVE`; 10 named layouts displayed; disk-cache path retained. This was a live read, not a production write. |
| PayOS VietQR | **PASS-SIMULATED** | Live link creation reached `READY`; QR image rendered at both viewports from a 132-character payload. Recorded data URL length was 2746 (the archived 1920Ã—1200 result records 2738). No payment settlement was attempted. |
| DEMO capture | **PASS-SIMULATED** | Camera-free touch flow completed through delivery; dry-run 600-DPI preview and `revenueRecorded=false` verified. |
| Backend JUnit | **PASS-AUTOMATED** | **70 passed, 1 skipped**. A skip is not counted as a pass. |
| Frontend Vitest | **PASS-AUTOMATED** | **40 passed**, 0 reported failures. |

### Screenshot artifacts (20)

Evidence root: `tests/journey-evidence/2026-11-01T13-13-52.592Z/`.

**1280Ã—800:**

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

**1920Ã—1200:**

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
| 600-DPI composition | PASS-SIMULATED | Tests verify 5Ã—15 2-up **2452Ã—3658**, duplicate placement, and landscape **3658Ã—2452** (`ImagingParityTest.kt:48-76`). |
| Embedded ZXing QR correctness | FAIL | Production compositor contains ZXing rendering, but tests do not decode the rendered QR. More critically, real flow passes `albumUrl` at `RealSessionEngine.kt:320`, while no reviewed path assigns it, so real output is currently composed without an album QR. |
| V1 strict isolation | BLOCKED | Read-only `git status --short` in V1 showed pre-existing/unattributed changes: modified `.opencode/agents/architect.md`, `.opencode/agents/ui-designer.md`, plus two `.bak` files. Reviewer made no V1 write, but â€œcompletely untouchedâ€ cannot be established without a clean/baseline manifest. |

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
| Rust bridge â†’ installed JVM | PASS-SIMULATED | Probe exit 0; JVM 21.0.12, simulator true, health-only, EOF cleanup |
| Native window opens/closes | NOT-RUN | Prior report is not independent evidence for this review |
| React WebView invoke â†’ JVM | NOT-RUN | Component tests inject a fake; probe bypasses WebView/Tauri invoke |
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

