# LE SOUVENIR V2 — Premium Korean Editorial Design System

**Deliverable type:** design specification and Tailwind utility proposal only; this is not implementation or proof of a working UI.  
**Target:** public 16:10 Windows touch kiosk at 1920×1200 and 1280×800, with compact fallbacks for effective CSS viewports produced by 125% and 150% Windows scaling.  
**Authority boundary:** this document changes presentation only. Backend session phase, permitted Back/cancel behavior, layout-driven `shotCount`, `selectCount`, `countdownSeconds`, pricing, payment acceptance, print acceptance, revenue recognition, and delivery data remain authoritative. Never substitute design constants for backend values.

---

## 1. Visual identity

### 1.1 Direction: **Ivory Editorial Atelier**

LE SOUVENIR V2 should feel like a quiet Seoul portrait studio rather than a desktop dashboard: warm paper, matte ink, restrained champagne metal, one optional rose note, generous negative space, and photographs treated as artwork. Customer screens are composed as editorial spreads. The camera stage deliberately shifts to matte black so reflected kiosk light does not compete with faces.

Liquid glass is a **supporting material**, not the identity. Use it for controls, floating rails, modal/sheet surfaces, and selected cards over meaningful content. Do not stack translucent cards inside translucent cards; do not place glass behind QR modules, critical small text, or large areas with uncontrolled photographic contrast.

### 1.2 Principles

1. **Photography first:** live view and final compositions receive the largest visual area.
2. **One dominant decision:** each customer screen exposes only actions legal in the current backend phase.
3. **Editorial, not decorative:** serif display type and champagne details are sparse; body copy remains highly legible sans serif.
4. **Material honesty:** a print preview is contained at its real declared aspect ratio. A QR is opaque white. A glass surface is visibly bounded and has a solid fallback.
5. **Distance clarity:** countdown, failure, payment amount, and capture progress remain understandable from across the booth.
6. **Touch certainty:** every touch responds immediately, while side-effecting commands lock synchronously until an authoritative result.
7. **Truthful states:** rendering a QR is not payment; submitting a print is not physical completion; a mock preview is not camera proof.

### 1.3 Explicit exclusions

- No generic neon/AI gradients, glass dashboard grids, glowing data widgets, or parallax.
- No pure-white body text on pale champagne/rose accents without verified contrast.
- No fabricated customer portraits, fake PayOS QR, fake Cloudinary URL, fake device-ready state, or fake print percentage.
- No mouse-hover-only disclosure or action in customer flow.
- No fixed customer-flow numbers for capture total, selection quota, countdown, quantity, price, or timeout.
- No bundled font files assumed or shared by this design deliverable.

---

## 2. Color system

### 2.1 Brand primitives

| Token | Value | Intended use |
|---|---:|---|
| `ivory-50` | `#FFFDFC` | QR surround contrast edge, lightest highlight |
| `ivory-100` | **`#FAF7F2`** | canonical customer canvas |
| `ivory-200` | `#F2ECE4` | solid glass fallback, secondary surface |
| `ivory-300` | `#E7DED2` | warm divider on light surfaces |
| `ink-950` | **`#1A1A1A`** | canonical matte-black primary text and dark stage |
| `ink-800` | `#34312F` | secondary dark surface |
| `ink-700` | `#4A4541` | body/supporting text on ivory |
| `ink-600` | `#625B56` | muted text where AA is retained |
| `champagne-400` | **`#D4C4A8`** | brand accent, focus ring, selection detail |
| `champagne-600` | `#8A7350` | large accent/icon on ivory; use `champagne-700` for normal text |
| `champagne-700` | `#6B583D` | pressed accent / high-contrast accent ink |
| `rose-200` | **`#E8C5B8`** | optional soft-rose wash or decorative chip |
| `rose-700` | `#854D40` | accessible rose text and status detail |
| `white` | `#FFFFFF` | QR quiet zone, photographic paper only |

