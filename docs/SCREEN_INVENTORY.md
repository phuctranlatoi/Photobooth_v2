# Screen Inventory & UI Contracts (Photobooth V1)

This document provides a comprehensive audit of all screens, views, dialogs, and components in the legacy V1 application (`E:\HK1_2026_2027\PhotoboothDesktop`), detailing composable entry points, input state dependencies, user touch interactions, navigation transitions, and error/modal states.

---

## 1. Customer Screens Inventory

### 1.1 Start Screen (`StartScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/StartScreen.kt`
- **Composable:** `fun StartScreen(layouts, specialFrames, onSpecialSelected, onStart, onAdmin)`
- **Associated State:** `SessionState.IDLE`
- **Visual Zones:**
  - **Left Hero Zone (40% width):** Brand wordmark "LE SOUVENIR", headline "Chụp ảnh lấy ngay", value props ("In lấy ngay", "Tải ảnh bằng QR"), primary CTA button `CHẠM ĐỂ BẮT ĐẦU`.
  - **Right Event Carousel Zone (60% width):** If `specialFrames` exist, groups frames by event name, shows horizontal sliding cards, filtered layouts matching event, and frame preview.
- **Touch Interactions:**
  - `CHẠM ĐỂ BẮT ĐẦU` (Primary Button): triggers `onStart()` -> advances to `SELECTING`.
  - Title Tapping: 5 consecutive taps on "LE SOUVENIR" triggers `onAdmin()` -> enters `ADMIN`.
  - Special Bundle Card: selects event name, displays matched layout chips.
  - Matched Layout Chip: selects layout and frame -> immediately triggers `onSpecialSelected(frame)` -> advances to `SELECTING_QUANTITY`.
- **Evidence Tag:** `Observed in code`

### 1.2 Studio Mode Screen (`StudioModeScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/StudioModeScreen.kt`
- **Composable:** `fun StudioModeScreen(availableLayouts, selectedLayout, effects, selectedEffect, onChooseLayout, onChooseEffect, onContinue, onBack)`
- **Associated State:** `SessionState.SELECTING`
- **Visual Zones:**
  - **Layout Selection:** Grid of available layouts fetched from Firestore or fallback, displaying title, subtitle, print size badge (`5x15` or `10x15`), shot count, and price.
  - **Color Effect Selection:** Row of filter chips (`Tự nhiên`, `Trắng Đen`, `Cổ điển`, custom LUTs) with color swatch indicators.
  - **Preview & Navigation:** Visual preview of chosen layout grid, back button, and `TIẾP TỤC` CTA button.
- **Touch Interactions:**
  - Layout Card Tap: selects layout via `onChooseLayout(layout.id)`.
  - Effect Chip Tap: selects effect via `onChooseEffect(effect.id)`.
  - `TIẾP TỤC` Button: invokes `onContinue()` -> advances to `SELECTING_QUANTITY`.
  - Back Button: returns to `IDLE`.
- **Evidence Tag:** `Observed in code`

### 1.3 Quantity Screen (`QuantityScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/QuantityScreen.kt`
- **Composable:** `fun QuantityScreen(layout, currentCopies, onCopiesChanged, onConfirm, onBack)`
- **Associated State:** `SessionState.SELECTING_QUANTITY`
- **Visual Zones:**
  - **Left Control Zone:** Quantity stepper (`-` and `+` buttons), total order price display, breakdown of base price and extra copy charges.
  - **Right Preview Zone:** Full rendered `PrintPreview` of the selected layout to reassure guest before payment.
- **Business Rule Constraints:**
  - For `5x15` strips: minimum quantity is 2, stepper increments by 2 (2, 4, 6, 8... up to 50). Odd quantities are forbidden.
  - For `10x15` sheets: minimum quantity is 2, stepper increments by 1 (2, 3, 4, 5... up to 50).
- **Touch Interactions:**
  - Plus / Minus Buttons: updates copy count with bounds checking.
  - `TIẾP TỤC THANH TOÁN` (Primary Button): invokes `onConfirm()` -> advances to `PAYMENT_PENDING`.
  - Back Button: invokes `onBack()` -> returns to `SELECTING`.
- **Evidence Tag:** `Observed in code`

### 1.4 Payment Screen (`PaymentScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/PaymentScreen.kt`
- **Composable:** `fun PaymentScreen(totalPrice, paymentQrData, onPaymentSuccess, onCashPayment, onBack)`
- **Associated State:** `SessionState.PAYMENT_PENDING`
- **Visual Zones:**
  - **QR Payment Box:** Displays dynamically generated PayOS VietQR code via `QrCodeView`.
  - **Payment Instructions:** Banking instructions, order code, transfer amount in Vietnamese Dong.
  - **Status Message:** Live polling indicator ("Đang chờ thanh toán qua ngân hàng...").
  - **Staff Bypass:** Secondary affordance for manual cash receipt confirmation.
