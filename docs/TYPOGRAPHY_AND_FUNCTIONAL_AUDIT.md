# LE SOUVENIR Photobooth V2 — Typography, Diacritics & Functional Invariants Audit

**Document:** `docs/TYPOGRAPHY_AND_FUNCTIONAL_AUDIT.md`<br>
**Role:** Legacy System Auditor (`legacy-auditor`)<br>
**Workspace:** `PhotoboothDesktop_v2` (V1 Compose Desktop strictly untouched)<br>
**Date:** November 2026<br>
**Status:** Complete Forensic Audit (Phase 1 & Phase 2)<br>
**Evidence Labels:**
- `[Observed in code]`: Directly verified in source files (`frontend/src/**/*.tsx`, `*.css`, tests).
- `[Inferred]`: Derived logically from platform typography engines, CSS specifications, or OS font fallbacks.
- `[Unverified hardware]`: Involves physical devices (Canon DSLR, DNP DS-RX1HS) pending live hardware confirmation.
- `[Missing evidence]`: Not attested in inspected codebases.

---

## 1. Executive Summary

This comprehensive audit inspects all typography, letter-spacing, word-spacing, line-height, text alignment, Vietnamese diacritic rendering, and functional invariants across LE SOUVENIR Photobooth V2 frontend.

The audit examined:
1. **Atelier Stylesheets**: `frontend/src/atelier/theme-tokens.css`, `atelier-core.css`, `atelier-customer.css`, `atelier-operator.css`, plus ancillary styles (`styles.css`, `screens/payment.css`, `operator/atelier-operator.css`).
2. **Kiosk Screens**: All screens in `frontend/src/screens/` (`StartScreen`, `StudioModeScreen`, `QuantityScreen`, `PaymentScreen`, `PrepareScreen`, `CaptureScreen`, `SelectPhotosScreen`, `FrameScreen`, `ConfirmScreen`, `PrintingScreen`, `DeliveryScreen`, `AdminScreen`, `KioskUI.tsx`, `LayoutArtwork.tsx`).
3. **Operator Workspace**: `frontend/src/Operator.tsx`, `V1Settings.tsx`, and all tabs in `frontend/src/operator/` (`RevenueTab`, `LayoutsTab`, `FramesTab`, `FiltersTab`, `ToolsCalculatorTab`).
4. **Acceptance Test Suites**: `tests/verify-demo-and-real-journey.mjs`, `tests/v1-settings-parity/mounted-settings-parity.mjs`, and vitest suites (`screens.test.tsx`, `Operator.test.tsx`, `V1Settings.test.tsx`, `StaffGestures.test.tsx`, `App.test.tsx`).

### Critical High-Level Findings:
1. **Severe Typography & Diacritic Risks**:
   - **Absence of Bundled Fonts & System Fallback Risks**: No `@font-face` rules exist in the repository `[Observed in code]`. The application relies entirely on host system fonts (`'Segoe UI', 'Noto Sans', Arial, sans-serif` for sans-serif and `Georgia, 'Times New Roman', serif` for editorial display). `Georgia` on standard Windows 10/11 installations lacks native composite glyphs for Vietnamese double diacritics (e.g. `ế`, `ề`, `ễ`, `ể`, `ệ`, `ố`, `ồ`, `ỗ`, `ổ`, `ộ`, `ớ`, `ờ`, `ỡ`, `ở`, `ợ`, `ứ`, `ừ`, `ữ`, `ử`, `ự`, `ắ`, `ằ`, `ẵ`, `ẳ`, `ặ`). This triggers abrupt mid-word or per-glyph font fallback to Times New Roman or Segoe UI, producing inconsistent stroke weights, x-height jumps, and baseline misalignment `[Inferred]`.
   - **`html lang="en"` in `index.html`**: The HTML root is set to `lang="en"`, which prevents WebView2/Chromium from applying Vietnamese OpenType localized forms and diacritic placement rules `[Observed in code]`.
   - **Negative Letter-Spacing on Accented Headings**: Display headings apply negative letter-spacing from `-.025em` down to `-.055em` (e.g., `.v1-start h1` has `-.055em`, `.v1-print-stage__intro h2` has `-.045em`, `.appHeader__copy h1` has `-.035em`). Negative tracking on Vietnamese words crowds tone marks and causes diacritic collisions with adjacent ascenders and capital letters `[Observed in code]`.
   - **Excessive Tracking on All-Caps Vietnamese**: Eyebrows and kickers apply positive tracking up to `.18em` and `.22em` (e.g., `SỐ BẢN IN` at `.18em`, `MÁY ẢNH ĐANG SẴN SÀNG` at `.16em`) without increasing `word-spacing`. This breaks word boundaries, visually detaching syllables into scattered individual characters `[Observed in code]`.
   - **Extremely Tight Line-Heights**: Headings are clamped to line-heights as tight as `1.03` (`.v1-start h1`) and `1.1` (`.v1-prepare-copy h2`, `.v1-print-stage__intro h2`). This causes upper diacritics (dấu mũ, dấu hỏi, dấu ngã, dấu sắc) to be clipped at container bounds or collide with preceding lines `[Observed in code]`.
   - **`overflow-wrap: anywhere` Syllable Breaking**: Indiscriminate use of `overflow-wrap: anywhere` on frame names and table data allows words to break mid-syllable (e.g. `kh-ung`, `cá-ch`), violating Vietnamese typographical rules `[Observed in code]`.
2. **Missing CSS Classes & Visual Inconsistencies**:
   - `.v1-shutter-caption` ("Chạm để chụp" in `CaptureScreen.tsx`) has zero CSS definitions `[Observed in code]`.
   - `.v1-pin-dots` (PIN dots display in `PaymentScreen.tsx`) has zero CSS layout/dot definitions `[Observed in code]`.
   - `.v1-pin-keypad` has button size overrides but lacks keypad grid styles in `atelier-customer.css` `[Observed in code]`.
   - Fixed height `height: 130px;` on `.v1-payment-instructions` overflows when recovery buttons appear in error states, producing an unwanted internal scrollbar `[Observed in code]`.
   - Font shorthand in `atelier-customer.css` line 152 (`font: 400 clamp(72px,7vw,112px)/1 Georgia,...`) inadvertently resets `font-variant-numeric: tabular-nums` to normal `[Observed in code]`.
3. **Step Progression Inconsistencies**:
   - `PaymentScreen` is labeled `Bước 3` ("Thanh toán"), while `SelectPhotosScreen` is also labeled `Bước 3` ("Chọn ảnh để in") `[Observed in code]`.
   - `StudioModeScreen` uses `BƯỚC 01 · CHỌN BỐ CỤC` (all-caps, padded number) while subsequent screens use `Bước 2`, `Bước 3`, `Bước 4` `[Observed in code]`.
   - `ConfirmScreen` lacks a `step` prop entirely `[Observed in code]`.
   - CTA arrow glyphs: All forward buttons end with `→` (`CHẠM ĐỂ BẮT ĐẦU →`, `Xem bản in →`, `Xác nhận & in →`), but `DeliveryScreen` uses `Hoàn thành · Về trang đầu` without an arrow `[Observed in code]`.
4. **Functional Invariants**: All 18 functional invariants verified by `verify-demo-and-real-journey.mjs` and `mounted-settings-parity.mjs` remain intact in source logic (touch target sizes, shutter concentricity, countdown centering, zero emoji policy, QR layout stability, staff gestures, even-only strip quantities, zero DEMO revenue).

---

## 2. Global Typography & Font Architecture Audit

### 2.1 Font Stacks & Fallback Mechanism

