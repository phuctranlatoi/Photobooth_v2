# LE SOUVENIR Photobooth V2 — Frontend Reconstruction Invariants & Style Audit

**Author:** legacy-auditor  
**Target Environment:** `PhotoboothDesktop_v2` (Windows 16:10 Touchscreen 1280×800 / 1920×1200)  
**Legacy Reference:** `PhotoboothDesktop` (V1 Compose Desktop — STRICT READ-ONLY)  
**Status:** Canonical Frontend Baseline Specification  
**Evidence Labels:**
- `[Observed in code]`: Directly verified in V1 Kotlin or V2 TypeScript/Rust/CSS source code.
- `[Inferred]`: Derived logically from system constraints or contract requirements.
- `[Unverified hardware]`: Involves physical devices (Canon DSLR, DNP DS-RX1HS) pending live operational confirmation.
- `[Missing evidence]`: Not attested in inspected codebases.

---

## 1. Executive Summary & Audit Scope

This document establishes the exhaustive audit baseline for Phase 1 (Stylesheet, screen, and interaction rule inventory) and Phase 2 (Behavioral Invariants Matrix) for the frontend reconstruction of LE SOUVENIR Photobooth V2.

The frontend is being reconstructed from a fragmented desktop webview simulator into a high-performance, polished, kiosk touchscreen interface. While visual styling and CSS layout engines may be streamlined and modernised (e.g., consolidating fragmented stylesheets into an Atelier Design System), **behavioral invariants, accessibility hooks, testing selectors, gesture timings, pricing formulas, and hardware state transitions MUST NOT CHANGE.**

Every selector, timing threshold, and interaction pattern detailed herein is cross-referenced with exact V1 Compose Desktop code paths, V2 React screen components, and automated Chrome DevTools Protocol (CDP) test suites (`tests/verify-demo-and-real-journey.mjs` and `tests/v1-settings-parity/mounted-settings-parity.mjs`).

---

## 2. Phase 1: Comprehensive Stylesheet & CSS Architecture Audit

The legacy frontend contains 11 cascading stylesheet layers in `frontend/src/`. This layered accumulation creates specificity conflicts, redundant wrappers, obsolete simulator artifacts, and competing theme tokens.

### 2.1 Catalog of Existing Stylesheets

| Stylesheet Path | Original Role | Status in Reconstruction |
| :--- | :--- | :--- |
| `frontend/src/styles.css` | Baseline Tailwind import, base kiosk layout, and legacy mock simulator styling | **Fragmented / Partially Obsolete**: Lines 3–4 contain deprecated `.simulator`, `.photo-stage`, and `.photo-grid` mock styles that conflict with production kiosk screens. |
| `frontend/src/customer.css` | Early customer stage layout & pseudo paper-strip visual mock | **Obsolete Layer**: Contains legacy `.simulator article.layout-card`, mock `.paper-strip`, and `.welcome-art` styling superseded by Atelier Canvas. |
| `frontend/src/stages.css` | Multi-step stage setup grids & card layouts | **Obsolete Layer**: Defines `.customer-stage`, `.setup-grid`, and `.summary-card` from early prototype iterations. |
| `frontend/src/finishing.css` | Inactivity timer hacks, layout phase locks, and simulator overrides | **Obsolete / High Conflict**: Hardcodes fixed phase heights (`.simulator[data-phase="EDITING"]`), overriding flex behavior and creating rigid clipping. |
| `frontend/src/preview.css` | Photo preview lightbox dialog overrides | **Obsolete Layer**: Overrides legacy `.simulator [role=dialog]` with rigid pixel insets (`inset: 24px`). |
| `frontend/src/kiosk-v1.css` | Early V1 Compose Desktop visual parity translation | **Transitional Core**: Introduced `.v1-shell`, `.v1-primary`, `.v1-back`, but contains outdated gradients (`#FFFFEDE4` / `#E9EFF5`). |
| `frontend/src/atelier.css` | The accepted production Atelier Design System | **Active Standard**: Scoped tokens (`--at-ivory-*`, `--at-coral-dark`, `--at-glass`), 56px minimum touch targets, responsive 16:10 geometry. |
| `frontend/src/screens/payment.css` | Payment screen layout, QR slot stability, and staff cash reveal | **Active Critical**: Enforces zero-layout-shift payment columns, 1000ms title hold target, and staff cash PIN modal. |
| `frontend/src/operator/operator-v1.css` | Initial operator workspace tab styling | **Transitional / Deprecated**: Basic form styles superseded by Atelier frosted glass tokens. |
| `frontend/src/operator/atelier-operator.css` | Operator workspace Atelier redesign | **Active Standard**: Frosted glass panels, 56px input targets, and responsive two-column grid. |
| `frontend/src/v1-settings.css` | Persisted settings screen layout and switch controls | **Active Standard**: 48px/56px touch toggles, 10-second stepper controls, and status cards. |

---

### 2.2 Obsolete and Conflicting Styling Layers to Prune

During frontend reconstruction, the following conflicting layers must be removed or cleaned up:

