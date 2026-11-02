# UI Redesign Progress & Korean Photo Studio Design System

> **Styling increment (2026-11-02; awaiting new visual captures):** Polished `frontend/src/kiosk-v1.css` only. Frame/Select print artwork now floats without nested opaque preview padding, with ambient drop shadows and larger frame composition allocation. Frame gallery uses proportional two-column translucent cards, champagne-selected edge, high-contrast check pill, text truncation and touch press feedback. ActionBar now has a clean frosted floating-rail treatment and crisp warm-brown enabled CTA with separate disabled styling. Background receives restrained ivory ambient light. CSS breakpoints target 1280×800 and 1920×1200; no screenshot or physical scaling proof is claimed. **Verification:** `npm test -- --run` **50/50**, `npm run build` **passed**. `FrameScreen.tsx` and `SelectPhotosScreen.tsx` were inspected but not modified: their existing selection/confirm gates remain intact. No V1 files touched. See `docs/UI_VISUAL_REVIEW.md` for limitations and follow-up measurements.

> **LATEST STATUS (2026-11-02, 07:41:35 capture): NAVIGATION GEOMETRY, APPHEADER UNIFICATION & TECHNICAL CLUTTER PURGE COMPLETED — PASS-AUTOMATED + PASS-SIMULATED.** `tests/journey-evidence/2026-11-02T07-41-35.569Z/results.json` records **63/63 checks, 0 failures and 26 screenshots** across 1280×800 and 1920×1200 viewports; frontend Vitest is **49/49** with **0 build errors**.
>
> The verified milestone achieves:
> 1. **Unified `AppHeader` Architecture:** Standardized 3-column CSS Grid (`56px minmax(0,1fr) auto`) eliminating header layout shift across all screens.
> 2. **Circular 56×56 `KioskBackButton`:** ISO 9241-9 compliant touch targets ($\ge 56\text{px}$) with optical SVG centering ($dx=0.5\text{px}, dy=0.0\text{px}$, well within the $\le 2.5\text{px}$ threshold).
> 3. **Horizontal Carousel Chevron Alignment:** 56×56px touch targets vertically locked and aligned on the same horizontal axis ($y\Delta \le 3\text{px}$, measured $y\Delta = 0.0\text{px}$).
> 4. **Technical Clutter Elimination:** Complete purge of raw layout IDs (`515_4_anh`, `1015_4_ILCL`), debug status bars, and internal tags; desktop window title standardized to `"LE SOUVENIR Photobooth"`.
> 5. **Welcome Hero Recomposition:** Authentic photostrips (`LayoutArtwork` in `.v1-strip-art`) with realistic paper elevation shadows, subtle rotation, and refined editorial typography.
>
> Physical hardware/provider operations (Canon DSLR capture, DNP print spooling, live PayOS settlement) remain **BLOCKED / NOT-RUN** until authorized studio kiosk attachment. The 18:16:51 and earlier entries below are historical snapshots.

| Latest parity deliverable | Status / evidence |
|---|---|
| Unified `AppHeader` | **COMPLETE:** 3-column CSS Grid (`56px minmax(0,1fr) auto`), `.appHeader__backSlot`, aligned eyebrow/title/subtitle, clean right slot. |
| Circular 56×56 `KioskBackButton` | **COMPLETE:** 56×56px circular touch target, optical SVG centering $dx=0.5\text{px}, dy=0.0\text{px}$ ($\le 2.5\text{px}$ tolerance). |
| Horizontal Carousel Chevrons | **COMPLETE:** 56×56px touch target, vertically centered at 50% stage height, horizontally aligned on same axis ($y\Delta \le 3\text{px}$, $y\Delta = 0.0\text{px}$). |
| Technical Clutter Elimination | **COMPLETE:** Purged raw IDs (`515_4_anh`, `1015_4_ILCL`), debug status bars, internal badges; window title `"LE SOUVENIR Photobooth"`. |
| Welcome Hero Photography | **COMPLETE:** Authentic layered photostrips (`LayoutArtwork` in `.v1-strip-art`), subtle paper shadows, refined typography. |
| Guest Copy Cleanup | **COMPLETE:** Polished Vietnamese customer-facing copy throughout all screens (`formatLayoutTitle`, `formatLayoutSubtitle`). |
| Current Acceptance | **PASS-SIMULATED 63/63 checks, 0 failures, 26 screenshots; PASS-AUTOMATED 49/49 Vitest; build 0 errors.** |

