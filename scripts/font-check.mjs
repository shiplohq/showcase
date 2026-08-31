#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Font regression guard (pilot #01 lesson: a `vietnamese`-only @fontsource
// import renders diacritics in the real font while base letters AND EVERY
// NUMERAL silently fall back to the system font — visually broken, yet
// console-clean and invisible to every other automated check).
//
// Asserts, per font family, that BOTH a latin+digits sample AND a Vietnamese
// diacritic sample are covered by actually-loaded webfonts
// (document.fonts.check). Run against the preview or the live URL before
// every deploy of a project that renders text in a bundled webfont.
//
// Usage:
//   node scripts/font-check.mjs <url> ["Family:weight,Family:weight"]
//   (default families: "Baloo 2:700,Nunito:600")

import { spawn } from 'node:child_process';

const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2];
const familiesArg = process.argv[3] ?? 'Baloo 2:700,Nunito:600';
if (!url) {
  console.error('usage: node font-check.mjs <url> ["Family:weight,Family:weight"]');
  process.exit(2);
}
const families = familiesArg.split(',').map((s) => {
  const [family, weight = '400'] = s.split(':');
  return { family: family.trim(), weight: weight.trim() };
});

// Fresh profile + no disk cache: a persistent profile keeps a cached
// index.html pointing at stale hashed assets (pilot #01 lesson).
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--window-size=1024,768',
  '--remote-debugging-port=9339',
  '--user-data-dir=' + process.env.TEMP + '\\ng-font-' + Date.now(),
  '--disk-cache-size=1',
  '--media-cache-size=1',
  '--no-first-run',
  'about:blank',
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failed = false;
try {
  await sleep(2200);
  const list = await (await fetch('http://127.0.0.1:9339/json/list')).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, rej) => {
    ws.onopen = r;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result);
      pending.delete(m.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const i = ++id;
      pending.set(i, resolve);
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  await send('Page.enable');
  await send('Page.navigate', { url });
  await sleep(2500);

  const expression = `(async () => {
    await document.fonts.ready;
    const probe = ${JSON.stringify(families)};
    return probe.map(({ family, weight }) => ({
      family,
      latin: document.fonts.check(weight + ' 20px "' + family + '"', 'Khu vuon so hoc 1234567890'),
      vietnamese: document.fonts.check(weight + ' 20px "' + family + '"', 'ườ ệ ữ đ ươ ạ ế ơ ư'),
    }));
  })()`;
  const r = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  const results = r?.result?.value ?? [];
  if (results.length === 0) throw new Error('no font results — page may not have loaded');
  for (const row of results) {
    const ok = row.latin && row.vietnamese;
    console.log(
      `${ok ? '✔' : '✖'} ${row.family} — latin+digits: ${row.latin ? 'OK' : 'FALLBACK'} · vietnamese: ${row.vietnamese ? 'OK' : 'FALLBACK'}`,
    );
    if (!ok) failed = true;
  }
  ws.close();
} catch (err) {
  console.error('font check failed:', err.message);
  failed = true;
} finally {
  chrome.kill();
  process.exit(failed ? 1 : 0);
}
