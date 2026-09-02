// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure engine for the "Creature Roundup" (word sorting) activity: word
// creatures wait in a tray; the child takes each one to the tree whose sound
// it carries. Wrong drops send the creature gently home to the tray with a
// positional hint — no punishment, no lockout.

import type { PhonicsData, WordExample } from './types';

export type SortFeedback = 'idle' | 'placed' | 'wrong' | 'done';

export interface SortCreature {
  uid: string;
  word: string;
  audio: string;
  phonemeId: string;
  position: WordExample['position'];
  /** tray = waiting; nest = placed correctly (locked). */
  status: 'tray' | 'nest';
}

export interface SortState {
  creatures: SortCreature[];
  /** phoneme ids of the target nests, in visual order. */
  nests: string[];
  feedback: SortFeedback;
  /** creature + nest the last feedback refers to. */
  lastUid?: string;
  lastNestId?: string;
  placed: number;
  mistakes: number;
  completed: boolean;
}

export const SORT_CREATURES = 8;

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Deal a mixed tray: every tree represented at least once, no duplicate words. */
export function startSort(data: PhonicsData, rng: () => number = Math.random, count: number = SORT_CREATURES): SortState {
  const all: WordExample[] = data.trees.flatMap((t) => t.examples);
  const target = Math.max(data.trees.length, Math.min(count, all.length));
  // One example per tree first (guarantees coverage), then fill randomly.
  const picked: WordExample[] = [];
  for (const t of data.trees) {
    const one = shuffle(t.examples, rng)[0];
    picked.push(one);
  }
  const rest = shuffle(
    all.filter((e) => !picked.includes(e)),
    rng,
  );
  while (picked.length < target && rest.length > 0) {
    picked.push(rest.pop() as WordExample);
  }
  const dealt = shuffle(picked, rng).slice(0, target);
  return {
    creatures: dealt.map((e, i) => ({
      uid: `c${i}-${e.word}`,
      word: e.word,
      audio: e.audio,
      phonemeId: e.phonemeId,
      position: e.position,
      status: 'tray' as const,
    })),
    nests: data.trees.map((t) => t.id),
    feedback: 'idle',
    placed: 0,
    mistakes: 0,
    completed: false,
  };
}

/** Place a creature on a nest. Correct locks it in; wrong keeps it in the
 *  tray and records the attempted nest for the hint copy. */
export function placeCreature(s: SortState, uid: string, nestId: string): SortState {
  const creature = s.creatures.find((c) => c.uid === uid);
  if (!creature || creature.status !== 'tray' || s.completed) return s;
  if (creature.phonemeId === nestId) {
    const creatures = s.creatures.map((c) => (c.uid === uid ? { ...c, status: 'nest' as const } : c));
    const placed = s.placed + 1;
    return {
      ...s,
      creatures,
      placed,
      feedback: placed >= s.creatures.length ? 'done' : 'placed',
      lastUid: uid,
      lastNestId: nestId,
      completed: placed >= s.creatures.length,
    };
  }
  return { ...s, mistakes: s.mistakes + 1, feedback: 'wrong', lastUid: uid, lastNestId: nestId };
}

/** Keyboard/drag escape: put a carried creature back without judging it. */
export function returnCreature(s: SortState, uid: string): SortState {
  return { ...s, feedback: 'idle', lastUid: uid };
}

export function trayCreatures(s: SortState): SortCreature[] {
  return s.creatures.filter((c) => c.status === 'tray');
}

export function nestCreatures(s: SortState, nestId: string): SortCreature[] {
  return s.creatures.filter((c) => c.status === 'nest' && c.phonemeId === nestId);
}

/** Hint copy for a wrong drop: names the tree tried + where to listen.
 *  Deliberately does NOT reveal the correct tree on the first miss. */
export function sortHint(s: SortState, data: PhonicsData): string {
  const creature = s.creatures.find((c) => c.uid === s.lastUid);
  const tried = data.trees.find((t) => t.id === s.lastNestId);
  if (!creature || !tried) return 'Try another tree.';
  if (s.mistakes >= 2) {
    const home = data.trees.find((t) => t.id === creature.phonemeId);
    return `“${creature.word}” lives at the “${home?.graphemes[0] ?? ''}” tree. Take it there.`;
  }
  const position =
    creature.position === 'initial' ? 'first' : creature.position === 'middle' ? 'middle' : 'last';
  return `This is the “${tried.graphemes[0]}” tree. “${creature.word}” does not live here — listen for its ${position} sound.`;
}

export function ariaStatusSort(s: SortState, data: PhonicsData): string {
  if (s.feedback === 'done') return `All creatures are home. ${s.placed} words sorted.`;
  if (s.feedback === 'placed') return `Correct. ${s.placed} of ${s.creatures.length} creatures home.`;
  if (s.feedback === 'wrong') return sortHint(s, data);
  return `${trayCreatures(s).length} creatures still waiting in the tray.`;
}

export function isSortComplete(s: SortState): boolean {
  return s.completed;
}
