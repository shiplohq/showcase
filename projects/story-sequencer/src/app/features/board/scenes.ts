// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

/**
 * Original SVG scene library — every story frame is drawn here (flat fills,
 * 3px ink outlines, the muted teal/rust/sand token palette; no gradients, no
 * text inside the art). JSON only carries the scene id; the registry maps it
 * to a renderer, so content data never injects markup.
 *
 * All scenes share viewBox 0 0 400 250 and are composed from one vocabulary
 * (sky states, ground band, kids, props) so the 26 frames read as the same
 * comic while each silhouette + sky state stays distinct — the sequencing
 * task depends on those visual narrative cues.
 */

const INK = '#26332F';
const INK2 = '#51615B';
const PAPER = '#F5E9CF';
const PAPER2 = '#EEDCB8';
const PAPER3 = '#E4CE9F';
const SANDGROUND = '#E9D7AC';
const TEAL = '#2E7D74';
const TEALSOFT = '#9CC5BE';
const TEALPALE = '#DCE8E4';
const RUST = '#B4552D';
const RUST2 = '#8F3F1F';
const MUSTARD = '#D9A441';
const CREAM = '#FBF6EA';
const SKY_SUN = '#F1E7C9';
const SKY_CLOUD = '#CFDBD6';
const SKY_STORM = '#74898A';
const SKY_NIGHT = '#33443F';
const WOOD = '#A9805A';
const WOOD2 = '#8A6544';
const LEAF = '#4E8A6A';
const LEAF2 = '#6FA47E';
const DENIM = '#4F6270';

const S = (w: number) => `stroke-width="${w}"`;

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

function sky(color: string): string {
  return `<rect x="0" y="0" width="400" height="250" fill="${color}"/>`;
}

function sun(x: number, y: number, r = 22): string {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      const x1 = x + Math.cos(rad) * (r + 6);
      const y1 = y + Math.sin(rad) * (r + 6);
      const x2 = x + Math.cos(rad) * (r + 14);
      const y2 = y + Math.sin(rad) * (r + 14);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${RUST}" ${S(4)} stroke-linecap="round"/>`;
    })
    .join('');
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${MUSTARD}" stroke="${INK}" ${S(3)}/>${rays}`;
}

