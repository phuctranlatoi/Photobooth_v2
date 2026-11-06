/** Customer-only, delegated glass feedback. No camera frames or session state are handled here. */
const SURFACE = '.v1-primary, .v1-secondary, .v1-back, .backButton, .v1-carousel-arrow, .v1-stepper button, .v1-layout-card, .v1-frame-grid button, .v1-photo-grid button, .v1-bundles button, .atelier-event-showcase button';
let disposeActive: (() => void) | undefined;

export function initLiquidGlassFx(): () => void {
  if (disposeActive) return disposeActive;
  if (typeof document === 'undefined') return () => {};

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
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
    const element = node?.closest<HTMLElement>(SURFACE);
    // Never animate operator controls, disabled actions, or the opaque Canon capture screen.
    return element?.closest('.v1-shell.atelier-customer:not(.v1-camera)') &&
      !element.matches(':disabled, [aria-disabled="true"]') ? element : null;
  }

  function coordinates(element: HTMLElement, clientX: number, clientY: number) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = Math.max(0, Math.min(100, (clientX - rect.left) / rect.width * 100));
    const y = Math.max(0, Math.min(100, (clientY - rect.top) / rect.height * 100));
    return { x, y, rect };
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    const element = surfaceFor(event.target);
    if (!element || reducedMotion?.matches) return;
    const point = coordinates(element, event.clientX, event.clientY);
    if (!point) return;
    element.style.setProperty('--touch-x', `${point.x}%`);
    element.style.setProperty('--touch-y', `${point.y}%`);
    // Bound the number of in-flight animations during rapid taps.
    if (Array.from(element.children).filter(child => child.classList.contains('glass-touch-ripple')).length >= 2) return;
    const ripple = document.createElement('span');
    ripple.className = 'glass-touch-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.setProperty('--ripple-x', `${point.x}%`);
    ripple.style.setProperty('--ripple-y', `${point.y}%`);
    ripple.style.setProperty('--ripple-size', `${Math.hypot(point.rect.width, point.rect.height) * 2}px`);
    element.append(ripple);
    ripples.add(ripple);
    const remove = () => { ripple.remove(); ripples.delete(ripple); };
    ripple.addEventListener('animationend', remove, { once: true });
    // Covers animation cancellation (route changes / visibility) without retaining removed nodes.
    const timeout = window.setTimeout(() => { timeouts.delete(timeout); remove(); }, 500);
    timeouts.add(timeout);
  }

  document.addEventListener('pointerdown', onPointerDown, { passive: true });
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    document.removeEventListener('pointerdown', onPointerDown);
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
