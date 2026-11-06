# LE SOUVENIR V2 — Atelier reconstruction specification

**Status:** design handoff, not implemented UI. **Scope:** presentation/CSS architecture only; no V1 edits, backend changes, hardware claims, or payment/print actions. Source of functional truth: `FRONTEND_RECONSTRUCTION_INVARIANTS.md` §§2–5 and current V2 React components. Visual direction: **Premium Korean Photo Atelier** — a warm editorial gallery, actual print artwork floating above a matte surface, and restrained glass only on controls. Replace the legacy cascade rather than layering another override. The 18 views below count 11 customer views, six operator tabs, and one shared recovery surface. Admin is the container of the six tabs; modal/lightbox and finish/reset are states, not invented navigation stages.

## 1. Two viable directions and decision

| | A — Editorial gallery (selected) | B — Centered exhibition |
|---|---|---|
| Welcome | Copy/CTA left ~48%, two staggered physical prints right ~52%; restrained warm halo behind artwork | Hero print centered with copy in a low floating band |
| Capture | Edge-to-edge darkroom viewport; viewfinder uses maximum central area, shot counter in safe top rail, shutter bottom-center | Feed in inset dark panel, large editorial side rail for instructions |
| Tradeoff | Clear text and finger access; largest possible aspect-correct face area and precisely centered countdown | Symmetric hero but smaller camera frame; side rail competes with faces and reduces legibility at 1280×800 |

Choose **A**. Gallery geometry scales down without changing the customer's reading order; capture uses no face-obscuring side chrome. No synthetic stock/customer images: use authorized layout artwork and session imagery, or a clearly labeled illustration. Welcome halo is a single low-contrast localized light effect, **not** a full-screen multicolor gradient; no glass behind QR, prints, or primary text.

## 2. Replacement CSS architecture and migration

Implement **after the acceptance snapshot**, not as additional legacy overrides:

```text
frontend/src/styles.css               Tailwind entry + ordered imports only
frontend/src/atelier/theme-tokens.css  :root tokens, color scheme, type fallback
frontend/src/atelier/atelier-core.css  reset scoped to app; shell, heading, buttons, focus,
                                       dialog, timer, error, artwork, scroll containment
frontend/src/atelier/atelier-customer.css
                                       11 screen layouts; capture isolated dark theme
frontend/src/atelier/atelier-operator.css
                                       operator container, six tabs, settings controls
```

One import order, one owner for each selector. `styles.css` must not retain mock simulator declarations. Remove imports for `customer.css`, `stages.css`, `finishing.css`, `preview.css`, `kiosk-v1.css`, `atelier.css`, `screens/payment.css`, `operator/operator-v1.css`, `operator/atelier-operator.css`, `v1-settings.css` **only after** all active declarations have been ported and parity tests pass. Do not delete functional JSX selectors. No `!important`, no global `button` visual rules outside scoped app roots, no fixed simulator phase heights, no obsolete `.simulator` or mock paper-strip CSS, no competing token aliases. For Tailwind utilities, reserve CSS ownership of geometry for contract selectors; utilities may supply non-conflicting local typography. Keep component-specific state styling on existing `aria-pressed`, `disabled`, `aria-busy`, `data-distance`, and `[role]` attributes; add presentation-only classes if needed, never replace test hooks. Capture theme scoped under `.v1-shell.v1-camera` and QR slot under `.v1-shell-payment`/`.v1-payment-screen`.

**Selector ownership inventory (all preserved):**

