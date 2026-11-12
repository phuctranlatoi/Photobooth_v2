# LE SOUVENIR V2 — Screen Specifications

**Deliverable type:** screen-by-screen UX specification only. Static descriptions and token proposals are not a working UI.  
**Viewport baseline:** 1920×1200 primary, 1280×800 secondary; see `RESPONSIVE_BREAKPOINTS.md` for effective CSS viewports at Windows scaling.  
**Behavior authority:** V1 screen behavior was used as a read-only reference. Backend phase, capabilities, and command responses are authoritative. This specification does not add routes, payment bypasses, retake paths, cancellation rights, or print/revenue shortcuts.

---

## 1. Non-negotiable flow boundary

### 1.1 Source-grounded customer flow

`IDLE → SELECTING → SELECTING_QUANTITY → PAYMENT_PENDING → PREPARING → LIVE_VIEW → (COUNTDOWN → CAPTURING → LIVE_VIEW)* → SELECTING_PHOTOS → EDITING → PRINT_PENDING → PRINTING → DELIVERY → IDLE`

- Event/special bundle selection may take the existing branch from `IDLE` directly to `SELECTING_QUANTITY` when its target layout exists.
- Layout and effect selection both live inside `SELECTING`; they are not new routed phases.
- `EDITING` is frame selection. A crop editor is **not** a proven V1 routed stage; §10 defines only a capability-gated, same-phase proposal.
- Final Preview and Confirm & Print are one `PRINT_PENDING` screen. They are not two workflow stages.
- Thank-you/completion is a visual treatment while Finish is pending or on return to `IDLE`, not an added state.
- `RECOVERY`, `OUT_OF_SERVICE`, and `COMPOSING` exist in the legacy enum but were not observed as routed V1 screens. V2 recovery presentation must follow architect-approved state/capability contracts.

### 1.2 Actual Back and cancellation rules

| Current surface | Legal backward/cancel behavior to preserve |
|---|---|
| Studio selection | Local step Back where applicable; root Back to Welcome |
| Quantity | Back to Studio selection |
| Payment | Back to Quantity and cancel local payment polling; no proven remote refund/cancel |
| Preparation / Capture | No customer Back/cancel |
| Photo selection | Legacy Back callback is behaviorally inert; do not present it as retake. Session cancellation is permitted here through the existing hidden/secondary cancellation flow and destructive confirmation. |
| Frame selection | Back to Photo selection; session cancellation is permitted here with confirmation |
| Final Preview | Back to Frame selection |
| Printing | No customer Back/reprint/cancel |
| Delivery | Finish resets the session to Welcome |

### 1.3 Dynamic values

All visible values below are placeholders for backend data, never design constants:

- capture total: `layout.shotCount`
- selection requirement: `layout.selectCount`
- per-shot countdown: `layout.countdownSeconds`
- allowed print quantities and increments
- payment amount, price breakdown, and currency formatting
- inactivity time remaining and any delivery/payment expiry
- print/composition/upload progress and outcomes

The UI must remain correct when these values differ from one another and change between sessions.

### 1.4 Shared screen contract

Every customer screen provides:

- one clear heading and one dominant legal action;
- ≥48px targets, 56px default comfort targets, 64–72px primary actions;
- immediate pressed feedback, synchronous duplicate-command lock, and visible pending state;
- no whole-window scroll; bounded content regions may scroll with edge affordance;
- no hover-only information or required mouse/keyboard interaction;
- session/generation-safe response handling; stale callbacks never move a new session;
- localized status and accessible labels without raw paths, tokens, stack traces, or backend IDs;
- a truthful loading, empty, disabled, and error treatment;
- reduced-motion and high-contrast variants;
- media handling from `DESIGN_SYSTEM.md`: Live View and full images preserve aspect, thumbnails may cover, print/frame/QR previews contain.

---

## 2. Evaluated visual options

The product brief requires at least two meaningful Welcome and Capture directions. Both retain the same actions and business gates.

### 2.1 Welcome options

#### Option W-A — Editorial Atelier Spread **(selected)**

- Left 52%: wordmark, short editorial serif accent, large sans headline, one Start action.
- Right 48%: two contained, licensed/event-provided print artworks floating as physical paper; special bundle rail appears only when real catalog data exists.
- Ivory canvas with restrained champagne hairlines and one soft-rose caption field.
- Attract motion is a slow crossfade between approved artwork; no parallax.

**Strength:** headline and Start remain large at 1280×800 while artwork explains the product without dashboard cards. Event bundles remain discoverable without competing with the default start path.

#### Option W-B — Centered Fashion Cover

- Full-height central campaign image/illustration with wordmark above and Start pill below.
- Event bundles appear as a lower thumbnail strip.
- Matte-black typography frame around the image.

**Trade-off:** visually dramatic, but long Vietnamese/Korean copy and bundle labels compete for vertical space at 1280×800 and effective 1024×640. The central image can also be mistaken for a live/customer result.

**Decision:** W-A. It has better text overflow tolerance, clearer separation between default Start and special bundle selection, and a more truthful placeholder path when licensed photography is absent.

### 2.2 Capture options

#### Option C-A — Full-Bleed Darkroom

- Live View fills the viewport; progress pill at top, shutter at bottom, large countdown centered over a localized dark scrim.
- Maximum image size and a familiar camera feel.

**Trade-off:** countdown and controls can cover faces, especially with groups. Uncontrolled live-image contrast weakens text and glass legibility.

#### Option C-B — Viewfinder + Countdown Rail **(selected)**

- Matte-black split: approximately 76% aspect-correct Viewfinder and 24% dedicated control/countdown rail.
- Countdown numeral, capture progress, status, and shutter live in the rail; only a thin crop guide appears over the camera image.
- At very compact widths the rail becomes a shallow bottom dock, but the numeral remains outside the preferred face-safe center.

**Strength:** keeps faces unobscured, preserves strong contrast, and makes progress/countdown readable across the booth. The Viewfinder remains large enough at both reference resolutions.

**Decision:** C-B. Cross-booth readability and face safety outweigh the small loss of preview width. C-A may be retained as a theme exploration, not the default production layout.

---

## 3. Welcome / Idle attract loop (`IDLE`)

### Purpose

Signal that the booth is ready, explain the service at a glance, offer the default Start path, and expose only valid event bundles. It is also the concealed discovery surface for operator access; concealment is not authentication.

### Entrance and exit

- **Enter:** app-ready `IDLE`, or authoritative session reset after Finish/Admin exit.
- **Exit default:** Start → `SELECTING`.
- **Exit bundle:** valid special bundle → `SELECTING_QUANTITY` through the existing bundle command.
- **Exit operator:** legacy five-tap wordmark/approved hold reveals staff authentication; only authenticated/authorized success may enter `ADMIN`.
- On return to `IDLE`, remove all previous customer imagery, QR, amount, selection, and status before the attract loop resumes.

### Layout and dimensions

| Element | 1920×1200 | 1280×800 |
|---|---:|---:|
| Shell inset | 64px H / 48px V | 32px H / 24px V |
| Editorial columns | 52% / 48%, 64px gap | 54% / 46%, 32px gap |
| Start action | 320–420×72px | 280–360×64px |
| Artwork stage | ≤760×930px | ≤470×600px |
| Bundle cards, when present | 280×168px min | 216×136px min |

### Actual actions and touch behavior

- Start is a single dominant 64–72px action; lock on the first accepted tap until backend phase changes or rejects.
- Bundle card: full card is tappable. Selection is direct because the existing branch freezes its layout/frame and proceeds to Quantity. Never show a bundle if its target layout cannot be resolved.
- Bundle rail has 56px previous/next buttons plus swipe; swipe is never the only navigation.
- Hidden staff gesture counts/times only deliberate pointer sequences. Ordinary taps and Start presses must not accidentally increment an operator gesture after navigation.

### Attract loop

