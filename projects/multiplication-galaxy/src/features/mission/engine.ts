// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure mission logic — no React, no DOM (pilot pattern: the full fact loop is
// simulation-testable headless via scripts/engine-sim.mjs). Content comes from
// JSON; this file only manipulates interaction state.

import type { Galaxy, Mission } from '../../lib/types';

export type Phase = 'question' | 'locked' | 'drifted';

export interface RunState {
  galaxy: Galaxy;
  /** The galaxy's missions, in JSON order. */
  queue: Mission[];
  /** Index of the current mission in the queue. */
  index: number;
  /** Values chosen this mission (wrong picks dim; the child retries freely). */
  picked: number[];
  phase: Phase;
  /** Attempts on the current mission (1 = first try ⇒ streak pip). */
  attempts: number;
  /** Skip-count sequencing: -1 = idle, 0..a-1 = rings lit so far. */
  countStep: number;
  /** Bumped when a lock animation should play. */
  lockKey: number;
  /** Bumped when a drift wobble should play. */
  driftKey: number;
}

export function startRun(galaxy: Galaxy, queue: Mission[]): RunState {
  const first = queue.findIndex((m) => m.id);
  return {
    galaxy,
    queue,
    index: Math.max(0, first),
    picked: [],
    phase: 'question',
    attempts: 0,
    countStep: -1,
    lockKey: 0,
    driftKey: 0,
  };
}

export function currentMission(s: RunState): Mission {
  return s.queue[s.index];
}

export function isLastMission(s: RunState): boolean {
  return s.index >= s.queue.length - 1;
}

/** Fact readout for the current mission, with the masked factor as `null`. */
export function factLabels(m: Mission): { a: number | null; b: number | null; product: number | null } {
  const [a, b] = m.factors;
  if (m.representation === 'array') return { a, b, product: null };
  // missingFactor: product is shown, the missing factor is asked.
  return { a: m.missing === 'a' ? null : a, b: m.missing === 'b' ? null : b, product: a * b };
}

/** Answer a mission by picking one of the four orbital nodes. */
export function choose(s: RunState, value: number): RunState {
  if (s.phase === 'locked') return s;
  const m = currentMission(s);
  const picked = s.picked.includes(value) ? s.picked : [...s.picked, value];
  if (value === m.answer) {
    return { ...s, picked, phase: 'locked', attempts: s.attempts + 1, lockKey: s.lockKey + 1, countStep: -1 };
  }
  return { ...s, picked, phase: 'drifted', attempts: s.attempts + 1, driftKey: s.driftKey + 1 };
}

/** Advance to the next mission (child-paced; called by the Next-fact control). */
export function next(s: RunState): RunState {
  if (s.phase !== 'locked') return s;
  if (isLastMission(s)) return s;
  return {
    ...s,
    index: s.index + 1,
    picked: [],
    phase: 'question',
    attempts: 0,
    countStep: -1,
  };
}

/** Skip-count: light rings one at a time (6 · 12 · 18 · 24). Pure step.
 *  Read-only — works pre-lock (scaffold) AND post-lock (review of the
 *  stabilized system), so the child can always count the groups. */
export function countStep(s: RunState, dir: 1 | -1): RunState {
  const m = currentMission(s);
  const rings = m.factors[0];
  const nextStep = s.countStep + dir;
  if (nextStep >= rings) return { ...s, countStep: rings - 1 };
  if (nextStep < -1) return { ...s, countStep: -1 };
  return { ...s, countStep: nextStep };
}

/** Cumulative satellite count after lighting rings 0..countStep (skip-count value). */
export function countValue(s: RunState): number {
  const m = currentMission(s);
  if (s.countStep < 0) return 0;
  return (s.countStep + 1) * m.factors[1];
}

/** Streak delta for personal state after a pick. */
export function streakAfter(streak: number, wasCorrect: boolean): number {
  if (wasCorrect) return Math.min(streak + 1, 3);
  return 0;
}

/** Headline for the fact readout, numerals-first (`4 × 6 = ?`). */
export function headline(m: Mission): string {
  const f = factLabels(m);
  const a = f.a ?? '?';
  const b = f.b ?? '?';
  const p = f.product ?? '?';
  return m.representation === 'array' ? `${a} × ${b} = ?` : f.a === null ? `? × ${b} = ${p}` : `${a} × ? = ${p}`;
}

/** Text equivalent of the chart for screen readers (spec acceptance item).
 *  Describes the VISUAL only — the visible prompt paragraph carries the
 *  question itself (no triple narration, critique P3). */
export function ariaChart(s: RunState): string {
  const m = currentMission(s);
  const [a, b] = m.factors;
  const drift = s.phase === 'drifted' ? ' The orbit is drifting — try again.' : '';
  const locked = s.phase === 'locked' ? ' The orbit is locked and stable.' : '';
  return `Chart shows ${a} rings with ${b} satellites on each ring, ${a * b} satellites in all. Fact ${s.index + 1} of ${s.queue.length}.${drift}${locked}`;
}

/** Feedback copy — states what happened and where to look, never punitive. */
export function feedbackCopy(s: RunState): { kind: 'locked' | 'drift'; text: string } | null {
  const m = currentMission(s);
  if (s.phase === 'locked') {
    const [a, b] = m.factors;
    return { kind: 'locked', text: `Orbit locked. ${m.representation === 'array' ? `${a} × ${b} is ${m.answer}.` : m.explanation}` };
  }
  if (s.phase === 'drifted') {
    const [a, b] = m.factors;
    const hint =
      m.representation === 'array'
        ? `Count the rings — each carries ${b}.`
        : m.missing === 'a'
          ? `${b} ride each ring; share the ${a * b} out ring by ring.`
          : `${a} equal rings hold the ${a * b} — count one ring's share.`;
    return { kind: 'drift', text: `Signal drifted. ${hint}` };
  }
  return null;
}