| Owner | Must style directly and preserve in rendered DOM |
|---|---|
| Core | `.v1-shell`, `.v1-panel` (when used), `.v1-primary`, `.v1-secondary`, `.v1-back.backButton`, `.appHeader.v1-heading`, `.appHeader__backSlot`, `.v1-heading-title[data-staff-trigger="true"]`, `.v1-timer`, `.v1-menu`, `.v1-overlay`, `.v1-modal`, `.v1-error`, `.v1-preview`, `.v1-actionbar`, `.v1-lightbox`, `.v1-hold-lightbox` |
| Customer: start/layout/quantity | `.v1-start`, `.v1-brand`, `.v1-layout-stage`, `.v1-carousel-wrap`, `.v1-carousel-arrow.v1-carousel-prev`, `.v1-carousel-arrow.v1-carousel-next`, `.v1-layout-carousel`, `.v1-layout-card.v1-carousel-card[data-layout-id][data-distance]`, `.v1-carousel-indicator[aria-live]`, `.v1-stepper` plus its first/last buttons and `strong`, `.v1-quantity-total[aria-live]` |
| Customer: payment | `.v1-shell.v1-shell-payment`, `.v1-payment-screen`, `.v1-payment-columns`, `.v1-payment-summary`, `.v1-payment-price`, `.v1-payment-details`, `.v1-payment-qr-panel`, `.v1-payment-qr-slot[role=status]` and its `img`, `.v1-payment-staff`, `.v1-staff-cash-btn[data-testid=staff-cash-btn]`, `.v1-staff-pin`, `.v1-pin-keypad button` |
| Customer: capture | `.v1-shell.v1-camera`, `.v1-capture-screen.v1-capture`, `.v1-camera-viewport`, `.v1-live` with `--image-ratio`, `img.v1-live-mirrored`, `.v1-crop`, `.v1-capture-top`, `.v1-shutter-control`, `.v1-shutter`, `.v1-shutter-ring`, `.v1-shutter-core`, `.v1-countdown-layer[role=timer]`, `.v1-countdown`, `.v1-flash.v1-shutter-flash` |
| Customer: selection/end | `.v1-selection`, `.v1-photo-grid`, `button[aria-label^="Chọn ảnh "]`, `.v1-photo-order`, `.v1-photo-dimmed`, `.v1-frame-workspace`, `.v1-frame-preview-panel`, `.v1-frame-grid button[aria-pressed]`, `.v1-frame-check`, `.v1-confirm-screen`, `.v1-confirm-workspace`, `.v1-summary-total`, `.v1-print-stage.v1-pipeline`, `.v1-delivery-screen`, `.v1-delivery-qr`, `.v1-print-signal-badge` |
| Operator | `[data-testid=operator-workspace]`, `[data-testid=operator-close]`, `[data-testid^=operator-tab-]`, `[data-testid=v1-settings]`, `[data-testid=settings-print][role=switch]`, `[data-testid^=settings-camera-]`, `[data-testid^=settings-hot-folder-]`, `[data-testid^=settings-photo-]`, `[data-testid^=settings-frame-]`, `[data-testid^=settings-post-]`, `[data-testid=settings-save]`, `[data-testid=settings-reload]`, `[data-testid=settings-effective-timers]` |

Do not style a hidden operator trigger as an advertised button. Preserve its DOM hook and 1000 ms hold area; visual presentation remains a normal payment heading. Do not change Vietnamese ARIA names or `data-testid` values to make styling easier.

## 3. Tokens, dimensions and typography

Proposed source-of-truth values (CSS custom properties in `theme-tokens.css`):

```css
:root {
  --at-canvas: #FAF7F2; --at-canvas-muted: #F6F1EA;
  --at-ink: #1A1715; --at-body: #514842; --at-muted: #625750;
  --at-primary: #8E442D; --at-accent: #C27357;
  --at-champagne: #D8C7B5; --at-rose: #F0DBD4;
  --at-hairline: rgba(81,72,66,.24); --at-white: #FFFFFF;
  --at-glass: rgba(255,255,255,.72);
  --at-glass-filter: blur(14px) saturate(120%);
  --at-darkroom: #121214; --at-success: #245C42;
  --at-paper-shadow: drop-shadow(0 20px 36px rgba(44,30,23,.22)) drop-shadow(0 4px 10px rgba(44,30,23,.10));
  --at-press: 0.18s cubic-bezier(.2,.8,.25,1);
  --at-card: 0.28s ease;
  --at-space-1: 8px; --at-space-2: 12px; --at-space-3: 16px;
  --at-space-4: 24px; --at-space-5: 32px; --at-space-6: 48px;
  --at-gutter: clamp(24px, 3.75vw, 72px);
  --at-target: 56px; --at-primary-height: 72px;
}
```

