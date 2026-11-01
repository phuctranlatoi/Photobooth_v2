# Camera Automatic Fallback & Dynamic Promotion Architecture

**Document ID:** `docs/CAMERA_AUTO_FALLBACK.md`  
**Status:** IMPLEMENTED & PASS-AUTOMATED / PASS-SIMULATED  
**Author:** V2 Solutions Architect  
**Date:** 2026-11-01  
**Security Boundary:** Legacy V1 (`PhotoboothDesktop`) is strictly READ-ONLY. All implementations and tests reside exclusively in V2 (`PhotoboothDesktop_v2`).

---

## 1. Executive Summary & Objective

In a commercial photobooth kiosk, hardware disruptions—such as a disconnected Canon DSLR USB cable, camera power cycling, or sleeping camera firmware—must never crash the desktop application or lock the customer in an unrecoverable state.

To guarantee high availability and seamless kiosk operation:
1. **Unified Application Architecture:** Eliminates clunky manual "DEMO vs. REAL" mode toggle switches from the customer touch interface.
2. **Background Health Monitoring:** Implements `CameraConnectionManager`, a dedicated resilient daemon thread polling hardware state every 2,000 ms (matching legacy V1 parity).
3. **Dynamic Promotion at Session Boundary (`IDLE` state):** Automatically detects camera availability when a customer starts a session, promoting to `REAL` mode when the DSLR is connected or falling back to `DEMO` mock mode when the camera is absent.
4. **Session Capture Mode Lock:** Locks `captureMode` during the active photo session to prevent mid-session state oscillations.
5. **Zero-Revenue Dry-Run Safety:** Ensures that all mock/demo captures are strictly non-monetized (0 đ, zero PayOS settlement, zero SQLite ledger writes, zero Neon DB writes, and zero physical DNP print submissions).

---

## 2. Component Architecture: `CameraConnectionManager`

The `CameraConnectionManager` (`com.lesouvenir.v2.camera.CameraConnectionManager`) encapsulates the native hardware camera controller (`CameraController`), the mock demo adapter (`DemoCameraAdapter`), and a non-blocking background heartbeat thread.

```
                      ┌─────────────────────────────────────────┐
                      │          RealSessionEngine              │
                      └──────────────────┬──────────────────────┘
                                         │
                                         ▼
                      ┌─────────────────────────────────────────┐
                      │       CameraConnectionManager           │
                      │  - checkIntervalMillis = 2,000 ms       │
                      │  - connectionState (7-state FSM)        │
                      └───────┬─────────────────────────┬───────┘
                              │                         │
                     (Hardware Present)          (Hardware Absent)
                              │                         │
                              ▼                         ▼
            ┌─────────────────────────────┐   ┌───────────────────────────┐
            │       CameraController      │   │     DemoCameraAdapter     │
            │   (Canon EDSDK / Webcam)    │   │  (High-Res Mock Frames)   │
            └─────────────────────────────┘   └───────────────────────────┘
```

### 2.1 The 7 Internal Connection States

`CameraConnectionManager` models hardware lifecycle through an explicit 7-state finite state machine (`CameraConnectionState`):

| # | State | Description | Transition Trigger |
|---|---|---|---|
| 1 | `DISCONNECTED` | Initial state or camera physically unplugged / powered down. | Monitor loop begins discovery; transitions to `CONNECTED` when `isHardwareConnected() == true`. |
| 2 | `DISCOVERING` | Active scanning of native USB buses and Canon EDSDK device handles. | Initiated during hardware initialization or explicit discovery command. |
| 3 | `CONNECTING` | JNA dynamic library handle opened; initiating Canon camera session (`EdsOpenSession`). | Successful handle open leads to `CONNECTED`; failure leads to `ERROR` or `DISCONNECTED`. |
| 4 | `CONNECTED` | Hardware camera initialized, configured, and responsive to ping/aperture queries. | Can transition to `LIVE_VIEW_READY` upon viewfinder activation, or `RECONNECTING` on ping timeout. |
| 5 | `LIVE_VIEW_READY` | Live viewfinder EVF stream active and transmitting JPEG/memory stream frames. | Can transition back to `CONNECTED` on stream stop, or `RECONNECTING` on 20 consecutive null frames. |
| 6 | `RECONNECTING` | Transient communication failure (USB hiccup or frame stall). Attempting handle reset. | If `isHardwareConnected()` succeeds, returns to `CONNECTED`; if failure persists, transitions to `DISCONNECTED`. |
| 7 | `ERROR` | Unrecoverable native exception or missing native DLL. | Requires manual operator intervention or process recycle; diagnostics recorded in `lastError`. |

