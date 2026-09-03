// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure routing engine for the pathway game — no Vue, no DOM.
// Owns: which stop is next, whether a chosen stop is correct (non-punitive),
// route progress, and the choice set (the pathway's own stops — choosing is
// about the SEQUENCE, not memorizing an external list).

import type { LabData, PathwayDef, StopDef } from '../../lib/types';

export interface RouteState {
  /** Index into pathway.steps of the stop the learner is deciding now. */
  index: number;
  /** Stop ids already confirmed, in order (length === index). */
  confirmed: string[];
  /** Wrong picks for the current index only (cleared on progress). */
  wrongPicks: string[];
  /** Wrong picks across the whole run (for gentle stats). */
  totalWrong: number;
  done: boolean;
}

export function startRoute(): RouteState {
  return { index: 0, confirmed: [], wrongPicks: [], totalWrong: 0, done: false };
}

export function stopById(data: LabData, id: string): StopDef {
  const stop = data.stops.find((t) => t.id === id);
  if (!stop) throw new Error(`Unknown stop "${id}"`);
  return stop;
}

export function pathwayById(data: LabData, id: string): PathwayDef {
  const p = data.pathways.find((w) => w.id === id);
  if (!p) throw new Error(`Unknown pathway "${id}"`);
  return p;
}

/** Unique stops of the pathway, in first-occurrence order — the choice list. */
export function choicesForPathway(data: LabData, pathway: PathwayDef): StopDef[] {
  const seen = new Set<string>();
  const out: StopDef[] = [];
  for (const step of pathway.steps) {
    if (!seen.has(step.stop)) {
      seen.add(step.stop);
      out.push(stopById(data, step.stop));
    }
  }
  return out;
}

/** The correct next stop id at the learner's current index. */
export function expectedStop(pathway: PathwayDef, state: RouteState): string {
  return pathway.steps[state.index].stop;
}

export type PickResult =
  | { kind: 'correct'; state: RouteState }
  | { kind: 'wrong'; state: RouteState; hint: string };

/**
 * Try a stop for the current position. Wrong picks never reset the run —
 * the learner simply tries again (non-punitive, spec). The hint re-grounds
 * the previous step's explanation instead of naming the answer.
 */
export function pickStop(
  data: LabData,
  pathway: PathwayDef,
  state: RouteState,
  stopId: string,
): PickResult {
  if (state.done) return { kind: 'correct', state };
  if (stopId === expectedStop(pathway, state)) {
    const confirmed = [...state.confirmed, stopId];
    const index = state.index + 1;
    const done = index >= pathway.steps.length;
    return {
      kind: 'correct',
      state: { index, confirmed, wrongPicks: [], totalWrong: state.totalWrong, done },
    };
  }
  const chosen = stopById(data, stopId);
  const clue =
    state.index === 0 ? pathway.intro : pathway.steps[state.index - 1].explanation;
  return {
    kind: 'wrong',
    state: {
      ...state,
      wrongPicks: [...state.wrongPicks, stopId],
      totalWrong: state.totalWrong + 1,
    },
    hint: `Not the ${chosen.name.toLowerCase()} — reread the last step: “${clue}”`,
  };
}

/** Rebuild the route geometry source: confirmed stops as nodes. */
export function routeNodes(data: LabData, state: RouteState): StopDef[] {
  return state.confirmed.map((id) => stopById(data, id));
}

/**
 * Dev-time validation: pathways reference real stops, have >= 3 steps, and
 * every pathway chain is replayable (correct picks complete the route).
 */
export function validatePathways(data: LabData): string[] {
  const problems: string[] = [];
  const stopIds = new Set(data.stops.map((t) => t.id));
  for (const p of data.pathways) {
    if (p.steps.length < 3) problems.push(`pathway "${p.id}": fewer than 3 steps.`);
    for (const step of p.steps) {
      if (!stopIds.has(step.stop)) problems.push(`pathway "${p.id}": unknown stop "${step.stop}".`);
    }
    let state = startRoute();
    for (const step of p.steps) {
      const res = pickStop(data, p, state, step.stop);
      if (res.kind !== 'correct') {
        problems.push(`pathway "${p.id}": correct replay failed at stop "${step.stop}".`);
        break;
      }
      state = res.state;
    }
    if (!state.done) problems.push(`pathway "${p.id}": replay did not finish.`);
  }
  return problems;
}
