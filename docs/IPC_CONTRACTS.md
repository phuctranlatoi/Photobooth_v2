# LE SOUVENIR Photobooth V2 — Complete Typed IPC Specification

**Document ID:** `IPC_CONTRACTS.md`  
**Version:** 2.0.0 (Production & Simulator Specification)  
**Status:** APPROVED ARCHITECTURAL SPECIFICATION  
**Author:** Specialist Solutions Architect (V2)  
**Scope:** Private framed stdio transport between Tauri desktop host and Kotlin/JVM backend sidecar. Covers all operational methods across Simulator, Real Hardware, and Camera-Free Demo modes.

---

## 1. Transport & Framing Specification

| Property | Value | Rationale |
|---|---|---|
| **Channel** | Private inherited `StdIn` / `StdOut` | Private to parent-child process tree; no open network ports or named pipe hijacking risk on Windows |
| **Framing** | Length-prefixed: 4-byte big-endian unsigned integer (payload byte length) followed by UTF-8 JSON payload | Eliminates delimiter parsing bugs, JSON chunking fragmentation, or delimiter escaping issues |
| **Maximum Frame Size** | 1,048,576 bytes (1 MiB) | Enforces memory bounding; oversize requests fail fast with `-32600` |
| **Direction** | `StdIn`: Shell Requests → Backend<br>`StdOut`: Backend Responses → Shell | Clean bidirectional request-response semantics. Unsolicited streaming uses snapshot polling via `session.getState` |
| **StdErr Channel** | Bounded diagnostics & stack traces only | Kept completely segregated; **never** emits protocol frames |
| **Encoding** | UTF-8 strictly without BOM | Byte order marks rejected as malformed JSON |
| **Protocol Version** | `protocolVersion: 1` (integer) | Present in every envelope for forward/backward compatibility checks |

### 1.1 Frame Binary Structure
```
+---------------------------------------+---------------------------------------+
| 4 Bytes: Payload Length N (Big-Endian)| N Bytes: UTF-8 Encoded JSON-RPC Text  |
+---------------------------------------+---------------------------------------+
```

---

## 2. Authentication & Security Model

- **Process Isolation:** The Kotlin backend is spawned directly by Tauri as a restricted child process. Standard input and output handles are strictly inherited.
- **Threat Model:** Because stdio handles are kernel-isolated to the parent-child pair on Windows, IPC HMAC tokens add zero security boundary against a local attacker who already controls the OS session. The secret credentials (`.env`, `serviceAccountKey.json`, PayOS keys) remain securely isolated in backend memory and are **never transmitted to the frontend webview**.
- **Idempotency Keys:** Every mutating command requires a UUID v4 `commandId` passed within `params`. The backend deduplicates calls per session; replaying an identical command with the same `commandId` returns the cached response without side effects.

---

## 3. Protocol Envelopes & Error Codes

### 3.1 Request Envelope (Shell → Backend)
```typescript
interface IpcRequest<T = Record<string, unknown>> {
  jsonrpc: "2.0";
  id: string;             // Echoed back in response; UUID v4 or sequential string
  method: string;         // e.g., "catalog.get", "session.start"
  params: T;              // Method parameters object
  protocolVersion: 1;     // Must be integer 1
}
```

### 3.2 Success Response Envelope (Backend → Shell)
```typescript
interface IpcSuccessResponse<T = Record<string, unknown>> {
  jsonrpc: "2.0";
  id: string;             // Matches request id
  result: T;              // Method payload
  protocolVersion: 1;
}
```

### 3.3 Error Response Envelope (Backend → Shell)
```typescript
interface IpcErrorResponse {
  jsonrpc: "2.0";
  id: string;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
  protocolVersion: 1;
}
```

### 3.4 Standard Error Codes
| Code | Standard Label | Condition |
|---|---|---|
| `-32600` | Invalid Request | Framing truncated, frame > 1 MiB, malformed JSON, or missing `protocolVersion` |
| `-32601` | Method Not Found | Unrecognized RPC method |
| `-32602` | Invalid Params | Missing required parameters, type mismatch, invalid UUID, or invalid range |
| `-32603` | Internal Error | Unhandled backend exception, OOM, or storage failure |
| `-32000` | Hardware Unavailable | Canon camera, webcam, or DNP printer disconnected in real hardware mode |
| `-32001` | Command Not Allowed | Command received outside allowed state in the session state machine |
| `-32002` | Operation Failed | Composition failed, print spooler submission rejected, or image read error |
| `-32003` | Gateway Unavailable | PayOS payment gateway unreachable or timed out |
| `-32004` | Session Conflict | Session already completed, active capture running, or stale session generation |

---

## 4. Complete RPC Method Catalog

### 4.1 System & Hardware Diagnostics

