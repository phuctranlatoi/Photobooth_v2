# Print composition fixture plan — source-derived, not output parity

**Scope:** read-only source comparison dated 2026-10-31. No V1 execution, rendering, device access, print, code edit, or algorithm change. This plan records arithmetic expressed by source and proposes synthetic acceptance fixtures; none have been run. Pixel output/physical print parity is **not established**.

## V1 print pipeline dimensions and mapping

Primary source: V1 `src/main/kotlin/com/phuctran/photobooth/desktop/imaging/DesktopCompositor.kt`.

- `renderScale = 2` and composition canvas dimensions are selected by label substring (`:42-59`):

| Source label matching | Composition (`finalImagePath`) px | Print sheet (`printImagePath`) px | Placement / copy count |
|---|---:|---:|---|
| Contains `5x15` or `5 x 15` (case-insensitive) | 1184 × 3580 | 2452 × 3658 | Two composition images, each 1184 × 3580; left 28, top 54, horizontal gap 4 px (`:110-138`). |
| Else contains `15x10` or `15 x 10` | 3580 × 2368 | 3658 × 2452 | One image 3580 × 2368; left 54, top 28 (`:139-162`). |
| Every other label, including default `10 x 15 cm` | 2368 × 3580 | 2452 × 3658 | One image 2368 × 3580; left 28, top 54 (`:163-187`). |

These are integer pixel arithmetic in source, not DPI-verified physical dimensions. `BoothModels.kt:20-56` gives `printSizeLabel` default `15 x 10 cm`, aspect default `15/10`; `DefaultLayoutModes` has fallback `10 x 15 cm`, aspect `10/15` (`:205-226`). Labels beyond the three matching branches fall through to the portrait sheet; do not infer all production labels are covered or semantically equivalent.

Composition uses normalized `absoluteSlots` if present; otherwise slot positions derive from canvas width, padding/gap ratios, columns, selected-photo count, and `photoAspectRatio` (`DesktopCompositor.kt:197-233`; model ratio defaults at `BoothModels.kt:47-75`). Photos are center-cropped to each slot with integer-rounded centered source crop (`:242-266`), then drawn into a bleed destination expanded 4 px total (2 px each dimension side at scale 2) (`:67-83`). Frame/custom overlay is drawn afterward (`:85-97`). The final image is written before QR is drawn; QR is added to print composition only (`:99-108`, `:330-359`).

`DesktopIoServices.kt:54-88` is a separate driver-print stage: it clears the Java paper imageable area, rotates if image and driver-page orientations differ, and stretches to imageable dimensions. Its driver page/media dimensions and physical scaling are not provided by these compositor constants.

## Other V1 composition path (distinct; not the print-size pipeline)

`engine/FrameModels.kt:13-25` defines normalized `FrameSlot` bounds and `index`. `engine/PhotoCompositor.kt:11-18` accepts caller-supplied `targetWidth/targetHeight`, returns ARGB, and does not choose a print size or sheet count. It multiplies normalized slot bounds by target dimensions using truncating `toInt()` (`:32-36`), cover-scales/crops photos and clips each slot (`:38-63`), then draws the frame last (`:65-66`). No sheet dimensions, bleed, DPI, or copies are encoded here. Do not substitute this engine for `DesktopCompositor.renderFinal` when asserting print-output parity.

## V2 simulator source comparison

V2 `backend/src/main/kotlin/com/lesouvenir/v2/printing/SimulatorCompositor.kt:22-26,37-47` mirrors the three branch dimensions and sheet placement. Its strip gap is 4 px (`:44`); non-strip single-image placement follows the V1 offsets. Source differences matter: V2 always uses a supplied full-canvas frame overlay (`:35`), whereas V1 custom-frame path has image overlay and default-frame path has generated border/footer (`DesktopCompositor.kt:85-97,268-321`). V2 uses fixed slot bleed x/y `-2/+4` (`:31-34`); V1 computes `bleedPx=4`, then `bleedSlot` origin subtracts `bleedPx / 2` (2) and dimensions add 4 (`:74-82`), same rectangular expansion. V2 comments that absolute slot indices are intentionally unused, but uses coordinates (`:57-61`); V1 likewise maps coordinate values and ignores index in this compositor (`:198-205`). V2 has no QR parameter in this method and is explicitly simulator/file-only (`:14-20`).

The matching arithmetic is not evidence of byte/pixel equality: frame semantics differ; image encoding, labels, input scaling, QR path, and driver stage also differ. V2 currently produces synthetic simulator output, not the accepted V1 capture/LUT/Beauty/composition-to-printer chain.

## Proposed synthetic fixture acceptance cases (not run)

Use synthetic generated images only (no customer captures): a coordinate/color-bar asymmetric landscape and portrait photo, a labeled asymmetric frame/slot overlay, and deterministic layout objects with fixed IDs and ratios. Assert decoded image dimensions and sampled geometry, not just file existence.

1. **Label branch table:** exact labels `5x15`, `5 x 15`, `15x10`, `15 x 10`, `10 x 15 cm`, plus unmatched and precedence case containing both strip and landscape markers. Assert composition and sheet dimensions from table; verify strip precedence (V1 checks strip first). Unknown label fallthrough must be explicitly characterized, not silently treated as a new supported size.
2. **Sheet placement/count:** strip has exactly two copies, expected 28/54/4 px offsets/gap and white exterior; landscape and portrait have exactly one copy at expected offsets. Check edge pixels and crop bounds so accidental clipping or added copies fail.
3. **Orientation/crop:** test portrait and landscape source bars in portrait/landscape slots, crop symmetry and correct center, and asymmetric visual orientation (detect unintended rotation or mirroring). Include absolute and ratio-derived slots, multiple rows/columns, and enough selected synthetic images; reject fewer than `selectCount` as V1 does (`DesktopCompositor.kt:36-38`).
4. **Bleed and frame precedence:** verify 4-px total expansion of each slot destination at 2x scale; adjacent-slot boundaries do not acquire bleed. Exercise V1 custom overlay and default frame separately; keep QR-present and QR-absent cases distinct and assert `finalImagePath` excludes QR while print output includes it when configured.
5. **V1/V2 differential source-output test, only after separately approved implementation:** generate the same deterministic inputs and layout in isolated V2 fixture paths; compare exact dimensions and image pixels with explicitly justified tolerances only for known encoder/rendering differences. Report composition and print-sheet comparisons independently. Do not compare against printer paper or claim physical media/DPI from pixel dimensions.
6. **Negative claim gate:** a LUT-catalog test, compositor unit test alone, successful PNG write, simulator status, or driver `Submitted` cannot pass full capture/print parity. Full parity requires separate end-to-end fixture evidence covering selected photos + frame + LUT/Beauty state, exact final composition, print-sheet mapping, and separately authorized printer/queue evidence. No physical test is in this plan.

## Evidence limits

No source-derived DPI claim is accepted: the V1 comment says 600 DPI at scale 2, but driver media/printable area and actual device scaling were not established. No cut behavior is represented in compositor arithmetic. Sheet pixel dimensions/copy count are source facts only; paper cut/hand-off behavior and physical output remain unknown.
