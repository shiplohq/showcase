// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure fraction-bistro engine — no Vue, no DOM, no imports beyond types.
// The UI and scripts/engine-sim.mjs both drive the SAME functions, so the
// whole order book can be played headless (pilot #01 pattern).
// Erasable-TS only (no enums/namespaces) so node can strip types directly.

import type { Fraction, Mode, Order, ResolvedOrder } from '../../lib/types';

// ---- constants -------------------------------------------------------------

export const PARTITIONS: readonly number[] = [2, 3, 4, 6, 8];

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'] as const;

const DENOMINATOR_SINGULAR: Record<number, string> = {
  2: 'half',
  3: 'third',
  4: 'quarter',
  6: 'sixth',
  8: 'eighth',
};

const DENOMINATOR_PLURAL: Record<number, string> = {
  2: 'halves',
  3: 'thirds',
  4: 'quarters',
  6: 'sixths',
  8: 'eighths',
};

// ---- station (one dish + its plate) -----------------------------------------

export interface Station {
  /** number of equal parts the dish is cut into; 1 = whole, uncut */
  partition: number;
  /** slices currently plated (always the first `placed` slice indexes) */
  placed: number;
}

export function startStation(): Station {
  return { partition: 1, placed: 0 };
}

export function setPartition(station: Station, partition: number): Station {
  if (!PARTITIONS.includes(partition)) return station;
  // Re-cutting fuses the dish back together: every slice returns home.
  void station;
  return { partition, placed: 0 };
}

export function placeSlice(station: Station): Station {
  if (!canPlace(station)) return station;
  return { ...station, placed: station.placed + 1 };
}

export function returnSlice(station: Station): Station {
  if (station.placed <= 0) return station;
  return { ...station, placed: station.placed - 1 };
}

export function canPlace(station: Station): boolean {
  return station.partition >= 2 && station.placed < station.partition;
}

export function setPlate(station: Station, partition: number, placed: number): Station {
  void station; // kept for call-site symmetry with the other station actions
  return { partition, placed };
}

/** Fraction currently on the plate. Uncut dish = [0, 1]. */
export function builtFraction(station: Station): Fraction {
  return [station.placed, station.partition];
}

// ---- fraction math (integer cross-multiplication, no floats) ----------------

export function compareFractions(a: Fraction, b: Fraction): Sign {
  const left = a[0] * b[1];
  const right = a[1] * b[0];
  return left > right ? '>' : left < right ? '<' : '=';
}

export function sameValue(a: Fraction, b: Fraction): boolean {
  return compareFractions(a, b) === '=';
}

export type Sign = '<' | '=' | '>';

// ---- words ------------------------------------------------------------------

export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

export function denominatorSingular(d: number): string {
  return DENOMINATOR_SINGULAR[d] ?? `${d}th`;
}

export function denominatorPlural(d: number): string {
  return DENOMINATOR_PLURAL[d] ?? `${d}ths`;
}

export function signWord(sign: Sign): string {
  return sign === '>' ? 'is more than' : sign === '<' ? 'is less than' : 'equals';
}

/** "5/8" */
export function fmt([n, d]: Fraction): string {
  return `${n}/${d}`;
}

/** "5 of 8 equal parts" */
export function slicePhrase([n, d]: Fraction): string {
  return `${n} of ${d} equal parts`;
}

/** "five of eight equal parts" — spoken form for aria labels */
export function spokenFraction([n, d]: Fraction): string {
  return `${numberWord(n)} of ${numberWord(d)} equal parts`;
}

export function modeLabel(mode: Mode): string {
  return mode === 'build' ? 'Build' : mode === 'compare' ? 'Compare' : 'Same amount';
}

// ---- serving ----------------------------------------------------------------

export type OutcomeKind =
  | 'servito'
  | 'empty'
  | 'cut-mismatch'
  | 'count-mismatch'
  | 'amount-mismatch'
  | 'sign-mismatch';

export interface ServeOutcome {
  ok: boolean;
  kind: OutcomeKind;
  message: string;
}

function slices(n: number): string {
  return `${n} ${n === 1 ? 'slice' : 'slices'}`;
}

/** Build mode: cut the dish, plate the exact requested fraction, serve. */
export function serveBuild(order: ResolvedOrder, station: Station): ServeOutcome {
  const [num, den] = order.requestedFraction;
  if (station.placed === 0) {
    return {
      ok: false,
      kind: 'empty',
      message: `The plate is empty. Cut the ${order.dishName} and add ${slices(num)}.`,
    };
  }
  if (station.partition !== den) {
    return {
      ok: false,
      kind: 'cut-mismatch',
      message: `Not yet. The ticket asks for ${denominatorPlural(den)}: cut the ${order.dishName} into ${den} equal parts first.`,
    };
  }
  if (station.placed !== num) {
    return {
      ok: false,
      kind: 'count-mismatch',
      message: `Close! The ticket wants ${slices(num)}, and the plate has ${station.placed}.`,
    };
  }
  return {
    ok: true,
    kind: 'servito',
    message: `Servito! ${slicePhrase(order.requestedFraction)} of the ${order.dishName} are ${fmt(order.requestedFraction)}.`,
  };
}

