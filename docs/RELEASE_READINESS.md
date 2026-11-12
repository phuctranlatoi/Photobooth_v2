# Release Readiness Checklist — V2

## CSS softening polish gate — 2026-11-12 (post-checkpoint 7ca40ac)

**Verdict: BLOCK / NOT RELEASE READY** (unchanged from all prior gates; CSS polish does not clear any release gate).

| Gate / item | Status | Evidence |
|---|---|---|
| CSS scope containment (5 files, no business/camera/QR impact) | **PASS-AUTOMATED (diff audit)** | `git diff 7ca40ac` shows only glass/border/blur/shadow softening + new `--at-glass-rim`/`--at-control-border` tokens; no `.v1-camera`, `.v1-countdown`, `.v1-shutter`, `.v1-payment-qr-slot`, `.v1-payment-columns` or business/IPC rule modified. |
| Frontend regression | **PASS-AUTOMATED** | Vitest 85/85 across 11 files; production build 2,016 modules, 0 errors. |
| Accessible reduced-transparency + forced-colors fallbacks | **PASS-AUTOMATED (source) / VISUAL NOT VERIFIED** | New `@media (prefers-reduced-transparency: reduce)` and extended `@media (forced-colors: active)` blocks across the 5 CSS files; source-verified, not rendered. |
| CSS-specific automated test | **NOT RUN / MISSING** | No assertion on new tokens, reduced-transparency, or forced-colors blocks; validated by non-interference regression only. |
| Visual outcome at 1280×800 / 1920×1200 (OS scaling) | **VISUAL NOT VERIFIED** | No independent screenshot/CDP measurement in this review. |
| Journey runner screenshots | **NOT RUN** | Live Tauri/WebView + real-mode PayOS QR display + process spawn/kill + sqlite3 query — not a pure offline/mock run. |
| Physical Canon DSLR | **BLOCKED / GATED** | No capture/Live View/reconnect test. |
| DNP DS-RX1HS 5×15/10×15 print + cut + V1 comparison | **BLOCKED / GATED** | No physical print. |
| Live PayOS / Neon / Cloudinary settlement & writes | **BLOCKED / GATED** | Simulated display only. |
| 16:10 kiosk mounting (scaling, repeated taps, overflow) | **BLOCKED / GATED** | Not run. |
| Commercial redistribution of Canon DLLs / ONNX weights | **BLOCKED — LEGAL SIGNOFF REQUIRED** | Pre-existing. |
| Untracked native backend artifacts (packaging hygiene) | **BLOCKER** | `backend/io_grpc_netty_*.dll`, `kotlin-compiler-*.alive`, `onnxruntime-java*/`, `sqlite-*.dll` — pre-existing detritus; gitignore/clean before installer packaging. |

**Next actions:** obtain a supervised live-WebView screenshot/CDP pass (no real capture/print/payment) to certify the
softened appearance; add a small Vitest/CSS assertion for the new tokens + reduced-transparency/forced-colors blocks;
clean or gitignore the untracked backend native artifacts; resolve B-001/B-002/D-005 legal gates. No commit/push
performed by this review.

---

## Independent gate update — 2026-11-08

| Area | Status | Evidence |
|---|---|---|
| Backend | PASS-AUTOMATED | 28 suites / 90 tests: 88 passed, 0 failed, 2 skipped. Test task was UP-TO-DATE. |
| Frontend tests | PASS-AUTOMATED | 9 files / 70 tests passed, none failed or skipped. |
| Frontend build | PASS-AUTOMATED | TypeScript + Vite passed; 2,010 modules transformed. |
| Desktop journey | PASS-SIMULATED | DEMO journey completed at 1280×800 and 1920×1200; REAL verification covered payment display/VietQR only. |
| Disk composition artifacts | PASS-SIMULATED | Four session folders and two 97,609-byte `data/output/master_*.jpg` files observed. |
| V1 isolation check | PASS-AUTOMATED (limited) | V1 `git status --short` empty; no forensic/ignored-file proof. |
| Production release | **BLOCKED** | Canon, DNP, physical kiosk/Mini-PC performance, provider settlement/writes, clean installer/recovery, security acceptance, and redistribution licenses remain unresolved. |

