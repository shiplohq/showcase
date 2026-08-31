#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Validates showcase.json against schemas/showcase-registry.schema.json rules
// plus the cross-file gates that cannot live in a plain schema:
//   - status <-> project directory consistency
//   - per-project legal files (README, LICENSE, NOTICE, THIRD_PARTY_NOTICES)
//   - `live` gates: demo URL, screenshots, deployment.json provenance
//
// Usage: node scripts/validate-registry.mjs

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  repoRoot,
  loadRegistry,
  STATUSES,
  CATEGORIES,
  SLUG_RE,
  ISO_UTC_RE,
  LOCKFILES,
  Checker,
} from './lib.mjs';

const check = new Checker();
const REQUIRED_KEYS = ['id', 'number', 'title', 'category', 'status', 'stack', 'source', 'demo', 'screenshots'];
const SCREENSHOT_KINDS = ['cover', 'desktop', 'tablet', 'mobile'];

let registry;
try {
  registry = loadRegistry();
} catch (err) {
  console.error(`✖ showcase.json is not valid JSON: ${err.message}`);
  process.exit(1);
}

if (registry.version !== 1) check.error('registry version must be 1');
if (!Array.isArray(registry.projects) || registry.projects.length === 0) {
  check.error('"projects" must be a non-empty array');
}

const seenIds = new Set();
const seenNumbers = new Set();

for (const p of registry.projects ?? []) {
  const label = `project ${p.id ? `"${p.id}"` : '(missing id)'}`;

  for (const key of REQUIRED_KEYS) {
    if (!(key in p)) check.error(`${label}: missing required key "${key}"`);
  }
  if (typeof p.id !== 'string' || !SLUG_RE.test(p.id)) {
    check.error(`${label}: "id" must be a kebab-case slug`);
    continue;
  }
  if (seenIds.has(p.id)) check.error(`${label}: duplicate id`);
  seenIds.add(p.id);

  if (!Number.isInteger(p.number) || p.number < 1) {
    check.error(`${label}: "number" must be a positive integer`);
  } else if (seenNumbers.has(p.number)) {
    check.error(`${label}: duplicate number ${p.number}`);
  } else {
    seenNumbers.add(p.number);
  }

  if (typeof p.title !== 'string' || p.title.length === 0) {
    check.error(`${label}: "title" must be a non-empty string`);
  }
  if (!CATEGORIES.includes(p.category)) {
    check.error(`${label}: unknown category "${p.category}"`);
  }
  if (!STATUSES.includes(p.status)) {
    check.error(`${label}: unknown status "${p.status}" (allowed: ${STATUSES.join(', ')})`);
  }
  if (!Array.isArray(p.stack) || p.stack.length === 0 || !p.stack.every((s) => typeof s === 'string' && s.length > 0)) {
    check.error(`${label}: "stack" must be a non-empty array of strings`);
  }

  if (p.source) {
    if (p.source.path !== `projects/${p.id}`) {
      check.error(`${label}: source.path must be "projects/${p.id}"`);
    }
  }

  if (p.demo) {
    if (p.demo.provider !== 'Shiplo') {
      check.error(`${label}: demo.provider must be "Shiplo"`);
    }
    const { url, deployedAt } = p.demo;
    if (url !== null && !(typeof url === 'string' && url.startsWith('https://'))) {
      check.error(`${label}: demo.url must be null or an https:// URL`);
    }
    if (deployedAt !== null && !(typeof deployedAt === 'string' && ISO_UTC_RE.test(deployedAt))) {
      check.error(`${label}: demo.deployedAt must be null or an ISO-8601 UTC timestamp`);
    }
    if ((url === null) !== (deployedAt === null)) {
      check.warn(`${label}: demo.url and demo.deployedAt should be set together`);
    }
  }

  const shots = p.screenshots ?? {};
  for (const kind of SCREENSHOT_KINDS) {
    const value = shots[kind];
    if (value === null || value === undefined) continue;
    const expected = `projects/${p.id}/showcase/${kind}.webp`;
    if (value !== expected) {
      check.error(`${label}: screenshots.${kind} must be null or "${expected}"`);
    } else if (!existsSync(repoRoot(value))) {
      check.error(`${label}: screenshots.${kind} points to a missing file: ${value}`);
    }
  }

  const dir = repoRoot('projects', p.id);
  const hasDir = existsSync(dir);
  if (['building', 'polishing', 'deploying', 'live'].includes(p.status) && !hasDir) {
    check.error(`${label}: status "${p.status}" requires projects/${p.id}/ to exist`);
  }
  if (hasDir) checkProjectDirectory(p, dir);
  if (p.status === 'live') checkLive(p, dir);
}

