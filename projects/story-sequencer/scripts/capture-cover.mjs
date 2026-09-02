#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Cover capture: drives the LIVE app to a staged-but-real moment — issue 1
// solved into order with time clues underlined, then both cause-effect
// connectors drawn on the LINK step — and captures it. Depicts the actual
// shipped UI only (SCREENSHOTS.md: cover may use a staged state; the honest
// desktop/tablet/mobile captures come from default states).

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
  '--headless=new', '--disable-gpu', `--window-size=${width},${height}`,
  '--remote-debugging-port=9346', '--user-data-dir=' + resolve(outDir, '.cp-' + Date.now()),
  '--disk-cache-size=1', '--media-cache-size=1', '--no-first-run', 'about:blank',
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

  const truth = await evaluate(`fetch(new URL('data/stories.json', document.baseURI)).then(r => r.json()).then(d => d.stories[0])`);
  const canonical = truth.canonicalOrder;

  // Open issue 1, solve the order with the same move buttons a kid uses.
  await evaluate(`document.querySelector('.issue').click()`);
  await sleep(700);
  for (let i = 0; i < canonical.length; i++) {
    for (let guard = 0; guard < 40; guard++) {
      const at = await evaluate(`[...document.querySelectorAll('.panel')].findIndex(p => p.getAttribute('data-panel-id') === ${JSON.stringify(canonical[i])})`);
      if (at === i) break;
      const dir = at < i ? 'later' : 'earlier';
      await evaluate(`(() => { const li = document.querySelector('.panel[data-panel-id=${JSON.stringify(canonical[i])}]'); [...li.querySelectorAll('.mv')].find(b => b.getAttribute('aria-label').includes('${dir}')).click(); })()`);
      await sleep(90); // fast staging; Flip animates at its own pace
    }
  }
  // Hint on, then into the LINK step and draw every connector.
  await evaluate(`document.querySelector('.board__hint').click()`);
  await sleep(400);
  await evaluate(`document.querySelector('.board__cta .btn--primary').click()`);
  await sleep(600);
  for (const [from, to] of truth.causalLinks) {
    await evaluate(`document.querySelector('.panel[data-panel-id="${from}"]').click()`);
    await sleep(180);
    await evaluate(`document.querySelector('.panel[data-panel-id="${to}"]').click()`);
    await sleep(650);
  }
  await sleep(400); // connectors + endpoint chips settled

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
