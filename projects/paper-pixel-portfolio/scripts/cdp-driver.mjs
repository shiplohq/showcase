#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Project CDP driver (adapted from scripts/cdp-driver.mjs at the repo root —
// see projects/number-garden/scripts/cdp-driver.mjs as the reference).
// Dedicated port range 9401–9409 so concurrent showcase agents never collide.
//
// Extra knobs for this portfolio:
//   --hash '#/work/atlas-identity'   append a hash route before capture
//   --focus-row 2                    focus the nth index row (lightbox + focus ring)
//   --name cover                     screenshot file prefix
//
// Usage:
//   node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900]
//        [--hash '#/…'] [--focus-row N] [--name prefix] [--port 9401]

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const args = process.argv.slice(2);
const url = args[0];
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const outDir = resolve(flag('--out', '.shots'));
const width = Number(flag('--w', 1440));
const height = Number(flag('--h', 900));
const port = Number(flag('--port', 9401));
const hash = flag('--hash', null);
const focusRow = Number(flag('--focus-row', 0));
const name = flag('--name', 'shot');
if (!url) {
  console.error('usage: node cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--hash h] [--focus-row N] [--name p]');
  process.exit(2);
}

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  `--remote-debugging-port=${port}`,
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
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
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
  await send('Page.navigate', { url: url + (hash ?? '') });
  await sleep(2800);

  console.log(`▶ ${url}${hash ?? ''} @ ${width}x${height}`);
  console.log(`  · location = ${await evaluate('location.href')}`);
  console.log(`  · lead = ${JSON.stringify(String(await evaluate('document.body.innerText.slice(0, 160)')))}`);

  const title = await evaluate('document.title');
  const hasContent = await evaluate(
    'document.body && document.body.innerText.trim().length > 0 && document.querySelectorAll("*").length > 10',
  );
  if (!title || !hasContent) throw new Error('page did not render real content');
  console.log(`  ✔ page renders ("${title}")`);

  if (focusRow > 0) {
    const focused = await evaluate(
      `(() => { const rows = document.querySelectorAll('.index-row'); const r = rows[${focusRow - 1}]; if (!r) return false; r.focus(); return document.activeElement === r; })()`,
    );
    if (!focused) throw new Error(`could not focus index row ${focusRow}`);
    await sleep(500); // lightbox swap + focus ring settle
    console.log(`  ✔ focused index row ${focusRow}`);
  }

  // Real pointer hover (headless quirk: programmatic .focus() fires no focus
  // events when the window lacks focus — real input events always work).
  const hoverRow = Number(flag('--hover-row', 0));
  if (hoverRow > 0) {
    const box = await evaluate(
      `(() => { const r = document.querySelectorAll('.index-row')[${hoverRow - 1}]; if (!r) return null; const b = r.getBoundingClientRect(); return b.x + ',' + b.y + ',' + b.width + ',' + b.height; })()`,
    );
    if (!box) throw new Error(`could not find index row ${hoverRow}`);
    const [x, y, w, h] = box.split(',').map(Number);
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: Math.round(x + w * 0.4),
      y: Math.round(y + h / 2),
    });
    await sleep(600); // lightbox plate swap settles
    console.log(`  ✔ hovered index row ${hoverRow}`);
  }

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
  const file = resolve(outDir, `${name}-${width}x${height}.png`);
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
  if (!failed) console.log(`\n✔ CDP capture passed at ${width}x${height} — no console errors.`);
  process.exit(failed ? 1 : 0);
}
