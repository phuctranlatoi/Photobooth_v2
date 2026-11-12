# LE SOUVENIR V2 — Touch Component Library Specification

**Scope:** reusable visual and interaction contracts for React/Tailwind handoff. This file contains no implementation code and does not claim mounted components exist.  
**Behavior rule:** components render authoritative state and request approved commands; they never call cameras, printers, PayOS, Cloudinary, databases, or unrestricted session transitions directly.

---

## 1. Library conventions

### 1.1 Common state vocabulary

Every interactive component uses a controlled state from this set where relevant:

| State | Visual behavior | Interaction behavior | Accessibility |
|---|---|---|---|
| `rest` | stable label/rim | accepts touch | normal semantics |
| `pressed` | immediate scale/rim/ripple, <16ms target | activation not yet committed | pressed state where supported |
| `selected` | persistent border + check/ordinal + label | remains reversible unless command pending | `aria-selected` / checked semantic |
| `pending` | label retained + inline progress | rejects duplicate input | busy + status text |
| `disabled` | opaque muted fill + icon/reason | no activation | disabled semantic; reason associated |
| `success` | success icon/title; no celebratory bounce required | follows parent policy | polite status |
| `error` | error icon/title/detail | safe retry only when supplied | alert once |
| `uncertain` | warning/status language | never automatic replay | alert/status and operator guidance |

Animations never own command state. Pending survives component rerenders and screen motion.

### 1.2 Shared input rules

- Minimum active bounds 48×48px; default 56×56px; customer primary actions 64–72px high.
- Adjacent active bounds are separated by ≥12px.
- Press response begins on pointer down; activation occurs only after an eligible completed tap.
- Movement ≈12px converts tap to drag/scroll where applicable.
- Pointer cancel/lost capture clears press, hold, ripple, and drag without activation.
- Side-effecting actions lock synchronously on first accepted activation.
- `touch-action:manipulation` for controls; `pan-x` for horizontal tracks; `none` only on the active crop surface.
- No hover-only content. Hover is an optional desktop mirror of focus/selected styling.
- Context menu, text selection, and image drag are suppressed on customer chrome where host policy permits.

### 1.3 Common visual variants

| Variant | Surface | Use |
|---|---|---|
| `glass-light` | white .12–.15 + 12–20px blur | ivory customer canvas |
| `glass-dark` | black/white .10–.12 + 16px blur | camera stage controls |
| `solid-light` | `#FFFDFC` / `#F2ECE4` | forms, QR-adjacent, fallback |
| `solid-dark` | `#1A1A1A` | high-contrast primary/camera state |
| `paper` | white/ivory + paper shadow, little/no rounding | print/composition artwork only |
| `danger` | opaque error surface | destructive confirmation |

Nested glass is discouraged. A glass parent generally contains solid/simple controls, or standalone glass controls sit directly on canvas—not both.

### 1.4 Proposed Tailwind utility vocabulary

These are semantic utility proposals, not source code:

- Material: `glass-surface`, `glass-surface-strong`, `glass-surface-dark`, `glass-specular`, `glass-fallback`.
- Geometry: `min-h-touch`, `min-h-touch-comfort`, `min-h-touch-primary`, `size-shutter`, `rounded-glass`, `rounded-sheet`.
- State: `state-selected`, `state-pending`, `state-disabled`, `state-error`, `state-uncertain`.
- Media: `media-contain`, `media-cover-thumb`, `shadow-paper`, `qr-opaque`.
- Input: `touch-manipulation`, `touch-pan-x`, `overscroll-contain`, `select-none`.
- Focus: `focus-kiosk-light`, `focus-kiosk-dark` (3px champagne plus contrasting offset).
- Motion: `press-kiosk`, `enter-kiosk`, `motion-reduce-static`.

---

## 2. GlassCard

### Purpose

Group one coherent decision or small metadata set over the atelier canvas without creating a desktop-dashboard tile field.

### Variants

- `interactive`: layout, frame, bundle, or diagnostic choice.
- `display`: summary/instruction, not clickable.
- `selected`: strong rim + state badge.
- `dark`: camera-stage metadata.
- `solidFallback`: forced colors/high contrast/no backdrop support.

