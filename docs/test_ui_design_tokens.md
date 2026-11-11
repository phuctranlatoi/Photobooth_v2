# LE SOUVENIR V2 — Design Tokens & Wireframe Proportions (Test Artifact)

**Document type:** Design token + layout proportion specification (test deliverable)
**Status:** Specification only — **no UI is implemented, rendered, or proven by this file.**
**Scope:** Touch-first Korean-photobooth visual identity for the primary 16:10 landscape customer display.
**Workspace:** `E:\HK1_2026_2027\PhotoboothDesktop_v2` (V2 only). V1 was read-only and is untouched.
**Author role:** Lead Kiosk UI/UX Designer (V2)

---

## 0. Read this first — what this document is and is not

### 0.1 What it is
- A **complete, self-contained token set** (color, type, spacing, radius, elevation, motion, touch sizing) with every color pair **numerically verified** for WCAG 2.1 contrast.
- **Wireframe layouts with exact pixel geometry** for the five requested screens at both 1920×1200 and 1280×800, expressed as proportional tables and ASCII diagrams.
- A map from each wireframe to the **real V2 session state and the real backend commands** it may dispatch — so the layout cannot drift into inventing workflow.

### 0.2 What it is NOT
- Not a working UI. A static document is not evidence that any screen renders, responds to touch, or survives a session.
- Not a business-logic change. No session transition, payment gate, print gate, cancellation rule, capture count, or countdown value is redefined here.
- Not a replacement for `docs/DESIGN_SYSTEM.md`, `docs/UI_DESIGN_SYSTEM.md`, or `docs/ADR/018-*`. Those remain the governing specs. **This file is a refinement proposal and must be reconciled against them before any implementation begins** (see §8, Reconciliation).

### 0.3 Hard constraints honoured
| Constraint | How this document respects it |
|---|---|
| Never hardcode capture counts / countdowns | Every count in the wireframes is written as `{layout.shotCount}`, `{layout.selectCount}`, `{layout.countdownSeconds}`, `{pricing.quantity}` — a *slot*, never a literal. |
| Do not invent buttons that bypass confirmation/payment gates | Every actionable element in §5 carries an explicit **Command** column mapping to an existing simulator/backend method. No "skip", "free print", "reprint", or public "paid" affordance appears. |
| Preserve V1 session flow | Wireframes map onto existing states only: `IDLE`, `SELECTING`, `LIVE_VIEW`/`COUNTDOWN`/`CAPTURING`, `SELECTING_PHOTOS`, `DELIVERY`. No new stage is created. |
| Kiosk is a public physical device | Minimum touch target 56 CSS px, primary 88, hero 104, shutter 176. No hover-only affordance. Every state has a non-color indicator. |
| No font files shared | Reuses the fonts **already vendored** in `frontend/node_modules/@fontsource` (`be-vietnam-pro`, `playfair-display`). No new font binary is introduced. |
| Readable across the booth | Countdown is 300 CSS px in a dedicated rail, **not** over the subject's face. |

---

## 1. Design direction

### 1.1 Concept — "Atelier Hanok"

A warm ivory gallery wall where photographs are the only ornament. The UI recedes to paper, hairlines, and one champagne accent; the only true "black" in the system is the camera stage, where black is functional (kills lens glare and gives the countdown a dark field). Soft rose appears **once per screen at most** — as the selected-state fill — so it never becomes a second brand color.

Three governing rules:

1. **Photograph first.** No screen puts a photo behind text. The live preview is always in its own uninterrupted well.
2. **One accent per screen.** Champagne = the single interactive accent. Rose = selection only. Nothing else is colored.
3. **Structure without boxes.** Cards are separated by whitespace and 1px champagne hairlines, not by stacked borders and shadows.

### 1.2 Color proportion targets

Applied as a **coverage ratio**, not a decoration rule. Verified against the wireframes in §5.

| Surface family | Share of a typical screen | Tokens |
|---|---|---|
| Warm ivory family (canvas / ivory / paper) | **≈ 82–88 %** | `--k-canvas`, `--k-ivory`, `--k-paper` |
| Matte black (camera stage only) | 0 % on 4 of 5 screens; **100 % on Camera View** | `--k-matte` |
| Champagne (accent, hairlines, numerals) | **≈ 6–10 %** | `--k-champagne`, `--k-champagne-deep`, `--k-champagne-tint` |
| Soft rose (selection fill only) | **≤ 3 %** | `--k-rose-tint`, `--k-rose` |
| Status colors (error / success) | **≤ 2 %**, only when a status exists | `--k-error`, `--k-success` |

---

## 2. Color tokens

### 2.1 Full token table

All values are sRGB hex. Contrast ratios in §2.3 are **computed** (WCAG 2.1 relative luminance), not eyeballed.

#### Surfaces

| Token | Value | Role | Notes |
|---|---|---|---|
| `--k-canvas` | `#F5EFE4` | Base screen background (warm ivory) | The dominant surface on Welcome / Bundle / Preview / QR |
| `--k-ivory` | `#FBF7F1` | Raised surface: cards, panels, the QR well | One step lighter than canvas — separates by luminance, not by shadow |
| `--k-paper` | `#FFFCF7` | Highest surface: print-preview mat, document-like areas | Reserved for "this is a physical print" contexts |
| `--k-champagne-tint` | `#EFE2CB` | Accent wash — hover, secondary highlight | Not usable as text background with champagne text (see §2.3) |
| `--k-rose-tint` | `#F3E1DC` | **Selected-state fill** (single use per screen) | |
| `--k-matte` | `#14110F` | Camera stage (Live View / Countdown / Capturing) | Kills lens glare; grounds the countdown numeral |
| `--k-matte-raised` | `#221E1A` | Raised panel on the matte stage (rail cards) | |

#### Ink

| Token | Value | Role |
|---|---|---|
| `--k-ink` | `#1C1917` | Headlines, prices, primary labels. Never pure black. |
| `--k-body` | `#4A4239` | Body copy, descriptions, receipt labels |
| `--k-muted` | `#6B6259` | Captions, metadata, secondary lines |
| `--k-disabled` | `#8A8177` | Disabled label + disabled border. UI-level contrast only (≥3:1), never used for meaningful copy. |

#### Accents

| Token | Value | Role |
|---|---|---|
| `--k-champagne` | `#C9A87C` | Accent fill on matte; large decorative numerals/rules |
| `--k-champagne-deep` | `#7F6136` | Accent **text** on ivory/paper; secondary CTA fill |
| `--k-champagne-ink` | `#75592F` | Accent text on `--k-champagne-tint` |
| `--k-rose` | `#E3C4BB` | Rose fill (surface only) |
| `--k-rose-ink` | `#7E4034` | Rose accent text |

#### Lines & focus

| Token | Value | Role |
|---|---|---|
| `--k-hairline` | `#D8CCBB` | 1px decorative divider. **Never the sole carrier of state.** |
| `--k-outline-champagne` | `#96733F` | Meaningful control outline / selected card border (≥3:1) |
| `--k-focus` | `#7F6136` | Focus ring: 3px solid + 3px offset in the surface color |
| `--k-stage-hairline` | `#4A423A` | Divider on the matte stage (decorative) |
| `--k-stage-outline` | `#7A6F63` | Control outline on the matte stage (≥3:1) |

#### Status

