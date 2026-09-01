#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless interaction test: simulates full playthroughs of every mission
// through the SAME engine the UI uses (no browser needed). Covers the happy
// path plus the edge cases that matter for money math: exact-budget baskets,
// one-over-budget, zero-item checkout, requirement gaps, paying exact vs
// over, canonical change breakdown, and the change-build exercise (multiple
// valid solutions must be accepted).
//
// Usage: node scripts/engine-sim.mjs   (run from the project dir)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let engine;
try {
  engine = await import('../src/app/features/market/engine.ts');
} catch (err) {
  console.error(`Cannot import engine.ts with this Node (${process.version}): ${err.message}`);
  process.exit(1);
}

const {
  addToBasket,
  removeFromBasket,
  basketTotal,
  basketCount,
  basketLines,
  requirementStatuses,
  allRequirementsMet,
  budgetState,
  canCheckout,
  payState,
  placeToken,
  takeTokenBack,
  breakdown,
  changeBuildState,
  validateCatalog,
  minimumRequirementCost,
} = engine;

const catalog = JSON.parse(readFileSync(join(root, 'public/data/products.json'), 'utf8'));
const challenges = JSON.parse(readFileSync(join(root, 'public/data/challenges.json'), 'utf8'));
const products = catalog.products;

let pass = 0;
const failures = [];

