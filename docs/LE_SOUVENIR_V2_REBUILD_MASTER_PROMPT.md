# LE SOUVENIR PHOTOBOOTH V2 — SOURCE-FAITHFUL REBUILD MASTER PROMPT

> Paste this entire prompt into the **orchestrator** agent, or save this file in V2 as `docs/LE_SOUVENIR_V2_REBUILD_MASTER_PROMPT.md` and ask the orchestrator to read and execute it. This directive is about **building the actual product**, not just drafting a plan or producing a UI demo.

## 0. ROLE, OBJECTIVE, DEFINITION OF SUCCESS

You are the **LE SOUVENIR Photobooth V2 Lead Orchestrator**. Coordinate the eight configured OpenCode subagents to build a **new, commercially usable Windows touchscreen photobooth application**, using the existing working application as the **authoritative source of truth for actual features, business rules, algorithms, hardware integrations and output behavior**.

The work is a **source-faithful modernization**:

- **REUSE / PORT the real, proven V1 implementation** for camera SDK integration, webcam, Hot Folder, Windows printing, image composition, LUT, accepted Beauty pipeline, sessions, payments, Neon/API, Cloudinary/QR, and other functional subsystems whenever technically feasible.
- **REBUILD the presentation and deployment architecture** around a premium modern touch-first React/TypeScript interface and a maintainable Windows desktop shell.
- **DO NOT merely mimic V1 screens, invent replacement hardware stubs, or build a static proof-of-concept and call it complete.**
- **DO NOT blindly copy V1 wholesale** without tracing dependencies, identifying the accepted implementation and isolating V2. Prefer surgical, attributable copies or adapted modules inside V2 with parity tests.
- **DO NOT invent feature behavior**: if this prompt lists a potential V1 capability, confirm it in source before treating it as implemented. If this prompt omits a real V1 feature, the V1 audit must discover and preserve it unless the owner explicitly excludes it.

**The success criterion is a second, independent Windows app with the redesigned user experience and verified parity with the existing app—not a patch to the existing app.**

## 1. NON-NEGOTIABLE WINDOWS PATHS AND SAFETY

### V1 — production/reference, immutable

`E:\HK1_2026_2027\PhotoboothDesktop`

V1 is STRICTLY READ ONLY for all agents and tools. Allowed: read non-secret sources, enumerate folders, inspect non-sensitive build metadata, inspect Git status/log without mutation, and copy specific non-secret source/assets **into V2** if legally permitted. Prohibited: edit, format, generate files, build, test, run, checkout, reset, commit, clean, install dependencies, execute application, alter SDK/driver settings, delete/move/rename, or change Git state **inside V1**. Never execute `gradlew clean`, `git clean`, or any command that might alter V1 or delete its `build` directory.

In particular, **do not open or modify customer image archives** (including `build/Cloudinary_Archive_2026-10-19_12_38_162_Originals` or other archival directories), production `.env` files, credentials, database dumps, session photographs, live customer data or sensitive logs. Never copy V1 secrets into V2 or assistant output. Treat all secret values as unknown; create V2 `.env.example` placeholders only.

Do not accidentally write into V1 through working directory, output flags, generated Gradle files, IDE caches, shell redirection, symlinks/junctions, scripts, or child-agent operations. The current user's Windows account can still write files even if OpenCode denies `edit`; **shell approval is not a sandbox**. Restrict shell commands to safe V2 operations or read-only V1 listing/inspection. If command safety is uncertain, stop and report it.

### V2 — exclusive development destination

`E:\HK1_2026_2027\PhotoboothDesktop_v2`

All new code, documentation, Git operations, build artifacts, test outputs, mock photographs, runtime logs and temporary files belong to V2 or V2-owned application data directories. Do not use V1 configuration/data/output directories. V2 requires its own app identity, installer, caches, session storage, temporary paths, local API ports where needed, and operator configuration. Never replace the installed V1 app.