function cloud(x: number, y: number, scale = 1, fill = CREAM): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M-42 8 h84 a10 10 0 0 0 4 -19 a16 16 0 0 0 -28 -9 a13 13 0 0 0 -24 6 a11 11 0 0 0 -12 13 a9 9 0 0 0 -8 9 z"
      fill="${fill}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
  </g>`;
}

function stormCloud(x: number, y: number, scale = 1): string {
  return cloud(x, y, scale, TEAL);
}

function rainField(x0: number, x1: number, yTop: number, yBot: number, step = 18): string {
  let out = '';
  for (let x = x0; x < x1; x += step) {
    out += `<line x1="${x}" y1="${yTop}" x2="${x - 8}" y2="${yBot}" stroke="${TEALSOFT}" ${S(3)} stroke-linecap="round"/>`;
  }
  return out;
}

function ground(y = 208): string {
  return `<path d="M0 ${y} Q100 ${y - 12} 200 ${y} T400 ${y - 6} L400 250 L0 250 Z" fill="${SANDGROUND}" stroke="${INK}" ${S(3)}/>
    <path d="M40 ${y + 18} l6 -10 M46 ${y + 18} l5 -7 M120 ${y + 26} l6 -11 M126 ${y + 26} l5 -7 M300 ${y + 22} l6 -11 M306 ${y + 22} l5 -7" stroke="${TEAL}" ${S(3)} stroke-linecap="round" fill="none"/>`;
}

function hill(y = 190): string {
  return `<path d="M0 ${y + 14} Q120 ${y - 26} 260 ${y + 6} T400 ${y - 4} L400 ${y + 30} L0 ${y + 30} Z" fill="${TEALPALE}" stroke="none"/>`;
}

/** Bare / budding / full foliage states — a seasonal clock for reordering cues. */
function tree(x: number, groundY: number, scale = 1, state: 'bare' | 'bud' | 'full'): string {
  const buds =
    state === 'bare'
      ? ''
      : state === 'bud'
        ? `<circle cx="${x - 26}" cy="${groundY - 132}" r="9" fill="${LEAF2}" stroke="${INK}" ${S(2.5)}/>
           <circle cx="${x + 20}" cy="${groundY - 118}" r="8" fill="${LEAF2}" stroke="${INK}" ${S(2.5)}/>
           <circle cx="${x - 4}" cy="${groundY - 148}" r="9" fill="${LEAF2}" stroke="${INK}" ${S(2.5)}/>`
        : `<ellipse cx="${x}" cy="${groundY - 132}" rx="52" ry="40" fill="${LEAF}" stroke="${INK}" ${S(3)}/>
           <ellipse cx="${x - 26}" cy="${groundY - 112}" rx="26" ry="20" fill="${LEAF2}" stroke="${INK}" ${S(3)}/>`;
  return `<g transform="translate(${x} ${groundY}) scale(${scale}) translate(${-x} ${-groundY})">
    <path d="M${x - 7} ${groundY} L${x - 5} ${groundY - 92} L${x - 26} ${groundY - 116} M${x - 5} ${groundY - 70} L${x + 18} ${groundY - 98} M${x - 5} ${groundY - 60} L${x - 24} ${groundY - 86}"
      stroke="${WOOD2}" ${S(8)} stroke-linecap="round" fill="none"/>
    <line x1="${x}" y1="${groundY}" x2="${x}" y2="${groundY - 80}" stroke="${WOOD2}" ${S(10)} stroke-linecap="round"/>
    ${buds}
  </g>`;
}

export interface KidLook {
  shirt: string;
  hair: string;
  skin: string;
  hairStyle: 'crop' | 'bun' | 'bob' | 'curls';
}

export const MIA: KidLook = { shirt: RUST, hair: INK, skin: '#E8B98A', hairStyle: 'bun' };
export const SAM: KidLook = { shirt: TEAL, hair: '#4A342A', skin: '#C68955', hairStyle: 'crop' };
export const ANA: KidLook = { shirt: MUSTARD, hair: INK2, skin: '#F0C9A0', hairStyle: 'bob' };
export const BEN: KidLook = { shirt: '#54707C', hair: '#2E2A25', skin: '#D9A06B', hairStyle: 'curls' };

function hairPath(style: KidLook['hairStyle'], cx: number, cy: number, r: number): string {
  switch (style) {
    case 'bun':
      return `<path d="M${cx - r} ${cy - 2} a${r} ${r} 0 0 1 ${2 * r} 0 l0 -3 a${r} ${r} 0 0 0 -${2 * r} 0 z" fill="${INK}"/>
        <circle cx="${cx}" cy="${cy - r - 7}" r="7" fill="${INK}" stroke="${INK}" ${S(2)}/>`;
    case 'crop':
      return `<path d="M${cx - r} ${cy - 4} a${r} ${r} 0 0 1 ${2 * r} 0 l0 -4 a${r} ${r} 0 0 0 -${2 * r} 0 z" fill="#4A342A"/>`;
    case 'bob':
      return `<path d="M${cx - r - 2} ${cy + 6} a${r + 2} ${r + 2} 0 0 1 ${2 * r + 4} 0 l0 -14 a${r + 2} ${r + 2} 0 0 0 -${2 * r + 4} 0 z" fill="${INK2}"/>`;
    default:
      return `<circle cx="${cx - 8}" cy="${cy - r + 4}" r="7" fill="#2E2A25"/>
        <circle cx="${cx}" cy="${cy - r - 2}" r="8" fill="#2E2A25"/>
        <circle cx="${cx + 8}" cy="${cy - r + 4}" r="7" fill="#2E2A25"/>`;
  }
}

function face(cx: number, cy: number, smile = true, flip = false): string {
  const lx = flip ? -1 : 1;
  return `<circle cx="${cx - 4 * lx}" cy="${cy - 1}" r="1.8" fill="${INK}"/>
    <circle cx="${cx + 4 * lx}" cy="${cy - 1}" r="1.8" fill="${INK}"/>
    ${smile ? `<path d="M${cx - 4} ${cy + 4} q4 3.5 8 0" stroke="${INK}" ${S(1.8)} fill="none" stroke-linecap="round"/>` : `<line x1="${cx - 4}" y1="${cy + 4}" x2="${cx + 4}" y2="${cy + 4}" stroke="${INK}" ${S(1.8)} stroke-linecap="round"/>`}`;
}

/**
 * Flat comic kid. (x, y) = feet position. Poses: stand, run, arms-up, reach, kneel.
 */
function kid(x: number, y: number, look: KidLook, pose: 'stand' | 'run' | 'arms-up' | 'reach' | 'kneel' | 'sit' = 'stand', flip = false): string {
  const r = 13;
  const bodyTop = y - 62;
  const bodyH = 34;
  const head = `<circle cx="${x}" cy="${bodyTop - 16}" r="${r}" fill="${look.skin}" stroke="${INK}" ${S(3)}/>
    ${hairPath(look.hairStyle, x, bodyTop - 16, r)}
    ${face(x, bodyTop - 15, true, flip)}`;
  let legs: string;
  let arms: string;
  switch (pose) {
    case 'run':
      legs = `<line x1="${x - 2}" y1="${bodyTop + bodyH}" x2="${x - 16}" y2="${y - 4}" stroke="${DENIM}" ${S(8)} stroke-linecap="round"/>
        <line x1="${x + 2}" y1="${bodyTop + bodyH}" x2="${x + 14}" y2="${y - 10}" stroke="${DENIM}" ${S(8)} stroke-linecap="round"/>
        <ellipse cx="${x - 20}" cy="${y - 3}" rx="7" ry="4" fill="${INK}"/>
        <ellipse cx="${x + 18}" cy="${y - 9}" rx="7" ry="4" fill="${INK}"/>`;
      arms = `<line x1="${x - 8}" y1="${bodyTop + 6}" x2="${x + 10}" y2="${bodyTop + 16}" stroke="${look.shirt}" ${S(7)} stroke-linecap="round"/>
        <line x1="${x + 8}" y1="${bodyTop + 6}" x2="${x - 8}" y2="${bodyTop + 18}" stroke="${look.shirt}" ${S(7)} stroke-linecap="round"/>`;
      break;
    case 'arms-up':
      legs = `<line x1="${x - 5}" y1="${bodyTop + bodyH}" x2="${x - 6}" y2="${y}" stroke="${DENIM}" ${S(8)} stroke-linecap="round"/>
        <line x1="${x + 5}" y1="${bodyTop + bodyH}" x2="${x + 6}" y2="${y}" stroke="${DENIM}" ${S(8)} stroke-linecap="round"/>
        <ellipse cx="${x - 7}" cy="${y + 1}" rx="7" ry="4" fill="${INK}"/>
        <ellipse cx="${x + 7}" cy="${y + 1}" rx="7" ry="4" fill="${INK}"/>`;
      arms = `<line x1="${x - 9}" y1="${bodyTop + 8}" x2="${x - 22}" y2="${bodyTop - 14}" stroke="${look.shirt}" ${S(7)} stroke-linecap="round"/>
        <line x1="${x + 9}" y1="${bodyTop + 8}" x2="${x + 22}" y2="${bodyTop - 14}" stroke="${look.shirt}" ${S(7)} stroke-linecap="round"/>`;
      break;
    case 'reach':
      legs = `<line x1="${x - 5}" y1="${bodyTop + bodyH}" x2="${x - 6}" y2="${y}" stroke="${DENIM}" ${S(8)} stroke-linecap="round"/>
        <line x1="${x + 5}" y1="${bodyTop + bodyH}" x2="${x + 6}" y2="${y}" stroke="${DENIM}" ${S(8)} stroke-linecap="round"/>
        <ellipse cx="${x - 7}" cy="${y + 1}" rx="7" ry="4" fill="${INK}"/>
        <ellipse cx="${x + 7}" cy="${y + 1}" rx="7" ry="4" fill="${INK}"/>`;
      arms = `<line x1="${x - 9}" y1="${bodyTop + 8}" x2="${x - 18}" y2="${bodyTop - 6}" stroke="${look.shirt}" ${S(7)} stroke-linecap="round"/>
        <line x1="${x + 9}" y1="${bodyTop + 8}" x2="${x + 26}" y2="${bodyTop - 20}" stroke="${look.shirt}" ${S(7)} stroke-linecap="round"/>`;
      break;
    case 'kneel':
      legs = `<path d="M${x - 6} ${bodyTop + bodyH} q-4 12 2 16 l14 0 q6 -4 2 -16 z" fill="${DENIM}" stroke="${INK}" ${S(2.5)}/>
        <ellipse cx="${x - 8}" cy="${y + 1}" rx="7" ry="4" fill="${INK}"/>`;
      arms = `<line x1="${x - 9}" y1="${bodyTop + 10}" x2="${x - 20}" y2="${bodyTop + 22}" stroke="${look.shirt}" ${S(7)} stroke-linecap="round"/>
        <line x1="${x + 9}" y1="${bodyTop + 10}" x2="${x + 18}" y2="${bodyTop + 22}" stroke="${look.shirt}" ${S(7)} stroke-linecap="round"/>`;
      break;
    case 'sit':
      legs = `<path d="M${x - 4} ${bodyTop + bodyH} q-2 16 12 16 q10 0 12 -8 l2 -8" fill="${DENIM}" stroke="${INK}" ${S(2.5)} stroke-linejoin="round"/>
        <ellipse cx="${x + 14}" cy="${y - 1}" rx="8" ry="4.5" fill="${INK}"/>`;
      arms = `<line x1="${x - 9}" y1="${bodyTop + 8}" x2="${x - 13}" y2="${bodyTop + 24}" stroke="${look.shirt}" ${S(7)} stroke-linecap="round"/>
        <line x1="${x + 9}" y1="${bodyTop + 8}" x2="${x + 13}" y2="${bodyTop + 24}" stroke="${look.shirt}" ${S(7)} stroke-linecap="round"/>`;
      break;
    default:
      legs = `<line x1="${x - 5}" y1="${bodyTop + bodyH}" x2="${x - 6}" y2="${y}" stroke="${DENIM}" ${S(8)} stroke-linecap="round"/>
        <line x1="${x + 5}" y1="${bodyTop + bodyH}" x2="${x + 6}" y2="${y}" stroke="${DENIM}" ${S(8)} stroke-linecap="round"/>
        <ellipse cx="${x - 7}" cy="${y + 1}" rx="7" ry="4" fill="${INK}"/>
        <ellipse cx="${x + 7}" cy="${y + 1}" rx="7" ry="4" fill="${INK}"/>`;
      arms = `<line x1="${x - 9}" y1="${bodyTop + 8}" x2="${x - 14}" y2="${bodyTop + 26}" stroke="${look.shirt}" ${S(7)} stroke-linecap="round"/>
        <line x1="${x + 9}" y1="${bodyTop + 8}" x2="${x + 14}" y2="${bodyTop + 26}" stroke="${look.shirt}" ${S(7)} stroke-linecap="round"/>`;
  }
  return `<g>
    ${legs}
    <rect x="${x - 11}" y="${bodyTop}" width="22" height="${bodyH}" rx="8" fill="${look.shirt}" stroke="${INK}" ${S(3)}/>
    ${arms}
    ${head}
  </g>`;
}

function kite(x: number, y: number, scale = 1, rot = 0): string {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})">
    <path d="M0 -26 L20 0 L0 30 L-20 0 Z" fill="${MUSTARD}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
    <line x1="0" y1="-26" x2="0" y2="30" stroke="${INK}" ${S(2)}/>
    <path d="M0 30 q-8 8 -2 14 M0 30 q8 8 4 16" stroke="${RUST}" ${S(3)} fill="none" stroke-linecap="round"/>
    <circle cx="-2" cy="42" r="4" fill="${RUST}" stroke="${INK}" ${S(2)}/>
    <circle cx="4" cy="48" r="4" fill="${TEAL}" stroke="${INK}" ${S(2)}/>
  </g>`;
}

