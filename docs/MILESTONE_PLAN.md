# LE SOUVENIR Photobooth V2 — Refined Phase 2–6 Plan

**Status:** Proposed gated delivery plan  
**Date:** 2026-11-12  
**Prerequisite:** Completed V1 audit documents named in the task request  
**Scope:** V2 only

## 1. Program rules

1. Gates are evidence decisions, not calendar dates. A partially demonstrated
   item is `BLOCKED` or `NOT RUN`, never “effectively passed.”
2. Simulator and UI work may proceed in parallel where it cannot constrain a
   hardware decision, but **full frontend–real-backend integration is prohibited
   until Phase 2 Canon and spooler gates pass**.
3. Physical shutter, print, production payment, Neon write, Cloudinary upload, or
   customer-media use requires explicit authorization and a bounded test plan.
4. No phase reads V1 `.env`, executes/builds V1, mutates V1 Git, or writes a V1
   runtime path. Reusable source/resources enter V2 only after provenance and
   license review.
5. Each phase ends with changed-file inventory, tests, evidence class, known gaps,
   V1-untouched statement scoped to the work, and independent review.
6. Layout `shotCount`, `selectCount`, countdown, price, copy rules, crop, LUT,
   mirror, Beauty, composition and state outcomes are parity-controlled. Changes
   require explicit approval, not an incidental refactor.

## 2. Roles

| Role | Accountability |
|---|---|
| Solutions Architect | Contracts, boundaries, ADRs, gate recommendation |
| Desktop/Shell Engineer | Tauri/Electron host, child lifecycle, private IPC |
| Backend Lead | Kotlin authority, state/orchestration, operation journal |
| Camera Engineer | Canon/Hot Folder/webcam adapters and actual-device proof |
| Printer Engineer | Windows queues/spooler, DNP proof, status semantics |
| Imaging/Beauty Engineer | Designated, manifest-verified image/LUT/Beauty/composition behavior |
| Business Integrations Engineer | PayOS, ledger, Neon, Cloudinary, Web Album, QR |
| UI Designer | 16:10 touch system and state/error specifications |
| Frontend Lead | React screens, typed bridge client, media lifecycle |
| Release Engineer | Runtime image, installer, update, rollback, signing |
| Security/License Owner | Secrets, package attack surface, rights/provenance |
| Tester-Reviewer | Independent contracts, parity, hardware and release verdicts |
| Lab Operator/Product Owner | Authorizes hardware/financial tests and parity changes |

Agents receive non-overlapping file ownership from `V2_PROJECT_STRUCTURE.md`.
Cross-boundary work is sequenced; specialists do not concurrently patch canonical
contracts or one another's implementation files.

## 3. Phase 2 — Architecture contracts and hardware bridge proof

### Goal

Resolve the architecture-killing risks before committing to Tauri or integrating
the production customer flow: packaged JVM lifecycle, x64 Canon runtime/device,
installed Windows/DNP spooler route, IPC/Live View performance, crash recovery,
license feasibility and V2 isolation.

### Work packages

| WP | Deliverable | Primary owner | Evidence required |
|---|---|---|---|
| 2.1 | Canonical v1 schemas, TS/Kotlin generation plan, golden fixtures, stable error registry | Architect | Schema review + cross-language fixture tests |
| 2.2 | Minimal Kotlin sidecar and bundled runtime image | Backend/Release | Compiled POC; works with no ambient Java |
| 2.3 | Tauri packaged lifecycle and framed stdio bridge | Shell Engineer | Installed x64 MSI tests; normal/forced cleanup |
| 2.4 | JPEG latest-frame private transport and backpressure | Shell + Camera | 30-minute generated-stream performance report |
| 2.5 | Canon x64 DLL initialization and actual camera lifecycle | Camera Engineer | Packaged native-load plus authorized named-device report |
| 2.6 | Exact Windows printer enumeration and DNP spooler path | Printer Engineer | Packaged enumeration plus authorized physical-path evidence |
| 2.7 | Crash/restart and durable idempotency boundary POC | Backend + Shell | Fault-injection report; no replay/duplicate fake side effect |
| 2.8 | License/provenance disposition | License Owner | Canon, edsdk4j/custom class, ONNX weights, FFmpeg, dependencies |
| 2.9 | Installer identity/path coexistence proof | Release + Security | Clean-VM manifest, V2 roots, V1 coexistence/untouched evidence |
| 2.10 | Independent gate review and shell ADR | Tester + Architect | Criterion table and Tauri/Electron verdict |

