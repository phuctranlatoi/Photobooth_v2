# Image Processing & AI Beauty Pipeline (Photobooth V1)

This document details the complete image transformation, AI portrait enhancement, color filtering, and composition pipeline of the legacy V1 system (`E:\HK1_2026_2027\PhotoboothDesktop`).

---

## 1. Raw Capture Acquisition & Mirror Parity

### 1.1 Ingestion & File Paths
- **File:** `src/main/kotlin/.../imaging/DesktopImageProcessor.kt`
- **Method:** `saveBoothCapture(source: Path, outputDir: Path, shotIndex: Int, photoAspectRatio: Float, effectId: String)`
- **Storage Location:** `data/sessions/{sessionId}/originals/Photo_{index}.jpg`

### 1.2 Mirroring Invariant
During kiosk operation, guests face the live screen as a mirror. Standard DSLR capture produces a flipped (non-mirrored) perspective, which disorients users. V1 enforces an explicit horizontal reflection immediately upon saving the raw capture:
```kotlin
// DesktopImageProcessor.kt:46-50
// Lật ngang (mirror) ảnh để giống hệt như khách soi gương lúc Live View
graphics.translate(rgb.width, 0)
graphics.scale(-1.0, 1.0)
graphics.drawImage(filtered, 0, 0, null)
```
*Result: All saved captures in `data/sessions/{sessionId}/originals/` match the mirror perspective shown during live view.*

---

## 2. Color Effects & 3D LUT Engine

