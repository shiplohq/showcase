// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state loader: fetches local JSON from the static bundle, validates
// shape (always — it is cheap), degrades to a clear message instead of a
// white screen (spec). No cross-origin fetches, no API.

import type { LabData, OrganDef, PathwayDef, QuizQuestion, StopDef, SystemDef, SystemId } from './types';

export class ContentError extends Error {}

const SYSTEM_IDS: SystemId[] = ['skeletal', 'circulatory', 'respiratory', 'digestive', 'nervous'];
const SYSTEM_INKS = ['slate', 'sage', 'oxblood'];
const SIDES = ['left', 'right'];

async function fetchJson(base: string, file: string): Promise<unknown> {
  const url = `${base}data/${file}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ContentError(`Could not load the lab data (${file}).`);
  }
  if (!res.ok) throw new ContentError(`The lab data returned ${res.status} (${file}).`);
  try {
    return await res.json();
  } catch {
    throw new ContentError(`The lab data is not valid JSON (${file}).`);
  }
}

function str(v: unknown, where: string, field: string): string {
  if (typeof v !== 'string' || !v.trim()) throw new ContentError(`${where}: ${field} must be a non-empty string.`);
  return v;
}

function num(v: unknown, where: string, field: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new ContentError(`${where}: ${field} must be a number.`);
  return v;
}

function point(v: unknown, where: string, field: string): [number, number] {
  if (!Array.isArray(v) || v.length !== 2 || v.some((n) => typeof n !== 'number' || !Number.isFinite(n))) {
    throw new ContentError(`${where}: ${field} must be a [x, y] pair.`);
  }
  return [v[0], v[1]];
}

function validateSystem(raw: unknown, index: number): SystemDef {
  const where = `system #${index}`;
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: not an object.`);
  const s = raw as Record<string, unknown>;
  const id = str(s.id, where, 'id') as SystemId;
  if (!SYSTEM_IDS.includes(id)) throw new ContentError(`${where}: unknown system id "${id}".`);
  if (!Array.isArray(s.organs) || s.organs.length < 2) {
    throw new ContentError(`${where}: needs at least 2 organs.`);
  }
  const organs = s.organs.map((o, i) => validateOrgan(o, `${where} organ #${i}`));
  return {
    id,
    name: str(s.name, where, 'name'),
    tagline: str(s.tagline, where, 'tagline'),
    organs,
  };
}

function validateOrgan(raw: unknown, where: string): OrganDef {
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: not an object.`);
  const o = raw as Record<string, unknown>;
  const labelRaw = o.label as Record<string, unknown> | undefined;
  if (typeof labelRaw !== 'object' || labelRaw === null) throw new ContentError(`${where}: missing label.`);
  if (!SIDES.includes(labelRaw.side as string)) {
    throw new ContentError(`${where}: label.side must be "left" or "right".`);
  }
  if (!Array.isArray(o.facts) || o.facts.length < 2 || o.facts.some((f) => typeof f !== 'string' || !f)) {
    throw new ContentError(`${where}: needs at least 2 non-empty facts.`);
  }
  return {
    id: str(o.id, where, 'id'),
    name: str(o.name, where, 'name'),
    pathId: str(o.pathId, where, 'pathId'),
    function: str(o.function, where, 'function'),
    facts: (o.facts as string[]).map(String),
    label: {
      side: labelRaw.side as 'left' | 'right',
      y: num(labelRaw.y, where, 'label.y'),
      anchor: point(labelRaw.anchor, where, 'label.anchor'),
    },
  };
}

function validateStop(raw: unknown, index: number): StopDef {
  const where = `stop #${index}`;
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: not an object.`);
  const t = raw as Record<string, unknown>;
  const stop: StopDef = {
    id: str(t.id, where, 'id'),
    name: str(t.name, where, 'name'),
    node: point(t.node, where, 'node'),
    blurb: str(t.blurb, where, 'blurb'),
  };
  if (t.organId !== undefined) stop.organId = str(t.organId, where, 'organId');
  return stop;
}

function validatePathway(raw: unknown, index: number): PathwayDef {
  const where = `pathway #${index}`;
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: not an object.`);
  const p = raw as Record<string, unknown>;
  if (!Array.isArray(p.steps) || p.steps.length < 3) {
    throw new ContentError(`${where}: needs at least 3 steps.`);
  }
  if (!SYSTEM_INKS.includes(p.ink as string)) {
    throw new ContentError(`${where}: ink must be one of ${SYSTEM_INKS.join('/')}.`);
  }
  const steps = (p.steps as Record<string, unknown>[]).map((step, i) => ({
    stop: str(step.stop, `${where} step #${i}`, 'stop'),
    explanation: str(step.explanation, `${where} step #${i}`, 'explanation'),
  }));
  return {
    id: str(p.id, where, 'id'),
    title: str(p.title, where, 'title'),
    subtitle: str(p.subtitle, where, 'subtitle'),
    intro: str(p.intro, where, 'intro'),
    ink: p.ink as string,
    steps,
    recap: str(p.recap, where, 'recap'),
  };
}

