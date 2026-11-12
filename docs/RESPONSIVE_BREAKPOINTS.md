# LE SOUVENIR V2 — Responsive 16:10 Breakpoints and Token Mappings

**Scope:** design-token and layout proposals for the Windows touch kiosk. This is not implementation or proof of scaling support.  
**Primary references:** 1920×1200 and 1280×800 landscape. Other dimensions adapt by available CSS width/height and container geometry, not device model or physical-pixel sniffing.

---

## 1. Responsive strategy

### 1.1 CSS viewport, not panel pixels

Windows display scaling and WebView device-pixel ratio can reduce the effective CSS viewport. Approximate mappings are useful stress targets but must be measured in the packaged app:

| Physical display | 100% scale (approx CSS) | 125% scale (approx CSS) | 150% scale (approx CSS) |
|---|---:|---:|---:|
| 1920×1200 | 1920×1200 | 1536×960 | 1280×800 |
| 1280×800 | 1280×800 | 1024×640 | ~853×533 |

These values assume conventional scaling and no additional WebView zoom/window chrome. Acceptance evidence records actual `innerWidth`, `innerHeight`, `devicePixelRatio`, host zoom, and safe area.

### 1.2 Break on available space

Use both width and height. A wide but short effective viewport cannot safely use the same vertical rhythm as WUXGA.

| Mode token | Proposed condition | Purpose |
|---|---|---|
| `kiosk-wide` | width ≥1600px **and** height ≥1000px | 1920×1200 flagship composition |
| `kiosk-standard` | width ≥1180px and height ≥720px, below wide | 1280×800 and WUXGA at 150% |
| `kiosk-compact` | width 960–1179px or height 600–719px | 1024×640 / constrained WebView |
| `kiosk-critical` | width <960px or height <600px | ~853×533 stress fallback; remove decoration, preserve legal controls, or show unsupported-display notice |

The target resolutions map to `kiosk-wide` and `kiosk-standard`; compact/critical are resilience modes, not a promise that every physical monitor/scaling combination is commercially approved.

### 1.3 Height-aware rules

- `@media (max-height: 719px)`: compact header/footer, reduce decorative artwork and gaps, switch camera rail to bottom dock where necessary.
- `@media (max-height: 599px)`: critical mode; hide nonessential descriptions/art, keep ≥48/56px targets and all payment/print gates. If this cannot fit, block session start with a truthful operator configuration warning.
- Prefer container queries for split-panel/card decisions; a 40% side panel at WUXGA may have the same usable width as a full compact panel.

### 1.4 Orientation and aspect

- Landscape is required for commercial customer flow.
- At portrait or extreme aspect ratios, do not squeeze the 16:10 composition into tiny targets. Present an operator-facing display-configuration notice and disable Start unless an independently designed portrait mode is approved.
- Use `100dvh`, `min-height:0`, and bounded internal scroll; never rely on document scroll for core customer actions.

---

## 2. Global token mapping

### 2.1 Reference modes

| Token | 1920×1200 (`wide`) | 1280×800 (`standard`) | Compact fallback | Critical fallback |
|---|---:|---:|---:|---:|
| Root base size | 20px conceptual | 16px conceptual | 16px | 16px minimum body |
| Shell inset X | 64px | 32px | 20–24px | 12–16px |
| Shell inset Y | 48px | 24px | 16px | 8–12px |
| Header height | 88–96px | 72px | 64px | 56–64px |
| Footer/action region | 104–120px | 88–104px | 80–88px | 72–80px |
| Major column gap | 48–64px | 24–32px | 16–24px | 12–16px |
| Section gap | 32–48px | 24–32px | 16–24px | 12–16px |
| Card padding | 32–40px | 24px | 20px | 16px |
| Card radius | 28px | 24px | 20px | 16px |
| Sheet/modal radius | 32px | 28–32px | 24px | 20px |
| Default touch target | 64px | 56px | 56px | 48px absolute min |
| Customer primary height | 72px | 64px | 64px | 56–64px |
| Shutter diameter | 120px | 108–112px | 104px | 96px only if needed; still far above 48px minimum |
| Arrow/back target | 64/56px | 56px | 56px | 48–56px |
| Adjacent touch gap | ≥16px | ≥12px | ≥12px | ≥8px only if necessary |
| Glass blur soft/base/strong | 14/16/20px | 12/16/18px | 12/14/16px | turn glass opaque; ≤12px |
| Grid gap | 24px | 16px | 12–16px | 8–12px |
| Paper shadow spread | full token | ~80% visual spread | simplified | single subtle shadow |

