// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Anonymous local state only (spec: optional personal layer): visited
// specimens + best quiz visit. No personal data, always resettable.

const KEY = 'solar-explorer-log-v1';

export interface ExpeditionLog {
  visited: string[];
  bestMatch: number;
}

const EMPTY: ExpeditionLog = { visited: [], bestMatch: 0 };

export function loadLog(): ExpeditionLog {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<ExpeditionLog>;
    return {
      visited: Array.isArray(parsed.visited) ? parsed.visited.filter((v) => typeof v === 'string').slice(0, 32) : [],
      bestMatch: typeof parsed.bestMatch === 'number' && Number.isFinite(parsed.bestMatch) ? parsed.bestMatch : 0,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveLog(log: ExpeditionLog): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    // private mode / storage disabled — the exhibit works without the log
  }
}

export function resetLog(): ExpeditionLog {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  return { ...EMPTY };
}
