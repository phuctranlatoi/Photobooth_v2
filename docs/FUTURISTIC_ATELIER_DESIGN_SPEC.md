# LE SOUVENIR V2 — Futuristic Korean Photo Atelier

**Status:** actionable visual/interaction specification, **not a working UI or hardware certification**. Owner: frontend presentation; all camera, payment, selection, print, session and database behavior remains owned by the existing contracts. Workspace: V2 only. Functional evidence: `docs/V1_EXACT_UI_FLOW_MAP.md`, `docs/FRONTEND_RECONSTRUCTION_INVARIANTS.md`, `docs/ATELIER_RECONSTRUCTION_DESIGN_SPEC.md`, and the current `frontend/src/screens/*.tsx`, `frontend/src/Operator.tsx`, `frontend/src/V1Settings.tsx`. If those sources disagree, preserve actual mounted test hooks and action semantics; escalate business contradictions to the architect. No V1 files were changed for this design.

## 1. Art direction and selection

**Selected A: gallery-to-darkroom.** A Pearl Ivory editorial gallery, oversized actual print imagery, matte darkroom capture, restrained translucent glass **only on floating controls**, champagne fine rules and deep coral actions. Composition, not card decoration, creates hierarchy. The hero artwork or viewfinder should command approximately **70–85% of available visual attention** on Welcome, layout, capture, selection, frame and confirm; this is an art-direction goal, not a demand to hide necessary receipts, QR or accessible controls. Print silhouettes are unboxed, with genuine paper edges and layered paper shadows. Avoid repeated white rounded dashboard cards, ambient rainbow gradients, fake photographic assets and glass behind QR codes.

**Option B: centered exhibition.** Welcome uses one centered oversized print and a narrow bottom copy/action band; capture uses an inset camera rectangle with a vertical instruction rail. Attractive at 1920×1200 but the centered welcome band competes with the print and the capture side rail reduces face area at 1280×800. **Choose A** because reading order, physical reach, face-safe capture area and across-booth countdown legibility survive compact screens. Do not introduce extra setup, retake, print retry or payment-bypass stages to support either composition.

### Layout coordinates, CSS pixels (starting measurements, not rigid output sizes)

| Surface | 1280×800 CSS viewport | 1920×1200 CSS viewport |
|---|---|---|
| Customer safe canvas | gutters 32–48, heading 80–104, action rail 88–104; content min-height 0 | gutters 56–72, heading 108–132, action rail 104–124 |
| Welcome | copy x=48–548; image region x=566–1232; hero paper h=410–530; CTA h≥72 | copy x=72–810; image region x=840–1848; hero paper h=640–850; CTA h≥80 |
| Capture | near-edge darkroom, perimeter rail ≤24; feed fits remaining width/height; center numeral aligned to viewport within 2px; shutter centered x=640 | same rules, center x=960, hero feed uses remaining area |
| Selection/frame/confirm | artwork region 55–65% of body width, choice/receipt region remaining width; paper max-height = available body | similar ratios; enlarge paper before enlarging decoration |
| Payment/delivery | opaque QR well reserved at 300–380px if height allows; receipt/description adjacent | QR up to 480–500px if height allows; never crop to meet a nominal size |

At 125% and 150% Windows scaling, **use the actual `window.innerWidth/innerHeight` in CSS pixels**, not nominal physical monitor pixels. Break at width <1100px **or** height <760px into compact two-column spacing, and at width <900px into stacked non-camera content with internal scrolling. Never shrink primary hit areas to keep a two-column layout. Protect action rail with scroll padding. Test viewport examples 1280×800, 1920×1200 and the measured CSS viewports at both scaling factors; do not assume scaling always maps to a specific CSS viewport in a desktop webview.

## 2. P0 typography and text-formatting contract

Use the exact readable UI stack `system-ui, -apple-system, 'Segoe UI', Roboto, 'Be Vietnam Pro', 'Noto Sans', sans-serif`; editorial accent stack `Georgia, Cambria, serif` **only on short, tested headlines and print captions**, falling back to UI stack if Vietnamese diacritics render unevenly. No bundled font files are presumed; no remote font loading dependency. Use font synthesis cautiously: inspect Vietnamese glyph rendering on actual Windows machines.

