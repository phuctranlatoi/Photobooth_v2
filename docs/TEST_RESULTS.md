# Test Results — Independent Consolidated Review

## 2026-11-12 CSS softening polish — post-checkpoint 7ca40ac (V2 frontend CSS only)

| Case | Status | Exact evidence / boundary |
|---|---|---|
| Checkpoint ordering | **PASS-AUTOMATED (inspection)** | `git log -1 7ca40ac...` → `7ca40ac02d90e020fe721208e3c1b94eef00a037` "checkpoint current workspace before UI softening"; `git diff --stat 7ca40ac..HEAD` → **no commits** after checkpoint; all CSS changes are uncommitted working-tree edits. Checkpoint predates the CSS change. |
| Scope containment | **PASS-AUTOMATED (inspection)** | `git status --short` shows exactly `frontend/src/atelier/theme-tokens.css`, `atelier-core.css`, `atelier-customer.css`, `atelier-operator.css`, and `frontend/src/screens/payment.css` modified. No backend/Kotlin/Rust/IPC/pricing/revenue file changed. Four untracked backend runtime artifacts (`io_grpc_netty_*.dll`, `kotlin-compiler-*.alive`, `onnxruntime-java*/`, `sqlite-*.dll`) are pre-existing build detritus, not introduced by this change. |
| No camera/countdown/shutter/QR/business impact | **PASS-AUTOMATED (diff audit)** | `git diff 7ca40ac -- frontend/src/atelier/* frontend/src/screens/payment.css`: no rule touching `.v1-camera`, `.v1-countdown`, `.v1-shutter`, `.v1-payment-qr-slot`, `.v1-payment-columns`, geometry, or business state was modified. Changes are glass gradients/borders/blur/saturate/shadow softening plus new `--at-glass-rim`/`--at-control-border` tokens. |
| Accessible fallbacks added | **PASS-AUTOMATED (source)** / visual not verified | New `@media (prefers-reduced-transparency: reduce)` blocks (core/customer/operator/payment CSS: solid `--at-paper`/`--op-surface`, `backdrop-filter: none`) and extended `@media (forced-colors: active)` blocks (2px ButtonText borders, Highlight on `aria-pressed="true"`). Source-verified only; not rendered. |
| Frontend Vitest | **PASS-AUTOMATED** | V2 `frontend`: `npm test` (Vitest 4.0.9) exit **0**; **11/11 files, 85/85 tests** in 6.29 s. Note: this is a **+24-test growth** over the 61/61 recorded in the 2026-11-06 Phase 12 row below; the growth is not scoped to this CSS change and is not documented elsewhere. |
| Production build | **PASS-AUTOMATED** | V2 `frontend`: `npm run build` (`tsc --noEmit && vite build`) exit **0**; **2,016 modules**, CSS 122.31 kB, JS 423.47 kB, 3.24 s. Module count differs from the 2,010 recorded in Phase 12; drift is attributed to added frontend test files/scaffold since 11-06, not specifically to this CSS change. |
| Jest scaffold | **PASS-AUTOMATED (bounded)** | Pre-existing `frontend/src/basic-scaffold.jest.tsx` + root `jest.config.js` (both introduced in checkpoint `7ca40ac`, not by this CSS change). No npm `jest` script; `npx jest` with a synthesized config ran **1/1 passed**. Not CSS-scoped; the claimed "1 Jest pass" was not reproducible via a standard command before this review synthesized a config. |
| CSS-specific automated test | **NOT-RUN / MISSING** | No test asserts the new token values, reduced-transparency, or forced-colors blocks; the CSS polish is validated only by non-interference regression. |
| Visual outcome at 1280×800 / 1920×1200, OS scaling | **VISUAL NOT VERIFIED** | No independent rendered-viewport, screenshot, or CDP measurement performed in this review. |
| Physical Canon / DNP / live PayOS-Neon-Cloudinary / Mini-PC / installer | **BLOCKED / NOT-RUN** | No hardware, provider, or packaging run authorized or performed in this review. |
| V1 isolation | **PASS-AUTOMATED (read-only)** | No V1 shell command, write, build, secret read, or customer-photo operation performed. |
| Journey runner screenshots (`tests/verify-demo-and-real-journey.mjs`) | **NOT RUN** | Requires live Tauri/WebView + real-mode PayOS payment-link display + spawn/kill of V2 processes and a `sqlite3` DEMO-revenue query. Marked not run per policy: a live Tauri/WebView acceptance (not pure offline/mock), and its payment step touches a real PayOS QR display path, so it was **not** executed in this shell-approved offline review. |

