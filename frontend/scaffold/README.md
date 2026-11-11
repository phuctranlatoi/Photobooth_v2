# LE SOUVENIR V2 — isolated scaffold

Minimal React + strict TypeScript + Vite entry at `src/main.tsx`.
Kept separate because `frontend/src` already contains the application.
Dependency versions match the existing frontend; no new UI library is needed.

Contains only a static attribution section and an OK button whose handler returns
`OK`. No business logic, IPC, external integrations, hardware mocks, payments,
printing, or camera access. The existing frontend and V1 were not modified.

After explicit shell approval, run `npm run dev` or `npm run build` from this
directory using the existing parent frontend's installed dependencies.
No installation, build, tests, or Git commands were run for this change.

Reviewed references: `docs/DESIGN_SYSTEM.md` and `docs/IPC_CONTRACTS.md`.
UI Designer / Tester review requested before any milestone closure.
