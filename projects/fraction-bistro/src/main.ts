// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { createApp } from 'vue';
// Bundled local fonts (OFL) — no runtime font CDN (repository font policy).
// BOTH subsets imported for every weight (pilot #01 lesson): `latin` carries
// base letters + digits, `vietnamese` carries the diacritic glyphs. A
// language-only subset leaves every numeral on the system fallback font.
import '@fontsource/fraunces/latin-600.css';
import '@fontsource/fraunces/vietnamese-600.css';
import '@fontsource/fraunces/latin-600-italic.css';
import '@fontsource/fraunces/vietnamese-600-italic.css';
import '@fontsource/fraunces/latin-900.css';
import '@fontsource/fraunces/vietnamese-900.css';
import '@fontsource/source-sans-3/latin-400.css';
import '@fontsource/source-sans-3/vietnamese-400.css';
import '@fontsource/source-sans-3/latin-600.css';
import '@fontsource/source-sans-3/vietnamese-600.css';
import '@fontsource/source-sans-3/latin-700.css';
import '@fontsource/source-sans-3/vietnamese-700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import App from './App.vue';

createApp(App).mount('#app');
