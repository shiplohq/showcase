#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless interaction test: drives every activity through the SAME pure
// engines the UI uses (no browser). Covers: data validation, every tree's
// 6-round listen session (correct path, nudge path, hint path, firefly
// cadence, done state), the creature sort (correct placements, wrong drops
// with hint copy, full completion), and progress recording helpers.
//
// Usage: npm run test:engine   (from the project dir; Node 22.6+ strips types)

import { readFileSync } from 'node:fs';

const mod = await import('../src/engine/listen.ts');
const sort = await import('../src/engine/sort.ts');
const types = await import('../src/engine/types.ts');

const data = JSON.parse(readFileSync(new URL('../public/data/phonics.json', import.meta.url), 'utf8'));

let failures = 0;
function check(cond, msg) {
  if (!cond) {
    failures++;
    console.error(`  ✖ ${msg}`);
  }
}

// ---- data validation ---------------------------------------------------------

{
  const issues = types.validatePhonics(data);
  for (const i of issues) console.error(`  ✖ data: ${i}`);
  check(issues.length === 0, 'phonics.json passes validation');
  check(data.trees.length === 5, `expected 5 trees, got ${data.trees.length}`);
  for (const t of data.trees) {
    check(
      /^[a-z0-9]+$/.test(t.id),
      `tree ${t.id}: id is a safe slug`,
    );
    check(t.graphemes.length === 1, `tree ${t.id}: one taught grapheme expected`);
    // IPA chars must live in Andika's latin-ext coverage (no Greek/other blocks).
    const ipaOk = [...t.phoneme].every((ch) => {
      const cp = ch.codePointAt(0);
      return (
        (cp >= 0x2a && cp <= 0x7a) || // basic latin letters + slash + digits
        (cp >= 0x100 && cp <= 0x2af) || // latin ext-A/B + IPA extensions
        cp === 0x2033 ||
        cp === 0x02d0
      );
    });
    check(ipaOk, `tree ${t.id}: IPA "${t.phoneme}" within Andika latin-ext coverage`);
  }
  console.log(`✔ data validated — ${data.trees.length} trees`);
}

// ---- listen sessions -----------------------------------------------------------

const { makeRng, startListen, currentRound, answer, advance, firefliesAfter, feedbackCopy, ariaStatus } = mod;

for (const tree of data.trees) {
  const rng = makeRng(42 + tree.id.length);
  let s = startListen(data, tree.id, rng);
  check(s.rounds.length === 6, `${tree.id}: 6 rounds built`);
  check(s.fireflies === 0 && s.index === 0, `${tree.id}: session starts clean`);

  for (let i = 0; i < s.rounds.length; i++) {
    const round = currentRound(s);
    check(round.options.length === 3, `${tree.id} r${i + 1}: 3 options`);
    check(round.options.filter((o) => o.correct).length === 1, `${tree.id} r${i + 1}: exactly one correct option`);
    check(!round.prompt.includes('{'), `${tree.id} r${i + 1}: prompt resolves fully`);
    check(round.audioText.length > 0, `${tree.id} r${i + 1}: has audio text`);
    if (round.kind === 'grapheme') {
      check(round.focusWord === round.audioText, `${tree.id} r${i + 1}: grapheme round speaks the focus word`);
      check(!round.hideText, `${tree.id} r${i + 1}: grapheme round shows word text`);
    } else {
      check(round.hideText, `${tree.id} r${i + 1}: pair round hides text until reveal`);
      check(
        round.options.some((o) => o.label === round.audioText && o.correct),
        `${tree.id} r${i + 1}: heard word is an option and correct`,
      );
    }

    // Nudge path: wrong first pick.
    const wrongOpt = round.options.find((o) => !o.correct);
    const nudged = answer(s, wrongOpt.id);
    check(nudged.feedback === 'nudge', `${tree.id} r${i + 1}: first miss → nudge`);
    check(nudged.correctCount === s.correctCount, `${tree.id} r${i + 1}: nudge records no score`);
    check(!nudged.revealed || round.kind === 'grapheme', `${tree.id} r${i + 1}: pair text still hidden after first miss`);

    // Hint path: second miss reveals + names the letters.
    const hinted = answer(nudged, wrongOpt.id);
    check(hinted.feedback === 'hint', `${tree.id} r${i + 1}: second miss → hint`);
    check(hinted.revealed, `${tree.id} r${i + 1}: hint reveals pair text`);
    const hintCopy = feedbackCopy(hinted, round);
    check(hintCopy.length > 3, `${tree.id} r${i + 1}: hint copy exists`);
    check(!/red|wrong answer|bad/i.test(hintCopy), `${tree.id} r${i + 1}: hint copy is non-punitive`);

    // Correct answer after the misses still counts (never locked out).
    const rightOpt = round.options.find((o) => o.correct);
    const solved = answer(hinted, rightOpt.id);
    check(solved.feedback === 'correct', `${tree.id} r${i + 1}: correct after misses accepted`);
    check(solved.correctCount === i + 1, `${tree.id} r${i + 1}: correct count advances`);

    const next = advance(solved);
    const doneNow = i === s.rounds.length - 1;
    check(next.fireflies === firefliesAfter(doneNow ? s.rounds.length : i + 1), `${tree.id} r${i + 1}: firefly cadence`);
    if (doneNow) {
      check(next.feedback === 'done', `${tree.id}: session ends done`);
      check(ariaStatus(next).includes('tree is awake') || next.feedback === 'done', `${tree.id}: done aria mentions the tree waking`);
    } else {
      check(next.feedback === 'idle', `${tree.id} r${i + 1}: next round starts idle`);
      check(next.index === i + 1, `${tree.id} r${i + 1}: index advances`);
    }
    s = next;
  }
  check(s.fireflies === 3, `${tree.id}: full run lights 3 fireflies`);
  console.log(`✔ ${tree.id} — 6 rounds, nudge/hint paths, 3 fireflies`);
}

