# LE SOUVENIR PHOTOBOOTH V2 — EXACT V1 EXPERIENCE PARITY + PREMIUM UI + COMPLETE INTEGRATION PORT

## MASTER DIRECTIVE — IMPLEMENT, NOT JUST PLAN

You are the already-configured LE SOUVENIR V2 Lead Orchestrator. Continue the EXISTING V2 project and existing multi-agent session. This is a focused parity-and-migration milestone, not permission to replace the architecture or begin another prototype.

**My precise requirement:** Study the ENTIRE original V1 application as the source of truth for its screen structure, screen order, navigation, controls, configuration, event flow, and ALL real external integrations. Recreate that same recognizable structure and the SAME operating sequence in the V2 React desktop app, but with a much more polished, lively, premium and finger-friendly UI. Port the real integration code and contracts for the same web album, backend/API, database, payment, photo delivery and hardware systems, subject to the safety gates below. Do not omit hidden Admin/Studio functions or small settings.

### Project boundaries

- **V1 — READ-ONLY reference:** `E:\HK1_2026_2027\PhotoboothDesktop`
- **V2 — the ONLY writable project:** `E:\HK1_2026_2027\PhotoboothDesktop_v2`
- Preserve the V2 React + TypeScript + Vite + Tailwind + Motion frontend, Tauri Windows host, Kotlin/JVM backend, IPC bridge, existing simulator session, tests and source ports. DO NOT restart, overwrite or replace working V2 systems.
- Never run V1 build/clean/test/install, change its Git state, edit any V1 file, read its `.env` secrets, or touch V1 customer photos/archive. Never modify the live web app, database schema, merchant/payment account, cloud resources or deployment as an indirect side effect.
- This task authorizes V1 **non-sensitive source inspection**, V2-only source changes/builds, safe fixture-based integration tests, mock/sandbox operations where separately configured, and local simulator runs. It does **not** authorize live payments, real Canon shutter control, physical DNP jobs, production DB writes/migrations, customer uploads, production deployment, or disclosure/copying of secrets.

## 1. FIRST: COMPLETE V1 SCREEN + FLOW RECONSTRUCTION (REAL SOURCE EVIDENCE)

Invoke `legacy-auditor` with `ui-designer`, `architect`, and `backend-engineer` to read all non-sensitive V1 Compose/Kotlin UI and controllers, not merely names of screens. Trace each action end-to-end from rendered control -> callback -> controller -> session state -> adapter/service -> persistent or remote side effect -> next screen. Inspect V1 bundle/layout/frame assets and safe configuration schemas, without copying customer image data.

Discover all actual screens, including modal dialogs, hidden menus, timed/automatic transitions, first-run/recovery screens and Admin/Studio views. Record for EACH:

1. Exact V1 Kotlin file + class/function symbol.
2. Purpose, screen entry conditions, and exit conditions.
3. Spatial structure: sections, panel placement, photo preview dimensions/aspect, controls, labels, and interactions.
4. Which button does what, enabled/disabled rules, back/cancel/timeout behavior, warnings and errors.
5. Where its data comes from, including layout configs, prices, frame/bundle metadata, device status and session state.
6. Destination screen and state after every action; distinguish user-triggered versus automatic changes.
7. Corresponding existing or new V2 component and backend command; missing support and verification level.

Build `docs/V1_EXACT_UI_FLOW_MAP.md`, `docs/V1_TO_V2_SCREEN_PARITY.md` and `docs/V1_ACTION_BEHAVIOR_MATRIX.md` containing source references and actual evidence. Classify every screen/control as SOURCE VERIFIED / IMPLEMENTED / TESTED / BLOCKED. No invented screens or capabilities masquerading as V1.

## 2. EXACT FLOW, IMPROVED APPEARANCE — CRITICAL DISTINCTION

**PRESERVE** the discovered V1 order, number of stages, meaning of buttons, role boundaries, pricing/selection semantics, permitted navigation, session IDs, user cancellation behavior and relevant automatic transitions. A better visual presentation does NOT authorize changing business flow. Users familiar with V1 should recognize the same operation with a much better interface.

