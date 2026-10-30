# Frontend / desktop bridge evidence

2026-10-30. Scope: `frontend/`, `src-tauri/`, this report. Architecture proof only, not customer flow or hardware support.

## Implemented

- React 19, strict TypeScript, Vite 7, Tailwind 4, restrained Motion entrance with reduced-motion support; local system fonts and selected Lucide icons. Ivory editorial Welcome and explicit diagnostic panel follow Designer tokens. No external images/fonts or customer assets.
- Customer Start remains disabled with visible integration-pending explanation. No invented session/payment/capture methods, fake Live View, photo processing or service requests. Browser-only mode reports desktop-host unavailable; it does not simulate a response.
- Manual diagnostic invokes only Tauri `health_check`. Touch double-click latch and pending/failed/success states; result is explicitly a point-in-time roundtrip, not continuous health. No backend notification contract invented.
- Rust host uses actual installed `backend/build/install/backend/bin/backend.bat --simulator` over private piped stdin/stdout. 4-byte big-endian framing, <=1 MiB before allocation, strict UTF-8, response correlation/version and health-shape checks, 10-second read deadline. Single queued response and fixed-size discarded stderr prevent unbounded logs. No frontend shell capability or arbitrary command/path parameter.
- Requires explicit `V2_JAVA_HOME` because machine `JAVA_HOME` points to Java 11 while installed backend requires Java 21. Launcher path is fixed to this V2 development workspace. No claim that `.bat` works as Tauri `externalBin`: it is **not** configured as one. Backend installation/Java bundling remain separate packaging work.
- Normal host exit closes child stdin and waits up to three seconds; fallback kills Windows launcher process tree, not only cmd.exe. Child EOF/crash causes error and drops the failed bridge; next manually requested check may spawn a fresh health-only child. No automatic uncertain-request retry. Abrupt host termination/job-object ownership remains unverified.
- Tauri bundling disabled. WebView data directory, Rust target/cache, npm cache, and temp paths configured inside V2. Hardcoded development data/launcher paths intentionally not presented as release configuration.

## Commands and evidence

All commands ran from V2. No V1 commands/access, hardware or production actions. Public dependency downloads only. Tool-discovered Node v24.11.0, npm 11.6.1; direct installed Rust MSVC toolchain used with V2 CARGO_HOME rather than rustup installation/global changes.

| Invocation | Exit | Evidence |
|---|---|---|
| `npm.cmd install --cache .npm-cache --no-audit --no-fund` | 0 | `frontend/install.log`, pinned manifest plus lockfile; 262 packages |
| `npm.cmd run test` (final rerun) | 0 | `frontend/test.log`; 4 component tests passed: blocked Start/no preview, rapid-check once semantics/result, EOF failure without fake success, clearing stale success on subsequent failure |
| `npm.cmd run build` | 0 | `frontend/build.log`; strict typecheck and Vite production build, 322.73 kB JS before gzip |
| `cargo test --bins` initial | 101 | `src-tauri/cargo-test.log`: Tauri Windows resource build required missing icon |
| `cargo test --bins` after generating own solid-color ICO | 0 | `src-tauri/cargo-test-final.log`; no third-party artwork |
| Direct execution of both `target/debug/deps/*` test binaries | 0 | Each reports 3 passed framing tests (same shared module in two binaries): bounds/EOF, fragmented reads, valid frame |
| Initial `cargo run --bin bridge-probe` / direct probe | 101 | EOF: cmd quoting of launcher path failed; corrected to fixed `backend.bat` in installed launcher directory |
| `cargo build --bins` after launcher fix | 0 | Both real Tauri host and probe built in 12.02 seconds |
| Direct `target/debug/bridge-probe.exe` after fix | 0 | Actual health JSON: PID 29528, JVM 21.0.12, protocol 1, simulator true, uptime 201 ms; only health.check available. EOF shutdown completed within deadline |
| Launch built Tauri exe, wait 5 seconds, CloseMainWindow | 0 | Host PID 2144 alive with native window handle 658262; CloseMainWindow true; host exited 0 without forced termination |

Each npm command set TEMP/TMP to `frontend/.tmp`, npm cache to `frontend/.npm-cache`. Rust command sets CARGO_HOME=`src-tauri/.cargo-home`, CARGO_TARGET_DIR=`src-tauri/target`, TEMP/TMP=`src-tauri/.tmp`, RUSTC/RUSTDOC/PATH to the existing installed MSVC toolchain binaries. No global toolchain install performed.

## Running after successful Rust build

From `src-tauri/`, with those same Rust cache/temp variables, set `V2_JAVA_HOME` to `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot`. `cargo run --bin bridge-probe` exercises the **same Rust bridge module** against actual installed JVM launcher and EOF shutdown without a GUI. `cargo run --bin le-souvenir-v2` opens the Tauri window using previously built `frontend/dist`; tap “Check JVM bridge”. No network server is required for built frontend. Development Vite is loopback port 1420 only.

## Remaining acceptance / review request

UI Designer and Tester-Reviewer: please review owned files, visual/touch behavior and health-only lifecycle evidence before milestone closure. No independent review has yet been recorded here. The native window startup/close and Rust-to-real-JVM bridge were exercised separately. **React button → Tauri invoke → JVM in the live WebView has not yet been independently exercised**, and window-close with an active JVM requires that additional test. No screenshot/visual usability review performed. Browser geometry at six DPI-derived viewports, actual touchscreen/scaling, long-session leaks, forced-parent-death cleanup, clean Windows packaging, bundled Java, native DLLs, Canon, DNP, print, payment/cloud/database and full session flow remain **NOT TESTED** by this slice. No independent V1 baseline comparison collected; only this task's lack of V1 access/mutation is asserted.