### Anatomy

1. Optional media zone.
2. Eyebrow/status.
3. Title and at most two-line supporting copy.
4. Optional metadata row.
5. Persistent state badge outside important image content.

### Dimensions

- Padding: 24px compact / 32–40px wide.
- Radius: 24px compact / 28px wide.
- Interactive minimum: 160×120px, but screen-specific cards use larger targets.
- Border: 1px rim; selected adds 2–3px champagne-dark outer ring.

### Interaction and states

- Entire card is the target; nested buttons are prohibited unless the card itself is noninteractive.
- Immediate scale .98 and rim darkening on press; selected cards do not shift layout.
- Pending freezes activation and displays status without replacing title.
- Disabled card remains opaque enough to read and gives a visible reason.

### Accessibility

- Use button/radio/option semantics according to behavior, not a generic clickable region.
- Selected state is announced and visible through icon/text/border.
- Media alt text is empty when title already describes it.

### Acceptance

- Text remains AA against worst permitted glass backdrop.
- Tap anywhere in active bounds produces the same action once.
- Long press/drag does not activate accidentally.
- High contrast removes blur and retains boundary/state.

---

## 3. GlassButton

### Purpose

Standard touch action for customer and operator surfaces.

### Variants

| Variant | Visual | Typical use |
|---|---|---|
| `primary-dark` | matte black fill, ivory label, champagne focus | Start, Continue, Confirm & Print, Finish |
| `primary-champagne` | champagne fill, matte label | lower-risk branded action where contrast passes |
| `secondary-glass` | light glass, matte label | Back, alternate action |
| `icon-glass` | circular/square glass | arrows, close, zoom |
| `dark-glass` | dark glass, ivory label | camera controls |
| `danger-solid` | error fill/ink with clear consequence | confirmed destructive operator/session action |

### Dimensions

- Customer primary: min height 64px compact / 72px wide; horizontal padding 28–40px.
- Secondary: 56px comfort target.
- Absolute minimum/operator dense: 48px.
- Icon glyph: 20–28px inside 56px target.

### Content rules

- Label remains visible while pending; append spinner/status rather than replacing with an unlabeled spinner.
- Optional leading/trailing icon is decorative if label fully describes action.
- Price-bearing actions use canonical formatted price and do not wrap.

### Touch behavior

- `pointerdown`: visible response in next frame.
- Eligible release: request action once and lock if action is side-effecting.
- Press-and-hold does not repeat by default.
- Pointer leaves beyond tolerance/cancels: no activation.
- Disabled controls are not focusable in customer flow unless needed to explain a reason via associated text.

### Accessibility

- Native button semantics preferred.
- Focus ring 3px champagne plus contrast offset.
- Accessible name includes outcome, especially for icon-only controls.

### Acceptance

- Rapid double tap dispatches once for locked actions.
- Pending survives rerender and prevents ghost activation.
- Button remains ≥48px under every language and scaling state.

---

## 4. GlassSheet

### Purpose

Present a bounded secondary workspace without navigating: effect choices, crop controls (only if supported), selection detail, or mobile/short-height action region.

### Variants

- `side`: right-side decision rail on wide screens.
- `bottom`: compact/short-height dock.
- `dark`: camera control rail.
- `operator`: scrollable settings inspector.

### Geometry

- Side width: 320–480px based on viewport; max 44% customer width.
- Bottom height: content-driven, normally 120–280px, never covering the only image action.
- Radius: 32px on exposed corners.
- Padding: 24px compact / 32px wide.
- Backdrop scrim only when modal behavior is intended; ordinary decision rails do not block the rest of the screen.

### Behavior

- Internal scroll is bounded; edge fade and explicit controls communicate overflow.
- Drag-to-dismiss is optional and never the only close mechanism.
- Destructive/financial actions do not dismiss on backdrop tap.
- Preserve child control states during orientation/compact layout change.

### Accessibility

- Nonmodal sheet remains in normal document order.
- Modal sheet has dialog semantics, labeled title, focus trap, and explicit Close/Cancel.

---

## 5. GlassModal

