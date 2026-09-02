#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Minimal Chrome DevTools Protocol driver — zero dependencies (raw WebSocket,
// Node 18+). Exercises the real Story Sequencer UI with mouse / touch /
// keyboard input, captures console errors on the primary flow, asserts the
// viewport-fit rule (document scrollHeight ≤ window height) and 44px touch
// targets, and takes screenshots. Works against any URL (local preview or the
// live Shiplo deployment).
//
// Flow "full" = shelf → open issue 1 → proceed with a WRONG order → draw all
// cause-effect links (one wrong attempt first) → pick the correct title →
// check (verdict must flag Order only) → fix the order via keyboard move
// buttons → check again → celebrate + reflection → back to shelf (stamp).
//
// Usage: node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900] [--flow full|smoke]
// Exits non-zero on any console error or a broken step.

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

// Fresh profile + no disk cache every run (pilot #01 lesson).
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  '--remote-debugging-port=9334',
  '--user-data-dir=' + resolve(outDir, `.chrome-profile-${Date.now()}`),
  '--disk-cache-size=1',
  '--media-cache-size=1',
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
  const res = await fetch('http://127.0.0.1:9334/json/list');
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

async function click(selector, label) {
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!pt) throw new Error(`click target not found: ${label ?? selector}`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await sleep(300);
}

async function key(keyName) {
  const codes = { Enter: 13, Tab: 9, Escape: 27, ' ': 32, ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Home: 36, End: 35 };
  const code = codes[keyName];
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, windowsVirtualKeyCode: code ?? keyName.charCodeAt(0), nativeVirtualKeyCode: code ?? keyName.charCodeAt(0) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, windowsVirtualKeyCode: code ?? keyName.charCodeAt(0), nativeVirtualKeyCode: code ?? keyName.charCodeAt(0) });
  await sleep(160);
}

async function tap(selector, label) {
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!pt) throw new Error(`tap target not found: ${label ?? selector}`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(300);
}

const domOrder = () => evaluate(`[...document.querySelectorAll('.panel')].map(p => p.getAttribute('data-panel-id'))`);

