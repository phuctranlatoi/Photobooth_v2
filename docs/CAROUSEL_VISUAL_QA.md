# Layout Carousel Visual QA — 2026-11-03

## Verdict

`PASS-SIMULATED` for the production `StudioModeScreen` rendered by a dedicated Vite harness with the production stylesheet stack. This is browser-rendered visual evidence, not a physical touchscreen or camera/printer test.

## Evidence and commands

- Edge executable: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
- Harness: `frontend/carousel-preview.html`, `frontend/src/carousel-preview.tsx`.
- Catalog IDs rendered: `515_4_anh`, `1015_4_base`, `1015_4_ILCL`; center selection is `1015_4_base`.
- Exact-size captures:
  - `docs/screenshots/carousel-1280x800.png` — 1280×800, 548,150 bytes.
  - `docs/screenshots/carousel-1920x1200.png` — 1920×1200, 1,042,594 bytes.
- Capture method: Edge headless with `--force-device-scale-factor=1`, `--window-size=<width>,<height>`, unique clean `--user-data-dir`, and `--virtual-time-budget=3000` against Vite on localhost.

## Pixel/CSS checks

| Check | Status | Evidence |
|---|---|---|
| No square dark carousel cards/halos | PASS-SIMULATED | Carousel card, stage, wrap, track, and art containers compute from production rules with transparent backgrounds, no border/backdrop filter/box shadow; pseudo-elements suppressed. Artwork alone uses `drop-shadow(0 6px 16px rgba(0,0,0,.08)) drop-shadow(0 1px 3px rgba(0,0,0,.04))`. |
| Side artwork full-color and sharp | PASS-SIMULATED | All card states force `opacity:1`; no carousel blur/backdrop filter; side scale is `.92` without color/opacity filtering. |
| Smooth continuous background | PASS-SIMULATED | One `--layout-ambient` gradient is applied to `html`, `body`, `#root`, and customer `.v1-shell`; intermediate carousel surfaces are transparent. |
| No extra outer white card | PASS-SIMULATED | Card background/border/shadow are forced off. The white shape visible in each SVG is the actual print-paper artwork (`LayoutArtwork`), not an outer card. |

Sampled every fourth pixel (includes intentional dark text/icons and illustrated portrait details):

- 1280×800: 64,000 samples; mean luminance 234.23; luminance <40: 206 (0.3219%); luminance <80: 639 (0.9984%).
- 1920×1200: 144,000 samples; mean luminance 234.90; luminance <40: 331 (0.2299%); luminance <80: 1,076 (0.7472%).

The very low dark-pixel percentages are inconsistent with a large black rectangular card or clipped dark backdrop. Pixel statistics alone do not prove visual correctness; CSS state inspection and exact captures are retained alongside them.

## Regression/build checks

- `frontend: npm test -- --run` — `PASS-AUTOMATED`, 8 files and **56/56 tests passed** (20.49 s).
- `frontend: npm run build` — `PASS-AUTOMATED`, TypeScript and Vite production build passed (2,017 modules; 15.95 s).
- `src-tauri: %USERPROFILE%\.cargo\bin\cargo.exe check` — `PASS-AUTOMATED`, dev profile completed in 13.40 s.

## Tauri limitation

`cargo check` proves Rust/Tauri compilation capability only. No interactive packaged Tauri window or physical 1280×800 / 1920×1200 touchscreen was exercised in this headless review; therefore this is not marked `PASS-REAL-HARDWARE`.
