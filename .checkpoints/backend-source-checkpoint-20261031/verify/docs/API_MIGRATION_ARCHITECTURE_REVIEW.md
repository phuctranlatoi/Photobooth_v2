# API Migration Architecture Review — V1 → V2

**Status**: SOURCE REVIEW ONLY — no runtime tests executed.  
**Date**: 2026-10-30  
**Scope**: Backend-owned integrations (PayOS, Neon, Cloudinary, Web Album, Printer, Camera) and IPC contract alignment. Frontend must never receive tokens, secrets, or arbitrary HTTP capability. **Validated album/QR URLs returned via IPC for display only** (opaque string rendered as `<img>`); frontend never calls them.

---

## 1. V1 External Integrations — Source-Verified Inventory

| Integration | V1 Source Files | Transport | Auth (header names only) | Key DTOs | Idempotency / Retry |
|---|---|---|---|---|---|
| **PayOS** | `PaymentService.kt` (vn.payos SDK) | HTTPS SDK | `clientId`, `apiKey`, `checksumKey` (never logged) | `CreatePaymentLinkRequest`, `PaymentLinkStatus` | OrderCode = timestamp ms; poll 3s; no webhook in V1 |
| **Neon (Direct JDBC)** | `NeonDirectRevenueClient.kt` | JDBC (PostgreSQL) | `neonDatabaseUrl` (user:pass in URL) | `SaleTransaction`, `SalesSummary`, `DailyRevenuePoint`, `SizeBreakdown` | `ON CONFLICT (external_session_id) DO NOTHING`; `SELECT ... FOR UPDATE` on adjust |
| **Neon (HTTP API fallback)** | `DesktopRevenueClient.kt` | HTTPS REST | `Authorization: <boothApiKey>` (header name) | Same as above via `/api/v1/revenue/*` | Same semantic; HTTP 5xx retry not implemented |
| **Cloudinary** | `DesktopCloudinaryClient.kt` | HTTPS multipart | `cloudinaryCloudName`, `uploadPreset` (unsigned upload preset) | `UploadedCloudAsset`, `FinalizeAssetRequest` | No retry; single attempt |
| **Web Album (Custom API)** | `DesktopWebAlbumClient.kt`, `DesktopAlbumUploader.kt` | HTTPS JSON | `Authorization: <boothApiKey>` (header name) | `CreateAlbumRequest/Response`, `FinalizeAssetRequest`, `AlbumUploadResult` | Sequential finalize to avoid race; no retry |
| **Firebase (Layout config only)** | `FirebaseManager.kt` (referenced in controller) | HTTPS (Admin SDK assumed) | Service account (not in V1 source viewed) | LayoutMode DTOs | **UNKNOWN** — only `fetchLayouts()` / `updateLayoutConfig()` referenced; no other uses verified in source |

---

## 2. Transport & Security Gates (Backend Enforced)

| Rule | Enforcement Point | Detail |
|---|---|---|
| **Default-deny network** | Backside Kotlin only | Frontend (React) gets **zero** HTTP client, zero tokens, zero arbitrary HTTP. All outbound calls originate from JVM sidecar. **Validated display URLs (album/QR) returned via IPC are allowed** — frontend renders only, never calls. |
| **Local fixture validation** | Test config only | `simulator-layouts.json` drives catalog; integration tests use `MockWebServer` / recorded fixtures. No production endpoints in CI. |
| **No redirects / SSRF** | `HttpClient.newBuilder().followRedirects(NEVER)` | All V1 clients use `NORMAL` redirects — **must change** to `NEVER` in V2; validate host against allowlist before request. |
| **No secrets in logs** | Structured logging | Redact `Authorization`, `upload_preset`, `checksumKey`, JDBC password. Log only method, path, status, latency, error code. |
| **Runtime production gates** | Env flags | `ENABLE_PRODUCTION_NETWORK=false` by default. `NEON_DIRECT_JDBC`, `PAYOS_LIVE`, `CLOUDINARY_LIVE`, `ALBUM_API_LIVE` each independent opt-in. |
| **Currency as decimal strings** | All DTOs | `Long` (VND minor units) in Kotlin; `string` in JSON. Never `Double`/`Float`. |
| **Revenue gate: manual && adapter accepted && same sessionId** | `DesktopBoothController.startPrinting` line 842 | `userConfirmed == true` AND `printJob.await() == true` AND `currentSessionId == sessionId` → then record sale + sync. Driver submission ≠ physical print. |
| **No direct Neon DDL from kiosk** | `NeonDirectRevenueClient.migrate()` | `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` runs on first connection — **BLOCKED for production**; schema changes via migration tooling only. |
| **Album URL to React: display only** | IPC `session.getState` → `qrUrl` / `masterUrl` | Returned URL is **opaque string for QR display**. Frontend never calls it. Token (if any) stays in backend. |