### Purpose

Handle destructive confirmation, staff authentication, uncertain-result reconciliation, or operator forms that require focused attention.

### Anatomy

1. Title and optional status icon.
2. Consequence/detail.
3. Optional form/content.
4. Primary and secondary actions, separated ≥16px.

### Geometry

- Width: min(720px, viewport minus 48px compact / 128px wide).
- Max height: viewport minus 48px; content scrolls internally.
- Padding: 24px compact / 40px wide; radius 28–32px.
- Scrim: `rgba(10,9,8,.58)`; no tap-through.

### Behavior

- Opening cancels underlying press/hold states.
- Destructive and payment-staff modals never confirm via outside tap or Enter without focused explicit action.
- Pending disables close if cancellation cannot be guaranteed; status explains why.
- Authentication failure never reveals expected credentials.

### Accessibility

- Dialog title/description association; initial focus on title or safest action.
- Focus trap and return focus.
- Escape may cancel only when safe and available; customer flow cannot depend on a keyboard.

---

## 6. GlassProgressRing

### Purpose

Render bounded progress or authoritative remaining time without hiding the corresponding text.

### Variants

- `determinate`: real fraction only.
- `indeterminate`: unknown duration/status.
- `countdown`: authoritative remaining value.
- `segmented`: capture positions generated from configured total.

### Dimensions

- Inline/status: 40–56px.
- Feature: 72–112px.
- Stroke: 3–6px; ≥3:1 contrast.
- Center value uses tabular figures.

### Rules

- Never infer percentages from elapsed time.
- Always show textual `{current}/{total}`, remaining time, or status adjacent/inside.
- Segment count comes from data and must remain legible for large totals; when too dense, switch to continuous ring plus fraction.
- Reduced motion makes indeterminate state a static ring plus text.

### Accessibility

- Use progressbar semantics only for known values; otherwise status semantics.
- Provide min/max/current and readable value text.

---

## 7. TouchCarousel

### Purpose

Browse layouts, photos, frames, or bundles by swipe **and** explicit navigation without committing an irreversible action on drag.

### Controlled data contract

- Ordered stable item IDs.
- Active/centered index.
- Optional selected item distinct from centered item.
- Disabled/pending state.
- Item count and accessible label formatter.
- Callback requests for previous, next, center/change, and deliberate activation.

### Geometry

- Visible active item plus at least 48–64px neighboring peek when count >1.
- Arrow target 56px compact / 64px wide, fixed outside card content.
- Track uses fixed logical item slots but media preserves its own aspect.
- Position indicator uses dots only for small totals; otherwise “n / total.”

### Touch behavior

- Horizontal movement beyond ≈12px begins drag and cancels tap.
- Track follows finger; release snaps to nearest valid item.
- Overscroll at ends has restrained resistance, no fake infinite copy unless data explicitly supports looping.
- Arrow moves exactly one valid item.
- Off-center tap centers only; centered activation follows screen policy.
- During pending transition, freeze drag/arrows/activation.

### Motion

- Snap 220–250ms editorial ease; disabled under reduced motion.
- Adjacent scale no lower than .86 and opacity no lower than .45 so options remain discoverable.
- Do not animate image decoding/live streams.

### Accessibility

- Region label, item “n of total,” selected/centered distinction, previous/next names.
- Keyboard arrows may work for accessibility/operator tests but are not required for customer completion.

### Acceptance

- 0/1/2/many items; dynamic removal; long names; RTL policy if later localized.
- Pointer cancel does not activate.
- Swipe and arrows converge on identical controlled index.

---

## 8. TouchGrid

### Purpose

Display responsive touch cards for photos, frames, layouts (when grid mode is appropriate), diagnostics, and operator catalogs.

### Layout

- Uses `minmax()` card width supplied by screen spec rather than a fixed column count.
- Gap ≥12px; preferred 16–24px.
- Customer region scrolls internally with `overscroll-behavior:contain`; edge fade and optional page controls indicate overflow.
- Preserve scroll position when selection changes; reset only on new dataset/session.

### Selection modes

