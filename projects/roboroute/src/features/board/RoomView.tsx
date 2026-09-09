// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// The museum room: an SVG floor plan (blueprint walls, faint graph grid,
// drafting labels) with the paper robot animated by GSAP between cells.
// Motion budget: step 380ms, turn 260ms, bump recoil 150ms — all collapsed
// to instant sets under prefers-reduced-motion (via lib/gsap tween()).

import { useEffect, useRef } from 'react';
import type { Level } from '../../lib/types';
import { collectibleId, dirAngle, type RunState } from './engine';
import { DockSprite, ExhibitSprite, RobotSprite, SparkSprite } from '../../components/art';
import { gsap, prefersReducedMotion } from '../../lib/gsap';

const M = 34; // margin for drafting labels (column letters / row numbers)

interface Props {
  level: Level;
  run: RunState | null;
}

export function RoomView({ level, run }: Props) {
  const [cols, rows] = level.grid;
  const robotG = useRef<SVGGElement | null>(null);
  const robotSpin = useRef<SVGGElement | null>(null);
  const angleRef = useRef(dirAngle(level.direction));
  const posRef = useRef<[number, number]>([...level.start] as [number, number]);

  const pos = run ? run.pos : level.start;
  const dir = run ? run.dir : level.direction;
  const bumped = run?.status === 'bumped';

  // Animate to the new pose whenever it changes (spatial continuity).
  useEffect(() => {
    const target = dirAngle(dir);
    // shortest-path cumulative angle so 270° -> 0° never spins the long way
    const delta = ((target - (angleRef.current % 360) + 540) % 360) - 180;
    const nextAngle = angleRef.current + delta;

    const g = robotG.current;
    const spin = robotSpin.current;
    if (!g || !spin) return;

    const cx = M + pos[0] * 100 + 50;
    const cy = M + pos[1] * 100 + 50;
    if (prefersReducedMotion()) {
      gsap.set(g, { x: cx, y: cy });
      gsap.set(spin, { rotation: nextAngle });
      angleRef.current = nextAngle;
      posRef.current = [...pos] as [number, number];
      return;
    }
    const moved = posRef.current[0] !== pos[0] || posRef.current[1] !== pos[1];
    const turned = angleRef.current !== nextAngle;
    angleRef.current = nextAngle;
    posRef.current = [...pos] as [number, number];
    if (moved) gsap.to(g, { x: cx, y: cy, duration: 0.38, ease: 'power2.inOut' });
    else gsap.set(g, { x: cx, y: cy });
    if (turned) gsap.to(spin, { rotation: nextAngle, duration: 0.26, ease: 'power2.out' });
  }, [pos, dir]);

  // Bump recoil — a small pull-back toward the previous cell, then settle.
  useEffect(() => {
    if (!bumped || !robotG.current || prefersReducedMotion()) return;
    const cx = M + pos[0] * 100 + 50;
    const cy = M + pos[1] * 100 + 50;
    const dx = M + (run?.bump?.cell[0] ?? 0) * 100 + 50 - cx;
    const dy = M + (run?.bump?.cell[1] ?? 0) * 100 + 50 - cy;
    const len = Math.hypot(dx, dy) || 1;
    gsap.fromTo(
      robotG.current,
      { x: cx + (dx / len) * 10, y: cy + (dy / len) * 10 },
      { x: cx, y: cy, duration: 0.15, ease: 'power1.out' },
    );
  }, [bumped, pos, run?.bump?.cell]);

  // Reset the pose instantly when the mission changes.
  useEffect(() => {
    angleRef.current = dirAngle(level.direction);
    posRef.current = [...level.start] as [number, number];
    const cx = M + level.start[0] * 100 + 50;
    const cy = M + level.start[1] * 100 + 50;
    if (robotG.current) gsap.set(robotG.current, { x: cx, y: cy });
    if (robotSpin.current) gsap.set(robotSpin.current, { rotation: dirAngle(level.direction) });
  }, [level.id, level.start, level.direction]);

  const collected = new Set(run?.collected ?? []);
  const sparkCount = level.collectibles.length;
  const roomLabel = `Museum room ${cols} columns by ${rows} rows. Robot at column ${pos[0] + 1}, row ${pos[1] + 1}, facing ${dir}. Charging dock at column ${level.goal[0] + 1}, row ${level.goal[1] + 1}. ${sparkCount} ${sparkCount === 1 ? 'spark' : 'sparks'}, ${level.obstacles.length} exhibits.`;

  return (
    <svg
      className="rr-room"
      viewBox={`0 0 ${cols * 100 + M * 2} ${rows * 100 + M * 2}`}
      role="img"
      aria-label={roomLabel}
    >
      {/* drafting labels: columns A.. / rows 1.. */}
      {Array.from({ length: cols }, (_, c) => (
        <text key={`c${c}`} x={M + c * 100 + 50} y={20} textAnchor="middle" className="rr-cell-tag">
          {String.fromCharCode(65 + c)}
        </text>
      ))}
      {Array.from({ length: rows }, (_, r) => (
        <text key={`r${r}`} x={16} y={M + r * 100 + 56} textAnchor="middle" className="rr-cell-tag">
          {r + 1}
        </text>
      ))}

      {/* floor */}
      <rect x={M} y={M} width={cols * 100} height={rows * 100} fill="var(--paper-raised)" />
      {Array.from({ length: cols - 1 }, (_, c) => (
        <line key={`v${c}`} x1={M + (c + 1) * 100} y1={M} x2={M + (c + 1) * 100} y2={M + rows * 100} className="rr-plan-line" />
      ))}
      {Array.from({ length: rows - 1 }, (_, r) => (
        <line key={`h${r}`} x1={M} y1={M + (r + 1) * 100} x2={M + cols * 100} y2={M + (r + 1) * 100} className="rr-plan-line" />
      ))}

      {/* double-line drafting wall */}
      <rect x={M} y={M} width={cols * 100} height={rows * 100} fill="none" stroke="var(--blueprint)" strokeWidth={5} />
      <rect x={M - 6} y={M - 6} width={cols * 100 + 12} height={rows * 100 + 12} fill="none" stroke="var(--blueprint)" strokeWidth={1.5} />

      {/* start cell marker */}
      <rect
        x={M + level.start[0] * 100 + 8}
        y={M + level.start[1] * 100 + 8}
        width={84}
        height={84}
        fill="none"
        stroke="var(--blueprint)"
        strokeWidth={1.6}
        strokeDasharray="7 6"
        className="rr-start-mark"
      />

      {/* bump marker (the finding, not a failure) */}
      {bumped && run?.bump && run.bump.kind === 'obstacle' && (
        <rect
          x={M + run.bump.cell[0] * 100 + 4}
          y={M + run.bump.cell[1] * 100 + 4}
          width={92}
          height={92}
          fill="var(--orange-wash)"
          stroke="var(--orange)"
          strokeWidth={2.4}
          strokeDasharray="8 6"
          className="rr-bump-cell"
        />
      )}
      {/* wall bump: mark the WALL EDGE the robot hit — the impact cell is
          outside the grid, so a cell rect there would clip past the viewBox
          and collide with the drafting labels (found at 1440×900). */}
      {bumped && run?.bump && run.bump.kind === 'wall' && (() => {
        const [pc, pr] = run.pos;
        const [bc, br] = run.bump.cell;
        const x = M + pc * 100;
        const y = M + pr * 100;
        const attrs =
          br === pr - 1
            ? { x1: x, y1: y, x2: x + 100, y2: y } // north wall
            : br === pr + 1
              ? { x1: x, y1: y + 100, x2: x + 100, y2: y + 100 } // south
              : bc === pc - 1
                ? { x1: x, y1: y, x2: x, y2: y + 100 } // west
                : { x1: x + 100, y1: y, x2: x + 100, y2: y + 100 }; // east
        return (
          <line
            {...attrs}
            stroke="var(--orange)"
            strokeWidth={7}
            strokeDasharray="11 7"
            strokeLinecap="butt"
            className="rr-bump-cell"
          />
        );
      })()}

      {/* exhibits */}
      {level.obstacles.map((o) => (
        <g key={`o${o.cell[0]}-${o.cell[1]}`} transform={`translate(${M + o.cell[0] * 100} ${M + o.cell[1] * 100})`}>
          <ExhibitSprite kind={o.kind} />
        </g>
      ))}

      {/* sparks */}
      {level.collectibles.map((c) => (
        <g key={`s${c.cell[0]}-${c.cell[1]}`} transform={`translate(${M + c.cell[0] * 100} ${M + c.cell[1] * 100})`}>
          <SparkSprite collected={collected.has(collectibleId(level, c.cell))} />
        </g>
      ))}

      {/* dock */}
      <g transform={`translate(${M + level.goal[0] * 100} ${M + level.goal[1] * 100})`}>
        <DockSprite collected={run ? run.collected.length : 0} total={level.collectibles.length} />
      </g>

      {/* the paper robot (bump recoil is animated by GSAP above) */}
      <g ref={robotG} className="rr-robot-wrap">
        <g ref={robotSpin}>
          <RobotSprite />
        </g>
      </g>
    </svg>
  );
}