```css
:root {
  --at-font-ui: system-ui, -apple-system, 'Segoe UI', Roboto, 'Be Vietnam Pro', 'Noto Sans', sans-serif;
  --at-font-editorial: Georgia, Cambria, serif;
}
.v1-shell, [data-testid="operator-workspace"] { font-family: var(--at-font-ui); font-kerning: normal; font-synthesis: none; }
.v1-shell :is(h1,h2,h3), [data-testid="operator-workspace"] :is(h1,h2,h3) {
  line-height: 1.25; letter-spacing: normal; overflow: visible;
}
.v1-shell :is(p,li,dd,dt,span), [data-testid="operator-workspace"] :is(p,li,dd,dt,span) {
  letter-spacing: normal; word-spacing: normal; text-align: start;
}
.v1-shell button, [data-testid="operator-workspace"] button {
  display: inline-flex; align-items: center; justify-content: center;
  line-height: 1.15; letter-spacing: normal; word-spacing: normal;
  text-align: center; white-space: normal;
}
.v1-shell :is(.v1-countdown,.v1-payment-price,.v1-quantity-total,.v1-timer),
[data-testid="operator-workspace"] .numeric { font-variant-numeric: tabular-nums; }
```

No justified UI text; no emoji or symbol-as-the-only-label controls. No body or Vietnamese button negative tracking. For **large single-line** headlines, `-0.01em` is the maximum negative letter spacing and only after diacritic inspection; never use decorative `.16em` / `.17em` tracking for Vietnamese labels or eyebrow text. Avoid `text-transform: uppercase` on long Vietnamese strings. Heading line height ≥1.25, subtitle/body 1.4–1.55; never clip descenders or accents using fixed text-height containers, `overflow:hidden`, or transform-based vertical correction. Heading clamp(32px, 3.2vw, 56px); hero clamp(42px, 4.8vw, 84px); body clamp(18px, 1.25vw, 24px); metadata ≥16px; countdown clamp(120px, 18vh, 220px) with backend-driven digits. Reserve `min-height` and center button *content* using flex, not `padding-top`, baseline shifts or arbitrary `translateY`. Check uppercase money labels and the longest localized strings at 150% scaling; wrap naturally to 2–3 lines. Technical paths may scroll inside their own field but require an accessible full value.

Typography QA: screenshot Vietnamese samples `Ảnh đã chọn`, `Số lượng bản in`, `Xác nhận & in`, `Đang chờ xác nhận`, long layout names, full VND totals; inspect top accents, baseline across adjacent buttons and equal line boxes. Test Segoe UI fallback without installing extra fonts; compare 100/125/150% OS scaling and 1280/1920. Never substitute bold synthetic transform or letter-spacing to fix a font issue.

## 3. Token sheet and production CSS rules

```css
:root {
  --at-pearl: #FAF7F2; --at-pearl-secondary: #F5F0E8;
  --at-darkroom: #0E0D10; --at-ink: #1A1715;
  --at-body: #514842; --at-muted: #625750;
  --at-coral: #8E442D; --at-coral-active: #A35238;
  --at-champagne: #D8C7B5;
  --at-hairline: rgba(216,199,181,0.5);
  --at-glass: rgba(255,255,255,0.78);
  --at-glass-filter: blur(20px);
  --at-rose: #F0DBD4; --at-success: #245C42;
  --at-paper-shadow: 0 4px 10px rgba(44,30,23,.10), 0 20px 36px rgba(44,30,23,.22), 0 32px 64px rgba(44,30,23,.10);
  --at-space-1: 8px; --at-space-2: 12px; --at-space-3: 16px;
  --at-space-4: 24px; --at-space-5: 32px; --at-space-6: 48px;
  --at-gutter: clamp(24px,3.75vw,72px);
  --at-touch-compact: 56px; --at-touch-regular: 72px; --at-touch-hero: 80px;
  --at-press-duration: 180ms; --at-art-duration: 280ms;
}
.at-glass-control { background: var(--at-glass); backdrop-filter: var(--at-glass-filter); }
@supports not (backdrop-filter: blur(20px)) {
  .at-glass-control { background: #FAF7F2; }
}
@media (prefers-reduced-motion: reduce) {
  .v1-shell *, [data-testid="operator-workspace"] * { scroll-behavior: auto; animation-duration: .01ms; transition-duration: .01ms; }
}
```