| Token | Value | Role |
|---|---|---|
| `--k-error` | `#8F3029` | Error text/label on light surfaces |
| `--k-success` | `#245C42` | Completed state label on light surfaces |
| `--k-stage-error` | `#C4614F` | Error on the matte stage |
| `--k-stage-success` | `#7FB79A` | Success on the matte stage |

### 2.2 Palette reference block

```css
:root {
  /* Surfaces */
  --k-canvas:        #F5EFE4;
  --k-ivory:         #FBF7F1;
  --k-paper:         #FFFCF7;
  --k-champagne-tint:#EFE2CB;
  --k-rose-tint:     #F3E1DC;
  --k-matte:         #14110F;
  --k-matte-raised:  #221E1A;

  /* Ink */
  --k-ink:           #1C1917;
  --k-body:          #4A4239;
  --k-muted:         #6B6259;
  --k-disabled:      #8A8177;

  /* Accents */
  --k-champagne:        #C9A87C;
  --k-champagne-deep:   #7F6136;
  --k-champagne-ink:    #75592F;
  --k-rose:             #E3C4BB;
  --k-rose-ink:         #7E4034;

  /* Lines & focus */
  --k-hairline:         #D8CCBB;
  --k-outline-champagne:#96733F;
  --k-focus:            #7F6136;
  --k-stage-hairline:   #4A423A;
  --k-stage-outline:    #7A6F63;

  /* Status */
  --k-error:        #8F3029;
  --k-success:      #245C42;
  --k-stage-error:  #C4614F;
  --k-stage-success:#7FB79A;
}
```

### 2.3 Contrast verification (measured)

Method: WCAG 2.1 relative luminance → `(L1+0.05)/(L2+0.05)`. Script used: `frontend/verify-palette.mjs` (see §9). **44 required pairs, 0 failures.**

| Foreground | Background | Ratio | Requirement | Result |
|---|---|---|---|---|
| `--k-ink` | `--k-canvas` | **15.28** | 4.5 | PASS |
| `--k-ink` | `--k-ivory` | **16.39** | 4.5 | PASS |
| `--k-ink` | `--k-paper` | **17.09** | 4.5 | PASS |
| `--k-ink` | `--k-champagne-tint` | **13.67** | 4.5 | PASS |
| `--k-ink` | `--k-rose-tint` | **13.84** | 4.5 | PASS |
| `--k-body` | `--k-canvas` | **8.62** | 4.5 | PASS |
| `--k-body` | `--k-ivory` | **9.24** | 4.5 | PASS |
| `--k-body` | `--k-paper` | **9.64** | 4.5 | PASS |
| `--k-body` | `--k-champagne-tint` | **7.71** | 4.5 | PASS |
| `--k-muted` | `--k-canvas` | **5.22** | 4.5 | PASS |
| `--k-muted` | `--k-paper` | **5.84** | 4.5 | PASS |
| `--k-muted` | `--k-champagne-tint` | **4.67** | 4.5 | PASS |
| `--k-champagne-ink` | `--k-canvas` | **5.69** | 4.5 | PASS |
| `--k-champagne-ink` | `--k-champagne-tint` | **5.09** | 4.5 | PASS |
| `--k-champagne-deep` | `--k-canvas` | **5.01** | 4.5 | PASS |
| `--k-champagne-deep` | `--k-paper` | **5.60** | 4.5 | PASS |
| `--k-rose-ink` | `--k-canvas` | **6.87** | 4.5 | PASS |
| `--k-rose-ink` | `--k-rose-tint` | **6.22** | 4.5 | PASS |
| `--k-rose-ink` | `--k-rose` | **4.82** | 4.5 | PASS |
| `--k-error` | `--k-ivory` | **7.50** | 4.5 | PASS |
| `--k-error` | `--k-canvas` | **7.00** | 4.5 | PASS |
| `--k-success` | `--k-ivory` | **7.33** | 4.5 | PASS |
| `--k-success` | `--k-canvas` | **6.84** | 4.5 | PASS |
| `--k-ivory` | `--k-matte` | **17.62** | 4.5 | PASS |
| `--k-ivory` | `--k-matte-raised` | **15.51** | 4.5 | PASS |
| `--k-champagne` | `--k-matte` | **8.39** | 4.5 | PASS |
| `#E0C79E` (champagne-light) | `--k-matte` | **11.49** | 4.5 | PASS |
| `--k-stage-error` | `--k-matte` | **4.63** | 4.5 | PASS |
| `--k-stage-success` | `--k-matte` | **8.19** | 4.5 | PASS |
| `--k-matte` | `--k-champagne` | **8.39** | 4.5 | PASS |
| `--k-ivory` | `--k-champagne-deep` | **5.37** | 4.5 | PASS |
| `--k-ivory` | `--k-rose-ink` | **7.37** | 4.5 | PASS |
| `--k-ivory` | `--k-error` | **7.50** | 4.5 | PASS |
| `--k-ivory` | `--k-success` | **7.33** | 4.5 | PASS |
| `--k-focus` | `--k-canvas` | **5.01** | 3.0 | PASS |
| `--k-focus` | `--k-ivory` | **5.37** | 3.0 | PASS |
| `--k-focus` | `--k-paper` | **5.60** | 3.0 | PASS |
| `--k-focus` | `--k-rose-tint` | **4.53** | 3.0 | PASS |
| `--k-outline-champagne` | `--k-ivory` | **4.08** | 3.0 | PASS |
| `--k-outline-champagne` | `--k-paper` | **4.26** | 3.0 | PASS |
| `--k-outline-champagne` | `--k-rose-tint` | **3.45** | 3.0 | PASS |
| `--k-stage-outline` | `--k-matte` | **3.83** | 3.0 | PASS |
| `--k-disabled` | `--k-canvas` | **3.34** | 3.0 | PASS |
| `--k-disabled` | `--k-paper` | **3.74** | 3.0 | PASS |

**Anti-patterns — these are intentionally NOT usable for text** and are asserted to stay low-contrast so a mistake is visible in review:

| Pair | Ratio | Rule |
|---|---|---|
| `--k-hairline` on `--k-canvas` | 1.38 | Hairlines are decorative. State must also be carried by a border, icon, or label. |
| `--k-stage-hairline` on `--k-matte` | 1.91 | Same rule on the stage. |
| `--k-rose` on `--k-canvas` | 1.42 | Rose is a **surface**, never a text color. Use `--k-rose-ink` on it. |
| `--k-champagne-tint` on `--k-canvas` | 1.12 | Same — surface only. |
| `--k-ink` on `--k-matte` | 1.08 | **Ink must never be used on the matte stage.** Use `--k-ivory` / `--k-champagne`. |

### 2.4 Color usage rules
1. One accent per screen. If a screen shows both champagne *and* rose as interactive states, the rose is selection-only.
2. Status is never color-only. Every error/success carries an icon **and** a text label.
3. Champagne text on light surfaces uses `--k-champagne-deep` (5.01) or `--k-champagne-ink` (5.09) — never bare `--k-champagne` (2.70 on canvas).
4. `--k-rose` and `--k-champagne-tint` are fills. Text placed on them uses the matching `-ink` variant.
5. On the matte stage, the only legal inks are `--k-ivory`, `--k-champagne`, `#E0C79E`, `--k-stage-error`, `--k-stage-success`.

---

## 3. Typography

### 3.1 Families

