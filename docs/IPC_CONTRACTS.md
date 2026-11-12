# LE SOUVENIR Photobooth V2 — Typed Frontend/Backend IPC Contract

**Contract family:** `v1`  
**Document revision:** 1.0.0-draft  
**Status:** Normative proposed contract; generated types/implementations are not
asserted by this document  
**Date:** 2026-11-12

This specification is shell-neutral. React calls a narrow Tauri command adapter
or Electron preload adapter; the shell maps it to the private Kotlin sidecar
protocol. Kotlin is authoritative for session, device, processing, payment,
print, revenue, delivery and files.

## 1. Compatibility, schemas and validation

### 1.1 Versioning

- `contractVersion` follows SemVer compatibility rules. The wire carries the
  negotiated `major.minor`; release documentation records the patch revision.
- `system.hello` negotiates one version from the frontend/shell supported range
  and backend supported range before any other method.
- Additive optional fields/events are minor-compatible. Removing/renaming a field,
  changing its meaning/range, changing enum behavior, or changing idempotency is
  a major version.
- Unknown optional object fields are ignored only by readers explicitly marked
  forward-tolerant; strict command schemas reject them. Unknown enum values are
  rejected at command input and mapped to a safe `UNKNOWN` presentation only at
  tolerant diagnostic readers.
- During an in-flight session, one negotiated contract version remains pinned.

### 1.2 Canonical source and generated types

Canonical wire definitions are to be expressed as JSON Schema 2020-12 under
`contracts/schema/v1/`, with:

- `additionalProperties: false` for commands and security-sensitive objects;
- explicit string/array/number bounds and formats;
- discriminated unions using `kind`, `type`, `state`, `stage`, or `status`;
- money as integer VND (`int64`/safe bounded integer), never floating point;
- timestamps as RFC 3339 UTC strings; durations as integer milliseconds;
- identifiers as UUID strings or constrained opaque IDs, never file paths.

The implementation work package must generate TypeScript and Kotlin
representations from the same schemas. CI must compile both and validate golden
request/response/event fixtures.
Handwritten TypeScript/Kotlin declarations below are the intended generated
shape; when schemas exist, schemas are canonical.

Validation occurs at both trust boundaries:

1. renderer wrapper validates outgoing commands and incoming results/events;
2. shell validates the method allowlist, size and envelope before forwarding;
3. backend validates the full method schema before side effects;
4. backend validates/sanitizes adapter/vendor data before emitting it.

### 1.3 Control transport

- Shell ↔ Kotlin: JSON-RPC 2.0 over inherited stdin/stdout.
- Framing: 4-byte unsigned big-endian byte length plus UTF-8 JSON payload.
- Maximum control payload: 1 MiB; full-resolution image bytes are prohibited.
- One serialized backend writer emits responses and notifications; `stderr` is
  diagnostics only.
- No localhost/public sidecar port. Live View uses the separate binary contract in
  section 12.

## 2. Common envelopes and scalar types

```ts
type Uuid = string;
type Instant = string;       // RFC 3339 UTC, e.g. 2026-11-12T10:15:30.123Z
type DurationMs = number;    // integer >= 0
type Revision = number;      // integer >= 0, monotonically increasing per session
type MoneyVnd = number;      // integer, 0..9_000_000_000_000_000

interface RpcRequest<T> {
  jsonrpc: "2.0";
  id: Uuid;
  method: MethodName;
  params: T;
  contractVersion: string;    // negotiated major.minor, currently "1.0"
}

interface RpcSuccess<T> {
  jsonrpc: "2.0";
  id: Uuid;
  result: T;
  contractVersion: string;
}

interface RpcFailure {
  jsonrpc: "2.0";
  id: Uuid | null;
  error: {
    code: number;              // JSON-RPC/category number; see section 3
    message: string;           // stable non-sensitive summary
    data: IpcError;            // typed domain error
  };
  contractVersion?: string;   // absent only when negotiation/parsing never succeeded
}

interface RpcEvent<T> {
  jsonrpc: "2.0";
  method: EventName;
  params: T & { meta: EventMeta };
  contractVersion: string;
}

interface EventMeta {
  eventId: Uuid;
  sequence: number;           // process-lifetime monotonic integer
  occurredAt: Instant;
  sessionId?: Uuid;
  generationId?: Uuid;
  revision?: Revision;
}

interface QueryContext {
  sessionId?: Uuid;
  generationId?: Uuid;
}

interface MutationContext {
  commandId: Uuid;            // unique transmission/log correlation ID
  idempotencyKey: Uuid;       // stable for retries of one logical command
  sessionId?: Uuid;
  generationId?: Uuid;
  expectedRevision?: Revision;
}
```

Kotlin generation maps these as follows:

```kotlin
@JvmInline value class SessionId(val value: UUID)
@JvmInline value class GenerationId(val value: UUID)
@JvmInline value class CommandId(val value: UUID)
@JvmInline value class IdempotencyKey(val value: UUID)
@JvmInline value class Revision(val value: Long)
@JvmInline value class MoneyVnd(val value: Long)

data class MutationContext(
  val commandId: CommandId,
  val idempotencyKey: IdempotencyKey,
  val sessionId: SessionId? = null,
  val generationId: GenerationId? = null,
  val expectedRevision: Revision? = null,
)
```

The frontend creates and retains one `idempotencyKey` for one deliberate action.
Kotlin deduplicates every mutation for the session/generation lifetime and
durably persists keys for external side effects (especially payment, print,
revenue and upload). It verifies that duplicate keys have identical canonical
parameters. `commandId` alone is not print/payment duplicate protection.

## 3. Media, operation and error types

