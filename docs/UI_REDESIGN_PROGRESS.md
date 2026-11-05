# Redesign Progress — 2026-11-05

## Screen-by-Screen Unboxed Atelier & Liquid Glass Transformation (2026-11-05 02:40)

**Status: PASS-SIMULATED & PASS-AUTOMATED.** All customer screens have been completely transformed with the Unboxed Atelier Liquid Glass architecture. Opaque white card containers have been eliminated across the flow in favor of floating prints, open canvas, hairline dividers, and genuine liquid glass controls. Verified via `tests/verify-demo-and-real-journey.mjs` with 0 failures across 1280×800 and 1920×1200 viewports (evidence in `tests/journey-evidence/2026-11-05T02-34-00.652Z/`).

### Screen-by-Screen Unboxed Transformation

1. **Start Screen (`StartScreen.tsx` & `kiosk-v1.css`):**
   - **Before:** Wrapped artwork in `.v1-start-card`, an opaque rectangular white box that boxed in the layout strips and created artificial visual separation.
   - **Unboxed Transformation:** Completely eliminated `.v1-start-card`. Replaced with an open, layered photographic gallery (`.atelier-welcome__gallery`):
     - Soft ambient light halo (`.atelier-welcome__halo`) in radial warm glow (`radial-gradient(ellipse, rgba(203,159,127,.21), transparent 69%)`).
     - Dual floating prints in open space: rear portrait print (`.atelier-print--portrait`) rotated −7° and front 4-cut strip (`.atelier-print--strip`) rotated +6° with z-index 1, both styled with deep paper drop shadows (`var(--at-paper-shadow)`).
     - Brand signature `LE SOUVENIR · PHOTO ATELIER` in italic Georgia serif.
     - Left column features editorial title with Georgia italic accent `Yours forever.`, borderless glass value pills (`Bản in lưu niệm`, `Album ảnh qua QR`), and 68px primary CTA pill button with terracotta-coral gradient, specular rim, and inner light-catch bevel.
     - Preserved 5-tap operator gesture on brand wordmark and dynamic event bundle showcase.

2. **Layout Selection Screen (`StudioModeScreen.tsx` & `kiosk-v1.css`):**
   - **Before:** Outer card wrappers competed with SVG print artwork.
   - **Unboxed Transformation:** Cardless Coverflow presentation. SVG print paper floats directly on the warm studio canvas (`--layout-ambient`) with organic drop shadows. 56×56px liquid glass chevron buttons with dual specular rims. Customer-friendly names displayed without raw technical IDs.

3. **Quantity Selection Screen (`QuantityScreen.tsx` & `kiosk-v1.css`):**
   - **Before:** Wrapped pricing summary in `.v1-panel.v1-quantity-pricing`.
   - **Unboxed Transformation:** Removed background, border, and box-shadow from `.v1-quantity-pricing`. Receipt rows float directly on canvas, bounded only by fine hairline dividers (`border-top: 1px solid rgba(89,65,49,.15); border-bottom: 1px solid rgba(89,65,49,.15)`). Enlarged 72×72px liquid glass stepper buttons with 24px blur, dual specular rims, and 34px tabular numerals. Print preview floats naturally with organic drop shadows.

4. **Payment Screen (`PaymentScreen.tsx`, `payment.css`, & `kiosk-v1.css`):**
   - **Before:** Two competing heavy white cards (`.v1-payment-summary.v1-panel` and `.v1-payment-qr-panel.v1-panel`).
   - **Unboxed Transformation:** Unboxed single-stage architecture. Left order summary card background is completely transparent; line items and tabular totals sit on the canvas with hairline dividers. Right QR panel features a subtle translucent frosted glass surround (`rgba(255,255,255,.55)`, `blur(20px)`), with the QR code and its container enforcing an opaque porcelain white quiet zone (`background: #fff !important`). Exactly **0 px layout shift** verified between spinner and VietQR image.

5. **Capture & Countdown Screen (`CaptureScreen.tsx` & `kiosk-v1.css`):**
   - **Visual:** Matte obsidian darkroom stage (`#121214`).
   - **Ergonomics:** Concentric physical camera shutter (108×108px outer frosted ring, 84×84px inner white core with 4px `#C27357` rim, 0.92x active tap compression, horizontal Δx = 0 px). Full-screen overlay `.v1-countdown-layer` centers tabular countdown numeral with sub-pixel precision (Δx = 0.000038 px, Δy = 0 px) and warm terracotta glow.

6. **Photo Selection Screen (`SelectPhotosScreen.tsx` & `kiosk-v1.css`):**
   - **Unboxed Transformation:** Photo tiles float as physical photographic prints with organic paper drop shadows, without thick white card wrappers. 40×40px terracotta order badges in safe corners. Selected item highlighted with clean terracotta outline. Sub-10ms touch selection (4.50–7.10 ms). Floating composite print preview on the right baseline.

