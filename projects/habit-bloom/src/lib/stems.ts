// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Botanical procedural engine (pure, no React): turns a habit's history into
// deterministic stem geometry — a gentle S-curve, one node per check-in,
// longer internodes for resting gaps. The stem only ever grows; rest is
// spacing, never decay (spec: no streak shaming).
//
// Geometry lives in a normalized viewBox of 100 × 140 units; components map
// it to whatever pixel size they need.

import type { Habit, PlantKind } from './types';
import { daysBetween, isValidIsoDay, todayIso } from './dates';

export interface StemNode {
  /** ViewBox x of the stem at this node. */
  x: number;
  /** ViewBox y of the stem at this node (grows downward from apex). */
  y: number;
  /** Leaf side: -1 left, +1 right (alternating). */
  side: 1 | -1;
  /** 1-based leaf index (oldest first). */
  index: number;
  /** Days rested between the previous check-in and this one (0 = next day). */
  restBefore: number;
  /** True when this node also carries a milestone bloom (every 7 leaves). */
  bloom: boolean;
}

export interface StemGeometry {
  /** Smooth stem path (SVG d attribute), drawn root → apex. */
  path: string;
  nodes: StemNode[];
  /** Apex point (tip of the stem) in viewBox units. */
  apex: { x: number; y: number };
}

/* ---------------------------------------------------------------------- */
/* Deterministic RNG — stable per habit id, so a stem never re-shuffles.  */
/* ---------------------------------------------------------------------- */

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------------- */
/* Stem building                                                          */
/* ---------------------------------------------------------------------- */

const W = 100;
const H = 140;
const ROOT_Y = H - 6;
const APEX_MIN_Y = 14;
/** Resting days are spacing: each rest day stretches the internode a little. */
const BASE_INTERNODE = 13;
const REST_STRETCH = 4.2;
const MIN_INTERNODE = 9;
const MAX_INTERNODE = 26;

/**
 * Build the deterministic stem for a habit.
 *
 * @param habit habit with history (unique valid ISO days)
 */
export function buildStem(habit: Habit): StemGeometry {
  const rng = mulberry32(hashString(habit.id));
  const days = Array.from(new Set(habit.history.filter(isValidIsoDay))).sort();
  const nodes: StemNode[] = [];

  // Total available height; internodes compress gently when the history is
  // long so the stem never leaves the viewBox (cap the drawn leaves at 34).
  const drawn = days.slice(-34);
  const totalGrowth = drawn.reduce((sum, day, i) => {
    const rest = i === 0 ? 0 : Math.max(0, daysBetween(days[i - 1], day) - 1);
    return sum + clamp(BASE_INTERNODE + rest * REST_STRETCH, MIN_INTERNODE, MAX_INTERNODE);
  }, 0);
  const scale = totalGrowth > 0 ? Math.min(1, (ROOT_Y - APEX_MIN_Y) / totalGrowth) : 1;

  // Walk from the root upward, oldest check-in first.
  let y = ROOT_Y;
  let x = W / 2;
  let angle = -Math.PI / 2; // heading up
  const points: Array<{ x: number; y: number }> = [{ x, y }];

  drawn.forEach((day, i) => {
    const rest = i === 0 ? 0 : Math.max(0, daysBetween(days[i - 1], day) - 1);
    const len = clamp(BASE_INTERNODE + rest * REST_STRETCH, MIN_INTERNODE, MAX_INTERNODE) * scale;
    // Gentle wander: small deterministic heading jitter, biased back to center.
    const wander = (rng() - 0.5) * 0.34;
    const pullBack = ((W / 2 - x) / (W / 2)) * 0.22;
    angle += wander + pullBack;
    angle = clamp(angle, -Math.PI / 2 - 0.42, -Math.PI / 2 + 0.42);
    x = clamp(x + Math.cos(angle) * len, 10, W - 10);
    y -= Math.abs(Math.sin(angle)) * len;
    points.push({ x, y });

    nodes.push({
      x,
      y,
      side: i % 2 === 0 ? 1 : -1,
      index: i + 1,
      restBefore: rest,
      bloom: (i + 1) % 7 === 0,
    });
  });

  return {
    path: smoothPath(points),
    nodes,
    apex: { x: points[points.length - 1].x, y: points[points.length - 1].y },
  };
}

