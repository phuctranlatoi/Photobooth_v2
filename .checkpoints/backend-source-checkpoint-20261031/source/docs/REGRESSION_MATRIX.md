# Regression Matrix — Source-Derived Gate Baseline

This is a required future-test matrix, not a record of passing implementation. Statuses reflect the current static review.

| Area / invariant | V1 evidence | Required V2 regression | Current status |
|---|---|---|---|
| Startup lifecycle | `Main.kt:33-48` | Backend startup/shutdown; config failure; Firebase failure; no leaked camera/server threads | NOT-RUN |
| State authority | `SessionStateMachine.kt:7-37` | Versioned legal-transition table; reject illegal/repeated/stale commands; backend sole authority | FAIL (V1 has no guards) |
| State rendering | `Main.kt:125-289` | Every enum/state has explicit UI, loading, error and recovery behavior | FAIL (V1 leaves some states unrendered) |
| Normal layout entry | `Main.kt:126-167` | IDLE → SELECTING → quantity with chosen layout/effect preserved | NOT-RUN |
| Special bundle entry | controller `323-335` | Special frame resolves target layout and skips to quantity exactly as V1 | NOT-RUN |
| Dynamic shot count/countdown | controller `447-461`; Admin `417-467` | Multiple layouts, nonexample values, zero/bounds decision, persistence and restart | NOT-RUN |
| Camera precedence | controller `63-68` | Native > CLI > Hot Folder > Webcam or approved corrected policy; explicit operator UI | FAIL (audit/UI mismatch) |
| Payment gate | `Main.kt:168-179`; controller `356-397` | UI cannot authorize itself; verified status; expiry/back/retry; stale poll blocked | FAIL |
| Back rules | controller `950-961` | Quantity→Selecting; Payment→Quantity and poll cancel; Editing→Photos; PrintPending→Editing; others rejected | NOT-RUN |
| Cancel rules | controller `926-948`; selection screens | Menu only Photos/Frame; reject elsewhere; cancel jobs; safe session-path cleanup | PASS-AUTOMATED (static rule only) |
| Timeout behavior | controller `245-310` | Photo/frame selection fill rules; PrintPending auto-print; explicit revenue behavior for auto-print | FAIL (audit incorrect) |
| Capture fallback | controller `507-533` | Production mode must not silently substitute a mock on camera failure; test/sim mode explicit | FAIL (V1 silently creates mock) |
| Beauty original preservation | controller `557-584` | Original untouched; bounded queue; timeout/failure fallback; session/index association | NOT-RUN |
| Selection guard | controller `672-689` | Maximum and exact count; rapid taps; missing file; order preserved | NOT-RUN |
| Frame confirmation | controller `691-715` | Empty/default frame policy and preview/final identity | NOT-RUN |
| Print copies/strip sheets | controller `762-776` | Odd/even strip quantities, zero/bounds, correct printer, no duplicate job | NOT-RUN |
| Print success semantics | `DesktopIoServices.kt:36-91` | Distinguish render, Java submission, spooler acceptance, physical completion | FAIL (physical success unavailable) |
| Revenue predicate | controller `830-852` | Record only `userConfirmed && print accepted && same session`; retries/idempotency | PASS-AUTOMATED (predicate trace only) |
| Revenue duplicate resistance | controller `717-720,842-852` | Double tap/concurrent callback/restart test with durable idempotency key | NOT-RUN |
| Upload and delivery ordering | controller `724-853` | Cloud failure/timeout; print independence; QR validity; no cross-session update | NOT-RUN |
| Session persistence | controller `901-915` | Accurate paid/completed timestamps and failure state; crash recovery | NOT-RUN |
| Admin persistence | controller `999-1029`; config `45-88` | V2 config only; no V1 path; validation; atomic write; precedence; restart behavior | FAIL (audit claimed JSON) |
| Admin tabs | `AdminScreen.kt:123-242` | Frames, layouts, settings, calculator, effects, revenue; access protection | NOT-RUN |
| Local download server | `LocalFileServer.kt:19-71` | Loopback or authenticated scoped LAN token; expiry; MIME; traversal; shutdown | FAIL |
| Canon/DNP real hardware | Hardware required | Unplug/replug/repeated capture; spooler/offline/media/cut/output comparison | BLOCKED |
| 16:10 touch UX | Target directive | 1920×1200, 1280×800; 100/125/150%; ≥48px; repeated taps; no hover dependency | NOT-RUN |

Architect and independent reviewer signoff are mandatory for changing state authority, payment verification, print/revenue semantics, camera precedence, or LAN delivery architecture.
