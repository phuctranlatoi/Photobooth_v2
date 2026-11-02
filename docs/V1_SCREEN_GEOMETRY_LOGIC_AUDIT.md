# V1 Screen Geometry & Logic Audit: Capture, Photo Selection, and Frame Selection

**Source Reference (Read-Only):** `E:\HK1_2026_2027\PhotoboothDesktop`  
**Audited Source Files:**
- `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/CaptureScreen.kt`
- `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/SelectPhotosScreen.kt`
- `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/FrameScreen.kt`
- `src/main/kotlin/com/phuctran/photobooth/desktop/ui/components/CoreComponents.kt` (`MomentTile`, `FrameChoice`)
- `src/main/kotlin/com/phuctran/photobooth/desktop/ui/components/PrintPreview.kt`
- `src/main/kotlin/com/phuctran/photobooth/desktop/controller/DesktopBoothController.kt`
- `src/main/kotlin/com/phuctran/photobooth/desktop/Main.kt`

---

## 1. Capture Screen (`CaptureScreen.kt` & `DesktopBoothController.kt`)

### Layout & Live View Geometry
- **Root Container:** `Box(Modifier.fillMaxSize().background(CameraBlack))`
- **Live View Canvas (`CaptureLiveView`):**
  - **Mirrored Stream:** Rendered via `Image(bitmap = currentBitmap, modifier = Modifier.fillMaxSize().graphicsLayer(scaleX = -1f), contentScale = ContentScale.Fit)`. This provides horizontal mirroring (`scaleX(-1)`) replicating a true mirror reflection.
  - **Crop Rectangle Guide (`Canvas`):**
    - Calculates active image bounds (`drawWidth`, `drawHeight`, `xOffset`, `yOffset`) within container bounds (`boxAspect` vs `imageAspect`).
    - Uses layout target aspect ratio: `targetAspect = layout.photoAspectRatio`.
    - Computes crop rectangle dimensions: `cropWidth`, `cropHeight`, `cropLeft`, `cropTop`.
    - Dark dimming mask outside crop guide: 4 surrounding rectangles (Top, Bottom, Left, Right) filled with `Color.Black.copy(alpha = 0.68f)`.
    - Crop guide outline: stroked rectangle with `Color.White.copy(alpha = 0.9f)` and stroke width `3.dp.toPx()`.

### Positioning of Elements
- **Top Center (`Modifier.align(Alignment.TopCenter).padding(top = 34.dp)`):**
  - Rounded capsule pill: `RoundedCornerShape(999.dp)`, background `Color.Black.copy(alpha = 0.42f)`, border `1.dp Color.White.copy(alpha = 0.18f)`, horizontal padding `20.dp`, vertical `10.dp`.
  - Shot counter label: `"Ảnh ${capturedMoments.size}/${layout.shotCount}"` (`FontWeight.Bold`, `subtitle1`, `Color.White`).
  - Video recording indicator: If `isRecordingVideo` is active, displays an 8.dp circle (`AccentRed`) and text `"Đang quay video"`.
- **Bottom Center (`Modifier.align(Alignment.BottomCenter).padding(bottom = 44.dp)`):**
  - Visible only during `SessionState.LIVE_VIEW` or `SessionState.PREPARING`.
  - Shutter button: outer concentric ring (108.dp, border 2.dp White 74%, background White 13%, spring press scale `0.88f` on press) containing inner circle (84.dp, background White 94%, border 2.dp `AccentNude` 80%).
  - Action label below button: Text `"Chạm để chụp"` (`subtitle1`, `FontWeight.Bold`, `Color.White.copy(alpha = 0.86f)`).
  - Tap triggers `onStartCapture` -> `DesktopBoothController.startCaptureFlow()`.
- **Screen Center (`Modifier.align(Alignment.Center)` / `Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.3f)), contentAlignment = Alignment.Center)`):**
  - Active when `countdown > 0`.
  - Giant countdown numeral: `Crossfade(targetState = countdown, animationSpec = tween(200))` rendering `Text(text = count.toString(), fontSize = 240.sp, fontWeight = FontWeight.Black, color = Color.White)`.
  - Drop shadow: `Shadow(color = AccentNude.copy(alpha = 0.8f), blurRadius = 30f)`.
  - Centered exactly at the DEAD CENTER of the screen over the live view.
- **Animated Flash Overlay:**
  - `AnimatedVisibility(visible = state == SessionState.CAPTURING, enter = fadeIn(tween(50)), exit = fadeOut(tween(500)), modifier = Modifier.fillMaxSize())`
  - Solid white flash: `Box(Modifier.fillMaxSize().background(Color.White))`.
- **Architectural Reality:**
  - **V1 DOES NOT HAVE a side rail, side preview strip, or offset countdown.** All UI elements are layered directly across top center, dead center, and bottom center.

---

## 2. Photo Selection Screen (`SelectPhotosScreen.kt` & `DesktopBoothController.kt`)

### Two-Column Split Layout
- **Container:** `Row(Modifier.weight(1f).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(28.dp))`
- **Left Column (`Modifier.weight(1.4f).fillMaxHeight()`):**
  - Header: `SectionHeader("", "Chọn ảnh để in", "Đã chọn ${selectedMoments.size}/${layout.selectCount} ảnh · Album giữ toàn bộ ảnh.")`
  - Secondary hint: `Text("Chạm để chọn · Giữ để xem lớn", style = MaterialTheme.typography.body2, color = NeutralSecondary)`
  - Grid: `LazyVerticalGrid` with `columns = GridCells.Fixed(6)`.
    - Dynamic span per item: `GridItemSpan(if (layout.photoAspectRatio >= 1.1f) 3 else 2)`.
    - Landscape photos (aspect ratio >= 1.1): span 3 -> 2 columns.
    - Portrait photos (aspect ratio < 1.1): span 2 -> 3 columns.
