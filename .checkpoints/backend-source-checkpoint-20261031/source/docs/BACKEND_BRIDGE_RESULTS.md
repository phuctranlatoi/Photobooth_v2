# Backend bridge results

2026-10-30. Backend-only health bridge AUTOMATED TESTED. No Tauri/native/hardware/business verification claimed.

## Implementation

- `backend/src/main/kotlin/com/lesouvenir/v2/ipc/IpcMain.kt`: private inherited stdio server, health.check only; requires exactly `--simulator`. No session, hardware or business methods. Foundation unchanged.
- Four-byte unsigned big-endian byte lengths, 1 MiB allocation bound; readFully handles partial reads. Clean EOF exits silently. Partial header/body emits -32600 then exits. Oversize (including unsigned 0xffffffff) emits -32600 and closes without allocating/draining hostile body; cannot desynchronize into its payload.
- Strict UTF-8 without BOM, strict JSON single object, no duplicate top-level fields, exactly five contract keys, string id/jsonrpc/method, literal version number 1 (not string/boolean/1.0), empty-object params. Unknown method -32601; params/version -32602; invalid requests -32600. Errors never include input content. Available methods contains only health.check; simulator always true. Uptime uses JVM runtime uptime.
- Missing/unparseable ID uses empty string, not a fabricated request ID. Contract requires string error IDs but does not specify unavailable-ID sentinel; architect should ratify this choice. Framing-fatal close policy should also be recorded in contract. No shared contract edited.
- stdout contains framed protocol only. Diagnostics go to stderr; launcher/JVM JAVA_TOOL_OPTIONS text also stays stderr.
- `backend/build.gradle.kts` application distribution: `backend/build/install/backend/bin/backend.bat` (and Unix launcher), requires Java 21 via JAVA_HOME. No bundled JVM/exe or Tauri packaging proof. Retained Kotlin 2.1.20/coroutines foundation and added Gson 2.11.0 for strict parsing rather than blindly using reference dependency/sample versions.

## Exact build invocation and exits

Working directory for every command: `E:\HK1_2026_2027\PhotoboothDesktop_v2\backend`.

```powershell
$env:TEMP="$PWD/.tmp"
$env:TMP=$env:TEMP
$env:GRADLE_USER_HOME="$PWD/.gradle-user-home"
$env:JAVA_TOOL_OPTIONS="-Djava.io.tmpdir=$PWD/.tmp -Duser.home=$PWD/.toolchain-home"
& ./.toolchain/gradle-8.14.3/bin/gradle.bat --no-daemon --project-cache-dir .gradle-project test installDist
```

Actual invocations redirected combined output to the following backend-local logs, captured `$LASTEXITCODE`, and exited with it:

| Log | Exit | Observation |
|---|---|---|
| `bridge-build.log` | 1 | Child EOF; test assumed wrong install directory |
| `bridge-build-rerun.log` | 1 | Correct launcher found, child still EOF |
| `bridge-build-diagnostic.log` | 1 | Captured child stderr: UnsupportedClassVersionError from inherited JAVA_HOME |
| `bridge-build-final.log` | 0 | Child explicitly uses test JVM java.home as JAVA_HOME; BUILD SUCCESSFUL in 14 s |

Final JUnit evidence: `backend/build/test-results/test/TEST-com.lesouvenir.v2.ipc.BridgeTest.xml` and existing FoundationTest XML. **8 total tests passed** (5 unchanged foundation, 3 bridge). No live-service calls; public build dependency downloads only. All cache/temp/output paths are V2-local. Gradle reports future Gradle 9 deprecation warnings.

## Real child evidence

`installedLauncherRealChildRoundtripAndShutdown` spawns actual installed Windows batch launcher → JVM, sends byte-framed UTF-8 request with non-ASCII string ID, reads framed JSON within 10 seconds, checks ID echo/status/simulator and returned JVM PID alive. Closes stdin, requires launcher exit 0 within 10 seconds, verifies returned JVM PID no longer alive and stdout EOF with no trailing text. stderr is checked for absence of JSON-RPC payload. Test uses JAVA_HOME from the running Java 21 test JVM to avoid machine-default Java mismatch.

Other bridge tests cover concatenated requests and one-byte reads; clean EOF; truncated header/body; zero-length malformed request; oversize/signed-boundary headers; invalid UTF-8/BOM/JSON/trailing document; duplicate/extra fields; numeric ID; unknown method; invalid params and strict version types. Byte lengths are generated from UTF-8 bytes rather than copying the reference's illustrative hex length.

## Remaining gates

No Tauri parent startup/window-close or forced-parent-death test; only stdin-EOF shutdown is established. Java runtime must be selected correctly by shell; runtime bundling remains architect-owned. No unsolicited startup frames. No native library loading, capture, print, payment, cloud, database or production session methods. V1 was not accessed for this bridge task. No V1 shell/build/write/secrets/runtime data. No independent V1 baseline comparison performed.
