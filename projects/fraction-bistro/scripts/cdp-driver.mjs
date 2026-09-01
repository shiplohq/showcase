#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Project CDP driver — exercises the real Fraction Bistro UI with mouse,
// touch and keyboard against any URL (preview or live Shiplo deployment):
//   board → build order (mouse tap-slice path + keyboard serve)
//         → nudge path (wrong cut, gentle message)
//         → equivalent order (chef plate + same amount) → recipe book entry
//         → compare order (two stations + sign) → servito
//         → reduced-motion, touch targets, overflow checks per viewport
// Exits non-zero on console errors or a broken step.
//
// Usage: node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|smoke]
// Pilot lessons baked in: fresh profile + --disk-cache-size=1 every run;
// --out must be a real Windows path (Chrome cannot write into Git Bash /tmp).

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const args = process.argv.slice(2);
const url = args[0];
const outDir = resolve(args[args.indexOf('--out') + 1] ?? '.shots');
const width = Number(args[args.indexOf('--w') + 1] ?? 1440);
const height = Number(args[args.indexOf('--h') + 1] ?? 900);
const flow = args[args.indexOf('--flow') + 1] ?? 'full';
if (!url) {
  console.error('usage: node cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|smoke]');
  process.exit(2);
}

const errors = [];
const consoleErrors = [];

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  '--remote-debugging-port=9333',
  '--user-data-dir=' + resolve(outDir, `.chrome-profile-${Date.now()}`),
  '--disk-cache-size=1',
  '--media-cache-size=1',
  '--disable-application-cache',
  '--no-first-run',
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, timeoutMs = 15000, label = 'condition') {
  const t0 = Date.now();
  for (;;) {
    const v = await fn().catch(() => null);
    if (v) return v;
    if (Date.now() - t0 > timeoutMs) throw new Error(`timeout waiting for ${label}`);
    await sleep(120);
  }
}

const list = await waitFor(async () => {
  const res = await fetch('http://127.0.0.1:9333/json/list');
  const targets = await res.json();
  return targets.find((t) => t.type === 'page') ?? null;
}, 15000, 'chrome devtools endpoint');
const ws = new WebSocket(list.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve: r, reject: j } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? j(new Error(msg.error.message)) : r(msg.result);
  } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
  } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    consoleErrors.push(msg.params.entry.text);
  } else if (msg.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(
      msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description ?? ''),
    );
  }
};
function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    throw new Error('page eval failed: ' + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
  }
  return r.result.value;
}

async function screenshot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const file = resolve(outDir, `${name}-${width}x${height}.png`);
  writeFileSync(file, Buffer.from(r.data, 'base64'));
  console.log(`  📸 ${name} → ${file}`);
  return file;
}

async function centerOf(selector) {
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!pt) throw new Error(`element not found: ${selector}`);
  return pt;
}

async function click(selector, label) {
  const pt = await centerOf(selector);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await sleep(260);
  void label;
}

async function tap(selector, label) {
  const pt = await centerOf(selector);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(300);
  void label;
}

async function key(keyName) {
  const codes = { Enter: 13, Tab: 9, Escape: 27, ' ': 32, ArrowRight: 39, ArrowLeft: 37 };
  const code = codes[keyName] ?? keyName.charCodeAt(0);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
  await sleep(140);
}

/** click the i-th ticket on the board by its data order (orders render in JSON order) */
async function openTicket(zeroBasedIndex) {
  await evaluate(`document.querySelectorAll('.ticket')[${zeroBasedIndex}].click()`);
  await sleep(600);
}

/** click the partition chip labelled with number n (2/3/4/6/8) inside the focused station */
async function choosePartition(n, station = 0) {
  await evaluate(`(() => {
    const stations = document.querySelectorAll('.station');
    const s = stations[${station}];
    const chip = [...s.querySelectorAll('.partition-picker .chip')].find(c => c.textContent.trim().startsWith('${n}'));
    if (!chip) throw new Error('chip ${n} not found in station ${station}');
    chip.click();
  })()`);
  await sleep(450);
}

