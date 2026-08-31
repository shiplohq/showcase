#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Renders the root README blocks that must stay in sync with showcase.json:
//   - the LIVE gallery (only status "live" projects, with their real demo URLs)
//   - the full catalog
//
// Usage:
//   node scripts/update-gallery.mjs           # rewrite the README blocks
//   node scripts/update-gallery.mjs --check   # exit 1 if the blocks are stale (CI)

import { readFileSync, writeFileSync } from 'node:fs';
import { repoRoot, loadRegistry } from './lib.mjs';

const checkOnly = process.argv.includes('--check');
const readmePath = repoRoot('README.md');

const GALLERY = ['<!-- showcase:gallery:start -->', '<!-- showcase:gallery:end -->'];
const CATALOG = ['<!-- showcase:catalog:start -->', '<!-- showcase:catalog:end -->'];

let readme;
try {
  readme = readFileSync(readmePath, 'utf8');
} catch {
  console.error('✖ README.md not found in the repository root.');
  process.exit(1);
}

const registry = loadRegistry();
const projects = [...registry.projects].sort((a, b) => a.number - b.number);
const live = projects.filter((p) => p.status === 'live');

try {
  if (checkOnly) {
    const after = rewrite(rewrite(readme, GALLERY, renderGallery(live)), CATALOG, renderCatalog(projects));
    if (after === readme) {
      console.log('✔ README gallery and catalog are up to date.');
      process.exit(0);
    }
    console.error('✖ README gallery/catalog blocks are stale — run "npm run gallery".');
    process.exit(1);
  }
  const updated = rewrite(rewrite(readme, GALLERY, renderGallery(live)), CATALOG, renderCatalog(projects));
  writeFileSync(readmePath, updated);
  console.log(`✔ README updated — ${live.length} live showcase(s) in the gallery, ${projects.length} in the catalog.`);
} catch (err) {
  console.error(`✖ ${err.message}`);
  process.exit(1);
}

// ---- block rewriting -------------------------------------------------------

function rewrite(text, [start, end], content) {
  const from = text.indexOf(start);
  const to = text.indexOf(end);
  if (from === -1 || to === -1 || to < from) {
    throw new Error(`README.md is missing the ${start} … ${end} markers.`);
  }
  return `${text.slice(0, from + start.length)}\n${content}\n${text.slice(to)}`;
}

// ---- renderers -------------------------------------------------------------

function renderGallery(live) {
  if (live.length === 0) {
    return [
      '> Nothing is live yet. Showcases appear here — with their real Shiplo URLs —',
      '> only after they complete the full lifecycle (see [CONTRIBUTING.md](CONTRIBUTING.md)).',
    ].join('\n');
  }
  const rows = live.map((p) => {
    const img = p.screenshots.cover
      ? `<img src="${p.screenshots.cover}" alt="${p.title} cover" width="360">`
      : '—';
    const summary = p.summary ?? '';
    return `| ${img} | **[${p.title}](${p.demo.url})**<br>${summary} | ${p.category} |`;
  });
  return ['| | Showcase | Category |', '|---|---|---|', ...rows].join('\n');
}

function renderCatalog(projects) {
  const rows = projects.map((p) => {
    const demo = p.status === 'live' && p.demo.url ? ` — [live demo](${p.demo.url})` : '';
    return `| ${String(p.number).padStart(2, '0')} | **${p.title}**${demo} | ${p.category} | ${p.stack.join(' · ')} | ${p.status} |`;
  });
  return ['| # | Showcase | Category | Stack | Status |', '|---|---|---|---|---|', ...rows].join('\n');
}