function check(label, cond, detail = '') {
  if (cond) {
    pass++;
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function eq(label, actual, expected) {
  check(label, actual === expected, `got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
}

// ---------------------------------------------------------------------------
// 1. Content validation on the real JSON
// ---------------------------------------------------------------------------
try {
  validateCatalog(catalog, challenges);
  pass++;
  console.log('✓ catalog + missions validate');
} catch (err) {
  failures.push(`validateCatalog threw: ${err.message}`);
}

// ---------------------------------------------------------------------------
// 2. Basket arithmetic
// ---------------------------------------------------------------------------
{
  let b = {};
  b = addToBasket(b, 'apple');        // 4
  b = addToBasket(b, 'apple');        // 8
  b = addToBasket(b, 'berries');      // +8 = 16
  eq('basket totals lines', basketTotal(b, products), 16);
  eq('basket count', basketCount(b), 3);
  const lines = basketLines(b, products);
  eq('line total apple', lines[0].lineTotal, 8);
  b = removeFromBasket(b, 'apple');   // 12
  eq('remove decrements', basketTotal(b, products), 12);
  b = removeFromBasket(b, 'apple');   // apple gone -> 8
  eq('remove to zero deletes key', Object.prototype.hasOwnProperty.call(b, 'apple'), false);
  b = removeFromBasket(b, 'apple');   // no-op below zero
  eq('remove below zero is no-op', basketTotal(b, products), 8);
  const capped = Array.from({ length: 12 }, () => 0).reduce((acc) => addToBasket(acc, 'berries'), {});
  eq('qty capped at 9', capped.berries, 9);
  console.log('✓ basket arithmetic');
}

// ---------------------------------------------------------------------------
// 3. Every mission: full playthrough (shop -> checkout -> pay -> change)
// ---------------------------------------------------------------------------
const byId = Object.fromEntries(products.map((p) => [p.id, p]));

for (const mission of challenges.missions) {
  const mLabel = mission.id;

  // 3a. zero-item checkout must be blocked with reason "empty"
  {
    const gate = canCheckout(mission, {}, products);
    check(`${mLabel}: empty basket cannot check out`, !gate.ok && gate.reason === 'empty');
  }

  // 3b. cheapest qualifying basket: meets requirements, within budget, exact pay, change 0
  {
    let b = {};
    for (const [cat, req] of Object.entries(mission.requirements)) {
      const cheapest = products
        .filter((p) => p.category === cat)
        .sort((x, y) => x.priceUnits - y.priceUnits)
        .slice(0, req);
      for (const p of cheapest) b = addToBasket(b, p.id);
    }
    if (basketCount(b) === 0) {
      // free mission: the cheapest *non-empty* basket is one cheapest item
      const cheapestProduct = [...products].sort((x, y) => x.priceUnits - y.priceUnits)[0];
      b = addToBasket(b, cheapestProduct.id);
    }
    const gate = canCheckout(mission, b, products);
    check(`${mLabel}: cheapest qualifying basket may check out`, gate.ok, `reason=${gate.reason}`);
    const total = basketTotal(b, products);
    check(`${mLabel}: cheapest basket within budget`, total <= mission.budget, `total=${total}`);
    if (Object.keys(mission.requirements).length > 0) {
      eq(`${mLabel}: min cost matches`, minimumRequirementCost(mission, products), total);
    }

    // pay exactly with the whole wallet
    let wallet = [...mission.wallet];
    let tray = [];
    for (const t of [...mission.wallet]) {
      wallet = placeToken(wallet, t);
      tray.push(t);
    }
    const ps = payState(total, tray);
    check(`${mLabel}: paid wallet >= total`, ps.canPay, `paid=${ps.paid} total=${total}`);
    eq(`${mLabel}: change = paid - total`, ps.change, mission.wallet.reduce((a, c) => a + c, 0) - total);

    // change-mode: canonical breakdown is a valid build; two builds are valid
    if (mission.mode === 'change') {
      const canonical = breakdown(ps.change, [...catalog.currency.coins, ...catalog.currency.notes]);
      eq(`${mLabel}: canonical breakdown sums to change`, canonical.reduce((a, c) => a + c, 0), ps.change);
      check(`${mLabel}: canonical change build accepted`, changeBuildState(ps.change, canonical).ok);
      // alternative build: all 1s (multiple valid solutions requirement)
      check(`${mLabel}: all-ones build accepted`, changeBuildState(ps.change, Array(ps.change).fill(1)).ok);
      // wrong build rejected with a delta the UI can speak aloud
      if (ps.change > 0) {
        const wrong = changeBuildState(ps.change, Array(ps.change + 1).fill(1));
        check(`${mLabel}: over-build rejected`, !wrong.ok && wrong.delta === 1);
      }
    }
  }

  // 3c. exact-budget basket passes; one-over-budget basket blocks with reason "over"
  {
    // Grow the cheapest basket to EXACTLY budget with an exact-amount filler search,
    // then step over by the cheapest addable item.
    const exact = growToExact(mission, products);
    if (exact !== null) {
      const st = budgetState(mission, exact.total);
      check(`${mLabel}: exact-budget basket flags exact`, st.exact && st.overBy === 0 && st.remaining === 0);
      check(`${mLabel}: exact-budget basket may check out`, canCheckout(mission, exact.basket, products).ok);
      // step one cheapest item over
      let over = null;
      for (const p of [...products].sort((x, y) => x.priceUnits - y.priceUnits)) {
        const b2 = addToBasket(exact.basket, p.id);
        if (b2 !== exact.basket) { over = { basket: b2, total: exact.total + p.priceUnits }; break; }
      }
      if (over) {
        const gate = canCheckout(mission, over.basket, products);
        check(`${mLabel}: over-budget checkout blocked`, !gate.ok && gate.reason === 'over', `total=${over.total} budget=${mission.budget}`);
        const st2 = budgetState(mission, over.total);
        check(`${mLabel}: overBy reported`, st2.overBy === over.total - mission.budget, `overBy=${st2.overBy}`);
      }
    } else {
      // no exact-total basket exists: grow the cheapest QUALIFYING basket past
      // budget with the cheapest addable item (requirements stay met so the
      // block reason must be "over", not "requirements")
      let b = {};
      for (const [cat, req] of Object.entries(mission.requirements)) {
        const cheapest = products
          .filter((p) => p.category === cat)
          .sort((x, y) => x.priceUnits - y.priceUnits)
          .slice(0, req);
        for (const p of cheapest) b = addToBasket(b, p.id);
      }
      let total = basketTotal(b, products);
      while (total <= mission.budget) {
        const cheapestProduct = [...products].sort((x, y) => x.priceUnits - y.priceUnits)[0];
        const nb = addToBasket(b, cheapestProduct.id);
        if (nb === b) break;
        b = nb;
        total += cheapestProduct.priceUnits;
      }
      const gate = canCheckout(mission, b, products);
      check(`${mLabel}: over-budget checkout blocked`, !gate.ok && gate.reason === 'over', `total=${total} budget=${mission.budget}`);
    }
  }

  // 3d. requirement gap blocks checkout with reason "requirements"
  {
    const gate = canCheckout(mission, { roll: 3 }, products);
    const want =
      Object.keys(mission.requirements).length === 0 ? 'ok' : 'requirements';
    check(`${mLabel}: gap basket blocked with requirements reason`, !gate.ok || want === 'ok', `reason=${gate.reason}`);
    if (want === 'requirements') {
      eq(`${mLabel}: gap reason`, gate.reason, 'requirements');
    }
    const statuses = requirementStatuses(mission, { roll: 3 }, products);
    check(`${mLabel}: statuses computed`, allRequirementsMet(statuses) === (want === 'ok'));
  }

  // 3e. wallet token mechanics: place/take-back keep multisets honest
  {
    let wallet = [...mission.wallet];
    const tray = [];
    const first = mission.wallet[0];
    wallet = placeToken(wallet, first);
    tray.push(first);
    eq(`${mLabel}: wallet shrinks after placing`, wallet.length, mission.wallet.length - 1);
    const before = wallet.length;
    wallet = placeToken(wallet, first);
    if (mission.wallet.filter((t) => t === first).length === 1) {
      eq(`${mLabel}: cannot place token wallet lacks`, wallet, null);
      wallet = [...mission.wallet];
      wallet = placeToken(wallet, first);
    } else {
      eq(`${mLabel}: second place ok`, wallet.length, before - 1);
    }
    const back = takeTokenBack(tray, first);
    eq(`${mLabel}: take-back restores`, back.length, 0);
    eq(`${mLabel}: take-back on empty tray is null`, takeTokenBack([], first), null);
  }

  console.log(`✓ mission playthrough: ${mLabel}`);
}

// ---------------------------------------------------------------------------
// 4. Breakdown table — canonical greedy for every amount 0..45
// ---------------------------------------------------------------------------
{
  const denoms = [20, 10, 5, 2, 1];
  for (let amount = 0; amount <= 45; amount++) {
    const parts = breakdown(amount, denoms);
    eq(`breakdown(${amount}) sums`, parts.reduce((a, c) => a + c, 0), amount);
    // greedy canonical system check: no part sequence beats greedy (fewest coins)
    const minCoins = minCoinsFor(amount, denoms);
    eq(`breakdown(${amount}) uses fewest coins`, parts.length, minCoins);
  }
  eq('breakdown(-3) is empty', breakdown(-3, denoms).length, 0);
  eq('breakdown(7)', breakdown(7, denoms).join('+'), '5+2');
  eq('breakdown(23)', breakdown(23, denoms).join('+'), '20+2+1');
  console.log('✓ change breakdown 0..45 canonical');
}

function minCoinsFor(amount, denoms) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const d of denoms) {
      if (d <= a && dp[a - d] + 1 < dp[a]) dp[a] = dp[a - d] + 1;
    }
  }
  return dp[amount];
}

/**
 * Find a basket that meets the requirements and totals EXACTLY the budget
 * (BFS over addable items; returns {basket, total} or null). This is the
 * "exact budget" teaching state — it must exist for at least one mission.
 */
function growToExact(mission, products) {
  const start = {};
  for (const [cat, req] of Object.entries(mission.requirements)) {
    const cheapest = products
      .filter((p) => p.category === cat)
      .sort((x, y) => x.priceUnits - y.priceUnits)
      .slice(0, req);
    for (const p of cheapest) start[p.id] = (start[p.id] ?? 0) + 1;
  }
  const startTotal = basketTotal(start, products);
  if (startTotal === mission.budget) return { basket: { ...start }, total: startTotal };
  if (startTotal > mission.budget) return null;
  const seen = new Set([`${startTotal}|${JSON.stringify(start)}`]);
  const queue = [{ basket: start, total: startTotal }];
  while (queue.length > 0) {
    const { basket, total } = queue.shift();
    for (const p of products) {
      const nb = addToBasket(basket, p.id);
      if (nb === basket) continue; // qty cap
      const nt = total + p.priceUnits;
      if (nt > mission.budget) continue;
      if (nt === mission.budget) return { basket: nb, total: nt };
      const key = `${nt}|${JSON.stringify(nb)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (queue.length < 20000) queue.push({ basket: nb, total: nt });
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 5. Pay-state edges: exact pay, under pay, over pay
// ---------------------------------------------------------------------------
{
  const exact = payState(18, [10, 5, 2, 1]);
  check('exact pay', exact.exact && exact.canPay && exact.change === 0 && exact.remaining === 0);
  const under = payState(18, [10, 5]);
  check('under pay reports remaining', !under.canPay && under.remaining === 3 && under.change === 0);
  const over = payState(18, [10, 10]);
  check('over pay reports change', over.canPay && over.change === 2 && over.remaining === 0 && !over.exact);
  const zero = payState(0, []);
  check('zero total edge', zero.canPay && zero.exact);
  console.log('✓ pay-state edges');
}

// ---------------------------------------------------------------------------
// 6. Change-build: every representation of 6 is accepted (spec: multiple ways)
// ---------------------------------------------------------------------------
{
  const reps = [
    [5, 1], [2, 2, 2], [2, 2, 1, 1], [2, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1], [5, 1], [2, 1, 1, 1, 1],
  ];
  for (const rep of reps) {
    check(`build 6 as ${rep.join('+')}`, changeBuildState(6, rep).ok);
  }
  check('build 6 wrong (7) rejected', !changeBuildState(6, [5, 2]).ok && changeBuildState(6, [5, 2]).delta === 1);
  check('build 0 with nothing is ok', changeBuildState(0, []).ok);
  console.log('✓ change-build multi-solution');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${pass} checks passed, ${failures.length} failed`);
if (failures.length > 0) {
  for (const f of failures) console.error(`✖ ${f}`);
  process.exit(1);
}
