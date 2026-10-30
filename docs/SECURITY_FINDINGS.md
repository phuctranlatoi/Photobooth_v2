# Security Findings — Initial V1 Audit Review

No secrets were read. No network or production operation was performed.

## CRITICAL

### SEC-01 — Customer flow can advance through payment without an observed verification guard

**Evidence:** `Main.kt:168-179` exposes `onPaid = { controller.completePayment() }`; `DesktopBoothController.kt:388-397` transitions without checking a payment receipt/status. Polling verification exists at `374-380`, but it is not enforced inside the transition method.

**Reproduction (static):** Follow `PaymentScreen.onPaid` callback to `completePayment`; observe absence of payment state/token validation.

**Impact:** Depending on `PaymentScreen` behavior, unpaid sessions may proceed. The current audit incorrectly says “if paid,” masking the risk.

**Mitigation:** Backend-only payment authorization using a verified, signed provider result bound to amount/order/session; make UI callback a status refresh/request, not authority. Reject replay/stale orders. Fully audit `PaymentScreen` and `PaymentService` before design approval.

**Regression:** Attempt manual UI completion, forged/stale callback, wrong amount/order, duplicate callback, expiry and back-navigation; none may enter PREPARING without verified backend state.

## HIGH

### SEC-02 — Unauthenticated file server binds every network interface

**Evidence:** `LocalFileServer.kt:25-27` binds `0.0.0.0`; `/download/<filename>` has no authentication (`27-67`). It serves any existing named file from the shared output directory. Server defaults enabled (`DesktopBoothConfig.kt:22-23`).

**Impact:** Any LAN peer that learns/guesses a filename can download customer output. There is no session scope, token, expiry, rate limit, or access log policy. This conflicts with the target rule that local bridges be restricted/authenticated.

**Mitigation:** Prefer loopback for control IPC. If LAN delivery is required, use unguessable session-scoped signed tokens, expiry, strict allowlist, privacy-safe logs, and explicit operator configuration. Stop server on shutdown; V1 controller `close()` does not visibly call `localServer.stop()` (`DesktopBoothController.kt:989-995`).

**Regression:** Remote unauthenticated request denied; expired/wrong-session token denied; only authorized final asset served; server stops on app exit.

### SEC-03 — Session state mutations are globally unguarded

**Evidence:** `SessionStateMachine.transitionTo` assigns any enum directly (`SessionStateMachine.kt:27-37`); controller exposes `transitionTo` publicly (`DesktopBoothController.kt:222-243`).

**Impact:** Stale callbacks, repeated taps, or a future IPC caller can force illegal transitions. This increases double print/payment and cross-session risks.

**Mitigation:** Typed/versioned commands authenticated to the desktop host; backend legal-transition guards; session/revision correlation; idempotency/once tokens for side effects; reviewer-approved architecture.

**Regression:** Exhaustive illegal-transition and stale-session command tests; concurrent print commands produce one durable job.

## MEDIUM

### SEC-04 — Sensitive configuration is persisted in `.env` through a broad settings writer path

**Evidence:** Device settings select `config.envSource` or working-directory `.env`, then call `SettingsManager.updateSettings` (`DesktopBoothController.kt:999-1018`). Loader merges working `.env`, app `.env`, and process environment (`DesktopBoothConfig.kt:45-88`). The audit falsely described JSON persistence.

**Impact:** Incorrect path/ACL/atomicity could expose or corrupt a file that also contains credentials. Environment precedence may make UI changes appear applied while process environment overrides them.

**Mitigation:** V2 must separate nonsecret operator settings from secrets, use OS-appropriate protected secret storage, V2-only paths, restrictive ACLs, atomic writes, redacted logs, and explicit precedence. Never copy V1 `.env`.

**Regression:** Permissions, crash-safe write, redaction, environment override, symlink/path isolation, and V1/V2 coexistence tests.

### SEC-05 — Camera capture failure silently creates a mock customer image

**Evidence:** A null capture falls back to generated `MOCK` JPEG (`DesktopBoothController.kt:507-533`) without an explicit simulation-mode gate.

**Impact:** Operational integrity failure can be hidden, allowing bogus output, uploads, prints, or revenue flow instead of safe recovery.

**Mitigation:** Production mode must fail closed into a recoverable camera error; simulation must be explicit, visually marked, build/config gated, and unable to perform production side effects.

**Regression:** Camera timeout/disconnect in production never yields generated media and never reaches print/revenue.

## LOW

### SEC-06 — Console error logging needs redaction review

**Evidence:** Initialization, FFmpeg, sale sync and upload-related failures print messages/stack traces (for example controller `196-211,646-653,850,876-878`). No secret exposure was observed in this focused read, but downstream exception content was not audited.

**Mitigation:** Structured redacted logging; prohibit credentials, signed URLs, customer paths and provider bodies; bounded retention and access controls.

**Regression:** Inject credential-like values into adapter errors and assert logs redact them.

## Unresolved security/license gates

- PayOS signature/checksum and webhook/poll semantics: not yet traced.
- Neon/remote revenue authentication and idempotency: not yet traced.
- Cloudinary upload exposure and album authorization: not yet traced.
- Canon SDK and ONNX redistribution rights: unresolved; commercial packaging remains blocked pending written verification.
- No dependency scan or runtime penetration test was run.
- The V2-local Gradle ZIP hash `BD71102213493060956EC229D946BEEE57158DBD89D0E62B91BCA0FA2C5F3531` was independently compared with the checksum retrieved from Gradle's HTTPS distribution checksum endpoint and matched exactly. This closes the specific archive-checksum gap, not transitive dependency provenance or signature policy.
- The health slice uses private inherited stdio and exposes only `health.check`, which is safer than a listening unauthenticated bridge. However, it does not implement the HMAC/named-pipe envelope described in `V2_ARCHITECTURE.md`; architect/reviewer must ratify the actual contract before adding side-effecting commands.
