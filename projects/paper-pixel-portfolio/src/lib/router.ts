// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Hash router — single-page state, no history-API server fallback needed
// (spec static-hosting rules: prefer hash routing for static samples).

export type Route =
  | { view: 'index' }
  | { view: 'case'; slug: string }
  | { view: 'studio' }
  | { view: 'contact' }
  | { view: 'not-found'; path: string };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#/, '');
  const path = clean.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '') return { view: 'index' };
  const segs = path.split('/').filter(Boolean);
  if (segs.length === 1 && segs[0] === 'studio') return { view: 'studio' };
  if (segs.length === 1 && segs[0] === 'contact') return { view: 'contact' };
  if (segs.length === 2 && segs[0] === 'work') return { view: 'case', slug: segs[1] };
  return { view: 'not-found', path };
}

export function routeHash(route: Route): string {
  switch (route.view) {
    case 'index':
      return '#/';
    case 'studio':
      return '#/studio';
    case 'contact':
      return '#/contact';
    case 'case':
      return `#/work/${route.slug}`;
    default:
      return '#/';
  }
}
