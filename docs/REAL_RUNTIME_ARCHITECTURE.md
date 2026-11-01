# LE SOUVENIR Photobooth V2 — Real Runtime Architecture

**Document ID:** `REAL_RUNTIME_ARCHITECTURE.md`  
**Milestone:** Milestone 5 Architecture Baseline  
**Author:** Specialist Solutions Architect (V2)  
**Date:** November 2026  
**Status:** APPROVED ARCHITECTURAL SPECIFICATION  
**Boundaries:** Legacy V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) is strictly READ-ONLY. All writes belong to V2 (`E:\HK1_2026_2027\PhotoboothDesktop_v2`). No secrets or customer PII are disclosed.

---

## 1. Executive Summary & Architectural Scope

The V2 platform has successfully validated its isolated subsystems across prior milestones:
- **Milestone 2 (Camera):** Verified `CameraManager`, `CanonCameraAdapter` (EDSDK 64-bit JNA), `WebcamCameraAdapter` (Sarxos), and `HotFolderCameraAdapter` behind fail-closed `HardwareAuthorization`.
- **Milestone 3 (Imaging & CV):** Verified 600 DPI composition in `DesktopCompositor`, 3D LUT filters in `DesktopImageProcessor`, and facial skin enhancement in `DesktopBeautyService` (YuNet face detection + BiSeNet face parsing ONNX models + Guided Luminance Filter).
- **Milestone 4 (Printer):** Verified `LegacyPrinter` and `PrinterManager` supporting DNP DS-RX1 / DS-RX1HS dye-sub cut flow (`CUT_5X15_2UP` 2452×3658 px and `PHOTO_10X15` 3658×2452 px) via Java Print Service with duplicate protection.
- **Integrations:** Validated `PayOsClient` (VietQR payment link generation and status polling), `CloudinaryClient` (multipart asset upload), `WebAlbumClient` (customer album management), `RevenueClient` (REST revenue sync), and `RevenueRecognition` (atomic gate logic).

**The Objective of Milestone 5:**  
Design a unified runtime engine architecture that supports two operational modes:
1. **SIMULATOR MODE (`--simulator`):** For fast headless unit/integration testing, offline UI design verification, and automated fault injection.
2. **REAL MODE (`--real`):** For physical Windows kiosks equipped with Canon DSLRs, DNP RX1HS printers, real PayOS VietQR transactions, on-device SQLite sales logging, and cloud album delivery.

### The Non-Negotiable Real-Mode Invariant
> **Real mode must NEVER secretly substitute synthetic captures, mock payments, or fake print confirmations.**  
> If hardware is unavailable, unpowered, or disconnected, the real runtime must fail closed with explicit diagnostic error codes and transition to `RECOVERY`, never silently faking success.

---

## 2. Dual Runtime Engine Architecture

### 2.1 Process & Process Tree Architecture

The photobooth runs on Windows 10/11 64-bit under a parent-child desktop architecture:

```
tauri.exe (Host Shell — Rust Tauri v2)
├── WebView2 Process (Frontend Touchscreen UI — React 18 + TS + Tailwind)
│   └── Typed IPC Client (frame-length prefixed stdio)
└── Child Process: java.exe (Kotlin/JVM Backend Sidecar)
    ├── Main / Event Loop Thread (IpcMain + HealthBridge)
    │   └── PhotoboothSessionEngine (Authoritative State Machine)
    ├── Canon EDSDK Dispatcher Thread (Native Win32 Message Pump)
    │   └── JNA Bridge -> EDSDK.dll & EdsImage.dll
    ├── Imaging & Beauty Worker Pool (Single-Thread / Coroutines IO)
    │   ├── YuNet / BiSeNet ONNX Runtime Inference
    │   ├── 3D LUT Color Transformation
    │   └── 600 DPI Canvas Compositor + ZXing QR Generator
    ├── Print Spooler Worker (Java AWT PrinterJob -> DNP DS-RX1HS)
    ├── SQLite Sales Ledger (`data/sales.db` via JDBC)
    └── Background Cloud Sync Worker Pool (PayOS, Cloudinary, Neon/REST)
```

### 2.2 Engine Mode Abstraction

The backend exposes a single unified interface to the IPC framing bridge:

