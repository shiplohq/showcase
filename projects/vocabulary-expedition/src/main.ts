// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Entry — fonts first, explicit subsets (pilot #01 lesson: never a single
// subset; latin is mandatory alongside any language subset):
//   Andika  → latin (base letters+digits) + latin-ext (IPA respellings like
//             /ˈsəʊ.fə/) + vietnamese (translations layer), weights 400/700
//   Caveat  → latin 700 only (journal headings are English-only by design —
//             the package ships no vietnamese subset, so VI text uses Andika)
// then styles, then the app.

import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-700.css';
import '@fontsource/andika/latin-ext-400.css';
import '@fontsource/andika/latin-ext-700.css';
import '@fontsource/andika/vietnamese-400.css';
import '@fontsource/andika/vietnamese-700.css';
import '@fontsource/caveat/latin-700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';

import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
