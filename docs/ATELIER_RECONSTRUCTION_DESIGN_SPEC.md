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

## 7. Implementation-ready reconstruction blueprint (supersedes conflicting geometry suggestions above)

**Priority:** Preserve `FRONTEND_RECONSTRUCTION_INVARIANTS.md` §2.3 DOM/test hooks and §4 behavior over aesthetic preferences. This document describes a *target*, not current implementation. Earlier §5 proposes a centered countdown and §2 says capture has no face-obscuring side chrome: the audited CDP geometry **requires** the number centered in the viewport (±2px), so preserve centering and minimize its footprint using a large high-contrast outline/shadow rather than a full opaque scrim; test against real faces. Do not move countdown into a side rail without architect/test-owner approval and an updated acceptance contract. Keep existing 50ms backend-anchored interpolation; never run a new independent capture timer. §5's timeout auto-print description is an audit finding **requiring architect resolution**, not permission to introduce a new client-side confirmation bypass.

### 7.1 DOM composition recipes — remove nested backing, not functional hooks

These snippets are **presentational trees**, not substitutions for handlers. Keep existing component props, hooks, refs, action payloads, pending reconciliation, test IDs, ARIA, and safety disclosures; move existing children into these slots. `AtelierStage` is optional; if introduced, it must NOT wrap a capture `main.v1-shell.v1-camera` in a second stage, and must not remove existing `Heading`, `ActionBar` or `PrintPreview` hooks.

```tsx
// Customer normal screens: app's existing <main className="v1-shell ..."> owns viewport.
<><Heading ... />
  <div className="at-workspace [existing-workspace-class]">
    <section className="at-workspace__art">{/* existing PrintPreview / artwork */}</section>
    <section className="at-workspace__controls">{/* existing controls, no inner .v1-panel backing */}</section>
  </div>
  <ActionBar>{/* existing action(s), eligibility and ref locks unchanged */}</ActionBar>
</>
// Visual roles: canvas = shell; image = paper; glass = toolbar/control only.
```