/** click a slice on the dish (SVG role=button wedges), count from the top */
async function clickSlice(which, station = 0) {
  await evaluate(`(() => {
    const s = document.querySelectorAll('.station')[${station}];
    const slices = [...s.querySelectorAll('.slice-hit')];
    if (slices.length === 0) throw new Error('no slices on the dish — is the dish cut?');
    const el = slices[${which}] ?? slices[slices.length - 1];
    el.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, clientY: 0, bubbles: true }));
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 0, clientY: 0, bubbles: true }));
  })()`);
  await sleep(350);
}

async function keyboardPlaceSlice(station = 0) {
  await evaluate(`(() => {
    const s = document.querySelectorAll('.station')[${station}];
    const slice = s.querySelector('.slice-hit[tabindex="0"]') ?? s.querySelector('.slice-hit');
    slice.focus();
  })()`);
  await key('Enter');
  await sleep(250);
}

async function serve() {
  await click('.btn--primary', 'Serve order');
}

async function feedbackText() {
  return evaluate(`document.querySelector('.feedback')?.textContent?.trim() ?? ''`);
}

mkdirSync(outDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 });

try {
  await send('Page.navigate', { url });
  await sleep(2600);

  const title = await evaluate('document.title');
  console.log(`▶ ${url} — "${title}" @ ${width}x${height}`);

  // -- board -------------------------------------------------------------------
  const tickets = await evaluate(`document.querySelectorAll('.ticket').length`);
  const menuItems = await evaluate(`document.querySelectorAll('.menu-list li').length`);
  if (tickets !== 16) throw new Error(`expected 16 order tickets, found ${tickets}`);
  if (menuItems !== 3) throw new Error(`expected 3 menu dishes, found ${menuItems}`);
  console.log('  ✔ order board renders 16 tickets + 3-dish menu');
  await screenshot('01-board');

  if (flow === 'smoke') finish();

  // -- build order via mouse + keyboard mixed -----------------------------------
  await openTicket(0); // ord-001 focaccia build 1/2
  const cutOk = await evaluate(`!!document.querySelector('.dish-svg') && !!document.querySelector('.partition-picker')`);
  if (!cutOk) throw new Error('cutting table did not mount');
  console.log('  ✔ cutting table mounts (ord-001, halves)');

  await choosePartition(2);
  const cutlines = await evaluate(`document.querySelectorAll('.station .cutline').length`);
  if (cutlines < 1) throw new Error(`expected cut lines after cutting, found ${cutlines}`);
  console.log('  ✔ cutting into 2 draws the cut line(s)');

  // keyboard path: focus first slice, Enter plates it
  await keyboardPlaceSlice(0);
  const plateCount = await evaluate(`document.querySelectorAll('.station .plate .plate-slices [role="button"]').length`);
  if (plateCount !== 1) throw new Error(`keyboard Enter should plate 1 slice, plate has ${plateCount}`);
  console.log('  ✔ keyboard: Enter on the focused slice plates it');

  await serve();
  let fb = await feedbackText();
  if (!/servito/i.test(fb)) throw new Error(`expected Servito on ord-001, got "${fb}"`);
  const stamp = await evaluate(`!!document.querySelector('.stamp--lg')`);
  if (!stamp) throw new Error('servito stamp missing on success');
  console.log(`  ✔ build order served: "${fb.slice(0, 60)}…" + stamp`);
  await screenshot('02-cut-served');

  // -- nudge path: wrong cut + wrong count, message stays gentle -----------------
  await evaluate(`document.querySelector('.topbar .btn').click()`); // back to board
  await sleep(500);
  await openTicket(1); // ord-002 berry-tart build 2/3
  await choosePartition(4); // wrong: quarters, not thirds
  await clickSlice(0);
  await clickSlice(1);
  await serve();
  fb = await feedbackText();
  if (!/cut the .* into 3/i.test(fb)) throw new Error(`expected cut-mismatch nudge mentioning 3, got "${fb}"`);
  const nudgeColor = await evaluate(`getComputedStyle(document.querySelector('.feedback')).color`);
  if (/rgb\((2[0-5][0-9]|19[0-9]),\s*[0-6]?[0-9],/i.test(nudgeColor)) {
    throw new Error(`nudge text looks punitive-red: ${nudgeColor}`);
  }
  console.log(`  ✔ nudge (wrong cut) is instructive, not punitive: "${fb.slice(0, 60)}…"`);
  const stillPlated = await evaluate(`document.querySelectorAll('.station .plate [role="button"]').length`);
  if (stillPlated !== 2) throw new Error(`nudge must keep the plated slices, found ${stillPlated}`);
  console.log('  ✔ wrong serve keeps the learner’s work (no punitive reset)');

  // recover: re-cut correctly and serve
  await choosePartition(3);
  await clickSlice(0);
  await clickSlice(1);
  await serve();
  fb = await feedbackText();
  if (!/servito/i.test(fb)) throw new Error(`expected Servito after recovery, got "${fb}"`);
  console.log('  ✔ recovery path serves after re-cutting');

  // -- equivalent order: chef’s plate + same amount (touch path for chips) -------
  await evaluate(`document.querySelector('.topbar .btn').click()`);
  await sleep(500);
  await openTicket(3); // ord-004 berry-tart equivalent 1/2 → 2/4
  const twoStations = await evaluate(`document.querySelectorAll('.station').length`);
  if (twoStations !== 2) throw new Error(`equivalent order needs 2 stations, found ${twoStations}`);
  const chefFixed = await evaluate(`!document.querySelectorAll('.station')[0].querySelector('.partition-picker')`);
  if (!chefFixed) throw new Error('chef station should be read-only');
  const chefPlate = await evaluate(`[...document.querySelectorAll('.station')[0].querySelector('.plate-slices')?.children ?? []].filter(el => el.tagName.toLowerCase() === 'g' && el.hasAttribute('transform')).length`);
  if (chefPlate !== 1) throw new Error(`chef station should arrive pre-plated with 1 slice, has ${chefPlate}`);
  console.log('  ✔ equivalent order: chef’s plate fixed at 1/2, learner station beside it');

  // touch path: tap the "4 quarters" chip with a real touch event
  const chipPt = await evaluate(`(() => {
    const s = document.querySelectorAll('.station')[1];
    const chip = [...s.querySelectorAll('.chip')].find(c => c.textContent.trim().startsWith('4'));
    if (!chip) return null;
    chip.scrollIntoView({ block: 'center' });
    const r = chip.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  if (!chipPt) throw new Error('quarters chip not found for touch tap');
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [chipPt] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(500);
  console.log('  ✔ touch: tapping the quarters chip cuts the learner dish into 4');
  await clickSlice(0, 1);
  await clickSlice(0, 1);
  // overlay check
  await evaluate(`[...document.querySelectorAll('button')].find(b => /overlay/i.test(b.textContent)).click()`);
  await sleep(400);
  const overlayLayers = await evaluate(`document.querySelectorAll('.overlay-stage .layer').length`);
  if (overlayLayers !== 2) throw new Error(`overlay should stack 2 dishes, found ${overlayLayers}`);
  console.log('  ✔ overlay stacks the two dishes (area comparison)');
  await screenshot('03-equivalent');
  await serve();
  fb = await feedbackText();
  if (!/servito/i.test(fb)) throw new Error(`expected Servito on equivalent order, got "${fb}"`);
  console.log('  ✔ same-amount order served (1/2 = 2/4)');

  // -- recipe book gained a page --------------------------------------------------
  await evaluate(`[...document.querySelectorAll('.topbar .nav .btn')].find(b => /recipe book/i.test(b.textContent)).click()`);
  await sleep(500);
  const bookEntries = await evaluate(`document.querySelectorAll('.book-list li').length`);
  if (bookEntries < 1) throw new Error('recipe book should list the discovered equivalence');
  console.log(`  ✔ recipe book shows ${bookEntries} discovered equivalence(s)`);
  await screenshot('04-book');

  // -- compare order: two stations + sign picker ----------------------------------
  await evaluate(`document.querySelector('.topbar .nav .btn').click()`);
  await sleep(400);
  await openTicket(9); // ord-010 focaccia compare 2/3 vs 2/6 → >
  const signs = await evaluate(`document.querySelectorAll('.sign-picker .sign').length`);
  if (signs !== 3) throw new Error(`sign picker needs 3 signs, found ${signs}`);
  // left: thirds, 2 slices — right: sixths, 2 slices
  await choosePartition(3, 0);
  await clickSlice(0, 0);
  await clickSlice(0, 0);
  await choosePartition(6, 1);
  await clickSlice(0, 1);
  await clickSlice(0, 1);
  // wrong sign first: pick '='
  await evaluate(`[...document.querySelectorAll('.sign')].find(s => s.getAttribute('aria-label') === 'is equal to').click()`);
  await sleep(250);
  await serve();
  fb = await feedbackText();
  if (!/look at the plates again/i.test(fb)) throw new Error(`expected sign nudge, got "${fb}"`);
  console.log('  ✔ wrong sign nudges without penalty');
  // correct sign: '>'
  await evaluate(`[...document.querySelectorAll('.sign')].find(s => s.getAttribute('aria-label') === 'is more than').click()`);
  await sleep(250);
  await serve();
  fb = await feedbackText();
  if (!/servito/i.test(fb)) throw new Error(`expected Servito on compare order, got "${fb}"`);
  console.log(`  ✔ compare order served: "${fb.slice(0, 60)}…"`);
  await screenshot('05-compare');

  // -- pointer drag: slice → plate with ghost ---------------------------------------
  await evaluate(`document.querySelector('.topbar .nav .btn').click()`);
  await sleep(500);
  await openTicket(7); // ord-008 focaccia build 7/8
  await choosePartition(8);
  const sliceCenter = await evaluate(`(() => {
    const s = document.querySelector('.station');
    const el = s.querySelector('.slice-hit');
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  const plateCenter = await evaluate(`(() => {
    const el = document.querySelector('.plate-zone');
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  // small first move to cross the 10px tap threshold, then travel to the plate.
  // Synthetic PointerEvents drive the same handlers real pointers run; CDP's
  // Input domain does not synthesize pointermove from mouseMoved.
  const dragSeq = [];
  dragSeq.push(`const slice = document.querySelector('.station .slice-hit');
    slice.dispatchEvent(new PointerEvent('pointerdown', { clientX: ${sliceCenter.x}, clientY: ${sliceCenter.y}, bubbles: true }));`);
  dragSeq.push(`window.dispatchEvent(new PointerEvent('pointermove', { clientX: ${sliceCenter.x + 14}, clientY: ${sliceCenter.y + 10}, bubbles: true }));`);
  await evaluate(dragSeq[0]);
  await sleep(80);
  await evaluate(dragSeq[1]);
  await sleep(150);
  const ghostCount = await evaluate(`document.querySelectorAll('.drag-ghost').length`);
  if (ghostCount !== 1) throw new Error(`drag should mount exactly 1 ghost, found ${ghostCount}`);
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    await evaluate(`window.dispatchEvent(new PointerEvent('pointermove', { clientX: ${(sliceCenter.x + 14 + ((plateCenter.x - sliceCenter.x - 14) * i) / steps).toFixed(1)}, clientY: ${(sliceCenter.y + 10 + ((plateCenter.y - sliceCenter.y - 10) * i) / steps).toFixed(1)}, bubbles: true }));`);
    await sleep(30);
  }
  await evaluate(`window.dispatchEvent(new PointerEvent('pointerup', { clientX: ${plateCenter.x.toFixed(1)}, clientY: ${plateCenter.y.toFixed(1)}, bubbles: true }));`);
  await sleep(700);
  const dragged = await evaluate(`(() => {
    const s = document.querySelector('.station');
    return {
      plated: [...(s.querySelector('.plate-slices')?.children ?? [])].filter(el => el.tagName.toLowerCase() === 'g' && el.hasAttribute('transform')).length,
      ghosts: document.querySelectorAll('.drag-ghost').length,
    };
  })()`);
  if (dragged.plated !== 1) throw new Error(`drag should plate 1 slice, plate has ${dragged.plated}`);
  if (dragged.ghosts !== 0) throw new Error(`ghost not cleaned up after drop (${dragged.ghosts} left)`);
  console.log('  ✔ pointer drag: slice ghosted onto the plate and cleaned up');

  // -- progress + reset ------------------------------------------------------------
  await evaluate(`document.querySelector('.topbar .nav .btn').click()`);
  await sleep(400);
  const progress = await evaluate(`document.querySelector('.progress-line')?.textContent?.replace(/\\s+/g, ' ').trim()`);
  if (!/4\s*\/\s*16/.test(progress ?? '')) throw new Error(`expected progress 4/16, got "${progress}"`);
  console.log(`  ✔ progress line: "${progress}"`);
  const resetBtn = `[...document.querySelectorAll('button')].find(b => /new shift|clear all stamps/i.test(b.textContent))`;
  await evaluate(`${resetBtn}.click()`);
  await sleep(300);
  const armed = await evaluate(`${resetBtn}.textContent.trim()`);
  if (!/clear all stamps/i.test(armed)) throw new Error(`reset should arm a confirmation first, got "${armed}"`);
  await evaluate(`${resetBtn}.click()`);
  await sleep(400);
  const afterReset = await evaluate(`document.querySelector('.progress-line')?.textContent?.replace(/\\s+/g, ' ').trim()`);
  if (!/0\s*\/\s*16/.test(afterReset ?? '')) throw new Error(`expected progress 0/16 after reset, got "${afterReset}"`);
  console.log('  ✔ New shift resets progress with a two-step confirmation');

  // -- touch targets + reduced motion ----------------------------------------------
  const smallTargets = await evaluate(`[...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).length`);
  if (smallTargets > 0) throw new Error(`${smallTargets} button(s) smaller than 44px`);
  console.log('  ✔ all visible buttons ≥ 44px touch targets');

  const overflow = await evaluate(`document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth`);
  if (overflow > 1) throw new Error(`horizontal overflow of ${overflow}px at ${width}px`);
  console.log(`  ✔ no horizontal overflow at ${width}px`);

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await sleep(500);
  const stillRenders = await evaluate(`document.body.innerText.trim().length > 0`);
  if (!stillRenders) throw new Error('page empty under reduced motion');
  console.log('  ✔ prefers-reduced-motion emulated — app remains usable');
  await screenshot('06-reduced-motion');

  finish();
} catch (err) {
  errors.push(String(err.message || err));
  finish();
}

function finish() {
  try { ws.close(); } catch {}
  try { chrome.kill(); } catch {}
  if (consoleErrors.length) {
    console.error(`\n✖ ${consoleErrors.length} console error(s):`);
    for (const e of consoleErrors) console.error('   ' + e.slice(0, 300));
  }
  if (errors.length) {
    console.error(`\n✖ flow failed: ${errors[0]}`);
    process.exit(1);
  }
  if (consoleErrors.length) process.exit(1);
  console.log(`\n✔ CDP flow passed at ${width}x${height} — no console errors.`);
  process.exit(0);
}
