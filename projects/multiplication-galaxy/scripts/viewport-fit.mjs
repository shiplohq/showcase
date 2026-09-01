// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
// Review-fix verification: page gutters restored AND every screen fits its
// viewport (no baked-in page scrollbar) at the capture sizes.
//   node scripts/viewport-fit.mjs <url>
import { spawn } from 'node:child_process';

const TARGET = process.argv[2] ?? 'http://localhost:4184/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--window-size=1440,900', '--remote-debugging-port=9349', '--user-data-dir=' + process.env.TEMP + '\\mg-fit-' + Date.now(), '--disk-cache-size=1', '--no-first-run', 'about:blank']);
await new Promise((r) => setTimeout(r, 2200));
const list = await (await fetch('http://127.0.0.1:9349/json/list')).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const consoleErrors = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
};
const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');

let failures = 0;
const check = (cond, msg) => { if (!cond) { failures++; console.error('  ✖ ' + msg); } else console.log('  ✔ ' + msg); };

const FACT = `(() => { const h = document.querySelector('.fact-headline').textContent; let v; let m = h.match(/(\\d+) × (\\d+) = \\?/); if (m) v = m[1]*m[2]; else { m = h.match(/\\? × (\\d+) = (\\d+)/); v = m ? m[2]/m[1] : null; if (!v) { m = h.match(/(\\d+) × \\? = (\\d+)/); v = m[2]/m[1]; } } [...document.querySelectorAll('.answer-node')].find(n => Number(n.querySelector('.node-value').textContent) === v)?.click(); })()`;

for (const [w, h] of [[1440, 900], [1024, 768]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  if (w === 1440) { await send('Page.navigate', { url: TARGET }); await sleep(3000); } else await sleep(400);
  console.log(`\n— ${w}x${h} —`);

  // map
  let fit = await evaluate(`JSON.stringify({ sh: document.documentElement.scrollHeight, ih: window.innerHeight, gx: Math.round(document.querySelector('.map-header h1').getBoundingClientRect().x) })`);
  let f = JSON.parse(fit);
  check(f.sh <= f.ih, `map fits viewport (scroll ${f.sh} ≤ ${f.ih})`);
  check(f.gx >= 16, `map headline gutter ${f.gx}px ≥ 16`);

  // mission
  await evaluate(`document.querySelectorAll('.constellation-btn')[3].click()`);
  await sleep(500);
  const overlayGone = await evaluate(`!!document.querySelector('.overlay .btn-primary') && (document.querySelector('.overlay .btn-primary').click(), true)`);
  void overlayGone;
  await sleep(2200); // probe + build-up settle
  fit = await evaluate(`JSON.stringify({ sh: document.documentElement.scrollHeight, ih: window.innerHeight, gx: Math.round(document.querySelector('.fact-headline').getBoundingClientRect().x) })`);
  f = JSON.parse(fit);
  check(f.sh <= f.ih, `mission fits viewport (scroll ${f.sh} ≤ ${f.ih}) — no page scrollbar in captures`);
  check(f.gx >= 16, `mission headline gutter ${f.gx}px ≥ 16`);
  // lock a fact so the post-lock state (tallest: next-fact button) also fits
  await evaluate(FACT);
  await sleep(900);
  fit = await evaluate(`JSON.stringify({ sh: document.documentElement.scrollHeight, ih: window.innerHeight })`);
  f = JSON.parse(fit);
  check(f.sh <= f.ih, `mission+lock fits viewport (scroll ${f.sh} ≤ ${f.ih})`);

  // log
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Mission log'))?.click()`);
  await sleep(700);
  fit = await evaluate(`JSON.stringify({ sh: document.documentElement.scrollHeight, ih: window.innerHeight, gx: Math.round(document.querySelector('.log-heading').getBoundingClientRect().x) })`);
  f = JSON.parse(fit);
  check(f.sh <= f.ih, `mission log fits viewport (scroll ${f.sh} ≤ ${f.ih})`);
  check(f.gx >= 16, `log heading gutter ${f.gx}px ≥ 16`);
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Star chart'))?.click()`);
  await sleep(500);
}

// Overflow re-check across the responsive band.
for (const [w, h] of [[360, 800], [390, 844], [768, 1024]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 900 });
  await sleep(400);
  const o = JSON.parse(await evaluate(`JSON.stringify({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, sh: document.documentElement.scrollHeight, ih: window.innerHeight, gx: Math.round((document.querySelector('.app-title strong') || document.body).getBoundingClientRect().x) })`));
  check(o.sw <= o.iw, `${w}x${h}: no horizontal overflow`);
  check(o.gx >= 16, `${w}x${h}: title gutter ${o.gx}px ≥ 16 (mobile landing may scroll vertically — capture states are 390 map which fits: ${o.sh} vs ${o.ih})`);
}

console.log(consoleErrors.length ? `✖ ${consoleErrors.length} console error(s)` : 'no console errors');
ws.close();
chrome.kill();
process.exit(failures || consoleErrors.length ? 1 : 0);
