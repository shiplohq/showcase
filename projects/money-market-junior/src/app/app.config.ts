// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

/**
 * No router: navigation is state-based (market ⇄ checkout ⇄ receipt) with the
 * mission id mirrored into location.hash, so the static artifact never needs
 * server-side history fallback (spec: static-hosting rules).
 */
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};
