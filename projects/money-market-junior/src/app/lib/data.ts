// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content loader — the market catalog and missions come from local JSON
// files next to the app (content state, spec §state model). URLs are
// document-relative (no leading slash) so the artifact works from any
// subpath; validation runs dev-time AND runtime — a failure degrades to a
// clear message, never a white screen (spec JSON contract).

import type { Catalog, Challenges } from '../features/market/engine';
import { validateCatalog } from '../features/market/engine';

export interface Content {
  catalog: Catalog;
  challenges: Challenges;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status})`);
  return res.json();
}

export async function loadContent(): Promise<Content> {
  try {
    const [catalog, challenges] = (await Promise.all([
      fetchJson('data/products.json'),
      fetchJson('data/challenges.json'),
    ])) as [Catalog, Challenges];
    validateCatalog(catalog, challenges);
    return { catalog, challenges };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'The market data could not be read.';
    throw new Error(`Market content check failed — ${message}`);
  }
}
