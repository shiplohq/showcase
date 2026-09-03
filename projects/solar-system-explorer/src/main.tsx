// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { createRoot } from 'react-dom/client';

// Fonts bundled via @fontsource — latin AND vietnamese subsets (pilot #01
// lesson: missing latin subsets drop letters and digits to the system font;
// vietnamese keeps the gate green for localized copy). No runtime CDN.
import '@fontsource/gentium-book-plus/latin-400.css';
import '@fontsource/gentium-book-plus/latin-400-italic.css';
import '@fontsource/gentium-book-plus/latin-700.css';
import '@fontsource/gentium-book-plus/latin-ext-400.css';
import '@fontsource/gentium-book-plus/latin-ext-400-italic.css';
import '@fontsource/gentium-book-plus/latin-ext-700.css';
import '@fontsource/gentium-book-plus/vietnamese-400.css';
import '@fontsource/gentium-book-plus/vietnamese-400-italic.css';
import '@fontsource/gentium-book-plus/vietnamese-700.css';
import '@fontsource/space-mono/latin-400.css';
import '@fontsource/space-mono/latin-700.css';
import '@fontsource/space-mono/latin-ext-400.css';
import '@fontsource/space-mono/latin-ext-700.css';
import '@fontsource/space-mono/vietnamese-400.css';
import '@fontsource/space-mono/vietnamese-700.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';

import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
