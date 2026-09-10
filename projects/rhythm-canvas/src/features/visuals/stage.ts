// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Canvas stage — the poster's kinetic plate. Every renderer is a pure
// function of the deterministic clock (playhead → beats[]), so a frame at
// time T looks identical no matter when it is drawn: pausing, seeking and
// reduced-motion static frames all stay honest. The only live audio input is
// the analyser spectrum (low bins for the pulse dial, bars for Type mode) —
// and it is omitted entirely in the static reduced-motion poster.

import type { ClockState } from '../engine/beatClock';
import type { ModeId, TrackDef } from '../../lib/types';

export interface Accent {
  x: number;
  y: number;
  /** Playhead timestamp of the tap (seconds). */
  t: number;
}

export interface RenderState {
  track: TrackDef;
  clock: ClockState;
  mode: ModeId;
  spectrum: Uint8Array | null;
  accents: Accent[];
  /** True before the very first play — draw the idle poster. */
  idle: boolean;
  /** 0..1 intro blend after a mode switch (spatial continuity, no snapshots). */
  modeBlend: number;
}

const ACCENT_LIFE = 0.9; // seconds a tap accent stays visible

interface Palette {
  navy: string;
  navy2: string;
  white: string;
  red: string;
  lime: string;
}

const FALLBACK: Palette = { navy: '#0A0F1E', navy2: '#101830', white: '#F4EFE4', red: '#E8402A', lime: '#C9F53C' };

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const read = (name: string, fb: string) => {
    const v = cs.getPropertyValue(name).trim();
    return v || fb;
  };
  return {
    navy: read('--navy', FALLBACK.navy),
    navy2: read('--navy-2', FALLBACK.navy2),
    white: read('--white', FALLBACK.white),
    red: read('--red', FALLBACK.red),
    lime: read('--lime', FALLBACK.lime),
  };
}

