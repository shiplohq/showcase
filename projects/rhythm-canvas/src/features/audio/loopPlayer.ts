// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Loop player — the deterministic transport. All timing derives from one
// anchor: the AudioContext time that equals loop position zero. The visual
// clock and the audio scheduler read the same anchor, so canvas and speakers
// can never drift apart (spec: sync from precomputed beats, not frame counts).

import type { TrackDef } from '../../lib/types';
import { sectionAt, stepDuration } from '../engine/beatClock';
import { LOOKAHEAD_TICK, type SynthEngine } from './synth';

function firstStepAfter(playhead: number, sd: number): number {
  return Math.max(0, Math.ceil(playhead / sd - 1e-9));
}

const LOOKAHEAD_S = 0.12;
// Background tabs clamp timers to ~1 s — widen the horizon so the loop
// keeps scheduling seamlessly while hidden.
const LOOKAHEAD_HIDDEN_S = 1.2;

function lookahead(): number {
  return typeof document !== 'undefined' && document.hidden ? LOOKAHEAD_HIDDEN_S : LOOKAHEAD_S;
}

export class LoopPlayer {
  private anchor = 0;
  private nextStep = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private stoppedAt = 0;
  playing = false;

  constructor(private synth: SynthEngine) {}

  /** Start (or restart) playback of `track` from `fromPlayhead` seconds. */
  start(track: TrackDef, fromPlayhead: number): void {
    const ctx = this.synth.ensure();
    this.stopTimer();
    this.anchor = ctx.currentTime - fromPlayhead;
    // Resume/seek must re-derive the step cursor from the new anchor, or a
    // stale cursor schedules a burst of past-due notes at once.
    this.nextStep = firstStepAfter(fromPlayhead, stepDuration(track));
    this.playing = true;
    this.scheduleAhead(track, ctx.currentTime);
    this.timer = setInterval(() => {
      const c = this.synth.context;
      if (!c || !this.playing) return;
      this.scheduleAhead(track, c.currentTime);
    }, LOOKAHEAD_TICK);
  }

  /** Stop scheduling; returns the playhead position to resume from. */
  pause(track: TrackDef): number {
    const at = this.playhead(track);
    this.playing = false;
    this.stopTimer();
    this.stoppedAt = Math.min(at, track.duration - 1e-4);
    return this.stoppedAt;
  }

  /** Current loop position in seconds — the app's single playhead read. */
  playhead(track: TrackDef): number {
    if (!this.playing) return this.stoppedAt;
    const now = this.synth.now();
    const raw = now - this.anchor;
    const d = track.duration;
    return ((raw % d) + d) % d;
  }

  /** Jump to a position (scrub); keeps playing if it was playing. */
  seek(track: TrackDef, to: number, wasPlaying: boolean): void {
    const target = Math.min(Math.max(to, 0), track.duration - 1e-4);
    this.stoppedAt = target;
    if (wasPlaying) {
      this.start(track, target);
    }
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private scheduleAhead(track: TrackDef, now: number): void {
    const sd = stepDuration(track);
    const stepsPerLoop = track.beats.length * 4;
    while (this.anchor + this.nextStep * sd < now + lookahead()) {
      const t = this.anchor + this.nextStep * sd;
      const loopStep = (((this.nextStep % stepsPerLoop) + stepsPerLoop) % stepsPerLoop) | 0;
      const stepInBar = loopStep % 16;
      const beatIdx = Math.floor(loopStep / 4);
      const { section } = sectionAt(track, beatIdx);
      this.synth.scheduleStep(track, stepInBar, t, section.energy, sd);
      this.nextStep++;
    }
  }
}
