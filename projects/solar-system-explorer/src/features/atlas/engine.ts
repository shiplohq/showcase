// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure atlas engine — every scale, layout, formatter and quiz rule lives here,
// importable headless (no React, no DOM). `scripts/engine-sim.mjs` verifies the
// whole surface without a browser. Scale honesty rules from the spec:
//   - no view pretends to absolute scale; every mode compresses and labels it;
//   - day/year animations run at normalized (log-compressed) speeds — never
//     real-period speeds, which would look frozen;
//   - every visual encoding is paired with an exact numeric readout.

import type { PlanetData } from '../../lib/types';

export type ViewMode = 'distance' | 'size' | 'time';

export const VIEW_MODES: ViewMode[] = ['distance', 'size', 'time'];

export const EARTH_DAY_HOURS = 23.9;
export const EARTH_YEAR_DAYS = 365.2;
export const EARTH_RADIUS_KM = 6371;

// ---------------------------------------------------------------------------
// deterministic random (seeded — same exhibit backdrop and quiz shuffles)
// ---------------------------------------------------------------------------

export type Rand = () => number;

export function seededRandom(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rand: Rand): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------------------
// data validation (dev-time guard — runtime degrades to an error plaque)
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  index: number;
  field: string;
  message: string;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

export function validatePlanets(raw: unknown): { planets: PlanetData[] | null; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!Array.isArray((raw as { planets?: unknown })?.planets)) {
    return { planets: null, issues: [{ index: -1, field: 'planets', message: 'missing planets array' }] };
  }
  const list = (raw as { planets: unknown[] }).planets;
  list.forEach((p, i) => {
    const o = p as Record<string, unknown>;
    if (typeof o.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(o.id)) {
      issues.push({ index: i, field: 'id', message: `id "${String(o.id)}" is not a slug` });
    }
    if (typeof o.name !== 'string' || o.name.length === 0) {
      issues.push({ index: i, field: 'name', message: 'name must be a non-empty string' });
    }
    if (typeof o.order !== 'number' || !Number.isFinite(o.order) || o.order < 1) {
      issues.push({ index: i, field: 'order', message: 'order must be a positive number' });
    }
    for (const f of ['radiusKm', 'dayHours', 'yearDays'] as const) {
      if (typeof o[f] !== 'number' || !Number.isFinite(o[f]) || o[f] <= 0) {
        issues.push({ index: i, field: f, message: `${f} must be a positive number` });
      }
    }
    if (typeof o.moons !== 'number' || !Number.isInteger(o.moons) || o.moons < 0) {
      issues.push({ index: i, field: 'moons', message: 'moons must be a non-negative integer' });
    }
    if (typeof o.distanceAu !== 'number' || !Number.isFinite(o.distanceAu) || o.distanceAu <= 0) {
      issues.push({ index: i, field: 'distanceAu', message: 'distanceAu must be a positive number' });
    }
    if (!Array.isArray(o.colorStops) || o.colorStops.length !== 3 || !(o.colorStops as string[]).every((s) => HEX.test(s))) {
      issues.push({ index: i, field: 'colorStops', message: 'colorStops must be three #rrggbb values' });
    }
    if (!Array.isArray(o.facts) || (o.facts as unknown[]).length < 1 || !(o.facts as unknown[]).every((s) => typeof s === 'string' && s.length > 0)) {
      issues.push({ index: i, field: 'facts', message: 'facts must be a non-empty string array' });
    }
    if (typeof o.sourceNote !== 'string' || o.sourceNote.length === 0) {
      issues.push({ index: i, field: 'sourceNote', message: 'sourceNote must be a non-empty string' });
    }
  });
  const orders = new Set(list.map((p) => (p as { order?: number }).order));
  if (orders.size !== list.length) {
    issues.push({ index: -1, field: 'order', message: 'duplicate order values' });
  }
  if (issues.length > 0) return { planets: null, issues };
  const planets = (list as PlanetData[]).slice().sort((a, b) => a.order - b.order);
  return { planets, issues: [] };
}

export function byOrder(planets: readonly PlanetData[]): PlanetData[] {
  return [...planets].sort((a, b) => a.order - b.order);
}

export function planetById(planets: readonly PlanetData[], id: string): PlanetData | undefined {
  return planets.find((p) => p.id === id);
}

// ---------------------------------------------------------------------------
// formatters (mono readouts — the honest number beside every visual scale)
// ---------------------------------------------------------------------------

