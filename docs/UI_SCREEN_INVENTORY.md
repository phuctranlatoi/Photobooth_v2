# UI screen and control inventory — V1 evidence for V2 parity

**Corrected:** 2026-10-30 by independent UI reviewer.  
**Purpose:** read-only V1 evidence for frontend, backend/operator-contract, design, and QA work. This is not an instruction to port Compose or create Kotlin stubs. V2 remains React/TypeScript/Tauri. It does not claim complete behavioral parity: controller/service behavior and every nested helper still require specialist audits.

## Status vocabulary

* `SOURCE-OBSERVED`: directly mounted or rendered in cited V1 source.
* `SOURCE-GAP`: enum/state exists but root has no UI mapping.
* `V2-VERIFY`: corresponding final V2 mounted UI has not yet been independently exercised.
* `UNSUPPORTED-MUST-DISABLE`: unsafe/unimplemented operator action must be visibly disabled with a reason, not simulated as successful.

No revenue, payment, print, camera, cloud, or destructive Admin capability is “Optional.” Release disposition depends on product/operator decisions and evidence.

## Authoritative root navigation

V1 root is `src/main/kotlin/com/phuctran/photobooth/desktop/Main.kt:125-289`:

| Session state | Actual V1 UI | Evidence | V2 review status |
|---|---|---|---|
| `IDLE` | `StartScreen` | `Main.kt:126-134` | V2-VERIFY |
| `SELECTING` | `StudioModeScreen` | `Main.kt:136-161` | V2-VERIFY |
| `SELECTING_QUANTITY` | `QuantityScreen` | `Main.kt:162-167` | V2-VERIFY |
| `PAYMENT_PENDING` | `PaymentScreen` | `Main.kt:168-180` | V2-VERIFY |
| `PREPARING` | `PrepareScreen` | `Main.kt:181` | V2-VERIFY |
| `LIVE_VIEW`, `COUNTDOWN`, `CAPTURING` | `CaptureScreen` | `Main.kt:182-206` | V2-VERIFY |
| `SELECTING_PHOTOS` | `SelectPhotosScreen` | `Main.kt:207-215` | V2-VERIFY |
| `EDITING` | **`FrameScreen`** | `Main.kt:216-233` | V2-VERIFY |
| `PRINT_PENDING` | **`ConfirmScreen`** | `Main.kt:234-243` | V2-VERIFY; explicit print gate |
| `PRINTING` | `PrintingScreen` | `Main.kt:244` | V2-VERIFY |
| `DELIVERY` | `DeliveryScreen` | `Main.kt:245-252` | V2-VERIFY |
| `ADMIN` | **`AdminScreen`** | `Main.kt:253-287` | V2-VERIFY |
| `COMPOSING`, `RECOVERY`, `OUT_OF_SERVICE` | no root screen (`else -> {}`) | enum `domain/SessionStateMachine.kt:18,22-24`; `Main.kt:289` | SOURCE-GAP; V2 needs explicit product handling |

Before normal navigation, V1 also renders startup loading and, after eight seconds, degraded controls “Vào Admin kiểm tra” and “Bỏ qua & Chụp ngay” (`Main.kt:77-117`). Inventory these as a root overlay, not a session screen.

## Customer screens and controls

All paths below are relative to V1 `src/main/kotlin/com/phuctran/photobooth/desktop/`.

