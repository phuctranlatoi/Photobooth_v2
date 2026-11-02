# TOUCHSCREEN INTERACTION AUDIT & REDUNDANT-BUTTON DECISION MATRIX
**LE SOUVENIR Photobooth V2 — System Engineering & Kiosk UX Audit**
**Date:** November 2026  
**Auditor Role:** Specialist Legacy-Auditor (Read-Only V1 Source Reference)  
**Legacy Reference (Read-Only):** `E:\HK1_2026_2027\PhotoboothDesktop`  
**Target Workspace:** `E:\HK1_2026_2027\PhotoboothDesktop_v2`

---

## 1. Executive Summary: Touchscreen-First vs Web-Form Interaction Paradigms

### 1.1 The Kiosk Environment
The LE SOUVENIR photobooth is deployed on an unassisted or semi-assisted Windows kiosk featuring a **16:10 landscape touchscreen** (typically 1920×1200 or 1920×1080) mounted at standing height. Customers operate the kiosk standing up, interacting entirely via direct finger touches. There is no physical keyboard, mouse, or cursor. Customers are often in groups, experiencing high excitement, and have low patience for administrative computer interfaces.

### 1.2 The Failure of the "Web-Form" Paradigm
In a traditional web application, users fill out fields or make selections, and must look down to find an explicit "Next", "Submit", or "Continue" button at the bottom of the form. When ported naively to a touchscreen kiosk, this "Web-Form" pattern creates severe UX friction:
1. **Double-Action Fatigue:** A user taps a card or thumbnail on screen, waits, and then must move their hand down to the bottom-right corner to press a redundant "Tiếp tục →" button.
2. **Cognitive Hesitation & Stall:** Customers frequently tap a visual option (such as a frame design or layout card) and expect the system to advance immediately. When nothing happens, they assume the touch was not registered, tap multiple times, or get confused looking for an unobtrusive bottom button.
3. **Reduced Kiosk Throughput:** In high-traffic retail or event environments, every redundant tap and hesitation adds 5–15 seconds per session, directly reducing venue revenue and increasing queue frustration.

### 1.3 The Direct Manipulation & Auto-Advance Paradigm
A true touchscreen kiosk interaction is governed by **Intentional Direct Manipulation**:
- **Single-Touch Transitions:** Tapping a primary selection card or thumbnail should immediately commit the choice and smoothly advance the session state machine without requiring a secondary confirmation button.
- **Strictly Gated Explicit Confirmation:** Explicit "Continue" or "Confirm" buttons must be strictly reserved for actions that:
  1. Involve **financial commitments** (e.g., confirming print quantity and reviewing total VND before generating PayOS payment).
  2. Require **multi-item quota review & reordering** (e.g., selecting photos where the user needs to inspect the composite crop, review multiple chosen photos, and swap or deselect before moving on).
  3. Trigger **irreversible physical / hardware operations** (e.g., final "Confirm & Print", which consumes thermal ribbon/paper and writes transactional revenue to the database).
  4. Perform **destructive cancellations** (e.g., session abort requiring explicit confirmation).

This audit documents every screen in V1 (`PhotoboothDesktop`), establishes an evidence-based decision matrix for removing redundant buttons in V2, formulates the one-tap frame auto-advance model, audits cash/staff payment security, and proves 300 DPI print pipeline parity.

---

## 2. Complete Screen-by-Screen Inventory (V1 Source Inspection)

