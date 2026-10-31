# Baseline Migration Test Results

## Superseding verification — 2026-11-01

All commands below ran in V2 only. No V1 command, secret read, provider write, camera operation, or print submission occurred.

| Area | Classification | Exact result |
|---|---|---|
| Frontend tests | **PASS-AUTOMATED** | `frontend\> npm test` exited 0: Vitest 4.0.9, **7/7 test files and 29/29 tests passed**, duration 10.02 s. |
| Frontend production build | **PASS-AUTOMATED** | `frontend\> npm run build` exited 0: `tsc --noEmit` and Vite 7.2.2 succeeded; 2,014 modules transformed; output JS 369.67 kB (117.44 kB gzip); build 5.89 s. |
| Backend tests | **PASS-AUTOMATED** | `backend\> .\.toolchain\gradle-8.14.3\bin\gradle.bat --offline --no-daemon --project-dir $PWD --project-cache-dir .\.gradle-project test --rerun-tasks` exited 0 with `BUILD SUCCESSFUL` in 1m22s. Fresh XML aggregation: **12/12 suites, 42/42 tests, 0 failures, 0 errors, 0 skipped**. |
| Timeout regression | **PASS-AUTOMATED** | Fresh `backend/build/test-results/test/TEST-com.lesouvenir.v2.ipc.SimulatorSessionTest.xml:4` contains passing `timeoutAutoPrintNoSaleAndCancelMatrix()` (3.393 s). Fixture isolation regression is resolved in this run. |

**Automated regression delta:** zero failing tests across the current frontend and backend suites. This supersedes older red/stale run summaries below, but does not convert simulation into hardware evidence. Remaining release gates include explicitly authorized real Canon DSLR and DNP validation, physical 16:10 touchscreen checks, installer/recovery, production-provider validation, and redistribution/license approval.

**Review date:** 2026-10-31  
**Scope:** pre-change baseline. User authorized scoped V2-only checkpoint/hash plus offline tests/builds. No app source was edited; no V1 shell, mounted app/CDP, hardware, provider, secret, customer data, install, or network operation was used.

## Fresh execution summary

| Command | Exit | Result | Evidence |
|---|---:|---|---|
| V2 `frontend`: `npm test -- --run` with `TEMP`, `TMP`, and npm cache under `tests/full-baseline-migration/evidence`, `npm_config_offline=true` | 0 | **PASS-AUTOMATED**. Vitest reports **6 test files passed (6), 20 tests passed (20)**, duration 7.26 s (test time 4.00 s). | `tests/full-baseline-migration/evidence/10-frontend-test-normalized.txt:24-27`; original mixed-encoding stream retained as `10-frontend-test.log`. |
| V2 `frontend`: `npm run build` offline environment | 0 | **PASS-AUTOMATED**: TypeScript no-emit + Vite 7.2.2; 1,996 modules; output 0.41 kB HTML, 37.47 kB CSS, 357.91 kB JS; 3.84 s. | `tests/full-baseline-migration/evidence/11-frontend-build.log` |
| V2 `backend`: `& .\test-foundation.ps1` | 1 | **HARNESS FAIL**, not a test assertion: script's `$ErrorActionPreference='Stop'` converted Gradle's benign `JAVA_TOOL_OPTIONS` stderr into `NativeCommandError`, before usable test completion. | `tests/full-baseline-migration/evidence/20-backend-test-foundation.log` |
| Direct V2 Gradle, offline, `test` | 0 | **NOT A FRESH TEST PASS**: all six tasks were `UP-TO-DATE`. This only proves cached task state/build invocation. | `tests/full-baseline-migration/evidence/21-backend-test-offline-rerun.log` |
| Direct V2 Gradle, offline, `test --rerun-tasks` | 1 | **FAIL**: 42 tests executed, 1 failed. `SimulatorSessionTest.timeoutAutoPrintNoSaleAndCancelMatrix` expected `DELIVERY` but remained `SELECTING_PHOTOS` after its 10 s wait (`SimulatorSessionTest.kt:69`, XML timestamp `2026-10-31T00:44:05.625Z`). 41 did not fail. | `tests/full-baseline-migration/evidence/22-backend-test-fresh-offline.log`; `backend/build/test-results/test/TEST-com.lesouvenir.v2.ipc.SimulatorSessionTest.xml:2-17` |

Checkpoint evidence: HEAD `e3d25c7e89a7c8e85549787bd2134937cc8a0660`; hashes and the dirty pre-change status are in `tests/full-baseline-migration/evidence/00-prechange-checkpoint.txt`. The dirty tree included other agents' files; none were reverted or edited by this test run.

### Backend failure detail