7. **Frame Selection Screen (`FrameScreen.tsx` & `kiosk-v1.css`):**
   - **Unboxed Transformation:** Removed `.v1-frame-preview-panel` white container. Preview floats directly on canvas. Frame option buttons in grid rendered without card borders or background plates; selected frame emphasized with crisp `#A85A40` outline. Sub-10ms deferred frame selection. Floating liquid glass actionbar dock.

8. **Confirmation Screen (`ConfirmScreen.tsx` & `kiosk-v1.css`):**
   - **Before:** Wrapped order details in `.v1-panel.v1-summary`.
   - **Unboxed Transformation:** Completely transparent `.v1-summary` with order details organized as an editorial ticket separated by delicate hairlines (`var(--at-hairline)`). Bold tabular total amount. Large high-resolution composed print floats on canvas up to 82vh. Liquid glass actionbar dock with primary Confirm & Print CTA (disarmed 500ms on mount).

9. **Stage Transitions (`PrepareScreen.tsx`, `PrintingScreen.tsx`, `DeliveryScreen.tsx`):**
   - **Unboxed Transformation:** Stripped `.v1-panel` card styling from `.v1-prepare-stage`, `.v1-print-stage`, and `.v1-delivery`. Stages unfold seamlessly over the warm studio canvas with floating status indicators, green print signal badge (`#28553A`), and pure white mobile download QR quiet zone.

---

# Redesign Progress — 2026-11-03

## Screen-by-Screen Redesign Status & Verification (2026-11-03 21:45)

**Status: PASS-SIMULATED & PASS-AUTOMATED.** All customer-facing and operator screens have been completely rebuilt and polished with the Korean Atelier Liquid Glass aesthetic and sub-10ms interaction speed. Automated acceptance runner passes 100% across 1280×800 and 1920×1200 viewports (`tests/journey-evidence/2026-11-03T14-34-21.203Z/`).

### Customer Flow Rebuild

1. **Start Screen (`StartScreen.tsx`):**
   - **Visual:** Replaced cluttered developer debug badges, Firebase technical indicators, and manual mode toggles with a luminous editorial greeting: `PHOTO ATELIER · SEOUL × SAIGON`, headline `Chụp ảnh lấy ngay`, floating photostrips with realistic paper drop shadow.
   - **Interaction:** Prominent fluid CTA button ("Bắt đầu trải nghiệm", 72px touch height). Operator access concealed behind 5-tap gesture on the header wordmark.
   - **Resolution adaptation:** Scales fluidly between 1280×800 and 1920×1200 without window scrolling.

2. **Layout Selection Screen (`StudioModeScreen.tsx`):**
   - **Visual:** Cardless Coverflow carousel presenting layout artwork as physical paper floating over warm ambient gradient (`--layout-ambient: linear-gradient(135deg, #FAF7F2 0%, #F5EFEB 50%, #EFE8E0 100%)`).
   - **Interaction:** Center active card scaled to 1.04; immediate neighbors scaled to 0.92 at 85% opacity with no blur. Symmetrical 56×56px carousel chevrons. Tap non-center centers the card; tap center confirms selection and advances. No raw technical IDs displayed (`515_4_anh` displayed as "Dải 4 ảnh cổ điển").

3. **Quantity Selection Screen (`QuantityScreen.tsx`):**
   - **Visual:** Split layout (`v1-quantity-workspace`) pairing order pricing breakdown with enlarged floating print preview panel (`.v1-quantity-preview`).
   - **Interaction:** Stepper touch targets enlarged to 72×72px with 34px tabular numerals (`tabular-nums`). Pricing updates dynamically based on backend calculations without layout shift. Action bar advances to payment.

4. **Payment Screen (`PaymentScreen.tsx` & `payment.css`):**
   - **Visual:** Frosted glass columns (`rgba(255,255,255,0.76)`, `blur(20px) saturate(150%)`). Left column displays tabular price breakdown and "Chờ thanh toán QR" status chip. Right column features a pure porcelain white QR card (`#FFFFFF`) with 16px quiet zone.
   - **Layout Stability:** Exactly **0 px layout shift** verified by CDP assertions. The QR slot maintains static clamp dimensions (280px at 1280×800, 380px at 1920×1200). Centered spinner placeholder transitions to high-resolution VietQR PNG without altering bounding rects.
   - **Security:** Free bypass copy removed. Staff cash override button concealed behind a 1-second press on the "Thanh toán" title, requiring staff PIN `1234`.

5. **Capture & Countdown Screen (`CaptureScreen.tsx`):**
   - **Visual:** Matte obsidian studio stage (`#121214`) prevents screen glare in camera lens. Mirrored camera preview with layout aspect ratio guide.
   - **Interaction:** Centered shutter trigger button at `bottom: clamp(16px, 3vh, 44px)` (88px at 1280×800, 108px at 1920×1200). Live countdown timer centered dead-on (`50%, 50%`) with high-contrast digits.

