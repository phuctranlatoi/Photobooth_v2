# LE SOUVENIR V2 — Korean Photo Atelier Design Specification

**Status:** Unboxed Atelier & Liquid Glass visual system fully mounted and verified across customer screens; **simulated desktop journey accepted** across 1280×800 and 1920×1200 viewports (`tests/journey-evidence/2026-11-05T02-34-00.652Z/results.json`, 0 failures, 26 screenshots). Sub-10ms touch response, unboxed photographic canvas, genuine liquid glass controls, deferred composition, concentric shutter button, and zero QR layout shift verified. Physical Canon DSLR and DNP printer hardware gates remain gated.

---

## 1. Unboxed Atelier & Liquid Glass Foundations

The LE SOUVENIR V2 visual system is inspired by upscale modern Korean photo studios (Seoul Seongsu/Hannam atelier aesthetic). The **Unboxed Atelier** design philosophy strips away heavy, opaque white card containers (`.v1-panel`, `.v1-start-card`, `.v1-summary`, `.v1-quantity-pricing`, `.v1-prepare-stage`, `.v1-print-stage`, `.v1-delivery`, `.v1-frame-preview-panel`) across all customer-facing stages. Photographs and print layouts float as authentic physical paper directly over a warm ambient ivory canvas, while UI chrome recedes into genuine liquid glass controls with heavy optical refraction.

### 1.1 Unboxed Customer Shell Tokens (`.v1-shell.atelier-customer`)

| Design Token | CSS / Hex Value | Role & Applied Context | Contrast / Accessibility |
|---|---|---|---|
| `--at-canvas` | `#F6F1EA` | Base ivory studio canvas | Soft non-glare warm ivory surface |
| `--at-canvas-light` | `#FBF8F3` | Elevated light tone for paper accents | Pure photographic baseline |
| `--at-ink` | `#24201D` | Primary headings, titles, price totals, action labels | High contrast (≥ 11:1 on ivory canvas) |
| `--at-secondary` | `#514842` | Subtitles, step descriptions, receipt item labels | Contrast ≥ 5.2:1 on canvas |
| `--at-muted` | `#645950` | Metadata labels, unit prices, captions | Subdued secondary information |
| `--at-hairline` | `rgba(89, 65, 49, 0.19)` | Delicate dividers for unboxed receipt/summary rows | Subtle structural separation without boxing |
| `--at-coral-1` | `#C27357` | Primary CTA gradient start, active badges | Brand salon terracotta accent |
| `--at-coral-2` | `#A85A40` | Primary CTA gradient midpoint, border accents | Deep terracotta-coral body |
| `--at-coral-3` | `#8E442D` | Primary CTA gradient bottom edge, active depth | Rich terracotta anchor |
| `--at-glass` | `rgba(255, 255, 255, 0.65)` | Translucent refractive glass fill (secondary, back, stepper, dock) | Requires `backdrop-filter: blur(24px) saturate(180%)` |
| `--at-glass-rim` | `rgba(255, 255, 255, 0.85)` | Specular edge reflection around glass elements | Creates tangible physical boundary |
| `--at-glass-shadow` | `0 6px 18px rgba(45, 30, 20, 0.06)` | Soft ambient shadow beneath glass buttons | Grounded without darkening the canvas |
| `--at-paper-shadow` | `0 22px 38px -13px rgba(44,30,23,.26), 0 5px 11px rgba(44,30,23,.13)` | Deep photorealistic dual drop shadow for floating prints | Distinct paper elevation in open space |
| Ambient Light Gradient | `radial-gradient(ellipse 48% 63% at 77% 46%, rgba(214,178,150,.19), transparent 86%), #F6F1EA` | Background applied to customer shell (`.atelier-customer`) | Creates a shallow, warm atmospheric glow behind artwork |
| Darkroom Obsidian | `#121214` (matte obsidian) | Live View capture screen (`.v1-capture-screen`, `.v1-camera`) | Eliminates screen flare in camera lens |

---

## 2. Genuine Liquid Glass Controls

Interactive controls are engineered with genuine optical glass characteristics rather than generic translucent boxes:

### 2.1 Primary Pill CTA (`.v1-primary`)
- **Dimensions & Shape:** Minimum height **68px** (up to 72px), full pill border-radius (`9999px`), ample horizontal padding.
- **Core Gradient:** `linear-gradient(135deg, #C27357 0%, #A85A40 50%, #8E442D 100%)`.
- **Specular Rim:** Deep terracotta border `1px solid #793924` with top-edge specular light catch `inset 0 1.5px 2px rgba(255, 255, 255, 0.45)`.
- **Radiant Shadow:** `0 8px 24px rgba(168, 90, 64, 0.35)`.
- **Active Press:** Compresses to `transform: scale(0.96); filter: brightness(0.96)` over 190ms `cubic-bezier(0.2, 1.3, 0.3, 1)`.