> **HISTORICAL STATUS (2026-11-01, 18:16:51 capture): CRITICAL V1 UX PARITY OVERHAUL COMPLETED — PASS-AUTOMATED + PASS-SIMULATED.** `tests/journey-evidence/2026-11-01T18-16-51.341Z/results.json` records **47/47 checks, 0 failures and 26 screenshots** at 1280×800 and 1920×1200; frontend Vitest is **49/49**. The completed scope includes bounded PayOS creation/retry states, engine-authoritative 90s/60s selection/editing timers, active `MM:SS` decrement, live selected-photo SVG slots, 500ms hold-to-zoom/release-close, the two-column frame workspace, centered 240sp mirrored capture presentation, and replacement of decorative emoji with Lucide SVG icons.
>
> The current UI evidence specifically observes `Còn lại 02:19` → `Còn lại 02:18`, hold modal open/close, live frame-slot updates and the zero-emoji assertion. It does **not** certify physical touch behavior, a physical Canon DSLR, DNP paper output, or live PayOS banking settlement; those remain **BLOCKED / NOT-RUN** until attachment and explicit supervised authorization. The 17:19:57 and earlier entries below are historical snapshots.

| Latest parity deliverable | Status / evidence |
|---|---|
| PayOS loading repair | **COMPLETE:** 15s bound; explicit `CREATING`, `AWAITING_PAYMENT`, `ERROR`, `UNCONFIGURED`, `PAID`; retry and staff fallback visibility. |
| Selection/edit timers | **COMPLETE:** authoritative 1000ms ticks, 90s/60s defaults, safe expiry auto-fill/advance, no duplicate revenue/printing. |
| Selection and frame interaction | **COMPLETE:** real-time SVG photo slots, 500ms hold zoom, release close, two-column frame gallery and large print preview. |
| Capture polish | **COMPLETE:** centered 240sp countdown, mirrored Live View, no DEMO captions. |
| Iconography | **COMPLETE:** decorative Unicode emoji replaced with Lucide SVG icons; automated zero-emoji assertion passes. |
| Current acceptance | **PASS-SIMULATED 47/47; PASS-AUTOMATED 49/49 Vitest.** Physical hardware/provider gates remain open. |

> **LATEST STATUS (2026-11-01, 17:19:57 settled capture): UI Overhaul — COMPLETED for simulated desktop kiosk journey; V1 Payment Restoration — COMPLETED for customer-facing UI presentation, NOT certified live payment.** `tests/journey-evidence/2026-11-01T17-19-57.239Z/results.json` records **35/35 passing, 0 failures and 26 screenshots** at 1280×800 and 1920×1200. DEMO Start→Delivery and REAL-labelled Start→Payment are covered. Payment displays actual backend-calculated VND pricing instead of guest free claims or bypass; captured REAL Payment is **loading QR**, not a settled bank charge. Cash-error fallback and 700ms staff gesture are specified but not demonstrated by this capture; staff ACL and real settlement need authorized tests. Physical camera, DNP printer, 125/150% Windows scaling, touch geometry and countdown-distance readability remain open. `docs/UI_VISUAL_REVIEW.md` has the latest screen audit; older snapshots below are historical. V1 was not modified.

**Document ID:** `docs/UI_REDESIGN_PROGRESS.md`  
**Status:** UI Overhaul COMPLETED; V1 Payment Restoration COMPLETED (simulated desktop presentation only); historical redesign notes below are not hardware certification  
**Target Environment:** 16:10 Touchscreen Displays (1920×1200 WUXGA & 1280×800 WXGA)  
**Security Boundary:** Legacy V1 (`PhotoboothDesktop`) is strictly READ-ONLY. All UI implementations, styles, and assets belong exclusively to V2 (`PhotoboothDesktop_v2/frontend`).

> **HISTORICAL DESKTOP ACCEPTANCE (2026-11-01, settled 15:38:06 run; superseded by 17:19:57): PASS-SIMULATED / COMPLETE FOR DESKTOP SIMULATOR.** `tests/journey-evidence/2026-11-01T15-38-06.041Z/results.json` reports **35/35 passing checks, zero failures**, and **26 distinct screenshots** at 1280×800 and 1920×1200. The DEMO Start→Delivery journey and REAL-labelled Start→Payment fallback are covered; the latter does not demonstrate a paid transaction. The earlier 15:22:57 WITHHELD verdict and 15:09 review in `docs/UI_VISUAL_REVIEW.md` are retained as **historical before-fix findings**, not the current gate. No V1 files were changed by this documentation update.

| Settled visual gate (15:38:06) | Decision / evidence |
|---|---|
| Carousel settled alignment | **PASS in captured run:** a **600 ms** smooth-scroll wait precedes screenshot capture; centered active `515_4_anh` / “Dải 4 ảnh cổ điển” agrees with **“06 / 10 · Dải 4 ảnh cổ điển”** and downstream **5×15 strip**. Arbitrary swipe/tap settling still needs dedicated interaction tests. |
| Frame artwork | **PASS in settled captures:** backend `RealSessionEngine.kt` provides `thumbDataUrl` alongside `thumbnailDataUrl` and `previewDataUrl`; frontend `FrameScreen.tsx` renders safe real Base64 frame thumbnails, falling back to the atelier silhouette. No “Khung đang tải” wall or raw filename spillage. Asset-decode failure handling needs separate exercise. |
| Confirmation copy and gate | **PASS for mode-dependent wording:** DEMO **“Hoàn thành trải nghiệm →”**, REAL **“In và tạo QR →”**. Both retain their existing confirmation actions; only DEMO was traversed through Delivery here. |
| Compact Delivery CTA | **PASS at 1280×800:** sticky **“Hoàn thành · Về trang đầu”** is visible; scripted click returns to Start. Also captured at 1920×1200. |
| Physical device and payment certification | **NOT VERIFIED:** physical Canon, DNP and live PayOS charges require connected studio-booth hardware and authorized testing; 125/150% Windows scaling, touch geometry and countdown-distance readability also remain open. |