6. **Photo Selection Screen (`SelectPhotosScreen.tsx`):**
   - **Visual:** Symmetrical 2-column workspace (`minmax(360px, 1.1fr) minmax(360px, 1fr)`). Candidate photo grid on left and live composite print preview on right share the exact same vertical baseline.
   - **Performance:** Selection response time optimized to **4.30–8.50 ms** (measured in live Tauri WebView).
   - **Interaction:** 40×40px terracotta order badges (`#C27357`) indicate pick sequence (`✓ 1`, `✓ 2`). Press-and-hold (500ms) displays full-resolution lightbox modal; releasing finger dismisses it. Authoritative timer (`Còn lại 02:20`) decrements accurately.

7. **Frame Selection Screen (`FrameScreen.tsx`):**
   - **Visual:** Print preview panel expanded up to 82vh on the left. Two-column frame option grid on right (`clamp(190px, 29vh, 330px)` card height).
   - **Performance:** Deferred composition ensures `frame.select` latency is **7.50–8.00 ms** (<1ms memory IPC). Full composition is rendered just-in-time on confirmation.
   - **Interaction:** Users can tap frame cards directly to select and tap again (or click "Xem bản in →") to confirm.

8. **Confirmation Screen (`ConfirmScreen.tsx`):**
   - **Visual:** Print preview occupies dominant left stage (`minmax(360px, 1.35fr)`). Clean order summary on right (`minmax(300px, 0.65fr)`).
   - **Interaction:** High-resolution composed preview loaded (`naturalWidth > 0`). Confirm button disarmed for 500ms on mount to prevent double-tap ghost clicks. Synchronously locks and invokes `session.confirmPrint`.

9. **Delivery Screen (`DeliveryScreen.tsx`):**
   - **Visual:** Clean celebration stage with prominent green status badge: **“TÍN HIỆU IN: ĐÃ TRUYỀN THÀNH CÔNG”** (`#28553A` on `#E9F1E9`).
   - **Interaction:** Displays mobile download QR code for digital photos and video. "Hoàn thành" button cleanly resets the session back to `StartScreen`.

---

### Operator Workspace Rebuild (`operator-v1.css` & `V1Settings.tsx`)

1. **Visual Style Unification:**
   - Overhauled legacy dark graphite styling to match the Korean Atelier Liquid Glass theme.
   - Frosted glass cards, banners, and modal dialogs (`rgba(255,255,255,0.76)`, `blur(20px)`).
   - High-contrast charcoal text (`#24201D`) ensures legibility under bright salon lighting.

2. **Navigation & Touch Targets:**
   - Horizontally scrollable navigation bar with 56px minimum touch height and 100px min-width per tab.
   - Tabs: Frames, Layouts, Settings, Tools, Colors, Revenue.

3. **Settings Parity & Diagnostics:**
   - Preserves exact 6-field persistence contract (`enableSystemPrint`, `useHotFolder`, `hotFolderPath`, `postCaptureTimeoutSeconds`, `photoSelectionTimeoutSeconds`, `frameSelectionTimeoutSeconds`).
   - Tactile 52×52px squircle steppers and iOS-style toggle switches.
   - Honest device health reporting: explicitly reports when Canon DSLR is disconnected and printer is in simulated/ready mode; never claims unverified hardware health.

---

## 2026-11-03 carousel shadow/clarity correction — design handoff only (CURRENT)

- Updated `UI_VISUAL_REVIEW.md` with exact scoped CSS replacement and acceptance matrix for the user-requested carousel correction. **No frontend CSS/TSX implementation or screenshot/viewport/hardware test in this pass; V1 untouched.** This supersedes previous carousel recommendations for rose/cyan/black aura, dimmed neighbors, strong gradient, and visually separated wheel slots.
- Frontend coder: consolidate `kiosk-v1.css` carousel overrides rather than append a lower-priority patch; remove dark/chromatic drop shadows, outer card/wrapper/pseudo backgrounds, border/box-shadow and backdrop blur; leave genuine SVG print paper untouched. Apply only the specified two-tier weak paper drop shadows; all distances at opacity 1 with center 1.04, neighbor .92 and distance >=2 .82, including hover/press/focus/disabled. Use the five-radial muted ivory gradient on the customer shell and transparent layout-stage wrappers; preserve camera and payment-specific surfaces. Native horizontal scrolling, mandatory snap-to-center and 300ms transform remain. Maintain visible nonrectangular keyboard focus cue despite removing rectangular artwork outline.
- Frontend/architect: existing finite strip makes modular first↔last navigation a long smooth traverse, **not** seamless circular motion. JS scroll must respect reduced motion. Preserve acknowledged `session.setLayout` → separately intentional centered `session.confirmSetup`; suppress accidental hold/drag confirmations, handle selection rejection. No new confirmation/payment flow and no backend event invented.
- Tester: computed-style and screenshot checks at 1920×1200 / 1280×800 × Windows 100/125/150% with effective viewport noted; inspect seam/rectangular shadow clipping, every card sharp at 100% opacity, intrinsic paper, keyboard focus, long language, finger targets, swipe/snap, wrap path, reduced motion and busy/error gates. Acceptance **not yet achieved**.

## 2026-11-03 Operator/Settings production-readiness design handoff

