# Backend isolated foundation results

2026-10-30 — AUTOMATED TESTED (foundation only). App-wide integration remains BLOCKED by audit QA and pending architect contracts. No transport/shared files were created or modified.

## Scope and attribution

All originals under V1 `src/main/kotlin/com/phuctran/photobooth/desktop/`, inspected individually using read tools, never shell:

| V2 backend file | Verified original | Adaptation |
|---|---|---|
| `src/main/kotlin/com/lesouvenir/v2/foundation/LayoutMode.kt` | `model/BoothModels.kt:6-76` | Pure layout family/slot/layout extraction and aspect helper, package/formatting only; no Compose dependency |
| `.../PricingCalculator.kt` | `model/PricingCalculator.kt:3-38` | Package/comment only; pricing algorithm unchanged |
| `.../SessionStateMachine.kt` | `domain/SessionStateMachine.kt:7-38` | Package/formatting only; StateFlow and unrestricted transitions retained |
| `.../SimulatorAuthorization.kt` | NEW V2 safety boundary | Explicit opt-in, denied by default; not a production session contract |

Dynamic shotCount/selectCount/countdownSeconds and all source layout fields remain separate. No universal capture count/countdown introduced. Preserved quirks: copy retains precomputed photoAspectRatio; pricing sanitizer has no upper limit even though options stop at 50; landscape pricing canonicalizes to 10x15. FSM intentionally permits all state pairs; **never expose it directly as an authenticated/guarded production command handler**.

Read `QA_REPORT.md` and own source audit findings before work. QA's inactivity claim conflicts with directly inspected controller `handleInactivityTimeout:291-310` (calls `startPrinting(false)`); foundation does not implement inactivity behavior and does not resolve that audit discrepancy. QA gate is not declared cleared.

No compositor copied: it requires additional frame/render/QR dependency verification. Pure layout geometry helper supplies the bounded composition-related foundation. No Beauty, production adapters, Neon/migrations, financial side effects, camera fallback, network runtime or hardware integration exists in this module. Simulator permission is a separate local check only, not a capture implementation or transport.

## Actual commands / exits

All shell working directories were V2 or V2/backend, authorized by user. Toolchain installation/download was allowed; no V1 wrapper used.

1. `Get-Command java,kotlinc,gradle -ErrorAction SilentlyContinue | Select-Object Name,Source; Get-ChildItem backend -ErrorAction SilentlyContinue` — exit **1** (backend absent initially); found installed Adoptium Java 21, no Kotlin CLI or Gradle command.
2. Created V2/backend `.toolchain`, `.tmp`, `.gradle-user-home`; downloaded `https://services.gradle.org/distributions/gradle-8.14.3-bin.zip` using Invoke-WebRequest and expanded locally — exit **0**. No system installation. Distribution checksum was not independently verified; release supply-chain gate remains open.
3. From backend, set TEMP/TMP=`backend/.tmp`, GRADLE_USER_HOME=`backend/.gradle-user-home`, JAVA_TOOL_OPTIONS=`-Djava.io.tmpdir=<backend>/.tmp -Duser.home=<backend>/.toolchain-home`; ran `./.toolchain/gradle-8.14.3/bin/gradle.bat --no-daemon --project-cache-dir .gradle-project test`, redirected output to `foundation-test.log` — exit **0**, BUILD SUCCESSFUL, 58 s, 4 tasks executed.

Kotlin JVM plugin 2.1.20, coroutines 1.10.2, Java 21, JUnit5 through kotlin-test. Dependency fetches used public build repositories only; no business service calls. All requested caches/temp/output redirected within backend. Gradle uses a single-use daemon despite --no-daemon and stopped it at completion. PowerShell displayed NativeCommandError formatting for JAVA_TOOL_OPTIONS stderr, but actual Gradle exit was 0. Gradle warned about future Gradle 9 deprecations.

## Test evidence

`backend/build/test-results/test/TEST-com.lesouvenir.v2.foundation.FoundationTest.xml`: **5 tests, 0 failures, 0 errors, 0 skipped**; suite duration 0.074 s.

- Independent dynamic configuration on synthetic layouts (2/1/7 and 9/4/2).
- Legacy geometry/default and data-class copy characterization.
- Every enum-state pair (17×17) is accepted, then reset is IDLE.
- Strip/full pricing, landscape canonicalization, quantity sanitation and invalid input rejection.
- Simulator denied by default and accepted only through explicit enable.

These test copied source behavior and synthetic values, not measured output equivalence to executing V1. No V1 tests/build were run. No physical/network production support claims.

`backend/test-foundation.ps1` provides subsequent path-isolated runs against the downloaded V2-local Gradle distribution; script itself added after successful direct command and not yet separately executed. Build/settings/gradle.properties are wholly independent of V1. Downloaded distribution/cache/build are backend-local and ignored by backend `.gitignore`.

## Next bounded work

Architect must approve domain exposure, command authorization and immutable session snapshots before integration. Independent reviewer should verify copies and tests; then characterize pure compositor dependencies/geometry with synthetic assets. Accepted Beauty manifest and all hardware/business service authorization gates remain outstanding. No V1 edits performed; independent V1 baseline comparison not conducted.
