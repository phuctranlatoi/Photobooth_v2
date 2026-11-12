# ADR-009: Beauty Processing — Preserve Audited Aggregate Wait and Fallback

**Date**: 2026-11-12  
**Status**: Accepted parity baseline; source/model manifest gate remains open

## Context
V1 schedules Beauty after each capture and, after all shots, waits up to 15 seconds
in aggregate before entering photo selection. Completed derivatives replace the
display/composition path; unfinished/failing jobs fall back to originals. Changing
this timing is a visible parity decision.

## Decision
- Beauty starts as bounded per-capture work after the canonical effect+mirror JPEG
  is saved.
- After the sequence, preserve the audited **15-second aggregate wait cap** before
  `SELECTING_PHOTOS`; there is no invented 15-second-per-photo/30-second batch.
- Completed manifest-approved derivatives are used; unfinished/error/cancel jobs
  expose `FALLBACK_ORIGINAL` and selection proceeds when the aggregate cap ends.
- Immutable transferred source (when retained), canonical `Photo_N.jpg`, and
  `beauty/Photo_N_beauty.png` remain distinct; Beauty never overwrites originals.
- Late results are generation-scoped and cannot mutate a newer/cancelled session.
- YuNet/BiSeNet/Beauty models, thresholds, presets and algorithm are not retuned.
  Exact accepted source/model manifest and redistribution rights must be resolved
  before copy/distribution.

## Rationale
- Wait is bounded, so photo selection never waits forever.
- Preserves the audited V1 timing/fallback rather than silently redesigning UX.
- Originals guarantee a usable selection/composition path.

Entering selection immediately may be proposed later, but requires explicit
product/parity approval and updated regression evidence.