1. **Legacy Simulator Overrides (`styles.css` lines 3–4 & `finishing.css`)**:
   - `[Observed in code]`: `.simulator`, `.simulator-app`, `.photo-stage`, `.photo-grid button`, `.simulator .command-button`.
   - *Conflict*: These rules apply fixed aspect ratios, crude black background stages, and artificial margins that fight the flexible Atelier viewport.
2. **Oil-Slick Radial Background Gradients (`kiosk-v1.css` line 2)**:
   - `[Observed in code]`: `background: radial-gradient(circle at 0% 0%, #FFFFEDE4, transparent 55%), radial-gradient(circle at 100% 100%, #E9EFF5, transparent 50%), var(--v-bg);`
   - *Conflict*: Clashes with the warm, editorial palette of Atelier Canvas (`radial-gradient(ellipse at 80% 45%, rgba(216,199,181,.18), transparent 52%), var(--at-ivory-2)`).
3. **Redundant Fixed White Card Overrides (`stages.css` & `customer.css`)**:
   - `[Observed in code]`: `.setup-card`, `.summary-card`, `.setup-format`.
   - *Conflict*: Multiple stacked borders and redundant white cards inside `.v1-panel` cause double padding and clipping on 1280×800 viewports.
4. **Rigid Height and Inset Enforcements (`preview.css`)**:
   - `[Observed in code]`: `.simulator .photo-preview-dialog[role=dialog] { grid-template-rows: 72px minmax(0,1fr) 48px; }`
   - *Conflict*: Causes preview image squashing on viewports with lower vertical heights (such as 800px with OS taskbars). Replaced by `.v1-lightbox`.

---

### 2.3 Master Catalog: Functional Classes, Test Selectors & Accessibility Hooks

The following classes, IDs, ARIA roles, and test selectors are actively monitored by CDP acceptance suites (`verify-demo-and-real-journey.mjs`, `mounted-settings-parity.mjs`) and unit test specs (`screens.test.tsx`, `Simulator.test.tsx`, `V1Settings.test.tsx`). **THEY MUST BE EXACTLY PRESERVED.**

