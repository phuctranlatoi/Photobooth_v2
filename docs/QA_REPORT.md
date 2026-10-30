# QA_REPORT.md

## Summary of QA Findings (Phase 1 Legacy Audit)

| Issue | Affected Documentation | Details | Impact |
|-------|------------------------|---------|--------|
| **Over‑claimed exhaustive coverage** | `03_FEATURE_PARITY_MATRIX.md` | The matrix listed many rows as **Observed** even though the underlying source files were only imported (e.g., `CliCaptureService.kt`, `PaymentService.kt`, `FirebaseManager.kt`). This misrepresents the audit state. |
| **Unrestricted state‑machine** | `01_V1_ARCHITECTURE_AUDIT.md` & `02_V1_FEATURE_AND_SCREEN_INVENTORY.md` | The audit described the `SessionStateMachine` as a simple linear flow, but the actual `transitionTo` implementation contains no guard checks for illegal transitions (e.g., jumping from `IDLE` directly to `PRINTING`). This must be flagged as a gap. |
| **Revenue predicate missing** | `02_V1_FEATURE_AND_SCREEN_INVENTORY.md` | Revenue is only recorded after a successful **Print** (see `RevenueAccountingTest.kt`). The audit incorrectly suggested a separate *Revenue* state. |
| **`.env` never read** | `01_V1_ARCHITECTURE_AUDIT.md` | The audit claimed that Firebase and PayOS credentials are loaded from `.env`. In V1 the code calls `FirebaseManager.initialize()` which reads its configuration from `DesktopBoothConfig`, not from `.env`. |
| **Inactivity auto‑print not present** | `02_V1_FEATURE_AND_SCREEN_INVENTORY.md` | The audit mentions an *inactivity auto‑print* feature, but the code only resets to `IDLE` on inactivity (`_inactivityTimeLeft`), never triggers a print. |
| **Default configuration values not verified** | `01_V1_ARCHITECTURE_AUDIT.md` | The audit stated that defaults are enforced; however many defaults (e.g., `postCaptureTimeoutSeconds = 10`) are only defined in `DesktopBoothConfig` and not validated anywhere else. |
| **Camera selection logic incomplete** | `02_V1_FEATURE_AND_SCREEN_INVENTORY.md` | The audit asserts the UI lets the user pick a camera source, but the actual UI (`StartScreen.kt`) only exposes a hidden *admin* tap to open admin; camera selection is only toggled in *Admin* settings (`useHotFolder`, `useNativeSdk`). |
| **Revenue state missing** | `02_V1_FEATURE_AND_SCREEN_INVENTORY.md` | No dedicated `SessionState.REVENUE`; revenue is computed post‑print via repository. |
| **Optional video, Firebase sync, Neon API** | `03_FEATURE_PARITY_MATRIX.md` | These optional features were marked as *observed* but the audit never opened the corresponding source files (`DesktopVideoCompositor.kt`, `FirebaseManager.kt`, Neon remote clients). |

### Overall Verdict
The audit gate is **BLOCKED**. The documentation contains several inaccurate claims and missing evidence. Specialist sections (docs/04‑08/UI) must be consulted, and the feature‑parity matrix rebuilt with explicit source links and clear statuses (`NOT STARTED`, `IN PROGRESS`, `COMPLETED`).

### Required Corrections
1. Re‑write `03_FEATURE_PARITY_MATRIX.md` to reflect true evidence levels and add a **Status** column with `NOT STARTED`.  Include source‑linked specialist evidence where available. 
2. Update `PROGRESS.md` and `TASK_BOARD.md` to show the audit is **blocked** until the matrix is corrected and all missing source files are opened and tested. 
3. Remove any false statements about `.env`, auto‑print, or revenue state from the other docs. 
4. Ensure all docs only reference V1 source files; no V1 files are edited.

All further work must be coordinated with the specialist sub‑agents responsible for the missing areas.
