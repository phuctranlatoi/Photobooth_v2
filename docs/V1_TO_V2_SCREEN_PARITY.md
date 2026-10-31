# V1 → V2 screen parity — bounded delta handoff

2026-10-30. Read the entire `V1_PARITY_UI_API_MIGRATION.md` and corrected `UI_SCREEN_INVENTORY.md`. Documentation-only review; preserve existing premium simulator, typed Kotlin authority, tests and approved frame CTA fix. SOURCE VERIFIED below means source inspected, not implemented or production ready.

## Exact early journey (frontend priority)

V1 source root: `src/main/kotlin/com/phuctran/photobooth/desktop/` in the read-only V1 tree.

* `Main.kt:126–160`: IDLE mounts Start; normal Start transitions directly to SELECTING/Studio. There is **no mandatory collection stage between these**.
* `ui/screens/StartScreen.kt:43–252`: left invitation/Start persists; right panel groups special frames by event, then shows matching layouts after event selection, then matching special frames after layout selection. These are **local Start subviews**, not another customer stage. Event change clears layout; frame-page Back clears layout, retaining event. Empty events render decorative artwork (`:254–279`), not fabricated bundles.
* Matching display accepts `targetLayoutId` OR `targetPrintSize` against layout ID (`:160–169,224–226`). Controller selection only resolves `frame.targetLayoutId` (`controller/DesktopBoothController.kt:323–335`). Do not repair this discrepancy silently or advertise a selectable print-size-only item as supported. Backend must resolve/validate it before enabling.
* Valid special frame selection calls `selectSpecialBundle`: sets layout/frame, clears moments/export, goes **directly to SELECTING_QUANTITY**, bypassing normal Studio effects (`:323–335`). It is not normal Start followed by collection followed by Studio.
* `StudioModeScreen.kt:45–74,107–198`: SELECTING contains local layout then effect steps. A centered layout tap commits layout and opens effects; off-center tap centers a card. Layout-step Back exits to Start; effect-step Back returns to layout locally. Effects receive enabled dynamic records (`:227–241`), selected effect, live stream, confirm callback. `Main.kt:140–151` filters special-only layouts out of normal mode and sorts IDs; layouts also targeted by standard frames remain available.
* `DesktopBoothController.kt:340–353`: choosing an enabled effect updates camera preview; setup confirmation enters quantity. No fabricated effect IDs or UI-only simulated processing.

### Exact safe presentation correction

Current `frontend/src/Simulator.tsx:74–76` has Welcome → local `browsing` fixture collection → `session.start` → layout-only SELECTING. This duplicates layout choice and changes normal V1 ordering. Keep ivory split, stationery art and existing spacing; change the normal Welcome action to **Start simulator session**, dispatching existing `session.start` once using a backend-provided valid initial layout. Do not guess an ID or render another selection gate. If no valid catalog exists, disable Start with loading/empty/retry reason.

Remove mandatory `browsing` collection from normal navigation; reuse its safe schematic cards within SELECTING layout presentation if useful. Do not relabel fixture layouts as event bundles. With current contracts, keep the existing layout-only setup visibly **“Simulator setup — effects unavailable”**, and Continue mapped to `session.confirmSetup`. This is an explicit temporary parity gap, not a faithful effect step. When a real typed effect catalog/selection contract exists, implement the two local SELECTING substeps and their different Back behavior. Do not add a fake disabled effect-selection stage merely to resemble parity. An inline unavailable explanation is sufficient meanwhile.

Welcome event panel is unavailable until backend supplies reviewed event/frame/layout associations and a special-selection command. Empty state may retain approved artwork; never insert example event purchases. If a disabled special-event affordance is rendered, label “Event frames unavailable in simulator”; no dummy event cards or prices.

## Source → implementation / missing matrix

