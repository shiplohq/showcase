// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Synth engine — every sound is generated in the browser with the Web Audio
// API (spec + repo policy: no audio files, nothing downloaded, no license
// risk). The AudioContext is created lazily inside a user gesture (autoplay
// policy) and the master chain is voices → bus → volume → compressor →
// analyser → destination, so the analyser reads exactly what is heard.

import type { TrackDef } from '../../lib/types';

const LOOKAHEAD_TICK_MS = 25;

export class SynthEngine {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private volume: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private delay: DelayNode | null = null;
  private delayFb: GainNode | null = null;
  private delayWet: GainNode | null = null;
  private spectrum: Uint8Array | null = null;
  private volumeLevel = 0.8;
  private muted = false;

  /** Create (inside a user gesture) or return the shared AudioContext. */
  ensure(): AudioContext {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    }
    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;

    this.bus = ctx.createGain();
    this.bus.gain.value = 0.9;

    this.volume = ctx.createGain();
    this.applyVolume();

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.16;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.72;
    this.spectrum = new Uint8Array(this.analyser.frequencyBinCount);

    // Light dotted-eighth feedback delay for the pluck voice only.
    this.delay = ctx.createDelay(1.5);
    this.delay.delayTime.value = 0.36;
    this.delayFb = ctx.createGain();
    this.delayFb.gain.value = 0.32;
    this.delayWet = ctx.createGain();
    this.delayWet.gain.value = 0.18;
    this.delay.connect(this.delayFb).connect(this.delay);
    this.delay.connect(this.delayWet).connect(this.bus);

    this.bus.connect(this.volume).connect(comp).connect(this.analyser).connect(ctx.destination);

    // 1 s of white noise reused by every noise-based voice.
    const len = Math.floor(ctx.sampleRate);
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  get context(): AudioContext | null {
    return this.ctx;
  }

  now(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  setOutput(volume: number, muted: boolean): void {
    this.volumeLevel = volume;
    this.muted = muted;
    this.applyVolume();
  }

  private applyVolume(): void {
    if (!this.volume || !this.ctx) return;
    const target = this.muted ? 0.0001 : Math.max(0.0001, this.volumeLevel);
    this.volume.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
  }

  /** Track-dependent delay time (dotted eighth). */
  tune(track: TrackDef): void {
    if (!this.delay || !this.ctx) return;
    this.delay.delayTime.setTargetAtTime((60 / track.bpm) * 0.75, this.ctx.currentTime, 0.05);
  }

  /** Copy the current spectrum (128 bins) or null before the context exists. */
  readSpectrum(): Uint8Array | null {
    if (!this.analyser || !this.spectrum) return null;
    this.analyser.getByteFrequencyData(this.spectrum as Uint8Array<ArrayBuffer>);
    return this.spectrum;
  }

  /** Bass energy 0..1 from the low bins — used by the Pulse dial. */
  lowEnergy(): number {
    const spec = this.readSpectrum();
    if (!spec) return 0;
    let sum = 0;
    for (let i = 0; i < 6; i++) sum += spec[i];
    return sum / (6 * 255);
  }

  // -- voices (all take absolute AudioContext time) ------------------------

  private kick(t: number, v: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.9 * v + 0.0001, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain).connect(this.bus!);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  private snare(t: number, v: number): void {
    const ctx = this.ctx!;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuf;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1800;
    band.Q.value = 0.9;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.5 * v + 0.0001, t);
    nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    noise.connect(band).connect(nGain).connect(this.bus!);
    noise.start(t);
    noise.stop(t + 0.2);

    const tone = ctx.createOscillator();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(214, t);
    tone.frequency.exponentialRampToValueAtTime(160, t + 0.08);
    const tGain = ctx.createGain();
    tGain.gain.setValueAtTime(0.3 * v + 0.0001, t);
    tGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    tone.connect(tGain).connect(this.bus!);
    tone.start(t);
    tone.stop(t + 0.12);
  }

  private hat(t: number, v: number): void {
    const ctx = this.ctx!;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7800;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3 * v + 0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    noise.connect(hp).connect(gain).connect(this.bus!);
    noise.start(t);
    noise.stop(t + 0.07);
  }

  private bass(t: number, v: number, semis: number, root: number, gateDur: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = root * Math.pow(2, semis / 12);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 6;
    lp.frequency.setValueAtTime(120 + 700 * v, t);
    lp.frequency.exponentialRampToValueAtTime(140, t + Math.min(gateDur, 0.45));
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.5 * v + 0.0001, t + 0.008);
    gain.gain.setValueAtTime(0.5 * v + 0.0001, t + Math.max(gateDur - 0.05, 0.01));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + gateDur);
    osc.connect(lp).connect(gain).connect(this.bus!);
    osc.start(t);
    osc.stop(t + gateDur + 0.02);
  }

  private pluck(t: number, v: number, semis: number, root: number): void {
    const ctx = this.ctx!;
    const freq = root * Math.pow(2, (semis + 12) / 12);
    for (const detune of [-6, 6]) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.16 * v + 0.0001, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      osc.connect(gain).connect(this.bus!);
      gain.connect(this.delayWet!);
      osc.start(t);
      osc.stop(t + 0.26);
    }
  }

  /** Immediate short ping for a user tap accent (honest gesture timing). */
  tapBlip(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1174.66, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.07);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.14, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(gain).connect(this.bus!);
    gain.connect(this.delayWet!);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Schedule one 16th step of the loop at absolute time `t`.
   * Section energy scales layer intensity so sections breathe, not just switch.
   */
  scheduleStep(track: TrackDef, stepInBar: number, t: number, energy: number, stepDur: number): void {
    if (!this.ctx) return;
    const p = track.pattern;
    for (const k of p.kick) if (k.i === stepInBar) this.kick(t, k.v * (0.85 + 0.15 * energy));
    for (const s of p.snare) if (s.i === stepInBar) this.snare(t, s.v * (0.35 + 0.65 * energy));
    for (const h of p.hat) if (h.i === stepInBar) this.hat(t, h.v * (0.25 + 0.75 * energy));
    for (const b of p.bass) {
      if (b.i === stepInBar) {
        const gate = (b.len ?? 1) * stepDur * 0.92;
        this.bass(t, b.v * (0.7 + 0.3 * energy), b.n, track.root, gate);
      }
    }
    for (const pl of p.pluck) {
      if (pl.i === stepInBar && energy >= 0.45) this.pluck(t, pl.v * energy, pl.n, track.root);
    }
  }
}

export const LOOKAHEAD_TICK = LOOKAHEAD_TICK_MS;
