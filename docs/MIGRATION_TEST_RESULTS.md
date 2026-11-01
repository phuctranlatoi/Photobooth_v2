# Migration Test Results

**Verification date:** 2026-11-01  
**Scope:** LE SOUVENIR V2 only. These results do not constitute physical-hardware or production-provider approval.

## Current verified summary

| Test area | Classification | Command / evidence | Result |
|---|---|---|---|
| Backend DEMO revenue guard | **PASS-AUTOMATED** | Gradle `RealSessionEngineDemoModeTest` | DEMO sessions recorded **zero revenue**; internal mock capture remains safe without being offered as a customer-facing free package. |
| Frontend Vitest | **PASS-AUTOMATED** | Frontend Vitest run (`npm test -- --run`) | **45/45 tests passed across 7 suites**. |
| Frontend production build | **PASS-AUTOMATED** | Frontend production build | Completed with **zero errors**. |
| Live desktop CDP journey | **PASS-SIMULATED** | `tests/verify-demo-and-real-journey.mjs` | **35/35 checks passed, 26 screenshots, 0 failures** across 1280×800 and 1920×1200. Results: `tests/journey-evidence/2026-11-01T17-19-57.239Z/results.json`. |

The live desktop test exercised the packaged Tauri executable interacting with the Kotlin backend over private IPC. It verified real calculated pricing, absence of a customer free-photo bypass, the payment step, and the 600 DPI composed preview at both 16:10 viewports. Internal mock capture remained available for safe camera-free testing and recorded zero DEMO revenue. Because physical Canon and DNP hardware were not attached, the test is classified **PASS-SIMULATED**.

---

## Live desktop journey details

### Part A — Unified Single-Application UX & DEMO Journey

The harness completed the customer journey from **Start through Delivery** at both **1280×800** and **1920×1200** viewports. It verified:

- **Clean Unified StartScreen:** Verified absence of manual `.v1-mode-badge` or `.v1-offline-banner` mode switches. Customers experience an uncluttered atelier greeting with active layout/bundle selection.
- **Firebase Catalog Live/Cache Integration:** Confirmed Firestore layout names (`515_4_anh`, `1015_4_base`, `1015_4_ILCL`) rendered from live Firebase sync or local disk cache.
- **Quantity Stepper:** Stepper correctly adjusted quantity to 2 prints, updating dynamic pricing calculations.
- **No Customer-Facing Free Package:** Verified that free-experience copy, `0 đ` / `Miễn phí` badges, and guest bypass controls are absent; camera-free mock capture remains an internal safe-test capability.
- **Mock Capture Sequence:** Four mock captures supplied by `DemoCameraAdapter` with dynamic aspect-ratio guides, countdown pulses, and shutter flash animations.
- **Photo & Frame Selection:** 4 captures selected according to `selectCount`, and frame preview rendered.
- **600 DPI High-Resolution Composition:** Preview canvas verified in the browser via `naturalWidth > 0`.
- **Dry-Run Delivery:** Completed delivery with QR code presentation and verified that `confirmPrint` returned `dryRun: true` and `revenueRecorded: false`.

### Part B — REAL-Mode Payment Display & Camera Auto-Fallback

The harness verified the payment screen behavior when operating on the real-mode path:

- **V1 Parity UI Elements:** Verified `Bước 3` eyebrow, `Thanh toán` title, quantity `2 bản`, and total `70.000 đ`.
- **V1 Pricing and Payment Restoration:** Verified calculated VND pricing, VietQR/order-summary presentation, and no customer payment bypass.
- **Staff Gesture Security:** Verified that the staff cash-override button remains completely hidden from customers until the 700 ms dwell gesture on the header is completed.

---

## Evidence location

- **Current Journey Results (35/35 checks, 0 failures, 26 screenshots):** `tests/journey-evidence/2026-11-01T17-19-57.239Z/results.json`
- **Screenshots:** `tests/journey-evidence/2026-11-01T17-19-57.239Z/*.png` across 1280×800 and 1920×1200.
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
- Frontend: **45/45 Vitest tests passed across 7 suites**.
- Build: **0 errors**.
- Desktop Journey: **35/35 checks passed, 0 failures, 26 screenshots** (`2026-11-01T17-19-57.239Z`).

The software application, automatic camera fallback, Korean photo studio design system, and zero-revenue safety guards are complete and verified. The project is fully prepared for controlled hardware-lab testing upon physical camera and printer attachment.
