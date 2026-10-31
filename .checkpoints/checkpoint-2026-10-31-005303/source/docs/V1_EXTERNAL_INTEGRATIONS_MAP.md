# External integration source map — standalone client slice

Scope: `backend/src/main/kotlin/com/lesouvenir/v2/integrations`. No session/IPC wiring, production activation, server implementation or live verification is included. Default mode DENY; PRODUCTION is intentionally hard denied even if credentials are supplied. FAKE invokes only an injected fixture; LOCAL_FIXTURE permits HTTP literal 127.0.0.1 / ::1 only, never redirects.

V1 reference prefix: `src/main/kotlin/com/phuctran/photobooth/desktop/` (read-only).

| Provider | V1 source / entry | V2 callable API | Contract / boundary |
|---|---|---|---|
| PayOS | `services/PaymentService`, createPaymentLink/checkPaymentStatus | PayOsClient.createPaymentLink, status, checkPaymentStatus | POST `/v2/payment-requests`; GET `/v2/payment-requests/{orderCode}`. Header names x-client-id, x-api-key. Handwritten HMAC SDK compatibility **UNVERIFIED / BLOCKED**, not real PayOS verification. No webhook/refund/cancellation orchestration implemented. |
| Shared revenue HTTP API | `remote/DesktopRevenueClient` | RevenueClient.recordTransaction, adjustTransaction, voidTransaction, getDashboard, getRecentTransactions | `/api/v1/revenue/transactions`, `/{sessionId}/adjust`, `/{sessionId}/void`, `/summary`. Authorization header. Existing service only, no new server/database. Calling recordTransaction does NOT establish a sale is verified. |
| Direct Neon | `remote/NeonDirectRevenueClient` | None | DDL/direct connection intentionally excluded; no schema migrations permitted. |
| Cloudinary | `remote/DesktopCloudinaryClient` | CloudinaryClient.uploadAsset | POST `/v1_1/{cloudName}/{image|video}/upload`; multipart upload_preset/file. Byte input only; 32 MiB maximum before multipart allocation, lower fixture limit configurable. No customer file reads. |
| Web album | `remote/DesktopWebAlbumClient` createAlbum/finalizeAsset/completeAlbum | WebAlbumClient same names | POST `/api/v1/albums`, `/{albumId}/assets`, `/{albumId}/complete`. Authorization; server supplies albumUrl/accessToken. 7 days is DTO default, not evidence server expiry enforcement. |
| Firebase / layout sync | Broader legacy inventory dependency | NOT YET PORTED | This four-client slice does not implement Firebase/layout synchronization. Further source mapping/authorization required. |

Server repository availability: **unknown/not supplied**. Client URLs and DTOs do not prove possession of web album, revenue, Firebase or PayOS server code. No replacement backend deployed.

All clients are standalone backend APIs, not customer session commands. Integrating payment reconciliation, successful manual Confirm & Print gates, revenue idempotency, retries, delivery cancellation and restart recovery remains separate work. Existing simulator/session/hardware source is preserved. Refer to `API_PRINT_REVENUE_BOUNDARY` documentation before any future revenue wiring; driver submission is not physical print completion.

Transport errors expose classification/status only, not response bodies, keys, tokens or images. No retry is automatic. HTTP errors retain status. Timeout covers complete response completion; subscriber cancels over 1 MiB, async request cancels on deadline. No outward requests were used in this slice's tests.
