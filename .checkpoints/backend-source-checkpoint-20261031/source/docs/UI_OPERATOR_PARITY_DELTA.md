# Operator next-safe delta — static decision only

## Superseding visual-fix continuation

### Actual mounted follow-up — supersedes CDP-pending statement below

After reviewer port release, reproduced the actual zero-height failure using `node verify-simulator.mjs`. Computed layout in `frontend/mounted-preview-diagnosis.log` showed the modal itself correctly bounded at 1232×752, but the automatic header track consumed **654.4px**, leaving the media track/image at **0px**. Replaced intrinsic auto header/footer tracks with explicit 72px/48px tracks, bounded header height, and absolutely contained image inside the remaining media cell. Screenshot inspection also caught a full-width legacy button crowding the title; explicit close width/flex sizing now preserves the heading. No photo selection/backend mutations were added.

Final full mounted run: `node verify-simulator.mjs > mounted-preview-fixed.log 2>&1`, **exit 0**, customer flow through completion at **both 1280×800 and 1920×1200**, reload recovery, six operator shells, and clean owned host/JVM shutdown. Log: `frontend/mounted-preview-fixed.log`. Assertions passed for positive displayed image dimensions, positive natural dimensions, contain fit, modal/image/close viewport bounds, title/close non-overlap, setup Back, and staff panel controls/disclaimer at both sizes. Existing Vite server was reused; attempted new server exited because port 1420 was already occupied, without stopping that server. Only harness-owned windows were closed.

Fresh PNGs for Designer review: `frontend/simulator-evidence/original-fullscreen-0.png`, `original-fullscreen-1.png`, `setup-0.png`, `setup-1.png`, `payment-staff-0.png`, `payment-staff-1.png`. Both original-preview PNGs directly inspected after final run: image visible, title readable, close bounded, footer visible. Synthetic blue fixture is not a real camera photo. Request independent Designer review; this is not full UI/hardware parity.

Build and 15/15 tests passed after media-track fix; final close-width-only refinement was then mounted through both full flows. Final rebuild/test rerun recorded separately in task response.

User subsequently authorized actual scoped visual fixes; the static-only scope below is historical. Updated `frontend/src/components/PhotoPreview.tsx`, `frontend/src/preview.css`, `frontend/src/finishing.css`, `frontend/src/components/PhotoPreview.test.tsx`, and `frontend/verify-simulator.mjs`. No Operator implementation or session logic changed.

Root cause observed in source: legacy `.simulator [role=dialog]` specificity overrides the old preview class's inset/background/padding. Preview now explicitly overrides that selector with a bounded fixed viewport grid, dark background and white foreground, contained minmax-zero media cell, and nonshrinking >=48px close button. Setup uses a bounded scrolling choice region with protected actions/footer. Staff panel is a viewport-bounded local overlay with scroll fallback and compact spacing; existing approval/disclaimer content and handlers are unchanged.

Authorized V2-only validation: `npm.cmd run build` succeeded (TypeScript + Vite); `npm.cmd test -- --run` succeeded, **5 files / 15 tests**. Component tests verify structure/focus/close behavior, not rendered geometry. Harness now asserts modal/image/close viewport bounds, image `object-fit:contain` and loaded dimensions, explicit heading foreground, setup Back bounds, and staff panel/control/disclaimer bounds at both existing viewport iterations (1280×800, 1920×1200).

**Actual post-fix CDP remains pending reviewer release.** No parallel CDP launched. Existing PNG review predates these fixes; no visual PASS is claimed from unit tests/build. Request Tester-Reviewer release of the harness and UI Designer re-review of new screenshots. No native/backend/hardware/production changes and no full parity claim.

2026-10-30. Scope: documentation only while independent mounted customer review is active. No app/test edits, shell commands, CDP, hardware, network or production operations performed. V1 untouched; V1 observations below are attributed to the corrected V2 inventory, not a new exhaustive V1 audit.

## Current source, not a parity claim

- `frontend/src/Operator.tsx:5–14`: six tabs; only Layouts has an implemented mutation. Loads `operator.getStatus`; saves exact `layoutId`, `shotCount`, `selectCount`, `countdownSeconds` through `operator.updateLayout`; synchronous save lock; reload after success; backend `canEditLayouts` disables inputs. Prices are read-only. Error retry exists, but successful status has no explicit refresh control. Other tabs render unavailable reasons/disabled actions. Tools currently says “Calculator & maintenance”; maintenance is not established V1 Tools evidence.
- `frontend/src/Operator.test.tsx:5–7`: three source-defined tests for denied access/six tabs, exact layout save plus reload, and active-session disabling. Not run in this task. Prior 15-test report and the concurrently running mounted harness are not independently revalidated here; no new PASS is asserted.
- `backend/src/main/kotlin/com/lesouvenir/v2/ipc/SimulatorSessionEngine.kt:104–124`: actual operator dispatcher has just two methods, opt-in default denial, backend IDLE guard, local-development access, false production ACL, false hardware/effects/revenue/payment capabilities. `:129–136` supplies existing catalog/device read status; it does not supply asset management or a Tools calculator.
- `docs/UI_BACKEND_RESULTS.md:9–14` specifies the exact current wire contract, bounds, local persistence and NEXT_SESSION semantics. `docs/UI_DESIGN_SYSTEM.md` and `docs/UI_IMPLEMENTATION_MATRIX.md` remain presentation constraints; no timing/business-rule change is proposed.

