# Firebase Integration & Catalog Resiliency Specification

**Document ID:** `docs/FIREBASE_INTEGRATION.md`  
**Status:** IMPLEMENTED & VERIFIED IN V2  
**Target Environment:** Windows 10/11 x64 (Tauri v2 + Kotlin JVM Sidecar)  
**Security Boundary:** V1 legacy directory is strictly READ-ONLY. All writes and caches are restricted to V2 and `%LOCALAPPDATA%/LeSouvenirDesktop`. Production secrets and service account credentials are never logged or exported.

---

## 1. Architectural Overview

The Le Souvenir Photobooth V2 platform integrates Google Cloud Firestore to enable remote, centralized management of photobooth layouts, slot configurations, countdown timings, and pricing tiers across distributed physical kiosks.

Because kiosks operate in physical venues where network connectivity may be erratic, offline, or firewalled, the catalog subsystem is engineered with an **offline-first, zero-downtime architecture**. The photobooth must never block booting, customer selection, or camera capture due to remote network latency, cloud outages, or invalid credentials.

```
                    ┌──────────────────────────────────────────────┐
                    │          Google Cloud Firestore              │
                    │        (Collection: "layouts")               │
                    └──────────────────────┬───────────────────────┘
                                           │
                                  FirestoreClient (5s timeout)
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ com.lesouvenir.v2.catalog.FirebaseCatalogService                                         │
│                                                                                         │
│  1. Discover serviceAccountKey.json (4-Tier Sequence)                                   │
│  2. Fetch Firestore Documents ──[Success]──► Atomic Cache Write (.tmp -> rename)        │
│                                                │                                        │
│  [Offline / Auth Failure / Timeout]            ▼                                        │
│         │                          backend/config/firebase-layouts-cache.json            │
│         ▼                                      │                                        │
│  Read Local Disk Cache ◄───────────────────────┘                                        │
│         │                                                                               │
│  [Missing / Invalid Cache]                                                              │
│         ▼                                                                               │
│  Read Static Default Fallback ──► backend/config/production-layouts.json                │
│         │                                                                               │
│  [Unparseable Disk]                                                                     │
│         ▼                                                                               │
│  In-Memory @Volatile Snapshot (Current / Empty)                                         │
└──────────────────────────────────────────┬──────────────────────────────────────────────┘
                                           │
                                           ├────────────────────────┐
                                           │                        │
                                           ▼                        ▼
                                ┌──────────────────────┐ ┌──────────────────────┐
                                │   IPC: catalog.get   │ │   IPC: catalog.sync  │
                                └──────────────────────┘ └──────────────────────┘
```

---

## 2. Dependency Specification

The Firebase Admin SDK is declared in `backend/build.gradle.kts`:

```kotlin
// backend/build.gradle.kts
dependencies {
    implementation("com.google.firebase:firebase-admin:9.3.0")
    implementation("com.google.auth:google-auth-library-oauth2-http:1.23.0")
    implementation("com.google.code.gson:gson:2.10.1")
}
```

The JVM backend interacts with Firestore using standard Google Cloud Service Account credentials, eliminating any dependency on local browser OAuth flows or user interactive logins.

---

## 3. Credential Discovery Order

The service account key (`serviceAccountKey.json`) contains sensitive private keys used to authenticate as a Firebase Admin. In accordance with security guardrails, credentials must never be committed to source control or logged in telemetry.

`FirebaseCatalogService.kt` resolves the service account credentials through a strict, deterministic 4-stage search sequence:

```kotlin
val credential = sequenceOf(
    workspace.resolve("serviceAccountKey.json"),
    workspace.resolve("backend/serviceAccountKey.json"),
    localAppData?.let { Path.of(it).resolve("LeSouvenirDesktop/serviceAccountKey.json") },
    credentialOverride?.let { Path.of(it) }
).filterNotNull().firstOrNull { Files.isRegularFile(it) }
```

### Discovery Precedence Table

| Priority | Path Target | Purpose / Deployment Context |
|---|---|---|
| **1** | `<workspace>/serviceAccountKey.json` | Local developer testing in development worktree |
| **2** | `<workspace>/backend/serviceAccountKey.json` | Gradle subproject execution root |
| **3** | `%LOCALAPPDATA%\LeSouvenirDesktop\serviceAccountKey.json` | Standard packaged Windows kiosk deployment (isolated from application binaries) |
| **4** | `FIREBASE_SERVICE_ACCOUNT_PATH` | System environment variable or JVM system property override for staging/CI environments |

