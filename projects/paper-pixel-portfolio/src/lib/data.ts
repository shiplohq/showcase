// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state loader: fetches the local JSON (static host), validates the
// whole contract at load time (dev AND runtime — cheap), and degrades to a
// clear message instead of a white screen (spec: runtime error → message).

import type { CaseSection, Content, Project, Studio } from './types';

export class ContentError extends Error {}

const PROJECTS_URL = './data/projects.json';
const STUDIO_URL = './data/studio.json';

async function fetchJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ContentError(`Could not load the studio files (${url}). Check that the data folder is deployed.`);
  }
  if (!res.ok) throw new ContentError(`A studio file returned ${res.status} (${url}).`);
  try {
    return await res.json();
  } catch {
    throw new ContentError(`A studio file is not valid JSON (${url}).`);
  }
}

function str(v: unknown, where: string, field: string): string {
  if (typeof v !== 'string' || !v.trim()) throw new ContentError(`${where}: "${field}" must be a non-empty string.`);
  return v;
}

function optStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined;
}

const SECTION_TYPES = new Set(['text', 'quote', 'figure', 'specs']);

function assertSection(raw: unknown, where: string): CaseSection {
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: invalid section.`);
  const s = raw as Record<string, unknown>;
  const type = str(s.type, where, 'type');
  if (!SECTION_TYPES.has(type)) throw new ContentError(`${where}: unknown section type "${type}".`);
  const out: CaseSection = { type: type as CaseSection['type'] };
  const copy = optStr(s.copy);
  const asset = optStr(s.asset);
  const alt = optStr(s.alt);
  const caption = optStr(s.caption);
  if (type === 'figure') {
    if (!asset) throw new ContentError(`${where}: figure sections need "asset".`);
    if (!alt) throw new ContentError(`${where}: figure sections need "alt".`);
    out.asset = asset;
    out.alt = alt;
    if (caption) out.caption = caption;
  } else if (type === 'specs') {
    if (!Array.isArray(s.items) || s.items.length === 0) {
      throw new ContentError(`${where}: specs sections need "items" rows.`);
    }
    out.items = s.items.map((row, i) => {
      if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== 'string' || typeof row[1] !== 'string') {
        throw new ContentError(`${where}: specs item ${i} must be [label, value].`);
      }
      return [row[0], row[1]] as [string, string];
    });
  } else {
    if (!copy) throw new ContentError(`${where}: "${type}" sections need "copy".`);
    out.copy = copy;
    if (caption) out.caption = caption;
  }
  if (asset && type !== 'figure') throw new ContentError(`${where}: "asset" is only valid for figure sections.`);
  void alt; // validated where required above
  return out;
}

function assertProject(raw: unknown, index: number): Project {
  const where = `project ${index}`;
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: invalid project.`);
  const p = raw as Record<string, unknown>;
  const discipline = Array.isArray(p.discipline)
    ? p.discipline.map((d) => String(d))
    : [];
  if (discipline.length === 0) throw new ContentError(`${where}: needs at least one discipline.`);
  if (!Array.isArray(p.sections) || p.sections.length === 0) {
    throw new ContentError(`${where}: needs at least one section.`);
  }
  return {
    slug: str(p.slug, where, 'slug'),
    title: str(p.title, where, 'title'),
    year: str(p.year, where, 'year'),
    discipline,
    client: str(p.client, where, 'client'),
    summary: str(p.summary, where, 'summary'),
    heroAsset: str(p.heroAsset, where, 'heroAsset'),
    alt: str(p.alt, where, 'alt'),
    sections: p.sections.map((s, i) => assertSection(s, `${where} section ${i}`)),
  };
}

function assertStudio(raw: unknown): Studio {
  const where = 'studio';
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: invalid file.`);
  const s = raw as Record<string, unknown>;
  const list = <T,>(v: unknown, field: string, map: (x: unknown, i: number) => T): T[] => {
    if (!Array.isArray(v) || v.length === 0) throw new ContentError(`${where}: "${field}" must be a non-empty list.`);
    return v.map(map);
  };
  const contact = (() => {
    if (typeof s.contact !== 'object' || s.contact === null) throw new ContentError(`${where}: "contact" is invalid.`);
    const c = s.contact as Record<string, unknown>;
    return {
      email: str(c.email, where, 'contact.email'),
      prompt: str(c.prompt, where, 'contact.prompt'),
      availability: str(c.availability, where, 'contact.availability'),
      address: str(c.address, where, 'contact.address'),
      handles: list(c.handles, 'contact.handles', (h, i) => {
        if (typeof h !== 'object' || h === null) throw new ContentError(`${where}: handle ${i} is invalid.`);
        const o = h as Record<string, unknown>;
        return { label: str(o.label, where, `handle ${i} label`), value: str(o.value, where, `handle ${i} value`) };
      }),
    };
  })();
  return {
    name: str(s.name, where, 'name'),
    tagline: str(s.tagline, where, 'tagline'),
    volume: str(s.volume, where, 'volume'),
    yearsActive: str(s.yearsActive, where, 'yearsActive'),
    manifesto: list(s.manifesto, 'manifesto', (m) => str(m, where, 'manifesto line')),
    principles: list(s.principles, 'principles', (p, i) => {
      if (typeof p !== 'object' || p === null) throw new ContentError(`${where}: principle ${i} is invalid.`);
      const o = p as Record<string, unknown>;
      return {
        n: str(o.n, where, `principle ${i} n`),
        title: str(o.title, where, `principle ${i} title`),
        copy: str(o.copy, where, `principle ${i} copy`),
      };
    }),
    people: list(s.people, 'people', (p, i) => {
      if (typeof p !== 'object' || p === null) throw new ContentError(`${where}: person ${i} is invalid.`);
      const o = p as Record<string, unknown>;
      return {
        name: str(o.name, where, `person ${i} name`),
        role: str(o.role, where, `person ${i} role`),
        note: str(o.note, where, `person ${i} note`),
      };
    }),
    contact,
  };
}

/** Load and fully validate the studio content. Throws ContentError with a friendly message. */
export async function loadContent(): Promise<Content> {
  const [projectsRaw, studioRaw] = await Promise.all([fetchJson(PROJECTS_URL), fetchJson(STUDIO_URL)]);
  if (!Array.isArray(projectsRaw)) throw new ContentError('projects.json must be a list of works.');
  const projects = projectsRaw.map((p, i) => assertProject(p, i));
  if (projects.length === 0) throw new ContentError('The studio index has no works.');
  const seen = new Set<string>();
  for (const p of projects) {
    if (seen.has(p.slug)) throw new ContentError(`Duplicate work slug "${p.slug}".`);
    seen.add(p.slug);
  }
  return { studio: assertStudio(studioRaw), projects };
}
