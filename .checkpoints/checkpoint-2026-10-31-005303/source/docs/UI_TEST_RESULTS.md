# UI transformation independent test results

**Status:** NOT-RUN — static preparation and V1 source validation only (2026-10-30).  
**Release implication:** UI acceptance remains blocked. No mounted Tauri/CDP journey, screenshot, touch, overflow, reload, close, composition, or idempotency result exists yet.

## Immediate inventory defects (reported before UI execution)

### HIGH — Confirm & Print screen omitted and printing states mapped incorrectly

`docs/UI_SCREEN_INVENTORY.md:29-31,48-50,91` says EDITING has no screen, Frame is reached without a direct state, and both PRINT_PENDING/PRINTING render `PrintingScreen`. Actual V1 maps `EDITING` to `FrameScreen`, `PRINT_PENDING` to `ConfirmScreen`, and only `PRINTING` to `PrintingScreen` (`V1 src/main/kotlin/com/phuctran/photobooth/desktop/Main.kt:216-244`). `ConfirmScreen.kt` also exists in the V1 screen directory. This omission risks bypassing explicit user confirmation, which is the revenue/physical-print gate.

**Required correction/test:** inventory `ConfirmScreen`; test that Back returns safely and only a mounted Confirm & Print UI action can advance to printing. Do not use direct RPC.

### HIGH — Admin inventory is materially incomplete

The inventory lists only settings and revenue and incorrectly describes them as being directly shown by `AppShell` (`docs/UI_SCREEN_INVENTORY.md:33,51-53,93,110-111`). Actual root mounts `AdminScreen` (`V1 Main.kt:253-287`). `AdminScreen.kt:63-241` owns six tabs: frame management, layout management/edit/delete, device settings, another operator view at tab 3, filters/LUT at tab 4, and revenue at tab 5. Its operator callbacks are explicit at `AdminScreen.kt:54-61`; layout price/shot count/countdown controls are at `AdminScreen.kt:418-464`. These are not optional details for parity.

**Required correction/test:** source-link and name all six tabs and every enabled/disabled operator action. Safe UI must honestly disable unsupported file chooser, camera, LUT, destructive revenue, and hardware actions.

### MEDIUM — startup degraded UI and terminal states omitted

V1 has an eight-second startup timeout with “Vào Admin kiểm tra” and “Bỏ qua & Chụp ngay” controls (`V1 Main.kt:77-117`). The enum also contains `RECOVERY` and `OUT_OF_SERVICE` (`V1 domain/SessionStateMachine.kt:22-24`), while root currently falls through for unmapped states (`V1 Main.kt:289`). The inventory mentions neither startup controls nor these state gaps.

**Required correction/test:** inventory these as startup overlay/state gaps, not proven screens; exercise loading/error/degraded paths in the mounted V2 UI.

### MEDIUM — Start screen description misses its multi-step special-event controls

The catalog compresses Start to layout/bundle selection (`docs/UI_SCREEN_INVENTORY.md:41`). Actual V1 includes event carousel, matching layout controls, a frame page, and a 48 px back control (`V1 StartScreen.kt:109-252`), in addition to the five-tap Admin title (`StartScreen.kt:65-74`). These small controls require explicit touch/navigation coverage.

## Prepared evidence

| Case | Status | Evidence |
|---|---|---|
| Validate inventory navigation claims against V1 | PASS-AUTOMATED | Read-only source inspection at paths/lines cited above; no V1 command/build/write |
| Define two-resolution mounted acceptance matrix | PASS-AUTOMATED | `tests/ui-transformation/acceptance-manifest.json` |
| Define CDP safety/no-direct-RPC protocol | PASS-AUTOMATED | `tests/ui-transformation/README.md` |
| Prepare attach-only executable CDP journey | PASS-AUTOMATED | `tests/ui-transformation/mounted-tauri-cdp.mjs`; source reviewed only, not executed |
| Mounted Tauri customer journey | BLOCKED | Final frontend/harness notification and existing CDP endpoint not yet supplied |
| Mounted Admin/Studio journey | BLOCKED | Same; current `frontend/src/App.tsx:21-37` is simulator/architecture proof |
| Screenshot visual review | BLOCKED | Screenshots not captured; designer signoff required |
| 1280×800 / 1920×1200 overflow and targets | BLOCKED | Mounted final DOM unavailable |
| Simulator original/hash/composition/idempotency/reload/close regression | BLOCKED | Must run through final mounted safe simulator UI; no direct RPC permitted |