JUnit reports `SimulatorSessionTest`: 4 cases, 1 failure, 0 errors/skips, suite time 23.458 s. The failing `timeoutAutoPrintNoSaleAndCancelMatrix()` took 10.622 s and threw `org.opentest4j.AssertionFailedError: expected: <DELIVERY> but was: <SELECTING_PHOTOS>`. It arose in `Client.waitFor` at test line 23, called at line 69. That helper polls at 10 ms for up to 10 seconds and then asserts the target.

The test constructs `SimulatorSessionEngine(... inactivityMillis=500, outputRoot=backend/build/timeout-<UUID>)` at line 68. However, the engine constructs `OperatorSettingsStore(workspace)` (`SimulatorSessionEngine.kt:42`). With the V2 repository as workspace, this checks existing `backend/config/operator-settings.json` (`OperatorSettingsStore.kt:9-33`). When that file exists, `persisted=true`, and timeout selection uses persisted settings instead of the constructor's 500 ms fallback (`SimulatorSessionEngine.kt:59-64,98-104`). This review inspected only the path and control flow and did **not** read config contents. The failure is therefore consistent with fixture dependence on existing V2 settings, but final root-cause determination belongs to the backend diagnosis.

## Status legend

`PASS-AUTOMATED` is reserved for retained machine output that identifies a successful test run. Source inspection alone is not relabeled as a pass. `PASS-SIMULATED` means a synthetic/local fixture, never Canon/DNP or production-service evidence.

## Existing evidence

| Area | Status | Evidence and limit |
|---|---|---|
| Backend suite retained result | FAIL | Historical reports cite 8, 10, 22, or 24 tests at different repository stages. The fresh current run is authoritative for this baseline: **42 executed, 1 failed**. Historical counts are snapshots, not contradictions to be merged into a current count. |
| Frontend current result | PASS-AUTOMATED | Fresh normalized Vitest output confirms 6/6 files and 20/20 tests passed, superseding historical 4-test milestone counts for this baseline. |
| Settings persistence | PASS-SIMULATED | Source coverage: `backend/src/test/.../OperatorSettingsTest.kt:43-80` tests V2-local save/reload, invalid-write preservation, disabled operator access, busy-session rejection and restart reload. `V1Settings.test.tsx:10-14` tests load failure, exact six-field save, bounds/reload, duplicate-save latch and denied Admin exit. Files are synthetic under `build/settings-tests/.../PhotoboothDesktop_v2` (`OperatorSettingsTest.kt:41`), not installed-user persistence. |
| Navigation/state controls | PASS-SIMULATED | `SimulatorSessionTest.kt:33-116` covers two layouts, legal gates, stale generation, back/cancel matrix, rejected generic transitions and failed composition. `Simulator.test.tsx:9-24`, `Operator.test.tsx:5-7`, and `App.test.tsx:5-8` cover rapid taps, failure/retry, operator tabs and bridge diagnostics. DOM/jsdom is not 16:10 touch hardware evidence. |
| Business safety | PASS-SIMULATED | `IntegrationContractTest.kt:10-17,37-68` verifies default deny and loopback-only fixture transport; `:69-106` uses an ephemeral `127.0.0.1` server and synthetic credentials. `RevenueRecognitionTest.kt:11-58` covers eligibility, dry-run/uncertain denial, duplicate recognition and reconciliation. `SimulatorSessionTest.kt:48-55,67-71` asserts dry-run/timeout produce no accepted print or revenue. No PayOS/Neon/Cloudinary production call is evidenced. |
| Tool-output honesty | PASS-SIMULATED | `App.test.tsx:5-8` rejects fabricated bridge success and clears stale success; `V1Settings.test.tsx:11-14` fails closed; `Simulator.test.tsx:21-26` rejects fake choices and remote/oversized preview handles. Installed-process script `backend/smoke-installed.ps1:31-45` checks health/catalog, rejected generic transition, EOF shutdown and JAR hash, but no retained result was independently rerun here. |

## Coverage gaps / next executable regressions

After the timeout defect/harness issue is reviewed without redesign, rerun the changed slice and full suite from V2 only:

```powershell
# cwd: E:\HK1_2026_2027\PhotoboothDesktop_v2\backend
& .\test-foundation.ps1 # currently fails at PowerShell stderr handling
# Fresh offline fallback used for this baseline:
& .\.toolchain\gradle-8.14.3\bin\gradle.bat --offline --no-daemon --project-dir $PWD --project-cache-dir .\.gradle-project test --rerun-tasks

# cwd: E:\HK1_2026_2027\PhotoboothDesktop_v2\frontend
npm test -- --run
npm run build

# only after the backend installDist produced by the V2 test run exists
# cwd: E:\HK1_2026_2027\PhotoboothDesktop_v2\backend
& .\smoke-installed.ps1
```

