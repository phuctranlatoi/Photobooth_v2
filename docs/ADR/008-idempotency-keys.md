# ADR-008: Idempotency Keys for Print & Payment

**Date**: 2026-11-12  
**Status**: Accepted

## Context
Touchscreens are prone to repeated taps and transport retries. V1 had idempotent
sale/Neon inserts by session and cancelled payment polling, but no durable
spool-boundary idempotency. UI button disabling is insufficient.

## Decision
- Every mutation has unique `commandId` and stable `idempotencyKey` for one logical
  action; retries reuse the key.
- Backend checks session/generation/revision and canonical parameter hash.
- External payment/print/revenue/upload operations are journaled durably as
  `PENDING` before the side-effect boundary, then atomically store the outcome.
- Duplicate key + same parameters returns the original operation/result; same key
  + different parameters returns `IDEMPOTENCY_CONFLICT`.
- Payment creation and print keys survive process/power loss; they are not an
  in-memory LRU or shutdown-only JSON file.
- A crash across spool submission yields `OUTCOME_UNKNOWN`; never auto-resubmit.

## Rationale
- Prevents duplicates despite repeated tap, timeout, reconnect or crash.
- Preserves auditable uncertain outcomes at non-transactional external boundaries.
- Frontend still disables repeated taps for UX but is not the safety boundary.
