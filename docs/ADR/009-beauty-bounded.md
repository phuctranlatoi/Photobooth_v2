# ADR-009: Beauty Processing — Bounded Async + Fallback

**Date**: 2026-10-30  
**Status**: Accepted

## Context
V1 Beauty runs after capture with 15s timeout, but photo selection screen waits. Need non-blocking UX.

## Decision
- **Capture → SELECTING_PHOTOS immediately** (originals available)
- **Beauty runs in background** (coroutine, 15s/photo timeout, 30s batch)
- **If beauty completes before confirm**: Swap `photoPath` to beauty version
- **If confirm before beauty**: Use originals; beauty continues for album
- **Fallback**: Timeout/error/cancel → return original unchanged
- **Originals always preserved**: `originals/Photo_N.jpg` never overwritten

## Rationale
- UX never blocked by Beauty
- Preserves V1 algorithm/presets exactly
- Album gets beauty version if ready