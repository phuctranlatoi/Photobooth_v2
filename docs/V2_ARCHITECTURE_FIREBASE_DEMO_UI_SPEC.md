# LE SOUVENIR Photobooth V2 — Architectural Specification
## Firebase Catalog, Camera-Free Demo Capture Mode & Modern Premium Korean UI

**Document ID:** `V2_ARCHITECTURE_FIREBASE_DEMO_UI_SPEC.md`  
**Milestone:** Milestone 5 Architecture Handoff  
**Author:** Specialist Solutions Architect (V2)  
**Date:** November 2026  
**Status:** APPROVED FOR IMPLEMENTATION  
**Isolation Notice:** Legacy V1 (`PhotoboothDesktop`) is strictly READ-ONLY. All writes belong exclusively to V2 (`PhotoboothDesktop_v2`). No secrets or customer PII are disclosed or logged.

---

## 1. Executive Summary

This architectural specification provides the design, contracts, data flow, and file ownership breakdown for three core deliverables:
1. **Firebase Integration & Resilient Frame Catalog:** An offline-first catalog service (`FirebaseCatalogService.kt`) that discovers Google Service Account credentials across workspace and `%LOCALAPPDATA%`, queries Firestore `layouts`, writes a local atomic disk cache (`backend/config/firebase-layouts-cache.json`), gracefully falls back across four tiers, indexes disk frames and seasonal bundles (`data/frames` and `data/covers`), and exposes typed IPC methods `catalog.get` and `catalog.sync`.
2. **Camera-Free Demo Capture Mode:** An opt-in operational mode inside `RealSessionEngine` utilizing `DemoCameraAdapter` to generate high-resolution, realistic portraits across successive shots. Crucially, Demo Mode feeds directly into the **actual real imaging pipeline** (`DesktopBeautyService`, `DesktopImageProcessor`, and 600 DPI `DesktopCompositor`), while strictly enforcing financial and physical safety boundaries (zero revenue in `sales.db`, bypass of PayOS live links, dry-run spooler validation).
3. **Modern Premium Korean UI System:** A complete design token architecture and touchscreen layout plan adhering to Seoul's premier self-photo atelier aesthetic (warm ivory, blush pink, soft peach, muted coral, warm charcoal typography). Perfectly optimized for 16:10 touchscreen displays (**1920×1200** WUXGA and **1280×800** WXGA) with touch targets $\ge 56\text{px}$, smooth transitions, interactive card selection, animated countdown, and camera flash feedback.

---

## 2. Component 1: Firebase Integration & Disk Frame Catalog

### 2.1 Credential Resolution Sequence
The service must locate `serviceAccountKey.json` defensively:
```
Priority 1: <workspace>/serviceAccountKey.json
Priority 2: <workspace>/backend/serviceAccountKey.json
Priority 3: %LOCALAPPDATA%/LeSouvenirDesktop/serviceAccountKey.json
```
- **Validation Guardrails:** Paths are verified to prevent path traversal (`..` rejected) and symbolic links.
- **Fail-Safe Invariant:** If no key is found or if the file contains unparseable JSON, the service marks `firebaseAvailable = false`, outputs a single operational diagnostic to `stderr`, and immediately activates local fallback. It **never throws an unhandled exception or terminates the backend process**.

### 2.2 `FirebaseCatalogService.kt` Architecture
- **Package:** `com.lesouvenir.v2.catalog`
- **Class:** `class FirebaseCatalogService(private val workspace: Path, private val localAppData: Path? = null)`
- **Key Methods:**
  - `fun initialize()`: Discovers credentials and creates Firebase App instance with a 5000ms initialization guard.
  - `fun fetchFirestoreLayouts(): List<LayoutMode>`: Wraps Firestore collection `layouts` fetch in a coroutine with `withTimeout(5000)`.
  - `fun loadCatalog(forceSync: Boolean = false): CatalogSnapshot`: Executes the 4-tier fallback hierarchy.
  - `fun scanFramesAndBundles(): FrameStoreSnapshot`: Discovers frames and seasonal covers from local disk.
  - `fun sync(): CatalogSnapshot`: Forces re-sync of Firestore, updates memory cache, writes atomic disk cache, and returns fresh payload.

