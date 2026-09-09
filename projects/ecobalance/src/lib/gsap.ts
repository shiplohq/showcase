// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — single import point, reduced-motion aware (DESIGN_DECISIONS
// §11). Only core is used; no plugin registration needed for this project.

import { gsap } from 'gsap';

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export function prefersReducedMotion(): boolean {
  return reducedQuery.matches;
}

/** Fade an element in (feedback budget: ≤220ms; reduced: ≤150ms or immediate). */
export function fadeIn(el: Element, visible: { opacity?: number; y?: number; delay?: number } = {}): void {
  const { opacity = 1, y = 0, delay = 0 } = visible;
  if (prefersReducedMotion()) {
    gsap.set(el, { opacity, y: 0 });
    return;
  }
  gsap.fromTo(
    el,
    { opacity: 0, y },
    { opacity, y: 0, duration: 0.18, delay, ease: 'power2.out', overwrite: 'auto' },
  );
}

/** Fade an element out, then remove it (used for exiting tokens/banners). */
export function fadeOutRemove(el: Element, parent: ParentNode, onDone?: () => void): void {
  if (prefersReducedMotion()) {
    parent.removeChild(el);
    onDone?.();
    return;
  }
  gsap.to(el, {
    opacity: 0,
    duration: 0.16,
    ease: 'power1.out',
    onComplete: () => {
      if (el.parentNode === parent) parent.removeChild(el);
      onDone?.();
    },
  });
}

/** Population-count change flash on a ledger row (feedback 150ms). */
export function pulseRow(el: Element, up: boolean): void {
  if (prefersReducedMotion()) return;
  gsap.fromTo(
    el,
    { backgroundColor: up ? 'var(--ok-tint)' : 'var(--miss-tint)' },
    { backgroundColor: 'rgba(250, 247, 234, 0.92)', duration: 0.32, ease: 'power1.out', clearProps: 'backgroundColor' },
  );
}

/** Food-web line draw-in (spatial 300ms). */
export function drawLine(path: Element): void {
  if (prefersReducedMotion()) return;
  const len = (path as SVGPathElement).getTotalLength?.() ?? 0;
  gsap.fromTo(
    path,
    { strokeDasharray: len, strokeDashoffset: len },
    { strokeDashoffset: 0, duration: 0.3, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' },
  );
}

/** Banner slide-in from above the plate (spatial 250ms). */
export function bannerIn(el: Element): void {
  if (prefersReducedMotion()) {
    gsap.set(el, { opacity: 1, y: 0 });
    return;
  }
  gsap.fromTo(el, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
}

/** Chart line draw-in for the debrief (spatial 350ms, staggered). */
export function chartLineIn(path: Element, index: number): void {
  if (prefersReducedMotion()) return;
  const len = (path as SVGPathElement).getTotalLength?.() ?? 0;
  gsap.fromTo(
    path,
    { strokeDasharray: len, strokeDashoffset: len },
    {
      strokeDashoffset: 0,
      duration: 0.35,
      delay: index * 0.06,
      ease: 'power2.inOut',
      clearProps: 'strokeDasharray,strokeDashoffset',
    },
  );
}

export { gsap };
