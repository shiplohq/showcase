// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Code-native SVG illustration library — paper-cut botanical language.
// Every piece is flat vector built from shared primitives; "shadows" are
// darker solid layers offset by ~3px (paper stacked on paper), never blur.
// Colors come from the design tokens (DESIGN_DECISIONS §4) hardcoded as hex
// because SVG fills cannot reference CSS vars inside currentColor-free paths
// used by GSAP-targeted groups — tokens stay authoritative in tokens.css.

import type { CSSProperties, JSX } from 'react';

const INK = '#3D3425';
const LEAF = '#4E7A3A';
const LEAF_DEEP = '#37582A';
const APPLE = '#7FA84B';
const SPROUT = '#9DC36B';
const MOSS = '#6B7F3F';
const SOIL = '#9C6B44';
const SOIL_DEEP = '#7A4E30';
const TERRA = '#C96F4A';
const SUN = '#F2B33D';
const SUN_DEEP = '#D99A26';
const PETAL = '#E98FA4';
const PETAL_DEEP = '#D06A85';
const PAPER = '#FFFBEF';

/** Drop a flat shadow copy of any path set (offset darker layer). */
function shadowed(children: JSX.Element, dx = 0, dy = 3): JSX.Element {
  return (
    <>
      <g transform={`translate(${dx} ${dy})`} opacity={0.18} fill={INK}>
        {children}
      </g>
      {children}
    </>
  );
}

/* ---- seeds & sprouts ------------------------------------------------------ */

export function SeedArt({ id }: { id?: string }): JSX.Element {
  void id;
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 4C27 8 33 15 33 22a13 13 0 0 1-26 0C7 15 13 8 20 4z" fill={SOIL_DEEP} transform="translate(0 2)" />
      <path d="M20 4C27 8 33 15 33 22a13 13 0 0 1-26 0C7 15 13 8 20 4z" fill={SOIL} />
      <path d="M20 10c3.4 2.7 6 6.7 6 10.5a6 6 0 0 1-12 0C14 16.7 16.6 12.7 20 10z" fill="#B07E52" />
      <path d="M20 17c1.6 1.4 2.8 3.4 2.8 5.2a2.8 2.8 0 0 1-5.6 0c0-1.8 1.2-3.8 2.8-5.2z" fill={SUN} />
    </svg>
  );
}

export function SproutStageArt({ stage }: { stage: 1 | 2 | 3 }): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      {stage === 1 && (
        <g>
          <ellipse cx="40" cy="66" rx="16" ry="6" fill={SOIL_DEEP} />
          <path d="M40 64c-1-10 2-16 8-20-4 8-4 14-4 20z" fill={SPROUT} />
          <path d="M40 64c1-8-1-13-7-16 4 6 5 10 5 16z" fill={APPLE} />
        </g>
      )}
      {stage === 2 && (
        <g>
          <ellipse cx="40" cy="68" rx="16" ry="6" fill={SOIL_DEEP} />
          <path d="M39 66C38 48 40 36 40 24l2 0c0 12 2 24 1 42z" fill={LEAF} />
          <path d="M41 46c-9-2-14-8-14-16 9 1 15 7 15 15z" fill={APPLE} />
          <path d="M41 38c9-3 13-9 13-16-9 1-14 8-14 15z" fill={SPROUT} />
        </g>
      )}
      {stage === 3 && (
        <g>
          <ellipse cx="40" cy="68" rx="17" ry="6" fill={SOIL_DEEP} />
          <path d="M39 66C38 46 40 34 40 22l2 0c0 12 2 24 1 44z" fill={LEAF} />
          <path d="M40 48c-10-2-15-8-15-17 10 1 16 8 16 16z" fill={APPLE} />
          <path d="M42 40c10-3 14-10 14-17-10 1-15 9-15 16z" fill={SPROUT} />
          <g>
            <circle cx="40" cy="16" r="11" fill={PETAL_DEEP} transform="translate(0 2)" opacity="0.9" />
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="40" cy="9" rx="6.4" ry="8.5" fill={PETAL} transform={`rotate(${a} 40 17)`} />
            ))}
            <circle cx="40" cy="17" r="6" fill={SUN} />
          </g>
        </g>
      )}
    </svg>
  );
}