### 2.2 Refractive Glass Secondary & Back Buttons (`.v1-secondary`, `.v1-back`, Stepper)
- **Dimensions:** Back button **56×56px** circle; Quantity stepper buttons **72×72px** tactile touch targets; secondary buttons **56px** minimum height.
- **Refraction Body:** Translucent fill `rgba(255, 255, 255, 0.65)` with heavy optical diffusion `-webkit-backdrop-filter: blur(24px) saturate(180%)` and `backdrop-filter: blur(24px) saturate(180%)`.
- **Dual Specular Rims:** Outer crisp reflection `1px solid rgba(255, 255, 255, 0.85)` + inner light catch `inset 0 1.5px 2px rgba(255, 255, 255, 0.95)`.
- **Shadow:** Grounded with `0 6px 18px rgba(45, 30, 20, 0.06)`.
- **Active Touch:** Compresses to `transform: scale(0.94)` on finger contact.
- **Fall-Back:** Gracefully degrades to `#F2EBE4` on browsers/environments lacking backdrop-filter support.

### 2.3 Floating Actionbar Dock (`.v1-actionbar`)
- Floating frosted glass dock (`border-radius: 28px`), `backdrop-filter: blur(24px) saturate(180%)`, border `1px solid rgba(255, 255, 255, 0.85)`, inner highlight `inset 0 1.5px 2px rgba(255, 255, 255, 0.95)`, and soft elevated drop shadow `0 10px 26px rgba(45, 30, 20, 0.08)`.
- Pinned at the bottom of the viewport with a fluid gap, housing primary and secondary actions without visual clutter.

---

## 3. Unboxed Typography & Clean Spatial Hierarchy

Typography is built on the native Windows/Chromium system font stack (`system-ui, "Segoe UI", -apple-system, BlinkMacSystemFont, "Noto Sans", sans-serif`) with Georgia serif accents, ensuring zero latency, zero FOUT/FOIT, and pristine rendering of all Vietnamese diacritics.

### 3.1 Unboxed Type Hierarchy

| Hierarchy Level | Font Size (Fluid / Responsive) | Weight / Style | Line Height | Letter Spacing | Applied Elements |
|---|---|---|---|---|---|
| Atelier Brand Trigger | `clamp(18px, 1.8vw, 24px)` | 700 / Georgia Serif | 1.0 | `+0.06em` | Hidden 5-tap operator wordmark |
| Welcome Hero Headline | `clamp(42px, 4.7vw, 82px)` | 800 / Segoe UI | 1.08 | `-0.045em` | Welcome greeting ("Chụp ảnh lấy ngay") |
| Editorial Italic Accent | `clamp(26px, 2.7vw, 48px)` | Italic 400 / Georgia Serif | 1.0 | `-0.02em` | Decorative flourish ("Yours forever.") |
| Screen Title | `clamp(24px, 2.2vw, 32px)` | 700 / Segoe UI | 1.20 | `-0.02em` | Main screen header title (`Heading`) |
| Section Header | `clamp(20px, 1.8vw, 26px)` | 600 / Segoe UI | 1.25 | `-0.01em` | Panel headings ("Đơn hàng", "Số lượng") |
| Step Eyebrow | `12px` / `clamp(11px, 1vw, 13px)` | 600 / Segoe UI | 1.0 | `+0.08em` | Subdued step badge ("BƯỚC 1", "BƯỚC 2") |
| Unboxed Receipt Rows | `clamp(15px, 1.2vw, 18px)` | 400 / 600 | 1.40 | `0` | Quantity and confirm detail lines |
| Tabular Numbers | `18px` – `34px` (`tabular-nums`) | 700 / Segoe UI | 1.0 | `-0.01em` | Stepper quantity (34px), timers, prices |
| Big Countdown | `clamp(140px, 20vw, 240px)` | 900 / Segoe UI | 1.0 | `-0.03em` | Live camera shutter countdown (centered) |

### 3.2 Unboxed Receipts & Order Summaries
- `.v1-quantity-pricing` and `.v1-summary` render with `background: transparent; border: 0; box-shadow: none`.
- Summary rows are separated solely by delicate hairline dividers (`border-bottom: 1px solid var(--at-hairline)`).
- Final totals are highlighted by an upper hairline divider (`border-top: 1px solid var(--at-hairline); padding-top: 16px`) and bold tabular figures, eliminating the need for opaque receipt cards.

---

## 4. Floating Paper Elevation & Photographic Canvas

