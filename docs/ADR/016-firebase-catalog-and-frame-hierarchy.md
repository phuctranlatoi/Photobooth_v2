# ADR-016: Firebase Catalog Service, Offline Caching, and Disk Frame Hierarchy

**Date:** 2026-11-01  
**Status:** Accepted  
**Authors:** Specialist Solutions Architect (V2)  
**Supersedes/Extends:** Extends ADR-003 (Backend Kotlin) and ADR-015 (Real Runtime Engine)

---

## 1. Context and Problem Statement

Legacy V1 photobooth relied on Firebase Firestore to fetch layout configurations (`layouts` collection) at runtime via `FirebaseManager.kt`. However, V1 had critical limitations and operational risks:
1. **Hardcoded Credentials in Working Directory:** V1 directly looked for `"serviceAccountKey.json"` in the process working directory, with no fallback to Windows standard application data directories (`%LOCALAPPDATA%`).
2. **Zero Offline Disk Caching:** If network was interrupted or Firestore timed out (>5000ms), V1 fell back to a generic non-functional empty layout (`fallback_layout`). It never cached previously retrieved layouts to disk.
3. **Misleading Architecture Regarding Frames:** While V1 included an unused method `uploadFrameMetadata` to a Firestore collection named `frames`, runtime callers were zero. All active decorative frames, seasonal bundle overlays, and special event covers were stored and resolved 100% locally from disk (`data/frames` and `data/covers`).
4. **No Dynamic Sync:** Kiosk operators had to restart the entire JVM application to refresh layouts when Firestore documents changed.

V2 requires an enterprise-grade, offline-first catalog architecture:
- Resolves `serviceAccountKey.json` safely from workspace and `%LOCALAPPDATA%/LeSouvenirDesktop/`.
- Fetches Firestore `layouts` with strict coroutine timeouts.
- Parses all layout attributes, custom slot boundaries (`absoluteSlots`), aspect ratios, and QR placements.
- Caches fetched layouts locally to `backend/config/firebase-layouts-cache.json`.
- Implements a resilient 4-tier fallback hierarchy.
- Recursively indexes disk frames (`data/frames`) and covers (`data/covers`) for seasonal event bundles.
- Exposes typed IPC methods `catalog.get` and `catalog.sync`.

---

## 2. Decision

### 2.1 Credentials Resolution
The backend service will look up Google Service Account credentials in the following strict order:
1. Workspace root: `<workspace>/serviceAccountKey.json`
2. Backend folder: `<workspace>/backend/serviceAccountKey.json`
3. Windows Local AppData: `%LOCALAPPDATA%/LeSouvenirDesktop/serviceAccountKey.json`

If none of these paths exist or if the file contains unparseable JSON, the service marks `firebaseConfigured = false`, emits an operational log to `stderr`, and immediately activates offline fallback without throwing an unhandled exception or crashing the JVM sidecar. Path validation rejects directory traversal (`..`) and symbolic links.

### 2.2 Four-Tier Fallback Hierarchy
When `catalog.get` or `catalog.sync` is evaluated:
1. **Tier 1 (Live Firestore):** If credentials exist and network succeeds within 5000ms, retrieve the `layouts` collection from Firestore, map documents to `LayoutMode`, and write the serialized result atomically to `backend/config/firebase-layouts-cache.json`.
2. **Tier 2 (Disk Cache):** If Firestore is unreachable, credentials are missing, or query times out, check `backend/config/firebase-layouts-cache.json`. If valid, parse and return cached layouts (reporting `"source": "CACHE"`).
3. **Tier 3 (Production Defaults):** If cache is missing or corrupted, load `backend/config/production-layouts.json` (reporting `"source": "LOCAL_PRODUCTION"`).
4. **Tier 4 (Hardcoded Invariant):** If configuration files are unreadable, fall back to immutable in-memory defaults (`strip-5x15` and `print-10x15`).

### 2.3 Disk Frame and Event Bundle Scanning
The service indexes local frames independently of Firestore:
- **Base directory:** `<workspace>/data/frames/`
- **Path convention:** `<printSizeLabel>/<layoutId>/<Standard|Special>/[specialEventName]/<frameSlug>_<timestamp>.png`
- **Metadata parsing:**
  - Standard vs Special: determined by path segment.
  - Target layout & size: derived from path segments or frame metadata.
  - QR Code configuration: companion JSON file `<frameSlug>_<timestamp>.json` parsed for `{ qrCodeX, qrCodeY, qrCodeSize }`.
  - Special Event Cover: `<workspace>/data/covers/<specialEventName>.png`. If found, encoded as Base64 data URL for frontend carousel display.
- **Bundle grouping:** All frames marked `Special` sharing the same `specialEventName` are grouped into a `BundlePack` containing the event name, cover data URL, target layout ID, and member frames.

### 2.4 IPC Exposure
Two JSON-RPC 2.0 endpoints are added to `SessionEngine`:
- `catalog.get`: Returns active layouts, default layout ID, loaded frames, event bundles, and pricing configuration.
- `catalog.sync`: Forces an immediate re-fetch from Firestore (if credentials exist), re-scans `data/frames` and `data/covers`, updates in-memory stores, updates the disk cache, and returns the refreshed snapshot.

---

## 3. Consequences

### Positive
- **100% Offline Immunity:** A disconnected kiosk boots cleanly using cached or production layouts without hanging on remote network calls.
- **Zero Configuration Friction:** Developers without Firebase access can develop against `production-layouts.json` and local disk frames.
- **Operator Flexibility:** Marketing teams can update layouts in Firestore, and on-site staff can trigger `catalog.sync` via the Admin panel without restarting the kiosk application.
- **Data Integrity:** Real disk frames with transparency and custom slot cutouts are preserved and passed to `DesktopCompositor`.

### Negative / Tradeoffs
- Added complexity in handling document schema mismatches between Firestore and local JSON. Handled through robust defensive defaults.
- Need for atomic file write primitives (`createTempFile` + `ATOMIC_MOVE`) to prevent corrupted cache files if power is lost during write.