/* ---- flowers (reward / end garden) ---------------------------------------- */

export type FlowerVariant = 'tulip' | 'daisy' | 'sunflower' | 'rose';

export function FlowerArt({ variant, style }: { variant: FlowerVariant; style?: CSSProperties }): JSX.Element {
  return (
    <svg viewBox="0 0 80 112" aria-hidden="true" style={style}>
      <path d="M39 108C38 84 40 62 40 40l2 0c0 22 2 44 1 68z" fill={LEAF} />
      <path d="M40 84c-11-2-17-9-17-19 11 1 19 9 19 18z" fill={APPLE} />
      <path d="M42 74c11-3 16-10 16-19-11 1-17 10-17 18z" fill={SPROUT} />
      {variant === 'tulip' && (
        <g>
          <path d="M26 22c0 12 6 22 14 22s14-10 14-22c-4 5-8 7-14 7s-10-2-14-7z" fill={PETAL} transform="translate(0 3)" opacity="0.85" />
          <path d="M26 18c0 13 6 23 14 23s14-10 14-23c-4 5-8 7-14 7s-10-2-14-7z" fill={PETAL} />
          <path d="M26 18c-2-6-3-11-1-13 3 2 5 6 6 10zM54 18c2-6 3-11 1-13-3 2-5 6-6 10z" fill={PETAL_DEEP} />
        </g>
      )}
      {variant === 'daisy' && (
        <g>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <ellipse key={a} cx="40" cy="8" rx="7" ry="13" fill={PAPER} transform={`rotate(${a} 40 21)`} />
          ))}
          <ellipse cx="40" cy="8" rx="7" ry="13" fill={PAPER} transform="rotate(22.5 40 21)" opacity="0.7" />
          <circle cx="40" cy="21" r="9" fill={SUN} />
          <circle cx="40" cy="21" r="6" fill={SUN_DEEP} opacity="0.35" />
        </g>
      )}
      {variant === 'sunflower' && (
        <g>
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
            <ellipse key={a} cx="40" cy="7" rx="6.6" ry="12" fill={SUN} transform={`rotate(${a} 40 22)`} />
          ))}
          <circle cx="40" cy="22" r="10.5" fill={SOIL} />
          <circle cx="40" cy="22" r="7" fill={SOIL_DEEP} opacity="0.55" />
        </g>
      )}
      {variant === 'rose' && (
        <g>
          <circle cx="40" cy="21" r="15" fill={PETAL} />
          <path d="M40 8a13 13 0 0 1 0 26 9 9 0 0 1 0-26z" fill={PETAL_DEEP} opacity="0.5" />
          <path d="M40 14c5 1 8 5 7 10-3 1-7-1-8-5-0.5-2 0-4 1-5z" fill={PAPER} opacity="0.55" />
        </g>
      )}
    </svg>
  );
}

/* ---- home-screen unit trees ----------------------------------------------- */

