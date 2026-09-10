/*!
 * Aurora Lamp — GSAP registration + motion gate (single wrapper, per spec).
 * Copyright 2026 Shiplo HQ
 * SPDX-License-Identifier: Apache-2.0
 *
 * gsap + ScrollTrigger are vendored locally (no CDN) and registered exactly
 * once here. Every animated module goes through AuroraMotion so
 * prefers-reduced-motion is honoured in one place: reduced mode never creates
 * a ScrollTrigger and collapses tweens to <=150ms state changes
 * (DESIGN_DECISIONS.md §2).
 */
(function (global) {
  'use strict';

  var gsap = global.gsap;
  var motion = {
    available: !!gsap,
    scrollTrigger: false,
    reduced: function () {
      return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    },
    /** Duration cap for reduced mode: near-instant, keeps focus/opacity cues. */
    instant: 0.15
  };

  if (gsap) {
    if (global.ScrollTrigger) {
      gsap.registerPlugin(global.ScrollTrigger);
      motion.scrollTrigger = global.ScrollTrigger;
    }

    /** Tween helper honouring the motion budget + reduced-motion.
     *  t(target, { y: -40, duration: 0.5, ease: 'power2.out' }) */
    motion.t = function (target, vars) {
      var v = Object.assign({}, vars);
      if (motion.reduced()) {
        v.duration = Math.min(v.duration || 0.4, motion.instant);
        delete v.ease;
        if (v.scrollTrigger) delete v.scrollTrigger; // never scrub under RM
      }
      return gsap.to(target, v);
    };

    /** ScrollTrigger factory: under reduced motion the section simply keeps
     *  its final readable state — no pin, no scrub, no hidden content. */
    motion.onScroll = function (vars, finalState) {
      if (motion.reduced() || !motion.scrollTrigger) {
        if (finalState) finalState();
        return null;
      }
      return gsap.timeline(Object.assign({ scrollTrigger: vars }, arguments[2] || {}));
    };

    motion.set = function (target, vars) { return gsap.set(target, vars); };

    /** Milliseconds of a named budget tier (feedback/spatial/delight). */
    motion.dur = function (ms) {
      return motion.reduced() ? motion.instant : ms / 1000;
    };
  } else {
    // GSAP missing (vendored — should never happen) → no-op stubs, page still runs.
    motion.t = function (target, vars) { return { pause: function () {} }; };
    motion.onScroll = function (vars, finalState) { if (finalState) finalState(); return null; };
    motion.set = function () {};
    motion.dur = function () { return 0; };
  }

  global.AuroraMotion = motion;
})(typeof globalThis !== 'undefined' ? globalThis : this);
