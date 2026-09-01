// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
// One-off live audit: every network request the production page makes must
// stay on the deployment origin (no runtime CDN, no third-party hosts).
import { spawn } from 'node:child_process';
const TARGET = process.argv[2] ?? 'https://multiplication-galaxy.shiplo.site/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--window-size=1280,800', '--remote-debugging-port=9348', '--user-data-dir=' + process.env.TEMP + '\\mg-net-' + Date.now(), '--disk-cache-size=1', '--no-first-run', 'about:blank']);
await new Promise((r) => setTimeout(r, 2200));
const list = await (await fetch('http://127.0.0.1:9348/json/list')).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const requests = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  else if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url);
};
const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable');
await send('Network.enable');
await send('Page.navigate', { url: TARGET });
await new Promise((r) => setTimeout(r, 4000));
// Drive into a mission so JSON/fonts/all assets load.
await send('Runtime.evaluate', { expression: `document.querySelectorAll('.constellation-btn')[3]?.click()` });
await new Promise((r) => setTimeout(r, 900));
await send('Runtime.evaluate', { expression: `document.querySelector('.overlay .btn-primary')?.click()` });
await new Promise((r) => setTimeout(r, 1800));
const origin = new globalThis.URL(TARGET).origin;
const foreign = requests.filter((u) => !u.startsWith(origin));
console.log(`total requests: ${requests.length} · foreign: ${foreign.length}`);
for (const u of new Set(requests)) console.log(' ', u.slice(0, 110));
ws.close();
chrome.kill();
process.exit(foreign.length ? 1 : 0);
