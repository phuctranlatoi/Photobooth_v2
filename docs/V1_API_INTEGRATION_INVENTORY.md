# V1 API & Cloud Integrations Inventory

> **Auditor Status**: Strictly read-only audit of V1 (`E:\HK1_2026_2027\PhotoboothDesktop`). No V1 files modified. All paths, classes, method signatures, schemas, and behavior cited from exact source inspection.

---

## 1. Firebase / Firestore / Firebase Storage

### 1.1 Initialization Mechanism
- **File Path**: `src/main/kotlin/com/phuctran/photobooth/desktop/remote/FirebaseManager.kt`
- **Class / Symbol**: `object FirebaseManager`
- **Method Signature**: `fun initialize(credentialsStream: InputStream? = null, storageBucketUrl: String? = null)`
- **Credential Loading**:
  - Code reference: `FirebaseManager.kt:21,30-32`
  - Fixed credentials path: `private const val CREDENTIALS_PATH = "serviceAccountKey.json"`
  - Storage bucket: `private const val STORAGE_BUCKET = "photop-bf902.appspot.com"`
  - Uses `com.google.auth.oauth2.GoogleCredentials.fromStream(stream)` and `com.google.firebase.FirebaseOptions.builder()`.
  - Native JVM Firebase Admin SDK initialization: `FirebaseApp.initializeApp(optionsBuilder.build())`.
  - Sets internal flag `isInitialized = true`.
- **Environment Variables**:
  - **None**. Despite code comments referring to environment variables, `FirebaseManager.kt` has no `System.getenv()` or `readDotEnv()` lookups. It directly resolves the local file `serviceAccountKey.json` from the current working directory.
  - No `google-services.json` is used (that is an Android Gradle plugin file, whereas V1 is Compose Multiplatform Desktop on JVM).
- **Call Sites**:
  - `src/main/kotlin/com/phuctran/photobooth/desktop/Main.kt:35`: `FirebaseManager.initialize()` at desktop application boot.
  - `src/main/kotlin/com/phuctran/photobooth/desktop/engine/LayoutCalculatorTool.kt:41`: `FirebaseManager.initialize()` on admin tool startup.
  - `src/main/kotlin/com/phuctran/photobooth/desktop/engine/DebugMatches.kt:7`: `FirebaseManager.initialize()` in standalone match debugger.

---

### 1.2 Firestore Collections & Schemas

In the entire V1 codebase, only two collections are accessed via `FirestoreClient.getFirestore().collection(...)`:
1. `layouts` (Active in runtime & admin tools)
2. `frames` (Defined in helper method, 0 runtime callers)

*Note: Collections such as `events`, `bundles`, and `settings` **DO NOT EXIST in Firestore**. Special events, bundles, and covers are stored entirely on the local disk.*

#### Collection: `layouts`
- **Document ID**: `layoutId` (e.g., `"strip_3"`, `"grid_4"`, `"10154B011"`)
- **Writing / Mutations**:
  - `uploadLayout(layoutId: String, layoutData: Map<String, Any>)` (`FirebaseManager.kt:51-66`)
  - `deleteLayout(layoutId: String)` (`FirebaseManager.kt:69-86`)
  - `updateLayoutConfig(layoutId: String, basePrice: Long, shotCount: Int, countdownSeconds: Int)` (`FirebaseManager.kt:91-113`)
  - `updateLayoutQRConfig(layoutId: String, qrCodeX: Int?, qrCodeY: Int?, qrCodeSize: Int?)` (`FirebaseManager.kt:118-139`)