### Initialization Security & Lifecycle Guard

- If no file is discovered, `fetchRemote()` returns `null` immediately without throwing exceptions or logging raw paths.
- The `FirebaseApp` instance is initialized as a thread-safe singleton:
  ```kotlin
  val app = synchronized(FirebaseApp::class.java) {
      FirebaseApp.getApps().firstOrNull() ?: Files.newInputStream(credential).use { input ->
          FirebaseApp.initializeApp(FirebaseOptions.builder().setCredentials(GoogleCredentials.fromStream(input)).build())
      }
  }
  ```
- Firestore requests are bounded by a strict 5-second timeout guard:
  ```kotlin
  val documents = FirestoreClient.getFirestore(app)
      .collection("layouts")
      .get()
      .get(5, TimeUnit.SECONDS)
      .documents
  ```

---

## 4. Firestore Schema & `LayoutMode` Mapping

Firestore documents within the root collection `layouts` are dynamically converted into strongly typed `LayoutMode` domain models in `FirebaseCatalogService.mapLayouts()`.

### Firestore Field to `LayoutMode` Contract

| Firestore Document Field | Data Type | Default / Fallback | `LayoutMode` Property | Description |
|---|---|---|---|---|
| Document ID (`doc.id`) | `String` | *(Required)* | `id` | Unique layout identifier (e.g., `classic_strip_5x15`, `grid_2x2_10x15`) |
| `title` | `String` | *(Required)* | `title` | Human-readable title displayed on touchscreen UI |
| `family` | `String` | `"Grid"` | `family` | Enum `LayoutFamily` (`Column`, `Grid`, `Single`, `Freestyle`) |
| `shotCount` | `Number` | *(Required)* | `shotCount` | Number of sequential exposures captured during session |
| `selectCount` | `Number` | *(Required)* | `selectCount` | Number of photos the customer selects to print |
| `countdownSeconds` | `Number` | `3` | `countdownSeconds` | Countdown timer length between shots |
| `basePrice` | `Number` | `0L` | `basePrice` | Base session price in VND (Vietnamese Dong) |
| `printSizeLabel` | `String` | `"10x15"` | `printSizeLabel` | Physical paper media size: `"5x15"` or `"10x15"` |
| `width` / `height` | `Number` | Calculated | `printAspectRatio` | If `width` and `height > 0`, `width / height`; if label contains `"5x15"`, `1/3f`; else `2/3f` |
| `slots` | `Array<Map>` | `[]` | `absoluteSlots` | Normalized coordinates `[x, y, width, height]` for photo placement |

### Dynamic Slot Mapping Logic

The mapper maps custom slot definitions into `absoluteSlots` using Gson serialization trees, ensuring backward and forward compatibility:

```kotlin
private fun mapLayouts(fields: List<JsonObject>): List<LayoutMode>? = fields.map { f ->
    val label = f.get("printSizeLabel")?.asString ?: "10x15"
    val width = f.get("width")?.asFloat
    val height = f.get("height")?.asFloat
    val defaults = LayoutMode(
        id = f.get("id").asString,
        title = f.get("title").asString,
        subtitle = "",
        description = "",
        family = LayoutFamily.valueOf(f.get("family")?.asString ?: "Grid"),
        shotCount = f.get("shotCount").asInt,
        selectCount = f.get("selectCount").asInt,
        countdownSeconds = f.get("countdownSeconds")?.asInt ?: 3,
        basePrice = f.get("basePrice")?.asLong ?: 0L,
        thumbnailUrl = "",
        accentColor = 0L,
        printSizeLabel = label,
        printAspectRatio = if (width != null && height != null && height > 0) width / height
            else if (label.replace(" ", "").contains("5x15")) 1f / 3 else 2f / 3
    )
    gson.fromJson<LayoutMode>(gson.toJsonTree(defaults).asJsonObject.apply {
        f.entrySet().forEach { (key, value) -> 
            add(if (key == "slots") "absoluteSlots" else key, value) 
        }
    }, LayoutMode::class.java)
}.takeIf { it.isNotEmpty() }
```

---

## 5. Atomic Local Disk Caching & Offline Fallback Hierarchy

To eliminate race conditions, corrupt partial writes during sudden power loss, or JSON corruption, caching employs an **atomic temporary file swap**.

### 5.1 Atomic File Swap Mechanism

When a remote fetch succeeds, the payload is serialized and committed to disk atomically:

