// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

/**
 * Geometry Builder — pure engine.
 *
 * Contains ALL geometry and game logic for the workbench: shape placement,
 * grid snapping, slot matching, constraint validation (symmetry, piece
 * budget), blueprint outline computation (edge cancellation), perimeter
 * walk, and undo/redo history. NO Angular imports — this module is also
 * exercised headless by scripts/engine-sim.mjs.
 *
 * Conventions
 *  - World units: 1 unit = one grid cell. y grows downward (SVG).
 *  - Shape `pts` are centered on the origin (bbox center = 0,0) so rotation
 *    about the origin rotates about the shape center.
 *  - Piece / slot `x,y` is the CENTER position in world units, snapped to
 *    integers. `rot` is degrees, a multiple of 15.
 *  - Matching a piece to a slot compares the exact world polygons (vertex
 *    sets), so rotation/winding labeling never matters.
 */

// ---------------------------------------------------------------------------
// Types (mirror public/data/*.json — see lib/data.ts validation)
// ---------------------------------------------------------------------------

export interface Pt {
  x: number;
  y: number;
}

export interface ShapeProperties {
  sides: number;
  angles: number[]; // interior angles, degrees
  parallelPairs: number; // pairs of parallel sides
  rightAngles: number;
  symmetryLines: number; // lines of reflection symmetry
}

export type FillToken = 'cobalt' | 'vermilion' | 'mustard' | 'graphite';

export interface ShapeDef {
  id: string;
  label: string;
  family: string;
  pts: Pt[];
  fill: FillToken;
  properties: ShapeProperties;
}

export interface Piece {
  uid: string;
  shapeId: string;
  x: number;
  y: number;
  rot: number;
}

export interface Slot {
  id: string;
  shapeId: string;
  x: number;
  y: number;
  rot: number;
  buildable: boolean;
}

export type TrackId = 'houses' | 'bridges' | 'robots';

export interface Mission {
  id: string;
  track: TrackId;
  sheetNo: string;
  title: string;
  brief: string;
  difficulty: 1 | 2 | 3;
  canvas: { w: number; h: number };
  tray: { shapeId: string; count: number }[];
  slots: Slot[];
  constraints: {
    symmetry?: 'vertical';
    mirrorLine?: number; // world x of the mirror line (units)
    maxPieces: number;
  };
  targetProperties: string[];
  hints: string[]; // exactly 3 progressive hints
  reviewNote?: string;
}

export type ShapeMap = Map<string, ShapeDef>;

export type FeedbackKind = 'idle' | 'placed' | 'nudge' | 'complete' | 'info';

export interface Feedback {
  kind: FeedbackKind;
  text: string;
}

export interface Snapshot {
  pieces: Piece[];
  tray: Record<string, number>;
}

export interface Session {
  missionId: string;
  pieces: Piece[];
  tray: Record<string, number>;
  selectedUid: string | null;
  selectedTrayShape: string | null;
  hintLevel: number; // 0 = off, 1..3
  status: 'building' | 'complete';
  feedback: Feedback;
  past: Snapshot[];
  future: Snapshot[];
}

export interface Validation {
  complete: boolean;
  slotMatch: Record<string, string | null>; // slotId -> matching piece uid
  unmatchedPieces: string[];
  symmetryOk: boolean | null; // null when no symmetry constraint
  piecesOk: boolean;
  filledCount: number;
  totalSlots: number;
}

export const SNAP_UNIT = 1; // grid snap in world units (the technical grid)
export const ROT_STEP = 15; // rotation increment, degrees

const EPS = 1e-6;
const KEY_PRECISION = 3; // decimals for polygon keys

// ---------------------------------------------------------------------------
// Geometry primitives
// ---------------------------------------------------------------------------