### 2.3 Firestore Document Mapping to `LayoutMode`
The schema audit of V1 Firestore confirms the following mapping rules:
```kotlin
fun DocumentSnapshot.toLayoutMode(): LayoutMode {
    val layoutId = id
    val title = getString("title") ?: "Layout $layoutId"
    val subtitle = getString("subtitle") ?: ""
    val description = getString("description") ?: ""
    val familyStr = getString("family") ?: "Grid"
    val family = runCatching { LayoutFamily.valueOf(familyStr) }.getOrDefault(LayoutFamily.Grid)
    val width = getDouble("width")?.toFloat() ?: 1200f
    val height = getDouble("height")?.toFloat() ?: 1800f
    val printSize = getString("printSizeLabel") ?: if (width < height && (width / height) < 0.5f) "5x15" else "10x15"
    val pAspect = getDouble("printAspectRatio")?.toFloat() ?: (width / height)
    
    // Parse slots
    val rawSlots = get("slots") as? List<Map<String, Any>> ?: emptyList()
    val absoluteSlots = rawSlots.mapNotNull { s ->
        val idx = (s["index"] as? Number)?.toInt() ?: return@mapNotNull null
        val x = (s["x"] as? Number)?.toFloat() ?: 0f
        val y = (s["y"] as? Number)?.toFloat() ?: 0f
        val w = (s["width"] as? Number)?.toFloat() ?: 0.5f
        val h = (s["height"] as? Number)?.toFloat() ?: 0.5f
        LayoutSlot(idx, x, y, w, h)
    }.sortedBy { it.index }
    
    val shotCount = getLong("shotCount")?.toInt() ?: absoluteSlots.size.coerceAtLeast(4)
    val selectCount = getLong("selectCount")?.toInt() ?: absoluteSlots.size.coerceAtLeast(shotCount)
    val countdown = getLong("countdownSeconds")?.toInt() ?: 5
    val basePrice = getLong("basePrice") ?: PricingCalculator.calculatePrice(printSize, 2).basePrice
    val mediaLabel = getString("mediaLabel") ?: "Layout $layoutId"
    val accentColor = getLong("accentColor") ?: 0xFFE07A5FL
    val gridCols = getLong("gridColumns")?.toInt() ?: 1

    return LayoutMode(
        id = layoutId,
        title = title,
        subtitle = subtitle,
        description = description,
        family = family,
        shotCount = shotCount,
        selectCount = selectCount,
        countdownSeconds = countdown,
        basePrice = basePrice,
        mediaLabel = mediaLabel,
        accentColor = accentColor,
        absoluteSlots = absoluteSlots,
        gridColumns = gridCols,
        printSizeLabel = printSize,
        printAspectRatio = pAspect,
        qrCodeX = getLong("qrCodeX")?.toInt(),
        qrCodeY = getLong("qrCodeY")?.toInt(),
        qrCodeSize = getLong("qrCodeSize")?.toInt()
    )
}
```

### 2.4 Four-Tier Fallback Hierarchy
```
┌────────────────────────────────────────────────────────┐
│ Tier 1: Live Firestore Query (Timeout: 5000ms)         │
│ • Valid credentials found in workspace or LocalAppData │
│ • Network connection operational                       │
│ • On success: writes backend/config/firebase-layouts-  │
│   cache.json atomically via temp file                  │
└──────────────────────────┬─────────────────────────────┘
                           │ (Network fail, timeout, or no keys)
                           ▼
┌────────────────────────────────────────────────────────┐
│ Tier 2: Local Disk Cache                               │
│ • backend/config/firebase-layouts-cache.json           │
│ • Parsed with schema version verification               │
│ • Reported as source: "CACHE"                          │
└──────────────────────────┬─────────────────────────────┘
                           │ (Cache absent or corrupt)
                           ▼
┌────────────────────────────────────────────────────────┐
│ Tier 3: Production Configuration                       │
│ • backend/config/production-layouts.json               │
│ • Tested production strip-5x15 and print-10x15 layouts │
│ • Reported as source: "LOCAL_PRODUCTION"               │
└──────────────────────────┬─────────────────────────────┘
                           │ (File deleted or unreadable)
                           ▼
┌────────────────────────────────────────────────────────┐
│ Tier 4: Immutable Code Invariants                      │
│ • Built-in hardcoded fallback LayoutMode objects       │
│ • Guaranteed non-null boot                             │
└────────────────────────────────────────────────────────┘
```