- Begin only after a configured idle interval; any pointer contact stops the loop immediately.
- Crossfade approved artwork and short copy every operator-configured interval if available. No fixed interval is specified here.
- No auto-navigation, simulated capture, audio surprise, rapid flashing, or fake customer results.
- Reduced motion shows a static hero.

### States

- **Loading catalog:** stable artwork placeholder and Start disabled only if the default route genuinely requires catalog readiness; otherwise Start remains available under backend rules.
- **No bundles:** omit the rail and rebalance whitespace; do not fabricate packages.
- **Missing cover:** authored layout illustration labeled decoratively, not stock people.
- **Start pending:** pressed state → inline spinner/“Đang mở studio”; ignore duplicate taps.
- **Catalog error:** customer-safe “Bộ sưu tập tạm thời chưa sẵn sàng”; operator detail remains in Admin diagnostics.
- **Not ready:** replace Start with the startup/recovery surface in §16, not a dead control.

### Required backend data / events

- readiness and current phase/session identity;
- localized brand/event copy or safe local copy;
- ordered valid bundle catalog: stable ID, title, optional description/cover, target layout/frame availability;
- legal Start, special-bundle selection, and operator-authentication transitions;
- command pending/rejection result and capability flags.

No proposed field name is an IPC contract; the architect maps these semantics.

### Accessibility

- Heading announces booth readiness once, not on every attract-loop frame.
- Bundle cards expose title, print format if authoritative, and selected/disabled state.
- Artwork is decorative unless it communicates bundle content; then provide concise alt text.
- Start label states outcome (“Bắt đầu chụp ảnh”), not “Click here.”

### Acceptance tests

1. Start advances once after rapid double tap; rejected Start unlocks with readable reason.
2. 0/1/2/many bundles render without fake cards, clipping, or swipe-only navigation.
3. Bundle whose target layout disappeared cannot be selected and never advances.
4. Long Vietnamese/Korean event title wraps without reducing Start below 64px.
5. Hidden gesture does not authenticate by itself and cannot be triggered by a carousel drag.
6. Returning from Delivery removes every previous-session photo/QR before Welcome appears.
7. Reduced motion yields a static, fully functional Welcome.

---

## 4. Bundle / Layout / Effect selection (`SELECTING`)

### Purpose

Let a customer choose one configured layout, then explore configured effects if that legacy substep is enabled. This is “Studio” in the customer journey, not the operator Admin workspace.

### Entrance and exit

- **Enter:** default Start from `IDLE`.
- **Local progression:** layout choice updates the selected layout; centered-card confirmation enters the existing effect substep where present.
- **Exit forward:** explicit effect/setup confirmation → `SELECTING_QUANTITY`.
- **Exit backward:** local Back returns effect → layout; root Back returns layout → `IDLE`.
- Do not skip the effect substep when the backend/catalog requires it. Do not invent an effect substep when the approved contract does not expose one.

### Layout and dimensions

**Layout gallery:** centered horizontal carousel on open ivory canvas. The centered card is liquid glass only around metadata; print artwork itself floats as paper.

| Element | 1920×1200 | 1280×800 |
|---|---:|---:|
| Header | 96px | 72px |
| Carousel content band | ~820px high | ~500px high |
| Center pager slot | 520–580px wide | 350–390px wide |
| Side navigation | 64×64px | 56×56px |
| Caption/action band | 144–176px | 112–136px |

Print artwork fits within its slot with declared print aspect. A narrow strip must remain narrow; never stretch it to fill the card.

**Effect substep:** Viewfinder/approved preview 62–68% width; effect rail 32–38%. Effect chips are at least 112×56px and horizontally/vertically scroll inside the bounded rail.

### Actual actions and touch behavior

- Swipe carousel or tap 56/64px arrows to move one valid item.
- Tap an off-center card: center/select it only.
- Tap the already centered card: perform the existing layout confirmation/local progression once. It must not jump across Quantity or payment.
- Layout drag ≥12px suppresses card activation; pointer cancel returns to the nearest valid snap.
- Effect chips update the approved preview and selected effect only. Customers may compare many effects.
- Explicit “Tiếp tục” confirms final setup; it remains because effect choice is exploratory.
- Back has a visible text label with icon; no unexpected browser/system Back behavior.

### Liquid-glass treatment

- Unselected card: low glass fill, 1px rim, no heavy blur around artwork.
- Centered/selected: 2–3px champagne-dark outline + check/“Đã chọn” + subtle elevation.
- Disabled/unavailable: opaque fallback with reason; do not use blur/opacity alone.
- Effect rail can use `GlassSheet`; the camera/image preview remains unfiltered except for the actual configured effect result.

### States

- **Catalog loading:** fixed carousel skeletons with no fake title/count.
- **Empty layout catalog:** no selectable placeholder; explain unavailability and offer legal Back only.
- **Missing geometry/art:** clearly labeled layout illustration; never claim exact slot geometry.
- **Selection pending:** freeze active item and arrows until acknowledgment if selection changes backend state.
- **Effect preview loading:** preserve previous valid preview with “Đang áp dụng”; guard stale preview responses.
- **Effect unavailable:** disable chip with reason; never silently switch to a different effect.
- **One layout:** center it; hide arrows/swipe affordance, retain deliberate confirmation.

### Required backend data / events

- filtered ordered layouts: stable ID, localized title/description, print dimensions/orientation, slot geometry when available, photo-slot aspect, `shotCount`, `selectCount`, `countdownSeconds`, availability, preview/frame asset;
- configured enabled effects and authoritative preview capability/result;
- current selected layout/effect;
- legal choose-layout, choose-effect, confirm-setup, and Back commands;
- pending/rejected state and session identity.

### Accessibility

- Carousel announces “item n of total” and selected state without exposing raw IDs.
- Arrow accessible names include direction and target semantics.
- Layout count labels distinguish capture total from selected-photo requirement.
- Effect changes announce effect title once, not every preview frame.

### Acceptance tests

1. Off-center tap recenters; centered tap follows only the existing setup progression.
2. Swipe, arrows, direct tap, and accessibility activation settle on the same item.
3. Empty/one/two/many dynamic layouts do not use modulo-on-empty or fake infinite items.
4. `shotCount`, `selectCount`, and `countdownSeconds` display independently and update when layout changes.
5. Missing preview does not fabricate customer photography or exact geometry.
6. Effect selection does not auto-advance; only explicit setup confirmation exits.
7. Rapid taps dispatch at most one confirm; stale effect preview cannot overwrite the current selection.
8. All artwork is contained at strip, portrait, and landscape aspects at both target viewports.

---

## 5. Quantity selection (`SELECTING_QUANTITY`)

### Purpose

Choose an allowed print quantity, show the canonical price, and preserve the explicit financial confirmation before PayOS QR creation.

### Entrance and exit

- **Enter:** confirmed Studio setup or valid special bundle.
- **Exit forward:** explicit “Tiếp tục · [canonical total]” → `PAYMENT_PENDING`.
- **Exit backward:** Back → `SELECTING` under existing behavior.
- Quantity changes alone never start payment.

### Layout and dimensions

- 52/48 editorial split: quantity/price on the reachable left/lower zone, contained print preview on the other side.
- Stepper targets: 72×72px wide, 64×64px compact; quantity numeral: 64–88px.
- Primary confirmation: 64–72px high; price never truncates.
- Print preview height: ≤70% content height and source aspect-contained.

### Actual actions and touch behavior

- Minus/plus moves to the previous/next **backend-allowed option**, not a designer-assumed arithmetic increment.
- One completed tap changes one option. Touch-hold does not auto-repeat unless an approved accessible repeat contract exists.
- Boundary control is disabled with native/semantic disabled state.
- Primary action locks immediately and keeps the chosen quantity/quote visible while pending.

### States

- **Quote loading/stale:** disable Continue; show stable placeholders, not a guessed total.
- **No legal quantities:** out-of-service/help state; do not default to a fixed quantity.
- **Price error:** preserve chosen option, explain that payment cannot start, permit legal Back.
- **Pending:** stepper and Back disabled if command cancellation is not safe; status says payment is being prepared.