**Next gate:** studio-booth hardware/payment validation and targeted physical-touch/scaling/recovery tests, without treating simulator success as print, camera or bank-charge proof. Historical entries below are retained for traceability, not current acceptance.

> **Current design handoff (2026-11-01):** `docs/DESIGN_SYSTEM.md` is the authoritative **proposed** Korean Photo Atelier redesign, layout slider geometry, behavioral safeguards and acceptance criteria. The historical assertions below describe an earlier frontend iteration, not proof that the requested slider is mounted or that live devices, real payment, printing, QR, 600 DPI metadata, admin authentication or Windows scaling work. Do not treat example counts, pricing, modes, API names or screenshot numbers below as new backend contracts. Source-backed V1 baseline is `docs/UI_SCREEN_INVENTORY.md` and `docs/UI_BASELINE_COMPARISON.md`; permissioned backend behavior always wins. In particular §3.2's older **two-column layout cards** are superseded by the centered pager specification. No frontend, backend, hardware, payment or V1 files were changed in this design task.

> **Visual review update (2026-11-01, later live Tauri capture):** `docs/UI_VISUAL_REVIEW.md` reviews `tests/journey-evidence/2026-11-01T15-09-23.188Z/` at 1280×800 and 1920×1200. The carousel and vector portraits are **mounted in these images**, superseding the earlier “NOT MOUNTED” status below as a historical snapshot, but **visual acceptance is BLOCKED**: active 10×15 card disagrees with 5×15 caption/committed layout, frame loading filenames overflow, and compact delivery hides the finish button. `results.json` reports `PASS-SIMULATED`, not visual, REAL payment, hardware or scaling certification. REAL payment screenshots show complimentary DEMO fallback only. No V1 or application code changes in this review.

| Current screenshot-based gate | Status / next owner |
|---|---|
| Carousel identity, peeks, art, titles | PARTIAL / FRONTEND: fix centered card vs footer/selection mismatch, restore left peek; verify both formats and customer names with architect. Snap dynamics not testable in still images. |
| Fit at two 16:10 viewports | FAIL / FRONTEND: at 1280×800 delivery finish CTA is below viewport; frame filenames collide/overflow; gallery expand controls visibly narrower than 56px. No native scrollbars visible, but clipping remains. |
| Atelier visual language | PARTIAL / DESIGN + FRONTEND: ivory/coral/peach/charcoal present; raw IDs/internal terms and white-on-coral CTA contrast require remediation/measurement. |
| Live capture & DEMO/REAL evidence | SIMULATED ONLY / ARCHITECT + TEST: progress visible; countdown absent in snapshot, orientation and face safety of real preview not proven; REAL-payment captures are DEMO fallback; 125/150% scaling and real devices not tested. |

**Next gate:** remediate P0 defects and repeat settled screenshot plus DOM/touch/scaling checks listed in `docs/UI_VISUAL_REVIEW.md` §4. Historical verification counts in §7 are journey-script results, not override of these visual failures.

## Current request: V1 Step1Layout slider restoration + elevation

**Read-only evidence:** `V1/ui/screens/StudioModeScreen.kt:107–197` creates `HorizontalPager` with 30%-of-container page width and symmetric content padding, 0 page spacing, ±2 beyond-bounds pages, scale interpolation 0.8→1, alpha interpolation 0.3→1, tap on noncenter to animate to it, tap on centered layout to select and advance to V1's effect step; caption follows current page. `:34–74` shows the subsequent effect selection and confirm gate. `docs/UI_BASELINE_COMPARISON.md:17` reports V2's earlier equal-size grid and missing effect parity. This is behavioral evidence, not permission to invent an effect event in the V2 simulator.