Unlike legacy UI patterns that encase photos in heavy plastic white cards, the Unboxed Atelier aesthetic presents prints as physical photo paper floating gracefully over the studio canvas:

1. **Photorealistic Drop Shadows:**
   - Floating print previews and layout artwork utilize deep organic paper drop shadows:
     ```css
     box-shadow: var(--at-paper-shadow);
     /* 0 22px 38px -13px rgba(44,30,23,.26), 0 5px 11px rgba(44,30,23,.13) */
     ```
   - Layout artwork SVG filters apply matching organic drops:
     ```css
     filter: drop-shadow(0 16px 28px rgba(45,30,20,.14))
            drop-shadow(0 3px 6px rgba(45,30,20,.06));
     ```
2. **StartScreen Layered Open Gallery:**
   - Left copy column (`minmax(0, 1.08fr)`): Editorial greeting, bilingual accent, description, small borderless glass value pills (`Bản in lưu niệm`, `Album ảnh qua QR`), and 68px primary CTA.
   - Right gallery column (`minmax(0, 0.92fr)`):
     - An open spatial gallery `.atelier-welcome__gallery` with zero outer card frame.
     - Central ambient halo `.atelier-welcome__halo` (`radial-gradient(ellipse, rgba(203,159,127,.21), transparent 69%)`).
     - Rear portrait print `.atelier-print--portrait` rotated −7° with native layout aspect ratio (`layout.printAspectRatio`).
     - Front 4-cut strip print `.atelier-print--strip` rotated +6° with z-index 1.
     - Brand signature `LE SOUVENIR · PHOTO ATELIER` in italic Georgia serif.
3. **Cardless Presentation Across Stages:**
   - Live print previews on Selection, Frame, and Confirm screens float directly on the canvas without outer container wrappers.
   - Frame selection grid buttons use borderless layout artwork buttons with a subtle terracotta accent rim (`border: 2px solid #a85a40`) strictly on the selected item.
4. **Maximized Visual Stage (82vh):**
   - The print preview occupies up to 82% of the viewport height (`max-height: 82vh`), giving customers an expansive, high-fidelity view of their composition before confirming.

---

## 5. Touchscreen Ergonomics & 56px Touch Standards

All customer interactions are optimized for 16:10 landscape touchscreens (1280×800 and 1920×1200) without requiring a mouse or keyboard.

1. **56px Minimum Touch Target Rule:**
   - Header Back button: **56×56px** (Lucide `ArrowLeft` centered with dx: 0.5, dy: 0.0).
   - Carousel navigation chevrons: **56×56px** floating circles with horizontal axis alignment.
   - Action Bar primary CTA buttons: **58px – 68px** fluid height across resolutions.
   - Quantity Stepper buttons (`+`, `−`): **72×72px** square touch targets with 34px glyphs.
   - Photo selection tiles: Full card click surface (`clamp(140px, 22vh, 260px)`).
   - Touch targets are spaced with a minimum of 12px buffer to prevent accidental adjacent taps.
2. **Zero-Scroll Window Policy:**
   - The root kiosk window (`.v1-shell`) maintains `overflow: hidden; height: 100vh`. No customer flow triggers full-window scrolling.
   - Dynamic lists (captured photo gallery, frame grid, order summary) scroll independently with `overscroll-behavior: contain` and compact scrollbars.
3. **No-Hover / Immediate Press State:**
   - All interactive controls use `:active` scale (`transform: scale(0.96)`) for immediate physical feedback on finger contact.
   - Touch triggers employ `touch-action: manipulation` to eliminate browser tap delays.

---

## 6. Payment & QR Surface Architecture

1. **Zero Layout Shift (0 px):**
   - The QR code container (`.v1-payment-qr-slot`) enforces fixed responsive dimensions (`clamp(280px, 34vh, 380px)`) with an exact `1:1` aspect ratio.
   - Layout measurements verified via CDP prove 0.00 px shift when transitioning from spinner placeholder to high-resolution VietQR PNG.
2. **Porcelain White QR Quiet Zone:**
   - To guarantee rapid camera recognition by banking apps, the QR code and its container enforce an opaque porcelain white quiet zone (`background: #fff !important; opacity: 1; filter: none`).
   - The payment summary sits unboxed directly on the ivory canvas. Only the QR panel features a translucent frosted glass surround (`rgba(255,255,255,.55)`, `blur(20px)`), ensuring maximum contrast for the QR payload while maintaining atelier ambiance.
3. **Concealed Staff Access:**
   - Operator cash override is completely concealed behind a 1-second dwell gesture on the "Thanh toán" title, requiring staff PIN `1234` to prevent customer tampering.

---

## 7. Operator Workspace Styling

