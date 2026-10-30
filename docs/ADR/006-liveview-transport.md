# ADR-006: Live View Transport — Named Pipe JPEG Streaming

**Date**: 2026-10-30  
**Status**: Accepted

## Context
Canon EDSDK Live View at ~30fps needs efficient transport to React frontend.

## Decision
- **Backend**: Canon → BufferedImage → Effect → Resize 1280×720 → JPEG q=75 → Base64 → Named Pipe
- **Pipe**: `\\.\pipe\photobooth_v2_lv_<sessionId>`
- **Frontend**: `<img src="data:image/jpeg;base64,...">` update
- **Backpressure**: Ring buffer (5 frames); frontend ACKs via StdIO `liveView.ack`
- **Reconnect**: Exponential backoff (1s, 2s, 4s, max 30s)

## Rationale
- Named pipes: Kernel-mode, no loopback TCP overhead
- JPEG Base64: Universal browser decode, ~150KB/frame
- 15fps target: Balances smoothness vs CPU
- ACK-based flow control: Simple, effective