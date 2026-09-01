#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// The Angular application builder emits browser output into dist/browser/
// (plus a prerendered-routes.json manifest). This showcase ships a plain
// static artifact whose root must BE dist/ (verify:static + Shiplo deploy
// expect dist/index.html). This script flattens the output in place.

import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(projectRoot, 'dist');
const browser = join(dist, 'browser');

if (!existsSync(browser)) {
  console.log('flatten-dist: dist/browser not present — nothing to do.');
  process.exit(0);
}

for (const entry of readdirSync(browser)) {
  cpSync(join(browser, entry), join(dist, entry), { recursive: true });
}
rmSync(browser, { recursive: true, force: true });
rmSync(join(dist, 'prerendered-routes.json'), { force: true });

console.log(`flatten-dist: dist/ now holds ${readdirSync(dist).length} entries (browser output flattened).`);
