# ADR-006: Live View Transport — Private Latest-Frame JPEG Pipe Candidate

**Date**: 2026-11-12  
**Status**: Proposed; Packaged Performance POC Pending

## Context
V1 requested Canon Live View at approximately 30 fps using an in-process
conflated `StateFlow`. V2 must preserve latest-value/no-backlog behavior across a
process boundary without letting preview traffic starve capture or health calls.
No IPC throughput or physical Canon timing was validated by the V1 audit.

## Decision
- Backend candidate: Canon frame → accepted preview effect → resize at most
  1280x720 → JPEG quality 75–85 → binary frame on a random per-launch/per-stream
  named pipe.
- Pipe uses current-user/session ACL plus launch nonce; it has no predictable
  session-ID-only name exposed to the webview.
- Backend and shell each retain exactly one latest complete frame. A newer frame
  replaces an unread frame; there is no five-frame queue and no per-frame control
  ACK backlog.
- Renderer allows one pending pull, receives binary bytes through the shell, uses
  an object URL/`ArrayBuffer`, and revokes the prior URL. Base64 is not used.
- Preferred delivered rate is 20–30 fps; 15 fps at 1280x720 is a conditional
  minimum requiring product acceptance. Canon acquisition may retain the audited
  ~30 fps request cadence.
- Frontend explicitly unsubscribes on screen exit, generation change,
  backgrounding or connection loss. Backend expires abandoned subscriptions.
- Reconnect obtains a fresh authoritative snapshot and new stream ID; stale bytes
  from an old generation are discarded.

## Rationale
- Private pipes avoid public-facing ports and support binary framing.
- JPEG is a simple first POC because Canon preview is naturally image-oriented
  and browser decode is mature.
- One-slot replacement mirrors V1's conflation and provides deterministic
  backpressure without ACK chatter.
- Keeping full-resolution capture off this channel protects memory and image
  authority.

## Gate and fallback

The packaged POC must sustain the accepted fps for 30 minutes with bounded
memory, responsive control p99, clean unsubscribe, crash/reconnect behavior and no
stale frames. Generated frames prove transport only; an actual supported Canon
test separately proves camera behavior.

If JPEG misses measured CPU/latency targets, run a targeted raw/shared-buffer POC
with explicit sequence/ownership and ACLs. Electron fallback may use transferable
`ArrayBuffer` while keeping the same subscription contract. Do not expose an HTTP
or WebSocket port as an unmeasured convenience.