**Gate decision: NO-GO for production.** The current evidence supports continued controlled software/hardware-lab testing only. Unit tests and simulated desktop flows must not be represented as real Canon, DNP, payment-settlement, upload, revenue, or physical-touch certification. Canon SDK/ONNX/JRE and other redistribution rights require written signoff. Architectural changes to IPC/session authority, payment verification, print/revenue semantics, camera lifecycle, or LAN delivery require architect and independent reviewer signoff.


## Latest readiness matrix — Real External Integrations Recovery (2026-11-01)

| Release area | Readiness | Evidence / boundary |
|---|---|---|
| Automated backend regression | **READY — PASS-AUTOMATED** | JUnit **70 passed, 1 skipped**. The skipped test remains explicitly non-passing. |
| Automated frontend regression | **READY — PASS-AUTOMATED** | Vitest **40 passed**, with no reported failures. |
| Firebase Layout Catalog | **READY — LIVE READ VERIFIED** | Firestore project `photop-bf902` reported `FIREBASE_LIVE`, synchronized 10 named layouts, and retained disk-cache support. No live write was performed. |
| PayOS VietQR Integration | **READY — LINK/RENDER VERIFIED** | Live PayOS link creation reached `READY`; real VietQR image rendered at 1280×800 and 1920×1200. This does not certify settlement, webhook handling, refunds, or revenue. |
| DEMO Capture Mode | **READY — PASS-SIMULATED** | Camera-free touch flow, zero-revenue behavior, and dry-run 600-DPI composition passed. |
| Desktop Acceptance | **READY — PASS-SIMULATED** | Live Tauri executable: **37/37 checks, 0 failures**. Evidence: `tests/journey-evidence/2026-11-01T13-13-52.592Z/`; 20 screenshots cover both viewports. |
| Canon DSLR | **BLOCKED / NOT-RUN** | No authorized physical capture, Live View, unplug/reconnect, repeated-capture, or disposal validation. |
| DNP RX1HS | **BLOCKED / NOT-RUN** | No spool submission, cut/media validation, or physical output comparison to V1. |
| Physical 16:10 touchscreen/Mini PC | **BLOCKED / NOT-RUN** | CDP viewport checks are not physical glass, DPI, touch, CPU/GPU, memory, or live-view-impact evidence. |
| Neon/Cloudinary and PayOS settlement | **BLOCKED / NOT-RUN** | No production DB write, upload, charge settlement, or revenue operation is claimed. |
| Installer/recovery/licensing | **BLOCKED** | Clean install, recovery, V1 coexistence, and Canon SDK/ONNX/JRE redistribution signoff remain unresolved. |
| **Overall verdict** | **INTEGRATIONS RECOVERED; RELEASE BLOCKED** | Software and the bounded live-read/link integrations are ready for controlled hardware-lab testing. Production release still requires physical hardware, kiosk, packaging/recovery, provider-write/settlement, security, and legal evidence. |

**Integration readiness score:** 3/3 scoped recovery targets verified (Firebase live read/cache, PayOS link/QR render, DEMO capture preservation). **Hardware readiness score:** 0/3 physical targets verified (Canon, DNP, mounted touchscreen/Mini PC). These scoped scores are not a production-readiness percentage.

This section supersedes older readiness/test-count statements below while preserving their historical chronology.

## Latest readiness matrix — Real Payment Restoration & Desktop Verification (2026-11-01)

