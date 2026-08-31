// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Tiny WebAudio synth — optional reinforcement only. Defaults OFF; every
// message also exists visually. No error sound exists (non-punitive).

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, gain: number): void {
  const ac = context();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0, ac.currentTime + start);
  amp.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
}

/** Soft tick when a seed is planted (frequency rises slightly with count). */
export function playPlant(count: number): void {
  tone(420 + Math.min(count, 12) * 26, 0, 0.12, 0.05);
}

/** Gentle two-note chime for a correct answer. */
export function playCorrect(): void {
  tone(523.25, 0, 0.18, 0.06);
  tone(783.99, 0.12, 0.26, 0.05);
}

/** Short bloom arpeggio for the end screen. */
export function playBloom(): void {
  [523.25, 587.33, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.09, 0.22, 0.045));
}
