# EXPANSIVE ATELIER — V2 customer kiosk redesign blueprint

**Status:** implementation specification, not an implemented or visually tested UI. **Scope:** V2 customer screens only; V1 remains read-only. Proposed owners: frontend-coder (customer components/CSS), architect (asset and backend-event confirmation), tester (hardware/browser screenshots). No changes to payment, capture, print, cancellation, or session gates.

## 1. Source audit and non-negotiable behavior

Reviewed V2 `frontend/src/screens/{StartScreen,LayoutArtwork,StudioModeScreen,QuantityScreen,PaymentScreen,CaptureScreen,SelectPhotosScreen,FrameScreen,ConfirmScreen,DeliveryScreen}.tsx`, `frontend/src/screens/KioskUI.tsx`, `frontend/src/{styles.css,atelier.css}`, `frontend/src/atelier/{atelier-core,atelier-customer,atelier-immersive}.css`, `frontend/src/screens/payment.css`. This specification proposes changes to these V2 files only. `styles.css` imports `atelier/atelier-immersive.css`; **also audit the loaded stylesheet cascade**, because the legacy `atelier.css` still declares `.ambient-liquid-glass{display:none}`. No amount of orb opacity compensates for `display:none` or an opaque foreground shell.

Current composition is relatively small two-column artwork on Welcome; `LayoutArtwork.tsx:29–35` renders a face made of ellipses/paths. Never ship this drawing as a portrait. `StartScreen` already provides a five-tap `.v1-brand` admin trigger and starts through `onStart(layoutId)`; event bundle buttons also start through this path. `StudioModeScreen` centers a scroll-snap layout carousel; tapping a noncentral card selects it, tapping the central card calls `session.confirmSetup`. Quantity options and totals originate in the existing contract; Payment QR/staff PIN, capture sequence, review, frame confirmation, printing and delivery retain their existing backend actions. A CSS-only design must not create a new stage or prematurely advance.

**Protected invariants:** `.v1-brand` five taps; payment heading 1000 ms hold to staff PIN (preserve existing pointer down/move/up/cancel/leave handlers and current PIN verification, do not print the PIN in guest copy); `.v1-payment-qr-slot` exactly 320×320 CSS px, including spinner/error; `.v1-shutter` 108×108 with `.v1-shutter-core` 84×84, centered; `.v1-countdown-layer` center deviation ≤2 CSS px; `.v1-back.backButton` and `.v1-carousel-arrow` exactly 56×56, centered icon and same horizontal axis; photo toggle immediate (<100 ms target) with 500 ms hold-to-zoom; no emoji. Touch hit boxes ≥48 px. Do not change how a backend-confirmed price, `layout.shotCount`, `layout.selectCount`, `layout.countdownSeconds`, print ratio, camera aspect, runtime mode or payment state is obtained. Never manufacture a payment success/print success from appearance.

## 2. Two visual directions, selected

| Direction | Welcome | Capture | Readability decision |
|---|---|---|---|
| **A. Editorial gallery / selected** | Oversized left typographic anchor; overlapping photographic paper objects dominate right 58–64% of width; guest CTA anchored bottom left; warm animated pearl backdrop | Dark, isolated full-bleed live image with fixed centered number and peripheral top progress/bottom shutter; no moving orbs in camera field | Clear face and countdown at booth distance; generous photo scale; background still lively on noncamera screens. |
| B. Liquid poster | Full-screen photographic collage behind translucent headline and floating CTA | Champagne colored glass slabs over mirrored live feed and bright decorative light blooms | More theatrical, but illegible across booth, harms live-view contrast and could obscure faces; rejected for capture. |

**Visual grammar:** matte ink `#191715`, warm ivory `#F8F4EE`, warm paper `#FFFDFA`, champagne `#C7A781`, restrained rose `#E7C6C3`, focus `#533924`. Distinct from the current rust-gradient button aesthetic: primary buttons solid ink with ivory label; glass is for secondary surfaces only. Use installed system fonts: Georgia for editorial Latin / `Segoe UI`, `Arial`, sans-serif for Vietnamese, never rely on unshared font files. Editorial tiny uppercase is decoration only; instructions remain ≥16 px. No static illustration can be described as a working preview, and no stock photography may be presented as customer output.

## 3. Asset contract: authentic photographic samples, never cartoon faces