```ts
interface MediaRef {
  id: string;                 // opaque, backend-issued
  revision: number;
  kind: "CAPTURE_SOURCE" | "ORIGINAL" | "BEAUTY_DERIVATIVE" |
        "THUMBNAIL" | "FRAME_ASSET" | "COMPOSITE_PREVIEW" |
        "MASTER_PRINT" | "PRINTER_PAYLOAD" | "DELIVERY_QR" | "VIDEO";
  mimeType: "image/jpeg" | "image/png" | "video/mp4";
  width?: number;
  height?: number;
  byteLength?: number;
}

type OperationStatus =
  | "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED"
  | "CANCEL_REQUESTED" | "CANCELLED" | "OUTCOME_UNKNOWN";

interface OperationRef {
  operationId: Uuid;
  kind: "CAPTURE" | "BEAUTY" | "COMPOSITION" | "PRINT" |
        "PAYMENT" | "UPLOAD" | "REVENUE_SYNC" | "DIAGNOSTIC";
  status: OperationStatus;
  createdAt: Instant;
}

type ErrorCategory =
  | "VALIDATION" | "STATE_CONFLICT" | "STALE_REVISION"
  | "DEPENDENCY_UNAVAILABLE" | "TIMEOUT" | "CANCELLED"
  | "OUTCOME_UNKNOWN" | "SECURITY" | "PROTOCOL" | "INTERNAL";

type RetryDirective =
  | "DO_NOT_RETRY" | "RETRY_SAME_KEY" | "RETRY_AFTER_RECONNECT"
  | "OPERATOR_ACTION_REQUIRED" | "RECONCILE_BEFORE_RETRY";

interface IpcError {
  code: ErrorCode;
  category: ErrorCategory;
  messageKey: string;         // safe UI/localization key, not raw vendor text
  retry: RetryDirective;
  retryAfterMs?: DurationMs;
  operationId?: Uuid;
  sessionId?: Uuid;
  generationId?: Uuid;
  currentRevision?: Revision;
  correlationId: Uuid;
  safeDetails?: Record<string, string | number | boolean>;
}

type ErrorCode =
  | "PROTOCOL_VERSION_UNSUPPORTED" | "FRAME_TOO_LARGE" | "MALFORMED_MESSAGE"
  | "METHOD_NOT_ALLOWED" | "SCHEMA_VALIDATION_FAILED"
  | "SESSION_NOT_FOUND" | "SESSION_GENERATION_MISMATCH"
  | "SESSION_STATE_CONFLICT" | "SESSION_STALE_REVISION"
  | "IDEMPOTENCY_CONFLICT" | "OPERATION_NOT_FOUND"
  | "OPERATION_NOT_CANCELLABLE" | "OPERATION_TOO_LATE"
  | "CAMERA_NOT_FOUND" | "CAMERA_BUSY_EXTERNAL" | "CAMERA_DISCONNECTED"
  | "SIMULATOR_NOT_PERMITTED"
  | "CAMERA_SESSION_FAILED" | "CAMERA_LIVEVIEW_FAILED"
  | "CAMERA_CAPTURE_FAILED" | "CAMERA_CAPTURE_TIMEOUT" | "HOT_FOLDER_TIMEOUT"
  | "NATIVE_LIBRARY_MISSING" | "NATIVE_ARCH_MISMATCH" | "NATIVE_LOAD_FAILED"
  | "PROCESSING_TIMEOUT" | "PROCESSING_FAILED" | "MODEL_UNAVAILABLE"
  | "COMPOSITION_FAILED" | "MEDIA_NOT_FOUND" | "MEDIA_REF_INVALID"
  | "PRINTER_NOT_CONFIGURED" | "PRINTER_NOT_FOUND" | "PRINTER_OFFLINE"
  | "PRINTER_CAPABILITY_UNSUPPORTED" | "PRINT_SUBMIT_FAILED"
  | "PRINT_OUTCOME_UNKNOWN" | "PRINT_ALREADY_SUBMITTED"
  | "PAYMENT_NOT_CONFIGURED" | "PAYMENT_CREATE_FAILED"
  | "PAYMENT_VERIFY_FAILED" | "PAYMENT_AMOUNT_MISMATCH"
  | "PAYMENT_SIGNATURE_INVALID" | "PAYMENT_EXPIRED" | "PAYMENT_OUTCOME_UNKNOWN"
  | "NETWORK_UNAVAILABLE" | "UPLOAD_FAILED" | "ALBUM_FAILED"
  | "REVENUE_WRITE_FAILED" | "STORAGE_UNAVAILABLE" | "CONFIG_INVALID"
  | "SECRET_NOT_CONFIGURED" | "UNAUTHORIZED_OPERATOR"
  | "BACKEND_STARTING" | "BACKEND_SHUTTING_DOWN" | "INTERNAL_ERROR";
```

The JSON-RPC numeric `error.code` is the stable category mapping below; the
domain `IpcError.code` above is carried in `error.data` (with the remaining
structured fields). For errors that occur before a compatible contract can be
parsed, `contractVersion` may be omitted and `error.data` may be a minimal safe
object instead of full `IpcError`. This preserves JSON-RPC interoperability
without forcing normal UI logic to branch on opaque integers.

| JSON-RPC code | Meaning |
|---:|---|
| `-32700` | JSON parse error after a valid length frame |
| `-32600` | Invalid envelope/framing/version |
| `-32601` | Method absent or denied by allowlist |
| `-32602` | Schema/parameter validation failure |
| `-32603` | Sanitized internal error |
| `-32010` | Session state/generation/revision conflict |
| `-32020` | Device/native/printer dependency unavailable |
| `-32030` | Timeout/cancellation |
| `-32040` | Payment/network/delivery dependency failure |
| `-32050` | Side-effect outcome unknown; reconciliation required |
| `-32060` | Operator authorization/security failure |

`safeDetails` cannot contain credentials, stack traces, SQL, absolute private
paths, native pointers, payment QR payloads, raw webhook bodies, or customer image
bytes. Those remain in redacted backend diagnostics where appropriate.

## 4. System, health and connection contracts

```ts
interface HelloParams {
  clientName: "tauri-shell" | "electron-shell";
  clientVersion: string;
  supportedContractRange: { min: "1.0"; max: "1.x" };
  bootstrapProof: string;     // shell-only opaque proof; renderer cannot set it
}

interface HelloResult {
  selectedContractVersion: "1.0";
  backendVersion: string;
  backendInstanceId: Uuid;
  processArchitecture: "x86_64";
  capabilities: Capability[];
  runtimeMode: "REAL" | "SIMULATOR" | "DIAGNOSTIC";
}

type Capability =
  | "CAMERA_CANON" | "CAMERA_HOT_FOLDER" | "CAMERA_CLI" | "CAMERA_WEBCAM"
  | "LIVE_VIEW_BINARY_V1" | "PRINT_WINDOWS" | "BEAUTY_V1"
  | "PAYOS" | "REVENUE" | "CLOUD_DELIVERY" | "ADMIN_STUDIO";

type ServiceHealth = "STARTING" | "READY" | "DEGRADED" | "NOT_READY" | "STOPPING";

interface HealthSnapshot {
  liveness: "ALIVE";
  readiness: ServiceHealth;
  backendInstanceId: Uuid;
  uptimeMs: DurationMs;
  contractVersion: "1.0";
  dependencies: {
    camera: DependencyHealth;
    printer: DependencyHealth;
    storage: DependencyHealth;
    models: DependencyHealth;
    network: DependencyHealth;
  };
}

interface DependencyHealth {
  status: "READY" | "DEGRADED" | "UNAVAILABLE" | "DISABLED" | "UNKNOWN";
  code?: ErrorCode;
  changedAt: Instant;
}

type SystemMethod = "system.hello" | "health.get" | "system.shutdown";
type SystemEvent = "health.changed" | "connection.lost" | "connection.recovered";

interface ShutdownParams extends MutationContext { reason: "APP_EXIT" | "UPDATE" | "OPERATOR" }
interface ShutdownAccepted { accepted: true; deadlineMs: DurationMs }

interface ConnectionLostEvent {
  reason: "PROCESS_EXIT" | "PIPE_CLOSED" | "HEARTBEAT_TIMEOUT" | "PROTOCOL_ERROR";
  lastBackendInstanceId?: Uuid;
  restartAttempt: number;
}

interface ConnectionRecoveredEvent {
  backendInstanceId: Uuid;
  previousBackendInstanceId?: Uuid;
  snapshotRequired: true;
}
```

`connection.*` is emitted by the shell because Kotlin cannot announce its own
process death. After recovery the renderer must request `session.getSnapshot`;
the shell must not replay a mutation automatically. The shell constructs
`system.hello` and injects `bootstrapProof`; this method is not exposed as a
renderer-supplied Tauri/preload call.

## 5. Device and camera contracts

