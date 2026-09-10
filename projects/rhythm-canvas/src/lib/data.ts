// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content loader: everything comes from data/tracks.json (content state per
// spec). Validation runs at load time; failures degrade to an error plaque.

import type { TracksFile } from './types';
import { validateTracksFile } from '../features/engine/beatClock';

export type LoadResult =
  | { ok: true; file: TracksFile }
  | { ok: false; error: string; issues: string[] };

export async function loadTracks(): Promise<LoadResult> {
  try {
    // Pilot #01 lesson: with base './', new URL(path, import.meta.url) breaks;
    // public assets resolve against the document via import.meta.env.BASE_URL.
    const base = import.meta.env.BASE_URL ?? './';
    const res = await fetch(`${base}data/tracks.json`);
    if (!res.ok) throw new Error(`data/tracks.json → HTTP ${res.status}`);
    const raw: unknown = await res.json();
    const { file, issues } = validateTracksFile(raw);
    if (!file) {
      return { ok: false, error: 'tracks.json failed validation', issues };
    }
    return { ok: true, file };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err), issues: [] };
  }
}
