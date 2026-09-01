// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Anonymous local progress (optional personal state, spec §state model):
// which missions were completed. No personal data, always resettable.

const KEY = 'mmj-progress-v1';

export function loadCompleted(): Record<string, true> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, true> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof k === 'string' && k.length <= 64 && v === true) out[k] = true;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveCompleted(completed: Record<string, true>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(completed));
  } catch {
    /* storage unavailable — progress simply stays in-session */
  }
}

export function clearCompleted(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
