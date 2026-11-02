# LE SOUVENIR V2 — P0 navigation, P1 guest copy, P2 welcome art

**Design handoff, not a mounted UI or hardware sign-off.** V2 source inspected: `frontend/src/screens/{KioskUI,StartScreen,StudioModeScreen,LayoutArtwork,CaptureScreen}.tsx`, `frontend/src/kiosk-v1.css`, and `frontend/src/screens/screens.test.tsx`. No V1 files changed. Retain all existing session actions, catalog configuration, countdown, print/payment gates and staff authorization. Use this document for the next frontend implementation; current screenshots and tests may still show the old UI.

## P0 — Why navigation drifts today

`Heading` (`KioskUI.tsx:13`) puts Back, an intrinsically sized title stack and optional `menu` as siblings in a flex row with `align-items:center`. The stack's height varies with eyebrow/subtitle and wrapping; the Back button tracks the *whole stack center*, not the title center. `kiosk-v1.css` sets header heights of 90, 76 and 70px, heading title sizes of 30–46, 26–36 and 26–36px, and back-button size/radius of 52px/circle, then 52px/15px, then 16px radius. Cascading overrides cause different geometries depending on screen/viewport. Optional right-side content can also steal title width. Existing global `button:active { transform:scale(.96) }` overrides positioning unless the more-specific button rule wins. Carousel arrows use absolute 50% of the wrap, but active transforms and cards with different heights shift the perceived artwork center. At `StudioModeScreen.tsx:55–59` both the visible card and accessibility label leak layout IDs.

### Reusable React shape (presentation only)

```tsx
<AppHeader
  title="Bố cục"
  eyebrow="Bước 2" // optional, only if this step actually exists in the current flow
  subtitle="Chọn kiểu ảnh yêu thích" // optional
  back={{label:'Quay lại', onClick:handleExistingSessionBack, disabled:busy}}
  right={<DecisionTimerBadge seconds={backendSeconds} />} // optional
/>
```

`AppHeader`: one `<header>`; grid left/back track, `headerCopy` track, optional `headerRight` track. Inside `headerCopy`, render **title first in the grid's fixed title row**, eyebrow absolute-positioned above that row and subtitle below it; never center Back against the entire copy stack. If no Back is valid, reserve the track only if the screen needs identical title x-position across transitions; never render an invisible *interactive* button. The title's `h1` remains a normal semantic heading. Expose the existing title gesture handlers on `headerCopy` for payment staff reveal, **not** on Back and not as staff authorization. `BackButton` is a native button with SVG `aria-hidden`, text `aria-label`, `type="button"`, synchronous pending lock; its `onClick` invokes only the phase-allowed existing callback. During capture/printing or other back-prohibited states omit it; don't synthesize navigation history. Right status is live backend data, not a cosmetic timer. Use CSS grid rather than equal left/right padding hacks.

```css
:root {
  --v-bg:#FAF6F0; --v-charcoal:#232120; --v-secondary:#544E4B;
  --v-border:#E9DED7; --v-eyebrow:#A94D37; /* #C27357 is decorative only on ivory: verify contrast before text use */
  --v-coral:#E07A5F; --v-paper:#FFFCF7;
  --header-target:56px; --header-copy-gap:20px;
  --header-title-size:clamp(32px,2.2vw,40px);
}
.appHeader {position:relative;display:grid; grid-template-columns:56px minmax(0,1fr) auto;
  column-gap:var(--header-copy-gap); align-items:start; min-height:116px;
  --header-padding-top:19px; padding-block:var(--header-padding-top) 8px;
  color:var(--v-charcoal)}
.appHeader__backSlot {position:absolute;left:0;
  top:calc(var(--header-padding-top) + 16px);display:grid;place-items:center;
  width:56px;height:56px} /* same 56px title row; eyebrow reserves 16px even if absent */
.appHeader__copy {grid-column:2; min-width:0; display:grid;
  grid-template-rows:16px minmax(56px,auto) auto; align-content:start}
.appHeader__eyebrow {grid-row:1; align-self:start; font-size:13px;
  line-height:16px; font-weight:700; letter-spacing:.06em; color:var(--v-eyebrow)}
.appHeader__copy h1 {grid-row:2; margin:0; font-size:var(--header-title-size);
  font-weight:700; line-height:1.15; letter-spacing:-.025em; overflow-wrap:break-word;
  align-self:center} /* for wrapped headings, align Back to first line: see note below */
.appHeader__subtitle {grid-row:3; margin:4px 0 0; font-size:clamp(16px,1.05vw,18px);
  line-height:1.35; color:var(--v-secondary)}
.appHeader__right {grid-column:3; grid-row:1; align-self:start;
  display:flex; justify-content:flex-end; align-items:center; min-height:56px;
  max-width:min(30vw,360px)}
.backButton,.carouselChevron {box-sizing:border-box; width:56px; height:56px;
  min-width:56px; min-height:56px; display:grid; place-items:center;
  padding:0; border:1px solid var(--v-border); border-radius:50%;
  background:var(--v-paper); color:var(--v-charcoal);
  box-shadow:0 4px 12px rgba(35,33,32,.10); touch-action:manipulation;
  transition:transform 120ms ease, box-shadow 120ms ease}
.backButton svg,.carouselChevron svg {display:block; width:24px; height:24px;
  stroke-width:2.25; transform:translateX(-.5px)} /* optical; SVG viewBox remains centered */
.carouselChevron--next svg {transform:translateX(.5px)}
.backButton:active:not(:disabled),.carouselChevron:active:not(:disabled)
  {transform:scale(.94); box-shadow:0 2px 6px rgba(35,33,32,.14)}
.backButton:focus-visible,.carouselChevron:focus-visible
  {outline:3px solid var(--v-charcoal);outline-offset:3px}
.backButton:disabled,.carouselChevron:disabled {opacity:.5;box-shadow:none;cursor:not-allowed}
@media (max-height:700px) {.appHeader {min-height:96px;--header-padding-top:10px;padding-bottom:4px}}
@media (prefers-reduced-motion:reduce) {.backButton,.carouselChevron{transition:none}}
```