function stringTo(x1: number, y1: number, x2: number, y2: number): string {
  return `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - 12} ${x2} ${y2}" stroke="${INK}" ${S(2)} fill="none"/>`;
}

function windSwirl(x: number, y: number, scale = 1): string {
  return `<path transform="translate(${x} ${y}) scale(${scale})" d="M0 0 q14 -12 26 0 q10 10 22 0 M6 8 q10 -8 20 0" stroke="${INK2}" ${S(3)} fill="none" stroke-linecap="round"/>`;
}

function puddle(x: number, y: number, rx = 60, ry = 14): string {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${TEALSOFT}" stroke="${INK}" ${S(3)}/>
    <path d="M${x - rx * 0.5} ${y - 2} q8 -5 16 0 M${x + 10} ${y + 3} q6 -4 12 0" stroke="${CREAM}" ${S(2.5)} fill="none" stroke-linecap="round"/>`;
}

function paperBoat(x: number, y: number, scale = 1, tilt = 0): string {
  return `<g transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale})">
    <path d="M-30 0 L0 -22 L30 0 L18 12 L-18 12 Z" fill="${CREAM}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
    <path d="M0 -22 L0 0 M-30 0 L30 0" stroke="${INK}" ${S(2)}/>
    <line x1="-12" y1="-8" x2="6" y2="-8" stroke="${TEALSOFT}" ${S(2)} stroke-linecap="round"/>
    <line x1="-4" y1="-2" x2="14" y2="-2" stroke="${TEALSOFT}" ${S(2)} stroke-linecap="round"/>
  </g>`;
}

function rainHat(x: number, y: number): string {
  return `<path d="M${x - 15} ${y} a15 15 0 0 1 30 0 z" fill="${MUSTARD}" stroke="${INK}" ${S(3)}/>
    <path d="M${x - 24} ${y} h48" stroke="${MUSTARD}" stroke-width="7" stroke-linecap="round"/>
    <path d="M${x - 24} ${y} h48" stroke="${INK}" ${S(2)} stroke-linecap="round" fill="none"/>`;
}

function birdhouse(x: number, y: number, rot = 0, roofColor = RUST): string {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <rect x="-20" y="-24" width="40" height="40" fill="${WOOD}" stroke="${INK}" ${S(3)}/>
    <path d="M-26 -24 L0 -46 L26 -24 Z" fill="${roofColor}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
    <circle cx="0" cy="-8" r="7" fill="${INK}"/>
    <line x1="0" y1="1" x2="0" y2="7" stroke="${INK}" ${S(3)}/>
    <rect x="-4" y="16" width="8" height="10" fill="${WOOD2}" stroke="${INK}" ${S(2.5)}/>
  </g>`;
}

