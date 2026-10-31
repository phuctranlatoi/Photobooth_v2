# Mounted Tauri UI acceptance suite

This directory is intentionally independent of frontend unit tests. The acceptance run must attach to the **already-running Tauri WebView CDP endpoint**; it must not start Chromium, Vite, Tauri, a second process on port 9223, or call backend RPC directly.

## Status

Preparation only. Execution is blocked until the redesign owner announces that the mounted frontend harness is final and provides the existing CDP endpoint. Current V2 `frontend/src/App.tsx` is an architecture-proof simulator, not the final customer/Admin UI.

## Required run matrix

Run every customer and Admin/Studio route at:

* 1280 × 800
* 1920 × 1200

For each state capture a full-window screenshot and check:

* no horizontal document overflow and no clipped actionable control;
* minimum touch target 44 × 44 CSS pixels (48 × 48 preferred);
* visible/understandable disabled reason for unsupported operator actions;
* loading, empty, and error states;
* repeated taps do not duplicate transitions/actions;
* kiosk back/cancel behavior and customer escape from modal states;
* camera preview preserves aspect ratio;
* text remains visible without overlap or truncation that hides meaning.

Navigation must be performed through mounted UI controls only. CDP evaluation may inspect DOM/layout and take screenshots, but must not invoke Tauri commands, mutate React state, write storage, or issue bridge RPC.

## Customer journey coverage

Idle/start (including five-tap Admin gesture), Studio layout then effect, quantity, payment and back/cancel, prepare, live view/countdown/capturing, selection and preview, frame editing, Confirm & Print, printing, delivery/QR/finish, plus recovery and out-of-service where the mounted application exposes them.

## Admin/Studio coverage

The six source-observed Admin tabs are Frames, Layouts, Settings, Tools, Colors, and Revenue. Studio is the separate customer setup flow, not a replacement for Tools. Unsupported frame, native settings, Tools, Colors/LUT, and revenue actions must be visibly disabled with reasons rather than reported as working. Layout edits are limited to the documented local simulator contract.

## Safety and regression invariants

The run may use only V2 fixtures/output. It must preserve simulator source files and verify their hashes before/after. It must also cover composition idempotency, original-file immutability, reload recovery, and close/reopen recovery through safe simulator UI paths. No result may be labelled real hardware.

Visual PASS requires independent screenshot review by a designer; geometry automation alone is insufficient.

## Executable runner

`node tests/ui-transformation/mounted-tauri-cdp.mjs` attaches to an already-running Tauri WebView at `V2_EXISTING_CDP_URL` (default `http://127.0.0.1:9223`). It never launches or closes the host. Do not run it until the frontend owner declares the shared harness ready.

Operator access is default-deny and the backend returns `-32010` for both read and edit methods. The exact opt-in is inherited by the already-running host/JVM as `V2_LOCAL_OPERATOR_ENABLED=true`. The runner never sets or activates it. It may be used only in an explicitly isolated, non-production V2-local developer fixture; it is not authentication, a real Admin ACL, or permission for public kiosk deployment. With no exact opt-in, the runner requires the mutation control to be disabled with a visible/associated reason.

Evidence is written below `tests/ui-transformation/evidence/`. Automated geometry and image checks require enabled targets of at least 48×48 CSS px, no horizontal document overflow, and non-empty visible images. The runner also rejects simulator text that fabricates QR/payment/physical-print success. A designer must still inspect every PNG.

The simulator is not required to expose a distinct backend `PRINTING` state or a QR. Confirm-button busy/progress DOM is valid evidence, and an explicit QR-unavailable/no-delivery-link explanation is expected. Preparation, countdown, capturing, and confirmation progress can be shorter than CDP capture latency; the runner records a missed transient as an observation and never manufactures a screenshot or converts another state into that evidence.

The operator runner expects stable semantic hooks: `operator-entry`; tabs `operator-tab-frames`, `operator-tab-layouts`, `operator-tab-settings`, `operator-tab-tools`, `operator-tab-colors`, `operator-tab-revenue`; panels with corresponding `operator-panel-*`; layout actions `operator-layout-update` and `operator-layout-revert`; and separate customer `studio-entry`. “Filters” may be a visible Colors label/alias, but its semantic tab remains Colors. Missing hooks fail acceptance; the test does not bypass UI state to compensate.

## Optional test-owned host launcher

If no persistent frontend-owned host is available after final notification, run `node tests/ui-transformation/launch-mounted-run.mjs`. It refuses to start when port 9223 already has a listener, uses the existing native debug executable without building/installing, exposes CDP on loopback for that process only, runs the attach-only suite, requests graceful window close, checks/terminates only the captured test-owned process tree, and records cleanup under `tests/ui-transformation/.tmp/last-launch-cleanup.json`.

Default mode explicitly inherits `V2_LOCAL_OPERATOR_ENABLED=false`. A dedicated mutation run requires both `--local-operator --nonproduction-isolated`; that launches a separate host with exact `true`, snapshots the V2-local operator override, and restores it byte-for-byte (or removes a newly created file) after cleanup. Never use those flags with a production/public kiosk or shared operator configuration. The launcher does not provide authentication and does not make an ACL claim.
