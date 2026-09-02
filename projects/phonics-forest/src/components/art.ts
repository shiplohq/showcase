// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Original woodcut-style SVG art, all authored in this project (Apache-2.0).
// Language: flat carved shapes + thick uniform ink outlines + diagonal hatch
// patterns instead of shadows — see design/DESIGN_DECISIONS.md §9.
// Every text node inside the SVGs uses Andika (grapheme/IPA letterforms).

export interface TreeArt {
  /** CSS colour token value for the canopy (resolved from tokens.css by key). */
  canopyKey: string;
}

/** Canopy palette keys → CSS custom property names (tokens.css). */
const CANOPY_VARS: Record<string, string> = {
  moss: '--moss',
  pine: '--pine',
  lichen: '--lichen',
  fir: '--fir',
  fog: '--fog',
  spruce: '--pine-deep',
};

export function canopyVar(key: string): string {
  return `var(${CANOPY_VARS[key] ?? '--moss'})`;
}

/** Diagonal woodcut hatch — carved shading instead of drop shadows. */
export function hatchDefs(id: string, color: string, angle = 45, gap = 7): string {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * gap;
  const dy = Math.sin(rad) * gap;
  return `<pattern id="${id}" width="${Math.abs(dx) + Math.abs(dy) || gap}" height="${Math.abs(dx) + Math.abs(dy) || gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})">
    <line x1="0" y1="0" x2="0" y2="${gap}" stroke="${color}" stroke-width="2.2" stroke-linecap="round" opacity="0.5"/>
  </pattern>`;
}

export interface TreeParams {
  id: string;
  grapheme: string;
  ipa: string;
  canopy: string;
  tiers: number;
  height: number;
  fireflies: number; // 0..3 lit
  scale?: number;
}

/**
 * Conifer "sound tree": stacked carved triangles with hatch shading, a bark
 * trunk, and a hanging sign carrying the grapheme (large, Andika), the IPA
 * caption and three firefly progress slots.
 */
export function coniferTree(t: TreeParams, unique: string): string {
  const H = 330;
  const W = 220;
  const canopy = canopyVar(t.canopy);
  const hatch = `hatch-${t.id}-${unique}`;
  const tierCount = Math.max(3, Math.min(5, t.tiers));
  const groundY = 250;
  const trunkTop = groundY - 46;
  // Tiers grow from the trunk top upward, each wider toward the bottom.
  const tiers: string[] = [];
  const totalH = 150 * t.height;
  const tierH = totalH / tierCount;
  for (let i = 0; i < tierCount; i++) {
    const yBase = trunkTop - i * tierH * 0.82;
    const halfW = 30 + (tierCount - 1 - i) * 16;
    const tipUp = tierH + 26;
    tiers.push(`<polygon points="${110 - halfW},${yBase} ${110 + halfW},${yBase} 110,${yBase - tipUp}"
      fill="${canopy}" stroke="var(--ink)" stroke-width="3.5" stroke-linejoin="round"/>
      <polygon points="${110},${yBase - tipUp} ${110 + halfW},${yBase} ${110 + halfW * 0.34},${yBase}"
      fill="url(#${hatch})" stroke="none"/>`);
    // Carved edge: a short notch on the left of every tier (print-mark feel).
    tiers.push(`<path d="M ${110 - halfW + 8} ${yBase - 4} l 10 -9" stroke="var(--ink)" stroke-width="2.4" opacity="0.55" fill="none"/>`);
  }
  const flies = [0, 1, 2]
    .map((i) => {
      const lit = i < t.fireflies;
      return `<g class="fly-slot${lit ? ' lit' : ''}" data-slot="${i}" data-lit="${lit ? '1' : '0'}">
        <circle cx="${74 + i * 36}" cy="320" r="${lit ? 8.5 : 7.2}" fill="${lit ? 'var(--lantern-glow)' : 'var(--ivory-deep)'}"
          stroke="var(--ink)" stroke-width="2.4"/>
      </g>`;
    })
    .join('');
  return `<svg class="tree-svg" viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true" focusable="false">
    <defs>${hatchDefs(hatch, 'var(--ink)', 38, 7.5)}</defs>
    <!-- trunk -->
    <path d="M102 ${groundY} L100 ${trunkTop} L120 ${trunkTop} L118 ${groundY} Z"
      fill="var(--bark)" stroke="var(--ink)" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M104 ${groundY - 8} l0 -20 M114 ${groundY - 30} l0 -18" stroke="var(--bark-deep)" stroke-width="2.4" fill="none"/>
    <!-- canopy tiers (top first for overlap) -->
    ${tiers.reverse().join('')}
    <!-- hanging sign -->
    <g class="tree-sign">
      <path d="M96 254 l3 -14 M124 254 l-3 -14" stroke="var(--ink)" stroke-width="2.6" fill="none"/>
      <rect x="52" y="256" width="116" height="52" rx="9" fill="var(--ivory-raised)" stroke="var(--ink)" stroke-width="3.5"/>
      <rect x="58" y="262" width="104" height="40" rx="6" fill="none" stroke="var(--bark)" stroke-width="1.6" opacity="0.7"/>
      <text class="sg-grapheme" x="110" y="290" text-anchor="middle">${escapeXml(t.grapheme)}</text>
      <text class="sg-ipa" x="110" y="303" text-anchor="middle">${escapeXml(t.ipa)}</text>
    </g>
    ${flies}
  </svg>`;
}