### Other safety gates

No actual physical print consuming media, paid PayOS transaction, production Neon write/migration, Cloudinary upload, customer image sharing, production deployment, or operation that might seize hardware from a running V1 kiosk without explicit user authorization. Safe unit/integration tests, isolated samples and mocks can proceed. If hardware access is not available, keep implementation work moving but mark real-device verification **NOT TESTED**.

## 2. MULTI-AGENT EXECUTION — ACTUALLY DELEGATE

Read `AGENTS.md`, `opencode.json`, all `.opencode/agents/*.md`, and this entire directive. Verify that you are the `orchestrator` primary agent and that these eight subagents are available:

1. `legacy-auditor` — V1 inventory, source-to-feature traceability, workflow parity.
2. `architect` — Windows architecture, Kotlin bridge feasibility, IPC, packaging, isolation.
3. `ui-designer` — 16:10 premium touchscreen design, flows, all states.
4. `frontend-coder` — React/TypeScript/Vite/Tailwind/Motion implementation.
5. `camera-engineer` — REAL Canon SDK, Webcam, Hot Folder, Live View and capture.
6. `printer-engineer` — REAL Windows printing/DNP RX1HS, image geometry and cut workflow.
7. `backend-engineer` — Kotlin reuse, sessions, Beauty/LUT, integration services.
8. `tester-reviewer` — independent QA, security, parity, hardware evidence and release gates.

**Invoke subagents with the native delegation tool**; merely writing “delegated” or “I will ask” does NOT count. Collect actual child results and record model, task, files examined/changed, evidence, errors and status. The first task must be a small REAL delegation to `legacy-auditor` to inspect the V1 code in read-only mode. If it fails, show the actual error, diagnose provider/model/permissions/tooling, and do not invent findings. Do not replace subagent calls with MCP resource listing, compaction or worktree listing.

Delegate **bounded, non-overlapping work**. Avoid concurrent edits to the same files/contracts. Have `architect` approve cross-boundary designs and `tester-reviewer` review implementation evidence. Orchestrator coordinates and reports; implementation is owned by specialist agents.

No agent should repeatedly halt after generic planning when safe, actionable tasks remain. Within available session and tool limits, execute a bounded task, check results, update V2 progress, and move to the next task. Never claim asynchronous/background work beyond the session.

## 3. PHASE 0 — FORENSIC V1 AUDIT BEFORE SPECULATION

The real V1 repository is the behavioral specification. Read it systematically. Do not assume package names, method names, source layout, SDK type, printer transport, API schemas, credentials or active Beauty implementation. Confirm all claims from actual files and function call paths.

Create a **complete feature parity matrix** covering every screen, feature, setting, hardware integration, event and persistent field actually present in V1. For EACH entry include:

- Feature ID and user/operator goal.
- V1 source file(s), symbols/functions and call-chain evidence.
- Input, output, state transitions and edge cases.
- V1 dependencies/assets/configuration, minus secrets.
- Expected V2 backend module and frontend screen/component.
- Preservation strategy: **COPY**, **ADAPT**, **WRAP**, **REIMPLEMENT UI ONLY**, or **NEEDS VERIFICATION**.
- Automated parity test and real-hardware test if applicable.
- Status: NOT STARTED / IMPLEMENTED / MOCK VERIFIED / AUTOMATED TESTED / HARDWARE VERIFIED / PRODUCTION READY.

Inventory **all** V1 screens and modes, menus, hidden controls, Admin/Studio tools, frame/bundle/settings editors, content library, pricing, session flow, capture/preview, selection, print, QR/delivery, revenue, reporting, devices, logs and error/recovery paths. If a named capability below does not exist in V1, mark **NOT FOUND IN V1 — REQUIRE DECISION**, rather than silently inventing it. Do not silently drop features discovered in source but absent from this prompt.

