// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Deterministic seeded shuffle — the same unit always lays out its word tray
// the same way, so the headless engine simulation exercises the exact
// arrangement children see (and re-visits feel stable, which young learners
// appreciate). Pure, no side effects.

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fisher–Yates shuffle driven by a seed derived from `key`. */
export function seededShuffle<T>(items: readonly T[], key: string): T[] {
  const rand = mulberry32(hashString(key));
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
