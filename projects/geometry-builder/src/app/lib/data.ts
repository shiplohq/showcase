// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

/**
 * Content loader — fetches the local JSON content (public/data/*.json),
 * validates it at dev-time with the pure engine validators, and exposes it to
 * the app. Content is data-only: a new mission is added by adding JSON, never
 * by touching components (spec: 3-layer state).
 *
 * URLs are document-relative so the artifact works from any base path
 * (pilot #01 lesson: never build absolute paths from BASE_URL).
 */

import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import {
  normalizeWinding,
  validateMission,
  validateShapes,
  type Mission,
  type ShapeDef,
  type ShapeMap,
  type TrackId,
} from '../features/workbench/engine';

export interface ContentData {
  shapes: ShapeMap;
  shapeList: ShapeDef[];
  missions: Mission[];
}

export interface ContentError {
  message: string;
  details: string[];
}

export const TRACK_LABELS: Record<TrackId, string> = {
  houses: 'Houses',
  bridges: 'Bridges',
  robots: 'Robots',
};

export const PROPERTY_LABELS: Record<string, string> = {
  'right-angle': 'Right angles',
  'parallel-lines': 'Parallel sides',
  'one-pair-parallel': 'Exactly one pair of parallel sides',
  'six-sides': 'Six sides',
  symmetry: 'Mirror symmetry',
};

function relativeUrl(doc: Document, path: string): string {
  // document-relative: works at root, sub-path and local dev
  return new URL(path, doc.baseURI).href;
}

export async function loadContent(): Promise<ContentData> {
  const doc = inject(DOCUMENT);
  const [shapesRes, missionsRes] = await Promise.all([
    fetch(relativeUrl(doc, 'data/shapes.json')),
    fetch(relativeUrl(doc, 'data/challenges.json')),
  ]);
  if (!shapesRes.ok || !missionsRes.ok) {
    throw new Error(`Could not load blueprint data (shapes: ${shapesRes.status}, challenges: ${missionsRes.status}).`);
  }
  const shapesJson = (await shapesRes.json()) as { shapes: ShapeDef[] };
  const missionsJson = (await missionsRes.json()) as { missions: Mission[] };

  // Normalize winding so oriented-edge outline computation is valid.
  const shapeList = shapesJson.shapes.map((s) => ({ ...s, pts: normalizeWinding(s.pts.map((p) => ({ ...p }))) }));
  const shapes: ShapeMap = new Map(shapeList.map((s) => [s.id, s]));

  const details: string[] = [
    ...validateShapes(shapeList),
    ...missionsJson.missions.flatMap((m) => validateMission(m, shapes)),
  ];
  if (details.length > 0) {
    const err: ContentError = {
      message: 'The blueprint data failed validation.',
      details: details.slice(0, 6),
    };
    throw new Error(`${err.message} ${err.details.join(' | ')}`);
  }
  return { shapes, shapeList, missions: missionsJson.missions };
}

/** App-wide content state (loaded once at startup). */
export class ContentStore {
  private readonly _state = signal<{ status: 'loading' | 'ready' | 'error'; data: ContentData | null; error: string | null }>({
    status: 'loading',
    data: null,
    error: null,
  });
  readonly state = this._state.asReadonly();

  async init(): Promise<void> {
    try {
      const data = await loadContent();
      this._state.set({ status: 'ready', data, error: null });
    } catch (e) {
      this._state.set({ status: 'error', data: null, error: e instanceof Error ? e.message : String(e) });
    }
  }
}
