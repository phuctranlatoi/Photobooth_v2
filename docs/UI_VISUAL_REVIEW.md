# Live Tauri journey — visual review (2026-11-02)

## Frame & selection Liquid Glass styling review — 2026-11-02 (new CSS; visual sign-off pending)

Inspected `frontend/src/screens/FrameScreen.tsx`, `SelectPhotosScreen.tsx`, shared `PrintPreview`/`ActionBar` and their existing CSS. The previously transparent print-preview wrapper is preserved, but its padding is removed and a restrained studio shadow is applied to the **actual image/artwork**, not a large white box. The frame workspace now allocates slightly more width to the composition (1.12fr / .88fr), with a two-column gallery of 160–210px-tall cards at compact 1280×800 and up to 278px at 1920×1200. Artwork remains `object-fit:contain`; no frame or selected photo is cropped. Cards use 75% white / 20px-blur glass, subtle 1–2px edges, a champagne `rgba(197,140,106,.95)` selected stroke, a dark-contrast check pill and ellipsized customer-facing names. Hover lift is gated on actual hover capability; pressed state works on touch. The bottom ActionBar uses the same glass treatment, with an explicitly enabled dark warm-brown 56–60px CTA and distinct opaque disabled treatment. Background remains low-contrast warm ivory without dashboard-style saturated gradients.

**Verification:** `frontend/npm test -- --run`: **50/50 tests passed** (7 files); `frontend/npm run build`: **passed** (`tsc --noEmit` and Vite). No React flow, confirmation, payment, configured counts or V1 files changed. These checks establish code/test/build validity **only**: this iteration did **not** produce new screenshots or measure DOM geometry at 1280×800, 1920×1200, or Windows 125/150% scaling. Physical touch, long-language overflow and frame-artwork decode failure still require a witnessed visual/device review. Prior captured screenshot verdicts below predate these CSS changes and must not be presented as evidence of their appearance.

---

## Navigation Geometry, Header Unification & Visual Polish Audit — 07:41:35 capture (latest verdict)

**Overall Status: PASS-SIMULATED for the exercised desktop interactions.** `tests/journey-evidence/2026-11-02T07-41-35.569Z/results.json` records **63/63 checks, 0 failures and 26 screenshots** across 1280×800 and 1920×1200.

| Audit point | Latest evidence / boundary |
|---|---|
| Unified `AppHeader` | Standardized 3-column CSS Grid (`56px minmax(0,1fr) auto`) deployed across `StudioModeScreen`, `QuantityScreen`, `PaymentScreen`, `SelectPhotosScreen`, `FrameScreen`, `ConfirmScreen`, and `DeliveryScreen`. Prevents header layout shift between navigation steps. Dedicated `.appHeader__backSlot` isolates Back button bounds from title text. |
| Circular 56×56 `KioskBackButton` | Standardized circular touch target meeting ISO 9241-9 ($\ge 56\text{px}$). Measures exactly $56\text{px} \times 56\text{px}$ across both 1280×800 and 1920×1200 viewports. |
| Optical SVG Centering | Lucide `ArrowLeft` inside `KioskBackButton` calibrated with `transform: translateX(-0.5px)`. Automated CDP geometric measurement confirms visual center offset: **$dx = 0.5\text{px}, dy = 0.0\text{px}$**, comfortably meeting the strict $\le 2.5\text{px}$ optical tolerance. |
| Horizontal Carousel Chevrons | Floating navigation arrows (`.v1-carousel-arrow`) sized to 56×56px touch targets. Positioned at `top: 50%; transform: translateY(-50%)`, achieving vertical lock on the exact same horizontal axis: **$y\Delta \le 3\text{px}$** (measured $y\Delta = 0.0\text{px}$). |
| Technical Clutter Elimination | Completely removed raw layout IDs (`515_4_anh`, `1015_4_ILCL`, `1015_4_base`) and internal technical badges (`.v1-layout-tag`) from customer view. Removed technical debug status bars and Firebase Live sync metadata from customer surfaces. Window title standardized to `"LE SOUVENIR Photobooth"`. |
| Welcome Hero Photography | Recomposed `StartScreen.tsx` editorial hero featuring authentic photostrips (`LayoutArtwork` in `.v1-strip-art`) with realistic paper elevation shadows and subtle rotation ($-5^\circ / +4^\circ$), evoking real photographic studio prints. |
| Guest Copy Cleanup | Polished Vietnamese editorial and action copy across all screens (`formatLayoutTitle`, `formatLayoutSubtitle`), eliminating internal terms and jargon. |