export function formatNum(n: number, digits = 1): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export function formatKm(km: number): string {
  return `${formatNum(km, 1)} km`;
}

export function formatDayHours(h: number): string {
  if (h < 100) return `${formatNum(h, 1)} h`;
  return `${formatNum(Math.round(h))} h (${Math.round(h / 24)} d)`;
}

export function formatYearDays(d: number): string {
  if (d < 1000) return `${formatNum(d, 1)} d`;
  return `${formatNum(Math.round(d))} d (${Math.round(d / EARTH_YEAR_DAYS)} yr)`;
}

export function formatAu(au: number): string {
  return `${au < 1 ? au.toFixed(2) : au.toFixed(1)} AU`;
}

export function earthRadii(km: number): string {
  return `${(km / EARTH_RADIUS_KM).toFixed(1)}× Earth`;
}

// ---------------------------------------------------------------------------
// scale mappings (each one documented — spec: no silent absolute scale)
// ---------------------------------------------------------------------------

/**
 * Sphere radius on a SQUARE-ROOT compressed scale.
 * True range Mercury→Jupiter is 28.7×; sqrt shows ~5.4× so small planets
 * stay visible next to giants. Readouts carry the exact numbers.
 */
export function sphereRadius(radiusKm: number, minR: number, maxR: number, planets: readonly PlanetData[]): number {
  const lo = Math.sqrt(Math.min(...planets.map((p) => p.radiusKm)));
  const hi = Math.sqrt(Math.max(...planets.map((p) => p.radiusKm)));
  const t = (Math.sqrt(radiusKm) - lo) / (hi - lo || 1);
  return minR + t * (maxR - minR);
}

/**
 * Horizontal station position on a LOGARITHMIC AU ruler (distance view).
 * Log spacing keeps the inner planets readable while preserving the
 * "each step out multiplies distance" message.
 */
export function distanceFraction(distanceAu: number, planets: readonly PlanetData[]): number {
  const lo = Math.log(Math.min(...planets.map((p) => p.distanceAu)));
  const hi = Math.log(Math.max(...planets.map((p) => p.distanceAu)));
  return (Math.log(distanceAu) - lo) / (hi - lo || 1);
}

/**
 * Day-ring spin period, LOG10-compressed around Earth = 12 s.
 * Real periods span 9.9 h→5832 h (590×); uncompressed animation would freeze
 * Venus for minutes. Compression keeps order and rough ratio legible
 * (Jupiter visibly fastest, Venus slowest) within 6–48 s; readouts show truth.
 */
export function spinSeconds(dayHours: number): number {
  const raw = 12 * (1 + Math.log10(dayHours / EARTH_DAY_HOURS));
  return Math.min(48, Math.max(6, raw));
}

/** Year arc sweep as a fraction of a full circle, relative to the longest year shown. */
export function yearArcFraction(yearDays: number, planets: readonly PlanetData[]): number {
  const max = Math.max(...planets.map((p) => p.yearDays));
  return Math.max(0.02, yearDays / max);
}

/** Log-scaled bar length fraction for compare rows (2% floor so small values stay visible). */
export function logBarFraction(value: number, values: readonly number[]): number {
  const lo = Math.log(Math.min(...values));
  const hi = Math.log(Math.max(...values));
  return Math.max(0.02, (Math.log(value) - lo) / (hi - lo || 1));
}

// ---------------------------------------------------------------------------
// corridor layout (pure geometry — the corridor renders this, GSAP tweens it)
// ---------------------------------------------------------------------------

export interface StationLayout {
  id: string;
  /** centre x on the full scroll track */
  x: number;
  sphereR: number;
  /** gauge ring radius in time view, 0 otherwise */
  ringR: number;
  /** station hit-box */
  boxW: number;
  boxTop: number;
  boxH: number;
  /** label under the datum line */
  tick: string;
  /** plate readout lines (mode-specific — the plate is re-printed per hang) */
  primary: string;
  secondary: string;
}

export interface CorridorLayout {
  mode: ViewMode;
  totalWidth: number;
  viewWidth: number;
  height: number;
  datumY: number;
  sunW: number;
  stations: StationLayout[];
}

export const PLATE_H = 108;
const START_PAD = 24;

