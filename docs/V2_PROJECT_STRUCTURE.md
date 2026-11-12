# LE SOUVENIR Photobooth V2 — Project Structure and Ownership

**Status:** Proposed implementation layout; directories shown here are not proof
that a component is implemented  
**Date:** 2026-11-12  
**Scope:** V2 only

This layout supports the architecture in `ARCHITECTURE_DECISIONS.md` while
keeping specialist ownership explicit. It is a target structure, not a request
to move existing files immediately. Structure changes should happen only when a
phase needs them; architecture churn for naming alone is not useful.

The repository already contains implementation directories and historical
artifacts. Adopt this layout incrementally: keep a conforming existing module in
place, add missing boundaries when its work package starts, and use an ADR for a
move that changes imports/builds. Do not bulk-reorganize merely to match the tree.

## 1. Repository layout

```text
PhotoboothDesktop_v2/
├── contracts/                         # Canonical IPC source; no business code
│   ├── schema/v1/                     # JSON Schema, one domain per file
│   │   ├── common.schema.json
│   │   ├── system.schema.json
│   │   ├── device-camera.schema.json
│   │   ├── session.schema.json
│   │   ├── processing.schema.json
│   │   ├── printing.schema.json
│   │   ├── payment.schema.json
│   │   ├── delivery.schema.json
│   │   └── admin.schema.json
│   ├── fixtures/v1/                   # Sanitized request/response/event fixtures
│   └── compatibility/                 # Contract compatibility reports
│
├── frontend/                          # React renderer; no credentials or hardware
│   ├── src/
│   │   ├── app/                       # Composition root, routes/screens, providers
│   │   ├── bridge/                    # Typed shell API and connection recovery
│   │   ├── generated/contracts/v1/    # Generated TS only; never hand-edited
│   │   ├── features/
│   │   │   ├── session/
│   │   │   ├── capture/
│   │   │   ├── selection/
│   │   │   ├── framing/
│   │   │   ├── payment/
│   │   │   ├── printing/
│   │   │   ├── delivery/
│   │   │   └── admin/
│   │   ├── screens/                   # One screen per authoritative session view
│   │   ├── components/                # Touch-safe, presentation-only components
│   │   ├── design-system/             # Tokens and restrained Motion primitives
│   │   ├── media/                     # MediaRef/object-URL lifecycle only
│   │   ├── test-adapters/             # Explicit simulator/mock contract adapter
│   │   └── styles/
│   ├── tests/                         # Component and renderer integration tests
│   └── public/                        # Non-secret packaged UI assets only
│
├── src-tauri/                         # Candidate Windows host; no business rules
│   ├── capabilities/                  # Minimal Tauri v2 capability allowlists
│   ├── src/
│   │   ├── lifecycle/                 # Spawn, handshake, Job Object, shutdown
│   │   ├── bridge/                    # Framed JSON-RPC allowlist and validation
│   │   ├── liveview/                  # Private binary transport/latest-frame slot
│   │   ├── media/                     # Scoped MediaRef protocol/byte access
│   │   ├── security/                  # CSP, navigation and path enforcement
│   │   └── diagnostics/               # Sanitized shell diagnostics
│   └── tests/                         # Host/sidecar lifecycle tests
│
├── backend/                           # Kotlin/JVM authority
│   ├── src/main/kotlin/com/lesouvenir/v2/
│   │   ├── bootstrap/                 # Startup, dependency wiring, shutdown
│   │   ├── generated/contracts/v1/    # Generated Kotlin only; never hand-edited
│   │   ├── ipc/                       # JSON-RPC adapter and schema validation
│   │   ├── domain/
│   │   │   ├── session/               # State, transitions, timers, snapshots
│   │   │   ├── pricing/               # Frozen pricing and quantity rules
│   │   │   └── operations/            # Idempotency/outcome journal
│   │   ├── camera/
│   │   │   ├── api/                   # Backend-owned camera ports
│   │   │   ├── canon/                 # EDSDK adapter and serialized dispatcher
│   │   │   ├── hotfolder/             # Isolated V2 Hot Folder adapter
│   │   │   ├── cli/                   # Optional bounded CLI adapter
│   │   │   ├── webcam/                # Explicit fallback adapter
│   │   │   └── simulator/              # Clearly labelled non-hardware adapter
│   │   ├── imaging/
│   │   │   ├── capture/               # Crop/effect/mirror/save order
│   │   │   ├── lut/                   # Designated V1 LUT behavior after manifest
│   │   │   ├── beauty/                # Designated pipeline; manifest/license gate
│   │   │   ├── composition/           # Print/master composition
│   │   │   └── video/                 # Bounded FFmpeg orchestration
│   │   ├── printing/
│   │   │   ├── api/                   # Printer discovery/job abstractions
│   │   │   ├── windows/               # Java Print Service/spooler adapter
│   │   │   └── status/                # Accepted vs completed vs unknown
│   │   ├── payment/                    # PayOS create/verify/poll; backend only
│   │   ├── revenue/                    # SQLite authority and Neon/API sync
│   │   ├── delivery/                   # Cloudinary/Web Album/QR orchestration
│   │   ├── catalog/                    # Layout/frame/effect/Firebase adapters
│   │   ├── config/                     # Non-secret config and V2 path policy
│   │   ├── secrets/                    # Credential Manager/DPAPI adapter
│   │   ├── storage/                    # Atomic files, sessions, assets, cache
│   │   └── diagnostics/                # Sanitized operator diagnostics
│   ├── src/test/                       # Unit, characterization, contract tests
│   └── app-resources/                  # Approved read-only resources only
│       ├── models/                     # Only legally cleared accepted weights
│       ├── native/win-x64/             # EDSDK only if redistribution is cleared
│       └── notices/                    # Dependency/model/native notices
│
├── poc/                                # Minimal feasibility code, not production
│   ├── tauri-sidecar-feasibility/       # Consolidated runnable Gate-2 harness
│   ├── sidecar-lifecycle/
│   ├── ipc-latency/
│   ├── liveview-transport/
│   ├── canon-win-x64/
│   ├── printer-spooler/
│   └── packaging/
│
├── installer/                          # Installer/update/rollback definitions
│   ├── windows/
│   ├── smoke/
│   └── manifests/
│
├── tests/
│   ├── contract/                       # Cross-language golden fixtures
│   ├── parity/                         # V1-observed behavior characterization
│   ├── integration/                    # Offline/sandbox integration tests
│   ├── hardware/                       # Opt-in, authorization-gated procedures
│   ├── installer/                      # Clean-VM install/upgrade/rollback
│   └── evidence/                       # Sanitized manifests and result summaries
│
├── docs/                               # Architecture, audit, ADRs and evidence
│   └── ADR/
├── scripts/                            # V2-only build/test helpers
└── .github/workflows/                  # CI without production secrets/actions
```