```kotlin
package com.lesouvenir.v2.ipc

import com.google.gson.JsonObject

enum class RuntimeMode {
    SIMULATOR,
    REAL
}

interface SessionEngine : AutoCloseable {
    val mode: RuntimeMode
    fun dispatch(method: String, params: JsonObject): JsonObject
}
```

#### Dual Engine Implementations:
1. `SimulatorSessionEngine`:
   - Uses `SimulatorCamera` (pure in-memory SVG/RGB shapes).
   - Uses `SimulatorCompositor` (300 DPI placeholder boxes).
   - Mock payment via `payment.mockComplete`.
   - Dry-run confirmation via `print.confirmDryRun`.
   - Zero physical printing, zero SQLite revenue recording, zero cloud uploads.
2. `RealSessionEngine`:
   - Uses `CameraManager` (`CanonCameraAdapter`, `WebcamCameraAdapter`, or `HotFolderCameraAdapter`).
   - Uses `DesktopBeautyService` + `DesktopImageProcessor` + `DesktopCompositor` (600 DPI, ZXing QR).
   - Real PayOS integration (`payment.createLink`, `payment.checkStatus`).
   - Real DNP printing via `PrinterManager` (`print.confirmReal`).
   - Durable on-device sales journaling in `data/sales.db`.
   - Async cloud sync to Neon REST API and Cloudinary/WebAlbum.

### 2.3 Startup CLI Flag & Factory

The backend entry point (`com.lesouvenir.v2.ipc.IpcMainKt`) inspects CLI arguments upon launch:

```kotlin
fun main(args: Array<String>) {
    val mode = when {
        args.contains("--real") -> RuntimeMode.REAL
        args.contains("--simulator") -> RuntimeMode.SIMULATOR
        else -> {
            System.err.println("Usage: backend [--real | --simulator]")
            kotlin.system.exitProcess(2)
        }
    }

    val workspace = Path.of("").toAbsolutePath().normalize()
    val engine: SessionEngine = when (mode) {
        RuntimeMode.SIMULATOR -> SimulatorSessionEngine.production(workspace)
        RuntimeMode.REAL -> RealSessionEngine.create(workspace)
    }

    engine.use { activeEngine ->
        HealthBridge(activeEngine).serve(System.`in`, System.out)
    }
}
```

---

## 3. The Authoritative Real-Mode State Machine

The state machine is solely governed by the backend. The frontend cannot transition state arbitrarily; it sends commands and polls `session.getState`.

```
                    ┌─────────────────────────┐
                    │          IDLE           │◄─────────────────────────────┐
                    └────────────┬────────────┘                              │
                                 │ session.start                             │
                    ┌────────────▼────────────┐                              │
                    │        SELECTING        │                              │
                    └────────────┬────────────┘                              │
                                 │ session.setLayout                         │
                    ┌────────────▼────────────┐                              │
                    │   SELECTING_QUANTITY    │                              │
                    └────────────┬────────────┘                              │
                                 │ session.setQuantity                       │
                    ┌────────────▼────────────┐                              │
                    │     PAYMENT_PENDING     │                              │
                    └────────────┬────────────┘                              │
                                 │ payment verified (PayOS PAID)             │
                    ┌────────────▼────────────┐                              │
                    │        PREPARING        │ (Camera init, verify AF/USB) │
                    └────────────┬────────────┘                              │
                                 │ camera ready                              │
         ┌───────────────────────┴───────────────────────┐                   │
         │                                               │                   │
┌────────▼────────┐    tick      ┌───────────┐    done   ┌▼───────────┐      │
│    LIVE_VIEW    ├─────────────►│ COUNTDOWN ├──────────►│ CAPTURING  │      │
└────────▲────────┘              └───────────┘           └─────┬──────┘      │
         │                                                     │             │
         └─────────────────── shots < shotCount ───────────────┘             │
                                 │ shots == shotCount                        │
                    ┌────────────▼────────────┐                              │
                    │    SELECTING_PHOTOS     │ (Beauty & LUT applied)       │
                    └────────────┬────────────┘                              │
                                 │ selection.confirm                         │
                    ┌────────────▼────────────┐                              │
                    │         EDITING         │ (Choose frame, render 600DPI)│
                    └────────────┬────────────┘                              │
                                 │ frame.confirm                             │
                    ┌────────────▼────────────┐                              │
                    │      PRINT_PENDING      │                              │
                    └────────────┬────────────┘                              │
                                 │ print.confirmReal                         │
                    ┌────────────▼────────────┐                              │
                    │        DELIVERY         │──────────────────────────────┘
                    └─────────────────────────┘      session.finish
```