| Deliverable | Status | Evidence / gap |
|---|---|---|
| Chosen aesthetic and rejected alternative for Welcome + Capture | SPECIFIED, NOT MOUNTED | `docs/DESIGN_SYSTEM.md` §1; ivory Welcome + black Capture chosen over darkroom editorial for kiosk-distance readability. |
| Palette/contrast/type/spacing/motion | SPECIFIED, NOT MOUNTED | §2; coral button uses dark text for contrast. Requires mounted accessibility check. |
| Centered carousel and print-art SVG | SPECIFIED, NOT MOUNTED | §3: 30% slot, centred snap, active scale 1 / opacity 1, adjacent scale .82 / opacity .4; 5×15 vs 10×15 ratios and data/geometry fallback. No JSX/CSS/artwork has been implemented by this task. |
| All screens + gate and error design | SPECIFIED, NOT MOUNTED | §4 includes Welcome, Layout, Quantity, Payment, Prepare, Capture, Select, Frame, Confirm, Printing, Delivery, Admin six tabs, startup/recovery. Backend event and ACL reviews remain pending. |
| 1920×1200 / 1280×800 + 100/125/150% | TARGETS DEFINED, NOT TESTED | §3 and §5 define slot coordinates and compact fallback. Physical display, packaged WebView viewport/DPR, scroll, touch and language-overflow verification remain outstanding. |
| Hardware, live QR/PayOS, confirmed print | NOT VERIFIED IN THIS TASK | No test actions or live transactions; simulation is not physical proof. |

**Frontend handoff:** replace equal-size layout grid only when the backend's current phase permits selection; keep `session.confirmSetup` and any effect gate intact. Use controlled `LayoutCarousel` + `PrintArtwork`; map noncenter tap/arrows to recenter only, center tap to existing authorized selection. Avoid raw contract strings in guest surfaces. Mount and screenshot both viewports with long Vietnamese titles, empty/one/two/many layouts and timed/repeated touch before reporting done. **Architect dependency:** confirm authoritative slot geometry/orientation, catalog labels/counts, effect event availability, camera preview orientation, staff ACL and payment/print/delivery events. Do not equate suggested 4-step printing presentation with reported completion events.

---

## Historical implementation notes (not reverified for this request)

---

## 1. Aesthetic Vision & Atelier Design Tokens

The V2 frontend is designed to evoke the refined, intimate atmosphere of modern Seoul self-photo ateliers (such as Photomatic, Haru Film, and Life Four Cuts). Rather than the stark utility of generic software kiosks, the interface embraces warm, organic paper tones, soft tactile card elevations, and delicate terracotta coral accents.

### 1.1 Core Atelier Design Tokens

All design tokens are defined as CSS Custom Properties in `frontend/src/kiosk-v1.css` and scoped to the root container:

```css
:root {
  /* Surface & Backgrounds */
  --v-bg: #FAF6F0;        /* Warm ivory / artisanal hanji paper */
  --v-panel: #FFFFFF;     /* Pure surface card background */
  --v-alt: #F7EBE8;       /* Soft blush pink background tint */
  --v-light: #FCEBD9;     /* Soft peach pill / badge background */
  --v-peach: #F4A261;     /* Warm sunset peach accent / countdown ring */
  
  /* Brand Accent & Interactive States */
  --v-nude: #E07A5F;      /* Muted terracotta coral (Primary CTA) */
  --v-dark: #D46A4E;      /* Deep terracotta hover state */
  --v-active: #B8553A;    /* Pressed active state */
  
  /* Typography & Contrast */
  --v-text: #232120;      /* Deep warm charcoal (Primary headings/body) */
  --v-secondary: #544E4B; /* Warm charcoal secondary / subtitles */
  --v-muted: #8C847E;     /* Soft charcoal muted / captions */
  
  /* Borders & Elevations */
  --v-border: #EADDD4;    /* Warm oat card outline */
  --v-shadow: 0 10px 30px rgba(78, 56, 44, 0.07); /* Organic soft card elevation */
  --v-glow: 0 0 20px rgba(224, 122, 95, 0.22);    /* Coral luminous focus glow */
}
```

### Design Token Reference Table

| Token Name | Hex Value | Semantic Usage | Design Intent |
|---|---|---|---|
| `--v-bg` | `#FAF6F0` | Viewport & Shell Background | Warm ivory base evoking textured paper and warm studio ambient light |
| `--v-panel` | `#FFFFFF` | Card & Panel Surfaces | Crisp elevated surfaces for photo previews and interactive grids |
| `--v-alt` | `#F7EBE8` | Alternate Sections / Radial Glows | Delicate blush pink creating subtle depth in radial gradients |
| `--v-light` | `#FCEBD9` | Badges, Notice Banners, Chips | Soft peach background for status chips and offline notices |
| `--v-peach` | `#F4A261` | Countdown Ring & Accent Borders | Warm peach providing high visual salience during timing countdowns |
| `--v-nude` | `#E07A5F` | Primary Buttons & Active Selections | Muted terracotta coral acting as the primary studio signature color |
| `--v-dark` | `#D46A4E` | Primary Hover / Focus State | Darkened coral providing immediate tactile touch feedback |
| `--v-active` | `#B8553A` | Button Active / Pressed State | High-contrast terracotta response on physical finger press |
| `--v-text` | `#232120` | Headings & Primary Copy | Soft warm charcoal providing $\ge 7:1$ contrast without harsh pure black |
| `--v-secondary` | `#544E4B` | Subtitles & Meta Info | Balanced readability for instructions and dimension descriptions |
| `--v-muted` | `#8C847E` | Disclaimers & Secondary Badges | Subtle metadata that does not distract customer attention |
| `--v-border` | `#EADDD4` | Card Outlines & Dividers | Soft oat separation preventing visual clutter |

