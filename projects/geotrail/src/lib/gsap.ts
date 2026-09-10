// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — core only (transforms, attr tweens, dash draws). Every tween
// goes through these helpers so prefers-reduced-motion is honored in exactly
// one place (DD §12: spatial 250–500ms, feedback 150–200ms, delight ≤900ms,
// reduced motion renders the final state instantly). Vue components kill
// their tweens on unmount.

import { gsap } from 'gsap';

export { gsap };

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Tween that collapses to the instant final state under reduced motion. */
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

/** Tween a plain object (e.g. a viewBox {x,y,w,h}) with onUpdate. */
export function tweenValue(
  obj: Record<string, number>,
  to: Record<string, number>,
  duration: number,
  ease: string,
  onUpdate: () => void,
  onComplete?: () => void,
): void {
  if (prefersReducedMotion()) {
    Object.assign(obj, to);
    onUpdate();
    onComplete?.();
    return;
  }
  gsap.to(obj, { ...to, duration, ease, onUpdate, onComplete });
}

/** Dash draw-on for route segments / relation lines (reduced: instant). */
export function drawOn(target: Element, length: number, duration = 0.4, onComplete?: () => void): void {
  if (prefersReducedMotion()) {
    target.setAttribute('stroke-dashoffset', '0');
    onComplete?.();
    return;
  }
  gsap.fromTo(
    target,
    { strokeDashoffset: length },
    { strokeDashoffset: 0, duration, ease: 'power2.out', onComplete },
  );
}

/** Stamp award pop — the single delight beat (≤900ms, back.out). */
export function stampPop(target: Element): void {
  if (prefersReducedMotion()) {
    gsap.set(target, { scale: 1, rotate: 0, opacity: 1 });
    return;
  }
  gsap.fromTo(
    target,
    { scale: 0.6, rotate: -8, opacity: 0 },
    { scale: 1, rotate: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.6)', clearProps: 'transform,opacity' },
  );
}

/** Screen mount fade+rise (cleared so nothing keeps a transform). */
export function mountFade(el: Element): void {
  if (prefersReducedMotion()) return;
  gsap.fromTo(
    el,
    { y: 8, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.26, ease: 'power2.out', clearProps: 'transform,opacity' },
  );
}

/** Soft outline flash on the correct shape — comprehension feedback. */
export function correctFlash(target: Element): void {
  if (prefersReducedMotion()) return;
  gsap.fromTo(
    target,
    { opacity: 0.55 },
    { opacity: 1, duration: 0.2, ease: 'power1.inOut', repeat: 1, yoyo: true },
  );
}
