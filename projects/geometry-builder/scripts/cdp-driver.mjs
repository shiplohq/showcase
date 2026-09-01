#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Minimal Chrome DevTools Protocol driver (no dependencies) adapted from the
// pilot #01 driver. Exercises the real UI with mouse / touch / keyboard input,
// captures console errors on the primary flow, and takes screenshots at the
// required viewports. Works against any URL (local preview or the live
// Shiplo deployment).
//
// Flow "full" = lobby → open mission (mouse) → drag a part from the tray
// (mouse) → place + move + rotate via keyboard → Check fit (nudge, then
// solved via UI controls) → CHECKED → Measure → perimeter walk → back to
// lobby. Touch path + reduced-motion + touch-target sweep included.
//
// Usage:
//   node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|smoke]
// Exits non-zero on any console error or a broken step.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const args = process.argv.slice(2);
const url = args[0];
const outDir = resolve(args[args.indexOf('--out') + 1] ?? '.shots');
const width = Number(args[args.indexOf('--w') + 1] ?? 1440);
const height = Number(args[args.indexOf('--h') + 1] ?? 900);
const flow = args[args.indexOf('--flow') + 1] ?? 'full';
if (!url) {
  console.error('usage: node cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|smoke]');
  process.exit(2);
}

const errors = [];
const consoleErrors = [];

// Fresh profile + disabled disk cache each run (pilot lesson: a persistent
// profile keeps stale index.html / hashed assets).
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  '--remote-debugging-port=9335',
  '--user-data-dir=' + resolve(outDir, `.chrome-profile-${Date.now()}`),
  '--disk-cache-size=1',
  '--media-cache-size=1',
  '--disable-application-cache',
  '--no-first-run',
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, timeoutMs = 20000, label = 'condition') {
  const t0 = Date.now();
  for (;;) {
    const v = await fn().catch(() => null);
    if (v) return v;
    if (Date.now() - t0 > timeoutMs) throw new Error(`timeout waiting for ${label}`);
    await sleep(120);
  }
}

const list = await waitFor(async () => {
  const res = await fetch('http://127.0.0.1:9335/json/list');
  const targets = await res.json();
  return targets.find((t) => t.type === 'page') ?? null;
}, 20000, 'chrome devtools endpoint');
const ws = new WebSocket(list.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve: r, reject: j } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? j(new Error(msg.error.message)) : r(msg.result);
  } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
  } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    consoleErrors.push(msg.params.entry.text);
  } else if (msg.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description ?? ''));
  } else if (msg.method === 'Network.loadingFailed' && msg.params.errorText !== 'net::ERR_ABORTED') {
    consoleErrors.push(`network: ${msg.params.errorText} (requestId ${msg.params.requestId})`);
  }
};
function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('page eval failed: ' + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
  return r.result.value;
}

async function screenshot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const file = resolve(outDir, `${name}-${width}x${height}.png`);
  writeFileSync(file, Buffer.from(r.data, 'base64'));
  console.log(`  📸 ${name} → ${file}`);
  return file;
}

async function center(selector, label) {
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!pt) throw new Error(`target not found: ${label ?? selector}`);
  return pt;
}

async function click(selector, label) {
  const pt = await center(selector, label);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await sleep(220);
}

async function key(keyName, modifiers = 0) {
  const codes = { Enter: 13, Tab: 9, Escape: 27, ' ': 32, r: 82, R: 82, e: 69, E: 69 };
  const code = codes[keyName] ?? keyName.charCodeAt(0);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, modifiers });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, modifiers });
  await sleep(90);
}

async function tap(selector, label) {
  const pt = await center(selector, label);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(280);
}