Before execution, add no new code; capture stdout/stderr into new V2 logs and record test counts, commit/hash, exit code, elapsed time, and whether dependency resolution attempted network access. Then add executable tests for: installed settings across process restart; malformed/partially written settings; all V1 navigation paths and cancellation boundaries; repeated confirm/print taps across process restart; print-accepted-but-response-lost reconciliation; no revenue before confirmed print; and explicit assertions that production transport, native camera, printer submission and external filesystem paths are unreachable in regression mode.

## Upcoming frontend slice — independent test plan (not executed)

`docs/UI_BASELINE_ACCEPTANCE.md` was **not available** at review time, so no acceptance criterion from that document is claimed satisfied. Re-review it when created and map each requirement to an assertion below. Current source still exposes a public `Simulate payment approval` control in `Simulator.tsx:81` and a hidden staff approval using the existing `payment.mockComplete` method at line 82; this describes the pre-slice state, not migration completion.

Add/update frontend tests only with the implementation slice, then run the changed files and full frontend suite/build. Required exact assertions:

1. **Payment approval remains staff-only and synthetic**
   - Render `PAYMENT_PENDING`; assert no visible customer button/link has an accessible name matching `simulate payment approval`, `approve`, `paid`, or `payment complete`.
   - Assert ordinary clicks/taps on the payment summary, placeholder and staff-title button do not invoke any RPC.
   - Use fake timers: hold the documented staff target for less than 700 ms, move more than 12 px, pointer-cancel and pointer-leave; each must keep controls hidden and produce zero invokes.
   - Hold for at least 700 ms; assert the staff panel appears but still makes zero invokes. Click its explicit synthetic approval once and assert exactly one `simulator_request` call with `{method:'payment.mockComplete', params:<existing session envelope>}`. Rapid double-click must remain one in-flight call.
   - Assert the UI continues to state that this is not PayOS verification/cash receipt and does not expose QR, credentials, provider configuration or production-payment wording.

2. **No production gates or new workflow/RPC surface**
   - Contract regression: assert the exported `SimulatorMethod` union (or a runtime exhaustive fixture generated from it) remains exactly the pre-slice method set in `shared/simulator-contract.ts:9`; no `payment.confirm`, `payment.approve`, production print, camera, cloud, database or revenue mutation method may be added.
   - Spy on every Tauri invoke through the entire changed UI flow and assert command name remains exactly `simulator_request`; method names and parameter envelopes remain existing schema. Visual controls must not invent local state transitions or call generic `session.transition`.
   - Assert production-disabled copy remains present and no enabled controls appear for native camera, system printer, PayOS, cloud/database or revenue adjustment.
   - Backend RPC schema is out of scope for this frontend slice and must have a before/after hash/diff check for `backend/src/main/**/ipc/**` and shared API contracts; expected diff is empty. Any change requires architect/reviewer approval and backend regression, not acceptance as a UI-only change.

3. **Source palette and black capture state**
   - Render representative states and assert stable semantic classes/data attributes or CSS custom properties resolve to the acceptance palette; do not test implementation-only class ordering.
   - For `LIVE_VIEW`/countdown/capturing with absent or pending image, assert the preview surface has the specified black fallback and no broken-image icon, stale prior capture, remote URL, or fabricated success image.
   - When a safe data-image exists, assert aspect containment/orientation behavior remains correct and black letterbox/background remains; remote and oversized handles must continue to be rejected by the existing `safeImage` test.

4. **Selection badges and frame orientation**
   - Render more shots than required; select/deselect in nonsequential order and assert badges show deterministic selection order/count, update after deselection, never duplicate, and never exceed backend `selectCount`.
   - Assert badge text is accessible and does not become the image's only selected-state signal (`aria-pressed`/equivalent remains authoritative).
   - Render portrait and landscape fixture dimensions for every supported layout branch; assert frame/preview orientation derives from backend layout/image metadata, does not rotate originals, and keeps contain/crop behavior specified by acceptance. Confirm a frame choice sends only the existing `frame.select` payload and does not alter selection RPC schema.

5. **Settings steppers and save acknowledgement**
   - For all three timeout steppers, load 0 and 3600 boundaries; minus at 0 and plus at 3600 are disabled and produce no invoke. One action changes exactly 10 seconds; repeated taps cannot cross bounds.
   - Verify intermediate values and exact save payload retain only the established six settings fields. No hardware authorization/provider field may be introduced.
   - Double-tap Save while pending: exactly one `operator.updateSettings` invoke. Do not show success before a response with `saved:true`; missing/false acknowledgement must show an error and block registered Admin exit.
   - On acknowledged save, assert the exact approved save message (including next-session and `PENDING_DISABLED` meaning), authoritative returned settings replace the draft, and no claim says hardware/current session was updated.