## Execution note

Do not infer PASS from frontend unit tests or mocks. On final notification, attach to the already-running CDP target without opening a competing listener on 9223, navigate exclusively through visible controls, store screenshots/results only below `tests/ui-transformation/`, and classify evidence as simulated—not real hardware.

The prepared runner derives quantity, selection count, layouts and frames from the mounted UI/backend catalog rather than universal constants. It covers both required viewports, customer screenshots from welcome through completion, the six source Admin tabs (Frames, Layouts, Settings, Tools, Colors, Revenue), separate customer Studio/setup presence, 48 px targets, overflow, image loading, safety copy, and default-deny operator mutation. The runner does not activate operator mode. Only an already-running isolated non-production host/JVM inheriting exact `V2_LOCAL_OPERATOR_ENABLED=true` permits V2-local layout update/revert; this developer switch is not authentication or a production Admin ACL. Default-denied read/edit (`-32010`) and unsupported-capability reasons remain acceptance requirements. Visual quality remains subject to separate designer screenshot signoff.

## Static backend operator source review — 2026-10-30

**Review method:** source inspection only. No Gradle task, installation, JVM launch, environment change, CDP attachment, or backend mutation was performed while implementation owners were active. Existing test assertions are evidence of intended coverage, not an independently observed test pass.

### HIGH — production operator authentication/authorization is absent

The only implemented gate is exact process environment comparison `System.getenv("V2_LOCAL_OPERATOR_ENABLED")=="true"` (`backend/src/main/kotlin/com/lesouvenir/v2/ipc/SimulatorSessionEngine.kt:237-245`). The default constructor is disabled (`:18-27`), and disabled `operator.*` requests return `-32010` before dispatch (`:104-107`). Enabled status explicitly reports `accessMode: LOCAL_DEVELOPMENT_ONLY`, `productionAdminAcl:false`, and false production capabilities (`:108-115`). This is a developer switch inherited by the process, not identity, authentication, authorization, or a production Admin ACL.

`docs/UI_INTEGRATION_REVIEW.md:305-320` describes a PIN, JWT and `-32003` enforcement as architecture guidance, but those mechanisms are not implemented by the reviewed engine. Likewise its proposed broad Admin APIs (`:154-181`) and production claims elsewhere in that document must not be treated as current behavior. UI wording and test results must remain explicit that protected production operator access is an unresolved blocker.

**Mitigation/regression requirement:** keep operator methods unavailable in production packaging until an architect-reviewed authentication and authorization boundary exists. Add end-to-end negative tests at the packaged Tauri allowlist and JVM boundaries; a developer environment flag alone cannot satisfy that gate.

### MEDIUM — persisted overrides load even when operator API is disabled

`OperatorLayoutStore.load(config)` runs unconditionally during engine initialization (`SimulatorSessionEngine.kt:65-70`), before any `operator.*` request gate. Therefore a previously written `backend/config/local-operator-layouts.json` affects the catalog and customer simulator even when the current process does not inherit `V2_LOCAL_OPERATOR_ENABLED=true`. This may be acceptable for an isolated local fixture, but “operator disabled” does not mean “operator overrides ignored.” A malformed persisted file also intentionally fails engine startup because parsing/validation exceptions are not recovered (`OperatorLayoutStore.kt:35-44`).

**Risk/requirement:** document fixture lifecycle and ensure production packaging cannot contain or inherit this developer override file. Mounted tests must show the effective layout values and must not claim the disabled flag restores checked-in defaults. Corrupt-file fail-closed behavior needs an operator-visible startup/recovery result rather than silent fallback.

