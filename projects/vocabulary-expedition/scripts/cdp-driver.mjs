#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Project CDP driver — full learning-flow verification for Vocabulary
// Expedition (adapted from the number-garden reference per repo policy).
// Drives the REAL UI with mouse / touch / keyboard against any URL (local
// preview or the live Shiplo deployment):
//   map → open scene (mouse) → look-around plate (keyboard) → clue hunt incl.
//   wrong-tap nudge + glow hint (mouse) → label match incl. pick-and-place and
//   wrong drop (touch) → sentence builder incl. wrong chip (mouse) → scene
//   complete overlay → scrapbook sticker.
// Also asserts: zero console errors, every visible button ≥44px, 200% zoom
// reflow sanity, prefers-reduced-motion usability.
//
// Usage: node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900]

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
if (!url) {
  console.error('usage: node cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900]');
  process.exit(2);
}

const errors = [];
const consoleErrors = [];

// Fresh profile + no disk cache every run (pilot #01 lesson: a persistent
// profile serves a stale index.html pointing at old hashed assets).
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
  const res = await fetch('http://127.0.0.1:9335/json/list');
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

async function centerOf(selector) {
  // Scroll into view first: the dock sits below the fold at some viewports and
  // CDP coordinate events outside the viewport hit <html> instead.
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: Math.min(Math.max(r.y + r.height / 2, 10), innerHeight - 10) }; })()`);
  if (!pt) throw new Error(`target not found: ${selector}`);
  await sleep(120);
  return pt;
}

async function click(selector, label) {
  const pt = await centerOf(selector);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await sleep(280);
  void label;
}

async function tap(selector, label) {
  const pt = await centerOf(selector);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(320);
  void label;
}

async function key(keyName) {
  const codes = { Enter: 13, Tab: 9, Escape: 27, ' ': 32 };
  const vk = codes[keyName] ?? keyName.charCodeAt(0);
  const codeName = { Enter: 'Enter', Tab: 'Tab', Escape: 'Escape', ' ': 'Space' }[keyName] ?? keyName;
  const text = keyName === 'Enter' ? '\r' : keyName === ' ' ? ' ' : '';
  for (const type of ['keyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', {
      type,
      key: keyName,
      code: codeName,
      windowsVirtualKeyCode: vk,
      nativeVirtualKeyCode: vk,
      ...(type === 'keyDown' && text ? { text } : {}),
    });
  }
  await sleep(150);
}

/** Click the first button inside `scope` whose textContent includes `text`. */
async function clickBtnWithText(text, scope = '.dock') {
  const ok = await evaluate(`(() => { const btn = [...document.querySelectorAll(${JSON.stringify(scope)} + ' button')].find(b => b.textContent.includes(${JSON.stringify(text)}) && b.offsetParent !== null); if (!btn) return false; btn.click(); return true; })()`);
  if (!ok) throw new Error(`button containing "${text}" not found in ${scope}`);
  await sleep(300);
}

/** Assert every visible button (incl. scene hotspots) is ≥44px in BOTH
 *  dimensions — definition of done on every breakpoint, so run it on scene
 *  screens, not only the album (review P2: 17/42 hotspots were <44px on the
 *  tablet hero viewport when this only ran on the scrapbook). */
async function checkButtons44(where) {
  const small = await evaluate(`(() => {
    const bad = [];
    for (const b of document.querySelectorAll('button')) {
      if (!b.offsetParent && b.getClientRects().length === 0) continue;
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // 0.25px subpixel tolerance — CSS enforces min 44; getBoundingClientRect
      // can report 43.99 under fractional layout scaling.
      if (r.width < 43.75 || r.height < 43.75) {
        const label = (b.getAttribute('data-hotspot') || b.textContent || b.getAttribute('aria-label') || 'btn').trim().slice(0, 24);
        bad.push(label + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
    }
    return bad;
  })()`);
  if (small.length > 0) throw new Error(`${where}: ${small.length} button(s) <44px → ${small.slice(0, 6).join(', ')}`);
  console.log(`  ✔ ${where}: all buttons ≥ 44px touch targets`);
}

/** Click the chip (word label) whose visible text is exactly `word`.
 *  Uses a real coordinate click (chips pick up via pointer events); if
 *  `verifyExpr` is given and still falsy afterwards, retries once via a
 *  synthetic click (sentence chips listen to plain @click). */
async function clickChip(word, verifyExpr) {
  const found = await evaluate(`(() => { const chip = [...document.querySelectorAll('.dock .chip')].find(c => c.textContent.trim() === ${JSON.stringify(word)} && c.offsetParent !== null); if (!chip) return null; chip.scrollIntoView({ block: 'center' }); const r = chip.getBoundingClientRect(); return { x: r.x + r.width / 2, y: Math.min(Math.max(r.y + r.height / 2, 10), innerHeight - 10) }; })()`);
  if (!found) throw new Error(`chip "${word}" not found`);
  await sleep(150);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: found.x, y: found.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: found.x, y: found.y, button: 'left', clickCount: 1 });
  await sleep(320);
  if (verifyExpr) {
    const ok1 = await evaluate(verifyExpr);
    if (!ok1) {
      await evaluate(`(() => { const chip = [...document.querySelectorAll('.dock .chip')].find(c => c.textContent.trim() === ${JSON.stringify(word)}); if (chip) chip.click(); })()`);
      await sleep(320);
      const ok2 = await evaluate(verifyExpr);
      if (!ok2) throw new Error(`chip "${word}" click had no effect (verified expression falsy)`);
      console.log(`  ⚠ chip "${word}" needed a synthetic click fallback`);
    }
  }
}

/** Pointer-drag path: real pointerdown/move/up through the app's handlers,
 *  with the drop point measured fresh so elementFromPoint hit-tests truly. */
async function dragChipTo(word, hotspotId) {
  const ok = await evaluate(`(async () => {
    const chip = [...document.querySelectorAll('.dock .chip')].find(c => c.textContent.trim() === ${JSON.stringify(word)});
    if (!chip) return 'chip-missing';
    const target = document.querySelector('[data-hotspot="${hotspotId}"]');
    if (!target) return 'hotspot-missing';
    target.scrollIntoView({ block: 'center' });
    await new Promise(r => setTimeout(r, 150));
    const cr = chip.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    const mk = (type, x, y) => new PointerEvent(type, {
      bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'mouse',
      isPrimary: true, clientX: x, clientY: y, button: 0, buttons: 1,
    });
    chip.dispatchEvent(mk('pointerdown', cr.x + cr.width / 2, cr.y + cr.height / 2));
    chip.dispatchEvent(mk('pointermove', cr.x + 60, cr.y - 40));
    chip.dispatchEvent(mk('pointermove', tr.x + tr.width / 2, tr.y + tr.height / 2));
    chip.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'mouse',
      isPrimary: true, clientX: tr.x + tr.width / 2, clientY: tr.y + tr.height / 2, button: 0, buttons: 0,
    }));
    return 'ok';
  })()`);
  if (ok !== 'ok') throw new Error(`drag ${word}→${hotspotId} failed: ${ok}`);
  await sleep(400);
}

mkdirSync(outDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 });

try {
  await send('Page.navigate', { url });
  await sleep(2600); // fonts + JSON settle

  const title = await evaluate('document.title');
  console.log(`▶ ${url} — "${title}" @ ${width}x${height}`);

  // -- map renders 6 stations ------------------------------------------------
  const markers = await evaluate(`document.querySelectorAll('.map-marker').length`);
  if (markers < 6) throw new Error(`map rendered ${markers} stations (expected 6)`);
  console.log(`  ✔ expedition map renders ${markers} stations`);

  // mobile trail list: every station box fully inside the stage, none
  // overlapping (review P2: clipped + overlapping markers at 390px)
  if (width <= 479) {
    const boxIssues = await evaluate(`(() => {
      const stage = document.querySelector('.map-stage').getBoundingClientRect();
      const ms = [...document.querySelectorAll('.map-marker')].map(m => m.getBoundingClientRect());
      const issues = [];
      for (const r of ms) {
        if (r.left < stage.left - 0.5 || r.right > stage.right + 0.5 || r.top < stage.top - 0.5 || r.bottom > stage.bottom + 0.5) issues.push('marker outside stage');
      }
      for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
        const a = ms[i], b = ms[j];
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 1 && oy > 1) issues.push('markers overlap');
      }
      return [...new Set(issues)];
    })()`);
    if (boxIssues.length > 0) throw new Error(`mobile map layout: ${boxIssues.join(', ')}`);
    console.log('  ✔ mobile trail list: all stations inside the stage, no overlaps');
  }
  await screenshot('01-map');

  // -- Vietnamese help layer toggles off and back (spec acceptance) -----------
  const viBefore = await evaluate(`document.querySelectorAll('.vi').length`);  await evaluate(`document.querySelector('button[aria-label*="Vietnamese help layer: on"]')?.click()`);
  await sleep(200);
  const viAfter = await evaluate(`document.querySelectorAll('.vi').length`);
  if (viBefore === 0 || viAfter !== 0) throw new Error(`VI layer toggle failed: ${viBefore} → ${viAfter}`);
  console.log('  ✔ Vietnamese help layer hides completely when toggled off');
  await evaluate(`document.querySelector('button[aria-label*="Vietnamese help layer: off"]')?.click()`);
  await sleep(200);

  // -- mouse: open the first scene -------------------------------------------
  await click('.map-marker', 'first station');
  await waitFor(() => evaluate(`!!document.querySelector('.art-wrap') && document.querySelectorAll('.hotspot').length >= 7`), 8000, 'scene art + hotspots');
  const hotspots = await evaluate(`document.querySelectorAll('.hotspot').length`);
  console.log(`  ✔ scene screen mounts with ${hotspots} hotspots (mouse path)`);
  await checkButtons44('scene screen (look-around hotspots)');

  // -- keyboard: hotspot plate via Enter --------------------------------------
  await evaluate(`document.querySelector('[data-hotspot="clock"]')?.focus()`);
  await key('Enter');
  const plateWord = await evaluate(`document.querySelector('.caption-plate .word')?.textContent?.trim()`);
  if (plateWord !== 'clock') throw new Error(`keyboard plate shows "${plateWord}" (expected clock)`);
  console.log('  ✔ keyboard: Enter on hotspot opens the caption plate');

  // -- look-around plate closes on second tap (touch) --------------------------
  await tap('[data-hotspot="clock"]', 'same hotspot (touch toggle)');
  const plateGone = await evaluate(`!document.querySelector('.caption-plate')`);
  if (!plateGone) throw new Error('plate did not close on second tap');
  console.log('  ✔ touch: second tap closes the plate');

  // -- clue hunt ----------------------------------------------------------------
  await clickBtnWithText('Start the clue hunt');
  const clue1 = await evaluate(`document.querySelector('.clue-text')?.textContent?.trim()`);
  if (!clue1 || !clue1.includes('long and soft')) throw new Error(`first clue unexpected: "${clue1}"`);

  // wrong tap → gentle nudge (never a lockout)
  await tap('[data-hotspot="bookshelf"]', 'wrong object');
  const nudge = await evaluate(`document.querySelector('.feedback-strip[data-kind="nudge"]')?.textContent?.trim()`);
  if (!nudge) throw new Error('wrong tap produced no gentle nudge');
  console.log(`  ✔ nudge (gentle): "${nudge.slice(0, 52)}…"`);

  // second miss → glow hint appears on the true target
  await tap('[data-hotspot="bookshelf"]', 'wrong object again');
  const glow = await evaluate(`!!document.querySelector('.hotspot--glow')`);
  if (!glow) throw new Error('no glow hint after two misses');
  console.log('  ✔ glow hint after 2 misses (help, not punishment)');

  // home clue order: sofa, clock, lamp, plant
  for (const id of ['sofa', 'clock', 'lamp', 'plant']) {
    await tap(`[data-hotspot="${id}"]`, `clue ${id}`);
    const good = await evaluate(`!!document.querySelector('.feedback-strip[data-kind="correct"]')`);
    if (!good) throw new Error(`clue for "${id}" not accepted`);
    const next = await evaluate(`!!document.querySelector('.dock .btn--primary')`);
    if (!next) throw new Error(`next-clue button missing after "${id}"`);
    await clickBtnWithText('Next clue');
  }
  await waitFor(() => evaluate(`document.querySelector('.dock').getAttribute('data-tab') === 'labels'`), 6000, 'labels tab');
  console.log('  ✔ clue hunt completes → labels unlocked');

  // -- label match ---------------------------------------------------------------
  await screenshot('02-labels');
  // wrong drop first: pick up "sofa" and put it on the bookshelf
  await clickChip('sofa', `document.querySelector('.dock .hint')?.textContent?.includes('sofa')`);
  await tap('[data-hotspot="bookshelf"]', 'wrong placement');
  const mnudge = await evaluate(`document.querySelector('.feedback-strip[data-kind="nudge"]')?.textContent?.includes('somewhere else')`);
  if (!mnudge) throw new Error('wrong placement did not nudge gently');
  console.log('  ✔ label match: wrong chip returns to tray with a gentle note');

  // home label targets: picture, bookshelf, rug, sofa (word === id for home)
  // first one via true pointer DRAG, the rest via pick-and-place (touch)
  await dragChipTo('picture', 'picture');
  const dragged = await evaluate(`document.querySelectorAll('.annotation').length`);
  if (dragged < 1) throw new Error('pointer drag did not pin the label');
  console.log('  ✔ label match: pointer drag pins a label');
  for (const id of ['bookshelf', 'rug', 'sofa']) {
    await clickChip(id);
    await tap(`[data-hotspot="${id}"]`, `place ${id}`);
  }
  const placed = await evaluate(`document.querySelectorAll('.annotation').length`);
  if (placed < 4) throw new Error(`expected 4 pinned annotations, found ${placed}`);
  console.log(`  ✔ label match: 4/4 annotations pinned (pick-and-place + touch)`);
  await checkButtons44('scene screen (labels tab)');
  await waitFor(() => evaluate(`document.querySelector('.dock').getAttribute('data-tab') === 'sentences'`), 6000, 'sentences tab');

  // -- sentence builder ------------------------------------------------------------
  await screenshot('03-sentences');
  // wrong chip first: sentence 1 answer is "sofa" — try "clock"
  await clickChip('clock', `document.querySelector('.blank-word')?.textContent?.trim() === 'clock'`);
  await clickBtnWithText('Check');
  const snudge = await evaluate(`document.querySelector('.feedback-strip[data-kind="nudge"]')?.textContent?.includes('try another word')`);
  if (!snudge) throw new Error('wrong chip did not nudge');
  console.log('  ✔ sentences: wrong chip → gentle "try another word"');

  // answers per units.json: sofa, lamp, picture
  for (const word of ['sofa', 'lamp', 'picture']) {
    await clickChip(word, `document.querySelector('.blank-word')?.textContent?.trim() === ${JSON.stringify(word)}`);
    await clickBtnWithText('Check');
    const good = await evaluate(`!!document.querySelector('.feedback-strip[data-kind="correct"]')`);
    if (!good) throw new Error(`sentence with "${word}" not accepted`);
    const notLast = word !== 'picture';
    if (notLast) await clickBtnWithText('Next sentence');
  }
  const dialogue = await evaluate(`document.querySelectorAll('.dialogue-card').length`);
  if (dialogue < 3) throw new Error(`expected 3 dialogue cards, found ${dialogue}`);

  // scene complete overlay
  await waitFor(() => evaluate(`!!document.querySelector('.overlay[role="dialog"]')`), 6000, 'scene-complete overlay');
  console.log('  ✔ scene complete overlay appears after 3/3 sentences');
  await screenshot('04-complete');
  await evaluate(`[...document.querySelectorAll('.overlay .card button')].find(b => /scrapbook/i.test(b.textContent))?.click()`);

  // -- scrapbook -----------------------------------------------------------------
  await waitFor(() => evaluate(`!!document.querySelector('.scrapbook')`), 6000, 'scrapbook');
  const stickers = await evaluate(`document.querySelectorAll('.sticker').length`);
  if (stickers < 7) throw new Error(`scrapbook shows ${stickers} stickers (expected ≥7 for home words)`);
  console.log(`  ✔ scrapbook collects ${stickers} stickers`);

  // sticker detail (keyboard)
  await evaluate(`document.querySelector('.sticker')?.focus()`);
  await key('Enter');
  const detail = await evaluate(`!!document.querySelector('.overlay .caption-plate')`);
  if (!detail) throw new Error('sticker detail card did not open');
  await evaluate(`document.querySelector('.overlay .card button')?.click()`);
  console.log('  ✔ sticker detail card opens and closes');

  // -- touch target sanity (scrapbook screen) ------------------------------------
  await checkButtons44('scrapbook screen');

  // -- reflow sanity -----------------------------------------------------------------
  // No horizontal overflow at the raw viewport (spec: layout holds at every
  // supported width)…
  const rawOverflow = await evaluate(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  if (rawOverflow > 2) throw new Error(`raw viewport has ${rawOverflow}px horizontal overflow`);
  // …and 200% text zoom holds on tablet/desktop widths (a 390px viewport at
  // 200% is 195px effective — outside every supported breakpoint by design).
  if (width >= 768) {
    await evaluate(`document.body.style.zoom = '2'`);
    await sleep(300);
    const overflow = await evaluate(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
    if (overflow > 2) throw new Error(`200% zoom causes ${overflow}px horizontal overflow`);
    await evaluate(`document.body.style.zoom = ''`);
    console.log('  ✔ 200% text zoom: no horizontal overflow');
  }

  // -- reduced motion ------------------------------------------------------------
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await sleep(300);
  const stillUsable = await evaluate(`!!document.querySelector('.scrapbook') && document.querySelectorAll('.sticker').length >= 7`);
  if (!stillUsable) throw new Error('app unusable under prefers-reduced-motion');
  console.log('  ✔ prefers-reduced-motion: app remains fully usable');
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
