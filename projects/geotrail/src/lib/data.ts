// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state loader: fetches local JSON from the static bundle and
// validates shape + cross-refs + every clue/claim/compare margin (always —
// it is cheap). Bad data degrades to a clear message, never a white screen.
// The same validator runs in engine-sim.mjs against the shipped files.

import type { AtlasData, Clue, Place, Plate, PlateId, Trail, TrailStop } from './types';
import { clueHolds, correctAnswerId } from '../features/trail/engine';

export class ContentError extends Error {}

const PLATE_IDS: PlateId[] = ['sea', 'nile', 'andes', 'europe'];

/** Compare questions must have a clear margin (DD §3.5) — 15% or more. */
const COMPARE_MIN_RATIO = 1.15;

async function fetchJson(base: string, file: string): Promise<unknown> {
  const url = `${base}data/${file}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ContentError(`Could not load the atlas data (${file}).`);
  }
  if (!res.ok) throw new ContentError(`The atlas data returned ${res.status} (${file}).`);
  try {
    return await res.json();
  } catch {
    throw new ContentError(`The atlas data is not valid JSON (${file}).`);
  }
}

export async function loadAtlas(base: string): Promise<AtlasData> {
  const [platesDoc, placesDoc, trailsDoc] = await Promise.all([
    fetchJson(base, 'plates.json'),
    fetchJson(base, 'places.json'),
    fetchJson(base, 'trails.json'),
  ]);
  return validateAtlas(platesDoc, placesDoc, trailsDoc);
}

// ---- field helpers ---------------------------------------------------------

function str(v: unknown, where: string, field: string): string {
  if (typeof v !== 'string' || !v.trim()) throw new ContentError(`${where}: ${field} must be a non-empty string.`);
  return v;
}

function num(v: unknown, where: string, field: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new ContentError(`${where}: ${field} must be a number.`);
  return v;
}

function lonLat(v: unknown, where: string, field: string): [number, number] {
  if (!Array.isArray(v) || v.length !== 2 || v.some((n) => typeof n !== 'number' || !Number.isFinite(n))) {
    throw new ContentError(`${where}: ${field} must be a [lon, lat] pair.`);
  }
  return [v[0], v[1]];
}

function ring(v: unknown, where: string, field: string): [number, number][] {
  if (!Array.isArray(v) || v.length < 3) {
    throw new ContentError(`${where}: ${field} must be a polygon ring with at least 3 points.`);
  }
  return v.map((p, i) => lonLat(p, `${where} ${field}[${i}]`, 'point'));
}

function strArray(v: unknown, where: string, field: string): string[] {
  if (!Array.isArray(v) || v.length === 0 || v.some((s) => typeof s !== 'string' || !s)) {
    throw new ContentError(`${where}: ${field} must be a non-empty array of ids.`);
  }
  return v as string[];
}

/** Like strArray but the empty list is valid (islands have no neighbors). */
function idList(v: unknown, where: string, field: string): string[] {
  if (!Array.isArray(v) || v.some((s) => typeof s !== 'string' || !s)) {
    throw new ContentError(`${where}: ${field} must be an array of ids.`);
  }
  return v as string[];
}

function validateClue(v: unknown, where: string): Clue {
  if (typeof v !== 'object' || v === null) throw new ContentError(`${where}: not an object.`);
  const c = v as Record<string, unknown>;
  const kind = str(c.kind, where, 'kind');
  const withPlace = () => {
    const place = str(c.place, where, 'place');
    return { kind, place } as Clue;
  };
  switch (kind) {
    case 'borders':
    case 'north-of':
    case 'south-of':
    case 'east-of':
    case 'west-of':
      return withPlace();
    case 'coast':
    case 'landlocked':
      return { kind } as Clue;
    case 'feature':
      return { kind, value: str(c.value, where, 'value') } as Clue;
    case 'climate':
      return { kind, value: str(c.value, where, 'value') } as Clue;
    case 'area-under':
    case 'area-over':
      return { kind, km2: num(c.km2, where, 'km2') } as Clue;
    case 'peak-over':
    case 'peak-under':
      return { kind, m: num(c.m, where, 'm') } as Clue;
    default:
      throw new ContentError(`${where}: unknown clue kind "${kind}".`);
  }
}

// ---- plates ----------------------------------------------------------------

function validatePlates(raw: unknown): Plate[] {
  if (typeof raw !== 'object' || raw === null) throw new ContentError('plates.json: not an object.');
  const arr = (raw as Record<string, unknown>).plates;
  if (!Array.isArray(arr) || arr.length === 0) throw new ContentError('plates.json: needs a non-empty "plates" array.');
  const plates: Plate[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < arr.length; i++) {
    const where = `plate #${i}`;
    const p = arr[i];
    if (typeof p !== 'object' || p === null) throw new ContentError(`${where}: not an object.`);
    const o = p as Record<string, unknown>;
    const id = str(o.id, where, 'id') as PlateId;
    if (!PLATE_IDS.includes(id)) throw new ContentError(`${where}: unknown plate id "${id}".`);
    if (seen.has(id)) throw new ContentError(`${where}: duplicate plate id "${id}".`);
    seen.add(id);
    const bounds = o.bounds;
    if (!Array.isArray(bounds) || bounds.length !== 4 || bounds.some((n) => typeof n !== 'number')) {
      throw new ContentError(`${where}: bounds must be [lonMin, latMin, lonMax, latMax].`);
    }
    if (bounds[0] >= bounds[2] || bounds[1] >= bounds[3]) {
      throw new ContentError(`${where}: bounds are inverted.`);
    }
    const ctx = Array.isArray(o.context) ? o.context : [];
    const context = ctx.map((cm, j) => {
      const w = `${where} context #${j}`;
      if (typeof cm !== 'object' || cm === null) throw new ContentError(`${w}: not an object.`);
      const polysRaw = (cm as Record<string, unknown>).polys;
      if (!Array.isArray(polysRaw) || polysRaw.length === 0) {
        throw new ContentError(`${w}: needs at least one polygon.`);
      }
      return { id: str((cm as Record<string, unknown>).id, w, 'id'), polys: polysRaw.map((r, k) => ring(r, w, `polys[${k}]`)) };
    });
    const rivers = (Array.isArray(o.rivers) ? o.rivers : []).map((r, j) => {
      const w = `${where} river #${j}`;
      if (typeof r !== 'object' || r === null) throw new ContentError(`${w}: not an object.`);
      const lineRaw = (r as Record<string, unknown>).line;
      const line = Array.isArray(lineRaw) ? (lineRaw as unknown[]) : [];
      if (line.length < 2) throw new ContentError(`${w}: needs at least 2 points.`);
      return {
        id: str((r as Record<string, unknown>).id, w, 'id'),
        name: str((r as Record<string, unknown>).name, w, 'name'),
        line: line.map((p, k) => lonLat(p, w, `line[${k}]`)),
      };
    });
    const ranges = (Array.isArray(o.ranges) ? o.ranges : []).map((r, j) => {
      const w = `${where} range #${j}`;
      if (typeof r !== 'object' || r === null) throw new ContentError(`${w}: not an object.`);
      const lineRaw = (r as Record<string, unknown>).line;
      const line = Array.isArray(lineRaw) ? (lineRaw as unknown[]) : [];
      if (line.length < 2) throw new ContentError(`${w}: needs at least 2 points.`);
      return {
        id: str((r as Record<string, unknown>).id, w, 'id'),
        name: str((r as Record<string, unknown>).name, w, 'name'),
        line: line.map((p, k) => lonLat(p, w, `line[${k}]`)),
      };
    });
    const seas = (Array.isArray(o.seas) ? o.seas : []).map((s, j) => {
      const w = `${where} sea #${j}`;
      if (typeof s !== 'object' || s === null) throw new ContentError(`${w}: not an object.`);
      return { name: str((s as Record<string, unknown>).name, w, 'name'), at: lonLat((s as Record<string, unknown>).at, w, 'at') };
    });
    plates.push({
      id,
      numeral: str(o.numeral, where, 'numeral'),
      name: str(o.name, where, 'name'),
      caption: str(o.caption, where, 'caption'),
      bounds: [bounds[0], bounds[1], bounds[2], bounds[3]],
      context,
      rivers,
      ranges,
      seas,
    });
  }
  return plates;
}

