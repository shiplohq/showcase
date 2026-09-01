// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — core only (no plugins needed: ghost fly, digit roll and
// count-ups are plain tweens), registered once, with the centralized
// prefers-reduced-motion guard (design §11). Every tween in the app goes
// through `fx` so reduced-motion users always get the final state instantly.

import gsap from 'gsap';

export { gsap };

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

type Vars = gsap.TweenVars;

/**
 * Reduced-motion-aware tween. In reduced mode the `final` vars are applied
 * instantly via gsap.set and no tween runs.
 */
export function to(targets: gsap.TweenTarget, vars: Vars, final: Vars = vars): gsap.core.Tween {
  if (prefersReducedMotion()) {
    gsap.set(targets, final);
    return gsap.to(targets, { ...vars, duration: 0.01, paused: true });
  }
  return gsap.to(targets, vars);
}

/**
 * Staggered reveal (stall bands, receipt lines). `vars` describe the HIDDEN
 * start state; items animate to their natural CSS state, then inline styles
 * are cleared. Reduced mode: nothing happens — elements keep their CSS state.
 */
export function reveal(targets: gsap.TweenTarget, vars: Vars): gsap.core.Tween {
  if (prefersReducedMotion()) {
    return gsap.to(targets, { duration: 0.01, paused: true });
  }
  return gsap.from(targets, {
    duration: 0.32,
    stagger: 0.04,
    ease: 'power1.out',
    clearProps: 'all',
    ...vars,
  });
}

/**
 * Count-up helper for money comprehension (paid total, change): animates an
 * object property and calls `render` with the snapped integer each frame.
 * Reduced mode: renders the final value immediately.
 */
export function countUp(
  from: number,
  toValue: number,
  render: (value: number) => void,
): void {
  if (prefersReducedMotion() || from === toValue) {
    render(toValue);
    return;
  }
  const state = { value: from };
  gsap.to(state, {
    value: toValue,
    duration: Math.min(0.7, 0.25 + Math.abs(toValue - from) * 0.03),
    ease: 'power2.out',
    snap: { value: 1 },
    onUpdate: () => render(state.value),
    onComplete: () => render(toValue),
  });
}

export const fx = { to, reveal, countUp, prefersReducedMotion };
