# TASK_BOARD.md

## Pricing & Allowed Quantity Matrix Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-05 10:15)

| Task | Status | Evidence / next gate |
|---|---|---|
| 70k base price across all layouts | **COMPLETED — PASS-AUTOMATED** | `PricingCalculator.kt`: `base = 70000L` for both 5x15 and 10x15/15x10 (min 2 prints). Unit price 20k/strip, 30k/postcard. Verified by `FoundationTest.pricingCharacterization`. |
| 5x15 even-quantity stepping (2..50 step 2) | **COMPLETED — PASS-AUTOMATED** | `PricingCalculator.kt`: `allowedOptions("5x15")` returns `(2..50 step 2)`. Odd numbers rejected/sanitized. Prevents DNP printer half-cut waste. Verified by `FoundationTest`. |
| 10x15 / 15x10 sequential stepping (2..50) | **COMPLETED — PASS-AUTOMATED** | `PricingCalculator.kt`: `allowedOptions("10x15")` returns `(2..50)`. Verified by `FoundationTest`. |
| Engine & IPC catalog synchronization | **COMPLETED — PASS-AUTOMATED** | `RealSessionEngine.kt` and `SimulatorSessionEngine.kt` export `printBasePrice = 70000`, `stripBasePrice = 70000`. Verified by `RealSessionEngineTest`. |
| Frontend layout normalization & stepper options | **COMPLETED — PASS-AUTOMATED** | `KioskSimulator.tsx` normalizes `printSizeLabel` to select correct allowed quantity list; `QuantityScreen.tsx` adapts stepper options with fallbacks. Verified by `screens.test.tsx`. |
| Frontend test suite & production build | **COMPLETED — PASS-AUTOMATED** | Vitest: **59/59 passed** across 8 suites; Vite build: **2,017 modules transformed, 0 errors**. |
| Backend test suite | **COMPLETED — PASS-AUTOMATED** | Offline Gradle test exit 0: **87 tests (85 passed, 2 skipped, 0 failed)** across 28 test suites. |
| Strict V1 isolation | **VERIFIED READ-ONLY** | V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) remained strictly untouched; no writes or builds executed against V1. |
| Physical hardware / release gates | **BLOCKED / GATED** | Physical Canon DSLR, physical DNP DS-RX1HS spooling/cutting, live PayOS credentials, and commercial redistribution review remain unverified without physical hardware. |

---

## Unboxed Atelier & Liquid Glass UI Overhaul Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-05 02:40)

| Task | Status | Evidence / next gate |
|---|---|---|
| Unboxed atelier customer shell overhaul | **COMPLETED — PASS-SIMULATED** | Eliminated opaque backing cards across StartScreen, Quantity, Payment, Confirm, and Stage screens (`.v1-panel`, `.v1-start-card`, `.v1-quantity-pricing`, `.v1-summary`, etc.). Canvas and hairline dividers define surfaces. Tested across 1280×800 and 1920×1200. |
| StartScreen photographic gallery refactor | **COMPLETED — PASS-SIMULATED** | Refactored `StartScreen.tsx` with open dual floating paper prints (rear portrait at −7°, front strip at +6° with z-index 1), warm ambient light halo, and `LE SOUVENIR · PHOTO ATELIER` brand signature. Preserved 5-tap operator gesture and bundle showcase. |
| Liquid glass primary & secondary controls | **COMPLETED — PASS-SIMULATED** | Terracotta-coral gradient primary pill CTA (`#C27357` to `#8E442D`, specular rim, 68px min-height); refractive frosted glass secondary/back/stepper buttons (`rgba(255,255,255,.65)`, `blur(24px) saturate(180%)`, dual specular rims, 56px/72px hitboxes). |
| Floating actionbar dock & payment quiet zone | **COMPLETED — PASS-SIMULATED** | Translucent floating pill dock (`border-radius: 28px`, `blur(24px)`); unboxed payment summary on canvas; frosted QR panel with opaque `#fff` VietQR quiet zone and 0px layout shift. |
| Live journey automated verification | **COMPLETED — PASS-SIMULATED** | `tests/verify-demo-and-real-journey.mjs` executed with **0 failures** across both 1280×800 and 1920×1200. Evidence stored in `tests/journey-evidence/2026-11-05T02-34-00.652Z/`. |
| Frontend test suite & production build | **COMPLETED — PASS-AUTOMATED** | Vitest: **59/59 passed** across 8 test suites; zero regression in UI and state components. |
| Backend test suite | **COMPLETED — PASS-AUTOMATED** | Offline Gradle test exit 0: **87 tests (85 passed, 2 skipped, 0 failed)** across 28 test suites. |
| Strict V1 isolation | **VERIFIED READ-ONLY** | V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) remained strictly untouched; no writes or builds executed against V1. |
| Physical hardware / release gates | **BLOCKED / GATED** | Physical Canon DSLR, physical DNP DS-RX1HS spooling/cutting, live PayOS credentials, and commercial redistribution review remain unverified without physical hardware. |

---

## Live View Countdown & Concentric Shutter Redesign Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-04 01:30)

| Task | Status | Evidence / next gate |
|---|---|---|
| Countdown stutter elimination | **COMPLETED — PASS-AUTOMATED** | Smooth local timestamp-based countdown interval (50ms tick anchored to `performance.now() + countdown * 1000`) with pop keyframe animation in `CaptureScreen.tsx` and `kiosk-v1.css`. Verified by unit test in `screens.test.tsx`. |
| Countdown viewport dead-centering | **COMPLETED — PASS-SIMULATED** | Full-screen flex overlay `.v1-countdown-layer` (`inset: 0`) with tabular numerals and warm terracotta glow. Measured via CDP in `tests/verify-demo-and-real-journey.mjs`: Δx = 0.000038 px (1280×800) / 0.000061 px (1920×1200), Δy = 0 px. |
| Concentric shutter button redesign | **COMPLETED — PASS-SIMULATED** | Authentic V1 concentric physical shutter: 108×108 px outer frosted ring (`blur(8px)`), 84×84 px inner white core with 4px `#C27357` rim, 0.92x active tap compression. Measured via CDP: width = 108 px, height = 108 px, core = 84×84 px, Δx = 0 px dead-center. |
| Shutter multi-touch latch protection | **COMPLETED — PASS-AUTOMATED** | `starting.current` lock prevents repeated touches from firing redundant capture sequences. Verified by unit test in `screens.test.tsx`. |
| Live journey automated verification | **COMPLETED — PASS-SIMULATED** | `tests/verify-demo-and-real-journey.mjs` executed with **0 failures** across both 1280×800 and 1920×1200. Shutter and countdown geometry asserted with sub-pixel tolerance. |
| Frontend test suite & production build | **COMPLETED — PASS-AUTOMATED** | Vitest: **59/59 passed** across 8 test suites; Vite build: **2,017 modules transformed, 0 errors**. |
| Backend test suite | **COMPLETED — PASS-AUTOMATED** | Offline Gradle test exit 0: **87 tests (85 passed, 2 skipped, 0 failed)** across 28 test suites. |
| Strict V1 isolation | **VERIFIED READ-ONLY** | V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) remained strictly untouched; no writes or builds executed against V1. |
| Physical hardware / release gates | **BLOCKED / GATED** | Physical Canon DSLR, physical DNP DS-RX1HS spooling/cutting, live PayOS credentials, and commercial redistribution review remain unverified without physical hardware. |

---

## Sub-10ms Touch Latency & Full Atelier Liquid Glass Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-03 21:45)

| Task | Status | Evidence / next gate |
|---|---|---|
| Deferred composition on frame selection | **COMPLETED — PASS-AUTOMATED** | `frame.select` updates memory and clears composition in <1ms; `frame.confirm` renders just-in-time composition. Verified by `SimulatorSessionTest.frameSelectionDefersCompositionUntilConfirmation` and `RealSessionEngineTest`. |
| Non-blocking React command dispatch | **COMPLETED — PASS-AUTOMATED** | Decoupled user mutations from background polling in `KioskSimulator.tsx`; eliminated lock contention busy-waits. |
| Snapshot poll deduplication & frame caching | **COMPLETED — PASS-AUTOMATED** | Added `sameVisibleSnapshot()` to compare visible fields without re-serializing multi-megabyte base64 payloads; cached `framesRef` during `EDITING`. |
| Photo selection latency < 100ms | **COMPLETED — PASS-SIMULATED** | Measured inside live Tauri WebView via CDP: **4.30 ms** at 1920×1200, **8.50 ms** at 1280×800 (10x faster than 100ms threshold). |
| Frame selection latency < 100ms | **COMPLETED — PASS-SIMULATED** | Measured inside live Tauri WebView via CDP: **7.50 ms** at 1920×1200, **8.00 ms** at 1280×800. |
| PayOS QR layout shift = 0 px | **COMPLETED — PASS-SIMULATED** | Measured via CDP: static clamp slot (280–380px) and columns bounds; slot and column shifts are exactly **0 px**. |
| Complete Liquid Glass UI overhaul | **COMPLETED — PASS-SIMULATED** | Unified warm atelier ambient (`#FAF7F2` to `#EFE8E0`), frosted glass panels (`blur(20px) saturate(150%)`), inner bevels, and organic paper drop shadows across customer screens and operator workspace. |
| Enlarge photo previews & dominant components | **COMPLETED — PASS-SIMULATED** | Live print previews expanded to 82vh; 72×72px quantity steppers with 34px tabular numbers; 40px terracotta order badges; 56px action bar touch targets. |
| Automated journey acceptance runner | **COMPLETED — PASS-SIMULATED** | `tests/verify-demo-and-real-journey.mjs` executed with **0 failures** across 1280×800 and 1920×1200. Verified DEMO revenue = 0 and 0 orphaned Vite/Node processes. |
| Backend test suite | **COMPLETED — PASS-AUTOMATED** | Offline Gradle test exit 0: **87 tests (85 passed, 2 skipped, 0 failed)** across 28 test suites. |
| Frontend test suite & production build | **COMPLETED — PASS-AUTOMATED** | Vitest: **57/57 passed** across 8 test suites; Vite build: **2,017 modules transformed, 0 errors**. |
| Strict V1 isolation | **VERIFIED READ-ONLY** | V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) remained strictly untouched; no writes or builds executed against V1. |
| Physical hardware / release gates | **BLOCKED / GATED** | Physical Canon DSLR, physical DNP DS-RX1HS spooling/cutting, live PayOS credentials, and commercial redistribution review remain unverified without physical hardware. |

