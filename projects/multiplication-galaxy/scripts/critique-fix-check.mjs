// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
// One-off verification of the critique fix batch (P0 countability, P1 map
// overlap, P1 mobile dock). Drives the real UI via CDP and measures the DOM.
import { spawn } from 'node:child_process';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.argv[2] ?? 'http://localhost:4184/';
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--window-size=1300,900', '--remote-debugging-port=9344', '--user-data-dir=' + process.env.TEMP + '\\mg-fix-' + Date.now(), '--disk-cache-size=1', '--no-first-run', 'about:blank']);
await new Promise((r) => setTimeout(r, 2200));
const list = await (await fetch('http://127.0.0.1:9344/json/list')).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const consoleErrors = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
  } else if (m.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(m.params.exceptionDetails.text);
  }
};
const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');

let failures = 0;
const check = (cond, msg) => { if (!cond) { failures++; console.error('  ✖ ' + msg); } else console.log('  ✔ ' + msg); };

// --- P0: 12×12 chart countability (Table 12, last fact 12×12=144) -----------
await send('Page.navigate', { url: URL });
await sleep(2600);
await evaluate(`document.querySelectorAll('.constellation-btn')[10].click()`);
await sleep(600);
await evaluate(`document.querySelector('.overlay .btn-primary').click()`);
await sleep(1400);
// Fast-forward: answer all facts correctly until the last one.
for (let i = 0; i < 5; i++) {
  await evaluate(`(() => { const h = document.querySelector('.fact-headline').textContent; let v; let m = h.match(/(\\d+) × (\\d+) = \\?/); if (m) v = m[1]*m[2]; else { m = h.match(/\\? × (\\d+) = (\\d+)/); v = m ? m[2]/m[1] : null; if (!v) { m = h.match(/(\\d+) × \\? = (\\d+)/); v = m[2]/m[1]; } } [...document.querySelectorAll('.answer-node')].find(n => Number(n.querySelector('.node-value').textContent) === v)?.click(); })()`);
  await sleep(750);
  await evaluate(`document.querySelector('.next-fact')?.click()`);
  await sleep(600);
}
// Let the 12-ring build-up (stagger 0.09 × 12 + satellites) fully settle
// before measuring positions — mid-tween reads are meaningless.
await sleep(2000);
const headline = await evaluate(`document.querySelector('.fact-headline').textContent.trim().replace(/\\s+/g,' ')`);
check(headline === '12 × 12 = ?', `last fact is 12 × 12 (got "${headline}")`);
const overlap = await evaluate(`(() => {
  const sats = [...document.querySelectorAll('.sat')];
  const pts = sats.map(g => { const m = new DOMMatrix(getComputedStyle(g).transform !== 'none' ? getComputedStyle(g).transform : undefined); const r = g.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width }; });
  let pairs = 0; let minD = 1e9;
  for (let i = 0; i < pts.length; i++) for (let j = i+1; j < pts.length; j++) {
    const d = Math.hypot(pts[i].x-pts[j].x, pts[i].y-pts[j].y);
    minD = Math.min(minD, d);
    const minClear = (pts[i].w + pts[j].w) / 2 - 2;
    if (d < minClear) pairs++;
  }
  return { count: sats.length, pairs, minD: Math.round(minD*10)/10, size: Math.round(pts[0].w*10)/10 };
})()`);
check(overlap.count === 144, `144 satellites rendered (got ${overlap.count})`);
check(overlap.pairs === 0, `zero overlapping satellite pairs at 1440 (min distance ${overlap.minD}px, node ${overlap.size}px)`);
const tally = await evaluate(`document.querySelectorAll('.ring-tally').length`);
check(tally === 12, `dense system shows 12 cumulative tally labels (got ${tally})`);
const tallyText = await evaluate(`[...document.querySelectorAll('.ring-tally')].map(t => t.textContent).join(' · ')`);
check(tallyText.endsWith('144'), `tally runs to the product: ${tallyText}`);
// Lock and confirm satellites ride the morph (post-lock positions still unique).
await evaluate(`(() => { [...document.querySelectorAll('.answer-node')].find(n => Number(n.querySelector('.node-value').textContent) === 144)?.click(); })()`);
await sleep(800);
const postLock = await evaluate(`(() => {
  const sats = [...document.querySelectorAll('.sat')];
  const pts = sats.map(g => { const r = g.getBoundingClientRect(); return Math.round((r.x + r.width/2)) + ',' + Math.round(r.y + r.height/2); });
  return { unique: new Set(pts).size, total: pts.length };
})()`);
check(postLock.unique === postLock.total, `post-lock: ${postLock.unique}/${postLock.total} satellite screen positions unique (morph followed exactly)`);

// --- P1: constellation overlap at 1024×768 (hero) → grid layout --------------
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
await sleep(400);
await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Star chart'))?.click()`);
await sleep(700);
const overlapBtn = await evaluate(`(() => {
  const rects = [...document.querySelectorAll('.constellation-btn')].map(b => b.getBoundingClientRect());
  let pairs = 0;
  for (let i = 0; i < rects.length; i++) for (let j = i+1; j < rects.length; j++) {
    const x = Math.max(0, Math.min(rects[i].right, rects[j].right) - Math.max(rects[i].left, rects[j].left));
    const y = Math.max(0, Math.min(rects[i].bottom, rects[j].bottom) - Math.max(rects[i].top, rects[j].top));
    if (x > 0 && y > 0) pairs++;
  }
  return pairs;
})()`);
check(overlapBtn === 0, `zero overlapping constellation hit-areas at 1024×768 (grid mode)`);

// --- P1: mobile sticky dock + inline feedback ---------------------------------
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await sleep(400);
await evaluate(`document.querySelectorAll('.constellation-btn')[0].click()`);
await sleep(600);
await evaluate(`document.querySelector('.overlay .btn-primary').click()`);
await sleep(1300);
const dock = await evaluate(`(() => {
  const dock = document.querySelector('.instruments');
  const cs = getComputedStyle(dock);
  const nodes = dock.querySelector('.answer-nodes').getBoundingClientRect();
  const fb = dock.querySelector('.dock-feedback');
  return { sticky: cs.position, bottom: cs.bottom, nodesBottom: Math.round(nodes.bottom), fbVisible: fb && getComputedStyle(fb).display !== 'none', vw: window.innerWidth, vh: window.innerHeight };
})()`);
check(dock.sticky === 'sticky', `instruments dock is sticky at 390px`);
check(dock.fbVisible === true, `dock-side feedback visible on mobile`);
check(dock.nodesBottom <= 844 + 120, `answer nodes near the viewport on load (bottom ${dock.nodesBottom})`);

// ring-focus label wiring (P2): tap a ring, read the instrument note
await evaluate(`(() => { const hit = document.querySelector('.ring-hit'); if (!hit) return 'NO-HIT'; hit.click(); return 'clicked'; })()`);
await sleep(300);
const ringLabel = await evaluate(`document.querySelector('.instrument-note')?.textContent ?? 'NO-NOTE'`);
check(/ring/i.test(String(ringLabel)), `ring tap shows the running-group label ("${ringLabel}")`);

console.log(consoleErrors.length ? `console errors: ${consoleErrors.length}` : 'no console errors');
ws.close();
chrome.kill();
process.exit(failures || consoleErrors.length ? 1 : 0);