Warm ivory covers the canvas, not individual nested white cards. Dark coral CTA uses white text (contrast target ≥4.5:1; verify actual color pair in browser); smaller terracotta marks only borders, active indicators and decorative accents, never small low-contrast text. Print artwork has **transparent/unboxed outer wrapper**, original artwork edges, correct image aspect, shadow on the artwork element itself. Glass is limited to carousel chevrons, low-profile toolbars, operator panels and occasional overlay controls; provide `@supports not (backdrop-filter: blur(14px))` opaque ivory/white fallback. QR surface is always **opaque white** with quiet zone, no filter or translucency. On darkroom use high-contrast off-white and solid/near-solid backing for counter only; never shadow-filter the feed.

Typography: `"Segoe UI", "Noto Sans", Arial, sans-serif` for Vietnamese UI; editorial heading may use `Georgia, "Times New Roman", serif` **only if** Vietnamese glyphs render consistently; otherwise Segoe UI. No externally hosted or assumed font files. Use `font-variant-numeric: tabular-nums` for countdown, quantity, totals, timers; headline clamp(42px, 4.8vw, 84px), view headings clamp(30px, 3vw, 52px), body clamp(18px, 1.25vw, 24px), metadata ≥16px. Countdown clamp(120px, 18vh, 220px), test across booth at distance with 3-digit dynamic values. Do not turn titles into illegible all-caps microtype.

Primary CTA min-height 72px (68px acceptable only with tested vertical constraint), secondary ≥56px, kiosk nav ≥56×56px, layout chevrons visible 64×64px, stepper 72×72px, shutter **exactly 108×108px**, core **exactly 84×84px**, operator enabled controls ≥48×48px, preferably 56px. `box-sizing: border-box` ensures measured physical geometry at CSS pixel scale. Press states `transform: scale(.98)` only on art/cards; **never transform shutter, countdown, payment QR slot or their measured parent**. Disabled opacity must retain readable copy; add solid muted fill, explicit text, `disabled` and `aria-busy` when applicable. Focus-visible 3px solid coral outline offset 3px; never depend on hover. `touch-action: manipulation` for controls; `touch-action: pan-x` carousel; hold gesture areas require pointer cancellation on movement and cancel/leave. Avoid CSS `user-select: none` on input content.

## 4. Geometry and motion contract

All layouts designed at **1280×800** and **1920×1200**, tested also at Windows 100/125/150% scaling using *actual CSS viewport measurements*, not assumed device pixels. Available height can shrink with OS chrome; customer root uses `min-height: 100dvh`, max width controlled by gutters, `min-width: 0` on every grid child; no document horizontal overflow. Prefer `grid-template-columns: minmax(0,...)` and `minmax(0,1fr)`; internal grid/list scroll only, fixed bottom action rail when necessary with content padding preventing overlap. Break at width <1100 CSS px OR height <760 CSS px to compact 2-column geometry and smaller gaps; at width <900 CSS px stack non-capture content with internal scrolling, never squash touch targets. For 16:10 baseline, usable header ~104px, action region ~100px, body takes remaining space. Localize strings with natural wrapping (2–3 lines), never text clipping for CTA, price, ARIA-backed state, or failure; truncation permitted only for long technical paths with a separate full-path accessible label.

Print preview: `object-fit: contain`, `aspect-ratio` sourced from layout (`printAspectRatio`); compositionDataUrl/printImageDataUrl authoritative at final confirm, no decorative masks or orientation distortions. Feed: use intrinsic `naturalWidth/naturalHeight` (`--image-ratio`) and `layout.photoAspectRatio`; mirror only `img.v1-live-mirrored` horizontally, preserve crop alignment and mirror text outside the feed normally. Face-safe overlays at perimeter; countdown is centered on **viewport**, not on scaled crop. Counter is top edge, shutter bottom center; their hitboxes do not overlap crop center.