#### `health.check`
- **Purpose:** Verifies that JVM sidecar is alive, confirms process PID, uptime, and runtime mode.
- **Params:** `{}`
- **Result:**
  ```json
  {
    "status": "ok",
    "protocolVersion": 1,
    "simulator": false,
    "backendPid": 14220,
    "uptimeMs": 45120,
    "jvmVersion": "21.0.2",
    "availableMethods": ["health.check"]
  }
  ```

#### `device.getStatus`
- **Purpose:** Comprehensive hardware and peripheral status check.
- **Params:** `{}`
- **Result:**
  ```json
  {
    "runtimeMode": "REAL",
    "captureMode": "REAL",
    "demoModeAvailable": true,
    "camera": {
      "connected": true,
      "adapter": "CANON_DSLR",
      "model": "Canon EOS 1500D"
    },
    "printer": {
      "name": "Dai Nippon Printing DS-RX1",
      "detected": true,
      "availablePrinters": ["Dai Nippon Printing DS-RX1", "Microsoft Print to PDF"]
    },
    "beauty": {
      "enabled": true,
      "modelsLoaded": true
    },
    "ledger": {
      "salesDbConnected": true,
      "pendingSyncCount": 0
    },
    "catalog": {
      "source": "FIRESTORE",
      "cached": true,
      "layoutCount": 4,
      "frameCount": 12
    },
    "cloud": {
      "payOsConfigured": true,
      "cloudinaryConfigured": true,
      "webAlbumConfigured": true,
      "revenueEndpointConfigured": true
    }
  }
  ```

---

### 4.2 Catalog & Layout Service

#### `catalog.get`
- **Purpose:** Returns all loaded layouts, decorative frames, seasonal bundles, and pricing tiers.
- **Params:** `{}`
- **Result:**
  ```json
  {
    "source": "FIRESTORE",
    "syncedAt": 1730460000000,
    "defaultLayoutId": "strip-5x15",
    "layouts": [
      {
        "id": "strip-5x15",
        "title": "Dải ảnh 5x15 cm",
        "subtitle": "2 dải ảnh · 5×15 cm",
        "description": "Bố cục dải ảnh dọc thanh lịch",
        "family": "Column",
        "shotCount": 4,
        "selectCount": 3,
        "countdownSeconds": 5,
        "basePrice": 70000,
        "mediaLabel": "Dải ảnh",
        "accentColor": 4289847295,
        "printSizeLabel": "5x15",
        "printAspectRatio": 0.33333334,
        "photoAspectRatio": 1.5,
        "gridColumns": 1,
        "absoluteSlots": []
      }
    ],
    "frames": [
      {
        "id": "frame_classic_white",
        "title": "Classic White",
        "isCustom": true,
        "isSpecial": false,
        "targetLayoutId": "strip-5x15",
        "targetPrintSize": "5x15",
        "qrCodeX": 100,
        "qrCodeY": 1500,
        "qrCodeSize": 180
      }
    ],
    "bundles": [
      {
        "name": "Valentine Sweet",
        "coverDataUrl": "data:image/png;base64,...",
        "targetLayoutId": "strip-5x15",
        "frameIds": ["val_01", "val_02"]
      }
    ],
    "pricing": {
      "stripBasePrice": 70000,
      "stripUnitPrice": 20000,
      "printBasePrice": 90000,
      "printUnitPrice": 30000,
      "stripAllowedQuantities": [2, 4, 6, 8, 10],
      "printAllowedQuantities": [2, 4, 6, 8, 10]
    },
    "simulator": false
  }
  ```

#### `catalog.sync`
- **Purpose:** Forces immediate re-sync with Firestore (if credentials exist), re-indexes `data/frames` and `data/covers`, updates local disk cache, and returns the refreshed catalog without restarting the kiosk.
- **Params:** `{ "force": true }`
- **Result:**
  ```json
  {
    "synced": true,
    "source": "FIRESTORE",
    "layoutsUpdated": 4,
    "framesLoaded": 12,
    "bundlesLoaded": 2,
    "cacheWritten": true
  }
  ```

---

### 4.3 Session Lifecycle & State Machine

#### `session.start`
- **Allowed In:** `IDLE`
- **Transition To:** `SELECTING`
- **Params:**
  ```json
  {
    "commandId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionId": "b6a8f8e1-512a-43d9-9529-50c6bf2e2601",
    "generationId": "e3b0c442-98fc-1c14-9afb-4c7ec0522002",
    "layoutId": "strip-5x15",
    "captureMode": "REAL"
  }
  ```
  *(Note: `captureMode` can be `"REAL"` or `"DEMO"`. Default is `"REAL"`).*
- **Result:** Snapshot object with state `"SELECTING"`.

#### `session.setLayout`
- **Allowed In:** `SELECTING`
- **Params:**
  ```json
  {
    "commandId": "...",
    "sessionId": "...",
    "generationId": "...",
    "layoutId": "print-10x15"
  }
  ```
