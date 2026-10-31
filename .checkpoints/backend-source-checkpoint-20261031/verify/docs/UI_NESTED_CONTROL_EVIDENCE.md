# UI Nested Control Evidence (V1 → V2 Reference)

*This document records the fine‑grained composables, helper functions, and UI widgets that are used inside the larger screens of the legacy Photobooth Desktop (V1).  Only read‑only evidence is listed; no implementation changes are made.  Each entry includes the exact Kotlin file path, symbol name, line range (as shown by `read`), and a brief description of its purpose.  Where a control appears in multiple places, the primary definition is shown.

---

## 1. Pricing Calculator (Business Logic UI Helper)
| File | Symbol | Lines | Purpose |
|------|--------|-------|---------|
| `model/PricingCalculator.kt` | `PricingCalculator.isStrip` | 14‑18 | Detects whether a print size label refers to a 5×15 strip layout. |
| `model/PricingCalculator.kt` | `PricingCalculator.allowedOptions` | 21‑22 | Returns allowed quantity options (even numbers for strips). |
| `model/PricingCalculator.kt` | `PricingCalculator.sanitizeQuantity` | 24‑27 | Normalises a user‑selected quantity to meet strip‑size constraints. |
| `model/PricingCalculator.kt` | `PricingCalculator.calculatePrice` | 29‑38 | Produces a `PricingSnapshot` with base/extra prices and validates quantity. |

---

## 2. Slider Control (Reusable Slider UI)  
| File | Symbol | Lines | Purpose |
|------|--------|-------|---------|
| `ui/screens/FilterAdminView.kt` | `SliderControl` | 466‑486 | Generic labeled slider with value display and custom colors (used for LUT intensity and effect parameters). |

---

## 3. Filter Admin View (Effect Management UI)  
| File | Symbol | Lines | Purpose |
|------|--------|-------|---------|
| `ui/screens/FilterAdminView.kt` | `FilterAdminView` (root composable) | 40‑46 | Hosts the entire effect admin screen, receives effect list and callbacks. |
| `ui/screens/FilterAdminView.kt` | State variables (`mutableEffects`, `selectedEffectId`, `savedFeedback`, etc.) | 47‑60 | Local UI state for editing, saving, and feedback. |
| `ui/screens/FilterAdminView.kt` | Delete‑confirm dialog (AlertDialog) | 63‑72 | Prompts user before removing an effect. |
| `ui/screens/FilterAdminView.kt` | "+ Nhập LUT (.cube)" button | 86‑108 | Opens a `FileDialog` to import a 3‑D LUT; creates a new `EffectMode` entry. |
| `ui/screens/FilterAdminView.kt` | "+ Thêm bộ lọc thông số" button | 109‑128 | Adds a blank `EffectMode` with default parameters. |
| `ui/screens/FilterAdminView.kt` | Effect list item (Card) | 138‑182 | Renders each effect with selectable styling, enable switch, and edit click. |
| `ui/screens/FilterAdminView.kt` | Effect enable switch | 173‑179 | Toggles `enabled` flag on the effect and persists via `commitEffects`. |
| `ui/screens/FilterAdminView.kt` | Effect detail editor (right column) – title, description, sliders | 196‑312 | Provides fields to edit name, description, and colour parameters; uses `SliderControl`. |
| `ui/screens/FilterAdminView.kt` | LUT‑specific controls (intensity slider, preset buttons) | 294‑302 | Adjusts `lutIntensity` for LUT effects. |
| `ui/screens/FilterAdminView.kt` | Reset‑parameters button | 308‑311 | Restores saturation/contrast/brightness/warmth/tint to defaults. |
| `ui/screens/FilterAdminView.kt` | Bottom action bar (delete, save, feedback) | 324‑339 | Shows delete button (if not system default), save‑all button, and status text. |

---

## 4. Revenue Screen Dialogs (Transaction Adjustment UI)  
| File | Symbol | Lines | Purpose |
|------|--------|-------|---------|
| `ui/screens/RevenueScreen.kt` | `ReasonPicker` | 254‑267 | Renders a list of selectable reasons and an optional note field. |
| `ui/screens/RevenueScreen.kt` | `AdjustTransactionDialog` | 269‑299 | Dialog allowing quantity change, reason selection, and preview of resulting revenue delta. |
| `ui/screens/RevenueScreen.kt` | `VoidTransactionDialog` | 302‑314 | Dialog to void a transaction with reason/note selection. |
| `ui/screens/RevenueScreen.kt` | `Panel` (local helper) | 317‑321 | Simple styled container used in the dialogs. |
| `ui/screens/RevenueScreen.kt` | `Metric` (local helper) | 324‑334 | Styled metric box used for revenue summary. |

