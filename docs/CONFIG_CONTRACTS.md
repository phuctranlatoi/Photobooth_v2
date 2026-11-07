# Configuration Contracts & System Schemas (Photobooth V1)

This document defines the configuration schemas, environment variable contracts, database table specifications, and filesystem path conventions used by the legacy V1 system (`E:\HK1_2026_2027\PhotoboothDesktop`).

---

## 1. Environment Variables & `.env` Contract

- **Loading Class:** `src/main/kotlin/com/phuctran/photobooth/desktop/config/DesktopBoothConfig.kt`
- **Resolution Order:**
  1. `appDataDir/.env` (`%LOCALAPPDATA%/LeSouvenirDesktop/.env`)
  2. `workingDir/.env` (`E:/HK1_2026_2027/PhotoboothDesktop/.env`)
  3. `System.getenv()` (Process environment)
- **Settings Persistence:** The Admin Settings screen writes updates back to whichever `.env` file exists via `SettingsManager.updateSettings()`.

### 1.1 Complete Environment Variable Dictionary
| Variable Name | Data Type | Default Value | Description | Sensitivity |
|---|---|---|---|---|
| `BOOTH_ID` | String | `"booth_1"` | Unique kiosk identifier | Public |
| `BOOTH_API_KEY` | String | `""` | Authentication token for cloud web album backend | **Secret** |
| `NEON_DATABASE_URL` | String | `""` | PostgreSQL JDBC connection URL for Neon revenue ledger | **Secret** |
| `DATABASE_URL` | String | `""` | Alias fallback for `NEON_DATABASE_URL` | **Secret** |
| `NEON_REVENUE_BOOTH_ID` | String | `""` | UUID of booth record in Neon database | Public |
| `WEB_ALBUM_BASE_URL` | String | `"https://web-photobooth-pink.vercel.app/"`| Public web album base URL | Public |
| `ALBUM_BASE_URL` | String | (same as above)| Alias fallback for `WEB_ALBUM_BASE_URL` | Public |
| `CLOUDINARY_CLOUD_NAME` | String | `""` | Cloudinary tenant account name | Public |
| `CLOUDINARY_UPLOAD_PRESET` | String | `""` | Cloudinary unsigned/signed direct upload preset | **Secret** |
| `ALBUM_EXPIRES_IN_DAYS` | Integer | `7` | Retention lifespan for customer cloud albums | Public |
| `ENABLE_SYSTEM_PRINT` | Boolean | `false` | Enables physical print spooling via Windows Print Service | Public |
| `USE_HOT_FOLDER` | Boolean | `true` | Enables hot folder capture watcher instead of native camera | Public |
| `HOT_FOLDER_PATH` | String | `"E:\\Photobooth\\HotFolder"`| Filesystem directory watched for Sony camera captures | Public |
| `USE_NATIVE_SDK` | Boolean | `true` | Enables native Canon EDSDK camera service | Public |
| `USE_CLI_CAMERA` | Boolean | `false` | Enables external CLI camera capture tool | Public |
| `CLI_CAPTURE_COMMAND` | String | `"CameraControlCmd.exe /capturenoaf /filename \"%s\""` | Shell command for CLI capture | Public |
| `ENABLE_LOCAL_SERVER` | Boolean | `true` | Starts embedded HTTP server on kiosk for offline QR download | Public |
| `LOCAL_SERVER_PORT` | Integer | `8080` | Port for local embedded HTTP server | Public |
| `PAYOS_CLIENT_ID` | String | `""` | PayOS client ID for payment links | **Secret** |
| `PAYOS_API_KEY` | String | `""` | PayOS API key for VietQR generation | **Secret** |
| `PAYOS_CHECKSUM_KEY` | String | `""` | PayOS HMAC signature verification key | **Secret** |
| `POST_CAPTURE_TIMEOUT_SECONDS` | Integer | `90` | Inactivity timeout after photo capture | Public |
| `PHOTO_SELECTION_TIMEOUT_SECONDS`| Integer | `90` | Inactivity timeout on photo review screen | Public |
| `FRAME_SELECTION_TIMEOUT_SECONDS`| Integer | `60` | Inactivity timeout on frame selection screen | Public |
| `PRINTER_NAME_STRIP` | String | `""` | Target Windows printer name for 5×15 cm strips | Public |
| `PRINTER_NAME_FULL` | String | `""` | Target Windows printer name for 10×15 cm sheets | Public |
| `BEAUTY_ENABLED` | Boolean | `false` | Master toggle for AI portrait beauty filter pipeline | Public |
| `BEAUTY_PRESET` | String | `"BRIGHT"` | Active beauty preset (`NATURAL`, `STUDIO`, `BRIGHT`, `STRONG`) | Public |

---

## 2. Layout Schema (Firestore & Memory)

- **Source Code Citation:** `src/main/kotlin/.../model/BoothModels.kt` (lines 12–57), `FirebaseManager.kt` (lines 154–205)
- **Collection:** `/layouts/{layoutId}` in Firestore

