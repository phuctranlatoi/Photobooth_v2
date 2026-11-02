# ADR-020: Direct Manipulation Touchscreen Architecture, One-Tap Selection Flows, Staff Payment Authorization, and Liquid Glass 16:10 Geometry

**Date:** 2026-11-02  
**Status:** Accepted  
**Authors:** Specialist Solutions Architect (V2)  
**Supersedes/Extends:** Extends ADR-001 (Frontend Stack), ADR-007 (State Machine Authority), ADR-018 (Korean Design Tokens), and ADR-019 (Snapping Carousel)

---

## 1. Context and Problem Statement

Following the Touchscreen Interaction Audit (`docs/TOUCHSCREEN_INTERACTION_AUDIT.md`), four critical architectural challenges were identified in LE SOUVENIR Photobooth V2:

1. **Redundant Web-Form Buttons on Single-Choice Screens:**
   - On `FrameScreen.tsx`, selecting a frame required tapping a frame thumbnail, then navigating down to press `Tiếp tục →`. Because choosing a decorative frame is a single-choice visual decision, requiring a second click introduced cognitive hesitation, double-action fatigue, and reduced kiosk throughput.
   - On `StudioModeScreen.tsx`, tapping a layout card centered it, but an explicit bottom `Tiếp tục →` button was required to proceed, diverging from V1's centered-card direct advance.

2. **Programmatic Pre-selection Trap & Rapid-Tap Hazards:**
   - Naive auto-advance triggered reactively on state changes risks catapulting the user to the next screen immediately upon mounting because a default frame is preselected.
   - In retail kiosks, rapid double-taps can cause multiple transition dispatches or pass-through "ghost clicks" that land on the primary "Confirm & Print" button of the incoming screen, potentially triggering unintended physical prints.

3. **Critical Payment Security Vulnerability:**
   - In prior V2 `PaymentScreen.tsx`, `staffVisible` evaluated to `true` whenever PayOS was unconfigured, errored, or timed out after 15 seconds. This rendered a public, customer-facing button labeled `"Nhân viên xác nhận tiền mặt"` that dispatched `mockComplete` with `staffOverride: true`, allowing customers to bypass payment.

4. **Visual Clutter & Nested Container Wrappers:**
   - Previews in `PrintPreview`, `FrameScreen`, `SelectPhotosScreen`, and `LayoutArtwork` were surrounded by nested white container cards with borders and shadows ("box-inside-a-box"), degrading the modern Korean photo atelier aesthetic.
   - Previews lacked realistic floating drop shadows and did not optimize the vertical height budget for 16:10 kiosk screens (1280×800 and 1920×1200) without page scrolling.

---

## 2. Decision

### 2.1 One-Tap Frame Selection with Auto-Advance & Transition Lockout
- **Eliminate Continue Button:** Remove the `ActionBar` and `Tiếp tục →` button from `FrameScreen.tsx`.
- **Customer Pointer Gesture Isolation:** Auto-advance is strictly restricted to user pointer events (`handleUserFrameTap`). Programmatic default frame selection on mount or prop updates must NEVER trigger auto-advance.
- **Immediate Visual Feedback + Confirmation Delay:**
  1. Instant optimistic update (<16ms): Active frame highlighted, checkmark badge displayed, preview overlay updated.
  2. Immediate transition lockout (`isTransitioning.current = true`).
  3. Dispatch `frame.select` to backend.
  4. 320ms visual confirmation delay before dispatching `frame.confirm` (or single atomic advance).
- **Ghost-Click Armor on `ConfirmScreen`:** Implement a mandatory 500ms Input Arming Delay (`isArmed`) on `ConfirmScreen.tsx`, disabling the primary print confirmation button during the first 500ms after mount to completely neutralize ghost clicks.
- **Inactivity Timeout:** Backend watchdog timer in `EDITING` automatically selects the default frame and advances to `PRINT_PENDING` upon reaching `frameSelectionTimeoutSeconds`.
- **Error Recovery:** If backend composition fails, unlock `isTransitioning.current`, display an error toast, and remain on `FrameScreen`. Back navigation from `ConfirmScreen` returns to `FrameScreen` with previously chosen frame highlighted.

