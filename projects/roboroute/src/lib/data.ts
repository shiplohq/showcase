// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state loader: fetches local JSON (static host), validates shape at
// dev-time with clear messages, degrades to a readable error instead of a
// white screen (spec: runtime error phải degrade thành message rõ).

import type {
  Concept,
  ConceptsFile,
  Dir,
  Level,
  LevelsFile,
  ObstacleKind,
  Op,
  SimpleOp,
  SolutionNode,
  Wing,
} from './types';

export class ContentError extends Error {}

const OPS: Op[] = ['F', 'L', 'R', 'REPEAT'];
const SIMPLE: SimpleOp[] = ['F', 'L', 'R'];
const DIRS: Dir[] = ['N', 'E', 'S', 'W'];
const OBSTACLES: ObstacleKind[] = ['bench', 'plinth', 'statue', 'planter'];

async function fetchJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ContentError(`Could not load content data (${url}).`);
  }
  if (!res.ok) throw new ContentError(`Content data returned ${res.status} (${url}).`);
  try {
    return await res.json();
  } catch {
    throw new ContentError(`Content data is not valid JSON (${url}).`);
  }
}

function cell(v: unknown, where: string): [number, number] {
  if (
    !Array.isArray(v) ||
    v.length !== 2 ||
    !v.every((n) => typeof n === 'number' && Number.isInteger(n))
  ) {
    throw new ContentError(`${where}: cell must be [col, row] integers.`);
  }
  return [v[0], v[1]];
}

function assertSolutionNode(v: unknown, where: string): SolutionNode {
  if (typeof v !== 'object' || v === null) throw new ContentError(`${where}: invalid solution node.`);
  const n = v as Record<string, unknown>;
  const op = String(n.op ?? '');
  if (!OPS.includes(op as Op)) throw new ContentError(`${where}: unknown op "${op}".`);
  if (op === 'REPEAT') {
    if (typeof n.times !== 'number' || !Number.isInteger(n.times) || n.times < 1) {
      throw new ContentError(`${where}: repeat needs an integer times >= 1.`);
    }
    if (!Array.isArray(n.body) || n.body.some((b) => !SIMPLE.includes(String((b as { op?: unknown })?.op ?? '') as SimpleOp))) {
      throw new ContentError(`${where}: repeat body must contain simple commands.`);
    }
    return { op: 'REPEAT', times: n.times, body: n.body.map((b) => ({ op: String((b as { op: unknown }).op) as SimpleOp })) };
  }
  return { op: op as SimpleOp };
}

function assertLevel(raw: unknown, index: number, wingIds: Set<string>): Level {
  const where = `level ${index}`;
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`${where}: not an object.`);
  const l = raw as Record<string, unknown>;

  const grid = cell(l.grid, `${where} grid`);
  if (grid[0] < 2 || grid[1] < 2 || grid[0] > 12 || grid[1] > 12) {
    throw new ContentError(`${where}: grid ${grid} out of supported range.`);
  }
  const id = String(l.id ?? '');
  if (!id) throw new ContentError(`${where}: missing id.`);
  const wing = String(l.wing ?? '');
  if (!wingIds.has(wing)) throw new ContentError(`${where}: unknown wing "${wing}".`);

  const start = cell(l.start, `${where} start`);
  const goal = cell(l.goal, `${where} goal`);
  const direction = String(l.direction ?? '');
  if (!DIRS.includes(direction as Dir)) throw new ContentError(`${where}: bad direction "${direction}".`);
  const inside = (c: [number, number]) => c[0] >= 0 && c[0] < grid[0] && c[1] >= 0 && c[1] < grid[1];
  if (!inside(start) || !inside(goal)) throw new ContentError(`${where}: start/goal outside the grid.`);

  const obstacles = Array.isArray(l.obstacles)
    ? l.obstacles.map((o, i) => {
        const kind = String((o as { kind?: unknown })?.kind ?? '');
        if (!OBSTACLES.includes(kind as ObstacleKind)) throw new ContentError(`${where} obstacle ${i}: kind "${kind}".`);
        return { cell: cell((o as { cell?: unknown }).cell, `${where} obstacle ${i}`), kind: kind as ObstacleKind };
      })
    : [];
  const collectibles = Array.isArray(l.collectibles)
    ? l.collectibles.map((c, i) => ({
        cell: cell((c as { cell?: unknown }).cell, `${where} collectible ${i}`),
        kind: 'spark' as const,
      }))
    : [];

  const blocked = new Set(obstacles.map((o) => `${o.cell[0]},${o.cell[1]}`));
  if (blocked.has(`${start[0]},${start[1]}`)) throw new ContentError(`${where}: start sits on an obstacle.`);
  if (blocked.has(`${goal[0]},${goal[1]}`)) throw new ContentError(`${where}: goal sits on an obstacle.`);
  for (const c of collectibles) {
    if (blocked.has(`${c.cell[0]},${c.cell[1]}`)) throw new ContentError(`${where}: a spark sits on an obstacle.`);
    if (c.cell[0] === goal[0] && c.cell[1] === goal[1]) throw new ContentError(`${where}: a spark sits on the dock.`);
  }
  if (!inside(goal)) throw new ContentError(`${where}: goal outside grid.`);

  const allowed = Array.isArray(l.allowedCommands)
    ? l.allowedCommands.map((a) => {
        const op = String(a);
        if (!OPS.includes(op as Op)) throw new ContentError(`${where}: unknown command "${op}".`);
        return op as Op;
      })
    : [];
  if (allowed.length === 0) throw new ContentError(`${where}: allowedCommands is empty.`);
  const maxCommands = Number(l.maxCommands ?? 0);
  if (!Number.isInteger(maxCommands) || maxCommands < 1 || maxCommands > 24) {
    throw new ContentError(`${where}: maxCommands must be 1..24.`);
  }
  const solution = Array.isArray(l.solution) ? l.solution.map((s, i) => assertSolutionNode(s, `${where} solution ${i}`)) : [];
  if (solution.length === 0) throw new ContentError(`${where}: missing reference solution (engine-sim depends on it).`);
  if (solution.length > maxCommands) throw new ContentError(`${where}: solution uses more slots than maxCommands.`);

  return {
    id,
    wing,
    title: String(l.title ?? id),
    brief: String(l.brief ?? ''),
    hint: String(l.hint ?? ''),
    grid,
    start,
    direction: direction as Dir,
    goal,
    obstacles,
    collectibles,
    allowedCommands: allowed as Op[],
    maxCommands,
    concept: String(l.concept ?? ''),
    solution,
  };
}