### Required backend data / events

- layout/effect/bundle summary;
- ordered allowed quantity options and selected/default option;
- canonical price breakdown and formatted total for each accepted option or quote request;
- legal quantity/payment-start and Back commands;
- quote/version identity so a stale price cannot be submitted.

### Accessibility

- Stepper names include resulting meaning (“Giảm số bản in”, “Tăng số bản in”).
- Announce updated quantity and total as one polite status after each tap.
- Price uses tabular numbers and readable currency order.

### Acceptance tests

1. Every supplied option sequence works, including nonuniform increments; no fixed minimum/step is encoded by UI.
2. Hold, double-tap, and two-finger contact do not jump several options accidentally.
3. Continue cannot submit a stale/unknown total.
4. Preview and total update without layout shift; long currency values do not wrap into action bounds.
5. Special-bundle entry retains its backend selections and follows the actual Back behavior.

---

## 6. Payment / PayOS QR (`PAYMENT_PENDING`)

### Purpose

Present the exact order amount and real PayOS QR, wait for backend-authoritative paid status, and provide safe staff assistance without a public payment bypass.

### Entrance and exit

- **Enter:** accepted quantity/payment-start command.
- **Automatic exit:** backend reports accepted payment → `PREPARING`.
- **Backward exit:** Back → `SELECTING_QUANTITY` and cancels local polling under existing behavior. Do not claim remote PayOS cancellation/refund.
- **Staff cash path:** concealed gesture reveals an authentication surface; only authorized backend confirmation may complete payment.
- Rendering/scanning a QR never exits the screen.

### Layout and dimensions

| Element | 1920×1200 | 1280×800 |
|---|---:|---:|
| Order/amount column | 42–46% | 44–48% |
| QR guidance column | 54–58% | 52–56% |
| QR encoded square | 340–380px | 260–300px |
| White quiet-zone padding | ≥20px | ≥16px |
| Back target | 56×56px | 56×56px |

Reserve the QR square from first render. The outer guidance card may be glass; the QR module is opaque white.

### Actual actions and touch behavior

- Normal customer state has no “I paid,” “Skip,” or public cash-confirm button.
- Back is a deliberate 56px control with confirmation only if the approved payment contract requires one; do not invent a refund promise.
- Staff discovery: 1000ms continuous hold on the payment heading, movement <12px. It opens staff auth; it does not confirm cash.
- Staff PIN/keypad, when architect-approved, uses 64px keys, masks input, rate-limits attempts in backend policy, and has explicit Cancel. No PIN value exists in frontend design docs.
- If an approved QR recreation event exists and is idempotent, “Thử lại tạo mã” is available after creation failure. It is not a payment completion action.

### Countdown / expiry

- Display payment-link expiry only when the backend supplies an authoritative expiry or remaining time.
- Use text plus a small ring/bar; never hardcode a countdown or infer expiry from QR render time.
- At zero, show backend-reported expired state and only legal recreation/Back/staff-help actions.
- A timer does not auto-mark payment successful or reveal a cash bypass.

### States

- **Creating QR:** reserved white square with spinner and “Đang tạo mã thanh toán.”
- **Ready/waiting:** real QR, canonical total, “Hệ thống sẽ tự chuyển bước khi thanh toán được xác nhận.”
- **Polling:** subtle status; no continuous attention animation.
- **Paid pending transition:** replace QR interaction with success status; lock Back/actions while phase reconciliation completes.
- **Creation failed/offline:** customer-safe help message. Offer legal retry only if supported; otherwise Back/call staff.
- **Expired:** mark QR unusable; do not leave stale QR looking active.
- **Unknown payment after disconnect:** freeze actions and reconcile; never recreate or complete automatically.
- **Staff auth failure:** remain in payment, clear masked entry, show generic error without revealing credentials.

### Required backend data / events

- canonical order summary/amount, payment order identity kept nonsecret, QR payload/image, link state, optional expiry, polling/paid state, payment method after acceptance;
- legal Back/cancel-poll, recreate-link (if approved), staff-auth, and staff-cash-confirm commands;
- capabilities and classified errors (offline, timeout, rejected, malformed);
- session/generation identity to reject late QR/paid callbacks after Back.

### Accessibility

- QR has a visible instruction; screen readers receive payment purpose and amount, not the raw QR payload.
- Poll updates are throttled; announce paid/error once.
- Staff hold has an authenticated operator-equivalent discovery path only if approved; it must not be advertised to customers.
- Error copy never relies on warning color alone.

### Acceptance tests

1. Loading → QR causes zero geometry shift and QR remains scannable from representative phones.
2. QR render/scan does not mark paid; only authoritative paid state advances.
3. Late QR/paid callback after Back cannot move the returned/new session.
4. Public UI never exposes cash confirmation, simulator completion, or a zero-price bypass.
5. Hold with >12px movement, pointer cancel, or early release does not reveal staff auth.
6. Duplicate authorized cash taps dispatch once and reconcile uncertain results rather than replay.
7. Expiry displays only supplied values and never hardcodes a duration.
8. Long order/layout names and large totals fit at both viewports and scaling fallbacks.

---

## 7. Camera preparation (`PREPARING`)

### Purpose

Provide a brief, calm pose/setup cue while the backend starts Live View. It is transitional and has no customer command.

### Entrance and exit

- **Enter:** accepted payment/staff-payment completion.
- **Exit:** backend phase becomes `LIVE_VIEW`; the frontend does not run an independent route timer.
- V1 source includes a brief controller delay before `LIVE_VIEW`; preserve phase behavior without using a UI hardcoded timer to force transition.
- No Back, cancel, “Ready,” or “Skip.”

### Layout and dimensions

- 58/42 split: large pose silhouette/approved guide and instructions.
- Guide: 520×780px wide / 340×510px compact, aspect-contained.
- Dynamic information row: capture total, selection requirement, and countdown seconds shown as separate chips when available.
- If actual Live View is already available, a muted contained preview may replace the guide only when approved; do not imply capture readiness until phase/capability says so.

### States

- **Normal:** “Chuẩn bị tạo dáng” with configured count/timing summary.
- **Live View starting slowly:** retain instruction, add honest “Đang kết nối camera.”
- **Permission/device unavailable:** this desktop app should not invent a browser permission prompt. Show backend reason and transition/recovery only as authorized.
- **Stream absent:** never loop stock video or call the camera ready.

### Required backend data / events

- phase, selected layout/effect, configured counts/timing, camera/live-view readiness and classified status;
- no customer command; automatic phase event/snapshot only.

### Accessibility

- Announce preparation once, not every stream probe.
- Pose art is decorative; instructions are text.
- Dynamic count labels include units and distinguish shots from selections.

### Acceptance tests

1. No tappable affordance can bypass camera startup or payment.
2. A delayed stream does not force `LIVE_VIEW` locally.
3. Nondefault capture/select/countdown values render independently with plural-safe localization.
4. Missing camera is truthful and does not display a false preview or fake permission success.

---

## 8. Live View + Countdown + Capture (`LIVE_VIEW`, `COUNTDOWN`, `CAPTURING`)

### Purpose

Show a large, correctly oriented Live View, initiate the configured capture sequence once, communicate every authoritative countdown/capture phase, and show progress through the configured total without obscuring faces.

### Entrance and exit

- **Enter:** backend phase `LIVE_VIEW` after preparation.
- **Initial action:** one shutter tap requests the existing capture sequence.
- **Automatic loop:** backend controls `COUNTDOWN → CAPTURING → LIVE_VIEW` for each configured shot.
- **Exit:** after all authoritative captures, backend enters `SELECTING_PHOTOS`.
- No Back, cancel, per-shot retake, or intermediate Next action.

### Selected layout: Viewfinder + rail

