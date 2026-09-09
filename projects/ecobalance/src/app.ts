// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// App shell — single-page state routing between the biome cover and the
// field desk (no history router: static-host friendly per the spec).

import { h, moveFocus } from './lib/dom.ts';
import { loadEcoData, type EcoData } from './lib/data.ts';
import { clearProgress, loadProgress, saveProgress, type Progress } from './lib/storage.ts';
import { createBiomesScreen } from './screens/biomes.ts';
import { createSimScreen } from './screens/sim.ts';

export async function mountApp(root: HTMLElement): Promise<void> {
  let progress: Progress = loadProgress();

  let data: EcoData;
  try {
    const result = await loadEcoData();
    if (!result.data) {
      root.append(errorPanel(result.issues));
      return;
    }
    data = result.data;
  } catch (err) {
    root.append(
      errorPanel([
        { message: err instanceof Error ? err.message : 'The data files could not be read from this location.' },
      ]),
    );
    return;
  }

  let current: { root: HTMLElement; destroy?: () => void } | null = null;

  function show(node: { root: HTMLElement; destroy?: () => void }): void {
    current?.destroy?.();
    current?.root.remove();
    current = node;
    main.replaceChildren(node.root);
    moveFocus(node.root);
  }

  function openBiomes(): void {
    show({
      root: createBiomesScreen({
        data,
        progress,
        onOpenBiome: (biomeId) => openSim(biomeId),
        onResetProgress: () => {
          progress = clearProgress();
        },
      }),
    });
  }

  function openSim(biomeId: string, challengeId?: string): void {
    progress = { ...progress, lastBiome: biomeId };
    saveProgress(progress);
    show(
      createSimScreen({
        data,
        progress,
        saveProgress: (p) => {
          progress = p;
          saveProgress(p);
        },
        onExit: openBiomes,
        biomeId,
        startChallengeId: challengeId,
      }),
    );
  }

  // A skip link gives keyboard users a fast path to the screen content.
  root.append(h('a', { class: 'skip-link', href: '#main-content' }, 'Skip to the field study'));
  const main = h('div', { id: 'main-content', style: 'display:contents' });
  root.append(main);

  openBiomes();
  const firstHeading = main.querySelector('h1') as HTMLElement | null;
  if (firstHeading) moveFocus(firstHeading);
}

function errorPanel(issues: { message: string }[]): HTMLElement {
  const reload = h('button', { class: 'btn btn-primary', type: 'button' }, 'Reload');
  reload.addEventListener('click', () => window.location.reload());
  return h(
    'div',
    { class: 'error-panel', role: 'alert' },
    h('h1', { text: 'The field data did not load' }),
    h('p', {
      text: 'The study needs its local JSON files (data/biomes.json, data/challenges.json). They could not be read or did not pass validation:',
    }),
    h('ul', {}, ...issues.slice(0, 6).map((i) => h('li', { text: i.message }))),
    reload,
  );
}