The repository may contain earlier bridge/simulator/hardware-port claims. Phase 2
does not inherit a pass from filenames or self-reported summaries: the reviewer
classifies reusable evidence against `TAURI_FEASIBILITY.md`, reruns what is needed
from exact artifacts, and leaves unmet packaged/actual-device criteria open.

### Phase 2 pass gate

All are mandatory:

- packaged sidecar starts, handshakes, responds, shuts down and leaves no orphan;
- release package uses a bundled compatible x64 JVM and approved deterministic
  native lookup;
- actual supported Canon camera completes discovery, Live View, authorized
  capture/host transfer, disconnect/reconnect and cleanup;
- installed DNP queue is enumerated exactly through the intended path and the
  spooler/driver route is feasible; authorized physical evidence is required
  before claiming correct DNP output/cut;
- control p99 <=50 ms in the defined POC and Live View meets accepted fps,
  bounded-memory and unsubscribe criteria;
- sidecar crash is detected/recovered without automatic mutation replay;
- V2 installer/paths/identity are independent of V1;
- legal disposition permits the chosen deployment, or a concrete approved
  deployment prerequisite/alternative is recorded;
- one shell is selected by ADR after independent review.

### Phase 2 fail/block response

| Blocker | Recommended response |
|---|---|
| Tauri-specific lifecycle/IPC/package failure | Run bounded remediation, then Electron host against same backend/contracts |
| Canon fails standalone JVM and shell package | Fix adapter/runtime or evaluate vendor-supported native helper; do not blame shell |
| Canon redistribution denied | Obtain approved operator-installed runtime arrangement or explicitly scope an alternative camera mode; no unlicensed bundling |
| Java Print Service cannot express required DNP behavior | Evaluate supported DNP driver/API/vendor bridge; preserve compositor contract |
| DNP hardware unavailable | Gate remains blocked; mock/PDF queue cannot close it |
| Live View JPEG transport misses target | Measure shared-buffer spike; do not redesign control IPC prematurely |
| Model provenance unresolved | Beauty distribution stays blocked; no algorithm/model substitution without approval |

### Exit artifact

A `GO`, `GO WITH EXPLICIT CONDITIONS`, or `NO-GO` report. `GO WITH CONDITIONS`
cannot waive Canon/spooler feasibility; it may cover only non-critical release
follow-ups with owners and dates.

## 4. Phase 3 — Touchscreen design system and contract-driven mock UI

### Entry

- Phase 2 shell selection may still be pending for early design-system work, but
  renderer-to-shell abstractions and canonical contract v1 are frozen enough to
  avoid shell coupling.
- No screen may pretend mock hardware/payment is real.

### Work packages

| WP | Deliverable | Owner | Evidence |
|---|---|---|---|
| 3.1 | 16:10 touch tokens, typography, controls, reduced-motion/contrast policy | UI Designer | Token spec + accessibility review |
| 3.2 | State/screen map for all 17 contract states and connection overlays | Designer + Architect | Trace to audited transitions; unused-state treatment explicit |
| 3.3 | React screen shell and reusable touch components | Frontend Lead | Component tests and production build |
| 3.4 | Contract-backed simulator fixtures for customer path | Frontend + Backend | Schema-valid fixture suite; explicit simulator badge/mode |
| 3.5 | Live View viewer lifecycle (subscribe/drop/unsubscribe/reconnect) using generated stream | Frontend + Shell | Leak/backpressure/browser-object-URL tests |
| 3.6 | Admin/studio diagnostics and sanitized settings views | Frontend + Security | No secret values/paths exposed; capability matrix |
| 3.7 | Touch and visual validation | QA UI | 1920x1200 plus supported fallback resolutions, touch-only run |

