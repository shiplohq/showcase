// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

/**
 * Pure sequencing engine for Story Sequencer — no Angular imports, no DOM.
 * Owns the content contract types, dev-time data validation, the deterministic
 * shuffle, and every correctness rule (order, causal links, title, reflection).
 * The UI and scripts/engine-sim.mjs both drive THIS module so the rules are
 * tested headless before they ever reach a browser.
 *
 * Type-stripping friendly (node >= 23 runs this file directly): no enums, no
 * namespaces, no parameter properties.
 */

// ---------------------------------------------------------------------------
// Content contract (public/data/stories.json)
// ---------------------------------------------------------------------------

export interface TitleOption {
  id: string;
  text: string;
  correct?: boolean;
}

export interface PanelDef {
  id: string;
  scene: string;
  caption: string;
  /** Phrases that carry the temporal signal (hint mode underlines them). */
  timeClues: string[];
}

export interface ReflectionOption {
  id: string;
  text: string;
  explanation: string;
  best?: boolean;
}

export interface Reflection {
  prompt: string;
  options: ReflectionOption[];
}

export type CausalLink = readonly [string, string];

export interface Story {
  id: string;
  issueNo: number;
  coverScene: string;
  coverTint: string;
  titles: TitleOption[];
  panels: PanelDef[];
  canonicalOrder: string[];
  alternateValidOrders: string[][];
  causalLinks: CausalLink[];
  reflection: Reflection;
}

// ---------------------------------------------------------------------------
// Small shared helpers
// ---------------------------------------------------------------------------

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Dev-time data validation
// ---------------------------------------------------------------------------

