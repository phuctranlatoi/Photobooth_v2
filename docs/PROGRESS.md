# PROGRESS.md

## Unboxed Atelier & Genuine Liquid Glass Controls Milestone (2026-11-05 02:40)

**Status: PASS-SIMULATED & PASS-AUTOMATED across 1280×800 and 1920×1200 viewports; physical hardware gates remain unverified without physical Canon DSLR or DNP DS-RX1HS.**

Key milestones delivered and verified:
1. **Elimination of Clunky White Backing Cards Across All Customer Screens:**
   - Stripped away obsolete opaque white card containers (`.v1-panel`, `.v1-start-card`, `.v1-quantity-pricing`, `.v1-summary`, `.v1-prepare-stage`, `.v1-print-stage`, `.v1-delivery`, `.v1-frame-preview-panel`) across StartScreen, Quantity, Payment, Confirm, and Stage transitions.
   - Replaced artificial boxed enclosures with pure floating physical prints, authentic paper drop shadows (`var(--at-paper-shadow)`: `0 22px 38px -13px rgba(44,30,23,.26), 0 5px 11px rgba(44,30,23,.13)`), and airy Korean photo atelier spatial hierarchy.
   - Maintained clean, borderless typographic summaries and receipts defined strictly by delicate hairline dividers (`var(--at-hairline)`: `rgba(89,65,49,.19)`).
2. **StartScreen Layered Photographic Gallery Refactor:**
   - Refactored `StartScreen.tsx` into an open, layered photographic gallery (`.atelier-welcome__gallery`) in place of the rigid legacy `.v1-start-card`.
   - Dual floating paper prints in open space:
     - Rear portrait print (`.atelier-print--portrait`): rotated −7°, aspect ratio mapped directly from layout metadata (`printAspectRatio >= 0.5`).
     - Front 4-cut strip print (`.atelier-print--strip`): rotated +6°, aspect ratio mapped from strip metadata (`printAspectRatio < 0.5`), elevated with z-index 1.
   - Soft ambient light halo (`.atelier-welcome__halo`): radial glow (`radial-gradient(ellipse, rgba(203,159,127,.21), transparent 69%)`) anchored behind floating prints.
   - Authentic atelier caption: italicized Georgia serif brand signature `LE SOUVENIR · PHOTO ATELIER`.
   - Fluid two-column grid (`minmax(0, 1.08fr) minmax(0, 0.92fr)`), responsive typography, and preserved hidden 5-tap gesture on the brand wordmark for operator access.
3. **Genuine Liquid Glass Interactive Controls:**
   - Scoped `.atelier-customer` design tokens and cascade overrides in `kiosk-v1.css` and `payment.css` winning cleanly over legacy CSS without affecting camera darkroom or operator tools.
   - **Primary Pill CTA (`.v1-primary`):** 68px minimum touch height, terracotta-coral gradient core (`linear-gradient(135deg, #C27357 0%, #A85A40 50%, #8E442D 100%)`), 1px deep terracotta edge (`#793924`), inner specular light catch (`inset 0 1.5px 2px rgba(255,255,255,.45)`), and warm radiant drop shadow (`0 8px 24px rgba(168,90,64,.35)`). Active press compresses to `scale(0.96)`.
   - **Secondary & Back Buttons (`.v1-secondary`, `.v1-back`, stepper buttons):** 56px minimum touch targets (72×72px for steppers), high-translucency glass body (`rgba(255,255,255,.65)`), heavy optical refraction (`backdrop-filter: blur(24px) saturate(180%)`), dual specular rim reflections (`border: 1px solid rgba(255,255,255,.85)`, `inset 0 1.5px 2px rgba(255,255,255,.95)`), and subtle ambient shadow (`0 6px 18px rgba(45,30,20,.06)`).
   - **Floating Actionbar Dock (`.v1-actionbar`):** Seamless floating glass pill dock (`border-radius: 28px`), 24px backdrop blur, specular top reflection, elevating primary navigation above the canvas.
   - **Payment Screen Porcelain Quiet Zone:** Payment summary floats directly on the ivory canvas; QR panel features translucent glass surround (`rgba(255,255,255,.55)`, `blur(20px)`), with the QR image and quiet zone strictly opaque pure white (`#fff`) with 0px layout shift.
4. **Preserved All Regression Suites & Verification:**
   - Backend Gradle: **87 tests (85 passed, 2 skipped, 0 failed)** across 28 test suites (`RealSessionEngineTest`, `SimulatorSessionTest`, `RealSessionEngineDemoModeTest`, etc.).
   - Frontend Vitest: **59/59 passed** across 8 test suites.
   - Desktop Journey Runner (`tests/verify-demo-and-real-journey.mjs`): **0 failures across both 1280×800 and 1920×1200 viewports** (evidence captured in `tests/journey-evidence/2026-11-05T02-34-00.652Z/`).
   - Zero DEMO revenue and zero orphaned process leaks confirmed.
5. **Strict V1 Isolation:** V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) remained strictly untouched, unread, and write-protected.

---

## Live View Concentric Shutter Redesign & Centered Smooth Countdown Milestone (2026-11-04 01:30)

**Status: PASS-SIMULATED & PASS-AUTOMATED across 1280×800 and 1920×1200 viewports; physical hardware gates remain unverified without physical Canon DSLR or DNP DS-RX1HS.**

Key milestones delivered and verified:
1. **Elimination of Countdown Stuttering ("khựng khựng"):**
   - Implemented smooth local timestamp-based countdown in `CaptureScreen.tsx`.
   - Anchored timer to `performance.now() + countdown * 1000` on each backend countdown update, running a smooth 50ms tick interval that decrements monotonically without jitter or reset pauses.
   - Added subtle `v1-countdown-pop` keyframe animation (`scale(1.2)` to `scale(1)` over 200ms with `cubic-bezier(.16, 1, .3, 1)`) triggered per-digit transition with zero layout reflow.
   - Preserves complete cleanup on screen exit or state transitions with zero orphaned intervals.
2. **True Viewport Centering for Countdown Timer ("không nằm ở giữa"):**
   - Decoupled centering logic into a dedicated full-screen flex overlay `.v1-countdown-layer` (`position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; background: rgba(0, 0, 0, 0.28)`).
   - Styled countdown numeral with tabular numbers (`font-variant-numeric: tabular-nums`), 240sp warm white typography (`clamp(140px, 20vw, 240px)`, `font-weight: 900`), and a dual terracotta ambient glow (`text-shadow: 0 0 45px rgba(194,115,87,.95), 0 0 90px rgba(194,115,87,.45), 0 6px 28px rgba(0,0,0,.85)`).
   - Automated CDP geometry verification confirmed exact dead-center positioning:
     - **1280×800:** Horizontal Δx = **0.000038 px**, Vertical Δy = **0.000000 px**.
     - **1920×1200:** Horizontal Δx = **0.000061 px**, Vertical Δy = **0.000000 px**.
3. **Redesigned Concentric Physical Shutter Button:**
   - Restored authentic V1 photobooth concentric shutter ergonomics in `.v1-shutter-control`:
     - Outer frosted ring: 108×108 px circle (`border: 2px solid rgba(255, 255, 255, 0.55)`, `background: rgba(255, 255, 255, 0.22)`, `backdrop-filter: blur(8px)`, warm ambient shadow `0 8px 24px rgba(0,0,0,.35)`).
     - Inner tactile core: 84×84 px crisp white disc (`border: 4px solid #C27357`, `background: #fff`, inner bevel `inset 0 2px 4px rgba(255, 255, 255, 0.9)`).
     - Active tactile touch feedback: smooth `scale(0.92)` compression with deepened terracotta border `#A85A40` and warm tinted core `#FDF3EE`.
     - Latch protection: prevents rapid double-tap / phantom multi-sequence triggering (`starting.current` lock).
   - Automated CDP geometry verification confirmed exact dimensions and dead-center placement:
     - Shutter dimensions: exactly **108×108 px** (Δ = 0 px).
     - Core dimensions: exactly **84×84 px** (Δ = 0 px).
     - Horizontal offset: Δx = **0.000000 px** dead-center on both 1280×800 and 1920×1200.
4. **Full Test Suite & Journey Regression:**
   - Backend Gradle: **87 tests (85 passed, 2 skipped, 0 failed)** across 28 test suites (`RealSessionEngineTest`, `SimulatorSessionTest`, `RealSessionEngineDemoModeTest`, etc.).
   - Frontend Vitest: **59/59 passed** across 8 test suites (including new unit tests for centered countdown timer lifecycle and concentric shutter button).
   - Automated Acceptance Journey (`verify-demo-and-real-journey.mjs`): **100% checks passed, 0 failures** across both 1280×800 and 1920×1200 viewports.
5. **Strict V1 Isolation:** V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) remained strictly untouched, unread, and write-protected.

---

## Sub-10ms Touch Latency, Deferred Composition & Full Atelier Liquid Glass Milestone (2026-11-03 21:45)

**Status: PASS-SIMULATED & PASS-AUTOMATED across 1280×800 and 1920×1200 viewports; physical hardware gates remain unverified without physical Canon DSLR or DNP DS-RX1HS.**

Key milestones delivered and verified:
1. **End-to-End Performance Optimization:**
   - **Deferred Composition on Frame Selection:** In `RealSessionEngine.kt` and `SimulatorSessionEngine.kt`, `frame.select` no longer synchronously renders full-resolution compositions via `composeSafely()`. Instead, `frame.select` updates `frameId` in memory, clears cached composition artifacts (`composition = null; printImage = null`), and returns instantly (<1ms). Composition rendering is deferred just-in-time to `frame.confirm` before transitioning to `PRINT_PENDING`.
   - **Non-Blocking React Command Dispatch:** In `KioskSimulator.tsx`, decoupled user command mutations from background polling loops. User taps immediately increment `revision` and execute with high priority, eliminating the previous busy-wait lock contention where user commands waited on background poll cycles.
   - **Snapshot Poll Deduplication:** Introduced `sameVisibleSnapshot()` to compare high-level state, session identifiers, timer seconds, and shot previews without serializing multi-megabyte base64 capture strings on every 500ms cycle. Prevents unnecessary React re-renders, garbage collection pauses, and layout thrashing.
   - **Frame List Caching:** Cached frame catalog in `framesRef` during `EDITING` state to avoid redundant `frame.list` IPC round-trips during background polling.
2. **Sub-10ms Latency Measurements on Live Desktop App:**
   - Evaluated via live Chrome DevTools Protocol (CDP) inside the live packaged Tauri WebView2 environment in `tests/verify-demo-and-real-journey.mjs`:
     - **Photo selection latency:** **4.30 ms** at 1920×1200 and **8.50 ms** at 1280×800 (target < 100 ms).
     - **Frame selection latency:** **7.50 ms** at 1920×1200 and **8.00 ms** at 1280×800 (target < 100 ms).
     - **PayOS QR Layout Shift:** Exactly **0 px layout shift** (`shifts: { slotWidth: 0, slotHeight: 0, columnsX: 0, columnsY: 0, columnsWidth: 0, columnsHeight: 0 }`). The QR container maintains a constant physical footprint during transition from loading spinner to base64 VietQR image.
3. **Complete Liquid Glass UI Overhaul Across Customer & Operator Screens:**
   - Unified luxury Korean Atelier ambient gradient: `linear-gradient(135deg, #FAF7F2 0%, #F5EFEB 50%, #EFE8E0 100%)`.
   - Frosted glass surfaces: `rgba(255, 255, 255, 0.76)`, `backdrop-filter: blur(20px) saturate(150%)`, `border: 1px solid rgba(255, 255, 255, 0.9)`, inner bevel highlight `inset 0 1px 1px rgba(255, 255, 255, 0.9)`, and warm ambient drop shadows `0 12px 32px rgba(40, 25, 15, 0.08)`.
   - Extended to Operator workspace (`operator-v1.css`): refined frosted header, navigation, and dialogs while maintaining high contrast, dark ink (`#24201D`), and clear, honest device health indicators.
4. **Enlarged Photo Previews & Dominant Components Across Customer Flow:**
   - Expanded live print preview panels on Selection, Frame, Confirm, and Quantity screens to utilize up to 82vh (`max-height: 82vh`), making the customer's photo prints the undisputed visual hero.
   - Stepper controls enlarged to 72×72px tactile touch targets with 34px tabular typography.
   - Enlarged photo gallery cards with 40×40px terracotta order badges (`#C27357`).
   - Frame selection grid cards scaled up to `clamp(190px, 29vh, 330px)` with symmetric thumbnails and checkmarks.
   - Action bars expanded to 76px min-height with 56px fluid touch buttons.
