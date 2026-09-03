// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — core only, no plugins (layer fades, route draw-on and organ
// focus are transforms/attr tweens). Every tween goes through `tween()` so
// prefers-reduced-motion is honored in exactly one place; Vue components kill
// their tweens on unmount (framework lifecycle cleanup).

import { gsap } from 'gsap';

export { gsap };

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Tween that collapses to the instant final state under reduced motion.
 * Accepts gsap.to vars; duration/ease/stagger are dropped when reduced.
 */
export function tween(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
): gsap.core.Tween | gsap.core.Timeline {
  if (prefersReducedMotion()) {
    const { duration, delay, ease, stagger, onComplete, ...rest } = vars;
    void duration;
    void delay;
    void ease;
    void stagger;
    gsap.set(targets, rest);
    if (onComplete) onComplete();
    return gsap.timeline().to(targets, { duration: 0 });
  }
  return gsap.to(targets, vars);
}

/**
 * Route segment draw-on: animates strokeDashoffset from length to 0.
 * Reduced motion: segment appears immediately (no path travel).
 */
export function drawOn(target: Element, length: number, onComplete?: () => void): void {
  if (prefersReducedMotion()) {
    gsap.set(target, { strokeDashoffset: 0 });
    onComplete?.();
    return;
  }
  gsap.fromTo(
    target,
    { strokeDashoffset: length },
    {
      strokeDashoffset: 0,
      duration: 0.42,
      ease: 'power2.out',
      onComplete,
    },
  );
}

/** One soft pulse along a completed route — the single "delight" beat, ≤900ms. */
export function routePulse(targets: Element[]): void {
  if (prefersReducedMotion()) return;
  gsap.fromTo(
    targets,
    { opacity: 0.45 },
    {
      opacity: 1,
      duration: 0.32,
      ease: 'power1.inOut',
      repeat: 1,
      yoyo: true,
    },
  );
}

/** Screen mount fade+rise; transform cleared so nothing keeps a transform. */
export function mountFade(el: Element): void {
  if (prefersReducedMotion()) return;
  gsap.fromTo(
    el,
    { y: 8, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.26, ease: 'power2.out', clearProps: 'transform,opacity' },
  );
}
