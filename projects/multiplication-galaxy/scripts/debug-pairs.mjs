// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
// Debug: dump closest satellite pairs (ring attribution + transforms) at 1440.
import { spawn } from 'node:child_process';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.argv[2] ?? 'http://localhost:4184/';
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--window-size=1440,900', '--remote-debugging-port=9345', '--user-data-dir=' + process.env.TEMP + '\\mg-dbg-' + Date.now(), '--disk-cache-size=1', '--no-first-run', 'about:blank']);
await new Promise((r) => setTimeout(r, 2200));
const list = await (await fetch('http://127.0.0.1:9345/json/list')).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send('Page.enable');
await send('Page.navigate', { url: URL });
await sleep(2600);
await evaluate(`document.querySelectorAll('.constellation-btn')[10].click()`);
await sleep(600);
await evaluate(`document.querySelector('.overlay .btn-primary').click()`);
await sleep(1500);
for (let i = 0; i < 5; i++) {
  await evaluate(`(() => { const h = document.querySelector('.fact-headline').textContent; let v; let m = h.match(/(\\d+) × (\\d+) = \\?/); if (m) v = m[1]*m[2]; else { m = h.match(/\\? × (\\d+) = (\\d+)/); v = m ? m[2]/m[1] : null; if (!v) { m = h.match(/(\\d+) × \\? = (\\d+)/); v = m[2]/m[1]; } } [...document.querySelectorAll('.answer-node')].find(n => Number(n.querySelector('.node-value').textContent) === v)?.click(); })()`);
  await sleep(750);
  await evaluate(`document.querySelector('.next-fact')?.click()`);
  await sleep(500);
}
const out = await evaluate(`(() => {
  const sats = [...document.querySelectorAll('.sat')];
  const info = sats.map((g) => {
    const r = g.getBoundingClientRect();
    const ringGroup = g.closest('.ring-group');
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, ring: [...document.querySelectorAll('.ring-group')].indexOf(ringGroup), tf: g.getAttribute('transform'), gtf: ringGroup.querySelector('.ring-drift').getAttribute('transform') };
  });
  const pairs = [];
  for (let i = 0; i < info.length; i++) for (let j = i + 1; j < info.length; j++) {
    const d = Math.hypot(info[i].x - info[j].x, info[i].y - info[j].y);
    pairs.push({ d: Math.round(d * 100) / 100, i, j, ri: info[i].ring, rj: info[j].ring });
  }
  pairs.sort((a, b) => a.d - b.d);
  return { headline: document.querySelector('.fact-headline').textContent.trim(), worst: pairs.slice(0, 6), sample: info.slice(0, 3) };
})()`);
console.log(JSON.stringify(out, null, 1));
ws.close();
chrome.kill();
process.exit(0);