6. **Navigation/regression boundaries**
   - For each changed screen, test Back/Cancel visibility against the existing state contract and assert visual changes do not add a route, screen, auto-advance, payment bypass or customer-accessible staff workflow.
   - Preserve rapid-tap latches, loading/disabled feedback, focus restoration, 48 px minimum targets and keyboard-accessible semantics in jsdom. Physical 16:10 touch acceptance remains separate and cannot pass from these tests.

Planned evidence status is **NOT-RUN** until the slice exists and the scheduled rerun occurs. The backend baseline remains red (42 run, 1 failure) under backend ownership; frontend results cannot upgrade the overall migration verdict.

## Timeout regression proposal — independent static gate review

**Review status:** source/docs only; no build, test, config-content read, V1 command, provider or hardware action. Reviewed `docs/TIMEOUT_REGRESSION_DIAGNOSIS.md`, `SimulatorSessionTest.kt`, `OperatorSettingsStore.kt`, `SimulatorSessionEngine.kt`, and `backend/test-foundation.ps1`.

### Decision

**APPROVE WITH REQUIRED DIFF CONSTRAINTS** the proposed **test-only isolated-root correction**. Reject any implementation that changes `SimulatorSessionEngine`, `OperatorSettingsStore`, timeout algorithms/defaults, production config, IPC, camera/print adapters, or merely lengthens the 10-second test deadline.

The diagnosis is technically consistent with source. Current `SimulatorSessionTest.root` is the shared V2 repository (`Path.of("..").toRealPath()`, line 11). The test reads the existing nonsecret simulator-layout fixture path through `config/simulator-layouts.json` (line 12), and engine construction also checks the workspace's `backend/config/operator-settings.json` through `OperatorSettingsStore` (`SimulatorSessionEngine.kt:42`; `OperatorSettingsStore.kt:9-33`). This review did not read either config's contents. If operator settings exist, `persisted=true` causes per-state persisted timeouts to supersede constructor `inactivityMillis=500` (`SimulatorSessionEngine.kt:59-64,98-104`). Therefore an isolated workspace with no settings file is the correct way to test the fallback timer without changing accepted persisted-settings behavior.

### Required test diff before implementation approval

1. Modify only `backend/src/test/kotlin/com/lesouvenir/v2/ipc/SimulatorSessionTest.kt` for this fix. Production/main source and V2 config diffs must be empty.
2. Add a helper that creates a unique generated directory beneath the real V2 repository's `backend/build/` and whose final path component is exactly `PhotoboothDesktop_v2`, for example `backend/build/isolated-<UUID>/PhotoboothDesktop_v2`. Resolve/normalize it and assert it starts with the real V2 root. Reject symbolic links for the isolated path and its ancestors within the generated subtree; do not follow or write an external target.
3. Before constructing either timeout or cancellation engine, assert `isolatedWorkspace.resolve("backend/config/operator-settings.json")` does not exist. Do not create/copy settings, production config, secrets, customer files, or V1 data into the fixture.
4. Use a separate isolated workspace for the timeout half and cancellation half. Derive each `outputRoot` from that workspace, under its `backend/build/` directory. This keeps all synthetic captures/compositions inside generated V2 output.
5. Continue reading only the existing synthetic `config/simulator-layouts.json` as layout input. Keep `enabled=true` solely for `SimulatorCamera`; do not instantiate/reflection-load native Canon, webcam, Hot Folder, printer, PayOS, cloud, database or revenue adapters. No new environment authorization flags may be set.
6. Preserve the timeout engine parameters (`tickMillis=1`, `prepareMillis=1`, `inactivityMillis=500`) and the 10-second bounded wait. Do not mask a scheduler/engine defect with a larger wait or retries.
7. After timeout reaches `DELIVERY`, retain `userConfirmed == false` and `revenueRecorded == false`, and add the missing explicit `printAccepted == false` assertion. Also assert the resulting state is `DELIVERY` from the authoritative snapshot. No assertion may accept `RECOVERY` as success.
8. Preserve the cancellation matrix unchanged in meaning: cancel and finish rejected before their permitted stages; Back from payment returns to `SELECTING_QUANTITY`; cancel rejected while preparing; after capture reaches `SELECTING_PHOTOS`, cancel succeeds and state becomes `IDLE`. Isolation must not delete these checks.
9. Do not alter `complete(false)`, automatic selection/frame behavior, state transitions, counts/countdowns, persisted-settings precedence, or output composition. If isolated execution still fails, retain and report the actual state/failure rather than weakening assertions.
10. Targeted rerun must include both `SimulatorSessionTest.timeoutAutoPrintNoSaleAndCancelMatrix` and `OperatorSettingsTest.persistedZeroPhotoTimeoutCompletesSyntheticWithoutFinancialSideEffects`, followed by the full offline backend suite. Expected count remains 42 only if no tests are added/removed; report actual runner count rather than assuming it.

