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
    // JSON stays as fetchable files under data/ (content is the product);
    // SVGs are authored inline in components, so the default inline threshold
    // is fine.
  },
});
