# LE SOUVENIR Photobooth V2 — Touchscreen Interaction, Security & Visual Architecture Specification

**Document Version:** 2.0.0  
**Date:** November 2026  
**Author:** Specialist Solutions Architect (V2)  
**Status:** Approved Architectural Blueprint  
**Target Workspace:** `E:\HK1_2026_2027\PhotoboothDesktop_v2`  
**Legacy Reference (Strictly Read-Only):** `E:\HK1_2026_2027\PhotoboothDesktop`

---

## 1. Executive Summary & Kiosk Interaction Philosophy

### 1.1 Physical Touchscreen Kiosk Ergonomics
The LE SOUVENIR Photobooth V2 is deployed on commercial, standing-height Windows kiosks equipped with **16:10 landscape touchscreens** (primary: 1920×1200 WUXGA; compact: 1280×800 WXGA).
Unlike desktop or web applications:
- There is no physical mouse, cursor, or physical keyboard.
- Customers interact standing up, using direct finger taps and swipes.
- Customers frequently operate in social groups with high excitement and low tolerance for multi-step administrative web forms.
- Ambient lighting, finger contact variations, and rapid touch bursts require high-contrast visual feedback and strict gesture debouncing.

### 1.2 Direct Manipulation vs Web-Form Paradigms
A fundamental design flaw identified in early V2 iterations was the retention of the "Web-Form Paradigm" — requiring customers to make a selection and then look down at the bottom-right corner to press an explicit "Tiếp tục →" (Continue) button. This introduced double-action fatigue, hesitation, and reduced kiosk throughput.

This architectural blueprint establishes the **Direct Manipulation & Auto-Advance Paradigm**:
1. **Single-Choice Touch Targets Auto-Advance:** Tapping an unambiguous, single-choice option (such as a decorative frame design or the active centered layout card) commits the selection and advances the session state machine immediately.
2. **Strictly Gated Explicit Confirmation:** Explicit "Continue" or "Confirm" buttons are strictly reserved for:
   - **Multi-item Quota Review:** Selecting *K* of *N* photos (`SelectPhotosScreen`), where customers must inspect slot assignments and crops before proceeding.
   - **Financial Calculations:** Confirming print quantity and pricing totals (`QuantityScreen`).
   - **Irreversible Hardware Actions:** Physical print submission and revenue logging (`ConfirmScreen` / `ConfirmPrintScreen`).
3. **Ironclad Cash Security:** Public customer UI must never expose payment bypass controls. Cash authorization is strictly guarded behind a hidden staff gesture and PIN gate.
4. **Liquid Glass 16:10 Geometry:** Elimination of nested white box wrappers; floating photostrips with realistic drop shadows; responsive scaling with zero vertical scrolling.

---

## 2. Logical Components & Runtime Process Architecture (C4 Model)

### 2.1 C4 Level 1: System Context Diagram

```
+─────────────────────────────────────────────────────────────────────────────+
|                               LE SOUVENIR KIOSK                             |
|                                                                             |
|   +-----------------------+              +------------------------------+   |
|   |   Customer Touch      |              |   Store Staff / Operator     |   |
|   |   (Touch Gestures)    |              |   (Hidden Gesture + PIN)     |   |
|   +-----------+-----------+              +--------------+---------------+   |
|               |                                         |                   |
|               v                                         v                   |
|   +─────────────────────────────────────────────────────────────────────+   |
|   |                LE SOUVENIR V2 PHOTOBOOTH APPLICATION                |   |
|   |   - React 18 + TypeScript + Vite + Tailwind (Touchscreen UI)        |   |
|   |   - Tauri v2 Rust Host (Window shell, sidecar lifecycle, named pipes)|  |
|   |   - Kotlin/JVM Sidecar (State authority, EDSDK, Compositor, Spooler)|  |
|   +───────┬──────────────────────────┬───────────────────────────┬──────+   |
|           |                          |                           |          |
+───────────┼──────────────────────────┼───────────────────────────┼──────────+
            |                          |                           |
            v                          v                           v
  +──────────────────+       +──────────────────+        +──────────────────+
  |  Canon EOS DSLR  |       |   DNP DS-RX1HS   |        |  PayOS / VietQR  |
  |  (USB EDSDK 64b) |       |  (Spooler 300DPI)|        |  (Cloud Gateway) |
  +──────────────────+       +──────────────────+        +──────────────────+
```

