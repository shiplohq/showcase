// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content contract (spec JSON contract): elements.json + missions.json are the
// single source of truth for what exists in the forge. Nothing about an
// element or mission may be hard-coded in a component.

export interface ElementData {
  /** Element symbol, e.g. "Na". Used as the joining key for missions. */
  symbol: string;
  /** Atomic number Z — number of protons. Defines the element. */
  atomicNumber: number;
  name: string;
  /** Common isotope mass numbers A (A = protons + neutrons). */
  commonIsotopes: number[];
  /** Simplified lesson shell occupancy for the neutral atom, e.g. [2, 8, 1]. */
  shellModel: number[];
  /** One-line reference note for the periodic strip readout. */
  note: string;
}

export type MissionFocus = 'build' | 'shells' | 'isotope' | 'ion';

export interface Mission {
  id: string;
  title: string;
  focus: MissionFocus;
  /** Learner-facing instructions (English, teaches the concept). */
  brief: string;
  /** Target element symbol — resolves against elements.json. */
  targetElement: string;
  /** Exact neutron count required. Omitted = any common isotope accepted. */
  neutronCount?: number;
  /** Required net charge. Omitted = 0 (neutral atom). */
  charge?: number;
}

export interface Content {
  elements: ElementData[];
  missions: Mission[];
}