Use champagne for separators, not low-contrast body copy. Validate WCAG AA text contrast (≥4.5:1 for normal text, ≥3:1 for large text and controls); dark coral on ivory and white on dark coral must be measured in browser. Active `#A35238` is a surface accent, not automatically suitable for small text on ivory. Print shadow belongs on actual artwork, not on an enclosing white rectangle. Paper `object-fit: contain`, preserve `printAspectRatio`; never CSS-stretch/rotate real customer output. Opaque white QR with quiet zone ≥16px and no filter, blur, transparency or shadow across code pixels. Darkroom overlays use near-solid contrast backing **at the perimeter**, not over faces.

Buttons: primary min-height 72px (80px welcome/confirm when space permits), secondary/chevrons ≥56px (carousel preferred 64px), stepper 72px, operator controls ≥48px (56px preferred), shutter outer **108×108px** and inner **84×84px** exactly per mounted geometry tests. `box-sizing:border-box`; `:focus-visible` 3px solid coral with 3px offset; obvious selected and disabled appearances independent of hover. Disabled text remains readable, conveys why via adjacent `role=status`. Glass permitted for floating chevrons, small toolbars and **one** operator settings surface; no stacked glass cards. No full-screen rainbow gradient or blur on camera/live feed.

## 4. Flow and shared interaction state machine

`IDLE → SELECTING → SELECTING_QUANTITY → PAYMENT_PENDING → PREPARING → LIVE_VIEW → (COUNTDOWN → CAPTURING → LIVE_VIEW)* → SELECTING_PHOTOS → EDITING → PRINT_PENDING → PRINTING → DELIVERY → IDLE`. The repetitions, `shotCount`, `selectCount`, `countdownSeconds`, price and allowed quantities come from layout/catalog/backend, not illustrations or magic numbers. Bundle direct start can enter quantity per existing contract. ADMIN is a guarded staff workspace, not a customer checkout stage. Recovery/connection are surfaces reflecting existing state, not invented workflow states.

Customer back actions only where existing mounted flow exposes them (layout, quantity, payment, selection, frame, confirm); V1 selection Back can be inert, so verify mounted V2 behavior rather than implying a guaranteed retreat. Cancellation only where backend allows (photo selection and frame) through the existing confirmation; no back/cancel during capture/printing/delivery. Preserve any audited timeout auto-selection/auto-print behavior as a **backend risk for architect review**, never implement a new client-side auto-confirm. Payment receipt does not unlock capture; capture starts only when payment/camera state allows. Revenue only for accepted print result with explicit user-confirmed real path; demo is visibly simulated and creates no real print/revenue.

Shared async contract: synchronously lock a tap before awaiting IPC, set disabled/busy state immediately, unlock only on a known rejected result or reconciled backend state. Never replay uncertain payment/print commands on reconnect. Preserve session across recoverable network interruptions; expose `Đang kiểm tra trạng thái` and staff escalation instead of returning home. Touch `pointercancel`, leaving a hold target and moving beyond existing thresholds abort the hold. Scroll/swipe is optional navigation alongside visible buttons. `touch-action: manipulation` on buttons; `pan-x` only on carousel. Prevent long press context menus and selection on artwork/hold targets without blocking form text selection. Haptics via `navigator.vibrate` only opportunistic, never gating commands. Animations ≤320ms, no animation blocking capture stream, QR status or payment callbacks; reduced motion preserves numeric countdown and immediate feedback. After timeout follow actual session timeout contract and display status; do not invent a kiosk auto-reset during payment, capture or printing.

