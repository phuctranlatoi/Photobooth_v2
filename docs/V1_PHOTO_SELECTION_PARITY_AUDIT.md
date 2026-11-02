# V1 PHOTO SELECTION & FRAME SELECTION PARITY AUDIT
**Author**: Specialist Legacy Auditor
**Date**: November 2026
**V1 Reference (Read-Only)**: `E:\HK1_2026_2027\PhotoboothDesktop`
**V2 Target Workspace**: `E:\HK1_2026_2027\PhotoboothDesktop_v2`
**Audit Status**: Verified against authoritative source code (Compose Desktop vs React/Tauri + Kotlin Sidecar)

---

## 1. Executive Summary

This document provides a comprehensive, source-backed audit of the **Photo Selection (`SELECTING_PHOTOS`)** and **Frame Selection (`EDITING`)** workflows in legacy V1 (`PhotoboothDesktop`), comparing them against the current V2 (`PhotoboothDesktop_v2`) implementation.

### Key Audit Discoveries
1. **Photo Selection Logic**: In V1, photo selection is strictly an ordered FIFO sequence (tap order determines layout slot assignment 1, 2, ... N). Deselection of any slot shifts and re-indexes all subsequent selections sequentially. When the layout quota (`selectCount`) is reached, unselected tiles are dimmed but remain interactive (allowing hold-to-zoom). In V2, unselected photo buttons are assigned HTML `disabled`, which inadvertently kills pointer events and breaks hold-to-zoom when the quota is reached.
2. **Photo Enlargement (Hold to Zoom)**: V1 uses a 500 ms press-and-hold activation gesture on `MomentTile`. Releasing before 500 ms triggers a tap (selection toggle); holding $\ge 500\text{ ms}$ opens a full-screen high-resolution modal overlay with zero accidental selection upon release. V2 attempts to replicate this in React, but passes low-resolution 240px thumbnails to the modal lightbox instead of high-resolution previews, causing severe pixelation on kiosk touchscreens.
3. **Frame Selection Button Disablement (V2 Bug Root Cause)**: In V1, the Continue button (`BottomActionBar("Xem bản in", ...)`) is **always enabled** (`primaryEnabled = true` by default) because a default frame is pre-selected (`_selectedFrame = allFrames.first()`) upon entering the screen, and heavy 600-DPI composite image generation is deferred until print confirmation. In V2, the Continue button gets stuck disabled due to three compounded issues:
   - Initial state starts with `frameId = null` because V2 engines fail to pre-select `availableFrames().first()` when entering `EDITING`.
   - The React component latches `pending.current.push(f.id)` and disables the button (`pending.current.length > 0`) until `snapshot.frameId` round-trips through backend RPC.
   - The backend runs a heavy, synchronous 600-DPI file-composition pipeline (`compose()`) inside `frame.select` (taking 2–5+ seconds), and if it fails or returns an error (e.g. unknown frame ID or corrupt image), the RPC rejects, `snapshot.frameId` never updates, and the Continue button remains **permanently locked**.
   - Backend `frame.confirm` strictly enforces `if (printImage == null || composition == null) fail(-32001)`, blocking forward transition even if the customer wishes to proceed with the pre-selected layout artwork.

---

## 2. Photo Selection Deep Dive (`SELECTING_PHOTOS`)

### 2.1 Storage, Loading, and Preview Architecture

#### V1 Source Evidence
- **Capture & Storage**:
  - `DesktopBoothController.kt` (lines 549–555, 1180–1205):
    Captured camera stills are saved to disk under `data/sessions/<sessionId>/Photo_<index>.jpg` by `DesktopImageProcessor.saveBoothCapture`.
    Optional Beauty derivatives are computed asynchronously into `data/sessions/<sessionId>/beauty/Photo_<index>_beauty.png` (lines 557–584).
    Each captured shot is stored as a `CapturedMoment` data class:
    ```kotlin
    // com.phuctran.photobooth.desktop.model.BoothModels.kt:33-40
    data class CapturedMoment(
        val index: Int,
        val photoLabel: String,
        val videoLabel: String,
        val photoPath: Path? = null,
        val videoPath: Path? = null
    )
    ```
    Managed in `DesktopBoothController.kt:143-144`:
    ```kotlin
    private val _capturedMoments = MutableStateFlow<List<CapturedMoment>>(emptyList())
    val capturedMoments = _capturedMoments.asStateFlow()
    ```
