#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Repository hygiene:
//   - required governance/tooling files exist
//   - nothing forbidden is committed (dist/, node_modules/, local tooling, .env)
//   - secret scan over tracked files (safe, local, regex-based)
//
// Usage: node scripts/check-repo.mjs

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { repoRoot, Checker } from './lib.mjs';

const check = new Checker();

// ---- required files --------------------------------------------------------

const requiredFiles = [
  'LICENSE',
  'NOTICE',
  'TRADEMARKS.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'THIRD_PARTY_POLICY.md',
  'showcase.json',
  'README.md',
  'schemas/showcase-registry.schema.json',
  'templates/project/README.md',
  'templates/project/NOTICE',
  'templates/project/THIRD_PARTY_NOTICES.md',
  'templates/project/gitignore',
  'templates/project/showcase/metadata.json',
  'templates/project/showcase/deployment.json',
  'scripts/lib.mjs',
  'scripts/new-showcase.mjs',
  'scripts/validate-registry.mjs',
  'scripts/check-repo.mjs',
  'scripts/update-gallery.mjs',
  'scripts/verify-static-build.mjs',
];

console.log('Checking required governance/tooling files…');
for (const file of requiredFiles) {
  if (!existsSync(repoRoot(file))) check.error(`required file missing: ${file}`);
}

// ---- committed files must never include these ------------------------------

console.log('Checking for forbidden committed paths…');
const tracked = gitLsFiles();

const forbidden = [
  [/(^|\/)dist\//, 'generated build output (dist/)'],
  [/(^|\/)dist-ssr\//, 'generated build output (dist-ssr/)'],
  [/(^|\/)build\//, 'generated build output (build/)'],
  [/(^|\/)node_modules\//, 'dependencies (node_modules/)'],
  [/(^|\/)\.env$/, 'environment file (.env) — commit .env.example instead'],
  [/(^|\/)\.claude\//, 'project-local tooling (.claude/)'],
  [/(^|\/)vendor\//, 'local vendored assets (vendor/) — regenerated after clone'],
  [/(^|\/)\.showcase\//, 'project-local specs/data (.showcase/)'],
  [/(^|\/)skills-lock\.json$/, 'project-local tooling (skills-lock.json)'],
  [/^CLAUDE\.md$/, 'project-local agent instructions (CLAUDE.md)'],
];

for (const path of tracked) {
  for (const [re, why] of forbidden) {
    if (re.test(path)) {
      check.error(`forbidden committed path: ${path} — ${why}`);
    }
  }
}

// ---- secret scan -----------------------------------------------------------

console.log('Scanning tracked files for obvious secrets…');

const SECRET_PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key block'],
  [/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/, 'AWS access key id'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, 'GitHub token'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, 'Slack token'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'Google API key'],
  [/\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}\b/, 'API key literal (sk-…)'],
  [/\bglpat-[A-Za-z0-9_-]{20,}\b/, 'GitLab personal access token'],
];

const GENERIC_ASSIGNMENT =
  /(?:api[_-]?key|secret|password|passwd|token|bearer)\s*[:=]\s*["'][^"']{8,}["']/i;

// Values that are obviously placeholders, not credentials.
const PLACEHOLDER =
  /(?:your|placeholder|example|sample|dummy|fake|changeme|change-?me|redacted|xxxx+|____|<[^>]*>|\$\{[^}]*\}|\$[A-Z_]{3,}|process\.env)/i;

const MAX_SCAN_BYTES = 1_000_000;

for (const path of tracked) {
  const abs = repoRoot(path);
  let text;
  try {
    if (statSync(abs).size > MAX_SCAN_BYTES) continue;
    const buf = readFileSync(abs);
    if (buf.includes(0)) continue; // binary
    text = buf.toString('utf8');
  } catch {
    continue;
  }

  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const [re, why] of SECRET_PATTERNS) {
      if (re.test(line)) check.error(`possible ${why} in ${path}:${i + 1}`);
    }
    if (GENERIC_ASSIGNMENT.test(line) && !PLACEHOLDER.test(line)) {
      check.error(`possible hardcoded credential in ${path}:${i + 1} — "${line.trim().slice(0, 90)}"`);
    }
  });
}

// ---- summary ---------------------------------------------------------------

console.log(`Scanned ${tracked.length} tracked file(s).`);
process.exit(check.report('repository hygiene') ? 0 : 1);

// ---- helpers ---------------------------------------------------------------

function gitLsFiles() {
  try {
    // tracked files + untracked-but-not-ignored files, so local runs see new work too
    const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: repoRoot(),
      maxBuffer: 64 * 1024 * 1024,
    });
    return out.toString('utf8').split('\0').filter(Boolean);
  } catch (err) {
    check.warn(`could not run "git ls-files" (${err.message.split('\n')[0]}) — forbidden-path and secret checks skipped`);
    return [];
  }
}
