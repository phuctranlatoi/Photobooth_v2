# Release Readiness Checklist — V2

## Independent gate decision — 2026-10-31

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
