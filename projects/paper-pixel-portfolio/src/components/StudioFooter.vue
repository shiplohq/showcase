<script setup lang="ts">
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Colophon — contact mailto, fictional address, provenance note.

import type { Studio } from '../lib/types';

defineProps<{ studio: Studio }>();

const year = '2026';
</script>

<template>
  <footer class="colophon">
    <div class="shell colophon__inner">
      <div>
        <p class="meta meta--soft">Enquiries</p>
        <p>
          <a :href="`mailto:${studio.contact.email}`">{{ studio.contact.email }}</a>
        </p>
      </div>
      <p class="meta meta--faint colophon__note">
        {{ studio.name }} is a fictional studio. A Shiplo Showcase project — static site, local
        data, no backend. Set in Fraunces &amp; Archivo Narrow.
      </p>
      <p class="meta meta--faint">© {{ year }} — printed from {{ studio.name }}</p>
    </div>
  </footer>
</template>
