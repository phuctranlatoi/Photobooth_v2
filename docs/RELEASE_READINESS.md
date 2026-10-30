# Release Readiness Checklist — V2

## Milestone Gates (from AGENTS.md)

| Gate | Name | Status | Evidence Required |
|------|------|--------|-------------------|
| **1** | Legacy Audit | 🟡 In Progress | All V1 features inventoried; docs written to V2 |
| **2** | Hardware Bridge Proof | 🔲 Not Started | IPC works, Canon SDK loads, DNP enumerated, sidecar packages |
| **3** | Touchscreen Design System | 🔲 Not Started | Component library + mock-state UI complete |
| **4** | Feature Integration | 🔲 Not Started | Real backend connected; all flows E2E |
| **5** | Release Readiness | 🔲 Not Started | Installer, kiosk verified, rollback tested |

---

## Gate 1: Legacy Audit — Current Status

| Deliverable | Status | Location |
|-------------|--------|----------|
| V1 Architecture Audit | ✅ Complete | `docs/01_V1_ARCHITECTURE_AUDIT.md` |
| Feature & Screen Inventory | ✅ Complete | `docs/02_V1_FEATURE_AND_SCREEN_INVENTORY.md` |
| Feature Parity Matrix | ⚠️ Needs Correction | `docs/03_FEATURE_PARITY_MATRIX.md` (per QA_REPORT.md) |
| Admin & Settings Audit | 🟡 Partial | `docs/09_ADMIN_STUDIO_SETTINGS_AUDIT.md` |
| **V2 Architecture** | ✅ Complete | `docs/V2_ARCHITECTURE.md` |
| **IPC Contracts** | ✅ Complete | `docs/IPC_CONTRACTS.md` |
| **Hardware POC Plan** | ✅ Complete | `docs/HARDWARE_POC_PLAN.md` |
| **Data Flow** | ✅ Complete | `docs/DATA_FLOW.md` |
| **Dependency & License Audit** | ✅ Complete | `docs/DEPENDENCY_AND_LICENSE_AUDIT.md` |
| **Release Architecture** | ✅ Complete | `docs/RELEASE_ARCHITECTURE.md` |
| **Blockers** | ✅ Complete | `docs/BLOCKERS.md` |
| **Decisions (ADR)** | ✅ Complete | `docs/DECISIONS.md` |

### Gate 1 Blockers (from QA_REPORT.md)
1. Feature Parity Matrix has over-claimed coverage — must correct
2. State machine guard enforcement not verified
3. Revenue predicate missing (no separate REVENUE state)
4. `.env` loading mechanism misdocumented
5. Inactivity auto-print claimed but not in code
6. Default config values not validated
7. Camera selection logic incomplete in UI
8. Optional features (video, Firebase, Neon) marked observed but not verified

**Action**: Specialist sub-agents must open all "Observed import" files and add tests before Gate 1 passes.

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