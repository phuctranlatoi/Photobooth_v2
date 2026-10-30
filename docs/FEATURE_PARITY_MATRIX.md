# Authoritative consolidated feature parity matrix

**Status date:** 2026-10-30. **Gate: FAIL / incomplete.** This replaces `03_FEATURE_PARITY_MATRIX.md` for planning. `SOURCE-VERIFIED` means cited code was read, not that runtime behavior passed. No hardware or production service is verified.

| ID | Source-linked V1 behavior | V2 preservation and required test | Status / gap |
|---|---|---|---|
| S01 | Fullscreen boot/lifecycle (`Main.kt:33-48`) | ADAPT independent host/backend; startup/shutdown/crash tests | NOT STARTED |
| S02 | 17-state holder accepts arbitrary assignment (`SessionStateMachine.kt:7-37`) | Backend legal commands, session generation, immutable snapshots; illegal/stale tests | FOUNDATION TESTED only: 17×17 legacy behavior; unsafe as IPC boundary |
| S03 | Customer/Admin routes (`Main.kt:125-289`) | React against backend authority; every error/state explicit | NOT STARTED; unused states unresolved |
| S04 | Normal setup and pricing freeze (`Main:126-167`; controller `313-363`) | Preserve layout/effect/price; flow/back tests | Pricing FOUNDATION TESTED; flow not started |
| S05 | Special frame jumps to quantity if target layout exists (`controller:323-335`) | Missing-target and filter tests | NOT STARTED |
| S06 | Long pricing, strip even sanitation, no upper clamp (`PricingCalculator`) | COPY pure logic; boundaries/unsupported/product decision | PASS-AUTOMATED characterization only |
| S07 | PayOS create/poll/PAID plus unguarded cash completion (`PaymentService`; controller `356-397`) | Mock-default wrapper; order/session/amount/deadline/replay guards | BLOCKED; no sandbox test; refund/webhook not found |
| S08 | PREPARING 1600 ms then LIVE_VIEW (`controller:388-397`) | Preserve or approve change; slow-preview test | NOT STARTED |
| S09 | Active capture guard and per-layout shot/countdown (`controller:436-594`) | Nondefault/zero/bounds/repeat/stale tests | Fields FOUNDATION TESTED; sequence not started |
| S10 | Capture failure silently creates mock (`controller:507-533`) | Safety change: production error; explicit simulator only | Simulator gate PASS-AUTOMATED; capture absent |
| S11 | Selection capped; exact selectCount required (`controller:672-689`) | Rapid tap/null/order tests | NOT STARTED |
| S12 | Frame confirm has no strong frame guard (`controller:691-715`) | Approved empty/default policy and tests | DECISION REQUIRED |
| S13 | Exact Back edges; photo Back no-op (`controller:950-961`) | Command matrix tests; no invented retake | NOT STARTED |
| S14 | Cancel only photo/frame selection; job cleanup and normalized path deletion (`controller:926-948`) | Hidden-menu/state/race/path tests | SOURCE-VERIFIED; not implemented |
| S15 | Inactivity auto-fills and calls `startPrinting(false)` (`controller:222-310`) | Timer/manual race and auto-print-no-sale test | NOT STARTED; initial audit contradicted source |
| S16 | Print has no durable once guard (`controller:717-791`) | Durable command/job idempotency; double tap/restart/uncertain submit | BLOCKED architecture |
| S17 | Revenue only manual-confirm + print Result success + same session (`controller:830-852`) | Preserve exact predicate with durable journal | SOURCE-VERIFIED only |
| S18 | Local sale UNIQUE session and pending sync (`SalesRepository`; docs `04/08`) | API ack-loss/idempotency/restart tests | NOT STARTED; deployed API unknown |
| S19 | Reset plus late mutable background tasks (`controller:853-986`) | Generation isolation/recovery tests | NOT STARTED |
| C01 | Camera precedence Native→CLI→Hot Folder→Webcam, constructed once (`controller:63-68`) | Explicit profile/status and serialized reconfigure | NOT STARTED; Admin mismatch |
| C02 | Canon JVM/JNA EDSDK first-camera/message-loop lifecycle (`05_CAMERA...`) | Serialized ownership/disposal/deadlines | BLOCKED DLL provenance/license/device |
| C03 | Live View retry/null/reconnect races (`05_CAMERA...:18`) | Bounded latest-frame, unplug/stale/race tests | BLOCKED hardware |
| C04 | SafeShoot retries/transfer callbacks can have uncertain duplicate outcome (`05_CAMERA...:19-20`) | No blind retry; identity/timeout/multi-format tests | BLOCKED hardware |
| C05 | Webcam preference/largest size/16:9; no close (`05_CAMERA...:24`) | Lifecycle and mock/real unplug/repeat tests | NOT STARTED |
| C06 | Hot Folder fixed wait/delete; weak readiness/order (`05_CAMERA...:25`) | V2-only stable size/mtime/decode, duplicate/late/order tests | NOT STARTED |
| C07 | CLI and EOS Utility automation; EOS Utility not active factory mode (`05_CAMERA...:26-27`) | NEEDS DECISION; timeout/security/licensing | NOT STARTED |
| I01 | Effect/LUT then mirror/JPEG; aspect parameter unused (`07_IMAGE...:7-9`) | Exact gradient/mirror/resolution/corrupt fixtures | NOT STARTED |
| I02 | Traced path does not retain untouched camera bytes (`05_CAMERA...:29-31`) | Safety adaptation: immutable transfer plus compatible derivative | SIGNOFF REQUIRED |
| I03 | Beauty async after capture; 15 s wait; fallback; queue unbounded (`07_IMAGE...:11-19`) | Approved frozen manifest, bounded queue/session tests; never Live View | BLOCKED lineage/hashes/licenses |
| I04 | DesktopCompositor fixed geometry/slot order/crop/bleed (`07_IMAGE...:21-27`) | Exact synthetic geometry/alpha tests | NOT STARTED |
| I05 | QR absent master, present print; paired strips (`07_IMAGE...:27`) | Exact raster tests | NOT STARTED |
| I06 | Compose preview can differ from final raster (`06_PRINTER...:34`) | Authoritative preview/final crop comparison | FAIL RISK |
| P01 | Java PrinterJob; substring match and default fallback (`DesktopIoServices.kt:36-91`) | Exact identity; reject ambiguity/missing; dry-run | NOT STARTED |
| P02 | Copies only; default page/stretch/rotation; no media/DPI/cut/status (`06_PRINTER...`) | Driver/spooler characterization; truthful status | BLOCKED hardware |
| P03 | 5x15 sheets use integer copies/2, odd rounds down (`controller:762-776`) | Odd/even regression or product decision | NOT STARTED |
| P04 | No RX1HS-specific 2-inch cut evidence (`06_PRINTER...:18`) | Vendor/operator and authorized output comparison | BLOCKED |
| B01 | Album precreate, all-captured upload, QR priority, late video (`controller:724-915`; doc `08`) | Mock partial/timeout/late/asset-count tests | NOT STARTED |
| B02 | Unsigned Cloudinary whole-file upload; no deterministic upload ID (`08`) | Approved contract, bounded/redacted/idempotent design | BLOCKED |
| B03 | API and direct-Neon mode; direct mode can ALTER TABLE (`08:23-29`) | Approved shared API; prohibit automatic migrations | BLOCKED owner/architecture |
| B04 | Money uses Long/decimal strings (`08:21`) | Serialization/malformed/overflow tests | NOT STARTED |
| B05 | Local server unauthenticated on `0.0.0.0` (`LocalFileServer.kt:25-67`) | Do not reuse for IPC; reviewed signed delivery/loopback | FAIL SECURITY |
| U01 | All customer screen contracts (`UI_SCREEN_CONTRACTS.md:36-50`) | 1280×800/1920×1200, 100/125/150%, loading/repeat/touch tests | NOT STARTED |
| U02 | Hidden Admin and readiness bypass (`Main:77-119`; UI contract) | Operator protection; bypass cannot imply hardware ready | NOT STARTED |
| U03 | Admin Frames/Layouts/Settings/Tools/Colors/Revenue (`AdminScreen:123-242`) | Full protected workbench and persistence/error tests | PARTIAL; Tools/events incomplete |
| U04 | Settings edit limited fields, `.env`, restart (`SettingsTabContent`; controller `999-1029`) | V2-only validated settings, secret separation, ACL/precedence tests | NOT STARTED |
| U05 | Layout price/shot/countdown update via Firebase (`controller:1033-1052`) | Mock persistence/error/reload tests | NOT STARTED; durability unknown |
| U06 | LUT/effect and Canon parameter controls | Preserve source-supported controls only; error tests | PARTIAL SOURCE AUDIT |
| K01 | Isolated foundation layout/pricing/legacy state/simulator | Characterization only | PASS-AUTOMATED: independent 5 tests, exit 0 |
| K02 | Health-only host↔Kotlin bridge: private inherited framed stdio, fixed method, simulator child | Framing/validation/timeout/cleanup plus live WebView invoke | PASS-AUTOMATED backend validation/build; PASS-SIMULATED standalone Rust→real JVM; WebView invoke/forced cleanup NOT RUN; broader authenticated session IPC not implemented |
| K03 | Installer/JRE/Canon DLL/ONNX/driver coexistence | Clean install/recovery/licenses | BLOCKED |

## Gate summary

This matrix is intentionally incomplete. Admin details, deployed contracts, Beauty lineage, redistribution, architecture, UI and all hardware remain unresolved. The five-test foundation is not a vertical slice or feature-parity proof.
