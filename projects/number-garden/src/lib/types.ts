// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content types mirroring public/data/*.json — the JSON contract from the
// spec. Content state is read from JSON; it never lives in components.

export type Operation = 'count' | 'make10' | 'add' | 'subtract';

export interface Question {
  id: string;
  prompt: string;
  operation: Operation;
  target: number;
  /** count: [n] · make10: [givenPart] · add: [a, b] · subtract: [total, takeAway] */
  operands: number[];
  manipulatives: string[];
  hint: string;
  explanation: string;
  /** Number-bond shown in the Why-it-works overlay: total + two parts. */
  bond: { total: number; parts: [number, number] };
}

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  emojiFreePlant: 'apple' | 'tulip' | 'daisy' | 'sunflower';
  questions: Question[];
}

export interface Lessons {
  units: Unit[];
}

export interface RewardPlant {
  plantId: string;
  requiredStars: number;
  svgAsset: string;
  label: string;
}

export interface Rewards {
  plants: RewardPlant[];
}

/** Personal (anonymous, localStorage) state — progress + sound preference. */
export interface PersonalState {
  /** unitId → best correct count out of 10 */
  stars: Record<string, number>;
  soundOn: boolean;
}