### 2.2 One-Tap Layout Selection (Centered Card Direct Advance)
- **Eliminate Continue Button:** Remove the bottom `ActionBar` from `StudioModeScreen.tsx`.
- **Direct Advance on Centered Card Tap:**
  - Tapping an off-center card (`center !== index`) centers the card via smooth scroll and updates backend layout via `session.setLayout`.
  - Tapping the already-centered card (`center === index`) directly dispatches `session.confirmSetup` and advances to `SELECTING_QUANTITY`.
  - Floating chevrons allow navigation without selection.

### 2.3 Strict Cash Payment Security & Staff Authorization
- **Complete Removal of Public Cash Buttons:** Remove `warning || isError` from `staffVisible`. Public customer UI must NEVER render a payment bypass button.
- **Customer Error State:** If PayOS fails or times out, display customer guidance ("Không tạo được mã QR. Vui lòng thanh toán tiền mặt tại quầy") with a "Thử lại tạo mã QR" button and back button only.
- **Hidden Staff Gesture:** Restore V1's 1000ms continuous hold gesture on the header title. Movement > 12px aborts hold timer immediately.
- **Staff PIN Gate (Enterprise Hardening):** 1000ms hold opens a Staff PIN modal requiring a 4-digit PIN before cash payment can be authorized.
- **Revenue Protection:** Strict backend enforcement that transactional revenue is recorded only upon verified, completed print spooling (`userConfirmed && printJob.await()`).

### 2.4 Liquid Glass Design System & 16:10 Kiosk Geometry
- **Liquidation of White Box Wrappers:** Remove backgrounds, borders, and shadows from `.v1-preview` and `.v1-preview-empty`. Containers are completely transparent.
- **Floating Photostrip Canvas:** The photostrip/postcard itself is rendered as crisp photographic paper floating over `--k-bg-gradient` with multi-layered realistic drop shadows (`filter: drop-shadow(...)`).
- **Responsive 16:10 Geometry:** Strict height budgeting guarantees zero vertical page scroll on both 1280×800 and 1920×1200 screens. Previews utilize `max-height: 72vh` with exact aspect ratios (1:3 for 5×15 cm, 2:3 for 10×15 cm).
- **Studio Workspace Theme:** Modernize operator tabs (`AdminScreen`, `V1Settings`, `Operator`) with dark graphite styling, tactile sliders, and numeric steppers.

### 2.5 300 DPI Native Print Compositing Parity
- Reaffirm V2's native 300 DPI output (`renderScale = 1` in `DesktopCompositor.kt`) matching DNP DS-RX1HS hardware dot matrix (1226×1829 px for 4×6; 592×1790 px for 2×6 strip; bleed margins: 27px top, 14px left, 2px cut gap).
- Confirmed that V1's `renderScale = 2` was an illusion that wasted 4× RAM and CPU time while being downsampled back to 300 DPI by the Windows print driver.

---

## 3. Consequences

### Positive
- **Streamlined Kiosk UX:** Eliminating redundant Continue buttons on layout and frame selection cuts 10–25 seconds off every session, directly increasing venue throughput.
- **Accidental Print Prevention:** Input arming delays and synchronous transition locks completely eliminate double-tap ghost clicks.
- **Zero Payment Bypass:** Removing customer-facing cash buttons closes the commercial financial leak, requiring verified staff presence.
- **Visual Elegance:** Liquid Glass design and floating photostrips provide an authentic, premium Korean studio aesthetic.
- **Zero-Scroll Guarantee:** Interfaces fit perfectly on 16:10 displays without clipping or scrollbars.

### Negative / Trade-offs
- Customers browsing frames must be informed that tapping a frame will advance (communicated via subtitle "Chạm vào khung để chọn và xem ảnh").
- Staff members must be trained on the 1000ms header hold gesture and 4-digit PIN for cash transactions.

---

## 4. References
- Touchscreen Interaction Audit: `docs/TOUCHSCREEN_INTERACTION_AUDIT.md`
- Architecture Specification: `docs/TOUCHSCREEN_ARCHITECTURE_SPEC.md`
- Korean Design Tokens: `docs/ADR/018-korean-premium-touchscreen-ui-design-tokens.md`
- Snapping Carousel: `docs/ADR/019-v1-horizontal-snapping-carousel-and-bridge-resilience.md`
- IPC Contracts: `docs/IPC_CONTRACTS.md`
