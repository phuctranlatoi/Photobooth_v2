# ADR-017: Camera-Free Demo Capture Mode in Real Session Engine

**Date:** 2026-11-01  
**Status:** Accepted  
**Authors:** Specialist Solutions Architect (V2)  
**Supersedes/Extends:** Extends ADR-012 (Simulator Mode) and ADR-015 (Real Runtime Engine)

---

## 1. Context and Problem Statement

In Milestone 5, the architecture established two operational modes:
- `--simulator`: Headless test engine with synthetic mock shapes, 300 DPI placeholder compositor, mock payments, and dry-run prints.
- `--real`: Physical kiosk engine wired to Canon EDSDK, DNP RX1HS printer, real PayOS VietQR payments, and SQLite `sales.db`.

However, an important operational gap exists between these two extremes:
1. **Atelier Demonstrations & QA Verification:** Store operators, exhibitions, and developers often need to test the **actual real image processing pipeline** (e.g. 600 DPI composition with `DesktopCompositor`, 3D LUT photo color styling with `DesktopImageProcessor`, facial skin enhancement with `DesktopBeautyService`, and real transparent PNG frames) on hardware or laptops that **do not have a physical Canon DSLR or DNP dye-sub printer attached**.
2. **Preventing Accidental Revenue & Incomplete Spooling:** When demonstrating the software to venue managers or training staff, the kiosk must not create real VietQR payment links, must not contact PayOS, must not log revenue to the local ledger (`data/sales.db`), and must not attempt to send binary print jobs to an absent physical printer spooler.
3. **The Inadequacy of Pure `--simulator`:** Pure simulator mode replaces the real compositor with SVG placeholder shapes and skips real LUTs/beauty models entirely. It cannot prove that real customer photo compositions, frame alignments, and facial filters render correctly.

---

## 2. Decision

### 2.1 Demo Capture Mode inside `RealSessionEngine`
We introduce an explicit, opt-in **Demo Capture Mode** within `RealSessionEngine`. It does **not** weaken the real hardware fail-closed invariant because it is explicitly signaled, isolated from the financial ledger, and clearly flagged in all IPC responses.

### 2.2 Component: `DemoCameraAdapter`
A dedicated `DemoCameraAdapter` is introduced in `com.lesouvenir.v2.camera.demo`:
1. **Hardware State:** Reports `isHardwareConnected() = true` when Demo mode is active.
2. **Live View Emulation:** Emits realistic, smooth live-view viewfinder frames (e.g., animated studio portrait silhouette with live timestamp and face tracking markers) at 15–20 FPS to the frontend callback.
3. **High-Resolution Realistic Mock Capture:**
   - On `capturePhoto(targetDir, index, targetAspectRatio)`:
     - Simulates realistic camera shutter delay (350ms sensor capture latency).
     - Generates a **distinct, realistic high-resolution portrait image** (e.g., 2400×1600 px or matching target aspect ratio) for each sequential shot `index` (0, 1, 2, 3...):
       - Natural photographic studio backgrounds (soft neutral grays, warm studio lighting gradients).
       - Distinct human portrait figures with varying poses (e.g., pose 0: centered portrait, pose 1: tilted head smile, pose 2: candid side glance, pose 3: cheerful celebration pose).
       - Distinct clothing colors and skin tone variations across shots.
       - Facial features formatted such that ONNX face detection (YuNet) and skin smoothing (`DesktopBeautyService`) can either execute without crashing or gracefully passthrough.
     - Saves `original-shot-$index.jpg` into the session working directory.

### 2.3 Real Processing Pipeline Execution
Unlike the simulator, Demo Capture Mode feeds the captured images directly into:
1. **`DesktopBeautyService`:** Asynchronous facial skin smoothing and Guided Luminance filtering (bounded post-save execution).
2. **`DesktopImageProcessor`:** 3D `.cube` LUT application (warmth, contrast, film presets).
3. **`DesktopCompositor`:** Full 600 DPI rendering, bleed margin clipping (2px scale), dual-strip cutting math (`CUT_5X15_2UP` 2452×3658 px or `PHOTO_10X15` 3658×2452 px), and real transparent PNG frame overlays from `data/frames`.

### 2.4 Strict Revenue & Spooler Safety Boundaries
During a Demo session:
1. **Payment Boundary:**
   - Payment method is marked as `"DEMO"`.
   - `payment.createLink` returns a demonstration QR code immediately marked as `"status": "PAID"`.
   - `payment.mockComplete` succeeds immediately without requiring operator password or staff override.
   - Live PayOS API is **never contacted**.
2. **Printer Boundary:**
   - Print confirmation renders the final `print_$fileName.png` to disk.
   - Spooler dry-run verification checks image dimensions, bit depth, and layout validity.
   - **Zero bytes are transmitted to the Windows Print Spooler** or physical printer.
   - **Zero rows are inserted into `data/sales.db`** (or inserted with status `DEMO`, revenue = 0).
   - Remote revenue sync to Neon is skipped entirely.

### 2.5 IPC Contract for Mode Selection
1. **Session-Level Activation:** `session.start` accepts an optional parameter:
   ```json
   {
     "layoutId": "strip-5x15",
     "captureMode": "DEMO"
   }
   ```
   (Default is `"REAL"` when running under `RealSessionEngine`).
2. **Kiosk-Level Default Toggle:** Operator can set default capture mode via `operator.setCaptureMode`:
   ```json
   {
     "captureMode": "DEMO"
   }
   ```
3. **Telemetry & Status:** `device.getStatus` and `session.getState` explicitly report:
   ```json
   {
     "runtimeMode": "REAL",
     "captureMode": "DEMO",
     "camera": { "connected": true, "adapter": "DEMO" },
     "demoMode": true
   }
   ```

---

## 3. Consequences

### Positive
- **Complete End-to-End Visual Verification:** Operators and QA can visually inspect the exact 600 DPI composited print output, frame borders, and QR layout without burning expensive DNP dye-sub paper or ribbon.
- **Booth Demonstrations Anywhere:** Sales and marketing teams can demonstrate the photobooth on any Windows touchscreen laptop without dragging a DSLR and heavy DNP printer.
- **Fail-Safe Financial Security:** Guaranteed zero revenue pollution in `sales.db` and zero bogus transactions in PayOS.

### Negative / Tradeoffs
- Requires generating synthetic portrait fixtures in memory or loading pre-rendered portrait assets from resources. Handled by procedural rendering in `DemoCameraAdapter` with fallback to bundled fixture assets.
- Must ensure that UI displays an explicit, subtle "CHẾ ĐỘ DEMO" badge so customers are not confused if a kiosk is left in Demo mode.