| Region | 1920×1200 | 1280×800 |
|---|---:|---:|
| Outer inset/gap | 32px / 24px | 16px / 16px |
| Viewfinder width | ~1450px max (75–78%) | ~950px max (74–76%) |
| Rail width | 340–400px | 250–290px |
| Viewfinder height | content height, source contained | content height, source contained |
| Countdown numeral | 220–300px | 144–200px |
| Shutter | 112–120px | 104–112px |
| Progress label | 22–24px | 18–22px |

At short effective heights, the rail becomes a 120–152px bottom dock: shutter on one side, progress/status center, countdown numeral on the other. Live View retains the largest remaining region.

### Media and orientation

- Use the authoritative live source aspect; `contain` within matte-black letterboxing.
- Mirror/rotate only from approved camera metadata/legacy parity rule. The display transform must not alter the captured file unless the backend contract says it does.
- Crop guide uses `layout.photoAspectRatio`/slot metadata, not the full print aspect. Dim outside crop modestly (≤45%); keep faces visible.
- Never animate, blur, scale, or transition the video/frame stream itself. Animate UI layers only.
- If frame transport stalls, retain the last frame only when clearly labeled “Hình ảnh tạm dừng”; otherwise show unavailable.

### Actual actions and touch behavior

- Shutter: 104–120px concentric control, visible label, immediate press response, optional nonblocking haptic.
- On accepted shutter tap, lock in the same frame and show “Đang bắt đầu”; do not wait for the press animation to dispatch.
- Hide/disable shutter throughout `COUNTDOWN` and `CAPTURING` and after sequence completion.
- Countdown rail shows backend numeral. It may crossfade ≤200ms; skipped snapshots are not synthesized.
- Progress: localized “Ảnh completed / total” plus segmented/ring representation generated from total. No assumed total.
- Capture feedback: brief optional flash confined to Viewfinder, reduced-motion aware; never blocks shutter timing or claims synchronization.

### Overlay safety

- Only crop guide and a small recording/status indicator may overlay the Viewfinder.
- Countdown, progress, help, and shutter stay in the rail by default.
- If compact fallback must overlay a numeral, place it in the largest detected safe margin when metadata exists; otherwise use a top/bottom band, not face center.

### States

- **Live ready:** shutter enabled only when backend capability says sequence can start.
- **Preview loading:** stable matte stage and status; shutter disabled with reason.
- **Sequence request pending:** shutter locked; indeterminate status, no fake countdown.
- **Countdown:** numeral + upcoming shot position; no additional actions.
- **Capturing/transferring:** “Đang chụp”/“Đang lưu ảnh” from actual status; progress increments only when a valid moment is accepted.
- **Preview missing/disconnected:** explicit camera unavailable. No silent webcam/hot-folder fallback.
- **Capture failed:** show authoritative error; legal recovery action only if backend exposes one. Never auto-replay a shutter after an uncertain result.
- **Stream stale/IPC disconnect:** freeze commands and reconcile session state.

### Required backend data / events

- phase, session identity, camera capability/readiness/status, safe live-preview handle/source and dimensions, orientation/mirror metadata;
- selected layout photo-slot/crop aspect;
- configured `shotCount`, `countdownSeconds`, authoritative current numeral, completed/accepted moments, current shot position, capture/transfer error;
- one legal start-sequence command and subsequent authoritative snapshots/events;
- optional recording status, never inferred from a decorative indicator.

### Accessibility

- Shutter name: “Bắt đầu chuỗi chụp ảnh.”
- Countdown change is announced once per backend value; progress is announced after accepted captures, not per frame.
- Viewfinder has a static accessible description; crop guide has concise instructional text outside the image.
- High-contrast mode strengthens guide and rail boundaries without flashing.

### Acceptance tests

1. Test multiple configurations where capture total, selection quota, and countdown all differ; no hardcoded numeral/segment count appears.
2. One shutter tap starts one sequence; rapid taps, hold, two fingers, and stale responses cannot start another.
3. Progress increments only for authoritative accepted moments.
4. Preview stays aspect-correct and orientation-correct for portrait/landscape sources; no CSS stretch.
5. Countdown remains readable at booth distance and does not cover the preferred face region.
6. Missing/stalled stream never masquerades as a real camera and never silently changes source.
7. Reduced motion removes numeral scaling/flash while preserving timing text.
8. No UI animation delays capture, transfer, or backend polling.

---

## 9. Photo Review / Selection (`SELECTING_PHOTOS`)

### Purpose

Review all valid captures, select exactly the configured requirement in a clear order, inspect images at useful size, and deliberately confirm before frame selection.

### Entrance and exit

- **Enter:** backend completes capture sequence.
- **Exit forward:** explicit confirmation, allowed only when selected count exactly equals configured `selectCount`, → `EDITING`.
- **Back:** do not present as retake; the legacy controller does not move backward from this phase.
- **Cancel:** existing cancellation affordance is concealed/secondary, opens destructive confirmation, and is legal only here and Frame selection.
- **Timeout:** show backend remaining time. Existing backend behavior may fill missing selections and auto-print with `userConfirmed=false`; do not reinterpret it as Home or revenue-bearing confirmation.

### Layout and dimensions

- Wide: 60–64% review rail/grid; 36–40% current composition/selection stack.
- Compact: 62/38 split; captured images use a horizontal `TouchCarousel` with visible adjacent item and 56px arrows when a grid would make targets too small.
- Thumbnail minimum active size: 144×144px compact; 176×176px wide, adjusted to photo aspect.
- Footer action: 64–72px high, stable position.
- Timer/cancel affordance occupies header edge and never overlaps thumbnails.

### Actual actions and touch behavior

- Tap a thumbnail to select/deselect. Selected order is shown as a high-contrast ordinal badge, not merely a check if order matters.
- When quota is full, remaining thumbnails stay inspectable but selection is disabled with “Đủ số ảnh”; tapping can either explain or require deselect first—never silently replace unless backend explicitly defines replacement.
- Swipe carousel is optional; 56px arrows and thumbnail strip/grid remain.
- Hold-to-preview may open a contained lightbox, but an explicit 48/56px “Xem lớn” affordance must also exist because hold is not discoverable/accessibility-complete.
- Pinch zoom in lightbox is optional viewing only; it must not mutate crop/order.
- Confirm button remains explicit and does not auto-advance as soon as the quota is reached.

### Liquid-glass treatment

- Thumbnail rim can be glass; image pixels remain unfiltered.
- Selected item uses champagne-dark 3px border + ordinal + “Đã chọn.”
- Composition preview floats as paper without a nested white dashboard card.
- Footer action dock is one glass layer; avoid individual glass buttons inside a glass card where contrast suffers.

### States

- **Moment processing:** tile placeholder with “Đang xử lý”; nonselectable.
- **Missing/corrupt photo:** error tile with stable position and operator-safe reason; do not count it.
- **Empty captures:** explicit camera failure/recovery state; no fabricated image or retake button unless a legal event exists.
- **Confirm disabled:** show `{selected}/{required}` and instruction.
- **Confirm pending:** lock thumbnails, cancel, and action until authoritative response; avoid timeout double-action race.
- **Timeout imminent:** increase text prominence only; no panic animation.
- **Lightbox:** close target 56px, swipe/arrows for next/previous, contained original/preview.

### Required backend data / events

- ordered valid captured moments with stable IDs, safe preview handles, readiness/error and dimensions;
- selected moment IDs in authoritative order;
- configured `selectCount`, inactivity remaining, timeout outcome/status;
- legal toggle, confirm-selection, cancel-session, cancel-confirmation commands;
- optional authoritative composition preview and current selection mapping.

### Accessibility

- Tile names include capture order/label and selection ordinal.
- Selection count is a polite status; timeout warning announced only at meaningful thresholds supplied by policy, not every second.
- Carousel exposes position and arrows; lightbox has dialog semantics and close focus.
- Cancel is labeled as ending the session and requires confirmation.

### Acceptance tests

