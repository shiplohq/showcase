// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Anonymous local progress (spec: optional personal state in localStorage,
// always with a reset). No personal data — fireflies per tree, roundup runs,
// mute preference. Every access is guarded: storage failures (private mode,
// quota, disabled) must never break the app.

import type { ListenFeedback } from '../engine/listen';

const KEY = 'phonics-forest-progress-v1';

export interface TreeProgress {
  fireflies: number;
  roundsDone: number;
  bestCount: number;
}

export interface Progress {
  v: 1;
  trees: Record<string, TreeProgress>;
  roundups: number;
  muted: boolean;
}

export const emptyProgress = (): Progress => ({ v: 1, trees: {}, roundups: 0, muted: false });

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Progress;
    if (parsed?.v !== 1 || typeof parsed !== 'object') return emptyProgress();
    return {
      v: 1,
      trees: typeof parsed.trees === 'object' && parsed.trees ? parsed.trees : {},
      roundups: Number(parsed.roundups) || 0,
      muted: Boolean(parsed.muted),
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Storage unavailable (private mode / disabled) — progress is best-effort.
  }
}

export function treeProgress(p: Progress, treeId: string): TreeProgress {
  return p.trees[treeId] ?? { fireflies: 0, roundsDone: 0, bestCount: 0 };
}

/** Merge a finished/ongoing listen session into stored progress. */
export function recordListen(p: Progress, treeId: string, roundsDone: number, fireflies: number, feedback: ListenFeedback): Progress {
  const prev = treeProgress(p, treeId);
  const next: TreeProgress = {
    fireflies: Math.max(prev.fireflies, fireflies),
    roundsDone: Math.max(prev.roundsDone, roundsDone),
    bestCount: Math.max(prev.bestCount, roundsDone),
  };
  void feedback;
  return { ...p, trees: { ...p.trees, [treeId]: next } };
}

export function recordRoundup(p: Progress): Progress {
  return { ...p, roundups: p.roundups + 1 };
}

export function setMuted(p: Progress, muted: boolean): Progress {
  return { ...p, muted };
}

export function resetProgress(): Progress {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore — a fresh object is returned regardless
  }
  return emptyProgress();
}

export function totalFireflies(p: Progress): number {
  return Object.values(p.trees).reduce((sum, t) => sum + (t?.fireflies ?? 0), 0);
}