## 2. Boundary rules

1. `frontend/` may import only generated contract types and renderer-safe
   libraries. It may not import camera, printer, database, cloud, native, or
   filesystem implementations.
2. `src-tauri/` supervises processes and transfers validated messages/bytes. It
   may not calculate price, advance session state, declare payment success, or
   decide whether revenue is recognized.
3. `backend/` is the only authority for state, hardware, payment, revenue,
   delivery, and output files.
4. `contracts/schema/v1/` is the single contract source. TypeScript and Kotlin
   generated directories are build outputs; specialists do not patch them by
   hand.
5. `poc/` contains disposable feasibility probes. POC code cannot be imported by
   production modules, and a POC result is not automatically production quality.
6. `tests/hardware/` is opt-in. It must default to discovery/read-only operation;
   shutter, payment, cloud writes, or physical printing require explicit approval.
7. No source, build output, model, credential, SDK binary, or customer image is
   copied from V1 until its precise reuse and license disposition is approved.

## 3. Specialist ownership

| Path / artifact | Primary owner | Required reviewers | Ownership rule |
|---|---|---|---|
| `docs/ARCHITECTURE_DECISIONS.md`, `docs/IPC_CONTRACTS.md`, `contracts/schema/` | Solutions Architect | Backend Lead, Frontend Lead, QA | Architect owns protocol semantics and compatibility |
| `frontend/src/design-system/`, visual specifications | UI Designer | Frontend Lead, accessibility reviewer | Designer owns tokens/spec; Frontend owns executable components |
| `frontend/` except generated contracts | Frontend Lead | UI Designer, QA, Architect for bridge changes | No backend or shell implementation in renderer |
| `src-tauri/` | Desktop/Shell Engineer | Architect, Security, QA | Lifecycle/IPC only; no business authority |
| `backend/bootstrap`, `ipc`, `domain`, `config`, `storage` | Backend Lead | Architect, QA | Central orchestration and persistence |
| `backend/camera/**`, `poc/canon-win-x64/` | Camera Engineer | Backend Lead, QA Hardware | Canon claims require actual-device evidence |
| `backend/printing/**`, `poc/printer-spooler/` | Printer Engineer | Backend Lead, QA Hardware | No real job submission without approval |
| `backend/imaging/**` | Imaging/Backend Engineer | QA Parity, Architect | Copy/characterize designated, manifest-verified behavior; no retuning |
| `backend/payment`, `revenue`, `delivery`, `catalog` | Business Integrations Engineer | Backend Lead, Security, QA | Offline/sandbox by default; no live writes |
| `installer/`, update/signing manifests | Release Engineer | Security, QA Installer, Legal | New V2 identity; reproducible package manifest |
| `tests/contract`, `parity`, `integration` | Tester-Reviewer | Owning engineer, Architect | Independent pass/fail evidence |
| `tests/hardware` and lab reports | QA Hardware | Camera/Printer owner, operator | Clearly label actual device, driver and authorization |
| dependency/native/model notices | License/Release Owner | Legal, relevant engineer | Unknown rights block distribution, not silently waived |

