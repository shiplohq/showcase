// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Overlay geometry helpers — hotspots and plates are positioned by the JSON
// bbox (percent of the 1200x800 art plate). Pure functions, testable.

import type { BBox } from '../../lib/types';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Hotspot button box in percent (left/top/width/height). */
export function hotspotStyle(bbox: BBox): Record<string, string> {
  return {
    left: `${bbox[0]}%`,
    top: `${bbox[1]}%`,
    width: `${bbox[2]}%`,
    height: `${bbox[3]}%`,
  };
}

/**
 * Caption plate anchor: beside the object (right side if there is room,
 * otherwise to the left), vertically biased to the object's top.
 */
export function plateStyle(bbox: BBox): Record<string, string> {
  const onRight = bbox[0] + bbox[2] / 2 < 50;
  const anchorX = onRight ? clamp(bbox[0] + bbox[2] + 1, 4, 72) : clamp(100 - bbox[0] + 1, 4, 72);
  const top = clamp(bbox[1], 4, 64);
  return onRight
    ? { left: `${anchorX}%`, top: `${top}%` }
    : { right: `${anchorX}%`, top: `${top}%` };
}

/** Small annotation label pinned onto the object, horizontally centred + clamped. */
export function annotationStyle(bbox: BBox): Record<string, string> {
  const center = clamp(bbox[0] + bbox[2] / 2, 9, 91);
  return { left: `${center}%`, top: `${clamp(bbox[1] - 4, 0, 88)}%`, transform: 'translate(-50%, -100%)' };
}