**Release gate: BLOCK.** CSS polish is software-regression green and free of camera/QR/business impact by diff audit, with new reduced-transparency/forced-colors accessible fallbacks; but it lacks a dedicated CSS automated test, its visual outcome is not verified, the test/build baseline is only partially recorded, and all physical/production/license gates remain blocked.

---

## 2026-11-06 Phase 12 — Complete UI/UX Reconstruction

| Case | Status | Exact evidence / command / boundary |
|---|---|---|
| Frontend Vitest confirmation | **PASS-AUTOMATED** | V2 `frontend`: `npm run test`; exit **0**; **9/9 files, 61/61 tests**, 0 failures; Vitest duration 6.60s. |
| Production frontend build | **PASS-AUTOMATED** | V2 `frontend`: `npm run build`; exit **0**; `tsc --noEmit && vite build`; **2,010 modules**, zero errors, Vite build 3.59s. |
| Modular stylesheet architecture | **PASS-AUTOMATED** | Implementation present at `frontend/src/atelier/theme-tokens.css`, `atelier-core.css`, `atelier-customer.css`, and `atelier-operator.css`; preserved import surfaces/selectors keep existing contracts compatible. |
| Live Tauri WebView acceptance | **PASS-SIMULATED** | `tests/verify-demo-and-real-journey.mjs` exit **0**, both 1280×800 and 1920×1200, 26 screenshots. Ledger: `tests/journey-evidence/2026-11-06T14-58-42.247Z/results.json`. |
| 1280×800 geometry | **PASS-SIMULATED** | Countdown Δx **0.000007629 px**, Δy **0.000022888 px**; shutter **108×108 px**, core **84×84 px**, Δx **0 px**; Back **56×56 px**, icon Δx/Δy **0/0 px**; QR slot **272×272 px**, payment layout shift **0 px**. |
| 1920×1200 geometry | **PASS-SIMULATED** | Countdown Δx **0 px**, Δy **0.000015259 px**; shutter **108×108 px**, core **84×84 px**, Δx **0 px**; Back **56×56 px**, icon Δx/Δy **0/0 px**; QR slot **380×380 px**, payment layout shift **0 px**. |
| Selection latency | **PASS-SIMULATED** | Photo: **4.50 ms / 4.80 ms**; frame: **7.50 ms / 6.00 ms** at 1280×800 / 1920×1200. All <100 ms. |
| Functional/state/selector retention | **PASS-AUTOMATED + PASS-SIMULATED** | Existing frontend suites and live DEMO/REAL-display journeys pass without changing backend authority, state-machine contracts, IPC behavior, roles, stable test IDs, or preserved selectors. “100% retained” is bounded to these exercised contracts; physical hardware behavior is separately gated. |
| Changed-file scope | **PASS-AUTOMATED (inspection)** | `git status --short`, `git diff --stat`, and `git diff --name-only` showed no modified `backend/`, `src-tauri/src/`, migrations, PayOS, Canon, DNP, or V1 file. Changes are V2 frontend and documentation only. |
| V1 isolation | **PASS-AUTOMATED (read-only verification)** | `git -C "E:\HK1_2026_2027\PhotoboothDesktop" status --short` returned no output. No V1 write/build/cleanup, secret read, or customer-photo operation. |
| Canon DSLR | **BLOCKED / GATED** | No physical capture, Live View, reconnect, USB-unplug, or repeated transfer test. |
| DNP DS-RX1HS | **BLOCKED / GATED** | No physical spool, 5×15/10×15 output, cutting, completion, or V1 paper comparison. |
| Live PayOS | **BLOCKED / GATED** | No production payment/settlement. QR rendering in acceptance remains simulated/display-only evidence. |

**Release gate: BLOCK.** The frontend reconstruction milestone is software-green, but it does not clear physical Canon, physical DNP, live PayOS, packaging, performance-on-target-Mini-PC, or redistribution-license gates.

---

## 2026-11-06 Atelier Canvas UI/UX overhaul and 16:10 geometry alignment

