# ADR-005: Local IPC Trust — Private Handles, Bootstrap Proof, and Allowlists

**Date**: 2026-11-12  
**Status**: Supersedes the HMAC-per-message proposal

## Context
The shell and Kotlin backend are one local application process tree. Control uses
inherited stdio; Live View uses a per-launch private named pipe. The renderer is a
less-trusted web surface and must not receive process capabilities or secrets.
Both native processes normally run as the same kiosk user, so a persistent HMAC
key does not create an OS security boundary against an attacker controlling that
user.

## Decision
- Do **not** add a renderer-visible or `.env`-persisted per-message HMAC key.
- Shell starts the backend with private inherited handles and provides a random
  per-launch bootstrap value through a private bootstrap channel, not command
  line, log, URL, frontend state, or persistent config.
- `system.hello` carries an opaque bootstrap proof constructed by the shell; the
  renderer cannot call or populate it directly.
- Shell exposes generated named commands/a fixed method allowlist, validates frame
  limits, and never provides a generic process/RPC/path API to the renderer.
- Live View pipe names are random per launch/stream, ACL-scoped to the current
  user/session, and consumed by the shell rather than the webview.
- Idempotency keys, revisions, generation IDs and a durable backend journal handle
  accidental/retry replay of business mutations; they are not authentication.
- Admin mutations separately require an expiring operator grant.

## Rationale
- Avoids storing another shared secret in `.env` or exposing it to JavaScript.
- Avoids ambiguous JSON canonicalization and a false claim that HMAC protects
  against same-user compromise.
- Uses Windows/process ownership and narrow capabilities at the actual boundary.
- Keeps business duplicate prevention durable across backend restart, unlike an
  in-memory nonce cache.

## Consequences

- If a future threat model runs shell/backend across users or machines, this ADR
  must be revisited with OS-authenticated IPC or mutual cryptographic identity.
- Private transport does not make renderer input trusted; schemas, bounds,
  allowlists, MediaRef scoping and backend authorization remain mandatory.
- Normative envelopes and security rules are in `docs/IPC_CONTRACTS.md`.
