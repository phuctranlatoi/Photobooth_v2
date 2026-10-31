# V1 Settings parity — independent test results

Date: 2026-10-30  
Gate: **BOUNDED PASS-SIMULATED for mounted Settings; full product/V1 parity remains blocked**

## Source authority and preparation

The reviewer read the actual V1 `SettingsTabContent.kt`, `AdminScreen.kt`, `DesktopBoothConfig.kt`, `SettingsManager.kt`, and relevant `DesktopBoothController.kt` paths read-only. No V1 application was launched and no V1 command/build/write occurred. The exact extracted control/default/persistence/apply rules are recorded in `tests/v1-settings-parity/v1-source-matrix.json`.

An early backend implementation now exists: `operator.getSettings` and `operator.updateSettings`, an exact six-field schema, `schemaVersion=1`, `appliesTo=NEXT_SESSION`, `hardwareApply=PENDING_DISABLED`, all production gates false, local opt-in, and IDLE-only update. See `docs/SETTINGS_PARITY_IMPLEMENTATION.md` and `backend/src/main/kotlin/com/lesouvenir/v2/ipc/OperatorSettingsStore.kt`. This is source review only until the owner supplies final test evidence and independent execution is allowed. The frontend Settings tab remains a placeholder at the time of this checkpoint.

## Test matrix

| Case | Status | Required evidence / current result |
|---|---|---|
| Actual mounted Settings load, 1280×800 | PASS-SIMULATED | StrictMode-fixed rerun loaded six values and explicitly showed effective fixture `30 / 30 / 30` versus desired `90 / 60 / 90`. Evidence `tests/v1-settings-parity/evidence/2026-10-30T16-36-26.432Z/1280x800-settings-load.{png,json}`. |
| Actual mounted Settings load, 1920×1200 | PASS-SIMULATED | Same successful mounted load. Evidence in the same directory. |
| Control type/default/value parity | BLOCKED | Backend six-field snapshot exists, but mounted controls are pending. Canon controls remain intentionally outside persisted six fields and hardware remains disabled. |
| Validation parity | NOT-RUN | Source shows backend timeout 0..3600 and stricter nonblank/control-character/path-length validation than V1. Await actual engine/store tests; stricter path validation is a documented V2 safety deviation. |
| Edit/save/reload | PASS-SIMULATED (bounded) | Independent visible-UI harness exit 0 at both sizes; photo +10, print intention, both source choices, unchanged safe V2 path, Save acknowledgement and Reload. Evidence `frontend/simulator-evidence/settings-mutation/2026-10-30T16-43-22.840Z/`. Owner harness does not mutate post-capture or path and therefore is not six-field behavioral coverage. |
| Restart persistence | PASS-SIMULATED (bounded) | Separate native restart and second mounted run exit 0; persisted starting value 160 then edits continued. Evidence `.../2026-10-30T16-43-31.743Z/`. |
| Implicit Admin Back-save | PASS-SIMULATED | Both sizes in both runs report `implicitBack:true`. |
| Configuration restoration | PASS-AUTOMATED | `operator-settings.json` and `local-operator-layouts.json` restored byte-identically by SHA-256. `tests/v1-settings-parity/restore-results.json`. |
| Default deny | PASS-SIMULATED | Explicit `V2_LOCAL_OPERATOR_ENABLED=false` mounted run returned backend `-32010`, displayed denial, left Save disabled. `tests/v1-settings-parity/default-denied.log`. |
| Restart persistence | BLOCKED | Backend atomic V2 JSON storage exists. Await final implementation and isolated mounted restart with byte-identical restoration. |
| Selection/frame/post-capture timer behavior | BLOCKED | V2 simulator has layout countdown only; no V1 inactivity timeout settings contract. V1 timeout auto-selects/defaults frame and calls auto-print with `userConfirmed=false`. |
| Stored vs applied hardware behavior | PASS-AUTOMATED (source only) | Response labels desired settings `NEXT_SESSION` and hardware `PENDING_DISABLED`; production gates are false. This proves design intent, not runtime test or real application. Tests must verify stored desired values only. |
| Default deny / no side effects | PASS-AUTOMATED (source only) | Both methods require local opt-in; update requires IDLE; all hardware/provider gates are false. Independent engine execution remains pending. |
| Backend whole-suite regression | PASS-AUTOMATED | Independent `test --rerun-tasks`: exit 0, BUILD SUCCESSFUL; XML aggregate 12 suites / 42 tests / 0 failures, errors or skips. Logs: `tests/v1-settings-parity/backend-test-rerun.log`, `.err.log`, `backend-test-summary.txt`. |
| Existing customer flow/preview/reload/child exit regression | PASS-SIMULATED | After restoration, `node frontend/verify-simulator.mjs` exit 0 in default-denied mode. Log `tests/v1-settings-parity/full-simulator-after-restore.log`. This does not newly prove every backend idempotency branch. |
| Pixel parity with V1 | BLOCKED | V1 source fidelity is not pixel proof; V1 launch is prohibited. Mounted V2 screenshots can prove only V2 geometry. |

## High-severity parity findings

### HIGH — Current Tauri runtime and installed backend are incompatible

**Resolved in current rerun:** the frontend owner's StrictMode replay fix allowed actual mounted Settings to load at both sizes. The earlier failed evidence is retained as historical failure, not current status.

