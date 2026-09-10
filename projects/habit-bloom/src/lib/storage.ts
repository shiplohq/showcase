// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Anonymous personal state (spec layer 3) — strictly opt-in. Until the user
// chooses "keep on this device", nothing is ever written. The payload is the
// demo garden itself (habit names the user typed stay on the device; no
// account, no sync, no personal identifiers). Every access is guarded —
// private-mode / blocked storage must not break the app.

import type { Consent, Habit, StoredGarden } from './types';
import { isValidIsoDay } from './dates';

const GARDEN_KEY = 'habit-bloom.garden.v1';
const CONSENT_KEY = 'habit-bloom.consent.v1';

export function loadConsent(): Consent {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw === 'local' || raw === 'session' ? raw : 'unset';
  } catch {
    return 'unset';
  }
}

export function saveConsent(consent: Consent): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // Storage unavailable — the choice lasts this session only.
  }
}

function isHabit(raw: unknown): raw is Habit {
  if (typeof raw !== 'object' || raw === null) return false;
  const h = raw as Record<string, unknown>;
  return (
    typeof h.id === 'string' &&
    /^[a-z0-9-]{2,32}$/.test(h.id) &&
    typeof h.name === 'string' &&
    h.name.length > 0 &&
    h.name.length <= 48 &&
    (h.cadence === 'daily' || h.cadence === 'weekly') &&
    (h.plant === 'fern' || h.plant === 'sprout' || h.plant === 'blossom' || h.plant === 'marigold') &&
    Array.isArray(h.history) &&
    h.history.every((d) => typeof d === 'string' && isValidIsoDay(d))
  );
}

/** Load the persisted garden, or null when absent/corrupt — never throws. */
export function loadGarden(): StoredGarden | null {
  try {
    const raw = window.localStorage.getItem(GARDEN_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const habits = (parsed as { habits?: unknown }).habits;
    if (!Array.isArray(habits) || !habits.every(isHabit)) return null;
    return { habits: habits.map((h) => ({ ...h, history: [...h.history] })) };
  } catch {
    return null;
  }
}

export function saveGarden(garden: StoredGarden): void {
  try {
    window.localStorage.setItem(GARDEN_KEY, JSON.stringify(garden));
  } catch {
    // Storage unavailable — the garden stays in-session.
  }
}

/** Full reset: forget consent + garden (the "start fresh" path). */
export function clearAll(): void {
  try {
    window.localStorage.removeItem(GARDEN_KEY);
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Offer the garden as a downloadable JSON backup (spec: export optional). */
export function exportGarden(garden: StoredGarden): boolean {
  try {
    const blob = new Blob([JSON.stringify({ ...garden, exportedAt: new Date().toISOString() }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'habit-bloom-garden.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}
