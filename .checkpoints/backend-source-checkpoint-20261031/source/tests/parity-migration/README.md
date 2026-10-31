# Parity migration independent tests

This folder is reserved for safe fixture tests. At this checkpoint no production integration client exists in V2 to exercise. Therefore PayOS, Revenue/Neon, Cloudinary, and Album fixture cases are **BLOCKED**, not falsely passed with document-only assertions.

Mandatory execution constraints when clients land:

1. Bind a loopback-only fixture server on an ephemeral port.
2. Clear proxy variables in the child test process and install a default-deny transport that rejects every host except the fixture's exact `127.0.0.1:<port>`.
3. Assert construction and disabled/default mode perform zero DNS/socket activity.
4. Use synthetic V2 payloads only; no V1 `.env`, config, photos, archives, or customer identifiers.
5. Assert no DDL tokens or migration route; no real print/camera/cloud/payment operation.
6. Cover malformed response, timeout, non-2xx, redacted errors, duplicate command, same-session revenue retry, mismatched session rejection, stale payment callback, partial album finalize, and Cloudinary retry ambiguity.
7. Distinguish `client implemented` from `session wired` in every result.

No test here may rely on a public fallback URL. Network allowlisting must happen before client connection construction, not after a request.