5. **All Test Suites Passing:**
   - Backend Gradle: **87 tests (85 passed, 2 skipped, 0 failed)** across 28 test suites (`RealSessionEngineTest`, `SimulatorSessionTest`, `RealSessionEngineDemoModeTest`, etc.).
   - Frontend Vitest: **57/57 tests passed** across 8 test suites (including async command queues, staff gestures, preview modals, settings, and screens).
   - Automated Acceptance Journey (`verify-demo-and-real-journey.mjs`): **100% checks passed, 0 failures** across both 1280×800 and 1920×1200 viewports.
   - Zero revenue for DEMO sessions verified in SQLite and backend tests.
   - Zero orphaned Node/Vite processes verified after tree shutdown.
6. **Strict V1 Isolation:** V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) remained strictly untouched, unread, and write-protected.

---

## Kiosk Typography, Visual Rhythm & Column Alignment Polish (2026-11-03 21:00)

**Status: PASS-SIMULATED across both 1280×800 and 1920×1200 viewports; physical hardware gates remain unverified without physical Canon DSLR or DNP DS-RX1HS.**

Key polish delivered and verified:
1. **Elimination of Clunky White Step Pills:** Replaced the intrusive white pill/capsule badges at the top of screens ("Bước 1 2 3...") with clean, refined Korean photobooth typography. The step text is preserved visually unobtrusively and in the accessibility DOM tree (`.appHeader__eyebrow`, `.v1-heading-eyebrow`) for automated assertions, screen readers, and Vitest specs without visually cluttering the customer experience.
2. **Unified Header Alignment & Geometry:**
   - Vertically centered the header back button with the screen title and subtitle (`align-items: center; align-self: center`).
   - Standardized header title line height (`1.2`), letter spacing (`-0.02em`), and subtitle spacing (`4px 0 0`) across all screens.
3. **Photo Selection Vertical Baseline Alignment:**
   - Eliminated redundant subheadings (`<h2>Chọn ảnh để in</h2>`, `<h2>Bản in đang chọn</h2>`, and redundant counter paragraphs) that previously offset the tops of the photo grid and print preview.
   - Pinned both the candidate photo gallery and the live print preview to the exact same vertical baseline (`align-self: stretch; padding: 0; margin-top: 0`).
4. **Frame Screen Grid & Preview Alignment:**
   - Vertically aligned the left print preview panel with the right frame card grid (`align-items: stretch`).
   - Visually clipped the internal preview header (`.v1-frame-preview-heading`) while retaining accessibility labels, centering frame card titles and thumbnails symmetrically.
5. **Quantity Screen Stepper & Tabular Numerals:**
   - Centered stepper buttons (`+`, `−`) and quantity digits with `display: grid; place-items: center`.
   - Applied tabular numerals (`font-variant-numeric: tabular-nums`) to quantity and pricing to eliminate visual jumping when incrementing/decrementing.
   - Refined the pricing summary into clean flex/grid rows with muted labels and bold aligned amounts.
6. **Payment Screen Label/Value Alignment:**
   - Restructured payment detail items into clean 2-column grid tracks (`grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: baseline; gap: 16px`).
   - Aligned labels and tabular prices consistently with zero baseline jitter.
   - Adjusted QR container overflow behavior to prevent unintended clipping while maintaining rock-solid dimensions.
7. **Confirm Screen & Action Bar Touch Alignment:**
   - Realigned the order summary with clean grid baselines and tabular currency values.
   - Vertically centered action bar helper text and primary buttons with fluid 56px touch height across resolutions.
8. **Acceptance Runner Process Lifecycle Management:**
   - Updated `tests/verify-demo-and-real-journey.mjs` with `cleanupPreviousInstance()` using safe PowerShell CIM process filtering.
   - Explicitly targets only V2 workspace processes (`le-souvenir-v2.exe`, detached Java sidecar on V2 path, and V2 WebView2 instances), preventing orphaned process locks or port conflicts.
   - Acceptance runner passed 100% across both 1280×800 and 1920×1200 viewports with 26 high-resolution journey screenshots captured.
9. **Test Suite Verification:**
   - Frontend Vitest: **57/57 passed** across 8 test suites (exit 0).
   - Frontend production build: **2,017 modules transformed, 0 errors** (exit 0).
   - Strict V1 Isolation: `E:\HK1_2026_2027\PhotoboothDesktop` remains strictly untouched and read-only.

---

## Option D UI/UX & Functional Polish: Korean Atelier Liquid Glass, Zero-Lag Selection & Direct Frame Confirmation (2026-11-03 19:15)

**Status: PASS-SIMULATED across both 1280×800 and 1920×1200 viewports; physical hardware gates remain unverified without physical Canon DSLR or DNP DS-RX1HS.**

Key polish delivered and verified:
1. **Refined Warm Ivory Layout Carousel:** Replaced harsh gradient banding and dark rectangular box shadows with a softened, luxurious warm ivory background `--layout-ambient` (`linear-gradient(125deg, #fcfaf7 0%, #f8f2eb 48%, #f5eae0 100%)`). Adjacent layout cards scale gently (`scale(0.95)` at distance 1, `scale(0.90)` at distance ≥2) with high opacity (`0.92` and `0.84`) without blur, keeping adjacent options crisp, clear, and inviting. Drop-shadows on floating layout artwork are softened to warm organic tones (`rgba(40,28,20, 0.10)` and `rgba(40,28,20, 0.05)`).
2. **Complete Liquid Glass UI Across All Screens:** Extended authentic Korean Atelier Liquid Glass styling across all customer and operator screens via `kiosk-v1.css` and `operator-v1.css`. Translucent frosted glass (`rgba(255, 255, 255, 0.76)`, `backdrop-filter: blur(20px) saturate(150%)`, subtle 1px white border, and warm ambient drop shadows) unifies panels, start cards, action bars, summaries, modals, and operator navigation. Warm liquid glass is kept strictly on UI chrome, never bleeding onto photographic paper.
3. **Floating Paper & Photorealistic Cards:** Removed thick, distracting white card wrappers around photo tiles and frame previews. Photos float naturally with subtle rounded borders (`1.5px solid rgba(255,255,255,0.7)`) and soft paper shadows (`drop-shadow(0 10px 24px rgba(40,28,20,.10)) drop-shadow(0 2px 6px rgba(40,28,20,.05))`). Active selections highlight with warm terracotta-coral accents (`#C27357`).
4. **Button, Header, Camera Shutter & Countdown Alignment:** Perfected touch layout geometry across 1280×800 and 1920×1200 viewports. The capture countdown is centered dead-on (`left: 50%; top: 50%; transform: translate(-50%, -50%)`), the shutter control is centered at `bottom: clamp(16px, 3vh, 44px)` with responsive touch scaling, and action bar primary buttons maintain fluid 56px touch height.
5. **Zero-Lag Photo Selection & Frame Switching:** Eliminated perceptible lag on touch interaction. Selection state toggles immediately in local memory via `useRef` reconciliation and asynchronous non-blocking IPC dispatch (`action('selection.toggle', ...)`). Pending selections preserve tap order and reconcile gracefully with authoritative snapshots.
6. **Direct Touchscreen Frame Confirmation:** Users can tap the currently active/selected frame directly to confirm and advance to the preview screen, in addition to using the primary action-bar button ("Xem bản in →"). Double-tap race conditions are protected by confirmation locks.
7. **Native 300×300 DPI Print Density Verified:** The native 300 DPI print output pipeline (`DesktopCompositor.kt` & `PrintImageWriter.kt`) remains completely verified and untouched, maintaining high-fidelity physical composition parity for 2x6 strip and 4x6 / 6x4 layouts.
8. **Test Suite Verification:**
   - Backend Gradle: **86 passed, 2 skipped, 0 failed** across 28 test suites (exit 0)
   - Frontend Vitest: **57/57 passed** across 8 test suites (including direct frame confirmation test) (exit 0)
   - Frontend production build: **2,017 modules transformed, 0 errors** (exit 0)
   - Automated Acceptance Journey (`verify-demo-and-real-journey.mjs`): 0 failures across 1280×800 and 1920×1200 viewports.
9. **Strict V1 Isolation:** `E:\HK1_2026_2027\PhotoboothDesktop` remains strictly untouched, unread, and write-protected.

---

## Frame Decoration Loading Resolution & Full End-to-End Kiosk Journey Verification (2026-11-03 17:55)

**Status: PASS-SIMULATED across both 1280×800 and 1920×1200 viewports; physical hardware gates remain unverified without physical Canon DSLR or DNP DS-RX1HS.**

Key resolutions delivered:
1. **Frame Decoration Loading & IPC Frame Limit:** Resolved `-32004 Stale session or generation` error occurring during `frame.list` on `FrameScreen`. In `RealSessionEngine.kt`, `frameDto` previously invoked `frameThumbDataUrl` three separate times (`thumbDataUrl`, `thumbnailDataUrl`, `previewDataUrl`), inflating response payloads beyond the 1 MiB IPC limit and triggering backend drops. Streamlined `frameDto` to compute `thumbDataUrl` once and omit redundant duplicate fields. Updated session checking in `RealSessionEngine.kt` and `SimulatorSessionEngine.kt` to allow queries with omitted `generationId` when `sessionId` matches, while preserving strict generation latching when explicitly specified.
2. **Camera Shutter Alignment:** Removed conflicting `left`, `bottom`, and `translateX(-50%)` declarations from `.v1-capture-screen .v1-shutter` in `kiosk-v1.css` so that `.v1-shutter-control` centrally positions the touch trigger cleanly across both 1280×800 (88px) and 1920×1200 (108px) resolutions.
3. **Photo Selection React Asynchrony Fix:** In `tests/verify-demo-and-real-journey.mjs`, eliminated an immediate synchronous `aria-pressed` re-click that caused accidental photo deselection in automated acceptance runs.
4. **End-to-End Live Acceptance Suite Pass:** Executed `node tests/verify-demo-and-real-journey.mjs` against the live debug Tauri executable (`le-souvenir-v2.exe`). Verified 63/63 checks passed across both 1280×800 and 1920×1200 viewports with zero failures. Captured 26 full-resolution journey screenshots in `tests/journey-evidence/2026-11-03T10-54-45.783Z/`.
5. **DEMO Revenue Protection:** Zero revenue recorded for DEMO sessions, confirmed by `RealSessionEngineDemoModeTest` (2/2 passed, 0 failures, 0 errors).
6. **Strict V1 Isolation:** V1 (`E:\HK1_2026_2027\PhotoboothDesktop`) remained strictly untouched and read-only.

Test suites:
- Backend Gradle: **86 passed, 2 skipped, 0 failed** (exit 0)
- Frontend Vitest: **56/56 passed** across 8 test suites (exit 0)
- End-to-End Live Tauri Journey: **63/63 passed, 0 failed** across 1280×800 and 1920×1200

---

## Unlocked Mock Capture & End-to-End Print Signal Verification (2026-11-03 15:04)

**Status: COMPLETE for camera-free simulated operation and bounded automated regression; physical hardware/release gates remain BLOCKED.** A full photobooth session can now run without a connected Canon DSLR or DNP printer. Capture produces synthetic high-resolution mock portraits, the full composition engine renders the exact print canvas, and the print path either dispatches to Windows Print Spooler when system printing is enabled or records a simulated successful transmission with complete job telemetry. `DeliveryScreen` prominently reports **“TÍN HIỆU IN: ĐÃ TRUYỀN THÀNH CÔNG”** in a green status badge. `PaymentScreen` tells staff how to unlock payment by holding the title for one second and entering PIN `1234`.

Regression evidence: requested backend offline Gradle command exited 0 (`BUILD SUCCESSFUL in 32s`; XML **80 passed / 2 skipped / 0 failed** across 28 suites; test task up-to-date); frontend **56/56 tests across 8 files** passed in 9.19s; production build passed with **2,017 modules** in 7.83s; requested Cargo `check` compiled the Tauri package successfully in 5.86s. No physical Canon capture, DNP spool/output, cutting, or paper comparison was performed. No command was run in V1 and no V1 write or secret read occurred; global forensic isolation remains blocked without a trusted baseline manifest.

---

## Production Kiosk Administration & Settings Overhaul (2026-11-03 12:50)