- **Document Schema**:
  | Field Name | Type | Description & Fallback |
  |---|---|---|
  | `id` | String | Layout identifier. Fallback: `doc.id`. |
  | `title` | String | Display title (e.g. `"Bố cục 4 ảnh"`). Fallback: `"Layout $id"`. |
  | `subtitle` | String | Short subtitle (e.g. `"4 ảnh"`). Fallback: `"${slots.size} ảnh"`. |
  | `description` | String | Human readable description. Fallback: `"Kích thước ${width.toInt()}x${height.toInt()}"`. |
  | `family` | String (implicit) | In `fetchLayouts()`, always instantiated as `LayoutFamily.Grid`. |
  | `shotCount` | Long / Number | Number of moments to capture. Fallback: `slots.size`. |
  | `selectCount` | Long / Number | Number of moments customer picks. Fallback: `slots.size`. |
  | `countdownSeconds` | Long / Number | Capture countdown per shot. Fallback: `3` (Note: not hardcoded to 5 or 6). |
  | `basePrice` | Long / Number | Base price in VND. Fallback: `50000L`. |
  | `printSizeLabel` | String | Print size string (e.g. `"15 x 10 cm"` or `"5 x 15 cm"`). Fallback: `"15 x 10 cm"`. |
  | `printAspectRatio` | Double / Float | Print aspect ratio (width / height). Fallback: `width / height`. |
  | `photoAspectRatio` | Double / Float | Aspect ratio of photo slots. Fallback: computed from first slot `(w/h) * printAspectRatio`. |
  | `mediaLabel` | String | Summary tag (e.g. `"15 x 10 cm • 4 ảnh"`). Fallback: `"Layout $id"`. |
  | `accentColor` | Long / Number | UI hex accent color. Fallback: `0xFF4CAF50` (Green). |
  | `gridColumns` | Long / Number | Grid column count for legacy layout math. Fallback: `1`. |
  | `width` | Double / Long / Float | Canvas width in pixels (e.g. `1200f`, `1800f`). Fallback: `1200f`. |
  | `height` | Double / Long / Float | Canvas height in pixels (e.g. `1800f`, `1200f`). Fallback: `1800f`. |
  | `qrCodeX` | Long / Int? | Optional X coordinate for QR code on printed canvas. |
  | `qrCodeY` | Long / Int? | Optional Y coordinate for QR code on printed canvas. |
  | `qrCodeSize` | Long / Int? | Optional QR code width/height in pixels on printed canvas. |
  | `createdAt` | Long | Creation epoch millis timestamp (written in `LayoutCalculatorTool.kt:308`). |
  | `slots` | Array of Maps | Ordered list of slots (`List<Map<String, Any>>`). |

  - **Slot Object Schema (`slots[i]`)**:
    | Field Name | Type | Description |
    |---|---|---|
    | `index` | Number / Int | 0-based slot index. |
    | `x` | Number / Float | Normalized top-left X coordinate `[0.0 .. 1.0]`. |
    | `y` | Number / Float | Normalized top-left Y coordinate `[0.0 .. 1.0]`. |
    | `width` | Number / Float | Normalized width `[0.0 .. 1.0]`. Fallback: `0.5f`. |
    | `height` | Number / Float | Normalized height `[0.0 .. 1.0]`. Fallback: `0.5f`. |
    | `centerX` | Number / Float | (Optional, written by `LayoutCalculatorTool`) Center X coordinate. |
    | `centerY` | Number / Float | (Optional, written by `LayoutCalculatorTool`) Center Y coordinate. |
    | `areaRatio` | Number / Float | (Optional, written by `LayoutCalculatorTool`) Area percentage. |

#### Collection: `frames`
- **Document ID**: `frameId`
- **Method Signature**: `uploadFrameMetadata(frameId: String, layoutId: String, publicUrl: String)` (`FirebaseManager.kt:217-243`)
- **Document Schema**:
  | Field Name | Type | Description |
  |---|---|---|
  | `layoutId` | String | Target layout ID that this frame overlays. |
  | `imageUrl` | String | Public storage/Cloudinary URL of the transparent PNG frame. |
  | `name` | String | Frame identifier / name. |
  | `createdAt` | Long | Epoch millis timestamp. |
- **Observation in Code**: This method has **ZERO callers** in the V1 runtime application flow. All frames in V1 are stored and loaded locally from the disk filesystem.

---

### 1.3 Fetching Layouts and Mapping to `LayoutMode`
- **File Path**: `src/main/kotlin/com/phuctran/photobooth/desktop/remote/FirebaseManager.kt`
- **Method Signature**: `suspend fun fetchLayouts(): List<LayoutMode> = withContext(Dispatchers.IO)`
- **Trace**:
  1. `if (!isInitialized)` -> prints error, returns `emptyList()`.
  2. Wraps Firestore query with coroutine timeout:
     ```kotlin
     val querySnapshot = kotlinx.coroutines.withTimeout(5000) { 
         db.collection("layouts").get().get()
     }
     ```
  3. Iterates over `querySnapshot.documents`:
     - Reads `width` and `height`, casting Double/Long to Float.
     - Parses `slots` from `List<Map<String, Any>>`, constructing `LayoutSlot(index, x, y, w, h)`, sorted by `index`.
     - Skips any layout where `slots.isEmpty()`.
     - Computes aspect ratios:
       - `pAspectRatio = doc.getDouble("printAspectRatio")?.toFloat() ?: (width / height)`
       - `computedPhotoAspect = (firstSlot.width / firstSlot.height) * pAspectRatio`
       - `photoAspect = doc.getDouble("photoAspectRatio")?.toFloat() ?: computedPhotoAspect`
     - Constructs `com.phuctran.photobooth.desktop.model.LayoutMode`.
  4. Returns `List<LayoutMode>`.
