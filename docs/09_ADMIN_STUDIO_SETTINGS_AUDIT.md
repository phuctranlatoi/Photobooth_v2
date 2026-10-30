# 09 – Admin & Studio Settings Audit (V1)

## 1. Admin screen UI (Compose)
- File: `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/AdminScreen.kt`
- Presents toggles for system print, hot‑folder usage, camera source selection, timeout values, local server enablement, and QR‑album upload.
- State is bound to `DesktopBoothConfig` via `controller.saveDeviceSettings(...)` (see `Main.kt` line 278) which writes the updated config back to JSON on disk.

## 2. Config contract (source of truth)
- File: `src/main/kotlin/com/phuctran/photobooth/desktop/config/DesktopBoothConfig.kt`
- Data class fields (excerpt):
  ```kotlin
  val enableSystemPrint: Boolean = false
  val useNativeSdk: Boolean = false
  val useHotFolder: Boolean = false
  val hotFolderPath: String = ""
  val postCaptureTimeoutSeconds: Int = 10
  val photoSelectionTimeoutSeconds: Int = 30
  val frameSelectionTimeoutSeconds: Int = 30
  val enableLocalServer: Boolean = false
  val localServerPort: Int = 8080
  // … plus many other flags for beauty, payment, cloud upload, etc.
  ```
- Loaded by `DesktopConfigLoader.load(...)` (not opened but referenced).

## 3. Settings flow (controller side)
- Method: `DesktopBoothController.saveDeviceSettings(...)` (partial read in `Main.kt` line 278 shows call). It updates the `DesktopBoothConfig` instance and persists to file via `DesktopConfigLoader.save(...)` (source not opened).
- After saving, the controller may refresh internal flags (e.g., re‑create cameraService if `useNativeSdk` changed). This logic is present in `DesktopBoothController` (search for `saveDeviceSettings` – not fully opened, but call exists).

## 4. Studio mode UI (layout/effect selection)
- Files: `StudioModeScreen.kt`, `StartScreen.kt`
- Layout filtering uses `specialFrames` and `allStandardFrames` to decide if a layout is special (see `Main.kt` lines 140‑150). The UI shows a grid of layouts; admin can create/edit frames which affect the `FrameStore` (persisted JSON).

## 5. Hidden actions / admin‑only paths
- **Cancel / restart**: Controller listens for inactivity timers (`_inactivityTimeLeft`) and will `transitionTo(SessionState.IDLE)` on timeout (see `DesktopBoothController.kt` lines 102‑105). This is not exposed in UI but is part of the admin safety net.
- **Force app ready**: In the loading fallback UI (Main.kt lines 111‑116) an admin can click *Bỏ qua & Chụp ngay* which calls `controller.forceAppReady()`. The method forces `isAppReady` to true, bypassing configuration load errors.
- **Print enable toggle**: When `enableSystemPrint` is false, the `PrintingScreen` still appears but the actual call to `printerService.printImage` is skipped (see `DesktopBoothController.kt` line 762‑770).

## 6. Evidence collected
- UI composables read via grep (`AdminScreen.kt`, `SettingsTabContent.kt`).
- Config fields read from `DesktopBoothConfig.kt` (opened partially). 
- Controller call to `saveDeviceSettings` observed in `Main.kt`.
- Transition logic and inactivity handling observed in `DesktopBoothController.kt`.

## 7. Gaps / incomplete coverage
- Full source of `DesktopConfigLoader.save` not inspected – need to verify JSON schema and file write path.
- Detailed behaviour of `forceAppReady()` not opened – verify side‑effects.
- Exact validation of timeout values (range checks) not seen – may be in `DesktopBoothConfig` or controller setters.
- UI for *Studio Settings* (frame/effect editor) is in `FilterAdminView.kt` – not fully read; should be audited for any hidden toggles.
- No test coverage for admin settings persistence (search `DesktopBoothConfig` in `src/test` – not found).

**Next steps**: Assign a UI‑audit specialist to fully read `AdminScreen.kt`, `SettingsTabContent.kt`, `FilterAdminView.kt` and the config loader implementation to close the missing evidence gaps.
