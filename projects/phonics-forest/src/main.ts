// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Bootstrap: fonts (self-hosted @fontsource — latin + latin-ext + vietnamese
// per repo font policy), styles, then content → app. Failures render a
// friendly ranger message — never a white screen.

// Fraunces — storybook display serif (latin + vietnamese keep the repo-wide
// font gate green; latin-ext unused by headings is intentionally omitted).
import '@fontsource/fraunces/latin-600.css';
import '@fontsource/fraunces/latin-900.css';
import '@fontsource/fraunces/vietnamese-600.css';
import '@fontsource/fraunces/vietnamese-900.css';
// Andika — SIL beginning-reader font: graphemes, IPA (full coverage), UI text.
import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-700.css';
import '@fontsource/andika/latin-ext-400.css';
import '@fontsource/andika/latin-ext-700.css';
import '@fontsource/andika/vietnamese-400.css';
import '@fontsource/andika/vietnamese-700.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';

import { loadPhonics } from './lib/data';
import { mountApp } from './app';
import { h } from './lib/dom';

async function boot(): Promise<void> {
  const root = document.getElementById('root');
  if (!root) return;
  try {
    const data = await loadPhonics();
    mountApp(root, data);
  } catch (err) {
    const message = (err as Error).message || 'Something went wrong.';
    root.replaceChildren(
      h(
        'div',
        { class: 'boot-error', role: 'alert' },
        h('h1', { text: 'The ranger could not open the forest' }),
        h('p', { text: message }),
        h('button', {
          class: 'caption-btn caption-btn-primary',
          text: 'Try again',
        }),
      ),
    );
    const btn = root.querySelector('button');
    btn?.addEventListener('click', () => location.reload());
  }
}

void boot();