```kotlin
Files.createDirectories(cache.parent)
val temporary = Files.createTempFile(cache.parent, "firebase-layouts-", ".tmp")
try {
    Files.writeString(temporary, gson.toJson(mapOf("layouts" to fetched)))
    Files.move(temporary, cache, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
} finally {
    Files.deleteIfExists(temporary)
}
```

- `ATOMIC_MOVE`: Leverages Windows NTFS atomic move semantics. Readers will never read a truncated or half-written cache file.
- `finally` cleanup: Ensures no stray `.tmp` files accumulate in the event of unexpected I/O interruptions.

### 5.2 4-Tier Offline Fallback Hierarchy

When `sync()` or `getLayouts()` is called, the service follows this fallback ladder:

```
Tier 1: Firestore Remote
        │
        ├──[OK]──► Update In-Memory Cache + Write Atomic Disk Cache ──► Return Layouts
        │
        └──[Network Error / Timeout / Credential Missing]
                │
                ▼
Tier 2: Local Disk Cache (backend/config/firebase-layouts-cache.json)
        │
        ├──[Valid JSON]──► Update In-Memory Cache ──► Return Layouts
        │
        └──[Missing / Corrupt File]
                │
                ▼
Tier 3: Packaged Production Static Layouts (backend/config/production-layouts.json)
        │
        ├──[Valid JSON]──► Update In-Memory Cache ──► Return Layouts
        │
        └──[Missing / Unparseable]
                │
                ▼
Tier 4: Current In-Memory Cache (or emptyList() safe fallback)
```

This guarantee ensures the kiosk **always boots and displays a functional catalog** even when operating in an air-gapped environment or on fresh hardware installations without internet.

---

## 6. `FrameStore` Local Asset Indexing

The decorative frame overlays applied to photobooth sessions are stored locally as PNG graphic assets. `FrameStore.kt` indexes available frame designs across dual directory roots:

1. `<workspace>/data/frames` (Project workspace / development root)
2. `%LOCALAPPDATA%/LeSouvenirDesktop/data/frames` (Windows installed user data root)

### 6.1 Directory Structure & Conventions

Frames are organized hierarchically by paper size, layout ID, and category:

```
data/frames/
  ├── 5x15/
  │   └── classic_strip/
  │       ├── Standard/
  │       │   ├── minimalist_white.png
  │       │   ├── minimalist_white.json       # Optional QR & metadata coordinates
  │       │   └── thumb_minimalist_white.png  # Pre-baked compact thumbnail (optional)
  │       └── Special/
  │           └── Tet2026/
  │               ├── festive_blossom.png
  │               └── thumb_festive_blossom.png
  └── 10x15/
      └── grid_2x2/
          └── Standard/
              ├── film_black.png
              └── pastel_cream.png

data/covers/
  └── 5x15/
      └── classic_strip/
          └── Special/
              └── Tet2026/
                  └── cover.png               # Event collection banner cover
```

### 6.2 Indexing Rules & Thumbnail Optimization

1. **Original Frame Protection:** High-resolution composition frames are strictly separated from UI thumbnails. Files starting with `thumb_` are ignored during frame asset discovery:
   ```kotlin
   paths.filter { Files.isRegularFile(it) && it.fileName.toString().endsWith(".png", true) &&
       !it.fileName.toString().startsWith("thumb_", true) }
   ```
2. **Efficient Metadata Scanning:** Frame resolution is determined via image stream metadata readers without loading multi-megabyte bitmap rasters into JVM heap memory:
   ```kotlin
   ImageIO.createImageInputStream(path.toFile())?.use { stream ->
       val reader = ImageIO.getImageReaders(stream).next()
       try { reader.input = stream; reader.getWidth(0) to reader.getHeight(0) }
       finally { reader.dispose() }
   }
   ```
3. **Bounded IPC Thumbnail Generation:**
   - For UI display over IPC, `FrameStore` automatically searches for a pre-rendered thumbnail (`thumb_<filename>` or `thumb_ui_<filename>`).
   - If absent, it dynamically generates a thumbnail in-memory, constrained to a maximum bounding box of $180 \times 180$ pixels using bilinear interpolation.
   - **Byte Budget Invariant:** The raw PNG payload must not exceed $18,000$ bytes ($\approx 24\text{ KB}$ after Base64 encoding). If an image exceeds $18,000$ bytes, the scaling loop aggressively scales down dimensions by $0.75\times$ until the payload is within the safe IPC budget. This prevents IPC channel saturation.

### 6.3 Event Bundles (`BundlePack`)

Seasonal or themed frames are grouped into `BundlePack` objects via `loadBundles()`. Bundles represent curated event collections (e.g., Lunar New Year, Wedding Specials) that can be triggered directly from the StartScreen with custom cover artwork.

