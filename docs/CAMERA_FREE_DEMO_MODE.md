# Camera-Free DEMO Capture Mode Architecture & Safety Boundaries

**Document ID:** `docs/CAMERA_FREE_DEMO_MODE.md`  
**Status:** IMPLEMENTED & VERIFIED IN V2  
**Target Environment:** Windows 10/11 x64 (Tauri v2 + Kotlin JVM Sidecar)  
**Security & Financial Guardrail:** Legacy V1 (`PhotoboothDesktop`) is strictly READ-ONLY. DEMO capture mode is strictly non-commercial: it must NEVER trigger PayOS bank links, NEVER dispatch commands to physical print spoolers, and NEVER insert records into `sales.db`.

---

## 1. Executive Summary & Design Rationale

Physical photobooth kiosks depend on specialized, expensive hardware peripherals:
1. **Canon EOS DSLR Camera:** Connected via USB with native Canon EDSDK C-DLL bindings (`EDSDK.dll`, `EdsImage.dll`).
2. **DNP RX1HS Dye-Sublimation Photo Printer:** Connected via USB with native Windows Spooler GDI/Print drivers.
3. **PayOS Gateway:** Production banking infrastructure generating Vietnamese VietQR dynamic payment links.

In retail operations, sales demonstrations, developer workstations, and automated QA testing, requiring active physical hardware is impractical and dangerous:
- Operating physical printers wastes expensive photo paper rolls and thermal ribbons.
- Testing payments could trigger unauthorized real banking transfers or corrupt accounting ledgers.
- DSLR cameras overheat or deplete batteries during continuous CI pipeline executions.

To solve this, Le Souvenir V2 introduces the **Camera-Free DEMO Capture Mode**. Rather than relying on separate mock stubs that bypass production code, DEMO mode runs directly inside the **actual production engine** (`RealSessionEngine`). It substitutes only the hardware capture and print spooler endpoints while preserving 100% of the real business rules, countdown timers, photo selection logic, `DesktopBeautyService` ONNX pipelines, and 600 DPI `DesktopCompositor` rendering.

---

## 2. Dual-Mode Runtime Architecture

The kiosk backend operates under a unified state engine capable of switching between two explicit capture modes:

```
                          ┌───────────────────────────┐
                          │   session.start Request   │
                          │   captureMode: REAL|DEMO  │
                          └─────────────┬─────────────┘
                                        │
                         Is captureMode explicitly set?
                         ├── YES ──► Use requested mode
                         └── NO  ──► Camera connected? ──► REAL (if connected)
                                                       ──► DEMO (if offline)
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
     ┌───────────────────────┐                     ┌───────────────────────┐
     │   captureMode: REAL   │                     │   captureMode: DEMO   │
     ├───────────────────────┤                     ├───────────────────────┤
     │ • Canon DSLR / Webcam │                     │ • DemoCameraAdapter   │
     │ • Live PayOS VietQR   │                     │ • Instant zero-charge │
     │ • Windows Spooler GDI │                     │ • Dry-run print only  │
     │ • Writes to sales.db  │                     │ • ZERO sales.db write │
     │ • revenueRecorded=true│                     │ • revenueRecorded=false
     └───────────────────────┘                     └───────────────────────┘
```

### Runtime Mode Specification

| Parameter | Type | Allowed Values | Default Behavior |
|---|---|---|---|
| `captureMode` | `String` | `"REAL"`, `"DEMO"` | Defaults to `"REAL"` if Canon DSLR / Webcam is detected; defaults to `"DEMO"` if offline. |

In `RealSessionEngine.kt`, this contract is enforced at session initialization:

```kotlin
"session.start" -> {
    requireState("IDLE")
    if (!seen.add(requested)) fail(-32004, "Session already used")
    layout = layouts.find { it.id == string(p, "layoutId") } ?: fail(-32602, "Unknown layout")
    captureMode = p["captureMode"]?.asString ?: if (camera.isHardwareConnected()) "REAL" else "DEMO"
    if (captureMode !in setOf("REAL", "DEMO")) fail(-32602, "Invalid captureMode")
    sid = requested; generation = gen; state = "SELECTING"; Files.createDirectories(directory()); snapshot()
}
```

---

## 3. `DemoCameraAdapter` Architecture

`DemoCameraAdapter` (`com.lesouvenir.v2.camera.demo.DemoCameraAdapter`) implements the standardized `CameraDevice` interface. It provides two visual pipelines:
1. **Live View Viewfinder Stream:** High-frequency JPEG preview stream.
2. **High-Resolution Still Captures:** Studio-lit synthetic test portraits matching DSLR dimensions ($2400 \times 1600$).

```
                      DemoCameraAdapter
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
            ▼                                   ▼
   Live View Viewfinder                High-Res Studio Capture
   • Resolution: 640x426               • Resolution: 2400x1600 (3:2)
   • Framerate: ~18 FPS (55ms loop)    • Shutter Latency: 300ms simulated
   • Crosshair overlay guides          • Studio lighting gradients
   • Streamed via frame callback       • Distinct poses & clothing per shot
                                       • Visible "TEST PORTRAIT" watermark
```

