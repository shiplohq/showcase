// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

/**
 * GSAP wrapper — registers the plugins once and centralizes the
 * prefers-reduced-motion guard (design §11). Every tween in the app goes
 * through `fx.to` / `fx.fromTo` so reduced-motion users always get the final
 * state immediately.
 */

import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(Flip, MotionPathPlugin);

export { gsap, Flip, MotionPathPlugin };

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

type Vars = gsap.TweenVars;

/**
 * Reduced-motion-aware tween. In reduced mode the `final` vars are applied
 * instantly via gsap.set and no tween runs.
 */
export function to(targets: gsap.TweenTarget, vars: Vars, final: Vars = vars): gsap.core.Tween {
  if (prefersReducedMotion()) {
    gsap.set(targets, final);
    // A no-op tween keeps call sites uniform (kill() is always safe).
    return gsap.to(targets, { ...vars, duration: 0.01, paused: true });
  }
  return gsap.to(targets, vars);
}

/**
 * Staggered reveal helper (lobby tabs, review annotations). Semantics follow
 * gsap.from: `vars` describe the HIDDEN start state; items animate to their
 * natural CSS state and the inline styles are cleared afterwards.
 * Reduced mode: nothing happens (elements simply keep their CSS state).
 */
export function reveal(targets: gsap.TweenTarget, vars: Vars): gsap.core.Tween {
  if (prefersReducedMotion()) {
    return gsap.to(targets, { duration: 0.01, paused: true });
  }
  return gsap.from(targets, {
    duration: 0.3,
    stagger: 0.03,
    ease: 'power1.out',
    clearProps: 'all',
    ...vars,
  });
}

export const fx = { to, reveal, prefersReducedMotion };