Inspect V1 in a truly read-only way. Capture V1 commit and dirty-working-tree metadata if feasible without modifying anything; do NOT assume `HEAD` is the correct approved Beauty revision. The accepted Beauty implementation may differ from an experimental branch. Treat the previously approved stable Beauty lineage as a candidate, **verify exact accepted files with code/evidence**, and never switch branches in V1.

Generate V2 docs:

- `docs/01_V1_ARCHITECTURE_AUDIT.md`
- `docs/02_V1_FEATURE_AND_SCREEN_INVENTORY.md`
- `docs/03_FEATURE_PARITY_MATRIX.md`
- `docs/04_SESSION_STATE_MACHINE.md`
- `docs/05_CAMERA_AND_NATIVE_SDK_AUDIT.md`
- `docs/06_PRINTER_DNP_RX1HS_AUDIT.md`
- `docs/07_IMAGE_LUT_BEAUTY_FRAME_AUDIT.md`
- `docs/08_PAYMENT_REVENUE_QR_CLOUD_AUDIT.md`
- `docs/09_ADMIN_STUDIO_SETTINGS_AUDIT.md`
- `docs/10_V2_DECISIONS_AND_FEASIBILITY.md`

Do not stop at documentation: after the initial real-code audit and feasibility checks, continue implementing working V2 vertical slices.

## 4. TARGET ARCHITECTURE — PRESERVE THE REAL ENGINES

Preferred architecture, subject to a compatibility proof:

**Frontend:** React + TypeScript + Vite + Tailwind CSS + Motion. Component-driven, typed API contracts, robust state/event subscriptions, touch-friendly flows, responsive 16:10 layouts.

**Desktop host:** Evaluate **Tauri v2** first for Windows, but do not commit before proving packaging and runtime behavior for a **Kotlin/JVM sidecar/backend**, Canon SDK native binaries, Windows printer drivers, launch/quit, crash recovery, Windows fullscreen kiosk and IPC. If the actual Windows/native SDK constraints make Tauri unsuitable, make an evidence-based **Electron** fallback decision. **Do not choose a shell because it looks modern; choose one that preserves hardware operation.**

**Backend:** Prefer **Kotlin/JVM** and reusable V1 business/hardware/image processing classes, with isolated wrappers/refactoring only when necessary for a well-defined boundary. The backend must own camera state, device synchronization, session transitions, payment/print authorization, print jobs and persistent side effects. The frontend renders states and sends typed commands; it never becomes a second, conflicting source of truth.

**IPC:** Document commands, event streams, error envelopes, timeouts, cancellation, backpressure, reconnection, process health, lifecycle and security. Expose local services only on loopback or equivalent IPC with properly restricted access, and never make hardware controls accessible from an unauthenticated public network. Live View should use a bounded performant preview pipeline; final captured originals must remain high-resolution and preserved.

**Feasibility spike FIRST:** create a minimal V2-only runnable test proving desktop host ⇄ Kotlin backend startup/IPC, native dependency loading strategy and printer integration strategy **without using the real camera/printer until authorized**. A stub spike proves architecture wiring, NOT Canon/DNP hardware success. Document exact real-device tests still required.

Do not create an unrelated new production database/backend. Reuse V1's existing Neon PostgreSQL and established shared API contracts. Keep production credentials out of source and tests. If the existing backend requires a missing contract, document it; do not silently rewrite production infrastructure.

## 5. CANON SDK — FULL HARDWARE PARITY, NOT A CAMERA DEMO

Assign `camera-engineer` to inspect V1 source, build files, native libraries and loading sequence, then port the actual accepted Canon integration into a V2 Kotlin module/sidecar. First determine exactly **which Canon SDK/bindings** V1 uses; don't assume EDSDK unless verified in source. Preserve:

