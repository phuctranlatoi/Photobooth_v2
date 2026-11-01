# Real engine implementation status (2026-11-01)

## Verified locally

- SQLite `data/sales.db` uses V2 workspace only, WAL, 5-second busy timeout, unique session IDs, pending/synced records. Unit test covers reopening and duplicate insert.
- `--simulator` and `--real` are separate CLI selections; unknown arguments exit with code 2.
- Real engine reports hardware status, rejects unauthenticated mock payment, and never substitutes synthetic capture or a dry-run print for physical submission.
- Offline automated Gradle run: **55 tests, 0 failures, 0 errors, 0 skipped** (53 pre-existing, 2 added). Mock hardware and network only; no live prints/payments or API writes.

## Blocking gaps — do not deploy real mode

- Real timed capture, asynchronous bounded beauty/LUT pipeline, frame selection, album creation/QR composition, and delivery are **not implemented**. Capture deliberately returns a state violation instead of synthetic success; `PRINT_PENDING` cannot be reached through the current real IPC flow.
- `PayOsClient` has no checkout URL response and has not been live-tested; production factory deliberately omits gateway credentials. Real `payment.createLink` fails closed without a configured client.
- Remote revenue sync and cloud album upload are not enabled. Ledger records remain `PENDING` until an authorized, reconciled sync worker is implemented. No automatic schema migration or new production backend is created.
- Printer `Uncertain` after spool submission, process crashes between spool acceptance and SQLite commit, and cross-process spooler reconciliation require a durable print-intent design before release. Such events must be reconciled by staff, never automatically retried as a second print.
- Real mode has no verified physical Canon/DNP support. No hardware was exercised by these tests.

## Contract parity / mock evidence

| Contract | Implementation | Evidence |
|---|---|---|
| V1 sales columns and unique session | Implemented in V2 SQLite | Offline reopen/duplicate/schema test |
| V1 sales adjustment/void/sync semantics | Not yet implemented | No claim |
| PayOS QR/status | Adapter invoked only if injected; production not configured | No live evidence |
| Print submission → local revenue | Guard implemented; only `Submitted` writes | Real end-to-end path unavailable; needs injected spooler tests |
| Neon REST, Cloudinary/WebAlbum | Interfaces available but not wired in real workflow | No live evidence |
| Camera and printer diagnostics | Camera connection and printer discovery checked | Offline fake camera test |

V1 was inspected read-only; no V1 builds or writes were performed.