function bird(x: number, y: number, scale = 1, flip = false): string {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})">
    <path d="M-14 0 q4 -12 16 -10 q10 1 10 10 q10 2 8 8 q-16 6 -30 2 q-8 -2 -4 -10 z" fill="${TEAL}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
    <path d="M-14 0 q-8 -4 -14 -2 q4 6 12 6 z" fill="${TEAL}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
    <circle cx="8" cy="-8" r="5.5" fill="${TEAL}" stroke="${INK}" ${S(3)}/>
    <path d="M12 -9 l8 2 -8 2 z" fill="${MUSTARD}" stroke="${INK}" ${S(2)}/>
    <circle cx="9" cy="-9.5" r="1.3" fill="${INK}"/>
    <path d="M2 -4 l8 4 -8 2 z" fill="${RUST}" stroke="${INK}" ${S(2)} stroke-linejoin="round"/>
    <line x1="6" y1="10" x2="6" y2="14" stroke="${INK}" ${S(2.5)} stroke-linecap="round"/>
    <line x1="12" y1="10" x2="12" y2="14" stroke="${INK}" ${S(2.5)} stroke-linecap="round"/>
  </g>`;
}

function chick(x: number, y: number): string {
  return `<g transform="translate(${x} ${y})">
    <circle cx="0" cy="0" r="8" fill="${MUSTARD}" stroke="${INK}" ${S(2.5)}/>
    <circle cx="4" cy="-8" r="5" fill="${MUSTARD}" stroke="${INK}" ${S(2.5)}/>
    <path d="M8 -8 l5 1.5 -5 2 z" fill="${RUST}" stroke="${INK}" ${S(1.5)}/>
    <circle cx="5" cy="-9" r="1" fill="${INK}"/>
    <path d="M-2 8 v4 M3 8 v4" stroke="${RUST}" ${S(2)} stroke-linecap="round"/>
    <path d="M0 0 q6 -1 6 4 M0 0 q-6 -1 -6 4" stroke="${MUSTARD}" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>`;
}

function wateringCan(x: number, y: number, scale = 1, tilt = 0): string {
  return `<g transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale})">
    <path d="M-16 -8 h28 v18 q0 6 -6 6 h-16 q-6 0 -6 -6 z" fill="${TEAL}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
    <path d="M-16 -8 q-4 -12 8 -14 l4 6" fill="none" stroke="${INK}" ${S(3)} stroke-linecap="round"/>
    <path d="M12 -2 q16 -4 20 -16 M12 2 q18 0 24 -8" stroke="${INK}" ${S(3)} fill="none" stroke-linecap="round"/>
    <path d="M30 -20 l3 -6 M33 -14 l6 -3 M35 -9 l7 0" stroke="${TEALSOFT}" ${S(2.5)} stroke-linecap="round"/>
  </g>`;
}

function pot(x: number, y: number, scale = 1): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M-16 0 h32 l-4 22 h-24 z" fill="${RUST}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
    <rect x="-19" y="-5" width="38" height="7" rx="3" fill="${RUST2}" stroke="${INK}" ${S(3)}/>
  </g>`;
}

function sproutLeaves(x: number, y: number, scale = 1): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <line x1="0" y1="0" x2="0" y2="-12" stroke="${LEAF}" ${S(4)} stroke-linecap="round"/>
    <path d="M0 -12 q-12 -4 -12 -14 q12 0 12 14 z" fill="${LEAF2}" stroke="${INK}" ${S(2.5)}/>
    <path d="M0 -12 q12 -4 12 -14 q-12 0 -12 14 z" fill="${LEAF2}" stroke="${INK}" ${S(2.5)}/>
  </g>`;
}

function vine(x: number, groundY: number, h: number, toms = 0): string {
  let tomatoes = '';
  for (let i = 0; i < toms; i++) {
    const ty = groundY - 18 - i * 26;
    const tx = x + (i % 2 === 0 ? 16 : -14);
    tomatoes += `<circle cx="${tx}" cy="${ty + 10}" r="9" fill="${RUST}" stroke="${INK}" ${S(3)}/>
      <path d="M${tx} ${ty} l0 -5 M${tx} ${ty - 2} l-5 -3 M${tx} ${ty - 2} l5 -3" stroke="${LEAF}" ${S(2.5)} stroke-linecap="round"/>`;
  }
  return `<path d="M${x} ${groundY} q-14 ${-h * 0.3} 6 ${-h * 0.55} q14 ${-h * 0.2} -4 ${-h * 0.45}" stroke="${LEAF}" ${S(4)} fill="none" stroke-linecap="round"/>
    <path d="M${x - 4} ${groundY - h * 0.3} q-10 -2 -12 -12 q10 0 12 12 z M${x + 2} ${groundY - h * 0.62} q10 -2 12 -12 q-10 0 -12 12 z" fill="${LEAF2}" stroke="${INK}" ${S(2)}/>
    ${tomatoes}`;
}

function stake(x: number, groundY: number, h: number): string {
  return `<line x1="${x}" y1="${groundY}" x2="${x}" y2="${groundY - h}" stroke="${WOOD2}" ${S(5)} stroke-linecap="round"/>
    <path d="M${x} ${groundY - h + 10} q-12 -2 -14 -12 M${x} ${groundY - h + 10} q12 -2 14 -12" stroke="${INK2}" ${S(2.5)} fill="none" stroke-linecap="round"/>`;
}

function tomatoBasket(x: number, y: number): string {
  return `<g transform="translate(${x} ${y})">
    <path d="M-20 0 h40 l-5 16 h-30 z" fill="${WOOD}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
    <path d="M-20 0 h40" stroke="${WOOD2}" ${S(3)} stroke-linecap="round"/>
    <circle cx="-9" cy="-4" r="8" fill="${RUST}" stroke="${INK}" ${S(2.5)}/>
    <circle cx="6" cy="-6" r="8" fill="${RUST}" stroke="${INK}" ${S(2.5)}/>
    <circle cx="14" cy="0" r="7" fill="${RUST}" stroke="${INK}" ${S(2.5)}/>
    <path d="M6 -14 l0 -4 M6 -16 l-4 -3 M6 -16 l4 -3" stroke="${LEAF}" ${S(2.5)} stroke-linecap="round"/>
  </g>`;
}

function windowFrame(x: number, y: number, w: number, h: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${SKY_STORM}" stroke="${INK}" ${S(4)}/>
    <line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="${INK}" ${S(3)}/>
    <line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" stroke="${INK}" ${S(3)}/>
    <rect x="${x - 6}" y="${y + h}" width="${w + 12}" height="8" fill="${WOOD}" stroke="${INK}" ${S(3)}/>`;
}

function moon(x: number, y: number, r = 18): string {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${CREAM}" stroke="${INK}" ${S(3)}/>
    <circle cx="${x + 7}" cy="${y - 5}" r="${r}" fill="${SKY_NIGHT}"/>`;
}

function stars(pts: Array<[number, number]>): string {
  return pts
    .map(([x, y]) => `<path d="M${x} ${y - 4} l1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2 z" fill="${MUSTARD}"/>`)
    .join('');
}

function lampGlow(x: number, y: number): string {
  return `<circle cx="${x}" cy="${y}" r="46" fill="${MUSTARD}" opacity="0.22"/>
    <circle cx="${x}" cy="${y}" r="28" fill="${MUSTARD}" opacity="0.25"/>`;
}

function lantern(x: number, y: number): string {
  return `<rect x="-9" y="-12" width="18" height="24" rx="4" fill="${MUSTARD}" stroke="${INK}" ${S(3)}/>
    <path d="M-9 -6 h18 M-9 6 h18" stroke="${INK}" ${S(2)}/>
    <line x1="0" y1="-12" x2="0" y2="-20" stroke="${INK}" ${S(3)}/>
    <path d="M-5 -20 h10" stroke="${INK}" ${S(3)} stroke-linecap="round"/>`;
}

function sofa(x: number, y: number): string {
  return `<path d="M${x - 44} ${y - 16} q-8 -20 10 -20 h68 q18 0 10 20 l4 16 q2 8 -8 8 h-76 q-10 0 -8 -8 z" fill="${TEAL}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
    <rect x="${x - 50}" y="${y}" width="100" height="12" rx="4" fill="${WOOD2}" stroke="${INK}" ${S(3)}/>`;
}

function sideTable(x: number, y: number): string {
  return `<rect x="${x - 16}" y="${y - 12}" width="32" height="6" fill="${WOOD}" stroke="${INK}" ${S(3)}/>
    <line x1="${x - 12}" y1="${y - 6}" x2="${x - 12}" y2="${y}" stroke="${INK}" ${S(3)}/>
    <line x1="${x + 12}" y1="${y - 6}" x2="${x + 12}" y2="${y}" stroke="${INK}" ${S(3)}/>`;
}

function floorLamp(x: number, y: number, on: boolean): string {
  return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 74}" stroke="${INK}" ${S(4)} stroke-linecap="round"/>
    <path d="M${x - 18} ${y - 74} l18 -16 l18 16 z" fill="${on ? MUSTARD : TEALSOFT}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
    ${on ? lampGlow(x, y - 60) : ''}`;
}