The Operator and Diagnostics workspace (`operator-v1.css`) adopts the same sophisticated Liquid Glass aesthetic:
- Warm ivory backdrop (`#FAF7F2` to `#EFE8E0`) replaces legacy harsh black/graphite styling.
- Frosted glass cards and navigation tabs with subtle white borders.
- Honest, unambiguous hardware health indicators (Canon DSLR disconnected, DNP printer simulated/ready).
- 56px touch-friendly navigation tabs with horizontal scroll affordance.
2. **Snapping & Scrolling:**
   - `scroll-snap-type: x mandatory` on `.v1-layout-carousel`.
   - `scroll-snap-align: center` on `.v1-carousel-card`.
   - Smooth transform animations: `transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.25, 1)`.
3. **Touch & Navigation Interaction:**
   - Non-centered card tap: scrolls that card to center and updates selection.
   - Centered card tap: triggers immediate selection confirmation and advances to the next step.
   - Chevrons: 56×56px floating circular controls pinned symmetrically on the horizontal center axis.
   - Reduced motion: disables smooth scroll and scale transitions under `prefers-reduced-motion: reduce`.

---

## 6. Payment & QR Surface Architecture

1. **Zero Layout Shift (0 px):**
   - The QR code container (`.v1-payment-qr-slot`) enforces fixed responsive dimensions (`clamp(280px, 34vh, 380px)`) with an exact `1:1` aspect ratio.
   - Layout measurements verified via CDP prove 0.00 px shift when transitioning from spinner placeholder to high-resolution VietQR PNG.
2. **Porcelain White QR Target:**
   - To guarantee rapid camera recognition by banking apps, the QR code is rendered on a pure white, unblurred, non-translucent card (`#FFFFFF`) with 16px quiet zone padding.
3. **Concealed Staff Access:**
   - Operator cash override is completely concealed behind a 1-second dwell gesture on the "Thanh toán" title, requiring staff PIN `1234` to prevent customer tampering.

---

## 7. Operator Workspace Styling

The Operator and Diagnostics workspace (`operator-v1.css`) adopts the same sophisticated Liquid Glass aesthetic:
- Warm ivory backdrop (`#FAF7F2` to `#EFE8E0`) replaces legacy harsh black/graphite styling.
- Frosted glass cards and navigation tabs with subtle white borders.
- Honest, unambiguous hardware health indicators (Canon DSLR disconnected, DNP printer simulated/ready).
- 56px touch-friendly navigation tabs with horizontal scroll affordance.

### Current mounted-token and payment contract (2026-11-01)

| CSS token | Value | Meaning |
|---|---|---|
| `--v-bg` | `#FAF6F0` | warm ivory canvas |
| `--v-surface` | `#FFFFFF` | order and guidance card surface |
| `--v-coral` | `#E07A5F` | selected state / CTA |
| `--v-peach` | `#F4A261` | secondary accent, not body copy |
| `--v-charcoal` | `#232120` | body/heading ink |
| `--v-border` | `#E9DED7` | dividers / outlines |

These mounted `--v-*` names are the frontend reference; older `--atelier-*` names in §2 are semantic design aliases, **not a claim of mounted variable names**. Typography: letter-spaced LE SOUVENIR wordmark, compact uppercase atelier kicker, large editorial bilingual hero, system-font Vietnamese body with diacritic support and tabular price/count numerals; no bundled font files. Navigation uses Lucide `ArrowLeft` in compact **52px** back target and `ChevronLeft`/`ChevronRight` in **56px** carousel targets; quantity stepper **72px**, prominent primary CTA **68–72px**. Verify accessible focus/contrast and real touch geometry separately; no hover is required.

**Payment layout:** left summary card presents backend `pricing.totalAmount` formatted VND, layout/format/quantity/base price and QR-wait status (capture example 70.000 đ, Dải 5×15 cm, 2 bản in). Right guidance card presents a **real backend-provided** VietQR with polling or an honest QR-creation/loading state. On missing PayOS configuration or QR error, explain cash at counter and offer staff cash confirmation via existing authorized backend event; header double-click / 700ms hold exposes the staff action but never authenticates staff. No guest `0 đ`, free-trial banner, free badge or bypass. Captured REAL Payment was QR-loading, **not** proof of QR render, staff approval or payment settlement. Only backend-authoritative payment permits capture; only existing Confirm & Print gate permits printing/revenue. Check 1280×800 fit and compact Windows scaling separately.

## 1. Visual direction and two evaluated options

**Option A — Atelier gallery (chosen).** Ivory canvas, centered print-artwork carousel, substantial charcoal text, coral action, blush caption, matte-black camera stage. Adjacent prints remain visible at 40% opacity and have explicit 64px arrow targets. Its large central illustration and isolated live countdown remain readable from several metres away.