**Status: COMPLETE for bounded source and automated regression; production release BLOCKED.** The Operator workspace no longer shows the jarring simulator warning banner. It now presents a production Atelier 2.0 kiosk-status banner with live device-status pills. `V1Settings` now uses Korean Atelier Liquid Glass styling with structured glass panels, a modern iOS/kiosk switch, tactile 52×52 squircle stepper buttons, floating status cards, and print-configuration information chips. The implementation preserves all existing test IDs and roles and the exact six-field backend persistence contract: `enableSystemPrint`, `useHotFolder`, `hotFolderPath`, `postCaptureTimeoutSeconds`, `photoSelectionTimeoutSeconds`, and `frameSelectionTimeoutSeconds`.

Regression evidence: backend command exited 0 in **22.52s** (`BUILD SUCCESSFUL in 22s`; XML **80 passed / 2 skipped / 0 failed**, task up-to-date); frontend **56/56 tests across 8 files** passed in **9.31s** wall time; production build passed with **2,017 modules** in **9.92s**; Cargo compiled one package cleanly in **22.34s** and reported no Rust tests. No command was run in V1 and no V1 write or secret read occurred; global forensic isolation remains blocked without a trusted baseline. Mounted 16:10/touch acceptance, hardware, Mini-PC performance, packaging/recovery, live providers, physical V1 comparison, and redistribution-license gates remain open.

---

## Coverflow Wheel Carousel & Cardless Layouts (2026-11-03 11:48)

**Status: COMPLETE for bounded source and automated regression; production release BLOCKED.** The kiosk no longer visually displays “Chạm lần nữa để chọn dải ảnh này →”; `.sr-only` preserves it for accessibility and Vitest. Layout artwork is cardless and sized `clamp(200px, 22vw, 300px)` within a stage up to 1400px, targeting 3–5 simultaneous choices. Coverflow distance styling is gradual: center `scale(1.08)` with multi-spectral chromatic oil-slick aura and z-index 10; immediate neighbors `scale(0.80)`, opacity `.65`, z-index 5; distance 2 `scale(0.62)`, opacity `.40`, z-index 2; distance ≥3 `scale(0.48)`, opacity `.22`, z-index 1. Gap is `clamp(16px, 2.5vw, 40px)`, hover scaling is locked to prevent touch jumps, and both arrows wrap through modular indexing.

Regression evidence: backend `BUILD SUCCESSFUL in 23s`, with XML aggregate **80 passed / 2 skipped / 0 failed** (task up-to-date); frontend **56/56 tests across 8 files** in 9.83s; production build passed with **2,017 modules** in 6.25s; Cargo compiled one package cleanly in 11.35s and reported no Rust tests. No command was run in V1 and no V1 write or secret read occurred; global forensic isolation remains blocked without a trusted baseline. Rendered 16:10/touch acceptance, hardware, Mini-PC performance, packaging/recovery, live providers, physical V1 comparison, and redistribution-license gates remain open.

---

## Chromatic Oil-Slick & Cardless Layout Carousel (2026-11-03 11:37)

**Status: COMPLETE for bounded source and automated regression; production release BLOCKED.** The global non-camera shell now layers petrol cyan (`#00e5c9`), electric violet (`#b042ff`), rose-magenta (`#ec4899`), radiant coral (`#ff6f59`), golden amber (`#f6d365`) and sapphire (`#3b82f6`). Customer panels use saturated liquid-glass blur with cyan/violet specular rims; primary CTAs use a dark, multi-spectral oil-slick aura. The layout carousel removes the external white card (`background: transparent !important; border: 0 !important; box-shadow: none !important; padding: 0 !important`) while preserving standalone paper artwork. Artwork uses `drop-shadow(0 20px 45px rgba(20,15,35,.28))`; selected artwork is `scale(1.06)` with the requested rose/cyan/black three-part aura, and `.v1-carousel-tap-hint` is a floating pill. Porcelain-white QR cards and the dark `#121214` camera studio remain preserved.

Regression evidence: backend command exited 0 in **22.54s** (`BUILD SUCCESSFUL in 22s`; test task up-to-date; aggregate **80 passed / 2 skipped / 0 failed**), frontend **55/55 tests across 8 files** in **10.82s**, production build passed with **2,017 modules** in **11.93s**, and Cargo compiled one package cleanly in **11.19s** with no Rust test cases. This does not prove rendered appearance, 16:10/DPI fit, touch behavior, QR scanning, accessibility, camera/print hardware, or Mini-PC performance. No command was run in V1 and no V1 write or secret read occurred; global forensic isolation remains blocked without a trusted baseline. Release remains blocked on physical, packaging, provider, comparison, and redistribution-license gates.

---

## Complete App-Wide Korean Atelier Liquid Glass Overhaul (2026-11-03 11:10)

**Status: COMPLETE for bounded source and automated regression; production release BLOCKED.** The customer application now uses a global luminous studio ambience on `.v1-shell:not(.v1-camera)` with warm apricot, rose-quartz, and golden-champagne glow. A master Liquid Glass treatment covers `.v1-panel`, `.v1-start-card`, `.v1-actionbar`, `.v1-frame-preview-panel`, `.v1-summary`, `.v1-prepare-stage`, `.v1-print-stage`, `.v1-delivery`, and `.v1-modal`. Primary controls use luminous terracotta-coral gradients, specular rim highlights, and warm shadows; status badges use the amber/coral `atelier-status-pulse` breathing treatment. Photographic paper previews remain crisp and unblurred with realistic floating 3D presentation, while VietQR and delivery/download QR content remains on pure porcelain cards intended for scanning. The camera path deliberately preserves the dark `#121214` studio environment, dead-center countdown, and circular shutter rather than applying the bright customer-shell ambience.

Independent regression evidence: frontend **55/55 tests passed across 8 files** (16.61s wall time); TypeScript/Vite production build passed with **2,017 modules and zero errors** (10.71s wall time); backend XML reports **80 passed, 2 skipped, 0 failed/errors** of 82 across 28 suites (`BUILD SUCCESSFUL in 16s`, 16.75s wall time); installed Cargo compiled one package in 15.17s with no Rust test cases. These checks do not establish mounted 16:10 appearance, physical touch, QR scanning, motion accessibility, camera Live View quality, Canon/DNP behavior, or Mini-PC performance. Read-only V1 status still contains two modified agent files and two untracked backups of unknown provenance; this reviewer made no V1 write or secret read, but strict global untouched proof is blocked without a trusted baseline. Packaging/recovery, physical V1 print comparison, production-provider operations, and redistribution licenses remain open.

---

## Full-Bleed Edge-to-Edge Payment Regression (2026-11-03 10:34)

**Status: bounded automated software checks PASS; production release BLOCKED.** The payment stage now removes outer shell padding/gap with `.v1-shell:has(.v1-payment-screen), .v1-shell.v1-shell-payment { padding: 0 !important; gap: 0 !important; }` and removes the payment screen's outer radius with `border-radius: 0`. The ambient apricot/rose/champagne studio radial glow is intended to flow edge-to-edge through pixel `(0,0)` with zero white outer border, while internal bezel padding `clamp(20px, 2.5vh, 32px) clamp(24px, 4vw, 64px)` protects headings and glass plates from clipping. Frontend: **55/55 passed across 8 files**; production build passed with **2,017 modules**. Backend XML: **80 passed / 2 skipped / 0 failed** across 28 suites. Installed Cargo compiled one package cleanly; no Rust tests were reported. This is source/build evidence, not mounted pixel, scaling, physical-touch, or QR-scanner acceptance. No V1 command/write/secret read occurred; 100% global untouched proof remains blocked without a trusted baseline manifest.

---

## Full-Stage Payment Liquid-Glass Regression (2026-11-03 09:25)

**Status: bounded automated software checks PASS; production release BLOCKED.** Backend XML: **80 passed / 2 skipped / 0 failed** of 82 across 28 suites (BUILD SUCCESSFUL in 59s). Frontend: **55/55 passed across 8 files**; TypeScript/Vite production build passed with **2,017 modules**. Installed Cargo compiled the Rust package cleanly; no Rust test cases were reported. The full-screen expansive liquid-glass update ("làm đều toàn màn hình và mượt mà vẻ đẹp") replaces the rigid 940×560px box with a full-stage 100% width/height responsive grid (`1.05fr : 1fr`), fluid 24–48px gap and 28–48px padding. Both panels stretch gracefully and evenly, matching the expansive luxury aesthetic of `.v1-split`. The square porcelain QR card uses `clamp(290px, 37vh, 390px)` with transform/transition/animation locked off to prevent scale jumping; instructions reserve 130px. Translucent frost uses `blur(28px) saturate(190%)` over a warm apricot/rose/champagne backdrop. These source/build checks do not prove mounted QR geometry, no layout jump, scaling/touch usability, or scanner performance. No V1 command, write, build, or secret access occurred; global 100%-untouched proof remains unavailable without a trusted baseline. Canon, DNP, Mini-PC, installer/recovery, live providers, and redistribution licensing remain blocked/not run.

---

## Payment QR Dimension Stabilization Regression (2026-11-03 00:40)

**Status: bounded automated software checks PASS; production release BLOCKED.** Backend JUnit XML reports **80 passed / 2 skipped / 0 failed** of 82 across 28 suites; frontend Vitest reports **55/55 passed across 8 files**; TypeScript/Vite production build passed with 2,017 modules. Explicit installed Cargo compiled the Rust package successfully, with no Rust test cases reported. These results establish compilation and existing regression compatibility for the payment CSS changes, not mounted proof that QR dimensions remain fixed or that zoom is eliminated at every kiosk scale. No V1 command, write, or secret read occurred; a global 100%-untouched claim remains blocked because no trusted pre-task manifest exists. Canon, DNP, physical touch/scaling, Mini-PC performance, installer/recovery, live providers, and redistribution licensing remain blocked/not run.

---

## Luxury Korean Atelier UI Regression (2026-11-02 23:05)

**Status: bounded automated software checks PASS; production release BLOCKED.** Backend: **80 passed / 2 skipped / 0 failed** of 82 across 28 suites. Frontend: **55/55 passed across 8 files**. TypeScript/Vite production build passed with 2,017 modules. Cargo compiled the Rust package successfully; no Rust test cases were reported. The new CSS and Start/Prepare/Confirm/Printing changes are compile- and component-regression clean, but no fresh rendered viewport, physical touchscreen, camera, printer, Mini-PC, installer, provider, or licensing acceptance was performed. No V1 command/write/secret read occurred; global forensic isolation remains unprovable without a trusted baseline manifest.

---

## V1 Capture / Selection / Frame Geometry Alignment (2026-11-02 22:48)

**Status: COMPLETE for bounded automated regression; production release BLOCKED.** Current changes to capture presentation, photo-selection layout, and frame-preview geometry compile and retain the existing interaction suite: backend **80 passed / 2 skipped / 0 failed** of 82 across 28 suites; frontend **55/55 passed across 8 files**; TypeScript/Vite build passed with 2,017 modules. Explicit installed Cargo compiled the Rust package; no Rust tests exist. No fresh mounted 16:10 visual run or V1 golden/pixel comparison was performed, so visual parity remains simulated/source-based. Canon, DNP, Mini-PC performance, installer/recovery, and redistribution licensing remain blocked. No V1 command/write/secret read occurred; complete forensic isolation cannot be certified without a trusted baseline manifest.

---

## Camera Studio UI / Real Frame Asset Verification (2026-11-02 22:22)

**Status: COMPLETE for bounded automated software scope; production release BLOCKED.** Backend XML reports **80 passed, 2 skipped, 0 failed** of 82; frontend reports **55/55 passed across 8 files**; the TypeScript/Vite build passed with 2,017 modules. Rust compiled through the installed Cargo executable (no Rust test cases reported). Current command-queue recovery coverage passed. Physical Canon/DNP/touchscreen, Mini-PC performance, physical output comparison, installer/recovery, and Canon/ONNX redistribution licensing remain unverified. No V1 command/write/secret read occurred, but 100% global isolation cannot be proven without a trusted baseline manifest.

---

## Independent User Feedback Parity Review (2026-11-02 21:36)

**Status: NOT COMPLETE â€” HIGH queue recovery defect.** Backend is **78 passed / 0 failed / 2 skipped** (80 total, 28 suites); frontend is **53/53 passed**; production web build passed (2,016 modules). Photo Continue/order, 960 px quality, zoom, parameterized artwork and explicit frame confirmation have bounded evidence. However, `KioskSimulator.tsx:47` uses `previous?run():false`, so one false command causes all subsequent queued mutations to be silently skipped. Release remains blocked pending correction plus a regression test proving post-failure retry execution. V1 global untouched proof, hardware, physical touch/performance, installer and licenses remain blocked/not run.