| Source | Exact restructure instruction; retain selectors listed in §2 | At 1280×800 usable body / image target | Loading, disabled, failure and exit |
|---|---|---|---|
| `StartScreen.tsx` | Root `.v1-start.atelier-welcome` is an open two-column grid. `.atelier-welcome__copy` holds `.v1-brand`, kicker, h1, support line, value pills and `.v1-primary` in that order. `.v1-start-art` contains `.atelier-welcome__gallery` with 2 separate `.atelier-print` figures and caption; event bundle rail is *inside this art column*, horizontally scrollable with visible touch affordances. Avoid a gallery parent white rectangle. | Copy width 45–48%; art 52–55%; front paper artwork height 360–450px; back paper 260–350px; CTA ≥72px tall and ≥280px wide; actual catalog artwork rather than tiny thumbnail. | CTA disabled when unavailable, busy text/status while start pending; keep five-tap `.v1-brand`, no visible admin button. `onStart(layoutId)` once, existing bundle direct-start mapping unchanged. Missing cover uses existing `LayoutArtwork` illustration and never customer media. |
| `StudioModeScreen.tsx` | `<Heading/>` then `.v1-layout-stage > .v1-carousel-wrap` with prev button, `.v1-layout-carousel` and next button as siblings; `.v1-carousel-indicator` below. Keep each `.v1-layout-card.v1-carousel-card[data-layout-id][data-distance]` as **button**, with unboxed `.v1-carousel-art` and 1–2 lines of caption. Do not put the track in a bordered white parent. | Center artwork min(32vw,360px) wide and 390–480px high subject to real print aspect; neighbors partially visible; 64px chevrons on same vertical axis, ≥20px gutter. | Empty `role=status`; chevrons disable for 0/1; first off-center tap centers and sends `session.setLayout`, centered second tap sends `session.confirmSetup`; 160ms scroll settle; back `session.back`. |
| `QuantityScreen.tsx` | `<Heading/>`, `.v1-split.v1-quantity-workspace` with **large `.v1-quantity-preview > PrintPreview`** and `.v1-quantity` controls; `.v1-stepper` above receipt; retain `.v1-panel.v1-quantity-pricing` **class in DOM for compatibility**, but visually make it transparent, borderless and padding 0, with hairlines between rows. `<ActionBar>` remains fixed within shell. | Artwork side 55–60% body width, max-height 510px; stepper buttons 72×72; total 30–40px; action 72px. | Preserve allowed quantity/price source already used by component; its current fallback array in `QuantityScreen.tsx:9` is a **contract risk**: architect to confirm authoritative options before removing; do not expand/chop options in CSS or display provisional total as verified. `session.setQuantity` once; bounds disabled; back existing. |
| `PaymentScreen.tsx` | `<Heading className="v1-payment-heading" .../>` including staff hold title hook. `.v1-payment-columns` two adjacent open regions `.v1-payment-summary.v1-panel` (typographic receipt, transparent backing) and `.v1-payment-qr-panel.v1-panel` (instructions below fixed `.v1-payment-qr-slot`). The only bright square is QR itself. `.v1-payment-staff` and `.v1-overlay > .v1-modal.v1-staff-pin` remain outside columns. | 45/55 receipt/QR; QR 300–380px square at 1280, up to 480px at 1920 only if height permits; white quiet zone ≥16px; total ≥40px; qr panel reserves its final width/height *before* load. | `payment.createLink`/poll/timeout as in component. Warning keeps existing explicit retry/back actions; do not auto-replay on uncertain outcome. 1000ms title hold with 12px cancel, four-digit modal, staff button only after existing guard. **Do not display or document literal client PIN in kiosk copy**; backend ACL and current client PIN risk must be escalated to architect. |
| `PrepareScreen.tsx` | Retain current transition/state handling; use a full-canvas photographic preparation composition: oversized title left, dark lens aperture/neutral illustrative ring right; metadata row for *configured* layout name, `shotCount`, `countdownSeconds`. No white card-in-card and no fabricated live feed. | Title 42–64px; preparation cue 180–280px, constrained by available height. | Automatic transition only on existing readiness; spinner and plain-language camera unavailable state; no new skip/start. |
| `CaptureScreen.tsx` | `.v1-capture-screen.v1-capture > .v1-camera-viewport > .v1-live[style*="--image-ratio"] > img.v1-live-mirrored + .v1-crop`; then `.v1-countdown-layer[role=timer] > strong.v1-countdown`, `.v1-capture-top`, `.v1-shutter-control > button.v1-shutter > .v1-shutter-ring > .v1-shutter-core`, existing `.v1-flash.v1-shutter-flash`. Preserve this hierarchy and camera parent shell class. | Dark stage edge-to-edge; viewport inset ≤24px, source image `object-fit:contain`, max available width/height without distortion; 108×108px shutter, 84×84px core EXACT; countdown clamp(120px,18vh,220px) and center dx/dy≤2px. | Only initial LIVE_VIEW shutter enabled, then automated sequence, no back/retake. Missing stream = actual status, never a stock image. Mirror ONLY live `<img>`; crop mask must align with measured intrinsic ratio. Keep timer legible even where a face is centered: translucent outline/stroke and shadow, not an opaque panel. |
| `SelectPhotosScreen.tsx` | `<Heading/>` + `.v1-selection` split: `.v1-selection-photos > .v1-photo-grid > .v1-photo-tile > button[aria-label="Chọn ảnh X"] > img + .v1-photo-order`, and `.v1-selection-print > PrintPreview`; place lightbox sibling outside split; `<ActionBar>` anchored. No miniature 100px thumbs / no nested opaque panels. | 56/44 split; 2-column landscape / 3-column portrait, each image occupies tile width with original aspect and min tile hit 120×120px; composite height up to 510px. | 500ms hold, release close and 200ms suppression; FIFO order, full-quota `.v1-photo-dimmed` remains tappable for accessibility/behavior parity; confirm only exact selectCount; existing timeout and permitted back/cancel only. |
| `FrameScreen.tsx` | `.v1-split.v1-frame-workspace`: **large `.v1-frame-preview-panel > PrintPreview`** on left, `.v1-frame-grid` on right containing 2-column unboxed paper thumbnail **buttons** with `.v1-frame-check` and sanitized names; `<ActionBar>` below. `.v1-frame-preview-panel` hook remains though background/border are removed. | 58/42 split; composed paper up to 520px tall, frame thumbnail art 150–210px tall if original ratio permits; grid internally scrolls, 56px min targets. | New tap `frame.select`, tap already selected `frame.confirm`, CTA same confirm; failed/empty frame state does not show fake composition. Preserve actual selected/preview reconciliation. |
| `ConfirmScreen.tsx` | `.v1-confirm-screen > Heading + .v1-split.v1-confirm-workspace`: authoritative `PrintPreview` in 62–65% image gallery; `.v1-panel.v1-summary` class retained but rendered as transparent editorial receipt with line separators; `.v1-summary-total` visually dominant. `<ActionBar>` with mode-specific button and one-shot lock. | Print composition fills safe body height up to ~530px at 1280, not cropped; total ≥36px, CTA ≥72px. | No valid authoritative print source = disable confirm; maintain existing `print.confirmReal` versus `print.confirmDryRun` and explicit simulation disclosure. Confirm-screen fallback to `preview` in current component needs architect review before claiming it is authoritative. |
| `PrintingScreen.tsx` | Preserve `.v1-print-stage.v1-pipeline`; replace nested white panel with quiet editorial vertical status timeline and one large contained print thumbnail if actual source available. | Timeline labels ≥20px, preview ≤45% width but at least 280px when available. | No false step completion; backend status/failure only; no print retry/back/finish invented. |
| `DeliveryScreen.tsx` | `.v1-delivery-screen` two-column: large opaque `.v1-delivery-qr` on left, session handoff language + verified `.v1-print-signal-badge` and finish action on right. Avoid glowing glass on QR; never obscure quiet zone. | QR visual square ≥320px at 1280 where viewport permits, up to 500px at 1920; CTA ≥72px. | Missing link = honest plain-language absence, never fake QR; print signal badge ONLY with acknowledged transmission; finish calls `session.finish`. |
| `Operator.tsx` | `[data-testid="operator-workspace"]` is a distinct **staff application shell**, not a guest checkout card: header with title and unknown/verified status pills, six-tab `<nav>` with existing `[data-testid^="operator-tab-"]`, single flex `.op-scroll` content region. Preserve `[data-testid="operator-close"]`, unsaved-exit check and tab visibility semantics. | Header ≤140px, tabs ≥56px tall, scroll region fills remaining height; tables scroll inside content, no guest page scroll. | Permission-denied/errors are explicit and do not claim hardware connectivity from `accessMode`; preserve existing backend restrictions, six tabs and guarded close. |
| `V1Settings.tsx` | `[data-testid="v1-settings"]` has status strip, open section headings/hairline dividers, individual `.v1-setting-row` and `.v1-timeout`; use frosted background for *one* staff settings surface only, not each row. Retain exact switch, source, path, ±10s, save/reload `data-testid`s. | Two-column settings sections at wide CSS viewport; at compact width single-column internal scroll. All controls ≥48px; toggles ≥56px; save ≥64px. | Six persisted properties only, 0..3600 step 10; no real-time apply promises (`NEXT_SESSION`, `PENDING_DISABLED`). Readonly/disabled/no permissions visibly distinguished; unsaved-exit and save/reload error flows unchanged. |

