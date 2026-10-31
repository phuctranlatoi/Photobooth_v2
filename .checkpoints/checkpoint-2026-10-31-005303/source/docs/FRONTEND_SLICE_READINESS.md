# Frontend vertical slice readiness — preimplementation only

Date: 2026-10-30. Owner: frontend-coder. Scope for this assignment: this document only.

## Status and evidence boundary

**BLOCKED FOR APP IMPLEMENTATION: audit/architecture gate pending; approved UI design and IPC contract absent from the inspected V2 docs.** No frontend scaffold, dependencies, shell commands, builds, tests, network requests or hardware operations were performed. No screen is implemented or verified by this task.

Read: root `AGENTS.md`, `docs/LE_SOUVENIR_V2_REBUILD_MASTER_PROMPT.md`, `.opencode/agents/frontend-coder.md`, `docs/02_V1_FEATURE_AND_SCREEN_INVENTORY.md`, and `docs/LEGACY_ARCHITECTURE.md`; enumerated the V2 root and docs directory. At inspection, root contained no `frontend/` directory or visible package manifest/lockfile. No dedicated UI specification or versioned IPC contract was present in that docs listing. This is an observation at inspection time, not a claim about concurrently arriving artifacts.

Existing inventory is preliminary: it explicitly contains missing evidence and placeholder parity rows. Its screen/state names are **audit leads, not approved wire types or transition rules**. Do not translate its Compose controller calls into guessed RPC methods. V1 source was not needed or accessed for this task; no V1 mutation was performed by this task. No independent V1 baseline/comparison was collected, so “V1 unchanged verified” is not claimed.

## Exact prerequisites before code

1. Orchestrator records audit acceptance and authorizes the first implementation slice, its owned files, and sequencing relative to bridge proof. Any limited bridge UI before milestone 3 needs an explicit bounded assignment.
2. Architect supplies an approved versioned contract and transport/lifecycle decision, with a concrete import/generation path for shared TypeScript types. Frontend must not invent the shared schema or select Tauri/Electron independently.
3. Backend supplies the source-faithful session engine through that contract, isolated V2 paths, configured layouts, and an explicitly selected safe capture/dry-run adapter. Simulator availability must be signaled by backend, not inferred from missing devices.
4. UI Designer supplies tokens, fonts/assets and redistribution status, screen layouts, state/error text, touch target rules, image fit/orientation rules, and cancellation/dialog behavior. Review against 1280×800 and 1920×1200, Windows 100/125/150% scaling, reduced motion, and protected operator entry.
5. Orchestrator/Architect select supported Node version, package manager and pinned dependency versions after checking current V2 manifests/lockfiles. None was established in this inspection. Agree on installation/cache policy so commands cannot write outside approved V2 scope.
6. Explicit approval for each proposed shell/toolchain/install/build/test operation and any downloads. This assignment authorizes none of them.

### Contract checklist for Architect/Backend

These are required semantics, **not proposed endpoint names**:

- Protocol version negotiation, transport authentication/access control, initialization/health, unsupported-version behavior, sidecar shutdown/crash reporting, and asset URL/path exposure rules. No arbitrary local filesystem URLs or frontend credentials.
- Full authoritative snapshot: session identity, revision/ordering, stage, legal actions and reasons, configured layout/quantity/pricing display, selected items, capture progress/countdown display, camera status, print status and delivery status as applicable. Backend defines exact optionality and state unions.
- Typed command/result/error envelopes: correlation, authoritative action acceptance, validation failures, timeout versus final outcome, durable idempotency scope for capture/payment/confirm/print/cancel, and querying unknown outcomes. An acknowledgement is not completion.
- Snapshot/event race handling, sequence gaps, duplicate/out-of-order/stale-session events, reconnect replay or fresh snapshot, backend restart identity, and subscription disposal. Backend specifies reconciliation guarantees.
- Preview delivery: authorized transport, compressed-frame/stream format, dimensions, orientation/mirroring, pacing, bounded buffering, expiry/staleness indication and teardown. Keep high-rate preview separate from session snapshots. Final originals remain backend-owned.
- Final photo readiness and safe asset handles with dimensions/version; distinction between complete original, Beauty processing, final Beauty output and valid fallback. Selection eligibility and quantity/order are authoritative.
- Backend-generated composited preview and export association, accurate dimensions and frame metadata; no frontend reconstruction of print geometry.
- Distinct dry-run generated file, spooler accepted, physical completion only where reliably evidenced, failure/unknown and retry eligibility; revenue success semantics must follow audited backend rules.
- Payment and delivery QR payload/image provenance, expiry/failure states and safe display handling. Tests must not fetch arbitrary payment/delivery URLs or live external assets.
- Fixtures for normal/error/reconnect/duplicate-action cases and documented safe simulation flag. No secrets or customer images in fixtures.

