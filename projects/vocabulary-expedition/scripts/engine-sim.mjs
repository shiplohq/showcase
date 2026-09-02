#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless interaction test: simulates a full playthrough of every unit through
// the SAME pure engines the UI uses (no browser needed). Covers every activity
// (clue hunt / label match / sentence builder), every input path (direct tap,
// pick-and-place, drag-equivalent), wrong-first recovery, hint thresholds,
// completion and unlock rules, and aria text resolution.
//
// Usage: node scripts/engine-sim.mjs   (run from the project dir; Node ≥ 22.6
// strips TS types natively)

import { readFileSync } from 'node:fs';

const clues = await import('../src/features/clues/engine.ts');
const match = await import('../src/features/match/engine.ts');
const sentences = await import('../src/features/sentences/engine.ts');

const data = JSON.parse(readFileSync(new URL('../public/data/units.json', import.meta.url), 'utf8'));

let failures = 0;
function check(cond, msg) {
  if (!cond) {
    failures++;
    console.error(`  ✖ ${msg}`);
  }
}

console.log(`Simulating ${data.units.length} units…`);

for (const unit of data.units) {
  console.log(`\n— ${unit.title} (${unit.items.length} items, ${unit.sentences.length} sentences)`);

  // -- clue hunt ---------------------------------------------------------------
  {
    let s = clues.startClues(unit);
    check(s.order.length === unit.clueItems.length, `${unit.id}: clue order = clueItems`);
    check(s.found.length === 0 && !s.done, `${unit.id}: hunt starts fresh`);

    for (let i = 0; i < unit.clueItems.length; i++) {
      const target = clues.clueItem(unit, s);
      check(target.id === unit.clueItems[i], `${unit.id} clue ${i}: loads from JSON in order`);

      // wrong-first path: tap two other objects → nudges, then the glow hint
      const wrong = unit.items.find((it) => it.id !== target.id && !unit.clueItems.includes(it.id));
      if (wrong) {
        const n1 = clues.answerClue(s, wrong.id);
        check(n1.feedback === 'nudge' && n1.misses === 1, `${unit.id} clue ${i}: wrong tap nudges, counts 1 miss`);
        check(!clues.shouldGlowHint(n1), `${unit.id} clue ${i}: no glow hint after 1 miss`);
        const n2 = clues.answerClue(n1, wrong.id);
        check(n2.misses === 2 && clues.shouldGlowHint(n2), `${unit.id} clue ${i}: glow hint after 2 misses (help, not lock)`);
        check(clues.answerClue(n2, wrong.id).feedback === 'nudge', `${unit.id} clue ${i}: still no lockout on 3rd miss`);
        s = n2;
      }

      // then find it
      const good = clues.answerClue(s, target.id);
      check(good.feedback === 'correct' && good.justFoundId === target.id, `${unit.id} clue ${i}: correct tap found`);
      check(good.found.length === i + 1, `${unit.id} clue ${i}: found count grows`);
      check(/Great find!/.test(clues.clueAriaStatus(unit, good)), `${unit.id} clue ${i}: aria names the word`);
      s = clues.advanceClue(good);
      check(s.feedback === 'idle', `${unit.id} clue ${i}: advance resets feedback`);
    }
    check(s.done, `${unit.id}: clue hunt completes after ${unit.clueItems.length} clues`);
    check(clues.answerClue(s, unit.items[0].id) === s, `${unit.id}: done hunt ignores taps`);
  }

  // -- label match -------------------------------------------------------------
  {
    let s = match.startMatch(unit);
    check(new Set(s.tray).size === s.targets.length && s.targets.every((t) => s.tray.includes(t)),
      `${unit.id}: tray is a permutation of the label targets`);
    check(s.placed && Object.keys(s.placed).length === 0, `${unit.id}: match starts empty`);

    for (let i = 0; i < unit.labelItems.length; i++) {
      const targetId = unit.labelItems[i];

      // wrong-first path (pick a label that belongs elsewhere)
      const wrongLabel = s.tray.find((t) => t !== targetId);
      if (wrongLabel) {
        const held = match.pickUp(s, wrongLabel);
        check(held.holding === wrongLabel, `${unit.id} match ${i}: pick-up holds the chip`);
        const bad = match.placeLabel(unit, held, targetId);
        check(bad.feedback === 'nudge' && bad.holding === null && bad.tray.includes(wrongLabel),
          `${unit.id} match ${i}: wrong label returns to the tray (no loss)`);
        check(match.matchAriaStatus(unit, bad).includes('somewhere else'),
          `${unit.id} match ${i}: nudge copy is gentle after a miss`);
        check((bad.wrongDrops[wrongLabel] ?? 0) === (s.wrongDrops[wrongLabel] ?? 0) + 1,
          `${unit.id} match ${i}: miss counted per label`);
        // second wrong drop of the same label → glow hint on its true object
        const bad2 = match.placeLabel(unit, match.pickUp(bad, wrongLabel), targetId);
        check((bad2.wrongDrops[wrongLabel] ?? 0) === (bad.wrongDrops[wrongLabel] ?? 0) + 1,
          `${unit.id} match ${i}: second miss counted`);
        const heldAgain = match.pickUp(match.clearFeedback(bad2), wrongLabel);
        check(match.shouldGlowMatchTarget(heldAgain), `${unit.id} match ${i}: glow hint after 2 wrong drops`);
        check(match.matchNudgeCopy(heldAgain).includes('warm light'), `${unit.id} match ${i}: escalated nudge copy`);
        s = match.clearFeedback(bad2);
      }

      // esc path: pick up and put down
      const esc = match.putDown(match.pickUp(s, wrongLabel ?? targetId));
      check(esc.holding === null, `${unit.id} match ${i}: Esc returns the chip`);

      // drag path (direct drop)
      const dropped = match.dropLabel(unit, s, targetId, targetId);
      if (i === 0) {
        check(dropped.feedback === 'correct' && dropped.justPlacedId === targetId, `${unit.id} match ${i}: drag-drop pins the label`);
        s = dropped;
      } else {
        // pick-and-place path (keyboard/touch)
        const done = match.placeLabel(unit, match.pickUp(s, targetId), targetId);
        check(done.feedback === 'correct' && done.placed[targetId] === targetId, `${unit.id} match ${i}: pick-and-place pins the label`);
        check(done.tray.includes(targetId) === false, `${unit.id} match ${i}: pinned label leaves the tray`);
        s = done;
      }
      check(Object.keys(s.placed).length === i + 1, `${unit.id} match ${i}: placed count grows`);
    }
    check(s.done, `${unit.id}: label match completes after ${unit.labelItems.length} labels`);
    check(match.placeLabel(unit, s, unit.items[0].id) === s, `${unit.id}: done match ignores placement`);
  }

  // -- sentence builder --------------------------------------------------------
  {
    let s = sentences.startSentences(unit);
    check(s.order.length === unit.sentences.length, `${unit.id}: sentence order from JSON`);
    check(new Set(s.chips).size === s.chips.length && s.chips.length >= 3, `${unit.id}: chips unique, ≥3`);

    for (let i = 0; i < unit.sentences.length; i++) {
      const sentence = sentences.currentSentence(unit, s);
      check(sentence.id === unit.sentences[i].id, `${unit.id} sentence ${i}: loads in order`);
      const parts = sentences.sentenceParts(sentence);
      check(sentence.text.startsWith(parts.before) && parts.before.length > 0, `${unit.id} sentence ${i}: blank splits`);

      // check with empty blank does nothing
      check(sentences.checkSentence(unit, s).feedback === 'idle', `${unit.id} sentence ${i}: empty blank is not judged`);

      // wrong-first path
      const wrongChip = s.chips.find((c) => c !== sentence.answer);
      const nudged = sentences.checkSentence(unit, sentences.placeWord(s, wrongChip));
      check(nudged.feedback === 'nudge', `${unit.id} sentence ${i}: wrong chip nudges`);
      check(sentences.sentenceAriaStatus(unit, nudged).includes('try another word'), `${unit.id} sentence ${i}: nudge copy gentle`);
      // undo path: tap the blank to clear, then answer
      const cleared = sentences.placeWord(nudged, null);
      check(cleared.blank === null, `${unit.id} sentence ${i}: blank tap clears the chip`);

      const good = sentences.checkSentence(unit, sentences.placeWord(s, sentence.answer));
      check(good.feedback === 'correct' && good.justSolvedId === sentence.id, `${unit.id} sentence ${i}: correct chip solves`);
      check(good.solved.length === i + 1, `${unit.id} sentence ${i}: solved count grows`);
      const aria = sentences.sentenceAriaStatus(unit, good);
      check(aria.includes(sentence.full) && aria.includes(sentence.translation), `${unit.id} sentence ${i}: aria reads full sentence + translation`);
      s = sentences.advanceSentence(unit, good);
      check(s.feedback === 'idle' && s.blank === null, `${unit.id} sentence ${i}: advance resets blank`);
    }
    check(s.done, `${unit.id}: sentence builder completes after ${unit.sentences.length} sentences`);
  }
}

// -- data sanity over the whole file -------------------------------------------
{
  const words = new Set();
  for (const unit of data.units) {
    for (const it of unit.items) {
      check(!words.has(it.id), `duplicate item id across units: ${it.id}`);
      words.add(it.id);
      const [x, y, w, h] = it.bbox;
      check([x, y, w, h].every((n) => typeof n === 'number' && n >= 0) && x + w <= 100 && y + h <= 100,
        `${it.id}: bbox inside 0–100`);
    }
    for (const sn of unit.sentences) {
      check(sn.full.replace(' an ', ' ').includes(sn.answer) || sn.full.includes(unit.items.find((i) => i.id === sn.answer).word),
        `${sn.id}: "full" actually contains the answer word`);
    }
    const overlap = unit.clueItems.filter((c) => unit.labelItems.includes(c));
    check(overlap.length >= 1 && overlap.length <= 2, `${unit.id}: label round reinforces 1–2 clue words (got ${overlap.length})`);
  }
  console.log(`\n${words.size} distinct words across ${data.units.length} scenes.`);
}

console.log(failures === 0 ? '\n✔ Engine simulation passed for all units and activities.' : `\n✖ ${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
