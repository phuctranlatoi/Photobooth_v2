# ADR-004: IPC Protocol — JSON-RPC 2.0 over StdIO + Named Pipes

**Date**: 2026-10-30  
**Status**: Accepted

## Context
Need typed, versioned, authenticated communication between React frontend (Tauri WebView) and Kotlin backend (sidecar).

## Decision
- **Control Plane**: JSON-RPC 2.0 over StdIO (Tauri sidecar spawn)
- **Streaming Plane**: Windows Named Pipes for Live View frames
- **Auth**: HMAC-SHA256 per message (shared secret `PHOTOBOOTH_IPC_SECRET`)
- **Versioning**: `protocolVersion` in envelope; major = breaking

## Rationale
- StdIO: Natural for sidecar, no port conflicts, Tauri-native
- Named Pipes: High-throughput, low-latency, Windows-native, backpressure via read blocking
- JSON-RPC 2.0: Widely supported, typed, batchable
- HMAC: Replay protection, integrity, no TLS complexity for local IPC

## Alternatives Considered
| Option | Rejected Reason |
|--------|-----------------|
| gRPC | Overhead; protobuf complexity for simple IPC |
| WebSocket | Port binding; firewall issues; no stdio simplicity |
| Shared Memory | Complex synchronization; crash recovery hard |
| D-Bus | Linux-only |