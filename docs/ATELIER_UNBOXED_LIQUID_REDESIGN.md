# LE SOUVENIR V2 — Unboxed Atelier / Liquid Controls

**Status:** implementation handoff, **not a working UI or verified visual test**. Owner: UI designer. Frontend coder implements under V2 only. This proposal replaces the *current* increasingly opaque, boxed customer presentation, not session contracts. Existing `docs/DESIGN_SYSTEM.md` describes an earlier mounted treatment; where its 76%-white panels conflict with this proposal, use this document for the **next visual iteration**. Preserve the existing payment, selection, print, timeout, and navigation gates. Do not apply the customer skin to operator forms without separately testing readability.

## Audit of actual V2 markup and cascade

`frontend/src/screens/StartScreen.tsx` wraps two `LayoutArtwork` strips inside `.v1-start-card`; `QuantityScreen.tsx` wraps pricing in `.v1-panel.v1-quantity-pricing`; `PaymentScreen.tsx` renders separate `.v1-payment-summary.v1-panel` and `.v1-payment-qr-panel.v1-panel`; `FrameScreen.tsx` uses `.v1-frame-preview-panel`; `ConfirmScreen.tsx` uses `.v1-panel.v1-summary`; `PrepareScreen.tsx`, `PrintingScreen.tsx`, and `DeliveryScreen.tsx` each wrap the center stage in `.v1-panel`. `SelectPhotosScreen.tsx` uses a full-photo button grid and `PrintPreview`. Shared buttons and dock live in `KioskUI.tsx`. `frontend/src/kiosk-v1.css` has **many later repeated selectors**, including `!important` on primary and secondary controls and global `:is(.v1-panel,.v1-start-card,...)` rules. Simply editing an early rule will not change the rendered app. `screens/payment.css` also owns payment layout. Avoid unscoped `!important` stacking: consolidate existing late rules or import a new scoped `customer-atelier.css` **last** in the customer stylesheet order, after verifying imports. Leave `.v1-camera` dark and operator screens alone. Avoid treating `.v1-preview` as generic glass: photographs and printed paper require their own light physical substrate; QR itself needs a **plain high-contrast quiet zone**, not translucent glass.

### Two meaningful Welcome + Capture directions

| | Option A: Unboxed editorial (chosen) | Option B: darkroom diptych |
|---|---|---|
| Welcome | Left aligned headline and CTA directly on ivory canvas; right: two independently elevated paper strips in open space, tiny atelier caption, optional event chips. | Full-bleed dark photographic collage, white type over photo, floating glass CTA. |
| Capture | Black matte camera viewport, countdown in reserved side gutter, progress in independent top safe rail; framing line never over faces. | Ivory surround framing a smaller camera canvas; large central translucent countdown over live preview. |
| Kiosk rationale | A keeps copy legible when venue light changes and preview large while keeping countdown away from faces; fits 1280×800. | B depends on image brightness and occludes faces; smaller preview makes pose inspection harder. |

**Choose A.** A restrained ivory canvas may have *one* shallow, static radial ambient light at the art position; no multicolor gradients, animated gloss sweeps, or glass panel behind every paragraph. Liquid is a physical treatment for interactive controls and a limited number of essential contrast surfaces, **not** a screen-wide blur theme.

## Exact design tokens (customer scope)

Add one scoped token layer at customer shell (`.v1-shell.atelier-customer`, or a new `customerShell` class applied only to customer routes). Do not overwrite unrelated `--v-*` globally. Literal CSS proposal:

```css
.atelier-customer {
  --at-canvas: #f6f1ea;
  --at-canvas-light: #fbf8f3;
  --at-ink: #24201d;
  --at-secondary: #514842;
  --at-muted: #645950;
  --at-hairline: rgba(89, 65, 49, .19);
  --at-coral-1: #c27357;
  --at-coral-2: #a85a40;
  --at-coral-3: #8e442d;
  --at-glass: rgba(255,255,255,.65);
  --at-glass-rim: rgba(255,255,255,.85);
  --at-glass-shadow: 0 6px 18px rgba(45,30,20,.06);
  --at-paper-shadow: 0 22px 38px -13px rgba(44,30,23,.26), 0 5px 11px rgba(44,30,23,.13);
  --at-gap: clamp(16px, 2.1vw, 32px);
  --at-touch: 56px;
  color: var(--at-ink);
  background: radial-gradient(ellipse 48% 63% at 77% 46%, rgba(214,178,150,.19), transparent 86%), var(--at-canvas);
}
```

