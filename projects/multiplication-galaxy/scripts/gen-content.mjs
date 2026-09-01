#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content generator — emits public/data/galaxies.json + public/data/missions.json
// deterministically (seeded RNG, stable across regenerations). Run after editing
// the curriculum tables below:
//   node scripts/gen-content.mjs
//
// The JSON is the committed source of truth; this script exists so the 66
// missions ship with machine-verified answers, unique 4-option sets and
// consistent copy instead of hand-typed tables.

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Seeded RNG (mulberry32) — same seed ⇒ same content every run.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------- galaxies --
// Flat two-tone planet styles from the locked palette (DESIGN_DECISIONS §4/§9).
const GALAXIES = [
  { table: 2,  name: 'Twin Moons',      copy: 'Every orbit here carries its satellites in pairs — count by 2 and the rings fill in.', planet: ['#4E9B97', '#37716E'] },
  { table: 3,  name: 'Triad Belt',      copy: 'Three to a ring: a loose belt of small worlds that only steadies when you count by 3.', planet: ['#E89A3C', '#C47A1F'] },
  { table: 4,  name: 'Quartet Cluster', copy: 'Four satellites ride each ring — half of eight, twice two, and always an even chart.', planet: ['#8E8AA6', '#6B6785'] },
  { table: 5,  name: 'Pentagraph Sector', copy: 'Five-pointed and handy: rings of five line up with your hands.', planet: ['#F1E8D2', '#B9B09A'] },
  { table: 6,  name: 'Sixfold Crown',   copy: 'Six per ring turns slowly under a steady skip-count — half a dozen, again and again.', planet: ['#C9702E', '#A0521F'] },
  { table: 7,  name: 'Septet Drift',    copy: 'Seven is the first odd drift that feels far away — lock it and the whole chart calms.', planet: ['#7CC4BF', '#4E9B97'] },
  { table: 8,  name: 'Octave Reach',    copy: 'Eight to a ring: double four, and the fastest way is to take a known ring twice.', planet: ['#C47A1F', '#8F5A12'] },
  { table: 9,  name: 'Novena Spiral',   copy: 'Nine sits one shy of ten — build it as a full ring minus one and it stops slipping.', planet: ['#37716E', '#264947'] },
  { table: 10, name: 'Decade Ring',     copy: 'Tens chart themselves: add a ring, add a zero, keep your place.', planet: ['#D9B36A', '#B08F45'] },
  { table: 11, name: 'Hendeca Veil',    copy: 'Eleven plays a trick: up by eleven each ring — until ten rings make it a hundred and ten.', planet: ['#7A7494', '#575170'] },
  { table: 12, name: 'Duodeca Deep',    copy: 'The deep field: twelve to a ring, dozens at a glance — the boss chart of the atlas.', planet: ['#F0B15C', '#C47A1F'] },
];