### 3.1 Realistic High-Resolution Portrait Generation

The adapter generates distinct, realistic vector-rasterized studio portraits using Java2D:
- **Aspect Ratio Fidelity:** Respects requested layout ratio ($aspectRatio = \frac{width}{height}$). Width is pegged at $2400\text{px}$, and height is computed dynamically:
  ```kotlin
  val width = 2400
  val height = (width / aspectRatio).toInt().coerceIn(1200, 7200)
  ```
- **Studio Lighting & Gradients:** Renders a 3-point soft portrait lighting backdrop using a linear gradient from warm cream (`#F3DEC0`) to deep studio taupe (`#9B7864`).
- **Pose & Wardrobe Variation Across Exposures:**
  - **Exposure #0:** Green blazer (`#68846F`), centered upright pose.
  - **Exposure #1:** Terracotta knit (`#AC5B48`), slight left torso tilt ($unit / 12$).
  - **Exposure #2:** Navy overcoat (`#304564`), right head tilt and direct gaze.
  - **Exposure #3:** Warm oat cardigan (`#B59A7A`) with styled celebratory hand gesture / victory peace sign (`fillRoundRect` finger elements).
- **Watermark Security Guard:**
  Every generated frame is permanently watermarked in bold typography:
  ```
  "LE SOUVENIR TEST PORTRAIT #$index"
  ```
  This guarantees that simulated imagery can never be confused with customer photos or misattributed in cloud albums.

### 3.2 Live View Simulation

During `LIVE_VIEW` state, `DemoCameraAdapter.startPreview` runs an independent background daemon thread (`v2-demo-preview`):
- Pushes JPEG frames at $640 \times 426$ every $55\text{ms}$ (~18 FPS).
- Displays animated crosshairs and a central rule-of-thirds viewfinder bounding box.
- Cleanly terminates upon `stopPreview()` with thread interruption.

---

## 4. End-to-End Session Lifecycle in DEMO Mode

The complete customer journey is executed identically to a real hardware session:

```
[IDLE] ──► session.start({ captureMode: "DEMO" })
   │
   ▼
[SELECTING] ──► session.setLayout / session.confirmSetup
   │
   ▼
[SELECTING_QUANTITY] ──► session.setQuantity
   │
   ▼
[PAYMENT_PENDING]
   │
   ├── payment.createLink ──► [DEMO Intercept] ──► status: "PAID", amount: 0
   │                                                    │
   └── payment.mockComplete({ method: "DEMO" }) ────────┘
   │
   ▼
[PREPARING] ──► [LIVE_VIEW] (Demo viewfinder streaming)
   │
   ▼
[COUNTDOWN] (3... 2... 1...) ◄────────────────┐
   │                                          │ (Loop until shotCount reached)
   ▼                                          │
[CAPTURING] (Flash overlay + 2400x1600 frame) ─┘
   │
   ├── Background: DesktopBeautyService.processCapture()
   ▼
[SELECTING_PHOTOS] (Customer chooses exact selectCount photos)
   │
   ▼
[EDITING] ──► frame.select (Customer picks frame design)
   │
   ├── Real DesktopCompositor renders 600 DPI canvas
   ▼
[PRINT_PENDING] ──► print.confirmDryRun / print.confirmReal
   │
   ├── Verify print canvas integrity via ImageIO.read()
   ├── Bypass Windows spooler (NO physical print)
   ├── Bypass SqliteSalesRepository (NO sales.db write)
   ├── revenueRecorded = false
   ▼
[DELIVERY] (Download QR + Session Finish)
```

### Detailed Lifecycle Phases

#### Phase 1: Zero-Charge Payment Resolution
In DEMO mode, payments bypass PayOS banking links entirely:
- **`payment.createLink`:** Automatically marks the session as paid:
  ```kotlin
  if (captureMode == "DEMO") {
      paid = true; paymentMethod = "DEMO"; state = "PREPARING"; startPreview(); state = "LIVE_VIEW"
      return snapshot().apply { addProperty("status", "PAID"); addProperty("amount", 0) }
  }
  ```
- **`payment.mockComplete`:** Requires explicit parameter `method: "DEMO"`. Setting `staffOverride: true` is strictly prohibited in DEMO mode, preventing operator confusion.

#### Phase 2: Dynamic Countdown & Capture Sequence
- When `capture.startSequence` is called, `RealSessionEngine` triggers the dynamic countdown specified by the layout (`layout.countdownSeconds`).
- Every second, `secondsRemaining` ticks down. At zero, state transitions to `CAPTURING`.
- The engine invokes `demoCamera.capture(directory(), index, layout.photoAspectRatio)` to generate the $2400 \times 1600$ image on disk as `original-shot-$index.jpg`.