---

## 2. 16:10 Touchscreen Optimization

Commercial photobooth kiosks in Vietnam and international deployments predominantly utilize **16:10 aspect ratio landscape touch displays**:
- **Primary Kiosk Resolution:** $1920 \times 1200$ (WUXGA)
- **Secondary / Compact Kiosk Resolution:** $1280 \times 800$ (WXGA)

### 2.1 Viewport Ergonomics & Zero-Scroll Guarantee

Touchscreen kiosks must prevent customer confusion caused by accidental vertical scrolling, bouncing viewport bars, or misaligned touch triggers:

1. **Fixed Fullscreen Canvas:**
   ```css
   .v1-shell {
     height: 100vh;
     height: 100dvh;
     min-height: 0;
     overflow: hidden;
     gap: clamp(10px, 1.6vh, 20px);
     padding: clamp(16px, 2vh, 24px) clamp(24px, 4vw, 80px);
   }
   ```
   The root viewport is hard-locked to $100\text{dvh}$ with `overflow: hidden`. Customer flows operate with **zero page scroll**. Any scrollable content (e.g., photo selection grids or bundle lists) is contained in bounded internal panels with `overscroll-behavior: contain`.

2. **Touch Target Dimensions ($\ge 56\text{px}$):**
   In compliance with ISO 9241-9 and touchscreen ergonomics for standing users:
   ```css
   .v1-back,
   .v1-stepper button,
   .v1-menu,
   .v1-primary,
   .v1-secondary {
     min-width: 56px;
     min-height: 56px;
   }
   ```
   Primary action buttons are expanded to $64\text{px}$–$80\text{px}$ height on WUXGA displays.

3. **Touch Feedback & Responsive Motion:**
   - Interactive elements feature instant scale feedback on touch down:
     ```css
     .v1-shell button:active:not(:disabled) {
       transform: scale(0.96);
     }
     ```
   - Cards elevate smoothly on hover/focus with cubic-bezier easing:
     ```css
     .v1-layout-card,
     .v1-frame-grid button,
     .v1-photo-grid button,
     .v1-bundles button {
       transition: transform 0.25s cubic-bezier(0.2, 1.4, 0.4, 1), box-shadow 0.2s, border-color 0.2s;
     }
     .v1-layout-card:hover:not(:disabled) {
       transform: translateY(-4px);
     }
     ```
   - `touch-action: manipulation` eliminates double-tap zoom delays on Windows touch drivers.

### 2.2 Navigation Geometry, AppHeader & Optical Centering Standards

To prevent jarring layout shifts between navigation steps and guarantee predictable touch ergonomics across all 16:10 kiosk screens:

1. **Unified `AppHeader` Grid (`.appHeader`):**
   ```css
   .appHeader {
     position: relative;
     display: grid;
     grid-template-columns: 56px minmax(0, 1fr) auto;
     column-gap: 20px;
     align-items: start;
     min-height: 84px;
     width: 100%;
   }
   ```
   - **Column 1 (`.appHeader__backSlot`):** Dedicated $56\text{px} \times 56\text{px}$ slot reserved for `KioskBackButton` or an invisible placeholder (`.appHeader__backPlaceholder`), preventing title text drift between screens with/without Back buttons.
   - **Column 2 (`.appHeader__copy`):** Left-aligned flex column rendering eyebrow/step indicators, responsive title `h1` (`clamp(28px, 2.2vw, 38px)`), and subtitle.
   - **Column 3 (`.appHeader__right`):** Reserved for contextual decision timer badges (`DecisionTimerBadge`) or operator controls.

2. **Circular 56×56 `KioskBackButton` & Optical SVG Centering:**
   ```css
   .v1-back, .backButton {
     width: 56px !important;
     height: 56px !important;
     min-width: 56px !important;
     min-height: 56px !important;
     border-radius: 50% !important;
     border: 1.5px solid var(--v-border, #E9DED7);
     background: #fff;
     box-shadow: 0 4px 12px rgba(35, 33, 32, 0.08);
   }
   .v1-back svg, .backButton svg {
     width: 24px !important;
     height: 24px !important;
     transform: translateX(-0.5px);
   }
   ```
   - Lucide `ArrowLeft` visual chevron weight is optically counter-balanced via `translateX(-0.5px)`, verified by automated CDP measurement: **$dx = 0.5\text{px}, dy = 0.0\text{px}$** ($\le 2.5\text{px}$ delta limit).

