# Blockers & Escalations — V2

## Active Blockers (Require External Resolution)

| ID | Blocker | Impact | Owner | Status | Resolution Path |
|----|---------|--------|-------|--------|-----------------|
| **B-001** | Canon EDSDK redistribution license | Cannot bundle DLLs; users must install EOS Utility | Legal / Vendor | 🔴 **BLOCKED** | Contact Canon Vietnam ISV program; prepare HotFolder fallback |
| **B-002** | BiSeNet ONNX model license | Commercial use unclear; beauty parsing may be unlicensed | Legal | 🔴 **BLOCKED** | Legal review; prepare YuNet-only fallback (detection only) |
| **B-003** | SCRFD ONNX model license | Alternative detector license unclear | Legal | 🔴 **BLOCKED** | Legal review; use YuNet only |
| **B-004** | Tauri v2 + JVM sidecar + JNA + Windows message pump unproven | Core architecture risk; may need Electron fallback | Architect | 🟡 **POC PLANNED** | Milestone 2 POC (HARDWARE_POC_PLAN.md) |
| **B-005** | DNP RX1HS driver as prerequisite | App cannot print without user-installed driver | Release | 🟡 **DOCUMENTED** | Document in requirements; test with DNP SDK if available |

---

## Technical Risks (Under Investigation)

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| **R-001** | JNA + EDSDK dispatcher thread crashes JVM | Medium | High | Isolate in dedicated thread; crash recovery via Tauri restart |
| **R-002** | Named pipe Live View throughput < 15fps | Low | Medium | Fallback to compressed WebSocket; reduce resolution |
| **R-003** | ONNX Runtime 1.18.0 + YuNet model incompatibility | Low | High | Pin versions; test in POC |
| **R-004** | ffmpeg GPL contamination of app | Low | Legal | Separate process; no static linking |
| **R-005** | Windows Print Spooler spool file size limits for 5x15cm strips | Medium | Medium | Test print path in POC; chunk large jobs |
| **R-006** | V1 + V2 concurrent execution conflicts | Low | Medium | Lock file + separate paths; documented in DATA_FLOW.md |
| **R-007** | Power loss mid-session corrupts session state | Low | Medium | Atomic writes; recovery scan on startup |
| **R-008** | PayOS sandbox vs production API mismatch | Medium | Medium | Separate config; test both environments |

---

## Resolved / Accepted

| ID | Item | Resolution |
|----|------|------------|
| **A-001** | Compose Desktop UI → React + Tauri | Accepted; V1 UI not reused |
| **A-002** | Firebase Admin SDK in backend | Deferred to Milestone 4; simulator excludes |
| **A-003** | Neon direct JDBC in backend | Deferred to Milestone 4; simulator excludes |
| **A-004** | PaymentService (PayOS) in backend | Deferred to Milestone 4; simulator excludes |

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
```

---

*Last Updated: 2026-10-30*  
*Next Review: Milestone 2 POC completion*