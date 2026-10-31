# Connected simulator customer UI — implementation handoff

2026-10-30 · Task 2 · documentation only. Continues the selected **Gallery / margin countdown** direction in `UI_DESIGN_SYSTEM.md` and legal actions in `UI_SCREEN_CONTRACTS.md`. Does not replace architecture, authorize a new IPC contract, or declare a working customer slice.

## 1. Actual baseline and implementation boundary

Read: both UI documents; authoritative `FEATURE_PARITY_MATRIX.md` (especially S04–S19, I04–I06, U01); `IPC_CONTRACTS.md`; current `frontend/src/App.tsx`, `bridge.ts`; Kotlin `IpcMain.kt`, `SessionStateMachine.kt`, `SimulatorAuthorization.kt`.

**Current connection is health-only.** React invokes `health_check`; Kotlin advertises only `health.check`. No session snapshots, commands, image stream or composed previews exist in that bridge. The Kotlin state holder permits arbitrary assignment and is explicitly not an authorization boundary. SimulatorAuthorization gates synthetic capture only; it does not provide a customer flow. Do not turn the disabled Start into a local React slideshow or treat health success as session readiness.

Next frontend slice must consume **actual Kotlin simulator snapshots and command outcomes**, once backend/host provide an approved extension. The mappings below are required semantic bindings, **not existing RPC names**. Until those bindings exist, show “Simulator session connection unavailable” and keep Start disabled. A browser-only fixture may test components but must never claim a connected Kotlin session.

No actual bundle catalog, licensed gallery imagery, live synthetic feed, frame assets or composed output was established by this inspection. Populate only from backend-advertised simulator fixtures/catalog; label fixtures “SIMULATOR SAMPLE”. Missing assets get explicit placeholders/errors, never invented purchasable bundles or a fake final composition. Do not use customer images or production credentials.

## 2. Minimal composition / state ownership

`SimulatorSessionShell` owns bridge connectivity, latest accepted snapshot, pending request correlation and persistent **SIMULATOR · No real payment or printing** label. Render phase-specific content inside it; do not maintain a second route/state machine.

| Component | Kotlin-owned input | Request intent / transient UI only |
|---|---|---|
| `WelcomeSpread` | phase, simulator capability, available bundles/layouts | start or select actual bundle; gallery page |
| `StudioSetup` + `QuantityPicker` | layouts, effects, selection, canonical quantity/price | choose layout/effect, confirm setup, choose quantity/payment; local setup substep only |
| `SimulatorPaymentGate` | pending order/session, frozen amount, simulator authorization, payment status | explicit simulate-payment request; no automatic approval |
| `PhotoStage` + `CountdownRail` | phase, synthetic image handle/metadata, shotCount, countdown, completed captures | start capture flow only in LIVE_VIEW |
| `MomentGrid` + `CancellationMenu` | moments/readiness, selected IDs/order, selectCount, remaining inactivity | toggle moment, confirm exact selection; cancel confirmation visibility |
| `FrameGallery` | compatible frames, selected frame, preview readiness | choose frame, confirm frame, legal Back/cancel |
| `PrintConfirmation` + `AspectPreview` | authoritative composed artifact/revision, copies, summary, print eligibility | manual confirm dryrun, legal Back |
| `JobStatus` + `DeliveryPanel` | dryrun job/result, origin, optional simulator QR, reset outcome | finish/reset only on backend-allowed completion surface |

Reuse `CommandButton`, `StatusNotice`, `AspectPreview`, `TimedSelectionHeader`. Local state may hold focus, scroll position, dialog visibility and pending feedback, never payment success, selected business values, countdown progression, capture count, print result or revenue eligibility.

Required backend-to-frontend semantics: simulator mode/capabilities; session identity/generation and ordered snapshot revision; phase and allowed actions; canonical configuration/quote; moment and frame identities/readiness; countdown and inactivity values; safe image handles with aspect/orientation; composition revision tied to selections/frame/layout; command accepted/rejected outcome; dryrun origin/status/result and reset outcome. Exact field names/transport remain architect-owned. Do not add speculative calls to the health-only bridge.

Accept only the active session/generation and newer snapshots. Initial state comes from Kotlin, not a default IDLE assumption. A command acceptance alone does not advance the screen: wait for the authoritative snapshot. Unknown outcome/disconnect freezes mutations and labels the last snapshot stale; resync through the approved bridge, never replay payment/capture/print automatically. New generation clears prior images, pending intents and dialogs.

## 3. Connected screen sequence

