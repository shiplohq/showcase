#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless interaction test: drives every story through the SAME pure engine
// and scene registry the UI uses (no browser). Covers data validation, the
// deterministic shuffle, every wrong-order family we can generate, the causal
// link rules (wrong pairs, duplicates, out-of-order draws), title + reflection
// rules, and a full play-through per story including a deliberate mistake +
// fix loop (the path kids will actually take).
//
// Usage: npm run test:engine   (node >= 23 strips TS types natively)

import { readFileSync } from 'node:fs';

const engine = await import('../src/app/features/board/engine.ts');
const { SCENES, renderScene, knownScene } = await import('../src/app/features/board/scenes.ts');

const {
  validateStories,
  shuffleOrder,
  isValidOrder,
  correctlyPlacedCount,
  isLinkCanonical,
  evaluateLinks,
  titleCorrect,
  reflectionBest,
  evaluate,
  arraysEqual,
} = engine;

let pass = 0;
let fail = 0;
const failures = [];

function check(name, cond, detail = '') {
  if (cond) {
    pass++;
  } else {
    fail++;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const data = JSON.parse(readFileSync(new URL('../public/data/stories.json', import.meta.url), 'utf8'));
const stories = data.stories;

// ---------------------------------------------------------------------------
// 1. Data validation
// ---------------------------------------------------------------------------
const problems = validateStories(stories);
check('validateStories: clean data', problems.length === 0, problems.join(' | '));

// ---------------------------------------------------------------------------
// 2. Scene registry coverage — every referenced scene must render
// ---------------------------------------------------------------------------
for (const story of stories) {
  check(`cover scene '${story.coverScene}' registered`, knownScene(story.coverScene));
  for (const p of story.panels) {
    check(`scene '${p.scene}' registered`, knownScene(p.scene));
    const svg = renderScene(p.scene);
    check(`scene '${p.scene}' renders svg`, svg.includes('<svg') === false && svg.includes('<g') && svg.length > 400, `len=${svg.length}`);
  }
}
check('unknown scene degrades gracefully', renderScene('nope-not-a-scene').includes('M192 106'));

// ---------------------------------------------------------------------------
// 3. Shuffle: deterministic, never a valid order, always a permutation
// ---------------------------------------------------------------------------
for (const story of stories) {
  const s1 = shuffleOrder(story);
  const s2 = shuffleOrder(story);
  check(`shuffle '${story.id}' deterministic`, arraysEqual(s1, s2));
  check(`shuffle '${story.id}' not a valid order`, !isValidOrder(story, s1), s1.join(','));
  check(`shuffle '${story.id}' is a permutation`, s1.length === story.panels.length && new Set(s1).size === s1.length);
}

// ---------------------------------------------------------------------------
// 4. Order rules: every single swap of the canonical order must be invalid
//    (unless the story explicitly lists it as an alternate)
// ---------------------------------------------------------------------------
for (const story of stories) {
  const co = story.canonicalOrder;
  check(`canonical accepted '${story.id}'`, isValidOrder(story, co));
  let swapsTested = 0;
  for (let i = 0; i < co.length - 1; i++) {
    const swapped = co.slice();
    const t = swapped[i];
    swapped[i] = swapped[i + 1];
    swapped[i + 1] = t;
    swapsTested++;
    check(`swap(${i},${i + 1}) rejected '${story.id}'`, !isValidOrder(story, swapped));
  }
  check(`'${story.id}' tested swaps > 0`, swapsTested > 0);
  // reversed order rejected
  check(`reverse rejected '${story.id}'`, !isValidOrder(story, co.slice().reverse()));
  // truncation / dupe rejected
  check(`truncated rejected '${story.id}'`, !isValidOrder(story, co.slice(0, -1)));
  const dupe = co.slice();
  dupe[0] = dupe[1];
  check(`dupe rejected '${story.id}'`, !isValidOrder(story, dupe));
  check(`placedCount canonical = n '${story.id}'`, correctlyPlacedCount(story, co) === co.length);
}

// ---------------------------------------------------------------------------
// 5. Alternate valid orders — synthetic story (real data has none, engine
//    must still honour the contract)
// ---------------------------------------------------------------------------
const altStory = {
  id: 'alt-test',
  issueNo: 99,
  coverScene: 'sprout',
  coverTint: 'teal',
  titles: [
    { id: 't1', text: 'Correct', correct: true },
    { id: 't2', text: 'Nope 1' },
    { id: 't3', text: 'Nope 2' },
  ],
  panels: [
    { id: 'a', scene: 'sprout', caption: 'A tiny sprout grew one morning.', timeClues: ['one morning'] },
    { id: 'b', scene: 'water-can', caption: 'Then it was watered again.', timeClues: ['Then'] },
    { id: 'c', scene: 'ripe-tomato', caption: 'Finally tomatoes appeared.', timeClues: ['Finally'] },
    { id: 'd', scene: 'stake-tie', caption: 'Later a stake held it up.', timeClues: ['Later'] },
  ],
  canonicalOrder: ['a', 'b', 'c', 'd'],
  alternateValidOrders: [['a', 'b', 'd', 'c']],
  causalLinks: [['b', 'c']],
  reflection: {
    prompt: 'Which clue?',
    options: [
      { id: 'r1', text: 'Time words', explanation: 'Yes.', best: true },
      { id: 'r2', text: 'Colours', explanation: 'No.' },
    ],
  },
};
check('alt story data validates', validateStories([altStory]).length === 0, validateStories([altStory]).join('|'));
check('alternate accepted', isValidOrder(altStory, ['a', 'b', 'd', 'c']));
check('canonical still accepted', isValidOrder(altStory, ['a', 'b', 'c', 'd']));
check('non-listed order rejected', !isValidOrder(altStory, ['a', 'd', 'b', 'c']));

// ---------------------------------------------------------------------------
// 6. Link rules
// ---------------------------------------------------------------------------
for (const story of stories) {
  for (const [from, to] of story.causalLinks) {
    check(`link ${from}→${to} canonical '${story.id}'`, isLinkCanonical(story, from, to));
    check(`reversed link ${to}→${from} rejected '${story.id}'`, !isLinkCanonical(story, to, from));
  }
  // cross pairs that are NOT canonical links must be rejected
  const ids = story.canonicalOrder;
  for (let i = 0; i < ids.length; i++) {
    for (let j = 0; j < ids.length; j++) {
      if (i !== j) {
        const from = ids[i];
        const to = ids[j];
        const isCanon = story.causalLinks.some(([a, b]) => a === from && b === to);
        check(`pair ${from}→${to} ${isCanon ? 'accepted' : 'rejected'} '${story.id}'`, isLinkCanonical(story, from, to) === isCanon);
      }
    }
  }
  // full set, drawn in reverse order, accepted
  const drawnReverse = story.causalLinks.map(([from, to]) => ({ from, to })).reverse();
  check(`links drawn in reverse accepted '${story.id}'`, evaluateLinks(story, drawnReverse));
  // duplicate link makes it wrong
  const dup = [{ from: story.causalLinks[0][0], to: story.causalLinks[0][1] }, { from: story.causalLinks[0][0], to: story.causalLinks[0][1] }];
  check(`duplicate links rejected '${story.id}'`, !evaluateLinks(story, dup));
  // missing one
  if (story.causalLinks.length > 1) {
    check(`missing link rejected '${story.id}'`, !evaluateLinks(story, [{ from: story.causalLinks[0][0], to: story.causalLinks[0][1] }]));
  }
  // wrong pair set
  const wrongSet = story.causalLinks.map(([from, to], idx) => (idx === 0 ? { from: to, to: from } : { from, to }));
  check(`wrong pair set rejected '${story.id}'`, !evaluateLinks(story, wrongSet));
}

// ---------------------------------------------------------------------------
// 7. Title + reflection rules
// ---------------------------------------------------------------------------
for (const story of stories) {
  const right = story.titles.find((t) => t.correct);
  const wrong = story.titles.find((t) => !t.correct);
  check(`correct title accepted '${story.id}'`, titleCorrect(story, right.id));
  check(`wrong title rejected '${story.id}'`, !titleCorrect(story, wrong.id));
  check(`null title rejected '${story.id}'`, !titleCorrect(story, null));
  const bestOpt = story.reflection.options.find((o) => o.best);
  const otherOpt = story.reflection.options.find((o) => !o.best);
  check(`reflection best '${story.id}'`, reflectionBest(story, bestOpt.id));
  check(`reflection other '${story.id}'`, !reflectionBest(story, otherOpt.id));
  check(`reflection explanations present '${story.id}'`, story.reflection.options.every((o) => o.explanation.length > 10));
}

// ---------------------------------------------------------------------------
// 8. Full playthrough per story: solve by adjacent moves (what the move
//    buttons do), including a deliberate mistake + fix loop
// ---------------------------------------------------------------------------
function movePanel(order, index, delta) {
  const next = order.slice();
  const j = index + delta;
  if (j < 0 || j >= next.length) return { order: next, moved: false };
  const t = next[index];
  next[index] = next[j];
  next[j] = t;
  return { order: next, moved: true };
}

for (const story of stories) {
  // phase 1: mess it up further (all wrong-order moves the UI allows)
  let order = shuffleOrder(story);
  let moves = 0;
  let guard = 0;
  while (!arraysEqual(order, story.canonicalOrder) && guard < 200) {
    guard++;
    // selection-sort by adjacent swaps toward the canonical order
    for (let i = 0; i < order.length; i++) {
      if (order[i] !== story.canonicalOrder[i]) {
        const target = story.canonicalOrder[i];
        const at = order.indexOf(target);
        const delta = at > i ? -1 : 1;
        const res = movePanel(order, at, delta);
        if (res.moved) {
          order = res.order;
          moves++;
          break;
        }
      }
    }
    // verdict mid-way (kid checks before finishing)
    if (guard === 3) {
      const mid = evaluate(story, order, [], null);
      check(`mid-check reports missing parts '${story.id}'`, !mid.allOk && mid.missingLinks === story.causalLinks.length);
    }
  }
  check(`solve by moves '${story.id}'`, arraysEqual(order, story.canonicalOrder), `moves=${moves} guard=${guard}`);
  check(`solve needed real moves '${story.id}'`, moves > 0);

  // phase 2: draw links — one wrong attempt then all right
  const links = [];
  const [firstFrom, firstTo] = story.causalLinks[0];
  const wrongTarget = story.canonicalOrder.find((id) => id !== firstFrom && id !== firstTo);
  check(`wrong link rejected at draw '${story.id}'`, !isLinkCanonical(story, wrongTarget, firstTo));
  for (const [from, to] of story.causalLinks) links.push({ from, to });

  // phase 3: title — wrong first, then right
  const wrongTitle = story.titles.find((t) => !t.correct).id;
  const rightTitle = story.titles.find((t) => t.correct).id;
  const partly = evaluate(story, order, links, wrongTitle);
  check(`wrong title verdict fails '${story.id}'`, !partly.allOk && partly.titleOk === false);
  const final = evaluate(story, order, links, rightTitle);
  check(`final verdict all ok '${story.id}'`, final.allOk, JSON.stringify(final));
  check(`verdict placedCount full '${story.id}'`, final.placedCount === final.panelCount);

  // reflection best option exists and is accepted
  check(`reflection accepted at end '${story.id}'`, reflectionBest(story, story.reflection.options.find((o) => o.best).id));
}

// ---------------------------------------------------------------------------
// 9. Wrong-order playthrough: kid submits with a swapped order
// ---------------------------------------------------------------------------
for (const story of stories) {
  const swapped = story.canonicalOrder.slice();
  const t = swapped[0];
  swapped[0] = swapped[1];
  swapped[1] = t;
  const links = story.causalLinks.map(([from, to]) => ({ from, to }));
  const titleId = story.titles.find((x) => x.correct).id;
  const v = evaluate(story, swapped, links, titleId);
  check(`swapped order verdict fails '${story.id}'`, !v.allOk && v.orderOk === false && v.titleOk && v.linksOk);
  check(`placedCount reports kindly '${story.id}'`, v.placedCount === swapped.length - 2, `placed=${v.placedCount}`);
}

// ---------------------------------------------------------------------------
console.log(`\nengine-sim: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.error('FAILURES:');
  for (const f of failures) console.error('  ✖ ' + f);
  process.exit(1);
}
console.log('engine-sim: ALL CHECKS PASS');