- **Loading in UI**:
  - `SelectPhotosScreen.kt` (lines 64–83) renders a `LazyVerticalGrid(columns = GridCells.Fixed(6))`.
  - Column spanning logic (line 72):
    `GridItemSpan(if (layout.photoAspectRatio >= 1.1f) 3 else 2)`
    Landscape photos ($\ge 1.1$) span 3 units (2 columns per row); portrait photos span 2 units (3 columns per row).
  - Bitmap loading in `CoreComponents.kt:536`:
    `val bitmap = rememberImageBitmap(moment.photoPath)`
    Uses Compose `produceState` with `loadImageBitmap(it)` running on `Dispatchers.IO` (lines 407–410).
- **Preview on Screen**:
  - `SelectPhotosScreen.kt:88–93` embeds `PrintPreview` on the right side:
    ```kotlin
    PrintPreview(
        layout = layout,
        moments = selectedMoments,
        frame = FramePack("selection_preview", "Le Souvenir", "", layout.accentColor),
        modifier = Modifier.weight(1f).fillMaxWidth()
    )
    ```
    The preview updates reactively as `selectedMoments` changes, rendering selected photos into slots and showing empty numbered placeholders for unfilled slots.

#### V2 Implementation Comparison
- In V2 (`SelectPhotosScreen.tsx:5–45` and `RealSessionEngine.kt:211`):
  - Previews are serialized by the Kotlin backend as Base64 JPEG data URLs (`thumbData(path, 240)`).
  - V2 loads images via `<img src={safeImage(shot.preview)}/>`.
  - Client-side slot layout is rendered in `PrintPreview` (`LayoutArtwork.tsx` / `KioskUI.tsx`).

---

### 2.2 Exact Selection & Deselection Mechanics

#### V1 Source Code: `DesktopBoothController.kt:672–680`
```kotlin
fun toggleMoment(moment: CapturedMoment) {
    val current = _selectedMoments.value.toMutableList()
    if (current.contains(moment)) {
        current.remove(moment)
    } else if (current.size < _selectedLayout.value.selectCount && moment.photoPath != null) {
        current.add(moment)
    }
    _selectedMoments.value = current
}
```

| Behavioral Dimension | V1 Legacy Behavior (`DesktopBoothController.kt`) | V2 Behavior (`RealSessionEngine.kt` / `SelectPhotosScreen.tsx`) | Parity Status |
|---|---|---|---|
| **Selection Type** | **Tap sequence (FIFO ordered list)**. Photos are appended to `_selectedMoments`. Tapping slot in preview does not assign slot. | Ordered index list `selected: number[]`. `selection.toggle` appends index. | **Parity Match** |
| **Selection Order** | Strictly tap sequence. First tapped = Slot 1, Second tapped = Slot 2, etc. | Strictly tap sequence. First tapped = Slot 1, Second tapped = Slot 2, etc. | **Parity Match** |
| **Badge Numbering** | `selectedMoments.indexOf(moment) + 1` (1-based index). Displayed in 38.dp circular badge (`CoreComponents.kt:590–606`). | `order + 1` displayed in `.v1-photo-order` badge (`SelectPhotosScreen.tsx:90`). | **Parity Match** |
| **Quota Cap Enforcement** | `current.size < _selectedLayout.value.selectCount`. When count reaches `selectCount`, tapping any unselected photo is ignored. | Checks `localSelected.length >= layout.selectCount`. Tapping ignored. | **Parity Match** |
| **Deselection & Re-indexing** | `current.remove(moment)`. When photo is removed, all subsequent items shift down by 1. For example, if #1 is deselected, #2 becomes #1, and #3 becomes #2. In `PrintPreview`, slots fill sequentially; slot 3 becomes empty. | `selected.filter(i => i !== index)`. Remaining items shift down and re-index. | **Parity Match** |
| **In-place Replacement** | **No direct replacement**. User cannot tap an unselected photo to replace an existing slot when at capacity. User must deselect first, then select new. | Same: Must deselect first, then select new. | **Parity Match** |
| **Visual Dimming at Quota** | When `selectedMoments.size >= layout.selectCount`, unselected tiles are dimmed (`isDimmed = true`, animated alpha 0.4f, `CoreComponents.kt:539`). **Tile remains clickable/holdable**. | Applies `.v1-photo-dimmed` CSS class. **Sets HTML `disabled` on button**, blocking gestures. | **CRITICAL REGRESSION IN V2** |