function bookOpen(x: number, y: number, tilt = 0): string {
  return `<g transform="translate(${x} ${y}) rotate(${tilt})">
    <path d="M-16 0 q-8 -6 -14 -2 v10 q6 -4 14 2 z" fill="${CREAM}" stroke="${INK}" ${S(2.5)} stroke-linejoin="round"/>
    <path d="M16 0 q8 -6 14 -2 v10 q-6 -4 -14 2 z" fill="${CREAM}" stroke="${INK}" ${S(2.5)} stroke-linejoin="round"/>
    <rect x="-16" y="-2" width="32" height="10" rx="2" fill="${PAPER}" stroke="${INK}" ${S(2.5)}/>
    <path d="M-10 1 h8 M-10 4 h6 M4 1 h8 M4 4 h6" stroke="${INK2}" ${S(1.5)}/>
  </g>`;
}

function ladder(x: number, baseY: number, topY: number): string {
  const steps = 4;
  let rungs = '';
  for (let i = 1; i <= steps; i++) {
    const y = baseY - ((baseY - topY) * i) / (steps + 1);
    rungs += `<line x1="${x - 14}" y1="${y}" x2="${x + 14}" y2="${y}" stroke="${WOOD2}" ${S(4)}/>`;
  }
  return `<line x1="${x - 14}" y1="${baseY}" x2="${x - 6}" y2="${topY}" stroke="${WOOD}" ${S(5)} stroke-linecap="round"/>
    <line x1="${x + 14}" y1="${baseY}" x2="${x + 6}" y2="${topY}" stroke="${WOOD}" ${S(5)} stroke-linecap="round"/>
    ${rungs}`;
}

function workbench(x: number, y: number, w = 90): string {
  return `<rect x="${x - w / 2}" y="${y - 10}" width="${w}" height="8" fill="${WOOD}" stroke="${INK}" ${S(3)}/>
    <line x1="${x - w / 2 + 8}" y1="${y - 2}" x2="${x - w / 2 + 8}" y2="${y + 16}" stroke="${WOOD2}" ${S(5)}/>
    <line x1="${x + w / 2 - 8}" y1="${y - 2}" x2="${x + w / 2 - 8}" y2="${y + 16}" stroke="${WOOD2}" ${S(5)}/>`;
}

function seedPacket(x: number, y: number, rot = 0): string {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <rect x="-14" y="-18" width="28" height="36" rx="2" fill="${CREAM}" stroke="${INK}" ${S(3)}/>
    <circle cx="0" cy="-6" r="7" fill="${RUST}" stroke="${INK}" ${S(2.5)}/>
    <path d="M-8 10 h16 M-8 14 h10" stroke="${INK2}" ${S(2)}/>
  </g>`;
}

function rainbow(x: number, y: number, scale = 1): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke-linecap="round">
    <path d="M-50 0 a50 50 0 0 1 100 0" stroke="${RUST}" ${S(6)}/>
    <path d="M-38 0 a38 38 0 0 1 76 0" stroke="${MUSTARD}" ${S(6)}/>
    <path d="M-26 0 a26 26 0 0 1 52 0" stroke="${LEAF2}" ${S(6)}/>
  </g>`;
}

function houseSilhouette(x: number, y: number): string {
  return `<path d="M${x} ${y} v-34 l26 -18 l26 18 v34 z M${x + 12} ${y} v-14 h12 v14" fill="${CREAM}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
    <rect x="${x + 15}" y="${y - 30}" width="10" height="10" fill="${MUSTARD}" stroke="${INK}" ${S(2.5)}/>`;
}

function leafFly(x: number, y: number, rot = 0): string {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <path d="M0 0 q10 -8 16 0 q-10 8 -16 0 z" fill="${LEAF2}" stroke="${INK}" ${S(2)}/>
    <path d="M0 0 l16 0" stroke="${INK}" ${S(1.2)}/>
  </g>`;
}

// ---------------------------------------------------------------------------
// Scenes (26 frames + shelf covers reuse)
// ---------------------------------------------------------------------------

function frame(inner: string): string {
  return `${inner}<rect x="1.5" y="1.5" width="397" height="247" fill="none" stroke="${INK}" ${S(3)}/>`;
}

// --- Story 1: rainy-kite ---

function sceneKiteBuild(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${sun(340, 52)}
    ${cloud(90, 60, 0.8)}
    ${ground()}
    ${tree(52, 208, 0.8, 'full')}
    ${workbench(250, 176, 120)}
    ${kite(250, 140, 1.1, -6)}
    ${kid(178, 208, MIA, 'reach')}
    <path d="M330 150 q10 -8 20 0 M338 160 q8 -6 16 0" stroke="${INK2}" ${S(2.5)} fill="none" stroke-linecap="round"/>
    <rect x="286" y="158" width="34" height="12" rx="3" fill="${TEALSOFT}" stroke="${INK}" ${S(2.5)}/>
    <circle cx="292" cy="152" r="4" fill="${MUSTARD}" stroke="${INK}" ${S(2)}/>
  `);
}

function sceneWindRises(): string {
  return frame(`
    ${sky(SKY_CLOUD)}
    ${cloud(70, 52, 1)}
    ${cloud(230, 44, 0.8, TEALPALE)}
    ${cloud(340, 74, 0.7)}
    ${ground()}
    ${tree(60, 208, 0.85, 'full')}
    ${windSwirl(150, 80)}
    ${windSwirl(255, 120, 0.8)}
    ${leafFly(200, 60, -20)}
    ${leafFly(300, 88, 30)}
    ${kid(240, 208, MIA, 'arms-up')}
    ${kite(120, 110, 0.7, 24)}
    ${stringTo(120, 140, 236, 150)}
  `);
}

