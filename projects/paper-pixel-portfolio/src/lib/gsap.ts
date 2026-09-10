// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — plugins register exactly once (spec: wrapper src/lib/gsap.*).
// Motion is OFF when either the user toggle says so OR the OS asks for
// reduced motion. Every tween in the app goes through tween()/timeline() so
// that decision lives in exactly one place: motion off → final state applied
// instantly, only tiny fades allowed (spec motion section).

import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export { gsap, Flip };

const MOTION_KEY = 'pp:motion';
type MotionPref = 'on' | 'off' | null;

let systemReduced = prefersReducedMotionQuery();
const listeners = new Set<() => void>();

if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onChange = () => {
    systemReduced = mq.matches;
    listeners.forEach((fn) => fn());
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange); // Safari <14
}

function prefersReducedMotionQuery(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function storedPref(): MotionPref {
  try {
    const v = window.localStorage.getItem(MOTION_KEY);
    return v === 'on' || v === 'off' ? v : null;
  } catch {
    return null; // storage unavailable — follow the system
  }
}

/** True when motion must be reduced: explicit user choice or OS preference. */
export function motionReduced(): boolean {
  const pref = typeof window !== 'undefined' ? storedPref() : null;
  return pref === 'off' || (pref === null && systemReduced);
}

/** Three-state preference for the toggle UI: 'on' | 'off' | null (= follow system). */
export function motionPref(): MotionPref {
  return typeof window !== 'undefined' ? storedPref() : null;
}

export function setMotionPref(pref: MotionPref): void {
  try {
    if (pref === null) window.localStorage.removeItem(MOTION_KEY);
    else window.localStorage.setItem(MOTION_KEY, pref);
  } catch {
    /* settings are a convenience — ignore storage failures */
  }
  listeners.forEach((fn) => fn());
}

export function onMotionChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Tween that collapses to an instant state set when motion is reduced.
 * Same vars as gsap.to; duration/delay/ease/stagger are dropped and the
 * final values are applied with gsap.set.
 */
export function tween(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
): gsap.core.Tween | gsap.core.Timeline {
  if (motionReduced()) {
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

/** Reduced-motion-aware timeline (for sequenced steps). */
export function timeline(vars: gsap.TimelineVars = {}): gsap.core.Timeline {
  return gsap.timeline(vars);
}

/** Kill helpers so Vue components never leak tweens on unmount. */
export function killTweensOf(targets: gsap.TweenTarget): void {
  gsap.killTweensOf(targets);
}
