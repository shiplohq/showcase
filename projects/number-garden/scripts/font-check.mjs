#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Font verifier: loads the URL headless, waits for document.fonts.ready, then
// reports (a) loaded font faces, (b) whether Baloo 2/Nunito cover both base
// latin+digits and Vietnamese diacritics via document.fonts.check — the
// broken-font regression guard for the @fontsource subset issue.

import { spawn } from 'node:child_process';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2] ?? 'http://localhost:4655/';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--window-size=1024,768',
  '--remote-debugging-port=9338', '--user-data-dir=D:/tmp-font-' + Date.now(),
  '--no-first-run', 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await sleep(2000);
  const list = await (await fetch('http://127.0.0.1:9338/json/list')).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej; });
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
  await send('Page.enable');
  await send('Page.navigate', { url });
  await sleep(2500);
  const r = await send('Runtime.evaluate', {
    expression: `(async () => {
      await document.fonts.ready;
      const check = (spec, sample) => document.fonts.check(spec, sample);
      return {
        loadedFaces: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight + ' ' + f.unicodeRange.slice(0, 24)),
        balooLatin: check('700 20px "Baloo 2"', 'Khu vuon 123'),
        balooVietnamese: check('700 20px "Baloo 2"', 'Khu vườn số học ơ ư ạ ế'),
        nunitoLatin: check('600 18px Nunito', 'abc 789'),
        nunitoVietnamese: check('600 18px Nunito', 'ườ ệ ữ đ ươ'),
        headingFont: getComputedStyle(document.querySelector('h1') || document.body).fontFamily,
      };
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  console.log(JSON.stringify(r.result.value, null, 1));
  ws.close();
} catch (err) {
  console.error('font check failed:', err.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
  process.exit();
}