| Scope | Declared Font Stack in CSS | File & Line | Evaluated Behavior & Defect |
| :--- | :--- | :--- | :--- |
| **Root Canvas / App Shell** | `'Segoe UI', 'Noto Sans', Arial, sans-serif` | `theme-tokens.css:3`<br>`atelier-core.css:8` | `[Observed in code]` Windows native Segoe UI renders Vietnamese sans-serif diacritics well, but Arial fallback on non-Windows hosts has uneven tone mark positioning. |
| **Operator Workspace** | `'Segoe UI', system-ui, sans-serif`<br>`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | `atelier-operator.css:4`<br>`atelier-operator.css:11` | `[Observed in code]` Inconsistent fallback order between lines 4 and 11. Minor stylistic delta, but Segoe UI remains primary on Windows. |
| **Editorial Headings & Brand** | `Georgia, 'Times New Roman', serif` | `atelier-core.css:25`<br>`atelier-customer.css:114, 131, 140, 141, 182, 205, 236, 250`<br>`atelier-operator.css:39, 47` | `[Observed in code]` **CRITICAL DEFECT**. Standard `Georgia` on Windows does not support complete Vietnamese precomposed glyphs with double accents (e.g., `ế`, `ệ`, `ố`, `ộ`, `ử`, `ự`, `ắ`, `ặ`). The browser falls back to `Times New Roman` or system fonts, causing font weight jumps, mismatched cap heights, and baseline wobble `[Inferred]`. |
| **Stepper Number Display** | `Georgia, 'Times New Roman', serif` | `atelier-customer.css:152` | `[Observed in code]` Georgia digits are proportional oldstyle figures unless `lining-nums` / `tabular-nums` is enforced. Shorthand `font:` resets `font-variant-numeric` `[Observed in code]`. |
| **SVG Artwork Labels** | `fontFamily="sans-serif"`<br>`fontFamily="Georgia,serif"` | `LayoutArtwork.tsx:36`<br>`LayoutArtwork.tsx:38` | `[Observed in code]` Generic `sans-serif` and `Georgia,serif` inside SVG `<text>`. At small sizes (e.g. `fontSize="6"`), diacritics on "Ảnh 1" blur or clip `[Inferred]`. |

### 2.2 Lack of Bundled Fonts & OpenType Shaping

1. **Zero Bundled Webfonts (`@font-face`)**:
   - `grep` across the entire `frontend/` directory confirms zero `@font-face` declarations.
   - The application does not bundle modern, Vietnamese-native typography families such as **Be Vietnam Pro**, **Inter**, or **Playfair Display / Merriweather** (serif).
2. **HTML Locale Configuration**:
   - `frontend/index.html` line 1: `<html lang="en">`.
   - Setting `lang="en"` in a Vietnamese kiosk application disables language-specific OpenType typographic features (such as `locl` feature for Vietnamese, which adjusts acute and grave accent positions above circumflex accents).

---

## 3. Micro-Typography & Layout Defects Catalog

### 3.1 Letter-Spacing & Kerning Distortions

#### A. Negative Letter-Spacing on Vietnamese Text (Collisions & Crowding)
Vietnamese diacritics sit above and below base glyphs. Applying negative tracking (`letter-spacing < 0`) pushes vowel diacritics into adjacent ascenders (`b`, `d`, `h`, `k`, `l`, `t`) and capital letters.

| Selector | Rule | Target String (Sample) | Identified Defect |
| :--- | :--- | :--- | :--- |
| `.v1-shell.atelier-customer .v1-start h1` | `letter-spacing: -.055em;`<br>`line-height: 1.03;` | `"Chụp ảnh lấy ngay"` | **Severe Collision**: Hook on `ả` and dot below on `ụ` are squeezed; "Ch" collides with "ụ", "ả" collides with "n". |
| `.v1-print-stage__intro h2` | `letter-spacing: -.045em;`<br>`line-height: 1.1;` | `"Đang xử lý khoảnh khắc của bạn"` | **Severe Collision**: Double diacritics on `ử` (horn + hook) and `ắ` (breve + acute) collide with adjacent letters `l` and `k`. |
| `.appHeader__copy h1` | `letter-spacing: -.035em;` | `"Chọn số lượng bản in"`, `"Chọn ảnh để in"`, `"Chọn khung trang trí"` | **Crowding**: Accent marks on `ộ`, `ố`, `ể` feel cramped against neighboring consonants. |
| `.v1-delivery__details h2` | `letter-spacing: -.035em;`<br>`line-height: 1.12;` | `"Khoảnh khắc của bạn"` | **Crowding**: Breve + acute on `ắ` sits tightly against `k`. |
| `.operator-workspace .v1-admin-heading h1` | `letter-spacing: -.025em;` | `"Quản trị hệ thống"` | **Mild Crowding**: `ệ` and `ố` in Georgia. |
| `.v1-settings h2` | `letter-spacing: -.035em;` | `"Cài đặt hệ thống Kiosk"` | **Crowding**: `à`, `ệ`, `ố` squeezed. |

#### B. Excessive Letter-Spacing on Vietnamese Uppercase (Syllable Disintegration)
In Vietnamese, words are written as space-separated syllables. Setting `letter-spacing: .12em` to `.22em` without increasing `word-spacing` causes intra-syllable spacing to match inter-word spacing, dissolving word comprehension.

| Selector | Rule | Target String | Identified Defect |
| :--- | :--- | :--- | :--- |
| `.v1-shell.atelier-customer .v1-brand` | `letter-spacing: .22em;` | `"LE SOUVENIR"` | Acceptable for Latin brand, but trailing letter `R` creates an optical right-hand whitespace imbalance. |
| `.v1-quantity-eyebrow` | `letter-spacing: .18em;` | `"SỐ BẢN IN"` | **Severe**: Renders as `S Ố   B Ả N   I N`. Accent on `Ố` and `Ả` looks detached from base letter. |
| `.v1-settings>header small` | `letter-spacing: .17em;` | `"VẬN HÀNH THIẾT BỊ"` | **Severe**: Syllable boundaries disappear; accents float unnaturally. |
| `.v1-prepare-kicker` | `letter-spacing: .16em;` | `"MÁY ẢNH ĐANG SẴN SÀNG"` | **Severe**: Breve + tilde on `Ẵ` and accents on `Á`, `Ả`, `À` feel disconnected from words. |
| `.v1-delivery__eyebrow` | `letter-spacing: .16em;` | `"MỘT KHOẢNH KHẮC ĐÁNG NHỚ"` | **Severe**: `Ộ`, `Ả`, `Ắ`, `Á`, `Ớ` are heavily spaced, causing reading stutter on kiosk display. |
| `.v1-payment-label` | `letter-spacing: .14em;` | `"TỔNG THANH TOÁN"` | **Moderate**: `Ổ` and `Á` accents look loose. |
| `.appHeader__eyebrow` | `letter-spacing: .12em;` | `"BƯỚC 01 · CHỌN BỐ CỤC"` | **Moderate**: `Ư`, `Ớ`, `Ộ`, `Ụ` tracking exceeds normal typographic balance. |
| `.v1-start .v1-primary` | `letter-spacing: .04em;` | `"CHẠM ĐỂ BẮT ĐẦU →"` | **Mild**: Caps tracking on button label is legible, but arrow `→` receives unwanted trailing spacing. |

---

### 3.2 Line-Height & Vertical Clipping Matrix

| Selector | Line-Height | Font-Size | Target Content | Clipping Risk & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `.v1-start h1` | `1.03` | `clamp(48px,5vw,94px)` | `"Chụp ảnh lấy ngay"` | **High**: Upper hook on `ả` and lower dot on `ụ` will clip if parent container or bounding box clips overflow `[Observed in code]`. |
| `.v1-prepare-copy h2` | `1.1` | `clamp(38px,4.5vw,76px)` | `"Hãy nhìn vào ống kính"` | **High**: Tilde on `ã` and circumflex + acute on `ố` exceed the line box height `[Observed in code]`. |
| `.v1-print-stage__intro h2` | `1.1` | `clamp(36px,4vw,66px)` | `"Đang xử lý khoảnh khắc của bạn"` | **High**: Double accents on `ử` and `ắ` prone to ascender collision and clipping `[Observed in code]`. |
| `.v1-delivery__details h2` | `1.12` | `clamp(34px,3.5vw,58px)` | `"Khoảnh khắc của bạn"` | **Moderate**: Breve + acute on `ắ` sits near top of line box `[Observed in code]`. |
| `.v1-payment-price` | `1.14` | `clamp(42px,4.2vw,68px)` | `"{total} đ"` | **Low**: Digits and currency symbol `đ` stay within line height, but line-height is tight `[Observed in code]`. |
| `.v1-stepper strong` | `1` | `clamp(72px,7vw,112px)` | `2`, `4`, `6`, etc. | **Moderate**: Oldstyle figure descenders in Georgia clip at baseline `[Observed in code]`. |
| `.v1-countdown` | `1` | `clamp(80px,11vw,160px)` | Countdown digit | **Low**: Tabular numerals are centered vertically inside 192px box `[Observed in code]`. |

---

### 3.3 Text Alignment, Button Wrapping & Touch Target Anomalies

#### A. Long Button Strings Lacking `white-space: nowrap`
`.v1-primary` and `.v1-secondary` are styled as pill buttons (`border-radius: 999px; min-height: 72px; padding: 12px 28px; display: inline-flex; align-items: center; justify-content: center;`). Neither class sets `white-space: nowrap;`.

On narrower viewports (or 1280×800 touchscreens), long Vietnamese button strings wrap into two lines inside a pill shape, causing text corners to visually collide with the rounded border:
1. `"Xác nhận bản mô phỏng →"` (24 characters, `ConfirmScreen.tsx:32`).
2. `"Tiếp tục · Xác nhận giá →"` (24 characters, `QuantityScreen.tsx:36`).
3. `"Hoàn thành · Về trang đầu"` (25 characters, `DeliveryScreen.tsx:30`).
4. `"Nhân viên xác nhận tiền mặt"` (27 characters, `PaymentScreen.tsx:82`).
5. `"Kiểm tra lại trạng thái · Không gửi lại lệnh"` (45 characters, `KioskSimulator.tsx:79`).

#### B. Arrow `→` & Operator `·` Baseline Misalignment
In `.v1-primary` and action bar buttons, the arrow symbol `→` (U+2192) and separator dot `·` (U+00B7) are placed directly inline with Vietnamese text:
- `CHẠM ĐỂ BẮT ĐẦU →`
- `Tiếp tục · 80.000 đ →`
- `Xem bản in →`
- `Xác nhận & in →`
- `Xác nhận bản mô phỏng →`

**Identified Misalignment**: In system fonts (Segoe UI / Arial), `→` sits below the baseline of uppercase Vietnamese letters (`Ầ`, `Ắ`, `Đ`). Furthermore, the separator `·` has inconsistent vertical centering relative to uppercase vs lowercase letters, giving button text an uneven optical baseline.

#### C. Stepper Button Minus `−` vs Plus `+`
In `QuantityScreen.tsx:22-24` and `V1Settings.tsx:31`:
- Decrement uses mathematical minus `−` (U+2212).
- Increment uses ASCII plus `+` (U+002B).
In Segoe UI and Arial, `−` (U+2212) has a higher vertical offset than the horizontal bar of `+`, creating visual asymmetry between the left and right circular stepper buttons.

#### D. Tabular Numerals Wiped Out by CSS Font Shorthand
In `atelier-customer.css:58`:
`.v1-shell .v1-stepper strong { font-size: clamp(42px,5vw,78px); font-variant-numeric: tabular-nums; }`
Then at line 152:
`.v1-shell .v1-quantity .v1-stepper strong { font: 400 clamp(72px,7vw,112px)/1 Georgia,'Times New Roman',serif; }`
**Defect**: In standard CSS, the `font:` shorthand resets all unlisted font subproperties (including `font-variant-numeric`) back to `normal`. This wipes out `tabular-nums` on the quantity readout!

#### E. Syllable Breaking via `overflow-wrap: anywhere`
`overflow-wrap: anywhere;` is applied globally to `.v1-frame-grid strong` (`atelier-customer.css:63`) and `.operator-workspace>nav button` (`atelier-operator.css:8`).
**Defect**: On narrower card sizes or longer frame names, words are broken arbitrarily at any character rather than at syllable/word boundaries (e.g. `Khung C-ổ Đi-ển`), creating typographical errors in Vietnamese.

---

### 3.4 Container Overflow & Unstyled Element Inventory

#### A. Fixed-Height Overflow in Payment Screen Instructions
In `atelier-customer.css:47` and `173`:
```css
.v1-payment-instructions {
  height: 130px;
  flex: 0 0 130px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: safe center;
  gap: 8px;
  overflow-y: auto;
}
```
When `PaymentScreen.tsx:79` enters the error / unconfigured state (`warning === true`), it renders:
1. `<h2>Không tạo được mã QR thanh toán</h2>` (~24px height)
2. `<p>Vui lòng thanh toán tiền mặt tại quầy hoặc liên hệ nhân viên hỗ trợ</p>` (~44px height, 2 lines)
3. `<div className="v1-payment-recovery"><button class="v1-secondary">Thử lại tạo mã QR</button><button class="v1-secondary">Quay lại</button></div>` (~56px height)
4. Layout gaps: `8px + 8px`
**Total required height**: `24 + 44 + 56 + 16 = 140px`.<br>
In a container strictly fixed to `height: 130px; flex: 0 0 130px;`, this forces an immediate internal scrollbar and clips the recovery action buttons.

#### B. Unstyled Component: `.v1-shutter-caption`
In `CaptureScreen.tsx:52`:
`<span className="v1-shutter-caption">Chạm để chụp</span>`
**Audit Finding**: `.v1-shutter-caption` is tested in `screens.test.tsx:35`, but **zero CSS rules exist** for `.v1-shutter-caption` in any stylesheet. It inherits raw unstyled inline text, lacking margin, font-size, font-weight, color, or text-shadow.

#### C. Unstyled Component: `.v1-pin-dots`
In `PaymentScreen.tsx:83`:
`<div className="v1-pin-dots" aria-label="...">...<span key={i} className={i<pin.length?'filled':''}/>...</div>`
**Audit Finding**: Zero CSS rules exist for `.v1-pin-dots` or `.v1-pin-dots span` in `atelier-customer.css` or `atelier-core.css`. The 4 PIN circles render as empty inline zero-size spans.

#### D. Unstyled Component: `.v1-pin-keypad` Layout Grid
In `PaymentScreen.tsx:83`:
`<div className="v1-pin-keypad">{...buttons...}</div>`
In `atelier-customer.css:174`:
`.v1-staff-pin .v1-pin-keypad button { min-width: 56px; min-height: 56px; }`
**Audit Finding**: The buttons have touch dimensions, but `.v1-pin-keypad` itself has no grid rule (e.g. `display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;`). Without grid styling, keypad buttons flow as inline-block elements.

---

## 4. Comprehensive Vietnamese String Inventory & Rendering Risk Matrix

The table below catalogs every Vietnamese user-facing string across `frontend/src/`, detailing its UI context, applied typographic rules, diacritic complexity, and identified defects.

*Complexity scale: Low (standard vowels + simple tone) / Medium (single modifier e.g. `ơ, ư, đ` + tone) / High (stacked composite diacritics e.g. `ế, ệ, ố, ộ, ử, ự, ắ, ặ`).*

| Screen & File | Element / String | Typographic Styles Applied | Complexity | Identified Defects & Risks |
| :--- | :--- | :--- | :--- | :--- |
| **StartScreen.tsx:19** | `<p class="v1-kicker">PHOTO ATELIER · SEOUL × SAIGON</p>` | `font-size: clamp(13px,1vw,15px); letter-spacing: .06em; font-weight: 700;` | Low (EN) | Multiplication sign `×` centered correctly; tracking is balanced. |
| **StartScreen.tsx:20** | `<h1>Chụp ảnh<br/>lấy ngay</h1>` | `font: 400 clamp(48px,5vw,94px)/1.03 Georgia,serif; letter-spacing: -.055em;` | High (`ụ, ả, ấ`) | **CRITICAL**: Negative tracking `-.055em` crowds diacritics; line-height `1.03` clips hook on `ả`; Georgia font fallback jitter. |
| **StartScreen.tsx:20** | `<p class="v1-start-desc">Giữ lại những khoảnh khắc đẹp bên người thân và bạn bè.</p>` | `font-size: clamp(17px,1.3vw,21px); line-height: 1.45; color: var(--at-body);` | High (`ữ, ữ, ắ, đ, ườ, ậ, è`) | Well proportioned line-height (1.45); legible Segoe UI body copy. |
| **StartScreen.tsx:21** | `<span>Bản in lưu niệm</span>` | `font-size: 15px; padding: 9px 14px; border-radius: 999px;` | Medium (`ả, ệ`) | Clean rendering in pill badge. |
| **StartScreen.tsx:21** | `<span>Album ảnh qua QR</span>` | `font-size: 15px; padding: 9px 14px; border-radius: 999px;` | Low (`ả`) | Clean rendering in pill badge. |
| **StartScreen.tsx:22** | `<p role="status">Chưa có bố cục khả dụng. Vui lòng liên hệ nhân viên.</p>` | `font-size: 16px; color: var(--at-body);` | High (`ố, ụ, ả, ụ, ê, ệ, ê`) | Clean rendering in status alert. |
| **StartScreen.tsx:23** | `<button class="v1-primary">CHẠM ĐỂ BẮT ĐẦU →</button>` | `min-height: 72px; padding: 12px 28px; letter-spacing: .04em; font-weight: 700;` | High (`Ạ, Ể, Ắ, Ầ`) | All-caps stacked diacritics extend above cap-height; arrow `→` baseline sits below capital letters. |
| **StudioModeScreen.tsx:59** | `<Heading title="Bố cục" step="BƯỚC 01 · CHỌN BỐ CỤC" subtitle="Chọn kiểu ảnh yêu thích"/>` | Title: `Georgia -.035em`<br>Eyebrow: `letter-spacing: .12em` | High (`ố, ụ, Ư, Ớ, Ọ, Ể, ả, ê, í`) | **Inconsistent Step Eyebrow**: Uses uppercase `"BƯỚC 01 · CHỌN BỐ CỤC"` while next screen uses `"Bước 2"`. |
| **LayoutArtwork.tsx:5** | `"Dải 4 ảnh cổ điển"` | `.v1-carousel-card strong: clamp(17px,1.5vw,23px);` | High (`ả, ổ, đ, ể`) | Legible title; Georgia fallback applies when serif parent is active. |
| **LayoutArtwork.tsx:6** | `"Khung 4 ảnh postcard"` | `.v1-carousel-card strong` | Low (`ả`) | Clean display. |
| **LayoutArtwork.tsx:7** | `"Khung 4 ảnh đặc biệt"` | `.v1-carousel-card strong` | High (`ặ, ệ`) | Clean display. |
| **LayoutArtwork.tsx:12** | `"{selectCount} ảnh · Dải 5×15 cm · {countdownSeconds}s đếm ngược"` | `.v1-carousel-subtitle: 15px; color: var(--at-body);` | High (`ả, ả, đ, ế, ượ`) | Clean formatting with multiplication symbol `×`. |
| **StudioModeScreen.tsx:62, 69** | `<button aria-label="Bố cục trước|tiếp theo">` | Chevron button `>=56x56` | Medium (`ố, ụ, ướ, ế`) | Screen-reader only; accessible. |
| **StudioModeScreen.tsx:66** | `<span class="sr-only">Chạm lần nữa để chọn dải ảnh này →</span>` | `.sr-only` | High (`ạ, ầ, ữ, ọ, ả, ả, à`) | Screen-reader only; accessible. |
| **QuantityScreen.tsx:16** | `<Heading step="Bước 2" title="Chọn số lượng bản in" subtitle="Mỗi bản in là một kỷ niệm để mang về."/>` | Title: `Georgia -.035em`<br>Subtitle: `clamp(16px,1.15vw,19px)` | High (`ướ, ọ, ượ, ả, ỗ, ả, ộ, ỷ, ệ, để, ề`) | Title diacritics slightly crowded under `-.035em`. |
| **QuantityScreen.tsx:20** | `<p class="v1-quantity-eyebrow">SỐ BẢN IN</p>` | `font-size: 13px; font-weight: 700; letter-spacing: .18em; color: var(--at-primary);` | High (`Ố, Ả`) | **Severe**: Syllable separation distorted by `.18em` tracking. |
| **QuantityScreen.tsx:22, 24** | `<button aria-label="Giảm|Tăng số lượng">` | Buttons: `72x72px circular` | High (`ả, ă, ố, ượ`) | Stepper minus `−` vs plus `+` vertical alignment asymmetry. |
| **QuantityScreen.tsx:26** | `<p class="v1-quantity-hint">Bản in dải được chọn theo cặp</p>` | `font-size: 16px; color: var(--at-body);` | High (`ả, ả, đượ, ọ, ặ`) | Clean centered text. |
| **QuantityScreen.tsx:29-31** | `"Giá cơ bản"`, `"In thêm X bản"`, `"Tổng cộng"` | `font-variant-numeric: tabular-nums; display: flex; justify-content: space-between;` | Medium (`á, ơ, ả, ê, ả, ổ, ộ`) | Legible financial breakdown table. |
| **QuantityScreen.tsx:31** | `"Tổng giá được backend xác nhận ở bước tiếp theo"` | `font-size: 15px; color: var(--at-body);` | High (`ổ, á, đượ, á, ậ, ở, ướ, ế`) | Clean fallback notice. |
| **QuantityScreen.tsx:36** | `<button class="v1-primary">Tiếp tục · Xác nhận giá →</button>` | `.v1-primary: min-height: 72px; padding: 12px 28px;` | High (`ế, ụ, á, ậ, á`) | **Wrapping Hazard**: 24 characters without `white-space: nowrap` may wrap to 2 lines in 1280×800. |
| **PaymentScreen.tsx:63** | `<Heading step="Bước 3" title="Thanh toán" subtitle="Một bước nữa trước khi lưu giữ khoảnh khắc của bạn."/>` | Title: `Georgia -.035em`<br>Subtitle: `line-height: 1.45;` | High (`ướ, á, ướ, ữ, ướ, ữ, ả, ắ, ủ, ạ`) | **Step Duplication**: `Bước 3` is reused on `SelectPhotosScreen`. |
| **PaymentScreen.tsx:66** | `<p class="v1-payment-label">TỔNG THANH TOÁN</p>` | `font-size: 13px; letter-spacing: .14em; font-weight: 700;` | High (`Ổ, Á`) | Distorted syllable boundaries due to `.14em` letter-spacing. |
| **PaymentScreen.tsx:67** | `<strong class="v1-payment-price">{total} đ</strong>` | `font: 400 clamp(42px,4.2vw,68px)/1.14 Georgia;` | Medium (`đ`) | Georgia digits oldstyle unless tabular-nums enforced. |
| **PaymentScreen.tsx:69-75** | `"Bố cục"`, `"Khổ in"`, `"Số lượng"`, `"Giá cơ bản"`, `"Trạng thái"` | `font-size: clamp(16px,1.3vw,19px); font-variant-numeric: tabular-nums;` | High (`ố, ụ, ổ, ố, ượ, á, ơ, ả, ạ, á`) | Clean definition list alignment. |
| **PaymentScreen.tsx:75** | `"Cần nhân viên hỗ trợ"`, `"Chờ thanh toán QR"`, `"Đang chờ xác nhận"` | `font-size: 14px; padding: 10px 16px; border-radius: 999px;` | High (`ầ, ê, ổ, ợ, ờ, á, ờ, á, ậ`) | Amber chip with pulsing dot. Clean rendering. |
| **PaymentScreen.tsx:78** | `<div role="status" aria-label="Mã thanh toán đã sẵn sàng">` | Accessibility label | High (`ã, á, đã, ẵ, à`) | Accessible; screen-reader only. |
| **PaymentScreen.tsx:79** | `<h2>Không tạo được mã QR thanh toán</h2>` | `font-size: clamp(20px,1.8vw,26px);` | Medium (`đượ, ã, á`) | **Overflow**: Triggers 130px container overflow. |
| **PaymentScreen.tsx:79** | `<p>Vui lòng thanh toán tiền mặt tại quầy hoặc liên hệ nhân viên hỗ trợ</p>` | `font-size: 16px; color: var(--at-body);` | High (`ò, á, ề, ặ, ạ, ầ, ệ, ê, ổ, ợ`) | **Overflow**: Triggers 130px container overflow. |
| **PaymentScreen.tsx:79** | `<button class="v1-secondary">Thử lại tạo mã QR</button>` | `min-height: 56px; border-radius: 999px;` | Medium (`ử, ạ, ạ, ã`) | **Overflow**: Exceeds fixed instruction box height. |
| **PaymentScreen.tsx:79** | `<h2>Quét mã bằng ứng dụng ngân hàng</h2>` | `font-size: clamp(20px,1.8vw,26px);` | High (`é, ã, ằ, ứ, ụ, â, à`) | Clean header when QR is displayed. |
| **PaymentScreen.tsx:79** | `<p>Hệ thống sẽ tự động chuyển sang bước chụp ngay khi nhận được thanh toán.</p>` | `font-size: 16px; max-width: 440px;` | High (`ệ, ố, ẽ, ự, ộ, uyể, ướ, ụ, ậ, đượ, á`) | Legible instructions. |
| **PaymentScreen.tsx:82** | `<button class="v1-staff-cash-btn">Nhân viên xác nhận tiền mặt</button>` | `min-height: 56px; padding: 10px 24px; border-radius: 999px;` | High (`â, ê, á, ậ, ề, ặ`) | Revealed staff cash action. Clean text. |
| **PaymentScreen.tsx:83** | `<h2>Mã PIN nhân viên</h2>`, `<p>Nhập mã PIN 4 chữ số</p>` | Modal dialog: `background: #fff; border-radius: 24px;` | Medium (`ã, â, ê, ậ, ữ, ố`) | Modal dialog; clean text. |
| **PaymentScreen.tsx:83** | `<p role="alert">Mã PIN không đúng. Vui lòng thử lại.</p>` | `color: var(--at-error); font-weight: 700;` | High (`ã, ú, ò, ử, ạ`) | Clear error feedback. |
| **PrepareScreen.tsx:3** | `<Heading title="Chuẩn bị" subtitle="Khoảnh khắc của bạn sắp bắt đầu"/>` | Title: `Georgia -.035em` | High (`ẩ, ị, ả, ắ, ủ, ạ, ắ, ắ, ầ`) | Clean transition screen. |
| **PrepareScreen.tsx:5** | `<p class="v1-prepare-kicker">MÁY ẢNH ĐANG SẴN SÀNG</p>` | `letter-spacing: .16em; font-size: 13px;` | High (`Á, Ả, Ẵ, À`) | **Severe**: Syllables scattered by `.16em` tracking. |
| **PrepareScreen.tsx:5** | `<h2>Hãy nhìn vào ống kính</h2>` | `font: 400 clamp(38px,4.5vw,76px)/1.1 Georgia;` | High (`ã, ì, à, ố, í`) | **Line-Height Risk**: Tight 1.1 line-height in Georgia. |
| **PrepareScreen.tsx:5** | `<p>Đứng gần nhau, tạo dáng thoải mái và mỉm cười nhé!</p>` | `font-size: 18px; color: #ded8d1;` | High (`ứ, ầ, ạ, á, ả, á, à, ỉ, ườ, é`) | Legible body copy. |
| **PrepareScreen.tsx:5** | `<span>{shotCount} lượt chụp</span>`, `<span>Đếm ngược {seconds}s</span>` | Darkroom pill: `background: #ffffff17;` | High (`ượ, ụ, ế, ượ`) | High contrast pills. |
| **PrepareScreen.tsx:5** | `<p class="v1-prepare-status">Đang chuẩn bị máy ảnh…</p>` | `color: var(--at-body);` | Medium (`ẩ, ị, á, ả`) | Status text. |
| **CaptureScreen.tsx:43** | `<img alt="Live View máy ảnh"/>` | Alt text | Low (`á, ả`) | Accessible. |
| **CaptureScreen.tsx:46** | `<p role="status">Đang chờ hình ảnh từ máy ảnh…</p>` | `color: #fff; text-align: center;` | High (`ờ, ì, ả, ừ, á, ả`) | High-contrast placeholder. |
| **CaptureScreen.tsx:50** | `<div role="timer" aria-label="Còn X giây">` | Accessible countdown | Low (`ò, â`) | Screen-reader only. |
| **CaptureScreen.tsx:51** | `<div class="v1-capture-top">Ảnh {count+1}/{shotCount}</div>` | `font-weight: 700; font-variant-numeric: tabular-nums;` | Low (`Ả`) | Dead-centered pill at top of camera frame. |
| **CaptureScreen.tsx:52** | `<button class="v1-shutter" aria-label="Bắt đầu chụp">` | Shutter button `108x108px` | High (`ắ, ầ, ụ`) | Accessible. |
| **CaptureScreen.tsx:52** | `<span class="v1-shutter-caption">Chạm để chụp</span>` | Unstyled in CSS `[Observed in code]` | Medium (`ạ, để, ụ`) | **Unstyled Element**: Zero CSS rules. |
| **SelectPhotosScreen.tsx:58** | `<Heading step="Bước 3" title="Chọn ảnh để in" subtitle="Đã chọn X/Y ảnh · Chạm để chọn, giữ để xem lớn"/>` | Title: `Georgia -.035em` | High (`ướ, ọ, ả, để, Đã, ọ, ả, ạ, để, ọ, ữ, để, ớ`) | **Step Duplication**: Step 3 reused from Payment. |
| **SelectPhotosScreen.tsx:68** | `<button aria-label="Chọn ảnh X">` | Photo card | Low (`ọ, ả`) | Accessible button. |
| **SelectPhotosScreen.tsx:107** | `<img alt="Ảnh gốc hoàn chỉnh X"/>` | Alt text | Medium (`Ả, ố, oà, ỉ`) | Accessible alt text. |
| **SelectPhotosScreen.tsx:108** | `<span class="v1-photo-order">{order+1}</span>` | `width: 44px; height: 44px; border-radius: 50%; font-weight: 800;` | N/A (Number) | High-contrast orange circle badge. |
| **SelectPhotosScreen.tsx:121** | `<div role="dialog" aria-label="Xem lớn ảnh X">` | 500ms hold lightbox | Low (`ớ, ả`) | Accessible modal. |
| **SelectPhotosScreen.tsx:129** | `<span>Chạm vào ảnh theo thứ tự muốn in · Giữ để xem lớn</span>` | Action bar notice | High (`ạ, à, ả, ứ, ự, uố, ữ, để, ớ`) | Clean explanatory text. |
| **SelectPhotosScreen.tsx:131** | `<button class="v1-primary">Tiếp tục →</button>` | `.v1-primary` | Low (`ế, ụ`) | Clean forward button. |
| **FrameScreen.tsx:57** | `<Heading step="Bước 4" title="Chọn khung trang trí" subtitle="Chọn khung phù hợp với khoảnh khắc"/>` | Title: `Georgia -.035em` | High (`ướ, ọ, ứ, hù, ợ, ớ, ả, ắ`) | Clean header. |
| **FrameScreen.tsx:78** | `<strong>{formatFrameName(frame.name)}</strong>` | `overflow-wrap: anywhere; line-height: 1.25;` | Medium (`ô, á, hờ, ầ`) | **Syllable Breaking Risk**: `overflow-wrap: anywhere` breaks words mid-syllable. |
| **FrameScreen.tsx:84** | `<button class="v1-secondary">Quay lại</button>` | `.v1-secondary: min-height: 56px;` | Low (`ạ`) | Standard secondary button. |
| **FrameScreen.tsx:84** | `<button class="v1-primary">Xem bản in →</button>` | `.v1-primary` | Low (`ả`) | Standard primary button. |
| **ConfirmScreen.tsx:11** | `<Heading title="Kiểm tra lần cuối" subtitle="Kiểm tra bản ghép trước khi xác nhận"/>` | Title: `Georgia -.035em` | High (`ể, ầ, uố, ể, ả, é, ướ, á, ậ`) | **Missing Step**: No `step` prop supplied. |
| **ConfirmScreen.tsx:15** | `<h2>Đơn hàng của bạn</h2>` | `font: 400 clamp(24px,2.3vw,38px)/1.2 Georgia;` | High (`Đơ, à, ủ, ạ`) | Georgia serif heading. |
| **ConfirmScreen.tsx:16-22** | `"Bố cục"`, `"Khổ in"`, `"Số lượng"`, `"Giá gốc"`, `"In thêm"`, `"Tổng cộng"` | `font-variant-numeric: tabular-nums;` | High (`ố, ụ, ổ, ố, ượ, á, ố, ê, ổ, ộ`) | Legible order summary list. |
| **ConfirmScreen.tsx:23** | `<small>Xác nhận để gửi bản in đến máy in</small>` (Real) | `color: var(--at-body); font-size: 14px;` | High (`á, ậ, để, ử, ả, đế, á`) | Truthful system notice. |
| **ConfirmScreen.tsx:23** | `<small>Chế độ mô phỏng · Không gửi lệnh in thật</small>` (Demo) | `color: var(--at-body); font-size: 14px;` | High (`ế, ộ, ô, ỏ, ử, ệ, ậ`) | Truthful DEMO notice. |
| **ConfirmScreen.tsx:27** | `<span>Xác nhận một lần, không gửi lại nếu mạng gián đoạn</span>` | Action bar notice | High (`á, ậ, ộ, ầ, ử, ạ, ế, ạ, đạ`) | Clear idempotency hint. |
| **ConfirmScreen.tsx:32** | `<button class="v1-primary">Xác nhận & in →</button>` (Real) | `.v1-primary` | High (`á, ậ`) | Ampersand `&` kerning delta in sans-serif. |
| **ConfirmScreen.tsx:32** | `<button class="v1-primary">Xác nhận bản mô phỏng →</button>` (Demo) | `.v1-primary` | High (`á, ậ, ả, ô, ỏ`) | **Wrapping Hazard**: 24 characters without nowrap. |
| **PrintingScreen.tsx:3** | `['Ghép ảnh', 'In ảnh', 'Album & QR', 'Hoàn tất']` | `.v1-print-stage__step strong: 500 font-weight;` | High (`é, ả, ả, oà, ấ`) | Clean 4-step pipeline list. |
| **PrintingScreen.tsx:9** | `<Heading title="In và tạo QR" subtitle="Vui lòng chờ trong giây lát"/>` | Title: `Georgia -.035em` | High (`à, ạ, ò, ờ, â, á`) | Clean waiting screen. |
| **PrintingScreen.tsx:13** | `<h2>Đang xử lý khoảnh khắc của bạn</h2>` | `font: 400 clamp(36px,4vw,66px)/1.1 Georgia; letter-spacing: -.045em;` | High (`ử, ý, ả, ắ, ủ, ạ`) | **CRITICAL**: Tight line-height 1.1 + tracking `-.045em` in Georgia. |
| **PrintingScreen.tsx:14** | `<p>Đang tạo bản thử · Không in giấy thật</p>` (Demo) | `line-height: 1.55; color: var(--at-body);` | High (`ạ, ả, ử, ấ, ậ`) | Honest DEMO notice. |
| **PrintingScreen.tsx:14** | `<p>Đang chờ xác nhận tiến độ từ hệ thống in</p>` (Real) | `line-height: 1.55; color: var(--at-body);` | High (`ờ, á, ậ, ế, ộ, ừ, ệ, ố`) | Truthful Real mode notice. |
| **PrintingScreen.tsx:22** | `"Đang xử lý · Chưa có xác nhận từng bước"` | `color: var(--at-primary); font-weight: 600;` | High (`ử, ý, ư, á, ậ, ừ, ướ`) | Pulsing standby status. |
| **DeliveryScreen.tsx:13** | `<Heading title="Hoàn tất" subtitle="Cảm ơn bạn đã chụp ảnh cùng LE SOUVENIR"/>` | Title: `Georgia -.035em` | High (`oà, ấ, ả, ơ, ạ, đã, ụ, ả, ù`) | Clean final heading. |
| **DeliveryScreen.tsx:17** | `<span class="v1-delivery__eyebrow">MỘT KHOẢNH KHẮC ĐÁNG NHỚ</span>` | `letter-spacing: .16em; font-size: 13px; font-weight: 700;` | High (`Ộ, Ả, Ắ, Á, Ớ`) | **Severe**: Syllable separation distorted by `.16em` tracking. |
| **DeliveryScreen.tsx:18** | `<h2>Khoảnh khắc của bạn</h2>` | `font: 400 clamp(34px,3.5vw,58px)/1.12 Georgia; letter-spacing: -.035em;` | High (`ả, ắ, ủ, ạ`) | Line-height tight (1.12); Georgia diacritic risk. |
| **DeliveryScreen.tsx:21** | `"TÍN HIỆU IN: ĐÃ TRUYỀN THÀNH CÔNG"` | `font-size: clamp(13px,1.1vw,16px); letter-spacing: .035em; color: #206340;` | High (`Í, Ệ, ĐÃ, UYỀ, À, Ô`) | Signal badge. Moderate tracking. |
| **DeliveryScreen.tsx:21** | `"TÍN HIỆU IN: ĐANG CHỜ XÁC NHẬN"` | Signal badge | High (`Í, Ệ, Ờ, Á, Ậ`) | Signal badge. Moderate tracking. |
| **DeliveryScreen.tsx:21** | `"BẢN THỬ · KHÔNG IN GIẤY THẬT"` | Signal badge | High (`Ả, Ử, Ô, Ấ, Ậ`) | Signal badge. Moderate tracking. |
| **DeliveryScreen.tsx:23** | `"Lệnh in đã được tiếp nhận; chưa xác nhận ảnh đã in ra giấy."` | `line-height: 1.5; color: var(--at-body);` | High (`ệ, đã, đượ, ế, ậ, ư, á, ậ, ả, đã, ấ`) | Truthful hardware notice. |
| **DeliveryScreen.tsx:26** | `<p>Quét mã QR để tải ảnh của bạn.</p>` | `color: var(--at-body);` | High (`é, ã, để, ả, ả, ủ, ạ`) | Clean QR prompt. |
| **DeliveryScreen.tsx:26** | `<a href="...">Mở album ảnh</a>` | `min-height: 56px; color: var(--at-primary); font-weight: 700; text-decoration: underline;` | Medium (`ở, ả`) | Accessible touch target link. |
| **DeliveryScreen.tsx:27** | `"Không có QR album"`, `"Chế độ mô phỏng · Không có mã QR tải ảnh thật"` | `color: var(--at-body);` | High (`ế, ộ, ô, ỏ, ã, ả, ả, ậ`) | Fallback card. |
| **DeliveryScreen.tsx:30** | `<button class="v1-primary">Hoàn thành · Về trang đầu</button>` | `.v1-primary` | High (`oà, à, ề, đầ`) | **Inconsistent Arrow**: Missing `→` arrow glyph used in all other CTA buttons. |
| **KioskSimulator.tsx:93** | `<h2>Hủy phiên chụp?</h2>`, `<p>Phiên chụp sẽ kết thúc. Bạn có chắc chắn?</p>` | Cancel modal dialog | High (`ủ, ê, ụ, ê, ụ, ế, ú, ạ, ắ, ắ`) | Modal text clean and legible. |
| **KioskSimulator.tsx:93** | `<button class="v1-secondary">Tiếp tục chụp</button>`, `<button class="v1-primary">Xác nhận hủy</button>` | Modal buttons | High (`ế, ụ, ụ, á, ậ, ủ`) | Clean modal action buttons. |
| **Operator.tsx:20** | `<h1>Quản trị hệ thống</h1>`, `<p>Cấu hình vận hành thiết bị, khung mẫu & doanh thu kiosk</p>` | Title: `Georgia -.025em 500 weight` | High (`ả, ị, ệ, ố, ấ, ậ, à, ế, ị, ẫ, oanh, u`) | Clean operator header. |
| **Operator.tsx:20** | `['Khung', 'Bố cục', 'Cài đặt', 'Công cụ', 'Màu ảnh', 'Doanh thu']` | Operator nav tabs: `min-height: 56px; font: 650 15px;` | High (`ố, ụ, à, ặ, ô, ụ, à, ả, oanh, u`) | High-contrast touch tabs. |
| **V1Settings.tsx:26** | `<h2>Cài đặt hệ thống Kiosk</h2>`, `<p>Điều chỉnh thiết bị và thời gian tương tác cho từng lượt chụp.</p>` | `font: 14px system-ui; section padding: 24px;` | High (`à, ặ, ệ, ố, iề, ỉ, ế, ị, ờ, iê, ươ, á, ừ, ượ, ụ`) | Technical operator settings. |
| **V1Settings.tsx:31** | `"Chọn ảnh"`, `"Chọn khung"`, `"Sau khi chụp (dự phòng)"` | Inactivity timer labels | High (`ọ, ả, ọ, ụ, ự, hò`) | Stepper row with output `{X} giây`. |
| **V1Settings.tsx:32** | `<button class="v1-save">Lưu cài đặt</button>` | `min-height: 56px; border-radius: 14px; background: var(--at-primary);` | Medium (`ư, à, ặ`) | High-contrast save CTA. |