## 5. Screen-by-screen blueprint

**Every screen** must fit two reference viewports and real scaled CSS viewports, support long Vietnamese text, `role=status` loading and `role=alert` errors, preserve disabled/focus visuals, and avoid horizontal document overflow. Sizes below refer to CSS pixels. Image sources must be catalog/session backed; an explicitly labeled layout illustration is acceptable only when the actual source is unavailable on non-final previews. No synthetic customer photo or fake printed-success image.

### 01 Welcome — `StartScreen.tsx` (`IDLE`)

**Purpose/entrance:** first contact or finished session, once catalog status known. Spacious left brand, short editorial headline, benefits and 80px primary action; right overlapping real layout prints with authentic shadow, asymmetric ±small decorative angle only for sample art. Copy/art ~46/54 width at 1280; artwork dominates visually, no wrapper card. **Actions/exits:** start once via existing `session.start` using valid selected/default layout; event bundle keeps its existing direct-start behavior. Five consecutive `.v1-brand` taps reveal operator; do not add a visible admin link. **States:** loading reserves hero and CTA geometry; catalog unavailable/empty disables start with plain-language status; no fabricated layout image. **Data:** catalog layouts, bundle availability, artwork, source status; state transition from backend. **Acceptance:** duplicate start suppressed, five-tap access unchanged, long title wraps, missing image remains honest, 80px action reachable; no unsupported banner or fake online proof.

### 02 Layout — `StudioModeScreen.tsx` (`SELECTING`)

**Purpose/entrance:** choose active layout. Unboxed paper center 1.08 scale and visible neighbors .94/.88 with gallery-negative space; visible glass 64px left/right controls on one axis, progress badge below. **Actions/exits:** carousel arrows wrap; swipe optional with existing 160ms settle; first tap off-center sends `session.setLayout`, tap centered sends `session.confirmSetup`; back invokes allowed `session.back`. **States:** active item obvious by size plus text/selection marker, no hover dependency; 0/1 options disable irrelevant arrows; catalog failure/empty explains and blocks advance. **Data:** actual IDs, artwork, `photoAspectRatio`, counts, names, selected layout; `data-layout-id` and `data-distance` unchanged. **Acceptance:** center and neighbor tap semantics, chevron y delta ≤3px, long title, portrait/strip contain and no clipped neighbors.

### 03 Quantity — `QuantityScreen.tsx` (`SELECTING_QUANTITY`)

**Purpose/entrance:** actual layout selected; paper 55–60% width and large typographic total opposite. **Actions/exits:** 72px `−`/`+` in `.v1-stepper` traverse **authoritative allowed quantity options** only; continue `session.setQuantity`, back `session.back`. **States:** disable bound steps, price pending or missing shows `—`/status rather than an invented amount; pending continue locks, failure retains input. **Data:** catalog allowed options and pricing payload, layout print aspect/source, quantity; not sample ranges or local fabricated price. **Acceptance:** test both layout types with backend-supplied bounds, big VND overflow, no scroll loss or 2× submission.

### 04 Payment — `PaymentScreen.tsx` (`PAYMENT_PENDING`)

**Purpose/entrance:** receipt 45%, reserved QR zone 55%; QR square stays exactly the same measured bounding rect before/after load (0px shift). White opaque code well with quiet zone and clear scanning instructions. **Actions/exits:** existing `payment.createLink` only if needed, 3s status checks, advance only on confirmed backend payment; permitted back, guarded hidden 1000ms heading hold with >12px movement cancel, then PIN dialog and existing guarded cash confirmation. Never show staff bypass by default. **States:** creating spinner *inside fixed slot*, waiting, unconfigured/error (staff help), uncertain status check; no fake QR; do not show paid until backend says paid. Existing explicit QR-link retry is only for known link-creation failure, not an uncertain paid transaction. **Data/events:** sessionId, orderCode, QR, pricing, payOS status, payment check; operator auth risk requires architect review: current client-side PIN/cash override must not be described as production secure. **Acceptance:** rect delta <0.01px, scanner quiet zone, no shift on slow response, poll stop on exit, hold cancellation, dialog focus/keypad, double-tap safety and no bypass.

