// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Biome select — the field-guide cover: two expedition plates, progress,
// model notes. Species and rules all come from the JSON content.

import { h } from '../lib/dom.ts';
import { icon, miniSceneResponsive, speciesChip } from '../components/art.ts';
import { openModelNotes } from '../components/notes.ts';
import type { EcoData } from '../lib/data.ts';
import type { Progress } from '../lib/storage.ts';

export interface BiomesScreenOpts {
  data: EcoData;
  progress: Progress;
  onOpenBiome: (biomeId: string) => void;
  onResetProgress: () => void;
}

export function createBiomesScreen(opts: BiomesScreenOpts): HTMLElement {
  const { data, progress, onOpenBiome, onResetProgress } = opts;

  const plates = h(
    'section',
    { class: 'biome-plates', 'aria-label': 'Choose a field study' },
    ...data.biomes.map((biome) => {
      const challengesForBiome = data.challenges.filter((c) => c.biomeId === biome.id);
      const doneCount = challengesForBiome.filter((c) => progress.done.includes(c.id)).length;

      const plate = h(
        'article',
        { class: 'biome-plate' },
        h('div', { class: 'plate-art' }, miniSceneResponsive(biome)),
        h(
          'div',
          { class: 'plate-body' },
          h('h2', { text: biome.name }),
          h('p', { class: 'plate-tagline', text: biome.tagline }),
          h(
            'ul',
            { class: 'species-strip' },
            ...biome.species.map((sp) =>
              h(
                'li',
                {},
                h('span', { class: 'chip' }, speciesChip(sp, 22)),
                h('span', { text: sp.label }),
                h('span', { class: 'count', text: String(sp.initialPopulation) }),
              ),
            ),
          ),
          h('p', { class: 'plate-habitat', text: biome.habitatNote }),
          h(
            'div',
            { class: 'plate-foot' },
            h(
              'p',
              { class: 'progress-note' },
              doneCount > 0
                ? `${doneCount} of ${challengesForBiome.length} assignments complete`
                : `${challengesForBiome.length} field assignments`,
            ),
            h(
              'button',
              { class: 'btn btn-primary', type: 'button' },
              icon('book', 18),
              `Open ${biome.name}`,
            ),
          ),
        ),
      );

      plate.querySelector('.btn-primary')?.addEventListener('click', () => onOpenBiome(biome.id));
      return plate;
    }),
  );

  const notesBtn = h('button', { class: 'btn btn-quiet', type: 'button' }, icon('notes', 16), 'Model notes');
  notesBtn.addEventListener('click', () => openModelNotes(null));

  const resetBtn = h('button', { class: 'btn btn-quiet', type: 'button' }, icon('reset', 16), 'Reset saved data');
  let armed = false;
  let disarmTimer: number | undefined;
  resetBtn.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      resetBtn.replaceChildren(icon('reset', 16), 'Tap again to erase');
      resetBtn.setAttribute('aria-label', 'Erase saved progress — tap again within four seconds to confirm');
      disarmTimer = window.setTimeout(() => {
        armed = false;
        resetBtn.replaceChildren(icon('reset', 16), 'Reset saved data');
      }, 4000);
      return;
    }
    window.clearTimeout(disarmTimer);
    onResetProgress();
    root.replaceWith(createBiomesScreen({ ...opts, progress: { done: [] } }));
  });

  const root = h(
    'main',
    { class: 'screen screen-biomes', 'aria-label': 'EcoBalance field studies' },
    h(
      'div',
      { class: 'guide-inner' },
      h(
        'header',
        { class: 'guide-head' },
        h('p', { class: 'kicker', text: 'Shiplo Field Studies · No. 13' }),
        h('h1', { text: 'EcoBalance' }),
        h('p', {
          class: 'lede',
          text:
            'Open a diorama, raise and lower its populations, and watch simple, transparent rules play out season by season. Every number you see has a cause written beside it.',
        }),
      ),
      h('div', { class: 'guide-rule' }),
      plates,
      h(
        'footer',
        { class: 'guide-foot' },
        notesBtn,
        resetBtn,
        h('span', {
          text:
            'Progress is saved anonymously on this device only. A simple teaching model — not a scientific forecast.',
        }),
      ),
    ),
  );

  return root;
}