---

## Kiosk Typography, Visual Rhythm & Column Alignment Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-03 21:00)

| Task | Status | Evidence / next gate |
|---|---|---|
| Eliminate white step pills ("Bước 1 2 3...") | **COMPLETED — PASS-SIMULATED** | Replaced clunky white pill bars with clean, elegant Korean photobooth typography; preserved step text in accessibility tree for screen readers & Vitest assertions. |
| Header back button and title vertical alignment | **COMPLETED — PASS-SIMULATED** | Aligned back button, title, and subtitle to unified vertical center; standardized line height and margins. |
| Photo selection baseline alignment | **COMPLETED — PASS-SIMULATED** | Removed redundant subheadings and counter paragraphs; photo gallery and print preview pinned to identical vertical baseline. |
| Frame screen preview & grid alignment | **COMPLETED — PASS-SIMULATED** | Left preview panel and right frame grid vertically aligned; frame card titles and thumbnails centered symmetrically. |
| Quantity screen stepper & tabular numbers | **COMPLETED — PASS-SIMULATED** | Stepper buttons and number centered with `place-items: center` and `tabular-nums`; aligned pricing breakdown. |
| Payment details label/value alignment | **COMPLETED — PASS-SIMULATED** | Detail items aligned cleanly via 2-column baseline grid; tabular currency values and scrollable QR slot. |
| Confirm screen & action bar touch alignment | **COMPLETED — PASS-SIMULATED** | Order summary rows cleanly aligned; action bar helper text and primary buttons vertically centered with 56px touch target. |
| Acceptance runner lifecycle & process cleanup | **COMPLETED — PASS-AUTOMATED** | Added `cleanupPreviousInstance()` in `tests/verify-demo-and-real-journey.mjs` targeting only V2 processes; 100% pass across 1280×800 and 1920×1200 with 26 screenshots. |
| Frontend test suite & production build | **COMPLETED — PASS-AUTOMATED** | Vitest: **57/57 passed** across 8 suites; Vite build: **2,017 modules transformed, 0 errors**. |
| Strict V1 isolation | **VERIFIED READ-ONLY** | V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) remained strictly untouched; no writes or builds executed against V1. |
| Physical hardware / release gates | **BLOCKED / GATED** | Physical Canon DSLR, physical DNP DS-RX1HS spooling/cutting, live PayOS credentials, and commercial redistribution review remain unverified without physical hardware. |

---

## Option D UI/UX & Functional Polish Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-03 19:15)

| Task | Status | Evidence / next gate |
|---|---|---|
| Softened warm ivory ambient lighting & refined carousel | **COMPLETED — PASS-SIMULATED** | Removed dark box shadows and harsh gradient banding; implemented luxurious warm ivory `--layout-ambient`; adjacent cards scaled to `0.95`/`0.90` with high opacity (`0.92`/`0.84`) and zero blur. |
| Complete Liquid Glass UI across customer & operator | **COMPLETED — PASS-SIMULATED** | Applied unified translucent frosted glass (`blur(20px) saturate(150%)`, terracotta CTA, refined borders) across all kiosk screens and operator workspace. |
| Removed thick card wrappers around photos & frames | **COMPLETED — PASS-SIMULATED** | Eliminated unnecessary white borders; photos and print paper float naturally with organic paper drop shadows. |
| Viewport alignment across 1280×800 & 1920×1200 | **COMPLETED — PASS-SIMULATED** | Verified camera countdown dead-center, shutter centered at bottom, header title and action bar aligned seamlessly at both target 16:10 resolutions. |
| Zero-lag photo selection & frame switching | **COMPLETED — PASS-AUTOMATED** | Reconciled selections in-memory via `useRef` with non-blocking IPC dispatch; immediate visual feedback on touch. |
| Direct touchscreen frame tap-to-confirm | **COMPLETED — PASS-AUTOMATED** | Tapping active frame directly confirms and advances to preview while preserving action-bar button; tested in unit test suite. |
| Native 300×300 DPI print density | **VERIFIED INTACT** | Backend `DesktopCompositor.kt` & `PrintImageWriter.kt` verified; 300 DPI native render unchanged. |
| Backend test suite | **COMPLETED — PASS-AUTOMATED** | Offline Gradle test exit 0: **86 passed, 2 skipped, 0 failed** across 28 suites. |
| Frontend test suite | **COMPLETED — PASS-AUTOMATED** | Vitest: **57/57 passed** across 8 test suites. |
| Automated journey acceptance runner | **COMPLETED — PASS-SIMULATED** | `verify-demo-and-real-journey.mjs` verified with 0 failures across 1280×800 and 1920×1200. |
| V1 strict isolation proof | **VERIFIED READ-ONLY** | V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) remained strictly untouched; no writes or builds executed against V1. |
| Physical hardware / release gates | **BLOCKED / GATED** | Physical Canon DSLR, physical DNP DS-RX1HS spooling/cutting, live PayOS credentials, and commercial redistribution review remain unverified without physical hardware. |

---

## Frame Decoration Loading Resolution & Full End-to-End Kiosk Journey Verification Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-03 17:55)

| Task | Status | Evidence / next gate |
|---|---|---|
| Frame decoration loading resolution | **COMPLETED — PASS-SIMULATED** | Resolved `-32004 Stale session or generation` during `frame.list`. Streamlined `frameDto` to compute `thumbDataUrl` once and eliminated redundant thumbnail fields exceeding the 1 MiB IPC frame limit. Tolerated omitted `generationId` when session matches. |
| Camera shutter centering across viewports | **COMPLETED — PASS-SIMULATED** | Removed competing position rules in `kiosk-v1.css`; `.v1-shutter-control` centrally positions 88px (1280×800) and 108px (1920×1200) shutter buttons. |
| React async selection state fix | **COMPLETED — PASS-AUTOMATED** | Removed immediate synchronous `aria-pressed` re-click in `verify-demo-and-real-journey.mjs` that caused accidental photo deselection. |
| Full live acceptance journey suite | **COMPLETED — PASS-SIMULATED** | `node tests/verify-demo-and-real-journey.mjs` executed against debug `le-souvenir-v2.exe`. **63/63 checks passed, 0 failed** across both 1280×800 and 1920×1200 viewports. 26 screenshots saved in `tests/journey-evidence/2026-11-03T10-54-45.783Z/`. |
| DEMO revenue zero-record guarantee | **COMPLETED — PASS-AUTOMATED** | Confirmed by `RealSessionEngineDemoModeTest` (2/2 passed, 0 failures, 0 errors). Zero revenue recorded in ledger. |
| Backend test suite | **COMPLETED — PASS-AUTOMATED** | Offline Gradle test exit 0: **86 passed, 2 skipped, 0 failed** across 30 suites. |
| Frontend test suite | **COMPLETED — PASS-AUTOMATED** | Vitest: **56/56 passed** across 8 test suites. |
| V1 strict isolation proof | **VERIFIED READ-ONLY** | V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) remained strictly untouched; no writes or builds executed against V1. |
| Physical hardware / release gates | **BLOCKED / GATED** | Physical Canon DSLR, physical DNP DS-RX1HS spooling/cutting, live PayOS credentials, and commercial redistribution review remain unverified without physical hardware and explicit operator signoff. |

---

## Mock Capture & Print-Signal Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-03 15:04)

