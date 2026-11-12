# LE SOUVENIR V2 — Liquid Glass Specification

**Status:** implementation specification, not a working UI  
**Scope:** customer-facing React UI under `.v1-shell.atelier-customer`  
**Target:** landscape 16:10 kiosk at 1920×1200 and 1280×800 CSS-pixel reference sizes  
**Source review:** `theme-tokens.css`, `atelier-core.css`, `atelier-customer.css`, `liquidGlassFx.ts`, `CaptureScreen.tsx`, and `SelectPhotosScreen.tsx`

This specification enhances the existing warm glass language without turning the kiosk into a generic translucent dashboard. Glass is a framing material for actions, sheets, and editorial groupings. Photographs, the camera feed, QR codes, and critical text remain optically clean.

The specification changes presentation and pointer feedback only. It must not add routes, actions, cancellation paths, payment bypasses, or hardcoded capture/selection counts. All counts and state changes continue to come from the existing backend snapshot and action contracts.

---

## 1. Existing implementation findings and guardrails

The current frontend already has several behaviors that must be retained:

- Warm ivory, terracotta, champagne, and rose tokens are already established.
- Delegated ripples are customer-only, capped at two per surface, disabled for reduced motion, and excluded from the camera and operator workspaces.
- The capture view is full bleed and aspect-correct. The shutter uses a synchronous leading-edge ref lock before `capture.startSequence`.
- The selection screen optimistically reconciles ordered photo toggles with backend snapshots.
- Photo hold-to-preview currently starts at 500 ms and suppresses the following click.
- The layout carousel already uses native horizontal overflow, centered scroll snap, and visible 64 px arrow controls.

The enhanced implementation must preserve those behaviors and these additional constraints:

1. Do not place a backdrop filter over the Live View image. It can reduce frame rate and soften faces.
2. Do not run ambient or ripple effects in `.v1-camera`, `.v1-prepare-screen`, or `.operator-workspace`.
3. Do not use glass opacity as the only text backing over photography. Use the dark capture treatment or an opaque-enough paper surface.
4. Never use hover as the only indication that a control is actionable.
5. Decorative champagne and rose do not carry status or selection meaning by themselves.
6. Nested glass is limited to one backdrop-filtering ancestor. A glass control inside a glass sheet uses the solid/high-opacity nested treatment described below.

---

## 2. Visual direction

The material should feel like a thin, warm optical resin sheet in a Korean editorial studio:

- low-chroma, warm, and photographic;
- one crisp upper-left specular edge, not a glowing outline on every side;
- soft rose only in reflected light, never as a large synthetic gradient;
- restrained depth with matte-black typography;
- clear physical press behavior;
- no rainbow refraction, chromatic aberration, neon bloom, or continuously sweeping highlights on ordinary cards;
- at most one dominant glass plane and one nested control layer in a visual region.

Photographs are the highest-contrast objects. Glass should organize them, not tint or blur them.

---

## 3. Enhanced glass token system

### 3.1 Normative CSS tokens

The following values are normative. The frontend coder may initially alias existing `--at-*` names to these values to avoid a disruptive class migration.

