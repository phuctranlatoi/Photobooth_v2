# TASK_BOARD.md

## Independent gated work board

| ID | Deliverable | Owner | Status / acceptance |
|---|---|---|---|
| G1 | Correct audit authority and consolidated matrix | Tester-reviewer | DONE; gate remains FAIL |
| G2 | Isolated foundation characterization | Backend/reviewer | PASS-AUTOMATED narrow scope: independent 5-test run exit 0 |
| G3 | Guarded backend commands and immutable snapshots | Architect/backend | BLOCKED pending reviewed contract |
| G4 | Versioned authenticated host↔sidecar IPC | Architect | NOT STARTED |
| G5 | Synthetic compositor/LUT/mirror/alpha fixtures | Backend/tester | NOT STARTED |
| G6 | V2-only Hot Folder readiness/order/duplicate tests | Camera/tester | NOT STARTED |
| G7 | Canon loader/lifecycle/license proof | Camera/architect/legal | BLOCKED |
| G8 | Printer dry-run identity/geometry/idempotency | Printer/tester | NOT STARTED; physical DNP BLOCKED |
| G9 | Payment/revenue/cloud mock tests | Backend/tester | NOT STARTED |
| G10 | Accepted Beauty manifest/hashes/licenses | Owner/backend/legal | BLOCKED |
| G11 | Full Admin gaps: Tools/events/settings/revenue | UI/backend/tester | PARTIAL |
| G12 | 16:10 React UI and touch/scaling tests | UI/frontend/tester | NOT STARTED |
| G13 | Gradle distribution provenance | Build/reviewer | OPEN: local hash measured; trusted comparison missing |
| G14 | Packaging/JRE/native/model/driver coexistence | Architect/tester | BLOCKED |
| G15 | Health-only private bridge proof | Frontend/backend/architect/tester | PASS-SIMULATED narrow scope: actual Rust→JVM; no WebView invoke |
| G16 | Live WebView invoke and close-active-child proof | Frontend/architect/tester | NOT RUN |
| G17 | Hung child/timeout/tree-kill/parent-death tests | Architect/tester | NOT RUN |
| G18 | Ratify actual private-pipe health contract vs HMAC/named-pipe architecture doc | Architect/reviewer | OPEN; required before adding methods |

## Gate acceptance

No gate passes from “file observed.” Require exact tests in `FEATURE_PARITY_MATRIX.md`, security closure, architect/reviewer signoff, and separate real-hardware evidence. V1 baseline comparison was not performed.

---
*This board is only for the audit phase – no implementation code will be written yet.*
