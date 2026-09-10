<script setup lang="ts">
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// App shell: hash routing (single-page state), content-state loading, the
// shared-element Flip between index plates and case heroes, Esc-to-index with
// focus return, and the html[data-motion] kill switch for the CSS layer.

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import StudioHeader from './components/StudioHeader.vue';
import StudioFooter from './components/StudioFooter.vue';
import IndexScreen from './features/index/IndexScreen.vue';
import CaseScreen from './features/case/CaseScreen.vue';
import StudioScreen from './features/studio/StudioScreen.vue';
import ContactScreen from './features/contact/ContactScreen.vue';
import { ContentError, loadContent } from './lib/data';
import type { Content } from './lib/types';
import { parseHash } from './lib/router';
import type { Route } from './lib/router';
import { Flip, motionReduced, onMotionChange } from './lib/gsap';
import { gsap } from './lib/gsap';

const route = ref<Route>(parseHash(typeof window === 'undefined' ? '' : window.location.hash));
const content = ref<Content | null>(null);
const fault = ref<string | null>(null);

function onHash(): void {
  route.value = parseHash(window.location.hash);
}

onMounted(() => {
  window.addEventListener('hashchange', onHash);
  window.addEventListener('keydown', onKey);
  loadContent()
    .then((c) => {
      content.value = c;
    })
    .catch((err: unknown) => {
      fault.value =
        err instanceof ContentError
          ? err.message
          : 'The studio files could not be read. Try reloading the page.';
    });
});

onUnmounted(() => {
  window.removeEventListener('hashchange', onHash);
  window.removeEventListener('keydown', onKey);
});

/* ---- Motion kill switch (CSS layer mirrors the GSAP decision) -------------- */

function syncMotionAttr(): void {
  document.documentElement.dataset.motion = motionReduced() ? 'off' : 'on';
}

onMounted(() => {
  syncMotionAttr();
  onMotionChange(syncMotionAttr);
});

/* ---- Routing helpers -------------------------------------------------------- */

const activeCase = computed(() => {
  const r = route.value;
  const c = content.value;
  if (r.view !== 'case' || !c) return null;
  const slug = r.slug;
  return c.projects.find((p) => p.slug === slug) ?? null;
});

let flipState: Flip.FlipState | null = null;
let lastCaseSlug: string | null = null;

/** Prefer the visible preview plate; fall back to a rendered inline crop. */
function sourcePlateFor(slug: string): HTMLElement | null {
  const preview = document.querySelector<HTMLElement>(
    `.preview-frame__plate[data-slug="${CSS.escape(slug)}"]`,
  );
  if (preview && preview.offsetWidth > 0) return preview;
  const inline = document.querySelector<HTMLElement>(
    `.index-row__inline[data-slug="${CSS.escape(slug)}"]`,
  );
  if (inline && inline.offsetWidth > 0) return inline;
  return null;
}

watch(route, (next, prev) => {
  // Capture the shared element BEFORE the index unmounts (DOM is still old here).
  flipState = null;
  const caseSlug = next.view === 'case' ? next.slug : null;
  if (caseSlug && prev?.view === 'index' && !motionReduced()) {
    const src = sourcePlateFor(caseSlug);
    if (src) flipState = Flip.getState(src);
  }

  void nextTick(() => {
    if (next.view !== 'index' || prev?.view === 'index') window.scrollTo({ top: 0, behavior: 'auto' });
    if (caseSlug) {
      lastCaseSlug = caseSlug;
      const hero = document.querySelector<HTMLElement>(
        `.case-hero__plate[data-slug="${CSS.escape(caseSlug)}"]`,
      );
      if (flipState && hero) {
        Flip.from(flipState, {
          targets: hero,
          duration: 0.48,
          ease: 'power3.inOut',
          absolute: true,
          zIndex: 5,
        });
      } else if (hero) {
        // No shared element (deep link, motion off) — quiet plate entrance.
        gsap.fromTo(
          hero,
          { opacity: 0.2 },
          { opacity: 1, duration: motionReduced() ? 0 : 0.4, ease: 'power2.out' },
        );
      }
    } else if (next.view === 'index' && prev?.view === 'case' && lastCaseSlug) {
      // Esc/back returned to the index — hand focus back to the originating row.
      const row = document.querySelector<HTMLElement>(
        `.index-row[data-slug="${CSS.escape(lastCaseSlug)}"]`,
      );
      row?.focus();
      lastCaseSlug = null;
    }
  });
});

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && route.value.view === 'case') {
    window.location.hash = '#/';
  }
}

/* ---- Loading / fault shells -------------------------------------------------- */

const loading = computed(() => !content.value && !fault.value);
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <StudioHeader v-if="content" :studio="content.studio" :route="route" />

  <main id="main" class="shell" tabindex="-1">
    <div v-if="fault" class="fault" role="alert">
      <p class="meta meta--soft fault__code">Reading error</p>
      <h1>The index cannot be opened</h1>
      <p>{{ fault }}</p>
      <p>
        <a href="./">Reload the studio files</a> or return to the
        <a href="#/">index</a>.
      </p>
    </div>

    <div v-else-if="loading" class="fault" aria-busy="true">
      <p class="meta meta--soft">Opening the index…</p>
    </div>

    <template v-else-if="content">
      <IndexScreen
        v-if="route.view === 'index'"
        :studio="content.studio"
        :projects="content.projects"
      />
      <CaseScreen
        v-else-if="activeCase"
        :key="activeCase.slug"
        :project="activeCase"
        :index="content.projects.indexOf(activeCase)"
        :total="content.projects.length"
        :next="content.projects[(content.projects.indexOf(activeCase) + 1) % content.projects.length]"
      />
      <StudioScreen v-else-if="route.view === 'studio'" :studio="content.studio" />
      <ContactScreen v-else-if="route.view === 'contact'" :studio="content.studio" />
      <div v-else-if="route.view === 'case'" class="fault" role="region" aria-label="Work not found">
        <p class="meta meta--soft fault__code">Unfiled work</p>
        <h1>This case is not in the index</h1>
        <p>
          No work is filed under <code>#/work/{{ route.view === 'case' ? route.slug : '' }}</code
          >. Return to the <a href="#/">studio index</a>.
        </p>
      </div>
      <div v-else class="fault" role="region" aria-label="Page not found">
        <p class="meta meta--soft fault__code">404 — unfiled</p>
        <h1>This page is not in the index</h1>
        <p>
          The address has no entry. Return to the <a href="#/">studio index</a>.
        </p>
      </div>
    </template>
  </main>

  <StudioFooter v-if="content" :studio="content.studio" />
</template>
