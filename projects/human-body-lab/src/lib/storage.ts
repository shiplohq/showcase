// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Anonymous, optional personal state: which organs have been inspected, which
// pathways completed, best quiz score. No personal data; always resettable.
// localStorage is wrapped in try/catch — private-mode browsers throw and the
// lab must still run (session-only progress in that case).

const KEY = 'human-body-lab:v1';

export interface Progress {
  exploredOrgans: string[];
  completedPathways: string[];
  quizBest: number;
}

export const EMPTY_PROGRESS: Progress = {
  exploredOrgans: [],
  completedPathways: [],
  quizBest: 0,
};

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      exploredOrgans: Array.isArray(parsed.exploredOrgans)
        ? parsed.exploredOrgans.filter((id): id is string => typeof id === 'string')
        : [],
      completedPathways: Array.isArray(parsed.completedPathways)
        ? parsed.completedPathways.filter((id): id is string => typeof id === 'string')
        : [],
      quizBest: typeof parsed.quizBest === 'number' && parsed.quizBest >= 0 ? parsed.quizBest : 0,
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable (private mode / blocked): session-only progress.
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore — nothing to clear
  }
}