/** IPA caption rendered below/next to a sign (own element so Andika is guaranteed). */
export function ipaCaption(ipa: string): string {
  return `<span class="ipa-caption">${escapeXml(ipa)}</span>`;
}

/** Sound stone — the round carved rock that speaks a word when tapped. */
export function soundStone(id: string): string {
  const hatch = `stone-hatch-${id}`;
  return `<svg class="stone-svg" viewBox="0 0 140 120" role="img" aria-hidden="true" focusable="false">
    <defs>${hatchDefs(hatch, 'var(--ink)', 30, 8)}</defs>
    <ellipse cx="70" cy="102" rx="46" ry="9" fill="var(--ivory-deep)" stroke="var(--ink)" stroke-width="2.4"/>
    <path d="M26 88 C18 60 34 30 70 26 C106 30 122 60 114 88 C112 98 92 104 70 104 C48 104 28 98 26 88 Z"
      fill="var(--stone)" stroke="var(--ink)" stroke-width="3.5"/>
    <path d="M78 30 C98 36 110 56 108 78 C107 88 96 96 82 99 L96 66 Z" fill="url(#${hatch})" stroke="none"/>
    <g stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round">
      <path d="M58 52 a14 14 0 0 1 0 28"/>
      <path d="M48 44 a24 24 0 0 1 0 44" opacity="0.85"/>
      <path d="M38 36 a34 34 0 0 1 0 60" opacity="0.65"/>
    </g>
    <path d="M30 96 q-6 6 2 10" stroke="var(--moss)" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M104 94 q7 5 0 11" stroke="var(--moss)" stroke-width="5" fill="none" stroke-linecap="round"/>
  </svg>`;
}

/** The animated firefly dot (created for a flight, removed on arrival). */
export function fireflyDot(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'firefly-dot';
  el.setAttribute('aria-hidden', 'true');
  return el;
}

export type SpriteVariant = 'pod-a' | 'pod-b' | 'pod-c' | 'pod-d';

/** Word creature: a small seed-pod sprite carrying a leaf with the word on
 *  it. Meaning lives in the WORD (children are learning letters); the sprite
 *  is the companion. `scarf` colours a tiny leaf-pin in the home tree hue —
 *  a subtle cue only, never the sole signal. */
