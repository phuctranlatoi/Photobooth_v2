# V1 → V2 API & Integration Parity Matrix

> **Auditor Status**: Audit updated following complete read-only source inspection of V1 (`E:\HK1_2026_2027\PhotoboothDesktop`). No V1 files modified. All legacy contracts cited against exact code locations.

---

## 1. Feature Parity & Migration Status Overview

| Integration Area | V1 Reference Location | V2 Migration Contract | Priority | V2 Parity Status | Architectural Recommendation / Gap |
|---|---|---|---|---|---|
| **Firebase Admin Init** | `remote/FirebaseManager.kt:26` | JVM Admin SDK or REST Firestore Client | Important | Planned | V1 relies on `serviceAccountKey.json` in working directory. V2 can support configurable service account path or lightweight HTTP Firestore REST without fat Google Admin SDK. |
| **Layouts Sync** | `remote/FirebaseManager.kt:144` | Firestore fetch → Layout model | Critical | Planned | V1 has NO disk cache; fallback is a single `"fallback_layout"`. V2 must implement local disk caching (`layouts.json`) so offline kiosks remain fully functional with all layouts. |
| **Layout Config Mutation** | `remote/FirebaseManager.kt:91,118` | Admin UI update → Firestore | Optional | Planned | Admin updates basePrice, shotCount, countdownSeconds, QR coordinates. Can be updated via Admin UI or web portal. |
| **Frames & Bundles** | `storage/FrameStore.kt:29` | Local disk scanner (`data/frames`) | Critical | Planned | In V1, frames/bundles are NOT stored in Firestore; they reside on local disk in `data/frames/<size>/<layout>/...` with optional `<frame>.json` for QR coordinates. V2 preserves local frame directory hierarchy. |
| **Special Event Covers** | `storage/FrameStore.kt:19` | Local disk (`data/covers/<event>.png`) | Important | Planned | V1 loads cover images from local filesystem. V2 preserves local cover storage. |
| **Shared Revenue HTTP API** | `remote/DesktopRevenueClient.kt:16` | `RevenueClient` HTTP client | Critical | Ported (Standalone) | V1 transfers all monetary amounts as decimal strings (`Long.toString()`). V2 client enforces Long amounts and exact endpoint paths (`/api/v1/revenue/transactions`, `/{id}/adjust`, `/{id}/void`, `/summary`). |
| **Neon Direct JDBC** | `remote/NeonDirectRevenueClient.kt:17` | **EXCLUDED BY DESIGN** | Critical (Excluded) | Deprecated | V1 directly connected to PostgreSQL and ran runtime `ALTER TABLE` DDL migrations. V2 deprecates direct Neon JDBC in favor of the Shared HTTP API only. |
| **Local Sales Ledger** | `data/SalesRepository.kt:11` | SQLite `sales.db` | Critical | Ported (Standalone) | V1 writes to local SQLite before background cloud sync. V2 retains local SQLite ledger with `sync_status = 'PENDING'` / `'SYNCED'`. |
| **Cloudinary Upload** | `remote/DesktopCloudinaryClient.kt:19` | `CloudinaryClient` HTTP multipart | Critical | Ported (Standalone) | V1 uses unsigned upload preset via multipart form POST. V2 preserves unsigned upload and Cloudinary URL transformations (`f_auto,q_auto`, `vc_h264`). |
| **Web Album Lifecycle** | `remote/DesktopWebAlbumClient.kt:15` | `WebAlbumClient` HTTP client | Critical | Ported (Standalone) | V1 calls: 1. `POST /api/v1/albums` (pre-creation), 2. `POST /assets` (sequential finalize), 3. `POST /complete`. V2 client matches exact DTOs. |
| **QR Code Resolution** | `controller/DesktopBoothController.kt:807` | ZXing QR generator | Critical | Ported (Standalone) | V1 priority: `preAlbum.albumUrl` → Local server download URL → Null. QR placed at `frame.qrCode* ?: layout.qrCode* ?: bottom-right`. V2 preserves this exact priority. |
| **Local Download Server** | `services/LocalFileServer.kt:10` | Built-in HTTP server | Important | Planned | V1 runs an embedded HTTP server on port 8080 listening on `0.0.0.0` for local LAN downloads (`/download/{filename}`). V2 will maintain local Wi-Fi fallback. |
| **PayOS Payment** | `services/PaymentService.kt:9` | `PayOsClient` / Native PayOS | Critical | Ported (Standalone) | V1 uses `System.currentTimeMillis()` order codes and 3000ms polling. V2 implements standalone client; HMAC canonicalization requires production key validation before live activation. |

---

## 2. Detailed Contract Mappings

### 2.1 Firebase / Firestore (`layouts` Collection)
- **V1 Document Schema**:
  - `id`: String
  - `title`: String
  - `subtitle`: String
  - `description`: String
  - `shotCount`: Number
  - `selectCount`: Number
  - `countdownSeconds`: Number (dynamically configurable, default: 3)
  - `basePrice`: Number (VND, default: 50,000)
  - `printSizeLabel`: String (`"15 x 10 cm"` or `"5 x 15 cm"`)
  - `printAspectRatio`: Float
  - `photoAspectRatio`: Float
  - `mediaLabel`: String
  - `accentColor`: Number (hex)
  - `gridColumns`: Number
  - `width`: Number (pixels)
  - `height`: Number (pixels)
  - `qrCodeX`: Number (optional)
  - `qrCodeY`: Number (optional)
  - `qrCodeSize`: Number (optional)
  - `slots`: Array of slot maps `[{ index, x, y, width, height, ... }]`
