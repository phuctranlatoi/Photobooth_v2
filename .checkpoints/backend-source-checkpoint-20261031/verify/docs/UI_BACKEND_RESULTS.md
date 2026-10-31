# UI/backend operator increment

## Exact proposed framed API (protocolVersion 1)

Existing commands and pricing are unchanged. Two additional methods are implemented in the current Kotlin simulator dispatcher; frontend/Rust allowlist adoption requires architect review. No frontend/shared/Rust files are owned or changed here.

Both methods require backend process environment `V2_LOCAL_OPERATOR_ENABLED=true`. Default is disabled, returning error `-32010`. This is **local development process opt-in only**, NOT authentication, NOT a production Admin ACL, and must not be enabled in a public kiosk deployment. No built-in password, token, or security claim. Architect-reviewed protected operator access remains pending.

* `operator.getStatus`, params `{}` only. Returns `accessMode:"LOCAL_DEVELOPMENT_ONLY"`, `productionAdminAcl:false`, `state`, `canEditLayouts`, `simulator:true`, `layouts` (same typed LayoutMode objects as catalog), `pricingEditable:false`, and boolean `capabilities`.
* `operator.updateLayout`, params exactly `{layoutId:string,shotCount:integer,selectCount:integer,countdownSeconds:integer}`. Known layout ID only, shots 1..12, select 1..shots, countdown 0..30 independently. No session/generation/command IDs for these methods. Only authoritative `IDLE` permits edits; otherwise `-32001`. Bad/extra fields return `-32602`. Returns `{saved:true,appliesTo:"NEXT_SESSION",layouts:LayoutMode[],simulator:true}`. Repeating identical values is naturally idempotent.

Persistence: only `backend/config/local-operator-layouts.json` under V2; no caller path. Writes forced to a same-directory temporary file, then atomic replace (no non-atomic fallback), then publish in-memory settings. Store contains only layout IDs/counts/times. Restart validates before publishing, and corrupt overrides fail closed. Symbolic-link paths rejected. The checked-in fixture catalog is not overwritten. Current session is never edited; IDLE synchronization uses the existing engine monitor including capture callbacks.

Capabilities true: `simulatorStudio`, `simulatorLayoutSettings`. False: `nativeCamera`, `nativePrint`, `beauty`, `effects`, `cloudAlbumQr`, `revenue`, `paymentSettings`, `productionAdminAcl`. False features must be disabled, not shown as successful mock integrations. `device.getStatus` and `catalog.get` remain existing read APIs; pricing is read-only and calculated by copied PricingCalculator, no arbitrary base-price edit.

Studio uses existing `session.start`/setup/quantity/mock payment/capture/selection/frame/dry-run flow; no new native Studio actions or payment bypass. Dry-run keeps `printAccepted:false`, `revenueRecorded:false`; no cloud QR is synthesized.

## V1 source reference (nonsecret, read-only)

Read/grep only: `ui/screens/AdminScreen.kt`, `StudioModeScreen.kt`, and `SettingsTabContent.kt` symbol inventory. Exact Admin tabs per auditor correction: Frames/Layout/Settings/Tools/Colors/Revenue. Studio source lines 34–74 takes layouts/effects/liveView, selects layout then effect before confirmation. Admin layout callback accepts price/shotCount/countdown, while the displayed card includes selectCount. V2 does **not** infer support for production editing from those UI callbacks: only simulator counts/timing are editable; pricing remains the accepted existing algorithm. Native settings, frame management, colors/LUT management and revenue are not implemented by this increment. No `.env`, images, archives, runtime, V1 shell/build/run or live service access.

## Validation

Authorized V2-only `test installDist`: **BUILD SUCCESSFUL**, **27 tests, 0 failures** (existing 24 + 3 operator tests). Installed simulator framed smoke passed: health=ok, catalogLayouts=2, confirmSetup=SELECTING_QUANTITY, forbidden generic session.transition=-32601, EOF exit=0. Framed operator tests additionally cover default denial, explicit opt-in status and edit. Busy guard tested during setup and active capture/countdown, with unchanged persisted bytes. Restart and corrupt file covered. No live hardware/network claims. Production access-control design remains an explicit integration blocker.

Evidence: `backend/operator-test.log`, `backend/operator-installed-smoke.log`, `backend/operator-results.txt`, JUnit XML in `backend/build/test-results/test`. Installed `backend/build/install/backend/lib/lesouvenir-v2-backend-foundation.jar` SHA-256: `4A3743B7CFEA7A686A63AF5D3C3392ACC63E7249BC7D580C4B1849075317D8F8`. Distribution refreshed by final successful installDist, not stale. Initial PowerShell script invocation treated Java's informational stderr as terminating error; rerun directly with preserved native exit and V2-local cache/temp succeeded. No V1 modifications or commands.
