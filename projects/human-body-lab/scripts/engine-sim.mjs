#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless interaction test: replays the whole lab through the SAME pure
// engines the UI uses (no browser, no Vue). Covers:
//   - content validation (the exact parse path the browser takes)
//   - layer toggling invariants
//   - callout label spacing (collision hardening)
//   - every pathway walked correctly AND via every wrong first pick
//   - quiz answered correctly and with every wrong option at q1
//
// Usage: npm run test:engine   (from the project dir; node >= 23 strips TS)

import { readFileSync } from 'node:fs';

const dataMod = await import('../src/lib/data.ts');
const explore = await import('../src/features/explore/engine.ts');
const pathways = await import('../src/features/pathways/engine.ts');
const quiz = await import('../src/features/quiz/engine.ts');

const read = (file) => JSON.parse(readFileSync(new URL(`../public/data/${file}`, import.meta.url), 'utf8'));

let failures = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  FAIL ${msg}`);
  }
}

// ---- 1. content parses through the browser's exact validation path ----
console.log('· content validation (parseLabData)');
let data;
try {
  data = dataMod.parseLabData(read('systems.json'), read('pathways.json'), read('quiz.json'));
  check(true, 'parses');
} catch (err) {
  check(false, `parseLabData threw: ${err.message}`);
  process.exit(1);
}
check(data.systems.length === 5, '5 systems');
const organCount = data.systems.reduce((n, s) => n + s.organs.length, 0);
check(organCount === 18, `18 organs (got ${organCount})`);
const pathIds = new Set(data.systems.flatMap((s) => s.organs.map((o) => o.pathId)));
check(pathIds.size === organCount, 'pathIds unique');

// every pathId referenced by stops exists
for (const stop of data.stops) {
  if (stop.organId) {
    const known = data.systems.some((s) => s.organs.some((o) => o.id === stop.organId));
    check(known, `stop ${stop.id} organId ${stop.organId} exists`);
  }
}

// ---- 2. layer toggles ----
console.log('· layer toggling');
let layers = new Set();
layers = explore.toggleLayer(layers, 'respiratory');
check(layers.has('respiratory') && layers.size === 1, 'toggle on');
layers = explore.toggleLayer(layers, 'respiratory');
check(!layers.has('respiratory') && layers.size === 0, 'toggle off');
for (const id of explore.ALL_SYSTEMS) layers = explore.toggleLayer(layers, id);
check(layers.size === 5, 'all five on');

// ---- 3. label spacing (collision hardening) ----
console.log('· callout label spacing');
const spacing = explore.validateCalloutSpacing(data);
check(spacing.length === 0, `no label collisions${spacing.length ? ': ' + spacing.join('; ') : ''}`);

// ---- 4. pathways: full correct walks + wrong-path behavior ----
console.log('· pathways');
const pProblems = pathways.validatePathways(data);
check(pProblems.length === 0, `validatePathways clean${pProblems.length ? ': ' + pProblems.join('; ') : ''}`);

for (const p of data.pathways) {
  // correct walk
  let st = pathways.startRoute();
  check(st.index === 0 && st.confirmed.length === 0 && !st.done, `${p.id}: starts clean`);
  for (const step of p.steps) {
    const res = pathways.pickStop(data, p, st, step.stop);
    check(res.kind === 'correct', `${p.id}: correct pick ${step.stop}`);
    st = res.state;
  }
  check(st.done && st.totalWrong === 0, `${p.id}: completes with 0 wrong`);

  // every wrong first pick: non-punitive (no reset, hint given, try-again works)
  const correctFirst = p.steps[0].stop;
  const wrongChoices = pathways
    .choicesForPathway(data, p)
    .map((s) => s.id)
    .filter((id) => id !== correctFirst);
  for (const wrong of wrongChoices) {
    let s2 = pathways.startRoute();
    const res = pathways.pickStop(data, p, s2, wrong);
    check(res.kind === 'wrong', `${p.id}: ${wrong} flagged wrong at step 1`);
    check(res.hint.length > 10, `${p.id}: wrong pick returns a hint`);
    s2 = res.state;
    check(s2.confirmed.length === 0 && !s2.done, `${p.id}: wrong pick does not reset/punish`);
    check(s2.totalWrong === 1, `${p.id}: wrong counted once`);
    // recovery: correct pick after a wrong one still works
    const res2 = pathways.pickStop(data, p, s2, correctFirst);
    check(res2.kind === 'correct', `${p.id}: recovers after wrong pick (${wrong})`);
    check(res2.state.wrongPicks.length === 0, `${p.id}: wrongPicks cleared on progress`);
  }

  // duplicate-stop loop support (blood visits heart 3x)
  const uniqueStops = new Set(p.steps.map((s) => s.stop));
  const choices = pathways.choicesForPathway(data, p);
  check(choices.length === uniqueStops.size, `${p.id}: choices = unique stops`);
}

// blood loop specifically revisits stops
const blood = data.pathways.find((p) => p.id === 'blood');
check(blood.steps.filter((s) => s.stop === 'heart').length === 3, 'blood loop visits heart 3x');

// ---- 5. quiz ----
console.log('· quiz');
let qs = quiz.startQuiz(data.quiz.length);
check(qs.picks.length === data.quiz.length, 'quiz state sized');
for (let i = 0; i < data.quiz.length; i++) {
  const q = data.quiz[i];
  const right = quiz.answer(qs, q, q.answer);
  check(right.result.kind === 'correct', `q${i + 1}: correct answer detected`);
  qs = right.state;
  qs = quiz.next(qs);
}
check(qs.finished, 'quiz finishes');
check(quiz.score(qs, data.quiz) === data.quiz.length, 'perfect run scores full');
const q1 = data.quiz[0];
for (let opt = 0; opt < q1.options.length; opt++) {
  if (opt === q1.answer) continue;
  const wrong = quiz.answer(quiz.startQuiz(data.quiz.length), q1, opt);
  check(wrong.result.kind === 'wrong', `q1 option ${opt} correctly wrong`);
  check(wrong.state.picks[0] === opt, 'pick recorded');
}
const restarted = quiz.restart(data.quiz.length);
check(restarted.index === 0 && restarted.picks.every((p) => p === null), 'quiz restarts clean');

// ---- 6. organ↔pathway link-out ----
console.log('· organ link-outs');
const heartOrgan = data.systems.flatMap((s) => s.organs).find((o) => o.id === 'heart');
const heartRoutes = explore.pathwaysThrough(data, heartOrgan.id);
check(heartRoutes.includes('blood') && heartRoutes.includes('oxygen'), 'heart links to blood + oxygen routes');
const stomachRoutes = explore.pathwaysThrough(data, 'stomach');
check(stomachRoutes.includes('food'), 'stomach links to food route');

console.log(failures === 0 ? `\nALL ${checks} CHECKS PASS` : `\n${failures}/${checks} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);
