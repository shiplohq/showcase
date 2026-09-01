#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Minimal Chrome DevTools Protocol driver — no dependencies (adapted from the
// pilot #01 reference). Exercises the real Money Market Junior UI end-to-end:
//   market renders → mouse add → keyboard add → over-budget teach state →
//   recover → touch checkout → pay with count-up → receipt (budget mode) →
//   change-maker mission → pay → build the change → receipt (change mode).
// Also checks: zero console errors, no horizontal overflow, buttons ≥44px,
// prefers-reduced-motion usability.
//
// Usage: node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|smoke]

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
  console.error('usage: node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|smoke]');
  process.exit(2);
}

const errors = [];
const consoleErrors = [];

// Fresh profile + disabled disk cache each run (pilot lesson: a persistent
// profile serves a stale index.html pointing at old hashed assets).
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  '--remote-debugging-port=9341',
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
  const res = await fetch('http://127.0.0.1:9341/json/list');
  const targets = await res.json();
  return targets.find((t) => t.type === 'page') ?? null;
}, 15000, 'chrome devtools endpoint');
const ws = new WebSocket(list.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

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

async function center(selector) {
  return evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({ block: 'center', inline: 'center' }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
}

async function click(selector, label) {
  const pt = await center(selector);
  if (!pt) throw new Error(`click target not found: ${label ?? selector}`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await sleep(280);
}

async function tap(selector, label) {
  const pt = await center(selector);
  if (!pt) throw new Error(`tap target not found: ${label ?? selector}`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(320);
}

async function key(keyName) {
  const codes = { Enter: 13, Tab: 9, Escape: 27, ' ': 32 };
  const code = codes[keyName];
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, windowsVirtualKeyCode: code ?? keyName.charCodeAt(0), nativeVirtualKeyCode: code ?? keyName.charCodeAt(0) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, windowsVirtualKeyCode: code ?? keyName.charCodeAt(0), nativeVirtualKeyCode: code ?? keyName.charCodeAt(0) });
  await sleep(120);
}

/** product card button by product name */
const cardFor = (name) => `mmj-product-card button.card[aria-label*="${name}"]`;
/** basket stepper by action + product name */
const stepFor = (name, action) => `button[aria-label="${action} one ${name}"]`;
const walletToken = (d) => `button[aria-label^="Put a ${d} token"]`;
const trayToken = (d) => `button[aria-label^="Take the ${d} token back"]`;
const changeCoin = (d) => `button[aria-label^="Add a ${d} token"]`;

/** narrow screens: the basket is a collapsed section — open it before use */
async function openBasketIfNeeded() {
  const toggle = await evaluate(
    `(() => { const t = document.querySelector('.basket__toggle'); if (!t) return null;` +
    ` const body = t.closest('.basket').querySelector('.basket__body');` +
    ` return getComputedStyle(body).display === 'none' ? { has: true } : null; })()`,
  );
  if (toggle) {
    await click('.basket__toggle', 'basket toggle (open)');
    await sleep(300);
  }
}

mkdirSync(outDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 });

async function checkNoOverflow(label) {
  const over = await evaluate(
    `(() => { const d = document.scrollingElement; const bad = [];` +
    ` if (d.scrollWidth > d.clientWidth + 1) bad.push('document ' + d.scrollWidth + '>' + d.clientWidth);` +
    ` for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect();` +
    `   if (r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1)) { bad.push(el.tagName + '.' + (el.className?.toString?.().split(' ')[0] ?? '') + ' right=' + Math.round(r.right)); if (bad.length > 4) break; } }` +
    ` return bad; })()`,
  );
  if (over && over.length > 0) throw new Error(`horizontal overflow at ${label}: ${over.join(' | ')}`);
  console.log(`  ✔ no horizontal overflow (${label})`);
}

async function basketTotal() {
  return Number(await evaluate(`document.querySelector('[data-total]')?.getAttribute('data-total') || '0'`));
}

try {
  await send('Page.navigate', { url });
  await sleep(2600); // fonts + JSON fetch settle

  const title = await evaluate('document.title');
  console.log(`▶ ${url} — "${title}" @ ${width}x${height}`);

  // -- market renders ---------------------------------------------------------
  const stalls = await evaluate(`document.querySelectorAll('mmj-stall-band .stall').length`);
  if (stalls < 4) throw new Error(`expected 4 stalls, got ${stalls}`);
  const cards = await evaluate(`document.querySelectorAll('mmj-product-card button.card').length`);
  if (cards !== 8) throw new Error(`expected 8 product cards, got ${cards}`);
  console.log(`  ✔ market renders ${stalls} stalls / ${cards} products`);
  await checkNoOverflow('market, initial');
  await screenshot('01-market');

  if (flow === 'smoke') finish();

  // -- mouse: add apple + berries ----------------------------------------------
  await click(cardFor('Crisp Apple'), 'apple card (mouse)');
  await click(cardFor('Berry Box'), 'berries card (mouse)');
  if ((await basketTotal()) !== 12) throw new Error(`expected total 12 after apple+berries, got ${await basketTotal()}`);
  console.log('  ✔ mouse adds apple + berries → total 12');

  // -- keyboard: Space on the lemonade card adds it ------------------------------
  await evaluate(`document.querySelector(${JSON.stringify(cardFor('Lemonade'))}).focus()`);
  await key(' ');
  await evaluate(`document.querySelector(${JSON.stringify(cardFor('Milk Carton'))}).focus()`);
  await key(' ');
  if ((await basketTotal()) !== 24) throw new Error(`expected total 24 after +lemonade+milk, got ${await basketTotal()}`);
  console.log('  ✔ keyboard Space adds lemonade + milk → total 24');

  // -- over-budget teach state ---------------------------------------------------
  await click(cardFor('Cinnamon Bun'), 'bun (pushes over 30)');
  const over = await evaluate(`document.querySelector('.budget__note--over')?.textContent?.trim() ?? ''`);
  if (!/1 token over|1 tokens over/i.test(over)) throw new Error(`expected "1 token over" note, got "${over}"`);
  const checkoutDisabled = await evaluate(`document.querySelector('.basket__checkout').disabled`);
  if (!checkoutDisabled) throw new Error('checkout must be disabled while over budget');
  const reason = await evaluate(`document.querySelector('.basket__reason').textContent`);
  if (!/over the budget/i.test(reason)) throw new Error(`over-budget reason missing: "${reason}"`);
  console.log(`  ✔ over-budget state: "${over}" + disabled checkout + spoken reason`);

  // -- recover via basket stepper (mouse) ----------------------------------------
  await openBasketIfNeeded();
  await click(stepFor('Cinnamon Bun', 'Remove'), 'basket stepper −');
  if ((await basketTotal()) !== 24) throw new Error(`expected total back to 24, got ${await basketTotal()}`);
  const ready = await evaluate(`!document.querySelector('.basket__checkout').disabled`);
  if (!ready) throw new Error('checkout should be enabled after recovery');
  console.log('  ✔ stepper removes the bun → total 24, checkout enabled');
  await screenshot('02-basket');

  // -- touch: checkout → pay → receipt (budget mode) ------------------------------
  await openBasketIfNeeded();
  await tap('.basket__checkout', 'checkout (touch)');
  const payHeading = await evaluate(`!!document.querySelector('.checkout__title')`);
  if (!payHeading) throw new Error('checkout screen did not mount');
  console.log('  ✔ touch opens the checkout counter');

  // place two 10s → 20 of 24 → remaining feedback
  await click(walletToken(10), 'wallet 10');
  await click(walletToken(10), 'wallet 10');
  const remaining = await evaluate(`document.querySelector('.pay-status').textContent`);
  if (!/4 more/i.test(remaining)) throw new Error(`expected "4 more needed", got "${remaining}"`);
  console.log(`  ✔ under-pay feedback: "${remaining}"`);
  if (!(await evaluate(`!document.querySelector('.checkout__pay').disabled === false`))) {
    throw new Error('pay button must be disabled while under-paying');
  }

  // third 10 → paid 30, change 6 (total 24)
  await click(walletToken(10), 'wallet 10');
  const changeText = await evaluate(`document.querySelector('.pay-status').textContent`);
  if (!/Change to give back: 6/i.test(changeText)) throw new Error(`expected change 6, got "${changeText}"`);
  console.log(`  ✔ over-pay feedback: "${changeText}"`);
  await screenshot('03-checkout');

  // take a token back and re-place (reversibility): paid 20 → 4 remaining
  await click(trayToken(10), 'take 10 back');
  if (!/4 more/i.test(await evaluate(`document.querySelector('.pay-status').textContent`))) {
    throw new Error('take-back did not restore remaining feedback');
  }
  await click(walletToken(10), 'wallet 10 again');
  await click('.checkout__pay', 'pay');
  await sleep(900); // receipt slide + stamp
  const ticket = await evaluate(`document.querySelector('.ticket') ? document.querySelector('.ticket').textContent : ''`);
  if (!/Total/i.test(ticket) || !/Change/i.test(ticket)) throw new Error('receipt did not render');
  if (!/6/.test(ticket)) throw new Error('receipt missing change 6');
  console.log('  ✔ pay → receipt ticket renders (total 24, paid 30, change 6)');
  await screenshot('04-receipt');

  // shop again → market resets basket
  await evaluate(`[...document.querySelectorAll('button')].find(b => /Shop another picnic/i.test(b.textContent)).click()`);
  await sleep(500);
  if ((await basketTotal()) !== 0) throw new Error('basket should reset after Shop another picnic');
  console.log('  ✔ "Shop another picnic" resets the basket');

  // -- change-maker mission (change mode) -----------------------------------------
  await evaluate(`[...document.querySelectorAll('.mission-tab')].find(b => /Change Maker/i.test(b.textContent)).click()`);
  await sleep(500);
  // strawberries(8) + roll(3) + lemonade×2(10) = 21; fruit 1 ✓ bakery 1 ✓ drink 2 ✓
  await click(cardFor('Berry Box'), 'berries');
  await click(cardFor('Bread Roll'), 'roll');
  await click(cardFor('Lemonade'), 'lemonade 1');
  await click(cardFor('Lemonade'), 'lemonade 2');
  if ((await basketTotal()) !== 21) throw new Error(`expected 21 in change mission, got ${await basketTotal()}`);
  await openBasketIfNeeded();
  await click('.basket__checkout', 'checkout (change mission)');
  await sleep(400);

  // wallet 2×20 → paid 40, change 19 → change-build phase
  await click(walletToken(20), 'note 20');
  await click(walletToken(20), 'note 20');
  await click('.checkout__pay', 'pay (change mission)');
  await sleep(400);
  const changePhase = await evaluate(`!!document.querySelector('.counter--change')`);
  if (!changePhase) throw new Error('change-build phase did not open');
  const target = await evaluate(`document.querySelector('.counter--change [data-total]')?.getAttribute('data-total')`);
  if (target !== '19') throw new Error(`expected change target 19, got ${target}`);

  // wrong build first (teach state): 10+10 = 20 ≠ 19
  await click(changeCoin(10), 'change 10');
  await click(changeCoin(10), 'change 10');
  const wrong = await evaluate(`document.querySelector('.pay-status').textContent`);
  if (!/1 too many/i.test(wrong)) throw new Error(`expected "1 too many" nudge, got "${wrong}"`);
  console.log(`  ✔ wrong change build gets a spoken delta: "${wrong}"`);
  await evaluate(`document.querySelector('.tray--change [aria-label^="Take the 10 token out"]').click()`); // take one out
  // correct build: 10+5+2+2 = 19 (multiple solutions — also valid: 10+5+2+1+1)
  await click(changeCoin(5), 'change 5');
  await click(changeCoin(2), 'change 2');
  await click(changeCoin(2), 'change 2');
  const okFeedback = await evaluate(`document.querySelector('.pay-status').textContent`);
  if (!/exactly/i.test(okFeedback)) throw new Error(`expected exact-change feedback, got "${okFeedback}"`);
  await screenshot('05-change-build');
  await click('.checkout__actions .btn--primary', 'give the change');
  await sleep(900);
  const ticket2 = await evaluate(`document.querySelector('.ticket')?.textContent ?? ''`);
  if (!/19/.test(ticket2)) throw new Error('change mission receipt missing 19');
  console.log('  ✔ change built by hand (10+5+2+2) → receipt (change 19)');

  // -- touch-target sanity ----------------------------------------------------------
  const small = await evaluate(`[...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).length`);
  if (small > 0) throw new Error(`${small} button(s) smaller than 44px`);
  console.log('  ✔ all visible buttons ≥ 44px touch targets');

  // -- reduced motion -----------------------------------------------------------------
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await evaluate(`[...document.querySelectorAll('button')].find(b => /Shop another picnic/i.test(b.textContent)).click()`);
  await sleep(400);
  const usable = await evaluate(`!!document.querySelector('mmj-stall-band .stall') && document.querySelectorAll('mmj-product-card button.card').length === 8`);
  if (!usable) throw new Error('app not usable under reduced motion');
  console.log('  ✔ prefers-reduced-motion emulated — market renders and stays usable');
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