function validateQuestion(raw: unknown, index: number): QuizQuestion {
  const where = `question #${index}`;
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: not an object.`);
  const q = raw as Record<string, unknown>;
  const options = q.options;
  if (!Array.isArray(options) || options.length !== 4 || options.some((o) => typeof o !== 'string' || !o)) {
    throw new ContentError(`${where}: needs exactly 4 non-empty options.`);
  }
  const answer = num(q.answer, where, 'answer');
  if (!Number.isInteger(answer) || answer < 0 || answer > 3) {
    throw new ContentError(`${where}: answer must be an option index 0-3.`);
  }
  return {
    id: str(q.id, where, 'id'),
    prompt: str(q.prompt, where, 'prompt'),
    options: (options as string[]).map(String),
    answer,
    explain: str(q.explain, where, 'explain'),
  };
}

export async function loadLab(base: string): Promise<LabData> {
  const [systemsDoc, pathwaysDoc, quizDoc] = await Promise.all([
    fetchJson(base, 'systems.json'),
    fetchJson(base, 'pathways.json'),
    fetchJson(base, 'quiz.json'),
  ]);
  return parseLabData(systemsDoc, pathwaysDoc, quizDoc);
}

/**
 * Pure validation of the three content documents — the same path the browser
 * takes on load, reusable headlessly by scripts/engine-sim.mjs.
 */
export function parseLabData(
  systemsDoc: unknown,
  pathwaysDoc: unknown,
  quizDoc: unknown,
): LabData {

  const systemsRaw = (systemsDoc as Record<string, unknown>).systems;
  if (!Array.isArray(systemsRaw) || systemsRaw.length !== SYSTEM_IDS.length) {
    throw new ContentError(`systems.json: expected ${SYSTEM_IDS.length} systems.`);
  }
  const systems = systemsRaw.map((s, i) => validateSystem(s, i));
  const ids = new Set(systems.map((s) => s.id));
  if (ids.size !== systems.length) throw new ContentError('systems.json: duplicate system ids.');

  const organIds = new Set<string>();
  const organPathIds = new Set<string>();
  for (const sys of systems) {
    for (const organ of sys.organs) {
      if (organIds.has(organ.id)) throw new ContentError(`Duplicate organ id "${organ.id}".`);
      if (organPathIds.has(organ.pathId)) throw new ContentError(`Duplicate pathId "${organ.pathId}".`);
      organIds.add(organ.id);
      organPathIds.add(organ.pathId);
    }
  }

  const stopsRaw = (pathwaysDoc as Record<string, unknown>).stops;
  if (!Array.isArray(stopsRaw) || stopsRaw.length < 3) {
    throw new ContentError('pathways.json: needs at least 3 stops.');
  }
  const stops = stopsRaw.map((t, i) => validateStop(t, i));
  const stopIds = new Set(stops.map((t) => t.id));
  if (stopIds.size !== stops.length) throw new ContentError('pathways.json: duplicate stop ids.');
  for (const stop of stops) {
    if (stop.organId !== undefined && !organIds.has(stop.organId)) {
      throw new ContentError(`stop "${stop.id}": organId "${stop.organId}" does not exist.`);
    }
  }

  const pathwaysRaw = (pathwaysDoc as Record<string, unknown>).pathways;
  if (!Array.isArray(pathwaysRaw) || pathwaysRaw.length < 2) {
    throw new ContentError('pathways.json: needs at least 2 pathways.');
  }
  const pathways = pathwaysRaw.map((p, i) => validatePathway(p, i));
  for (const p of pathways) {
    for (const step of p.steps) {
      if (!stopIds.has(step.stop)) {
        throw new ContentError(`pathway "${p.id}": unknown stop "${step.stop}".`);
      }
    }
  }

  const quizRaw = (quizDoc as Record<string, unknown>).quiz;
  if (!Array.isArray(quizRaw) || quizRaw.length < 4) {
    throw new ContentError('quiz.json: needs at least 4 questions.');
  }
  const quiz = quizRaw.map((q, i) => validateQuestion(q, i));

  return { systems, stops, pathways, quiz };
}