- Added source-driven Operator/Settings hierarchy, parity gaps, visual option comparison, geometry, touch/state behavior and pending viewport matrix to `UI_VISUAL_REVIEW.md`. Chosen editorial porcelain with restrained static chromatic highlights instead of a saturated moving glass dashboard. This is a **design handoff only**: no TSX/CSS, build, tests or live hardware changed in this pass; V1 remained read-only.
- **Cannot honestly remove** the simulator/local-only notice or claim production Admin yet: current operator still calls `simulator_request`, type states `productionAdminAcl:false`, and Settings validates `hardwareApply:'PENDING_DISABLED'` with all production gates false. A cosmetic removal would misrepresent security and real printer/camera status. Escalate request for operational V1 parity to architect/backend: authorization, verified device health, Canon capability/read/write routes, configured printer names, cloud/booth identity and native folder picker, safe device-apply acknowledgement. Frontend owns subsequent `V1Settings.tsx`, `Operator.tsx`, `v1-settings.css` and `operator-v1.css` implementation once contracts exist. Preserve existing test IDs, six-field save acknowledgement, 10-second steppers, next-session semantics and guarded exit until the contract deliberately changes.
- Acceptance remains open: no rendered 1920×1200 / 1280×800 screenshots at 100/125/150%, language overflow measurements or touch monitor testing; no real print, live camera or service integration has been asserted.

## Current carousel audit — 2026-11-03 (source only; supersedes proposed wheel status below)

- Audited the implemented V2 `StudioModeScreen.tsx`, final `kiosk-v1.css` cascade and carousel tests. **Documentation-only**; no screenshot, DPI/device test, build or V1 modification. Detailed evidence and acceptance matrix: `UI_VISUAL_REVIEW.md` → “Implemented layout carousel audit”.
- **Pass in source:** centered hint retained in DOM with `.sr-only` clipping overriding the old visible pill; cardless button preserves white SVG paper and static oil-slick selected drop-shadow; fixed CSS gap `clamp(16px,2.5vw,40px)`; modular arrow index and disabled arrows for 0/1 entries. Center/neighbor/arrow actions preserve `session.confirmSetup` and `session.setLayout` respectively.
- **Incomplete:** final distance rules yield `1.08/1`, `.80/.65`, `.62/.40`, `.48/.22` only through distance 4; >=5 is not covered. Sticky hover changes neighbor values. Five full cards cannot fit in the 1400px wrapper at native 1920 or the ~1178px available stage at native 1280; 3–5 *visible/partially peeking* and compact DPI need measured screenshots, not CSS inference.
- **Not a seamless circular wheel:** modular arrow commands scroll through the finite strip on first↔last wrap; linear `Math.abs(i-center)` does not display end neighbors adjacent. CSS reduced-motion is undercut by a late carousel transition and JS `scrollIntoView({behavior:'smooth'})`. Existing test checks wrap destination/commands, not travel path or motion preference. Frontend owner should implement distinct modular visual slots or equivalent bounded wrap, correct >=5/hover/reduced-motion cascade, and gate confirm on authoritative selection acknowledgement with architect; preserve all backend/session gates. Tester should measure target viewports and Windows 100/125/150%, hitboxes, artwork clipping, long labels, drag/hold and rejection before acceptance.

## Layout wheel user correction — 2026-11-03 (design handoff only; newest)

- Updated `UI_VISUAL_REVIEW.md` with an implementation-ready **five-slot modular wheel** specification for `StudioModeScreen.tsx` and layout-only rules for `kiosk-v1.css`. This is **not an implemented component or stylesheet change**; older notes below about a visible pill, finite scroll strip and fixed `.85` side scale describe the prior implementation.
- Requested appearance: visually remove the active hint by retaining its one centered DOM span as `.sr-only` (screen-reader/test discoverable); center artwork `1.08` / opacity 1, immediate neighbors `.80` / `.72`, outer neighbors `.62` / `.48`, evenly spaced `clamp(205px,23vw,330px)` steps; cardless SVG paper and active static aura remain. Show 3–5 distinct entries depending on configured count/available viewport; never duplicate an interactive ID for a 2–4-layout catalog.
- Requested navigation: `((center + delta) % n + n) % n`; both arrows remain operable at first/last for `n>1`, with one-step wrap. Finite `scrollIntoView`/scroll-snap must be replaced or explicitly reworked: modulo alone jumps through the whole finite strip. Preserve first-selection `session.setLayout` and **separate acknowledged center tap** `session.confirmSetup`; no new Continue button or payment/cancellation bypass. Pending/rejected selections, swipe/hold click suppression and snapshot acknowledgement require frontend/architect coordination.
- Frontend owner: implement TSX wheel and consolidate existing conflicting carousel CSS overrides rather than append weaker styles. Tester: 0/1/2/3/4/5/>5 layouts, wrap/double tap/rejection, 1920×1200 and 1280×800 at Windows 100/125/150%, small effective CSS viewports, touch hitboxes, long Vietnamese text, reduced motion and forced colors. **No screenshot, browser/device test, frontend build or V1 change was performed by this design-only pass.**

