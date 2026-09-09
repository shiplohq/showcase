// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// "Model notes" dialog — the transparent-rules panel the spec requires
// ("Rule model được mô tả trong UI"). Generated from the JSON content:
// biome rules + per-species rule notes + the model caveat.

import { h } from '../lib/dom.ts';
import { icon, speciesChip } from './art.ts';
import type { BiomeDef } from '../engine/types.ts';

export function openModelNotes(biome: BiomeDef | null, onClose?: () => void): HTMLDialogElement {
  const dlg = document.createElement('dialog');
  dlg.className = 'notes';
  dlg.setAttribute('aria-label', 'Model notes');

  const close = h('button', { class: 'btn btn-quiet', type: 'button', 'aria-label': 'Close model notes' }, icon('close', 18));
  close.addEventListener('click', () => dlg.close());

  const head = h('div', { class: 'notes-head' }, h('h2', { text: 'Model notes' }), close);
  const body = h('div', { class: 'notes-body' });

  if (biome) {
    body.append(h('h3', { text: `How ${biome.name} works` }));
    body.append(h('ul', {}, ...biome.rules.map((r) => h('li', { text: r }))));
    for (const sp of biome.species) {
      const row = h('div', {}, speciesChip(sp, 30), h('b', { text: sp.label }));
      row.style.cssText = 'display:flex;align-items:center;gap:10px';
      body.append(row);
      body.append(h('ul', {}, ...sp.notes.map((n) => h('li', { text: n }))));
    }
  } else {
    body.append(
      h('p', {
        text:
          'Every population moves in whole numbers, one season at a time. Producers grow back toward what the habitat can carry; consumers eat, multiply when well fed, and starve when food is scarce. Nothing is hidden — each season the field notes list every cause of change.',
      }),
    );
  }

  body.append(
    h('p', {
      class: 'notes-caveat',
      text:
        'A simple teaching model — not a scientific forecast. Real ecosystems hold thousands of species and connections; this diorama keeps four so the rules stay visible.',
    }),
  );

  dlg.append(head, body);
  dlg.addEventListener('close', () => onClose?.());
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}
