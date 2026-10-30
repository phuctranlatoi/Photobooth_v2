# V1 session state machine audit

Status: SOURCE INSPECTED ONLY, 2026-10-30. No implementation or execution. Paths below are relative to V1 `src/main/kotlin/com/phuctran/photobooth/desktop/`. Read AGENTS, master directive and backend-agent instructions. V1 inspection used read/glob/grep only; no baseline comparison was performed, so unchanged status is not independently verified.

## Authority and actual transitions

`domain/SessionStateMachine.kt:7-24` declares IDLE, SELECTING, SELECTING_QUANTITY, PAYMENT_PENDING, PREPARING, LIVE_VIEW, COUNTDOWN, CAPTURING, SELECTING_PHOTOS, EDITING, COMPOSING, PRINT_PENDING, PRINTING, DELIVERY, RECOVERY, OUT_OF_SERVICE, ADMIN. **It is not a guarded transition graph**: `transitionTo` simply assigns state (:31-33). Do not infer legal edges from enum order. COMPOSING/RECOVERY/OUT_OF_SERVICE are declared, not demonstrated recovery workflows here.

| Trigger | Observed target/guard | Evidence |
|---|---|---|
| Start / admin | SELECTING / ADMIN | `Main.kt:126-133` |
| Layout choice | Updates layout, clears moments; no transition | `controller/DesktopBoothController.kt:313-320` |
| Special bundle | Target layout must exist; SELECTING_QUANTITY | controller :323-335 |
| Confirm setup | SELECTING_QUANTITY; freezes initial pricing | controller :349-354 |
| Quantity/payment | Sanitizes quantity, freezes pricing; PAYMENT_PENDING | controller :356-385 |
| Payment completion | PREPARING → start Live View → delay 1600 ms → LIVE_VIEW | controller :388-397 |
| Capture | Active capture job suppresses duplicate start; COUNTDOWN → CAPTURING → LIVE_VIEW per shot, then SELECTING_PHOTOS | controller :436-594 |
| Select photo | Toggle capped at layout.selectCount, non-null path | controller :672-680 |
| Confirm photos | Exact selectCount required → EDITING (frame selection) | controller :682-688 |
| Confirm frame | PRINT_PENDING; no additional guard shown | controller :708-715 |
| Confirm & Print | PRINTING → DELIVERY | controller :717-853; `Main.kt:234-244` |
| Finish | Cancels delivery job; reset → IDLE | controller :920-924, :964-986 |

Back edges are explicitly SELECTING_QUANTITY→SELECTING, PAYMENT_PENDING→SELECTING_QUANTITY (stops local poll), EDITING→SELECTING_PHOTOS, PRINT_PENDING→EDITING; all others no-op (`goBack`, :950-961). Main also wires selecting-back directly to IDLE (:159). This is navigation, not permission to cancel a paid session everywhere.

## Dynamic capture and timers

`model/BoothModels.kt:20-28` separates `shotCount`, `selectCount`, `countdownSeconds` (default 3 is a default, not universal policy). Capture snapshots selected layout (:447), loops `1..layout.shotCount` (:448), counts `layout.countdownSeconds downTo 1` (:459-502). Preserve independent values and selection count. `saveLayoutConfig` sends price/count/countdown to Firebase and copies those fields into available/selected layouts (:1033-1052); persistence success/initial load and Firebase implementation require separate verification. Do not claim local durable persistence from this setter alone.

Selection inactivity handler fills missing selections from captured order, chooses first available frame if empty, and calls `startPrinting(userConfirmed=false)` (:291-310). This **can print automatically but must not recognize revenue**. Timers start on SELECTING_PHOTOS/EDITING; see controller :222-289. Preserve timeout versus manual-confirm distinction.

## Cancellation, IDs, asynchronous boundaries

`cancelSession(): Boolean` rejects all states except SELECTING_PHOTOS and EDITING (:926-927). It cancels Beauty/capture/inactivity/encoding, resets, then deletes only a normalized direct child of sessions root (:928-946). UI exposes `SessionCancellationMenu` in `SelectPhotosScreen.kt:106` and `FrameScreen.kt:80`; hidden-menu gesture details are not independently inspected. No refund is demonstrated by cancellation. Never expose unrestricted cancellation in V2.

Capture creates UUID once (:440); printing has UUID fallback (:721). `captureStill` has an additional timestamp-format fallback at :1182 (dependency needs characterization). PayOS uses separate millisecond order code (:368), not this UUID. Album uses `externalSessionId` (:732), sale uses `sessionId` (:834), persisted BoothSession uses same ID (:903). Do not conflate order ID, session ID, album ID or access token.

## Print/revenue gate and weaknesses

Print success is `printerService.printImage(...).onSuccess { accepted=true }` (:760-790), **not proven physical completion**. Dry-run/render-only stays false (:777-781). Revenue condition is exactly `userConfirmed && printJob.await() && currentSessionId == sessionId` (:842), followed by local record and asynchronous sync (:844-848). Render, QR creation or paid status alone do not recognize revenue.

Local duplicate revenue is prevented by SQLite UNIQUE session_id and INSERT OR IGNORE (`data/SalesRepository.kt:21,49-57`); pending sync serializes on syncLock (:110-126). **Duplicate physical print is not proven prevented**: `startPrinting` cancels the previous delivery job but has no durable submitted-job guard (:717-720). Cancellation cannot reliably undo an already dispatched OS job. No durable print/restart reconciliation was established. Background video/session tasks read mutable current selection (:864-915), creating stale-session risk. Backend command gating, immutable snapshots and durable print reconciliation need architect approval; these are required safety adaptations, not claims about V1.

## Minimal proposed reuse slice / acceptance

After architecture contract only: copy layout models, pricing, image processor/compositor and controller-derived orchestration into V2-owned modules; wrap capture, printer, payment, album and revenue with mock-default adapters. Preserve edges above, dynamic data and revenue gate; replace Compose-driven state access with backend-owned commands, not frontend side effects. Do not copy arbitrary public `transitionTo` as unrestricted IPC.

Required future tests (NOT RUN): differing shot/select/countdown configurations; every listed edge and illegal command; cancellation state matrix; timeout auto-print no sale; failed payment; duplicate touch print; same-ID revenue retry; restart after enqueue/before sale; stale callback after reset; corrupt capture and Beauty failure. V1's silent dummy capture fallback (:508-533) must be explicitly simulation-labeled in V2, never represented as camera success.
