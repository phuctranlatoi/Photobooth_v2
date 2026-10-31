# PROGRESS.md

## Superseding baseline migration status (2026-11-01)

- **Milestones 1–6: COMPLETED/VERIFIED for the baseline migration and integration scope.** This means the audited baseline, bridge/simulator, touchscreen UI migration, feature-integration surfaces, and automated regression baseline are present and green; it is not physical-hardware or production release approval.
- Frontend: **PASS-AUTOMATED — 7/7 files, 29/29 tests**, plus successful TypeScript/Vite production build (2,014 modules).
- Backend: **PASS-AUTOMATED — 12/12 suites, 42/42 tests**, zero failures/errors/skips on a fresh forced offline run. `timeoutAutoPrintNoSaleAndCancelMatrix` passed, confirming the timeout fixture-isolation correction.
- Migrated baseline inventory: **11 customer screens**, **6 operator tabs**, and Tools/Settings surfaces.
- **Zero current automated test regressions.** Older red results below are historical and superseded by this fresh run.
- **Release remains BLOCKED** pending explicit authorization and safe setup for real Canon DSLR and DNP printer verification, plus physical touchscreen, installer/recovery, production integration, and license/redistribution gates.

## Superseding gatekeeper status (2026-10-31 23:26 local)

- Backend retained JUnit XML is green: **12/12 suites, 42/42 tests, 0 failures/errors/skips**. This resolves the retained-result failure for `timeoutAutoPrintNoSaleAndCancelMatrix`; Gradle was not rerun in this check.
- Frontend production build is green, but fresh `npm test` is **red: 27/28**, with the unacknowledged Settings save/registered Admin exit test returning `true` instead of `false` (`frontend/src/V1Settings.test.tsx:14`).
- Consequently, Milestones 5/6 core functional regression cannot truthfully be marked 100% green. Customer/operator implementation presence is recorded, but release acceptance remains blocked by the frontend regression and non-automated gates.
- Read-only V1 Git status is not clean (two modified and two untracked files under `.opencode/agents/`). Their provenance is unknown; no V1 write was performed by this reviewer, but strict untouched status is **NOT VERIFIED**.
- **Current gate: FAIL / BLOCKED.** Next: fix or explain the Settings exit contract without weakening the assertion, rerun 28/28 and build, then perform authorized DSLR/DNP, physical 16:10 touch, installer/recovery, and licensing verification.

## Independent regression and parity review (2026-10-31 23:01 local)

- Fresh V2 frontend `npm test`: **PASS-AUTOMATED — 7/7 files, 28/28 tests**, exit 0, 6.35 s.
- Fresh V2 backend forced offline Gradle test: **FAIL — 42 tests, 1 failure**, exit 1, 2m04s. `SimulatorSessionTest.timeoutAutoPrintNoSaleAndCancelMatrix` expected `DELIVERY` but remained `SELECTING_PHOTOS` (`SimulatorSessionTest.kt:69`; XML under `backend/build/test-results/test/`).
- Reviewed `frontend/src/screens/`: 13 implementation components and one test file. Baseline screen rendering/action gating is bounded **PASS-SIMULATED**; exhaustive state, mounted 16:10, physical touch, camera, printer, QR and provider parity remain unverified.
- Reviewed all six operator tabs exposed by `Operator.tsx`: Frames, Layouts, Settings, Tools, Colors and Revenue. Presence/bounded unit behavior passes, but Frames/Tools/Colors are local drafts, Revenue is disconnected, and layout deletion/pricing are unavailable; production V1 operator parity is incomplete.
- V1 was not accessed or modified by this rerun. Exact forensic “unchanged” verification is **BLOCKED / NOT VERIFIED** because no accepted before/after V1 manifest was available; no V1 shell command was used.
- **Overall gate: FAIL / BLOCKED.** Resolve the backend timeout fixture defect, rerun the targeted and complete forced suites, then perform mounted touchscreen and authorized hardware/provider validation separately.