### Inactivity & Timeout Rules in Real Mode
1. **`PAYMENT_PENDING` Timeout:** Defaults to 180 seconds. If no payment received, session cancels back to `IDLE`.
2. **`SELECTING_PHOTOS` Timeout:** Configured via operator settings (`photoSelectionTimeoutSeconds`, default 90s). Upon expiry, system automatically selects the first `selectCount` photos and advances to `EDITING`.
3. **`EDITING` Timeout:** Configured via operator settings (`frameSelectionTimeoutSeconds`, default 60s). Upon expiry, selects default frame and advances to `PRINT_PENDING`.
4. **`PRINT_PENDING` Timeout:** Defaults to 90 seconds. To prevent paper and revenue loss, **INACTIVITY AUTO-PRINT IS STRICTLY FALSE**. If customer walks away without tapping confirm, the session times out, cancels print, and prompts staff assistance.

---

## 4. Subsystems Integration & Real Pipeline

### 4.1 Camera Pipeline (`com.lesouvenir.v2.camera.real`)
- **Primary Source:** Canon DSLR via `CanonCameraAdapter` using EDSDK 64-bit JNA.
  - Windows message pump running on a dedicated thread (`User32.INSTANCE.PeekMessage`).
  - Shutter release via `SafeShootCommand(EdsSaveTo.kEdsSaveTo_Host, 3)`.
  - Continuous Servo AF is preserved (no `endLiveView` before shutter release).
- **Webcam Alternative:** `WebcamCameraAdapter` (Sarxos Webcam Capture) for fallback/development.
- **Hot Folder Alternative:** `HotFolderCameraAdapter` watching `data/hotfolder` for external tethering software (e.g., Canon EOS Utility 3).
- **Horizontal Mirroring Rule:** Every live frame and final capture is mirrored horizontally (`graphics.scale(-1.0, 1.0)`) so the customer sees an intuitive mirror reflection on the touchscreen.
- **Fail-Closed Rule:** If the camera disconnects during `PREPARING` or `CAPTURING`, the engine throws `-32000` (Hardware Unavailable) and transitions to `RECOVERY`. No synthetic image is EVER substituted.

### 4.2 Beauty & Image Processing Pipeline (`com.lesouvenir.v2.imaging`)
Following capture of each raw image:
1. **Raw Storage:** Saved to session directory as `original-shot-$index.jpg`.
2. **Face Detection & Parsing:**
   - `YuNetFaceDetector` runs ONNX inference to locate all human faces and 5 facial landmarks.
   - `CustomerFaceSelector` isolates foreground customer faces (ignoring background bystanders).
   - `OnnxFaceParsingService` (BiSeNet) creates accurate masks for facial skin.
3. **Skin Smoothing & Enhancement:**
   - `FaceOvalMaskBuilder` blends soft boundaries.
   - `BeautyProcessor` applies `GuidedLuminanceFilter` (smoothing blemishes while preserving eye and hair edge sharpness) and warm skin tone adjustments in YCbCr color space.
4. **Bounded Execution & Fallback:**
   - Maximum allowed Beauty processing time per photo is **3,000 ms**.
   - If face detection fails, times out, or is cancelled, the pipeline immediately falls back to the original capture without blocking customer interaction.
5. **LUT Color Grading:**
   - Operator-selected `.cube` 3D LUT filter applied via `DesktopImageProcessor`.
   - Result saved as `Photo_$index.jpg`.

### 4.3 600 DPI Composition & Pre-Generated QR Code
When entering `EDITING` and generating the preview/print files:
1. **Pre-Generated WebAlbum:**
   - The backend calls `WebAlbumClient.createAlbum(CreateAlbumRequest(sessionId, expectedAssets, expiresInDays = 7))` to obtain the customer album URL *before* rasterizing the print image.
2. **ZXing QR Code Rendering:**
   - `DesktopCompositor` generates a crisp QR code bitmap pointing to `preAlbum.albumUrl`.
   - QR code is stamped onto the lower frame margin.
