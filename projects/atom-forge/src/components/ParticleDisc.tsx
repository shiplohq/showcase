// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Particle primitive — one SVG disc per particle kind, used everywhere
// (tray, canvas, reveal breakdown). Identity is color + SIGN GLYPH + label,
// never color alone (design §4: color-blind safe).

import type { ParticleKind } from '../features/forge/engine';

export const PARTICLE_COLORS: Record<ParticleKind, string> = {
  proton: 'var(--orange)',
  neutron: 'var(--neutron)',
  electron: 'var(--ultramarine)',
};

export const PARTICLE_SIGN: Record<ParticleKind, string> = {
  proton: '+',
  neutron: '',
  electron: '−',
};

interface ParticleDiscProps {
  kind: ParticleKind;
  /** Diameter in px (the disc is square, centered on 0,0). */
  size?: number;
  /** Render at the origin — wrap in a positioned <g>/<div>. */
  className?: string;
}

export function ParticleDisc({ kind, size = 24, className }: ParticleDiscProps) {
  const r = size / 2;
  const fill = PARTICLE_COLORS[kind];
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`${-r} ${-r} ${size} ${size}`}
      aria-hidden="true"
      focusable="false"
    >
      <circle r={r} fill={fill} />
      {kind === 'neutron' ? (
        <circle r={r * 0.22} fill="var(--paper)" opacity={0.85} />
      ) : (
        <path
          d={signPath(kind, r)}
          fill="none"
          stroke="#fff"
          strokeWidth={Math.max(1.6, size * 0.085)}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function signPath(kind: 'proton' | 'electron', r: number): string {
  const a = r * 0.5;
  if (kind === 'electron') {
    // minus
    return `M ${-a} 0 L ${a} 0`;
  }
  // plus
  return `M ${-a} 0 L ${a} 0 M 0 ${-a} L 0 ${a}`;
}