export function TreeArt({ variant }: { variant: 'apple' | 'tulip' | 'daisy' | 'sunflower' }): JSX.Element {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {variant === 'apple' && (
        <g>
          {shadowed(
            <>
              <path d="M50 88c-2-18 0-30 0-40l3 0c0 10 2 22 1 40z" fill={SOIL} />
              <path d="M50 62c-13-3-19-10-19-21 13 1 21 10 21 20z" fill={APPLE} />
            </>,
          )}
          <path d="M50 20c22 0 34 13 34 26 0 14-15 24-34 24S16 60 16 46c0-13 12-26 34-26z" fill={APPLE} />
          <path d="M50 24c16 2 26 11 28 20-9 5-19 3-28-4-7-5-11-11-12-16 4-1 8 0 12 0z" fill={MOSS} opacity="0.45" />
          {[
            [36, 44],
            [58, 38],
            [48, 56],
            [66, 52],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y + 2} r="6" fill={INK} opacity="0.15" />
              <circle cx={x} cy={y} r="6" fill={TERRA} />
              <circle cx={x - 1.6} cy={y - 1.6} r="2" fill={PAPER} opacity="0.5" />
            </g>
          ))}
        </g>
      )}
      {variant === 'tulip' && (
        <g>
          {[24, 50, 76].map((x, i) => (
            <g key={x} transform={`translate(${x - 40} ${6 - i * 4})`}>
              <path d="M40 92c0-16 0-28 0-38l3 0c0 10 0 22 0 38z" fill={LEAF} transform="translate(0 -4)" />
              <path d="M28 44c0 11 5 19 12 19s12-8 12-19c-3.5 4-7 6-12 6s-8.5-2-12-6z" fill={PETAL} />
              <path d="M28 40c-1.6-5-2.4-9.4-0.8-11 2.4 1.6 4.2 5 5.2 8.6zM52 40c1.6-5 2.4-9.4 0.8-11-2.4 1.6-4.2 5-5.2 8.6z" fill={PETAL_DEEP} />
              <path d="M40 44c3 2 5 5 5 8a5 5 0 0 1-10 0c0-3 2-6 5-8z" fill={PETAL_DEEP} opacity="0.6" />
            </g>
          ))}
          <ellipse cx="50" cy="92" rx="30" ry="7" fill={SOIL} />
        </g>
      )}
      {variant === 'daisy' && (
        <g>
          <ellipse cx="50" cy="90" rx="30" ry="7" fill={SOIL} />
          {[26, 50, 74].map((x, i) => (
            <g key={x} transform={`translate(${x - 40} ${10 - i * 6})`}>
              <path d="M40 90c0-14 0-24 0-32l3 0c0 8 0 18 0 32z" fill={LEAF} />
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <ellipse
                  key={a}
                  cx="40"
                  cy="41"
                  rx="5.6"
                  ry="10.4"
                  fill={PAPER}
                  stroke="#E3D5AE"
                  strokeWidth="1.4"
                  paintOrder="stroke"
                  transform={`rotate(${a} 40 52)`}
                />
              ))}
              <circle cx="40" cy="52" r="7.4" fill={SUN} />
            </g>
          ))}
        </g>
      )}
      {variant === 'sunflower' && (
        <g>
          {shadowed(<path d="M49 92c-2-22 0-34 0-46l3 0c0 12 2 24 1 46z" fill={LEAF} />)}
          <path d="M49 74c-13-2-19-9-19-19 13 1 20 9 20 18z" fill={APPLE} />
          <path d="M52 66c13-3 19-10 19-19-13 1-20 9-20 18z" fill={SPROUT} />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
            <ellipse key={a} cx="50" cy="26" rx="6.4" ry="12" fill={SUN} transform={`rotate(${a} 50 42)`} />
          ))}
          <circle cx="50" cy="42" r="10.5" fill={SOIL} />
          <circle cx="50" cy="42" r="7" fill={SOIL_DEEP} opacity="0.55" />
        </g>
      )}
    </svg>
  );
}

/* ---- scene decoration ------------------------------------------------------ */

export function CloudArt(): JSX.Element {
  return (
    <svg viewBox="0 0 120 48" aria-hidden="true">
      <path
        d="M22 42c-10 0-16-6-16-13 0-6 5-11 12-12 1-8 8-13 17-13 8 0 14 4 17 10 3-2 7-3 11-3 10 0 17 6 17 14 0 1 0 1 0 2 8 1 13 6 13 12 0 2-1 3-3 3z"
        fill={PAPER}
      />
      <path d="M18 44c-4 0-7-1-9-4 4 1 9 1 14 1h64c4 0 9-1 12-2-2 3-7 5-12 5z" fill={INK} opacity="0.07" />
    </svg>
  );
}

export function SunArt(): JSX.Element {
  return (
    <svg viewBox="0 0 90 90" aria-hidden="true">
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
        <rect key={a} x="42" y="2" width="6" height="16" rx="3" fill={SUN_DEEP} transform={`rotate(${a} 45 45)`} />
      ))}
      <circle cx="45" cy="45" r="24" fill={SUN_DEEP} />
      <circle cx="45" cy="44" r="24" fill={SUN} />
      <circle cx="45" cy="44" r="17" fill="#F7C86B" />
    </svg>
  );
}