---

## 3. V2 IPC Contract Alignment — Approved vs Missing

| V1 Controller Method | V2 IPC Method (Simulator) | Status | Notes |
|---|---|---|---|
| `chooseLayout` | `session.setLayout` | ✅ Mapped | |
| `confirmStudioSetup` | `session.confirmSetup` | ✅ Mapped | |
| `setQuantityAndStartPayment` | `session.setQuantity` + `payment.mockComplete` | ✅ Mapped | Simulator mock; real PayOS needs `payment.create` / `payment.poll` |
| `startCaptureFlow` | `capture.startSequence` | ✅ Mapped | |
| `toggleMoment` / `confirmSelection` | `selection.toggle` / `selection.confirm` | ✅ Mapped | |
| `chooseFrame` / `confirmFrameSelection` | `frame.select` / `frame.confirm` | ✅ Mapped | |
| `startPrinting(userConfirmed)` | `print.confirmDryRun` | ⚠️ Partial | Simulator dry-run only; real print needs `print.start` with `userConfirmed` + idempotency key |
| `cancelSession` | `session.cancel` | ✅ Mapped | |
| `finishSession` | `session.finish` | ✅ Mapped | |
| `goBack` | `session.back` | ✅ Mapped | |
| `device.getStatus` | `device.getStatus` | ✅ Mapped | |
| `catalog.get` | `catalog.get` | ✅ Mapped | |
| **Admin/Studio: layout CRUD** | `operator.updateLayout` | ✅ Simulator only | Production ACL not implemented |
| **Admin/Studio: printer config** | — | ❌ Missing | No IPC for printer name, paper, cut mode |
| **Admin/Studio: camera source** | — | ❌ Missing | No IPC for Canon/Webcam/HotFolder toggle |
| **Admin/Studio: Beauty/LUT config** | — | ❌ Missing | No IPC for preset, weights, thresholds |
| **Admin/Studio: PayOS/Neon/Cloudinary config** | — | ❌ Missing | No IPC; config via `.env` only |
| **Revenue dashboard** | — | ❌ Missing | `revenue.getSummary` etc. not in IPC |

**Critical gap**: V2 simulator IPC covers customer flow only. Admin/Studio parity requires ≥10 new methods with production ACL design.

---

## 4. Deployment / Web Server Repository Evidence

| Component | V1 Evidence | V2 Status | Blocker |
|---|---|---|---|
| **Web Album API (Vercel/custom)** | `DesktopWebAlbumClient.kt` calls `config.webAlbumBaseUrl` + `/api/v1/albums/*` | URL known; **server source not in V1** | Cannot verify schema, migrations, auth, QR expiry. Treat as external dependency — document contract, test against sandbox. |
| **Neon HTTP API** | `DesktopRevenueClient.kt` calls `/api/v1/revenue/*` | Same as above | Server repo not in V1. Direct JDBC is primary; HTTP is fallback. |
| **Firebase Layouts** | `FirebaseManager.fetchLayouts()` / `updateLayoutConfig()` | Admin SDK; project not in V1 | Layout config read at startup; writes from Studio. Need service account + project ID. |
| **PayOS** | `vn.payos` SDK v2 | SDK available; merchant account external | Sandbox credentials required for test. |
| **Cloudinary** | Unsigned upload preset | Preset ID in config; cloud name in config | No server component. |
| **DNP RX1HS Driver** | `SystemPrinterService` → `javax.print` → Windows spooler | Driver installed on kiosk; no code repo | Print geometry hardcoded in V1 compositor; must replicate exactly. |

**Verdict**: No deployable web server repository discovered in V1 source. All external APIs are **third-party or separately deployed**. V2 must treat them as black-box contracts with sandbox fixtures.

---

## 5. Actionable Review — Backend / Frontend Ownership

### Backend (Kotlin/JVM) — Must Implement