### 2.5 Disk Frame & Bundle Scanning (`data/frames` & `data/covers`)
Per the forensic audit, frames in V1 were never downloaded from Firestore; they were stored entirely on local disk. `FirebaseCatalogService` integrates local frame scanning:
- Structure: `<workspace>/data/frames/<printSizeLabel>/<layoutId>/<Standard|Special>/[specialEventName]/<frameSlug>_<timestamp>.png`
- Companion JSON: `<frameSlug>_<timestamp>.json` parsed for `{ qrCodeX, qrCodeY, qrCodeSize }`.
- Special Event Cover: `<workspace>/data/covers/<specialEventName>.png`. If present, read and converted to a base64 PNG data URL (`data:image/png;base64,...`) for instant rendering in the React carousel without HTTP file-serving overhead.
- Grouping: Frames sharing the same `specialEventName` are emitted as a `BundlePack`:
  ```json
  {
    "name": "Valentine 2026",
    "coverDataUrl": "data:image/png;base64,...",
    "targetLayoutId": "strip-5x15",
    "frameIds": ["val_strip_01", "val_strip_02"]
  }
  ```

---

## 3. Component 2: Camera-Free Demo Capture Mode

### 3.1 Motivation & System Role
- **Why not `--simulator`?** Simulator mode uses dummy SVG boxes, low-resolution mock compositing, and completely skips the real ONNX face parsing and 600 DPI rendering engine.
- **Why Demo Mode in `RealSessionEngine`?** When showroom staff, operators, or QA engineers run `RealSessionEngine`, they frequently need to demonstrate or verify the **real 600 DPI composition, 3D LUT photo color grading, facial skin smoothing, and transparent PNG frame overlays** without connecting a Canon DSLR or loading DNP dye-sub photo ribbon.

### 3.2 `DemoCameraAdapter.kt` Specification
- **Package:** `com.lesouvenir.v2.camera.demo`
- **Class:** `class DemoCameraAdapter : CameraController, AutoCloseable`
- **Behavior:**
  1. `isHardwareConnected()`: Always returns `true` when Demo mode is authorized.
  2. `startLiveView(onFrame: (BufferedImage) -> Unit)`: Generates an animated studio portrait live-view viewfinder at 15 FPS (warm studio backdrop, centered human silhouette, live face-tracking bounding box, and ticking watermark `"DEMO LIVE VIEW"`).
  3. `capturePhoto(targetDir: Path, index: Int, targetAspectRatio: Float): Path`:
     - Sleeps 350ms to accurately emulate mechanical DSLR shutter release and USB transfer lag.
     - Generates a **distinct high-resolution photographic portrait** (2400×1600 px):
       - Natural photographic gradient studio backdrop (warm cream `#F5ECE3` to soft gray `#E2DBD5`).
       - Distinct human portrait figure:
         - **Shot 0:** Frontal smiling portrait with neutral head pose.
         - **Shot 1:** Slight head tilt with cheerful expression.
         - **Shot 2:** 45-degree candid portrait with gentle smile.
         - **Shot 3:** Playful two-handed pose / victory gesture.
       - Distinct clothing colors across shots (e.g. pastel sage, muted terracotta, navy, warm beige).
       - Anatomically proportioned eyes, lips, and facial contours allowing OpenCV/YuNet face detection to trigger face bounding boxes or pass cleanly to `DesktopBeautyService`.
     - Writes `original-shot-$index.jpg` into `targetDir`.
     - Returns the absolute path of the generated photo.

### 3.3 Strict Isolation & Financial Boundaries
When a session runs in Demo Capture Mode:
1. **PayOS & VietQR:**
   - Real PayOS API credentials are **never invoked**.
   - `payment.createLink` generates an internal demonstration QR code with status immediately `"PAID"`.
   - `payment.mockComplete` succeeds without requiring administrative override.
   - `paymentMethod` is explicitly recorded as `"DEMO"`.
2. **DNP RX1HS & Windows Spooler:**
   - Real `DesktopCompositor` runs at full 600 DPI, generating `finalImagePath` and `printImagePath`.
   - `print.confirmReal` verifies the print canvas format, aspect ratio, and paper cut layout (`CUT_5X15_2UP` or `PHOTO_10X15`).
   - **Zero print bytes are sent to the Windows Print Spooler (`javax.print`)**.
3. **SQLite Sales Ledger (`data/sales.db`):**
   - **Zero rows are recorded in `sales.db`** (or recorded strictly with `status = 'DEMO', total_amount = 0`).
   - Revenue recognition gate is **not triggered**.
   - Remote sync to Neon is completely skipped.