export function layoutCorridor(planets: readonly PlanetData[], mode: ViewMode, viewWidth: number, height: number): CorridorLayout {
  const ordered = byOrder(planets);
  const sunW = Math.max(140, Math.min(300, viewWidth * 0.18));
  const trail = viewWidth * 0.55;
  const datumY = Math.max(120, Math.round(height * 0.44));
  const plateTop = height - PLATE_H - 14;

  let sphereR = (p: PlanetData) => sphereRadius(p.radiusKm, 11, 30, planets);
  let xs: number[] = [];
  let tick = (p: PlanetData) => formatAu(p.distanceAu);
  let primary = (p: PlanetData) => formatAu(p.distanceAu);
  let secondary = (p: PlanetData) => `year ${formatNum(Math.round(p.yearDays))} d`;

  if (mode === 'distance') {
    const usable = Math.max(1500, viewWidth * 2.6);
    xs = ordered.map((p) => sunW + START_PAD + distanceFraction(p.distanceAu, planets) * usable);
  } else if (mode === 'size') {
    const maxR = Math.min(height * 0.24, 104);
    sphereR = (p) => sphereRadius(p.radiusKm, 16, maxR, planets);
    const pitch = Math.max(150, maxR * 2.6);
    xs = ordered.map((_, i) => sunW + START_PAD + pitch * (i + 0.5));
    tick = (p) => String(p.order).padStart(2, '0');
    primary = (p) => `${formatNum(Math.round(p.radiusKm))} km`;
    secondary = (p) => earthRadii(p.radiusKm);
  } else {
    const maxR = Math.min(height * 0.16, 44);
    sphereR = (p) => sphereRadius(p.radiusKm, 13, maxR, planets);
    const pitch = Math.max(200, viewWidth / 5.5);
    xs = ordered.map((_, i) => sunW + START_PAD + pitch * (i + 0.5));
    tick = (p) => String(p.order).padStart(2, '0');
    primary = (p) => `day ${formatDayHours(p.dayHours)}`;
    secondary = (p) => `year ${formatNum(Math.round(p.yearDays))} d`;
  }

  const stations: StationLayout[] = ordered.map((p, i) => {
    const r = sphereR(p);
    // gauges are drawn at 128 viewBox-units around a 100-unit sphere, so the
    // drawn ring radius is 1.28× the sphere radius — keep the layout honest
    const rr = mode === 'time' ? r * 1.28 : 0;
    const half = Math.max(r, rr) + 8;
    const boxW = Math.max(124, half * 2);
    const boxTop = Math.max(6, datumY - half - 4);
    return {
      id: p.id,
      x: xs[i],
      sphereR: r,
      ringR: rr,
      boxW,
      boxTop,
      boxH: plateTop + PLATE_H - boxTop,
      tick: tick(p),
      primary: primary(p),
      secondary: secondary(p),
    };
  });

  const lastEdge = Math.max(...stations.map((s) => s.x + s.boxW / 2));
  const totalWidth = Math.ceil(Math.max(sunW + lastEdge + trail, viewWidth));
  return { mode, totalWidth, viewWidth, height, datumY, sunW, stations };
}

// ---------------------------------------------------------------------------
// deterministic starfield (procedural backdrop — no raster asset)
// ---------------------------------------------------------------------------

export interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

export function starField(seed: number, w: number, h: number): Star[] {
  const rand = seededRandom(seed);
  const count = Math.max(60, Math.min(220, Math.round((w * h) / 9000)));
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.round(rand() * w),
      y: Math.round(rand() * h),
      r: 0.5 + rand() * 0.9,
      opacity: 0.08 + rand() * 0.3,
    });
  }
  return stars;
}

// ---------------------------------------------------------------------------
// quiz — sort mode
// ---------------------------------------------------------------------------

export interface SortGrade {
  correct: number;
  settled: boolean[];
  complete: boolean;
}

export function buildSortPool(planets: readonly PlanetData[], rand: Rand): string[] {
  return shuffle(
    byOrder(planets).map((p) => p.id),
    rand,
  );
}

export function gradeSort(placed: readonly (string | null)[], planets: readonly PlanetData[]): SortGrade {
  const key = byOrder(planets).map((p) => p.id);
  const settled = placed.map((id, i) => id === key[i]);
  const correct = settled.filter(Boolean).length;
  return { correct, settled, complete: placed.every((id) => id !== null) && correct === key.length };
}

// ---------------------------------------------------------------------------
// quiz — match mode (records generated from data, distractors = nearest values)
// ---------------------------------------------------------------------------

export interface MatchQuestion {
  id: string;
  prompt: string;
  answerId: string;
  answerName: string;
  choices: string[];
  fact: string;
}

interface RecordSpec {
  id: string;
  prompt: string;
  pick: (planets: readonly PlanetData[]) => PlanetData;
  near: (p: PlanetData) => number;
  fact: (p: PlanetData) => string;
}