| Task | Priority | Owner | Acceptance |
|---|---|---|---|
| Port `PaymentService` → V2 `PayosAdapter` with sandbox/prod modes | P0 | backend-engineer | `createPaymentLink` returns QR string; `checkPaymentStatus` polls; no secrets in logs |
| Port `NeonDirectRevenueClient` → V2 `NeonRevenueAdapter` (JDBC + HTTP fallback) | P0 | backend-engineer | `recordTransaction` idempotent; `adjustTransaction` uses `FOR UPDATE`; `migrate()` **disabled** in prod config |
| Port `DesktopCloudinaryClient` → V2 `CloudinaryAdapter` | P0 | backend-engineer | Multipart upload; unsigned preset; transform URL rewrite; single attempt |
| Port `DesktopWebAlbumClient` + `DesktopAlbumUploader` → V2 `AlbumAdapter` | P0 | backend-engineer | Sequential finalize; album URL returned to IPC for QR display only |
| Implement `PrinterAdapter` for DNP RX1HS (Windows Print Service) | P1 | printer-engineer | 5x15 (strip) and 10x15 geometries; cut orientation; queue/error status; **dry-run mode default** |
| Implement `CameraAdapter` (Canon EDSDK JNA + Webcam + HotFolder) | P1 | camera-engineer | Discovery, Live View, capture, transfer, reconnect; simulator shim |
| Implement `BeautyAdapter` (YuNet + BiSeNet ONNX) | P1 | camera-engineer | Frozen weights/thresholds; bounded exec; fallback to original |
| Add Admin/Studio IPC methods (layout, printer, camera, beauty, payment config) | P1 | backend-engineer | Local dev mode only; production ACL = future |
| Add Revenue IPC methods (`revenue.getSummary`, `revenue.getRecent`) | P2 | backend-engineer | Read-only; Neon direct or HTTP |
| Config schema: `.env.example` with placeholder keys; typed `BoothConfig` | P0 | architect | No real values committed |

### Frontend (React/TypeScript) — Must Implement

| Task | Priority | Owner | Acceptance |
|---|---|---|---|
| Typed IPC client (JSON-RPC 2.0 + HMAC) | P0 | frontend-coder | Generated from shared schema; no `fetch`/`axios` in frontend |
| Screen components for **all** V1 customer flow states (18 states) | P0 | frontend-coder | Parity with `SessionStateMachine` enum; simulator-driven |
| Admin/Studio route (protected) with layout/printer/camera/beauty forms | P1 | frontend-coder | Disabled controls where backend IPC missing; marked BLOCKED |
| QR display: render `qrUrl` from IPC as `<img>`; no navigation | P0 | frontend-coder | URL opaque; no token exposure |
| Live View: subscribe to named pipe events; backpressure/unsubscribe | P0 | frontend-coder | Target FPS configurable; cleanup on state exit |
| Error/loading states for every IPC call; retry UX for `-32000`/`-32003` | P1 | frontend-coder | No silent failures |
| Motion animations per design system; reduced-motion respect | P1 | ui-designer | 16:10 @ 1280x800 / 1920x1200; DPI scaling |

---

## 6. Feasibility Gates — Hardware Integration (Stage E) & Production Only

| Gate | Evidence Required | Status |
|---|---|---|
| **Canon EDSDK DLL loads + camera discovery** | JVM sidecar starts, `EdsGetCameraList` returns device | ❌ Not tested |
| **Live View frames via JNA callback** | 15+ fps JPEG frames delivered to named pipe | ❌ Not tested |
| **DNP RX1HS spooler submission (dry-run)** | `javax.print` job queued; status = `SUCCESS` | ❌ Not tested |
| **ONNX YuNet + BiSeNet inference < 2s/frame** | Benchmark on target hardware | ❌ Not tested |
| **JVM sidecar packaged + Tauri spawn/stop** | `tauri build` produces `.msi`; sidecar starts/stops cleanly | ❌ Not tested |
| **IPC latency < 50ms p99 (request/response)** | Local stdio benchmark | ❌ Not tested |
| **Backend crash detection + restart** | Tauri monitors sidecar PID; auto-restart with session recovery | ❌ Not tested |

**Stage D (API adapter + local fixture tests) — NO hardware prerequisite. Authorized now.**  
Gates 1-7 apply to Stage E (hardware integration) and production release only.

**Current review: SOURCE ONLY.** No runtime enforcement claimed. Backend adapter code not yet written in V2 — implementation must follow these contracts.

---

## 7. ADR Status — No New ADRs Required

Architecture decisions already documented in `V2_ARCHITECTURE.md`:
- IPC transport (JSON-RPC 2.0 over stdio + named pipe, HMAC, versioning) — §2.1–2.3
- Revenue gate (`manual && adapterAccepted && sameSessionId`) — §2.4, `startPrinting` logic
- Secrets/config (`.env.example`, runtime gates, no frontend exposure) — §6, §1.2
- Print contract (dry-run default, idempotency key, driver submission ≠ revenue) — §2.4, `print.confirmDryRun`
- External API contracts (sandbox fixtures only) — §2, §4