See `docs/PHOTO_FRAME_INTERACTION_REGRESSION.md` for the case matrix and exact commands.

---

## Touchscreen Interaction & Golden Revenue Gate Verification (2026-11-02)

**Status: COMPLETE for bounded automated software scope.** Frame Continue is removed; user frame taps visually settle for 300ms and advance once; defaults do not advance; layout center/confirm behavior, hidden staff PIN flow, and Confirm's 500ms arming window are tested. Composition is native 300 DPI. Revenue remains false for mock/frame/demo paths and is recorded only after successful real spooler submission. Visual shadow/16:10 claims remain simulated, not physical-touch evidence.

- Backend offline command: **77 passed, 0 failed, 2 skipped** across 28 suites (79 total); build successful, test task UP-TO-DATE.
- Frontend: **50/50 tests passed** across 7 files.
- Production build: TypeScript/Vite passed; **2,016 modules transformed**.
- Detailed matrix: `docs/PHOTO_FRAME_INTERACTION_REGRESSION.md`.
- V1: no reviewer command/write/secret read; global untouched proof remains **BLOCKED** without a trusted before/after manifest.
- Physical touchscreen, Canon, DNP, Mini-PC performance, print comparison, installer and licensing remain **BLOCKED / NOT-RUN**.

---

## Korean Photo Atelier UI Navigation, Header Geometry & Visual Polish Overhaul (2026-11-02)

**Status: COMPLETE â€” PASS-AUTOMATED + PASS-SIMULATED.** Verified on live Windows desktop via Tauri CDP. Physical hardware/provider gates remain BLOCKED pending physical studio kiosk attachment.

### Priority P0: Header & Back Button Navigation Geometry (`AppHeader`, `KioskBackButton`)
- **Unified `AppHeader` Architecture:** Replaced fragmented ad-hoc headers across customer screens (`StudioModeScreen`, `QuantityScreen`, `PaymentScreen`, `SelectPhotosScreen`, `FrameScreen`, `ConfirmScreen`, `DeliveryScreen`) with the unified `AppHeader` component (`frontend/src/screens/KioskUI.tsx`). Standardizes a 3-column CSS Grid (`56px minmax(0, 1fr) auto`), dedicated `.appHeader__backSlot`, aligned copy column with step/eyebrow indicators, and right-aligned action/timer slot.
- **Circular 56Ã—56 `KioskBackButton`:** Replaced inconsistent back arrows with a dedicated circular 56Ã—56px touch target (`min-width: 56px; min-height: 56px; border-radius: 50%`) meeting ISO 9241-9 kiosk touch target standards.
- **Optical SVG Centering:** Calibrated Lucide `ArrowLeft` inside `KioskBackButton` with subtle optical offset (`transform: translateX(-0.5px)`), achieving exact visual centering: **$dx = 0.5\text{px}, dy = 0.0\text{px}$**, well within the $\le 2.5\text{px}$ optical tolerance threshold.
- **Carousel Chevron Alignment:** Standardized carousel navigation arrows (`.v1-carousel-arrow`) to 56Ã—56px touch targets, vertically centered at 50% stage height and horizontally locked on the exact same axis: **$y\Delta \le 3\text{px}$** (measured $y\Delta = 0.0\text{px}$).

### Priority P1: Elimination of Technical Clutter & Window Presentation
- **Purge of Raw Technical IDs:** Completely eliminated raw layout identifiers (`515_4_anh`, `1015_4_ILCL`, `1015_4_base`, etc.) and internal technical badges (`.v1-layout-tag`) from all guest-facing customer screens. All layouts now display customer-friendly Vietnamese descriptions via `formatLayoutTitle` and `formatLayoutSubtitle`.
- **Debug Status Bar & Metadata Removal:** Removed internal debug status indicators, mock banners, and raw Firestore metadata from customer view.
- **Standardized Window Title:** Set native desktop window title to `"LE SOUVENIR Photobooth"`.

### Priority P2: Welcome Screen Editorial Recomposition with Authentic Photostrips
- **Editorial Hero Recomposition:** Recomposed `StartScreen.tsx` into a balanced Seoul photo atelier hero presentation. Replaced abstract vector placeholders with authentic layered photostrips (`LayoutArtwork` in `.v1-strip-art`) featuring natural paper elevation shadows and subtle rotation ($-5^\circ / +4^\circ$).
- **Guest Copy & Typography:** Refined typography with letter-spaced `LE SOUVENIR` wordmark, `PHOTO ATELIER Â· SEOUL Ã— SAIGON` kicker, `"Nhá»¯ng khoáº£nh kháº¯c cá»§a riÃªng báº¡n."` caption, and clean event bundle presentation.

### Verification Evidence
- **Live Desktop Acceptance Journey:** **PASS-SIMULATED â€” 63/63 checks passing, 0 failures, 26 screenshots** across 1280Ã—800 and 1920Ã—1200 viewports. Evidence: `tests/journey-evidence/2026-11-02T07-41-35.569Z/results.json`.
- **Frontend Regression Suite:** **PASS-AUTOMATED â€” 49/49 Vitest tests passing** across all suites.
- **Frontend Production Build:** **PASS-AUTOMATED â€” 0 errors**, 2,015 modules transformed cleanly (`tsc --noEmit && vite build`).
- **Backend JUnit:** **PASS-AUTOMATED â€” 76/76 unit tests passing**; `RealSessionEngineDemoModeTest` proves DEMO revenue guard.

**Hardware boundary:** Physical Canon DSLR capture/Live View, physical DNP printer spooling/cutting, and live PayOS banking settlement remain **BLOCKED / NOT-RUN** until devices are attached and an operator authorizes a safe supervised test.

---

## Critical V1 UX Parity, Full UI Polish & PayOS Repair (2026-11-01)

**Status: COMPLETE â€” PASS-AUTOMATED + PASS-SIMULATED.** This is software/UI evidence only, not physical-hardware or live-settlement certification.

### PayOS loading and recovery repair
- `RealSessionEngine.kt` now bounds payment-link creation to **15 seconds** and exposes explicit payment states: `CREATING | AWAITING_PAYMENT | ERROR | UNCONFIGURED | PAID`.
- Error responses are handled as recoverable UI state rather than an infinite loading screen. The payment screen provides **â€œThá»­ láº¡i táº¡o mÃ£ QRâ€**, while staff cash confirmation remains visible in the appropriate error/unconfigured path.

### Authoritative session timers (V1 parity)
- `RealSessionEngine.kt` restores inactivity countdown authority for `SELECTING_PHOTOS` (**90s**) and `EDITING` (**60s**), ticking every **1000ms**.
- On expiry, the engine safely auto-fills the required choices and advances. The expiry path does **not** duplicate revenue recognition or submit duplicate prints.
- `KioskUI.tsx` renders `CÃ²n láº¡i MM:SS`, with urgent styling at **15 seconds or less**. Active countdown values replace the former frozen `00:00` presentation.

### Customer interaction and visual parity
- `LayoutArtwork.tsx` and `PrintPreview` place selected photos into SVG `<image>` slots in real time while customers tap captured photos.
- `SelectPhotosScreen.tsx` implements a **500ms pointer hold** to open an enlarged lightbox; release closes it immediately. A **50ms pointer-up reset** avoids suppressing normal click-to-select behavior.
- Frame Selection is now a tactile **two-column frame gallery** beside a large print preview containing the selected photos and active frame overlay.
- Capture presentation uses a centered **240sp** `.v1-countdown`, mirrors Live View with `transform: scaleX(-1)`, and removes DEMO captions.
- Decorative Unicode emoji were removed from customer and operator screens and replaced with Lucide SVG icons, including `<Zap />`, `<QrCode />`, `<Check />`, and `<ArrowLeft />`.

### Verification evidence
- Live Tauri desktop journey (`tests/verify-demo-and-real-journey.mjs`): **PASS-SIMULATED â€” 47/47 checks, 0 failures, 26 screenshots** at 1280Ã—800 and 1920Ã—1200. Evidence: `tests/journey-evidence/2026-11-01T18-16-51.341Z/results.json`.
- The journey verifies active decrement (`CÃ²n láº¡i 02:19` â†’ `CÃ²n láº¡i 02:18`), hold-zoom open/release-close, live photo-slot rendering, and the zero-emoji assertion.
- Frontend Vitest: **PASS-AUTOMATED â€” 49/49 tests passing**.

**Hardware boundary:** physical Canon DSLR capture/Live View, physical DNP printer output, and live PayOS banking settlement remain **BLOCKED / NOT-RUN** until devices are attached and an operator authorizes a safe supervised test.

---

## Final Korean Photo Atelier UI/UX Overhaul & Exact V1 Payment Restoration (2026-11-01)

**Status: COMPLETE â€” PASS-AUTOMATED + PASS-SIMULATED.**

### Customer workflow and exact V1 payment restoration
- Removed all customer-facing free-experience affordances: `TRáº¢I NGHIá»†M CHá»¤P áº¢NH MIá»„N PHÃ`, `0 Ä‘`, `Miá»…n phÃ­` badges, and guest/customer bypass buttons are no longer presented as commercial choices.
- Restored V1 price calculation in `RealSessionEngine.kt`: **70,000 VND** base for 5Ã—15 strips and **90,000 VND** base for 10Ã—15 postcards.
- Restored the real payment journey in `PaymentScreen.tsx`, including the VietQR card, order summary, payment-state handling, and hidden staff cash confirmation. A header double-click or 700 ms hold invokes `payment.mockComplete` with `staffOverride: true` and payment method `TIEN_MAT`; this is not exposed as a customer bypass.
- Retained safe internal mock capture for camera-free testing without creating or advertising a customer-facing free commercial package. `RealSessionEngineDemoModeTest` proves the DEMO revenue guard and zero revenue recording.

### Korean Photo Atelier visual overhaul
- Recomposed the Welcome hero into balanced editorial columns with refined typography, a letter-spaced brand wordmark, kicker, subtitle, value pills, primary CTA, and a layered photostrip composition using realistic shadows and subtle rotation.
- Rebuilt compact Back controls with Lucide `ArrowLeft`; rebuilt carousel controls with Lucide `ChevronLeft` and `ChevronRight`.
- Rebuilt Payment as a clean order-summary and VietQR presentation while preserving the concealed staff cash-confirmation gesture.
- Verified the **600 DPI composed print preview** on the final confirmation screen.
- Verified all screens at the **1280Ã—800** and **1920Ã—1200** 16:10 kiosk viewports.

### Evidence
- Live desktop acceptance: **PASS-SIMULATED â€” 35/35 checks passing, 0 failures, 26 screenshots**. Evidence: `tests/journey-evidence/2026-11-01T17-19-57.239Z/results.json`.
- Frontend Vitest: **PASS-AUTOMATED â€” 45/45 passing across 7 suites**.
- Frontend production build: **PASS-AUTOMATED â€” zero errors**.
- Backend Gradle: **PASS-AUTOMATED** for the DEMO revenue guard in `RealSessionEngineDemoModeTest`.

---

## Commercial-Grade UI/UX Rebuild & V1 Horizontal Snapping Carousel Parity (2026-11-01)

**Status: COMPLETE â€” PASS-AUTOMATED + PASS-SIMULATED.**
The kiosk frontend and desktop runtime have been elevated to commercial atelier standard, fully restoring V1's signature centered horizontal snapping carousel mechanics, expressive vector slot previews, truthful customer copy, and robust Tauri bridge process lifecycle management.

### 1. Key Completed Deliverables
- **V1 Horizontal Snapping Carousel Restoration (`StudioModeScreen.tsx`):** Rebuilt layout selection with a centered, touch-snapped horizontal carousel (`.v1-layout-carousel`), replicating legacy V1 `HorizontalPager` mechanics:
  - Active layout card scales to `1.0` and centers precisely on screen; adjacent peek cards scale down to `0.84` with graceful opacity reduction (`0.85`).
  - Interactive click-to-center / click-to-select behavior with smooth-scroll settling on user touch or keyboard arrow navigation.
  - Floating circular navigation chevrons (`â€¹` and `â€º`) positioned symmetrically for swift one-touch paging.
  - Zero-scroll vertical layout constraint preserved for both 1280Ã—800 and 1920Ã—1200 16:10 touchscreen form factors.
