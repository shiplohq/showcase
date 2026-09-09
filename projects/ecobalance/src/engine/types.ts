// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// EcoBalance engine types — pure data contracts shared by the simulation
// engine, the JSON content files and the UI. No DOM, no framework.

/** Trophic role of a species (drives rule application + UI copy). */
export type TrophicKind = 'plant' | 'herbivore' | 'predator' | 'top';

/** Diorama band a species occupies (placement + food-web geometry). */
export type ZoneKind = 'ground' | 'water' | 'shore' | 'air';

export interface GrowthRules {
  /** Fractional logistic growth rate per season. */
  rate: number;
  /** Carrying capacity (how many the habitat can feed). */
  capacity: number;
}

export interface DietRule {
  /** prey species id -> per-capita attack rate (share of prey pop one individual harvests per season). */
  prey: Record<string, { rate: number }>;
}

export interface MetabolismRules {
  /** Max per-capita birth fraction per season when fully fed. */
  birthMax: number;
  /** Prey units one individual needs per season to be fully fed. */
  foodNeed: number;
  /** Fraction starving when food is below need. */
  starveRate: number;
  /** Baseline old-age/illness death fraction per season. */
  baseDeath: number;
}

export interface SpeciesDef {
  id: string;
  /** Plural label, e.g. "Rabbits". */
  label: string;
  /** Singular label, e.g. "rabbit". */
  singular: string;
  trophic: TrophicKind;
  zone: ZoneKind;
  initialPopulation: number;
  /** Hard clamp [min, max] applied every season. */
  limits: [number, number];
  /** Chart/silhouette accent color token. */
  colorToken: 'leaf' | 'ochre' | 'clay' | 'sky';
  /** Silhouette art id (see components/art.ts). */
  art: string;
  growth?: GrowthRules;
  diet?: DietRule;
  metabolism?: MetabolismRules;
  /** Transparent-rule sentences rendered in Model notes (from JSON). */
  notes: string[];
}

export interface BiomeDef {
  id: string;
  name: string;
  tagline: string;
  habitatNote: string;
  /** Biome-level model notes rendered under species notes. */
  rules: string[];
  species: SpeciesDef[];
}

export type ChallengeEventType =
  | 'capacityFactor' // multiply carrying capacity of target species for a duration
  | 'growthFactor' // multiply growth rate of target species for a duration
  | 'populationSet' // hard-set population (rounded)
  | 'populationAdd'; // add (or subtract) individuals

export interface ChallengeEventDef {
  /** 1-based season at which the event fires. */
  turn: number;
  type: ChallengeEventType;
  speciesId: string;
  /** Factor (0-2) for *Factor types; count for populationSet/Add. */
  value: number;
  /** How many seasons a factor stays active (default 1). */
  duration?: number;
  label: string;
  message: string;
}

export interface ChallengeDef {
  id: string;
  biomeId: string;
  title: string;
  brief: string;
  /** Deterministic seed — same seed, same weather + event sequence. */
  seed: number;
  events: ChallengeEventDef[];
  /** speciesId -> [min, max] that must ALL hold for holdTurns consecutive seasons. */
  targetRanges: Record<string, [number, number]>;
  /** Consecutive seasons inside all target ranges needed to succeed. */
  holdTurns: number;
  /** Season limit — the study ends after this many seasons. */
  maxTurns: number;
  tip: string;
}

// ---------------------------------------------------------------------------
// Simulation state (pure engine output)
// ---------------------------------------------------------------------------

export type CauseKey =
  | 'released' // player released individuals
  | 'removed' // player removed individuals
  | 'event' // scripted event add/remove
  | 'grew' // producer logistic growth
  | 'dieback' // producer above capacity shrank
  | 'born' // consumer births
  | 'eaten' // killed by predators
  | 'starved' // insufficient food
  | 'died'; // baseline deaths

export interface Cause {
  key: CauseKey;
  count: number;
  /** Actor species id (predator for 'eaten'). */
  actor?: string;
  /** Event label for 'event'. */
  note?: string;
}

export interface SpeciesTick {
  id: string;
  before: number;
  after: number;
  causes: Cause[];
}

export interface TickResult {
  /** 1-based season number of this tick. */
  season: number;
  species: Record<string, SpeciesTick>;
  /** Events that fired at the start of this season. */
  eventsFired: { label: string; message: string }[];
}

export interface ActiveFactor {
  speciesId: string;
  type: 'capacity' | 'growth';
  factor: number;
  /** Last season (inclusive) the factor applies. */
  until: number;
  label: string;
}

export interface SimState {
  biomeId: string;
  seed: number;
  /** Completed seasons (0 = fresh start, populations = initial). */
  season: number;
  populations: Record<string, number>;
  /** Player plan per species (-10..10), consumed by the next step. */
  plans: Record<string, number>;
  history: TickResult[];
  activeFactors: ActiveFactor[];
}

export type TrendKind = 'rising' | 'falling' | 'steady' | 'gone';
