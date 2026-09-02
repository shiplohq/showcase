// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Optional anonymous local state (spec layer 3): discovered words, finished
// scenes, sound/translation settings. No personal data — just progress. Always
// resettable from the settings panel; degrades silently when storage is
// unavailable (private mode).

const KEY = 'vocab-expedition-v1';

export interface Settings {
  /** WebAudio feedback sounds — OFF by default (no-sound mode is the default state). */
  sound: boolean;
  /** Show the Vietnamese support layer. */
  translation: boolean;
}

export interface Progress {
  /** item ids whose caption plate has been discovered (explore/clue). */
  foundWords: string[];
  /** item ids pinned by a correct label match. */
  labeledWords: string[];
  /** unit ids fully completed (all three tasks). */
  scenesDone: string[];
  settings: Settings;
}

export const defaultProgress: Progress = {
  foundWords: [],
  labeledWords: [],
  scenesDone: [],
  settings: { sound: false, translation: true },
};

function safeParse(raw: string | null): Progress | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<Progress>;
    if (typeof p !== 'object' || p === null) return null;
    return {
      foundWords: Array.isArray(p.foundWords) ? p.foundWords.map(String).slice(0, 500) : [],
      labeledWords: Array.isArray(p.labeledWords) ? p.labeledWords.map(String).slice(0, 500) : [],
      scenesDone: Array.isArray(p.scenesDone) ? p.scenesDone.map(String).slice(0, 100) : [],
      settings: {
        sound: p.settings?.sound === true,
        translation: p.settings?.translation !== false,
      },
    };
  } catch {
    return null;
  }
}

export function loadProgress(): Progress {
  try {
    return safeParse(window.localStorage.getItem(KEY)) ?? defaultProgress;
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(p: Progress): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable — progress simply does not persist */
  }
}

export function resetProgress(): Progress {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to clean */
  }
  return { ...defaultProgress, settings: { ...defaultProgress.settings } };
}

/** Pure helpers to evolve progress without duplicates. */
export function withFound(p: Progress, itemId: string): Progress {
  return p.foundWords.includes(itemId)
    ? p
    : { ...p, foundWords: [...p.foundWords, itemId] };
}
export function withLabeled(p: Progress, itemId: string): Progress {
  return p.labeledWords.includes(itemId)
    ? p
    : { ...p, labeledWords: [...p.labeledWords, itemId] };
}
export function withSceneDone(p: Progress, unitId: string): Progress {
  return p.scenesDone.includes(unitId)
    ? p
    : { ...p, scenesDone: [...p.scenesDone, unitId] };
}