- Windows architecture (x64), native DLL loading, library path, runtime dependencies and SDK lifecycle.
- Camera discovery, selection, attach/detach, connection readiness, initialization and shutdown.
- Live View: actual frames, aspect ratio, orientation/mirroring rules, frame pacing, buffering, reconnection and error UI.
- Real shutter/capture command, countdown trigger, capture success/error, full-resolution download/transfer and local original save.
- Existing autofocus and camera setting operations **only if present in V1**.
- Device contention, serial execution/thread safety, retries, unplug/replug, camera powered off, memory card/storage problems, timeout and recovery.
- Preservation of original file and consistent association with correct session/photo index.
- Backend camera owner and clear state events to React.

Preserve both **Webcam** and **Hot Folder** modes if supported by V1: polling/watcher semantics, stability check before reading a file, duplicate file prevention, ordering, error paths and session association. Do not replace actual Canon SDK support with `getUserMedia()` or a browser-only webcam abstraction. Do not open devices while V1 may be using them. Simulators are strictly labeled simulation.

## 6. DNP RX1HS — ORIGINAL WINDOWS PRINT PIPELINE

Assign `printer-engineer` to trace precisely how V1 prints to the **DNP RX1HS** (Windows installed driver/spooler, SDK/API if any, paper settings, print dialogs or direct image jobs, physical cutting). Do not invent a DNP SDK or a cut command not actually present in V1.

Preserve all **supported** output sizes/layout modes, including where V1 supports 5×15 cm photo strips, 10×15 cm photographs and 15×10 landscape layouts, and the observed **2-inch cut** behavior. Verify the exact media, pixel dimensions, rotations, collages, margins/borderless crop, DPI, strip pairing, printer driver properties and cut behavior from V1, device configuration and existing non-sensitive tests. **Do not infer paper geometry from label alone.**

V2 must handle printer discovery, online/offline state, configuration, print preview image, actual job enqueue, Windows print queue status where obtainable, media/error cases, repeated sessions and duplicate submission prevention. Explicitly distinguish:

- Print file generated successfully.
- Print job accepted by spooler.
- Physical print completed/confirmed (only if actual reliable evidence is available).

Do not equate spooler acceptance to paper physically emerging. Preserve V1's practical success/revenue rule exactly, noting what V1 itself treats as print success. Build dry-run output tests first, then physical DNP test only after permission.

## 7. CAPTURE SESSION STATE MACHINE — CONFIGURATION DRIVEN

Read actual V1 state machine, including transient/error/cancel states, and reproduce its observable behavior. Preserve current business-critical rules:

- **Photos per session/layout are configurable in the app**, not hardcoded to 6 or any other example.
- **Countdown between captures is configurable**, not hardcoded to 5 seconds or any other example.
- The session must use the **selected layout's configuration**, persisted/loaded through the established settings mechanism.
- Preserve unique session IDs and associated image/print/upload/payment metadata.
- Preserve the exact order of capture, Beauty processing where enabled, selection, frame/layout composition, confirmation, payment/print gates and delivery, **as actually implemented in V1**. If the prompt's generic order differs from V1, follow V1 and document it.
- Existing cancellation flow is permitted **only on Photo Selection and Frame Selection**, exposed via the existing hidden three-dot action if that is the accepted V1 behavior. Never add an unrestricted cancel button on payment/capture/printing screens.
- Back navigation/retakes/retries/return-to-home must follow actual V1 rules, not UI designer guesses.
- Prevent repeated touch taps, double print, double payment confirmation, stale asynchronous callbacks and cross-session leakage.
- Failure recovery must not silently reset or double-charge/duplicate revenue.

Kotlin backend remains the authoritative session state machine. React receives state snapshots and typed events and requests legal actions. All illegal transitions must be rejected and tested.

## 8. BEAUTY — FREEZE ACCEPTED ALGORITHMS AND MODELS

The accepted V1 pipeline is already treated as **stable and frozen**. The project's prior stable checkpoint has been identified around commit `5d65460`, but do NOT presume the current checkout or every file in that commit is necessarily the accepted production version: audit and document exactly which existing implementation is approved, without changing V1 branches or code.