| Screen Name | V1 Source File & Key Lines | SessionState Transition | UI Trigger / Touch Gesture | Primary Action & Controller Call | Buttons Present & Redundancy Analysis |
|---|---|---|---|---|---|
| **Start / Idle** | `StartScreen.kt`<br>Lines 43–250 | `IDLE` → `SELECTING` or `ADMIN` or `SELECTING_QUANTITY` | • Single tap on primary CTA<br>• 5 taps on wordmark<br>• Tap special bundle card | • `onStart()` → `transitionTo(SessionState.SELECTING)`<br>• 5 taps on "LE SOUVENIR" logo → `transitionTo(SessionState.ADMIN)`<br>• Special Bundle tap: `onSpecialSelected(frame)` → `controller.selectSpecialBundle(frame)` → advances directly to `SELECTING_QUANTITY` | **Legitimate Primary Button:** Giant "CHẠM ĐỂ BẮT ĐẦU" button (`KioskPrimaryButton`). Essential to start unassisted kiosk sessions from attract mode. Event bundles advance directly on item tap. |
| **Studio Mode (Step 1: Layout)** | `StudioModeScreen.kt`<br>Lines 48–63, 107–198 | `SELECTING` (Step 1 → Step 2) | • Horizontal swipe/drag on pager<br>• Single tap on layout card | • Tapping non-centered card scrolls card to center (`pagerState.animateScrollToPage(page)`).<br>• Tapping **centered card** immediately advances: `if (pagerState.currentPage == page) onLayoutSelect(layout)` → sets `selectedLayout`, sets `step = 2`. | **No Bottom Continue Button:** In V1, the centered card itself is the touch target to advance. V2 mistakenly added an `ActionBar > Tiếp tục →` button. |
| **Studio Mode (Step 2: Effect)** | `StudioModeScreen.kt`<br>Lines 65–75, 201–306 | `SELECTING` → `SELECTING_QUANTITY` | • Tap effect chip in bottom dock<br>• Tap primary "TIẾP TỤC" button | • Tap chip: `onEffectSelect(effect.id)` updates live preview.<br>• Tap "TIẾP TỤC": `onConfirm()` → `controller.confirmStudioSetup()` (sets copies = 2, freezes pricing, transitions to `SELECTING_QUANTITY`). | **Legitimate Continue Button:** Selecting filters is an exploratory preview action. Customers try multiple filters on the live video stream before deciding. Explicit "TIẾP TỤC" confirms final choice. |
| **Quantity Selection** | `QuantityScreen.kt`<br>Lines 20–78 | `SELECTING_QUANTITY` → `PAYMENT_PENDING` | • Tap `−` or `+` circular steppers (72.dp)<br>• Tap "Tiếp tục · [VND]" button | • Stepper updates `quantity` state.<br>• Tap primary button: `onQuantitySelected(quantity)` → `controller.setQuantityAndStartPayment(quantity)`. | **Legitimate Confirmation Gate:** Stepping quantity changes price. Auto-advancing on `+` would prevent increasing by more than 1 copy. Explicit tap confirms quantity and total price. |
| **Payment** | `PaymentScreen.kt`<br>Lines 26–148 | `PAYMENT_PENDING` → `PREPARING` | • Automatic PayOS polling (every 3000ms)<br>• Hidden long-press on header title | • Automatic: When PayOS returns paid → `controller.completePayment("QR PayOS")`.<br>• Hidden staff gesture: Long press on title reveals "Nhân viên xác nhận tiền mặt" → `completePayment("Tiền mặt")`. | **No Customer Continue Button:** Customer flow has **zero buttons**. Auto-advances immediately upon payment detection. Cash button is strictly hidden behind staff long-press gesture. |
| **Prepare / Pose Guide** | `PrepareScreen.kt`<br>Lines 24–67 | `PREPARING` → `LIVE_VIEW` | Automated timer delay | • Controller runs `delay(1600)` after payment, then calls `transitionTo(SessionState.LIVE_VIEW)`. | **Zero Buttons:** Pure transitional state showing camera guidelines and pose guide for 1.6s. No user input required. |
| **Capture / Live View** | `CaptureScreen.kt`<br>Lines 32–180 | `LIVE_VIEW` → `COUNTDOWN` → `CAPTURING` → `SELECTING_PHOTOS` | • Single tap on 108.dp circular touch shutter<br>• Sequence runs automatically thereafter | • `onStartCapture` → `controller.startCaptureFlow()`.<br>• Automatically loops `1..layout.shotCount` (countdown → shutter sound/flash → still capture → background video/beauty dispatch → 700ms pause → next shot).<br>• Auto-advances to `SELECTING_PHOTOS` upon completion. | **Legitimate Shutter Button:** Giant touch shutter initiates capture. Once initiated, all subsequent shots, countdowns, and progression to selection run **100% automatically** without intermediate buttons. |
| **Select Photos** | `SelectPhotosScreen.kt`<br>Lines 36–129 | `SELECTING_PHOTOS` → `EDITING` | • Tap photo tile (toggle selection)<br>• Hold photo tile (lightbox preview)<br>• Tap "Tiếp tục" button | • Tap tile: `controller.toggleMoment(moment)`.<br>• Tap "Tiếp tục": `controller.confirmSelection()` → transitions to `EDITING` (`FrameScreen`).<br>• Inactivity timeout: auto-selects missing photos and auto-prints (`handleInactivityTimeout()`). | **Legitimate Review Gate:** When quota is reached (e.g. 4/4), user MUST be allowed to review the composite crop, swap selections, or reorder slots. Auto-advancing the exact millisecond quota is hit would snatch control away. |
| **Frame Selection** | `FrameScreen.kt`<br>Lines 29–83 | `EDITING` → `PRINT_PENDING` | • Tap frame thumbnail<br>• V1 had "Xem bản in" button | • In V1: Tap frame calls `controller.chooseFrame(frame.id)`, then tap "Xem bản in" calls `controller.confirmFrameSelection()`.<br>• In V2 Target: Direct tap on frame selects, renders live preview, and auto-advances to `ConfirmScreen`. | **REDUNDANT BUTTON IN V1 & V2:** The bottom "Xem bản in" / "Tiếp tục →" button is completely redundant. Frame selection is a single choice. Tapping a frame thumbnail clearly expresses the user's intent. |
| **Confirm & Final Preview** | `ConfirmScreen.kt`<br>Lines 17–57 | `PRINT_PENDING` → `PRINTING` | • Single tap on "In và tạo QR"<br>• Single tap on "Quay lại" | • Tap "In và tạo QR": `onPrint()` → `controller.startPrinting(userConfirmed = true)`.<br>• Gates physical print job and transactional revenue recording! | **MANDATORY EXPLICIT BUTTON:** Destructive/financial operation. Submits irreversible print job to DNP RX1HS spooler and logs revenue to database. Must never auto-advance. |
| **Printing Progress** | `PrintingScreen.kt`<br>Lines 23–70 | `PRINTING` → `DELIVERY` | Automated background pipeline | • Compositor renders final PNG with QR → submits print job to spooler → auto-transitions to `DELIVERY` as soon as QR is ready. | **Zero Buttons:** Animated 4-step progress pipeline (Ghép ảnh → In ảnh → Album & QR → Video). Advances automatically. |
| **Delivery / QR Album** | `DeliveryScreen.kt`<br>Lines 23–114 | `DELIVERY` → `IDLE` | • Scan QR on phone<br>• Tap "Hoàn thành · Về trang đầu"<br>• Inactivity timeout | • Tap button: `controller.finishSession()` → resets state machine to `IDLE`. | **Legitimate Finish Button:** Primary button resets kiosk for next customer. Also protected by automated timeout. |
| **Admin & Settings** | `AdminScreen.kt`<br>Lines 47–170 | `ADMIN` → `IDLE` | • Tap tabs (Khung, Bố cục, Cài đặt, Công cụ, Màu ảnh, Doanh thu)<br>• Back button | • Operator tools: adjust prices, shot counts, countdowns, printer toggles, timeouts, cash reconciliation. | **Operator UI:** Back button saves settings and returns to customer `IDLE`. |

