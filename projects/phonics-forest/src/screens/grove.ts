// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Grove — the forest map and the app's minimal progress map. Five sound
// trees stand staggered on a fogged hillside (no card grid, no equal rows);
// fireflies on each sign show mastery. Arrow keys walk between trees.

import type { PhonicsData } from '../engine/types';
import type { Progress } from '../lib/storage';
import { totalFireflies, treeProgress } from '../lib/storage';
import { coniferTree, forestBackdrop } from '../components/art';
import { h, svgFragment } from '../lib/dom';
import { tween, MOTION } from '../lib/gsap';

export interface GroveHandlers {
  onOpenTree(treeId: string): void;
  onRoundup(): void;
}

/** Staggered vantage points on the hillside (percent of the scene box,
 *  anchored from the tree bases so the grove never overflows the stage). */
const SPOTS = [
  { x: 9, y: 2, s: 0.94 },
  { x: 27, y: 26, s: 1.04 },
  { x: 49, y: 0, s: 0.9 },
  { x: 69, y: 30, s: 1.08 },
  { x: 86, y: 4, s: 0.96 },
];

export function renderGrove(
  stage: HTMLElement,
  data: PhonicsData,
  progress: Progress,
  handlers: GroveHandlers,
): void {
  stage.replaceChildren();
  const grove = h('div', { class: 'grove' });
  grove.append(svgFragment(forestBackdrop('grove')));

  const trees = h('div', { class: 'grove-trees', role: 'group', 'aria-label': 'Sound trees' });
  data.trees.forEach((t, i) => {
    const flies = treeProgress(progress, t.id).fireflies;
    const mastered = flies >= 3;
    const spot = SPOTS[i % SPOTS.length];
    const btn = h('button', {
      class: 'tree-btn' + (mastered ? ' mastered' : ''),
      'data-tree': t.id,
      'aria-label': `${t.graphemes[0]} tree — sound ${t.phoneme}. ${flies} of 3 fireflies.`,
      html: coniferTree(
        { id: t.id, grapheme: t.graphemes[0], ipa: t.phoneme, canopy: t.canopy, tiers: t.tiers, height: t.height, fireflies: flies },
        'grove',
      ),
    });
    btn.style.setProperty('--tx', `${spot.x}%`);
    btn.style.setProperty('--ty', `${spot.y}%`);
    btn.addEventListener('click', () => handlers.onOpenTree(t.id));
    trees.append(btn);
  });
  grove.append(trees);
  stage.append(grove);

  // Roving arrows: Left/Up → previous tree, Right/Down → next tree.
  trees.addEventListener('keydown', (ev) => {
    if (!(ev instanceof KeyboardEvent)) return;
    const buttons = [...trees.querySelectorAll<HTMLButtonElement>('.tree-btn')];
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (idx < 0) return;
    const delta = ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' ? -1 : 0;
    if (delta === 0) return;
    ev.preventDefault();
    const next = buttons[(idx + delta + buttons.length) % buttons.length];
    next.focus();
  });

  // Reveal: step in from the mist, never blocking input.
  const treeEls = [...grove.querySelectorAll<HTMLElement>('.tree-btn')];
  treeEls.forEach((el) => (el.style.opacity = '0'));
  tween(treeEls, { opacity: 1, duration: MOTION.reveal, stagger: 0.07, ease: 'power2.out', clearProps: 'opacity' });

  void totalFireflies;
}
