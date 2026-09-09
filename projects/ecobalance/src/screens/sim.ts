// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// The field desk: diorama plate (left) + field-notebook ledger (right).
// Core loop first, motion second — every dynamic number is real text
// (populations, trends, causes), and every control is a native button or
// range input so mouse, touch and keyboard all drive the same actions.

import { h, svgEl, clear, moveFocus } from '../lib/dom.ts';
import {
  icon,
  trendChip,
  speciesChip,
  sceneFor,
  positionedToken,
  speciesColor,
  SCENE_W,
  SCENE_H,
  ZONES,
  visualCount,
  tokenAnchor,
} from '../components/art.ts';
import { openModelNotes } from '../components/notes.ts';
import { buildDebrief } from './debrief.ts';
import { bannerIn, drawLine, fadeIn, fadeOutRemove, pulseRow, prefersReducedMotion } from '../lib/gsap.ts';
import {
  createSim,
  setPlan,
  stepSim,
  trendOf,
  MAX_PLAN,
} from '../engine/sim.ts';
import { startChallenge, stepChallenge } from '../engine/challenge.ts';
import type { Cause, ChallengeDef, SimState, SpeciesDef } from '../engine/types.ts';
import type { EcoData } from '../lib/data.ts';
import type { Progress } from '../lib/storage.ts';

const FREE_SEED = 7;
const PLAY_INTERVAL_MS = 1400;

export interface SimScreenOpts {
  data: EcoData;
  progress: Progress;
  saveProgress: (p: Progress) => void;
  onExit: () => void;
  biomeId: string;
  startChallengeId?: string;
}

interface RowRefs {
  row: HTMLElement;
  pop: HTMLElement;
  cause: HTMLElement;
  trend: HTMLElement;
  slider: HTMLInputElement;
  chip: HTMLElement;
}

