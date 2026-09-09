// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Optional anonymous progress (localStorage) — the third state layer. Only
// mission completion + spark tallies; nothing personal, always resettable.

const KEY = 'roboroute.progress.v1';

export interface Progress {
  completed: string[];
  sparks: Record<string, number>;
}

const EMPTY: Progress = { completed: [], sparks: {} };

export function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const v = JSON.parse(raw) as Partial<Progress>;
    return {
      completed: Array.isArray(v.completed) ? v.completed.filter((x) => typeof x === 'string') : [],
      sparks:
        v.sparks && typeof v.sparks === 'object' && !Array.isArray(v.sparks)
          ? Object.fromEntries(
              Object.entries(v.sparks as Record<string, unknown>)
                .filter(([, n]) => typeof n === 'number')
                .map(([k, n]) => [k, n as number]),
            )
          : {},
    };
  } catch {
    return { ...EMPTY }; // private mode / disabled storage: play without saving
  }
}

export function saveProgress(p: Progress): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable — session-only progress is fine */
  }
}

export function recordComplete(p: Progress, levelId: string, sparks: number): Progress {
  const next: Progress = {
    completed: p.completed.includes(levelId) ? p.completed : [...p.completed, levelId],
    sparks: { ...p.sparks, [levelId]: Math.max(sparks, p.sparks[levelId] ?? 0) },
  };
  saveProgress(next);
  return next;
}

export function clearProgress(): Progress {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return { ...EMPTY };
}
