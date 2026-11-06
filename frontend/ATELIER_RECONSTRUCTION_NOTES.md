# Atelier frontend presentation migration

The customer kiosk and six operator tabs now share one stylesheet entry: `src/styles.css`. Ordered layers are tokens → shared kiosk chrome → customer stages (including payment/camera) → operator/settings. The existing React handlers, IPC actions, selectors, and backend-owned data remain in place. The separate connected simulator continues to be explicitly labelled as a simulator; no test invokes real payment or printing.

Customer surfaces covered: Welcome, Layout, Quantity, Payment, Prepare, Capture, Photo selection, Frame selection, Confirm, Printing and Delivery, plus connection/error/cancel overlays. Operator coverage: Frames, Layouts, Settings, Tools, Colors and Revenue.

Verification from `frontend/`: `npm run test` — 61/61 passed; `npm run build` — TypeScript and Vite passed. These checks do **not** establish CDP pixel geometry, payment QR stability on a real display, contrast at Windows scaling, or hardware readiness. Request UI Designer and Tester-Reviewer screenshot/CDP review at 1280×800 and 1920×1200 (100/125/150% scaling) before considering this milestone closed. Canon capture, physical print transmission, and production payment remain backend/hardware-gated; simulator progress is not hardware evidence.
