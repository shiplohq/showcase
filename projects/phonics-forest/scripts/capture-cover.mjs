#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Cover capture: drives the LIVE app to a staged-but-real state and captures
// 1440×900. The staged moment is the SH-TREE CLEARING FINALE: all six listen
// rounds answered, "The tree is awake!" caption, lantern-glow sign and 3/3
// fireflies lit — the app's peak moment (peak-end rule), captured from the
// actual shipped UI only (SCREENSHOTS.md: cover may stage a moment;
// desktop/tablet/mobile captures stay honest defaults).
//
// NOTE (deploy-2): on the live build as of 2026-09-01 the finale renders a
// stale berry "Next" action (src/screens/clearing.ts nextRound assigned
// state after finale() — fixed in source, pending redeploy). After deploy-2
// the finale actions become "Play again / Back to the forest"; if the cover
// is re-captured then, update the cover alt in showcase/metadata.json.

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
  '--remote-debugging-port=9346', '--user-data-dir=' + resolve(outDir, '.cp-' + Date.now()),
  '--disk-cache-size=1', '--no-first-run', 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await sleep(2200);
  const list = await (await fetch('http://127.0.0.1:9346/json/list')).json();
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
  const send = (method, params = {}) => new Promise((resolve2) => {
    const i = ++id;
    pending.set(i, { resolve: resolve2 });
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

  // Stage: master the sh tree — answer all six rounds.
  await evaluate(`document.querySelector('.tree-btn[data-tree="sh"]')?.click()`);
  await sleep(800);
  for (let round = 0; round < 6; round++) {
    const isPair = await evaluate(`!!document.querySelector('.leaf-btn .leaf-hidden-note')`);
    if (!isPair) {
      await evaluate(`(() => { const right = [...document.querySelectorAll('.leaf-btn')].find(l => l.querySelector('.leaf-grapheme')?.textContent.trim() === 'sh'); right?.setAttribute('data-cover-target','1'); })()`);
    } else {
      // no voices in headless: take the no-sound path (two misses → hint leaf)
      await evaluate(`document.querySelector('.leaf-btn')?.setAttribute('data-cover-target','1')`);
      await evaluate(`document.querySelector('[data-cover-target]')?.click()`);
      await sleep(250);
      await evaluate(`document.querySelector('[data-cover-target]')?.click()`);
      await sleep(350);
      await evaluate(`document.querySelector('.leaf-btn.hint')?.setAttribute('data-cover-target','1')`);
    }
    await evaluate(`document.querySelector('[data-cover-target]')?.click()`);
    await sleep(450);
    await evaluate(`[...document.querySelectorAll('.caption-btn-primary')].find(b => /next/i.test(b.textContent))?.click()`);
    await sleep(450);
  }
  // Wait for the finale frame before shooting (prompt + lit fireflies).
  const finaleReady = await evaluate(`(() => new Promise((resolve) => {
    const t0 = Date.now();
    const check = () => {
      const prompt = document.querySelector('.caption-prompt')?.textContent ?? '';
      const lit = [...document.querySelectorAll('.fly-slot')].filter(s => s.classList.contains('lit')).length;
      if (/tree is awake/i.test(prompt) && lit === 3) resolve(true);
      else if (Date.now() - t0 > 6000) resolve(false);
      else setTimeout(check, 150);
    };
    check();
  }))()`);
  if (!finaleReady) throw new Error('finale state not reached (prompt/fireflies)');
  await sleep(700); // wake animation settles into the glow frame

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const file = resolve(outDir, `cover-${width}x${height}.png`);
  writeFileSync(file, Buffer.from(shot.data, 'base64'));
  console.log('📸 cover staged capture (sh-tree finale) →', file);
  ws.close();
} catch (err) {
  console.error('cover capture failed:', err.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
  process.exit();
}
