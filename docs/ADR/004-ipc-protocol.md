# ADR-004: IPC Protocol — Framed JSON-RPC Control plus Private Binary Live View

**Date**: 2026-11-12  
**Status**: Proposed Baseline; Performance Gate Pending

## Context
Need typed, versioned communication between an untrusted renderer surface, a
narrow shell adapter, and the Kotlin authority without opening a sidecar port.
Control messages and high-rate preview frames have different flow-control needs.

## Decision
- **Renderer → shell:** generated typed Tauri commands or an equivalent Electron
  preload allowlist; no generic arbitrary RPC forwarder.
- **Shell ↔ Kotlin control:** JSON-RPC 2.0 over inherited stdio, framed with a
  4-byte big-endian UTF-8 payload length, maximum 1 MiB.
- **Backend events:** JSON-RPC notifications on the same framed output through one
  serialized writer. `stderr` is diagnostics only.
- **Streaming plane:** per-launch/per-stream private Windows named pipe carrying
  bounded binary JPEG frames; shell holds a latest-frame slot.
- **Schema/versioning:** JSON Schema 2020-12 is canonical; generated TypeScript and
  Kotlin plus golden fixtures; SemVer contract negotiation at `system.hello`.
- **Bootstrap:** inherited handles, current-user/session pipe ACL, random
  per-launch nonce/proof and strict method/path limits. Do not persist or expose a
  frontend IPC secret.

## Rationale
- Inherited stdio has no listener/firewall/port collision and ties lifecycle to
  the supervised child.
- Explicit length framing tolerates fragmented/coalesced stream reads; line-based
  JSON does not.
- JSON-RPC gives request IDs and stable errors while schemas provide actual type
  validation (JSON-RPC itself is not typed).
- A separate binary plane prevents base64/control-frame amplification and permits
  latest-frame dropping without delaying health/capture commands.
- HMAC on every private stdio message was rejected: it adds key handling and
  canonicalization risk without protecting against a same-user process that can
  already control the parent/session. Renderer allowlists, ACLs, bootstrap proof,
  process ownership and validation address the relevant boundary.

## Alternatives Considered
| Option | Rejected Reason |
|--------|-----------------|
| Tauri commands for all business logic | Couples Kotlin authority to Rust and duplicates business rules |
| gRPC/HTTP/WebSocket listener | Adds local port/listener lifecycle and attack surface |
| Newline-delimited JSON | Unsafe under arbitrary diagnostics/newlines and lacks bounded binary framing |
| Base64 Live View in JSON | CPU/memory expansion and control starvation risk |
| Shared memory first | More lifetime/ACL/synchronization complexity before measurements justify it |
| Electron-only Node IPC | Locks contract to fallback host unnecessarily |

## Consequences

- Shell must implement strict framing, one writer, limits and an allowlist.
- Backend snapshots/operation journal are recovery truth because events can be
  lost on process death.
- Live View POC must meet latency/fps/memory criteria. If compressed binary frames
  fail, shared buffers are a targeted follow-up, not an architecture rewrite.
- Normative message definitions and error codes live in
  `docs/IPC_CONTRACTS.md`.