The four required signature values are fixed: warm ivory `#FAF7F2`, matte black `#1A1A1A`, champagne `#D4C4A8`, and soft rose `#E8C5B8`. Darker companions exist because pale champagne and rose do not meet WCAG AA for normal text on ivory.

### 2.2 Semantic light-theme tokens

| Semantic token | Value | Rule |
|---|---:|---|
| `color.canvas` | `#FAF7F2` | default viewport |
| `color.surface` | `#FFFDFC` | opaque raised surface / form field |
| `color.surface.subtle` | `#F2ECE4` | secondary region / no-blur fallback |
| `color.surface.glass` | `rgba(255,255,255,0.12)` | use only over controlled light backdrops |
| `color.surface.glassStrong` | `rgba(255,255,255,0.15)` | modal/sheet light glass layer |
| `color.text.primary` | `#1A1A1A` | headings, key instructions |
| `color.text.secondary` | `#4A4541` | body copy |
| `color.text.muted` | `#625B56` | metadata; never essential information alone |
| `color.text.inverse` | `#FAF7F2` | text on matte black |
| `color.border` | `rgba(26,26,26,0.16)` | default hairline |
| `color.border.strong` | `rgba(26,26,26,0.34)` | fields, selected/disabled boundary |
| `color.accent` | `#D4C4A8` | fill/detail, not normal text |
| `color.accent.ink` | `#6B583D` | accessible accent text/icon |
| `color.accent.soft` | `#E8C5B8` | optional decorative wash |
| `color.focus` | `#D4C4A8` | 3px focus ring; add dark/ivory offset by context |
| `color.error` | `#A43D36` | error text/icon on light surface |
| `color.error.surface` | `#F7E7E4` | error wash |
| `color.success` | `#2F7358` | success text/icon on light surface |
| `color.success.surface` | `#E4F0E9` | success wash |
| `color.warning` | `#7A571A` | warning text/icon |
| `color.warning.surface` | `#F5EBD6` | warning wash |
| `color.disabled.text` | `#6E6964` | disabled label, with additional icon/copy |
| `color.disabled.surface` | `#E6E0D9` | disabled control background |
| `color.scrim` | `rgba(10,9,8,0.58)` | modal scrim |

### 2.3 Camera-stage tokens

| Semantic token | Value | Rule |
|---|---:|---|
| `camera.canvas` | `#0D0D0D` | outer capture stage |
| `camera.surface` | `rgba(26,26,26,0.88)` | opaque-enough control rail fallback |
| `camera.glass` | `rgba(255,255,255,0.10)` | camera glass control, blur 16px |
| `camera.text` | `#FAF7F2` | primary inverse copy |
| `camera.textMuted` | `#D8D1C8` | secondary inverse copy |
| `camera.guide` | `rgba(250,247,242,0.84)` | crop guide; never encode status alone |
| `camera.focus` | `#D4C4A8` | focus ring with matte-black offset |

### 2.4 QR exception

Payment and delivery QR pixels sit on an **opaque `#FFFFFF` quiet zone** with no `backdrop-filter`, transparency, texture, tint, blend mode, or shadow across the encoded area. The outer shell may be glass; reserve a stable square before QR load so loading → QR causes zero layout shift.

### 2.5 High-contrast mode

The operator-accessible high-contrast toggle sets a root preference such as `data-contrast="high"`. It must persist through the approved settings mechanism and affect customer UI on the next safe render/session according to architecture policy.

| Token | High-contrast value |
|---|---:|
| canvas / light surface | `#FFFFFF` |
| primary and secondary text | `#000000` |
| borders | `#3A3A3A` at 2px |
| dark stage | `#000000` |
| inverse text | `#FFFFFF` |
| focus | `#8A5A00` on light, `#FFE4A3` on dark |
| glass | replace blur/transparency with opaque white or black |
| selected | 3px border + check/ordinal + label; never color alone |

Do not infer Windows forced-colors behavior from this preference. Also provide `@media (forced-colors: active)` proposals using system colors (`Canvas`, `CanvasText`, `ButtonFace`, `ButtonText`, `Highlight`) and allow the OS to override shadows and gradients.

