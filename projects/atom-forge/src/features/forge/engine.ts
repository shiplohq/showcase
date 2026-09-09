// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure forge logic — no React, no DOM, no fetch. Composition rules (shell
// capacities), mission validation, isotope/ion identity and progression all
// live here so they can be simulated headless (scripts/engine-sim.mjs) with
// the SAME code the UI runs.
//
// Simplified lesson model (declared on every screen):
//   - shells hold 2 · 8 · 8 · 2 electrons (first 20 elements);
//   - electrons fill inner shells first (canonical configuration);
//   - Z (protons) defines the element; neutrons define the isotope;
//     protons − electrons = charge.

import type { ElementData, Mission } from '../../lib/types';

/** Simplified shell capacities for Z ≤ 20 (declared as a simplification). */
export const SHELL_CAPACITY = [2, 8, 8, 2] as const;

/** The forge demonstrates the first 20 elements. */
export const MAX_PROTONS = 20;

/** Generous neutron ceiling — enough for every mission plus exploration. */
export const MAX_NEUTRONS = 24;

export interface BuildState {
  protons: number;
  neutrons: number;
  /** Electrons per shell index 0..n-1. Any layout respecting capacity is allowed. */
  shells: number[];
}

export const emptyBuild = (): BuildState => ({ protons: 0, neutrons: 0, shells: [] });

export const capacityOf = (shellIndex: number): number => SHELL_CAPACITY[shellIndex] ?? 0;

export const electronCount = (b: BuildState): number => b.shells.reduce((sum, n) => sum + n, 0);

export const chargeOf = (b: BuildState): number => b.protons - electronCount(b);

export const massNumberOf = (b: BuildState): number => b.protons + b.neutrons;

/** Canonical lesson configuration: fill shells inner-first up to capacity. */
export function greedyConfig(electrons: number): number[] {
  const shells: number[] = [];
  let left = electrons;
  for (let i = 0; left > 0 && i < SHELL_CAPACITY.length; i++) {
    const take = Math.min(left, SHELL_CAPACITY[i]);
    shells.push(take);
    left -= take;
  }
  return shells;
}

/** True when the current shell layout equals the inner-first fill for its own electron count. */
export function isCanonical(b: BuildState): boolean {
  // Normalize: addElectron pads to the visible shell count, so trailing
  // zero-occupancy shells are equivalent to absence.
  const shells = [...b.shells];
  while (shells.length > 0 && shells[shells.length - 1] === 0) shells.pop();
  const canonical = greedyConfig(electronCount(b));
  if (canonical.length !== shells.length) return false;
  return shells.every((n, i) => n === canonical[i]);
}

/** The element a proton count defines (null when out of the 1..20 range). */
export function identify(elements: ElementData[], protons: number): ElementData | null {
  if (protons < 1 || protons > MAX_PROTONS) return null;
  return elements.find((el) => el.atomicNumber === protons) ?? null;
}

export type ParticleKind = 'proton' | 'neutron' | 'electron';

export interface AddOutcome {
  build: BuildState;
  /** false when the forge refused the particle (build unchanged). */
  ok: boolean;
  /** Teaching copy for a refusal — never a punishment. */
  reason?: string;
}

const MAX_SHELLS = SHELL_CAPACITY.length;

export function addProton(b: BuildState): AddOutcome {
  if (b.protons >= MAX_PROTONS) {
    return { build: b, ok: false, reason: `This forge handles the first 20 elements — that is ${MAX_PROTONS} protons at most.` };
  }
  return { build: { ...b, protons: b.protons + 1 }, ok: true };
}

export function addNeutron(b: BuildState): AddOutcome {
  if (b.neutrons >= MAX_NEUTRONS) {
    return { build: b, ok: false, reason: `The nucleus is packed — ${MAX_NEUTRONS} neutrons is the forge ceiling.` };
  }
  return { build: { ...b, neutrons: b.neutrons + 1 }, ok: true };
}

