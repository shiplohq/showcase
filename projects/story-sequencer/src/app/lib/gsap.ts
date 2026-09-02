// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

/**
 * GSAP wrapper — registers plugins once and centralizes the
 * prefers-reduced-motion guard (DESIGN_DECISIONS §10). Every tween goes
 * through these helpers so reduced-motion users always land on the final
 * state instantly (fades capped at 150ms, no transforms/staggers).
 */

import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export { gsap, Flip };

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

type Vars = gsap.TweenVars;

/** Reduced-motion-aware tween. */
export function to(targets: gsap.TweenTarget, vars: Vars, final: Vars = vars): gsap.core.Tween {
  if (prefersReducedMotion()) {
    gsap.set(targets, final);
    return gsap.to(targets, { ...vars, duration: 0.01, paused: true });
  }
  return gsap.to(targets, vars);
}

/** Path draw via stroke-dashoffset (DrawSVG is a club plugin; this is the standard equivalent). */
export function drawPath(path: Element | Element[] | NodeList, duration = 0.35): void {
  const list = path instanceof NodeList ? Array.from(path as NodeListOf<Element>) : Array.isArray(path) ? path : [path];
  for (const el of list) {
    const len = (el as SVGPathElement).getTotalLength?.() ?? 0;
    if (len <= 0) continue;
    if (prefersReducedMotion()) {
      gsap.set(el, { strokeDasharray: 'none', strokeDashoffset: 0 });
      continue;
    }
    gsap.fromTo(
      el,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDasharray: len, strokeDashoffset: 0, duration, ease: 'power1.inOut', clearProps: 'strokeDasharray,strokeDashoffset' },
    );
  }
}

/** Staggered reveal; reduced mode is a no-op (elements keep natural state). */
export function reveal(targets: gsap.TweenTarget, vars: Vars = {}): void {
  if (prefersReducedMotion()) return;
  gsap.from(targets as Element[], {
    duration: 0.28,
    stagger: 0.035,
    ease: 'power1.out',
    clearProps: 'all',
    ...vars,
  });
}

/** FLIP reorder — spatial continuity for panel moves (spec: Flip animate reorder). */
export function flipReorder(state: Flip.FlipState, selector: string): void {
  if (prefersReducedMotion()) return;
  Flip.from(state, {
    targets: selector,
    duration: 0.28,
    ease: 'power2.out',
    absolute: true,
    scale: false,
  });
}

export const fx = { to, drawPath, reveal, flipReorder, prefersReducedMotion };
