# LE SOUVENIR V2 — editorial touch design system

Phase 1 design handoff · 2026-10-30 · documentation only. Ownership: UI designer. No app implementation, font files, hardware tests, or visual screenshots are delivered here. Companion: `UI_SCREEN_CONTRACTS.md`. These two filenames are the delegated scope; they supersede no other audit document.

## 1. Direction and alternatives

**Option A — Gallery / margin countdown (selected).** Welcome is an ivory editorial spread: restrained wordmark, large two-line invitation, matte-black Start, and a gallery of available event bundles. Capture becomes a black photographic stage with a dedicated right-hand countdown rail. The image never sits behind text. This maximizes countdown contrast, preserves faces and avoids dashboard chrome.

**Option B — Contact sheet / overhead countdown.** Welcome centers the wordmark above a contact sheet of layout/bundle examples; Start spans its bottom edge. Capture puts a full-width numeric countdown band above the live preview with a compact bottom shutter. Better for very wide camera feeds, but the overhead band consumes vertical image height on a scaled 16:10 screen and the contact sheet competes with the primary action. Retain as a layout experiment, not a different flow.

Choose A for distance readability and predictable finger reach. Both options have identical controller commands and gates. No additional welcome tour, capture confirmation, standalone finish, or payment-success route is introduced. Imagery must be synthetic/authorized editorial samples or actual permitted frame thumbnails, never copied customer photos.

## 2. Tokens (proposed V2 presentation, not V1 business defaults)

| Token | Value / use |
|---|---|
| canvas | `#F6F2EA`, warm ivory |
| surface | `#FFFCF7`, card/dialog |
| ink / primary | `#191817`, text and CTA |
| ink-muted | `#625B53`, supporting text |
| champagne | `#B69A70`, decorative rules only, not small text on ivory |
| champagne-ink | `#715A36`, accent labels |
| rose | `#EAD8D3`, optional selected background |
| rose-ink | `#784940`, selected text |
| stage | `#101010`, camera surround |
| on-stage | `#FFFFFF` |
| danger | `#A62E2E`, error text with explicit icon/label |
| success | `#286044`, completed state label |
| focus | 3px `#715A36` with 3px ivory offset |
| spacing | 4, 8, 12, 16, 24, 32, 48, 64 CSS px |
| corners | 8 card, 12 control, 16 dialog; shutter circular |
| strokes | 1px decorative; selected outline 3px plus check label |

No gradients, frosted panes, oversized shadow stacks, animated backgrounds, or color-only status. Verify final rendered contrast >=4.5:1 ordinary text, >=3:1 large text and meaningful control outlines; these are requirements, not a claim of measured browser output.

Typography: system stack `Segoe UI, Arial, sans-serif`; optional locally licensed Korean/Vietnamese-capable system fallback. Editorial serif may be used in the Welcome headline only if installed with complete glyph coverage; do not ship unknown-license fonts. Wordmark tracking .12em; never apply tracking or uppercase transforms to instructions. Base body 20/30; compact 18/27; button 20/26 semibold; title 40/48; welcome 56/62; countdown clamp(112px, 17vh, 240px), tabular numerals. At compact height body may become 18/26 but controls must not shrink. Support Vietnamese diacritics and Korean glyphs without clipping.

## 3. Layout and scaling contract

All coordinates are **CSS pixels**, not a 1920px bitmap scaled with transforms. Read actual WebView viewport after Windows DPI conversion. Maintain target size at every DPI. Main shell: 32px outer margin, 80px header, 24px gaps, 88px footer; compact shell 16/64/16/80. Content scrolls independently above a nonoverlapping footer. Do not force a fixed 1200px canvas or globally zoom to fit.

| Physical display / OS scale | Approximate available CSS viewport before host insets |
|---|---|
| 1920×1200 /100%,125%,150% | 1920×1200, 1536×960, 1280×800 |
| 1280×800 /100%,125%,150% | 1280×800, 1024×640, about 853×533 |

Wide: width >=1400 and height >=900; standard: >=1100×700; compact otherwise. Height takes precedence. At <=1024 wide use two-column cards, scrollable admin categories, shorter headers; no horizontal page scroll. At ~853×533 use compact instructions and vertical scrolling for non-capture screens; fixed CTA must leave at least 240px usable content. Support other ratios by reflow, not stretching photos.

### Figma-friendly selected-option geometry

1920×1200 Welcome: margins 64; left invitation x64 y160 w680; right gallery x808 y144 w1048 h912; Start x64 y840 w600 h88. 1280×800: margins32; left x32 y112 w432; gallery x496 y96 w752 h600; Start x32 y584 w400 h80. Gallery may scroll with visible previous/next controls; event selection retains V1 semantics.