**IMPROVE** visual hierarchy, layouts for a 16:10 touch display, spacing, typography, cards, image galleries, visual feedback, page transitions, loading/error states, clarity, coherent brand identity and responsiveness. Redesign styling and component composition without silently deleting steps, changing the meaning of confirmations, or putting new barriers in the way. If a V1 interaction is unsafe, ambiguous, or inconsistent, DOCUMENT IT and implement a safe simulator-compatible equivalent behind a clearly flagged parity decision—do not silently call it identical.

Audit-informed known cautions: V1 was reported to allow some unrestricted FSM transitions, inactivity may auto-select/start printing with `userConfirmed=false`, print adapter success may only mean the Java print call returned, and manual-confirmation revenue semantics are distinct from auto flow. **Re-verify these in source**, document precise behavior and preserve existing business outcomes in tests without allowing unauthorized production side effects. Do not arbitrarily tighten or loosen state transitions and claim exact parity.

Capture count, photo selection count and countdown time are **separate configuration values per layout**. Never hardcode example simulator values. Preserve original photo data, exact frame slots/geometries, aspect ratios, cut/print mapping, LUT order and accepted Beauty algorithm behavior.

## 3. FULL CUSTOMER UI IMPLEMENTATION — NOT A DEMO

Implement and CONNECT all source-verified V1 customer screens, including any additional screens discovered, such as:

- Welcome / attract / Start, brand identity and optional inactivity reset.
- Bundle catalogue, per-bundle choices, real safe local thumbnails, frame/layout selection and pricing.
- Quantity/payment choice, price summary, PayOS QR/status/polling/timeout/error states as V1 actually implements.
- Camera readiness/source states, pre-capture instructions, correct real-vs-simulator labeling.
- Live View, photo countdown, capture progress, captured thumbnail previews, camera fallback/error/reconnect.
- Photo review and selection with exact per-layout selection count/order and proper back/cancel rules.
- Frame gallery/overlay selection, custom PNG windows and real composition preview.
- Final image preview, Confirm & Print with real existing business gates, duplicate prevention.
- Printing/progress/errors with explicit distinction: submitted to driver vs physically printed.
- QR album/delivery, completion/reset and relevant recovery states.
- All V1 popup dialogs, three-dot menus, auto-timeout behaviors and shortcuts, including any hidden cancellation only where V1 permits it.

Make each screen work through the EXISTING typed React -> Tauri -> Kotlin IPC, with Kotlin authoritative for session, money, print, photo artifacts and state. Never replace tested session logic with frontend-only local state. Preserve mounted simulator functionality and screenshot/regression artifacts. Use source-real assets safe to copy into V2; no copying private customer photos or proprietary/unlicensed binary assets without reviewing rights.

## 4. FULL ADMIN / STUDIO PARITY — INCLUDE SMALL FUNCTIONS

Audit and recreate **every source-verified operator screen and control**: Studio mode, camera source/device setup (Canon/Webcam/Hot Folder), live preview, capture timing, bundle/layout/frame management, custom frames, LUT/Beauty configurations, DNP printer settings/paper/cut orientation, network/cloud/album, PayOS settings/status, Neon/API connection status, pricing, session management, revenue view, diagnostics, photo-output folders, error/recovery settings and anything else present in V1. This list is a discovery guide, NOT permission to invent unsupported modules.

For each settings control verify read/write source, validation, persistence, restart requirements and relation to session/hardware. Keep operator functions protected from customer mode. No nonfunctional save buttons: implement actual safe V2 persistence or visibly mark BLOCKED. Avoid exposing credentials to React or runtime logs.

## 5. PORT ALL EXISTING WEB / API / DB / PAYMENT INTEGRATIONS

Invoke `backend-engineer` and `legacy-auditor` to trace V1 integrations from code, including their clients, configuration schema, models/DTOs, endpoints, event triggers, retry/idempotency, auth boundaries and error paths. Build `docs/V1_EXTERNAL_INTEGRATIONS_MAP.md` and `docs/V1_TO_V2_API_PARITY.md` listing every discovered provider/service/API with:

- V1 source file and functions, service purpose, base URL and endpoint patterns where non-secret.
- Request and response schemas, required headers by NAME (NEVER values), errors, timeouts and retry policy.
- Flow event that invokes it, session/booking/payment ID linkage, consistency and idempotency rules.
- Existing production provider/resource to REUSE, V2 Kotlin implementation, simulator fake/sandbox adapter and verification status.
- Whether external web-server/repository code is actually available. A URL or client API call is **not** proof you possess the server implementation.

Scope includes, if source verified:

**PayOS** — order/payment creation, QR payload, polling/webhook handling or existing verification mechanism, expiry/cancel, amounts/IDs, success/failure reconciliation. Do NOT spoof payment success in production; isolate explicit mock in simulator. Keep signing keys/server secrets in backend only.

**Neon PostgreSQL / existing API** — reuse existing Neon instance and current API/DB contracts, not a newly created backend or production DB. Reuse session IDs, booking/revenue logic and exact data ownership. Recheck the discovered V1 **direct Neon route with schema-changing behavior**: do NOT port or execute automatic schema migrations/DDL from a kiosk client. Mark as BLOCKED pending explicit review. No live writes until authorization. Revenue should only be recorded after verified V1-required manual confirmation, print adapter success and matching session ID; driver submission is not proof of physical completion. Test cancellation, idempotency, double-click/retry, race conditions, duplicate print and duplicate revenue.

**Cloudinary / photo delivery** — image upload/transform contracts, naming/path conventions, session album mapping, QR target URL, expiration policy, upload retries and failure recovery. Work only with synthetic V2 fixtures in development. Do not overwrite production collections or upload real customer photos without approval.

**Album website / Vercel / existing web endpoints** — preserve externally reachable album URLs, QR behavior, user view/download flow, any signed/share tokens and expiry rules. Trace where URL generation and upload/storage responsibilities actually live. If web-source repository is separate and not accessible through V1, document the missing dependency rather than inventing it or deploying a replacement.

**Any other integration** — discover additional providers, local API, booth identifiers, payment callbacks, license services, printer/device services, configuration files, remote endpoints, and data processing from the real V1 source.

Implement a tested V2 adapter interface with **real code paths** and explicitly separated FAKE/SANDBOX/PRODUCTION configuration modes. Test with fixtures/local mock servers, validate DTO parity and errors. Production settings must be disabled by default. Do not say 'all APIs migrated' unless each identified integration has verified code, a passing appropriate test, and any deployment blockers documented.

## 6. SECRETS, CONFIG AND PRODUCTION ISOLATION

- Do not access, echo, paste, copy, commit or send any credentials from V1 `.env`, Windows credential stores or production config files.
- Copy only non-secret source implementation and schema. Create V2 `.env.example` / typed config schema with **placeholder key names** and operator setup instructions. A trusted operator can later supply credentials directly in secure local V2 configuration; never invent values.
- Do not expose PayOS secret keys, Neon credentials, Cloudinary secrets or booth API tokens to client-side React or logs.
- Avoid making network requests to production during automated tests. Use mock server, recorded non-sensitive fixtures, simulator and explicitly separately configured sandbox.
- Do not run DDL, direct-schema creation, destructive SQL, live payments, webhook changes, cloud uploads, or deployment.
- When real end-to-end tests need production connectivity, write an explicit approval checklist and keep them NOT TESTED until authorized.

## 7. HARDWARE AND IMAGE-PROCESSING MUST SURVIVE THE REDESIGN

Preserve V2 source ports and V1-derived Kotlin systems; do not replace with JavaScript stubs:

- Real Canon SDK, native DLL loading, camera discovery, message loop, Live View, full-res shutter/transfer, disposal/reconnect.
- Webcam and complete Hot Folder source modes.
- DNP RX1HS Windows rendering/job submission, original print geometry, 5x15 cm, 10x15 cm and 2-inch cut behavior ONLY as source-proven; never invent cutting commands.
- Beauty/LUT: accepted YuNet/BiSeNet lineage must be source-verified, algorithms/presets/weights/thresholds frozen; do not change to beautify the UI.
- Accurate composition/frame PNG transparency, original photo retention, print-ready output formats.