### 7.2 Concrete CSS layout contract (proposed selectors; check actual app import owner first)

```css
/* Token sheet imports ONCE before component sheets. Do not append after existing !important layers. */
.v1-shell { box-sizing:border-box; min-height:100dvh; height:100dvh; overflow:hidden;
  background:var(--at-canvas); color:var(--at-ink); padding:clamp(20px,3vw,56px); }
.v1-shell:not(.v1-camera) { display:flex; flex-direction:column; gap:clamp(12px,1.6vh,24px); }
.v1-shell :is(.v1-panel,.v1-start-card,.v1-summary,.v1-frame-preview-panel,
  .v1-quantity-pricing,.v1-payment-summary,.v1-payment-qr-panel) {
  background:transparent; border:0; box-shadow:none; /* retain invariant DOM classes */ }
.at-workspace,.v1-split,.v1-payment-columns,.v1-selection,.v1-confirm-workspace {
  min-width:0; min-height:0; flex:1; display:grid; gap:clamp(20px,2.4vw,44px);
  grid-template-columns:minmax(0,1.2fr) minmax(0,1fr); }
.at-workspace > *, .v1-split > *, .v1-payment-columns > * { min-width:0; min-height:0; }
.at-workspace__art, .v1-quantity-preview, .v1-frame-preview-panel,
.v1-selection-print { display:grid; place-items:center; overflow:hidden; }
.at-workspace__art img, .v1-quantity-preview img, .v1-frame-preview-panel img,
.v1-selection-print img, .v1-confirm-workspace img { max-width:100%; max-height:100%; object-fit:contain; }
.v1-actionbar { flex:none; min-height:88px; display:flex; align-items:center;
  justify-content:space-between; gap:20px; }
.v1-primary { min-height:72px; min-width:220px; background:var(--at-primary);
  color:#fff; border-radius:999px; touch-action:manipulation; }
.v1-primary:disabled { background:#7B706A; color:#fff; cursor:default; }
.v1-shell :focus-visible { outline:3px solid var(--at-primary); outline-offset:3px; }
.v1-payment-qr-slot { width:min(100%, min(39vw, 44vh)); aspect-ratio:1;
  box-sizing:border-box; display:grid; place-items:center; padding:16px;
  background:#fff; border:1px solid var(--at-hairline); }
.v1-payment-qr-slot img, .v1-delivery-qr { display:block; max-width:100%; max-height:100%;
  object-fit:contain; image-rendering:auto; background:#fff; }
.v1-shell.v1-camera { padding:0; background:var(--at-darkroom); color:#fff; }
.v1-camera-viewport { position:absolute; inset:0; display:grid; place-items:center; overflow:hidden; }
.v1-live { position:relative; max-width:100%; max-height:100%; aspect-ratio:var(--image-ratio); }
.v1-live-mirrored { display:block; max-width:100%; max-height:100%; object-fit:contain; transform:scaleX(-1); }
.v1-countdown-layer { position:absolute; inset:0; display:grid; place-items:center;
  pointer-events:none; background:transparent; }
.v1-countdown { font-variant-numeric:tabular-nums; line-height:1;
  font-size:clamp(120px,18vh,220px); color:#fff; text-shadow:0 3px 20px #121214; }
@media (max-width:1100px), (max-height:760px) {
 .v1-shell { padding:20px 24px; }
 .v1-shell.v1-camera { padding:0; }
 .v1-payment-qr-slot { width:min(33vw,40vh); }
}
@media (max-width:900px) {
 .at-workspace,.v1-split,.v1-payment-columns,.v1-selection,.v1-confirm-workspace {
   grid-template-columns:minmax(0,1fr); overflow-y:auto; }
}
@media (prefers-reduced-motion:reduce) {
 .v1-shell * { scroll-behavior:auto !important; animation-duration:0.01ms !important;
   transition-duration:0.01ms !important; }
}
```