```
====================================================================================================
SELECTOR / ATTRIBUTE HOOK             REQUIRED PARENT / ROLE         PURPOSE & EVIDENCE
====================================================================================================
.v1-shell                             <main class="v1-shell">        Kiosk root container viewport
.v1-shell.v1-camera                   <main class="v1-shell ...">    Live View darkroom mode (no padding)
.v1-shell.v1-shell-payment            <main class="v1-shell ...">    Zero-padding wrapper for payment
.v1-start                             Customer Start Screen          Start view root container
.v1-brand                             <button class="v1-brand">      Brand wordmark (5-tap operator trigger)
.v1-primary                           <button class="v1-primary">    Primary CTA across all customer steps
.v1-secondary                         <button class="v1-secondary">  Secondary CTA & dismiss button
.v1-back, .backButton                 <button class="v1-back ...">   56x56 circular back button
.appHeader, .v1-heading               <header class="appHeader">     Standard customer screen heading
.appHeader__backSlot                  <div>                          Slot holding .v1-back
.v1-heading-title,                    <div ...                       Header copy container; must carry
  [data-staff-trigger="true"]           data-staff-trigger="true">     touch listener for staff PIN modal
.v1-layout-stage                      <section>                      Layout selection viewport
.v1-carousel-wrap                     <div>                          Carousel wrapper with chevrons
.v1-carousel-arrow.v1-carousel-prev   <button aria-label="...">      Previous layout chevron (>=56x56)
.v1-carousel-arrow.v1-carousel-next   <button aria-label="...">      Next layout chevron (>=56x56)
.v1-layout-carousel                   <div>                          Horizontal snap-scroll container
.v1-layout-card, .v1-carousel-card    <button>                       Individual layout selection card
[data-layout-id="..."]                <button class="v1-layout-card" Explicit layout ID data attribute
[data-distance="0|1|..."]             <button class="v1-layout-card" Optical scale distance attribute
.v1-carousel-indicator                <div aria-live="polite">       Current/total indicator badge
.v1-stepper                           <div>                          Quantity increment/decrement row
.v1-stepper button:first-child        <button aria-label="Giảm...">  Decrement quantity button
.v1-stepper button:last-child         <button aria-label="Tăng...">  Increment quantity button
.v1-stepper strong                    <strong aria-live="polite">    Current quantity readout
.v1-quantity-total                    <div aria-live="polite">       Live calculated total container
.v1-payment-screen                    Customer Payment Screen        Payment screen container
.v1-payment-columns                   <div>                          Two-column receipt + QR grid
.v1-payment-summary                   <section class="v1-panel">     Left-hand payment receipt card
.v1-payment-price                     <strong>                       Large formatted VND total price
.v1-payment-details                   <dl>                           Layout, copies, base/extra breakdown
.v1-payment-qr-panel                  <section class="v1-panel">     Right-hand QR code card
.v1-payment-qr-slot                   <div role="status">            Fixed QR frame (Zero Layout Shift)
.v1-payment-qr-slot img               <img>                          Rendered VietQR image
.v1-payment-staff                     <div>                          Staff cash override container
.v1-staff-cash-btn,                   <button                        Revealed staff cash override button
  [data-testid="staff-cash-btn"]        data-testid="staff-cash-btn">
.v1-staff-pin                         <div class="v1-modal ...">     Staff PIN entry modal
.v1-pin-keypad button                 <button aria-label="1|2|...">  PIN keypad numerical buttons
.v1-capture-screen, .v1-capture       Camera Capture Screen          Camera viewfinder root container
.v1-camera-viewport                   <div>                          Live View frame container
.v1-live                              <div style="--image-ratio">    Mirrored video live display
img.v1-live-mirrored                  <img alt="Live View máy ảnh">  Mirrored camera frame element
.v1-crop                              <div>                          Aspect ratio framing box overlay
.v1-capture-top                       <div aria-label="...">         Top shot counter (e.g. "Ảnh 1/6")
.v1-shutter-control                   <div>                          Shutter button container
.v1-shutter                           <button aria-label="Bắt đầu">  Circular shutter trigger button
.v1-shutter-ring                      <span>                         Outer ring (108x108 px target)
.v1-shutter-core                      <span>                         Inner core (84x84 px target)
.v1-countdown-layer                   <div role="timer">             Countdown overlay container
.v1-countdown                         <strong>                       Dead-centered countdown number
.v1-flash, .v1-shutter-flash          <div>                          Capture flash overlay animation
.v1-selection                         Customer Photo Select View     Photo selection stage root
.v1-photo-grid                        <div>                          Grid containing photo thumbnails
[aria-label="Chọn ảnh X"]             <button>                       Specific photo card toggle button
.v1-photo-order                       <span>                         1-based badge showing chosen order
.v1-photo-dimmed                      <button>                       Class applied when quota is filled
.v1-hold-lightbox, .v1-lightbox       <div role="dialog">            500ms press-and-hold zoom modal
.v1-frame-workspace                   <div>                          Frame selection stage container
.v1-frame-preview-panel               <div>                          Real-time frame preview area
.v1-frame-grid                        <div>                          Grid of selectable frames
.v1-frame-grid button                 <button aria-pressed="...">    Frame option card button
.v1-frame-check                       <span>                         Active check badge on chosen frame
.v1-confirm-screen                    Customer Confirm Screen        Final confirmation root
.v1-confirm-workspace                 <div>                          Composed print + summary layout
.v1-summary-total                     <h2>                           Final order summary total heading
.v1-print-stage, .v1-pipeline         <div>                          Print & QR upload progress stage
.v1-delivery-screen                   Customer Delivery Screen       Final delivery root container
.v1-delivery-qr                       <img alt="Mã QR tải ảnh">      Final web album QR image
.v1-print-signal-badge                <div>                          "TÍN HIỆU IN: ĐÃ TRUYỀN THÀNH CÔNG"
.v1-timer                             <span>                         Inactivity countdown badge
[data-testid="operator-workspace"]    <section>                      Operator administration container
[data-testid="operator-close"]        <button>                       Exit operator workspace button
[data-testid^="operator-tab-"]        <button>                       Operator navigation tabs (frames, etc.)
[data-testid="v1-settings"]           <div>                          Persisted settings tab root
[data-testid="settings-print"]        <input role="switch">          Windows printer toggle switch
[data-testid="settings-camera-*"]     <button>                       Camera source (webcam vs hot folder)
[data-testid="settings-hot-folder-*"] <input>, <button>              Hot folder file path input and browse
[data-testid="settings-*-minus|plus"] <button>                       10-second timeout step buttons
[data-testid="settings-save"]         <button>                       Persist settings button
[data-testid="settings-reload"]       <button>                       Reload settings button
====================================================================================================
```

---

## 3. Phase 1: Screen-by-Screen Component Audit

### 3.1 Customer Screens

#### 1. StartScreen (`StartScreen.tsx`, V1: `StartScreen.kt`)
- **Visual Presentation**: Warm, welcoming editorial atelier split-screen. Left column presents the brand wordmark, kicker, headline (`Chụp ảnh lấy ngay`), value pills (`Bản in lưu niệm`, `Album ảnh qua QR`), and primary CTA (`CHẠM ĐỂ BẮT ĐẦU →`). Right column displays sample print artwork (`LayoutArtwork`) and optional event bundle chips.
- **Interactions**:
  - `button.v1-brand`: Tapping 5 consecutive times triggers `onAdmin()` to open the Operator screen. Multi-tap counter resets upon activation.
  - Multi-click lock: `pressed.current = true` prevents rapid double-starts.
  - Catalog check: If `catalogSource === 'UNAVAILABLE'` or `layouts.length === 0`, disables the CTA and displays a user notification (`role="status"`).
- **Invariants**: Clean view with zero raw technical flags (no "Firebase Live", no offline badges).

