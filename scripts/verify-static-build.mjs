#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Static build verification: checks that projects/<slug>/dist is a complete,
// self-contained static artifact:
//   - index.html exists
//   - every local asset referenced by HTML/CSS exists in dist
//   - no runtime CDN scripts/stylesheets (policy: bundled/local assets only)
//   - warns on root-absolute URLs (break file:// and subpath hosting)
//
// Usage:
//   node scripts/verify-static-build.mjs <slug>
//   node scripts/verify-static-build.mjs <slug> --dist <path>   # custom artifact dir

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { repoRoot } from './lib.mjs';

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const distFlagIdx = args.indexOf('--dist');
const distArg = distFlagIdx >= 0 ? args[distFlagIdx + 1] : undefined;

if (!slug) {
  console.error('Usage: node scripts/verify-static-build.mjs <slug> [--dist <path>]');
  process.exit(1);
}

const dist = resolve(distArg ?? repoRoot('projects', slug, 'dist'));
if (!existsSync(dist)) {
  console.error(`✖ Build output not found at ${relative(repoRoot(), dist)} — run the project build first.`);
  process.exit(1);
}

const failures = [];
const warnings = [];
const externals = new Set();
const files = listFiles(dist);

const indexHtml = join(dist, 'index.html');
if (!existsSync(indexHtml)) {
  failures.push('dist/index.html is missing — the artifact has no entry point');
} else {
  const htmlFiles = files.filter((f) => extname(f).toLowerCase() === '.html');
  const cssFiles = files.filter((f) => extname(f).toLowerCase() === '.css');
  for (const html of htmlFiles) checkHtml(html);
  for (const css of cssFiles) checkCss(css);
}

// ---- checks ----------------------------------------------------------------

function checkHtml(htmlPath) {
  const html = readFileSync(htmlPath, 'utf8');
  const rel = relative(repoRoot(), htmlPath);

  // <script src="…"> — runtime scripts must be local
  for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) {
    const href = m[1];
    if (isExternal(href)) {
      failures.push(`${rel}: runtime script loaded from a CDN: ${href} (policy: local/bundled assets only)`);
      externals.add(href);
    } else {
      verifyRef(htmlPath, href, rel, 'script src');
    }
  }

  // <link …> — stylesheets and preloads must be local
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const href = /(?:^|\s)href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) continue;
    const rel2 = /(?:^|\s)rel\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? '';
    if (isExternal(href)) {
      externals.add(href);
      if (/stylesheet|preload|preedit/i.test(rel2) || rel2 === 'modulepreload') {
        failures.push(`${rel}: <link rel="${rel2}"> loads from a remote host: ${href}`);
      }
      continue;
    }
    verifyRef(htmlPath, href, rel, `link rel=${rel2 || '?'}`);
  }

  // <img|source|video|audio|poster src / srcset> — script tags were handled above
  const htmlNoScripts = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  for (const m of htmlNoScripts.matchAll(/(?:\s(?:src|poster)\s*=\s*["']([^"']+)["']|\bsrcset\s*=\s*["']([^"']+)["'])/gi)) {
    const values = m[2] ? m[2].split(',').map((s) => s.trim().split(/\s+/)[0]) : [m[1]];
    for (const value of values) {
      if (isExternal(value)) {
        externals.add(value);
        warnings.push(`${rel}: media loaded from a remote host: ${value} (policy prefers local assets)`);
      } else {
        verifyRef(htmlPath, value, rel, 'media');
      }
    }
  }

  // CSS loaded from <style>? no — inline styles have no refs to chase here.
}

function checkCss(cssPath) {
  const css = readFileSync(cssPath, 'utf8');
  const rel = relative(repoRoot(), cssPath);
  for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
    const value = m[1];
    if (value.startsWith('data:')) continue;
    if (isExternal(value)) {
      externals.add(value);
      warnings.push(`${rel}: @font-face/asset url() on a remote host: ${value}`);
    } else {
      verifyRef(cssPath, value, rel, 'css url()');
    }
  }
}

function verifyRef(fromFile, rawRef, relLabel, kind) {
  if (!rawRef || /^(#|data:|blob:|mailto:|tel:|javascript:)/i.test(rawRef)) return;
  const [pathPart] = rawRef.split('#')[0].split('?');
  if (!pathPart) return;
  const target = resolve(dirname(fromFile), pathPart);
  if (!target.startsWith(dist)) {
    warnings.push(`${relLabel}: ${kind} escapes the artifact: ${rawRef}`);
    return;
  }
  if (!existsSync(target)) {
    failures.push(`${relLabel}: ${kind} points to a missing file: ${rawRef}`);
    return;
  }
  if (pathPart.startsWith('/')) {
    warnings.push(
      `${relLabel}: root-absolute path "${pathPart}" — breaks when opened from file:// or hosted under a subpath (use base: './')`,
    );
  }
}

// ---- summary ---------------------------------------------------------------

let totalBytes = 0;
for (const f of files) totalBytes += statSync(f).size;

console.log(`Artifact: ${relative(repoRoot(), dist)} — ${files.length} file(s), ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
if (externals.size > 0) {
  console.log(`Remote hosts referenced (${externals.size}):`);
  for (const url of externals) console.log(`  - ${url}`);
}
for (const w of warnings) console.log(`⚠ ${w}`);
for (const f of failures) console.error(`✖ ${f}`);

if (failures.length > 0) {
  console.error(`\n✖ Static build verification failed: ${failures.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`\n✔ Static build verification passed${warnings.length ? ` with ${warnings.length} warning(s)` : ''}.`);

// ---- helpers ---------------------------------------------------------------

function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(path));
    else out.push(path);
  }
  return out;
}

function isExternal(ref) {
  return /^https?:\/\//i.test(ref) || ref.startsWith('//');
}