| Release area | Readiness | Evidence / boundary |
|---|---|---|
| Software Core & State Machine | **READY (AUTOMATED TESTED)** | Backend `gradle.bat --offline test --console=plain`: **62/62 tests across 17 suites** passed (includes `DesktopBoothConfigTest` 2 tests, `RealSessionEngineTest` orderCode handling). |
| Real-Mode Desktop Payment Verification | **READY (DESKTOP VERIFIED)** | `tests/verify-real-payment.mjs` ran against Tauri debug runtime (`le-souvenir-v2.exe`) in real mode: **PASS-REAL-MODE-DESKTOP** on **1280×800** and **1920×1200** viewports. Evidence at `tests/real-payment-evidence/2026-11-01T08-40-13.800Z/`. |
| Error -32001 Resolution | **READY (AUTOMATED TESTED)** | Root causes resolved: backend returns `PENDING` instead of throwing -32001 when `orderCode` is null; frontend polling synchronized; fallback description provided. |
| PayOS Official SDK Parity | **READY (AUTOMATED TESTED)** | `PayOsOfficialAdapter` wraps official SDK client `vn.payos:payos-java:2.0.1`; fails closed safely when unconfigured. |
| Server-Side ZXing QR Generation | **READY (AUTOMATED TESTED)** | Backend `RealSessionEngine.qrPng` encodes VietQR strings into high-resolution 1000×1000 PNG Base64 data URLs via `MultiFormatWriter`. |
| Production Layouts Activation | **READY (AUTOMATED TESTED)** | `config/production-layouts.json` defines `strip-5x15` (4 shots / 3 select, 5s countdown) and `print-10x15` (6 shots / 4 select, 5s countdown). Zero synthetic fixtures in real mode. |
| Hierarchical Configuration & Security | **READY (AUTOMATED TESTED)** | `DesktopBoothConfig` 3-tier loader (workspace `.env` < LocalAppData < process env) verified in `DesktopBoothConfigTest`. Safe masked diagnostics expose boolean flags only; zero secrets committed or logged. |
| V1 Payment UI Parity | **READY (DESKTOP VERIFIED)** | Exact two-column layout (`.v1-payment-columns`), "Bước 3" eyebrow, "Thanh toán" title, "70.000 đ" formatted price, detail rows, QR status chip. Customer bypass button removed; staff cash override revealed via header long-press (>=700ms). |
| Frontend Suite & Production Build | **READY (AUTOMATED TESTED)** | Frontend Vitest **34/34 tests across 7 files** passed; production build passed with zero errors and **2,014 modules** transformed. |
| Dual-Mode Runtime & Fail-Closed IPC | **READY (AUTOMATED TESTED)** | Explicit `--real` / `--simulator` via `IpcMain.kt`, `bridge.rs`, `main.rs`, and `KioskSimulator.tsx`; real mode returns `-32000` / `-32002` with no synthetic fallback. |
| Local SQLite Ledger & Revenue Gate | **READY (AUTOMATED TESTED)** | V2-local `data/sales.db`; sale recording occurs only after verified `PrintResult.Submitted`. |
| 600 DPI Compositor & ZXing QR | **READY (AUTOMATED TESTED)** | 2452×3658 2-up cut and 3658×2452 10×15 output; embedded album QR passes ZXing decode test. |
| Physical Hardware Validation | **BLOCKED (GATED)** | Canon DSLR, DNP DS-RX1HS and mounted physical 16:10 kiosk glass require explicit operator authorization and safe lab setup. Camera and printer are offline in dev kiosk. |
| Production Cloud Services | **BLOCKED (GATED)** | Live PayOS settlement and live Neon/Cloudinary synchronization are not authorized; configured PayOS path fails closed. |
| Commercial Redistribution Review | **BLOCKED (LEGAL SIGNOFF REQUIRED)** | Canon native DLL and ONNX weight redistribution terms remain unresolved. |
| **Overall Verdict** | **READY FOR HARDWARE LAB TESTING / NOT YET PRODUCTION DEPLOYED** | Real-mode payment flow, desktop UI, configuration hierarchy, and software state machine are fully verified. Physical hardware and live merchant deployment remain gated. |

This matrix supersedes older test-count and software-readiness statements below. Historical sections remain for audit chronology and must not override the latest verdict.

## Historical readiness matrix — 2026-11-01 (superseded)

