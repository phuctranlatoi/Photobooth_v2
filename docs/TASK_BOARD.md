# TASK_BOARD.md

## Superseding active milestone board (2026-11-01)

| Task | Status | Verification |
|---|---|---|
| Milestones 1–6 baseline migration/integration | **COMPLETED / VERIFIED** | Current automated baseline and migrated UI/operator inventory are complete for this scope. |
| Frontend regression | **COMPLETED / PASS-AUTOMATED** | `npm test`: 7/7 files, 29/29 tests, exit 0. |
| Frontend production build | **COMPLETED / PASS-AUTOMATED** | `npm run build`: TypeScript + Vite build exit 0; 2,014 modules. |
| Backend regression | **COMPLETED / PASS-AUTOMATED** | Forced offline Gradle run: 12/12 suites, 42/42 tests, no failures/errors/skips. |
| Timeout fixture isolation | **COMPLETED / VERIFIED** | `timeoutAutoPrintNoSaleAndCancelMatrix()` passes in fresh JUnit XML. |
| Customer/operator migration inventory | **COMPLETED / VERIFIED** | 11 customer screens; 6 operator tabs; Tools and Settings migrated. |
| Real Canon DSLR validation | **BLOCKED / NOT-RUN** | Requires explicit operator authorization and safe hardware setup. |
| Real DNP printer/output validation | **BLOCKED / NOT-RUN** | Requires explicit authorization; no physical print was submitted. |
| Physical touch, installer, production providers, licensing | **OPEN RELEASE GATES** | Automated green status does not satisfy these gates. |

**Current automated regressions: 0. Overall product release remains blocked by the non-automated gates above.** Older board snapshots below are historical and superseded for active-task status.

## Current evidence status (2026-10-31)

| Item | Current status |
|---|---|
| Frontend | Reported actual: 20 tests / 6 files passed; build passed. Not rerun for this note. |
| Backend | Reported actual: 42 tests, 1 failure. Not rerun for this note. |
| Implementation | Three attempts remain **BLOCKED** pending an independently verified checkpoint; no app edits authorized. |
| Master audit | 17-state enumeration correction/acceptance unresolved; earlier accepted-Beauty claim rejected. |
| Next gate | Actual V2 source snapshot, with manifest and hash verification; only then consider source-copy/implementation work. No speculative source-copy. |

No V1 forensic untouched claim is supported by these statuses.

## Current checkpoint / next work (2026-10-31; reported, not independently rerun)

| Item | Status | Acceptance / constraint |
|---|---|---|
| V2 checkpoint | Initial HEAD-only claim **REJECTED**; conditional archive included stale tests. Architect correction in progress. | Must produce and independently verify recoverable-source manifest before app edits. Backend conditional implementation attempt is **BLOCKED** because no verified backup manifest exists. |
| Frontend | Reported 20 tests / 6 files pass; build pass. | Preserve as reported evidence; no rerun in this documentation update. |
| Backend | Reported 42 tests, one failure; shared settings fixture/state across six engines diagnosed. | Approved test-only change: isolate six engine fixtures and offline harness. Retain persisted shared-settings integration coverage. |
| Legacy audit | Four auditor docs produced; independent review rejected unsupported accepted-Beauty claims, unreliable Tools taxonomy, and missing config coverage. | Auditor correction in progress; no full audit completion claim. |
| Frontend/camera slices | Conditional, awaiting verified snapshot. | No app edits before checkpoint verification; no background completion promise. |

Next task order: verified checkpoint → test-only isolation fix with integration assertions → architect-approved bounded slices. Specialist source-linked docs are source inventories only.

## Coordination snapshot (2026-10-31; reported status, not gate evidence)

| Workstream | Reported agent/status | Scope note |
|---|---|---|
| Legacy inventory | legacy-auditor `ses_e70a11911ffeZ8XCL7SqnXDk7b` — inventory | Not a claim of full audit completion. |
| Architecture checkpoint | architect `ses_e709d20e1ffewRrzeoisMXvDQ9` — pending | No checkpoint approval/completion claimed. |
| Camera baseline | camera `ses_e709cf659ffePXgtKXyGcPQnQG` — audit complete | Audit report only; no physical camera proof. |
| Printer baseline | printer — audit complete | See `PRINTER_BASELINE_INVENTORY.md`; no printer/device operation or physical print. |
| UI baseline | UI `ses_e709bb9fbffeESyRONVXSFWre1` — source comparison complete | See `UI_BASELINE_COMPARISON.md`; source comparison, not screenshot or mounted parity. |
| Static review | tester `ses_e709ba21effeLwcg8O494bXq3n` — static review complete | See `MIGRATION_TEST_RESULTS.md`; no new test run implied. |
| Backend baseline | backend `ses_e709b7eccffeDobwsekw4JVqZj` — audit complete | Audit only, not full implementation. |
| Frontend slice | frontend `ses_e7098a611ffelkffCXMgKv6Z5i` — preparing slice | No slice completion claimed. |

User authorization now permits scoped V2-only shell checkpoint/offline tests/builds, with all temp/cache/output paths confined to V2. No V1 execution, production integration, hardware/device operation, or physical print is authorized. V1 untouched forensic verification remains **NOT VERIFIED**; agent reports describe read-only work only. Preserve existing source; no redesign in this baseline task.

## Independent gated work board

| ID | Deliverable | Owner | Status / acceptance |
|---|---|---|---|
| G1 | Correct audit authority and consolidated matrix | Tester-reviewer | DONE; gate remains FAIL |
| G2 | Isolated foundation characterization | Backend/reviewer | PASS-AUTOMATED narrow scope: independent 5-test run exit 0 |
| G3 | Guarded backend commands and immutable snapshots | Architect/backend | PASS-SIMULATED narrow simulator; initial contract remains inconsistent with actual handoff |
| G4 | Versioned authenticated host↔sidecar IPC | Architect | Health-only PASS; simulator methods extend same private stdio; HMAC deferred |
| G5 | Synthetic compositor/LUT/mirror/alpha fixtures | Backend/tester | PARTIAL PASS: simulator compositor files/dedup; LUT/Beauty/pixel parity not covered |
| G6 | V2-only Hot Folder readiness/order/duplicate tests | Camera/tester | PASS-AUTOMATED synthetic fixture; real producer/restart/late-file ownership NOT RUN |
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
