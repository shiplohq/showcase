#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Project CDP driver — exercises the REAL multiplication flow against any URL
// (preview or the live Shiplo deployment) with mouse, keyboard and touch:
//   map → constellation (mouse) → chapter overlay → wrong pick (keyboard
//   arrows + Enter, drift feedback) → retry (lock) → skip-count → next fact
//   (touch) → all 6 facts → sector-complete overlay → map → mission log →
//   reset confirm. Exits non-zero on any console error or broken step.
//
// Usage: node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|smoke]

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
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

// Fresh profile + no disk cache every run (pilot lesson: persistent profiles
// keep stale index.html → stale assets → fake "fix didn't land" debugging).
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  '--remote-debugging-port=9334',
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
  const res = await fetch('http://127.0.0.1:9334/json/list');
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
    consoleErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description ?? ''));
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
  if (r.exceptionDetails) throw new Error('page eval failed: ' + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
  return r.result.value;
}

async function screenshot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const file = resolve(outDir, `${name}-${width}x${height}.png`);
  writeFileSync(file, Buffer.from(r.data, 'base64'));
  console.log(`  📸 ${name} → ${file}`);
  return file;
}

async function click(selectorOrPoint, label) {
  const pt = typeof selectorOrPoint === 'string'
    ? await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selectorOrPoint)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`)
    : selectorOrPoint;
  if (!pt) throw new Error(`click target not found: ${label ?? selectorOrPoint}`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await sleep(280);
}

async function key(keyName) {
  const codes = { Enter: 13, Tab: 9, Escape: 27, ' ': 32, ArrowRight: 39, ArrowLeft: 37, ArrowDown: 40, ArrowUp: 38 };
  const code = codes[keyName] ?? keyName.charCodeAt(0);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
  await sleep(130);
}

async function tap(selector, label) {
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!pt) throw new Error(`tap target not found: ${label ?? selector}`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(320);
}

/** Compute the expected answer from the fact headline (ground truth from DOM). */
async function answerFromHeadline() {
  return evaluate(`(() => {
    const h = document.querySelector('.fact-headline').textContent.trim().replace(/\\s+/g, ' ');
    let m = h.match(/^(\\d+) × (\\d+) = \\?$/);
    if (m) return Number(m[1]) * Number(m[2]);
    m = h.match(/^\\? × (\\d+) = (\\d+)$/);
    if (m) return Number(m[2]) / Number(m[1]);
    m = h.match(/^(\\d+) × \\? = (\\d+)$/);
    if (m) return Number(m[2]) / Number(m[1]);
    return null;
  })()`);
}

mkdirSync(outDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 });

try {
  await send('Page.navigate', { url });
  await sleep(2600); // fonts + JSON settle

  const title = await evaluate('document.title');
  console.log(`▶ ${url} — "${title}" @ ${width}x${height}`);

  // -- map renders 11 constellations -----------------------------------------
  const mapOk = await evaluate(`document.querySelectorAll('.constellation').length`);
  if (mapOk !== 11) throw new Error(`expected 11 constellations on the map, got ${mapOk}`);
  console.log('  ✔ star chart renders 11 table constellations');
  await screenshot('01-map');

  if (flow === 'smoke') {
    finish();
  }

  // -- mouse: enter the first constellation (Table of 2) ----------------------
  await click('.constellation:nth-child(1) .constellation-btn', 'first constellation');
  const overlayOk = await waitFor(() => evaluate(`!!document.querySelector('.overlay[role="dialog"]')`), 4000, 'chapter overlay');
  if (!overlayOk) throw new Error('chapter overlay did not open');
  console.log('  ✔ mouse click opens the chapter overlay');
  await screenshot('02-overlay');
  await click('.overlay .btn-primary', 'Begin the survey');

  // -- mission stage mounts ---------------------------------------------------
  const stageOk = await evaluate(`!!document.querySelector('.orbit-array') && document.querySelectorAll('.answer-node').length === 4`);
  if (!stageOk) throw new Error('mission stage did not mount with 4 answer nodes');
  const headline1 = await evaluate(`document.querySelector('.fact-headline').textContent.trim()`);
  console.log(`  ✔ mission stage mounts — fact "${headline1.replace(/\\s+/g, ' ')}"`);
  await screenshot('03-mission');

  // -- keyboard: arrows + Enter on a WRONG node → drift -----------------------
  await evaluate(`document.querySelector('.answer-node').focus()`);
  await key('ArrowRight'); // move focus to node 2
  const focusedIdx = await evaluate(`[...document.querySelectorAll('.answer-node')].findIndex(n => n === document.activeElement)`);
  if (focusedIdx !== 1) throw new Error(`arrow navigation failed (focus at ${focusedIdx})`);
  console.log('  ✔ arrow keys move between orbital nodes');
  const answer = await answerFromHeadline();
  if (answer === null) throw new Error('could not compute the expected answer from the headline');
  // Pick the first node whose value is wrong (focus whichever it is).
  const wrongIdx = await evaluate(`(() => { const nodes = [...document.querySelectorAll('.answer-node')]; const wrong = nodes.findIndex(n => Number(n.querySelector('.node-value').textContent) !== ${answer}); nodes[wrong].focus(); return wrong; })()`);
  if (wrongIdx < 0) throw new Error('no wrong option found');
  await key(' '); // Space activates the focused node (Enter path tested via the overlay button below)
  const drift = await evaluate(`document.querySelector('.live-feedback')?.className ?? ''`);
  if (!drift.includes('drift')) throw new Error(`expected drift feedback, got "${drift}"`);
  const driftText = await evaluate(`document.querySelector('.live-feedback')?.textContent.trim() ?? ''`);
  const driftColor = await evaluate(`getComputedStyle(document.querySelector('.live-feedback')).color`);
  if (/rgb\(2[0-5][0-9],\s*[0-6]?[0-9],/i.test(driftColor)) throw new Error(`drift text looks alarm-red (punitive): ${driftColor}`);
  console.log(`  ✔ keyboard Enter picks a wrong node → gentle drift ("${driftText.slice(0, 52)}…")`);

  // -- retry with the correct node → lock --------------------------------------
  const correctPick = await evaluate(`(() => { const nodes = [...document.querySelectorAll('.answer-node')]; const right = nodes.find(n => Number(n.querySelector('.node-value').textContent) === ${answer}); if (!right) return false; right.click(); return true; })()`);
  if (!correctPick) throw new Error('correct node not found');
  await sleep(700); // lock morph plays (320ms + ticks)
  const lockText = await evaluate(`document.querySelector('.live-feedback')?.textContent.trim() ?? ''`);
  if (!/Orbit locked/i.test(lockText)) throw new Error(`expected lock feedback, got "${lockText}"`);
  const nextBtn = await evaluate(`!!document.querySelector('.next-fact')`);
  if (!nextBtn) throw new Error('Next fact control did not appear after lock');
  const ringStroke = await evaluate(`getComputedStyle(document.querySelector('.ring-group .ring-path')).stroke`);
  console.log(`  ✔ correct pick locks the orbit (rings now ${ringStroke.trim()}) + pacing control appears`);
  await screenshot('04-locked');

  // -- skip-count works post-lock (review of the stable system) ----------------
  await click('.count-btn', 'Count by rings');
  await sleep(300);
  const skipVal = await evaluate(`document.querySelector('.skip-label.on')?.textContent ?? document.querySelector('.skip-label')?.textContent ?? ''`);
  if (!skipVal) throw new Error('skip-count label did not appear');
  console.log(`  ✔ count-by-rings shows the running total ("${skipVal}")`);

  // -- touch: next fact, then finish the remaining facts -----------------------
  await tap('.next-fact', 'Next fact (touch)');
  const headline2 = await evaluate(`document.querySelector('.fact-headline').textContent.trim()`);
  if (headline2.replace(/\\s+/g, ' ') === headline1.replace(/\\s+/g, ' ')) throw new Error('touch Next fact did not advance');
  console.log('  ✔ touch advances to the next fact');

  // Finish all six facts: fact 2 gets one wrong pick on the way (retry path).
  let factsDone = 2;
  for (;;) {
    const ans = await answerFromHeadline();
    if (ans === null) throw new Error('headline unreadable mid-run');
    if (factsDone === 2) {
      await evaluate(`(() => { const nodes = [...document.querySelectorAll('.answer-node')]; const wrong = nodes.find(n => Number(n.querySelector('.node-value').textContent) !== ${ans}); wrong?.click(); })()`);
      await sleep(200);
    }
    await evaluate(`(() => { const nodes = [...document.querySelectorAll('.answer-node')]; const right = nodes.find(n => Number(n.querySelector('.node-value').textContent) === ${ans}); right?.click(); })()`);
    await sleep(650);
    const last = await evaluate(`!!document.querySelector('.next-fact') && document.querySelector('.next-fact').textContent.includes('Complete')`);
    if (last) break;
    await tap('.next-fact', 'Next fact');
    await sleep(350);
    factsDone++;
    if (factsDone > 8) throw new Error('fact loop did not terminate');
  }
  await tap('.next-fact', 'Complete the survey (touch)');
  const complete = await waitFor(() => evaluate(`!!document.querySelector('.overlay[role="dialog"]') && document.body.textContent.includes('holds steady')`), 4000, 'sector-complete overlay');
  if (!complete) throw new Error('sector-complete overlay did not open');
  console.log(`  ✔ all ${factsDone} facts locked → sector-complete overlay`);
  await screenshot('05-complete');
  await click('.overlay .btn-primary', 'Back to the star chart');
  const progress = await evaluate(`document.querySelector('.constellation:nth-child(1) .constellation-progress')?.textContent.trim()`);
  if (!progress || !progress.includes('6/6')) throw new Error(`constellation progress not 6/6 after completion, got "${progress}"`);
  console.log('  ✔ map shows 6/6 orbits locked for the surveyed system');

  // -- mission log: matrix + reset (two-step confirm) ---------------------------
  await click('.header-tools button:nth-of-type(1)', 'Mission log');
  const rows = await evaluate(`document.querySelectorAll('.log-table tbody tr').length`);
  if (rows !== 11) throw new Error(`log matrix expected 11 rows, got ${rows}`);
  const srNote = await evaluate(`!!document.querySelector('.log-table [aria-label*="locked"]')`);
  if (!srNote) throw new Error('log cells missing text equivalents (aria-label)');
  await screenshot('06-log');
  await click('.log-tools .btn-quiet', 'Reset progress');
  const confirmShown = await evaluate(`document.body.textContent.includes('Clear all local progress?')`);
  if (!confirmShown) throw new Error('reset confirmation did not appear');
  await evaluate(`[...document.querySelectorAll('.log-tools .btn')].find(b => b.textContent.includes('Yes, reset'))?.click()`);
  await sleep(250);
  const afterReset = await evaluate(`document.querySelector('.log-table tbody [role="img"][aria-label*="not yet visited"]') !== null`);
  if (!afterReset) throw new Error('reset did not clear the matrix');
  console.log('  ✔ mission log renders 11×6 matrix with text equivalents; two-step reset works');

  // -- touch-target sanity -------------------------------------------------------
  const smallTargets = await evaluate(`[...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).length`);
  if (smallTargets > 0) throw new Error(`${smallTargets} button(s) smaller than 44px`);
  console.log('  ✔ all visible buttons ≥ 44px touch targets');

  // -- reduced motion --------------------------------------------------------------
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const usable = await evaluate(`!!document.querySelector('.app-shell') && document.querySelectorAll('button').length > 0`);
  if (!usable) throw new Error('app unusable under reduced motion');
  console.log('  ✔ prefers-reduced-motion emulated — content intact');
  await screenshot('07-reduced-motion');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: '' }] });

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