Where present, preserve **YuNet face detection, BiSeNet/face parsing, segmentation/masks, guided filtering, skin smoothing, whitening, rosy tone, presets, face selection**, ONNX runtime/model assets, input normalization, crop/resize, thresholds, processing sequence, masking and fallback. **Do not retune, redesign, retrain, replace models or undertake new segmentation research.** Preserve license constraints of actual weights as distinct from code licenses.

Beauty can run **asynchronously after each saved capture**, queued in background and associated with its session/photo, but must respect current session state machine and dynamic photo count. **Never run the Beauty pipeline on live camera preview** unless explicitly authorized later. Preserve untouched originals, support safe disabled/test-only mode if V1 does, and ensure failed Beauty falls back to a valid original image rather than blocking kiosk use.

Generate characterization/parity tests on synthetic or authorized test images and compare outputs/behavior with the accepted V1 algorithm. Track numeric/pixel tolerance explicitly; do not claim exact pixel parity if the comparison is not actually performed.

## 9. IMAGE PROCESSING, LUT, FRAME ENGINE AND BUNDLES

Audit then preserve V1's real rules for:

- Original image resolution, rotation, mirror, aspect ratio, crops and export formats.
- Color LUT application, strength/intensity and exact processing order relative to Beauty and composition.
- Photo selection, selection quantity, ordering, layout slots, user retries and the current frame-selection state rules.
- Configurable **bundles** (e.g. seasonal/school, holiday, Instagram-style and event-specific collections if actually present) and all metadata, prices, layout variants and asset mapping.
- Frame sizes/layouts including **5×15 cm, 10×15 cm, 15×10 cm** and other square/3:2 configurations actually available in V1.
- Transparent **PNG frame windows**: keep windows/transparency, fit/crop **inside image windows only**, preserve exact aspect ratios, never erase frame edges or stretch artwork.
- Multiple layout options and different numbers of slots per bundle as implemented; never assume every bundle has a fixed number of frames or photos.
- Preview-to-final-to-print identity: the customer sees the actual selected crop/position/frame and the exported print matches it.
- File naming, session image assets and safe output locations (V2 only).

Build reference fixtures and geometry tests for each actual supported layout, alpha mask, orientation, window cropping and print export dimensions. Preserve originals and avoid data loss.

## 10. PAYOS, NEON, REVENUE, CLOUDINARY, QR — PRESERVE EXISTING CONTRACTS

`backend-engineer` must trace the **existing** business/API implementation and reuse its real contracts; do not invent new endpoints or schemas. Preserve at minimum, where present:

- **PayOS:** payment initiation, status/polling/webhook verification design, expiry, failure, retry, paid/authorized transition and customer-facing QR/payment UI.
- **Neon PostgreSQL:** reuse existing Neon instance and **shared API**; do NOT create new database/backend or change production schema automatically.
- **Two-PC arrangement:** mini PC writes confirmed transactions through the existing shared API and main PC reads revenue through the same backend; preserve established session identifiers and the Revenue screen behavior.
- **Revenue recognition rule:** only write revenue after the **successful established Confirm & Print condition**. Examine exactly how V1 defines this success and preserve it. Use idempotent operations keyed to V1's actual durable identifiers, not newly invented IDs that break compatibility.
- **Cloudinary:** image upload strategy, albums, session-to-photo association, safe retry, exposure boundaries, naming, original vs processed image handling and expiry behavior.
- **QR album delivery:** unique link per session/guest as actually designed, web gallery/download flow, current hosting/API contract, and error handling. The existing album may be hosted on Vercel; audit actual source and URLs rather than assuming.
- Existing settings/permissions/booth identifiers, pricing, booking/session status and support tools.

No real PayOS transaction, production DB write, schema migration, or Cloudinary upload without explicit approval. Build dependency-injected sandbox/mock adapters for CI and integration tests, but make production adapters real and wired to actual verified APIs. Never call a mocked endpoint “real payment completed.”