### 2.1 Native Color Matrix Processing
- **File:** `src/main/kotlin/.../imaging/DesktopImageProcessor.kt` (lines 80–138)
- Applied to both EVF live view frames and captured photos on CPU:
  - **Contrast & Brightness:**
    $cOffset = (1 - contrast) \times 127.5 + (brightness \times 255)$
    $R' = contrast \times R + cOffset$
  - **Saturation:**
    $Luma = 0.299 \times R' + 0.587 \times G' + 0.114 \times B'$
    $R'' = Luma + saturation \times (R' - Luma)$
  - **Warmth (Color Temperature):**
    Adds orange/blue balance offsets: $+127.5 \times warmth$ to Red, $+25.5 \times warmth$ to Green, $-127.5 \times warmth$ to Blue.
  - **Tint (Magenta / Green):**
    Adds tint offsets: $+127.5 \times tint$ to Red and Blue, $-127.5 \times tint$ to Green.

### 2.2 3D `.cube` LUT Integration
- **Files:** `src/main/kotlin/.../imaging/lut/CubeLutParser.kt`, `Lut3D.kt`
- **Parsing:** Parses Adobe 3D LUT (`.cube`) text format, extracting 3D RGB lattice grid (e.g. 17x17x17 or 33x33x33).
- **Interpolation:** Executes high-speed trilinear interpolation in integer fixed-point math across RGB cubes.
- **Caching:** Caches parsed `Lut3D` tables in a thread-safe `ConcurrentHashMap<Path, Lut3D>` to eliminate disk I/O during repeated live view frames and batch renders.

---

## 3. AI Portrait Beauty Pipeline (YuNet & BiSeNet)

### 3.1 Model Identification & Installed Production Revisions
A critical requirement of this audit is determining **which neural network revision** is actively integrated in production rather than assuming newer offline experiments were accepted.

Direct inspection of `app-resources/models/` and model loading code (`ModelPathResolver.kt`) proves:

| Model Architecture | Installed Production File | Upstream Source | Production Status | Evidence Tag |
|---|---|---|---|---|
| **Face Detection** | `face_detection_yunet_2023mar.onnx` | OpenCV Zoo Official YuNet (March 2023 release) | **ACCEPTED & ACTIVE** in `YuNetFaceDetector.kt` | **Observed in code** |
| **Semantic Face Parsing** | `bisenet_face_parsing.onnx` | BiSeNet (ResNet-18 backbone, CelebAMask-HQ 19 classes) | **ACCEPTED & ACTIVE** in `OnnxFaceParsingService.kt` | **Observed in code** |
| **SCRFD 500M** | `scrfd_500m.onnx` | InsightFace SCRFD 500M detector | **REJECTED / UNUSED** (Only referenced in evaluation script `scripts/evaluate_phase431_foreground_detection.py`) | **Observed in code** |

*Conclusion: The production app exclusively executes `face_detection_yunet_2023mar.onnx` and `bisenet_face_parsing.onnx`. SCRFD was an offline benchmark experiment and was never wired into the Kotlin runtime.*

---

### 3.2 End-to-End Beauty Architecture (`DesktopBeautyService.kt`)

```
   [ Captured JPEG ]
          │
          ▼
   ┌────────────────────────────────────────┐
   │  YuNet Face Detection (2023mar ONNX)   │ ──► Extracts BBoxes & 5 Landmarks
   └──────────────────┬─────────────────────┘
                      ▼
   ┌────────────────────────────────────────┐
   │         CustomerFaceSelector           │ ──► Filters FOREGROUND vs BACKGROUND
   └──────────────────┬─────────────────────┘
                      ▼ (For each customer face)
   ┌────────────────────────────────────────┐
   │         FaceAlignment (512x512)        │ ──► Affine warp upright face crop
   └──────────────────┬─────────────────────┘
                      ▼
   ┌────────────────────────────────────────┐
   │       BiSeNet Face Parsing ONNX        │ ──► 19 semantic classes (skin, eyes, lips)
   └──────────────────┬─────────────────────┘
                      ▼
   ┌────────────────────────────────────────┐
   │          FaceOvalMaskBuilder           │ ──► Soft-edged composited alpha mask
   └──────────────────┬─────────────────────┘
                      ▼
   ┌────────────────────────────────────────┐
   │      GuidedLuminanceFilter (CPU)       │ ──► Edge-preserving bilateral smoothing
   └──────────────────┬─────────────────────┘
                      ▼
   ┌────────────────────────────────────────┐
   │         BeautyColorMath (CPU)          │ ──► Whitening, rosy skin tone, contrast
   └──────────────────┬─────────────────────┘
                      ▼
[ Derivative Beauty PNG (Photo_{i}_beauty.png) ]
                      │
   (On any crash, timeout >15s, or exception)
                      ▼
   [ SILENT FALLBACK: Returns Original JPEG ]
```

### 3.3 Customer vs Bystander Face Classification
Photobooths frequently capture bystanders walking behind the kiosk or small faces on posters. Applying beauty filters to strangers or posters creates uncanny visual artifacts.
- **Class:** `CustomerFaceSelector` (`src/main/kotlin/.../facemask/CustomerFaceSelector.kt`)
- Evaluates bounding box area relative to frame size, distance from kiosk center, and landmark confidence.
- Only faces classified as `FaceRole.FOREGROUND_CUSTOMER` are processed by BiSeNet.

### 3.4 Face Alignment & Parsing
- **Class:** `FaceAlignment` (`src/main/kotlin/.../facemask/FaceAlignment.kt`)
- Calculates affine rotation angle from eye landmarks (left eye to right eye vector).
- Centers and scales face into a normalized 512×512 square crop.
- Feeds crop to Microsoft ONNX Runtime executing `bisenet_face_parsing.onnx`.
- Isolates skin regions while strictly masking out eyes, eyebrows, nostrils, lips, hair, and clothing to prevent blurring facial features.

### 3.5 Guided Luminance Filtering & Skin Enhancement
- **Class:** `GuidedLuminanceFilter` (`src/main/kotlin/.../beauty/GuidedLuminanceFilter.kt`)
- Implements an edge-preserving guided filter (He et al.) operating on the luminance channel.
- Smooths blemishes, pores, and skin texture while preserving sharp edges around wrinkles, facial contours, and jewelry.
- Applies `BeautyColorMath`:
  - Whitening: subtle S-curve contrast boost on skin luminance.
  - Rosy Tone: gentle pinkish shift in red/blue chromaticity.
- Preset parameters (`NATURAL`, `STUDIO`, `BRIGHT`, `STRONG`):
  | Preset | Smoothing | Whitening | Rosy Tone | Detail Preservation |
  |---|---|---|---|---|
  | `NATURAL` | 30 | 20 | 12 | 85 |
  | `STUDIO`  | 60 | 50 | 25 | 65 |
  | `BRIGHT`  | 70 | 75 | 20 | 55 |
  | `STRONG`  | 85 | 95 | 25 | 40 |

### 3.6 Strict Fail-Safe Fallback Guarantee
- In `DesktopBeautyService.processCapture()` (`DesktopBeautyService.kt:60-63`):
  ```kotlin
  catch (error: Exception) {
      System.err.println("Beauty processing skipped for ${sourceImageFile.name}: ${error.message}")
      sourceImageFile // Returns original unaltered JPEG
  }
  ```
- In `DesktopBoothController.kt` (lines 572–574):
  All beauty tasks are bounded by a strict 15-second timeout (`withTimeoutOrNull(15_000L)`). If beauty fails or times out, the workflow seamlessly proceeds using the original camera captures with zero crash or kiosk stall.

---

## 4. Print Composition & Overlay Engine

### 4.1 Canvas Dimensions & DPI Scaling
- **File:** `src/main/kotlin/.../imaging/DesktopCompositor.kt`
- Base design canvas coordinates are calculated at 300 DPI, then multiplied by `renderScale = 2` to render at **600 DPI**:
  - `5x15` strip canvas: `1184 × 3580 px`
  - `10x15` full portrait canvas: `2368 × 3580 px`
  - `15x10` full landscape canvas: `3580 × 2368 px`

### 4.2 Photo Slot Bleed Calculation
To prevent unsightly white hairlines between photos and frame cutouts caused by minor sub-pixel rasterization discrepancies, the compositor applies an explicit 2-pixel bleed per edge:
```kotlin
// DesktopCompositor.kt:74-81
val bleedPx = 2 * renderScale // 4 pixels at 600 DPI
val bleedSlot = Rectangle(
    slot.x - bleedPx / 2,
    slot.y - bleedPx / 2,
    slot.width + bleedPx,
    slot.height + bleedPx
)
it.drawCenterCrop(image, bleedSlot)
```

### 4.3 Frame Overlay Application
1. **Custom PNG Frames:**
   If `frame.isCustom == true`, the custom transparent PNG overlay loaded from `frame.customImagePath` is drawn directly on top of the rendered slots using bilinear interpolation (`g.setRenderingHint(KEY_INTERPOLATION, VALUE_INTERPOLATION_BILINEAR)`).
2. **Default Procedural Frames:**
   If no custom PNG is provided, `drawDefaultFrame()` renders rounded rectangle borders using `frame.accentColor`, followed by layout title and size metadata in the lower footer.

### 4.4 Dual-File Export Architecture
The compositor generates **two distinct files** per completed session:
1. **Master Image (`finalPath`):**
   - Clean composed output without physical paper duplication and **WITHOUT a QR code**.
   - Preserved as PNG in `data/output/` and uploaded to Cloudinary for the guest's digital download.
2. **Print Image (`printPath`):**
   - Stamped with the web album QR code using ZXing.
   - For `5x15` strips: duplicated 2-up side-by-side on the 4x6" paper sheet (`2452 x 3658 px`) with 4px center slit gap.
   - Dispatched exclusively to the physical Windows print spooler.

---

## 5. Video Compilation Pipeline

- **File:** `src/main/kotlin/.../controller/DesktopBoothController.kt` (lines 467–505, 597–670)
- **Live Frame Buffering:** During the countdown of each shot, live view frames are captured every ~41ms (24 fps target) and saved as temporary JPEGs (`data/sessions/{sessionId}/videos/shot_{index}/frame_%03d.jpg`).
- **FFmpeg Transcode:** A background `ProcessBuilder` invokes `bin/ffmpeg.exe` or system `ffmpeg`:
  ```bash
  ffmpeg -y -framerate 24 -i frame_%03d.jpg -c:v libx264 -profile:v main -level 3.1 -preset fast -crf 17 -vf "scale='trunc(iw/2)*2':'trunc(ih/2)*2',format=yuv420p" video_{index}.mp4
  ```
- **Static Photo Fallback:** If live view frame capture dropped or yielded 0 frames, FFmpeg generates a 3-second static video clip from the still photo (`-loop 1 -t 3`).
- **Master Composite Video:** `DesktopVideoCompositor.kt` arranges the per-shot video clips into an animated multi-slot MP4 matching the photo layout for upload to the web album.

---

*Evidence Tag: All pipeline steps, model revisions, mathematical bleed formulas, and FFmpeg flags are **Observed in code** from direct examination of the V1 repository.*