```css
:root {
  color-scheme: light;

  /* Required core palette */
  --lg-ivory: #FAF6F0;
  --lg-matte-black: #1A1715;
  --lg-champagne: #D8C7B5;
  --lg-soft-rose: #F0DBD4;
  --lg-primary: #8E442D;

  /* Supporting semantic colors */
  --lg-paper: #FFFCF7;
  --lg-canvas-muted: #F5F0E8;
  --lg-body: #514842;
  --lg-muted: #625750;
  --lg-primary-deep: #6F321F;
  --lg-primary-bright: #A45136;
  --lg-success: #245C42;
  --lg-error: #8F3029;
  --lg-darkroom: #0A090C;
  --lg-darkroom-raised: #131115;

  /* Surface layers: depth layer + base layer + ::before specular layer */
  --lg-layer-card-base: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.76) 0%,
    rgba(255, 252, 247, 0.58) 38%,
    rgba(250, 246, 240, 0.48) 68%,
    rgba(240, 219, 212, 0.30) 100%
  );
  --lg-layer-card-depth: radial-gradient(
    120% 96% at 96% 100%,
    rgba(216, 199, 181, 0.26) 0%,
    rgba(240, 219, 212, 0.12) 42%,
    rgba(255, 255, 255, 0) 72%
  );
  --lg-layer-control-base: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.90) 0%,
    rgba(255, 252, 247, 0.76) 46%,
    rgba(244, 232, 222, 0.64) 100%
  );
  --lg-layer-control-depth: radial-gradient(
    110% 130% at 92% 110%,
    rgba(240, 219, 212, 0.30) 0%,
    rgba(216, 199, 181, 0.12) 48%,
    transparent 72%
  );
  --lg-layer-sheet-base: linear-gradient(
    148deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(255, 252, 247, 0.91) 48%,
    rgba(246, 235, 226, 0.84) 100%
  );
  --lg-layer-sheet-depth: radial-gradient(
    100% 80% at 100% 100%,
    rgba(240, 219, 212, 0.30) 0%,
    transparent 68%
  );
  --lg-layer-dark-base: linear-gradient(
    145deg,
    rgba(49, 42, 52, 0.94) 0%,
    rgba(26, 23, 21, 0.96) 48%,
    rgba(10, 9, 12, 0.98) 100%
  );
  --lg-layer-primary: linear-gradient(
    160deg,
    #A45136 0%,
    #8E442D 52%,
    #692C1B 100%
  );

  /* Static reflected light. Apply with ::before; never animate continuously. */
  --lg-layer-specular: radial-gradient(
    125% 72% at 8% -12%,
    rgba(255, 255, 255, 0.94) 0%,
    rgba(255, 255, 255, 0.34) 39%,
    rgba(255, 255, 255, 0) 68%
  );
  --lg-layer-specular-dark: radial-gradient(
    110% 68% at 12% -8%,
    rgba(255, 255, 255, 0.28) 0%,
    rgba(255, 255, 255, 0.08) 42%,
    transparent 70%
  );
  --lg-layer-press-glow: radial-gradient(
    circle 92px at var(--touch-x, 50%) var(--touch-y, 50%),
    rgba(255, 255, 255, 0.52) 0%,
    rgba(240, 219, 212, 0.24) 42%,
    rgba(255, 255, 255, 0) 74%
  );
  --lg-layer-press-glow-primary: radial-gradient(
    circle 96px at var(--touch-x, 50%) var(--touch-y, 50%),
    rgba(255, 255, 255, 0.34) 0%,
    rgba(255, 232, 221, 0.18) 44%,
    rgba(255, 255, 255, 0) 74%
  );

  /* Borders and inner optical edge */
  --lg-border: rgba(255, 255, 255, 0.58);
  --lg-border-strong: rgba(216, 199, 181, 0.82);
  --lg-border-control: rgba(90, 74, 64, 0.62);
  --lg-border-dark: rgba(216, 199, 181, 0.46);
  --lg-inner-glow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    inset 1px 0 0 rgba(255, 255, 255, 0.22),
    inset 0 -1px 0 rgba(142, 68, 45, 0.08),
    inset 0 -18px 30px rgba(240, 219, 212, 0.10);
  --lg-inner-glow-dark:
    inset 0 1px 0 rgba(255, 255, 255, 0.20),
    inset 0 -2px 0 rgba(0, 0, 0, 0.28),
    inset 0 -14px 26px rgba(0, 0, 0, 0.16);

  /* Shadow depth scale */
  --lg-shadow-0: none;
  --lg-shadow-1:
    var(--lg-inner-glow),
    0 2px 4px rgba(74, 42, 28, 0.05),
    0 8px 20px rgba(74, 42, 28, 0.06);
  --lg-shadow-2:
    var(--lg-inner-glow),
    0 3px 8px rgba(74, 42, 28, 0.06),
    0 14px 32px rgba(74, 42, 28, 0.10),
    0 28px 54px rgba(74, 42, 28, 0.05);
  --lg-shadow-3:
    var(--lg-inner-glow),
    0 5px 12px rgba(74, 42, 28, 0.08),
    0 22px 48px rgba(74, 42, 28, 0.14),
    0 42px 72px rgba(74, 42, 28, 0.08);
  --lg-shadow-4:
    var(--lg-inner-glow),
    0 8px 18px rgba(26, 23, 21, 0.12),
    0 32px 80px rgba(26, 23, 21, 0.24);
  --lg-shadow-dark:
    var(--lg-inner-glow-dark),
    0 8px 18px rgba(0, 0, 0, 0.32),
    0 24px 52px rgba(0, 0, 0, 0.48);
  --lg-shadow-selected:
    0 0 0 3px rgba(194, 115, 87, 0.24),
    0 14px 34px rgba(142, 68, 45, 0.22);

  /* Backdrop levels */
  --lg-filter-control: blur(14px) saturate(118%);
  --lg-filter-card: blur(18px) saturate(122%);
  --lg-filter-sheet: blur(24px) saturate(126%);

  /* Geometry */
  --lg-radius-control: 18px;
  --lg-radius-card: 24px;
  --lg-radius-sheet: 32px;
  --lg-radius-pill: 999px;
  --lg-border-width: 1px;
  --lg-target-min: 56px;
  --lg-target-comfort: 64px;
  --lg-target-primary: 68px;
  --lg-shutter-size: 104px;
  --lg-edge-x: 32px;
  --lg-edge-y: 16px;
  --lg-layout-gap: 16px;
  --lg-card-padding: 20px;

  /* Motion */
  --lg-duration-instant: 80ms;
  --lg-duration-fast: 140ms;
  --lg-duration-release: 180ms;
  --lg-duration-standard: 240ms;
  --lg-duration-settle: 360ms;
  --lg-duration-ripple: 520ms;
  --lg-ease-standard: cubic-bezier(0.20, 0, 0, 1);
  --lg-ease-out: cubic-bezier(0.16, 1, 0.30, 1);
  --lg-ease-spring: cubic-bezier(0.22, 1.28, 0.36, 1);
}
```

### 3.2 Shadow usage

| Depth | Use | Rule |
|---|---|---|
| `0` | inline labels, non-surface content | No elevation. |
| `1` | chips, compact controls, nested controls | Never add another backdrop filter inside a filtering parent. |
| `2` | standard cards and photo grouping panels | Default `.glass-card`. |
| `3` | floating action bar or elevated selection panel | Maximum normal-page elevation. |
| `4` | modal sheet only | Must be paired with a dark scrim. |
| `dark` | shutter and darkroom controls | No backdrop filter over Live View. |

### 3.3 Material layering order

Every light glass surface uses this order, back to front:

1. translucent paper base color;
2. base linear gradient;
3. lower-right depth radial gradient;
4. border and inner glow;
5. static upper-left specular `::before`;
6. pointer-local press glow `::after` for interactive surfaces;
7. spring ripple;
8. text/icon content.

This order must remain stable. Do not use `mix-blend-mode`, which produces inconsistent results over photos and in Windows WebView implementations.

---

## 4. Motion and animation primitives

Only `transform` and `opacity` animate during touch feedback. Backdrop blur, box shadow, and gradient stops must not animate.