### 05 Camera preparation — existing `PrepareScreen.tsx` (`PREPARING`)

**Purpose/entrance:** after verified payment, prepare camera automatically; open ivory-to-darkroom transition with lens cue, actual layout title, configured `shotCount` and `countdownSeconds`, not a fake stream. **Action/exit:** no customer skip/start; transition on backend readiness. **States:** visible waiting, unavailable stream/device error with staff help, no success based on animation. **Data:** backend readiness and layout configuration. **Acceptance:** varying counts/countdowns, extended preparation, unavailable camera, readable text at distance.

### 06 Live view / countdown — `CaptureScreen.tsx` (`LIVE_VIEW`, `COUNTDOWN`, `CAPTURING`)

**Purpose/entrance:** largest possible live feed on matte `#0E0D10`, image contained at intrinsic ratio; mirror **live image only**, never overlay text or final output. Crop guide matches configured photo ratio without concealing faces. Shot counter on upper perimeter derives `capturedCount + 1` and `layout.shotCount`; centered countdown occupies viewport center within 2px, 120–220px tabular numeral with high-contrast stroke/shadow **without an opaque face-covering panel**. Review face placement on actual camera framing. **Action/exit:** initial 108px shutter only at first LIVE_VIEW; one `capture.startSequence`, then automated configured capture loop; no retake/back/cancel. **States:** busy disables shutter instantly, waiting feed explicit; COUNTDOWN numeral follows existing backend-anchored 50ms update (not independent session timer), CAPTURING flash tied to state only, stream loss shown honestly without pretending capture succeeded. **Data:** live image URL, intrinsic natural dimensions, `photoAspectRatio`, capture state/count/countdown and camera readiness. **Acceptance:** shutter center dx≤1px and 108/84px geometry; numeral dx/dy≤2px, legible across booth; aspect/orientation checked with portrait and landscape source; stream-loss/reconnect and multitouch do not duplicate shutter; configured counts never hardcoded. No CSS transform on shutter/countdown/QR parents.

### 07 Select photos — `SelectPhotosScreen.tsx` (`SELECTING_PHOTOS`)

**Purpose/entrance:** contact sheet on 55% width and larger composite preview on 45%; each aspect-correct image tile ≥120×120px; optional two/three-column tiles according to source aspect, never 100px tiny contact thumbnails. **Actions/exits:** tap toggles `selection.toggle`, FIFO order badges and reindex on deselect, exact `layout.selectCount` enables `selection.confirm`; 500ms hold opens zoom, release dismisses, 200ms click suppression; existing allowed back/cancel confirmation and existing timeout behavior only. **States:** full quota dims nonselected tiles without changing tested pointer semantics; image pending preserves tile bounds; error status, disabled confirm, decision timer visible. **Data:** captured images, selected IDs/order, selectCount, composition preview, timeout; no invented selected photos. **Acceptance:** tap versus hold, cancel/leave of hold, quota and reindex, missing photo, timer auto-resolution and responsive contacts.

### 08 Frames — `FrameScreen.tsx` (`EDITING`)

**Purpose/entrance:** authoritative composite preview on 58–60% width, two-column frame art options opposite, originals contained with paper shadows. **Actions/exits:** new frame tap `frame.select`, already selected tap preserves existing fast-confirm `frame.confirm`; primary confirm does same; allowed back and cancel confirmation. **States:** selected ring/check plus `aria-pressed`, <100ms feedback, loading/empty/error explicitly described, no fake default frame; timeout may auto-resolve only per existing contract. **Data:** frame IDs, sanitized display titles, frame artwork, current composition, selected ID and timer. **Acceptance:** second-tap semantics, stale preview/out-of-order response, aspect fidelity, scrolling grid, long names and empty frames.

### 09 Final confirm — `ConfirmScreen.tsx` (`PRINT_PENDING`)

