# V1 action behavior matrix — corrected source authority

Status: SOURCE VERIFIED from read-only V1 `Main.kt` and `controller/DesktopBoothController.kt`; V2 mapping is independently inspected as of 2026-10-30.

| Action | V1 guard / side effect / destination | V2 migration distinction | Gate |
|---|---|---|---|
| Start | IDLE UI directly transitions SELECTING | simulator command exists; not exhaustive V1 UI proof | TESTED-SIMULATED previously |
| Special bundle | target layout must exist; fixes layout/frame; clears session selections; quantity | not established in current backend | BLOCKED |
| Confirm setup | freezes default quantity-2 price; quantity | simulator analogous path only | PARTIAL |
| Quantity continue | sanitize by print size, freeze price, PAYMENT_PENDING, optionally create PayOS QR | simulator mock payment only; no PayOS client | BLOCKED integration |
| Payment Back | cancel polling job; quantity | late QR-create race remains a V1 risk; must test generation/session guard in port | BLOCKED |
| Complete payment | no state guard in V1 method; PREPARING; live view; 1600 ms; LIVE_VIEW | simulator mock completion is not payment verification | PARTIAL |
| Start capture | ignore while capture job active; establish UUID session; configured loop | simulator synthetic images only | PASS-SIMULATED previously |
| End one capture | CAPTURING→LIVE_VIEW and continue loop; final shot→SELECTING_PHOTOS | reject claim that capture auto-enters SELECTING after each shot | SOURCE VERIFIED |
| Toggle photo | only non-null path, max `selectCount` | analogous simulator rule | PASS-SIMULATED previously |
| Confirm photos | exactly `selectCount`; refresh frames; **EDITING** | any direct PRINT_PENDING transition is a defect | SOURCE VERIFIED |
| Choose/confirm frame | available frame only; confirm summary; PRINT_PENDING | simulator additionally requires composition; safe divergence must be documented | PARTIAL |
| Back | quantity→setup; payment→quantity; EDITING→photos; PRINT_PENDING→EDITING; otherwise no-op. Studio root Back is direct IDLE wiring | no retake route from photo Back | SOURCE VERIFIED |
| Cancel | only SELECTING_PHOTOS or EDITING; reset and bounded session-dir cleanup | no cancel-any-screen | SOURCE VERIFIED |
| Inactivity expiry | fill missing selections, choose first frame if empty, `startPrinting(false)` | auto-flow must never record revenue | V2 parity NOT ESTABLISHED |
| Manual Confirm & Print | `startPrinting(true)`; album precreate; render; print/upload parallel | current V2 command is dry-run only | BLOCKED real path |
| Printer success | V1 Boolean/result success means Java print call returned | V2 `Submitted` is explicitly not queue/physical proof; current adapter not session-wired | PARTIAL client only |
| Revenue | only manual + accepted print task + `currentSessionId == captured sessionId`; local UNIQUE/INSERT OR IGNORE then sync | same-ID and retry/idempotency tests absent because client/journal absent | BLOCKED |
| Finish | cancel delivery coroutine, clear session, IDLE | simulator covered previously | PASS-SIMULATED previously |
| Admin exit | reset session; Admin UI saves settings draft on exit | local simulator operator subset only; no production ACL | BLOCKED full parity |

## Integration truth table

| Capability | Current V2 truth |
|---|---|
| PayOS | **not implemented** in backend source; simulator fake is not a client |
| Revenue API / Neon | **not implemented**; no same-ID journal or HTTP fixture target available |
| Cloudinary / album API | **not implemented**; schemas therefore cannot be called “unobservable false”—the V1 client-observed schemas are documented in `08_PAYMENT_REVENUE_QR_CLOUD_AUDIT.md`, while server behavior remains unobservable |
| Canon | partial reflection port, default-denied; no native dependency/DLL packaged and no session wiring |
| Printer | AWT adapter implemented with default-deny and typed `Submitted/Uncertain`; no native DLL is evidenced or required by this source path, and no session wiring/hardware proof exists |

The earlier auditor output is **unreliable and non-definitive** wherever it contradicts this matrix. A URL/client DTO proves only a client-observed contract, never deployed server schema or behavior.