export function addElectron(b: BuildState, shellIndex: number, visibleShells: number): AddOutcome {
  if (shellIndex < 0 || shellIndex >= MAX_SHELLS) {
    return { build: b, ok: false, reason: 'The simplified model has only four shells (2 · 8 · 8 · 2).' };
  }
  if (shellIndex >= visibleShells) {
    return { build: b, ok: false, reason: `Shell ${shellIndex + 1} is not on the forge bench yet — open shells one at a time.` };
  }
  const current = b.shells[shellIndex] ?? 0;
  const cap = capacityOf(shellIndex);
  if (current >= cap) {
    return { build: b, ok: false, reason: `Shell ${shellIndex + 1} is full — it holds exactly ${cap} electrons.` };
  }
  const shells = [...b.shells];
  while (shells.length < visibleShells) shells.push(0);
  shells[shellIndex] = current + 1;
  return { build: { ...b, shells }, ok: true };
}

export function removeProton(b: BuildState): BuildState {
  return b.protons <= 0 ? b : { ...b, protons: b.protons - 1 };
}

export function removeNeutron(b: BuildState): BuildState {
  return b.neutrons <= 0 ? b : { ...b, neutrons: b.neutrons - 1 };
}

export function removeElectron(b: BuildState, shellIndex: number): BuildState {
  const current = b.shells[shellIndex] ?? 0;
  if (current <= 0) return b;
  const shells = [...b.shells];
  shells[shellIndex] = current - 1;
  // Trim trailing empty shells so the state stays canonical in shape.
  while (shells.length > 0 && shells[shells.length - 1] === 0) shells.pop();
  return { ...b, shells };
}

// ---------------------------------------------------------------------------
// Mission evaluation
// ---------------------------------------------------------------------------

export interface MissionTarget {
  element: ElementData;
  neutrons: number;
  charge: number;
  electrons: number;
  config: number[];
  /** Human notation like "²³Na" (mass number superscript + symbol). */
  isotopeNotation: string;
}

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻',
};

/** Superscript isotope notation, e.g. isotopeNotation("Na", 23, 1) → "²³Na⁺". */
export function isotopeNotation(symbol: string, massNumber: number, charge = 0): string {
  const digits = String(massNumber)
    .split('')
    .map((d) => SUPERSCRIPT[d] ?? d)
    .join('');
  const sign = charge === 0 ? '' : SUPERSCRIPT[charge > 0 ? '+' : '-'];
  return `${digits}${symbol}${sign ?? ''}`;
}

export function targetOf(elements: ElementData[], mission: Mission): MissionTarget {
  const element = elements.find((el) => el.symbol === mission.targetElement);
  if (!element) throw new Error(`Mission "${mission.id}" targets unknown element "${mission.targetElement}".`);
  const charge = mission.charge ?? 0;
  // neutronCount omitted → the lightest common isotope is the displayed target
  // (evaluate() accepts every common isotope in that case).
  const neutrons =
    mission.neutronCount !== undefined
      ? mission.neutronCount
      : Math.min(...element.commonIsotopes) - element.atomicNumber;
  const electrons = element.atomicNumber - charge;
  return {
    element,
    neutrons,
    charge,
    electrons,
    config: greedyConfig(electrons),
    isotopeNotation: isotopeNotation(element.symbol, element.atomicNumber + neutrons, charge),
  };
}

export type MissionStatus = 'forged' | 'pending' | 'other-element';

export interface MissionEvaluation {
  status: MissionStatus;
  target: MissionTarget;
  /** Element the current proton count defines (may differ from the target). */
  identity: ElementData | null;
  /** Up to two teaching lines describing what differs (informational, kind). */
  issues: string[];
}

function signedCharge(c: number): string {
  return c === 0 ? '0' : c > 0 ? `+${c}` : `−${Math.abs(c)}`;
}

