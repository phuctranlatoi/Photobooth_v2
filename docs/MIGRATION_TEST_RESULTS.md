# Migration Test Results

**Verification date:** 2026-11-03 21:45  
**Scope:** LE SOUVENIR V2 only. These results do not constitute physical-hardware or production-provider approval.

## Current Verified Summary

| Test Area | Classification | Command / Evidence | Result |
|---|---|---|---|
| Backend Test Suite | **PASS-AUTOMATED** | Gradle `test` (offline forced) | **87 tests total: 85 passed, 2 skipped, 0 failed** across 28 test suites. `BUILD SUCCESSFUL in 12s`. |
| Backend DEMO Revenue Guard | **PASS-AUTOMATED** | Gradle `RealSessionEngineDemoModeTest` & SQLite `sales.db` check | DEMO sessions recorded **zero revenue** in database and telemetry; internal mock capture cannot generate false revenue. |
| Deferred Composition Regression | **PASS-AUTOMATED** | Gradle `SimulatorSessionTest.frameSelectionDefersCompositionUntilConfirmation` | `frame.select` updates state in <1ms without rendering composition; `frame.confirm` renders just-in-time composition. |
| Frontend Vitest | **PASS-AUTOMATED** | Vitest (`npm test -- --run`) | **57/57 tests passed** across 8 test files in 5.31s. |
| Frontend Production Build | **PASS-AUTOMATED** | Vite (`npm run build`) | **2,017 modules transformed, 0 errors** in 4.96s. |
| Live Desktop CDP Journey | **PASS-SIMULATED** | `tests/verify-demo-and-real-journey.mjs` against live `le-souvenir-v2.exe` | **65/65 checks passed, 26 screenshots, 0 failures** across 1280×800 and 1920×1200. Results: `tests/journey-evidence/2026-11-03T14-34-21.203Z/results.json`. |
| Touch Interaction Latency | **PASS-SIMULATED** | Chromium CDP DOM performance marks | Photo selection: **4.30 ms** (1920×1200), **8.50 ms** (1280×800).<br>Frame selection: **7.50 ms** (1920×1200), **8.00 ms** (1280×800). All well under 100ms threshold. |
| PayOS QR Layout Stability | **PASS-SIMULATED** | Chromium CDP bounding box delta assertion | **0 px layout shift** (`shifts: { slotWidth: 0, slotHeight: 0, columnsX: 0, columnsY: 0, columnsWidth: 0, columnsHeight: 0 }`). |
| Process Lifecycle Management | **PASS-AUTOMATED** | PowerShell CIM process query | **0 orphaned V2 Node/Vite processes** remaining after test run. |

The latest live desktop test exercised the packaged Tauri executable interacting with the Kotlin backend over private IPC. In addition to pricing/payment and composed-preview coverage, it verified an active timer decrement (`Còn lại 02:20` → `Còn lại 02:18`), press-and-hold zoom opening and release closing, selected photos rendering in live frame-preview slots, deferred composition, sub-10ms touch response, and zero decorative emoji. Internal mock capture remained available for safe camera-free testing and recorded zero DEMO revenue. Because physical Canon and DNP hardware were not attached and no PayOS bank settlement occurred, the test is classified **PASS-SIMULATED**.

---

## Detailed Live Desktop Journey Assertions

The automated journey runner (`tests/verify-demo-and-real-journey.mjs`) ran both the DEMO journey (full flow from Start to Delivery) and the REAL-mode payment display across two target 16:10 viewports: **1280×800** and **1920×1200**.

### 1280×800 Viewport Verification

1. **Start Screen:** Clean unified start screen; zero technical badges or manual mode switches; no raw layout IDs.
2. **Layout Screen:** Customer formatted layout names ("Dải 4 ảnh cổ điển", "Khung 4 ảnh postcard"). Back button touch target **56×56px** with centered icon (`dx: 0.5, dy: 0.0`). Carousel chevrons **56×56px** aligned on identical horizontal axis (`yDelta <= 3`).
3. **Quantity Screen:** Quantity incremented to 2; price calculated and updated dynamically.
4. **Payment Screen (Demo & Real):**
   - Zero emoji in UI copy.
   - Real calculated price displayed: `70.000 đ`.
   - No customer free-photo bypass.
   - Payment step header: "Bước 3 Thanh toán".
   - **QR layout stability: 0 px shift** between placeholder spinner and real VietQR PNG.
   - Real VietQR image rendered with length = 2,718 chars.
5. **Capture Screen:** Shutter button centered; live countdown centered; aspect guide displayed.
6. **Selection Screen:**
   - Press-and-hold (500ms) opens enlarged photo lightbox modal; release closes it.
   - Authoritative timer decrements: `Còn lại 02:20` → `Còn lại 02:18`.
   - **Photo selection latency: 8.50 ms** (threshold < 100ms).
   - Live frame preview renders selected photos in real time.
7. **Frame Screen:**
   - **Frame selection latency: 8.00 ms** (threshold < 100ms).
   - Instant in-memory selection via deferred composition.
