// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// EcoBalance illustration language — code-native SVG only (DESIGN_DECISIONS
// §9): linocut silhouettes built as unions of flat masses, layered diorama
// bands, ink-drawn UI icons. No raster assets anywhere in this project.

import { h, svgEl } from '../lib/dom.ts';
import type { BiomeDef, SpeciesDef } from '../engine/types.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Species accent fill from the JSON colorToken (never the only signal —
 *  every token also carries its count chip + ledger text). */
export function speciesColor(token: string): string {
  switch (token) {
    case 'ochre':
      return 'var(--sp-ochre)';
    case 'clay':
      return 'var(--sp-clay)';
    case 'sky':
      return 'var(--sp-sky)';
    default:
      return 'var(--sp-leaf)';
  }
}

/**
 * Build a linocut silhouette: the union of `parts`, drawn twice — a thick
 * ink pass underneath (outline mass) and the fill pass on top — so overlapping
 * shapes read as one carved block.
 */
function silhouette(fill: string, parts: SVGElement[]): SVGElement {
  const g = svgEl('g');
  const ink = svgEl('g', {
    fill: 'var(--ink)',
    stroke: 'var(--ink)',
    'stroke-width': 5,
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
  });
  const top = svgEl('g', { fill });
  for (const p of parts) {
    const a = p.cloneNode(true) as SVGElement;
    const b = p.cloneNode(true) as SVGElement;
    a.removeAttribute('data-eye');
    b.removeAttribute('data-eye');
    ink.append(a);
    top.append(b);
  }
  g.append(ink, top);
  return g;
}

function path(d: string, eye = false): SVGElement {
  const p = svgEl('path', { d });
  if (eye) p.setAttribute('data-eye', '');
  return p;
}
function ellipse(cx: number, cy: number, rx: number, ry: number, eye = false): SVGElement {
  const e = svgEl('ellipse', { cx, cy, rx, ry });
  if (eye) e.setAttribute('data-eye', '');
  return e;
}
function circle(cx: number, cy: number, r: number, eye = false): SVGElement {
  const c = svgEl('circle', { cx, cy, r });
  if (eye) c.setAttribute('data-eye', '');
  return c;
}

/** Eye sparkle — a tiny paper dot that gives each block print life. */
function eyeDot(cx: number, cy: number, r = 1.8): SVGElement {
  return svgEl('circle', { cx, cy, r, fill: 'var(--paper-raised)' });
}

/**
 * Species token in a 64×64 box. Callers position it with a transform
 * (translate + optional flip scale) — returns a <g> carrying class
 * `tok tok-<art>` for the stage.
 */