| Screen/source | Source-observed controls/behavior | Status |
|---|---|---|
| `ui/screens/StartScreen.kt` | Start button; brand-title five-tap Admin entry (`:65-74`); special-event carousel, event selection, matching-layout choices, special-frame page and 48 dp back (`:109-252`); default empty-event artwork | SOURCE-OBSERVED / V2-VERIFY |
| `ui/screens/StudioModeScreen.kt` | layout step, effect step/live preview, confirm, back; root supplies filtered/sorted standard-compatible layouts and dynamic effects (`Main.kt:136-160`) | SOURCE-OBSERVED / V2-VERIFY |
| `ui/screens/QuantityScreen.kt` | quantity/price choice and back; root commits quantity then starts payment (`Main.kt:162-167`) | SOURCE-OBSERVED / V2-VERIFY |
| `ui/screens/PaymentScreen.kt` | QR/payment state, staff long-press panel, fallback behavior, paid and back callbacks (`Main.kt:168-179`) | SOURCE-OBSERVED / V2-VERIFY; payment success needs safe evidence |
| `ui/screens/PrepareScreen.kt` | preparation/pose information from selected dynamic layout/effect | SOURCE-OBSERVED / V2-VERIFY |
| `ui/screens/CaptureScreen.kt` | live view/countdown/capture, captured moments, sources/devices, recording indicator; import sources, clear sources, refresh cameras, start capture callbacks (`Main.kt:182-205`) | SOURCE-OBSERVED / V2-VERIFY; hardware actions unsafe by default |
| `ui/screens/SelectPhotosScreen.kt` | dynamic selection count, captured grid, preview, confirm/back and controller timeout/cancel behavior (`Main.kt:207-215`) | SOURCE-OBSERVED / V2-VERIFY |
| `ui/screens/FrameScreen.kt` | available frame selection/preview, add custom PNG (standard/special), confirm/back (`Main.kt:216-233`) | SOURCE-OBSERVED / V2-VERIFY |
| `ui/screens/ConfirmScreen.kt` | final layout/effect/frame/moments/copies/export review; explicit Print and Back callbacks (`Main.kt:234-243`; function at `ConfirmScreen.kt:17`) | SOURCE-OBSERVED / V2-VERIFY; must not bypass |
| `ui/screens/PrintingScreen.kt` | printing/progress presentation driven by status message (`Main.kt:244`) | SOURCE-OBSERVED / V2-VERIFY; status is not proof of physical print |
| `ui/screens/DeliveryScreen.kt` | export summary, captured/copies, open output folder, open album URL, finish (`Main.kt:245-252`) | SOURCE-OBSERVED / V2-VERIFY |

Shared visual containers include `ui/components/Shell.kt` (`AppShell`) and `ui/components/PrintPreview.kt`; **AppShell does not replace or own Admin tab navigation**. Preview equivalence requires image/layout comparison, not component-name matching.

## Admin / Atelier navigation and controls

`AdminScreen` is mounted by root. It owns header status pills, a 48 dp exit/back action that saves settings, and six tabs (`ui/screens/AdminScreen.kt:89-141`).

| Tab | Actual V1 view and controls | Evidence | Status |
|---|---|---|---|
| Khung | `AdminScreen` frame manager: normal frames grouped by print size/layout; special frames grouped by event; empty state; individual delete; event card operations including cover replacement, expand, delete event | `AdminScreen.kt:142-193,363-416,542-655` | SOURCE-OBSERVED / V2-VERIFY; destructive/file actions require contract or disable |
| Bố cục | list/empty state; edit; delete confirmation; edit price, shot count and countdown; save/cancel | `AdminScreen.kt:194-225,418-529` | SOURCE-OBSERVED / V2-VERIFY |
| Cài đặt | print toggle; camera-source choice; Hot Folder path and chooser; Canon ISO/Av/Tv/WB/picture style when available; selection/frame/post-capture timeout steppers; save | `AdminScreen.kt:226-236`; `SettingsTabContent.kt:28-140` | SOURCE-OBSERVED / V2-VERIFY; unsupported camera/file controls must disable |
| Công cụ | `engine.CalculatorApp(config, layouts)` (Firebase tool), not a generic placeholder | `AdminScreen.kt:237-240` | SOURCE-OBSERVED / specialist audit still required / V2-VERIFY |
| Màu ảnh | `FilterAdminView`: effects editing plus LUT import and effect preview contracts | `AdminScreen.kt:240-242`; `ui/screens/FilterAdminView.kt:41`; callbacks `AdminScreen.kt:58-60` | SOURCE-OBSERVED / specialist audit still required / V2-VERIFY |
| Doanh thu | `RevenueScreen`: cloud/local loading/error/empty; refresh; Today/7 days/this month/last month; metrics/chart/size and extra-print breakdown; recent transactions; adjust and void dialogs with reasons | `AdminScreen.kt:140-142`; `RevenueScreen.kt:41-249,251-315` | SOURCE-OBSERVED / V2-VERIFY; never drop as optional |

