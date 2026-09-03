// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Entry: fonts (latin subsets — UI copy is English), styles, app mount.
// Every imported face is used by visible UI (unused faces never load in a
// static build and trip the document.fonts.check gate).

import '@fontsource/source-serif-4/latin-600.css';
import '@fontsource/work-sans/latin-400.css';
import '@fontsource/work-sans/latin-500.css';
import '@fontsource/work-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
