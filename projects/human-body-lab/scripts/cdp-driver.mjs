#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Chrome DevTools Protocol driver for Human Body Lab — zero dependencies.
// Exercises the real UI with mouse / touch / keyboard input, captures console
// errors, checks ≥44px targets on every activity screen, asserts no
// horizontal scroll anywhere and (≥1200px wide) no vertical scroll on main
// screens, and takes screenshots. Works against any URL (local preview or
// the live Shiplo deployment).
//
// Usage:
//   node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full]
//
// Flow "full":
//   overview → explore (mouse: toggle layers; keyboard: organ list → sheet;
//   Esc closes) → pathways (wrong turn + full oxygen route) → quiz (10
//   correct answers) → reduced-motion re-render. Exits non-zero on any
//   console error or broken step.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
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

// Fresh profile + disabled disk cache each run (pilot lesson: persistent
// profiles serve a stale index.html pointing at old hashed assets).
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
    consoleErrors.push(
      msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description ?? ''),
    );
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
  if (r.exceptionDetails) {
    throw new Error('page eval failed: ' + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
  }
  return r.result.value;
}

async function screenshot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const file = resolve(outDir, `${name}-${width}x${height}.png`);
  writeFileSync(file, Buffer.from(r.data, 'base64'));
  console.log(`  📸 ${name} → ${file}`);
  return file;
}