Motion: press 180ms, art focus scaling 280ms, view entrance 220–320ms max only if it cannot delay camera readiness or IPC updates. Frame/photo state feedback ≤100ms. Flash animation bounded to actual CAPTURING state; no timed animation as proof of capture/print/payment. Disable nonessential animation under `prefers-reduced-motion: reduce`; keep instantaneous selection and countdown numerals. Optional `navigator.vibrate` only where supported/allowed, never prerequisites to transition. No auto-replay of uncertain commands. Loading skeleton/placeholder reserves exact final space.

## 5. Screen-by-screen implementation handoff (18 views)

All transitions below refer to the current V2 dispatch contracts, not new workflow. Shared rule: async CTA synchronous ref lock + immediate disabled visual; backend state determines exit, not animation completion. Errors preserve session and offer status check, **never** blind payment/print retry. `session.back` only on Layout, Quantity, Payment, Select Photos, Frame, Confirm. `session.cancel` only via confirmation in Select Photos/Frame. Each view accepts screenshot review at two target viewports, 100/125/150% Windows scaling, long Vietnamese strings, no horizontal document overflow, targets measured by DOM, and reduced motion.

### 01 Welcome / Start (`IDLE`)
Entrance: empty/finished session and catalog load. Left editorial headline/CTA; right layered print gallery, portrait rotate −7°, strip +6°, gentle halo behind prints, only authorized artwork; optional event bundle chips. `.v1-brand` five consecutive taps opens operator (counter resets). Start calls `session.start` once with selected/default valid layout; bundle selection follows existing immediate start behavior, **not** new checkout. Catalog unavailable/empty disables start and announces why; load/connection errors use recovery surface. 48/52 split; CTA 72px. Test five taps, duplicate taps, unavailable catalog, absent bundle image and long bundle titles.

### 02 Studio Mode / Layout (`SELECTING`)
Carousel artwork without card backings: center `[data-distance="0"]` scale 1.08, neighbors .94, distant .88; 64px glass chevrons on same axis (≤3px y difference), current/total indicator. Dynamic catalog IDs on `[data-layout-id]`. Prev/next circular; swipe optional, snap after 160ms debounce. Tap distant = center and `session.setLayout`; tap centered = `session.confirmSetup` → quantity. Loading/empty disables confirmation and explains catalog issue. Test two-tap distinction, chevrons, swipe, long title and scale without clipping.

### 03 Quantity (`SELECTING_QUANTITY`)
40% stepper, pricing and 72px continue; 60% enlarged unboxed print. Display allowed values from `catalog.pricing.stripAllowedQuantities` / `printAllowedQuantities`, price from authoritative `pricing` payload; never derive allowed max from audit's inconsistent sample tables (audit §3.1 says up to 20/10 while §4 says up to 50). Stepper 72×72, disabled at actual allowed bounds; `aria-live` total and value. Continue invokes `session.setQuantity`; back via `session.back`. No invented price formula on client. Test even strip/valid postcard values using backend options, price update, rapid taps and empty options.

### 04 Payment (`PAYMENT_PENDING`)
Receipt left, QR right; outer grid and `.v1-payment-qr-slot` fixed before/after image load (**0px shift**); solid white square QR quiet zone. On entrance existing `payment.createLink` if absent, status poll every 3000ms, link timeout >15s → existing error/recovery. Payment status auto-advances only on backend confirmation. Heading hold 1000ms with >12px movement abort reveals staff PIN modal; 4-digit keypad and guarded staff cash button follow existing contract; never expose override by default or add a bypass CTA. Back allowed subject to session back rules. Test slot bounding rect delta <.01px, slow/missing QR, expiry, hold cancellation, PIN and staff confirmation. **Security escalation:** current audit reports a fixed client PIN and `payment.mockComplete`; architect must validate production authorization. Design does not claim this is secure and must not change backend semantics itself.

### 05 Prepare (`PREPARING`)
Quiet camera-ready stage: lens cue, layout name, `layout.shotCount` shot pills and `layout.countdownSeconds` copy. Automatically leaves on backend capture readiness; no new Start shortcut; real camera readiness/loading/error status visible without pretending connection. Pills wrap if many, do not hardcode count. Test differing layouts/countdowns and slow camera.

