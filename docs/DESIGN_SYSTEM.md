# LE SOUVENIR V2 — Korean Photo Atelier design specification

**Status:** design proposal / implementation contract, not a working UI or hardware verification. **Scope:** V2 only. V1 was inspected read-only (`StudioModeScreen.kt:34–197` and `docs/UI_SCREEN_INVENTORY.md`, `docs/UI_BASELINE_COMPARISON.md`). Preserve server/session authority, configured counts/timers, payment and Confirm & Print gates. The new identity intentionally differs from V1's colors while restoring its layout-selection interaction.

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
