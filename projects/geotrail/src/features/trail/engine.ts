// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure trail engine — no Vue, no DOM, no fetch. All grading, clue
// verification and progress rules live here so engine-sim.mjs can prove the
// whole game from Node. Every transition returns a new state (no mutation).

import type { AtlasData, Clue, Place, Trail, TrailStop } from '../../lib/types';

export type Feedback = 'idle' | 'correct' | 'try-again';

export interface TrailState {
  trailId: string;
  stopIndex: number;
  /** How many clues of the current stop are revealed (clue stops start at 1). */
  revealedClues: number;
  /** Wrong picks at the current stop (drives extra hints, never a penalty). */
  attempts: number;
  feedback: Feedback;
  lastPicked: string | null;
  finished: boolean;
}

export type PlaceMap = Map<string, Place>;

export function buildPlaceMap(places: Place[]): PlaceMap {
  return new Map(places.map((p) => [p.id, p]));
}

// ---------------------------------------------------------------------------
// Clue predicates — the single source of truth for every spatial claim.
// The same function grades clue stops AND validates authored content, so the
// printed clue text and the map data can never disagree.
// ---------------------------------------------------------------------------

export function clueHolds(clue: Clue, place: Place, byId: PlaceMap): boolean {
  switch (clue.kind) {
    case 'coast':
      return place.features.includes('coast');
    case 'landlocked':
      return place.features.includes('landlocked');
    case 'feature':
      return place.features.includes(clue.value);
    case 'climate':
      return place.facts.climate === clue.value;
    case 'area-under':
      return place.facts.areaKm2 < clue.km2;
    case 'area-over':
      return place.facts.areaKm2 > clue.km2;
    case 'peak-over':
      return place.facts.highestPointM > clue.m;
    case 'peak-under':
      return place.facts.highestPointM < clue.m;
    case 'borders': {
      const other = byId.get(clue.place);
      return !!other && place.neighbors.includes(other.id);
    }
    case 'north-of':
    case 'south-of':
    case 'east-of':
    case 'west-of': {
      const other = byId.get(clue.place);
      if (!other) return false;
      const [, latA] = place.centroid;
      const [, latB] = other.centroid;
      const [lonA] = place.centroid;
      const [lonB] = other.centroid;
      switch (clue.kind) {
        case 'north-of':
          return latA > latB;
        case 'south-of':
          return latA < latB;
        case 'east-of':
          return lonA > lonB;
        case 'west-of':
          return lonA < lonB;
      }
      return false; // unreachable
    }
  }
}

/** Human sentence for a clue (used by the UI and by the sim's text checks). */
export function clueText(clue: Clue, byId: PlaceMap): string {
  const name = (id: string) => byId.get(id)?.name ?? id;
  switch (clue.kind) {
    case 'coast':
      return 'It touches the sea.';
    case 'landlocked':
      return 'It is landlocked — no coast at all.';
    case 'feature':
      return `It is known for ${clue.value.replace(/-/g, ' ')}.`;
    case 'climate':
      return `Its climate is ${clue.value}.`;
    case 'area-under':
      return `It is smaller than ${clue.km2.toLocaleString('en-US')} km².`;
    case 'area-over':
      return `It is larger than ${clue.km2.toLocaleString('en-US')} km².`;
    case 'peak-over':
      return `Its highest point is above ${clue.m.toLocaleString('en-US')} m.`;
    case 'peak-under':
      return `Its highest point is below ${clue.m.toLocaleString('en-US')} m.`;
    case 'borders':
      return `It borders ${name(clue.place)}.`;
    case 'north-of':
      return `It lies north of ${name(clue.place)}.`;
    case 'south-of':
      return `It lies south of ${name(clue.place)}.`;
    case 'east-of':
      return `It lies east of ${name(clue.place)}.`;
    case 'west-of':
      return `It lies west of ${name(clue.place)}.`;
  }
}

// ---------------------------------------------------------------------------
// Stops & grading
// ---------------------------------------------------------------------------

export function findTrail(data: AtlasData, trailId: string): Trail {
  const trail = data.trails.find((t) => t.id === trailId);
  if (!trail) throw new Error(`Unknown trail "${trailId}"`);
  return trail;
}

export function currentStop(state: TrailState, trail: Trail): TrailStop {
  return trail.stops[state.stopIndex];
}

/** The graded answer — compare stops compute it from the fact data itself,
 *  so the JSON can never carry a wrong answer. */