export function speciesToken(species: SpeciesDef): SVGElement {
  const fill = speciesColor(species.colorToken);
  let parts: SVGElement[];
  let eye: { x: number; y: number } | null = null;

  switch (species.art) {
    case 'grass':
      parts = [
        ellipse(32, 55, 17, 6),
        path('M22 52 L16 22 L27 49 Z'),
        path('M28 52 L25 10 L36 49 Z'),
        path('M36 52 L42 16 L44 51 Z'),
        path('M45 51 L52 26 L49 50 Z'),
        path('M18 52 L10 34 L22 49 Z'),
      ];
      break;
    case 'rabbit':
      parts = [
        ellipse(37, 43, 16, 13),
        circle(21, 33, 9),
        path('M17 26 L12 7 L24 23 Z'),
        path('M23 24 L26 5 L31 23 Z'),
        circle(51, 39, 5),
        ellipse(42, 47, 9, 8),
        ellipse(18, 53, 4.5, 3),
      ];
      eye = { x: 18, y: 31 };
      break;
    case 'fox':
      parts = [
        ellipse(38, 42, 17, 10),
        path('M12 37 L26 25 L29 41 Z'),
        path('M23 27 L20 14 L30 24 Z'),
        path('M28 26 L35 15 L36 26 Z'),
        path('M51 45 C61 41 63 27 54 21 C57 32 50 39 45 41 Z'),
        path('M34 49 L35 59 L39 59 L38 49 Z'),
        path('M43 49 L44 60 L48 60 L47 49 Z'),
      ];
      eye = { x: 21, y: 32 };
      break;
    case 'hawk':
      parts = [
        ellipse(32, 36, 12, 6),
        circle(21, 32, 5),
        path('M17 30 L8 32 L17 35 Z'),
        path('M34 33 C40 17 52 9 62 9 C54 16 46 26 38 36 Z'),
        path('M30 39 C34 48 42 54 50 57 C42 53 33 47 27 42 Z'),
        path('M42 34 L59 38 L43 43 Z'),
      ];
      eye = { x: 20, y: 31 };
      break;
    case 'reeds':
      parts = [
        ellipse(32, 57, 20, 5),
        path('M19 55 L16 14 L22 55 Z'),
        path('M31 55 L29 5 L36 55 Z'),
        path('M43 55 L42 18 L49 55 Z'),
        path('M17 12 L17 25 L23 25 L23 12 Z'),
        path('M28 3 L28 17 L35 17 L35 3 Z'),
        path('M41 15 L41 28 L47 28 L47 15 Z'),
        path('M22 55 L34 34 L38 37 L28 55 Z'),
        path('M38 55 L50 36 L53 39 L44 55 Z'),
      ];
      break;
    case 'hopper':
      parts = [
        ellipse(38, 38, 14, 7),
        circle(22, 33, 5),
        path('M20 30 L9 15 L13 17 Z'),
        path('M44 40 C55 43 59 52 54 59 C51 52 44 50 40 46 Z'),
        path('M30 44 L28 53 L32 53 L33 44 Z'),
        path('M25 44 L22 51 L26 52 L28 44 Z'),
        path('M36 32 C42 26 50 24 56 25 C49 29 44 32 39 36 Z'),
      ];
      eye = { x: 21, y: 32 };
      break;
    case 'frog':
      parts = [
        ellipse(34, 45, 15, 11),
        circle(21, 37, 8),
        circle(20, 28, 4.5),
        path('M44 49 C54 51 58 45 58 38 C59 47 52 55 43 55 Z'),
        path('M16 52 L14 58 L20 58 L21 52 Z'),
        ellipse(24, 55, 8, 3),
      ];
      eye = { x: 20, y: 28 };
      break;
    case 'heron':
      parts = [
        ellipse(37, 34, 13, 9),
        path('M29 36 L13 9 L17 7 L33 32 Z'),
        circle(15, 9, 4),
        path('M12 7 L1 11 L12 13 Z'),
        path('M47 30 L59 35 L46 39 Z'),
        path('M33 42 L32 62 L35 62 L37 42 Z'),
        path('M39 42 L40 63 L43 63 L42 42 Z'),
      ];
      eye = { x: 15, y: 8 };
      break;
    default:
      parts = [ellipse(32, 40, 16, 16)];
  }

  const g = svgEl('g', { class: `tok tok-${species.art}` });
  g.append(silhouette(fill, parts));
  if (eye) g.append(eyeDot(eye.x, eye.y));
  return g;
}

/** Small flat chip version (ledger rows, biome strips) — viewBox 64, centered. */
export function speciesChip(species: SpeciesDef, size = 34): SVGElement {
  const svg = svgEl('svg', {
    viewBox: '8 0 48 56',
    width: size,
    height: (size * 56) / 48,
    'aria-hidden': 'true',
  });
  const g = speciesToken(species);
  svg.append(g);
  return svg;
}

// ---------------------------------------------------------------------------
// Diorama scene bands
// ---------------------------------------------------------------------------

export const SCENE_W = 1000;
export const SCENE_H = 620;