Root-level Admin contracts also expose add frame, layout save/delete, settings save, effects save, LUT import/preview, and reset/back (`Main.kt:261-286`). Presence of a callback is not evidence that V2 safely supports it.

### Tools (`CalculatorApp`) bounded control evidence and uncertainty

The Tools tab mounts `engine.CalculatorApp`, defined in `engine/LayoutCalculatorTool.kt:56-59`; it is **not** `model/PricingCalculator`. Source-observed controls include selecting a PNG for measurement and directly importing a pre-punched frame (`LayoutCalculatorTool.kt:366-387`), image/slot measurement preview, print-size/slot metadata, existing-or-new layout ID, frame ID, special-event toggle/name, cover upload, QR X/Y/size fields, save layout, save frame locally, and copy generated code (`:547-764`). Earlier logic also writes a generated punched PNG adjacent to the chosen source (`:109-179`) and contains Firebase/layout operations beginning at `:254`; these are unsafe or unsupported in the current V2 simulator contract.

This is a bounded source sample, not a claim that every nested Tools control or side effect has been exhaustively audited. V2 must not show a fake working calculator. Until a reviewed V2-local implementation exists, the Tools view must state that it is unsupported and keep file, save, upload/Firebase, clipboard, and mutation actions disabled. `docs/UI_NESTED_CONTROL_EVIDENCE.md` is supplementary and non-authoritative: its `:68` “Refresh typically” wording is inference rather than cited control evidence, and its Pricing Calculator section does not inventory the Admin Tools `CalculatorApp`.

## Access, cancellation, and safety observations

* Customer Admin entry is five taps on the Start title (`StartScreen.kt:65-74`); this is obscurity, not authentication. V2 security review must decide authorization independently.
* Payment staff override is a gesture path that requires mounted touch testing; it must not be accepted based on unit invocation.
* File choosers in V1 exist for capture sources and custom frames (`Main.kt:194-200,223-229,262-269`) and Hot Folder (`SettingsTabContent.kt:82-90`). V2 cannot silently omit them or fake success; unsupported actions need honest disabled UI.
* Confirm & Print is a mandatory UI transition in observed V1. Revenue must not be created before successful confirmed printing under project rules.
* Layout photo counts/countdowns, effects, frames and prices are dynamic. Tests must not encode example constants.

## Required independent mounted verification

The acceptance matrix is owned in `tests/ui-transformation/acceptance-manifest.json` and protocol in `tests/ui-transformation/README.md`: customer plus all six Admin tabs, 1280×800 and 1920×1200, loading/empty/error states, targets/overflow/repeated taps/back/cancel, screenshots, and designer review. It must attach to the existing Tauri CDP harness, navigate through UI only, and never claim mocks as hardware evidence.

## Correction notice to active specialists

Frontend, backend/operator-contract, and design reviewers must use this correction rather than the superseded inventory: include `FrameScreen` at `EDITING`, `ConfirmScreen` at `PRINT_PENDING`, `AdminScreen` and all six tabs/actions, startup degraded controls, and explicit state gaps. This document supplies parity evidence only and must not drive unreviewed app edits or changes to active contracts.

## Current V2 bounded implementation status (2026-10-30)

Mounted simulator evidence now covers the customer sequence corresponding to Start/collection, Studio layout setup, quantity, simulator payment, preparation/live capture, selection, frame, Confirm dryrun, delivery and completion at both required viewports. It also covers the six Admin tab shells, honest unsupported reasons, and the isolated local-development layout count/timing editor. This is `PASS-SIMULATED` for the bounded V2 simulator milestone, not evidence that every V1 nested control has been implemented.

Still unsupported/incomplete: production special bundles/assets, effects/LUT/Beauty, frame/event administration, device settings and Tools calculator, revenue data/edit/void, production Admin authentication/ACL, native camera/printing, real payment, cloud album and QR delivery, startup recovery/out-of-service product handling, and exhaustive nested-control parity. Source-observed entries above therefore retain `V2-VERIFY` where production behavior is unavailable; they must not be globally relabelled “Ready” or “complete.”
