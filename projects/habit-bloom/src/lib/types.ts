// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content contract (spec JSON contract): habits.seed.json is the single
// source of truth for the demo garden. Nothing about a habit is hard-coded
// in a component — a new habit is added by adding JSON.

/** Plant families the procedural stem renderer knows how to draw. */
export type PlantKind = 'fern' | 'sprout' | 'blossom' | 'marigold';

export type Cadence = 'daily' | 'weekly';

export interface HabitSeed {
  /** Stable id — also the seed for the deterministic stem geometry. */
  id: string;
  /** Learner-facing name, e.g. "Read 20 minutes". */
  name: string;
  cadence: Cadence;
  /** Plant family — drives leaf shape and bloom accent. */
  plant: PlantKind;
  /** ISO dates (YYYY-MM-DD) of past check-ins, unordered, unique. */
  history: string[];
}

/** Runtime habit — a seed clone whose history/order the session may change. */
export interface Habit extends HabitSeed {}

export interface SeedData {
  habits: HabitSeed[];
}

/** Personal state layer (spec layer 3) — only persisted after opt-in. */
export type Consent = 'unset' | 'local' | 'session';

export interface StoredGarden {
  habits: Habit[];
}
