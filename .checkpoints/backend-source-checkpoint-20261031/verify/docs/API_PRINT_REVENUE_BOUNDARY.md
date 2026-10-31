# Print-to-revenue boundary (source-only consult)

Scope: future backend-injected recognition contract and tests, not production wiring.
No physical print is authorized. Standalone integration clients are not recognition.

## V1 evidence and meaning
- `DesktopBoothController.startPrinting(userConfirmed: Boolean = true)` starts the flow;
  the automatic path explicitly calls `startPrinting(userConfirmed = false)` (lines 310, 717).
- `DesktopBoothController` lines 741–790 renders via `compositor.renderFinal`, then
  sets `accepted = true` only in `printerService.printImage(...).onSuccess`; missing
  print image or disabled `enableSystemPrint` leaves it false. This is a Kotlin
  `Result` success, not proof of a completed physical print.
- Lines 830–850 construct `SaleTransaction` from session and pricing, then gate
  `salesRepository.recordSale(sale)` on the exact conjunction
  `userConfirmed && printJob.await() && currentSessionId == sessionId`; successful
  local recording launches `syncPendingSales`. Preserve all three conditions.
- V1's success is a submission-call result, not an independently verified spooler
  queue entry or physical paper completion. Do not relabel it as either.

## Current V2 boundary
- `printing/legacy/LegacyPrinter.kt`: `LegacyPrinter.submit` defaults to denying
  authorization; `PrintResult.Denied` and `Rejected` are not acceptance.
  `PrintResult.Submitted` means the driver call returned, explicitly **not**
  confirmed queueing or physical output; `Uncertain` means submission may have
  occurred, requiring manual reconciliation, never automatic retry or revenue.
- `integrations/SharedApiClients.kt`: `RevenueClient.recordTransaction` is a
  directly callable HTTP client method returning true after its request; it does
  not establish manual confirmation, print acceptance, session continuity, ledger
  persistence, idempotency, or verified recognition. Its existence is not wiring.
- Simulator evidence `SimulatorSessionTest` reports `dryrun accepted=false
  revenue=false`. Preview/render/dry-run success must never become acceptance.

## Proposed future injected input (not an existing API)
Have the backend session owner inject an immutable `RevenueRecognition` input:
the sale and frozen pricing snapshot; nonblank originating session ID and current
session ID; backend-observed explicit manual confirmation for that session; and
the matching print attempt's typed mode and result, bound to the same session and
attempt/idempotency key. Client-supplied booleans are not authority. Evaluate
atomically against current session state, with duplicate recognition prevented by
a durable per-session key. The owner must define persistence and synchronization;
do not invoke `RevenueClient.recordTransaction` directly as the decision gate.

Only a real, explicitly authorized attempt with manual confirmation, matching
session IDs and matching attempt, and `PrintResult.Submitted` can satisfy the
V1-equivalent submission-success predicate. This deliberately preserves V1's
threshold, not a physical-completion guarantee. Dry run (`accepted=false`),
`Denied`, `Rejected`, `Uncertain`, missing/stale/mismatched evidence and errors
fail closed. An uncertain outcome needs operator reconciliation; do not assume
failure, resubmit, or recognize automatically. A queue observation alone must not
be represented as physical delivery, and neither queueing nor delivery is currently
established by `Submitted`. Any stricter completion policy requires separate approval.

## Required tests before wiring
- Inject fake printer and fake ledger/client: only matching manual + real Submitted
  records once; auto confirmation, disabled print, dry run, render-only, denied,
  rejected, uncertain and exceptions record zero.
- Session replaced before result, mismatched sale/attempt/session, missing evidence,
  and stale confirmation record zero; race session change against evaluation.
- Duplicate taps/results and retry after ledger/network ambiguity cannot duplicate
  recognition; reconcile unknown outcomes rather than automatically reprinting.
- Check frozen sale/pricing and session identity reach ledger unchanged; ledger
  failure and sync failure stay distinguishable from printer and physical outcomes.
- Assert Submitted, simulated queue status and client HTTP success are never
  asserted as physical completion; no real device or live revenue writes in tests.
