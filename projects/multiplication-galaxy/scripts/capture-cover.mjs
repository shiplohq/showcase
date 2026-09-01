#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Cover capture: drives the LIVE app to a staged-but-real moment and captures
// it. Staged state: Table of 4 · Quartet Cluster, fact 4 × 6 = ? answered —
// orbit locked (rings mineral + registration ticks), skip-count label showing
// the full product, "Orbit locked" feedback visible. Depicts the actual
// shipped UI only (SCREENSHOTS.md: cover may stage; others stay honest).
//
// Usage: node scripts/capture-cover.mjs <url> <outDir> [w] [h]

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2];
const outDir = resolve(process.argv[3] ?? '.');
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);
if (!url) {
  console.error('usage: node capture-cover.mjs <url> <outDir> [w] [h]');
  process.exit(2);
}

// Fresh profile + no disk cache (pilot lesson: stale cached index.html).
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  '--remote-debugging-port=9337',
  '--user-data-dir=' + resolve(outDir, '.cp-' + Date.now()),
  '--disk-cache-size=1',
  '--media-cache-size=1',
  '--no-first-run',
  'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await sleep(2200);
  const list = await (await fetch('http://127.0.0.1:9337/json/list')).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, rej) => {
    ws.onopen = r;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve: r } = pending.get(m.id);
      pending.delete(m.id);
      r(m.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const i = ++id;
      pending.set(i, { resolve });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    return r?.result?.value;
  };

  mkdirSync(outDir, { recursive: true });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 });
  await send('Page.navigate', { url });
  await sleep(3000);

  // Enter Table of 4 (Quartet Cluster) — its second fact is exactly 4 × 6.
  await evaluate(`document.querySelectorAll('.constellation-btn')[2].click()`);
  await sleep(700);
  await evaluate(`document.querySelector('.overlay .btn-primary').click()`);
  await sleep(1300); // probe transfer + array build-up settle
  // Skip fact 1 (2×4) by answering correctly.
  await evaluate(`(() => { const h = document.querySelector('.fact-headline').textContent; const m = h.match(/(\\d+) × (\\d+)/); const v = Number(m[1]) * Number(m[2]); [...document.querySelectorAll('.answer-node')].find(n => Number(n.querySelector('.node-value').textContent) === v)?.click(); })()`);
  await sleep(900);
  await evaluate(`document.querySelector('.next-fact')?.click()`);
  await sleep(1100); // now on 4 × 6 = ?
  // Answer 4 × 6 correctly → lock morph (ellipse → circle) + ticks draw in.
  await evaluate(`(() => { const nodes = [...document.querySelectorAll('.answer-node')]; nodes.find(n => Number(n.querySelector('.node-value').textContent) === 24)?.click(); })()`);
  await sleep(750); // lock choreography completes
  // Then light every ring with the skip-count (review of the stable system).
  for (let i = 0; i < 4; i++) {
    await evaluate(`document.querySelector('.count-btn')?.click()`);
    await sleep(240);
  }
  await sleep(400);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const file = resolve(outDir, `cover-${width}x${height}.png`);
  writeFileSync(file, Buffer.from(shot.data, 'base64'));
  console.log('📸 cover staged capture →', file);
  ws.close();
} catch (err) {
  console.error('cover capture failed:', err.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
  process.exit();
}
