// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state types mirroring public/data/units.json (the JSON contract from
// the spec: units → scenes, items{id,word,translation,bbox,asset,audio?},
// sentences, distractors). Content lives in JSON; code only consumes it.

/** Bounding box of a hotspot: [x, y, w, h] in percent of the 1200x800 scene viewBox (each 0–100). */
export type BBox = [number, number, number, number];

export interface ItemData {
  id: string;
  /** The English word being learned. */
  word: string;
  /** Vietnamese support translation (layer can be toggled off). */
  translation: string;
  /** Simple phonetic respelling shown on the caption plate. */
  say: string;
  /** A tiny collocation using the word. */
  phrase: string;
  /** The riddle used by the clue hunt. */
  clue: string;
  /** Hotspot box — must match the item group placement in the scene SVG. */
  bbox: BBox;
  /** Symbolic pointer to the art group inside the scene component (e.g. "scene:kitchen#kettle"). */
  asset: string;
  /** Bundled audio file — intentionally null in v1 (no TTS dependency; say/phrase carry the sound layer). */
  audio: string | null;
}

export interface SentenceData {
  id: string;
  /** Sentence with ___ where the magnetic word goes. */
  text: string;
  /** item id of the answer word. */
  answer: string;
  /** item ids used as wrong magnetic chips. */
  distractors: string[];
  /** The assembled correct sentence. */
  full: string;
  translation: string;
}

export interface UnitData {
  id: string;
  /** Scene key → art component in src/features/scenes/. */
  scene: string;
  title: string;
  /** Vietnamese scene name (always rendered in Andika — never Caveat). */
  nativeTitle: string;
  /** Marker position on the world map, percent of the map viewBox. */
  mapPos: [number, number];
  mapBlurb: string;
  items: ItemData[];
  /** Item ids used by the clue hunt. */
  clueItems: string[];
  /** Item ids used by the label match. */
  labelItems: string[];
  sentences: SentenceData[];
  /** Reserve words (not items) — never label targets, documented for the JSON contract. */
  distractors: string[];
}

export interface UnitsFile {
  meta: { expedition: string; target: string; note: string };
  units: UnitData[];
}

/** Feedback is always one of these — 'nudge' is gentle, never punitive. */
export type Feedback = 'idle' | 'correct' | 'nudge';
