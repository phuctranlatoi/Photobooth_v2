# Independent parity migration review

Date: 2026-10-30. Overall gate: **FAIL / BLOCKED**.

## Final revenue-recognition increment review

- Independent V2-local-cache command `gradle.bat --no-daemon --project-dir backend --project-cache-dir backend/.gradle-project test --rerun-tasks`: **PASS-AUTOMATED**, exit 0 / BUILD SUCCESSFUL. XML aggregation: **11 suites, 39 tests, 0 failures, 0 errors, 0 skipped**. Evidence: `tests/parity-migration/logs/backend-revenue-final.log` and `backend-revenue-final-summary.txt`. Owner `test installDist` evidence is `backend/revenue-recognition-tests.log`, reported SHA256 `5A792...`; this review relies on the independently rerun test result, not an abbreviated hash as identity proof.
- `RevenueRecognition.kt:43-46` permits recording only when the frozen sale ID is nonblank and equals active, confirmation, and print session IDs, confirmation is manual, the operation is not dry-run, and print result is exactly `PrintResult.Submitted`. `Uncertain`, `Rejected`, `Denied`, stale/missing IDs, and auto-confirm are ineligible. Tests cover the predicate, all explicit negative cases, shared-journal duplicate suppression, and false/timeout/exception reconciliation with one sink call and no automatic retry.
- The three-way ID equality is a deliberate **stronger safety adaptation**, not exact V1 parity: it adds evidence requirements to prevent stale/cross-session revenue. It requires architectural/business reviewer signoff before production wiring so it does not become an undocumented hidden barrier to legitimate V1 sales.
- The shared journal reservation prevents duplicates only for callers sharing that journal instance. The supplied `InMemoryRecognitionJournal` is process-local and nondurable; restart/crash, multiple backend processes, and atomicity with remote commit remain unresolved. `false` or exception is conservatively retained as `RECONCILIATION_REQUIRED`, but no durable reconciliation queue/operator workflow/backend lock exists.
- This class is an offline injected gate only. It is **not wired to the authoritative session, printer, revenue client, IPC, or lifecycle**, and `Submitted` remains driver-call acceptance rather than physical-print proof. No production exactly-once or revenue success claim is made.
- Separate narrow designer review approved six current PNGs. Minor staff-panel horizontal scrolling was noted as nonblocking for this bounded simulator review; retain it as touch/layout polish debt, not full visual, physical-touch, or Admin parity approval.

## Current independent frontend rerun (supersedes aborted/historical claims)

### Final post-fix execution

- `cd frontend; npm test -- --reporter=dot`: **PASS-AUTOMATED**, exit 0, 5 files / 15 tests. `tests/parity-migration/logs/frontend-npm-test-final.log`.
- `cd frontend; npm run build`: **PASS-AUTOMATED**, exit 0; TypeScript and Vite completed (1994 modules). `tests/parity-migration/logs/frontend-npm-build-final.log`.
- After confirming CDP port 9223 free, `node verify-simulator.mjs`: **PASS-SIMULATED**, exit 0. The actual mounted Tauri WebView/Kotlin simulator completed 1280×800 and 1920×1200 flows: direct Welcome Start→SELECTING, setup Back bounds, payment title hold panel without automatic approval, separate mock approval, both configurable layouts, synthetic capture/selection, positive full-screen original image/dialog/close bounds, frame CTA bounds, PRINT_PENDING reload recovery, dry-run delivery/reset, five-tap Welcome operator entry and all six operator tabs. Native close returned True, host exit was 0, and observed JVM PID 39136 terminated. Log: `tests/parity-migration/logs/frontend-mounted-final.log`; fresh PNGs: `frontend/simulator-evidence/`.
- This supersedes the immediately preceding zero-height-image failure, which remains useful regression evidence but is not the final result. Designer review of these fresh PNGs is separate; automated bounds are not subjective visual signoff or physical-touch/DPI proof.

## Final independent backend execution

- V2-local cache/temp command: `gradle.bat --no-daemon --project-dir backend --project-cache-dir backend/.gradle-project test --rerun-tasks`: **PASS-AUTOMATED**, exit 0 / BUILD SUCCESSFUL. Independent XML aggregation: 10 suites, **35 tests, 0 failures, 0 errors, 0 skipped**. Logs: `tests/parity-migration/logs/backend-test-final.log` and `backend-test-final-summary.txt`.
- Source review confirms default `DENY` and intentional `PRODUCTION` denial (`SafeTransport.kt:27-37`), redirect refusal, loopback-only local HTTP, bounded 1 MiB response subscriber and deadline cancellation (`:41-55,68-85`). PayOS denial precedes signature/key use (`PayOsClient.kt:12-24`); DTOs retain money as strings (`SharedApiClients.kt:8-11`); Cloudinary validates filename/provider fields and caps caller bytes (`CloudinaryClient.kt:11-18`). The eight integration tests exercise real 127.0.0.1 transport behavior and fixture provider responses, including serializers/request DTOs, redirects, timeouts, stalled bodies and body bounds.
- This remains **client-only fixture verification**. No integration client is wired into authoritative session/IPC. PayOS uses handwritten HMAC and remains BLOCKED pending SDK/wire compatibility. There is no same-session revenue journal/idempotent print-revenue orchestration. Firebase/layout sync is absent; deployed album/API server implementation remains unavailable; production, Neon, Cloudinary and PayOS were not contacted. Direct kiosk DDL remains intentionally absent.