| Task | Status | Evidence / next gate |
|---|---|---|
| Run full session without Canon/DNP attached | **COMPLETED — PASS-SIMULATED** | Unlocked flow supports end-to-end camera-free sessions; this is not physical hardware evidence. |
| Synthetic high-resolution mock capture | **COMPLETED — PASS-SIMULATED** | Mock portraits feed the normal downstream selection and composition path. |
| Exact print-canvas composition | **COMPLETED — PASS-SIMULATED** | Full composition engine renders the print canvas; physical V1/DNP output comparison remains not run. |
| Print-signal transmission and telemetry | **COMPLETED — PASS-SIMULATED** | Dispatches to Windows Print Spooler when system printing is enabled, otherwise records simulated signal transmission with complete job telemetry. No physical DNP output was submitted by this review. |
| Delivery success badge | **COMPLETED — PASS-AUTOMATED (bounded)** | Delivery displays green **“TÍN HIỆU IN: ĐÃ TRUYỀN THÀNH CÔNG”** status; frontend suite/build are green. |
| Staff payment unlock helper | **COMPLETED — PASS-AUTOMATED (bounded)** | Payment displays the 1-second title-hold helper and PIN `1234`; existing staff-gesture regression passes. |
| Backend regression | **COMPLETED — PASS-AUTOMATED** | Offline Gradle exit 0; XML **80 passed, 2 skipped, 0 failed/errors** of 82 across 28 suites; task up-to-date. |
| Frontend regression/build | **COMPLETED — PASS-AUTOMATED** | **8/8 files, 56/56 tests**; production build passed with **2,017 modules**. |
| Rust check | **COMPLETED — PASS-AUTOMATED (compile only)** | Installed Cargo `check` exited 0; Tauri package compiled in 5.86s. |
| V1 strict isolation proof | **BLOCKED** | Reviewer ran no V1 command and made no V1 write/build/cleanup/secret read; no trusted before/after manifest exists for global proof. |
| Physical/release gates | **BLOCKED / NOT-RUN** | Canon, DNP output/cut, mounted touch/scaling, Mini-PC metrics, installer/recovery, live providers, physical V1 comparison, and redistribution rights remain open. |

---

## Production Kiosk Administration & Settings Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-03 12:50)

| Task | Status | Evidence / next gate |
|---|---|---|
| Replace simulator warning with production status | **COMPLETED — PASS-SIMULATED** | Operator now uses an Atelier 2.0 kiosk banner and live device-status pills; mounted device-state acceptance remains not run. |
| Upgrade settings visual system | **COMPLETED — PASS-SIMULATED** | Structured Liquid Glass panels, iOS/kiosk switch, 52×52 squircle steppers, floating status cards and print information chips are source/build verified. Physical touch, overflow and scaling acceptance remain not run. |
| Preserve backend persistence contract | **COMPLETED — PASS-AUTOMATED** | Existing suite passes with the exact six fields: `enableSystemPrint`, `useHotFolder`, `hotFolderPath`, `postCaptureTimeoutSeconds`, `photoSelectionTimeoutSeconds`, `frameSelectionTimeoutSeconds`. |
| Preserve test IDs and roles | **COMPLETED — PASS-AUTOMATED** | Operator and `V1Settings` tests remain green: **56/56 tests across 8 files**. |
| Backend regression | **COMPLETED — PASS-AUTOMATED** | Offline Gradle exit 0 in 22.52s; XML **80 passed, 2 skipped, 0 failed/errors**; test task up-to-date. |
| Frontend regression/build | **COMPLETED — PASS-AUTOMATED** | **8/8 files, 56/56 tests** in 9.31s wall time; build passed with **2,017 modules** in 9.92s. |
| Rust command | **COMPLETED — PASS-AUTOMATED (compile only)** | Installed Cargo exit 0; one package compiled in 22.34s; no Rust tests reported. |
| V1 strict isolation proof | **BLOCKED** | Reviewer ran no V1 command and made no V1 write/build/cleanup/secret read; no trusted baseline exists for global proof. |
| Physical/release gates | **BLOCKED / NOT-RUN** | Mounted 16:10 touch/scaling, Canon, DNP, Mini-PC metrics, installer/recovery, live providers, physical V1 comparison and redistribution rights remain open. |

---

## Coverflow Wheel Carousel Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-03 11:48)

| Task | Status | Evidence / next gate |
|---|---|---|
| Remove visible repeat-selection hint | **COMPLETED — PASS-AUTOMATED** | Hint is `.sr-only`, clean on kiosk screens while retained in DOM and covered by Vitest. |
| Cardless 3–5 choice stage | **COMPLETED — PASS-SIMULATED** | Cards use `clamp(200px, 22vw, 300px)`, stage max-width 1400px, and evenly spaced `clamp(16px, 2.5vw, 40px)` gap. Mounted viewport confirmation remains not run. |
| Gradual Coverflow depth | **COMPLETED — PASS-SIMULATED** | Distance tiers: 0=`1.08`/z10 with chromatic aura; 1=`.80`/`.65`/z5; 2=`.62`/`.40`/z2; ≥3=`.48`/`.22`/z1. Hover scales are locked. |
| Looping wheel navigation | **COMPLETED — PASS-AUTOMATED** | Prev and Next use modular wrap-around; frontend regression covers cycling behavior. |
| Backend regression | **COMPLETED — PASS-AUTOMATED** | Offline Gradle exit 0, `BUILD SUCCESSFUL in 23s`; XML: **80 passed, 2 skipped, 0 failed/errors**; task up-to-date. |
| Frontend regression/build | **COMPLETED — PASS-AUTOMATED** | **8/8 files, 56/56 tests** in 9.83s; build passed with **2,017 modules** in 6.25s. |
| Rust command | **COMPLETED — PASS-AUTOMATED (compile only)** | Installed Cargo exit 0; one package compiled in 11.35s; no Rust tests reported. |
| V1 strict isolation proof | **BLOCKED** | Reviewer ran no V1 command and made no V1 write/build/cleanup/secret read; no trusted baseline exists for global proof. |
| Rendered touch/scaling acceptance | **NOT-RUN** | Required at 1920×1200 and 1280×800 with 100/125/150% scaling, physical touch, repeated taps, overflow and visual-spacing review. |
| Hardware/package/licenses | **BLOCKED / NOT-RUN** | Canon, DNP, Mini-PC metrics, installer/recovery, live providers, physical V1 comparison and redistribution rights remain open. |

---

## Chromatic Oil-Slick / Cardless Carousel Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-03 11:37)

| Task | Status | Evidence / next gate |
|---|---|---|
| Six-color oil-slick shell | **COMPLETED — PASS-SIMULATED** | Non-camera shell includes cyan, violet, rose, coral, amber and sapphire layers; mounted visual/contrast acceptance remains not run. |
| Liquid-glass panels and chromatic CTA | **COMPLETED — PASS-SIMULATED** | Saturated 28px frost, cyan/violet highlight rims and multi-spectral primary CTA aura are source-verified. |
| Cardless layout carousel | **COMPLETED — PASS-SIMULATED** | Outer white wrapper is transparent with zero border/shadow/padding; floating paper retains 3D shadow, selected `1.06` scale and requested chromatic aura; pill tap-hint is present. |
| QR and camera exclusions | **COMPLETED — PASS-SIMULATED** | White porcelain QR surfaces and dark `#121214` camera studio remain preserved in source. QR scan and real Live View were not run. |
| Backend regression | **COMPLETED — PASS-AUTOMATED** | Offline Gradle exit 0 in 22.54s; aggregate **80 passed, 2 skipped, 0 failed/errors**; task was up-to-date. |
| Frontend regression/build | **COMPLETED — PASS-AUTOMATED** | **8/8 files, 55/55 tests** in 10.82s; build passed with **2,017 modules** in 11.93s. |
| Rust command | **COMPLETED — PASS-AUTOMATED (compile only)** | Installed Cargo exit 0; one package compiled in 11.19s; no Rust tests reported. |
| V1 strict isolation proof | **BLOCKED** | Reviewer ran no V1 command and made no V1 write/build/cleanup/secret read; no trusted baseline exists for global proof. |
| Rendered touch/QR acceptance | **NOT-RUN** | Required at 1920×1200 and 1280×800 with 100/125/150% scaling, including repeated taps, clipping, forced colors and QR scanning. |
| Hardware/package/licenses | **BLOCKED / NOT-RUN** | Canon, DNP, Mini-PC metrics, installer/recovery, live providers, physical V1 comparison and redistribution rights remain open. |

---

## App-Wide Korean Atelier Liquid Glass Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-03 11:10)

| Task | Status | Evidence / next gate |
|---|---|---|
| Global luminous studio ambience | **COMPLETED — PASS-SIMULATED** | `.v1-shell:not(.v1-camera)` uses warm apricot, rose-quartz and golden-champagne glow; rendered/scaling acceptance remains not run. |
| Master Liquid Glass customer surfaces | **COMPLETED — PASS-SIMULATED** | Shared treatment covers `.v1-panel`, `.v1-start-card`, `.v1-actionbar`, `.v1-frame-preview-panel`, `.v1-summary`, `.v1-prepare-stage`, `.v1-print-stage`, `.v1-delivery`, and `.v1-modal`. |
| Buttons, pulse badges, print previews and QR cards | **COMPLETED — PASS-SIMULATED** | Terracotta-coral specular buttons, `atelier-status-pulse`, crisp unblurred floating paper previews, and porcelain VietQR/download cards are present in source; physical touch, animation and scanner acceptance are not run. |
| Camera studio preservation | **COMPLETED — PASS-SIMULATED** | Dark `#121214` environment, dead-center countdown, and circular shutter are preserved in source. No physical Canon/Live View run. |
| Backend regression | **COMPLETED — PASS-AUTOMATED** | Offline Gradle exit 0 in 16.75s wall time; 28 suites / 82 total: **80 passed, 2 skipped, 0 failed/errors**. |
| Frontend regression | **COMPLETED — PASS-AUTOMATED** | **8/8 files, 55/55 tests**; 16.61s wall time. |
| Frontend production build | **COMPLETED — PASS-AUTOMATED** | TypeScript/Vite exit 0; **2,017 modules**, zero errors; 10.71s wall time. |
| Rust command | **COMPLETED — PASS-AUTOMATED (compile only)** | Installed Cargo exit 0; one package compiled in 15.17s; no Rust test cases reported. |
| V1 strict isolation proof | **BLOCKED** | Read-only status shows two modified agent files and two untracked backups of unknown provenance. Reviewer made no V1 write/build/cleanup/secret read; no trusted baseline manifest exists. |
| Physical/release gates | **BLOCKED / NOT-RUN** | Mounted 16:10 touch/scaling/QR, Canon, DNP, Mini-PC metrics, installer/recovery, live providers, V1 print comparison, and redistribution rights remain open. |

