#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// EcoBalance full-flow headless verification (CDP, zero dependencies).
// Drives the real UI with mouse, keyboard and touch:
//   biome cover → open meadow → plan sliders (keyboard) → Step →
//   food web overlay → field chart (debrief) → challenge start + banner →
//   reset → 44px targets on the ACTIVITY screen → reduced-motion →
//   viewport-fit assertion (scrollHeight ≤ viewport on main screens).
// Exits non-zero on any console error or broken step.
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

// Unique port per run (batch lesson: port collisions cause fake failures).
const port = 9400 + Math.floor(Math.random() * 90);

const errors = [];
const consoleErrors = [];
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  `--remote-debugging-port=${port}`,
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
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
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
async function click(selector, label) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: 'center' })`);
  await sleep(120);
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!pt) throw new Error(`click target not found: ${label ?? selector}`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await sleep(300);
}
async function key(keyName) {
  const codes = { Enter: 13, Tab: 9, Escape: 27, ' ': 32, ArrowRight: 39, ArrowLeft: 37, ArrowUp: 38, ArrowDown: 40 };
  const code = codes[keyName];
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, windowsVirtualKeyCode: code ?? keyName.charCodeAt(0), nativeVirtualKeyCode: code ?? keyName.charCodeAt(0) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, windowsVirtualKeyCode: code ?? keyName.charCodeAt(0), nativeVirtualKeyCode: code ?? keyName.charCodeAt(0) });
  await sleep(120);
}
async function tap(selector, label) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: 'center' })`);
  await sleep(120);
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!pt) throw new Error(`tap target not found: ${label ?? selector}`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(300);
}
function fail(msg) {
  errors.push(msg);
  console.error(`  ✖ ${msg}`);
}
function ok(msg) {
  console.log(`  ✔ ${msg}`);
}

mkdirSync(outDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 });

function finish() {
  if (consoleErrors.length) consoleErrors.forEach((e) => console.error(`  ✖ console: ${e.slice(0, 160)}`));
  console.log('');
  const bad = errors.length + consoleErrors.length;
  console.log(bad === 0 ? `✔ EcoBalance flow passed at ${width}x${height}` : `✖ EcoBalance flow FAILED at ${width}x${height} (${bad} issue(s))`);
  try { chrome.kill(); } catch { /* already gone */ }
  process.exit(bad === 0 ? 0 : 1);
}

