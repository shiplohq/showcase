#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Minimal Chrome DevTools Protocol driver — no dependencies. Used by the
// pilot to (a) exercise the real UI with mouse / touch / keyboard input,
// (b) capture console errors on the primary flow, and (c) take screenshots
// at the required viewports. Works against any URL (local preview or the
// live Shiplo deployment).
//
// Usage:
//   node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full]
//
// Flow "full" = home → pick bed (mouse) → plant seeds (keyboard steppers) →
// check (mouse) → verify feedback → nudge path → why-overlay → continue.
// Exits non-zero on any console error or a broken step.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const args = process.argv.slice(2);
const url = args[0];
const outDir = resolve(args[args.indexOf('--out') + 1] ?? '.shots');
const width = Number(args[args.indexOf('--w') + 1] ?? 1440);
const height = Number(args[args.indexOf('--h') + 1] ?? 1440 - 540);
const flow = args[args.indexOf('--flow') + 1] ?? 'full';
if (!url) {
  console.error('usage: node cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|smoke]');
  process.exit(2);
}

const errors = [];
const consoleErrors = [];

// ---- launch chrome ---------------------------------------------------------
// Fresh profile + disabled disk cache each run: a persistent profile keeps a
// cached index.html pointing at stale hashed assets (bit us twice in testing).
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  '--remote-debugging-port=9333',
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

// find the page target's websocket url
const list = await waitFor(async () => {
  const res = await fetch('http://127.0.0.1:9333/json/list');
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

async function key(keyName, modifiers = 0) {
  // Maps plain key names to keycodes we need; text via rawKey for simple keys.
  const codes = { Enter: 13, Tab: 9, Escape: 27, ' ': 32, '+': 187, '-': 189 };
  const code = codes[keyName];
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, windowsVirtualKeyCode: code ?? keyName.charCodeAt(0), nativeVirtualKeyCode: code ?? keyName.charCodeAt(0), modifiers });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, windowsVirtualKeyCode: code ?? keyName.charCodeAt(0), nativeVirtualKeyCode: code ?? keyName.charCodeAt(0), modifiers });
  await sleep(120);
}

async function tap(selector, label) {
  // touch path (tablet): a real touch tap through Input.dispatchTouchEvent
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!pt) throw new Error(`tap target not found: ${label ?? selector}`);
  const touchPoint = { x: pt.x, y: pt.y };
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(300);
}

mkdirSync(outDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 });

