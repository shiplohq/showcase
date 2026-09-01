// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state types for the JSON contract (spec: orders.json + dishes.json).
// Type-only module — keeps the pure engine importable by node scripts.

export type Mode = 'build' | 'compare' | 'equivalent';

/** [numerator, denominator] */
export type Fraction = [number, number];

export interface Order {
  id: string;
  dish: string;
  partitionCount: number;
  requestedFraction: Fraction;
  mode: Mode;
  compareWith?: Fraction;
  customer: string;
  explanation: string;
}

export interface ResolvedOrder extends Order {
  dishName: string;
  dishKind: DishKind;
}

export type ToppingType =
  | 'mozzarella'
  | 'basil'
  | 'strawberry'
  | 'blueberry'
  | 'dimple'
  | 'rosemary'
  | 'salt';

export interface Topping {
  type: ToppingType;
  x: number;
  y: number;
  s: number;
  r: number;
}

export type DishKind = 'round' | 'rect';

export interface DishColors {
  rim: string;
  base: string;
  cheese: string;
  leaf: string;
}

export interface Dish {
  id: string;
  name: string;
  kind: DishKind;
  menuNote: string;
  colors: DishColors;
  toppings: Topping[];
}

export interface DishData {
  dishes: Dish[];
}

export interface OrderData {
  orders: Order[];
}

export interface Recipe {
  orderId: string;
  left: Fraction;
  right: Fraction;
  dish: string;
  dishName: string;
}
