# Session State Machine (Photobooth V1)

This document specifies the complete session lifecycle and state machine of the legacy V1 application (`E:\HK1_2026_2027\PhotoboothDesktop`), with citations to callers, state transition guards, side effects, timeout watchdogs, and revenue gates.

---

## 1. Formal State Definitions (`SessionState`)

- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/domain/SessionStateMachine.kt`
- **Total States:** 17

```kotlin
enum class SessionState {
    IDLE,               // 1. Kiosk welcome screen, idle waiting for guest
    SELECTING,          // 2. Studio Mode: Layout and color filter selection
    SELECTING_QUANTITY, // 3. Print copy quantity selection
    PAYMENT_PENDING,    // 4. PayOS VietQR display and payment status polling
    PREPARING,          // 5. Camera warming up, EVF live view starting (1.6s delay)
    LIVE_VIEW,          // 6. Camera ready, live view streaming to kiosk display
    COUNTDOWN,          // 7. Active countdown for current shot index (3..1s)
    CAPTURING,          // 8. Triggering shutter, downloading JPEG, encoding frame
    SELECTING_PHOTOS,   // 9. Reviewing all shots, picking required layout photos
    EDITING,            // 10. Frame overlay selection
    COMPOSING,          // 11. Internal image/video composition state (transitional)
    PRINT_PENDING,      // 12. Final order checklist & print confirmation
    PRINTING,           // 13. Async rendering, Windows print spooling, Cloudinary upload
    DELIVERY,           // 14. Presenting QR web album code & print completion status
    RECOVERY,           // 15. Inactivity recovery state
    OUT_OF_SERVICE,     // 16. Hardware fault lock state
    ADMIN               // 17. Operator management console
}
```

---

## 2. Full State Transition Diagram & Matrix

```
                        ┌─────────────┐
                        │    IDLE     │◄────────────────────────────────┐
                        └──────┬──────┘                                 │
                               │ onStart()                              │
                               ▼                                        │
                        ┌─────────────┐                                 │
                        │  SELECTING  │                                 │
                        └──────┬──────┘                                 │
                               │ continueToQuantity()                   │
                               ▼                                        │
                   ┌───────────────────────┐                            │
                   │  SELECTING_QUANTITY   │                            │
                   └───────────┬───────────┘                            │
                               │ confirmQuantity()                      │
                               ▼                                        │
                     ┌───────────────────┐                              │
                     │  PAYMENT_PENDING  │                              │
                     └─────────┬─────────┘                              │
                               │ completePayment()                      │
                               ▼                                        │
                        ┌─────────────┐                                 │
                        │  PREPARING  │                                 │
                        └──────┬──────┘                                 │
                               │ 1.6s delay                             │
                               ▼                                        │
       ┌───────────────►┌─────────────┐                                 │
       │                │  LIVE_VIEW  │                                 │
       │                └──────┬──────┘                                 │
       │                       │ startCaptureSequence()                 │
       │                       ▼                                        │
       │                ┌─────────────┐                                 │
       │                │  COUNTDOWN  │                                 │
       │                └──────┬──────┘                                 │
700ms  │                       │ countdown <= 0                         │
rest   │                       ▼                                        │
       │                ┌─────────────┐                                 │
       └────────────────┤  CAPTURING  │                                 │
         (if shots left)└──────┬──────┘                                 │
                               │ (all shots done)                       │
                               ▼                                        │
                    ┌─────────────────────┐                             │
                    │  SELECTING_PHOTOS   │                             │
                    └──────────┬──────────┘                             │
                               │ confirmSelection()                     │
                               ▼                                        │
                        ┌─────────────┐                                 │
                        │   EDITING   │                                 │
                        └──────┬──────┘                                 │
                               │ confirmFrameSelection()                │
                               ▼                                        │
                     ┌───────────────────┐                              │
                     │   PRINT_PENDING   │                              │
                     └─────────┬─────────┘                              │
                               │ startPrinting(userConfirmed=true)      │
                               ▼                                        │
                        ┌─────────────┐                                 │
                        │  PRINTING   │                                 │
                        └──────┬──────┘                                 │
                               │ spooler accepted + album created       │
                               ▼                                        │
                        ┌─────────────┐                                 │
                        │  DELIVERY   │                                 │
                        └──────┬──────┘                                 │
                               │ resetSession()                         │
                               └────────────────────────────────────────┘