- `cd frontend; npm test -- --reporter=dot`: **PASS-AUTOMATED**, exit 0, 5 files / 15 tests. Log: `tests/parity-migration/logs/frontend-npm-test-current.log`.
- `cd frontend; npm run build`: **PASS-AUTOMATED**, exit 0 (`tsc --noEmit`, Vite 1994 modules). Log: `tests/parity-migration/logs/frontend-npm-build-current.log`.
- With port 9223 confirmed free, `cd frontend; node verify-simulator.mjs`: **FAIL**, exit 1 in the first 1280×800 journey. Direct Welcome Start reached `SELECTING`; setup Back and payment staff-panel bounds assertions passed, and holding the payment title only revealed the panel (the harness then closed it and separately pressed simulator approval). Capture reached selection. The new full-screen-original assertion failed because the mounted image rectangle was `x=44.8, y=715.2, width=1190.4, height=0`; therefore no 1920×1200 journey, reload/CTA completion, five-tap operator journey, or PID-close assertion was reached in this final run. Log: `tests/parity-migration/logs/frontend-mounted-current.log`; current partial PNGs are under `frontend/simulator-evidence/`. The harness-owned host was closed by its `finally` cleanup.
- This failure reproduces after the claimed CSS/modal fix and after a fresh successful build. Previous invocations and prior PNG approval do not supersede the current mounted failure. The bounded designer approval of older PNGs is not full visual signoff.

## HIGH findings

1. **Integration clients have landed but are not session-wired.** Four backend-only files now exist under `backend/src/main/kotlin/com/lesouvenir/v2/integrations/`: `SafeTransport.kt`, `PayOsClient.kt`, `SharedApiClients.kt`, and `CloudinaryClient.kt`. Their tests exercise direct client calls only; grep finds no use outside that package. This is **client implemented / fixture tested pending final run**, not payment, album, upload, or revenue integrated into the authoritative session.
2. **No session-wired real print/revenue path.** `SimulatorSessionEngine.kt:101` always reports `printAccepted=false,revenueRecorded=false`; `:173` exposes dry-run only. `LegacyPrinter.kt:21-27` correctly distinguishes Submitted/Uncertain but is standalone. An offline same-ID recognition gate and in-memory dedup tests now exist, but there is no authoritative-session wiring, durable journal, backend lock, or production reconciliation workflow.
3. **Full V1 flow parity is not established.** Existing simulator evidence is bounded. Correct source flow includes Frame EDITING and Confirm PRINT_PENDING, restricted cancellation, and timeout auto-print; see corrected owned maps.
4. **PayOS compatibility remains BLOCKED pending SDK/wire verification.** V1 delegates request construction/signing to the PayOS SDK (`PaymentService.kt:4-7,23-34`). V2 hand-builds the canonical string and HMAC (`PayOsClient.kt:12-23`). Source review confirms matching high-level fields—`orderCode`, Long amount, description, one `Le Souvenir` item, quantity 1, price, localhost cancel/return URLs—and PAID-only status semantics, but cannot verify exact SDK canonicalization, escaping, response envelope, headers, or endpoint compatibility. Do not enable production from this evidence.

## MEDIUM findings

1. `LegacyCanonPort` (`LegacyCameraPort.kt:52-78`) is reflection-only, requires explicit authorization, and has no demonstrated EDSDK disposal beyond `closeSession`; native dependency/package compatibility is unproved.
2. AWT printer is not a native-DLL printer implementation. `LegacyPrinter.kt:55-68` reports driver-call return as Submitted, explicitly not physical completion. No spooler/job observation or DNP hardware evidence exists.
3. V1 Cloudinary/album DTOs are client-observed and documented (`08_PAYMENT_REVENUE_QR_CLOUD_AUDIT.md:17-21,35-47`); deployed server schema remains unobservable. Calling the schema “false” is as unsupported as treating it as server proof.
4. **Default denial is correctly before PayOS key calculation only for create.** `PayOsClient.createPaymentLink` calls `transport.requireAllowed()` before constructing the body/signature (`:18-22`), satisfying the requested fail-before-key-use gate. `status` has no key calculation and reaches `transport.json`, whose `send` denies before fixture/network (`SafeTransport.kt:27-30`). `CloudinaryClient.uploadAsset` likewise denies before multipart construction (`:11-24`). Preserve this ordering in backend fixes.
5. **Malformed/null normalization needs explicit regression coverage.** `SafeTransport.json` normalizes JSON parse/type failures, and Cloudinary/album parsers catch generic parse/access exceptions. PayOS `data()` accesses `root.get("code")?.asString` outside a catch (`PayOsClient.kt:28-30`); Gson `JsonNull`/wrong-type behavior must be proven to normalize to `IntegrationException(MALFORMED)` rather than leak an implementation exception. The existing suite covers broken JSON but not null/wrong-type fields for every client.