---

## 3. Redundant-Button Decision Matrix

This matrix evaluates every screen transition across V1 and V2 to eliminate redundant "web-form" buttons while preserving safety on critical gates.

| Screen | Current V2 Action | V1 Legacy Behavior | Can it be Direct Touch / Auto-Advance? | Requires Explicit Confirmation Gate? | New Touchscreen UX Specification | Verification Test Required |
|---|---|---|---|---|---|---|
| **Start / Attract** | Primary button `CHẠM ĐỂ BẮT ĐẦU →`<br>Special bundle button | Primary button `CHẠM ĐỂ BẮT ĐẦU`<br>Special bundle card tap | **Yes for Bundles; No for General Start.** | **No** (Non-destructive start). | Direct tap on special bundle immediately navigates to Quantity. General start uses large full-width touch button. | Test that tapping an event bundle directly sets layout + frame and enters Quantity. |
| **Studio (Layout)** | Card click scrolls, bottom `Tiếp tục →` button required to advance | Tap non-centered card scrolls; **tap centered card advances immediately** | **YES.** Tapping centered layout card must advance directly. | **No.** Selecting layout is non-destructive. | Eliminate bottom `ActionBar > Tiếp tục →`. Touching the active centered layout card auto-advances to Effect/Filter. | Test that single-tapping centered card advances to Step 2 without needing bottom button. |
| **Studio (Effect)** | Effect chip click updates effect; bottom `Tiếp tục →` advances | Effect chip click updates effect; bottom `TIẾP TỤC` advances | **NO.** Exploratory preview state. | **Yes.** Allows user to test multiple filters on live view. | Keep primary `TIẾP TỤC` button in dock/corner. User tests filters on live stream, then taps to confirm. | Test that tapping effect chips changes live filter without premature state transitions. |
| **Quantity** | Steppers change quantity; bottom `Tiếp tục · [VND] →` advances | Steppers change quantity; bottom `Tiếp tục · [VND]` advances | **NO.** Multi-step calculation with price implications. | **YES (Financial Gate).** Total payment amount changes. | Keep steppers and bottom primary `Tiếp tục · [VND]`. Steppers update total VND in real-time; customer confirms price before QR creation. | Test that tapping `+` increments count and price without advancing until `Tiếp tục` is tapped. |
| **Payment (QR)** | PayOS polling auto-advances; staff cash button exposed on error/timeout | PayOS polling auto-advances; **cash button completely hidden** behind title long-press | **YES for QR.** (Auto-advance on webhook/polling confirmation). | **YES for Cash.** Staff authorization strictly required. | **Remove customer-facing cash button.** QR auto-advances immediately upon payment. Cash button hidden behind staff gesture or PIN modal. | Test auto-advance on payment simulation. Verify cash button is NOT visible to customer during normal QR flow. |
| **Prepare** | Transitional state | Automated 1600ms delay after payment, auto-advances | **YES.** 100% automated timer. | **No.** Pure guidance state. | Zero buttons. Display pose guidance for 1.6s, then auto-advance to Live View. | Test that prepare screen automatically transitions to Live View without touch input. |
| **Capture Sequence** | Giant shutter button initiates; shots run automatically | Giant shutter button initiates; shots run automatically | **YES.** Automated after initial shutter tap. | **No.** Shutter is intentional start trigger. | Customer taps giant 108.dp shutter once. All countdowns, flashes, stills, video records, and advance to Selection happen automatically. | Test that tapping shutter once captures all shots and lands on Photo Selection without further taps. |
| **Select Photos** | Tile tap toggles selection; bottom `Tiếp tục →` advances | Tile tap toggles selection; bottom `Tiếp tục` advances | **NO.** Multi-item selection quota (e.g. 4 of 6). | **YES (Review Gate).** Customer must verify composite crop and order. | Keep bottom `Tiếp tục` button (disabled until exact quota reached). Customer reviews composite placement on right before confirming. | Test that reaching quota enables `Tiếp tục` but does NOT auto-advance until explicitly tapped. |
| **Frame Selection** | Tile tap selects frame; **bottom `Tiếp tục →` button required** | Tile tap selects frame; **bottom `Xem bản in` button required** | **YES! ELIMINATE REDUNDANT BUTTON.** Direct tap on thumbnail must auto-advance. | **No.** Non-destructive visual styling. Final check happens on Confirm screen. | **One-Tap Kiosk Advance:** User taps frame thumbnail → UI highlights selection, updates composite preview, and auto-advances to Confirm screen (~350ms delay). | Test that tapping frame thumbnail selects frame and advances to Confirm screen without any bottom button. |
| **Confirm & Final Preview** | Bottom `Xác nhận & in →` button triggers print | Bottom `In và tạo QR` button triggers print | **NO.** Physical print consumption & revenue recording. | **YES (Destructive / Financial Gate).** Consumes paper/ribbon and books revenue. | **Mandatory explicit confirmation.** Large `In và tạo QR` button. Revenue recording gated ONLY upon verified user tap and print success. | Test that Confirm screen NEVER auto-advances, and revenue is recorded only after verified print acceptance. |
| **Printing** | Transitional state | Automated background rendering & print dispatch | **YES.** 100% automated progress pipeline. | **No.** System is processing. | Zero buttons. Shows visual pipeline progress (Ghép ảnh → In ảnh → Album & QR → Video). Auto-advances when QR is ready. | Test that printing screen transitions to Delivery once pre-album QR is ready. |
| **Delivery / QR** | Bottom `Hoàn thành · Về trang đầu` resets session | Bottom `Hoàn thành · Về trang đầu` resets session | **YES (on timeout); Manual on button.** | **No.** Session completion. | Provide prominent "Hoàn thành" button for fast turnover, backed by inactivity timeout (e.g. 60s) returning to Idle. | Test that tapping button resets session to Idle, and timeout also resets session if customer walks away. |