No architecture churn. Implement against existing contracts.

---

## 8. Next Checkpoint

1. **Backend**: Implement `PayosAdapter`, `NeonRevenueAdapter`, `CloudinaryAdapter`, `AlbumAdapter` with **local fixture tests only** — authorized now. No production network calls.
2. **Camera/Printer**: POC Canon EDSDK + DNP spooler (see `HARDWARE_POC_PLAN.md`) — **separate track, not blocking Stage D**.
3. **Architect**: Finalize IPC schema v1 (no new ADRs).
4. **Frontend**: Build typed IPC client; implement Welcome → Bundle → Payment → Capture flow against simulator.
5. **Tester**: Parity matrix (V1 screen → V2 component → IPC method → backend adapter).

**Production network calls and hardware integration remain blocked until feasibility gates pass with device evidence.**

---

## 9. Actual V2 Integration Code — Source Review Findings (2026-10-30)

### 9.1 SafeTransport.kt — Transport Enforcement

| Aspect | Finding | Verdict |
|---|---|---|
| **Default mode** | `IntegrationMode.DENY` — production blocked by default | ✅ Correct |
| **Redirects** | `followRedirects(HttpClient.Redirect.NEVER)` — prevents loopback/SSRF | ✅ Correct |
| **PRODUCTION mode** | `if (mode == IntegrationMode.DENY || mode == IntegrationMode.PRODUCTION) throw IntegrationException(Failure.DENIED)` | ✅ **INTENTIONAL** — Production requires explicit authorization gate (env flag + operator action). Not a bug. |
| **Local fixture allowlist** | Only `http://127.0.0.1` / `http://[::1]` permitted in `LOCAL_FIXTURE` mode | ✅ Correct |
| **Timeouts** | 5s connect, 10s request — reasonable | ✅ Acceptable |
| **Body handlers** | `HttpResponse.BodyHandlers.ofString()` — unbounded body; no size limit | ⚠️ **RISK** — large responses could OOM; add `BodyHandlers.ofByteArray` with limit |
| **Credential logging** | No headers/body logged — only status/error | ✅ Correct |
| **Exception taxonomy** | `Failure` enum covers DENIED, TIMEOUT, OFFLINE, HTTP, MALFORMED | ✅ Complete |

**Action**: Add response body size limit. PRODUCTION mode logic is correct per authorization policy.

### 9.2 PayOsClient.kt — HMAC & SDK Compatibility

| Aspect | Finding | Verdict |
|---|---|---|
| **HMAC implementation** | Hand-rolled `HmacSHA256` over canonical string `amount=...&cancelUrl=...&description=...&orderCode=...&returnUrl=...` | ⚠️ **UNVERIFIED** — V1 used `vn.payos` SDK v2; wire format must match exactly. No SDK wire proof in V2. |
| **Checksum key handling** | `SecretKeySpec(checksumKey.toByteArray(Charsets.UTF_8), "HmacSHA256")` — **empty string key throws `IllegalArgumentException`** if `checksumKey` is blank | ❌ **BUG** — fails at signature time, not at transport DENY gate. Should validate non-empty keys at construction or return `DENIED` early. |
| **Transport mode** | Uses injected `SafeTransport` — respects DENY/FAKE/LOCAL_FIXTURE | ✅ Correct |
| **Response parsing** | Expects `{ "code": "00", "data": { "qrCode": "...", "status": "PAID" } }` | ✅ Matches typical PayOS v2 |
| **Idempotency** | `orderCode = timestamp ms` — same as V1; no server-side idempotency key | ⚠️ **KNOWN** — duplicate orderCode = duplicate charge risk |
| **Polling** | `checkPaymentStatus` calls GET `/v2/payment-requests/{orderCode}` | ✅ Matches V1 |
| **SDK dependency** | **Zero** — pure HTTP; avoids `vn.payos` JAR | ✅ Intentional, but wire compatibility **BLOCKED** until SDK contract verified |

**Status**: **BLOCKED — SDK wire compatibility not verified**. HMAC empty-key crash. Fix: validate keys at construction; add integration test against PayOS sandbox.

### 9.3 SharedApiClients.kt — RevenueClient & WebAlbumClient

