# Selection and frame UI handoff

- Screens: photo selection with ordered thumbnails and hold-to-zoom; print-slot composition; frame comparison and explicit final-preview action.
- Contracts: `LayoutMode` geometry and `Snapshot.selectedIndices` / `shots`; `selection.toggle`, `selection.confirm` with ordered `selectedIndices`, `frame.select`, `frame.confirm`, `session.back`. Backend remains authoritative. Mutations are serialized; failed/uncertain mutations stop queued requests rather than guessing backend state.
- The preview artwork uses backend slot metadata when present. It is a client-side visual comparison, **not** the final backend-rendered print composition. Frame images and shot previews must be supplied by the backend; no browser camera, image processing, printer, or live payment is provided here.
- Automated checks: `npm test -- --run` (52 passing) and `npm run build` (TypeScript and Vite successful). Hardware image quality, high-resolution 960px backend delivery, and 1280×800 / 1920×1200 touch display visual checks remain pending.
- Request UI Designer and Tester-Reviewer review of viewport spacing, hold gesture, print geometry and simulator-to-hardware parity before milestone closure.
