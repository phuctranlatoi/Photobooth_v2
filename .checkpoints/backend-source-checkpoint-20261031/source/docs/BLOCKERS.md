# Blockers & Escalations — V2

## Current evidence update (2026-10-31)

- Three implementation attempts remain blocked until an actual V2 source snapshot is captured and its manifest/hash independently verified. No speculative source-copy or app edits before that gate.
- Master-audit 17-state enumeration correction/acceptance remains unresolved; the prior “accepted Beauty” claim was rejected. Do not treat it as established baseline evidence.
- Current reported test results: frontend 20 tests / 6 files and build pass; backend 42 tests with one failure. These are reported results, not rerun in this update.
- V1 forensic untouched status remains unverified; no claim of independent V1 integrity verification follows from these reports.

## Current coordination blockers (2026-10-31)

| ID | Blocker | Impact | Status / exit evidence |
|---|---|---|---|
| **C-005** | No accepted recoverable V2 checkpoint; initial HEAD-only claim rejected and conditional archive had stale tests. | App implementation cannot safely proceed. | Architect correction in progress; backend conditional attempt blocked pending verified backup manifest. Exit: manifest plus independent recoverability verification. |
| **C-006** | Backend run reports 42 tests / one failure from shared settings fixture/state across six engines. | Backend baseline is not green. | Test-only isolation remedy approved (six isolated engine fixtures + offline harness); preserve persisted shared-settings integration test. Exit: rerun evidence and retained coverage. |
| **C-007** | Auditor's four documents rejected by independent review for unsupported accepted-Beauty claims, unreliable Tools taxonomy, and configuration omissions. | Audit conclusions not yet reliable/complete. | Auditor correction in progress; specialist source-linked documents remain inventories only. |
| **C-008** | Frontend/camera implementation depends on actual verified snapshot. | Slice work is gated. | Conditional; no app edits or after-session background promise before checkpoint verification. |

## Scoped coordination blockers (2026-10-31)

| ID | Item | Impact | Status / evidence needed |
|---|---|---|---|
| **C-001** | Architect checkpoint pending (`ses_e709d20e1ffewRrzeoisMXvDQ9`) | Do not proceed as if checkpoint or audit phase is complete. | Pending; require explicit architect checkpoint evidence/review. |
| **C-002** | V1 untouched forensic verification | Cannot assert independently verified V1 integrity from agent activity reports alone. | **NOT VERIFIED**; records only agents' reported read-only actions. |
| **C-003** | Baseline agent status is self-reported | Inventory/source review completion is not comprehensive audit, test, or hardware evidence. | Keep each workstream scoped to its cited baseline and evidence. |
| **C-004** | Hardware/production boundaries | Scoped shell authorization is not hardware, production, or real-print approval. | V2 offline only; no device operation, production call, V1 execution, or physical print. |

## Active Blockers (Require External Resolution)

| ID | Blocker | Impact | Owner | Status | Resolution Path |
|----|---------|--------|-------|--------|-----------------|
| **B-001** | Canon EDSDK redistribution/use terms and deployment requirements | SDK rights and permitted deployment/runtime requirements are unverified; neither bundling nor an EOS Utility installation requirement is established here. | Legal / Vendor | 🔴 **UNKNOWN — REVIEW REQUIRED** | Obtain authoritative Canon/vendor terms and legal review before packaging or prescribing installation. |
| **B-002** | Accepted Beauty model/source provenance and license manifest unresolved | Cannot establish approved redistribution/deployment terms or provenance from current evidence. Beauty algorithm/model behavior is frozen; no substitute authorized. | Legal / Backend | 🔴 **BLOCKED — MANIFEST/REVIEW PENDING** | Establish accepted model/source manifest and applicable terms; preserve frozen implementation pending review. |
| **B-003** | Detector/model provenance and license manifest unresolved | No alternative detector is approved; replacing components could violate frozen Beauty behavior. | Legal / Backend | 🔴 **BLOCKED — MANIFEST/REVIEW PENDING** | Resolve provenance/terms for accepted sources; no YuNet-only or other replacement proposal is authorized. |
| **B-004** | Tauri v2 + JVM sidecar + JNA + Windows message pump unproven | Core architecture risk; may need Electron fallback | Architect | 🟡 **POC PLANNED** | Milestone 2 POC (HARDWARE_POC_PLAN.md); health-only bridge PASS |
| **B-005** | DNP RX1HS driver as prerequisite | App cannot print without user-installed driver | Release | 🟡 **DOCUMENTED** | Document in requirements; test with DNP SDK if available |

---

## Technical Risks (Under Investigation)

### Superseded proposals / provenance note (2026-10-31)

