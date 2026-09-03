// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content types mirroring public/data/*.json (the spec's JSON contract):
// systems → organs {id,name,pathId,function,facts}; pathways → sequence +
// explanation; quiz → questions. Label geometry (side/y/anchor) authors the
// callout layout so new organs are data, not code.

export type SystemId =
  | 'skeletal'
  | 'circulatory'
  | 'respiratory'
  | 'digestive'
  | 'nervous';

export interface LabelSpec {
  /** Which margin the callout sits in. */
  side: 'left' | 'right';
  /** Vertical position in plate coordinates (0..780). */
  y: number;
  /** Point on the organ the leader line ends at (plate coordinates). */
  anchor: [number, number];
}

export interface OrganDef {
  id: string;
  name: string;
  /** Matches the SVG shape id inside the plate (spec contract). */
  pathId: string;
  /** One clear sentence, ages 9-14. */
  function: string;
  /** 3 short facts. */
  facts: string[];
  label: LabelSpec;
}

export interface SystemDef {
  id: SystemId;
  name: string;
  /** One-line role of the system (chip subcopy / sheet intro). */
  tagline: string;
  organs: OrganDef[];
}

export interface StopDef {
  id: string;
  name: string;
  /** Node position on the plate, body-local coordinates (0..420 x 0..780). */
  node: [number, number];
  /** Organ this stop sits on, when there is one (for glyph + link). */
  organId?: string;
  /** Blurb read when the stop is reached. */
  blurb: string;
}

export interface PathwayStep {
  stop: string;
  explanation: string;
}

export interface PathwayDef {
  id: string;
  title: string;
  subtitle: string;
  intro: string;
  /** Ink token name driving the route color (slate/sage/oxblood). */
  ink: string;
  steps: PathwayStep[];
  recap: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Index into options. */
  answer: number;
  explain: string;
}

export interface LabData {
  systems: SystemDef[];
  stops: StopDef[];
  pathways: PathwayDef[];
  quiz: QuizQuestion[];
}