export function correctAnswerId(stop: TrailStop, byId: PlaceMap): string {
  if (stop.kind === 'compare') {
    const a = byId.get(stop.a);
    const b = byId.get(stop.b);
    if (!a || !b) throw new Error(`compare stop ${stop.id} references a missing place`);
    const av = a.facts[stop.field];
    const bv = b.facts[stop.field];
    return av >= bv ? a.id : b.id;
  }
  return stop.answer;
}

export function startTrail(trailId: string): TrailState {
  return {
    trailId,
    stopIndex: 0,
    revealedClues: 1,
    attempts: 0,
    feedback: 'idle',
    lastPicked: null,
    finished: false,
  };
}

/** Grade a pick (map shape, chip button or dragged label — same rule). */
export function pick(
  state: TrailState,
  stop: TrailStop,
  placeId: string,
  byId: PlaceMap,
): TrailState {
  if (state.feedback === 'correct') return state;
  const answer = correctAnswerId(stop, byId);
  if (placeId === answer) {
    return { ...state, feedback: 'correct', lastPicked: placeId };
  }
  return {
    ...state,
    feedback: 'try-again',
    lastPicked: placeId,
    attempts: state.attempts + 1,
  };
}

/** Reveal one more clue (clue stops only; never a penalty). */
export function revealClue(state: TrailState, stop: TrailStop): TrailState {
  if (stop.kind !== 'clue' || state.feedback === 'correct') return state;
  const max = stop.clues.length;
  if (state.revealedClues >= max) return state;
  return { ...state, revealedClues: state.revealedClues + 1 };
}

export function isLastStop(state: TrailState, trail: Trail): boolean {
  return state.stopIndex === trail.stops.length - 1;
}

/** Move to the next stop (or finish the trail). */
export function advance(state: TrailState, trail: Trail): TrailState {
  if (state.feedback !== 'correct') return state;
  if (isLastStop(state, trail)) {
    return { ...state, finished: true };
  }
  return {
    ...state,
    stopIndex: state.stopIndex + 1,
    revealedClues: 1,
    attempts: 0,
    feedback: 'idle',
    lastPicked: null,
  };
}

/** Feedback copy — never punitive; wrong picks add information. */
export function feedbackText(state: TrailState, stop: TrailStop, byId: PlaceMap): string {
  if (state.feedback === 'correct') return stop.feedbackCorrect;
  if (state.feedback === 'try-again') {
    const picked = state.lastPicked ? byId.get(state.lastPicked) : undefined;
    const who = picked ? `That was ${picked.name}.` : 'Not this one.';
    return `${who} ${stop.hint}`;
  }
  return '';
}

/** Polite live-region status for screen readers. */
export function ariaStatus(state: TrailState, trail: Trail): string {
  const n = state.stopIndex + 1;
  const total = trail.stops.length;
  if (state.feedback === 'correct') return `Correct. Stop ${n} of ${total} done.`;
  if (state.feedback === 'try-again') return `Try again. Stop ${n} of ${total}.`;
  return `Stop ${n} of ${total}.`;
}

// ---------------------------------------------------------------------------
// Progress & stamps
// ---------------------------------------------------------------------------

export function totalStops(data: AtlasData): number {
  return data.trails.reduce((sum, t) => sum + t.stops.length, 0);
}

export function trailProgress(trail: Trail, completed: string[]): number {
  return trail.stops.filter((s) => completed.includes(s.id)).length;
}

export function completedInTrail(trail: Trail, completed: string[]): TrailStop[] {
  return trail.stops.filter((s) => completed.includes(s.id));
}

// ---------------------------------------------------------------------------
// Fact formatting (shared by UI + sim text checks)
// ---------------------------------------------------------------------------

export const CLIMATES: Record<string, string> = {
  monsoon: 'Tropical monsoon',
  savanna: 'Tropical savanna',
  rainforest: 'Tropical rainforest',
  desert: 'Hot desert',
  highland: 'Highland',
  mediterranean: 'Mediterranean',
  temperate: 'Temperate',
  maritime: 'Cool maritime',
  varied: 'Many climates',
};

export function climateLabel(key: string): string {
  return CLIMATES[key] ?? key;
}

export function fmtArea(km2: number): string {
  return `${km2.toLocaleString('en-US')} km²`;
}

export function fmtPeople(millions: number): string {
  return `${millions.toLocaleString('en-US', { maximumFractionDigits: 1 })} million`;
}

export function fmtMeters(m: number): string {
  return `${m.toLocaleString('en-US')} m`;
}

export function compareFieldLabel(field: 'areaKm2' | 'populationM' | 'highestPointM'): string {
  switch (field) {
    case 'areaKm2':
      return 'Area';
    case 'populationM':
      return 'People';
    case 'highestPointM':
      return 'Highest point';
  }
}
