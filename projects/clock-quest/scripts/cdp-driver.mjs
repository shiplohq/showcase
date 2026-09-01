#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Clock Quest live/preview verification driver (CDP, zero dependencies).
// Adapted from the pilot's number-garden driver (fresh profile + no disk
// cache on every run — pilot #01 lesson).
//
// Full flow, through the REAL UI only (no backdoors):
//   home map → open Ferry Pier (mouse) → mission 1 via keyboard steppers
//   → mission 2 via stepper clicks → mission 3 via a real pointer DRAG on the
//   minute hand → station board (wrong pick → nudge → right pick)
//   → remaining set-clock missions via steppers → day recap via chip/slot
//   buttons with the retry loop → finale → sail again (reset).
// Plus: ESC overlay close, touch-target audit, reduced-motion render.
//
// Usage: node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900]

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const args = process.argv.slice(2);
const url = args[0];
const outDir = resolve(args[args.indexOf('--out') + 1] ?? 'showcase/.shots');
const width = Number(args[args.indexOf('--w') + 1] ?? 1440);
const height = Number(args[args.indexOf('--h') + 1] ?? 900);
if (!url) {
  console.error('usage: node scripts/cdp-driver.mjs <url> [--out dir] [--w 1440 --h 900]');
  process.exit(2);
}