### 06 Capture (`LIVE_VIEW`, `COUNTDOWN`, `CAPTURING`)
Full darkroom `#121214`; largest possible aspect-fitted live feed, crop guide matching layout photo ratio, mirrored image only. Top `Ảnh current/shotCount` from backend capturedCount/layout, bottom-center 108px concentric shutter (84px core) only initial LIVE_VIEW; `capture.startSequence` once; during COUNTDOWN viewport-centered large tabular live numeral from backend-aligned clock, actual 50ms update remains, peripheral guidance does not obscure faces; flash only when CAPTURING. Missing live feed shows explicit waiting/error without faking shutter readiness. No back/cancel. Test shutter center dx≤1px, countdown dx/dy≤2px, feed ratio/orientation, dynamic shot count, multi-touch, rear-to-front step, stream loss.

### 07 Photo selection (`SELECTING_PHOTOS`)
55/45 candidate grid / unboxed composite preview, 2 columns landscape or 3 portrait with aspect-correct tiles. Tap toggles `selection.toggle`, FIFO order badges 1..N, deselect reindexes; full quota dims other choices but preserves pointer behavior, CTA disabled until `layout.selectCount`, then `selection.confirm`. 500ms press zoom lightbox; release dismisses, 200ms click suppression. Preview updates <100ms; decision timer visible; existing timeout fallback may auto-select/advance without user tap. Back via `session.back`; cancel menu confirmation only. Test tap-vs-hold, full quota, reordering, timer expiry and loading imagery.

### 08 Frame selection (`EDITING`)
60/40 unboxed live composition / scrollable two-column artwork choices. Tap new frame `frame.select`, tap already selected confirms via existing fast-confirm behavior; CTA `frame.confirm`. Selected check and `aria-pressed` immediate (<100ms); sanitized display title, no raw filename. Decision timer, back and cancel confirmation as existing. Empty/failed frames: surface actual status and disable advance if unsupported; no fabricated default UI. Test second-tap confirmation, frame load failure, timeout fallback, long titles and preview parity.

### 09 Final confirmation (`PRINT_PENDING`)
65/35 authoritative 600 DPI print composition (visually contained, not browser-upscaled into fake pixels) / concise price and mode receipt; 72px CTA. Real `print.confirmReal` labelled `Xác nhận & in`; demo `print.confirmDryRun` labelled clearly as simulation, **zero real print and zero revenue**; ref lock. Back via `session.back`. No printing until explicit confirm except pre-existing backend timeout rule documented in audit; that rule requires architect review for confirmation gate. Missing composition or uncertain print state: explain/disable, don't invent fallback artwork as final print. Test mode routing, preview source/dimensions, double-tap, and no revenue in demo.

### 10 Printing / upload (`PRINTING`)
Quiet pipeline and live backend status in `.v1-print-stage.v1-pipeline`; show composition, print dispatch, album/QR, completion **only when evidence exists**, otherwise generic `Đang xử lý` pending step, not fabricated percentages. No customer back, retry or print action. Failure is prominent and routes to existing recovery status path; never conflate sent-to-queue with physically printed. Current `KioskSimulator.tsx` renders `<PrintingScreen/>` without snapshot although component accepts it: **frontend/architect contract gap**; do not assert live progress until supplied. Test pending snapshot, failure, demo language and no fake completion.

### 11 Delivery / Finish (`DELIVERY`)
Opaque white album QR and readable instructions; link if available. Green `.v1-print-signal-badge` saying `TÍN HIỆU IN: ĐÃ TRUYỀN THÀNH CÔNG` only when print transmission acknowledged; wording does **not** mean paper finished. Missing album QR shows an honest unavailable state, not blank/placeholder scan target. Finish CTA `session.finish` resets to Welcome; no back. Test QR scanning/quiet zone, missing QR, print signal semantics, finish reset.

### 12 Operator: Frames tab
Protected operator workspace, touch navigation; frame inventory and existing frame controls only. Show backend-provided preview/metadata, aspect-contained artwork, explicit no frames/error state, disable unavailable mutations; preserve existing V2 tab actions and authorization. Test overflow, selection and denied access. Shared operator header/tab contract: exactly six tabs, `[data-testid^="operator-tab-"]`, close guarded by unsaved settings; device status pills must say **unverified** until confirmed by real backend.

