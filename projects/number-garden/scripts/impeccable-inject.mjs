#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// One-off helper: inject the impeccable detector (http://localhost:8400/detect.js)
// into the app via CDP, collect `impeccable` console messages, print them.

import { spawn } from 'node:child_process';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = process.argv[2] ?? 'http://localhost:4655/';
const DETECT = 'http://localhost:8400/detect.js';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--window-size=1440,900',
  '--remote-debugging-port=9336', '--user-data-dir=D:/tmp-inject-' + Date.now(),
  '--no-first-run', 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await sleep(2200);
  const list = await (await fetch('http://127.0.0.1:9336/json/list')).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const messages = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    } else if (m.method === 'Runtime.consoleAPICalled') {
      const text = m.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
      messages.push(`[${m.params.type}] ${text}`);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id;
    pending.set(i, { resolve, reject });
    ws.send(JSON.stringify({ id: i, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: APP });
  await sleep(2500);

  // Preflight: can we mutate the page?
  const mut = await send('Runtime.evaluate', {
    expression: `(() => { document.title = document.title + '·'; const s = document.createElement('script'); s.textContent = '/*probe*/'; document.head.appendChild(s); return true; })()`,
  });
  if (mut.exceptionDetails) throw new Error('mutation preflight failed');
  console.log('mutation preflight: OK');

  // Inject detector on home, then on play screen (3 representative states)
  const states = ['home'];
  await send('Runtime.evaluate', {
    expression: `(() => { const s = document.createElement('script'); s.src = ${JSON.stringify(DETECT)}; document.head.appendChild(s); return 'injected'; })()`,
  });
  await sleep(2500);
  await send('Runtime.evaluate', { expression: `document.querySelectorAll('.bed')[1]?.click()` });
  await sleep(1200);
  states.push('play');
  await send('Runtime.evaluate', {
    expression: `(() => { const s = document.createElement('script'); s.src = ${JSON.stringify(DETECT + '?r=2')} ; document.head.appendChild(s); return 'injected'; })()`,
  });
  await sleep(2500);

  console.log(`detector ran on: ${states.join(', ')}`);
  const start = messages.findIndex((m) => /impeccable/.test(m));
  console.log(`--- console from first impeccable message (${start >= 0 ? start : 0}) ---`);
  for (const m of messages.slice(Math.max(0, start))) console.log(m.slice(0, 500));
  ws.close();
} catch (err) {
  console.error('inject failed:', err.message);
} finally {
  chrome.kill();
  process.exit(0);
}
