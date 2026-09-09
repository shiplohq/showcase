// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Anonymous local progress (spec: optional personal state + always a reset).
// Nothing personal is stored — only which field assignments were completed
// and which biome was opened last.

const KEY = 'ecobalance.progress.v1';

export interface Progress {
  /** Completed challenge ids. */
  done: string[];
  /** Last opened biome id. */
  lastBiome?: string;
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { done: [] };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    if (!Array.isArray(parsed.done)) return { done: [] };
    return { done: parsed.done.filter((x): x is string => typeof x === 'string'), lastBiome: parsed.lastBiome };
  } catch {
    return { done: [] };
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable (private mode etc.) — progress is optional by design.
  }
}

export function clearProgress(): Progress {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  return { done: [] };
}