### 2.2 C4 Level 2: Runtime Process Tree & IPC Channels

```
[Operating System: Windows 10/11 x64]
  │
  └── PhotoboothDesktop_v2.exe (Tauri v2 Rust Shell, PID Parent)
        │
        ├── Named Pipes & Windows Messages
        │
        ├── msedgewebview2.exe (Chromium Render Process)
        │     └── React 18 Kiosk UI (Touch Engine, Screens, Liquid Glass CSS)
        │           │
        │           └── IPC: window.__TAURI_INTERNALS__.invoke('simulator_request')
        │
        └── javaw.exe (Kotlin/JVM Backend Sidecar, Child PID)
              ├── Stdio Length-Framed JSON-RPC Channel (Bi-directional)
              │     ├── RealSessionEngine / SimulatorSessionEngine (Sole State Authority)
              │     ├── DesktopCompositor (Native 300 DPI Skia/G2D Renderer)
              │     └── SystemPrinterService (Win32 Spooler Dispatcher)
              │
              ├── Canon EDSDK JNA Thread (DSLR Discovery & Capture)
              ├── Beauty Pipeline Worker Pool (ONNX YuNet / BiSeNet)
              └── Inactivity Watchdog Scheduled Executor (25ms Tick)
```

### 2.3 Process Lifetimes & Recovery Bounds
- **Shell-to-Sidecar Supervision:** The Tauri Rust process spawns `javaw.exe` with redirected stdio. If `javaw.exe` terminates unexpectedly (exit code != 0), Tauri catches the broken pipe, marks the bridge as `RECOVERING`, tears down pending IPC promises with `-32000`, and restarts the JVM sidecar within 1500ms.
- **Session State Isolation:** The backend is the **sole state authority**. The frontend is an optimistic, reactive presentation layer. Every critical mutation must be acknowledged by the backend.

---

## 3. One-Tap Frame Selection Architecture

### 3.1 Problem Definition & Remediation
In legacy V1 (`FrameScreen.kt`) and prior V2 (`FrameScreen.tsx`), selecting a decorative frame required two distinct taps:
1. Tap a frame thumbnail in the grid to highlight it.
2. Move arm to bottom-right corner and tap `Tiếp tục →` (`action('frame.confirm')`).

Because frame selection is a **single-choice decision**, the second tap is completely redundant.
**Mandate:** Remove the `ActionBar` and `Tiếp tục →` button from `FrameScreen.tsx`. Tapping any frame thumbnail must immediately select, render live preview, and auto-advance to `PRINT_PENDING` (`ConfirmScreen`).

