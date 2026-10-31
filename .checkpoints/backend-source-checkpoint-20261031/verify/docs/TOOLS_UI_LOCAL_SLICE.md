# Tools UI: smallest real local measure-and-inspect slice

**Status: UI/IPC proposal only, not implemented or approved.** The user has authorized the architect's internal V2 namespace-only copy of the three-file local core; **commercial redistribution verification is a release/packaging blocker, not a prerequisite for that authorized internal implementation**. This Tools UI slice is still blocked until the local core and synthetic tests are ready, the architect approves a safe IPC contract, and the current implementation checkpoint permits UI work (see `docs/TOOLS_PROCESSING_CONTRACT.md:27-37,72-101` for source boundaries; its earlier rights/GO language does not supersede the user's subsequent internal-copy authorization). A source-equivalence comparison of copied code checks textual fidelity after the allowed package change; it does **not** establish pixel/output parity, which requires independent synthetic fixture tests. V1 (`E:/HK1_2026_2027/PhotoboothDesktop`) remains read-only; do not run or modify it, access secrets/customer images, or copy runtime data. No app changes, execution, screenshot or hardware/network test supports this UI proposal. Preserve the existing React/Operator architecture and V1 Tools baseline; no new visual design or decorative substitutes.

## Source behavior and bounded UI

* V1 `src/main/kotlin/com/phuctran/photobooth/desktop/engine/LayoutCalculatorTool.kt:363-387`: two-column Tools page; left shows “Công cụ bố cục,” a **measure PNG** chooser and a distinct **prepunched direct-import** chooser. Only the first is in scope. `:109-179` reads PNG, detects slots, shows error if none, derives QR geometry and previews the punched PNG. Its current write beside the source file (`:158-163`) **must not be reproduced** by the V2 wrapper.
* V1 `:390-534`: dark fitted preview, busy indicator; punched raster overlays colored numbered slot placeholders, red boundaries and pixel size labels, padding in source pixels, and an optional **square QR-position placeholder**. These are measurement guides, not customer photos, an actual QR graphic or proof of print composition. The V2 UI must display **real detector-returned normalized slots** and real backend-encoded punched pixels; it must not paint plausible-looking sample slots without detection.
* V1 `:98-106,128-137`: detected print-size text is an aspect-ratio heuristic; layout-size label also includes slot count. QR X/Y/size use `(qrSlot.x * sourceWidth).toInt()`, `(qrSlot.y * sourceHeight).toInt()`, `(qrSlot.width * sourceWidth).toInt()` respectively; QR preview scales the square from **source width** (`:502-528`). Do not claim a standard paper size from arbitrary raster dimensions. V1 can fall back to same-basename JSON when QR detection fails (`:138-155`); a bytes-only PNG import cannot see a neighboring JSON file, so mark QR **undetected** unless a separate explicitly authorized input is specified.
* V1 `:537-787` additionally has layout/frame IDs, special events, cover upload, QR edits, generated source, clipboard, Firebase save and a local-frame save flow. Those actions are **not** part of measure-and-inspect. `:197-247` direct-import skips analysis; do not expose it as a working measurement action. V2 `frontend/src/Operator.tsx:7-16` already has the Tools tab but `frontend/src/components/StudioUI.tsx:2-6` presents disabled placeholders: replace only the eligible Tools placeholder **after** an actual Kotlin local detector IPC exists. Do not add an enabled no-op button.

### Minimum useful Tools screen

1. One real “Chọn Ảnh để Đo Đạc” action, restricted to operator/development access already available in V2. Choose a single PNG using an approved desktop file-selection flow or browser `File`, read bounded **bytes**, and send bytes to the approved local Kotlin service. Show selected **display filename only**, processing status, validation/errors and detector warnings; never send a renderer-specified source path.
2. When detection succeeds with at least one slot: fitted backend-produced punched PNG with slot-index outlines and dimensions, source width/height, ordered normalized and derived pixel slot geometry, source-pixel padding, and optional detected QR position/size overlay. Use backend geometry as authority; render overlay coordinates relative to the **contained image rectangle** (including letterbox offsets), not the whole panel. Keep a text/table view of slots and warnings accessible without relying on colored overlays. If preview bytes are not supplied, show geometry and “punched preview unavailable,” never a fabricated frame.
3. Offer **download/export punched PNG only after** an approved safe export contract exists and a valid punched result is returned; show whether bytes were returned or a V2-scoped artifact was created. Until then display the action as **unavailable with reason**, not an enabled decorative control. Firebase/layout/frame save, cover and JSON fallback remain explicitly unavailable. Do not present an editable layout ID or generated source snippet as a persisted layout.

## Proposed IPC for architect review — names and DTOs are NOT existing commands