// ---- places ----------------------------------------------------------------

function validatePlaces(raw: unknown, plates: Plate[]): Place[] {
  if (typeof raw !== 'object' || raw === null) throw new ContentError('places.json: not an object.');
  const arr = (raw as Record<string, unknown>).places;
  if (!Array.isArray(arr) || arr.length === 0) throw new ContentError('places.json: needs a non-empty "places" array.');
  const places: Place[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < arr.length; i++) {
    const where = `place #${i}`;
    const p = arr[i];
    if (typeof p !== 'object' || p === null) throw new ContentError(`${where}: not an object.`);
    const o = p as Record<string, unknown>;
    const id = str(o.id, where, 'id');
    if (seen.has(id)) throw new ContentError(`${where}: duplicate place id "${id}".`);
    seen.add(id);
    const plateId = str(o.plate, where, 'plate') as PlateId;
    const plate = plates.find((pl) => pl.id === plateId);
    if (!plate) throw new ContentError(`${where}: unknown plate "${plateId}".`);
    const centroid = lonLat(o.centroid, where, 'centroid');
    const PAD = 1.5;
    if (
      centroid[0] < plate.bounds[0] - PAD ||
      centroid[0] > plate.bounds[2] + PAD ||
      centroid[1] < plate.bounds[1] - PAD ||
      centroid[1] > plate.bounds[3] + PAD
    ) {
      throw new ContentError(`${where} (${id}): centroid ${centroid.join(',')} falls outside plate ${plateId}.`);
    }
    const polysRaw = o.polys;
    if (!Array.isArray(polysRaw) || polysRaw.length === 0) {
      throw new ContentError(`${where}: needs at least one polygon.`);
    }
    const polys = polysRaw.map((r, k) => ring(r, where, `polys[${k}]`));
    const features = Array.isArray(o.features) ? strArray(o.features, where, 'features') : [];
    if (features.includes('coast') && features.includes('landlocked')) {
      throw new ContentError(`${where} (${id}): a place cannot be both coast and landlocked.`);
    }
    const factsRaw = o.facts;
    if (typeof factsRaw !== 'object' || factsRaw === null) throw new ContentError(`${where}: missing facts.`);
    const f = factsRaw as Record<string, unknown>;
    const areaKm2 = num(f.areaKm2, where, 'facts.areaKm2');
    const populationM = num(f.populationM, where, 'facts.populationM');
    const highestPointM = num(f.highestPointM, where, 'facts.highestPointM');
    if (areaKm2 <= 0) throw new ContentError(`${where}: facts.areaKm2 must be positive.`);
    if (populationM <= 0) throw new ContentError(`${where}: facts.populationM must be positive.`);
    if (highestPointM <= 0) throw new ContentError(`${where}: facts.highestPointM must be positive.`);
    const place: Place = {
      id,
      name: str(o.name, where, 'name'),
      plate: plateId,
      centroid,
      polys,
      neighbors: Array.isArray(o.neighbors) ? idList(o.neighbors, where, 'neighbors') : [],
      features,
      facts: {
        capital: str(f.capital, where, 'facts.capital'),
        areaKm2,
        populationM,
        highestPointName: str(f.highestPointName, where, 'facts.highestPointName'),
        highestPointM,
        climate: str(f.climate, where, 'facts.climate'),
      },
      labelShift: Array.isArray(o.labelShift) ? lonLat(o.labelShift, where, 'labelShift') : undefined,
    };
    void (place as { labelShift?: [number, number] }).labelShift;
    places.push(place);
  }
  // neighbor symmetry + existence + same plate
  for (const p of places) {
    for (const n of p.neighbors) {
      const other = places.find((x) => x.id === n);
      if (!other) throw new ContentError(`${p.id}: neighbor "${n}" does not exist.`);
      if (other.plate !== p.plate) throw new ContentError(`${p.id}: neighbor "${n}" is on a different plate.`);
      if (!other.neighbors.includes(p.id)) {
        throw new ContentError(`${p.id} borders ${n}, but ${n} does not list ${p.id}. Neighbors must be symmetric.`);
      }
    }
  }
  return places;
}