---

## 3. Liquid glass material

### 3.1 Material recipe

Liquid glass should combine five layers:

1. **Backdrop diffusion:** `backdrop-filter: blur(12px–20px) saturate(112%–125%)`.
2. **Low-opacity fill:** white or matte-black alpha **0.08–0.15**.
3. **Specular highlight:** restrained linear highlight along the upper edge, never a full-page gradient.
4. **1px inner glow:** inset white or champagne line that remains visible on touch displays.
5. **Depth separation:** one ambient shadow and a z-layer; no excessive glow.

Use at most two glass elevations on one customer screen. If the content behind the glass is visually busy, increase the **solid fallback tint**, not the blur indefinitely.

### 3.2 Glass tokens

| Token | Compact | Wide | Use |
|---|---:|---:|---|
| `glass.blur.soft` | 12px | 14px | small button/chip |
| `glass.blur.base` | 16px | 16px | card/control rail |
| `glass.blur.strong` | 18px | 20px | modal/sheet only |
| `glass.fill.light` | `rgba(255,255,255,.12)` | same | ivory-stage card |
| `glass.fill.lightStrong` | `rgba(255,255,255,.15)` | same | sheet/modal |
| `glass.fill.dark` | `rgba(18,18,18,.12)` | same | dark-stage rail |
| `glass.rim` | `rgba(255,255,255,.52)` | same | 1px top/rim line |
| `glass.inner` | `inset 0 1px 0 rgba(255,255,255,.50)` | same | inner glow |
| `glass.shadow.1` | `0 8px 24px rgba(26,26,26,.08)` | `0 10px 30px rgba(26,26,26,.09)` | card |
| `glass.shadow.2` | `0 18px 48px rgba(26,26,26,.14)` | `0 24px 64px rgba(26,26,26,.16)` | modal/sheet |

### 3.3 Proposed Tailwind utilities

These are utility proposals for a future Tailwind layer; they are not implementation code. Names intentionally describe material semantics instead of encoding a screen name.

| Utility proposal | Declaration intent |
|---|---|
| `glass-surface` | `relative isolate overflow-hidden bg-white/[.12] backdrop-blur-[16px] backdrop-saturate-[1.18] border border-white/50 shadow-[0_8px_24px_rgba(26,26,26,.08),inset_0_1px_0_rgba(255,255,255,.50)]` |
| `glass-surface-strong` | `bg-white/[.15] backdrop-blur-[20px] backdrop-saturate-[1.22] border-white/60 shadow-[0_24px_64px_rgba(26,26,26,.16),inset_0_1px_0_rgba(255,255,255,.58)]` |
| `glass-surface-dark` | `bg-black/[.12] backdrop-blur-[16px] backdrop-saturate-[1.12] border-white/20 shadow-[0_12px_32px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.18)]` |
| `glass-specular` | add a non-interactive `before:` upper-edge highlight: `before:absolute before:inset-x-[8%] before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent` |
| `glass-card` | `glass-surface rounded-[24px]` compact; `rounded-[28px]` wide |
| `glass-button` | `glass-surface glass-specular min-h-touch rounded-full` with pressed/focus/disabled states |
| `glass-sheet` | `glass-surface-strong rounded-t-[32px]` or side-sheet `rounded-l-[32px]` |
| `glass-modal` | `glass-surface-strong rounded-[28px]` on `bg-black/60` scrim |
| `glass-fallback` | under `@supports not (backdrop-filter: blur(1px))`: opaque `#F2ECE4` on light, `#1A1A1A` on dark |

**Fallback requirement:** every proposed glass utility must have an opaque base color before the `@supports` enhancement. Text contrast is assessed against that opaque base and the worst allowed backdrop, not against an ideal screenshot.

### 3.4 Depth and z-index