**Purpose/entrance:** final composed print occupies 62–65% of body; open editorial receipt, total prominent, no fake print rendering. **Actions/exits:** real mode explicit `Xác nhận & in` dispatches `print.confirmReal` once; demo mode visibly labeled simulation calls `print.confirmDryRun`; existing back only. **States:** missing authoritative composition disables action; uncertain print outcome requests status reconciliation/staff, never blind retry; busy lock immediate. **Data:** final print/composition source, actual print aspect, order pricing, mode, print status. **Acceptance:** image contained and uncropped, print source parity with backend, 72px+ button, no double print and no demo revenue. V1 audited timeout auto-print and current confirm preview fallback are **architect decisions**; design does not authorize new auto-print or call a fallback authoritative.

### 10 Printing — `PrintingScreen.tsx` (`PRINTING`)

**Purpose/entrance:** quiet large contained composition plus evidence-based status timeline; no dashboards/percentages without real status. **Actions/exits:** no customer print/retry/back; backend transitions to delivery. **States:** pending, queue accepted, upload/QR pending, failure or unknown displayed distinctly; queue acceptance is **not** physical paper completion. **Data:** backend snapshot/events for print dispatch, upload, album QR, errors. Current mounting may omit the `PrintingScreen` snapshot: request contract wiring from architect before claiming granular live status. **Acceptance:** no fake completed step, unknown recovery directs staff, demo wording explicit, no real print in design tests.

### 11 Delivery / finish — `DeliveryScreen.tsx` (`DELIVERY`)

**Purpose/entrance:** large opaque album QR at left and easy-to-scan instructions/finish at right. **Actions/exits:** `session.finish` once, returns IDLE; no back. **States:** unavailable album is clear non-scannable message, waiting keeps QR bounds, transmission badge only when acknowledged and must not claim paper printed; on uncertain output involve staff. **Data:** verified album link/QR and print transmission evidence; no generated dummy QR. **Acceptance:** scan and quiet zone on real monitor, missing album, print signal exact semantics, finish reset and press lock.

### 12 Operator — `Operator.tsx` and `V1Settings.tsx` (`ADMIN`)

**Purpose/entrance:** guarded staff workspace via existing hidden access, visually distinct matte ivory application with one glass settings work surface, never a public dashboard shortcut. Six existing tabs **Frames, Layouts, Settings, Tools, Colors, Revenue** with existing tab selectors and permission behavior. Header/tab controls ≥56px; table scrolling internal; no customer page overflow. **Actions/exits:** existing tab actions, guarded close with unsaved changes; settings retains six persisted properties: real-print toggle, camera source, hot-folder path, and post-capture/photo-selection/frame-selection timers. ±10s steppers use existing bounded 0..3600 settings behavior, save/reload retained; switching settings marked `NEXT_SESSION`/`PENDING_DISABLED` appropriately, no immediate hardware-apply claim. **States:** readonly/dirty/saving/saved/error distinct; tabs display honest inventory/empty/errors; device/printer pills say unknown until actual verification; revenue read-only reflects repository, not demo or fabricated totals. **Data:** authorized operator permissions, settings persistence, frame/layout libraries, calculator, LUT/colors, revenue and real device statuses when available. **Acceptance:** six tabs, all exact test IDs, denied access, dirty close guard, long paths and numeric overflow; do not expose client PIN in copy. Architect must validate client PIN and override authorization before production.

### 13 Shared empty/error/recovery surface

**Purpose/entrance:** catalog absent, camera disconnected, QR missing, upload/print uncertain, restart or IPC unavailable. **Actions/exits:** only an existing safe status reconciliation (`catalog.get` / `session.getState` as applicable), permitted back/cancel/finish, or contact staff; never reissue unknown payment or print. **States:** `role=status` for pending, `role=alert` for actionable failure; preserve session data and avoid raw secrets/technical traces on public screen. **Acceptance:** each gate tested for interruption and reconnection without double effect; QR never replaced by illustrative scannable code; no invented out-of-service route.

## 6. Selector and implementation ownership