- **Touch Interactions:**
  - Auto-advance: PayOS polling background coroutine detects payment -> triggers `onPaymentSuccess()` -> advances to `PREPARING`.
  - `THANH TOÁN TIỀN MẶT` (Cash Override Button): invokes `onCashPayment()` -> advances to `PREPARING`.
  - Back Button: invokes `onBack()` -> cancels polling loop, returns to `SELECTING_QUANTITY`.
- **Evidence Tag:** `Observed in code`

### 1.5 Prepare Screen (`PrepareScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/PrepareScreen.kt`
- **Composable:** `fun PrepareScreen(selectedLayout, selectedEffect)`
- **Associated State:** `SessionState.PREPARING`
- **Behavior:**
  - Non-interactive holding screen displaying a warm message ("Hãy sẵn sàng tạo dáng...").
  - Lasts for exactly 1600ms while the camera service initializes its EVF live view feed.
  - Automatically transitions to `LIVE_VIEW`.
- **Evidence Tag:** `Observed in code`

### 1.6 Capture Screen (`CaptureScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/CaptureScreen.kt`
- **Composable:** `fun CaptureScreen(liveViewStream, countdown, currentShotIndex, totalShots, onManualCapture)`
- **Associated States:** `SessionState.LIVE_VIEW`, `SessionState.COUNTDOWN`, `SessionState.CAPTURING`
- **Visual Zones:**
  - **Full Window Live View:** Live camera EVF feed with active color effect and horizontal mirror flip applied.
  - **Top Progress Badge:** Shows current shot index out of total (e.g. "Ảnh 1 / 6").
  - **Center Countdown Overlay:** Large animated numerical countdown (from `layout.countdownSeconds` down to 1). At 0, flashes white indicator during capture.
  - **Bottom Shutter Control:** Large circular touch shutter button for manual trigger if automated countdown is paused.
- **Loop Execution:**
  - Runs a loop for `1..layout.shotCount`. For each shot:
    1. Enters `COUNTDOWN`: counts down for `layout.countdownSeconds` while streaming live view frames into video buffer.
    2. Enters `CAPTURING`: triggers camera shutter via `SafeShootCommand`, downloads JPEG, spawns async beauty filter and video encoding.
    3. Enters `LIVE_VIEW`: 700ms rest interval before next shot loop begins.
  - After all shots: transitions to `SELECTING_PHOTOS`.
- **Evidence Tag:** `Observed in code`

### 1.7 Photo Selection Screen (`SelectPhotosScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/SelectPhotosScreen.kt`
- **Composable:** `fun SelectPhotosScreen(capturedMoments, selectedMoments, layout, onToggleMoment, onConfirm, inactivitySeconds)`
- **Associated State:** `SessionState.SELECTING_PHOTOS`
- **Visual Zones:**
  - **Left Gallery Grid:** Thumbnails of all captured photos (`layout.shotCount`). Selected photos feature an accent ring and numbered badge.
  - **Right Preview Panel:** Real-time `PrintPreview` showing the selected photos positioned inside the active layout slots.
  - **Top Inactivity Timer:** Countdown showing remaining seconds before auto-advance (`PHOTO_SELECTION_TIMEOUT_SECONDS`, default 90s).
- **Touch Interactions:**
  - Thumbnail Tap: toggles photo selection. Maximum selections strictly enforced to `layout.selectCount`.
  - Thumbnail Long Press (500ms): opens fullscreen high-res lightbox view.
  - `TIẾP TỤC` CTA Button: Enabled ONLY when `selectedMoments.size == layout.selectCount`. Advances to `EDITING`.
- **Evidence Tag:** `Observed in code`

### 1.8 Frame Screen (`FrameScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/FrameScreen.kt`
- **Composable:** `fun FrameScreen(availableFrames, selectedFrame, onChooseFrame, onAddCustomFrame, onConfirm, onBack, inactivitySeconds)`
- **Associated State:** `SessionState.EDITING`
- **Visual Zones:**
  - **Frame Selection Grid:** Cards showing frame previews (Studio Line, Pearl White, Soft Taupe, Special Event frames).
  - **Add Custom Frame Button:** Launches file chooser (`JFileChooser`) to import custom PNG.
  - **Print Preview Panel:** Updates composite preview instantly with chosen frame border.
- **Touch Interactions:**
  - Frame Card Tap: selects frame via `onChooseFrame(frame.id)`.
  - `TIẾP TỤC` CTA Button: advances to `PRINT_PENDING`.
  - Back Button: invokes `onBack()` -> returns to `SELECTING_PHOTOS`.
- **Evidence Tag:** `Observed in code`

### 1.9 Confirm Screen (`ConfirmScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/ConfirmScreen.kt`
- **Composable:** `fun ConfirmScreen(layout, frame, selectedPhotos, printCopies, onConfirm, onBack)`
- **Associated State:** `SessionState.PRINT_PENDING`
- **Visual Zones:**
  - **Order Summary Card:** Layout title, frame title, print size, number of print copies, delivery breakdown.
  - **Full Final Print Preview:** Master preview showing final composition.
  - **Primary Action Button:** `XÁC NHẬN VÀ IN ẢNH` (Confirm & Print).
