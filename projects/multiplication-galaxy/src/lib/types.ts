// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content + personal state types. Content state comes from public/data JSON;
// interaction state lives in features/*/engine.ts; personal state is the
// anonymous localStorage slice (spec's three-layer state model).

/** One table (2–12) as a constellation on the galaxy map. */
export interface Galaxy {
  id: string;
  tableNumber: number;
  title: string;
  constellation: string;
  chapterCopy: string;
  /** Percent position of the constellation group on the map plate. */
  constellationLayout: { x: number; y: number };
  /** Flat two-tone planet fill pair from the locked palette. */
  planetStyle: { base: string; band: string };
}

/** One multiplication fact question (spec JSON contract). */
export interface Mission {
  id: string;
  galaxyId: string;
  /** [rings, satellitesPerRing] — the array drawn on the chart. */
  factors: [number, number];
  representation: 'array' | 'missingFactor';
  /** Which factor is masked in a missingFactor mission; null for array. */
  missing: 'a' | 'b' | null;
  /** The full 4-option set (answer included), as mandated by the spec example. */
  distractors: number[];
  answer: number;
  prompt: string;
  explanation: string;
  difficulty: 1 | 2 | 3;
}

export interface Content {
  galaxies: Galaxy[];
  missions: Mission[];
}

/** Anonymous local progress — no personal data, always resettable. */
export interface PersonalState {
  /** missionId → locked (first-try info drives the log glyph). */
  locked: Record<string, boolean>;
  /** Current signal-strength streak (first-try correct answers in a row). */
  streak: number;
}