| Token | Stack | Weights | Coverage / why |
|---|---|---|---|
| `--k-font-ui` | `'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif` | 400 / 500 / 600 / 700 | **Already vendored** (`@fontsource/be-vietnam-pro`). Full Vietnamese diacritics — the product's primary customer language. |
| `--k-font-display` | `'Playfair Display', 'Be Vietnam Pro', serif` | 400 / 500 / 600 / 700 + italics | **Already vendored** (`@fontsource/playfair-display`). Editorial serif for the Welcome headline and the price total only. |
| `--k-font-fallback` | `system-ui, 'Segoe UI', 'Malgun Gothic', 'Noto Sans KR', sans-serif` | — | Hangul + Latin fallback chain. |

> **Known gap (not solved here):** neither vendored family contains Hangul glyphs. Korean copy would fall back to the OS chain with a visible metric break. If Korean-language UI is ever required, a licensed Hangul face must be added and the Vietnamese/Latin line-heights re-verified. **No font binary is added by this document.**

### 3.2 Type scale

Sizes are **CSS px at the 1920×1200 / 100 % baseline**. The 1280 column is the 2/3-scale value. Control labels never shrink below the compact value, even when the body copy does.

| Token | 1920 | 1280 | Family / weight | Line height | Tracking | Applied to |
|---|---|---|---|---|---|---|
| `--k-t-hero` | **72 px** | 52 px | Display 500 | 1.06 | −0.03em | Welcome headline |
| `--k-t-hero-accent` | 42 px italic | 30 px italic | Display 400 italic | 1.10 | −0.02em | "Yours forever." accent line |
| `--k-t-title` | **42 px** | 30 px | UI 600 | 1.15 | −0.02em | Screen title |
| `--k-t-section` | 28 px | 22 px | UI 600 | 1.25 | −0.01em | Panel / card heading |
| `--k-t-body` | **22 px** | 18 px | UI 400 | 1.55 | 0 | Body copy |
| `--k-t-caption` | 18 px | 16 px | UI 400 | 1.45 | 0 | Captions, metadata, receipt labels |
| `--k-t-eyebrow` | 14 px | 13 px | UI 600 | 1.0 | **+0.18em**, uppercase | Step badge, eyebrow labels |
| `--k-t-button` | 22 px | 20 px | UI 600 | 1.2 | 0 | Button labels |
| `--k-t-price` | 38 px | 28 px | UI 700 `tabular-nums` | 1.10 | −0.01em | Totals |
| `--k-t-countdown` | **300 px** | 200 px | UI 800 `tabular-nums` | 1.0 | −0.03em | Countdown numeral (rail) |

### 3.3 Typography rules
- **Numerals are always `tabular-nums`** wherever a value can change in place: countdown, `{captured}/{shotCount}`, quantity stepper, price, timer. Proportional numerals cause a visible width jump that reads as a glitch on a kiosk.
- Tracking and uppercase transforms apply **only** to eyebrows/wordmarks. Never to instructions, prices, or button labels.
- Body copy is 22/34 at the flagship. It is never dropped below 18/27 for content — only non-control chrome may compress.
- Headline max width ≈ **16 characters per line** at 72 px, to keep the Welcome headline a shape rather than a paragraph.
- Long catalog names wrap to **two lines** then ellipsize with a visible full name in the card's detail row — never truncated mid-word without a labelled detail affordance.

---

## 4. Spacing, radius, elevation, motion, touch

### 4.1 Spacing scale (4 px base)

| Token | px | Typical use |
|---|---|---|
| `--k-space-1` | 4 | Icon inset, pip gap |
| `--k-space-2` | 8 | Label↔value gap inside a row |
| `--k-space-3` | 12 | Chip padding, tight row gap |
| `--k-space-4` | 16 | Card internal padding (compact), grid gutter |
| `--k-space-5` | 24 | Grid gutter (flagship), card internal padding (flagship) |
| `--k-space-6` | 32 | Gap between cards / carousel gap |
| `--k-space-7` | 48 | Column gap, section gap |
| `--k-space-8` | 64 | Major block separation |
| `--k-space-9` | 96 | Vertical rhythm between major zones |
| `--k-space-10` | 128 | Dock internal breathing room |

**Grid gutters:** 24 px flagship, 16 px compact. **Column gap:** 48 px flagship, 32 px compact.

### 4.2 Radius

| Token | px | Use |
|---|---|---|
| `--k-radius-sm` | 10 | Chips, small badges, pips |
| `--k-radius-control` | 14 | Buttons, inputs, tiles |
| `--k-radius-card` | 18 | Cards, panels, the QR card |
| `--k-radius-pill` | 999 | Primary CTA, stepper, chips |
| `--k-radius-round` | 50% | Shutter button, pips, dot indicators |

### 4.3 Elevation (2 levels only + paper)

| Token | Value | Use |
|---|---|---|
| `--k-shadow-1` | `0 2px 10px rgba(35,25,16,.05)` | Resting card |
| `--k-shadow-2` | `0 14px 34px -12px rgba(35,25,16,.18)` | Lifted / selected card, QR card |
| `--k-shadow-paper` | `0 18px 40px -14px rgba(44,30,23,.26), 0 4px 10px rgba(44,30,23,.10)` | Physical print previews only |

No stacked shadow stacks, no colored glows, no glassmorphism — a frosted panel over a photograph destroys the photograph.

### 4.4 Motion