| Release area | Readiness | Evidence / boundary |
|---|---|---|
| Software Core & State Machine | **READY (AUTOMATED TESTED)** | Backend `gradle.bat --offline test --console=plain`: 60/60 tests across 17 suites. |
| Dual-Mode Runtime & IPC | **READY (AUTOMATED TESTED)** | Explicit `--real` / `--simulator` via `IpcMain.kt`, `bridge.rs`, `main.rs`, and `KioskSimulator.tsx`; real mode fails closed with `-32000` / `-32002` and no synthetic fallback. |
| Local SQLite Ledger & Revenue Gate | **READY (AUTOMATED TESTED)** | V2-local `data/sales.db`; sale recording occurs only after verified `PrintResult.Submitted`. |
| 600 DPI Compositor & ZXing QR | **READY (AUTOMATED TESTED)** | 2452×3658 2-up cut and 3658×2452 10×15 output; embedded album QR passes ZXing decode test. |
| Touchscreen UI (11 screens, 6 operator tabs) | **READY (AUTOMATED TESTED)** | Frontend 31/31 across 7 files; production build passed with zero errors and 2,014 modules. Physical touch remains a separate gate. |
| Physical Hardware Validation | **BLOCKED (GATED)** | Canon DSLR, DNP DS-RX1HS and mounted physical 16:10 kiosk require explicit operator authorization and safe lab setup. |
| Production Cloud Services | **BLOCKED (GATED)** | Live PayOS payment and live Neon/Cloudinary synchronization are not authorized; configured PayOS path fails closed. |
| **Overall Verdict** | **READY FOR HARDWARE LAB TESTING / NOT YET PRODUCTION DEPLOYED** | Automated software completion does not substitute for real hardware, live-provider, installer/recovery, or commercial redistribution evidence. |

Additional completed software evidence: `RealSessionEngine.compose()` creates the web album before composition and embeds `albumUrl`; `PayOsOfficialAdapter` follows the official SDK path and is fail-closed when unconfigured. Canon native DLL and ONNX weight redistribution still require legal signoff.

This matrix supersedes older test-count and software-readiness statements below. Historical sections remain for audit chronology and must not override the latest verdict.

## Historical independent gate decision — 2026-10-31 (superseded)

**VERDICT: BLOCK RELEASE.** A scoped offline pre-change baseline was run: frontend tests/build exited 0, but the fresh backend run executed 42 tests with 1 timeout failure. Synthetic evidence does not establish full baseline parity, real hardware, production integrations, installed persistence, kiosk touch usability, packaging, recovery, or legal redistribution.

### Release blockers by severity

| Severity | Finding | Required release evidence |
|---|---|---|
| CRITICAL | No real Canon/DNP validation; print success and revenue cannot be certified from mocks. | Authorized Canon lifecycle/unplug/repeat tests and supervised DNP 5×15/10×15 queue plus physical-output evidence, with no uncertain retry. |
| CRITICAL | Production PayOS/Neon/Cloudinary paths are intentionally untested. | Approved sandbox/non-production E2E proving signature verification, idempotency, reconciliation, no secret logging and revenue only after confirmed accepted print. No production write. |
| HIGH | Fresh backend baseline fails 1/42; wrapper also mishandles benign Gradle stderr. | Diagnose the timeout without silently changing behavior, repair/approve harness handling, then rerun changed slice and full offline suite. Frontend test/build currently pass. |
| HIGH | Full V1 screen/state/settings parity is not demonstrated by current synthetic subset. | Traceable regression matrix for every audited V1 path, cancellation and timeout, with reviewer signoff for any architectural change. |
| HIGH | Installed settings persistence, power loss, crash/restart and duplicate confirmation across restart remain unproven. | Clean-install and recovery tests using V2 identity/paths only. |
| HIGH | 16:10 physical touchscreen, scaling, target size, overflow, feedback, rapid taps and preview aspect are untested. | Operator-observed kiosk run on target display plus screenshots/video and measurements. |
| MEDIUM | Isolation is source/script constrained but not forensically proven. | Pre/post V1 metadata/hash snapshot by an authorized external procedure, while never reading secrets/customer data or executing V1. |
| MEDIUM | Canon SDK, ONNX/model, JRE/JNA and other redistribution rights remain unresolved. | Written legal/license disposition and installer manifest before distribution. |

### Isolation finding