### PASS-SIMULATED (source evidence only) — default deny occurs before request mutation I/O

For every `operator.*` call, the `localOperatorEnabled` check precedes method selection (`SimulatorSessionEngine.kt:104-107`). For `operator.updateLayout`, `guard("IDLE")` precedes `operatorStore.update` (`:117-121`), so a disabled or busy request reaches no update write path. The existing test intends to verify default `-32010`, busy `-32001`, and unchanged persisted content (`backend/src/test/kotlin/com/lesouvenir/v2/ipc/OperatorContractTest.kt:15-42`). This remains source/test-code evidence because the suite was not run in this review.

### PASS-SIMULATED (source evidence only) — bounded schema and pricing isolation

The store accepts exactly `layoutId`, `shotCount`, `selectCount`, and `countdownSeconds`; it rejects extra/missing fields, unknown layouts, shots outside 1..12, selection outside 1..shots, and countdown outside 0..30 (`OperatorLayoutStore.kt:12-33`). `operator.getStatus` reports `pricingEditable:false` (`SimulatorSessionEngine.kt:108-115`). Runtime pricing continues through `PricingCalculator.calculatePrice` and fixed catalog pricing metadata (`:29-39,94-101,129-133`); the operator patch has no price field. Existing tests check rejection of an added `price` field and the false pricing flag (`OperatorContractTest.kt:20-26`).

### PASS-SIMULATED (source evidence only) — atomic same-directory persistence design

The update validates a deep copy before filesystem operations, creates a same-directory temporary file, writes and forces the file channel, performs `ATOMIC_MOVE` plus replace with no non-atomic fallback, then publishes layouts in memory; the temp is deleted in `finally` (`OperatorLayoutStore.kt:45-65`). Path construction is not caller-controlled, the workspace basename is constrained, and existing symbolic links from target toward workspace are rejected (`:9-20`). Restart loading validates size, JSON shape, exact fields, ranges, known IDs, and duplicate IDs before publishing the copied layouts (`:35-44`).

**Coverage gaps observed:** the current focused test covers update persistence, invalid range preserving the file, restart, busy guard, and corrupt startup (`OperatorContractTest.kt:28-49`). It does not directly exercise symbolic-link rejection, the 16 KiB limit, duplicate persisted IDs, malformed-but-valid JSON shapes, unknown operator method, non-empty `operator.getStatus` params, atomic-move-unavailable behavior, or production packaging exclusion. These are `NOT-RUN`, not failures proven by this review.

### Mounted acceptance remains required

Static inspection does not prove Tauri allowlist adoption, environment inheritance, rendered default-deny reasons, update/revert behavior, restart visibility, or absence of production exposure. Those remain blocked until the existing mounted Tauri CDP harness is declared ready. The independent runner must not set the environment itself or interpret local developer mode as a security PASS.

## Nested-control evidence qualification

`docs/UI_NESTED_CONTROL_EVIDENCE.md` is not accepted as proof of “all controls.” In particular, its `:68` statement that a Refresh button “typically” triggers `onRefresh` is inferential, and its Pricing Calculator section describes the business pricing helper rather than the Admin Tools application. Read-only V1 inspection confirms the Tools tab mounts `engine.CalculatorApp` (`AdminScreen.kt:237-240`), defined in `engine/LayoutCalculatorTool.kt:56-59`. Its observed UI includes PNG measurement/direct pre-punched import, layout/frame/event metadata, QR coordinates, cover upload, layout/frame saves, generated preview/code, and clipboard copy (`LayoutCalculatorTool.kt:366-387,547-764`). This was a bounded review, not an exhaustive nested-control audit.

Current V2 operator capabilities do not implement this Tools workflow. Mounted acceptance must require an explicit unsupported explanation and disabled Tools actions; a decorative or fake calculator is a failure. Actual behavior remains `BLOCKED` until the final shared CDP harness is ready.

## Current redesigned-scene harness qualification