Text on glass must remain `--at-ink` / `--at-secondary`: do **not** place medium gray text on near-transparent white over busy imagery. Test measured WCAG AA 4.5:1 for text and 3:1 for large text and non-text controls against the **composited worst-case background**; if contrast fails, increase local opacity or use opaque ink, not a second card. QR payment and album codes: opaque `#fff`, black QR pixels and quiet zone supplied by QR renderer, minimum four QR modules on all sides; do not put highlights, opacity, tilt, backdrop blur, or overlay on QR.

Typography: brand/display `Georgia, 'Times New Roman', serif` (fallback only; no font files shared); Vietnamese hero copy preferably `system-ui, 'Segoe UI', sans-serif` because Georgia diacritics and line metrics vary. On supported machines optionally use Georgia only for English italic flourish and `LE SOUVENIR`; labels `Segoe UI, system-ui, sans-serif`. Hero `clamp(42px,4.7vw,82px)/1.08`, header `clamp(28px,2.5vw,42px)/1.15`, body `clamp(16px,1.25vw,20px)/1.45`, overline 12–14px with `.12em` tracking; prices `clamp(36px,3.3vw,64px)` tabular. Do not letter-space Vietnamese body text. Spacing scale 8/12/16/24/32/48/64 CSS px; preserve explicit 12px+ separation between adjacent targets. Finger targets at least 56×56 CSS px; primary at least 68px high; stepper 72×72px; hit area remains ≥56 when visuals are smaller. Respect Windows 100/125/150% scaling: use CSS px / `clamp`, intrinsic sizing, and overflow containers, not physical-pixel offsets.

## Liquid controls: implementable component contract

Keep `KioskPrimaryButton`, `KioskSecondaryButton`, `KioskBackButton`, `ActionBar` props and handler semantics in `KioskUI.tsx`. Add visual modifier classes (`atelier-button--primary`, `atelier-button--glass`, `atelier-dock`), do not replace actions with navigation links. The following rules are intended **after legacy conflicting CSS** and scoped to customer shell:

```css
.atelier-customer :is(.v1-primary,.v1-secondary,.v1-back,.v1-stepper button) {
  position: relative; isolation: isolate; overflow: hidden;
  touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  transition: transform 190ms cubic-bezier(.2,1.3,.3,1), box-shadow 190ms ease, filter 190ms ease;
}
.atelier-customer .v1-primary {
  min-height: 68px; border: 1px solid #793924; border-radius: 9999px;
  background: linear-gradient(135deg,#c27357 0%,#a85a40 50%,#8e442d 100%);
  color: #fff; font-size: clamp(17px,1.3vw,21px); font-weight: 700;
  letter-spacing: .025em;
  box-shadow: inset 0 1.5px 2px rgba(255,255,255,.45), 0 8px 24px rgba(168,90,64,.35);
}
.atelier-customer :is(.v1-secondary,.v1-back,.v1-stepper button) {
  min-height: 56px; border-radius: 9999px;
  background: rgba(255,255,255,.65); color: #24201d;
  border: 1px solid rgba(255,255,255,.85);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  backdrop-filter: blur(24px) saturate(180%);
  box-shadow: inset 0 1.5px 2px rgba(255,255,255,.95), 0 6px 18px rgba(45,30,20,.06);
}
.atelier-customer .v1-stepper button { width: 72px; height: 72px; }
.atelier-customer :is(.v1-primary,.v1-secondary,.v1-back,.v1-stepper button):active:not(:disabled) {
  transform: scale(.96); filter: brightness(.97);
}
.atelier-customer :is(.v1-primary,.v1-secondary,.v1-back,.v1-stepper button):focus-visible {
  outline: 3px solid #24201d; outline-offset: 4px;
}
.atelier-customer :is(.v1-primary,.v1-secondary,.v1-back,.v1-stepper button):disabled {
  opacity: 1; filter: none; transform: none; box-shadow: none;
  color: #514842; background: #dfd6cd; border: 1px solid #aaa098;
  cursor: not-allowed;
}
.atelier-customer .v1-actionbar {
  background: rgba(255,255,255,.65); border: 1px solid rgba(255,255,255,.85);
  border-radius: 28px; -webkit-backdrop-filter: blur(24px) saturate(180%);
  backdrop-filter: blur(24px) saturate(180%);
  box-shadow: inset 0 1.5px 2px rgba(255,255,255,.95), 0 10px 26px rgba(45,30,20,.09);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .atelier-customer :is(.v1-secondary,.v1-back,.v1-stepper button,.v1-actionbar) { background: #f2ebe4; }
}
@media (prefers-reduced-motion: reduce) {
  .atelier-customer :is(.v1-primary,.v1-secondary,.v1-back,.v1-stepper button) { transition: none; animation: none; }
}
```

