# Touchscreen Interaction & Revenue-Gate Regression — 2026-11-02

## Independent user-feedback parity rerun — 2026-11-02 21:36

**Gate: FAIL (HIGH command-queue defect).** The suites and build are green, but source review disproves the blanket claim that queued commands are never dropped. In `frontend/src/KioskSimulator.tsx:47`, `queue.current.then(previous=>previous?run():false)` permanently poisons the queue after any command resolves `false`; all later commands resolve `false` without executing. Reproduction: make one queued RPC fail (or return through the `!alive/error` guard), then enqueue another mutation; the second never calls `rpc`. Add a KioskSimulator-level regression that rejects one mutation and proves a subsequent deliberate retry executes before marking this fixed.

| User-feedback case | Status | Exact evidence / limitation |
|---|---|---|
| Continue at quota sends ordered indices | **PASS-AUTOMATED** | `SelectPhotosScreen.tsx:120` enables at exact quota and sends `selection.confirm` with `selectedIndices:localSelected`; `screens.test.tsx:38` verifies pending acknowledgements do not block `[2,0]`. |
| Sequential queue, no dropped commands | **FAIL** | FIFO promise chaining exists at `KioskSimulator.tsx:47-49`, but `previous ? run() : false` drops every command after the first `false`. No direct queue recovery test exists. |
| 960 px / JPEG 88% preview | **PASS-AUTOMATED** | Real engine `RealSessionEngine.kt:156,223-225`; simulator `SimulatorSessionEngine.kt:130-131,313`; dimension assertions in `RealSessionEngineDemoModeTest.kt:70,77` and `SimulatorSessionTest.kt:142-152`. This establishes encoding dimensions/settings, not subjective physical-display sharpness. |
| Hold zoom and pinned View Large close | **PASS-AUTOMATED** | `SelectPhotosScreen.tsx:26-33,59-115` installs window pointer release/cancel listeners and explicit pinned close; screen tests cover hold/release. No mounted touchscreen run. |
| Parameterized layout artwork and crop | **PASS-SIMULATED** | `LayoutArtwork.tsx:19-28` uses top/left/right padding, horizontal/vertical gaps, columns and photo aspect; SVG images use `xMidYMid slice`. No golden pixel comparison against V1 or asymmetric-layout visual fixture was run. |
| Frame compare + explicit “Xem bản in →” | **PASS-AUTOMATED** | `FrameScreen.tsx:45-74` keeps selected preview left, comparison grid right, and explicit confirm button. This supersedes the older “Continue removed / 300 ms auto-advance” claims below, which describe an earlier implementation. |
| Typography, spacing, 16:10 zero page scroll | **PASS-SIMULATED** | CSS source includes 16 px frame-grid gap (`kiosk-v1.css:129`), responsive gaps and shell `overflow:hidden` (`:8,218,246`). Existing desktop screenshots are historical; this rerun did not perform a fresh visual journey or physical touch test. |

Commands: backend `gradle.bat --offline test --console=plain` exit 0 in 17s, XML **28 suites / 80 total / 78 passed / 0 failed / 0 errors / 2 skipped**; frontend `npm test -- --run` exit 0, **7/7 files / 53/53 tests** in 6.06s; `npm run build` exit 0, 2,016 modules, JS 391.35 kB (124.41 kB gzip), CSS 110.07 kB (22.42 kB gzip), 3.32s.

## Verdict

**PASS-AUTOMATED for the bounded component/backend contracts; PASS-SIMULATED for source/CSS-only visual claims; physical touchscreen behavior is NOT-RUN.** This review does not certify Canon capture, DNP output, mounted-glass touch behavior, or production release.