| V1 source / stage | Current V2 bounded evidence | Exact missing / safe disposition |
|---|---|---|
| Startup overlay `Main.kt:77–117` | Connecting/error reconciliation | Eight-second degraded Admin/skip controls not equivalent; BLOCKED pending startup authority/recovery decision, no fake bypass |
| Start `StartScreen` / IDLE | Premium Welcome and extra fixture collection implemented | Remove extra normal collection gate as above; special-event local subviews/selection absent; title five-tap is source behavior, not authentication |
| Studio `StudioModeScreen` / SELECTING | Dynamic fixture layout cards + confirm | Effects/live effect preview and exact local-step Back absent; normal layout filtering needs real standard/special metadata |
| Quantity `Main.kt:162–167` | Backend quantities/pricing; selection starts simulator payment | Production pricing/config verification outstanding; retain backend authority |
| Payment `:168–179` | Explicit simulator completion, no QR | Real PayOS/polling/error/expiry/staff long-press unavailable; no fabricated paid production state |
| Prepare `:181` | Preparation simulator state | Source layout/effect pose content parity not exhaustively verified |
| Capture `:182–205` | Synthetic live/countdown/captured originals | Import/clear source, refresh camera, recording indicator/device availability need contracts; disable rather than fake native success |
| Selection `:207–215` | Backend dynamic count/order + confirm | Full V1 timeout/cancel/back equivalence requires controller/action regression, not PNG approval |
| Frame / EDITING `:216–233` | Supplied frame choice + authoritative composition | Custom standard/special PNG chooser unavailable; approved protected Continue/Back/menu region MUST remain |
| Confirm / PRINT_PENDING `:234–243` | Preview + manual dryrun confirmation | Physical print unverified; preserve distinct confirmation gate and duplicate locks |
| Printing `:244` | Dryrun status | Submitted-to-driver ≠ physically printed; no physical completion claim |
| Delivery `:245–252` | Preview/no-link + finish | Open output/open real album, QR/export details not full parity; no fake QR |
| Finish | V2 completion wording inside delivery | V1 Finish resets session, not an additional mandatory collection/completion gate |
| Admin `:253–287` | Six-tab shell + isolated local layout editor | All nested production controls below remain unsupported, not complete |
| COMPOSING/RECOVERY/OUT_OF_SERVICE `Main.kt:289` | Some explicit V2 recovery copy | V1 root has no mapped view; flag product handling rather than claim source-equivalent screens |

## Operator source mapping — do not invent writable settings

Corrected inventory is the detailed control reference; `frontend/src/Operator.tsx:12–14` is current implementation. Disabled rows must name the missing capability, keep their reason visible without hover, and never show successful save/upload.

| Actual V1 tab | Source | Current V2 / missing |
|---|---|---|
| Frames | `AdminScreen.kt:142–193,363–416,542–655` | Unavailable inventory only; missing standard size→layout library, event groups, import/delete, cover replace/expand/delete event |
| Layouts | `AdminScreen.kt:194–225,418–529`; `Main.kt:272–276` | Local simulator capture/select/countdown editor only. V1 editor exposes price/shotCount/countdown; V2 selectCount editing is simulator extension, not V1 field parity. Price, edit/delete confirmation and production persistence absent |
| Settings | `SettingsTabContent.kt:28–140`; `Main.kt:278–279` | Missing print toggle, camera source, Hot Folder chooser/path, available Canon fields, selection/frame/postcapture timers and real save. Existing disabled printer media/cut summary is not proof of a corresponding V1 Settings field |
| Tools | `LayoutCalculatorTool.kt:56–59,109–179,254 onward,366–387,547–764` | Actual CalculatorApp: PNG measurement/import, slots/print size, IDs, event/cover, QR X/Y/size, save/copy/Firebase. All unsupported; generic maintenance is not parity |
| Colors | `FilterAdminView.kt:41`; `Main.kt:281–285` | Effect editing/LUT import/preview absent; preserve accepted Beauty/LUT rules |
| Revenue | `RevenueScreen.kt:41–315` | Missing loading/error/empty, refresh/date filters/metrics/chart/breakdowns/transactions/adjust/void reason dialogs. No fabricated records or enabled mutations |

## Acceptance handoff

Frontend: preserve approved frame layout, operator header fix, preview containment, snapshot locks and reduced motion. Test normal Start enters SELECTING without intermediate collection; catalog empty disables Start; no duplicate start on double tap. Special path remains explicitly unavailable until authoritative command/catalog exist. Later test special selection goes straight to quantity; local Studio effect Back must not invoke session Back. Recheck both target viewports and long Vietnamese labels. Payment stays explicit simulator; delivery has no fake link. Architect/backend own missing metadata/effects/special-selection contracts and timer/back semantic decisions. No frontend-only authoritative stage substitution.

No shell commands, V1 writes, customer images, credentials, live API calls or hardware actions in this review. Full nested control and production parity is NOT claimed.