#### Continue Button Enabling Rule
- **V1 (`SelectPhotosScreen.kt:101`)**:
  `primaryEnabled = selectedMoments.size == layout.selectCount`
  The button is enabled **only when exactly `layout.selectCount` photos have been selected**.
- **V2 (`SelectPhotosScreen.tsx:112`)**:
  `disabled = busy || pending.current.length > 0 || localSelected.length !== layout?.selectCount`
  Condition matches V1 requirement (`localSelected.length === layout.selectCount`).

---

## 3. Photo Enlargement (Hold to Zoom) Mechanics

### 3.1 V1 Pointer & Gesture Implementation

#### Source Code: `CoreComponents.kt:550–573`
```kotlin
.pointerInput(Unit) {
    var showedPreview = false
    detectTapGestures(
        onPress = {
            showedPreview = false
            coroutineScope {
                val previewJob = launch {
                    delay(500)
                    showedPreview = true
                    currentOnPreview(true)
                }
                try {
                    isPressed = true
                    tryAwaitRelease()
                } finally {
                    isPressed = false
                    previewJob.cancel()
                    if (showedPreview) currentOnPreview(false)
                }
            }
        },
        onTap = { if (!showedPreview) currentOnClick() }
    )
}
```

#### Modal Presentation: `SelectPhotosScreen.kt:108–127`
```kotlin
AnimatedVisibility(
    visible = previewingMoment != null,
    modifier = Modifier.fillMaxSize(),
    enter = fadeIn(),
    exit = ExitTransition.None
) {
    previewingMoment?.let { moment ->
        Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.9f))) {
            val preview = rememberPreviewImageBitmap(moment.photoPath)
            if (preview != null) {
                Image(
                    bitmap = preview,
                    contentDescription = moment.photoLabel,
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxSize().padding(24.dp)
                )
            }
        }
    }
}
```

### 3.2 Gesture Lifecycle Analysis

```
[POINTER DOWN]
      │
      ├─► isPressed = true (Tile scales to 0.98f)
      ├─► Launch coroutine: delay(500ms)
      │
      ├── Released < 500ms (SHORT TAP):
      │         │
      │         ├─► tryAwaitRelease() completes
      │         ├─► finally block: previewJob.cancel()
      │         ├─► showedPreview is FALSE
      │         └─► onTap triggers: currentOnClick() -> toggleMoment()
      │
      └── Held >= 500ms (HOLD TO ZOOM):
                │
                ├─► delay(500ms) completes
                ├─► showedPreview = true
                ├─► currentOnPreview(true) -> Fullscreen overlay opens (fadeIn)
                │
          [POINTER RELEASE]
                │
                ├─► tryAwaitRelease() completes
                ├─► finally block: currentOnPreview(false) -> Overlay closes
                ├─► isPressed = false (Tile scales to 1.0f)
                └─► onTap checks (if (!showedPreview)):
                          Because showedPreview is TRUE, currentOnClick() is SKIPPED!
                          NO ACCIDENTAL SELECTION / DESELECTION!
```

### 3.3 V2 Mismatches in Hold to Zoom

1. **Button Disablement Blocks Hold on Dimmed Photos**:
   - In V2 (`SelectPhotosScreen.tsx:47`):
     ```tsx
     disabled={!safeImage(shot.preview) || (order < 0 && localSelected.length >= (layout?.selectCount ?? Infinity))}
     ```
   - In standard browser DOM, setting `disabled` on a `<button>` stops all pointer events (`pointerdown`, `pointerup`, `pointermove`).
   - Consequently, when the customer has selected 4 of 4 photos, they **cannot hold to zoom any unselected photo** to inspect it before deciding which existing photo to deselect.
   - **V1 Parity Requirement**: Unselected photos must remain interactive for `pointerdown` / `pointerup` (holding to zoom), but simply suppress selection tap.