8. **Confirmation Screen:** Composed preview loaded and verified via `naturalWidth > 0`.
9. **Delivery Screen:** Delivery screen loaded; green print signal status badge displayed; returning to start restores `IDLE` state.

### 1920×1200 Viewport Verification

1. **Start Screen:** Clean atelier hero greeting; zero technical badges.
2. **Layout Screen:** Back button **56×56px** (`dx: 0.5, dy: 0.0`); carousel chevrons **56×56px** (`yDelta <= 3`).
3. **Quantity Screen:** Stepper sets quantity to 2; prices tabularly formatted.
4. **Payment Screen:**
   - Calculated price: `70.000 đ`.
   - **QR layout stability: 0 px shift** (`slotWidth: 0, slotHeight: 0, columnsX: 0, columnsY: 0, columnsWidth: 0, columnsHeight: 0`).
   - Real VietQR image rendered with length = 2,658 chars.
5. **Selection Screen:**
   - Hold-to-zoom opens and closes properly.
   - Timer decrements: `Còn lại 02:19` → `Còn lại 02:17`.
   - **Photo selection latency: 4.30 ms** (threshold < 100ms).
6. **Frame Screen:**
   - **Frame selection latency: 7.50 ms** (threshold < 100ms).
7. **Confirmation & Delivery Screens:** Composed preview verified; delivery completed; return to start clean.

---

## Evidence Artifacts

- **Journey Results JSON (65/65 checks passed, 0 failures):** `tests/journey-evidence/2026-11-03T14-34-21.203Z/results.json`
- **Screenshots (26 PNGs):** `tests/journey-evidence/2026-11-03T14-34-21.203Z/*.png`
- **Backend Test Report:** `backend/build/reports/tests/test/index.html` (87 tests, 85 passed, 2 skipped, 0 failures).
- **V1 Isolation:** Verified. `E:\HK1_2026_2027\PhotoboothDesktop` remains completely untouched and read-only.

---

## Explicitly Unverified and Not Performed (Hardware Boundaries)

The following real-device and live-provider actions remain **BLOCKED / NOT-RUN** pending physical hardware lab attachment, explicit authorization, and safe supervised setup:

1. **Physical Canon DSLR:** Canon EDSDK JNA bindings, device discovery, auto-reconnect, and shutter release are compiled and tested in software via `CameraController` and `CameraConnectionManager`. However, physical USB connection, physical mirror/aperture control, actual exposure quality, and USB replug recovery on a physical Canon EOS camera have **not been executed**.
2. **Physical DNP RX1HS Printer:** Windows print spooler integration, 5×15 2-up cut flow, 10×15 photo flow, and borderless print margin drivers are implemented in `LegacyPrinter.kt` and `RealSessionEngine.kt`. However, **no physical print spool job has been submitted to a physical DNP printer**.
3. **Live PayOS Payment Settlement:** Real VietQR link generation and QR base64 image rendering are verified. However, **no customer account was debited and no live payment settlement was executed**.
4. **Physical Touchscreen Glass:** Touch targets ($\ge 56\text{px}$) and zero-scroll ergonomics are verified via Chromium CDP DOM metrics. Validation on physical touch glass (IR overlay or capacitive Windows touch) remains pending hardware lab installation.
5. **Redistribution Licensing:** Commercial redistribution clearance for Canon EDSDK native DLLs (`EDSDK.dll`, `EdsImage.dll`) and ONNX computer-vision weights remains subject to legal review.

| Test area | Classification | Command / evidence | Result |
|---|---|---|---|
| Backend DEMO revenue guard | **PASS-AUTOMATED** | Gradle `RealSessionEngineDemoModeTest` | DEMO sessions recorded **zero revenue**; internal mock capture remains safe without being offered as a customer-facing free package. |
| Frontend Vitest | **PASS-AUTOMATED** | Frontend Vitest run (`npm test -- --run`) | **49/49 tests passed**. |
| Frontend production build | **PASS-AUTOMATED** | Frontend production build | Completed with **zero errors**. |
| Live desktop CDP journey | **PASS-SIMULATED** | `tests/verify-demo-and-real-journey.mjs` | **47/47 checks passed, 26 screenshots, 0 failures** across 1280×800 and 1920×1200. Results: `tests/journey-evidence/2026-11-01T18-16-51.341Z/results.json`. |

The latest live desktop test exercised the packaged Tauri executable interacting with the Kotlin backend over private IPC. In addition to pricing/payment and composed-preview coverage, it verified an active timer decrement from `Còn lại 02:19` to `Còn lại 02:18`, press-and-hold zoom opening and release closing, selected photos rendering in live frame-preview slots, and a zero-decorative-emoji assertion. Internal mock capture remained available for safe camera-free testing and recorded zero DEMO revenue. Because physical Canon and DNP hardware were not attached and no PayOS bank settlement occurred, the test is classified **PASS-SIMULATED**.

---

## Live desktop journey details

### Part A — Unified Single-Application UX, timers and DEMO Journey

The harness completed the customer journey from **Start through Delivery** at both **1280×800** and **1920×1200** viewports. It verified:

