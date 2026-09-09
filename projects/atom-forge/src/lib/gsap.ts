// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — every tween in the app goes through `tween()` so
// prefers-reduced-motion is honored in exactly one place (spec: wrapper
// src/lib/gsap.*, register plugins once). Only core gsap is used; no Draggable
// (drag is native pointer events) and no MotionPath (spec: no animated
// physical simulation; the reveal orbit is a static diagram).

import { gsap } from 'gsap';

export { gsap };

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Tween that collapses to an instant state set under reduced motion.
 * Accepts the same vars as gsap.to; final values apply immediately.
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

/**
 * gsap.from — under reduced motion it is skipped entirely: the element is
 * already in its natural (final) state, which is exactly the goal.
 */
export function fromTween(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
): gsap.core.Tween | gsap.core.Timeline {
  if (prefersReducedMotion()) return gsap.timeline();
  return gsap.from(targets, vars);
}

/** Run an animation callback only when motion is allowed; otherwise act now. */
export function animate( motion: () => void, instant: () => void ): void {
  if (prefersReducedMotion()) instant();
  else motion();
}