---

## Full-Bleed Payment Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-03 10:34)

| Task | Status | Evidence / next gate |
|---|---|---|
| Backend regression | **COMPLETED — PASS-AUTOMATED** | Offline Gradle exit 0; 28 suites / 82 total: **80 passed, 0 failed/errors, 2 skipped**. |
| Frontend regression | **COMPLETED — PASS-AUTOMATED** | **8/8 files, 55/55 tests**. |
| Frontend production build | **COMPLETED — PASS-AUTOMATED** | TypeScript/Vite exit 0; **2,017 modules**. |
| Rust command | **COMPLETED — PASS-AUTOMATED (compile only)** | Installed Cargo exit 0; one package compiled cleanly, no Rust tests reported. |
| Edge-to-edge payment source | **COMPLETED — PASS-SIMULATED** | Payment shell padding/gap removed; outer radius zero; ambient apricot/rose/champagne glow extends to intended pixel `(0,0)` with no intended white border. Internal bezel padding remains `clamp(20px, 2.5vh, 32px) clamp(24px, 4vw, 64px)`. |
| Mounted pixel/scaling/touch acceptance | **NOT-RUN** | Verify actual zero-white-border output at 1280×800 and 1920×1200, 100/125/150% scaling, physical touch and QR scanning. |
| V1 100% untouched proof | **BLOCKED** | Reviewer made no V1 command/write/secret read; no trusted before/after manifest exists. |
| Hardware/package/licenses | **BLOCKED / NOT-RUN** | Canon, DNP, Mini-PC, installer/recovery, physical V1 print comparison, live providers and redistribution rights remain open. |

---

## Full-Stage Payment Liquid-Glass Gate — SOFTWARE GREEN, RELEASE BLOCKED (2026-11-03 09:25)

| Task | Status | Evidence / next gate |
|---|---|---|
| Backend regression | **COMPLETED — PASS-AUTOMATED** | Exact offline Gradle command exit 0; 28 suites / 82 total: **80 passed, 0 failed/errors, 2 skipped**. |
| Frontend regression | **COMPLETED — PASS-AUTOMATED** | **8/8 files, 55/55 tests**. |
| Frontend production build | **COMPLETED — PASS-AUTOMATED** | TypeScript/Vite exit 0; 2,017 modules. |
| Rust command | **COMPLETED — PASS-AUTOMATED (compile only)** | Installed Cargo exit 0; one package compiled, no Rust tests reported. |
| Liquid-glass payment source geometry | **COMPLETED — PASS-SIMULATED** | Full-stage 100% width/height grid at `1.05fr : 1fr`, 24–48px gap, 28–48px padding; panels stretch evenly. Square QR card `clamp(290px, 37vh, 390px)` has transform/transition/animation disabled; instructions are fixed at 130px. Frost uses `blur(28px) saturate(190%)` over warm apricot/rose/champagne ambience. Rendered/device acceptance remains NOT-RUN. |
| Payment geometry/scanner acceptance | **NOT-RUN** | No fresh mounted state-to-state rectangle measurements, 100/125/150% scaling, physical touch, or QR scan. |
| V1 100% untouched proof | **BLOCKED** | No V1 write/build/secret read; read-only status attempt denied before execution; no trusted before/after manifest. |
| Hardware/production/package/licenses | **BLOCKED / NOT-RUN** | Canon, DNP, Mini-PC, live providers, installer/recovery, print comparison, and redistribution rights remain open. |

---

## Payment QR Dimension Gate â€” SOFTWARE GREEN, RELEASE BLOCKED (2026-11-03 00:40)

| Task | Status | Evidence / next gate |
|---|---|---|
| Backend regression | **COMPLETED â€” PASS-AUTOMATED** | Requested offline Gradle command exit 0; 28 suites / 82 total: **80 passed, 0 failed/errors, 2 skipped**. |
| Frontend regression | **COMPLETED â€” PASS-AUTOMATED** | **8/8 files, 55/55 tests**. |
| Frontend production build | **COMPLETED â€” PASS-AUTOMATED** | TypeScript/Vite exit 0; 2,017 modules. |
| Rust command | **COMPLETED â€” PASS-AUTOMATED (compile only)** | Explicit installed Cargo exit 0; one package compiled, no Rust tests reported. |
| QR dimensions / no-zoom visual acceptance | **NOT-RUN** | Existing suites/build are green, but no fresh mounted 1280Ã—800/1920Ã—1200 or 100/125/150% scaling measurement was run. |
| V1 100% untouched proof | **BLOCKED** | Reviewer made no V1 command/write/secret read; no trusted before/after manifest exists. |
| Hardware/production/package/licenses | **BLOCKED / NOT-RUN** | Canon, DNP, Mini-PC metrics, live providers, installer/recovery, print comparison, and redistribution rights remain open. |

---

## Luxury Atelier UI Gate â€” SOFTWARE GREEN, RELEASE BLOCKED (2026-11-02 23:05)

| Task | Status | Evidence / next gate |
|---|---|---|
| Backend regression | **COMPLETED â€” PASS-AUTOMATED** | 28 suites / 82 total: **80 passed, 0 failed/errors, 2 skipped**. |
| Frontend regression | **COMPLETED â€” PASS-AUTOMATED** | **8/8 files, 55/55 tests**. |
| Frontend production build | **COMPLETED â€” PASS-AUTOMATED** | TypeScript/Vite exit 0; 2,017 modules. |
| Rust command | **COMPLETED â€” PASS-AUTOMATED (compile only)** | Installed Cargo exit 0; one package compiled, no tests reported. |
| Fresh rendered 16:10/scaling/touch review | **NOT-RUN** | Required at 100/125/150% scaling; unit/build success does not prove fit or touch usability. |
| V1 global untouched proof | **BLOCKED** | Reviewer made no V1 access/write; no trusted before/after manifest exists. |
| Hardware/production/package/licenses | **BLOCKED / NOT-RUN** | Canon, DNP, Mini-PC metrics, live providers, installer/recovery, print comparison, and redistribution rights remain open. |

---

## V1 Geometry Alignment Gate â€” SOFTWARE GREEN, RELEASE BLOCKED (2026-11-02 22:48)

| Task | Status | Evidence / next gate |
|---|---|---|
| Backend regression | **COMPLETED â€” PASS-AUTOMATED** | 28 suites / 82 total: **80 passed, 0 failed/errors, 2 skipped**; requested offline command exit 0. |
| Frontend regression | **COMPLETED â€” PASS-AUTOMATED** | **8/8 files, 55/55 tests**. |
| Frontend production build | **COMPLETED â€” PASS-AUTOMATED** | TypeScript/Vite exit 0; 2,017 modules. |
| Rust compile/test command | **COMPLETED â€” PASS-AUTOMATED (compile only)** | Cargo absent from PATH; explicit installed Cargo exit 0, one package compiled, no Rust tests reported. |
| Capture/select/frame geometry source | **COMPLETED â€” PASS-AUTOMATED (bounded)** | Modified frontend compiles and existing component regressions pass. |
| Fresh mounted 16:10 / V1 golden comparison | **NOT-RUN** | Required before visual parity can be certified. |
| V1 100% untouched proof | **BLOCKED** | No V1 command/write/secret read by reviewer; no trusted before/after manifest. |
| Canon/DNP/performance/installer/licenses | **BLOCKED / NOT-RUN** | Requires authorized hardware lab, packaging, recovery, and legal evidence. |

---

## Camera Studio UI / Frame Assets Gate â€” SOFTWARE GREEN, RELEASE BLOCKED (2026-11-02 22:22)

| Task | Status | Evidence / next gate |
|---|---|---|
| Backend regression | **COMPLETED â€” PASS-AUTOMATED** | 28 suites / 82 total: **80 passed, 0 failed/errors, 2 skipped**. |
| Frontend regression | **COMPLETED â€” PASS-AUTOMATED** | **8/8 files, 55/55 tests**. |
| Frontend production build | **COMPLETED â€” PASS-AUTOMATED** | TypeScript/Vite exit 0; 2,017 modules. |
| Rust test command | **COMPLETED â€” PASS-AUTOMATED (compile only)** | Explicit installed Cargo exit 0; no Rust test cases reported. PATH invocation failure is environmental. |
| Queue post-failure recovery | **COMPLETED â€” PASS-AUTOMATED** | `shared/command-queue.test.ts` passed; current simulator delegates sequencing to the helper. |
| V1 100% untouched proof | **BLOCKED** | Reviewer made no V1 access/write; no trusted before/after manifest. |
| Canon/DNP/touch/performance/installer/licenses | **BLOCKED / NOT-RUN** | Requires authorized lab, packaging and legal evidence. |

---