```css
@keyframes lg-ripple-spring {
  0% {
    transform: translate3d(-50%, -50%, 0) scale(0.06);
    opacity: 0;
  }
  12% {
    opacity: var(--lg-ripple-opacity, 0.48);
  }
  56% {
    transform: translate3d(-50%, -50%, 0) scale(1.04);
    opacity: var(--lg-ripple-mid-opacity, 0.23);
  }
  78% {
    transform: translate3d(-50%, -50%, 0) scale(0.985);
    opacity: var(--lg-ripple-end-opacity, 0.12);
  }
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 0;
  }
}

@keyframes lg-surface-enter {
  0% { transform: translate3d(0, 8px, 0) scale(0.992); opacity: 0; }
  100% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
}

@keyframes lg-sheet-in {
  0% { transform: translate3d(0, 18px, 0) scale(0.985); opacity: 0; }
  100% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
}

@keyframes lg-sheet-out {
  0% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
  100% { transform: translate3d(0, 10px, 0) scale(0.992); opacity: 0; }
}

@keyframes lg-selection-set {
  0% { transform: scale(0.94); opacity: 0.36; }
  62% { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes lg-shutter-fire {
  0% { transform: scale(1); }
  35% { transform: scale(0.92); }
  100% { transform: scale(1); }
}

@keyframes lg-capture-flash {
  0% { opacity: 0.92; }
  16% { opacity: 0.80; }
  100% { opacity: 0; }
}

@keyframes lg-countdown-pop {
  0% { transform: scale(0.86); opacity: 0.18; }
  52% { transform: scale(1.04); opacity: 0.78; }
  100% { transform: scale(1); opacity: 0.64; }
}

@keyframes lg-busy-spin {
  to { transform: rotate(360deg); }
}
```

Animation assignments:

- Surface entrance: `240ms var(--lg-ease-out) both`, once per route entrance only.
- Sheet entrance: `320ms var(--lg-ease-out) both`.
- Sheet exit: `180ms var(--lg-ease-standard) both`.
- Ripple: `520ms linear both`; the spring shape comes from keyframe offsets, not a generic ease.
- Selection badge: `240ms var(--lg-ease-spring) both`.
- Shutter compression: `220ms var(--lg-ease-out) both`, triggered from backend `CAPTURING`, never used to delay the action.
- Capture flash: `360ms cubic-bezier(0.10, 0.90, 0.20, 1) both`, pointer-events disabled.
- Countdown digit: `220ms var(--lg-ease-out) both` on each backend-derived digit change.

No ordinary card has a looping sheen. If the existing ambient layer remains, drift is limited to 16 px over at least 18 seconds and is disabled in camera, preparation, operator, reduced-motion, and reduced-transparency contexts.

---

## 5. Touch interaction specification

### 5.1 Pointer state sequence

| Event/state | Required response |
|---|---|
| `pointerdown` on enabled control | In the same event, set `--touch-x`, `--touch-y`, and `data-pressed="true"`. Press glow appears within one rendered frame. Do not invoke the business action yet. |
| Press visual | Surface scales to `0.975`; shutter outer ring scales to `0.97` and core to `0.90`. Transition in is 80 ms. |
| Ripple | Add one `aria-hidden="true"` ripple at the contact point. Diameter is `2 × hypot(width, height)`. Maximum two live ripples per surface. |
| `pointerup` inside | Remove pressed state, allow the native `click`, and release over 180 ms. |
| `pointerup` outside, `pointercancel`, `lostpointercapture`, window blur, or document hidden | Remove pressed state and do not synthesize a click. |
| Disabled/loading | No glow, ripple, scale, haptic, or action. Keep readable disabled styling rather than opacity alone. |
| Error | Release the local busy latch and show the existing in-flow error treatment. Do not shake the whole screen. |

Normative ripple CSS:

```css
.glass-touch-ripple {
  position: absolute;
  z-index: 1;
  left: var(--ripple-x);
  top: var(--ripple-y);
  width: var(--ripple-size);
  height: var(--ripple-size);
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.58) 0%,
    rgba(255, 244, 236, 0.30) 44%,
    rgba(240, 219, 212, 0.12) 62%,
    transparent 74%
  );
  transform: translate3d(-50%, -50%, 0) scale(0.06);
  animation: lg-ripple-spring var(--lg-duration-ripple) linear both;
  will-change: transform, opacity;
}
```

Remove each ripple on `animationend`, with a 650 ms cleanup timeout as a route-change safety net. The delegated effect root remains customer-only. The shutter uses its own press treatment and must not be added to the global camera-excluding ripple delegate.

### 5.2 Tap, hold, and double-tap protection

- A tap may drift up to **12 CSS px**. Movement beyond that cancels a pending hold and suppresses the item click if a drag has begun.
- Photo preview hold remains **500 ms**. Releasing or cancelling closes the preview. The click immediately following a successful hold is suppressed for **200 ms**, matching the current behavior.
- Use `touch-action: pan-y` on photo tiles so users can still scroll the photo grid. Cancel hold as soon as vertical or horizontal movement exceeds 12 px.
- Actions fire from semantic `click`, not `pointerdown`.
- Primary navigation and shutter controls take a synchronous leading-edge latch before calling the existing action. A rapid second tap while latched is ignored.
- If the action synchronously returns `false`, rejects, or throws, release the latch. Otherwise, the authoritative backend state transition owns release/navigation.
- Do not apply a kiosk-wide debounce; it would make separate controls feel unresponsive.
- Optional haptic feedback is one non-blocking `navigator.vibrate?.(8)` after an accepted ordinary activation. Shutter feedback may use 12 ms. Failure or absence of vibration is ignored.

### 5.3 Carousel swipe/drag

Swipe is additive; 64 px previous/next buttons and position text remain available.

1. Touch uses native `overflow-x: auto` plus `scroll-snap-type: x mandatory`; do not call `preventDefault()` on touch `pointermove`.
2. Mouse/stylus drag may use pointer capture and update `scrollLeft` directly.
3. Enter drag state after **8 px** horizontal movement. Suppress item activation after **12 px** total movement.
4. At an edge, apply resistance factor **0.32** to movement beyond the scroll range.
5. On release, project `velocity × 180 ms`. Advance when velocity is at least **0.45 px/ms** or displacement reaches `min(96px, max(48px, 18% of the centered card width))`.
6. Settle to the nearest enabled card in **360 ms** with `cubic-bezier(0.16, 1, 0.30, 1)`.
7. During drag set `data-dragging="true"`, temporarily use `scroll-snap-type: none`, and suppress ripples on child cards. Restore mandatory snap on the next animation frame after release.
8. With reduced motion, use immediate nearest-card snapping and `scroll-behavior: auto`.