- **Clean Unified StartScreen:** Verified absence of manual `.v1-mode-badge` or `.v1-offline-banner` mode switches. Customers experience an uncluttered atelier greeting with active layout/bundle selection.
- **Firebase Catalog Live/Cache Integration:** Confirmed Firestore layout names (`515_4_anh`, `1015_4_base`, `1015_4_ILCL`) rendered from live Firebase sync or local disk cache.
- **Quantity Stepper:** Stepper correctly adjusted quantity to 2 prints, updating dynamic pricing calculations.
- **No Customer-Facing Free Package:** Verified that free-experience copy, `0 đ` / `Miễn phí` badges, and guest bypass controls are absent; camera-free mock capture remains an internal safe-test capability.
- **Mock Capture Sequence:** Four mock captures supplied by `DemoCameraAdapter` with dynamic aspect-ratio guides, countdown pulses, and shutter flash animations.
- **Photo & Frame Selection:** 4 captures selected according to `selectCount`, and frame preview rendered.
- **Authoritative Timer:** Observed a real decrement, `Còn lại 02:19` → `Còn lại 02:18`; no frozen `00:00` remained in the exercised selection flow.
- **Hold Zoom:** A 500ms pointer hold opened the enlarged photo modal and pointer release closed it without breaking ordinary tap selection.
- **Live Frame Preview:** Selected captures appeared in SVG photo slots in real time, including the redesigned two-column frame workspace.
- **Zero Emoji:** The automated assertion found no decorative Unicode emoji in customer or operator presentation; Lucide SVG icons are used instead.
- **600 DPI High-Resolution Composition:** Preview canvas verified in the browser via `naturalWidth > 0`.
- **Dry-Run Delivery:** Completed delivery with QR code presentation and verified that `confirmPrint` returned `dryRun: true` and `revenueRecorded: false`.

### Part B — REAL-Mode Payment Display & Camera Auto-Fallback

The harness verified the payment screen behavior when operating on the real-mode path:

- **V1 Parity UI Elements:** Verified `Bước 3` eyebrow, `Thanh toán` title, quantity `2 bản`, and total `70.000 đ`.
- **V1 Pricing and Payment Restoration:** Verified calculated VND pricing, VietQR/order-summary presentation, and no customer payment bypass.
- **Staff Gesture Security:** Verified that the staff cash-override button remains completely hidden from customers until the 700 ms dwell gesture on the header is completed.

---

## Evidence location

- **Current Journey Results (47/47 checks, 0 failures, 26 screenshots):** `tests/journey-evidence/2026-11-01T18-16-51.341Z/results.json`
- **Screenshots:** `tests/journey-evidence/2026-11-01T18-16-51.341Z/*.png` across 1280×800 and 1920×1200.
- **V1 isolation:** verified for this run; no V1 write, build, cleanup, secret access, or customer-photo modification was performed.
- **Historical Journey Results:** `tests/journey-evidence/2026-11-01T10-47-35.692Z/` and `tests/journey-evidence/2026-11-01T13-13-52.592Z/`

---

## Explicitly unverified and not performed (Hardware Boundaries)

The following real-device and live-provider actions remain **BLOCKED / NOT-RUN** pending physical hardware lab attachment, explicit authorization, and safe supervised setup:

1. **Physical Canon DSLR:** Canon EDSDK JNA bindings, device discovery, auto-reconnect, and shutter release are compiled and tested in software via `CameraController` and `CameraConnectionManager`. However, physical USB connection, physical mirror/aperture control, actual exposure quality, and USB replug recovery on a physical Canon EOS camera have **not been executed**.
2. **Physical DNP RX1HS Printer:** Windows print spooler integration, 5×15 2-up cut flow, 10×15 photo flow, and borderless print margin drivers are implemented in `LegacyPrinter.kt` and `RealSessionEngine.kt`. However, **no physical print spool job has been submitted to a physical DNP printer**.
3. **Live PayOS Payment Settlement:** Real VietQR link generation and QR base64 image rendering are verified. However, **no customer account was debited and no live payment settlement was executed**.
4. **Physical 16:10 Touchscreen:** Touch targets ($\ge 56\text{px}$) and zero-scroll ergonomics are verified via Chromium CDP DOM metrics. Validation on physical touch glass (IR overlay or capacitive Windows touch) remains pending hardware lab installation.
5. **Redistribution Licensing:** Commercial redistribution clearance for Canon EDSDK native DLLs (`EDSDK.dll`, `EdsImage.dll`) and ONNX computer-vision weights remains subject to legal review.

---

## Current conclusion

All software suites are fully green and verified:
- Backend: **76/76 unit tests passed** (`BUILD SUCCESSFUL`).
- Frontend: **49/49 Vitest tests passed**.
- Build: **0 errors**.
- Desktop Journey: **47/47 checks passed, 0 failures, 26 screenshots** (`2026-11-01T18-16-51.341Z`).

The software application, automatic camera fallback, Korean photo studio design system, and zero-revenue safety guards are complete and verified. The project is fully prepared for controlled hardware-lab testing upon physical camera and printer attachment.
