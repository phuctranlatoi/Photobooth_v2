# ADR-005: Authentication — HMAC-SHA256 Per Message

**Date**: 2026-10-30  
**Status**: Accepted

## Context
Local IPC must be protected against injection, replay, and spoofing. Both processes run as same user.

## Decision
Each JSON-RPC request includes:
```json
{
  "auth": {
    "hmac": "sha256(key, id+method+params+timestamp+nonce)",
    "timestamp": 1234567890,
    "nonce": "uuid-v4"
  }
}
```
- Secret: 32-byte hex, generated at install, stored in `.env`
- Timestamp window: ±5 minutes
- Nonce: Single-use (tracked in memory LRU)

## Rationale
- Stateless verification
- Replay protection via timestamp + nonce
- No certificate management
- Fast (single HMAC per message)