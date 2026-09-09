// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Pure program-editing + interpreter logic — no React, no DOM, no network.
// Content comes from JSON (content state); this file only manipulates
// interaction state (spec: three-layer state model). Everything here is
// deterministic and covered by scripts/engine-sim.mjs.

import type { Dir, Level, SimpleOp } from '../../lib/types';

// ---------------------------------------------------------------------------
// Program model (tiles)
// ---------------------------------------------------------------------------

export interface TileSimple {
  id: string;
  op: SimpleOp;
}

export interface TileRepeat {
  id: string;
  op: 'REPEAT';
  times: number;
  body: TileSimple[];
}

export type Tile = TileSimple | TileRepeat;

/** Where the next placed tile lands: 'root' or inside a repeat tile. */
export interface Caret {
  scope: string;
  index: number;
}

export const MIN_REPEAT = 2;
export const MAX_REPEAT = 8;
/** Tiles that fit inside one repeat body (keeps loops kid-legible). */
export const MAX_BODY = 4;
/** Safety cap on the expanded step list (guard against runaway programs). */
export const MAX_EXPANDED_STEPS = 400;

export function makeTile(op: SimpleOp | 'REPEAT', id: string): Tile {
  return op === 'REPEAT'
    ? { id, op: 'REPEAT', times: 3, body: [] }
    : { id, op };
}

/** Top-level slots used (REPEAT counts as one slot — spec maxCommands). */
export function topLevelCount(program: Tile[]): number {
  return program.length;
}

export function locateTile(
  program: Tile[],
  id: string,
): { scope: string; index: number; tile: Tile } | null {
  for (let i = 0; i < program.length; i++) {
    if (program[i].id === id) return { scope: 'root', index: i, tile: program[i] };
  }
  for (const t of program) {
    if (t.op !== 'REPEAT') continue;
    for (let j = 0; j < t.body.length; j++) {
      if (t.body[j].id === id) return { scope: t.id, index: j, tile: t.body[j] };
    }
  }
  return null;
}

/** Insert a new tile at the caret. Returns null when the target is full. */
export function addTileAt(
  program: Tile[],
  caret: Caret,
  op: SimpleOp | 'REPEAT',
  id: string,
): { program: Tile[]; caret: Caret } | null {
  if (op === 'REPEAT' && caret.scope !== 'root') return null; // no nested repeats
  const tile = makeTile(op, id);
  if (caret.scope === 'root') {
    if (program.length < caret.index) return null;
    const next = [...program.slice(0, caret.index), tile, ...program.slice(caret.index)];
    return { program: next, caret: { ...caret, index: caret.index + 1 } };
  }
  const ownerIdx = program.findIndex((t) => t.id === caret.scope);
  if (ownerIdx < 0) return null;
  const owner = program[ownerIdx];
  if (owner.op !== 'REPEAT') return null;
  if (owner.body.length >= MAX_BODY) return null;
  const body = [...owner.body.slice(0, caret.index), tile as TileSimple, ...owner.body.slice(caret.index)];
  const program2 = program.map((t, i) => (i === ownerIdx ? { ...owner, body } : t));
  return { program: program2, caret: { ...caret, index: caret.index + 1 } };
}

/** Remove a tile anywhere in the program (repeat takes its body with it). */
export function removeTile(program: Tile[], id: string): Tile[] {
  const top = program.filter((t) => t.id !== id);
  if (top.length !== program.length) return top;
  return program.map((t) =>
    t.op === 'REPEAT' ? { ...t, body: t.body.filter((b) => b.id !== id) } : t,
  );
}

/** Move a tile one slot left/right inside its own scope. No-op at the edges. */
export function moveTile(program: Tile[], id: string, delta: -1 | 1): Tile[] {
  const at = locateTile(program, id);
  if (!at) return program;
  const to = at.index + delta;
  if (at.scope === 'root') {
    if (to < 0 || to >= program.length) return program;
    const next = [...program];
    [next[at.index], next[to]] = [next[to], next[at.index]];
    return next;
  }
  return program.map((t) => {
    if (t.op !== 'REPEAT' || t.id !== at.scope) return t;
    if (to < 0 || to >= t.body.length) return t;
    const body = [...t.body];
    [body[at.index], body[to]] = [body[to], body[at.index]];
    return { ...t, body };
  });
}

/** REPEAT rounds ± delta, clamped to a sane range. */
export function adjustRepeatTimes(program: Tile[], id: string, delta: number): Tile[] {
  return program.map((t) =>
    t.op === 'REPEAT' && t.id === id
      ? { ...t, times: Math.min(MAX_REPEAT, Math.max(MIN_REPEAT, t.times + delta)) }
      : t,
  );
}