**Preferred:** obtain 2–4 consented, licensed, *noncustomer* editorial studio portraits (real monochrome/sepia photography, portrait and 3:2 crops), stored **only within V2** e.g. `frontend/public/demo/atelier-portrait-01.webp` with documented redistribution/consent. Asset manifest records source, license, usage and approved public display. No production customer portraits, no remote CDN dependency, no runtime AI face generation. If assets unavailable, show **high-quality typographic print placeholders with empty exposure windows**, never SVG-generated human faces. Do not claim the placeholder is a captured photo.

`LayoutArtwork.tsx` should accept optional `samplePhotos?: readonly string[]` **only in decorative/sample context** and retain `selectedPhotos` and `frameOverlayUrl` precedence. Existing `layout.absoluteSlots`, grid columns, padding/gaps, ratios and backend composition remain authoritative. Within each slot: `selectedPhotos !== undefined` renders actual selection or empty labeled slot exactly as today; otherwise, if approved decorative asset exists, render an `<image>` using slot bounds and `preserveAspectRatio="xMidYMid slice"` with distinct cycling crops (do not stretch); otherwise render a neutral exposure `<rect>` with typography. Remove the SVG head/eyes/body subtree at lines 29–35. Retain `role="img"`, localized aria label and `<svg viewBox>` dimensions. Distinguish `decorative` samples via a visible `MẪU MINH HỌA` label outside print where appropriate. `frameOverlayUrl` must not be applied as a deceptive composed result. Prefer approved bundled image samples as optimized WebP, stable asset paths, `decode=async` when `<img>`, no huge base64 in hot capture path. Print title area: small `LE SOUVENIR ATELIER`, `SEOUL × SAIGON`, and `2026 ATELIER` **only if brand approves the date**; otherwise derive current campaign/year from content config, never hardcode a stale season. Warm duotone CSS `filter:grayscale(1) sepia(.16) contrast(1.07)` only for *decorative sample images*, not customer photos, real preview, QR, or frame overlays. Paper border 12–18 px at desktop, 8–12 at compact; 1 px hairline and very subtle noise texture as a bundled, licensed asset or generated CSS pattern (no per-frame JS canvas). Film registration marks only outside faces.

`StartScreen.tsx`: keep `start`, `pressed`, `onStart`, unavailable state, `selected` and event-bundle handlers unchanged. Introduce `atelier-welcome__copy` and `atelier-welcome__gallery` layout classes (already present), increase gallery footprint; use the real photo sample inputs on *decorative* `LayoutArtwork`, and keep brand button `.v1-brand` as an actual button with the same handler. Put an explicit illustrative caption near paper objects. If neither representative layout exists, construct gallery from whichever configured layout exists; if no layouts, render typography and unavailable message rather than a blank art field. Make sample print positions follow geometry, not `printAspectRatio` assumptions about orientation; preserve ratio. Use print objects `pointer-events:none` so they never cover the CTA/admin target. Event bundles remain actual buttons with existing actions and should scroll within their own bounded rail.

## 4. Exact proposed CSS overrides (replace rules, not unscoped appended `!important`)

Implement in `frontend/src/atelier/atelier-immersive.css` **after verifying import order**; remove/retire the `display:none` declaration in `frontend/src/atelier.css` if loaded. The following is implementation-ready intent; scope to `.v1-shell.atelier-customer` so admin/operator screens are untouched:

