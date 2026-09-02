// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure engine for the "Listen & pick" clearing activity: hear a word, pick
// the grapheme (grapheme rounds) or pick the word you heard (minimal-pair
// rounds). Six rounds per tree; a firefly lights every 2 correct rounds;
// wrong answers nudge then hint — never punish, never lock.

import type { PhonicsData, PhonemeTree, WordExample } from './types';

export type ListenFeedback = 'idle' | 'correct' | 'nudge' | 'hint' | 'done';

export interface ListenOption {
  id: string;
  /** What the child sees on the leaf: a grapheme ("sh") or a word ("ship"). */
  label: string;
  /** IPA caption under a grapheme option. */
  ipa?: string;
  correct: boolean;
}

export interface ListenRound {
  kind: 'grapheme' | 'pair';
  /** Text spoken for the round (audio URI is speech:<audioText>). */
  audioText: string;
  /** Prompt copy, resolved (no placeholders left). */
  prompt: string;
  /** Word whose sounds are in question. */
  focusWord: string;
  options: ListenOption[];
  /** Minimal-pair rounds hide option text until revealed (or answered). */
  hideText: boolean;
  /** Copy explaining the answer after the fact. */
  explanation: string;
}

export interface ListenState {
  treeId: string;
  rounds: ListenRound[];
  index: number;
  attempts: number;
  feedback: ListenFeedback;
  fireflies: number;
  correctCount: number;
  revealed: boolean;
  lastPicked?: string;
}

/** Deterministic RNG (mulberry32) so engine-sim replays are reproducible. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const ROUNDS_PER_TREE = 6;

function positionWord(position: WordExample['position']): string {
  if (position === 'initial') return 'first';
  if (position === 'middle') return 'middle';
  return 'last';
}

/** Prompt copy for a round — short, Pre-A1-friendly, always present. */
export function graphemePrompt(example: WordExample): string {
  return `Listen. Which letters make the ${positionWord(example.position)} sound in “${example.word}”?`;
}

export function pairPrompt(): string {
  return 'Listen very carefully. Which word did you hear?';
}

function graphemeOptions(tree: PhonemeTree, all: PhonemeTree[], rng: () => number): ListenOption[] {
  const others = shuffle(all.filter((t) => t.id !== tree.id), rng).slice(0, 2);
  return shuffle(
    [
      { id: `g:${tree.id}`, label: tree.graphemes[0], ipa: tree.phoneme, correct: true },
      ...others.map((t) => ({ id: `g:${t.id}`, label: t.graphemes[0], ipa: t.phoneme, correct: false })),
    ],
    rng,
  );
}

interface PairSide {
  /** The word the audio plays (the correct choice). */
  heard: string;
  other: string;
  /** true when the heard word is the tree's *other* member (discrimination). */
  flipped: boolean;
}

function pairRound(side: PairSide, extra: WordExample, tree: PhonemeTree, rng: () => number): ListenRound {
  const options = shuffle(
    [
      { id: `w:${side.heard}`, label: side.heard, correct: true },
      { id: `w:${side.other}`, label: side.other, correct: false },
      { id: `w:${extra.word}`, label: extra.word, correct: false },
    ],
    rng,
  );
  const explanation = side.flipped
    ? `You heard “${side.heard}” — not “${side.other}”. Close sounds!`
    : `You heard “${side.heard}” — it has the ${tree.graphemes[0]} sound.`;
  return {
    kind: 'pair',
    audioText: side.heard,
    prompt: pairPrompt(),
    focusWord: side.heard,
    options,
    hideText: true,
    explanation,
  };
}