Static inspection confirms the redesigned customer component now exposes semantic stage/state hooks and the sequence begins with “Explore the collection” before the backend-provided “Start simulator session” control (`frontend/src/Simulator.tsx:71-84`). The prepared mounted runner follows that visible sequence and still derives counts/options from rendered backend data. This is source evidence only, not a UI PASS.

Simulator acceptance does not require an unsupported distinct backend `PRINTING` transition or generated QR. A visible confirm busy/progress state is acceptable; delivery must state that no simulator delivery link/QR exists and must not show a QR image or success instruction. Preparation/countdown/capturing may transition faster than screenshot latency. The runner now records such inaccessible transients as observations rather than fabricating or mislabelling screenshots. Production startup bypass, real payment, real print, and QR success language remain prohibited. Original-file, composition, idempotency, reload and close regressions remain required and are not superseded by the redesign.

An optional test-owned launcher is prepared at `tests/ui-transformation/launch-mounted-run.mjs` so independent execution is not permanently dependent on a persistent frontend host. It remains NOT-RUN until final notification. It refuses a competing 9223 listener, launches only the existing V2 native debug executable with loopback CDP, cleans/checks its captured process tree, and records cleanup in V2. Default operator mode is false. A separate isolated non-production run requires two explicit CLI acknowledgements before inheriting exact `V2_LOCAL_OPERATOR_ENABLED=true`, and restores the pre-run V2-local override afterward. This mechanism is not authentication or production authorization.

## Independent backend regression execution — 2026-10-30

### Reported owner baseline (not independent execution)

`docs/UI_BACKEND_RESULTS.md:22-26` reports 27 tests, zero failures, installed smoke success, and installed JAR SHA-256 `4A3743B7CFEA7A686A63AF5D3C3392ACC63E7249BC7D580C4B1849075317D8F8`. The independent review did not rerun `installDist` intentionally or alter that installed artifact.

### Independent command 1 — BLOCKED by active installed runtime

From V2 `backend`, with V2-local `GRADLE_USER_HOME`, `TEMP`, `TMP`, project cache and `JAVA_TOOL_OPTIONS`, the reviewer ran:

```powershell
& '.\.toolchain\gradle-8.14.3\bin\gradle.bat' --no-daemon `
  --project-cache-dir '.gradle-project-qa' test --rerun-tasks --console=plain
```

**Exact exit:** `1`. Gradle's `test` task depends on `installDist` (`backend/build.gradle.kts:13-18`). `installDist` failed because the active frontend/backend process held files under `backend/build/install/backend`; Gradle could not delete that directory. The command reported the pre-existing XML aggregate as `TESTS=27 FAILURES=0 ERRORS=0`, but tests did not execute to completion in this invocation, so those counts are not credited as an independent PASS. No active process was terminated and no installed distribution cleanup was attempted. Log: `backend/build/independent-ui-review-backend-test.log` (subsequently replaced by command 2 output).

### Independent command 2 — FAIL (25 passed, 2 path-coupled launcher tests failed)

To avoid mutating the active installed distribution, the reviewer added the test-only init script `tests/ui-transformation/backend-test-isolation.init.gradle`, redirecting `installDist.destinationDir` to `backend/build/independent-ui-review-install`, then ran:

```powershell
& '.\.toolchain\gradle-8.14.3\bin\gradle.bat' --no-daemon `
  --project-cache-dir '.gradle-project-qa' `
  --init-script '..\tests\ui-transformation\backend-test-isolation.init.gradle' `
  test --rerun-tasks --console=plain
```

**Exact exit:** `1`; **27 tests, 2 failures, 0 errors across 9 XML suites**. The 3 `OperatorContractTest` cases passed, including framed access/default deny, exact parameters, persistence/restart and busy guard (`backend/build/test-results/test/TEST-com.lesouvenir.v2.ipc.OperatorContractTest.xml`). The failures were:

1. `BridgeTest.installedLauncherRejectsNonSimulatorStartup`: expected exit 2, observed 1.
2. `BridgeTest.installedLauncherRealChildRoundtripAndShutdown`: expected launcher file was absent.