4. **Session Snapshot & Telemetry:**
   - Snapshot explicitly sets `"simulator": false`, `"demoMode": true`, `"paymentMethod": "DEMO"`.
   - UI displays a polite `"CHẾ ĐỘ DEMO"` badge in the top navigation bar.

---

## 4. Component 3: Modern Premium Korean UI Plan

### 4.1 Visual Identity & Token Architecture
Inspired by Seoul's premier ateliers (Haru Film, Photoism, Life Four Cuts), the palette balances warm studio ivory, soft blush pink, muted terracotta coral, and warm charcoal typography:

```css
:root {
  /* Atelier Surfaces */
  --k-bg-ivory: #FAF6F0;
  --k-bg-gradient: radial-gradient(circle at 12% 15%, #FFFDF9 0%, transparent 55%),
                   radial-gradient(circle at 88% 85%, #F4EBE3 0%, transparent 50%),
                   #FAF6F0;
  --k-card-bg: #FFFFFF;
  --k-card-blush: #F7EBE8;
  --k-card-peach: #FCEBD9;
  --k-card-glass: rgba(255, 255, 255, 0.88);

  /* Primary Accent & CTAs */
  --k-coral-primary: #E07A5F;
  --k-coral-hover: #D46A4E;
  --k-coral-active: #B8553A;
  --k-peach-accent: #F4A261;
  --k-studio-green: #3D8B6E;

  /* Typography */
  --k-text-title: #232120;
  --k-text-body: #544E4B;
  --k-text-caption: #8C847E;
  --k-font-family: 'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Touch Boundaries & Elevation */
  --k-border-subtle: #EFE8DF;
  --k-border-glow: #E07A5F;
  --k-shadow-card: 0 10px 30px rgba(78, 56, 44, 0.07);
  --k-shadow-hover: 0 16px 40px rgba(78, 56, 44, 0.12);
  --k-shadow-glow: 0 0 24px rgba(224, 122, 95, 0.25);

  /* Touch Targets */
  --k-touch-min: 64px;
  --k-radius-card: 22px;
  --k-radius-button: 18px;
  --k-radius-pill: 9999px;
}
```

### 4.2 Viewport Responsiveness: 1920×1200 vs 1280×800 (16:10)
Both standard display options maintain an identical **16:10 aspect ratio**:

```
+-----------------------------------------------------------------------------------+
| 1920x1200 (WUXGA 16:10) Flagship Kiosk Display                                    |
| Padding: 40px 64px | Root Rem: 20px                                               |
| +-----------------------------------------+-------------------------------------+ |
| | Left Column: Camera View / Preview      | Right Column: Options & Controls    | |
| | Width: ~1000px                          | Width: ~760px                       | |
| | [ Live View / Canvas (600px x 900px) ]  | • Layout / Bundle Cards             | |
| |                                         | • Quantity Selector                 | |
| |                                         | • VietQR Payment Card               | |
| |                                         | • Primary Action Button (Pinned)    | |
| +-----------------------------------------+-------------------------------------+ |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| 1280x800 (WXGA 16:10) Compact Kiosk Display                                       |
| Padding: 20px 32px | Root Rem: 16px                                               |
| +-----------------------------------------+-------------------------------------+ |
| | Left Column: Camera View / Preview      | Right Column: Options & Controls    | |
| | Width: ~640px                           | Width: ~560px                       | |
| | [ Live View / Canvas (400px x 600px) ]  | • Compact Cards                     | |
| |                                         | • Primary Action Button (Pinned)    | |
| +-----------------------------------------+-------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

- **Zero Scrolling Guarantee:** The core customer flow (`Start` -> `Quantity` -> `Payment` -> `Prepare` -> `Capture` -> `Select` -> `Frame` -> `Delivery`) is strictly bounded to 100vh/100dvh. Zero vertical scrollbars on customer touchscreens.
- **Ergonomic Bottom-Right Reach:** Primary buttons (`BẮT ĐẦU`, `TIẾP TỤC`, `XÁC NHẬN IN`) are anchored in the lower-right quadrant, within comfortable natural arm reach.

### 4.3 Screen-by-Screen Korean UI Specifications
1. **`StartScreen`:**
   - Elegant header with `"LE SOUVENIR · ATELIER"` wordmark.
   - Interactive 3D tilt cards showcasing available layouts (`Strip 5×15 cm`, `Postcard 10×15 cm`).
   - Seasonal Bundle carousel displaying cover photos from `data/covers/` (e.g., Valentine, Graduation).
   - Hidden operator trigger (5 taps on atelier logo within 3 seconds).
2. **`QuantityScreen`:**
   - Clean card-grid selector for print copies (2, 4, 6, 8, 10).
   - Real-time price calculation badge in VND with highlighted per-strip discount.
3. **`PaymentScreen`:**
   - Central luxury card featuring the VietQR code with pulsating coral corners.
   - Live status indicator with subtle animated spinner: `"Đang chờ thanh toán qua ứng dụng ngân hàng..."`.
   - Hidden or staff button for cash receipt / staff override.
4. **`PrepareScreen` & `CaptureScreen`:**
   - Full-bleed Live View with soft rounded corners (`24px`).
   - Giant centered countdown display (3, 2, 1) pulsing with `cubic-bezier(0.16, 1, 0.3, 1)`.
   - Shot sequence indicator pill: `"Khoảnh khắc 2 / 4"`.
   - Full-screen high-intensity flash animation (white opacity `0.9 -> 0` in 180ms) triggered on capture.
5. **`SelectPhotosScreen`:**
   - Aspect-ratio locked photo grid.
   - Tactile selection badges with numbered order stamps (`1`, `2`, `3`).
   - Clear progress tracker: `"Đã chọn 3 / 3 ảnh"`.
6. **`FrameScreen`:**
   - Horizontal frame preview selector with thumbnail previews of transparent PNG frames.
   - Real-time composite preview updating instantly as customer taps different frames.
7. **`PrintingScreen` & `DeliveryScreen`:**
   - Stylized Korean print roller animation with warm message: `"Ảnh của bạn đang được in..."`.
   - Full-screen high-resolution QR code for instant phone download via digital web album.
   - Automatic return to `StartScreen` on timer expiration or `"HOÀN TẤT"` touch.

---

## 5. IPC Contract Extensions

The typed IPC contract in `docs/IPC_CONTRACTS.md` is updated with the following specific method signatures:

### 5.1 `catalog.get`
```typescript
Request:
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "catalog.get",
  "params": {},
  "protocolVersion": 1
}

