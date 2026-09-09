// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vite';

// base './' — artifact must run from any static subpath (Shiplo hosting,
// file:// smoke tests). Root-absolute URLs break both; verify:static warns.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 8192,
  },
});