- **Consumer in Controller**:
  - `src/main/kotlin/com/phuctran/photobooth/desktop/controller/DesktopBoothController.kt:190-198`:
    ```kotlin
    val layoutsFromFirebase = com.phuctran.photobooth.desktop.remote.FirebaseManager.fetchLayouts()
    if (layoutsFromFirebase.isNotEmpty()) {
        _availableLayouts.value = layoutsFromFirebase
        _selectedLayout.value = layoutsFromFirebase.first()
    }
    ```

---

### 1.4 Local Storage vs. Remote Storage: Frames, Covers, Bundles
- **File Path**: `src/main/kotlin/com/phuctran/photobooth/desktop/storage/FrameStore.kt`
- **Class / Symbol**: `class FrameStore(projectDir: Path)`
- **Directory Layout**:
  - Frames directory: `<projectDir>/data/frames/`
  - Covers directory: `<projectDir>/data/covers/`
- **Path Hierarchy for Frames**:
  - Structure: `<projectDir>/data/frames/<printSizeLabel>/<layoutId>/<Standard|Special>/[specialEventName]/<frameSlug>_<timestamp>.png`
  - Associated QR config: `<frameSlug>_<timestamp>.json` containing:
    ```json
    { "qrCodeX": 100, "qrCodeY": 1500, "qrCodeSize": 180 }
    ```
- **Covers**:
  - Special event covers are stored locally as `<projectDir>/data/covers/<eventName>.png`.
  - Methods: `getSpecialEventCoverPath(eventName: String): Path` and `setSpecialEventCover(eventName: String, source: Path)`.
- **Bundles**:
  - In V1, a "Bundle" is simply a `FramePack` where `isSpecial == true`, associated with a `targetLayoutId`.
  - On `StartScreen.kt:109-150`, special frames are grouped by `frame.specialEventName ?: "Sự Kiện Khác"`.
  - Displayed using `SpecialEventItem` (showing event cover from `data/covers/<eventName>.png`) and `SpecialBundleItem` (showing preview of `frame.customImagePath`).
  - When customer taps a bundle (`DesktopBoothController.kt:323-336`):
    - Sets `_selectedLayout.value` to layout matching `frame.targetLayoutId`.
    - Sets `_selectedFrame.value = frame`.
    - Directly transitions state to `SessionState.SELECTING_QUANTITY` (skipping manual layout selection).

---

### 1.5 Local Caching & Offline Fallback Behavior
- **Layout Caching**:
  - **No local disk caching** exists for Firestore layouts in V1. Layouts are never written to disk or SQLite upon fetch.
  - Initial State in `DesktopBoothController.kt:111`:
    `private val _availableLayouts = MutableStateFlow(DefaultLayoutModes)`
  - Fallback Definition (`BoothModels.kt:205-227`):
    - `id = "fallback_layout"`
    - `title = "Chưa có bố cục"`
    - `subtitle = "Đang tải"`
    - `description = "Chưa tải được bố cục từ Firebase. Vui lòng kiểm tra kết nối."`
    - `basePrice = 0L`
  - If `FirebaseManager.fetchLayouts()` throws or returns empty (e.g. network down or timeout > 5000ms), `_availableLayouts` retains `DefaultLayoutModes`.
- **Frame Caching**:
  - Frames and covers are 100% offline-local. They live in `<projectDir>/data/frames` and `<projectDir>/data/covers` and function completely without internet.

---

## 2. Shared API / Neon Architecture

### 2.1 Overview & Dual-Mode Routing
V1 implements a dual-mode revenue mechanism in `DesktopRevenueClient.kt`:
1. **Direct Neon Mode**: If `config.neonDatabaseUrl` is not blank, all revenue calls bypass HTTP and route directly via PostgreSQL JDBC in `NeonDirectRevenueClient.kt`.
2. **Shared HTTP API Mode**: If `config.neonDatabaseUrl` is blank, revenue calls route via HTTP REST to `${config.webAlbumBaseUrl}/api/v1/revenue/...` with Bearer auth `config.boothApiKey`.