## Protocol and security review of the four clients

- **Transport:** default mode is `DENY`; `PRODUCTION` is intentionally denied (`SafeTransport.kt:18,24-26`). This is a safety gate, not a regression. LOCAL_FIXTURE permits only plain HTTP loopback, rejects user-info/fragments/non-loopback, and uses `HttpClient.Redirect.NEVER` (`:20-21,32-38`). The real local-server test binds ephemeral `127.0.0.1`. No production endpoint was contacted.
- **Direct Neon/DDL:** no JDBC/Postgres/Neon/DDL strings occur in V2 backend source. Excluding V1's direct Neon route and automatic ALTER behavior is intentional and required, not missing parity.
- **Revenue:** endpoint shapes match V1 shared HTTP branch: `/api/v1/revenue/transactions`, `/{encodedSession}/adjust`, `/void`, summary and bounded recent transactions. Monetary request fields are Strings (`SharedApiClients.kt:8-11`) and the fixture checks a value beyond JavaScript safe integer range remains quoted. This client does not implement local UNIQUE journal, retries, or same-session authority.
- **Album:** create/finalize/complete paths and fields match V1 `DesktopWebAlbumClient.kt:15-64`. `accessToken` is returned to backend caller as in V1 (`SharedApiClients.kt:13,38`), but grep finds no IPC/frontend wiring. It must remain backend-only; no future snapshot may serialize it.
- **Cloudinary:** multipart field names, allowed extensions/resource endpoint, response metadata, and transform insertion match V1 `DesktopCloudinaryClient.kt:19-97`. V2 accepts bytes rather than caller-controlled file paths, reducing arbitrary filesystem exposure. Whole-file memory remains bounded only by the caller—no explicit content-size cap is present.
- **Frontend boundary:** grep of `frontend/src` finds no `fetch`, XHR, provider endpoint, authorization header, integration secret field, or album token use. Operator UI explicitly refuses payment/cloud secret entry. Current provider communication is backend-only and not IPC-exposed.
- **Logging:** these four clients contain no body, credential, token, or raw provider-response logging. `IntegrationException` exposes category/status only.

## Regression execution status

| Case | Result | Evidence |
|---|---|---|
| Existing backend regression | PASS-AUTOMATED (prior independent run; not rerun in this subtask) | `docs/PROGRESS.md:25`: exit 0, 27 tests, log `backend/build/independent-ui-review-backend-test-unmodified.log` |
| Mounted 1280×800 and 1920×1200 customer/operator | PASS-SIMULATED (prior independent run; not rerun) | `docs/PROGRESS.md:26-34`, default-denied result/log paths |
| Four-client loopback fixture suite | PASS-AUTOMATED | Final independent full backend rerun: 35 tests, including 8 integration tests, zero failures/errors/skips; `tests/parity-migration/logs/backend-test-final.log` |
| PayOS protocol compatibility | BLOCKED | handmade HMAC not verified against the V1 PayOS SDK or sandbox |
| Revenue same-ID/session idempotency | BLOCKED | client exists, but no session wiring/local journal/retry test |
| Cloudinary/Album fixture contract | PASS-AUTOMATED | Fixture/local HTTP contract exercised in final 35-test backend run; not live cloud/server proof |
| New mounted exact-parity delta | PASS-SIMULATED | Final post-fix actual mounted two-size run exit 0, reload/CTA/gesture/modal/close cleanup included; `tests/parity-migration/logs/frontend-mounted-final.log` |
| Real Canon/DNP/payment/cloud/DB | BLOCKED | no authorization; prohibited in this review |

No outward HTTP, hardware operation, production write, DDL, or secret access was performed. No V1 command/build/write occurred. Existing historical results are not relabeled as newly executed.

## Release decision

**BLOCK.** Require source-linked reviewer signoff after backend final, independent full-suite/loopback results, PayOS SDK compatibility decision, session wiring with same-ID/idempotency tests, frontend parity delta, and mounted exact-flow results at both sizes. Production remains intentionally unavailable in this client slice. Hardware, installer, and redistribution licenses remain unresolved.
