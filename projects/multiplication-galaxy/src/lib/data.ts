// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state loader: fetches local JSON from the static host, validates the
// full contract at load time (spec: dev-time validation; runtime degrade is a
// clear message, never a white screen).

import type { Content, Galaxy, Mission } from './types';

export class ContentError extends Error {}

async function fetchJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ContentError(`Could not load chart data (${url}).`);
  }
  if (!res.ok) throw new ContentError(`Chart data returned ${res.status} (${url}).`);
  try {
    return await res.json();
  } catch {
    throw new ContentError(`Chart data is not valid JSON (${url}).`);
  }
}

function asRecord(raw: unknown, where: string): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new ContentError(`${where} is not an object.`);
  }
  return raw as Record<string, unknown>;
}

function num(v: unknown, where: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new ContentError(`${where} is not a number.`);
  return v;
}

function str(v: unknown, where: string): string {
  if (typeof v !== 'string' || !v) throw new ContentError(`${where} is not a non-empty string.`);
  return v;
}

const TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function assertGalaxy(raw: unknown, i: number): Galaxy {
  const g = asRecord(raw, `galaxy ${i}`);
  const table = Math.round(num(g.tableNumber, `galaxy ${i}.tableNumber`));
  if (!TABLES.includes(table)) throw new ContentError(`galaxy ${i}: tableNumber ${table} outside 2–12.`);
  const layout = asRecord(g.constellationLayout, `galaxy ${i}.constellationLayout`);
  const style = asRecord(g.planetStyle, `galaxy ${i}.planetStyle`);
  return {
    id: str(g.id, `galaxy ${i}.id`),
    tableNumber: table,
    title: str(g.title, `galaxy ${i}.title`),
    constellation: str(g.constellation, `galaxy ${i}.constellation`),
    chapterCopy: str(g.chapterCopy, `galaxy ${i}.chapterCopy`),
    constellationLayout: { x: num(layout.x, 'layout.x'), y: num(layout.y, 'layout.y') },
    planetStyle: { base: str(style.base, 'planetStyle.base'), band: str(style.band, 'planetStyle.band') },
  };
}

function assertMission(raw: unknown, i: number, galaxyIds: Set<string>): Mission {
  const where = `mission ${i}`;
  const m = asRecord(raw, where);
  const id = str(m.id, `${where}.id`);
  const galaxyId = str(m.galaxyId, `${where}.galaxyId`);
  if (!galaxyIds.has(galaxyId)) throw new ContentError(`${id}: unknown galaxyId "${galaxyId}".`);

  const factorsRaw = m.factors;
  if (!Array.isArray(factorsRaw) || factorsRaw.length !== 2) throw new ContentError(`${id}: factors must be [a, b].`);
  const a = num(factorsRaw[0], `${id}.factors[0]`);
  const b = num(factorsRaw[1], `${id}.factors[1]`);
  if (a < 2 || a > 12 || b < 2 || b > 12) throw new ContentError(`${id}: factors ${a}×${b} outside 2–12.`);

  const rep = str(m.representation, `${id}.representation`);
  if (rep !== 'array' && rep !== 'missingFactor') throw new ContentError(`${id}: representation "${rep}" unsupported.`);
  const missingRaw = m.missing ?? null;
  if (missingRaw !== null && missingRaw !== 'a' && missingRaw !== 'b') {
    throw new ContentError(`${id}: missing must be "a" | "b" | null.`);
  }
  const missing = missingRaw;
  if (rep === 'missingFactor' && missing !== 'a' && missing !== 'b') {
    throw new ContentError(`${id}: missingFactor mission needs missing: "a" | "b".`);
  }
  if (rep === 'array' && missing !== null) throw new ContentError(`${id}: array mission must have missing: null.`);

  const answer = num(m.answer, `${id}.answer`);
  const expected = rep === 'array' ? a * b : missing === 'a' ? a : b;
  if (answer !== expected) throw new ContentError(`${id}: answer ${answer} ≠ expected ${expected}.`);

  const opts = m.distractors;
  if (!Array.isArray(opts) || opts.length !== 4) throw new ContentError(`${id}: distractors must hold exactly 4 options.`);
  if (new Set(opts).size !== 4) throw new ContentError(`${id}: distractors contain duplicates.`);
  if (!opts.includes(answer)) throw new ContentError(`${id}: answer ${answer} not among the 4 options.`);
  if (opts.filter((o) => o === answer).length !== 1) throw new ContentError(`${id}: answer appears more than once.`);
  for (const o of opts) {
    if (typeof o !== 'number' || !Number.isInteger(o) || o < 0) throw new ContentError(`${id}: option ${o} invalid.`);
  }
  // A wrong-looking near-miss must never secretly equal the product/factor.
  for (const o of opts as number[]) {
    if (o !== answer && (rep === 'array' ? o === a * b : o === expected)) {
      throw new ContentError(`${id}: option ${o} equals the answer twice.`);
    }
  }

  const difficulty = num(m.difficulty, `${id}.difficulty`);
  if (![1, 2, 3].includes(difficulty)) throw new ContentError(`${id}: difficulty ${difficulty} outside 1–3.`);

  return {
    id,
    galaxyId,
    factors: [a, b],
    representation: rep,
    missing,
    distractors: opts as number[],
    answer,
    prompt: str(m.prompt, `${id}.prompt`),
    explanation: str(m.explanation, `${id}.explanation`),
    difficulty: difficulty as 1 | 2 | 3,
  };
}

/** Build an asset URL relative to the deployed base (subpath-safe). */
function assetUrl(path: string): string {
  // BASE_URL is './' for this build — resolve against the document (pilot
  // lesson: new URL with a relative base throws).
  const base = new URL(import.meta.env.BASE_URL ?? './', document.baseURI);
  return new URL(path, base).href;
}

export async function loadContent(): Promise<Content> {
  const [galaxiesRaw, missionsRaw] = await Promise.all([
    fetchJson(assetUrl('data/galaxies.json')),
    fetchJson(assetUrl('data/missions.json')),
  ]);

  const gWrap = asRecord(galaxiesRaw, 'galaxies.json');
  const gList = gWrap.galaxies;
  if (!Array.isArray(gList) || gList.length === 0) throw new ContentError('galaxies.json has no "galaxies" array.');
  const galaxies = gList.map(assertGalaxy);
  const galaxyIds = new Set(galaxies.map((g) => g.id));
  if (galaxyIds.size !== galaxies.length) throw new ContentError('galaxies.json has duplicate ids.');

  const mWrap = asRecord(missionsRaw, 'missions.json');
  const mList = mWrap.missions;
  if (!Array.isArray(mList) || mList.length === 0) throw new ContentError('missions.json has no "missions" array.');
  const missions = mList.map((m, i) => assertMission(m, i, galaxyIds));
  const missionIds = new Set(missions.map((m) => m.id));
  if (missionIds.size !== missions.length) throw new ContentError('missions.json has duplicate ids.');
  for (const g of galaxies) {
    if (!missions.some((m) => m.galaxyId === g.id)) {
      throw new ContentError(`galaxy ${g.id} has no missions.`);
    }
  }

  return { galaxies, missions };
}