## Proposed smallest integrated slice (after approval)

Welcome → choose backend-configured layout → backend-required intermediate stages → capture/progress → eligible photo selection → frame/composited preview → backend-authorized Confirm & Print in **dry-run only** → completion/reset. The backend decides exact order and which intermediate stages exist. Do not bypass quantity/payment or invent a frontend “paid” transition to make this path runnable. Backend supplies a sanctioned safe service adapter when such stages require simulation.

The outcome must be one actual Kotlin-owned session, typed IPC, a complete original saved to V2 by the authorized safe adapter, backend-composed preview, and dry-run artifact. A frontend fixture-only story is component evidence, **not** this integrated slice. The first slice is not full Admin/Studio or feature parity completion.

### Proposed file plan (not created; rebase to approved contract)

| Future V2 path | Responsibility |
|---|---|
| `frontend/package.json`, selected lockfile, `index.html`, `tsconfig*.json`, `vite.config.ts` | Minimal pinned React/strict TypeScript/Vite toolchain; agreed Tailwind integration and test configuration |
| `frontend/src/main.tsx`, `app/App.tsx`, `app/KioskShell.tsx` | Bootstrap and persistent session provider above screen switches; 16:10 safe shell; state-driven screen selection without a routing dependency |
| `frontend/src/styles/tokens.css`, `styles/app.css` | Designer-approved tokens, Tailwind entry, local approved fonts, focus/touch/reduced-motion and overflow rules |
| `frontend/src/ipc/client.ts`, `ipc/transport.ts` | Consume Architect-owned shared types, validate boundary as contracted, subscribe/unsubscribe, reconcile snapshots, correlate commands; shell-specific transport only after decision |
| `frontend/src/session/SessionProvider.tsx`, `session/sessionStore.ts` | External-store subscription and immutable current snapshot; connection/pending-command presentation only, no business transition machine |
| `frontend/src/components/{Button,LayoutCard,Progress,Dialog,Loading,Error,PhotoGrid,PhotoStripPreview,DeviceStatus,Toast}.tsx` | Touch-first shared controls, selection semantics, loading/error feedback, exact-ratio media and backend composited preview |
| `frontend/src/components/PreviewSurface.tsx` | Contracted preview stream rendering, bounded latest-frame ownership, stale/offline blanking and resource cleanup; no image processing |
| `frontend/src/screens/{Welcome,LayoutSelection,SessionStage,Capture,PhotoSelection,FrameSelection,PrintReview,Printing,Delivery,Disconnected}.tsx` | Only approved backend-stage displays; intermediate stages expanded according to actual contract rather than guessed sequence |
| `frontend/src/testing/fixtures.ts`, `testing/fakeTransport.ts` | Deterministic, explicitly labeled test transport; no production-service imports, real files or hardware; fixtures follow approved shared schema |
| `frontend/src/**/*.test.tsx`, `frontend/tests/kiosk.spec.ts` | Component semantics and isolated browser layout/reconnect tests; synthetic V2-only assets |

Shared contract files remain Architect-owned; backend and shell remain their assigned owners' scope. File names above are a proposal, not permission to edit shared areas. Avoid a state-machine library, router, query client or broad component framework unless a concrete need is approved.

## State, concurrency and disconnected behavior

- Render backend snapshots; UI state is limited to dialog visibility, focus, local pending feedback and connection health. No frontend pricing calculation, countdown decrement, photo-count decision, auto-transition, revenue logic or cancellation policy. Countdown displays backend values; missing/stale values show an unavailable state, never a fabricated timer.
- Keep the session subscription/store above screen lifetime. Screen changes must not restart captures or subscribe repeatedly. Effect cleanup removes listeners, aborts owned fetches and releases preview resources; preview traffic must not trigger whole-shell renders per frame.
- On action, acquire a synchronous local in-flight latch before dispatch to prevent rapid touch duplicates. Disable conflicting controls while outcome is unresolved. The backend must still enforce durable idempotency/legality across reconnect/restart. Never mint a new action retry automatically after a timeout; reconcile first under the approved retry policy.
- Ignore stale-session data according to contract ordering. On reconnect, stop accepting state-changing touches until snapshot reconciliation succeeds; do not reset to Welcome or infer a failed print from lost transport.
- **Disconnected is blocked, not a simulator.** Display “Backend disconnected — session status unavailable” and last-known progress explicitly marked stale. Hide/blank any old live preview and distinguish camera failure from IPC failure. No start, capture, payment, print, cancel or local progression; only a transport retry if approved. No `getUserMedia`, animated fake live view, static photograph passed off as live, or automatic simulator fallback.
- Simulator, if explicitly selected and contract-backed, has a persistent “SIMULATOR — no real camera/payment/print” banner, including completion. Safe dry-run printing reports artifact generation, never physical printing success. No live PayOS/Neon/Cloudinary/printer calls in frontend tests.
- Thumbnails use complete eligible assets with intrinsic ratios and `object-fit: contain`; any crop is only the backend-defined composition, not incidental CSS. Show a backend-generated print preview without stretching/rebuilding it. QR errors/loading/expiry remain distinct from successful delivery.