```css
.glass-carousel {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
  touch-action: pan-x;
  -webkit-overflow-scrolling: touch;
}

.glass-carousel::-webkit-scrollbar { display: none; }
.glass-carousel[data-dragging="true"] {
  scroll-snap-type: none;
  cursor: grabbing;
  user-select: none;
}
.glass-carousel__item { scroll-snap-align: center; scroll-snap-stop: always; }
```

---

## 6. Reusable component classes

### 6.1 Shared layer contract

All four components use a content wrapper so decorative layers never affect layout or receive events.

```css
:is(.glass-card, .glass-button, .glass-sheet, .glass-shutter) {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  color: var(--lg-matte-black);
}

:is(.glass-card, .glass-button, .glass-sheet, .glass-shutter)::before {
  content: "";
  position: absolute;
  z-index: 0;
  inset: 0;
  border-radius: inherit;
  background: var(--lg-layer-specular);
  opacity: 0.78;
  pointer-events: none;
}

:is(.glass-button, .glass-card[data-interactive="true"], .glass-shutter)::after {
  content: "";
  position: absolute;
  z-index: 1;
  inset: 0;
  border-radius: inherit;
  background: var(--lg-layer-press-glow);
  opacity: 0;
  transform: scale(0.82);
  transition:
    opacity var(--lg-duration-instant) linear,
    transform var(--lg-duration-fast) var(--lg-ease-out);
  pointer-events: none;
}

:is(.glass-button, .glass-card[data-interactive="true"], .glass-shutter)[data-pressed="true"]::after,
:is(.glass-button, .glass-card[data-interactive="true"], .glass-shutter):active:not(:disabled)::after {
  opacity: 1;
  transform: scale(1);
}

.glass-content,
.glass-button__label,
.glass-button__spinner,
.glass-shutter__ring,
.glass-shutter__core {
  position: relative;
  z-index: 2;
}
```

### 6.2 `.glass-card`

Use for panels, preview groupings, quantity cards, selection preview, and print/delivery groupings. It is noninteractive by default.

```css
.glass-card {
  border: var(--lg-border-width) solid var(--lg-border);
  border-top-color: rgba(255, 255, 255, 0.82);
  border-radius: var(--lg-radius-card);
  padding: var(--lg-card-padding);
  background-color: rgba(255, 252, 247, 0.70);
  background-image: var(--lg-layer-card-depth), var(--lg-layer-card-base);
  box-shadow: var(--lg-shadow-2);
  -webkit-backdrop-filter: var(--lg-filter-card);
  backdrop-filter: var(--lg-filter-card);
}

.glass-card[data-elevation="1"] { box-shadow: var(--lg-shadow-1); }
.glass-card[data-elevation="2"] { box-shadow: var(--lg-shadow-2); }
.glass-card[data-elevation="3"] { box-shadow: var(--lg-shadow-3); }

.glass-card[data-tone="rose"] {
  background-color: rgba(250, 246, 240, 0.76);
  background-image:
    radial-gradient(110% 90% at 100% 100%, rgba(240, 219, 212, 0.36), transparent 68%),
    var(--lg-layer-card-base);
}

.glass-card[data-tone="dark"] {
  color: var(--lg-paper);
  border-color: var(--lg-border-dark);
  background: var(--lg-layer-dark-base);
  box-shadow: var(--lg-shadow-dark);
}
.glass-card[data-tone="dark"]::before { background: var(--lg-layer-specular-dark); }

.glass-card[data-interactive="true"] {
  min-block-size: var(--lg-target-comfort);
  touch-action: manipulation;
  transition: transform var(--lg-duration-release) var(--lg-ease-out);
}
.glass-card[data-interactive="true"][data-pressed="true"] {
  transform: scale(0.975);
  transition-duration: var(--lg-duration-instant);
}
```

Photo-tile recipe:

```css
.glass-card--photo {
  --lg-ripple-opacity: 0.18;
  width: 100%;
  min-height: var(--lg-target-min);
  padding: 0;
  border: 2px solid rgba(255, 255, 255, 0.76);
  border-radius: 18px;
  background: var(--lg-paper);
  box-shadow: var(--lg-shadow-1);
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.glass-card--photo::before { opacity: 0.26; }
.glass-card--photo[aria-pressed="true"] {
  border: 3px solid var(--lg-primary);
  box-shadow: var(--lg-shadow-selected);
}
.glass-card--photo[data-unavailable="true"] {
  opacity: 0.54;
  filter: saturate(0.72);
}
.glass-photo-order {
  position: absolute;
  z-index: 3;
  top: 10px;
  right: 10px;
  min-width: 40px;
  height: 40px;
  padding-inline: 10px;
  display: grid;
  place-items: center;
  border: 2px solid var(--lg-paper);
  border-radius: var(--lg-radius-pill);
  background: var(--lg-layer-primary);
  color: #FFFFFF;
  box-shadow: 0 6px 16px rgba(74, 42, 28, 0.34);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  animation: lg-selection-set var(--lg-duration-standard) var(--lg-ease-spring) both;
}
```

Do not place the specular overlay above the photograph at more than `0.26` opacity. The selection border and numbered badge provide non-color-only confirmation.

### 6.3 `.glass-button`

Use on a semantic `<button>` or `<a>` only. Ordinary actions default to 64 px; the absolute floor is 56 px.