- **Right Column (`Modifier.weight(0.85f).fillMaxHeight()`):**
  - Header: `SectionHeader("", "Bản in đang chọn", "${selectedMoments.size}/${layout.selectCount} ảnh")`
  - Live Composite Preview: `PrintPreview(layout = layout, moments = selectedMoments, frame = FramePack("selection_preview", ...), modifier = Modifier.weight(1f).fillMaxWidth())`.

### Selection & Tap Behavior
- **Tap Action:** Calls `controller.toggleMoment(moment)`.
- **FIFO & Re-indexing:**
  - If photo already selected: removed from `_selectedMoments`.
  - If not selected and quota not reached: appended to `_selectedMoments` (`current.add(moment)`).
  - Selected badge number: `selectedMoments.indexOf(moment) + 1`. Removing an earlier photo immediately re-indexes badges of subsequent photos (e.g., 1, 2, 3 -> removing 1 makes 2 become 1, and 3 become 2).
- **Quota Cap & Dimming:**
  - Hard cap at `layout.selectCount`. Once selected count reaches quota, tapping unselected photos is ignored.
  - Dimming overlay: unselected tiles animate dimming to alpha `0.4f` (`isDimmed = selectedMoments.size >= layout.selectCount && !selectedMoments.contains(moment)`).
  - Selected border: `border(4.dp, AccentNude, RoundedCornerShape(14.dp))` with 38.dp circular badge at top-right corner.
- **CRITICAL UI NOTE:**
  - **V1 HAS NO PLUS SIGN BUTTON (+)** on photo tiles. The user taps the photo directly to toggle selection.

### Long-Press Fullscreen Preview
- **Implementation in `MomentTile` (`CoreComponents.kt`):**
  - Custom `pointerInput(Unit)` with `detectTapGestures`.
  - Inside `onPress`: launches coroutine with `delay(500)`.
  - If held for 500ms, `showedPreview = true` and `onPreview(true)` triggers.
  - When pointer released: `finally` block cancels coroutine and triggers `onPreview(false)` if preview was active.
  - Normal tap (`onTap`): only executes `currentOnClick()` if `!showedPreview` (pointer released before 500ms).
- **Fullscreen Overlay:**
  - In `SelectPhotosScreen.kt`: `AnimatedVisibility(visible = previewingMoment != null, enter = fadeIn(), exit = ExitTransition.None)`.
  - Renders `Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.9f)))` with `Image(bitmap = preview, contentScale = ContentScale.Fit, modifier = Modifier.fillMaxSize().padding(24.dp))`.

### Bottom Bar
- `BottomActionBar`:
  - Primary button: `"Tiếp tục"` (`onPrimary = onConfirm` -> `controller.confirmSelection()`).
  - Primary button enabled state: `primaryEnabled = selectedMoments.size == layout.selectCount`.
  - Secondary button: `"Quay lại"` (`onSecondary = onBack` -> `controller.goBack()`, which is a no-op in `SELECTING_PHOTOS`).

---

## 3. Frame Selection Screen (`FrameScreen.kt` & `DesktopBoothController.kt`)

### Two-Column Split Layout
- **Page Container:** `PremiumPageShell(title = "Chọn khung trang trí", onBack = onBack)`
- **Content Row:** `Row(Modifier.weight(1f).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(28.dp))`
- **Left Column (`Modifier.weight(0.85f).fillMaxHeight()`):**
  - Header: `SectionHeader("", "Bản in xem trước", "${selectedFrame.title} · ${layout.printSizeLabel}")`
  - Composite Preview: `PrintPreview(layout, selectedMoments, selectedFrame, Modifier.weight(1f).fillMaxWidth())`.
    - Renders slots with user's selected photos.
    - Overlay layer: loads and draws the selected frame overlay bitmap (`loadFrameThumbnail(frame.customImagePath)`) over the composite in real-time.
- **Right Column (`Modifier.weight(1f).fillMaxHeight()`):**
  - Frame Selector Grid: `LazyVerticalGrid(columns = GridCells.Fixed(2), horizontalArrangement = Arrangement.spacedBy(14.dp), verticalArrangement = Arrangement.spacedBy(14.dp))`.
  - Frame Card (`FrameChoice`): displays thumbnail, accent border (`Color(frame.accentColor)`), and circular check badge at top-right when `frame.id == selectedFrame.id`.

### Tap & State Behavior
- **Tap Frame:** triggers `onFrameSelected(frame.id)` -> `controller.chooseFrame(frame.id)`.
- **Immediate State Update:**
  ```kotlin
  _availableFrames.value.firstOrNull { it.id == frameId }?.let {
      _selectedFrame.value = it
      _statusMessage.value = "Đã chọn frame ${it.title}."
  }
  ```
  - State update immediately invalidates Compose tree and updates the left `PrintPreview` overlay in real time.

### Bottom Bar & Navigation
- `BottomActionBar("Xem bản in", onConfirm, "Quay lại", onBack)`:
  - Primary button: `"Xem bản in"`, calls `onConfirm` (`controller.confirmFrameSelection()`), which records export summary and transitions state machine to `SessionState.PRINT_PENDING` (Confirm Screen).
  - Secondary button: `"Quay lại"`, calls `onBack` (`controller.goBack()`), which transitions from `SessionState.EDITING` back to `SessionState.SELECTING_PHOTOS`.