- `single`: radio-like frame/layout selection.
- `multiple`: photo selection with max quota.
- `orderedMultiple`: ordinal badges tied to authoritative order.
- `action`: diagnostic/admin cards.

### Behavior

- Whole tile target; nested “more” action only in noninteractive parent cards.
- At quota, unselected cards are visibly unavailable but remain readable/previewable per screen policy.
- Virtualization must not lose focus/selection or unload the active preview unexpectedly.

### Accessibility

- Semantic list/grid chosen for content; each item has selected/disabled state.
- Do not use visual row/column position as the only label.

---

## 9. TouchSlider

### Purpose

Adjust a continuous/discrete approved operator or crop value with large touch affordance. Not used for quantity options when the backend supplies a discrete list better served by steppers.

### Geometry

- Active track hit box: ≥48px high; visual rail 4–8px.
- Thumb: 32–40px visual within ≥48px active bounds.
- Labels/units remain visible; current value uses tabular figures.

### Behavior

- Controlled min/max/step and value come from backend validation.
- Drag starts only on thumb/track and captures pointer; pointer cancel restores last committed value or follows defined preview policy.
- Provide 48/56px decrement/increment buttons and numeric entry where precision matters.
- Preview changes may be optimistic/reversible; Save/Apply remains explicit for persisted changes.

### Accessibility

- Slider semantics, value text with units, orientation, keyboard support, and associated label.
- Color is not the only min/max/invalid indication.

---

## 10. CountdownRing

### Purpose

Show the authoritative per-shot countdown at cross-booth scale. It composes `GlassProgressRing` semantics but has stricter typography and timing rules.

### Variants

- `rail`: selected default; 144–300px numeral, ring optional.
- `overlay-band`: compact fallback on top/bottom safe band.
- `reduced-motion`: static numeral + textual “Sắp chụp.”

### Rules

- Value and total duration come from backend/layout; no local interval drives shutter.
- Poll/event gaps may skip numerals; never backfill or delay phase.
- Numeral changes can crossfade ≤200ms; no perpetual pulse.
- Ring progress is shown only if exact remaining/total mapping is authoritative.
- When value ends, wait for phase change; UI does not trigger capture.

### Accessibility

- Controlled live region announces each authoritative value once.
- Do not repeat the word “seconds” every frame if it overwhelms assistive tech; use localized concise value text.

---

## 11. LiveViewFrame

### Purpose

Render the camera preview, letterbox, crop guide, and truthful stream states without reconnecting the camera or altering capture behavior.

### Inputs (semantic, not IPC names)

- Safe source/handle and intrinsic dimensions.
- Phase/readiness/stale/error state.
- Orientation and mirror metadata.
- Photo-slot/crop aspect and optional normalized guide geometry.
- Optional recording/status flag.

### Media rules

- `object-fit:contain`; matte-black letterbox.
- Orientation/mirror applied once according to metadata; never guess from dimensions alone.
- Crop guide is a separate noninteractive layer; outside dim ≤45% and guide ≥3:1.
- Never apply Beauty, LUT, CSS filter, blur, transition, or scale to the stream unless the backend is actually supplying that preview result.

### States

- `loading`: matte stage and text.
- `ready`: source + guide.
- `stale`: last frame only with persistent label.
- `missing`: no stock video; camera unavailable message.
- `capturing`: retain source or backend status; never duplicate shutter event.
- `error/uncertain`: lock action via parent.

### Accessibility

- Static accessible name; frame updates hidden from screen reader.
- Crop instruction/status exists as real text outside the media.

### Acceptance

- Test portrait/landscape, wide/narrow source, mirrored/nonmirrored, rotation, no source, delayed source, and session swap.
- A new countdown value must not remount the stream component.

---

## 12. PhotoThumbnail

### Purpose

Represent one captured moment in selection, lightbox navigation, or operator-safe preview.

### Anatomy

1. Aspect-cropped thumbnail (view only).
2. Optional label/capture position.
3. Selection ordinal/check.
4. Processing/error state veil outside critical image detail.
5. Explicit “Xem lớn” affordance where required.

### Variants

- `selectable`, `selected`, `quotaLocked`, `processing`, `error`, `displayOnly`.

### Behavior

