<script setup lang="ts">
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Contact — mailto only, no form, no backend (spec IA). The ledger carries
// availability and the fictional reading-room details.

import type { Studio } from '../../lib/types';

defineProps<{ studio: Studio }>();
</script>

<template>
  <section aria-labelledby="contact-title">
    <header class="page-head">
      <p class="meta meta--soft">Commissions &amp; enquiries</p>
      <h1 id="contact-title" class="type-rise">
        <span class="type-rise__inner">Write to the studio</span>
      </h1>
    </header>

    <div class="contact-grid">
      <div v-reveal>
        <p class="case-section__copy">{{ studio.contact.prompt }}</p>
        <p style="margin-top: 1.5rem">
          <a :href="`mailto:${studio.contact.email}?subject=${encodeURIComponent(
            `Commission enquiry — ${studio.name}`,
          )}`">{{ studio.contact.email }}</a>
        </p>
        <p class="meta meta--soft" style="margin-top: 1.2rem">
          {{ studio.contact.availability }}
        </p>
      </div>

      <dl class="specs contact-ledger" v-reveal>
        <div v-for="h in studio.contact.handles" :key="h.label" class="specs__row">
          <dt class="meta meta--soft">{{ h.label }}</dt>
          <dd>{{ h.value }}</dd>
        </div>
        <div class="specs__row">
          <dt class="meta meta--soft">Address</dt>
          <dd>{{ studio.contact.address }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