---

## 4. Deep Analysis: Frame Selection One-Tap Auto-Advance

### 4.1 The Problem in V1 & Current V2
In both V1 (`FrameScreen.kt` lines 68–76) and current V2 (`FrameScreen.tsx` lines 64–90), selecting a frame requires two separate touch actions:
1. Touch the frame card in the grid to highlight it.
2. Look at the bottom of the screen, locate the `Tiếp tục →` / `Xem bản in` button, and touch it.

Because frame selection is a **single-choice selection** (unlike photo selection, which requires picking *N* distinct photos), requiring a second confirmation button is completely redundant. Customers intuitively expect that tapping "Pearl White" or "Studio Line" means "I want this frame, let's see my final photo!"

### 4.2 The Programmatic Pre-selection Trap
When entering `FrameScreen`, the application must display a valid composite preview immediately. To do this, the system programmatically assigns a default frame (either the first available frame in the layout or the last used frame).
- **The Critical Trap:** If the auto-advance logic were implemented naively as a reactive effect (e.g., `useEffect(() => { if (selectedFrame) advance(); }, [selectedFrame])`), the programmatic initialization would immediately fire as soon as the screen mounts!
- **Consequence:** The customer would be catapulted into `ConfirmScreen` without ever seeing or browsing the frame selection screen.
- **Strict Architectural Rule:** Auto-advance must **ONLY** be triggered by an **explicit user touch gesture** (pointer down / click event dispatched by the user on a frame card), **NEVER** by programmatic state initialization or backend prop synchronizations.

