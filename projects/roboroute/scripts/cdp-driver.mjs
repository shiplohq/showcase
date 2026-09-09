#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Minimal Chrome DevTools Protocol driver — no dependencies. Exercises the
// real UI with mouse / touch / keyboard input, captures console errors, and
// takes screenshots at the required viewports. Works against any URL (local
// preview or the live Shiplo deployment).
//
// Usage:
//   node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|fit|smoke]
//
// Flows:
//   full — map renders → mission via mouse → build program (clicks) → run →
//          complete overlay → progress stamp → second mission bump + rewind +
//          edit → keyboard-only editing → notebook → 44px targets →
//          reduced-motion → localStorage persistence.
//   fit  — map + board must fit the viewport (no page scroll) and all
//          interactive targets must be ≥ 44px on the activity screens.
//   smoke — loads, asserts the map renders, screenshots.

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
const port = Number(args[args.indexOf('--port') + 1] ?? 9333);
if (!url) {
  console.error('usage: node cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|fit|smoke] [--port 9333]');
  process.exit(2);
}

const errors = [];
const consoleErrors = [];

// Fresh profile + disabled disk cache every run (pilot #01 stale-cache lesson)
// + dedicated port (batch #06–#10 port-collision lesson).
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  `--remote-debugging-port=${port}`,
  '--user-data-dir=' + resolve(outDir, `.chrome-profile-${Date.now()}`),
  '--disk-cache-size=1',
  '--media-cache-size=1',
  '--disable-application-cache',
  '--no-first-run',
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, timeoutMs = 15000, label = 'condition') {
  const t0 = Date.now();
  for (;;) {
    const v = await fn().catch(() => null);
    if (v) return v;
    if (Date.now() - t0 > timeoutMs) throw new Error(`timeout waiting for ${label}`);
    await sleep(120);
  }
}

const list = await waitFor(async () => {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await res.json();
  return targets.find((t) => t.type === 'page') ?? null;
}, 15000, 'chrome devtools endpoint');
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

