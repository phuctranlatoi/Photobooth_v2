# Camera UX integration constraints — V2 source snapshot

Scope: current V2 source and audits only; synthetic simulator, not hardware support.
Frontend reconstruction must not redesign camera services or invent a native IPC contract.

## Capture screen
- `frontend/src/Simulator.tsx:28-46,73,78` polls `session.getState` every 500 ms after the previous request completes. Render `livePreviewDataUrl` via `safeImage`; it is a synthetic JPEG data URL, not a browser webcam or Canon stream. Show an honest pending/unavailable state if absent or rejected.
- `frontend/src/shared/connected-simulator.ts:4-18` describes the current engine snapshot extension and only accepts bounded JPEG/PNG base64 data URLs (maximum 1,000,000 characters). Do not substitute URLs, full-resolution images, or fabricate preview frames. The generated contract alone is not the current snapshot authority.
- Drive LIVE_VIEW / COUNTDOWN / CAPTURING and the displayed `secondsRemaining` from backend snapshots; shot count and configured countdown come from the selected layout, never fixed UI constants. Polling can skip countdown numbers; do not infer shutter timing from animation.
- A flash, if shown, is decorative, nonblocking and reduced-motion aware. Do not delay capture or claim exact shutter synchronization: this snapshot exposes no shutter event. Do not apply Beauty to preview.
- `capture.startSequence` is available in LIVE_VIEW before the first shot; preserve command locking and disable repeat taps. An uncertain result requires status reconciliation, not automatic replay. Keep session/generation stale-response guards when restructuring.
- Capture results and final composed preview are distinct from live preview; do not label synthetic captures as real camera originals. Avoid retaining repeated frames or sending image data back over IPC.

## Operator camera settings
- Keep all native camera source controls visibly unavailable/disabled, including discovery, enumeration, selection, connection, preview, capture and settings. No mount-time probe, enumerate call, permission prompt or silent device acquisition. A selected mock/profile label must not imply a functional device.
- Do not expose native gates as ready-to-enable controls: explicit authorization is necessary but insufficient until lifecycle and approved testing are complete. Use only architect-approved versioned IPC if real integration is later authorized; do not add a frontend-only schema.

## Current limitations and recovery
- Canon: partial reflective open/live-view adaptation only; shutter, transfer, reconnect, safe lifecycle, timeout containment and verified binding are missing. Native SDK and physical tests were not performed. No production Canon support (`docs/LEGACY_CAMERA_PORT_RESULTS.md:9-20`).
- Webcam: partial enumeration adapter only, with no open/capture/disposal; UI must not invoke even enumeration. Hot Folder: candidate detection and isolated synthetic fixture tests exist, not production ownership/readiness or profile integration; no live preview (`docs/LEGACY_CAMERA_PORT_RESULTS.md:13-14,22-26`). Never select a production/V1 folder.
- Originals, RAW transfer, LUT/mirror and output parity are not established; do not promise them. Synthetic preview has no Beauty/LUT/mirror parity (`docs/SIMULATOR_CAMERA_RESULTS.md:7-11`).
- On missing preview, backend restart, disconnect, timeout or uncertain command, present a clear unavailable/reconcile state; never infer successful capture, replay a shutter, or silently switch sources. Real-device recovery behavior is not yet implemented or validated.
- This note is a source snapshot, not a hardware test or claim of performance; coordinate changes against the current backend and shared bridge contract.