Static evidence supports narrow V2 confinement: `backend/test-foundation.ps1:3-12` places temp, Gradle home, user home and project cache under V2 and invokes a V2-local Gradle distribution; `OperatorSettingsTest.kt:41` writes synthetic settings beneath V2 build output; simulator session outputs resolve beneath the V2 repository (`SimulatorSessionTest.kt:10-12,35-36`). `smoke-installed.ps1:8-15` starts only V2 `build/install/backend/bin` in simulator mode.

This does **not** prove V1 was untouched. Static reading cannot observe prior processes, OS-level writes, child-process behavior, dependency/plugin behavior, junctions/symlinks, or filesystem changes outside inspected paths. No pre/post V1 snapshot was taken, and this review intentionally did not read V1 `.env`, customer images, runtime data, or execute any V1 command. `opencode.json` contains V1 path strings as deny/permission resources; path references alone are not writes, and the configuration is not an OS sandbox.

### Signoff

Release requires QA/reviewer, architect, camera/printer engineer, release engineer, legal/license owner and product owner signoff. Any IPC/session-authority, persistence, print/revenue boundary, or hardware lifecycle change requires explicit architectural reviewer signoff and targeted regression evidence.

### Checkpoint/recovery gate — PENDING

The currently reviewed `docs/CHECKPOINT.md` is **rejected as recovery evidence**: it identifies HEAD but does not prove an archive or exact manifest exists, conditionally says “If a manual checkpoint archive was created,” omits recovery coverage for the recorded dirty/untracked tree, and cites stale 10/4 passing counts instead of the fresh backend 42-with-1-failure and frontend 20-pass evidence. Its verified labels must not be used for release assurance.

Do not use its `git checkout` instruction on the dirty working tree; checkout does not back up untracked or concurrent modified work and is not a validated recovery procedure. Release/checkpoint gate remains pending the architect's actual `.checkpoints` archive, hashes/manifest, dirty-file coverage and a non-destructive restore validation in a separate V2-owned location. No forensic claim that V1 was untouched is made.

Backend and camera conditional implementation tasks correctly stopped **BLOCKED** at this gate. `CHECKPOINT+` was a filename misunderstanding; acceptance requires corrected `docs/CHECKPOINT.md` plus the architect-created `.checkpoints` source snapshot and manifest, independently verified before source changes. QA is not creating a duplicate backup. Current test evidence remains frontend 20/20 passed and backend 42 run with 1 failure.

## Milestone Gates (from AGENTS.md)

| Gate | Name | Status | Evidence Required |
|------|------|--------|-------------------|
| **1** | Legacy Audit | ❌ REVIEW BLOCKED | Corrected source-linked inventory and row-level parity evidence; document existence/title is insufficient |
| **2** | Hardware Bridge Proof | ⏳ PENDING / NOT ACCEPTED | IPC lifecycle plus real authorized Canon/DNP evidence and packaging; old reports are historical only |
| **3** | Touchscreen Design System | ⏳ PENDING / NOT ACCEPTED | Current component evidence plus physical 16:10 touchscreen acceptance |
| **4** | Feature Integration | ⏳ PENDING / NOT ACCEPTED | Real backend and all audited flows E2E; simulator evidence is insufficient |
| **5** | Release Readiness | ❌ BLOCKED | Installer, kiosk, recovery, legal and real-hardware gates |

---

## Gate 1: Legacy Audit — Historical documents, not current acceptance

`docs/PROGRESS.md` identifies historical documentation as unreliable. The rows below record artifact availability only; they do not establish correctness, completeness, checkpoint coverage, source acceptance, or a passed gate. Summary/master matrix titles such as “complete,” “full,” or “master” do not prove row-level coverage.