## Current agent/test milestone status (2026-10-31)

- Reported actual results: frontend **20 tests / 6 files passed; build passed**. Backend **42 tests, 1 failure**. Keep these as reported run results; no rerun was performed for this note.
- Three implementation attempts remain **BLOCKED** on the absent independently verified checkpoint. No app edits are authorized by this status update.
- Master audit's **17-state enumeration correction and acceptance remain unresolved**. The earlier “accepted Beauty” claim was rejected; do not repeat it as established fact.
- Next task is to obtain an actual V2 source snapshot and verify its manifest/hash before any source-copy or implementation proposal. Do not substitute a speculative inventory or HEAD-only state for that evidence.
- These reports do not establish V1 forensic integrity or untouched status; no independent V1 verification is claimed.

## Coordination checkpoint and next-task update (2026-10-31)

- **Current reported test evidence:** frontend reports 20 tests / 6 files passing and build passing. Backend reports 42 tests with one failure; diagnosis is shared settings fixture/state across six engines. Approved test-only remedy is six isolated engine fixtures plus the offline harness; keep the shared-settings persistence/integration coverage rather than deleting it. These are current reports, not independently reproduced in this documentation task.
- **Checkpoint:** an initial checkpoint claim was **REJECTED** because it was HEAD-only and the proposed conditional archive included stale tests. Architect correction is **in progress**. Backend conditional implementation attempt is **BLOCKED**: no verified backup manifest exists. Therefore no checkpoint is accepted and no app edits are authorized yet.
- **Audit:** auditor produced four documents, but independent review **REJECTED** unsupported claims about accepted Beauty, unreliable Tools taxonomy, and omitted config coverage. Auditor is correcting. Specialist source-linked docs remain accepted only as source inventories, not as complete audit or implementation proof.
- **Next order:** finish and independently verify a recoverable V2 checkpoint first; then resolve the test fixture isolation failure while retaining integration checks; only after checkpoint verification may bounded actual slices proceed. Frontend/camera implementation remains conditional on a verified snapshot; do not promise or launch background work after session end.
- No complete migration or full audit is claimed. V1 forensic untouched status remains **NOT VERIFIED**. Models/tools were unavailable for this update; no shell or tests were run.

## Migration coordination update (2026-10-31)

- This is a documentation-only coordination snapshot. Do not interpret agent status as a completed milestone, full audit, checkpoint approval, or hardware proof.
- Reported agent activity: legacy-auditor `ses_e70a11911ffeZ8XCL7SqnXDk7b` inventory; architect `ses_e709d20e1ffewRrzeoisMXvDQ9` checkpoint pending; camera `ses_e709cf659ffePXgtKXyGcPQnQG` audit complete; printer audit complete; UI `ses_e709bb9fbffeESyRONVXSFWre1` source comparison complete; tester `ses_e709ba21effeLwcg8O494bXq3n` static review complete; backend `ses_e709b7eccffeDobwsekw4JVqZj` audit complete; frontend `ses_e7098a611ffelkffCXMgKv6Z5i` preparing slice. Statuses are supplied reports, not independently verified here.
- Current records to consult: `docs/CAMERA_BASELINE_INVENTORY.md`, `docs/PRINTER_BASELINE_INVENTORY.md`, `docs/UI_BASELINE_COMPARISON.md`, `docs/MIGRATION_TEST_RESULTS.md`. Baseline sources are findings, not completed implementation or parity certification.
- User authorized scoped V2-only shell checkpoint/offline tests/builds; all temporary/cache/output paths must remain in V2. This authorization does not extend to V1 execution, production integrations, hardware/device operations, or physical printing. No command was run for this documentation update.
- Architect checkpoint remains pending. Do not claim checkpoint complete or audit phase complete. V1 untouched forensic verification is **NOT VERIFIED**; only participating agents' reports describe read-only activity. No independent forensic check was performed in this update.
- Existing V2 source is to be preserved in this baseline phase; no redesign is authorized by baseline findings. All product, hardware, licensing, and parity gates remain subject to their existing evidence requirements.