/** Build the 6-round session for a tree: grapheme, grapheme, pair, grapheme, pair, grapheme. */
export function startListen(data: PhonicsData, treeId: string, rng: () => number = Math.random): ListenState {
  const tree = data.trees.find((t) => t.id === treeId);
  if (!tree) throw new Error(`unknown tree ${treeId}`);
  const examples = shuffle(tree.examples, rng);
  const pairs = shuffle(tree.minimalPairs, rng);
  const graphemes = graphemeOptions(tree, data.trees, rng);
  // Alternate which side of each pair gets heard across the two pair rounds.
  const side0: PairSide = { heard: pairs[0].answer, other: pairs[0].distractor, flipped: false };
  const side1: PairSide = pairs[1]
    ? { heard: pairs[1].distractor, other: pairs[1].answer, flipped: true }
    : { heard: pairs[0].distractor, other: pairs[0].answer, flipped: true };

  const g = (ex: WordExample): ListenRound => ({
    kind: 'grapheme',
    audioText: ex.word,
    prompt: graphemePrompt(ex),
    focusWord: ex.word,
    options: graphemes,
    hideText: false,
    explanation: `Yes! “${ex.word}” has the ${tree.graphemes[0]} sound.`,
  });

  const rounds: ListenRound[] = [
    g(examples[0]),
    g(examples[1]),
    pairRound(side0, examples[2], tree, rng),
    g(examples[2]),
    pairRound(side1, examples[3], tree, rng),
    g(examples[3]),
  ];
  return {
    treeId,
    rounds,
    index: 0,
    attempts: 0,
    feedback: 'idle',
    fireflies: 0,
    correctCount: 0,
    revealed: false,
  };
}

export function currentRound(s: ListenState): ListenRound {
  return s.rounds[Math.min(s.index, s.rounds.length - 1)];
}

/** Answer a round. Correct celebrates (advance is a separate step);
 *  wrong produces a nudge, then a hint on the second miss. Never terminal. */
export function answer(s: ListenState, optionId: string): ListenState {
  const round = currentRound(s);
  const picked = round.options.find((o) => o.id === optionId);
  if (!picked) return s;
  if (picked.correct) {
    return {
      ...s,
      attempts: 0,
      feedback: 'correct',
      lastPicked: optionId,
      revealed: true,
      correctCount: s.correctCount + 1,
    };
  }
  const attempts = s.attempts + 1;
  return {
    ...s,
    attempts,
    feedback: attempts === 1 ? 'nudge' : 'hint',
    lastPicked: optionId,
    revealed: attempts >= 2,
  };
}

/** Firefly cadence: one lights every 2 correct rounds (roundsDone is 1-based count). */
export function firefliesAfter(roundsDone: number): number {
  return Math.min(3, Math.floor(roundsDone / 2));
}

/** Move on after a correct answer. Completing round 6 marks the tree done. */
export function advance(s: ListenState): ListenState {
  const nextIndex = s.index + 1;
  const done = nextIndex >= s.rounds.length;
  return {
    ...s,
    index: done ? s.index : nextIndex,
    attempts: 0,
    feedback: done ? 'done' : 'idle',
    fireflies: firefliesAfter(Math.min(nextIndex, s.rounds.length)),
    revealed: done ? true : false,
    lastPicked: undefined,
  };
}

export function isRoundComplete(s: ListenState): boolean {
  return s.feedback === 'correct' || s.feedback === 'done';
}

export function isTreeDone(s: ListenState): boolean {
  return s.feedback === 'done';
}

/** Copy shown in the caption band, per feedback state. */
export function feedbackCopy(s: ListenState, round: ListenRound): string {
  switch (s.feedback) {
    case 'correct':
      return round.explanation;
    case 'nudge':
      return 'Almost — listen once more.';
    case 'hint':
      return round.kind === 'pair'
        ? 'Listen once more, then choose. You can tap “Read it”.'
        : `Look for the letters “${round.options.find((o) => o.correct)?.label ?? ''}”.`;
    case 'done':
      return 'All sounds found! The tree is awake.';
    default:
      return 'Tap the stone to hear the word.';
  }
}

/** aria status describing the round for screen readers. */
export function ariaStatus(s: ListenState): string {
  const round = currentRound(s);
  const which = `Round ${Math.min(s.index + 1, s.rounds.length)} of ${s.rounds.length}. ${round.prompt}`;
  if (s.feedback === 'correct') return `${which} Correct. ${round.explanation}`;
  if (s.feedback === 'nudge') return `${which} Almost. Listen once more.`;
  if (s.feedback === 'hint') return `${which} ${feedbackCopy(s, round)}`;
  if (s.feedback === 'done') return `${which} ${feedbackCopy(s, round)}`;
  return which;
}