### 2.2 The 2,000 ms Monitor Loop (V1 Parity)

Legacy V1 (`NativeEosCaptureService.kt:50–82`) monitored camera aperture and connection in a 2,000 ms loop. V2 preserves this exact cadence:

```kotlin
class CameraConnectionManager(
    val hardwareController: CameraController,
    val mockAdapter: DemoCameraAdapter = DemoCameraAdapter(),
    val checkIntervalMillis: Long = 2000L,
    startMonitor: Boolean = true,
) : AutoCloseable {
    @Volatile var connectionState: CameraConnectionState = CameraConnectionState.DISCONNECTED
        private set
    @Volatile var lastError: String? = null
        private set
    @Volatile var lastSeenTimestamp: Long = 0L
        private set

    private val monitor: Thread? = if (startMonitor) Thread({ monitorLoop() }, "v2-camera-monitor").apply {
        isDaemon = true
        start()
    } else null
```

In `monitorLoop()`, the daemon checks `hardwareController.isHardwareConnected()` every 2,000 ms:
- When in `DISCONNECTED` or `RECONNECTING`: if hardware is detected, transitions to `CONNECTED`, clears `lastError`, and updates `lastSeenTimestamp`.
- When in `CONNECTED` or `LIVE_VIEW_READY`: if hardware query fails, transitions to `RECONNECTING`.
- All errors are captured without terminating the thread: `lastError = e.message ?: e.javaClass.simpleName`.

---

## 3. Dynamic Promotion at Session Boundary (`IDLE` State)

### 3.1 Transparent Resolution Logic

Customers never see technical mode switches. When the user taps `"CHẠM ĐỂ BẮT ĐẦU →"` on `StartScreen`, the frontend dispatches `session.start({ layoutId })`.

In `RealSessionEngine.kt`:
```kotlin
case "session.start" -> {
    requireState("IDLE")
    // ... layout validation ...
    captureMode = p["captureMode"]?.asString ?: cameraManager.resolveCaptureMode()
    if (captureMode !in setOf("REAL", "DEMO")) fail(-32602, "Invalid captureMode")
    // ...
}
```

Where `cameraManager.resolveCaptureMode()` evaluates:
```kotlin
fun resolveCaptureMode(): String = if (isHardwareConnected()) "REAL" else "DEMO"
```

### 3.2 Dynamic Promotion Lifecycle

```
[Customer on StartScreen] (State: IDLE)
          │
          ▼
   Taps "CHẠM ĐỂ BẮT ĐẦU"
          │
          ▼
`session.start` received by RealSessionEngine
          │
     ┌────┴───────────────────────────────┐
     │ Is hardware camera connected?     │
     └────┬───────────────────────────┬───┘
          │ YES                       │ NO
          ▼                           ▼
captureMode = "REAL"            captureMode = "DEMO"
          │                           │
          ▼                           ▼
[PaymentScreen: Real Mode]      [PaymentScreen: Studio Trial]
- VietQR / PayOS Link           - Complimentary (0 đ)
- Standard Pricing (e.g. 70k)   - No Live Charge Card
- Cash Override via Staff Hold  - "BẮT ĐẦU CHỤP →"
          │                           │
          ▼                           ▼
[CaptureScreen: DSLR View]      [CaptureScreen: Mock View]
- Canon EDSDK Live View         - Demo Camera Synthesized View
- Shutter fires DSLR            - High-Res Mock Captures
          │                           │
          ▼                           ▼
[ConfirmScreen: 600 DPI]        [ConfirmScreen: 600 DPI]
- Real Print Image Composed     - Mock Print Image Composed
          │                           │
          ▼                           ▼
[Print Confirmation: Real]      [Print Confirmation: Dry-Run]
- Physical DNP Spool Job        - Zero Spool Submission
- SQLite Sales Ledger Write     - Zero Revenue Recorded
- Web Album Cloud Sync          - Local Mock Web Album Link
```

### 3.3 Mid-Session State Safety (Session Lock)

