# TASK_BOARD.md

## Camera Studio UI / Frame Assets Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-02 22:22)

| Task | Status | Evidence / next gate |
|---|---|---|
| Backend regression | **COMPLETED — PASS-AUTOMATED** | 28 suites / 82 total: **80 passed, 0 failed/errors, 2 skipped**. |
| Frontend regression | **COMPLETED — PASS-AUTOMATED** | **8/8 files, 55/55 tests**. |
| Frontend production build | **COMPLETED — PASS-AUTOMATED** | TypeScript/Vite exit 0; 2,017 modules. |
| Rust test command | **COMPLETED — PASS-AUTOMATED (compile only)** | Explicit installed Cargo exit 0; no Rust test cases reported. PATH invocation failure is environmental. |
| Queue post-failure recovery | **COMPLETED — PASS-AUTOMATED** | `shared/command-queue.test.ts` passed; current simulator delegates sequencing to the helper. |
| V1 100% untouched proof | **BLOCKED** | Reviewer made no V1 access/write; no trusted before/after manifest. |
| Canon/DNP/touch/performance/installer/licenses | **BLOCKED / NOT-RUN** | Requires authorized lab, packaging and legal evidence. |

---

## User Feedback Parity Independent Gate — BLOCKED (2026-11-02 21:36)

| Task | Status | Evidence / required action |
|---|---|---|
| Selection Continue/order | **COMPLETED — PASS-AUTOMATED** | Exact local order is sent while acknowledgements are pending (`screens.test.tsx:38`). |
| Mutation queue FIFO and recovery | **FAILED — HIGH** | `KioskSimulator.tsx:47` drops all later commands after a false result. Remove queue poisoning only with owner approval and add a failed-command-then-retry regression. |
| 960 px JPEG preview | **COMPLETED — PASS-AUTOMATED** | Backend dimension tests and 0.88 encoder settings pass. |
| Hold/pinned zoom | **COMPLETED — PASS-AUTOMATED (bounded)** | Window release/cancel and close paths source/test verified; physical touch not run. |
| Layout parameter rendering | **COMPLETED — PASS-SIMULATED** | Ratios and `xMidYMid slice` are wired; no V1 golden visual comparison. |
| Frame comparison and explicit advance | **COMPLETED — PASS-AUTOMATED** | Left preview/right frame grid/“Xem bản in →” present. |
| Regression suites/build | **COMPLETED — PASS-AUTOMATED** | Backend 78 pass, 2 skip; frontend 53/53; Vite build passed. |
| V1 untouched forensic proof | **BLOCKED** | No trusted before/after manifest. Reviewer made no V1 write or shell invocation. |
| Release | **BLOCKED** | Queue defect plus hardware, touch/performance, packaging and licensing gates. |

---

## Touchscreen Interaction & Revenue Gate — COMPLETED (bounded software scope, 2026-11-02)

| Task | Status | Evidence |
|---|---|---|
| Remove Frame Continue; 300ms one-tap advance; default no-advance; rapid-tap latch | **COMPLETED — PASS-AUTOMATED** | `FrameScreen.tsx:26-49,55-82`; `screens.test.tsx:36`. |
| Layout off-center centers; centered confirms once | **COMPLETED — PASS-AUTOMATED** | `StudioModeScreen.tsx:22-28`; `screens.test.tsx:32`. |
| Remove public cash; 1000ms title hold + PIN | **COMPLETED — PASS-AUTOMATED** | `PaymentScreen.tsx:64-83`; `screens.test.tsx:29,44,47`. |
| Confirm 500ms ghost-click arm | **COMPLETED — PASS-AUTOMATED** | `ConfirmScreen.tsx:7-8,30-31`; `screens.test.tsx:36`. |
| Native 300 DPI and Golden Revenue Gate | **COMPLETED — PASS-AUTOMATED** | `DesktopCompositor.kt:48-58`; `PrintImageWriterTest`; `RealSessionEngine.kt:531-555`; simulator/demo revenue tests. |
| FIFO selection, quota and re-index | **COMPLETED — PASS-AUTOMATED** | `SelectPhotosScreen.tsx:27-34,42,87`; `screens.test.tsx:24`. |
| 500ms full-quota hold zoom and safe release | **COMPLETED — PASS-AUTOMATED** | `SelectPhotosScreen.tsx:47-84`; `screens.test.tsx:23`. |
| Immediate photo/frame preview | **COMPLETED — PASS-AUTOMATED (bounded)** | Optimistic local photo/frame state feeds `PrintPreview`; component suite green. Add a dedicated two-frame overlay-switch assertion as hardening. |
| Decouple composition from frame-card interaction | **COMPLETED — PASS-SIMULATED** | Click dispatch path is non-blocking in frontend source; no Mini-PC latency measurement. |
| Floating preview and liquid-glass cards | **COMPLETED — PASS-SIMULATED** | `kiosk-v1.css:215-225`; no fresh mounted screenshot/physical touch run. |
| Backend regression | **COMPLETED — PASS-AUTOMATED** | 28 suites, 79 total: **77 passed / 0 failed / 2 skipped**; Gradle test UP-TO-DATE. |
| Frontend regression/build | **COMPLETED — PASS-AUTOMATED** | **50/50** tests; build passed with **2,016 modules**. |
| V1 global untouched proof | **BLOCKED** | Reviewer performed no V1 command/write, but no trusted pre-task manifest exists. |
| Physical hardware/touch/performance/release | **BLOCKED / NOT-RUN** | Canon, DNP, mounted touch, Mini-PC metrics, print comparison, installer/recovery and licensing remain open. |

