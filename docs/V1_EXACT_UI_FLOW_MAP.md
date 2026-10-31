# V1 exact UI flow map — corrected independent audit

Status: **SOURCE VERIFIED (V1 read-only), not runtime tested here**, 2026-10-30. V1 paths are relative to `src/main/kotlin/com/phuctran/photobooth/desktop/`. This supersedes the unreliable provisional `02_V1_FEATURE_AND_SCREEN_INVENTORY.md` rows that identify `FilterAdminView` as customer EDITING, combine PRINT_PENDING with Printing, invent a REVENUE state, and imply unrestricted cancellation. `04_SESSION_STATE_MACHINE.md`, `08_PAYMENT_REVENUE_QR_CLOUD_AUDIT.md`, and `UI_SCREEN_CONTRACTS.md` are the corrected prior evidence.

## Actual routed sequence

`IDLE → SELECTING → SELECTING_QUANTITY → PAYMENT_PENDING → PREPARING → LIVE_VIEW → (COUNTDOWN → CAPTURING → LIVE_VIEW)* → SELECTING_PHOTOS → EDITING → PRINT_PENDING → PRINTING → DELIVERY → IDLE`

Evidence: `Main.kt:125-251`; controller actions below. `COMPOSING`, `RECOVERY`, and `OUT_OF_SERVICE` exist in the enum but are not routed screens in this `Main.kt` switch. `ADMIN` is routed; Revenue is a tab inside Admin, not a state.

| State / exact V1 surface | Entry and visible action | Exit / automatic behavior | Evidence |
|---|---|---|---|
| readiness overlay | Before app-ready; spinner, after 8 s Admin or force-ready | late readiness shows routed app; force-ready does not prove devices ready | `Main.kt:77-120` |
| IDLE / `StartScreen` | Start; special bundle; hidden Admin gesture | Start→SELECTING; valid special bundle→SELECTING_QUANTITY; Admin→ADMIN | `Main.kt:126-134`; controller `:323-335` |
| SELECTING / `StudioModeScreen` | choose layout/effect; confirm; Back | confirm→SELECTING_QUANTITY; Back directly→IDLE | `Main.kt:136-160`; controller `:313-354` |
| SELECTING_QUANTITY / `QuantityScreen` | quantity/price; Continue; Back | Continue→PAYMENT_PENDING; Back→SELECTING | `Main.kt:162-167`; controller `:356-385,950-953` |
| PAYMENT_PENDING / `PaymentScreen` | QR state; gated staff cash confirmation; Back | paid/cash→PREPARING, then after 1600 ms→LIVE_VIEW; Back cancels local poll→quantity | `Main.kt:168-181`; controller `:365-397,953-957` |
| PREPARING / `PrepareScreen` | no customer command | automatic LIVE_VIEW | controller `:392-397` |
| LIVE_VIEW/COUNTDOWN/CAPTURING / `CaptureScreen` | shutter only in normal UI; same surface shows countdown/capture | configured `shotCount` loop using independent `countdownSeconds`; after all shots→SELECTING_PHOTOS. **Not auto-SELECTING after each capture.** | `Main.kt:182-205`; controller `:436-594` |
| SELECTING_PHOTOS / `SelectPhotosScreen` | toggle up to `selectCount`; confirm; inert Back callback; hidden cancel | exact selection→EDITING; inactivity fills missing selections/frame then calls auto-print; cancel allowed | `Main.kt:207-215`; controller `:291-310,672-688,926-960` |
| EDITING / `FrameScreen` | choose/add frame; confirm; Back; hidden cancel | confirm→PRINT_PENDING; Back→photos; inactivity can auto-print. **This stage is never skipped by photo confirmation.** | `Main.kt:216-233`; controller `:691-715,926-960` |
| PRINT_PENDING / `ConfirmScreen` | final preview; Confirm & Print; Back | manual print→PRINTING; Back→EDITING; inherited inactivity timer may auto-print | `Main.kt:234-243`; controller `:230-233,717-720,959` |
| PRINTING / `PrintingScreen` | no customer navigation | render/upload/driver work; then DELIVERY | `Main.kt:244`; controller `:717-853` |
| DELIVERY / `DeliveryScreen` | QR/output summary; Finish | Finish cancels delivery job and reset→IDLE | `Main.kt:245-251`; controller `:920-986` |
| ADMIN / `AdminScreen` | Frames, Layouts, Settings, Tools, Colors, Revenue tabs | exit saves drafts via UI behavior then reset→IDLE | `Main.kt:253-286`; `ui/screens/AdminScreen.kt:78-141` |

## Exact exceptions that parity tests must preserve

- `transitionTo` is unrestricted internally (`controller:222-243`); that is not permission to expose arbitrary transitions over IPC.
- `cancelSession()` returns false outside **SELECTING_PHOTOS and EDITING** (`:926-947`). There is no cancel-any-screen behavior.
- Selection/frame inactivity calls `startPrinting(userConfirmed=false)` (`:291-310`). It does not return Home.
- Revenue requires the **same active session ID**, `userConfirmed=true`, and the print task's accepted result (`:842-848`). Driver return is not physical print proof.
- Layout `shotCount`, `selectCount`, and `countdownSeconds` are independent. Capture uses the first and third (`:447-502`); selection uses the second (`:672-688`).
- Special bundle bypasses Studio setup and enters quantity, but ordinary selection does not (`:323-335`).

## V2 status at this review

The mounted V2 simulator is a bounded implementation, not full parity. Current backend has no PayOS/Revenue/Album/Cloudinary/Neon client source. Camera and printer ports are isolated partial ports; Canon is reflection-only and printer submission is not session-wired. Full customer/admin parity, real integrations, hardware, and production readiness remain **BLOCKED**.