```css
:root { --ex-ink:#191715; --ex-paper:#FFFDFA; --ex-ivory:#F8F4EE;
  --ex-champagne:#C7A781; --ex-rose:#E7C6C3; --ex-gutter:clamp(16px,2.2vw,42px); }
/* Ambient is a document sibling behind the shell; never behind an opaque shell. */
body:has(.atelier-customer) { background:var(--ex-ivory); }
.ambient-liquid-glass { display:block; visibility:visible; opacity:1; position:fixed;
  inset:0; z-index:0; overflow:hidden; pointer-events:none; contain:paint; }
.ambient-orb { position:absolute; width:clamp(320px,43vw,780px); aspect-ratio:1;
  border-radius:46% 54% 63% 37%; will-change:transform; pointer-events:none;
  filter:blur(18px); opacity:.85; transform:translate3d(0,0,0); }
.ambient-orb--1 { left:-12%;top:-26%;background:radial-gradient(circle at 45% 38%,#fffdfa 0%,#f2ddd5 38%,#edd9d300 73%);animation:float-liquid-1 26s ease-in-out infinite alternate; }
.ambient-orb--2 { right:-11%;top:12%;background:radial-gradient(circle at 50% 40%,#fff8e9 0%,#d8b997a8 42%,#e9c4b900 75%);animation:float-liquid-2 32s ease-in-out infinite alternate; }
.ambient-orb--3 { left:20%;bottom:-48%;background:radial-gradient(circle at 46% 36%,#fffdf9 0%,#efd5d4c9 42%,#ead7c900 75%);animation:float-liquid-3 29s ease-in-out infinite alternate; }
.v1-shell.atelier-customer:not(.v1-camera):not(:has(.v1-prepare-screen)) { background:transparent; }
.v1-shell.atelier-customer { position:relative;z-index:1;width:100%;height:100dvh;
  padding:clamp(12px,1.5vh,24px) var(--ex-gutter);gap:clamp(8px,1.2vh,16px); }
/* Darkroom must remain opaque: brightness, contrast, camera clarity and privacy win. */
.v1-shell.atelier-customer.v1-camera,
.v1-shell.atelier-customer:has(.v1-prepare-screen) { background:#0a090c; }
.v1-shell.atelier-customer :is(.v1-panel,.v1-secondary,.v1-actionbar) {
  background:rgba(255,253,250,.58);border:1px solid rgba(255,255,255,.78);
  -webkit-backdrop-filter:blur(16px) saturate(115%);backdrop-filter:blur(16px) saturate(115%); }
.v1-shell.atelier-customer .v1-primary:not(:disabled) {background:var(--ex-ink);
  color:var(--ex-paper);border:1px solid var(--ex-ink);box-shadow:0 12px 25px #19171524;}
.v1-shell.atelier-customer :is(.v1-primary,.v1-secondary):disabled { opacity:.5;box-shadow:none; }
.v1-shell.atelier-customer :is(.v1-back.backButton,.v1-carousel-arrow) {
  box-sizing:border-box;width:56px;height:56px;min-width:56px;min-height:56px;padding:0;
  display:grid;place-items:center;border-radius:50%; }
.v1-shell.atelier-customer :is(.v1-back.backButton,.v1-carousel-arrow) svg {display:block;flex:none;}
.v1-shell.atelier-customer .v1-carousel-arrow {top:50%;transform:translateY(-50%);}
.v1-shell.atelier-customer .v1-carousel-arrow:active:not(:disabled) {transform:translateY(-50%) scale(.96);}
.v1-shell.atelier-customer .v1-start {grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr);
  gap:clamp(12px,2vw,36px);height:100%;min-height:0;overflow:hidden;}
.v1-shell.atelier-customer .v1-start section {padding:clamp(4px,.8vw,16px);align-items:flex-start;
  justify-content:space-between;min-width:0;overflow:visible;}
.v1-shell.atelier-customer .v1-start h1 {font-size:clamp(52px,5.4vw,108px);
  line-height:1.16;letter-spacing:-.035em;}
.v1-shell.atelier-customer .v1-start-art {min-height:0;height:100%;overflow:hidden;}
.v1-shell.atelier-customer .atelier-welcome__gallery {min-height:0;flex:1;position:relative;}
.v1-shell.atelier-customer .atelier-print {box-sizing:border-box;background:var(--ex-paper);
  padding:clamp(8px,.85vw,16px);border:1px solid #e6ded4;border-radius:2px;
  box-shadow:0 26px 58px #35282032;overflow:hidden;pointer-events:none;}
.v1-shell.atelier-customer .atelier-print--portrait {width:min(54%,400px);left:5%;top:7%;}
.v1-shell.atelier-customer .atelier-print--strip {width:min(33%,225px);left:59%;top:5%;}
.v1-shell.atelier-customer .v1-start .v1-primary {min-height:80px;min-width:min(100%,480px);}
/* Full-bleed workspaces, not giant rounded nested cards. Keep action bar separate. */
.v1-shell.atelier-customer :is(.v1-split,.v1-selection,.v1-frame-workspace,
  .v1-confirm-workspace,.v1-quantity-workspace,.v1-layout-stage) {
  width:100%;max-width:none;flex:1;min-height:0;gap:clamp(12px,1.7vw,30px);}
.v1-shell.atelier-customer :is(.v1-quantity-preview,.v1-selection-print,
  .v1-frame-preview-panel,.v1-confirm-workspace>.v1-preview) {min-height:0;padding:0;
  background:transparent;border:0;box-shadow:none;}
.v1-shell.atelier-customer .v1-actionbar {width:100%;min-height:88px;
  padding:10px clamp(14px,2vw,32px);border-radius:14px;flex:none;}
.v1-shell.atelier-customer .v1-payment-qr-slot {box-sizing:border-box;
  width:320px;height:320px;min-width:320px;min-height:320px;flex:0 0 320px;}
.v1-shell.atelier-customer .v1-payment-qr-slot img {width:100%;height:100%;object-fit:contain;}
@media (prefers-reduced-motion:reduce) {
  .ambient-orb,.v1-shell.atelier-customer .atelier-print {animation:none;will-change:auto;}
  .v1-shell.atelier-customer .v1-layout-carousel {scroll-behavior:auto;}
}
@media (forced-colors:active) { .v1-shell.atelier-customer :is(.v1-primary,.v1-secondary,.v1-back) {border:2px solid ButtonText;} }
```