export class Stage {
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private palette = FALLBACK;
  private w = 0;
  private h = 0;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.g = ctx;
    this.palette = readPalette();
  }

  refreshPalette(): void {
    this.palette = readPalette();
  }

  resize(cssW: number, cssH: number): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = cssW;
    this.h = cssH;
    this.canvas.width = Math.max(1, Math.round(cssW * this.dpr));
    this.canvas.height = Math.max(1, Math.round(cssH * this.dpr));
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
  }

  get width(): number {
    return this.w;
  }

  get height(): number {
    return this.h;
  }

  /** Wrap-safe age in seconds between a past loop timestamp and now. */
  private static age(playhead: number, at: number, duration: number): number {
    let d = playhead - at;
    if (d < 0) d += duration;
    return d;
  }

  draw(state: RenderState): void {
    const g = this.g;
    const { w, h } = this;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.fillStyle = this.palette.navy;
    g.fillRect(0, 0, w, h);
    this.grid();
    const blend = Math.min(Math.max(state.modeBlend, 0), 1);
    if (state.mode === 'pulse') this.pulse(state, blend);
    else if (state.mode === 'orbit') this.orbit(state, blend);
    else this.typeBackdrop(state, blend);
    this.accents(state);
    if (state.idle) this.idleMark();
  }

  private grid(): void {
    const g = this.g;
    const { w, h } = this;
    g.strokeStyle = this.palette.white;
    g.globalAlpha = 0.07;
    g.lineWidth = 1;
    g.beginPath();
    for (const fx of [1 / 3, 2 / 3]) {
      g.moveTo(Math.round(w * fx) + 0.5, 0);
      g.lineTo(Math.round(w * fx) + 0.5, h);
    }
    for (const fy of [1 / 3, 2 / 3]) {
      g.moveTo(0, Math.round(h * fy) + 0.5);
      g.lineTo(w, Math.round(h * fy) + 0.5);
    }
    g.stroke();
    g.globalAlpha = 1;
  }

  // -- PULSE ---------------------------------------------------------------

  private pulse(s: RenderState, blend: number): void {
    const g = this.g;
    const { w, h } = this;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.3;
    const track = s.track;
    const clock = s.clock;
    const spacing = 60 / track.bpm;

    // Outer dial ring + beat-progress arc (red).
    g.strokeStyle = this.palette.white;
    g.globalAlpha = 0.3 * blend;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.stroke();
    g.globalAlpha = blend;
    g.strokeStyle = this.palette.red;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + clock.beatPhase * Math.PI * 2);
    g.stroke();

    // Expanding rings from the last three beats (deterministic ages).
    const ringLife = spacing * 2;
    for (let j = 0; j < 3; j++) {
      const bi = ((clock.beatIndex - j) % track.beats.length + track.beats.length) % track.beats.length;
      const age = Stage.age(clock.playhead, track.beats[bi], track.duration) / ringLife;
      if (age < 0 || age >= 1) continue;
      const downbeat = bi % track.beatsPerBar === 0;
      g.strokeStyle = downbeat ? this.palette.red : this.palette.white;
      g.globalAlpha = (1 - age) * 0.85 * blend;
      g.lineWidth = 3 - 2 * age;
      g.beginPath();
      g.arc(cx, cy, R * (0.55 + 1.15 * age), 0, Math.PI * 2);
      g.stroke();
    }

    // 16 step ticks; the current step is marked long.
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
      const isNow = i === clock.step;
      const rIn = R + 14;
      const rOut = R + (isNow ? 26 : 20);
      g.strokeStyle = isNow ? this.palette.red : this.palette.white;
      g.globalAlpha = (isNow ? 0.9 : 0.35) * blend;
      g.lineWidth = isNow ? 2 : 1;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * rIn, cy + Math.sin(a) * rIn);
      g.lineTo(cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut);
      g.stroke();
    }

    // Inner disc breathes with real low-band energy (masked over the grid).
    const spec = s.spectrum;
    let low = 0;
    if (spec) {
      for (let i = 0; i < 6; i++) low += spec[i];
      low = low / (6 * 255);
    }
    const r0 = R * 0.34 * (1 + 0.12 * low);
    g.globalAlpha = blend;
    g.fillStyle = this.palette.navy2;
    g.beginPath();
    g.arc(cx, cy, r0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = this.palette.white;
    g.lineWidth = 1.5;
    g.stroke();

    // Spectrum spokes — live analyser data, subtle.
    if (spec) {
      g.strokeStyle = this.palette.white;
      g.lineWidth = 2;
      for (let i = 0; i < 24; i++) {
        const v = spec[Math.min(spec.length - 1, 2 + i * 3)] / 255;
        const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const len = v * R * 0.2;
        g.globalAlpha = (0.1 + 0.35 * v) * blend;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * (r0 + 8), cy + Math.sin(a) * (r0 + 8));
        g.lineTo(cx + Math.cos(a) * (r0 + 8 + len), cy + Math.sin(a) * (r0 + 8 + len));
        g.stroke();
      }
    }

    // Center marker: red on downbeats (shape+color both signal the "1").
    const downbeat = clock.beatInBar === 0;
    g.globalAlpha = blend;
    g.fillStyle = downbeat ? this.palette.red : this.palette.white;
    g.fillRect(cx - 3, cy - 3, 6, 6);
    g.globalAlpha = 1;
  }

  // -- ORBIT ----------------------------------------------------------------

  private orbit(s: RenderState, blend: number): void {
    const g = this.g;
    const { w, h } = this;
    const cx = w / 2;
    const cy = h / 2;
    const track = s.track;
    const clock = s.clock;
    const R = Math.min(w, h) * 0.36;
    const barDur = (60 / track.bpm) * track.beatsPerBar;

    // Orbit rings — one per beat in the bar.
    for (let k = 0; k < track.beatsPerBar; k++) {
      g.strokeStyle = this.palette.white;
      g.globalAlpha = 0.22 * blend;
      g.lineWidth = 1;
      g.beginPath();
      g.arc(cx, cy, R * (0.42 + k * 0.19), 0, Math.PI * 2);
      g.stroke();
    }

    // Sweep line: one deterministic lap per bar (a function of playhead).
    const theta = ((clock.playhead % barDur) / barDur) * Math.PI * 2 - Math.PI / 2;
    g.strokeStyle = this.palette.red;
    g.globalAlpha = 0.8 * blend;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(theta) * R * 1.02, cy + Math.sin(theta) * R * 1.02);
    g.stroke();

    // Nodes for the last beatsPerBar beats, each parked at its own angle.
    const nodeLife = barDur;
    for (let j = 0; j < track.beatsPerBar; j++) {
      const bi = ((clock.beatIndex - j) % track.beats.length + track.beats.length) % track.beats.length;
      const age = Stage.age(clock.playhead, track.beats[bi], track.duration) / nodeLife;
      if (age < 0 || age >= 1) continue;
      const bt = track.beats[bi];
      const ang = ((bt % barDur) / barDur) * Math.PI * 2 - Math.PI / 2;
      const ring = bi % track.beatsPerBar;
      const rr = R * (0.42 + ring * 0.19);
      const size = 9 * (1 - age) + 3;
      const downbeat = ring === 0;
      g.fillStyle = downbeat ? this.palette.red : this.palette.white;
      g.globalAlpha = (1 - age) * blend;
      g.beginPath();
      g.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, size, 0, Math.PI * 2);
      g.fill();
    }

    g.globalAlpha = blend;
    g.fillStyle = this.palette.white;
    g.beginPath();
    g.arc(cx, cy, 4, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
  }

  // -- TYPE backdrop --------------------------------------------------------

  private typeBackdrop(s: RenderState, blend: number): void {
    const g = this.g;
    const { w, h } = this;
    const spec = s.spectrum;
    const base = h - Math.max(56, h * 0.1);

    // Baseline hairline where the type plate sits.
    g.strokeStyle = this.palette.white;
    g.globalAlpha = 0.25 * blend;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, base + 0.5);
    g.lineTo(w, base + 0.5);
    g.stroke();

    if (!spec) {
      g.globalAlpha = 1;
      return;
    }

    // Live spectrum bars, bottom-aligned — an honest oscilloscope readout.
    const bars = 28;
    const gap = 3;
    const bw = (w - gap * (bars + 1)) / bars;
    for (let i = 0; i < bars; i++) {
      const v = spec[Math.min(spec.length - 1, 1 + i * 3)] / 255;
      const bh = Math.max(2, v * h * 0.24);
      g.fillStyle = i % 8 === 0 ? this.palette.red : this.palette.white;
      g.globalAlpha = (0.14 + 0.5 * v) * blend;
      g.fillRect(gap + i * (bw + gap), base - bh, bw, bh);
    }
    g.globalAlpha = 1;
  }

  // -- accents + idle -------------------------------------------------------

  private accents(s: RenderState): void {
    const g = this.g;
    for (const acc of s.accents) {
      const age = Stage.age(s.clock.playhead, acc.t, s.track.duration) / ACCENT_LIFE;
      if (age < 0 || age >= 1) continue;
      const k = 1 - age;
      // Expanding ring — lime marks a human action, never the machine's beat.
      g.strokeStyle = this.palette.lime;
      g.globalAlpha = 0.9 * k;
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(acc.x, acc.y, 12 + 70 * age, 0, Math.PI * 2);
      g.stroke();
      // Crosshair marker (shape cue survives without color).
      g.globalAlpha = k;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(acc.x - 7, acc.y);
      g.lineTo(acc.x + 7, acc.y);
      g.moveTo(acc.x, acc.y - 7);
      g.lineTo(acc.x, acc.y + 7);
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  private idleMark(): void {
    // Before the first play: a single quiet ring waits at the center.
    const g = this.g;
    const cx = this.w / 2;
    const cy = this.h / 2;
    g.strokeStyle = this.palette.white;
    g.globalAlpha = 0.35;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(cx, cy, Math.min(this.w, this.h) * 0.18, 0, Math.PI * 2);
    g.stroke();
    g.globalAlpha = 1;
  }
}