2. **Preview Resolution Degradation**:
   - In V1, `rememberPreviewImageBitmap(moment.photoPath)` decodes the original capture at full display resolution (1920×1200 / 1280×800) with `ContentScale.Fit`.
   - In V2, `SelectPhotosScreen.tsx:107` renders `shots[lightbox]?.preview`, which is capped at 240px JPEG by `RealSessionEngine.kt:211`:
     ```kotlin
     "preview" to runCatching { thumbData(readyBeauty[index] ?: path, 240) }.getOrDefault("")
     ```
   - When blown up to full screen in the lightbox, the image is severely blurred and artifacted.

---

## 4. Frame Selection & Composition Preview (`EDITING`)

### 4.1 Discovery, Storage & Layout Filtering

#### V1 Source Code: `FrameStore.kt` & `DesktopBoothController.kt:1153–1178`
- **Directory Hierarchy**:
  ```
  data/frames/<printSizeLabel>/<layoutId>/<Standard|Special>/[EventName]/<filename>.png
  ```
  Example: `data/frames/5x15/515_4_anh/Standard/Classic_Frame.png`
  Optional QR coordinate JSON: `Classic_Frame.json` (`qrCodeX`, `qrCodeY`, `qrCodeSize`).
- **Loading & Filtering**:
  ```kotlin
  fun refreshFramesForLayout(layout: LayoutMode, preserveSelection: Boolean = true) {
      val customPacks = frameStore.loadFrames()
          .filter { it.isCustom && it.targetLayoutId == layout.id }
          .sortedWith(
              compareBy(
                  { if (it.targetPrintSize == layout.printSizeLabel || it.targetPrintSize == null) 0 else 1 },
                  { it.targetPrintSize.orEmpty() },
                  { it.title }
              )
          )
      val allFrames = customPacks.ifEmpty {
          listOf(FramePack(
              id = "empty",
              title = "Chưa có khung ảnh",
              description = "Vui lòng vào Cài Đặt -> Tạo Layout/Frame để lưu khung ảnh cho bố cục này.",
              accentColor = 0xFF5F6B7A
          ))
      }
      val previousFrameId = _selectedFrame.value.id
      _availableFrames.value = allFrames
      _selectedFrame.value = if (preserveSelection) {
          allFrames.firstOrNull { it.id == previousFrameId } ?: allFrames.first()
      } else {
          allFrames.first()
      }
  }
  ```
- **Authoritative Invariant**:
  `_selectedFrame` in V1 is **ALWAYS INITIALIZED TO A VALID FRAME** (`allFrames.first()`). It is never `null`.

### 4.2 Tap Frame Behavior in V1

#### Source Code: `DesktopBoothController.kt:691–696`
```kotlin
fun chooseFrame(frameId: String) {
    _availableFrames.value.firstOrNull { it.id == frameId }?.let {
        _selectedFrame.value = it
        _statusMessage.value = "Đã chọn frame ${it.title}."
    }
}
```
- **Instantaneous In-Memory Update**: Updating `_selectedFrame.value` takes 0 milliseconds.
- **No Background Disk I/O**: V1 does not write files, generate high-resolution print images, or invoke `DesktopCompositor.renderFinal` when a frame is tapped.
- **Instant Preview**: `PrintPreview(layout, selectedMoments, selectedFrame, ...)` in `FrameScreen.kt:48` updates reactively in Compose using the pre-cached thumbnails.

### 4.3 Continue Button Enabling Conditions

#### Source Code: `FrameScreen.kt:75` and `CoreComponents.kt:380–387`
```kotlin
// FrameScreen.kt:75
BottomActionBar("Xem bản in", onConfirm, "Quay lại", onBack)

// CoreComponents.kt:380-387
@Composable
fun BottomActionBar(
    primaryText: String,
    onPrimary: () -> Unit,
    secondaryText: String? = null,
    onSecondary: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    primaryEnabled: Boolean = true // <-- DEFAULT IS TRUE!
)
```
- In V1, `primaryEnabled` is **not passed**, so it resolves to `true`.
- The Continue button ("Xem bản in") is **always enabled** from the exact moment the customer arrives on `FrameScreen`.
- Clicking "Xem bản in" executes `confirmFrameSelection()`:
  ```kotlin
  fun confirmFrameSelection() {
      _exportSummary.value = ExportSummary(
          printPhotoCount = _selectedMoments.value.size,
          uploadedPhotoCount = _capturedMoments.value.size,
          uploadedVideoCount = 0
      )
      transitionTo(SessionState.PRINT_PENDING)
  }
  ```
  This immediately transitions the state machine to `PRINT_PENDING` (`ConfirmScreen`).

