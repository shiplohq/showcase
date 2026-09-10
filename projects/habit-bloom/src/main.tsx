// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Bundled local fonts (OFL) — no runtime font CDN (repository font policy).
// `latin` carries base letters + digits; `latin-ext`/`vietnamese` carry the
// extended ranges (user-typed habit names may carry Vietnamese diacritics —
// Lora/Raleway cover them; Fragment Mono is app-copy only, latin/latin-ext).
// unicode-range lets the browser load each file only for the codepoints it
// covers (pilot #01: importing a language subset WITHOUT latin breaks every
// numeral onto the system fallback — never do that).
import '@fontsource/lora/latin-400.css';
import '@fontsource/lora/latin-500.css';
import '@fontsource/lora/latin-600.css';
import '@fontsource/lora/latin-700.css';
import '@fontsource/lora/latin-400-italic.css';
import '@fontsource/lora/latin-600-italic.css';
import '@fontsource/lora/latin-ext-400.css';
import '@fontsource/lora/latin-ext-600.css';
import '@fontsource/lora/vietnamese-400.css';
import '@fontsource/lora/vietnamese-600.css';
import '@fontsource/raleway/latin-400.css';
import '@fontsource/raleway/latin-500.css';
import '@fontsource/raleway/latin-600.css';
import '@fontsource/raleway/latin-700.css';
import '@fontsource/raleway/latin-ext-400.css';
import '@fontsource/raleway/latin-ext-600.css';
import '@fontsource/raleway/vietnamese-400.css';
import '@fontsource/raleway/vietnamese-600.css';
import '@fontsource/fragment-mono/latin-400.css';
import '@fontsource/fragment-mono/latin-400-italic.css';
import '@fontsource/fragment-mono/latin-ext-400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