function assertWing(raw: unknown): Wing {
  if (typeof raw !== 'object' || raw === null) throw new ContentError('wing: not an object.');
  const w = raw as Record<string, unknown>;
  const id = String(w.id ?? '');
  if (!id) throw new ContentError('wing: missing id.');
  return { id, title: String(w.title ?? id), subtitle: String(w.subtitle ?? '') };
}

function assertConcept(raw: unknown): Concept {
  if (typeof raw !== 'object' || raw === null) throw new ContentError('concept: not an object.');
  const c = raw as Record<string, unknown>;
  const id = String(c.id ?? '');
  if (!id) throw new ContentError('concept: missing id.');
  const diagram = String(c.diagram ?? 'sequence');
  if (diagram !== 'sequence' && diagram !== 'loop') throw new ContentError(`concept ${id}: unknown diagram.`);
  const lines = Array.isArray(c.lines) ? c.lines.map(String) : [];
  if (lines.length === 0) throw new ContentError(`concept ${id}: no lines.`);
  return { id, title: String(c.title ?? id), tagline: String(c.tagline ?? ''), lines, diagram };
}

/** Build the asset URL relative to the deployed base (subpath-safe). */
function assetUrl(path: string): string {
  // BASE_URL is './' for this build — resolve it against the document first
  // (new URL needs an absolute base; relative asset paths must follow
  // wherever the artifact is hosted, including subpaths).
  const base = new URL(import.meta.env.BASE_URL ?? './', document.baseURI);
  return new URL(path, base).href;
}

export async function loadContent(): Promise<{ levels: LevelsFile; concepts: ConceptsFile }> {
  const [levelsRaw, conceptsRaw] = await Promise.all([
    fetchJson(assetUrl('data/levels.json')),
    fetchJson(assetUrl('data/concepts.json')),
  ]);

  const lv = (levelsRaw ?? {}) as Record<string, unknown>;
  const wings = Array.isArray(lv.wings) ? lv.wings.map(assertWing) : [];
  if (wings.length === 0) throw new ContentError('levels.json has no wings.');
  const wingIds = new Set(wings.map((w) => w.id));
  const levels = Array.isArray(lv.levels) ? lv.levels.map((l, i) => assertLevel(l, i, wingIds)) : [];
  if (levels.length === 0) throw new ContentError('levels.json has no levels.');
  const seen = new Set<string>();
  for (const level of levels) {
    if (seen.has(level.id)) throw new ContentError(`duplicate level id "${level.id}".`);
    seen.add(level.id);
  }

  const co = (conceptsRaw ?? {}) as Record<string, unknown>;
  const concepts = Array.isArray(co.concepts) ? co.concepts.map(assertConcept) : [];
  if (concepts.length === 0) throw new ContentError('concepts.json has no concepts.');

  return { levels: { wings, levels }, concepts: { concepts } };
}
