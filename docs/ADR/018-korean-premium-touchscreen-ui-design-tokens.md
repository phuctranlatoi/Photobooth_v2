# ADR-018: Modern Premium Korean Touchscreen UI Design Tokens and Layout Plan

**Date:** 2026-11-01  
**Status:** Accepted  
**Authors:** Specialist Solutions Architect (V2)  
**Supersedes/Extends:** Extends ADR-001 (Frontend Stack)

---

## 1. Context and Problem Statement

Commercial photo studio culture in East Asia (particularly Seoul's Haru Film, Photoism, Life Four Cuts / Insaengnekeot, and Monomansion) has set a high global benchmark for self-photo studio kiosks:
- **Atmospheric Palette:** Warm, flattering tones (warm ivory backdrops, blush pink, soft peach, muted terracotta coral, and warm charcoal typography) rather than sterile high-contrast grays or garish primary colors.
- **Touch-First Physical Kiosk Ergonomics:** Modern photobooths feature 16:10 landscape touchscreens:
  - Standard flagship display: **1920 × 1200** (WUXGA 16:10).
  - Compact counter display: **1280 × 800** (WXGA 16:10).
  - Touchpoints must accommodate natural arm reach, no mouse or keyboard requirement, and zero tiny click targets.
- **Seamless Rhythmic Transitions:** Customers expect silky, calming screen transitions (delicate fades, smooth card elevations, tactile button depressions) and an exhilarating, crystal-clear capture countdown with visual flash feedback.

The initial V2 prototype established functional foundations but needs a cohesive, premium design system that strictly adheres to the Korean photobooth atelier aesthetic while scaling responsively across both 1920×1200 and 1280×800 16:10 viewports.

---

## 2. Decision

### 2.1 Color Palette & Design Tokens
We establish a standardized set of CSS custom properties rooted in warm studio tones:

```css
:root {
  /* Surfaces & Backgrounds */
  --k-bg-ivory: #FAF6F0;          /* Warm studio ivory primary backdrop */
  --k-bg-gradient: radial-gradient(circle at 10% 10%, #FFFDF9, transparent 60%),
                   radial-gradient(circle at 90% 90%, #F5ECE3, transparent 50%),
                   #FAF6F0;
  --k-surface-card: #FFFFFF;       /* Pure white card surface */
  --k-surface-blush: #F7EBE8;      /* Delicate blush pink card accent */
  --k-surface-peach: #FCEBD9;      /* Warm soft peach subtle background */
  --k-surface-glass: rgba(255, 255, 255, 0.90); /* Translucent frosted glass */

  /* Accents & Primary CTA */
  --k-coral: #E07A5F;             /* Signature muted coral / terracotta primary */
  --k-coral-hover: #D46A4E;       /* Deepened coral on press */
  --k-coral-active: #B8553A;      /* Active state coral */
  --k-peach-accent: #F4A261;      /* Secondary golden peach */
  --k-mint-success: #3D8B6E;      /* Organic studio green for success */

  /* Typography (Warm Charcoals - Never pure harsh #000) */
  --k-text-headline: #232120;     /* Deep warm charcoal for main titles */
  --k-text-body: #544E4B;         /* Medium warm charcoal for descriptions */
  --k-text-muted: #8C847E;        /* Gentle stone gray for captions/subtitles */

  /* Borders & Dividers */
  --k-border-subtle: #EFE8DF;     /* Soft ivory-gray border */
  --k-border-focus: #E07A5F;      /* High-contrast coral focus ring */

  /* Shadows & Elevation */
  --k-shadow-soft: 0 4px 20px rgba(84, 78, 75, 0.05);
  --k-shadow-card: 0 10px 32px rgba(84, 78, 75, 0.08);
  --k-shadow-elevated: 0 18px 48px rgba(84, 78, 75, 0.14);
  --k-shadow-glow: 0 0 28px rgba(224, 122, 95, 0.28);

  /* Corner Radii */
  --k-radius-sm: 14px;
  --k-radius-md: 22px;
  --k-radius-lg: 32px;
  --k-radius-pill: 9999px;

  /* Typography Hierarchy */
  --k-font-family: 'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### 2.2 Responsive 16:10 Touchscreen Viewport Architecture
Both supported form factors share a **16:10 aspect ratio**:

| Viewport Spec | Resolution | Root Rem | Screen Padding | Primary Preview Canvas | Touch Target Min |
|---|---|---|---|---|---|
| **WUXGA (Flagship)** | 1920 × 1200 | 20px | 40px 64px | 580px × 870px | 64px × 64px |
| **WXGA (Compact)** | 1280 × 800 | 16px | 24px 36px | 400px × 600px | 56px × 56px |

Layout rules:
- **Two-Column Split Ergonomics:** Left column hosts camera Live View / photo composition preview; right column hosts customer interactive decision cards and thumb-reachable action buttons.
- **Primary CTAs:** Sticky or anchored in the bottom-right zone of the viewport, ensuring that even shorter customers or wheelchair users can reach them effortlessly without stretching across the full display.
- **Zero Scroll on Core Screens:** In `Start`, `Quantity`, `Payment`, `Capture`, `Selection`, `Frame`, and `Delivery`, all interactive controls fit on-screen without vertical scrolling.

### 2.3 Screen Transitions & Interaction Motion
- **Screen Handoff:** Gentle fade-and-slide (`opacity: 0 -> 1`, `transform: translateY(12px) -> translateY(0)`) using easing curve `cubic-bezier(0.16, 1, 0.3, 1)` over 280ms.
- **Card Selection:**
  - Unselected: `--k-surface-card`, subtle border `--k-border-subtle`, resting shadow `--k-shadow-soft`.
  - Selected: Border glows `--k-coral`, subtle 2px ring, badge displays checkmark or ordinal number (`1`, `2`, `3`), resting elevation lifts by 4px (`transform: translateY(-4px)`).
  - Touch Feedback: `transform: scale(0.97)` on `:active` with smooth spring recovery.
- **Countdown Animation:**
  - Viewfinder displays full-bleed camera Live View.
  - Pulsing circular countdown timer centered on screen with tabular numeric digits (3, 2, 1).
  - High-intensity camera flash animation (`white` overlay with opacity transition from `0.9` to `0` over 180ms) triggers exactly on state transition to `CAPTURING`.

### 2.4 Accessibility & Touch Guardrails
- Minimum interactive touch area: 56px × 56px (compact) and 64px × 64px (flagship).
- Minimum text contrast ratio: 4.5:1 for body copy, 7:1 for headings against warm ivory.
- Touch action: `touch-action: manipulation` across all buttons and selectable cards to eliminate mobile browser tap delay (300ms double-tap delay).
- User selection disabled (`user-select: none`) across UI chrome to prevent accidental text highlight bars on multi-touch gestures.

---

## 3. Consequences

### Positive
- Instantly elevates customer perception to the level of luxury Korean photo studios.
- Provides consistent, rock-solid layout across the two standard commercial kiosk display formats (1920×1200 and 1280×800).
- Improves user session velocity through intuitive touch ergonomics and clear visual hierarchy.

### Negative / Tradeoffs
- Requires updating existing CSS files (`kiosk-v1.css`, `styles.css`) and adjusting screen components to use semantic token classes.
- Web fonts (e.g. Pretendard or Inter) must be bundled locally to ensure offline rendering on air-gapped photobooth kiosks.