| Phase / entrance | Presentation and actual next action | Pending, empty and exit behavior |
|---|---|---|
| **IDLE — Welcome** | Ivory editorial invitation, black “Start simulator session”; right gallery only for supplied bundles. Bundle cards name actual contents, not fabricated prices. | Start waits for Kotlin SELECTING. Valid special bundle may go directly to quantity; missing target stays truthful. Missing catalog: explain unavailable, no clickable sample packages. No new public Admin shortcut. |
| **SELECTING — layout/effect** | Contained frame/layout examples; explicit selected check. Enabled effects only. “Continue” requests existing setup confirmation. | No-layout/error disables continuation with reason. Preserve local setup Back and root-to-IDLE behavior. No new Beauty controls. |
| **SELECTING_QUANTITY** | Finger-sized +/-; canonical copies and price breakdown. “Continue to simulator payment”. Counts for captures/selection are separate from copies. | Retain pricing sanitation/freeze rules, not a designer-defined upper limit. Back requests setup. Hold never auto-repeats. Wait for PAYMENT_PENDING. |
| **PAYMENT_PENDING — explicit simulator gate** | Heading “Simulator payment”; frozen amount and “No money will be charged”. Primary **“Simulate payment approval”** only if backend advertises simulator authorization. | This is an explicit test-only operation, not public “I paid”, PayOS confirmation or a production bypass. No real checkout QR. Pending/rejected stay on gate; only backend approval enters PREPARING. Back follows payment→quantity and invalidates pending payment work. No fake success on timeout. |
| **PREPARING** | Large brief pose instructions; “Preparing simulator camera”. | No Ready/Skip/Back. Backend owns existing preparation interval (V1 1600 ms), not a React timer. Missing feed is not readiness. |
| **LIVE_VIEW** | Black aspect-contained synthetic feed, visible “SIMULATOR CAMERA”; separate rail shows configured capture total and large “Start capture”. | One request, latched immediately. No hardware toolbar, import, retake, cancel or Back. Feed unavailable: clear notice; readiness/eligibility from backend, not a guessed device count. |
| **COUNTDOWN ↔ CAPTURING** | Same mounted stage; giant backend numeral in rail, phase text, `Photo {completed}/{shotCount}`. Capturing/processing have distinct labels, not fake percentages. | No shutter during active sequence. Kotlin owns repetitions and configured countdownSeconds; React never decrements or advances. Do not show failed/pending moments as successful photos. Backend alone enters selection. |
| **SELECTING_PHOTOS** | Grid of actual synthetic moments, ordered selection marks, large contained selected preview, `{selected}/{selectCount}` and backend inactivity notice. “Continue” requires exactly configured selectCount ready moments. | Missing/processing moments nonselectable with explanation. No functional Back/retake (legacy photo Back is no-op). Existing three-dot cancel confirmation only here and EDITING. No global Home. |
| **EDITING — frame** | Compatible supplied frame thumbnails; contained composition if supplied, otherwise clearly “Preview unavailable”, not a CSS approximation labeled final. | Back→photos. Three-dot cancel confirmation retained. Empty frame policy is unresolved in parity S12: block claiming a valid preview/confirm until backend explicitly establishes eligibility; do not invent a default frame. Frame import is not added. |
| **PRINT_PENDING — authoritative preview** | Largest contained Kotlin-composed artifact; copies/layout/frame summary. Heading “Preview · dryrun”; primary **“Confirm dryrun”** and “No paper will print. No sale will be recorded.” | Artifact must match active composition revision. Missing/stale/error artifact: placeholder and disabled confirmation with reason, pending backend eligibility contract. Never reconstruct final output from thumbnails/CSS slots. Back→frame only when no unresolved command. Composition work may be inline loading; do not invent an extra customer stage from the unused COMPOSING enum. |
| **PRINTING — dryrun status** | “Preparing dryrun” / actual backend-supported status, always dryrun labeled. | No real printer submission, paid album creation, production upload or production revenue. No Back, cancel, reprint or blind retry. Failure renders actual result; recovery actions only if backend explicitly permits them. Never say “Printed”. |
| **DELIVERY — complete/reset** | “Dryrun complete” only after successful authoritative result. Optional backend-generated simulator artifact/QR, explicitly non-production. Large **“Finish simulator session”**. | Missing QR is “No simulator delivery link”; never fabricate a real album. Finish requests backend reset; return Welcome only on new IDLE snapshot. Reset pending disables Finish; rejection remains visible. Late prior-session events cannot restore images. DELIVERY is completion, not an added finish route. |

## 4. Inactivity, cancellation and accounting invariants