**Cascade warning:** existing `.v1-shell .v1-primary { ... !important }` and `.v1-shell :is(...) { ... !important }` declarations **must be removed/consolidated** for these rules to win; do not append weaker CSS and call it complete. Keep `:hover` cosmetic only, never required to indicate clickability. Optional ripple: one clipped pseudo-element spawned on pointer down, maximum 300ms, `pointer-events:none`; never invoke `await` or block backend action for animation. Haptics: optional guarded `navigator.vibrate?.(8)` only where available and not in countdown; no functional dependency. Busy/pressed: visual lock immediately, persistent label `Đang xử lý…` if action can take >300ms; update by authoritative state/failed response, never by animation timeout. For one-shot irreversible confirm, do not silently re-enable after ambiguous transport failure.

## StartScreen: main stage, carefully composed

**Entrance:** catalog loading → CTA disabled and skeleton *paper silhouettes* (no fake photo); catalog ready → default configured layout selected; no available layout → plain inline help, CTA disabled. **Exit:** existing `onStart(layoutId)` only; event chip must preserve its existing selection/start semantics until a separately approved flow change. Current code selects then starts on a chip tap; do not label chips as mere previews while they actually start. Prevent duplicate onStart via existing `pressed` ref and busy flag; on failed action, parent owns recovery. Keep five-tap admin brand trigger discreet, no public admin button or printed PIN.

At 1920×1200: canvas safe padding 64–88, two columns 54%/46%, gap 48–72; left content vertically centered, brand top at y≈135, hero begins y≈360, CTA near y≈820 (never crop at 150% scaling). Right photo field occupies x≈1060–1770, y≈190–920; no enclosing rectangle. A portrait print sits rear left (rotation −7deg); a four-cut strip front right (rotation +6deg). At 1280×800: padding 28–40, left 54%, right 46%, hero max 56px, CTA height 68, photo field y≈145–645; bundle strip below field **only if** it fits; otherwise internal horizontal swipe strip with explicit visible arrow buttons ≥56. Keep structural sizes fluid, not fixed screenshot coordinates.

Suggested markup (presentation only; use real `LayoutArtwork`/approved event images, never customer imagery):

```tsx
<div className="atelier-welcome">
  <section className="atelier-welcome__copy">
    {/* existing brand trigger, kicker, headline, description, value pills, CTA */}
  </section>
  <aside className="atelier-welcome__gallery" aria-label="Mẫu bản in LE SOUVENIR">
    <span className="atelier-welcome__halo" aria-hidden="true" />
    <figure className="atelier-print atelier-print--portrait"><LayoutArtwork ... /></figure>
    <figure className="atelier-print atelier-print--strip"><LayoutArtwork ... /></figure>
    <span className="atelier-welcome__signature">LE SOUVENIR · PHOTO ATELIER</span>
    {/* event chips only when existing catalog bundles provide validated covers */}
  </aside>
</div>
```

Keep Vietnamese hero `Chụp ảnh / lấy ngay` and decorative `Yours forever.`; headline #24201D, subtle accent #a85a40. Value propositions `Bản in lưu niệm` / `Album ảnh qua QR` are small **borderless glass chips** (not nested white cards); reserve 8–12px gap. Primary `CHẠM ĐỂ BẮT ĐẦU →`: 68–80px high, ample horizontal padding, **only optional soft 3s opacity breathing** (no moving CTA); reduced motion off. Gallery must not obstruct CTA or become a fake tappable element. Code must not render fabricated fallback photo counts as user-facing promises; keep neutral illustrative artwork when catalog missing.

```css
.atelier-customer .atelier-welcome__gallery { position: relative; min-width: 0; min-height: 390px; isolation: isolate; }
.atelier-customer .atelier-welcome__halo { position:absolute; inset: 8% 0 0; border-radius: 50%; background: radial-gradient(ellipse,rgba(203,159,127,.21),transparent 69%); pointer-events:none; }
.atelier-customer .atelier-print { position:absolute; margin:0; padding:0; background:#fffdf9; border:1px solid rgba(68,44,29,.1); box-shadow:var(--at-paper-shadow); overflow:hidden; }
.atelier-customer .atelier-print--portrait { width:min(38%,230px); left:16%; top:12%; transform:rotate(-7deg); }
.atelier-customer .atelier-print--strip { width:min(28%,158px); left:54%; top:8%; transform:rotate(6deg); z-index:1; }
.atelier-customer .atelier-print :is(img,svg) { display:block; max-width:100%; height:auto; }
```