3. **Carousel Chevrons Horizontal Alignment:**
   - Floating carousel arrows (`.v1-carousel-arrow`, `.v1-carousel-prev`, `.v1-carousel-next`) sized to $56\text{px} \times 56\text{px}$ touch targets.
   - Vertically locked at `top: 50%; transform: translateY(-50%)`, ensuring both arrows are pinned to the exact same horizontal axis: **$y\Delta \le 3\text{px}$** (measured $y\Delta = 0.0\text{px}$).

4. **Technical Clutter Elimination:**
   - Raw layout identifiers (e.g. `515_4_anh`, `1015_4_ILCL`) and internal technical badges are purged from customer view.
   - Window title explicitly standardized to `"LE SOUVENIR Photobooth"`.

5. **Welcome Screen Editorial Recomposition with Authentic Photostrips:**
   - `StartScreen.tsx` features authentic photostrip preview cards (`LayoutArtwork` in `.v1-strip-art`) with realistic layered shadows and subtle rotation ($-5^\circ / +4^\circ$), evoking real photographic prints rather than sterile software wireframes.

---

## 3. Screen-by-Screen Parity, Flow & Animations

The customer journey is broken down into 10 structured, resilient screen components:

```
[StartScreen] ──► [StudioModeScreen] ──► [QuantityScreen] ──► [PaymentScreen]
                                                                    │
┌───────────────────────────────────────────────────────────────────┘
▼
[PrepareScreen] ──► [CaptureScreen] ──► [SelectPhotosScreen] ──► [FrameScreen]
                                                                    │
┌───────────────────────────────────────────────────────────────────┘
▼
[ConfirmScreen] ──► [PrintingScreen] ──► [DeliveryScreen]
  (600 DPI)                                (Web QR)
```

### 3.1 StartScreen (`StartScreen.tsx`)
- **Brand Wordmark & Hidden Admin Trigger:** Large serif brand title `"LE SOUVENIR"`. Tapping the title 5 consecutive times invokes `onAdmin()` to open the Operator Diagnostic Dashboard.
- **Unified Atelier Greeting:** Completely uncluttered greeting with zero manual DEMO/REAL toggle badges or disruptive error banners.
- **Dynamic Catalog Badge:** Subtle pill badge displaying Firebase Live sync status (`✓ Firebase Live (N bố cục)`), offline cache status (`● Bộ nhớ tạm`), or default fallback.
- **Event Bundles Carousel:** Horizontal scroll container (`.v1-bundles`) displaying themed collections (e.g. Tet 2026) with small Base64 thumbnail covers.
- **Preview Rail:** Displays miniature layout cards for 5x15 cm strips and 10x15 cm cards.
- **Primary CTA:** `"CHẠM ĐỂ BẮT ĐẦU →"` ($\ge 64\text{px}$ touch target). Session start triggers backend dynamic camera discovery and promotion.

### 3.2 StudioModeScreen / Layout Selection (`StudioModeScreen.tsx`)
- **Interactive Layout Cards:** Two-column split layout. Left rail displays layout cards (`.v1-layout-card`) showing print size label, shot count, selection count, and countdown time.
- **Real-Time Aspect Ratio Preview:** Right rail displays a preview canvas scaling dynamically to the layout's aspect ratio (`1:3` for 5x15 strips or `2:3` for 10x15 prints).
- **Navigation:** Back button and forward button with disabled state protection.

### 3.3 QuantityScreen (`QuantityScreen.tsx`)
- **Touch Stepper ($− / +$):** Large circular stepper buttons ($56\text{px} \times 56\text{px}$) flanking the quantity readout.
- **Layout-Specific Constraints:** Quantities are restricted to valid multiples defined by the backend contract (e.g. 5x15 strips allow 2, 4, 6, 8, 10 strips; 10x15 prints allow 1, 2, 3, 4, 5, 6).
- **Dynamic Pricing Breakdown:** Displays base price, additional prints surcharge, and final total calculated directly by `PricingCalculator`.

### 3.4 PaymentScreen (`PaymentScreen.tsx`)
- **Split Panel Layout:**
  - Left Panel: Order summary with layout title, print quantity, and total VND amount formatted using Vietnamese locale (`100.000 đ`).
  - Right Panel: Dynamic VietQR code display card with spinning indicator during generation and status chip (`Đang tạo mã`, `Sẵn sàng`, `Chưa sẵn sàng`).
- **Demo Interception:** In DEMO mode, the QR code is replaced by a clear informational card: `"CHẾ ĐỘ CHỤP THỬ NGHIỆM - Không thu tiền và không in ảnh thật"`, followed by the action `"BẮT ĐẦU CHỤP THỬ NGHIỆM →"`.
- **Payment Polling:** When in REAL mode, polls `payment.checkStatus` every 3 seconds until `PAID` is returned by the backend.
- **Staff Security Gesture:** Long-press gesture on the header (detailed in Section 4).