// Constellation layout: 11 groups along a wide zigzag arc across the plate
// (percent coordinates, deterministic). The arc + zigzag keeps adjacent
// groups separated vertically so hit-areas never stack (critique P1); the
// chart layout only renders ≥1200px, narrower viewports use the grid.
function layout(i, total) {
  const t = total === 1 ? 0 : i / (total - 1);
  const x = 8 + t * 84; // % across the plate
  const y = 50 + Math.sin(t * Math.PI) * 30 + (i % 2 === 0 ? -9 : 9); // arc + zigzag
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

const galaxies = GALAXIES.map((g, i) => ({
  id: `g${g.table}`,
  tableNumber: g.table,
  title: `Table of ${g.table}`,
  constellation: g.name,
  chapterCopy: g.copy,
  constellationLayout: layout(i, GALAXIES.length),
  planetStyle: { base: g.planet[0], band: g.planet[1] },
}));

// ---------------------------------------------------------------- missions --
// Per galaxy n: 6 facts — n×2, n×6, n×9 (array), n×5 missing-ring-count,
// n×7 missing-per-ring, n×12 (array finale). 11 × 6 = 66 missions.
function productDistractors(a, b, answer, rand) {
  const set = new Set([answer]);
  const candidates = [answer + b, answer - b, answer + a, answer - a, answer + 10, answer - 10, a + b, a * (b + 1), a * (b - 1)];
  for (const c of shuffle(candidates, rand)) {
    if (set.size >= 4) break;
    if (c > 0 && c !== answer && !set.has(c)) set.add(c);
  }
  let filler = answer + 2;
  while (set.size < 4) {
    if (filler > 0 && !set.has(filler)) set.add(filler);
    filler += 3;
  }
  return shuffle([...set], rand);
}

function factorDistractors(answer, other, rand) {
  const set = new Set([answer]);
  const candidates = [answer + 1, answer - 1, answer + 2, answer - 2, other, 10, 12, answer * 2];
  for (const c of shuffle(candidates, rand)) {
    if (set.size >= 4) break;
    if (c >= 2 && c <= 12 && c !== answer && !set.has(c)) set.add(c);
  }
  let filler = 2;
  while (set.size < 4) {
    if (!set.has(filler)) set.add(filler);
    filler++;
  }
  return shuffle([...set], rand);
}

function arrayCopy(a, b) {
  return `Read the chart: ${a} rings, ${b} satellites on each. How many satellites in all?`;
}
function missingACopy(b, total) {
  return `${total} satellites ride this system, ${b} to a ring. How many rings does the chart hold?`;
}
function missingBCopy(a, total) {
  return `The system holds ${total} satellites across ${a} equal rings. How many ride each ring?`;
}

const missions = [];
for (const g of GALAXIES) {
  const n = g.table;
  const plan = [
    { factors: [n, 2], rep: 'array', missing: null, difficulty: 1 },
    { factors: [n, 6], rep: 'array', missing: null, difficulty: 1 },
    { factors: [n, 5], rep: 'missingFactor', missing: 'a', difficulty: 2 },
    { factors: [n, 9], rep: 'array', missing: null, difficulty: 2 },
    { factors: [n, 7], rep: 'missingFactor', missing: 'b', difficulty: 3 },
    { factors: [n, 12], rep: 'array', missing: null, difficulty: 3 },
  ];
  plan.forEach((p, i) => {
    const [a, b] = p.factors;
    const answer = a * b;
    const id = `m${n}-${String(i + 1).padStart(2, '0')}`;
    const rand = rng(hash(id));
    const missingFactor = p.missing === 'a' ? a : p.missing === 'b' ? b : null;
    missions.push({
      id,
      galaxyId: `g${n}`,
      factors: [a, b],
      representation: p.rep,
      missing: p.missing,
      // Spec contract: distractors = the full 4-option list, answer included.
      distractors: p.rep === 'array' ? productDistractors(a, b, answer, rand) : factorDistractors(missingFactor, p.missing === 'a' ? b : a, rand),
      answer: p.rep === 'array' ? answer : missingFactor,
      prompt: p.rep === 'array' ? arrayCopy(a, b) : p.missing === 'a' ? missingACopy(b, answer) : missingBCopy(a, answer),
      explanation:
        p.rep === 'array'
          ? `${a} groups of ${b} make ${answer}.`
          : p.missing === 'a'
            ? `${b} satellites on each of ${a} rings make ${answer} — so the chart holds ${a} rings.`
            : `${a} rings of ${b} make ${answer} — each ring carries ${b}.`,
      difficulty: p.difficulty,
    });
  });
}

writeFileSync(resolve(root, 'public/data/galaxies.json'), JSON.stringify({ galaxies }, null, 2) + '\n');
writeFileSync(resolve(root, 'public/data/missions.json'), JSON.stringify({ missions }, null, 2) + '\n');
console.log(`wrote ${galaxies.length} galaxies, ${missions.length} missions → public/data/`);
