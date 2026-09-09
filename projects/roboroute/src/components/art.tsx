// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Original SVG illustration language for RoboRoute (asset class B — code
// native, no third-party rights). Design tokens: see styles/tokens.css.
// Everything is flat paper: fills + hairlines, no gradients, no glow.

import type { ObstacleKind, SimpleOp } from '../lib/types';

/* ------------------------------------------------------------------ */
/* The paper robot — drawn facing EAST (0°), rotated by the caller.    */
/* Centered on (0,0), ~76 units tall, for a 100-unit cell.             */
/* ------------------------------------------------------------------ */

export function RobotSprite() {
  return (
    <g className="rr-robot">
      {/* tread base */}
      <rect x={-30} y={22} width={60} height={14} rx={7} fill="var(--ink)" />
      <circle cx={-14} cy={29} r={4.5} fill="var(--paper)" />
      <circle cx={2} cy={29} r={4.5} fill="var(--paper)" />
      <circle cx={18} cy={29} r={4.5} fill="var(--paper)" />
      {/* body — blueprint panel with crease line */}
      <rect x={-26} y={-6} width={44} height={30} rx={4} fill="var(--blueprint)" />
      <path d="M-26 9 H 18" stroke="var(--blueprint-deep)" strokeWidth={1.4} />
      <path d="M-4 -6 V 9" stroke="var(--blueprint-deep)" strokeWidth={1.4} />
      {/* chest badge */}
      <rect x={-20} y={14} width={9} height={9} fill="var(--orange)" stroke="var(--ink)" strokeWidth={1.2} />
      <rect x={-6} y={14} width={9} height={9} fill="var(--paper-raised)" stroke="var(--ink)" strokeWidth={1.2} />
      {/* head — bone face plate with fold line */}
      <rect x={-24} y={-34} width={42} height={24} rx={5} fill="var(--paper-raised)" stroke="var(--ink)" strokeWidth={1.6} />
      <path d="M-24 -22 H 18" stroke="var(--hairline)" strokeWidth={1.2} />
      {/* eyes */}
      <circle cx={-8} cy={-26} r={3.4} fill="var(--ink)" />
      <circle cx={6} cy={-26} r={3.4} fill="var(--ink)" />
      {/* nose marker — direction cue (never color-only) */}
      <path d="M18 -30 L 30 -22 L 18 -14 Z" fill="var(--orange)" stroke="var(--ink)" strokeWidth={1.6} strokeLinejoin="round" />
      {/* antenna */}
      <path d="M-16 -34 V -44" stroke="var(--ink)" strokeWidth={2} />
      <circle cx={-16} cy={-47} r={4} fill="var(--orange)" stroke="var(--ink)" strokeWidth={1.4} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Museum exhibits (obstacles) — flat paper objects on a 100-unit cell */
/* ------------------------------------------------------------------ */

export function ExhibitSprite({ kind }: { kind: ObstacleKind }) {
  switch (kind) {
    case 'bench':
      return (
        <g>
          <rect x={14} y={42} width={72} height={12} rx={3} fill="var(--blueprint)" stroke="var(--ink)" strokeWidth={1.6} />
          <path d="M22 54 V 72 M78 54 V 72" stroke="var(--ink)" strokeWidth={3.5} strokeLinecap="round" />
        </g>
      );
    case 'plinth':
      return (
        <g>
          <rect x={26} y={26} width={48} height={40} fill="var(--paper-raised)" stroke="var(--ink)" strokeWidth={1.6} />
          <path d="M26 50 H 74" stroke="var(--hairline)" strokeWidth={1.4} />
          {/* abstract sculpture on top */}
          <circle cx={50} cy={18} r={9} fill="var(--blueprint)" stroke="var(--ink)" strokeWidth={1.6} />
          <rect x={38} y={20} width={24} height={8} fill="var(--blueprint)" stroke="var(--ink)" strokeWidth={1.6} />
        </g>
      );
    case 'statue':
      return (
        <g>
          <rect x={28} y={62} width={44} height={12} fill="var(--paper-raised)" stroke="var(--ink)" strokeWidth={1.6} />
          {/* paper figure */}
          <path d="M38 62 V 44 Q 38 30 50 30 Q 62 30 62 44 V 62 Z" fill="var(--blueprint)" stroke="var(--ink)" strokeWidth={1.6} />
          <circle cx={50} cy={22} r={8} fill="var(--paper-raised)" stroke="var(--ink)" strokeWidth={1.6} />
          <path d="M50 30 V 62" stroke="var(--blueprint-deep)" strokeWidth={1.4} />
        </g>
      );
    case 'planter':
      return (
        <g>
          <path d="M32 48 H 68 L 63 74 H 37 Z" fill="var(--paper-raised)" stroke="var(--ink)" strokeWidth={1.6} strokeLinejoin="round" />
          <path d="M50 48 V 26 M50 34 Q 40 32 38 22 M50 34 Q 60 32 62 22" stroke="var(--blueprint)" strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Spark (collectible) + dock (goal)                                   */
/* ------------------------------------------------------------------ */

export function SparkSprite({ collected }: { collected: boolean }) {
  if (collected) {
    return <g />; // picked up: nothing in the room, tally holds the count
  }
  return (
    <g className="rr-spark">
      <path
        d="M52 18 L 42 44 L 52 44 L 44 74 L 64 40 L 53 40 L 62 18 Z"
        fill="var(--orange)"
        stroke="var(--ink)"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <circle cx={50} cy={88} r={2.5} fill="var(--ink-soft)" />
    </g>
  );
}

export function DockSprite({ collected, total }: { collected: number; total: number }) {
  const r = 34;
  const frac = total === 0 ? 1 : Math.min(1, collected / total);
  const circumference = 2 * Math.PI * r;
  return (
    <g>
      <rect x={16} y={16} width={68} height={68} rx={10} fill="var(--paper-raised)" stroke="var(--blueprint)" strokeWidth={2.4} />
      {/* charge ring: fills as sparks are collected (shape + number cue) */}
      <circle cx={50} cy={50} r={r} fill="none" stroke="var(--paper-well)" strokeWidth={6} />
      <circle
        cx={50}
        cy={50}
        r={r}
        fill="none"
        stroke="var(--orange)"
        strokeWidth={6}
        strokeDasharray={`${circumference * frac} ${circumference}`}
        strokeLinecap="butt"
        transform="rotate(-90 50 50)"
      />
      {/* plug mark */}
      <path d="M40 42 h 20 v 6 h -4 v 8 a 6 6 0 0 1 -12 0 v -8 h -4 Z" fill="var(--blueprint)" />
      {total > 0 && (
        <text x={50} y={82} textAnchor="middle" className="rr-cell-num">
          {collected}/{total}
        </text>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Command tile icons (stencil arrows — drawn on 24×24 grid)           */
/* ------------------------------------------------------------------ */

export function TileIcon({ op, size = 24 }: { op: SimpleOp | 'REPEAT'; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="rr-tile-icon"
    >
      {op === 'F' && (
        <g stroke="currentColor" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12 H 19" />
          <path d="M13 6 L 19 12 L 13 18" />
        </g>
      )}
      {op === 'L' && (
        <g stroke="currentColor" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 A 8 8 0 0 0 5 10" />
          <path d="M4 4 L 5 11 L 12 9" />
        </g>
      )}
      {op === 'R' && (
        <g stroke="currentColor" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 6 A 8 8 0 0 1 19 10" />
          <path d="M20 4 L 19 11 L 12 9" />
        </g>
      )}
      {op === 'REPEAT' && (
        <g stroke="currentColor" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 12 A 6 6 0 0 1 18 12" />
          <path d="M18 12 A 6 6 0 0 1 6 12" />
          <path d="M15 8 L 18 12 L 22 9" transform="translate(-2 1)" />
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Concept notebook mini diagrams                                      */
/* ------------------------------------------------------------------ */

export function ConceptDiagram({ kind }: { kind: 'sequence' | 'loop' }) {
  if (kind === 'sequence') {
    return (
      <svg viewBox="0 0 220 64" className="rr-concept-diagram" role="img" aria-label="Three command tiles in a row, executed left to right">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${16 + i * 68} 16)`}>
            <rect width={44} height={32} rx={4} fill="var(--paper-raised)" stroke="var(--blueprint)" strokeWidth={1.8} />
            <g transform="translate(10 4) scale(1)" color="var(--blueprint)">
              <TileIcon op="F" size={24} />
            </g>
            <text x={34} y={58} textAnchor="middle" className="rr-cell-num">
              {i + 1}
            </text>
          </g>
        ))}
        <path d="M212 32 H 218" stroke="var(--ink-soft)" strokeWidth={2} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 220 64" className="rr-concept-diagram" role="img" aria-label="One repeat tile expanding into three rounds of its inner tiles">
      <g transform="translate(8 16)">
        <rect width={52} height={32} rx={4} fill="var(--blueprint-wash)" stroke="var(--blueprint)" strokeWidth={1.8} />
        <g transform="translate(14 4)" color="var(--blueprint)">
          <TileIcon op="REPEAT" size={24} />
        </g>
        <text x={44} y={58} textAnchor="middle" className="rr-cell-num">
          x3
        </text>
      </g>
      <path d="M64 32 H 84" stroke="var(--ink-soft)" strokeWidth={2} strokeDasharray="3 3" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${90 + i * 42} 16)`}>
          <rect width={32} height={32} rx={4} fill="var(--paper-raised)" stroke="var(--ink-soft)" strokeWidth={1.6} />
          <g transform="translate(4 4)" color="var(--ink)">
            <TileIcon op="F" size={24} />
          </g>
        </g>
      ))}
    </svg>
  );
}
