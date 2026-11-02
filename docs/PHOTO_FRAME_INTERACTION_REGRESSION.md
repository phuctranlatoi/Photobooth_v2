# Photo & Frame Interaction Regression — 2026-11-02

## Verdict

**PASS-AUTOMATED for the bounded component/backend contracts; physical touchscreen behavior is NOT-RUN.** This review does not certify Canon capture, DNP output, mounted-glass touch behavior, or production release.

| Case | Status | Evidence |
|---|---|---|
| Frame Continue enabled after selection/default selection | PASS-AUTOMATED | `frontend/src/screens/FrameScreen.tsx:27-47,85-89`; `frontend/src/screens/screens.test.tsx:36` verifies first-frame preselection, enabled Continue, and one `frame.confirm` despite two taps. |
| Continue reaches `PRINT_PENDING` | PASS-AUTOMATED | Backend dispatch `backend/src/main/kotlin/com/lesouvenir/v2/ipc/RealSessionEngine.kt:416` requires `EDITING`, ensures composition exists, then sets `PRINT_PENDING`. Full backend suite passed. No mounted journey was rerun in this review. |
| FIFO tap ordering and quota cap | PASS-AUTOMATED | `SelectPhotosScreen.tsx:27-34` appends selected indices and rejects new selections at quota; test at `screens.test.tsx:24` verifies ordered slots. |
| Automatic re-index on deselection | PASS-AUTOMATED | Order is derived with `localSelected.indexOf(i)` at `SelectPhotosScreen.tsx:42,87`; test at `screens.test.tsx:24` verifies immediate re-index. |
| 500 ms hold-to-zoom, including unselected item at full quota | PASS-AUTOMATED | Timer at `SelectPhotosScreen.tsx:51-59`; quota-full cards are dimmed but not disabled (`:47-50`); test at `screens.test.tsx:23` holds unselected photo 3 at full quota. |
| Release closes zoom without toggling selection | PASS-AUTOMATED | Release/cancel/leave handlers at `SelectPhotosScreen.tsx:60-84`; test at `screens.test.tsx:23` verifies dialog closes and no `selection.toggle` occurs. |
| Live photo composition preview | PASS-AUTOMATED | `selectedPhotos` follows optimistic local FIFO state (`SelectPhotosScreen.tsx:27,93`); test at `screens.test.tsx:24` verifies preview order updates immediately. |
| Live frame composition preview | PASS-AUTOMATED | Effective frame and overlay are derived immediately at `FrameScreen.tsx:28,49,56-59,64-69`; frontend suite passed. A dedicated assertion for switching between two frame overlays is still desirable. |
| Default frame preselected on entering editing | PASS-AUTOMATED | `FrameScreen.tsx:40-47`; explicit assertion at `screens.test.tsx:36`. |
| 600-DPI composition decoupled from frame-card click | PASS-SIMULATED | Frame click only sets optimistic ID and dispatches `frame.select` (`FrameScreen.tsx:64-69`). Backend composes through its command path; confirm ensures composition before transition (`RealSessionEngine.kt:416`). This is source/component evidence, not Mini-PC latency measurement. |
| Floating preview / no oversized white wrapper | PASS-SIMULATED | CSS `frontend/src/kiosk-v1.css:215-217` removes preview background, border, radius and shadow and uses a drop shadow. No fresh screenshot run was performed. |
| Liquid-glass frame cards | PASS-SIMULATED | CSS `frontend/src/kiosk-v1.css:218-225` uses translucent cards, blur, selected/pressed feedback and bounded grid rows. Physical touch/readability is NOT-RUN. |

## Commands and exact results

- Backend, from `backend`: `.\.toolchain\gradle-8.14.3\bin\gradle.bat --offline test --console=plain` — exit 0, `BUILD SUCCESSFUL in 21s`; task was `UP-TO-DATE`. Aggregated JUnit XML: **28 suites, 78 tests, 0 failures, 0 errors, 2 skipped = 76 passed**.
- Frontend, from `frontend`: `npm test -- --run` — exit 0; **7/7 files, 50/50 tests passed**, 0 failed/skipped, duration 8.46s.
- Frontend build: `npm run build` — exit 0; TypeScript check and Vite production build passed, **2,016 modules transformed**, output JS 388.49 kB (123.51 kB gzip), CSS 95.03 kB (19.85 kB gzip).

## Isolation and remaining gates

No command was run with V1 as working directory, no V1 file was edited, and no secret/`.env` was read. A claim that V1 is *completely untouched by all actors* is **BLOCKED** because no trusted before/after V1 manifest was supplied. The reviewer observed pre-existing V2 modifications before documentation updates and did not alter application code.

Physical Canon, DNP, mounted touchscreen, Mini-PC CPU/GPU/memory and live-view/countdown impact, physical output comparison to V1, installer recovery, and redistribution licensing remain **BLOCKED / NOT-RUN**.
