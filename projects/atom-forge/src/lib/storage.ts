// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Anonymous personal state (spec layer 3): the list of forged mission ids.
// No personal data, always resettable from the ledger. Every access is
// guarded — private-mode / blocked storage must not break the app.

const KEY = 'atom-forge.progress.v1';

export function loadCompleted(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) return [];
    return parsed as string[];
  } catch {
    return [];
  }
}

export function saveCompleted(ids: string[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable (private mode / blocked) — progress stays in-session.
  }
}

export function clearCompleted(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