| Token | Value | Content |
|---|---:|---|
| `z.base` | 0 | canvas and photography |
| `z.cropGuide` | 10 | noninteractive guides |
| `z.chrome` | 20 | header, progress, action dock |
| `z.sheet` | 40 | customer sheet / lightbox |
| `z.modalScrim` | 60 | modal scrim |
| `z.modal` | 70 | modal / PIN entry |
| `z.toast` | 80 | operator/customer status announcement |
| `z.system` | 100 | backend disconnect/out-of-service lock |

Never place an actionable layer below a noninteractive overlay that can intercept touches. Decorative pseudo-elements use `pointer-events:none`.

---

## 4. Typography

### 4.1 Font families and fallback policy

| Role | Preferred family | Fallback stack | Rules |
|---|---|---|---|
| Korean/Vietnamese/UI sans | **Pretendard** or **Noto Sans KR** | `"Noto Sans KR", "Segoe UI", Arial, sans-serif` | Primary interface; use only fonts available under approved app/deployment licensing. No font files are supplied here. |
| Editorial Latin display | **Playfair Display** or **Cormorant Garamond** | Georgia, `"Times New Roman"`, serif | Wordmark, short Latin accent, large marketing title only. Never use for dense instructions, money, countdown, or status. |
| Numeric | UI sans | same as sans | enable `font-variant-numeric: tabular-nums lining-nums` for countdown, price, progress, timers. |

If the preferred web fonts are unavailable offline, fall back immediately to installed/system fonts; layout must not depend on a late font swap. Validate Vietnamese diacritics and Hangul in the actual packaged WebView. Never synthesize thin weights below 400 on kiosk screens.

### 4.2 Fluid type tokens

The middle term uses viewport width but values are constrained so both target displays remain legible. Height-compaction is handled by responsive layout, not by shrinking critical text below its minimum.

| Token | Proposed CSS value | Weight / line height | Use |
|---|---|---|---|
| `type.display-xl` | `clamp(52px, 4.2vw, 80px)` | sans 650–750 / 1.02 | Welcome headline |
| `type.display-serif` | `clamp(32px, 2.6vw, 50px)` | serif 500 / 1.05 | short editorial Latin accent |
| `type.screen-title` | `clamp(30px, 2.3vw, 44px)` | sans 650 / 1.12 | screen title |
| `type.section` | `clamp(22px, 1.55vw, 30px)` | sans 650 / 1.2 | panel/section heading |
| `type.body-lg` | `clamp(18px, 1.15vw, 22px)` | sans 450 / 1.5 | primary instruction |
| `type.body` | `clamp(16px, 1vw, 20px)` | sans 400 / 1.5 | body text |
| `type.label` | `clamp(14px, .84vw, 17px)` | sans 600 / 1.25 | button/field labels |
| `type.meta` | `clamp(13px, .73vw, 15px)` | sans 500 / 1.35 | noncritical metadata |
| `type.price` | `clamp(40px, 3.2vw, 64px)` | sans 700 / 1.0 | canonical payment total |
| `type.countdown` | `clamp(144px, 17vw, 300px)` | sans 800 / .88 | cross-booth countdown |
| `type.progress` | `clamp(18px, 1.25vw, 24px)` | sans 650 / 1.1 | capture and selection progress |
| `type.button-primary` | `clamp(18px, 1.15vw, 22px)` | sans 650 / 1 | main action |

### 4.3 Copy and overflow rules

- Customer headings: maximum two lines; preserve natural sentence case in Vietnamese/Korean.
- Buttons: one line at target viewports; if localized text grows, expand width or use approved shorter copy—never reduce below 16px.
- Descriptions: maximum three lines on compact customer screens; operator detail can scroll within a bounded region.
- Names from backend: wrap safely with `overflow-wrap:anywhere`; do not expose raw IDs as fallback customer labels.
- Prices, timers, and fractions: no wrapping; use tabular figures.
- Avoid all-caps paragraphs and wide letter spacing on Hangul.
- Screen reader names describe outcome, e.g. “Chọn bố cục [name]” or “Ảnh [label], đã chọn ở vị trí [order]”; visible shorthand must not be the only accessible label.

---