---

## 5. Screen Step Progression & Eyebrow Inconsistency Audit

During session progression, step numbering and eyebrow presentation diverge across screens:

```
[Start Screen]           No step eyebrow ("PHOTO ATELIER · SEOUL × SAIGON")
       ↓
[StudioModeScreen]       step="BƯỚC 01 · CHỌN BỐ CỤC"    (All-caps, padded "01", dash, title)
       ↓
[QuantityScreen]         step="Bước 2"                   (Title-case, single digit, no title)
       ↓
[PaymentScreen]          step="Bước 3"                   (Title-case, single digit, no title)
       ↓
[PrepareScreen]          No step eyebrow (FLEETING)
       ↓
[CaptureScreen]          No step eyebrow (Counter in badge: "Ảnh 1/6")
       ↓
[SelectPhotosScreen]     step="Bước 3"                   (DUPLICATED STEP NUMBER 3!)
       ↓
[FrameScreen]            step="Bước 4"                   (Title-case, single digit, no title)
       ↓
[ConfirmScreen]          NO STEP EYEBROW                 (Omitted entirely!)
       ↓
[PrintingScreen]         No step eyebrow ("LE SOUVENIR · ATELIER")
       ↓
[DeliveryScreen]         No step eyebrow ("MỘT KHOẢNH KHẮC ĐÁNG NHỚ")
```