Capture 1920×1200: header x32 y24 w1856 h64; image well x32 y112 w1440 h1056; rail x1504 y112 w384 h1056. Capture 1280×800: header x16 y16 w1248 h56; image well x16 y88 w928 h696; rail x960 y88 w304 h696. Countdown rail includes phase, numeral, dynamic `Ảnh {completed}/{shotCount}` and shutter in LIVE_VIEW only. At ~853×533: header40, margins16, gap16, rail208, image well remaining width; image is contained, not clipped. Coordinates reserve wells, not image aspect ratios.

Image fit: live image `contain` on black, rotation/mirroring from backend metadata, never an unconditional CSS flip. Selection thumbnails may crop only for browsing and must offer an aspect-correct selected preview. Print/frame preview always contains the composed output at its true aspect, including strip/landscape variants. Never infer final print geometry from screen cards. QR gets opaque white background, module-safe integer rasterization, preserved quiet zone and no rounded clipping; target 256–320px where space permits, no decorative logo over code. Compact layout may scroll the supporting text rather than shrink QR arbitrarily.

## 4. Touch and interaction patterns

- `KioskButton`: minimum 64px high primary (80px Welcome); 48×48 secondary/icon, preferred 56; >=12px adjacent gap. Pending text remains visible, spinner supplementary. No hover dependence.
- `CommandButton`: latch on pointer release until authoritative acknowledgment/state change; do not use a debounce timer as proof of payment/print safety. Backend idempotency remains required. A held finger never repeats shutter, Print, quantity, or cancellation.
- `SelectableTile`: entire tile actionable, explicit check and selected count; semantic pressed/selected state; disabled reason visible. One physical gesture produces one toggle.
- `PhotoStage`: preview rendering isolated from React countdown updates; bounded latest-frame presentation; animations cannot block capture. Camera frame fallback is explicit, not a fake moving placeholder.
- `CountdownRail`: renders backend numeral and phase; never starts its own countdown, advances captures, or fabricates completion. Use numeric totals, not a fixed row of six dots.
- `TimedSelectionHeader`: backend remaining time and description of actual expiry action; local animation is not an independent timer.
- `CancellationMenu`: existing three-dot entry and confirmation only in photo/frame selection. Dialog focus trapped; default focus on continuing; discard copy explicitly states temporary-image deletion.
- `OperatorTabs`, `SettingsField`, `StatusNotice`, `AspectPreview`, `DeliveryQr`: reusable components, not independent workflow owners.

Use pointer-up activation, cancel on pointercancel or scrolling, browser text-selection/context menu suppression on customer controls only. Do not suppress native text editing globally in Admin. Swipes optional; always provide reachable scroll and previous/next controls for paged content. OS/browser Back must not become session navigation. No new global Home, Retake, Skip payment or Cancel controls.

Welcome's five-tap wordmark and Payment's header hold are source behaviors, not secure authentication. Preserve separately from ordinary button latching. **Proposal requiring owner/architect decision:** authenticated operator access and accessible operator alternative to the hold; do not silently remove the current cash gate or claim hidden gestures secure. No haptics assumed on Windows; optional feedback must never gate a command.

Motion: 120–180ms opacity/8px entrance for non-camera panels; press darkening rather than spring/bounce; no countdown crossfade that displays two numbers. Reduced motion: instantaneous layout/number changes and no flash or scale. Capture indicator may change label/border rather than full-screen white flash. Sound/haptics optional with permission, never sole notification.

## 5. Verification plan and current evidence

Geometry was reviewed arithmetically at six DPI-derived viewports above; no executable UI exists, so **browser scaling, contrast instrumentation, overflow, touch and distance readability NOT TESTED**. Frontend acceptance matrix must exercise each viewport, 200% text where supported, long Vietnamese layout names (2× expected length), Korean samples, 1/2/3-digit configured countdowns, large capture totals, portrait/landscape feed, no feed, reduced motion and forced-colors/focus visibility. Do not truncate price, count, selected-state or destructive-action text. Long names wrap to two lines then use a labeled detail view only if an existing action can provide it; otherwise allow card growth.

Pass gates: no overlapping actions; every target >=48 CSS px by DOM measurement; CTA reachable without mouse; full QR quiet zone visible; no countdown overlay intersects faces; no distorted live image; hidden admin and cancellation not exposed in other phases; no duplicate command from hold/double-tap; timers and async callbacks cannot migrate to a different session. Actual frontend and hardware evidence required before gate closure.