### 3.2 Programmatic Default vs Explicit Customer Gesture
When entering `EDITING`, the system must show a valid composite preview immediately. To achieve this, the backend and frontend select a default frame (the layout's default or first available frame).

**The Programmatic Auto-Advance Trap:**
If auto-advance were implemented as a naive reactive effect (e.g. `useEffect(() => { if (selectedFrame) advance(); }, [selectedFrame])`), the programmatic initialization would fire the moment the screen mounts, catapulting the user to `ConfirmScreen` without ever letting them browse frames!

**Strict Architectural Rule:**
Auto-advance MUST ONLY be triggered by an **explicit customer pointer gesture** (`onClick` / `onPointerUp` with drag distance < 10px), NEVER by state initialization, backend prop updates, or mounting effects.

### 3.3 Sequence Diagram: One-Tap Frame Advance

```
Customer Touch           FrameScreen (UI)            Tauri / Bridge            Backend Engine
     │                          │                          │                          │
     │ 1. Tap Frame Card(F)     │                          │                          │
     ├─────────────────────────>│                          │                          │
     │                          │ 2. Set Local State       │                          │
     │                          │    - localFrameId = F    │                          │
     │                          │    - active border/check │                          │
     │                          │    - preview overlay = F │                          │
     │                          │ 3. Engage Lockout        │                          │
     │                          │    - isTransitioning=true│                          │
     │                          │                          │                          │
     │                          │ 4. Dispatch frame.select │                          │
     │                          ├─────────────────────────>│ 5. IPC frame.select      │
     │                          │                          ├─────────────────────────>│
     │                          │                          │                          │ 6. Update frame=F
     │                          │                          │                          │    Start composition
     │                          │                          │<─────────────────────────┤
     │                          │<─────────────────────────┤ 7. Snapshot ACK          │
     │                          │                          │                          │
     │                          │ 8. Visual Delay (320ms)  │                          │
     │                          │    (Customer sees check) │                          │
     │                          │                          │                          │
     │                          │ 9. Dispatch frame.confirm│                          │
     │                          ├─────────────────────────>│ 10. IPC frame.confirm    │
     │                          │                          ├─────────────────────────>│
     │                          │                          │                          │ 11. State -> PRINT_PENDING
     │                          │                          │<─────────────────────────┤
     │                          │<─────────────────────────┤ 12. Snapshot (PRINT_PENDING)
     │                          │                          │                          │
     │ 13. Mount ConfirmScreen  │                          │                          │
     │<─────────────────────────┤                          │                          │
```

### 3.4 Lockout & Ghost-Click Protection Architecture

Touchscreens in retail venues are prone to rapid double-taps and touch pass-throughs. Two defense layers are implemented:

#### Layer 1: FrameScreen Transition Lockout (`isTransitioning`)
```typescript
// Component State Model in FrameScreen.tsx
const isTransitioning = useRef(false);
const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleUserFrameTap = (frameId: string) => {
  // Prevent double-tap or concurrent transition
  if (isTransitioning.current || busy) return;
  
  // Synchronous lockout
  isTransitioning.current = true;
  setLocalFrameId(frameId);

  // Send selection to backend immediately
  action('frame.select', { frameId });

  // 320ms visual confirmation delay before auto-advance
  advanceTimer.current = setTimeout(() => {
    action('frame.confirm');
  }, 320);
};

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  };
}, []);
```

#### Layer 2: ConfirmScreen Input Arming Delay (Ghost-Click Neutralizer)
When transitioning from `FrameScreen` to `ConfirmScreen`, a trailing tap from a double-tap gesture could land on the coordinates of the "Xác nhận & in →" button, accidentally firing a 4×6 print.
**Defense:** `ConfirmScreen` implements a mandatory **500ms Input Arming Delay**:
```typescript
// ConfirmScreen.tsx Ghost-Click Armor
const [isArmed, setIsArmed] = useState(false);

useEffect(() => {
  const armTimer = setTimeout(() => setIsArmed(true), 500);
  return () => clearTimeout(armTimer);
}, []);

// Confirm button remains disabled until armed
<KioskPrimaryButton
  disabled={!isArmed || busy || sent.current || !safeImage(composed)}
  onClick={handleConfirmPrint}
>
  {real ? 'Xác nhận & in →' : 'Xác nhận bản mô phỏng →'}
</KioskPrimaryButton>
```

### 3.5 Inactivity Timeout Auto-Advance
If the customer enters `EDITING` and walks away or hesitates:
1. The backend inactivity watchdog checks elapsed time against `frameSelectionTimeoutSeconds` (default: 60s).
2. Upon expiration, the backend:
   - Ensures missing photos (if any) are auto-selected.
   - Assigns default frame if none was confirmed.
   - Invokes `complete(false)` / `composeSafely()`.
   - Transitions `state = "PRINT_PENDING"`.
3. The frontend `DecisionTimerBadge` displays remaining seconds and turns red (`.urgent`) at `<= 15s`.
4. When the state changes to `PRINT_PENDING`, the frontend navigates to `ConfirmScreen` automatically.

### 3.6 Error Recovery & Back Navigation
- **Backend Error during Selection/Confirmation:** If `frame.select` or `frame.confirm` fails (e.g. disk read error, corrupt frame PNG), the frontend catches the rejection, resets `isTransitioning.current = false`, surfaces a floating error toast ("Không thể tải khung ảnh. Vui lòng chọn khung khác."), and remains on `FrameScreen` allowing the customer to tap another frame.
- **Back Navigation:** If the customer taps `Quay lại` on `ConfirmScreen`, the backend dispatches `session.back` returning to `EDITING`. `FrameScreen` mounts with `isTransitioning.current = false`. The previously chosen frame remains highlighted, and customer can tap another frame to auto-advance again.

---

## 4. One-Tap Layout Selection Architecture (Studio Mode Step 1)

### 4.1 Interaction Paradigm in `StudioModeScreen.tsx`
`StudioModeScreen.tsx` presents available layout templates (`515_4_anh`, `1015_4_base`, etc.) using a horizontal snapping carousel (`.v1-layout-carousel`).

In prior V2, selecting a layout centered the card, but required tapping the bottom `ActionBar > Tiếp tục →` to advance.
**Mandate:** Remove the bottom `ActionBar` from `StudioModeScreen.tsx`.

### 4.2 Centered Card Tap Mechanics
The layout selection interaction follows the proven V1 Compose `HorizontalPager` model:
- **Tapping an Off-Center Card (`center !== i`):**
  - Smoothly scrolls the card to the viewport center (`move(i)`).
  - Updates active layout in backend: `action('session.setLayout', { layoutId })`.
  - Scales centered card to `1.0`; adjacent peeking cards scale down to `0.84`.
  - **Does NOT advance.** (Customer is browsing/inspecting options).
- **Tapping the Centered Card (`center === i`):**
  - The card is already active and inspected.
  - Tapping it expresses clear customer intent to proceed.
  - Immediately dispatches `action('session.confirmSetup')`.
  - Advances session state to `SELECTING_QUANTITY`.

```typescript
// StudioModeScreen.tsx Card Click Handler
const handleCardClick = (index: number, layoutId: string) => {
  if (busy || transitioning.current) return;
  
  if (center === index) {
    // Already centered: Commit and Advance
    transitioning.current = true;
    action('session.confirmSetup');
  } else {
    // Off-center: Scroll and Center
    move(index);
  }
};
```

### 4.3 Paging Controls
- Dedicated chevron arrow buttons (`ChevronLeft`, `ChevronRight`) allow tactile single-step scrolling without accidental selection.
- Snapping indicator displays `01 / 04`, layout title, photo count, and print size.

---

## 5. Payment Security & Staff Cash Authorization

### 5.1 Legacy Audit Findings & Security Vulnerability Remediation
In legacy V1 (`PaymentScreen.kt`), the cash confirmation button was **completely invisible** to customers during normal operations. It was only revealed when a staff member performed a hidden **1000ms long-press gesture on the header title**.

In prior V2 (`PaymentScreen.tsx`), lines 53 & 74:
`const staffVisible = staffPanelVisible || warning || isError;`
`setTimeout(() => setLinkState('ERROR'), 15000);`
If PayOS took longer than 15 seconds, or if PayOS was unconfigured, V2 automatically rendered a public button labeled `"Nhân viên xác nhận tiền mặt"`, allowing any customer to tap it and bypass payment!

### 5.2 Strict Security Specifications
1. **Zero Customer Payment Bypasses:**
   The customer-facing payment screen must NEVER render a button that completes payment without verified external proof.
   `staffVisible` MUST strictly equal `staffPanelVisible`. It must **NEVER** evaluate to true due to `warning`, `isError`, or unconfigured state.
2. **Customer Error Presentation:**
   If PayOS fails or times out:
   - Display customer guidance:
     - Icon: Gentle warning badge.
     - Headline: `"Không tạo được mã QR thanh toán"`.
     - Subtitle: `"Vui lòng thanh toán tiền mặt tại quầy hoặc liên hệ nhân viên hỗ trợ."`
   - Actions permitted:
     - `"Thử lại tạo mã QR"` button (re-invokes `payment.createLink`).
     - `"Quay lại"` button (returns to `QuantityScreen`).
   - The cash confirmation button remains strictly HIDDEN.
3. **Hidden Staff Gesture Specification:**
   - **Target:** Header title (`.v1-heading-title` or wordmark).
   - **Gesture:** Continuous press and hold for **>= 1000ms**.
   - **Movement Abort Threshold:** If the pointer moves `> 12px` (Euclidean distance: `Math.hypot(dx, dy) > 12`), the hold timer aborts immediately. This prevents accidental triggers during swiping.
   - **Release Abort:** Any pointer up, cancel, or leave before 1000ms clears the timer.
4. **Staff PIN Modal Gate (Enterprise Hardening):**
   When the 1000ms gesture completes:
   - Pop up a `StaffAuthModal` requiring a 4-digit staff PIN.
   - PIN verified locally against operator settings (`staffPin`, default: `1234`).
   - Only upon valid PIN entry is the `"Xác nhận đã nhận tiền mặt"` button unlocked.
   - Dispatch payload:
     `action('payment.mockComplete', { staffOverride: true, method: 'TIEN_MAT' });`
5. **Revenue Gating:**
   Backend enforces: Transactional revenue is ONLY recorded in SQLite/PostgreSQL upon verified user print submission:
   `if (userConfirmed && printJob.await()) { recordSale(...) }`

---

## 6. UI Visual Design Architecture (Liquid Glass & 16:10 Geometry)

### 6.1 Liquidation of "White Box Wrappers"
A critical critique of earlier UI was the clutter of nested rectangular white cards around previews.
- **In `PrintPreview`, `FrameScreen`, `SelectPhotosScreen`, and `LayoutArtwork`:**
  - Remove outer `background: white;`, `border: 1px solid var(--v-border);`, and `box-shadow` from container wrappers (`.v1-preview`, `.v1-preview-empty`).
  - Containers must be completely transparent (`background: transparent; border: 0; padding: 0; box-shadow: none;`).
- **Floating Photostrip Canvas:**
  - The photostrip or postcard itself is the photographic paper artifact.
  - It floats directly over the subtle studio backdrop (`--k-bg-gradient`).
  - Layered realistic drop shadow applied directly to the SVG or composite image:
    ```css
    filter: drop-shadow(0 20px 32px rgba(45, 30, 20, 0.16)) 
            drop-shadow(0 4px 8px rgba(45, 30, 20, 0.08));
    ```

### 6.2 Liquid Glass Design Tokens & Surfaces
The design system adopts a warm Korean photo atelier aesthetic (warm ivory backdrops, blush pink card highlights, terracotta coral accents, and warm charcoal typography).

```css
:root {
  /* Atelier Surfaces */
  --k-bg-ivory: #FAF6F0;
  --k-bg-gradient: radial-gradient(circle at 10% 10%, #FFFDF9, transparent 60%),
                   radial-gradient(circle at 90% 90%, #F5ECE3, transparent 50%),
                   #FAF6F0;
  
  /* Liquid Glass Panels */
  --k-glass-bg: rgba(255, 255, 255, 0.72);
  --k-glass-border: rgba(255, 255, 255, 0.65);
  --k-glass-blur: blur(16px);
  --k-glass-shadow: 0 12px 36px rgba(60, 45, 35, 0.08);

  /* Primary Accent (Terracotta Coral) */
  --k-coral: #E07A5F;
  --k-coral-hover: #D46A4E;
  --k-coral-active: #B8553A;
  
  /* Typography */
  --k-text-headline: #232120;
  --k-text-body: #544E4B;
  --k-text-muted: #8C847E;
}
```

### 6.3 Responsive 16:10 Kiosk Geometry & Zero-Scroll Budget

#### Target Display Profiles
1. **Flagship 16:10 Display:** 1920 × 1200 (WUXGA)
2. **Compact 16:10 Countertop:** 1280 × 800 (WXGA)
3. **Compatible 16:9 Display:** 1920 × 1080 (FHD)

#### Height Budget Calculation (Zero Vertical Scroll Guarantee)
All interactive elements, previews, and grids MUST fit comfortably within the viewport height without page scrollbars.

| Element | 1280 × 800 Viewport | 1920 × 1200 Viewport | Behavior |
|---|---|---|---|
| **Top Shell Padding** | 16 px | 24 px | Fixed |
| **AppHeader (`Heading`)** | 68 px | 88 px | Fixed height, title + step |
| **Spacing / Gap** | 16 px | 20 px | Flex gap |
| **Content Stage (`v1-split`)** | **604 px** | **948 px** | Maximized stage height |
| **Bottom ActionBar (when present)**| 72 px | 88 px | Sticky dock, 0px bottom |
| **Bottom Shell Padding** | 16 px | 24 px | Fixed |
| **Total Viewport Height** | **800 px (100%)** | **1200 px (100%)** | **Zero page scroll** |

#### Split Workspace Sizing
- **Left Stage (Preview Canvas):**
  - 5×15 cm Strip (Aspect Ratio 1:3 / 0.33):
    - Height: `min(72vh, 560px)` on 800h; `min(76vh, 880px)` on 1200h.
    - Width: auto (`aspect-ratio: 1 / 3`).
    - Horizontally centered within the left column.
  - 10×15 cm Postcard (Aspect Ratio 2:3 / 0.66):
    - Height: `min(68vh, 520px)` on 800h; `min(72vh, 820px)` on 1200h.
    - Width: auto (`aspect-ratio: 2 / 3`).
- **Right Stage (Controls & Grids):**
  - Displays selection cards in a fluid grid (`grid-template-columns: repeat(auto-fit, minmax(130px, 1fr))`).
  - Internal grid scrollbar enabled if frame collection exceeds stage height, but main window remains strictly non-scrollable.

### 6.4 Modern Studio Workspace for Operator Settings & Tools
The administrative tabs (`AdminScreen.tsx`, `V1Settings.tsx`, `Operator.tsx`) are updated with the Studio Workspace Theme:
- Dark graphite backdrop (`#1A1918`) with crisp ivory typography.
- Terracotta accents for active switches and tabs.
- Large tactile sliders, steppers, and inputs designed for fingertip calibration.

---

## 7. 300 DPI Native Print Compositing Parity Verification

### 7.1 DNP DS-RX1HS Hardware Dot Grid
The DNP DS-RX1HS dye-sublimation printer features a thermal line head with a physical density of **300 DPI** (300 dots per inch).
- At 300 DPI, physical media sizes translate directly:
  - 4×6 inches = `4 × 300` × `6 × 300` = `1200 × 1800` dots.
  - With manufacturer full-bleed overprint margins: **1226 × 1829 pixels**.
  - A 2×6 inch photo strip (5×15 cm cut): **592 × 1790 pixels** (accounting for razor blade margin and center cut line).

### 7.2 Post-Mortem: V1's `renderScale = 2` Illusion
In legacy V1 (`DesktopCompositor.kt` line 48):
`val renderScale = 2 // Render ở 600 DPI thay vì 300 DPI để ảnh cực nét`
V1 rasterized images at 2452×3658 pixels. However:
1. `SystemPrinterService.kt` converted coordinates to 72 DPI Java points.
2. The Windows DNP print driver re-sampled the image down to **300 DPI** to match the physical thermal head.
3. This 600 DPI rendering caused:
   - 4× heap memory consumption (~36 MB uncompressed ARGB buffer per print sheet).
   - 4× longer Skia/G2D rendering latency.
   - Moire and blur artifacts from redundant downsampling.

### 7.3 V2 Native 300 DPI Parity Specifications
V2 compositing (`DesktopCompositor.kt` line 48: `val renderScale = 1`) matches native 300 DPI hardware grid 1:1:

| Media / Layout | Native 300 DPI Resolution | Bleed Offsets (300 DPI) | Hardware Result |
|---|---|---|---|
| **5×15 cm Strip** | 592 × 1790 px | Top: 27 px, Left: 14 px, Gap: 2 px | 1:1 Pixel Match, Sharpest Thermal Edge |
| **5×15 cm Duplex Sheet**| 1226 × 1829 px | Dual 592 strips + 2px razor cut gap | Perfectly formatted for DNP 2-inch cut mode |
| **10×15 cm Postcard** | 1184 × 1790 px | Top: 27 px, Left: 14 px | Full bleed 4×6 single sheet |
| **15×10 cm Landscape**| 1790 × 1184 px | Top: 14 px, Left: 27 px | Full bleed 6×4 landscape sheet |

---

## 8. IPC Contract Specification & Message Schema

### 8.1 Method Definitions

#### `frame.select`
- **Direction:** Frontend → Backend
- **State Constraint:** Allowed only in `EDITING`
- **Request Payload:**
  ```json
  {
    "protocolVersion": "2.0.0",
    "method": "frame.select",
    "params": {
      "sessionId": "b8f60b6b-3652-4467-9c9c-51b75fb04b90",
      "generationId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "commandId": "550e8400-e29b-41d4-a716-446655440000",
      "frameId": "frame_classic_white"
    }
  }
  ```
- **Backend Behavior:** Updates session frame reference, dispatches background composition rendering, resets inactivity timer.
- **Response:** Current session snapshot with `frameId` updated.

#### `frame.confirm` (Atomic Advance)
- **Direction:** Frontend → Backend
- **State Constraint:** Allowed only in `EDITING`
- **Transition To:** `PRINT_PENDING`
- **Request Payload:**
  ```json
  {
    "protocolVersion": "2.0.0",
    "method": "frame.confirm",
    "params": {
      "sessionId": "b8f60b6b-3652-4467-9c9c-51b75fb04b90",
      "generationId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "commandId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "frameId": "frame_classic_white"
    }
  }
  ```
- **Backend Behavior:** Validates composition readiness, transitions state to `PRINT_PENDING`, starts `PRINT_PENDING` inactivity watchdog.
- **Response:** Session snapshot with `state: "PRINT_PENDING"`.

#### `session.confirmSetup`
- **Direction:** Frontend → Backend
- **State Constraint:** Allowed only in `SELECTING`
- **Transition To:** `SELECTING_QUANTITY`
- **Request Payload:**
  ```json
  {
    "protocolVersion": "2.0.0",
    "method": "session.confirmSetup",
    "params": {
      "sessionId": "b8f60b6b-3652-4467-9c9c-51b75fb04b90",
      "generationId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "commandId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
    }
  }
  ```
- **Response:** Session snapshot with `state: "SELECTING_QUANTITY"`.

#### `payment.mockComplete` (Staff Cash Authorization)
- **Direction:** Frontend → Backend
- **State Constraint:** Allowed only in `PAYMENT_PENDING`
- **Transition To:** `PREPARING` → `LIVE_VIEW`
- **Request Payload:**
  ```json
  {
    "protocolVersion": "2.0.0",
    "method": "payment.mockComplete",
    "params": {
      "sessionId": "b8f60b6b-3652-4467-9c9c-51b75fb04b90",
      "generationId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "commandId": "8d82d41b-689b-4682-8495-238b69f69792",
      "staffOverride": true,
      "method": "TIEN_MAT"
    }
  }
  ```
- **Backend Security Check:** Checks `operatorAuthorized() || staffOverride`. In production release builds, requires operator authentication token or verified staff gesture flag.

---

## 9. Comprehensive Failure Modes & Disaster Recovery Matrix

| Failure Mode | Root Cause | System Detection | Recovery Protocol |
|---|---|---|---|
| **Double-Tap on Frame Card** | User taps frame card twice in rapid succession (<200ms). | `isTransitioning.current == true` catches tap 2. | Tap 2 is silently dropped. UI does not stutter or fire duplicate IPC. |
| **Ghost Click on Confirm Button** | User tap lands on coordinates of incoming "Xác nhận & in" button. | `isArmed` state in `ConfirmScreen` is false for 500ms after mount. | Ghost tap hits disabled button; no print or revenue is triggered. |
| **Backend Composition Failure** | Frame PNG missing or corrupt on disk. | Backend returns JSON-RPC `-32001: Composition failed`. | UI unlocks `isTransitioning.current`, shows error toast, remains on FrameScreen. |
| **Customer Abandons on FrameScreen** | Customer walks away without tapping a frame. | Watchdog scheduler reaches `frameSelectionTimeoutSeconds`. | Backend auto-selects default frame, completes composition, advances to `PRINT_PENDING`. |
| **PayOS QR Gateway Timeout** | Venue network disconnected or PayOS API outage. | Link creation reaches 15s timeout or returns error. | UI shows "Không tạo được mã QR" + "Thử lại". Cash button is NOT exposed to customer. |
| **Customer Attempts Cash Bypass** | Customer tries tapping error banner or searching for bypass. | No public button exists in DOM. Title hold requires 1000ms + <12px movement. | Customer cannot bypass payment. Staff member must physically attend kiosk. |
| **JVM Sidecar Termination** | JVM out-of-memory or native DLL crash. | Tauri Rust process catches broken stdio pipe. | Rust marks bridge recovering, restarts JVM child within 1500ms, UI re-polls session state. |
| **Concurrent V1 & V2 Execution** | Operator launches V1 while V2 is running. | Windows Named Mutex `Global\LeSouvenirPhotobooth_Lock`. | Second instance detects mutex collision, displays warning modal, and exits cleanly. |

---

## 10. Engineering Handoff & Specialist Ownership

1. **Frontend Specialist:**
   - Update `FrameScreen.tsx`: Remove `ActionBar` & Continue button; implement `handleUserFrameTap` with 320ms visual confirmation delay and `isTransitioning` lockout.
   - Update `ConfirmScreen.tsx`: Implement 500ms `isArmed` delay on primary print confirmation button.
   - Update `StudioModeScreen.tsx`: Remove `ActionBar`; implement centered-card direct advance in `handleCardClick`.
   - Update `PaymentScreen.tsx`: Remove `warning || isError` from `staffVisible`; wire 1000ms title hold gesture and Staff PIN modal.
   - Update `PrintPreview.tsx` & CSS: Strip nested white box wrappers; apply floating photostrip drop shadows.
   - Update `screens.test.tsx`: Align unit tests with the new direct manipulation and security contracts.
2. **Backend Specialist:**
   - Verify `SimulatorSessionEngine.kt` and `RealSessionEngine.kt` handle atomic `frame.confirm` with optional `frameId`.
   - Verify inactivity timer watchdog auto-advances `EDITING` to `PRINT_PENDING`.
3. **Tester-Reviewer:**
   - Execute full test suites (`vitest run` on frontend, `./gradlew test` on backend).
   - Verify zero regression on 300 DPI print composites, session recovery, and staff PIN gating.

---
*Architectural Blueprint certified by Specialist Solutions Architect (V2). All designs comply with strict read-only boundary on V1 (`PhotoboothDesktop`) and write-only workspace on V2 (`PhotoboothDesktop_v2`).*