#### 2. StudioModeScreen (`StudioModeScreen.tsx`, V1: `StudioModeScreen.kt`)
- **Visual Presentation**: Centered carousel displaying all active layouts. Cards scale smoothly using CSS transforms based on distance from center (`[data-distance="0"]` = 1.08x, `[data-distance="1"]` = 0.94x, others = 0.88x). Left/Right chevrons provide directional paging.
- **Interactions**:
  - Paging: Clicking `.v1-carousel-prev` or `.v1-carousel-next` cycles through layouts circularly.
  - Snap navigation: Swiping/scrolling updates the active centered card after a 160ms debounce.
  - Two-Tap Selection: First tap on a distant card centers it via smooth scroll and invokes `action('session.setLayout', { layoutId })`. A second tap on the *currently centered card* (`center === index`) confirms the layout via `action('session.confirmSetup')` and advances to Quantity.
  - Chevrons must maintain a minimum 56×56px touch target and share a horizontal axis (delta ≤ 3px).

#### 3. QuantityScreen (`QuantityScreen.tsx`, V1: `QuantityScreen.kt`)
- **Visual Presentation**: Step 2 header (`Chọn số lượng bản in`), interactive stepper control (`−` and `+`), live price breakdown table, and live print preview.
- **Interactions & Business Rules**:
  - Strip Layouts (`5x15 cm`): Quantities are **STRICTLY EVEN ONLY** (`[2, 4, 6, 8, 10, 12, 14, 16, 18, 20]`).
  - Postcard Layouts (`10x15 cm`): Quantities are sequential integers (`[2, 3, 4, 5, 6, 7, 8, 9, 10]`).
  - Base price: 70,000 VND for 2 strips (5×15); 90,000 VND for 2 postcards (10×15).
  - Primary button: Advances to payment via `action('session.setQuantity', { quantity })`.

#### 4. PaymentScreen (`PaymentScreen.tsx`, V1: `PaymentScreen.kt`)
- **Visual Presentation**: Step 3 header (`Thanh toán`), two-column receipt and QR layout. Left column shows order details (layout, size, quantity, breakdown, total). Right column shows the stable QR frame and instructions.
- **Interactions & Secret Gestures**:
  - Link creation: Automatically calls `payment.createLink` when entering screen without a QR code.
  - Polling loop: Polls `payment.checkStatus` every 3000ms until paid.
  - 15s timeout: If creating a link takes > 15s, transitions to error recovery.
  - Zero Layout Shift: `.v1-payment-qr-slot` has a fixed square aspect ratio so columns do not jump when the QR code loads.
  - **Staff Override Gesture**: Pressing and holding `.v1-heading-title[data-staff-trigger="true"]` for 1000ms opens the "Mã PIN nhân viên" modal. Pointer movement > 12px cancels the hold.
  - **Staff PIN Keypad**: 4-digit PIN keypad. Correct PIN is `'1234'`. Entering `'1234'` dismisses the modal and reveals the staff cash button (`[data-testid="staff-cash-btn"]`).
  - Staff Cash Confirmation: Clicking `.v1-staff-cash-btn` invokes `payment.mockComplete({ staffOverride: true, method: 'TIEN_MAT' })`.

#### 5. PrepareScreen (`PrepareScreen.tsx`, V1: `PrepareScreen.kt`)
- **Visual Presentation**: Fullscreen transition card ("Hãy nhìn vào ống kính — Đứng gần nhau, tạo dáng thoải mái và mỉm cười nhé!").
- **Display Metadata**: Displays layout title, shot count (`X lượt chụp`), and per-layout countdown (`Đếm ngược Ys`).
- **Invariants**: Fleeting automatic transition while camera service initialises hardware capture parameters.

#### 6. CaptureScreen (`CaptureScreen.tsx`, V1: `CaptureScreen.kt`)
- **Visual Presentation**: Immersive darkroom (`.v1-shell.v1-camera`). Mirrored live view video stream (`scaleX(-1)`), aspect ratio crop overlay box (`.v1-crop`), top counter (`Ảnh X/Y`), and central shutter button (`.v1-shutter`).
- **Interactions & Geometry**:
  - Initial Live View: Circular shutter button centered horizontally (≤ 1px offset), outer diameter 108×108px, inner core 84×84px.
  - Multi-touch prevention: `starting.current = true` prevents multiple clicks from dispatching concurrent capture requests.
  - Sequence Trigger: Clicking shutter invokes `action('capture.startSequence')`.
  - Countdown Overlay: Dead-centered in viewport (dx ≤ 2px, dy ≤ 2px). Displays remaining seconds with 50ms interval calculation based on `performance.now()`.
  - Flash: Triggers CSS shutter flash overlay (`.v1-flash.v1-shutter-flash`) on `CAPTURING`.