```css
.glass-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: var(--lg-target-comfort);
  min-height: var(--lg-target-comfort);
  padding: 12px 28px;
  border: 1px solid var(--lg-border-control);
  border-radius: var(--lg-radius-pill);
  background-color: rgba(255, 252, 247, 0.84);
  background-image: var(--lg-layer-control-depth), var(--lg-layer-control-base);
  box-shadow: var(--lg-shadow-1);
  -webkit-backdrop-filter: var(--lg-filter-control);
  backdrop-filter: var(--lg-filter-control);
  color: var(--lg-matte-black);
  font: inherit;
  font-weight: 700;
  line-height: 1.25;
  text-align: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform var(--lg-duration-release) var(--lg-ease-out),
    border-color var(--lg-duration-fast) var(--lg-ease-standard);
}

.glass-button[data-size="minimum"] {
  min-width: var(--lg-target-min);
  min-height: var(--lg-target-min);
  padding: 8px 18px;
}
.glass-button[data-size="icon"] {
  width: var(--lg-target-comfort);
  min-width: var(--lg-target-comfort);
  height: var(--lg-target-comfort);
  min-height: var(--lg-target-comfort);
  padding: 0;
}
.glass-button[data-size="primary"] {
  min-height: var(--lg-target-primary);
  padding-inline: 36px;
}

.glass-button[data-tone="primary"] {
  border-color: rgba(255, 255, 255, 0.40);
  background: var(--lg-layer-primary);
  box-shadow:
    inset 0 1.5px 1px rgba(255, 255, 255, 0.36),
    inset 0 -2px 4px rgba(54, 20, 10, 0.26),
    0 8px 18px rgba(142, 68, 45, 0.18),
    0 18px 38px rgba(142, 68, 45, 0.18);
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  color: #FFFFFF;
}
.glass-button[data-tone="primary"]::after {
  background: var(--lg-layer-press-glow-primary);
}

.glass-button[data-pressed="true"],
.glass-button:active:not(:disabled) {
  transform: scale(0.975);
  transition-duration: var(--lg-duration-instant);
}

.glass-button[aria-pressed="true"] {
  border: 2px solid var(--lg-primary);
  box-shadow: var(--lg-shadow-selected), var(--lg-shadow-1);
}

.glass-button:disabled,
.glass-button[aria-disabled="true"],
.glass-button[data-loading="true"] {
  border-color: #B8A89D;
  background: #E8DED5;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.46);
  color: #514842;
  cursor: not-allowed;
  transform: none;
}
.glass-button:disabled::after,
.glass-button[aria-disabled="true"]::after,
.glass-button[data-loading="true"]::after { display: none; }

.glass-button[data-loading="true"] .glass-button__label { visibility: hidden; }
.glass-button__spinner {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 3px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: lg-busy-spin 760ms linear infinite;
}
```

There is no hover-only state. On hover-capable hardware, hover may raise border contrast, but it must not move, reveal, or enable the control.

### 6.4 `.glass-sheet`

Use for confirmations and recovery dialogs that already exist in the workflow. A sheet must not create a new way to cancel or bypass a gate.

```css
.glass-sheet-backdrop {
  position: fixed;
  z-index: 40;
  inset: 0;
  display: grid;
  place-items: center;
  padding: max(24px, var(--lg-edge-y)) max(24px, var(--lg-edge-x));
  background: rgba(26, 23, 21, 0.58);
  -webkit-backdrop-filter: blur(10px) saturate(112%);
  backdrop-filter: blur(10px) saturate(112%);
}

.glass-sheet {
  width: min(720px, calc(100vw - 2 * var(--lg-edge-x)));
  max-height: calc(100dvh - 2 * max(24px, var(--lg-edge-y)));
  overflow: auto;
  overscroll-behavior: contain;
  padding: clamp(24px, 2.5vw, 40px);
  border: 1px solid var(--lg-border);
  border-top-color: rgba(255, 255, 255, 0.92);
  border-radius: var(--lg-radius-sheet);
  background-color: rgba(255, 252, 247, 0.90);
  background-image: var(--lg-layer-sheet-depth), var(--lg-layer-sheet-base);
  box-shadow: var(--lg-shadow-4);
  -webkit-backdrop-filter: var(--lg-filter-sheet);
  backdrop-filter: var(--lg-filter-sheet);
  color: var(--lg-matte-black);
}
.glass-sheet[data-state="open"] {
  animation: lg-sheet-in 320ms var(--lg-ease-out) both;
}
.glass-sheet[data-state="closing"] {
  animation: lg-sheet-out 180ms var(--lg-ease-standard) both;
}
.glass-sheet[data-placement="side"] {
  justify-self: end;
  width: min(560px, calc(100vw - 2 * var(--lg-edge-x)));
  height: calc(100dvh - 2 * max(24px, var(--lg-edge-y)));
}
.glass-sheet[data-placement="bottom"] {
  align-self: end;
  width: min(920px, calc(100vw - 2 * var(--lg-edge-x)));
  max-height: min(72dvh, 720px);
}

/* A nested control must not create a second live backdrop-filter layer. */
.glass-sheet .glass-button {
  background-color: rgba(255, 252, 247, 0.94);
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
.glass-sheet .glass-button[data-tone="primary"] { background: var(--lg-layer-primary); }
```

The sheet uses `role="dialog"` or `role="alertdialog"`, `aria-modal="true"`, a labelled title, focus containment, and focus return. Backdrop tap and Escape dismiss only when the existing flow explicitly permits cancellation.

### 6.5 `.glass-shutter`

The shutter is a dark optical control, not a backdrop-filtering card. It remains fast over Live View and gets a large target at every breakpoint.