```

---

## 3. Detailed Transition Caller & Side-Effect Registry

| # | Source State | Event / Trigger | Target State | Caller / Code Citation | Side Effects & Actions |
|---|---|---|---|---|---|
| 1 | `IDLE` | Guest taps `CHẠM ĐỂ BẮT ĐẦU` | `SELECTING` | `StartScreen.kt:92` -> `controller.onStart()` | Generates new `currentSessionId = UUID.randomUUID()`. Starts fresh session. |
| 2 | `IDLE` | Guest taps special event bundle | `SELECTING_QUANTITY` | `StartScreen.kt:180` -> `controller.selectSpecialBundle()` | Sets `selectedLayout`, sets `selectedFrame`, skips `SELECTING` directly to quantity. |
| 3 | `IDLE` | Operator taps title 5 times | `ADMIN` | `StartScreen.kt:72` -> `controller.onAdmin()` | Transitions to `ADMIN`. Halts customer session inactivity timers. |
| 4 | `SELECTING` | Guest selects layout & effect, taps `TIẾP TỤC` | `SELECTING_QUANTITY` | `StudioModeScreen.kt:120` -> `controller.continueToQuantity()` | Locks in `selectedLayout` and `selectedEffect`. |
| 5 | `SELECTING_QUANTITY` | Guest selects copies, taps `TIẾP TỤC THANH TOÁN` | `PAYMENT_PENDING` | `QuantityScreen.kt:85` -> `controller.confirmQuantity()` | Enforces even quantity for `5x15` strips. Computes total price. Initiates PayOS payment link creation. |
| 6 | `PAYMENT_PENDING` | PayOS polling detects `PAID` status | `PREPARING` | `DesktopBoothController.kt:376` -> `completePayment("QR PayOS")` | Cancels payment polling. Sets `paymentMethod = "QR PayOS"`. Starts camera live view. |
| 7 | `PAYMENT_PENDING` | Staff clicks cash override | `PREPARING` | `PaymentScreen.kt:110` -> `completePayment("Tiền mặt")` | Cancels payment polling. Sets `paymentMethod = "Tiền mặt"`. Starts camera live view. |
| 8 | `PREPARING` | 1600ms timer elapses | `LIVE_VIEW` | `DesktopBoothController.kt:395` | EVF live view is stable and displayed on kiosk screen. |
| 9 | `LIVE_VIEW` | Shutter tapped / Auto sequence | `COUNTDOWN` | `DesktopBoothController.kt:459` | Reads `prepSeconds = layout.countdownSeconds`. Starts background video frame recording loop. |
| 10 | `COUNTDOWN` | Countdown reaches 0 | `CAPTURING` | `DesktopBoothController.kt:507` | Stops video recording. Triggers camera capture via `SafeShootCommand(kEdsSaveTo_Host)`. Spawns async AI beauty job. |
| 11 | `CAPTURING` | Capture done; more shots remain | `LIVE_VIEW` | `DesktopBoothController.kt:567` | Delays 700ms, then advances loop to next shot index and enters `COUNTDOWN`. |
| 12 | `CAPTURING` | Capture done; all shots taken | `SELECTING_PHOTOS` | `DesktopBoothController.kt:593` | Awaits beauty jobs (up to 15s timeout). Stops camera live view. Starts selection inactivity timer. |
| 13 | `SELECTING_PHOTOS` | Exactly `layout.selectCount` photos picked | `EDITING` | `SelectPhotosScreen.kt:95` -> `controller.confirmSelection()` | Refreshes frame list compatible with selected layout. Resets selection timer. |
| 14 | `EDITING` | Frame chosen, taps `TIẾP TỤC` | `PRINT_PENDING` | `FrameScreen.kt:110` -> `controller.confirmFrameSelection()` | Prepares export summary. Advances to confirmation checklist. |
| 15 | `PRINT_PENDING` | Guest clicks `XÁC NHẬN VÀ IN ẢNH` | `PRINTING` | `ConfirmScreen.kt:90` -> `controller.startPrinting(userConfirmed=true)` | Pre-creates web album, renders 600 DPI print canvas, dispatches print job to Windows Print Service, starts Cloudinary upload. |
| 16 | `PRINTING` | Print spooled + Web album created | `DELIVERY` | `DesktopBoothController.kt:853` | Evaluates revenue gate: records local SQLite sale if `userConfirmed && printJob.await()`. Displays QR album. Background encodes master composite video. |
| 17 | `DELIVERY` | Guest taps `VỀ TRANG CHỦ` / Timeout | `IDLE` | `DeliveryScreen.kt:70` -> `controller.resetSession()` | Cancels remaining jobs. Cleans ephemeral session memory. Returns kiosk to `IDLE`. |

---

## 4. Per-Layout Configurable Photo Counts & Countdowns

**CRITICAL INVARIANT:** Capture photo counts AND countdown seconds are **NOT hardcoded** to 6 shots and 5 seconds. They are dynamically driven by the active `LayoutMode` model loaded from Firestore:

- **Source Code Citation:** `src/main/kotlin/.../model/BoothModels.kt` (lines 20–57)
  ```kotlin
  data class LayoutMode(
      val id: String,
      val title: String,
      ...
      val shotCount: Int,           // Independently configurable number of shots taken
      val selectCount: Int,         // Independently configurable number of photos to print
      val countdownSeconds: Int = 3 // Independently configurable seconds per countdown
  )
  ```
- **Execution Citation:** `src/main/kotlin/.../controller/DesktopBoothController.kt` (lines 447–461)
  ```kotlin
  val layout = _selectedLayout.value
  for (index in 1..layout.shotCount) {
      ...
      transitionTo(SessionState.COUNTDOWN)
      val prepSeconds = layout.countdownSeconds
      for (seconds in prepSeconds downTo 1) {
          _countdown.value = seconds
          ...
      }
  }
  ```
- **Operator Edit Citation:** `src/main/kotlin/.../remote/FirebaseManager.kt` (lines 91–113)
  `FirebaseManager.updateLayoutConfig(layoutId, basePrice, shotCount, countdownSeconds)` allows the operator to set any shot count and countdown per layout directly from the Admin console.

---

## 5. Inactivity Watchdogs, Auto-Recovery & Zero-Revenue Safety

### 5.1 Configurable Inactivity Timeouts
- **Configuration Keys:**
  - `PHOTO_SELECTION_TIMEOUT_SECONDS` (Default: 90s)
  - `FRAME_SELECTION_TIMEOUT_SECONDS` (Default: 60s)
  - `POST_CAPTURE_TIMEOUT_SECONDS` (Default: 90s)
- **Watchdog Implementation:** `startInactivityTimer()` launches a 1-second interval coroutine decrementing `_inactivityTimeLeft`.

### 5.2 Auto-Recovery Routine (`handleInactivityTimeout()`)
- **Code Citation:** `src/main/kotlin/.../controller/DesktopBoothController.kt` (lines 291–311)
  1. If guest abandons session during photo selection, automatically picks remaining required photos from the first available captured shots.
  2. If guest has not picked a frame, automatically selects the first available frame.
  3. Triggers printing with `userConfirmed = false`:
     ```kotlin
     startPrinting(userConfirmed = false)
     ```

### 5.3 Strict Revenue Gate (`userConfirmed == true`)
- **Code Citation:** `src/main/kotlin/.../controller/DesktopBoothController.kt` (lines 842–852)
  ```kotlin
  if (userConfirmed && printJob.await() && currentSessionId == sessionId) {
      withContext(Dispatchers.IO) {
          runCatching { salesRepository.recordSale(sale) }
              .onSuccess {
                  scope.launch(Dispatchers.IO) {
                      salesRepository.syncPendingSales(revenueClient, activeConfig.value)
                  }
              }
      }
  }
  ```
- **Accounting Invariant:** If `userConfirmed` is `false` (as in automatic inactivity timeout recovery), **NO REVENUE IS RECORDED** in the SQLite local ledger or Neon database. This prevents false sales and revenue skew when a guest walks away without completing their order.

---

## 6. Backward Navigation (`goBack()`)

- **Code Citation:** `src/main/kotlin/.../controller/DesktopBoothController.kt` (lines 950–962)
  ```kotlin
  fun goBack() {
      when (sessionState.value) {
          SessionState.SELECTING_QUANTITY -> transitionTo(SessionState.SELECTING)
          SessionState.PAYMENT_PENDING -> {
              paymentPollingJob?.cancel()
              paymentPollingJob = null
              transitionTo(SessionState.SELECTING_QUANTITY)
          }
          SessionState.EDITING -> transitionTo(SessionState.SELECTING_PHOTOS)
          SessionState.PRINT_PENDING -> transitionTo(SessionState.EDITING)
          else -> Unit
      }
  }
  ```
- Backward navigation is strictly prohibited during active capture (`COUNTDOWN`, `CAPTURING`), during print spooling (`PRINTING`), or once delivered (`DELIVERY`).

---

## 7. Cancellation & Complete Session Reset (`resetSession()`)

- **Code Citation:** `src/main/kotlin/.../controller/DesktopBoothController.kt` (lines 964–987)
  - Invoked when guest finishes (`DELIVERY`), cancels from early stages, or on kiosk shutdown.
  - Operations performed:
    1. Cancels active AI beauty jobs (`cancelBeautyJobs()`).
    2. Clears frozen pricing snapshot (`frozenPricingSnapshot = null`).
    3. Cancels capture coroutine (`captureJob?.cancel()`).
    4. Cancels delivery background coroutine (`deliveryJob?.cancel()`).
    5. Cancels payment polling loop (`paymentPollingJob?.cancel()`).
    6. Invalidates active session ID (`currentSessionId = null`).
    7. Stops camera EVF live view (`cameraService.stopLiveView()`).
    8. Clears captured moments and selected moments lists.
    9. Resets print copies to default 1.
    10. Restores status message to `"Sẵn sàng."`.
    11. Transitions state to `SessionState.IDLE`.

---

*Evidence Tag: All state transitions, callers, guards, and timeouts are **Observed in code** from direct inspection of `DesktopBoothController.kt` and `SessionStateMachine.kt`.*