3. **Print Spool Dimensions (600 DPI):**
   - **5×15 cm 2-Up Strips:** DNP RX1HS prints 10×15 cm media cut into two 5×15 cm strips. Composition canvas is **2452 × 3658 px** (`PrintLayout.CUT_5X15_2UP`). Left and right strips are identical with a 4 px center bleed margin.
   - **10×15 cm Full Prints:** Composition canvas is **3658 × 2452 px** (`PrintLayout.PHOTO_10X15`).
4. **Artifact Generation:**
   - `composition.png`: Raw composition without QR (for Cloudinary/WebAlbum display).
   - `print_composition.png`: 600 DPI raster with stamped QR code (for DNP RX1HS printer).

---

## 5. The Golden Revenue & Delivery Sequence

This sequence is the financial and operational core of the booth. Revenue recognition must be strictly coupled to physical print spooler acceptance.

### 5.1 Sequence Flowchart

```
Customer taps "In và tạo QR" (Confirm Print)
                     │
                     ▼
       IPC Call: `print.confirmReal`
                     │
                     ▼
       Idempotency & Guard Check:
       - State == PRINT_PENDING?
       - paid == true?
       - commandId previously executed?
                     │
                     ▼
          Submit to Windows Spooler
       `PrinterManager.print(request)`
                     │
          ┌──────────┴──────────┐
          │                     │
      Rejected /            Submitted
       Failure                  │
          │                     ▼
          │         Atomic Local Ledger Write:
          │         Insert into `data/sales.db`
          │         with `sync_status = 'PENDING'`
          │                     │
          │         ┌───────────┴───────────┐
          │         │                       │
          │         ▼                       ▼
          │    Async Cloud Sync        Async Cloud Delivery
          │    `RevenueClient`         Upload to Cloudinary
          │    POST transactions       Finalize WebAlbum
          │    On 200: sync='SYNCED'   Complete Album
          │         │                       │
          │         └───────────┬───────────┘
          │                     │
          │                     ▼
          │            Transition State:
          │            state = 'DELIVERY'
          │            printAccepted = true
          │            revenueRecorded = true
          │            userConfirmed = true
          │                     │
          │                     ▼
          │            Return IPC Snapshot
          │
          ▼
   Return IPC Error (-32002)
   - Do NOT record sale in DB
   - Do NOT mark revenueRecorded
   - Remain in PRINT_PENDING (or RECOVERY)
   - UI shows Retry / Cancel dialog
```

### 5.2 Step-by-Step Execution Rules

#### Step 1: Physical Print Submission
- Backend constructs `ManagedPrintRequest(sessionId, printImagePath, copies, printerName, layout)`.
- `PrinterManager` verifies:
  1. `sessionId` is not blank and has not been submitted previously in this session.
  2. `printImagePath` exists, is readable, and dimensions match `PrintLayout` (2452×3658 or 3658×2452).
  3. `printerName` matches an installed Windows print service.
- Calls `LegacyPrinter.submit(...)`:
  - Acquires `PrinterJob` for DNP DS-RX1 / DS-RX1HS.
  - Sets `Copies(actualSheets)` where `actualSheets = copies / 2` for 5×15 2-up, or `copies` for 10×15.
  - Submits job to Windows Spooler.
- Returns `PrintResult.Submitted` upon successful handoff to the OS spooler.

#### Step 2: Local SQLite Sales Ledger (`data/sales.db`)
Immediately upon receiving `PrintResult.Submitted`:
- Insert record into SQLite table `sales`:
  ```sql
  INSERT OR IGNORE INTO sales (
      session_id, booth_id, layout_id, layout_title,
      print_size, quantity, included_quantity, extra_quantity,
      base_price, extra_unit_price, extra_amount, total_amount,
      payment_method, created_at, status, sync_status
  ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, 'completed', 'PENDING'
  );
  ```
- SQLite write is synchronous and committed immediately.
- Resulting evidence: `revenueRecorded = true`.

