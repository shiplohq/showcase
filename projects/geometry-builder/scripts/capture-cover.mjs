#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Cover capture: drives the LIVE app to a staged-but-real moment — the
// Mirror Bridge blueprint mid-build: deck plank and one support triangle on
// the sheet, the second triangle selected with its spec sheet showing, mirror
// line on the canvas — and captures it. Depicts the actual shipped UI only
// (SCREENSHOTS.md: cover may stage a moment; desktop/tablet/mobile stay
// honest defaults).

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
  '--remote-debugging-port=9344',
  '--user-data-dir=' + resolve(outDir, '.cp-' + Date.now()),
  '--disk-cache-size=1', '--media-cache-size=1', '--no-first-run', 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let list = null;
  for (let i = 0; i < 40 && !list; i++) {
    await sleep(300);
    try {
      const res = await fetch('http://127.0.0.1:9344/json/list');
      list = (await res.json()).find((t) => t.type === 'page') ?? null;
    } catch { /* wait */ }
  }
  if (!list) throw new Error('chrome devtools endpoint never appeared');
  const ws = new WebSocket(list.webSocketDebuggerUrl);
  await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result);
      pending.delete(m.id);
    }
  };
  const send = (method, params = {}) => new Promise((resolve2) => {
    const i = ++id;
    pending.set(i, resolve2);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evaluate = async (expression) =>
    (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
  const center = async (sel) =>
    evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  const click = async (sel) => {
    const pt = await center(sel);
    if (!pt) throw new Error('cover target missing: ' + sel);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
    await sleep(350);
  };

  mkdirSync(outDir, { recursive: true });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await sleep(3200);

  // Open "Mirror Bridge" (bridge-02) — tabs in order: H-01, H-02, H-03, B-01, B-02…
  await evaluate(`document.querySelectorAll('.mission-tab .tab-open')[4].click()`);
  await sleep(900);

  // Place the deck (rect-8x2): select in the bin, then PLACE ON SHEET.
  await click('.tray-piece:not(:disabled)');
  await sleep(250);
  await click('.insp-place');
  await sleep(450);

  // Place one support triangle the same way.
  await click('.tray-piece:not(:disabled)');
  await sleep(250);
  await click('.insp-place');
  await sleep(450);

  // Select the triangle on the sheet (last piece) → spec sheet + crop marks.
  await evaluate(`(() => { const els = document.querySelectorAll('g.piece'); els[els.length - 1].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); els[els.length - 1].dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); return true; })()`);
  await sleep(650); // selection marks + spec panel settle

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