function sceneKiteFlies(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${sun(52, 48)}
    ${cloud(300, 60, 0.7)}
    ${ground()}
    ${tree(348, 208, 0.7, 'full')}
    ${kid(200, 208, MIA, 'run')}
    ${kite(120, 74, 1, -10)}
    ${stringTo(132, 104, 206, 148)}
    ${windSwirl(260, 84, 0.7)}
  `);
}

function sceneRainStarts(): string {
  return frame(`
    ${sky(SKY_STORM)}
    ${stormCloud(120, 54, 1.15)}
    ${stormCloud(300, 70, 0.9)}
    ${rainField(30, 380, 86, 160)}
    ${ground()}
    ${tree(352, 208, 0.75, 'full')}
    ${kid(210, 208, MIA, 'stand')}
    ${kite(96, 118, 0.8, 58)}
    ${stringTo(110, 146, 206, 148)}
    <path d="M180 170 q6 8 0 16 M196 176 q6 8 0 16" stroke="${TEALSOFT}" ${S(3)} fill="none" stroke-linecap="round"/>
  `);
}

function sceneRunHome(): string {
  return frame(`
    ${sky(SKY_STORM)}
    ${stormCloud(280, 48, 1)}
    ${rainField(20, 300, 76, 190, 16)}
    ${ground()}
    ${houseSilhouette(286, 208)}
    ${puddle(140, 224, 44, 10)}
    ${puddle(60, 232, 30, 7)}
    ${kid(120, 208, MIA, 'run', true)}
    ${kite(158, 168, 0.55, 64)}
  `);
}

// --- Story 2: birdhouse ---

function sceneEmptyHouse(): string {
  return frame(`
    ${sky(SKY_CLOUD)}
    ${cloud(300, 52, 0.85, TEALPALE)}
    ${snowField()}
    ${tree(220, 208, 1, 'bare')}
    ${birdhouse(220, 128, -4, TEALPALE)}
    ${bird(80, 190, 0.9, true)}
    <path d="M80 204 q-4 6 0 12 M84 204 q-4 6 0 12" stroke="${INK}" ${S(2)} fill="none" stroke-linecap="round"/>
  `);
}

function snowField(): string {
  return `<path d="M0 208 Q100 200 200 208 T400 204 L400 250 L0 250 Z" fill="${TEALPALE}" stroke="${INK}" ${S(3)}/>
    <path d="M40 226 l4 -8 M44 226 l3 -5 M300 234 l4 -8 M304 234 l3 -5" stroke="${CREAM}" ${S(2.5)} stroke-linecap="round"/>`;
}

function sceneCleanHouse(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${sun(342, 50)}
    ${ground()}
    ${workbench(260, 178, 110)}
    ${birdhouse(262, 150, -2)}
    ${kid(180, 208, SAM, 'reach')}
    <path d="M236 166 l14 -14 M244 174 l14 -14" stroke="${WOOD2}" ${S(4)} stroke-linecap="round"/>
    <path d="M296 160 q6 -2 10 2 M300 168 q5 -2 8 1" stroke="${INK2}" ${S(2)} fill="none" stroke-linecap="round"/>
    <circle cx="304" cy="176" r="5" fill="${MUSTARD}" stroke="${INK}" ${S(2)}/>
  `);
}

function sceneHangHouse(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${sun(50, 46)}
    ${cloud(320, 58, 0.7)}
    ${ground()}
    ${tree(230, 208, 1.05, 'bud')}
    ${ladder(140, 208, 92)}
    ${birdhouse(230, 122, 3)}
    ${kid(140, 92 + 26, SAM, 'reach')}
    <path d="M240 96 q8 10 18 6" stroke="${INK}" ${S(2)} fill="none" stroke-linecap="round"/>
  `);
}

function sceneBirdInspects(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${cloud(90, 50, 0.8)}
    ${sun(348, 48)}
    ${ground()}
    ${tree(230, 208, 1.05, 'full')}
    ${birdhouse(230, 122, 0)}
    ${bird(230, 96, 1.15)}
    <path d="M258 120 q10 -8 20 -4 M266 130 q8 -6 16 -3" stroke="${INK2}" ${S(2.5)} fill="none" stroke-linecap="round"/>
    ${windSwirl(320, 150, 0.6)}
  `);
}

function sceneNestChicks(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${sun(54, 46)}
    ${cloud(320, 56, 0.75)}
    ${ground()}
    ${tree(230, 208, 1.05, 'full')}
    ${birdhouse(230, 122, 0)}
    ${chick(224, 112)}
    ${chick(238, 110)}
    ${bird(300, 168, 1, true)}
    <path d="M262 118 q8 -6 16 -2 M266 126 q7 -5 14 -2" stroke="${INK2}" ${S(2)} fill="none" stroke-linecap="round"/>
    <path d="M296 186 q-3 6 0 12" stroke="${INK}" ${S(2)} fill="none" stroke-linecap="round"/>
  `);
}

// --- Story 3: tiny-seed ---

function sceneSeedPacket(): string {
  return frame(`
    ${kitchenBack()}
    ${kid(210, 208, ANA, 'stand')}
    ${seedPacket(252, 168, -8)}
    ${seedPacket(288, 172, 10)}
    <rect x="150" y="120" width="120" height="8" rx="3" fill="${WOOD}" stroke="${INK}" ${S(3)}/>
    <line x1="158" y1="128" x2="158" y2="208" stroke="${WOOD2}" ${S(5)} stroke-linecap="round"/>
    <line x1="262" y1="128" x2="262" y2="208" stroke="${WOOD2}" ${S(5)} stroke-linecap="round"/>
    <circle cx="176" cy="108" r="4" fill="${RUST}" stroke="${INK}" ${S(2)}/>
    <circle cx="188" cy="104" r="3" fill="${MUSTARD}" stroke="${INK}" ${S(2)}/>
  `);
}

function kitchenBack(): string {
  return `${sky(PAPER2)}
    <rect x="30" y="30" width="90" height="70" rx="3" fill="${TEALPALE}" stroke="${INK}" ${S(3)}/>
    <line x1="75" y1="30" x2="75" y2="100" stroke="${INK}" ${S(2.5)}/>
    <line x1="30" y1="65" x2="120" y2="65" stroke="${INK}" ${S(2.5)}/>
    <rect x="280" y="26" width="92" height="58" rx="3" fill="${CREAM}" stroke="${INK}" ${S(3)}/>
    <line x1="280" y1="55" x2="372" y2="55" stroke="${INK}" ${S(2.5)}/>
    <circle cx="326" cy="41" r="7" fill="${MUSTARD}" stroke="${INK}" ${S(2)}/>
    <path d="M0 208 L400 208 L400 250 L0 250 Z" fill="${WOOD}" stroke="${INK}" ${S(3)}/>
    <path d="M40 228 h60 M180 236 h80 M300 224 h60" stroke="${WOOD2}" ${S(3)} stroke-linecap="round"/>`;
}

function scenePlantSeed(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${sun(48, 46)}
    ${ground()}
    ${kid(190, 208, ANA, 'kneel')}
    ${pot(240, 196, 1.1)}
    <path d="M252 196 q10 -18 26 -12" stroke="${INK}" ${S(3)} fill="none" stroke-linecap="round"/>
    <circle cx="282" cy="182" r="4" fill="${RUST}" stroke="${INK}" ${S(2)}/>
    <path d="M156 190 l18 -6 M162 198 l18 -6" stroke="${WOOD2}" ${S(4)} stroke-linecap="round"/>
  `);
}

