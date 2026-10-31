# Simulator frontend — continuation in progress

## Latest installed-backend continuation — supersedes early blocker below

Actual two-layout mounted React flow **PASS**, `cmd /d /c "node verify-simulator.mjs > simulator-fullflow.txt 2>&1"`, exit **0**. Evidence `frontend/simulator-fullflow.txt` and twelve PNG screenshots in `frontend/simulator-evidence/`. Host **30060**, active real synthetic JVM **35416**, native close True, host exit 0, JVM terminated. CDP clicks mounted buttons only, never invokes backend directly.

Both fixture layouts run Start → layout/setup → quantity → payment; payment Back → quantity → payment; explicit approval → actual SimulatorCamera Live View → configured capture → exact selection → generated frame → composed print preview → reload with snapshot-restored preview → manual dryrun DELIVERY → Finish → acknowledged IDLE/storage cleared. First fixture captures 3/selects2/1s, second 5/selects4/2s. Live JPEG decodes 320×180, complete shot thumbnails 240×135; authoritative paper preview decodes 402×600. These previews derive from actual compositor output, not CSS approximations. Full-resolution file dimensions/hashes are backend-agent evidence, not independently asserted by this UI harness. No file path is exposed by API; UI says generated files only, not delivered/printed.

Measured actual WebView emulated CSS viewports **1280×800** and **1920×1200**, screenshots for welcome/payment/live/selection/print-preview/delivery each. At 1280 primary print confirm y613.6/h64 outer, Back y689.6; selection Continue y535.2 and menu y653.2. At 1920 print confirm y753.6. All tested primary controls in viewport; clientHeight62 excludes two border pixels (64px outer). This is not physical touchscreen/DPI certification. Images use object-fit contain, so media well dimensions need not equal decoded aspect.

Corrections after UI review: active default simulator with separate diagnostic toggle; named session.confirmSetup; setQuantity directly enters payment; DELIVERY instead of FINISHED; generation on every bound request; only session.getState polling; real livePreviewDataUrl separate from complete originals; numeric-only countdown with ordinary phase caption; snapshot-derived preview recovery; payment Back; phase-gated three-dot cancel with blocking backdrop/default Continue/Tab containment; bounded quantity/grid/media and frame thumbnails/selected state; manual versus inactivity outcome copy; reset clears storage only on acknowledged IDLE before obsolete identity refresh. Removed stale shared event/transition/progress fiction. Host opts in synthetic adapter only under existing fixed --simulator path and preserves exact five-key envelope (commandId inside params).

During live testing discovered a click could be silently dropped while a poll held lock: corrected with synchronous intent latch then serialized wait for active read, preserving one command per gesture. An earlier run also exposed Vite serving cached old App despite disk edits; restarted the V2 Vite process, then reran actual flow and geometry. Earlier failed/interrupted attempts are not acceptance evidence.

Final frontend `npm.cmd run build`: **0**; `npm.cmd test -- --run`: **0**, **7/7** (4 health + 3 simulator tests: double Start/generation/named setup, catalog offline/retry, bounded image handles). Rust build/test **0** after exact wire correction. Final Task1 harness updated to click diagnostic toggle: **0**, host38088/JVM14572/launcher29360, health331ms, closeTrue/exit0/JVMterminated; `frontend/webview-final-health.txt`.

Remaining review gaps: no physical touch, DPI125/150, long translations or long-session stress; full cancel/timeout/manual race and unknown-outcome recovery need broader UI tests. Unknown mutation is saved with original commandId in sessionStorage and never automatically replayed; no UI retry is offered. Explicit reconcile reads status/catalog only. Engine has no revision counter, so generation binding plus serialized reads/commands supplies ordering. Backend restart/stale stored identity requires deliberate recovery work; no invented automatic reset. Inactivity remaining-time field is unavailable; explanation and authoritative origin rendered, no local timer invented. Modal focus return/inert keyboard support and selected-photo enlarged preview/order remain refinement gaps. Request Designer/Tester re-review of actual screenshots and source; no milestone closure or production readiness claim.

2026-10-30. **Not accepted / not end-to-end complete.** Backend agent owns backend; current installed distribution still responds `-32601 Method not found` to `catalog.get`.

## Changes

- Existing host extended with fixed simulator method allowlist, object params, framed request bound and commandId forwarding. No arbitrary shell/path or real print/payment methods. Existing health validation now accepts expanded capabilities containing `health.check` rather than exact singleton; legacy health remains supported.
- `frontend/src/Simulator.tsx`: backend catalog-driven fixture Start/layout/copies, explicit mock payment, preparation/live/countdown/capture displays, complete original thumbnails, selection, frame composition, dryrun confirmation/completion/reset and scoped cancel dialog. No React business progression timers, camera processing, fake preview or fabricated QR. Polling is serial, 500ms after completion; React cleanup clears timer. Commands latch synchronously and are never automatically replayed.
- CSS adds contained photo grid, capture rail, composed preview and >=64px controls. Original architecture-proof section retained; simulator is explicitly separate and sample-only.

## Executed

All commands from V2, cache/temp variables confined to frontend/.tmp, frontend/.npm-cache or src-tauri/.tmp, src-tauri/.cargo-home and src-tauri/target.

| Command | Exit / result |
|---|---|
| frontend `npm.cmd run build` | 0, strict TS + Vite |
| frontend `npm.cmd test -- --run` initial after extension | 1, two old health tests had ambiguous alerts due to newly mounted simulator |
| frontend `npm.cmd test -- --run` after isolating injected health client | 0, 4/4 |
| src-tauri `cargo build --bins` | 0, 12.07s |
| src-tauri `cargo test --bins` | 0, 3.41s |
| frontend `cmd /d /c "node verify-webview.mjs > webview-task2-health.txt 2>&1"` | 0, actual mounted health remains functional; simulator catalog honestly unavailable |

Latest real WebView: host **22804**, JVM **17312**, launcher **31716**, rendered uptime **195ms**, JVM **21.0.12**; native close True, host exit 0 and JVM terminated. `frontend/webview-task2-health.txt` captures mounted DOM including actual catalog rejection. Task 1 successful prior evidence is separately preserved in `DESKTOP_BRIDGE_CONTINUATION_RESULTS.md` and `frontend/webview-verification.txt`.

## Pending / limitations

- Need backend installDist refresh before actual simulator path can be tested. No claim that dryrun artifacts were generated by this UI yet.
- Architect shared TS file is stale versus markdown: still declares removed events and omits capture.getProgress. Frontend uses narrow local progress shape until synchronized.
- Contract lacks generation/revision/allowedActions, initial session discovery, composed-preview readback, inactivity and effect/bundle catalog. SessionStorage holds session identity for reconciliation, but no ordered revision claim is made. Back edges intentionally omit photo Back per Designer despite markdown's conflicting edge.
- Current simulator implementation is an integration scaffold requiring refinement: polling/mutation overlap race, StrictMode effect cancellation generations, bounded image validation, typed method mapping, preview invalidation across Back/layout/session changes, unknown-outcome freezing and command correlation tests remain before acceptance. Do not treat this as production-ready or close milestone.
- Need simulator component tests and actual mounted full path for two fixture layouts, composed image decode/ratio, cancel/Back, reconnect, dryrun once, reset, viewport/DPI, failures. Existing four health tests are not simulator coverage.
- No hardware, production services or V1 operations performed. UI Designer and Tester-Reviewer review requested after backend integration and remaining fixes.
