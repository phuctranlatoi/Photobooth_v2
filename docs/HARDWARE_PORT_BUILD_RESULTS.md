# Disabled hardware-port build verification — 2026-10-30

## Outcome and boundaries

**PASS for compilation, isolated tests and installed simulator regression only.** Read both specialist port reports and their source/tests. No source/config/build dependency changes were necessary; no specialist subtree edits. No SDK/native dependencies installed or invoked, hardware enumeration, real print, service calls, secrets, photographs or V1 commands. Existing simulator API unchanged.

Camera remains **incomplete, disabled and not parity**. Reflection compiling without vendor libraries proves neither reflective signatures nor native startup/device support. Missing shutter/transfer/reconnect/global dispatcher cleanup and timeout containment remain specialist-documented blockers. Printer fake-boundary/callback tests do not establish driver/spooler/media/cut or physical output behavior. Task2 mounted React simulator PASS is independently recorded in `SIMULATOR_INDEPENDENT_REVIEW.md`; this task did not repeat that UI test.

## Dependency and denial review

- Camera port compiles using JDK/Kotlin only. Canon and webcam `Class.forName` calls follow `HardwareAuthorization.requireApproval()`. Default-denied tests throw IllegalStateException, not missing-class errors, without supplying vendor dependencies. No authorized native path was executed.
- Hot Folder snapshot/candidate operations and original retention check authorization before enumeration or transfer reading. Hot Folder construction validates existing V2 paths before operation authorization; this validation is not a hardware lookup and does access filesystem metadata.
- LegacyPrinter.submit checks authorization before ImageIO or facade invocation. Default facade construction has no printer lookup; lookup/job creation occurs only inside submit after authorization. Fake tests establish zero facade calls on denial. Authorized test calls inject a fake facade; AWT printer operations are not invoked.
- java.desktop supplies AWT/ImageIO/printing types already. Current reflective partial ports need no edsdk4j/JNA/webcam artifacts to compile. Adding vendor/native dependencies would be unnecessary and would not complete missing functionality, licensing, lifecycle or packaging gates. build.gradle.kts/config left unchanged.

## Exact commands and exits

Build working directory: V2 `backend`. All output/caches/temp remain under V2.

```powershell
$env:TEMP="$PWD/.tmp"; $env:TMP=$env:TEMP
$env:GRADLE_USER_HOME="$PWD/.gradle-user-home"
$env:JAVA_TOOL_OPTIONS="-Djava.io.tmpdir=$PWD/.tmp -Duser.home=$PWD/.toolchain-home"
& ./.toolchain/gradle-8.14.3/bin/gradle.bat --no-daemon --project-cache-dir .gradle-project test installDist --rerun-tasks *> hardware-port-build.log
$code=$LASTEXITCODE; Get-Content hardware-port-build.log -Tail 30; exit $code
```

**Exit 0**, BUILD SUCCESSFUL in **49s**, six tasks executed. Gradle 9 deprecation warning remains.

Installed black-box regression working directory: V2 root. No subsequent build/source changes.

```powershell
$env:TEMP="$PWD/backend/.tmp"; $env:TMP=$env:TEMP
$env:JAVA_TOOL_OPTIONS="-Djava.io.tmpdir=$PWD/backend/.tmp -Duser.home=$PWD/backend/.toolchain-home"
$env:V2_JAVA_HOME='C:/Program Files/Eclipse Adoptium/jdk-21.0.12.8-hotspot'
node ./tests/simulator/framed-jvm-regression.mjs *> ./backend/hardware-port-simulator-regression.log
$code=$LASTEXITCODE; Get-Content ./backend/hardware-port-simulator-regression.log -Tail 25; exit $code
```

**Exit 0**, `PASS-SIMULATED framed JVM regression`. Both actual installed JVM flows passed: strip 3 originals / 1184x3580 composition; grid 5 originals / 2368x3580 composition; both paper 2452x3658. Original and duplicate-output full-file hashes unchanged; no duplicate artifacts; preview JPEG headers valid. Actual configured inactivity ended userConfirmed=false, printAccepted=false, revenueRecorded=false. This harness checks file headers/hashes, not full pixel parity; backend ImageIO tests cover decoding. Existing harness also enforces prohibited generic-transition rejection and EOF shutdown.

Final read-only V2 PowerShell XML/hash/timestamp inspection exited **0**. Final JUnit XML under backend/build/test-results/test:

| Suite | Tests | Failures/errors |
|---|---:|---:|
| LegacyCameraPortTest | 2 | 0 |
| SimulatorCameraTest | 1 | 0 |
| FoundationTest | 5 | 0 |
| BridgeTest | 5 | 0 |
| SimulatorSessionTest | 4 | 0 |
| LegacyPrinterTest | 3 | 0 |
| SimulatorCompositorTest | 2 | 0 |
| **Total** | **22** | **0** |

Installed backend JAR SHA256: `843B128E0A4C3D0EDCC9EE7DD4867C5E26D754D77F15810AEAF12AF7A7111E44`; LastWriteTimeUtc `2026-10-30T07:34:12.2467413Z`. This replaces the earlier Task2 JAR hash because the disabled legacy classes are now included. Distribution and source matched at this build; no API changes.

Authored change: this report only. Generated updates: backend/hardware-port-build.log, backend/hardware-port-simulator-regression.log, backend-local build/install/test outputs and caches. No legacy source fixes needed/delegated. Hardware activation remains separately blocked on explicit authorization, lifecycle completion, dependency/license validation and measured hardware evidence.
