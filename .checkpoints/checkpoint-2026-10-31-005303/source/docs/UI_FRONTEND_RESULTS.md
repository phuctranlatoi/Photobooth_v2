# Connected customer and operator UI increment

Implemented in the existing V2 React/Tauri application; no replacement state orchestration or local business FSM. V1 untouched. No production services, hardware, secrets or customer images accessed.

## Actual screens

Branded Welcome and separate fixture collection; backend-selected layout Studio (effects explicitly unavailable); quantity and quote; explicit simulator payment without QR; preparation; synthetic live/countdown/capture rail; ordered original selection; visual frame gallery with Kotlin composition; authoritative dryrun confirmation and pending indicator; delivery/completion/reset; backend recovery failure notice. Operator workspace includes the six source-mapped tabs Frames, Layouts, Settings, Tools, Colors, Revenue. Unsupported operations have disabled controls and reasons, not fabricated records or saves. Bridge diagnostics remain reachable.

Shared Stage/Unavailable components and ivory/charcoal/champagne/rose styles added. Reduced motion suppresses motion. Backend counts, timing, selection, composition, reset and command dedup remain authoritative. Hidden customer UI remains mounted while operator workspace is open; backend inactivity continues, not paused or bypassed.

## Contracts / safety

Existing simulator_request methods unchanged. Rust host permits exactly two additional methods: operator.getStatus and operator.updateLayout. Backend local development opt-in is inherited from externally supplied process environment only; host does not enable it. Default denied is rendered honestly. Only IDLE layout counts/countdown can be saved; all production settings remain unavailable. This is not a production Admin ACL.

## Evidence executed

- npm test -- --run: 10 tests passed across three files.
- npm run build: TypeScript strict + Vite passed.
- cargo test --offline: completed; existing unused_mut warning in bridge.rs.
- cargo build --offline: passed using V2 CARGO_HOME and TEMP.
- node frontend/verify-simulator.mjs (run from frontend): actual mounted Tauri WebView CDP flows at 1280×800 and 1920×1200, real DOM clicks, two fixture layouts, payment Back, capture, selection, frame, composed preview, reload recovery, dryrun, finish. Host exit 0 and owned JVM terminated.
- Dedicated test process with V2_LOCAL_OPERATOR_ENABLED=true: six operator tabs at both sizes, actual layout save, status reload, restore original strip-2 values 3/2/1. No public kiosk default changed.

Log: frontend/simulator-fullflow.txt. Screenshots: frontend/simulator-evidence/{welcome,catalog,setup,quantity,payment,live,selection,frames,print-preview,delivery}-{0,1}.png; operator-{frames,layouts,settings,tools,colors,revenue}-{1280,1920}.png and operator-layout-saved.png. These are synthetic fixtures, not real hardware output. CDP port 9223 released after run.

## Review handoff / remaining gaps

Run `node verify-simulator.mjs` from frontend for default-denied operator evidence; explicitly set V2_LOCAL_OPERATOR_ENABLED=true only for the dedicated development test to exercise save/restore. Launcher owns and closes host/JVM. Tester attach-only harness may use semantic simulator data-phase, command data-testid, operator-entry, operator-tab-<name>, layout-<id>-<field>/save hooks.

UI Designer and Tester review requested. This is NOT full production UI completion: production Admin authorization, native camera/printing/settings, frame/event management, measured template operations, LUT/Beauty/effects controls, live payment and cloud QR, revenue records/adjust/void remain unsupported. Additional Windows DPI/200% text, long-session, failure injection and accessibility review remain. PRINTING rendering exists defensively; current simulator exposes actual busy command feedback rather than verified physical print progress. Minor compact viewport overflow still needs reviewer measurement; no unsupported functionality is claimed complete.