**Hardware boundary:** Physical Canon DSLR capture, physical DNP printer spooling, and live PayOS banking settlement remain **BLOCKED / NOT-RUN** pending physical hardware attachment in the studio booth and authorized testing.

---

## Critical UX parity audit — 18:16:51 capture (2026-11-01)

**Overall Status: PASS-SIMULATED for the exercised desktop interactions.** `tests/journey-evidence/2026-11-01T18-16-51.341Z/results.json` records **47/47 checks, 0 failures and 26 screenshots** across 1280×800 and 1920×1200.

| Audit point | Latest evidence / boundary |
|---|---|
| Centered capture countdown | `.v1-countdown` is centered at 240sp; Live View is mirrored and DEMO captions are absent in the exercised presentation. Physical Canon orientation and booth-distance readability remain unverified. |
| Active timer | The journey observes `Còn lại 02:19` → `Còn lại 02:18`, proving an active decrement rather than the prior frozen `00:00`; urgent ≤15s styling is implemented but still requires physical distance review. |
| Real-time photo slots | Selected captures render into SVG `<image>` slots in the print/frame preview while selection changes. This is UI rendering proof, not physical print-output proof. |
| Hold-to-zoom | A 500ms pointer hold opens the enlarged modal and release closes it; the 50ms reset preserves ordinary click-to-select in the automated interaction. Physical touch-driver behavior remains pending. |
| Frame workspace | Redesigned two-column tactile frame gallery and large selected-photo/frame-overlay preview are present at both target viewports. |
| Zero emoji | Automated assertion confirms decorative Unicode emoji are absent; Lucide SVG icons replace them across customer and operator surfaces. |

**Unchanged release boundary:** no physical Canon DSLR capture, physical DNP print, or live PayOS banking settlement was performed. Those remain **BLOCKED / NOT-RUN** pending attached devices, authorization and supervised testing.

---

## Settled Korean Photo Atelier review — 17:19:57 capture (latest verdict)

**Overall Status: PASS-SIMULATED / COMPLETE FOR DESKTOP KIOSK JOURNEY.** `tests/journey-evidence/2026-11-01T17-19-57.239Z/results.json` reports **35/35 checks passing, 0 failures, 26 screenshots** at **1280×800 and 1920×1200**. Scope: simulated DEMO Start→Delivery plus REAL-labelled Start→Payment in the live Tauri executable; the REAL capture ends while payment QR is **loading**. This is desktop journey/visual acceptance, **not** proof of a paid QR, successful cash authorization, physical touch, camera or print. The 15:38 review and older verdicts below are historical.

