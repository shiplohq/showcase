// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure market logic — no Angular, no DOM. Content comes from JSON (content
// state); this file only manipulates interaction state (basket, wallet,
// cashier tray, change build). Every arithmetic rule the UI trusts lives here
// so `scripts/engine-sim.mjs` can simulate every mission headlessly.
//
// Erasable-TypeScript only (no enums/namespaces): the file is imported
// directly by Node (type stripping) in the engine simulation.

// ---------------------------------------------------------------------------
// Content types (mirror public/data/*.json — spec JSON contract)
// ---------------------------------------------------------------------------

export type CategoryId = 'fruit' | 'bakery' | 'drink' | 'snack';
export type ChallengeMode = 'budget' | 'change';

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  priceUnits: number;
  svg: string;
  nutritionTag?: string;
}

export interface Stall {
  id: string;
  name: string;
  categories: CategoryId[];
}

export interface Category {
  id: CategoryId;
  name: string;
  /** singular noun for requirement sentences ("1 more drink") */
  singular?: string;
}

export interface CurrencySpec {
  name: string;
  shortName: string;
  coins: number[];
  notes: number[];
}

export interface Catalog {
  version: number;
  currency: CurrencySpec;
  stalls: Stall[];
  categories: Category[];
  products: Product[];
}

export interface Mission {
  id: string;
  label: string;
  story: string;
  budget: number;
  /** minimum quantity per category id — empty object = free mission */
  requirements: Partial<Record<CategoryId, number>>;
  mode: ChallengeMode;
  /** tokens the shopper carries (multiset of denominations) */
  wallet: number[];
  learningGoal: string;
}

export interface Challenges {
  version: number;
  missions: Mission[];
}

// ---------------------------------------------------------------------------
// Interaction state
// ---------------------------------------------------------------------------

/** productId -> quantity in basket */
export type Basket = Record<string, number>;

export interface BasketLine {
  product: Product;
  qty: number;
  lineTotal: number;
}

export interface RequirementStatus {
  category: CategoryId;
  required: number;
  have: number;
  met: boolean;
}

export interface BudgetState {
  total: number;
  budget: number;
  remaining: number;
  overBy: number;
  exact: boolean;
}

export type PayPhase = 'paying' | 'change' | 'done';

// ---------------------------------------------------------------------------
// Basket
// ---------------------------------------------------------------------------

export function addToBasket(basket: Basket, productId: string, maxQty = 9): Basket {
  const qty = basket[productId] ?? 0;
  if (qty >= maxQty) return basket;
  return { ...basket, [productId]: qty + 1 };
}

export function removeFromBasket(basket: Basket, productId: string): Basket {
  const qty = basket[productId] ?? 0;
  if (qty <= 0) return basket;
  const next = { ...basket };
  if (qty === 1) delete next[productId];
  else next[productId] = qty - 1;
  return next;
}

export function basketLines(basket: Basket, products: Product[]): BasketLine[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: BasketLine[] = [];
  for (const [id, qty] of Object.entries(basket)) {
    const product = byId.get(id);
    if (!product || qty <= 0) continue;
    lines.push({ product, qty, lineTotal: product.priceUnits * qty });
  }
  // stable order: catalog order, not insertion order
  lines.sort((a, b) => products.indexOf(a.product) - products.indexOf(b.product));
  return lines;
}

export function basketCount(basket: Basket): number {
  return Object.values(basket).reduce((sum, q) => sum + q, 0);
}

export function basketTotal(basket: Basket, products: Product[]): number {
  return basketLines(basket, products).reduce((sum, l) => sum + l.lineTotal, 0);
}

// ---------------------------------------------------------------------------
// Requirements & budget
// ---------------------------------------------------------------------------

export function requirementStatuses(
  mission: Mission,
  basket: Basket,
  products: Product[],
): RequirementStatus[] {
  const count = (category: CategoryId) =>
    products.reduce(
      (sum, p) => (p.category === category ? sum + (basket[p.id] ?? 0) : sum),
      0,
    );
  return (Object.keys(mission.requirements) as CategoryId[]).map((category) => {
    const required = mission.requirements[category] ?? 0;
    const have = count(category);
    return { category, required, have, met: have >= required };
  });
}

export function allRequirementsMet(statuses: RequirementStatus[]): boolean {
  return statuses.every((s) => s.met);
}

export function budgetState(mission: Mission, total: number): BudgetState {
  return {
    total,
    budget: mission.budget,
    remaining: Math.max(0, mission.budget - total),
    overBy: Math.max(0, total - mission.budget),
    exact: total === mission.budget && total > 0,
  };
}

/** Checkout gate: requirements met, basket not empty, not over budget. */
export function canCheckout(mission: Mission, basket: Basket, products: Product[]): {
  ok: boolean;
  reason: 'empty' | 'requirements' | 'over' | 'ok';
} {
  const total = basketTotal(basket, products);
  if (basketCount(basket) === 0) return { ok: false, reason: 'empty' };
  if (!allRequirementsMet(requirementStatuses(mission, basket, products))) {
    return { ok: false, reason: 'requirements' };
  }
  if (total > mission.budget) return { ok: false, reason: 'over' };
  return { ok: true, reason: 'ok' };
}

// ---------------------------------------------------------------------------
// Money — pay & change (fictional tokens; integers only)
// ---------------------------------------------------------------------------

export interface PayState {
  total: number;
  paid: number;
  remaining: number;
  over: number;
  exact: boolean;
  change: number;
  canPay: boolean;
}