| Token | Value | Use |
|---|---|---|
| `--k-motion-fast` | 120 ms | Press feedback, chip toggle |
| `--k-motion-base` | 200 ms | Screen handoff, card select |
| `--k-motion-slow` | 320 ms | Carousel settle, modal in |
| `--k-motion-countdown` | 900 ms | One countdown tick (numeral scales 1 → 0.92, opacity 1 → 0.35) |
| `--k-ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entrances, handoffs |
| `--k-ease-press` | `cubic-bezier(0.2, 0.8, 0.25, 1)` | Press/active states |

- **Screen handoff:** opacity 0 → 1 + `translateY(12px)` → 0 over `--k-motion-base`, `--k-ease-out`.
- **Press:** `scale(0.96)` + 4 % brightness reduction over `--k-motion-fast`. A held finger never repeats a command.
- **Countdown:** the numeral is replaced, never cross-faded — two numerals must never be visible at once.
- **Reduced motion (`prefers-reduced-motion: reduce`):** no scale, no flash, no parallax, no aurora. Only opacity ≤120 ms and instant numeric replacement. The countdown numeral changes value instantly and the phase label changes instead of animating.
- **No full-screen white flash** on capture. The shutter ring contracts and the stage rail's status chip flips to "ĐANG CHỤP". This is a deliberate deviation from V1's flash and needs architect sign-off on the capture feedback contract.

### 4.5 Touch sizing

| Token | 1920 | 1280 | Use |
|---|---|---|---|
| `--k-touch-min` | 56 | 48 | Any interactive element, absolute floor |
| `--k-touch-gap` | 16 | 12 | Minimum gap between adjacent targets |
| `--k-touch-primary-h` | 88 | 64 | Primary CTA height |
| `--k-touch-hero-h` | 104 | 80 | Welcome hero CTA |
| `--k-touch-shutter` | 176 | 132 | Shutter button diameter |
| `--k-touch-carousel-arrow` | 96 | 64 | Prev / next arrows |

Adjacent targets are separated by at least `--k-touch-gap`. A tap produces exactly one command — press is latched on `pointerup` and released only on an authoritative state change, never on a timer.

---

## 5. Wireframe layouts

### 5.0 Shell geometry (shared)

The kiosk shell is a fixed vertical rhythm. **1920×1200 and 1280×800 are both exactly 16:10**, so the compact layout is a clean **2/3 scale** of the flagship, rounded down to the 4 px grid.

| Element | 1920×1200 | 1280×800 | Notes |
|---|---|---|---|
| Horizontal padding | 48 | 32 | |
| Vertical padding | 40 | 24 | |
| Header band | y 40 → 136 (h 96) | y 24 → 88 (h 64) | Wordmark on Welcome; step + title elsewhere |
| Content band | y 176 → 1016 (h 840) | y 104 → 688 (h 584) | Scrolls independently if content overflows |
| Bottom dock | y 1056 → 1160 (h 104) | y 704 → 776 (h 72) | Pinned, never overlaps content |
| Grid gutter | 24 | 16 | |
| Column gap | 48 | 32 | |

**Camera View is the exception:** it is a full-bleed matte stage with no ivory shell, no header band, and no dock.

---

### 5.1 Welcome Screen — `IDLE`

**Purpose:** Greet, present the available event bundles, and start a session.
**Entry:** `IDLE`. **Exit:** `session.start(layoutId)` → `SELECTING`.
**Data:** `catalog.layouts`, `catalog.bundles` (`id`, `name`, `coverDataUrl`, `layoutId`, `frameCount`), `catalog.defaultLayoutId`, `catalogSource`.

#### Option A — Editorial split *(CHOSEN)*

```
1920 x 1200                                        1280 x 800
┌──────────────────────────────────────────────┐  ┌────────────────────────────────────────┐
│ LE SOUVENIR                          (admin) │  │ LE SOUVENIR                    (admin) │
│                                              │  │                                        │
│  ┌──────────────────┐  ┌───────────────────┐ │  │  ┌──────────────┐  ┌─────────────────┐ │
│  │  Lưu giữ khoảnh  │  │ ┌─────┐ ┌─────┐   │ │  │  │  Lưu giữ     │  │ ┌────┐ ┌────┐   │ │
│  │  khắc thanh      │  │ │BUNDLE│ │BUNDLE│  │ │  │  │  khoảnh khắc │  │ │ BND│ │ BND│  │ │
│  │  xuân            │  │ │  01  │ │  02  │   │ │  │  │  thanh xuân  │  │ │ 01 │ │ 02 │   │ │
│  │  Yours forever.  │  │ └─────┘ └─────┘   │ │  │  │  Yours fvr.  │  │ └────┘ └────┘   │ │
│  │  ─────           │  │ ┌─────┐ ┌─────┐   │ │  │  │  ─────       │  │ ┌────┐ ┌────┐   │ │
│  │  Chụp ảnh ngay   │  │ │BUNDLE│ │BUNDLE│  │ │  │  │  Chụp ảnh    │  │ │ BND│ │ BND│  │ │
│  │  tại studio      │  │ │  03  │ │  04  │   │ │  │  │  ngay       │  │ │ 03 │ │ 04 │   │ │
│  │                  │  │ └─────┘ └─────┘   │ │  │  │               │  │ └────┘ └────┘   │ │
│  │  ┌────────────┐  │  │  name · layout · ₫  │ │  │  │ ┌──────────┐ │  │  name · layout   │ │
│  │  │ CHỤP ẢNH,  │  │  └───────────────────┘ │  │  │  │ CHỤP ẢNH │ │  │ └─────────────────┘ │
│  │  │ BẤM NGAY   │  │                        │ │  │  │ ẢNH, BẤM │ │  │                      │ │
│  │  └────────────┘  │                        │ │  │  │ NGAY     │ │  │                      │ │
│  │  Chọn bố cục yêu  │                        │ │  │  └──────────┘ │  │                      │ │
│  │  thích           │                        │ │  │  Chọn bố cục    │  │                      │ │
│  └──────────────────┘  └───────────────────┘ │  │  └──────────────┘ │  │                      │ │
│                     ▲             ▲          │  │       ▲            │  │                      │ │
│              COPY COLUMN      BUNDLE GALLERY  │  │   COPY COLUMN     │  │   BUNDLE GALLERY    │ │
└──────────────────────────────────────────────┘  └────────────────────────────────────────┘
```

**Exact geometry — 1920×1200**

| Block | x | y | w | h | Fill / type |
|---|---|---|---|---|---|
| Wordmark | 48 | 40 | 320 | 64 | `--k-ink`, display, tracking +0.12em. **Five-tap admin trigger preserved.** |
| Copy column | 48 | 232 | **720** | 840 | transparent |
| Headline | 48 | 232 | 720 | 210 | `--k-t-hero`, `--k-ink` |
| Editorial accent | 48 | 452 | 720 | 56 | `--k-t-hero-accent`, `--k-champagne-deep` |
| Accent rule | 48 | 528 | 64 | 2 | `--k-champagne` |
| Description | 48 | 560 | 640 | 80 | `--k-t-body`, `--k-body` |
| **Hero CTA** | 48 | 856 | **560** | **104** | `--k-matte` fill, `--k-ivory` label, radius pill. `--k-touch-hero-h` |
| CTA note | 48 | 976 | 640 | 40 | `--k-t-caption`, `--k-muted` |
| Gallery panel | 816 | 176 | **1056** | **840** | transparent |
| Bundle card 01 | 816 | 176 | 516 | 408 | `--k-ivory` fill, `--k-shadow-1`, radius 18 |
| Bundle card 02 | 1356 | 176 | 516 | 408 | ↑ |
| Bundle card 03 | 816 | 608 | 516 | 408 | ↑ |
| Bundle card 04 | 1356 | 608 | 516 | 408 | ↑ |

**Bundle card internal (516×408)**

| Element | x (rel) | y (rel) | w | h | Fill / type |
|---|---|---|---|---|---|
| Cover image | 0 | 0 | 516 | 300 | `object-fit: contain` on `--k-paper`; **aspect never distorted** |
| Caption band | 0 | 300 | 516 | 108 | `--k-ivory`, top hairline `--k-hairline` |
| Bundle name | 24 | 320 | 468 | 34 | `--k-t-section`, `--k-ink` |
| Layout + price | 24 | 358 | 468 | 34 | `--k-t-caption`, `--k-muted` / price `--k-ink` `tabular-nums` |

**Compact geometry — 1280×800**

| Block | x | y | w | h |
|---|---|---|---|---|
| Wordmark | 32 | 24 | 220 | 44 |
| Copy column | 32 | 152 | **480** | 584 |
| Headline | 32 | 152 | 480 | 148 |
| Editorial accent | 32 | 306 | 480 | 38 |
| Accent rule | 32 | 356 | 48 | 2 |
| Description | 32 | 376 | 440 | 56 |
| **Hero CTA** | 32 | 576 | **380** | **80** |
| CTA note | 32 | 664 | 440 | 28 |
| Gallery panel | 544 | 104 | **704** | 584 |
| Bundle card 01 | 544 | 104 | 344 | 284 |
| Bundle card 02 | 904 | 104 | 344 | 284 |
| Bundle card 03 | 544 | 404 | 344 | 284 |
| Bundle card 04 | 904 | 404 | 344 | 284 |

**Bundle card internal (344×284):** cover 344×200 (contain, `--k-paper`); caption band 344×84; name at (16, 214) `--k-t-caption` semibold; layout/price at (16, 244) `--k-t-caption` `--k-muted`.

**Interactions**

| Target | Behavior | Command |
|---|---|---|
| Bundle card | Tap → select (rose-tint fill + `--k-outline-champagne` 2px border + a check glyph + text "Đã chọn"). Second tap on the selected card → start. | `session.start(layoutId)` on confirm |
| Hero CTA | Latch on `pointerup` until the backend acknowledges. Disabled while `busy` or the catalog is unavailable. | `session.start(layoutId)` |
| Wordmark | **Five taps** → Admin. Preserved exactly as V1; not authentication. | `admin.open` |

**States**
- *Catalog unavailable* (`catalogSource === 'UNAVAILABLE'` or zero layouts): the gallery shows an explicit empty-state message ("Chưa có bố cục khả dụng. Vui lòng liên hệ nhân viên."), and the hero CTA is **disabled** with the reason visible. The app does **not** fabricate a layout.
- *Loading:* the gallery region shows a reserved skeleton of the same 4 card footprints so nothing reflows when data lands.
- *Disabled CTA:* `--k-disabled` label, `--k-disabled` border, plus a visible reason line. Never a silent dead button.

---

### 5.2 Bundle Selector — `SELECTING`

**Purpose:** Choose the print layout / bundle that will be captured and printed.
**Entry:** `SELECTING` (from `session.start`). **Exit:** `session.confirmSetup` → `SELECTING_QUANTITY`.
**Data:** `catalog.layouts[]` with `id`, `title`, `subtitle`, `printAspectRatio`, `photoAspectRatio`, `shotCount`, `selectCount`, `countdownSeconds`, `printSizeLabel`, `basePrice`.

> This screen shows **layouts**, and `bundles` are surfaced on the Welcome gallery. Quantity (`SELECTING_QUANTITY`) and Payment (`PAYMENT_PENDING`) are **separate existing screens** and are deliberately **not** merged into this wireframe — merging them would invent a stage that V1 does not have.

**Geometry — 1920×1200**

| Block | x | y | w | h | Notes |
|---|---|---|---|---|---|
| Header band | 48 | 40 | 1824 | 96 | Back button (left, 64×64 circle), eyebrow "Bước 1", title "Chọn bố cục" |
| Carousel viewport | 48 | 176 | 1824 | 700 | Horizontal, scroll-snapped, centered |
| Layout card (×4 visible) | 240 | 216 | **336** | 560 | gap 32; 4×336 + 3×32 = 1440, centered → x 240 |
| — artwork well | 0 | 0 | 336 | 400 | Aspect from `printAspectRatio`, `contain` on `--k-paper`, radius 18 |
| — title | 0 | 416 | 336 | 48 | `--k-t-section`, `--k-ink` |
| — meta row | 0 | 470 | 336 | 40 | `--k-t-caption`: `{printSizeLabel} · {shotCount} lượt chụp · {selectCount} ảnh chọn` |
| — price | 0 | 508 | 336 | 40 | `--k-t-price` `--k-ink` `tabular-nums` |
| Prev arrow | 120 | 456 | 96 | 96 | Round, `--k-ivory`, `--k-shadow-2`, chevron 28px |
| Next arrow | 1704 | 456 | 96 | 96 | ↑ |
| Position indicator | 48 | 916 | 1824 | 100 | `{index+1} / {total}` + active layout title + hairline |
| **Confirm CTA** | 1248 | 1056 | 624 | 88 | `--k-matte` fill, `--k-ivory` label, radius pill |

**Geometry — 1280×800**

| Block | x | y | w | h |
|---|---|---|---|---|
| Header band | 32 | 24 | 1216 | 64 |
| Carousel viewport | 32 | 104 | 1216 | 470 |
| Layout card (×3 visible) | 280 | 132 | **224** | 372 | 3×224 + 2×24 = 720, centered → x 280 |
| Prev / Next arrow | 64 / 1148 | 256 | 64 | 64 |
| Position indicator | 32 | 592 | 1216 | 80 |
| **Confirm CTA** | 832 | 704 | 416 | 64 |

**Compact layout card (224×372):** artwork 224×252; title at (0, 266) `--k-t-caption` semibold; meta at (0, 300); price at (0, 330) `--k-t-price`.

**Selection model**
- Tap a side card → it scrolls to center and becomes the active layout (`session.setLayout`). The centered card is scaled 1.0; side cards 0.88 and 60 % opacity.
- Tap the centered card **or** the Confirm CTA → `session.confirmSetup`. The CTA exists because a kiosk user cannot be expected to discover "tap the middle card again"; it dispatches the **same existing command** and adds no new gate.
- **Selected state** is carried by three signals, not color alone: a 2px `--k-outline-champagne` border, a corner check glyph, and the card title in `--k-ink` semibold.

**States**
- *Zero layouts:* explicit empty state in the carousel viewport; the Confirm CTA is disabled with a visible reason.
- *Disabled arrows:* hidden **or** shown at `--k-disabled` when only one layout exists — a hidden control that reappears on data change is worse than a visibly disabled one.
- *Busy:* all cards and arrows disabled; the pressed card shows a pending indicator; the CTA latches.

---

### 5.3 Camera View — `LIVE_VIEW` / `COUNTDOWN` / `CAPTURING`

**Purpose:** Frame the subject, run the configured countdown, capture the configured number of shots.
**Entry:** `PREPARING` → `LIVE_VIEW`. **Exit:** capture sequence complete → `SELECTING_PHOTOS`.
**Data:** live preview stream (`livePreviewDataUrl` + real aspect + orientation metadata), `layout.shotCount`, `layout.countdownSeconds`, `layout.photoAspectRatio`, `capturedCount`, `snapshot.cameraConnected`.

**This is the one screen that is 100 % matte black.** It is a camera stage, not a page.

**Geometry — 1920×1200**

| Block | x | y | w | h | Notes |
|---|---|---|---|---|---|
| Stage (full bleed) | 0 | 0 | 1920 | 1200 | `--k-matte` |
| Top status strip | 48 | 40 | 1824 | 64 | `--k-stage-outline` hairline bottom |
| — shot counter (left) | 48 | 40 | 480 | 64 | `Ảnh {capturedCount+1}/{shotCount}` — `--k-ivory`, `--k-t-section` |
| — layout title (right) | 1392 | 40 | 480 | 64 | `--k-muted`→`--k-ivory` at 70 %, right-aligned, `--k-t-caption` |
| **Image well** | 48 | 128 | **1320** | **1024** | Live image `contain`, true aspect, no crop, no flip unless the backend says mirrored |
| — crop guides | — | — | — | — | 2px `--k-stage-outline` thirds + edge ticks only; **never over the face centre** |
| **Right rail** | 1424 | 128 | **448** | **1024** | `--k-matte-raised`, radius 18 |
| — phase eyebrow | 1456 | 176 | 384 | 32 | "SẴN SÀNG" / "ĐANG ĐẾM NGƯỢC" / "ĐANG CHỤP" — `--k-champagne`, `--k-t-eyebrow` |
| — **countdown numeral** | 1456 | 216 | 384 | 320 | `--k-t-countdown` (300px), `#E0C79E`, `tabular-nums`, centred in rail |
| — progress pips | 1456 | 560 | 384 | 24 | **`{shotCount}` pips**, 24px round; filled = captured; plus numeric `{capturedCount}/{shotCount}` |
| — progress label | 1456 | 596 | 384 | 40 | `--k-t-caption`, `--k-ivory` |
| — divider | 1456 | 656 | 384 | 1 | `--k-stage-hairline` |
| — **shutter** | 1560 | 700 | **176** | **176** | Round, `--k-ivory` ring 3px + `--k-matte` core, `--k-shadow-2` |
| — shutter caption | 1456 | 900 | 384 | 40 | "Chạm để chụp" — `--k-t-caption`, `--k-ivory` |
| — shutter helper | 1456 | 948 | 384 | 40 | "Giữ yên 3 giây" only when `countdownSeconds` is configured |

