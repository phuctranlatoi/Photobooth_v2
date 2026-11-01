# Kiosk atelier UI handoff

Screens touched: Start (offline demo switch + event bundle shortcuts), Payment (demo disclosure and single-submit continuation), Capture (backend preview/countdown/flash), Select Photos, Frames, Confirm (backend-composed preview), Delivery. The existing studio/layout, quantity, prepare and printing screens inherit the ivory/coral token layer.

Contracts consumed: `catalog.get` layouts/defaultLayoutId/bundles; `device.getStatus.camera.connected`; `session.start({ layoutId, captureMode })`; `session.getState` captureMode/livePreviewDataUrl/secondsRemaining/shots/compositionDataUrl; `payment.mockComplete({ method: 'DEMO' })` for explicit demo sessions. REAL payment keeps `payment.createLink`, `payment.checkStatus`, and the staff cash override. `catalog.sync` is included in the typed method union but is **not** automatically called by customer screens. The backend remains authoritative for payment, timer, image composition and print routing.

Verification: `npm test` (38 passing) and `npm run build` (`tsc --noEmit && vite build`) from V2/frontend. CSS has 16:10/WXGA-height scaling, reduced-motion fallback and bounded viewport; verify visually on real 1920×1200 and 1280×800 touch displays before release.

Remaining limitations: no camera/printer/PayOS hardware proof from frontend tests; demo preview and dry-run print are **not** hardware support. Backend snapshot preview availability and actual output resolution need hardware and backend integration validation. Request UI Designer and Tester-Reviewer review before closing the milestone. V1 was not modified.