### 2.1 Firestore Document Fields
```json
{
  "id": "strip_4_pose",
  "title": "Bố cục 4 ảnh dải",
  "subtitle": "4 ảnh",
  "description": "Kích thước 5x15 cm",
  "printSizeLabel": "5 x 15 cm",
  "printAspectRatio": 0.3333,
  "shotCount": 6,
  "selectCount": 4,
  "countdownSeconds": 3,
  "basePrice": 70000,
  "mediaLabel": "Dải 4 ảnh",
  "accentColor": 4283215696,
  "gridColumns": 1,
  "qrCodeX": null,
  "qrCodeY": null,
  "qrCodeSize": null,
  "slots": [
    { "index": 0, "x": 0.05, "y": 0.04, "width": 0.90, "height": 0.20 },
    { "index": 1, "x": 0.05, "y": 0.26, "width": 0.90, "height": 0.20 },
    { "index": 2, "x": 0.05, "y": 0.48, "width": 0.90, "height": 0.20 },
    { "index": 3, "x": 0.05, "y": 0.70, "width": 0.90, "height": 0.20 }
  ]
}
```

*Key Contractual Takeaway: `shotCount`, `selectCount`, and `countdownSeconds` are first-class configurable fields per layout document.*

---

## 3. Database Contracts

### 3.1 Local SQLite Schema (`data/sales.db`)
- **File:** `src/main/kotlin/.../data/SalesRepository.kt`
```sql
CREATE TABLE IF NOT EXISTS sales (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id              TEXT NOT NULL UNIQUE,
    booth_id                TEXT NOT NULL,
    layout_id               TEXT NOT NULL,
    layout_title            TEXT NOT NULL,
    print_size              TEXT NOT NULL,
    quantity                INTEGER NOT NULL,
    included_quantity       INTEGER NOT NULL,
    extra_quantity          INTEGER NOT NULL,
    base_price              INTEGER NOT NULL,
    extra_unit_price        INTEGER NOT NULL,
    extra_amount            INTEGER NOT NULL,
    total_amount            INTEGER NOT NULL,
    payment_method          TEXT NOT NULL,
    created_at              INTEGER NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'completed',
    sync_status             TEXT NOT NULL DEFAULT 'PENDING',
    original_quantity       INTEGER,
    original_total_amount   INTEGER,
    adjust_reason           TEXT,
    adjusted_at             INTEGER
);

CREATE INDEX IF NOT EXISTS sales_created_at ON sales(created_at);
```

### 3.2 Neon Remote PostgreSQL Schema (`revenue_transactions`)
- **File:** `src/main/kotlin/.../remote/NeonDirectRevenueClient.kt`
```sql
CREATE TABLE IF NOT EXISTS revenue_transactions (
    id                      UUID PRIMARY KEY,
    booth_id                TEXT NOT NULL,
    external_session_id     TEXT NOT NULL UNIQUE,
    layout_id               TEXT NOT NULL,
    layout_title            TEXT NOT NULL,
    print_size              TEXT NOT NULL,
    quantity                INTEGER NOT NULL,
    included_quantity       INTEGER NOT NULL,
    extra_quantity          INTEGER NOT NULL,
    base_price              BIGINT NOT NULL,
    extra_unit_price        BIGINT NOT NULL,
    extra_amount            BIGINT NOT NULL,
    total_amount            BIGINT NOT NULL,
    payment_method          TEXT NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'completed',
    created_at              TIMESTAMP NOT NULL,
    original_quantity       INTEGER,
    original_total_amount   BIGINT,
    adjust_reason           TEXT,
    adjusted_at             TIMESTAMP
);
```

---

## 4. Filesystem Directory Contracts

```
[Project Root] / [AppData Local]
├── data/
│   ├── sales.db                                   # SQLite sales ledger
│   ├── frames/                                    # Persisted custom frame PNGs
│   │   └── {targetSize}_{targetLayout}_{id}.png
│   ├── filters/luts/                              # Adobe .cube 3D LUT files
│   │   └── {lutName}.cube
│   ├── output/                                    # Exported compositions
│   │   ├── print_{timestamp}_{layout}_{frame}.png # Clean master image
│   │   └── print_print_{timestamp}_...png         # Composed print image with QR
│   └── sessions/{sessionId}/                      # Ephemeral session workspace
│       ├── originals/
│       │   └── Photo_{1..N}.jpg                   # Mirrored raw captures
│       ├── beauty/
│       │   └── Photo_{1..N}_beauty.png            # AI portrait derivatives
│       ├── videos/shot_{1..N}/
│       │   ├── frame_{001..M}.jpg                 # 24fps live view frames
│       │   └── video_{1..N}.mp4                   # Encoded MP4 per shot
│       └── exports/
│           ├── original_{1..N}.jpg                # Normalized JPEG uploads
│           └── final.jpg                          # Master JPEG upload
├── app-resources/
│   ├── EDSDK_64/
│   │   ├── EDSDK.dll                              # Canon SDK 64-bit DLL
│   │   └── EdsImage.dll                           # Canon Image library
│   └── models/
│       ├── face_detection_yunet_2023mar.onnx      # YuNet face detector
│       ├── bisenet_face_parsing.onnx              # BiSeNet face parser
│       └── THIRD_PARTY_NOTICES.md
└── serviceAccountKey.json                         # Firebase Admin credentials
```

---

*Evidence Tag: All configuration keys, Firestore models, SQL schemas, and filesystem paths are **Observed in code** from direct examination of the V1 repository.*