---

## 5. Root Cause Investigation: Why V2's Continue Button Is Disabled

In V2, customer sessions frequently encounter a disabled "Tiếp tục" button on the Frame Selection screen. Below is the exact technical diagnosis based on comparative audit of V1 vs V2.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 V1 LEGACY PIPELINE                                     │
│                                                                                        │
│  Photo Confirm ──► Enter EDITING ──► Frame #1 Pre-Selected ──► Continue ALWAYS ENABLED │
│                             │                                                          │
│                             └─► Tap Frame ──► Instant In-Memory State ──► 0ms latency  │
│                                                                                        │
│  * Heavy 600-DPI Compositor is DEFERRED to Print Confirmation Screen                   │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 V2 CURRENT PIPELINE                                     │
│                                                                                        │
│  Photo Confirm ──► Enter EDITING ──► frameId is NULL ──► Continue starts DISABLED      │
│                             │                                                          │
│                             ▼                                                          │
│         User clicks frame ──► pending.current.push(f.id) [Button DISABLED]             │
│                             │                                                          │
│                             ▼                                                          │
│         RPC 'frame.select' ──► Server runs synchronous 600-DPI compose() (2-5s)        │
│                             │                                                          │
│                 ┌───────────┴────────────────────────────┐                             │
│                 ▼                                        ▼                             │
│       If compose() SUCCEEDS:                   If compose() FAILS / SLOW:             │
│       - snapshot.frameId updates               - RPC rejects (-32002 or -32602)        │
│       - useEffect clears pending               - snapshot.frameId NEVER updates        │
│       - Button FINALLY enabled                 - pending.current NEVER clears          │
│                                                - Button PERMANENTLY LOCKED DISABLED    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Root Cause 1: Missing Default Frame Pre-Selection
- **V1**: Pre-selects `allFrames.first()` during `confirmSelection()` via `refreshFramesForLayout`.
- **V2**:
  - `SimulatorSessionEngine.kt:210`: `if(before!=selected.toList()) { ... frameId=null }`.
  - `RealSessionEngine.kt:405`: `if (before != selected.toList()) { ... frame = null }`.
  - When transitioning from `SELECTING_PHOTOS` to `EDITING` via `selection.confirm`, neither engine sets a default frame. `frameId` in `snapshot` is `null`.
  - In `FrameScreen.tsx:13`:
    ```tsx
    <KioskPrimaryButton disabled={busy || pending.current.length > 0 || !localFrameId} onClick={() => action('frame.confirm')}>
    ```
    Because `localFrameId` is initially `null`, `!localFrameId` is `true`. The button **starts in a disabled state**.

### 5.2 Root Cause 2: Asynchronous `pending` Latch in `FrameScreen.tsx`
- In `FrameScreen.tsx:13`:
  ```tsx
  const [localFrameId, setLocalFrameId] = useState(frameId);
  const pending = useRef<string[]>([]);
  const previous = useRef(frameId);

  useEffect(() => {
    if (previous.current === frameId) return;
    previous.current = frameId;
    const acknowledged = pending.current.indexOf(frameId ?? '');
    if (acknowledged >= 0) pending.current.splice(0, acknowledged + 1);
    else pending.current = [];
    setLocalFrameId(pending.current.at(-1) ?? frameId);
  }, [frameId]);

  onClick={() => {
    if (localFrameId === f.id) return;
    setLocalFrameId(f.id);
    pending.current.push(f.id);
    action('frame.select', { frameId: f.id });
  }}
  ```
- When a customer taps a frame, `pending.current.push(f.id)` immediately sets `pending.current.length` to 1.
- Because `disabled` checks `pending.current.length > 0`, the Continue button is disabled until `useEffect` runs when `frameId` prop changes.

### 5.3 Root Cause 3: Synchronous Heavy 600-DPI Composition in Backend `frame.select`
- In `RealSessionEngine.kt:409–415`:
  ```kotlin
  "frame.select" -> {
      requireState("EDITING")
      frame = availableFrames().find { it.id == string(p, "frameId") }
          ?: fail(-32602, "Unknown frame")
      try { compose() } catch (_: Exception) { composition = null; printImage = null; fail(-32002, "Composition failed; check original images") }
      snapshot()
  }
  ```
  And in `SimulatorSessionEngine.kt:213`:
  ```kotlin
  "frame.select" -> { guard("EDITING"); if(text(p,"frameId")!="synthetic-border") bad(-32602,"Unknown frame"); frameId="synthetic-border"; compose() }
  ```