**Geometry — 1280×800**

| Block | x | y | w | h |
|---|---|---|---|---|
| Stage | 0 | 0 | 1280 | 800 |
| Top status strip | 32 | 24 | 1216 | 44 |
| **Image well** | 32 | 84 | **880** | **692** |
| **Right rail** | 928 | 84 | **320** | **692** |
| — phase eyebrow | 952 | 116 | 272 | 24 |
| — **countdown numeral** | 952 | 146 | 272 | 220 | (`--k-t-countdown` 200px) |
| — progress pips | 952 | 380 | 272 | 20 | 20px pips, `{shotCount}` of them |
| — progress label | 952 | 406 | 272 | 32 |
| — divider | 952 | 448 | 272 | 1 |
| — **shutter** | 1032 | 480 | **132** | **132** |
| — shutter caption | 952 | 626 | 272 | 32 |

**Countdown readability (the core requirement)**
- The numeral sits in a dedicated 448 px rail, **not** over the subject. A face is never occluded.
- 300 px tall at the flagship is legible at ≈3 m (the numeral cap-height ≈ 216 px). Tabular figures mean the glyph does not shift between ticks.
- The phase eyebrow changes **before** the numeral appears, so a customer knows what the number means.
- The `{capturedCount}/{shotCount}` readout is always visible in the top strip, so a customer can see progress without reading the countdown.
- **Every count is a slot.** If `shotCount` is 2, there are 2 pips. If it is 12, 12 pips wrap to two rows in the rail. A fixed six-dot row is forbidden.

