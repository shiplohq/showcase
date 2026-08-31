// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Bundled local fonts (OFL) — no runtime font CDN (repository font policy).
// BOTH subsets are required: `latin` carries base letters + digits,
// `vietnamese` carries the diacritic glyphs. unicode-range lets the browser
// use each file only for the codepoints it covers — importing vietnamese
// alone left every numeral/base letter on the system fallback (broken mix).
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/baloo-2/vietnamese-600.css';
import '@fontsource/baloo-2/vietnamese-700.css';
import '@fontsource/baloo-2/vietnamese-800.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/vietnamese-400.css';
import '@fontsource/nunito/vietnamese-600.css';
import '@fontsource/nunito/vietnamese-700.css';
import '@fontsource/nunito/vietnamese-800.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