export function validateStories(stories: Story[]): string[] {
  const problems: string[] = [];
  if (!Array.isArray(stories) || stories.length === 0) {
    return ['stories.json: no stories found'];
  }
  const seenStory = new Set<string>();
  for (const story of stories) {
    const where = `story '${story.id}'`;
    if (!story.id) problems.push(`${where}: missing id`);
    if (seenStory.has(story.id)) problems.push(`${where}: duplicate story id`);
    seenStory.add(story.id);
    if (!Array.isArray(story.panels)) {
      problems.push(`${where}: panels missing`);
      continue;
    }
    if (story.panels.length < 4 || story.panels.length > 8) {
      problems.push(`${where}: has ${story.panels.length} panels (spec: 4-8)`);
    }
    const panelIds = new Set(story.panels.map((p) => p.id));
    if (panelIds.size !== story.panels.length) {
      problems.push(`${where}: duplicate panel ids`);
    }
    for (const p of story.panels) {
      if (!p.id) problems.push(`${where}: panel without id`);
      if (!p.scene) problems.push(`${where}: panel '${p.id}' has no scene`);
      if (!p.caption || p.caption.length < 8) {
        problems.push(`${where}: panel '${p.id}' caption too short`);
      }
      if (!Array.isArray(p.timeClues)) {
        problems.push(`${where}: panel '${p.id}' timeClues must be an array`);
      }
      for (const clue of p.timeClues ?? []) {
        if (!p.caption.includes(clue)) {
          problems.push(`${where}: time clue '${clue}' not found in caption of '${p.id}'`);
        }
      }
    }
    // canonical order must be an exact permutation of panel ids
    const co = story.canonicalOrder ?? [];
    if (co.length !== story.panels.length || new Set(co).size !== co.length) {
      problems.push(`${where}: canonicalOrder is not a permutation of panel ids`);
    } else if (co.some((id) => !panelIds.has(id))) {
      problems.push(`${where}: canonicalOrder references unknown panel ids`);
    }
    for (const alt of story.alternateValidOrders ?? []) {
      if (alt.length !== story.panels.length || new Set(alt).size !== alt.length || alt.some((id: string) => !panelIds.has(id))) {
        problems.push(`${where}: alternateValidOrders entry is not a permutation`);
      }
      if (arraysEqual(alt, co)) {
        problems.push(`${where}: alternateValidOrders duplicates canonicalOrder`);
      }
    }
    for (const [from, to] of story.causalLinks ?? []) {
      if (!panelIds.has(from) || !panelIds.has(to)) {
        problems.push(`${where}: causal link ${from}→${to} references unknown panels`);
      } else if (from === to) {
        problems.push(`${where}: causal link ${from}→${to} is a self link`);
      }
    }
    const linkSet = new Set((story.causalLinks ?? []).map((l) => l.join('→')));
    if (linkSet.size !== (story.causalLinks ?? []).length) {
      problems.push(`${where}: duplicate causal links`);
    }
    const correct = (story.titles ?? []).filter((t) => t.correct).length;
    if ((story.titles ?? []).length < 3) {
      problems.push(`${where}: needs at least 3 title options`);
    }
    if (correct !== 1) {
      problems.push(`${where}: exactly one title must be correct (found ${correct})`);
    }
    const best = (story.reflection?.options ?? []).filter((o) => o.best).length;
    if ((story.reflection?.options ?? []).length < 2) {
      problems.push(`${where}: reflection needs at least 2 options`);
    }
    if (best < 1) {
      problems.push(`${where}: reflection needs a 'best' option`);
    }
    for (const t of story.titles ?? []) {
      if (!t.id || !t.text) problems.push(`${where}: title option missing id/text`);
    }
    for (const o of story.reflection?.options ?? []) {
      if (!o.id || !o.text || !o.explanation) {
        problems.push(`${where}: reflection option '${o.id}' missing fields`);
      }
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Shuffle
// ---------------------------------------------------------------------------

/** Deterministic per story id — same story always shuffles the same way. */
export function shuffleOrder(story: Story): string[] {
  const order = story.canonicalOrder.slice();
  let guard = 0;
  do {
    // Fisher-Yates with a seeded PRNG (stable across sessions, testable).
    const rand = mulberry32(hashString(story.id) + 0x9e37 + guard * 7919);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    guard++;
  } while (isValidOrder(story, order) && guard < 50);
  return order;
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export function isValidOrder(story: Story, order: string[]): boolean {
  if (order.length !== story.canonicalOrder.length) return false;
  if (new Set(order).size !== order.length) return false;
  if (arraysEqual(order, story.canonicalOrder)) return true;
  return (story.alternateValidOrders ?? []).some((alt) => arraysEqual(order, alt));
}

export function correctlyPlacedCount(story: Story, order: string[]): number {
  let n = 0;
  for (let i = 0; i < order.length; i++) {
    if (order[i] === story.canonicalOrder[i]) n++;
  }
  return n;
}

export function isLinkCanonical(story: Story, from: string, to: string): boolean {
  return (story.causalLinks ?? []).some(([a, b]) => a === from && b === to);
}

export function linksKey(links: readonly Link[]): string[] {
  return links.map((l) => `${l.from}→${l.to}`);
}

export interface Link {
  from: string;
  to: string;
}

export function evaluateLinks(story: Story, links: readonly Link[]): boolean {
  if (links.length !== (story.causalLinks ?? []).length) return false;
  const drawn = new Set(linksKey(links));
  if (drawn.size !== links.length) return false;
  return (story.causalLinks ?? []).every(([a, b]) => drawn.has(`${a}→${b}`));
}

export function titleCorrect(story: Story, titleId: string | null): boolean {
  if (!titleId) return false;
  return (story.titles ?? []).some((t) => t.id === titleId && t.correct === true);
}

export function reflectionBest(story: Story, optionId: string | null): boolean {
  if (!optionId) return false;
  return (story.reflection?.options ?? []).some((o) => o.id === optionId && o.best === true);
}

export interface Verdict {
  orderOk: boolean;
  linksOk: boolean;
  titleOk: boolean;
  allOk: boolean;
  placedCount: number;
  panelCount: number;
  missingLinks: number;
}

export function evaluate(story: Story, order: string[], links: readonly Link[], titleId: string | null): Verdict {
  const orderOk = isValidOrder(story, order);
  const linksOk = evaluateLinks(story, links);
  const titleOk = titleCorrect(story, titleId);
  return {
    orderOk,
    linksOk,
    titleOk,
    allOk: orderOk && linksOk && titleOk,
    placedCount: correctlyPlacedCount(story, order),
    panelCount: order.length,
    missingLinks: Math.max(0, (story.causalLinks ?? []).length - links.length),
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function panelById(story: Story, id: string): PanelDef | undefined {
  return story.panels.find((p) => p.id === id);
}
