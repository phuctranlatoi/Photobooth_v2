/** Customer-only, delegated glass feedback. No camera frames or session state are handled here. */

interface LiquidGlassFxOptions {
  rootSelector?: string;
  surfaceSelector?: string;
  maxRipplesPerSurface?: number;
}

const DEFAULT_OPTIONS: Required<LiquidGlassFxOptions> = {
  rootSelector: '.v1-shell.atelier-customer:not(.v1-camera)',
  surfaceSelector: '[data-interactive="true"], [data-glass-interactive="true"], .glass-button, .glass-shutter, .glass-card[data-interactive="true"], .v1-primary, .v1-secondary, .v1-back, .v1-carousel-arrow, .v1-stepper button, .v1-frame-grid button, .v1-photo-grid button, .v1-bundles button, .atelier-event-showcase button',
  maxRipplesPerSurface: 2,
};

let disposeActive: (() => void) | undefined;

export function initLiquidGlassFx(options?: LiquidGlassFxOptions): () => void {
  if (disposeActive) return disposeActive;
  if (typeof document === 'undefined') return () => {};

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const reducedTransparency = window.matchMedia?.('(prefers-reduced-transparency: reduce)');

  // Ambient orbs - only in customer area, not camera/prepare/operator
  const ambient = document.createElement('div');
  ambient.id = 'ambient-liquid-glass';
  ambient.className = 'ambient-liquid-glass';
  ambient.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 3; index++) {
    const orb = document.createElement('div');
    orb.className = `ambient-orb ambient-orb--${index + 1}`;
    ambient.append(orb);
  }
  document.body.append(ambient);

  const ripples = new Set<HTMLElement>();
  const timeouts = new Set<number>();
  let disposed = false;

  function surfaceFor(target: EventTarget | null): HTMLElement | null {
    const node = target instanceof Element ? target : null;
    const element = node?.closest<HTMLElement>(opts.surfaceSelector);
    // Never animate operator controls, disabled actions, or the opaque Canon capture screen.
    return element?.closest<HTMLElement>(opts.rootSelector) &&
      !element.matches(':disabled, [aria-disabled="true"], [data-loading="true"]') ? element : null;
  }

  function coordinates(element: HTMLElement, clientX: number, clientY: number) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = Math.max(0, Math.min(100, (clientX - rect.left) / rect.width * 100));
    const y = Math.max(0, Math.min(100, (clientY - rect.top) / rect.height * 100));
    return { x, y, rect };
  }

  function createRipple(element: HTMLElement, point: ReturnType<typeof coordinates>) {
    if (!point) return;
    // Respect ripple limit per surface
    const existingRipples = Array.from(element.children).filter(
      child => child.classList.contains('glass-touch-ripple')
    );
    if (existingRipples.length >= opts.maxRipplesPerSurface) return;

    const ripple = document.createElement('span');
    ripple.className = 'glass-touch-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.setProperty('--ripple-x', `${point.x}%`);
    ripple.style.setProperty('--ripple-y', `${point.y}%`);
    ripple.style.setProperty('--ripple-size', `${Math.hypot(point.rect.width, point.rect.height) * 2}px`);
    // Use CSS variable for ripple opacity customization per surface
    const rippleOpacity = getComputedStyle(element).getPropertyValue('--lg-ripple-opacity').trim();
    if (rippleOpacity) {
      ripple.style.setProperty('--lg-ripple-opacity', rippleOpacity);
    }
    element.append(ripple);
    ripples.add(ripple);

    const remove = () => { ripple.remove(); ripples.delete(ripple); };
    ripple.addEventListener('animationend', remove, { once: true });
    // Covers animation cancellation (route changes / visibility) without retaining removed nodes.
    const timeout = window.setTimeout(() => { timeouts.delete(timeout); remove(); }, 520);
    timeouts.add(timeout);
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    if (reducedMotion?.matches) return;
    const element = surfaceFor(event.target);
    if (!element) return;
    const point = coordinates(element, event.clientX, event.clientY);
    if (!point) return;
    element.style.setProperty('--touch-x', `${point.x}%`);
    element.style.setProperty('--touch-y', `${point.y}%`);
    element.setAttribute('data-pressed', 'true');
    createRipple(element, point);
  }

  function onPointerUp(event: PointerEvent) {
    // Clear pressed state on any pointerup (even outside) - actual click handling is separate
    if (event.button !== 0) return;
    const element = surfaceFor(event.target);
    if (!element) return;
    element.removeAttribute('data-pressed');
  }

  function onPointerCancel(event: PointerEvent) {
    if (event.button !== 0) return;
    const element = surfaceFor(event.target);
    if (!element) return;
    element.removeAttribute('data-pressed');
  }

  function onLostPointerCapture(event: PointerEvent) {
    const element = surfaceFor(event.target);
    if (!element) return;
    element.removeAttribute('data-pressed');
  }

  function onVisibilityChange() {
    if (document.hidden) {
      // Clear all pressed states on tab switch/minimize
      document.querySelectorAll('[data-pressed="true"]').forEach(el => {
        el.removeAttribute('data-pressed');
      });
    }
  }

  function onBlur() {
    document.querySelectorAll('[data-pressed="true"]').forEach(el => {
      el.removeAttribute('data-pressed');
    });
  }

  // Swipe/drag support for carousels
  let dragState: {
    element: HTMLElement | null;
    startX: number;
    startY: number;
    startScrollLeft: number;
    isDragging: boolean;
    hasMovedEnough: boolean;
  } = {
    element: null,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    isDragging: false,
    hasMovedEnough: false,
  };

  const carouselSelector = '.v1-photo-grid, .v1-frame-grid, .v1-layout-carousel, .glass-carousel';

  function findCarousel(element: HTMLElement): HTMLElement | null {
    return element.closest<HTMLElement>(carouselSelector);
  }

  function onPointerDownCarousel(event: PointerEvent) {
    if (event.button !== 0) return;
    const carousel = findCarousel(event.target as HTMLElement);
    if (!carousel) return;
    // Only enable mouse drag; touch uses native scrolling
    if (event.pointerType !== 'mouse') return;
    if (reducedMotion?.matches) return;

    const target = event.target as HTMLElement;
    // Don't start drag on interactive children (buttons, etc.)
    if (target.closest('button, a, [role="button"], input, select, textarea')) return;

    dragState.element = carousel;
    dragState.startX = event.clientX;
    dragState.startY = event.clientY;
    dragState.startScrollLeft = carousel.scrollLeft;
    dragState.isDragging = false;
    dragState.hasMovedEnough = false;

    carousel.setPointerCapture(event.pointerId);
    carousel.setAttribute('data-dragging', 'true');
  }

  function onPointerMoveCarousel(event: PointerEvent) {
    if (!dragState.element || !dragState.element.hasPointerCapture(event.pointerId)) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    // Enter drag state after 8px horizontal movement
    if (!dragState.isDragging && Math.abs(deltaX) > 8) {
      dragState.isDragging = true;
      dragState.element.style.scrollSnapType = 'none';
      // Suppress ripples on child cards during drag
      dragState.element.querySelectorAll('[data-glass-interactive="true"], .v1-photo-grid button, .v1-frame-grid button').forEach(el => {
        el.setAttribute('data-drag-suppressed', 'true');
      });
    }

    if (dragState.isDragging) {
      event.preventDefault();
      const carousel = dragState.element;
      // Apply resistance at edges
      const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
      let newScrollLeft = dragState.startScrollLeft - deltaX;

      if (newScrollLeft < 0) {
        newScrollLeft = newScrollLeft * 0.32; // resistance factor 0.32
      } else if (newScrollLeft > maxScrollLeft) {
        newScrollLeft = maxScrollLeft + (newScrollLeft - maxScrollLeft) * 0.32;
      }

      carousel.scrollLeft = newScrollLeft;

      // Track if total movement exceeds 12px to suppress click
      if (Math.hypot(deltaX, deltaY) > 12) {
        dragState.hasMovedEnough = true;
      }
    }
  }

  function onPointerUpCarousel(event: PointerEvent) {
    if (!dragState.element) return;
    const carousel = dragState.element;

    if (dragState.isDragging) {
      carousel.releasePointerCapture(event.pointerId);
      carousel.removeAttribute('data-dragging');
      // Restore snap on next frame
      requestAnimationFrame(() => {
        carousel.style.scrollSnapType = 'x mandatory';
      });
      // Re-enable ripples on children
      carousel.querySelectorAll('[data-drag-suppressed="true"]').forEach(el => {
        el.removeAttribute('data-drag-suppressed');
      });

      // Velocity-based snap (simplified - project velocity)
      // For now, just snap to nearest card
      if (!reducedMotion?.matches) {
        // Snap to nearest enabled card
        const cards = carousel.querySelectorAll<HTMLElement>('.v1-carousel-card, .glass-carousel__item, [data-carousel-item="true"]');
        if (cards.length > 0) {
          const centerX = carousel.scrollLeft + carousel.clientWidth / 2;
          let nearestCard = cards[0];
          let minDistance = Infinity;
          cards.forEach(card => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(cardCenter - centerX);
            if (distance < minDistance) {
              minDistance = distance;
              nearestCard = card;
            }
          });
          nearestCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }

    // Reset drag state
    dragState = {
      element: null,
      startX: 0,
      startY: 0,
      startScrollLeft: 0,
      isDragging: false,
      hasMovedEnough: false,
    };
  }

  function onPointerCancelCarousel(event: PointerEvent) {
    if (!dragState.element) return;
    const carousel = dragState.element;
    if (dragState.isDragging) {
      carousel.releasePointerCapture(event.pointerId);
      carousel.removeAttribute('data-dragging');
      carousel.style.scrollSnapType = 'x mandatory';
      carousel.querySelectorAll('[data-drag-suppressed="true"]').forEach(el => {
        el.removeAttribute('data-drag-suppressed');
      });
    }
    dragState = {
      element: null,
      startX: 0,
      startY: 0,
      startScrollLeft: 0,
      isDragging: false,
      hasMovedEnough: false,
    };
  }

  // Attach listeners with passive: true where appropriate
  document.addEventListener('pointerdown', onPointerDown, { passive: true });
  document.addEventListener('pointerup', onPointerUp, { passive: true });
  document.addEventListener('pointercancel', onPointerCancel, { passive: true });
  document.addEventListener('lostpointercapture', onLostPointerCapture, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
  window.addEventListener('blur', onBlur, { passive: true });

  // Carousel drag listeners (mouse only, not passive for drag)
  document.addEventListener('pointerdown', onPointerDownCarousel, { passive: false });
  document.addEventListener('pointermove', onPointerMoveCarousel, { passive: false });
  document.addEventListener('pointerup', onPointerUpCarousel, { passive: true });
  document.addEventListener('pointercancel', onPointerCancelCarousel, { passive: true });
  document.addEventListener('lostpointercapture', onPointerCancelCarousel, { passive: true });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerCancel);
    document.removeEventListener('lostpointercapture', onLostPointerCapture);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('blur', onBlur);

    document.removeEventListener('pointerdown', onPointerDownCarousel);
    document.removeEventListener('pointermove', onPointerMoveCarousel);
    document.removeEventListener('pointerup', onPointerUpCarousel);
    document.removeEventListener('pointercancel', onPointerCancelCarousel);
    document.removeEventListener('lostpointercapture', onPointerCancelCarousel);

    timeouts.forEach(timeout => clearTimeout(timeout));
    timeouts.clear();
    ripples.forEach(ripple => ripple.remove());
    ripples.clear();
    ambient.remove();
    disposeActive = undefined;
  };
  disposeActive = dispose;
  return dispose;
}