| Case | Status | Exact evidence / boundary |
|---|---|---|
| Frontend Vitest | **PASS-AUTOMATED** | Full suite: **61/61 tests passed across 9 suites**. |
| Production Vite build | **PASS-AUTOMATED** | **2,020 modules transformed, 0 errors**. |
| Live Tauri WebView journey | **PASS-SIMULATED** | `tests/verify-demo-and-real-journey.mjs` exited **0** with **zero failures** at 1280×800 and 1920×1200. No physical Canon capture, DNP output, or live settlement was performed. |
| Countdown geometry via CDP | **PASS-SIMULATED** | 1280×800: Δx **0.000008 px**, Δy **0.000023 px**. 1920×1200: Δx **0 px**, Δy **0.000015 px**. All are within the ≤ 2 px threshold. |
| Shutter geometry via CDP | **PASS-SIMULATED** | Outer ring **108×108 px**, core **84×84 px**, horizontal center offset **0 px** at both viewports; limit ≤ 1 px. |
| Back target and icon geometry | **PASS-SIMULATED** | Hitbox is at least **56×56 px**; icon center offset is **0.0 px** on x and y at both viewports (limit ≤ 2.5 px). Verification followed the flex-centering and `margin: auto` fix for the single-track grid justify fallback. |
| Carousel controls | **PASS-SIMULATED** | Navigation chevrons are **56×56 px** touch targets with horizontal alignment delta ≤ 3 px. |
| Photo selection latency | **PASS-SIMULATED** | **4.20 ms** at 1280×800 and **3.90 ms** at 1920×1200; target < 100 ms. |
| Frame selection latency | **PASS-SIMULATED** | **6.50 ms** at 1280×800 and **5.60 ms** at 1920×1200; target < 100 ms. |
| Hold-zoom gesture | **PASS-SIMULATED** | A **500 ms** press-and-hold enlarged the photo; finger release dismissed the enlargement cleanly. |
| VietQR layout shift | **PASS-SIMULATED** | Exactly **0.00 px** change in slot width/height and columns x/y/width/height at both viewports. This is geometry evidence, not proof of live settlement or physical QR scanning. |
| DEMO sales isolation | **PASS-SIMULATED** | SQLite `sales.db` contained **zero DEMO sales records**. No live Neon write was performed. |
| Process cleanup | **PASS-AUTOMATED** | Acceptance teardown left **zero orphaned V2 Node/Vite processes**. |
| V1 isolation | **PASS-AUTOMATED (read-only verification)** | Read-only Git status/diff verification found no V1 modification attributable to this milestone. No V1 write/build/cleanup, secret read, or customer-photo modification was performed. |
| Physical Canon DSLR | **BLOCKED** | Capture, Live View, USB-unplug/reconnect, and repeated real-photo transfer require attached hardware and supervised operator authorization. |
| Physical DNP DS-RX1HS | **BLOCKED** | Real 5×15/10×15 output, driver settings, cutter behavior, spooler completion, and V1 paper comparison require attached hardware and authorization. |
| Live PayOS and commercial licensing | **BLOCKED / GATED** | Production credentials/settlement and redistribution rights for Canon SDK, ONNX assets, and dependencies require explicit authorization and legal signoff. |

**Release gate: BLOCK.** The Atelier Canvas UI/UX and target-viewport geometry milestone is software-green (**PASS-AUTOMATED + PASS-SIMULATED**), but it does not satisfy physical camera, printer, production-payment, packaging, or commercial-license release gates.

---

## 2026-11-03 15:04 Mock capture and print-signal transmission verification