// ---------------------------------------------------------------- layout ----

export const PLATE = { baseRadius: 52, maxRadius: 292 };

/**
 * Deterministic array geometry: ring radii + per-ring satellite angles.
 * Pure math shared by the map miniatures and the mission stage so both draw
 * the same system. Drift (pre-lock messiness) is expressed as a per-ring
 * group transform — tilt a few degrees + vertical squash — so satellites ride
 * the SAME ellipse as their ring and follow the lock morph exactly (the
 * initial baked-transform version left satellites off-ring after lock).
 * Satellites are positioned on the FINAL circle; the drift group transform
 * makes them elliptical pre-lock. Jitter derives from the ring index only —
 * stable across renders, identical in simulation.
 */
export function arrayGeometry(a: number, b: number, opts?: { maxRadius?: number; baseRadius?: number }): {
  rings: { radius: number; squash: number; tilt: number; ox: number; oy: number }[];
  satellites: { ring: number; angle: number; x: number; y: number }[];
} {
  const maxRadius = opts?.maxRadius ?? PLATE.maxRadius;
  const baseRadius = opts?.baseRadius ?? PLATE.baseRadius;
  const rings: { radius: number; squash: number; tilt: number; ox: number; oy: number }[] = [];
  const satellites: { ring: number; angle: number; x: number; y: number }[] = [];
  const gap = a > 1 ? (maxRadius - baseRadius) / (a - 1) : 0;
  // Dense systems drift gently: at large radii the same squash/tilt variance
  // that reads as "messy" on 4 rings collapses the radial clearance between
  // adjacent rings (critique P0). Subtle drift keeps the chart countable.
  const dense = a >= 9;
  const squashBase = dense ? 0.05 : 0.08; // max vertical squash deviation
  const tiltRange = dense ? 4 : 8; // degrees
  for (let i = 0; i < a; i++) {
    const radius = baseRadius + gap * i;
    const squash = 1 - squashBase * (0.5 + ((i * 7) % 5) / 8); // 0.94–0.97 dense · 0.9–0.95 sparse
    const tilt = -tiltRange + (((i * 13) % 17) / 17) * tiltRange * 2;
    const ox = (((i * 11) % 5) - 2) * 1.4; // small center drift, SVG units
    const oy = (((i * 5) % 3) - 1) * 1.6;
    rings.push({ radius, squash, tilt, ox, oy });
    const offset = (i * Math.PI) / b; // stagger alternate rings
    for (let j = 0; j < b; j++) {
      const angle = offset + (j * 2 * Math.PI) / b;
      satellites.push({ ring: i, angle, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
  }
  return { rings, satellites };
}

/**
 * Satellite radius (SVG units) with guaranteed clearance (critique P0):
 * never larger than the ring gap (squash-adjusted) minus 4, never larger than
 * the same-ring chord minus 4, shrinks as systems grow, floored at 6.5.
 */
export function satelliteRadius(a: number, b: number): number {
  const gap = a > 1 ? (PLATE.maxRadius - PLATE.baseRadius) / (a - 1) : 999;
  const chord = 2 * PLATE.baseRadius * Math.sin(Math.PI / b);
  const dense = a >= 9;
  // Worst-case radial clearance between adjacent squashed rings.
  const radial = gap * (dense ? 0.93 : 0.9);
  const bySize = b <= 4 ? 13 : b <= 8 ? 11 : 9.5;
  return Math.max(6.5, Math.min(bySize, (radial - 4) / 2, (chord - 4) / 2));
}

/**
 * True minimum satellite separation in SVG units, mirroring the DOM transform
 * (translate + rotate + squash per ring). The sim asserts this against the
 * satellite diameter so overlapping, uncountable charts are impossible.
 */
export function minSatelliteSeparation(a: number, b: number): number {
  const geo = arrayGeometry(a, b);
  const pts = geo.satellites.map((s) => {
    const ring = geo.rings[s.ring];
    const t = (ring.tilt * Math.PI) / 180;
    // scale(1, squash) then rotate(tilt) then translate(ox, oy)
    const sx = s.x;
    const sy = s.y * ring.squash;
    return {
      x: ring.ox + sx * Math.cos(t) - sy * Math.sin(t),
      y: ring.oy + sx * Math.sin(t) + sy * Math.cos(t),
    };
  });
  let min = Infinity;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < min) min = d;
    }
  }
  return min;
}

/** Dense systems (≥90 satellites) render cumulative ring tally labels so the
 *  chart stays countable by text when dots get small (DESIGN_DECISIONS §12). */
export function needsTally(a: number, b: number): boolean {
  return a * b >= 90;
}

/** Galaxy mastery summary for the map + log. Presence = fact locked;
 *  the boolean value records whether it locked on the first try. */
export function galaxyProgress(missions: Mission[], locked: Record<string, boolean>): { total: number; lockedCount: number; complete: boolean } {
  const total = missions.length;
  const lockedCount = missions.filter((m) => Object.prototype.hasOwnProperty.call(locked, m.id)).length;
  return { total, lockedCount, complete: total > 0 && lockedCount === total };
}
