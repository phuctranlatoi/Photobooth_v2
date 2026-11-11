# LE SOUVENIR V2 Test Strategy

**Document type:** Test-plan template  
**Status:** Template — no test execution is implied  
**Scope:** React/touch UI, desktop bridge, Kotlin/JVM services, Canon camera integrations, DNP printing, image processing, session/business flows, and supported fallback modes

## 1. Purpose and principles

This document defines the structure for planning and evaluating V2 testing. It is a reusable template, not a record of completed tests. Test evidence must distinguish simulated behavior from real camera, printer, network, payment, and packaging behavior.

Testing should:

- preserve feature and state-machine parity with the audited V1 behavior;
- prioritize customer safety, hardware safety, data integrity, and recovery over code coverage;
- keep test credentials, customer photos, production databases, real payments, uploads, and physical prints out of automated runs;
- identify the environment, build, configuration, fixture data, and operator authorization for every result;
- test cancellation, timeout, unplug, process restart, and partial-failure paths as first-class behavior.

## 2. Test-level taxonomy

Every planned test is assigned one primary level and may have secondary tags such as `touch`, `kiosk`, `camera`, `printer`, `payment`, `security`, or `recovery`.

### 2.1 Unit tests

**Purpose:** Verify deterministic logic in isolation with controlled inputs and no external hardware or production services.

**Coverage categories:**

- session state transitions, guards, cancellation, retry, timeout, and recovery rules;
- layout-specific photo counts, countdowns, pricing, totals, and configuration validation;
- IPC request/response schemas, version negotiation, validation, error mapping, and serialization;
- image metadata, crop/scale calculations, LUT selection, frame composition, Beauty configuration, and immutable-original rules;
- print-job construction, media/layout selection, idempotency keys, and result-state mapping;
- QR/session identifier formatting and safe log redaction;
- UI reducers, view-models, loading/error states, keyboard/kiosk-back handling, and touch-target state;
- security helpers, allowlists, path validation, and configuration defaults.

**Isolation requirements:** No Canon SDK initialization, DNP submission, network write, PayOS request, Neon write, Cloudinary upload, or customer-photo mutation. Use generated fixtures and fake clocks where timing is relevant.

**Evidence:** test command, commit/build identifier, fixture set, pass/fail output, and coverage or rationale for intentionally untested branches.

### 2.2 Integration tests

**Purpose:** Verify contracts and lifecycle behavior across application components while replacing unsafe or unavailable external systems with explicit fakes, simulators, or local services.

**Coverage categories:**

- React UI to authenticated/versioned desktop bridge and bridge error propagation;
- Kotlin/JVM service to camera abstraction, hot-folder adapter, image pipeline, printer adapter, and filesystem;
- startup, shutdown, restart, concurrent-request, queue, and backpressure behavior;
- database repository and idempotency behavior against an isolated test database or emulator;
- payment verification, webhook/reconciliation, Cloudinary adapter errors, and QR generation using sandbox/local fixtures;
- installer/runtime configuration, separate V2 paths and identity, model/resource discovery, and missing-resource handling;
- observability: correlation IDs, useful diagnostics, and absence of secrets or image contents in logs.

**Controls:** External calls must be intercepted and visibly labeled as simulated. Tests must prove that a mocked success cannot be mistaken for real hardware or settled revenue.

### 2.3 Hardware validation tests

**Purpose:** Validate behavior on the supported Windows Mini PC and the actual approved devices, without treating mocks as hardware evidence.

**Required environments:** Record OS/build, machine specifications, display resolution/scaling, Canon model/SDK version, lens and connection, DNP model/driver/media, JVM/runtime, GPU drivers, and application build.

**Coverage categories:**

- Canon discovery, SDK initialization/disposal, Live View start/stop, capture, transfer, repeated capture, unplug/reconnect, and clean shutdown;
- hot-folder file readiness, incomplete-file handling, duplicate/late files, disk-full behavior, and recovery;
- DNP discovery/read-only status, media/layout selection, crop/scale, queue states, driver errors, cancellation, and prevention of duplicate output;
- touchscreen/display behavior at target 16:10 resolution and scaling, including visibility, touch targets, feedback, full-screen/kiosk behavior, and camera-preview aspect;
- CPU/GPU/memory, capture latency, countdown/live-view impact, queue depth, thermals, and sustained-session stability;
- installer upgrade/uninstall/reinstall, missing driver/model recovery, and startup/shutdown after power or process interruption.

**Safety controls:** Physical capture and printing require explicit operator authorization and a safe test setup. Payment and production backend writes remain prohibited. Record photos and print samples only in approved test locations, never customer locations.

**Evidence:** timestamped logs, device/driver details, screen recording or approved screenshots where useful, measured resource/latency data, and print-output comparison against the approved reference. Mark results `PASS-REAL-HARDWARE`, `BLOCKED`, or `NOT-RUN`; do not report simulated evidence as hardware validation.

### 2.4 Session-flow tests

**Purpose:** Validate complete customer and operator journeys through the state machine, including normal and interrupted paths, using simulated services unless a separately authorized hardware run is specified.

