// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// base './' — artifact must run from any static subpath (Shiplo hosting,
// file:// smoke tests). Root-absolute URLs break both; verify:static warns.
export default defineConfig({
    base: './',
    plugins: [react()],
    build: {
        target: 'es2020',
        assetsInlineLimit: 8192,
    },
});