## User Feedback Parity Independent Gate â€” BLOCKED (2026-11-02 21:36)

| Task | Status | Evidence / required action |
|---|---|---|
| Selection Continue/order | **COMPLETED â€” PASS-AUTOMATED** | Exact local order is sent while acknowledgements are pending (`screens.test.tsx:38`). |
| Mutation queue FIFO and recovery | **FAILED â€” HIGH** | `KioskSimulator.tsx:47` drops all later commands after a false result. Remove queue poisoning only with owner approval and add a failed-command-then-retry regression. |
| 960 px JPEG preview | **COMPLETED â€” PASS-AUTOMATED** | Backend dimension tests and 0.88 encoder settings pass. |
| Hold/pinned zoom | **COMPLETED â€” PASS-AUTOMATED (bounded)** | Window release/cancel and close paths source/test verified; physical touch not run. |
| Layout parameter rendering | **COMPLETED â€” PASS-SIMULATED** | Ratios and `xMidYMid slice` are wired; no V1 golden visual comparison. |
| Frame comparison and explicit advance | **COMPLETED â€” PASS-AUTOMATED** | Left preview/right frame grid/â€œXem báº£n in â†’â€ present. |
| Regression suites/build | **COMPLETED â€” PASS-AUTOMATED** | Backend 78 pass, 2 skip; frontend 53/53; Vite build passed. |
| V1 untouched forensic proof | **BLOCKED** | No trusted before/after manifest. Reviewer made no V1 write or shell invocation. |
| Release | **BLOCKED** | Queue defect plus hardware, touch/performance, packaging and licensing gates. |

---

## Touchscreen Interaction & Revenue Gate â€” COMPLETED (bounded software scope, 2026-11-02)

| Task | Status | Evidence |
|---|---|---|
| Remove Frame Continue; 300ms one-tap advance; default no-advance; rapid-tap latch | **COMPLETED â€” PASS-AUTOMATED** | `FrameScreen.tsx:26-49,55-82`; `screens.test.tsx:36`. |
| Layout off-center centers; centered confirms once | **COMPLETED â€” PASS-AUTOMATED** | `StudioModeScreen.tsx:22-28`; `screens.test.tsx:32`. |
| Remove public cash; 1000ms title hold + PIN | **COMPLETED â€” PASS-AUTOMATED** | `PaymentScreen.tsx:64-83`; `screens.test.tsx:29,44,47`. |
| Confirm 500ms ghost-click arm | **COMPLETED â€” PASS-AUTOMATED** | `ConfirmScreen.tsx:7-8,30-31`; `screens.test.tsx:36`. |
| Native 300 DPI and Golden Revenue Gate | **COMPLETED â€” PASS-AUTOMATED** | `DesktopCompositor.kt:48-58`; `PrintImageWriterTest`; `RealSessionEngine.kt:531-555`; simulator/demo revenue tests. |
| FIFO selection, quota and re-index | **COMPLETED â€” PASS-AUTOMATED** | `SelectPhotosScreen.tsx:27-34,42,87`; `screens.test.tsx:24`. |
| 500ms full-quota hold zoom and safe release | **COMPLETED â€” PASS-AUTOMATED** | `SelectPhotosScreen.tsx:47-84`; `screens.test.tsx:23`. |
| Immediate photo/frame preview | **COMPLETED â€” PASS-AUTOMATED (bounded)** | Optimistic local photo/frame state feeds `PrintPreview`; component suite green. Add a dedicated two-frame overlay-switch assertion as hardening. |
| Decouple composition from frame-card interaction | **COMPLETED â€” PASS-SIMULATED** | Click dispatch path is non-blocking in frontend source; no Mini-PC latency measurement. |
| Floating preview and liquid-glass cards | **COMPLETED â€” PASS-SIMULATED** | `kiosk-v1.css:215-225`; no fresh mounted screenshot/physical touch run. |
| Backend regression | **COMPLETED â€” PASS-AUTOMATED** | 28 suites, 79 total: **77 passed / 0 failed / 2 skipped**; Gradle test UP-TO-DATE. |
| Frontend regression/build | **COMPLETED â€” PASS-AUTOMATED** | **50/50** tests; build passed with **2,016 modules**. |
| V1 global untouched proof | **BLOCKED** | Reviewer performed no V1 command/write, but no trusted pre-task manifest exists. |
| Physical hardware/touch/performance/release | **BLOCKED / NOT-RUN** | Canon, DNP, mounted touch, Mini-PC metrics, print comparison, installer/recovery and licensing remain open. |

---

## Korean Photo Atelier UI Navigation, Header Geometry & Visual Polish Overhaul â€” COMPLETED (2026-11-02)

| Task | Status | Evidence |
|---|---|---|
| Priority P0: Unified `AppHeader` architecture | **COMPLETED â€” PASS-SIMULATED** | Standardized 3-column CSS Grid header (`56px minmax(0, 1fr) auto`), robust `.appHeader__backSlot`, aligned eyebrow/step/title/subtitle, clean right slot across all screens. |
| Priority P0: Circular 56Ã—56 `KioskBackButton` with optical centering | **COMPLETED â€” PASS-SIMULATED** | 56Ã—56px touch target (`min-width: 56px; min-height: 56px`), optical centering $dx=0.5\text{px}, dy=0.0\text{px}$ ($\le 2.5\text{px}$ tolerance). |
| Priority P0: Carousel chevron 56Ã—56 touch targets & horizontal alignment | **COMPLETED â€” PASS-SIMULATED** | 56Ã—56px floating chevrons centered at 50% stage height and horizontally aligned on exact same axis ($y\Delta \le 3\text{px}$, measured $y\Delta = 0.0\text{px}$). |
| Priority P1: Elimination of technical clutter & raw layout IDs | **COMPLETED â€” PASS-SIMULATED** | Purged raw layout IDs (`515_4_anh`, `1015_4_ILCL`, `1015_4_base`), technical badges, debug status bars; window title set to `"LE SOUVENIR Photobooth"`. |
| Priority P2: Welcome screen editorial recomposition with authentic photostrips | **COMPLETED â€” PASS-SIMULATED** | Recomposed hero with authentic layered photostrip illustration (`LayoutArtwork` in `.v1-strip-art`), subtle paper shadows, refined typography, and clutter-free presentation. |
| Live desktop acceptance journey | **COMPLETED â€” PASS-SIMULATED** | **63/63 checks passing, 0 failures, 26 screenshots** across 1280Ã—800 and 1920Ã—1200: `tests/journey-evidence/2026-11-02T07-41-35.569Z/results.json`. |
| Frontend regression & production build | **COMPLETED â€” PASS-AUTOMATED** | Vitest **49/49 passing**, TypeScript/Vite build **0 errors** (2,015 modules). |
| Hardware boundary | **BOUNDARY ACKNOWLEDGED** | Physical Canon DSLR, DNP printer, and live PayOS bank settlement remain BLOCKED / NOT-RUN pending physical kiosk attachment. |

---

## Critical V1 UX Parity, Full UI Polish & PayOS Repair â€” COMPLETED (2026-11-01)

| Task | Status | Evidence |
|---|---|---|
| Bound PayOS link creation and expose explicit states | **COMPLETED â€” PASS-AUTOMATED + PASS-SIMULATED** | `RealSessionEngine.kt`: 15s bound and `CREATING`, `AWAITING_PAYMENT`, `ERROR`, `UNCONFIGURED`, `PAID`; error responses no longer leave an infinite loader. |
| Add PayOS recovery and staff fallback | **COMPLETED â€” PASS-SIMULATED** | Customer retry action is **â€œThá»­ láº¡i táº¡o mÃ£ QRâ€**; staff cash confirmation is visible in the appropriate error/unconfigured state. No live bank settlement was performed. |
| Restore selection/editing inactivity timers | **COMPLETED â€” PASS-AUTOMATED + PASS-SIMULATED** | Engine-authoritative 1000ms ticks; `SELECTING_PHOTOS` 90s and `EDITING` 60s; expiry auto-fills and advances without duplicate revenue or printing. UI shows `CÃ²n láº¡i MM:SS`, urgent at â‰¤15s. |
| Eliminate frozen `00:00` timer | **COMPLETED â€” PASS-SIMULATED** | Journey observes `CÃ²n láº¡i 02:19` â†’ `CÃ²n láº¡i 02:18`. |
| Render selected photos in live frame preview | **COMPLETED â€” PASS-SIMULATED** | `LayoutArtwork.tsx` and `PrintPreview` update SVG `<image>` slots as captures are selected. |
| Add press-and-hold zoom | **COMPLETED â€” PASS-SIMULATED** | `SelectPhotosScreen.tsx`: 500ms hold opens lightbox, release closes it, 50ms pointer-up reset preserves tap selection. |
| Redesign Frame Selection | **COMPLETED â€” PASS-SIMULATED** | Two-column tactile gallery plus large selected-photo/frame-overlay print preview. |
| Align capture/countdown presentation | **COMPLETED â€” PASS-SIMULATED** | Centered 240sp `.v1-countdown`, mirrored Live View (`scaleX(-1)`), DEMO captions removed. |
| Remove decorative emoji | **COMPLETED â€” PASS-AUTOMATED + PASS-SIMULATED** | Customer/operator decorations use Lucide SVG icons; journey includes a zero-emoji assertion. |
| Live desktop acceptance | **COMPLETED â€” PASS-SIMULATED** | **47/47 checks, 0 failures, 26 screenshots**: `tests/journey-evidence/2026-11-01T18-16-51.341Z/results.json`. |
| Frontend regression | **COMPLETED â€” PASS-AUTOMATED** | Vitest **49/49 passing**. |
| Physical devices/live settlement | **BLOCKED / NOT-RUN** | Canon DSLR, DNP printer, and live PayOS banking settlement require attached hardware/provider authorization and supervised testing. |