#### Step 3: Asynchronous Remote Sync & Asset Delivery
Two background coroutines fire concurrently without delaying the customer UI:
1. **Remote Revenue Sync (`RevenueClient`):**
   - Transmits `SaleTransaction` payload to the remote REST endpoint (`/api/v1/revenue/transactions`).
   - If HTTP 200/201 is received, execute:
     ```sql
     UPDATE sales SET sync_status = 'SYNCED' WHERE session_id = ? AND sync_status = 'PENDING';
     ```
   - If offline or error: record remains `PENDING`. The periodic `SalesSyncWorker` will re-attempt sync when connectivity restores.
2. **Cloud Asset Upload (`CloudinaryClient` & `WebAlbumClient`):**
   - Upload original photos (`Photo_0.jpg`, `Photo_1.jpg`, etc.) via multipart HTTP.
   - Register assets with `webAlbumClient.finalizeAsset(albumId, FinalizeAssetRequest(kind = "ORIGINAL", ...))`.
   - Upload master composite image (`composition.png`).
   - Register master print asset (`kind = "PRINT"`).
   - Complete album: `webAlbumClient.completeAlbum(albumId)`.

#### Step 4: Snapshot Delivery
The IPC call returns:
```json
{
  "sessionId": "4b21e89f-8893-4a11-a8bb-e22f28127394",
  "state": "DELIVERY",
  "printAccepted": true,
  "revenueRecorded": true,
  "userConfirmed": true,
  "albumUrl": "https://lesouvenir.vn/album/alb_8293741?token=tok_912384",
  "previewDataUrl": "data:image/jpeg;base64,...",
  "commandId": "cmd-uuid-confirm"
}
```

#### Step 5: Handling Print Rejection or Spooler Failure
If the driver returns `PrintResult.Rejected`, `PrintResult.Denied`, or throws an exception:
- **NO SQLITE WRITE** is executed.
- `revenueRecorded` remains `false`.
- State remains `PRINT_PENDING` (or transitions to `RECOVERY` if the printer is offline).
- The IPC returns an error:
  ```json
  {
    "jsonrpc": "2.0",
    "id": "shell-42",
    "protocolVersion": 1,
    "error": {
      "code": -32002,
      "message": "Printer spooler rejected job: DNP DS-RX1 is out of paper or offline"
    }
  }
  ```
- Customer/Operator can clear the printer fault and tap retry, or cancel the session.

---

## 6. IPC Contract Specification for Real Mode

All IPC messages use JSON-RPC 2.0 framed with a 4-byte big-endian unsigned length header over inherited stdio. Maximum payload size is 1,048,576 bytes (1 MiB).

### 6.1 Method: `device.getStatus`
Query current hardware, runtime mode, and system health. Does not require `commandId` or `sessionId`.

#### Request
```json
{
  "jsonrpc": "2.0",
  "id": "shell-1",
  "protocolVersion": 1,
  "method": "device.getStatus",
  "params": {}
}
```

#### Response (Real Mode)
```json
{
  "jsonrpc": "2.0",
  "id": "shell-1",
  "protocolVersion": 1,
  "result": {
    "runtimeMode": "REAL",
    "camera": {
      "mode": "CANON_DSLR",
      "connected": true,
      "name": "Canon EOS 200D II (EDSDK)",
      "liveViewActive": true
    },
    "printer": {
      "name": "DS-RX1 (Copy 1)",
      "detected": true,
      "isDnpRx1hs": true,
      "systemPrintEnabled": true,
      "availablePrinters": ["DS-RX1 (Copy 1)", "Microsoft Print to PDF"]
    },
    "beauty": {
      "available": true,
      "enabled": true,
      "onnxRuntimeLoaded": true,
      "modelsLoaded": ["yunet.onnx", "bisenet.onnx"]
    },
    "ledger": {
      "salesDbConnected": true,
      "pendingSyncCount": 0
    },
    "cloud": {
      "payOsConfigured": true,
      "cloudinaryConfigured": true,
      "webAlbumConfigured": true,
      "revenueEndpointConfigured": true
    },
    "jvm": {
      "backendPid": 14208,
      "uptimeMs": 28400,
      "jvmVersion": "21.0.2+13-LTS"
    }
  }
}
```

---

### 6.2 Method: `payment.createLink`
Generates a real PayOS VietQR payment code for the customer to scan on screen.

#### Precondition
Session state must be `PAYMENT_PENDING`.

