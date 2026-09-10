#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Quick numeric layout probe (implementation sanity, not the test matrix):
// page height vs viewport, key elements' rects, smallest button sizes.

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9363;
const url = process.argv[2] ?? 'http://localhost:4361/';
const outDir = resolve('.probe');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + resolve(outDir, 'p-' + Date.now()),
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
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'eval error');
    return r.result.value;
  };

  await send('Page.enable');
  await send('Runtime.enable');

  for (const [w, h] of [[1440, 900], [1024, 768], [390, 844]]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 900 });
    await send('Page.navigate', { url });
    await sleep(2800);
    const m = await evaluate(`(() => {
      const rows = [...document.querySelectorAll('.ledger-row')].map(r => r.getBoundingClientRect());
      const footer = document.querySelector('.site-footer')?.getBoundingClientRect();
      const buttons = [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null).map(b => b.getBoundingClientRect());
      const small = buttons.filter(r => r.width > 0 && (r.width < 44 || r.height < 44)).length;
      return {
        scrollH: document.documentElement.scrollHeight,
        innerH: window.innerHeight,
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        rowCount: rows.length,
        lastRowBottom: rows.length ? Math.round(rows[rows.length - 1].bottom) : null,
        footerTop: footer ? Math.round(footer.top) : null,
        footerVisible: footer ? footer.bottom <= window.innerHeight : false,
        smallButtons: small,
        hScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    })()`);
    console.log(`${w}x${h}:`, JSON.stringify(m));

    // trail screen
    await evaluate("document.querySelectorAll('.ledger-row')[0].click()");
    await sleep(1400);
    const t = await evaluate(`(() => {
      const stage = document.querySelector('.plate-stage')?.getBoundingClientRect();
      const mission = document.querySelector('.mission')?.getBoundingClientRect();
      const chips = [...document.querySelectorAll('.place-chip')].map(b => b.getBoundingClientRect());
      const feedback = document.querySelector('.feedback')?.getBoundingClientRect();
      const prompt = document.querySelector('#mission-prompt')?.getBoundingClientRect();
      const small = [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null)
        .map(b => b.getBoundingClientRect()).filter(r => r.width > 0 && (r.width < 44 || r.height < 44)).length;
      return {
        scrollH: document.documentElement.scrollHeight,
        innerH: window.innerHeight,
        hScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
        mapH: stage ? Math.round(stage.height) : null,
        missionBottom: mission ? Math.round(mission.bottom) : null,
        promptVisible: prompt ? prompt.bottom <= window.innerHeight : false,
        chipsVisible: chips.length && chips.every(c => c.top >= 0 && c.bottom <= window.innerHeight),
        feedbackVisible: feedback ? feedback.bottom <= window.innerHeight : false,
        smallButtons: small,
        labelSample: document.querySelector('.map-place-label')?.getAttribute('font-size') ?? null,
      };
    })()`);
    console.log(`  trail ${w}x${h}:`, JSON.stringify(t));
    await send('Page.navigate', { url });
    await sleep(1200);
  }
  ws.close();
} catch (err) {
  console.error('probe failed:', err.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
  process.exit();
}
