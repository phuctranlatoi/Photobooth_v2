# Regression Matrix — Source-Derived Gate Baseline

## CSS softening polish delta — 2026-11-12 (post-checkpoint 7ca40ac)

Case-by-case status for the CSS-only changes after `7ca40ac02d90e020fe721208e3c1b94eef00a037` (the 5 uncommitted
working-tree CSS files). "AUTOMATED TESTED" = proven by a deterministic local test/build run; "VISUAL NOT
VERIFIED" = source/diff-confirmed but not independently rendered or physically measured.

| Case | Result | Evidence / boundary |
|---|---|---|
| Scope containment (5 CSS files only) | PASS-AUTOMATED (inspection) | `git status --short` shows exactly `theme-tokens.css`, `atelier-core.css`, `atelier-customer.css`, `atelier-operator.css`, `screens/payment.css` modified; checkpoint 7ca40ac is the parent, no commits since. |
| No camera/countdown/shutter geometry impact | PASS-AUTOMATED (diff) | `git diff` grep: no rule touching `.v1-camera`, `.v1-countdown`, `.v1-shutter` or their containers modified; `:not(.v1-camera)` scoping intact. New `.v1-timer` rule only inside the reduced-transparency media block. |
| No QR/payment layout-shift impact | PASS-AUTOMATED (diff) | `.v1-payment-qr-slot` / `.v1-payment-columns` clamp geometry unchanged; only chip/keypad/pill glass tones changed in `payment.css`. |
| No business/IPC/state-machine impact | PASS-AUTOMATED (diff + suite) | No `.tsx`/`.ts` backend, IPC, pricing, or revenue file changed; 85/85 Vitest suite green. |
| Accessible reduced-transparency fallback | PASS-AUTOMATED (source) / VISUAL NOT VERIFIED | New `@media (prefers-reduced-transparency: reduce)` blocks in core/customer/operator/payment CSS; source-verified, not rendered. |
| Accessible forced-colors fallback | PASS-AUTOMATED (source) / VISUAL NOT VERIFIED | `@media (forced-colors: active)` in `atelier-core.css` (extended) and `atelier-customer.css`; source-verified, not rendered. |
| Vitest regression (85/85, 11 files) | PASS-AUTOMATED | `npm test` exit 0, Vitest 4.0.9, 85 passed in 6.29 s (+24 over the 61/61 of Phase 12; growth not CSS-scoped). |
| Production build (2,016 modules) | PASS-AUTOMATED | `npm run build` exit 0, CSS 122.31 kB / JS 423.47 kB. |
| CSS-specific automated test | NOT-RUN / MISSING | No assertion on new tokens, reduced-transparency, or forced-colors blocks; validated by non-interference only. |
| Jest scaffold (1/1) | PASS-AUTOMATED (bounded, pre-existing) | `basic-scaffold.jest.tsx` + `jest.config.js` introduced in checkpoint 7ca40ac, not CSS-scoped; no npm `jest` script. |
| Softened appearance at 1280×800 / 1920×1200, OS scaling | VISUAL NOT VERIFIED | No independent rendered-viewport, screenshot, or CDP measurement in this review. |
| Journey runner screenshots | NOT RUN | Live Tauri/WebView + real-mode PayOS QR display + process spawn/kill + sqlite3 query — not a pure offline/mock run, not executed here. |
| Physical Canon / DNP / live PayOS-Neon-Cloudinary / Mini-PC / installer | BLOCKED / NOT-RUN | No hardware, provider, or packaging run authorized in this review. |

---

## Verification delta — 2026-11-08

| Case | Result | Evidence / boundary |
|---|---|---|
| Backend unit/integration suite | PASS-AUTOMATED | 90 total: 88 passed, 0 failed, 2 skipped; Gradle test task was UP-TO-DATE. |
| Frontend unit/component suite | PASS-AUTOMATED | 9 files, 70/70 tests passed. |
| TypeScript/Vite production build | PASS-AUTOMATED | Build exit 0; 2,010 modules transformed. |
| DEMO end-to-end journey, two 16:10 viewports | PASS-SIMULATED | Full simulated journey and composed/delivery screens; CDP evidence only. |
| REAL journey | PASS-SIMULATED | Payment screen and real VietQR display only; no settlement or post-payment journey. |
| Session/output creation | PASS-SIMULATED | 4 UUID session folders; 2 output `master_*.jpg` files, 97,609 bytes each. |
| Canon/DNP/physical touchscreen/Mini-PC | BLOCKED | No authorization/safe hardware setup; no CPU/GPU/memory or live-view/countdown impact measurement. |
| Print comparison to V1 | NOT-RUN | No physical paper output was permitted. |
| PayOS settlement, Neon write, Cloudinary upload | BLOCKED | Production side effects prohibited; not attempted. |
| Installer, clean install, crash/power recovery | NOT-RUN | Outside this verification run. |


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