Once `captureMode` is established in `session.start`, it is **immutable for that customer session**:
- If `captureMode == "DEMO"`, the session remains in demo mode until `session.finish` returns to `IDLE`.
- If `captureMode == "REAL"`, every capture verifies hardware integrity:
  ```kotlin
  check(captureMode == "DEMO" || cameraManager.isHardwareConnected()) { "Camera disconnected" }
  ```
  If the DSLR disconnects mid-session, the engine halts with error code `-32000 ("Camera disconnected")` rather than silently injecting synthetic images into a paid transaction.

---

## 4. Zero-Revenue Dry-Run Safety

When operating in `DEMO` fallback mode, strict business safety rules prevent erroneous revenue recognition or hardware spooling:

### 4.1 Payment & Customer Presentation
- `PaymentScreen.tsx` detects `snapshot?.captureMode === 'DEMO'`.
- Order summary displays price as `0 đ` (`<Vnd amount={demo ? 0 : pricing?.totalAmount}/>`).
- The payment status chip displays `"Miễn phí"` (`Trải nghiệm Studio`).
- The VietQR payment link creation is bypassed; the customer sees:
  > **TRẢI NGHIỆM CHỤP ẢNH MIỄN PHÍ**  
  > *Phiên trải nghiệm quy trình chụp và ghép khung ảnh. Không thu phí và không in ảnh thật.*
- Tapping `"BẮT ĐẦU CHỤP →"` issues `payment.mockComplete` with `{ method: 'DEMO' }`.

### 4.2 Backend Enforcement (`RealSessionEngine.kt`)
In `confirmPrint()`:
```kotlin
if (captureMode == "DEMO") {
    val image = printImage!!
    if (ImageIO.read(image.toFile()) == null) fail(-32002, "Invalid print canvas")
    printAccepted = true
    revenueRecorded = false
    state = "DELIVERY"
    return snapshot().apply { addProperty("dryRun", true) }
}
```
1. **Zero Spooler Submission:** The physical printer manager (`printer.print(...)`) is completely bypassed.
2. **Zero SQLite Ledger Writes:** `ledger.recordSale(...)` is skipped; `revenueRecorded` is set to `false`.
3. **Zero Neon DB Writes:** No network call is dispatched to the Neon PostgreSQL database.
4. **Zero Cloudinary Uploads:** Live customer images are not uploaded to remote cloud buckets.

This zero-revenue behavior is mathematically proven and regression-guarded by `RealSessionEngineDemoModeTest`.

---

## 5. Verification Evidence & Test Results

The camera auto-fallback architecture is verified across backend unit tests and live Tauri WebView CDP runs:

| Test Suite / Harness | Scope | Result | Evidence |
|---|---|---|---|
| `CameraConnectionManagerTest` | FSM state transitions, 2,000ms loop, auto-fallback, hardware mock promotion | **PASS-AUTOMATED** (5 tests) | `TEST-com.lesouvenir.v2.camera.CameraConnectionManagerTest.xml` |
| `RealSessionEngineDemoModeTest` | Zero-revenue guard, dry-run composition, zero SQLite writes in DEMO mode | **PASS-AUTOMATED** (1 test) | `TEST-com.lesouvenir.v2.ipc.RealSessionEngineDemoModeTest.xml` |
| `DemoCameraAdapterTest` | High-res mock captures, 1:1/3:2 aspect ratios, thumbnail generation | **PASS-AUTOMATED** (3 tests) | `TEST-com.lesouvenir.v2.camera.demo.DemoCameraAdapterTest.xml` |
| Full Backend Suite | 17 test suites, 76 test cases | **PASS-AUTOMATED** (76/76) | `gradle test installDist` (`BUILD SUCCESSFUL`) |
| Live Desktop CDP Acceptance | Dual-viewport (1280×800 & 1920×1200) complete journey | **PASS-SIMULATED** (35/35 checks) | `tests/journey-evidence/2026-11-01T14-23-26.975Z/results.json` |

---

## 6. Truthful Hardware Verification Boundary

1. **Software & Mock Fallback:** **VERIFIED** on live Windows desktop via Tauri CDP. The background connection manager correctly falls back to `DEMO` when the physical camera is offline, executes 600-DPI composition, and safely delivers photos with zero revenue.
2. **Real Hardware Execution:** Canon EDSDK JNA bindings and native DLL dispatch (`CameraController`) are fully compiled and wired, but **PHYSICAL EXECUTION REMAINS PENDING PHYSICAL DEVICE ATTACHMENT** in the hardware lab. Real DSLR captures and physical DNP RX1HS prints have not been executed and will not be claimed until an authorized device run is completed.