/** Plain-text reading order of the program (screen readers, status line). */
export function programToText(program: Tile[]): string {
  if (program.length === 0) return 'empty program';
  return program
    .map((t) =>
      t.op === 'REPEAT'
        ? `repeat ${t.times} times (${t.body.map((b) => opLabel(b.op)).join(', ')})`
        : opLabel(t.op),
    )
    .join(', ');
}

export function opLabel(op: SimpleOp | 'REPEAT'): string {
  switch (op) {
    case 'F':
      return 'forward';
    case 'L':
      return 'turn left';
    case 'R':
      return 'turn right';
    case 'REPEAT':
      return 'repeat';
  }
}

// ---------------------------------------------------------------------------
// Expansion — the flat step list the interpreter walks
// ---------------------------------------------------------------------------

export interface StepRef {
  tileId: string;
  op: SimpleOp;
  /** Present when this step comes from inside a repeat tile. */
  repeat?: { id: string; round: number; rounds: number };
}

export class ProgramTooLong extends Error {}

export function expandProgram(program: Tile[]): StepRef[] {
  const steps: StepRef[] = [];
  const push = (s: StepRef) => {
    if (steps.length >= MAX_EXPANDED_STEPS) {
      throw new ProgramTooLong(`Program expands past ${MAX_EXPANDED_STEPS} steps.`);
    }
    steps.push(s);
  };
  for (const t of program) {
    if (t.op !== 'REPEAT') {
      push({ tileId: t.id, op: t.op });
      continue;
    }
    for (let round = 1; round <= t.times; round++) {
      for (const b of t.body) {
        push({ tileId: b.id, op: b.op, repeat: { id: t.id, round, rounds: t.times } });
      }
    }
  }
  return steps;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

export function rotate(dir: Dir, op: 'L' | 'R'): Dir {
  // L = counter-clockwise on screen (E→N→W→S), R clockwise (E→S→W→N).
  const order: Dir[] = ['N', 'W', 'S', 'E']; // counter-clockwise sequence
  const i = order.indexOf(dir);
  return order[(i + (op === 'L' ? 1 : 3)) % 4];
}

export function dirLabel(dir: Dir): string {
  return { N: 'north', E: 'east', S: 'south', W: 'west' }[dir];
}

/** Degrees for the SVG robot sprite (0 = facing east/right). */
export function dirAngle(dir: Dir): number {
  return { E: 0, S: 90, W: 180, N: 270 }[dir];
}

export function stepCell(cell: [number, number], dir: Dir): [number, number] {
  const d: Record<Dir, [number, number]> = {
    N: [0, -1],
    E: [1, 0],
    S: [0, 1],
    W: [-1, 0],
  };
  const [dc, dr] = d[dir];
  return [cell[0] + dc, cell[1] + dr];
}

export function cellEq(a: [number, number], b: [number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

export function inBounds(level: Level, cell: [number, number]): boolean {
  const [cols, rows] = level.grid;
  return cell[0] >= 0 && cell[0] < cols && cell[1] >= 0 && cell[1] < rows;
}

export function obstacleAt(level: Level, cell: [number, number]) {
  return level.obstacles.find((o) => cellEq(o.cell, cell)) ?? null;
}

export function collectibleAt(level: Level, cell: [number, number]) {
  return level.collectibles.find((c) => cellEq(c.cell, cell)) ?? null;
}

export function collectibleId(level: Level, cell: [number, number]): string {
  return `${level.id}:${cell[0]},${cell[1]}`;
}

// ---------------------------------------------------------------------------
// Run state — the step-through interpreter
// ---------------------------------------------------------------------------

export type RunStatus =
  | 'ready'
  | 'running'
  | 'paused'
  | 'bumped'
  | 'complete'
  | 'docked-incomplete'
  | 'ended-incomplete';

export interface BumpInfo {
  cell: [number, number];
  kind: 'wall' | 'obstacle';
  tileId: string;
}

interface HistoryEntry {
  pos: [number, number];
  dir: Dir;
  collected: string[];
  pc: number;
}

export interface RunState {
  levelId: string;
  pos: [number, number];
  dir: Dir;
  collected: string[];
  steps: StepRef[];
  pc: number;
  status: RunStatus;
  bump: BumpInfo | null;
  history: HistoryEntry[];
  lastStep: StepRef | null;
}

export function beginRun(level: Level, program: Tile[]): RunState {
  return {
    levelId: level.id,
    pos: [...level.start] as [number, number],
    dir: level.direction,
    collected: [],
    steps: expandProgram(program),
    pc: 0,
    status: 'ready',
    bump: null,
    history: [],
    lastStep: null,
  };
}

export function canStep(s: RunState): boolean {
  return s.status === 'ready' || s.status === 'running' || s.status === 'paused';
}

export function canRewind(s: RunState): boolean {
  return s.history.length > 0 && s.status !== 'complete';
}

/** Execute one expanded step. Terminal states are returned unchanged. */
export function stepOnce(s: RunState, level: Level): RunState {
  if (!canStep(s)) return s;
  if (s.pc >= s.steps.length) return { ...s, status: 'ended-incomplete' };
  const step = s.steps[s.pc];
  const history: HistoryEntry[] = [
    ...s.history,
    { pos: [...s.pos] as [number, number], dir: s.dir, collected: [...s.collected], pc: s.pc },
  ];

  if (step.op === 'L' || step.op === 'R') {
    const pc = s.pc + 1;
    return {
      ...s,
      history,
      dir: rotate(s.dir, step.op),
      pc,
      lastStep: step,
      status: pc >= s.steps.length ? 'ended-incomplete' : 'running',
    };
  }

  const next = stepCell(s.pos, s.dir);
  if (!inBounds(level, next)) {
    return {
      ...s,
      history,
      status: 'bumped',
      bump: { cell: next, kind: 'wall', tileId: step.tileId },
      lastStep: step,
    };
  }
  const obstacle = obstacleAt(level, next);
  if (obstacle) {
    return {
      ...s,
      history,
      status: 'bumped',
      bump: { cell: next, kind: 'obstacle', tileId: step.tileId },
      lastStep: step,
    };
  }

  const collected = [...s.collected];
  const c = collectibleAt(level, next);
  if (c && !collected.includes(collectibleId(level, next))) {
    collected.push(collectibleId(level, next));
  }

  const pc = s.pc + 1;
  if (cellEq(next, level.goal)) {
    // The dock is a dock: stepping onto it ends the run either way.
    const all = collected.length === level.collectibles.length;
    return {
      ...s,
      history,
      pos: next,
      collected,
      pc,
      lastStep: step,
      status: all ? 'complete' : 'docked-incomplete',
      bump: null,
    };
  }
  return {
    ...s,
    history,
    pos: next,
    collected,
    pc,
    lastStep: step,
    bump: null,
    status: pc >= s.steps.length ? 'ended-incomplete' : 'running',
  };
}

/** Undo one executed step (also leaves a bump state). */
export function rewind(s: RunState): RunState {
  if (!canRewind(s)) return s;
  const h = s.history[s.history.length - 1];
  return {
    ...s,
    pos: [...h.pos] as [number, number],
    dir: h.dir,
    collected: [...h.collected],
    pc: h.pc,
    status: h.pc === 0 ? 'ready' : 'paused',
    bump: null,
    history: s.history.slice(0, -1),
    lastStep: null,
  };
}

export function allCollected(s: RunState, level: Level): boolean {
  return s.collected.length === level.collectibles.length;
}

/** Live status line — the text alternative of the whole scene. */
export function runStatusText(s: RunState, level: Level): string {
  const at = `Robot at column ${s.pos[0] + 1}, row ${s.pos[1] + 1}, facing ${dirLabel(s.dir)}.`;
  const sparks = level.collectibles.length
    ? ` ${s.collected.length} of ${level.collectibles.length} sparks collected.`
    : '';
  const stepInfo = s.lastStep
    ? ` Executing ${opLabel(s.lastStep.op)}${s.lastStep.repeat ? `, round ${s.lastStep.repeat.round} of ${s.lastStep.repeat.rounds}` : ''} — step ${s.pc} of ${s.steps.length}.`
    : '';
  switch (s.status) {
    case 'ready':
      return `${at}${sparks} Program loaded — press Step or Run.`;
    case 'running':
    case 'paused':
      return `${at}${sparks}${stepInfo}`;
    case 'bumped':
      return `${at}${sparks} Bump! The robot stopped at ${s.bump?.kind === 'wall' ? 'the wall' : 'an exhibit'}. Rewind a step or edit the program.`;
    case 'docked-incomplete':
      return `${at}${sparks} Docked, but some sparks are still dark. Rewind and route past them first.`;
    case 'ended-incomplete':
      return `${at}${sparks} The program ended before the dock. Add or change tiles.`;
    case 'complete':
      return `${at}${sparks} Mission complete — the robot is docked and every exhibit is lit.`;
  }
}