The Back center is at `padding-top + 16 + 28px`; the title's single line is centered in that same fixed 56px row. Render a **noninteractive empty eyebrow row** when the tag is absent. For headings that wrap, switch `h1` to `align-self:start` and inset its first line within a 56px first-line row; do not center Back against the entire two-line heading. Test `getBoundingClientRect()` title-first-line center vs Back center ≤4px (not bounding-box center of wrapped `h1`). At compact viewport lower padding only, never shrink button. Right slot wrapping must not change Back's y-position.

Carousel chevrons: relative `.carouselViewport` defines a fixed `--carousel-axis-y:50%` from the **card/print visual area**, excluding indicator and footer. `.carouselChevron {position:absolute;top:var(--carousel-axis-y);z-index:4}`; prev `left:8px`, next `right:8px`, both use `transform:translateY(-50%)`; active transform `translateY(-50%) scale(.94)` (never replace translate with scale alone). Give track `padding-inline:72px` or reserve a 72px side rail so buttons never cover card labels. Respect RTL only if actual locale changes (Vietnamese is LTR). For one card hide both buttons; at ends disable, keep in place to preserve symmetry. Scroll swipe is optional; accessible click controls always present when applicable. Cards have stable visual-art container height and `object-fit:contain`; no arrow vertical alignment against an arbitrarily taller caption. Do not let fixed arrow `z-index` cover the Back button or footer.

## P2 — Welcome, editorial photographic recomposition

**Option A (chosen):** Ivory gallery opening / dark camera stage; photo prints occupy right panel, big dark live camera for capture. At 1280×800 readability wins: 36–42px headline, ≥68px CTA, print imagery not used as navigation. **Option B:** all-black welcome with narrow champagne text and centered live countdown; attractive but headline and labels lose clarity at distance, and black welcome hides the prints. Implement A. Capture countdown must stay large (120–200px, responsive to available height) in a reserved dark side/bottom gutter, never centered on faces or dimming the entire live image as current `.v1-capture .v1-countdown` does. If viewfinder fills viewport, allocate a 180–240px side rail and keep configured progress (`count+1`/`layout.shotCount`), crop from `layout.photoAspectRatio`, actual source orientation and camera mirroring metadata. No fake camera or countdown.

Welcome left: `LE SOUVENIR` letter-spacing `.18em`, dark serif/system fallback (no font files); kicker `PHOTO ATELIER · SEOUL × SAIGON` with peach dot and dark/contrasting lettering; `h1` “Chụp ảnh lấy ngay”, separate italic “Yours forever.”; explanatory text 17–19px; two noninteractive value pills “In lấy ngay 15s” **only if operationally verified/configured** (otherwise “In ảnh lấy ngay”) and “Tải ảnh & video bằng QR” **only if video delivery is actually available** (otherwise “Tải ảnh bằng QR”). Existing `StartScreen` hardcodes both promises; validate with architect. CTA “CHẠM ĐỂ BẮT ĐẦU →” min-height 68px, padding 18px 32px, radius 999px, bold 20–22px, restrained coral linear blend `#E07A5F → #D46A4E`, dark ink `#232120`, no hover-dependent indication. The existing `onStart(layoutId)` and selected event-bundle mapping remain untouched. Unavailable catalog disables CTA and shows plain-language help. Five-tap wordmark is *only a discoverability gesture*, never admin authorization; preserve guarded backend/operator auth.

