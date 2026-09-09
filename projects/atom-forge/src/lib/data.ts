// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state loader: fetches local JSON from the static host, validates the
// shape (dev-time contract), and degrades to a clear message instead of a
// white screen (spec: runtime error phải degrade thành message rõ).

import type { Content, ElementData, Mission, MissionFocus } from './types';

export class ContentError extends Error {}

const FOCUS: MissionFocus[] = ['build', 'shells', 'isotope', 'ion'];

async function fetchJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ContentError(`Could not load forge data (${url}). Is the build served from a static host?`);
  }
  if (!res.ok) throw new ContentError(`Forge data returned ${res.status} (${url}).`);
  try {
    return await res.json();
  } catch {
    throw new ContentError(`Forge data is not valid JSON (${url}).`);
  }
}

function assertElement(raw: unknown, i: number): ElementData {
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`element ${i} is not an object.`);
  const e = raw as Record<string, unknown>;
  if (typeof e.symbol !== 'string' || !/^[A-Z][a-z]?$/.test(e.symbol)) {
    throw new ContentError(`element ${i}: symbol "${String(e.symbol)}" is not a valid element symbol.`);
  }
  if (typeof e.atomicNumber !== 'number' || !Number.isInteger(e.atomicNumber) || e.atomicNumber < 1) {
    throw new ContentError(`element ${e.symbol}: atomicNumber must be a positive integer.`);
  }
  const z = e.atomicNumber as number;
  if (typeof e.name !== 'string' || !e.name) throw new ContentError(`element ${e.symbol}: missing name.`);
  if (
    !Array.isArray(e.commonIsotopes) ||
    e.commonIsotopes.length === 0 ||
    !e.commonIsotopes.every((a) => typeof a === 'number' && Number.isInteger(a) && a >= z)
  ) {
    throw new ContentError(`element ${e.symbol}: commonIsotopes must list mass numbers ≥ Z.`);
  }
  if (
    !Array.isArray(e.shellModel) ||
    e.shellModel.length === 0 ||
    !e.shellModel.every((n) => typeof n === 'number' && Number.isInteger(n) && n > 0)
  ) {
    throw new ContentError(`element ${e.symbol}: shellModel must be a non-empty occupancy array.`);
  }
  if (typeof e.note !== 'string') throw new ContentError(`element ${e.symbol}: missing note.`);
  return {
    symbol: e.symbol,
    atomicNumber: e.atomicNumber,
    name: e.name,
    commonIsotopes: e.commonIsotopes as number[],
    shellModel: e.shellModel as number[],
    note: e.note,
  };
}

function assertMission(raw: unknown, i: number): Mission {
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`mission ${i} is not an object.`);
  const m = raw as Record<string, unknown>;
  if (typeof m.id !== 'string' || !m.id) throw new ContentError(`mission ${i}: missing id.`);
  if (typeof m.title !== 'string' || !m.title) throw new ContentError(`mission "${m.id}": missing title.`);
  if (typeof m.focus !== 'string' || !FOCUS.includes(m.focus as MissionFocus)) {
    throw new ContentError(`mission "${m.id}": focus "${String(m.focus)}" is not one of ${FOCUS.join('/')}.`);
  }
  if (typeof m.brief !== 'string' || !m.brief) throw new ContentError(`mission "${m.id}": missing brief.`);
  if (typeof m.targetElement !== 'string' || !m.targetElement) {
    throw new ContentError(`mission "${m.id}": missing targetElement.`);
  }
  if (m.neutronCount !== undefined && (typeof m.neutronCount !== 'number' || !Number.isInteger(m.neutronCount) || m.neutronCount < 0)) {
    throw new ContentError(`mission "${m.id}": neutronCount must be a non-negative integer when present.`);
  }
  if (
    m.charge !== undefined &&
    (typeof m.charge !== 'number' || !Number.isInteger(m.charge) || Math.abs(m.charge as number) > 3)
  ) {
    throw new ContentError(`mission "${m.id}": charge must be an integer within ±3 when present.`);
  }
  return {
    id: m.id,
    title: m.title,
    focus: m.focus as MissionFocus,
    brief: m.brief,
    targetElement: m.targetElement,
    neutronCount: m.neutronCount as number | undefined,
    charge: m.charge as number | undefined,
  };
}

/** Build the data URL relative to the deployed base (subpath-safe, base './'). */
function assetUrl(path: string): string {
  const base = new URL(import.meta.env.BASE_URL ?? './', document.baseURI);
  return new URL(path, base).href;
}

export async function loadContent(): Promise<Content> {
  const [elementsRaw, missionsRaw] = await Promise.all([
    fetchJson(assetUrl('data/elements.json')),
    fetchJson(assetUrl('data/missions.json')),
  ]);

  const e = elementsRaw as { elements?: unknown };
  if (typeof e !== 'object' || e === null || !Array.isArray(e.elements) || e.elements.length === 0) {
    throw new ContentError('elements.json is missing a non-empty "elements" array.');
  }
  const elements = e.elements.map(assertElement);
  const byNumber = new Set(elements.map((el) => el.atomicNumber));
  for (let z = 1; z <= 20; z++) {
    if (!byNumber.has(z)) throw new ContentError(`elements.json must cover Z=${z} — the periodic strip shows the first 20.`);
  }

  const m = missionsRaw as { missions?: unknown };
  if (typeof m !== 'object' || m === null || !Array.isArray(m.missions) || m.missions.length === 0) {
    throw new ContentError('missions.json is missing a non-empty "missions" array.');
  }
  const missions = m.missions.map(assertMission);
  const symbols = new Set(elements.map((el) => el.symbol));
  for (const mission of missions) {
    if (!symbols.has(mission.targetElement)) {
      throw new ContentError(`mission "${mission.id}": target element "${mission.targetElement}" is not in elements.json.`);
    }
  }

  return { elements, missions };
}