#### 7. SelectPhotosScreen (`SelectPhotosScreen.tsx`, V1: `SelectPhotosScreen.kt`)
- **Visual Presentation**: Split stage showing candidate photo grid (2-column for landscape, 3-column for portrait) on the left, live composite print preview on the right.
- **Interactions & Timing Invariants**:
  - Short Tap (Toggle): Appends or removes photo index via `action('selection.toggle', { shotIndex })`.
  - Selection Quota: Capped at `layout.selectCount`. Unselected photos become dimmed (`.v1-photo-dimmed`) when quota is full, but pointer events remain active.
  - Numbered Badges: Selected photos display a 1-based order badge (`.v1-photo-order`) reflecting their position in the composite slot sequence.
  - **500ms Press-and-Hold Zoom**: Pressing pointer on a photo for ≥ 500ms opens the enlarged lightbox dialog (`.v1-hold-lightbox`). Releasing the pointer immediately dismisses the lightbox.
  - Tap vs Hold Distinction: A 200ms suppression timer ensures that releasing a hold does not accidentally toggle photo selection.
  - Live Preview Parity: As photos are tapped, the live SVG composite preview on the right renders the chosen photos in real-time (< 100ms latency).
  - Inactivity Timer: Displays `.v1-timer` countdown badge; auto-advances if time expires.
  - Confirmation: CTA is enabled only when `localSelected.length === layout.selectCount`. Advances via `action('selection.confirm', { selectedIndices })`.

#### 8. FrameScreen (`FrameScreen.tsx`, V1: `FrameScreen.kt`)
- **Visual Presentation**: Step 4 header (`Chọn khung trang trí`), split screen with live composed preview on the left and 2-column frame grid on the right.
- **Interactions**:
  - Frame Selection: Tapping an unselected frame updates selection via `action('frame.select', { frameId })`.
  - Fast Confirmation: Tapping the *already selected* frame triggers immediate confirmation to the next screen.
  - Primary CTA: "Xem bản in →" invokes `action('frame.confirm', { frameId })`.
  - Frame Title Sanitization: Technical file extensions (`.png`, `.jpg`), underscores, and numeric IDs are automatically stripped via `formatFrameName()`.

#### 9. ConfirmScreen (`ConfirmScreen.tsx`, V1: `ConfirmScreen.kt`)
- **Visual Presentation**: Final verification stage. Displays the authoritative composed 600 DPI print preview (`PrintPreview`) alongside order summary details.
- **Execution Branching**:
  - Real Mode: Primary button reads `Xác nhận & in →` and invokes `action('print.confirmReal')`. Transmits real print job to Windows print queue and records transaction in SQLite database.
  - Dry-Run / Demo Mode: Primary button reads `Xác nhận bản mô phỏng →` and invokes `action('print.confirmDryRun')`. Submits zero real prints and generates ZERO revenue records in the database.
  - Multi-click prevention: `sent.current = true` prevents duplicate print submissions.

#### 10. PrintingScreen (`PrintingScreen.tsx`, V1: Compose Desktop internal progress)
- **Visual Presentation**: Stepped progress pipeline:
  1. `Ghép ảnh` (Composition)
  2. `In ảnh` (Print job dispatch)
  3. `Album & QR` (Cloudinary upload & QR generation)
  4. `Hoàn tất` (Completion)
- **Status Reporting**: Displays live system messages or failure alerts (`snapshot.failure`).

#### 11. DeliveryScreen (`DeliveryScreen.tsx`, V1: `DeliveryScreen.kt`)
- **Visual Presentation**: Final hand-off screen. Displays success icon, order confirmation pills, transmission status card, and large QR code for mobile web album download.
- **Key Indicators**:
  - Print Transmission Badge: `.v1-print-signal-badge` with green dot and text `TÍN HIỆU IN: ĐÃ TRUYỀN THÀNH CÔNG`.
  - Web Album QR: Rendered in `.v1-delivery-qr`. If available, provides clickable link to online album.
  - Completion Action: Clicking `Hoàn thành · Về trang đầu` invokes `action('session.finish')`, destroying session storage and resetting kiosk to `StartScreen`.

---

### 3.2 Operator Views & Administration

#### 1. Operator (`Operator.tsx`, V1: `AdminScreen.kt`)
- **Visual Presentation**: Tabbed administration interface with Atelier frosted glass styling.
- **Navigation Tabs**: Exactly 6 tabs matching legacy V1:
  1. `Frames` ("Khung")
  2. `Layouts` ("Bố cục")
  3. `Settings` ("Cài đặt")
  4. `Tools` ("Công cụ" — Layout calculator)
  5. `Colors` ("Màu ảnh" — LUT & Color library)
  6. `Revenue` ("Doanh thu" — Sales repository audit)
- **Hardware Status Pills**: Header displays real-time connectivity pills for Camera, Print, and Cloud Sync.
- **Exit Safety**: Header back button (`[data-testid="operator-close"]`) checks for unsaved changes before exiting to the kiosk.

