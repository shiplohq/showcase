// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Bundled local fonts (OFL) — no runtime font CDN (repository font policy).
// `latin` carries base letters + digits; `latin-ext`/`vietnamese` carry the
// extended ranges. unicode-range lets the browser load each file only for the
// codepoints it covers (pilot #01: importing a language subset WITHOUT latin
// breaks every numeral onto the system fallback — never do that).
import '@fontsource/archivo/latin-400.css';
import '@fontsource/archivo/latin-600.css';
import '@fontsource/archivo/latin-700.css';
import '@fontsource/archivo/latin-800.css';
import '@fontsource/archivo/latin-ext-400.css';
import '@fontsource/archivo/latin-ext-700.css';
import '@fontsource/archivo/vietnamese-400.css';
import '@fontsource/archivo/vietnamese-700.css';
import '@fontsource/spline-sans-mono/latin-400.css';
import '@fontsource/spline-sans-mono/latin-500.css';
import '@fontsource/spline-sans-mono/latin-600.css';
import '@fontsource/spline-sans-mono/latin-ext-400.css';
import '@fontsource/spline-sans-mono/latin-ext-500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