1. Select/deselect/reorder semantics match backend order for arbitrary capture and selection counts.
2. Reaching exact quota enables Confirm but never auto-advances.
3. Selecting beyond quota is prevented without silently dropping another selection.
4. Corrupt/null images cannot be selected or counted.
5. Confirm vs timeout race results in at most one backend outcome and preserves `userConfirmed` distinction.
6. Back does not invent a retake route.
7. Cancel is available only in legal phase, needs destructive confirmation, and clears customer data only after acknowledgment.
8. Swipe, arrows, lightbox close, pointer cancel, and long press work without ghost selections.

---

## 10. Framing / Crop (`EDITING`)

### 10.1 Frame selection — actual required surface

#### Purpose

Choose one available frame while inspecting an authoritative composition preview, then explicitly continue to the final print preview.

#### Entrance and exit

- **Enter:** confirmed photo selection.
- **Exit forward:** choose an available frame, then use the existing frame-confirm action → `PRINT_PENDING`.
- **Exit backward:** Back → `SELECTING_PHOTOS` with prior selection retained according to backend.
- **Cancel:** legal here through the existing destructive confirmation flow.
- **Timeout:** authoritative backend behavior may choose a default and auto-print with `userConfirmed=false`; UI does not manufacture a manual confirmation.

#### Layout and dimensions

- Wide: authoritative composition preview 52–58%; frame grid/rail 42–48%.
- Compact: preview 44–50%; two-column frame grid with ≥152px card width or horizontal carousel with 56px arrows.
- Frame thumbnail image: contained, preserving transparent PNG and target layout aspect.
- Footer: Back secondary + “Xem bản in” primary, each ≥64px high.

#### Actual actions and touch behavior

- Tap frame card to select and request/receive preview; do not commit print or revenue.
- Explicit primary action confirms frame selection and enters Final Preview. This preserves the discovered confirmation behavior and provides a clear chance to inspect.
- Rapid frame taps are latest-intent-wins for reversible preview only; stale previews may not overwrite the current frame.
- Confirm locks immediately; a destination print action is protected from pass-through double tap.

#### States

- **Frames loading/empty:** no fabricated accepted frame. If the backend provides an actual default frame, label it; otherwise disable confirmation and request staff help.
- **Preview composing:** retain prior valid preview with loading veil outside image; confirmation disabled until current frame result is authoritative.
- **Frame unavailable/missing PNG:** disabled card with reason; never draw a fake overlay.
- **Confirm pending:** lock grid, Back, cancel, and primary.
- **Timeout:** use backend time and outcome; do not restart locally on arbitrary touches unless approved.

#### Required backend data / events

- selected layout/moments; available frames filtered for layout/event; current frame; safe frame assets;
- authoritative composition preview/result and error keyed to frame/selection revision;
- inactivity remaining;
- legal choose-frame, confirm-frame, Back, and cancel commands.

#### Accessibility

- Cards expose title, compatibility, selected state, and unavailable reason.
- Preview alt text identifies it as a composition preview, not a guaranteed printed result.
- Timer/cancel semantics match §9.

#### Acceptance tests

1. Only compatible backend frames render as selectable.
2. Rapid A→B taps cannot let late A preview replace B.
3. Confirm is explicit, dispatches once, and cannot land on Confirm & Print through a ghost tap.
4. Empty/missing frame does not silently accept a fake default.
5. Back preserves authoritative selection; cancel remains phase-limited and confirmed.
6. Frame artwork and composition are contained without CSS reconstruction or stretching.

### 10.2 Crop adjustment — capability-gated, not a new route

**Current authority:** no standalone customer crop stage or crop command is established in the audited V1 flow; the compositor performs its own crop. Therefore V2 must omit crop-editing controls by default. The following is a design contract only if the architect later confirms an existing/approved reversible crop transform contract. It remains inside `EDITING`, never between states.

#### Conditional purpose

Adjust the selected image within a declared photo slot without changing layout, aspect, image order, or backend composition rules.

#### Conditional interaction

- Enter a same-screen crop sheet for one slot from a clearly labeled slot control only when capability is true.
- Aspect is locked to the backend slot aspect. No freeform aspect, rotate, face retouch, Beauty, or layout change.
- Two-finger pinch zoom and one-finger pan on the crop surface; scale and translation are clamped so no empty area enters the slot.
- Provide non-gesture equivalents: 56px `−/+` zoom controls, four 48/56px nudge controls or an accessible two-axis mechanism, and Reset.
- TouchSlider, if used for zoom, has a 48px track hit area and discrete semantic value; it is not the sole control.
- “Áp dụng” requests the approved reversible transform; “Hủy” restores the last authoritative transform. Neither advances session phase.
- A preview is authoritative only after backend recomposition. Optimistic guides are labeled “xem trước điều chỉnh” until acknowledged.

#### Conditional states and tests

- Disable Apply while transform is invalid or recomposition pending.
- On error, retain the prior accepted transform and allow safe retry only if transform request is idempotent.
- Verify one/two-finger transitions, pointer loss, accidental palm contact, reset, bounds, portrait/landscape slot, and identical backend print preview.
- If this contract is absent, no disabled “coming soon” crop button appears in customer flow.

---

## 11. Final Preview + Confirm & Print (`PRINT_PENDING`)

### Purpose

Present the largest trustworthy final composition and order summary, then require an unmistakable explicit confirmation before any irreversible print/revenue path.

### Entrance and exit

- **Enter:** accepted frame confirmation.
- **Exit forward:** explicit Confirm & Print requests `startPrinting(userConfirmed=true)` → `PRINTING` only when accepted.
- **Exit backward:** Back → `EDITING`.
- There is no “retake photos” path. “Retry” means retrying an idempotent preview/composition operation only if the backend explicitly supports it; it never jumps to Capture.
- Existing inactivity may continue into this phase and can auto-print with `userConfirmed=false`; UI must not relabel that outcome as the guest pressing Confirm.

### Layout and dimensions

- Composition stage 60–66%; summary/action 34–40%.
- Final preview: up to 82% content height, contained at backend image aspect, paper shadow only.
- Summary rows: ≥48px rhythm, hairline separators, no dense receipt card.
- Confirm & Print: 72px wide / 64px compact, matte-black fill with ivory label and champagne focus.
- Back: 56px target, visually secondary and spatially separated ≥24px from primary.

### Actual actions and touch behavior

- Confirm requires completed tap inside the control; pointer drift/cancel aborts.
- On activation, lock synchronously and change copy to “Đang xác nhận…” while retaining full summary.
- Never place primary Confirm under the prior Frame card location if direct-advance variants are ever used; preserve input-safe arming to defeat ghost taps.
- Back is disabled once irreversible command acceptance is uncertain/pending; reconcile first.

### States

- **Preview ready:** show source metadata only when verified; do not claim DPI/physical output from a thumbnail.
- **Preview loading:** reserved aspect box, confirmation disabled.
- **Preview failed:** no print action. Offer legal Back; safe recomposition retry only when supported.
- **Command pending:** action locked and announced; no progress fiction.
- **Rejected:** remain on screen, show classified reason, unlock only if safe.
- **Uncertain/disconnected:** no automatic retry. Show “Đang kiểm tra trạng thái in” and require reconciliation/operator support.
- **Timeout warning:** backend time only; explain actual policy without implying revenue.

### Required backend data / events

- final authoritative composition/paper preview handle and dimensions;
- layout/effect/frame titles, selected-photo count, print quantity, canonical payment/order summary, export summary where supported;
- inactivity remaining and origin (`manual` vs timeout) maintained in backend;
- legal Confirm & Print and Back commands; idempotency/command identity and accepted/rejected/uncertain result;
- printer capability/status sufficient to gate the command without frontend guessing.

### Accessibility

- Primary name explicitly mentions printing and, only when supported, QR creation.
- A short warning explains the action is final; not a coercive modal unless existing policy requires it.
- Summary is semantic description/list, not a data table that forces horizontal scrolling.
- Pending/rejected/uncertain status is announced once.

