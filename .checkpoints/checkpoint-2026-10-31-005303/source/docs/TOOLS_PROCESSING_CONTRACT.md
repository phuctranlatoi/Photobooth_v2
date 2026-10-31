# V1 layout/frame Tools processing contract

## Scope and evidence boundary

Source-only audit for migration of the local layout-calculation tool core. V1 was inspected with read/glob/grep only. No V1 tool, test, build, network operation, Firebase call, hardware, customer/runtime data, or secret was accessed. This contract describes source semantics; no execution or output-parity claim is made. Firebase persistence is an independently gated operator action, not part of the safe local core.

## Source map and minimal pure core

- `src/main/kotlin/com/phuctran/photobooth/desktop/engine/LayoutCalculatorTool.kt:109-179` is the UI orchestration: reads PNG, calls detector, derives labels/code/QR fields, and writes `<basename>_punched.png` beside the input. UI, file chooser, clipboard, Compose and coroutine concerns need not be migrated into backend core.
- `engine/SlotDetectionEngine.kt` contains detection and punch processing. `detect(BufferedImage)` returns `DetectionResult(width,height,slots,warnings,punchedImage,qrSlot)`; `FrameModels.kt:3-42` defines config, normalized slot coordinates and result DTO. The algorithm is large and stage-sensitive: preserve the complete required implementation and its helper/model types as a unit, not a rewritten subset.
- `engine/PhotoCompositor.kt:11-70` is a separate deterministic Java2D composition operation. It allocates `TYPE_INT_ARGB`, places photos in slot-index order, cover-scales and clips each to slot bounds, then draws the full frame PNG last. Both `shape == "RECT"` and non-RECT currently clip to rectangular bounds; frame alpha is relied on for final shape visibility. Preserve this actual behavior.
- UI-generated Kotlin source in `LayoutCalculatorTool.kt` and Firebase update/persist methods are not required for detection/composition output parity. Keep those actions outside the pure backend module.

### Image and geometry contract

- Input is a decoded raster (`ImageIO.read(file)`); tool expects PNG frame assets, but decoder returns `BufferedImage`. Source raster width/height are authoritative pixel dimensions; the tool does not first normalize to a print DPI or rescale detection input.
- The input must encode candidate windows as transparent punched regions or detector-recognizable solid rectangular blocks (UI error message at `LayoutCalculatorTool.kt:120-123`). `FrameSlot.x/y/width/height/centerX/centerY` are normalized 0..1 against source width/height (`FrameModels.kt:13-24`). Indices determine photo mapping. Do not silently change coordinate origin, rounding or normalized bounds.
- Detection produces a same-dimension punched image (`SlotDetectionEngine.kt` around 692-696) and preserves source pixels except those transformed/punched by staged algorithm. Its alpha semantics and color heuristics are implementation details requiring fixture characterization; do not simplify stage ordering or thresholds.
- QR detection returns a `qrSlot` as a normalized `FrameSlot`. UI converts X/Y to integer source pixels and size from normalized slot width only (`LayoutCalculatorTool.kt:133-137`); fallback QR settings come from a same-basename JSON file (`:138-155`). Thus QR is a square-size configuration represented by top-left pixel and width; source does not evidence a separate QR image embedded in punched output. Verify exact QR detector geometry before reuse.
- `_punched.png` output is the detector's punched raster, written as PNG using ImageIO beside source (`:158-163`), preserving dimensions and alpha-capable PNG encoding. The tool does not overwrite input.
- Compositor output caller chooses `targetWidth/targetHeight`; test harness uses source dimensions (`FrameEngineTest.kt:79-85`). Slots are scaled independently to that target canvas. Photo is cover-scaled (max of width/height scale factors), centered using integer truncation and clipped. Transparent frame overlays last; this may cover portions of photo and preserves alpha in ARGB output.

## Minimal dependencies and migration boundary

The local engine API relies on Kotlin/JVM standard library and Java AWT `BufferedImage`/`Graphics2D` plus `javax.imageio.ImageIO`. `PhotoCompositor` needs no network, native camera, printer, Beauty/ONNX, or LUT dependency. `SlotDetectionEngine` must be audited for its full imports/helpers before copying; the examined API/model signatures and pixel-processing methods indicate JVM image operations, but this document does not claim a complete dependency closure without checking all imports/build metadata. Reuse must be copied to V2; never link to or modify V1 at runtime.

### Dependency closure and exact source set (follow-up audit)

Read-only import/helper inspection establishes the minimal source closure for the three requested core types:

1. V1 `src/main/kotlin/com/phuctran/photobooth/desktop/engine/FrameModels.kt` — `DetectionConfig`, `FrameSlot`, `FrameDefinition`, `DetectionResult`; no imports beyond Kotlin/JDK types (fully qualified `BufferedImage`).
2. V1 `src/main/kotlin/com/phuctran/photobooth/desktop/engine/SlotDetectionEngine.kt` — one file, imports only `java.awt.image.BufferedImage`, `java.util.UUID`, and Kotlin `abs/max/min/roundToInt/sqrt`; `Arrays.sort/fill` are JDK-qualified. Nested helper data classes and all private helpers are within this file. No external library, Firebase, Beauty, camera, network, or other V1 source dependency appears in its imports/helper references.
3. V1 `src/main/kotlin/com/phuctran/photobooth/desktop/engine/PhotoCompositor.kt` — one file, imports AWT `AlphaComposite`, `Graphics2D`, `RenderingHints`, `BufferedImage`, and Kotlin `max`; `AlphaComposite`/`Graphics2D` are unused imports in the inspected implementation, not external dependencies. It depends on `FrameSlot` from item 1.

Thus source-level dependency closure is exactly those **three Kotlin files**, plus Kotlin/JDK standard runtime (`java.desktop` module for AWT/ImageIO). No third-party dependency is required for these classes. `LayoutCalculatorTool.kt`, FirebaseManager, ZXing, Compose, coroutine UI, image processor, ONNX/Beauty and camera classes are not needed for this local core. V2 `backend/build.gradle.kts:5-13` currently has Gson/coroutines/test declarations and JDK 21; it does not declare extra dependencies needed by these three files. Ensure packaged JVM includes `java.desktop` if a future jlink/minimal runtime is introduced.

No license/copyright header or license marker was found in the three inspected source files. Absence of a header is not permission to redistribute: owner/legal must confirm copyright and copying/redistribution rights before GO. The V1 build's unrelated dependencies or any license on EDSDK do not establish rights for these algorithms.

### Proposed exact V2 file placement and transformation

After an explicit GO and rights confirmation, copy only the three files above, retaining every algorithm statement/comment/constant/order unchanged. Package declaration is the sole source transformation required for namespace relocation:

```text
package com.phuctran.photobooth.desktop.engine
    -> package com.lesouvenir.v2.operatortools.legacy
```

Suggested destinations:

```text
backend/src/main/kotlin/com/lesouvenir/v2/operatortools/legacy/FrameModels.kt
backend/src/main/kotlin/com/lesouvenir/v2/operatortools/legacy/SlotDetectionEngine.kt
backend/src/main/kotlin/com/lesouvenir/v2/operatortools/legacy/PhotoCompositor.kt
```

Do not move or alter `DetectionConfig` defaults, UUID generation, pixel stages, tolerances, ordering, or Java2D rendering. The package string in a source-equivalence comparison is the only allowed normalized difference. Any issue such as unused imports should be left untouched during fidelity port, then handled only with separate review if necessary.

Recommended V2 module contract (local backend API, not shared IPC):

```kotlin
data class FrameSlot(/* normalized source-relative geometry, stable index/id */)
data class FrameDetection(/* source width/height, slots, warnings, qrSlot, punched PNG bytes or raster */)
interface LayoutProcessing {
  fun detectFrame(inputPng: ByteArray, config: DetectionConfig = DetectionConfig()): FrameDetection
  fun compose(framePng: ByteArray, targetWidth: Int, targetHeight: Int,
              slots: List<FrameSlot>, photos: List<BufferedImage>): BufferedImage
}
```

Treat that as a proposal for backend module boundary only. Prefer immutable explicit DTOs and caller-controlled isolated output paths; do not add IPC commands/events or edit architect-owned schemas in this slice. UI can convert normalized geometry to displayed pixels. Keep Firebase read/write and generated source text in a separate privileged adapter. Firebase operations in `LayoutCalculatorTool.kt:254-...` call `FirebaseManager` and require explicit authorization, configured test project, and a distinct approval before any writes; they are not included in local tests or the pure contract.

### Safe byte-oriented service wrapper proposal (not implemented)