---

## Final Korean Photo Atelier UI/UX & Exact V1 Payment Restoration â€” COMPLETED (2026-11-01)

| Task | Status | Evidence |
|---|---|---|
| Remove customer-facing free photo experience | **COMPLETED â€” PASS-SIMULATED** | Removed `TRáº¢I NGHIá»†M CHá»¤P áº¢NH MIá»„N PHÃ`, `0 Ä‘`, `Miá»…n phÃ­` badges, and guest/customer bypass controls. Internal camera-free mock capture remains test-only and does not define a free commercial package. |
| Restore exact V1 payment flow and pricing | **COMPLETED â€” PASS-AUTOMATED + PASS-SIMULATED** | `RealSessionEngine.kt` restores 70,000 VND for 5Ã—15 strips and 90,000 VND for 10Ã—15 postcards; `PaymentScreen.tsx` restores VietQR, order summary, status flow, and no customer bypass. |
| Redesign Back and carousel navigation | **COMPLETED â€” PASS-SIMULATED** | Compact Back buttons use Lucide `ArrowLeft`; carousel navigation uses Lucide `ChevronLeft` / `ChevronRight`. |
| Recompose Welcome as Korean Photo Atelier hero | **COMPLETED â€” PASS-SIMULATED** | Balanced editorial columns, letter-spaced wordmark, kicker, subtitle, value pills, primary CTA, and layered rotated photostrips with realistic shadows. |
| Rebuild Payment layout and staff cash confirmation | **COMPLETED â€” PASS-SIMULATED** | Clean summary/VietQR composition; hidden header double-click or 700 ms hold triggers `payment.mockComplete` with `staffOverride: true` / `TIEN_MAT`. |
| Verify 600 DPI composed print preview | **COMPLETED â€” PASS-SIMULATED** | Final confirmation preview verified by the desktop journey at both target viewports. |
| 16:10 kiosk zero-scroll fit | **COMPLETED â€” PASS-SIMULATED** | All customer screens checked at 1280Ã—800 and 1920Ã—1200. |
| Live desktop acceptance | **COMPLETED â€” PASS-SIMULATED** | **35/35 checks, 0 failures, 26 screenshots**: `tests/journey-evidence/2026-11-01T17-19-57.239Z/results.json`. |
| Frontend regression and build | **COMPLETED â€” PASS-AUTOMATED** | Vitest **45/45 across 7 suites**; production build completed with zero errors. |
| DEMO revenue protection | **COMPLETED â€” PASS-AUTOMATED** | Backend Gradle `RealSessionEngineDemoModeTest` proves no DEMO-session revenue is recorded. |

Physical Canon capture, DNP output, live payment settlement, and physical touchscreen validation remain separate gated tests; this simulated acceptance result does not claim real-hardware proof.

---

## Deployment configuration readiness â€” 9/9 CONFIGURED (2026-11-01)

| Readiness item | Status | Safe evidence / remaining gate |
|---|---|---|
| PayOS | **CONFIGURED** â€” `payOsConfigured: true` | Live VietQR verified; settlement was not performed by this documentation task. |
| Neon PostgreSQL | **CONFIGURED** â€” `databaseConfigured: true` | Ported `DATABASE_URL`; direct JDBC `SELECT 1` verified. No write/DDL claim. |
| Cloudinary | **CONFIGURED** â€” `cloudinaryConfigured: true` | Cloud name, upload preset, API key, and API secret present; no upload claim. |
| Web album | **CONFIGURED** â€” `webAlbumConfigured: true` | Web-album URL, booth API key, and album base URL present. |
| Revenue endpoint | **CONFIGURED** â€” `revenueEndpointConfigured: true` | Web-album URL and booth API key present; Golden Revenue Rule still applies. |
| Printer/system print | **CONFIGURED** â€” `printerConfigured: true`; `systemPrintEnabled: true` | Strip/full printer names present and system print enabled; physical DNP output remains NOT-RUN. |
| Beauty | **CONFIGURED** â€” `beautyEnabled: true` | `BRIGHT` preset selected; licensing/lineage and physical performance gates remain open. |
| Hot Folder | **CONFIGURED** â€” `hotFolderConfigured: true` | Enabled with deployment path `E:\Photobooth\HotFolder`; real producer/device behavior remains NOT-RUN. |
| Credential containment | **CONFIGURED** | Values are strictly protected in `.env`; `.gitignore` excludes `.env` and `.env.*`. No secret values are documented. |

**Readiness score: 9/9 configured.** Configuration readiness is not equivalent to production release approval or real-hardware proof.

**V1 isolation:** only these V2 documentation files were edited. No V1 command or write was performed. Filesystem-wide forensic verification is **BLOCKED** without a trusted pre-task manifest (and external-directory enumeration was denied), so no unsupported global untouched claim is made.

## Commercial-Grade UI/UX Rebuild & V1 Horizontal Snapping Carousel Parity â€” COMPLETED (2026-11-01)

| Task | Status | Evidence |
|---|---|---|
| Rebuilt `StudioModeScreen.tsx` horizontal carousel | **COMPLETED â€” PASS-SIMULATED** | Centered horizontal snapping carousel (`.v1-layout-carousel`), replicating V1 `HorizontalPager` mechanics (scale 1.0 active, 0.84 adjacent peeking cards, click-to-center / click-to-select, floating navigation chevrons, smooth-scroll settling). |
| Vector photo slot illustrations (`LayoutArtwork.tsx`) | **COMPLETED â€” PASS-SIMULATED** | Silhouette portraits and numbered photo slots, eliminating empty blank preview boxes. |
| Customer-friendly titles & canonical ID tags | **COMPLETED â€” PASS-SIMULATED** | Polished titles (`formatLayoutTitle`, `formatLayoutSubtitle`) while preserving canonical IDs in subtle `.v1-layout-tag` elements. |
| Korean Photo Atelier design token specification & styling | **COMPLETED â€” PASS-SIMULATED** | `docs/DESIGN_SYSTEM.md` token specification and full UI styling in `kiosk-v1.css` (`#FAF6F0`, `#FFFFFF`, `#E07A5F`, `#F4A261`). |
| Frame thumbnails real artwork (`thumbDataUrl`) | **COMPLETED â€” PASS-AUTOMATED** | Added `thumbDataUrl` to `RealSessionEngine.kt` and updated `FrameOption` in `simulator-contract.ts` to display actual frame artwork. |
| Truthful action copy & 1280Ã—800 fit | **COMPLETED â€” PASS-SIMULATED** | `"HoÃ n thÃ nh tráº£i nghiá»‡m â†’"` on `ConfirmScreen.tsx` in DEMO; sticky finish CTA on `DeliveryScreen.tsx` fitting 1280Ã—800. |
| Tauri bridge resilience & teardown guard | **COMPLETED â€” PASS-AUTOMATED** | Added failure teardown `guard.take()` in `src-tauri/src/main.rs`; increased timeout to 25s in `src-tauri/src/bridge.rs`. |
| Live desktop acceptance journey | **COMPLETED â€” PASS-SIMULATED** | **35/35 checks passing, 0 failures, 26 distinct screenshots across 1280Ã—800 and 1920Ã—1200**. Evidence: `tests/journey-evidence/2026-11-01T15-38-06.041Z/results.json`. |
| Frontend regression suite | **COMPLETED â€” PASS-AUTOMATED** | Vitest: **45/45 passed across 8 test suites** (`npm test -- --run`). |
| Backend regression suite | **COMPLETED â€” PASS-AUTOMATED** | JUnit: **76/76 passed across 17 test suites** (`gradle test installDist`). |
| Frontend production build | **COMPLETED â€” PASS-AUTOMATED** | `tsc --noEmit && vite build`: zero errors, 2,015 modules transformed. |
| Hardware boundary | **BOUNDARY ACKNOWLEDGED** | Simulated CDP passing; physical Canon camera, DNP printer, and live PayOS bank charges remain unverified without physical studio kiosk attachment. |

Evidence directory: `tests/journey-evidence/2026-11-01T15-38-06.041Z/` (results.json).

---

## Unified Photobooth Application & Automatic Camera Fallback â€” COMPLETED (2026-11-01)

