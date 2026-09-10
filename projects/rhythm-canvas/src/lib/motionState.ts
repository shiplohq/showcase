// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Single source of truth for the motion mode. Reduced motion is not just the
// media query: the transport has a manual toggle (persisted anonymously) and
// both the GSAP wrapper and the canvas stage read this flag, so "reduced"
// really means no continuous animation — a static poster plus a progress bar.

export interface MotionState {
  reduced: boolean;
  listeners: Set<() => void>;
}

export const motionState: MotionState = { reduced: false, listeners: new Set() };

export function setMotionReduced(reduced: boolean): void {
  if (motionState.reduced === reduced) return;
  motionState.reduced = reduced;
  for (const fn of motionState.listeners) fn();
}

export function onMotionChange(fn: () => void): void {
  motionState.listeners.add(fn);
}

export function isReduced(): boolean {
  return motionState.reduced;
}