function sceneWaterCan(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${sun(50, 44)}
    ${cloud(330, 56, 0.7)}
    ${ground()}
    ${kid(180, 208, ANA, 'stand')}
    ${wateringCan(240, 180, 1.1, -18)}
    ${pot(256, 200, 0.9)}
    ${sproutNotYet()}
  `);
}

function sproutNotYet(): string {
  return `<path d="M256 200 l0 -6" stroke="${LEAF}" ${S(3)} stroke-linecap="round"/>`;
}

function sceneSprout(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${sun(56, 46, 24)}
    ${cloud(320, 54, 0.75)}
    ${ground()}
    ${kid(160, 208, ANA, 'kneel')}
    ${pot(258, 198, 1.15)}
    ${sproutLeaves(258, 192, 1.5)}
    ${windSwirl(120, 110, 0.7)}
  `);
}

function sceneStakeTie(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${sun(48, 44)}
    ${cloud(90, 60, 0.7, TEALPALE)}
    ${ground()}
    ${kid(150, 208, ANA, 'reach')}
    ${stake(238, 206, 96)}
    ${vine(224, 206, 92)}
    <path d="M246 130 q10 -2 12 -10 M240 156 q10 -2 12 -10" stroke="${INK}" ${S(2.5)} fill="none" stroke-linecap="round"/>
  `);
}

function sceneRipeTomato(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${sun(52, 46)}
    ${cloud(330, 52, 0.7)}
    ${ground()}
    ${kid(150, 208, ANA, 'stand')}
    ${stake(240, 206, 110)}
    ${vine(226, 206, 108, 3)}
    ${tomatoBasket(320, 206)}
  `);
}

// --- Story 4: night-lights ---

function sceneEveningRead(): string {
  return frame(`
    ${livingRoom(true)}
    ${kid(180, 208, BEN, 'sit')}
    ${sofa(180, 196)}
    ${bookOpen(180, 168)}
    ${sideTable(268, 208)}
    ${floorLamp(268, 196, true)}
  `);
}

function livingRoom(lit: boolean): string {
  const wall = lit ? PAPER2 : '#5A6258';
  const floor = lit ? WOOD : '#4E4438';
  return `<rect x="0" y="0" width="400" height="250" fill="${wall}"/>
    ${windowFrame(48, 40, 86, 66)}
    ${stars([[66, 56], [92, 62], [112, 84]])}
    <rect x="252" y="42" width="100" height="64" fill="${lit ? TEALPALE : '#3E4A44'}" stroke="${INK}" ${S(3)}/>
    <path d="M252 74 h100" stroke="${INK}" ${S(2.5)}/>
    ${lit ? `<path d="M268 88 h34 M268 96 h22" stroke="${INK2}" ${S(2)}/>` : ''}
    <path d="M0 208 L400 208 L400 250 L0 250 Z" fill="${floor}" stroke="${INK}" ${S(3)}/>
    <path d="M60 226 h70 M240 232 h80" stroke="${lit ? WOOD2 : '#5C5142'}" ${S(3)} stroke-linecap="round"/>`;
}

function sceneStormWindow(): string {
  return frame(`
    <rect x="0" y="0" width="400" height="250" fill="#44525B"/>
    ${windowFrame(140, 36, 120, 120)}
    ${stormCloud(172, 80, 0.9)}
    ${stormCloud(240, 100, 0.7)}
    ${rainField(150, 260, 120, 148, 14)}
    <path d="M188 156 q-8 26 2 40" stroke="${WOOD2}" ${S(6)} fill="none" stroke-linecap="round"/>
    <ellipse cx="196" cy="176" rx="16" ry="22" fill="none" stroke="${LEAF}" ${S(4)}/>
    ${lightning(300, 70)}
    <path d="M0 208 L400 208 L400 250 L0 250 Z" fill="#3B4750" stroke="${INK}" ${S(3)}/>
  `);
}

function lightning(x: number, y: number): string {
  return `<path d="M${x} ${y} l-10 22 h12 l-14 30" stroke="${MUSTARD}" ${S(5)} fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
}

function sceneLightsOut(): string {
  return frame(`
    <rect x="0" y="0" width="400" height="250" fill="#2A3330"/>
    ${stars([[60, 50], [96, 84], [340, 46], [368, 90], [52, 140], [352, 148]])}
    ${moon(330, 66, 20)}
    ${windowFrame(40, 42, 96, 72)}
    ${lampGlow(190, 130)}
    <g transform="translate(190 140)">
      ${lantern(0, 0)}
    </g>
    <path d="M150 118 q-30 -8 -36 -30 M230 118 q30 -8 36 -30" stroke="${INK}" ${S(3)} fill="none" stroke-linecap="round" opacity="0.55"/>
    <path d="M0 208 L400 208 L400 250 L0 250 Z" fill="#232B28" stroke="${INK}" ${S(3)}/>
    ${kid(292, 208, BEN, 'kneel')}
  `);
}

function sceneMorningLine(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${sun(336, 54)}
    ${cloud(80, 56, 0.8)}
    ${ground()}
    ${houseSilhouette(60, 208)}
    ${windowFrame(84, 140, 56, 44)}
    <path d="M96 196 q6 -8 14 -4 M108 190 q6 -6 12 -2" stroke="${MUSTARD}" ${S(3)} fill="none" stroke-linecap="round"/>
    ${kid(240, 208, BEN, 'arms-up')}
    ${windSwirl(320, 150, 0.7)}
    <path d="M340 188 q8 6 2 14 M352 184 q8 6 2 14" stroke="${TEALSOFT}" ${S(2.5)} fill="none" stroke-linecap="round"/>
  `);
}

// --- Story 5: paper-boat ---