**Important CSS conflicts:** replace the existing `.ambient-liquid-glass{visibility:hidden}` and selective `body:has(...) ... visibility:visible` in `atelier-immersive.css`; remove `atelier.css`'s `display:none` if that stylesheet is loaded. Keep `.v1-shell.atelier-customer.v1-camera` opaque on purpose, but do not hide the ambient DOM or pause all non-camera effects unless profiling requires it. Do not use `contain:strict` on a zero-size ambient fixed node; `contain:paint` with `inset:0` is explicit. Do not place `backdrop-filter` on the live feed or QR; glass exists only around customer text. Avoid blur >18px on large full-screen elements and never animate filter/box-shadow every frame; animate the three orb transforms only.

## 5. Screen-by-screen layout and states

All measurements are **CSS px** at 100% browser zoom; use viewport-relative space within width/height, not a desktop-style 1200px max-width. Header band 72–92 high; action dock 88–112 high; usable center = remaining screen. At 1920×1200 gutters 40–42, at 1280×800 gutters 24–28. At 125/150% Windows scaling calculate actual CSS viewport from `window.innerWidth/innerHeight`; do not assume physical pixels equal CSS px. At 1280×800 with scaling that reduces CSS width below 900, use a short-height landscape **compact two-column** variant before switching to vertical scroll; reserve QR fixed 320×320 and preserve CTAs. Never hide backend warning text behind a scroll-clipped card.

