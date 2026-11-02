# Redesign progress — 2026-11-02

## Delivered in this pass

- Polished customer-facing CSS in `frontend/src/kiosk-v1.css`: floating print paper with realistic shadow and no white wrapper; champagne frame selection and tactile check; active/peeking carousel; larger selection photos and composition; bigger confirm preview and clear disabled print state; frosted staff keypad; scoped graphite operator styling.
- Refined `frontend/src/screens/payment.css`: stable responsive VietQR footprint without loading/error layout jump; white QR plane stays opaque to remain scannable.
- Existing `FrameScreen` already has direct touch frame selection followed by backend acknowledgement/confirmation; **no Continue button reintroduced**. Existing selection and print confirmation are retained because they are real state/payment/print gates.
- Reviewed eight requested TSX/CSS entry points and additional imported styles. No changes to business rules, payments, camera, printer, database, or V1.
- Tests: 50/50 pass. Production frontend build passes.

## Not done / blockers

1. No screenshot, Playwright visual comparison or physical Windows touch-panel test was performed; **do not describe the UI as visually verified** at 1280×800, 1920×1200 or Windows scaling 125/150%.
2. Payment's literal client-side PIN `1234` and `payment.mockComplete` are unsafe for production staff access. Escalate to architect/backend; do not mistake a frosted modal for authentication.
3. Capture countdown currently overlays the center of the live preview; move it off face region without compromising readability or camera aspect correctness. Review with camera/architect before editing live view geometry.
4. The stylesheet has multiple inherited token/redefinition layers. This scoped override improves the requested screens but is **not** a complete UI architecture replacement; consolidate into a documented design system and component contracts in a dedicated pass.
5. For screen-reader/touch use, review hold-to-zoom (provide non-hold alternative), active focus, frame command failure indication, and long-text clipping. Operator tabs and status are simulator-only and cannot claim real device health.

## Release visual acceptance checklist

- At 1280×800 and 1920×1200, with Windows display scaling 100/125/150%, capture screenshots of Welcome, layout, quantity, payment (loading/ready/error/PIN), prep, live/countdown, select, frames, confirm (armed/disabled), printing/QR/finish, and operator tabs. Check `document.documentElement.scrollWidth <= innerWidth`, customer shell no vertical window scroll, and reachable internal lists.
- Verify composed paper takes at least the intended half of its stage without cropping; QR stays square and scans; photographer's faces never sit behind countdown/control panels; configured shot count/countdown are rendered rather than example constants.
- Tap every card edge and secondary control (minimum 48 CSS px), spam tap actions, hold/drag and release, trigger backend rejection, restart/recover session and verify **no duplicate print or payment skip**.
- Test long Vietnamese layout/frame names and 150% scaling, keyboard focus, high contrast, reduced motion, disconnected camera/printer, QR failure, empty catalogs and screen-reader announcements.

## Typography and V1-compatible photo workspace follow-up (2026-11-02)

- Audited all ten requested customer screens and shared `KioskUI` typography. Added scoped final CSS for unified header/section/action type, consistent shell and floating action-bar spacing, split proportions and 14px photo/frame tile gaps; long headings/subtitles wrap, frame names show two lines rather than single-line clipping. 1280×800 compact styles preserve 56px actions and local grid scrolling.
- Preserved the existing layout choice, backend selection confirmation, frame confirmation and one-shot print gates. Added an explicit 56px touch zoom affordance to each valid captured photo, showing the original provided preview URL with `object-fit: contain`, a 64px close control and Escape; hold-to-view still works. No image upscaling or business-rule changes.
- Moved existing countdown presentation into a reserved matte rail to avoid the center of faces while keeping the 3:2 Live View/crop element unchanged. Shot progress and start shutter remain visible and configured values still come from layout/backend. Source-level only: preview orientation, multi-digit timers and actual face clearance require camera fixture/device checks.
- Validation: `npm test -- --run` **7 files, 53 tests passed**; `npm run build` **passed**. Physical Windows 1280×800 / 1920×1200 at 100/125/150% and long-language screenshots **not performed**; CSS values alone cannot prove pixel fit. Previous mock PIN/security and backend rejection caveats remain open. V1 untouched.

## Latest three-screen polish and audit (2026-11-02)

- Capture: scoped final CSS reserves a matte right-side rail for progress, booth-distance countdown and centered shutter; face/crop remain within the image stage. Preserve natural live-image ratio, mirror, configured crop/count and `capture.startSequence`. Needs actual camera/viewport screenshot proof.
- Selection: audited current TSX: **no plus-sign button**; numbered image tiles, 500ms hold, 90%-black contain lightbox and release-to-close. Earlier notes about a separate 56px zoom button refer to an older state; currently no touch alternative to hold. Confirm accessibility solution with frontend without accidental select.
- Frames: two-column gallery with champagne `#C58C6A` selection/check and backend-capped 960px thumbnails. Prefer authoritative composition for the acknowledged frame; keep temporary photo/overlay while waiting. Backend cannot restore a low-resolution source frame; replace inadequate source assets. Keep `frame.select`/`frame.confirm` gates.
- Ran `npm test -- --run`: **8 files, 55 tests passed**, and `npm run build`: **passed after latest scoped CSS/preview adjustment**. No rendered screenshot, DPI matrix, hardware camera, printer, QR payment or production staff authorization was tested. V1 untouched.

## Three-screen verification update — 2026-11-02 (latest implementation)

- **Supersedes previous side-rail account above:** Capture is now a full-viewport, centered, aspect-fitted mirrored Live View with no rail. Final CSS draws a 3px white crop guide with dark outside mask, top-center `Ảnh X/Y` pill, giant **dead-center** countdown, bottom-center 108px/84px shutter with `Chạm để chụp`, and full-screen `CAPTURING` flash. Shot count, photo aspect and countdown remain backend/config-driven; only the first LIVE_VIEW shows the start shutter. Center digits/scrim now obscure faces; get explicit product signoff after camera images and real display review rather than treating previous face-clearance statement as valid.
- Selection has 2 landscape / 3 portrait thumbnail columns at final CSS precedence, no plus button, 500ms hold-to-zoom with 90% dark overlay, right `PrintPreview` and bottom gated `Tiếp tục →`. Hold-only zoom remains an accessibility issue; verify pointer release and rejected selection on hardware.
- Frames have left large `PrintPreview`, right two-column gallery with selected champagne border and bottom `Quay lại`/`Xem bản in →`. Real selection/confirmation commands preserved; placeholder art must not be described as a finished print.
- Executed again from `frontend/`: `npm test -- --run` **8/8 files, 55/55 tests passed**; `npm run build` **passed**. Source/CSS and automated check only: **no** screenshots, Playwright viewport metrics, 1280×800 / 1920×1200 or Windows 100/125/150% measurements. V1 untouched. Remaining acceptance: face occlusion/crop accuracy, reduced-motion flash feedback, language overflow, touch hitboxes and keyboard-accessible zoom on actual displays.