Both tests hardcode `build/install/backend/bin/backend.bat` (`backend/src/test/kotlin/com/lesouvenir/v2/ipc/BridgeTest.kt:62-84`), while the safety init script deliberately redirected installation away from that active path. Thus this run independently confirms **25 passing tests and all 3 operator tests**, but cannot establish the two installed-launcher cases and is classified `FAIL`, not a product regression claim. Exact evidence: `backend/build/independent-ui-review-backend-test.log` and `backend/build/test-results/test/TEST-com.lesouvenir.v2.ipc.BridgeTest.xml`.

### Disposition

An unmodified full-suite independent PASS remains `BLOCKED` until the frontend-owned process releases `backend/build/install/backend`; rerunning then would exercise the hardcoded installed-launcher tests without disrupting active work. The owner-reported 27/0 baseline remains useful but is not substituted for independent evidence. No UI CDP port was opened during either backend command.

## Final independent execution — 2026-10-30

### Backend full regression: PASS-AUTOMATED

After the frontend released the installed runtime, the unmodified suite was rerun from V2 `backend` with V2-local Gradle cache/temp:

```powershell
& '.\.toolchain\gradle-8.14.3\bin\gradle.bat' --no-daemon `
  --project-cache-dir '.gradle-project-qa' test --rerun-tasks --console=plain