Hardware work may remain behind current authorization gates; fake/mock screens must clearly label disconnected/unverified physical capabilities. UI may be fully implemented against typed disabled contracts, but no claims of physical integration without device tests.

## 8. DESIGN BRIEF — SAME LAYOUT LOGIC, MUCH BETTER UI

Keep the V1 content structure and customer journey recognizable, while professionally refreshing presentation:

- Brand: LE SOUVENIR; premium Korean-photobooth + warm editorial photography.
- Palette: warm ivory, soft cream, matte charcoal, champagne accents and restrained dusty rose.
- Spacious layout, attractive frame and photo galleries, elegant large typography, clear pricing/selection panels.
- Motion for meaningful state changes: entrance/exit, card selection, image arrival, countdown, shutter feedback, loading, QR reveal, completion; fast, non-blocking and reduced-motion aware.
- 16:10 landscape-first; test at 1280x800 and 1920x1200 plus Windows DPI scaling.
- Finger-friendly targets (aim >=48 CSS px), no hover-only interactions, no tiny hidden essentials, no accidental double submission, correct focus/disabled state.
- Large unobstructed Live View and countdown. Preserve real image aspect ratio, crop/window alignment, display mirroring rules.
- Separate operator-studio productivity UI from joyful customer kiosk UX, but keep a consistent brand system.
- Avoid generic SaaS dashboards, gradients-for-the-sake-of-gradients, visual-only controls, or replacing V1 navigation arbitrarily.

Design two meaningful concepts for Welcome + Capture and pick one grounded in real screen requirements. Implement ALL discovered screens with a consistent component/token system. Place technical diagnostics in an operator/developer route, not the customer Welcome.

## 9. MULTI-AGENT TASK OWNERSHIP

- `legacy-auditor`: comprehensive V1 UI, business, API, web and data flow source inventory; evidence with paths/symbols.
- `ui-designer`: faithful V1 spatial/interaction mapping plus upgraded design system; customer + Admin.
- `frontend-coder`: actual React implementation of all screens and transitions; typed IPC and responsive touch behavior.
- `architect`: V2 boundary/interface decisions, schema/versioning/contract review, Tauri/JVM lifecycle, avoid V1 mutation.
- `backend-engineer`: real Kotlin integration clients, payment/database/delivery adapters, config and tests, no secrets.
- `camera-engineer`: preserve SDK and camera-mode UX contracts; no physical capture without authorization.
- `printer-engineer`: print preview/cut/geometry and status contracts; no physical printing without authorization.
- `tester-reviewer`: independent parity checks, tests, mounted desktop screenshot reviews, regressions and security review.

Use actual native subagent invocation. Give each agent bounded non-overlapping V2 output paths. Never confuse an intended assignment with a completed subagent result.

## 10. IMPLEMENTATION ORDER — PRIORITIZE CODE, NOT PAPERWORK

**Stage A: fast evidence audit** — build complete V1 screen/action/API matrix and link to existing audit; don't repeat already verified whole-project analysis. Surface missing dependencies and mismatches quickly.

**Stage B: exact-flow simulator UI** — implement every customer screen/transition from V1 in the existing mounted V2 simulator, replacing temporary architecture-proof pages. Connect real Kotlin simulator session actions, photo artifacts and composition; no dead buttons.

**Stage C: Admin/Studio UI parity** — implement all discovered operator screens/settings, with real safe local persistence and explicit unavailable-state labels for gated integrations.

**Stage D: real API/data/payment adapter migration** — port all verified non-secret clients, DTOs and contracts into V2 Kotlin, complete independent fixture/mock/sandbox tests, keep production gates closed.

**Stage E: UI motion/polish** — full design system, elegant animations, accessibility/touch/DPI, no regression in functionality.

**Stage F: independent full-system testing** — run installed Kotlin suite, Rust/Tauri build and native desktop tests, React tests, screenshot reviews and V1→V2 parity regression. Update exact PASS/MOCK VERIFIED/NOT TESTED/BLOCKED status for each function.

