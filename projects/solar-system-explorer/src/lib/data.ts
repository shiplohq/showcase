// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content loader: the whole exhibit is JSON-driven (spec state model —
// content state comes from local files, never hard-coded in components).
// Dev-time validation via the pure engine; failures degrade to an error
// plaque, never a white screen.

import type { AtlasCopy, PlanetData, PlanetsFile } from './types';
import { validatePlanets, type ValidationIssue } from '../features/atlas/engine';

export interface AtlasBundle {
  planets: PlanetData[];
  copy: AtlasCopy;
  sourceNote: string;
}

export type LoadResult =
  | { ok: true; bundle: AtlasBundle }
  | { ok: false; error: string; issues: ValidationIssue[] };

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

export async function loadAtlas(): Promise<LoadResult> {
  try {
    // Pilot #01 lesson: with base './', `new URL(path, import.meta.url)` is not
    // an absolute base and throws. Public assets resolve relative to the
    // document via import.meta.env.BASE_URL — subpath-safe on Shiplo hosting.
    const base = import.meta.env.BASE_URL ?? './';
    const [rawPlanets, rawCopy] = await Promise.all([
      fetchJson(`${base}data/planets.json`),
      fetchJson(`${base}data/atlas.json`),
    ]);
    const { planets, issues } = validatePlanets(rawPlanets);
    if (!planets) {
      return {
        ok: false,
        error: 'planets.json failed validation',
        issues,
      };
    }
    const copy = rawCopy as AtlasCopy;
    if (!copy?.exhibit?.title || !Array.isArray(copy.views) || copy.views.length < 3) {
      return { ok: false, error: 'atlas.json is missing exhibit copy', issues: [] };
    }
    return {
      ok: true,
      bundle: {
        planets,
        copy,
        sourceNote: (rawPlanets as PlanetsFile).sourceNote ?? 'NASA Planetary Fact Sheet (mean values).',
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      issues: [],
    };
  }
}
