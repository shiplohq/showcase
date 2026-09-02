// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure investigation engine — marking rules, verdict computation, clue state
// and progression. No React, no DOM, no fetch: every rule the UI follows
// lives here so it can be simulated headless (scripts/engine-sim.mjs).

import type {
  CaseFile,
  Category,
  Dossier,
  HighlightCase,
  MarkMap,
  ReorderCase,
  Verdict,
} from '../../lib/types';

// ---- tokens ----------------------------------------------------------------

/** Punctuation cards glue to the previous word (".", "?", ","…). */
export function isPunctuation(token: string): boolean {
  return /^[.,!?;:'"]+$/.test(token);
}

/** Join word cards into a display sentence: spaces everywhere except before punctuation. */
export function joinTokens(tokens: string[]): string {
  let out = '';
  for (const t of tokens) {
    out += out === '' || isPunctuation(t) ? t : ' ' + t;
  }
  return out;
}

/** Loose comparison for learners: case-insensitive, collapsed spaces. */
export function normalizeSentence(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ---- highlighting ----------------------------------------------------------

export function toggleMark(marks: MarkMap, tokenIndex: number, pen: Category): MarkMap {
  const next = { ...marks };
  if (next[tokenIndex] === pen) delete next[tokenIndex];
  else next[tokenIndex] = pen;
  return next;
}

export function markCount(marks: MarkMap): number {
  return Object.keys(marks).length;
}

function expectedEntries(c: HighlightCase): Array<[number, Category]> {
  const entries: Array<[number, Category]> = [];
  for (const cat of c.categories) {
    for (const i of c.expectedMarks[cat] ?? []) entries.push([i, cat]);
  }
  return entries;
}

export function highlightVerdict(c: HighlightCase, marks: MarkMap): Verdict {
  const expected = expectedEntries(c);
  let missing = 0;
  for (const [i, cat] of expected) {
    if (marks[i] !== cat) missing++;
  }
  const wrong = Object.entries(marks).filter(([i, cat]) => {
    const idx = Number(i);
    const want = c.categories.find((cat2) => (c.expectedMarks[cat2] ?? []).includes(idx));
    return want !== cat;
  }).length;

  if (missing === 0 && wrong === 0) {
    return {
      status: 'correct',
      message: 'Case closed! Every piece of evidence is marked with the right pen.',
    };
  }
  const parts: string[] = ['Not yet.'];
  if (missing > 0) {
    parts.push(
      missing === 1
        ? '1 evidence word still needs the right pen.'
        : `${missing} evidence words still need the right pen.`,
    );
  }
  if (wrong > 0) {
    parts.push(
      wrong === 1
        ? '1 mark is sitting on the wrong word — tap it again to lift it off.'
        : `${wrong} marks are sitting on the wrong words — tap them again to lift them off.`,
    );
  }
  if (missing > 0 && wrong === 0) parts.push('A clue can narrow the search.');
  return { status: 'not-yet', message: parts.join(' ') };
}

/** Explanation view marks — shown after solving, for the worked example. */
export function solvedMarks(c: HighlightCase): MarkMap {
  const marks: MarkMap = {};
  for (const cat of c.categories) {
    for (const i of c.expectedMarks[cat] ?? []) marks[i] = cat;
  }
  return marks;
}

// ---- reordering ------------------------------------------------------------

/** Deterministic PRNG so a case always shuffles the same way for everyone. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Shuffle token indices for a reorder case. Deterministic per case id; never
 * returns an order that already matches an accepted answer (when avoidable)
 * and never leaves short cases unshuffled.
 */
export function shuffledOrder(c: ReorderCase, salt = 0): number[] {
  const rand = mulberry32(seedFromId(c.id) + salt * 7919);
  const n = c.tokens.length;
  const accepted = c.acceptedAnswers.map(normalizeSentence);
  for (let attempt = 0; attempt < 64; attempt++) {
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const joined = normalizeSentence(joinTokens(order.map((i) => c.tokens[i])));
    const isIdentity = order.every((v, i) => v === i);
    if (!isIdentity && !accepted.includes(joined)) return order;
  }
  // Fallback (theoretically unreachable for n >= 3): rotate by one.
  return Array.from({ length: n }, (_, i) => (i + 1) % n);
}

export function moveCard(order: number[], from: number, to: number): number[] {
  if (to < 0 || to >= order.length || from === to) return order;
  const next = [...order];
  const [card] = next.splice(from, 1);
  next.splice(to, 0, card);
  return next;
}

export function reorderVerdict(c: ReorderCase, order: number[]): Verdict {
  const joined = normalizeSentence(joinTokens(order.map((i) => c.tokens[i])));
  const solved = c.acceptedAnswers.some((a) => normalizeSentence(a) === joined);
  if (solved) {
    return { status: 'correct', message: 'Case closed! The sentence reads like real English.' };
  }
  return {
    status: 'not-yet',
    message:
      "Not yet. Read your line out loud — does it sound like real English yet? Open a clue if you're not sure.",
  };
}

// ---- clues -----------------------------------------------------------------

export type ClueMask = number; // bits 1 | 2 | 4 for levels 1..3

export function openClue(mask: ClueMask, level: 1 | 2 | 3): ClueMask {
  return mask | (1 << (level - 1));
}

export function clueVisible(mask: ClueMask, level: 1 | 2 | 3): boolean {
  return (mask & (1 << (level - 1))) !== 0;
}

export function cluesOpenedCount(mask: ClueMask): number {
  return (mask & 1 ? 1 : 0) + (mask & 2 ? 1 : 0) + (mask & 4 ? 1 : 0);
}

// ---- progression -----------------------------------------------------------

export function totalCases(dossiers: Dossier[]): number {
  return dossiers.reduce((n, d) => n + d.cases.length, 0);
}

export function resolvedCount(dossiers: Dossier[], resolved: string[]): number {
  const set = new Set(resolved);
  return totalCases(dossiers) - dossiers.reduce(
    (n, d) => n + d.cases.filter((c) => !set.has(c.id)).length,
    0,
  );
}

export function dossierProgress(d: Dossier, resolved: string[]): { done: number; total: number } {
  const set = new Set(resolved);
  return { done: d.cases.filter((c) => set.has(c.id)).length, total: d.cases.length };
}

export function nextCase(
  dossiers: Dossier[],
  currentId: string,
): { dossierId: string; caseId: string } | null {
  const flat: Array<{ dossierId: string; caseId: string }> = [];
  for (const d of dossiers) for (const c of d.cases) flat.push({ dossierId: d.id, caseId: c.id });
  const idx = flat.findIndex((x) => x.caseId === currentId);
  return idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;
}

/** Find a case + its dossier. */
export function findCase(
  dossiers: Dossier[],
  caseId: string,
): { dossier: Dossier; case: CaseFile } | null {
  for (const d of dossiers) {
    const c = d.cases.find((x) => x.id === caseId);
    if (c) return { dossier: d, case: c };
  }
  return null;
}

/** Human label for a category pen. */
export function categoryLabel(cat: Category): string {
  return cat === 'adjective' ? 'ADJ.' : cat.toUpperCase();
}

/** Long label for aria + explanation text. */
export function categoryLongLabel(cat: Category): string {
  return { noun: 'noun', verb: 'verb', adjective: 'adjective' }[cat];
}