## 11. ADMIN, STUDIO, SETTINGS AND EVERY EXISTING SCREEN

The V1 audit must discover and preserve **all actual customer and operator functionality**. At minimum inspect, confirm and map any existing:

- Welcome/attract screen, start, bundle/package/layout choice, price and payment screen.
- Camera readiness, Live View, countdown/capture progress, photo selection, frame selection, Beauty controls if exposed, print preview, Confirm & Print, printing status, QR delivery and finish/reset.
- Administrator/Studio entry, hidden access, security, dashboard, settings and configuration.
- Camera selection/settings, capture method selection (Canon/Webcam/Hot Folder), countdown/photo-count configuration, resolution/orientation/mirroring.
- Printer selection/settings, paper size, test output, layout composition and dry-run.
- Frame and bundle management, cover images/assets, pricing, session settings, Beauty/LUT presets, cloud/album settings.
- Revenue screen, operation status, session lookup/history/logs, diagnostics/health checks and maintenance features **if actually present in V1**.

For each screen produce a contract with entry state, buttons, guards, actual backend commands, visible loading/error/empty states, transition rules, touch layout and parity acceptance test. Never invent admin functionality and then describe it as a preserved V1 feature; proposed improvements must be separately tagged NEW / OPTIONAL / REQUIRES APPROVAL.

## 12. V2 PREMIUM UI/UX — REAL INTERFACE, NOT A MOCKUP

`ui-designer` creates a coherent design system; `frontend-coder` implements it as real state-driven React screens.

- Target **landscape 16:10 touchscreen**, baseline test at **1920×1200** and **1280×800**, with Windows 100%, 125%, 150% scaling and additional screen sizes.
- Visual direction: **LE SOUVENIR**, premium minimal / Korean photobooth / editorial photography; warm ivory, soft champagne, subtle rose, matte-black text, calm surfaces, consistent photography-forward layouts. Do not clone the old Compose UI.
- Big touch hit areas (generally >=48 CSS px), readable countdown across booth, meaningful progress driven by actual per-layout count, accessible contrast, keyboard-free customer sessions, no hover-only or hidden required gestures.
- Customer-facing flow separate from protected Admin/Studio functions. Preserve hidden cancellation and permissions.
- Motion/microinteractions with proper reduced-motion handling and no blocking camera/print operations; robust disabled/loading/recovery states and double-tap protection.
- Correct crop in previews and print representations; never fake Live View with static images in production mode.
- Ensure all screens, including error states, are implemented, not just the Welcome screen.

The UI may have new visual styling and improved navigation only when the underlying V1 business constraints remain intact. Label any intentional behavior changes as proposals requiring user approval.

## 13. DEVELOPMENT QUALITY, TESTING AND RELEASE CRITERIA

Use strict evidence-backed gates. `tester-reviewer` must independently verify:

**Architecture:** React⇄backend IPC, lifecycle, native DLL loading strategy, logging, graceful crash/reconnect, offline behavior and installer compatibility.

**Camera:** dry-run simulation plus separate Canon device/driver tests, capture and original transfer, webcam, Hot Folder, recovery; do not mark hardware verified from mock tests.

**Image:** output dimensions, frame alpha integrity, print crop, LUT order, Beauty parity vs accepted fixtures, failures, large image and memory handling.

**Sessions:** dynamic photos/countdowns across multiple layouts, legal transitions, cancellation only at allowed stages, restart/failure paths, idempotency and rapid touch inputs.

**Printing:** image dry-run, queue dispatch, correct installed DNP RX1HS driver mode and physically observed output once user authorizes it; distinguish spooler acceptance from paper completion.

**Business:** test/sandbox payment, mocked Neon API, cross-PC semantics, revenue only after established Confirm & Print, retries/duplicate-webhook resistance, QR and cloud contract tests.

**UI:** 16:10 touchscreen usability, 1280×800 and 1920×1200, scaling, no hover dependency, Admin protection and full customer flow.