## 5. Spacing, geometry, radii, and elevation

### 5.1 Spacing scale

The base unit is **4 CSS px**. Structural layout aligns to an **8px grid**; 4px increments are reserved for optical adjustment and compact label gaps.

| Token | px | Typical use |
|---|---:|---|
| `space-0` | 0 | reset |
| `space-1` | 4 | optical/icon gap only |
| `space-2` | 8 | grid unit, tight gap |
| `space-3` | 12 | minimum separation between adjacent touch targets |
| `space-4` | 16 | control internal gap |
| `space-5` | 20 | compact padding |
| `space-6` | 24 | card padding compact |
| `space-8` | 32 | section gap compact |
| `space-10` | 40 | wide card padding |
| `space-12` | 48 | shell inset compact / section gap wide |
| `space-16` | 64 | shell inset wide |
| `space-20` | 80 | hero rhythm |
| `space-24` | 96 | major separation |

### 5.2 Touch target tokens

| Token | Size | Requirement |
|---|---:|---|
| `touch.minimum` | **48×48px** | absolute minimum for any enabled control |
| `touch.comfort` | **56×56px** | default secondary/back/icon control |
| `touch.primary` | 64–72px high | customer primary action |
| `touch.shutter` | 104–120px diameter | capture initiation |
| `touch.spacing` | ≥12px | active bounds between adjacent actions |

Icon artwork may be 20–28px while its hit area remains the target size. Cards are wholly tappable; never make only text or a checkmark active.

### 5.3 Radii

| Token | Value | Use |
|---|---:|---|
| `radius.sm` | 10px | QR paper edge / small image |
| `radius.md` | 16px | field, thumbnail |
| `radius.lg` | 24px | glass card |
| `radius.xl` | 32px | sheet/modal |
| `radius.pill` | 9999px | buttons, progress chips |

Photo/print corners follow source artwork. Do not round a print preview so aggressively that it changes the perceived print boundary.

### 5.4 Elevation

| Token | Value | Use |
|---|---|---|
| `shadow.hairline` | `0 0 0 1px rgba(26,26,26,.12)` | opaque surface boundary |
| `shadow.control` | `0 6px 18px rgba(26,26,26,.08)` | button/chip |
| `shadow.card` | `0 12px 34px rgba(26,26,26,.10)` | card |
| `shadow.paper` | `0 22px 50px -18px rgba(26,26,26,.30), 0 5px 14px rgba(26,26,26,.14)` | physical print preview |
| `shadow.modal` | `0 28px 80px rgba(26,26,26,.24)` | modal/sheet |

---

## 6. Layout architecture

### 6.1 Kiosk shell

- Root: `width:100%; height:100dvh; overflow:hidden; box-sizing:border-box`.
- Customer shell uses a stable three-zone budget: header, content (`min-height:0`), action/footer.
- No whole-page customer scroll. Dynamic grids/carousels may scroll inside bounded regions with visible edge fades, explicit arrow/page controls, `overscroll-behavior:contain`, and no scroll chaining.
- Use CSS viewport/container dimensions, not physical-pixel or DPI guesses. Windows scaling can turn a 1920×1200 display into an effective 1536×960 or 1280×800 CSS viewport; a 1280×800 display can become approximately 1024×640 or 853×533.
- At effective heights below 600px, compress decorative imagery and spacing first. Keep touch targets and payment/print gates visible. If safe layout cannot fit at approximately 853×533, show a truthful operator-facing unsupported-display notice rather than clipping actions.

### 6.2 Customer composition patterns

1. **Editorial split:** 54/46 or 58/42; photography/preview receives the larger column.
2. **Centered gallery:** carousel centered with visible side peeks and explicit arrows.
3. **Camera stage:** live view occupies at least 70% of available width at reference sizes; progress/control rail sits outside the facial safe area.
4. **Decision grid:** preview plus bounded thumbnail/control region; action dock is stable and does not cover content.
5. **System state:** calm centered notice, one recovery action only if the backend exposes a legal action.

