# Printer hardware validation plan

Status: **REAL HARDWARE NOT TESTED**. Offline disabled-port/fake-boundary tests passed (see `HARDWARE_PORT_INDEPENDENT_REVIEW.md`), but they are not discovery, spooler, cut or output evidence. This remains a future plan, not authorization. No printer discovery, driver inspection, device access, spooler reset, driver setting changes or print was performed. V1 remains read-only; all synthetic fixtures, outputs and logs must live in V2-owned locations. Never record customer photos, credentials or printer secrets.

The isolated Hot Folder's synthetic stable/decode tests also do not authorize or establish a real camera producer workflow. Late-file shot ownership, restart-persistent deduplication and trusted-writer assumptions must be resolved before real mode.

## Stage 1 — offline, default dry run

After the architect contract exists, build fixture-based compositor tests without device enumeration or any submit call. Use synthetic indexed/color-grid captures and overlays, QR on/off, absolute and grid slots, portraits/landscapes, all supported size branches and both aligned and deliberately out-of-order slot indices. Compare V1-derived and V2 outputs pixel-exactly where runtime/font/image decoding permits, otherwise document tolerances and compare dimensions, placement, crop, bleed, rotation and color. Assert dimensions and offsets in `06_PRINTER_DNP_RX1HS_AUDIT.md`; compare preview to the actual generated page and explicitly document expected QR/padding differences. Test LUT/Beauty success/fallback without customer data.

Mock printer and queue interfaces: unavailable/offline, renamed/duplicate/ambiguous devices, missing/wrong media and unsupported settings, queue delay/failure, driver rejection, backend restart, duplicate taps, timeout after possible submission and partial success. No automatic retry after uncertain acceptance; reconcile first. Assert one print intent and one eligible sale per idempotency key, no sale for disabled/failed render/failed submit/unconfirmed flow, and session isolation. A simulator is not hardware verification.

## Stage 2 — separately approved read-only device discovery

With operator permission and V1 not using hardware, validate packaged host ⇄ Kotlin startup/IPC and shutdown, JVM `java.desktop`, Windows user permissions, and read-only device discovery/status. Record OS, architecture, JVM and driver versions and non-secret device identity. Confirm exact configured Windows queue names and supported capabilities with the operator. Enumeration/status proves neither paper output nor physical completion. Do not alter queue or driver settings. Identify unknowns rather than guessing an RX1HS cut option. Confirm SDK/driver redistribution and license terms before packaging.

## Stage 3 — explicit physical-print authorization required

Before each controlled run obtain user approval naming the RX1HS queue, installed media, approved existing driver preset/cut configuration, synthetic job image, copy count, expected sheet and strip consumption, and operator present. Do not change driver configuration without separate approval. State exact expected consumption in that request; abort if media/preset cannot be verified or differs. If cut handling is unknown, do not assume paired strips will be cut. No request is authorized by this document.

With approved media and operator supervision test 5×15 paired strips, 10×15 portrait, 15×10 landscape, supported counts including odd-strip policy, and repeated jobs. Measure sheet and strip dimensions, cut count/location, margins, crop, rotation, color and scaling against the synthetic reference. Record observed settings and photos only of non-customer test charts if permitted. Record submission return, any independently observed queue job/status, and separately operator-observed paper emergence; spooler acceptance or queue disappearance alone is not physical-completion proof. Validate offline/wrong-media/reconnect/queue delay only in a supervised approved protocol; never reset the spooler or alter settings unapproved. Stop on uncertainty or partial success and reconcile before retrying.

## Evidence and release gates

For each case record date, software build, driver/media/preset, fixture identifier, expected/actual consumption, test steps, results and operator confirmation, with no secrets. Maintain separate statuses: generated, application submission returned success, queue evidence (if available), and physical completion (only direct reliable evidence). Until real tests pass, RX1HS, driver-dependent 2-inch cut and physical parity remain **NOT VERIFIED**; dry-run artifacts and mock passes do not change that status.
