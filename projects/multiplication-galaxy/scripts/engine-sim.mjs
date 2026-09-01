#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless interaction test: simulates a full playthrough of every galaxy
// through the SAME engine the UI uses (no browser needed). Covers the core
// learning loop per mission: wrong pick (drift, non-punitive, retry),
// correct pick (lock), skip-count to the product, pacing guard, streak
// transitions, and the array geometry the chart renders.
//
// Usage: npm run test:engine   (from the project dir)

import { readFileSync } from 'node:fs';

const mod = await import('../src/features/mission/engine.ts').catch(() => null);
if (!mod) {
  console.error('engine.ts is TypeScript — run via a TS-aware runner.');
  process.exit(1);
}

const {
  startRun,
  currentMission,
  choose,
  next,
  countStep,
  countValue,
  streakAfter,
  headline,
  ariaChart,
  feedbackCopy,
  isLastMission,
  galaxyProgress,
  arrayGeometry,
  satelliteRadius,
  factLabels,
} = mod;

const galaxiesData = JSON.parse(readFileSync(new URL('../public/data/galaxies.json', import.meta.url), 'utf8'));
const missionsData = JSON.parse(readFileSync(new URL('../public/data/missions.json', import.meta.url), 'utf8'));

let failures = 0;
function check(cond, msg) {
  if (!cond) {
    failures++;
    console.error(`  ✖ ${msg}`);
  }
}

console.log(`Simulating ${galaxiesData.galaxies.length} galaxies, ${missionsData.missions.length} missions…`);

let totalLocks = 0;
let totalDrifts = 0;
let totalSkipCounts = 0;