## V1 Settings parity reviewer preparation (2026-10-30)

- Actual read-only V1 Settings UI/config/controller sources were inspected; prior audit prose was not used as authority. Exact matrix: `tests/v1-settings-parity/v1-source-matrix.json`.
- Attach-only mounted test preparation exists at `tests/v1-settings-parity/mounted-settings-parity.mjs` for 1280×800 and 1920×1200. Execution is intentionally deferred until active frontend/backend owners notify final; no concurrent Gradle/CDP was started.
- Current source verdict is **FAIL/BLOCKED** for settings parity: `frontend/src/Operator.tsx` exposes disabled Settings placeholders and no settings mutation contract. Layout countdown editing is not selection/frame/post-capture timeout parity.
- Result ledger: `docs/V1_SETTINGS_TEST_RESULTS.md`. No V1 launch/command/write, secret read, customer photo access, hardware, print, payment, DB, upload, or production side effect occurred.
- Early backend source now contains `operator.getSettings`/`operator.updateSettings`, exact six-field schema v1, atomic V2-local persistence, `NEXT_SESSION`, `PENDING_DISABLED`, false production gates, local opt-in and IDLE update gating. Independent snapshot/engine execution remains deferred until owner final evidence; no Gradle/CDP run was started.
- Timer source nuance corrected: photo/frame remaining budgets can survive navigation; interaction reset restarts only the current state's configured budget. PRINT_PENDING retains an existing inactivity job/budget and uses post-capture only when starting a fresh fallback timer. No test will claim post-capture delays capture or invariably governs PRINT_PENDING.
- Current source review confirms V2 safe-path/symlink checks, 16 KiB load bound, temporary-file force and same-directory atomic replace. Parent-directory fsync is absent, so no fully durable power-loss claim is accepted.
- **HIGH pending owner fix:** before first persistence, Settings displays store defaults 90/90/60 while engine behavior can still use the 30-second legacy fixture; the UI ignores the response's effective source/timeouts. This is a false effective-parity risk. No default “39 suite” or other historical result is treated as a current run.
- Admin Back now calls the registered Settings save path (`Operator.tsx:10-11,16`), matching V1 implicit Back-save intent; this remains source-only and unexecuted. Native conditional Canon controls remain intentionally non-persisted/disabled, not falsely claimed as the six-field contract.
- **Independent backend rerun PASS-AUTOMATED:** V2-local Gradle `test --rerun-tasks` exit 0 / BUILD SUCCESSFUL; XML aggregate **12 suites / 42 tests / 0 failures, errors or skips**. This run also executed `installDist`. Evidence: `tests/v1-settings-parity/backend-test-rerun.log`, `backend-test-rerun.err.log`, `backend-test-summary.txt`.
- **Actual mounted Settings FAIL:** with existing port-1420 Vite left untouched, free CDP 9223, current debug Tauri, explicit local operator opt-in, and real visible UI at both 1280×800 and 1920×1200, Settings never loaded. It displayed `Chưa cung cấp`; controls and Save remained disabled. Evidence: `tests/v1-settings-parity/evidence/2026-10-30T16-32-11.450Z/`. No RPC bypass, setting mutation, hardware/provider action, or V1 command occurred.
- Because mounted load failed, six-field edit/step/save/reload/restart, implicit Back-save, byte-identical restoration, timer behavior and subsequent customer-flow regression are **not passed**. The run created no `backend/config/operator-settings.json`, so there was no changed configuration to restore.
- **Superseding StrictMode-fixed mounted rerun:** actual Settings now loads at both 1280×800 and 1920×1200 and honestly displays effective legacy fixture 30/30/30 separately from desired 90/60/90. Evidence: `tests/v1-settings-parity/evidence/2026-10-30T16-36-26.432Z/`.
- Current mounted gate still **FAILS**: enabled print switch hit target is only **13×13 CSS px** at both sizes (required 48×48). Step controls are 52×64, path input 56 high, Save/Reload 64 high, and no document horizontal overflow was observed.
- The stale reviewer-owned host from the prior run was identified by exact V2 executable path/PID and closed gracefully; host exited, matching JVM count became 0, and CDP 9223 became free. The current rerun also finished with `cdpFree=True`, zero owned hosts and zero matching JVMs. Existing Vite/node on 1420 was never killed.
- Full visible six-field edit/10-step/save/reload/implicit-Back/restart/byte-restore and customer-flow regression remain **NOT-RUN**, not PASS: the current harness stops at the concrete touch failure and is not yet a complete mutation harness.
- **Superseding independent mounted results:** discovery `tests/v1-settings-parity/evidence/2026-10-30T16-43-21.230Z/results.json` PASS-SIMULATED at both sizes; visible mutation `frontend/simulator-evidence/settings-mutation/2026-10-30T16-43-22.840Z/results.json` exit 0; separate native restart rerun `2026-10-30T16-43-31.743Z/results.json` exit 0. Save acknowledgement, Reload, implicit Back-save and restart persistence passed.
- Default-denied mounted run returned backend `-32010`, displayed denial and kept Save disabled (`tests/v1-settings-parity/default-denied.log`). No hardware/provider operation occurred.
- Both `backend/config/operator-settings.json` and `local-operator-layouts.json` were restored byte-identically; hashes recorded in `tests/v1-settings-parity/restore-results.json`. Final cleanup: CDP 9223 free, zero owned native hosts, zero matching JVMs; Vite 1420 was untouched.
- Post-restore existing full simulator harness exit 0 in default-denied mode (`tests/v1-settings-parity/full-simulator-after-restore.log`), covering two-size customer flow, preview/reload and child exit. Backend remains the earlier independent **12 suites / 42 tests / 0 failures/errors/skips**; it was not redundantly rerun.
- Scope caveat: owner mutation harness does not change post-capture timeout or path value; it only redispatches the existing safe V2 path. Component/backend tests cover the exact six-field payload, but changed path/post mounted behavior remains unproven. Settings gate is bounded PASS-SIMULATED, not exhaustive V1 or product parity.
- **Gap-completion preflight BLOCKED by unowned runtime:** exact debug native PID 5616 is active and its WebView child PID 41392 owns CDP 9223. It shares the settings/layout files required by the proposed mutation-and-restore run. Reviewer did not kill/close/attach/resize/navigate the unowned instance and did not launch a competing writable backend. Current hashes remain `596EE...815DC` (settings) and `9D808...53870` (layouts). Post-timeout/path mutation and fresh two-size top/bottom/default-Khung screenshots remain BLOCKED until the operator closes that app and 9223 is free.