- Historical B-002/B-003 resolution text proposing a **YuNet-only fallback** or alternative detector is **withdrawn, not approved**. Do not substitute models or algorithms. Preserve the accepted, frozen Beauty behavior while provenance and the accepted source/model manifest remain unresolved.
- Historical B-001 wording that users “must install EOS Utility” is **not established**. Canon terms and runtime requirements are unknown pending authoritative vendor/legal evidence; do not invent a licensing remedy or packaging prerequisite.
- R-004's prior suggestion that a separate process/no static linking resolves GPL risk is **not a legal determination**. Those architectural facts do not by themselves settle licensing obligations.

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| **R-001** | JNA + EDSDK dispatcher thread crashes JVM | Medium | High | Isolate in dedicated thread; crash recovery via Tauri restart |
| **R-002** | Named pipe Live View throughput < 15fps | Low | Medium | Fallback to compressed WebSocket; reduce resolution |
| **R-003** | ONNX Runtime 1.18.0 + YuNet model incompatibility | Low | High | Pin versions; test in POC |
| **R-004** | ffmpeg licensing/distribution obligations not resolved | Unknown | Legal | Separate-process/no-static-linking architecture is not proof of a legal remedy; obtain dependency-specific legal review before distribution. |
| **R-005** | Windows Print Spooler spool file size limits for 5x15cm strips | Medium | Medium | Test print path in POC; chunk large jobs |
| **R-006** | V1 + V2 concurrent execution conflicts | Low | Medium | Lock file + separate paths; documented in DATA_FLOW.md |
| **R-007** | Power loss mid-session corrupts session state | Low | Medium | Atomic writes; recovery scan on startup |
| **R-008** | PayOS sandbox vs production API mismatch | Medium | Medium | Separate config; test both environments |

---

## Integration Blockers (Task2)

| ID | Blocker | Impact | Owner | Status | Resolution Path |
|----|---------|--------|-------|--------|-----------------|
| **I-001** | Contract draft discrepancies between backend `SimulatorIpcServer` impl and frontend `simulator-contract.ts` | Backend/frontend wire format mismatch stalls simulator session tests | Backend Engineer / Frontend Lead | 🟡 **IN PROGRESS** | Implementers reconcile exact JSON-RPC params/results; Architect does not edit frontend types |
| **I-002** | Live WebView `invoke('health_check')` → Rust → JVM | **RESOLVED (narrow)** — CDP harness: mounted React → Tauri `health_check` → JVM PID 17520, `CloseMainWindow=True`, host exit 0, JVM terminated. Abrupt parent kill / hung child / `taskkill /T` fallback **NOT TESTED**. | Frontend Lead / Tester-Reviewer | 🟢 **RESOLVED (exact tested scenario only)** | Verified via `docs/DESKTOP_BRIDGE_INDEPENDENT_REVIEW.md` CDP harness. Broader simulator session invoke still requires backend impl. |
| **I-003** | Window-close with active JVM child cleanup | **RESOLVED (normal close)** — CDP harness: `CloseMainWindow=True`, host exit 0, JVM PID terminated. **Abrupt parent kill / hung child / `taskkill /T` fallback NOT TESTED**. | Architect / Tester-Reviewer | 🟢 **RESOLVED (normal close only)** | Verified via `docs/DESKTOP_BRIDGE_INDEPENDENT_REVIEW.md`. Fallback/abrupt tests remain separate gap. |

---

## Resolved / Accepted

| ID | Item | Resolution |
|----|------|------------|
| **A-001** | Compose Desktop UI → React + Tauri | Accepted; V1 UI not reused |
| **A-002** | Firebase Admin SDK in backend | Deferred to Milestone 4; simulator excludes |
| **A-003** | Neon direct JDBC in backend | Deferred to Milestone 4; simulator excludes |
| **A-004** | PaymentService (PayOS) in backend | Deferred to Milestone 4; simulator excludes |
| **A-005** | Gradle 8.14.3 publisher checksum | **RESOLVED** — HTTPS SHA-256 exactly matches local ZIP |

---

## Escalation Contacts

| Area | Contact | Channel |
|------|---------|---------|
| Canon SDK Licensing | Canon Vietnam B2B | Email / Partner Portal |
| ONNX Model Licenses | Legal Counsel | Internal |
| Tauri/Rust Issues | Tauri Discord / GitHub | Community |
| DNP Driver/SDK | DNP Japan / Distributor | Vendor Support |
| Code Signing Cert | DigiCert / GlobalSign | Vendor Portal |

---

## Blocker Resolution Workflow

```
1. Blocker identified → Document in BLOCKERS.md
2. Assign owner + target date
3. If external dependency → Escalate to contact
4. If technical → Spike/POC in Milestone 2
5. If legal → Legal review + fallback design
6. Update status weekly in PROGRESS.md
7. Gate 2 (Hardware POC) requires B-001, B-004 resolved or fallback proven
8. Task2 (Simulator Session) requires I-001, I-002 resolved
```

---

*Last Updated: 2026-10-30*  
*Next Review: Task2 (Simulator Session) completion*