#### 2. V1Settings (`V1Settings.tsx`, V1: `SettingsTabContent.kt`)
- **Visual Presentation**: Dedicated settings sheet for configuring kiosk runtime parameters for upcoming sessions.
- **Persisted Settings (Exactly 6 Properties)**:
  1. `enableSystemPrint: boolean` — Enables sending real jobs to Windows printer driver.
  2. `useHotFolder: boolean` — Switches camera source from Canon/Webcam to directory polling.
  3. `hotFolderPath: string` — File system path for Hot Folder image drop.
  4. `postCaptureTimeoutSeconds: number` — Inactivity timeout after photo capture.
  5. `photoSelectionTimeoutSeconds: number` — Inactivity timeout on photo selection screen.
  6. `frameSelectionTimeoutSeconds: number` — Inactivity timeout on frame selection screen.
- **Validation Contract**:
  - `schemaVersion === 1`
  - `appliesTo === 'NEXT_SESSION'`
  - `hardwareApply === 'PENDING_DISABLED'` (Settings apply to subsequent sessions; no live mid-session hardware reconfiguration allowed).
  - Timeout bounds: Integer values in range `0..3600` seconds; adjusted in 10-second increments via stepper buttons.
- **Required Test IDs**:
  - `settings-print`
  - `settings-camera-webcam`, `settings-camera-hot-folder`, `settings-hot-folder-path`
  - `settings-photo-minus`, `settings-photo-plus`
  - `settings-frame-minus`, `settings-frame-plus`
  - `settings-post-minus`, `settings-post-plus`
  - `settings-save`, `settings-reload`

---

## 4. Phase 2: Exhaustive Behavioral Invariants Matrix