export function rotatePt(p: Pt, deg: number): Pt {
  const t = (deg * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

/** World-space polygon of a shape placed with its center at (x,y), rotated `rot` degrees. */
export function worldPolygon(shape: ShapeDef, x: number, y: number, rot: number): Pt[] {
  return shape.pts.map((p) => {
    const r = rotatePt(p, rot);
    return { x: r.x + x, y: r.y + y };
  });
}

export function piecePolygon(shapes: ShapeMap, piece: Piece): Pt[] {
  const shape = shapes.get(piece.shapeId);
  if (!shape) return [];
  return worldPolygon(shape, piece.x, piece.y, piece.rot);
}

/** Canonical key for a polygon: rounded, lexicographically sorted vertices. */
export function polyKey(poly: Pt[]): string {
  return poly
    .map((p) => `${round(p.x)},${round(p.y)}`)
    .sort()
    .join(';');
}

function round(n: number): number {
  return Math.round(n * 10 ** KEY_PRECISION) / 10 ** KEY_PRECISION;
}

/** Shoelace area — positive = counter-clockwise winding (math convention). */
export function polygonArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

export function polygonPerimeter(poly: Pt[]): number {
  let len = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    len += Math.hypot(q.x - p.x, q.y - p.y);
  }
  return len;
}

/** Normalize winding to positive shoelace area so oriented-edge cancellation is valid. */
export function normalizeWinding(pts: Pt[]): Pt[] {
  const area = polygonArea(pts);
  if (area < 0) return [...pts].reverse();
  return [...pts];
}

/** SAT overlap test for convex polygons. Touching edges (gap 0) do NOT overlap. */
export function convexOverlap(a: Pt[], b: Pt[]): boolean {
  const polys = [a, b];
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      // edge normal axis
      const nx = q.y - p.y;
      const ny = -(q.x - p.x);
      let minA = Infinity;
      let maxA = -Infinity;
      let minB = Infinity;
      let maxB = -Infinity;
      for (const v of a) {
        const d = v.x * nx + v.y * ny;
        if (d < minA) minA = d;
        if (d > maxA) maxA = d;
      }
      for (const v of b) {
        const d = v.x * nx + v.y * ny;
        if (d < minB) minB = d;
        if (d > maxB) maxB = d;
      }
      if (maxA - EPS <= minB || maxB - EPS <= minA) return false; // separating axis
    }
  }
  return true;
}