### `test-foundation.ps1` harness correction requirements

The diagnosis correctly separates wrapper stderr handling from the timer test. A minimal wrapper patch may be accepted separately only if it:

- retains `$ErrorActionPreference='Stop'` for setup/path failures;
- keeps `TEMP`, `TMP`, `GRADLE_USER_HOME`, `java.io.tmpdir`, `user.home`, Gradle distribution, project directory and project cache under V2 exactly as now;
- invokes only the pinned V2-local Gradle distribution and adds `--offline` for this offline harness;
- narrows relaxed native stderr handling to the single Gradle invocation, restores the prior preference in `finally`, captures `$LASTEXITCODE` immediately, and exits with that exact native code;
- leaves stdout and stderr visible or redirects both only to explicit V2-owned evidence files; it must not discard stderr, rewrite failures as success, or infer success from text;
- quotes all paths and, if `cmd.exe` is required for `.bat`, uses `/d /s /c` with fixed V2-local arguments and no user/config-derived command interpolation;
- preserves the missing-toolchain hard failure and adds no download/install/network fallback;
- receives a harness regression demonstrating: benign `JAVA_TOOL_OPTIONS` stderr plus Gradle exit 0 returns 0, and a real failing test/nonzero Gradle exit remains nonzero.

Preferred minimal implementation is scoped `$ErrorActionPreference='Continue'` around the existing call with immediate exit-code capture and restoration, because `Start-Process` redirection adds quoting/log lifecycle complexity. This is not approval to edit the wrapper in the current task.

## Checkpoint gate review — PENDING / prior claim rejected

Static review of the current `docs/CHECKPOINT.md` does **not** establish a recoverable pre-migration checkpoint. Its recorded Git HEAD identifies an existing commit, but the reviewed document provides no evidence that an archive or complete manifest was actually created; archive recovery is explicitly conditional (`If a manual checkpoint archive was created`). The working tree recorded in `tests/full-baseline-migration/evidence/00-prechange-checkpoint.txt:4-17` was already dirty/untracked, so those files are not proven recoverable from HEAD and are not covered by the document's source-only inventory/count approximations.

The document's 10-backend/4-frontend pass claims are stale milestone results, not current verification. Fresh evidence is 42 backend tests with 1 failure and 6 frontend files/20 tests passing. Its “build-verified/test-verified” and “VERIFIED” labels therefore provide false assurance for the current dirty tree and are **REJECTED** as a migration gate.

The documented `git checkout <commit>` recovery instruction is unsafe for a dirty tree: it neither preserves untracked files nor guarantees restoration of modified files, and may conflict, fail, or encourage loss of concurrent work. Do not execute checkout/reset/clean as checkpoint recovery. Gate remains **PENDING** until the architect supplies an actual V2-local `.checkpoints` archive plus exact manifest/hashes, inclusion/exclusion list, dirty-file coverage, restoration procedure into a separate V2-owned validation directory, and verification against current fresh test evidence. This review does not claim forensic proof that V1 was unchanged.

## Auditor four-document review — BLOCKED pending correction

Static review only of `V1_COMPLETE_FEATURE_INVENTORY.md`, `V1_TO_V2_FULL_PARITY_MATRIX.md`, `SETTINGS_MIGRATION_MATRIX.md`, and `TOOLS_MIGRATION_MATRIX.md`. Auditor owns and is correcting those files; this is not exhaustive audit signoff.

### HIGH

1. **Unsupported Beauty acceptance/provenance conclusion.** `V1_COMPLETE_FEATURE_INVENTORY.md:136-147` labels seven Beauty components `ACCEPTED` and concludes that production-path existence means no experimental/rejected status. `V1_TO_V2_FULL_PARITY_MATRIX.md:128-136` repeats the existence/no-experimental inference. Source existence and ONNX dependency establish neither product acceptance nor frozen algorithm provenance, mask correctness, model/license approval, or parity. Replace `ACCEPTED` with source-observed/unverified status and cite behavioral call sites, model/threshold/preset evidence, fallback and licensing separately. Orchestrator has rejected this claim.