### 4.3 Rapid Tap Sequencing, Debounce & Transition Lockout
In retail kiosks, customers often double-tap or rapidly tap several frames in quick succession to compare them or out of impatience. Without defensive state locking, rapid taps introduce critical failure modes:
1. **Multiple Concurrent Transitions:** Tap 1 dispatches transition to `ConfirmScreen`; Tap 2 fires 100ms later while the animation is running, attempting a second transition or mutating state on an unmounted component.
2. **Ghost Clicks on Subsequent Screen:** If a customer double-taps on the bottom-right frame thumbnail, the second tap can pass through (or land on) the primary `In và tạo QR` button of the incoming `ConfirmScreen`, accidentally triggering an irreversible 4x6 print!

#### Required Lockout Architecture (V2 Touch Engine):
```typescript
// Architectural specification for V2 FrameScreen One-Tap Advance:
const isTransitioning = useRef(false);

const handleUserFrameTap = (frameId: string) => {
  // 1. Guard against double-tap or concurrent transition
  if (isTransitioning.current || busy) return;
  
  // 2. Lock transitions immediately
  isTransitioning.current = true;
  
  // 3. Optimistic local UI update: show checkmark and highlight border
  setLocalFrameId(frameId);
  
  // 4. Update preview and dispatch backend selection
  action('frame.select', { frameId });
  
  // 5. Brief visual confirmation delay (300-350ms)
  // Allows customer to see the checkmark snap into place and preview update
  setTimeout(() => {
    action('frame.confirm');
  }, 320);
};

// Reset lock if customer navigates back from ConfirmScreen
useEffect(() => {
  isTransitioning.current = false;
}, []);
```

### 4.4 Error Recovery & Back Navigation
If the customer reaches `ConfirmScreen` and decides they want a different frame:
- The customer taps `Quay lại` (Back) on `ConfirmScreen`.
- The session state machine transitions back to `SessionState.EDITING` (`FrameScreen`).
- `isTransitioning.current` resets to `false`.
- The previously selected frame remains highlighted and previewed.
- The customer taps another frame card, which immediately selects and advances again.
- This creates an ultra-smooth, responsive kiosk browsing loop.

---

## 5. V1 Cash / Staff Payment Authorization Audit & Security Guidance

### 5.1 Legacy Source Audit: How Cash Was Actually Authorized in V1

#### File: `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\ui\screens\PaymentScreen.kt`
- **Lines 36:**
  ```kotlin
  var staffPanelVisible by remember { mutableStateOf(false) }
  ```
- **Lines 40–44:**
  ```kotlin
  // Keep the staff-only long press on the title rather than exposing the override.
  CompactLocalHeader("Bước 3", "Thanh toán", onBack,
      modifier = Modifier.pointerInput(Unit) {
          detectTapGestures(onLongPress = { staffPanelVisible = true })
      })
  ```
- **Lines 131–147:**
  ```kotlin
  if (staffPanelVisible || !isPaymentConfigured || paymentQrData == "ERROR") {
      Row(
          Modifier
              .align(Alignment.BottomCenter)
              .padding(bottom = 26.dp)
              .clip(RoundedCornerShape(KioskControlTokens.floatingCornerRadius))
              .background(NeutralPanel)
              .border(1.dp, NeutralBorder, RoundedCornerShape(KioskControlTokens.floatingCornerRadius))
              .clickable { onPaid() }
              .padding(horizontal = 22.dp, vertical = 12.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp)
      ) {
          Box(Modifier.size(8.dp).clip(CircleShape).background(AccentAmber))
          Text("Nhân viên xác nhận tiền mặt", color = NeutralSecondary, fontWeight = FontWeight.Bold)
      }
  }
  ```

