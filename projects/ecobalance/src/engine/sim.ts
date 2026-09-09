// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// EcoBalance simulation engine — pure TypeScript, no DOM, no framework.
//
// Transparent discrete-time rules (one "season" per step):
//   1. Player plans (release/remove) apply.
//   2. Scheduled challenge events fire (capacity/growth factors, population
//      set/add) — deterministic by season number.
//   3. Weather wobble (seeded, ±10%) multiplies producer growth.
//   4. Producers grow logistically toward their effective capacity
//      (die back when above it).
//   5. Consumers eat: per-capita intake from prey snapshot decides births and
//      starvation; prey losses are applied live with a per-predator harvest
//      cap so no prey is wiped out by a single predator in one season.
//      A fully-fed population always raises at least one young (minimum
//      viable breeding — small populations never freeze at 1-2 individuals).
//   6. Baseline deaths, clamp to [0, limits.max], integers only.
//
// Every change is returned as a typed Cause so the UI can show WHY each
// population moved — the "transparent rules" the spec requires.

import { mulberry32 } from './rng.ts';
import type {
  ActiveFactor,
  BiomeDef,
  Cause,
  CauseKey,
  ChallengeEventDef,
  SimState,
  SpeciesDef,
  SpeciesTick,
  TickResult,
  TrendKind,
} from './types.ts';

export const MAX_PLAN = 10;

export function createSim(biome: BiomeDef, seed: number): SimState {
  const populations: Record<string, number> = {};
  const plans: Record<string, number> = {};
  for (const s of biome.species) {
    populations[s.id] = clamp(s.initialPopulation, s.limits[0], s.limits[1]);
    plans[s.id] = 0;
  }
  return {
    biomeId: biome.id,
    seed,
    season: 0,
    populations,
    plans,
    history: [],
    activeFactors: [],
  };
}