| Screen / source | Composition and touch | Busy / empty / failure; invariant |
|---|---|---|
| Welcome / `StartScreen` | Headline occupies left ~42%, samples right ~58%; typography rises from upper left, CTA in lower left; two layered floating photos occupy ~80% of gallery height; bundle rail at bottom within right half. Five-tap brand still reachable with 56+ high target; main CTA uses existing `start(layoutId)`. | Unavailable catalog: show actionable staff-help message, CTA disabled, no fictional example photos masquerading as a valid layout. `busy` locks start + bundles, no duplicated start. |
| Layout / `StudioModeScreen` | Carousel uses entire central band; selected print art up to 78% of available band height and 1.1× neighbors, title below; chevrons 56×56 aligned on same y, at least 16 px from print bounds. Keep scroll snap and arrows; explicitly show “Chạm lần nữa để chọn” near centered card (currently sr-only), do not turn a noncentral tap directly into confirmation. | `layouts.length===0`: existing staff-help status. Busy disables carousel and arrows; selected state `aria-pressed`. Count/subtitle derive from layout data, not invented values. |
| Quantity / `QuantityScreen` | 44% picker/price left and 56% large aspect-correct print right, with one light hairline price region instead of nested card stacks. Stepper ≥76×76; price visibly pending until backend verified. Dock CTA remains `session.setQuantity`. | Only backend `allowed` options when present; offline simulator fallback stays simulator-only; disabled stepper end states and busy CTA; never show an unconfirmed price as definitive. |
| Payment / `PaymentScreen` | Left full-height typographic total (~45% width); right QR/instructions (~55%) with fixed 320×320 QR slot on a solid white square; avoid glass over QR. Sticky payment status immediately adjacent; instructions wrap without shrinking QR. Heading title remains pointer-hold staff entry and back action stays guarded. | Spinner/error/QR all occupy same box, no layout shift. Preserve 15s link creation timeout, 3s backend polling, existing retry/back, cash PIN modal and staff-only action. Never add guest “paid” button. |
| Camera prep / existing `v1-prepare-screen` | Darkroom overtakes viewport, single central stage and visible progress/prep guidance; ambient behind but blocked by opaque background. | No decorative transition delaying hardware readiness; show backend device error/retry via existing actions only. |
| Live View / `CaptureScreen` | Opaque matte darkroom, centered aspect-correct live rectangle as large as viewport allows (`width:min(100vw,100dvh * var(--image-ratio))`), `object-fit:contain`, existing mirror policy. Progress top center using backend `count+1`/`shotCount`, countdown exact viewport center ≤2 px, large numerals; shutter lower center. Distinct top/bottom safe bands or small high-contrast chips must avoid covering faces. | Preserve `capture.startSequence` only in `LIVE_VIEW && count===0`, disable while busy; no new retake. `COUNTDOWN` derived from backend state; never animate/interrupt feed, do not cover faces with full-opacity countdown panel—use luminous numerals with narrow outline/shadow and translucent backdrop only if essential. In `CAPTURING`, flash remains brief and pointer-free. Missing preview: explicit waiting/error state rather than sample image. |
| Review / `SelectPhotosScreen` | Photos ~65% width, composite preview ~35% width; viewport photo grid scrolls independently, no page scroll under action dock; image `object-fit:contain`, tiles reflect actual `photoAspectRatio`. Selection count/status close to dock. | Optimistic `selection.toggle` immediate (<100ms), existing ordered reconciliation preserved. Full selection disables additional photos without hiding deselect; hold 500ms shows lightbox and suppresses click; next only at `selectCount`. Empty shots: staff-help/recovery, no fake photographs. |
| Frames / `FrameScreen` | Composition preview 60–65% and scrollable frame rail 35–40%; active frame border/label; images contain with true print ratio; a hairline rather than enclosing glass around every frame. | Preserve `frame.select` optimistic update and `frame.confirm` only through existing chosen-frame action; no thumbnail = nonportrait frame outline/label; no frames = existing fallback/status, do not invent frame. |
| Confirm / `ConfirmScreen` | Composed print 68–72% and order summary 28–32% with single solid paper surface; sticky final dock. | CTA disabled without composed image/busy; preserves `print.confirmReal` vs `print.confirmDryRun`; uncertain transport must never automatically resend. Show simulated/real distinction verbatim. |
| Printing/status / existing `v1-print-stage` | Hero progress on ivory with existing acceptance/status information, understated pulse on static decoration only. | Do not turn “accepted by queue” into “printed successfully”; reflect backend status/error, staff assistance, disabled attempts during uncertain state. |
| Delivery / `DeliveryScreen` | Full-width airy two-zone composition (message/print status left, QR right), no giant bounding `.v1-delivery.v1-panel` card; QR itself on solid white; finish CTA sticky. | Show backend `printAccepted` and `printStatus` truthfully; demo has no real album QR. No QR = visible placeholder and staff help, no false QR. `session.finish` one-shot guard remains. |

### Capture geometry, exact rule proposal

```css
.v1-shell.atelier-customer.v1-camera .v1-capture-screen {inset:0;background:#0a090c;overflow:hidden;}
.v1-shell.atelier-customer.v1-camera .v1-camera-viewport {position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;}
.v1-shell.atelier-customer.v1-camera .v1-live {width:min(100vw,calc(100dvh * var(--image-ratio)));max-height:100dvh;aspect-ratio:var(--image-ratio);}
.v1-shell.atelier-customer.v1-camera .v1-countdown-layer {position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;padding:0;transform:none;}
.v1-shell.atelier-customer.v1-camera .v1-countdown {position:static;transform:none;margin:0;
  display:grid;place-items:center;min-width:1.3em;min-height:1.3em;padding:0;
  background:transparent;border:0;box-shadow:none;color:#fff;
  font:800 clamp(104px,12vw,186px)/1 'Segoe UI',sans-serif;
  font-variant-numeric:tabular-nums;text-shadow:0 3px 20px #000d,0 0 2px #000;}
.v1-shell.atelier-customer.v1-camera .v1-shutter-control {left:50%;transform:translateX(-50%);}
.v1-shell.atelier-customer.v1-camera .v1-shutter {box-sizing:border-box;width:108px;height:108px;min-width:108px;min-height:108px;padding:0;display:grid;place-items:center;border-radius:50%;}
.v1-shell.atelier-customer.v1-camera .v1-shutter-ring {display:grid;place-items:center;width:100%;height:100%;}
.v1-shell.atelier-customer.v1-camera .v1-shutter-core {box-sizing:border-box;width:84px;height:84px;min-width:84px;min-height:84px;border-radius:50%;}
```