- Every single tap on a frame triggers `compose()`:
  - Loads all original full-size photos from disk.
  - Generates 600-DPI composite graphic canvases ($2368 \times 3580$ or $2452 \times 3658$ px).
  - Encodes and writes PNGs to disk (`PrintImageWriter.write`).
  - Verifies written files by decoding them back via `ImageIO.read`.
  - Encodes Base64 JPEG data URLs for preview.
- **Failures & Timeouts**:
  - In `SimulatorSessionEngine.kt`, if the frontend requests any frame other than `"synthetic-border"`, it throws `bad(-32602, "Unknown frame")`.
  - In `RealSessionEngine.kt`, if Beauty processing is still finishing or any photo file is locked, `compose()` throws and `fail(-32002)` is returned.
  - When an error is returned, `refresh()` in the frontend fails, `snapshot.frameId` is **never updated**, `pending.current` is **never cleared**, and the Continue button is **permanently disabled**.

### 5.4 Root Cause 4: Premature Backend Gate in `frame.confirm`
- In `RealSessionEngine.kt:416`:
  ```kotlin
  "frame.confirm" -> { requireState("EDITING"); if (printImage == null || composition == null) fail(-32001, "Complete composition required"); stopInactivity(); state = "PRINT_PENDING"; snapshot() }
  ```
- Even if the UI allowed clicking Continue, `frame.confirm` rejects with `-32001` unless backend composition has already completed successfully.
- In V1, `confirmFrameSelection()` does not require `printImage` or `composition`. It cleanly transitions to `PRINT_PENDING`, allowing the client preview to be reviewed while composition is queued or generated for final printing.

---

## 6. Timer, Navigation & Inactivity Expiry

### 6.1 Timer Configuration & Source of Truth

#### V1 Source Code: `DesktopBoothConfig.kt:29–31, 81–83`
```kotlin
val postCaptureTimeoutSeconds: Int = 90,
val photoSelectionTimeoutSeconds: Int = 90,
val frameSelectionTimeoutSeconds: Int = 60,
```
- Configurable per-kiosk via `.env` (`PHOTO_SELECTION_TIMEOUT_SECONDS`, `FRAME_SELECTION_TIMEOUT_SECONDS`) or Admin Settings.
- Default photo selection timer: **90 seconds**.
- Default frame selection timer: **60 seconds**.
- Default confirm & print timer: **90 seconds**.

#### Authoritative Timer Execution: `DesktopBoothController.kt:245–271`
```kotlin
private fun startInactivityTimer() {
    inactivityJob?.cancel()
    val timerState = stateMachine.currentState.value
    val timeoutSeconds = when (timerState) {
        SessionState.SELECTING_PHOTOS -> (remainingPhotoTime ?: activeConfig.value.photoSelectionTimeoutSeconds).also {
            remainingPhotoTime = it
        }
        SessionState.EDITING -> (remainingFrameTime ?: activeConfig.value.frameSelectionTimeoutSeconds).also {
            remainingFrameTime = it
        }
        else -> activeConfig.value.postCaptureTimeoutSeconds
    }
    _inactivityTimeLeft.value = timeoutSeconds
    inactivityJob = scope.launch {
        for (i in timeoutSeconds downTo 1) {
            delay(1000)
            _inactivityTimeLeft.value = i - 1
            when (timerState) {
                SessionState.SELECTING_PHOTOS -> remainingPhotoTime = i - 1
                SessionState.EDITING -> remainingFrameTime = i - 1
                else -> Unit
            }
        }
        handleInactivityTimeout()
    }
}
```

### 6.2 Forward / Back Navigation Mechanics
- **Timer Persistence**: V1 stores `remainingPhotoTime` and `remainingFrameTime`.
  - If a customer spends 30 seconds on Photo Selection (60s remaining) and moves to Frame Selection, then clicks "Quay lại" (Back), the Photo Selection timer resumes at 60s, rather than resetting to 90s.
  - This prevents infinite session time abuse while ensuring customers are not penalized with an immediate timeout upon backing up.