```ts
type CameraAdapter = "CANON_EDSDK" | "HOT_FOLDER" | "CLI" | "WEBCAM" | "SIMULATOR";
type DeviceConnection = "UNKNOWN" | "ABSENT" | "CONNECTING" | "READY" |
                        "BUSY_EXTERNAL" | "DISCONNECTED" | "ERROR" | "DISABLED";

interface CameraStatus {
  adapter: CameraAdapter;
  connection: DeviceConnection;
  deviceId?: string;          // sanitized stable backend ID
  displayName?: string;
  liveView: "STOPPED" | "STARTING" | "STREAMING" | "RECONNECTING" | "FAILED";
  capture: "IDLE" | "COUNTDOWN" | "CAPTURING" | "TRANSFERRING" | "FAILED";
  lastFrameAt?: Instant;
  lastErrorCode?: ErrorCode;
  isActualHardware: boolean;
}

interface PrinterDeviceSummary {
  printerId: string;          // backend-issued exact installed queue ID
  displayName: string;
  connection: DeviceConnection;
  isConfiguredFor: Array<"STRIP" | "FULL">;
  driverName?: string;
  driverVersion?: string;
}

interface PrinterCapabilitiesResult {
  printer: PrinterDeviceSummary;
  media: Array<{
    mediaId: string;
    displayName: string;
    widthMicrometers?: number;
    heightMicrometers?: number;
    borderlessReported: boolean | "UNKNOWN";
  }>;
  copiesSupported: { min: number; max: number } | "UNKNOWN";
  spoolerJobIdReported: boolean;
  queueStatusReported: boolean;
  physicalCompletionReported: boolean;
  cancellationAfterSubmitReported: boolean;
}

interface DeviceStatusResult {
  runtimeMode: "REAL" | "SIMULATOR" | "DIAGNOSTIC";
  camera: CameraStatus;
  printers: PrinterDeviceSummary[];
  beauty: { enabled: boolean; models: "READY" | "MISSING" | "ERROR" };
  storage: DependencyHealth;
  cloud: DependencyHealth;
}

interface CameraCapabilitiesResult {
  adapter: CameraAdapter;
  deviceId?: string;
  supportsLiveView: boolean;
  supportsSoftwareTrigger: boolean;
  supportedIso: string[];
  supportedAperture: string[];
  supportedShutter: string[];
  supportedWhiteBalance: string[];
  supportedPictureStyle: string[];
}

interface CaptureStartParams extends MutationContext {
  // No count/countdown/effect/path supplied: backend uses frozen layout snapshot.
}

interface CaptureStartResult {
  operation: OperationRef;
  snapshot: SessionSnapshot;
}

type CaptureStage = "SEQUENCE_STARTED" | "COUNTDOWN" | "SHUTTER_REQUESTED" |
                    "TRANSFERRING" | "SAVING_ORIGINAL" | "PHOTO_READY" |
                    "BETWEEN_SHOTS" | "BEAUTY_WAIT" | "SEQUENCE_COMPLETED";

interface CaptureProgressEvent {
  operationId: Uuid;
  stage: CaptureStage;
  shotIndex: number;          // 1-based
  totalShots: number;
  countdownRemaining?: number;
  messageKey?: string;
}

interface CaptureStatusResult {
  operation: OperationRef;
  stage: CaptureStage;
  shotIndex: number;
  totalShots: number;
  photos: CapturedPhoto[];
  terminal?: CaptureCompletedEvent;
}

interface PhotoReadyEvent {
  operationId: Uuid;
  photo: CapturedPhoto;
}

interface CaptureCompletedEvent {
  operationId: Uuid;
  status: "SUCCEEDED" | "FAILED" | "CANCELLED";
  photos: CapturedPhoto[];
  snapshot: SessionSnapshot;
  error?: IpcError;
}

interface CapturedPhoto {
  photoId: Uuid;
  shotIndex: number;
  source?: MediaRef;          // immutable ingest/transfer, backend-retention policy
  original: MediaRef;
  thumbnail: MediaRef;
  beautyDerivative?: MediaRef;
  processingStatus: "NOT_REQUESTED" | "QUEUED" | "RUNNING" |
                    "READY" | "FALLBACK_ORIGINAL";
}
```

`original` means the V1-parity canonical JPEG after effect/LUT and horizontal
mirror. Optional `source` is the immutable pre-processing ingest retained for
recovery/privacy-policy purposes; it is not automatically shown or uploaded.

Methods/events:

| Method/event | Params/result | Notes |
|---|---|---|
| `device.getStatus` | `QueryContext` → `DeviceStatusResult` | Read-only aggregate status |
| `camera.getCapabilities` | `QueryContext` → `CameraCapabilitiesResult` | Backend-sanitized values |
| `camera.retryConnection` | `MutationContext` → `CameraStatus` | Admin/operator only |
| `capture.startSequence` | `CaptureStartParams` → `CaptureStartResult` | One backend-owned full sequence |
| `capture.getStatus` | operation query → `CaptureStatusResult` | Recovery/poll fallback |
| `device.statusChanged` | `DeviceStatusResult` | Conflatable snapshot event |
| `capture.progress` | `CaptureProgressEvent` | Ordered by event sequence |
| `photo.ready` | `PhotoReadyEvent` | Original always identifies fallback |
| `capture.completed` | `CaptureCompletedEvent` | Terminal event |

Capture terminal failure is therefore represented twice: the initiating request
can fail before an operation is accepted, while an accepted asynchronous sequence
ends with `capture.completed.status="FAILED"` and its structured `error`.

The frontend cannot request one arbitrary Canon command, output path, or number of
shots. Camera commands are serialized in Kotlin. Simulator has a distinct adapter
and `isActualHardware=false`; it is never a transparent fallback.

## 6. Session, layout, selection and framing contracts

```ts
type SessionState =
  | "IDLE" | "SELECTING" | "SELECTING_QUANTITY" | "PAYMENT_PENDING"
  | "PREPARING" | "LIVE_VIEW" | "COUNTDOWN" | "CAPTURING"
  | "SELECTING_PHOTOS" | "EDITING" | "COMPOSING" | "PRINT_PENDING"
  | "PRINTING" | "DELIVERY" | "RECOVERY" | "OUT_OF_SERVICE" | "ADMIN";

interface LayoutSlot {
  id: string;
  xRatio: number; yRatio: number; widthRatio: number; heightRatio: number;
}

interface EffectConfig {
  effectId: string;
  title: string;
  kind: "NONE" | "LUT_3D" | "COLOR_MATRIX";
  enabled: boolean;
  revision: string;
  preview?: MediaRef;
  // Paths and implementation/tuning parameters remain backend-owned.
}

interface LayoutConfig {
  layoutId: string;
  title: string;
  thumbnail?: MediaRef;
  printSize: "STRIP_5X15" | "FULL_10X15" | "FULL_15X10";
  shotCount: number;           // backend-validated config, never UI default
  selectCount: number;
  countdownSeconds: number;
  printAspectRatio: number;
  photoAspectRatio: number;
  slots: LayoutSlot[];
  gridColumns?: number;
  paddingRatio?: number;
  gapRatio?: number;
  qrPlacement?: { xRatio: number; yRatio: number; sizeRatio: number };
  basePriceVnd: MoneyVnd;
  includedQuantity: number;
  extraUnitPriceVnd: MoneyVnd;
  allowedQuantities: number[];
  configRevision: string;
}
```

`slots` is the authoritative resolved normalized slot geometry. Grid fields are
optional source/edit metadata; clients must not recompute different production
slots from them. QR placement uses normalized coordinates for preview while the
backend maps it to the audited compositor canvas dimensions.

