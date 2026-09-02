// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Tiny WebAudio feedback synth — no audio files, no TTS API (spec: optional
// browser speech via bundled audio only; v1 ships no bundled audio, so feedback
// is a soft click/chime generated here). OFF by default; the sound toggle is
// always visible. Every meaning also exists visually — audio is pure
// reinforcement.

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, gain: number, type: OscillatorType = 'sine'): void {
  const ac = context();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0.0001, ac.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
}

/** Soft wooden click — picking up chips, opening plates. */
export function click(enabled: boolean): void {
  if (!enabled) return;
  tone(660, 0, 0.07, 0.045, 'triangle');
}

/** Two-note rising chime — a correct answer. Never an error sound. */
export function chime(enabled: boolean): void {
  if (!enabled) return;
  tone(523.25, 0, 0.16, 0.05);
  tone(783.99, 0.09, 0.22, 0.05);
}

/** Warm little fanfare — scene completed. */
export function fanfare(enabled: boolean): void {
  if (!enabled) return;
  tone(523.25, 0, 0.16, 0.05);
  tone(659.25, 0.1, 0.16, 0.05);
  tone(783.99, 0.2, 0.3, 0.05);
}
