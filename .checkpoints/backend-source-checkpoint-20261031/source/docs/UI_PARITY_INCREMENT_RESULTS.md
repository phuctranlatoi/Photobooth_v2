# Bounded frontend parity increment — 2026-10-30

## Implemented
- Welcome now calls existing typed `session.start` directly using catalog `defaultLayoutId`, validated against catalog layouts. Removed mandatory frontend-only collection stage. SELECTING remains backend-owned layout setup; no payment/capture bypass.
- Photo selection offers full-screen original inspection, contain-fit orientation preservation, Escape/close, single-control focus containment and focus restoration. Inspection never changes selection/order.
- Explicit unavailable capture-source/import/refresh, custom PNG import, delivery folder/album controls with specific missing-contract reasons. No fake uploads, bundles, camera or payment paths.
- Existing cancellation visibility, Back gates, explicit LIVE_VIEW shutter, selection → EDITING → PRINT_PENDING, composition, reload reconciliation and command latch unchanged.

## Files
`frontend/src/Simulator.tsx`, `frontend/src/Simulator.test.tsx`, `frontend/src/components/PhotoPreview.tsx`, `frontend/src/components/PhotoPreview.test.tsx`, `frontend/src/preview.css`, `frontend/src/main.tsx`, `frontend/verify-simulator.mjs`.

## Evidence
- `npm test -- --reporter=dot`: exit 0, 4 files / 12 tests passed (includes original ten component tests plus two modal tests).
- `npm run build`: exit 0, strict TypeScript + Vite passed.
- `node verify-simulator.mjs`: exit 0, actual mounted Windows WebView/Kotlin simulator, both 1280×800 and 1920×1200; two layouts, direct Welcome Start, quantity/payment mock, explicit capture, photo selection, original full-screen inspection, frames, dryrun confirmation, reload recovery, delivery and six existing operator tabs. Both frame action-region checks passed. Host exit 0; JVM terminated.
- Screenshots: `frontend/simulator-evidence/`, including `original-fullscreen-0.png`, `original-fullscreen-1.png`, customer stage and `operator-*-1280.png` / `operator-*-1920.png` images. Log `parity-increment-run.log`.

## Remaining / review request
No full parity claim. Existing six operator tabs retained but source-complete group expansion, source five-tap operator entry, optional event panel and payment hold panel remain unimplemented in this increment. Operator mutation was not enabled in this mounted run. No real payment, DB, cloud, print or camera access. Native host not rebuilt; existing debug host loaded current frontend. Physical touch/DPI and independent screenshot review remain outstanding. UI Designer and Tester-Reviewer: review direct Start and original inspection plus unchanged action region before milestone closure.

V1 inspection was source-only (`StartScreen.kt`); V1 untouched. No Kotlin/session API or architecture edits.

## Follow-up gesture/control increment
- Implemented source five-tap Welcome wordmark (`StartScreen.kt:65–73`) opening existing operator workspace only in IDLE. Developer operator/diagnostics shortcuts are now `import.meta.env.DEV` only. Gesture does not authorize operator mutations; backend default-deny remains intact.
- Implemented Payment title hold (`PaymentScreen.kt:40–43`) revealing an explicitly SIMULATOR staff panel. Hold only reveals controls; approval requires a separate press using existing latched `payment.mockComplete`. Pointer release, cancellation, exit and movement cancel pending recognition. Standard test approval remains visible: intentional simulator parity decision, not a real cash override.
- Operator inventory now distinguishes disabled named actions (import/delete/generate/copy/save/refresh/adjust/void) from disabled named fields; no fake saves or totals. Existing six tabs and safe layout persistence retained.
- New files: `frontend/src/components/StaffGestures.tsx`, `StaffGestures.test.tsx`, `frontend/src/vite-env.d.ts`; additional edits to App, StudioUI, Simulator, preview CSS and mounted harness.
- Tests: 5 files / 15 tests passed. Strict TS/Vite build exit 0. Mounted harness exit 0, both sizes, payment staff screenshots `payment-staff-0.png` and `payment-staff-1.png`, five-tap operator opening, full existing customer/reload/close checks. Log `frontend/simulator-evidence/parity-gestures-run.log`. No hardware/production operations. Final small additional disabled inventory labels require next build refresh; no executable behavior changed by those labels.
- Source-complete independent operator audit and visual review still requested; do not interpret inventory presence as functional parity or authentication.
- Final rerun after all inventory labels: 15 tests passed, build exit 0, mounted two-size harness exit 0. This supersedes the intermediate label-refresh caveat above.
