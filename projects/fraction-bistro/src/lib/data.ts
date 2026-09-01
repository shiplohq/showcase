// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state loader: fetches local JSON from the static bundle, validates
// shape (always — it is cheap), degrades to a clear message instead of a
// white screen (spec). No cross-origin fetches, no API.

import type { Dish, DishData, Fraction, Mode, Order, OrderData, ResolvedOrder, ToppingType } from './types';
import { PARTITIONS } from '../features/cut/engine';

export class ContentError extends Error {}

const MODES: Mode[] = ['build', 'compare', 'equivalent'];
const TOPPINGS: ToppingType[] = [
  'mozzarella',
  'basil',
  'strawberry',
  'blueberry',
  'dimple',
  'rosemary',
  'salt',
];

async function fetchJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ContentError(`Could not load the bistro data (${url}).`);
  }
  if (!res.ok) throw new ContentError(`The bistro data returned ${res.status} (${url}).`);
  try {
    return await res.json();
  } catch {
    throw new ContentError(`The bistro data is not valid JSON (${url}).`);
  }
}

function isFraction(v: unknown): v is Fraction {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    v.every((n) => typeof n === 'number' && Number.isInteger(n)) &&
    v[0] >= 1 &&
    v[1] >= 2 &&
    v[0] <= v[1] &&
    PARTITIONS.includes(v[1])
  );
}

function validateDish(raw: unknown, index: number): Dish {
  const where = `dish #${index}`;
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: not an object.`);
  const d = raw as Record<string, unknown>;
  if (typeof d.id !== 'string' || !d.id) throw new ContentError(`${where}: missing id.`);
  if (typeof d.name !== 'string' || !d.name) throw new ContentError(`${where}: missing name.`);
  if (d.kind !== 'round' && d.kind !== 'rect') throw new ContentError(`${where}: kind must be round or rect.`);
  const colors = d.colors as Record<string, unknown> | undefined;
  if (!colors || ['rim', 'base', 'cheese', 'leaf'].some((k) => typeof colors[k] !== 'string')) {
    throw new ContentError(`${where}: incomplete color tokens.`);
  }
  if (!Array.isArray(d.toppings)) throw new ContentError(`${where}: missing toppings.`);
  d.toppings.forEach((t, i) => {
    const top = t as Record<string, unknown>;
    if (!TOPPINGS.includes(top.type as ToppingType)) {
      throw new ContentError(`${where} topping ${i}: unknown type "${String(top.type)}".`);
    }
    if (typeof top.x !== 'number' || typeof top.y !== 'number') {
      throw new ContentError(`${where} topping ${i}: x/y must be numbers.`);
    }
  });
  return {
    id: d.id,
    name: d.name,
    kind: d.kind,
    menuNote: String(d.menuNote ?? ''),
    colors: {
      rim: String(colors.rim),
      base: String(colors.base),
      cheese: String(colors.cheese),
      leaf: String(colors.leaf),
    },
    toppings: (d.toppings as Record<string, unknown>[]).map((t) => ({
      type: t.type as ToppingType,
      x: t.x as number,
      y: t.y as number,
      s: typeof t.s === 'number' ? t.s : 1,
      r: typeof t.r === 'number' ? t.r : 0,
    })),
  };
}

function validateOrder(raw: unknown, index: number): Order {
  const where = `order #${index}`;
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: not an object.`);
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || !/^ord-\d+$/.test(o.id)) {
    throw new ContentError(`${where}: id must look like "ord-014".`);
  }
  if (typeof o.dish !== 'string' || !o.dish) throw new ContentError(`${where}: missing dish.`);
  if (!PARTITIONS.includes(o.partitionCount as number)) {
    throw new ContentError(`${where}: partitionCount must be one of 2/3/4/6/8.`);
  }
  if (!isFraction(o.requestedFraction)) {
    throw new ContentError(`${where}: requestedFraction must be [n, d] with d in 2/3/4/6/8.`);
  }
  if (!MODES.includes(o.mode as Mode)) throw new ContentError(`${where}: mode must be build/compare/equivalent.`);
  if ((o.mode === 'compare' || o.mode === 'equivalent') && !isFraction(o.compareWith)) {
    throw new ContentError(`${where}: ${o.mode} orders need a valid compareWith fraction.`);
  }
  if (typeof o.customer !== 'string' || !o.customer) throw new ContentError(`${where}: missing customer line.`);
  if (typeof o.explanation !== 'string' || !o.explanation) throw new ContentError(`${where}: missing explanation.`);
  const den = (o.requestedFraction as Fraction)[1];
  if (o.mode === 'build' && den !== o.partitionCount) {
    throw new ContentError(`${where}: build orders need requestedFraction denominator == partitionCount.`);
  }
  if (o.mode === 'equivalent' && (o.compareWith as Fraction)[1] !== o.partitionCount) {
    throw new ContentError(`${where}: equivalent orders need compareWith denominator == partitionCount.`);
  }
  return {
    id: o.id,
    dish: o.dish,
    partitionCount: o.partitionCount as number,
    requestedFraction: o.requestedFraction as Fraction,
    mode: o.mode as Mode,
    compareWith: isFraction(o.compareWith) ? (o.compareWith as Fraction) : undefined,
    customer: o.customer,
    explanation: o.explanation,
  };
}

export interface BistroData {
  dishes: Dish[];
  orders: ResolvedOrder[];
}

export async function loadBistro(base: string): Promise<BistroData> {
  // NOTE: plain string concat, never `new URL(p, './')` — a relative base is
  // not a valid URL and throws (pilot #01 lesson).
  const [dishesRaw, ordersRaw] = await Promise.all([
    fetchJson(`${base}data/dishes.json`),
    fetchJson(`${base}data/orders.json`),
  ]);

  const dishesData = dishesRaw as DishData;
  if (!Array.isArray(dishesData?.dishes) || dishesData.dishes.length === 0) {
    throw new ContentError('dishes.json has no dishes.');
  }
  const ordersData = ordersRaw as OrderData;
  if (!Array.isArray(ordersData?.orders) || ordersData.orders.length === 0) {
    throw new ContentError('orders.json has no orders.');
  }

  const dishes = dishesData.dishes.map(validateDish);
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const orders = ordersData.orders.map(validateOrder).map((o, i) => {
    const dish = byId.get(o.dish);
    if (!dish) throw new ContentError(`order #${i}: unknown dish "${o.dish}".`);
    return { ...o, dishName: dish.name, dishKind: dish.kind };
  });

  const ids = new Set<string>();
  for (const o of orders) {
    if (ids.has(o.id)) throw new ContentError(`duplicate order id "${o.id}".`);
    ids.add(o.id);
  }
  return { dishes, orders };
}