function band(d: string, fill: string): SVGElement {
  return svgEl('path', { d, fill, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' });
}

function cloud(x: number, y: number, w: number, h: number): SVGElement {
  return svgEl('rect', {
    x,
    y,
    width: w,
    height: h,
    rx: h / 2,
    fill: 'var(--paper-raised)',
    opacity: 0.9,
    stroke: 'var(--ink)',
    'stroke-width': 2.5,
  });
}

function sunDisc(cx: number, cy: number, r: number): SVGElement {
  return svgEl('circle', { cx, cy, r, fill: 'var(--sun)', stroke: 'var(--ink)', 'stroke-width': 3 });
}

/** Meadow bands: sky → far ridge → mid hill → clay ground. */
function meadowScene(): SVGElement {
  const g = svgEl('g', { class: 'scene' });
  g.append(svgEl('rect', { x: 0, y: 0, width: SCENE_W, height: 250, fill: 'var(--sky)' }));
  g.append(sunDisc(760, 92, 46));
  g.append(cloud(110, 78, 116, 18));
  g.append(cloud(430, 52, 84, 14));
  g.append(
    band(
      'M0 250 L130 172 L300 238 L470 150 L640 232 L820 168 L1000 238 L1000 340 L0 340 Z',
      'var(--sage)',
    ),
  );
  g.append(
    band(
      'M0 316 L170 250 L400 308 L620 244 L840 300 L1000 258 L1000 440 L0 440 Z',
      'var(--leaf)',
    ),
  );
  g.append(
    band(
      'M0 404 C200 382 380 424 520 408 C700 386 860 422 1000 400 L1000 620 L0 620 Z',
      'var(--clay)',
    ),
  );
  // ink grass ticks on the clay for texture
  for (const [x, y] of [
    [80, 470],
    [150, 520],
    [260, 490],
    [380, 530],
    [500, 480],
    [620, 550],
    [740, 500],
    [850, 545],
    [940, 490],
    [320, 575],
  ]) {
    g.append(
      svgEl('path', {
        d: `M${x} ${y} l-5 -14 M${x + 6} ${y} l2 -12`,
        stroke: 'var(--forest-deep)',
        'stroke-width': 2.5,
        'stroke-linecap': 'round',
        fill: 'none',
        opacity: 0.55,
      }),
    );
  }
  return g;
}

/** Wetland bands: sky → far marsh → water with mud islands. */
function wetlandScene(): SVGElement {
  const g = svgEl('g', { class: 'scene' });
  g.append(svgEl('rect', { x: 0, y: 0, width: SCENE_W, height: 220, fill: 'var(--sky)' }));
  g.append(sunDisc(206, 62, 36));
  g.append(cloud(600, 60, 100, 15));
  g.append(
    band('M0 220 L160 178 L340 224 L560 170 L780 226 L1000 182 L1000 312 L0 312 Z', 'var(--sage)'),
  );
  g.append(
    svgEl('path', {
      d: 'M0 272 C240 260 420 288 620 276 C780 266 900 286 1000 274 L1000 620 L0 620 Z',
      fill: 'var(--sky-deep)',
      stroke: 'var(--ink)',
      'stroke-width': 3,
    }),
  );
  // water reflection dashes
  for (const [x, y, w] of [
    [140, 360, 60],
    [700, 340, 80],
    [420, 420, 54],
    [840, 450, 66],
    [240, 500, 48],
    [560, 480, 72],
  ]) {
    g.append(
      svgEl('path', {
        d: `M${x} ${y} q ${w / 2} 7 ${w} 0`,
        stroke: 'var(--paper-raised)',
        'stroke-width': 3,
        fill: 'none',
        opacity: 0.5,
        'stroke-linecap': 'round',
      }),
    );
  }
  // mud islands
  g.append(
    svgEl('ellipse', { cx: 210, cy: 548, rx: 150, ry: 34, fill: 'var(--clay)', stroke: 'var(--ink)', 'stroke-width': 3 }),
  );
  g.append(
    svgEl('ellipse', { cx: 660, cy: 574, rx: 180, ry: 38, fill: 'var(--clay)', stroke: 'var(--ink)', 'stroke-width': 3 }),
  );
  g.append(
    svgEl('ellipse', { cx: 470, cy: 470, rx: 90, ry: 18, fill: 'var(--clay)', stroke: 'var(--ink)', 'stroke-width': 3, opacity: 0.92 }),
  );
  return g;
}

export function sceneFor(biomeId: string): SVGElement {
  return biomeId === 'wetland' ? wetlandScene() : meadowScene();
}

// ---------------------------------------------------------------------------
// Token placement zones (normalized 0-1 within the scene box)
// ---------------------------------------------------------------------------

export interface Zone {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Base token width in scene units. */
  size: number;
}

export const ZONES: Record<string, Record<string, Zone>> = {
  meadow: {
    grass: { x0: 0.02, x1: 0.98, y0: 0.66, y1: 0.9, size: 48 },
    rabbit: { x0: 0.04, x1: 0.96, y0: 0.55, y1: 0.73, size: 42 },
    fox: { x0: 0.05, x1: 0.93, y0: 0.44, y1: 0.58, size: 50 },
    hawk: { x0: 0.05, x1: 0.95, y0: 0.08, y1: 0.27, size: 46 },
  },
  wetland: {
    reeds: { x0: 0.02, x1: 0.98, y0: 0.44, y1: 0.8, size: 52 },
    hopper: { x0: 0.05, x1: 0.95, y0: 0.34, y1: 0.5, size: 34 },
    frog: { x0: 0.06, x1: 0.94, y0: 0.54, y1: 0.74, size: 38 },
    heron: { x0: 0.08, x1: 0.92, y0: 0.5, y1: 0.84, size: 54 },
  },
};

/** Visual token count: how many silhouettes represent a population. */
export function visualCount(species: SpeciesDef, population: number): number {
  if (population <= 0) return 0;
  const per: Record<string, number> = { plant: 10, herbivore: 3, predator: 2, top: 1 };
  const divisor = per[species.trophic] ?? 1;
  return Math.min(12, Math.max(1, Math.round(population / divisor)));
}

/** Deterministic anchor point for token i of a species (seeded jitter). */
export function tokenAnchor(zone: Zone, i: number, count: number, seed: number): { x: number; y: number; scale: number; flip: boolean } {
  // simple LCG — stable across renders for the same (seed, i)
  let a = (seed + i * 2654435761) >>> 0;
  const next = () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
  const slot = count <= 1 ? 0.5 : i / (count - 1);
  const spread = 0.68;
  const x = (zone.x0 + (zone.x1 - zone.x0) * (0.5 + (slot - 0.5) * spread)) * SCENE_W;
  const y = (zone.y0 + (zone.y1 - zone.y0) * (0.25 + next() * 0.5)) * SCENE_H;
  const scale = 0.82 + next() * 0.36;
  return { x, y, scale, flip: next() > 0.5 };
}

// ---------------------------------------------------------------------------
// UI icons — ink stroke drawings (24×24 box, stroke 2.2)
// ---------------------------------------------------------------------------

export type IconName =
  | 'play'
  | 'pause'
  | 'step'
  | 'reset'
  | 'web'
  | 'chart'
  | 'notes'
  | 'close'
  | 'back'
  | 'up'
  | 'down'
  | 'steady'
  | 'gone'
  | 'check'
  | 'dash'
  | 'laurel'
  | 'book';

const ICON_PATHS: Record<IconName, string> = {
  play: 'M8 5.5 L18 12 L8 18.5 Z',
  pause: 'M8 5.5 V18.5 M16 5.5 V18.5',
  step: 'M6 5.5 L14 12 L6 18.5 Z M17 5.5 V18.5',
  reset: 'M5 12 a7 7 0 1 0 2.05-4.95 M6.5 3.8 V7.6 H10.3',
  web: 'M5 5 L12 10 M12 10 L19 5 M12 10 L12 19 M5 5 h0.01 M19 5 h0.01 M12 10 h0.01 M12 19 h0.01',
  chart: 'M4 19 h16 M4 19 V5 M6.5 15 L10 10.5 L13 13 L18 6.5',
  notes: 'M5 4.5 h10.5 a2 2 0 0 1 2 2 V19.5 H7 a2 2 0 0 1 -2 -2 Z M17.5 6.5 h1.5 v13 h-1.5 M8 8.5 h6 M8 12 h6',
  close: 'M6 6 L18 18 M18 6 L6 18',
  back: 'M14 5 L7 12 L14 19 M7 12 h11',
  up: 'M12 5 L19 15 H5 Z',
  down: 'M12 19 L5 9 H19 Z',
  steady: 'M5 12 H19',
  gone: 'M12 4 a8 8 0 1 0 0 16 a8 8 0 1 0 0-16 M6.5 6.5 L17.5 17.5',
  check: 'M4.5 12.5 L10 18 L19.5 6.5',
  dash: 'M5 12 H19',
  laurel: 'M12 20 C7 18.5 4.5 14.5 4.5 10 V5 M12 20 C17 18.5 19.5 14.5 19.5 10 V5 M4.5 5 C6 7.5 9 8 12 7 M19.5 5 C18 7.5 15 8 12 7 M12 7 V13 M9 10.5 L12 13 L15 10.5',
  book: 'M5 4.5 h11 a2 2 0 0 1 2 2 V19.5 H7 a2 2 0 0 1 -2 -2 Z M18 6.5 v13',
};

export function icon(name: IconName, size = 18, filled = false): SVGElement {
  const svg = svgEl('svg', {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: filled ? 'currentColor' : 'none',
    stroke: 'currentColor',
    'stroke-width': 2.2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  });
  svg.append(svgEl('path', { d: ICON_PATHS[name] }));
  return svg;
}

/** Trend icon + word — shape AND text, never color-only (DESIGN_DECISIONS §4). */
export function trendChip(trend: 'rising' | 'falling' | 'steady' | 'gone'): HTMLElement {
  const chip = h('span', { class: `trend trend-${trend}` });
  const map = {
    rising: { icon: 'up' as IconName, label: 'rising' },
    falling: { icon: 'down' as IconName, label: 'falling' },
    steady: { icon: 'steady' as IconName, label: 'steady' },
    gone: { icon: 'gone' as IconName, label: 'gone' },
  };
  chip.append(icon(map[trend].icon, 11, trend === 'rising' || trend === 'falling'));
  chip.append(map[trend].label);
  return chip;
}

/** Mini static diorama for the biome-select plates. */
export function miniScene(biome: BiomeDef, width = 480, height = 220): SVGElement {
  const svg = svgEl('svg', {
    viewBox: `0 0 ${SCENE_W} ${SCENE_H}`,
    width,
    height,
    preserveAspectRatio: 'xMidYMid slice',
    'aria-hidden': 'true',
  });
  svg.append(sceneFor(biome.id));
  const zones = ZONES[biome.id] ?? {};
  for (const sp of biome.species) {
    const zone = zones[sp.id];
    if (!zone) continue;
    const count = Math.max(2, Math.min(6, visualCount(sp, sp.initialPopulation)));
    for (let i = 0; i < count; i++) {
      const a = tokenAnchor(zone, i, count, 77);
      svg.append(positionedToken(sp, zone, a));
    }
  }
  return svg;
}

/** A species token placed at a tokenAnchor (scale + flip around its centre). */
export function positionedToken(sp: SpeciesDef, zone: Zone, a: { x: number; y: number; scale: number; flip: boolean }): SVGElement {
  const sc = (zone.size / 64) * a.scale * 1.5;
  const tok = speciesToken(sp);
  tok.setAttribute(
    'transform',
    `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) scale(${a.flip ? '-' : ''}${sc.toFixed(3)}) translate(-30 -34)`,
  );
  return tok;
}

/** Make a miniScene responsive: width 100%, fixed aspect. */
export function miniSceneResponsive(biome: BiomeDef): SVGElement {
  const svg = miniScene(biome, 0, 0);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  return svg;
}

export { SVG_NS };