**States**
| State | Presentation |
|---|---|
| `LIVE_VIEW` | Shutter visible and enabled; numeral area shows a soft champagne hairline frame (idle), no digit. |
| `COUNTDOWN` | Numeral counts down from the configured `countdownSeconds`. **Shutter hidden** — no way to interrupt a running capture. |
| `CAPTURING` | Numeral replaced by the word "ĐANG CHỤP"; a champagne shutter-ring contraction; status chip in the top strip. No full-screen white flash. |
| Between shots | Returns to `LIVE_VIEW` with the shot counter advanced and the next pip filled. |
| No camera feed | The image well shows an explicit status ("Đang chờ hình ảnh từ máy ảnh…"), the shutter is **disabled**, and the reason is stated. A fake animated placeholder is forbidden. |
| `busy` (command in flight) | Shutter disabled, ring dims to `--k-stage-outline`, no second command is issued. |

**Anti-quirk rules**
- One physical gesture = one command. A held finger never fires the shutter twice; the shutter is latched on `pointerup` until the backend acknowledges the phase change.
- The live preview render is isolated from countdown re-renders, so a ticking timer cannot drop frames on the camera stream.
- Camera orientation/mirroring comes from backend metadata. An unconditional CSS flip is forbidden.

---

### 5.4 Preview Screen — `SELECTING_PHOTOS`

**Purpose:** Review the captured shots, choose exactly the required number, and see the live print composition.
**Entry:** `SELECTING_PHOTOS` (after the capture sequence). **Exit:** `selection.confirm` → `EDITING` (frame selection).
**Data:** `snapshot.shots[]` (`shotIndex`, `shotId`, `preview`), `layout.selectCount`, `layout.photoAspectRatio`, `layout.printAspectRatio`, selected indices, `snapshot.secondsRemaining`.

> **The frame-selection screen (`EDITING`) and the print-confirmation screen (`PRINT_PENDING`) are separate existing screens** and are not merged here. The print preview panel below is the *composition* preview that already exists on this screen, not a second confirmation stage.

**Geometry — 1920×1200**

| Block | x | y | w | h | Notes |
|---|---|---|---|---|---|
| Header band | 48 | 40 | 1824 | 96 | Back button, eyebrow "Bước 4", title "Chọn ảnh để in" |
| — requirement | 1150 | 40 | 700 | 96 | `Đã chọn {n}/{selectCount}` — `--k-ivory` card, `--k-ink`; **timer badge** right-aligned |
| **Photo grid** | 48 | 176 | **1180** | **840** | 4 columns × 3 rows |
| — tile | 48 + c×292 | 176 + r×288 | **268** | 264 | gutter 24; 4×268 + 3×24 = 1144 → grid width 1180 with 36 slack |
| — tile image | 0 | 0 | 268 | 268 | `object-fit: contain` on `--k-paper`; frame from `photoAspectRatio` |
| — order badge | 16 | 16 | 44 | 44 | Round `--k-ink` chip, `--k-ivory` ordinal numeral |
| **Print preview panel** | 1272 | 176 | **600** | **840** | `--k-paper` fill, `--k-shadow-paper`, radius 18 |
| — composition | 1296 | 200 | 552 | 560 | Aspect-correct `contain` of the **composed print** (`printAspectRatio`) |
| — selection caption | 1296 | 784 | 552 | 60 | "Bản in đang chọn" + `{n}/{selectCount}` |
| — requirement note | 1296 | 848 | 552 | 80 | `--k-muted`, `--k-t-caption` |
| — cancel menu (⋯) | 1792 | 40 | 80 | 80 | **Existing three-dot cancellation entry — only on this screen and `EDITING`** |
| **Continue CTA** | 1272 | 1056 | 552 | 88 | `--k-matte` fill; **disabled until `selected === selectCount`** |

**Geometry — 1280×800**

| Block | x | y | w | h |
|---|---|---|---|---|
| Header band | 32 | 24 | 1216 | 64 |
| — requirement | 768 | 24 | 464 | 64 |
| **Photo grid** | 32 | 104 | **780** | **584** | 4 cols × 3 rows |
| — tile | 32 + c×196 | 104 + r×196 | **180** | **180** | gutter 16; 4×180 + 3×16 = 768 |
| **Print preview panel** | 828 | 104 | **420** | **584** |
| — composition | 844 | 120 | 388 | 392 |
| — selection caption | 844 | 528 | 388 | 44 |
| — requirement note | 844 | 576 | 388 | 60 |
| **Continue CTA** | 848 | 704 | 400 | 64 |

**Selection behaviour**
- Tap a tile → `selection.toggle({shotIndex})`. The tile gets a 3px `--k-outline-champagne` border, a rose-tint wash, **and** an ordinal badge showing the pick order. Selection order is meaningful, so the badge is a number, not a check.
- Selection is **capped at `selectCount`**. Once the cap is reached, remaining unselected tiles dim (opacity 55 %) and remain tappable only to **deselect** — they are not inert, so the customer is never confused by a dead tile.
- The Continue CTA stays **disabled** until `selected === selectCount` exactly, with the requirement always visible in the header ("Đã chọn 2/4 — cần chọn 4 ảnh"). Not "select 4", but how many are still missing.
- A tile whose preview failed to render is **non-selectable**, visibly distinct, and labelled with the reason. It is never drawn as a successful photo.
- **Long-press (500 ms) opens a full-screen lightbox** for one photo. Tap-to-select still works; the lightbox dismisses on release and does not toggle selection.

