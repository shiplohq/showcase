// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Planet primitive — flat two-tone halftone disc built from shared SVG parts
// (DESIGN_DECISIONS §9): base fill, two arc bands, tiny crater dots. One
// component parameterized by the galaxy's locked color pair; no raster art.

export interface PlanetProps {
  /** Base fill (galaxy planetStyle.base). */
  base: string;
  /** Band fill (galaxy.planetStyle.band). */
  band: string;
  /** Disc radius in current SVG units. */
  r: number;
  /** Stable per-instance detail seed (use the satellite's index). */
  seed?: number;
  /** Unique document id prefix — clipPath ids must not collide across SVGs. */
  uid: string;
}

export function Planet({ base, band, r, seed = 0, uid }: PlanetProps): JSX.Element {
  // Deterministic detail placement from the seed — stable across renders.
  const band1Y = -0.18 + ((seed * 7) % 3) * 0.06;
  const band2Y = 0.22 + ((seed * 5) % 3) * 0.05;
  const dotA = { x: -0.34 + ((seed * 3) % 3) * 0.08, y: -0.42 + ((seed * 11) % 3) * 0.07 };
  const dotB = { x: 0.3 + ((seed * 13) % 3) * 0.06, y: 0.38 - ((seed * 17) % 3) * 0.08 };
  return (
    <g>
      <circle r={r} fill={base} />
      {/* Halftone arc bands — clipped to the disc. */}
      <clipPath id={`planet-clip-${uid}`}>
        <circle r={r} />
      </clipPath>
      <g clipPath={`url(#planet-clip-${uid})`}>
        <rect x={-r} y={band1Y * r} width={r * 2} height={r * 0.16} fill={band} opacity={0.85} />
        <rect x={-r} y={band2Y * r} width={r * 2} height={r * 0.12} fill={band} opacity={0.6} />
        <circle cx={dotA.x * r} cy={dotA.y * r} r={r * 0.09} fill={band} />
        <circle cx={dotB.x * r} cy={dotB.y * r} r={r * 0.07} fill={band} />
      </g>
      {/* Print misregistration edge — 1px offset duplicate, like off-register ink. */}
      <circle r={r} cx={r * 0.03} fill="none" stroke={band} strokeWidth={r * 0.05} opacity={0.35} />
    </g>
  );
}