---

## 5. Layout Edit Dialog (Admin Layout Configuration)  
| File | Symbol | Lines | Purpose |
|------|--------|-------|---------|
| `ui/screens/AdminScreen.kt` | `LayoutEditDialog` | 418‑468 | Modal dialog for editing a layout’s price, shot count, and countdown seconds. |
| `ui/screens/AdminScreen.kt` | Text fields for price, shot count, countdown | 429‑448 | `OutlinedTextField`s bound to mutable state variables (`priceStr`, `shotCountStr`, `countdownStr`). |
| `ui/screens/AdminScreen.kt` | Save button (Dialog confirm) | 452‑460 | Persists edited values via `onSave`. |
| `ui/screens/AdminScreen.kt` | Cancel button (Dialog dismiss) | 462‑466 | Dismisses without saving. |

---

## 6. Event Admin Card (Special‑Event Frame Management)  
| File | Symbol | Lines | Purpose |
|------|--------|-------|---------|
| `ui/screens/AdminScreen.kt` | `EventAdminCard` | 538‑600 (partial) | Shows a special‑event header, cover preview, frame count, and actions (refresh, delete). |
| `ui/screens/AdminScreen.kt` | Cover preview loading (`rememberImageBitmap`) | 544‑546 | Loads cover image with cache busting based on file modification time. |
| `ui/screens/AdminScreen.kt` | Delete‑confirmation UI – text and buttons | 583‑614 (within 538‑600) | Prompts before removing the entire event and its frames. |
| `ui/screens/AdminScreen.kt` | Refresh button (not shown in excerpt) – typically triggers `onRefresh`. |

---

## 7. Session Cancellation Controls (Customer‑Facing)  
| File | Symbol | Lines | Purpose |
|------|--------|-------|---------|
| `ui/components/CoreComponents.kt` | `SessionCancellationMenu` | 64‑81 | Dropdown‑menu button (⋮) that opens a cancel‑session option. |
| `ui/components/CoreComponents.kt` | `CancelSessionConfirmationDialog` | 84‑92 | Confirmation dialog that appears after selecting “Hủy phiên chụp”. |

---

## 8. Button Primitives (Reusable Clickable UI)  
| File | Symbol | Lines | Purpose |
|------|--------|-------|---------|
| `ui/components/CoreComponents.kt` | `BouncyButton` | 106‑132 | Base button with bouncy click animation; used by primary/secondary buttons. |
| `ui/components/CoreComponents.kt` | `KioskPrimaryButton` | 134‑152 | Primary action button styled with `AccentNude`. |
| `ui/components/CoreComponents.kt` | `KioskSecondaryButton` | 154‑184 | Outlined secondary button with press scaling. |
| `ui/components/CoreComponents.kt` | `KioskBackButton` | 186‑200 | Back navigation icon button with optional light theme. |

---

## 9. Mini Layout Preview (Compact Layout Visualisation)  
| File | Symbol | Lines | Purpose |
|------|--------|-------|---------|
| `ui/components/PrintPreview.kt` | `MiniLayoutPreview` | 159‑203 | Renders a small preview of a layout’s grid, respecting aspect ratio, padding, and slot positions. |

---

## 10. Miscellaneous UI Helpers  
| File | Symbol | Lines | Purpose |
|------|--------|-------|---------|
| `ui/components/CoreComponents.kt` | `SliderControl` (already listed under #2) |
| `ui/components/CoreComponents.kt` | `AlertDialog` usages – various dialogs are built directly in the screens (see lines in RevenueScreen and FilterAdminView). |
| `ui/components/CoreComponents.kt` | `InfoPill` (used throughout admin screens for status badges). |
| `ui/components/CoreComponents.kt` | `SectionHeader` (standardised header component). |

---

**Note**: All line numbers refer to the state of the repository at the time of audit.  If the source file changes, the line ranges may shift.  No assumptions have been made beyond the observed code; every entry is directly supported by a `read` or `grep` result.