**Center measurement:** countdown bounding-box center `(left+width/2,top+height/2)` must differ from viewport center by ≤2 CSS px regardless of glyph ink asymmetry; avoid centering with a padding-biased box. Existing count display `count+1` can show an out-of-range value during last-state transition; if backend emits `count===shotCount`, clamp *display* to `Math.min(count+1,shotCount)` and never alter shot sequencing.

## 6. Accessibility, motion, reliability and acceptance protocol

- Vietnamese: `line-height:1.2–1.45` for all headings/body, `padding-block:.08em` for decorative words, never `line-height:1` on Vietnamese text; `overflow-wrap:anywhere` for long catalog labels and currency; no `text-transform:uppercase` imposed on arbitrary Vietnamese. Test strings “Ảnh đã chọn”, “Kiểm tra lần cuối”, “Số lượng bản in”, long event title and long error. Screen-reader labels and `role=status` stay intact.
- Show affordance without hover: outlined controls, selection stroke/checkmark and pressed state. `:focus-visible` ≥3 px visible outline; high-contrast solids for QR/payment/error; no emoji glyphs. Landscape compact layout may scroll the *content region* only, while sticky action and QR stay reachable. No swipe-only navigation.
- Motion: 3 ambient GPU-transformed orbs at ≥24 s cycle, 2 paper transforms at 8–10 s, opacity/transform-only control feedback 120–180 ms. `prefers-reduced-motion:reduce` freezes orbs/prints, disables smooth snapping and flash optional visual only; backend capture still occurs. If integrated GPU drops camera frames, disable orbs during camera and reduce blur on other screens; do not stop live feed to preserve animation.
- Touch contract: no new synthetic clicks or pointer handlers in visual wrappers. Existing guards suppress double taps. Payment staff title must not accidentally reveal on normal short tap/drag; preserve 12 px movement cancellation and pointer-cancel handling. Admin five-tap is hidden and never advertised. Back/cancel uses existing `session.back` and backend rules, never new exit shortcuts.
- **Acceptance tests to run after implementation (not claimed completed here):** (1) screenshot/video at 1920×1200 and 1280×800, Windows scaling 100/125/150, with actual measured CSS viewport logged; (2) computed `display/visibility/opacity/z-index` of ambient + shell, confirm orb pixel motion over 2 s on Welcome and visible color through a translucent secondary panel; (3) approve sample-photo licensing and verify no face-ellipse SVG/customer image leakage; (4) overlay image proportions and orientation for strip/postcard and unusual backend ratios; (5) measure bounding boxes: QR 320×320 at pending/error/ready, back/chevrons 56×56 and same y, shutter 108×108/core 84×84, countdown center ≤2 px; (6) measure screenshot photo-preview height ≥80% of *available content band* where aspect ratio permits, not by stretching; (7) trace session actions from Welcome → Layout → Quantity → Payment → Prep → Capture → Select → Frame → Confirm → Status → Delivery → Finish with simulator/mock backend only; no real payment or print; (8) selection visual feedback <100ms with delayed backend acknowledgment, hold zoom at 500ms, single-shot shutter/print guards; (9) Vietnamese overflow, long labels, forced-colors and reduced-motion; (10) CPU/GPU load and camera frame delivery with animation on/off. Do screenshot review twice: first correct clipping/z-order, second independently assess composition at 2–3 m viewing distance. Record defects, rerun tests, and only then call it visually validated.

**Architect handoff:** confirm legal demo photo assets, exact loaded CSS import order, supported `layout` geometry/print composition preview, whether live mirror is intentionally guest-only, backend errors for payment/print/QR, and kiosk scale/window viewport policy. **Frontend handoff:** implement sample-asset component with strict decorative-vs-real branches, screen CSS scoped to customer only, preserve handlers and data-test selectors. **Tester handoff:** use the above geometry/video checklist and capture before/after screenshots; no hardware, payment or printing claims from mock screens.