**Adapt, don't paste blindly:** Existing components own `.v1-camera-viewport` image sizing and `--crop-width`/`--crop-height`; the above example must be merged with current measured crop geometry rather than overwriting its mask or changing the camera aspect ratio. Existing `.v1-actionbar` versus `ActionBar` DOM must be inspected before styling. A 125% or 150% OS scale can shrink the *CSS viewport* to 1024×640 / ~853×533 when physical display is 1280×800; the stacked rule at <900 must keep all actions reachable via internal scroll rather than hide the action bar. For payment, reserve QR geometry in **both** link-loading and loaded states: `min(39vw,44vh)` must not change after image insertion; verify exact bounding boxes. Avoid `!important` except for reduced-motion accessibility override; leave no competing legacy `!important` style behind.

### 7.3 Presentation polish, interaction and assets

- Welcome and capture alternatives considered in §1: **A editorial gallery + full-darkroom** selected. B's contained camera panel reduces available face area and leaves a dashboard-like rectangle; reject at 1280×800. Public glass is a sparing rim (`rgba(255,255,255,.72)`, 14px blur) for chevrons/action dock ONLY; high-opacity solid fallback on devices with disabled backdrop filtering. Champagne accent is a thin border, not gold body copy. Soft peach glow stays behind floating prints and never behind QR or viewfinder.
- Image components: `FloatingPrint` uses `figure` without external white card, authentic artwork aspect (`layout.printAspectRatio`) and paper shadow on figure; `PrintPreview` stays contained (`object-fit:contain`) with no CSS filter/color transform; collection covers may use `cover` but PRINT and frame overlay must not. Never claim a runtime sample illustration is a captured user image.
- Use only Segoe UI/Noto Sans/Arial fallback and Georgia for a short editorial heading where Vietnamese glyphs remain consistent. No remotely loaded font. Body ≥18px in guest flow; instructional labels ≥16px; content uses Vietnamese wrap with `overflow-wrap:anywhere` only for long paths/IDs in operator view; never print raw layout IDs in guest captions.
- All primary actions carry one-shot synchronous ref lock from existing component AND `disabled/aria-busy` while awaiting the server; do not reset the lock solely due to an animation. Avoid touch hover-only feedback; press scale only on art/CTA, never on measured shutter/timer/QR. Native haptics optional and not a state transition. Preserve cancel confirmation and permissible back navigation. A recovered/uncertain command gets status reconciliation, not a newly invented retry of payment or real print.
- Operator status chips cannot be synthesized from a configured printer/camera toggle; say `Chưa xác minh` until a trusted IPC connectivity event exists. Revenue, Frames, Layouts, Tools and Colors use existing tab components; the redesign changes spacing/typography/panels only, not permissions or data mutations.