```css
.glass-shutter {
  width: var(--lg-shutter-size);
  min-width: var(--lg-shutter-size);
  height: var(--lg-shutter-size);
  min-height: var(--lg-shutter-size);
  display: grid;
  place-items: center;
  padding: 0;
  border: 2px solid rgba(229, 214, 197, 0.94);
  border-radius: 50%;
  background: var(--lg-layer-dark-base);
  box-shadow: var(--lg-shadow-dark);
  color: var(--lg-paper);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform var(--lg-duration-release) var(--lg-ease-out);
}
.glass-shutter::before { background: var(--lg-layer-specular-dark); opacity: 0.92; }
.glass-shutter::after { background: var(--lg-layer-press-glow-primary); }

.glass-shutter__ring {
  width: calc(100% - 12px);
  height: calc(100% - 12px);
  display: grid;
  place-items: center;
  border: 2px solid rgba(255, 252, 247, 0.58);
  border-radius: 50%;
  transition: transform var(--lg-duration-release) var(--lg-ease-out);
}
.glass-shutter__core {
  width: calc(100% - 14px);
  height: calc(100% - 14px);
  border: 2px solid var(--lg-paper);
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 28%,
    #B96043 0%,
    #8E442D 56%,
    #642A19 100%
  );
  box-shadow:
    inset 0 3px 7px rgba(255, 255, 255, 0.30),
    inset 0 -4px 8px rgba(54, 20, 10, 0.24),
    0 5px 14px rgba(0, 0, 0, 0.38);
  transition: transform var(--lg-duration-release) var(--lg-ease-out);
}

.glass-shutter[data-pressed="true"] .glass-shutter__ring,
.glass-shutter:active:not(:disabled) .glass-shutter__ring {
  transform: scale(0.97);
  transition-duration: var(--lg-duration-instant);
}
.glass-shutter[data-pressed="true"] .glass-shutter__core,
.glass-shutter:active:not(:disabled) .glass-shutter__core {
  transform: scale(0.90);
  transition-duration: var(--lg-duration-instant);
}
.glass-shutter[data-state="capturing"] {
  animation: lg-shutter-fire 220ms var(--lg-ease-out) both;
}
.glass-shutter:disabled,
.glass-shutter[data-state="disabled"],
.glass-shutter[data-state="starting"] {
  border-color: #8E8278;
  box-shadow: var(--lg-inner-glow-dark), 0 10px 24px rgba(0, 0, 0, 0.34);
  cursor: not-allowed;
}
.glass-shutter:disabled .glass-shutter__core,
.glass-shutter[data-state="disabled"] .glass-shutter__core,
.glass-shutter[data-state="starting"] .glass-shutter__core {
  border-color: #B8A89D;
  background: #5E554E;
}
```

Capture-specific rules:

- The Live View, crop guide, and countdown are not glass surfaces.
- The progress chip can use a dark solid/translucent treatment but no backdrop filter.
- Countdown digits use `clamp(140px, 24dvh, 260px)`, `font-weight: 800`, tabular numerals, `rgba(255, 252, 247, 0.72)`, and a dark drop shadow. There is no plate behind the digit.
- Shot progress always reads backend values such as `count + 1` and `layout.shotCount`; no literal total is introduced.
- The shutter is visible only when the existing capture state permits it. Styling must not make it actionable during countdown or capture.
- The visual shutter animation and flash start from existing capture state, never as a timer that triggers the camera.

---

## 7. React component API signatures

These are the implementation contracts. Existing `.v1-*` classes may coexist during migration.

```ts
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  RefObject,
} from 'react';

export type GlassElevation = 1 | 2 | 3;
export type GlassTone = 'light' | 'rose' | 'dark';

export type GlassCardProps = Omit<HTMLAttributes<HTMLElement>, 'color'> & {
  as?: 'div' | 'section' | 'article';
  elevation?: GlassElevation;
  tone?: GlassTone;
  interactive?: boolean;
  selected?: boolean;
  children: ReactNode;
};

export declare function GlassCard(props: GlassCardProps): JSX.Element;

export type GlassButtonTone = 'primary' | 'secondary';
export type GlassButtonSize = 'minimum' | 'comfort' | 'primary' | 'icon';

export type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: GlassButtonTone;
  size?: GlassButtonSize;
  /** Supply only for a true toggle; maps to aria-pressed. */
  pressed?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  ripple?: boolean;
};

export declare function GlassButton(props: GlassButtonProps): JSX.Element;

export type GlassSheetProps = {
  open: boolean;
  placement?: 'center' | 'side' | 'bottom';
  role?: 'dialog' | 'alertdialog';
  titleId: string;
  descriptionId?: string;
  /** True only if the existing business state allows dismissal. */
  dismissible: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onRequestClose?: (reason: 'escape' | 'backdrop' | 'action') => void;
  children: ReactNode;
};

export declare function GlassSheet(props: GlassSheetProps): JSX.Element | null;

export type GlassShutterState =
  | 'ready'
  | 'starting'
  | 'countdown'
  | 'capturing'
  | 'disabled';

export type GlassShutterProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'children'
> & {
  state: GlassShutterState;
  label: string;
  onCapture: () => void | boolean | Promise<void | boolean>;
};

export declare function GlassShutter(props: GlassShutterProps): JSX.Element;
```

Required component behavior:

- `GlassButton` and `GlassShutter` render native `<button type="button">` elements.
- `loading` sets both native `disabled` and `aria-busy="true"`; an adjacent or internal status string exposes `loadingLabel` to assistive technology.
- `GlassShutter` takes its local latch synchronously, then calls only the supplied existing action. It does not own countdown or capture timing.
- `GlassCard interactive` is only valid when `as` resolves to an appropriate interactive element in the concrete implementation. Prefer `GlassButton` for actions; do not create clickable `<div>` elements.
- `GlassSheet` does not call `onRequestClose` for Escape or backdrop when `dismissible` is false.

Recommended delegated effect API:

```ts
export type LiquidGlassFxOptions = {
  rootSelector?: string; // default: '.v1-shell.atelier-customer:not(.v1-camera)'
  surfaceSelector?: string; // default: '[data-glass-interactive="true"]'
  maxRipplesPerSurface?: number; // default: 2
};

export declare function initLiquidGlassFx(
  options?: LiquidGlassFxOptions,
): () => void;
```

During migration, `surfaceSelector` may include the current `.v1-primary`, `.v1-secondary`, arrows, steppers, frame buttons, photo buttons, bundle buttons, and event buttons. Disabled and `aria-disabled="true"` surfaces remain excluded.

---

## 8. Responsive breakpoints and Windows scaling

CSS breakpoints are based on the WebView viewport, not physical pixels or `devicePixelRatio`.

