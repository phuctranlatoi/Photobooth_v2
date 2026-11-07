# Business Rules & Revenue Accounting (Photobooth V1)

This document establishes the commercial, transactional, payment, and cloud album business rules governing the legacy V1 system (`E:\HK1_2026_2027\PhotoboothDesktop`).

---

## 1. Pricing Engine & Quantity Rules

### 1.1 Pricing Calculator Architecture
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/model/PricingCalculator.kt`
- **Class:** `object PricingCalculator`
- **Output Model:** `data class PricingSnapshot`

```kotlin
data class PricingSnapshot(
    val printSize: String,          // "5x15" or "10x15"
    val quantity: Int,              // Total requested copies
    val includedQuantity: Int,      // Included in base price (always 2)
    val extraQuantity: Int,         // maxOf(0, quantity - includedQuantity)
    val basePrice: Long,            // Base order amount in VND
    val extraUnitPrice: Long,       // Additional unit price in VND
    val extraAmount: Long,          // extraQuantity * extraUnitPrice
    val totalAmount: Long           // basePrice + extraAmount
)
```

### 1.2 Exact Pricing Tier Matrix
| Layout Format | Physical Print Size | Included Copies | Base Price (VND) | Allowed Quantities | Step Increments | Extra Unit Price (VND) |
|---|---|---|---|---|---|---|
| **Strip (`5x15`)** | 5×15 cm (2×6") | 2 strips | **70,000 ₫** | Even only: `[2, 4, 6, ... 50]` | Step = 2 | **20,000 ₫** / extra 2 strips |
| **Full Sheet (`10x15`)** | 10×15 cm (4×6") | 2 sheets | **90,000 ₫** | All: `[2, 3, 4, ... 50]` | Step = 1 | **30,000 ₫** / extra sheet |

### 1.3 Even Quantity Invariant for 5×15 cm Photo Strips
- **Code Citation:** `PricingCalculator.kt:24-27, 31-33`
  ```kotlin
  fun sanitizeQuantity(printSizeLabel: String, quantity: Int): Int {
      val minimum = quantity.coerceAtLeast(2)
      return if (isStrip(printSizeLabel) && minimum % 2 != 0) minimum + 1 else minimum
  }
  ```
- **Business Rationale:** Because the DNP RX1HS prints 5×15 cm strips in pairs on a single 4×6 inch sheet with a mechanical 2-inch cut, odd strip counts would leave an unprinted or wasted half-sheet. The UI and calculator enforce that strip orders are strictly even numbers.

---

## 2. Payment Gateway & Staff Override

### 2.1 PayOS Integration
- **File:** `src/main/kotlin/.../services/PaymentService.kt`
- **Library:** `vn.payos:payos-java:2.0.1`
- **Credentials:** Loaded from `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`.
- **Payment Link Generation:**
  - `orderCode`: Unix timestamp in milliseconds (`System.currentTimeMillis()`).
  - `amount`: Exact integer amount matching `pricingSnapshot.totalAmount`.
  - `description`: `"Le Souvenir {orderCode}"`.
  - Generates official VietQR string payload rendered as a high-contrast QR code on `PaymentScreen`.

### 2.2 Payment Status Polling Loop
- **File:** `src/main/kotlin/.../controller/DesktopBoothController.kt` (lines 374–383)
- Polling frequency: **Every 3000ms** on `Dispatchers.IO`.
- Invokes `paymentService.checkPaymentStatus(orderCode)`:
  - If status returns `PaymentLinkStatus.PAID`:
    - Calls `completePayment("QR PayOS")`.
    - Cancels polling loop.
    - Transitions session to `PREPARING`.

### 2.3 Staff Cash Override
- If a guest wishes to pay cash or if the kiosk is offline without internet access:
  - Staff clicks `THANH TOÁN TIỀN MẶT` on `PaymentScreen`.
  - Cancels polling loop.
  - Sets `paymentMethod = "Tiền mặt"`.
  - Immediately transitions session to `PREPARING`.

---

## 3. Strict Revenue Accounting Gate

### 3.1 The Three-Condition Revenue Gate
In photobooth operations, guests frequently start sessions, test filters, walk away during payment, or experience hardware paper jams. Recording revenue prematurely distorts financial accounting.

V1 enforces an absolute transactional revenue gate in `DesktopBoothController.kt` (lines 842–852):
```kotlin
val sale = SaleTransaction(...)
if (userConfirmed && printJob.await() && currentSessionId == sessionId) {
    withContext(Dispatchers.IO) {
        runCatching { salesRepository.recordSale(sale) }
            .onSuccess {
                scope.launch(Dispatchers.IO) {
                    salesRepository.syncPendingSales(revenueClient, activeConfig.value)
                }
            }
            .onFailure { println("Could not save local sale: ${it.message}") }
    }
}
```

### 3.2 Gate Conditions Breakdown
1. **`userConfirmed == true`:**
   - Must be triggered by guest explicitly pressing `XÁC NHẬN VÀ IN ẢNH` on `ConfirmScreen`.
   - **Crucial Invariant:** When an abandoned session reaches timeout and the kiosk automatically prints photos to clear the screen (`handleInactivityTimeout()`), it passes `userConfirmed = false`. **Zero revenue is recorded.**
2. **`printJob.await() == true`:**
   - The Windows print spooler must have successfully accepted the print file without immediate IO error.
3. **`currentSessionId == sessionId`:**
   - Ensures the session was not canceled, timed out, or reset while the print task was spooling.

### 3.3 Zero Revenue on Cancellation
If a guest cancels or resets before reaching Confirm & Print, `resetSession()` is invoked:
- Cancels all coroutine jobs.
- Invalidates `currentSessionId = null`.
- Clears `frozenPricingSnapshot = null`.
- **Zero revenue is recorded.**

---

## 4. Local SQLite Ledger & Neon PostgreSQL Sync

### 4.1 Local SQLite Database (`sales.db`)
- **File:** `src/main/kotlin/.../data/SalesRepository.kt`
- **Location:** `data/sales.db`
- **Table Schema:**
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
  ```
