// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Atom diagram — pure SVG, deterministic geometry (no physics simulation:
// the spec forbids animation pretending to be real physics). Nucleus discs
// are packed with a sunflower layout; electrons sit evenly on their ring.
// Geometry helpers are exported for hit-testing (ForgeScreen) and tests.

import { ParticleDisc } from '../../components/ParticleDisc';
import type { BuildState } from './engine';
import { capacityOf } from './engine';

export const VIEW = 640;
export const CENTER = VIEW / 2;
export const RING_RADII = [92, 158, 224, 290];
const NUCLEUS_DISC = 15;
const ELECTRON_DISC = 11;
const SHELL_PHASE = [-Math.PI / 2, -Math.PI / 2 + 0.55, -Math.PI / 2 + 1.1, -Math.PI / 2 + 1.65];

/** Sunflower packing for the nucleus cluster (stable for its count).
 *  Spread factor 11 keeps the heaviest build (20p + 24n = 44 discs) inside
 *  the shell-1 ring (≈93 of 92 view units) — no overlap with electron seats. */
export function nucleusPositions(count: number): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = i * 2.399963;
    const radius = i === 0 ? 0 : 11 * Math.sqrt(i);
    out.push({ x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) });
  }
  return out;
}

/** Even electron positions on a shell ring. */
export function shellPositions(shellIndex: number, count: number): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (let j = 0; j < count; j++) {
    const angle = (j / count) * Math.PI * 2 + SHELL_PHASE[shellIndex % SHELL_PHASE.length];
    out.push({
      x: CENTER + RING_RADII[shellIndex] * Math.cos(angle),
      y: CENTER + RING_RADII[shellIndex] * Math.sin(angle),
    });
  }
  return out;
}

interface AtomCanvasProps {
  build: BuildState;
  visibleShells: number;
  /** Zone highlighted while dragging: 'nucleus', a shell index, or null. */
  dragOver: 'nucleus' | number | null;
  /** Text alternative of the build for screen readers. */
  summary: string;
  onRemoveParticle: (kind: 'proton' | 'neutron' | 'electron', shellIndex?: number) => void;
  /** false = display-only (reveal overlay): no remove affordances. */
  interactive?: boolean;
}

