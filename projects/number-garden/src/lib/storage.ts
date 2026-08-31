// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Personal state — anonymous progress + sound preference in localStorage.
// No personal data; always resettable from the home screen (spec constraint).

import type { PersonalState } from './types';

const KEY = 'number-garden:v1';

const FALLBACK: PersonalState = { stars: {}, soundOn: false };

export function loadPersonal(): PersonalState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...FALLBACK };
    const parsed = JSON.parse(raw) as Partial<PersonalState>;
    return {
      stars: typeof parsed.stars === 'object' && parsed.stars !== null ? parsed.stars : {},
      soundOn: parsed.soundOn === true,
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
