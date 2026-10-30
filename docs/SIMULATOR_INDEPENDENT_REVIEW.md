# Simulator independent review

**Status: FAIL — installed black-box runtime does not match the handed-off safe API.** Task 2 has not passed.

## Independent installed-JVM execution — 2026-10-30

No Gradle/build/install command was run. From V2 root, against the existing installed distribution:

```powershell
$env:V2_JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot'
node .\tests\simulator\framed-jvm-regression.mjs *>&1 |
  Tee-Object '.\tests\simulator\framed-jvm-regression.log'
exit $LASTEXITCODE
```

Result: exit **1**:

```text
Error: ASSERT: session.transition expected -32601, got -32001
```

The process reached the real framed JVM and received a structured backend error, but the installed runtime recognized the prohibited generic `session.transition` method and rejected only the requested target/state with `-32001`. The handoff (`docs/SIMULATOR_SESSION_RESULTS.md:37`) and current source (`SimulatorSessionEngine.kt:99,199-207`) require unknown/prohibited `session.transition` to return `-32601`. This is a capability mismatch between the installed executable under test and the current handoff/source, so the harness stopped before either full file flow. It did not reinterpret `-32001` as acceptable because recognizing an arbitrary-transition command expands the exposed API.

The harness `finally` path closed stdin and the command returned without its ten-second cleanup timeout; no orphan warning was emitted. Full two-layout, duplicate output-file hash, timeout, and reset assertions remain **NOT-RUN** due to fail-fast behavior. Evidence: `tests/simulator/framed-jvm-regression.log`.

Required mitigation: backend owner must republish/identify an installed distribution built from the handed-off safe-method source, then the independent reviewer reruns the same black-box command. Reviewer will not run Gradle concurrently or weaken the unknown-method assertion.

## Independent harness prepared

`tests/simulator/framed-jvm-regression.mjs` is a black-box test of the actual installed Kotlin/JVM process over its four-byte big-endian framed stdio protocol. It does not import backend implementation classes, call a Rust probe, use hardware, or contact production services. It will be run only after the backend owner confirms the installed distribution is ready; no concurrent Gradle/build/install mutation has been performed by the reviewer.

Planned assertions against actual files and responses:

- fetch both layouts from `catalog.get` rather than hardcoding counts/countdowns;
- complete both configured sessions through capture, full original files, exact selection, frame composition, manual dry-run, `DELIVERY`, and finish/reset;
- parse every original JPEG's SOF header to verify configured count and reported 1920×1080 dimensions, then verify SHA-256 stability before/after composition. This is not a full image decode; backend ImageIO tests must independently establish decodability;
- parse PNG signature/IHDR output headers and verify strip/grid composition dimensions and 2452×3658 paper output; full output decoding remains covered by separate backend ImageIO tests;
- verify duplicate dry-run confirmation returns the same result with no print acceptance or revenue;
- hash the full composition and print files immediately before and after duplicate confirmation and require byte-identical outputs;
- reject manual confirm with a new command ID after delivery;
- reject cancellation in guarded states, allow it in `SELECTING_PHOTOS`, and reject an arbitrary transition to `DELIVERY`;
- verify inactivity completion reports `userConfirmed=false`, `printAccepted=false`, and `revenueRecorded=false`;
- require clean backend EOF shutdown and reject unsolicited stdout frames.

The exact `catalog.layouts.length === 2` assertion is explicitly a fixture-configuration check for this handoff, not a universal product layout-count requirement. Original JPEG header dimensions are derived from `catalog.captureWidth`/`captureHeight`, not hardcoded. The harness also requires stale-generation rejection (`-32004`) and verifies finish clears selected indices, frame identity, and all composition/print previews so a later session cannot inherit stale selection/frame state.

### UUID artifact safety adaptation

The pending rerun no longer assumes compatibility aliases named `composition.png` or `print-image.png`. Immediately before and after `frame.select`, it compares the session directory and requires exactly one newly published `composition-<UUID>.png` and one `print-image-<UUID>.png`; that frame-selection pair is checked separately for header dimensions and rendered-preview publication. Pre-existing/temp/obsolete generations are not selected as current.

Current source authority shows the first `print.confirmDryRun` legitimately recomposes. Therefore the harness separately compares directory sets immediately before and after the first confirmation, requires exactly one new confirmed UUID pair, and treats that new pair as authoritative for delivery. Only after the first confirmation does it snapshot hashes and artifact names. It then:

- parses both the frame-selection pair and confirmed authoritative pair's PNG signature/IHDR dimensions;
- checks the authoritative snapshot's composition/print preview fields are JPEG data URLs with valid dimension headers (correlation is limited to publication/state timing because scaled JPEG pixels cannot be hash-equal to source PNGs);
- hashes the confirmed authoritative pair immediately before and after duplicate dry-run confirmation;
- requires no additional UUID composition/print artifacts to appear on duplicate confirmation.

The harness does not assert that first confirmation reuses the frame-selection pair. This adaptation does not claim full image decoding or pixel equivalence; backend ImageIO tests remain the full-decode evidence.

## Authority and contract mismatch found before execution

Per task direction, the narrow backend implementation and source rules are treated as execution authority. `docs/SIMULATOR_IPC_CONTRACT.md` is internally inconsistent with current implementation:

- Contract lines 176–180 specify `session.confirmSetup`, while the source inspected during initial preparation implemented narrowly guarded `session.transition` and had no `session.confirmSetup` schema. The harness now requires the requested named `session.confirmSetup` and requires generic `session.transition` to be rejected with `-32601`; it will not run until the installed backend implements that safe surface.
- Contract lines 456–459 explicitly say `session.transition` and `capture.abort` are not in the simulator, while engine lines 132–144 and 209–212 implement both.
- Contract lines 160 and 305–312 say `FINISHED`; engine lines 150,193 return `DELIVERY`.
- Contract lines 350–353 say timeout auto-print is false and describe differing state behavior; engine lines 67–72 and 193 compose files and enter `DELIVERY` with `userConfirmed=false`. No physical print/revenue occurs, but “auto-print” wording is ambiguous.
- Frontend shared types/comments are therefore stale and are not used as the harness oracle.

These discrepancies require architect signoff/document correction; the reviewer will not silently normalize them.

## Pending React full-flow test

An actual mounted React CDP full-flow test remains **NOT-RUN** until frontend/backend integration is declared ready. It must drive rendered controls (not direct `invoke`), exercise both catalog layouts, inspect rendered progress/preview/delivery/reset, correlate resulting V2 files, and close the native window without leaving the JVM. Task 1's independent health/lifecycle PASS remains separate and is not extended to Task 2.

## Safety

Only V2 test/docs files were added. No V1 command or data access, hardware/camera/physical print, PayOS, Neon, Cloudinary, production database/network, deployment, Gradle, or install mutation was performed.
