// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content contracts for RoboRoute. All gameplay content arrives as local JSON
// (content state); these types are the dev-time contract behind data.ts.

/** Cardinal direction. N = toward row 0 (up in the room view). */
export type Dir = 'N' | 'E' | 'S' | 'W';

/** Simple commands — the only ops that actually execute. */
export type SimpleOp = 'F' | 'L' | 'R';

/** Everything a level may allow, and everything a tile can be. */
export type Op = SimpleOp | 'REPEAT';

export type ObstacleKind = 'bench' | 'plinth' | 'statue' | 'planter';

export interface Obstacle {
  cell: [number, number];
  kind: ObstacleKind;
}

export interface Collectible {
  cell: [number, number];
  kind: 'spark';
}

/** One mission = one museum room. Mirrors the spec JSON contract. */
export interface Level {
  id: string;
  wing: string;
  title: string;
  brief: string;
  hint: string;
  grid: [number, number];
  start: [number, number];
  direction: Dir;
  goal: [number, number];
  obstacles: Obstacle[];
  collectibles: Collectible[];
  allowedCommands: Op[];
  maxCommands: number;
  /** concepts.json id shown beside this mission. */
  concept: string;
  /** Reference program (dev-time: engine-sim proves every mission solvable). */
  solution: SolutionNode[];
}

export interface SolutionNode {
  op: Op;
  times?: number;
  body?: { op: SimpleOp }[];
}

export interface Wing {
  id: string;
  title: string;
  subtitle: string;
}

export interface LevelsFile {
  wings: Wing[];
  levels: Level[];
}

export interface Concept {
  id: string;
  title: string;
  tagline: string;
  /** Short plain-English lines, rendered as separate paragraphs. */
  lines: string[];
  /** 'sequence' | 'loop' — picks the mini diagram in the notebook. */
  diagram: 'sequence' | 'loop';
}

export interface ConceptsFile {
  concepts: Concept[];
}