2. **CORRECTED REVIEW FINDING — state inventory omits declared enum members and conflates declaration with usage.** My prior statement implying an actual 13-state enum was wrong and is withdrawn. Independent read of V1 `domain/SessionStateMachine.kt:7-24` verifies **17 declared enum values**: `IDLE`, `SELECTING`, `SELECTING_QUANTITY`, `PAYMENT_PENDING`, `PREPARING`, `LIVE_VIEW`, `COUNTDOWN`, `CAPTURING`, `SELECTING_PHOTOS`, `EDITING`, `COMPOSING`, `PRINT_PENDING`, `PRINTING`, `DELIVERY`, `RECOVERY`, `OUT_OF_SERVICE`, and `ADMIN`. `V1_COMPLETE_FEATURE_INVENTORY.md:33-49` lists only 14 and omits `COMPOSING`, `RECOVERY`, and `OUT_OF_SERVICE`. The corrected inventory must separately report (a) all 17 declared enum members, (b) which are actually referenced/reached by controller/UI source, and (c) which form the normal customer journey versus admin/error/service states. `ADMIN` is conclusively an enum member, but `ANY → ADMIN` and timeout-entry claims still require exact controller call-site evidence. Declared existence alone does not prove runtime reachability or a dedicated screen transition.

3. **Admin taxonomy is structurally inconsistent.** The inventory claims four admin/operator screens at `V1_COMPLETE_FEATURE_INVENTORY.md:87-93`, while current V2 `Operator.tsx` exposes six tabs (Frames, Layouts, Settings, Tools, Colors, Revenue), and `TOOLS_MIGRATION_MATRIX.md:38-67` invents a four-tab grouping. Screen/component count, V1 tab enum/selection source, and V2 six-tab placeholders must be separate rows. A component, tab, and standalone `CalculatorApp` are not interchangeable “screens.”

4. **Tool taxonomy inflates production scope with developer/internal and automatic services.** `TOOLS_MIGRATION_MATRIX.md:18-24,95-143` groups `FrameEngineTest`, debug utilities, automatic print/upload/video/revenue operations, session actions and alleged Gradle tasks into “Tools.” `CalculatorApp`/`LayoutCalculatorTool` must be traced to actual launch/integration source and separated from development-only utilities. “30+ tools” cannot be claimed by counting service methods and automatic workflow internals as operator tools. Each item needs classification: customer flow, operator-visible action, standalone calculator, automatic production service, or developer/test utility, with an exact reachable call site.

### MEDIUM

5. **Every-setting test traceability is absent.** The settings documents enumerate 26 config fields plus five live Canon parameters (`V1_TO_V2_FULL_PARITY_MATRIX.md:19-57`), but test coverage at `:270-296` is coarse and does not provide one row per field with V1 parse/default/persistence/apply source, V2 mapping/status, and exact test method—or `NO TEST/BLOCKED`. `SETTINGS_MIGRATION_MATRIX.md` similarly lacks per-field test references. Six operator fields require individual validation, persistence, reload, boundary, apply-timing and UI tests; the remaining fields require explicit deployment/hardware/security test disposition rather than category-level prose.

6. **Several current-status claims conflict with source/evidence.** Examples: `V1_COMPLETE_FEATURE_INVENTORY.md:283-285` says `V1Settings.test.tsx` is NOT STARTED although the fresh Vitest run includes it; printer interface is incorrectly called implemented by `OperatorSettingsStore` at `:129`; `DesktopImageProcessor` is “not found” while responsibilities are still asserted at `:156`; and `V1_TO_V2_FULL_PARITY_MATRIX.md:147,199-209` marks timeout behavior untested/not started despite existing simulator tests (currently one baseline failure must be disclosed). Correct using current test names/results, without upgrading mocks to production parity.

7. **Settings migration recommendations are unsafe or inaccurate.** `SETTINGS_MIGRATION_MATRIX.md:21-25` calls hybrid V1 `.env` fallback a future option despite strict isolation; this must be prohibited unless separately approved and implemented without reading V1 secrets. The example includes secret-like placeholder text at `:79-91`, which is unnecessary. `:247-249` claims atomic writes make partial writes impossible and mentions file locks, but `OperatorSettingsStore` has no file locking and atomic move support/filesystem failure still needs handling. `:278` incorrectly says Kotlin `toIntOrNull()` truncates `1.5`; it returns null and therefore uses the field default. Remove speculative migration code/rounding unless approved and tested.

8. **“Complete/full parity” titles overstate evidence.** The four docs contain unresolved “not found,” “possibly,” proposed IPC, guessed statuses, approximate tool counts and missing per-row tests. Gate status is **REVIEW BLOCKED**, not complete inventory/full parity. Required correction is source-linked row-level evidence and explicit `UNKNOWN/NOT TESTED`, not generic assurance.

## Conditional implementation gate outcome