### Acceptance tests

1. Merely entering/previewing cannot print or record revenue.
2. Double tap, hold, pass-through tap, and reconnect dispatch at most one print request.
3. Back works before request and cannot race an accepted/uncertain request.
4. Preview failure removes/disabled the print action; no blank composition can be submitted.
5. Timeout path remains `userConfirmed=false`; manual Confirm remains true; the UI does not alter this gate.
6. Revenue is not displayed/recorded as successful from payment, composition, or screen entry.
7. Final image is contained and not called “physical print complete” or “600 DPI” without verified metadata.

---

## 12. Printing / status (`PRINTING`)

### Purpose

Prevent further input while composition, album/QR, printer, and upload work occurs; communicate only backend-observed states; transition automatically to Delivery.

### Entrance and exit

- **Enter:** backend accepts manual or timeout print flow.
- **Exit:** backend enters `DELIVERY` according to existing orchestration.
- No customer Back, Cancel, Retry, Reprint, or Home action.
- Operator recovery may be exposed only through a separate authenticated route/capability.

### Layout and dimensions

- Centered matte/ivory editorial status field with final thumbnail ≤300×450px wide / ≤220×330px compact.
- Status title 30–44px; activity ring 56/64px.
- Pipeline labels may occupy a horizontal row only when the backend reports those exact stages; at compact widths use a vertical or two-row arrangement.
- No fake determinate percentage. Use indeterminate motion plus textual phase when no fraction exists.

### Actual presentation behavior

- Preserve the same screen geometry as statuses change to avoid apparent resets.
- A visual pipeline may include compose, print submission, album/QR, and video **only** when each state is explicitly backed by current events. Unknown work uses one neutral “Đang hoàn thiện” status.
- Differentiate at minimum when data permits: preparing file, submitting, submitted/accepted, uncertain, failed. “Submitted” is not “paper delivered.”
- Keep display awake under host policy; no touch action should alter the job.

### States

- **Working/unknown fraction:** indeterminate ring and exact backend status.
- **Composing/uploading:** label only if authoritative.
- **Printer disabled/file-only:** clearly say file generated, not printed; delivery messaging follows backend result.
- **Printer offline/rejected:** failure card; no automatic resubmission.
- **Submission uncertain:** reconciliation/operator state; never show success.
- **Cloud/album failure with print continuing:** separate channel statuses if backend exposes partial outcomes.
- **IPC/app restart:** system recovery lock; side-effecting command is never replayed automatically.

### Required backend data / events

- immutable session/print job identity;
- phase and classified composition/printer/upload/album statuses, optional real progress fraction;
- print acceptance evidence level, final output/QR readiness, errors safe for customer display;
- automatic authoritative transition to Delivery or approved recovery state.

### Accessibility

- Status updates use a polite live region and are throttled.
- Failure/uncertain state uses alert semantics once.
- Spinners have adjacent text; motion is not the sole indication.

### Acceptance tests

1. No touch or keyboard activation can cause reprint/cancel/home.
2. Unknown fraction never renders a fabricated percentage or completed milestone.
3. File generation, spool submission, queue acceptance, and physical completion use distinct language.
4. Failure/uncertain outcome never automatically retries a physical print.
5. Partial album/QR failure does not falsely mark print failed/successful unless backend says so.
6. Screen survives long jobs and scaling without Windows sleep/overflow under approved host policy.

---

## 13. QR Delivery (`DELIVERY`)

### Purpose

Show the final session outcome, provide a real scannable Cloudinary/web-album or approved local delivery URL when available, explain print handoff truthfully, and let the customer finish.

### Entrance and exit

- **Enter:** backend `DELIVERY` with export summary that may continue to update.
- **Exit:** explicit Finish → authoritative reset → `IDLE`.
- There is no separate Completion route. While Finish is pending, use §14’s completion treatment.
- Any auto-return/timeout appears only if the backend supplies an approved configured timer and reset event. Audited V1 routing does not establish a universal Delivery timer; no fixed duration is invented here.

### Layout and dimensions

| Element | 1920×1200 | 1280×800 |
|---|---:|---:|
| Outcome/summary column | 46% | 48% |
| QR column | 54% | 52% |
| QR encoded square | 340–400px | 260–304px |
| White quiet-zone padding | ≥20px | ≥16px |
| Finish | 320–440×72px | 280–360×64px |

Final print thumbnail may appear near summary, contained and ≤38% of content height. It must not reduce QR below reliable scanning size.

### Actual actions and touch behavior

- Finish is the only mandatory customer action; lock once and wait for acknowledged `IDLE` before revealing Welcome.
- QR itself is not a button.
- “Mở album,” “Sao chép liên kết,” or OS Share may be shown only if the existing approved desktop bridge exposes the respective safe action. V1 has open-album/output callbacks, but copy/share is not assumed. If absent, omit rather than show a dead control.
- Any copy confirmation says only “Đã sao chép liên kết”; never display access tokens or raw private payloads.
- A supplied timeout ring/text must not interfere with scanning and resets only through approved interaction policy.

### States

- **QR ready:** opaque real QR + concise phone instruction + expiry text only if authoritative.
- **Album/upload pending:** reserve QR region, explain photos are being prepared; no fake QR.
- **No QR/failed:** completed-session heading plus staff-help/file-delivery guidance; never generate a placeholder link.
- **Print submitted/uncertain/failed:** use exact backend language; do not tell customer paper is ready based solely on driver return.
- **Late upload update:** apply only while same session remains active; after Finish, it cannot leak into Welcome/next session.
- **Finish pending:** completion treatment with all other actions disabled.

### Required backend data / events

- export summary, actual QR URL/payload and validity/expiry, upload/album status, safe final thumbnail;
- captured count and requested copies from authoritative state;
- print result/evidence level and customer-safe status;
- optional capabilities for open/copy/share and optional configured remaining time;
- legal Finish/reset command and acknowledgment.

### Accessibility

- QR purpose and delivery status are readable as text; do not announce raw URL/token.
- Finish label states return to start/new customer.
- Pending and failed states are announced once.
- Optional share controls include destination/action names and remain ≥56px.

### Acceptance tests

1. Real URL yields a stable, high-contrast, phone-scannable QR; absent URL yields no QR graphic.
2. Cloudinary/album error does not fabricate a link or mark upload complete.
3. Finish dispatches once, waits for `IDLE`, and clears all prior customer media.
4. Late async updates after Finish are rejected by session identity.
5. Print language reflects evidence level and never promises physical completion without proof.
6. Copy/share/open controls appear only with approved capabilities and do not expose secrets.
7. Any timeout uses backend values; no design constant controls reset.

---

## 14. Completion / Thank you (visual treatment, not a route)

### Purpose

Give immediate reassurance after Finish while the backend clears the session, without inserting a new workflow state or letting the next customer see previous data.

### Behavior

- On Finish activation, replace controls with a restrained success mark and “Cảm ơn bạn · Đang kết thúc phiên.”
- Keep it on the existing Delivery surface only until authoritative `IDLE` arrives.
- On `IDLE`, hard-clear session-bound image/QR components before the Welcome entrance animation.
- If reset fails/disconnects, change to recovery copy; do not optimistically show a fresh Welcome over retained data.
- Do not impose a fixed celebratory delay. Backend acknowledgment determines exit; motion is ≤250ms and reduced-motion safe.

### Dimensions / accessibility

- Success mark 64–80px; title 30–44px; no confetti, flashing, or autoplay sound.
- Status uses polite announcement. Error during reset becomes an alert with staff guidance.

### Acceptance tests

1. No extra session state/event is required.
2. Previous photos/QR are inaccessible before Welcome becomes interactive.
3. Reset rejection does not permit a new Start.
4. Reduced motion uses an immediate static status.

---

## 15. Admin / Studio operator workspace (`ADMIN`)

### Purpose and separation

