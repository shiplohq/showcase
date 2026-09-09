// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Debrief — the field-notebook chart: one line per species on graph grid,
// plus the textual summary the spec requires for every chart.

import { h, svgEl } from '../lib/dom.ts';
import { chartLineIn, prefersReducedMotion } from '../lib/gsap.ts';
import { speciesColor, speciesChip } from '../components/art.ts';
import { summarize, trendOf } from '../engine/sim.ts';
import type { BiomeDef, SimState, SpeciesDef } from '../engine/types.ts';

const W = 900;
const H = 360;
const PAD = { l: 46, r: 96, t: 18, b: 34 };

function series(sp: SpeciesDef, sim: SimState): number[] {
  const pts = [sp.initialPopulation];
  for (const tick of sim.history) pts.push(tick.species[sp.id]?.after ?? pts[pts.length - 1]);
  return pts;
}

function niceMax(v: number): { max: number; step: number } {
  const step = v <= 60 ? 10 : v <= 160 ? 20 : v <= 400 ? 50 : 100;
  return { max: Math.max(step, Math.ceil((v * 1.06) / step) * step), step };
}

export function buildDebrief(opts: {
  biome: BiomeDef;
  sim: SimState;
  onClose: () => void;
  title?: string;
}): HTMLElement {
  const { biome, sim, onClose, title } = opts;

  const closeBtn = h('button', { class: 'btn btn-quiet', type: 'button' }, 'Back to the diorama');
  closeBtn.addEventListener('click', onClose);

  const root = h(
    'section',
    { class: 'debrief', role: 'dialog', 'aria-modal': 'true', 'aria-label': title ?? 'Field chart' },
    h(
      'header',
      { class: 'db-head' },
      h('h2', { text: title ?? 'Field chart' }),
      h('span', { class: 'nb-mode', text: `Seasons 0–${sim.season} · ${biome.name}` }),
      closeBtn,
    ),
    h('div', { class: 'db-body' }, chartBlock(), summariesBlock()),
  );

  function chartBlock(): HTMLElement {
    const svg = svgEl('svg', {
      viewBox: `0 0 ${W} ${H}`,
      role: 'img',
      'aria-label':
        'Population chart, one line per species across seasons. The exact numbers are listed below each chart as text.',
    });

    const allMax = Math.max(
      ...biome.species.map((sp) => Math.max(sp.initialPopulation, ...series(sp, sim))),
    );
    const { max: yMax, step: yStep } = niceMax(allMax);
    const n = Math.max(1, sim.season);
    const plotW = W - PAD.l - PAD.r;
    const plotH = H - PAD.t - PAD.b;
    const xAt = (season: number) => PAD.l + (season / n) * plotW;
    const yAt = (pop: number) => PAD.t + plotH - (pop / yMax) * plotH;

    // grid
    for (let v = 0; v <= yMax; v += yStep) {
      svg.append(svgEl('line', { x1: PAD.l, x2: W - PAD.r, y1: yAt(v), y2: yAt(v), stroke: 'var(--grid)', 'stroke-width': 1 }));
      const yLabel = svgEl('text', {
        x: PAD.l - 8,
        y: yAt(v) + 4,
        'text-anchor': 'end',
        'font-family': 'var(--font-mono)',
        'font-size': 11,
        fill: 'var(--ink-soft)',
      });
      yLabel.append(document.createTextNode(String(v)));
      svg.append(yLabel);
    }
    const xTitle = svgEl('text', {
      x: PAD.l + plotW / 2,
      y: H - 2,
      'text-anchor': 'middle',
      'font-family': 'var(--font-mono)',
      'font-size': 11,
      fill: 'var(--ink-soft)',
    });
    xTitle.append(document.createTextNode('seasons'));
    svg.append(xTitle);
    const xEvery = n <= 18 ? 2 : n <= 40 ? 5 : 10;
    for (let s = 0; s <= n; s += xEvery) {
      svg.append(svgEl('line', { x1: xAt(s), x2: xAt(s), y1: PAD.t, y2: H - PAD.b, stroke: 'var(--grid)', 'stroke-width': 1 }));
      const xLabel = svgEl('text', {
        x: xAt(s),
        y: H - PAD.b + 18,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)',
        'font-size': 11,
        fill: 'var(--ink-soft)',
      });
      xLabel.append(document.createTextNode(String(s)));
      svg.append(xLabel);
    }
    const countLabel = svgEl('text', {
      x: W - PAD.r + 10,
      y: PAD.t + 10,
      'font-family': 'var(--font-mono)',
      'font-size': 11,
      fill: 'var(--ink-soft)',
    });
    countLabel.append(document.createTextNode('count'));
    svg.append(countLabel);

    // species lines
    biome.species.forEach((sp, idx) => {
      const pts = series(sp, sim);
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)} ${yAt(p).toFixed(1)}`).join(' ');
      const p = svgEl('path', {
        d,
        fill: 'none',
        stroke: speciesColor(sp.colorToken),
        'stroke-width': 2.6,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round',
      });
      svg.append(p);
      if (!prefersReducedMotion() && pts.length > 1) chartLineIn(p, idx);
      // end dot + value
      const last = pts[pts.length - 1];
      svg.append(svgEl('circle', { cx: xAt(pts.length - 1), cy: yAt(last), r: 4, fill: speciesColor(sp.colorToken), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      const endLabel = svgEl('text', {
        x: xAt(pts.length - 1) + 8,
        y: yAt(last) + 4,
        'font-family': 'var(--font-mono)',
        'font-size': 13,
        'font-weight': 600,
        fill: 'var(--ink)',
      });
      endLabel.append(document.createTextNode(String(last)));
      svg.append(endLabel);
    });

    return h('figure', { class: 'db-chart' }, svg);
  }

  function summariesBlock(): HTMLElement {
    return h(
      'div',
      {},
      h(
        'ul',
        { class: 'db-legend' },
        ...biome.species.map((sp) =>
          h(
            'li',
            {},
            h('span', { class: 'swatch', style: `background:${speciesColor(sp.colorToken)}` }),
            sp.label,
          ),
        ),
      ),
      h(
        'ul',
        { class: 'db-summaries' },
        ...biome.species.map((sp) => {
          const s = summarize(sim, biome, sp.id);
          const trend = trendOf(sim, sp.id);
          const trendWord = trend === 'gone' ? 'gone' : trend;
          const li = h(
            'li',
            {},
            speciesChip(sp, 26),
            h(
              'span',
              {},
              h('b', { text: `${sp.label}: ` }),
              document.createTextNode(
                `started ${s.start} · peaked ${s.peak} (season ${s.peakSeason}) · lowest ${s.low} (season ${s.lowSeason}) · now ${s.end}, ${trendWord}.`,
              ),
            ),
          );
          li.style.cssText = 'display:flex;align-items:center;gap:10px';
          return li;
        }),
      ),
    );
  }

  // Focus trap — Tab (and Shift+Tab) stay inside the dialog while open.
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = [...root.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')].filter(
      (el) => el.offsetParent !== null,
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  return root;
}
