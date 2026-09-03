// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure quiz engine — no Vue, no DOM. Owns answer checking and run state.
// No timer, no penalty loop: every answer (right or wrong) shows the
// explanation, then the learner moves on.

import type { QuizQuestion } from '../../lib/types';

export interface QuizState {
  /** Index of the current question. */
  index: number;
  /** Chosen option per question (null = unanswered). */
  picks: (number | null)[];
  /** True once the learner has stepped past the last question. */
  finished: boolean;
}

export function startQuiz(questionCount: number): QuizState {
  return { index: 0, picks: Array.from({ length: questionCount }, () => null), finished: false };
}

export type AnswerResult =
  | { kind: 'correct'; question: QuizQuestion }
  | { kind: 'wrong'; question: QuizQuestion };

/** Record a pick for the current question; the result drives the feedback. */
export function answer(
  state: QuizState,
  question: QuizQuestion,
  choice: number,
): { state: QuizState; result: AnswerResult } {
  const picks = [...state.picks];
  picks[state.index] = choice;
  return {
    state: { ...state, picks },
    result: choice === question.answer
      ? { kind: 'correct', question }
      : { kind: 'wrong', question },
  };
}

/** Move to the next question; finished once past the last. */
export function next(state: QuizState): QuizState {
  if (state.index < state.picks.length - 1) {
    return { ...state, index: state.index + 1 };
  }
  return { ...state, finished: true };
}

export function score(state: QuizState, questions: QuizQuestion[]): number {
  return questions.reduce((sum, q, i) => sum + (state.picks[i] === q.answer ? 1 : 0), 0);
}

export function restart(questionCount: number): QuizState {
  return startQuiz(questionCount);
}