```css
/* Compact 16:10 default: 1280×800 and 1920×1200 at Windows 150% */
:root {
  --lg-edge-x: 32px;
  --lg-edge-y: 16px;
  --lg-layout-gap: 16px;
  --lg-card-padding: 20px;
  --lg-target-min: 56px;
  --lg-target-comfort: 64px;
  --lg-target-primary: 68px;
  --lg-shutter-size: 104px;
}

/* Comfortable: 1536×960, including 1920×1200 at Windows 125% */
@media (min-width: 1400px) and (min-height: 900px) {
  :root {
    --lg-edge-x: 48px;
    --lg-edge-y: 24px;
    --lg-layout-gap: 24px;
    --lg-card-padding: 24px;
    --lg-target-primary: 72px;
    --lg-shutter-size: 112px;
  }
}

/* Gallery: native 1920×1200 at Windows 100% */
@media (min-width: 1800px) and (min-height: 1100px) {
  :root {
    --lg-edge-x: 64px;
    --lg-edge-y: 32px;
    --lg-layout-gap: 32px;
    --lg-card-padding: 28px;
    --lg-target-primary: 72px;
    --lg-shutter-size: 120px;
  }
}

/* Constrained safety profile; never shrink an action below 56 px. */
@media (max-width: 1099px), (max-height: 699px) {
  :root {
    --lg-edge-x: 20px;
    --lg-edge-y: 12px;
    --lg-layout-gap: 12px;
    --lg-card-padding: 16px;
    --lg-target-min: 56px;
    --lg-target-comfort: 56px;
    --lg-target-primary: 64px;
    --lg-shutter-size: 96px;
  }
}
```

### 8.1 Reference matrix

| Physical display / Windows scale | Approx. CSS viewport | Profile | Required behavior |
|---|---:|---|---|
| 1920×1200 / 100% | 1920×1200 | Gallery | 64 px outer gutter, 120 px shutter, two-column customer compositions. |
| 1920×1200 / 125% | 1536×960 | Comfortable | 48 px outer gutter, 112 px shutter, two-column compositions. |
| 1920×1200 / 150% | 1280×800 | Compact | 32 px outer gutter, 104 px shutter, reduce decoration before content. |
| 1280×800 / 100% | 1280×800 | Compact | Primary acceptance-test viewport; all actions remain at least 56 px. |
| 1280×800 / 125% | 1024×640 | Constrained | Stack or internally scroll non-capture split layouts; controls remain at least 56 px. |
| 1280×800 / 150% | ~853×533 | Constrained | Safety fallback: remove ambient decoration, stack content, permit vertical scrolling, never scale the entire app down. |

At compact and constrained heights, remove decorative glints, extra snapshot cards, and ambient orbs before reducing type or targets. Live View remains full bleed. Text controls permit two lines, use `min-width: 0`, and grow vertically rather than clipping translated copy.

Minimum clear space between separate touch targets is **8 px**; **12 px** is preferred. Primary and destructive/exit choices in a sheet require at least 16 px separation.

---

## 9. Accessibility and fallback behavior

### 9.1 Contrast and non-color cues

Approximate core contrast ratios:

- matte black on ivory: **16.5:1**;
- body text on ivory: **8.3:1**;
- primary terracotta on ivory: **6.5:1**;
- white on primary terracotta: **7.0:1**.

Champagne and soft rose do not meet text contrast on ivory and are decorative only. Selection always combines a 3 px terracotta border, numbered badge, and `aria-pressed`. Errors use icon/text/border in addition to color.

All controls need an always-present boundary. Focus is additional to the glass border:

```css
:is(.glass-button, .glass-shutter, .glass-card[data-interactive="true"]):focus-visible {
  outline: 3px solid var(--lg-primary);
  outline-offset: 4px;
  box-shadow: 0 0 0 3px var(--lg-ivory), var(--lg-shadow-2);
}
```

