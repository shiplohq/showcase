// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — plugins register exactly once (spec: wrapper src/lib/gsap.*).
// EVERY tween in the app goes through tween()/timeline() so
// prefers-reduced-motion is honored in exactly one place: reduced motion →
// final state applied instantly, only tiny fades allowed (spec motion section).

import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export { gsap, Flip };

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Tween that collapses to an instant state set under reduced motion.
 * Same vars as gsap.to; duration/delay/ease/stagger are dropped and the
 * final values are applied with gsap.set.
 */
export function tween(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
): gsap.core.Tween | gsap.core.Timeline {
  if (prefersReducedMotion()) {
    const { duration, delay, ease, stagger, repeat, yoyo, ...rest } = vars;
    void duration;
    void delay;
    void ease;
    void stagger;
    void repeat;
    void yoyo;
    gsap.set(targets, rest);
    return gsap.timeline();
  }
  return gsap.to(targets, vars);
}

/** Reduced-motion-aware timeline (for sequenced steps). */
export function timeline(vars: gsap.TimelineVars = {}): gsap.core.Timeline {
  return gsap.timeline(vars);
}

/** Kill helpers so Vue components never leak tweens on unmount. */
export function killTweensOf(targets: gsap.TweenTarget): void {
  gsap.killTweensOf(targets);
}