- **Result:** Updated snapshot reflecting new layout, shot count, and pricing.

#### `session.confirmSetup`
- **Allowed In:** `SELECTING`
- **Transition To:** `SELECTING_QUANTITY`
- **Params:** `{ "commandId": "...", "sessionId": "...", "generationId": "..." }`
- **Result:** Snapshot with state `"SELECTING_QUANTITY"`.

#### `session.setQuantity`
- **Allowed In:** `SELECTING_QUANTITY`
- **Transition To:** `PAYMENT_PENDING`
- **Params:**
  ```json
  {
    "commandId": "...",
    "sessionId": "...",
    "generationId": "...",
    "quantity": 4
  }
  ```
- **Result:** Snapshot with calculated total amount and state `"PAYMENT_PENDING"`.

#### `session.getState`
- **Allowed In:** Any state
- **Params:** `{ "sessionId": "...", "generationId": "..." }`
- **Result:** Full authoritative snapshot including countdown seconds, captured shots, active frame, and preview data URLs.

#### `session.back`
- **Allowed In:** `SELECTING`, `SELECTING_QUANTITY`, `PAYMENT_PENDING`, `EDITING`, `PRINT_PENDING`
- **Transition:** Walks back to preceding logical state.
- **Params:** `{ "commandId": "...", "sessionId": "...", "generationId": "..." }`
- **Result:** Updated snapshot.

#### `session.cancel`
- **Allowed In:** `SELECTING_PHOTOS`, `EDITING`
- **Transition To:** Resets session to `IDLE`, cleans temporary working directory.
- **Params:** `{ "commandId": "...", "sessionId": "...", "generationId": "..." }`
- **Result:** `{ "cancelled": true, "state": "IDLE" }`

#### `session.finish`
- **Allowed In:** `DELIVERY`
- **Transition To:** `IDLE`
- **Params:** `{ "commandId": "...", "sessionId": "...", "generationId": "..." }`
- **Result:** Snapshot reset to `IDLE`.

---

### 4.4 Payment Integration

#### `payment.createLink`
- **Allowed In:** `PAYMENT_PENDING`
- **Params:**
  ```json
  {
    "commandId": "...",
    "sessionId": "...",
    "generationId": "...",
    "description": "Le Souvenir Strip 4"
  }
  ```
- **Behavior:**
  - In **REAL mode:** Calls PayOS API to generate order code and VietQR checkout link. Returns base64 QR image.
  - In **DEMO mode:** Bypasses PayOS; returns simulated demonstration QR code with status immediately `"PAID"`.
- **Result:**
  ```json
  {
    "orderCode": 20261101001,
    "qrCode": "data:image/png;base64,...",
    "amount": 70000,
    "status": "PENDING",
    "payOsConfigured": true
  }
  ```

#### `payment.checkStatus`
- **Allowed In:** `PAYMENT_PENDING`
- **Params:** `{ "sessionId": "...", "generationId": "...", "orderCode": 20261101001 }`
- **Behavior:** Polls PayOS for payment success. When paid, transitions state to `PREPARING` -> `LIVE_VIEW`.
- **Result:**
  ```json
  {
    "orderCode": 20261101001,
    "status": "PAID",
    "paid": true,
    "amount": 70000,
    "nextState": "LIVE_VIEW"
  }
  ```

#### `payment.mockComplete`
- **Allowed In:** `PAYMENT_PENDING`
- **Params:**
  ```json
  {
    "commandId": "...",
    "sessionId": "...",
    "generationId": "...",
    "staffOverride": true
  }
  ```
- **Behavior:**
  - In **REAL mode:** Requires `staffOverride: true` or active operator authorization. Records payment method as `STAFF_COMP` or `TIEN_MAT`.
  - In **DEMO mode:** Immediately accepted with `paymentMethod: "DEMO"`.
- **Result:** Snapshot with `paid: true`, state `"LIVE_VIEW"`.

---

### 4.5 Capture Pipeline

#### `capture.startSequence`
- **Allowed In:** `LIVE_VIEW` (requires `paid == true`)
- **Transition To:** `COUNTDOWN` -> `CAPTURING` -> `LIVE_VIEW` / `SELECTING_PHOTOS`
- **Params:** `{ "commandId": "...", "sessionId": "...", "generationId": "..." }`
- **Behavior:**
  - In **REAL mode:** Activates Canon DSLR shutter or webcam for `layout.shotCount` iterations. Each capture queues asynchronously for `DesktopBeautyService`.
  - In **DEMO mode:** `DemoCameraAdapter` generates distinct realistic portrait images matching the layout aspect ratio with simulated shutter delay, feeding real beauty models and LUT processors.
- **Result:**
  ```json
  {
    "shotIndex": 1,
    "totalShots": 4,
    "countdownSeconds": 5
  }
  ```