The root base size is a design reference, not permission to scale every component with one global `rem` multiplier. Touch and type minima stay explicit in CSS pixels.

### 2.2 Typography mapping

Most type uses `clamp()` from `DESIGN_SYSTEM.md`; expected endpoints are listed for QA.

| Type token | 1920×1200 expected | 1280×800 expected | Compact floor | Critical rule |
|---|---:|---:|---:|---|
| Welcome display | 76–80px | 52–56px | 44–50px | max 2 lines; remove decorative accent first |
| Editorial serif accent | 48–50px | 32–36px | 28–32px | optional hide if height constrained |
| Screen title | 42–44px | 30–34px | 28–30px | 26px minimum |
| Section title | 28–30px | 22–24px | 20–22px | 20px minimum |
| Body large | 21–22px | 18px | 17–18px | 16px minimum |
| Body | 19–20px | 16–17px | 16px | 16px minimum |
| Label | 16–17px | 14–16px | 14–15px | 14px, but primary action ≥16px |
| Price | 60–64px | 40–46px | 36–42px | preserve one line; reduce summary before price |
| Countdown | 280–300px | 144–200px | 132–168px | ≥112px if rail becomes overlay band |
| Progress | 22–24px | 18–20px | 18px | 17px minimum |

### 2.3 Motion mapping

| Motion | Wide | Standard | Compact/Critical |
|---|---:|---:|---:|
| Screen enter | 250ms, 8px | 200–220ms, 8px | 150–180ms, 4px |
| Card/select | 180–200ms | 150–180ms | 150ms |
| Carousel snap | 250ms | 220ms | 180ms / instant in critical |
| Press | 80–100ms | 80–100ms | 80ms |
| Modal/sheet | 250ms | 220ms | 180ms |

Reduced motion overrides all mappings with static changes or ≤80ms opacity-only feedback.

---

## 3. Global grid coordinates

Coordinates are Figma-friendly reference frames, not fixed implementation pixels. Content adapts fluidly between them.

### 3.1 1920×1200 primary frame

- Viewport: x `0–1920`, y `0–1200`.
- Safe/customer canvas: x `64–1856`, y `48–1152` (1792×1104).
- Header: y `48–144`.
- Main content: y `160–1032` (872px max).
- Action/footer: y `1048–1152`.
- Twelve-column grid: 12 columns, 24px gutters, usable column width ≈127px.
- Preferred split:
  - 7 columns preview/media: x `64–1095` approximate.
  - 5 columns decision: x `1143–1856` approximate.
  - For Welcome, use a balanced 52/48 split rather than strict 7/5.

### 3.2 1280×800 secondary frame

- Viewport: x `0–1280`, y `0–800`.
- Safe/customer canvas: x `32–1248`, y `24–776` (1216×752).
- Header: y `24–96`.
- Main content: y `112–672` (560px max).
- Action/footer: y `688–776`.
- Eight-column grid: 8 columns, 16px gutters, usable column width ≈138px.
- Preferred split:
  - 5 columns preview/media: x `32–776` approximate.
  - 3 columns decision: x `792–1248` approximate.
  - Adjust to 54/46 when decision copy needs more width.

### 3.3 Fluid interpolation

- Horizontal inset: `clamp(24px, 3.333vw, 64px)` for reference range, with standard override near 1280 to 32px.
- Vertical inset: `clamp(20px, 2.5vw, 48px)` but constrain by height queries.
- Major gap: `clamp(24px, 2.5vw, 48px)`.
- Do not interpolate touch controls below their mapped minimum.

---

## 4. Per-screen mappings

### 4.1 Welcome / attract

| Token | 1920×1200 | 1280×800 | Compact adaptation |
|---|---:|---:|---|
| Copy/art split | 52/48 | 54/46 | 58/42; hide secondary art |
| Copy max width | 820px | 610px | 520px |
| Hero art max | 760×930px | 470×600px | 340×440px |
| Start | 320–420×72px | 280–360×64px | 260–340×64px |
| Value chips | 56px min high | 48–56px | omit decorative chips before shrinking copy |
| Bundle card | 280×168px | 216×136px | horizontal rail, 200×124px |

At critical height, remove serif accent and one decorative print. Preserve heading, Start, valid bundle entry, and operator readiness status.

