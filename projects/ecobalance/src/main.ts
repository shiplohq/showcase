// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// EcoBalance entry point. Fonts first (all three IBM Plex subsets per the
// repo font policy), then styles, then the app.

// IBM Plex Serif — display (600, 700)
import '@fontsource/ibm-plex-serif/latin-600.css';
import '@fontsource/ibm-plex-serif/latin-ext-600.css';
import '@fontsource/ibm-plex-serif/vietnamese-600.css';
import '@fontsource/ibm-plex-serif/latin-700.css';
import '@fontsource/ibm-plex-serif/latin-ext-700.css';
import '@fontsource/ibm-plex-serif/vietnamese-700.css';
// IBM Plex Sans — body/UI (400, 600, 700)
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-ext-400.css';
import '@fontsource/ibm-plex-sans/vietnamese-400.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-sans/latin-ext-600.css';
import '@fontsource/ibm-plex-sans/vietnamese-600.css';
import '@fontsource/ibm-plex-sans/latin-700.css';
import '@fontsource/ibm-plex-sans/latin-ext-700.css';
import '@fontsource/ibm-plex-sans/vietnamese-700.css';
// IBM Plex Mono — data (400, 500, 600)
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-ext-400.css';
import '@fontsource/ibm-plex-mono/vietnamese-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-ext-500.css';
import '@fontsource/ibm-plex-mono/vietnamese-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-ext-600.css';
import '@fontsource/ibm-plex-mono/vietnamese-600.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';

import { mountApp } from './app.ts';

// Eagerly load every bundled face: several weights (Serif 600, Sans 700,
// Mono 600) first render on inner screens — without this, a font check run
// against the landing screen would report them as fallback.
const BUNDLED_FACES: Array<[string, string[]]> = [
  ['IBM Plex Serif', ['600', '700']],
  ['IBM Plex Sans', ['400', '600', '700']],
  ['IBM Plex Mono', ['400', '500', '600']],
];
for (const [family, weights] of BUNDLED_FACES) {
  for (const weight of weights) {
    void document.fonts.load(`${weight} 16px '${family}'`);
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  void mountApp(rootEl);
}