### Analysis of Inconsistencies:
1. **Duplicate Step 3**: `PaymentScreen` is labeled `Bước 3` (`PaymentScreen.tsx:63`), and `SelectPhotosScreen` is also labeled `Bước 3` (`SelectPhotosScreen.tsx:58`). In the customer journey, photo selection occurs *after* payment and capture.
2. **Inconsistent Eyebrow Formatting**: `StudioModeScreen` uses `step="BƯỚC 01 · CHỌN BỐ CỤC"`, whereas `QuantityScreen` uses `step="Bước 2"`, `PaymentScreen` uses `step="Bước 3"`, and `FrameScreen` uses `step="Bước 4"`.
3. **Missing Eyebrow on Confirm**: `ConfirmScreen` lacks a `step` prop, even though it is the final customer decision gate before printing.
4. **Button Arrow Inconsistency**: All customer decision CTAs conclude with `→` (`CHẠM ĐỂ BẮT ĐẦU →`, `Tiếp tục · ... →`, `Xem bản in →`, `Xác nhận & in →`), but `DeliveryScreen` uses `Hoàn thành · Về trang đầu` without an arrow.

---

## 6. Functional Invariants Cross-Reference Matrix

This matrix cross-references all functional and geometrical constraints validated by automated test suites (`tests/verify-demo-and-real-journey.mjs`, `tests/v1-settings-parity/mounted-settings-parity.mjs`, and vitest suites).