// ---- trails ----------------------------------------------------------------

function validateStops(raw: unknown, where: string): TrailStop[] {
  if (!Array.isArray(raw) || raw.length < 4 || raw.length > 8) {
    throw new ContentError(`${where}: needs 4–8 stops.`);
  }
  return raw.map((s, i) => {
    const w = `${where} stop #${i}`;
    if (typeof s !== 'object' || s === null) throw new ContentError(`${w}: not an object.`);
    const o = s as Record<string, unknown>;
    const kind = str(o.kind, w, 'kind');
    const base = {
      id: str(o.id, w, 'id'),
      prompt: str(o.prompt, w, 'prompt'),
      hint: str(o.hint, w, 'hint'),
      feedbackCorrect: str(o.feedbackCorrect, w, 'feedbackCorrect'),
      at: str(o.at, w, 'at'),
      options: strArray(o.options, w, 'options'),
    };
    if (new Set(base.options).size !== base.options.length) {
      throw new ContentError(`${w}: options contain duplicates.`);
    }
    if (kind === 'locate' || kind === 'clue') {
      const answer = str(o.answer, w, 'answer');
      if (!base.options.includes(answer)) throw new ContentError(`${w}: options must include the answer.`);
      const claims = kind === 'locate' && Array.isArray(o.claims) ? (o.claims as unknown[]).map((c, j) => validateClue(c, `${w} claim[${j}]`)) : [];
      const clues = kind === 'clue' && Array.isArray(o.clues) ? (o.clues as unknown[]).map((c, j) => validateClue(c, `${w} clue[${j}]`)) : [];
      if (kind === 'clue' && clues.length < 2) throw new ContentError(`${w}: clue stops need at least 2 clues.`);
      if (kind === 'clue' && clues.length > 4) throw new ContentError(`${w}: at most 4 clues.`);
      return kind === 'locate'
        ? { ...base, kind: 'locate' as const, answer, claims }
        : { ...base, kind: 'clue' as const, answer, clues };
    }
    if (kind === 'compare') {
      const a = str(o.a, w, 'a');
      const b = str(o.b, w, 'b');
      const field = str(o.field, w, 'field');
      if (field !== 'areaKm2' && field !== 'populationM' && field !== 'highestPointM') {
        throw new ContentError(`${w}: field must be areaKm2, populationM or highestPointM.`);
      }
      const options = [...new Set(base.options)];
      if (options.length !== 2 || !options.includes(a) || !options.includes(b)) {
        throw new ContentError(`${w}: compare options must be exactly the two compared places.`);
      }
      return { ...base, kind: 'compare' as const, a, b, field };
    }
    throw new ContentError(`${w}: unknown stop kind "${kind}".`);
  });
}

