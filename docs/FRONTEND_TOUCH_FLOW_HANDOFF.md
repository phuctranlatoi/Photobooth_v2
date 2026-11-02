# Frontend touchscreen flow handoff (V2)

Implemented customer screens: Studio layout carousel (centered-card confirm), payment QR/error/retry with staff-only PIN keypad, frame picker (single-tap backend select then confirm), and final print confirmation (500 ms arming window). Photo selection continues to require explicit quota review. PrintPreview uses transparent containers and floating paper shadows.

Contracts used: `session.setLayout`, `session.confirmSetup`, `frame.select`, `frame.confirm` (with `frameId`), `payment.createLink`, `payment.checkStatus`, `payment.mockComplete` (with `staffOverride` and `method: TIEN_MAT`), `session.back`, `print.confirmReal` / `print.confirmDryRun`. KioskSimulator returns backend command success/failure to the frame selector so it cannot confirm after a rejected selection; the backend remains state authority.

Verification: `frontend/npm test -- --run` (50 passed) and `frontend/npm run build` (TypeScript and Vite passed). These are DOM tests, not physical 1280×800/1920×1200 touch-display validation. The existing backend simulator remains a simulator: camera, PayOS, print queue and QR delivery were not verified on hardware here. No live payment or print was initiated.

**Security release blocker:** the requested default staff PIN `1234` is checked in the frontend and is discoverable in bundled JS. This is a usability gate, not secure operator authentication; backend must independently verify an operator token/secret and reject `staffOverride` from unauthenticated production clients. Do not ship cash authorization as production-secure until that contract is implemented and tested. Request UI Designer and Tester-Reviewer review before closing this milestone.
