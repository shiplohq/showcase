// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure clue-hunt logic — no Vue, no DOM. The child reads a clue, taps an
// object in the scene; correct → the word is found, wrong → gentle nudge and,
// after two misses, the target region glows (help, never punishment).

import type { ItemData, UnitData } from '../../lib/types';
import type { Feedback } from '../../lib/types';

export interface ClueState {
  /** The clue item ids, in hunt order. */
  order: string[];
  /** Index of the current clue (0-based). */
  current: number;
  /** Words found so far in this hunt. */
  found: string[];
  /** Wrong taps on the current clue. */
  misses: number;
  feedback: Feedback;
  /** Item id just found (for the celebration + plate pop). */
  justFoundId: string | null;
  /** Item id of the last wrong tap (for the gentle tilt). */
  lastMissId: string | null;
  done: boolean;
}

export function startClues(unit: UnitData): ClueState {
  return {
    order: [...unit.clueItems],
    current: 0,
    found: [],
    misses: 0,
    feedback: 'idle',
    justFoundId: null,
    lastMissId: null,
    done: false,
  };
}

export function clueItem(unit: UnitData, s: ClueState): ItemData {
  const id = s.order[s.current];
  const item = unit.items.find((i) => i.id === id);
  if (!item) throw new Error(`clue item "${id}" missing from unit "${unit.id}"`);
  return item;
}

/** Answer by tapping an object. Never locks; misses only grow the hint. */
export function answerClue(s: ClueState, itemId: string): ClueState {
  if (s.done || s.feedback === 'correct') return s;
  const target = s.order[s.current];
  if (itemId === target) {
    return {
      ...s,
      found: s.found.includes(target) ? s.found : [...s.found, target],
      feedback: 'correct',
      justFoundId: target,
      lastMissId: null,
      misses: 0,
    };
  }
  return {
    ...s,
    feedback: 'nudge',
    misses: s.misses + 1,
    justFoundId: null,
    lastMissId: itemId,
  };
}

/** Move on from a found clue (child presses "Next clue" / auto-advance). */
export function advanceClue(s: ClueState): ClueState {
  if (s.feedback !== 'correct') return s;
  const next = s.current + 1;
  if (next >= s.order.length) {
    return { ...s, feedback: 'idle', done: true, justFoundId: s.justFoundId, current: s.order.length - 1 };
  }
  return { ...s, feedback: 'idle', current: next, misses: 0, justFoundId: null, lastMissId: null };
}

/** After 2 misses the target region glows — help, not punishment. */
export function shouldGlowHint(s: ClueState): boolean {
  return s.misses >= 2 && !s.done && s.feedback !== 'correct';
}

export function clueCountText(s: ClueState): string {
  return `${Math.min(s.current + 1, s.order.length)} of ${s.order.length}`;
}

/** Screen-reader status — always names the word (language reinforcement). */
export function clueAriaStatus(unit: UnitData, s: ClueState): string {
  if (s.feedback === 'correct') {
    const it = unit.items.find((i) => i.id === s.justFoundId);
    return it ? `Great find! ${it.word} — ${it.translation}.` : 'Great find!';
  }
  if (s.feedback === 'nudge') return 'Look again! Listen to the clue once more.';
  return `Clue ${clueCountText(s)}.`;
}

/** Resolve the nudge copy near the problem (skill: error feedback near the problem). */
export function nudgeCopy(s: ClueState): string {
  if (s.misses >= 2) return 'Here is a warm light on it. Look closely!';
  if (s.misses === 1) return 'Look again — what is warm, cold or soft?';
  return 'Look again! Listen to the clue once more.';
}