/* Picket fence — a low mid-ground strip that fills the stage's dead zone. */
export function FenceArt(): JSX.Element {
  return (
    <svg viewBox="0 0 320 64" aria-hidden="true" preserveAspectRatio="none">
      <g fill={PAPER}>
        <rect x="0" y="20" width="320" height="9" rx="4" />
        <rect x="0" y="38" width="320" height="9" rx="4" />
        {[8, 48, 88, 128, 168, 208, 248, 288].map((x) => (
          <path key={x} d={`M${x} 14l14 8v34l-14 8-14-8V22z`} />
        ))}
      </g>
      <g fill={INK} opacity="0.08">
        <rect x="0" y="23" width="320" height="9" rx="4" />
        <rect x="0" y="41" width="320" height="9" rx="4" />
      </g>
    </svg>
  );
}

/* Watering can — friendly mid-ground prop on the hill. */
export function WateringCanArt(): JSX.Element {
  return (
    <svg viewBox="0 0 100 84" aria-hidden="true">
      <path d="M26 30h34v34a8 8 0 0 1-8 8H34a8 8 0 0 1-8-8z" fill={TERRA} transform="translate(0 3)" opacity="0.85" />
      <path d="M26 26h34v34a8 8 0 0 1-8 8H34a8 8 0 0 1-8-8z" fill="#D9805B" />
      <path d="M30 30h26v26H30z" fill={TERRA} />
      <path d="M60 36l22-12 4 7-22 12z" fill="#D9805B" />
      <circle cx="86" cy="22" r="8" fill={TERRA} />
      <circle cx="86" cy="22" r="5" fill="#E29A78" />
      <path d="M26 34c-10 0-16 6-16 12s6 12 16 12" fill="none" stroke={TERRA} strokeWidth="7" strokeLinecap="round" />
      <path d="M36 20c4-6 12-6 16 0" fill="none" stroke={SOIL_DEEP} strokeWidth="6" strokeLinecap="round" />
      <path d="M40 26h8v6h-8z" fill={SOIL_DEEP} />
    </svg>
  );
}

/* ---- progress pip (leaf) --------------------------------------------------- */

export function LeafPip({ state }: { state: 'done' | 'active' | 'todo' }): JSX.Element {
  const stroke = state === 'done' ? LEAF_DEEP : state === 'active' ? TERRA : '#C4B48A';
  return (
    <svg viewBox="0 0 15 18" aria-hidden="true" className="pip">
      <path
        d="M7.5 1C11 3.4 13.5 7 13.5 11a6 6 0 0 1-12 0C1.5 7 4 3.4 7.5 1z"
        fill={state === 'done' ? LEAF : 'none'}
        stroke={stroke}
        strokeWidth={state === 'active' ? 2.4 : 1.6}
      />
    </svg>
  );
}

/* ---- feedback icons -------------------------------------------------------- */

export function SproutIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21c-1-6 1-10 6-13-3 6-4 9-4 13z" fill={LEAF} />
      <path d="M12 21c1-5 0-8-5-10 3 5 3 7 3 10z" fill={SPROUT} />
    </svg>
  );
}

export function LeafTiltIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2c4.4 3 7.2 7.6 7.2 12.2a7.2 7.2 0 0 1-14.4 0C4.8 9.6 7.6 5 12 2z" fill={TERRA} />
      <path d="M12 6c2.2 2 3.6 4.8 3.6 7.6" stroke={PAPER} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ---- topbar icons ----------------------------------------------------------- */

export function HomeIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 11.5 12 4l8 7.5h-2.4V20h-4.3v-5h-2.6v5H6.4v-8.5z" fill={INK} />
    </svg>
  );
}