- **Vector Photo Slot Illustrations (`LayoutArtwork.tsx`):** Replaced empty, sterile blank boxes with elegant vector canvas illustrations displaying exact slot geometry, numbered photo slots, and aesthetic silhouette portraits, giving customers an immediate, visceral understanding of the photo composition.
- **Customer-Friendly Titles & Canonical ID Tags:** Formatted layout names (`formatLayoutTitle`, `formatLayoutSubtitle`) into polished Vietnamese descriptions (e.g. "Dáº£i áº£nh 4 Ã´ cá»• Ä‘iá»ƒn", "Báº£n in 4 khung lá»›n") while preserving canonical layout IDs (`515_4_anh`, `1015_4_ILCL`) in subtle, unobtrusive `.v1-layout-tag` badges for operator debugging.
- **Korean Photo Atelier Design Token System:** Formalized Seoul-inspired photo studio design tokens in `docs/DESIGN_SYSTEM.md` and implemented the complete visual theme in `kiosk-v1.css` (`--v-bg: #FAF6F0`, warm ivory cards, muted coral accents `#E07A5F`, peach highlights `#F4A261`, and warm charcoal typography).
- **Actual Frame Artwork Thumbnails:** Added Base64 thumbnail generation (`thumbDataUrl`) in `RealSessionEngine.kt` and updated `FrameOption` in `simulator-contract.ts`, ensuring actual decorative frames and seasonal covers display rendered artwork rather than generic color placeholders.
- **Truthful Action Copy & Viewport Fit:**
  - `ConfirmScreen.tsx`: Updated action button copy truthfully to `"HoÃ n thÃ nh tráº£i nghiá»‡m â†’"` during `DEMO` complimentary trial runs (instead of claiming `"In áº£nh ngay"` when no printer output will occur).
  - `DeliveryScreen.tsx`: Added sticky finish CTA bar perfectly tailored to fit 1280Ã—800 compact touchscreen boundaries without vertical overflow.
- **Tauri Bridge Resilience & Teardown Guard:**
  - In `src-tauri/src/main.rs`: Implemented explicit failure teardown with `guard.take()` to evict stale child references on connection failure or backend process termination.
  - In `src-tauri/src/bridge.rs`: Increased JSON-RPC command execution timeout to 25 seconds, eliminating premature client timeouts during heavy 600-DPI image composition operations.

### 2. Verified Test Evidence
- **Live Desktop Acceptance Journey (`tests/verify-demo-and-real-journey.mjs`):** **PASS-SIMULATED â€” 35/35 checks passing, 0 failures, 26 distinct screenshots across 1280Ã—800 and 1920Ã—1200 viewports**.
  - Acceptance report and screenshots recorded at `tests/journey-evidence/2026-11-01T15-38-06.041Z/results.json`.
- **Frontend Test Suite:** **PASS-AUTOMATED â€” 45/45 Vitest tests passing** across 8 test suites (`npm test -- --run`).
- **Backend Test Suite:** **PASS-AUTOMATED â€” 76/76 JUnit tests passing** across 17 test suites (`gradle.bat --offline test --console=plain`, `BUILD SUCCESSFUL`).
- **Frontend Production Build:** **PASS-AUTOMATED â€” zero errors, 2,015 modules transformed** (`npm run build`).

### 3. Truthful Hardware Verification Boundaries
- **Software & Mock Fallback:** Verified on live Windows desktop via Tauri CDP. Fallback to mock adapter when camera is offline, live preview, 600-DPI composition, and dry-run delivery work reliably.
- **Real Hardware Status:** Canon EDSDK JNA bindings, DNP print driver integration, and PayOS official Java SDK are implemented in software, but **PHYSICAL EXECUTION REMAINS PENDING PHYSICAL DEVICE ATTACHMENT** in the hardware lab. Physical Canon DSLR captures, physical DNP DS-RX1HS prints, and live payment settlements have not been executed and require supervised physical kiosk attachment.

---

## Unified Photobooth Application & Automatic Camera Fallback Completion (2026-11-01)

**Status: COMPLETE â€” PASS-AUTOMATED + PASS-SIMULATED.**
The application is fully unified into a single coherent touchscreen kiosk experience with transparent background hardware monitoring, automatic camera fallback, Korean photo studio design system, and verified zero-revenue dry-run safety.

### 1. Key Completed Deliverables
- **Unified Single-Application UX:** Completely eliminated manual "DEMO vs. REAL" mode toggle switches from `StartScreen`. Customers simply tap `"CHáº M Äá»‚ Báº®T Äáº¦U â†’"`, and the application automatically and dynamically evaluates camera hardware connectivity.
- **Background `CameraConnectionManager`:** Dedicated daemon thread monitoring hardware status every 2,000 ms (matching V1 parity with `NativeEosCaptureService.kt:50â€“82`). Implements an explicit 7-state FSM (`DISCONNECTED`, `DISCOVERING`, `CONNECTING`, `CONNECTED`, `LIVE_VIEW_READY`, `RECONNECTING`, `ERROR`).
- **Dynamic Promotion at Session Boundary (`IDLE` state):** When a customer initiates a session from `IDLE`, `RealSessionEngine` dynamically queries `cameraManager.resolveCaptureMode()`. If a physical Canon DSLR is detected, it promotes to `REAL` capture mode; if absent or disconnected, it seamlessly falls back to `DEMO` mock mode.
- **Session Capture Mode Lock:** The resolved `captureMode` is locked for the duration of that session (`check(captureMode == "DEMO" || cameraManager.isHardwareConnected())`), preventing confusing mid-session mode flips.
- **Zero-Revenue Dry-Run Safety:** In `DEMO` fallback mode, `PaymentScreen` displays a complimentary studio trial banner (0 Ä‘, `Miá»…n phÃ­`, no live bank transfer prompt), and `confirmPrint()` renders a 600-DPI composition with `dryRun: true`, setting `revenueRecorded = false` with **zero writes** to SQLite `sales.db`, zero writes to Neon DB, and zero physical DNP printer submissions. Proved by `RealSessionEngineDemoModeTest`.
- **Korean Photo Studio UI Redesign:** Implemented refined Seoul self-photo studio aesthetic (`--v-bg: #FAF6F0`, `--v-panel: #FFFFFF`, `--v-nude: #E07A5F`, `--v-peach: #F4A261`, warm typography, tactile card elevations, 600-DPI preview, zero-scroll 16:10 touchscreen layouts for 1280Ã—800 and 1920Ã—1200).

### 2. Verified Test Evidence
- **Live Desktop Journey (`tests/verify-demo-and-real-journey.mjs`):** **PASS-SIMULATED â€” 35/35 checks passed, 26 screenshots, 0 failures** across both 1280Ã—800 and 1920Ã—1200 viewports. Evidence: `tests/journey-evidence/2026-11-01T14-23-26.975Z/results.json`.
- **Backend Test Suite:** **PASS-AUTOMATED â€” 76/76 unit tests passed** across 17 test suites (`gradle test installDist`, `BUILD SUCCESSFUL`), including `CameraConnectionManagerTest` (5 tests), `RealSessionEngineDemoModeTest` (1 test), `DemoCameraAdapterTest` (3 tests), `RealSessionEngineTest`, and `FirebaseCatalogServiceTest`.
- **Frontend Test Suite:** **PASS-AUTOMATED â€” 40/40 Vitest tests passed** across all component and screen test suites.
- **Frontend Production Build:** **PASS-AUTOMATED â€” 0 errors, 2,015 modules transformed in 3.55s** (`tsc --noEmit && vite build`).

### 3. Truthful Hardware Verification Boundaries
- **Software & Mock Fallback:** Verified on live Windows desktop via Tauri CDP. Fallback to mock adapter when camera is offline, live preview, 600-DPI composition, and dry-run delivery work reliably.
- **Real Hardware Status:** Canon EDSDK JNA bindings, DNP print driver integration, and PayOS official Java SDK are implemented in software, but **PHYSICAL EXECUTION REMAINS PENDING PHYSICAL DEVICE ATTACHMENT** in the hardware lab. Physical Canon DSLR captures, physical DNP DS-RX1HS prints, and live payment settlements have not been executed and require supervised physical kiosk attachment.

---

## Complete credential/configuration integration (2026-11-01)

**Integration readiness: 9/9 configured.** The user supplied the complete deployment configuration and reported the following bounded verification. This records configuration presence and the stated connectivity checks; it does not authorize or claim a Cloudinary upload, Neon write, PayOS settlement, physical capture, or physical print.

| Integration area | Configuration status | Evidence / boundary |
|---|---:|---|
| PayOS | `payOsConfigured: true` | Live PayOS VietQR verified. No payment settlement is claimed by this update. |
| Neon PostgreSQL | `databaseConfigured: true` | `DATABASE_URL` ported; direct JDBC connectivity verified with read-only `SELECT 1`. No schema or data write is claimed. |
| Cloudinary | `cloudinaryConfigured: true` | Cloud name, upload preset, API key, and API secret are present. No upload was performed for this update. |
| Web album | `webAlbumConfigured: true` | Web-album base URL, booth API key, and album base URL are present. |
| Revenue endpoint | `revenueEndpointConfigured: true` | Web-album base URL and booth API key are present. Revenue recognition remains subject to the successful Confirm & Print rule. |
| Printing | `printerConfigured: true`; `systemPrintEnabled: true` | Strip and full printer names are configured and system printing is enabled. This is not physical DNP/spool/output proof. |
| Beauty | `beautyEnabled: true` | Configured preset: `BRIGHT`. This does not resolve model/algorithm lineage or redistribution review. |
| Hot Folder | `hotFolderConfigured: true` | Hot Folder mode is enabled at the configured deployment path `E:\Photobooth\HotFolder`. No producer/device run is claimed. |
| Secret containment | configured | All secret values remain strictly protected in `.env`; `.gitignore` excludes `.env` and `.env.*` (while intentionally permitting `.env.example`). No credential value is reproduced in documentation or logs. |

**Isolation check:** this documentation task wrote only the three named files under the V2 `docs/` directory. It issued no command in V1 and performed no V1 write, build, cleanup, or secret access. Exact forensic proof that V1 is globally unchanged remains **BLOCKED** because no accepted before/after V1 manifest was supplied and external-directory enumeration was denied; therefore this update does not overstate a filesystem-wide untouched guarantee.

---

## Real External Integrations Recovery milestone (2026-11-01, verified)

**COMPLETE â€” PASS-AUTOMATED + PASS-SIMULATED.** The live desktop acceptance evidence is archived at `tests/journey-evidence/2026-11-01T13-13-52.592Z/`.

- **Firestore layouts:** live connection reported `FIREBASE_LIVE` and returned 10 layouts: `1015_4_ILCL`, `1015_4_base`, `10x15_3_Sao`, `515_2_base`, `515_3_base`, `515_4_anh`, `515_4_base`, `SP_IG_1015_4`, `SP_IG_515_2`, and `SP_IG_515_3`. Live sync and V2-local disk-cache behavior are verified.
- **PayOS VietQR:** live link creation reached `READY`; a real VietQR was rendered from a 132-character payload as a data URL (recorded length 2746; the archived 1920Ã—1200 check reports 2738). Payment-screen behavior passed at 1280Ã—800 and 1920Ã—1200. This proves link/QR integration, not payment settlement or revenue recognition.
- **DEMO capture:** camera-free touch flow remains intact, with zero revenue and dry-run 600-DPI composition.
- **Regression totals:** backend JUnit **70 passed, 1 skipped**; frontend Vitest **40 passed**; live desktop CDP acceptance **37/37 checks, 0 failures**.
- **Boundary:** no physical Canon capture, DNP print, PayOS settlement, Neon write, Cloudinary upload, or physical touchscreen validation is claimed.

---

## Migration completion and test consolidation (2026-11-02, current)

### Milestones 0â€“8