---

### 4.6 Photo Selection & Framing

#### `selection.toggle`
- **Allowed In:** `SELECTING_PHOTOS`
- **Params:** `{ "commandId": "...", "sessionId": "...", "generationId": "...", "shotIndex": 1 }`
- **Behavior:** Toggles selection of photo `shotIndex`. Enforces selection limit `layout.selectCount`. Invalidates existing cached compositions.
- **Result:** Snapshot with updated `selectedIndices`.

#### `selection.confirm`
- **Allowed In:** `SELECTING_PHOTOS`
- **Transition To:** `EDITING`
- **Requirement:** `selectedIndices.size == layout.selectCount`
- **Params:** `{ "commandId": "...", "sessionId": "...", "generationId": "..." }`
- **Result:** Snapshot with state `"EDITING"`.

#### `frame.list`
- **Allowed In:** `EDITING`
- **Params:** `{ "sessionId": "...", "generationId": "..." }`
- **Result:** Array of available `FrameOption`s matching current layout and print size.

#### `frame.select`
- **Allowed In:** `EDITING`
- **Params:** `{ "commandId": "...", "sessionId": "...", "generationId": "...", "frameId": "frame_classic_white" }`
- **Behavior:** Renders high-resolution composite via `DesktopCompositor` using beauty-enhanced photos, color LUTs, and transparent PNG frame.
- **Result:** Snapshot with updated preview image data URL.

#### `frame.confirm`
- **Allowed In:** `EDITING`
- **Transition To:** `PRINT_PENDING`
- **Requirement:** Complete composite and print image must be successfully rendered on disk.
- **Params:** `{ "commandId": "...", "sessionId": "...", "generationId": "..." }`
- **Result:** Snapshot with state `"PRINT_PENDING"`.

---

### 4.7 Print Execution & Revenue Gate

#### `print.confirmReal`
- **Allowed In:** `PRINT_PENDING` (requires `paid == true`, valid composition)
- **Transition To:** `DELIVERY` (on success) or `RECOVERY` (on hardware spooler failure)
- **Params:** `{ "commandId": "...", "sessionId": "...", "generationId": "..." }`
- **Behavior:**
  - **In REAL mode:**
    1. Checks physical DNP DS-RX1HS printer availability.
    2. Sends print job (`CUT_5X15_2UP` or `PHOTO_10X15`) to Windows Print Spooler.
    3. Confirms `PrintResult.Submitted`.
    4. Synchronously records sale in SQLite `data/sales.db` with `sync_status = 'PENDING'`.
    5. Dispatches background async cloud sync (Neon, Cloudinary, WebAlbum).
    6. Sets `printAccepted = true, revenueRecorded = true, state = "DELIVERY"`.
  - **In DEMO mode:**
    1. Performs dry-run print validation (checks image dimensions and print canvas without sending bytes to physical spooler).
    2. Skips insertion into `data/sales.db` (zero revenue recorded).
    3. Skips remote cloud sync.
    4. Sets `printAccepted = true, revenueRecorded = false, state = "DELIVERY"`.
- **Result:**
  ```json
  {
    "sessionId": "...",
    "state": "DELIVERY",
    "printAccepted": true,
    "revenueRecorded": true,
    "printerName": "Dai Nippon Printing DS-RX1",
    "albumUrl": "https://lesouvenir.vn/album/..."
  }
  ```

#### `print.confirmDryRun`
- **Allowed In:** `PRINT_PENDING`
- **Purpose:** Test/Simulator validation. Verifies canvas rendering without submitting print job or recording revenue.
- **Params:** `{ "commandId": "...", "sessionId": "...", "generationId": "..." }`
- **Result:** Snapshot with `dryRun: true`.

---

### 4.8 Operator & Atelier Administration

#### `operator.getStatus`
- **Allowed In:** Any state
- **Params:** `{}`
- **Result:** Operator capabilities, active capture mode, and administration permissions.

#### `operator.setCaptureMode`
- **Allowed In:** `IDLE`
- **Params:** `{ "captureMode": "REAL" | "DEMO" }`
- **Result:** `{ "saved": true, "captureMode": "DEMO" }`

#### `operator.getSettings`
- **Allowed In:** Any state
- **Params:** `{}`
- **Result:** Effective timeouts, printer configurations, and operational flags.

#### `operator.updateSettings`
- **Allowed In:** `IDLE`
- **Params:** `{ "settings": { ... } }`
- **Result:** `{ "saved": true }`

#### `operator.updateLayout`
- **Allowed In:** `IDLE`
- **Params:** `{ "layoutId": "strip-5x15", "shotCount": 4, "selectCount": 3, "countdownSeconds": 5 }`
- **Result:** `{ "saved": true, "appliesTo": "NEXT_SESSION" }`