Backend and camera conditional implementation tasks ran and correctly stopped **BLOCKED** because no actual source-snapshot archive and manifest had been independently verified. The old `docs/CHECKPOINT.md` claim remains unusable as recovery evidence. A camera-task reference to `CHECKPOINT+` was a filename misunderstanding: the intended gate is the corrected `docs/CHECKPOINT.md` together with an actual `.checkpoints` archive/manifest. The architect is creating that snapshot; QA will not duplicate it or poll.

Until archive path safety, contents, dirty/untracked coverage, counts and hashes are independently verified, app/source implementation remains blocked. Fresh evidence is unchanged: frontend **20/20 passed**; backend **42 run, 1 failed**. No app source edit is recorded by this review.

## V2 configuration completion contract — UNIMPLEMENTED / ARCHITECTURE SIGNOFF REQUIRED

Static review of `V2_CONFIGURATION_COMPLETION_CONTRACT.md` only. It is a proposal, not accepted architecture, implementation, or full-audit evidence.

**Showstoppers before implementation:**

- Architect/operator must choose one V2 app-data identity/config location, exact allowlisted keys/aliases, and a concrete `SecretProvider`. “Injected provider” is not deployable configuration until lifecycle, access control, packaging and failure behavior are defined.
- The proposal intentionally differs from V1 runtime precedence (`working .env < app-data .env < process environment`): it removes implicit working-directory/app-data search, separates secrets, may retain allowlisted process overrides, freezes snapshots per session, rejects contradictory camera flags, disables the local server, constrains Hot Folder to V2-local containment, adds upper bounds, and changes apply timing. Each is a deliberate safety adaptation requiring explicit architectural parity exception/signoff—not “exact V1 migration.”
- Shared-API-only policy must be resolved field by field. `neonDatabaseUrl`/direct DB and Firebase layout writes cannot be silently reintroduced, but omission must have an approved mapping to existing shared APIs for revenue, layouts/pricing and albums. No second backend/database is permitted.
- Operator JSON currently owns six intentions while deployment config would own printer names, source flags, endpoints and Beauty. Ownership and conflict rules must be final and typed; operator settings must never authorize hardware/providers or override identity/secrets.
- CLI capture cannot preserve V1's unchecked command-string semantics. Either define a fixed executable plus validated argument array and authorization, or mark CLI capture unsupported with an approved parity exception.
- Production endpoint allowlisting, PayOS credential completeness/signature verification, durable revenue reconciliation, local-server authentication/exposure, and Beauty source/model hashes/licenses remain unresolved gates. Configuration loading alone must never enable or invoke them.

No shared IPC/schema change is justified by this proposal. Any implementation must first record accepted deviations from V1 precedence and apply semantics, then prove default-denied behavior with V2-only synthetic fixtures. **Status: REVIEW BLOCKED / NOT IMPLEMENTED.**

## Current milestone evidence ledger

- **Coordination:** eight real specialist agents with native IDs are recorded in the current task-board/coordination documents. This establishes task assignment only, not implementation acceptance.
- **Fresh executable evidence:** normalized Vitest evidence reports **6/6 files and 20/20 tests passed**; frontend production build passed. Fresh backend execution reports **42 tests, 1 failure**. These are the current baseline results; any current document claiming an unconditional backend pass or smaller current suite is stale.
- **Audit artifacts:** source-only feature, parity, settings, Tools and configuration documents now exist, but identified corrections remain unaccepted and master/complete titles do not establish coverage.
- **Conditional implementation:** backend, frontend and camera conditional implementation tasks are **BLOCKED**. No app-source edit is accepted or recorded because the whole-current-V2 source checkpoint remains unverified.
- **Milestone verdict:** **NOT MIGRATED / NOT RELEASE READY.** No full migration, architecture acceptance, hardware readiness or release readiness is declared.

**Exact next task:** architect creates the actual sanitized whole-current-V2 source snapshot with manifest and hashes; independent QA then verifies archive safety, coverage and hashes. Only after that gate may the isolated timeout test/harness correction and separately approved safe Tools/frontend slices proceed.

## Migration verdict

**BLOCKED.** Frontend unit/build baseline passes, but the fresh backend baseline fails 1/42. Synthetic coverage still does not prove full V1 parity, installed persistence, real touchscreen behavior, hardware behavior, or production service correctness.

## Independent full-regression rerun — 2026-10-31 23:01 local

Commands were run only in V2. No hardware, physical print, provider, secret, customer-photo, or V1 command was used.

