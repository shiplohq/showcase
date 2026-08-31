// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure interaction logic for the play loop — no React, no DOM. Content comes
// from JSON (content state); this file only manipulates interaction state.

import type { Question, Unit } from '../../lib/types';

export type PlotId = 'a' | 'b';

export interface RunState {
  unit: Unit;
  /** Index of the current question (0-based). */
  index: number;
  /** Seeds planted in plot A / basket B. */
  a: number;
  b: number;
  /** Seeds still in the bag (available to plant). */
  bag: number;
  /** Correct answers so far (0..10). */
  correct: number;
  feedback: 'idle' | 'correct' | 'nudge';
  /** Bumped whenever a correct answer should trigger the grow animation. */
  growKey: number;
}

/** Initialize the runtime for a question (by index) of a unit. */
export function questionState(unit: Unit, index: number, carry: { correct: number }): RunState {
  const q = unit.questions[index];
  let a = 0;
  let b = 0;
  let bag = 0;
  switch (q.operation) {
    case 'count':
      bag = q.operands[0];
      break;
    case 'make10':
      a = q.operands[0]; // pre-filled, locked
      bag = q.target - q.operands[0];
      break;
    case 'add':
      bag = q.operands[0] + q.operands[1];
      break;
    case 'subtract':
      a = q.operands[0]; // full bed; child removes to basket
      bag = 0;
      break;
  }
  return {
    unit,
    index,
    a,
    b,
    bag,
    correct: carry.correct,
    feedback: 'idle',
    growKey: 0,
  };
}

export function startRun(unit: Unit): RunState {
  return questionState(unit, 0, { correct: 0 });
}

export function currentQuestion(s: RunState): Question {
  return s.unit.questions[s.index];
}

/** May the child plant a seed from the bag into this plot right now? */
export function canPlant(s: RunState, plot: PlotId): boolean {
  if (s.feedback === 'correct') return false;
  const q = currentQuestion(s);
  if (s.bag <= 0) return false;
  if (q.operation === 'subtract') return false; // bag starts empty; only removal
  if (q.operation === 'make10' && plot === 'a') return false; // A locked
  return true;
}

/** May the child remove a seed from this plot (tap or drag out)? */
export function canRemove(s: RunState, plot: PlotId): boolean {
  if (s.feedback === 'correct') return false;
  const q = currentQuestion(s);
  if (plot === 'a' && s.a <= 0) return false;
  if (plot === 'b' && s.b <= 0) return false;
  if (q.operation === 'make10' && plot === 'a') return false; // locked part
  if (q.operation === 'count' && plot === 'a') return true; // reversible
  return true;
}

export type MutateResult =
  | { kind: 'planted'; plot: PlotId; count: number }
  | { kind: 'removed'; plot: PlotId; to: 'bag' | 'basket'; count: number }
  | { kind: 'blocked' };

export function plantSeed(s: RunState, plot: PlotId): RunState {
  if (!canPlant(s, plot)) return s;
  return {
    ...s,
    bag: s.bag - 1,
    a: plot === 'a' ? s.a + 1 : s.a,
    b: plot === 'b' ? s.b + 1 : s.b,
    feedback: 'idle',
  };
}

export function removeSeed(s: RunState, plot: PlotId): RunState {
  if (!canRemove(s, plot)) return s;
  const q = currentQuestion(s);
  // subtract keeps both parts visible: bed ↔ basket (part–whole).
  if (q.operation === 'subtract' && plot === 'a') {
    return { ...s, a: s.a - 1, b: s.b + 1, feedback: 'idle' }; // bed → basket
  }
  if (q.operation === 'subtract' && plot === 'b') {
    return { ...s, a: s.a + 1, b: s.b - 1, feedback: 'idle' }; // basket → bed (undo)
  }
  // everywhere else a removed seed returns to the bag — always reversible.
  return {
    ...s,
    a: plot === 'a' ? s.a - 1 : s.a,
    b: plot === 'b' ? s.b - 1 : s.b,
    bag: s.bag + 1,
    feedback: 'idle',
  };
}

/** Is the current arrangement the intended answer? */
export function isCorrect(s: RunState): boolean {
  const q = currentQuestion(s);
  switch (q.operation) {
    case 'count':
      return s.a === q.target;
    case 'make10':
      return s.a + s.b === q.target;
    case 'add':
      return s.a === q.operands[0] && s.b === q.operands[1];
    case 'subtract':
      return s.b === q.operands[1]; // basket holds exactly the take-away
  }
}

export function submit(s: RunState): RunState {
  if (s.feedback === 'correct') return s;
  return isCorrect(s)
    ? { ...s, correct: s.correct + 1, feedback: 'correct', growKey: s.growKey + 1 }
    : { ...s, feedback: 'nudge' };
}

/** Whether the Why-it-works bond should show after this (correct) question. */
export function shouldShowWhy(s: RunState): boolean {
  return (s.index + 1) % 3 === 0 && s.index < s.unit.questions.length - 1;
}

export function isLastQuestion(s: RunState): boolean {
  return s.index >= s.unit.questions.length - 1;
}

/** Deterministic organic seed position (percent of plot box), rows centered
 *  against the FINAL total so growing a row expands symmetrically (FLIP). */
export function seedPosition(i: number, total?: number): { x: number; y: number } {
  const perRow = 4;
  const count = total ?? i + 1;
  const row = Math.floor(i / perRow);
  const col = i % perRow;
  const rowLen = Math.max(1, Math.min(perRow, count - row * perRow));
  // jitter is stable per index (hash-free): pseudo-organic offsets
  const jx = (((i * 37) % 7) - 3) * 0.8;
  const jy = (((i * 53) % 5) - 2) * 0.9;
  const x = 50 + (col - (rowLen - 1) / 2) * 21 + jx;
  const y = 68 - row * 27 + jy;
  return { x: Math.min(88, Math.max(12, x)), y: Math.min(88, Math.max(14, y)) };
}

/** Fill {n}/{a}/{b}/{c}/{t}/{r} placeholders in prompt/hint/explanation. */
export function template(text: string, q: Question): string {
  const sum = q.operands[0] + q.operands[1];
  const map: Record<string, number> = {
    n: q.target,
    a: q.operation === 'subtract' ? q.operands[1] : q.operands[0],
    b: q.operation === 'make10' ? q.target - q.operands[0] : q.operands[1],
    c: q.operands[0],
    t: sum,
    r: q.operands[0] - q.operands[1],
  };
  return text.replace(/\{([nabctr])\}/g, (_, k: string) => String(map[k] ?? ''));
}

/** Live status line for screen readers — the text alternative of the scene. */
export function ariaStatus(s: RunState): string {
  const q = currentQuestion(s);
  const base = template(q.prompt, q);
  const basket = q.operation === 'subtract' ? ` Giỏ có ${s.b} hạt.` : '';
  return `Ô đất A có ${s.a} hạt.${q.operation !== 'count' ? ` Ô B có ${s.b} hạt.` : ''} Túi còn ${s.bag} hạt.${basket} Câu ${s.index + 1} trên ${s.unit.questions.length}. ${base}`;
}