---

## Korean Photo Atelier UI Navigation, Header Geometry & Visual Polish Overhaul — COMPLETED (2026-11-02)

| Task | Status | Evidence |
|---|---|---|
| Priority P0: Unified `AppHeader` architecture | **COMPLETED — PASS-SIMULATED** | Standardized 3-column CSS Grid header (`56px minmax(0, 1fr) auto`), robust `.appHeader__backSlot`, aligned eyebrow/step/title/subtitle, clean right slot across all screens. |
| Priority P0: Circular 56×56 `KioskBackButton` with optical centering | **COMPLETED — PASS-SIMULATED** | 56×56px touch target (`min-width: 56px; min-height: 56px`), optical centering $dx=0.5\text{px}, dy=0.0\text{px}$ ($\le 2.5\text{px}$ tolerance). |
| Priority P0: Carousel chevron 56×56 touch targets & horizontal alignment | **COMPLETED — PASS-SIMULATED** | 56×56px floating chevrons centered at 50% stage height and horizontally aligned on exact same axis ($y\Delta \le 3\text{px}$, measured $y\Delta = 0.0\text{px}$). |
| Priority P1: Elimination of technical clutter & raw layout IDs | **COMPLETED — PASS-SIMULATED** | Purged raw layout IDs (`515_4_anh`, `1015_4_ILCL`, `1015_4_base`), technical badges, debug status bars; window title set to `"LE SOUVENIR Photobooth"`. |
| Priority P2: Welcome screen editorial recomposition with authentic photostrips | **COMPLETED — PASS-SIMULATED** | Recomposed hero with authentic layered photostrip illustration (`LayoutArtwork` in `.v1-strip-art`), subtle paper shadows, refined typography, and clutter-free presentation. |
| Live desktop acceptance journey | **COMPLETED — PASS-SIMULATED** | **63/63 checks passing, 0 failures, 26 screenshots** across 1280×800 and 1920×1200: `tests/journey-evidence/2026-11-02T07-41-35.569Z/results.json`. |
| Frontend regression & production build | **COMPLETED — PASS-AUTOMATED** | Vitest **49/49 passing**, TypeScript/Vite build **0 errors** (2,015 modules). |
| Hardware boundary | **BOUNDARY ACKNOWLEDGED** | Physical Canon DSLR, DNP printer, and live PayOS bank settlement remain BLOCKED / NOT-RUN pending physical kiosk attachment. |

---

## Critical V1 UX Parity, Full UI Polish & PayOS Repair — COMPLETED (2026-11-01)

| Task | Status | Evidence |
|---|---|---|
| Bound PayOS link creation and expose explicit states | **COMPLETED — PASS-AUTOMATED + PASS-SIMULATED** | `RealSessionEngine.kt`: 15s bound and `CREATING`, `AWAITING_PAYMENT`, `ERROR`, `UNCONFIGURED`, `PAID`; error responses no longer leave an infinite loader. |
| Add PayOS recovery and staff fallback | **COMPLETED — PASS-SIMULATED** | Customer retry action is **“Thử lại tạo mã QR”**; staff cash confirmation is visible in the appropriate error/unconfigured state. No live bank settlement was performed. |
| Restore selection/editing inactivity timers | **COMPLETED — PASS-AUTOMATED + PASS-SIMULATED** | Engine-authoritative 1000ms ticks; `SELECTING_PHOTOS` 90s and `EDITING` 60s; expiry auto-fills and advances without duplicate revenue or printing. UI shows `Còn lại MM:SS`, urgent at ≤15s. |
| Eliminate frozen `00:00` timer | **COMPLETED — PASS-SIMULATED** | Journey observes `Còn lại 02:19` → `Còn lại 02:18`. |
| Render selected photos in live frame preview | **COMPLETED — PASS-SIMULATED** | `LayoutArtwork.tsx` and `PrintPreview` update SVG `<image>` slots as captures are selected. |
| Add press-and-hold zoom | **COMPLETED — PASS-SIMULATED** | `SelectPhotosScreen.tsx`: 500ms hold opens lightbox, release closes it, 50ms pointer-up reset preserves tap selection. |
| Redesign Frame Selection | **COMPLETED — PASS-SIMULATED** | Two-column tactile gallery plus large selected-photo/frame-overlay print preview. |
| Align capture/countdown presentation | **COMPLETED — PASS-SIMULATED** | Centered 240sp `.v1-countdown`, mirrored Live View (`scaleX(-1)`), DEMO captions removed. |
| Remove decorative emoji | **COMPLETED — PASS-AUTOMATED + PASS-SIMULATED** | Customer/operator decorations use Lucide SVG icons; journey includes a zero-emoji assertion. |
| Live desktop acceptance | **COMPLETED — PASS-SIMULATED** | **47/47 checks, 0 failures, 26 screenshots**: `tests/journey-evidence/2026-11-01T18-16-51.341Z/results.json`. |
| Frontend regression | **COMPLETED — PASS-AUTOMATED** | Vitest **49/49 passing**. |
| Physical devices/live settlement | **BLOCKED / NOT-RUN** | Canon DSLR, DNP printer, and live PayOS banking settlement require attached hardware/provider authorization and supervised testing. |