- Tap toggles only if valid/selectable.
- Hold may preview, but explicit preview action is also supplied.
- Image drag/context menu suppressed in customer mode.
- Selected order comes from controlled authoritative list, not local click history after a response conflict.

### Accessibility

- Name includes photo label/position and selected order.
- Processing/error reason is announced; filesystem path is never exposed.

---

## 13. LayoutCard

### Purpose

Show a configured print layout accurately enough to choose without fabricating geometry.

### Required content

- Localized title and optional description.
- Declared print size/orientation.
- Contained real frame/layout art or clearly labeled authored illustration.
- Independently labeled capture count and selection requirement when supplied.
- Selected/available state.

### Geometry rules

- Outer card can be glass; print itself uses `paper` material and declared width/height ratio.
- Slot illustration uses normalized backend geometry only. If geometry is absent, do not imply exact slot placement.
- Strip preview remains narrow; no stretching to card width.

### Interaction

- In carousel: off-center tap centers; centered tap follows screen’s approved layout-selection behavior.
- In operator grid: edit action is explicit and does not share customer direct-advance semantics.

### Accessibility

- Accessible label distinguishes print size, number to capture, and number to select.
- Raw layout ID appears only in operator diagnostics when safe, not customer copy.

---

## 14. BundleCard

### Purpose

Represent a backend-provided event/special bundle that uses the existing direct-to-Quantity branch.

### Required content

- Curated title; approved cover or illustration; format/price only when canonical and applicable; validity status.
- Target layout/frame resolution is checked before card is enabled.

### Behavior

- One deliberate tap requests bundle selection and locks until accepted/rejected.
- It never bypasses Quantity or Payment.
- Missing target disables/removes card and reports operator diagnostic; customer sees no raw error.

### Glass variant

- Cover is unfiltered; metadata footer uses low-opacity glass with solid text underlay.
- Selected/pending state is persistent and does not rely on cover color.

---

## 15. PaymentQR

### Purpose

Reserve, render, and label a real PayOS QR without treating it as proof of payment.

### States

- `creating`, `ready`, `polling`, `expired`, `error`, `paidPendingTransition`, `uncertain`.

### Geometry

- Encoded square: 340–380px wide, 260–300px compact.
- Opaque white quiet zone ≥20px wide / ≥16px compact.
- Stable 1:1 slot across states; no layout shift.
- No blur/tint over QR. Outer `GlassCard` is allowed with ≥16px separation from encoded zone.

### Behavior

- Not clickable by default.
- Optional expiry uses authoritative data only.
- Error may expose approved recreate-link action, never complete-payment.
- `ready`/`polling` never invokes success itself; parent waits for backend state.

### Accessibility

- Visible and accessible payment instruction/amount; raw payload hidden from assistive text/logs.
- Status changes announced once.

### Acceptance

- Scan on representative iOS/Android banking apps and at both resolutions.
- Loading/error/expired cannot be mistaken for an active QR.

---

## 16. AdminPanel

### Purpose

Provide the reusable shell for each authenticated Admin tab while supporting dense information without a desktop-dashboard aesthetic.

### Anatomy

1. Title/description and capability/status badge.
2. Fixed action region (Refresh/Save only when supported).
3. Scrollable content body.
4. Persistent draft/error/status footer when applicable.

### Variants

- `catalog`, `settings`, `diagnostics`, `revenue`, `tool`, `readOnly`.

### Behavior

- Body scrolls; header/footer remain stable.
- Permission/capability is known before mutation controls become enabled.
- Pending is scoped to affected action but Exit follows architecture policy.
- No secrets or arbitrary file paths in content.

### Accessibility

- Labeled region; headings; status association; logical focus order after tab switch.

---

## 17. SettingsForm

### Purpose

Edit approved operator configuration with explicit draft, validation, apply timing, and persistence status.

### Field patterns

- Toggle row: label, explanation, current/pending badge, 56px switch target.
- Numeric row: label/unit, decrement/value/increment, optional touch keypad.
- Select row: large segmented options or modal choice list; no tiny native desktop dropdown dependence.
- Path row: redacted/display path + 56px approved chooser; no freeform arbitrary path by default.
- Camera parameter row: current device-supported options only.