export function evaluate(elements: ElementData[], mission: Mission, build: BuildState): MissionEvaluation {
  const target = targetOf(elements, mission);
  const identity = identify(elements, build.protons);
  const issues: string[] = [];

  const protonsOk = build.protons === target.element.atomicNumber;
  // neutronCount omitted → every common isotope of the element is accepted.
  const neutronsOk =
    mission.neutronCount !== undefined
      ? build.neutrons === mission.neutronCount
      : target.element.commonIsotopes.includes(massNumberOf(build));
  const electrons = electronCount(build);
  const chargeOk = chargeOf(build) === target.charge && electrons === target.electrons;
  const canonical = isCanonical(build);

  if (protonsOk && neutronsOk && chargeOk && canonical) {
    return { status: 'forged', target, identity, issues: [] };
  }

  const status: MissionStatus = !protonsOk ? 'other-element' : 'pending';

  // A pristine bench shows NO teaching notes — the identity readout already
  // says "Empty nucleus — add protons to begin." (assessment: the duplicate
  // line made every fresh mission open with a warning-colored box).
  if (!protonsOk && identity) {
    const verb = build.protons === 1 ? 'proton makes' : 'protons make';
    const targetNoun = target.element.atomicNumber === 1 ? 'proton' : 'protons';
    issues.push(
      `${build.protons} ${verb} ${identity.name} (${identity.symbol}). This mission forges ${target.element.name} — it needs exactly ${target.element.atomicNumber} ${targetNoun}.`,
    );
  }

  // Shell-layout rule SECOND (assessment P2: with wrong neutrons AND wrong
  // charge filling the 2-line budget, the inner-first lesson never surfaced).
  // It is the game's core mechanic and stays true whenever the element is
  // right — even if the electron count is still wrong.
  if (protonsOk && !canonical) {
    const hole = greedyConfig(electrons);
    const idx = build.shells.findIndex((n, i) => n !== hole[i]);
    if (idx >= 0 && idx < SHELL_CAPACITY.length) {
      const free = capacityOf(idx) - (build.shells[idx] ?? 0);
      issues.push(
        free > 0
          ? `Electrons fill inner shells first — shell ${idx + 1} still has ${free} free seat${free === 1 ? '' : 's'}. Move electrons inward.`
          : `Electrons fill inner shells first — shell ${idx + 1} should stay empty in this configuration. Move electrons inward.`,
      );
    }
  }

  if (protonsOk && !neutronsOk) {
    const currentA = build.protons + build.neutrons;
    const targetA = target.element.atomicNumber + target.neutrons;
    issues.push(
      `Right element! But ${build.neutrons} neutrons make ${target.element.symbol}-${currentA}, and this mission asks for ${target.element.symbol}-${targetA} (${target.neutrons} neutrons).`,
    );
  }

  if (protonsOk && !chargeOk) {
    issues.push(
      `Charge is ${signedCharge(chargeOf(build))} with ${electrons} electrons. Target charge is ${signedCharge(target.charge)} — that means ${target.electrons} electrons.`,
    );
  }

  return { status, target, identity, issues };
}

/** Screen-reader/aria summary of the current build. */
export function buildSummary(b: BuildState, elements: ElementData[]): string {
  const shells = b.shells.length
    ? b.shells.map((n, i) => `shell ${i + 1}: ${n}`).join(', ')
    : 'no shells occupied';
  const identity = identify(elements, b.protons);
  const who = identity ? ` The element is ${identity.name}.` : '';
  return `Nucleus: ${b.protons} protons, ${b.neutrons} neutrons. Electrons — ${shells}. Charge ${signedCharge(chargeOf(b))}.${who}`;
}

// ---------------------------------------------------------------------------
// Progression (anonymous, localStorage-backed by the caller)
// ---------------------------------------------------------------------------

/** Mission i+1 unlocks when mission i has been forged. */
export function isUnlocked(missions: Mission[], completed: string[], index: number): boolean {
  if (index <= 0) return true;
  if (index >= missions.length) return false;
  return completed.includes(missions[index - 1].id);
}

export type MissionRowStatus = 'forged' | 'open' | 'locked';

export function missionRowStatus(missions: Mission[], completed: string[], index: number): MissionRowStatus {
  if (completed.includes(missions[index].id)) return 'forged';
  return isUnlocked(missions, completed, index) ? 'open' : 'locked';
}

/** Charge readout with signed number AND text (never color- or sign-only). */
export function chargeCopy(charge: number): string {
  if (charge === 0) return 'neutral atom';
  if (charge > 0) return `cation — ${charge} electron${charge === 1 ? '' : 's'} lost`;
  return `anion — ${Math.abs(charge)} electron${Math.abs(charge) === 1 ? '' : 's'} gained`;
}
