// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

/**
 * No router: navigation is state-based (lobby ⇄ workbench ⇄ review) so the
 * static artifact never needs server-side history fallback (spec:
 * static-hosting rules).
 */
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};