/**
 * Equivalent mode ("same amount"): the chef's plate already shows
 * `requestedFraction` (partition = its denominator). The learner must cut the
 * second dish into `partitionCount` parts and cover the SAME amount.
 */
export function serveEquivalent(order: ResolvedOrder, station: Station): ServeOutcome {
  if (station.placed === 0) {
    return {
      ok: false,
      kind: 'empty',
      message: `Your plate is empty. Cut the ${order.dishName} into ${order.partitionCount} and cover the chef's amount.`,
    };
  }
  if (station.partition !== order.partitionCount) {
    return {
      ok: false,
      kind: 'cut-mismatch',
      message: `Cover the same amount in ${denominatorPlural(order.partitionCount)}: cut the ${order.dishName} into ${order.partitionCount} equal parts.`,
    };
  }
  const built = builtFraction(station);
  if (!sameValue(built, order.requestedFraction)) {
    return {
      ok: false,
      kind: 'amount-mismatch',
      message: `That's ${fmt(built)} of the ${order.dishName}; the chef plated ${fmt(order.requestedFraction)}. Cover the same amount.`,
    };
  }
  return {
    ok: true,
    kind: 'servito',
    message: `Servito! ${fmt(order.requestedFraction)} and ${fmt(built)} cover the same amount.`,
  };
}

/** Compare mode: build both fractions, then pick the sign between them. */
export function serveCompare(
  order: ResolvedOrder,
  a: Station,
  b: Station,
  sign: Sign | null,
): ServeOutcome {
  const [numA, denA] = order.requestedFraction;
  const fracB = order.compareWith ?? [1, 1];
  const [numB, denB] = fracB;
  if (a.placed === 0 || b.placed === 0) {
    return {
      ok: false,
      kind: 'empty',
      message: 'Plate both orders first: each plate needs its slices.',
    };
  }
  if (a.partition !== denA) {
    return {
      ok: false,
      kind: 'cut-mismatch',
      message: `The left ticket asks for ${denominatorPlural(denA)}: cut the left ${order.dishName} into ${denA} equal parts.`,
    };
  }
  if (b.partition !== denB) {
    return {
      ok: false,
      kind: 'cut-mismatch',
      message: `The right ticket asks for ${denominatorPlural(denB)}: cut the right ${order.dishName} into ${denB} equal parts.`,
    };
  }
  if (a.placed !== numA || b.placed !== numB) {
    return {
      ok: false,
      kind: 'count-mismatch',
      message: `The left plate wants ${slices(numA)} (has ${a.placed}); the right wants ${slices(numB)} (has ${b.placed}).`,
    };
  }
  if (sign === null) {
    return {
      ok: false,
      kind: 'sign-mismatch',
      message: 'Choose a sign: is the left amount less, equal, or more?',
    };
  }
  const expected = expectedSign(order);
  if (sign !== expected) {
    return {
      ok: false,
      kind: 'sign-mismatch',
      message: 'Look at the plates again: which amount covers more of the dish?',
    };
  }
  return {
    ok: true,
    kind: 'servito',
    message: `Servito! ${fmt(order.requestedFraction)} ${signWord(expected)} ${fmt(fracB)}.`,
  };
}

/** Ground-truth comparison for a compare order (integer math). */
export function expectedSign(order: Order): Sign {
  const b = order.compareWith;
  if (!b) return '=';
  return compareFractions(order.requestedFraction, b);
}

/** Dispatch helper: serve any order with the right station set. */
export function serve(
  order: ResolvedOrder,
  stations: { main: Station; right?: Station },
  sign: Sign | null = null,
): ServeOutcome {
  if (order.mode === 'build') return serveBuild(order, stations.main);
  if (order.mode === 'equivalent') return serveEquivalent(order, stations.main);
  return serveCompare(order, stations.main, stations.right ?? startStation(), sign);
}

// ---- recipe book ------------------------------------------------------------

/** An equivalence discovered by completing a "same amount" order. */
export function recipeFrom(order: ResolvedOrder): { left: Fraction; right: Fraction } | null {
  if (order.mode !== 'equivalent') return null;
  return { left: order.requestedFraction, right: order.compareWith ?? [1, 1] };
}
