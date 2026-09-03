#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless engine test: drives the SAME pure engine the UI uses (no browser)
// across the full data set, all three view layouts, the scale mappings and
// both quiz kinds. Run: npm run test:engine (Node 24 strips TS types natively).

import { readFileSync } from 'node:fs';

const mod = await import('../src/features/atlas/engine.ts');

const {
  validatePlanets,
  byOrder,
  planetById,
  formatNum,
  formatDayHours,
  formatYearDays,
  formatAu,
  earthRadii,
  sphereRadius,
  distanceFraction,
  spinSeconds,
  yearArcFraction,
  logBarFraction,
  layoutCorridor,
  starField,
  seededRandom,
  shuffle,
  buildSortPool,
  gradeSort,
  buildMatchQuestions,
  tableRows,
} = mod;

const raw = JSON.parse(readFileSync(new URL('../public/data/planets.json', import.meta.url), 'utf8'));
let failures = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ✖ ${msg}`);
  }
}

console.log('— data validation');
const { planets, issues } = validatePlanets(raw);
check(planets !== null && issues.length === 0, `planets.json must validate (issues: ${JSON.stringify(issues.slice(0, 4))})`);
check(planets.length === 8, `8 planets expected, got ${planets.length}`);
check(byOrder(planets).every((p, i) => p.order === i + 1), 'orders must be contiguous 1..8');

console.log('— astronomical ground truth');
const jupiter = planetById(planets, 'jupiter');
const mercury = planetById(planets, 'mercury');
const venus = planetById(planets, 'venus');
const neptune = planetById(planets, 'neptune');
const saturn = planetById(planets, 'saturn');
check(jupiter.radiusKm === Math.max(...planets.map((p) => p.radiusKm)), 'Jupiter must be the largest');
check(mercury.radiusKm === Math.min(...planets.map((p) => p.radiusKm)), 'Mercury must be the smallest');
check(venus.dayHours === Math.max(...planets.map((p) => p.dayHours)), 'Venus must have the longest day');
check(jupiter.dayHours === Math.min(...planets.map((p) => p.dayHours)), 'Jupiter must spin fastest');
check(neptune.yearDays === Math.max(...planets.map((p) => p.yearDays)), 'Neptune must have the longest year');
check(mercury.yearDays === Math.min(...planets.map((p) => p.yearDays)), 'Mercury must have the shortest year');
check(neptune.distanceAu === Math.max(...planets.map((p) => p.distanceAu)), 'Neptune must be farthest');
check(mercury.distanceAu === Math.min(...planets.map((p) => p.distanceAu)), 'Mercury must be nearest');
check(saturn.moons === Math.max(...planets.map((p) => p.moons)), 'Saturn must lead the moon count');
check(venus.retrograde === true && planets.find((p) => p.id === 'uranus').retrograde === true, 'Venus and Uranus are retrograde');
check(mercury.distanceAu < 0.5 && neptune.distanceAu > 29, 'distance values are real AU figures');
check(Math.abs(mercury.radiusKm - 2439.7) < 0.1, 'Mercury radius matches NASA fact sheet');

console.log('— formatters');
check(formatNum(69911) === '69,911', `formatNum(69911) → ${formatNum(69911)}`);
check(formatDayHours(5832.5).includes('243 d'), `Venus day formatted with day count → ${formatDayHours(5832.5)}`);
check(formatDayHours(9.9) === '9.9 h', `Jupiter day → ${formatDayHours(9.9)}`);
check(formatYearDays(60190).includes('165 yr'), `Neptune year formatted with year count → ${formatYearDays(60190)}`);
check(formatAu(0.387) === '0.39 AU', `formatAu(0.387) → ${formatAu(0.387)}`);
check(earthRadii(69911) === '11.0× Earth', `earthRadii(69911) → ${earthRadii(69911)}`);

console.log('— scale mappings');
const rJ = sphereRadius(jupiter.radiusKm, 16, 104, planets);
const rM = sphereRadius(mercury.radiusKm, 16, 104, planets);
const rE = sphereRadius(6371, 16, 104, planets);
check(rJ === 104 && rM === 16, `sqrt sphere scale maps extremes to bounds (${rM}..${rJ})`);
check(rJ / rM < 8, `sqrt compression keeps Jupiter/Mercury visually comparable (${(rJ / rM).toFixed(2)}× vs 28.7× true)`);
check(rE > rM && rE < rJ, 'Earth sits between Mercury and Jupiter');
const fracM = distanceFraction(mercury.distanceAu, planets);
const fracN = distanceFraction(neptune.distanceAu, planets);
check(fracM === 0 && fracN === 1, `log AU ruler spans 0..1 (${fracM}..${fracN})`);
for (const p of planets) {
  const s = spinSeconds(p.dayHours);
  check(s >= 6 && s <= 48, `spinSeconds(${p.name}) in readable band: ${s.toFixed(1)}s`);
}
check(spinSeconds(23.9) === 12, `Earth reference spin = 12s (got ${spinSeconds(23.9)})`);
check(spinSeconds(jupiter.dayHours) < spinSeconds(23.9) && spinSeconds(23.9) < spinSeconds(venus.dayHours), 'spin order: Jupiter < Earth < Venus');
check(yearArcFraction(neptune.yearDays, planets) === 1, 'Neptune year arc fills the circle');
check(yearArcFraction(365.2, planets) < 0.02 || yearArcFraction(365.2, planets) === 0.02, 'Earth year arc is honestly tiny');
const bars = planets.map((p) => logBarFraction(p.radiusKm, planets.map((q) => q.radiusKm)));
check(Math.min(...bars) >= 0.02 && Math.max(...bars) <= 1, `log bars within [0.02, 1] (${Math.min(...bars)}..${Math.max(...bars)})`);

console.log('— corridor layouts (1024x648 tablet hero, 1440x784 desktop, 390x640 mobile)');
for (const [w, h] of [[1024, 648], [1440, 784], [390, 640]]) {
  for (const mode of ['distance', 'size', 'time']) {
    const layout = layoutCorridor(planets, mode, w, h);
    const label = `${mode}@${w}x${h}`;
    check(layout.totalWidth >= w, `${label}: totalWidth ${layout.totalWidth} >= view ${w}`);
    check(layout.stations.length === 8, `${label}: 8 stations`);
    const xs = layout.stations.map((s) => s.x);
    check(xs.every((x, i) => i === 0 || x > xs[i - 1]), `${label}: stations ordered left→right`);
    const gaps = xs.slice(1).map((x, i) => x - xs[i]);
    check(Math.min(...gaps) >= 96, `${label}: min station gap ${Math.min(...gaps).toFixed(0)}px >= 96px`);
    const maxSphere = Math.max(...layout.stations.map((s) => Math.max(s.sphereR, s.ringR)));
    check(layout.datumY - maxSphere >= 4, `${label}: spheres fit above datum (datumY ${layout.datumY}, extent ${maxSphere.toFixed(0)})`);
    for (const s of layout.stations) {
      check(s.boxTop + s.boxH <= h + 1, `${label}/${s.id}: station box bottom ${Math.round(s.boxTop + s.boxH)} <= corridor ${h}`);
      check(s.boxW >= 112, `${label}/${s.id}: hit box width ${Math.round(s.boxW)} >= 112px`);
    }
    const last = layout.stations[layout.stations.length - 1];
    check(layout.totalWidth - last.x >= w * 0.4, `${label}: trailing space lets Neptune centre (${(layout.totalWidth - last.x).toFixed(0)}px)`);
  }
}

console.log('— deterministic backdrop + shuffles');
const s1 = starField(20260911, 4000, 700);
const s2 = starField(20260911, 4000, 700);
check(s1.length === s2.length && s1.every((s, i) => s.x === s2[i].x && s.y === s2[i].y), 'starfield deterministic per seed');
check(s1.every((s) => s.x >= 0 && s.x <= 4000 && s.y >= 0 && s.y <= 700), 'stars within bounds');
const sh1 = shuffle([1, 2, 3, 4, 5], seededRandom(7));
const sh2 = shuffle([1, 2, 3, 4, 5], seededRandom(7));
check(JSON.stringify(sh1) === JSON.stringify(sh2), 'seeded shuffle deterministic');
check(new Set(sh1).size === 5, 'shuffle is a permutation');

console.log('— quiz: sort');
const key = byOrder(planets).map((p) => p.id);
const pool = buildSortPool(planets, seededRandom(42));
check(new Set(pool).size === 8 && pool.length === 8, 'sort pool is a permutation of all 8');
const perfect = gradeSort(key, planets);
check(perfect.complete && perfect.correct === 8, 'correct order grades complete');
const swapped = [...key];
[swapped[0], swapped[1]] = [swapped[1], swapped[0]];
const g2 = gradeSort(swapped, planets);
check(g2.correct === 6 && !g2.complete, `one swap → 6 correct (got ${g2.correct})`);
check(g2.settled[2] === true && g2.settled[0] === false, 'settled flags mark exact positions');
const partial = [key[0], null, key[2], null, key[4], null, key[6], null];
const g3 = gradeSort(partial, planets);
check(g3.correct === 4 && !g3.complete, 'partial arrangement counts only settled slots');

console.log('— quiz: match');
const qs = buildMatchQuestions(planets, seededRandom(1));
check(qs.length === 8, `8 record questions (got ${qs.length})`);
for (const q of qs) {
  check(q.choices.length === 4 && new Set(q.choices).size === 4, `${q.id}: four distinct choices`);
  check(q.choices.includes(q.answerId), `${q.id}: answer among choices`);
  check(q.fact.length > 12 && q.fact.includes(q.answerName), `${q.id}: fact names the planet`);
}
const byId = (id) => planetById(planets, id);
check(byId(qs.find((q) => q.id === 'longest-day').answerId).dayHours === venus.dayHours, 'longest-day answer is Venus');
check(byId(qs.find((q) => q.id === 'fastest-spin').answerId).dayHours === jupiter.dayHours, 'fastest-spin answer is Jupiter');
check(byId(qs.find((q) => q.id === 'most-moons').answerId).moons === saturn.moons, 'most-moons answer is Saturn');
check(byId(qs.find((q) => q.id === 'largest').answerId).radiusKm === jupiter.radiusKm, 'largest answer is Jupiter');
check(byId(qs.find((q) => q.id === 'smallest').answerId).radiusKm === mercury.radiusKm, 'smallest answer is Mercury');
check(byId(qs.find((q) => q.id === 'farthest').answerId).distanceAu === neptune.distanceAu, 'farthest answer is Neptune');
check(byId(qs.find((q) => q.id === 'shortest-year').answerId).yearDays === mercury.yearDays, 'shortest-year answer is Mercury');
const qs2 = buildMatchQuestions(planets, seededRandom(1));
check(JSON.stringify(qs.map((q) => q.answerId)) === JSON.stringify(qs2.map((q) => q.answerId)), 'match questions deterministic per seed');

console.log('— text alternative');
const rows = tableRows(planets);
check(rows.length === 8 && rows[0].name === 'Mercury' && rows[7].name === 'Neptune', 'table rows ordered Sun→outwards');

console.log(
  failures === 0
    ? `\n✔ Engine simulation passed — ${checks} checks.`
    : `\n✖ ${failures} of ${checks} checks failed.`,
);
process.exit(failures === 0 ? 0 : 1);
