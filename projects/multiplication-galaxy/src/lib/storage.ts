// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Personal state — anonymous progress in localStorage (locked facts, streak).
// No personal data; a Reset control lives in the Mission Log (spec constraint).

import type { PersonalState } from './types';

const KEY = 'multiplication-galaxy:v1';

const FALLBACK: PersonalState = { locked: {}, streak: 0 };

export function loadPersonal(): PersonalState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { locked: {}, streak: 0 };
    const parsed = JSON.parse(raw) as Partial<PersonalState>;
    return {
      locked:
        typeof parsed.locked === 'object' && parsed.locked !== null
          ? Object.fromEntries(Object.entries(parsed.locked).filter(([, v]) => typeof v === 'boolean'))
          : {},
      streak: typeof parsed.streak === 'number' && parsed.streak >= 0 ? Math.min(Math.floor(parsed.streak), 3) : 0,
    };
  } catch {
    return { ...FALLBACK };
  }
}

export function savePersonal(state: PersonalState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode) — the game still works,
    // progress just doesn't persist.
  }
}

export function resetPersonal(): PersonalState {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore — clearing is best-effort
  }
  return { locked: {}, streak: 0 };
}