**Option B — Darkroom editorial (not chosen).** Black welcome and capture, narrow champagne type and small lateral thumbnail rail. Attractive on a monitor but reduces readable contrast for printed strip silhouettes and titles at 1280×800; peripheral navigation becomes less discoverable. Reserve dark background for capture only.

No AI-gradient/glass panels, faux customer photos, fake QR, or simulated hardware-success imagery. Use genuine licensed event/frame art when supplied; otherwise use authored vector illustrations explicitly labeled as illustrations.

## 2. Tokens (CSS custom properties; proposed names, not claims about existing CSS)

| Token | Value | Use |
|---|---|---|
| `--atelier-bg` | `#FAF6F0` | warm ivory viewport |
| `--atelier-surface` | `#FFFFFF` | print mounts and panels |
| `--atelier-blush` | `#F7EBE8` | caption/secondary zone |
| `--atelier-coral` | `#E07A5F` | primary action and selection |
| `--atelier-coral-text` | `#A3442D` | coral text on light surface (not pale coral) |
| `--atelier-peach` | `#F4A261` | decorative accents; NOT body text on white |
| `--atelier-ink` | `#232120` | titles, instructions |
| `--atelier-secondary` | `#544E4B` | secondary copy |
| `--atelier-border` | `#E9DED7` | cashmere separators |
| `--atelier-sage` | `#81B29A` | decorative completion mark; status text uses dark ink |
| `--atelier-camera` | `#090909` | actual capture stage |
| `--atelier-focus` | `#232120` | 3px visible keyboard/focus ring + 3px ivory offset |

Coral-filled buttons use charcoal ink (`#232120`) rather than white: white on `#E07A5F` does not reliably meet normal-text contrast. Verify all combinations with a contrast checker: body text ≥4.5:1, large text ≥3:1, nontext controls ≥3:1. Disabled is conveyed by icon + label + disabled semantics, not opacity alone. Shadow is not the sole active cue.

Typography: system font stack `"Segoe UI", "Noto Sans", Arial, sans-serif`; editorial titles may use Georgia with immediate system serif fallback **only** for wordmark/large headings; no bundled font files assumed. 16px minimum body at compact CSS viewport, 18–22px primary instructions, 28–44px titles; live countdown `clamp(120px, 17vw, 240px)` subject to available viewfinder height, tabular numerals, high contrast. Vietnamese diacritics and long names must be tested with available fonts. No uppercased long Vietnamese explanatory copy. Use `font-variant-numeric: tabular-nums` for progress, money and countdown.

Spacing scale 4/8/12/16/24/32/48/64 CSS px. Radii 8 (print), 16 (panel), 24 (feature card), full pill (badges). Primary actions ≥64px high (72 at wide viewport), arrows/stepper/back ≥56×56px with ≥8px separation; no hover-only cues. Outline/pressed state on pointer-down; action request locked synchronously until authoritative response. `touch-action: pan-x` only on carousel track; buttons `manipulation`. Avoid global `touch-action: none` on the entire app.

Motion: snap 220–320ms ease-out, press 90–130ms, caption crossfade 140ms; no perpetual pulsing over a live face. Only animate transform/opacity of UI layers, never a live video/image source or IPC stream. Flash must not delay shutter and may be disabled for reduced motion. `prefers-reduced-motion: reduce` eliminates travel and flashing while preserving state changes and text. Haptics only where available and nonblocking; never required feedback.

## 3. Viewport geometry and Windows scaling

Use **CSS viewport measurements, not physical pixels**. At 100% scaling, reference layouts below assume browser viewport equals display pixels; at 125/150% scaling, actual CSS viewport may shrink (1920×1200 → approximately 1536×960 / 1280×800; 1280×800 → approximately 1024×640 / 853×533). WebView zoom/devicePixelRatio/window chrome can alter this: measure `innerWidth`, `innerHeight`, DPR, safe area in the packaged kiosk before sign-off. Implement with container + height queries, not DPI detection.

Shell `width:100%; height:100dvh; overflow:hidden; box-sizing:border-box;` with 24–48px horizontal and 16–32px vertical insets (compact 12–20px). Reserve header 72–104px, bottom controls 88–112px, then allocate remaining height to content. No whole-page vertical or horizontal scroll; narrow panels scroll within fixed bounds (`min-height:0; overflow:auto; overscroll-behavior:contain`) with visible scroll affordance/edge fade and accessible buttons. If viewport is shorter than ~600 CSS px, compress artwork/caption before shrinking controls; never clip payment confirmation or progress. 853×533 requires explicit compact fallback test; if impossible to keep content and 56px targets, show a truthful resolution/configuration warning rather than silently clipping a gate.

