#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless interaction test: plays every order in the book through the SAME
// pure engine the UI uses (no browser, no Vue). For each order it walks the
// correct path AND the instructive wrong paths (wrong cut, wrong count,
// wrong amount, wrong sign), plus station invariants (caps, undo, re-cut).
//
// Usage: npm run test:engine   (from the project dir; node >= 23 strips TS)

import { readFileSync } from 'node:fs';

const E = await import('../src/features/cut/engine.ts');

const ordersDoc = JSON.parse(readFileSync(new URL('../public/data/orders.json', import.meta.url), 'utf8'));
const dishesDoc = JSON.parse(readFileSync(new URL('../public/data/dishes.json', import.meta.url), 'utf8'));
const dishNames = new Map(dishesDoc.dishes.map((d) => [d.id, d.name]));
const dishKinds = new Map(dishesDoc.dishes.map((d) => [d.id, d.kind]));

const orders = ordersDoc.orders.map((o) => ({
  ...o,
  dishName: dishNames.get(o.dish) ?? o.dish,
  dishKind: dishKinds.get(o.dish) ?? 'round',
}));

let failures = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ✖ ${msg}`);
  }
}

// ---- data sanity ------------------------------------------------------------

check(orders.length === 16, `expected 16 orders, found ${orders.length}`);
for (const o of orders) {
  check(E.PARTITIONS.includes(o.partitionCount), `${o.id}: partitionCount in 2/3/4/6/8`);
  check(
    o.requestedFraction[1] === o.partitionCount || o.mode !== 'build',
    `${o.id}: build denominators must match the cut`,
  );
  if (o.mode !== 'build') {
    check(Array.isArray(o.compareWith), `${o.id}: ${o.mode} needs compareWith`);
  }
}
const ids = new Set(orders.map((o) => o.id));
check(ids.size === orders.length, 'order ids are unique');

// sign expectations for this order book (ground truth from the data)
const EXPECTED_SIGNS = { 'ord-010': '>', 'ord-011': '>', 'ord-015': '=', 'ord-016': '<' };
for (const [id, sign] of Object.entries(EXPECTED_SIGNS)) {
  const o = orders.find((x) => x.id === id);
  check(o && E.expectedSign(o) === sign, `${id}: expectedSign should be "${sign}", got "${o && E.expectedSign(o)}"`);
}

// ---- station invariants -------------------------------------------------------

{
  let st = E.startStation();
  check(st.partition === 1 && st.placed === 0, 'station starts whole and empty');
  st = E.setPartition(st, 8);
  for (let i = 0; i < 10; i++) st = E.placeSlice(st);
  check(st.placed === 8, `placeSlice caps at partition (got ${st.placed})`);
  check(E.builtFraction(st).join('/') === '8/8', 'builtFraction mirrors the plate');
  st = E.returnSlice(st);
  check(st.placed === 7, 'returnSlice takes one back');
  st = E.returnSlice(E.returnSlice(E.returnSlice(E.returnSlice(E.returnSlice(E.returnSlice(E.returnSlice(st)))))));
  check(st.placed === 0, 'returnSlice floors at 0');
  st = E.placeSlice(E.startStation());
  check(st.placed === 0, 'cannot plate from an uncut dish');
  st = E.setPartition(E.setPlate(st, 4, 3), 6);
  check(st.partition === 6 && st.placed === 0, 're-cutting returns all slices to the dish');
}

// ---- every order: correct path + instructive wrong paths ---------------------

function solveCorrect(o) {
  if (o.mode === 'build') {
    let st = E.setPartition(E.startStation(), o.partitionCount);
    for (let i = 0; i < o.requestedFraction[0]; i++) st = E.placeSlice(st);
    return E.serveBuild(o, st);
  }
  if (o.mode === 'equivalent') {
    let st = E.setPartition(E.startStation(), o.partitionCount);
    for (let i = 0; i < o.compareWith[0]; i++) st = E.placeSlice(st);
    return E.serveEquivalent(o, st);
  }
  let a = E.setPartition(E.startStation(), o.requestedFraction[1]);
  for (let i = 0; i < o.requestedFraction[0]; i++) a = E.placeSlice(a);
  let b = E.setPartition(E.startStation(), o.compareWith[1]);
  for (let i = 0; i < o.compareWith[0]; i++) b = E.placeSlice(b);
  return E.serveCompare(o, a, b, E.expectedSign(o));
}

console.log(`Simulating ${orders.length} orders…\n`);
for (const o of orders) {
  const ok = solveCorrect(o);
  check(ok.ok && ok.kind === 'servito', `${o.id} (${o.mode}): correct path serves — "${ok.message}"`);

  // empty plate
  const empty = o.mode === 'compare'
    ? E.serveCompare(o, E.startStation(), E.startStation(), null)
    : o.mode === 'equivalent'
      ? E.serveEquivalent(o, E.startStation())
      : E.serveBuild(o, E.startStation());
  check(empty.kind === 'empty' || empty.kind === 'sign-mismatch', `${o.id}: empty path nudges gently (${empty.kind})`);

  if (o.mode === 'build') {
    // wrong cut
    const wrongP = E.PARTITIONS.find((p) => p !== o.partitionCount);
    let st = E.setPartition(E.startStation(), wrongP);
    st = E.placeSlice(st);
    const cut = E.serveBuild(o, st);
    check(cut.kind === 'cut-mismatch', `${o.id}: wrong cut → cut-mismatch (got ${cut.kind})`);
    // wrong count (same cut, one slice off)
    st = E.setPartition(E.startStation(), o.partitionCount);
    const target = o.requestedFraction[0] === 1 ? 2 : o.requestedFraction[0] - 1;
    for (let i = 0; i < Math.min(target, o.partitionCount); i++) st = E.placeSlice(st);
    const count = E.serveBuild(o, st);
    check(count.kind === 'count-mismatch', `${o.id}: wrong count → count-mismatch (got ${count.kind})`);
  }

  if (o.mode === 'equivalent') {
    // wrong cut: same cut as the chef
    let st = E.setPartition(E.startStation(), o.requestedFraction[1]);
    st = E.placeSlice(st);
    const cut = E.serveEquivalent(o, st);
    check(cut.kind === 'cut-mismatch', `${o.id}: chef's own cut → cut-mismatch (got ${cut.kind})`);
    // wrong amount on the right cut
    st = E.setPartition(E.startStation(), o.partitionCount);
    const wrongCount = (o.compareWith[0] % o.partitionCount) + 1;
    for (let i = 0; i < wrongCount; i++) st = E.placeSlice(st);
    if (wrongCount !== o.compareWith[0]) {
      const amount = E.serveEquivalent(o, st);
      check(amount.kind === 'amount-mismatch', `${o.id}: wrong amount → amount-mismatch (got ${amount.kind})`);
    }
    // recipe derivable
    const recipe = E.recipeFrom(o);
    check(recipe && E.fmt(recipe.left) === E.fmt(o.requestedFraction), `${o.id}: recipe records the pair`);
  }

  if (o.mode === 'compare') {
    // both stations correct, wrong sign
    let a = E.setPartition(E.startStation(), o.requestedFraction[1]);
    for (let i = 0; i < o.requestedFraction[0]; i++) a = E.placeSlice(a);
    let b = E.setPartition(E.startStation(), o.compareWith[1]);
    for (let i = 0; i < o.compareWith[0]; i++) b = E.placeSlice(b);
    const expected = E.expectedSign(o);
    for (const s of ['<', '=', '>']) {
      if (s === expected) continue;
      const out = E.serveCompare(o, a, b, s);
      check(out.kind === 'sign-mismatch', `${o.id}: sign "${s}" → sign-mismatch (got ${out.kind})`);
    }
    // missing sign
    const nosign = E.serveCompare(o, a, b, null);
    check(nosign.kind === 'sign-mismatch', `${o.id}: no sign chosen → gentle prompt`);
    // undo path: return a slice then re-plate (a single-slice plate drops to
    // the gentler "empty" nudge — also correct)
    b = E.returnSlice(b);
    check(
      ['count-mismatch', 'empty'].includes(E.serveCompare(o, a, b, expected).kind),
      `${o.id}: removed slice noticed`,
    );
    b = E.placeSlice(b);
    check(E.serveCompare(o, a, b, expected).ok, `${o.id}: re-plated slice serves`);
  }
}

// ---- summary ------------------------------------------------------------------

console.log(`${checks} checks, ${failures} failure(s)`);
if (failures > 0) process.exit(1);
console.log('✔ engine simulation passed — every order serves, every nudge instructs.');