Do not indefinitely stay in analysis. Each stage must create actual runnable V2 components/contracts and tests. Continue safe tasks through current execution time; when the run ends, leave an exact continuation checkpoint.

## 11. REQUIRED TEST CASES AND ACCEPTANCE GATES

- User can operate full source-verified V1 customer journey in V2 simulator with all correct stages, labels, back/cancel/timeout behavior.
- Layout-specific capture count, selection count and countdown remain configurable and independent. Test multiple distinct layout fixtures, not hardcoded 3/2 or 5/4.
- Real local original hashes survive capture/composition; frames compose and print-ready dimensions match source-verified geometry.
- Retry, cancellation, timeout, restart, reload and duplicate confirm cannot produce duplicate side effects.
- Print dry-run never submits physical jobs or records production revenue.
- All V1 Admin/Studio controls are accounted for; not-yet-supported production actions shown as unavailable, not fake successful.
- API contract tests cover PayOS, Neon/API, Cloudinary, web album/QR and every extra source-discovered integration, including failure modes, auth field names (not values) and idempotency.
- No production calls, schema changes, credential leakage, or V1 file edits in tests.
- Mounted Tauri WebView actual mouse/touch flows tested at 1280x800 and 1920x1200. Capture screenshot evidence of each customer and operator screen; review contrast, overflow, font sizes, icon target sizes and animation behavior.
- Rust/Tauri, React, JVM builds and test suites pass; preserve previous simulator bridge, child JVM shutdown and readiness regressions.
- Clearly distinguish SOURCE VERIFIED, UI IMPLEMENTED, AUTOMATED TESTED, MOCK VERIFIED, HARDWARE VERIFIED, PRODUCTION READY, and BLOCKED. No misleading completion claims.

## 12. REQUIRED DELIVERABLES IN V2

- `docs/V1_EXACT_UI_FLOW_MAP.md`
- `docs/V1_TO_V2_SCREEN_PARITY.md`
- `docs/V1_ACTION_BEHAVIOR_MATRIX.md`
- `docs/V1_EXTERNAL_INTEGRATIONS_MAP.md`
- `docs/V1_TO_V2_API_PARITY.md`
- `docs/UI_DESIGN_SYSTEM.md`
- `docs/UI_IMPLEMENTATION_STATUS.md`
- `docs/UI_VISUAL_REVIEW.md`
- `docs/API_MIGRATION_TEST_RESULTS.md`
- `docs/PROGRESS.md` and exact next milestone/checkpoint.
- Real React screen/component/source updates; typed IPC contracts; Kotlin adapter source and safe tests; screenshots and runnable V2 launcher retained.

## 13. START NOW — FIRST ACTUAL SUBAGENT CALLS

1. Read existing V2 implementation and completed simulator/bridge reports; preserve all working code.
2. Invoke `legacy-auditor` to produce the full source-backed V1 UI/flow/control matrix and external API inventory. Cite real V1 source paths and functions.
3. Invoke `ui-designer` to create a V1-faithful visual transformation based on those exact screens and actual operator workflows.
4. Invoke `frontend-coder` to begin implementing the real upgraded Welcome, bundle/layout, payment and capture UI, wired to existing Kotlin IPC, while auditor/design work continues. Use safe source-backed behavior only.
5. Invoke `backend-engineer` to map PayOS, Neon/API, Cloudinary, QR/album web contracts and create safe testable V2 clients or stubs clearly isolated from production; do not collect or copy secrets.
6. Have `architect` review integration contracts and `tester-reviewer` independently test each connected screen and adapter.
7. Continue through all source-verified customer screens, Admin/Studio parity, all source-verified external integrations and mounted visual review. Fix implementation defects rather than stopping at a plan.
8. Report: agents actually invoked; V1 paths read; V2 files changed; exact screen/endpoint parity; tests and screenshots; unresolved/blocked functions; next task.

**FINAL STANDARD:** V2 must reproduce the REAL V1 experience and all source-verified functional integrations while substantially improving the UI. Keep V1 untouched, avoid secrets, use only safe V2 fixtures until live authorization, and never declare an integration working merely because its button or mock exists.
