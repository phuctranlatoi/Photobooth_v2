// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initLiquidGlassFx } from './liquidGlassFx';

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; document.body.innerHTML = ''; vi.useRealTimers(); });

describe('customer liquid glass feedback', () => {
  it('adds one ambient layer, follows pointer and removes a touch ripple', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div class="v1-shell atelier-customer"><button class="v1-primary">Continue</button></div>';
    const button = document.querySelector('button')!;
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 20, width: 100, height: 60 } as DOMRect);
    dispose = initLiquidGlassFx();
    expect(initLiquidGlassFx()).toBe(dispose);
    expect(document.querySelectorAll('#ambient-liquid-glass .ambient-orb')).toHaveLength(3);
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 35, clientY: 50 }));
    expect(button.style.getPropertyValue('--touch-x')).toBe('25%');
    expect(button.style.getPropertyValue('--touch-y')).toBe('50%');
    expect(button.querySelectorAll('.glass-touch-ripple')).toHaveLength(1);
    vi.advanceTimersByTime(520);
    expect(button.querySelector('.glass-touch-ripple')).toBeNull();
    dispose(); dispose = undefined;
    expect(document.querySelector('#ambient-liquid-glass')).toBeNull();
  });

  it('does not affect disabled controls, operator controls or camera screen', () => {
    document.body.innerHTML = '<div class="v1-shell atelier-customer"><button disabled class="v1-primary">Disabled</button></div><div class="v1-shell"><button class="v1-primary">Staff</button></div><div class="v1-shell atelier-customer v1-camera"><button class="v1-primary">Capture</button></div>';
    dispose = initLiquidGlassFx();
    document.querySelectorAll('button').forEach(button => {
      button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      expect(button.querySelector('.glass-touch-ripple')).toBeNull();
    });
  });
});
