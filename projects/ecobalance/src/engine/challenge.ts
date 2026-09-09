// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Challenge run bookkeeping on top of the pure simulation. A challenge
// succeeds when every target range holds for `holdTurns` consecutive seasons
// (checked after each step); it "ends" when the season limit passes first.

import { allInTargets, createSim, setPlan, stepSim } from './sim.ts';
import type { BiomeDef, ChallengeDef, SimState } from './types.ts';

export type ChallengeStatus = 'running' | 'success' | 'ended';

export interface ChallengeRun {
  challenge: ChallengeDef;
  sim: SimState;
  /** Consecutive seasons (after steps) with every population inside its range. */
  streak: number;
  bestStreak: number;
  status: ChallengeStatus;
  /** Whether the latest completed season was fully in range. */
  lastInRange: boolean;
}

export function startChallenge(challenge: ChallengeDef, biome: BiomeDef): ChallengeRun {
  const sim = createSim(biome, challenge.seed);
  return {
    challenge,
    sim,
    streak: 0,
    bestStreak: 0,
    status: 'running',
    lastInRange: false,
  };
}

/** Apply a player plan then advance one season and evaluate the goal. */
export function stepChallenge(run: ChallengeRun, biome: BiomeDef): ChallengeRun {
  if (run.status !== 'running') return run;
  const sim = stepSim(run.sim, biome, run.challenge.events);
  const inRange = allInTargets(sim.populations, run.challenge.targetRanges);
  const streak = inRange ? run.streak + 1 : 0;
  const bestStreak = Math.max(run.bestStreak, streak);
  let status: ChallengeStatus = 'running';
  if (streak >= run.challenge.holdTurns) status = 'success';
  else if (sim.season >= run.challenge.maxTurns) status = 'ended';
  return { ...run, sim, streak, bestStreak, status, lastInRange: inRange };
}

/** Convenience for scripted solutions / engine tests: run N seasons with fixed plans. */
export function playScript(
  challenge: ChallengeDef,
  biome: BiomeDef,
  script: Array<Partial<Record<string, number>> | null>,
): ChallengeRun {
  let run = startChallenge(challenge, biome);
  for (const plans of script) {
    if (run.status !== 'running') break;
    if (plans) {
      for (const [id, value] of Object.entries(plans)) {
        if (typeof value !== 'number') continue;
        run = { ...run, sim: setPlan(run.sim, id, value) };
      }
    }
    run = stepChallenge(run, biome);
  }
  return run;
}