Print-size labels are canonical semantic enums at IPC, not locale strings. The
backend preserves audited pixel geometry: 5x15 master 1184x3580 and two-up payload
1226x1829; 10x15 master 2368x3580 and payload 1226x1829; 15x10 master
3580x2368 and payload 1829x1226, pending fixture/hardware confirmation. Changing
these values requires explicit approval.

```ts

interface PricingSnapshot {
  quantity: number;
  includedQuantity: number;
  extraQuantity: number;
  basePriceVnd: MoneyVnd;
  extraUnitPriceVnd: MoneyVnd;
  extraAmountVnd: MoneyVnd;
  totalAmountVnd: MoneyVnd;
  frozenAt: Instant;
}

interface SessionSnapshot {
  sessionId?: Uuid;
  generationId?: Uuid;
  revision: Revision;
  state: SessionState;
  layout?: LayoutConfig;
  effectId?: string;
  pricing?: PricingSnapshot;
  payment?: PaymentSnapshot;
  capture?: {
    currentShot: number;
    totalShots: number;
    countdownRemaining?: number;
    photos: CapturedPhoto[];
  };
  selectedPhotoIds: Uuid[];
  selectedFrameId?: string;
  compositionPreview?: MediaRef;
  print?: PrintJobSnapshot;
  delivery?: DeliverySnapshot;
  inactivity?: {
    kind: "PHOTO_SELECTION" | "FRAME_SELECTION" | "POST_CAPTURE";
    deadline: Instant;
    remainingMs: DurationMs;
  };
  availableActions: SessionAction[];
}

type SessionAction =
  | "START" | "OPEN_ADMIN" | "SET_LAYOUT" | "SET_EFFECT" | "CONFIRM_SETUP"
  | "SET_QUANTITY" | "BACK" | "ACTIVITY" | "START_CAPTURE"
  | "SET_SELECTION" | "CONFIRM_SELECTION" | "SELECT_FRAME" | "CONFIRM_FRAME"
  | "CONFIRM_PRINT" | "CANCEL_SESSION" | "FINISH_SESSION";

interface SessionStartResult {
  sessionId: Uuid;
  generationId: Uuid;
  snapshot: SessionSnapshot;
}
```

Session methods:

```ts
type SessionMethod =
  | "session.getSnapshot" | "session.start" | "session.openAdmin"
  | "session.setLayout" | "session.setEffect" | "session.confirmSetup"
  | "session.setQuantity" | "session.back" | "session.recordActivity"
  | "session.cancel" | "session.finish"
  | "selection.set" | "selection.confirm"
  | "frame.list" | "frame.select" | "frame.confirm";

type SessionMutation = MutationContext;
interface SessionStartParams extends MutationContext {}
interface SetLayoutParams extends MutationContext { layoutId: string }
interface SetEffectParams extends MutationContext { effectId: string }
interface SetQuantityParams extends MutationContext { quantity: number }
interface SetSelectionParams extends MutationContext { photoIds: Uuid[] }
interface SelectFrameParams extends MutationContext { frameId: string }

interface FrameSelectResult {
  snapshot: SessionSnapshot;
  composition?: OperationRef;
}

interface ImportToken {
  token: Uuid;                // shell-issued, one use, short-lived
  purpose: "FRAME_PNG" | "LUT_CUBE" | "DIAGNOSTICS_DESTINATION";
  displayName: string;        // basename only, sanitized
  byteLength: number;
  expiresAt: Instant;
}

interface FrameImportParams extends MutationContext {
  operatorGrantId: Uuid;
  importToken: ImportToken;
  layoutId: string;
  title: string;
  specialEventName?: string;
}

interface LutImportParams extends MutationContext {
  operatorGrantId: Uuid;
  importToken: ImportToken;
  title: string;
}

interface FrameOption {
  frameId: string;
  title: string;
  layoutId: string;
  printSize: LayoutConfig["printSize"];
  thumbnail: MediaRef;
  overlay?: MediaRef;
  isSpecial: boolean;
  specialEventName?: string;
  revision: string;
  qrPlacement?: { xRatio: number; yRatio: number; sizeRatio: number };
}

interface SpecialBundle {
  bundleId: string;
  title: string;
  layoutId: string;
  cover: MediaRef;
  frameIds: string[];
}

interface StudioCatalogResult {
  catalogRevision: string;
  layouts: LayoutConfig[];
  effects: EffectConfig[];
  frames: FrameOption[];
  bundles: SpecialBundle[];
}
```

Events:

```ts
interface SessionStateChangedEvent {
  previousState: SessionState;
  snapshot: SessionSnapshot;
  reason: "COMMAND" | "PAYMENT_CONFIRMED" | "CAPTURE_PROGRESS" |
          "INACTIVITY_TIMEOUT" | "RECOVERY" | "FINISHED";
}

interface SessionTimeoutChangedEvent {
  kind: "PHOTO_SELECTION" | "FRAME_SELECTION" | "POST_CAPTURE";
  deadline: Instant;
  remainingMs: DurationMs;
}
```

Normative parity rules:

- Customer path and back/cancel behavior are those in
  `ARCHITECTURE_DECISIONS.md`; callers cannot request a generic target state.
- `session.cancel` is accepted only in `SELECTING_PHOTOS` or `EDITING`.
- Timers run in Kotlin. `session.recordActivity` is a signal, not a client-set
  deadline.
- Selection is a complete set, not a toggle, making retries deterministic; the
  backend enforces `selectCount`.
- Layout values and pricing are backend snapshots. The renderer never invents
  counts, countdown or amount.
- Runtime/capture mode is deployment/operator policy established outside the
  customer session command. `session.start` cannot request `SIMULATOR`; production
  policy returns `SIMULATOR_NOT_PERMITTED` rather than silently substituting it.
- `COMPOSING`, `RECOVERY`, and `OUT_OF_SERVICE` remain enum-compatible. Activating
  them as new customer-flow transitions needs explicit approval.

## 7. Beauty, LUT and composition contracts

```ts
type ProcessingKind = "BEAUTY_CAPTURE" | "COMPOSITE_PREVIEW" | "FINAL_COMPOSITION";
type ProcessingStage = "QUEUED" | "DETECTING_FACES" | "PARSING_FACE"
  | "BUILDING_MASK" | "APPLYING_BEAUTY" | "COMPOSING" | "WRITING_OUTPUT";

interface ProcessingRequestParams extends MutationContext {
  kind: ProcessingKind;
  photoIds?: Uuid[];
  // No arbitrary model path/LUT path/strength. Backend uses manifest-approved config.
}

interface ProcessingProgressEvent {
  operationId: Uuid;
  kind: ProcessingKind;
  stage: ProcessingStage;
  completedUnits: number;
  totalUnits: number;
  currentPhotoId?: Uuid;
}

interface PhotoProcessingResult {
  photoId: Uuid;
  outcome: "DERIVATIVE_READY" | "FALLBACK_ORIGINAL";
  original: MediaRef;
  derivative?: MediaRef;
  fallbackReason?: "DISABLED" | "NO_FACE" | "TIMEOUT" | "CANCELLED" | "ERROR";
}

interface ProcessingCompletedEvent {
  operationId: Uuid;
  kind: ProcessingKind;
  status: "SUCCEEDED" | "PARTIAL_FALLBACK" | "FAILED" | "CANCELLED";
  photos?: PhotoProcessingResult[];
  output?: MediaRef;
  error?: IpcError;
}

interface ProcessingStatusResult {
  operation: OperationRef;
  lastProgress?: ProcessingProgressEvent;
  terminal?: ProcessingCompletedEvent;
}
```

