// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// base './' — the artifact must run from any static subpath (Shiplo hosting,
// file:// smoke tests). Root-absolute URLs break both; verify:static warns.
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 8192,
  },
});