| Category | Invariant Rule | Exact Specification | Evidence Reference |
| :--- | :--- | :--- | :--- |
| **Navigation Flow** | Linear Step Progression | Exact sequence: `Start` → `Layout` → `Quantity` → `Payment` → `Prepare` → `Capture Sequence` → `Select Photos` → `Frame` → `Confirm` → `Printing` → `Delivery` → `Reset (Start)`. | `KioskSimulator.tsx:80-90`, `V1: DesktopBoothController.kt:180-260` `[Observed in code]` |
| **Navigation Flow** | Back-step Navigation | Back button (`.v1-back`) invokes `session.back`. Allowed during Layout, Quantity, Payment, Photo Selection, Frame, and Confirm. Forbidden during Capture, Printing, and Delivery. | `KioskSimulator.tsx:67`, `tests/verify-demo-and-real-journey.mjs:51-75` `[Observed in code]` |
| **Navigation Flow** | In-Session Cancellation | Cancel button (`.v1-menu`) available during Photo Selection and Frame. Opens confirmation modal. Clicking "Xác nhận hủy" invokes `session.cancel` and purges session state. | `KioskSimulator.tsx:92-93`, `SelectPhotosScreen.kt:106` `[Observed in code]` |
| **Touch Gesture** | Operator Access | Tapping `.v1-brand` ("LE SOUVENIR") wordmark 5 consecutive times opens Admin/Operator screen. Counter resets on trigger. | `StartScreen.tsx:18`, `StartScreen.kt:68-73` `[Observed in code]` |
| **Touch Gesture** | Staff Cash Override | Pressing and holding `.v1-heading-title[data-staff-trigger="true"]` on Payment screen for ≥ 1000ms opens staff PIN modal. Displacement > 12px aborts gesture. | `PaymentScreen.tsx:64`, `PaymentScreen.kt:42-44` `[Observed in code]` |
| **Touch Gesture** | Staff Security PIN | Entering 4-digit PIN `'1234'` in `.v1-staff-pin` keypad unlocks the staff cash override button (`[data-testid="staff-cash-btn"]`). | `PaymentScreen.tsx:61`, `tests/verify-demo-and-real-journey.mjs:94-100` `[Observed in code]` |
| **Touch Gesture** | Photo Hold-to-Zoom | Pressing pointer on photo thumbnail for ≥ 500ms opens fullscreen lightbox (`.v1-lightbox`). Releasing pointer immediately dismisses it. | `SelectPhotosScreen.tsx:76-87`, `CoreComponents.kt:550-572` `[Observed in code]` |
| **Touch Gesture** | Tap vs Zoom Distinction | Lightbox dismissal triggers a 200ms click suppression window (`wasHeld.current`), preventing accidental selection toggle upon finger release. | `SelectPhotosScreen.tsx:86, 97-101` `[Observed in code]` |
| **Touch Controls** | Multi-touch Prevention | Every critical action button uses an immediate ref lock (`starting.current`, `confirming.current`, `sent.current`, `pressed.current`) to discard rapid concurrent taps. | `CaptureScreen.tsx:8,52`, `ConfirmScreen.tsx:6,30`, `StartScreen.tsx:9,11` `[Observed in code]` |
| **Touch Geometry** | Touch Target Minimum | All interactive kiosk buttons must provide a minimum physical bounding box of 56×56px (Operator controls minimum 48×48px). | `atelier.css:3,5`, `tests/verify-demo-and-real-journey.mjs:67` `[Observed in code]` |
| **Touch Geometry** | Shutter Button Dimensions | Capture shutter button must measure exactly 108×108px with an inner core of 84×84px, centered horizontally within ≤ 1px. | `tests/verify-demo-and-real-journey.mjs:106-112`, `CaptureScreen.kt:92,108` `[Observed in code]` |
| **Touch Geometry** | Countdown Centering | Countdown readout number during capture must be centered within ≤ 2px on both horizontal and vertical axes. | `tests/verify-demo-and-real-journey.mjs:121-124`, `CaptureScreen.kt:119` `[Observed in code]` |
| **Layout & Price** | 5×15 cm Strip Rule | Strip layouts require strictly even print copy quantities: `[2, 4, 6, 8, ... 50]` (step 2). Odd numbers are strictly prohibited. | `PricingCalculator.kt:21-27`, `QuantityScreen.tsx:9` `[Observed in code]` |
| **Layout & Price** | 10×15 cm Postcard Rule | Postcard layouts allow sequential copy quantities: `[2, 3, 4, ... 50]` (step 1). | `PricingCalculator.kt:22`, `QuantityScreen.tsx:9` `[Observed in code]` |
| **Layout & Price** | Base Pricing Structure | Base price for 2 copies: 70,000 VND (5×15 strip); 90,000 VND (10×15 postcard). Extra copies: 20,000 VND / strip pair; 30,000 VND / postcard. | `PricingCalculator.kt:35-37` `[Observed in code]` |
| **Layout & Price** | Zero Emoji Policy | Customer-facing typography and copy must contain ZERO emojis. Only clean editorial text, numbers, and Lucide vector icons are permitted. | `tests/verify-demo-and-real-journey.mjs:76` `[Observed in code]` |
| **Capture Engine** | Configurable Shots & Timers | Number of capture shots (`shotCount`) and countdown seconds (`countdownSeconds`) are properties of `LayoutMode`. They are NEVER hardcoded to 6 or 5. | `BoothModels.kt:26-28`, `CaptureScreen.tsx:51`, `PrepareScreen.tsx:2` `[Observed in code]` |
| **Capture Engine** | Camera Live View Mirroring | Live View preview stream is mirrored horizontally (`scaleX(-1)`) so customer movement mirrors a physical reflection. | `CaptureScreen.tsx:43`, `atelier.css:17` `[Observed in code]` |
| **Photo Selection** | FIFO Order Assignment | Photo tap sequence dictates layout slot assignment (1st tap → Slot 1, 2nd tap → Slot 2). Badges display 1-based order. | `SelectPhotosScreen.tsx:62,106`, `CoreComponents.kt:549` `[Observed in code]` |
| **Photo Selection** | Deselection Re-indexing | Deselecting an active photo removes it from the list and immediately shifts all subsequent selections down by 1 index. | `screens.test.tsx:25`, `DesktopBoothController.kt:673-679` `[Observed in code]` |
| **Photo Selection** | Quota Enforcement | Tapping unselected photos when `selected.length === selectCount` is rejected. Confirm CTA enabled only when quota is exactly met. | `SelectPhotosScreen.tsx:45,128`, `DesktopBoothController.kt:683` `[Observed in code]` |
| **Photo Selection** | Inactivity Timeout Fallback | When photo/frame selection timer reaches 0, system auto-selects remaining needed photos, chooses default frame, and auto-submits print. | `DesktopBoothController.kt:291-311` `[Observed in code]` |
| **Frame Selection** | Double-Tap Confirmation | Tapping an unselected frame selects it. Tapping the already-selected frame acts as an immediate confirmation. | `FrameScreen.tsx:36,46` `[Observed in code]` |
| **Frame Selection** | Title Sanitization | Frame file names are cleaned of technical substrings (`.png`, `.jpg`, underscores, numbers) or default to "Khung phong cách". | `FrameScreen.tsx:7-17` `[Observed in code]` |
| **Confirm & Print** | 600 DPI Preview Parity | Confirm screen displays the authoritative composite canvas image (`compositionDataUrl` / `printImageDataUrl`), matching exact print dimensions. | `ConfirmScreen.tsx:8,13`, `tests/verify-demo-and-real-journey.mjs:171` `[Observed in code]` |
| **Confirm & Print** | Dry-Run vs Real Branch | Real mode triggers `print.confirmReal` (sends Windows print job + DB record); Dry-Run triggers `print.confirmDryRun` (no physical print, ZERO revenue). | `ConfirmScreen.tsx:7,30`, `tests/verify-demo-and-real-journey.mjs:173-174` `[Observed in code]` |
| **Delivery** | Print Signal Assurance | Delivery screen displays green signal badge `TÍN HIỆU IN: ĐÃ TRUYỀN THÀNH CÔNG` once the print command is acknowledged. | `DeliveryScreen.tsx:6` `[Observed in code]` |
| **Delivery** | Session Reset | Clicking "Hoàn thành · Về trang đầu" calls `session.finish`, clearing session IDs and restoring kiosk to StartScreen in clean state. | `DeliveryScreen.tsx:6`, `KioskSimulator.tsx:67` `[Observed in code]` |
| **Settings & Ops** | 6 Persisted Properties | Settings schema stores exactly: `enableSystemPrint`, `useHotFolder`, `hotFolderPath`, `postCaptureTimeoutSeconds`, `photoSelectionTimeoutSeconds`, `frameSelectionTimeoutSeconds`. | `V1Settings.tsx:5`, `SettingsTabContent.kt:30-38` `[Observed in code]` |
| **Settings & Ops** | Stepper Bounds & Steps | Timeouts step by ±10 seconds, constrained strictly between 0 and 3600 seconds. | `V1Settings.tsx:25,32` `[Observed in code]` |
| **Settings & Ops** | Hardware Safety Gate | Settings apply to `NEXT_SESSION` with `hardwareApply: 'PENDING_DISABLED'`. Live mid-session hardware mutation is prohibited. | `V1Settings.tsx:6-12` `[Observed in code]` |

