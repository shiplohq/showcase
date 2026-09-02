#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Screenshot capture from the LIVE deployment only (SCREENSHOTS.md). States:
//   board   — honest default landing (case board)
//   evidence— honest tablet hero: a freshly opened MARK case, nothing marked
//   staged  — art-directed cover: real case mid-investigation, two words
//             inked with the NOUN pen, clue 1 open (actual shipped UI)
// Usage: node capture-shots.mjs <url> <outDir> <board|evidence|staged> [w] [h]

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2];
const outDir = resolve(process.argv[3] ?? '.');
const state = process.argv[4] ?? 'board';
const width = Number(process.argv[5] ?? 1440);
const height = Number(process.argv[6] ?? 900);
if (!url) {
  console.error('usage: node capture-shots.mjs <url> <outDir> <state> [w] [h]');
  process.exit(2);
}

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', `--window-size=${width},${height}`,
  '--remote-debugging-port=9348', '--user-data-dir=' + resolve(outDir, '.cp-' + Date.now()),
  '--disk-cache-size=1', '--media-cache-size=1', '--no-first-run', 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await sleep(2200);
  const list = await (await fetch('http://127.0.0.1:9348/json/list')).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej; });
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
  const send = (method, params = {}) => new Promise((resolve) => {
    const i = ++id;
    pending.set(i, { resolve });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return r?.result?.value;
  };

  mkdirSync(outDir, { recursive: true });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 });
  await send('Page.navigate', { url });
  await sleep(3000);

  if (state !== 'board') {
    // open case 01 (The Sleepy Witness — MARK case)
    await evaluate(`document.querySelectorAll('.case-row')[0].click()`);
    await sleep(900);
  }
  if (state === 'staged') {
    // ink "dog" and "garden" with the NOUN pen, then open clue 1 — a real
    // mid-investigation moment on the shipped UI (no fake state)
    await evaluate(`(() => { const pens = document.querySelectorAll('.pen'); if (pens[0]) pens[0].click(); })()`);
    await sleep(250);
    await evaluate(`document.querySelectorAll('.token')[2].click()`);
    await sleep(350);
    await evaluate(`document.querySelectorAll('.token')[6].click()`);
    await sleep(500);
    await evaluate(`document.querySelector('.clue-btn').click()`);
    await sleep(900);
  }

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const file = resolve(outDir, `${state}-${width}x${height}.png`);
  writeFileSync(file, Buffer.from(shot.data, 'base64'));
  console.log(`📸 ${state} @ ${width}x${height} → ${file}`);
  ws.close();
} catch (err) {
  console.error(`${state} capture failed:`, err.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
  process.exit();
}
