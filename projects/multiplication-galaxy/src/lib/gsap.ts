// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — registers plugins once (spec: src/lib/gsap.*, register one
// time, only what is used) and routes every tween through one reduced-motion
// gate so prefers-reduced-motion is honored in exactly one place.

import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin);

export { gsap, MotionPathPlugin };

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Tween that collapses to an instant state set under reduced motion.
 * Accepts gsap.to vars; duration/delay/ease/stagger are dropped and the final
 * values applied immediately when the user prefers reduced motion.
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

/** Timeline factory whose plays collapse under reduced motion. */
export function timeline(vars: gsap.TimelineVars = {}): gsap.core.Timeline {
  const tl = gsap.timeline(vars);
  if (prefersReducedMotion()) tl.progress(1);
  return tl;
}
