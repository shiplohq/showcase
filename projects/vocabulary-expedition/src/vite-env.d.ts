/// <reference types="vite/client" />

// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
