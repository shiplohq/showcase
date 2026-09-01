/*!
 * Clock Quest — GSAP registration + motion gate (single wrapper, per spec).
 * Copyright 2026 Shiplo HQ
 * SPDX-License-Identifier: Apache-2.0
 *
 * gsap / Draggable / MotionPathPlugin are vendored locally (no CDN) and
 * registered exactly once here. Every animated module goes through motion.t()
 * or motion.reduced() so prefers-reduced-motion is honoured in one place:
 * reduced mode collapses tweens to instant state changes (fades capped at
 * 150ms), matching DESIGN_DECISIONS §11.
 */
(function (global) {
  'use strict';

  var gsap = global.gsap;
  var motion = {
    available: !!gsap,
    reduced: function () {
      return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    /** Duration used when reduced motion is on (instant, or ≤150ms fades). */
    instant: 0.12
  };

  if (gsap) {
    if (global.Draggable) gsap.registerPlugin(global.Draggable);
    if (global.MotionPathPlugin) gsap.registerPlugin(global.MotionPathPlugin);

    /** Tween helper honouring the motion budget + reduced-motion.
     *  t(target, {rotation: 90, duration: 0.2, ease: 'power2.out'}) */
    motion.t = function (target, vars) {
      var v = Object.assign({}, vars);
      if (motion.reduced()) {
        v.duration = motion.instant; // near-instant; keeps focus/opacity cues
        if (v.ease) delete v.ease;
      }
      return gsap.to(target, v);
    };

    motion.set = function (target, vars) { return gsap.set(target, vars); };

    /** Milliseconds of a named budget tier (feedback/spatial/delight). */
    motion.dur = function (ms) {
      return motion.reduced() ? motion.instant : ms / 1000;
    };
  } else {
    // GSAP missing (should never happen — vendored) → no-op stubs, app still runs.
    motion.t = function (target, vars) { return { pause: function () {} }; };
    motion.set = function () {};
    motion.dur = function () { return 0; };
  }

  global.ClockQuestMotion = motion;
})(typeof globalThis !== 'undefined' ? globalThis : this);
