// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// The specimen sphere: a data-driven original SVG — radial gradient built
// from the planet's colorStops (light from the Sun side, i.e. left), thin
// latitude bands for gas giants, an ellipse ring for Saturn, and normalized
// day/year gauges in time view. Rendered in a 200x200 unit viewBox so the
// whole specimen scales with one width tween (used by the view morph).
//
// Accessibility: decorative by default — the numeric readouts next to every
// sphere carry the information (labels supplied by parents).

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { PlanetData } from '../lib/types';
import { gsap, prefersReducedMotion } from '../lib/gsap';

export interface SphereGauges {
  /** seconds per visible revolution for the day marker (engine: log-compressed) */
  spinSeconds: number;
  /** year arc as a fraction of the full outer circle */
  yearFrac: number;
  retrograde: boolean;
}

interface SphereProps {
  planet: PlanetData;
  /** pixel size of the sphere (diameter). Rings/gauges add visual margin. */
  size: number;
  gauges?: SphereGauges;
  idPrefix: string;
  className?: string;
  style?: CSSProperties;
}

export function Sphere({ planet, size, gauges, idPrefix, className, style }: SphereProps) {
  const gradId = `${idPrefix}-grad`;
  const clipId = `${idPrefix}-clip`;
  const markerRef = useRef<SVGGElement | null>(null);
  const hasRings = planet.hasRings;
  // station gauges render small (26–90 px boxes): keep strokes/marker legible
  // in screen pixels instead of unit space (non-scaling stroke + px-sized dot)
  const pxPerUnit = size / 200;
  const markerR = Math.max(6, Math.round(4 / pxPerUnit));

  useEffect(() => {
    if (!gauges || !markerRef.current) return;
    const el = markerRef.current;
    if (prefersReducedMotion()) return; // static gauge positions only
    const tween = gsap.to(el, {
      rotation: gauges.retrograde ? -360 : 360,
      duration: gauges.spinSeconds,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%',
    });
    return () => {
      tween.kill();
    };
  }, [gauges]);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      aria-hidden="true"
      focusable="false"
      style={{ width: size, height: size, overflow: 'visible', ...style }}
    >
      <defs>
        <radialGradient id={gradId} cx="0.34" cy="0.3" r="0.95">
          <stop offset="0%" stopColor={planet.colorStops[0]} />
          <stop offset="55%" stopColor={planet.colorStops[1]} />
          <stop offset="100%" stopColor={planet.colorStops[2]} />
        </radialGradient>
        <clipPath id={clipId}>
          <circle cx="0" cy="0" r="100" />
        </clipPath>
      </defs>

      {/* year arc — outer circle sweep proportional to the longest year shown */}
      {gauges && (
        <>
          <circle cx="0" cy="0" r={128} fill="none" stroke="var(--line)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          <circle
            cx="0"
            cy="0"
            r={128}
            fill="none"
            stroke="var(--brass)"
            strokeWidth="4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            strokeDasharray={`${(gauges.yearFrac * 2 * Math.PI * 128).toFixed(1)} ${(
              2 *
              Math.PI *
              128
            ).toFixed(1)}`}
            transform="rotate(-90)"
          />
          {/* day ring + spinning marker (normalized speed, engine.spinSeconds) */}
          <circle cx="0" cy="0" r={112} fill="none" stroke="var(--line-soft)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="3 5" />
          <g ref={markerRef}>
            <circle cx="0" cy={-112} r={markerR} fill="var(--text)" />
          </g>
        </>
      )}

      {/* Saturn ring — back half behind the sphere, front half over it */}
      {hasRings && (
        <ellipse
          cx="0"
          cy="0"
          rx="172"
          ry="46"
          fill="none"
          stroke="#b8a267"
          strokeWidth="9"
          opacity="0.9"
          transform="rotate(-16)"
          strokeDasharray={`${(Math.PI * 172 * 0.53).toFixed(0)} 9999`}
        />
      )}

      {/* the specimen itself */}
      <circle cx="0" cy="0" r="100" fill={`url(#${gradId})`} />

      {/* latitude bands (gas giants) — clipped, sun-lit from the left */}
      {planet.bands && (
        <g clipPath={`url(#${clipId})`} opacity="0.5">
          <rect x="-100" y="-64" width="200" height="13" fill={planet.colorStops[2]} />
          <rect x="-100" y="-30" width="200" height="16" fill={planet.colorStops[2]} opacity="0.75" />
          <rect x="-100" y="2" width="200" height="12" fill={planet.colorStops[0]} opacity="0.5" />
          <rect x="-100" y="30" width="200" height="15" fill={planet.colorStops[2]} opacity="0.65" />
          <rect x="-100" y="62" width="200" height="12" fill={planet.colorStops[2]} opacity="0.5" />
        </g>
      )}

      {/* Earth's continents hint — malachite blobs, clipped to the sphere */}
      {planet.id === 'earth' && (
        <g clipPath={`url(#${clipId})`} opacity="0.85">
          <ellipse cx="-28" cy="-24" rx="34" ry="24" fill="var(--min-earth-green)" transform="rotate(-18)" />
          <ellipse cx="30" cy="22" rx="26" ry="18" fill="var(--min-earth-green)" transform="rotate(14)" />
          <ellipse cx="6" cy="52" rx="30" ry="14" fill="var(--min-earth-green)" opacity="0.9" />
        </g>
      )}

      {hasRings && (
        <ellipse
          cx="0"
          cy="0"
          rx="172"
          ry="46"
          fill="none"
          stroke="#cbb87f"
          strokeWidth="9"
          opacity="0.95"
          transform="rotate(-16)"
          strokeDasharray={`${(Math.PI * 172 * 0.47).toFixed(0)} 9999`}
          strokeDashoffset={`${(Math.PI * 172 * 0.53).toFixed(0)}`}
        />
      )}

      {/* terminator — one directional light, flat mineral shading (no glow) */}
      <circle cx="0" cy="0" r="100" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2" />
    </svg>
  );
}

/** Small medallion disc for quiz/compare pickers — planet pigment + name. */
export function MedallionSphere({ planet, size = 26 }: { planet: PlanetData; size?: number }) {
  const gradId = `med-${planet.id}`;
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={gradId} cx="0.34" cy="0.3" r="0.95">
          <stop offset="0%" stopColor={planet.colorStops[0]} />
          <stop offset="55%" stopColor={planet.colorStops[1]} />
          <stop offset="100%" stopColor={planet.colorStops[2]} />
        </radialGradient>
      </defs>
      <circle cx="0" cy="0" r="100" fill={`url(#${gradId})`} />
      {planet.hasRings && (
        <ellipse cx="0" cy="0" rx="170" ry="48" fill="none" stroke="#cbb87f" strokeWidth="10" transform="rotate(-16)" />
      )}
    </svg>
  );
}
