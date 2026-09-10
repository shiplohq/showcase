// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state loader: fetches the local seed JSON from the static host,
// validates the shape (dev-time contract), and degrades to a clear message
// instead of a white screen (spec: runtime error phải degrade thành message rõ).

import type { Cadence, HabitSeed, PlantKind, SeedData } from './types';
import { isValidIsoDay } from './dates';

export class ContentError extends Error {}

const PLANTS: PlantKind[] = ['fern', 'sprout', 'blossom', 'marigold'];
const CADENCES: Cadence[] = ['daily', 'weekly'];

/** Build the data URL relative to the deployed base (subpath-safe, base './'). */
function assetUrl(path: string): string {
  const base = new URL(import.meta.env.BASE_URL ?? './', document.baseURI);
  return new URL(path, base).href;
}

function assertHabit(raw: unknown, i: number): HabitSeed {
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`habit ${i} is not an object.`);
  const h = raw as Record<string, unknown>;
  if (typeof h.id !== 'string' || !/^[a-z0-9-]{2,32}$/.test(h.id)) {
    throw new ContentError(`habit ${i}: id must be lowercase letters/digits/dashes.`);
  }
  if (typeof h.name !== 'string' || !h.name.trim() || h.name.length > 48) {
    throw new ContentError(`habit "${h.id}": name must be 1–48 characters.`);
  }
  if (typeof h.cadence !== 'string' || !CADENCES.includes(h.cadence as Cadence)) {
    throw new ContentError(`habit "${h.id}": cadence must be daily or weekly.`);
  }
  if (typeof h.plant !== 'string' || !PLANTS.includes(h.plant as PlantKind)) {
    throw new ContentError(`habit "${h.id}": plant must be one of ${PLANTS.join('/')}.`);
  }
  if (
    !Array.isArray(h.history) ||
    !h.history.every((d) => typeof d === 'string' && isValidIsoDay(d))
  ) {
    throw new ContentError(`habit "${h.id}": history must be an array of ISO days (YYYY-MM-DD).`);
  }
  return {
    id: h.id,
    name: h.name,
    cadence: h.cadence as Cadence,
    plant: h.plant as PlantKind,
    history: h.history as string[],
  };
}

export async function loadSeed(): Promise<SeedData> {
  let res: Response;
  const url = assetUrl('data/habits.seed.json');
  try {
    res = await fetch(url);
  } catch {
    throw new ContentError(`Could not load the garden seed (${url}). Is the build served from a static host?`);
  }
  if (!res.ok) throw new ContentError(`The garden seed returned ${res.status} (${url}).`);
  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new ContentError(`The garden seed is not valid JSON (${url}).`);
  }
  const root = parsed as { habits?: unknown };
  if (typeof root !== 'object' || root === null || !Array.isArray(root.habits) || root.habits.length === 0) {
    throw new ContentError('habits.seed.json is missing a non-empty "habits" array.');
  }
  const habits = root.habits.map(assertHabit);
  const ids = new Set(habits.map((h) => h.id));
  if (ids.size !== habits.length) throw new ContentError('habits.seed.json contains duplicate ids.');
  return { habits };
}
