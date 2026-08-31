// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute path inside the repository root. */
export function repoRoot(...parts) {
  return join(dirname(fileURLToPath(import.meta.url)), '..', ...parts);
}

export const STATUSES = [
  'planned',
  'designing',
  'building',
  'polishing',
  'deploying',
  'live',
  'archived',
];

export const CATEGORIES = [
  'education-math',
  'education-language',
  'education-science',
  'education-geography',
  'education-computing',
  'creative-tool',
  'marketing',
  'portfolio',
  'productivity',
];

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const ISO_UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export const LOCKFILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'bun.lock',
];

export function loadRegistry() {
  return JSON.parse(readFileSync(repoRoot('showcase.json'), 'utf8'));
}

export function saveRegistry(registry) {
  writeFileSync(repoRoot('showcase.json'), JSON.stringify(registry, null, 2) + '\n');
}

export class Checker {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }
  error(message) {
    this.errors.push(message);
  }
  warn(message) {
    this.warnings.push(message);
  }
  report(label = 'check') {
    for (const w of this.warnings) console.log(`  ⚠ ${w}`);
    for (const e of this.errors) console.error(`  ✖ ${e}`);
    if (this.errors.length > 0) {
      console.error(`\n✖ ${label} failed with ${this.errors.length} error(s).`);
      return false;
    }
    console.log(`\n✔ ${label} passed.`);
    return true;
  }
}