| Screen | Latest visual and interaction audit; evidence boundary |
|---|---|
| Welcome (`StartScreen`) | Korean Photo Atelier editorial hero: letter-spaced **LE SOUVENIR** wordmark, `PHOTO ATELIER · SEOUL × SAIGON` kicker, `Chụp ảnh lấy ngay / Yours forever.` headline, natural subtitle, value pills and prominent `CHẠM ĐỂ BẮT ĐẦU →` CTA. Right column uses layered illustrated photostrips, subtle **−5°/+4°** rotation and realistic paper shadows. Raw IDs and technical Firebase Live badge are removed from customer presentation; artwork is illustrative, not licensed customer photography. |
| Layout (`StudioModeScreen`) | Horizontal snap-centered carousel with Lucide `ChevronLeft`/`ChevronRight` in **56px** floating circles; active card scale **1** with coral border/glow, adjacent peeks scale **.84**. Clean customer titles, centered card/caption/format aligned. Stills show settled states, not arbitrary drag dynamics. |
| Quantity (`QuantityScreen`) | `Bước 2 · Chọn số lượng bản in` step header, compact back action with Lucide `ArrowLeft`, tactile **72px** steppers and live backend-priced VND amount (captured example **70.000 đ**). Disabled step limits must remain authoritative. |
| Payment (`PaymentScreen`) | **V1 payment presentation restored:** no customer-facing `0 đ`, `Trải nghiệm chụp ảnh miễn phí`, `Miễn phí` badge or guest bypass. Left order card shows calculated **70.000 đ** (captured example, NOT a fixed price), **Dải 5×15 cm**, **2 bản in**, and **Chờ thanh toán QR**. Right card is designed for `Quét mã bằng ứng dụng ngân hàng`, real VietQR container and polling indicator; captured payment screenshot shows **`Đang tạo mã thanh toán...`**, not a rendered QR or paid state. When PayOS is unconfigured/errors, the specified fallback is `Thanh toán tiền mặt tại quầy / Vui lòng gửi tiền mặt cho nhân viên để kích hoạt phiên chụp` with `[ • Nhân viên xác nhận tiền mặt ]`; staff action is revealed by header double-click / **700ms** hold. These error, cash and live polling outcomes are **not validated by the captured screenshots**; gesture is not authentication and backend confirmation remains mandatory. |
| Live View & Capture (`CaptureScreen`) | Immersive dark viewfinder, clean configured-count progress and shutter feedback in simulated capture. Real camera orientation, face-safe overlays and distance-readable countdown require studio verification; no configured timer value is inferred from stills. |
| Photo Selection (`SelectPhotosScreen`) | Gallery of captured photo cards, selection-order badge and guarded continue/disabled state. Exact quota and expiry remain backend-controlled; exercise repeat taps and alternate counts separately. |
| Frame Selection (`FrameScreen`) | Real frame-artwork thumbnails replace loading placeholders, with selected coral/glow border and contained preview. Failed decoding/retry still needs a dedicated test. |
| Final Confirmation (`ConfirmScreen`) | Composed preview is loaded in the simulator (**`naturalWidth > 0`** in journey check); composition is described as 600 DPI by the journey, but image naturalWidth alone does **not** verify print DPI metadata. Clear order summary and real VND price (example **70.000 đ**); truthful mode-sensitive `Xác nhận bản mô phỏng →` / `Xác nhận & in →` copy must map to the actual mounted mode/action and preserve the existing confirmation gate. No real printer success is evidenced. |
| Delivery (`DeliveryScreen`) | High-resolution QR delivery panel when an actual delivery URL exists; simulated/no-QR state must stay honest. Sticky `Hoàn thành · Về trang đầu` fits at **1280×800** and returns to Welcome. Live QR reachability is not certified. |

**Hardware boundary:** Safe internal mock capture is retained for camera-free testing. Physical camera, real PayOS charges and physical DNP printer require **explicit studio authorization**. No payment-gate bypass, actual charge or physical print is claimed. Windows 125/150% scaling, real touch hitboxes/holds, long-language overflow, countdown at booth distance, PayOS failure/cash authorization and actual device recovery remain open. No V1 files were touched.

---

## Historical settled desktop acceptance — 15:38:06 capture (superseded by 17:19:57)

**Status: PASS-SIMULATED / COMPLETE FOR DESKTOP SIMULATOR.** `tests/journey-evidence/2026-11-01T15-38-06.041Z/results.json` records **35/35 checks passing, zero failures**, with **26 distinct screenshots** across 1280×800 and 1920×1200. Coverage is the live Tauri executable's DEMO journey through Delivery and REAL-labelled journey through Payment; the latter automatically uses the complimentary offline-camera fallback, **not** a settled paid PayOS journey. The run verifies a desktop simulator, not a physical touch kiosk.

