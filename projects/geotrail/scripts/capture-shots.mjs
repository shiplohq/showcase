#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Screenshot capture from a URL (local preview or the live Shiplo site).
//   cover  — staged-but-real moment: trail 1 open, stop 1 answered correct
//            (feedback + stamp visible). Depicts the shipped UI only.
//   desktop / tablet / mobile — honest default (atlas spread) at the three
//   required viewports.
//
// Usage: node scripts/capture-shots.mjs <url> <outDir>
// CDP port 9361 (geotrail's slice), fresh profile + 1-byte disk cache per
// run (pilot #01 lesson: persistent profiles serve stale hashed assets).

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9361;

const url = process.argv[2];
const outDir = resolve(process.argv[3] ?? '.shots');
if (!url) {
  console.error('usage: node capture-shots.mjs <url> <outDir>');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = resolve(outDir, `.cp-${Date.now()}`);
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + profile,
  '--disk-cache-size=1',
  '--media-cache-size=1',
  '--no-first-run',
  'about:blank',
]);

let ws;
let msgId = 0;
const pending = new Map();
const consoleErrors = [];

function send(method, params = {}) {
  return new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('eval failed: ' + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
  return r.result.value;
}

async function shot(name, w, h) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 900 });
  await sleep(450);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const file = resolve(outDir, `${name}.png`);
  writeFileSync(file, Buffer.from(r.data, 'base64'));
  console.log(`📸 ${name} (${w}x${h}) → ${file}`);
}

try {
  await sleep(2200);
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
    } else if (m.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(m.params.exceptionDetails.text);
    }
  };

  mkdirSync(outDir, { recursive: true });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  // -- honest defaults ------------------------------------------------------
  await send('Page.navigate', { url });
  await sleep(3200); // fonts + JSON settle

  const title = await evaluate('document.title');
  const mounted = await evaluate("!!document.querySelector('.atlas-spread') && document.querySelectorAll('.ledger-row').length === 4");
  if (!mounted) {
    const bodyText = await evaluate('document.body.innerText.slice(0, 500)');
    throw new Error('atlas screen did not render (4 ledger rows expected). Body: ' + (bodyText ?? '<empty>'));
  }
  console.log(`▶ ${url} — "${title}" — atlas renders 4 trail rows`);
  await shot('desktop', 1440, 900);
  await shot('tablet', 1024, 768);
  await shot('mobile', 390, 844);

  // -- staged cover: trail 1, stop 1 answered correct ------------------------
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate("document.querySelectorAll('.ledger-row')[0].click()");
  await sleep(1500);
  const trailOk = await evaluate("!!document.querySelector('.mission') && !!document.querySelector('.plate-stage svg polyline')");
  if (!trailOk) throw new Error('trail screen did not mount for staged cover');
  // answer stop 1 (locate Vietnam) via its chip
  await evaluate(`(() => {
    const chip = [...document.querySelectorAll('.place-chip')].find(b => /Vietnam/i.test(b.textContent));
    if (!chip) throw new Error('Vietnam chip not found');
    chip.click();
  })()`);
  await sleep(750); // feedback line + stamp award visible
  await shot('cover', 1440, 900);

  if (consoleErrors.length) {
    console.error('✖ console errors during capture:');
    for (const e of consoleErrors) console.error('   ' + e.slice(0, 240));
    process.exitCode = 1;
  } else {
    console.log('✔ capture complete — no console errors');
  }
} catch (err) {
  console.error('capture failed:', err.message);
  if (consoleErrors.length) {
    console.error('console errors at failure:');
    for (const e of consoleErrors) console.error('   ' + e.slice(0, 400));
  }
  process.exitCode = 1;
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
  process.exit();
}