/** Point in convex polygon (inclusive of boundary within epsilon). */
export function pointInConvex(poly: Pt[], pt: Pt): boolean {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const cross = (q.x - p.x) * (pt.y - p.y) - (q.y - p.y) * (pt.x - p.x);
    if (Math.abs(cross) < 1e-9) continue;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

export function reflectPolyX(poly: Pt[], lineX: number): Pt[] {
  return poly.map((p) => ({ x: 2 * lineX - p.x, y: p.y }));
}

// ---------------------------------------------------------------------------
// Slot matching + validation
// ---------------------------------------------------------------------------

function slotPiece(slot: Slot): Piece {
  return { uid: `slot:${slot.id}`, shapeId: slot.shapeId, x: slot.x, y: slot.y, rot: slot.rot };
}

/** True when the piece's world polygon sits exactly on the slot's world polygon. */
export function matchesSlot(shapes: ShapeMap, piece: Piece, slot: Slot): boolean {
  if (piece.shapeId !== slot.shapeId) return false;
  const shape = shapes.get(slot.shapeId);
  if (!shape) return false;
  return polyKey(piecePolygon(shapes, piece)) === polyKey(piecePolygon(shapes, slotPiece(slot)));
}

function pieceKeySet(shapes: ShapeMap, pieces: Piece[]): Set<string> {
  const set = new Set<string>();
  for (const piece of pieces) {
    const shape = shapes.get(piece.shapeId);
    if (!shape) continue;
    set.add(`${piece.shapeId}|${polyKey(piecePolygon(shapes, piece))}`);
  }
  return set;
}

/**
 * Vertical-mirror symmetry check: the multiset of piece polygons must be
 * invariant under reflection across `lineX`. Printed (non-buildable) slots
 * are included as fixed pieces so half-printed blueprints verify too.
 */
export function checkSymmetry(mission: Mission, shapes: ShapeMap, pieces: Piece[]): boolean {
  const line = mission.constraints.mirrorLine ?? mission.canvas.w / 2;
  const all: Piece[] = [
    ...pieces,
    ...mission.slots.filter((s) => !s.buildable).map((s) => slotPiece(s)),
  ];
  const direct = pieceKeySet(shapes, all);
  // Reflect every piece and build the reflected key set. Reflected polygons
  // keep their shapeId; the vertex-set key is winding-agnostic.
  const reflected = new Set<string>();
  for (const piece of all) {
    const shape = shapes.get(piece.shapeId);
    if (!shape) continue;
    const poly = reflectPolyX(piecePolygon(shapes, piece), line);
    reflected.add(`${piece.shapeId}|${polyKey(poly)}`);
  }
  if (direct.size !== reflected.size) return false;
  for (const key of reflected) if (!direct.has(key)) return false;
  return true;
}

export function validate(mission: Mission, shapes: ShapeMap, pieces: Piece[]): Validation {
  const buildable = mission.slots.filter((s) => s.buildable);
  const slotMatch: Record<string, string | null> = {};
  const used = new Set<string>();
  for (const slot of buildable) {
    slotMatch[slot.id] = null;
    for (const piece of pieces) {
      if (used.has(piece.uid)) continue;
      if (matchesSlot(shapes, piece, slot)) {
        slotMatch[slot.id] = piece.uid;
        used.add(piece.uid);
        break;
      }
    }
  }
  const unmatchedPieces = pieces.filter((p) => !used.has(p.uid)).map((p) => p.uid);
  const filledCount = buildable.filter((s) => slotMatch[s.id] !== null).length;
  const piecesOk = pieces.length <= mission.constraints.maxPieces;
  const symmetryOk =
    mission.constraints.symmetry === 'vertical' ? checkSymmetry(mission, shapes, pieces) : null;
  const complete =
    filledCount === buildable.length &&
    unmatchedPieces.length === 0 &&
    piecesOk &&
    symmetryOk !== false;
  return { complete, slotMatch, unmatchedPieces, symmetryOk, piecesOk, filledCount, totalSlots: buildable.length };
}

/** The next slot a hint should point at: first buildable slot with no match. */
export function nextHintSlot(mission: Mission, validation: Validation): Slot | null {
  return (
    mission.slots.find((s) => s.buildable && validation.slotMatch[s.id] === null) ?? null
  );
}

// ---------------------------------------------------------------------------
// Blueprint outline — oriented-edge cancellation
// ---------------------------------------------------------------------------

export interface Outline {
  loops: Pt[][];
  outer: Pt[] | null;
}

function edgeKey(a: Pt, b: Pt): string {
  return `${round(a.x)},${round(a.y)}>${round(b.x)},${round(b.y)}`;
}

/**
 * Union boundary of the placed pieces. Every piece contributes its oriented
 * edges, SPLIT at T-junctions (vertices of other pieces lying collinearly in
 * an edge's interior); shared sub-edges (a→b and b→a) cancel exactly, leaving
 * the outer boundary plus any interior holes. Requires non-overlapping pieces.
 */
export function computeOutline(shapes: ShapeMap, pieces: Piece[]): Outline {
  const polys = pieces.map((p) => piecePolygon(shapes, p)).filter((p) => p.length > 0);
  const allPts = polys.flat();
  const rawEdges: [Pt, Pt][] = [];
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const len2 = abx * abx + aby * aby;
      if (len2 === 0) continue;
      // T-junction cuts: other pieces' vertices strictly inside this edge.
      const cuts: { t: number; p: Pt }[] = [];
      for (const v of allPts) {
        const cross = abx * (v.y - a.y) - aby * (v.x - a.x);
        if (Math.abs(cross) > 1e-9) continue;
        const t = ((v.x - a.x) * abx + (v.y - a.y) * aby) / len2;
        if (t > 1e-9 && t < 1 - 1e-9) cuts.push({ t, p: v });
      }
      cuts.sort((c1, c2) => c1.t - c2.t);
      let prev = a;
      for (const cut of cuts) {
        if (round(cut.p.x) === round(prev.x) && round(cut.p.y) === round(prev.y)) continue;
        rawEdges.push([prev, cut.p]);
        prev = cut.p;
      }
      rawEdges.push([prev, b]);
    }
  }
  const edges = new Map<string, [Pt, Pt]>(); // key -> edge
  for (const [a, b] of rawEdges) {
    const forward = edgeKey(a, b);
    const backward = edgeKey(b, a);
    if (edges.has(backward)) edges.delete(backward); // interior edge cancels
    else edges.set(forward, [a, b]);
  }
  // chain remaining edges into loops
  const byStart = new Map<string, [Pt, Pt][]>();
  for (const [key, e] of edges) {
    const k = `${round(e[0].x)},${round(e[0].y)}`;
    const list = byStart.get(k) ?? [];
    list.push(e);
    byStart.set(k, list);
  }
  const loops: Pt[][] = [];
  const consumed = new Set<string>();
  for (const [key, e] of edges) {
    if (consumed.has(key)) continue;
    const loop: Pt[] = [e[0]];
    let cursor = e;
    consumed.add(key);
    for (;;) {
      loop.push(cursor[1]);
      const nextKey = `${round(cursor[1].x)},${round(cursor[1].y)}`;
      const candidates = (byStart.get(nextKey) ?? []).filter(
        (c) => !consumed.has(edgeKey(c[0], c[1])),
      );
      if (candidates.length === 0) break; // open chain (should not happen)
      cursor = candidates[0];
      const ck = edgeKey(cursor[0], cursor[1]);
      consumed.add(ck);
      if (round(cursor[1].x) === round(loop[0].x) && round(cursor[1].y) === round(loop[0].y)) {
        break; // closed back to start (loop[0] is already the first vertex)
      }
    }
    loops.push(loop);
  }
  loops.sort((a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)));
  return { loops, outer: loops[0] ?? null };
}