- **Durability:** Writes use SQLite WAL mode with busy timeout (`PRAGMA busy_timeout=5000`). All sales persist locally even if the kiosk loses internet entirely.

### 4.2 Neon Direct PostgreSQL Remote Sync
- **File:** `src/main/kotlin/.../remote/NeonDirectRevenueClient.kt`
- **Target Table:** `revenue_transactions` in Neon PostgreSQL database.
- **Sync Protocol:**
  - Queries `SELECT * FROM sales WHERE sync_status = 'PENDING' ORDER BY id`.
  - Inserts row using `ON CONFLICT (external_session_id) DO NOTHING` (idempotent write).
  - Handles transaction adjustments and voids:
    - If `sale.isVoided`: updates status to `VOIDED`.
    - If `sale.isAdjusted`: updates quantity and total amount with audit reason.
  - Upon successful remote commit, marks local SQLite row `sync_status = 'SYNCED'`.

---

## 5. Cloud Web Album & QR Delivery Rules

### 5.1 Pre-Creation Workflow
To embed a valid, scannable QR code onto the physical printed photograph, the web album URL must exist **before** the final print image is composed:
1. `controller.startPrinting()` calls `webAlbumClient.createAlbum(externalSessionId = sessionId)`:
   - Endpoint: `POST {webAlbumBaseUrl}/api/albums`
   - Payload: `{ externalSessionId, expectedAssets, expiresInDays }`
   - Returns: `{ albumId, albumUrl }` (e.g. `https://web-photobooth-pink.vercel.app/a/{albumId}`).
2. The compositor stamps the resulting `albumUrl` as a QR code onto `printImagePath`.
3. The printed strip rolls out of the printer with the functional QR code already on it.

### 5.2 Direct Cloudinary Asset Upload
- **File:** `src/main/kotlin/.../services/DesktopAlbumUploader.kt`
- Assets uploaded in parallel:
  - All original captured photos (`Photo_1.jpg` ... `Photo_N.jpg`).
  - Master clean composite print image (`finalImagePath`, without QR code).
  - Master composite animated video (`video_master.mp4`).
- Direct HTTP POST to Cloudinary API using unauthenticated signed/unsigned preset.

### 5.3 Sequential Asset Finalization Invariant
- **Code Citation:** `DesktopAlbumUploader.kt:97-101`
  - While Cloudinary uploads occur in parallel, calls to finalize assets in the web album backend (`webAlbumClient.finalizeAsset(...)`) are executed **strictly sequentially**:
    ```kotlin
    for (asset in uploadedAssets) {
        if (webAlbumClient.finalizeAsset(config, albumId, asset.finalizeRequest)) {
            finalizedCount++
        }
    }
    ```
  - **Business Rationale:** Prevents database lock contention and race conditions on the Vercel/Neon backend, guaranteeing asset indices and display order are perfectly preserved.

### 5.4 Offline Local Server Fallback
- **File:** `src/main/kotlin/.../services/LocalFileServer.kt`
- If internet is unavailable or cloud credentials are not configured (`config.canUploadAlbum == false`):
  - Kiosk runs an embedded HTTP server on port 8080.
  - QR code points to local network IP:
    `http://{localIp}:{localServerPort}/download/{masterFileName}`
  - Allows guests on the same local Wi-Fi hotspot to download their photos directly from kiosk memory.

---

*Evidence Tag: All pricing formulas, revenue gates, SQL schemas, and upload invariants are **Observed in code** from direct inspection of the V1 repository.*