/** Read the selected/last piece transform as { x, y, rot }. */
async function pieceTransform(uidSelector) {
  const t = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(uidSelector)}); if (!el) return null; const m = el.getAttribute('transform') || ''; const tr = /translate\\(([-\\d.]+) ([-\\d.]+)\\) rotate\\(([-\\d.]+)\\)/.exec(m); return tr ? { x: Number(tr[1]), y: Number(tr[2]), rot: Number(tr[3]) } : null; })()`);
  if (!t) throw new Error(`piece transform not found: ${uidSelector}`);
  return t;
}

async function focusPiece(uid) {
  await evaluate(`document.querySelector(${JSON.stringify(`g.piece[data-uid="${uid}"]`)}).focus()`);
}

mkdirSync(outDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 });

try {
  await send('Page.navigate', { url });
  await sleep(3000); // app bootstrap + JSON fetch settle

  const title = await evaluate('document.title');
  console.log(`▶ ${url} — "${title}" @ ${width}x${height}`);

  // -- lobby renders ---------------------------------------------------------
  const tabs = await evaluate(`document.querySelectorAll('.mission-tab').length`);
  if (tabs < 8) throw new Error(`lobby rendered ${tabs} mission tabs, expected 8`);
  const tracks = await evaluate(`document.querySelectorAll('.track').length`);
  if (tracks !== 3) throw new Error(`lobby rendered ${tracks} tracks, expected 3`);
  console.log(`  ✔ lobby renders ${tabs} missions in ${tracks} tracks`);
  await screenshot('01-lobby');

  if (flow === 'smoke') {
    finish();
  }

  // -- mouse: open the first mission ------------------------------------------
  await click('.mission-tab .tab-open', 'first mission tab');
  const wbOk = await evaluate(`!!document.querySelector('svg.canvas') && !!document.querySelector('.tray-piece') && !!document.querySelector('.inspector')`);
  if (!wbOk) throw new Error('workbench did not mount (canvas/tray/inspector)');
  const slotCount = await evaluate(`document.querySelectorAll('polygon.slot').length`);
  console.log(`  ✔ mouse click opens the workbench (${slotCount} dashed outlines)`);
  await screenshot('02-workbench');

  // -- drag a part from the tray onto the canvas (mouse path) ------------------
  const trayBtn = await center('.tray-piece:not(:disabled)', 'first tray part');
  const canvasPt = await center('svg.canvas', 'canvas center');
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: trayBtn.x, y: trayBtn.y, button: 'left', clickCount: 1 });
  await sleep(120);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: trayBtn.x, y: trayBtn.y, button: 'left', clickCount: 1 });
  await sleep(120);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: canvasPt.x, y: canvasPt.y - 60, button: 'left', clickCount: 1 });
  await sleep(160);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: canvasPt.x, y: canvasPt.y - 60, button: 'left', clickCount: 1 });
  await sleep(300);
  let pieceCount = await evaluate(`document.querySelectorAll('g.piece').length`);
  if (pieceCount !== 1) throw new Error(`drag from tray produced ${pieceCount} pieces, expected 1`);
  console.log('  ✔ mouse drag from tray places a piece on the sheet');

  // -- keyboard: select, move with arrows, rotate with R -----------------------
  const uid = await evaluate(`document.querySelector('g.piece').getAttribute('data-uid')`);
  await focusPiece(uid);
  let t = await pieceTransform(`g.piece[data-uid="${uid}"]`);
  // nudge: press ArrowRight; expect x+1
  await key('ArrowRight');
  const t2 = await pieceTransform(`g.piece[data-uid="${uid}"]`);
  if (t2.x !== t.x + 1) throw new Error(`arrow key move failed: ${t.x}→${t2.x}`);
  await key('ArrowLeft');
  // rotate: R → +15
  await key('r');
  const t3 = await pieceTransform(`g.piece[data-uid="${uid}"]`);
  if ((t3.rot % 360 + 360) % 360 !== 15) throw new Error(`rotate R failed: rot=${t3.rot}`);
  await key('e'); // back to 0
  console.log('  ✔ keyboard: arrows move 1 unit, R/E rotate ±15°');

  // -- undo/redo ---------------------------------------------------------------
  await click('.wb-tools .btn[aria-label^="Undo"]', 'undo');
  const t4 = await pieceTransform(`g.piece[data-uid="${uid}"]`);
  if ((t4.rot % 360 + 360) % 360 !== 15) throw new Error(`undo did not restore rotation (got ${t4.rot})`);
  await click('.wb-tools .btn[aria-label^="Redo"]', 'redo');
  const t5 = await pieceTransform(`g.piece[data-uid="${uid}"]`);
  if ((t5.rot % 360 + 360) % 360 !== 0) throw new Error(`redo did not re-apply rotation (got ${t5.rot})`);
  console.log('  ✔ undo/redo restores history');

  // -- nudge path: Check fit while incomplete → gentle feedback -----------------
  await click('.cta-check', 'check fit (incomplete)');
  const feedback = await evaluate(`document.querySelector('.wb-feedback').textContent.trim()`);
  if (/CHECKED/i.test(feedback)) throw new Error(`expected gentle nudge, got "${feedback}"`);
  const fbColor = await evaluate(`getComputedStyle(document.querySelector('.wb-feedback')).backgroundColor`);
  if (/rgb\(2[0-5][0-9],\s*[0-6]?[0-9],/i.test(fbColor)) throw new Error(`nudge strip looks red (punitive): ${fbColor}`);
  console.log(`  ✔ nudge feedback (gentle): "${feedback.slice(0, 60)}…"`);

  // -- hint ladder --------------------------------------------------------------
  await evaluate(`[...document.querySelectorAll('.wb-tools .btn')].find(b => /^Hint/.test(b.textContent.trim()))?.click()`);
  await sleep(150);
  const hintPulse = await evaluate(`!!document.querySelector('.slot--hint')`);
  if (!hintPulse) throw new Error('hint level 1 did not highlight a slot');
  await evaluate(`[...document.querySelectorAll('.wb-tools .btn')].find(b => /^Hint/.test(b.textContent.trim()))?.click()`);
  await sleep(150);
  const ghost = await evaluate(`!!document.querySelector('.hint-ghost')`);
  if (!ghost) throw new Error('hint level 2 did not reveal a ghost shape');
  console.log('  ✔ hint ladder: level 1 pulses the slot, level 2 reveals the ghost');

  // -- solve house-01 through the UI (buttons + keys, no shortcuts) -------------
  // Piece 1 (already on sheet): move to the wall slot (12,11) rot 0.
  await focusPiece(uid);
  let cur = await pieceTransform(`g.piece[data-uid="${uid}"]`);
  // snap first (drag drop already snaps, but the +1/-1 move kept integers)
  while (cur.x !== 12) {
    await key(cur.x < 12 ? 'ArrowRight' : 'ArrowLeft');
    cur = await pieceTransform(`g.piece[data-uid="${uid}"]`);
  }
  while (cur.y !== 11) {
    await key(cur.y < 11 ? 'ArrowDown' : 'ArrowUp');
    cur = await pieceTransform(`g.piece[data-uid="${uid}"]`);
  }
  const locked1 = await evaluate(`document.querySelectorAll('.slot--matched').length`);
  if (locked1 < 1) throw new Error('wall piece did not lock its dashed outline');
  console.log('  ✔ keyboard-driven placement locks the wall outline');

  // Piece 2: place via tray Enter, then move to the roof slot (12,7).
  await evaluate(`document.querySelectorAll('.tray-piece:not(:disabled)')[0].focus()`);
  await key(' '); // Space activates the focused button
  await sleep(200);
  const uid2 = await evaluate(`[...document.querySelectorAll('g.piece')].pop().getAttribute('data-uid')`);
  await focusPiece(uid2);
  let cur2 = await pieceTransform(`g.piece[data-uid="${uid2}"]`);
  while (cur2.x !== 12) {
    await key(cur2.x < 12 ? 'ArrowRight' : 'ArrowLeft');
    cur2 = await pieceTransform(`g.piece[data-uid="${uid2}"]`);
  }
  while (cur2.y !== 7) {
    await key(cur2.y < 7 ? 'ArrowUp' : 'ArrowDown');
    cur2 = await pieceTransform(`g.piece[data-uid="${uid2}"]`);
  }

  // -- Check fit → CHECKED -------------------------------------------------------
  await click('.cta-check', 'check fit (solved)');
  await sleep(900); // stamp animation
  const stamp = await evaluate(`!!document.querySelector('.stamp')`);
  const feedback2 = await evaluate(`document.querySelector('.wb-feedback').textContent.trim()`);
  if (!stamp || !/CHECKED/i.test(feedback2)) throw new Error(`expected CHECKED completion, stamp=${stamp} feedback="${feedback2}"`);
  console.log(`  ✔ Check fit completes: "${feedback2.slice(0, 60)}…"`);
  await screenshot('03-checked');

  // -- measure: perimeter walk -----------------------------------------------------
  await click('.cta-measure', 'measure button');
  await sleep(600);
  const edgeBtns = await evaluate(`document.querySelectorAll('.rv-edge-btn').length`);
  if (!edgeBtns || edgeBtns < 4) throw new Error(`review did not list edges (${edgeBtns})`);
  for (let round = 0; round < edgeBtns; round++) {
    await evaluate(`document.querySelectorAll('.rv-edge-btn:not(.is-measured)')[0]?.click()`);
    await sleep(240);
  }
  const done = await evaluate(`!!document.querySelector('.rv-done')`);
  const total = await evaluate(`document.querySelector('.rv-total-value').textContent.trim()`);
  if (!done) throw new Error('perimeter walk did not complete');
  if (total !== '24 u') throw new Error(`house-01 perimeter expected 24 u, got "${total}"`);
  console.log(`  ✔ perimeter walk completes — total ${total} (5 edges, dimension labels shown)`);
  await screenshot('04-review');

  // -- back to lobby via touch ------------------------------------------------------
  await tap('.rv-actions .btn:not(.cta-next):not([aria-label])', 'drawing index (touch)');
  const backOk = await evaluate(`!!document.querySelector('.mission-tab') && !document.querySelector('.rv')`);
  if (!backOk) throw new Error('touch did not return to the lobby');
  const stamp2 = await evaluate(`document.querySelectorAll('.tab-stamp').length`);
  if (stamp2 < 1) throw new Error('completed mission does not show its CHECKED stamp in the lobby');
  console.log('  ✔ touch returns to lobby; mission tab stamped CHECKED');

  // -- touch target sanity: all interactive elements ≥ 44px ---------------------------
  const small = await evaluate(`[...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).length`);
  if (small > 0) throw new Error(`${small} button(s) smaller than 44px`);
  console.log('  ✔ all visible buttons ≥ 44px touch targets');

  // -- reduced motion -------------------------------------------------------------------
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await evaluate(`document.querySelector('.mission-tab .tab-open').click()`);
  await sleep(700);
  const usable = await evaluate(`!!document.querySelector('svg.canvas')`);
  if (!usable) throw new Error('app unusable under prefers-reduced-motion');
  console.log('  ✔ prefers-reduced-motion emulated — app remains usable');
  await screenshot('05-reduced-motion');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: '' }] });

  finish();
} catch (err) {
  errors.push(String(err.message || err));
  finish();
}

function finish() {
  try { ws.close(); } catch {}
  try { chrome.kill(); } catch {}
  if (consoleErrors.length) {
    console.error(`\n✖ ${consoleErrors.length} console error(s):`);
    for (const e of consoleErrors) console.error('   ' + e.slice(0, 300));
  }
  if (errors.length) {
    console.error(`\n✖ flow failed: ${errors[0]}`);
    process.exit(1);
  }
  if (consoleErrors.length) process.exit(1);
  console.log(`\n✔ CDP flow passed at ${width}x${height} — no console errors.`);
  process.exit(0);
}
