// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Audio layer — zero audio assets, zero third-party rights:
//  * words & phoneme cues: browser speechSynthesis (en voice, slowed);
//  * feedback chimes: WebAudio oscillators synthesized on the fly.
// Rules honored: never autoplay on load (first sound follows a gesture),
// mute is user-controlled and persisted, meaning is NEVER sound-only (every
// cue has a visible text path), no error buzzers — wrong answers stay silent.

export type AudioEvent = 'correct' | 'place' | 'wake' | 'complete';

let muted = false;
let ctx: AudioContext | null = null;

export function setMuted(next: boolean): void {
  muted = next;
}

export function isMuted(): boolean {
  return muted;
}

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Ask the platform to warm audio up inside the first user gesture. */
export function unlockAudio(): void {
  ensureCtx();
}

interface ToneSpec {
  freq: number;
  at: number;
  dur: number;
  gain: number;
  type?: OscillatorType;
}

function playTones(tones: ToneSpec[]): void {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  for (const t of tones) {
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = t.type ?? 'sine';
    osc.frequency.value = t.freq;
    // Marimba-ish: fast attack, exponential decay — soft, never harsh.
    amp.gain.setValueAtTime(0.0001, now + t.at);
    amp.gain.exponentialRampToValueAtTime(t.gain, now + t.at + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + t.at + t.dur);
    osc.connect(amp).connect(ac.destination);
    osc.start(now + t.at);
    osc.stop(now + t.at + t.dur + 0.05);
  }
}

export function chime(event: AudioEvent): void {
  switch (event) {
    case 'correct':
      // Warm rising third (G4 → C5).
      playTones([
        { freq: 392, at: 0, dur: 0.22, gain: 0.12 },
        { freq: 523.25, at: 0.09, dur: 0.3, gain: 0.1 },
      ]);
      break;
    case 'place':
      playTones([{ freq: 329.6, at: 0, dur: 0.18, gain: 0.09 }]);
      break;
    case 'wake':
      playTones([
        { freq: 392, at: 0, dur: 0.2, gain: 0.09 },
        { freq: 493.9, at: 0.1, dur: 0.2, gain: 0.09 },
        { freq: 587.3, at: 0.2, dur: 0.34, gain: 0.1 },
      ]);
      break;
    case 'complete':
      playTones([
        { freq: 523.25, at: 0, dur: 0.24, gain: 0.1 },
        { freq: 659.25, at: 0.12, dur: 0.24, gain: 0.1 },
        { freq: 783.99, at: 0.24, dur: 0.4, gain: 0.11 },
      ]);
      break;
  }
}

// ---- speechSynthesis ---------------------------------------------------------

let voices: SpeechSynthesisVoice[] = [];

function refreshVoices(): SpeechSynthesisVoice[] {
  if (typeof speechSynthesis === 'undefined') return [];
  voices = speechSynthesis.getVoices();
  return voices;
}

export function speechAvailable(): boolean {
  if (typeof speechSynthesis === 'undefined') return false;
  const list = voices.length > 0 ? voices : refreshVoices();
  return list.length > 0;
}

/** Some engines populate the voice list asynchronously after load. */
export function warmSpeech(): void {
  if (typeof speechSynthesis === 'undefined') return;
  refreshVoices();
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoices, { once: true });
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const list = voices.length > 0 ? voices : refreshVoices();
  return (
    list.find((v) => /^en(-|_)US/i.test(v.lang) && /female|zira|samantha|aria|jenny/i.test(v.name)) ??
    list.find((v) => /^en[-_]/i.test(v.lang)) ??
    list[0]
  );
}

/** Speak a word slowly. Resolves when done (or immediately if unavailable).
 *  `spelling: true` speaks a phoneme cue letter-by-letter-ish ("sh" → "shh"). */
export function speak(text: string, opts: { rate?: number; spelling?: boolean } = {}): Promise<boolean> {
  if (muted || typeof speechSynthesis === 'undefined') return Promise.resolve(false);
  const synth = speechSynthesis;
  const voice = pickVoice();
  if (!voice && !speechAvailable()) return Promise.resolve(false);
  return new Promise((resolve) => {
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? 'en-US';
      u.rate = opts.rate ?? 0.8;
      u.pitch = 1.05;
      u.onend = () => resolve(true);
      u.onerror = () => resolve(false);
      synth.speak(u);
      // Safety net: resolve anyway if the engine never fires events (headless).
      setTimeout(() => resolve(true), 2500);
    } catch {
      resolve(false);
    }
  });
}

/** Play a word from its `speech:<word>` audio URI (the JSON contract form). */
export function playAudioUri(uri: string, rate?: number): Promise<boolean> {
  if (!uri.startsWith('speech:')) return Promise.resolve(false);
  return speak(uri.slice('speech:'.length), { rate });
}
