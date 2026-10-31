# Payment, revenue, QR and cloud contract audit

Status: SOURCE INSPECTED ONLY, 2026-10-30. No network/database/cloud/payment calls or credentials/config values inspected. Citations relative to V1 `src/main/kotlin/com/phuctran/photobooth/desktop/`. This is a **client-observed contract**, not proof that deployed server matches it. No production backend/database should be created.

## Contract parity matrix

| Area | Observed source contract | Reuse / unresolved gate |
|---|---|---|
| PayOS | `services/PaymentService.kt:9-18` SDK constructed only with three nonblank configured keys | WRAP; values never copy |
| Payment creation | :20-34 CreatePaymentLinkRequest orderCode, integer amount, description, one item quantity=1, localhost cancel/return HTTPS URLs; returns qrCode | COPY request mapping; mock only |
| Payment status | :41-48 `paymentRequests().get(orderCode)` true only PAID, exception becomes false | Preserve paid gate; classify transport failure in wrapper |
| Polling | controller :356-397 creates millisecond orderCode, polls every 3000 ms, completes payment on true | ADAPT lifecycle/generation checks; no webhook evidence |
| Revenue create | `remote/DesktopRevenueClient.kt:16-39` POST `/api/v1/revenue/transactions`, Authorization=config.authHeader, JSON | Preserve existing API, verify server idempotency |
| Revenue admin | same :42-53 POST `transactions/{encodedSessionId}/adjust` actualQuantity/reason (require >=2); `/void` reason | Preserve; not PayOS refund |
| Dashboard | same :55-108 GET summary with startTime/endTime/timeZone; GET transactions with bounded limit 1..100 | Main-PC read behavior must be verified against server |
| Album create | `remote/DesktopWebAlbumClient.kt:15-35` POST `/api/v1/albums`, externalSessionId, expectedAssets, expiresInDays; response albumId, accessToken, albumUrl, status, expiresAt | Preserve returned URL, keep token private |
| Album assets | same :38-58 POST `/api/v1/albums/{encodedAlbumId}/assets` | Preserve metadata contract below |
| Album completion | same :61-64 POST `/api/v1/albums/{encodedAlbumId}/complete` empty body | Verify server partial-upload semantics |
| Cloudinary | `remote/DesktopCloudinaryClient.kt:19-58` unsigned multipart POST `https://api.cloudinary.com/v1_1/{cloudName}/{image|video}/upload`, upload_preset and file | WRAP isolated test preset only; no uploads run |

Revenue body fields (`DesktopRevenueClient:30-37`): externalSessionId, layoutId, layoutTitle, printSize, quantity, includedQuantity, extraQuantity, basePrice, extraUnitPrice, extraAmount, totalAmount, paymentMethod, createdAt. Money is **decimal strings**, read using Long, never Double (:13,34-36,110). Recent response maps sessionId, boothId, layout metadata/prices/status and optional originalQuantity/originalTotalAmount/adjustReason/adjustedAt (:93-107). Auth values and deployment URL deliberately omitted.

## Recognition, durable identity and actual DB divergence

Revenue only follows manual confirmation AND print adapter Result success AND matching active session ID (`controller/DesktopBoothController.kt:842-848`). Print dry-run is not accepted (:777-781); physical paper completion is not observed. Timeout auto-print explicitly passes userConfirmed=false (:291-310). Payment alone is not revenue.

`data/SalesRepository.kt:21,49-57` local UNIQUE session_id / INSERT OR IGNORE prevents duplicate local rows. `syncPendingSales` serializes pending rows, record-before-adjust/void, stops on failed sync and conditionally marks synced (:110-126). End-to-end exactly-once API behavior cannot be inferred from HTTP 2xx; deployed API uniqueness/ack semantics need server evidence.

**Important conflict with target shared-API-only policy:** `DesktopRevenueClient.kt:29,44,50,60-91` prefers direct Neon client when database URL configured. `remote/NeonDirectRevenueClient.kt:61-80` performs ALTER TABLE additions on record then INSERT revenue_transactions ON CONFLICT(external_session_id) DO NOTHING; duplicate success checks booth_id (:90-92). Do NOT blindly copy automatic migration into V2. Architect/owner must decide approved existing API route and reconcile direct-versus-shared mode. No current configured mode was inspected. This audit proves source has both modes, not which is live. Source SQL implies uniqueness but deployed constraint was not queried. No separate V2 production schema/backend.