- **State Cleanup**:
  - Going back from `EDITING` to `SELECTING_PHOTOS` preserves current photo selections (`selectedMoments` is unchanged).
  - Going back from `SELECTING_PHOTOS` to `CAPTURE` is not permitted in V1 customer flow (only cancellation menu or reset).

### 6.3 Timeout Expiry Behavior

#### Source Code: `DesktopBoothController.kt:291–311`
```kotlin
private fun handleInactivityTimeout() {
    // 1. Auto-select remaining photos if needed
    val requiredCount = _selectedLayout.value.selectCount
    var currentSelected = _selectedMoments.value.toMutableList()
    if (currentSelected.size < requiredCount) {
        val available = _capturedMoments.value.filter { it !in currentSelected }
        val needed = requiredCount - currentSelected.size
        currentSelected.addAll(available.take(needed))
        _selectedMoments.value = currentSelected
    }

    // 2. Ensure a frame is selected
    if (_selectedFrame.value.id == "empty") {
        _availableFrames.value.firstOrNull()?.let {
            _selectedFrame.value = it
        }
    }

    // 3. Auto print
    startPrinting(userConfirmed = false)
}
```
- In V1, timeout does **NOT cancel or abort** the session.
- Because the customer has already paid at Step 3 (`PAYMENT_PENDING`), the system protects their purchase by automatically completing photo selection (using first available captures), ensuring a frame is picked, and invoking `startPrinting(userConfirmed = false)`.
- In V2 `RealSessionEngine.kt:232–241`, this logic is partially mirrored:
  ```kotlin
  shots.indices.forEach { if (selected.size < layout.selectCount) selected.add(it) }
  if (frame == null) frame = availableFrames().firstOrNull()
  try { compose() } catch (_: Exception) { composition = null; printImage = null }
  printAccepted = true
  revenueRecorded = false
  state = "DELIVERY"
  ```
  However, in V2 `SimulatorSessionEngine.kt`, timeout recovery is missing or causes recovery state errors if mock parameters mismatch.

---

## 7. Comprehensive Feature Parity Matrix

| Feature / Behavior | V1 Legacy Source Specification | Current V2 Implementation | Parity Status | Severity |
|---|---|---|---|---|
| **Photo Selection Order** | FIFO tap sequence (`current.add(moment)`); 1-based order badge | FIFO tap sequence (`selected.add(i)`); 1-based order badge | ✅ Match | Low |
| **Deselection Re-indexing** | Removing an index shifts remaining items left; badges re-index | Removing an index shifts remaining items left; badges re-index | ✅ Match | Low |
| **Max Photo Cap Interaction** | Unselected items dimmed (`isDimmed = true`); clicks ignored; **pointer events active** | `.v1-photo-dimmed`; sets `disabled` on button; **pointer events blocked** | ❌ Mismatch | **Critical** |
| **Hold-to-Zoom Gesture** | 500ms hold delay; release <500ms = select; release $\ge$500ms = zoom without select | 500ms hold timer; wasHeld flag blocks tap | ⚠️ Partial | **Important** |
| **Hold-to-Zoom on Dimmed Photos** | Customer can hold to zoom unselected photos even when quota is full | **Cannot hold to zoom** because button is HTML `disabled` | ❌ Mismatch | **Critical** |
| **Hold-to-Zoom Resolution** | Loads original capture bitmap with `rememberPreviewImageBitmap` | Loads 240px JPEG thumbnail (`shots[lightbox].preview`), resulting in blur | ❌ Mismatch | **Important** |
| **Default Frame Pre-selection** | Pre-selects `allFrames.first()` upon entering `EDITING`; never null | Initializes with `frame = null`; requires user click | ❌ Mismatch | **Critical** |
| **Frame Continue Button State** | **Always enabled** (`primaryEnabled = true`) | Disabled initially (`!localFrameId`); stuck disabled if RPC pending or fails | ❌ Mismatch | **Critical** |
| **Frame Selection Composition** | Lightweight Compose UI preview; 600-DPI composition deferred to Print | Synchronous 600-DPI composition on every frame click; blocks RPC for 2–5s | ❌ Mismatch | **Critical** |
| **`frame.confirm` Gate** | Unconditional transition to `PRINT_PENDING` | Rejects with `-32001` if `composition == null` | ❌ Mismatch | **Critical** |
| **Photo Selection Countdown** | 90s default (`photoSelectionTimeoutSeconds`); configurable | 90s in `RealSessionEngine`; 60s in simulator | ⚠️ Discrepancy | Medium |
| **Frame Selection Countdown** | 60s default (`frameSelectionTimeoutSeconds`); configurable | 60s in `RealSessionEngine`; 60s in simulator | ✅ Match | Low |
| **Timer Resume on Back** | Preserves elapsed seconds (`remainingPhotoTime`, `remainingFrameTime`) | Restarts full timer budget on navigation | ⚠️ Discrepancy | Medium |
| **Inactivity Auto-Complete** | Fills missing photos, picks frame, triggers auto-print | Fills missing photos, picks frame, moves to `DELIVERY` | ⚠️ Discrepancy | Medium |