| Settled acceptance point | Evidence and boundary |
|---|---|
| Carousel synchronization | The journey script waits **600 ms** after selecting `515_4_anh` for smooth scroll to settle before photographing Layout. The centered active **“Dải 4 ảnh cổ điển”** card aligns with **“06 / 10 · Dải 4 ảnh cổ điển”** and the downstream **5×15 strip** format in the latest DEMO/REAL layout and subsequent screens at both resolutions. This resolves the centered 10×15-versus-5×15 mismatch in the older 15:22 captures; stills alone do not certify arbitrary swipe dynamics. |
| Frame thumbnail loading | `RealSessionEngine.kt` now supplies `thumbDataUrl` alongside `thumbnailDataUrl` and `previewDataUrl`; `FrameScreen.tsx` consumes a safe image URL from these fields, using an atelier silhouette when artwork is unavailable. Settled frame cards show real Base64 artwork instead of the former giant **“Khung đang tải”** placeholders and raw filename spillover. A failed image decode/retry path is not proved by these stills. |
| Truthful confirmation | DEMO CTA reads **“Hoàn thành trải nghiệm →”** and routes to the dry-run confirmation; REAL CTA reads **“In và tạo QR →”** and retains the real confirmation gate. The REAL copy is a mode-specific UI contract, not evidence that the real print/QR path ran in this capture. |
| Compact delivery exit | At **1280×800**, sticky **“Hoàn thành · Về trang đầu”** is fully visible and clickable; the automated journey clicks it and verifies restoration of the Start screen. Also captured at 1920×1200. This does not establish 125/150% Windows scaling or physical touch geometry. |

**Remaining validation boundary:** Physical Canon camera capture/live preview orientation, DNP printer discovery/spooling and live PayOS bank charges are **unverified** until connected and exercised in the studio booth with authorization. No actual print, payment, or hardware certification is implied. Touch targets, countdown visibility at a distance, alternate configured counts, translation overflow and Windows 100/125/150% scaling still require dedicated kiosk tests. The older review and its blocked verdict below are historical snapshots, **not the current acceptance decision**; no V1 files were edited for this documentation update.

---

## Historical remediation review — 15:22:57 capture (superseded verdict)

**Evidence:** `tests/journey-evidence/2026-11-01T15-22-57.650Z/` contains 26 distinct PNGs (DEMO Start→Delivery at both 1280×800 and 1920×1200; REAL Start→Payment at both sizes) and `results.json` reports `PASS-SIMULATED`. The earlier 15:09 review below is retained as historical evidence, **not** the current screenshot set. This is a pixel review of V2 only; no V1 changes, live hardware/payment/printing, touch interaction, or Windows scaling certification.

**Design sign-off: WITHHELD for the UI rebuild milestone.** Delivery fit and delivery copy are visibly fixed, and frame filenames no longer collide, but the primary carousel identity defect is still present at **both** sizes and in both DEMO and REAL captures. Guest-facing raw identifiers and an inaccurate DEMO confirmation CTA also remain. An automated simulated journey PASS does not supersede visual failure.

| Remediation claim | New screenshot evidence / decision |
|---|---|
| Centered `515_4_anh` / “Dải 4 ảnh cổ điển” in lockstep with `06 / 10`, artwork and subsequent screens | **FAIL.** `1280x800-demo-layout.png`, `1920x1200-demo-layout.png` and both `real-layout.png` show the coral-outlined center card **“Khung 4 ảnh đặc biệt”**, `1015_4_ILCL`, **Khổ 10×15 cm**, while the footer shows **“06 / 10 · Dải 4 ảnh cổ điển”**, **Dải 5×15 cm**. Quantity displays a 5×15 strip and `515_4_anh`, and Confirm/Delivery call it “Dải 4 ảnh cổ điển”. The center card has the wrong identity and aspect for the committed layout. Left arrow still occupies empty space rather than a visible left neighbor. Still images cannot establish snap behavior, but the static invariant already fails. |
| Compact delivery action and friendly completion copy | **PASS for captured 1280×800 pixels.** `1280x800-demo-delivery.png` shows the entire “HOÀN THÀNH · VỀ TRANG ĐẦU” button approximately y=605–660, inside the 800px viewport; the card ends around y=677. “Chế độ trải nghiệm hoàn thành · Ảnh đã được lưu trữ” is legible and no “Dryrun” is displayed. `1920x1200-demo-delivery.png` also fits. DOM hit area, sticky behavior, no-scroll interaction and 125/150% scaling remain untested. |
| Frame titles and card overflow | **PARTIAL.** Both `demo-frame.png` files now show the generic customer label “Khung phong cách” instead of long raw filenames; no text crosses card boundaries. However both cards are still dominated by giant, wrapped “Khung đang tải”; no settled frame title, asset, selected state, failed-load recovery or useful ellipsis is visible. `formatFrameName` behavior for actual long loaded names is **not demonstrated** by these captures. A `00:00` timer on this screen adds ambiguity; assess with authorized timer behavior. |
| Clean editorial copy across customer screens | **FAIL as a whole.** “từ backend” is absent from the new Confirm subtitle and “dryrun” is absent from Delivery, but `515_4_anh` remains in Quantity footer and DEMO/REAL Payment order summary; layout cards expose `1015_4_ILCL` and `1015_4_base`; Welcome bundle tiles expose `SP_IG_*` and preview IDs plus “Firebase Live”. DEMO Confirm still says **“IN VÀ TẠO QR”** although Payment explicitly promises no physical print and Delivery says **“Không có QR album”**. Avoid promising unavailable outcomes without changing the existing confirmation gate. |