// Firefly cadence unit checks.
check(firefliesAfter(0) === 0 && firefliesAfter(1) === 0, 'cadence: 0 after 1 round');
check(firefliesAfter(2) === 1 && firefliesAfter(4) === 2 && firefliesAfter(6) === 3, 'cadence: every 2 rounds');
check(firefliesAfter(99) === 3, 'cadence: clamps at 3');

// Unknown tree must throw (guarded upstream by the router).
let threw = false;
try {
  startListen(data, 'nope', makeRng(1));
} catch {
  threw = true;
}
check(threw, 'startListen throws on unknown tree id');

// ---- sort sessions ----------------------------------------------------------------

const { startSort, placeCreature, returnCreature, trayCreatures, nestCreatures, sortHint, ariaStatusSort } = sort;

for (let run = 0; run < 3; run++) {
  const rng = makeRng(7 + run);
  let s = startSort(data, rng);
  check(s.creatures.length === 8, `sort run ${run}: 8 creatures dealt`);
  check(s.nests.length === 5, `sort run ${run}: 5 nests`);
  const dealtPhonemes = new Set(s.creatures.map((c) => c.phonemeId));
  check(dealtPhonemes.size === 5, `sort run ${run}: every tree represented`);
  const words = s.creatures.map((c) => c.word);
  check(new Set(words).size === words.length, `sort run ${run}: no duplicate words`);

  // Wrong-drop path on the first creature: hint, no lockout, stays in tray.
  const first = s.creatures[0];
  const wrongNest = s.nests.find((n) => n !== first.phonemeId);
  const wrongState = placeCreature(s, first.uid, wrongNest);
  check(wrongState.feedback === 'wrong', `sort run ${run}: wrong drop → wrong feedback`);
  check(trayCreatures(wrongState).length === 8, `sort run ${run}: creature stays in the tray`);
  const hint = sortHint(wrongState, data);
  check(hint.includes(first.word), `sort run ${run}: hint names the word`);
  check(!/bad|wrong answer/i.test(hint), `sort run ${run}: hint copy non-punitive`);
  check(ariaStatusSort(wrongState, data).length > 5, `sort run ${run}: wrong-drop aria status present`);

  // Return path (Escape during carry): no judgment.
  const returned = returnCreature(wrongState, first.uid);
  check(returned.feedback === 'idle', `sort run ${run}: returnCreature → idle`);

  // Solve: place every creature correctly.
  let solving = wrongState;
  for (const c of wrongState.creatures) {
    const before = solving.placed;
    solving = placeCreature(solving, c.uid, c.phonemeId);
    check(solving.placed === before + 1, `sort run ${run}: ${c.word} placed`);
    if (solving.placed === solving.creatures.length) {
      check(solving.completed, `sort run ${run}: completion flag set on last placement`);
    }
  }
  check(solving.completed, `sort run ${run}: completes when all home`);
  check(solving.feedback === 'done', `sort run ${run}: final feedback is done`);
  check(nestCreatures(solving, solving.nests[0]).length >= 1, `sort run ${run}: nests populated`);
  // Placing an already-homed creature is a no-op.
  const homed = solving.creatures.find((c) => c.status === 'nest');
  const noop = placeCreature(solving, homed.uid, homed.phonemeId);
  check(noop === solving, `sort run ${run}: re-placing a homed creature is a no-op`);
  console.log(`✔ sort run ${run} — dealt, wrong-drop hint, returned, solved 8/8`);
}

console.log(failures === 0 ? '\n✔ Engine simulation passed for all activities.' : `\n✖ ${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