for (const galaxy of galaxiesData.galaxies) {
  const missions = missionsData.missions.filter((m) => m.galaxyId === galaxy.id);
  console.log(`\n— Table of ${galaxy.tableNumber} · ${galaxy.constellation} (${missions.length} facts)`);
  check(missions.length === 6, `galaxy ${galaxy.id}: expected 6 missions, got ${missions.length}`);

  const lockedSim = {};
  let s = startRun(galaxy, missions);

  for (let i = 0; i < missions.length; i++) {
    const m = currentMission(s);
    check(m.id === missions[i].id, `mission ${i}: loaded from JSON in order`);

    const [a, b] = m.factors;
    const product = a * b;

    // Option set: exactly one correct value among 4 unique options.
    check(m.distractors.length === 4, `${m.id}: 4 options`);
    check(new Set(m.distractors).size === 4, `${m.id}: options unique`);
    check(m.distractors.filter((o) => o === m.answer).length === 1, `${m.id}: answer appears exactly once`);

    // Fact readout masks the right thing.
    const f = factLabels(m);
    if (m.representation === 'array') {
      check(f.a === a && f.b === b && f.product === null, `${m.id}: array shows both factors`);
    } else if (m.missing === 'a') {
      check(f.a === null && f.b === b && f.product === product, `${m.id}: missing a masks rings`);
    } else {
      check(f.a === a && f.b === null && f.product === product, `${m.id}: missing b masks per-ring`);
    }

    // Headline shape.
    const h = headline(m);
    check(h.includes('×') && h.includes('?'), `${m.id}: headline "${h}" is numerals-first with ?`);

    // ARIA text equivalent states the structure (spec acceptance); the visible
    // prompt paragraph carries the question (no double narration).
    const aria = ariaChart(s);
    check(aria.includes(`${a} rings`) && aria.includes(`${b} satellites`) && !aria.includes(m.prompt), `${m.id}: aria describes chart without repeating the prompt`);

    // Wrong pick → drift, feedback is guidance (never punitive lockout).
    const wrong = m.distractors.find((o) => o !== m.answer);
    s = choose(s, wrong);
    check(s.phase === 'drifted', `${m.id}: wrong pick drifts`);
    const driftCopy = feedbackCopy(s);
    check(driftCopy.kind === 'drift' && driftCopy.text.length > 10, `${m.id}: drift copy gives guidance`);
    totalDrifts++;

    // Retry is unlimited: same wrong value can be picked again without lock.
    s = choose(s, wrong);
    check(s.phase === 'drifted', `${m.id}: retry allowed after drift`);
    check(s.attempts === 2, `${m.id}: attempts counted`);

    // Pacing: next() must NOT advance while drifted.
    const beforeIndex = s.index;
    s = next(s);
    check(s.index === beforeIndex, `${m.id}: cannot advance while drifted`);

    // Correct pick → locked.
    s = choose(s, m.answer);
    check(s.phase === 'locked', `${m.id}: correct pick locks`);
    const lockCopy = feedbackCopy(s);
    check(lockCopy.kind === 'locked' && lockCopy.text.includes(String(m.answer)), `${m.id}: lock copy states the fact`);
    totalLocks++;
    lockedSim[m.id] = s.attempts === 3 ? false : true; // attempts=1 would be first-try

    // Locked missions ignore further picks.
    const lockedIndex = s.index;
    s = choose(s, m.distractors[0]);
    check(s.index === lockedIndex && s.phase === 'locked', `${m.id}: locked mission ignores picks`);

    // Skip-count: from reset, a steps of +1 reach the product (repeated addition).
    s = { ...s, countStep: -1 };
    for (let r = 0; r < a; r++) s = countStep(s, 1);
    check(s.countStep === a - 1, `${m.id}: skip-count lights all ${a} rings`);
    check(countValue(s) === product, `${m.id}: skip-count value ${countValue(s)} = product ${product}`);
    check(countStep(s, 1).countStep === a - 1, `${m.id}: skip-count clamps at the top`);
    s = countStep(s, -1);
    s = countStep(s, -1);
    check(countValue(s) === (a - 2) * b || s.countStep === -1, `${m.id}: skip-count steps back down`);
    totalSkipCounts++;

    // Streak transitions (correct streaks build, drifts reset silently).
    check(streakAfter(2, true) === 3, `${m.id}: streak builds to cap`);
    check(streakAfter(0, false) === 0, `${m.id}: drift resets streak to zero`);
    check(streakAfter(3, true) === 3, `${m.id}: streak caps at 3`);

    // Array geometry: the chart draws a rings × b satellites, on-plate, with
    // guaranteed clearance — satellite diameter must fit the ring gap and the
    // same-ring chord (critique P0: no overlapping, uncountable charts).
    const geo = arrayGeometry(a, b);
    check(geo.rings.length === a, `${m.id}: geometry has ${a} rings`);
    check(geo.satellites.length === product, `${m.id}: geometry has ${product} satellites`);
    for (const sat of geo.satellites) {
      check(Math.abs(sat.x) <= 310 && Math.abs(sat.y) <= 310, `${m.id}: satellite inside plate bounds`);
    }
    check(geo.rings.every((r) => r.squash <= 1), `${m.id}: drift squashes, never bulges`);
    const satR = satelliteRadius(a, b);
    check(satR >= 6.5, `${m.id}: satellite radius floor respected (${satR})`);
    if (a > 1) {
      const gap = (292 - 52) / (a - 1);
      check(satR * 2 <= gap, `${m.id}: satellite diameter ${satR * 2} fits ring gap ${gap.toFixed(1)}`);
    }
    const chord = 2 * 52 * Math.sin(Math.PI / b);
    check(satR * 2 <= chord, `${m.id}: satellite diameter ${satR * 2} fits same-ring chord ${chord.toFixed(1)}`);
    // Drift-transformed separation: no two satellites (any rings) closer than
    // diameter + 1 — the chart stays countable even pre-lock (critique P0).
    const minSep = mod.minSatelliteSeparation(a, b);
    check(minSep >= satR * 2 + 1, `${m.id}: min satellite separation ${minSep.toFixed(1)} ≥ diameter+1 ${(satR * 2 + 1).toFixed(1)} (pre-lock, drift applied)`);
    // Exact-duplicate positions are impossible: distinct rings have distinct radii.
    const seen = new Set(geo.satellites.map((s) => `${s.x.toFixed(3)},${s.y.toFixed(3)}`));
    check(seen.size === product, `${m.id}: all ${product} satellite positions unique`);

    // Advance (locked) — last mission reports completion instead.
    if (i < missions.length - 1) {
      s = next(s);
      check(s.index === i + 1 && s.phase === 'question' && s.picked.length === 0, `${m.id}: next advances and resets`);
    } else {
      check(isLastMission(s), `${m.id}: last mission flagged`);
    }
  }

  const prog = galaxyProgress(missions, lockedSim);
  check(prog.complete && prog.lockedCount === missions.length, `galaxy ${galaxy.id}: completes after all locks`);
}

console.log(`\n${totalLocks} locks · ${totalDrifts} drifts · ${totalSkipCounts} skip-count sequences simulated.`);
if (failures) {
  console.error(`\n✖ ${failures} check(s) failed.`);
  process.exit(1);
}
console.log('✔ engine simulation passed — every mission solvable, drift-recoverable, skip-countable.');