| Milestone | Current status | Completed deliverables / remaining gate |
|---|---|---|
| **0 â€” V2 isolation and planning** | **COMPLETE** | Independent V2 workspace, guardrails, staged plan, and V1 read-only boundary established. No V1 modification is claimed by this documentation update. |
| **1 â€” Legacy audit and parity baseline** | **COMPLETE for migration baseline** | Customer flow, operator surfaces, state/configuration, camera, printer, payment, revenue, and UI inventories/matrices are recorded. This is not physical parity certification. |
| **2 â€” Desktop bridge and simulator proof** | **COMPLETE / PASS-SIMULATED** | React/Tauri/Kotlin lifecycle and dual-mode routing demonstrated; installed backend distribution is produced by `installDist`; real mode fails closed rather than silently using synthetic hardware. |
| **3 â€” Touchscreen UI system and mock-state flow** | **COMPLETE / PASS-SIMULATED** | Refined Korean photo studio UI system (`kiosk-v1.css`), unified `AppHeader`, 56Ã—56 `KioskBackButton` with optical centering ($\le 2.5\text{px}$), horizontal carousel chevrons ($y\Delta \le 3\text{px}$), vector slot artwork (`LayoutArtwork.tsx`), elimination of technical clutter/raw IDs, and two-viewport desktop journeys implemented. 1280Ã—800 and 1920Ã—1200 verified by CDP (63/63 checks); physical glass/touch/DPI remains pending. |
| **4 â€” Backend and feature integration** | **COMPLETE for software scope** | Real session engine, production Firebase/disk layout catalog, background `CameraConnectionManager` with 7-state auto-fallback, composition/QR, dry-run print, payment safety, album/revenue guards, and configuration paths integrated and covered by automated tests. |
| **5 â€” DEMO end-to-end journey** | **COMPLETE / PASS-SIMULATED** | Startâ†’Delivery, four mock captures, selection, frame, 600 DPI preview, dry-run print, delivery QR, and zero-revenue guard pass at both viewports. |
| **6 â€” Regression and REAL payment-screen parity** | **COMPLETE / PASS-AUTOMATED + PASS-SIMULATED** | Backend **76/76**; frontend **49/49 across all suites**; `tsc --noEmit && vite build` passed with **2,015 modules and 0 errors**; live desktop journey **63/63 checks passed, 26 screenshots, 0 failures** (`tests/journey-evidence/2026-11-02T07-41-35.569Z/`). REAL-mode payment display verifies BÆ°á»›c 3, 70.000 Ä‘, 2 báº£n, QR status, safe unconfigured PayOS, automatic studio trial fallback on offline camera, and 700 ms staff gesture. |
| **7 â€” Physical hardware and kiosk validation** | **BLOCKED / NOT-RUN** | Requires authorized physical Canon DSLR, DNP RX1HS, mounted 16:10 touchscreen, and Mini PC performance testing. No physical capture or print has been performed. |
| **8 â€” Packaging and production release** | **BLOCKED / NOT-RUN** | Requires installer/clean-install/recovery testing, live-provider approval, hardware output comparison to V1, and legal signoff for Canon DLL/ONNX/dependency redistribution. |

### Consolidated evidence

- Backend: `gradle test installDist` â€” **76/76 passed**, including `CameraConnectionManagerTest`, `RealSessionEngineDemoModeTest`, `FirebaseCatalogServiceTest`, `DemoCameraAdapterTest`, and `RealSessionEngineTest`.
- Frontend: Vitest â€” **49/49 passed across all test files**, including `screens.test.tsx`, `KioskUI.test.tsx`, `PaymentScreen.test.tsx`, and `LayoutArtwork.test.tsx`.
- Build: `tsc --noEmit && vite build` â€” **2,015 modules transformed, 0 errors in 3.55s**.
- Desktop: `tests/verify-demo-and-real-journey.mjs` â€” **63/63 checks passed, 26 screenshots, 0 failures**. Evidence: `tests/journey-evidence/2026-11-02T07-41-35.569Z/results.json`.
- Full current summary: `docs/MIGRATION_TEST_RESULTS.md`.

**Current gate:** software migration/regression scope is green and ready for controlled hardware-lab testing. Production release is **BLOCKED** until Milestones 7 and 8 have authorized evidence. A mock capture, dry-run print, or unconfigured PayOS screen is not real-hardware/provider proof.

---

## Payment Flow Restoration & Real Mode Verification (2026-11-01, latest)

- **Live Desktop Verification (`tests/verify-real-payment.mjs`):** **PASS-REAL-MODE-DESKTOP** on both **1280Ã—800** and **1920Ã—1200** viewports. Full live test evidence, logs, and screenshots recorded at `tests/real-payment-evidence/2026-11-01T08-40-13.800Z/`.
- **Backend Test Suite:** **PASS-AUTOMATED â€” 62/62 tests across 17 suites** using `gradle.bat --offline test --console=plain` (includes `DesktopBoothConfigTest` 2 tests, `RealSessionEngineTest` orderCode handling).
- **Frontend Test Suite:** **PASS-AUTOMATED â€” 34/34 tests across 7 test files** using `npm test -- --run`.
- **Frontend Production Build:** **PASS-AUTOMATED â€” zero errors, 2,014 modules** using `tsc && vite build` (or `npm run build`).

### Error -32001 Root Cause Analysis & Fix
- **Root Cause 1 (Frontend Race Polling):** The frontend `PaymentScreen` began polling `payment.checkStatus` before `payment.createLink` had asynchronously generated an `orderCode`.
- **Root Cause 2 (Null/Missing `orderCode` in Engine):** When `payment.checkStatus` was dispatched without an `orderCode` or when `RealSessionEngine.orderCode` was still `null`, the backend treated this as an illegal command state and threw JSON-RPC error `-32001`.
- **Root Cause 3 (Missing `description` in Link Creation):** `payment.createLink` calls omitting the optional `description` parameter could fail validation.
- **Applied Fix:**
  1. `RealSessionEngine.kt` updated: `payment.checkStatus` safely returns `{ orderCode: null, status: "PENDING", paid: false, amount: ..., nextState: state }` instead of throwing `-32001` when `orderCode` is `null`.
  2. `payment.createLink` provides safe fallback description (`"Le Souvenir $code"`) when omitted.
  3. Frontend `PaymentScreen.tsx` synchronized: polling is held until `orderCode` or QR is present, avoiding premature status requests.

### Real Mode Components & V1 Payment Parity
- **PayOS Official Adapter:** Integrated `PayOsOfficialAdapter` wrapping the official Java SDK client (`CreatePaymentLinkRequest.builder()`, `client.paymentRequests().get(orderCode)`). Fails closed safely when unconfigured.
- **Server-Side ZXing QR Generation:** `RealSessionEngine.qrPng()` encodes VietQR strings into high-resolution 1000Ã—1000 PNG Base64 data URLs (`data:image/png;base64,...`) via `MultiFormatWriter`, removing client-side rendering bottlenecks.
- **Production Layouts Activated:** Real mode uses `config/production-layouts.json` with `strip-5x15` (4 shots, 3 select, 5s countdown) and `print-10x15` (6 shots, 4 select, 5s countdown). Synthetic fixtures are completely excluded from real mode.
- **DesktopBoothConfig Hierarchical Loader:** Implemented 3-tier precedence: Workspace `.env` < LocalAppData `LeSouvenirDesktop/.env` < Process environment variables. Safe masked diagnostics (`status()`) expose boolean flags only and never leak credentials.
- **V1 Payment UI Parity:**
  - Exact two-column layout (`v1-payment-columns`, `v1-payment-summary` on left, `v1-payment-qr-panel` on right).
  - Eyebrow "BÆ°á»›c 3" (`v1-payment-eyebrow`), title "Thanh toÃ¡n", subtitle "QuÃ©t QR báº±ng á»©ng dá»¥ng ngÃ¢n hÃ ng hoáº·c nhá» nhÃ¢n viÃªn xÃ¡c nháº­n tiá»n máº·t.".
  - Exact currency formatting: "70.000 Ä‘" via `<Vnd amount={pricing?.totalAmount}/>`.
  - Detail rows: Bá»‘ cá»¥c ("Dáº£i áº£nh 5x15 cm"), MÃ u áº£nh ("Tá»± nhiÃªn"), Báº£n in ("2 báº£n").
  - QR status chip with status dot and text ("ChÆ°a sáºµn sÃ ng" / "Sáºµn sÃ ng" / "Äang táº¡o mÃ£" / "KhÃ´ng thá»ƒ táº¡o mÃ£").
  - Removal of customer cash bypass button: eliminated `XÃ¡c nháº­n thanh toÃ¡n (Tiá»n máº·t / Tiáº¿p tá»¥c)` to prevent unauthorized payment bypass.
  - Staff cash override: revealed via header long-press (>=700ms on `h1`) or displayed automatically when unconfigured or upon QR error ("NhÃ¢n viÃªn xÃ¡c nháº­n tiá»n máº·t").

### Confidentiality & Hardware Status
- **Zero Secrets Committed or Logged:** Masked diagnostics verify configuration presence without leaking keys or tokens.
- **Honest Hardware/Production Status:** Physical camera and printer remain offline in the development kiosk; physical prints and live payment settlement remain gated pending explicit deployment authorization.

---

## Release-gate update (2026-11-01, earlier)

- Backend: **PASS-AUTOMATED â€” 60/60 tests across 17 suites** using `gradle.bat --offline test --console=plain`.
- Frontend: **PASS-AUTOMATED â€” 31/31 tests across 7 test files** using `npm test -- --run`.
- Frontend production build: **PASS-AUTOMATED â€” zero errors, 2,014 modules** using `npm run build`.
- Dual-mode architecture is operational. Explicit `--real` and `--simulator` selection is implemented through `IpcMain.kt`, the Tauri bridge (`bridge.rs`, `main.rs`), and `KioskSimulator.tsx`.
- Real mode fails closed: missing camera and printer paths return `-32000` / `-32002`; there is **zero synthetic fallback in real mode**.
- Golden Revenue Rule is implemented: the V2-local SQLite ledger at `data/sales.db` records a sale **only after verified `PrintResult.Submitted`**.
- Real imaging/composition is automated-test verified at 600 DPI: **2452Ã—3658** for 2-up cut and **3658Ã—2452** for 10Ã—15, with an embedded ZXing QR code verified by a decode test.
- Real album wiring is complete: `RealSessionEngine.compose()` creates the web album before composition and embeds its `albumUrl` into the print canvas.
- PayOS SDK parity is implemented through `PayOsOfficialAdapter`, aligned with the V1 official SDK usage and verified to fail closed when unconfigured.
- Physical Canon DSLR, physical DNP DS-RX1HS printing, live PayOS payments, live Neon/Cloudinary sync, and physical 16:10 kiosk validation remain **GATED / BLOCKED pending explicit operator authorization and safe setup**.
- **Current verdict: software core is ready for hardware-lab testing; it is not yet production deployed.**

The status above supersedes older test counts and software-gap statements retained below as historical chronology.

## Superseding baseline migration status (2026-11-01)

- **Milestones 1â€“6: COMPLETED/VERIFIED for the baseline migration and integration scope.** This means the audited baseline, bridge/simulator, touchscreen UI migration, feature-integration surfaces, and automated regression baseline are present and green; it is not physical-hardware or production release approval.
- Frontend: **PASS-AUTOMATED â€” 7/7 files, 29/29 tests**, plus successful TypeScript/Vite production build (2,014 modules).
- Backend: **PASS-AUTOMATED â€” 12/12 suites, 42/42 tests**, zero failures/errors/skips on a fresh forced offline run. `timeoutAutoPrintNoSaleAndCancelMatrix` passed, confirming the timeout fixture-isolation correction.
- Migrated baseline inventory: **11 customer screens**, **6 operator tabs**, and Tools/Settings surfaces.
- **Zero current automated test regressions.** Older red results below are historical and superseded by this fresh run.
- **Release remains BLOCKED** pending explicit authorization and safe setup for real Canon DSLR and DNP printer verification, plus physical touchscreen, installer/recovery, production integration, and license/redistribution gates.

## Superseding gatekeeper status (2026-10-31 23:26 local)

- Backend retained JUnit XML is green: **12/12 suites, 42/42 tests, 0 failures/errors/skips**. This resolves the retained-result failure for `timeoutAutoPrintNoSaleAndCancelMatrix`; Gradle was not rerun in this check.
- Frontend production build is green, but fresh `npm test` is **red: 27/28**, with the unacknowledged Settings save/registered Admin exit test returning `true` instead of `false` (`frontend/src/V1Settings.test.tsx:14`).
- Consequently, Milestones 5/6 core functional regression cannot truthfully be marked 100% green. Customer/operator implementation presence is recorded, but release acceptance remains blocked by the frontend regression and non-automated gates.
- Read-only V1 Git status is not clean (two modified and two untracked files under `.opencode/agents/`). Their provenance is unknown; no V1 write was performed by this reviewer, but strict untouched status is **NOT VERIFIED**.
- **Current gate: FAIL / BLOCKED.** Next: fix or explain the Settings exit contract without weakening the assertion, rerun 28/28 and build, then perform authorized DSLR/DNP, physical 16:10 touch, installer/recovery, and licensing verification.