**States**
- *Fewer shots than required:* the grid renders what exists; the header states the shortfall explicitly; the CTA stays disabled. The app does not duplicate a photo to reach the count.
- *Timer:* the remaining time badge comes from the backend (`snapshot.secondsRemaining`) and is not an independent client timer. The header explains the real expiry consequence.
- *Cancel menu:* the three-dot entry opens a confirmation dialog with focus trapped and the default focus on **"Tiếp tục"**. Its copy states that the temporary images are deleted. It appears **only** on this screen and on `EDITING`.

---

### 5.5 QR Delivery — `DELIVERY`

**Purpose:** Confirm the session, show the print transmission status, and hand the album to the customer via QR.
**Entry:** `PRINTING` → `DELIVERY`. **Exit:** `session.finish` → `IDLE`.
**Data:** `snapshot.qrCodeUrl`, `snapshot.albumUrl`, `snapshot.videoUploaded`, `snapshot.printAccepted`, `snapshot.printStatus`, `snapshot.captureMode`, `snapshot.runtimeMode`, `layout.title`, `layout.printSizeLabel`, `pricing.quantity`, `pricing.totalAmount`.

**Geometry — 1920×1200**

| Block | x | y | w | h | Notes |
|---|---|---|---|---|---|
| Header band | 48 | 40 | 1824 | 96 | Title "Hoàn tất", subtitle |
| **Details column** | 48 | 176 | **880** | **840** | transparent |
| — success mark | 48 | 176 | 72 | 72 | `--k-success` check glyph, 40px, + "ĐÃ HOÀN TẤT" eyebrow |
| — heading | 48 | 272 | 880 | 60 | `--k-t-title`, `--k-ink` |
| — summary pills | 48 | 348 | 880 | 48 | `{layout.title}` · `{printSizeLabel}` · `{quantity} bản in` — `--k-champagne-tint` chips |
| — receipt block | 48 | 428 | 880 | 340 | Rows separated by `--k-hairline` only (no card box) |
| — print status card | 48 | 792 | 880 | 140 | `--k-ivory` fill, radius 18 |
| — status dot | 72 | 820 | 20 | 20 | `--k-success` / `--k-champagne` (pending) / `--k-error` |
| — status label | 108 | 812 | 796 | 44 | `--k-t-section`, `--k-ink` — text states the truth, e.g. "Đã xác nhận lệnh in" |
| — status detail | 108 | 856 | 796 | 60 | `--k-t-caption`, `--k-muted` — backend `printStatus` text |
| **QR card** | 976 | 176 | **896** | **840** | `--k-ivory` fill, `--k-shadow-2`, radius 18 |
| — **QR image** | 1232 | 296 | **384** | **384** | **Opaque white plate**, integer-scaled, **quiet zone preserved**, no logo overlay, no rounded clipping, no CSS filter |
| — QR caption | 1016 | 720 | 816 | 60 | "Quét mã QR bằng ứng dụng để tải ảnh + video" — `--k-t-body`, `--k-body`, centred |
| — video badge | 1232 | 800 | 384 | 48 | "Video đã tải lên" — `--k-champagne-tint` chip, `--k-champagne-ink` |
| — album link | 1016 | 872 | 816 | 80 | "Mở album trên web" — `--k-champagne-deep` underlined, 56px tall target |
| **Finish CTA** | 1248 | 1056 | 624 | 88 | `--k-matte` fill, `--k-ivory` label, radius pill |

**Geometry — 1280×800**

| Block | x | y | w | h |
|---|---|---|---|---|
| Header band | 32 | 24 | 1216 | 64 |
| **Details column** | 32 | 104 | **588** | 584 |
| — success mark | 32 | 104 | 48 | 48 |
| — heading | 32 | 168 | 588 | 44 |
| — summary pills | 32 | 224 | 588 | 36 |
| — receipt block | 32 | 276 | 588 | 228 |
| — print status card | 32 | 520 | 588 | 104 |
| **QR card** | 650 | 104 | **598** | **584** |
| — **QR image** | 821 | 184 | **256** | **256** |
| — QR caption | 674 | 464 | 550 | 48 |
| — video badge | 821 | 528 | 256 | 36 |
| — album link | 674 | 576 | 550 | 56 |
| **Finish CTA** | 832 | 704 | 416 | 64 |

**QR rendering rules (non-negotiable)**
1. **Opaque white plate** behind the code. A QR on a tinted or transparent background can fail to scan.
2. **Integer-scaled rasterization** — the module grid must stay sharp. No bilinear smoothing, no fractional scaling.
3. **Quiet zone preserved** on all four sides (≥4 modules). Never cropped by a border-radius or an `overflow:hidden` ancestor.
4. **No logo, no icon, no gradient** overlaid on the code.
5. Target 384×384 flagship / 256×256 compact. If space is short, the **caption shrinks or scrolls — the QR never shrinks below 256×256**.
6. The QR has a **fixed reserved footprint** allocated before the image loads, so the layout cannot shift when it arrives (this is a known regression class in the existing build).

**Print-status honesty**
The status card reports the **real** state from the backend and never overstates it:

| Backend state | Label | Dot |
|---|---|---|
| `captureMode === 'DEMO'` or `runtimeMode === 'SIMULATOR'` | "BẢN THỬ NGHIỆM — KHÔNG IN GIẤY THẬT" | `--k-champagne` |
| `printAccepted === true` | "ĐÃ XÁC NHẬN LỆNH IN" | `--k-success` |
| `printAccepted === false` | "ĐANG CHỜ XÁC NHẬN" | `--k-champagne` |
| error surfaced by the backend | Backend message | `--k-error` |

> **Wording note:** "Đã xác nhận lệnh in" means *the print command was accepted by the spooler* — **not** that paper has physically emerged. V1's revenue gate is exactly `userConfirmed && printJob.await() && sessionId match`; the UI must not imply a stronger guarantee than the backend provides.

**States**
- *No QR yet* (`qrCodeUrl` null): the QR footprint holds a reserved empty state — "Album chưa có mã QR. Vui lòng liên hệ nhân viên." — plus a staff-facing note. **No placeholder QR is drawn.** A generated-looking fake code is a customer-facing lie.
- *Album still uploading:* a progress indicator in the QR footprint with honest wording ("Đang tạo album…"), not a spinning fake QR.
- *Finish:* latched on `pointerup`; the button disables and the screen resets to `IDLE`. Late callbacks from the finished session must not repopulate the next customer's screen.

---

## 6. Touch, error and recovery patterns

### 6.1 Global interaction rules
| Rule | Detail |
|---|---|
| One gesture = one command | Buttons latch on `pointerup` and unlock only on an authoritative backend acknowledgement — never on a client timer. |
| No accidental back | The back affordance is a discrete 64×64 circle in the header, not a large edge-swipe zone. Swipe is optional; a visible control is always present. |
| Hold / long-press | Only two hold gestures exist, both inherited from V1: the **five-tap wordmark** (Welcome → Admin) and the **payment header hold** (staff panel). A held finger on any other control must not repeat or trigger anything. |
| Disabled reason visible | A disabled control always shows *why* in adjacent text. Never a silent dead button. |
| Reduced motion | `prefers-reduced-motion: reduce` → no scale, no flash, no parallax; only instant value swaps and ≤120 ms opacity. |
| Language overflow | Long Vietnamese layout names wrap to two lines then ellipsize with the full name shown in the card detail row. Prices, counts and selection states are never truncated. |