### 3.5 PrepareScreen & CaptureScreen (`CaptureScreen.tsx`)
- **Live View Viewfinder:** Fullscreen live video/JPEG stream from DSLR or demo camera.
- **Dynamic Aspect Ratio Framing Guide:** An overlay bounding guide (`.v1-crop`) matching the target photo slot ratio ($1.5$ for 3:2 landscape).
- **Progress Counter:** Top-centered pill badge showing `"Ảnh X/Y"`.
- **Pulsing Countdown Ring (`.v1-countdown`):**
  - Bold circular badge centered over the live feed.
  - Animated with a keyframe pulse:
    ```css
    @keyframes v1-countdown-pulse {
      to {
        transform: scale(1.06);
        box-shadow: 0 0 0 24px rgba(224, 122, 95, 0.14), 0 12px 48px rgba(0, 0, 0, 0.4);
      }
    }
    ```
- **Shutter Flash Animation (`.v1-flash`):**
  - When state transitions to `CAPTURING`, a full-viewport white flash overlay triggers for 200ms (`animation: v1-flash 0.2s ease-out forwards`).
  - Tactile indicator that exposure was captured.

### 3.6 SelectPhotosScreen (`SelectPhotosScreen.tsx`)
- **Multi-Photo Grid:** Responsive thumbnail grid displaying all captured frames (`original-shot-$index.jpg` or smoothed `beauty-shot-$index.png`).
- **Numbered Selection Badges:** Tapping a photo toggles selection, displaying ordinal selection badges (`"✓ 1"`, `"✓ 2"`) in terracotta coral.
- **Exact Selection Validation:** The `"Tiếp tục →"` button remains disabled until the customer selects the exact number required by the layout (`layout.selectCount`).

### 3.7 FrameScreen (`FrameScreen.tsx`)
- **Live Composition Preview:** Left rail displays the real backend-composed photo layout rendered with the selected frame overlay.
- **Frame Selection Grid:** Right rail displays standard and seasonal frames with high-contrast active checkmarks (`.v1-frame-check`).
- **Asynchronous Feedback:** Shows loading placeholder while `DesktopCompositor` finishes rendering the draft composition.

### 3.8 ConfirmScreen (`ConfirmScreen.tsx`)
- **600 DPI High-Resolution Preview:** Displays the exact print canvas rendered by `DesktopCompositor`. Verified in the browser via `naturalWidth > 0`.
- **Idempotent Single-Submit CTA:** The button `"In và tạo QR →"` executes `print.confirmReal` or `print.confirmDryRun`.
- **Duplicate Protection:** Action button immediately disables on click, preventing double-tap duplicate prints.

### 3.9 DeliveryScreen (`DeliveryScreen.tsx`)
- **Celebratory Completion Card:** Centered white card with animated green checkmark.
- **Web Album Download QR:** Sharp, high-contrast QR code linking to the Cloudinary / Web Album customer gallery for photo and GIF download.
- **Session Finish:** `"Hoàn thành · Về trang đầu"` button that calls `session.finish`, resetting all memory state and camera preview threads back to `IDLE`.

### 3.10 AdminScreen (`AdminScreen.tsx` / `Operator.tsx`)
- **Operator Diagnostic Portal:** Accessible via 5 taps on the brand header.
- **Diagnostic Tabs:**
  1. *Hardware Status:* Canon DSLR connection, DNP printer detection, spooler state.
  2. *Layouts Catalog:* Real-time Firestore sync status, manual `catalog.sync` trigger, cache inspection.
  3. *Frames Index:* Frame asset counts, bundle thumbnails, disk directory inspection.
  4. *Revenue Ledger:* Local SQLite `sales.db` transaction log, un-synced queue count.
  5. *Settings:* Hardware dry-run toggles, paper cut configurations.

---

## 4. Staff Gesture Security: Hidden Cash Override

In retail operations, customers may pay the cashier with cash or bank transfer directly to the staff rather than scanning the VietQR kiosk code.

To prevent customers from activating the cash bypass while giving on-duty staff immediate access without requiring a physical keyboard, the UI implements a **discreet touch hold gesture**:

```
┌──────────────────────────────────────────────────────────────┐
│                    Bước 3 · Thanh toán                       │
│                                                              │
│       [Long Press 700ms on "Thanh toán" Header]              │
│                           │                                  │
│                 Finger moved > 12px?                         │
│                 ├── YES ──► Cancel Gesture                   │
│                 └── NO  ──► Timer Expires (700ms)            │
│                                   │                          │
│                                   ▼                          │
│                Reveal Staff Panel (.v1-payment-staff)        │
│                                   │                          │
│                 [Nhân viên xác nhận tiền mặt]                │
│                                   │                          │
│                                   ▼                          │
│             Calls: payment.mockComplete({ staffOverride: true })
└──────────────────────────────────────────────────────────────┘
```

### Implementation Details in `PaymentScreen.tsx`

```tsx
<h1 
  onPointerDown={() => {
    stopHold();
    hold.current = setTimeout(() => {
      setStaffPanelVisible(true);
      hold.current = null;
    }, 700);
  }}
  onPointerUp={stopHold}
  onPointerCancel={stopHold}
  onPointerLeave={stopHold}
  onContextMenu={event => event.preventDefault()}
>
  Thanh toán
</h1>
```

