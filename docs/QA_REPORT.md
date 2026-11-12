# QA_REPORT.md

## Independent review — CSS softening polish, post-checkpoint 7ca40ac (2026-11-12)

Scope: the 5 CSS-only files modified after checkpoint `7ca40ac02d90e020fe721208e3c1b94eef00a037` ("checkpoint current
workspace before UI softening"): `frontend/src/atelier/theme-tokens.css`, `atelier-core.css`, `atelier-customer.css`,
`atelier-operator.css`, and `frontend/src/screens/payment.css`. No commits exist between the checkpoint and HEAD; all
CSS changes are uncommitted working-tree edits, so the checkpoint predates the CSS change.

| Case | Status | Exact evidence |
|---|---|---|
| Checkpoint predates CSS change | PASS-AUTOMATED (inspection) | `git diff --stat 7ca40ac..HEAD` → no commits after checkpoint; `git status --short` shows exactly the 5 declared CSS files modified. |
| No camera/countdown/shutter/QR/business impact | PASS-AUTOMATED (diff audit) | `git diff 7ca40ac -- frontend/src/atelier/* frontend/src/screens/payment.css`: all changes are glass gradients/border alphas/blur/saturate/shadow softening plus new `--at-glass-rim` / `--at-control-border` tokens. No `.v1-camera`, `.v1-countdown`, `.v1-shutter`, `.v1-payment-qr-slot`, `.v1-payment-columns`, geometry, or business/IPC rule modified. No `.tsx`/`.ts` backend, pricing, or revenue file changed. |
| Accessible reduced-transparency fallback | PASS-AUTOMATED (source) / visual not verified | New `@media (prefers-reduced-transparency: reduce)` blocks in core/customer/operator/payment CSS: solid `--at-paper` / `--op-surface` backgrounds, `backdrop-filter: none`. Source-verified only. |
| Accessible forced-colors fallback | PASS-AUTOMATED (source) / visual not verified | `@media (forced-colors: active)` in `atelier-core.css` (extended with `.v1-pills span`, `.v1-lightbox button`) and `atelier-customer.css` (2px ButtonText borders, Highlight on `aria-pressed="true"`). Source-verified only. |
| Frontend Vitest regression | PASS-AUTOMATED | V2 `frontend`: `npm test` (Vitest 4.0.9) exit 0; **85/85 tests across 11 files**, 6.29 s. This is +24 tests over the 61/61 recorded in the 2026-11-06 Phase 12 row; the growth is not scoped to this CSS change and is not documented elsewhere. |
| Production build | PASS-AUTOMATED | V2 `frontend`: `npm run build` (`tsc --noEmit && vite build`) exit 0; **2,016 modules**, CSS 122.31 kB / JS 423.47 kB, 3.24 s. Module count drifted from 2,010 recorded in Phase 12; drift attributed to added frontend test files/scaffold since 11-06, not specifically to this CSS change. |
| Jest scaffold (claimed "1 Jest pass") | PASS-AUTOMATED (bounded, pre-existing) | `frontend/src/basic-scaffold.jest.tsx` + root `jest.config.js` were both introduced **inside checkpoint `7ca40ac`** (see `git show 7ca40ac --stat`), not by the CSS change. No npm `jest` script exists; `npx jest` only runs via a synthesized config. The "1 Jest pass" covers a pre-existing scaffold, not the CSS change. |
| CSS-specific automated test | NOT-RUN / MISSING | No test asserts the new token values, reduced-transparency, or forced-colors blocks; the CSS polish is validated only by non-interference regression. |
| Visual outcome at 1280×800 / 1920×1200 (OS scaling) | NOT VERIFIED | No independent rendered-viewport, screenshot, or CDP measurement produced in this review. |
| Journey runner screenshots (`tests/verify-demo-and-real-journey.mjs`) | NOT RUN | Requires live Tauri/WebView + real-mode PayOS payment-link display + spawn/kill of V2 processes + a `sqlite3` DEMO-revenue query. Marked not run: not a pure offline/mock run and its payment step touches a real PayOS QR display path. |
| Physical Canon / DNP / live PayOS-Neon-Cloudinary / Mini-PC / installer | BLOCKED / NOT-RUN | No hardware, provider, or packaging run authorized or performed in this review. |
| V1 isolation | PASS-AUTOMATED (read-only) | No V1 shell command, write, build, secret read, or customer-photo operation performed. |

### Findings

- **HIGH — test evidence incomplete / claim not fully reproducible.** The "85 Vitest + 1 Jest pass/build pass" is
  arithmetic-consistent with the current tree, but (a) the +24-test Vitest growth and module-count drift are not
  recorded against this milestone, (b) the "1 Jest pass" was not reproducible via a standard command (no npm
  `jest` script; required a synthesized config) and is a pre-existing scaffold, not CSS-scoped, and (c) there is
  **no CSS-specific automated test** for the softening.
- **MEDIUM — visual outcome not verified.** A green unit/build suite is not a rendered-viewport, 16:10, touch, or
  QR-scanner acceptance. The softened glass appearance, contrast, and touch feedback were not independently measured.
- **LOW — untracked native backend artifacts.** `backend/io_grpc_netty_shaded_netty_tcnative_*.dll`,
  `backend/kotlin-compiler-*.alive`, `backend/onnxruntime-java*/`, `backend/sqlite-*.dll` are pre-existing build
  detritus (not introduced by this CSS change) that should be gitignored/cleaned before installer packaging to avoid
  DLL collisions.

**Verdict: BLOCK for release.** CSS polish is software-regression green and impact-free by diff audit, with new
reduced-transparency/forced-colors accessible fallbacks; but it lacks a dedicated CSS automated test, its visual
outcome is not verified, the claimed baseline is partially unrecorded, and all physical/production/license gates remain
blocked.

---

## Independent verification — 2026-11-08 14:32–14:35 +07:00

| Case | Status | Exact evidence |
|---|---|---|
| Backend regression | PASS-AUTOMATED | `backend\\gradlew.bat test --offline`: build successful in 18s. XML aggregation from `backend/build/test-results/test/TEST-*.xml`: 28 suites, 90 tests, **88 passed, 0 failed/errors, 2 skipped**. Gradle reported `:test UP-TO-DATE`, so this verifies existing result artifacts rather than a forced fresh execution. |
| Frontend regression | PASS-AUTOMATED | `frontend\\npm test`: 9 files passed; **70 passed, 0 failed, 0 skipped**, Vitest duration 7.54s. |
| Frontend production build | PASS-AUTOMATED | `frontend\\npm run build`: TypeScript check and Vite build passed; **2,010 modules transformed**; built in 3.72s. |
| Desktop customer journey | PASS-SIMULATED | `node tests/verify-demo-and-real-journey.mjs`: exit 0, no failed checks. DEMO journey completed at 1280×800 and 1920×1200; REAL scope stopped at payment display/VietQR rendering. Evidence: `tests/journey-evidence/2026-11-08T07-32-48.117Z`. This is not payment settlement, camera, printer, or physical-touch evidence. |
| Frame/session disk artifacts | PASS-SIMULATED | `data/sessions` contained 4 top-level UUID session folders and 2 `exports` subfolders. `data/output` contained 2 non-empty framed files: `master_3faff436-7e22-4020-a938-4ebf89e43dac.jpg` and `master_777e20dd-f391-4c8c-825f-26b592ad4661.jpg`, each 97,609 bytes. No `master_*.jpg` existed inside `data/sessions`; masters are stored in the output directory. |
| V1 working-tree status | PASS-AUTOMATED (limited) | `git -C "E:\\HK1_2026_2027\\PhotoboothDesktop" status --short` returned no output. This proves a clean Git worktree at check time, not forensic proof that no ignored/runtime file or metadata was touched. No V1 build or write was performed by this review. |

### Findings

- **HIGH — release evidence remains simulated.** No authorized Canon capture/Live View/unplug test, DNP spool or physical print, physical touchscreen/Mini-PC performance, or provider settlement/write was executed.
- **MEDIUM — backend task was up-to-date.** A clean/forced rerun was not performed because cleanup was neither requested nor necessary for this bounded check. Preserve the 90-test XML evidence, but require a fresh clean CI run for release provenance.
- **LOW — generated output is untracked.** `git status --short` reports `data/output/` untracked. Ensure generated/customer output is excluded from source and release packaging and governed by retention/privacy policy.

**Independent verdict:** software checks pass within their automated/simulated scope; **production release remains BLOCKED**.

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
