// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Personal state — anonymous resolved-case list in localStorage. No personal
// data; always resettable from the board header (spec constraint).

import type { PersonalState } from './types';

const KEY = 'grammar-detective:v1';

const FALLBACK: PersonalState = { resolved: [] };

export function loadPersonal(): PersonalState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...FALLBACK };
    const parsed = JSON.parse(raw) as Partial<PersonalState>;
    return {
      resolved: Array.isArray(parsed.resolved)
        ? parsed.resolved.filter((x): x is string => typeof x === 'string')
        : [],
    };
  } catch {
    return { ...FALLBACK };
  }
}

export function savePersonal(state: PersonalState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode) — the bureau still works,
    // progress just doesn't persist.
  }
}

export function resetPersonal(): PersonalState {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore — a fresh empty state is returned regardless
  }
  return { ...FALLBACK };
}