// ---------------------------------------------------------------------------
// Perimeter walk + angle annotation
// ---------------------------------------------------------------------------

export interface WalkEdges {
  edges: { a: Pt; b: Pt; length: number; midpoint: Pt; angleRad: number }[];
  perimeter: number;
}

export function walkEdges(loop: Pt[]): WalkEdges {
  const edges = loop.map((a, i) => {
    const b = loop[(i + 1) % loop.length];
    return {
      a,
      b,
      length: Math.hypot(b.x - a.x, b.y - a.y),
      midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      angleRad: Math.atan2(b.y - a.y, b.x - a.x),
    };
  });
  return { edges, perimeter: edges.reduce((s, e) => s + e.length, 0) };
}

/** Interior angle (degrees) of a simple loop at vertex i. */
export function interiorAngleAt(loop: Pt[], i: number): number {
  const n = loop.length;
  const prev = loop[(i - 1 + n) % n];
  const v = loop[i];
  const next = loop[(i + 1) % n];
  const u = { x: v.x - prev.x, y: v.y - prev.y }; // incoming direction
  const w = { x: next.x - v.x, y: next.y - v.y }; // outgoing direction
  const dot = u.x * w.x + u.y * w.y;
  const cross = u.x * w.y - u.y * w.x;
  const turn = (Math.atan2(cross, dot) * 180) / Math.PI; // signed turn -180..180
  let interior = 180 - turn;
  while (interior < 0) interior += 360;
  while (interior >= 360) interior -= 360;
  return interior;
}

export function isRightAngle(deg: number): boolean {
  return Math.abs(deg - 90) < 0.5;
}

/** Format a length for dimension labels: integers plain, otherwise 1 decimal. */
export function formatLength(len: number): string {
  const r = Math.round(len * 10) / 10;
  return Number.isInteger(r) ? `${r}` : `${r.toFixed(1)}`;
}

export interface WalkState {
  measured: number[]; // measured edge indices
  total: number;
  complete: boolean;
}

export function initialWalk(edgeCount: number): WalkState {
  return { measured: [], total: 0, complete: edgeCount === 0 };
}

export function measureEdge(walk: WalkState, index: number, edges: { length: number }[]): WalkState {
  if (walk.measured.includes(index)) return walk;
  const measured = [...walk.measured, index];
  const total = measured.reduce((s, i) => s + edges[i].length, 0);
  return { measured, total, complete: measured.length === edges.length };
}

// ---------------------------------------------------------------------------
// Workbench session (state transitions + undo/redo)
// ---------------------------------------------------------------------------

let uidCounter = 0;
export function nextUid(): string {
  uidCounter += 1;
  return `p${uidCounter}`;
}

export function createSession(mission: Mission): Session {
  const tray: Record<string, number> = {};
  for (const t of mission.tray) tray[t.shapeId] = t.count;
  return {
    missionId: mission.id,
    pieces: [],
    tray,
    selectedUid: null,
    selectedTrayShape: null,
    hintLevel: 0,
    status: 'building',
    feedback: { kind: 'idle', text: '' },
    past: [],
    future: [],
  };
}