const RECORD_SPECS: RecordSpec[] = [
  {
    id: 'longest-day',
    prompt: 'Which planet has the longest day?',
    pick: (ps) => ps.reduce((a, b) => (b.dayHours > a.dayHours ? b : a)),
    near: (p) => p.dayHours,
    fact: (p) => `${p.name} takes ${formatDayHours(p.dayHours)} for one spin — the slowest day in the system.`,
  },
  {
    id: 'fastest-spin',
    prompt: 'Which planet spins the fastest?',
    pick: (ps) => ps.reduce((a, b) => (b.dayHours < a.dayHours ? b : a)),
    near: (p) => p.dayHours,
    fact: (p) => `${p.name} finishes a whole day in just ${formatDayHours(p.dayHours)}.`,
  },
  {
    id: 'longest-year',
    prompt: 'Which planet has the longest year?',
    pick: (ps) => ps.reduce((a, b) => (b.yearDays > a.yearDays ? b : a)),
    near: (p) => p.yearDays,
    fact: (p) => `${p.name} needs ${formatNum(Math.round(p.yearDays))} Earth days to circle the Sun once.`,
  },
  {
    id: 'shortest-year',
    prompt: 'Which planet has the shortest year?',
    pick: (ps) => ps.reduce((a, b) => (b.yearDays < a.yearDays ? b : a)),
    near: (p) => p.yearDays,
    fact: (p) => `${p.name} laps the Sun in only ${formatNum(Math.round(p.yearDays))} days.`,
  },
  {
    id: 'most-moons',
    prompt: 'Which planet has the most confirmed moons?',
    pick: (ps) => ps.reduce((a, b) => (b.moons > a.moons ? b : a)),
    near: (p) => p.moons,
    fact: (p) => `${p.name} holds ${formatNum(p.moons)} confirmed moons — and counting.`,
  },
  {
    id: 'largest',
    prompt: 'Which planet is the largest?',
    pick: (ps) => ps.reduce((a, b) => (b.radiusKm > a.radiusKm ? b : a)),
    near: (p) => p.radiusKm,
    fact: (p) => `${p.name}'s radius is ${formatNum(p.radiusKm)} km — ${(p.radiusKm / EARTH_RADIUS_KM).toFixed(1)}× Earth's.`,
  },
  {
    id: 'smallest',
    prompt: 'Which planet is the smallest?',
    pick: (ps) => ps.reduce((a, b) => (b.radiusKm < a.radiusKm ? b : a)),
    near: (p) => p.radiusKm,
    fact: (p) => `${p.name} is the smallest — only ${formatNum(p.radiusKm)} km in radius.`,
  },
  {
    id: 'farthest',
    prompt: 'Which planet orbits farthest from the Sun?',
    pick: (ps) => ps.reduce((a, b) => (b.distanceAu > a.distanceAu ? b : a)),
    near: (p) => p.distanceAu,
    fact: (p) => `${p.name} orbits ${formatAu(p.distanceAu)} out — about ${(p.distanceAu).toFixed(0)}× farther than Earth.`,
  },
];

export function buildMatchQuestions(planets: readonly PlanetData[], rand: Rand): MatchQuestion[] {
  return RECORD_SPECS.map((spec) => {
    const answer = spec.pick(planets);
    const others = [...planets]
      .filter((p) => p.id !== answer.id)
      .sort((a, b) => Math.abs(spec.near(a) - spec.near(answer)) - Math.abs(spec.near(b) - spec.near(answer)));
    const choices = shuffle([answer.id, ...others.slice(0, 3).map((p) => p.id)], rand);
    return {
      id: spec.id,
      prompt: spec.prompt,
      answerId: answer.id,
      answerName: answer.name,
      choices,
      fact: spec.fact(answer),
    };
  });
}

// ---------------------------------------------------------------------------
// text alternative — the corridor as a data table
// ---------------------------------------------------------------------------

export interface TableRow {
  id: string;
  name: string;
  order: number;
  radiusKm: number;
  dayHours: number;
  yearDays: number;
  moons: number;
  distanceAu: number;
}

export function tableRows(planets: readonly PlanetData[]): TableRow[] {
  return byOrder(planets).map((p) => ({
    id: p.id,
    name: p.name,
    order: p.order,
    radiusKm: p.radiusKm,
    dayHours: p.dayHours,
    yearDays: p.yearDays,
    moons: p.moons,
    distanceAu: p.distanceAu,
  }));
}