export function createSimScreen(opts: SimScreenOpts): { root: HTMLElement; destroy: () => void } {
  const { data, progress, saveProgress, onExit } = opts;
  const biome = data.biomes.find((b) => b.id === opts.biomeId) ?? data.biomes[0];

  // -- state ---------------------------------------------------------------
  let sim = createSim(biome, FREE_SEED);
  let challenge: ReturnType<typeof startChallenge> | null = null;
  let playing = false;
  let playTimer: number | null = null;
  let webOn = false;
  let bannerUntil = -1;
  const rows = new Map<string, RowRefs>();
  const tokenGroups = new Map<string, SVGGElement>();
  const tagTexts = new Map<string, SVGTextElement>();

  // -- skeleton --------------------------------------------------------------
  const backBtn = h('button', { class: 'btn btn-quiet', type: 'button' }, icon('back', 16), 'Biomes');
  backBtn.addEventListener('click', onExit);

  const seasonLabel = h('span', { class: 'exp-season', text: 'Season 0' });

  const webBtn = h(
    'button',
    { class: 'btn', type: 'button', 'aria-pressed': 'false' },
    icon('web', 16),
    'Food web',
  );
  webBtn.addEventListener('click', () => {
    webOn = !webOn;
    webBtn.setAttribute('aria-pressed', String(webOn));
    webLayer.setAttribute('aria-hidden', String(!webOn));
    webLayer.style.display = webOn ? '' : 'none';
    if (webOn) redrawWeb(true);
  });

  const notesBtn = h('button', { class: 'btn', type: 'button' }, icon('notes', 16), 'Model notes');
  notesBtn.addEventListener('click', () => openModelNotes(biome));

  const chartBtn = h('button', { class: 'btn', type: 'button' }, icon('chart', 16), 'Field chart');
  chartBtn.addEventListener('click', () => openDebrief());

  const header = h(
    'header',
    { class: 'exp-label' },
    backBtn,
    h('div', { class: 'exp-title' }, h('h1', { text: biome.name }), seasonLabel),
    h('div', { class: 'exp-actions' }, webBtn, notesBtn, chartBtn),
  );

  // stage
  const stageSvg = svgEl('svg', {
    viewBox: `0 0 ${SCENE_W} ${SCENE_H}`,
    preserveAspectRatio: 'xMidYMid slice',
    'aria-hidden': 'true',
  });
  const tokenLayer = svgEl('g', { class: 'tokens' });
  const tagLayer = svgEl('g', { class: 'field-tags' });
  const webLayer = svgEl('g', { class: 'food-web', 'aria-hidden': 'true' });
  webLayer.style.display = 'none';
  stageSvg.append(sceneFor(biome.id), tokenLayer, tagLayer, webLayer);

  const eventBanner = h('div', { class: 'event-banner', role: 'status', hidden: true });
  const caption = h(
    'p',
    {},
    h('span', { class: 'cap-kicker', text: 'Field notes' }),
    h('span', { text: 'Season 0 — the study begins. Set your plans, then step one season.' }),
  );
  const captionText = caption.lastElementChild as HTMLElement;

  const stage = h('div', { class: 'stage' }, stageSvg, eventBanner);
  const plate = h(
    'section',
    { class: 'plate', 'aria-label': `${biome.name} diorama` },
    stage,
    h('div', { class: 'plate-caption' }, caption),
  );

  // ledger
  const ledger = h('div', { class: 'ledger', role: 'list' });
  for (const sp of biome.species) {
    ledger.append(buildRow(sp));
  }

  const stepBtn = h('button', { class: 'btn btn-primary btn-step', type: 'button' }, icon('step', 18), 'Step 1 season');
  const playBtn = h('button', { class: 'btn', type: 'button', 'aria-pressed': 'false' }, icon('play', 18), 'Play');
  const resetBtn = h('button', { class: 'btn', type: 'button' }, icon('reset', 18), 'Reset');
  let playSpeed = 1;
  const speedBtn = h('button', { class: 'btn', type: 'button', 'aria-label': 'Playback speed — cycles 1, 2 then 4 seasons per second' }, '1×');
  speedBtn.addEventListener('click', () => {
    playSpeed = playSpeed === 1 ? 2 : playSpeed === 2 ? 4 : 1;
    speedBtn.textContent = `${playSpeed}×`;
    if (playing) {
      stopPlay();
      startPlay();
    }
  });

  stepBtn.addEventListener('click', () => step());
  playBtn.addEventListener('click', () => togglePlay());
  resetBtn.addEventListener('click', () => resetAll());

  const ctrlStrip = h('div', { class: 'ctrl-strip' }, stepBtn, playBtn, resetBtn, speedBtn);

  const challengeSlot = h('section', { class: 'challenge-slot', 'aria-label': 'Field assignment' });

  const notebook = h(
    'section',
    { class: 'notebook', 'aria-label': 'Field notes' },
    h(
      'header',
      { class: 'nb-head' },
      h('h2', { text: 'Field notes' }),
      h('span', { class: 'nb-mode', text: 'Free study' }),
    ),
    ledger,
    ctrlStrip,
    challengeSlot,
  );
  const nbMode = notebook.querySelector('.nb-mode') as HTMLElement;

  const desk = h('div', { class: 'desk' }, plate, notebook);
  const root = h('main', { class: 'screen screen-sim' }, header, desk);

  const liveRegion = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });
  root.append(liveRegion);

  // -- rows ------------------------------------------------------------------
  function buildRow(sp: SpeciesDef): HTMLElement {
    const pop = h('span', { class: 'row-pop', text: String(sp.initialPopulation) });
    const trend = trendChip('steady');
    const dietBits = Object.keys(sp.diet?.prey ?? {})
      .map((preyId) => biome.species.find((s) => s.id === preyId)?.singular ?? preyId)
      .join(' and ');
    const initialCause =
      sp.trophic === 'plant'
        ? `carrying capacity ${sp.growth?.capacity ?? '—'} — what the soil can feed`
        : dietBits
          ? `eats ${dietBits}`
          : 'waiting for season 1';
    const cause = h('p', { class: 'row-cause', text: initialCause });

    const slider = h('input', {
      class: 'plan-slider',
      type: 'range',
      min: String(-MAX_PLAN),
      max: String(MAX_PLAN),
      step: '1',
      value: '0',
      'aria-label': `${sp.label} plan — remove up to ${MAX_PLAN} or release up to ${MAX_PLAN}, applied next season. Use arrow keys to change.`,
    }) as HTMLInputElement;

    const minus = h('button', {
      class: 'plan-step',
      type: 'button',
      'aria-label': `Plan to remove one ${sp.singular} next season`,
    }, '−');
    const plus = h('button', {
      class: 'plan-step',
      type: 'button',
      'aria-label': `Plan one more ${sp.singular} for next season`,
    }, '+');
    const chip = h('span', { class: 'plan-chip', text: 'no plan' });

    minus.addEventListener('click', () => setSlider(Number(slider.value) - 1));
    plus.addEventListener('click', () => setSlider(Number(slider.value) + 1));
    slider.addEventListener('input', () => applyPlan(Number(slider.value)));

    function setSlider(v: number) {
      const clamped = Math.max(-MAX_PLAN, Math.min(MAX_PLAN, v));
      slider.value = String(clamped);
      applyPlan(clamped);
    }
    function applyPlan(v: number) {
      const target = challenge ? challenge.sim : sim;
      const next = setPlan(target, sp.id, v);
      if (challenge) challenge = { ...challenge, sim: next };
      else sim = next;
      updatePlanChip(sp.id, v);
      updateValuetext(sp, v);
    }

    function updateValuetext(sp2: SpeciesDef, v: number): void {
      const verb = sp2.trophic === 'plant' ? (v > 0 ? 'sow' : 'mow') : v > 0 ? 'release' : 'remove';
      slider.setAttribute(
        'aria-valuetext',
        v === 0 ? 'no plan' : `${verb} ${Math.abs(v)} ${Math.abs(v) === 1 ? sp2.singular : sp2.label.toLowerCase()} next season`,
      );
    }
    updateValuetext(sp, 0);

    const planName = sp.trophic === 'plant' ? 'Sow / Mow' : 'Release / Remove';
    const row = h(
      'div',
      {
        class: 'ledger-row',
        role: 'listitem',
        tabindex: '0',
        'data-species': sp.id,
        'aria-label': `${sp.label} field entry — focus highlights its food-web links`,
      },
      h(
        'div',
        { class: 'row-id' },
        h('span', { class: 'row-chip' }, speciesChip(sp)),
        h('div', {}, h('p', { class: 'row-name', text: sp.label }), cause),
      ),
      h('div', { class: 'row-num' }, pop, trend),
      h(
        'div',
        { class: 'row-plan' },
        h('span', { class: 'plan-name', text: planName }),
        h('div', { class: 'plan-ctrl' }, minus, slider, plus),
        chip,
      ),
    );

    row.addEventListener('focus', () => highlightWeb(sp.id));
    row.addEventListener('blur', () => highlightWeb(null));
    rows.set(sp.id, { row, pop, cause, trend, slider, chip });
    return row;
  }

  /** Focus a ledger row → its food-web edges (if the overlay is on) come forward. */
  function highlightWeb(speciesId: string | null): void {
    if (!webOn) return;
    for (const path of webLayer.querySelectorAll('path[data-edge]')) {
      const hits =
        speciesId != null &&
        (path.getAttribute('data-pred') === speciesId || path.getAttribute('data-prey') === speciesId);
      path.classList.toggle('web-hit', hits);
      path.classList.toggle('web-dim', speciesId != null && !hits);
    }
  }

  /** During an assignment, out-of-range species carry a clay ink bar (saliency). */
  function markOut(row: HTMLElement, speciesId: string): void {
    const range = challenge?.challenge.targetRanges[speciesId];
    if (!range) {
      row.classList.remove('is-out');
      return;
    }
    const v = sim.populations[speciesId] ?? 0;
    row.classList.toggle('is-out', v < range[0] || v > range[1]);
  }

  function initialCauseOf(sp: SpeciesDef): string {
    const dietBits = Object.keys(sp.diet?.prey ?? {})
      .map((preyId) => biome.species.find((s) => s.id === preyId)?.singular ?? preyId)
      .join(' and ');
    return sp.trophic === 'plant'
      ? `carrying capacity ${sp.growth?.capacity ?? '—'} — what the soil can feed`
      : dietBits
        ? `eats ${dietBits}`
        : 'waiting for season 1';
  }

  function updatePlanChip(speciesId: string, v: number): void {
    const refs = rows.get(speciesId);
    if (!refs) return;
    const sp = biome.species.find((s) => s.id === speciesId);
    const unit = sp?.trophic === 'plant' ? (v > 0 ? 'sow' : 'mow') : v > 0 ? 'release' : 'remove';
    if (v === 0) {
      refs.chip.textContent = 'no plan';
      refs.chip.classList.remove('is-set');
    } else {
      refs.chip.textContent = `${v > 0 ? '+' : '−'}${Math.abs(v)} ${unit}`;
      refs.chip.classList.add('is-set');
    }
  }

  // -- tokens ------------------------------------------------------------------
  function renderTokens(animate = true): void {
    for (const sp of biome.species) {
      const zone = ZONES[biome.id]?.[sp.id];
      if (!zone) continue;
      let g = tokenGroups.get(sp.id);
      if (!g) {
        g = svgEl('g', { 'data-species': sp.id });
        tokenLayer.append(g);
        tokenGroups.set(sp.id, g);
      }
      const pop = sim.populations[sp.id] ?? 0;
      const count = visualCount(sp, pop);
      const current = g.children.length;
      if (count < current) {
        for (let i = current - 1; i >= count; i--) {
          const tok = g.children[i];
          if (animate && !prefersReducedMotion()) {
            fadeOutRemove(tok, g);
          } else {
            g.removeChild(tok);
          }
        }
      } else if (count > current) {
        for (let i = current; i < count; i++) {
          const a = tokenAnchor(zone, i, Math.max(count, 1), sim.seed + sim.season * 131);
          const tok = positionedToken(sp, zone, a);
          g.append(tok);
          if (animate && !prefersReducedMotion()) {
            (tok as unknown as HTMLElement).style.opacity = '0';
            fadeIn(tok, { y: -6, delay: Math.min(0.24, (i - current) * 0.02) });
          }
        }
      }
      // reposition existing tokens deterministically each season
      for (let i = 0; i < g.children.length; i++) {
        const a = tokenAnchor(zone, i, Math.max(g.children.length, 1), sim.seed + sim.season * 131);
        const tok = g.children[i] as SVGElement;
        const sc = (zone.size / 64) * a.scale;
        tok.setAttribute(
          'transform',
          `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) scale(${a.flip ? '-' : ''}${sc.toFixed(3)}) translate(-30 -34)`,
        );
      }
    }
    renderTags();
  }

  function renderTags(): void {
    // The stage SVG is `xMidYMid slice`: whenever the plate is narrower or
    // shorter than the 1000×620 scene, the outer margins of the scene are
    // cropped away. Tags anchor at their zone's left/top edge — at the scene
    // border — so clamp every tag into the guaranteed-visible window or it
    // renders half (or fully) off the plate.
    const box = stage.getBoundingClientRect();
    let safeL = 14;
    let safeR = SCENE_W - 14;
    let safeT = 30;
    let safeB = SCENE_H - 12;
    if (box.width > 2 && box.height > 2) {
      const scale = Math.max(box.width / SCENE_W, box.height / SCENE_H);
      const cropX = Math.max(0, (SCENE_W - box.width / scale) / 2);
      const cropY = Math.max(0, (SCENE_H - box.height / scale) / 2);
      safeL = Math.max(safeL, cropX + 10);
      safeR = Math.min(safeR, SCENE_W - cropX - 10);
      safeT = Math.max(safeT, cropY + 28);
      safeB = Math.min(safeB, SCENE_H - cropY - 12);
    }
    for (const sp of biome.species) {
      const zone = ZONES[biome.id]?.[sp.id];
      if (!zone) continue;
      const pop = sim.populations[sp.id] ?? 0;
      const shown = visualCount(sp, pop);
      const label = shown > 0 && shown < pop ? `${sp.label} ${pop} · ${shown} shown` : `${sp.label} ${pop}`;
      const estWidth = label.length * 9 + 16;
      let text = tagTexts.get(sp.id);
      if (!text) {
        const g = svgEl('g');
        const bg = svgEl('rect', {
          width: 0,
          height: 26,
          rx: 4,
          fill: 'var(--paper-raised)',
          stroke: 'var(--ink)',
          'stroke-width': 2,
        });
        const bar = svgEl('rect', {
          width: 0,
          height: 3,
          rx: 1.5,
          fill: speciesColor(sp.colorToken),
        });
        text = svgEl('text', {
          'font-family': 'var(--font-mono)',
          'font-size': 15,
          'font-weight': 600,
          fill: 'var(--ink)',
        });
        text.append(document.createTextNode(''));
        g.append(bg, bar, text);
        (g as SVGElement & { _bg?: SVGRectElement; _bar?: SVGRectElement })._bg = bg as SVGRectElement;
        (g as SVGElement & { _bar?: SVGRectElement })._bar = bar as SVGRectElement;
        tagLayer.append(g);
        tagTexts.set(sp.id, text);
      }
      text.textContent = label;
      const g = text.parentNode as SVGElement & { _bg?: SVGRectElement; _bar?: SVGRectElement };
      const xMax = Math.max(safeL, safeR - estWidth);
      const x = Math.min(Math.max(Math.max(14, zone.x0 * SCENE_W + 12), safeL), xMax);
      const y = Math.min(Math.max(Math.max(30, zone.y0 * SCENE_H - 10), safeT), Math.max(safeT, safeB));
      g._bg?.setAttribute('x', String(x));
      g._bg?.setAttribute('y', String(y - 17));
      g._bg?.setAttribute('width', String(estWidth));
      g._bar?.setAttribute('x', String(x));
      g._bar?.setAttribute('y', String(y + 6));
      g._bar?.setAttribute('width', String(estWidth));
      text.setAttribute('x', String(x + 9));
      text.setAttribute('y', String(y));
    }
  }

  // -- food web ---------------------------------------------------------------
  function redrawWeb(animate = false): void {
    clear(webLayer);
    const defs = svgEl('defs');
    const marker = svgEl('marker', {
      id: 'web-arrow',
      viewBox: '0 0 10 10',
      refX: 8,
      refY: 5,
      markerWidth: 7,
      markerHeight: 7,
      orient: 'auto-start-reverse',
    });
    marker.append(svgEl('path', { d: 'M0 0 L10 5 L0 10 Z', fill: 'var(--forest-deep)' }));
    defs.append(marker);
    webLayer.append(defs);

    for (const pred of biome.species) {
      for (const [preyId] of Object.entries(pred.diet?.prey ?? {})) {
        const prey = biome.species.find((s) => s.id === preyId);
        if (!prey) continue;
        const pZone = ZONES[biome.id]?.[pred.id];
        const qZone = ZONES[biome.id]?.[preyId];
        if (!pZone || !qZone) continue;
        const x1 = (pZone.x0 + (pZone.x1 - pZone.x0) / 2) * SCENE_W;
        const y1 = (pZone.y0 + (pZone.y1 - pZone.y0) / 2) * SCENE_H;
        const x2 = (qZone.x0 + (qZone.x1 - qZone.x0) / 2) * SCENE_W;
        const y2 = (qZone.y0 + (qZone.y1 - qZone.y0) / 2) * SCENE_H;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 - 40;
        const path = svgEl('path', {
          d: `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`,
          fill: 'none',
          stroke: 'var(--forest-deep)',
          'stroke-width': 2.5,
          'stroke-dasharray': '7 5',
          'marker-end': 'url(#web-arrow)',
          'data-edge': '',
          'data-pred': pred.id,
          'data-prey': preyId,
        });
        webLayer.append(path);
        if (animate) drawLine(path);
        const label = svgEl('text', {
          x: mx,
          y: my + 26,
          'text-anchor': 'middle',
          'font-family': 'var(--font-mono)',
          'font-size': 13,
          'font-weight': 600,
          fill: 'var(--forest-deep)',
        });
        label.append(document.createTextNode(`${pred.singular} eats ${prey.singular}`));
        webLayer.append(label);
      }
    }
  }

  // -- cause copy -----------------------------------------------------------
  function causeLine(sp: SpeciesDef, causes: Cause[]): string {
    if (causes.length === 0) return 'no change';
    const bits: string[] = [];
    for (const c of causes) {
      const n = Math.abs(c.count);
      switch (c.key) {
        case 'released':
          bits.push(`+${n} you released`);
          break;
        case 'removed':
          bits.push(`−${n} you removed`);
          break;
        case 'event':
          bits.push(`${c.count > 0 ? '+' : '−'}${n} ${c.note?.toLowerCase() ?? 'event'}`);
          break;
        case 'grew':
          bits.push(`+${n} grew`);
          break;
        case 'dieback':
          bits.push(`−${n} died back`);
          break;
        case 'born':
          bits.push(`+${n} born`);
          break;
        case 'eaten': {
          const actor = biome.species.find((s) => s.id === c.actor);
          bits.push(`−${n} eaten by ${actor ? actor.singular : 'predator'}`);
          break;
        }
        case 'starved':
          bits.push(`−${n} starved`);
          break;
        case 'died':
          bits.push(`−${n} old age`);
          break;
        default:
          break;
      }
    }
    void sp;
    if (bits.length > 3) {
      // the player's own action stays visible first (it is the action's receipt),
      // then decline causes (the teaching signal), then growth
      const order: Record<string, number> = { released: 0, removed: 0, starved: 1, eaten: 2, died: 3, dieback: 4, event: 5, born: 6, grew: 7 };
      const sorted = [...causes].sort((a, b) => (order[a.key] ?? 9) - (order[b.key] ?? 9));
      const kept: string[] = [];
      let used = 0;
      for (const c of sorted) {
        if (used >= 3) break;
        const n2 = Math.abs(c.count);
        const verb =
          c.key === 'released' ? `+${n2} you released` :
          c.key === 'removed' ? `−${n2} you removed` :
          c.key === 'event' ? `${c.count > 0 ? '+' : '−'}${n2} ${c.note?.toLowerCase() ?? 'event'}` :
          c.key === 'grew' ? `+${n2} grew` :
          c.key === 'dieback' ? `−${n2} died back` :
          c.key === 'born' ? `+${n2} born` :
          c.key === 'eaten' ? `−${n2} eaten by ${biome.species.find((s) => s.id === c.actor)?.singular ?? 'predator'}` :
          c.key === 'starved' ? `−${n2} starved` :
          `−${n2} old age`;
        kept.push(verb);
        used++;
      }
      return `${kept.join(' · ')} · +${causes.length - used} more`;
    }
    return bits.join(' · ');
  }

  // -- challenge slot ---------------------------------------------------------
  function renderChallengeSlot(): void {
    clear(challengeSlot);
    if (!challenge) {
      const picks = data.challenges.filter((c) => c.biomeId === biome.id);
      challengeSlot.append(
        h('div', { class: 'ch-head' }, h('h3', { class: 'ch-title', text: 'Field assignments' })),
        h(
          'div',
          { class: 'ch-picker' },
          ...picks.map((c) => {
            const done = progress.done.includes(c.id);
            const btn = h(
              'button',
              { class: 'ch-pick', type: 'button' },
              icon(done ? 'check' : 'book', 15, done),
              h('b', { text: c.title }),
              h('span', { class: `pick-state${done ? ' done' : ''}`, text: done ? 'done ✓' : 'start →' }),
            );
            btn.addEventListener('click', () => startChal(c));
            return btn;
          }),
        ),
      );
      return;
    }

    const ch = challenge.challenge;
    const targets = h(
      'div',
      { class: 'ch-targets' },
      ...Object.entries(ch.targetRanges).map(([sid, range]) => {
        const sp = biome.species.find((s) => s.id === sid);
        const now = sim.populations[sid] ?? 0;
        const ok = now >= range[0] && now <= range[1];
        return h(
          'div',
          { class: `ch-target${ok ? ' ok' : ' out'}` },
          sp ? speciesChip(sp, 22) : null,
          h('span', { text: sp?.label ?? sid }),
          h('span', { class: 'tgt-range', text: `${range[0]}–${range[1]}` }),
          h('span', { class: 'tgt-now', text: String(now) }),
          icon(ok ? 'check' : 'dash', 14, ok),
        );
      }),
    );

    const streak = h(
      'div',
      { class: 'ch-progress' },
      h('span', {
        text: `${challenge.streak} of ${ch.holdTurns} steady seasons · season ${sim.season} of ${ch.maxTurns}`,
      }),
      h(
        'span',
        { class: 'streak-dots', 'aria-hidden': 'true' },
        ...Array.from({ length: ch.holdTurns }, (_, i) =>
          h('span', { class: `streak-dot${i < challenge!.streak ? ' filled' : ''}` }),
        ),
      ),
    );

    const head = h(
      'div',
      { class: 'ch-head' },
      h('h3', { class: 'ch-title', text: ch.title }),
      progress.done.includes(ch.id) ? h('span', { class: 'ch-done-badge' }, icon('check', 11, true), 'done') : null,
    );

    challengeSlot.append(
      head,
      h('p', { class: 'ch-brief', text: ch.brief }),
      targets,
      streak,
    );

    if (challenge.status === 'success') {
      challengeSlot.append(
        h(
          'div',
          { class: 'ch-result ok' },
          icon('laurel', 24),
          h('span', {
            text:
              challenge.streak >= ch.holdTurns
                ? `The ${biome.id === 'meadow' ? 'meadow' : 'marsh'} held steady for ${ch.holdTurns} seasons — assignment complete.`
                : 'Assignment complete.',
          }),
        ),
        h('div', { class: 'ch-picker' }, ...resultButtons()),
      );
    } else if (challenge.status === 'ended') {
      challengeSlot.append(
        h(
          'div',
          { class: 'ch-result miss' },
          icon('book', 22),
          h('span', {
            text: 'The season ended before everything settled. Read the field chart and try a gentler hand.',
          }),
        ),
        h('div', { class: 'ch-picker' }, ...resultButtons()),
      );
    } else {
      challengeSlot.append(
        h('p', { class: 'ch-tip', text: `Tip: ${ch.tip}` }),
        h(
          'div',
          { class: 'ch-picker' },
          h(
            'button',
            {
              class: 'ch-pick',
              type: 'button',
            },
            icon('close', 14),
            'Leave assignment (back to free study)',
          ),
        ),
      );
      const leave = challengeSlot.querySelector('.ch-pick');
      leave?.addEventListener('click', () => {
        challenge = null;
        sim = createSim(biome, FREE_SEED);
        stopPlay();
        renderAll(false);
      });
    }

    function resultButtons(): HTMLElement[] {
      const again = h('button', { class: 'ch-pick', type: 'button' }, icon('reset', 15), 'Run the assignment again');
      again.addEventListener('click', () => startChal(ch));
      const chart = h('button', { class: 'ch-pick', type: 'button' }, icon('chart', 15), 'Read the field chart');
      chart.addEventListener('click', () => openDebrief());
      return [again, chart];
    }
  }

  function startChal(c: ChallengeDef): void {
    stopPlay();
    challenge = startChallenge(c, biome);
    sim = challenge.sim;
    bannerUntil = -1;
    eventBanner.hidden = true;
    renderAll(false);
    moveFocus(stepBtn);
  }

  // -- step ---------------------------------------------------------------------
  function step(): void {
    const beforePops = { ...sim.populations };
    if (challenge) {
      challenge = stepChallenge(challenge, biome);
      sim = challenge.sim;
      if (challenge.status !== 'running') stopPlay();
    } else {
      sim = stepSim(sim, biome);
    }

    // reset plan sliders (plans were consumed by the step)
    for (const sp of biome.species) {
      const refs = rows.get(sp.id);
      if (refs) {
        refs.slider.value = '0';
        updatePlanChip(sp.id, 0);
      }
    }

    const tick = sim.history[sim.history.length - 1];
    updateRows(beforePops, tick?.species ?? {});
    renderTokens();
    renderChallengeSlot();
    updateCaption(tick);
    showEvents(tick);

    if (challenge?.status === 'success') {
      liveRegion.textContent = `Assignment complete — the ${biome.id === 'meadow' ? 'meadow' : 'marsh'} held steady for ${challenge.challenge.holdTurns} seasons.`;
      if (!progress.done.includes(challenge.challenge.id)) {
        const next = { ...progress, done: [...progress.done, challenge.challenge.id] };
        Object.assign(progress, next);
        saveProgress(next);
      }
    } else if (challenge?.status === 'ended') {
      liveRegion.textContent = 'The season ended before everything settled. Read the field chart and try a gentler hand.';
    }
  }

  function updateRows(beforePops: Record<string, number>, ticks: Record<string, { before: number; after: number; causes: Cause[] }>): void {
    for (const sp of biome.species) {
      const refs = rows.get(sp.id);
      const t = ticks[sp.id];
      if (!refs || !t) continue;
      const now = sim.populations[sp.id] ?? 0;
      refs.pop.textContent = String(now);
      refs.row.classList.toggle('is-zero', now === 0);
      markOut(refs.row, sp.id);
      refs.cause.textContent = causeLine(sp, t.causes);
      const newTrend = trendChip(trendOf(sim, sp.id));
      refs.trend.replaceWith(newTrend);
      rows.set(sp.id, { ...refs, trend: newTrend });
      if (t.after !== t.before || beforePops[sp.id] !== t.after) {
        pulseRow(refs.row, t.after > t.before);
      }
    }
  }

  function updateCaption(tick: SimState['history'][number] | undefined): void {
    seasonLabel.textContent = `Season ${sim.season}`;
    if (!tick) {
      captionText.textContent = 'Season 0 — the study begins. Set your plans, then step one season.';
      liveRegion.textContent = '';
      return;
    }
    // biggest mover this season drives the caption sentence
    let hero: { sp: SpeciesDef; t: { before: number; after: number; causes: Cause[] } } | null = null;
    let heroDelta = 0;
    for (const sp of biome.species) {
      const t = tick.species[sp.id];
      if (!t) continue;
      const d = Math.abs(t.after - t.before);
      if (d > heroDelta) {
        heroDelta = d;
        hero = { sp, t };
      }
    }
    let text: string;
    if (hero && heroDelta > 0) {
      const dir = hero.t.after > hero.t.before ? 'rose' : 'fell';
      text = `Season ${tick.season} — ${hero.sp.label.toLowerCase()} ${dir} ${hero.t.before} → ${hero.t.after}: ${causeLine(hero.sp, hero.t.causes)}.`;
    } else {
      text = `Season ${tick.season} — every population held steady.`;
    }
    for (const sp of biome.species) {
      const t = tick.species[sp.id];
      if (t && t.before > 0 && t.after === 0) {
        text += ` ${sp.label} are gone from the ${biome.id === 'meadow' ? 'meadow' : 'marsh'}.`;
      }
    }
    if (!challenge && sim.season > 0 && sim.season % 8 === 0) {
      text += ' Open the field chart to read the whole run.';
    }
    captionText.textContent = text;
    liveRegion.textContent = text;
  }

  function showEvents(tick: SimState['history'][number] | undefined): void {
    if (!tick || tick.eventsFired.length === 0) {
      if (sim.season >= bannerUntil && !eventBanner.hidden) eventBanner.hidden = true;
      return;
    }
    clear(eventBanner);
    const ev = tick.eventsFired[0];
    eventBanner.append(h('span', { class: 'ev-label', text: ev.label }), h('span', { text: ev.message }));
    eventBanner.hidden = false;
    bannerIn(eventBanner);
    bannerUntil = sim.season + 2;
  }

  // -- play / reset --------------------------------------------------------------
  function togglePlay(): void {
    if (playing) stopPlay();
    else startPlay();
  }
  function startPlay(): void {
    playing = true;
    playBtn.setAttribute('aria-pressed', 'true');
    playBtn.replaceChildren(icon('pause', 18), 'Pause');
    playTimer = window.setInterval(() => {
      if (challenge && challenge.status !== 'running') {
        stopPlay();
        return;
      }
      step();
    }, PLAY_INTERVAL_MS / playSpeed);
    step();
  }
  function stopPlay(): void {
    playing = false;
    playBtn.setAttribute('aria-pressed', 'false');
    playBtn.replaceChildren(icon('play', 18), 'Play');
    if (playTimer !== null) {
      window.clearInterval(playTimer);
      playTimer = null;
    }
  }
  function resetAll(): void {
    stopPlay();
    if (challenge) {
      challenge = startChallenge(challenge.challenge, biome);
      sim = challenge.sim;
    } else {
      sim = createSim(biome, FREE_SEED);
    }
    bannerUntil = -1;
    eventBanner.hidden = true;
    renderAll(false);
  }

  // -- debrief -----------------------------------------------------------------
  let debriefEl: HTMLElement | null = null;
  function openDebrief(): void {
    if (debriefEl) return;
    debriefEl = buildDebrief({
      biome,
      sim,
      onClose: () => {
        debriefEl?.remove();
        debriefEl = null;
        moveFocus(chartBtn);
      },
      title: challenge ? `Field chart · ${challenge.challenge.title}` : 'Field chart',
    });
    root.append(debriefEl);
    moveFocus(debriefEl.querySelector('.db-head .btn') as HTMLElement);
  }

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && debriefEl) {
      debriefEl.remove();
      debriefEl = null;
      moveFocus(chartBtn);
    }
  });

  // -- boot ---------------------------------------------------------------------
  function renderAll(animate = true): void {
    seasonLabel.textContent = `Season ${sim.season}`;
    nbMode.textContent = challenge ? 'Assignment' : 'Free study';
    for (const sp of biome.species) {
      const refs = rows.get(sp.id);
      if (!refs) continue;
      refs.pop.textContent = String(sim.populations[sp.id] ?? 0);
      refs.row.classList.toggle('is-zero', (sim.populations[sp.id] ?? 0) === 0);
      refs.cause.textContent =
        sim.history.length > 0
          ? causeLine(sp, sim.history[sim.history.length - 1].species[sp.id]?.causes ?? [])
          : initialCauseOf(sp);
      const newTrend = trendChip(trendOf(sim, sp.id));
      refs.trend.replaceWith(newTrend);
      rows.set(sp.id, { ...refs, trend: newTrend });
      refs.slider.value = '0';
      updatePlanChip(sp.id, 0);
      markOut(refs.row, sp.id);
    }
    renderTokens(animate);
    renderChallengeSlot();
    updateCaption(sim.history[sim.history.length - 1]);
  }

  if (opts.startChallengeId) {
    const ch = data.challenges.find((c) => c.id === opts.startChallengeId);
    if (ch) challenge = startChallenge(ch, biome);
    sim = challenge ? challenge.sim : sim;
  }
  renderAll(false);

  // renderTags() ran before this screen was attached to the document, when the
  // plate had no box yet; re-clamp once it has real dimensions, and again on
  // viewport changes (the slice crop window moves with the plate size).
  requestAnimationFrame(() => renderTags());
  const onResize = () => renderTags();
  window.addEventListener('resize', onResize);

  return {
    root,
    destroy() {
      stopPlay();
      window.removeEventListener('resize', onResize);
    },
  };
}