function validateTrails(raw: unknown, places: Place[], plates: Plate[]): Trail[] {
  if (typeof raw !== 'object' || raw === null) throw new ContentError('trails.json: not an object.');
  const arr = (raw as Record<string, unknown>).trails;
  if (!Array.isArray(arr) || arr.length === 0) throw new ContentError('trails.json: needs a non-empty "trails" array.');
  const byId = new Map(places.map((p) => [p.id, p]));
  const stopIds = new Set<string>();
  const trails: Trail[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < arr.length; i++) {
    const where = `trail #${i}`;
    const t = arr[i];
    if (typeof t !== 'object' || t === null) throw new ContentError(`${where}: not an object.`);
    const o = t as Record<string, unknown>;
    const id = str(o.id, where, 'id');
    if (seen.has(id)) throw new ContentError(`${where}: duplicate trail id "${id}".`);
    seen.add(id);
    const plateId = str(o.plate, where, 'plate') as PlateId;
    if (!plates.some((pl) => pl.id === plateId)) throw new ContentError(`${where}: unknown plate "${plateId}".`);
    const stops = validateStops(o.stops, where);
    for (const s of stops) {
      if (stopIds.has(s.id)) throw new ContentError(`${where}: stop id "${s.id}" is used by another trail.`);
      stopIds.add(s.id);
    }
    trails.push({
      id,
      title: str(o.title, where, 'title'),
      subtitle: str(o.subtitle, where, 'subtitle'),
      plate: plateId,
      stops,
    });
  }

  // Cross-checks that need the place data: references, plate membership,
  // claim/clue truth, clue uniqueness, compare margins.
  for (const trail of trails) {
    for (const stop of trail.stops) {
      const w = `trail ${trail.id} stop ${stop.id}`;
      const refs = [stop.at, ...stop.options];
      if (stop.kind === 'compare') refs.push(stop.a, stop.b);
      else refs.push(stop.answer);
      for (const id of refs) {
        const place = byId.get(id);
        if (!place) throw new ContentError(`${w}: references unknown place "${id}".`);
        if (place.plate !== trail.plate) {
          throw new ContentError(`${w}: place "${id}" is not on plate ${trail.plate}.`);
        }
      }
      if (stop.kind === 'locate') {
        const answer = byId.get(stop.answer)!;
        for (const claim of stop.claims) {
          if (!clueHolds(claim, answer, byId)) {
            throw new ContentError(`${w}: locate claim "${claim.kind}" does not hold for ${answer.name}.`);
          }
        }
      }
      if (stop.kind === 'clue') {
        const answer = byId.get(stop.answer)!;
        for (const clue of stop.clues) {
          if (!clueHolds(clue, answer, byId)) {
            throw new ContentError(`${w}: clue "${clue.kind}" does not hold for ${answer.name}.`);
          }
        }
        // With every clue revealed, exactly one option must qualify.
        const fitting = stop.options.filter((id) => {
          const place = byId.get(id)!;
          return stop.clues.every((c) => clueHolds(c, place, byId));
        });
        if (fitting.length !== 1 || fitting[0] !== stop.answer) {
          throw new ContentError(
            `${w}: clue set is not unambiguous — options fitting all clues: [${fitting.join(', ')}].`,
          );
        }
      }
      if (stop.kind === 'compare') {
        const a = byId.get(stop.a)!;
        const b = byId.get(stop.b)!;
        const ratio = Math.max(a.facts[stop.field], b.facts[stop.field]) /
          Math.min(a.facts[stop.field], b.facts[stop.field]);
        if (ratio < COMPARE_MIN_RATIO) {
          throw new ContentError(`${w}: values are too close (ratio ${ratio.toFixed(2)}) — keep a clear margin.`);
        }
        void correctAnswerId;
      }
    }
  }
  return trails;
}

// ---- entry -----------------------------------------------------------------

export function validateAtlas(
  platesRaw: unknown,
  placesRaw: unknown,
  trailsRaw: unknown,
): AtlasData {
  const plates = validatePlates(platesRaw);
  const places = validatePlaces(placesRaw, plates);
  const trails = validateTrails(trailsRaw, places, plates);
  return { plates, places, trails };
}
