// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'vite';

// base './' — the artifact must run from any static subpath (Shiplo hosting,
// file:// smoke). Root-absolute URLs break both; verify:static warns on them.
// JSON content stays as fetchable files under data/ (content is the product);
// fonts import from @fontsource and get bundled — no runtime font CDN.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
  },
});