### Preserve in mock flows

- observed main path, back mapping and cancellation restriction;
- layout-driven photo and selection counts/countdown, never production constants;
- inactivity outcomes and `userConfirmed=false` semantics;
- repeated-tap idempotency behavior represented in fixtures;
- separate camera absent, printer absent, network failure, sidecar lost/recovered,
  processing fallback and outcome-unknown states;
- no fake `COMPLETED` physical print status.

### Phase 3 pass gate

- every customer/admin state required for integration has a reviewed screen or
  explicit non-screen overlay policy;
- customer path works touch-only at target 16:10 with no mouse/keyboard;
- generated Live View can run for 30 minutes without renderer leak and tears down
  on navigation;
- all simulator payloads validate against canonical schemas;
- accessibility targets, reduced motion, repeated tap and connection recovery are
  independently tested;
- no frontend secret/hardware/business authority exists.

**Not evidence of:** Canon, DNP, live PayOS, Neon or Cloudinary operation.

## 5. Phase 4 — Backend parity port and adapter integration

### Entry

Phase 2 is `GO`; shell/IPC v1 is selected; reuse/license manifests identify what
may be copied. Full production adapters remain disabled by default in ordinary
tests.

### Work sequence

| Order | Work package | Owner | Required evidence |
|---:|---|---|---|
| 1 | Session authority, transition guards preserving observed routes, timers and generation/revision checks | Backend Lead | State matrix/virtual-time tests |
| 2 | V2 path/config/secret stores and atomic operation journal | Backend + Security | Crash/corruption/idempotency tests |
| 3 | Layout/pricing snapshot and quantity rules | Backend | V1 characterization fixtures |
| 4 | Camera ports; approved Canon code adaptation; Hot Folder backup/stability; explicit fallbacks | Camera Engineer | Unit/simulator plus Phase 2 hardware regression |
| 5 | Capture save pipeline: immutable source, effect/LUT, mirror, original | Imaging Engineer | Pixel/order fixture comparison |
| 6 | Designated YuNet/BiSeNet/Beauty copy after source/model manifest approval, with 15 s aggregate wait cap/fallback | Imaging Engineer | Frozen model/hash and output/timeout tests |
| 7 | Selection/frame/compositor/QR and print-ready geometry | Imaging + Printer | Golden pixel/dimension fixtures |
| 8 | Exact printer binding, prepare/submit/status/cancel/idempotency | Printer Engineer | Fake spooler + authorized hardware regression |
| 9 | PayOS create/verify/poll and authenticated cash path | Integrations | Sandbox/recorded contract tests; no production money |
| 10 | SQLite revenue gate, Neon/API sync | Integrations | Fault/idempotency tests; no live Neon writes by default |
| 11 | Cloudinary/Web Album ordered finalize, delivery and deferred sync | Integrations | Mock/sandbox tests and retry ordering |
| 12 | Video/FFmpeg bounded process lifecycle | Imaging/Backend | Timeout/tree-kill and output characterization |
| 13 | Admin catalog/layout/frame/LUT/settings/diagnostics | Backend + Frontend | Authorization, validation and parity tests |

### Critical behavioral gates

- Backend alone transitions sessions, commands Canon, determines payment, submits
  jobs, writes the ledger/Neon and owns files.
- Duplicate payment and Confirm/Print requests return the first durable operation
  or `IDEMPOTENCY_CONFLICT`; uncertain print is never auto-retried.
- V1 aggregate Beauty wait remains bounded at 15 seconds before selection;
  originals are retained and unfinished/failed derivatives fall back cleanly.
- Effect/LUT then mirror then canonical original then optional Beauty derivative
  is preserved unless an approved parity change says otherwise.