/** Legal files and package hygiene for a scaffolded project. */
function checkProjectDirectory(p, dir) {
  const label = `project "${p.id}"`;
  for (const file of ['README.md', 'LICENSE', 'NOTICE', 'THIRD_PARTY_NOTICES.md']) {
    if (!existsSync(join(dir, file))) {
      check.error(`${label}: projects/${p.id}/${file} is missing`);
    }
  }

  const pkgPath = join(dir, 'package.json');
  if (existsSync(pkgPath)) {
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    } catch (err) {
      check.error(`${label}: projects/${p.id}/package.json is not valid JSON`);
      return;
    }
    if (pkg.private !== true) {
      check.error(`${label}: projects/${p.id}/package.json must set "private": true (no accidental npm publishing)`);
    }
    if (typeof pkg.license !== 'string' || pkg.license.length === 0) {
      check.error(`${label}: projects/${p.id}/package.json must declare a "license"`);
    }
    if (!(pkg.scripts && typeof pkg.scripts.build === 'string' && pkg.scripts.build.length > 0)) {
      check.error(`${label}: projects/${p.id}/package.json must define a "build" script`);
    }
    if (!LOCKFILES.some((lock) => existsSync(join(dir, lock)))) {
      check.error(`${label}: projects/${p.id} has package.json but no committed lockfile`);
    }
  }

  const noticesPath = join(dir, 'THIRD_PARTY_NOTICES.md');
  if (existsSync(noticesPath)) {
    const text = readFileSync(noticesPath, 'utf8');
    if (/replace this row/i.test(text)) {
      const message = `${label}: THIRD_PARTY_NOTICES.md still contains the template placeholder row`;
      if (p.status === 'live') check.error(message);
      else check.warn(message);
    }
  }
}

/** Hard gates for a `live` showcase. */
function checkLive(p, dir) {
  const label = `project "${p.id}"`;
  if (!(p.demo && typeof p.demo.url === 'string' && p.demo.url.startsWith('https://'))) {
    check.error(`${label}: status "live" requires a demo.url returned by Shiplo`);
  }
  if (!(p.demo && p.demo.deployedAt)) {
    check.error(`${label}: status "live" requires demo.deployedAt`);
  }
  if (!(p.screenshots && p.screenshots.cover && p.screenshots.desktop)) {
    check.error(`${label}: status "live" requires cover and desktop screenshots`);
  }
  if (p.category.startsWith('education') && !(p.screenshots && p.screenshots.tablet)) {
    check.error(`${label}: educational showcases must publish a tablet screenshot`);
  }

  const meta = readJson(join(dir, 'showcase', 'metadata.json'));
  if (!meta) {
    check.error(`${label}: live showcase is missing showcase/metadata.json`);
  } else {
    if (!(p.screenshots && p.screenshots.mobile) && meta.mobileSupport !== 'unsupported') {
      check.error(
        `${label}: mobile screenshot is null — allowed only with mobileSupport: "unsupported" + a note in showcase/metadata.json`,
      );
    }
    if (meta.mobileSupport === 'unsupported' && !(typeof meta.mobileSupportNote === 'string' && meta.mobileSupportNote.length > 0)) {
      check.error(`${label}: mobileSupport "unsupported" requires a mobileSupportNote`);
    }
    for (const kind of SCREENSHOT_KINDS) {
      const entry = meta.screenshots?.[kind];
      if (p.screenshots?.[kind] && entry && entry.capturedFrom !== p.demo.url) {
        check.error(`${label}: metadata screenshots.${kind}.capturedFrom must equal the live demo.url (screenshots come from the live deployment)`);
      }
    }
  }

  const dep = readJson(join(dir, 'showcase', 'deployment.json'));
  if (!dep) {
    check.error(`${label}: live showcase is missing showcase/deployment.json`);
    return;
  }
  if (dep.status !== 'verified') {
    check.error(`${label}: deployment.json status must be "verified" for a live showcase`);
  }
  if (p.demo.url && dep.url !== p.demo.url) {
    check.error(`${label}: deployment.json url must equal showcase.json demo.url (the URL returned by Shiplo)`);
  }
  if (p.demo.deployedAt && dep.deployedAt !== p.demo.deployedAt) {
    check.error(`${label}: deployment.json deployedAt must equal showcase.json demo.deployedAt`);
  }
  if (!(typeof dep.sourceCommitSha === 'string' && /^[0-9a-f]{40}$/.test(dep.sourceCommitSha))) {
    check.error(`${label}: deployment.json sourceCommitSha must be a 40-hex git commit SHA`);
  }
  if (!(typeof dep.artifactSha256 === 'string' && /^[0-9a-f]{64}$/.test(dep.artifactSha256))) {
    check.error(`${label}: deployment.json artifactSha256 must be a 64-hex SHA-256`);
  }
  if (!(typeof dep.buildCommand === 'string' && dep.buildCommand.length > 0)) {
    check.error(`${label}: deployment.json buildCommand must record the exact build command`);
  }
  if (!(typeof dep.verifiedAt === 'string' && ISO_UTC_RE.test(dep.verifiedAt))) {
    check.error(`${label}: deployment.json verifiedAt must be an ISO-8601 UTC timestamp`);
  }
}

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    check.error(`invalid JSON: ${path}`);
    return null;
  }
}

// ---- summary ---------------------------------------------------------------

const total = (registry.projects ?? []).length;
const byStatus = {};
for (const p of registry.projects ?? []) byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
console.log(`Registry: ${total} showcase(s) — ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
console.log('Validating…');
process.exit(check.report('showcase.json') ? 0 : 1);