---

## 5. Automated Acceptance Testing & CDP Contracts

The rebuilt frontend must pass the automated Chromium DevTools Protocol (CDP) test scripts without modifications to test logic. The following automated verification rules are enforced:

### 5.1 CDP Invariants in `tests/verify-demo-and-real-journey.mjs`
1. **Zero Emoji Constraint**:
   ```javascript
   check(!/[⚡📱✨🎉🖨️]/.test(document.body.innerText), "zero emoji in UI");
   ```
2. **Payment QR Layout Stability (Zero Layout Shift)**:
   ```javascript
   // Both before and after QR image completes loading:
   const shifts = { slotWidth, slotHeight, columnsX, columnsY, columnsWidth, columnsHeight };
   check(Object.values(shifts).every(v => v < 0.01), "QR container constant and columns layout shift = 0px");
   ```
3. **Selection Latency Threshold**:
   ```javascript
   // Time from button.click() to aria-pressed="true" or badge appearance:
   check(measurement < 100, "photo selection latency < 100ms");
   check(measurement < 100, "frame selection latency < 100ms");
   ```
4. **Shutter Button Geometry**:
   - `shutter.width === 108px` (±1px)
   - `shutter.height === 108px` (±1px)
   - `core.width === 84px` (±1px)
   - `core.height === 84px` (±1px)
   - `centerDx <= 1px` (Dead centered horizontally in window).
5. **Countdown Geometry**:
   - `centerDx <= 2px` (Centered horizontally).
   - `centerDy <= 2px` (Centered vertically).
6. **Press-and-Hold Lightbox Verification**:
   - `pointerdown` at (150, 150) for 600ms opens `.v1-hold-lightbox`.
   - `pointerup` at (150, 150) dismisses `.v1-hold-lightbox` within 200ms.
7. **Zero Sales in Demo Mode**:
   ```bash
   sqlite3 data/sales.db "select count(*) from sales where upper(coalesce(capture_mode,''))='DEMO';" # MUST EQUAL 0
   ```

### 5.2 Settings Parity Invariants in `tests/v1-settings-parity/mounted-settings-parity.mjs`
1. **Viewport Verification**: Executed at both `1280×800` and `1920×1200` (16:10 aspect ratio).
2. **Zero Document Overflow**:
   ```javascript
   check(document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1, "horizontal document overflow = 0px");
   ```
3. **Touch Sizing**: All enabled interactive controls in Settings must have `width >= 48px` and `height >= 48px`.
4. **Required Data Test IDs**:
   `settings-print`, `settings-camera-webcam`, `settings-camera-hot-folder`, `settings-hot-folder-path`, `settings-photo-minus`, `settings-photo-plus`, `settings-frame-minus`, `settings-frame-plus`, `settings-post-minus`, `settings-post-plus`, `settings-save`, `settings-reload`, `operator-close`, `operator-tab-settings`, `settings-effective-timers`.

---

## 6. Implementation Guardrails for Frontend Reconstruction

When implementing the new unified frontend codebase, the engineering team must follow these non-negotiable boundaries:

1. **Keep Functional Selectors Intact**: You may refactor CSS from raw files into modern CSS modules or Tailwind utility classes, but **every class name, data attribute, and ARIA label listed in Section 2.3 must remain present on the rendered elements**.
2. **Never Hardcode Layout Quantities or Timers**: All shot counts and countdown seconds must flow dynamically from the `LayoutMode` payload received from the backend IPC (`catalog.get` or `session.getState`).
3. **Preserve Multi-Click Locks**: Every button triggering an asynchronous IPC call must disable immediately upon click and utilize a synchronous `useRef` lock to prevent touch bouncing.
4. **Preserve the Two-Tap Selection Flow**: Layout carousel and Frame selection both implement single-tap preview and second-tap advance. Do not replace this with single-tap immediate advance.
5. **Preserve Zero Layout Shift on Payment**: The QR slot on the payment screen must always maintain fixed physical boundaries while awaiting backend image synthesis.
6. **Strict Separation of Dry-Run and Real Modes**: ConfirmScreen must inspect `snapshot.captureMode` / `snapshot.runtimeMode` and dispatch the exact matching command (`print.confirmReal` vs `print.confirmDryRun`).
7. **Read-Only Legacy Integrity**: Never alter, rename, or write to any file in `E:\HK1_2026_2027\PhotoboothDesktop`.