## Recommended next increment: four local controls, after review release

These are editor/usability improvements, **not four newly ported V1 workflows**. None expands backend authority or implies a new successful save.

| Control | Safe implementation using current contract | Required acceptance before merging |
|---|---|---|
| Refresh operator status | Add explicit refresh in successful/disabled status views; use existing `operator.getStatus {}`. Disable/coalesce while reading or saving; preserve drafts or explicitly ask before discarding. Display only backend-returned availability. | Repeated taps issue one read; late old read cannot overwrite newer save/reload; denial clears stale edit permission. |
| Discard unsaved layout edits | Per-layout local cancel/reset restores the latest acknowledged status values without RPC. Label “Discard changes,” not “Restore defaults.” | No update call; configured counts/timing restored exactly, not fixture defaults; cannot race a pending save. |
| Touch count/time steppers | Plus/minus beside existing numeric fields for the same three editable values; draft-only until existing Save. Use reviewed wire bounds (shots 1..12, selection 1..shots, countdown 0..30), not new business defaults. Backend still validates; never auto-save or silently reduce selection when shots decrease. | >=48 CSS px targets, one step per gesture, blocked while unavailable/pending; invalid draft gets clear feedback; save payload remains exact. |
| Layout detail disclosure | Read-only expandable detail for returned layout ID, print-size label and current capture/selection/timing. No fabricated slot coordinates, prices or print preview. | Disclosure makes no mutation, supports long labels and compact 16:10 viewport, does not imply V1 edit/delete/price parity. |

Prefer refresh + discard first: minimal surface and no new contract. Existing save acknowledgement currently ignores the returned payload; a later bounded hardening should verify `saved:true`, `simulator:true`, `appliesTo:"NEXT_SESSION"` before success copy, and reconcile uncertain failures rather than claiming success. This is a recommendation, not a change made here.

## Disabled workflows remain contract-blocked

Do not enable Frames, Settings, Tools, Colors or Revenue saves with current methods. Do not repurpose `operator.updateLayout` for price, geometry, file paths or event data. No arbitrary HTTP endpoint, clipboard operation, file chooser, live upload, production credentials or new transport is authorized by this note.

Tools evidence specifically: corrected `docs/UI_SCREEN_INVENTORY.md:72–76` identifies `engine/LayoutCalculatorTool.kt` / `CalculatorApp`, **not** `model/PricingCalculator`. Observed source includes PNG measurement/import, slot metadata, layout/frame IDs, event/cover, QR placement and generated-code/local-save/Firebase actions. `docs/UI_NESTED_CONTROL_EVIDENCE.md:7–13` inventories pricing helpers, not that Admin tool; its event “refresh typically” entry at `:68` is explicitly inference. Neither justifies a working maintenance panel or calculator simulation. Correct Tools wording/disabled inventory may be addressed after review release, without claiming execution support.

### Exact next backend data requirements if Tools is prioritized

Proposed requirements for Architect review, **not existing method names/schema and not permission to implement**:

1. Read capability result: `simulator`, `accessMode`, `productionAdminAcl`, `canMeasure`, `canSaveLayout`, `canSaveFrame`, `canUploadCover`, `disabledReasons`, plus allowed session state and authoritative size/slot/QR constraints. Default false for unsupported operations.
2. Safe V2-local image intake result: opaque `assetId`, `assetRevision`, `mimeType`, `widthPx`, `heightPx`, bounded preview handle and expiry. Backend owns validation/decoding/storage; no caller absolute paths or V1/customer image discovery.
3. Measurement request: `assetId`, `assetRevision`, selected backend `printSizeId`; result: `measurementId`, revision, image coordinate units/origin, ordered `slots` with IDs and x/y/width/height, supported orientation, warnings and validity. Frontend must not derive image-processing/slot geometry in React.
4. Separate draft validation before any save: backend schema for existing/new layout identity, frame identity, selected size, ordered slots, event association and QR rectangle with explicit units/bounds; return canonical validated draft, revision and field errors. Backend determines compatibility and output composition. No invented price fields.
5. Save only in a subsequent reviewed mutation contract: permission and IDLE gates, validated draft ID/revision, unique command ID, conflict/unknown-outcome reconciliation, explicit saved IDs/revision, `appliesTo`, simulator flag and V2-local persistence guarantee. Cover upload, Firebase sync, clipboard and generated punched PNG side effects remain disabled unless separately authorized and specified. A local save must never imply cloud publication.

These requirements deliberately stop short of designing production ACL, inventing endpoints or copying V1 Firebase behavior. Other disabled areas need their own specialist contracts; this is not a duplicate full audit.

## Handoff / gate

Changed file: this document only. Tests run: none. App/runtime changes: none. Remaining mocks: existing simulator session/layout data; no new mock. Blocked hardware and production functions unchanged. Request UI Designer review of the proposed four controls and Tester-Reviewer approval after their current independent mounted run finishes, before any edits to `Operator.tsx` or `Operator.test.tsx`. No full parity or hardware-support claim.
