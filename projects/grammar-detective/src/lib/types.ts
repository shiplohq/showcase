// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content and session types. Content state is loaded from public/data JSON;
// nothing here is hard-coded in components (spec: state model three layers).

export type TaskType = 'highlight' | 'reorder';
export type Category = 'noun' | 'verb' | 'adjective';

/** A `highlight` case: mark evidence words with category pens. */
export interface HighlightCase {
  kind: 'highlight';
  id: string;
  title: string;
  sentence: string;
  tokens: string[];
  categories: Category[];
  expectedMarks: Partial<Record<Category, number[]>>;
  clues: string[];
  rule: string;
  explanation: string;
}

/** A `reorder` case: rebuild the sentence from shuffled word cards. */
export interface ReorderCase {
  kind: 'reorder';
  id: string;
  title: string;
  sentence: string;
  tokens: string[];
  acceptedAnswers: string[];
  clues: string[];
  rule: string;
  explanation: string;
}

export type CaseFile = HighlightCase | ReorderCase;

export interface Dossier {
  id: string;
  code: string;
  title: string;
  brief: string;
  cases: CaseFile[];
}

export interface BureauContent {
  dossiers: Dossier[];
}

/** Personal state — anonymous, localStorage, always resettable. */
export interface PersonalState {
  resolved: string[];
}

/** token index -> category */
export type MarkMap = Record<number, Category>;

export type VerdictStatus = 'idle' | 'correct' | 'not-yet';

export interface Verdict {
  status: VerdictStatus;
  message: string;
}