Methods/events:

| Name | Contract |
|---|---|
| `processing.request` | `ProcessingRequestParams` → `OperationRef` |
| `processing.getStatus` | operation query → `ProcessingStatusResult` |
| `processing.progress` | `ProcessingProgressEvent` |
| `processing.completed` | `ProcessingCompletedEvent` |

Capture normally schedules Beauty automatically; `processing.request` exists for
an authorized backend-defined retry/admin workflow, not to let the renderer tune
the algorithm. Preserve the V1 aggregate 15-second cap before photo selection.
The terminal result always names the original fallback. No absolute output path
crosses IPC.

Composition progress/results use the same processing union: preview/final jobs
have `kind="COMPOSITE_PREVIEW"` or `"FINAL_COMPOSITION"`, progress stage
`COMPOSING`, and a terminal `output: MediaRef`.

## 8. Printer and cancellation contracts

```ts
type PrintStatus =
  | "NOT_STARTED" | "PREPARING" | "SUBMITTING" | "ACCEPTED_BY_SPOOLER"
  | "PRINTING_REPORTED" | "COMPLETED_REPORTED" | "FAILED"
  | "CANCEL_REQUESTED" | "CANCELLED" | "OUTCOME_UNKNOWN";

interface PrintJobSnapshot {
  printOperationId: Uuid;
  printJobId?: string;        // backend opaque ID; spool ID may be unavailable
  status: PrintStatus;
  printerId: string;
  printerDisplayName: string;
  requestedCustomerCopies: number;
  submittedSheets: number;
  payload: MediaRef;
  spoolerAcceptedAt?: Instant;
  physicalCompletionProven: boolean;
  revenueEligible: boolean;
  messageKey?: string;
  lastError?: IpcError;
}

interface PrintConfirmParams extends MutationContext {
  userConfirmed: true;
  // Selection/frame/quantity come from authoritative session snapshot.
}

interface PrintConfirmResult {
  operation: OperationRef;
  job: PrintJobSnapshot;
  snapshot: SessionSnapshot;
}

interface PrintStatusChangedEvent { job: PrintJobSnapshot }

interface CancelOperationParams extends MutationContext {
  operationId: Uuid;
}

interface CancelOperationResult {
  outcome: "CANCELLED" | "CANCEL_REQUESTED" | "TOO_LATE" | "NOT_CANCELLABLE";
  operation: OperationRef;
}
```

Methods/events:

| Name | Contract |
|---|---|
| `printer.list` | query → exact installed `PrinterDeviceSummary[]` |
| `printer.getCapabilities` | `{ printerId }` query → `PrinterCapabilitiesResult` |
| `print.confirm` | `PrintConfirmParams` → `PrintConfirmResult` |
| `print.getStatus` | operation query → `PrintJobSnapshot` |
| `print.statusChanged` | `PrintStatusChangedEvent` |
| `operation.cancel` | `CancelOperationParams` → `CancelOperationResult` |

Print rules:

- `print.confirm` is the only customer print mutation. It is durable and
  idempotent before crossing the spooler boundary.
- Exact configured queue matching replaces V1's silent default fallback.
- Customer copy count and submitted sheet count are distinct; strip two-up
  calculation remains backend business logic. Preserve the audited initial rule:
  strip sheets = `max(requestedCustomerCopies / 2, 1)` after backend quantity
  validation (strip quantities are even); full-size sheets = requested copies.
- `ACCEPTED_BY_SPOOLER` is not physical completion. `COMPLETED_REPORTED` is used
  only when the installed driver actually provides that evidence.
- A crash/timeout across submission becomes `OUTCOME_UNKNOWN`; the same or a new
  key cannot resubmit until operator reconciliation resolves it.
- Cancellation is reliable only before submission. Backend may return `TOO_LATE`.
- `messageKey` is an operator/customer-safe localized-status key. Driver text and
  stack details remain only in redacted backend logs/diagnostics.

## 9. Payment contracts, including webhook observations

```ts
type PaymentMethod = "PAYOS" | "CASH";
type PaymentStatus = "NOT_CREATED" | "CREATING" | "PENDING" | "PAID" |
                     "EXPIRED" | "CANCELLED" | "FAILED" | "OUTCOME_UNKNOWN";

interface PaymentSnapshot {
  paymentOperationId?: Uuid;
  orderRef?: string;          // opaque; avoid unsafe JS integer order codes
  method?: PaymentMethod;
  status: PaymentStatus;
  amountVnd?: MoneyVnd;
  checkoutQr?: MediaRef;
  expiresAt?: Instant;
  paidAt?: Instant;
  verifiedBy?: "PAYOS_QUERY" | "TRUSTED_WEBHOOK_SERVICE" | "AUTHORIZED_CASH";
  messageKey?: string;
  lastError?: IpcError;
}

interface PaymentCreateParams extends MutationContext {
  // Amount/description are derived from frozen pricing; client cannot supply them.
}

interface PaymentCreateResult {
  operation: OperationRef;
  payment: PaymentSnapshot;
  snapshot: SessionSnapshot;
}

interface PaymentVerifyParams extends MutationContext {
  paymentOperationId: Uuid;
}

interface CashConfirmParams extends MutationContext {
  operatorGrantId: Uuid;
}

interface PaymentStatusChangedEvent { payment: PaymentSnapshot; snapshot: SessionSnapshot }

interface PaymentWebhookObservedEvent {
  paymentOperationId: Uuid;
  source: "TRUSTED_WEBHOOK_SERVICE";
  signatureValid: true;
  eventType: "PAYMENT_PAID" | "PAYMENT_CANCELLED" | "PAYMENT_EXPIRED";
  observedAt: Instant;
  // No raw body, signature, secret or customer bank details.
}
```

Polling remains backend-owned on the audited three-second initial cadence while a
PayOS order is pending; `payment.verify` is a recovery/admin query, not a request
for the renderer to become the authoritative polling loop. Leaving
`PAYMENT_PENDING` through the audited back command cancels polling.

Methods/events:

| Name | Contract |
|---|---|
| `payment.create` | `PaymentCreateParams` → `PaymentCreateResult` |
| `payment.verify` | `PaymentVerifyParams` → `PaymentSnapshot` |
| `payment.confirmCash` | `CashConfirmParams` → `PaymentSnapshot` |
| `payment.cancelPending` | session mutation → `PaymentSnapshot` (used by audited back route) |
| `payment.statusChanged` | `PaymentStatusChangedEvent` |
| `payment.webhookObserved` | `PaymentWebhookObservedEvent` |

The desktop sidecar does not expose a public webhook port. A trusted remote
service verifies PayOS webhook signatures and the backend learns the result via
authenticated polling/API, or the backend verifies PayOS query status directly.
The event is observational; Kotlin still matches session/order/amount and applies
the transition idempotently. No frontend `paid: true` input exists.

## 10. Revenue, Neon, Cloudinary, Web Album and QR delivery

