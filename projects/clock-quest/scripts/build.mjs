#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// "Build" for a no-bundler project: assemble + validate, don't transform.
// Copies the source tree (index.html, css/, js/, data/, fonts/, vendor/)
// into dist/ and verifies the artifact is complete and self-contained:
//   - every script/stylesheet/icon referenced by index.html exists
//   - JSON content parses
//   - no runtime CDN / remote hosts
//   - every file under the Shiplo per-file upload cap (3 MB)
// The deployed thing IS the source — this script exists so `npm run build`
// produces and gates the artifact exactly like the bundler-based showcases.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DIST = join(ROOT, 'dist');
const verifyOnly = process.argv.includes('--verify-only');

const DIRS = ['css', 'js', 'data', 'fonts', 'vendor'];
const SHIPLO_FILE_CAP = 3 * 1024 * 1024;

const failures = [];

if (!verifyOnly) {
  try {
    rmSync(DIST, { recursive: true, force: true });
  } catch (e) {
    if (!existsSync(DIST)) throw e;
    // Windows: a lingering process CWD can pin the directory itself while the
    // children are gone — empty it in place and rebuild inside (deploy-safe).
    for (const entry of readdirSync(DIST)) rmSync(join(DIST, entry), { recursive: true, force: true });
  }
  mkdirSync(DIST, { recursive: true });
  cpSync(join(ROOT, 'index.html'), join(DIST, 'index.html'));
  for (const dir of DIRS) {
    const from = join(ROOT, dir);
    if (!existsSync(from)) failures.push(`missing source dir: ${dir}/`);
    else cpSync(from, join(DIST, dir), { recursive: true });
  }
  // build stamp (informational, not load-bearing)
  writeFileSync(join(DIST, 'built-at.txt'), new Date().toISOString() + '\n');
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('✖ dist/index.html is missing — run the build first.');
  process.exit(1);
}

// ---- checks ------------------------------------------------------------------

const html = readFileSync(join(DIST, 'index.html'), 'utf8');

for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) {
  checkLocal(m[1], 'script src');
}
for (const m of html.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
  if (/^data:/.test(m[1])) continue;
  checkLocal(m[1], 'link href');
}

for (const file of ['data/lessons.json', 'data/schedule.json']) {
  try {
    JSON.parse(readFileSync(join(DIST, file), 'utf8'));
  } catch (e) {
    failures.push(`${file}: invalid JSON — ${e.message}`);
  }
}

// CSS url() refs resolve inside the artifact
for (const dir of listDir(join(DIST, 'css'))) {
  if (!dir.endsWith('.css')) continue;
  const css = readFileSync(join(DIST, 'css', dir), 'utf8');
  for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
    if (m[1].startsWith('data:')) continue;
    checkLocal('css/' + m[1].replace(/\?\S*$/, ''), 'css url()');
  }
}

function checkLocal(ref, kind) {
  if (/^https?:\/\//i.test(ref) || ref.startsWith('//')) {
    failures.push(`${kind} points at a remote host (no runtime CDN): ${ref}`);
    return;
  }
  if (ref.startsWith('/')) {
    failures.push(`${kind} uses a root-absolute path (breaks subpath hosting): ${ref}`);
    return;
  }
  const clean = ref.split('#')[0].split('?')[0];
  const target = resolve(DIST, clean); // index.html sits at the artifact root
  if (!target.startsWith(DIST)) { failures.push(`${kind} escapes the artifact: ${ref}`); return; }
  if (!existsSync(target)) failures.push(`${kind} points to a missing file: ${ref}`);
}

function listDir(dir) {
  return existsSync(dir) ? readdirSync(dir) : [];
}

// walk the artifact for size + stray internal files
let total = 0, count = 0;
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) { walk(p); continue; }
    const size = statSync(p).size;
    total += size;
    count++;
    const rel = relative(DIST, p).replaceAll('\\', '/');
    if (size > SHIPLO_FILE_CAP) failures.push(`${rel}: ${(size / 1024 / 1024).toFixed(1)} MB exceeds the 3 MB per-file upload cap`);
    if (/(^|\/)(IMAGE_BRIEF[^/]*|generated-manifest\.json)$/i.test(rel)) {
      failures.push(`${rel}: internal provenance file must not ship`);
    }
  }
})(DIST);

console.log(`Artifact: dist/ — ${count} file(s), ${(total / 1024).toFixed(0)} KB`);
for (const f of failures) console.error(`✖ ${f}`);
if (failures.length) {
  console.error(`\n✖ Build verification failed (${failures.length}).`);
  process.exit(1);
}
console.log('✔ No-build artifact verified: local refs only, JSON valid, within size caps.');
