#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless forge test: simulates every mission through the SAME engine the UI
// uses (no browser). Covers:
//   - the stepper path (keyboard/touch equivalent) solving every mission;
//   - the drag path (direct builds) solving every mission;
//   - invalid builds: wrong element, wrong isotope, wrong charge, electrons in
//     the wrong shell, overfull shells, over-proton, over-neutron;
//   - blocked adds and their teaching copy;
//   - reversibility (remove) and reset-to-empty;
//   - progression unlock rules;
//   - omitted-neutronCount missions accepting every common isotope;
//   - identity/isotope/charge notation and aria summaries.
//
// Usage: npm run test:engine   (from the project dir)

import { readFileSync } from 'node:fs';

const mod = await import('../src/features/forge/engine.ts').catch(() => null);
if (!mod) {
  console.error('engine.ts is TypeScript — run via a TS-aware runner.');
  process.exit(1);
}

const {
  emptyBuild,
  capacityOf,
  electronCount,
  chargeOf,
  massNumberOf,
  greedyConfig,
  isCanonical,
  identify,
  addProton,
  addNeutron,
  addElectron,
  removeProton,
  removeNeutron,
  removeElectron,
  targetOf,
  evaluate,
  isotopeNotation,
  buildSummary,
  isUnlocked,
  missionRowStatus,
  chargeCopy,
  SHELL_CAPACITY,
  MAX_PROTONS,
  MAX_NEUTRONS,
} = mod;

const elementsData = JSON.parse(readFileSync(new URL('../public/data/elements.json', import.meta.url), 'utf8'));
const missionsData = JSON.parse(readFileSync(new URL('../public/data/missions.json', import.meta.url), 'utf8'));
const elements = elementsData.elements;
const missions = missionsData.missions;

