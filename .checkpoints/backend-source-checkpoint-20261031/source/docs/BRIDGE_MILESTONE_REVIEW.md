# Independent bridge milestone review

**Date:** 2026-10-30  
**Verdict:** **PASS-AUTOMATED / PASS-SIMULATED for a health-only runnable architecture proof; FAIL as a session, packaging, hardware, or release gate.**

## Independently established

1. V2 backend compiles/tests and produces `installDist`; 8 tests pass (5 foundation, 3 bridge).
2. The installed Windows launcher starts a real Java 21 JVM in explicit `--simulator` mode, accepts private inherited stdin/stdout frames, returns validated `health.check`, and exits on stdin EOF.
3. React component tests pass and production assets build under strict TypeScript.
4. Rust/Tauri binaries compile. The standalone Rust bridge probe uses the same `bridge.rs` module as the host and completed a real Rust → launcher → JVM roundtrip and EOF shutdown.
5. Customer Start is disabled; UI repeatedly labels the build architecture proof/simulator/health-only and makes no hardware or production request.

This is actual runnable-process evidence, not merely mocks. It is still **not evidence that a WebView button invoked Tauri and reached the JVM**. Native-window launch and standalone bridge-probe evidence are separate until an automated or observed live WebView invoke test is recorded.

## Exact independent commands and exits

All working directories, caches, temp, build outputs and downloaded checksum evidence were under V2.

| Working directory / command | Exit | Result |
|---|---:|---|
| `backend`: V2-local Gradle `--no-daemon --project-cache-dir .gradle-project test installDist` with backend-local TEMP/TMP/GRADLE_USER_HOME | 0 | `BUILD SUCCESSFUL in 9s`; 6 tasks up-to-date; XML confirms Foundation 5 + Bridge 3 tests |
| `frontend`: `npm.cmd run test` | 0 | 1 file, 4 component tests passed |
| `frontend`: `npm.cmd run build` | 0 | TypeScript + Vite success; JS 322.73 kB / 103.56 kB gzip |
| `src-tauri`: bare `cargo test --bins` | 1 | Environment diagnostic only: `cargo` was not on PATH; no source failure |
| `src-tauri`: explicit installed MSVC cargo/rustc with V2 CARGO_HOME/TARGET/TEMP, `cargo test --bins` then `cargo build --bins` | 0 | Both profiles compiled. Cargo emitted no individual test execution lines in this invocation, so this proves compilation but is **not counted as a fresh Rust unit-test pass** |
| `src-tauri`: `target/debug/bridge-probe.exe` with explicit `V2_JAVA_HOME` | 0 | Real health response: PID 18028, JVM 21.0.12, protocol 1, simulator true, uptime 124 ms, only `health.check`; EOF shutdown within deadline |
| `src-tauri`: HTTPS download of Gradle publisher `.sha256` to `.tmp`, compare with local ZIP | 0 | Publisher and local SHA-256 both `BD71102213493060956EC229D946BEEE57158DBD89D0E62B91BCA0FA2C5F3531` |

No V1 command/build/write, hardware access, secrets, payment, database, cloud, customer images, or production action occurred.

## Framing and validation review

### Backend

- Four-byte unsigned big-endian length, maximum 1 MiB before allocation (`IpcMain.kt:64-83`). Zero length reaches strict JSON rejection. Oversize and truncated frames return one bounded error and terminate, avoiding payload resynchronization ambiguity.
- `readFully` handles fragmented payloads. UTF-8 is strict; BOM, trailing JSON, duplicate fields, extra keys, non-string ID, nonliteral numeric protocol 1, nonempty/nonobject params and unknown methods are rejected (`:24-61`).
- Requests expose only `health.check`; process requires exactly `--simulator` (`:88-93`). stdout is framed protocol only in the exercised child test.
- Error ID `""` when unavailable and fatal-framing close policy remain contract decisions, not generic JSON-RPC semantics.

### Rust host

- Response frame length is checked before allocation, then strict UTF-8/JSON parsing and correlation/version/health-shape validation occur (`bridge.rs:5-12,36-46`).
- Response JSON duplicate-key rejection is not explicit: `serde_json::from_str` accepts JSON object semantics rather than the backend's duplicate-key policy. The trusted child boundary makes this lower risk for health proof, but protocol validation should be symmetric before broader methods.
- The private channel is inherited pipes, with no listening TCP/pipe endpoint and no frontend shell/arbitrary-path capability. This is a meaningful exposure reduction.
- `V2_ARCHITECTURE.md:92-125` describes HMAC and named-pipe contracts that are **not implemented by this slice**. Private inherited pipes provide process confinement for health, but do not satisfy that broader documented health/session contract. The architecture document must be ratified or revised before adding commands.

## Timeout and cleanup review

- Host waits 10 seconds for a response (`bridge.rs:42`). On check failure, `main.rs:11-12` removes the bridge; Drop closes stdin, waits up to 3 seconds, then invokes Windows `taskkill /T /F` and waits (`bridge.rs:48-57`). No uncertain automatic retry occurs.
- Normal EOF cleanup was observed through the real probe. Backend real-child JUnit also checks returned JVM PID termination.
- Forced timeout, hung launcher, kill-tree fallback, abrupt Tauri termination, Windows job-object containment, and parent death were **not independently exercised**. `taskkill` fallback availability/error is ignored and `shutdown()` returns false after forced cleanup by design.
- stderr is drained into a fixed buffer and discarded, preventing accumulation but also eliminating diagnostics. Production needs bounded, redacted operational diagnostics without protocol pollution.
- The Rust reader thread has one-response backpressure and stops on fatal read. Health checks are serialized by a mutex. This is adequate for one health method, not an event/multiplexing proof.

## UI safety review

- `App.tsx:20-34` visibly says architecture proof, simulator health only, no live preview/device/customer/production actions, and independent development build.
- Start is disabled with an explicit integration-pending reason (`:22`). Diagnostic rapid taps are latched (`:12-17`) and stale success is cleared before each attempt.
- Browser mode refuses to simulate (`bridge.ts:4-7`).
- Tests use an injected fake bridge for UI state only; they do not exercise Tauri invoke. No screenshot, real touch, scaling, overflow, screen reader, or live WebView test was conducted.

## Path and production-isolation review

- Source bridge launcher path is fixed from `CARGO_MANIFEST_DIR` parent into V2 `backend/build/install/...`; no V1 path was found in reviewed app code.
- `tauri.conf.json` uses a V2-only WebView directory and bundle is disabled.
- Backend supports health only and requires simulator. No camera, print, payment, Neon, Cloudinary, local HTTP server, or session command exists.
- Hardcoded development paths and external Java 21 requirement make this nonportable and nonpackageable by design.

## Gate decision

The **architecture health milestone is accepted narrowly**: React assets, native host binaries, a private framed Rust bridge, and an actual Java child are independently buildable/runnable in V2. The following remain mandatory before calling it a desktop end-to-end bridge:

1. Exercise React button → Tauri `invoke` → Rust → real JVM in the live WebView and capture returned health state.
2. Close the native window while that JVM is active and prove the JVM PID terminates.
3. Exercise forced timeout/hung-child/tree-kill and abrupt-parent-death behavior.
4. Ratify the actual health envelope/private-pipe security contract versus the conflicting HMAC/named-pipe architecture document.
5. Bundle/select Java and remove development absolute-path assumptions.

Full session, hardware, business, touch, installer and release gates remain failed/blocked.
