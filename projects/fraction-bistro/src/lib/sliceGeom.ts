// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Slice geometry for the cutting table. Pure math — the same numbers drive
// the dish view (clip wedges / grid cells), the separation offset, the drag
// ghost and the plate row layout. Dish coordinate space is a 240×240 box
// (round dishes: center 120,120, outer radius 100; focaccia: the cell grid
// inside its 192×128 pan).

import type { DishKind } from './types';

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SliceGeom {
  index: number;
  /** clip/hit path in dish coordinates */
  d: string;
  /** centroid of the slice (drag/separation anchor) */
  cx: number;
  cy: number;
  bbox: BBox;
  /** separation vector (unit) pointing away from the dish center */
  dx: number;
  dy: number;
}

export const VB = 240;
export const ROUND_CX = 120;
export const ROUND_CY = 120;
export const ROUND_R = 100;
/** focaccia pan inside the 240 box */
export const RECT = { x: 24, y: 56, w: 192, h: 128 };

/** partition → grid rows × cols for rectangular dishes */
export function gridFor(partition: number): { rows: number; cols: number } {
  switch (partition) {
    case 2:
      return { rows: 1, cols: 2 };
    case 3:
      return { rows: 1, cols: 3 };
    case 4:
      return { rows: 2, cols: 2 };
    case 6:
      return { rows: 2, cols: 3 };
    case 8:
      return { rows: 2, cols: 4 };
    default:
      return { rows: 1, cols: 1 };
  }
}

const pt = (angleDeg: number, r: number): [number, number] => {
  const a = (angleDeg * Math.PI) / 180;
  return [ROUND_CX + r * Math.cos(a), ROUND_CY + r * Math.sin(a)];
};

function wedgeBBox(a1: number, a2: number): BBox {
  // sample the arc + apex; enough samples for an exact-enough axis box
  let minX = ROUND_CX;
  let minY = ROUND_CY;
  let maxX = ROUND_CX;
  let maxY = ROUND_CY;
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const a = a1 + ((a2 - a1) * i) / steps;
    const [x, y] = pt(a, ROUND_R);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Geometry of slice `index` when a dish of `kind` is cut into `partition`. */
export function sliceGeom(kind: DishKind, partition: number, index: number): SliceGeom {
  if (kind === 'round') {
    const step = 360 / partition;
    const a1 = -90 + index * step;
    const a2 = a1 + step;
    const [x1, y1] = pt(a1, ROUND_R + 2);
    const [x2, y2] = pt(a2, ROUND_R + 2);
    const largeArc = a2 - a1 > 180 ? 1 : 0;
    const d = `M ${ROUND_CX} ${ROUND_CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${(
      ROUND_R + 2
    ).toFixed(2)} ${(ROUND_R + 2).toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    const mid = (a1 + a2) / 2;
    const cRad = ROUND_R * 0.62;
    const cx = ROUND_CX + cRad * Math.cos((mid * Math.PI) / 180);
    const cy = ROUND_CY + cRad * Math.sin((mid * Math.PI) / 180);
    const dirLen = Math.hypot(cx - ROUND_CX, cy - ROUND_CY) || 1;
    return {
      index,
      d,
      cx,
      cy,
      bbox: wedgeBBox(a1, a2),
      dx: (cx - ROUND_CX) / dirLen,
      dy: (cy - ROUND_CY) / dirLen,
    };
  }
  const { rows, cols } = gridFor(partition);
  const cw = RECT.w / cols;
  const ch = RECT.h / rows;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const x = RECT.x + col * cw;
  const y = RECT.y + row * ch;
  const d = `M ${x} ${y} H ${x + cw} V ${y + ch} H ${x} Z`;
  const cx = x + cw / 2;
  const cy = y + ch / 2;
  const pCx = RECT.x + RECT.w / 2;
  const pCy = RECT.y + RECT.h / 2;
  const dirLen = Math.hypot(cx - pCx, cy - pCy) || 1;
  return {
    index,
    d,
    cx,
    cy,
    bbox: { x, y, w: cw, h: ch },
    dx: (cx - pCx) / dirLen,
    dy: (cy - pCy) / dirLen,
  };
}

export function allSliceGeoms(kind: DishKind, partition: number): SliceGeom[] {
  if (partition < 2) return [];
  return Array.from({ length: partition }, (_, i) => sliceGeom(kind, partition, i));
}

/** Cut boundary lines (dashed) for the current partition. */
export function cutLines(kind: DishKind, partition: number): { x1: number; y1: number; x2: number; y2: number }[] {
  if (partition < 2) return [];
  const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (kind === 'round') {
    const step = 360 / partition;
    for (let i = 0; i < partition; i++) {
      const [x, y] = pt(-90 + i * step, ROUND_R - 1);
      out.push({ x1: ROUND_CX, y1: ROUND_CY, x2: x, y2: y });
    }
  } else {
    const { rows, cols } = gridFor(partition);
    for (let c = 1; c < cols; c++) {
      const x = RECT.x + (RECT.w / cols) * c;
      out.push({ x1: x, y1: RECT.y, x2: x, y2: RECT.y + RECT.h });
    }
    for (let r = 1; r < rows; r++) {
      const y = RECT.y + (RECT.h / rows) * r;
      out.push({ x1: RECT.x, y1: y, x2: RECT.x + RECT.w, y2: y });
    }
  }
  return out;
}

/**
 * Transform placing slice `geom` into slot `slot` of a row of `count` slices
 * inside an SVG of width `rowW` and height `rowH` (dish coordinates → row).
 */
export function rowSlotTransform(
  geom: SliceGeom,
  slot: number,
  count: number,
  rowW: number,
  rowH: number,
  gap = 6,
): string {
  const pad = 8;
  const slotW = (rowW - pad * 2 - gap * (count - 1)) / count;
  const scale = Math.min(slotW / geom.bbox.w, rowH / geom.bbox.h, 0.62);
  const w = geom.bbox.w * scale;
  const h = geom.bbox.h * scale;
  const tx = pad + slot * (slotW + gap) + (slotW - w) / 2 - geom.bbox.x * scale;
  const ty = (rowH - h) / 2 - geom.bbox.y * scale;
  return `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`;
}