Provide an authenticated, touch-capable operator workbench for the six source-observed areas: **Frames, Layouts, Settings, Tools, Colors, Revenue**. This is not a customer dashboard and cannot be reached merely because the hidden gesture was discovered.

In this document, **Studio operator workspace** means these Admin-managed catalogs/tools. It must not be confused with the customer-facing Studio layout/effect surface in §4, and it is not a new routed session phase.

### Entrance and exit

- **Discovery:** existing concealed Welcome gesture or startup fallback.
- **Authentication/authorization:** required for commercial V2; exact ACL/PIN mechanism is architect-owned. Until approved, Admin mutations remain unavailable.
- **Enter:** only authoritative `ADMIN` phase/authorized operator context.
- **Exit:** preserve V1 save-on-exit behavior for settings drafts, then reset to `IDLE`; saving outcome/error policy must be explicit. Do not silently discard or claim save success.
- Admin tabs never transition a customer session to arbitrary phases.

### Workspace geometry

| Region | 1920×1200 | 1280×800 |
|---|---:|---:|
| Header | 88px | 72px |
| Navigation rail | 264px vertical | 100%×64px horizontal, scrollable with arrows |
| Main content inset | 40px | 24px |
| Form row minimum | 64px | 56px |
| Primary operator target | 56px | 48–56px |
| Modal width | 640–840px | 560–720px |

Admin content may scroll inside the body. Header and Save/Exit status remain fixed. Dense tables collapse to cards at compact widths; do not require horizontal precision or hover.

### Shared operator behavior

- Persistent environment/device banner names simulation, disconnected, disabled, ready, and uncertain honestly.
- Draft vs persisted values are visibly distinct. Save provides pending/success/error acknowledgment.
- Where the approved source/backend contract already requires destructive confirmation, retain it with the item name and consequence. Where an unsafe legacy mutation lacks a reviewed gate, leave it unavailable until product/architect approval rather than silently inserting or removing a workflow step. Revenue adjust/void retains its required reason and existing business validation.
- Secret/deployment credentials are never rendered in frontend forms or diagnostics.
- Unsafe/unimplemented actions are hidden or visibly disabled with reason; never simulated as successful.
- Test print, real payment, live uploads, device mutation, and file deletion require explicit capabilities and approvals. A design spec does not authorize them.

### 15.1 Frames and event bundles

**Actual scope:** standard frames grouped by print size/layout; special frames grouped by event; empty state; frame deletion; event cover/expand/delete operations where contracts exist; add custom PNG callback exists.

- Use aspect-contained frame thumbnails over checker/ivory preview, title, layout compatibility, source/status.
- Add/import uses approved safe desktop file picker, not browser path entry.
- Delete and event removal retain the source-observed confirmation behavior where one exists. If a destructive V1 path has no confirmation, do not silently add or remove a business gate in UI: keep the mutation unavailable until the product/architect explicitly approves a safe parity adaptation. Never expose arbitrary filesystem paths.
- Event bundle editor shows target layout/frame validity; invalid bundles cannot be published/selectable.
- Loading/empty/error states preserve grouping and offer Refresh only if an event exists.

### 15.2 Layout management

**Actual scope:** list, edit, delete; edit price, shot count, and countdown; V1 controller callback persists price/count/countdown. Selection count/slot geometry management must reflect actual contract, not invented fields.

- Layout card shows print dimensions, enabled/status, independent capture/select/countdown values when supplied.
- Numeric input uses 56px steppers/on-screen keypad; ranges and validation come from backend configuration, not design assumptions.
- Persisted value, draft, validation error, and saving state remain visible.
- Delete uses only the confirmation and referential-integrity behavior defined by the approved backend contract. The UI must not invent a cascade/rejection rule; if the consequence cannot be stated safely, leave deletion unavailable pending product/architect review.
- A live customer session cannot receive an unsafe mid-session config mutation; apply timing is displayed (`now`, `next session`, or restart) only from backend policy.

### 15.3 Device / printer / camera settings

**Source-observed settings:** print enable, camera source/Hot Folder choice/path, camera parameters when available, and configured timeouts. Deployment secrets remain outside the operator UI unless separately approved.

- Device cards show source, connection/readiness evidence, last checked time, and capability—not optimistic green dots.
- Printer card distinguishes disabled, undiscovered, offline, queue unknown, submitted, and error where observable.
- Camera card distinguishes Canon/webcam/Hot Folder configuration from actual connected/live/capture capability.
- Native camera settings (ISO, Av, Tv, white balance, picture style) render only when the approved camera adapter exposes safe values/events.
- **Test print:** show only when an approved test-print event and physical authorization exist. Require a confirmation naming printer/media and clearly mark that paper/ribbon will be consumed. Otherwise omit/disable with “Chưa được cấp quyền”; never dispatch a real print from mock UI.
- **Reconnect/discover:** do not invent controls. Mount them only with idempotent architect-approved events.
- Path chooser uses safe V2 paths and never points at V1/production folders.

### 15.4 Tools / layout calculator

**Actual scope evidence:** image/slot measurement, layout metadata, import/pre-punched frame, QR geometry fields, save/copy-related operations and Firebase/local mutations exist in V1 Tools, but V2 contracts may be unavailable.

- When unsupported, render an honest capability explanation with all mutation/file/Firebase actions absent or disabled.
- When approved, use a large canvas with 56px zoom/fit controls, numeric property panel, non-destructive preview, validation summary, and explicit Save.
- Never label a static illustration as a functioning calculator.
- Clipboard, filesystem, upload, and catalog publish are separate capabilities and outcomes.

### 15.5 Colors / LUT / effects

- Show effect cards, enabled state, actual preview request/result, LUT import status, and existing delete confirmation.
- Preserve algorithm, LUT, Beauty presets, thresholds, and fallbacks; the UI does not research or change them.
- Latest preview intent wins; stale result cannot overwrite.
- Import requires approved file filter/path bridge and error detail safe for operator; no raw secret/body logs.
- Customer `EDITING` is not this color tool.

### 15.6 Revenue

- Filters: source-observed periods (Today, 7 days, this month, last month) and refresh, if supported by current API.
- Summary metrics, chart, print-size/extra-print breakdown, recent transactions, adjustment and void dialogs.
- Amounts use backend decimal/integer formatting; never JavaScript floating-point recalculation.
- Adjustment/void requires reason, validation, confirmation, pending acknowledgment, and auditable result. Void is not claimed to be a PayOS refund.
- Loading, remote/local sync state, empty, classified error, and stale data timestamp are explicit.
- Revenue appears only from the backend ledger; Admin UI never creates a sale because payment succeeded or a preview opened.

### 15.7 Diagnostics

Diagnostics may aggregate existing read-only evidence: app/bridge version, mode, device capability, last classified errors, redacted job/session IDs, queue state if observable, and safe logs/export if approved.

- Redact credentials, QR payload tokens, customer filenames/images, raw HTTP bodies, and private URLs.
- “Run diagnostic” exists only for bounded, read-only approved checks. It cannot capture, print, pay, upload, or modify configuration.
- Health uses text + icon + evidence timestamp; no green “Ready” based on configured mock data.

### Admin states

- **Auth locked:** no settings/data glimpses behind translucent modal.
- **Loading:** skeleton layout with navigation disabled until permissions known.
- **Read-only/permission denied:** fields display but mutation actions absent/disabled with reason.
- **Draft invalid:** inline field errors, Save disabled, persisted values still visible.
- **Saving:** controls locked only within affected scope; Exit policy follows architecture.
- **Save failed:** preserve draft and show retry only when idempotent.
- **Bridge disconnected:** freeze mutations, retain data labeled stale, reconcile after reconnect.

### Required backend data / events

- authenticated operator identity/role/capabilities and phase;
- complete six-tab catalogs/settings/statuses as applicable;
- typed read and mutation commands with validation, apply timing, acknowledgment, idempotency, and audit metadata;
- device/printer/camera capability and evidence-level statuses;
- safe file-picker/clipboard/log export capabilities;
- no secret values in frontend snapshot.

