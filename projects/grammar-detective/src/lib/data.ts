// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state loader: fetches local JSON (static host), validates the shape
// at dev-time with clear errors, and degrades to a readable message instead
// of a white screen (spec: never a white screen).

import type { BureauContent, CaseFile, Category, Dossier } from './types';
import { isPunctuation, joinTokens } from '../features/investigation/engine';

export class ContentError extends Error {}

const CATEGORIES: Category[] = ['noun', 'verb', 'adjective'];

async function fetchJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ContentError(`Could not load the case files (${url}).`);
  }
  if (!res.ok) throw new ContentError(`The case files came back as ${res.status} (${url}).`);
  try {
    return await res.json();
  } catch {
    throw new ContentError(`The case files are not valid JSON (${url}).`);
  }
}

/** Build an asset URL relative to the deployed base (subpath-safe). */
function assetUrl(path: string): string {
  // BASE_URL is './' for this build — resolve against the document first
  // (new URL needs an absolute base; relative paths must follow the host).
  const base = new URL(import.meta.env.BASE_URL ?? './', document.baseURI);
  return new URL(path, base).href;
}

function expectString(v: unknown, where: string): string {
  if (typeof v !== 'string' || !v.trim()) throw new ContentError(`${where} must be a non-empty string.`);
  return v;
}

function expectStringArray(v: unknown, where: string, min = 1): string[] {
  if (!Array.isArray(v) || v.length < min || !v.every((x) => typeof x === 'string' && x.trim())) {
    throw new ContentError(`${where} must be an array of non-empty strings (at least ${min}).`);
  }
  return v as string[];
}

function assertCase(raw: unknown, where: string): CaseFile {
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where} is not a valid case.`);
  const c = raw as Record<string, unknown>;
  const id = expectString(c.id, `${where}: id`);
  const title = expectString(c.title, `${where} (${id}): title`);
  const sentence = expectString(c.sentence, `${where} (${id}): sentence`);
  const tokens = expectStringArray(c.tokens, `${where} (${id}): tokens`, 3);
  const clues = expectStringArray(c.clues, `${where} (${id}): clues`, 3);
  if (clues.length !== 3) throw new ContentError(`${where} (${id}): exactly 3 clues are required.`);
  const rule = expectString(c.rule, `${where} (${id}): rule`);
  const explanation = expectString(c.explanation, `${where} (${id}): explanation`);
  if (joinTokens(tokens) !== sentence) {
    throw new ContentError(
      `${where} (${id}): sentence "${sentence}" does not equal the joined tokens "${joinTokens(tokens)}".`,
    );
  }

  const taskType = String(c.taskType ?? '');
  if (taskType === 'highlight') {
    const categories = expectStringArray(c.categories, `${where} (${id}): categories`)
      .map((x) => {
        if (!CATEGORIES.includes(x as Category)) {
          throw new ContentError(`${where} (${id}): unknown pen category "${x}".`);
        }
        return x as Category;
      });
    if (new Set(categories).size !== categories.length) {
      throw new ContentError(`${where} (${id}): duplicate pen category.`);
    }
    const em = c.expectedMarks;
    if (typeof em !== 'object' || em === null || Array.isArray(em)) {
      throw new ContentError(`${where} (${id}): expectedMarks must be an object.`);
    }
    for (const [cat, idxs] of Object.entries(em)) {
      if (!CATEGORIES.includes(cat as Category)) {
        throw new ContentError(`${where} (${id}): expectedMarks key "${cat}" is not a known pen.`);
      }
      if (!categories.includes(cat as Category)) {
        throw new ContentError(`${where} (${id}): expectedMarks mentions "${cat}" but it is not in categories.`);
      }
      if (!Array.isArray(idxs) || !idxs.every((n) => typeof n === 'number' && n >= 0 && n < tokens.length)) {
        throw new ContentError(`${where} (${id}): expectedMarks.${cat} must be valid token indices.`);
      }
    }
    for (const cat of categories) {
      if (!(em as Record<string, unknown>)[cat]) {
        throw new ContentError(`${where} (${id}): category "${cat}" has no expected marks.`);
      }
    }
    // Punctuation tokens must never be markable evidence.
    for (const idxs of Object.values(em as Record<string, unknown>)) {
      if ((idxs as number[]).some((i) => isPunctuation(tokens[i]))) {
        throw new ContentError(`${where} (${id}): punctuation tokens cannot be evidence.`);
      }
    }
    return {
      kind: 'highlight',
      id, title, sentence, tokens, clues, rule, explanation,
      categories,
      expectedMarks: em as Partial<Record<Category, number[]>>,
    };
  }

  if (taskType === 'reorder') {
    const acceptedAnswers = expectStringArray(c.acceptedAnswers, `${where} (${id}): acceptedAnswers`);
    // Each accepted answer must be buildable from exactly the given tokens
    // (same multiset, case-insensitive, punctuation stripped for comparison)
    // — catches authoring slips early. The separator keeps "ab"+"c" from
    // matching "a"+"bc".
    const stripPunct = (s: string) => s.replace(/[.,!?;:'"]/g, '').trim();
    const sortedTokens = tokens
      .map((t) => stripPunct(t.toLowerCase()))
      .filter(Boolean)
      .sort()
      .join('|');
    for (const a of acceptedAnswers) {
      const sortedWords = a
        .split(/\s+/)
        .map((w) => stripPunct(w.toLowerCase()))
        .filter(Boolean)
        .sort()
        .join('|');
      if (sortedWords !== sortedTokens) {
        throw new ContentError(
          `${where} (${id}): accepted answer "${a}" cannot be built from the given tokens.`,
        );
      }
    }
    return { kind: 'reorder', id, title, sentence, tokens, clues, rule, explanation, acceptedAnswers };
  }

  throw new ContentError(`${where} (${id}): taskType "${taskType}" is not supported.`);
}

function assertDossier(raw: unknown, index: number): Dossier {
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`dossier ${index} is not valid.`);
  const d = raw as Record<string, unknown>;
  const casesRaw = d.cases;
  if (!Array.isArray(casesRaw) || casesRaw.length === 0) {
    throw new ContentError(`dossier ${index} has no cases.`);
  }
  const cases = casesRaw.map((c, i) => assertCase(c, `dossier ${index} case ${i}`));
  const ids = new Set(cases.map((c) => c.id));
  if (ids.size !== cases.length) throw new ContentError(`dossier ${index}: duplicate case ids.`);
  return {
    id: expectString(d.id, `dossier ${index}: id`),
    code: expectString(d.code, `dossier ${index}: code`),
    title: expectString(d.title, `dossier ${index}: title`),
    brief: expectString(d.brief, `dossier ${index}: brief`),
    cases,
  };
}

export async function loadContent(): Promise<BureauContent> {
  const raw = await fetchJson(assetUrl('data/cases.json'));
  if (typeof raw !== 'object' || raw === null || !Array.isArray((raw as { dossiers?: unknown }).dossiers)) {
    throw new ContentError('cases.json is missing the "dossiers" array.');
  }
  const dossiers = (raw as { dossiers: unknown[] }).dossiers.map(assertDossier);
  const allIds = dossiers.flatMap((d) => d.cases.map((c) => c.id));
  if (new Set(allIds).size !== allIds.length) {
    throw new ContentError('case ids must be unique across dossiers.');
  }
  return { dossiers };
}