**Additional visible follow-ups:** `demo-select.png` still has detached narrow expand buttons (~50px wide in the 1280 image, measured visually, not CSS DOM bounds), red `Còn lại 00:00` with 0/4 selected, and a large unused gallery area at 1920. `demo-live.png` shows progress `Ảnh 1/8` but no countdown numeral; white crop/crosshair overlays the face in the illustrated preview. DEMO Confirm's composed 5×15 strip is small within large whitespace; 600 DPI cannot be established from pixels. REAL-labelled Payment captures show the **complimentary offline-camera fallback**, not a paid QR state. No capture covers loading/error recovery, alternative configured counts, long-name truncation, actual swipe/tap, or physical kiosk distance.

**Release gate / ownership:** FRONTEND: fix centered-card/current-index/committed-layout synchronization and re-capture before sign-off; remove remaining guest IDs, ensure customer-truthful DEMO confirmation wording while preserving backend gates, and demonstrate settled/error frame assets with long-name ellipsis. ARCHITECT: validate authoritative catalog labels and DEMO confirmation/QR outcomes without inventing transitions. TEST: capture before/after carousel navigation, measure DOM hit boxes and viewport overflow at 100/125/150% Windows scaling, and exercise authorized countdown/timer states. The prior detailed findings below remain historical; fixes must be reverified rather than inferred from `PASS-SIMULATED`.

---

## Historical review — 15:09:23 capture

**Evidence:** `tests/journey-evidence/2026-11-01T15-09-23.188Z/`, paired `1280x800-*.png` and `1920x1200-*.png` for Start, Layout, Quantity, DEMO Payment/Live/Select/Frame/Confirm/Delivery and REAL Payment. `results.json` says `PASS-SIMULATED`; this is a review of **captured V2 pixels**, not hardware, payment, print, QR, animation, interaction or 125%/150% scaling certification. REAL-payment captures show the same complimentary fallback as DEMO, **not a paid QR state**. No V1 files were edited or run.

## Verdict

**Needs visual remediation before kiosk sign-off.** The editorial ivory/coral direction and illustrated layout artwork are visible at both sizes. However the layout carousel's **prominent centered active card disagrees with the caption and selected layout**, frame asset loading dominates the frame page and visibly overflows its cards, and the 1280×800 delivery action is outside the visible viewport. Do not interpret the automated journey PASS as visual acceptance.

## 1. Layout carousel restoration