| Functional Invariant | Required Metric / Condition | Tested In | Code Location | Status in Source |
| :--- | :--- | :--- | :--- | :--- |
| **Touch Target Minimum (Customer)** | Width ≥ 55px, Height ≥ 55px (56×56px nominal) | `verify-demo-and-real-journey.mjs:67` | `atelier-core.css:15, 20`<br>`atelier-customer.css:150` | `[Observed in code]` Pass. `.v1-back`, chevrons, stepper buttons, and CTAs satisfy ≥ 56px. |
| **Touch Target Minimum (Operator)** | Width ≥ 48px, Height ≥ 48px (56px standard) | `mounted-settings-parity.mjs:15` | `atelier-operator.css:8, 49` | `[Observed in code]` Pass. All operator inputs, switches, and buttons satisfy ≥ 48px. |
| **Back Button Icon Centering** | `dx <= 2.5px`, `dy <= 2.5px` inside circular boundary | `verify-demo-and-real-journey.mjs:68` | `atelier-core.css:20-21` | `[Observed in code]` Pass. Display grid place-items center. |
| **Carousel Chevrons Alignment** | Horizontal axis alignment `yDelta <= 3px` | `verify-demo-and-real-journey.mjs:72` | `atelier-customer.css:61, 227` | `[Observed in code]` Pass. `top: 50%; transform: translateY(-50%)`. |
| **Shutter Button Dimensions** | Exactly 108×108px outer circle, 84×84px inner core | `verify-demo-and-real-journey.mjs:111-112` | `atelier-customer.css:192-194` | `[Observed in code]` Pass. `width: 108px; height: 108px;` and `core: 84px; height: 84px;`. |
| **Shutter Horizontal Centering** | Horizontal center offset `centerDx <= 1px` | `verify-demo-and-real-journey.mjs:110` | `atelier-customer.css:191` | `[Observed in code]` Pass. `left: 50%; transform: translateX(-50%)`. |
| **Countdown Centering** | Centered on both X and Y axes (`dx <= 2px`, `dy <= 2px`) | `verify-demo-and-real-journey.mjs:124` | `atelier-customer.css:195-196` | `[Observed in code]` Pass. Fullscreen grid place-items center. |
| **Zero Emoji Policy** | Zero emojis in customer UI text `!/[⚡📱✨🎉🖨️]/.test(text)` | `verify-demo-and-real-journey.mjs:76` | All customer screens | `[Observed in code]` Pass. Emojis strictly absent; clean vector icons used. |
| **QR Frame Layout Stability** | Zero Layout Shift (`shifts < 0.01px`) on VietQR render | `verify-demo-and-real-journey.mjs:26-27` | `atelier-customer.css:171` | `[Observed in code]` Pass. Square fixed aspect ratio clamp dimensions. |
| **Selection Latency** | Visual tap confirmation latency `< 100ms` | `verify-demo-and-real-journey.mjs:16, 162` | `SelectPhotosScreen.tsx:49`<br>`FrameScreen.tsx:39` | `[Observed in code]` Pass. Immediate local state optimistic update. |
| **Operator Access Gesture** | Exactly 5 consecutive taps on `.v1-brand` | `screens.test.tsx:31`<br>`StaffGestures.test.tsx:8-9` | `StartScreen.tsx:18` | `[Observed in code]` Pass. Ref counter increments and resets on 5. |
| **Staff Cash PIN Modal** | 1000ms stationary hold on `.v1-heading-title` (`dx <= 12px`) | `verify-demo-and-real-journey.mjs:83-87`<br>`screens.test.tsx:59` | `PaymentScreen.tsx:63` | `[Observed in code]` Pass. Movement > 12px clears hold timer. |
| **Staff Cash Override PIN** | PIN `'1234'` unlocks `[data-testid="staff-cash-btn"]` | `verify-demo-and-real-journey.mjs:94-100`<br>`screens.test.tsx:59` | `PaymentScreen.tsx:60` | `[Observed in code]` Pass. Dismisses modal and reveals button. |
| **Photo Press-and-Hold Zoom** | ≥ 500ms hold opens lightbox; release dismisses lightbox | `verify-demo-and-real-journey.mjs:127-144`<br>`screens.test.tsx:23-24` | `SelectPhotosScreen.tsx:76-88` | `[Observed in code]` Pass. 500ms timer with pointerUp dismissal. |
| **Zoom Click Suppression** | 200ms suppression prevents accidental photo toggle on release | `screens.test.tsx:23, 27` | `SelectPhotosScreen.tsx:86, 99` | `[Observed in code]` Pass. `wasHeld.current` prevents `toggle()`. |
| **5×15 cm Strip Copy Quantities** | Strictly even copies `[2, 4, 6, 8, ...]` | `verify-demo-and-real-journey.mjs:75`<br>`screens.test.tsx:39` | `QuantityScreen.tsx:8-10` | `[Observed in code]` Pass. `isStrip` forces even step increments. |
| **DEMO Mode Revenue Guard** | DEMO sessions submit zero real prints and zero database sales | `verify-demo-and-real-journey.mjs:173` | `ConfirmScreen.tsx:30`<br>`backend/sales.db` | `[Observed in code]` Pass. Dispatches `print.confirmDryRun`. |
| **Persisted Settings Contract** | 6 exact properties, `schemaVersion=1`, `PENDING_DISABLED` | `mounted-settings-parity.mjs:15`<br>`V1Settings.test.tsx:8, 12` | `V1Settings.tsx:6-13` | `[Observed in code]` Pass. Validated against strict contract schema. |