### Layout-selection carousel sizing (reference CSS pixel coordinates)

| CSS viewport | Header | Carousel area | Center slide *slot* | Neighbour slot/visual | Caption + actions |
|---|---:|---:|---:|---:|---:|
| 1920×1200 | 104 high | x=48–1872, y=140–955 | width ≈547 (30% of 1824), height ≤780; centred x≈686–1233 | slots each ≈547 wide; transform 0.82 makes visible print mounts ≈449; alpha .4 | y≈980–1168 |
| 1280×800 | 80 high | x=24–1256, y=96–622 | width ≈370 (30% of 1232), height ≤500; centred x≈455–825 | scaled visible width ≈303 | y≈640–780 |

The 30% width is a **pager slot**, not an instruction to stretch the print. Print art fits within the slot and carousel height with `object-fit: contain` / SVG `preserveAspectRatio="xMidYMid meet"`; 5×15 art is narrow. On CSS viewport <1100px use `clamp(240px, 32vw, 370px)` slot width (limited so both sides peek ≥64px); on short windows reduce illustration height, not button targets. Central artwork should occupy no more than ~70% of card width for narrow strips; the card may include matte surround/title. Arrow hit areas ≥64px, fixed within side peeks (x≈100 and 1756 at 1920; x≈32 and 1184 at 1280), no overlap with back/footer. For one layout, hide arrows and swiping; for two, clamp at ends rather than fake infinite copies. Dynamic catalogs: no synthetic item, no modulo on empty, preserve ordering/filter supplied by backend.

Carousel transform per normalized offset `d = min(abs(index - activeFraction),1)`: `scale = 1 - .18*d`, `opacity = 1 - .6*d`; translate along track using fixed-width slots then snap selected centre to viewport centre. Apply drop shadow `0 18px 48px rgba(65,43,31,.18), 0 0 0 6px rgba(224,122,95,.10)` and 2px crisp coral/ink border only to centered item; adjacent items still have visible edges. During swipe center/caption follow snapped index, **never commit a layout merely on snap**. Arrows move one valid item and announce it. Noncenter tap only centers; centered tap commits selection once and proceeds **only through the existing authoritative event/step**. In V1 Step1 this advanced to effect; in V2 simulator, retain its existing `session.setLayout`/`session.confirmSetup` contract; do not invent an effect IPC, automatic continue, or backend action. Explicit large `Chọn bố cục` button may mirror the centered-card action where the backend supports it; it cannot skip an effect or confirmation gate.

#### Accurate print artwork data contract

Use print **width/height in millimetres** from canonical layout metadata; 5×15 → `1/3 ≈ .333`, 10×15 → `2/3 ≈ .667` when portrait. Rotate only when backend declares orientation. Separate **print aspect** from **photo-slot aspect** (`layout.photoAspectRatio`); never use a strip print ratio as camera crop ratio. SVG `viewBox` proportional to print (e.g. 100×300 or 200×300), draw mount and the actual slot rectangles normalized from backend geometry (`x,y,width,height`, orientation, slot count). Transparent/ivory placeholders display `Ảnh 1`, `Ảnh 2` … from slot order, fine 1–2px lines; licensed sample portrait art may be shown as clearly illustrative fallback, never a captured result. If slot coordinates are unavailable, render a labeled **non-geometry sample illustration**, not a misleading exact template; ask architect for slot data. Real frame PNG is fitted/contained, never reconstructed with fake decoration. If dimensions disagree, display safe placeholder and diagnostic only in operator view.

Card UI: format pill `5×15 cm` / `10×15 cm` derived from dimensions; readable catalog title (examples only: “Dải 4 ảnh cổ điển”, “Khổ 10×15 4 ảnh”), photo-count badge from configured `shotCount` / `selectCount` with clear distinct labels; lowercase canonical ID in small subdued diagnostics node `.v1-layout-tag` with `data-layout-id` for tests (do not expose raw JSON, contract or developer/error copy to guests). Bottom caption repeats **active** title and short catalog description; clamp to two lines with accessible full text or internal expansion; do not derive marketing text from raw IDs. Missing names use neutral localized fallback. Count and timing **always** use backend-provided values, never examples above.

## 4. Screen component specifications (presentation only; no added workflow stage)

Common contract: entrances/exits follow `docs/UI_SCREEN_INVENTORY.md:17–33`; backend phase/events are authoritative, stale responses ignored by session ID. All screens provide pending/disabled/offline states, readable retry only if existing event is idempotent/authorized, back/cancel only where phase permits, inactivity timeout/recovery per backend. If no event exists, show truthful unavailable state, not faux success. Gallery images crop thumbnails; print/frame previews contain; aspect and mirror for live preview require camera metadata. Accessibility: headings, descriptive button names, focus-visible, status announcements throttled, no color-only selection.

