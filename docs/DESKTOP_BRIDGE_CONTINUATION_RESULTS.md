# Desktop bridge continuation — Task 1

2026-10-30. Existing React/Tauri/private framed Kotlin bridge retained. No backend edits, hardware or production actions; V1 untouched.

## Actual mounted WebView evidence

`frontend/verify-webview.mjs` launches the real Tauri executable with **opt-in, loopback CDP debugging** (environment variable on the test process only). It discovers the actual WebView, waits for mounted React, clicks the existing DOM button twice synchronously, reads rendered DOM, validates its PID against Windows process ancestry, closes the native window and checks JVM termination. It never calls `invoke`, Rust commands or backend methods directly. Debugging is not enabled in app configuration.

Successful command (frontend working directory): `cmd /d /c "node verify-webview.mjs > webview-verification.txt 2>&1"`, exit **0**. Full captured DOM and process evidence: `frontend/webview-verification.txt`.

- Host PID **25184**, actual WebView URL `http://127.0.0.1:1420/`.
- Mounted status: **JVM responded · simulator confirmed**.
- Rendered backend PID **27216**, JVM **21.0.12**, protocol **v1**, uptime **157 ms**.
- Windows corroborated `java.exe` PID **27216**, parent launcher `cmd.exe` **37100**, parent host **25184**.
- Native `CloseMainWindow`: **True**; host exit **0**; JVM PID **27216 terminated** after close. Active child existed immediately before close.

This closes the prior gap between separate native-window and Rust-probe tests. It proves one real React → Tauri invoke → Kotlin health roundtrip and normal close with active JVM, not hardware support or crash cleanup.

## Startup issue diagnosed

The existing debug executable uses Tauri's `devUrl`, **not embedded dist**. With no Vite server it opens WebView's connection-refused document; native window presence is not UI startup proof. Initial CDP attempt correctly failed `React button missing`, actual document `chrome-error://chromewebdata/`, `ERR_CONNECTION_REFUSED`. This was a launch prerequisite, not replaced with a fake page. Start Vite first for this debug binary.

`npm.cmd run dev -- --host 127.0.0.1` was started from frontend with TEMP/TMP=`frontend/.tmp` and npm cache=`frontend/.npm-cache`; server uses existing port 1420. Release/custom-protocol packaging remains unverified.

Windows UIA fallback `src-tauri/verify-webview.ps1` exited **1**: the WebView button was not exposed through UI Automation in this environment. The CDP harness above is the successful alternative.

## Tests and scope

- `npm.cmd run build`: **0**, strict TypeScript + Vite build.
- `npm.cmd test -- --run`: **0**, 4 existing component tests passed (blocked Start, once semantics, failure, stale success clearing).
- No Rust lifecycle source changes were required for the demonstrated normal close. Existing EOF + process-tree fallback retained.
- Added only the two test harnesses, captured frontend evidence and this report during Task 1. Build outputs under frontend/dist regenerated.
- Forced host kill, clean packaging, bundled JVM, hardware and production services remain untested. CDP harness is a developer tool only; never enable its debug environment in deployed kiosk.

UI Designer and Tester-Reviewer review requested for mounted UI and lifecycle evidence before milestone closure. Task 2 results will be reported separately.