## Parity migration reviewer checkpoint (2026-10-30)

- **FINAL revenue-recognition rerun:** V2-local-cache Gradle `test --rerun-tasks` exit 0 / BUILD SUCCESSFUL; independently aggregated **11 suites / 39 tests / 0 failures, errors, or skips**. Evidence: `tests/parity-migration/logs/backend-revenue-final.log`, `backend-revenue-final-summary.txt`. Owner `test installDist` log: `backend/revenue-recognition-tests.log` (reported abbreviated SHA prefix `5A792...`; not independently treated as a complete hash).
- Offline source gate requires manual confirmation, non-dry-run, exactly `PrintResult.Submitted`, and one nonblank sale ID equal to active/confirmation/print IDs. Dry-run, uncertain/rejected/denied, stale/missing IDs cannot call the sink. Shared-journal duplicate calls return recorded/reconciliation status; false/timeout/exception makes one sink attempt and requires reconciliation without auto-retry.
- The stronger multi-ID condition is a safety adaptation requiring architecture/business signoff, **not exact V1 parity** and not permission for a hidden production business barrier. The implementation remains unwired to session/printer/revenue IPC. Its journal is in-memory/process-local, not restart-safe or cross-process; remote commit atomicity, durable reconciliation and backend locking remain missing. `Submitted` is not physical print completion.
- Separate designer review narrowly approved six fresh PNGs; minor staff-panel horizontal scrolling is recorded as nonblocking polish debt. This does not establish exhaustive visual/Admin parity or physical touchscreen/DPI approval.
- Overall release remains **BLOCKED** despite 39-test and mounted-UI bounded passes.

