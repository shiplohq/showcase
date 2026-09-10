// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// GSAP wrapper — plugins registered exactly once, and every helper collapses
// to an instant set() when motion is reduced (manual toggle or media query).
// Plugins used by this project only: CustomEase (poster reveals) and
// SplitText (Type mode kinetic typography). Nothing else is imported.

import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';
import { isReduced } from './motionState';

gsap.registerPlugin(CustomEase, SplitText);

CustomEase.create('poster', '0.22, 0.9, 0.12, 1');

export { gsap, SplitText };

/** Tween that collapses to an instant set under reduced motion. */
export function motion(target: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween {
  if (isReduced()) {
    const { duration, delay, stagger, repeat, yoyo, ease, ...rest } = vars;
    void duration;
    void delay;
    void stagger;
    void repeat;
    void yoyo;
    void ease;
    return gsap.set(target, rest as gsap.TweenVars) as unknown as gsap.core.Tween;
  }
  return gsap.to(target, vars);
}

/** Tween FROM values onto what the DOM already renders; no-op when reduced. */
export function motionFrom(target: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween | null {
  if (isReduced()) return null;
  return gsap.from(target, vars);
}

/** Fade only — allowed under reduced motion when kept <= 150 ms. */
export function fade(target: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween {
  return motion(target, { duration: 0.15, ...vars });
}

export function killTweens(target: gsap.TweenTarget): void {
  gsap.killTweensOf(target);
}