| Aspect | Finding | Verdict |
|---|---|---|
| **RevenueClient** | HTTP-only branch from V1 `DesktopRevenueClient`; **Neon direct JDBC route deliberately excluded** per user directive (no direct Neon DDL from kiosk) | ✅ **INTENTIONAL** — Not a regression. JDBC path + DDL migration blocked for kiosk client. |
| **Idempotency** | `recordTransaction` returns `true` unconditionally; no `ON CONFLICT` handling | ⚠️ **SERVER-SIDE GAP** — HTTP API must enforce idempotency; client cannot guarantee. Test locally with mock server. |
| **Adjust/void** | `require(actualQuantity >= 2)` — matches V1; no `FOR UPDATE` snapshot | ⚠️ **SERVER-SIDE GAP** — Race safety belongs in API layer; client calls are fire-and-forget. |
| **WebAlbumClient** | Ported from `DesktopWebAlbumClient`; sequential finalize preserved | ✅ **Source-field-verified** — `createAlbum`, `finalizeAsset`, `completeAlbum` match V1 signatures |
| **Server ownership** | Comment: "The server owns QR URL and access token" — correct boundary | ✅ Correct |
| **Error handling** | Wraps all exceptions in `IntegrationException(Failure.MALFORMED)` — loses status code | ⚠️ **LOSSY** — HTTP status discarded; add `status` field to `IntegrationException` |
| **Transport** | Both use injected `SafeTransport` — mode respected | ✅ Correct |

**Action**: Preserve HTTP status in errors. Server-side idempotency/race safety is API contract, not client replication. Exact revenue predicate (`manual && adapterAccepted && sameSessionId`) tested locally later.

### 9.4 CloudinaryClient.kt — Upload & Transform

| Aspect | Finding | Verdict |
|---|---|---|
| **Multipart construction** | Hand-rolled boundary + body — **source-field-verified** vs V1 `DesktopCloudinaryClient.multipartBody()` | ✅ Parity |
| **Input validation** | `fileName` regex `[A-Za-z0-9_.-]+`; extension allowlist `jpg|jpeg|png|mp4`; non-empty content — **source-field-verified** | ✅ Parity |
| **Transform rewrite** | Inserts `f_auto,q_auto` (or `vc_h264` for video) after `/upload/v` — **source-field-verified** vs V1 | ✅ Parity |
| **Response parsing** | Extracts `secure_url`, `asset_id`, `public_id`, `version`, `format`, `resource_type`, `type`, `width`, `height`, `bytes` — **source-field-verified** | ✅ Parity |
| **Transport** | Uses `SafeTransport` — mode respected | ✅ Correct |
| **Byte input** | Accepts `ByteArray` — avoids arbitrary file access; caller must read file | ✅ Safe boundary |

**Status**: **SOURCE-FIELD-VERIFIED** — all fields/behavior match V1 `DesktopCloudinaryClient`. No blockers.

---

### 9.5 Summary — Integration Readiness (Corrected)

| Client | Source Parity | Transport Gate | Blocker |
|---|---|---|---|
| `SafeTransport` | N/A (new) | DENY default, NEVER redirects | Unbounded body handler; PRODUCTION mode = intentional DENY |
| `PayOsClient` | Wire-compatible? **UNVERIFIED** | Uses SafeTransport | Empty checksumKey → IllegalArgumentException; SDK wire proof absent |
| `RevenueClient` | HTTP fallback only (JDBC intentionally excluded) | Uses SafeTransport | Server-side idempotency/race gaps; error loses HTTP status |
| `WebAlbumClient` | **Source-field-verified** | Uses SafeTransport | Error loses HTTP status |
| `CloudinaryClient` | **Source-field-verified** | Uses SafeTransport | None |

**No hardware gates invented**. All findings from actual V2 backend source in `backend/src/main/kotlin/com/lesouvenir/v2/integrations/`.

---

## 10. Corrected Source-Review Notice

**User priorities applied — no architecture changes:**

1. **PRODUCTION mode DENY is intentional** — not a bug. Production requires explicit authorization (env flag + operator action). SafeTransport correctly enforces this.

2. **Neon JDBC + DDL deliberately excluded** — per user directive §6 (no direct Neon DDL from kiosk). RevenueClient HTTP-only is correct. Server-side idempotency (`ON CONFLICT`) and race safety (`FOR UPDATE`) belong in API layer, not client replication. Exact revenue predicate (`manual && adapterAccepted && sameSessionId`) tested locally with mock server later.

3. **PayOS empty checksumKey → IllegalArgumentException** — real defect. Must validate keys at construction or return `DENIED` before HMAC. HMAC wire format **UNVERIFIED vs V1 SDK** — flagged BLOCKED until sandbox proof.

4. **"Faithful port" → "Source-field-verified"** — WebAlbumClient and CloudinaryClient verified field-by-field against V1 source. No blanket claims.

5. **Stage D (local fixture tests) remains authorized** — these are code defects to fix in implementation, not hardware blockers. No new ADRs, no architecture churn.