---

## Final Korean Photo Atelier UI/UX & Exact V1 Payment Restoration — COMPLETED (2026-11-01)

| Task | Status | Evidence |
|---|---|---|
| Remove customer-facing free photo experience | **COMPLETED — PASS-SIMULATED** | Removed `TRẢI NGHIỆM CHỤP ẢNH MIỄN PHÍ`, `0 đ`, `Miễn phí` badges, and guest/customer bypass controls. Internal camera-free mock capture remains test-only and does not define a free commercial package. |
| Restore exact V1 payment flow and pricing | **COMPLETED — PASS-AUTOMATED + PASS-SIMULATED** | `RealSessionEngine.kt` restores 70,000 VND for 5×15 strips and 90,000 VND for 10×15 postcards; `PaymentScreen.tsx` restores VietQR, order summary, status flow, and no customer bypass. |
| Redesign Back and carousel navigation | **COMPLETED — PASS-SIMULATED** | Compact Back buttons use Lucide `ArrowLeft`; carousel navigation uses Lucide `ChevronLeft` / `ChevronRight`. |
| Recompose Welcome as Korean Photo Atelier hero | **COMPLETED — PASS-SIMULATED** | Balanced editorial columns, letter-spaced wordmark, kicker, subtitle, value pills, primary CTA, and layered rotated photostrips with realistic shadows. |
| Rebuild Payment layout and staff cash confirmation | **COMPLETED — PASS-SIMULATED** | Clean summary/VietQR composition; hidden header double-click or 700 ms hold triggers `payment.mockComplete` with `staffOverride: true` / `TIEN_MAT`. |
| Verify 600 DPI composed print preview | **COMPLETED — PASS-SIMULATED** | Final confirmation preview verified by the desktop journey at both target viewports. |
| 16:10 kiosk zero-scroll fit | **COMPLETED — PASS-SIMULATED** | All customer screens checked at 1280×800 and 1920×1200. |
| Live desktop acceptance | **COMPLETED — PASS-SIMULATED** | **35/35 checks, 0 failures, 26 screenshots**: `tests/journey-evidence/2026-11-01T17-19-57.239Z/results.json`. |
| Frontend regression and build | **COMPLETED — PASS-AUTOMATED** | Vitest **45/45 across 7 suites**; production build completed with zero errors. |
| DEMO revenue protection | **COMPLETED — PASS-AUTOMATED** | Backend Gradle `RealSessionEngineDemoModeTest` proves no DEMO-session revenue is recorded. |

Physical Canon capture, DNP output, live payment settlement, and physical touchscreen validation remain separate gated tests; this simulated acceptance result does not claim real-hardware proof.

---

## Deployment configuration readiness — 9/9 CONFIGURED (2026-11-01)

| Readiness item | Status | Safe evidence / remaining gate |
|---|---|---|
| PayOS | **CONFIGURED** — `payOsConfigured: true` | Live VietQR verified; settlement was not performed by this documentation task. |
| Neon PostgreSQL | **CONFIGURED** — `databaseConfigured: true` | Ported `DATABASE_URL`; direct JDBC `SELECT 1` verified. No write/DDL claim. |
| Cloudinary | **CONFIGURED** — `cloudinaryConfigured: true` | Cloud name, upload preset, API key, and API secret present; no upload claim. |
| Web album | **CONFIGURED** — `webAlbumConfigured: true` | Web-album URL, booth API key, and album base URL present. |
| Revenue endpoint | **CONFIGURED** — `revenueEndpointConfigured: true` | Web-album URL and booth API key present; Golden Revenue Rule still applies. |
| Printer/system print | **CONFIGURED** — `printerConfigured: true`; `systemPrintEnabled: true` | Strip/full printer names present and system print enabled; physical DNP output remains NOT-RUN. |
| Beauty | **CONFIGURED** — `beautyEnabled: true` | `BRIGHT` preset selected; licensing/lineage and physical performance gates remain open. |
| Hot Folder | **CONFIGURED** — `hotFolderConfigured: true` | Enabled with deployment path `E:\Photobooth\HotFolder`; real producer/device behavior remains NOT-RUN. |
| Credential containment | **CONFIGURED** | Values are strictly protected in `.env`; `.gitignore` excludes `.env` and `.env.*`. No secret values are documented. |

**Readiness score: 9/9 configured.** Configuration readiness is not equivalent to production release approval or real-hardware proof.

**V1 isolation:** only these V2 documentation files were edited. No V1 command or write was performed. Filesystem-wide forensic verification is **BLOCKED** without a trusted pre-task manifest (and external-directory enumeration was denied), so no unsupported global untouched claim is made.

