#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Final gallery captures — ONLY from the live Shiplo deployment
// (docs/SCREENSHOTS.md). States are staged through real gameplay clicks
// (no devtools tampering): every number and banner in a capture was earned
// by stepping the actual engine.
//
// Usage: node scripts/capture-shots.mjs <live-url> --out <dir>

import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const url = args[0];
const outDir = resolve(args[args.indexOf('--out') + 1] ?? '.shots');
if (!url || !/^https:/.test(url)) {
  console.error('usage: node capture-shots.mjs <live-url> --out dir  (https only — screenshots come from the deployment)');
  process.exit(2);
}

const port = 9750 + Math.floor(Math.random() * 80);
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--window-size=1440,900',
  `--remote-debugging-port=${port}`,
  '--user-data-dir=' + resolve(outDir, `.chrome-profile-cap-${Date.now()}`),
  '--disk-cache-size=1', '--media-cache-size=1', '--no-first-run', 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, t = 20000, l = 'cond') {
  const t0 = Date.now();
  for (;;) {
    const v = await fn().catch(() => null);
    if (v) return v;
    if (Date.now() - t0 > t) throw new Error('timeout ' + l);
    await sleep(120);
  }
}
const list = await waitFor(async () => (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'));
const ws = new WebSocket(list.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0;
const pending = new Map();
const consoleErrors = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve: r, reject: j } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? j(new Error(m.error.message)) : r(m.result);
  } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
  } else if (m.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(m.params.exceptionDetails.text);
  }
};
function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 200));
  return r.result.value;
}
async function setViewport(w, h) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 900 });
}
async function shot(name, w, h) {
  await evaluate('document.fonts.ready.then(()=>1)');
  await sleep(350);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const png = resolve(outDir, `${name}.png`);
  writeFileSync(png, Buffer.from(r.data, 'base64'));
  const webp = resolve(outDir, `${name}.webp`);
  execSync(`ffmpeg -y -loglevel error -i "${png}" -vf scale=${w}:${h} -quality 82 "${webp}"`);
  console.log(`📸 ${name} → ${webp}`);
}
const clickSel = async (sel) => {
  await evaluate(`document.querySelector(${JSON.stringify(sel)})?.scrollIntoView({ block: 'center' })`);
  await sleep(100);
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!pt) throw new Error('missing ' + sel);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await sleep(300);
};

mkdirSync(outDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');

// ---------- desktop 1440x900 — honest biome-cover landing ----------------
await setViewport(1440, 900);
await send('Page.navigate', { url });
await sleep(3000);
await evaluate('document.fonts.ready.then(() => 1)');
await shot('desktop', 1440, 900);

// ---------- tablet 1024x768 — the hero: field desk mid-study -------------
await setViewport(1024, 768);
await send('Page.navigate', { url });
await sleep(2600);
await evaluate('document.fonts.ready.then(() => 1)');
await clickSel('.biome-plate .btn-primary');
await sleep(400);
// two real seasons: plan +4 rabbits, step; then foxes -1, step
await evaluate(`(() => { const s = document.querySelector('.ledger-row[data-species="rabbit"] .plan-slider'); s.value = 4; s.dispatchEvent(new Event('input', { bubbles: true })); })()`);
await clickSel('.btn-step');
await sleep(500);
await evaluate(`(() => { const s = document.querySelector('.ledger-row[data-species="fox"] .plan-slider'); s.value = -1; s.dispatchEvent(new Event('input', { bubbles: true })); })()`);
await clickSel('.btn-step');
await sleep(600);
await shot('tablet', 1024, 768);

// ---------- cover 1440x900 — art-directed staged moment -------------------
// food web ON + an active assignment with its drought banner visible
await setViewport(1440, 900);
await send('Page.navigate', { url });
await sleep(2600);
await evaluate('document.fonts.ready.then(() => 1)');
await clickSel('.biome-plate .btn-primary');
await sleep(400);
await evaluate(`[...document.querySelectorAll('.ch-pick')].find(b => /The Dry Summer/.test(b.textContent))?.click()`);
await sleep(300);
await clickSel('.exp-actions .btn[aria-pressed]'); // food web on
await sleep(400);
await clickSel('.btn-step'); // season 1 fires the drought event banner
await sleep(900); // banner settle + token animations done
await shot('cover', 1440, 900);

// ---------- mobile 390x844 — honest stacked field desk --------------------
await setViewport(390, 844);
await send('Page.navigate', { url });
await sleep(2600);
await evaluate('document.fonts.ready.then(() => 1)');
await clickSel('.biome-plate .btn-primary');
await sleep(400);
await shot('mobile', 390, 844);

try { chrome.kill(); } catch { /* already gone */ }
if (consoleErrors.length) {
  console.error('console errors during capture:', consoleErrors);
  process.exit(1);
}
console.log('done — no console errors');
