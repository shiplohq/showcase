// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure beat clock — no DOM, no AudioContext. Everything visual derives from
// the precomputed beats[] array (spec: deterministic sync, no frame counting).
// Also owns dev-time validation of the JSON score; failures degrade to an
// error plaque in the loader, never a white screen.

import type { ModeId, TrackDef, TrackSection, TracksFile } from '../../lib/types';

export interface ClockState {
  /** Seconds inside the loop, [0, duration). */
  playhead: number;
  /** Beat index inside the loop (0-based). */
  beatIndex: number;
  /** Beat position inside the bar (0-based). */
  beatInBar: number;
  /** Bar index inside the loop (0-based). */
  bar: number;
  /** Progress inside the current beat, 0..1. */
  beatPhase: number;
  /** 16th-step index inside the bar, 0..15. */
  step: number;
  sectionIndex: number;
  section: TrackSection;
}

export const MODE_IDS: readonly ModeId[] = ['pulse', 'orbit', 'type'];

export function beatSpacing(bpm: number): number {
  return 60 / bpm;
}

export function stepDuration(track: TrackDef): number {
  return beatSpacing(track.bpm) / 4;
}

/** Binary-search the last beat at or before `playhead` (beats are sorted). */
export function beatIndexAt(track: TrackDef, playhead: number): number {
  const beats = track.beats;
  let lo = 0;
  let hi = beats.length - 1;
  let found = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (beats[mid] <= playhead) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

export function sectionAt(track: TrackDef, beatIndex: number): { section: TrackSection; index: number } {
  let index = 0;
  for (let s = 0; s < track.sections.length; s++) {
    if (beatIndex >= track.sections[s].from && beatIndex < track.sections[s].to) {
      index = s;
      break;
    }
  }
  return { section: track.sections[index], index };
}

/** Full deterministic read of the loop at a playhead position. */
export function clockAt(track: TrackDef, playhead: number): ClockState {
  const clamped = Math.min(Math.max(playhead, 0), Math.max(track.duration - 1e-6, 0));
  const beatIndex = beatIndexAt(track, clamped);
  const spacing = beatSpacing(track.bpm);
  const beatTime = track.beats[beatIndex];
  const beatPhase = Math.min(Math.max((clamped - beatTime) / spacing, 0), 1);
  const beatInBar = beatIndex % track.beatsPerBar;
  const bar = Math.floor(beatIndex / track.beatsPerBar);
  const step = Math.min(15, Math.floor(beatPhase * 4));
  const { section, index } = sectionAt(track, beatIndex);
  return { playhead: clamped, beatIndex, beatInBar, bar, beatPhase, step, sectionIndex: index, section };
}

// ---------------------------------------------------------------------------
// Validation (dev-time contract check on the loaded JSON)
// ---------------------------------------------------------------------------

export interface ValidationOutcome {
  file: TracksFile | null;
  issues: string[];
}

function isNum(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

function checkEvents(list: unknown, name: string, maxStep: number, withNote: boolean, issues: string[]): void {
  if (!Array.isArray(list)) {
    issues.push(`pattern.${name}: expected an array`);
    return;
  }
  for (const ev of list) {
    if (typeof ev !== 'object' || ev === null) {
      issues.push(`pattern.${name}: event is not an object`);
      continue;
    }
    const e = ev as Record<string, unknown>;
    if (!isNum(e.i) || e.i < 0 || e.i >= maxStep) issues.push(`pattern.${name}: step out of 0..${maxStep - 1}`);
    if (!isNum(e.v) || e.v < 0 || e.v > 1) issues.push(`pattern.${name}: velocity out of 0..1`);
    if (withNote && !isNum(e.n)) issues.push(`pattern.${name}: missing semitone n`);
  }
}

export function validateTracksFile(raw: unknown): ValidationOutcome {
  const issues: string[] = [];
  if (typeof raw !== 'object' || raw === null) return { file: null, issues: ['root: not an object'] };
  const f = raw as Partial<TracksFile>;

  if (f.schema !== 1) issues.push('schema: expected 1');
  const copy = f.copy;
  if (typeof copy !== 'object' || copy === null || !copy.appTitle) {
    issues.push('copy: missing app copy block');
  }
  if (!Array.isArray(f.tracks) || f.tracks.length === 0) {
    issues.push('tracks: expected at least one track');
    return { file: null, issues };
  }

  for (let t = 0; t < f.tracks.length; t++) {
    const track = f.tracks[t];
    const id = track?.id ?? `#${t}`;
    if (!track.title) issues.push(`${id}: missing title`);
    if (!isNum(track.bpm) || track.bpm < 40 || track.bpm > 220) issues.push(`${id}: bpm out of 40..220`);
    if (!isNum(track.beatsPerBar) || track.beatsPerBar < 2 || track.beatsPerBar > 8) issues.push(`${id}: beatsPerBar out of 2..8`);
    if (!isNum(track.bars) || track.bars < 1 || track.bars > 64) issues.push(`${id}: bars out of 1..64`);
    if (!Array.isArray(track.beats) || track.beats.length === 0) {
      issues.push(`${id}: beats array missing`);
    } else {
      const expected = (track.bars ?? 1) * (track.beatsPerBar ?? 4);
      if (track.beats.length !== expected) issues.push(`${id}: expected ${expected} beats, got ${track.beats.length}`);
      const spacing = beatSpacing(track.bpm ?? 120);
      for (let b = 0; b < track.beats.length; b++) {
        if (!isNum(track.beats[b])) {
          issues.push(`${id}: beats[${b}] not a number`);
          break;
        }
        if (b > 0 && track.beats[b] - track.beats[b - 1] < 0) {
          issues.push(`${id}: beats not sorted at ${b}`);
          break;
        }
        if (Math.abs(track.beats[b] - b * spacing) > 0.02) {
          issues.push(`${id}: beats[${b}] drifts from ${track.bpm} bpm grid`);
          break;
        }
      }
      const expectedDur = track.beats.length * spacing;
      if (!isNum(track.duration) || Math.abs(track.duration - expectedDur) > 0.05) {
        issues.push(`${id}: duration should be ~${expectedDur.toFixed(4)}s`);
      }
    }
    if (!isNum(track.root) || track.root < 20 || track.root > 200) issues.push(`${id}: root out of 20..200 Hz`);
    if (!Array.isArray(track.scale) || track.scale.length === 0) issues.push(`${id}: scale missing`);
    if (!Array.isArray(track.tokens) || track.tokens.some((w) => typeof w !== 'string' || !w)) {
      issues.push(`${id}: tokens missing or invalid`);
    }
    if (!Array.isArray(track.sections) || track.sections.length === 0) {
      issues.push(`${id}: sections missing`);
    } else {
      const beatsLen = Array.isArray(track.beats) ? track.beats.length : 0;
      for (const s of track.sections) {
        if (!isNum(s.from) || !isNum(s.to) || s.from < 0 || s.to > beatsLen || s.from >= s.to) {
          issues.push(`${id}: section range ${s.from}..${s.to} invalid for ${beatsLen} beats`);
        }
        if (!MODE_IDS.includes(s.mode)) issues.push(`${id}: unknown section mode ${String(s.mode)}`);
        if (!isNum(s.energy) || s.energy < 0 || s.energy > 1) issues.push(`${id}: section energy out of 0..1`);
      }
    }
    const p = track.pattern;
    if (typeof p !== 'object' || p === null) {
      issues.push(`${id}: pattern missing`);
    } else {
      checkEvents(p.kick, `${id} kick`, 16, false, issues);
      checkEvents(p.snare, `${id} snare`, 16, false, issues);
      checkEvents(p.hat, `${id} hat`, 16, false, issues);
      checkEvents(p.bass, `${id} bass`, 16, true, issues);
      checkEvents(p.pluck, `${id} pluck`, 16, true, issues);
    }
  }

  if (issues.length > 0) return { file: null, issues };
  return { file: f as TracksFile, issues };
}
