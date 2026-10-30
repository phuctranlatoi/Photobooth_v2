# TASK_BOARD.md

## Independent gated work board

| ID | Deliverable | Owner | Status / acceptance |
|---|---|---|---|
| G1 | Correct audit authority and consolidated matrix | Tester-reviewer | DONE; gate remains FAIL |
| G2 | Isolated foundation characterization | Backend/reviewer | PASS-AUTOMATED narrow scope: independent 5-test run exit 0 |
| G3 | Guarded backend commands and immutable snapshots | Architect/backend | PASS-SIMULATED narrow simulator; initial contract remains inconsistent with actual handoff |
| G4 | Versioned authenticated host↔sidecar IPC | Architect | Health-only PASS; simulator methods extend same private stdio; HMAC deferred |
| G5 | Synthetic compositor/LUT/mirror/alpha fixtures | Backend/tester | PARTIAL PASS: simulator compositor files/dedup; LUT/Beauty/pixel parity not covered |
| G6 | V2-only Hot Folder readiness/order/duplicate tests | Camera/tester | PARTIAL skeleton only; readiness/order/duplicate tests NOT RUN |
| G7 | Canon loader/lifecycle/license proof | Camera/architect/legal | PARTIAL disabled reflection; capture/reconnect/disposal/native/license BLOCKED |
| G8 | Printer dry-run identity/geometry/idempotency | Printer/tester | PARTIAL fake boundary/printable; spooler/media/cut/physical DNP BLOCKED |
| G9 | Payment/revenue/cloud mock tests | Backend/tester | Simulator only: `payment.mockComplete` (no PayOS/QR) |
| G10 | Accepted Beauty manifest/hashes/licenses | Owner/backend/legal | BLOCKED (B-002, B-003) |
| G11 | Full Admin gaps: Tools/events/settings/revenue | UI/backend/tester | PARTIAL |
| G12 | 16:10 React UI and touch/scaling tests | UI/frontend/tester | PASS-SIMULATED two CSS viewports/screenshots; physical touch/DPI NOT RUN |
| G13 | Gradle distribution provenance | Build/reviewer | **PASS** — HTTPS publisher SHA-256 exactly matches local ZIP |
| G14 | Packaging/JRE/native/model/driver coexistence | Architect/tester | BLOCKED |
| G15 | Health-only private bridge proof | Frontend/backend/architect/tester | **PASS-AUTOMATED/PASS-SIMULATED** — backend 10 tests (5 foundation + 3 bridge + 2), frontend 4 tests, Rust compile, bridge-probe real JVM roundtrip, Tauri window launch/close |
| G16 | Live WebView invoke and close-active-child proof | Frontend/architect/tester | **RESOLVED (narrow)** — CDP harness: mounted React → Tauri `health_check` → JVM PID 17520, `CloseMainWindow=True`, host exit 0, JVM terminated. Abrupt/hung kill NOT TESTED. |
| G17 | Hung child/timeout/tree-kill/parent-death tests | Architect/tester | NOT TESTED — known gap: force parent kill may not run `Drop`/`taskkill` |
| G18 | Ratify actual private-pipe health contract vs HMAC/named-pipe architecture doc | Architect/reviewer | **OPEN** — simulator extends private pipe; HMAC deferred to production |

## Gate acceptance

No gate passes from "file observed." Require exact tests in `FEATURE_PARITY_MATRIX.md`, security closure, architect/reviewer signoff, and separate real-hardware evidence. V1 baseline comparison was not performed.

---
*This board tracks audit-through-implementation. Simulator session implementation (Task2) now in progress.*