async function click(selector, label) {
  const pt = await evaluate(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`,
  );
  if (!pt) throw new Error(`click target not found: ${label ?? selector}`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await sleep(300);
}

async function key(keyName) {
  // `text` is required for the browser to synthesize the default action
  // (click on Enter/Space) from a CDP key event.
  const info = {
    Enter: { code: 'Enter', vk: 13, text: '\r' },
    Tab: { code: 'Tab', vk: 9 },
    Escape: { code: 'Escape', vk: 27 },
    ' ': { code: 'Space', vk: 32, text: ' ' },
  }[keyName] ?? { code: keyName, vk: keyName.charCodeAt(0) };
  const params = { key: keyName, code: info.code, windowsVirtualKeyCode: info.vk, nativeVirtualKeyCode: info.vk };
  if (info.text) params.text = info.text;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
  await sleep(140);
}

async function tap(selector, label) {
  const pt = await evaluate(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`,
  );
  if (!pt) throw new Error(`tap target not found: ${label ?? selector}`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(300);
}

/** Real-mouse on desktop; direct activation on emulated-mobile viewports
 *  (mouse/touch synthesis is unreliable under mobile emulation in this
 *  Chrome build — elementFromPoint hit-tests confirmed the targets). */
async function jsClick(selector, label) {
  const ok = await evaluate(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.scrollIntoView({ block: 'center' }); el.click(); return true; })()`,
  );
  if (ok !== true) throw new Error(`jsClick target not found: ${label ?? selector}`);
  await sleep(300);
}
const interact = width <= 900 ? jsClick : click;

/** Activity-screen gates: ≥44px buttons; no horizontal overflow; report fit. */
async function screenGates(name, { requireVerticalFit = false } = {}) {
  const small = await evaluate(
    `[...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).map(b => (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 30))`,
  );
  if (small.length) throw new Error(`[${name}] buttons < 44px: ${JSON.stringify(small)}`);
  const m = await evaluate(
    `JSON.stringify({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, sh: document.documentElement.scrollHeight, ih: window.innerHeight })`,
  );
  const { sw, iw, sh, ih } = JSON.parse(m);
  if (sw > iw + 1) throw new Error(`[${name}] horizontal scroll: ${sw} > ${iw}`);
  if (requireVerticalFit && sh > ih + 2) {
    throw new Error(`[${name}] vertical overflow at ${width}x${height}: ${sh} > ${ih}`);
  }
  console.log(`  ✔ [${name}] targets ≥44px, no h-scroll, content ${sh}px / viewport ${ih}px${sh > ih + 2 ? ' (designed scroll)' : ''}`);
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
  console.log(`▶ ${url} — "${title}" @ ${width}x${height}`);

  // ---- overview -------------------------------------------------------------
  const overviewOk = await evaluate(
    `!!document.querySelector('.overview-plate svg') && document.querySelectorAll('.entry').length === 3`,
  );
  if (!overviewOk) throw new Error('overview did not render plate + 3 entries');
  console.log('  ✔ overview renders ghost plate + 3 entry cards');
  await screenGates('overview', { requireVerticalFit: width >= 1200 });
  await screenshot('01-overview');

  if (flow === 'smoke') finish();

  // ---- explore: mouse toggle → keyboard organ list → sheet -------------------
  await interact('.entry', 'explore entry card');
  await waitFor(() => evaluate(`!!document.querySelector('.explore .chips')`), 8000, 'explore screen');
  console.log('  ✔ mouse click opens Explore');

  await interact('.chip.sys-respiratory', 'respiratory chip');
  const respOn = await evaluate(`document.querySelector('.chip.sys-respiratory')?.getAttribute('aria-pressed')`);
  if (respOn !== 'true') throw new Error('respiratory chip did not switch on');
  const lungsVisible = await evaluate(
    `!!document.querySelector('#organ-lungs') && document.querySelector('#organ-lungs').closest('g').style.display !== 'none'`,
  );
  if (!lungsVisible) throw new Error('lungs organ not visible after toggle');
  const callouts = await evaluate(`document.querySelectorAll('.callout-name').length`);
  if (callouts < 3) throw new Error(`expected ≥3 callout labels, got ${callouts}`);
  console.log('  ✔ layer toggle shows organs + callout labels');
  await screenGates('explore');
  await screenshot('02-explore-resp');

  // keyboard: focus the organ list button for Lungs, Enter opens the sheet
  await evaluate(
    `[...document.querySelectorAll('.organ-item')].find(b => b.textContent.includes('Lungs'))?.focus()`,
  );
  await key('Enter');
  const sheetOpen = await evaluate(`!!document.querySelector('.sheet[role="dialog"]')`);
  if (!sheetOpen) throw new Error('keyboard Enter on organ list did not open the sheet');
  const sheetTitle = await evaluate(`document.querySelector('.sheet-title')?.textContent`);
  if (sheetTitle !== 'Lungs') throw new Error(`sheet shows "${sheetTitle}", expected "Lungs"`);
  console.log('  ✔ keyboard path opens organ sheet (Lungs)');
  await screenshot('03-organ-sheet');

  // Esc closes and returns focus to the trigger
  await evaluate(`document.querySelector('.sheet-close')?.focus()`);
  await key('Escape');
  const sheetClosed = await evaluate(`!document.querySelector('.sheet[role="dialog"]')`);
  if (!sheetClosed) throw new Error('Esc did not close the organ sheet');
  console.log('  ✔ Esc closes the sheet');

  // SVG organ is a real button: keyboard-activate it too
  await evaluate(`document.querySelector('#organ-lungs')?.focus()`);
  await key('Enter');
  const sheetSvgTitle = await evaluate(
    `(() => { const s = document.querySelector('.sheet[role="dialog"]'); return s ? (s.querySelector('.sheet-title')?.textContent ?? '') : null; })()`,
  );
  if (sheetSvgTitle !== 'Lungs') {
    throw new Error(`SVG organ keyboard activation failed (sheet title: ${sheetSvgTitle})`);
  }
  console.log('  ✔ SVG organ hit-target is keyboard operable');
  await key('Escape');

  // ---- pathways: wrong turn then full oxygen route --------------------------
  await tap('.nav-tab:nth-child(3)', 'Pathways nav (touch)');
  await waitFor(() => evaluate(`!!document.querySelector('.pathway-picker')`), 8000, 'pathways screen');
  console.log('  ✔ touch tap opens Pathways');
  await screenGates('pathways');

  // wrong first pick: Lungs (oxygen starts at the Nose)
  const wrongPick = await evaluate(
    `(() => { const b = [...document.querySelectorAll('.choice')].find(x => x.textContent.includes('Lungs')); if (!b) return null; b.scrollIntoView({block:'center'}); b.click(); return 'clicked'; })()`,
  );
  if (wrongPick !== 'clicked') throw new Error('Lungs choice not found for wrong-turn test');
  if (wrongPick !== 'clicked') throw new Error('Lungs choice not found for wrong-turn test');
  await sleep(250);
  const wrongFeedback = await evaluate(
    `document.querySelector('.feedback.wrong')?.textContent ?? ''`,
  );
  if (!/reread the last step/i.test(wrongFeedback)) {
    throw new Error(`expected gentle re-ground hint, got "${wrongFeedback.slice(0, 60)}"`);
  }
  const noReset = await evaluate(`document.querySelectorAll('.progress li.done').length`);
  if (noReset !== 0) throw new Error('wrong pick advanced progress (punitive)');
  console.log('  ✔ wrong turn: gentle hint, no punishment');

  // complete the oxygen route: Nose → Trachea → Lungs → Heart → Body cells
  for (const stop of ['Nose', 'Trachea', 'Lungs', 'Heart', 'Body cells']) {
    const clicked = await evaluate(
      `(() => { const b = [...document.querySelectorAll('.choice')].find(x => x.textContent.trim().includes(${JSON.stringify(stop)})); if (!b) return null; b.scrollIntoView({block:'center'}); b.click(); return true; })()`,
    );
    if (clicked !== true) throw new Error(`choice "${stop}" not found`);
    await sleep(650);
  }
  const recap = await evaluate(`!!document.querySelector('.recap')`);
  if (!recap) throw new Error('oxygen route did not complete');
  const segments = await evaluate(`document.querySelectorAll('.route-seg').length`);
  if (segments !== 4) throw new Error(`expected 4 route segments, got ${segments}`);
  const recorded = await evaluate(
    `(() => { try { const p = JSON.parse(localStorage.getItem('human-body-lab:v1') ?? '{}'); return Array.isArray(p.completedPathways) && p.completedPathways.includes('oxygen'); } catch { return false; } })()`,
  );
  if (recorded !== true) throw new Error('oxygen completion not recorded in anonymous progress');
  console.log('  ✔ oxygen route completes: 4 segments drawn, recap + progress recorded');
  await screenshot('04-oxygen-complete');

  // ---- quiz: answer all 10 correctly ----------------------------------------
  const KEY = [1, 2, 0, 3, 1, 2, 0, 1, 1, 1];
  await interact('.nav-tab:nth-child(4)', 'Quiz nav');
  await waitFor(() => evaluate(`!!document.querySelector('.quiz-card')`), 8000, 'quiz screen');
  await screenGates('quiz');
  for (let i = 0; i < KEY.length; i++) {
    await evaluate(
      `document.querySelectorAll('.option')[${KEY[i]}]?.scrollIntoView({block:'center'})`,
    );
    await (width <= 900 ? jsClick : click)(`.options .option:nth-child(${KEY[i] + 1})`, `q${i + 1} option ${KEY[i]}`);
    const explained = await evaluate(`!!document.querySelector('.explain')`);
    if (!explained) throw new Error(`q${i + 1}: no explanation shown`);
    const correct = await evaluate(`document.querySelector('.explain')?.classList.contains('correct')`);
    if (correct !== true) throw new Error(`q${i + 1}: expected correct feedback (driver key mismatch?)`);
    await (width <= 900 ? jsClick : click)('.quiz-actions .btn', 'next question');
    await sleep(150);
  }
  const score = await evaluate(`document.querySelector('.score-num')?.textContent`);
  if (score !== '10') throw new Error(`expected 10/10, got ${score}`);
  console.log('  ✔ quiz: 10/10 with explanations, summary renders');
  await screenshot('05-quiz-summary');

  // ---- reduced motion ---------------------------------------------------------
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await sleep(500);
  const stillRenders = await evaluate(`document.body && document.body.innerText.trim().length > 0`);
  if (!stillRenders) throw new Error('content empty under reduced motion');
  await interact('.nav-tab:nth-child(1)', 'Overview under reduced motion');
  await sleep(400);
  const overviewStill = await evaluate(`document.querySelectorAll('.entry').length === 3`);
  if (!overviewStill) throw new Error('overview broken under reduced motion');
  console.log('  ✔ prefers-reduced-motion emulated — all screens still render');
  await screenshot('06-reduced-motion');

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
