// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — registers once, centralises reduced-motion behaviour
// (spec: reduced mode drops orbit travel/parallax/large transforms; final
// states appear immediately; only <=150 ms opacity changes remain).
// Core tween engine only — no plugins are imported that are not used.

import gsap from 'gsap';

export { gsap };

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Tween that collapses to an instant set under prefers-reduced-motion. */
export function motion(
  target: gsap.TweenTarget,
  vars: gsap.TweenVars,
): gsap.core.Tween {
  if (prefersReducedMotion()) {
    const { duration, delay, stagger, repeat, yoyo, ease, ...rest } = vars;
    void duration;
    void delay;
    void stagger;
    void repeat;
    void yoyo;
    void ease;
    return gsap.set(target, rest as gsap.TweenVars) as unknown as gsap.core.Tween;
  }
  return gsap.to(target, vars);
}

/**
 * Tween FROM the given values to the values already rendered in the DOM
 * (used by the corridor view-morph: React renders the new hang, GSAP glides
 * the stations out of the old one). Reduced motion: DOM already final — no-op.
 */
export function motionFrom(target: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween | null {
  if (prefersReducedMotion()) return null;
  return gsap.from(target, vars);
}

/** Fade only — allowed under reduced motion when kept <= 150 ms. */
export function fade(target: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween {
  return motion(target, { duration: 0.15, ...vars });
}

export function killTweens(target: gsap.TweenTarget): void {
  gsap.killTweensOf(target);
}
