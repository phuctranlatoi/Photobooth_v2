# V1 visual fidelity reference — Admin Settings + customer root

Source inspection: 2026-10-30. Scope is replication, **not a redesign**. Only this document is owned by this task; frontend owns code. V1 was not launched, built, or modified. No shell, hardware, production network, configuration credentials, or customer photos were accessed. **No actual pixel comparison is available; source agreement alone is not pixel parity.** No screenshot assets were used.

## Source key and measurement interpretation

V1 paths below are relative to `E:/HK1_2026_2027/PhotoboothDesktop/src/main/kotlin/com/phuctran/photobooth/desktop/`:

- **S** `ui/components/Shell.kt`
- **A** `ui/screens/AdminScreen.kt`
- **C** `ui/screens/SettingsTabContent.kt`
- **T** `ui/theme/Theme.kt`
- **M** `Main.kt`

All source dimensions are Compose **dp**, fonts **sp**, not measured physical pixels. At nominal density 1 use the numbers as initial CSS logical-pixel targets; OS density, font metrics, Compose Material defaults, browser defaults and text wrapping require later rendered review. Do not apply an arbitrary whole-page zoom to make a screenshot fit. Unspecified heights are content-driven, not invented fixed heights.

## Root / shell — implement before tuning children

| State | Exact source layout |
|---|---|
| Window | Undecorated, fullscreen; title `Le Souvenir Kiosk` (M:37–42). Theme wraps AppShell (M:70–76). |
| LIVE_VIEW, COUNTDOWN, CAPTURING | Full-size **black** box, no shell padding, content directly inside (S:39–44). |
| ADMIN | Full-size `NeutralBg #FBF9F6`, **24dp outer padding** (S:45–46). AdminScreen itself adds another **24dp** and `#FBF9F5` background (A:89–95). Thus Admin header/tabs/content begin **48dp from physical viewport edges**, not 24. Outer 24dp gutter remains #FBF9F6. |
| Other customer states | Full-size #FBF9F6. Two radial washes behind content: top-left #FFEDE4 at .24 alpha → transparent; bottom-right #E9EFF5 at .32 alpha → transparent; each radius = max(width,height) × .78. Inner content box padding **24dp** (S:48–67). These are existing V1, not a proposed new gradient. |

Do not insert a universal wordmark header, status chips, footer, progress line, max-width container or camera margin: none exists in AppShell. Operational indicators are screen-local (S:28–37). `CompactLocalHeader`, when explicitly used by a child, has min-height 56, row gap 16, optional back button, caption step in AccentNude and h4 title single-line ellipsis (S:71–84); it is not automatically mounted by the root.

## Admin frame (A:63, 89–139, 226–236)

