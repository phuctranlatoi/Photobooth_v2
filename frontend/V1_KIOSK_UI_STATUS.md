# V1-style kiosk UI baseline (simulator only)

Implemented Vietnamese screens: welcome, layout, quantity, simulator payment, preparation, synthetic capture, selection, frames, confirmation, dryrun progress, delivery, and existing six-tab operator workspace. V1 palette, Segoe UI, 16:10 responsive spacing, native-ratio image containment, camera-black capture and touch buttons are in `src/kiosk-v1.css`.

Integration uses only installed `simulator_request`: `catalog.get`, `session.getState`, session/layout/quantity commands, `payment.mockComplete`, `capture.startSequence`, selection/frame commands, `print.confirmDryRun`, finish/back/cancel and `frame.list`. The Kotlin state snapshot is authoritative. Polling cleans up on unmount; commands use a synchronous intent latch and uncertain commands are never replayed. Errors require state reconciliation.

**Important limits:** no real payment QR, camera, printer, album QR, Beauty, effects, revenue, frame import, calculator or LUT import contract exists here. The visible operator tabs reuse existing `Operator`/`V1Settings` and explicitly disable unsupported operations. Quantity price is shown only when it matches the authoritative snapshot. There is no browser camera fallback. A simulator dryrun does not create revenue or print paper. Hardware/device validation and pixel-by-pixel V1 Compose review are outstanding.

Frontend tests: `npm run build` and `npm test` from V2 `frontend/`. Request UI Designer and Tester-Reviewer review before declaring the design milestone complete.
