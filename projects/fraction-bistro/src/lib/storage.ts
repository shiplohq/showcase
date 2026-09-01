// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Anonymous, optional personal state: which orders have been served (so the
// board keeps its stamps and the recipe book its pages between visits).
// No personal data, always resettable ("New shift"). localStorage is wrapped
// in try/catch — private-mode browsers throw and the app must still run.

const KEY = 'fraction-bistro:v1';

export interface Progress {
  servedIds: string[];
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { servedIds: [] };
    const parsed = JSON.parse(raw) as Progress;
    if (!Array.isArray(parsed.servedIds)) return { servedIds: [] };
    return { servedIds: parsed.servedIds.filter((id) => typeof id === 'string') };
  } catch {
    return { servedIds: [] };
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