| Area | Status | Exact fresh evidence |
|---|---|---|
| Frontend | **PASS-AUTOMATED** | From `frontend/`, `npm test` exited 0: **7/7 test files and 28/28 tests passed**, Vitest 4.0.9, duration 6.35 s. Suites: `PhotoPreview` 2, `StaffGestures` 3, `V1Settings` 5, `screens` 7, `Simulator` 3, `App` 4, `Operator` 4. |
| Backend | **FAIL** | From `backend/`, `.\.toolchain\gradle-8.14.3\bin\gradle.bat --offline --no-daemon --project-dir $PWD --project-cache-dir .\.gradle-project test --rerun-tasks` exited 1 after 2m04s: **42 tests, 1 failure**. `SimulatorSessionTest.timeoutAutoPrintNoSaleAndCancelMatrix` expected `DELIVERY`, observed `SELECTING_PHOTOS`; `SimulatorSessionTest.kt:69`. XML: `backend/build/test-results/test/TEST-com.lesouvenir.v2.ipc.SimulatorSessionTest.xml:2-17`. |
| Customer screens | **PASS-SIMULATED (bounded)** | `frontend/src/screens/` contains 13 implementation components plus `screens.test.tsx`. The seven screen tests exercise Start, mode/layout, quantity, payment/prepare/capture, photo selection/timer, frame/confirm gating, printing/delivery. They correctly avoid claiming real QR/printing. This is jsdom coverage, not exhaustive V1 behavioral, mounted 16:10, or physical-touch parity. |
| Six operator tabs | **PASS-SIMULATED (bounded), parity incomplete** | `Operator.tsx:12-19` exposes exactly Frames, Layouts, Settings, Tools, Colors, Revenue. Operator tests pass. Frames/Tools/Colors are explicitly browser-local drafts; Revenue explicitly has no repository/RPC; Layouts supports update but not deletion/pricing. These honest limitations mean all-six-tab presence passes, but production V1 operator parity does not. |
| V1 integrity | **BLOCKED / NOT VERIFIED** | No V1 command or write was performed. V2 `git status --short` showed a pre-existing dirty tree (17 modified, 36 untracked at capture), so repository state is not a clean forensic checkpoint. Without an accepted pre-run V1 manifest/hash or an authorized read-only external forensic comparison, “V1 unchanged in any way” cannot be proven. This run itself did not access V1. |

### Findings

**HIGH — backend regression remains reproducible.** The fresh forced rerun repeats the timeout failure already documented: the session remains in `SELECTING_PHOTOS` after the bounded wait. Release and migration gates remain blocked until the fixture isolation correction is implemented and both the targeted test and full forced suite pass without weakening timing/state assertions.

**MEDIUM — UI presence is not full parity.** The new baseline screen set and six tabs render and their bounded tests pass, but current evidence does not cover every V1 transition/cancellation boundary, mounted overflow/touch targets, real preview aspect, persisted operator assets, backend-applied LUTs, authenticated revenue, or production camera/print/payment/cloud behavior. LocalStorage operator drafts must not be represented as migrated backend assets.

**Verdict: FAIL / BLOCKED.** Frontend is green (28/28), backend is red (41 non-failing, 1 failing of 42), V1 forensic untouched status is not independently provable, and full V1→V2 parity is not established.

## Superseding independent regression check — 2026-10-31 23:26 local

| Check | Classification | Exact result |
|---|---|---|
| `frontend/npm test` | **FAIL** | Exit 1. Vitest 4.0.9: **7 files, 6 passed/1 failed; 28 tests, 27 passed/1 failed**. `V1Settings.test.tsx > rejects unacknowledged save and prevents registered Admin exit` expected `false` but received `true` at line 14. |
| `frontend/npm run build` | **PASS-AUTOMATED** | Exit 0. TypeScript no-emit and Vite 7.2.2 succeeded; 2,014 modules; JS 369.63 kB (117.42 kB gzip); build 6.86 s. |
| Backend XML artifact aggregation | **PASS-AUTOMATED (artifact verification)** | `backend/build/test-results/test/` contains **12 suites / 42 tests / 0 failures / 0 errors / 0 skipped**. XML timestamps are 2026-10-31; this task verified the reports but did not execute Gradle. The formerly failing `timeoutAutoPrintNoSaleAndCancelMatrix` is therefore resolved in the retained backend result. |
| V1 read-only Git inspection | **BLOCKED / NOT VERIFIED** | `git -C E:\HK1_2026_2027\PhotoboothDesktop status --porcelain=v1 --untracked-files=all` was read-only and reported two modified agent files and two untracked `.bak` files under `.opencode/agents/`. With no accepted before-state, QA cannot establish when or by whom they changed, so “strictly untouched” cannot be certified. |

The timeout fixture isolation resolution is evidenced by the green backend XML aggregate, but the requested **28/28 frontend claim is rejected** because the fresh command produced 27/28. Release remains **BLOCKED** pending correction and fresh rerun of the frontend suite, plus the physical and packaging gates.