### 9.2 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  :is(.glass-card, .glass-button, .glass-sheet, .glass-shutter),
  .glass-shutter__ring,
  .glass-shutter__core,
  .glass-photo-order {
    animation: none !important;
    transition: none !important;
  }

  .glass-touch-ripple { display: none; }
  .glass-carousel { scroll-behavior: auto; }
  .glass-button__spinner { animation: none; }

  /* Keep state visible without movement. */
  .glass-button[data-pressed="true"],
  .glass-shutter[data-pressed="true"] { transform: none; }

  .v1-countdown { animation: none !important; }
  .v1-shutter-flash {
    animation-duration: 80ms !important;
    opacity: 0.18;
  }
}
```

Loading must include text such as the existing localized processing status; a spinner is never the sole indicator.

### 9.3 Reduced transparency and unsupported backdrop filter

```css
@media (prefers-reduced-transparency: reduce) {
  .glass-card,
  .glass-button,
  .glass-sheet {
    background: var(--lg-paper);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
  .glass-sheet-backdrop {
    background: rgba(26, 23, 21, 0.84);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
  .ambient-liquid-glass { display: none; }
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-card,
  .glass-button,
  .glass-sheet {
    background: var(--lg-paper);
  }
  .glass-sheet-backdrop { background: rgba(26, 23, 21, 0.84); }
}
```

### 9.4 Increased and forced contrast

```css
@media (prefers-contrast: more) {
  .glass-card,
  .glass-button,
  .glass-sheet {
    border: 2px solid var(--lg-body);
    background: var(--lg-paper);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    box-shadow: none;
  }
  .glass-button[data-tone="primary"] {
    border-color: var(--lg-matte-black);
    background: var(--lg-primary);
    color: #FFFFFF;
  }
  .ambient-liquid-glass { display: none; }
}

@media (forced-colors: active) {
  .glass-card,
  .glass-button,
  .glass-sheet,
  .glass-shutter {
    forced-color-adjust: auto;
    border: 2px solid ButtonText;
    background: Canvas;
    color: CanvasText;
    box-shadow: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }

  .glass-button[aria-pressed="true"],
  .glass-card--photo[aria-pressed="true"] {
    border-color: Highlight;
    background: Highlight;
    color: HighlightText;
  }

  :is(.glass-card, .glass-button, .glass-sheet, .glass-shutter)::before,
  :is(.glass-button, .glass-card[data-interactive="true"], .glass-shutter)::after,
  .glass-touch-ripple,
  .ambient-liquid-glass {
    display: none;
  }

  :focus-visible { outline: 3px solid Highlight; }
}
```

### 9.5 Semantic and kiosk requirements

- Use native buttons for every action and native links only for true navigation to an external album.
- Icon-only controls have localized accessible names.
- Countdown uses `role="timer"` and a localized label, but should not generate an overly verbose live-region announcement every 50 ms. Announce only changed whole seconds.
- Busy surfaces use `aria-busy`; disabled actions use native `disabled` whenever possible.
- Sheet focus cannot escape behind the scrim, and focus returns to the opener after close.
- Touch feedback is decorative and `aria-hidden`; it never changes the accessible name.
- Images retain descriptive localized alt text. Glass overlays must not alter image opacity except the explicitly unavailable, unselected photo state.

---

## 10. Screen-specific application

### Capture

- Keep `.v1-camera` free of ambient DOM and delegated ripples.
- Map `.v1-shutter`, `.v1-shutter-ring`, and `.v1-shutter-core` to the `.glass-shutter` visual contract while retaining the current action and latch logic.
- Keep the progress pill at the top and shutter at the bottom so no glass plane crosses faces.
- Do not blur, saturate, tint, or transform the actual Live View except the existing mirror transform and aspect-correct crop behavior.
- Keep countdown typography large and plate-free. The digit may be translucent but must remain legible across the booth.
- Capture flash is state feedback only and cannot block camera events or pointer processing.

### Photo selection

- Map each tile to `.glass-card--photo`; the image itself stays opaque and color-accurate.
- A selected tile gets the 3 px primary edge plus a 40 px order badge. The badge number is the ordered selection index, not the shot index.
- When selection capacity is full, unselected tiles use `data-unavailable="true"` and reject additions; selected tiles remain actionable so they can be removed.
- Preserve 500 ms hold-to-preview and the existing full-screen dark lightbox. The lightbox image has no glass filter.
- On scroll movement over 12 px, cancel hold and allow vertical scrolling.
- Continue optimistic visual selection with authoritative backend reconciliation; liquid-glass feedback must not enqueue another business action.

### Layout/frame carousels

- Use native scroll snap and visible 64 px `.glass-button[data-size="icon"]` arrows.
- Centered-card scale is limited to `1.06`; adjacent cards remain at least `0.86` opacity so choices are recognizable.
- Drag is never the only navigation mechanism.
- Selection is communicated with `aria-pressed`, a primary border, and title color—not perspective alone.

### Sheets, action bars, and status surfaces

- Action bars use depth 3 only when floating; in-flow bars use depth 2.
- Error banners remain in flow and opaque enough for immediate reading. Do not render errors as translucent toast overlays over the main CTA.
- QR codes use a solid white backing and no glass/specular overlay.
- Payment, print, and recovery loading states keep the existing action gates and use text plus a visual indicator.

---

## 11. Implementation acceptance tests

1. **Palette:** computed core values exactly match `#FAF6F0`, `#1A1715`, `#D8C7B5`, `#F0DBD4`, and `#8E442D`.
2. **Target size:** no enabled customer action has a computed hit box below 56×56 CSS px; normal icon controls are 64×64 CSS px.
3. **1280×800:** all primary actions remain visible without scaling the application; photo and frame regions scroll internally where needed.
4. **1920×1200:** composition uses the gallery breakpoint and does not stretch cards beyond their content max widths.
5. **Windows scaling:** test 1920×1200 at 100%, 125%, and 150%; test 1280×800 at 100%, 125%, and 150% safety fallback.
6. **Press latency:** `data-pressed` and pointer coordinates are set in the originating pointer event; visual feedback appears by the next animation frame.
7. **Ripple lifecycle:** no more than two ripple nodes exist per surface, all are `aria-hidden`, and all are removed within 650 ms.
8. **Rapid tap:** ten rapid taps on a primary CTA or shutter invoke the existing action once while its local latch/busy state is active.
9. **Carousel:** swipe, arrow buttons, keyboard focus, and position text all reach the same enabled items; drag does not trigger an item click.
10. **Photo hold:** 500 ms hold opens preview; movement over 12 px cancels it; release closes it; the suppressed click does not toggle selection.
11. **Selection capacity:** an extra unselected image cannot be added at capacity, while a selected image can still be removed.
12. **Capture performance:** no backdrop filter or ambient animation covers Live View; the shutter visual never triggers or delays camera capture.
13. **Dynamic values:** capture total, countdown, and required selection total come only from current props/backend state.
14. **Reduced motion:** ripples, sheet motion, selection pop, ambient drift, and smooth carousel scrolling stop; all state remains understandable.
15. **Fallback:** with backdrop-filter support disabled, every surface becomes solid paper with readable borders.
16. **Forced colors:** controls retain visible 2 px boundaries, selected state uses system Highlight, and decorative layers disappear.
17. **Language overflow:** test localized labels at 130% string length; labels wrap to two lines without clipping or shrinking below target height.
18. **Workflow integrity:** no new visual component exposes back, cancel, confirm, capture, payment, or print behavior that is unavailable in the existing state machine.

---

## 12. Migration map for the frontend coder

| Existing selector/area | New reusable treatment |
|---|---|
| `.v1-panel`, `.v1-selection-print`, preview panels | `.glass-card`, elevation 2 |
| `.v1-actionbar` | `.glass-card`, elevation 2 or 3 |
| `.v1-secondary`, `.v1-back`, arrows, steppers | `.glass-button`, secondary tone |
| `.v1-primary` | `.glass-button`, primary tone and primary size |
| `.v1-modal` | `.glass-sheet` within `.glass-sheet-backdrop` |
| `.v1-photo-tile > button` | `.glass-card .glass-card--photo`, interactive |
| `.v1-shutter` and its ring/core | `.glass-shutter` and matching child elements |
| `liquidGlassFx.ts` hardcoded surface list | Prefer `[data-glass-interactive="true"]`, retaining legacy selectors during migration |

Migration is visual and incremental. Existing class names and action wiring may remain until screenshots, touch tests, reduced-motion tests, and state-machine regression tests pass.
