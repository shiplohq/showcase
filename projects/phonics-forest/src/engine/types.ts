// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content types mirroring public/data/phonics.json (spec § JSON contract:
// phoneme, graphemes[], audio, examples[{word,image,audio}], minimalPairs[]).
// Kept DOM-free on purpose: everything under src/engine/ is pure logic that
// scripts/engine-sim.mjs exercises headless.

/** Where the target phoneme sits inside the example word. */
export type PhonemePosition = 'initial' | 'middle' | 'final';

export interface WordExample {
  /** The word a child sees/hears, e.g. "ship". */
  word: string;
  /** Sprite/art reference. `sprite:<variant>` draws an in-project SVG creature. */
  image: string;
  /** Audio source URI. This project ships no audio files: `speech:<text>` = browser speechSynthesis. */
  audio: string;
  /** Tree (phoneme) this word belongs to. */
  phonemeId: string;
  position: PhonemePosition;
  /** [start, end) character span of the grapheme inside `word`. */
  highlight: [number, number];
}

export interface MinimalPair {
  /** The word the audio plays (the correct choice). */
  answer: string;
  /** The near-miss word shown as the other choice. */
  distractor: string;
  answerPhoneme: string;
  /** Informational: often a sound outside the taught set (n, ɪ, ʊ…). */
  distractorPhoneme?: string;
  audio: string;
}

export interface PhonemeTree {
  id: string;
  /** IPA display form, e.g. "/ʃ/" — always rendered in Andika (full IPA coverage). */
  phoneme: string;
  /** Friendly mouth cue, e.g. "shhh". */
  soundLabel: string;
  graphemes: string[];
  audio: string;
  /** Token key for the canopy colour (see styles/tokens.css). */
  canopy: string;
  tiers: number;
  height: number;
  examples: WordExample[];
  minimalPairs: MinimalPair[];
}

export interface PhonicsData {
  title: string;
  subtitle: string;
  locale: string;
  audioScheme: string;
  trees: PhonemeTree[];
}

/** Human-readable validation issues (dev-time console + runtime error panel). */
export function validatePhonics(data: unknown): string[] {
  const issues: string[] = [];
  const d = data as Partial<PhonicsData>;
  if (!d || typeof d !== 'object') return ['data is not an object'];
  if (!Array.isArray(d.trees) || d.trees.length < 2) issues.push('trees: need at least 2 trees');
  const ids = new Set<string>();
  const words = new Map<string, string>();
  (d.trees ?? []).forEach((t, ti) => {
    const where = `trees[${ti}]`;
    if (!t?.id) issues.push(`${where}: missing id`);
    else {
      if (ids.has(t.id)) issues.push(`${where}: duplicate id "${t.id}"`);
      ids.add(t.id);
    }
    if (!t?.phoneme) issues.push(`${where}: missing phoneme (IPA)`);
    if (!Array.isArray(t?.graphemes) || t.graphemes.length === 0) issues.push(`${where}: graphemes[] empty`);
    if (!Array.isArray(t?.examples) || t.examples.length < 3) issues.push(`${where}: need >= 3 examples`);
    (t?.examples ?? []).forEach((e, ei) => {
      const ew = `${where}.examples[${ei}]`;
      if (!e?.word) issues.push(`${ew}: missing word`);
      else {
        if (words.has(e.word)) issues.push(`${ew}: duplicate word "${e.word}" (also on ${words.get(e.word)})`);
        words.set(e.word, String(t?.id));
        if (e.phonemeId !== t?.id) issues.push(`${ew}: phonemeId "${e.phonemeId}" != tree id "${t?.id}"`);
        const [s, en] = e.highlight ?? [-1, -1];
        if (e.word && (s < 0 || en > e.word.length || s >= en)) issues.push(`${ew}: highlight [${s},${en}] out of range for "${e.word}"`);
        else if (e.word && e.word.slice(s, en) !== (t?.graphemes ?? [])[0]) {
          issues.push(`${ew}: highlight "${e.word.slice(s, en)}" != grapheme "${(t?.graphemes ?? [])[0]}"`);
        }
        if (!['initial', 'middle', 'final'].includes(e.position)) issues.push(`${ew}: bad position "${e.position}"`);
        if (e.audio && !e.audio.startsWith('speech:')) issues.push(`${ew}: unsupported audio "${e.audio}"`);
      }
    });
    (t?.minimalPairs ?? []).forEach((p, pi) => {
      const pw = `${where}.minimalPairs[${pi}]`;
      if (!p?.answer || !p?.distractor) issues.push(`${pw}: missing answer/distractor`);
      else if (p.answer === p.distractor) issues.push(`${pw}: answer == distractor "${p.answer}"`);
      if (p?.answerPhoneme !== t?.id) issues.push(`${pw}: answerPhoneme "${p?.answerPhoneme}" != tree id "${t?.id}"`);
    });
    if ((t?.minimalPairs ?? []).length < 1) issues.push(`${where}: need >= 1 minimal pair`);
  });
  return issues;
}