- Printer status distinguishes accepted from physical completion/unknown.
- Revenue is recognized only for the audited user-confirmed, accepted, same-
  session condition; timeout auto-print, dry-run and unknown outcome do not earn
  revenue.

### Phase 4 pass gate

- all critical parity rows have implementation plus tests and no unexplained
  algorithm/geometry change;
- complete offline/sandbox end-to-end flow works over packaged IPC;
- Canon and printer Phase 2 tests rerun after integration without regression;
- fault injection covers crash at payment, capture save, Beauty, compose, spool
  submission, ledger and upload boundaries;
- production network/write/print switches remain deny-by-default;
- independent security/contract/parity review passes.

## 6. Phase 5 — System, disaster and kiosk validation

### Entry

Feature-complete release candidate with all production adapters implemented,
license-approved resources available, and a lab authorization plan.

### Test campaigns

| Campaign | Owner | Evidence |
|---|---|---|
| Contract compatibility and malformed-input/fuzz limits | QA Contract | Generated-type/golden/fuzz report |
| State, pricing, timeout and repeated-tap regression | QA Parity | Full transition/business matrix |
| Long-run Canon capture/live-view/reconnect | Camera + QA Hardware | Named camera/firmware, counts and latencies |
| DNP geometry, copies, cut, status and unplug/error | Printer + QA Hardware | Named queue/driver/media and physical output measurements |
| Beauty/LUT/compositor golden comparison | Imaging + QA | Approved fixtures/hashes; no customer archive |
| Sidecar/native/FFmpeg crash and power-loss recovery | Backend/Shell + QA | Journal/reconciliation results; no duplicate effects |
| Network loss, PayOS sandbox, deferred Neon/upload | Integrations + QA | Sandbox/fault-proxy evidence |
| V1/V2 coexistence and resource contention | Release + QA | Separate path identities; camera busy surfaced safely |
| 16:10 mounted touchscreen/kiosk soak | UI/Frontend + QA | Touch targets, scaling, heat/memory, navigation lock |
| Security and privacy | Security | Secret scan, CSP/capabilities, ACL, log/media retention review |

### Required disaster outcomes

- **Sidecar exits:** connection lost, stream cleared, bounded restart, snapshot
  recovery, no mutation replay.
- **Printer unplugged:** pre-submit failure or post-boundary unknown; never an
  automatic duplicate.
- **Camera unavailable:** explicit degraded/out-of-service presentation and
  serialized reconnect; no silent simulator substitution.
- **Hot Folder stalls:** bounded stable-file timeout, source safety, operator
  recovery.
- **Power loss:** atomic state/journal recovery and payment/print reconciliation.
- **Network/payment failure:** pending/failure remains authoritative; cloud work
  queues only when eligible; no unapproved free progression.
- **Repeated tap:** one logical payment/print operation.
- **V1 concurrently running:** all storage remains isolated and contested hardware
  reports external busy rather than takeover. This scenario uses authorized
  installed releases on a disposable/lab machine; it never executes the V1 source
  workspace or mutates V1 Git/config/customer data.

### Phase 5 pass gate

- all P0/P1 defects closed; accepted lower risks have owners and release notes;
- hardware soak/repeat counts meet the QA plan with no crash, orphan or duplicate;
- physical print output and cut/copy semantics are approved;
- recovery matrix passes, including forced termination and power-loss rehearsal;
- target touchscreen/kiosk and performance budgets pass;
- no test uses production financial/cloud writes except separately authorized
  final certification;
- Tester-Reviewer issues an independent release-candidate verdict.

## 7. Phase 6 — Distribution, pilot and production readiness

### Entry

Phase 5 passes; commercial distribution rights and code-signing/update
infrastructure are resolved.

### Work packages