| Screen | Visual hierarchy and actual interaction boundary | Loading / empty / error and safety |
|---|---|---|
| Welcome `StartScreen` | Wordmark + five-tap gesture (existing behavior, not production ACL), editorial two-column greeting/photostrip illustration; real event bundle horizontal row with explicit chevrons; start via existing session action. | No catalog → supported default entry; missing cover → illustration not customer photo. Do not expose diagnostic strings or visible mock payment. |
| Layout `StudioModeScreen` | **Centered snapping carousel** above; caption, format/count, arrow and optional explicit selection. Preserve V1's layout → effect interaction if effect stage/contract exists. | Empty catalog → no selection, operator-facing fix; pending selection disables duplicate; invalid SVG geometry → illustrative placeholder. |
| Quantity `QuantityScreen` | Large 72px tactile − / + around quantity; layout print preview; price summary using backend options/total. | Disabled at allowed-option edges; no assumed pricing/multiples. Existing V2 submit-on-selection behavior must not be secretly changed into an extra confirmation or auto-priced client calculation. |
| Payment `PaymentScreen` | Left amount/order, right **actual** PayOS QR when returned; complimentary trial only when backend session says trial. 700ms staff header hold merely reveals authorized confirmation panel. | Await verification from backend, not QR scan detection. Error/unconfigured QR gets honest help; no guest mock-approval or staff bypass via gesture alone. |
| Prepare `PrepareScreen` | Pose guidance and configured shot/select/timer summary, illustration. | Automatic phase transition if backend does so; no new start gate. Camera unavailable gets honest reason. |
| Capture `CaptureScreen` | Matte-black large aspect-correct live source; crop guide from source/slot geometry, progress `Ảnh X/Y`; huge legible countdown on dark scrim positioned to avoid face when possible; brief shutter feedback. | Device/stream missing → explicit stalled state, not looping stock footage. Do not alter countdown/shutter timing or replace capture with CSS animation. |
| Select `SelectPhotosScreen` | Spacious captured-photo grid, selection-order badges `✓ 1`, `✓ 2` from actual order, optional dock only if real composite is supplied; explicit enlarge/lightbox button (hold optional). | Exact backend select quota required for continue, empty/error/recovery and existing cancellation confirmation. |
| Frame `FrameScreen` | Contained real PNG artwork cards with checkmarks; authoritative composition preview left, frame choices right. | Missing PNG/unavailable composition → placeholder, never claim frame applied; custom file import only with reviewed contract. |
| Confirm `ConfirmScreen` | Large **print-resolution source** preview (do not call 600 DPI unless metadata verifies 600 DPI), order summary and one high-salience Confirm & Print CTA. | Disable synchronously on tap; only backend success advances. Back/cancel as authorized; no revenue before successful confirmed print. |
| Printing `PrintingScreen` | Linear four visual positions matching V1 compose/print/album QR/video **only if backend reports their actual states**; otherwise neutral indeterminate status, not invented completed milestones. | Physical print status ≠ queued job; failure/recovery from backend, no repeated spool. |
| Delivery `DeliveryScreen` | High-contrast **real** QR when valid URL exists; thank-you; finish via existing `session.finish`. | No URL → honest absent-delivery/help state; trial must not claim real QR/print. |
| Operator `AdminScreen` | Separate staff context, six tabs Frames, Layouts, Settings, Tools, Colors, Revenue; refined editorial density with explicit device/printer/camera states and conditional real controls. | Hidden entry is not auth. Mutation/delete/payment/revenue/Canon/printer tools require architect ACL + event; otherwise disabled with reason. Retain confirmations, reason dialogs and next-session settings behavior. |
| Startup / recovery / out-of-service | Calm full-stage notice with state-specific reason, accessible operator path only where authorized. | Never imply successful payment/print/capture from generic status; do not introduce V1's force-ready path without contract. |

## 5. Acceptance checklist for frontend/architect