#### Request
```json
{
  "jsonrpc": "2.0",
  "id": "shell-2",
  "protocolVersion": 1,
  "method": "payment.createLink",
  "params": {
    "sessionId": "4b21e89f-8893-4a11-a8bb-e22f28127394",
    "generationId": "9b12a34c-1234-4567-89ab-cdef01234567",
    "commandId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "description": "LE SOUVENIR - Strip 2"
  }
}
```

#### Response
```json
{
  "jsonrpc": "2.0",
  "id": "shell-2",
  "protocolVersion": 1,
  "result": {
    "orderCode": 1730462910482,
    "amount": 70000,
    "qrCode": "00020101021238540010A00000072701240006970422011017304629104853037045405700005802VN62250821LE SOUVENIR - Strip 26304ABCD",
    "checkoutUrl": "https://pay.payos.vn/web/1730462910482",
    "status": "PENDING",
    "commandId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
  }
}
```

---

### 6.3 Method: `payment.checkStatus`
Polls the backend / PayOS gateway for payment receipt. When paid, the backend updates its internal state and prepares the camera.

#### Request
```json
{
  "jsonrpc": "2.0",
  "id": "shell-3",
  "protocolVersion": 1,
  "method": "payment.checkStatus",
  "params": {
    "sessionId": "4b21e89f-8893-4a11-a8bb-e22f28127394",
    "generationId": "9b12a34c-1234-4567-89ab-cdef01234567",
    "orderCode": 1730462910482
  }
}
```

#### Response (Pending)
```json
{
  "jsonrpc": "2.0",
  "id": "shell-3",
  "protocolVersion": 1,
  "result": {
    "orderCode": 1730462910482,
    "status": "PENDING",
    "paid": false,
    "amount": 70000
  }
}
```

#### Response (Paid — State Transitions to `PREPARING` -> `LIVE_VIEW`)
```json
{
  "jsonrpc": "2.0",
  "id": "shell-3",
  "protocolVersion": 1,
  "result": {
    "orderCode": 1730462910482,
    "status": "PAID",
    "paid": true,
    "amount": 70000,
    "nextState": "PREPARING"
  }
}
```

---

### 6.4 Method: `print.confirmReal`
Authoritative print submission to physical printer, followed by revenue journaling and asset delivery.

#### Precondition
Session state must be `PRINT_PENDING`, `paid == true`, and composition ready.

#### Request
```json
{
  "jsonrpc": "2.0",
  "id": "shell-4",
  "protocolVersion": 1,
  "method": "print.confirmReal",
  "params": {
    "sessionId": "4b21e89f-8893-4a11-a8bb-e22f28127394",
    "generationId": "9b12a34c-1234-4567-89ab-cdef01234567",
    "commandId": "e987f654-3210-4abc-def0-123456789abc"
  }
}
```

#### Response (Success)
```json
{
  "jsonrpc": "2.0",
  "id": "shell-4",
  "protocolVersion": 1,
  "result": {
    "sessionId": "4b21e89f-8893-4a11-a8bb-e22f28127394",
    "generationId": "9b12a34c-1234-4567-89ab-cdef01234567",
    "state": "DELIVERY",
    "printAccepted": true,
    "revenueRecorded": true,
    "userConfirmed": true,
    "albumUrl": "https://lesouvenir.vn/album/alb_8293741?token=tok_912384",
    "printerName": "DS-RX1 (Copy 1)",
    "commandId": "e987f654-3210-4abc-def0-123456789abc"
  }
}
```

#### Response (Printer Fault / Rejection)
```json
{
  "jsonrpc": "2.0",
  "id": "shell-4",
  "protocolVersion": 1,
  "error": {
    "code": -32002,
    "message": "Print rejected: Printer DS-RX1 (Copy 1) is not ready or out of media"
  }
}
```

---

### 6.5 Backwards Compatibility Methods

#### A. `payment.mockComplete`
- **In Simulator Mode (`--simulator`):** Transitions state from `PAYMENT_PENDING` to `PREPARING` -> `LIVE_VIEW`, sets `paid = true`.
- **In Real Mode (`--real`):**  
  - By default, rejected with error:
    ```json
    { "code": -32001, "message": "payment.mockComplete is prohibited in REAL mode" }
    ```
  - **Staff Kiosk Bypass:** If params contain `"staffOverride": true` and pass operator authorization validation, allows testing without cash deduction, logging `paymentMethod: "STAFF_COMP"` in SQLite. It will NEVER create a fake PayOS transaction ID.