### 6.2 Error and empty states (no invented recovery flows)

| Condition | Presentation | Forbidden |
|---|---|---|
| Catalog / layouts unavailable | Explicit empty state in the gallery + disabled CTA with reason | Fabricating a sample layout or a default price |
| Camera feed absent | Status text in the image well + disabled shutter | An animated fake preview |
| Payment QR creation error | The **existing** staff-gate path only | A public "Skip payment" / "I paid" button |
| Photo preview missing | Tile non-selectable, visibly distinct, reason shown | Drawing it as a successful capture |
| Print failed / printer offline | Backend's actual result rendered truthfully | "Retry print" invented by the frontend |
| QR / album not ready | Reserved footprint + honest status text | A fake QR image |
| Session timeout | The backend's real expiry behaviour is shown; the UI never re-arms the timer locally | A "keep alive" button |
| IPC disconnect (proposal) | Freeze commands, keep the last snapshot labelled "disconnected", request an authoritative resync | Replaying side-effecting commands |

---

## 7. Design options considered

### 7.1 Welcome

| | **Option A — Editorial split (CHOSEN)** | Option B — Full-bleed hero |
|---|---|---|
| Layout | Left copy column (720px) + right 2×2 bundle gallery (1056px) | One full-bleed hero image, centred wordmark, bottom CTA |
| Catalogue visibility | Up to 4 bundles visible at once | One bundle; the rest are hidden behind a swipe |
| Pros | Every real bundle and its price is legible at a glance; the copy has a calm editorial column; scales to a 2×2 grid cleanly | Maximum drama; the photograph is the whole screen |
| Cons | Uses screen area for four cards; the hero image is smaller | Hides the catalogue — the customer cannot compare; only one layout case really works |
| Verdict | **Chosen.** A photobooth's Welcome screen is a *menu*, and the existing V2 welcome already exposes a bundles gallery. Option B is retained as a **fallback variant for the single-layout case**, which the current code already detects. |

### 7.2 Camera View

| | **Option A — Dedicated right rail (CHOSEN)** | Option B — Centred countdown overlay |
|---|---|---|
| Layout | Matte stage + 1320px image well + 448px rail (numeral, pips, shutter) | Full-bleed image with the numeral over the subject |
| Pros | Face is **never** occluded; 300px numeral is readable across the booth; countdown, progress and shutter are all in one stable place; the image area stays a clean rectangle for aspect-correct framing | Maximum size for the image; the numeral sits where the eye already is |
| Cons | The image is narrower; the rail consumes 23 % of the width | **Occludes the subject's face**; the numeral jumps position as the framing changes; two numerals can overlap during a transition |
| Verdict | **Chosen.** It satisfies both hard requirements — distance readability *and* never covering a face — and it matches the existing rail-based direction in `docs/UI_DESIGN_SYSTEM.md`. |

### 7.3 Options rejected outright
- **Frosted glass panels over photographs.** Refracts the photograph and lifts blacks. Explicitly excluded.
- **AI-style gradient meshes / aurora backgrounds.** Off-brand for a photo atelier and adds motion cost to a kiosk that must stay cool and fast.
- **Neon / saturated accent themes.** Cheapens a premium print product and fails on a matte-black stage.
- **A "Home" button on capture, print, or delivery.** V1 has no such command; adding one would invent a stage transition.

---

## 8. Reconciliation required before implementation

This document is a **test artifact**. Before any of it is coded, the following must be reconciled against the governing specs:

| # | Item | Conflict to resolve |
|---|---|---|
| 1 | Token naming | `docs/DESIGN_SYSTEM.md` and `docs/ADR/018-*` use `--at-*` and `--k-*` prefixes with **different values** (e.g. coral `#E07A5F` / `#C27357` in ADR-018 vs. champagne `#C9A87C` here). **One palette must win.** This document proposes the champagne/rose/ivory/matte set; ADR-018's coral and peach families should be retired or explicitly kept as a secondary event theme. |
| 2 | Typography | `docs/UI_DESIGN_SYSTEM.md` mandates a system stack (`Segoe UI, Arial`) and forbids shipping unknown-license fonts; the existing build already vendors Be Vietnam Pro + Playfair Display. Confirm the vendored families' licences and settle on one stack. |
| 3 | Geometry | `docs/UI_DESIGN_SYSTEM.md` gives a different header/footer rhythm (32px margin, 80px header, 88px footer) than §5.0 (48px margin, 96px header, 104px dock). Pick one and restate all screens. |
| 4 | Countdown flash | V1 flashes full-screen white on capture; §4.4 replaces it with a ring contraction + status chip. This is a **capture-feedback contract change** and needs architect sign-off, not a designer-only decision. |
| 5 | Confirm CTA on the Bundle Selector | §5.2 adds a labelled button dispatching `session.confirmSetup`. Confirm that the architect allows a second visible trigger for an existing command. |
| 6 | Reduced-motion countdown | §4.4 removes the scale animation. Confirm the countdown still reads as a countdown without it (the phase label and numeral change carry it). |
| 7 | Studio/Admin screens | Out of scope here. `docs/UI_DESIGN_SYSTEM.md` §4 keeps Admin at an ivory workbench with ≥56px controls — that palette must be derived from the same tokens, but this document does not cover it. |

---

## 9. Verification evidence

| Item | Result |
|---|---|
| Palette contrast | **44 required pairs, 0 failures**; 5 surface-only pairs asserted to stay below usable-text thresholds. Method: WCAG 2.1 relative luminance, computed by script. Reproduce with `node frontend/verify-palette.mjs` (exit code 0 on success). |
| Geometry | All coordinates are **CSS pixels at 100 % scaling**, hand-computed from the 4 px grid. 1280×800 is the 2/3 scale of 1920×1200 (both are exactly 16:10), rounded down to the grid. |
| Font files | **None added.** Only the families already vendored in `frontend/node_modules/@fontsource` are referenced. |
| React / Tailwind code | **None produced**, per the task brief. |
| V1 | Read-only, untouched. No file in `E:\HK1_2026_2027\PhotoboothDesktop` was written, moved, or executed. |
| Rendering | **NOT performed.** No screenshot, no browser run, no DPI test, no touch test, no physical display test. Contrast numbers are analytic, not measured from rendered pixels. |

**To close this artifact, the following must still happen (none of it is claimed here):**
1. Reconcile §8 with the architect and the frontend owner; freeze one token set.
2. Implement the tokens and measure the rendered contrast in the actual WebView at 100 %, 125 % and 150 % Windows scaling.
3. Render all five screens at 1920×1200, 1536×960, 1280×800, 1024×640 and 853×533 and check for overflow.
4. Measure every touch target in the DOM (`getBoundingClientRect`) to confirm ≥56 CSS px (≥48 compact).
5. Test the countdown at 1-, 2- and 3-digit configured values and with `shotCount` from 1 to 12.
6. Test long Vietnamese layout names, Korean strings (expect a font fallback), and 200 % text zoom.
7. Verify the QR still scans from a real device at the compact size with the quiet zone intact.

---

*End of `docs/test_ui_design_tokens.md`. Design specification only — no implementation, no rendered evidence, V1 untouched.*
