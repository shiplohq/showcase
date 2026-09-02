#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Screenshot capture from the LIVE deployment only (docs/SCREENSHOTS.md).
//   cover   1440x900 — art-directed STAGED state: home scene mid-label-match,
//            two annotations pinned, caption plate open, tray with words.
//   desktop 1440x900 — honest default landing (expedition map).
//   tablet  1024x768 — honest scene screen, look-around with one caption plate
//            (two real clicks deep — the hero education viewport).
//   mobile  390x844  — honest default landing (expedition map).
// Depicts only the real shipped UI. PNG output; converted to webp by ffmpeg
// in the publish step.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2];
const outDir = resolve(process.argv[3] ?? '.');
if (!url) {
  console.error('usage: node capture-shots.mjs <live-url> <outDir>');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function session(port, w, h, name, fn) {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', `--window-size=${w},${h}`,
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + resolve(outDir, `.cp-${name}-${Date.now()}`),
    '--disk-cache-size=1', '--media-cache-size=1', '--no-first-run', 'about:blank',
  ]);
  try {
    await sleep(2400);
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej; });
    let id = 0;
    const pending = new Map();
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    };
    const send = (method, params = {}) => new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
    const evaluate = async (expression) =>
      (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const shot = async (file) => {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(resolve(outDir, file), Buffer.from(r.data, 'base64'));
      console.log(`📸 ${file}`);
    };
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 900 });
    await send('Page.navigate', { url });
    await sleep(3200);
    await fn({ evaluate, shot, sleep });
    ws.close();
  } catch (err) {
    console.error(`${name} capture failed:`, err.message);
    process.exitCode = 1;
  } finally {
    chrome.kill();
    await sleep(400);
  }
}

mkdirSync(outDir, { recursive: true });

// -- cover: staged mid-lesson moment on the live app --------------------------
await session(9337, 1440, 900, 'cover', async ({ evaluate, shot, sleep }) => {
  await evaluate(`document.querySelector('.map-marker').click()`);
  await sleep(900);
  await evaluate(`[...document.querySelectorAll('.dock button')].find(b => b.textContent.includes('Start the clue hunt')).click()`);
  await sleep(400);
  for (const hid of ['sofa', 'clock', 'lamp', 'plant']) {
    await evaluate(`(() => { const el = document.querySelector('[data-hotspot="${hid}"]'); el.scrollIntoView({block:'center'}); el.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, pointerId:1, clientX:0, clientY:0})); el.click(); })()`);
    await sleep(450);
    await evaluate(`[...document.querySelectorAll('.dock button')].find(b => b.textContent.includes('Next clue'))?.click()`);
    await sleep(350);
  }
  await sleep(700); // labels tab active
  // pin labels via REAL pointer events — chips pick up on pointerdown/up
  // (their @click is prevented), so synthetic .click() would no-op
  for (const w of ['picture', 'bookshelf', 'sofa']) {
    const dispatched = await evaluate(`(() => {
      const chip = [...document.querySelectorAll('.dock .chip')].find(c => c.textContent.trim() === '${w}');
      if (!chip) return 'NO CHIP';
      const r = chip.getBoundingClientRect();
      const mk = (type) => new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 5, pointerType: 'mouse', isPrimary: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, button: 0, buttons: type === 'pointerup' ? 0 : 1 });
      chip.dispatchEvent(mk('pointerdown'));
      chip.dispatchEvent(mk('pointerup'));
      return 'ok';
    })()`);
    await sleep(300);
    const holding = await evaluate(`document.querySelector('.dock .hint')?.textContent?.includes('Holding') ?? false`);
    await evaluate(`(() => { const el = document.querySelector('[data-hotspot="${w}"]'); if (el) el.click(); })()`);
    await sleep(500);
    console.log(`  stage pin ${w}: ${dispatched}, holding=${holding}`);
  }
  // GUARD: the staged state must actually exist before we shoot it
  const staged = await evaluate(`(() => ({
    ann: document.querySelectorAll('.annotation').length,
    pinned: document.querySelector('.dock-head .count')?.textContent ?? '',
    tab: document.querySelector('.dock').getAttribute('data-tab'),
  }))()`);
  console.log('  staged state:', JSON.stringify(staged));
  if (staged.ann < 3) throw new Error(`cover staging failed: only ${staged.ann} annotations pinned (tab ${staged.tab})`);
  // drop focus so no hotspot carries a focus ring into the shot
  await evaluate(`(() => { document.activeElement?.blur?.(); return true; })()`);
  await evaluate(`document.querySelector('.art-wrap').scrollIntoView({ block: 'center' })`);
  await sleep(600);
  await shot('cover-1440x900.png');
});

// -- desktop: honest default landing ------------------------------------------
await session(9338, 1440, 900, 'desktop', async ({ shot }) => {
  await shot('desktop-1440x900.png');
});

// -- tablet: honest scene explore (two real clicks deep) ----------------------
await session(9339, 1024, 768, 'tablet', async ({ evaluate, shot, sleep }) => {
  await evaluate(`document.querySelector('.map-marker').click()`);
  await sleep(1000);
  await evaluate(`document.querySelector('[data-hotspot="sofa"]').click()`);
  await sleep(600);
  await evaluate(`document.querySelector('.art-wrap').scrollIntoView({ block: 'center' })`);
  await sleep(400);
  await shot('tablet-1024x768.png');
});

// -- mobile: honest default landing -------------------------------------------
await session(9340, 390, 844, 'mobile', async ({ shot }) => {
  await shot('mobile-390x844.png');
});

process.exit(process.exitCode ?? 0);