#### B. `print.confirmDryRun`
- **In Simulator Mode (`--simulator`):** Transitions state to `DELIVERY` with `printAccepted: false, revenueRecorded: false`.
- **In Real Mode (`--real`):**  
  - Executes full 600 DPI composition and saves images to disk for preview inspection.
  - **Does NOT** call `PrinterJob.print()`.
  - **Does NOT** insert into `data/sales.db`.
  - Returns snapshot with `printAccepted: false, revenueRecorded: false, dryRun: true`.
  - Enables non-destructive operator calibration on live kiosks without consuming expensive paper ribbons.

---

### 6.6 Domain Error Code Catalog

| Code | Label | Meaning | Action / Recovery |
|:---|:---|:---|:---|
| `-32700` | Parse Error | Stdio JSON payload corrupted | Shell must log and close connection |
| `-32600` | Invalid Request | Missing required protocol fields (`id`, `jsonrpc`, `protocolVersion`) | Fix envelope schema |
| `-32601` | Method Not Found | Unrecognized method name | Verify IPC method name spelling |
| `-32602` | Invalid Params | Missing UUIDs, bad types, or unknown parameters | Validate parameter object |
| `-32603` | Internal Error | Unhandled JVM exception | Check JVM stderr logs |
| **`-32000`** | **Hardware Unavailable** | Camera or DNP printer physically disconnected/unpowered | Prompt user/staff to connect hardware; enter `RECOVERY` |
| **`-32001`** | **State Violation** | Command not permitted in current state (e.g., capture during payment) | Ignore or reset session to `IDLE` |
| **`-32002`** | **Hardware Error** | Camera shutter release failed or Windows Print Spooler rejected job | Allow customer to retry print or cancel session |
| **`-32003`** | **Gateway Error** | PayOS network timeout, bad HMAC, or Cloudinary HTTP error | Prompt retry or staff cash assistance |
| **`-32004`** | **Stale / Duplicate** | Replayed `commandId` or stale `sessionId`/`generationId` | Reconcile UI state via `session.getState` |
| **`-32010`** | **Security Violation** | Attempt to execute simulator-only mock methods in strict real mode | Prohibit action |

---

## 7. Local SQLite Ledger Specification (`data/sales.db`)

To ensure zero lost revenue when network connections drop in retail venues, the local SQLite ledger is the authoritative on-device record of sales.

### 7.1 Path & Isolation
- **Path:** `E:\HK1_2026_2027\PhotoboothDesktop_v2\data\sales.db`
- Strictly separated from V1's database. Created automatically on first boot.

### 7.2 Database Schema
```sql
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    booth_id TEXT NOT NULL,
    layout_id TEXT NOT NULL,
    layout_title TEXT NOT NULL,
    print_size TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    included_quantity INTEGER NOT NULL,
    extra_quantity INTEGER NOT NULL,
    base_price INTEGER NOT NULL,
    extra_unit_price INTEGER NOT NULL,
    extra_amount INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    sync_status TEXT NOT NULL DEFAULT 'PENDING',
    original_quantity INTEGER,
    original_total_amount INTEGER,
    adjust_reason TEXT,
    adjusted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_sync_status ON sales(sync_status);
```

### 7.3 Concurrency & Lock Handling
- Connection configured with `PRAGMA busy_timeout = 5000;`.
- WAL (Write-Ahead Logging) mode enabled: `PRAGMA journal_mode = WAL;`.
- Reads and writes use dedicated connection pools to eliminate SQLite table locks during async sync sweeps.

---

## 8. Implementation & Migration Instructions

### 8.1 Instructions for `backend-engineer`

1. **Implement `RealSessionEngine.kt`:**
   - Package: `com.lesouvenir.v2.ipc.RealSessionEngine`.
   - Wire `CameraManager` with `HardwareAuthorization(explicitlyApproved = true)`.
   - Wire `DesktopBeautyService`, `DesktopImageProcessor`, and `DesktopCompositor`.
   - Wire `PrinterManager` with `dryRun = false`.
   - Wire `PayOsClient`, `CloudinaryClient`, and `WebAlbumClient`.