| Case | Status | Evidence |
|---|---|---|
| Frame Continue removed | PASS-AUTOMATED | `FrameScreen.tsx:55-82` contains only heading, preview, frame buttons and hint; `screens.test.tsx:36` asserts no Continue button. |
| One-tap frame selection advances after 300ms | PASS-AUTOMATED | `FrameScreen.tsx:32-49` selects, waits 300ms, then confirms only after accepted selection; `screens.test.tsx:36` advances fake time exactly 300ms and observes one confirm. |
| Programmatic default does not auto-advance | PASS-AUTOMATED | Default is derived at `FrameScreen.tsx:26-27` without invoking the tap handler; explicit test at `screens.test.tsx:36`. |
| Rapid-tap lockout | PASS-AUTOMATED | `isTransitioning` latch and disabled non-selected cards at `FrameScreen.tsx:23,33-35,67`; test verifies one confirm. |
| Centered layout tap advances; off-center tap centers | PASS-AUTOMATED | `StudioModeScreen.tsx:22-28`; test at `screens.test.tsx:32` verifies first tap selects/centers and a centered tap confirms once despite repetition. |
| Public cash confirmation removed | PASS-AUTOMATED | `PaymentScreen.tsx:64-83` exposes cash only after staff authorization; tests at `screens.test.tsx:29,44` assert no guest cash/payment bypass. |
| 1000ms title long-press opens staff PIN | PASS-AUTOMATED | `PaymentScreen.tsx:64`; `screens.test.tsx:47` verifies 999ms rejection, movement cancellation, 1000ms modal, bad PIN rejection and one latched cash action. |
| Confirm ghost-click safety | PASS-AUTOMATED | `ConfirmScreen.tsx:7-8,30-31` blocks confirmation for 500ms; frame test verifies the newly mounted button is disabled. |
| Native 300 DPI composition | PASS-AUTOMATED | `DesktopCompositor.kt:48-58` uses scale 1 and 300-DPI dimensions; `PrintImageWriterTest.kt:10-32` checks encoded X/Y density 300. This supersedes prior 600-DPI wording. |
| Golden Revenue Gate | PASS-AUTOMATED | `RealSessionEngine.kt:531-555` marks print accepted only for submitted spooler result and records the sale afterward; simulator and demo tests keep revenue false. `SimulatorSessionTest.staffCashAndAtomicFrameConfirmDoNotRecordRevenue` covers mock payment/frame selection. No live DB write or paper output was attempted. |
| FIFO tap ordering and quota cap | PASS-AUTOMATED | `SelectPhotosScreen.tsx:27-34` appends selected indices and rejects new selections at quota; test at `screens.test.tsx:24` verifies ordered slots. |
| Automatic re-index on deselection | PASS-AUTOMATED | Order is derived with `localSelected.indexOf(i)` at `SelectPhotosScreen.tsx:42,87`; test at `screens.test.tsx:24` verifies immediate re-index. |
| 500 ms hold-to-zoom, including unselected item at full quota | PASS-AUTOMATED | Timer at `SelectPhotosScreen.tsx:51-59`; quota-full cards are dimmed but not disabled (`:47-50`); test at `screens.test.tsx:23` holds unselected photo 3 at full quota. |
| Release closes zoom without toggling selection | PASS-AUTOMATED | Release/cancel/leave handlers at `SelectPhotosScreen.tsx:60-84`; test at `screens.test.tsx:23` verifies dialog closes and no `selection.toggle` occurs. |
| Live photo composition preview | PASS-AUTOMATED | `selectedPhotos` follows optimistic local FIFO state (`SelectPhotosScreen.tsx:27,93`); test at `screens.test.tsx:24` verifies preview order updates immediately. |
| Live frame composition preview | PASS-AUTOMATED | Effective frame and overlay are derived immediately at `FrameScreen.tsx:28,49,56-59,64-69`; frontend suite passed. A dedicated assertion for switching between two frame overlays is still desirable. |
| Default frame preselected on entering editing | PASS-AUTOMATED | `FrameScreen.tsx:40-47`; explicit assertion at `screens.test.tsx:36`. |
| Native composition decoupled from frame-card click | PASS-SIMULATED | Frame click dispatches `frame.select`; backend composition remains behind its command path. This is source/component evidence, not Mini-PC latency measurement. |
| Floating preview / no oversized white wrapper | PASS-SIMULATED | CSS `frontend/src/kiosk-v1.css:215-217` removes preview background, border, radius and shadow and uses a drop shadow. No fresh screenshot run was performed. |
| Liquid-glass frame cards | PASS-SIMULATED | CSS `frontend/src/kiosk-v1.css:218-225` uses translucent cards, blur, selected/pressed feedback and bounded grid rows. Physical touch/readability is NOT-RUN. |

## Commands and exact results

- Backend, from `backend`: `.\.toolchain\gradle-8.14.3\bin\gradle.bat --offline test --console=plain` — exit 0, `BUILD SUCCESSFUL in 21s`; task was `UP-TO-DATE`. Fresh JUnit XML aggregate: **28 suites, 79 tests, 0 failures, 0 errors, 2 skipped = 77 passed**.
- Frontend, from `frontend`: `npm test -- --run` — exit 0; **7/7 files, 50/50 tests passed**, 0 failed/skipped, duration 8.82s.
- Frontend build: `npm run build` — exit 0; TypeScript check and Vite production build passed, **2,016 modules transformed**, output JS 389.94 kB (124.01 kB gzip), CSS 103.90 kB (21.39 kB gzip), built in 5.60s.

## Isolation and remaining gates

No command was run with V1 as working directory, no V1 file was edited, and no secret/`.env` was read. A claim that V1 is *completely untouched by all actors* is **BLOCKED** because no trusted before/after V1 manifest was supplied. The reviewer observed pre-existing V2 modifications before documentation updates and did not alter application code.

Physical Canon, DNP, mounted touchscreen, Mini-PC CPU/GPU/memory and live-view/countdown impact, physical output comparison to V1, installer recovery, and redistribution licensing remain **BLOCKED / NOT-RUN**.