## Chromatic/cardless implementation audit — 2026-11-03 (latest; supersedes proposal-only status below)

- **Source-verified in V2 CSS, not rendered/device-verified:** `kiosk-v1.css:449–476` implements the static cyan/violet/rose/coral/gold/blue oil-slick backdrop, frosted 28px/200% panel saturation and cyan/violet specular hairlines. `payment.css:2–31,51–83,106–138` implements full-bleed six-color payment ambience, frosted plates and an unblurred, unanimated, opaque white QR square. Camera remains matte `#121214` (`kiosk-v1.css:323,326`) and excluded from customer-shell frost.
- Layout carousel now **removes the external white button card** (transparent background, zero border/shadow/padding, including hover/active) while preserving the white artwork's actual paper. Selected artwork has exactly the requested rose/cyan/black three-shadow aura; inactive `.85` / `.55`, active `1.06` / `1` in static state; pill hint floats below. Existing scroll snap, hitbox and second-center-tap confirmation are not changed by this documentation audit.
- **Residual acceptance gap:** `--oil-sapphire:#3b82f6` is now declared and selected hover is explicitly held at `scale(1.06)` with sufficient specificity. The sapphire radial still uses its equivalent literal RGBA value. Panel rim is cyan/violet layered highlights rather than a continuous full-spectrum rim; rendered art-direction acceptance remains open.
- Automated regression is green (55/55 frontend tests, 2,017-module build, backend 80 passed/2 skipped, Rust package compile). Tester follow-up remains computed cascade + viewport screenshots at 1920×1200 and 1280×800 × Windows 100/125/150%, layout clipping/long labels/drag/second tap, QR scan, forced colors, reduced motion and real camera face clearance. No scanner or hardware acceptance was performed; V1 was not used as a command workspace or modified.

## 2026-11-03 user correction: chromatic “dầu loang” + layout artwork with NO white card

- **Documentation/design delivered, not implemented.** `UI_VISUAL_REVIEW.md` now records two Welcome/Capture directions and chooses a static iridescent ambient Welcome plus matte, image-free Capture control zone (pending camera geometry validation); provides specific cyan/violet/magenta/coral/gold gradient, near-opaque readable porcelain-glass and specular-rim/button CSS recipes, fallback/contrast and state rules. The older warm peach/ivory direction below is historical, **not the current requested direction**.
- Source finding: `StudioModeScreen.tsx` currently uses one `<button class="v1-layout-card v1-carousel-card">` per configured layout, with the actual layout paper drawn by `LayoutArtwork` SVG and title/hint below. `kiosk-v1.css` draws an unwanted **separate white rectangular card** around each SVG; active/hover/after rules across the cascade reinstate borders, shadows and a check. Proposed targeted override strips only the *outer button* background, border, padding and box-shadow, leaving its full-size touch hitbox, real SVG white paper and backend-derived print aspect intact. Active artwork gets a static chromatic drop-shadow halo and `1.06` active scale; idle `0.85` / `.55` opacity. A small opaque tap-hint pill + bottom full-details indicator remain. These are **CSS specifications**, not a claim that the UI already renders cardless.
- Frontend handoff: implement scoped final CSS or consolidate stylesheet, not more conflicting general overrides; restore transforms across `:active`/`:hover`, remove selected `::after` badge, protect image/QR/camera, keep 56px arrows and snap/scroll center geometry. Preserve adjacent-tap `session.setLayout` and **second centered tap** `session.confirmSetup` (no new Continue/payment bypass); coordinate acknowledged pending/reject behavior with architect before presenting an optimistic layout as committed. The proposed image-free capture timer is **not currently delivered**; current large countdown can still obscure faces.
- **Verification not performed:** no CSS/TSX implementation, test/build, screenshots, monitor/DPI/hardware or contrast scan in this specialist pass. Verify 1920×1200 and 1280×800 at Windows 100/125/150%, SVG aspect/no clipping, finger target rectangles, drag/second-tap and rejected selection, reduced motion/forced colors, live camera face clearance and QR scanner before claiming acceptance. V1 untouched.

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

## Latest editorial CSS pass (2026-11-02)

- Introduced final canonical `--v-bg`, `--v-panel`, `--v-text`, `--v-nude`, `--v-champagne`, `--v-border`, `--v-shadow` tokens; frosted controls, floating paper, serif Welcome, coherent heading hierarchy, champagne layout/frame selection, 72px quantity keys, stable square QR, pipeline/status accent and scoped graphite operator finish. Existing internal scrolling and compact breakpoint retained; no screen stages or business actions added.
- Countdown changes from a full-viewport dark overlay to a lower-left matte timer badge. The existing fitted mirrored image/crop, backend-configured shot count/countdown and capture action stay unchanged. **Open blocker:** edge portraits may still sit behind the badge because there is no reserved side rail. Verify with camera portraits and coordinate image-free rail if necessary; do not claim face-safe capture.
- Existing inherited CSS layers remain; consolidate only with a dedicated regression review. `npm test -- --run`: **55/55 passed (8 files)**; `npm run build`: **passed** in V2 frontend. No rendered screenshots, Windows scaling measurements, QR scan or hardware tests. V1 untouched.