Response Result:
{
  "source": "FIRESTORE" | "CACHE" | "LOCAL_PRODUCTION",
  "syncedAt": 1730460000000,
  "defaultLayoutId": "strip-5x15",
  "layouts": LayoutMode[],
  "frames": FrameOption[],
  "bundles": BundlePack[],
  "pricing": PricingCatalog,
  "simulator": false
}
```

### 5.2 `catalog.sync`
```typescript
Request:
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "catalog.sync",
  "params": { "force": true },
  "protocolVersion": 1
}

Response Result:
{
  "synced": true,
  "source": "FIRESTORE" | "CACHE" | "LOCAL_PRODUCTION",
  "layoutsUpdated": number,
  "framesLoaded": number,
  "bundlesLoaded": number,
  "cacheWritten": boolean
}
```

### 5.3 `session.start` with Demo Mode
```typescript
Request:
{
  "jsonrpc": "2.0",
  "id": "3",
  "method": "session.start",
  "params": {
    "commandId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionId": "b6a8f8e1-512a-43d9-9529-50c6bf2e2601",
    "generationId": "e3b0c442-98fc-1c14-9afb-4c7ec0522002",
    "layoutId": "strip-5x15",
    "captureMode": "DEMO" | "REAL"
  },
  "protocolVersion": 1
}
```

---

## 6. Security Boundaries & Path Isolation

1. **Read-Only V1 Guardrail:** Legacy V1 directory (`E:\HK1_2026_2027\PhotoboothDesktop`) is strictly read-only. No files are modified, created, deleted, or built in V1.
2. **Credential Protection:** Secrets (`serviceAccountKey.json`, PayOS keys, Cloudinary secrets) are never emitted in stdout frames, logs, or error responses.
3. **Storage Segregation:**
   - Temporary captures and composites: `PhotoboothDesktop_v2/backend/build/real-sessions/<sessionId>/`.
   - Local sales ledger: `PhotoboothDesktop_v2/data/sales.db`.
   - Layout caches: `PhotoboothDesktop_v2/backend/config/firebase-layouts-cache.json`.
4. **Symlink Rejection:** All file paths for config, frames, covers, and caches must verify `!Files.isSymbolicLink(path)` to prevent local privilege escalation or arbitrary file disclosure.

---

## 7. Milestone Execution Plan & Agent Ownership

### 7.1 Specialist File Ownership Matrix

| Specialist Subagent | File Ownership & Scope | Deliverables |
|---|---|---|
| **Backend Specialist** | `backend/src/main/kotlin/com/lesouvenir/v2/catalog/FirebaseCatalogService.kt`<br>`backend/src/main/kotlin/com/lesouvenir/v2/camera/demo/DemoCameraAdapter.kt`<br>`backend/src/main/kotlin/com/lesouvenir/v2/ipc/RealSessionEngine.kt`<br>`backend/src/main/kotlin/com/lesouvenir/v2/storage/FrameStore.kt`<br>`backend/config/production-layouts.json`<br>`backend/build.gradle.kts` | Implement `FirebaseCatalogService`, `DemoCameraAdapter`, wire Demo mode and catalog sync into `RealSessionEngine`, write unit tests. |
| **Frontend Specialist** | `frontend/src/kiosk-v1.css`<br>`frontend/src/styles.css`<br>`frontend/src/shared/simulator-contract.ts`<br>`frontend/src/shared/connected-simulator.ts`<br>`frontend/src/screens/StartScreen.tsx`<br>`frontend/src/screens/QuantityScreen.tsx`<br>`frontend/src/screens/PaymentScreen.tsx`<br>`frontend/src/screens/CaptureScreen.tsx`<br>`frontend/src/screens/SelectPhotosScreen.tsx`<br>`frontend/src/screens/FrameScreen.tsx`<br>`frontend/src/screens/DeliveryScreen.tsx` | Implement Korean design tokens in CSS, upgrade 16:10 touchscreen responsive rules, implement card animations, animated countdown, and Demo mode indicator badge. |
| **Tester / Reviewer** | `tests/`<br>`backend/src/test/kotlin/` | Run isolated backend unit tests for Firebase fallback and Demo mode, verify zero revenue in Demo mode, run Playwright/CDP visual regression at 1920×1200 and 1280×800. |
| **Architect (This Agent)** | `docs/ADR/016-*.md`<br>`docs/ADR/017-*.md`<br>`docs/ADR/018-*.md`<br>`docs/IPC_CONTRACTS.md`<br>`docs/V2_ARCHITECTURE_FIREBASE_DEMO_UI_SPEC.md` | Authoritative architecture specifications, contracts, and safety governance. |

### 7.2 Runnable Minimal POC Request & Pass/Fail Criteria

#### POC 1: Firebase Catalog & Fallback Verification
```powershell
# Command to execute from PhotoboothDesktop_v2/backend:
./gradlew test --tests "com.lesouvenir.v2.catalog.FirebaseCatalogServiceTest"
```
- **Pass Criteria:**
  1. Service attempts to locate `serviceAccountKey.json` across all 3 candidate locations without throwing.
  2. In absence of credentials or internet, falls back cleanly to `backend/config/production-layouts.json` and reports `source: "LOCAL_PRODUCTION"`.
  3. Correctly parses `data/frames` and groups special frames with their `data/covers` into bundles.
  4. IPC `catalog.get` and `catalog.sync` return valid JSON-RPC envelopes within 100ms on fallback.

#### POC 2: Camera-Free Demo Capture Mode Verification
```powershell
# Command to execute from PhotoboothDesktop_v2/backend:
./gradlew test --tests "com.lesouvenir.v2.camera.demo.DemoCameraAdapterTest"
./gradlew test --tests "com.lesouvenir.v2.ipc.RealSessionEngineDemoModeTest"
```
- **Pass Criteria:**
  1. `DemoCameraAdapter` generates distinct, valid JPEG portrait files for 4 successive captures without a physical camera.
  2. Captured photos are fed into real `DesktopBeautyService` and `DesktopCompositor`, producing valid 600 DPI `print_$id.png`.
  3. `paymentMethod` is set to `"DEMO"`; zero rows are inserted into `data/sales.db`.
  4. Print dry-run succeeds with `printAccepted: true` and `revenueRecorded: false`.

#### POC 3: Korean Touchscreen UI Responsive Handoff
```powershell
# Command to execute from PhotoboothDesktop_v2/frontend:
npm test
npm run build
```
- **Pass Criteria:**
  1. Frontend builds with zero TypeScript errors.
  2. At both 1920×1200 and 1280×800, all interactive buttons satisfy minimum touch target ($\ge 56\text{px}$).
  3. Zero horizontal or vertical page scrollbars across customer-facing screens.
  4. Layout selection cards, countdown animations, and flash overlays render smoothly with warm ivory/peach/coral aesthetic.
