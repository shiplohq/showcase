#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Final gallery capture — screenshots from the VERIFIED LIVE Shiplo
// deployment only (docs/SCREENSHOTS.md: never localhost, never preview).
// Writes PNGs to showcase/ scratch, converted to webp by ffmpeg afterwards.
//
//   node scripts/capture-live.mjs <live-url>
//
// Captures:
//   cover  1440x900 — art-directed STAGED state: mission 04 (Carbon) open,
//                     bench built to 6p/6n/[2,4] minus one shell-2 electron
//                     (mid-forge, teaching note live, periodic strip stamped).
//   desktop 1440x900 — honest default landing state (ledger, fresh progress).
//   tablet 1024x768 — honest hero: mission 01 open, one proton placed
//                     (identity reads Hydrogen).
//   mobile 390x844 — honest stacked forge (mission 01, one proton placed).

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const URL_BASE = process.argv[2];
if (!URL_BASE) {
  console.error('usage: node scripts/capture-live.mjs <live-url>');
  process.exit(2);
}
const OUT = resolve('.shots/live');
mkdirSync(OUT, { recursive: true });

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9360 + (process.pid % 30);
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu',
  `--remote-debugging-port=${port}`,
  '--user-data-dir=' + resolve(OUT, `.chrome-profile-${Date.now()}`),
  '--disk-cache-size=1', '--media-cache-size=1', '--no-first-run', 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(1700);
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const consoleErrors = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
  else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') consoleErrors.push(m.params.entry.text);
};
const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
  return r.result.value;
};
const clickStepper = (match) => evaluate(`(() => { const b = [...document.querySelectorAll('.stepper')].find(b => b.getAttribute('aria-label')?.includes(${JSON.stringify(match)}) && !b.disabled); if (!b) return false; b.click(); return true; })()`);

async function setViewport(w, h) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 900 });
}

async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const file = resolve(OUT, `${name}.png`);
  writeFileSync(file, Buffer.from(r.data, 'base64'));
  console.log(`  📸 ${name} → ${file}`);
}

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');

try {
  // ------------------------------------------------------------------ cover
  await setViewport(1440, 900);
  await send('Page.navigate', { url: URL_BASE });
  await sleep(2800);
  // Pre-seed progress through mission 03 so mission 04 (Carbon) is unlocked,
  // then open it and build a mid-forge state: 6p, 6n, electrons [2,3].
  await evaluate(`localStorage.setItem('atom-forge.progress.v1', JSON.stringify(['m01-first-spark','m02-full-first-shell','m03-third-proton']))`);
  await send('Page.navigate', { url: URL_BASE });
  await sleep(2600);
  await evaluate(`document.querySelector('[data-testid="mission-row-3"]').click()`);
  await sleep(800);
  for (let i = 0; i < 6; i++) await clickStepper('Add one proton');
  for (let i = 0; i < 6; i++) await clickStepper('Add one neutron');
  await clickStepper('Add one electron to shell 1');
  await clickStepper('Add one electron to shell 1');
  await clickStepper('Add one electron to shell 2');
  await clickStepper('Add one electron to shell 2');
  await clickStepper('Add one electron to shell 2');
  await sleep(1400); // settle: pop-in, jitter, shell pulse done
  await shot('cover-1440x900');

  // --------------------------------------------------------------- desktop
  await evaluate(`localStorage.clear()`);
  await send('Page.navigate', { url: URL_BASE });
  await sleep(2600);
  await shot('desktop-1440x900');

  // ---------------------------------------------------------------- tablet
  await setViewport(1024, 768);
  await sleep(600);
  await evaluate(`document.querySelector('[data-testid="mission-row-0"]').click()`);
  await sleep(800);
  await clickStepper('Add one proton');
  await sleep(1200);
  await shot('tablet-1024x768');

  // ---------------------------------------------------------------- mobile
  await setViewport(390, 844);
  await sleep(600);
  await shot('mobile-390x844');

  if (consoleErrors.length) {
    console.error(`✖ ${consoleErrors.length} console error(s) on live:`);
    for (const e of consoleErrors) console.error('  ' + e.slice(0, 240));
    process.exitCode = 1;
  } else {
    console.log('✔ live captures done — no console errors');
  }
} catch (err) {
  console.error('✖ capture failed: ' + (err.message ?? err));
  process.exitCode = 1;
} finally {
  try { ws.close(); } catch {}
  try { chrome.kill(); } catch {}
}