### 13 Operator: Layouts tab
List active layout metadata and supported edit controls as presently available; count and countdown display from layout data, not seeded examples. No editing access when `canEditLayouts` false, no visual fake-save. Test readonly/dirty/loading/server reject and long names.

### 14 Operator: Settings tab / devices, camera, printer
`[data-testid=v1-settings]` contains six persisted properties only: real-print toggle, camera source, hot-folder path, post-capture/photo-selection/frame-selection timeouts. 56px switches/controls (≥48px tested), 72px squircle ±10s steppers bounded 0..3600, save/reload retained; show `NEXT_SESSION` / `PENDING_DISABLED` meaning and unsaved-exit guard. Hot-folder path wraps/scrolls in its own field. Do not suggest immediate camera/printer reconfiguration. Test required data IDs, roles, enabled target geometry, persisted vs edited vs save error, both viewports.

### 15 Operator: Tools tab
Existing layout calculator only; inputs and outputs visually separated by hairlines, no fake device calibration. Preserve calculator precision/behavior; scroll internally, 56px targets, invalid-input explanations. Test calculation parity and long labels.

### 16 Operator: Colors tab
Existing LUT/color library only; color thumbnails are contained, avoid recoloring actual customer print preview with CSS filter. Show configured library/empty/error, preserve existing apply/save permission boundaries. Test asset absence and selected state.

### 17 Operator: Revenue tab
Existing sales repository readout; compact readable columns, internal vertical/horizontal scroll for tables (never document overflow), status and empty states. No revenue in demo, no fabricated totals, no financial action from design. Test empty/error, large formatted VND totals and permissions.

### 18 Shared connection, empty, error & recovery surface (`CONNECTING`/`RECOVERY`/`failure`)
Matte canvas or darkroom-safe neutral panel, explicit status `role=status` / failure `role=alert`, no customer-visible raw secrets or device diagnostics. Available recovery button **checks status and reconciles** (`catalog.get` / `session.getState`), does not replay uncertain command. Catalog empty disables start; camera disconnected blocks unsupported progress; QR missing never renders a scannable surrogate; print uncertainty calls staff. Exit only through actual backend state or existing permitted cancel/finish, not guessed timeout. Test network loss at every gate, restart with session storage, duplicate taps, role announcements and no print/payment replay.

## 6. React handoff and gates

Reusable presentational patterns: `AtelierStage` (header/body/action slots, retains `.v1-shell`/`.appHeader`), `AtelierAction` (retains `.v1-primary` or `.v1-secondary`, busy/disabled/ref lock in calling screen), `FloatingPrint` (artwork aspect + paper shadow, never white backing), `AtelierDialog` (existing modal/lightbox roles and focus management), `StatusSurface` (status/alert separate from action), `OperatorControlRow` (label/description/control with existing test ID), `ReceiptRows` (semantic `dl`, formatted VND from backend), `QrWell` (fixed opaque square), `DecisionTimerBadge` (existing backend timer). These are recommendations, not new workflow stages. No static mockup is a functioning UI.

Acceptance gate: (1) inventory selector table mapped to actual DOM; (2) CDP journey/settings parity unchanged, including geometry, QR zero shift, photo/frame <100ms, 500/1000ms hold and back/cancel rules; (3) screenshot comparison at 1280×800 and 1920×1200 at OS scaling 100/125/150%, compact viewport and Vietnamese overflow; (4) keyboard focus, touch without hover, contrast and reduced-motion check; (5) proof no V1 modification and no hardware/payments/real prints during tests. Do not claim this document passes those tests: implementation and verification are still pending.

**Architect coordination requests:** verify whether operator access and the audited staff PIN/cash override are permitted in production; expose trustworthy printing/QR/print-transmission state to the screen (currently PrintingScreen gets no snapshot); resolve confirmed backend timeout behavior at final print gate; identify real hardware status evidence rather than cosmetic pills. Until resolved, show unknown/pending states instead of fabricating success.
