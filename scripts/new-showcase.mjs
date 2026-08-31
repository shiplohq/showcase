#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Scaffolds projects/<slug>/ from templates/project/ for a showcase that is
// already registered (status "planned" or "designing") in showcase.json.
//
// Usage:
//   node scripts/new-showcase.mjs <slug> [--status building] [--dry-run]
//
// The slug must exist in showcase.json — the registry is the source of truth,
// so register new showcases there first.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot, loadRegistry, saveRegistry, STATUSES, SLUG_RE } from './lib.mjs';

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const statusFlag = readFlag('--status');
const dryRun = args.includes('--dry-run');

if (!slug || !SLUG_RE.test(slug)) {
  console.error('Usage: node scripts/new-showcase.mjs <slug> [--status <status>] [--dry-run]');
  console.error('<slug> must be a kebab-case id that already exists in showcase.json.');
  process.exit(1);
}

const status = statusFlag ?? 'building';
if (!STATUSES.includes(status)) {
  console.error(`✖ unknown status "${status}" (allowed: ${STATUSES.join(', ')})`);
  process.exit(1);
}

const registry = loadRegistry();
const entry = registry.projects.find((p) => p.id === slug);
if (!entry) {
  console.error(`✖ "${slug}" is not in showcase.json — register it there first (status "planned").`);
  process.exit(1);
}
if (['live', 'archived'].includes(entry.status)) {
  console.error(`✖ "${slug}" is already ${entry.status}; refusing to scaffold over it.`);
  process.exit(1);
}

const dest = repoRoot('projects', slug);
if (existsSync(dest)) {
  console.error(`✖ projects/${slug}/ already exists.`);
  process.exit(1);
}

const substitutions = {
  __SLUG__: slug,
  __TITLE__: entry.title,
  __NUMBER__: String(entry.number), // plain integer — valid in JSON templates
  __NUMBER_PADDED__: String(entry.number).padStart(2, '0'), // display use only
  __CATEGORY__: entry.category,
  __SUMMARY__: entry.summary ?? entry.title,
  __YEAR__: String(new Date().getFullYear()),
};

const src = repoRoot('templates', 'project');
console.log(`${dryRun ? '[dry-run] Would create' : 'Creating'} projects/${slug}/ from templates/project/ …`);
if (!dryRun) {
  cpSync(src, dest, {
    recursive: true,
    filter: (from) => !from.endsWith(join('gitignore')),
  });
  applySubstitutions(dest, substitutions);
  writeFileSync(join(dest, '.gitignore'), readFileSync(join(src, 'gitignore')));
  // Per-project LICENSE = the repository Apache-2.0 text (single source of truth).
  writeFileSync(join(dest, 'LICENSE'), readFileSync(repoRoot('LICENSE')));
  for (const dir of ['src', join('public', 'data'), join('public', 'assets')]) {
    mkdirSync(join(dest, dir), { recursive: true });
    writeFileSync(join(dest, dir, '.gitkeep'), '');
  }
  entry.status = status;
  saveRegistry(registry);
}

const spec = findSpec(entry.number);
console.log(`
✔ Scaffolded projects/${slug}/ (registry status → "${status}").

Next steps:
  1. Read the spec${spec ? `: ${spec}` : ' (.showcase/<NN>_<slug>.md) — it is the source of truth'}.
  2. Add the stack the spec calls for (e.g. npm create vite@latest . -- --template react-ts),
     or keep it build-free — then fill in package.json (private: true, license, build script).
  3. Implement through the lifecycle (see CONTRIBUTING.md):
     DESIGN → IMPLEMENT → TEST → IMPECCABLE REVIEW → BUILD → SECURITY/LICENSE REVIEW →
     DEPLOY TO SHIPLO → VERIFY → SCREENSHOTS → METADATA → GALLERY → LIVE.
  4. Keep THIRD_PARTY_NOTICES.md updated as you add dependencies and assets.
  5. node scripts/validate-registry.mjs tells you what the registry is missing.
`);
process.exit(0);

function readFlag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function applySubstitutions(dir, map) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) {
      applySubstitutions(path, map);
    } else {
      const text = readFileSync(path, 'utf8');
      const replaced = Object.entries(map).reduce((acc, [from, to]) => acc.replaceAll(from, to), text);
      if (replaced !== text) writeFileSync(path, replaced);
    }
  }
}

function findSpec(number) {
  const prefix = `${String(number).padStart(2, '0')}_`;
  const local = repoRoot('.showcase');
  if (!existsSync(local)) return null;
  const match = readdirSync(local).find((f) => f.startsWith(prefix) && f.endsWith('.md'));
  return match ? `.showcase/${match}` : null;
}