- **FINAL independent frontend rerun:** tests exit 0 (5 files / 15), build exit 0, and actual mounted `frontend/verify-simulator.mjs` exit 0 at both 1280×800 and 1920×1200. Positive modal/image/close, setup Back, staff-panel, frame CTA, direct Start, two layouts, reload, full dry-run delivery/reset, five-tap operator tabs, host exit 0 and JVM PID 39136 termination all passed. Logs: `tests/parity-migration/logs/frontend-npm-test-final.log`, `frontend-npm-build-final.log`, `frontend-mounted-final.log`; fresh PNGs: `frontend/simulator-evidence/`. This supersedes the prior zero-height mounted failure. Fresh-PNG designer review is separate; this is not physical touch/DPI or full subjective signoff.
- **FINAL independent backend rerun:** V2-local cache/temp Gradle `test --rerun-tasks` exit 0 / BUILD SUCCESSFUL; XML aggregation **35 tests, 0 failures/errors/skips** (10 suites, including 8 integration tests). Evidence: `tests/parity-migration/logs/backend-test-final.log`, `backend-test-final-summary.txt`. The owner evidence `backend/api-migration-tests.log` remains separately documented with SHA256 `F5DA84A9A2AEB7FDC65758B619A55A4727FFDCEBDAEC5D354F08E9455D32F693`.
- API verdict remains narrow: real local 127.0.0.1 transport/serialization, redirect refusal, timeouts, stalled-body and response bounds are tested; provider outcomes are fixtures. Clients remain unwired to session/IPC, PayOS SDK compatibility is BLOCKED, revenue/print same-ID idempotency is absent, Firebase/layout sync is missing, and deployed server compatibility/live providers are unverified. Intentional default/PRODUCTION denial and no direct Neon DDL are preserved.
- **Overall product release remains BLOCKED** despite these bounded passes: exhaustive V1/Admin/API parity, real hardware, production services, installer, licensing, physical touchscreen/DPI and full visual signoff remain unresolved.

- **Current frontend result:** `npm test -- --reporter=dot` exit 0 (5 files / 15 tests) and `npm run build` exit 0. These are the current final frontend unit/build runs; older 24/27 backend counts below are historical, not the current final backend suite. Logs: `tests/parity-migration/logs/frontend-npm-test-current.log`, `frontend-npm-build-current.log`.
- **Current mounted result: FAIL.** Port 9223 was free and the actual Tauri WebView/Kotlin simulator launched. At 1280×800, direct Welcome Start→SELECTING, setup Back bounds, payment hold-panel reveal-without-auto-approval, separate approval, capture, and selection were reached. Full-screen original then failed the harness assertion: mounted image had width 1190.4 but height 0 at y=715.2. The run exited 1 before 1920×1200, frame/CTA/reload/full-flow, five-tap operator, and PID-close assertions. Evidence: `tests/parity-migration/logs/frontend-mounted-current.log`; partial current PNGs: `frontend/simulator-evidence/`.
- The previous interrupted runs are not PASS. The older bounded designer PNG approval remains only bounded historical visual feedback and does not override this current failure or constitute full product visual signoff.
- Backend engineer remains active; no concurrent Gradle/install mutation was run. Independent four-client/API suite remains pending backend completion. No production, hardware, V1 command, secret, photo, DDL, or outward-provider operation occurred.

