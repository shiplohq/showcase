// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Fonts — BOTH latin and vietnamese subset css per weight (pilot #01 rule:
// language-only subsets leave base letters and numerals on system fallback).
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-600.css';
import '@fontsource/space-grotesk/latin-700.css';
import '@fontsource/space-grotesk/latin-ext-500.css';
import '@fontsource/space-grotesk/latin-ext-600.css';
import '@fontsource/space-grotesk/latin-ext-700.css';
import '@fontsource/space-grotesk/vietnamese-500.css';
import '@fontsource/space-grotesk/vietnamese-600.css';
import '@fontsource/space-grotesk/vietnamese-700.css';
import '@fontsource/work-sans/latin-400.css';
import '@fontsource/work-sans/latin-500.css';
import '@fontsource/work-sans/latin-600.css';
import '@fontsource/work-sans/latin-ext-400.css';
import '@fontsource/work-sans/latin-ext-500.css';
import '@fontsource/work-sans/latin-ext-600.css';
import '@fontsource/work-sans/vietnamese-400.css';
import '@fontsource/work-sans/vietnamese-500.css';
import '@fontsource/work-sans/vietnamese-600.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('#root missing in index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
