#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// WCAG contrast gate over the design tokens (tokens.css is truth).
// Usage: node scripts/contrast-check.mjs (run from the project root)

import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/tokens.css', import.meta.url), 'utf8');
const tok = (n) => {
  const m = new RegExp('--' + n + ':\\s*(#[0-9A-Fa-f]{6})').exec(css);
  if (!m) throw new Error('token missing: ' + n);
  return m[1];
};
function lum(hex) {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const checks = [
  ['body text --ink on --paper', ratio(tok('ink'), tok('paper')), 7],
  ['secondary --ink-soft on --paper', ratio(tok('ink-soft'), tok('paper')), 4.5],
  ['secondary --ink-soft on --paper-deep (readout/slot notes)', ratio(tok('ink-soft'), tok('paper-deep')), 4.5],
  ['--ink on --paper-raised (ticket)', ratio(tok('ink'), tok('paper-raised')), 7],
  ['--ink-soft on --paper-raised', ratio(tok('ink-soft'), tok('paper-raised')), 4.5],
  ['white on --buoy (primary CTA)', ratio('#FFFFFF', tok('buoy')), 4.5],
  ['white on --buoy-deep (pressed)', ratio('#FFFFFF', tok('buoy-deep')), 4.5],
  ['--signal correct text on --paper-raised', ratio(tok('signal'), tok('paper-raised')), 4.5],
  ['--amber nudge text on --paper-raised', ratio(tok('amber'), tok('paper-raised')), 4.5],
  ['--amber nudge text on --paper', ratio(tok('amber'), tok('paper')), 4.5],
  ['--ink on --paper-deep (tray/slots)', ratio(tok('ink'), tok('paper-deep')), 7],
  ['--ink map label on --land', ratio(tok('ink'), tok('land')), 7]
];

let bad = 0;
for (const [name, r, min] of checks) {
  const ok = r >= min;
  if (!ok) bad++;
  console.log((ok ? '  ✔ ' : '  ✖ ') + name + ': ' + r.toFixed(2) + ':1 (need ' + min + ')');
}
process.exit(bad ? 1 : 0);