2. **Implement `SqliteSalesRepository.kt`:**
   - Package: `com.lesouvenir.v2.data.SqliteSalesRepository`.
   - Manage schema creation and synchronous `recordSale(SaleTransaction)`.
   - Implement `syncPendingSales(RevenueClient)`.
3. **Update `IpcMain.kt`:**
   - Add CLI argument parsing for `--real` and `--simulator`.
   - Instantiate `RealSessionEngine` when `--real` is specified.
4. **Implement Real IPC Dispatch Table:**
   - Add routes for `payment.createLink`, `payment.checkStatus`, `print.confirmReal`.
   - Implement fail-closed guard: in `--real`, reject `payment.mockComplete` unless `staffOverride == true`.
5. **Unit & Integration Tests:**
   - Write `RealSessionEngineTest.kt` verifying that disconnected hardware immediately returns `-32000` and does NOT secretly substitute synthetic images.
   - Verify that `print.confirmReal` fails closed if printer is offline and writes zero records to `sales.db`.

### 8.2 Instructions for `frontend-coder`

1. **Update Tauri Command Whitelist (`src-tauri/src/main.rs`):**
   - Add `payment.createLink`, `payment.checkStatus`, and `print.confirmReal` to the permitted method list in `simulator_request` / `ipc_request`.
2. **Update TypeScript Contract Types (`frontend/src/shared/`):**
   - Create `frontend/src/shared/photobooth-contract.ts` declaring:
     - `PaymentCreateLinkResult`: `{ orderCode: number; amount: number; qrCode: string; checkoutUrl: string; status: string }`
     - `PaymentCheckStatusResult`: `{ orderCode: number; status: 'PAID' | 'PENDING'; paid: boolean; amount: number }`
     - `PrintConfirmRealResult`: `{ sessionId: string; state: 'DELIVERY'; printAccepted: boolean; revenueRecorded: boolean; userConfirmed: boolean; albumUrl: string }`
3. **Update `PaymentScreen.tsx`:**
   - On mount in state `PAYMENT_PENDING`:
     - Issue `payment.createLink`.
     - Render the returned VietQR code prominently using a canvas or SVG QR renderer.
     - Display countdown and VND amount.
     - Poll `payment.checkStatus` every 1,500 ms.
     - When `paid === true`, the screen auto-advances as the engine moves to `PREPARING`.
     - Retain long-press staff gesture for authorized cash bypass.
4. **Update `ConfirmScreen.tsx`:**
   - Change confirm button action to invoke `print.confirmReal`.
   - While `busy === true`, display full-screen status spinner: *"Đang gửi lệnh in tới máy in DNP RX1HS... Vui lòng không tắt máy"*.
   - If error is caught, display alert with "Thử lại" (Retry `print.confirmReal`) and "Quay lại" without resetting the session.
5. **Update `DeliveryScreen.tsx`:**
   - Render the live `albumUrl` QR code from the snapshot so customers can scan with their phone.
   - Display print completion status.

---

## 9. Verification & Acceptance Criteria

| Checkpoint | Pass Criteria | Validation Method |
|:---|:---|:---|
| **Mode Segregation** | Backend starts cleanly with either `--simulator` or `--real`. Reject invalid flags. | CLI launcher smoke test |
| **Fail-Closed Camera** | In `--real`, disconnecting camera causes `-32000` error; zero synthetic frames served. | Unit test + physical USB test |
| **VietQR Flow** | `payment.createLink` returns valid VietQR string; `payment.checkStatus` transitions to `PREPARING` on `PAID`. | PayOS sandbox webhook/polling test |
| **DNP Print Handoff** | `print.confirmReal` submits 2452×3658 px 600 DPI bitmap to DNP queue via Java Print Service. | Windows Print Spooler inspection |
| **Ledger Durability** | On successful print, `data/sales.db` contains exactly one record with `sync_status = 'PENDING'`. | SQLite CLI verification |
| **Print Failure Gate** | If DNP printer is paused/offline, `print.confirmReal` returns `-32002`; **zero** rows written to SQLite. | Driver pause simulation test |
| **Idempotency** | Double-tapping "Confirm Print" sends identical `commandId`; backend returns cached result without double-printing. | Concurrency integration test |