---

## 7. IPC Contract Specification

The catalog subsystem exposes two strongly typed JSON-RPC 2.0 endpoints consumed by the React touchscreen frontend:

### 7.1 `catalog.get`

Retrieves the currently active layouts, frame count, pricing tables, and seasonal bundles. This call is non-blocking and reads directly from cached in-memory structures.

#### Request
```json
{
  "jsonrpc": "2.0",
  "id": "req-catalog-001",
  "method": "catalog.get",
  "params": {},
  "protocolVersion": 1
}
```

#### Response
```json
{
  "jsonrpc": "2.0",
  "id": "req-catalog-001",
  "result": {
    "layouts": [
      {
        "id": "5x15_strip_2up",
        "title": "Dải ảnh 5x15 cm",
        "family": "Column",
        "shotCount": 4,
        "selectCount": 4,
        "countdownSeconds": 5,
        "basePrice": 70000,
        "printSizeLabel": "5x15",
        "printAspectRatio": 0.33333334,
        "absoluteSlots": [
          { "index": 0, "x": 0.08, "y": 0.05, "width": 0.84, "height": 0.20 },
          { "index": 1, "x": 0.08, "y": 0.27, "width": 0.84, "height": 0.20 },
          { "index": 2, "x": 0.08, "y": 0.49, "width": 0.84, "height": 0.20 },
          { "index": 3, "x": 0.08, "y": 0.71, "width": 0.84, "height": 0.20 }
        ]
      },
      {
        "id": "10x15_grid_4up",
        "title": "Khung ảnh 10x15 cm",
        "family": "Grid",
        "shotCount": 6,
        "selectCount": 4,
        "countdownSeconds": 5,
        "basePrice": 90000,
        "printSizeLabel": "10x15",
        "printAspectRatio": 0.6666667,
        "absoluteSlots": []
      }
    ],
    "framesCount": 18,
    "bundles": [
      {
        "id": "5x15/5x15_strip_2up/Tet2026",
        "name": "Tết Giáp Ngọ 2026",
        "coverDataUrl": "data:image/png;base64,iVBORw0KGgo...",
        "layoutId": "5x15_strip_2up",
        "frameCount": 4
      }
    ],
    "defaultLayoutId": "5x15_strip_2up",
    "simulator": false,
    "pricing": {
      "stripBasePrice": 70000,
      "stripUnitPrice": 20000,
      "printBasePrice": 90000,
      "printUnitPrice": 30000,
      "stripAllowedQuantities": [2, 4, 6, 8, 10],
      "printAllowedQuantities": [1, 2, 3, 4, 5, 6]
    }
  }
}
```

---

### 7.2 `catalog.sync`

Forces an immediate re-fetch of Firestore layouts, writes the new atomic disk cache, and updates the active runtime layouts. Typically triggered from the Operator Admin Panel or periodic background maintenance.

#### Request
```json
{
  "jsonrpc": "2.0",
  "id": "req-sync-002",
  "method": "catalog.sync",
  "params": {},
  "protocolVersion": 1
}
```

#### Response
Returns the identical structure as `catalog.get`, reflecting the updated Firestore definitions. If remote sync encounters network disconnection, it logs the failure and gracefully returns the existing cache without throwing an error code to the UI.

---

## 8. Verification & Test Evidence

The catalog integration and caching rules are validated by automated test suites in V2:

| Test Class / Suite | File Location | Key Invariants Verified |
|---|---|---|
| `FirebaseCatalogServiceTest` | `backend/src/test/kotlin/com/lesouvenir/v2/catalog/FirebaseCatalogServiceTest.kt` | Proves full hierarchy: static production default -> remote fetch -> atomic disk cache -> offline fallback using simulated exceptions. |
| `FrameStoreThumbnailTest` | `backend/src/test/kotlin/com/lesouvenir/v2/storage/FrameStoreThumbnailTest.kt` | Proves `thumb_` prefix filtering, verifies thumbnail generation $< 25\text{ KB}$, and checks bundle cover resolution. |
| `RealSessionEngineTest` | `backend/src/test/kotlin/com/lesouvenir/v2/ipc/RealSessionEngineTest.kt` | Verifies `catalog.get` and `catalog.sync` IPC contracts and pricing calculations under `RealSessionEngine`. |
| `smoke-installed.ps1` | `backend/smoke-installed.ps1` | Validates IPC JSON-RPC response from installed packaged binary on Windows. |
