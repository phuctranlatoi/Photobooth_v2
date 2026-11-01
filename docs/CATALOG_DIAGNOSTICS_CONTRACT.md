# Catalog diagnostics proposal (architect review required)

This document proposes a **read-only diagnostics payload**; it does not change the shared IPC schema. Coordinate the field names and exposure point with the architect before implementation.

```json
{
  "catalogSource": "FIREBASE_LIVE | DISK_CACHE | STATIC_FALLBACK | MEMORY_FALLBACK | UNAVAILABLE",
  "lastSyncError": "sanitized error message or null"
}
```

- `FIREBASE_LIVE`: a nonempty Firestore `layouts` fetch succeeded in this process. A failed cache write does not change this source, but must be reported separately (or in `lastSyncError` if there is no separate cache warning field).
- `DISK_CACHE`: a failed/unavailable remote fetch was followed by a successfully parsed, nonempty `backend/config/firebase-layouts-cache.json`.
- `STATIC_FALLBACK`: remote and disk cache were unavailable; a nonempty `backend/config/production-layouts.json` was loaded. These are bundled static layouts, **not proof of live catalog synchronization**.
- `MEMORY_FALLBACK`: remote, cache, and static file failed; a previously fetched nonempty in-memory list remains usable. This is distinct from the existing non-forced `current` fast path, which should retain its original provenance.
- `UNAVAILABLE`: no nonempty layouts can be served. If `RealSessionEngine` subsequently reads its own production defaults, its final effective source must be reported accurately, not as Firebase live.

`lastSyncError` describes the **most recent attempted sync**, and is cleared only after that sync succeeds without errors. Do not clear it when merely returning a cached `current` list. Capture remote absence, empty Firestore results, authentication/permission failures, timeout, malformed cache/static JSON, and unreadable files. A missing key should say `Missing serviceAccountKey.json in workspace and LocalAppData (no valid override)` without displaying paths. Prefer predefined error categories and safe descriptions; do not concatenate raw exception messages, URLs, environment values, credential content, tokens, document fields, or images. Examples: `Firestore layouts request timed out`, `Firestore layouts permission denied`, `Catalog cache is unreadable`, `Catalog layouts are empty`.

Preserve provenance of `current` across calls, including `sync(forceRemote = true)` failure. Reading a file must validate a nonempty catalog before labeling it cache/static success. File presence alone does not establish valid credentials: never load the service-account JSON merely for diagnostics; actual authentication errors should be categorized by the sync attempt. The source and error must be published as a consistent snapshot with the layouts returned by the same sync.

## Observed local snapshot (2026-11-01; presence/booleans only)

- Workspace `.env`: absent; LocalAppData `LeSouvenirDesktop/.env`: present. Effective loader order is workspace, LocalAppData, then process environment overrides. No values are included here.
- `payOsConfigured=false`; `cloudinaryConfigured=true`; `webAlbumConfigured=true`; `revenueEndpointConfigured=true`; `databaseConfigured=false`; `printerConfigured=false`. These indicate nonblank configuration keys only, **not** working remote services or printer support.
- `serviceAccountKey.json` regular file: absent at workspace root, workspace `backend/`, and LocalAppData `LeSouvenirDesktop/`; service-account override not configured in the inspection process. Disk cache absent. Thus in this inspected environment `fetchRemote()` returns null at the credential lookup and `sync()` loads bundled static layouts (assuming JSON parses); no live Firestore attempt occurs.
- Bundled static IDs: `strip-5x15`, `print-10x15` only. No HTTP/Firestore transaction, hardware action, or credential-content read was performed for this snapshot.

## Current implementation gap

`FirebaseCatalogService.sync()` currently suppresses exceptions using `runCatching(...).getOrNull()`; `fetchRemote()` returns null when no regular-file credential exists; `readFile()` also suppresses parse/IO errors. Neither `catalogSource` nor `lastSyncError` currently exists. This proposal does not assert a runtime diagnostic field is already available.