- Timers are Kotlin-owned. Render supplied remaining inactivity time in selection/frame/confirm where active; never introduce a universal idle-to-Welcome reset or reset time on every touch.
- Existing inactivity behavior fills missing selections, chooses a frame and calls print with **userConfirmed=false**. In simulator it must remain a **dryrun**, not wait for a fabricated manual click. Explain: “When time runs out, the simulator will complete the selection and run a dryrun automatically.” Do not dispatch a second confirm when UI time reaches zero. Backend decides actual transition and manual/timeout race winner.
- Manual button maps to **userConfirmed=true**; timeout maps to false. Preserve the authoritative legacy revenue predicate: **manual confirmation AND successful print Result AND same active session** (S17). Payment, viewing preview, a composed image, spooler acceptance or timeout alone are not sales. In this simulator **neither path writes production revenue**, even if a diagnostic predicate would otherwise be true. Optional eligibility diagnostics must say “test only”, never present a real sale total.
- Cancel is available only in SELECTING_PHOTOS and EDITING through the existing menu + destructive confirmation. Default dialog focus: continue session. Copy: “End this simulator session and discard temporary photos?” Backend owns cleanup/reset and legal-state checks; dismissing sends nothing. Do not expose cancel in payment/prep/capture/confirm/printing/delivery.
- Exact routed Back edges: quantity→setup; payment→quantity; frame→photos; confirm→frame. Preserve local Studio setup Back. No navigation from browser/OS Back, no invented retake or payment bypass. Pending mutation disables conflicting Back/cancel until authoritative outcome/resync.

## 5. Presentation and touch implementation constraints

Use existing tokens: ivory `#F6F2EA`, ink `#191817`, restrained champagne rules; system Segoe UI/Arial, no font assets. Keep diagnostic internals out of the customer composition; persistent simulator label must remain conspicuous, not tiny footer-only text.

Use responsive CSS, never a scaled bitmap. Wide Welcome split and capture rail follow the established design. At 1280×800, reserve capture well x16/y88/w928/h696 and rail x960/y88/w304/h696; at 1920×1200 well x32/y112/w1440/h1056 and rail x1504/y112/w384/h1056. These are wells: image fits contain, metadata controls orientation/mirroring. Countdown never overlays faces. At compact DPI-derived viewports reduce chrome and allow non-capture content to scroll above fixed CTA, not shrink targets.

Primary controls ≥64 CSS px (Welcome preferably 80), other targets ≥48×48, gaps ≥12. Preserve visible selected/disabled/pending labels and focus. One pointer-up gesture → one request; pointercancel/scroll cancels activation, long hold does not repeat. Latch across component remounts until matching outcome/snapshot; debounce alone is not idempotency. Reduced motion removes entrance translation/flash; stream stays mounted while countdown changes. No animation or optional haptic gates capture. Images/QR keep true aspect/quiet zone. Error notices are inline decorations unless Kotlin supplies a real recovery phase; never silently return Home.

## 6. Frontend acceptance for next slice

1. **Connection:** actual host→Kotlin session snapshots drive every screen; health-only, plain browser, lost connection and unknown capabilities cannot start a faux session. No React-owned progression timers. Capture/print command rejection leaves truthful state.
2. **Full path:** normal layout/effect→quantity→explicit simulator payment→prep→live→configured capture loop→exact photo selection→frame→authoritative composition→manual dryrun→complete→backend reset. Separately test actual special-bundle branch and missing target/catalog/assets.
3. **Configuration:** exercise at least two backend fixtures with different shotCount, selectCount and countdownSeconds; no hardcoded dot count, copy-to-shot assumption or frontend countdown. Large counts/numerals wrap without clipping.
4. **Authority/races:** stale session/revision ignored; delayed payment after Back, capture result after reset, frame change while composing, double confirm and manual-vs-inactivity race cannot advance twice or display the wrong composition. Preview revision mismatch disables manual confirmation.
5. **Timeout/cancel:** exact auto-fill/auto-frame/dryrun behavior; no frontend timeout command, no timeout sale. Cancel menu/dialog only in two allowed phases; dismiss preserves session; cleanup/reset follows backend. All legal Back edges preserved; no retake.
6. **Safety/accounting:** manual and timeout results both marked dryrun, production payment/printer/cloud/revenue adapters never invoked. Manual diagnostic eligibility requires success + same session; timeout, error and stale-session results are never eligible. Assert zero production revenue writes in both paths, not merely hidden UI totals.
7. **Touch/layout:** measure targets and exercise hold, double tap, scroll cancellation, reduced motion and keyboard focus at physical 1920×1200 and 1280×800 with Windows 100/125/150% (CSS down to approximately 853×533). Long Vietnamese/Korean names and 200% text must not hide price/count/CTA. Test portrait/landscape feeds and output strips without stretch or face overlays.
8. **Truthful finish/errors:** no artifact ≠ composed preview; no feed ≠ live camera; no QR ≠ delivered album; dryrun ≠ printed. Disconnect and dryrun failures never expose unsupported retry/reset. Finish clears prior customer imagery only with acknowledged reset; no stale event leakage.

**Delivery evidence:** this file only. No frontend/backend edits, commands, tests, hardware, production service access or V1 inspection/writes performed for this task. These are implementation acceptance requirements, not executed test results. Connected implementation remains blocked on the approved Kotlin simulator session/snapshot/image/command extension; current bridge remains health-only.
