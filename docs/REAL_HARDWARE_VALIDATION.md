# Real hardware validation — V2

## Milestone status (2026-11-01)

**Not hardware-validated.** The two Canon native DLLs and the V1-safe command source were copied into V2. A reflective fail-closed Canon adapter and a V2-configured Hot Folder adapter have been added. No native DLL initialization/discovery test or physical Canon test was run; no camera was opened and no camera settings were changed. The requested offline Gradle test could not be launched because the specified `.toolchain/gradle-8.14.3/bin/gradle.bat` does not exist in this checkout.

## Source mapping

- Canon lifecycle/reference: V1 `src/main/kotlin/com/phuctran/photobooth/desktop/services/NativeEosCaptureService.kt` (constructor/session open, 2-second reconnect, aperture probe, Live View polling, `SafeShootCommand` capture and output processor).
- Defensive shutter command copied without modification: V1 `src/main/java/edsdk/api/commands/SafeShootCommand.java`.
- Canon DLLs copied from V1 `app-resources/windows/EDSDK_64/` to V2 `backend/EDSDK_64/` and `backend/app-resources/windows/EDSDK_64/`.
- V2 adapter code: `backend/src/main/kotlin/com/lesouvenir/v2/camera/real/CameraPipeline.kt`.
- Runtime dependency is `com.bitplan:edsdk4j:0.0.1`; JNA is also declared. EDSDK is native Windows x64; package only when Canon SDK redistribution/license terms are confirmed. Copying binaries here does not establish commercial redistribution rights.

## Known implementation gaps

- Reflective API signatures and nested enum resolution in `CanonCameraAdapter` have not been compiled or smoke-tested against edsdk4j. It does not yet expose ISO/aperture/shutter controls or reliably start/end EVF mode. Its configured native path currently assumes `user.dir/EDSDK_64`; packaging must provide and verify this exact location.
- V1's accepted final output path goes through `DesktopImageProcessor.saveBoothCapture` (V1 service lines 205–219); that function owns original backup / processing behavior. The new adapter currently writes a mirrored JPEG directly as `original-shot-$shotIndex.jpg` and does not reproduce V1's full processing/backup pipeline. Do not treat this as output parity.
- Hot Folder adapter accepts an explicit directory but does not itself enforce a V2-root isolation policy; production wiring must validate paths and use an exclusively owned V2 folder. Source readiness is checked by stable size, but not full JPEG integrity/digest deduplication.
- Preview encoding is JPEG, 640px-bounded for Canon and ~30fps, but manager callbacks do not enforce a latest-frame queue. Operator-profile source persistence and status callback contract remain to be wired.
- No new adapter unit tests were completed. Existing test count/result is unknown because Gradle wrapper/toolchain path was missing.

## Validation gates

A. Simulator and isolated synthetic Hot Folder tests: existing synthetic harness is under `backend/src/main/kotlin/com/lesouvenir/v2/camera/simulator/` and `camera/legacy/IsolatedHotFolder.kt`; not rerun here.
B. Native DLL initialization/discovery smoke: NOT RUN.
C. Controlled physical Canon connection/capture: NOT RUN; requires explicit user approval and confirmation the camera is not held by V1. Never infer C from A/B.

Timing references from V1: reconnect/status check period 2 seconds; preview request interval 30ms (~30fps); V1 photo transfer command gives three shutter attempts and sleeps 1 second between failed attempts; V1 Hot Folder waits up to 15 seconds polling every 100ms. These are reference values, not verified V2 latency measurements.

Recovery expectations: adapter reports disconnected after session/property/preview/capture failures; capture throws instead of substituting synthetic output; manager serializes capture. Native disposal and close-during-capture behavior still require a real SDK verification pass.

V1 remained read-only and untouched. No physical hardware or production Hot Folder was accessed.
