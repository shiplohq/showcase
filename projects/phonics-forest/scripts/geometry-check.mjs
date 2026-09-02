#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Geometry assertions for the impeccable-critique fixes:
//  - mobile 390x844 clearing: all 3 answer leaves visible without scrolling
//    (top of each leaf above the fold);
//  - mobile grove: at least 4 of 5 tree signs fully visible (limited-support
//    declaration covers the rest), no horizontal scroll;
//  - desktop 1440x900 clearing: stage does not scroll, sound stone label
//    visible, stone does not overlap the firefly row.

import { spawn } from 'node:child_process';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2];
if (!url) {
  console.error('usage: node geometry-check.mjs <url>');
  process.exit(2);
}

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--window-size=1440,900',
  '--remote-debugging-port=9350', '--user-data-dir=' + process.cwd() + `\\.shots\\.geo-${Date.now()}`,
  '--disk-cache-size=1', '--no-first-run', 'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = false;
const fail = (msg) => { failed = true; console.error('  ✖ ' + msg); };
const pass = (msg) => console.log('  ✔ ' + msg);

try {
  await sleep(2200);
  const list = await (await fetch('http://127.0.0.1:9350/json/list')).json();
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

  // --- mobile grove + clearing ------------------------------------------------
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url });
  await sleep(2600);
  const grove = await evaluate(`(() => {
    const stage = document.querySelector('.stage');
    const fold = stage.getBoundingClientRect().bottom;
    const signs = [...document.querySelectorAll('.tree-btn')].map(b => {
      const r = b.getBoundingClientRect();
      return { id: b.dataset.tree, top: r.top, bottom: r.bottom, visible: r.top < fold && r.bottom > stage.getBoundingClientRect().top };
    });
    return { signs, hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  })()`);
  const visibleCount = grove.signs.filter((s) => s.visible).length;
  if (grove.hScroll) fail('mobile grove: horizontal scroll');
  else pass('mobile grove: no horizontal scroll');
  if (visibleCount >= 4) pass(`mobile grove: ${visibleCount}/5 tree signs visible in first viewport`);
  else fail(`mobile grove: only ${visibleCount}/5 signs visible`);

  await evaluate(`document.querySelector('.tree-btn[data-tree="sh"]').scrollIntoView({block:'start'})`);
  await evaluate(`document.querySelector('.tree-btn[data-tree="sh"]').click()`);
  await sleep(900);
  const clearing = await evaluate(`(() => {
    const stage = document.querySelector('.stage');
    const stageRect = stage.getBoundingClientRect();
    const leaves = [...document.querySelectorAll('.leaf-btn')].map(l => l.getBoundingClientRect().top + 8 < stageRect.bottom);
    const stone = document.querySelector('.stone-btn')?.getBoundingClientRect();
    return { leavesAllVisible: leaves.every(Boolean), leafCount: leaves.length, stoneVisible: !!stone && stone.bottom <= stageRect.bottom + 1, stageScroll: stage.scrollHeight - stage.clientHeight };
  })()`);
  if (clearing.leafCount === 3 && clearing.leavesAllVisible) pass('mobile clearing: all 3 answer leaves above the fold');
  else fail(`mobile clearing: leaves visible ${clearing.leavesAllVisible} (${clearing.leafCount})`);
  if (clearing.stoneVisible) pass('mobile clearing: sound stone + label visible');
  else fail('mobile clearing: sound stone clipped');

  // --- desktop clearing ---------------------------------------------------------
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await sleep(2600);
  await evaluate(`document.querySelector('.tree-btn[data-tree="sh"]').click()`);
  await sleep(900);
  const desk = await evaluate(`(() => {
    const stage = document.querySelector('.stage');
    const stone = document.querySelector('.stone-btn')?.getBoundingClientRect();
    const flies = [...document.querySelectorAll('.fly-slot circle')].map(c => {
      const st = c.ownerSVGElement.getBoundingClientRect();
      const box = c.getBBox();
      const scale = st.width / c.ownerSVGElement.viewBox.baseVal.width;
      return { x: st.x + box.x * scale, y: st.y + box.y * scale, w: box.width * scale, h: box.height * scale };
    });
    const overlaps = flies.filter(f => stone && !(stone.right < f.x || stone.left > f.x + f.w || stone.bottom < f.y || stone.top > f.y + f.h)).length;
    return { stageScroll: stage.scrollHeight - stage.clientHeight, stoneBottomIn: !!stone && stone.bottom <= stage.getBoundingClientRect().bottom + 1, overlapCount: overlaps };
  })()`);
  if (desk.stageScroll <= 0) pass('desktop clearing: stage does not scroll');
  else fail(`desktop clearing: stage scrolls ${desk.stageScroll}px`);
  if (desk.stoneBottomIn) pass('desktop clearing: stone + label fully visible');
  else fail('desktop clearing: stone label clipped');
  if (desk.overlapCount === 0) pass('desktop clearing: stone does not cover firefly slots');
  else fail(`desktop clearing: stone overlaps ${desk.overlapCount} firefly slot(s)`);

  ws.close();
} catch (err) {
  console.error('geometry check failed:', err.message);
  failed = true;
} finally {
  chrome.kill();
  console.log(failed ? '\n✖ geometry assertions failed' : '\n✔ geometry assertions passed');
  process.exit(failed ? 1 : 0);
}