`LayoutToolService` should accept `ByteArray` only, never an arbitrary source/destination path, and validate compressed input bytes plus decoded dimensions before materializing the image. Suggested result: detected normalized slots/warnings/QR geometry and optional punched PNG bytes; encode with `ImageIO.write(..., "png", ...)`. The wrapper must create output only below an injected dedicated V2 workspace root, e.g. `<workspace>/backend/build/layout-tool/<request-id>/punched.png`, using a generated ID, normalized resolve-and-containment check, create-new/atomic temp-then-move, and bounded retention/cleanup. Never derive output location from imported filename and never write beside input. Apply configurable hard byte/pixel limits before decode to mitigate decompression bombs; reject null/unsupported images, malformed input, overflow, and dimensions outside policy. Limits are operational policy to be agreed, not V1 algorithm behavior. Service returns bytes/metadata and local V2 relative artifact ID; it must not introduce IPC, Firebase, network access, or copy/import V1 assets.

## Tests to add in V2 (synthetic fixtures only)

V1 `engine/FrameEngineTest.kt:6-97` is a manual `main`, requires `frame_template.png` and optional photo files from project root, optionally generates random solid-color photos, writes `data/output/test_result.png`, and is not a deterministic automated synthetic test. It provides no isolated pixel assertions. Do not run it as part of this audit.

Create deterministic fixtures in memory, generated in test code (no copied customer assets):

1. Transparent PNG canvas with known rectangular alpha windows and fixed dimensions; assert returned dimensions, slot count/index ordering, normalized geometry within documented tolerances, QR slot if fixture matches QR heuristic, and punched PNG alpha/pixel mask.
2. Opaque RGB / grayscale / anti-aliased edge patterns for thresholds, boundaries, warning paths, empty detections and maximum-slot/config boundaries. Assert deterministic outputs across repeated invocation.
3. Punched output round-trip through PNG encode/decode; verify dimensions, alpha channel, input not mutated, and source fixture unchanged.
4. Compositor with tiny coordinate-coded photos and transparent frame; verify cover crop, normalized-to-target scaling, clipping, overlay order, alpha, missing-photo index handling, odd dimensions/rounding, and non-RECT behavior exactly as current code (rectangular clipping plus overlay).
5. Golden synthetic pixel hashes or selected pixel assertions for representative fixtures, paired with explicit tolerances only where Java2D interpolation can vary. No Firebase/network, Beauty, LUT or hardware dependencies.

Acceptance for the eventual copy: tests run solely against generated synthetic raster fixtures; all calls to the core are deterministic; the wrapper rejects invalid/oversized input and writes only inside a temporary V2-owned root; verify no Firebase/network/IPC invocation by construction. Use an independent source-equivalence check without executing V1: read V1 and copied source as text, normalize only the package declaration (and line endings/UTF-8 BOM if present), compare exact remaining bytes; fail on any other content difference. Record SHA-256 for both original read-only source text and normalized V2 copy in review evidence, but do not include V1 source text beyond approved copied code. This checks textual fidelity, not behavior; V2 synthetic tests check behavior independently.

## Safe local tools vs gated actions

Safe-to-migrate core: in-memory frame detection, punch raster creation, normalized slot/QR geometry extraction, deterministic composition, and V2-local PNG encode/write under a dedicated test/output root. Local file import/export should validate PNG, cap dimensions/bytes and prevent path traversal; never write beside a V1 or production frame during tests.

Gated/non-core: Firebase layout/QR updates in `LayoutCalculatorTool.kt:254-...`; generated source deployment/copy into application configuration; any remote reads/writes or production asset changes. These require explicit operator/product approval and separate credentials/project. No secrets are included or needed by this core.

## Migration steps

1. At audit checkpoint, secure rights confirmation and inspect exact QR scoring/geometry paths; no unresolved third-party dependency is apparent from the three files, but rights remain open. Do not migrate an algorithm excerpt.
2. With GO, copy exactly the three-file closure into the namespace/destinations above, changing package declarations only; preserve algorithms verbatim.
3. Add deterministic synthetic tests above before wiring any UI. Keep Firebase adapter disabled unless separately approved.
4. Compare outputs using generated fixtures and report source-level/fixture evidence; no claim of actual frame catalog parity until approved frame assets are separately audited and tested.

## Files inspected

V1 `engine/LayoutCalculatorTool.kt` (process flow and Firebase save entry), full import/header/helper closure inspection of `engine/SlotDetectionEngine.kt`, `engine/PhotoCompositor.kt`, `engine/FrameModels.kt`, `engine/FrameEngineTest.kt`; V1 search results for QR configuration in `remote/FirebaseManager.kt` and production `imaging/DesktopCompositor.kt`; V2 `backend/build.gradle.kts:5-13`. No V1 file was executed or built. No V2 app/module files were changed; only this document is added.

**Technical feasibility:** yes, as an isolated JVM-only local module, subject to redistribution approval and synthetic parity tests. **GO status:** not granted; no source copy or app implementation is authorized by this audit. Redistribution rights remain unverified.
