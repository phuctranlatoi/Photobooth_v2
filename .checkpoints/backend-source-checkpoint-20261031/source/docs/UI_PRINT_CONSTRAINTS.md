# Print UI constraints — current V2 simulator

Scope: current V2 `SimulatorSessionEngine.kt`, `SimulatorCompositor.kt` and
`SIMULATOR_SESSION_RESULTS.md`; this is not evidence of physical DNP support.

## Authoritative images and geometry
- `previewDataUrl` and `printImageDataUrl` both derive from the generated **paper** image;
  `compositionDataUrl` derives from the single composition, not the paper canvas.
  They are nullable until generated and are snapshot-restorable through DELIVERY.
- Data URLs are JPEG thumbnails, longest edge at most 600 px, aspect-preserving with
  integer truncation; they are not full-resolution PNG artifacts or pixel-exact copies.
  Render contained without cropping, stretching, CSS frame overlays, or invented margins.
- Full-resolution custom-frame output is: 5x15 strip composition 1184×3580, paper
  2452×3658 with two strips; 15x10 landscape composition 3580×2368, paper 3658×2452;
  other labels use portrait composition 2368×3580, paper 2452×3658. Classification
  uses only the backend's documented label substrings. These are raster dimensions,
  not proof of physical size, DPI, driver scaling, supported media, or cutting.
- Backend center-crops photos into configured slots, applies bleed and frame, and
  positions the composition on a white paper canvas. Show its paper preview, not a
  frontend reconstruction. No QR, LUT/beauty processing or driver settings are
  implemented by this compositor; inputs must already be processed.

## Outcome and state language
- `FILE_GENERATED` means successful file-only compositor output, not submission,
  spooler acceptance or physical printing. File existence alone is not success;
  the engine publishes images only after both outputs decode. Display backend errors.
- Manual `print.confirmDryRun` completes to actual backend `DELIVERY` with
  `userConfirmed=true`, `printAccepted=false`, `revenueRecorded=false`. Inactivity
  may also reach DELIVERY with `userConfirmed=false`; never label it manual approval.
  Dry run generates files only: no printer job, physical print, or revenue.
- Use the actual snapshot state; no fabricated PRINTING phase or physical progress.
  A transient command-busy indicator may disable duplicate actions while awaiting
  response; do not represent it as a spooler or paper-progress indicator. Finish only
  from DELIVERY; return to welcome on acknowledged IDLE, not on button tap.
- Future real submitted/queue-accepted, uncertain/partial, and physically completed
  outcomes must remain distinct and only reflect authoritative evidence. Unknown
  submission requires operator reconciliation, not an automatic retry or success claim.
  Current simulator has no real submit/queue/physical evidence; never infer any.

## QR and operator controls
- QR/delivery link is unsupported in this simulator: show unavailable; never generate
  a placeholder link, QR, album, upload status, or claim delivery to a device.
- Printer settings are read-only/disabled pending authorization. No discovery,
  test print, device changes or driver actions from this UI. Simulator device status
  is not hardware discovery; its queue count is not evidence of a real empty queue.
- Real DNP behavior, cut, physical dimensions and paper handoff remain unverified;
  require separately authorized hardware validation before claiming them.