let failures = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ✖ ${msg}`);
  }
}

// ---------------------------------------------------------------------------
console.log('Content sanity');
// ---------------------------------------------------------------------------
check(elements.length === 20, 'elements.json covers the first 20 elements');
check(new Set(elements.map((e) => e.atomicNumber)).size === 20, 'atomic numbers are unique');
for (const el of elements) {
  const sum = el.shellModel.reduce((a, b) => a + b, 0);
  check(sum === el.atomicNumber, `${el.symbol}: shellModel sums to Z (${sum} = ${el.atomicNumber})`);
  check(
    el.shellModel.every((n, i) => n <= SHELL_CAPACITY[i] && (i === 0 || el.shellModel[i - 1] === SHELL_CAPACITY[i - 1])),
    `${el.symbol}: shellModel respects 2·8·8·2 and fills inner-first`,
  );
  check(el.commonIsotopes.every((a) => a >= el.atomicNumber), `${el.symbol}: isotope mass numbers ≥ Z`);
}

// ---------------------------------------------------------------------------
console.log('\nSolve every mission — stepper path (keyboard/touch equivalent)');
// ---------------------------------------------------------------------------
let solved = 0;
for (const mission of missions) {
  const target = targetOf(elements, mission);
  const visibleShells = target.config.length;
  let b = emptyBuild();
  while (b.protons < target.element.atomicNumber) b = addProton(b).build;
  while (b.neutrons < target.neutrons) b = addNeutron(b).build;
  // Fill electrons inner-first exactly as the steppers allow.
  for (let i = 0; i < visibleShells; i++) {
    while ((b.shells[i] ?? 0) < target.config[i]) b = addElectron(b, i, visibleShells).build;
  }
  const ev = evaluate(elements, mission, b);
  check(ev.status === 'forged', `${mission.id}: stepper build forges ${target.isotopeNotation} (got ${ev.status}: ${ev.issues.join(' | ')})`);
  check(ev.issues.length === 0, `${mission.id}: forged build has no teaching issues`);
  solved++;
}
check(solved === missions.length, `all ${missions.length} missions solvable via steppers`);

// ---------------------------------------------------------------------------
console.log('\nSolve every mission — drag path (place into any open shell, non-canonical order)');
// ---------------------------------------------------------------------------
for (const mission of missions) {
  const target = targetOf(elements, mission);
  const visibleShells = Math.max(target.config.length, 2);
  let b = { protons: 0, neutrons: 0, shells: [] };
  // Drag electrons into the OUTERMOST shell first — allowed by the engine…
  for (let i = visibleShells - 1; i >= 0; i--) {
    while ((b.shells[i] ?? 0) < target.config[i]) {
      const r = addElectron(b, i, visibleShells);
      check(r.ok, `${mission.id}: drag can place an electron in shell ${i + 1}`);
      b = r.build;
    }
  }
  while (b.protons < target.element.atomicNumber) b = addProton(b).build;
  while (b.neutrons < target.neutrons) b = addNeutron(b).build;
  const ev = evaluate(elements, mission, b);
  check(ev.status === 'forged', `${mission.id}: drag-order build also forges (order-independent placement)`);
}

// ---------------------------------------------------------------------------
console.log('\nInvalid builds must NOT forge (and must teach)');
// ---------------------------------------------------------------------------
{
  const carbon = missions.find((m) => m.id === 'm04-carbon-core');
  const target = targetOf(elements, carbon);

  // Fresh bench: zero teaching issues — the identity readout already says
  // "Empty nucleus — add protons to begin." (no warning box on open).
  const fresh = evaluate(elements, carbon, emptyBuild());
  check(fresh.issues.length === 0, 'empty bench is calm: no teaching issues on a fresh mission');

  // Wrong element: 7 protons = nitrogen.
  let b = emptyBuild();
  for (let i = 0; i < 7; i++) b = addProton(b).build;
  for (let i = 0; i < 6; i++) b = addNeutron(b).build;
  b = addElectron(b, 0, 2).build; b = addElectron(b, 0, 2).build;
  for (let i = 0; i < 5; i++) b = addElectron(b, 1, 2).build;
  let ev = evaluate(elements, carbon, b);
  check(ev.status === 'other-element', '7 protons is other-element, not forged');
  check(ev.identity?.symbol === 'N', '7 protons identify as Nitrogen');
  check(ev.issues.length > 0 && /Nitrogen/.test(ev.issues[0]), 'teaching copy names the actual element');

  // Wrong isotope: right element, wrong neutrons (carbon-14 in the C-12 mission).
  b = emptyBuild();
  for (let i = 0; i < 6; i++) b = addProton(b).build;
  for (let i = 0; i < 8; i++) b = addNeutron(b).build;
  b = addElectron(b, 0, 2).build; b = addElectron(b, 0, 2).build;
  for (let i = 0; i < 4; i++) b = addElectron(b, 1, 2).build;
  ev = evaluate(elements, carbon, b);
  check(ev.status === 'pending', 'right Z + wrong isotope stays pending');
  check(/C-14|C-12|neutrons/.test(ev.issues[0] ?? ''), 'isotope issue explains C-12 vs C-14');

  // Wrong charge (ion mission): neutral sodium does not complete Na+.
  const naIon = missions.find((m) => m.id === 'm09-sodium-cation');
  const t9 = targetOf(elements, naIon);
  b = emptyBuild();
  for (let i = 0; i < 11; i++) b = addProton(b).build;
  for (let i = 0; i < 12; i++) b = addNeutron(b).build;
  const vs = 3;
  b = addElectron(b, 0, vs).build; b = addElectron(b, 0, vs).build;
  for (let i = 0; i < 8; i++) b = addElectron(b, 1, vs).build;
  for (let i = 0; i < 1; i++) b = addElectron(b, 2, vs).build; // 11 electrons = neutral
  ev = evaluate(elements, naIon, b);
  check(ev.status === 'pending', 'neutral sodium ≠ Na⁺ mission');
  check(/Charge is 0/.test(ev.issues[0] ?? ''), 'charge issue states current vs target charge');

  // Non-canonical shells: carbon with [1,5] — counts right, layout wrong.
  b = emptyBuild();
  for (let i = 0; i < 6; i++) b = addProton(b).build;
  for (let i = 0; i < 6; i++) b = addNeutron(b).build;
  b = addElectron(b, 0, 2).build; // shell 1: 1
  for (let i = 0; i < 5; i++) b = addElectron(b, 1, 2).build; // shell 2: 5
  check(!isCanonical(b), '[1,5] detected as non-canonical');
  ev = evaluate(elements, carbon, b);
  check(ev.status === 'pending', '[1,5] carbon does not forge despite right counts');
  check(/inner shells first/.test(ev.issues[0] ?? ''), 'canonical issue teaches inner-first rule');

  // Same total, electrons in a deeper shell: [2,4] vs [2,0,4].
  b = emptyBuild();
  for (let i = 0; i < 6; i++) b = addProton(b).build;
  for (let i = 0; i < 6; i++) b = addNeutron(b).build;
  b = addElectron(b, 0, 3).build; b = addElectron(b, 0, 3).build;
  for (let i = 0; i < 4; i++) b = addElectron(b, 2, 3).build;
  ev = evaluate(elements, carbon, b);
  check(ev.status === 'pending', '[2,0,4] carbon does not forge');

  // Un-masked shell lesson (assessment P2): with wrong neutrons AND wrong
  // charge AND a wrong layout, the inner-first rule must still be visible —
  // it is the game's core mechanic, not the third-priority footnote.
  b = emptyBuild();
  for (let i = 0; i < 6; i++) b = addProton(b).build;
  for (let i = 0; i < 4; i++) b = addNeutron(b).build; // wrong isotope
  b = addElectron(b, 1, 2).build; // shell 2 before shell 1 — non-canonical
  b = addElectron(b, 1, 2).build;
  ev = evaluate(elements, carbon, b);
  check(
    ev.issues.slice(0, 2).some((line) => /inner shells first/.test(line)),
    'inner-first lesson survives alongside wrong-isotope/charge issues: ' + ev.issues.join(' | '),
  );
}

// ---------------------------------------------------------------------------
console.log('\nBlocked adds and ceilings');
// ---------------------------------------------------------------------------
{
  let b = emptyBuild();
  const vs = 4;
  for (let i = 0; i < MAX_PROTONS; i++) b = addProton(b).build;
  const over = addProton(b);
  check(!over.ok && b.protons === MAX_PROTONS, '21st proton blocked at forge ceiling');
  check(/first 20 elements/.test(over.reason), 'proton ceiling copy explains the first-20 rule');

  for (let i = 0; i < MAX_NEUTRONS; i++) b = addNeutron(b).build;
  const overN = addNeutron(b);
  check(!overN.ok && b.neutrons === MAX_NEUTRONS, 'neutron ceiling enforced');

  while ((b.shells[0] ?? 0) < capacityOf(0)) {
    b = addElectron(b, 0, vs).build; // top up shell 1 to 2
  }
  const overE = addElectron(b, 0, vs);
  check(!overE.ok, 'electron over shell capacity blocked');
  check(/full/.test(overE.reason) && /2/.test(overE.reason), 'shell-full copy names the capacity');

  const ghost = addElectron(b, 4, vs);
  check(!ghost.ok, 'shell 5 blocked (simplified model has four shells)');
  const hidden = addElectron(b, 3, 1);
  check(!hidden.ok, 'electron blocked in a shell not on the bench');
  const neg = addElectron(b, -1, vs);
  check(!neg.ok, 'negative shell index rejected');
}

// ---------------------------------------------------------------------------
console.log('\nReversibility');
// ---------------------------------------------------------------------------
{
  let b = emptyBuild();
  const vs = 3;
  for (let i = 0; i < 11; i++) b = addProton(b).build;
  for (let i = 0; i < 12; i++) b = addNeutron(b).build;
  for (let i = 0; i < 2; i++) b = addElectron(b, 0, vs).build;
  for (let i = 0; i < 8; i++) b = addElectron(b, 1, vs).build;
  for (let i = 0; i < 2; i++) b = addElectron(b, 2, vs).build;

  b = removeElectron(b, 2);
  check(b.shells[2] === 1, 'removeElectron decrements the right shell');
  b = removeElectron(b, 2);
  check(b.shells.length === 2, 'trailing empty shells are trimmed');
  b = removeProton(b);
  check(b.protons === 10, 'removeProton decrements');
  b = removeNeutron(b);
  check(b.neutrons === 11, 'removeNeutron decrements');
  // Empty floor: removing below zero is a no-op, never negative.
  let e = emptyBuild();
  e = removeProton(e); e = removeNeutron(e); e = removeElectron(e, 0);
  check(e.protons === 0 && e.neutrons === 0 && e.shells.length === 0, 'removes never go negative');

  // Full round trip: build then strip back to empty.
  let c = emptyBuild();
  for (let i = 0; i < 6; i++) c = addProton(c).build;
  for (let i = 0; i < 6; i++) c = addNeutron(c).build;
  for (let i = 0; i < 2; i++) c = addElectron(c, 0, 2).build;
  for (let i = 0; i < 4; i++) c = addElectron(c, 1, 2).build;
  while (c.protons > 0) c = removeProton(c);
  while (c.neutrons > 0) c = removeNeutron(c);
  while (electronCount(c) > 0) c = removeElectron(c, c.shells.length - 1);
  check(massNumberOf(c) === 0 && chargeOf(c) === 0, 'build strips back to the empty nucleus');
}

// ---------------------------------------------------------------------------
console.log('\nIdentity, notation, summaries');
// ---------------------------------------------------------------------------
{
  check(identify(elements, 6).symbol === 'C', 'identify(6) = Carbon');
  check(identify(elements, 0) === null && identify(elements, 21) === null, 'identify bounds');
  check(isotopeNotation('Na', 23, 0) === '²³Na', 'neutral sodium notation');
  check(isotopeNotation('Na', 23, 1) === '²³Na⁺', 'cation notation');
  check(isotopeNotation('Cl', 35, -1) === '³⁵Cl⁻', 'anion notation');
  check(greedyConfig(0).length === 0 && greedyConfig(2).join() === '2' && greedyConfig(11).join() === '2,8,1' && greedyConfig(20).join() === '2,8,8,2', 'greedy configs');

  const s = buildSummary({ protons: 6, neutrons: 8, shells: [2, 4] }, elements);
  check(/6 protons, 8 neutrons/.test(s) && /Carbon/.test(s) && /Charge 0/.test(s), 'buildSummary readable: ' + s);
  check(chargeCopy(0) === 'neutral atom' && /cation/.test(chargeCopy(1)) && /anion/.test(chargeCopy(-2)), 'chargeCopy signed + text');
}

// ---------------------------------------------------------------------------
console.log('\nOmitted neutronCount accepts every common isotope');
// ---------------------------------------------------------------------------
{
  const chlorine = elements.find((e) => e.symbol === 'Cl');
  const looseMission = {
    id: 'sim-loose',
    title: 'Any chlorine',
    focus: 'isotope',
    brief: '',
    targetElement: 'Cl',
    charge: 0,
  };
  for (const A of chlorine.commonIsotopes) {
    const b = { protons: 17, neutrons: A - 17, shells: [2, 8, 7] };
    const ev = evaluate(elements, looseMission, b);
    check(ev.status === 'forged', `Cl-${A} accepted when neutronCount omitted`);
  }
  const notCommon = { protons: 17, neutrons: 15, shells: [2, 8, 7] }; // Cl-32, not listed
  check(evaluate(elements, looseMission, notCommon).status === 'pending', 'unlisted isotope stays pending when neutronCount omitted');
}

// ---------------------------------------------------------------------------
console.log('\nProgression');
// ---------------------------------------------------------------------------
{
  const ids = missions.map((m) => m.id);
  check(isUnlocked(missions, [], 0), 'first mission always unlocked');
  check(!isUnlocked(missions, [], 1), 'second mission locked at start');
  check(isUnlocked(missions, [ids[0]], 1), 'forging M1 unlocks M2');
  check(missionRowStatus(missions, [ids[0]], 0) === 'forged', 'M1 shows forged');
  check(missionRowStatus(missions, [ids[0]], 1) === 'open', 'M2 shows open');
  check(missionRowStatus(missions, [], 3) === 'locked', 'M4 still locked');
  const all = missions.map((m) => m.id);
  check(missionRowStatus(missions, all, all.length - 1) === 'forged', 'final mission can be forged');
  // Skipping ahead is impossible: forging M3 without M2 does not unlock M5.
  check(!isUnlocked(missions, [ids[2]], 4), 'progression is strictly sequential');
}

// ---------------------------------------------------------------------------
console.log(`\n${checks} checks · ${missions.length} missions · stepper + drag + invalid paths simulated.`);
if (failures > 0) {
  console.error(`✖ ${failures} check(s) failed.`);
  process.exit(1);
}
console.log('✔ engine simulation passed — every mission forgeable, invalid builds teach, progression sound.');