| Deliverable | Status | Location |
|-------------|--------|----------|
| V1 Architecture Audit | Historical artifact — review required | `docs/01_V1_ARCHITECTURE_AUDIT.md` |
| Feature & Screen Inventory | Historical artifact — superseded/correction required | `docs/02_V1_FEATURE_AND_SCREEN_INVENTORY.md`; newer auditor inventory remains REVIEW BLOCKED |
| Feature Parity Matrix | Historical artifact — correction required | `docs/03_FEATURE_PARITY_MATRIX.md`; master/full matrix titles do not establish coverage |
| Admin & Settings Audit | Historical partial artifact | `docs/09_ADMIN_STUDIO_SETTINGS_AUDIT.md` |
| **V2 Architecture** | Proposal/reference — not accepted by this gate | `docs/V2_ARCHITECTURE.md` |
| **IPC Contracts** | Reference contract — implementation/architecture signoff still required | `docs/IPC_CONTRACTS.md` |
| **Hardware POC Plan** | Plan only — not execution evidence | `docs/HARDWARE_POC_PLAN.md` |
| **Data Flow** | Reference artifact — current-source verification required | `docs/DATA_FLOW.md` |
| **Dependency & License Audit** | Historical artifact — unresolved licenses remain | `docs/DEPENDENCY_AND_LICENSE_AUDIT.md` |
| **Release Architecture** | Proposal/reference — not release acceptance | `docs/RELEASE_ARCHITECTURE.md` |
| **Blockers** | Tracking artifact only | `docs/BLOCKERS.md` |
| **Decisions (ADR)** | Decision records available; implementation verification separate | `docs/DECISIONS.md` |

### Gate 1 blockers (historical list plus superseding review)
1. Feature Parity Matrix has over-claimed coverage — must correct
2. State machine guard enforcement not verified
3. Revenue predicate missing (no separate REVENUE state)
4. `.env` loading mechanism misdocumented
5. Inactivity auto-print claimed but not in code
6. Default config values not validated
7. Camera selection logic incomplete in UI
8. Optional features (video, Firebase, Neon) marked observed but not verified

The historical list is retained as evidence, but it is not exhaustive or current acceptance criteria. Superseding master-auditor review in `MIGRATION_TEST_RESULTS.md` is **REVIEW BLOCKED**, including corrected 17-member V1 enum accounting, unsupported Beauty acceptance claims, admin/tool taxonomy errors, and missing per-setting test traceability. Gate 1 requires corrected source-linked rows and independent review; creating additional summary matrices does not pass it.

---

## Gate 2: Hardware Bridge Proof — Requirements

| POC | Required | Status | Blocker |
|-----|----------|--------|---------|
| Canon EDSDK DLL load + session + Live View | ✅ YES | 🔲 | B-001 (license) |
| DNP RX1HS printer enumeration (read-only) | ✅ YES | 🔲 | Driver install |
| IPC StdIO JSON-RPC + HMAC auth | ✅ YES | 🔲 | - |
| Named Pipe Live View streaming (mock) | ✅ YES | 🔲 | - |
| Tauri v2 sidecar spawn/health/shutdown | ✅ YES | 🔲 | B-004 (unproven) |
| V2 path isolation verified | ✅ YES | 🔲 | - |
| Backend crash detection + restart | ✅ YES | 🔲 | - |
| IPC latency < 50ms | ✅ YES | 🔲 | - |

**Gate 2 Pass Criteria**: All POCs pass with documented evidence (logs, timing, screenshots).

---

## Gate 3: Touchscreen Design System — Requirements

| Component | Status | Notes |
|-----------|--------|-------|
| Design tokens (colors, spacing, typography) | 🔲 | Tailwind config |
| Touch targets (min 48×48dp) | 🔲 | All interactive elements |
| Screen templates (all 13 states) | 🔲 | Mock data only |
| Motion animations (transition, feedback) | 🔲 | Framer-motion |
| Accessibility (contrast, focus) | 🔲 | WCAG AA |
| Storybook / component catalog | 🔲 | Documentation |
| 16:10 landscape responsive | 🔲 | Primary display |

---

## Gate 4: Feature Integration — Requirements

| Flow | Backend Method | Frontend Screen | Status |
|------|----------------|-----------------|--------|
| Boot → Config Load | `health.check` + `config.get` | Loading | 🔲 |
| Layout/Effect Selection | `session.create` + `session.transition` | StudioMode | 🔲 |
| Quantity + Payment | `payment.createLink` + polling | Quantity + Payment | 🔲 |
| Capture Sequence | `capture.startSequence` + events | LiveView/Countdown/Capturing | 🔲 |
| Photo Selection | `session.snapshot` + `session.transition` | SelectPhotos | 🔲 |
| Frame Selection | `session.transition` | Editing | 🔲 |
| Confirm & Print | `print.confirmAndPrint` (idempotent) | PrintPending/Printing | 🔲 |
| Delivery (QR, summary) | `session.snapshot` | Delivery | 🔲 |
| Admin Config | `config.update` | Admin | 🔲 |

