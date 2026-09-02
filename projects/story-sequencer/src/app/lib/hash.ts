// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

/**
 * Hash navigation — static-hosting-safe state routing (no history API, no
 * server fallback needed). '#/' → shelf, '#/story/<id>' → storyboard.
 */

import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { signal } from '@angular/core';

export type Route = { view: 'shelf' } | { view: 'story'; id: string };

function parse(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').split('?')[0];
  const parts = clean.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'story') {
    return { view: 'story', id: parts[1] };
  }
  return { view: 'shelf' };
}

export function goStory(id: string): void {
  window.location.hash = `/story/${id}`;
}

export function goShelf(): void {
  window.location.hash = '/';
}

export function connectHashRoute(): { route: ReturnType<typeof signal<Route>> } {
  const doc = inject(DOCUMENT);
  const route = signal<Route>(parse(doc.location.hash));
  const onHash = () => route.set(parse(doc.location.hash));
  doc.defaultView?.addEventListener('hashchange', onHash);
  return { route };
}
