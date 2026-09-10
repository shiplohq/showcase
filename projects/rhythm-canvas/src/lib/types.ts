// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Shared content types — the whole exhibit is driven by data/tracks.json
// (spec state model: content state comes from JSON, never hard-coded).

export type ModeId = 'pulse' | 'orbit' | 'type';

/** Drum event: step `i` (0..15 inside the bar) at velocity `v` (0..1). */
export interface DrumHit {
  i: number;
  v: number;
}

/** Note event: drum hit plus semitone offset `n` from the track root. */
export interface NoteHit extends DrumHit {
  n: number;
  /** Gate length in 16th steps (default 1). */
  len?: number;
}

export interface TrackPattern {
  kick: DrumHit[];
  snare: DrumHit[];
  hat: DrumHit[];
  bass: NoteHit[];
  pluck: NoteHit[];
}

export interface TrackSection {
  from: number;
  to: number;
  mode: ModeId;
  energy: number;
  label: string;
}

export interface TrackDef {
  id: string;
  title: string;
  subtitle: string;
  bpm: number;
  beatsPerBar: number;
  bars: number;
  /** Precomputed beat timestamps in seconds — the deterministic clock (spec). */
  beats: number[];
  duration: number;
  root: number;
  scale: number[];
  sections: TrackSection[];
  pattern: TrackPattern;
  tokens: string[];
}

export interface ShortcutCopy {
  keys: string;
  action: string;
}

export interface ModeCopy {
  id: ModeId;
  key: string;
  label: string;
  blurb: string;
}

export interface AppCopy {
  appTitle: string;
  tagline: string;
  stageHint: string;
  playCta: string;
  aboutTitle: string;
  aboutBody: string[];
  aboutClientOnly: string;
  aboutMotion: string;
  shortcutsTitle: string;
  shortcuts: ShortcutCopy[];
  modes: ModeCopy[];
  autoLabel: string;
  manualLabel: string;
  motionLabel: string;
  motionOn: string;
  motionOff: string;
  loopLabel: string;
  trackLabel: string;
  resetLabel: string;
  errorTitle: string;
  errorBody: string;
  sectionLabel: string;
  barLabel: string;
  beatLabel: string;
}

export interface TracksFile {
  schema: number;
  copy: AppCopy;
  tracks: TrackDef[];
}