## Commercial-Grade UI/UX Rebuild & V1 Horizontal Snapping Carousel Parity — COMPLETED (2026-11-01)

| Task | Status | Evidence |
|---|---|---|
| Rebuilt `StudioModeScreen.tsx` horizontal carousel | **COMPLETED — PASS-SIMULATED** | Centered horizontal snapping carousel (`.v1-layout-carousel`), replicating V1 `HorizontalPager` mechanics (scale 1.0 active, 0.84 adjacent peeking cards, click-to-center / click-to-select, floating navigation chevrons, smooth-scroll settling). |
| Vector photo slot illustrations (`LayoutArtwork.tsx`) | **COMPLETED — PASS-SIMULATED** | Silhouette portraits and numbered photo slots, eliminating empty blank preview boxes. |
| Customer-friendly titles & canonical ID tags | **COMPLETED — PASS-SIMULATED** | Polished titles (`formatLayoutTitle`, `formatLayoutSubtitle`) while preserving canonical IDs in subtle `.v1-layout-tag` elements. |
| Korean Photo Atelier design token specification & styling | **COMPLETED — PASS-SIMULATED** | `docs/DESIGN_SYSTEM.md` token specification and full UI styling in `kiosk-v1.css` (`#FAF6F0`, `#FFFFFF`, `#E07A5F`, `#F4A261`). |
| Frame thumbnails real artwork (`thumbDataUrl`) | **COMPLETED — PASS-AUTOMATED** | Added `thumbDataUrl` to `RealSessionEngine.kt` and updated `FrameOption` in `simulator-contract.ts` to display actual frame artwork. |
| Truthful action copy & 1280×800 fit | **COMPLETED — PASS-SIMULATED** | `"Hoàn thành trải nghiệm →"` on `ConfirmScreen.tsx` in DEMO; sticky finish CTA on `DeliveryScreen.tsx` fitting 1280×800. |
| Tauri bridge resilience & teardown guard | **COMPLETED — PASS-AUTOMATED** | Added failure teardown `guard.take()` in `src-tauri/src/main.rs`; increased timeout to 25s in `src-tauri/src/bridge.rs`. |
| Live desktop acceptance journey | **COMPLETED — PASS-SIMULATED** | **35/35 checks passing, 0 failures, 26 distinct screenshots across 1280×800 and 1920×1200**. Evidence: `tests/journey-evidence/2026-11-01T15-38-06.041Z/results.json`. |
| Frontend regression suite | **COMPLETED — PASS-AUTOMATED** | Vitest: **45/45 passed across 8 test suites** (`npm test -- --run`). |
| Backend regression suite | **COMPLETED — PASS-AUTOMATED** | JUnit: **76/76 passed across 17 test suites** (`gradle test installDist`). |
| Frontend production build | **COMPLETED — PASS-AUTOMATED** | `tsc --noEmit && vite build`: zero errors, 2,015 modules transformed. |
| Hardware boundary | **BOUNDARY ACKNOWLEDGED** | Simulated CDP passing; physical Canon camera, DNP printer, and live PayOS bank charges remain unverified without physical studio kiosk attachment. |

Evidence directory: `tests/journey-evidence/2026-11-01T15-38-06.041Z/` (results.json).

---

## Unified Photobooth Application & Automatic Camera Fallback — COMPLETED (2026-11-01)

| Task | Status | Evidence |
|---|---|---|
| Unified single-application UX | **COMPLETED — PASS-SIMULATED** | Eliminated manual DEMO/REAL switches; clean StartScreen with dynamic background hardware evaluation. |
| Background `CameraConnectionManager` | **COMPLETED — PASS-AUTOMATED** | 7-state FSM (`DISCONNECTED`, `DISCOVERING`, `CONNECTING`, `CONNECTED`, `LIVE_VIEW_READY`, `RECONNECTING`, `ERROR`) with 2,000 ms monitor loop (V1 parity). |
| Dynamic promotion at `IDLE` state | **COMPLETED — PASS-AUTOMATED** | Promotes to `REAL` if camera detected; falls back to `DEMO` mock mode if offline. Session captureMode locked during session. |
| Zero-revenue dry-run safety | **COMPLETED — PASS-AUTOMATED** | 0 đ, `Miễn phí`, no live bank transfer prompt, 600-DPI composition with `dryRun: true`, 0 sales DB writes, 0 Neon writes, 0 physical prints. Verified by `RealSessionEngineDemoModeTest`. |
| Korean photo studio UI redesign | **COMPLETED — PASS-SIMULATED** | Atelier design tokens (`#FAF6F0`, `#FFFFFF`, `#E07A5F`, `#F4A261`), 16:10 zero-scroll touch ergonomics, tactile cards, 600-DPI preview. |
| Backend regression | **COMPLETED — PASS-AUTOMATED** | JUnit: **76 passed, 0 failures/errors/skips** across 17 test suites (`gradle test installDist`, `BUILD SUCCESSFUL`). |
| Frontend regression | **COMPLETED — PASS-AUTOMATED** | Vitest: **40 passed, 0 failures**; `tsc --noEmit && vite build` passed in 3.55s (2,015 modules). |
| Live desktop acceptance | **COMPLETED — PASS-SIMULATED** | **35/35 checks passed, 26 screenshots, 0 failures** across 1280×800 and 1920×1200 viewports. |

