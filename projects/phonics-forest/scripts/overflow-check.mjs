#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Overflow assertion: at 1440×900 and 1024×768 the app must never scroll
// horizontally, and the forest stage must not scroll vertically on the
// default grove screen (education hero fit). Reports measurements + verdict.

import { spawn } from 'node:child_process';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2];
if (!url) {
  console.error('usage: node overflow-check.mjs <url>');
  process.exit(2);
}

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--window-size=1440,900',
  '--remote-debugging-port=9348', '--user-data-dir=' + process.cwd() + `\\.shots\\.ovf-${Date.now()}`,
  '--disk-cache-size=1', '--no-first-run', 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = false;

try {
  await sleep(2200);
  const list = await (await fetch('http://127.0.0.1:9348/json/list')).json();
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
  const send = (method, params = {}) => new Promise((resolve2) => {
    const i = ++id;
    pending.set(i, { resolve: resolve2 });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return r?.result?.value;
  };
  await send('Page.enable');

  for (const [w, h] of [[1440, 900], [1024, 768]]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url });
    await sleep(2600);
    const m = await evaluate(`(() => {
      const doc = document.documentElement;
      const stage = document.querySelector('.stage');
      return {
        hScroll: doc.scrollWidth > doc.clientWidth,
        docW: doc.scrollWidth, clientW: doc.clientWidth,
        stageScrollH: stage?.scrollHeight ?? 0, stageClientH: stage?.clientHeight ?? 0,
        screen: stage?.dataset.screen ?? document.querySelector('.grove') ? 'grove' : '?',
      };
    })()`);
    const stageOverflow = m.stageScrollH - m.stageClientH;
    const ok = !m.hScroll && stageOverflow <= 0;
    if (!ok) failed = true;
    console.log(
      `${ok ? '✔' : '✖'} ${w}x${h} grove — horizontal scroll: ${m.hScroll ? 'YES (' + m.docW + '>' + m.clientW + ')' : 'none'} · stage vertical overflow: ${stageOverflow <= 0 ? 'none' : stageOverflow + 'px'}`,
    );
  }
  ws.close();
} catch (err) {
  console.error('overflow check failed:', err.message);
  failed = true;
} finally {
  chrome.kill();
  process.exit(failed ? 1 : 0);
}