#### File: `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\controller\DesktopBoothController.kt`
- **Lines 362–388:**
  ```kotlin
  paymentMethod = "Tiền mặt"
  transitionTo(SessionState.PAYMENT_PENDING)
  ...
  fun completePayment(method: String = "Tiền mặt") {
      paymentMethod = method
      paymentPollingJob?.cancel()
      paymentPollingJob = null
      scope.launch {
          transitionTo(SessionState.PREPARING)
          cameraService.startLiveView(_selectedEffect.value.id)
          delay(1600)
          transitionTo(SessionState.LIVE_VIEW)
      }
  }
  ```
- **Lines 830–852 (Revenue Gating):**
  ```kotlin
  val sale = SaleTransaction(
      sessionId = sessionId, boothId = config.boothId, layoutId = saleLayout.id,
      layoutTitle = saleLayout.title, printSize = salePricing.printSize,
      quantity = salePricing.quantity, includedQuantity = salePricing.includedQuantity,
      extraQuantity = salePricing.extraQuantity, basePrice = salePricing.basePrice,
      extraUnitPrice = salePricing.extraUnitPrice, extraAmount = salePricing.extraAmount,
      totalAmount = salePricing.totalAmount, paymentMethod = paymentMethod,
      createdAt = System.currentTimeMillis()
  )
  if (userConfirmed && printJob.await() && currentSessionId == sessionId) {
      withContext(Dispatchers.IO) {
          runCatching { salesRepository.recordSale(sale) }
              .onSuccess {
                  scope.launch(Dispatchers.IO) {
                      runCatching { salesRepository.syncPendingSales(revenueClient, activeConfig.value) }
                  }
              }
      }
  }
  ```

### 5.2 Security Findings & V2 Vulnerability Breakdown

1. **How V1 Prevented Customer Bypass:**
   - In a production booth where PayOS was configured and active (`isPaymentConfigured == true` and `paymentQrData != "ERROR"`), `staffPanelVisible` was `false` by default.
   - The button `"Nhân viên xác nhận tiền mặt"` was **completely hidden** from customer view.
   - The customer had **zero touch targets** to bypass payment. They had to scan the VietQR code using their banking app.
   - If a customer wished to pay cash, they had to call the booth operator. The staff member walked to the kiosk and held their finger on the header title "Thanh toán" for >= 1000ms (`onLongPress`). This revealed the floating amber button, which the staff member then tapped after receiving cash.
   - Only in deliberate test/offline modes where PayOS was unconfigured (`!isPaymentConfigured`) was the button shown by default.

2. **The Vulnerability in V2 Milestone Report:**
   - In V2's `frontend/src/screens/PaymentScreen.tsx` (lines 38, 50, 53, 74):
     `const staffVisible = staffPanelVisible || warning || isError;`
     `const isError = linkState === 'ERROR' || ...;`
     `setTimeout(() => setLinkState('ERROR'), 15000);`
     `action('payment.mockComplete', { staffOverride: true });`
   - If link creation was delayed by 15 seconds, or if PayOS was unconfigured, V2 exposed a direct, customer-facing button labeled `"Nhân viên xác nhận tiền mặt"` that dispatched `mockComplete` with `staffOverride: true`!
   - Any customer could walk up, wait 15 seconds (or disconnect the network), tap the cash button, and get free photo prints without paying.

### 5.3 Strict Security Guidance for V2 Implementation
1. **Never Expose Direct Cash Buttons to Customers:**
   - On a public commercial kiosk, a customer-facing direct payment confirmation button is a critical financial leak.
   - Even if PayOS link creation fails or times out, the kiosk must display: `"Không tạo được mã QR. Vui lòng liên hệ nhân viên để được hỗ trợ."` with a "Thử lại" button. It must **NEVER** expose a button that allows the customer to authorize their own payment.
2. **Hidden Staff Gestures & Authentication:**
   - Implement the V1 hidden gesture: Staff must press and hold the screen header for **1000ms** (with touch movement threshold < 12px to prevent swipe false-positives).
   - *Recommended Enterprise Hardening:* When the hidden gesture is triggered, display a **Staff PIN Modal** (4-digit PIN configured in `activeConfig`). Only entering the correct staff PIN unlocks the cash payment confirmation.
