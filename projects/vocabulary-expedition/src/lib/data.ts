// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state loader: fetches the local JSON (static host), validates the
// whole contract at load time (dev AND runtime — cheap), and degrades to a
// clear message instead of a white screen (spec: runtime error → message).

import type { BBox, ItemData, SentenceData, UnitData, UnitsFile } from './types';

export class ContentError extends Error {}

export const DATA_URL = './data/units.json';

async function fetchJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ContentError(`Could not load the expedition journal (${url}). Check that the data folder is deployed.`);
  }
  if (!res.ok) throw new ContentError(`The expedition journal returned ${res.status} (${url}).`);
  try {
    return await res.json();
  } catch {
    throw new ContentError(`The expedition journal is not valid JSON (${url}).`);
  }
}

function str(v: unknown, where: string, field: string): string {
  if (typeof v !== 'string' || !v.trim()) throw new ContentError(`${where}: "${field}" must be a non-empty string.`);
  return v;
}

function assertBBox(raw: unknown, where: string): BBox {
  const n = (v: unknown, label: string) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new ContentError(`${where}: bbox ${label} is not a number.`);
    return v;
  };
  if (!Array.isArray(raw) || raw.length !== 4) throw new ContentError(`${where}: bbox must be [x, y, w, h].`);
  const [x, y, w, h] = [n(raw[0], 'x'), n(raw[1], 'y'), n(raw[2], 'w'), n(raw[3], 'h')];
  if (x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > 100.5 || y + h > 100.5) {
    throw new ContentError(`${where}: bbox [${x},${y},${w},${h}] falls outside the scene (0–100).`);
  }
  return [x, y, w, h];
}

/** Two hotspots may touch but not sit on top of each other (authoring guard). */
function assertNoBigOverlap(items: ItemData[], unitId: string): void {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i].bbox;
      const b = items[j].bbox;
      const ox = Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]));
      const oy = Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
      const inter = ox * oy;
      const minArea = Math.min(a[2] * a[3], b[2] * b[3]);
      if (inter > minArea * 0.25) {
        throw new ContentError(`unit "${unitId}": hotspots "${items[i].id}" and "${items[j].id}" overlap too much.`);
      }
    }
  }
}

function assertItem(raw: unknown, where: string): ItemData {
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: invalid item.`);
  const it = raw as Record<string, unknown>;
  return {
    id: str(it.id, where, 'id'),
    word: str(it.word, where, 'word'),
    translation: str(it.translation, where, 'translation'),
    say: str(it.say, where, 'say'),
    phrase: str(it.phrase, where, 'phrase'),
    clue: str(it.clue, where, 'clue'),
    bbox: assertBBox(it.bbox, where),
    asset: str(it.asset, where, 'asset'),
    audio: it.audio === null || it.audio === undefined ? null : String(it.audio),
  };
}

function assertSentence(raw: unknown, where: string, ids: Set<string>): SentenceData {
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: invalid sentence.`);
  const s = raw as Record<string, unknown>;
  const out: SentenceData = {
    id: str(s.id, where, 'id'),
    text: str(s.text, where, 'text'),
    answer: str(s.answer, where, 'answer'),
    distractors: [],
    full: str(s.full, where, 'full'),
    translation: str(s.translation, where, 'translation'),
  };
  if (!out.text.includes('___')) throw new ContentError(`${where}: "text" must contain ___ for the blank.`);
  if (!ids.has(out.answer)) throw new ContentError(`${where}: answer "${out.answer}" is not an item of this unit.`);
  if (!Array.isArray(s.distractors) || s.distractors.length === 0) {
    throw new ContentError(`${where}: needs at least one distractor chip.`);
  }
  for (const d of s.distractors) {
    const w = String(d);
    if (!ids.has(w)) throw new ContentError(`${where}: distractor "${w}" is not an item of this unit.`);
    if (w === out.answer) throw new ContentError(`${where}: distractor "${w}" equals the answer.`);
    out.distractors.push(w);
  }
  if (!out.full.includes('__NEVER__') && !out.full.trim()) throw new ContentError(`${where}: "full" is empty.`);
  return out;
}

function assertUnit(raw: unknown, index: number): UnitData {
  const where = `unit ${index}`;
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: invalid unit.`);
  const u = raw as Record<string, unknown>;
  if (!Array.isArray(u.items) || u.items.length < 4) {
    throw new ContentError(`${where}: needs at least 4 items.`);
  }
  const unit: UnitData = {
    id: str(u.id, where, 'id'),
    scene: str(u.scene, where, 'scene'),
    title: str(u.title, where, 'title'),
    nativeTitle: str(u.nativeTitle, where, 'nativeTitle'),
    mapPos: (() => {
      const p = u.mapPos;
      if (!Array.isArray(p) || p.length !== 2 || !p.every((n) => typeof n === 'number')) {
        throw new ContentError(`${where}: mapPos must be [x, y].`);
      }
      return [p[0] as number, p[1] as number];
    })(),
    mapBlurb: str(u.mapBlurb, where, 'mapBlurb'),
    items: u.items.map((it, i) => assertItem(it, `${where} item ${i}`)),
    clueItems: [],
    labelItems: [],
    sentences: [],
    distractors: Array.isArray(u.distractors) ? u.distractors.map(String) : [],
  };
  assertNoBigOverlap(unit.items, unit.id);
  const ids = new Set(unit.items.map((i) => i.id));
  const idList = (v: unknown, field: 'clueItems' | 'labelItems'): string[] => {
    if (!Array.isArray(v) || v.length === 0) throw new ContentError(`unit "${unit.id}": "${field}" must be a non-empty list.`);
    return v.map((x) => {
      const id = String(x);
      if (!ids.has(id)) throw new ContentError(`unit "${unit.id}": "${field}" names unknown item "${id}".`);
      return id;
    });
  };
  unit.clueItems = idList(u.clueItems, 'clueItems');
  unit.labelItems = idList(u.labelItems, 'labelItems');
  if (!Array.isArray(u.sentences) || u.sentences.length === 0) {
    throw new ContentError(`unit "${unit.id}": needs at least one sentence.`);
  }
  unit.sentences = u.sentences.map((s, i) => assertSentence(s, `unit "${unit.id}" sentence ${i}`, ids));
  return unit;
}

/** Load and fully validate the content file. Throws ContentError with a friendly message. */
export async function loadUnits(url: string = DATA_URL): Promise<UnitsFile> {
  const raw = await fetchJson(url);
  if (typeof raw !== 'object' || raw === null || !Array.isArray((raw as Record<string, unknown>).units)) {
    throw new ContentError('The expedition journal has no "units" list.');
  }
  const rawUnits = (raw as Record<string, unknown>).units as unknown[];
  const units = rawUnits.map((u, i) => assertUnit(u, i));
  if (units.length === 0) throw new ContentError('The expedition journal has no units.');
  const seen = new Set<string>();
  for (const u of units) {
    if (seen.has(u.id)) throw new ContentError(`Duplicate unit id "${u.id}".`);
    seen.add(u.id);
  }
  return {
    meta: {
      expedition: 'Vocabulary Expedition',
      target: 'English Pre-A1/A1',
      note: '',
    },
    units,
  };
}