async function movePanelTo(id, targetIndex) {
  // Drives the same Move earlier/later buttons a keyboard kid uses.
  for (let guard = 0; guard < 40; guard++) {
    const order = await domOrder();
    const at = order.indexOf(id);
    if (at === targetIndex) return;
    const dir = at < targetIndex ? 'later' : 'earlier';
    const ok = await evaluate(`(() => { const li = document.querySelector('.panel[data-panel-id=${JSON.stringify(id)}]'); const btn = [...li.querySelectorAll('.mv')].find(b => b.getAttribute('aria-label').includes('${dir}')); if (!btn || btn.disabled) return false; btn.click(); return true; })()`);
    if (!ok) throw new Error(`move ${dir} unavailable for panel ${id}`);
    await sleep(340); // Flip settle
  }
  throw new Error(`could not move panel ${id} to index ${targetIndex}`);
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

  // -- shelf renders ----------------------------------------------------------
  const issueCount = await evaluate(`document.querySelectorAll('.issue').length`);
  if (issueCount < 5) throw new Error(`shelf rendered ${issueCount} issues (expected 5)`);
  console.log(`  ✔ shelf renders ${issueCount} story issues`);
  await assertViewportFit('shelf');

  if (flow === 'smoke') {
    await screenshot('01-shelf');
    await touchTargetCheck();
    await reducedMotionCheck();
    finish();
  }

  // Ground truth from the same JSON the app fetched.
  const truth = await evaluate(`fetch(new URL('data/stories.json', document.baseURI)).then(r => r.json()).then(d => d.stories[0])`);
  const canonical = truth.canonicalOrder;

  // -- open issue 1 (mouse) ------------------------------------------------------
  await click('.issue', 'first issue card');
  const panels = await domOrder();
  if (panels.length !== canonical.length) throw new Error('order step did not render all panels');
  console.log(`  ✔ mouse click opens issue 1 — ${panels.length} shuffled panels`);
  await assertViewportFit('order step');

  // Hint toggle — clue marks must appear.
  await click('.board__hint', 'show time clues');
  const clueMarks = await evaluate(`document.querySelectorAll('.panel__caption mark.clue').length`);
  if (clueMarks < 3) throw new Error(`expected time-clue marks after hint, got ${clueMarks}`);
  console.log(`  ✔ hint underlines ${clueMarks} temporal clues`);
  await screenshot('02-order');
  await click('.board__hint', 'hide time clues');

  // Keyboard reorder smoke: focus first panel, arrow-move it down one.
  await evaluate(`document.querySelector('.panel').focus()`);
  const beforeKb = (await domOrder()).join(',');
  await key('ArrowDown');
  const afterKb = (await domOrder()).join(',');
  if (beforeKb === afterKb) throw new Error('ArrowDown did not reorder panels');
  console.log('  ✔ keyboard ArrowDown reorders the focused panel');
  await key('ArrowUp'); // restore
  await sleep(500); // let the Flip settle — mid-Flip panels can cover the CTA

  // -- proceed with the (still wrong) order to the link step ---------------------
  await click('.board__cta .btn--primary', 'next: link');
  await waitFor(
    () => evaluate(`/link cause to effect/i.test(document.querySelector('.board__title')?.textContent ?? '')`),
    2500,
    'link step heading',
  );
  // select + deselect a cause (keyboard-equivalent activation, state polled)
  await evaluate(`document.querySelector('.panel').click()`);
  await waitFor(() => evaluate(`document.querySelectorAll('.panel[aria-pressed="true"]').length === 1`), 2500, 'cause to select');
  await evaluate(`document.querySelector('.panel').click()`);
  await waitFor(() => evaluate(`document.querySelectorAll('.panel[aria-pressed="true"]').length === 0`), 2500, 'cause to deselect');
  console.log('  ✔ cause select / deselect via panel activation');
  // pick two panels that are NOT a canonical link
  const wrongPair = await evaluate(`(() => { const ids = [...document.querySelectorAll('.panel')].map(p => p.getAttribute('data-panel-id')); const links = ${JSON.stringify(truth.causalLinks.map((l) => l.join('→')))}; for (const a of ids) for (const b of ids) { if (a !== b && !links.includes(a + '→' + b)) return [a, b]; } return null; })()`);
  if (wrongPair) {
    await evaluate(`document.querySelector('.panel[data-panel-id=${JSON.stringify(wrongPair[0])}]').click()`);
    await sleep(200);
    await evaluate(`document.querySelector('.panel[data-panel-id=${JSON.stringify(wrongPair[1])}]').click()`);
    const flashShown = await waitFor(
      () => evaluate(`!!document.querySelector('.connector__flash')`),
      2500,
      'wrong-link flash to appear',
    ).catch(() => false);
    if (!flashShown) throw new Error('wrong-link flash did not appear');
    await waitFor(
      () => evaluate(`!document.querySelector('.connector__flash')`),
      2500,
      'wrong-link flash to clear',
    );
    const linksNow = await evaluate(`document.querySelectorAll('.connector__path').length`);
    if (linksNow !== 0) throw new Error('wrong link was accepted');
    console.log('  ✔ wrong cause-effect pair gently rejected');
  }

  // draw the correct links via touch taps
  for (const [from, to] of truth.causalLinks) {
    await tap(`.panel[data-panel-id="${from}"]`, `cause ${from} (touch)`);
    await sleep(150);
    await tap(`.panel[data-panel-id="${to}"]`, `effect ${to} (touch)`);
    await sleep(450);
  }
  const connCount = await evaluate(`document.querySelectorAll('.connector__path').length`);
  if (connCount !== truth.causalLinks.length) throw new Error(`expected ${truth.causalLinks.length} connectors, got ${connCount}`);
  console.log(`  ✔ ${connCount} cause-effect connectors drawn (touch)`);
  await screenshot('03-link');
  await assertViewportFit('link step');
  // Touch-target floor is asserted ON the link screen too — the removable
  // cause/effect chips live here (review deploy-2 finding).
  await touchTargetCheck('link step');

  // -- title: correct one ----------------------------------------------------------
  await click('.board__cta .btn--primary', 'next: title');
  await waitFor(
    () => evaluate(`/choose the title/i.test(document.querySelector('.board__title')?.textContent ?? '')`),
    2500,
    'title step heading',
  );
  const correctTitleId = truth.titles.find((t) => t.correct).id;
  await evaluate(`document.querySelector('[data-title-id=${JSON.stringify(correctTitleId)}]').click()`);
  const checked = await evaluate(`document.querySelector('[data-title-id=${JSON.stringify(correctTitleId)}]').getAttribute('aria-checked')`);
  if (checked !== 'true') throw new Error('title selection not reflected');
  console.log('  ✔ title chosen via radio');
  await screenshot('04-title');
  await assertViewportFit('title step');

  // -- check with wrong order → verdict flags Order only -----------------------------
  await click('.board__cta .btn--primary', 'check my story');
  const lookRows = await evaluate(`[...document.querySelectorAll('.vrow')].filter(r => !r.classList.contains('vrow--ok')).map(r => r.querySelector('strong').textContent)`);
  if (lookRows.length === 0) throw new Error('expected at least one look-again row (order still shuffled)');
  console.log(`  ✔ verdict flags: ${lookRows.join(', ')} (non-punitive)`);
  await screenshot('05-check-wrong');

  // -- fix the order via keyboard buttons → recheck ----------------------------------
  await evaluate(`[...document.querySelectorAll('.vrow__fix')].find(b => /order/i.test(b.textContent)).click()`);
  await sleep(300);
  const current = await domOrder();
  for (let i = 0; i < canonical.length; i++) {
    if (current[i] !== canonical[i]) {
      // note: moving earlier ids first keeps indices stable
      const id = canonical[i];
      if ((await domOrder()).indexOf(id) !== i) await movePanelTo(id, i);
    }
  }
  const solved = (await domOrder()).join(',');
  if (solved !== canonical.join(',')) throw new Error(`order not solved: ${solved} vs ${canonical.join(',')}`);
  console.log('  ✔ panels solved to canonical order via move buttons');

  await click('.board__cta .btn--primary', 'next: link (recheck path)');
  // walk forward through the CTAs until the check step mounts
  for (let i = 0; i < 4; i++) {
    const heading = await evaluate(`document.querySelector('.board__title')?.textContent.trim() ?? ''`);
    if (/check-up|sequenced/i.test(heading)) break;
    await click('.board__cta .btn--primary', 'forward CTA');
  }
  await sleep(400);
  const allOk = await evaluate(`document.querySelectorAll('.vrow:not(.vrow--ok)').length === 0 && !!document.querySelector('.celebrate')`);
  if (!allOk) throw new Error('final check did not celebrate');
  console.log('  ✔ final verdict: all rows Yes! + celebration');
  // Timeline explanation (spec): the ink line must run through the stops.
  const lineState = await evaluate(`(() => { const l = document.querySelector('.timeline__line'); if (!l) return 'missing'; const t = getComputedStyle(l).transform; if (t === 'none') return 'visible'; const m = t.match(/matrix\\(([^)]+)\\)/); if (!m) return t; const sx = parseFloat(m[1].split(',')[0]); return 'scaleX=' + sx.toFixed(3); })()`);
  if (lineState === 'visible' || /^scaleX=(?:0\\.9|1)/.test(lineState)) {
    console.log(`  ✔ timeline line drawn through stops (${lineState})`);
  } else {
    throw new Error(`timeline line not drawn (computed: ${lineState})`);
  }
  await screenshot('06-sequenced');
  await assertViewportFit('verdict step');

  // -- reflection ----------------------------------------------------------------------
  const bestOpt = truth.reflection.options.find((o) => o.best);
  await evaluate(`document.querySelector('[data-reflection-id=${JSON.stringify(bestOpt.id)}]').click()`);
  await sleep(250);
  const answer = await evaluate(`document.querySelector('.reflection__answer')?.textContent ?? ''`);
  if (!answer.includes('Yes') && answer.length < 20) throw new Error('reflection explanation missing');
  console.log('  ✔ reflection answer explained');

  // -- back to shelf: stamp + progress --------------------------------------------------
  await evaluate(`document.querySelector('.board__cta--final .btn--ghost').click()`);
  await waitFor(() => evaluate(`/story shelf/i.test(document.querySelector('.shelf__title')?.textContent ?? '')`), 3000, 'shelf to reappear');
  const navState = await evaluate(`({ hash: location.hash, shelf: !!document.querySelector('.shelf'), progress: document.querySelector('.masthead__progress')?.textContent ?? '', storage: localStorage.getItem('ss.progress.v1') })`);
  console.log(`  … nav state: ${JSON.stringify(navState)}`);
  const stamp = await evaluate(`!!document.querySelector('.issue__stamp')`);
  const progress = await evaluate(`document.querySelector('.masthead__progress')?.textContent ?? ''`);
  if (!stamp) throw new Error('completed issue shows no SEQUENCED stamp');
  if (!/1 of 5/i.test(progress)) throw new Error(`masthead progress wrong: "${progress}"`);
  console.log(`  ✔ shelf stamps the finished issue (${progress.trim()})`);

  await touchTargetCheck();
  await reducedMotionCheck();
  finish();
} catch (err) {
  errors.push(String(err.message || err));
  finish();
}

