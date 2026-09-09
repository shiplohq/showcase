#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Minimal Chrome DevTools Protocol driver — no dependencies. Exercises the
// real Atom Forge UI with mouse / touch / keyboard input, captures console
// errors, and takes screenshots at the required viewports. Works against any
// URL (local preview or the live Shiplo deployment).
//
// Usage: node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|mobile]
//
// Flow "full" (desktop):
//   ledger renders → mouse opens mission 1 → keyboard steppers forge Hydrogen
//   → reveal dialog (auto-forge) → next mission → steppers + POINTER DRAG
//   forge Helium → teach-note path (wrong build) → touch tap path →
//   a11y assertions (44px targets on the forge screen, aria, focus) →
//   viewport-fit assertions → reduced-motion emulation.
// Flow "mobile": ledger + forge at a narrow viewport, horizontal-overflow
//   check, stepper path, 44px targets.
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
  console.error('usage: node cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|mobile]');
  process.exit(2);
}

const errors = [];
const consoleErrors = [];

// ---- launch chrome ---------------------------------------------------------
// Fresh profile + disabled disk cache each run: a persistent profile keeps a
// cached index.html pointing at stale hashed assets (bit us twice in testing).
// Dedicated port per run avoids the port-collision fake failures seen in #06
// (kept inside the project's reserved CDP band 9341–9349).
const port = 9341 + (process.pid % 9);
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
  await sleep(300);
}

/** TRUSTED pointer click on a button found by text content (real-user path —
    script .click() bypasses `inert` and once masked a dead dialog). */