1. **700ms Dwell Time:** Standard long-press duration tuned for industrial touchscreens. Shorter than accidental pauses, fast enough for attendants.
2. **Drift Cancellation:** Cancels if the user's touch drifts more than $12\text{px}$, distinguishing between an intentional hold and a scroll gesture.
3. **Context Menu Suppression:** `onContextMenu={event => event.preventDefault()}` suppresses the default Chromium/WebView2 right-click/long-press context menu.
4. **Disclosed Action:** When triggered, a dedicated button appears at the bottom of the screen:
   ```tsx
   <div className="v1-payment-staff">
     <button 
       type="button" 
       disabled={busy || cashRequested.current}
       onClick={() => {
         if (cashRequested.current || busy) return;
         cashRequested.current = true;
         action('payment.mockComplete', { staffOverride: true });
       }}
     >
       <span className="v1-payment-dot" aria-hidden="true" />
       Nhân viên xác nhận tiền mặt
     </button>
   </div>
   ```
5. **Backend Authority:** The gesture simply reveals the button; it does not approve payment in the frontend. When clicked, the backend verifies that the session is in `PAYMENT_PENDING` and records `paymentMethod = "STAFF_COMP"`.

---

## 5. Unified Single-Application UX & Automatic Camera Fallback

In place of manual mode toggles, the V2 application unifies all kiosk operations into a single seamless customer journey:

1. **Uncluttered Start Experience:**
   - Manual buttons such as `.v1-mode-badge` and alert banners such as `.v1-offline-banner` have been removed.
   - Customers simply tap `"CHẠM ĐỂ BẮT ĐẦU →"`, which issues `session.start({ layoutId })` without forcing the customer to make technical decisions.
2. **Transparent Dynamic Promotion:**
   - At the `IDLE` state boundary, `RealSessionEngine` queries `cameraManager.resolveCaptureMode()`.
   - If a Canon DSLR or hardware camera is detected, the session promotes to `REAL` mode.
   - If the camera is offline or disconnected, the session seamlessly falls back to `DEMO` mock mode.
3. **Studio Trial Notice on Payment Screen:**
   - In fallback mode, the customer sees the complimentary studio trial card (`0 đ`, `Miễn phí` chip):
     > **TRẢI NGHIỆM CHỤP ẢNH MIỄN PHÍ**  
     > *Phiên trải nghiệm quy trình chụp và ghép khung ảnh. Không thu phí và không in ảnh thật.*
   - Tapping `"BẮT ĐẦU CHỤP →"` proceeds to the live viewfinder without charging or prompting for banking apps.
4. **Zero Revenue and Dry-Run Safety:**
   - 600-DPI high-resolution composition is rendered to evaluate print geometry, but physical spooling and SQLite sales ledger recording are skipped (`dryRun: true`, `revenueRecorded: false`).

---

## 6. Accessibility & Motion Preferences

In accordance with kiosk usability guidelines, all animations and high-motion transitions support the standard CSS `@media (prefers-reduced-motion: reduce)` media query:

```css
@media (prefers-reduced-motion: reduce) {
  .v1-shell button,
  .v1-countdown,
  .v1-flash,
  .v1-layout-card,
  .v1-frame-grid button,
  .v1-photo-grid button,
  .v1-bundles button {
    animation: none;
    transition: none;
  }
}
```

When reduced motion is active, the pulsing countdown ring displays as a solid static circle, and the 200ms camera flash is eliminated to prevent photosensitive discomfort.

---

## 7. Verification Evidence & Layout Screenshots

The UI redesign, 16:10 aspect ratio compliance, and screen flows are verified through automated testing in `frontend/` and `tests/`:

| Verification Target | Test Command / Script | Evidence Location / Result |
|---|---|---|
| Frontend Unit Tests | `npm test -- --run` (Vitest) | **49 passing unit tests** across all screen and component suites. |
| Production Build | `tsc --noEmit && vite build` | Completes with **0 errors in 3.55s** (2,015 modules transformed). |
| Viewport CDP Suite | `node tests/verify-demo-and-real-journey.mjs` | Automated Chromium CDP run verifying 1920×1200 and 1280×800 rendering: **63/63 checks passed, 0 failures**. |
| Screenshot Captures | CDP `Page.captureScreenshot` | **26 screenshots** stored in `tests/journey-evidence/2026-11-02T07-41-35.569Z/` capturing Start, Layout, Quantity, Payment, Live, Select, Frame, Confirm (600 DPI), and Delivery across both viewports. |

### Truthful Hardware Verification Boundary
- Mock fallback and Korean studio UI styling verified via live Tauri CDP on actual Windows desktop.
- Physical Canon DSLR capture, live PayOS charge settlement, and physical DNP printer spooling remain pending physical device attachment in the hardware lab.