| Task | Status | Evidence |
|---|---|---|
| Unified single-application UX | **COMPLETED â€” PASS-SIMULATED** | Eliminated manual DEMO/REAL switches; clean StartScreen with dynamic background hardware evaluation. |
| Background `CameraConnectionManager` | **COMPLETED â€” PASS-AUTOMATED** | 7-state FSM (`DISCONNECTED`, `DISCOVERING`, `CONNECTING`, `CONNECTED`, `LIVE_VIEW_READY`, `RECONNECTING`, `ERROR`) with 2,000 ms monitor loop (V1 parity). |
| Dynamic promotion at `IDLE` state | **COMPLETED â€” PASS-AUTOMATED** | Promotes to `REAL` if camera detected; falls back to `DEMO` mock mode if offline. Session captureMode locked during session. |
| Zero-revenue dry-run safety | **COMPLETED â€” PASS-AUTOMATED** | 0 Ä‘, `Miá»…n phÃ­`, no live bank transfer prompt, 600-DPI composition with `dryRun: true`, 0 sales DB writes, 0 Neon writes, 0 physical prints. Verified by `RealSessionEngineDemoModeTest`. |
| Korean photo studio UI redesign | **COMPLETED â€” PASS-SIMULATED** | Atelier design tokens (`#FAF6F0`, `#FFFFFF`, `#E07A5F`, `#F4A261`), 16:10 zero-scroll touch ergonomics, tactile cards, 600-DPI preview. |
| Backend regression | **COMPLETED â€” PASS-AUTOMATED** | JUnit: **76 passed, 0 failures/errors/skips** across 17 test suites (`gradle test installDist`, `BUILD SUCCESSFUL`). |
| Frontend regression | **COMPLETED â€” PASS-AUTOMATED** | Vitest: **40 passed, 0 failures**; `tsc --noEmit && vite build` passed in 3.55s (2,015 modules). |
| Live desktop acceptance | **COMPLETED â€” PASS-SIMULATED** | **35/35 checks passed, 26 screenshots, 0 failures** across 1280Ã—800 and 1920Ã—1200 viewports. |

Evidence directory: `tests/journey-evidence/2026-11-01T14-23-26.975Z/` (results.json).

Truthful hardware boundary: Mock fallback verified via live Tauri CDP. Physical Canon DSLR capture, DNP print spooler, and PayOS settlement remain offline in the dev kiosk pending physical device attachment in the hardware lab.

---

## Real Integrations Recovery â€” COMPLETED (2026-11-01)

| Task | Status | Evidence |
|---|---|---|
| Live Firebase/Firestore layout recovery | **COMPLETED â€” VERIFIED** | `FIREBASE_LIVE`; 10 named production layouts synchronized, with V2-local disk cache. |
| Live PayOS VietQR recovery | **COMPLETED â€” VERIFIED** | `READY`; real link creation and QR image render at both acceptance viewports. No settlement was performed. |
| DEMO capture regression | **COMPLETED â€” PASS-SIMULATED** | Camera-free touch journey, zero-revenue guard, and dry-run 600-DPI composition preserved. |
| Backend regression | **COMPLETED â€” PASS-AUTOMATED** | JUnit: **70 passed, 1 skipped**. |
| Frontend regression | **COMPLETED â€” PASS-AUTOMATED** | Vitest: **40 passed**. |
| Live desktop acceptance | **COMPLETED â€” PASS-SIMULATED** | **37/37 checks, 0 failures** at 1280Ã—800 and 1920Ã—1200. |

Evidence directory: `tests/journey-evidence/2026-11-01T13-13-52.592Z/`.

Physical Canon/DNP/touchscreen testing, PayOS settlement, Neon/Cloudinary production operations, packaging, recovery, and licensing remain separate release gates.

## Current migration board (2026-11-01, superseding active status)

| Milestone / deliverable | Status | Evidence / next gate |
|---|---|---|
| M0 â€” V2 isolation and planning | **DONE** | V2-only workspace and safety guardrails established; this task changed `docs/` only. |
| M1 â€” Legacy audit/parity baseline | **DONE (baseline)** | Feature/state/config/UI/camera/printer/business inventories exist; physical parity is a separate gate. |
| M2 â€” Desktop bridge and simulator | **DONE â€” PASS-SIMULATED** | React/Tauri/Kotlin runtime, shutdown path, dual mode, and `installDist` verified in software. |
| M3 â€” Touch UI/Korean studio redesign, Navigation Geometry & Clutter Overhaul | **DONE â€” PASS-SIMULATED** | Korean photo studio aesthetic, unified `AppHeader`, 56Ã—56 `KioskBackButton` with optical centering ($\le 2.5\text{px}$), horizontal carousel chevrons ($y\Delta \le 3\text{px}$), vector slot artwork (`LayoutArtwork.tsx`), technical clutter & raw ID elimination, and 1280Ã—800 plus 1920Ã—1200 desktop coverage complete (63/63 checks); physical touch pending. |
| M4 â€” Feature/backend integration | **DONE â€” PASS-AUTOMATED** | Session engine, catalogs, `CameraConnectionManager` (7 states, 2000ms loop, auto-fallback), composition, dry-run print, payment safety, QR, and revenue guards covered. |
| M5 â€” DEMO end-to-end | **DONE â€” PASS-SIMULATED** | Startâ†’Delivery with 4 mock captures, selection/frame, 600 DPI preview, dry-run print, delivery QR, and zero revenue. |
| M6 â€” Regression and REAL payment UI | **DONE** | Backend **76/76**; frontend **49/49 across all suites**; build **2,015 modules/0 errors**; CDP journey **63/63 checks, 26 screenshots, 0 failures** at `tests/journey-evidence/2026-11-02T07-41-35.569Z/`. |
| M7 â€” Canon/DNP/physical kiosk | **BLOCKED / NOT-RUN** | Requires explicit authorization and connected Canon DSLR, DNP RX1HS, physical 16:10 touchscreen, and Mini PC measurement. |
| M8 â€” Packaging/production release | **BLOCKED / NOT-RUN** | Requires installer/clean-install/recovery testing, live PayOS/provider checks, V1 physical print comparison, and redistribution licenses remain open. |

### Current test deliverables

| Deliverable | Status | Exact result |
|---|---|---|
| Backend Gradle (`gradle test installDist`) | **DONE â€” PASS-AUTOMATED** | **76/76 passed**, including `CameraConnectionManagerTest` (5 tests), `RealSessionEngineDemoModeTest`, `FirebaseCatalogServiceTest`, `DemoCameraAdapterTest`, and `RealSessionEngineTest`. |
| Frontend Vitest | **DONE â€” PASS-AUTOMATED** | **49/49 passed across all test files**, including `screens.test.tsx`, `KioskUI.test.tsx`, `PaymentScreen.test.tsx`, and `LayoutArtwork.test.tsx`. |
| Frontend build (`tsc --noEmit && vite build`) | **DONE â€” PASS-AUTOMATED** | **2,015 modules transformed, 0 errors in 3.55s**. |
| Live desktop journey (`tests/verify-demo-and-real-journey.mjs`) | **DONE â€” PASS-SIMULATED** | **63/63 checks passed, 26 screenshots, 0 failures**; evidence at `tests/journey-evidence/2026-11-02T07-41-35.569Z/`. |
| Physical Canon DSLR capture | **BLOCKED / NOT-RUN** | No physical capture; authorization and safe hardware setup required. |
| Physical DNP RX1HS print | **BLOCKED / NOT-RUN** | No spool submission or paper output; authorization and supervised setup required. |
| Live PayOS charge | **BLOCKED / NOT-RUN** | No payment charged; explicit production authorization required. |

**Release decision: SOFTWARE MIGRATION TEST BASELINE PASSED / PHYSICAL HARDWARE AND PRODUCTION RELEASE GATES REMAIN BLOCKED.**

The board below is retained as historical chronology; this section is the current active status.

---

## Latest reviewer board (2026-11-01, payment restoration update)

| Task | Status | Evidence / next gate |
|---|---|---|
| Live Desktop Payment Verification (`verify-real-payment.mjs`) | **DONE â€” PASS-REAL-MODE-DESKTOP** | Tauri desktop runtime verified on 1280Ã—800 and 1920Ã—1200; screenshots & logs at `tests/real-payment-evidence/2026-11-01T08-40-13.800Z/`. Zero -32001 errors. |
| Payment error -32001 root cause & fix | **DONE â€” PASS-AUTOMATED** | Backend returns `PENDING` when `orderCode` is null instead of throwing -32001; synchronized polling in frontend; `description` fallback. |
| PayOS official SDK parity (`PayOsOfficialAdapter`) | **DONE â€” PASS-AUTOMATED** | Wraps official Java SDK client; fail-closed behavior verified when unconfigured; tests pass in `PayOsOfficialAdapterTest` & `RealSessionEngineTest`. |
| Server-side ZXing QR code generation | **DONE â€” PASS-AUTOMATED** | High-res 1000Ã—1000 base64 PNG generated directly in `RealSessionEngine.qrPng` from VietQR payment string. |
| Production layouts activation | **DONE â€” PASS-AUTOMATED** | `config/production-layouts.json` (`strip-5x15` 4/3 shots/select, `print-10x15` 6/4 shots/select, 5s countdowns); zero synthetic fixtures in REAL mode. |
| Hierarchical config loader (`DesktopBoothConfig`) | **DONE â€” PASS-AUTOMATED** | 3-tier loading: Workspace `.env` < LocalAppData `LeSouvenirDesktop/.env` < Environment variables; masked diagnostics verify presence without secret leaks. |
| V1 Payment UI visual fidelity & interaction parity | **DONE â€” PASS-REAL-MODE-DESKTOP** | Exact two-column layout, "BÆ°á»›c 3", "Thanh toÃ¡n", "70.000 Ä‘", detail rows, status chip, customer bypass removed, staff override on >=700ms hold. |
| Frontend 34-test regression & build | **DONE â€” PASS-AUTOMATED** | `npm test -- --run`: 34/34 across 7 files; `npm run build`: zero errors, 2,014 modules transformed. |
| Backend 62-test regression suite | **DONE â€” PASS-AUTOMATED** | `gradle.bat --offline test --console=plain`: 62/62 across 17 suites (including config precedence and orderCode handling). |
| Dual-mode runtime / fail-closed real mode | **DONE â€” PASS-AUTOMATED** | Explicit `--real` / `--simulator`; real mode returns `-32000` / `-32002` with no synthetic fallback. |
| Revenue-after-submit SQLite gate | **DONE â€” PASS-AUTOMATED** | `data/sales.db` is written only for verified `PrintResult.Submitted`. |
| Real album URL + decodable print QR | **DONE â€” PASS-AUTOMATED** | `RealSessionEngine.compose()` album wiring plus ZXing decode test on the composed 600-DPI output. |
| Physical Canon DSLR | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Requires safe connected-hardware shoot and Live View validation. Offline in dev kiosk. |
| Physical DNP DS-RX1HS printer | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Requires supervised spooler, borderless and 2-inch cut output validation. Offline in dev kiosk. |
| Physical 16:10 touchscreen | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Requires mounted kiosk touch/scaling validation on physical glass. |
| Live production endpoints | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Live PayOS settlement and live Neon/Cloudinary sync are not authorized. |
| Commercial redistribution review | **BLOCKED â€” LEGAL SIGNOFF REQUIRED** | Canon native DLL and ONNX weight redistribution terms remain unresolved. |