async function clickByText(selector, text, label) {
  const pt = await evaluate(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find(b => b.textContent.includes(${JSON.stringify(text)})); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; })()`);
  if (!pt) throw new Error(`click target not found: ${label ?? text}`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await sleep(400);
}

async function key(keyName, modifiers = 0) {
  const codes = { Enter: 13, Tab: 9, Escape: 27, ' ': 32, '+': 187, '-': 189 };
  const code = codes[keyName];
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, windowsVirtualKeyCode: code ?? keyName.charCodeAt(0), nativeVirtualKeyCode: code ?? keyName.charCodeAt(0), modifiers });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, windowsVirtualKeyCode: code ?? keyName.charCodeAt(0), nativeVirtualKeyCode: code ?? keyName.charCodeAt(0), modifiers });
  await sleep(120);
}

async function tap(selector, label) {
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!pt) throw new Error(`tap target not found: ${label ?? selector}`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(350);
}

/** Real pointer drag from a tray token to a point (drives pointer events). */
async function drag(fromSel, toPoint, label) {
  const from = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(fromSel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!from) throw new Error(`drag origin not found: ${label}`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1 });
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((toPoint.x - from.x) * i) / steps;
    const y = from.y + ((toPoint.y - from.y) * i) / steps;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
    await sleep(24);
  }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: toPoint.x, y: toPoint.y, button: 'left', clickCount: 1 });
  await sleep(350);
}

/** Screen point of a forge zone (nucleus or shell ring top), view-units aware. */
function zonePointExpr(zone) {
  return `(() => {
    const wrap = document.querySelector('[data-testid="canvas-wrap"] .canvas-wrap, [data-testid="canvas-wrap"]');
    const svg = wrap.querySelector('svg');
    const r = svg.getBoundingClientRect();
    const scale = r.width / 640;
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    ${zone === 'nucleus'
      ? 'return { x: cx, y: cy };'
      : `const ring = [92, 158, 224, 290][${zone}];
        return { x: cx, y: cy - ring * scale };`}
  })()`;
}

/** Stepper helper: click by aria-label substring. */
function clickStepperExpr(match) {
  return `(() => { const b = [...document.querySelectorAll('.stepper')].find(b => b.getAttribute('aria-label')?.includes(${JSON.stringify(match)}) && !b.disabled); if (!b) return false; b.click(); return true; })()`;
}

async function assertNoHorizontalOverflow(where) {
  const over = await evaluate(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  if (over > 1) throw new Error(`horizontal overflow on ${where}: scrollWidth exceeds viewport by ${over}px`);
  const fit = await evaluate(`JSON.stringify({ sh: document.documentElement.scrollHeight, ih: window.innerHeight })`);
  const { sh, ih } = JSON.parse(fit);
  if (width >= 768 && sh > ih + 1) {
    throw new Error(`${where} does not fit the viewport: scrollHeight ${sh} > ${ih} (batch lesson: page scrollbar in captures)`);
  }
  console.log(`  ✔ no horizontal overflow on ${where} (scrollHeight ${sh} vs viewport ${ih})`);
  return sh;
}

async function assertTouchTargets(where) {
  const small = await evaluate(`[...document.querySelectorAll('button:not([disabled])')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).map(b => (b.getAttribute('aria-label') || b.textContent).slice(0, 40))`);
  if (small.length) throw new Error(`${where}: buttons smaller than 44px: ${JSON.stringify(small)}`);
  console.log(`  ✔ every enabled button ≥ 44px on ${where}`);
}

mkdirSync(outDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 });

try {
  await send('Page.navigate', { url });
  // Wait for content (JSON fetch + fonts) — a fixed sleep loses the race on a
  // cold CDN edge (seen once on the live URL first hit).
  await waitFor(async () => await evaluate(`document.querySelectorAll('.mission-row, .error-screen').length > 0`), 20000, 'ledger or error screen');
  const isError = await evaluate(`!!document.querySelector('.error-screen')`);
  if (isError) throw new Error('app degraded to the content-error screen: ' + await evaluate(`document.querySelector('.error-screen p')?.textContent`));
  await sleep(600); // fonts settle

  const title = await evaluate('document.title');
  console.log(`▶ ${url} — "${title}" @ ${width}x${height}`);

  // -- ledger renders ---------------------------------------------------------
  const ledgerOk = await evaluate(`document.querySelectorAll('.mission-row').length === 12 && document.querySelectorAll('.strip-tile').length === 20 && document.querySelectorAll('.mission-row[disabled]').length === 11`);
  if (!ledgerOk) throw new Error('ledger did not render 12 missions (1 open / 11 locked) + 20 element tiles');
  console.log('  ✔ ledger renders 12 missions + periodic strip (11 locked)');
  await assertNoHorizontalOverflow('ledger');
  await screenshot('01-ledger');

  if (flow === 'mobile') {
    await click('[data-testid="mission-row-0"]', 'mission 1');
    const forgeOk = await evaluate(`!!document.querySelector('[data-testid="forge-screen"]') && !!document.querySelector('[data-testid="atom-canvas"]')`);
    if (!forgeOk) throw new Error('forge screen did not mount at mobile viewport');
    await assertNoHorizontalOverflow('forge (mobile stack)');
    await assertTouchTargets('forge (mobile stack)');
    await evaluate(clickStepperExpr('Add one proton'));
    const z1 = await evaluate(`document.querySelector('[data-testid="count-protons"]').textContent`);
    if (z1 !== '1') throw new Error(`mobile stepper add failed (Z=${z1})`);
    console.log('  ✔ mobile: stepper path works, Z=1');
    await screenshot('02-forge-mobile');
    finish();
  }

  // -- mouse: open mission 1 --------------------------------------------------
  await click('[data-testid="mission-row-0"]', 'mission 1');
  const forgeOk = await evaluate(`!!document.querySelector('[data-testid="forge-screen"]') && !!document.querySelector('[data-testid="atom-canvas"]') && !!document.querySelector('[data-testid="particle-tray"]')`);
  if (!forgeOk) throw new Error('forge screen did not mount');
  console.log('  ✔ mouse click opens the forge (mission 01 — Hydrogen)');
  await assertNoHorizontalOverflow('forge');
  await assertTouchTargets('forge (activity screen)');
  await screenshot('02-forge-empty');

  // -- keyboard: steppers forge Hydrogen (1p + 1e) ------------------------------
  const focused = await evaluate(`!!document.querySelector('.stepper[aria-label*="Add one proton"]')`);
  if (!focused) throw new Error('proton stepper not found');
  await evaluate(`document.querySelector('.stepper[aria-label*="Add one proton"]').focus()`);
  await key(' '); // +p
  const z = await evaluate(`document.querySelector('[data-testid="count-protons"]').textContent`);
  if (z !== '1') throw new Error(`keyboard +p failed (Z=${z})`);
  const identity = await evaluate(`document.querySelector('[data-testid="identity-name"]').textContent`);
  if (!/Hydrogen/.test(identity)) throw new Error(`identity readout after 1 proton: "${identity}"`);
  console.log('  ✔ keyboard Space on +p → Z=1, live identity reads Hydrogen');
  await evaluate(`document.querySelector('.stepper[aria-label*="Add one electron to shell 1"]').focus()`);
  await key(' '); // +e shell 1 → 1 proton / 1 electron = forged hydrogen
  await sleep(900); // reveal mounts
  const revealName = await evaluate(`document.querySelector('.reveal__element')?.textContent ?? ''`);
  if (revealName !== 'Hydrogen') throw new Error(`expected Hydrogen reveal, got "${revealName}"`);
  console.log('  ✔ auto-forge: ¹H reveal dialog appears the moment the build matches');
  // Real pointer click (trusted event): the dialog must be reachable by actual
  // users — an inert-subtree regression once left it clickable only by script.
  await clickByText('.reveal__actions .btn', 'Next mission', 'reveal next (trusted click)');
  const mission2AfterClick = await evaluate(`document.querySelector('.forge__brief .mono-label')?.textContent ?? ''`);
  if (!/Mission 02/.test(mission2AfterClick)) throw new Error(`trusted click on "Next mission" did not leave the reveal (showing "${mission2AfterClick}")`);
  console.log('  ✔ trusted pointer click dismisses the reveal → mission 02');
  await screenshot('03-reveal-hydrogen');
  await sleep(200);

  // -- steppers + pointer drag: forge Helium (2p 2n 2e) ------------------------
  const mission2 = await evaluate(`document.querySelector('.forge__brief .mono-label')?.textContent`);
  if (!/Mission 02/.test(mission2 ?? '')) throw new Error(`expected mission 02 after Next, got "${mission2}"`);
  await evaluate(clickStepperExpr('Add one proton')); // fresh bench: 0 → 1
  await evaluate(clickStepperExpr('Add one proton')); // 1 → 2
  await evaluate(clickStepperExpr('Add one neutron'));
  await evaluate(clickStepperExpr('Add one neutron'));
  const nCount = await evaluate(`document.querySelector('.forge .counter:nth-child(2) .counter__value, .counters .counter:nth-child(2) .counter__value')?.textContent`);
  const dragPoint = await evaluate(zonePointExpr(0));
  await drag('[data-testid="tray-electron"]', dragPoint, 'electron → shell 1');
  await drag('[data-testid="tray-electron"]', dragPoint, 'electron → shell 1');
  await sleep(900);
  const revealHe = await evaluate(`document.querySelector('.reveal__element')?.textContent ?? ''`);
  if (revealHe !== 'Helium') throw new Error(`expected Helium reveal (2p2n2e via drag), got "${revealHe}" (n=${nCount})`);
  console.log('  ✔ steppers (2p, 2n) + pointer drag (2e) forge ⁴He — drag path works');
  await clickByText('.reveal__actions .btn', 'Next mission', 'reveal next (trusted click, helium)');
  await sleep(600);

  // -- teach path: build the WRONG thing, expect kind teaching copy -------------
  await evaluate(clickStepperExpr('Add one proton')); // Li mission: 1 proton only
  const teach = await evaluate(`document.querySelector('[data-testid="teach-note"]')?.textContent ?? ''`);
  if (!/Hydrogen|nucleus is empty/i.test(teach)) throw new Error(`teach note unexpected: "${teach}"`);
  if (/wrong|error|fail/i.test(teach)) throw new Error('teach copy is punitive');
  await evaluate(clickStepperExpr('Add one proton'));
  await evaluate(clickStepperExpr('Add one proton'));
  await evaluate(clickStepperExpr('Add one proton')); // 4 protons → Beryllium ≠ Li
  const teach2 = await evaluate(`document.querySelector('[data-testid="teach-note"]')?.textContent ?? ''`);
  if (!/Beryllium/.test(teach2)) throw new Error(`expected Beryllium teaching copy, got "${teach2}"`);
  console.log('  ✔ wrong builds teach: "4 protons make Beryllium — mission asks Lithium"');

  // -- click-to-remove: strip a proton by clicking its disc ---------------------
  await evaluate(`(() => { const g = document.querySelector('[data-testid="atom-canvas"] g[data-remove="proton"]'); if (!g) return false; g.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; })()`);
  const zAfterRemove = await evaluate(`document.querySelector('[data-testid="count-protons"]').textContent`);
  if (zAfterRemove !== '3') throw new Error(`click-to-remove proton failed (Z=${zAfterRemove})`);
  console.log('  ✔ clicking a placed proton removes it (reversible)');

  // -- wrong-shell teaching: right counts, electrons stacked in the wrong shell --
  for (let i = 0; i < 4; i++) await evaluate(clickStepperExpr('Add one neutron'));
  const shell2Point = await evaluate(zonePointExpr(1));
  for (let i = 0; i < 3; i++) await drag('[data-testid="tray-electron"]', shell2Point, 'electron → shell 2 (wrong shell)');
  const teach3 = await evaluate(`document.querySelector('[data-testid="teach-note"]')?.textContent ?? ''`);
  if (!/inner shells first/.test(teach3)) throw new Error(`expected inner-first teaching copy, got "${teach3}"`);
  console.log('  ✔ electrons stacked in shell 2 teach the inner-first rule');

  // -- touch tap path: tap tray proton → default zone ---------------------------
  await evaluate(`localStorage.clear()`);
  await tap('[data-testid="tray-proton"]', 'tray proton (touch tap)');
  const zTap = await evaluate(`document.querySelector('[data-testid="count-protons"]').textContent`);
  if (zTap !== '4') throw new Error(`touch tap on tray proton failed (Z=${zTap})`);
  console.log('  ✔ touch tap on the tray token places a particle (one-tap path)');

  // -- blocked add: shell 1 full at 2 (after Li fix it has 1) — force via He reset
  //   (covered in engine-sim; UI spot check: −p disabled at zero on fresh mission)
  //   Clear bench is a two-step confirm (child-safe): click once to arm,
  //   click "Really clear? Tap again" to actually empty the bench.
  const clearExpr = `(() => { const b = [...document.querySelectorAll('.btn')].find(b => /Clear bench|Really clear/.test(b.textContent)); if (!b) return false; b.click(); return true; })()`;
  await evaluate(clearExpr);
  await evaluate(clearExpr);
  const minusDisabled = await evaluate(`document.querySelector('.stepper[aria-label*="Remove one proton"]').disabled`);
  if (!minusDisabled) throw new Error('−p should be disabled at Z=0');
  console.log('  ✔ two-step Clear bench empties the bench; −p disabled at Z=0 (honest disabled states)');

  // -- aria/live region ---------------------------------------------------------
  const live = await evaluate(`document.querySelector('[role="status"]')?.textContent ?? ''`);
  if (!/0 protons/.test(live)) throw new Error(`live build summary missing: "${live}"`);
  console.log('  ✔ live region announces the build summary');

  // -- keyboard focus ring visibility ------------------------------------------
  const focusVisible = await evaluate(`(() => { const b = document.querySelector('.stepper[aria-label*="Add one proton"]'); b.focus(); return getComputedStyle(b).outlineStyle !== 'none' || getComputedStyle(b).outlineWidth !== '0px'; })()`);
  if (!focusVisible) throw new Error('no visible focus style on steppers');
  console.log('  ✔ focus-visible styling present on controls');

  // -- reduced motion ------------------------------------------------------------
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await sleep(300);
  await evaluate(clickStepperExpr('Add one proton'));
  const zReduced = await evaluate(`document.querySelector('[data-testid="count-protons"]').textContent`);
  if (zReduced !== '1') throw new Error('reduced motion broke the stepper path');
  console.log('  ✔ prefers-reduced-motion: app fully usable, no motion dependencies');
  await screenshot('04-forge-reduced-motion');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: '' }] });

  // -- worst case fit: 4-shell mission with the teaching note live ---------------
  // (P0 regression: mission 12 + teach box must fit the viewport at ≥768w —
  // this is the state that used to overflow 1024×768 by 146px.)
  if (width >= 768) {
    await evaluate(`localStorage.setItem('atom-forge.progress.v1', JSON.stringify(['m01-first-spark','m02-full-first-shell','m03-third-proton','m04-carbon-core','m05-oxygen-eight','m06-neon-sealed','m07-sodium-lonely','m08-carbon-14','m09-sodium-cation','m10-chlorine-thief','m11-chloride-anion']))`);
    await send('Page.navigate', { url });
    await sleep(2200);
    await evaluate(`document.querySelector('[data-testid="mission-row-11"]').click()`);
    await sleep(700);
    await evaluate(clickStepperExpr('Add one proton')); // teach note appears (wrong element for Ca)
    await sleep(400);
    const teachLive = await evaluate(`!!document.querySelector('[data-testid="teach-note"]')`);
    if (!teachLive) throw new Error('expected teaching note on a wrong build (mission 12, 1 proton)');
    await assertNoHorizontalOverflow('worst case: mission 12 + teach note');
    await assertTouchTargets('worst case: mission 12');
    // Canvas labels must sit fully inside the SVG (they used to clip past x=640).
    const clipped = await evaluate(`(() => { const svg = document.querySelector('[data-testid="atom-canvas"]'); return [...svg.querySelectorAll('text')].filter(t => { const b = t.getBBox(); return b.x < 0 || b.x + b.width > 640; }).map(t => t.textContent); })()`);
    if (clipped.length) throw new Error(`canvas labels clipped outside the viewBox: ${JSON.stringify(clipped)}`);
    console.log('  ✔ worst case (mission 12 + teach note) fits; all canvas labels inside the viewBox');
    // Brief disclosure (P1 fix): on clamped viewports the learner can read
    // the full curriculum text; above the clamp there is no toggle at all.
    const briefToggle = await evaluate(`(() => {
      const b = document.querySelector('.forge__brief-toggle');
      if (!b) return { exists: false };
      const visible = getComputedStyle(b).display !== 'none';
      if (!visible) return { exists: true, visible: false };
      b.click();
      return new Promise((resolve) => setTimeout(() => {
        const c = document.querySelector('.forge__brief-copy');
        const cs = getComputedStyle(c);
        resolve({ exists: true, visible: true, open: c.className.includes('--open') && cs.webkitLineClamp === 'none' });
      }, 350));
    })()`);
    if (!briefToggle.exists) throw new Error('brief toggle missing from the DOM');
    if (height <= 840 && !briefToggle.visible) throw new Error('brief toggle hidden on a clamped viewport');
    if (briefToggle.visible && !briefToggle.open) throw new Error('brief toggle does not release the clamp');
    if (briefToggle.visible) console.log('  ✔ brief disclosure toggle releases the clamp on short viewports');
    await screenshot('05-worst-case');
  }

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