### 4.2 Layout carousel / effect selection

| Token | 1920×1200 | 1280×800 | Compact adaptation |
|---|---:|---:|---|
| Carousel band | 820px high | 500px high | 360–420px high |
| Center pager slot | 520–580px | 350–390px | 290–340px |
| Side peek | ≥96px | ≥64px | ≥48px |
| Arrow | 64px | 56px | 56px |
| Print art max height | 760px | 440–470px | 320–380px |
| Caption band | 144–176px | 112–136px | 96–112px |
| Effect preview/rail | 66/34 | 62/38 | 58/42 or bottom sheet |

Do not scale narrow strip art to pager width; fit within slot. At one item, hide navigation while retaining deliberate selection.

### 4.3 Quantity

| Token | 1920×1200 | 1280×800 | Compact adaptation |
|---|---:|---:|---|
| Decision/preview split | 52/48 | 54/46 | 58/42 |
| Step target | 72px | 64–72px | 56–64px |
| Quantity numeral | 80–88px | 64–72px | 56–64px |
| Preview max height | 760px | 470px | 350px |
| Confirm height | 72px | 64px | 64px |

At critical height, reduce preview before hiding price breakdown or confirmation.

### 4.4 Payment

| Token | 1920×1200 | 1280×800 | Compact adaptation |
|---|---:|---:|---|
| Summary/QR split | 44/56 | 46/54 | 48/52; or summary rail + QR |
| QR encoded square | 360–380px | 260–300px | 220–260px, constrained by height |
| QR quiet padding | 20–24px | 16–20px | 16px |
| Amount type | 60–64px | 40–46px | 36–42px |
| Staff modal keypad | 64px keys | 56–64px | 56px |

At critical height, collapse nonessential order lines behind a readable summary disclosure in the staff/operator context only; customer amount, QR, waiting status, and legal Back must remain visible. If QR cannot retain safe scanning size, block with a display configuration warning rather than shrink indefinitely.

### 4.5 Camera preparation

| Token | 1920×1200 | 1280×800 | Compact adaptation |
|---|---:|---:|---|
| Guide/instruction split | 58/42 | 54/46 | 46/54 or hide guide |
| Pose guide | 520×780px | 340×510px | 240×360px / omit |
| Dynamic chips | 56px high | 48–56px | wrap in two rows; never shrink text below floor |

### 4.6 Capture

| Token | 1920×1200 | 1280×800 | Compact adaptation |
|---|---:|---:|---|
| Viewfinder/rail | 76/24 | 75/25 | rail becomes 120–152px bottom dock below 1100px or short height |
| Outer inset | 32px | 16px | 8–12px |
| Gap | 24px | 16px | 8–12px |
| Rail width | 340–400px | 250–290px | full width bottom |
| Countdown | 220–300px | 144–200px | 132–168px in dock; ≥112px critical |
| Shutter | 120px | 108–112px | 104px; 96px critical if necessary |
| Progress ring | 88–112px | 72–88px | 64–72px plus text |

The Viewfinder is always source-contained. At compact/critical modes, move UI out of its center before reducing Viewfinder below a usable portrait area.

### 4.7 Photo selection

| Token | 1920×1200 | 1280×800 | Compact adaptation |
|---|---:|---:|---|
| Gallery/preview split | 62/38 | 60/40 | carousel 58/42; hide secondary metadata |
| Tile min | 176px | 144px | 128–144px |
| Grid gap | 20–24px | 16px | 12px |
| Preview max height | 720px | 430px | 320px |
| Footer action | 72px | 64px | 64px |
| Timer target | 56px | 48–56px | 48px |

Grid column count is derived from min card width and available space, not hardcoded to the capture total. At compact widths, use TouchCarousel plus arrows rather than tiny tiles.

### 4.8 Frame selection / conditional crop

| Token | 1920×1200 | 1280×800 | Compact adaptation |
|---|---:|---:|---|
| Preview/options split | 56/44 | 50/50 | 46/54 or horizontal frame rail |
| Frame card min | 210px | 152px | 140px |
| Grid columns | auto-fit, typically 3 | auto-fit, typically 2 | carousel/2 columns |
| Footer actions | 72px | 64px | 64px |
| Crop sheet (if capability exists) | 420–480px side | 360–420px side | bottom sheet 220–280px |

### 4.9 Final Preview / Confirm & Print