1. Architect confirms layout catalog fields (ID/title/description/print mm, print orientation, slot rectangles, shot/select counts, allowed quantities, pricing, effect and backend selection event), camera orientation + crop, authoritative payment/print/delivery events, staff ACL/cancellation. Missing fields remain visibly unsupported instead of inferred.
2. Frontend implements `LayoutCarousel`, `PrintArtwork`, `KioskAction`, `StatusPanel` with controlled active index, stable IDs, pointer drag threshold (≈12px), pointercancel cleanup, snap-to-center, noncenter tap recenter and centered tap guarded submission. Arrow, touch, keyboard and accessibility activation must all lead to same state transition. Drag must not accidentally select; no state changes after unmount/session change.
3. Visually inspect 1920×1200 and 1280×800 at 100%, 125%, 150% Windows scaling, including approximately 853×533 CSS viewport; capture actual `innerWidth/innerHeight/DPR`. Check no viewport overflow, peeks/targets/caption, Vietnamese long-name wrapping, narrow/wide print geometry, 0/1/2/many layouts, reduced motion, touch hold and repeated taps.
4. Exercise real bridge mock-state UI separately from hardware; assert no transition across payment or Confirm & Print without backend authorization, no raw contract diagnostics on guest screens, countdown/counts from config, print preview contains and gallery covers, printer/QR states truthfully labeled. Physical camera, PayOS and printer require separate evidence and approvals.

**Related:** `docs/UI_REDESIGN_PROGRESS.md` tracks evidence and gaps; `docs/UI_SCREEN_INVENTORY.md` is the screen/action baseline. This document specifies presentation; it does not certify implementation.

## 6. November 2026 payment and navigation correction (supersedes conflicting text above)

The current user directive **removes all complimentary/free payment presentation**. In particular §4 Payment's “complimentary trial” and any older `UI_REDESIGN_PROGRESS.md` free-trial descriptions are historical, **not** design authority. DEMO remains a backend mode, but the kiosk payment screen must not offer a guest bypass, show `0 đ`, “Miễn phí”, or expose `payment.mockComplete({method:'DEMO'})`. Architect must verify how DEMO payment should be handled without inserting a new guest gate or implying a real bank transaction; the current UI shows amount only when backend pricing exists, otherwise an em dash, and waits for staff confirmation or backend phase change. A missing/invalid PayOS configuration or QR error reveals the **existing staff cash action** automatically; a 700ms header hold reveals the same action. This gesture is discoverability, **not authentication**: architect must verify staff authorization server-side before commercial deployment. The only cash event is `payment.mockComplete({staffOverride:true})`; success must be backend-authoritative. Never fake PAID from QR render or timer.

**Header/navigation mounted contract:** `KioskBackButton` renders Lucide ArrowLeft 22px/2.2 inside a 52×52 ivory square, 15px corner, #E9DED7 border, 0 2px 8px warm shadow, focus/hover coral, press scale .94; retains `session.back` and existing disabled semantics. `Heading` accepts an optional uppercase eyebrow (12px, muted coral), title clamp(26px,2.4vw,36px), subtitle 15–16px #756F6A. Carousel has explicit Lucide 24px chevrons in 56px floating circles; cards remain snap-centered with active 3px coral border, shadow `0 20px 50px rgba(224,122,95,.22)`, adjacent scale .84 / opacity .45. **Exception to general ≥56px targets:** back is 52px per requested compact header; preserve ≥56px on carousel and primary actions. Avoid arrows over cards; ensure peeks on both sides at 1280×800.

**Welcome mounted composition:** left wordmark (five taps reserved for operator entry), `PHOTO ATELIER · SEOUL × SAIGON`, headline `Chụp ảnh lấy ngay` / `Yours forever.`, natural Vietnamese subtitle, two value pills and a 68–72px coral CTA. Right is decorative layered paper photostrips **using illustration placeholders, not genuine sample portraits**: production photography requires supplied licensed/consented assets; do not call these illustrations genuine photographs. Event bundle showcase appears only for a backend-provided valid cover and layout, with curated backend name; do not expose raw layout IDs or Firebase diagnostic labels on Welcome. The `In lấy ngay 15s` pill is user-requested marketing copy, **not a guarantee of physical print latency**; commercial team must approve it against real device metrics. Backstage catalog errors appear only as a simple unavailable notice.

**Payment mounted data mapping:** left order summary uses `pricing.totalAmount`, `basePrice`, `extraAmount`, `quantity`, customer-friendly `formatLayoutTitle(layout)`, print format derived from declared `printSizeLabel` (otherwise em dash). Right displays actual QR from backend and backend-polling status, or a truthful unavailable/loading message. QR does not establish payment. `lastPaymentError`, missing config, SDK failure and QR `ERROR` expose staff support. Use 260–280px QR within a white card at full viewport; at shorter CSS heights, fit QR by available height and keep staff button visible. Backend pricing values are never replaced with client assumptions. Inspect at 1920×1200 and 1280×800 and simulated 125/150% CSS viewport sizes, long Vietnamese names, no QR, QR error, repeated staff clicks, pointer drift >12px and pointercancel. No hardware, scaling or real charge acceptance is claimed without evidence.