- **V2 Parity Rule**:
  - V2 DTO must preserve every single field name and numeric type coercion.
  - V2 **adds local offline persistence**: Upon successful fetch from Firestore, serialize layouts to `<appDataDir>/layouts_cache.json`. When offline, load cached layouts instead of collapsing to a single fallback layout.

### 2.2 Local Frame & Bundle Hierarchy (`FrameStore.kt`)
- **V1 Directory Structure**:
  ```
  data/
  ├── frames/
  │   └── <printSizeLabel>/
  │       └── <layoutId>/
  │           ├── Standard/
  │           │   ├── frame_01.png
  │           │   └── frame_01.json   # Optional: {"qrCodeX":100,"qrCodeY":1500,"qrCodeSize":180}
  │           └── Special/
  │               └── <SpecialEventName>/
  │                   ├── event_frame_01.png
  │                   └── event_frame_01.json
  └── covers/
      └── <SpecialEventName>.png
  ```
- **V2 Parity Rule**:
  - Keep directory and file-naming semantics identical so existing frame libraries and event assets are 100% plug-and-play in V2.
  - Scanning logic must recognize `<name>.json` companion files for custom QR coordinates.

### 2.3 Shared Revenue API & Sales Ledger
- **Request Fields**:
  - `externalSessionId`: String (UUID)
  - `layoutId`: String
  - `layoutTitle`: String
  - `printSize`: String
  - `quantity`: Int
  - `includedQuantity`: Int
  - `extraQuantity`: Int
  - `basePrice`: String (decimal string representation of Long)
  - `extraUnitPrice`: String (decimal string representation of Long)
  - `extraAmount`: String (decimal string representation of Long)
  - `totalAmount`: String (decimal string representation of Long)
  - `paymentMethod`: String (`"Chuyển khoản (PayOS)"` or `"Tiền mặt"`)
  - `createdAt`: Long (epoch milliseconds)
- **V2 Parity Rule**:
  - Never parse money fields into floating-point numbers.
  - V2 SQLite ledger will record sales locally only upon successful user confirmation AND completed print spooling (`userConfirmed && printJob.isCompletedSuccessfully`).
  - Offline sales synchronize sequentially via `syncPendingSales` when network recovers.

### 2.4 Cloudinary Upload Contract
- **Request**:
  - Multipart form-data to `https://api.cloudinary.com/v1_1/{cloudName}/{resourceType}/upload`
  - Fields: `upload_preset` (unsigned), `file` (binary bytes).
  - No API secret required.
- **Transformations**:
  - Insert `/upload/f_auto,q_auto/` for images.
  - Insert `/upload/f_auto,q_auto,vc_h264/` for videos.
- **V2 Parity Rule**:
  - V2 client retains transform logic and caps file inputs to avoid memory exhaustion (e.g. 32 MiB max for images/videos).

### 2.5 Web Album API Contract
- **Calls & Ordering**:
  1. `POST /api/v1/albums`:
     - Payload: `{ externalSessionId, expectedAssets, expiresInDays }`
     - Response: `{ albumId, accessToken, albumUrl, status, expiresAt }`
     - Returns `albumUrl` used immediately for printing the QR code.
  2. `POST /api/v1/albums/{albumId}/assets`:
     - Payload: `{ kind, position, assetId, publicId, version, format, resourceType, deliveryType, width, height, bytes }`
     - Must be dispatched **sequentially** to preserve position order and avoid backend transaction collisions.
  3. `POST /api/v1/albums/{albumId}/complete`:
     - Payload: empty body `{}`.
     - Finalizes album publishing.

### 2.6 QR Code Placement & Local Server Fallback
- **Placement Hierarchy**:
  - QR Size: `frame.qrCodeSize ?: layout.qrCodeSize ?: (canvasWidth * 0.10f).roundToInt().coerceAtLeast(100)`
  - QR X: `frame.qrCodeX ?: layout.qrCodeX ?: (canvasWidth - qrSize - 30 * renderScale)`
  - QR Y: `frame.qrCodeY ?: layout.qrCodeY ?: (canvasHeight - qrSize - 30 * renderScale)`
- **Payload Hierarchy**:
  - 1st: `preAlbum.albumUrl`
  - 2nd (Offline fallback): `http://{localIp}:{localServerPort}/download/{masterImageFilename}`
  - 3rd: Null (No QR drawn if offline and local server disabled)

---

## 3. Evidence-Backed Gaps & Known Risks

1. **Direct Neon JDBC Migration Risk in V1**:
   - V1 executes `ALTER TABLE` DDL on the production database upon every single transaction insert (`NeonDirectRevenueClient.kt:61-68`).
   - *V2 Resolution*: Direct Neon connection is **excluded**. All revenue operations in V2 must target the Shared HTTP API (`/api/v1/revenue/transactions`), ensuring no client-side DDL execution.
2. **Missing Layout Offline Caching in V1**:
   - V1 falls back to an unusable single `"fallback_layout"` with `basePrice = 0` whenever Firebase is unreachable.
   - *V2 Resolution*: Implement a local JSON disk cache for layouts in V2 so the kiosk can operate autonomously offline.
3. **Sequential Asset Finalization Requirement**:
   - V1 uploads assets concurrently, but finalizes them sequentially (`DesktopAlbumUploader.kt:97-101`). Concurrency in finalization was proven in V1 to cause server-side race conditions.
   - *V2 Resolution*: Retain sequential asset finalization in V2.
4. **Cloudinary Asset Folder Uncoupling**:
   - V1 does not specify `folder` or deterministic `public_id` during Cloudinary upload; asset-session association exists purely through Web Album metadata.
   - *V2 Resolution*: Maintain album metadata linking to remain compatible with existing web album backend.
