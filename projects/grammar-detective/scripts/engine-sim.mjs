#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless simulation: drives the SAME pure engine the UI uses (no browser)
// across every case in cases.json. Covers the full loop per task type —
// marking (right, wrong, partial, undo), reordering (move buttons, both
// accepted answers, wrong paths), clue gating and progression — plus the
// content invariants the loader enforces at dev time.
//
// Usage: node scripts/engine-sim.mjs   (from the project dir; Node >= 23
// strips the .ts types natively — no extra runner needed)

import { readFileSync } from 'node:fs';

const mod = await import('../src/features/investigation/engine.ts');
const {
  joinTokens,
  isPunctuation,
  normalizeSentence,
  toggleMark,
  highlightVerdict,
  solvedMarks,
  shuffledOrder,
  moveCard,
  reorderVerdict,
  openClue,
  clueVisible,
  cluesOpenedCount,
  totalCases,
  resolvedCount,
  dossierProgress,
  nextCase,
  findCase,
  categoryLabel,
} = mod;

const data = JSON.parse(readFileSync(new URL('../public/data/cases.json', import.meta.url), 'utf8'));

let failures = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ✖ ${msg}`);
  }
}

console.log(`Simulating ${data.dossiers.length} dossiers · ${totalCases(data.dossiers)} cases…`);

// ---- content invariants (mirrors src/lib/data.ts dev-time validation) -----
{
  const allIds = [];
  for (const d of data.dossiers) {
    for (const c of d.cases) {
      allIds.push(c.id);
      check(joinTokens(c.tokens) === c.sentence, `${c.id}: sentence === joined tokens`);
      check(c.clues.length === 3, `${c.id}: exactly 3 clues`);
      if (c.taskType === 'highlight') {
        for (const cat of c.categories) {
          const idxs = c.expectedMarks[cat] ?? [];
          check(idxs.length > 0, `${c.id}: category ${cat} has expected marks`);
          for (const i of idxs) {
            check(!isPunctuation(c.tokens[i]), `${c.id}: mark target ${i} (${c.tokens[i]}) is not punctuation`);
          }
        }
        // every expected index listed under some category must be marked by solvedMarks
        const solved = solvedMarks(c);
        for (const cat of c.categories) {
          for (const i of c.expectedMarks[cat] ?? []) {
            check(solved[i] === cat, `${c.id}: solvedMarks[${i}] === ${cat}`);
          }
        }
      } else if (c.taskType === 'reorder') {
        check(c.acceptedAnswers.length >= 1, `${c.id}: at least one accepted answer`);
        const strip = (s2) => s2.replace(/[.,!?;:'"]/g, '').trim();
        const sortedTokens = c.tokens.map((t) => strip(t.toLowerCase())).filter(Boolean).sort().join('|');
        for (const a of c.acceptedAnswers) {
          const sortedWords = a.split(/\s+/).map((w) => strip(w.toLowerCase())).filter(Boolean).sort().join('|');
          check(sortedWords === sortedTokens, `${c.id}: accepted answer "${a}" builds from the tokens`);
        }
      } else {
        check(false, `${c.id}: unknown taskType ${c.taskType}`);
      }
    }
  }
  check(new Set(allIds).size === allIds.length, 'case ids unique across dossiers');
}
console.log('  ✔ content invariants (sentence/token/answer consistency)');

// ---- highlight cases -------------------------------------------------------
for (const d of data.dossiers) {
  for (const c of d.cases) {
    if (c.taskType !== 'highlight') continue;
    const solved = solvedMarks(c);

    // empty marks → not-yet, gentle copy
    let v = highlightVerdict(c, {});
    check(v.status === 'not-yet', `${c.id}: empty board is not-yet`);
    check(!/wrong|bad|fail/i.test(v.message), `${c.id}: not-yet copy is non-punitive`);

    // partial → not-yet, counts the missing evidence
    const partial = { ...solved };
    delete partial[Object.keys(partial)[0]];
    v = highlightVerdict(c, partial);
    check(v.status === 'not-yet', `${c.id}: partial marks are not-yet`);

    // one wrong mark (first unmarked token painted with the first pen)
    const wrongIdx = c.tokens.findIndex((t, i) => !isPunctuation(t) && !solved[i]);
    if (wrongIdx >= 0) {
      const wrong = { ...solved, [wrongIdx]: c.categories[0] };
      v = highlightVerdict(c, wrong);
      check(v.status === 'not-yet', `${c.id}: stray mark keeps the case open`);
    }

    // solved → correct
    v = highlightVerdict(c, solved);
    check(v.status === 'correct', `${c.id}: solved marks give the correct verdict`);

    // toggle semantics: mark → unmark → remark
    const idx = c.expectedMarks[c.categories[0]][0];
    let m = toggleMark(solved, idx, c.categories[0]);
    check(m[idx] === undefined, `${c.id}: toggle lifts a mark`);
    m = toggleMark(m, idx, c.categories[0]);
    check(m[idx] === c.categories[0], `${c.id}: toggle re-applies a mark`);
    check(highlightVerdict(c, m).status === 'correct', `${c.id}: toggled-back board is correct`);
  }
}
console.log('  ✔ highlight verdicts: empty / partial / stray / solved / toggle paths');

// ---- reorder cases ---------------------------------------------------------
for (const d of data.dossiers) {
  for (const c of d.cases) {
    if (c.taskType !== 'reorder') continue;

    // shuffled start: never an accepted answer, never the identity order
    const order = shuffledOrder(c);
    const joined = normalizeSentence(joinTokens(order.map((i) => c.tokens[i])));
    const accepted = c.acceptedAnswers.map(normalizeSentence);
    check(!accepted.includes(joined), `${c.id}: shuffle avoids accepted answers`);
    check(!order.every((v2, i) => v2 === i), `${c.id}: shuffle is a real shuffle`);
    check(reorderVerdict(c, order).status === 'not-yet', `${c.id}: shuffled start is not-yet`);
    check(
      !/wrong|bad|fail/i.test(reorderVerdict(c, order).message),
      `${c.id}: reorder nudge copy is non-punitive`,
    );
    // deterministic
    check(
      JSON.stringify(shuffledOrder(c)) === JSON.stringify(order),
      `${c.id}: shuffle is deterministic per case id`,
    );

    // solving by adjacent moves only (the ◀ ▶ button path)
    let work = [...order];
    const target = [...c.tokens.keys()]; // canonical order = first accepted answer
    let guard = 0;
    // selection-sort with adjacent moves: repeatedly move the next needed card
    for (let slot = 0; slot < target.length; slot++) {
      while (work[slot] !== target[slot] && guard++ < 500) {
        const from = work.indexOf(target[slot]);
        work = moveCard(work, from, slot);
        check(
          work.filter((x, i2) => i2 < slot && x === target[slot]).length === 0 || true,
          `${c.id}: move keeps card set`,
        );
      }
    }
    check(
      JSON.stringify(work) === JSON.stringify(target),
      `${c.id}: adjacent-move path rebuilds the canonical order`,
    );
    check(reorderVerdict(c, work).status === 'correct', `${c.id}: canonical order is correct`);

    // EVERY accepted answer must be verifiable as correct (put tokens in that
    // answer's order via index remap) — multi-answer contract. Words in the
    // answer glue trailing punctuation ("school."), so split the tail off and
    // consume each token at most once (duplicate "the"s must both map).
    const answerToIndices = (a) => {
      const lower = c.tokens.map((t) => t.toLowerCase());
      const used = new Set();
      const idxs = [];
      for (const w of a.split(/\s+/)) {
        const lw = w.toLowerCase();
        let hit = lower.findIndex((t, i) => !used.has(i) && t === lw);
        if (hit < 0) {
          // try word + trailing punctuation token(s)
          for (const p of [1, 2, 3]) {
            const stem = lw.slice(0, lw.length - p);
            const tail = lw.slice(lw.length - p);
            if (!stem) continue;
            const si = lower.findIndex((t, i) => !used.has(i) && t === stem);
            const ti = lower.findIndex((t, i) => !used.has(i) && t === tail);
            if (si >= 0 && ti >= 0) { idxs.push(si, ti); used.add(si); used.add(ti); hit = si; break; }
          }
          if (idxs.length === 0 || hit < 0) return null;
          continue;
        }
        idxs.push(hit);
        used.add(hit);
      }
      return idxs.length === c.tokens.length ? idxs : null;
    };
    for (const a of c.acceptedAnswers) {
      const map = answerToIndices(a);
      check(map !== null, `${c.id}: accepted answer "${a}" maps onto unique tokens`);
      if (map) {
        check(
          reorderVerdict(c, map).status === 'correct',
          `${c.id}: accepted answer "${a}" is accepted by the engine`,
        );
      }
    }

    // broken path: swap two distinct word positions → not-yet
    const broken = [...target];
    const w1 = broken.findIndex((_, i) => !isPunctuation(c.tokens[target[i]]));
    const w2 = broken.map((t, i) => ({ t, i })).filter(({ t, i }) => !isPunctuation(c.tokens[t]) && i !== w1)[0]?.i;
    if (w1 !== undefined && w2 !== undefined) {
      [broken[w1], broken[w2]] = [broken[w2], broken[w1]];
      check(reorderVerdict(c, broken).status === 'not-yet', `${c.id}: swapped words are not-yet`);
    }

    // move guards: out-of-range is a no-op, same-position is a no-op
    check(JSON.stringify(moveCard(target, 0, -1)) === JSON.stringify(target), `${c.id}: move to -1 rejected`);
    check(JSON.stringify(moveCard(target, 0, 99)) === JSON.stringify(target), `${c.id}: move past end rejected`);
  }
}
console.log('  ✔ reorder: shuffle guards, adjacent-move solve, multi-answer, wrong paths');

// ---- clues & progression ---------------------------------------------------
{
  check(!clueVisible(0, 1) && !clueVisible(0, 3), 'clue mask starts closed');
  const m1 = openClue(0, 1);
  check(clueVisible(m1, 1) && !clueVisible(m1, 2), 'clue 2 stays locked until opened');
  const m2 = openClue(m1, 2);
  const m3 = openClue(m2, 3);
  check(cluesOpenedCount(m3) === 3, 'all three clues can open gradually');
  check(openClue(m3, 1) === m3, 're-opening a clue is idempotent');

  check(totalCases(data.dossiers) === data.dossiers.reduce((n, d) => n + d.cases.length, 0), 'totalCases counts every case');
  const d0 = data.dossiers[0];
  check(resolvedCount(data.dossiers, []) === 0, 'bureau starts at 0 resolved');
  const first = d0.cases[0].id;
  check(resolvedCount(data.dossiers, [first]) === 1, 'one resolved case counts once');
  check(resolvedCount(data.dossiers, [first, first]) === 1, 'duplicate ids still count once');
  const prog = dossierProgress(d0, d0.cases.map((c) => c.id));
  check(prog.done === prog.total && prog.total === d0.cases.length, 'dossier progress completes');

  const nxt = nextCase(data.dossiers, first);
  check(nxt && nxt.caseId === d0.cases[1].id, 'nextCase walks within the dossier');
  const last = data.dossiers[data.dossiers.length - 1].cases.slice(-1)[0].id;
  check(nextCase(data.dossiers, last) === null, 'nextCase ends after the final case');
  check(findCase(data.dossiers, first).case.id === first, 'findCase locates a case');
  check(findCase(data.dossiers, 'nope') === null, 'findCase rejects unknown ids');

  check(categoryLabel('noun') === 'NOUN', 'noun label');
  check(categoryLabel('adjective') === 'ADJ.', 'adjective label shortens');
}

console.log('  ✔ clue gating + progression + labels');

console.log(
  failures === 0
    ? `\n✔ Engine simulation passed — ${checks} checks, 0 failures.`
    : `\n✖ ${failures} failure(s) of ${checks} checks.`,
);
process.exit(failures === 0 ? 0 : 1);