const errors = [];
const consoleErrors = [];

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--window-size=${width},${height}`,
  '--remote-debugging-port=9334',
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
  const res = await fetch('http://127.0.0.1:9334/json/list');
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
}
async function click(selector, label) {
  const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({ block: 'center', inline: 'center' }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!pt) throw new Error(`click target not found: ${label ?? selector}`);
  await sleep(140); // let scrollIntoView settle
  const target = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1 });
  await sleep(250);
}
async function key(keyName) {
  const codes = { Enter: 13, Tab: 9, Escape: 27, ' ': 32 };
  const code = codes[keyName] ?? keyName.charCodeAt(0);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
  await sleep(110);
}
async function clickByIndex(selector, index, label) {
  const ok = await evaluate(`(() => { const els = document.querySelectorAll(${JSON.stringify(selector)}); const el = els[${index}]; if (!el) return false; el.click(); return true; })()`);
  if (!ok) throw new Error(`clickByIndex failed: ${label ?? selector}[${index}]`);
  await sleep(220);
}

mkdirSync(outDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 900 });

function parseClock(text) {
  const m = /(\d{1,2}):(\d{2})/.exec(text || '');
  return m ? { h: Number(m[1]) % 12, min: Number(m[2]) } : null;
}

/** Drive the steppers (real button clicks) until the digital readout matches. */
async function setClockViaSteppers() {
  for (let guard = 0; guard < 40; guard++) {
    const target = parseClock(await evaluate('document.querySelector(".digital-target strong")?.textContent'));
    const now = parseClock(await evaluate('document.querySelector("#digitalNow")?.textContent'));
    if (!target || !now) throw new Error('clock readout missing');
    if (now.h === target.h && now.min === target.min) return true;
    // minutes first (shortest way), then the hour
    let dMin = target.min - now.min; // signed distance to press toward
    if (dMin > 30) dMin -= 60;
    if (dMin < -30) dMin += 60;
    if (dMin !== 0) {
      await evaluate('document.querySelector("#handMin").click()');
      await sleep(80);
      const dirBtn = dMin < 0
        ? `[...document.querySelectorAll('.stepper-btn')].find(b => b.dataset.dir === '-1')`
        : `[...document.querySelectorAll('.stepper-btn')].find(b => b.dataset.dir === '1')`;
      const snap = Number(/by (\d+)/.exec(await evaluate('document.querySelector("#stepperNote")?.textContent || ""'))?.[1]) || 5;
      const presses = Math.abs(dMin) / snap;
      for (let i = 0; i < presses; i++) {
        await evaluate(`(function(){ const b = ${dirBtn}; if (b) b.click(); })()`);
        await sleep(90);
      }
      continue;
    }
    let dH = target.h - now.h;
    if (dH > 6) dH -= 12;
    if (dH < -6) dH += 12;
    if (dH !== 0) {
      await evaluate('document.querySelector("#handHour").click()');
      await sleep(80);
      const dir = dH < 0
        ? `[...document.querySelectorAll('.stepper-btn')].find(b => b.dataset.dir === '-1')`
        : `[...document.querySelectorAll('.stepper-btn')].find(b => b.dataset.dir === '1')`;
      for (let i = 0; i < Math.abs(dH); i++) {
        await evaluate(`(function(){ const b = ${dir}; if (b) b.click(); })()`);
        await sleep(90);
      }
    }
  }
  throw new Error('steppers could not reach the target time — target=' +
    await evaluate('document.querySelector(".digital-target strong")?.textContent') +
    ' now=' + await evaluate('document.querySelector("#digitalNow")?.textContent') +
    ' note=' + await evaluate('document.querySelector("#stepperNote")?.textContent'));
}

/** Drag the minute hand to an absolute minute (real pointer events).
 *  Grabs AT the minute hand's current tip so the hand-picker selects it,
 *  then sweeps clockwise to the target minute (crossing 12 carries the hour
 *  exactly like a real clock). */
async function dragMinuteTo(targetMin) {
  const box = await evaluate(`(() => { const s = document.querySelector('.clock'); const r = s.getBoundingClientRect(); return { cx: r.x + r.width/2, cy: r.y + r.height/2, r: r.width/2 }; })()`);
  if (!box) throw new Error('clock face not found');
  const now = parseClock(await evaluate('document.querySelector("#digitalNow")?.textContent'));
  if (!now) throw new Error('clock readout missing for drag');
  const R = box.r * 0.72; // near the minute-hand tip
  const pointAt = (deg) => ({
    x: box.cx + R * Math.sin(deg * Math.PI / 180),
    y: box.cy - R * Math.cos(deg * Math.PI / 180),
  });
  const startAngle = now.min * 6;
  const delta = ((targetMin - now.min) % 60 + 60) % 60; // clockwise sweep
  const start = pointAt(startAngle);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1 });
  for (let step = 0; step <= delta; step++) {
    const p = pointAt(startAngle + step * 6);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, button: 'left', buttons: 1 });
    await sleep(16);
  }
  const end = pointAt(startAngle + delta * 6);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1 });
  await sleep(340);
}

async function feedbackText() {
  return evaluate('document.querySelector("#feedback")?.textContent?.trim() || ""');
}

/** Play every mission of the currently open stop through the real UI. */
async function playOpenStop() {
  for (let guard = 0; guard < 30; guard++) {
    const mode = await evaluate('document.querySelector("#ticket")?.getAttribute("data-mode")');
    if (!mode) return 'stop-done';

    if (mode === 'set-clock') {
      await setClockViaSteppers();
      await click('.cta-check', 'check the clock');
      const fb = await feedbackText();
      if (!/Right on time/.test(fb)) throw new Error(`expected correct feedback, got "${fb}"`);
    } else if (mode === 'read-schedule') {
      // try rows until the board accepts one (gentle nudge loop, like a child).
      // A wrong pick must never disable the other rows (lockout regression).
      let solved = false;
      for (let r = 0; r < 6 && !solved; r++) {
        const count = await evaluate('document.querySelectorAll(".board-row").length');
        if (!count || r >= count) break;
        const disabledRows = await evaluate(`[...document.querySelectorAll('.board-row')].filter(b => b.disabled).length`);
        if (disabledRows > 0) throw new Error(`${disabledRows} board row(s) disabled after a nudge — lockout bug`);
        await clickByIndex('.board-row', r, 'board row');
        const fb = await feedbackText();
        solved = /Well read/.test(fb);
        if (!solved && !/leaves at|Have another look/.test(fb)) throw new Error(`unexpected board feedback: "${fb}"`);
      }
      if (!solved) throw new Error('board mission not solved by trying rows — ' + JSON.stringify(await evaluate(`(() => ({
        mode: document.querySelector('#ticket')?.getAttribute('data-mode'),
        fb: document.querySelector('#feedback')?.textContent?.trim(),
        live: document.querySelector('#liveRegion')?.textContent,
        rows: [...document.querySelectorAll('.board-row')].map(b => b.textContent.trim() + (b.disabled ? '!DIS' : '')),
        prompt: document.querySelector('.ticket-prompt')?.textContent,
        progress: document.querySelector('.progress-text')?.textContent
      }))()`)));
    } else if (mode === 'day-recap') {
      // brute-force with the retry loop: wrong cards return to the tray gently
      for (let round = 0; round < 24; round++) {
        const chipCount = await evaluate('document.querySelectorAll("#recapTray .chip").length');
        if (chipCount === 0) break;
        await clickByIndex('#recapTray .chip', 0, 'memory chip');
        await clickByIndex('.slot-drop', round % 3, 'slot drop');
        const placed = await evaluate('document.querySelectorAll(".placed-card").length');
        if (placed >= 1) {
          await clickByIndex('.cta-check', 0, 'pin the day');
          await sleep(320);
        }
      }
      const fb = await feedbackText();
      if (!/pinned just right|A perfect day/.test(fb)) throw new Error(`recap not solved, feedback: "${fb}" — ` + JSON.stringify(await evaluate(`(() => ({
        chips: document.querySelectorAll('#recapTray .chip').length,
        placed: document.querySelectorAll('.placed-card').length,
        check: (() => { const b = document.querySelector('.cta-check'); return b ? (b.disabled ? 'disabled' : 'enabled') : 'missing'; })()
      }))()`)));
    }
    await sleep(400);
    const hasContinue = await evaluate('!!document.querySelector(".cta-continue")');
    if (!hasContinue) throw new Error('continue button missing after a solve');
    const isLast = /Finish the stop/.test(await evaluate('document.querySelector(".cta-continue")?.textContent || ""'));
    await click('.cta-continue', 'continue');
    await sleep(700);
    const overlayGone = await evaluate('document.querySelector("#questOverlay").hasAttribute("hidden")');
    if (overlayGone) return isLast ? 'stop-done' : 'overlay-closed';
  }
  throw new Error('stop playthrough exceeded guard');
}

try {
  await send('Page.navigate', { url });
  await sleep(2600);

  const title = await evaluate('document.title');
  console.log(`▶ ${url} — "${title}" @ ${width}x${height}`);

  // -- home renders ----------------------------------------------------------
  const homeOk = await evaluate(`!!document.querySelector('.island-map') && document.querySelectorAll('.m-stop').length === 5 && !!document.querySelector('#journalPanel .panel-title')`);
  if (!homeOk) throw new Error('home screen did not render map with 5 stops');
  console.log('  ✔ island map renders with 5 stops + journal panel');
  await screenshot('01-home');

  // -- mouse: open the first stop --------------------------------------------
  await click('.m-stop[data-state="next"]', 'next stop marker');
  await waitFor(async () => evaluate(`!!document.querySelector('#ticket') && !document.querySelector('#questOverlay').hasAttribute('hidden')`), 8000, 'quest overlay');
  const mode1 = await evaluate('document.querySelector("#ticket").getAttribute("data-mode")');
  if (mode1 !== 'set-clock') throw new Error(`expected set-clock first mission, got ${mode1}`);
  console.log('  ✔ mouse click opens the quest ticket (set-clock)');
  await screenshot('02-clock');

  // -- keyboard path: mission 1 solved with real keys -------------------------
  // (steppers focused + Space; mission clock starts at the 10:45 pose)
  {
    await evaluate('document.querySelector("#handMin").click()');
    const minusIdx = await evaluate(`[...document.querySelectorAll('.stepper-btn')].findIndex(b => b.dataset.dir === '-1')`);
    // minute from :45 to :00 → 3 presses of −(15)
    for (let i = 0; i < 3; i++) {
      await evaluate(`document.querySelectorAll('.stepper-btn')[${minusIdx}].focus()`);
      await key(' ');
    }
    // hour from 10 to 9 → 1 press of −
    await evaluate('document.querySelector("#handHour").click()');
    await evaluate(`document.querySelectorAll('.stepper-btn')[${minusIdx}].focus()`);
    await key(' ');
    const readout = await evaluate('document.querySelector("#digitalNow").textContent');
    if (readout !== '9:00') throw new Error(`keyboard steppers did not reach 9:00, got ${readout}`);
    console.log('  ✔ keyboard steppers (Space on focused buttons) set 9:00');
    await click('.cta-check', 'check');
    const fb = await feedbackText();
    if (!/Right on time/.test(fb)) throw new Error(`mission 1 not accepted: "${fb}"`);
    console.log(`  ✔ mission 1 solved by keyboard: "${fb.slice(0, 52)}…"`);
    await click('.cta-continue', 'continue');
    await sleep(600);
  }

  // -- drag path: mission 2 (9:30) via a real pointer drag of the minute hand -
  {
    // fresh mission clock sits at the 10:45 pose: drag :45 → :30 the short way
    // (counterclockwise sweep is expressed clockwise as +45 → 11:30 with hour
    // carry, so drag straight to :30 and let the hour carry land naturally)
    await dragMinuteTo(30);
    let readout = await evaluate('document.querySelector("#digitalNow").textContent');
    if (!/:(30)$/.test(readout)) throw new Error(`pointer drag did not reach :30, got ${readout}`);
    // the sweep crossed 12 → hour carried to 11; walk the hour hand back to 9
    if (!/^9:30$/.test(readout)) {
      await evaluate('document.querySelector("#handHour").click()');
      const minus = `[...document.querySelectorAll('.stepper-btn')].find(b => b.dataset.dir === '-1')`;
      for (let guard = 0; guard < 12 && !/^9:30$/.test(readout); guard++) {
        await evaluate(`(function(){ const b = ${minus}; if (b) b.click(); })()`);
        await sleep(90);
        readout = await evaluate('document.querySelector("#digitalNow").textContent');
      }
    }
    if (readout !== '9:30') throw new Error(`hour correction after drag failed, got ${readout}`);
    console.log('  ✔ pointer drag of the minute hand reaches 9:30 (hour carried across 12, then stepped back)');
    await click('.cta-check', 'check');
    const fb = await feedbackText();
    if (!/Right on time/.test(fb)) throw new Error(`mission 2 not accepted: "${fb}"`);
    await click('.cta-continue', 'continue');
    await sleep(600);
  }

  // -- ESC closes the overlay without progress loss ---------------------------
  {
    await key('Escape');
    const gone = await evaluate('document.querySelector("#questOverlay").hasAttribute("hidden")');
    if (!gone) throw new Error('ESC did not close the overlay');
    const solved = await evaluate('document.querySelector(".progress-text").textContent');
    if (!/0 of 5 stops/.test(solved)) throw new Error(`progress after ESC unexpected: ${solved}`);
    const pierUndone = await evaluate('document.querySelector(\'.m-stop[data-stop="pier"]\').getAttribute("data-state")');
    if (pierUndone !== 'next') throw new Error(`pier should still be the next stop after ESC, got ${pierUndone}`);
    console.log('  ✔ ESC closes overlay; mission progress kept (pier still open)');
    await click('.m-stop[data-state="next"]', 'reopen pier');
    await waitFor(async () => evaluate(`!document.querySelector('#questOverlay').hasAttribute('hidden')`), 8000, 'overlay reopened');
    await playOpenStop(); // finish pier (mission 3) via steppers
    console.log('  ✔ Ferry Pier completed (stepper path) — stamp + ferry sail');
    await sleep(900);
  }

  // -- market + station: full stops, board reads included ----------------------
  for (const stopName of ['market', 'station']) {
    await waitFor(async () => evaluate(`!!document.querySelector('.m-stop[data-stop="${stopName}"][data-state="next"]')`), 8000, `${stopName} unlocked`);
    await click(`.m-stop[data-stop="${stopName}"]`, stopName);
    await waitFor(async () => evaluate(`!document.querySelector('#questOverlay').hasAttribute('hidden')`), 8000, `${stopName} overlay`);
    const res = await playOpenStop();
    console.log(`  ✔ ${stopName} played through (${res})`);
    if (stopName === 'station') await screenshot('03-board');
    await sleep(600);
  }

  // -- lighthouse then the day recap at the clocktower -------------------------
  for (const stopName of ['lighthouse', 'tower']) {
    await waitFor(async () => evaluate(`!!document.querySelector('.m-stop[data-stop="${stopName}"][data-state="next"]')`), 8000, `${stopName} unlocked`);
    await click(`.m-stop[data-stop="${stopName}"]`, stopName);
    await waitFor(async () => evaluate(`!document.querySelector('#questOverlay').hasAttribute('hidden')`), 8000, `${stopName} overlay`);
    if (stopName === 'tower') await screenshot('04-recap');
    const res = await playOpenStop();
    console.log(`  ✔ ${stopName} played through (${res})`);
    await sleep(600);
  }

  // -- finale -------------------------------------------------------------------
  const finale = await waitFor(async () => evaluate(`!document.querySelector('#finaleScreen').hasAttribute('hidden') && !!document.querySelector('.finale-title')`), 8000, 'finale screen');
  void finale;
  await screenshot('05-finale');
  const finaleText = await evaluate('document.querySelector(".finale-title")?.textContent || ""');
  console.log(`  ✔ finale reached: "${finaleText}"`);

  // -- sail again (full reset) ----------------------------------------------------
  await click('#finaleAgain', 'sail again');
  await sleep(900);
  const resetOk = await evaluate(`document.querySelector('#finaleScreen').hasAttribute('hidden') && document.querySelector('.progress-text').textContent.includes('0 of 5 stops')`);
  if (!resetOk) throw new Error('sail-again reset failed');
  console.log('  ✔ sail-again resets the journey (0 of 5 stops)');

  // -- touch target audit: real buttons AND role=button markers (map stops) -------
  const smallTargets = await evaluate(`(() => { return [...document.querySelectorAll('button, [role="button"]')].filter(b => { const r = b.getBoundingClientRect(); if (r.width === 0) return false; const cs = getComputedStyle(b); if (cs.visibility === 'hidden' || cs.display === 'none') return false; return r.width < 44 || r.height < 44; }).map(b => b.tagName + '.' + String(b.className.baseVal ?? b.className).slice(0, 30) + ' ' + Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height)); })()`);
  if (smallTargets.length > 0) throw new Error('touch targets under 44px: ' + smallTargets.join(' | '));
  console.log('  ✔ all visible buttons and map markers ≥ 44px touch targets');

  // -- reduced motion ---------------------------------------------------------------
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await sleep(500);
  const stillRenders = await evaluate('document.body && document.body.innerText.trim().length > 0 && !!document.querySelector(".island-map")');
  if (!stillRenders) throw new Error('map broken under reduced motion');
  await click('.m-stop[data-state="next"]', 'open pier under reduced motion');
  await waitFor(async () => evaluate(`!document.querySelector('#questOverlay').hasAttribute('hidden')`), 8000, 'overlay under reduced motion');
  await evaluate('window.scrollTo(0, 0)');
  await screenshot('06-reduced-motion');
  console.log('  ✔ prefers-reduced-motion: app renders and opens stops instantly');

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
