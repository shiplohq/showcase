#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Generic headless-Chrome (CDP) verification driver — zero dependencies
// (raw WebSocket + DevTools protocol; Node 18+ has a global WebSocket).
// This shared version runs the GENERIC checks; project-specific interaction
// flows (clicking game beds, planting seeds, …) live per project:
// see projects/number-garden/scripts/cdp-driver.mjs as the reference
// implementation — copy it into projects/<slug>/scripts/ and adjust selectors.
//
// Generic flow (smoke):
//   - page loads, has a <title> and rendered body content
//   - zero console errors / uncaught exceptions
//   - every visible button ≥ 44px touch target
//   - prefers-reduced-motion emulated → app still renders
//   - screenshot(s) captured
//
// Usage:
//   node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow smoke]
//
// Lessons baked in (pilot #01): fresh user-data-dir + --disk-cache-size=1 on
// every run (a persistent profile serves a stale index.html → old hashed
// assets); Windows paths for --out (Chrome cannot write into Git Bash /tmp).

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const args = process.argv.slice(2);
const url = args[0];
const outDir = resolve(args[args.indexOf('--out') + 1] ?? '.shots');
const width = Number(args[args.indexOf('--w') + 1] ?? 1440);
const height = Number(args[args.indexOf('--h') + 1] ?? 900);
if (!url) {
  console.error('usage: node cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900]');
  process.exit(2);
}

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  '--remote-debugging-port=9340',
  '--user-data-dir=' + resolve(outDir, '.chrome-' + Date.now()),
  '--disk-cache-size=1',
  '--media-cache-size=1',
  '--no-first-run',
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const consoleErrors = [];
let failed = false;

try {
  await sleep(2200);
  const list = await (await fetch('http://127.0.0.1:9340/json/list')).json();
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
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
    } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      consoleErrors.push(m.params.entry.text);
    } else if (m.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(m.params.exceptionDetails.text);
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
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 900,
  });
  await send('Page.navigate', { url });
  await sleep(2800);

  console.log(`▶ ${url} @ ${width}x${height}`);

  const title = await evaluate('document.title');
  const hasContent = await evaluate(
    'document.body && document.body.innerText.trim().length > 0 && document.querySelectorAll("*").length > 10',
  );
  if (!title || !hasContent) throw new Error('page did not render real content');
  console.log(`  ✔ page renders ("${title}")`);

  const small = await evaluate(
    `[...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).length`,
  );
  if (small > 0) throw new Error(`${small} button(s) smaller than 44px`);
  console.log('  ✔ all visible buttons ≥ 44px');

  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await sleep(400);
  const stillRenders = await evaluate(
    'document.body && document.body.innerText.trim().length > 0',
  );
  if (!stillRenders) throw new Error('page empty under reduced motion');
  console.log('  ✔ prefers-reduced-motion emulated — content intact');

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const file = resolve(outDir, `smoke-${width}x${height}.png`);
  writeFileSync(file, Buffer.from(shot.data, 'base64'));
  console.log(`  📸 ${file}`);

  ws.close();
} catch (err) {
  console.error(`✖ ${err.message}`);
  failed = true;
} finally {
  chrome.kill();
  if (consoleErrors.length) {
    console.error(`✖ ${consoleErrors.length} console error(s):`);
    for (const e of consoleErrors) console.error('   ' + e.slice(0, 300));
    failed = true;
  }
  if (!failed) console.log(`\n✔ CDP smoke passed at ${width}x${height} — no console errors.`);
  process.exit(failed ? 1 : 0);
}
