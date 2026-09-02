// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper: registers exactly the plugins this app uses (Flip for
// creature sorting layout continuity, MotionPathPlugin for the firefly
// sound→grapheme focus lead) once, and centralizes the reduced-motion gate.
// Every motion in the app goes through these helpers so
// prefers-reduced-motion keeps a single source of truth.

import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(Flip, MotionPathPlugin);

export { gsap, Flip };

const reducedQuery = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export function prefersReducedMotion(): boolean {
  return reducedQuery?.matches ?? false;
}

export const MOTION = {
  feedback: 0.18, // ripple / press
  spatial: 0.4, // firefly path, creature flight (spec budget 250–500ms)
  layout: 0.35, // tray reflow
  reveal: 0.5, // stagger reveals (≤900ms total for the grove)
  reducedFade: 0.12,
} as const;

/** Tween that collapses to the final state under reduced motion. */
export function tween(targets: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween | null {
  if (prefersReducedMotion()) {
    // Apply only the end state, instantly (opacity/visibility cues survive).
    const { duration, delay, stagger, ease, repeat, yoyo, ...rest } = vars;
    void duration;
    void delay;
    void stagger;
    void ease;
    void repeat;
    void yoyo;
    gsap.set(targets, rest);
    return null;
  }
  return gsap.to(targets, vars);
}

/** Short fade used sparingly under reduced motion (≤150ms per spec). */
export function softFade(targets: gsap.TweenTarget, vars: gsap.TweenVars = {}): gsap.core.Tween {
  const d = prefersReducedMotion() ? MOTION.reducedFade : (vars.duration ?? 0.25);
  return gsap.fromTo(targets, { opacity: 0 }, { ...vars, opacity: 1, duration: d });
}

/** Firefly flight along a curved path from `from` to `to` (element `fly` is
 *  created by the caller, absolutely positioned at `from`). Purposeful: it
 *  leads the eye from the sound source to the grapheme that spells it. */
export function fireflyFlight(fly: HTMLElement, path: { x: number; y: number }[], onDone: () => void): void {
  if (prefersReducedMotion() || path.length < 2) {
    onDone();
    return;
  }
  gsap.to(fly, {
    motionPath: { path, curviness: 1.4 },
    duration: MOTION.spatial + 0.05,
    ease: 'power2.out',
    onComplete: onDone,
  });
}

/** FLIP a creature element from its tray position into a nest (spatial
 *  continuity for the sort gesture), then reflow the remaining tray. */
export function flipInto(
  element: Element,
  mutate: () => void,
  opts: { targets?: Element[]; onDone?: () => void } = {},
): void {
  const state = Flip.getState(element, opts.targets ? { props: '' } : undefined);
  mutate();
  if (prefersReducedMotion()) {
    opts.onDone?.();
    return;
  }
  Flip.from(state, {
    duration: MOTION.spatial + 0.05,
    ease: 'power2.inOut',
    absolute: true,
    onComplete: opts.onDone,
  });
  if (opts.targets?.length) {
    const trayState = Flip.getState(opts.targets);
    Flip.from(trayState, { duration: MOTION.layout, ease: 'power2.out' });
  }
}

/** Tree "wake up" celebration when a phoneme is mastered (≤900ms total):
 *  sway, staggered fireflies, and a lantern glow blooming behind the sign. */
export function wakeTree(treeEl: Element, fireflies: Element[], sign?: Element | null): void {
  if (prefersReducedMotion()) {
    gsap.set(fireflies, { opacity: 1, scale: 1 });
    sign?.classList.add('sign-flash');
    return;
  }
  const tl = gsap.timeline();
  tl.to(treeEl, { rotation: 1.1, duration: 0.18, ease: 'sine.inOut', transformOrigin: '50% 90%' })
    .to(treeEl, { rotation: -1.1, duration: 0.22, ease: 'sine.inOut' })
    .to(treeEl, { rotation: 0, duration: 0.2, ease: 'sine.out' }, '<0.02')
    .fromTo(
      fireflies,
      { opacity: 0.2, scale: 0.4 },
      { opacity: 1, scale: 1, duration: 0.45, stagger: 0.12, ease: 'back.out(1.3)' },
      0.1,
    );
  if (sign) sign.classList.add('sign-glow');
}
