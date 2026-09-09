// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content loading + dev-time validation for the local JSON files.
// Content is the source of truth (spec: a new biome/challenge is added by
// adding JSON, not code). Invalid content degrades to a readable error panel,
// never a white screen.

import type { BiomeDef, ChallengeDef, SpeciesDef } from '../engine/types.ts';

export interface EcoData {
  biomes: BiomeDef[];
  challenges: ChallengeDef[];
}

interface ValidationIssue {
  message: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateSpecies(biomeId: string, s: unknown, issues: ValidationIssue[]): SpeciesDef | null {
  if (!isRecord(s)) {
    issues.push({ message: `${biomeId}: species entry is not an object` });
    return null;
  }
  const id = typeof s.id === 'string' ? s.id : '';
  if (!id) issues.push({ message: `${biomeId}: species missing id` });
  if (typeof s.label !== 'string' || !s.label) issues.push({ message: `${biomeId}/${id}: missing label` });
  if (typeof s.initialPopulation !== 'number' || s.initialPopulation < 0) {
    issues.push({ message: `${biomeId}/${id}: initialPopulation must be a number >= 0` });
  }
  if (!Array.isArray(s.limits) || s.limits.length !== 2 || s.limits[0] !== 0 || s.limits[1] <= 0) {
    issues.push({ message: `${biomeId}/${id}: limits must be [0, max]` });
  }
  const trophic = s.trophic;
  if (trophic !== 'plant' && trophic !== 'herbivore' && trophic !== 'predator' && trophic !== 'top') {
    issues.push({ message: `${biomeId}/${id}: unknown trophic level` });
  }
  if (trophic === 'plant') {
    if (!isRecord(s.growth) || typeof s.growth.rate !== 'number' || typeof s.growth.capacity !== 'number') {
      issues.push({ message: `${biomeId}/${id}: plant missing growth { rate, capacity }` });
    }
  } else {
    if (!isRecord(s.diet) || !isRecord(s.diet.prey)) {
      issues.push({ message: `${biomeId}/${id}: consumer missing diet.prey` });
    }
    if (!isRecord(s.metabolism) || typeof s.metabolism.foodNeed !== 'number') {
      issues.push({ message: `${biomeId}/${id}: consumer missing metabolism.foodNeed` });
    }
  }
  return s as unknown as SpeciesDef;
}

export function validateData(raw: unknown): { data: EcoData | null; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!isRecord(raw) || !Array.isArray(raw.biomes)) {
    return { data: null, issues: [{ message: 'biomes.json is missing the "biomes" array' }] };
  }
  const biomes: BiomeDef[] = [];
  const biomeIds = new Set<string>();
  for (const b of raw.biomes) {
    if (!isRecord(b) || typeof b.id !== 'string' || !b.id) {
      issues.push({ message: 'biome entry missing id' });
      continue;
    }
    if (biomeIds.has(b.id)) issues.push({ message: `biome ${b.id}: duplicate id` });
    biomeIds.add(b.id);
    if (!Array.isArray(b.species) || b.species.length < 2) {
      issues.push({ message: `biome ${b.id}: needs at least 2 species` });
      continue;
    }
    const species: SpeciesDef[] = [];
    const seen = new Set<string>();
    for (const s of b.species) {
      const parsed = validateSpecies(b.id, s, issues);
      if (!parsed || !parsed.id) continue;
      if (seen.has(parsed.id)) issues.push({ message: `biome ${b.id}: duplicate species ${parsed.id}` });
      seen.add(parsed.id);
      species.push(parsed);
    }
    // cross-ref: every prey id exists and is not the species itself
    for (const s of species) {
      for (const preyId of Object.keys(s.diet?.prey ?? {})) {
        if (preyId === s.id) issues.push({ message: `${b.id}/${s.id}: eats itself` });
        if (!seen.has(preyId)) issues.push({ message: `${b.id}/${s.id}: prey '${preyId}' not in biome` });
      }
    }
    biomes.push({ ...(b as unknown as BiomeDef), species });
  }

  const challenges: ChallengeDef[] = [];
  if (isRecord(raw) && Array.isArray(raw.challenges)) {
    for (const c of raw.challenges) {
      if (!isRecord(c) || typeof c.id !== 'string' || !c.id) {
        issues.push({ message: 'challenge entry missing id' });
        continue;
      }
      if (!biomeIds.has(c.biomeId as string)) {
        issues.push({ message: `challenge ${c.id}: unknown biome '${String(c.biomeId)}'` });
      }
      challenges.push(c as unknown as ChallengeDef);
    }
  }

  return { data: issues.length === 0 ? { biomes, challenges } : null, issues };
}

/**
 * Fetch the local content files. `base` is the document base for subpath-safe
 * resolution (Vite BASE_URL './' — resolve relative to the document).
 */
export async function loadEcoData(): Promise<{ data: EcoData | null; issues: ValidationIssue[] }> {
  const resolve = (path: string) => new URL(path, document.baseURI).href;
  const [biomesRes, challengesRes] = await Promise.all([
    fetch(resolve('data/biomes.json')),
    fetch(resolve('data/challenges.json')),
  ]);
  if (!biomesRes.ok) throw new Error(`Could not load data/biomes.json (${biomesRes.status})`);
  if (!challengesRes.ok) throw new Error(`Could not load data/challenges.json (${challengesRes.status})`);
  const [biomesRaw, challengesRaw] = await Promise.all([biomesRes.json(), challengesRes.json()]);
  return validateData({ biomes: biomesRaw.biomes, challenges: challengesRaw.challenges });
}