**All flows must work with REAL backend (no simulator)**.

---

## Gate 5: Release Readiness — Requirements

| Area | Checklist Item | Status |
|------|----------------|--------|
| **Installer** | MSI builds in CI | 🔲 |
| | MSIX builds (optional) | 🔲 |
| | Silent install (`/qn`) works | 🔲 |
| | Uninstall preserves `data/` | 🔲 |
| | Code signed (EV cert) | 🔲 |
| | SmartScreen reputation OK | 🔲 |
| **Updater** | Tauri updater endpoint live | 🔲 |
| | Delta updates work | 🔲 |
| | Rollback to previous version | 🔲 |
| **Kiosk** | Assigned Access tested | 🔲 |
| | Auto-start on boot | 🔲 |
| | Touch keyboard suppressed | 🔲 |
| | DPI awareness (PerMonitorV2) | 🔲 |
| | 16:10 touchscreen verified | 🔲 |
| **Hardware** | Canon EOS R series tested | 🔲 |
| | DNP RX1HS print quality verified | 🔲 |
| | HotFolder (Sony) tested | 🔲 |
| | Webcam (DroidCam) tested | 🔲 |
| **Software** | Payment sandbox + production | 🔲 |
| | Neon sync verified | 🔲 |
| | Cloudinary upload verified | 🔲 |
| | Beauty presets match V1 output | 🔲 |
| | Video composition works | 🔲 |
| **Resilience** | Power loss recovery tested | 🔲 |
| | Camera unplug/replug recovery | 🔲 |
| | Printer error recovery | 🔲 |
| | Network failure graceful degradation | 🔲 |
| | Double-tap idempotency verified | 🔲 |
| **Compliance** | Canon EDSDK license secured | 🔲 |
| | ONNX model licenses verified | 🔲 |
| | JNA LGPL compliance | 🔲 |
| | ffmpeg GPL compliance | 🔲 |
| | Privacy policy / terms | 🔲 |

---

## Test Evidence Required Per Gate

| Gate | Evidence Format | Storage |
|------|----------------|---------|
| 1 | Markdown docs + source links | `docs/01-09_*.md` |
| 2 | POC logs + timing + screenshots | `docs/poc_results/` |
| 3 | Storybook URL + component tests | `docs/design-system/` |
| 4 | E2E test reports (Playwright) | `tests/e2e/results/` |
| 5 | Smoke test logs + video | `release/smoke_<version>.log` |

---

## Current Verdict

| Gate | Verdict | Next Action |
|------|---------|-------------|
| **1** | ❌ **BLOCKED** | Fix Feature Parity Matrix; open all "Observed import" files |
| **2** | ⏳ **PENDING** | Await Gate 1; run POCs per `HARDWARE_POC_PLAN.md` |
| **3** | ⏳ **PENDING** | Await Gate 2; UI Designer starts design tokens |
| **4** | ⏳ **PENDING** | Await Gates 2+3 |
| **5** | ⏳ **PENDING** | Await Gate 4 |

---

## Sign-Off Authority

| Gate | Approver | Criteria |
|------|----------|----------|
| 1 | Lead Architect + QA Lead | All docs accurate; matrix corrected; source-linked |
| 2 | Camera/Printer Engineers + Architect | All POCs pass; evidence archived |
| 3 | UI Designer + Frontend Lead | Component library complete; mock UI verified |
| 4 | Backend Lead + Frontend Lead + Tester | All E2E tests pass; no simulator code in prod paths |
| 5 | Release Engineer + Product Owner | Smoke test passes; kiosk verified; legal clearances |

---

*Updated: 2026-10-30*  
*Next Review: After Gate 1 unblocked*