| Case | Status | Evidence / boundary |
|---|---|---|
| Backend offline tests | **PASS-AUTOMATED** | Requested `backend: .\.toolchain\gradle-8.14.3\bin\gradle.bat --offline test --console=plain` exited 0; `BUILD SUCCESSFUL in 32s`. JUnit XML aggregate: **82 total, 80 passed, 2 skipped, 0 failed/errors** across 28 suites. Gradle reported `test UP-TO-DATE`, so test bodies were not freshly executed. |
| Frontend Vitest | **PASS-AUTOMATED** | Requested `frontend: npm test -- --run` exited 0; **8/8 files and 56/56 tests passed**; Vitest duration 9.19s. |
| Frontend production build | **PASS-AUTOMATED** | Requested `frontend: npm run build` exited 0; TypeScript/Vite passed, **2,017 modules transformed**, built in 7.83s. |
| Rust check | **PASS-AUTOMATED (compile only)** | Requested `src-tauri: C:\Users\ASUS\.cargo\bin\cargo.exe check` exited 0; the `le-souvenir-v2` dev profile compiled successfully in 5.86s. This was `check`, not Rust test execution. |
| Unlocked mock capture and print signal | **PASS-SIMULATED** | The unlocked camera-free flow supports full end-to-end sessions with synthetic high-resolution mock portraits. The production composition engine renders the exact print canvas. Print dispatch sends to Windows Print Spooler when system printing is enabled; otherwise it records simulated signal transmission with complete job telemetry. Delivery presents the prominent green **“TÍN HIỆU IN: ĐÃ TRUYỀN THÀNH CÔNG”** badge, and Payment provides the staff helper for a 1-second title hold and PIN `1234`. No physical Canon DSLR capture, DNP spool/output, cut, or paper result was performed. |
| V1 isolation | **BLOCKED (global proof)** | This reviewer ran no command in V1, made no V1 write/build/cleanup, and read no V1 secret. V1 was kept outside all command working directories. Filesystem-wide untouched status cannot be certified without a trusted before/after manifest. |

**Release gate: BLOCK.** Mock end-to-end capture/composition/print-signal behavior and bounded software regression are green. Physical Canon/DNP output, mounted touchscreen/scaling, Mini-PC performance, installer/recovery, live-provider operations, physical V1 comparison, and redistribution-license signoff remain blocked or not run.

---

## 2026-11-03 12:50 Production Kiosk Administration & Settings Overhaul

| Case | Status | Evidence / boundary |
|---|---|---|
| Backend offline tests | **PASS-AUTOMATED** | `backend: .\.toolchain\gradle-8.14.3\bin\gradle.bat --offline test --console=plain` exit 0; `BUILD SUCCESSFUL in 22s`, measured wall time **22.52s**. JUnit XML aggregate: **82 total, 80 passed, 2 skipped, 0 failed/errors**. Gradle reported `test UP-TO-DATE`, so test bodies were not freshly executed. |
| Frontend Vitest | **PASS-AUTOMATED** | `frontend: npm test -- --run` exit 0; **8/8 files and 56/56 tests passed**; Vitest duration 7.09s, measured wall time **9.31s**. Existing test IDs and roles remained compatible. |
| Frontend production build | **PASS-AUTOMATED** | `frontend: npm run build` exit 0; TypeScript/Vite passed, **2,017 modules transformed**, Vite build 4.46s, measured wall time **9.92s**. |
| Rust test command | **PASS-AUTOMATED (compile only)** | `src-tauri: %USERPROFILE%\.cargo\bin\cargo.exe test` exit 0; **1 package compiled cleanly in 22.34s**. Cargo reported no Rust test cases. |
| Administration/settings overhaul | **PASS-SIMULATED (source/build only)** | Operator simulator-warning banner was removed and replaced with an Atelier 2.0 kiosk status banner and live device-status pills. `V1Settings` received structured Liquid Glass panels, switch controls, 52×52 squircle steppers, floating status cards and print-configuration chips. Exact six-field persistence remains `enableSystemPrint`, `useHotFolder`, `hotFolderPath`, `postCaptureTimeoutSeconds`, `photoSelectionTimeoutSeconds`, and `frameSelectionTimeoutSeconds`. No mounted kiosk, physical touch, device, or V1 side-by-side acceptance was run. |
| V1 isolation | **BLOCKED (global proof)** | This reviewer ran **no command in V1**, made no V1 write/build/cleanup, and read no secret. Filesystem-wide untouched status cannot be certified without a trusted before/after manifest. |

**Release gate: BLOCK.** Automated software regression is green, but physical touchscreen/scaling acceptance, Canon, DNP, Mini-PC metrics, installer/recovery, live providers, V1 print comparison, and Canon/ONNX redistribution-license signoff remain blocked or not run.

## 2026-11-03 11:48 Coverflow wheel carousel regression