**Do not replace or rename:** `.v1-shell`, `.v1-shell.v1-camera`, `.v1-primary`, `.v1-secondary`, `.v1-back.backButton`, `.v1-stepper`, `.v1-start`, `.v1-brand`, `.v1-layout-stage`, `.v1-carousel-wrap`, `.v1-carousel-prev`, `.v1-carousel-next`, `.v1-layout-carousel`, `.v1-layout-card.v1-carousel-card[data-layout-id][data-distance]`, `.v1-carousel-indicator[aria-live]`, `.v1-payment-screen`, `.v1-payment-columns`, `.v1-payment-summary`, `.v1-payment-qr-slot[role=status]`, `.v1-staff-cash-btn[data-testid=staff-cash-btn]`, `.v1-staff-pin`, `.v1-camera-viewport`, `.v1-live`, `img.v1-live-mirrored`, `.v1-crop`, `.v1-capture-top`, `.v1-shutter`, `.v1-shutter-ring`, `.v1-shutter-core`, `.v1-countdown-layer[role=timer]`, `.v1-countdown`, `.v1-photo-grid`, `.v1-photo-order`, `.v1-hold-lightbox`, `.v1-frame-grid button[aria-pressed]`, `.v1-confirm-workspace`, `.v1-print-stage.v1-pipeline`, `.v1-delivery-qr`, `.v1-print-signal-badge`, `[data-testid=operator-workspace]`, `[data-testid=operator-close]`, `[data-testid^=operator-tab-]`, `[data-testid=v1-settings]`, `[data-testid=settings-print][role=switch]`, `[data-testid^=settings-camera-]`, `[data-testid^=settings-hot-folder-]`, `[data-testid^=settings-photo-]`, `[data-testid^=settings-frame-]`, `[data-testid^=settings-post-]`, `[data-testid=settings-save]`, `[data-testid=settings-reload]`, `[data-testid=settings-effective-timers]`. Preserve `data-staff-trigger`, ARIA labels/roles, `aria-live`, selection and busy semantics. Consult the full master selector inventory in `FRONTEND_RECONSTRUCTION_INVARIANTS.md` §2.3 before implementation. Retain `.v1-panel` where tested but remove its white-card *appearance*.

Implementation pattern: `AtelierStage` with header/body/action slots retaining existing `main.v1-shell` (do not nest a second shell); `FloatingPrint` with an aspect-preserving image and layered shadow; `AtelierAction` preserving button class, synchronous action lock, disabled/aria-busy; `QrWell` fixed geometry with opaque code face; `StatusSurface` explicit pending/alert; `AtelierDialog` reuses existing modal roles/gesture contracts; `OperatorControlRow` keeps setting data-testid. These are presentational abstractions, not new screens. Prefer a single token sheet plus customer/operator scoped style ownership; replace conflicting legacy CSS only after regression parity, not by stacking `!important` overrides. Do not transform measured QR, shutter or countdown parents.

## 7. Verification gate and outstanding contracts

Before calling the UI complete: run mounted flow/unit/CDP parity suites, then measure DOM rects for touch targets, QR layout shift, shutter/countdown alignment and carousel axis. Capture screenshots at 1280×800 and 1920×1200 plus actual measured CSS viewports under Windows 100/125/150% scaling, portrait/landscape live feed, multiple configured counts, Vietnamese overflow and missing fonts. Check touch-only journey, finger drag plus arrows, long-press cancellation, disabled/loading states, contrast, focus-visible, screen-reader status, reduced motion and recovery at each paid/printing gate. Static screenshots and mock data are **not** functioning UI or physical hardware proof.

**Architect follow-ups:** production authority for staff PIN/cash override; safe reconciliation for payment/print unknown state; final-confirm inherited inactivity auto-print and revenue gate; authoritative final composition versus fallback preview; PrintingScreen snapshot availability; real device/printer/album status contract; catalog pricing/quantity option authority. Until resolved, show unknown or disabled status, never fabricate completion. No commands to charge, capture or print are required by this design handoff.
