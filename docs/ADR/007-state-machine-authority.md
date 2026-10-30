# ADR-007: State Machine — Backend Sole Authority

**Date**: 2026-10-30  
**Status**: Accepted

## Context
V1 `SessionStateMachine` had no transition guards. Frontend could request invalid transitions.

## Decision
**Backend enforces all transitions**. Frontend only requests via `session.transition`. Backend validates against transition table, rejects invalid with `-32001`.

## Transition Table (Enforced)
```
IDLE → SELECTING
SELECTING → SELECTING_QUANTITY
SELECTING_QUANTITY → PAYMENT_PENDING
PAYMENT_PENDING → PREPARING
PREPARING → LIVE_VIEW
LIVE_VIEW → COUNTDOWN
COUNTDOWN → CAPTURING
CAPTURING → LIVE_VIEW | SELECTING_PHOTOS
SELECTING_PHOTOS → EDITING
EDITING → PRINT_PENDING
PRINT_PENDING → PRINTING
PRINTING → DELIVERY
DELIVERY → IDLE
ANY → IDLE (cancel/reset)
ANY → ADMIN (authenticated)
ANY → OUT_OF_SERVICE (hardware failure)
```

## Consequences
- Frontend becomes "dumb" renderer of backend state
- No local state duplication
- Recovery trivial: backend state = source of truth