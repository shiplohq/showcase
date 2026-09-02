// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure label-match logic — no Vue, no DOM. Word labels sit in the tray; the
// child places one on an object (drag, or pick-and-place for touch/keyboard).
// A correct label becomes a permanent annotation on the scene; a wrong one
// drifts back to the tray with a friendly note. Distractor-free tray by
// design (kindness: every chip has a true home).

import type { Feedback, UnitData } from '../../lib/types';
import { seededShuffle } from '../../lib/rng.ts';

export interface MatchState {
  /** Item ids that must receive a label this round. */
  targets: string[];
  /** Label item ids still in the tray (deterministic order). */
  tray: string[];
  /** itemId → label item id already pinned correctly. */
  placed: Record<string, string>;
  /** Label currently "in hand" (picked up but not placed) — keyboard/touch path. */
  holding: string | null;
  feedback: Feedback;
  /** Item id whose label just pinned (celebration target). */
  justPlacedId: string | null;
  /** Item id of the last wrong placement (gentle tilt target). */
  lastMissId: string | null;
  /** labelId → wrong drop count; ≥2 while held → warm glow on its object. */
  wrongDrops: Record<string, number>;
  done: boolean;
}

export function startMatch(unit: UnitData): MatchState {
  return {
    targets: [...unit.labelItems],
    tray: seededShuffle(unit.labelItems, `${unit.id}:labels`),
    placed: {},
    holding: null,
    feedback: 'idle',
    justPlacedId: null,
    lastMissId: null,
    wrongDrops: {},
    done: false,
  };
}

/** Pick a word chip up (tap/Enter on chip). Picking another swaps. */
export function pickUp(s: MatchState, labelId: string): MatchState {
  if (s.done || s.placed[labelId]) return s;
  return { ...s, holding: labelId, feedback: 'idle', lastMissId: null };
}

/** Put the held chip back (Esc / tap the tray). */
export function putDown(s: MatchState): MatchState {
  return { ...s, holding: null, feedback: 'idle' };
}

export function isLabelFor(unit: UnitData, labelId: string, itemId: string): boolean {
  return labelId === itemId && unit.items.some((i) => i.id === itemId);
}

/**
 * Place the held label on an object. Correct → pinned annotation (stays on the
 * scene, leaves the tray). Wrong → chip returns to the tray, gentle note.
 */
export function placeLabel(unit: UnitData, s: MatchState, itemId: string): MatchState {
  if (s.done || !s.holding) return s;
  if (isLabelFor(unit, s.holding, itemId)) {
    const placed = { ...s.placed, [itemId]: s.holding };
    return {
      ...s,
      placed,
      tray: s.tray.filter((t) => t !== s.holding),
      holding: null,
      feedback: 'correct',
      justPlacedId: itemId,
      lastMissId: null,
      done: Object.keys(placed).length >= s.targets.length,
    };
  }
  return {
    ...s,
    holding: null,
    tray: s.tray.includes(s.holding) ? s.tray : [...s.tray, s.holding],
    feedback: 'nudge',
    justPlacedId: null,
    lastMissId: itemId,
    wrongDrops: { ...s.wrongDrops, [s.holding]: (s.wrongDrops[s.holding] ?? 0) + 1 },
  };
}

/** After two wrong drops of the same word, the child holding it again gets a
 *  warm glow on the correct object — help, never punishment (§3.5). */
export function shouldGlowMatchTarget(s: MatchState): boolean {
  return Boolean(s.holding && (s.wrongDrops[s.holding] ?? 0) >= 2);
}

export function matchNudgeCopy(s: MatchState): string {
  if (s.holding && (s.wrongDrops[s.holding] ?? 0) >= 2) {
    return 'Here is a warm light on its picture. Look closely!';
  }
  return 'That word lives somewhere else. Look at the picture and try again!';
}

/** Direct drag path: a specific label onto a specific object, same rules. */
export function dropLabel(unit: UnitData, s: MatchState, labelId: string, itemId: string): MatchState {
  return placeLabel(unit, { ...s, holding: labelId }, itemId);
}

export function clearFeedback(s: MatchState): MatchState {
  return { ...s, feedback: 'idle', justPlacedId: null, lastMissId: null };
}

export function matchAriaStatus(unit: UnitData, s: MatchState): string {
  if (s.feedback === 'correct') {
    const it = unit.items.find((i) => i.id === s.justPlacedId);
    return it ? `Yes! The word ${it.word} is pinned on the picture. ${Object.keys(s.placed).length} of ${s.targets.length} labels placed.` : 'Label placed.';
  }
  if (s.feedback === 'nudge') return 'That word lives somewhere else. Look at the picture and try again!';
  if (s.holding) {
    const held = unit.items.find((i) => i.id === s.holding);
    return held ? `Holding the word ${held.word}. Choose the object it names.` : 'Holding a word.';
  }
  return `${Object.keys(s.placed).length} of ${s.targets.length} labels placed.`;
}