Evidence directory: `tests/journey-evidence/2026-11-01T14-23-26.975Z/` (results.json).

Truthful hardware boundary: Mock fallback verified via live Tauri CDP. Physical Canon DSLR capture, DNP print spooler, and PayOS settlement remain offline in the dev kiosk pending physical device attachment in the hardware lab.

---

## Real Integrations Recovery — COMPLETED (2026-11-01)

| Task | Status | Evidence |
|---|---|---|
| Live Firebase/Firestore layout recovery | **COMPLETED — VERIFIED** | `FIREBASE_LIVE`; 10 named production layouts synchronized, with V2-local disk cache. |
| Live PayOS VietQR recovery | **COMPLETED — VERIFIED** | `READY`; real link creation and QR image render at both acceptance viewports. No settlement was performed. |
| DEMO capture regression | **COMPLETED — PASS-SIMULATED** | Camera-free touch journey, zero-revenue guard, and dry-run 600-DPI composition preserved. |
| Backend regression | **COMPLETED — PASS-AUTOMATED** | JUnit: **70 passed, 1 skipped**. |
| Frontend regression | **COMPLETED — PASS-AUTOMATED** | Vitest: **40 passed**. |
| Live desktop acceptance | **COMPLETED — PASS-SIMULATED** | **37/37 checks, 0 failures** at 1280×800 and 1920×1200. |

Evidence directory: `tests/journey-evidence/2026-11-01T13-13-52.592Z/`.

Physical Canon/DNP/touchscreen testing, PayOS settlement, Neon/Cloudinary production operations, packaging, recovery, and licensing remain separate release gates.

## Current migration board (2026-11-01, superseding active status)

| Milestone / deliverable | Status | Evidence / next gate |
|---|---|---|
| M0 — V2 isolation and planning | **DONE** | V2-only workspace and safety guardrails established; this task changed `docs/` only. |
| M1 — Legacy audit/parity baseline | **DONE (baseline)** | Feature/state/config/UI/camera/printer/business inventories exist; physical parity is a separate gate. |
| M2 — Desktop bridge and simulator | **DONE — PASS-SIMULATED** | React/Tauri/Kotlin runtime, shutdown path, dual mode, and `installDist` verified in software. |
| M3 — Touch UI/Korean studio redesign, Navigation Geometry & Clutter Overhaul | **DONE — PASS-SIMULATED** | Korean photo studio aesthetic, unified `AppHeader`, 56×56 `KioskBackButton` with optical centering ($\le 2.5\text{px}$), horizontal carousel chevrons ($y\Delta \le 3\text{px}$), vector slot artwork (`LayoutArtwork.tsx`), technical clutter & raw ID elimination, and 1280×800 plus 1920×1200 desktop coverage complete (63/63 checks); physical touch pending. |
| M4 — Feature/backend integration | **DONE — PASS-AUTOMATED** | Session engine, catalogs, `CameraConnectionManager` (7 states, 2000ms loop, auto-fallback), composition, dry-run print, payment safety, QR, and revenue guards covered. |
| M5 — DEMO end-to-end | **DONE — PASS-SIMULATED** | Start→Delivery with 4 mock captures, selection/frame, 600 DPI preview, dry-run print, delivery QR, and zero revenue. |
| M6 — Regression and REAL payment UI | **DONE** | Backend **76/76**; frontend **49/49 across all suites**; build **2,015 modules/0 errors**; CDP journey **63/63 checks, 26 screenshots, 0 failures** at `tests/journey-evidence/2026-11-02T07-41-35.569Z/`. |
| M7 — Canon/DNP/physical kiosk | **BLOCKED / NOT-RUN** | Requires explicit authorization and connected Canon DSLR, DNP RX1HS, physical 16:10 touchscreen, and Mini PC measurement. |
| M8 — Packaging/production release | **BLOCKED / NOT-RUN** | Requires installer/clean-install/recovery testing, live PayOS/provider checks, V1 physical print comparison, and redistribution licenses remain open. |

### Current test deliverables

| Deliverable | Status | Exact result |
|---|---|---|
| Backend Gradle (`gradle test installDist`) | **DONE — PASS-AUTOMATED** | **76/76 passed**, including `CameraConnectionManagerTest` (5 tests), `RealSessionEngineDemoModeTest`, `FirebaseCatalogServiceTest`, `DemoCameraAdapterTest`, and `RealSessionEngineTest`. |
| Frontend Vitest | **DONE — PASS-AUTOMATED** | **49/49 passed across all test files**, including `screens.test.tsx`, `KioskUI.test.tsx`, `PaymentScreen.test.tsx`, and `LayoutArtwork.test.tsx`. |
| Frontend build (`tsc --noEmit && vite build`) | **DONE — PASS-AUTOMATED** | **2,015 modules transformed, 0 errors in 3.55s**. |
| Live desktop journey (`tests/verify-demo-and-real-journey.mjs`) | **DONE — PASS-SIMULATED** | **63/63 checks passed, 26 screenshots, 0 failures**; evidence at `tests/journey-evidence/2026-11-02T07-41-35.569Z/`. |
| Physical Canon DSLR capture | **BLOCKED / NOT-RUN** | No physical capture; authorization and safe hardware setup required. |
| Physical DNP RX1HS print | **BLOCKED / NOT-RUN** | No spool submission or paper output; authorization and supervised setup required. |
| Live PayOS charge | **BLOCKED / NOT-RUN** | No payment charged; explicit production authorization required. |