export function SoundOffIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" fill={INK} />
      <path d="M15.5 9.5l5 5m0-5l-5 5" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function SoundOnIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" fill={INK} />
      <path d="M15.2 9.2a4 4 0 0 1 0 5.6M17.8 7a7.4 7.4 0 0 1 0 10" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function StarIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.8l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.3l-5.4 3 1.2-6L3.3 9.1l6.1-.7z" fill={SUN} stroke={SUN_DEEP} strokeWidth="1.4" />
    </svg>
  );
}

/* ---- seed bag --------------------------------------------------------------- */

export function BagArt(): JSX.Element {
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <path d="M18 16c-6 6-9 14-9 22 0 10 8 16 21 16s21-6 21-16c0-8-3-16-9-22z" fill={TERRA} transform="translate(0 2)" opacity="0.85" />
      <path d="M18 14c-6 6-9 14-9 22 0 10 8 16 21 16s21-6 21-16c0-8-3-16-9-22z" fill="#D9805B" />
      <path d="M30 52c-9 0-15-4-15-11 0-6 3-13 8-18l14 0c5 5 8 12 8 18 0 7-6 11-15 11z" fill={TERRA} />
      <path d="M17 30c2-7 6-12 13-12s11 5 13 12c-4-4-8-5-13-5s-9 1-13 5z" fill="#E29A78" />
      <path d="M20 13c4 3 16 3 20 0l-2-4c-5 2-11 2-16 0z" fill={SOIL_DEEP} />
      <ellipse cx="30" cy="40" rx="9" ry="6.6" fill={SOIL_DEEP} opacity="0.55" />
      <ellipse cx="27" cy="38.6" rx="2.6" ry="2" fill={SUN} />
      <ellipse cx="33.6" cy="41" rx="2.6" ry="2" fill={SUN} opacity="0.8" />
    </svg>
  );
}

/* ---- number-bond tree (Why it works) ---------------------------------------- */

export function BondTreeArt({ total, parts }: { total: number; parts: [number, number] }): JSX.Element {
  void total;
  void parts;
  return (
    <svg viewBox="0 0 340 240" className="bond-tree" aria-hidden="true">
      {/* Trunk from bottom center splitting to two part-branches */}
      <path d="M170 232c0-30-4-44-4-58m4 58c0-30 4-44 4-58" stroke={SOIL} strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M166 176c-30-4-58-18-74-38m78 38c30-4 58-18 74-38" stroke={LEAF} strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M170 176c0-34 0-56 0-74" stroke={LEAF} strokeWidth="9" fill="none" strokeLinecap="round" />
      {/* Total node */}
      <g>
        <circle cx="170" cy="84" r="34" fill={SUN_DEEP} />
        <circle cx="170" cy="82" r="34" fill={SUN} />
        <text x="170" y="94" textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontWeight="800" fontSize="32" fill={INK}>
          {total}
        </text>
      </g>
      {/* Part nodes */}
      {[
        { x: 76, y: 176, value: parts[0] },
        { x: 264, y: 176, value: parts[1] },
      ].map((p) => (
        <g key={p.x}>
          <circle cx={p.x} cy={p.y} r="32" fill={APPLE} />
          <circle cx={p.x} cy={p.y - 2} r="32" fill="#8DB257" />
          <text x={p.x} y={p.y + 9} textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontWeight="800" fontSize="30" fill={INK}>
            {p.value}
          </text>
        </g>
      ))}
      {/* Tiny leaves on branches */}
      <path d="M120 148c-6-8-6-14-2-20 6 4 8 10 6 18zM224 150c6-8 6-14 2-20-6 4-8 10-6 18z" fill={SPROUT} />
    </svg>
  );
}

/* ---- loading sprout ---------------------------------------------------------- */

export function LoadingSprout(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <ellipse cx="40" cy="70" rx="18" ry="6" fill={SOIL_DEEP} />
      <path d="M40 68C39 52 41 40 41 28l3 0c0 12 2 24 1 40z" fill={LEAF} />
      <path d="M42 50c-9-2-14-7-14-15 9 1 15 7 15 14z" fill={APPLE} />
      <path d="M42 42c9-3 13-8 13-15-9 1-14 8-14 14z" fill={SPROUT} />
    </svg>
  );
}
