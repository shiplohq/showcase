// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — registers plugins once and exposes reduced-motion-aware
// helpers. Every tween in the app goes through `tween()`/`flipRelayout()` so
// prefers-reduced-motion is honored in exactly one place (spec: wrapper
// src/lib/gsap.*; register plugin một lần).

import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export { gsap, Flip };

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Tween that collapses to an instant state set under reduced motion.
 * Accepts the same vars as gsap.to; final values apply immediately when the
 * user prefers reduced motion.
 */
export function tween(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
): gsap.core.Tween | gsap.core.Timeline {
  if (prefersReducedMotion()) {
    const { duration, delay, ease, stagger, ...rest } = vars;
    void duration;
    void delay;
    void ease;
    void stagger;
    gsap.set(targets, rest);
    return gsap.timeline();
  }
  return gsap.to(targets, vars);
}

/**
 * Entrance tween (gsap.from): animates FROM the given values to the current
 * natural state. Under reduced motion it is skipped entirely — the element
 * already sits at its final state, so nothing flashes or shifts.
 */
export function tweenFrom(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
): gsap.core.Tween | gsap.core.Timeline {
  if (prefersReducedMotion()) return gsap.timeline();
  return gsap.from(targets, vars);
}

/** FLIP re-layout for word-card reordering, skipped under reduced motion. */
export function flipRelayout(state: Flip.FlipState, vars: gsap.TweenVars = {}): void {
  if (prefersReducedMotion()) {
    // Final layout is already correct (Flip.from mutates from the new state).
    return;
  }
  Flip.from(state, {
    duration: 0.38,
    ease: 'power2.out',
    absolute: true,
    scale: true,
    ...vars,
  } as Parameters<typeof Flip.from>[1]);
}