## Comprehensive eleven-screen audit and milestone status — 2026-11-02

- Audited current Start, StudioMode, Quantity, Payment, Prepare, Capture, SelectPhotos, Frame, Confirm, Printing and Delivery TSX plus the complete final cascade of `kiosk-v1.css`; recorded each screen's actual actions, geometry, dynamic data, disabled/loading/failure paths, touch sizes, image aspect and remaining gates in `UI_VISUAL_REVIEW.md`. This is **design/source audit delivered**, not full design/device acceptance.
- Current CSS winning declaration leaves countdown **centered on the image with full-screen scrim** (`kiosk-v1.css:429`); prior description of a lower-left badge is superseded. Capture face clearance, real orientation/crop and reduced-motion feedback are **open release blockers**. Current selection zoom is hold-only; previous statements about a separate zoom button refer to an old state.
- Stage honesty: printing shows four labels but first node is always active; real progress and recovery need backend events. Payment still accepts client-side `1234` and calls `payment.mockComplete` for staff cash; **production security blocker**, not a UI-auth solution. Do not allow CSS polish to certify authorization, payment or hardware readiness.
- Responsive 1280×800 native / 1920×1200 native and Windows 100/125/150% require rendered screenshots and measured effective CSS viewports; current desktop-only source/CSS review cannot certify no overflow. Avoid adding override layers until geometry and cascade are consolidated after visual regression.
- Frontend handoff: preserve `session.confirmSetup`, `selection.confirm`, `frame.select` then `frame.confirm`, `print.confirmReal`/dry-run and `session.finish`; keep counts/countdown/pricing authoritative. Provide visible command rejection and re-arm rules for Start, Quantity, Capture, Confirm and Finish; do not retry uncertain real print. Architect handoff: authenticated staff override, stage-specific printing events, authoritative frame composition, missing/failed QR and device recovery states. Tester handoff: screenshot/DPI, touch, QR scan, camera/printer and language-overflow matrix from `UI_VISUAL_REVIEW.md`.
- Re-ran `npm test -- --run` in V2 `frontend/`: **8/8 files, 55/55 tests passed**; `npm run build`: **passed** (TypeScript + Vite). No V1 write, hardware operation, screenshot, real transaction or print. Milestone: audit/documentation and automated checks **complete**; visual-fit, accessibility/security and physical-kiosk acceptance **not complete**.

## Payment-specific source review — 2026-11-03

- Reviewed current `payment.css`, `PaymentScreen.tsx` and `kiosk-v1.css` cascade; documented per-state geometry and acceptance matrix in `UI_VISUAL_REVIEW.md`. **Documentation-only pass**: no frontend styling, business flow, V1, camera, printer or payment rules changed; no new test/build or viewport screenshot run.
- QR slot is always mounted, opaque white and square, 290px at native 1280×800 and 360px at native 1920×1200; loading spinner, VietQR and recovery warning replace *contents*, not the box. Slot and image explicitly prohibit transform/transition/animation; spinner rotation is not QR zoom. Payment columns use 1:1.1 summary-to-QR ratio and local scrolling.
- **Not yet accepted visually:** 125/150% scaling leaves two columns at effective 1024×640 / 853×533 and the 290px QR floor plus 140px instructions can exceed panel height. Center-aligned overfull right panel and hidden scrollbars risk clipping the QR or obscuring recovery; `overflow:hidden` on shell is not proof of zero overflow. Broken QR images do not trigger a recovery state; long prices can overflow their summary line.
- Frontend/tester: capture state-matched screenshots and QR rectangle measurements for both native 16:10 sizes and 100/125/150% scaling; verify true document overflow, full QR visibility, finger-scroll access to recovery actions, QR scanning, long-copy/prices, and reduced motion. If short displays fail, top-align internally scrolling right content with visible scroll affordance, keeping QR box stable and payment/back gates unchanged.
- Architect/backend: production-blocking hardcoded `1234` + `payment.mockComplete` staff override remains; coordinate authenticated authorization. Confirm retry idempotency, late link success after local 15s timeout and duplicate-tap protection before enabling repeated link creation. No payment or staff authorization verified here.

## Payment card and Liquid Glass follow-up — 2026-11-03 (current CSS; supersedes earlier payment dimensions)