---

## 8. Remediation Plan & Regression Test Specifications

### 8.1 Required Frontend Remediations (`frontend/src/screens/`)

1. **Fix `FrameScreen.tsx` Continue Button Enabling**:
   - Do NOT disable the button when a frame is already selected or default is available.
   - Remove the brittle `pending.current.length > 0` condition from `disabled`.
   - Pre-select the first available frame (`frames[0]?.id`) if `frameId` is not yet set:
     ```tsx
     const effectiveFrameId = localFrameId ?? frameId ?? frames[0]?.id;
     ```
   - Change button disabled condition to:
     ```tsx
     disabled={busy || !effectiveFrameId}
     ```
2. **Fix `SelectPhotosScreen.tsx` Pointer Events on Dimmed Photos**:
   - Remove `disabled` attribute from photo selection buttons when `order < 0 && localSelected.length >= layout.selectCount`.
   - Keep only the visual class: `className={order < 0 && isFull ? 'v1-photo-dimmed' : ''}`.
   - In `onClick`, guard against selection:
     ```tsx
     if (wasHeld.current) { wasHeld.current = false; return; }
     if (order < 0 && localSelected.length >= (layout?.selectCount ?? Infinity)) return;
     toggle(i);
     ```
   - This restores the customer's ability to hold-to-zoom on unselected photos when the quota is reached.
3. **High-Resolution Lightbox in `SelectPhotosScreen.tsx`**:
   - Ensure the lightbox displays the full-resolution preview or composition rather than the 240px thumbnail.

### 8.2 Required Backend Remediations (`RealSessionEngine.kt` / `SimulatorSessionEngine.kt`)

1. **Pre-select Default Frame on Entering `EDITING`**:
   - In `selection.confirm`:
     ```kotlin
     "selection.confirm" -> {
         requireState("SELECTING_PHOTOS")
         if (selected.size != layout.selectCount) fail(-32001, "Exact selection required")
         state = "EDITING"
         // Pre-select first frame to match V1 parity
         if (frame == null) {
             frame = availableFrames().firstOrNull()
         }
         startInactivity("EDITING")
         snapshot()
     }
     ```
2. **Decouple Heavy 600-DPI Composition from Interactive Frame Selection**:
   - Avoid synchronous, blocking 600-DPI composite rendering during `frame.select`.
   - Update `frame = chosen` immediately and update client preview; run composite rendering asynchronously or defer to `PRINT_PENDING` / `print.confirm*`.
   - Relax `frame.confirm`: allow transition to `PRINT_PENDING` without requiring `printImage != null`.

### 8.3 Recommended Automated Regression Tests

1. **Test: Photo Quota Hold-to-Zoom**
   - Select maximum allowed photos (e.g. 4 of 4).
   - Assert all unselected photos have `.v1-photo-dimmed`.
   - Assert unselected buttons do NOT have `disabled` attribute.
   - Trigger `pointerdown` on an unselected photo for 500ms; assert lightbox modal opens.
   - Trigger `pointerup`; assert lightbox modal closes and selected indices remain unchanged.
2. **Test: Frame Selection Immediate Continue**
   - Advance to `EDITING` stage.
   - Assert default frame is pre-selected.
   - Assert "Tiếp tục" button is **immediately enabled** without requiring additional clicks.
3. **Test: Frame Click Response & Stability**
   - Advance to `EDITING` stage.
   - Click a different frame option.
   - Assert "Tiếp tục" button remains enabled or becomes enabled within 300ms.
   - Click "Tiếp tục"; assert transition to `PRINT_PENDING` succeeds without `-32001` or `-32002` error codes.

---
*End of Audit Report.*
