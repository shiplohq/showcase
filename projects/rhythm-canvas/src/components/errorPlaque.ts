// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Error plaque — data load/validation failures degrade to a poster-styled
// notice instead of a white screen (spec: runtime errors must degrade
// clearly). App chrome stays hidden.

import type { AppCopy } from '../lib/types';

export function showErrorPlaque(
  el: HTMLElement,
  copy: Pick<AppCopy, 'errorTitle' | 'errorBody'>,
  error: string,
  issues: string[],
): void {
  const detail = issues.length > 0 ? `<pre class="plaque-issues mono">${escapeHtml(issues.slice(0, 6).join('\n'))}</pre>` : '';
  el.innerHTML = `
    <div class="plaque">
      <p class="plaque-kicker mono">SHOWCASE #17 — DATA FAULT</p>
      <h1>${escapeHtml(copy.errorTitle)}</h1>
      <p>${escapeHtml(copy.errorBody)}</p>
      <p class="plaque-err mono">${escapeHtml(error)}</p>
      ${detail}
    </div>`;
  el.hidden = false;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}
