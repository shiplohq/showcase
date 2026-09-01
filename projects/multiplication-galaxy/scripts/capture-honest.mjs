#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Honest captures from the LIVE deployment (SCREENSHOTS.md): desktop = the
// default landing state (star chart); tablet = the hero education viewport in
// a real mission state (entered by real interaction, nothing staged);
// mobile = landing at 390×844. Cover is staged separately (capture-cover.mjs).
//
// Usage: node scripts/capture-honest.mjs <url> <outDir>

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2];
const outDir = resolve(process.argv[3] ?? '.');
if (!url) {
  console.error('usage: node capture-honest.mjs <url> <outDir>');
  process.exit(2);
}

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--window-size=1440,900',
  '--remote-debugging-port=9352',
  '--user-data-dir=' + resolve(outDir, '.honest-' + Date.now()),
  '--disk-cache-size=1',
  '--media-cache-size=1',
  '--no-first-run',
  'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await sleep(2200);
  const list = await (await fetch('http://127.0.0.1:9352/json/list')).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { resolve: r } = pending.get(m.id); pending.delete(m.id); r(m.result); }
  };
  const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, { resolve }); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value;
  const shot = async (name, w) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    const file = resolve(outDir, `${name}.png`);
    writeFileSync(file, Buffer.from(r.data, 'base64'));
    console.log(`📸 ${name} → ${file} (${w})`);
  };

  mkdirSync(outDir, { recursive: true });
  await send('Page.enable');

  // -- desktop 1440×900: honest landing (star chart default state) ----------
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await sleep(3200); // fonts + JSON + build-up settle
  await shot('desktop', '1440x900');

  // -- tablet 1024×768: hero viewport, real mission state --------------------
  await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
  await evaluate(`location.reload()`);
  await sleep(3000);
  await evaluate(`document.querySelectorAll('.constellation-btn')[3].click()`);
  await sleep(700);
  await evaluate(`document.querySelector('.overlay .btn-primary').click()`);
  await sleep(2400); // probe transfer + array build-up + settle
  await shot('tablet', '1024x768');

  // -- mobile 390×844: honest landing ----------------------------------------
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate(`location.reload()`);
  await sleep(3200);
  await shot('mobile', '390x844');

  ws.close();
} catch (err) {
  console.error('honest capture failed:', err.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
  process.exit();
}