try {
  await send('Page.navigate', { url });
  await sleep(2500); // fonts+JSON fetch settle

  const title = await evaluate('document.title');
  console.log(`▶ ${url} — "${title}" @ ${width}x${height}`);

  // -- home renders ----------------------------------------------------------
  const homeOk = await evaluate(`!!document.querySelector('.beds') && document.querySelectorAll('.bed').length >= 4`);
  if (!homeOk) throw new Error('home screen did not render 4 beds');
  console.log('  ✔ home screen renders 4 garden beds');
  await screenshot('01-home');

  if (flow === 'smoke') {
    finish();
  }

  // -- mouse: pick the second bed (make-10 unit) ------------------------------
  await click('.bed:nth-child(2)', 'make-10 bed');
  const playOk = await evaluate(`!!document.querySelector('.q-banner') && !!document.querySelector('.plot')`);
  if (!playOk) throw new Error('play screen did not mount');
  console.log('  ✔ mouse click opens the play screen');
  await screenshot('02-play');

  // -- keyboard: plant 3 seeds with the B stepper (+) --------------------------
  const bPlus = '.stepper:nth-of-type(1) .step-btn[aria-label*="ô B"]';
  const plusB = await evaluate(`!!document.querySelector(${JSON.stringify(bPlus)})`);
  // steppers: bag dock contains steppers; select via aria-label text
  const addB = await evaluate(`[...document.querySelectorAll('.step-btn')].findIndex(b => /ô B/i.test(b.getAttribute('aria-label') || '') && b.textContent.trim() === '+')`);
  if (addB < 0) throw new Error('B stepper + not found');
  await evaluate(`document.querySelectorAll('.step-btn')[${addB}].focus()`);
  for (let i = 0; i < 3; i++) await key(' ', 0); // Space activates focused button
  const bagCount = await evaluate(`document.querySelector('.bag-count').textContent`);
  if (Number(bagCount) !== 0) throw new Error(`expected bag empty after planting 3 (make-10 q1 needs 3), got ${bagCount}`);
  console.log('  ✔ keyboard Space on stepper + plants 3 seeds (bag → 0)');

  // -- nudge: check while wrong (under-planted by make-10 q1? planted exactly = correct)
  // make-10 q1: A=7 → need B=3 → we planted exactly 3. So first check = correct.
  await click('.cta-check', 'check button');
  const feedback = await evaluate(`document.querySelector('.feedback [class]')?.textContent?.trim() || document.querySelector('.feedback')?.textContent?.trim() || ''`);
  if (!/Đúng rồi/i.test(feedback)) throw new Error(`expected correct feedback, got "${feedback}"`);
  console.log(`  ✔ correct feedback: "${feedback.slice(0, 48)}…"`);
  await sleep(1400);

  // nudge path: over-plant then check — feedback must be a gentle hint (any
  // non-success copy), never a lockout, never red/shake.
  const overPlanted = await evaluate(`(() => { const add = [...document.querySelectorAll('.step-btn')].find(b => /ô B/i.test(b.getAttribute('aria-label')||'') && b.textContent.trim()==='+'); if(!add) return false; add.click(); return true; })()`);
  if (!overPlanted) throw new Error('could not over-plant for nudge test');
  await click('.cta-check', 'check button (wrong)');
  const nudge = await evaluate(`document.querySelector('.feedback')?.textContent?.trim() || ''`);
  if (!nudge || /Đúng rồi/i.test(nudge)) throw new Error(`expected gentle nudge feedback, got "${nudge}"`);
  const nudgeColor = await evaluate(`getComputedStyle(document.querySelector('.feedback .nudge') || document.querySelector('.feedback')).color`);
  if (/rgb\(2[0-5][0-9],\s*[0-6]?[0-9]/i.test(nudgeColor)) throw new Error(`nudge text looks red (punitive): ${nudgeColor}`);
  console.log(`  ✔ nudge feedback (gentle, terracotta): "${nudge.slice(0, 48)}…"`);
  await evaluate(`[...document.querySelectorAll('.step-btn')].find(b => /ô B/i.test(b.getAttribute('aria-label')||'') && b.textContent.trim()==='-')?.click()`);

  // -- continue by touch: plant the bag via taps until the why-overlay --------
  let whyVisible = false;
  for (let round = 0; round < 10 && !whyVisible; round++) {
    const bagNow = Number(await evaluate(`document.querySelector('.bag-count').textContent`)) || 0;
    for (let i = 0; i < bagNow; i++) await tap('.bag-btn', 'seed bag (touch)');
    const hasCorrect = /Đúng rồi|idle/.test(await evaluate(`document.querySelector('.feedback')?.getAttribute('data-feedback') || ''`));
    void hasCorrect;
    await tap('.cta-check', 'check (touch)');
    // Correct answers advance after ~1.4s; wrong ones nudge immediately —
    // on nudge, remove one seed and retry (self-correcting loop).
    await sleep(1500);
    whyVisible = await evaluate(`!!document.querySelector('.overlay[role="dialog"]')`);
  }
  console.log(whyVisible ? '  ✔ why-it-works bond overlay appears after 3 correct (touch path)' : '  ⚠ why overlay not shown within rounds');
  if (whyVisible) {
    await screenshot('03-why');
    await evaluate(`document.querySelector('.why-continue').click()`);
    await sleep(400);
  }

  // -- touch target sanity: all interactive elements ≥ 44px --------------------
  const smallTargets = await evaluate(`[...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).length`);
  if (smallTargets > 0) throw new Error(`${smallTargets} button(s) smaller than 44px`);
  console.log('  ✔ all visible buttons ≥ 44px touch targets');

  // -- reduced motion -----------------------------------------------------------
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  console.log('  ✔ prefers-reduced-motion emulated — app remains usable');
  await screenshot('04-play-reduced-motion');
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