3. **Audit Trail & Revenue Attribution:**
   - When cash payment is authorized by staff, the transaction must be explicitly tagged as `paymentMethod = "Tiền mặt"` (or `"CASH_STAFF"`).
   - Mock test bypasses (`payment.mockComplete`) must be restricted to `SIMULATOR` / development builds and completely stripped from production release builds.
   - Transactional revenue must continue to follow V1's ironclad rule: **Only record revenue after user-confirmed print submission succeeds (`userConfirmed && printJob.await()`)**.

---

## 6. 300 DPI Print Pipeline Parity Verification

### 6.1 V1 Source Inspection: `DesktopCompositor.kt`

#### File: `E:\HK1_2026_2027\PhotoboothDesktop\src\main\kotlin\com\phuctran\photobooth\desktop\imaging\DesktopCompositor.kt`
- **Lines 48–58:**
  ```kotlin
  val renderScale = 2 // Render ở 600 DPI thay vì 300 DPI để ảnh cực nét
  val width = when {
      isStrip -> 592 * renderScale
      is15x10 -> 1790 * renderScale
      else -> 1184 * renderScale
  }
  val height = when {
      isStrip -> 1790 * renderScale
      is15x10 -> 1184 * renderScale
      else -> 1790 * renderScale
  }
  ```
- **Lines 110–182:**
  ```kotlin
  val printPath = if (isStrip) {
      val paperWidth = 1226 * renderScale 
      val paperHeight = 1829 * renderScale
      ...
      val paddingTop = 27 * renderScale // shifted up by 12px (1mm) from original 39px
      val paddingLeft = 14 * renderScale
      val gap = 2 * renderScale
      
      val scaledWidth = 592 * renderScale
      val scaledHeight = 1790 * renderScale
      ...
  } else if (is15x10) {
      val paperWidth = 1829 * renderScale
      val paperHeight = 1226 * renderScale
      val paddingLeft = 27 * renderScale
      val paddingTop = 14 * renderScale
      val scaledWidth = 1790 * renderScale
      val scaledHeight = 1184 * renderScale
      ...
  } else {
      val paperWidth = 1226 * renderScale
      val paperHeight = 1829 * renderScale
      val paddingTop = 27 * renderScale
      val paddingLeft = 14 * renderScale
      val scaledWidth = 1184 * renderScale
      val scaledHeight = 1790 * renderScale
      ...
  }
  ```

### 6.2 Hardware Reality: DNP DS-RX1HS Dye-Sublimation Printer
- The **DNP DS-RX1HS** is the standard photo kiosk printer used across LE SOUVENIR booths.
- **Hardware Native Resolution:** Strictly **300×300 DPI** (High-Speed Mode: 12.4s per 4×6) or **300×600 DPI** (High-Quality Mode: head thermal timing doubles horizontal lines, but the input dot matrix expected by the Windows driver is **300 DPI**).
- **Physical Media Dimensions at 300 DPI:**
  - 4×6 inches = `4 × 300` by `6 × 300` = `1200 × 1800` pixels.
  - With standard printer driver full-bleed margins: **1226 × 1829 pixels**.
  - A 2×6 inch photo strip (5×15 cm cut): **592 × 1790 pixels** (leaving 42px top/bottom margin and a 2px cut gap).

### 6.3 Analysis of V1's `renderScale = 2` (The 600 DPI Illusion)
Notice the comment in V1 line 48:
`val renderScale = 2 // Render ở 600 DPI thay vì 300 DPI để ảnh cực nét`
1. The developer in V1 noticed that the base design dimensions (`592×1790`, `1184×1790`, `1226×1829`) were 300 DPI.
2. In an attempt to maximize sharpness, the developer arbitrarily multiplied all coordinates by `2` (`renderScale = 2`), producing images of `2452 × 3658` pixels.
3. **What Actually Happened at Print Time:**
   In `SystemPrinterService.kt` (lines 60–88):
   ```kotlin
   val destWidth = pf.imageableWidth.toInt() // 72 DPI Java points (e.g. 288 points)
   val destHeight = pf.imageableHeight.toInt() // 432 points
   g2d.drawImage(image, 0, 0, destWidth, destHeight, null)
   ```
   Java Print Service scaled the 600 DPI image down to 72 DPI points, and the Windows DNP driver re-rasterized it at **300 DPI** for the physical thermal head!