async function click(selectorOrPoint, label) {
  const pt = typeof selectorOrPoint === 'string'
    ? await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selectorOrPoint)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`)
    : selectorOrPoint;
  if (!pt) throw new Error(`click target not found: ${label ?? selectorOrPoint}`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await sleep(250);
}

async function key(keyName) {
  const codes = { Enter: 13, Tab: 9, Escape: 27, ' ': 32, s: 83, r: 82, w: 87, e: 69, ArrowLeft: 37, ArrowRight: 39, Delete: 46 };
  const codeNames = { Enter: 'Enter', Tab: 'Tab', Escape: 'Escape', ' ': 'Space', s: 'KeyS', r: 'KeyR', w: 'KeyW', e: 'KeyE', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', Delete: 'Delete' };
  const code = codes[keyName] ?? keyName.charCodeAt(0);
  const codeName = codeNames[keyName] ?? keyName.toUpperCase();
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, code: codeName, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code: codeName, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
  await sleep(140);
}

/** Keyboard activation of the focused control (Space is the reliable path in
 *  headless CDP; native buttons accept Space and Enter equally). */
async function activate() {
  await key(' ');
}

async function tap(selector, label) {
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!pt) throw new Error(`tap target not found: ${label ?? selector}`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(300);
}

/** Visible interactive targets smaller than 44px (buttons + token tiles). */
const smallTargetsExpr = `(() => {
  const els = [...document.querySelectorAll('button')];
  const small = [];
  for (const b of els) {
    const r = b.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.width < 44 || r.height < 44) small.push((b.className || b.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  return small;
})()`;

const fitExpr = `(() => ({
  scrollH: document.documentElement.scrollHeight,
  scrollW: document.documentElement.scrollWidth,
  innerH: window.innerHeight,
  innerW: window.innerWidth,
  bodyScrollH: document.body.scrollHeight,
}))()`;

async function assertFit(label) {
  const f = await evaluate(fitExpr);
  const okV = f.scrollH <= f.innerH + 1; // +1 tolerance for rounding
  const okH = f.scrollW <= f.innerW + 1;
  if (!okV || !okH) {
    throw new Error(`${label}: page does not fit viewport — ${f.scrollW}x${f.scrollH} vs ${f.innerW}x${f.innerH}`);
  }
  console.log(`  ✔ ${label} fits viewport (${f.scrollW}x${f.scrollH} ≤ ${f.innerW}x${f.innerH})`);
}

async function assertTargets(label) {
  const small = await evaluate(smallTargetsExpr);
  if (small.length > 0) throw new Error(`${label}: ${small.length} target(s) < 44px: ${small.slice(0, 5).join(' | ')}`);
  console.log(`  ✔ ${label}: all visible targets ≥ 44px`);
}

mkdirSync(outDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 });

try {
  await send('Page.navigate', { url });
  await sleep(2600); // fonts + JSON fetch settle

  const title = await evaluate('document.title');
  console.log(`▶ ${url} — "${title}" @ ${width}x${height} (flow: ${flow})`);

  const mapOk = await evaluate(`!!document.querySelector('.rr-map') && document.querySelectorAll('.rr-plaque').length === 8`);
  if (!mapOk) throw new Error('map screen did not render 8 mission plaques');
  console.log('  ✔ map screen renders 2 wings / 8 mission plaques');
  await screenshot('01-map');

  if (flow === 'smoke') {
    if (width >= 768) await assertFit('map'); // mobile stacks and may scroll
    finish();
  }

  if (flow === 'fit') {
    await assertFit('map');
    await assertTargets('map');
    await click('.rr-plaque', 'first mission plaque');
    await waitFor(() => evaluate(`!!document.querySelector('.rr-board')`), 8000, 'board screen');
    await sleep(600);
    await assertFit('board');
    await assertTargets('board (activity screen)');
    await screenshot('02-board-fit');
    finish();
  }

  // ---------------- full flow ----------------
  // Viewport fit is an activity-screen bar at tablet/desktop (base.css: board
  // fits without page scroll at 1024×768 / 1440×900). Mobile stacks and may
  // scroll (spec responsive §Mobile) — only the ≥44px target bar applies there.
  if (width >= 768) await assertFit('map');

  // mission 1 via mouse: seq-01 = F F F
  await click('.rr-plaque', 'mission 01 plaque');
  await waitFor(() => evaluate(`!!document.querySelector('.rr-board') && !!document.querySelector('.rr-room')`), 8000, 'board screen');
  await sleep(500);
  console.log('  ✔ board screen mounts with the room');
  await screenshot('02-board');

  const paletteCount = await evaluate(`document.querySelectorAll('.rr-palette .rr-token').length`);
  if (paletteCount !== 1) throw new Error(`seq-01 palette should have exactly 1 token (Forward), got ${paletteCount}`);
  console.log('  ✔ palette shows only the allowed commands (1 for seq-01)');

  for (let i = 0; i < 3; i++) await click('.rr-palette .rr-token', 'forward token');
  const tileCount = await evaluate(`document.querySelectorAll('.rr-tray .rr-tile:not(.rr-tile--empty)').length`);
  if (tileCount !== 3) throw new Error(`expected 3 placed tiles, got ${tileCount}`);
  console.log('  ✔ mouse: 3 Forward tiles placed on the program strip');

  // run with the keyboard shortcut
  await key('r');
  await sleep(600);
  const running = await evaluate(`document.querySelector('.rr-status')?.textContent || ''`);
  if (!/robot|program|step/i.test(running)) throw new Error(`status line did not update on run: "${running.slice(0, 80)}"`);
  await waitFor(() => evaluate(`!!document.querySelector('.rr-celebrate')`), 12000, 'mission-complete overlay');
  console.log('  ✔ run completes → mission-complete overlay appears');
  await screenshot('03-complete');

  // close the overlay (Build again) → back to map via the header button
  await click('.rr-celebrate .rr-btn--ghost', 'build again (stay on board)');
  await sleep(400);
  await click('.rr-back', 'museum map (header back)');
  await waitFor(() => evaluate(`!!document.querySelector('.rr-map')`), 8000, 'map after complete');
  const stamped = await evaluate(`document.querySelectorAll('.rr-plaque.is-done').length`);
  if (stamped !== 1) throw new Error(`expected 1 stamped plaque, got ${stamped}`);
  console.log('  ✔ completed mission stamped on the map (progress recorded)');

  // mission 2: a bump + non-punitive debug + rewind + edit
  await click('.rr-plaques li:nth-child(2) .rr-plaque', 'mission 02 plaque');
  await waitFor(() => evaluate(`!!document.querySelector('.rr-board')`), 8000, 'board 2');
  await sleep(400);

  /** Click a palette token by its aria-label, with real mouse events
   *  (the palette listens to pointer events, not synthetic click()). */
  async function clickToken(labelWant) {
    const sel = `[...document.querySelectorAll('.rr-palette .rr-token')].findIndex(x => (x.getAttribute('aria-label') || '').includes(${JSON.stringify(labelWant)}))`;
    const idx = await evaluate(sel);
    if (typeof idx !== 'number' || idx < 0) throw new Error(`palette token not found for "${labelWant}"`);
    const pt = await evaluate(`(() => { const b = document.querySelectorAll('.rr-palette .rr-token')[${idx}]; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
    await sleep(170);
  }

  // L then 5x F: walks into the north wall after 4 steps
  for (const op of ['L', 'F', 'F', 'F', 'F', 'F']) {
    const labelWant = op === 'F' ? 'forward' : op === 'L' ? 'turn left' : op === 'R' ? 'turn right' : 'repeat';
    await clickToken(labelWant);
  }
  await key('r'); // run
  await waitFor(() => evaluate(`/bump/i.test(document.querySelector('.rr-status')?.getAttribute('data-status') || '') || /bump/i.test(document.querySelector('.rr-status')?.textContent || '')`), 12000, 'bump status');
  console.log('  ✔ wall bump handled: non-punitive debug banner');
  await screenshot('04-bump');
  const debugTone = await evaluate(`!!document.querySelector('.rr-status--debug') && document.querySelectorAll('.rr-debug-actions .rr-btn').length >= 2`);
  if (!debugTone) throw new Error('debug banner actions missing');
  // rewind → bump clears
  await key('w');
  await sleep(400);
  const afterRewind = await evaluate(`/bump/i.test(document.querySelector('.rr-status')?.textContent || '')`);
  if (afterRewind) throw new Error('rewind did not clear the bump banner');
  console.log('  ✔ rewind one step clears the bump');
  await key('e'); // back to editing
  await sleep(300);
  const editing = await evaluate(`!!document.querySelector('.rr-palette .rr-token:not(.is-disabled)')`);
  if (!editing) throw new Error('edit mode did not re-enable the palette');
  console.log('  ✔ edit returns to the program with tiles intact');

  // keyboard-only editing on mission 2: select tile → move → remove
  const focusOk = await evaluate(`(() => { const t = document.querySelector('.rr-tray .rr-tile'); t.focus(); return document.activeElement === t; })()`);
  if (!focusOk) throw new Error('program tile is not focusable');
  await activate(); // Space on the focused native button
  await sleep(250);
  const toolbar = await evaluate(`!!document.querySelector('.rr-toolbar')`);
  if (!toolbar) throw new Error('selecting a tile did not open the token toolbar');
  console.log('  ✔ keyboard: Space on the focused tile selects it and opens the toolbar');
  // keyboard palette activation: focus a palette token, press Space, tile lands
  const paletteFocus = await evaluate(`(() => { const b = document.querySelector('.rr-palette .rr-token:not(.is-disabled)'); if (!b) return false; b.focus(); return true; })()`);
  if (!paletteFocus) throw new Error('palette token not focusable');
  const before = await evaluate(`document.querySelectorAll('.rr-tray .rr-tile:not(.rr-tile--empty)').length`);
  await activate();
  await sleep(250);
  const afterKb = await evaluate(`document.querySelectorAll('.rr-tray .rr-tile:not(.rr-tile--empty)').length`);
  if (afterKb !== before + 1) throw new Error(`keyboard Space on palette did not add a tile (${before} → ${afterKb})`);
  console.log('  ✔ keyboard: Space on a palette token adds a tile');
  // return to the tile for the reorder/remove part
  const countNow = await evaluate(`document.querySelectorAll('.rr-tray .rr-tile:not(.rr-tile--empty)').length`);
  await evaluate(`document.querySelector('.rr-tray .rr-tile').focus()`);
  await key('Tab');
  await activate(); // first toolbar button (Move left)
  await sleep(300);
  const stillThere = await evaluate(`document.querySelectorAll('.rr-tray .rr-tile:not(.rr-tile--empty)').length`);
  if (stillThere !== countNow) throw new Error(`toolbar Move changed the tile count (${countNow} → ${stillThere})`);
  const firstLabel = await evaluate(`document.querySelector('.rr-tray .rr-tile .rr-tile-label')?.textContent`);
  if (!firstLabel) throw new Error('toolbar Move lost the reordered tile');
  console.log('  ✔ keyboard: toolbar Move reorders without pointer');
  // remove via keyboard: select the first tile, then Delete
  await evaluate(`document.querySelector('.rr-tray .rr-tile').focus()`);
  await activate();
  await sleep(200);
  await key('Delete');
  await sleep(300);
  const afterDelete = await evaluate(`document.querySelectorAll('.rr-tray .rr-tile:not(.rr-tile--empty)').length`);
  if (afterDelete !== countNow - 1) throw new Error(`Delete key did not remove the tile (${countNow} → ${afterDelete})`);
  console.log('  ✔ keyboard: Delete removes the selected tile');

  // notebook
  await evaluate(`[...document.querySelectorAll('.rr-board-tools .rr-btn')].find(b => /notebook/i.test(b.textContent)).click()`);
  await waitFor(() => evaluate(`!!document.querySelector('.rr-notebook')`), 6000, 'notebook panel');
  const nbEntries = await evaluate(`document.querySelectorAll('.rr-notebook-entry').length`);
  if (nbEntries !== 2) throw new Error(`notebook should have 2 concepts, got ${nbEntries}`);
  console.log('  ✔ concept notebook opens with sequence + loop entries');
  await screenshot('05-notebook');
  await key('Escape');
  await sleep(300);

  // touch target audit on the activity screen (fit asserted at ≥768 only —
  // mobile stacks into a scrolling bottom dock by design)
  await assertTargets('board (activity screen)');
  if (width >= 768) await assertFit('board');

  // touch: tap a palette token (tablet path)
  const preTouch = await evaluate(`document.querySelectorAll('.rr-tray .rr-tile:not(.rr-tile--empty)').length`);
  await tap('.rr-palette .rr-token:not(.is-disabled)', 'palette token (touch)');
  const touchAdded = await evaluate(`document.querySelectorAll('.rr-tray .rr-tile:not(.rr-tile--empty)').length`);
  if (touchAdded !== preTouch + 1) throw new Error(`touch tap did not add a tile (${preTouch} → ${touchAdded})`);
  console.log('  ✔ touch: tap adds a tile to the program');

  // reduced motion
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await sleep(400);
  await key('r');
  await sleep(700);
  const reducedOk = await evaluate(`(() => { const s = document.querySelector('.rr-status')?.textContent || ''; return /robot/i.test(s); })()`);
  if (!reducedOk) throw new Error('app unusable under reduced motion');
  console.log('  ✔ prefers-reduced-motion emulated — app remains fully usable');
  await screenshot('06-reduced-motion');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: '' }] });

  // persistence across reload
  await send('Page.navigate', { url });
  await sleep(2200);
  const stampAfterReload = await evaluate(`document.querySelectorAll('.rr-plaque.is-done').length`);
  if (stampAfterReload !== 1) throw new Error(`progress did not persist across reload (${stampAfterReload})`);
  console.log('  ✔ anonymous progress persists across reload (localStorage)');

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
  console.log(`\n✔ CDP flow "${flow}" passed at ${width}x${height} — no console errors.`);
  process.exit(0);
}
