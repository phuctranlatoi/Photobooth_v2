# V1 → V2 API / field parity matrix

Implementation status: **CLIENT IMPLEMENTED / LOCAL MOCK VERIFIED**, not production ready, not session wired. Source files are listed in V1_EXTERNAL_INTEGRATIONS_MAP.md.

| Operation | Request fields copied from client contract | Response handling / limits |
|---|---|---|
| PayOS create | orderCode, amount, description, items[name,quantity,price], cancelUrl, returnUrl, signature | strict string code=`00`, object data, strict string qrCode; non-00 string code is HTTP-class failure. HMAC canonicalization is **SDK UNVERIFIED / BLOCKED**. |
| PayOS status | orderCode path | strict string data.status; only PAID returns true; PENDING false. Invalid/null/array/numeric/bool envelope fields → MALFORMED. |
| Revenue record | externalSessionId, layoutId, layoutTitle, printSize, quantity, includedQuantity, extraQuantity, basePrice, extraUnitPrice, extraAmount, totalAmount, paymentMethod, createdAt | HTTP success / object JSON; monetary strings retained without floating point conversion. No claim server uniqueness or financial reconciliation. |
| Revenue adjust / void | actualQuantity, reason / reason; encoded session path | adjust minimum 2 retained; no automatic retry. Server transactional guarantees unavailable. |
| Revenue reads | startTime, endTime, timeZone / limit | summary / transaction JSON; limit clamped 1..100. |
| Album create | externalSessionId, expectedAssets, expiresInDays | albumId, albumUrl required strings; accessToken/status/expiresAt optional strings. Wrong types → MALFORMED. |
| Album finalize | kind, position, assetId, publicId, version, format, resourceType, deliveryType, width, height, bytes | 2xx Boolean; encoded album ID. |
| Album complete | empty body | 2xx Boolean; no claim deployed album readiness. |
| Cloud upload | multipart upload_preset, file; jpg/jpeg/png/mp4 | secure_url plus asset/public IDs, version, format/resource/type/dimensions/bytes mapped into finalize DTO; V1 transform insertion f_auto,q_auto and video vc_h264 retained. |

Safety deviations are intentional: V1 redirect behavior not reused; all redirects NEVER. Production and default mode DENIED before PayOS signing/key processing. Signature method also gated. Local fixtures accept literal loopback HTTP only, not localhost DNS or numeric alternate forms. Cloud input capped 32 MiB; responses capped 1 MiB and complete-body deadline enforced.

Excluded/BLOCKED: Neon direct DDL; PayOS SDK equivalence and live integration; Firebase/layout sync; server repository availability; refunds/webhooks/expiry orchestration; session-to-client wiring and financial idempotency in shared server. No database uniqueness/ON CONFLICT/FOR UPDATE guarantees can be inferred from client mocks.
