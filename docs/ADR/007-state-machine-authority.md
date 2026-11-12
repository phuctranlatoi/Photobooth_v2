# ADR-007: State Machine — Backend Sole Authority

**Date**: 2026-11-12  
**Status**: Accepted

## Context
V1 `SessionStateMachine` had no internal transition guards; its controller exposed
specific user intents and directly assigned states. V2 crosses a process boundary,
so accepting an arbitrary target state would let stale/malicious UI bypass rules.

## Decision
**Backend enforces all transitions and timers.** Frontend invokes intent-specific
commands (`session.confirmSetup`, `session.setQuantity`,
`capture.startSequence`, `selection.confirm`, `frame.confirm`, `print.confirm`,
etc.); there is no renderer-visible `session.transition(target)`. Backend validates
state, generation and expected revision and returns the structured contract error.

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
SELECTING_QUANTITY → SELECTING                  (back)
PAYMENT_PENDING → SELECTING_QUANTITY            (back + cancel polling)
EDITING → SELECTING_PHOTOS                      (back)
PRINT_PENDING → EDITING                         (back)
SELECTING_PHOTOS | EDITING → IDLE               (audited cancel only)
```

`COMPOSING`, `RECOVERY`, and `OUT_OF_SERVICE` stay in the 17-value contract, but
V1 did not assign them in observed code. Activating them—or adding ANY-state
cancel/admin/out-of-service transitions—is a product/parity decision, not implied
by guard enforcement. Connection loss initially uses overlays/events.

## Consequences
- Frontend renders authoritative snapshots and retains only ephemeral view state
- No local state duplication
- Recovery requires backend snapshot plus operation journal; it is not trivial and
  never auto-replays a mutation
