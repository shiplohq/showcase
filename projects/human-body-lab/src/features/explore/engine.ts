// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure layer-state engine for the system explorer — no Vue, no DOM.
// Owns: layer toggling, organ↔pathway lookups, and the callout label
// spacing rule (author-positions from JSON, validated so two labels on the
// same margin never collide).

import type { LabData, SystemDef, SystemId } from '../../lib/types';

export type Layers = ReadonlySet<SystemId>;

export const ALL_SYSTEMS: SystemId[] = [
  'skeletal',
  'circulatory',
  'respiratory',
  'digestive',
  'nervous',
];

/** Toggle one system layer; the decision always belongs to the learner. */
export function toggleLayer(layers: Layers, id: SystemId): Set<SystemId> {
  const next = new Set(layers);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Pathways that pass through a given organ (organ sheet link-out). */
export function pathwaysThrough(data: LabData, organId: string): string[] {
  const stopIds = new Set(
    data.stops.filter((t) => t.organId === organId).map((t) => t.id),
  );
  const result: string[] = [];
  for (const p of data.pathways) {
    if (p.steps.some((step) => stopIds.has(step.stop))) result.push(p.id);
  }
  return result;
}

/**
 * Callout rule: labels are authored per organ in JSON. Labels on the same
 * margin must keep >= MIN_LABEL_GAP plate px so leader lines never collide
 * (spec's label-collision hardening). Runs at dev-time in engine-sim.
 */
export const MIN_LABEL_GAP = 18;

export function validateCalloutSpacing(data: LabData): string[] {
  const problems: string[] = [];
  for (const side of ['left', 'right'] as const) {
    const rows = data.systems
      .flatMap((s: SystemDef) => s.organs.map((o) => ({ system: s.id, organ: o })))
      .filter((r) => r.organ.label.side === side)
      .sort((a, b) => a.organ.label.y - b.organ.label.y);
    for (let i = 1; i < rows.length; i++) {
      const gap = rows[i].organ.label.y - rows[i - 1].organ.label.y;
      if (gap < MIN_LABEL_GAP) {
        problems.push(
          `label collision (${side}): ${rows[i - 1].system}/${rows[i - 1].organ.id} y=${rows[i - 1].organ.label.y} vs ${rows[i].system}/${rows[i].organ.id} y=${rows[i].organ.label.y} (gap ${gap} < ${MIN_LABEL_GAP})`,
        );
      }
    }
  }
  return problems;
}
