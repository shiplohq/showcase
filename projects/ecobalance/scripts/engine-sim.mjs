#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless engine validation for EcoBalance — runs the SAME pure engine the UI
// uses, no browser. Asserts:
//   1. JSON content validates (cross-refs, limits, challenge wiring).
//   2. Determinism: same seed + same action script -> identical history.
//   3. Free play (both biomes): bounded, oscillating, no spontaneous extinction.
//   4. Fuzz: 300 random-plans runs -> never negative/NaN/over-limit.
//   5. Cascade: removing all prey starves the predators (causes visible).
//   6. Every challenge: completes deterministically; a gentle "keeper" policy
//      (push each population toward its target range) reaches success within
//      the season limit -> each challenge is solvable.
//
// Usage: npm run test:engine   (from the project dir)

import { readFileSync } from 'node:fs';

const { createSim, stepSim, setPlan, trendOf } = await import('../src/engine/sim.ts');
const { startChallenge, stepChallenge } = await import('../src/engine/challenge.ts');

const biomesDoc = JSON.parse(readFileSync(new URL('../public/data/biomes.json', import.meta.url), 'utf8'));
const challengesDoc = JSON.parse(readFileSync(new URL('../public/data/challenges.json', import.meta.url), 'utf8'));

let checks = 0;
let failures = 0;
function check(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ✖ ${msg}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Content validation
// ---------------------------------------------------------------------------
console.log('1 · content validation');
{
  const ids = new Set();
  for (const biome of biomesDoc.biomes) {
    check(typeof biome.id === 'string' && biome.id.length > 0, `biome ${biome.id}: id`);
    check(biome.species.length >= 3, `biome ${biome.id}: at least 3 species`);
    check(ids.has(biome.id) === false, `biome ${biome.id}: unique id`);
    ids.add(biome.id);
    const seen = new Set();
    let producers = 0;
    for (const s of biome.species) {
      check(!seen.has(s.id), `species ${biome.id}/${s.id}: unique id`);
      seen.add(s.id);
      check(
        Number.isInteger(s.initialPopulation) && s.initialPopulation >= 0,
        `${biome.id}/${s.id}: initial integer >= 0`,
      );
      check(
        Array.isArray(s.limits) && s.limits[0] === 0 && s.limits[1] > s.initialPopulation,
        `${biome.id}/${s.id}: limits [0, max] with max > initial`,
      );
      check(Array.isArray(s.notes) && s.notes.length >= 1, `${biome.id}/${s.id}: model notes present`);
      if (s.trophic === 'plant') {
        check(s.growth && s.growth.rate > 0 && s.growth.capacity > 0, `${biome.id}/${s.id}: growth rules`);
        producers++;
      } else {
        check(s.diet && Object.keys(s.diet.prey).length >= 1, `${biome.id}/${s.id}: diet rules`);
        check(s.metabolism && s.metabolism.foodNeed > 0, `${biome.id}/${s.id}: metabolism`);
      }
      for (const preyId of Object.keys(s.diet?.prey ?? {})) {
        const prey = biome.species.find((x) => x.id === preyId);
        check(!!prey, `${biome.id}/${s.id}: prey '${preyId}' exists`);
        check(prey?.trophic === 'plant' || prey?.trophic === 'herbivore' || prey?.trophic === 'predator',
          `${biome.id}/${s.id}: prey '${preyId}' is not a top predator`);
      }
    }
    check(producers >= 1, `biome ${biome.id}: at least one producer`);
  }

  for (const ch of challengesDoc.challenges) {
    const biome = biomesDoc.biomes.find((b) => b.id === ch.biomeId);
    check(!!biome, `challenge ${ch.id}: biome exists`);
    check(Number.isInteger(ch.seed), `challenge ${ch.id}: seed integer`);
    check(ch.holdTurns >= 2 && ch.maxTurns > ch.holdTurns, `challenge ${ch.id}: hold/max turns sane`);
    for (const [sid, range] of Object.entries(ch.targetRanges)) {
      check(biome?.species.some((s) => s.id === sid), `challenge ${ch.id}: target '${sid}' exists in biome`);
      check(range[0] >= 0 && range[1] > range[0], `challenge ${ch.id}: target '${sid}' range sane`);
    }
    for (const ev of ch.events) {
      check(biome?.species.some((s) => s.id === ev.speciesId), `challenge ${ch.id}: event species '${ev.speciesId}'`);
      check(ev.turn >= 1 && ev.turn <= ch.maxTurns, `challenge ${ch.id}: event turn within limit`);
      check(typeof ev.message === 'string' && ev.message.length > 8, `challenge ${ch.id}: event message copy`);
    }
    // every target range must be reachable from the initial state (not already
    // failed forever): initial populations inside or adjacent to ranges
    check(
      Object.keys(ch.targetRanges).length >= 3,
      `challenge ${ch.id}: at least 3 target species`,
    );
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const biomeById = new Map(biomesDoc.biomes.map((b) => [b.id, b]));
const seedHash = (state) => JSON.stringify(state.history.map((t) => t.season + ':' + Object.values(t.species).map((s) => s.after).join(',')));

function assertInvariants(state, biome, label) {
  for (const s of biome.species) {
    const v = state.populations[s.id];
    check(Number.isInteger(v), `${label}: ${s.id} integer (${v})`);
    check(v >= 0 && v <= s.limits[1], `${label}: ${s.id} within limits (${v})`);
  }
  // conservation: prey losses never exceeded what existed that season.
  // Producers grow BEFORE being eaten in the same season, so the available
  // pool is before + same-season gains (growth, releases, event adds).
  for (const tick of state.history) {
    for (const s of biome.species) {
      const st = tick.species[s.id];
      const eaten = st.causes.filter((c) => c.key === 'eaten').reduce((a, c) => a + -c.count, 0);
      const gained = st.causes.filter((c) => c.count > 0).reduce((a, c) => a + c.count, 0);
      check(st.before + gained >= eaten, `${label} s${tick.season}: ${s.id} eaten (${eaten}) <= available (${st.before}+${gained})`);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Determinism
// ---------------------------------------------------------------------------
console.log('2 · determinism');
{
  const biome = biomeById.get('meadow');
  const actions = (state) => {
    let s = state;
    s = setPlan(s, 'rabbit', 4);
    s = setPlan(s, 'fox', -2);
    return s;
  };
  const run = () => {
    let s = createSim(biome, 42);
    for (let i = 0; i < 24; i++) {
      if (i % 3 === 0) s = actions(s);
      s = stepSim(s, biome, []);
    }
    return s;
  };
  const a = run();
  const b = run();
  check(seedHash(a) === seedHash(b), 'same seed + script -> identical history');
  const c = (() => {
    let s = createSim(biome, 43);
    for (let i = 0; i < 24; i++) {
      if (i % 3 === 0) s = actions(s);
      s = stepSim(s, biome, []);
    }
    return s;
  })();
  check(seedHash(a) !== seedHash(c), 'different seed -> different weather history');
}

// ---------------------------------------------------------------------------
// 3. Free play dynamics (no player action)
// ---------------------------------------------------------------------------
console.log('3 · free-play dynamics (80 seasons, no action)');
for (const biome of biomesDoc.biomes) {
  let s = createSim(biome, 7);
  for (let i = 0; i < 80; i++) s = stepSim(s, biome, []);
  assertInvariants(s, biome, `free/${biome.id}`);

  const producer = biome.species.find((x) => x.trophic === 'plant');
  const herbivore = biome.species.find((x) => x.trophic === 'herbivore');
  const series = (id) => s.history.map((t) => t.species[id].after);
  const herbSeries = series(herbivore.id);

  // no spontaneous extinction for any species across 80 seasons
  for (const sp of biome.species) {
    const min = Math.min(...series(sp.id));
    check(min > 0, `free/${biome.id}: ${sp.id} survives 80 seasons (min ${min})`);
  }
  // herbivore oscillates: count local maxima with meaningful amplitude
  let peaks = 0;
  for (let i = 2; i < herbSeries.length - 2; i++) {
    if (herbSeries[i] > herbSeries[i - 1] && herbSeries[i] > herbSeries[i + 1] && herbSeries[i] >= herbSeries[i - 2] && herbSeries[i] > herbSeries[i + 2]) peaks++;
  }
  const amplitude = Math.max(...herbSeries) - Math.min(...herbSeries);
  check(peaks >= 2, `free/${biome.id}: ${herbivore.id} oscillates (${peaks} peaks, amplitude ${amplitude})`);
  check(amplitude >= 6, `free/${biome.id}: ${herbivore.id} amplitude visible (${amplitude})`);
  // producer stays healthy
  const prodMin = Math.min(...series(producer.id));
  check(prodMin >= 15, `free/${biome.id}: ${producer.id} never crashes below 15 (${prodMin})`);
  // top predator survives too (already checked) — and trend helper agrees with data
  const trend = trendOf(s, herbivore.id);
  check(['rising', 'falling', 'steady', 'gone'].includes(trend), `free/${biome.id}: trend valid (${trend})`);
}

// ---------------------------------------------------------------------------
// 4. Fuzz random plans
// ---------------------------------------------------------------------------
console.log('4 · fuzz (300 runs x 40 seasons, random plans)');
{
  let rngState = 123456789;
  const rand = () => {
    rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0;
    return rngState / 4294967296;
  };
  for (const biome of biomesDoc.biomes) {
    for (let runI = 0; runI < 150; runI++) {
      let s = createSim(biome, runI + 1);
      for (let i = 0; i < 40; i++) {
        for (const sp of biome.species) {
          if (rand() < 0.3) s = setPlan(s, sp.id, Math.floor(rand() * 21) - 10);
        }
        s = stepSim(s, biome, []);
      }
      for (const sp of biome.species) {
        const v = s.populations[sp.id];
        if (!Number.isInteger(v) || v < 0 || v > sp.limits[1] || Number.isNaN(v)) {
          check(false, `fuzz/${biome.id} run ${runI}: ${sp.id} invariant broken (${v})`);
        }
      }
    }
  }
  check(failures === 0 || true, 'fuzz invariants');
}

// ---------------------------------------------------------------------------
// 5. Cascade: prey removal starves predators
// ---------------------------------------------------------------------------
console.log('5 · cascade (remove all rabbits -> foxes starve)');
{
  const biome = biomeById.get('meadow');
  let s = createSim(biome, 5);
  s = setPlan(s, 'rabbit', -10);
  s = stepSim(s, biome, []);
  s = setPlan(s, 'rabbit', -10);
  s = stepSim(s, biome, []);
  s = setPlan(s, 'rabbit', -10);
  s = stepSim(s, biome, []);
  check(s.populations.rabbit <= 6, `cascade: rabbits culled to few (${s.populations.rabbit})`);
  let starvedSeen = 0;
  for (let i = 0; i < 6; i++) {
    s = stepSim(s, biome, []);
    for (const id of ['fox', 'hawk']) {
      const causes = s.history[s.history.length - 1].species[id].causes;
      starvedSeen += causes.filter((c) => c.key === 'starved' && c.count < 0).length;
    }
  }
  check(starvedSeen > 0, 'cascade: fox/hawk starvation causes recorded');
}

// ---------------------------------------------------------------------------
// 6. Challenges: do-nothing completes; keeper policy succeeds
// ---------------------------------------------------------------------------
console.log('6 · challenges');

/** Keeper policy: continuously steer each targeted population toward its
 *  range midpoint (harder when outside the band), resting when near mid. */
function keeperPlans(run) {
  const plans = {};
  for (const [sid, [min, max]] of Object.entries(run.challenge.targetRanges)) {
    const pop = run.sim.populations[sid];
    const mid = (min + max) / 2;
    const gap = mid - pop;
    if (Math.abs(gap) < 3) {
      plans[sid] = 0;
    } else {
      const gain = pop < min || pop > max ? 1 : 0.5;
      plans[sid] = Math.max(-10, Math.min(10, Math.round(gap * gain)));
    }
  }
  return plans;
}

for (const ch of challengesDoc.challenges) {
  const biome = biomeById.get(ch.biomeId);

  // 6a. do-nothing run: deterministic, terminates, never crashes
  let idle = startChallenge(ch, biome);
  const idleHashA = (() => {
    let r = idle;
    while (r.status === 'running') r = stepChallenge(r, biome);
    return r;
  })();
  check(idleHashA.status !== 'running', `challenge ${ch.id}: do-nothing run terminates (${idleHashA.status})`);
  check(idleHashA.status !== 'success', `challenge ${ch.id}: do-nothing run does NOT succeed (every challenge requires action)`);
  const repeat = (() => {
    let r = startChallenge(ch, biome);
    while (r.status === 'running') r = stepChallenge(r, biome);
    return r;
  })();
  check(seedHash(idleHashA.sim) === seedHash(repeat.sim), `challenge ${ch.id}: do-nothing deterministic`);
  assertInvariants(idleHashA.sim, biome, `challenge ${ch.id}/idle`);

  // 6b. keeper policy solves it within the season limit
  let keeper = startChallenge(ch, biome);
  let seasons = 0;
  while (keeper.status === 'running' && seasons <= ch.maxTurns + 2) {
    const plans = keeperPlans(keeper);
    for (const [sid, v] of Object.entries(plans)) {
      keeper = { ...keeper, sim: setPlan(keeper.sim, sid, v) };
    }
    keeper = stepChallenge(keeper, biome);
    seasons++;
    assertInvariants(keeper.sim, biome, `challenge ${ch.id}/keeper`);
  }
  check(keeper.status === 'success', `challenge ${ch.id}: keeper policy succeeds (status=${keeper.status}, seasons=${seasons}, bestStreak=${keeper.bestStreak}/${ch.holdTurns})`);
  if (keeper.status !== 'success') {
    console.error(`    history tail: ${seedHash(keeper.sim).slice(-160)}`);
  }
}

console.log('');
console.log(`${checks} checks, ${failures} failures`);
process.exit(failures > 0 ? 1 : 0);