export function creature(word: string, variant: SpriteVariant, scarf: string): string {
  const features: Record<SpriteVariant, string> = {
    'pod-a': `<path d="M48 20 l5 -13 5 13 M62 20 l4 -11 5 11" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    'pod-b': `<path d="M92 40 q17 -12 10 -27 q-12 11 -10 27" fill="var(--lichen)" stroke="var(--ink)" stroke-width="3"/>`,
    'pod-c': `<path d="M40 46 q-15 -6 -13 -20 q13 4 13 20 Z M88 46 q15 -6 13 -20 q-13 4 -13 20 Z" fill="var(--fog)" stroke="var(--ink)" stroke-width="3"/>`,
    'pod-d': `<path d="M60 18 q0 -11 10 -13 q2 11 -10 13 Z" fill="var(--moss)" stroke="var(--ink)" stroke-width="3"/>`,
  };
  return `<svg class="creature-svg" viewBox="0 0 124 128" role="img" aria-hidden="true" focusable="false">
    <ellipse cx="64" cy="122" rx="36" ry="5" fill="var(--ivory-deep)" stroke="none" opacity="0.8"/>
    <path d="M42 44 C42 26 54 16 64 16 C76 16 90 28 88 46 C87 62 78 70 64 70 C50 70 42 60 42 44 Z"
      fill="var(--ivory-raised)" stroke="var(--ink)" stroke-width="3.5"/>
    ${features[variant]}
    <circle cx="57" cy="42" r="3.4" fill="var(--ink)"/>
    <circle cx="72" cy="42" r="3.4" fill="var(--ink)"/>
    <path d="M58 53 q6 5 12 0" stroke="var(--ink)" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M86 38 q9 -2 8 7" stroke="${scarf}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <!-- leaf banner carrying the word (the meaning lives in the letters) -->
    <path d="M18 92 Q10 84 22 80 L102 80 Q114 84 106 92 Q114 100 102 104 L22 104 Q10 100 18 92 Z"
      fill="var(--pine-deep)" stroke="var(--ink)" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="M18 92 L106 92" stroke="var(--ink)" stroke-width="1.4" opacity="0.5"/>
    <text class="creature-word" x="62" y="99" text-anchor="middle">${escapeXml(word)}</text>
  </svg>`;
}

/** UI icons — carved-stroke style, 24×24, stroke inherits currentColor. */
export const icons = {
  home: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 11 L12 4 L20 11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 10.5 V19 H17.5 V10.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M10 19 V14 H14 V19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
  soundOn: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 10 V14 H8 L13 18 V6 L8 10 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M16 9 a5 5 0 0 1 0 6 M18.5 7 a8.5 8.5 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  soundOff: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 10 V14 H8 L13 18 V6 L8 10 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M16.5 9.5 L21 14.5 M21 9.5 L16.5 14.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  reset: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12 a7 7 0 1 0 2.5 -5.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M7 3.5 V7 H10.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  replay: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5 a7 7 0 1 0 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M12 1.8 L16.4 5 L12 8.2 Z" fill="currentColor"/></svg>`,
  eye: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 12 C5.5 7.8 8.5 6 12 6 C15.5 6 18.5 7.8 21 12 C18.5 16.2 15.5 18 12 18 C8.5 18 5.5 16.2 3 12 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`,
  back: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 5 L7 12 L14 19" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  next: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 5 L17 12 L10 19" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

/** Misty hillside backdrop (SVG, sliced to cover). One per scene. */
export function forestBackdrop(unique: string): string {
  const hatchFar = `far-hatch-${unique}`;
  const hatchNear = `near-hatch-${unique}`;
  return `<svg class="backdrop-svg" viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
    <defs>
      ${hatchDefs(hatchFar, 'var(--pine-deep)', 40, 9)}
      ${hatchDefs(hatchNear, 'var(--moss-deep)', 40, 9)}
    </defs>
    <!-- far ridge, fogged -->
    <path d="M0 250 L160 190 L330 240 L520 170 L720 235 L900 175 L1100 240 L1280 185 L1440 240 L1440 520 L0 520 Z"
      fill="var(--fog-pale)" stroke="var(--fog-deep)" stroke-width="3"/>
    <path d="M900 175 L1100 240 L1280 185 L1440 240 L1440 300 L900 300 Z" fill="url(#${hatchFar})" opacity="0.25"/>
    <!-- mid ridge -->
    <path d="M0 340 L140 280 L360 330 L560 265 L790 330 L1010 275 L1240 335 L1440 285 L1440 520 L0 520 Z"
      fill="var(--lichen)" stroke="var(--ink)" stroke-width="3.2"/>
    <path d="M560 265 L790 330 L1010 275 L1240 335 L1440 285 L1440 400 L560 400 Z" fill="url(#${hatchNear})" opacity="0.3"/>
    <!-- near ground -->
    <path d="M0 430 C 300 400 500 450 760 435 C 1020 420 1240 455 1440 430 L1440 520 L0 520 Z"
      fill="var(--ivory-deep)" stroke="var(--ink)" stroke-width="3"/>
    <g class="mist-lines" stroke="var(--fog)" stroke-width="3" opacity="0.5" stroke-linecap="round">
      <path d="M120 150 h90" /><path d="M420 128 h70" /><path d="M980 140 h100" /><path d="M1220 118 h60" />
    </g>
  </svg>`;
}

export function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] as string));
}