try {
  await send('Page.navigate', { url });
  await sleep(2600);
  // Wait for webfonts (font-display: swap changes text metrics mid-load —
  // measuring before the swap produces phantom overflow).
  await evaluate('document.fonts.ready.then(() => 1)');
  const title = await evaluate('document.title');
  console.log(`▶ ${url} — "${title}" @ ${width}x${height}`);

  // -- biome cover renders ------------------------------------------------
  const plateCount = await evaluate(`document.querySelectorAll('.biome-plate').length`);
  if (plateCount !== 2) fail(`expected 2 biome plates, got ${plateCount}`);
  else ok('biome cover renders 2 expedition plates');
  await screenshot('01-biomes');

  // viewport-fit on the cover (desktop/tablet only — mobile scrolls by design).
  // Measure the actual scroll containers: .screen-biomes scrolls internally,
  // which document.scrollHeight never sees.
  if (width >= 1024) {
    const m = await evaluate(`(() => { const el = document.querySelector('.screen-biomes'); return el ? { sh: el.scrollHeight, ch: el.clientHeight, doc: document.scrollingElement.scrollHeight } : null; })()`);
    if (!m) fail('biome cover container missing');
    else if (m.sh > m.ch + 2 || m.doc > height + 2) fail(`biome cover scrolls at ${width}x${height}: inner ${m.sh}/${m.ch}, doc ${m.doc}/${height}`);
    else ok(`biome cover fits ${width}x${height} without any scroll (inner ${m.sh}/${m.ch})`);
  }

  if (flow === 'smoke') {
    finish();
  }

  // -- mouse: open the meadow --------------------------------------------
  await click('.biome-plate .btn-primary', 'Open Willow Meadow');
  await evaluate('document.fonts.ready.then(() => 1)');
  const simOk = await evaluate(`document.querySelectorAll('.ledger-row').length`);
  if (simOk !== 4) fail(`expected 4 ledger rows, got ${simOk}`);
  else ok('mouse click opens the meadow field desk (4 species)');
  await screenshot('02-sim');

  // -- keyboard: plan +4 rabbits, then Step -------------------------------
  const before = await evaluate(`document.querySelector('.ledger-row[data-species="rabbit"] .row-pop').textContent`);
  await evaluate(`document.querySelector('.ledger-row[data-species="rabbit"] .plan-slider').focus()`);
  for (let i = 0; i < 4; i++) await key('ArrowRight');
  const chip = await evaluate(`document.querySelector('.ledger-row[data-species="rabbit"] .plan-chip').textContent`);
  if (!/4 release/.test(chip)) fail(`plan chip after 4×ArrowRight should read "+4 release", got "${chip}"`);
  else ok('slider keyboard path sets plan (+4 release)');

  // touch: tap the Step button
  await tap('.btn-step', 'Step (touch)');
  const after = await evaluate(`document.querySelector('.ledger-row[data-species="rabbit"] .row-pop').textContent`);
  const cause = await evaluate(`document.querySelector('.ledger-row[data-species="rabbit"] .row-cause').textContent`);
  if (Number(after) === Number(before)) fail(`rabbit population did not change after step (${before} → ${after})`);
  else ok(`step applies plan and engine rules (${before} → ${after} rabbits)`);
  if (!/released/.test(cause)) fail(`cause line should mention the release, got "${cause}"`);
  else ok(`cause-of-change is visible ("${cause.slice(0, 60)}…")`);
  await screenshot('03-after-step');

  // viewport-fit on the activity screen: no page scroll AND the ledger
  // itself must not scroll at tablet+ (flawless hero bar)
  if (width >= 1024) {
    const m = await evaluate(`(() => { const sim = document.querySelector('.screen-sim'); const led = document.querySelector('.ledger'); const nb = document.querySelector('.notebook'); return { doc: document.scrollingElement.scrollHeight, sim: sim ? sim.scrollHeight - sim.clientHeight : 0, led: led ? led.scrollHeight - led.clientHeight : 0, nb: nb ? nb.scrollHeight - nb.clientHeight : 0 }; })()`);
    if (m.doc > height + 2) fail(`sim screen page-scrolls at ${width}x${height}: ${m.doc} > ${height}`);
    else if (m.led > 2) {
      const dbg = await evaluate(`(() => { const led = document.querySelector('.ledger'); return { sh: led.scrollHeight, ch: led.clientHeight, rows: [...document.querySelectorAll('.ledger-row')].map(r => r.offsetHeight), cs: getComputedStyle(led).paddingTop + '/' + getComputedStyle(led).gap, fonts: document.fonts.status }; })()`);
      fail(`ledger scrolls internally at ${width}x${height} (${m.led}px overflow) ${JSON.stringify(dbg)}`);
    }
    else if (m.nb > 2) fail(`notebook scrolls internally at ${width}x${height} (${m.nb}px overflow)`);
    else ok(`sim screen fits ${width}x${height} with zero overflow (doc ${m.doc}px)`);
  }

  // -- touch targets on the ACTIVITY screen --------------------------------
  const small = await evaluate(`[...document.querySelectorAll('button, input[type="range"]')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).length`);
  if (small > 0) fail(`${small} control(s) smaller than 44px on the sim screen`);
  else ok('all sim-screen controls ≥ 44px touch targets');

  // -- food web overlay -----------------------------------------------------
  await click('.exp-actions .btn[aria-pressed]', 'Food web toggle');
  const webVisible = await evaluate(`!!document.querySelector('.food-web path') && document.querySelector('.food-web').style.display !== 'none'`);
  if (!webVisible) fail('food web lines did not render');
  else ok('food web overlay draws predator→prey lines');
  await screenshot('04-web');
  await click('.exp-actions .btn[aria-pressed]', 'Food web toggle (off)');

  // -- debrief chart --------------------------------------------------------
  await click('.exp-actions button:last-child', 'Field chart');
  const debriefOk = await evaluate(`!!document.querySelector('.db-chart svg') && document.querySelectorAll('.db-summaries li').length === 4`);
  if (!debriefOk) fail('debrief chart or per-species text summaries missing');
  else ok('field chart opens with 4 textual species summaries');
  await screenshot('05-debrief');
  await key('Escape');
  const debriefGone = await evaluate(`!document.querySelector('.debrief')`);
  if (!debriefGone) fail('Escape did not close the field chart');
  else ok('Escape closes the field chart');

  // -- challenge ------------------------------------------------------------
  const chBtn = await evaluate(`[...document.querySelectorAll('.ch-pick')].find(b => /The Dry Summer/.test(b.textContent))?.textContent?.trim()`);
  if (!chBtn) fail('challenge "The Dry Summer" not listed');
  else {
    await evaluate(`[...document.querySelectorAll('.ch-pick')].find(b => /The Dry Summer/.test(b.textContent))?.click()`);
    await sleep(200);
    await click('.btn-step', 'Step (challenge)');
    await sleep(400);
    const banner = await evaluate(`document.querySelector('.event-banner')?.textContent?.trim() ?? ''`);
    if (!/Drought/i.test(banner)) fail(`drought banner expected after first challenge season, got "${banner}"`);
    else ok(`challenge fires its scripted event ("${banner.slice(0, 56)}…")`);
    const targets = await evaluate(`document.querySelectorAll('.ch-target').length`);
    if (targets !== 4) fail(`expected 4 challenge target chips, got ${targets}`);
    else ok('challenge target ranges render as text chips');
  }
  await screenshot('06-challenge');

  // -- reset ------------------------------------------------------------------
  await click('.ctrl-strip .btn:nth-child(3)', 'Reset');
  const resetPop = await evaluate(`document.querySelector('.ledger-row[data-species="rabbit"] .row-pop').textContent`);
  if (Number(resetPop) !== 26) fail(`reset should restore 26 rabbits, got ${resetPop}`);
  else ok('Reset restores the biome\'s initial populations');

  // -- second biome: wetland mounts with its own species --------------------
  await click('.exp-label .btn', 'Back to biomes');
  const wetBtn = `[...document.querySelectorAll('.biome-plate .btn-primary')][1]`;
  await evaluate(`${wetBtn}?.click()`);
  await sleep(300);
  const wetRows = await evaluate(`document.querySelectorAll('.ledger-row').length`);
  const wetNames = await evaluate(`[...document.querySelectorAll('.row-name')].map(n => n.textContent).join(', ')`);
  if (wetRows !== 4) fail(`wetland expected 4 ledger rows, got ${wetRows}`);
  else ok(`wetland field desk opens (${wetNames})`);
  await click('.btn-step', 'Step (wetland)');
  const wetCause = await evaluate(`document.querySelector('.ledger-row[data-species="reeds"] .row-cause').textContent`);
  if (!/grew/.test(wetCause)) fail(`wetland reeds cause expected growth, got "${wetCause}"`);
  else ok(`wetland engine step visible ("${wetCause.slice(0, 40)}…")`);
  await screenshot('08-wetland');

  // -- reduced motion -----------------------------------------------------------
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await click('.btn-step', 'Step under reduced motion');
  const rmOk = await evaluate(`!!document.querySelector('.ledger-row .row-pop')`);
  if (!rmOk) fail('app broken under prefers-reduced-motion');
  else ok('prefers-reduced-motion — app remains fully usable');
  await screenshot('07-reduced-motion');

  finish();
} catch (err) {
  errors.push(String(err.message || err));
  finish();
}