- Corrected source authorities added: `V1_EXACT_UI_FLOW_MAP.md`, `V1_ACTION_BEHAVIOR_MATRIX.md`, and `PARITY_MIGRATION_REVIEW.md`. The original broad auditor inventory is explicitly unreliable where contradictory.
- Verified from read-only V1 source: cancellation only in SELECTING_PHOTOS/EDITING; photo confirmation enters EDITING/Frame; each capture returns LIVE_VIEW until the configured loop ends at SELECTING_PHOTOS; inactivity auto-prints with `userConfirmed=false`; revenue requires manual confirmation, accepted driver call, and matching session ID.
- Superseding integration update: four backend-only clients now exist (`SafeTransport`, `PayOsClient`, shared Revenue/Album clients, Cloudinary). Source review confirms default DENY, intentional PRODUCTION denial, redirect-off loopback fixture transport, shared-API money strings, no direct Neon/DDL, no frontend HTTP/secrets/token wiring, and no raw body/credential logs. They are **client implemented, not session-wired**.
- PayOS uses a hand-built HMAC whose exact compatibility with V1's SDK is unverified and BLOCKED. Backend was asked to preserve denial before key calculation and add malformed/null normalization coverage. Full Gradle/fixture execution is deferred until the active backend agent finishes; no concurrent Gradle was started.
- Printer adapter is standalone AWT with typed Submitted/Uncertain, not a native-DLL path, not session-wired, and not physical-print proof. Canon remains a default-denied reflection-only partial port.
- Superseded: a current mounted UI run was performed; it failed at the 1280×800 full-screen original preview as recorded above. Prior independent 27-test and two-size mounted results remain historical evidence only.
- No outward HTTP, production/network/hardware operation, secret/DDL access, or V1 command/build/write occurred. Overall release gate remains **BLOCKED**.

## Independent status (2026-10-30)

- **Overall gate: FAIL / BLOCKED.** Task1 bridge and Task2 simulator are independently verified narrowly; no hardware validation, packaging or installer proof.
- Initial docs `01`, `02`, `03`, `09` are unreliable as implementation authorities; see `AUDIT_CORRECTIONS.md`.
- The consolidated baseline is `FEATURE_PARITY_MATRIX.md`, informed by specialist docs `04`–`08` and `UI_SCREEN_CONTRACTS.md`.
- Inactivity auto-print is confirmed at V1 controller lines 291–310; contrary claims are rejected.
- Independent V2 command `backend/test-foundation.ps1` completed exit 0: 5 tests, 0 failures/errors/skips. Scope is layout/pricing/unrestricted legacy state/simulator authorization only.
- **Backend test suite now 24 tests**, independent V2 script exit 0/XML 24 tests, 0 failures/errors/skips (incremental); prior 22-test `--rerun-tasks` exit 0. New Hot Folder tests are synthetic only, not hardware evidence.
- Task2 mounted React two-layout simulator passed at emulated 1280×800 and 1920×1200; this is not physical touch. Canon, webcam, Hot Folder runtime, DNP, PayOS, Neon, Cloudinary, Beauty model, physical touchscreen and installer remain unverified.
- **Gradle 8.14.3 publisher checksum retrieved over HTTPS and exactly matches local ZIP** (SHA-256: BD71102213493060956EC229D946BEEE57158DBD89D0E62B91BCA0FA2C5F3531). Signature/transitive dependency provenance remains a separate broader supply-chain concern.
- **Desktop bridge independent review PASS-SIMULATED (narrow Task 1):** `docs/DESKTOP_BRIDGE_INDEPENDENT_REVIEW.md` — CDP harness exercised **actual mounted React DOM → Tauri `health_check` → installed Kotlin/JVM (PID 17520, JVM 21.0.12, protocol 1, simulator true, uptime 639 ms)**. Process ancestry verified: `java.exe` (17520) → `cmd.exe` (34580) → host (24068). Native `CloseMainWindow()` returned **True**, host exited **0**, JVM PID 17520 **terminated**. Full output: `tests/desktop-bridge/results/independent-cdp-health-close.log`.
- **Live WebView invoke + normal-close child cleanup RESOLVED for exact tested scenario** (CDP harness, not UIA). Abrupt parent kill / hung child / `taskkill /T` fallback **NOT TESTED**.
- **Task2 narrow PASS-SIMULATED:** independent framed JVM two-layout files/idempotency/cancel/timeout/stale tests and mounted React WebView two-layout/reload/delivery/reset/close test passed. See `SIMULATOR_INDEPENDENT_REVIEW.md`.
- **Task3 partial only:** disabled camera/printer ports compile and denial/fake tests pass; Canon is incomplete and no camera/printer hardware was touched. See `HARDWARE_PORT_INDEPENDENT_REVIEW.md`.
- All safety/hardware/Beauty licensing gaps preserved (see `BLOCKERS.md` B-001..B-005, B-004 Tauri+JVM+JNA POC planned).

