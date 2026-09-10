// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Data contract for the atlas (spec §JSON contract): content state lives in
// public/data/*.json; these are the TypeScript shapes the loader validates
// against at runtime (dev-time guarantee, cheap enough to always run).

export type PlateId = 'sea' | 'nile' | 'andes' | 'europe';

/** Clue predicates — structured so the engine can verify every clue against
 *  the answer place's own data (text and map can never disagree). */
export type Clue =
  | { kind: 'borders'; place: string }
  | { kind: 'north-of'; place: string }
  | { kind: 'south-of'; place: string }
  | { kind: 'east-of'; place: string }
  | { kind: 'west-of'; place: string }
  | { kind: 'coast' }
  | { kind: 'landlocked' }
  | { kind: 'feature'; value: string }
  | { kind: 'climate'; value: string }
  | { kind: 'area-under'; km2: number }
  | { kind: 'area-over'; km2: number }
  | { kind: 'peak-over'; m: number }
  | { kind: 'peak-under'; m: number };

export interface PlaceFacts {
  capital: string;
  areaKm2: number;
  populationM: number;
  highestPointName: string;
  highestPointM: number;
  climate: string; // vocabulary key — see CLIMATES in data.ts
}

export interface Place {
  id: string;
  name: string;
  plate: PlateId;
  /** Geographic centroid [lon, lat] — engine reads relations from this. */
  centroid: [number, number];
  /** Ring polygons as [lon, lat] vertex lists (islands → several rings). */
  polys: [number, number][][];
  /** Neighbor place ids (same plate). Validator enforces symmetry. */
  neighbors: string[];
  /** Feature tags: coast, landlocked, nile, mekong, amazon, andes, alps, med, island… */
  features: string[];
  facts: PlaceFacts;
  /** Label nudging on the map (plate units), for crowded spots. */
  labelShift?: [number, number];
}

export interface RiverDef {
  id: string;
  name: string;
  /** Polyline [lon, lat] points. */
  line: [number, number][];
}

export interface RangeDef {
  id: string;
  name: string;
  line: [number, number][];
}

export interface SeaLabel {
  name: string;
  at: [number, number];
  /** italy: drawn in italic serif on the ocean. */
}

export interface ContextMass {
  id: string;
  polys: [number, number][][];
}

export interface Plate {
  id: PlateId;
  numeral: string;
  name: string;
  caption: string;
  /** [lonMin, latMin, lonMax, latMax] — the plate window on Earth. */
  bounds: [number, number, number, number];
  context: ContextMass[];
  rivers: RiverDef[];
  ranges: RangeDef[];
  seas: SeaLabel[];
}

export type StopKind = 'locate' | 'compare' | 'clue';

interface StopBase {
  id: string;
  kind: StopKind;
  prompt: string;
  /** Where the route marker for this stop sits. */
  at: string;
  /** Option chips (keyboard/tap path). Must include the answer. */
  options: string[];
  feedbackCorrect: string;
  hint: string;
}

export interface LocateStop extends StopBase {
  kind: 'locate';
  answer: string;
  /** Structured claims used in the prompt — validated true at load. */
  claims: Clue[];
}

export interface CompareStop extends StopBase {
  kind: 'compare';
  a: string;
  b: string;
  field: 'areaKm2' | 'populationM' | 'highestPointM';
}

export interface ClueStop extends StopBase {
  kind: 'clue';
  answer: string;
  clues: Clue[];
}

export type TrailStop = LocateStop | CompareStop | ClueStop;

export interface Trail {
  id: string;
  title: string;
  subtitle: string;
  plate: PlateId;
  stops: TrailStop[];
}

export interface AtlasData {
  plates: Plate[];
  places: Place[];
  trails: Trail[];
}

/** Progress — anonymous localStorage state only (no personal data). */
export interface Progress {
  completedStops: string[];
}
