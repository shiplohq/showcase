// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Anonymous, optional personal state: which stops are done (stamps). No
// personal data; always resettable; private-mode browsers throw on access so
// every call is guarded — the atlas still runs with session-only progress.

const KEY = 'geotrail:v1';

export interface Progress {
  completedStops: string[];
}

export const EMPTY_PROGRESS: Progress = { completedStops: [] };

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completedStops: Array.isArray(parsed.completedStops)
        ? parsed.completedStops.filter((id): id is string => typeof id === 'string')
        : [],
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
