// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — core only (no plugins needed for this app: the slice moves
// are computed transforms, not FLIP reparenting). Every tween goes through
// `tween()` so prefers-reduced-motion is honored in exactly one place, and
// Vue components kill their tweens on unmount (framework lifecycle cleanup).

import { gsap } from 'gsap';

export { gsap };

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Tween that collapses to an instant state set under reduced motion.
 * Accepts gsap.to vars; final values apply immediately when reduced.
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
    return gsap.timeline().to(targets, { duration: 0 });
  }
  return gsap.to(targets, vars);
}

/** Draw-on effect for the dashed cut lines (no-op under reduced motion). */
export function drawCutLines(targets: Element[], onComplete?: () => void): void {
  if (prefersReducedMotion()) {
    gsap.set(targets, { strokeDashoffset: 0 });
    onComplete?.();
    return;
  }
  gsap.fromTo(
    targets,
    { strokeDashoffset: 160 },
    {
      strokeDashoffset: 0,
      duration: 0.26,
      ease: 'power2.out',
      stagger: 0.035,
      onComplete,
    },
  );
}

/**
 * Screen-mount fade+rise. Transform is cleared on completion so no ancestor
 * keeps a transform (that would break position:fixed drag ghosts).
 */
export function mountFade(el: Element): void {
  if (prefersReducedMotion()) return;
  gsap.fromTo(
    el,
    { y: 8, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.24, ease: 'power2.out', clearProps: 'transform,opacity' },
  );
}

/** Rubber-stamp landing: the one "delight" moment, ≤900ms. */
export function stampIn(el: Element, onDone?: () => void): void {
  if (prefersReducedMotion()) {
    onDone?.();
    return;
  }
  gsap.fromTo(
    el,
    { scale: 1.7, opacity: 0, rotate: -18 },
    { scale: 1, opacity: 1, rotate: -8, duration: 0.45, ease: 'back.out(1.5)', onComplete: onDone },
  );
}
