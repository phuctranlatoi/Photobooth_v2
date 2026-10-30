# PROGRESS.md

## Independent status (2026-10-30)

- **Overall gate: FAIL / BLOCKED.** Task1 bridge and Task2 simulator are independently verified narrowly; no hardware validation, packaging or installer proof.
- Initial docs `01`, `02`, `03`, `09` are unreliable as implementation authorities; see `AUDIT_CORRECTIONS.md`.
- The consolidated baseline is `FEATURE_PARITY_MATRIX.md`, informed by specialist docs `04`–`08` and `UI_SCREEN_CONTRACTS.md`.
- Inactivity auto-print is confirmed at V1 controller lines 291–310; contrary claims are rejected.
- Independent V2 command `backend/test-foundation.ps1` completed exit 0: 5 tests, 0 failures/errors/skips. Scope is layout/pricing/unrestricted legacy state/simulator authorization only.
- **Backend test suite now 22 tests**, independent `test --rerun-tasks` exit 0 in 53s; includes simulator and disabled legacy-port tests, not hardware evidence.
- Task2 mounted React two-layout simulator passed at emulated 1280×800 and 1920×1200; this is not physical touch. Canon, webcam, Hot Folder runtime, DNP, PayOS, Neon, Cloudinary, Beauty model, physical touchscreen and installer remain unverified.
- **Gradle 8.14.3 publisher checksum retrieved over HTTPS and exactly matches local ZIP** (SHA-256: BD71102213493060956EC229D946BEEE57158DBD89D0E62B91BCA0FA2C5F3531). Signature/transitive dependency provenance remains a separate broader supply-chain concern.
- **Desktop bridge independent review PASS-SIMULATED (narrow Task 1):** `docs/DESKTOP_BRIDGE_INDEPENDENT_REVIEW.md` — CDP harness exercised **actual mounted React DOM → Tauri `health_check` → installed Kotlin/JVM (PID 17520, JVM 21.0.12, protocol 1, simulator true, uptime 639 ms)**. Process ancestry verified: `java.exe` (17520) → `cmd.exe` (34580) → host (24068). Native `CloseMainWindow()` returned **True**, host exited **0**, JVM PID 17520 **terminated**. Full output: `tests/desktop-bridge/results/independent-cdp-health-close.log`.
- **Live WebView invoke + normal-close child cleanup RESOLVED for exact tested scenario** (CDP harness, not UIA). Abrupt parent kill / hung child / `taskkill /T` fallback **NOT TESTED**.
- **Task2 narrow PASS-SIMULATED:** independent framed JVM two-layout files/idempotency/cancel/timeout/stale tests and mounted React WebView two-layout/reload/delivery/reset/close test passed. See `SIMULATOR_INDEPENDENT_REVIEW.md`.
- **Task3 partial only:** disabled camera/printer ports compile and denial/fake tests pass; Canon is incomplete and no camera/printer hardware was touched. See `HARDWARE_PORT_INDEPENDENT_REVIEW.md`.
- All safety/hardware/Beauty licensing gaps preserved (see `BLOCKERS.md` B-001..B-005, B-004 Tauri+JVM+JNA POC planned).

### Next gate work

Complete Hot Folder readiness/webcam/Canon lifecycle code and offline tests, resolve Canon/ONNX licenses, then separately authorize read-only hardware discovery and controlled device validation. Packaging/Admin/production adapters remain later gates.