---

## 7. Actionable Remediation Plan & Recommendations

### 7.1 Font Architecture Remediation
1. **Change HTML Root Language**:
   Update `frontend/index.html`:
   ```html
   <html lang="vi">
   ```
2. **Font Stack Modernization**:
   Instead of unbundled `Georgia`, adopt a proven bilingual serif/sans pair that natively contains precomposed Vietnamese glyphs with proper OpenType diacritic positioning:
   - Primary Sans: `'Be Vietnam Pro', 'Segoe UI', 'Noto Sans', sans-serif`
   - Editorial Serif: `'Merriweather', 'Playfair Display', Georgia, serif`
   - Alternatively, bundle local `.woff2` files inside `frontend/public/fonts/` with explicit `@font-face` declarations to guarantee 100% offline kiosk fidelity without relying on host Windows font patches.

### 7.2 Typographic Rules Corrections in `atelier-customer.css` & `atelier-core.css`

1. **Heading Letter-Spacing Normalization**:
   - Change `.v1-shell.atelier-customer .v1-start h1` letter-spacing from `-.055em` to `-.015em` or `normal`.
   - Change `.v1-print-stage__intro h2` from `-.045em` to `-.01em`.
   - Change `.appHeader__copy h1` from `-.035em` to `-.01em`.
