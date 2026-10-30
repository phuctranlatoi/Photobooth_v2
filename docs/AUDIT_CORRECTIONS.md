# Authoritative audit corrections and reliability notice

**Independent reviewer, 2026-10-30.** This document supersedes conflicting claims in the initial auditor set.

## Reliability ruling

`01_V1_ARCHITECTURE_AUDIT.md`, `02_V1_FEATURE_AND_SCREEN_INVENTORY.md`, `03_FEATURE_PARITY_MATRIX.md`, and `09_ADMIN_STUDIO_SETTINGS_AUDIT.md` are **UNRELIABLE AS IMPLEMENTATION AUTHORITIES**. They may be used only as discovery notes. They mix source-backed fragments with claims from imports, grep, partial reads, wrong defaults, and incorrect screen/state behavior.

The consolidated authority for planning is `FEATURE_PARITY_MATRIX.md`, backed by specialist documents `04`–`08`, `UI_SCREEN_CONTRACTS.md`, and cited source checks. None proves runtime or hardware behavior.

## Mandatory corrections

1. **Inactivity does auto-print.** V1 `DesktopBoothController.kt:291-310` fills missing selections, selects the first frame if empty, then calls `startPrinting(userConfirmed=false)`. Any contrary auditor claim is false. Auto-print must not recognize revenue because `userConfirmed=false` fails the predicate at `:842`.
2. **The state holder is unguarded.** `SessionStateMachine.kt:27-37` accepts every transition. `COMPOSING`, `RECOVERY`, and `OUT_OF_SERVICE` are declared but no working routes were established. There is no `REVENUE` enum state.
3. **Correct routing:** customer `EDITING` renders `FrameScreen`; `PRINT_PENDING` renders `ConfirmScreen`; `PRINTING` renders `PrintingScreen`; Revenue is Admin tab 5 (`Main.kt:216-245`; `AdminScreen.kt:123-142`).
4. **Payment is not intrinsically guarded.** `completePayment` changes state without checking provider status (`controller:388-397`). Polling is one caller; staff/cash UI can also call it.
5. **Revenue predicate is exact:** `userConfirmed && printJob.await() && currentSessionId == sessionId` (`controller:842`). Acceptance means `PrinterJob.print` returned without exception, not physical completion.
6. **Camera selection is startup precedence, not a complete Admin selector:** Native → CLI → Hot Folder → Webcam (`controller:63-68`). Defaults enable Native and Hot Folder. Admin edits Hot Folder only and does not reconstruct the active service.
7. **Settings persistence is `.env`, not JSON.** Selected settings use `SettingsManager.updateSettings` (`controller:999-1029`). Actual defaults include Native=true, Hot Folder=true, local server=true and timeouts 90/90/60.
8. **Camera failure can silently generate a mock** (`controller:507-533`). V2 production must fail truthfully; simulation must be explicit.
9. **V1 does not preserve byte-identical camera originals in the traced path.** Untouched-original retention in V2 is a safety adaptation requiring review.
10. **DNP/cut support is unproven.** No RX1HS-specific cut command, explicit media, DPI, queue ID, status, or physical-completion proof was found.
11. **Local delivery server is exposed:** it binds `0.0.0.0` without authentication (`LocalFileServer.kt:25-67`).
12. **Backend foundation tests characterize a narrow copy only.** Passing tests do not clear architecture, parity, hardware, Beauty, payment, cloud, UI, or release gates.

## Governance

Changes to state authority, inactivity auto-print, payment authorization, print/revenue recognition, original retention, camera precedence, or LAN sharing require product decision plus architect and independent reviewer signoff.