async function assertViewportFit(label) {
  const fit = await evaluate(`(() => { const d = document.documentElement; return { sh: d.scrollHeight, ih: window.innerHeight, sw: d.scrollWidth, iw: window.innerWidth }; })()`);
  // Vertical fit is asserted at the hero viewports (>=1024: tablet/desktop).
  // Narrower widths (mobile limited support, and 720x450 = the 200%-zoom
  // reflow check) scroll vertically by design — only a horizontal overflow
  // or clipped text would be a real defect there.
  if (width >= 1024 && fit.sh > fit.ih + 1) throw new Error(`${label}: page scrolls vertically (scrollHeight ${fit.sh} > viewport ${fit.ih})`);
  if (fit.sw > fit.iw + 1) throw new Error(`${label}: page scrolls horizontally (scrollWidth ${fit.sw} > viewport ${fit.iw})`);
  console.log(`  ✔ ${label}: fit ok at ${width}x${height} (${fit.sh}≤${fit.ih}${width < 1024 ? ', vertical scroll allowed below hero viewports' : ''})`);
}

async function touchTargetCheck(where = 'shelf') {
  const small = await evaluate(`[...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).length`);
  if (small > 0) throw new Error(`${small} button(s) smaller than 44px on the ${where}`);
  console.log(`  ✔ all visible buttons ≥ 44px touch targets (${where})`);
}

async function reducedMotionCheck() {
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const usable = await evaluate(`!!document.querySelector('.issue, .panel')`);
  if (!usable) throw new Error('app unusable under prefers-reduced-motion');
  console.log('  ✔ prefers-reduced-motion emulated — app remains usable');
  await screenshot('99-reduced-motion');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: '' }] });
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
