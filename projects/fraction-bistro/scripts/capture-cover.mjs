#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Cover capture: drives the LIVE app to a staged-but-real moment — the
// margherita 5/8 order cut into eighths, five slices plated, just served
// (SERVITO stamp + feedback + kitchen explanation visible) — and captures
// it. Depicts the actual shipped UI only (SCREENSHOTS.md: cover may use a
// staged state; desktop/tablet/mobile must stay honest defaults).
//
// Usage: node scripts/capture-cover.mjs <url> <outDir> [w] [h]

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2];
const outDir = resolve(process.argv[3] ?? '.');
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);
if (!url) {
  console.error('usage: node capture-cover.mjs <url> <outDir> [w] [h]');
  process.exit(2);
}

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  '--remote-debugging-port=9337',
  '--user-data-dir=' + resolve(outDir, '.cp-' + Date.now()),
  '--disk-cache-size=1',
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
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return r?.result?.value;
  };

  mkdirSync(outDir, { recursive: true });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await sleep(3000);

  // Staged moment: ord-014 (margherita 5/8) — cut into eighths, plate 5, serve.
  await evaluate(`document.querySelectorAll('.ticket')[13].click()`);
  await sleep(900);
  await evaluate(`(() => {
    const chip = [...document.querySelectorAll('.chip')].find(c => c.textContent.trim().startsWith('8'));
    chip.scrollIntoView({ block: 'center' });
    chip.click();
  })()`);
  await sleep(700);
  for (let i = 0; i < 5; i++) {
    await evaluate(`(() => {
      const slices = [...document.querySelectorAll('.slice-hit')];
      const el = slices[0] ?? slices[slices.length - 1];
      el.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, clientY: 0, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 0, clientY: 0, bubbles: true }));
    })()`);
    await sleep(220);
  }
  await evaluate(`(() => { const b = document.querySelector('.btn--primary'); b.scrollIntoView({ block: 'center' }); b.click(); })()`);
  await sleep(600); // stamp landed, feedback + explanation visible

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