| Requirement | Screenshot finding |
|---|---|
| Horizontal snapping / centered active item | A horizontal carousel with a coral-outlined dominant card and faded neighbor is visible at both resolutions; static frames cannot prove snapping or drag behavior. **Mismatch:** highlighted center card is **“Khung 4 ảnh đặc biệt”** (10×15) while the footer says **“06 / 10 · Dải 4 ảnh cổ điển”** (5×15). The subsequent Quantity preview is a 5×15 strip and footer shows `515_4_anh`. Synchronize centered card, active index, footer and committed layout; verify before/after navigation and selection. |
| Peeking adjacent cards / chevrons | Right-hand neighbor and floating left/right arrows are visible. The left-hand adjacent card is **not visible** even at apparent position 06/10; left arrow sits over empty space, making the sequence look off-center. Right arrow overlaps the faded right card's edge, intentionally floating but reduce ambiguity of its hit area. |
| 5×15 vs 10×15 aspect | Quantity and Select show a tall four-slot strip, while the currently highlighted carousel card shows a wider four-slot 10×15 composition. The illustrated formats look distinct, but because of the active/caption discrepancy, **accurate aspect-to-selected-layout mapping is not verified** by these captures; test each format explicitly. |
| Illustrated vector slots | Both four-slot illustrations contain faces and colored garments; no empty blank slot boxes on the captured layout/quantity previews. This only establishes displayed art, not its SVG provenance or rendering for all catalog entries. |
| Customer titles / clutter | Footer includes **“Dải 4 ảnh cổ điển”**, but the highlighted card's title is different. **“Khổ 10×15 4 ảnh”** is not visible in these two carousel frames and must be verified on its own card. Visible IDs `1015_4_ILCL`, `1015_4_base`, `515_4_anh` and timer/count metadata remain on guest-facing cards, payment, quantity, confirm and delivery. Raw IDs are small on carousel but materially undermine editorial polish across the journey. |

## 2. Screen-by-screen pixel audit

| Screen | 1280×800 | 1920×1200 |
|---|---|---|
| Welcome (`start`) | Ivory/coral, strong headline and generous main CTA. Three bundle tiles have cramped multiline labels (`IG`, raw `SP_IG_*`, “Chạm để bắt đầu”) and small type; decorative cards on right overlap by design without hiding primary CTA. | Same visual language and ample whitespace; raw IDs and tiny labels persist. Intro artwork is abstract rather than actual customer photos. |
| Layout (`layout`) | Active card/caption mismatch; missing left peek, right peek and chevrons visible. No visible native scrollbar or clipped CTA. Footer helper text is small. | Same mismatch and empty-left asymmetry; footer far from card, weakening association. |
| Quantity (`quantity-2`) | Tall strip illustration and stepper fully visible; lower left shows raw `515_4_anh`. Disabled minus appears much fainter than plus (state needs explicit label). | All panels fit; large empty field left of strip. Raw ID remains in CTA rail. |
| DEMO / REAL Payment | Both screenshots show **0 đ / complimentary demo fallback**, no REAL QR payment state. Two panels and CTA fit. Raw `515_4_anh` shown as order layout. | Same fallback and raw ID; large blank panel space, but no clipping. Payment gate cannot be assessed from image. |
| Live View (`demo-live`) | Large landscape illustration/preview with visible progress `Ảnh 1/8`, framing and shutter control. White crop rectangle crosses forehead/chin and center crosshair sits on cheek; avoid masking faces in real preview. No countdown number present in this moment, so distance readability is **untested**. | Same; dark capture framing is appropriately distinct from ivory catalog. Demo art is not proof of camera orientation, real preview or countdown. |
| Select (`demo-select`) | 8 thumbnails shown 4×2, all within viewport, but small detached arrow/expand controls (~30×54 visible) sit beneath thumbnails and are **below 56px wide**. Right preview fits. Timer `Còn lại 00:00` red while selection is 0/4: potentially alarming; verify whether expired state should accept taps. | 6 thumbnails then 2 on second row, huge empty gallery region; same narrow detached controls. No unexpected native scrollbar visible. |
| Frame (`demo-frame`) | **Blocking visual defect:** two loading cards show oversized “Khung đang tải”; long asset filenames collide/overflow across adjacent cards (`5154002_…`, `5154005_…`). Cannot tell selection/availability. Preview is still a generic illustrated strip. | Same loading state and exposed filenames, though text stays closer to each card boundary. Static screenshot cannot distinguish short loading transient from stuck asset failure; verify timed settled/error state. |
| Confirm (`demo-confirm`) | Real composition displayed as a relatively small 5×15 strip with large white margins; `600 DPI` claim is text only and pixel metadata not inspectable in screenshot. Guest-facing subtitle **“từ backend”**, DEMO “không ghi doanh thu”, raw ID and confusing **“IN VÀ TẠO QR”** CTA despite dry-run/no real QR. Button visible. | Same issues; low preview utilization. Never replace backend confirmation with a shortcut; make CTA copy truthful to the authorized action/mode. |
| Delivery (`demo-delivery`) | **Blocking:** card and pink no-QR placeholder extend past the bottom edge (at y=800); finish button and dry-run detail **not visible**. User cannot finish without scrolling/other recovery. | Finish button and dry-run detail visible; no QR is correctly identified as DEMO, but raw ID and internal “Dryrun” terminology remain. |