### Next gate work

Complete Hot Folder readiness/webcam/Canon lifecycle code and offline tests, resolve Canon/ONNX licenses, then separately authorize read-only hardware discovery and controlled device validation. Packaging/Admin/production adapters remain later gates.

## UI transformation independent update (2026-10-30)

- **Backend regression PASS-AUTOMATED:** independent unmodified `test --rerun-tasks` completed exit 0, 27 tests, 0 failures/errors across 9 suites, including installed launcher and 3 operator tests. Evidence: `backend/build/independent-ui-review-backend-test-unmodified.log`.
- **Mounted customer/operator PASS-SIMULATED:** independent Tauri WebView CDP UI-only journeys passed at 1280×800 and 1920×1200 for customer flow and six operator tabs. Default-denied run: `tests/ui-transformation/evidence/2026-10-30T08-56-43.910Z/results.json`.
- **Isolated operator edit/restore PASS-SIMULATED:** exact local developer opt-in run updated and restored layout countdown through visible UI at both resolutions. `tests/ui-transformation/evidence/2026-10-30T08-57-36.700Z/results.json`; cleanup records no orphan/listener and byte-identical config restoration.
- Automated scenes found no enabled target below 48×48 CSS px, horizontal document overflow, broken visible image, or fabricated simulator payment/print/QR success. This is emulated DOM evidence, not physical touch/hardware evidence.
- **Visual design signoff remains BLOCKED:** screenshots exist, but subjective premium visual review requires a human/designer. Production Admin ACL, hardware, live payment/cloud/revenue, installer and licensing gates remain unresolved. Overall release gate remains BLOCKED.

### Final post-fix UI rerun

- Independent `frontend/verify-simulator.mjs` default-denied run: **exit 0**, both full customer flows, six operator tabs at both viewports, vertical frame CTA checks passed at 1280×800 and 1920×1200, reload recovered twice, host exit 0, JVM terminated. Log: `frontend/simulator-independent-final-default.txt`.
- Independent dedicated `V2_LOCAL_OPERATOR_ENABLED=true` non-production run: **exit 0**, same flows plus mounted layout edit and restoration to `strip-2` values `3/2/1`; clean host/JVM close. Log: `frontend/simulator-independent-final-operator.txt`.
- Final screenshots: `frontend/simulator-evidence/` customer scene pairs, 12 operator-tab images, and `operator-layout-saved.png`. Independent designer separately approved four updated simulator PNGs for the narrow visual scope.
- The bounded simulator UI milestone is `PASS-SIMULATED`; **full product UI remains incomplete**. Production bundles/effects/assets, revenue, protected Admin ACL, hardware, live payment/cloud QR, installer, licensing, physical touch/DPI and exhaustive nested V1 parity remain release blockers. Overall release gate remains **BLOCKED**.