export function AtomCanvas({ build, visibleShells, dragOver, summary, onRemoveParticle, interactive = true }: AtomCanvasProps) {
  const kinds = withOrdinals(build.protons, build.neutrons);
  const positions = nucleusPositions(kinds.length);

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role="img"
      aria-label={summary}
      data-testid="atom-canvas"
    >
      {/* Shell rings — drawn outermost first so labels sit on top */}
      {Array.from({ length: visibleShells }, (_, i) => visibleShells - 1 - i).map((i) => {
        const count = build.shells[i] ?? 0;
        const cap = capacityOf(i);
        const full = count >= cap;
        const isOver = dragOver === i;
        const r = RING_RADII[i];
        // Label anchor at 10:30 (135°): text grows rightward INTO the viewBox
        // (the old 45° anchor pushed SHELL 3/4 labels past x=640 — clipped),
        // and no electron ever sits in the left hemisphere (SHELL_PHASE spans
        // the top/right half), so labels never collide with placed electrons.
        const lx = CENTER + r * Math.cos(-Math.PI * 0.75);
        const ly = CENTER + r * Math.sin(-Math.PI * 0.75);
        return (
          <g key={`ring-${i}`}>
            {/* Drop-zone halo: the ring "swells" (+16px) while a drag hovers it. */}
            {isOver && (
              <circle cx={CENTER} cy={CENTER} r={r + 16} fill="none" stroke="var(--orange)" strokeWidth={2} strokeOpacity={0.4} />
            )}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={r}
              fill="none"
              stroke={isOver ? 'var(--orange)' : 'var(--ink)'}
              strokeWidth={isOver ? 3 : 1.5}
              strokeOpacity={isOver ? 1 : 0.55}
              strokeDasharray={count === 0 ? '4 6' : undefined}
              className={full ? 'af-ring-pulse' : undefined}
            />
            {/* 12 arc ticks — instrument feel, static (no simulated physics). */}
            {Array.from({ length: 12 }, (_, t) => {
              const a = (t / 12) * Math.PI * 2;
              const inner = r - 5;
              const outer = r + 5;
              return (
                <line
                  key={`tick-${i}-${t}`}
                  x1={CENTER + inner * Math.cos(a)}
                  y1={CENTER + inner * Math.sin(a)}
                  x2={CENTER + outer * Math.cos(a)}
                  y2={CENTER + outer * Math.sin(a)}
                  stroke="var(--ink)"
                  strokeOpacity={isOver ? 0.8 : 0.3}
                  strokeWidth={1.2}
                />
              );
            })}
            <text
              x={lx}
              y={ly}
              textAnchor="start"
              dy="-10"
              className="af-canvas-label"
            >
              SHELL {i + 1} · {count}/{cap}
              {full ? ' · FULL' : ''}
            </text>
            {shellPositions(i, count).map((pos, j) => (
              <g
                key={`e-${i}-${j}`}
                className="af-placed af-pop"
                style={interactive ? { cursor: 'pointer' } : undefined}
                data-remove="electron"
                onClick={interactive ? () => onRemoveParticle('electron', i) : undefined}
              >
                {interactive ? <title>{`Remove electron from shell ${i + 1}`}</title> : null}
                <circle cx={pos.x} cy={pos.y} r={16} fill="transparent" />
                <g transform={`translate(${pos.x} ${pos.y})`}>
                  <ParticleDisc kind="electron" size={ELECTRON_DISC * 2} />
                </g>
              </g>
            ))}
          </g>
        );
      })}

      {/* Nucleus zone */}
      <g>
        {build.protons === 0 && build.neutrons === 0 && (
          <>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={58}
              fill="var(--paper-dim)"
              stroke="var(--ink)"
              strokeOpacity={0.45}
              strokeWidth={2}
              strokeDasharray="6 8"
            />
            <text x={CENTER} y={CENTER + 8} textAnchor="middle" className="af-canvas-label" fontSize={22}>
              NUCLEUS
            </text>
          </>
        )}
        {dragOver === 'nucleus' && (
          <>
            <circle cx={CENTER} cy={CENTER} r={78} fill="var(--orange-wash)" stroke="var(--orange)" strokeWidth={3} />
            <circle cx={CENTER} cy={CENTER} r={94} fill="none" stroke="var(--orange)" strokeWidth={2} strokeOpacity={0.4} />
          </>
        )}
        {kinds.map((entry, i) => (
          <g
            key={`${entry.kind}${entry.ordinal}`}
            className="af-pop af-nucleon"
            style={interactive ? { cursor: 'pointer' } : undefined}
            data-remove={entry.kind}
            onClick={interactive ? () => onRemoveParticle(entry.kind) : undefined}
          >
            {interactive ? <title>Remove {entry.kind}</title> : null}
            <circle cx={positions[i].x} cy={positions[i].y} r={17} fill="transparent" />
            <g transform={`translate(${positions[i].x} ${positions[i].y})`}>
              <ParticleDisc kind={entry.kind} size={NUCLEUS_DISC * 2} />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Interleaved nucleus particles with a stable ordinal per kind (keyed pops). */
function withOrdinals(protons: number, neutrons: number): Array<{ kind: 'proton' | 'neutron'; ordinal: number }> {
  const out: Array<{ kind: 'proton' | 'neutron'; ordinal: number }> = [];
  let p = 0;
  let n = 0;
  while (p < protons || n < neutrons) {
    if (p < protons) out.push({ kind: 'proton', ordinal: ++p });
    if (n < neutrons) out.push({ kind: 'neutron', ordinal: ++n });
  }
  return out;
}

/** Screen coordinate → forge zone, for drag hit-testing (forgiving bands). */
export function zoneFromDistance(distanceInView: number, visibleShells: number): 'nucleus' | number | null {
  const innerEdge = RING_RADII[0] - 34;
  if (distanceInView < innerEdge) return 'nucleus';
  let best: { shell: number; delta: number } | null = null;
  for (let i = 0; i < visibleShells; i++) {
    const delta = Math.abs(distanceInView - RING_RADII[i]);
    if (delta < 34 && (!best || delta < best.delta)) best = { shell: i, delta };
  }
  return best ? best.shell : null;
}

/** Anchor point (view coords) a stepper-add flies to. */
export function zoneAnchor(zone: 'nucleus' | number): { x: number; y: number } {
  if (zone === 'nucleus') return { x: CENTER, y: CENTER };
  const r = RING_RADII[zone];
  return { x: CENTER + r * Math.cos(SHELL_PHASE[zone % SHELL_PHASE.length]), y: CENTER + r * Math.sin(SHELL_PHASE[zone % SHELL_PHASE.length]) };
}
