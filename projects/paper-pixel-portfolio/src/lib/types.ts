// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content contract (spec: JSON contract + DESIGN_DECISIONS.md §11).
// Content state lives ONLY in these shapes, loaded from public/data/*.json —
// never hard-coded inside components.

export type SectionType = 'text' | 'quote' | 'figure' | 'specs';

export interface CaseSection {
  type: SectionType;
  /** Prose (text), quotation (quote), caption (figure) — required unless type is 'specs'. */
  copy?: string;
  /** PlateArt asset id — required for 'figure'. */
  asset?: string;
  /** Alt text for figure assets — required for 'figure'. */
  alt?: string;
  caption?: string;
  /** Spec rows for 'specs' sections: [label, value] pairs. */
  items?: [string, string][];
}

export interface Project {
  slug: string;
  title: string;
  year: string;
  discipline: string[];
  client: string;
  summary: string;
  /** PlateArt asset id for the hero plate. */
  heroAsset: string;
  /** Alt text for the hero plate (it carries meaning in case view). */
  alt: string;
  sections: CaseSection[];
}

export interface StudioPrinciple {
  n: string;
  title: string;
  copy: string;
}

export interface StudioPerson {
  name: string;
  role: string;
  note: string;
}

export interface StudioContact {
  email: string;
  prompt: string;
  availability: string;
  address: string;
  handles: { label: string; value: string }[];
}

export interface Studio {
  name: string;
  tagline: string;
  volume: string;
  yearsActive: string;
  manifesto: string[];
  principles: StudioPrinciple[];
  people: StudioPerson[];
  contact: StudioContact;
}

export interface Content {
  studio: Studio;
  projects: Project[];
}
