# Image / LUT / Beauty / frame audit

Status: SOURCE INSPECTED ONLY, 2026-10-30. No image files/customer data, models, archives or runtime outputs were opened. No algorithms copied or changed. All citations relative to V1 `src/main/kotlin/com/phuctran/photobooth/desktop/`.

## Observed still path and retention

`imaging/DesktopImageProcessor.kt:19-57` decodes source, applies effect, creates same-size RGB, mirrors horizontally, writes `Photo_<index>.jpg`. `photoAspectRatio` is passed but **not used** in this save implementation; unused crop helper exists at :161-177. Do not introduce an early aspect crop based on parameter name. Save does not itself establish EXIF rotation handling or preservation of original camera bytes: raw transfer retention must be traced with camera engineer. A path called `originals` does not prove unmodified pixels.

LUT application occurs before mirror/JPEG and before Beauty: `applyEffect` (:66-79) resolves LUT under app-owned `data/filters/luts`, requires direct parent and regular file, caches parsed LUT, applies effect.lutIntensity; failure falls back to input. Standard effects perform contrast/brightness → saturation → warmth/tint → integer clamp (:89-132). Live View applies the same color effect (:60-62), **not Beauty**. `imaging/lut/CubeLutParser.kt` and `Lut3D.kt` were located, but numerical interpolation/parser rules have not yet been line-audited; freeze them pending characterization rather than replacing with a frontend shader.

## Beauty lifecycle observed, approval NOT established

Master directive identifies checkpoint around `5d65460` as candidate, not acceptance proof. No Git history/objects/working-tree comparison was accessed in this subtask. **Current source cannot be certified as approved lineage**. Obtain owner-approved file manifest/revision and source comparison before porting; no thresholds, models, algorithms, presets or masks may be tuned meanwhile.

`services/DesktopBeautyService.kt:24-63`: disabled/zero-effect returns source; decode → YuNet detectAll → CustomerFaceSelector classify → only FOREGROUND_CUSTOMER → FaceAlignment crop → OnnxFaceParsingService parse → FaceOvalMaskBuilder.build(...).final → composite masks → BeautyProcessor.process. Empty/no-customer/zero mask, cancellation, non-APPLIED result or exception returns original source. Detector/parser are lazy, locked, and closed via AutoCloseable (:14-22,66-74). These exact component dependencies, including guided/color/compositor helpers, must remain algorithmically frozen. Names alone do not prove accepted thresholds or weights.

Controller queues after saved still (`controller/DesktopBoothController.kt:557-564`), uses configured enable and preset, separate `beauty/Photo_<index>_beauty.png`, keyed Deferred jobs. Before selection it awaits up to 15 seconds, replaces moment path only after task result and existing file, then cancels outstanding tasks (:571-593). Source file is not overwritten by Beauty. `processCapture` writes PNG and checks nonempty before returning (:57-59). Publication is through completed task, not discovery of a file while writing. No atomic temp-file rename or decode revalidation is demonstrated. Original path association is lost in replaced moment metadata even though file remains; downstream `ORIGINAL` upload can actually contain Beauty output.

Queue is **not demonstrated bounded**: controller launches one IO async per capture with no queue capacity (:562); service serializes detector/parser separately, not whole work. Cancellation checks exist between stages, not necessarily inside expensive algorithms. V2 needs architect-approved bounded scheduling and session generation checks while preserving algorithms. Never schedule on Live View. Controller closes service (:989-994).

## Actual composition and geometry

`imaging/DesktopCompositor.renderFinal` (:29-194), invoked directly by controller :745-751, is the traced production still route; do not substitute `engine/PhotoCompositor` solely because its name sounds authoritative.

At renderScale=2 (:48), master dimensions are strip 1184×3580, landscape 3580×2368, other portrait 2368×3580 (:42-58). Slots use normalized absoluteSlots with roundToInt when present (:197-206), otherwise grid/padding/gap ratios against canvas width and slot height from photoAspectRatio (:209-232). Selected photos are zipped into slots in order (:67-82); center crop computes centered source rectangle (:242-265). Bleed expands total slot dimensions by 4 rendered pixels (:74-81). Custom overlay is drawn over photos and stretched to whole canvas (:92-95,268-270); transparent-window preservation relies on asset alpha and slot matching, not automatic window clipping in this call path. Asset aspect/slot parity must be tested, not assumed.

Master PNG is saved **before QR** (:99-108). QR then affects print canvas only. Strip print sheet is 2452×3658 with two identical strips, offsets (28,54), gap 4 (:110-138); portrait uses same sheet and offsets (:163-186). Landscape sheet 3658×2452, offset (54,28) (:139-162). These are source pixels, not physically measured DPI/cut accuracy. Require printer engineer characterization; do not derive new sizes from cm labels. Full QR placement/default decoration branches beyond line 300 were not audited here.

## Minimal reuse and verification gate

Propose COPY/WRAP DesktopImageProcessor, LUT parser/interpolator, DesktopCompositor, layout/frame models and frame-storage mapping after architect contract; keep backend pixel pipeline rather than React reimplementation. Beauty copy remains BLOCKED on accepted manifest, weights hashes and license verification. No model swap/research.

Future tests, all NOT RUN: synthetic gradient LUT identity/intensity/order; asymmetric image mirror; same-resolution save; corrupt decode; exact output geometry per layout; normalized slot rounding; transparent artwork edges/bleed; preview vs print crop; QR absent in master/present in print; original hash unchanged; Beauty disabled/no-face/model-error/cancel/timeout fallback; no incomplete derivative publication; bounded queue memory; restart orphan derivative handling. Exact pixel parity requires authorized fixtures and approved baseline; no tolerance/pass is asserted.
