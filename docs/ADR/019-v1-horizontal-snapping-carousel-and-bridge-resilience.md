# ADR-019: V1 Horizontal Snapping Carousel Restoration, Vector Slot Geometry Previews, and Tauri Bridge Failure Teardown

**Date:** 2026-11-01  
**Status:** Accepted  
**Authors:** Specialist Solutions Architect (V2)  
**Supersedes/Extends:** Extends ADR-001 (Frontend Stack), ADR-002 (Desktop Shell), ADR-004 (IPC Protocol), and ADR-018 (Korean Design Tokens)

---

## 1. Context and Problem Statement

Legacy V1 Compose UI featured an intuitive, centered `HorizontalPager` with scale interpolation:
- The selected active layout card scaled to `1.0` in the center of the display.
- Adjacent peeking cards scaled down to `0.84` with reduced opacity, inviting touch gestures.
- Navigation chevrons (`‹` and `›`) floated symmetrically to enable swift one-touch paging.

In earlier V2 iterations:
1. `StudioModeScreen.tsx` fell back to a vertical list layout or unaligned grid with sterile, blank preview rectangles that failed to give customers an immediate visual impression of the layout's slot arrangement and photo counts.
2. Frame selection displayed generic placeholder blocks rather than actual decorative frame artwork because `FrameStore` did not expose rendered thumbnail data URLs to IPC callers.
3. On `ConfirmScreen.tsx`, customer action copy stated "In ảnh ngay" even in zero-revenue DEMO mode, confusing customers when no physical print would be produced. On `DeliveryScreen.tsx`, CTA buttons extended below the fold on compact 1280×800 touchscreens.
4. When long-running 600-DPI composition operations exceeded the initial Tauri bridge IPC timeout (10s), the Rust process desynchronized from the Kotlin sidecar. Subsequent requests failed because stale child handle references persisted in memory without proper teardown.

---

## 2. Decision

### 2.1 Restored V1 Horizontal Snapping Carousel (`StudioModeScreen.tsx`)
- Implemented `.v1-layout-carousel` with CSS scroll-snapping and TypeScript smooth-scroll settling.
- Scaled active layout card to `1.0` and centered it within the viewport; adjacent peek cards scale down to `0.84` with graceful opacity reduction (`0.85`), replicating V1 Compose `HorizontalPager` visual dynamics.
- Click-to-center / click-to-select interaction allows customers to tap an adjacent peeking card to smoothly center and select it.
- Added floating navigation chevrons (`‹` and `›`) for rapid tactile paging across available layouts.
- Zero-scroll vertical layout constraint preserved for both 1280×800 and 1920×1200 16:10 touchscreen form factors.

### 2.2 Vector Slot Geometry Previews (`LayoutArtwork.tsx`)
- Replaced blank rectangles with vector-drawn photo cards rendering exact aspect ratios, custom slot geometries, numbered slot indicators, and warm silhouette portrait graphics.
- Formatted customer-friendly layout titles (`formatLayoutTitle`, `formatLayoutSubtitle`) while preserving canonical layout IDs (`515_4_anh`, `1015_4_ILCL`) in subtle `.v1-layout-tag` badges for operator debugging.

### 2.3 Actual Frame Artwork Thumbnails
- Updated `RealSessionEngine.kt` to serialize `thumbDataUrl` via `FrameStore.frameThumbDataUrl`.
- Updated `FrameOption` in `simulator-contract.ts` to consume and render Base64 artwork thumbnails for decorative frames and seasonal covers.

### 2.4 Truthful Action Copy and Viewport Fit
- Set CTA copy on `ConfirmScreen.tsx` to `"Hoàn thành trải nghiệm →"` during `DEMO` sessions.
- Implemented a sticky finish bar on `DeliveryScreen.tsx` ensuring zero vertical scroll on 1280×800 touchscreens.

### 2.5 Tauri Bridge Resilience and Failure Teardown
- In `src-tauri/src/main.rs`: Added failure teardown `guard.take()` on IPC errors and process exit events, ensuring that dead or desynchronized sidecar child handles are promptly evicted and cleanly restarted.
- In `src-tauri/src/bridge.rs`: Extended JSON-RPC execution timeout from 10s to 25s (`Duration::from_secs(25)`), accommodating 600-DPI composite rendering operations without premature timeout drops.

---

## 3. Consequences

- **UX Fidelity:** Touchscreen UX matches and exceeds V1 Compose fidelity with silky smooth 60fps horizontal snapping and authentic Korean photo atelier aesthetic.
- **Cognitive Clarity:** Vector slot illustrations give immediate clarity on photo counts and orientations without heavy network image downloads.
- **Process Reliability:** Rust-to-JVM sidecar IPC is robust against heavy computational workloads and gracefully evicts stale processes without hanging the desktop shell.
- **Truthful Hardware Gate:** Physical Canon DSLR, DNP printer, and live PayOS charges remain isolated behind truthful boundary gates until physical studio kiosk hardware is attached.