- **Touch Interactions:**
  - `XÁC NHẬN VÀ IN ẢNH`: invokes `onConfirm()` with `userConfirmed = true` -> advances to `PRINTING`.
  - Back Button: invokes `onBack()` -> returns to `EDITING`.
- **Evidence Tag:** `Observed in code`

### 1.10 Printing Screen (`PrintingScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/PrintingScreen.kt`
- **Composable:** `fun PrintingScreen(statusMessage)`
- **Associated State:** `SessionState.PRINTING`
- **Behavior:**
  - Animated loading spinner with real-time status updates ("Đang khởi tạo Album...", "Đang render ảnh in...", "Đang in ảnh và xử lý nền...").
  - Concurrently dispatches Java Print Service spooling and Cloudinary upload.
  - Once print command is spooled and Cloudinary upload finishes, automatically transitions to `DELIVERY`.
- **Evidence Tag:** `Observed in code`

### 1.11 Delivery Screen (`DeliveryScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/DeliveryScreen.kt`
- **Composable:** `fun DeliveryScreen(exportSummary, onReturnHome)`
- **Associated State:** `SessionState.DELIVERY`
- **Visual Zones:**
  - **Prominent QR Album Code:** High-contrast QR code generated via ZXing pointing to the web album URL (`{webAlbumBaseUrl}/a/{albumId}`).
  - **Print Spooler Status Pill:** Indicates whether printer accepted the job.
  - **Output Summary:** Count of printed photos, uploaded high-res originals, and composite video generation status.
  - **Return Home CTA:** `HOÀN THÀNH / VỀ TRANG CHỦ` button.
- **Touch Interactions:**
  - Return Home Button: invokes `onReturnHome()` -> calls `resetSession()` -> returns to `IDLE`.
- **Evidence Tag:** `Observed in code`

---

## 2. Operator & Admin Screens Inventory

### 2.1 Admin Main Shell (`AdminScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/AdminScreen.kt`
- **Composable:** `fun AdminScreen(...)`
- **Associated State:** `SessionState.ADMIN`
- **Navigation Tabs:**
  - `Khung` (Index 0): Frame management, standard vs special event frames, delete custom frame PNGs.
  - `Bố cục` (Index 1): Layout management, Firestore layout viewer, edit base price, shot count, countdown seconds.
  - `Cài đặt` (Index 2): Hardware & operational settings (`SettingsTabContent`).
  - `Công cụ` (Index 3): Layout calculator & slot detection tool (`CalculatorApp`).
  - `Màu ảnh` (Index 4): Filter & LUT studio editor (`FilterAdminView`).
  - `Doanh thu` (Index 5): Revenue dashboard, daily metrics, and sales ledger (`RevenueScreen`).
- **Touch Interactions:**
  - Tab Switcher: switches active tab index.
  - Back Button: invokes `onBack()` -> calls `saveSettings()` and transitions to `IDLE`.
- **Evidence Tag:** `Observed in code`

### 2.2 Settings Tab (`SettingsTabContent`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/SettingsTabContent.kt`
- **Composable:** `fun SettingsTabContent(...)`
- **Controls & Sections:**
  - **Camera Controls (if Native EDSDK active):** ISO dropdown, Aperture dropdown, Shutter speed dropdown, White Balance dropdown, Picture Style dropdown.
  - **Print Settings:** Windows printer enable/disable switch, display of configured strip/full printer names.
  - **Capture Source:** Hot folder toggle switch, Hot folder filesystem path picker.
  - **Timeouts:** Sliders/steppers for `postCaptureTimeoutSeconds`, `photoSelectionTimeoutSeconds`, `frameSelectionTimeoutSeconds`.
  - **Save Action:** Writes modified parameters back to `.env`.
- **Evidence Tag:** `Observed in code`

### 2.3 Filter & LUT Admin (`FilterAdminView`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/FilterAdminView.kt`
- **Composable:** `fun FilterAdminView(...)`
- **Controls & Sections:**
  - Effect selector list.
  - Sliders for Saturation, Contrast, Brightness, Warmth, Tint.
  - 3D LUT controls: Import `.cube` file button, LUT intensity slider.
  - Live preview canvas showing adjustments applied to test image in real time.
- **Evidence Tag:** `Observed in code`

### 2.4 Revenue Screen (`RevenueScreen`)
- **File:** `src/main/kotlin/com/phuctran/photobooth/desktop/ui/screens/RevenueScreen.kt`
- **Composable:** `fun RevenueScreen(salesRepository, revenueClient, config)`
- **Controls & Sections:**
  - Time range selector: Today, Yesterday, This Week, This Month.
  - Summary metrics: Total Revenue, Total Sessions, Total Printed Sheets, Extra Quantity Revenue.
  - Daily revenue chart points.
  - Transaction ledger: Table of all sales transactions with session ID, print size, total amount, sync status (`PENDING` or `SYNCED`).
  - Transaction Action Dialogs: Adjust actual printed copies, Void sale transaction.
- **Evidence Tag:** `Observed in code`

---

*Evidence Tag: All screen composables, parameters, and touch interactions are **Observed in code** from direct inspection of `src/main/kotlin/.../ui/screens/`.*