Names below (`tools.detectPng`, `tools.exportPunchedPng`) are **proposed**, not implemented or approved in the existing simulator bridge. Architect owns command naming, ACL, errors, limits and schema; this document grants no IPC or file permissions.

```text
tools.detectPng REQUEST (proposal)
  requestId: opaque unique ID for correlation
  pngBytes: byte payload or explicitly specified bounded encoding
  displayName?: untrusted basename used only as text (never a path/ID)

tools.detectPng RESPONSE (proposal)
  requestId: original correlation ID
  status: SUCCESS | NO_SLOTS | INVALID_INPUT | TOO_LARGE | PROCESSING_FAILED
  widthPx, heightPx: decoded source raster dimensions on valid decode
  warnings: string[] (bounded, safely displayed)
  slots: [{id, index, x, y, width, height, centerX, centerY, areaRatio, shape}]
         coordinates normalized to original source width/height; ordered by index
  qrSlot?: same normalized slot geometry, or null when not detected
  punchedPngBytes?: bounded PNG bytes / approved display encoding
  artifactId?: opaque V2-only identifier, if wrapper stores isolated result

tools.exportPunchedPng REQUEST (optional proposal, separate approval)
  artifactId: opaque identifier from an accepted detection, NOT a file path
  requestId: correlation/idempotency ID
  destination: host-controlled save-dialog result, never renderer-provided arbitrary path
RESPONSE (proposal): result/status and safe display filename; no filesystem path disclosure required
```

Minimum service validation: permission-gated operator route; single in-flight action; compressed byte cap **before decode**, decoded width/height/pixel cap and PNG-signature/decoder validation, bounded result encoding, no path traversal, no overwrite of input, no network/Firebase/hardware, isolated V2-root artifact creation only if needed, short-lived opaque IDs and bounded cleanup. Exact caps, MIME/decoder policy, timeouts, save-dialog implementation and ownership are **architect decisions**, not V1 algorithm constants. Invalid/oversized/decode-failed bytes must never reach detector or result in a misleading success. Preserve the unchanged detector/`FrameSlot` semantics described in `docs/TOOLS_PROCESSING_CONTRACT.md:14-21,58-74`; do not use the renderer to infer authoritative slots or silently adjust algorithms.

**Existing byte-upload precedent:** none found in `frontend/src` source. `frontend/src/shared/connected-simulator.ts:17` only accepts bounded **incoming image data URLs for display**; it is not a file chooser, input-byte validation, upload ACL or export mechanism. A browser `File` → bounded bytes → IPC can avoid arbitrary source paths, but requires an approved new input contract and backend size/format validation. A desktop chooser may expose host paths internally, but the renderer/service should receive bytes or a constrained opaque handle—not arbitrary file paths accepted from UI strings.

## State/interaction acceptance for future coder and tester

| State | Required observable response |
|---|---|
| No selection | Explain accepted PNG measurement input and show “Chưa có ảnh xem trước”; no slots, QR or export success claimed. |
| Choosing / decoding / detecting | One in-flight request; pending indicator; disable duplicate detect/export; preserve previous result only if clearly labelled as previous, otherwise clear it. Old asynchronous responses cannot replace a newer selection (correlate request IDs). |
| Invalid, oversized, decode failure or backend denied | Clear current result/QR/export eligibility; show actionable safe error without paths/secrets or stack traces; no fallback to decorative slot geometry. |
| `NO_SLOTS` | Show V1-like explanation (“Không tìm thấy lỗ ảnh…” and transparent/solid-rectangle input guidance from `LayoutCalculatorTool.kt:120-126`), optional original PNG only if approved/validated; zero slot rows; no punched-result export. |
| Success | Display exact backend dimensions, ordered slots, detected QR or “QR chưa được phát hiện,” bounded warnings and backend punched PNG (if supplied); slot guides and optional QR box align to fitted image at varying aspect ratios. Export enabled **only** with approved export contract and valid output. |
| Export pending/success/failure | Explicitly distinguish local PNG export from layout/frame catalog save; do not claim a V1-style beside-input write, Firebase update, actual print or catalog registration. |

**Verification boundaries:** source equivalence establishes copied-text fidelity only, not detector pixel/output parity; independent synthetic Kotlin fixture tests must assess output behavior. Mounted **V2** checks are needed for overlay/image alignment and touch/keyboard reachability at 1920×1200, 1280×800 and Windows 100/125/150% scale. A V2 screenshot cannot establish V1 pixel parity or hardware/production behavior. Firebase writes, live credentials, customer assets, V1 execution and real prints are excluded. This proposal does not authorize Tools UI/IPC implementation; it does not revoke the separately authorized internal three-file core copy. Commercial redistribution rights remain a release blocker.