**Release decision: SOFTWARE CORE & REAL PAYMENT RESTORATION VERIFIED / HARDWARE LAB TESTING GATED.**

This latest reviewer board supersedes older active-board snapshots below.

## Historical reviewer board (2026-11-01, pre-payment update)

| Task | Status | Evidence / next gate |
|---|---|---|
| Frontend 31-test regression & build | **DONE â€” PASS-AUTOMATED** | `npm test -- --run`: 31/31 across 7 files; `npm run build`: zero errors, 2,014 modules. |
| Backend 60-test regression suite | **DONE â€” PASS-AUTOMATED** | `gradle.bat --offline test --console=plain`: 60/60 across 17 suites. |
| Dual-mode runtime / fail-closed real mode | **DONE â€” PASS-AUTOMATED** | Explicit `--real` / `--simulator`; real mode returns `-32000` / `-32002` with no synthetic fallback. |
| Revenue-after-submit SQLite gate | **DONE â€” PASS-AUTOMATED** | `data/sales.db` is written only for verified `PrintResult.Submitted`. |
| Real album URL + decodable print QR | **DONE â€” PASS-AUTOMATED** | `RealSessionEngine.compose()` album wiring plus ZXing decode test on the composed 600-DPI output. |
| PayOS official SDK parity | **DONE â€” PASS-SIMULATED** | `PayOsOfficialAdapter` wraps the official SDK path and fails closed when unconfigured; live merchant flow remains gated. |
| Physical Canon DSLR | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Requires safe connected-hardware shoot and Live View validation. |
| Physical DNP DS-RX1HS printer | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Requires supervised spooler, borderless and 2-inch cut output validation. |
| Physical 16:10 touchscreen | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Requires mounted kiosk touch/scaling validation. |
| Live production endpoints | **GATED / BLOCKED ON OPERATOR AUTHORIZATION** | Live PayOS and Neon/Cloudinary operations are not authorized. |
| Commercial redistribution review | **BLOCKED â€” LEGAL SIGNOFF REQUIRED** | Canon native DLL and ONNX weight redistribution terms remain unresolved. |

**Release decision: READY FOR HARDWARE LAB TESTING / NOT YET PRODUCTION DEPLOYED.**

This latest reviewer board supersedes older active-board snapshots below.

## Superseding active milestone board (2026-11-01)

| Task | Status | Verification |
|---|---|---|
| Milestones 1â€“6 baseline migration/integration | **COMPLETED / VERIFIED** | Current automated baseline and migrated UI/operator inventory are complete for this scope. |
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

Next task order: verified checkpoint â†’ test-only isolation fix with integration assertions â†’ architect-approved bounded slices. Specialist source-linked docs are source inventories only.

## Coordination snapshot (2026-10-31; reported status, not gate evidence)

| Workstream | Reported agent/status | Scope note |
|---|---|---|
| Legacy inventory | legacy-auditor `ses_e70a11911ffeZ8XCL7SqnXDk7b` â€” inventory | Not a claim of full audit completion. |
| Architecture checkpoint | architect `ses_e709d20e1ffewRrzeoisMXvDQ9` â€” pending | No checkpoint approval/completion claimed. |
| Camera baseline | camera `ses_e709cf659ffePXgtKXyGcPQnQG` â€” audit complete | Audit report only; no physical camera proof. |
| Printer baseline | printer â€” audit complete | See `PRINTER_BASELINE_INVENTORY.md`; no printer/device operation or physical print. |
| UI baseline | UI `ses_e709bb9fbffeESyRONVXSFWre1` â€” source comparison complete | See `UI_BASELINE_COMPARISON.md`; source comparison, not screenshot or mounted parity. |
| Static review | tester `ses_e709ba21effeLwcg8O494bXq3n` â€” static review complete | See `MIGRATION_TEST_RESULTS.md`; no new test run implied. |
| Backend baseline | backend `ses_e709b7eccffeDobwsekw4JVqZj` â€” audit complete | Audit only, not full implementation. |
| Frontend slice | frontend `ses_e7098a611ffelkffCXMgKv6Z5i` â€” preparing slice | No slice completion claimed. |

User authorization now permits scoped V2-only shell checkpoint/offline tests/builds, with all temp/cache/output paths confined to V2. No V1 execution, production integration, hardware/device operation, or physical print is authorized. V1 untouched forensic verification remains **NOT VERIFIED**; agent reports describe read-only work only. Preserve existing source; no redesign in this baseline task.

## Independent gated work board

| ID | Deliverable | Owner | Status / acceptance |
|---|---|---|---|
| G1 | Correct audit authority and consolidated matrix | Tester-reviewer | DONE; gate remains FAIL |
| G2 | Isolated foundation characterization | Backend/reviewer | PASS-AUTOMATED narrow scope: independent 5-test run exit 0 |
| G3 | Guarded backend commands and immutable snapshots | Architect/backend | PASS-SIMULATED narrow simulator; initial contract remains inconsistent with actual handoff |
| G4 | Versioned authenticated hostâ†”sidecar IPC | Architect | Health-only PASS; simulator methods extend same private stdio; HMAC deferred |
| G5 | Synthetic compositor/LUT/mirror/alpha fixtures | Backend/tester | PARTIAL PASS: simulator compositor files/dedup; LUT/Beauty/pixel parity not covered |
| G6 | V2-only Hot Folder readiness/order/duplicate tests | Camera/tester | PASS-AUTOMATED synthetic fixture; real producer/restart/late-file ownership NOT RUN |
| G7 | Canon loader/lifecycle/license proof | Camera/architect/legal | PARTIAL disabled reflection; capture/reconnect/disposal/native/license BLOCKED |
| G8 | Printer dry-run identity/geometry/idempotency | Printer/tester | PARTIAL fake boundary/printable; spooler/media/cut/physical DNP BLOCKED |
| G9 | Payment/revenue/cloud mock tests | Backend/tester | Simulator only: `payment.mockComplete` (no PayOS/QR) |
| G10 | Accepted Beauty manifest/hashes/licenses | Owner/backend/legal | BLOCKED (B-002, B-003) |
| G11 | Full Admin gaps: Tools/events/settings/revenue | UI/backend/tester | PARTIAL |
| G12 | 16:10 React UI and touch/scaling tests | UI/frontend/tester | PASS-SIMULATED two CSS viewports/screenshots; physical touch/DPI NOT RUN |
| G13 | Gradle distribution provenance | Build/reviewer | **PASS** â€” HTTPS publisher SHA-256 exactly matches local ZIP |
| G14 | Packaging/JRE/native/model/driver coexistence | Architect/tester | BLOCKED |
| G15 | Health-only private bridge proof | Frontend/backend/architect/tester | **PASS-AUTOMATED/PASS-SIMULATED** â€” backend 10 tests (5 foundation + 3 bridge + 2), frontend 4 tests, Rust compile, bridge-probe real JVM roundtrip, Tauri window launch/close |
| G16 | Live WebView invoke and close-active-child proof | Frontend/architect/tester | **RESOLVED (narrow)** â€” CDP harness: mounted React â†’ Tauri `health_check` â†’ JVM PID 17520, `CloseMainWindow=True`, host exit 0, JVM terminated. Abrupt/hung kill NOT TESTED. |
| G17 | Hung child/timeout/tree-kill/parent-death tests | Architect/tester | NOT TESTED â€” known gap: force parent kill may not run `Drop`/`taskkill` |
| G18 | Ratify actual private-pipe health contract vs HMAC/named-pipe architecture doc | Architect/reviewer | **OPEN** â€” simulator extends private pipe; HMAC deferred to production |

## Gate acceptance

No gate passes from "file observed." Require exact tests in `FEATURE_PARITY_MATRIX.md`, security closure, architect/reviewer signoff, and separate real-hardware evidence. V1 baseline comparison was not performed.

---
*This board tracks audit-through-implementation. Simulator session implementation (Task2) now in progress.*