### 2.2 Local Ledger: `SalesRepository.kt` & SQLite `sales.db`
- **File Path**: `src/main/kotlin/com/phuctran/photobooth/desktop/data/SalesRepository.kt`
- **Class / Symbol**: `class SalesRepository(projectDir: Path)`
- **Database URL**: `jdbc:sqlite:<projectDir>/data/sales.db`
- **Schema (`sales` Table)**:
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
  CREATE INDEX IF NOT EXISTS sales_created_at ON sales(created_at);
  ```
- **Ledger Operations**:
  - `recordSale(transaction: SaleTransaction)`: `INSERT OR IGNORE INTO sales ...` (idempotent on `session_id`).
  - `adjustTransaction(sessionId: String, actualQuantity: Int, reason: String?): Boolean`:
    - Enforces `actualQuantity >= 2`.
    - Recalculates extra quantity, extra amount, and total amount.
    - Sets `sync_status = 'PENDING'`.
  - `voidTransaction(sessionId: String, reason: String?): Boolean`:
    - Sets `status = 'VOIDED'`, `sync_status = 'PENDING'`.
  - `syncPendingSales(client: DesktopRevenueClient, config: DesktopBoothConfig)`:
    - Serialized with `synchronized(syncLock)`.
    - Selects all rows where `sync_status = 'PENDING'` ordered by `id`.
    - Dispatches to cloud client (`recordTransaction`, followed by `adjustTransaction` or `voidTransaction` if adjusted/voided).
    - If cloud call succeeds, sets `sync_status = 'SYNCED'`. If any sync call fails, loop breaks immediately to preserve chronological order.

---

### 2.3 Shared HTTP Revenue API (`DesktopRevenueClient.kt`)
- **File Path**: `src/main/kotlin/com/phuctran/photobooth/desktop/remote/DesktopRevenueClient.kt`
- **Base Endpoint**: `${config.webAlbumBaseUrl.trimEnd('/')}/api/v1/revenue`
- **Headers**:
  - `Authorization: Bearer <config.boothApiKey>`
  - `Content-Type: application/json`
- **Endpoints & Payload Contracts**:
  1. **Record Transaction**: `POST /api/v1/revenue/transactions`
     - Body:
       ```json
       {
         "externalSessionId": "c7b39a82-3d84-4d8e-9cb4-20b8f4eb3b72",
         "layoutId": "strip_3",
         "layoutTitle": "Photostrip 3",
         "printSize": "5 x 15 cm",
         "quantity": 2,
         "includedQuantity": 2,
         "extraQuantity": 0,
         "basePrice": "70000",
         "extraUnitPrice": "35000",
         "extraAmount": "0",
         "totalAmount": "70000",
         "paymentMethod": "Chuyển khoản (PayOS)",
         "createdAt": 1730462400000
       }
       ```
       *Critical detail: Monies are formatted as decimal strings (`Long.toString()`), never floating point numbers.*
  2. **Adjust Transaction**: `POST /api/v1/revenue/transactions/{encodedSessionId}/adjust`
     - Body: `{ "actualQuantity": 4, "reason": "Khách in thêm 2 bản" }`
  3. **Void Transaction**: `POST /api/v1/revenue/transactions/{encodedSessionId}/void`
     - Body: `{ "reason": "Kẹt giấy máy in" }`
  4. **Revenue Summary**: `GET /api/v1/revenue/summary?startTime={start}&endTime={end}&timeZone={encodedZoneId}`
     - Response:
       ```json
       {
         "summary": {
           "revenue": "140000",
           "sessions": "2",
           "prints": "4",
           "extraRevenue": "0",
           "extraPrints": "0"
         },
         "dailyPoints": [
           { "date": "2026-11-01", "revenue": "140000", "sessions": "2" }
         ],
         "sizeBreakdowns": [
           { "printSize": "5 x 15 cm", "sessions": "2", "prints": "4", "revenue": "140000", "extraRevenue": "0" }
         ]
       }
       ```
  5. **Recent Transactions**: `GET /api/v1/revenue/transactions?startTime={start}&endTime={end}&limit={limit}`
     - Limit clamped to `1..100`.

---

### 2.4 Direct Neon Client (`NeonDirectRevenueClient.kt`)
- **File Path**: `src/main/kotlin/com/phuctran/photobooth/desktop/remote/NeonDirectRevenueClient.kt`
- **Connection**: Direct PostgreSQL JDBC via `DriverManager.getConnection("jdbc:postgresql://$host$port$path$query", properties)`.
- **Runtime DDL Migration**: Executes `ALTER TABLE revenue_transactions ADD COLUMN IF NOT EXISTS ...` on every transaction recording!
- **Booth Resolution**: Checks `config.neonRevenueBoothId`; if blank, queries `SELECT id FROM booths WHERE status = 'ACTIVE' ORDER BY created_at ASC LIMIT 1`.
- **Insertion**:
  ```sql
  INSERT INTO revenue_transactions (
      id, booth_id, external_session_id, layout_id, layout_title,
      print_size, quantity, included_quantity, extra_quantity,
      base_price, extra_unit_price, extra_amount, total_amount,
      payment_method, status, created_at, original_quantity,
      original_total_amount, adjust_reason, adjusted_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (external_session_id) DO NOTHING
  ```
- **Locking & Adjust**: Uses `SELECT ... FROM revenue_transactions WHERE ... FOR UPDATE`.

---

## 3. Cloudinary Integration

### 3.1 Upload Calls & Protocol
- **File Path**: `src/main/kotlin/com/phuctran/photobooth/desktop/remote/DesktopCloudinaryClient.kt`
- **Method Signature**:
  ```kotlin
  fun uploadAssetToCloudinary(
      config: DesktopBoothConfig,
      sessionId: String,
      file: Path,
      position: Int,
      kind: String = "ORIGINAL"
  ): UploadedCloudAsset?
  ```
- **Endpoint**:
  `POST https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/${resourceType}/upload`
  - `resourceType = "video"` for file extensions matching `"mp4"`.
  - `resourceType = "image"` for file extensions matching `"jpg"`, `"jpeg"`, or `"png"`.
- **Authentication / Preset**:
  - **Unsigned upload**: Uses form parameter `"upload_preset"` set to `config.cloudinaryUploadPreset`.
  - **No API Secret or Signed HMAC** is used. Uploads rely completely on Cloudinary unsigned upload preset permissions.
- **Multipart Form Payload**:
  - Boundary: `"----LeSouvenir" + UUID.randomUUID().toString().replace("-", "")`
  - Form Fields:
    1. `upload_preset`: String (from config)
    2. `file`: Binary byte stream (`Files.readAllBytes(file)`) with MIME type:
       - `"image/png"` for `.png`
       - `"video/mp4"` for `.mp4`
       - `"image/jpeg"` for `.jpg` / `.jpeg`

---

### 3.2 URL Transformation & Optimization
- In `DesktopCloudinaryClient.kt:64-70`, when `secure_url` contains `/upload/v`:
  - For images: replaces `/upload/` with `/upload/f_auto,q_auto/`
  - For videos: replaces `/upload/` with `/upload/f_auto,q_auto,vc_h264/`
  - Ensures immediate browser compatibility across iOS and Android mobile clients.

---

### 3.3 Returned Metadata Format
Constructs `UploadedCloudAsset` containing `FinalizeAssetRequest`:
| Field | Source from Cloudinary Response | Fallback |
|---|---|---|
| `kind` | Caller parameter (`"ORIGINAL"`, `"FINAL"`, `"GIF"`) | `"ORIGINAL"` |
| `position` | Caller parameter (0-based integer) | `0` |
| `assetId` | `json.asset_id` | `public_id` |
| `publicId` | `json.public_id` | `""` |
| `version` | `json.version` | `"1"` |
| `format` | `json.format` | file extension |
| `resourceType` | `json.resource_type` | `"image"` |
| `deliveryType` | `json.type` | `"upload"` |
| `width` | `json.width` | `0` |
| `height` | `json.height` | `0` |
| `bytes` | `json.bytes` | `Files.size(file)` |

---

## 4. Web Album Architecture & QR Creation

### 4.1 Web Album REST Client
- **File Path**: `src/main/kotlin/com/phuctran/photobooth/desktop/remote/DesktopWebAlbumClient.kt`
- **Class / Symbol**: `class DesktopWebAlbumClient`
- **Base URL**: `config.webAlbumBaseUrl` (default: `"https://web-photobooth-pink.vercel.app/"`, trimmed of trailing `/` and `/a`).
- **Headers**:
  - `Authorization: Bearer <config.boothApiKey>`
  - `Content-Type: application/json`
- **Endpoints**:
  1. **Create Album**: `POST /api/v1/albums`
     - Request (`CreateAlbumRequest`):
       ```json
       {
         "externalSessionId": "c7b39a82-3d84-4d8e-9cb4-20b8f4eb3b72",
         "expectedAssets": 6,
         "expiresInDays": 7
       }
       ```
     - Response (`CreateAlbumResponse`):
       ```json
       {
         "albumId": "alb_xyz123",
         "accessToken": "tok_abc456",
         "albumUrl": "https://web-photobooth-pink.vercel.app/a/alb_xyz123",
         "status": "CREATING",
         "expiresAt": "2026-11-08T00:00:00Z"
       }
       ```
  2. **Finalize Asset**: `POST /api/v1/albums/{encodedAlbumId}/assets`
     - Body: JSON serialization of `FinalizeAssetRequest`.
     - Executed **sequentially** for each asset (`DesktopAlbumUploader.kt:97-101`) to avoid server-side concurrent insert deadlocks.
  3. **Complete Album**: `POST /api/v1/albums/{encodedAlbumId}/complete`
     - Body: `""` (Empty string).
     - Signals that all assets (including composite video) have finalized and the album is ready for guests.

---

### 4.2 Session ID Format
- **Normal Customer Session**:
  `UUID.randomUUID().toString()` (e.g. `c7b39a82-3d84-4d8e-9cb4-20b8f4eb3b72`), assigned at `DesktopBoothController.kt:721`.
- **Studio Mode / Admin Test Session**:
  `"Session_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("'Session_'yyyyMMdd_HHmm"))` (`DesktopBoothController.kt:1182`).

---

### 4.3 QR Code Resolution & Generation
- **URL Resolution Priority** (`DesktopBoothController.kt:807-811`):
  1. `preAlbum?.albumUrl` (Server-generated public album URL).
  2. If preAlbum failed AND `config.enableLocalServer == true`:
     `"http://${getLocalIpAddress()}:${config.localServerPort}/download/${masterFileName}"` (via `LocalFileServer.kt`).
  3. `null`.
- **Print Canvas QR Drawing** (`DesktopCompositor.kt:330-359`):
  - Library: ZXing `com.google.zxing.qrcode.QRCodeWriter`
  - Error correction: `ErrorCorrectionLevel.M`, `Margin = 1`.
  - Coordinate & Size Resolution Hierarchy:
    - Size: `frame.qrCodeSize ?: layout.qrCodeSize ?: (canvasWidth * 0.10f).roundToInt().coerceAtLeast(100)`
    - X Coordinate: `frame.qrCodeX ?: layout.qrCodeX ?: (canvasWidth - qrSize - 30 * renderScale)`
    - Y Coordinate: `frame.qrCodeY ?: layout.qrCodeY ?: (canvasHeight - qrSize - 30 * renderScale)`
    - Rendered directly into the composite `BufferedImage` raster before sending to printer.
- **On-Screen QR Rendering**:
  - `src/main/kotlin/com/phuctran/photobooth/desktop/ui/components/QrCodeView.kt:14-41`
  - Generates 300x300 pixel `BufferedImage` via ZXing and renders as Compose `Image`.

---

## 5. PayOS Payment Integration
- **File Path**: `src/main/kotlin/com/phuctran/photobooth/desktop/services/PaymentService.kt`
- **Library**: `vn.payos:payos-java`
- **Method Signatures**:
  - `createPaymentLink(orderCode: Long, amount: Int, description: String): String?`
  - `checkPaymentStatus(orderCode: Long): Boolean`
- **Session Flow**:
  - Order Code: Generated as current epoch millisecond timestamp: `System.currentTimeMillis()`.
  - Amount: Integer total amount from `frozenPricingSnapshot`.
  - Polling Loop (`DesktopBoothController.kt:371-384`):
    - Polls every 3000 ms (`delay(3000)`).
    - Checks `checkPaymentStatus(orderCode)`. When `PAID`, sets `paymentMethod = "Chuyển khoản (PayOS)"` and triggers `completePayment()`.
  - Inactivity / Back: `goBack()` cancels `paymentPollingJob`.

---

## 6. Full Environment Variables Contract

| Key | Type | Default | Used In | Purpose |
|---|---|---|---|---|
| `BOOTH_ID` | String | `"booth_1"` | `DesktopBoothConfig.kt` | Physical kiosk identifier for revenue records and sessions. |
| `BOOTH_API_KEY` | String | `""` | `DesktopBoothConfig.kt` | Bearer token for Web Album & Shared Revenue HTTP API. |
| `NEON_DATABASE_URL` / `DATABASE_URL` | String | `""` | `DesktopBoothConfig.kt` | PostgreSQL JDBC URL for direct Neon revenue storage. |
| `NEON_REVENUE_BOOTH_ID` | String | `""` | `DesktopBoothConfig.kt` | Specific UUID of booth in Neon DB `booths` table. |
| `WEB_ALBUM_BASE_URL` / `ALBUM_BASE_URL` | String | `"https://web-photobooth-pink.vercel.app/"` | `DesktopBoothConfig.kt` | Base endpoint of Web Album API. |
| `CLOUDINARY_CLOUD_NAME` | String | `""` | `DesktopBoothConfig.kt` | Cloudinary account name. |
| `CLOUDINARY_UPLOAD_PRESET` | String | `""` | `DesktopBoothConfig.kt` | Cloudinary unsigned upload preset name. |
| `ALBUM_EXPIRES_IN_DAYS` | Int | `7` | `DesktopBoothConfig.kt` | Album expiration lifespan in days. |
| `ENABLE_SYSTEM_PRINT` | Boolean | `false` | `DesktopBoothConfig.kt` | If false, prints are dry-run saved to local disk without spooling. |
| `USE_HOT_FOLDER` | Boolean | `true` | `DesktopBoothConfig.kt` | Monitor hot folder for camera file transfers. |
| `HOT_FOLDER_PATH` | String | `"E:\\Photobooth\\HotFolder"` | `DesktopBoothConfig.kt` | Target directory watched by `HotFolderCaptureService`. |
| `USE_NATIVE_SDK` | Boolean | `true` | `DesktopBoothConfig.kt` | Enable Canon EDSDK native driver capture. |
| `USE_CLI_CAMERA` | Boolean | `false` | `DesktopBoothConfig.kt` | External CLI capture executable alternative. |
| `CLI_CAPTURE_COMMAND` | String | `"CameraControlCmd.exe ..."` | `DesktopBoothConfig.kt` | CLI capture command template. |
| `ENABLE_LOCAL_SERVER` | Boolean | `true` | `DesktopBoothConfig.kt` | Built-in HTTP server for local Wi-Fi QR download fallback. |
| `LOCAL_SERVER_PORT` | Int | `8080` | `DesktopBoothConfig.kt` | Port for `LocalFileServer`. |
| `PAYOS_CLIENT_ID` | String | `""` | `DesktopBoothConfig.kt` | PayOS integration client ID. |
| `PAYOS_API_KEY` | String | `""` | `DesktopBoothConfig.kt` | PayOS integration API key. |
| `PAYOS_CHECKSUM_KEY` | String | `""` | `DesktopBoothConfig.kt` | PayOS webhook and request checksum secret. |
| `POST_CAPTURE_TIMEOUT_SECONDS`| Int | `90` | `DesktopBoothConfig.kt` | Post-capture timeout before auto-cancellation. |
| `PHOTO_SELECTION_TIMEOUT_SECONDS` | Int | `90` | `DesktopBoothConfig.kt` | Photo selection inactivity timeout. |
| `FRAME_SELECTION_TIMEOUT_SECONDS` | Int | `60` | `DesktopBoothConfig.kt` | Frame selection inactivity timeout. |
| `PRINTER_NAME_STRIP` | String | `""` | `DesktopBoothConfig.kt` | Windows printer name for 5x15 cm strips. |
| `PRINTER_NAME_FULL` | String | `""` | `DesktopBoothConfig.kt` | Windows printer name for 10x15 cm postcards. |
| `BEAUTY_ENABLED` | Boolean | `false` | `DesktopBoothConfig.kt` | Toggle facial retouching and smoothing pipeline. |
| `BEAUTY_PRESET` | String | `"BRIGHT"` | `DesktopBoothConfig.kt` | Retouching preset (`"NATURAL"`, `"BRIGHT"`, etc.). |
