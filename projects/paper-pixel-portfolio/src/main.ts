// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Entry — fonts first (Fontsource local bundles, latin only: the UI carries no
// Vietnamese diacritics; fallback stacks live in tokens.css), then styles,
// then the app.

import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource/archivo-narrow/latin-400.css';
import '@fontsource/archivo-narrow/latin-500.css';
import '@fontsource/archivo-narrow/latin-700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';

import { createApp } from 'vue';
import App from './App.vue';
import { vReveal } from './lib/reveal';

createApp(App).directive('reveal', vReveal).mount('#app');