- Actual V1 entry tab is **index 0, Khung**, not Settings. A Settings-focused preview can select index 2 explicitly but must not silently change the real default.
- Main column: full available size, background #FBF9F5, padding 24, vertical gap **18**. Header row uses full width, center alignment, space-between; no explicit fixed header height.
- Header left: **48×48** white circular back target, border 1 #EAE4DC, arrow tint #1A1918, accessibility label `Thoát`; click calls **saveSettings then onBack**. Gap **16** to title column; title column gap **2**.
- Header copy in order: `LE SOUVENIR · ATELIER` (overline 11 bold, #B85838, letter spacing **1.6sp**); `Quản trị hệ thống` (h5 22 bold, #1A1918); `Cấu hình vận hành thiết bị, khung mẫu & doanh thu kiosk` (body2 14, #5A5550).
- Header right: three pills, gap **10**: `Camera` → `Hot folder` or `Webcam`; `Print` → `Bật` / `Tắt`; `Cloud Sync` → `Sẵn sàng` / `Ngoại tuyến`. Do not replace the header Camera value with Canon detection: only Settings status card does that. Pill white, border 1 #EAE4DC, radius 999, padding **14 horizontal / 8 vertical**, inner gap 8. Dot 14 with .2-alpha fill, centered solid dot 7. Label 11 medium #9E978E; value 12 bold #1A1918 (A:667–702). Dot colors: camera #3B82F6; print #2E8B57 or #8C8680; cloud #10B981 or #D97706 (A:111–115).
- Tabs: full width, **height 56**, background #EFEBE4, radius **18**, padding **4**, item gap **4**. Exact order: **Khung / Bố cục / Cài đặt / Công cụ / Màu ảnh / Doanh thu**. Six equal widths, fill available height (48). Active item white + 1 #EAE4DC border, radius 12, text #B85838 bold. Others transparent, text #5A5550 medium. No icons (A:118–137).
- Remaining content Box fills width and uses weight 1; **only Settings inner column scrolls**. Header and tabs remain outside that scroll.
- At nominal density 1, content/tabs width = viewport width − **96**: 1824 at 1920; 1184 at 1280. Tab item width = (content width − 8 − 5×4)/6: about 299.33 / 192.67. These are derived layout values, not screenshot measurements. Content top = 48 + actual header height + 18 + 56 + 18; do not assume header height equals back target height.

## Settings content: exact visual order (C:40–141)

Entire column fill-size + vertical scroll, section gap **20**. No extra wrapper padding.

1. **Intro column**, gap **6**: `VẬN HÀNH THIẾT BỊ` (overline, #A65D43); `Cài đặt hệ thống Kiosk` (h5, #242424); `Điều chỉnh thiết bị và thời gian tương tác cho từng lượt chụp.` (body2, #5C5854); restart pill `Khởi động lại ứng dụng sau khi lưu để áp dụng cấu hình.` (caption, #A65D43 on #FCEEE8, pill shape 50%, padding 14 horizontal / 9 vertical).
2. **Status cards row**, horizontally scrollable, gap **10**, no equal-width stretching required. Each min-width **185**, white, border 1 #E8E2DC, radius **12**, padding **14**, inner gap **6**. Label caption #5C5854, value subtitle2 #242424. Ordered labels/values: `Nguồn Camera` → Hot Folder / Canon EDSDK / Webcam / DroidCam (last is a single `Webcam / DroidCam` string); `Máy in Windows` → Đang bật / Đang tắt; `Đồng bộ Đám mây` → Sẵn sàng / Ngoại tuyến; `Kiosk` → configured booth ID + ` · Port ` + configured port. Do not hardcode runtime identifiers (C:50–55,155–161).
3. **In ấn & Xuất ảnh**. Row min-height **64**, label column weighted, `Máy in Windows` subtitle1 and `Gửi ảnh tới hộp thoại in Windows khi bật.` body2. Right Material Switch: checked thumb white, track #A65D43 alpha 1. Conditional printer chips in horizontal scroll row gap **8**: `Ảnh dải · {configured printer}` then `Ảnh đầy đủ · {configured printer}`; omit blank names. Chips caption #A65D43 on #FCEEE8, pill, padding 12 / 8 (C:56–71,164–168).
4. **Nguồn Camera & Thu nhận ảnh**. Equal weighted options in row gap **12**. Left `Webcam / DroidCam` / `Camera kết nối trực tiếp`; right `Thư mục ảnh (Hot Folder)` / `Ảnh do phần mềm camera xuất ra`. Option radius **14**, padding **16**, inner gap **6**; selected #FCEEE8 + title #A65D43; other #F4EFEA + title #242424; detail body2 #5C5854. Title subtitle2 with exact prefix `●  ` selected or `○  ` unselected. Whole option clickable (C:72–95,170–178).
   - Hot Folder only: V1 expand/shrink vertically (do not add new animation). Inner column gap **10**, initial spacer **4**, label `Đường dẫn Hot Folder` subtitle2. Row gap **10**, centered vertically; OutlinedTextField weighted, single-line, placeholder `Chọn thư mục ảnh`; `Chọn thư mục` outlined button **height 56**. Tip `Mẹo: Dùng digiCamControl chụp để ảnh rớt vào đây.` caption #5C5854.
5. **Thông số Canon EDSDK**, present **only when nativeCamera != null**, not merely when Hot Folder is false (C:96–118). Body2 hint `Nếu thông số hiện N/A, hãy đảm bảo máy ảnh ở chế độ M (Manual) và không bị kẹt báo bận.`; subtitle2 `Phơi sáng (Exposure)`; row gap **12**, three equal fields **ISO / Khẩu độ (Av) / Tốc độ (Tv)**. Then subtitle2 `Màu sắc (Color) · Thiết lập 1 chiều`; row gap **12**, two equal fields **Cân bằng trắng (WB) / Kiểu màu (Picture Style)**. Values/options come from existing contracts; preserve enumerations in C:106–116.
6. **Thời gian tương tác tại Kiosk**. Body2 `Điều chỉnh thời gian để khách chọn ảnh và khung. 0 giây sẽ tự động tiếp tục.` Rows in exact order: `Chọn ảnh` / `Thời gian khách chọn ảnh`; divider; `Chọn khung` / `Thời gian khách chọn khung`; divider; `Sau khi chụp (dự phòng)` / `Thời gian chờ sau lượt chụp`. Divider #E8E2DC. Each row min-height **64**, label subtitle2, detail body2 #5C5854. Label column weighted. Minus then value then plus, no extra row gap: outlined controls **52×52**, radius **12**, padding 0, border 1 #E8E2DC, h6 symbols `−` and `+`. Value width **120**, horizontal padding 6, background #F4EFEA radius 10, vertical padding 14, centered subtitle1 `{value} giây`. Step **10**, clamp **0..3600**, minus disabled at 0 and plus at 3600 (C:119–126,180–200). These are interaction timeouts, not capture count/countdown inputs.
7. **Save surface**, full width #F4EFEA, radius **16**, padding **20**, row gap **16**, centered vertically. Weighted left column: `Cấu hình bổ sung` subtitle2; `Tên máy in, Booth ID và Port được cấu hình trong tệp .env.` body2 #5C5854. Conditional `Đã lưu cài đặt` caption #2E8B57 lasts **3000ms** after save click. Right `Lưu cài đặt` button **height 56**, radius **14**, #A65D43 with white button text. This is **inside scroll**, not a sticky footer. Source sets saved after invoking callback; no source-backed validation/loading/error/dialog is implemented here (C:40–41,127–139).
8. Final spacer **8** (also participates in parent gap arrangement).

**Shared section frame:** full-width white Surface, border **1 #E8E2DC**, radius **16**, inner padding **20**, column gap **16**, title subtitle1 #242424 (C:144–152). No section shadows are explicitly requested by this source.

## Fields, dropdowns and dialogs — do not invent placement

- Native camera field: radius **8**, 1 #E8E2DC border, white background, padding **12**; label caption medium #8C8680, spacer **4**, value bold default body1, max one line ellipsis; empty value `N/A` in #8C8680. Menu anchored by enclosing Box, intrinsic max width, Compose popup placement/clamping; **not a viewport-centered modal** (A:248–315).
- Native options fetch on entry and again on click. Empty menu text `Không có lựa chọn (Lỗi hoặc bị khóa)`; clicking dismisses. Select invokes setter, updates displayed current, closes (A:255–312).
- WB/style fields same frame and text treatment, initial value `Chưa đồng bộ (Áp dụng trên máy)`; selection applies one-way and updates label (A:317–359). Do not show a fabricated current camera value.
- Folder picker is **Swing JFileChooser**, directories-only, dialog title `Chọn Hot Folder`, `showOpenDialog(null)` (C:84–89). No explicit screen coordinates, width, height or custom backdrop in source. Exact native OS placement/appearance **cannot be specified from this source**; approval updates path, cancellation leaves it unchanged.
- Settings contains **no save-confirmation modal**. Admin back saves then exits; adding discard-confirmation or bypassing save is not faithful (A:100).
- Material OutlinedTextField, OutlinedButton, Switch and popup platform/default sizing not explicitly overridden above require matching rendered reference; do not label guessed native metrics as exact source measurements.

## Existing V1 theme values (not a proposed token system)

T:12–30: background #FBF9F6; panel #FFFFFF; alternate #F4EFEA; text #242424; secondary #5C5854; muted #8C8680; border #E8E2DC; nude #C27357; dark nude #A65D43; light nude #FCEEE8; mint #2E8B57; blue #3B82F6; amber #D97706; red #D32F2F; camera black #050507; ink soft #252228; surface #FAF8F6; admin group label #7A6257. Admin overrides above are intentional; do not normalize them to theme colors.

T:47–61: SansSerif; h1 28/600, h2 26/600, h3 22/500, h4 28/600, h5 22/700, h6 18/700, subtitle1 16/600, subtitle2 14/600, body1 16/400, body2 14/400, button 16/600, caption 12/500, overline 11/700. Explicit letter spacing 0 throughout except Admin brand override. Source does not specify these styles' line heights or a bundled font; no font files copied.

## Bounded current V2 mismatches — source review, not rendered verdict

Observed `frontend/src/Operator.tsx:6–14` and `frontend/src/styles.css:2–4`, `frontend/src/customer.css:1–2` in this pass. Frontend may be changing concurrently; re-read before applying fixes.

| V2 observation | V1 comparison / actionable correction |
|---|---|
| Operator default `Layouts`; English tabs | A:63,123 default Khung; Vietnamese six-tab order above. Preserve actual entry default; select Settings only in explicit review fixture. |
| `LE SOUVENIR / PRIVATE WORKSPACE`, `Behind the moments.`, Return to customer, simulator warning, Stage wrapper | Not A:96–137. Reproduce compact Vietnamese header, circular back target, local pills and 56dp tab rail. Simulator disclosure/access restrictions must remain truthful but must not be mistaken for V1 visual content; coordinate separate development-only presentation with owner. |
| Settings is an array of unavailable descriptions (camera, printer, Beauty, payment) | Not C:42–140. Missing intro/status cards, exact section order, print toggle, source options, conditional Hot Folder/Canon sections, timeout steppers, inline save surface. Unsupported backend actions must stay disabled/unavailable rather than counterfeit success; frontend can replicate read-only shape with explicit capability states. Do not enable hardware mutations for fidelity. |
| Global 20px base, Georgia 48–88px h1, 64px minimum buttons (styles.css:2) | Conflicts with T typography and 48 back/52 stepper/56 save targets. Scope exact Admin styles; reset browser heading/paragraph margins and inherited global button padding/justify behavior. Do not enlarge/rebrand the source. |
| Customer palette #F6F2EA/#FFFCF7, 24×40 page padding, max-width 1920, universal studio header/phase/footer (customer.css:1–2) | AppShell S:39–67 uses #FBF9F6, 24 all sides except full-bleed camera, no shell header/footer/max-width. Child screen specifics need separate audit; this finding is bounded to customer root. |
| Global simulator dialog fixed inset 25% 15% (styles.css:4) | Does not describe C folder chooser or A camera dropdowns. Do not reuse a centered session modal for those controls. |

No V2 code was changed, executed or screenshot-tested by this task. Backend capability gaps are not permission to invent mutations or remove payment/confirmation gates.

## Next rendered review checklist (pending frontend screenshots)

Capture **V2-only safe mock states**, 1920×1200 and 1280×800, then Windows 100/125/150% with logical viewport recorded. Request Admin Settings at top and scrolled bottom; Hot Folder off/on; native camera absent/present; blank/nonblank printer chips; timeout 0/3600; save status; open dropdown; customer root and full-bleed camera. No customer imagery or production data.

Check double 24dp Admin inset, six equal tabs, fixed header vs scrolling content, source font sizes/weights, Vietnamese diacritics, long path/booth/printer strings, no horizontal page clipping, and save reachability. At 150% scaling 1280×800 physical can yield about 853×533 logical pixels; source has no responsive Admin wrap breakpoint, so overflow risk is a **known V1 constraint to report**, not license for silent redesign. Compare V2 measurements against this source reference; mark differences as source-based until an authorized V1 screenshot exists. Pixel parity remains **unverified**.

## Actual V2 PNG review — 2026-10-30, fresh bounded evidence

Directly opened and visually inspected all four PNGs (not inferred from unit tests):

- `tests/v1-settings-parity/evidence/2026-10-30T16-43-21.230Z/1920x1200-settings-load.png`
- `tests/v1-settings-parity/evidence/2026-10-30T16-43-21.230Z/1280x800-settings-load.png`
- `frontend/simulator-evidence/settings-mutation/2026-10-30T16-43-22.840Z/1920x1200-saved-reloaded.png`
- `frontend/simulator-evidence/settings-mutation/2026-10-30T16-43-22.840Z/1280x800-saved-reloaded.png`

**Disposition:** visible portions are substantially source-aligned in content/order and group structure, but have remaining concrete visual differences below. The independently reported bounded Settings PASS at both sizes (switch hit target 48, stepper 52, save 56) is acknowledged, **not reclassified as an exact visual pass**. A PNG shows the switch glyph, not its invisible 48px hit area. No V1 runtime pixel reference exists.

### Visible source-aligned elements

- Both sizes show the Vietnamese Admin brand/title/subtitle and all six tabs in the correct order; Settings is selected for these fixtures. `Khung` is first. **Default Khung on initial Admin entry is not established by a Settings-selected still image** (A:63,123).
- Left header/tabs/group edges begin at approximately x=48, matching the combined S:46 + A:93 inset. White bordered rounded groups, four compact status cards, restart pill, and print → camera → timeout order are visible at 1920. At 1280, print and the camera section heading are visible; later sections are below the crop, not absent.
- Status values and print switch visibly reflect separate saved/reloaded fixtures: 1280 changes to `Đang tắt · cấu hình` with an off glyph; 1920 shows `160 giây` versus initial `140 giây`. These are visible fixture differences, not independent proof of backend persistence or hardware state.
- Visible section edges/padding and about 20px inter-group spacing broadly follow C:144–152. No horizontal clipping of header or six tabs is visible at either provided size.

### Remaining visible fidelity defects / evidence limits

1. **Back button is rectangular, roughly 48×64, not the 48×48 white circle** required by A:98–102. Its arrow is left-biased within the rectangle. This is distinct from the corrected print-switch target.
2. **Tab labels are left-aligned within their cells**, including the selected Settings cell. V1 centers each label in the equal-weight Box (A:125–135). Rail height/rounded selected treatment is broadly aligned, but label placement is not.
3. **Header pills lack the colored dot and separate muted label/bold value treatment** of A:667–702. Current screenshots use single-line `Camera · Chưa kết nối`, `Print · Chưa áp dụng`, `Cloud Sync · Ngoại tuyến`; source has dot + separate labels/values and different Camera/Print value logic. Preserve honest unavailable state rather than implying live hardware; this remains a declared simulator deviation, not fidelity equivalence.
4. **Simulator banner and backend timer paragraph add substantial vertical displacement**, absent from A:96–139/C:42. Banner is between header and tabs; timer paragraph is between tabs and Settings intro and wraps at 1280. They are truthful development disclosures, but must be excluded from any claim of V1 layout parity. The Settings intro also shows a full-width bottom rule absent from C:43–49.
5. **Camera option cards are centered, thin outlined and nearly square-cornered** in the 1920 images. V1 C:170–177 uses left-start text, radius 14, no explicit option border, and #F4EFEA for the unselected background. The unselected card here looks close to white. Selected detail also appears accent-colored rather than secondary gray.
6. **Additional simulator capability lines increase group heights**: print unavailable line and camera pending/blocked line are visible. Conversely the V1 Hot Folder tip `Mẹo: Dùng digiCamControl chụp để ảnh rớt vào đây.` is not visible beneath the path row before the camera section ends at 1920 (C:92). These are explicit content/spacing differences, not pixel-aligned equivalents.
7. **Folder chooser button appears about 64px high, square-ish**, versus source height 56 (C:90). The partially visible 1920 timeout minus/plus controls have left-biased symbols and small corner rounding rather than centered h6 symbols/radius 12 (C:195–199). Their reported 52px bounds alone do not resolve those visible styling differences.
8. **Right content edge is approximately x=1857 / 1217**, leaving about 63px rather than symmetric 48px physical margin, consistent with a document scrollbar reserving width. A browser scrollbar is visible at the viewport right. V1 assigns scrolling only to the weighted Settings body; these top-of-page images cannot prove whether the header/tabs remain fixed on scroll. A scrolled capture is needed; do not assert scroll behavior from these stills.
9. **Save row and full timeout rows are not shown in any of these four PNGs.** At 1920 only the first timeout row begins at the bottom; at 1280 the crop ends at the camera section heading. Thus save surface position, 56px rendered button, bottom spacing, complete timeout order and save reachability are **visually unreviewed**, despite the independently reported bounded checks. No image here shows transient `Đã lưu cài đặt`.

No application changes or commands were made for this review. Only this reference was appended. Remaining checks require safe V2 scrolled screenshots; no redesign, new tokens, hardware access, or V1 launch is requested.