| Token | 1920×1200 | 1280×800 | Compact adaptation |
|---|---:|---:|---|
| Preview/summary split | 64/36 | 60/40 | 56/44 |
| Preview max height | 900px / 82vh cap | 590px / 78vh cap | 390–450px |
| Summary row | 56px | 48px | 44–48px |
| Confirm | 72px | 64px | 64px |
| Primary/Back gap | 24px | 16px | 16px |

At critical height, remove decorative metadata and reduce preview, never the Confirm label/target or essential order summary.

### 4.10 Printing status

| Token | 1920×1200 | 1280×800 | Compact adaptation |
|---|---:|---:|---|
| Thumbnail max | 300×450px | 220×330px | 160×240px / omit if needed |
| Activity ring | 64px | 56px | 48–56px |
| Pipeline | one horizontal row | one/two rows | vertical/neutral single status |
| Status max width | 960px | 760px | viewport minus 32px |

Pipeline stages render only when authoritative; responsive layout cannot be used to justify invented milestones.

### 4.11 Delivery

| Token | 1920×1200 | 1280×800 | Compact adaptation |
|---|---:|---:|---|
| Summary/QR split | 46/54 | 48/52 | 44/56; QR priority |
| QR encoded square | 360–400px | 260–304px | 220–260px |
| Print thumb max height | 380px | 240px | omit before shrinking QR |
| Finish | 320–440×72px | 280–360×64px | 260–340×64px |

At critical height, QR, outcome, print truth/status, and Finish take priority. Optional copy/share/open controls collapse into an accessible 56px action row only when supported.

### 4.12 Admin

| Token | 1920×1200 | 1280×800 | Compact adaptation |
|---|---:|---:|---|
| Header | 88px | 72px | 64px |
| Navigation | 264px vertical rail | 64px horizontal tab rail | 56–64px horizontal with arrow controls |
| Content inset | 40px | 24px | 16–20px |
| Form row min | 64px | 56px | 56px |
| Cards | 3–4 columns auto-fit | 2 columns auto-fit | 1–2 columns |
| Modal max width | 840px | 720px | viewport minus 32px |
| Table behavior | full columns | priority columns + detail | card list; no horizontal precision |

Admin can use bounded body scroll. Keep authentication, environment/mode label, Exit/save status, and tab navigation fixed and visible.

---

## 5. Image and aspect-ratio mappings

### 5.1 Rules by media type

| Media | Fit | Responsive priority |
|---|---|---|
| Live View | contain | preserve largest usable area; letterbox matte black |
| Crop guide | normalized overlay | follow actual contained image bounds, not viewport |
| Captured thumbnail | cover | enlarge/lightbox provides contained full image |
| Full captured preview | contain | never stretch |
| Frame PNG | contain, preserve alpha | never reconstruct in CSS |
| Composition/print preview | contain | reduce surrounding copy/art before image below usable size |
| QR | exact square, opaque white | preserve scanning size before decorative thumbnail |
| Welcome artwork | contain | may hide secondary decorative art in compact mode |

### 5.2 Aspect metadata

- Use declared print width/height for paper artwork.
- Use photo-slot/crop aspect for Live View guide; print ratio and slot ratio are not interchangeable.
- Rotation/mirror comes from authoritative metadata/approved parity behavior.
- Missing dimensions result in a safe contained placeholder and operator diagnostic, not guessed stretching.

---

## 6. Overflow and internal scrolling

### Customer flow

- Root never scrolls.
- Allowed internal scrolling: bundle/layout/photo/frame carousel/grid, effect rail, lightbox thumbnail rail, long error details only where safe.
- Every scroll region has `min-height:0`, `overscroll-behavior:contain`, edge fade or visible position, and explicit touch controls where swipe is involved.
- Payment, shutter, Confirm & Print, and Finish remain outside scrolling regions.
- Avoid scrollbar-only affordance; touch drag and arrows/buttons are required.

### Admin

- Body and tables/cards may scroll independently.
- Sticky header/navigation/save status cannot cover focused fields.
- On-screen keypad/modal is sized to avoid hiding the active field; use a side modal or repositioned field summary rather than relying on Windows keyboard behavior.

### Language overflow

- Headings max two lines; body max three lines in customer flow.
- Cards grow within bounded tracks where possible; clamp marketing descriptions, but preserve full accessible text.
- Buttons use approved concise localization; never ellipsize an irreversible action so its consequence is hidden.
- Raw IDs/paths do not become customer fallback strings.