| Case | Status | Evidence / boundary |
|---|---|---|
| Backend offline tests | **PASS-AUTOMATED** | `backend: .\.toolchain\gradle-8.14.3\bin\gradle.bat --offline test --console=plain` exit 0; `BUILD SUCCESSFUL in 23s`. JUnit XML aggregate: **82 total, 80 passed, 2 skipped, 0 failed/errors**. Gradle reported `test UP-TO-DATE`, so this run did not freshly execute test bodies. |
| Frontend Vitest | **PASS-AUTOMATED** | `frontend: npm test -- --run` exit 0; **8/8 files and 56/56 tests passed**; Vitest duration **9.83s**. Coverage includes modular Prev/Next wrap-around and the accessible hint retained in the DOM. |
| Frontend production build | **PASS-AUTOMATED** | `frontend: npm run build` exit 0; TypeScript/Vite passed, **2,017 modules transformed**, Vite build **6.25s**. |
| Rust test command | **PASS-AUTOMATED (compile only)** | `src-tauri: %USERPROFILE%\.cargo\bin\cargo.exe test` exit 0; **1 package compiled cleanly in 11.35s**. Cargo reported no Rust test cases. |
| Coverflow implementation | **PASS-SIMULATED (source/build only)** | Hint text is visually hidden with `.sr-only`; cards use `clamp(200px, 22vw, 300px)`, stage max-width 1400px, and gap `clamp(16px, 2.5vw, 40px)`. Distance tiers are selected `scale(1.08)`/z10, neighbor `0.80`/opacity `.65`/z5, further `0.62`/`.40`/z2, and distance ≥3 `0.48`/`.22`/z1. Prev/Next use modular wrap-around. No mounted 16:10, physical touch, repeated-tap, or visual comparison run was performed. |
| V1 isolation | **BLOCKED (global proof)** | This reviewer ran **no command in V1**, made no V1 write/build/cleanup, and read no secret. Filesystem-wide untouched status cannot be certified without a trusted before/after manifest. |

**Release gate: BLOCK.** Bounded automated regression is green. Physical touchscreen/scaling/visual acceptance, Canon, DNP, Mini-PC performance, installer/recovery, live providers, V1 print comparison, and Canon/ONNX redistribution-license signoff remain blocked or not run.

## 2026-11-03 11:37 chromatic oil-slick and cardless-carousel regression

| Case | Status | Evidence / boundary |
|---|---|---|
| Backend offline tests | **PASS-AUTOMATED** | `backend: .\.toolchain\gradle-8.14.3\bin\gradle.bat --offline test --console=plain` exit 0; `BUILD SUCCESSFUL in 22s`, measured wall time **22.54s**. Existing JUnit aggregate is **82 total: 80 passed, 2 skipped, 0 failed/errors**; Gradle reported `test UP-TO-DATE`, so this invocation did not freshly execute test bodies. |
| Frontend Vitest | **PASS-AUTOMATED** | `frontend: npm test -- --run` exit 0; **8/8 files and 55/55 tests passed**; Vitest 8.46s, measured wall time **10.82s**. |
| Frontend production build | **PASS-AUTOMATED** | `frontend: npm run build` exit 0; TypeScript/Vite passed, **2,017 modules transformed**, measured wall time **11.93s**. |
| Rust test command | **PASS-AUTOMATED (compile only)** | `src-tauri: %USERPROFILE%\.cargo\bin\cargo.exe test` exit 0; **1 package compiled cleanly** in 11.19s. Cargo reported no Rust test cases. |
| “Dầu loang” shell and cardless layout | **PASS-SIMULATED (source/build only)** | `.v1-shell:not(.v1-camera)` contains petrol cyan `#00e5c9`, electric violet `#b042ff`, rose-magenta `#ec4899`, coral `#ff6f59`, amber `#f6d365`, and sapphire `#3b82f6`; panels use saturated blur/specular cyan-violet rims and primary CTA uses a chromatic aura. Layout button wrapper is transparent with zero border/shadow/padding; artwork has the requested 3D shadow, selected `scale(1.06)` and exact rose/cyan/black aura; `.v1-carousel-tap-hint` is pill-shaped. Porcelain QR surfaces and camera `#121214` remain scoped separately. No mounted viewport, computed-style, touch, contrast, or QR scanner test was run. |
| V1 isolation | **BLOCKED (global proof)** | This reviewer ran **no command in V1**, made no V1 write/build/cleanup, and read no secret. Strict filesystem-wide untouched status cannot be certified without a trusted before/after manifest; prior documentation records pre-existing V1 changes of unknown provenance. |

**Release gate: BLOCK.** Bounded automated regression is green, but visual/touch/scaling/QR acceptance, Canon, DNP, Mini-PC performance, installer/recovery, production providers, physical V1 print comparison, and Canon/ONNX redistribution-license signoff remain blocked or not run.