## Expected dependencies and approval-only commands

Runtime candidates: `react`, `react-dom`, a small `motion` surface respecting reduced motion, and one approved icon source (e.g. `lucide-react`, selective imports). Build candidates: `typescript`, `vite`, `@vitejs/plugin-react`, React type packages, `tailwindcss` and version-compatible Vite integration. Tests: `vitest`, `jsdom`, React Testing Library, `@testing-library/user-event`, `@testing-library/jest-dom`; `@playwright/test` for browser geometry. Prefer native accessible controls; a vetted dialog primitive may be proposed if needed. Runtime schema validation or host SDK only if mandated by the contract. Pin compatible versions; do not infer Tailwind configuration across major versions.

**Not executed. Every shell command needs explicit approval, including version checks.** From V2 root or `frontend/` only, proposed command families are:

| Purpose | Approval candidate (package manager unresolved) |
|---|---|
| Inspect toolchain | `node --version`; chosen manager `--version` |
| Install agreed manifest | `<pm> install` (exact lockfile/frozen variant after manager selection); no global installs or uncontrolled `create-*` scaffold |
| Typecheck/build | `<pm> run typecheck`; `<pm> run build` |
| Unit/components | `<pm> run test -- --run` (final CLI depends on approved script) |
| Browser tooling | Explicit approved Playwright browser download with V2-local cache/output; separate from test approval |
| Responsive/E2E | `<pm> run test:e2e` against isolated fake transport/approved safe backend only |
| Local UI | `<pm> run dev -- --host 127.0.0.1` only after approval; never expose kiosk control on public interfaces |

Installation can execute lifecycle scripts and access the network; approve versions, registry access, scripts and cache locations first. Typecheck/build/tests can write caches, reports, browser profiles or artifacts; configure all writable paths under V2. No shell/backend install, Kotlin build, physical device enumeration, real print, payment, upload or production access is included in these candidates.

## Integration acceptance and review gate

All items below are **NOT TESTED**; acceptance requires retained evidence, not implementation intent.

1. Architect accepts wire types, lifecycle, asset security and reconciliation tests; real session-engine snapshots drive every screen. No guessed stage transitions or per-layout constants.
2. Two differing backend fixture layouts demonstrate dynamic counts/countdowns and selection requirements; visible countdown changes only on authoritative updates. Welcome/config/loading/empty/error states and selected-card touch feedback pass component tests.
3. Rapid tap/pointer sequences dispatch capture/confirm/cancel once locally; backend proves idempotency under retry/reconnect. Cancellation is offered only through the approved selection-stage hidden action and legal-action contract; dialog confirm/cancel remain once-only.
4. Transport disconnect during capture/printing preserves last-known progress without creating another session/action. Gap, duplicate, stale-session, restart and unknown-command-outcome cases reconcile correctly. Failed-camera event blanks stale live preview and renders a recoverable error only as authorized.
5. Complete originals/final Beauty fallback thumbnails preserve portrait/landscape ratios; incomplete photos cannot be selected. Backend composited preview matches the dry-run artifact association/dimensions; missing image and QR load failures are visible.
6. Printing/delivery distinguish dry-run file, queue acceptance, physical status unavailable, upload pending, QR ready/expired and failure without asserting revenue/payment success. Test harness blocks external service/network side effects.
7. Browser evidence at 1280×800 and 1920×1200, plus approved scaled effective viewports and actual Windows scaling review: no clipped critical controls, usable scrolling, >=48 CSS-pixel touch targets, legible countdown, contrast/focus and reduced-motion checks. Browser emulation alone does not verify a real Windows touchscreen.
8. Mount/unmount/reconnect/long-session and preview burst tests demonstrate listener/resource cleanup, bounded frames, no cross-session image leakage and no main-tree render flood. Tool outputs and explicit pass/fail statuses accompany test claims.
9. Integrated safe session proves V2 original save, backend composition, dry-run artifact and backend completion/reset. Canon SDK, physical DNP output and production integrations remain separately **NOT TESTED/BLOCKED pending authorization and hardware evidence**.
10. Request UI Designer review of visual/touch behavior and Tester-Reviewer independent review of state/side-effect and regression evidence before closing the slice milestone. No review requested/completed is claimed by this document.

Next bounded action: wait for audit/architecture authorization and the Designer/Architect artifacts; then revise this plan against exact contracts and ask for approval of the concrete dependency/toolchain commands before writing app code.
