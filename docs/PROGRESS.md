# PROGRESS.md

## Independent status (2026-10-30)

- **Overall gate: FAIL / BLOCKED.** (No hardware, no simulator session, no packaging, no installer)
- Initial docs `01`, `02`, `03`, `09` are unreliable as implementation authorities; see `AUDIT_CORRECTIONS.md`.
- The consolidated baseline is `FEATURE_PARITY_MATRIX.md`, informed by specialist docs `04`–`08` and `UI_SCREEN_CONTRACTS.md`.
- Inactivity auto-print is confirmed at V1 controller lines 291–310; contrary claims are rejected.
- Independent V2 command `backend/test-foundation.ps1` completed exit 0: 5 tests, 0 failures/errors/skips. Scope is layout/pricing/unrestricted legacy state/simulator authorization only.
- **Backend test suite now 10 tests** (5 foundation + 3 bridge health + 2 additional) exit 0; not stale 8.
- No UI, Canon, webcam, Hot Folder runtime, DNP, PayOS, Neon, Cloudinary, Beauty model, touchscreen, or installer test has passed.
- **Gradle 8.14.3 publisher checksum retrieved over HTTPS and exactly matches local ZIP** (SHA-256: BD71102213493060956EC229D946BEEE57158DBD89D0E62B91BCA0FA2C5F3531). Signature/transitive dependency provenance remains a separate broader supply-chain concern.
- **Desktop bridge independent review PASS-SIMULATED (narrow Task 1):** `docs/DESKTOP_BRIDGE_INDEPENDENT_REVIEW.md` — CDP harness exercised **actual mounted React DOM → Tauri `health_check` → installed Kotlin/JVM (PID 17520, JVM 21.0.12, protocol 1, simulator true, uptime 639 ms)**. Process ancestry verified: `java.exe` (17520) → `cmd.exe` (34580) → host (24068). Native `CloseMainWindow()` returned **True**, host exited **0**, JVM PID 17520 **terminated**. Full output: `tests/desktop-bridge/results/independent-cdp-health-close.log`.
- **Live WebView invoke + normal-close child cleanup RESOLVED for exact tested scenario** (CDP harness, not UIA). Abrupt parent kill / hung child / `taskkill /T` fallback **NOT TESTED**.
- **Capture/Compositor simulator tests AWAITING BACKEND IMPLEMENTATION** (`SimulatorIpcServer.kt` extending `HealthBridge`). Contract `SIMULATOR_IPC_CONTRACT.md` **NOT FINALIZED** — reviewer mismatch open; implementers reconciling wire format.
- **Task2 (simulator session implementation) IN PROGRESS** — Backend Engineer implementing `SimulatorIpcServer`, Frontend Lead wiring bridge/UI. Contract draft discrepancies remain integration blocker.
- All safety/hardware/Beauty licensing gaps preserved (see `BLOCKERS.md` B-001..B-005, B-004 Tauri+JVM+JNA POC planned).

### Next gate work

Backend Engineer completes `SimulatorIpcServer` (health + 14 simulator methods), Frontend Lead wires `bridge.ts` + UI against `simulator-contract.ts`, Tester-Reviewer runs simulator session tests. Then: Admin gaps, mock-default adapters, synthetic compositor/Hot Folder tests, accepted Beauty manifest/license evidence, then separately authorized hardware validation.
