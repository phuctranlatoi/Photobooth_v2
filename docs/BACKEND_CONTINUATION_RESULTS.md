# Backend continuation results — 2026-10-30

## Scope and outcome

Continued existing backend without redesign. Read AGENTS.md and existing backend foundation/bridge results and image audit. Existing health.check already returns actual running JVM status, PID, uptime and Java version over framed stdio; no production code fix was necessary. `status=ok` means health bridge responsiveness only, **not** camera/printer/payment/cloud/database readiness. Simulator remains mandatory; availableMethods contains only health.check. No session contract added or shared/frontend/Rust files edited.

## Authored changes

- `backend/src/test/kotlin/com/lesouvenir/v2/ipc/BridgeTest.kt`: assert actual JVM health fields and health-only advertised method; launch installed distribution with missing/unsupported/extra flags and require rejection exit 2 without protocol stdout; emit measured lifecycle evidence from existing real-child EOF test.
- `docs/BACKEND_CONTINUATION_RESULTS.md`: this report.

Generated/updated output is confined to backend: `continuation-build.log`, `continuation-build-final.log`, `build/` classes/distribution/reports/test XML plus V2-local Gradle caches/temp/toolchain-home. No V1 files modified; no V1 shell command/build/run, secrets or photographs accessed. Read-only source inspection used the file reader only. No independent V1 baseline comparison was performed.

## Exact commands and exits

Both shell invocations ran with working directory `E:\HK1_2026_2027\PhotoboothDesktop_v2\backend` and the following command (first LOG=`continuation-build.log`, second LOG=`continuation-build-final.log`; actual redirection used those literal filenames):

```powershell
$env:TEMP="$PWD/.tmp"; $env:TMP=$env:TEMP
$env:GRADLE_USER_HOME="$PWD/.gradle-user-home"
$env:JAVA_TOOL_OPTIONS="-Djava.io.tmpdir=$PWD/.tmp -Duser.home=$PWD/.toolchain-home"
& ./.toolchain/gradle-8.14.3/bin/gradle.bat --no-daemon --project-cache-dir .gradle-project test installDist --rerun-tasks *> LOG
$code=$LASTEXITCODE
Get-Content LOG -Tail 30 # second invocation used -Tail 16
exit $code
```

| Invocation | Exit | Evidence |
|---|---:|---|
| Existing tests + installDist before edits | 0 | BUILD SUCCESSFUL in 22s; 6 tasks executed |
| Expanded tests + installDist after edits | 0 | BUILD SUCCESSFUL in 32s |

Final XML: `backend/build/test-results/test/TEST-com.lesouvenir.v2.ipc.BridgeTest.xml`: 5 tests, zero failures/errors/skips, 0.743s. Foundation XML: 5 tests, zero failures/errors/skips, 0.029s. **10 tests passed total.** Gradle 9 deprecation warnings remain; no toolchain upgrade attempted. Build dependency access only; no runtime external integration.

## Measured real versus mock behavior

- Actual installed `backend/build/install/backend/bin/backend.bat --simulator` spawned a JVM, not a mocked health response. Test supplied Java home from running Java 21 test JVM, avoiding machine-default Java 11 mismatch.
- XML records: `Installed simulator lifecycle: backendPid=33380; health=ok; EOF launcherExit=0; backendAlive=false; stdout=framed-only`.
- Real-child test duration 0.214s; response bounded by 10s; closing stdin required launcher exit 0 within 10s and verified JVM PID no longer alive. No trailing stdout or JSON-RPC in stderr.
- Three invalid startup variants actually launched and each exited 2; combined test 0.506s.
- Byte-stream framing/validation and partial reads use in-memory fixtures. Hardware and business adapters are **not implemented/tested by this health-only proof**.
- Real WebView startup/window close, packaged runtime, forced parent death and frontend display verification remain frontend/reviewer-owned gates; this task does not claim those passed.

## Task 2 prerequisites only — implementation pending WebView gate

Existing image audit identifies production `imaging/DesktopCompositor.renderFinal`, not `engine/PhotoCompositor`, as the reuse target. Read-only verification of V1 `DesktopCompositor.kt:1–110` confirms dependencies on FramePack, LayoutMode, RenderResult, JDK AWT/ImageIO/Files and ZXing QR types. No code copied yet.

Before reuse:

1. Complete transitive source/model/helper and dependency/license inventory (including remaining default-frame/QR routines); map V2 layout model without changing slot order or geometry. Inspect frame storage/path resolution, not customer assets.
2. Preserve renderScale=2; strip master 1184×3580, landscape 3580×2368, portrait 2368×3580; slot zip order, center crop, total 4px bleed and custom overlay alpha. Preserve master-before-QR and separate paired/padded print canvas branches described in image/printer audits. No real print needed.
3. Use synthetic asymmetric grids and alpha overlays in V2 only; characterize absolute/grid slots, out-of-order indices, crop, missing/corrupt image, QR on/off and every layout branch. Audit notes preview indexing can differ from compositor: do not silently fix legacy behavior.
4. Resolve LUT/image processor dependencies separately and freeze LUT → mirror/JPEG → optional Beauty → composition order. Do not introduce early aspect crop or reapply effects while composing.
5. Authorize V2-only output paths, complete-file publication and original retention through architect coordination; do not invent session/IPC contract. Beauty remains blocked on approved source/model manifest and bounded lifecycle approval.

No compositor implementation, new session API, live hardware/printing/payment/cloud/DB/deployment or second backend/database created. Task 2 remains pending after real WebView evidence and owner direction.