```ts
type DeliveryStage = "LOCAL_FILES_READY" | "UPLOADING_PHOTOS" |
  "UPLOADING_MASTER" | "UPLOADING_VIDEO" | "FINALIZING_ASSETS" |
  "COMPLETING_ALBUM" | "SYNCING_REVENUE" | "READY" | "DEFERRED" | "FAILED";

interface AssetDeliveryStatus {
  assetId: Uuid;
  kind: "PHOTO" | "MASTER_PRINT" | "VIDEO";
  ordinal: number;
  status: "QUEUED" | "UPLOADING" | "UPLOADED" | "FINALIZED" | "FAILED";
  retryable: boolean;
}

interface DeliverySnapshot {
  deliveryOperationId?: Uuid;
  stage: DeliveryStage;
  albumId?: string;
  albumUrl?: string;          // backend allowlisted HTTPS URL only
  qrCode?: MediaRef;
  assets: AssetDeliveryStatus[];
  revenueSync: "NOT_ELIGIBLE" | "PENDING" | "SYNCED" | "FAILED";
  completedAt?: Instant;
  lastError?: IpcError;
}

interface DeliveryRetryParams extends MutationContext {
  deliveryOperationId: Uuid;
  scope: "FAILED_UPLOADS" | "ALBUM_FINALIZE" | "REVENUE_SYNC";
}

interface DeliveryProgressEvent { delivery: DeliverySnapshot }
interface DeliveryReadyEvent { delivery: DeliverySnapshot; snapshot: SessionSnapshot }

interface UploadOperationEvent {
  operationId: Uuid;
  provider: "CLOUDINARY" | "WEB_ALBUM";
  assetId?: Uuid;
  ordinal?: number;
  status: "QUEUED" | "UPLOADING" | "UPLOADED" | "FINALIZING" |
          "FINALIZED" | "FAILED";
  retryable: boolean;
  error?: IpcError;
}

interface RevenueSyncEvent {
  operationId?: Uuid;
  provider: "LOCAL_SQLITE" | "NEON" | "REVENUE_HTTP_API";
  status: "NOT_ELIGIBLE" | "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  pendingCount: number;
  error?: IpcError;
}
```

Methods/events:

| Name | Contract |
|---|---|
| `delivery.getStatus` | session query → `DeliverySnapshot` |
| `delivery.retry` | `DeliveryRetryParams` → `OperationRef` |
| `delivery.progress` | `DeliveryProgressEvent` |
| `delivery.ready` | `DeliveryReadyEvent` |
| `upload.statusChanged` | `UploadOperationEvent` |
| `revenue.syncStatusChanged` | `RevenueSyncEvent` |

Backend behavior preserves ordered Web Album asset finalization. Cloudinary
provider URLs and credentials are never accepted from the renderer. Neon/local
ledger writes are not separate UI commands: the print/revenue orchestration
decides eligibility and writes the idempotent local record, then syncs it. QR is
generated from an allowlisted backend-approved delivery URL. No `0.0.0.0` desktop
file server is introduced by this contract.

URL strings are a narrow exception to the general MediaRef rule because the
customer QR/open-album action needs the final delivery target. They must be HTTPS,
host-allowlisted, length-bounded, backend-created, and never accepted back as an
authoritative frontend input. Payment checkout QR data remains a scoped MediaRef,
not a raw secret-bearing URL/string.

## 11. Admin/studio settings and diagnostics

```ts
interface SecretState { configured: boolean; source: "NONE" | "CREDENTIAL_STORE" | "PROTECTED_FILE" }

interface PublicSettings {
  revision: string;
  boothId: string;
  cameraAdapter: CameraAdapter;
  hotFolderConfigured: boolean;      // path itself need not cross renderer IPC
  printerStripId?: string;
  printerFullId?: string;
  systemPrintEnabled: boolean;
  beautyEnabled: boolean;
  beautyPreset: "NATURAL" | "STUDIO" | "BRIGHT" | "STRONG";
  photoSelectionTimeoutSeconds: number;
  frameSelectionTimeoutSeconds: number;
  postCaptureTimeoutSeconds: number;
  integrations: {
    payOs: SecretState;
    neon: SecretState;
    cloudinary: SecretState;
    webAlbum: SecretState;
  };
}

interface SettingsPatch {
  expectedSettingsRevision: string;
  cameraAdapter?: CameraAdapter;
  printerStripId?: string | null;
  printerFullId?: string | null;
  systemPrintEnabled?: boolean;
  beautyEnabled?: boolean;
  beautyPreset?: PublicSettings["beautyPreset"];
  photoSelectionTimeoutSeconds?: number;
  frameSelectionTimeoutSeconds?: number;
  postCaptureTimeoutSeconds?: number;
}

interface CameraExposurePatch {
  iso?: string;
  aperture?: string;
  shutter?: string;
  whiteBalance?: string;
  pictureStyle?: string;
}

interface DiagnosticsSnapshot {
  generatedAt: Instant;
  appVersion: string;
  backendVersion: string;
  contractVersion: string;
  runtimeMode: "REAL" | "SIMULATOR" | "DIAGNOSTIC";
  health: HealthSnapshot;
  deviceStatus: DeviceStatusResult;
  pendingOperations: number;
  pendingRevenueSync: number;
  redactionApplied: true;
}

interface RevenueDashboard {
  period: "TODAY" | "LAST_7_DAYS" | "THIS_MONTH" | "LAST_MONTH";
  totalAmountVnd: MoneyVnd;
  completedCount: number;
  voidedCount: number;
  pendingSyncCount: number;
  daily: Array<{ date: string; amountVnd: MoneyVnd; count: number }>;
  byPrintSize: Array<{ printSize: LayoutConfig["printSize"]; amountVnd: MoneyVnd; count: number }>;
  recent: RevenueTransactionSummary[];
}

interface RevenueTransactionSummary {
  sessionId: Uuid;
  printSize: LayoutConfig["printSize"];
  quantity: number;
  totalAmountVnd: MoneyVnd;
  paymentMethod: PaymentMethod;
  status: "COMPLETED" | "VOIDED";
  syncStatus: "PENDING" | "SYNCED" | "FAILED";
  createdAt: Instant;
}

interface RevenueMutationParams extends MutationContext {
  operatorGrantId: Uuid;
  targetSessionId: Uuid;
  reason: string;
  actualQuantity?: number;     // required for adjust, absent for void
}

interface OperatorGrant {
  operatorGrantId: Uuid;
  capabilities: Array<"VIEW_DIAGNOSTICS" | "EDIT_SETTINGS" | "CONFIRM_CASH" |
                      "MANAGE_LAYOUTS" | "MANAGE_FRAMES" | "MANAGE_LUTS" |
                      "MANAGE_REVENUE" | "RECONCILE_PRINT">;
  expiresAt: Instant;
}
```

Admin methods:

| Name | Rule |
|---|---|
| `admin.authorize` | Establishes short-lived operator grant through approved local workflow |
| `admin.getSettings` | Returns `PublicSettings`; never credential values |
| `admin.updateSettings` | `MutationContext + OperatorGrant + SettingsPatch`; allowed safe state only |
| `admin.getDiagnostics` | Returns `DiagnosticsSnapshot` |
| `admin.exportDiagnostics` | Writes a redacted backend-owned bundle and returns `MediaRef`/export token |
| `admin.getCatalog` | Returns `StudioCatalogResult` with a revision |
| `admin.listLayouts` / `admin.updateLayout` | Validates all per-layout values and revision |
| `admin.listFrames` / `admin.importFrame` / `admin.deleteFrame` | Shell file picker yields scoped import token, not arbitrary path |
| `admin.listEffects` / `admin.importLut` / `admin.updateEffect` | Manifest/format/size/parser checks in backend; no algorithm retuning |
| `admin.updateCameraExposure` | Validates `CameraExposurePatch` against current Canon capabilities; safe state only |
| `admin.getRevenueDashboard` | Sanitized local/cloud summary and recent transactions |
| `admin.adjustRevenue` / `admin.voidRevenue` | `RevenueMutationParams`; operator-granted, reason-required, idempotent backend mutations |
| `admin.reconcilePrint` | Operator-only resolution for `OUTCOME_UNKNOWN`; audited |

