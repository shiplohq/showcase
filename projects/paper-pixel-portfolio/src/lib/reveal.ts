// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Scroll reveal — IntersectionObserver adds .is-revealed once; the CSS layer
// (motion.css) owns the transition and the reduced-motion overrides, so the
// same kill switch covers both GSAP and CSS motion.

import type { Directive } from 'vue';
import { motionReduced } from './gsap';

let io: IntersectionObserver | null = null;

function ensure(): IntersectionObserver {
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-revealed');
            io?.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );
  }
  return io;
}

export const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    if (motionReduced()) {
      el.classList.add('is-revealed');
      return;
    }
    el.classList.add('reveal');
    ensure().observe(el);
  },
  unmounted(el) {
    io?.unobserve(el);
  },
};