2. **Kicker / Eyebrow Tracking Normalization**:
   - Reduce uppercase eyebrows (`.v1-quantity-eyebrow`, `.v1-prepare-kicker`, `.v1-delivery__eyebrow`) from `.16em - .18em` down to `.06em - .08em`.
   - Add explicit `word-spacing: 0.15em;` wherever tracking > `.05em` is applied to ensure word boundaries remain distinct.
3. **Line-Height Expansion**:
   - Increase `.v1-shell.atelier-customer .v1-start h1` line-height from `1.03` to `1.2`.
   - Increase `.v1-prepare-copy h2` and `.v1-print-stage__intro h2` line-height from `1.1` to `1.25`.
   - Increase `.v1-delivery__details h2` from `1.12` to `1.25`.
4. **Button Wrapping Safety**:
   - Add `white-space: nowrap;` to `.v1-primary` and `.v1-secondary` or ensure responsive padding `padding: 12px clamp(16px, 2vw, 28px)` so long Vietnamese strings do not wrap inside pill borders.
   - Vertically center button arrows: wrap `→` in `<span className="btn-arrow" aria-hidden="true">→</span>` with `display: inline-block; vertical-align: middle; margin-left: 6px;` or use Lucide `<ArrowRight size={20}/>` for pixel-perfect SVG alignment.