/** Catmull-Rom-ish smoothing through points as cubic segments. */
function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/* ---------------------------------------------------------------------- */
/* Leaf geometry — per plant family, drawn around (0,0), tip along +x.     */
/* ---------------------------------------------------------------------- */

export interface LeafSpec {
  /** SVG path(s) for one leaf, in local units (≈ 1 = 1 viewBox unit). */
  paths: string[];
  /** Leaf scale relative to other families. */
  scale: number;
  /** Fill color token name resolved by the renderer. */
  colorKey: 'pine' | 'orchid' | 'marigold';
}

/**
 * Leaf path per plant family. All paths face +x from the petiole origin;
 * the renderer rotates them to the node side and stem heading.
 */
export function leafSpec(plant: PlantKind): LeafSpec {
  switch (plant) {
    case 'fern':
      // A short pinna: slender blade with two notches, drawn as two arcs.
      return {
        paths: [
          'M 0 0 C 4 -3.4 10 -3.8 14.6 -1.2 C 10 0.9 4 1.4 0 0 Z',
          'M 5.4 -1.5 C 6.6 -3.4 8.4 -3.9 9.6 -3.4',
          'M 5.2 1.1 C 6.4 3 8.2 3.5 9.4 3',
        ],
        scale: 1.05,
        colorKey: 'pine',
      };
    case 'sprout':
      // A simple lanceolate leaf with a midrib.
      return {
        paths: [
          'M 0 0 C 4.6 -4.8 12.6 -4.4 16 -0.05 C 12.6 4.3 4.6 4.7 0 0 Z',
          'M 1 0 L 13.4 -0.05',
        ],
        scale: 1,
        colorKey: 'pine',
      };
    case 'blossom':
      // Rounded petal-like leaf.
      return {
        paths: ['M 0 0 C 3.4 -5.4 12.4 -5.8 14.4 -0.05 C 12.4 5.7 3.4 5.3 0 0 Z'],
        scale: 1,
        colorKey: 'orchid',
      };
    case 'marigold':
      // Notched marigold foliage.
      return {
        paths: [
          'M 0 0 C 3 -4.2 8.2 -4.6 11.4 -2.6 C 9.4 -2.9 8.6 -1.9 10 -0.05 C 8.6 1.8 9.4 2.8 11.4 2.5 C 8.2 4.5 3 4.1 0 0 Z',
        ],
        scale: 1,
        colorKey: 'marigold',
      };
  }
}

/** Five-petal bloom path for milestone nodes, centered at (0,0). */
export function bloomPath(): string {
  const petals: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const cx = Math.cos(a) * 4.6;
    const cy = Math.sin(a) * 4.6;
    petals.push(
      `M ${cx.toFixed(2)} ${cy.toFixed(2)} m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0`,
    );
  }
  return petals.join(' ');
}

/** Resting bud: a small dormant scale on resting days (detail view). */
export function budPath(): string {
  return 'M 0 0 C 1.6 -2.6 4.8 -2.6 5.6 0 C 4.8 2.6 1.6 2.6 0 0 Z';
}

/* ---------------------------------------------------------------------- */
/* Garden stats — descriptive only, never comparative.                    */
/* ---------------------------------------------------------------------- */

export interface HabitStats {
  leaves: number;
  plantedOn: string | null;
  /** Check-ins inside the last 28 days — "lately" phrasing, not streaks. */
  lately: number;
  doneToday: boolean;
}

export function habitStats(habit: Habit, today = todayIso()): HabitStats {
  const days = Array.from(new Set(habit.history.filter(isValidIsoDay))).sort();
  const leaves = days.length;
  return {
    leaves,
    plantedOn: days.length > 0 ? days[0] : null,
    lately: days.filter((d) => daysBetween(d, today) >= 0 && daysBetween(d, today) < 28).length,
    doneToday: days.includes(today),
  };
}

/** Field-note sentence describing a stem for screen readers. */
export function stemDescription(habit: Habit, today = todayIso()): string {
  const stats = habitStats(habit, today);
  const leafWord = stats.leaves === 1 ? 'leaf' : 'leaves';
  if (stats.leaves === 0) {
    return `${habit.name}: a seedling waiting for its first leaf.`;
  }
  const planted = stats.plantedOn ? `, planted ${stats.plantedOn}` : '';
  return `${habit.name}: ${stats.leaves} ${leafWord}${planted}.`;
}