**Release decision: SOFTWARE MIGRATION TEST BASELINE PASSED / PHYSICAL HARDWARE AND PRODUCTION RELEASE GATES REMAIN BLOCKED.**

The board below is retained as historical chronology; this section is the current active status.

---

## Latest reviewer board (2026-11-01, payment restoration update)

| Task | Status | Evidence / next gate |
|---|---|---|
| Live Desktop Payment Verification (`verify-real-payment.mjs`) | **DONE — PASS-REAL-MODE-DESKTOP** | Tauri desktop runtime verified on 1280×800 and 1920×1200; screenshots & logs at `tests/real-payment-evidence/2026-11-01T08-40-13.800Z/`. Zero -32001 errors. |
| Payment error -32001 root cause & fix | **DONE — PASS-AUTOMATED** | Backend returns `PENDING` when `orderCode` is null instead of throwing -32001; synchronized polling in frontend; `description` fallback. |
| PayOS official SDK parity (`PayOsOfficialAdapter`) | **DONE — PASS-AUTOMATED** | Wraps official Java SDK client; fail-closed behavior verified when unconfigured; tests pass in `PayOsOfficialAdapterTest` & `RealSessionEngineTest`. |
| Server-side ZXing QR code generation | **DONE — PASS-AUTOMATED** | High-res 1000×1000 base64 PNG generated directly in `RealSessionEngine.qrPng` from VietQR payment string. |
| Production layouts activation | **DONE — PASS-AUTOMATED** | `config/production-layouts.json` (`strip-5x15` 4/3 shots/select, `print-10x15` 6/4 shots/select, 5s countdowns); zero synthetic fixtures in REAL mode. |
| Hierarchical config loader (`DesktopBoothConfig`) | **DONE — PASS-AUTOMATED** | 3-tier loading: Workspace `.env` < LocalAppData `LeSouvenirDesktop/.env` < Environment variables; masked diagnostics verify presence without secret leaks. |
| V1 Payment UI visual fidelity & interaction parity | **DONE — PASS-REAL-MODE-DESKTOP** | Exact two-column layout, "Bước 3", "Thanh toán", "70.000 đ", detail rows, status chip, customer bypass removed, staff override on >=700ms hold. |
| Frontend 34-test regression & build | **DONE — PASS-AUTOMATED** | `npm test -- --run`: 34/34 across 7 files; `npm run build`: zero errors, 2,014 modules transformed. |
| Backend 62-test regression suite | **DONE — PASS-AUTOMATED** | `gradle.bat --offline test --console=plain`: 62/62 across 17 suites (including config precedence and orderCode handling). |
| Dual-mode runtime / fail-closed real mode | **DONE — PASS-AUTOMATED** | Explicit `--real` / `--simulator`; real mode returns `-32000` / `-32002` with no synthetic fallback. |
| Revenue-after-submit SQLite gate | **DONE — PASS-AUTOMATED** | `data/sales.db` is written only for verified `PrintResult.Submitted`. |
| Real album URL + decodable print QR | **DONE — PASS-AUTOMATED** | `RealSessionEngine.compose()` album wiring plus ZXing decode test on the composed 600-DPI output. |
| Physical Canon DSLR | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Requires safe connected-hardware shoot and Live View validation. Offline in dev kiosk. |
| Physical DNP DS-RX1HS printer | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Requires supervised spooler, borderless and 2-inch cut output validation. Offline in dev kiosk. |
| Physical 16:10 touchscreen | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Requires mounted kiosk touch/scaling validation on physical glass. |
| Live production endpoints | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Live PayOS settlement and live Neon/Cloudinary sync are not authorized. |
| Commercial redistribution review | **BLOCKED — LEGAL SIGNOFF REQUIRED** | Canon native DLL and ONNX weight redistribution terms remain unresolved. |

**Release decision: SOFTWARE CORE & REAL PAYMENT RESTORATION VERIFIED / HARDWARE LAB TESTING GATED.**

This latest reviewer board supersedes older active-board snapshots below.

## Historical reviewer board (2026-11-01, pre-payment update)