function snapshot(s: Session): Snapshot {
  return { pieces: s.pieces.map((p) => ({ ...p })), tray: { ...s.tray } };
}

function withHistory(s: Session, next: Partial<Session>): Session {
  return {
    ...s,
    ...next,
    past: [...s.past.slice(-49), snapshot(s)],
    future: [],
  };
}

export function canUndo(s: Session): boolean {
  return s.past.length > 0;
}

export function canRedo(s: Session): boolean {
  return s.future.length > 0;
}

export function undo(s: Session): Session {
  if (!s.past.length) return s;
  const past = [...s.past];
  const prev = past.pop()!;
  return {
    ...s,
    pieces: prev.pieces,
    tray: prev.tray,
    selectedUid: null,
    past,
    future: [snapshot(s), ...s.future.slice(0, 49)],
    feedback: { kind: 'info', text: 'Undo.' },
  };
}

export function redo(s: Session): Session {
  if (!s.future.length) return s;
  const [next, ...rest] = s.future;
  return {
    ...s,
    pieces: next.pieces,
    tray: next.tray,
    selectedUid: null,
    future: rest,
    past: [...s.past, snapshot(s)],
    feedback: { kind: 'info', text: 'Redo.' },
  };
}

/** Snap a pointer position to the grid (integer centers). */
export function snap(v: number): number {
  return Math.round(v / SNAP_UNIT) * SNAP_UNIT;
}

