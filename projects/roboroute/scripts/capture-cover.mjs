#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Cover capture: drives the LIVE app to a staged-but-real moment — mission
// "Spark Circuit" mid-run: REPEAT ×3 (F,L,F,R) executing with the round
// badge on 2/3, one spark collected, the dock ring at 1/3. The showcase
// "in use": room + tokens + program counter + status line in one frame.
// Depicts the actual shipped UI only (SCREENSHOTS.md: cover may stage a
// state; desktop/tablet/mobile captures stay honest defaults).

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2];
const outDir = resolve(process.argv[3] ?? '.');
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);
if (!url) {
  console.error('usage: node capture-cover.mjs <url> <outDir> [w] [h]');
  process.exit(2);
}

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', `--window-size=${width},${height}`,
  '--remote-debugging-port=9354', '--user-data-dir=' + resolve(outDir, '.cp-' + Date.now()),
  '--disk-cache-size=1', '--no-first-run', 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await sleep(2200);
  const list = await (await fetch('http://127.0.0.1:9354/json/list')).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
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
    const i = ++id; pending.set(i, { resolve }); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    return r?.result.value;
  };

  mkdirSync(outDir, { recursive: true });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await sleep(3000);

  // Mission "Spark Circuit" (loop-03).
  await evaluate(`[...document.querySelectorAll('.rr-plaque')].find(p => p.textContent.includes('Spark Circuit'))?.click()`);
  await sleep(900);

  // Build REPEAT(F,L,F,R) + F + F via the palette buttons (aria-labelled).
  const token = async (labelWant) => {
    await evaluate(`(() => {
      const b = [...document.querySelectorAll('.rr-palette .rr-token')].find(x => (x.getAttribute('aria-label') || '').includes(${JSON.stringify(labelWant)}));
      if (b) b.click();
    })()`);
    await sleep(220);
  };
  await token('repeat');
  // select the repeat tile, edit inside, fill body, back to main line
  await evaluate(`document.querySelector('.rr-tray .rr-tile-head')?.click()`);
  await sleep(280);
  await evaluate(`[...document.querySelectorAll('.rr-toolbar .rr-btn')].find(b => /edit inside/i.test(b.textContent))?.click()`);
  await sleep(280);
  await token('forward');
  await token('turn left');
  await token('forward');
  await token('turn right');
  await evaluate(`[...document.querySelectorAll('.rr-toolbar .rr-btn')].find(b => /back to main line/i.test(b.textContent))?.click()`);
  await sleep(280);
  await token('forward');
  await token('forward');
  await sleep(300);

  // Step into the second round of the repeat: 6 steps = F L F R F L
  // (round 2 begins at step 5; step 6 lands on the 2nd-row spark).
  for (let i = 0; i < 6; i++) {
    await evaluate(`[...document.querySelectorAll('.rr-controls .rr-btn')].find(b => /^step/i.test(b.textContent))?.click()`);
    await sleep(430);
  }
  await sleep(600); // robot tween settles

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