**Coverage categories:**

- idle/attract, configuration selection, consent or start, countdown, capture sequence, retake/cancel, preview, Beauty/LUT/frame choices, composition, confirmation, print, QR/revenue completion, and return to idle;
- each supported layout's configurable photo count and countdown;
- repeated taps, rapid taps, back/cancel at every permitted stage, timeout, retry, loading, offline, camera unavailable, printer unavailable, and process restart;
- recovery after partial capture, failed processing, failed upload/payment verification, print failure, and abandoned sessions;
- isolation between consecutive sessions: no stale photos, settings, payment state, queue item, or customer data leakage;
- customer-visible messaging, touch usability, accessibility-relevant text sizing/contrast, and operator diagnostics.

**Evidence:** flow identifier, starting configuration, transition trace, expected/actual terminal state, screenshots or recordings for visual issues, and whether dependencies were simulated or real.

## 3. Test data and environment tiers

| Tier | Intended use | External side effects |
|---|---|---|
| T0 static/unit | Pure logic and component tests | None |
| T1 local integration | Bridge, filesystem, queues, fake services | Local test artifacts only |
| T2 sandbox | Approved payment/backend sandbox and isolated test storage | Sandbox-only writes |
| T3 hardware lab | Approved Canon/DNP/touchscreen validation | Test captures/prints only with authorization |
| T4 release candidate | Clean installation and recovery rehearsal | No production payment, upload, print, or database writes unless separately approved |

Each run records tier, configuration version, feature flags, fixture IDs, and cleanup result. Secrets are injected through approved test configuration and must never be committed or copied into reports.

## 4. Milestone acceptance criteria

### Milestone A — strategy and baseline

- Audited feature/state inventory is linked to test areas.
- Test ownership, environments, data rules, severity definitions, and evidence format are agreed.
- No known test path can target production payment, database, uploads, printer queue, or customer files by default.
- Baseline build and V1 comparison references are identified without modifying V1.

### Milestone B — contracts and foundation

- Unit coverage exists for state guards, money/idempotency rules, configuration validation, IPC schemas, and safety-critical error mapping.
- Integration tests exercise bridge startup, authentication/exposure boundaries, version mismatch, timeout, shutdown, and malformed input.
- Failures are actionable and logs contain correlation data without credentials or sensitive image data.

### Milestone C — feature and session parity

- Every supported session transition and cancellation rule has at least one automated or documented session-flow check.
- Layout counts/countdowns, LUT, Beauty, frames, previews, print selection, QR, and revenue gating are represented in the matrix.
- Consecutive-session isolation and partial-failure recovery are demonstrated in a repeatable test environment.
- Touch UI checks cover target resolution/scaling, loading feedback, overflow, kiosk navigation, and repeated taps.

### Milestone D — hardware readiness

- Approved hardware validation has been run on the target Windows environment, with device and driver evidence.
- Camera initialization/disposal, capture/transfer, unplug/reconnect, hot-folder readiness, and repeated sessions are observed on real hardware or explicitly blocked with a documented reason.
- Printer output, media/layout settings, queue/error behavior, and duplicate-print prevention are validated; no mock result is accepted as proof.
- Resource usage and live-view/countdown impact are measured for a representative sustained run.

### Milestone E — release candidate

- Clean install, upgrade, uninstall, startup, shutdown, and recovery checks pass with a V2-specific identity and paths.
- No unresolved Critical or High test failures, security findings, data-loss risks, or unreviewed architectural changes remain.
- All blocked/not-run hardware, licensing, backend, and payment checks have named owners and release disposition.
- Regression matrix, QA report, security findings, and release-readiness signoff are complete.

## 5. Result states and defect governance

Use the controlled result labels `PASS-AUTOMATED`, `PASS-SIMULATED`, `PASS-REAL-HARDWARE`, `FAIL`, `BLOCKED`, and `NOT-RUN`. A pass must include evidence; “works locally” is not evidence.

Severity guidance:

- **Critical:** unsafe hardware action, duplicate charge/print, production data exposure, unrecoverable session/data loss, or release-blocking startup failure;
- **High:** broken core flow, incorrect money/revenue gating, camera/print failure without safe recovery, or security boundary bypass;
- **Medium:** significant degraded flow, touch/usability failure, parity gap, or unreliable recovery with workaround;
- **Low:** cosmetic, diagnostic, or non-blocking documentation issue.

Every failure records reproduction, environment, expected/actual behavior, logs/evidence location, severity, owner, mitigation, and regression coverage. Release decisions require explicit reviewer signoff for architectural changes and an operator decision for any real hardware, payment, upload, or print activity.

## 6. Test execution record template

```text
Run ID:
Build/commit:
Date/time:
Tester/operator:
Test level and tags:
Environment tier:
Hardware/configuration:
Fixture/data IDs:
Authorization required/received:
Cases or flow IDs:
Result label:
Expected vs actual:
Evidence/log paths:
Resource and latency observations:
Defect IDs / follow-up owner:
Cleanup verified:
``` 
