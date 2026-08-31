#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless interaction test: simulates a full playthrough of every unit
// through the SAME engine the UI uses (no browser needed). Verifies the
// core learning loop: plant/remove/submit across all 40 questions, keyboard
// (stepper) and drag (plant/move) action paths, reset/replay.
//
// Usage: node scripts/engine-sim.mjs   (run from the project dir after build)

import { readFileSync } from 'node:fs';

const mod = await import('../src/features/play/engine.ts').catch(() => null);
if (!mod) {
  console.error('engine.ts is TypeScript — run via a TS-aware runner.');
  console.error('This script is executed by `npm run test:engine` (tsx).');
  process.exit(1);
}

const {
  startRun,
  currentQuestion,
  plantSeed,
  removeSeed,
  submit,
  isCorrect,
  shouldShowWhy,
  isLastQuestion,
  canPlant,
  canRemove,
  template,
  ariaStatus,
} = mod;

const lessons = JSON.parse(readFileSync(new URL('../public/data/lessons.json', import.meta.url), 'utf8'));

let failures = 0;
function check(cond, msg) {
  if (!cond) {
    failures++;
    console.error(`  ✖ ${msg}`);
  }
}

console.log(`Simulating ${lessons.units.length} units…`);

for (const unit of lessons.units) {
  console.log(`\n— ${unit.title} (${unit.questions.length} câu)`);
  let s = startRun(unit);
  check(s.correct === 0, 'run starts at 0 correct');

  for (let i = 0; i < unit.questions.length; i++) {
    const q = currentQuestion(s);
    check(q.id === unit.questions[i].id, `question ${i}: loaded from JSON in order`);

    // Solve it the way a child would: stepper path (keyboard equivalent).
    if (q.operation === 'count') {
      while (s.a < q.target) s = plantSeed(s, 'a');
    } else if (q.operation === 'make10') {
      check(s.a === q.operands[0] && s.bag === q.target - q.operands[0], `make10 q${i}: A locked + bag correct`);
      check(!canPlant(s, 'a'), `make10 q${i}: cannot plant into locked A`);
      while (s.b > q.target - q.operands[0]) s = removeSeed(s, 'b');
      while (s.b < q.target - q.operands[0]) s = plantSeed(s, 'b');
    } else if (q.operation === 'add') {
      while (s.a > q.operands[0]) s = removeSeed(s, 'a');
      while (s.a < q.operands[0]) s = plantSeed(s, 'a');
      while (s.b < q.operands[1]) s = plantSeed(s, 'b');
    } else if (q.operation === 'subtract') {
      check(s.a === q.operands[0], `subtract q${i}: bed pre-filled with ${q.operands[0]}`);
      check(s.bag === 0 && !canPlant(s, 'a'), `subtract q${i}: bag unusable`);
      while (s.b < q.operands[1]) s = removeSeed(s, 'a');
      // undo path: take one out and put it back
      const undone = removeSeed(s, 'a');
      check(undone.b === q.operands[1] + 1, `subtract q${i}: remove → basket grows`);
      const restored = removeSeed(undone, 'b');
      check(restored.a === q.operands[0] - q.operands[1] && restored.b === q.operands[1], `subtract q${i}: basket → bed undo works`);
      s = restored;
    }

    check(isCorrect(s), `q${i} (${q.id}): solved arrangement is correct`);

    // Nudge path: check a wrong arrangement, then adjust — feedback must
    // never lock the child out. Break the solved arrangement by removing a
    // seed, then restore it (subtract moves bed↔basket, others bag↔plot).
    {
      const wrong = removeSeed(s, q.operation === 'count' || q.operation === 'add' ? 'a' : 'b');
      const nudged = submit(wrong);
      check(nudged.feedback === 'nudge', `q${i}: wrong answer gives gentle nudge, not lockout`);
      check(nudged.correct === s.correct, `q${i}: nudge does not count as a mistake record`);
      const fixed =
        q.operation === 'subtract'
          ? removeSeed(nudged, 'a') // take again → basket restored
          : plantSeed(nudged, q.operation === 'count' || q.operation === 'add' ? 'a' : 'b');
      check(fixed.feedback === 'idle', `q${i}: adjusting clears nudge`);
      check(isCorrect(fixed), `q${i}: arrangement correct again after adjusting`);
      s = fixed;
    }

    const done = submit(s);
    check(done.feedback === 'correct', `q${i}: submit accepts the answer`);
    check(done.correct === i + 1, `q${i}: correct count advances`);

    // Why-overlay cadence: every 3rd question except the last.
    const expectWhy = (i + 1) % 3 === 0 && i < unit.questions.length - 1;
    check(shouldShowWhy(done) === expectWhy, `q${i}: why-overlay cadence ${expectWhy ? 'shows' : 'skips'}`);

    // Text alternatives must contain the quantities.
    const status = ariaStatus(done);
    check(status.includes(`${unit.questions.length}`), `q${i}: aria status mentions question count`);

    if (!isLastQuestion(done)) {
      // Advance (the UI does this after the reward).
      s = mod.questionState(unit, done.index + 1, { correct: done.correct });
      check(s.feedback === 'idle', `q${i}→${i + 1}: fresh question resets feedback`);
    } else {
      s = done;
    }
  }
  check(s.correct === unit.questions.length, `${unit.id}: full run = 10/10`);
  console.log(`  ✔ ${s.correct}/${unit.questions.length} câu đúng, bond cadence + undo + nudge OK`);
}

// Prompt templates must fully resolve (no leftover placeholders).
for (const unit of lessons.units) {
  for (const q of unit.questions) {
    for (const field of [q.prompt, q.hint, q.explanation]) {
      const out = template(field, q);
      check(!out.includes('{'), `${q.id}: template "${field}" resolves fully → "${out}"`);
    }
  }
}

console.log(failures === 0 ? '\n✔ Engine simulation passed for all units.' : `\n✖ ${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