### 6.3 Media aspect rules

- Live View: fit source without stretching; mirror/rotate only from authoritative camera metadata or established parity rule. Keep crop guide separate from source image.
- Thumbnail: `cover` is allowed when a full-image preview is available and crop is nonauthoritative.
- Captured-photo lightbox: `contain`.
- Frame PNG and final composition: `contain`, preserve alpha and declared aspect.
- Print preview: use backend-generated preview when available; do not reconstruct print geometry in CSS.
- QR: square 1:1, opaque white quiet zone.
- Missing asset: neutral illustrated placeholder labeled as unavailable; never substitute stock customer imagery.

---

## 7. Motion and feedback

### 7.1 Motion tokens

| Token | Duration | Easing | Use |
|---|---:|---|---|
| `motion.instant` | 80ms | `cubic-bezier(.2,.8,.2,1)` | press compression |
| `motion.fast` | 150ms | `cubic-bezier(.2,.8,.2,1)` | check/ring/color feedback |
| `motion.base` | 200ms | `cubic-bezier(.16,1,.3,1)` | card/sheet state |
| `motion.slow` | 250ms | `cubic-bezier(.16,1,.3,1)` | screen handoff/modal |
| `spring.touch` | stiffness 500, damping 34, mass .7 | Motion One / Framer Motion conceptual token | release recovery only |

Allowed ranges are **150–250ms** for state transitions and 80–120ms for physical press feedback. Avoid a long animated exit before dispatching an action; command dispatch and lock happen immediately, animation follows.

### 7.2 Motion behaviors

- Screen entrance: opacity 0→1 and translateY 8px→0 over 200–250ms.
- Screen exit: 150ms fade only after phase change is authoritative.
- Touch press: scale to .97 (`.94` only for large circular shutter), darken/rim change in the same frame; spring back on release.
- Selection: border/check/ordinal appears within 150ms; selected content does not bounce around the grid.
- Carousel: horizontal snap 220–250ms; drag itself tracks finger 1:1. Explicit arrows duplicate swipe behavior.
- Countdown: numeral crossfade/scale ≤200ms; backend numeral is source of truth. Poll gaps do not synthesize missing numbers.
- Capture flash: optional 80–160ms visual layer, nonblocking and not claimed as shutter synchronization.
- No parallax, autoplay card drift, perpetual pulsing over faces, or animation of the live video element.

### 7.3 Reduced motion

Under `prefers-reduced-motion: reduce`:

- Set travel and spring transitions to 0–80ms fades.
- Disable carousel smooth scrolling, ripple expansion, countdown scaling, decorative flash, and attract-loop cross-pan.
- Preserve immediate pressed outline, state labels, progress changes, and modal visibility.
- Never remove an essential timeout/countdown number; only remove its animation.

### 7.4 Haptics and sound

- Haptics may be requested only if an approved host capability exists; use a brief nonblocking pulse for accepted selection/shutter press.
- No flow depends on vibration. Do not emulate haptics by blocking timers.
- Audio cues follow backend/capture timing contracts. Visual animation must not delay or trigger capture.

---

## 8. Touch optimization and input safety

### 8.1 Immediate feedback

The visible press response starts on `pointerdown` and targets **<16ms** (next frame). It is visual only until activation conditions succeed.

Proposed state recipe:

- Rest: clear border, stable label.
- Pressed: scale .97 + 1px darker rim + localized radial highlight/ripple clipped to control.
- Activated: persistent check/ordinal/progress text.
- Pending: retain label, add inline spinner/status, disable duplicate activation.
- Disabled: opaque disabled fill, lock/unavailable icon, explanatory text when not obvious; opacity alone is insufficient.

Ripple duration is 180–240ms, alpha ≤.12, and is disabled under reduced motion. It must never obscure QR pixels or live faces.

### 8.2 Gesture rules