Studio/admin mutation events return or emit the refreshed settings/catalog
revision. Secret provisioning uses a privileged installer/operator flow into the
backend secret store; it is not a generic frontend settings field.

`admin.authorize`, imports, revenue mutation, and print reconciliation are
contract reservations until their exact operator-auth/import/reconciliation
schemas pass security and product review. Implementations must return
`METHOD_NOT_ALLOWED` while disabled; no loose `Record<string, unknown>` payload is
permitted.

## 12. Live View binary contract

### 12.1 Control methods

```ts
interface LiveViewSubscribeParams extends MutationContext {
  requested: {
    maxWidth: number;          // <= 1280
    maxHeight: number;         // <= 720
    preferredFps: number;      // 15..30
    jpegQuality: number;       // 75..85
  };
}

interface LiveViewSubscription {
  streamId: Uuid;
  transport: "WINDOWS_NAMED_PIPE_JPEG_V1";
  negotiated: {
    maxWidth: number;
    maxHeight: number;
    targetFps: number;
    jpegQuality: number;
    maxFrameBytes: number;
  };
}

interface LiveViewUnsubscribeParams extends MutationContext { streamId: Uuid }

interface LiveViewStatusEvent {
  streamId?: Uuid;
  status: "STARTING" | "STREAMING" | "STALLED" | "RECONNECTING" |
          "STOPPED" | "FAILED";
  deliveredFps?: number;
  droppedFrames?: number;
  error?: IpcError;
}
```

Methods: `liveView.subscribe` and `liveView.unsubscribe`; event:
`liveView.status`.

### 12.2 Binary frame header

The private named pipe is created per launch/stream with current-user/session ACL
and a random nonce. The shell creates/receives the endpoint through an internal
bootstrap exchange and maps it to `streamId`; the endpoint name/token is never in
the renderer-visible result. The webview never opens a named pipe.

```text
uint32 BE frameLength       # bytes after this field, bounded by negotiation
uint8[4] magic              # "LSLV"
uint8 version               # 1
uint8 flags                 # bit 0 key/latest marker; others must be zero
uint16 BE headerLength      # fixed v1 header bytes
uint64 BE sequence
uint64 BE capturedAtUnixMs
uint32 BE width
uint32 BE height
uint32 BE jpegLength
uint8[jpegLength] jpeg
```

Flow control/lifetime:

- Backend acquisition may request approximately 30 fps as V1 did. Delivery is
  negotiated 20–30 fps; 15 fps is a conditional minimum.
- There is exactly one latest-frame slot per stream at backend/shell boundaries.
  Publishing a new complete frame replaces an unread old one; frames never queue
  unboundedly.
- The renderer asks the shell for the newest frame with at most one outstanding
  request. Binary bytes use an `ArrayBuffer`/object URL; base64 in JSON is banned.
- Capture/full-resolution originals never use this channel. Control messages have
  priority over frame work.
- Frontend must unsubscribe on capture-screen exit, generation change, app
  backgrounding or connection loss. Backend also expires abandoned streams.
- On reconnect, the old `streamId`, internal endpoint token and sequence are
  invalid. The
  frontend gets a fresh snapshot, subscribes anew and discards stale frames.
- A malformed/oversized frame terminates only that stream, emits `liveView.status`
  failed, and does not desynchronize control IPC.

## 13. Method and event registry

```ts
type MethodName =
  | SystemMethod
  | "device.getStatus" | "camera.getCapabilities" | "camera.retryConnection"
  | "liveView.subscribe" | "liveView.unsubscribe"
  | "capture.startSequence" | "capture.getStatus"
  | SessionMethod
  | "processing.request" | "processing.getStatus"
  | "printer.list" | "printer.getCapabilities"
  | "print.confirm" | "print.getStatus" | "operation.cancel"
  | "payment.create" | "payment.verify" | "payment.confirmCash" |
    "payment.cancelPending"
  | "delivery.getStatus" | "delivery.retry"
  | "admin.authorize" | "admin.getSettings" | "admin.updateSettings"
  | "admin.getDiagnostics" | "admin.exportDiagnostics" | "admin.getCatalog"
  | "admin.listLayouts" | "admin.updateLayout"
  | "admin.listFrames" | "admin.importFrame" | "admin.deleteFrame"
  | "admin.listEffects" | "admin.importLut" | "admin.updateEffect"
  | "admin.updateCameraExposure" | "admin.getRevenueDashboard"
  | "admin.adjustRevenue" | "admin.voidRevenue"
  | "admin.reconcilePrint";

type EventName =
  | SystemEvent | "device.statusChanged" | "liveView.status"
  | "capture.progress" | "photo.ready" | "capture.completed"
  | "session.stateChanged" | "session.timeoutChanged"
  | "processing.progress" | "processing.completed"
  | "print.statusChanged" | "payment.statusChanged" |
    "payment.webhookObserved"
  | "upload.statusChanged" | "delivery.progress" | "delivery.ready" |
    "revenue.syncStatusChanged";
```

### 13.1 Method signature matrix

The schema registry must bind every `MethodName` to one exact parameter/result
pair. `SessionMutation` below means `MutationContext`; session and generation are
required except for `session.start`/`session.openAdmin`.