function sceneFoldBoat(): string {
  return frame(`
    ${sky(SKY_CLOUD)}
    ${cloud(80, 54, 0.9)}
    ${cloud(320, 46, 0.7, TEALPALE)}
    ${ground()}
    ${workbench(250, 178, 120)}
    ${paperBoat(262, 158, 0.9)}
    <path d="M206 168 q14 -10 24 -2 M210 178 q10 -8 18 -1" stroke="${INK2}" ${S(2.5)} fill="none" stroke-linecap="round"/>
    ${kid(172, 208, BEN, 'reach')}
    <rect x="296" y="162" width="42" height="10" rx="3" fill="${CREAM}" stroke="${INK}" ${S(2.5)}/>
    <path d="M300 166 h32 M302 170 h20" stroke="${INK2}" ${S(1.6)}/>
  `);
}

function sceneRainPuddle(): string {
  return frame(`
    ${sky(SKY_STORM)}
    ${stormCloud(130, 50, 1.1)}
    ${stormCloud(310, 66, 0.85)}
    ${rainField(30, 380, 84, 176)}
    ${ground()}
    ${houseSilhouette(318, 208)}
    <rect x="347" y="178" width="26" height="30" fill="${WOOD}" stroke="${INK}" ${S(2.5)}/>
    ${puddle(150, 228, 88, 13)}
    ${kid(236, 208, BEN, 'stand')}
    ${rainHat(236, 132)}
  `);
}

function sceneFloatBoat(): string {
  return frame(`
    ${sky(SKY_STORM)}
    ${stormCloud(110, 46, 0.95)}
    ${stormCloud(300, 62, 0.7)}
    ${rainField(40, 240, 78, 140, 22)}
    ${ground()}
    ${puddle(180, 228, 120, 16)}
    ${paperBoat(180, 222, 1.1)}
    <path d="M120 224 q10 -5 20 0 M230 230 q8 -4 16 0" stroke="${CREAM}" ${S(2.5)} fill="none" stroke-linecap="round"/>
    ${kid(304, 208, BEN, 'kneel')}
    ${rainHat(304, 132)}
  `);
}

function sceneWindWave(): string {
  return frame(`
    ${sky(SKY_STORM)}
    ${stormCloud(280, 44, 1)}
    ${rainField(30, 200, 74, 120, 20)}
    ${ground()}
    ${puddle(170, 228, 124, 16)}
    ${paperBoat(178, 216, 1.1, 18)}
    <path d="M96 226 q14 -10 28 0 M236 232 q12 -8 24 0" stroke="${TEALSOFT}" ${S(3)} fill="none" stroke-linecap="round"/>
    ${windSwirl(96, 150, 1.3)}
    ${windSwirl(300, 120, 0.9)}
    ${leafFly(150, 96, -24)}
    ${leafFly(330, 150, 40)}
    ${kid(320, 208, BEN, 'arms-up')}
    ${rainHat(320, 132)}
  `);
}

function sceneBoatSoggy(): string {
  return frame(`
    ${sky(SKY_STORM)}
    ${stormCloud(120, 50, 1)}
    ${rainField(30, 170, 80, 130, 24)}
    ${ground()}
    ${puddle(130, 230, 74, 12)}
    <g transform="translate(216 190)">
      <path d="M-30 0 L0 -14 L30 0 L16 10 L-16 10 Z" fill="${PAPER3}" stroke="${INK}" ${S(3)} stroke-linejoin="round"/>
      <path d="M-14 -4 q10 6 24 2 M-6 2 q8 5 18 2" stroke="${TEALSOFT}" ${S(2)} fill="none" stroke-linecap="round"/>
      <path d="M-2 -14 l6 6 -8 3" stroke="${INK}" ${S(2)} fill="none"/>
    </g>
    ${kid(232, 208, BEN, 'reach')}
    <path d="M206 176 q-10 -6 -18 -2" stroke="${INK2}" ${S(2.5)} fill="none" stroke-linecap="round"/>
    ${rainHat(232, 132)}
  `);
}

function sceneWindowsillDry(): string {
  return frame(`
    ${sky(SKY_SUN)}
    ${sun(70, 58)}
    ${cloud(300, 54, 0.7)}
    ${rainbow(196, 120, 0.72)}
    ${ground()}
    ${houseSilhouette(196, 208)}
    ${windowFrame(220, 128, 64, 50)}
    <rect x="208" y="180" width="90" height="8" rx="2" fill="${WOOD}" stroke="${INK}" ${S(3)}/>
    ${paperBoat(252, 172, 0.75)}
    <path d="M272 150 q6 -4 10 0 M280 158 q5 -3 8 0" stroke="${MUSTARD}" ${S(2.5)} fill="none" stroke-linecap="round"/>
    ${kid(320, 208, BEN, 'stand')}
    ${windSwirl(352, 150, 0.6)}
  `);
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SCENES: Record<string, () => string> = {
  'kite-build': sceneKiteBuild,
  'wind-rises': sceneWindRises,
  'kite-flies': sceneKiteFlies,
  'rain-starts': sceneRainStarts,
  'run-home': sceneRunHome,
  'empty-house': sceneEmptyHouse,
  'clean-house': sceneCleanHouse,
  'hang-house': sceneHangHouse,
  'bird-inspects': sceneBirdInspects,
  'nest-chicks': sceneNestChicks,
  'seed-packet': sceneSeedPacket,
  'plant-seed': scenePlantSeed,
  'water-can': sceneWaterCan,
  sprout: sceneSprout,
  'stake-tie': sceneStakeTie,
  'ripe-tomato': sceneRipeTomato,
  'evening-read': sceneEveningRead,
  'storm-window': sceneStormWindow,
  'lights-out': sceneLightsOut,
  'morning-line': sceneMorningLine,
  'fold-boat': sceneFoldBoat,
  'rain-puddle': sceneRainPuddle,
  'float-boat': sceneFloatBoat,
  'wind-wave': sceneWindWave,
  'boat-soggy': sceneBoatSoggy,
  'windowsill-dry': sceneWindowsillDry,
};

export function renderScene(sceneId: string): string {
  const fn = SCENES[sceneId];
  if (!fn) {
    // Graceful degradation: an unknown scene renders a blank panel with a
    // question mark plate instead of crashing the storyboard.
    return frame(`${sky(PAPER2)}<circle cx="200" cy="110" r="34" fill="${PAPER3}" stroke="${INK}" ${S(3)}/><path d="M192 106 a8 8 0 1 1 8 8 v4" stroke="${INK}" ${S(3)} fill="none" stroke-linecap="round"/><circle cx="200" cy="122" r="1.6" fill="${INK}"/>`);
  }
  return fn();
}

export function knownScene(sceneId: string): boolean {
  return Object.prototype.hasOwnProperty.call(SCENES, sceneId);
}
