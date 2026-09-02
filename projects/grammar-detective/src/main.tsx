// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Bundled local fonts (OFL) — no runtime font CDN (repository font policy).
// The UI ships English only, so `latin` + `latin-ext` subsets carry every
// glyph we render. Both subsets import per family: latin carries base
// letters + digits, latin-ext broadens coverage (pilot #01 lesson: never
// rely on a single subset).
import '@fontsource/fraunces/latin-700.css';
import '@fontsource/fraunces/latin-900.css';
import '@fontsource/fraunces/latin-ext-700.css';
import '@fontsource/fraunces/latin-ext-900.css';
import '@fontsource/atkinson-hyperlegible/latin-400.css';
import '@fontsource/atkinson-hyperlegible/latin-700.css';
import '@fontsource/atkinson-hyperlegible/latin-ext-400.css';
import '@fontsource/atkinson-hyperlegible/latin-ext-700.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-ext-400.css';
import '@fontsource/ibm-plex-mono/latin-ext-500.css';
import '@fontsource/ibm-plex-mono/latin-ext-600.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';

import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