export function normalizeRot(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function selectPiece(s: Session, uid: string | null): Session {
  return { ...s, selectedUid: uid, selectedTrayShape: null };
}

export function selectTrayShape(s: Session, shapeId: string | null): Session {
  return { ...s, selectedTrayShape: shapeId, selectedUid: null };
}

export function trayCount(s: Session, shapeId: string): number {
  return s.tray[shapeId] ?? 0;
}

/** Find a free snapped position for a new piece near the canvas center. */
export function findFreeSpot(mission: Mission, shapes: ShapeMap, pieces: Piece[], shapeId: string): Pt {
  const shape = shapes.get(shapeId);
  const cx = Math.round(mission.canvas.w / 2);
  const cy = Math.round(mission.canvas.h / 2);
  if (!shape) return { x: cx, y: cy };
  const others = pieces.map((p) => piecePolygon(shapes, p));
  const maxR = Math.max(mission.canvas.w, mission.canvas.h);
  for (let r = 0; r <= maxR; r += 1) {
    for (let dx = -r; dx <= r; dx += 1) {
      for (let dy = -r; dy <= r; dy += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; // ring walk
        const x = cx + dx;
        const y = cy + dy;
        if (x < 1 || y < 1 || x > mission.canvas.w - 1 || y > mission.canvas.h - 1) continue;
        const poly = worldPolygon(shape, x, y, 0);
        if (others.every((o) => !convexOverlap(poly, o))) return { x, y };
      }
    }
  }
  return { x: cx, y: cy };
}

/** Place a new piece from the tray at an explicit (already snapped) position. */
export function addPiece(s: Session, shapes: ShapeMap, shapeId: string, x: number, y: number, rot = 0): Session {
  if ((s.tray[shapeId] ?? 0) <= 0) return s;
  const piece: Piece = { uid: nextUid(), shapeId, x, y, rot: normalizeRot(rot) };
  const shape = shapes.get(shapeId);
  return withHistory(s, {
    pieces: [...s.pieces, piece],
    tray: { ...s.tray, [shapeId]: s.tray[shapeId] - 1 },
    selectedUid: piece.uid,
    selectedTrayShape: null,
    hintLevel: 0,
    feedback: {
      kind: 'placed',
      text: `${shape?.label ?? shapeId} on the sheet — drag it onto a dashed outline.`,
    },
  });
}

/** Place from tray at the first free spot near the canvas center (no-drag path). */
export function placeFromTray(s: Session, mission: Mission, shapes: ShapeMap, shapeId: string): Session {
  const spot = findFreeSpot(mission, shapes, s.pieces, shapeId);
  return addPiece(s, shapes, shapeId, spot.x, spot.y);
}

/** Move a piece by whole units (keyboard arrows / inspector buttons). */
export function nudgePiece(s: Session, uid: string, dx: number, dy: number, mission: Mission): Session {
  const piece = s.pieces.find((p) => p.uid === uid);
  if (!piece) return s;
  const x = Math.min(Math.max(piece.x + dx, 0), mission.canvas.w);
  const y = Math.min(Math.max(piece.y + dy, 0), mission.canvas.h);
  if (x === piece.x && y === piece.y) return s;
  return withHistory(s, {
    pieces: s.pieces.map((p) => (p.uid === uid ? { ...p, x, y } : p)),
    selectedUid: uid,
    feedback: { kind: 'idle', text: '' },
  });
}

export function rotatePieceBy(s: Session, uid: string, delta: number): Session {
  const piece = s.pieces.find((p) => p.uid === uid);
  if (!piece) return s;
  return withHistory(s, {
    pieces: s.pieces.map((p) => (p.uid === uid ? { ...p, rot: normalizeRot(p.rot + delta) } : p)),
    selectedUid: uid,
    feedback: { kind: 'idle', text: '' },
  });
}

/** Continuous drag update — NOT pushed to history; call endDrag() to commit. */
export function dragPieceTo(s: Session, uid: string, x: number, y: number): Session {
  return {
    ...s,
    pieces: s.pieces.map((p) => (p.uid === uid ? { ...p, x, y } : p)),
    selectedUid: uid,
    selectedTrayShape: null,
  };
}

/** Commit a drag: snap to grid and push one history step. */
export function endDrag(s: Session, uid: string, returnedToTray: boolean, shapes: ShapeMap): Session {
  const piece = s.pieces.find((p) => p.uid === uid);
  if (!piece) return s;
  if (returnedToTray) {
    return withHistory(s, {
      pieces: s.pieces.filter((p) => p.uid !== uid),
      tray: { ...s.tray, [piece.shapeId]: (s.tray[piece.shapeId] ?? 0) + 1 },
      selectedUid: null,
      feedback: { kind: 'info', text: `${shapes.get(piece.shapeId)?.label ?? 'Piece'} back in the parts bin.` },
    });
  }
  return withHistory(s, {
    pieces: s.pieces.map((p) => (p.uid === uid ? { ...p, x: snap(piece.x), y: snap(piece.y) } : p)),
    selectedUid: uid,
    feedback: { kind: 'idle', text: '' },
  });
}

export function removePiece(s: Session, uid: string, shapes: ShapeMap): Session {
  const piece = s.pieces.find((p) => p.uid === uid);
  if (!piece) return s;
  return withHistory(s, {
    pieces: s.pieces.filter((p) => p.uid !== uid),
    tray: { ...s.tray, [piece.shapeId]: (s.tray[piece.shapeId] ?? 0) + 1 },
    selectedUid: null,
    feedback: {
      kind: 'info',
      text: `${shapes.get(piece.shapeId)?.label ?? 'Piece'} back in the parts bin.`,
    },
  });
}

export function bumpHint(s: Session): Session {
  const level = Math.min(s.hintLevel + 1, 3);
  return { ...s, hintLevel: level };
}

/** Topmost piece under a world point (last placed wins). */
export function pieceAtPoint(shapes: ShapeMap, pieces: Piece[], pt: Pt): Piece | null {
  for (let i = pieces.length - 1; i >= 0; i--) {
    const poly = piecePolygon(shapes, pieces[i]);
    if (poly.length && pointInConvex(poly, pt)) return pieces[i];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Copy (single source so engine-sim can verify feedback wording)
// ---------------------------------------------------------------------------

export function feedbackFor(validation: Validation, mission: Mission): Feedback {
  if (validation.complete) {
    return {
      kind: 'complete',
      text: `CHECKED — “${mission.title}” matches the blueprint.`,
    };
  }
  if (validation.unmatchedPieces.length > 0) {
    return {
      kind: 'nudge',
      text: `${validation.unmatchedPieces.length} piece${validation.unmatchedPieces.length > 1 ? 's are' : ' is'} off the dashed outlines — every piece must sit on the blueprint.`,
    };
  }
  return {
    kind: 'nudge',
    text: `${validation.filledCount} of ${validation.totalSlots} pieces locked — keep building on the dashed outlines.`,
  };
}

// ---------------------------------------------------------------------------
// Dev-time data validation (lib/data.ts + engine-sim)
// ---------------------------------------------------------------------------

export function validateShapes(shapes: ShapeDef[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const s of shapes) {
    if (ids.has(s.id)) errors.push(`duplicate shape id ${s.id}`);
    ids.add(s.id);
    if (s.pts.length < 3) errors.push(`shape ${s.id}: needs at least 3 points`);
    const p = s.properties;
    if (p.sides !== s.pts.length) errors.push(`shape ${s.id}: sides ${p.sides} != pts ${s.pts.length}`);
    if (p.angles.length !== s.pts.length) errors.push(`shape ${s.id}: angles list length mismatch`);
    if (Math.round(p.angles.reduce((a, b) => a + b, 0)) !== (s.pts.length - 2) * 180) {
      errors.push(`shape ${s.id}: interior angles do not sum to (n-2)*180`);
    }
    if (p.rightAngles !== p.angles.filter((a) => isRightAngle(a)).length) {
      errors.push(`shape ${s.id}: rightAngles count mismatch`);
    }
  }
  return errors;
}

export function validateMission(mission: Mission, shapes: ShapeMap): string[] {
  const errors: string[] = [];
  const m = mission.id;
  const buildable = mission.slots.filter((s) => s.buildable);
  if (mission.hints.length !== 3) errors.push(`${m}: needs exactly 3 hints`);
  if (buildable.length === 0) errors.push(`${m}: no buildable slots`);
  if (mission.constraints.maxPieces < buildable.length) {
    errors.push(`${m}: maxPieces ${mission.constraints.maxPieces} < buildable slots ${buildable.length}`);
  }
  const trayByShape: Record<string, number> = {};
  for (const t of mission.tray) trayByShape[t.shapeId] = (trayByShape[t.shapeId] ?? 0) + t.count;
  const slotByShape: Record<string, number> = {};
  for (const s of buildable) slotByShape[s.shapeId] = (slotByShape[s.shapeId] ?? 0) + 1;
  for (const [shapeId, need] of Object.entries(slotByShape)) {
    if ((trayByShape[shapeId] ?? 0) < need) {
      errors.push(`${m}: tray has ${trayByShape[shapeId] ?? 0} × ${shapeId}, needs ${need}`);
    }
  }
  for (const t of mission.tray) {
    if (!shapes.has(t.shapeId)) errors.push(`${m}: unknown tray shape ${t.shapeId}`);
  }
  // slot geometry
  const polys: { id: string; poly: Pt[] }[] = [];
  for (const slot of mission.slots) {
    const shape = shapes.get(slot.shapeId);
    if (!shape) {
      errors.push(`${m}: slot ${slot.id} references unknown shape ${slot.shapeId}`);
      continue;
    }
    if (!Number.isInteger(slot.x) || !Number.isInteger(slot.y)) {
      errors.push(`${m}: slot ${slot.id} center must be integer (${slot.x},${slot.y})`);
    }
    if (slot.rot % ROT_STEP !== 0) errors.push(`${m}: slot ${slot.id} rot must be a multiple of 15`);
    const poly = worldPolygon(shape, slot.x, slot.y, slot.rot);
    for (const p of poly) {
      if (p.x < -0.001 || p.y < -0.001 || p.x > mission.canvas.w + 0.001 || p.y > mission.canvas.h + 0.001) {
        errors.push(`${m}: slot ${slot.id} vertex (${round(p.x)},${round(p.y)}) outside canvas`);
        break;
      }
    }
    polys.push({ id: slot.id, poly });
  }
  for (let i = 0; i < polys.length; i++) {
    for (let j = i + 1; j < polys.length; j++) {
      if (convexOverlap(polys[i].poly, polys[j].poly)) {
        errors.push(`${m}: slots ${polys[i].id} and ${polys[j].id} overlap`);
      }
    }
  }
  // symmetry constraint sanity: printed slots must mirror buildable slots
  if (mission.constraints.symmetry === 'vertical') {
    const fakeMission = { ...mission, constraints: { ...mission.constraints } };
    const printed = fakeMission.slots.filter((s) => !s.buildable).map((s) => slotPiece(s));
    if (printed.length > 0) {
      const ok = checkSymmetry(fakeMission, shapes, fakeMission.slots.filter((s) => s.buildable).map((s) => slotPiece(s)));
      if (!ok) errors.push(`${m}: symmetry constraint but printed+buildable slots are not mirror-symmetric`);
    }
  }
  return errors;
}
