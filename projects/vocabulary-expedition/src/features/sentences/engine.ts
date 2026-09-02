// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure sentence-builder logic — no Vue, no DOM. Magnetic word chips fill the
// blank; the child presses Check (agency, like the pilot's pattern: no
// auto-judging). Correct → the full sentence joins the dialogue strip with its
// translation; wrong → the chip can be swapped, gentle copy, no lockout.

import type { SentenceData, UnitData } from '../../lib/types';
import type { Feedback } from '../../lib/types';
import { seededShuffle } from '../../lib/rng.ts';

export interface SentenceState {
  /** Sentence ids in builder order. */
  order: string[];
  current: number;
  /** Chips (item ids) for the current sentence — deterministic shuffle. */
  chips: string[];
  /** Word currently sitting in the blank (null = empty). */
  blank: string | null;
  feedback: Feedback;
  /** Sentence ids solved so far. */
  solved: string[];
  /** Sentence id just solved (for the dialogue card reveal). */
  justSolvedId: string | null;
  done: boolean;
}

function chipsFor(unit: UnitData, sentence: SentenceData): string[] {
  return seededShuffle([sentence.answer, ...sentence.distractors], `${unit.id}:${sentence.id}`);
}

export function startSentences(unit: UnitData): SentenceState {
  const first = unit.sentences[0];
  return {
    order: unit.sentences.map((s) => s.id),
    current: 0,
    chips: chipsFor(unit, first),
    blank: null,
    feedback: 'idle',
    solved: [],
    justSolvedId: null,
    done: false,
  };
}

export function currentSentence(unit: UnitData, s: SentenceState): SentenceData {
  const id = s.order[s.current];
  const sentence = unit.sentences.find((x) => x.id === id);
  if (!sentence) throw new Error(`sentence "${id}" missing from unit "${unit.id}"`);
  return sentence;
}

export function wordOf(unit: UnitData, itemId: string): string {
  return unit.items.find((i) => i.id === itemId)?.word ?? itemId;
}

/** Put a chip into the blank. Tapping the blank removes it (undo path). */
export function placeWord(s: SentenceState, itemId: string | null): SentenceState {
  if (s.done || s.feedback === 'correct') return s;
  return { ...s, blank: itemId, feedback: 'idle' };
}

/** The child presses Check — never auto-judged. */
export function checkSentence(unit: UnitData, s: SentenceState): SentenceState {
  const sentence = currentSentence(unit, s);
  if (s.done || s.feedback === 'correct' || !s.blank) return s;
  if (s.blank === sentence.answer) {
    const solved = s.solved.includes(sentence.id) ? s.solved : [...s.solved, sentence.id];
    return {
      ...s,
      solved,
      feedback: 'correct',
      justSolvedId: sentence.id,
      done: solved.length >= s.order.length,
    };
  }
  return { ...s, feedback: 'nudge' };
}

/** Move to the next sentence (after the correct reveal). */
export function advanceSentence(unit: UnitData, s: SentenceState): SentenceState {
  if (s.feedback !== 'correct') return s;
  const next = s.current + 1;
  if (next >= s.order.length) {
    return { ...s, feedback: 'idle', current: s.order.length - 1, blank: null, justSolvedId: null };
  }
  const sentence = unit.sentences.find((x) => x.id === s.order[next]);
  if (!sentence) return s;
  return {
    ...s,
    feedback: 'idle',
    current: next,
    chips: chipsFor(unit, sentence),
    blank: null,
    justSolvedId: null,
  };
}

/** Render helpers — the blank split for typography. */
export function sentenceParts(sentence: SentenceData): { before: string; after: string } {
  const i = sentence.text.indexOf('___');
  if (i < 0) return { before: sentence.text, after: '' };
  return { before: sentence.text.slice(0, i), after: sentence.text.slice(i + 3) };
}

export function sentenceAriaStatus(unit: UnitData, s: SentenceState): string {
  if (s.feedback === 'correct') {
    const sentence = unit.sentences.find((x) => x.id === s.justSolvedId);
    return sentence ? `Great sentence! ${sentence.full} — ${sentence.translation}` : 'Great sentence!';
  }
  if (s.feedback === 'nudge') return 'Almost! Read the sentence again and try another word.';
  if (s.blank) return `The blank holds ${wordOf(unit, s.blank)}. Press Check when it sounds right.`;
  return `Sentence ${Math.min(s.current + 1, s.order.length)} of ${s.order.length}.`;
}