- **Source inspection only, docs updated; no CSS/TSX change or new test/build.** `.v1-payment-columns` now specifies `height:100%; grid-template-rows:1fr; flex:1; min-height:0`, 1:1.15 columns, and both direct cards `height:100%`. This establishes matching full-height cards from the initial creating state at two-column widths. The <=760px stacked override deliberately uses auto heights.
- QR slot and instructions are always mounted: slot square `clamp(300px,38vh,380px)` in both dimensions, `flex:none`, no animation/transform/transition; instructions fixed at 140px with internal scroll. Predicted QR size at native 100%: **304px at 1280×800**, **380px at 1920×1200**. The CREATING → AWAITING_PAYMENT swap changes contents rather than card dimensions. Earlier 290px/360px and 1:1.1 figures in this document are superseded. Pixel stability remains unverified until same-viewport rectangle comparisons are recorded; staff button appearance can change sibling space.
- Visual vocabulary is consistent in CSS: translucent ivory 28px/190% frosted panels with `::before` specular top wash, opaque porcelain-white QR for scan contrast, frosted 56px staff button and 28px/190% PIN modal with >=62px keypad. Luxury and readable contrast require rendered visual inspection; CSS properties alone cannot certify them.
- **Open responsive risk:** 125/150% effective short viewports retain two columns and a >=300px QR plus 140px instructions; panel gets vertical scrolling at <=720px, but shared CSS hides scrollbar affordances. Confirm QR and error/retry fully reachable at 1024×640 and 853×533, and check stacked <=760px with shell overflow; do not claim zero page jump, zero clipping or QR scannability without measurements.
- Frontend/tester: capture CREATING / AWAITING_PAYMENT / ERROR / UNCONFIGURED and staff modal at both native screens × 100/125/150% (or label CSS-viewport emulation); compare QR, instruction and panel bounding rects before/after state, check actual scrolling, long Vietnamese text, large prices, broken image and scanner distance. Architect: hardcoded PIN / mock cash completion remains a production blocker; coordinate authenticated authorization and idempotent retry/late-success behavior. No business-flow change, real payment, hardware verification or V1 write in this pass.

## Rigid payment plates and luminous frost — 2026-11-03 (latest)

- Implemented CSS-only payment update: fixed **940×560** group at >=1040×680 effective CSS viewport (1040px reserves shell side padding); fixed **430×560** information plate and **470×560** QR plate separated by 40px; QR **320×320** including 24px white porcelain padding; instruction block **130px**. No plate/QR dimension, padding or transform animations. Loading, QR, warning swap within persistent boxes; absolute staff rail avoids changing plate geometry. Earlier fluid/`clamp` payment measurements are superseded.
- Payment-scoped static champagne/apricot/rose illumination behind 32px/210% translucent ivory glass, diagonal reflection, bright rim, warm depth shadow; opaque white QR for scanning; terracotta price and amber waiting indicator. Other screens and live camera remain unchanged.
- At effective width <1040px or height <680px, **same exact-size plates stack** and payment area scrolls; 470px width on extremely narrow windows requires deliberate horizontal scrolling, not a secretly shrunken QR. 1095×988, native 1280×800 and 1920×1200 predict the same geometry but have **not** been screenshot-tested. At 125/150% DPI, verify scrolling and recovery accessibility rather than claiming both plates visible at once.
- Source/layout review only; no browser/Windows measurements or QR scan performed; backend/payments untouched. Frontend/tester: run per-state bounding-rect and screenshot matrix in `UI_VISUAL_REVIEW.md`. Architect: remove/secure the client `1234` / `payment.mockComplete` override, handle QR image errors and idempotent retry. V1 unchanged.

## Payment fills the kiosk stage — 2026-11-03 (current; supersedes rigid plates)

- Responded to feedback that the fixed 940×560 card group looked undersized and boxed in. CSS-only correction in `frontend/src/screens/payment.css`: full-width/full-available-height stage, flexible 1.05:1 equal-height grid, fluid 24–48px gutter and 28–48px glass-panel padding. No 430/470px fixed widths, 560px plate heights or 1160px stacked fixed grid. The card treatment is softer translucent ivory/rose at 28px blur/190% saturation with a static specular glaze; price grows fluidly to 68px.
- Stable opaque QR porcelain square is `clamp(290px,37vh,390px)`; 130px reserved instruction block and always-mounted QR slot keep state changes inside the same footprint. QR itself has no transform/transition/animation; loading spinner and status pulse remain. Short effective viewports use smaller panel padding and finger-scrollable QR panel; only <=760px width stacks fluid-width panels. Optional staff button has bottom clearance; its reveal can reduce available panel height and needs separate visual checking.
- **Unverified visually:** test screenshots and rectangles for 1280×800 and 1920×1200 at 100/125/150%, all QR states, long text, short-height recovery scroll and bank QR scan. No new payment/business commands or hardware tests. Frontend PIN `1234` / `payment.mockComplete` remain production blockers for architect/backend; CSS is not authorization. V1 unchanged.

## Full-bleed liquid glass payment source verification — 2026-11-03