```

**Exact exit 0; BUILD SUCCESSFUL; 27 tests, 0 failures, 0 errors across 9 XML suites.** `installDist`, both hardcoded installed-launcher tests, and all three operator tests completed. Evidence: `backend/build/independent-ui-review-backend-test-unmodified.log` and `backend/build/test-results/test/*.xml`. This supersedes the earlier lock-blocked/path-redirect attempts for the current source. It remains software/simulator evidence, not hardware evidence.

### Mounted customer and default-denied operator UI: PASS-SIMULATED

Command:

```text
node tests/ui-transformation/launch-mounted-run.mjs
```

The first three development attempts failed honestly and produced separate `FAIL` result directories: missing Java 21 launcher environment, a button selector that did not account for the decorative arrow text, and a malformed CDP expression. The launcher/harness—not app code—was corrected. The final default-denied run completed both 1280×800 and 1920×1200 journeys with no recorded geometry, image, overflow, safety-copy, or state failures.

Evidence: `tests/ui-transformation/evidence/2026-10-30T08-56-43.910Z/results.json` reports `PASS-SIMULATED`, `operatorEnabled:false`, zero failures. It contains 36 PNGs plus per-scene JSON measurements: welcome, catalog, payment/busy, preparation/countdown, selection, frame/composition, final preview/busy, delivery/completion, and all six operator tabs at both resolutions. Navigation used mounted DOM controls only; no direct Tauri invoke/RPC was used by the acceptance runner.

Default-denied operator status was rendered through the UI, layout mutation was not attempted, unsupported tabs were required to expose disabled controls and reasons, and no real QR/payment/print claim was accepted.

### Dedicated isolated operator update/restore: PASS-SIMULATED

Command:

```text
node tests/ui-transformation/launch-mounted-run.mjs --local-operator --nonproduction-isolated
```

Evidence: `tests/ui-transformation/evidence/2026-10-30T08-57-36.700Z/results.json` reports `PASS-SIMULATED`, `operatorEnabled:true`, zero failures, and visible-form update/restore on `layout-strip-2-save` at both resolutions. The test changed the backend-provided countdown through React form events, waited for mounted save feedback, and restored the original values through the same UI.

Cleanup evidence `tests/ui-transformation/.tmp/last-launch-cleanup.json` records host PID 31256, captured process tree, no forced orphans, no listener remaining on 9223, and byte-identical operator configuration before/after (`9d8087212cf371af9a6b0522efcc217e8f8e46c1e589f7e8f6b14b2f7d053870`). This is a local developer capability test, not authentication or a production ACL.

### Touch/layout/image checks: PASS-SIMULATED, visual-design verdict pending

For every captured scene the harness inspected visible controls and failed on any enabled target below 48×48 CSS px, document horizontal overflow, or visible image with zero natural pixels. Both successful result sets contain zero failures. This is DOM geometry at emulated viewports, not physical touchscreen/DPI evidence.

The PNG files were generated successfully, but this reviewer runtime could not decode images for subjective visual inspection. Therefore premium visual quality, hierarchy, cropping aesthetics, contrast, and designer approval remain **BLOCKED pending human/designer screenshot review**. Automated checks must not be represented as visual-design signoff.

### Remaining UI regression limitations

The final independent runner verifies mounted customer/operator flows, configuration restoration, host/JVM cleanup, safety copy, layout geometry, and image loading. It does not independently repeat every original/hash/composition-byte-idempotency/reload-close assertion from the older specialist harness in these two final runs. Those properties retain prior frontend/simulator evidence and backend tests but are not newly reclassified as independent mounted PASS here. No Canon, physical camera, DNP printer, PayOS, Neon, Cloudinary, QR delivery, customer photo, or physical touchscreen was accessed.

## Post-fix final mounted rerun — 2026-10-30

Following frontend fixes for reserved frame actions, clipping, and operator/global-control overlap, the reviewer independently reran the frontend-owned mounted harness twice.

### Default-denied run: PASS-SIMULATED

```powershell
node verify-simulator.mjs 2>&1 | Tee-Object simulator-independent-final-default.txt
```

Run from `frontend`; **exact exit 0**. Actual mounted WebView customer flows completed at 1280×800 and 1920×1200, including collection, setup, dynamic quantity, payment Back, synthetic capture, configured photo selection, frame composition, final dryrun, reload recovery, delivery, finish/reset, and all six operator tabs. The harness printed:

* `VERTICAL CTA PASS frames-0`
* `VERTICAL CTA PASS frames-1`
* `RELOAD PREVIEW recovered 0/1`
* `CLOSE True`
* `HOST EXIT 0`
* `JVM terminated`

Frame action controls were measured within the viewport and at least 64 px high in this targeted regression. Mounted image evidence had non-zero natural dimensions. The operator screenshots passed the harness's no-global-controls-overlap assertion. Log: `frontend/simulator-independent-final-default.txt`.

### Explicit isolated local-operator run: PASS-SIMULATED

```powershell
$env:V2_LOCAL_OPERATOR_ENABLED='true'
node verify-simulator.mjs 2>&1 | Tee-Object simulator-independent-final-operator.txt
```

Run in a dedicated non-production process; **exact exit 0**. It repeated both customer flows and all six operator tabs at both viewports, then updated and restored `strip-2` through mounted UI. Exact restoration output: `OPERATOR EDIT RESTORED { id: 'strip-2', values: [ '3', '2', '1' ] }`. It again reported both vertical CTA passes, both reload recoveries, `CLOSE True`, `HOST EXIT 0`, and `JVM terminated`. Log: `frontend/simulator-independent-final-operator.txt`.

Final screenshot paths are `frontend/simulator-evidence/`: `{welcome,catalog,setup,quantity,payment,live,selection,frames,print-preview,delivery}-{0,1}.png`, `operator-{frames,layouts,settings,tools,colors,revenue}-{1280,1920}.png`, and `operator-layout-saved.png`. These were overwritten by the final successful reruns and are synthetic simulator evidence only.

### Visual review reference and bounded verdict

The independent designer is reported to have directly approved four updated PNGs for the narrow simulator presentation. That approval is recorded as a separate reviewer conclusion, not derived from automation. It does not establish full product visual parity, exhaustive V1 nested-control parity, production asset/bundle quality, physical touchscreen/DPI behavior, or accessibility conformance.

### Final UI scope statement

The tested simulator milestone passes its bounded mounted customer/operator acceptance. **Full UI is not complete.** Production bundles and assets, selectable effects, production frame/event management, native settings/Tools/Colors, revenue records and adjustments, authenticated production Admin ACL, camera/printer hardware, live payment, cloud album, and real delivery QR remain unavailable or deliberately disabled. No production startup bypass or fake success was accepted.