### 7.4 Acceptance checklist for frontend-coder and architect

1. Record before/after DOM screenshots **per screen** at CSS viewports 1280×800 and 1920×1200; additionally simulate Windows 100/125/150% scaling with measured `innerWidth/innerHeight` and test long Vietnamese names and accessibility zoom. If document overflow occurs, constrain *local* grids instead of shrinking touch targets. Measure welcome art, carousel artwork, quantity/selection/frame/confirm print, capture feed, countdown, shutter, payment QR, delivery QR and all CTAs; reject any nested opaque white-on-white parent/card pairing.
2. Preserve all invariant selectors/data IDs/ARIA in §2.3 and the current acceptance suite: shutter 108/84px & ≤1px horizontal center, countdown ≤2px XY center, chevrons ≥56px and ≤3px axis difference, payment slot box delta <0.01px, hold times 500ms/1000ms and cancellation threshold 12px, 160ms scroll settle, selected feedback <100ms, customer targets ≥56px and operator ≥48px. Test real countdown values, dynamic layout `shotCount`/`selectCount`, and a centered face during countdown. **Do not claim these pass until measured.**
3. Test catalog unavailable, bad image, camera stream lost, QR loading/error/expired status, duplicate commands, full photo quota, long press release, selected-frame second tap, missing authoritative composition, printer status unknown, delivery QR unavailable, operator ACL denied, settings validation/save error, unsaved exit, kiosk inactivity and backend recovery. No live payment, printer command, camera operation or production image copying in visual tests.
4. Architect must decide: safety of currently client-side staff cash PIN/`payment.mockComplete`; authority of quantity fallback values and confirm preview fallback; backend print/upload/signal event taxonomy; compatibility of timeout-driven printing with explicit confirm gate; and whether operator close saves unsaved settings automatically. Frontend may not solve any of these by cosmetically bypassing a gate. Report blockers explicitly before claiming release readiness.