#### Phase 3: Real Beauty & Real 600 DPI Composition
Unlike mock architectures that bypass image processing, DEMO mode runs the **production imaging pipeline**:
1. **`DesktopBeautyService`:** Asynchronously enqueues the captured portrait for skin smoothing, tone curve adjustment, and facial landmark alignment using ONNX models (`beauty-shot-$index.png`).
2. **Photo Selection:** Customer interacts with the UI to toggle and select the required number of shots (`selection.toggle`, `selection.confirm`).
3. **`DesktopCompositor`:** When a frame is chosen (`frame.select`), the compositor loads the selected high-resolution shots and the decorative PNG frame from disk. It renders the full **600 DPI physical print canvas** ($1200 \times 3600$ pixels for 5x15 cm strips or $2400 \times 3600$ pixels for 10x15 cm cards), applying ICC color profiles and QR code overlays.

#### Phase 4: Dry-Run Spooler & Delivery
When the customer clicks "In và tạo QR", the engine routes to `confirmPrint()`:
```kotlin
if (captureMode == "DEMO") {
    val image = printImage!!
    if (ImageIO.read(image.toFile()) == null) fail(-32002, "Invalid print canvas")
    printAccepted = true; revenueRecorded = false; state = "DELIVERY"
    return snapshot().apply { addProperty("dryRun", true) }
}
```
The print image is verified on disk for format integrity, but **no GDI print job is dispatched**, and the ledger is untouched.

---

## 5. Strict Safety Boundaries

To prevent financial leakage and hardware damage, the safety boundaries are hardcoded into the backend state machine:

| Boundary Dimension | Enforcement Mechanism | Failure Mode Prevented |
|---|---|---|
| **PayOS Banking** | Intercepted in `payment.createLink` and `payment.mockComplete` | Never contacts PayOS servers; zero QR bank charges generated. |
| **Physical Printer** | Intercepted in `confirmPrint()` prior to `printer.print()` call | Never sends print job to DNP RX1HS spooler; saves ribbon and paper. |
| **Accounting Ledger** | `ledger.recordSale(...)` is completely bypassed in DEMO branch | Never writes to `sales.db`; prevents artificial revenue inflation. |
| **Revenue Flag** | Snapshot explicitly sets `revenueRecorded = false` and `dryRun = true` | Prevents accounting sync workers from submitting fake revenue to Cloud APIs. |
| **Session Isolation** | DEMO session directories are stored with UUID v4 naming | Preserves generated artifacts for visual QA without overwriting real customer data. |

---

## 6. Verification & Test Evidence

The safety boundaries and end-to-end functionality of DEMO mode have been validated through rigorous automated tests:

### 6.1 Backend Unit Test: `RealSessionEngineDemoModeTest`

Located at: `backend/src/test/kotlin/com/lesouvenir/v2/ipc/RealSessionEngineDemoModeTest.kt`

```kotlin
@Test fun demoPrintNeverCreatesSale() {
    // 1. Initialized with an offline camera controller that throws if accessed
    val offline = object : CameraController {
        override fun isHardwareConnected() = false
        override fun capturePhoto(...) = error("offline")
        ...
    }
    RealSessionEngine(root, offline, PrinterManager(), ledger).use { engine ->
        // 2. Start session in DEMO mode
        call("session.start") { addProperty("layoutId", "demo"); addProperty("captureMode", "DEMO") }
        call("session.confirmSetup")
        call("session.setQuantity") { addProperty("quantity", 2) }
        
        // 3. Complete payment with DEMO method
        call("payment.mockComplete") { addProperty("method", "DEMO") }
        
        // 4. Run through sequence, photo selection, and frame selection
        call("capture.startSequence")
        ...
        call("selection.toggle") { addProperty("shotIndex", 0) }
        call("selection.confirm")
        call("frame.select") { addProperty("frameId", frameId) }
        call("frame.confirm")
        
        // 5. Confirm print in REAL endpoint
        val result = call("print.confirmReal")
        
        // 6. Assert strict financial safety
        assertTrue(result["printAccepted"].asBoolean)
        assertFalse(result["revenueRecorded"].asBoolean)
        assertNull(ledger.getSale(sid))
        assertTrue(ledger.getPendingSales().isEmpty())
    }
}
```

### 6.2 Acceptance Suite: `verify-demo-and-real-journey.mjs`

Located at: `tests/verify-demo-and-real-journey.mjs`

This live end-to-end test executes the compiled Windows Tauri v2 binary (`le-souvenir-v2.exe`) via Chrome DevTools Protocol (CDP) across both **1920×1200** and **1280×800** viewports:
1. Boots `le-souvenir-v2.exe` with `V2_RUNTIME_MODE=real`.
2. Triggers mode switch to `CHẾ ĐỘ CHỤP THỬ (DEMO)` on StartScreen.
3. Steps through Layout -> Quantity (2 strips) -> Demo Payment -> Live View Shutter -> Photo Selection -> Frame Selection -> 600 DPI Final Confirmation -> Delivery.
4. Validates that the 600 DPI composed image was rendered by verifying `naturalWidth > 0`.
5. Executes an independent SQLite query against `data/sales.db` to assert that zero rows exist where `capture_mode = 'DEMO'` and `revenue_recorded != 0`:
   ```sql
   SELECT COUNT(*) FROM sales WHERE COALESCE(revenue_recorded, 0) != 0 AND UPPER(COALESCE(capture_mode, '')) = 'DEMO';
   -- Result: 0 (PASS)
   ```