| Task | Status | Evidence / next gate |
|---|---|---|
| Frontend 31-test regression & build | **DONE — PASS-AUTOMATED** | `npm test -- --run`: 31/31 across 7 files; `npm run build`: zero errors, 2,014 modules. |
| Backend 60-test regression suite | **DONE — PASS-AUTOMATED** | `gradle.bat --offline test --console=plain`: 60/60 across 17 suites. |
| Dual-mode runtime / fail-closed real mode | **DONE — PASS-AUTOMATED** | Explicit `--real` / `--simulator`; real mode returns `-32000` / `-32002` with no synthetic fallback. |
| Revenue-after-submit SQLite gate | **DONE — PASS-AUTOMATED** | `data/sales.db` is written only for verified `PrintResult.Submitted`. |
| Real album URL + decodable print QR | **DONE — PASS-AUTOMATED** | `RealSessionEngine.compose()` album wiring plus ZXing decode test on the composed 600-DPI output. |
| PayOS official SDK parity | **DONE — PASS-SIMULATED** | `PayOsOfficialAdapter` wraps the official SDK path and fails closed when unconfigured; live merchant flow remains gated. |
| Physical Canon DSLR | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Requires safe connected-hardware shoot and Live View validation. |
| Physical DNP DS-RX1HS printer | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Requires supervised spooler, borderless and 2-inch cut output validation. |
| Physical 16:10 touchscreen | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Requires mounted kiosk touch/scaling validation. |
| Live production endpoints | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Live PayOS and Neon/Cloudinary operations are not authorized. |
| Commercial redistribution review | **BLOCKED — LEGAL SIGNOFF REQUIRED** | Canon native DLL and ONNX weight redistribution terms remain unresolved. |

**Release decision: READY FOR HARDWARE LAB TESTING / NOT YET PRODUCTION DEPLOYED.**

This latest reviewer board supersedes older active-board snapshots below.

## Superseding active milestone board (2026-11-01)

| Task | Status | Verification |
|---|---|---|
| Milestones 1–6 baseline migration/integration | **COMPLETED / VERIFIED** | Current automated baseline and migrated UI/operator inventory are complete for this scope. |
| Frontend regression | **COMPLETED / PASS-AUTOMATED** | `npm test`: 7/7 files, 29/29 tests, exit 0. |
| Frontend production build | **COMPLETED / PASS-AUTOMATED** | `npm run build`: TypeScript + Vite build exit 0; 2,014 modules. |
| Backend regression | **COMPLETED / PASS-AUTOMATED** | Forced offline Gradle run: 12/12 suites, 42/42 tests, no failures/errors/skips. |
| Timeout fixture isolation | **COMPLETED / VERIFIED** | `timeoutAutoPrintNoSaleAndCancelMatrix()` passes in fresh JUnit XML. |
| Customer/operator migration inventory | **COMPLETED / VERIFIED** | 11 customer screens; 6 operator tabs; Tools and Settings migrated. |
| Real Canon DSLR validation | **BLOCKED / NOT-RUN** | Requires explicit operator authorization and safe hardware setup. |
| Real DNP printer/output validation | **BLOCKED / NOT-RUN** | Requires explicit authorization; no physical print was submitted. |
| Physical touch, installer, production providers, licensing | **OPEN RELEASE GATES** | Automated green status does not satisfy these gates. |

**Current automated regressions: 0. Overall product release remains blocked by the non-automated gates above.** Older board snapshots below are historical and superseded for active-task status.

## Current evidence status (2026-10-31)

| Item | Current status |
|---|---|
| Frontend | Reported actual: 20 tests / 6 files passed; build passed. Not rerun for this note. |
| Backend | Reported actual: 42 tests, 1 failure. Not rerun for this note. |
| Implementation | Three attempts remain **BLOCKED** pending an independently verified checkpoint; no app edits authorized. |
| Master audit | 17-state enumeration correction/acceptance unresolved; earlier accepted-Beauty claim rejected. |
| Next gate | Actual V2 source snapshot, with manifest and hash verification; only then consider source-copy/implementation work. No speculative source-copy. |

No V1 forensic untouched claim is supported by these statuses.

## Current checkpoint / next work (2026-10-31; reported, not independently rerun)

| Item | Status | Acceptance / constraint |
|---|---|---|
| V2 checkpoint | Initial HEAD-only claim **REJECTED**; conditional archive included stale tests. Architect correction in progress. | Must produce and independently verify recoverable-source manifest before app edits. Backend conditional implementation attempt is **BLOCKED** because no verified backup manifest exists. |
| Frontend | Reported 20 tests / 6 files pass; build pass. | Preserve as reported evidence; no rerun in this documentation update. |
| Backend | Reported 42 tests, one failure; shared settings fixture/state across six engines diagnosed. | Approved test-only change: isolate six engine fixtures and offline harness. Retain persisted shared-settings integration coverage. |
| Legacy audit | Four auditor docs produced; independent review rejected unsupported accepted-Beauty claims, unreliable Tools taxonomy, and missing config coverage. | Auditor correction in progress; no full audit completion claim. |
| Frontend/camera slices | Conditional, awaiting verified snapshot. | No app edits before checkpoint verification; no background completion promise. |

Next task order: verified checkpoint → test-only isolation fix with integration assertions → architect-approved bounded slices. Specialist source-linked docs are source inventories only.

## Coordination snapshot (2026-10-31; reported status, not gate evidence)