Welcome right: an ivory mounting board, not sterile white placeholder boxes. Use only licensed **V2-local noncustomer** photographic sample portraits, supplied event cover photos when rights allow, or authored high-quality photographic **canvas illustrations explicitly marked as illustrations**. Existing `LayoutArtwork` renders tiny vector silhouettes and default fallback SVG; do not misrepresent these as real portraits. Do not copy V1/customer photos, fetch remote stock at runtime, or display unlicensed image assets. If no eligible photo assets exist, show a confident paper-art montage labeled “Minh họa” (not misleading photography) until authorized assets arrive. Each real portrait is `object-fit:cover` within the slot; paper/print itself uses true `width/height` from layout `printAspectRatio` (5×15 portrait ≈1:3; 10×15 postcard ≈2:3, if orientation supplied), never stretch to a 33%-width strip by changing its aspect. Foreground strip rotate(-4deg), background postcard rotate(3deg); paper surface `#FFFCF7`, fine noise with CSS nonnetwork SVG/data URI *only if reviewed*, 1px `#E9DED7` edge, `box-shadow:0 20px 40px rgba(35,33,32,.18)`; footer “LE SOUVENIR · PHOTO ATELIER” using 9–11px uppercase **on the decorative print only**. Preserve portrait heads with slot-appropriate framing; show `aria-hidden="true"` on decorative montage, with an outer accessible caption. No “captured result” claim for sample photography.

Geometry: at CSS 1920×1200 shell side inset 64–80px, left/right columns ≈48/52%, gap 48–72px, hero art board max-height 680px; at 1280×800 inset 24–32px, gap 24–40px, board max-height 500px; at ~1024×640 tighten copy and image but retain 56px admin/accessible controls and 68px CTA; at ~853×533 compact to single scrollable *left content region* plus reduced art or hide decorative board; never clip CTA. Use `clamp`, container height rules and `min-width:0`; verify `overflow-wrap` for long event names and Vietnamese diacritics. At 125/150% scaling measure CSS viewport, not screen pixels.

## P1 — Guest-facing technical copy audit

Remove `StartScreen.tsx:22–25` diagnostics row entirely (`Firebase Live`, `Bộ nhớ tạm`, and raw layout IDs). Keep `catalogSource` internal for availability and operator diagnostics. Remove `StudioModeScreen.tsx:58` `.v1-layout-tag` and the `${l.id}` fragment in the card's `aria-label` (`:55`); backend `key`, `session.setLayout({layoutId})`, internal `id` and test selectors may remain internal. Do **not** render hidden raw IDs in an ARIA description, tooltip or `data-*` copied to public assistive text. Format display names with `formatLayoutTitle()`; if configured title itself resembles an ID, replace it with a neutral localized fallback, while preserving internal ID untouched. `KioskUI.tsx:15` appends “600 DPI” to preview alt regardless of actual image metadata: remove the suffix unless verified backend resolution metadata exists. `FrameScreen.tsx:12` uses “Bản ghép từ backend”: call it “Bản xem trước”, while retaining honest pending/uncomposed indicators. `PrepareScreen.tsx` says “studio thử nghiệm”: reserve runtime diagnostics for operator; guest-facing state “Đang chuẩn bị máy ảnh…” only if this is in fact camera preparation. `CaptureScreen.tsx` alt “Live View thử nghiệm” is technical/demo; keep truthful demo differentiation through a concise customer-safe label if demo must be disclosed. **Do not remove safety-relevant demo/real/print notices**: `ConfirmScreen`'s “Không gửi lệnh in thật” and payment errors prevent misleading users. No silent removal of business disclosures or staff-only conditions.

Text scale: H1 `clamp(32px,2.2vw,40px)` (Welcome headline can be 42px+ editorial), card title 20–24px, body/instructions 17–19px, secondary 15–16px, CTA 20–22px; 13px eyebrow is nonessential only; progress/countdown remain large. Never use 11–12px customer instructions. Badge and small print can be smaller only if decorative. Disabled is native and explained, loading `role="status"` uses short labels; press locks sync until backend response. Session timeout and recovery stay backend-driven, with no unreviewed backward navigation.

## Frontend acceptance / architect dependencies

1. Screenshot+DOM geometry at 1920×1200, 1280×800, simulated 1536×960, 1024×640 and 853×533; title + subtitle/eyebrow presence variants; Back 56×56 circular; Back/title first-line center delta ≤4 CSS px and unchanged when only subtitle changes. Right-side badge cannot shift title/back. Touch targets do not overlap; chevrons symmetric ±4px around the *same art axis* and maintain centered SVG while pressing.
2. Screen-reader names have no layout IDs or production backend terms. Preserve title gesture test for payment and existing authorization; Back continues to dispatch `session.back` only when permitted. Multiple quick taps submit once; disabled/pending state visible. Carousel next/prev work without swipe, clamp at ends, and retain layout-selection/confirmation semantics currently implemented.
3. Welcome has no Firebase/temporary-cache/debug row; at least one right-side decorative print has 1:3 or 2:3 aspect as appropriate and a brand footer; photos are approved/locally licensed or art is honestly labeled illustrative. Confirm conditional marketing claims with architect (print time, video support, poster format/orientation). No V1 photo assets used.
4. Capture review: compare face-safe countdown location at both aspect ratios, and configured shot counts/countdown lengths; do not mutate live source or capture timing to animate UI. Inspect long Vietnamese titles, large text and 150% scaling; reduced motion disables travel but leaves stage status intact.
5. Update `frontend/src/screens/screens.test.tsx:44` (currently **expects** the diagnostic welcome row) and any layout ID assertions in the same frontend change, then run frontend tests/build and mounted kiosk screenshots. This handoff alone does not pass those tests or certify live hardware/payment/print.