/** Deterministic weather for a season: multiplier in [0.9, 1.1]. */
function weather(seed: number, season: number): number {
  const rng = mulberry32((seed ^ Math.imul(season, 2654435761)) >>> 0);
  return rng.range(0.9, 1.1);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function factorProduct(
  factors: ActiveFactor[],
  speciesId: string,
  type: 'capacity' | 'growth',
  season: number,
): number {
  let p = 1;
  for (const f of factors) {
    if (f.speciesId === speciesId && f.type === type && f.until >= season) p *= f.factor;
  }
  return p;
}

function pushCause(list: Record<string, Cause[]>, id: string, key: CauseKey, count: number, extra?: Partial<Cause>): void {
  if (count === 0) return;
  list[id].push({ key, count, ...extra });
}

/**
 * Advance exactly one season. Pure: returns a new state (input untouched).
 * `events` is the challenge event schedule (empty for free play).
 */
export function stepSim(state: SimState, biome: BiomeDef, events: ChallengeEventDef[] = []): SimState {
  const season = state.season + 1;
  const pops: Record<string, number> = { ...state.populations };
  const plans: Record<string, number> = { ...state.plans };
  const factors: ActiveFactor[] = state.activeFactors.filter((f) => f.until >= season);
  const causes: Record<string, Cause[]> = {};
  const before: Record<string, number> = { ...pops };
  const after: Record<string, number> = { ...pops };
  for (const s of biome.species) causes[s.id] = [];

  // -- 1. player plans ------------------------------------------------------
  for (const s of biome.species) {
    const plan = plans[s.id] ?? 0;
    plans[s.id] = 0;
    if (plan > 0) {
      pops[s.id] += plan;
      pushCause(causes, s.id, 'released', plan);
    } else if (plan < 0) {
      const actual = Math.min(-plan, pops[s.id]);
      pops[s.id] -= actual;
      pushCause(causes, s.id, 'removed', -actual);
    }
  }

  // -- 2. scheduled events --------------------------------------------------
  const eventsFired: TickResult['eventsFired'] = [];
  for (const ev of events) {
    if (ev.turn !== season) continue;
    eventsFired.push({ label: ev.label, message: ev.message });
    if (ev.type === 'capacityFactor' || ev.type === 'growthFactor') {
      factors.push({
        speciesId: ev.speciesId,
        type: ev.type === 'capacityFactor' ? 'capacity' : 'growth',
        factor: ev.value,
        until: season + Math.max(1, ev.duration ?? 1) - 1,
        label: ev.label,
      });
    } else if (ev.type === 'populationSet') {
      const target = clamp(Math.round(ev.value), 0, 1e9);
      const delta = target - pops[ev.speciesId];
      pops[ev.speciesId] = target;
      pushCause(causes, ev.speciesId, 'event', delta, { note: ev.label });
    } else if (ev.type === 'populationAdd') {
      const delta = Math.round(ev.value);
      pops[ev.speciesId] = Math.max(0, pops[ev.speciesId] + delta);
      pushCause(causes, ev.speciesId, 'event', delta, { note: ev.label });
    }
  }

  // -- 3+4. weather + producers ---------------------------------------------
  const w = weather(state.seed, season);
  for (const s of biome.species) {
    if (!s.growth) continue;
    const capFactor = factorProduct(factors, s.id, 'capacity', season);
    const growFactor = s.growth.rate * factorProduct(factors, s.id, 'growth', season) * w;
    const kEff = s.growth.capacity * capFactor;
    const p = pops[s.id];
    let delta: number;
    if (kEff <= 0.5) {
      delta = -Math.round(p * 0.4); // habitat destroyed: die back hard
    } else {
      delta = Math.round(growFactor * p * (1 - p / kEff));
    }
    if (delta !== 0) {
      pops[s.id] = Math.max(0, pops[s.id] + delta);
      pushCause(causes, s.id, delta > 0 ? 'grew' : 'dieback', delta);
    }
  }

  // -- 5. consumers ----------------------------------------------------------
  const preySnapshot: Record<string, number> = { ...pops };
  for (const s of biome.species) {
    if (!s.diet || !s.metabolism) continue;
    const dietEntries = Object.entries(s.diet.prey);
    if (dietEntries.length === 0) continue;
    const p = pops[s.id];
    if (p <= 0) continue;

    let intake = 0;
    for (const [preyId, rule] of dietEntries) {
      const preyPop = preySnapshot[preyId] ?? 0;
      intake += rule.rate * preyPop;
    }
    const fed = Math.min(1, s.metabolism.foodNeed > 0 ? intake / s.metabolism.foodNeed : 1);

    const births = Math.round(p * s.metabolism.birthMax * fed) + (p >= 1 && fed >= 0.999 ? 1 : 0);
    const starved = Math.round(p * s.metabolism.starveRate * (1 - fed));
    const died = Math.round(p * s.metabolism.baseDeath);

    // Harvest from live prey with a 60%-per-predator cap (forgiving dynamics).
    for (const [preyId, rule] of dietEntries) {
      const live = pops[preyId] ?? 0;
      if (live <= 0) continue;
      const loss = Math.min(Math.round(rule.rate * p * live), Math.floor(live * 0.6));
      if (loss > 0) {
        pops[preyId] = live - loss;
        pushCause(causes, preyId, 'eaten', -loss, { actor: s.id });
      }
    }

    pops[s.id] = Math.max(0, pops[s.id] + births - starved - died);
    pushCause(causes, s.id, 'born', births);
    pushCause(causes, s.id, 'starved', -starved);
    pushCause(causes, s.id, 'died', -died);
  }

  // -- 6. clamp --------------------------------------------------------------
  const speciesTick: Record<string, SpeciesTick> = {};
  for (const s of biome.species) {
    pops[s.id] = clamp(Math.round(pops[s.id]), s.limits[0], s.limits[1]);
    after[s.id] = pops[s.id];
    speciesTick[s.id] = { id: s.id, before: before[s.id], after: pops[s.id], causes: causes[s.id] };
  }

  const tick: TickResult = { season, species: speciesTick, eventsFired };
  return {
    ...state,
    season,
    populations: pops,
    plans,
    history: [...state.history, tick],
    activeFactors: factors,
  };
}

/** Set the player plan for one species (clamped to ±MAX_PLAN). */
export function setPlan(state: SimState, speciesId: string, plan: number): SimState {
  return {
    ...state,
    plans: { ...state.plans, [speciesId]: clamp(Math.round(plan), -MAX_PLAN, MAX_PLAN) },
  };
}

// ---------------------------------------------------------------------------
// Reading helpers (pure)
// ---------------------------------------------------------------------------

/** Population trend across the last observed seasons (or since the start). */
export function trendOf(state: SimState, speciesId: string): TrendKind {
  const current = state.populations[speciesId] ?? 0;
  if (current === 0) return 'gone';
  const h = state.history;
  const prev =
    h.length >= 1
      ? h[h.length - 1].species[speciesId]?.before ?? current
      : current;
  const delta = current - prev;
  if (delta > 0) return 'rising';
  if (delta < 0) return 'falling';
  return 'steady';
}

export interface SpeciesSummary {
  id: string;
  start: number;
  end: number;
  peak: number;
  peakSeason: number;
  low: number;
  lowSeason: number;
  extinct: boolean;
}

/** Field-notebook textual summary of one species across the whole run. */
export function summarize(state: SimState, biome: BiomeDef, speciesId: string): SpeciesSummary {
  const def = biome.species.find((s) => s.id === speciesId);
  const start = def ? def.initialPopulation : 0;
  let peak = start;
  let peakSeason = 0;
  let low = start;
  let lowSeason = 0;
  let running = start;
  let season = 0;
  const points = [start];
  for (const tick of state.history) {
    const st = tick.species[speciesId];
    if (!st) continue;
    season = tick.season;
    running = st.after;
    points.push(running);
    if (running > peak || (running === peak && peakSeason === 0)) {
      peak = running;
      peakSeason = season;
    }
    if (running < low || (running === low && lowSeason === 0)) {
      low = running;
      lowSeason = season;
    }
  }
  void points;
  return {
    id: speciesId,
    start,
    end: running,
    peak,
    peakSeason,
    low,
    lowSeason,
    extinct: running === 0,
  };
}

export function allInTargets(populations: Record<string, number>, targets: Record<string, [number, number]>): boolean {
  for (const [id, [min, max]] of Object.entries(targets)) {
    const v = populations[id] ?? 0;
    if (v < min || v > max) return false;
  }
  return true;
}

/** Species visible in the diorama as tokens (visual cap handled by the UI). */
export function speciesById(biome: BiomeDef): Map<string, SpeciesDef> {
  return new Map(biome.species.map((s) => [s.id, s]));
}
