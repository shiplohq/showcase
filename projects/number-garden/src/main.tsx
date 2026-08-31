// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Bundled local fonts (OFL) — subsets limited to what the UI needs; no
// runtime font CDN (repository font policy).
import '@fontsource/baloo-2/vietnamese-600.css';
import '@fontsource/baloo-2/vietnamese-700.css';
import '@fontsource/baloo-2/vietnamese-800.css';
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
