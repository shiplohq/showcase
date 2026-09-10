// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Anonymous local preferences (spec: optional personal state — settings only,
// no personal data, always resettable from the About panel).

export type MotionPref = 'full' | 'reduced' | null;

export interface Prefs {
  volume: number; // 0..1
  muted: boolean;
  motion: MotionPref; // null = follow the OS media query
  trackIndex: number;
}

const KEY = 'rhythm-canvas.prefs.v1';

export const DEFAULT_PREFS: Prefs = { volume: 0.8, muted: false, motion: null, trackIndex: 0 };

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      volume:
        typeof parsed.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 1
          ? parsed.volume
          : DEFAULT_PREFS.volume,
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : DEFAULT_PREFS.muted,
      motion:
        parsed.motion === 'full' || parsed.motion === 'reduced' || parsed.motion === null
          ? parsed.motion
          : null,
      trackIndex:
        typeof parsed.trackIndex === 'number' && parsed.trackIndex >= 0 && parsed.trackIndex < 64
          ? Math.floor(parsed.trackIndex)
          : 0,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Private mode / storage disabled — preferences simply stay per-session.
  }
}

export function clearPrefs(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function systemPrefersReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
