# Touch kiosk visual review — 2026-11-02

## Scope and evidence

Inspected `kiosk-v1.css`, Frame, StudioMode, Payment, SelectPhotos, Confirm, KioskUI and Admin screens; also inspected imported payment/operator/settings styles. This is a **source and CSS audit**, not a browser screenshot or physical touch-monitor test. No camera, printer, QR payment or admin ACL was exercised. The existing operator screen explicitly identifies itself as a local simulator, not production admin authorization. V1 was not edited.

## Direction comparison

| Direction | Welcome | Capture | Verdict |
| --- | --- | --- | --- |
| A · editorial paper (selected) | Warm ivory field, oversized brand/photographic paper illustration, single large start action | Dark matte camera stage with high-contrast booth-distance digits and a compact progress label | Clear face/preview contrast and read-at-distance hierarchy; glass belongs around controls, not across faces. |
| B · full liquid glass | Large frosted welcome pane and strong overlapping photo cards | Floating frosted countdown/control pane over live preview | Rejected for capture: face occlusion and reduced legibility on changing camera imagery. Use its restrained optical edges on *peripheral* control surfaces only. |

## Screen evaluations

| Screen | Existing interaction and visual finding | Polish / remaining risk |
| --- | --- | --- |
| Welcome | Existing welcome brand/entry; illustrated strips are not photos. | Warm ivory retained; verify real photographic assets and Vietnamese overflow on device. |
| Layout | Centered snap carousel; side cards peek; tapping center again confirms setup. | Active gold edge, adjacent cards distinguishable even without hover; double-tap semantics must be clearly communicated and tested at 125/150%. No additional Continue button. |
| Bundle/quantity | Existing stepper/bundle controls, backend pricing. | Do not infer price or count from illustration; verify configured long labels and horizontal overflow. |
| Payment | Backend QR creation and status polling, fixed QR footprint, concealed hold-to-open staff keypad. | Stable square white QR only (scanner requires contrast), matching loading/error footprint, frosted keypad. **Security blocker:** `PaymentScreen.tsx` locally accepts literal `1234` and exposes `payment.mockComplete` after it; this is NOT authenticated staff authorization. Architect/backend must remove/replace before production; CSS cannot secure it. |
| Prep/capture | Aspect-correct image and crop share viewport; countdown currently centered over face (`kiosk-v1.css` lines around 120). | **Needs capture-specific follow-up:** move digits to a high-contrast dedicated side/bottom safe region while preserving booth-distance size; do not resize live frame incorrectly. Validate crop mapping and actual camera aspect on device. |
| Select photos | Order badges, hold-to-enlarge, immediate optimistic composition, confirmation remains. | Three larger tiles per row (two at narrow widths); gold selected border; preview dominates right side; confirm button retained because `selection.confirm` is an actual gate. Test backend rejection/reconciliation and touch hold release. |
| Frames | Direct tap invokes `frame.select` then `frame.confirm`, no Continue button. | Enlarged no-wrapper paper preview, champagne edge and check pill on selected card. Confirm still backend-gated; distinguish pending/error state in future component pass. |
| Confirm | Real composition required; print button armed after delay, one-shot latch. | Paper preview larger and free of card wrapper; high-contrast enabled/disabled print action. Do not auto-submit or duplicate print. |
| Print/QR/finish | Existing progress/delivery flows, not modified. | Check physical printer failure and QR loading with host fixture; no successful hardware claim. |
| Admin/settings | Operator is a local development simulator with tabs and diagnostics text. | Scoped graphite treatment and 52–56px actions; diagnostics stay explicitly unverified, never green by CSS alone. Audit tab contrast in browser and long content scrolling. |

## Verification

- `frontend/npm test -- --run`: **7 files, 50 tests passed**.
- `frontend/npm run build`: **passed** (TypeScript and Vite).
- 1280×800, 1920×1200, Windows 100/125/150% scaling, image visibility, actual viewport overflow, language overflow, touch latency and QR scan: **not visually verified** in this environment. CSS contains a 1400×850 compact breakpoint and flex/grid `min-height:0`; those are not screenshot evidence. Run real browser screenshot/DOM overflow matrix before release.

## Source coordination

Frontend: reuse `PrintPreview` for real aspect-aware compositions; keep preview itself transparent, reserve white only for actual QR/paper; distinguish backend-pending and disabled controls; test selection and frame command rejections. Architect: confirm authoritative staff override policy and secure staff authentication; `PaymentScreen` mock PIN is insufficient. Tester: compare 1280×800 and 1920×1200 at 100/125/150% in Windows kiosk, including long Vietnamese names, per-layout capture counts, failed QR, missing frames, broken images and reduced motion.

## Typography, spacing and image/zoom follow-up (2026-11-02)

Reviewed source of `StartScreen`, `StudioModeScreen`, `QuantityScreen`, `PaymentScreen`, `PrepareScreen`, `CaptureScreen`, `SelectPhotosScreen`, `FrameScreen`, `ConfirmScreen`, `DeliveryScreen` plus the shared `KioskUI` headings. Final scoped CSS sets 13–14px terracotta eyebrows, 26–38px headings, 14–17px subtitles, 17–18px section labels, 16–18px action text, consistent 16–36px vertical/24–64px horizontal padding and a 14–24px shell rhythm. Split workspaces use a 1.25:.85 proportion, 20–36px gap and 14px tile rhythm. Header title, subtitle, long frame names and carousel text wrap rather than clip; frame labels show up to two lines. Confirm/selection/frame paper is contained, never `object-fit: cover`, with a realistic paper shadow. Primary actions remain at least 56px high; compact 1280×800 rules preserve 72px bottom action rail. Internal tile grids and status panels retain their own scrolling; customer window should not scroll.

Photo selection now exposes an explicit 56px **Xem lớn ảnh** touch target on every valid thumbnail; it opens the same original preview URL in a contained, non-cropped lightbox with a 64px close target and Escape support. Hold-to-zoom still releases without selecting. This does not improve the source image resolution: backend must provide an adequate original/preview payload; CSS cannot manufacture photographic detail. The real composition remains the preferred print preview when available; illustration is clearly not a finished print.

The capture option chosen is **A: matte side rail**. The existing 3:2 camera image and aspect-correct crop stay intact; countdown digits move into a dark reserved side region instead of covering the middle of a face. Shot progress sits on the side rail and the existing shutter stays a large touch target. Alternative **B: centered numeral overlay** was rejected because it obscures portraits. Camera preview orientation/crop mapping and multi-digit countdown on real hardware need visual confirmation; no camera logic or configured countdown/count was changed.

Verification after this follow-up: `npm test -- --run`: **7 files / 53 tests passed**; `npm run build`: **passed**. These are source/build checks, **not** viewport screenshots or Windows DPI measurements. Specifically check long Vietnamese copy and 100/125/150% Windows scaling at 1280×800 and 1920×1200, zoom close/hold and no viewport scroll on physical kiosk; do not mark those tests passed until measured.