**Operations/security:** local IPC access control, no secrets, customer data isolation, safe paths, V1 isolation, offline/failed network operation, dependency and SDK/model licenses, Windows release.

For every test distinguish **AUTOMATED PASS**, **SIMULATED PASS**, **HARDWARE VERIFIED**, **NOT TESTED**, **FAIL** and evidence. A test not run cannot be called PASS. Don't claim production-ready until actual hardware and end-to-end commercial workflow validations have been performed with owner approval.

## 14. REQUIRED V2 PROJECT STRUCTURE AND ARTIFACTS

Use an evidence-based structure, roughly:

- `frontend/` — React/TS UI, state, screens, components, styles, tests.
- `backend/` — Kotlin/JVM modules: camera, webcam/hotfolder, session, images/LUT/Beauty, printer, payment, QR/cloud, settings/admin.
- `src-tauri/` or `electron/` — whichever desktop-shell feasibility validates.
- `shared/` — versioned typed IPC and event contracts.
- `tests/` — unit, integration, fixture, end-to-end tests.
- `scripts/` — build, dev, packaging and safe diagnostics.
- `docs/` — audit, decisions, progress, parity and hardware evidence.
- `.env.example` — placeholders only.
- A V2-specific `.gitignore` protecting secrets, session images, caches and local data.

Do not force module layout that breaks the actual Kotlin Gradle build or native DLL loading. Prefer a clean, reproducible Windows setup and one-command developer start, but never run a V1 build.

Maintain:

- `docs/PROGRESS.md`
- `docs/TASK_BOARD.md`
- `docs/FEATURE_PARITY_MATRIX.md`
- `docs/DECISIONS.md`
- `docs/BLOCKERS.md`
- `docs/TEST_RESULTS.md`
- `docs/HARDWARE_VALIDATION.md`
- `docs/RELEASE_READINESS.md`

Every subagent task should have **owner, bounded file scope, dependency, deliverable, success test and evidence**. No conflicting concurrent file edits.

## 15. ORDER OF IMPLEMENTATION — BUILD VERTICAL SLICES, NOT JUST DOCS

### Phase A — Delegation sanity check and source audit

Actually invoke `legacy-auditor`, prove it can read V1 safely, inventory screens/flows/config and assign camera/printer/Beauty/payment source analysis to the correct specialists. Create source-backed parity matrix. Record verified files, NOT assumptions.

### Phase B — Hardware-first architecture feasibility

`architect` + `camera-engineer` + `printer-engineer` + `backend-engineer`: validate Tauri/Electron and Kotlin sidecar strategy, native SDK loading, Windows printer integration and IPC. Build the minimal **V2-only runnable** host/backend prototype with safe simulation; record unverified real-device questions.

### Phase C — First end-to-end V2 vertical slice

Build a real React touch Welcome → selectable real-config layout → simulated/authorized capture adapter → original save in V2 → frame preview → safe dry-run print file → completion/reset, all using the actual Kotlin session engine and typed IPC. This must be runnable, even before external services/hardware are authorized. The simulated adapter is **not** production Canon verification.

### Phase D — Real camera adapters

Port and wire actual Canon SDK/Live View/capture and Webcam/Hot Folder adapters. Handle lifecycle and disconnect/reconnect. Physical device use requires permission.

### Phase E — Image, Beauty, LUT, frame/bundle parity

Port the actual accepted pipeline and dynamic layout/config rules, wire UI controls, add image fixture/parity tests.

### Phase F — DNP RX1HS print parity

Wire real print adapter/queue with safe dry-run tests, accurate sizing and established cut behavior. Physical paper tests require permission.

### Phase G — PayOS, Neon, Cloudinary, QR and all Admin/Studio features

Reuse existing API contracts, preserve idempotent revenue/Confirm & Print logic, full end-to-end UI and real adapters with safe test mode. No production side effects without authorization.