### Accessibility

- Tabs are a labeled tablist with selected state and text labels.
- Forms have persistent labels, units, validation association, and touch keypad alternative.
- Data visualizations include textual summaries.
- Modals trap focus, identify destructive consequence, and return focus.
- High-contrast toggle is reachable in Settings and previewable without making unsaved global changes unexpectedly.

### Acceptance tests

1. Hidden Welcome gesture alone cannot expose or mutate Admin data.
2. All six tabs render loading/empty/error/read-only/pending states at both viewports.
3. Save/exit cannot silently lose drafts or claim persistence without acknowledgment.
4. Unsupported test-print/camera/printer/file/Firebase actions cannot execute.
5. If authorized test print exists, it requires explicit confirmation and cannot target a production device in automated tests.
6. Counts/countdowns/prices use canonical validation and safe apply timing; active session is not mutated unexpectedly.
7. Revenue adjust/void retains reason/confirmation and never claims PayOS refund.
8. Diagnostics contain no secrets/customer paths/images and never infer hardware readiness from mock state.

---

## 16. Empty / Error / Recovery / Out-of-service

### Purpose

Keep the kiosk safe and truthful when startup, bridge, catalog, payment, camera, composition, printer, cloud, or reset fails. Error presentation is not permission to invent a new state transition.

### Shared recovery anatomy

1. Plain-language title (“Camera mất kết nối”).
2. One-sentence customer impact (“Chưa thể tiếp tục chụp ảnh”).
3. Evidence-safe status code or reference only for staff, concealed/secondary.
4. One primary legal recovery action, if an approved event exists.
5. Secondary staff-help/auth path.
6. No generic “Retry” for uncertain side effects.

Use an opaque/glass-strong centered panel on ivory or matte-black depending on context. Primary error target ≥64px. System lock (`z.system`) intercepts all underlying touch and labels stale content.

### Recovery matrix

| Condition | Customer presentation | Legal action boundary |
|---|---|---|
| Startup/config slow | “Đang chuẩn bị studio”; stable spinner | After existing fallback eligibility, operator/Admin only. Legacy force-ready is unsafe evidence and must not be exposed as normal customer action without approval. |
| Bridge/IPC disconnected | Freeze commands; “Đang kết nối lại hệ thống” over last state labeled stale | Automatic read-only reconnect/resync may occur; never replay payment/capture/print commands. |
| Empty/invalid layout catalog | “Bố cục chưa sẵn sàng” | Back to Welcome if legal; operator fixes catalog. No fake default. |
| Payment QR creation failed | Keep exact amount; no QR | Approved recreate-link, Back, or authenticated staff cash path only. No public complete-payment. |
| Payment status uncertain | “Đang kiểm tra thanh toán” | Reconcile same order/session; no duplicate order or optimistic paid. |
| Camera disconnected before capture | Dark stage, clear reason | Approved reconnect/recheck only if event exists; no silent source switch. |
| Camera disconnect during/after shutter | Freeze progress, uncertain warning | Backend reconciliation/operator support; never auto-shoot again. |
| No valid captured photos | Empty review with camera error | No invented retake route; follow approved recovery/cancel/operator event. |
| Composition/frame asset failure | Preserve last valid image, mark stale | Back or idempotent recomposition if supported; no print. |
| Printer offline before Confirm | Disable Confirm & Print with reason if capability is authoritative | Operator repair/recheck; no bypass to revenue. |
| Print rejected | Truthful failure | No customer automatic retry/reprint. Authenticated operator reconciliation only. |
| Print result uncertain | “Trạng thái in chưa xác định” | Query/reconcile job; never resubmit automatically or mark success. |
| Album/Cloudinary failure | Print outcome remains separate; no QR | Finish/help according to delivery contract; no fake URL. |
| Session reset failed | Keep completion/recovery lock; hide customer data where possible | Reconcile/reset via approved host/operator action before enabling Welcome. |
| Out of service | Brand, concise reason, call-staff instruction | Hidden authenticated Admin only; no Start. |

### Empty-state rules

- Empty states describe what is unavailable and why the current action is disabled.
- They do not use decorative stock photos that look like captured content.
- A legal Back remains visible where state machine permits it.
- Admin empty states can expose setup guidance; customer empty states remain concise.

### Loading rules

- Reserve final geometry to prevent shifts.
- Use skeletons only for content that is expected, not to imply a device/result exists.
- Long operations move from spinner-only to text status; never add a fake percent.
- Loading cannot mask a timeout indefinitely; backend/host policy decides escalation.

### Accessibility

- Critical error announced once as alert; reconnect/status updates politely.
- Recovery action names the effect (“Quay lại chọn số lượng”), not “OK.”
- Focus moves to error title then legal action; underlying controls are inert.
- Error codes are selectable/copyable in Admin, not required for customer comprehension.

### Acceptance tests

1. Every failure in the matrix disables unsafe underlying actions.
2. Reconnect resyncs state before unlocking and does not replay side effects.
3. Camera/printer/payment uncertainty never becomes optimistic success.
4. No generic retry can duplicate payment order, capture, upload finalization, print submission, or revenue.
5. Out-of-service cannot be bypassed by ordinary customer touch.
6. High contrast, reduced motion, screen reader alerting, and 853×533 fallback keep the legal action visible.

---

## 17. Cross-screen acceptance matrix

### Viewports and scaling

Test each customer screen at:

- 1920×1200 effective CSS viewport;
- 1536×960 (1920×1200 at a common 125% effective mapping);
- 1280×800 (primary compact and a common 150% effective mapping from WUXGA);
- 1024×640 and approximately 853×533 as stress cases for compact hardware scaling.

Record actual `innerWidth`, `innerHeight`, device pixel ratio, WebView zoom, and Windows scale in packaged tests. These approximations are not a substitute for measurements.

### Language and data extremes

- Vietnamese diacritics, Hangul, English, and 30–50-character catalog names.
- Large price/quantity values supplied by fixtures without overflow.
- 0/1/2/many layouts, effects, frames, bundles, and captures.
- Differing capture total, selection requirement, and countdown.
- Portrait/landscape/strip media and missing dimensions.
- No preferred font installed; fallback stack only.

### Input and safety

- Tap, rapid double tap, long hold, pointer drift, swipe, pointer cancel, two-finger contact, and touch during transition.
- No mouse/keyboard needed for customer completion; keyboard/focus remains accessible for testing/operator use.
- Side-effecting commands dispatch once and remain locked through uncertain outcomes.
- Every actual Back edge and only legal cancellation phases.
- Timeout racing with manual selection/frame/print confirmation.

### Truthfulness gates

- QR rendering ≠ paid.
- Camera preview ≠ captured photo.
- Composition thumbnail ≠ verified print resolution.
- File generated ≠ printer submission.
- Submission/queue acceptance ≠ physical print completion.
- Payment/preview/timeout auto-print ≠ revenue.
- Simulation/mock device ≠ real hardware ready.

### Completion gate

This specification is screen-complete only when frontend and architect jointly map every required semantic field/action to an approved contract, identify unsupported controls, and run mounted UI tests. It does not certify PayOS, Cloudinary, Canon, DNP, scaling, or physical touch hardware by itself.

---

## 18. Source-grounding note

Behavior was reconciled against `V1_EXACT_UI_FLOW_MAP.md`, `V1_ACTION_BEHAVIOR_MATRIX.md`, `04_SESSION_STATE_MACHINE.md`, `08_PAYMENT_REVENUE_QR_CLOUD_AUDIT.md`, `UI_SCREEN_INVENTORY.md`, `UI_SCREEN_CONTRACTS.md`, `UI_CAMERA_CONSTRAINTS.md`, and `UI_PRINT_CONSTRAINTS.md`, plus read-only V1 screen source where needed. V1 was not changed. If these documents conflict, the latest architect-approved backend contract and source-verified business gates take precedence over visual convenience.
