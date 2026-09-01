// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
// One-off responsive audit helper: no horizontal scroll at any breakpoint.
import { spawn } from 'node:child_process';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--window-size=380,800', '--remote-debugging-port=9341', '--user-data-dir=' + process.env.TEMP + '\\mg-of-' + Date.now(), '--disk-cache-size=1', '--no-first-run', 'about:blank']);
await new Promise((r) => setTimeout(r, 2200));
const list = await (await fetch('http://127.0.0.1:9341/json/list')).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
const send = (method, params = {}) => new Promise((resolve) => {
  const i = ++id;
  pending.set(i, resolve);
  ws.send(JSON.stringify({ id: i, method, params }));
});
let bad = 0;
for (const [w, h] of [[360, 800], [390, 844], [768, 1024], [1024, 768], [1440, 900]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 900 });
  if (w === 360) {
    await send('Page.navigate', { url: 'http://localhost:4184/' });
    await new Promise((r) => setTimeout(r, 2500));
  } else await new Promise((r) => setTimeout(r, 400));
  const r = await send('Runtime.evaluate', {
    expression: 'JSON.stringify({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })',
    returnByValue: true,
  });
  const { sw, iw } = JSON.parse(r.result.value);
  const ok = sw <= iw;
  if (!ok) bad++;
  console.log(`${w}x${h}: scrollWidth=${sw} innerWidth=${iw} ${ok ? 'OK' : 'HORIZONTAL OVERFLOW'}`);
}
ws.close();
chrome.kill();
process.exit(bad ? 1 : 0);