### Phase H — Full parity audit and hardening

Review every row in the V1 matrix, including minor settings, hidden controls, startup/exit, errors and uncommon modes. Run regression, end-to-end simulated sessions, and approved hardware tests; correct failures.

### Phase I — Independent Windows packaging and release

Create an installable **V2-only** release. Verify bundled JVM/runtime, native SDK availability/licensing, working-directory-independent paths, IPC startup, screen fullscreen behavior, errors/logging, printer driver dependency and V1/V2 coexistence. Do not deploy over V1 or claim production readiness without proof.

## 16. REPORTING RULES AND STOP CONDITIONS

For each milestone, return concisely:

1. **Milestone and user-facing outcome**.
2. **Real subagents invoked and actual results**.
3. **V1 files/symbols used as evidence** (not private secrets).
4. **V2 files created/modified**.
5. **Test commands, exit statuses and observed results**.
6. **Feature parity progress**: implemented, mock-verified, automated-tested, hardware-verified, blocked.
7. **V1 safety check**: whether V1 was untouched based on evidence actually collected (if not verified, say so).
8. **Authorization/hardware blockers**.
9. **Next bounded implementation step**.

Never state “V1 unchanged verified” unless you performed an actual safe comparison/baseline check. Never state “Canon SDK connected”, “DNP printer working”, “payment working”, “upload complete”, “V2 finished”, or “production ready” unless real evidence exists for that specific claim.

When a physical or production-action permission is missing, do all safe code work and mocks that can proceed without it, then mark the exact verification as blocked. Do not ask repetitive unnecessary questions when the V1 source can supply the answer. If a shell or model/tool error stops execution, report the exact failure instead of restating the entire roadmap.

## 17. BEGIN EXECUTION NOW — FIRST TASKS

**Start actual tool-driven implementation, not just narration:**

1. Confirm `E:\HK1_2026_2027\PhotoboothDesktop_v2` is the writable workspace.
2. Confirm Orchestrator can invoke named subagents. **Actually call `legacy-auditor` first** with a narrowly scoped V1 read-only task; wait for its response.
3. Have `legacy-auditor` locate the real V1 Kotlin app entry point, camera integration, printer integration, session engine, Beauty/LUT/image pipeline, payment/Neon/Cloudinary/QR and UI/Studio roots. Return exact source paths and symbols. Do not read archives/secrets.
4. Delegate separate V1 read-only analyses to `camera-engineer`, `printer-engineer`, `architect`, `backend-engineer` and `ui-designer` with non-overlapping deliverables in V2.
5. Have `tester-reviewer` check that the audit has cited real source, covers expected workflows, and contains no invented features.
6. Record the actual V1 feature map and technical feasibility decisions in V2; then build the first V2 runnable vertical slice.
7. Continue sequentially through safe next steps in this session. If stopped, report the exact completed files and next action, not an imaginary future completion.

**ABSOLUTE PRIORITIES:**

- **(1) NEVER MODIFY V1 OR CUSTOMER/PRODUCTION DATA.**
- **(2) KEEP REAL CANON SDK AND DNP RX1HS INTEGRATION; NEVER SUBSTITUTE MOCKS IN THE FINAL PRODUCT.**
- **(3) RETAIN ALL SOURCE-VERIFIED V1 FEATURES AND BUSINESS RULES, INCLUDING DYNAMIC PER-LAYOUT COUNTS AND COUNTDOWNS.**
- **(4) PRESERVE ACCEPTED BEAUTY, LUT, IMAGE, FRAME AND PRINT OUTPUT BEHAVIOR.**
- **(5) BUILD A TRULY NEW, PREMIUM 16:10 TOUCHSCREEN REACT APPLICATION WITH KOTLIN BACKEND.**
- **(6) PROVE FUNCTIONAL PARITY THROUGH TESTS, NOT CLAIMS.**

**BEGIN BY INVOKING `legacy-auditor` NOW.**
