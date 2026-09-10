// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — every tween goes through `tween()` so prefers-reduced-motion
// is honored in exactly one place (spec: wrapper src/lib/gsap.*, register
// plugins once). Core + Flip only (reorder spatial continuity); leaf drag is
// native pointer events, so Draggable is not imported.

import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export { gsap, Flip };

/** Structural type of Flip.getState()'s return, for refs across modules. */
export type FlipStateLike = ReturnType<typeof Flip.getState>;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
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

/** gsap.from — under reduced motion it is skipped entirely. */
export function fromTween(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
): gsap.core.Tween | gsap.core.Timeline {
  if (prefersReducedMotion()) return gsap.timeline();
  return gsap.from(targets, vars);
}

/** Run an animation callback only when motion is allowed; otherwise act now. */
export function animate(motion: () => void, instant: () => void): void {
  if (prefersReducedMotion()) instant();
  else motion();
}

/**
 * Flip a React reorder: capture the pre-swap positions now; the caller plays
 * Flip.from(state) in an effect AFTER React has committed the new order
 * (calling Flip.from synchronously after setState would see the old DOM).
 * Under reduced motion there is nothing to capture — the swap is instant.
 */
export function captureFlip(container: Element | null | undefined): FlipStateLike | null {
  if (prefersReducedMotion() || !container) return null;
  return Flip.getState(container);
}

/** Play a captured Flip state with the repo motion budget (design §7). */
export function playFlip(state: Flip.FlipState): void {
  Flip.from(state, {
    duration: 0.3,
    ease: 'power2.out',
    absolute: true,
  });
}