Use the **actual artwork's aspect** to set print dimensions (`layout.printAspectRatio`, with `aspect-ratio` + `object-fit:contain` when needed), never stretch strip photos to fill a rectangular card. Protect photos from accidental interactive overlay: gallery decorations `pointer-events:none`, event chips `pointer-events:auto`. If typography/localization overflows, shorten decorative flourish before reducing primary CTA or text below 16px.

## Screen-by-screen component changes (no new workflow stages)

| Existing screen | Entrance / principal user action / exit | Unboxed visual and state behavior |
|---|---|---|
| Layout / bundle chooser (where rendered) | Catalog/config driven; select existing layout/bundle → existing gate. | Borderless print artwork, label below, hairline/outline *only selected* state; preserve price/count metadata from backend, never hardcode. Empty catalog inline recovery. |
| `QuantityScreen` | Enter with allowed quantity options and pricing snapshot; ± changes local choice, CTA `session.setQuantity`; back `session.back`. | Remove background from `.v1-quantity-pricing`; plain typographic receipt rows and a single hairline before total. Large sculptural 72px glass circular ± flanking bare tabular numeral. Print preview is floating paper, not a padded panel. Disable ± at allowed bounds and CTA while busy; price explicitly stays “confirmed in next step” unless snapshot matches choice. |
| `PaymentScreen` | Enter creates payment link; poll `payment.checkStatus`; server paid advances; retry `payment.createLink`; existing back / staff-protected cash path only. | **One** calm layout: large total/rows directly on canvas at left, QR region at right on *one faint translucent perimeter* or visually borderless; QR image on opaque white quiet zone. No two equal-weight white cards. Payment pending uses warm amber status text; loading keeps reserved QR dimensions and a single spinner; error uses conspicuous plain-language help + Retry / Back. Never print PIN or staff bypass instructions on public customer screen. Existing hardcoded `1234`, mockComplete, and public staff tip in `PaymentScreen.tsx` are an **architect/security escalation**, not a design to perpetuate; do not alter payment rules independently; request architect to replace developer-only path with authorized staff control before public release. |
| `PrepareScreen` | Automated preparation → existing camera-ready transition; no customer skip. | Full warm canvas, giant editorial `Hãy nhìn vào ống kính`, one restrained illuminated ring / dot, config-sourced shot count/countdown in tiny readable inline line. Camera failure: explicit staff/help state from actual backend, not fictional retry action. |
| `CaptureScreen` | Live preview, `capture.startSequence` only on first live shot, countdown/capture automatic per backend; no back/skip invented. | Keep matte camera backdrop and aspect-correct image; live region dominates (~70–80% width). Reserve a **dark solid countdown gutter** along the side or outside camera image, numeral ≥120px at 1280 and ≥160px at 1920, white/off-white on black; keep crop mask unobstructed. Progress `Ảnh current/shotCount` plus segmented ticks generated from `layout.shotCount` in top rail. During capture or stream error show explicit stream/camera status without false completion; never put ring/countdown across faces. Existing image-ratio/crop/mirror behavior must remain correct; don't replace moving feed with CSS animation. |
| `SelectPhotosScreen` | Select via `selection.toggle`, `selection.confirm` only when `layout.selectCount` selected, back via existing action. | Photo tiles as image/paper with shadow and no thick white wrapper; order badge on safe corner; a clear coral selected perimeter outside image (doesn't cover faces). Lightbox should have a visible ≥56px close control **in addition to** hold-to-preview; preserve tap select. Disabled missing images show explicit caption. Show `selected/selectCount`, don't show example fixed counts. |
| `FrameScreen` | `frame.select`, then `frame.confirm`; existing tap-on-selected-frame confirms: label/affordance must make this clear or ask frontend owner to change only after contract review. | Print preview floats directly on canvas. Frame thumbnail artwork on subtle paper shadow, text underneath; selected coral rim/check *outside* picture. Preserve server preview/fallback semantics. Empty frames needs status and existing recovery, not fake default frame. |
| `ConfirmScreen` | Composed preview required; after 500ms armed, `print.confirmReal` or `print.confirmDryRun` once; back only where allowed. | Large actual final composite on paper at left, right **editorial ticket**: open rows, two hairlines, big total, small mode statement. Thin translucent accent behind **totals only** if necessary; no opaque white order card. CTA says `Xác nhận & in` for real vs simulated wording unchanged. Ambiguous print state: disabled and staff recovery, never second submit. |
| `PrintingScreen` | System progress driven by snapshot; no user skip/duplicate print. | Full-canvas atmospheric scene: fine horizontal sequence markers directly on canvas; liquid single active indicator. Existing current code marks first item active regardless of backend: **architect to map real statuses/events before claiming stages completed**. Failure message visible, do not imply printed paper from command acceptance alone. |
| `DeliveryScreen` / finish | QR from `snapshot.qrCodeUrl`; `session.finish` returns Welcome. | Center a valid QR on opaque white quiet zone with subtle paper shadow; success statement and print status free-floating; one small glass status badge. Missing QR: honest help and existing finish CTA, no fake QR. Retain demo/real difference, externally opened album only when approved URL valid. |
| Admin / Studio / settings / frames / bundles / revenue | Enter/exit via existing protected routes; all mutations use current controls/backend gates. | Separate operator theme: matte ivory surfaces, dense tables allowed when necessary, do not blindly delete borders needed for scanability; protect operator controls from public customer style scope. Explicit success/error/toast on settings writes; no fake device/printer results. |

## Interaction, responsiveness and verification gate

- Root customer layout: at 1920×1200 and 1280×800, safe padding `clamp(24px,3.5vw,72px)` and `min-height:0` on grid children; hero is not allowed to push CTA off-screen. At CSS viewport width <1100 **or** height <740, compress decorative art first; at narrow landscape below 900, stack or allow an internally scrollable information region while keeping CTA reachable. Verify 100%,125%,150% Windows scale at real device/browser reported viewport; 1280×800 physical at 150% may expose only ~853×533 CSS px. No global body scroll trap if content cannot fit: give the main content a bounded touch-scroll area and sticky, non-covering action dock. `overscroll-behavior:contain` for internal carousels, visible arrows always; no swipe-only access.
- Press feedback immediately on pointer down; pointer cancellation/move-out must not fire a queued click. Button actions remain `onClick` (keyboard/accessibility compatible). Duplicate irreversible actions guarded in handler and server command queue; for `session.back`, honor actual gate; avoid surprising backward navigation on long press. Timer/timeout copy originates from existing session snapshot; no new invented “pause session” action. Distinguish disabled/loading/error with text and not only color; `aria-live=polite` for non-countdown status, avoid announcing countdown 20 times a second.
- Images: photo artwork `object-fit:contain` or backend-known crop; asset `naturalWidth/naturalHeight` checked; visually mirror **live view only if current implementation already does**. Never mirror captured photos, print, QR, or selection tiles. No CSS transforms on payment/album QR. Animations: transform/opacity only, ≤220ms for controls, ≤350ms for staged entry, reduced-motion removes nonessential motion; avoid `filter:blur` animations on stream layer.
- Frontend acceptance: screenshot compare customer screens at 1920×1200, 1280×800, 150% equivalent CSS viewport, Windows font rendering and long Vietnamese title/event/bundle labels. Audit all screenshots for **no giant opaque white parent cards**, no cutoff CTA, face-safe countdown, QR scanning, prices visible, keyboard focus and touch target sizes. Exercise loading, no catalog, missing thumbnails, QR pending/error/paid, backend pricing change, frame empty, live stream interruption, rejected selection, confirm busy/ambiguous print, missing delivery QR, timeouts and return to Welcome. Run existing simulator tests but **do not** claim hardware verification; no real money or prints without explicit permission.

### Architect handoff (blocking questions, not design-invented behavior)

1. What authoritative backend event identifies each print/composition/album stage? If unavailable, show only generic progress and the reported status.
2. Does payment back remain permitted after link creation, and what is approved cancellation/timeout text? Keep calling existing `session.back`, let backend enforce.
3. What is the approved protected staff payment recovery route? Public source currently exposes a static PIN and cash override; do not surface these in customer-facing messages or consider them production-secure.
4. What camera live orientation/mirror contract applies to each device? Preserve existing renderer until camera owner confirms orientation and crop.

**Deliverable boundary:** specification only; no CSS/component implementation, hardware test, payment, print, or V1 modification was performed for this document.