- Buttons/cards: `touch-action: manipulation`.
- Horizontal photo/layout carousel track: `touch-action: pan-x`; vertical page movement remains disabled in the shell.
- Crop surface only: controlled `touch-action:none` while the crop editor is active; do not apply globally.
- Swipe is optional enhancement, never sole navigation. Provide 56px arrows, visible page/position, and direct thumbnails where appropriate.
- Drag threshold: about 12px before a tap becomes a swipe/pan. `pointercancel` always clears pressed/hold state.
- Long press: reserved for hidden admin/staff discovery only; recommended hold 1000ms, movement tolerance <12px. It reveals an authentication surface, never grants access or confirms cash by itself.
- Touch-and-hold on ordinary buttons must not repeatedly fire, select text, open a browser context menu, or repeat steppers unless a separately approved repeat behavior exists. Quantity controls default to one change per completed tap.

### 8.3 Double-tap and ghost-touch defense

- Side-effecting customer actions lock synchronously on accepted activation: payment staff confirmation, capture sequence start, selection confirm, frame confirm/advance, Confirm & Print, Finish.
- A second pointer event while command pending is ignored and receives a visible “Đang xử lý” state.
- Never debounce by delaying the first command; send the first command once and reconcile its result.
- On direct-advance selection, arm destructive controls on the destination only after the incoming pointer sequence has ended and a short input-safe window has elapsed, per approved architecture. Do not allow a second tap to pass through into Confirm & Print.
- Stale responses are ignored by session/generation identity; no UI animation may replay an uncertain payment/print/capture action.

### 8.4 Back, cancel, and timeout

- Render Back only on phases where the authoritative session contract permits it. Do not turn Back into an unrestricted cancellation.
- Customer cancellation is exposed only where the current V1 business rules allow it and retains destructive confirmation.
- Timeout display uses backend remaining time. Frontend does not restart or reinterpret timers without an approved event.
- Selection/frame timeout follows the existing backend auto-selection/auto-print behavior and must not be relabeled “returning home.” The distinction between manual confirm and timeout remains visible to backend revenue logic.
- Delivery auto-return may be shown only when an authoritative configured timer/event exists; do not invent a fixed timeout.

---

## 9. Accessibility

### 9.1 Contrast

- Normal text: WCAG AA **≥4.5:1**.
- Large text: ≥3:1, though key instructions target 4.5:1.
- Control boundaries, focus indicators, selected states, and icons: ≥3:1 against adjacent colors.
- Pale champagne `#D4C4A8` and soft rose `#E8C5B8` are decorative fills on ivory, not normal-text colors. Use `champagne-700` / `rose-700` for text.
- Glass text is tested against the worst permitted fallback/backdrop. If contrast is unstable, add an opaque underlay or switch to a solid surface.

### 9.2 Focus

- Every interactive element has a **3px champagne focus ring**.
- Light surface recipe: 3px `#D4C4A8` ring plus 2px `#1A1A1A` outer/offset boundary when needed for ≥3:1 contrast.
- Dark surface recipe: 3px `#D4C4A8` plus 2px matte-black offset.
- `:focus-visible` is required; do not suppress programmatic/operator keyboard focus. Touch pressed state remains separate.
- Modal focus is trapped; closing returns focus to the invoking control where it still exists.

### 9.3 Semantics and announcements

- One top-level heading per screen and ordered section headings.
- Icon-only controls receive localized accessible names.
- Selection cards expose role, selected state, disabled state, and ordinal if order matters.
- Loading status uses `role=status` / polite announcements; irreversible errors use an alert. Throttle capture progress announcements so screen readers do not announce live frames or every poll.
- Decorative images have empty alternative text; captured images use customer-safe labels, never filesystem paths.
- Live View has a concise label (“Xem trước trực tiếp từ camera”) but is not announced on every frame.
- Countdown numeral uses a controlled live region no more than once per authoritative change.
- QR receives purpose text and, only if safe, an accessible destination description—not secret payload or access token.

### 9.4 Nonvisual and color-independent state

- Selected: border + check/ordinal + text.
- Error/success: icon + title + detail, not red/green alone.
- Disabled: disabled semantics + reason where necessary.
- Progress: text fraction/status in addition to ring/bar.
- Swipe/carousel: explicit previous/next controls and current position.