---

## 7. Compact and critical degradation order

When available height/width shrinks, remove or compress in this order:

1. Ambient decorative halo/specular decoration.
2. Secondary Welcome print and editorial serif flourish.
3. Nonessential descriptions/value chips.
4. Optional print thumbnail on Delivery/Printing.
5. Gaps/padding down to mapped compact tokens.
6. Reflow side rail to bottom sheet/dock.
7. Reduce media within stated minimums.

Never degrade by:

- shrinking active controls below 48px;
- hiding payment amount, QR status, capture progress, required selection fraction, print consequence, or Finish;
- reducing body below 16px or primary action label below 16px;
- clipping a legal Back/cancel/confirmation gate;
- enabling document scroll behind the kiosk shell;
- replacing text status with color/icon alone.

If safe fit still fails, show an out-of-service/configuration notice and require an operator to correct display scaling. Silent clipping is a release blocker.

---

## 8. Proposed Tailwind responsive aliases

These names are proposals for future configuration, not implementation:

| Alias | Proposed media/container intent |
|---|---|
| `kiosk-wide:` | `min-width:1600px` and `min-height:1000px` |
| `kiosk-standard:` | `min-width:1180px` and `min-height:720px` |
| `kiosk-compact:` | width below 1180px or height below 720px |
| `kiosk-short:` | `max-height:719px` |
| `kiosk-critical:` | width below 960px or height below 600px |
| `panel-narrow:` | container width below 420px |
| `panel-wide:` | container width ≥640px |

Because stock Tailwind screen definitions are width-only, height and compound conditions need named raw media queries or semantic component variants. Do not approximate the entire design with `lg`/`xl` width classes alone.

Suggested fluid arbitrary-token proposals:

- shell X: `px-[clamp(24px,3.333vw,64px)]` plus compact/critical overrides;
- major gap: `gap-[clamp(24px,2.5vw,48px)]`;
- title: `text-[clamp(30px,2.3vw,44px)]`;
- countdown: `text-[clamp(144px,17vw,300px)]` with rail/container cap;
- primary height: `min-h-[clamp(64px,4vw,72px)]` (never below compact token);
- media: `max-h-[min(82vh,var(--content-height))]` for final preview, with explicit footer budget.

---

## 9. Windows scaling and packaged-app verification protocol

For each supported physical monitor and 100/125/150% setting:

1. Launch the packaged kiosk shell, not a browser-only approximation.
2. Record physical mode, Windows scale, `innerWidth`, `innerHeight`, DPR, WebView zoom, and any titlebar/safe-area loss.
3. Navigate through UI using touch only; do not rely on devtools to enter screens.
4. Capture every customer screen plus all six Admin tabs in normal, loading, empty, error, pending, and disabled states.
5. Measure actual hit rectangles and gap: all ≥48px, defaults as mapped.
6. Verify no root scroll, clipped footer, overlapping focus ring, or hidden gate.
7. Scan payment/delivery QR from multiple representative phones at practical distance and brightness.
8. Verify Live View/source aspect and crop-guide mapping with orientation metadata; synthetic preview is labeled and does not count as hardware proof.
9. Test fallback font only, Vietnamese/Hangul/English overflow, high contrast, forced colors, and reduced motion.
10. Record any critical-mode display warning. Do not claim that an approximate CSS simulation proves Windows scaling or touch calibration.

---

## 10. Responsive acceptance checklist

- [ ] 1920×1200 uses the wide mapping with intentional negative space, not enlarged compact cards.
- [ ] 1280×800 fits all legal actions with no root scroll and ≥56px default controls.
- [ ] 1536×960, 1024×640, and ~853×533 stress cases have explicit outcomes.
- [ ] Width and height queries drive layout; no physical-resolution/DPI sniffing controls business flow.
- [ ] Customer primary actions stay outside internal scroll regions.
- [ ] Camera rail reflows without placing primary countdown/progress over faces.
- [ ] QR keeps opaque quiet zone and scannable dimensions before decorative content.
- [ ] Dynamic grids use minimum card width, not hardcoded item/count columns.
- [ ] Print/frame/live media preserve declared intrinsic aspect.
- [ ] Long localized labels, fallback fonts, large prices, and dynamic counts do not overlap.
- [ ] Critical fit failure blocks safely rather than clipping payment or Confirm & Print.
- [ ] Packaged Windows tests—not static pictures—provide final scaling evidence.
