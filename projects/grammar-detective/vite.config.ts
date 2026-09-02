// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' — the artifact must run from any static subpath (Shiplo hosting,
// file:// smoke tests). Root-absolute URLs break both; verify:static warns.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    // Every asset stays a real file: inlined data-URIs (e.g. the paper-grain
    // SVG with its internal url(#filter) reference) trip verify:static's
    // url() asset check, and file-per-asset keeps the artifact auditable.
    assetsInlineLimit: 0,
  },
});