---

## 10. Proposed Tailwind token map

This table is a naming handoff, not a configuration file.

| Tailwind namespace proposal | Values / aliases |
|---|---|
| `colors.ivory` | `50 #FFFDFC`, `100 #FAF7F2`, `200 #F2ECE4`, `300 #E7DED2` |
| `colors.ink` | `950 #1A1A1A`, `800 #34312F`, `700 #4A4541`, `600 #625B56` |
| `colors.champagne` | `400 #D4C4A8`, `600 #8A7350`, `700 #6B583D` |
| `colors.rose` | `200 #E8C5B8`, `700 #854D40` |
| `colors.semantic` | error `#A43D36`, success `#2F7358`, warning `#7A571A` |
| `spacing.touch` | `48px` |
| `spacing.touch-comfort` | `56px` |
| `spacing.touch-primary` | `64px` |
| `spacing.shutter` | `112px` |
| `borderRadius.glass` | `24px` |
| `borderRadius.sheet` | `32px` |
| `boxShadow.paper` | paper token in §5.4 |
| `fontFamily.sans` | Pretendard / Noto Sans KR / Segoe UI fallback stack |
| `fontFamily.editorial` | Playfair Display / Cormorant Garamond / Georgia fallback stack |
| `transitionDuration.kiosk-fast/base/slow` | `150ms / 200ms / 250ms` |
| `transitionTimingFunction.editorial` | `cubic-bezier(.16,1,.3,1)` |

Suggested semantic utility names: `bg-canvas`, `bg-surface`, `text-primary`, `text-secondary`, `text-accent-ink`, `border-subtle`, `ring-focus`, `min-h-touch`, `min-h-touch-comfort`, `min-h-touch-primary`, `font-editorial`, `tabular-nums`, `shadow-paper`, `motion-safe:kiosk-enter`, `motion-reduce:transition-none`.

---

## 11. Design-system acceptance checklist

- [ ] Warm ivory, matte black, champagne, and optional rose are applied through semantic tokens, not scattered hex values.
- [ ] Every text/color pair meets AA; pale accents are not used as small text.
- [ ] Glass uses 12–20px blur, .08–.15 fill, specular edge, 1px inner glow, bounded depth, and an opaque fallback.
- [ ] QR encoded areas are fully opaque white and stable in size.
- [ ] Customer controls are ≥48px, default to 56px, and primary actions are 64–72px high with ≥12px separation.
- [ ] Press feedback appears in the next frame; command locking prevents repeated side effects.
- [ ] No hover-only action, swipe-only navigation, parallax, or animated live-video transform exists.
- [ ] Typography survives no-font/offline fallback, Hangul, Vietnamese diacritics, and long localized copy.
- [ ] Countdown remains cross-booth legible and all count/timing labels come from authoritative data.
- [ ] `prefers-reduced-motion`, high-contrast preference, forced colors, visible focus, and screen-reader labels are specified.
- [ ] Layout is tested at 1920×1200 and 1280×800 plus effective compact CSS viewports caused by 125/150% scaling.
- [ ] This document is treated as a proposal/specification—not as hardware, payment, printer, or working-UI evidence.

---

## 12. Source-grounding note

Screen flow and safety boundaries were cross-checked against V2 audit documents derived from read-only V1 inspection, notably `V1_EXACT_UI_FLOW_MAP.md`, `V1_ACTION_BEHAVIOR_MATRIX.md`, `04_SESSION_STATE_MACHINE.md`, `08_PAYMENT_REVENUE_QR_CLOUD_AUDIT.md`, `UI_SCREEN_INVENTORY.md`, `UI_SCREEN_CONTRACTS.md`, `UI_CAMERA_CONSTRAINTS.md`, and `UI_PRINT_CONSTRAINTS.md`. V1 was not modified. Any conflict about backend behavior is resolved in favor of the architect-approved state/event contract, not this visual document.