| Workstream | Reported agent/status | Scope note |
|---|---|---|
| Legacy inventory | legacy-auditor `ses_e70a11911ffeZ8XCL7SqnXDk7b` — inventory | Not a claim of full audit completion. |
| Architecture checkpoint | architect `ses_e709d20e1ffewRrzeoisMXvDQ9` — pending | No checkpoint approval/completion claimed. |
| Camera baseline | camera `ses_e709cf659ffePXgtKXyGcPQnQG` — audit complete | Audit report only; no physical camera proof. |
| Printer baseline | printer — audit complete | See `PRINTER_BASELINE_INVENTORY.md`; no printer/device operation or physical print. |
| UI baseline | UI `ses_e709bb9fbffeESyRONVXSFWre1` — source comparison complete | See `UI_BASELINE_COMPARISON.md`; source comparison, not screenshot or mounted parity. |
| Static review | tester `ses_e709ba21effeLwcg8O494bXq3n` — static review complete | See `MIGRATION_TEST_RESULTS.md`; no new test run implied. |
| Backend baseline | backend `ses_e709b7eccffeDobwsekw4JVqZj` — audit complete | Audit only, not full implementation. |
| Frontend slice | frontend `ses_e7098a611ffelkffCXMgKv6Z5i` — preparing slice | No slice completion claimed. |

User authorization now permits scoped V2-only shell checkpoint/offline tests/builds, with all temp/cache/output paths confined to V2. No V1 execution, production integration, hardware/device operation, or physical print is authorized. V1 untouched forensic verification remains **NOT VERIFIED**; agent reports describe read-only work only. Preserve existing source; no redesign in this baseline task.

## Independent gated work board

| ID | Deliverable | Owner | Status / acceptance |
|---|---|---|---|
| G1 | Correct audit authority and consolidated matrix | Tester-reviewer | DONE; gate remains FAIL |
| G2 | Isolated foundation characterization | Backend/reviewer | PASS-AUTOMATED narrow scope: independent 5-test run exit 0 |
| G3 | Guarded backend commands and immutable snapshots | Architect/backend | PASS-SIMULATED narrow simulator; initial contract remains inconsistent with actual handoff |
| G4 | Versioned authenticated host↔sidecar IPC | Architect | Health-only PASS; simulator methods extend same private stdio; HMAC deferred |
| G5 | Synthetic compositor/LUT/mirror/alpha fixtures | Backend/tester | PARTIAL PASS: simulator compositor files/dedup; LUT/Beauty/pixel parity not covered |
| G6 | V2-only Hot Folder readiness/order/duplicate tests | Camera/tester | PASS-AUTOMATED synthetic fixture; real producer/restart/late-file ownership NOT RUN |
| G7 | Canon loader/lifecycle/license proof | Camera/architect/legal | PARTIAL disabled reflection; capture/reconnect/disposal/native/license BLOCKED |
| G8 | Printer dry-run identity/geometry/idempotency | Printer/tester | PARTIAL fake boundary/printable; spooler/media/cut/physical DNP BLOCKED |
| G9 | Payment/revenue/cloud mock tests | Backend/tester | Simulator only: `payment.mockComplete` (no PayOS/QR) |
| G10 | Accepted Beauty manifest/hashes/licenses | Owner/backend/legal | BLOCKED (B-002, B-003) |
| G11 | Full Admin gaps: Tools/events/settings/revenue | UI/backend/tester | PARTIAL |
| G12 | 16:10 React UI and touch/scaling tests | UI/frontend/tester | PASS-SIMULATED two CSS viewports/screenshots; physical touch/DPI NOT RUN |
| G13 | Gradle distribution provenance | Build/reviewer | **PASS** — HTTPS publisher SHA-256 exactly matches local ZIP |
| G14 | Packaging/JRE/native/model/driver coexistence | Architect/tester | BLOCKED |
| G15 | Health-only private bridge proof | Frontend/backend/architect/tester | **PASS-AUTOMATED/PASS-SIMULATED** — backend 10 tests (5 foundation + 3 bridge + 2), frontend 4 tests, Rust compile, bridge-probe real JVM roundtrip, Tauri window launch/close |
| G16 | Live WebView invoke and close-active-child proof | Frontend/architect/tester | **RESOLVED (narrow)** — CDP harness: mounted React → Tauri `health_check` → JVM PID 17520, `CloseMainWindow=True`, host exit 0, JVM terminated. Abrupt/hung kill NOT TESTED. |
| G17 | Hung child/timeout/tree-kill/parent-death tests | Architect/tester | NOT TESTED — known gap: force parent kill may not run `Drop`/`taskkill` |
| G18 | Ratify actual private-pipe health contract vs HMAC/named-pipe architecture doc | Architect/reviewer | **OPEN** — simulator extends private pipe; HMAC deferred to production |

## Gate acceptance

No gate passes from "file observed." Require exact tests in `FEATURE_PARITY_MATRIX.md`, security closure, architect/reviewer signoff, and separate real-hardware evidence. V1 baseline comparison was not performed.

---
*This board tracks audit-through-implementation. Simulator session implementation (Task2) now in progress.*