## 2026-11-03 11:10 app-wide Korean Atelier Liquid Glass regression

| Case | Status | Evidence / boundary |
|---|---|---|
| Backend offline tests | **PASS-AUTOMATED** | `backend: .\.toolchain\gradle-8.14.3\bin\gradle.bat --offline test --console=plain` exit 0; `BUILD SUCCESSFUL in 16s`, measured wall time **16.75s**. JUnit XML: **28 suites, 82 total, 80 passed, 2 skipped, 0 failures/errors**. Gradle reported the test task up-to-date and deprecated features incompatible with Gradle 9. |
| Frontend Vitest | **PASS-AUTOMATED** | `frontend: npm test -- --run` exit 0; **8/8 files, 55/55 tests passed**; Vitest duration 12.86s, measured wall time **16.61s**. |
| Frontend production build | **PASS-AUTOMATED** | `frontend: npm run build` exit 0; TypeScript/Vite passed, **2,017 modules transformed**, Vite build 5.36s, measured wall time **10.71s**, zero build errors. |
| Rust test command | **PASS-AUTOMATED (compile only)** | `src-tauri: %USERPROFILE%\.cargo\bin\cargo.exe test` exit 0; **1 package compiled** in 15.17s. Cargo reported no Rust test cases. |
| App-wide visual overhaul | **PASS-SIMULATED (source/build only)** | Recorded scope: luminous apricot/rose-quartz/champagne ambience on `.v1-shell:not(.v1-camera)`; shared Liquid Glass customer surfaces; terracotta-coral specular buttons; `atelier-status-pulse`; unblurred floating paper previews; porcelain QR cards; and preserved `#121214` camera studio with centered countdown/circular shutter. Existing tests and compilation pass, but no fresh mounted viewport, QR scan, physical touch, motion/accessibility, or camera-preview acceptance was run. |
| V1 isolation | **BLOCKED (global proof)** | Read-only `git -C E:\HK1_2026_2027\PhotoboothDesktop status --short` showed modified `.opencode/agents/architect.md`, `.opencode/agents/ui-designer.md` and two untracked `.bak` files. Their provenance predates/is outside this review. This reviewer made no V1 write, build, cleanup, or secret read; without a trusted before/after manifest, strictly untouched status cannot be certified. |

**Release gate: BLOCK.** Bounded software regression is green. Physical 16:10 touchscreen/scaling/QR validation, Canon, DNP, Mini-PC performance, installer/recovery, provider operations, physical V1 print comparison, and Canon/ONNX redistribution-license signoff remain blocked or not run.

## 2026-11-03 10:34 full-bleed payment regression

| Case | Status | Evidence / boundary |
|---|---|---|
| Frontend Vitest | **PASS-AUTOMATED** | `npm test -- --run` exit 0: **8/8 files, 55/55 tests passed** in 13.60s. |
| Frontend production build | **PASS-AUTOMATED** | `npm run build` exit 0; TypeScript/Vite passed and **2,017 modules** were transformed. |
| Backend offline tests | **PASS-AUTOMATED** | Requested Gradle command exit 0 (`BUILD SUCCESSFUL in 29s`). JUnit XML aggregate: **28 suites, 82 total, 80 passed, 2 skipped, 0 failed/errors**. The test task was up-to-date. |
| Rust Cargo | **PASS-AUTOMATED (compile only)** | `%USERPROFILE%\.cargo\bin\cargo.exe test` exit 0; **1 package compiled cleanly** in 16.32s. Cargo reported no Rust test cases. |
| Full-bleed payment geometry | **PASS-SIMULATED (source/build only)** | Outer shell payment padding/gap are zero; payment screen outer radius is zero. Apricot/rose/champagne radial ambience reaches pixel `(0,0)` with no intended white outer border. Internal bezel protection remains `clamp(20px, 2.5vh, 32px) clamp(24px, 4vw, 64px)`. No fresh mounted viewport, scaling, touch, or pixel measurement was run. |
| V1 isolation | **BLOCKED (global proof)** | This reviewer ran no command in V1, made no V1 write, and read no V1 secret. A trusted pre-task manifest was not provided, so **100% untouched cannot be certified**. |

**Release gate: BLOCK.** Automated software regression is green; physical viewport/touch/QR, Canon, DNP, Mini-PC, packaging/recovery, provider and redistribution-license gates remain open.

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