Generated files have no independent owner: their schema owns them. Changes that
span ownership boundaries are sequenced—schema first, generated artifacts second,
consumer changes third—rather than having agents edit the same files concurrently.

## 4. Runtime installation and writable paths

The exact installer technology remains conditional on the shell POC, but the
isolation policy does not.

```text
Read-only install root (example):
%ProgramFiles%\LeSouvenir\PhotoboothV2\
├── LeSouvenirPhotoboothV2.exe
├── backend\LeSouvenirBackendV2.exe
├── runtime\                         # bundled x64 JVM runtime image
└── resources\                       # approved models/native binaries/notices

Machine operational root:
%ProgramData%\LeSouvenir\PhotoboothV2\
├── config\                          # non-secret validated configuration
├── secrets\                         # DPAPI-protected material / references
├── state\                           # operation journal and SQLite ledger
├── captures\sessions\<sessionId>\  # source, originals, derivatives, video
├── output\                          # master and printer-ready output
├── hotfolder\incoming\             # V2-only Hot Folder
├── assets\frames\
├── assets\luts\
├── logs\                            # rotating, redacted logs
└── updates\                         # signed update staging/rollback metadata

Per-kiosk-user ephemeral root:
%LOCALAPPDATA%\LeSouvenir\PhotoboothV2\
├── cache\
├── temp\
├── webview\
└── crash\
```

Path names are proposals to be finalized by the installer ADR. Required
properties are normative:

- a new application ID, executable name, package/upgrade identity, mutex, URI
  scheme, and update channel;
- no portable-mode discovery and no fallback to a V1 directory;
- config, secrets, ledger, logs, temp, Hot Folder, captures, output, assets, and
  cache each have explicit V2 roots;
- install resources are read-only at runtime; mutable assets are imported into
  the V2 operational root;
- overrides are canonicalized and rejected if they resolve inside V1, the V2
  install root, a network share not explicitly allowed, or outside configured
  roots;
- uninstall, purge, update, retention, and backup policies treat each writable
  root deliberately rather than deleting customer data by accident.

## 5. Naming and dependency direction

```text
frontend -> generated contracts -> shell allowlist -> backend IPC adapter
backend adapters -> backend domain ports -> session orchestrator
backend domain must not depend on Tauri, Electron, React, or Windows UI
camera/printer implementations must not call frontend or advance state directly
```

Domain types use opaque identifiers (`SessionId`, `PhotoId`, `MediaRef`) at the
contract edge. Absolute paths, native handles, `BufferedImage`, printer service
objects, JDBC objects, and vendor payloads never cross IPC.

## 6. Test and evidence placement

| Evidence class | Location | Meaning |
|---|---|---|
| Proposed design | `docs/`, `docs/ADR/` | Not compiled or executed |
| Compiled POC | `poc/` plus `tests/evidence/poc/` | Narrow technical proof only |
| Simulated test | `tests/integration/simulator/` | No hardware claim |
| Windows integration | `tests/evidence/windows/` | Packaged OS behavior; device may still be absent |
| Actual hardware | `tests/evidence/hardware/` | Named device/driver, operator, date and procedure |
| Release artifact | `installer/manifests/` and signed report | Exact hashes, licenses and rollback evidence |

Evidence must be sanitized: no credentials, customer media, private payment QR,
database URL, raw webhook body, or unnecessary absolute user path.

## 7. Deferred structure decisions

The following do not justify a repository move before their gate:

- Tauri-specific packaging versus Electron packaging;
- JPEG private-pipe Live View versus a measured shared-buffer fallback;
- a separate native Canon helper process;
- a DNP vendor SDK bridge instead of Java Print Service;
- splitting the backend into multiple deployable processes.

Each is introduced only by an ADR tied to failed evidence. The default remains
one supervised Kotlin authority with narrow hardware adapters.