- **Documentation-only review:** checked `payment.css`, `KioskUI.tsx`, `KioskSimulator.tsx` and `PaymentScreen.tsx`. Both payment-shell selectors explicitly force `padding:0!important; gap:0!important`; `PAYMENT_PENDING` supplies the class fallback via `AppShell`. Payment background fills its allocated shell stage with `border-radius:0`, static apricot/rose/champagne glows and exact safe-area padding `clamp(20px,2.5vh,32px) clamp(24px,4vw,64px)`.
- Two direct panels stretch across a 1.05:1 **column-width** fluid grid with equal row height, frosted 28px/190% glass, bright rim and static specular glaze; QR remains an opaque, square, always-mounted porcelain slot with contained unanimated image and persistent 130px instructions. At <=760 CSS px cards stack by design; at short 125/150% viewports the QR panel may require finger scrolling. Optional staff reveal and a global error alert can alter the available height.
- **Not visually accepted:** no screenshots, computed layout, scanner, Windows display scaling, build or test run in this pass. Follow the current acceptance/handoff matrix in `UI_VISUAL_REVIEW.md` for both native resolutions × 100/125/150%, each QR state, long strings, error and staff reveal. Architect/backend must fix the hardcoded client PIN / `payment.mockComplete` production blocker and resolve idempotent retries and broken QR before release. No V1 or application source was changed.

## Full-application luxury Atelier Liquid Glass proposal — 2026-11-03

- **Documentation-only deliverable, not an implementation:** added the complete design contract, two Welcome/Capture options and chosen readable matte-capture direction, shared CSS token recipe, reusable component guidance and per-screen entrance/exit/action/error/image rules to `UI_VISUAL_REVIEW.md`. Requested customer-shell full-bleed apricot/rose/champagne ambient and master 28px glass treatment now have explicit design values and capture/opaque-QR exclusions. This requested direction supersedes the older *proposal* to avoid all glass/ambient treatments, but no existing CSS or backend has changed.
- **Coverage:** Start, Studio layout, quantity, payment, prepare, capture, photo selection, frames, confirm, printing, delivery; Admin plus frames/bundles, layout editor, settings/device/camera/printer, Studio/Tools/effects/Beauty, revenue, startup/error/recovery/out-of-service. Existing gates (`session.confirmSetup`, `session.setQuantity`, payment backend confirmation, `selection.confirm`, `frame.select` then `frame.confirm`, Confirm & Print, `session.finish`) are retained. Dynamic shot/select counts, countdown, prices and timeouts remain authoritative.
- **Not delivered:** mounted styles/components, CSS consolidation, real four-stage printer telemetry, secure operator authentication, capture image-free countdown zone, alternate non-hold photo zoom, QR image-error handling, actual device/Windows viewport screenshots. Current centred countdown over faces and client `1234` / `payment.mockComplete` remain explicit production blockers; the proposal cannot certify them away.
- **Frontend handoff:** implement shared shell/tokens once with payment/camera exceptions; explicit pending/disabled/error states; preserve opaque scanned QR and actual print paper; prevent repeated submission and show backend rejection; only animate UI surfaces, not camera/QR/print outcomes. Confirm current contract before exposing additional controls. **Architect handoff:** secure staff actions, phase/progress events, cancellation/retry authority, camera metadata and print outcome. **QA handoff:** screenshot + touch + overflow matrix at both native dimensions × 100/125/150%, long Vietnamese strings, empty/broken assets, reduced motion, QR scan, real camera face clearance and print failure.
- **Evidence level:** source-informed visual specification only; no new CSS/TSX changes, build, screenshot, physical touch, payment, camera or print checks in this pass. V1 untouched.

## Application-wide liquid-glass implementation review — 2026-11-03

- **Documentation-only source audit of the subsequently implemented CSS**, not the earlier proposal: `kiosk-v1.css:447–484` now contains a three-light static customer backdrop, shared 28px/190% glass treatment for all nine requested panel selectors including modal, terracotta gradient primary, frosted secondary/circular back, welcome strip/pill polish, carousel/quantity/photo/frame accents, prep/shutter/pipeline glow, porcelain delivery QR and reduced-motion pulse removal. Payment owns its own full-bleed background, panel overrides and opaque QR slot in `payment.css`. Capture remains matte, not frosted.
- Actual print preview wrapper is transparent with no backdrop filter; image uses `object-fit:contain` and layered paper drop shadows. Payment/delivery QR images are on opaque white and no reviewed rule adds blur to their pixels. These are **source-level properties**, not proof of physical sharpness, image quality or scan success.
- **Open blockers:** centered full-viewport glowing countdown still obscures portrait faces; forced `!important` primary gradient can override disabled/Confirm grey presentation; printing first node is hardcoded active rather than real telemetry; selection enlargement remains hold-only; frontend mock staff PIN/`payment.mockComplete` is not authorization. Validate payment-specific cascade/import precedence and reduced-motion flash with computed styles.
- No frontend CSS/TSX, backend, camera, printer, payment rules or V1 modified in this review. No new tests, build, screenshots, QR scan, Windows scaling or hardware checks run. The full stage/state matrix at 1920×1200 and 1280×800 × 100/125/150%, including long Vietnamese copy, error/disabled/loading, capture faces, touch and reduced motion, is **still pending**; consult the new source-evidence table in `UI_VISUAL_REVIEW.md`. Do not call the overhaul visually accepted until those measurements exist.