/**
 * Cashier tray state. `tray` is the multiset of wallet tokens placed by the
 * learner; `walletLeft` is what is still in the wallet.
 */
export function payState(total: number, tray: number[]): PayState {
  const paid = sum(tray);
  const over = Math.max(0, paid - total);
  const exact = paid === total;
  return {
    total,
    paid,
    remaining: Math.max(0, total - paid),
    over,
    exact,
    change: over,
    canPay: paid >= total,
  };
}

/** Move a wallet token into the tray (returns null when the wallet lacks it). */
export function placeToken(walletLeft: number[], denomination: number): number[] | null {
  const idx = walletLeft.indexOf(denomination);
  if (idx === -1) return null;
  return walletLeft.toSpliced(idx, 1);
}

/** Take a token back out of the tray (last-placed first). */
export function takeTokenBack(tray: number[], denomination: number): number[] | null {
  const idx = tray.lastIndexOf(denomination);
  if (idx === -1) return null;
  return tray.toSpliced(idx, 1);
}

/** Canonical (greedy) breakdown of an amount into denominations, big first. */
export function breakdown(amount: number, denominations: number[] = [20, 10, 5, 2, 1]): number[] {
  if (!Number.isInteger(amount) || amount < 0) return [];
  const out: number[] = [];
  let left = amount;
  for (const d of [...denominations].sort((a, b) => b - a)) {
    while (left >= d) {
      out.push(d);
      left -= d;
    }
  }
  return out;
}

export interface ChangeBuildState {
  target: number;
  built: number;
  ok: boolean;
  delta: number;
}

/** Change-build exercise (change mode): any combination summing to target counts. */
export function changeBuildState(target: number, builtTokens: number[]): ChangeBuildState {
  const built = sum(builtTokens);
  return { target, built, ok: built === target, delta: built - target };
}

// ---------------------------------------------------------------------------
// Dev-time content validation (called on load; failures degrade, never white-screen)
// ---------------------------------------------------------------------------

export class CatalogError extends Error {}

export function validateCatalog(catalog: Catalog, challenges: Challenges): void {
  const problems: string[] = [];
  if (!Array.isArray(catalog.products) || catalog.products.length === 0) {
    problems.push('products.json: no products');
  }
  const ids = new Set<string>();
  const categoryIds = new Set(catalog.categories?.map((c) => c.id) ?? []);
  for (const p of catalog.products ?? []) {
    if (!p.id) problems.push(`product without id: ${JSON.stringify(p.name ?? p)}`);
    if (ids.has(p.id)) problems.push(`duplicate product id: ${p.id}`);
    ids.add(p.id);
    if (!Number.isInteger(p.priceUnits) || p.priceUnits <= 0) {
      problems.push(`product ${p.id}: priceUnits must be a positive integer`);
    }
    if (!categoryIds.has(p.category)) {
      problems.push(`product ${p.id}: unknown category ${p.category}`);
    }
    if (!p.svg) problems.push(`product ${p.id}: missing svg art key`);
  }
  const coins = catalog.currency?.coins ?? [];
  if (!coins.includes(1)) problems.push('currency: coins must include a 1-unit coin');
  const missionIds = new Set<string>();
  for (const m of challenges.missions ?? []) {
    if (!m.id) problems.push('mission without id');
    if (missionIds.has(m.id)) problems.push(`duplicate mission id: ${m.id}`);
    missionIds.add(m.id);
    if (!Number.isInteger(m.budget) || m.budget <= 0) {
      problems.push(`mission ${m.id}: budget must be a positive integer`);
    }
    if (!Array.isArray(m.wallet) || m.wallet.length === 0) {
      problems.push(`mission ${m.id}: wallet must list tokens`);
    }
    const walletSum = sum(m.wallet ?? []);
    if (walletSum < m.budget) {
      problems.push(
        `mission ${m.id}: wallet ${walletSum} cannot cover budget ${m.budget}`,
      );
    }
    for (const [cat, req] of Object.entries(m.requirements ?? {})) {
      if (!categoryIds.has(cat as CategoryId)) {
        problems.push(`mission ${m.id}: unknown requirement category ${cat}`);
      }
      if (!Number.isInteger(req) || req < 0) {
        problems.push(`mission ${m.id}: requirement ${cat} must be a non-negative integer`);
      }
    }
    // feasibility: the minimum-cost basket that meets requirements fits budget
    const minCost = minimumRequirementCost(m, catalog.products);
    if (minCost === null) {
      problems.push(`mission ${m.id}: requirements cannot be met by the catalog`);
    } else if (minCost > m.budget) {
      problems.push(
        `mission ${m.id}: cheapest qualifying basket costs ${minCost} > budget ${m.budget}`,
      );
    }
  }
  if (problems.length > 0) {
    throw new CatalogError(`Invalid market content:\n- ${problems.join('\n- ')}`);
  }
}

/** Cheapest basket that satisfies the mission requirements (null = impossible). */
export function minimumRequirementCost(mission: Mission, products: Product[]): number | null {
  let total = 0;
  for (const [cat, req] of Object.entries(mission.requirements)) {
    const prices = products
      .filter((p) => p.category === cat)
      .map((p) => p.priceUnits)
      .sort((a, b) => a - b);
    const need = req ?? 0;
    if (prices.length < need) return null;
    for (let i = 0; i < need; i++) total += prices[i];
  }
  return total;
}

// ---------------------------------------------------------------------------

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