### HIGH — Print switch has a 13×13 CSS-pixel touch target

**Resolved:** fresh independent discovery evidence `2026-10-30T16-43-21.230Z` is PASS-SIMULATED. Mutation geometry also passed switch ≥48, steppers exactly 52×52 and Save exactly 56 high.

### MEDIUM — Six-field wire payload is not six-field mounted behavioral coverage

The mounted mutation harness toggles print/source, increments photo and frame timers, and re-dispatches the unchanged path. It does **not** alter post-capture timeout or change the path to a second safe V2 value. Exact six-field serialization has component/backend coverage, but mounted behavioral assertions for changed `hotFolderPath` and changed `postCaptureTimeoutSeconds` remain absent. Therefore this report grants bounded Settings acceptance, not exhaustive six-field end-to-end parity.

## Deferred gap-completion run (2026-10-30)

Status: **BLOCKED — concurrent unowned application instance**.

Preflight found unowned native PID **5616** running the exact shared debug executable. Its child WebView PID **41392** owns CDP port 9223. The shared `backend/config/operator-settings.json` and `local-operator-layouts.json` are the same files the proposed mounted mutation/restart test would alter and restore. Running a second writable backend against them would introduce a race and could overwrite a contemporaneous operator save; attaching to the unowned UI and changing viewport/navigation would also violate test ownership. The reviewer did not close, kill, attach to, resize, navigate, or mutate that instance.

Recorded preflight hashes:

- `operator-settings.json`: `596EE4752C0B03EC45D421CABBC14E68E9831D52ECE15320B9345FF94BF815DC`
- `local-operator-layouts.json`: `9D8087212CF371AF9A6B0522EFCC217E8F8E46C1E589F7E8F6B14B2F7D053870`

Consequently the following remain `BLOCKED`, not failed or passed: mounted change of post-capture timeout, mounted change to a second isolated V2 Hot Folder string, Save/Reload/native restart verification for those two changed values, byte-identical restoration after that run, and fresh post-fidelity top/bottom/default-Khung screenshots at both sizes. Re-run only after the operator closes PID 5616 and port 9223 is free; do not terminate it on the reviewer's behalf.

### HIGH — Unsaved default display can misrepresent the effective timeout

`OperatorSettingsStore.kt:21-25` returns V1 defaults 90/90/60 when no settings file exists, while `SimulatorSessionEngine.kt:59-64,98-104,139-145` uses the legacy simulator fixture timeout until persistence and separately reports `effectiveTimerSource=LEGACY_SIMULATOR_FIXTURE`. With the current 30-second fixture, the UI displays editable 90/90/60 values but `V1Settings.tsx:6-12` neither types nor renders `persisted`, `effectiveTimerSource`, or `effectiveTimeoutSeconds`. Before the first save, displayed 90 seconds can therefore be false as an effective-behavior claim. Owner fix is pending. Independent runtime confirmation has not yet run.

### MEDIUM — Mounted mutation selectors are incomplete

Actual source provides stable IDs for `operator-tab-settings`, `v1-settings`, and Admin close, but no per-control IDs in `V1Settings.tsx:15`. The independent harness now requires source-contract IDs for print/source/path, six step controls, Save, and Reload rather than guessing localized English/Vietnamese text. Missing IDs will fail test discovery until the active UI owner supplies them.

### MEDIUM — “Atomic” persistence is bounded, not fully durable

Source confirms path/symlink checks, a 16 KiB read limit, temporary-file `FileChannel.force(true)`, and same-directory `ATOMIC_MOVE` in `OperatorSettingsStore.kt:10-20,27-32,50-65`. It does not force the parent directory after rename; power-loss durability of the directory entry is not established. Reports must say atomic replacement with file flush, not fully durable commit.

### HIGH — Mounted Settings functionality remains unverified

**V2:** backend contract/store now exists, but the last inspected `frontend/src/Operator.tsx:13-14` still describes settings as unavailable.  
**V1:** `SettingsTabContent.kt:29-139` provides mutable print, source, path and timeout controls plus conditional Canon controls.  
**Impact:** no mounted save/reload/restart or touchscreen evidence yet.  
**Mitigation:** complete the visible form and test it through mounted UI. Preserve the backend's separation of persisted desired settings from disabled hardware application.

### HIGH — Timer behavior cannot be selected or verified

V1 `DesktopBoothController.kt:245-310` uses 90/60/90 defaults and timeout auto-print behavior. Photo/frame remaining budgets survive navigation until cleared; interaction reset clears and restarts only the current state's budget. PRINT_PENDING starts a timer only if no inactivity job exists, so a retained frame-timer budget can remain in force and post-capture is merely the fresh non-selection fallback. Tests must not assert that post-capture delays capture or always controls PRINT_PENDING, and must not treat layout capture countdown as equivalent.

## Safety constraints for eventual execution

- Keep `ENABLE_SYSTEM_PRINT=false`; never infer success from a stored true value.
- Use only a synthetic V2 Hot Folder and never create/read customer images.
- No Canon setters, printer submission, PayOS, Neon, Cloudinary, or production HTTP.
- Record the stored desired value separately from next-session snapshot selection and real hardware application. Real hardware application must remain `PENDING_DISABLED` and is not tested.
- Hash and restore the test-owned V2 config after reload/restart; verify host/JVM child exit and CDP listener cleanup.