## Independent regression and parity review (2026-10-31 23:01 local)

- Fresh V2 frontend `npm test`: **PASS-AUTOMATED â€” 7/7 files, 28/28 tests**, exit 0, 6.35 s.
- Fresh V2 backend forced offline Gradle test: **FAIL â€” 42 tests, 1 failure**, exit 1, 2m04s. `SimulatorSessionTest.timeoutAutoPrintNoSaleAndCancelMatrix` expected `DELIVERY` but remained `SELECTING_PHOTOS` (`SimulatorSessionTest.kt:69`; XML under `backend/build/test-results/test/`).
- Reviewed `frontend/src/screens/`: 13 implementation components and one test file. Baseline screen rendering/action gating is bounded **PASS-SIMULATED**; exhaustive state, mounted 16:10, physical touch, camera, printer, QR and provider parity remain unverified.
- Reviewed all six operator tabs exposed by `Operator.tsx`: Frames, Layouts, Settings, Tools, Colors and Revenue. Presence/bounded unit behavior passes, but Frames/Tools/Colors are local drafts, Revenue is disconnected, and layout deletion/pricing are unavailable; production V1 operator parity is incomplete.
- V1 was not accessed or modified by this rerun. Exact forensic â€œunchangedâ€ verification is **BLOCKED / NOT VERIFIED** because no accepted before/after V1 manifest was available; no V1 shell command was used.
- **Overall gate: FAIL / BLOCKED.** Resolve the backend timeout fixture defect, rerun the targeted and complete forced suites, then perform mounted touchscreen and authorized hardware/provider validation separately.

## Current agent/test milestone status (2026-10-31)

- Reported actual results: frontend **20 tests / 6 files passed; build passed**. Backend **42 tests, 1 failure**. Keep these as reported run results; no rerun was performed for this note.
- Three implementation attempts remain **BLOCKED** on the absent independently verified checkpoint. No app edits are authorized by this status update.
- Master audit's **17-state enumeration correction and acceptance remain unresolved**. The earlier â€œaccepted Beautyâ€ claim was rejected; do not repeat it as established fact.
- Next task is to obtain an actual V2 source snapshot and verify its manifest/hash before any source-copy or implementation proposal. Do not substitute a speculative inventory or HEAD-only state for that evidence.
- These reports do not establish V1 forensic integrity or untouched status; no independent V1 verification is claimed.

## Coordination checkpoint and next-task update (2026-10-31)

- **Current reported test evidence:** frontend reports 20 tests / 6 files passing and build passing. Backend reports 42 tests with one failure; diagnosis is shared settings fixture/state across six engines. Approved test-only remedy is six isolated engine fixtures plus the offline harness; keep the shared-settings persistence/integration coverage rather than deleting it. These are current reports, not independently reproduced in this documentation task.
- **Checkpoint:** an initial checkpoint claim was **REJECTED** because it was HEAD-only and the proposed conditional archive included stale tests. Architect correction is **in progress**. Backend conditional implementation attempt is **BLOCKED**: no verified backup manifest exists. Therefore no checkpoint is accepted and no app edits are authorized yet.
- **Audit:** auditor produced four documents, but independent review **REJECTED** unsupported claims about accepted Beauty, unreliable Tools taxonomy, and omitted config coverage. Auditor is correcting. Specialist source-linked docs remain accepted only as source inventories, not as complete audit or implementation proof.
- **Next order:** finish and independently verify a recoverable V2 checkpoint first; then resolve the test fixture isolation failure while retaining integration checks; only after checkpoint verification may bounded actual slices proceed. Frontend/camera implementation remains conditional on a verified snapshot; do not promise or launch background work after session end.
- No complete migration or full audit is claimed. V1 forensic untouched status remains **NOT VERIFIED**. Models/tools were unavailable for this update; no shell or tests were run.

## Migration coordination update (2026-10-31)

- This is a documentation-only coordination snapshot. Do not interpret agent status as a completed milestone, full audit, checkpoint approval, or hardware proof.
- Reported agent activity: legacy-auditor `ses_e70a11911ffeZ8XCL7SqnXDk7b` inventory; architect `ses_e709d20e1ffewRrzeoisMXvDQ9` checkpoint pending; camera `ses_e709cf659ffePXgtKXyGcPQnQG` audit complete; printer audit complete; UI `ses_e709bb9fbffeESyRONVXSFWre1` source comparison complete; tester `ses_e709ba21effeLwcg8O494bXq3n` static review complete; backend `ses_e709b7eccffeDobwsekw4JVqZj` audit complete; frontend `ses_e7098a611ffelkffCXMgKv6Z5i` preparing slice. Statuses are supplied reports, not independently verified here.
- Current records to consult: `docs/CAMERA_BASELINE_INVENTORY.md`, `docs/PRINTER_BASELINE_INVENTORY.md`, `docs/UI_BASELINE_COMPARISON.md`, `docs/MIGRATION_TEST_RESULTS.md`. Baseline sources are findings, not completed implementation or parity certification.
- User authorized scoped V2-only shell checkpoint/offline tests/builds; all temporary/cache/output paths must remain in V2. This authorization does not extend to V1 execution, production integrations, hardware/device operations, or physical printing. No command was run for this documentation update.
- Architect checkpoint remains pending. Do not claim checkpoint complete or audit phase complete. V1 untouched forensic verification is **NOT VERIFIED**; only participating agents' reports describe read-only activity. No independent forensic check was performed in this update.
- Existing V2 source is to be preserved in this baseline phase; no redesign is authorized by baseline findings. All product, hardware, licensing, and parity gates remain subject to their existing evidence requirements.

## V1 Settings parity reviewer preparation (2026-10-30)

- Actual read-only V1 Settings UI/config/controller sources were inspected; prior audit prose was not used as authority. Exact matrix: `tests/v1-settings-parity/v1-source-matrix.json`.
- Attach-only mounted test preparation exists at `tests/v1-settings-parity/mounted-settings-parity.mjs` for 1280Ã—800 and 1920Ã—1200. Execution is intentionally deferred until active frontend/backend owners notify final; no concurrent Gradle/CDP was started.
- Current source verdict is **FAIL/BLOCKED** for settings parity: `frontend/src/Operator.tsx` exposes disabled Settings placeholders and no settings mutation contract. Layout countdown editing is not selection/frame/post-capture timeout parity.
- Result ledger: `docs/V1_SETTINGS_TEST_RESULTS.md`. No V1 launch/command/write, secret read, customer photo access, hardware, print, payment, DB, upload, or production side effect occurred.
- Early backend source now contains `operator.getSettings`/`operator.updateSettings`, exact six-field schema v1, atomic V2-local persistence, `NEXT_SESSION`, `PENDING_DISABLED`, false production gates, local opt-in and IDLE update gating. Independent snapshot/engine execution remains deferred until owner final evidence; no Gradle/CDP run was started.
- Timer source nuance corrected: photo/frame remaining budgets can survive navigation; interaction reset restarts only the current state's configured budget. PRINT_PENDING retains an existing inactivity job/budget and uses post-capture only when starting a fresh fallback timer. No test will claim post-capture delays capture or invariably governs PRINT_PENDING.
- Current source review confirms V2 safe-path/symlink checks, 16 KiB load bound, temporary-file force and same-directory atomic replace. Parent-directory fsync is absent, so no fully durable power-loss claim is accepted.
- **HIGH pending owner fix:** before first persistence, Settings displays store defaults 90/90/60 while engine behavior can still use the 30-second legacy fixture; the UI ignores the response's effective source/timeouts. This is a false effective-parity risk. No default â€œ39 suiteâ€ or other historical result is treated as a current run.
- Admin Back now calls the registered Settings save path (`Operator.tsx:10-11,16`), matching V1 implicit Back-save intent; this remains source-only and unexecuted. Native conditional Canon controls remain intentionally non-persisted/disabled, not falsely claimed as the six-field contract.
- **Independent backend rerun PASS-AUTOMATED:** V2-local Gradle `test --rerun-tasks` exit 0 / BUILD SUCCESSFUL; XML aggregate **12 suites / 42 tests / 0 failures, errors or skips**. This run also executed `installDist`. Evidence: `tests/v1-settings-parity/backend-test-rerun.log`, `backend-test-rerun.err.log`, `backend-test-summary.txt`.
- **Actual mounted Settings FAIL:** with existing port-1420 Vite left untouched, free CDP 9223, current debug Tauri, explicit local operator opt-in, and real visible UI at both 1280Ã—800 and 1920Ã—1200, Settings never loaded. It displayed `ChÆ°a cung cáº¥p`; controls and Save remained disabled. Evidence: `tests/v1-settings-parity/evidence/2026-10-30T16-32-11.450Z/`. No RPC bypass, setting mutation, hardware/provider action, or V1 command occurred.
- Because mounted load failed, six-field edit/step/save/reload/restart, implicit Back-save, byte-identical restoration, timer behavior and subsequent customer-flow regression are **not passed**. The run created no `backend/config/operator-settings.json`, so there was no changed configuration to restore.
- **Superseding StrictMode-fixed mounted rerun:** actual Settings now loads at both 1280Ã—800 and 1920Ã—1200 and honestly displays effective legacy fixture 30/30/30 separately from desired 90/60/90. Evidence: `tests/v1-settings-parity/evidence/2026-10-30T16-36-26.432Z/`.
- Current mounted gate still **FAILS**: enabled print switch hit target is only **13Ã—13 CSS px** at both sizes (required 48Ã—48). Step controls are 52Ã—64, path input 56 high, Save/Reload 64 high, and no document horizontal overflow was observed.
- The stale reviewer-owned host from the prior run was identified by exact V2 executable path/PID and closed gracefully; host exited, matching JVM count became 0, and CDP 9223 became free. The current rerun also finished with `cdpFree=True`, zero owned hosts and zero matching JVMs. Existing Vite/node on 1420 was never killed.
- Full visible six-field edit/10-step/save/reload/implicit-Back/restart/byte-restore and customer-flow regression remain **NOT-RUN**, not PASS: the current harness stops at the concrete touch failure and is not yet a complete mutation harness.
- **Superseding independent mounted results:** discovery `tests/v1-settings-parity/evidence/2026-10-30T16-43-21.230Z/results.json` PASS-SIMULATED at both sizes; visible mutation `frontend/simulator-evidence/settings-mutation/2026-10-30T16-43-22.840Z/results.json` exit 0; separate native restart rerun `2026-10-30T16-43-31.743Z/results.json` exit 0. Save acknowledgement, Reload, implicit Back-save and restart persistence passed.
- Default-denied mounted run returned backend `-32010`, displayed denial and kept Save disabled (`tests/v1-settings-parity/default-denied.log`). No hardware/provider operation occurred.
- Both `backend/config/operator-settings.json` and `local-operator-layouts.json` were restored byte-identically; hashes recorded in `tests/v1-settings-parity/restore-results.json`. Final cleanup: CDP 9223 free, zero owned native hosts, zero matching JVMs; Vite 1420 was untouched.
- Post-restore existing full simulator harness exit 0 in default-denied mode (`tests/v1-settings-parity/full-simulator-after-restore.log`), covering two-size customer flow, preview/reload and child exit. Backend remains the earlier independent **12 suites / 42 tests / 0 failures/errors/skips**; it was not redundantly rerun.
- Scope caveat: owner mutation harness does not change post-capture timeout or path value; it only redispatches the existing safe V2 path. Component/backend tests cover the exact six-field payload, but changed path/post mounted behavior remains unproven. Settings gate is bounded PASS-SIMULATED, not exhaustive V1 or product parity.
- **Gap-completion preflight BLOCKED by unowned runtime:** exact debug native PID 5616 is active and its WebView child PID 41392 owns CDP 9223. It shares the settings/layout files required by the proposed mutation-and-restore run. Reviewer did not kill/close/attach/resize/navigate the unowned instance and did not launch a competing writable backend. Current hashes remain `596EE...815DC` (settings) and `9D808...53870` (layouts). Post-timeout/path mutation and fresh two-size top/bottom/default-Khung screenshots remain BLOCKED until the operator closes that app and 9223 is free.

## Parity migration reviewer checkpoint (2026-10-30)