**Layout/scrollbars:** No native horizontal/vertical scrollbar is visible in these screenshots. This is **not** a proof of no scrollable overflow: the 1280 delivery content is clipped, and 1280 frame text visibly overflows card bounds. No photo thumbnail appears cropped outside its own card in the captured Select frames. Overlapping right-hand Welcome decorative cards look intentional; frame asset labels and floating mini-controls do not.

## 3. Palette, touch and viewport limits

- Warm ivory surfaces, charcoal text, restrained peach panels and coral primary buttons/selection outlines are visually consistent with the requested `#FAF6F0` / `#E07A5F` atelier direction. RGB/contrast cannot be certified solely from screenshots; screenshots show ambient tinting, not a uniformly flat background. The coral CTA uses **white text**: check contrast against `#E07A5F` and prefer dark charcoal text or darker filled coral if it fails WCAG AA.
- Visible primary CTAs are roughly ≥56 px tall; layout chevrons and quantity +/- circles appear about 56–72 px. **Not all targets pass:** thumbnail expand arrows visibly ~30 px wide, and Welcome bundle cards have dense touch labeling. CSS target geometry and Windows CSS-pixel-to-physical-pixel mapping need DOM measurements; static captures cannot establish every hit box or Windows 100/125/150% behavior.
- Both supplied image dimensions are exactly 16:10 (1280×800, 1920×1200). At 1280×800 the delivery finish CTA is missing; therefore there is no zero-scroll/complete-action acceptance at compact size. No captures for other aspect ratios, Windows scaling, longer translated copy, configured alternate counts, countdown seconds or REAL paid/QR state.

## 4. Fix order and recheck criteria (frontend + architect)

1. **P0 — carousel identity:** align scroll-centered card, `aria-pressed`, indicator index, footer name, artwork and layout submitted to existing backend selection event. At 06/10 the center card must depict/title the same catalog layout as the footer; test left/right and non-center taps at both resolutions, snap settling, empty/one/two/many catalog items. Do not auto-advance on recenter.
2. **P0 — delivery fit:** reserve visible room for explanation and ≥56px finish CTA at 1280×800 and 150% Windows scaling, or provide an obvious bounded scroll region with always-visible finish action; test keyboard-free touch completion.
3. **P1 — frame loading:** constrain filenames/placeholder text inside each card; customer-facing card title and stable skeleton/retry/error when asset fails; confirm frame-specific composition after selection. Never let adjacent card contents overlap.
4. **P1 — replace guest raw IDs/internal terms:** use catalog display titles (`Dải 4 ảnh cổ điển`, `Khổ 10×15 4 ảnh` where authoritative), user-readable fallback for unknown names, hide `SP_IG_*`, `515_4_anh`, timestamps, “backend” and “Dryrun” from guest screens; keep IDs in staff diagnostics. Confirm authoritative labels with architect; do not change catalog business rules.
5. **P1 — touch/capture clarity:** size gallery secondary controls ≥56×56 CSS px or merge with thumbnail accessible action; verify countdown numeral across booth and face-safe crop guide on a real preview. Review expired red timer behavior against backend rules, not UI assumptions.
6. **P1 — demo truthfulness:** preserve existing payment/confirm/print gates; display DEMO-specific confirmation wording when backend indicates dry-run, distinguish REAL payment QR only on proven REAL payment evidence. Validate contrast and disabled styling with computed colors.
7. **Re-run evidence:** capture settled screens at 1280×800 and 1920×1200, plus scaling 100/125/150%, DOM bounding boxes, viewport/document scrollWidth/scrollHeight, touch click targets and Vietnamese long names. Screenshot-only review cannot prove actual snap, current seconds, backend events, 600 DPI metadata, device readiness or physical output.
