#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Cover-state assertions via CDP (visual sanity without eyes): correct fill
// on the answered country, route + markers present, stamp awarded, feedback
// text shown, labels not colliding badly.

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9364;
const url = process.argv[2] ?? 'http://localhost:4361/';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + resolve('.probe', 'cov-' + Date.now()),
  '--disk-cache-size=1', '--no-first-run', 'about:blank',
]);

try {
  await sleep(2200);
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej; });
  let id = 0;
  const pend = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id).res(m.result); pend.delete(m.id); }
  };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, { res }); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'eval error');
    return r.result.value;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await sleep(3000);
  await evaluate("document.querySelectorAll('.ledger-row')[0].click()");
  await sleep(1500);
  await evaluate(`[...document.querySelectorAll('.place-chip')].find(b => /Vietnam/i.test(b.textContent)).click()`);
  await sleep(900);

  const r = await evaluate(`(() => {
    // Vietnam polygons are the first <g class="map-place"> children — find by
    // matching the label text to its x/y, then the land tint by group index.
    const labels = [...document.querySelectorAll('.map-place-label')].map(t => ({
      name: t.textContent, x: +t.getAttribute('x'), y: +t.getAttribute('y'), fs: +t.getAttribute('font-size'),
    }));
    const vnLabel = labels.find(l => l.name === 'Vietnam');
    const lands = [...document.querySelectorAll('.map-place polygon')];
    const vnFill = getComputedStyle(lands[0]).fill; // Vietnam is place #0 on plate I
    const route = document.querySelector('.map-route polyline');
    const markers = document.querySelectorAll('.route-marker circle').length;
    const texts = document.querySelectorAll('.route-marker text').map?.(n => n);
    const markerNums = [...document.querySelectorAll('.route-marker text')].map(t => t.textContent);
    const feedback = document.querySelector('.feedback')?.textContent?.trim() ?? '';
    const feedbackState = document.querySelector('.feedback')?.getAttribute('data-state');
    const stamp = !!document.querySelector('.award-stamp svg');
    const stampLabel = document.querySelector('.award-stamp svg')?.getAttribute('aria-label');
    const nextBtn = [...document.querySelectorAll('button')].find(b => /next stop/i.test(b.textContent));
    const chipAnswer = [...document.querySelectorAll('.place-chip')].find(b => /Vietnam/i.test(b.textContent))?.className ?? '';
    // label collisions: any two labels whose rendered boxes overlap > 4px
    const rects = [...document.querySelectorAll('.map-place-label')].map(t => { const b = t.getBoundingClientRect(); return { n: t.textContent, ...{ x: b.x, y: b.y, w: b.width, h: b.height } }; });
    let collisions = 0;
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      if (ox > 4 && oy > 4) collisions++;
    }
    return {
      vnFill, hasRoute: !!route, markers, markerNums,
      feedbackState, feedback: feedback.slice(0, 90), stamp, stampLabel,
      hasNext: !!nextBtn, chipAnswer, labelCount: labels.length, collisions,
    };
  })()`);
  console.log(JSON.stringify(r, null, 1));
  ws.close();
} catch (err) {
  console.error('cover probe failed:', err.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
  process.exit();
}
