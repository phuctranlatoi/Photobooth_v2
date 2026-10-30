# ADR-012: Simulator Mode for Milestone 2

**Date**: 2026-10-30  
**Status**: Accepted

## Context
Hardware POC (Canon, DNP) may fail or be unavailable. Need to prove architecture without hardware.

## Decision
**Backend starts with `--simulator` flag**:
- All hardware calls return mock data
- IPC contract fully functional (health, session, capture sim, beauty sim, print sim)
- No Canon, ONNX, Print, Firebase, Neon, PayOS dependencies
- Minimal deps: `org.json`, `bcprov`, `slf4j`

## Rationale
- Unblocks architecture validation
- Frontend can develop against stable IPC
- Hardware POC runs in parallel
- Clear separation: Simulator = Milestone 2, Hardware = Gate 2