| WP | Deliverable | Owner | Evidence |
|---|---|---|---|
| 6.1 | Reproducible signed installer with bundled JRE and approved manifest | Release | Hash/SBOM/signature/reproducibility report |
| 6.2 | Clean install, standard-user first run and prerequisites | Release + QA | Clean-VM matrix, WebView2/driver/SDK checks |
| 6.3 | Upgrade, rollback, repair, uninstall and data retention/purge | Release + QA | N-1→N→N-1 rehearsal and backups |
| 6.4 | Signed update channel with staged rollout and compatibility checks | Release + Security | Signature/tamper/offline/interruption tests |
| 6.5 | Operations guide, diagnostics export, retention and incident runbook | Backend/Support | Operator dry run; sanitized support bundle |
| 6.6 | Limited pilot on one named booth | Product + Lab Operator | Pilot checklist, monitoring and rollback readiness |
| 6.7 | Final legal/security/release signoff | Legal + Security + Architect | Signed release manifest and residual-risk record |

### Installer smoke gate

The installed release must verify before kiosk enablement:

- new V2 product/upgrade identity and single-instance mutex;
- bundled x64 JVM and backend protocol compatibility;
- approved Canon runtime presence/loadability without exposing paths to UI;
- exact configured printer and driver prerequisites (enumeration only during
  smoke—never surprise-print);
- model/resource hashes and license notices;
- all V2 writable roots and ACLs; no V1 root selected;
- config validity and secret configured/not-configured flags without values;
- network dependencies reported without blocking offline diagnostics;
- clean shutdown and no orphan process.

### Rollback/update policy

- Shell, frontend, backend, runtime, schemas and native/model resources ship as
  one versioned release unit; no independent backend hot patch.
- Update verifies signature, disk space, compatible config/state schema and idle
  session before install. Never update during payment/capture/print.
- Back up V2 config/state before upgrade using versioned, integrity-checked files.
- Prefer backward-compatible additive state/schema changes; a destructive
  migration requires a separate approved plan. There is no V1 migration.
- Keep the last known-good signed installer and documented operator rollback.
  Rollback must not reuse V1 or delete captures/ledger silently.
- Staged rollout begins with one pilot booth; automatic expansion stops on crash,
  camera, printer, payment or ledger health thresholds.

### Phase 6 production gate

- signed artifact/SBOM/license manifest exactly match tested bits;
- clean install, update, interrupted update, rollback and uninstall pass;
- Canon, DNP and touchscreen smoke pass on the pilot booth after installation;
- backups, monitoring, redacted logs, diagnostics and incident rollback are
  exercised by the operator;
- no unresolved redistribution, secret, production payment, data retention or
  physical safety blocker;
- Product, Architect, Tester, Release, Security and Legal approve deployment.

## 8. Cross-phase traceability matrix

| Required concern | Phase first proved | Later regression owner |
|---|---:|---|
| Packaged sidecar start/stop/JRE | 2 | Release + QA each RC |
| Canon DLL x64 and real camera | 2 | Camera + QA in 4/5/6 |
| DNP enumeration/spooler | 2 | Printer + QA in 4/5/6 |
| IPC latency/crash recovery | 2 | Shell + Performance QA |
| Typed schema coverage | 2 | Architect + Contract QA every phase |
| Touch-first mock UI | 3 | Frontend/UI QA |
| State/image/Beauty/business parity | 4 | Parity QA |
| Disaster behavior | 5 | System QA |
| Installer/update/rollback | 6 | Release QA |

## 9. Phase report template

Every phase verdict must include:

```text
Phase / release candidate:
Artifact hashes and versions:
Changed V2 files:
Evidence classes used:
Pass/fail table by criterion:
Tests run and environment:
Actual devices/drivers used (or NOT RUN):
Production calls/writes/prints performed (authorization reference):
V1 isolation statement and method:
Known gaps/blockers:
Recommended alternatives:
Independent reviewer:
Verdict: GO | GO WITH CONDITIONS | NO-GO
```

## 10. Current planning verdict

Architecture/contracts and simulator work are authorized. Tauri is only the
candidate shell. Full real UI/backend integration and production release remain
**NO-GO** until the Phase 2 Canon and Windows spooler feasibility criteria have
actual evidence. Existing mocks, compiled simulators, or source audits cannot
close those gates.
