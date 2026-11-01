# Migration Test Results

**Verification date:** 2026-11-01  
**Scope:** LE SOUVENIR V2 only. These results do not constitute physical-hardware or production-provider approval.

## Current verified summary

| Test area | Classification | Command / evidence | Result |
|---|---|---|---|
| Backend Gradle | **PASS-AUTOMATED** | `gradle test installDist` | **76/76 tests passed** across 17 test suites (`BUILD SUCCESSFUL`). Suites include `CameraConnectionManagerTest` (5 tests), `RealSessionEngineDemoModeTest` (1 test), `FirebaseCatalogServiceTest` (3 tests), `DemoCameraAdapterTest` (3 tests), `RealSessionEngineTest`, and all baseline integration suites. The distribution install task also completed. |
| Frontend Vitest | **PASS-AUTOMATED** | Frontend Vitest run (`npm test -- --run`) | **40/40 tests passed across all test files**, including `screens.test.tsx`, `KioskUI.test.tsx`, `PaymentScreen.test.tsx`, and `V1Settings.test.tsx`. |
| Frontend production build | **PASS-AUTOMATED** | `tsc --noEmit && vite build` | Passed with **2,015 modules transformed and 0 errors in 3.55s**. |
| Live desktop CDP journey | **PASS-SIMULATED** | `tests/verify-demo-and-real-journey.mjs` | **35/35 checks passed, 26 screenshots, 0 failures** across both 1280×800 and 1920×1200 viewports. Retained results: `tests/journey-evidence/2026-11-01T14-23-26.975Z/results.json`. |

The live desktop test exercised the packaged Tauri executable interacting with the real Kotlin backend over standard private IPC. It proved that the unified application correctly falls back to mock capture and dry-run print when camera hardware is offline, and that the Korean photo studio UI displays accurately at both 16:10 viewports with zero viewport overflow. Because physical Canon and DNP hardware were not attached during this run, the test is classified **PASS-SIMULATED**.

---

## Live desktop journey details

### Part A — Unified Single-Application UX & DEMO Journey

The harness completed the customer journey from **Start through Delivery** at both **1280×800** and **1920×1200** viewports. It verified:

- **Clean Unified StartScreen:** Verified absence of manual `.v1-mode-badge` or `.v1-offline-banner` mode switches. Customers experience an uncluttered atelier greeting with active layout/bundle selection.
- **Firebase Catalog Live/Cache Integration:** Confirmed Firestore layout names (`515_4_anh`, `1015_4_base`, `1015_4_ILCL`) rendered from live Firebase sync or local disk cache.
- **Quantity Stepper:** Stepper correctly adjusted quantity to 2 prints, updating dynamic pricing calculations.
- **Complimentary Studio Trial Banner:** In demo/camera-offline fallback, `PaymentScreen` displayed the complimentary studio trial card (`0 đ`, `Miễn phí`, no live bank transfer prompt), and the `"BẮT ĐẦU CHỤP →"` action button.
- **Mock Capture Sequence:** Four mock captures supplied by `DemoCameraAdapter` with dynamic aspect-ratio guides, countdown pulses, and shutter flash animations.
- **Photo & Frame Selection:** 4 captures selected according to `selectCount`, and frame preview rendered.
- **600 DPI High-Resolution Composition:** Preview canvas verified in the browser via `naturalWidth > 0`.
- **Dry-Run Delivery:** Completed delivery with QR code presentation and verified that `confirmPrint` returned `dryRun: true` and `revenueRecorded: false`.

### Part B — REAL-Mode Payment Display & Camera Auto-Fallback

The harness verified the payment screen behavior when operating on the real-mode path:

- **V1 Parity UI Elements:** Verified `Bước 3` eyebrow, `Thanh toán` title, quantity `2 bản`, and total `70.000 đ`.
- **Automatic Fallback on Offline Camera:** Verified that when the physical camera is offline, the screen automatically reveals the complimentary mock experience without throwing errors or trapping the customer.
- **Staff Gesture Security:** Verified that the staff cash-override button remains completely hidden from customers until the 700 ms dwell gesture on the header is completed.

---

## Evidence location

- **Current Journey Results (35/35 checks, 26 screenshots):** `tests/journey-evidence/2026-11-01T14-23-26.975Z/results.json`
- **Screenshots:** `tests/journey-evidence/2026-11-01T14-23-26.975Z/*.png` (1280×800 and 1920×1200 pairs for start, layout, quantity, payment, live, select, frame, confirm, delivery)
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
- Frontend: **40/40 Vitest tests passed**.
- Build: **0 errors, 2,015 modules transformed in 3.55s**.
- Desktop Journey: **35/35 checks passed, 0 failures, 26 screenshots** (`2026-11-01T14-23-26.975Z`).

The software application, automatic camera fallback, Korean photo studio design system, and zero-revenue safety guards are complete and verified. The project is fully prepared for controlled hardware-lab testing upon physical camera and printer attachment.