## Missing payment semantics, concurrency risks

Observed service implements create and PAID query only. Expiry, remote cancel, refund, webhook verification and bounded poll deadline are **NOT FOUND in inspected PaymentService/controller path**, not assumed supported. goBack from payment cancels local polling only (controller :950-957). Cash `completePayment` has no state guard (:388-397). Async create can publish QR/start poll after navigation because launch is not stored as pollingJob until response (:370-374). Millisecond order codes are separate from UUID session IDs, with no durable order/session reconciliation demonstrated. Required V2 safety wrappers need approval; do not invent remote refund/cancel endpoints.

## Album, asset and QR semantics

Controller precreates album with externalSessionId, expectedAssets=selected count+2 and configured expiry (:724-739), renders with returned albumUrl (:745-750), prints concurrently with photo uploads (:758-804). Upload actually receives **all captured moments**, not only selected (:797-801); this can disagree with expectedAssets. Default seven-day configuration was not inspected; only forwarding of configured expiry is proven.

`services/DesktopAlbumUploader.kt:42-84` converts moments/current photo paths and master to JPEG and uploads concurrently, kind ORIGINAL for all capture paths, FINAL for master. A Beauty-replaced path can therefore be labeled ORIGINAL. Existing JPEG conversion returns JPEG source unchanged (`DesktopImageProcessor.kt:140-158`). Assets finalize **sequentially** to avoid backend races (:95-101). Album may be created after upload if precreation failed (:89-93). Uploader synthesizes `/album/{sessionId}` (:103), but controller QR prioritizes the **returned preAlbum.albumUrl**, otherwise optional local `/download/{filename}` URL (:806-819); synthesized album fallback is not used there. Local sharing privacy/network constraints require architect review.

Finalize fields (`DesktopWebAlbumClient:43-54`): kind, position, assetId, publicId, version, format, resourceType, deliveryType, width, height, bytes. Cloudinary accepts jpg/jpeg/png/mp4, selects video endpoint for mp4, reads whole file into multipart memory (:26-45); sessionId parameter is not used to set folder/public_id, so session association is through album metadata, not deterministic Cloudinary naming. Successful URL adds f_auto,q_auto (plus vc_h264 for video) when matching /upload/v (:61-70). Retries can create duplicate Cloudinary assets; no deterministic upload idempotency key shown.

Composite video uploads with kind GIF even for video resource (`DesktopAlbumUploader.kt:120-137`), then completion called after video attempt (controller :882-899). Do not normalize this field without server compatibility decision. Session store persists completion asynchronously (:901-915), not a proven durable financial journal/restart recovery.

## Error/security and tests

Revenue HTTP connect timeout 5 s/request 10 s, failures/non-2xx collapse to null (`DesktopRevenueClient:14-25`). Album/Cloudinary clients have no explicit request/connect deadline in inspected builders. Album errors include up to 320 chars of response body (:89-94); Cloudinary prints full failed body (:55-58); payment prints exception (:35-37). V2 must redact tokens, credentials, filenames/client images and raw bodies. Distinguish offline, timeout, HTTP rejection, malformed response and retryable failure in wrappers; do not pretend current clients already classify them.

Minimal slice after architecture: reuse request/response field mappings, Long pricing and local session-keyed journal; inject mock-default HTTP/payment/upload/print adapters; no live credentials. Required NOT RUN tests: unpaid/error/poll cancellation; stale QR callback; duplicate same-session create/revenue; print failure/render-only/timeout auto-print no revenue; server ack lost then retry; restart after OS enqueue; malformed money; upload timeout/partial finalize; expiry forwarding; mismatched expected asset count; video failure/completion; no secret/body logs. Deployed API, two-PC behavior, actual seven-day enforcement, physical print and live integrations remain NOT TESTED.