4. **The Negative Side Effects in V1:**
   - 4× higher memory consumption: Each 2452×3658 ARGB canvas requires **~36 MB of uncompressed heap**, compared to **~9 MB** at native 300 DPI.
   - Slower composition rendering: 4× more pixel rasterization time during a time-sensitive customer session.
   - Double-resampling artifacts: Downsampling a 2× image through Java G2D can cause subtle moiré or softening compared to crisp 1:1 pixel rendering at the printer's native resolution.

### 6.4 Parity Verification Table: 300 DPI Native vs 600 DPI Canvas

| Layout Format | Target Media | V1 Base (300 DPI) | V1 Canvas (`renderScale = 2`) | V2 Native Target (`renderScale = 1`) | DNP RX1HS Hardware Dot Grid | Parity Status & Action |
|---|---|---|---|---|---|---|
| **5×15 cm Strip** | 2×6" cut on 4×6" roll | 592 × 1790 px | 1184 × 3580 px | **592 × 1790 px** | 600 × 1800 dots (media: 592×1790 printable) | **Verified 300 DPI Native.** V2 uses 592×1790 for 1:1 pixel match. |
| **5×15 Duplex Sheet** | 4×6" roll (2-inch cut) | 1226 × 1829 px | 2452 × 3658 px | **1226 × 1829 px** | 1226 × 1829 dots (two 592 strips + 2px gap + margins) | **Verified 300 DPI Native.** Exact match for Windows DNP driver spooler. |
| **10×15 cm Portrait** | 4×6" single sheet | 1184 × 1790 px | 2368 × 3580 px | **1184 × 1790 px** | 1200 × 1800 dots (media: 1184×1790 printable) | **Verified 300 DPI Native.** Paper size: 1226×1829 px. |
| **15×10 cm Landscape**| 6×4" single sheet | 1790 × 1184 px | 3580 × 2368 px | **1790 × 1184 px** | 1800 × 1200 dots (media: 1790×1184 printable) | **Verified 300 DPI Native.** Paper size: 1829×1226 px. |
| **Bleed Margin Top** | Offset Y | 27 px | 54 px | **27 px** | Standard bleed offset (shifted up by 12px / 1mm) | **Verified Parity.** |
| **Bleed Margin Left**| Offset X | 14 px | 28 px | **14 px** | Standard bleed offset | **Verified Parity.** |
| **Strip Cut Gap** | Center Divider | 2 px | 4 px | **2 px** | 2px razor blade cut line gap | **Verified Parity.** |

### 6.5 Conclusion on DPI
V2's compositing pipeline in `E:\HK1_2026_2027\PhotoboothDesktop_v2\backend\src\main\kotlin\com\lesouvenir\v2\imaging\DesktopCompositor.kt` line 48:
`val renderScale = 1 // Native 300 DPI output.`
and `SimulatorCompositor.kt` correctly output native **300 DPI** images. This is the **exact physical dot resolution** of the DNP DS-RX1HS hardware. Using native 300 DPI eliminates redundant scaling, accelerates render times by 4×, and produces the sharpest print output.

---

## 7. Deliverables & Engineering Handoff Summary

1. **Touchscreen Interaction Model:**
   - Eliminate redundant bottom `Tiếp tục` buttons on **Studio Mode Layout Selection** (tapping centered card advances directly).
   - Eliminate redundant bottom `Tiếp tục` button on **Frame Selection** (implement One-Tap Kiosk Advance with 320ms visual confirmation delay and transition lockout).
   - Retain explicit confirmation buttons on: **Studio Mode Effect/Filter Selection**, **Quantity Selection**, **Photo Selection**, and **Confirm & Print**.
2. **Cash / Staff Security:**
   - Completely remove the public cash confirmation button and 15-second automatic fallback.
   - Implement the V1 hidden long-press header gesture (`StaffPaymentPanel`) requiring a 1000ms hold.
   - Provide an optional 4-digit staff PIN gate for commercial deployments.
   - Strictly gate transactional revenue recording on verified user-confirmed print completion.
3. **Print Pipeline DPI:**
   - Confirm that V2 composition outputs are strictly native **300 DPI** (`592×1790` for strips, `1184×1790` for 10×15, `1790×1184` for 15×10, with `1226×1829` paper composite).
   - Retain V1 bleed offsets (`top = 27px`, `left = 14px`, `gap = 2px`) at 300 DPI.

---
*Report compiled and certified by Specialist Legacy-Auditor. All citations inspected directly from V1 source code (`PhotoboothDesktop`). V1 was strictly untouched.*