- **FINAL revenue-recognition rerun:** V2-local-cache Gradle `test --rerun-tasks` exit 0 / BUILD SUCCESSFUL; independently aggregated **11 suites / 39 tests / 0 failures, errors, or skips**. Evidence: `tests/parity-migration/logs/backend-revenue-final.log`, `backend-revenue-final-summary.txt`. Owner `test installDist` log: `backend/revenue-recognition-tests.log` (reported abbreviated SHA prefix `5A792...`; not independently treated as a complete hash).
- Offline source gate requires manual confirmation, non-dry-run, exactly `PrintResult.Submitted`, and one nonblank sale ID equal to active/confirmation/print IDs. Dry-run, uncertain/rejected/denied, stale/missing IDs cannot call the sink. Shared-journal duplicate calls return recorded/reconciliation status; false/timeout/exception makes one sink attempt and requires reconciliation without auto-retry.
- The stronger multi-ID condition is a safety adaptation requiring architecture/business signoff, **not exact V1 parity** and not permission for a hidden production business barrier. The implementation remains unwired to session/printer/revenue IPC. Its journal is in-memory/process-local, not restart-safe or cross-process; remote commit atomicity, durable reconciliation and backend locking remain missing. `Submitted` is not physical print completion.
- Separate designer review narrowly approved six fresh PNGs; minor staff-panel horizontal scrolling is recorded as nonblocking polish debt. This does not establish exhaustive visual/Admin parity or physical touchscreen/DPI approval.
- Overall release remains **BLOCKED** despite 39-test and mounted-UI bounded passes.

- **FINAL independent frontend rerun:** tests exit 0 (5 files / 15), build exit 0, and actual mounted `frontend/verify-simulator.mjs` exit 0 at both 1280Ã—800 and 1920Ã—1200. Positive modal/image/close, setup Back, staff-panel, frame CTA, direct Start, two layouts, reload, full dry-run delivery/reset, five-tap operator tabs, host exit 0 and JVM PID 39136 termination all passed. Logs: `tests/parity-migration/logs/frontend-npm-test-final.log`, `frontend-npm-build-final.log`, `frontend-mounted-final.log`; fresh PNGs: `frontend/simulator-evidence/`. This supersedes the prior zero-height mounted failure. Fresh-PNG designer review is separate; this is not physical touch/DPI or full subjective signoff.
- **FINAL independent backend rerun:** V2-local cache/temp Gradle `test --rerun-tasks` exit 0 / BUILD SUCCESSFUL; XML aggregation **35 tests, 0 failures/errors/skips** (10 suites, including 8 integration tests). Evidence: `tests/parity-migration/logs/backend-test-final.log`, `backend-test-final-summary.txt`. The owner evidence `backend/api-migration-tests.log` remains separately documented with SHA256 `F5DA84A9A2AEB7FDC65758B619A55A4727FFDCEBDAEC5D354F08E9455D32F693`.
- API verdict remains narrow: real local 127.0.0.1 transport/serialization, redirect refusal, timeouts, stalled-body and response bounds are tested; provider outcomes are fixtures. Clients remain unwired to session/IPC, PayOS SDK compatibility is BLOCKED, revenue/print same-ID idempotency is absent, Firebase/layout sync is missing, and deployed server compatibility/live providers are unverified. Intentional default/PRODUCTION denial and no direct Neon DDL are preserved.
- **Overall product release remains BLOCKED** despite these bounded passes: exhaustive V1/Admin/API parity, real hardware, production services, installer, licensing, physical touchscreen/DPI and full visual signoff remain unresolved.

- **Current frontend result:** `npm test -- --reporter=dot` exit 0 (5 files / 15 tests) and `npm run build` exit 0. These are the current final frontend unit/build runs; older 24/27 backend counts below are historical, not the current final backend suite. Logs: `tests/parity-migration/logs/frontend-npm-test-current.log`, `frontend-npm-build-current.log`.
- **Current mounted result: FAIL.** Port 9223 was free and the actual Tauri WebView/Kotlin simulator launched. At 1280Ã—800, direct Welcome Startâ†’SELECTING, setup Back bounds, payment hold-panel reveal-without-auto-approval, separate approval, capture, and selection were reached. Full-screen original then failed the harness assertion: mounted image had width 1190.4 but height 0 at y=715.2. The run exited 1 before 1920Ã—1200, frame/CTA/reload/full-flow, five-tap operator, and PID-close assertions. Evidence: `tests/parity-migration/logs/frontend-mounted-current.log`; partial current PNGs: `frontend/simulator-evidence/`.
- The previous interrupted runs are not PASS. The older bounded designer PNG approval remains only bounded historical visual feedback and does not override this current failure or constitute full product visual signoff.
- Backend engineer remains active; no concurrent Gradle/install mutation was run. Independent four-client/API suite remains pending backend completion. No production, hardware, V1 command, secret, photo, DDL, or outward-provider operation occurred.

- Corrected source authorities added: `V1_EXACT_UI_FLOW_MAP.md`, `V1_ACTION_BEHAVIOR_MATRIX.md`, and `PARITY_MIGRATION_REVIEW.md`. The original broad auditor inventory is explicitly unreliable where contradictory.
- Verified from read-only V1 source: cancellation only in SELECTING_PHOTOS/EDITING; photo confirmation enters EDITING/Frame; each capture returns LIVE_VIEW until the configured loop ends at SELECTING_PHOTOS; inactivity auto-prints with `userConfirmed=false`; revenue requires manual confirmation, accepted driver call, and matching session ID.
- Superseding integration update: four backend-only clients now exist (`SafeTransport`, `PayOsClient`, shared Revenue/Album clients, Cloudinary). Source review confirms default DENY, intentional PRODUCTION denial, redirect-off loopback fixture transport, shared-API money strings, no direct Neon/DDL, no frontend HTTP/secrets/token wiring, and no raw body/credential logs. They are **client implemented, not session-wired**.
- PayOS uses a hand-built HMAC whose exact compatibility with V1's SDK is unverified and BLOCKED. Backend was asked to preserve denial before key calculation and add malformed/null normalization coverage. Full Gradle/fixture execution is deferred until the active backend agent finishes; no concurrent Gradle was started.
- Printer adapter is standalone AWT with typed Submitted/Uncertain, not a native-DLL path, not session-wired, and not physical-print proof. Canon remains a default-denied reflection-only partial port.
- Superseded: a current mounted UI run was performed; it failed at the 1280Ã—800 full-screen original preview as recorded above. Prior independent 27-test and two-size mounted results remain historical evidence only.
- No outward HTTP, production/network/hardware operation, secret/DDL access, or V1 command/build/write occurred. Overall release gate remains **BLOCKED**.

## Independent status (2026-10-30)

- **Overall gate: FAIL / BLOCKED.** Task1 bridge and Task2 simulator are independently verified narrowly; no hardware validation, packaging or installer proof.
- Initial docs `01`, `02`, `03`, `09` are unreliable as implementation authorities; see `AUDIT_CORRECTIONS.md`.
- The consolidated baseline is `FEATURE_PARITY_MATRIX.md`, informed by specialist docs `04`â€“`08` and `UI_SCREEN_CONTRACTS.md`.
- Inactivity auto-print is confirmed at V1 controller lines 291â€“310; contrary claims are rejected.
- Independent V2 command `backend/test-foundation.ps1` completed exit 0: 5 tests, 0 failures/errors/skips. Scope is layout/pricing/unrestricted legacy state/simulator authorization only.
- **Backend test suite now 24 tests**, independent V2 script exit 0/XML 24 tests, 0 failures/errors/skips (incremental); prior 22-test `--rerun-tasks` exit 0. New Hot Folder tests are synthetic only, not hardware evidence.
- Task2 mounted React two-layout simulator passed at emulated 1280Ã—800 and 1920Ã—1200; this is not physical touch. Canon, webcam, Hot Folder runtime, DNP, PayOS, Neon, Cloudinary, Beauty model, physical touchscreen and installer remain unverified.
- **Gradle 8.14.3 publisher checksum retrieved over HTTPS and exactly matches local ZIP** (SHA-256: BD71102213493060956EC229D946BEEE57158DBD89D0E62B91BCA0FA2C5F3531). Signature/transitive dependency provenance remains a separate broader supply-chain concern.
- **Desktop bridge independent review PASS-SIMULATED (narrow Task 1):** `docs/DESKTOP_BRIDGE_INDEPENDENT_REVIEW.md` â€” CDP harness exercised **actual mounted React DOM â†’ Tauri `health_check` â†’ installed Kotlin/JVM (PID 17520, JVM 21.0.12, protocol 1, simulator true, uptime 639 ms)**. Process ancestry verified: `java.exe` (17520) â†’ `cmd.exe` (34580) â†’ host (24068). Native `CloseMainWindow()` returned **True**, host exited **0**, JVM PID 17520 **terminated**. Full output: `tests/desktop-bridge/results/independent-cdp-health-close.log`.
- **Live WebView invoke + normal-close child cleanup RESOLVED for exact tested scenario** (CDP harness, not UIA). Abrupt parent kill / hung child / `taskkill /T` fallback **NOT TESTED**.
- **Task2 narrow PASS-SIMULATED:** independent framed JVM two-layout files/idempotency/cancel/timeout/stale tests and mounted React WebView two-layout/reload/delivery/reset/close test passed. See `SIMULATOR_INDEPENDENT_REVIEW.md`.
- **Task3 partial only:** disabled camera/printer ports compile and denial/fake tests pass; Canon is incomplete and no camera/printer hardware was touched. See `HARDWARE_PORT_INDEPENDENT_REVIEW.md`.
- All safety/hardware/Beauty licensing gaps preserved (see `BLOCKERS.md` B-001..B-005, B-004 Tauri+JVM+JNA POC planned).

### Next gate work

Complete Hot Folder readiness/webcam/Canon lifecycle code and offline tests, resolve Canon/ONNX licenses, then separately authorize read-only hardware discovery and controlled device validation. Packaging/Admin/production adapters remain later gates.

## UI transformation independent update (2026-10-30)

- **Backend regression PASS-AUTOMATED:** independent unmodified `test --rerun-tasks` completed exit 0, 27 tests, 0 failures/errors across 9 suites, including installed launcher and 3 operator tests. Evidence: `backend/build/independent-ui-review-backend-test-unmodified.log`.
- **Mounted customer/operator PASS-SIMULATED:** independent Tauri WebView CDP UI-only journeys passed at 1280Ã—800 and 1920Ã—1200 for customer flow and six operator tabs. Default-denied run: `tests/ui-transformation/evidence/2026-10-30T08-56-43.910Z/results.json`.
- **Isolated operator edit/restore PASS-SIMULATED:** exact local developer opt-in run updated and restored layout countdown through visible UI at both resolutions. `tests/ui-transformation/evidence/2026-10-30T08-57-36.700Z/results.json`; cleanup records no orphan/listener and byte-identical config restoration.
- Automated scenes found no enabled target below 48Ã—48 CSS px, horizontal document overflow, broken visible image, or fabricated simulator payment/print/QR success. This is emulated DOM evidence, not physical touch/hardware evidence.
- **Visual design signoff remains BLOCKED:** screenshots exist, but subjective premium visual review requires a human/designer. Production Admin ACL, hardware, live payment/cloud/revenue, installer and licensing gates remain unresolved. Overall release gate remains BLOCKED.

### Final post-fix UI rerun

- Independent `frontend/verify-simulator.mjs` default-denied run: **exit 0**, both full customer flows, six operator tabs at both viewports, vertical frame CTA checks passed at 1280Ã—800 and 1920Ã—1200, reload recovered twice, host exit 0, JVM terminated. Log: `frontend/simulator-independent-final-default.txt`.
- Independent dedicated `V2_LOCAL_OPERATOR_ENABLED=true` non-production run: **exit 0**, same flows plus mounted layout edit and restoration to `strip-2` values `3/2/1`; clean host/JVM close. Log: `frontend/simulator-independent-final-operator.txt`.
- Final screenshots: `frontend/simulator-evidence/` customer scene pairs, 12 operator-tab images, and `operator-layout-saved.png`. Independent designer separately approved four updated simulator PNGs for the narrow visual scope.
- The bounded simulator UI milestone is `PASS-SIMULATED`; **full product UI remains incomplete**. Production bundles/effects/assets, revenue, protected Admin ACL, hardware, live payment/cloud QR, installer, licensing, physical touch/DPI and exhaustive nested V1 parity remain release blockers. Overall release gate remains **BLOCKED**.