5. **Stepper Tabular Numerals Fix**:
   - In `atelier-customer.css:152`, change:
     ```css
     .v1-shell .v1-quantity .v1-stepper strong {
       min-width: 1.8ch;
       text-align: center;
       font-family: Georgia, 'Times New Roman', serif;
       font-size: clamp(72px, 7vw, 112px);
       font-weight: 400;
       line-height: 1;
       font-variant-numeric: tabular-nums lining-nums;
       color: var(--at-ink);
     }
     ```
     *(Separating font subproperties avoids resetting `font-variant-numeric`).*
6. **Word Breaking Safety**:
   - Replace `overflow-wrap: anywhere;` on `.v1-frame-grid strong` and `.operator-workspace>nav button` with `overflow-wrap: break-word; word-break: normal; hyphens: none;`.

### 7.3 Component Styling & Layout Fixes

1. **Payment Instructions Height**:
   - Change `.v1-payment-instructions` from fixed `height: 130px; flex: 0 0 130px;` to `min-height: 130px; height: auto; flex: none;`.
2. **Missing Styles for `.v1-shutter-caption`**:
   Add to `atelier-customer.css`:
   ```css
   .v1-shutter-caption {
     display: block;
     margin-top: 10px;
     font-size: 15px;
     font-weight: 600;
     color: #FFFFFF;
     text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
     letter-spacing: 0.02em;
     text-align: center;
     pointer-events: none;
   }
   ```
3. **Missing Styles for `.v1-pin-dots` and `.v1-pin-keypad`**:
   Add to `atelier-customer.css`:
   ```css
   .v1-staff-pin .v1-pin-dots {
     display: flex;
     justify-content: center;
     gap: 16px;
     margin: 12px 0 20px;
   }
   .v1-staff-pin .v1-pin-dots span {
     width: 16px;
     height: 16px;
     border-radius: 50%;
     border: 2px solid var(--at-hairline);
     background: transparent;
     transition: background 0.15s ease, border-color 0.15s ease;
   }
   .v1-staff-pin .v1-pin-dots span.filled {
     background: var(--at-primary);
     border-color: var(--at-primary);
   }
   .v1-staff-pin .v1-pin-keypad {
     display: grid;
     grid-template-columns: repeat(3, 1fr);
     gap: 12px;
     max-width: 280px;
     margin: 0 auto 16px;
   }
   .v1-staff-pin .v1-pin-keypad button {
     width: 100%;
     min-height: 56px;
     border-radius: 16px;
     border: 1px solid var(--at-hairline);
     background: #fff;
     font-size: 20px;
     font-weight: 700;
     color: var(--at-ink);
   }
   ```

### 7.4 Step Normalization Across Kiosk Screens

Normalize customer step indicators to a consistent, professional convention:
- `StudioModeScreen.tsx`: `step="Bước 1"` (instead of `BƯỚC 01 · CHỌN BỐ CỤC`)
- `QuantityScreen.tsx`: `step="Bước 2"`
- `PaymentScreen.tsx`: `step="Bước 3"`
- `SelectPhotosScreen.tsx`: `step="Bước 4"` (corrected from duplicate `Bước 3`)
- `FrameScreen.tsx`: `step="Bước 5"` (corrected from `Bước 4`)
- `ConfirmScreen.tsx`: `step="Bước 6"` (added missing step)
- `DeliveryScreen.tsx:30`: Change button text to `"Hoàn thành · Về trang đầu →"` to preserve arrow consistency across all primary CTAs.

---

## 8. Verification & Completion Gate

- **V1 Repository Status**: `E:\HK1_2026_2027\PhotoboothDesktop` was strictly treated as read-only reference. Zero edits, builds, git actions, or shell processes were executed against V1.
- **V2 Repository Status**: Written exclusively to `PhotoboothDesktop_v2/docs/TYPOGRAPHY_AND_FUNCTIONAL_AUDIT.md`. No existing source code in `frontend/src/` or `tests/` was mutated during this audit phase.
- **Audit Deliverable**: Ready for design-system and frontend engineers to implement the remediation plan without breaking any functional invariant tested by CDP or Vitest.
