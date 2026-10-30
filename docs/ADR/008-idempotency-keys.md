# ADR-008: Idempotency Keys for Print & Payment

**Date**: 2026-10-30  
**Status**: Accepted

## Context
Touchscreens prone to double-tap. V1 had no protection against duplicate print/payment.

## Decision
- **Print**: Client generates `idempotencyKey: UUIDv4()` per "Confirm & Print"
- **Backend**: Stores processed keys (memory LRU 1000 + persisted `data/ipc_idempotency.json`)
- **Duplicate**: Returns existing `printJobId`, `duplicate: true`
- **Payment**: `orderCode` = timestamp (unique); backend tracks pending orders

## Rationale
- Simple client-side generation
- Survives backend restart (persisted)
- No UI locking needed