| Method | Params | Result |
|---|---|---|
| `system.hello` | `HelloParams` (shell internal) | `HelloResult` |
| `health.get` | `{}` | `HealthSnapshot` |
| `system.shutdown` | `ShutdownParams` | `ShutdownAccepted` |
| `device.getStatus` | `QueryContext` | `DeviceStatusResult` |
| `camera.getCapabilities` | `QueryContext` | `CameraCapabilitiesResult` |
| `camera.retryConnection` | `MutationContext + operatorGrantId` | `CameraStatus` |
| `liveView.subscribe` | `LiveViewSubscribeParams` | `LiveViewSubscription` |
| `liveView.unsubscribe` | `LiveViewUnsubscribeParams` | `{ unsubscribed: boolean }` |
| `capture.startSequence` | `CaptureStartParams` | `CaptureStartResult` |
| `capture.getStatus` | `{ operationId } + QueryContext` | `CaptureStatusResult` |
| `session.getSnapshot` | `QueryContext` | `SessionSnapshot` |
| `session.start` | `SessionStartParams` | `SessionStartResult` |
| `session.openAdmin` | `MutationContext + operatorGrantId` | `SessionSnapshot` |
| `session.setLayout` | `SetLayoutParams` | `SessionSnapshot` |
| `session.setEffect` | `SetEffectParams` | `SessionSnapshot` |
| `session.confirmSetup` | `SessionMutation` | `SessionSnapshot` |
| `session.setQuantity` | `SetQuantityParams` | `SessionSnapshot` |
| `session.back` | `SessionMutation` | `SessionSnapshot` |
| `session.recordActivity` | `SessionMutation` | `{ accepted: true; deadline?: Instant }` |
| `session.cancel` | `SessionMutation` | `SessionSnapshot` |
| `session.finish` | `SessionMutation` | `SessionSnapshot` |
| `selection.set` | `SetSelectionParams` | `SessionSnapshot` |
| `selection.confirm` | `SessionMutation` | `SessionSnapshot` |
| `frame.list` | `QueryContext` | `FrameOption[]` |
| `frame.select` | `SelectFrameParams` | `FrameSelectResult` |
| `frame.confirm` | `SessionMutation` | `SessionSnapshot` |
| `processing.request` | `ProcessingRequestParams` | `OperationRef` |
| `processing.getStatus` | `{ operationId } + QueryContext` | `ProcessingStatusResult` |
| `printer.list` | `QueryContext` | `PrinterDeviceSummary[]` |
| `printer.getCapabilities` | `{ printerId }` | `PrinterCapabilitiesResult` |
| `print.confirm` | `PrintConfirmParams` | `PrintConfirmResult` |
| `print.getStatus` | `{ operationId } + QueryContext` | `PrintJobSnapshot` |
| `operation.cancel` | `CancelOperationParams` | `CancelOperationResult` |
| `payment.create` | `PaymentCreateParams` | `PaymentCreateResult` |
| `payment.verify` | `PaymentVerifyParams` | `PaymentSnapshot` |
| `payment.confirmCash` | `CashConfirmParams` | `PaymentSnapshot` |
| `payment.cancelPending` | `SessionMutation` | `PaymentSnapshot` |
| `delivery.getStatus` | `QueryContext` | `DeliverySnapshot` |
| `delivery.retry` | `DeliveryRetryParams` | `OperationRef` |
| `admin.authorize` | approved bounded local operator-auth schema | `OperatorGrant` |
| `admin.getSettings` | `operatorGrantId` | `PublicSettings` |
| `admin.updateSettings` | `MutationContext + operatorGrantId + SettingsPatch` | `PublicSettings` |
| `admin.getDiagnostics` | `operatorGrantId` | `DiagnosticsSnapshot` |
| `admin.exportDiagnostics` | `MutationContext + operatorGrantId` | scoped export reference |
| `admin.getCatalog` | `operatorGrantId` | `StudioCatalogResult` |
| `admin.listLayouts` / `admin.listFrames` / `admin.listEffects` | grant + query | typed lists |
| `admin.updateLayout` | grant + mutation + complete validated layout patch | refreshed catalog revision |
| `admin.importFrame` | `FrameImportParams` | imported frame metadata |
| `admin.importLut` | `LutImportParams` | imported effect metadata |
| `admin.deleteFrame` / `admin.updateEffect` | grant + mutation + item revision | refreshed catalog revision |
| `admin.updateCameraExposure` | grant + mutation + `CameraExposurePatch` | `CameraStatus`/capabilities |
| `admin.getRevenueDashboard` | grant + period | `RevenueDashboard` |
| `admin.adjustRevenue` / `admin.voidRevenue` | `RevenueMutationParams` | refreshed `RevenueTransactionSummary` |
| `admin.reconcilePrint` | grant + mutation + operation + observed resolution | `PrintJobSnapshot` |

Importer and operator-auth schemas are explicit product/security freeze gates.
The methods remain disabled until exact bounded schemas and threat review are
approved; they must never fall back to arbitrary paths, plaintext secrets, or an
untyped gesture/password payload.

`session.back` is valid only for the audited mapping (quantity→selection,
payment→quantity with polling cancellation, editing→photo selection, print
pending→editing). It is not generic browser history. Inactivity may cause backend
auto-selection/auto-print with internal `userConfirmed=false`; only explicit
`print.confirm` carries literal `userConfirmed=true`, preserving the audited
no-revenue timeout outcome.

## 14. Idempotency and concurrency rules

1. Every mutation requires `commandId` and `idempotencyKey`. Session-scoped
   mutations after creation require current `sessionId`, `generationId`, and
   `expectedRevision`, except explicitly non-revisioned heartbeat/activity or
   shutdown operations whose exact schemas say otherwise.
2. Before an external payment/print/revenue/upload side effect, backend writes a
   durable `PENDING` operation with canonical parameter hash.
3. Duplicate key + same canonical parameters returns the durable original
   operation/result and `duplicate: true` where useful.
4. Duplicate key + different parameters returns `IDEMPOTENCY_CONFLICT`.
5. A stale revision returns `SESSION_STALE_REVISION` and the current revision (or
   snapshot reference) without a side effect.
6. Events may be lost across process death; snapshots and operation queries are
   recovery truth. Events are not an event-sourced business ledger.
7. Mutations for an old `generationId` are rejected, and late jobs may not update
   a new generation.
8. Payment creation and print confirmation keys survive sidecar restart. Print
   reconciliation, not retry, resolves an uncertain submission boundary.

## 15. Error propagation and recovery examples

| Condition | Error/status | Required caller behavior |
|---|---|---|
| Invalid quantity/schema | `SCHEMA_VALIDATION_FAILED` | Fix input; do not retry unchanged |
| UI acts on old screen | `SESSION_STALE_REVISION` | Fetch/render current snapshot |
| V1/other app owns Canon | `CAMERA_BUSY_EXTERNAL` | Show operator action; do not steal device |
| Canon unplug during stream | camera disconnected + `liveView.status=RECONNECTING` | Clear frame, wait bounded reconnect |
| Hot Folder no stable file | `HOT_FOLDER_TIMEOUT` | Preserve session/source safety; operator retry |
| Beauty > aggregate cap | result `FALLBACK_ORIGINAL/TIMEOUT` | Continue selection with original |
| Configured queue absent | `PRINTER_NOT_FOUND` | Stop before submission; operator fixes queue |
| Crash around spool submit | `PRINT_OUTCOME_UNKNOWN` | Reconcile; never auto-resubmit |
| PayOS network timeout | pending/verify error according to known status | Same-key verify; no frontend paid override |
| Sidecar dies | shell `connection.lost` | Disable mutations/stream; bounded restart |
| Sidecar returns | `connection.recovered` | Fetch snapshot and explicit new stream |

## 16. Security requirements

- Renderer never receives PayOS keys, Cloudinary credentials/preset secrets,
  booth API key, Firebase service account, Neon URL, database credentials,
  launch nonce, native DLL paths or secret values.
- Shell exposes one method per typed renderer action or a generated fixed
  allowlist—not a generic arbitrary JSON-RPC forwarder.
- Renderer cannot submit filesystem paths, executable names, SQL, URLs, printer
  names or model/LUT paths. File import uses shell-issued scoped tokens and backend
  validation.
- Backend credentials live in a V2-only Credential Manager/DPAPI-protected store,
  never V1 `.env`, frontend bundles, command-line arguments or logs.
- Media references are scoped to the current session/generation and allowlisted
  V2 roots. Path traversal and arbitrary file protocols are rejected.
- The protocol is private transport, not authorization for admin actions. Admin
  mutations require a short-lived operator grant.

## 17. Contract test acceptance

Before v1 is frozen:

- every registered method/event has request/result/event schema and at least one
  valid plus invalid golden fixture;
- generated TypeScript compiles under strict mode and generated Kotlin compiles
  with exhaustive sealed-union handling;
- both validators agree on boundary values, optional fields and enum failures;
- mutation fixtures test duplicate-same, duplicate-different, stale revision and
  old generation;
- malformed, deep, oversized and unknown-method frames fail without process
  death or protocol desynchronization;
- no fixture contains a real credential, customer image, production QR, private
  webhook body or V1 path.

This document proposes the complete contract surface. Passing schema or simulator
tests does not validate Canon, DNP, PayOS, Neon, Cloudinary or physical output.