### Behavior

- Draft changes are local/reversible until Save unless existing setting is explicitly immediate.
- Backend validation owns ranges; errors remain attached to fields.
- Apply timing (`next session`, restart, immediate) is shown from backend metadata.
- Save locks once and reports persisted/rejected/uncertain; no optimistic “Saved.”
- Exit preserves source-observed save-on-exit semantics as mapped by architecture; do not silently add discard.

### Accessibility

- Persistent labels, units, description/error IDs; screen-reader value text.
- On-screen keypad has 56–64px keys and explicit Done/Cancel.

---

## 18. DiagnosticCard

### Purpose

Communicate one device/service/capability health state with evidence level and safe operator detail.

### Anatomy

- Device/service name.
- Status icon + explicit text (`Disconnected`, `Configured only`, `Ready evidence`, `Unknown`, `Simulation`).
- Last checked/evidence timestamp.
- Concise safe detail.
- Optional approved read-only diagnostic action.

### State language

| Visual state | Required wording principle |
|---|---|
| Success | Name what was actually observed, e.g. “Bridge responding,” not “Everything ready.” |
| Warning | “Configured; connection not verified” rather than green configured state |
| Error | Classified failure and customer impact |
| Unknown | Explicitly unknown, not neutral success |
| Simulation | Persistent badge; never hardware-green |

### Behavior

- Read-only diagnostic can refresh/query only; no capture/print/payment/upload side effect.
- Test Print is not a DiagnosticCard default action; it requires a separate approved destructive/resource-consuming contract and confirmation.
- Details redact secrets, QR payloads, customer images/paths, and raw HTTP bodies.

### Accessibility

- Status is text plus icon; timestamp and evidence are readable in logical order.
- Refresh pending and result announced once.

---

## 19. Recommended supporting primitives

These are recommendations needed to compose the requested components consistently; they do not create workflow stages.

### `KioskHeader`

- Screen eyebrow/title/subtitle, legal Back control, optional timer/cancel/status.
- Reserves 72px compact / 88–96px wide.
- Never turns a hidden admin gesture into authorization.

### `ActionDock`

- One primary and at most one secondary customer action.
- Stable bottom geometry; 64–72px height controls; no image overlap.
- Command pending/error remains inline.

### `StatusNotice`

- `info`, `success`, `warning`, `error`, `uncertain` with icon/title/detail/action.
- Error action exists only if supplied by parent contract.

### `AspectMedia`

- Centralizes contain/cover behavior, intrinsic dimensions, loading/error, alt text, and stale-session cleanup.
- Safe source validation is architecture-owned; component never accepts arbitrary production file paths.

### `SessionCancelMenu`

- Visible only in legal phases; secondary three-dot/label target ≥48px.
- Opens destructive `GlassModal`; no immediate cancel.

### `StaffAuthModal`

- Opened by approved concealed discovery gesture.
- Authentication, attempt policy, and authorization are backend-owned; modal does not contain a hardcoded PIN.

### `PaperPreview`

- Renders backend composition/print thumbnail contained with paper shadow, no nested glass box and no CSS reconstruction.

---

## 20. Component QA matrix

Every component must be reviewed against:

1. **Visual states:** rest, pressed, selected, pending, disabled, error, uncertain, high contrast, forced colors.
2. **Inputs:** tap, rapid double tap, hold, drag threshold, pointer cancel, two-finger contact, transition-time touch.
3. **Motion:** normal and reduced motion; no essential information removed.
4. **Content:** empty, one, many, long Vietnamese/Hangul/English labels, fallback fonts, large numbers.
5. **Geometry:** 1920×1200, 1280×800, 1536×960, 1024×640, and ~853×533 stress fallback.
6. **Semantics:** role/name/state/value, focus order, visible 3px focus, live-region throttling.
7. **Truthfulness:** mock/unsupported/device/payment/print states cannot look successfully real.
8. **Session safety:** stale async media/result cannot appear in a new session.

No component is accepted from a static screenshot alone; mounted interaction and state tests are required in the implementation milestone.
