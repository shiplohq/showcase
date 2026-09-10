// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Rhythm Canvas — browser-native rhythm visualizer (Shiplo Showcase #17).
// One deterministic clock (beats[] JSON + AudioContext) drives both the
// synth scheduler and the canvas stage, so sound and visuals cannot drift.
// State layers per spec: content = JSON, interaction = session memory,
// personal = anonymous localStorage prefs with reset.

import '@fontsource/anton';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/motion.css';

import { loadTracks } from './lib/data';
import { clockAt, MODE_IDS } from './features/engine/beatClock';
import type { ClockState } from './features/engine/beatClock';
import { SynthEngine } from './features/audio/synth';
import { LoopPlayer } from './features/audio/loopPlayer';
import { Stage, type Accent } from './features/visuals/stage';
import { TransportConsole } from './components/console';
import { TypeLayer } from './components/typeLayer';
import { AboutSheet } from './components/aboutSheet';
import { showErrorPlaque } from './components/errorPlaque';
import { clearPrefs, DEFAULT_PREFS, loadPrefs, savePrefs, systemPrefersReduced, type Prefs } from './lib/prefs';
import { isReduced, onMotionChange, setMotionReduced } from './lib/motionState';
import { gsap, killTweens, motion } from './lib/gsap';
import type { ModeId, TrackDef } from './lib/types';

const ACCENT_LIFE = 0.9;

async function boot(): Promise<void> {
  const prefs: Prefs = loadPrefs();
  setMotionReduced(prefs.motion ? prefs.motion === 'reduced' : systemPrefersReduced());

  const result = await loadTracks();
  if (!result.ok) {
    document.body.classList.add('is-error');
    showErrorPlaque(
      document.getElementById('error-plaque')!,
      { errorTitle: 'SIGNAL LOST', errorBody: 'The local score data failed to load. This showcase runs entirely from data/tracks.json — check the file and reload.' },
      result.error,
      result.issues,
    );
    return;
  }

  const { copy, tracks } = result.file;
  let trackIndex = Math.min(Math.max(prefs.trackIndex, 0), tracks.length - 1);

  // -- engine --------------------------------------------------------------

  const synth = new SynthEngine();
  synth.setOutput(prefs.volume, prefs.muted);
  const player = new LoopPlayer(synth);

  // -- stage + layers --------------------------------------------------------

  const stageEl = document.getElementById('stage')!;
  const canvas = document.getElementById('stage-canvas') as HTMLCanvasElement;
  const stage = new Stage(canvas);
  const typeLayer = new TypeLayer(document.getElementById('type-layer')!);
  const readoutEl = document.getElementById('readout')!;
  const lampEl = document.getElementById('beat-lamp')!;
  const ctaEl = document.getElementById('play-cta') as HTMLButtonElement;
  const srStatus = document.getElementById('sr-status')!;

  // -- session state ---------------------------------------------------------

  let playing = false;
  let started = false;
  let mode: ModeId = MODE_IDS[0];
  let manualMode = false;
  let accents: Accent[] = [];
  let lastBeatIndex = -1;
  let lastSectionIndex = -1;
  let lastLampOn: boolean | null = null;
  let dirty = true; // reduced-motion: redraw the static poster only when needed
  const modeBlend = { v: 1 };
  let rafId = 0;
  let reducedTimer: ReturnType<typeof setInterval> | null = null;

  const track = (): TrackDef => tracks[trackIndex];
  const playhead = (): number => player.playhead(track());

  function announce(text: string): void {
    srStatus.textContent = text;
  }

  // -- mode ------------------------------------------------------------------

  function applyMode(next: ModeId, manual: boolean): void {
    const changing = next !== mode;
    mode = next;
    manualMode = manual;
    ui.setMode(mode, manualMode);
    if (!changing) return;
    killTweens(modeBlend);
    if (isReduced()) {
      modeBlend.v = 1;
    } else {
      modeBlend.v = 0;
      gsap.to(modeBlend, { v: 1, duration: 0.3, ease: 'poster' });
    }
    if (mode === 'type') {
      const t = track();
      const c = clockAt(t, playhead());
      typeLayer.show();
      typeLayer.setWord(t.tokens[c.bar % t.tokens.length]);
      typeLayer.setBeat(c.beatInBar + 1);
    } else {
      typeLayer.hide();
    }
    announce(`Mode ${mode}`);
    dirty = true;
  }

  function pickMode(next: ModeId): void {
    applyMode(next, true);
  }

  // -- beat / section events ---------------------------------------------------

  function onBeat(c: ClockState): void {
    const t = track();
    readoutEl.textContent =
      `${copy.sectionLabel} ${c.section.label} · ${copy.barLabel} ${String(c.bar + 1).padStart(2, '0')} · ` +
      `${copy.beatLabel} ${c.beatInBar + 1}/${t.beatsPerBar} · ${t.bpm} BPM`;
    if (mode === 'type') {
      if (c.beatInBar === 0) typeLayer.setWord(t.tokens[c.bar % t.tokens.length]);
      typeLayer.setBeat(c.beatInBar + 1);
    }
    dirty = true;
  }

  function onSection(index: number): void {
    // A new section returns control to the JSON choreography.
    applyMode(track().sections[index].mode, false);
  }

  // -- frame tick (rAF in full motion, 150 ms interval when reduced) -----------

  function drawFrame(c: ClockState): void {
    stage.draw({
      track: track(),
      clock: c,
      mode,
      spectrum: synth.context ? synth.readSpectrum() : null,
      accents,
      idle: !started,
      modeBlend: modeBlend.v,
    });
  }

  function purgeAccents(ph: number, dur: number): void {
    if (accents.length === 0) return;
    accents = accents.filter((a) => {
      let age = ph - a.t;
      if (age < 0) age += dur;
      return age < ACCENT_LIFE;
    });
  }

  function tick(force = false): void {
    const t = track();
    const ph = playhead();
    const clock = clockAt(t, ph);
    if (clock.beatIndex !== lastBeatIndex) {
      lastBeatIndex = clock.beatIndex;
      onBeat(clock);
    }
    if (clock.sectionIndex !== lastSectionIndex) {
      lastSectionIndex = clock.sectionIndex;
      onSection(clock.sectionIndex);
    }
    const lampOn = playing && clock.beatPhase < 0.55;
    if (lampOn !== lastLampOn) {
      lastLampOn = lampOn;
      lampEl.classList.toggle('on', lampOn);
      if (isReduced()) dirty = true;
    }
    purgeAccents(ph, t.duration);
    ui.setProgress(ph, t.duration);
    if (!isReduced()) {
      drawFrame(clock);
    } else if (dirty || force) {
      dirty = false;
      drawFrame(clock);
    }
  }

  function stopLoop(): void {
    if (rafId) cancelAnimationFrame(rafId);
    if (reducedTimer !== null) clearInterval(reducedTimer);
    rafId = 0;
    reducedTimer = null;
  }

  function startLoop(): void {
    stopLoop();
    if (isReduced()) {
      reducedTimer = setInterval(() => tick(), 150);
      tick(true);
    } else {
      const frame = () => {
        tick();
        rafId = requestAnimationFrame(frame);
      };
      rafId = requestAnimationFrame(frame);
    }
  }

  // -- transport ---------------------------------------------------------------

  function hideCta(): void {
    const hadFocus = document.activeElement === ctaEl;
    motion(ctaEl, {
      opacity: 0,
      scale: 0.96,
      duration: 0.22,
      ease: 'power1.out',
      onComplete: () => {
        ctaEl.hidden = true;
        if (hadFocus) ui.focusPlay();
      },
    });
  }

  function togglePlay(): void {
    if (playing) {
      player.pause(track());
      playing = false;
      ui.setPlaying(false);
      announce('Paused');
    } else {
      synth.ensure();
      synth.tune(track());
      player.start(track(), player.playhead(track()));
      playing = true;
      if (!started) {
        started = true;
        hideCta();
      }
      ui.setPlaying(true);
      announce(`Playing ${track().title}, ${track().bpm} BPM`);
      lastBeatIndex = -1;
    }
    dirty = true;
  }

  function seekTo(to: number): void {
    player.seek(track(), to, playing);
    accents.length = 0;
    lastBeatIndex = -1;
    dirty = true;
    tick(true);
  }

  function seekBy(deltaBeats: number): void {
    const t = track();
    seekTo(playhead() + deltaBeats * (60 / t.bpm));
  }

  function cycleTrack(): void {
    const wasPlaying = playing;
    if (playing) player.pause(track());
    trackIndex = (trackIndex + 1) % tracks.length;
    prefs.trackIndex = trackIndex;
    savePrefs(prefs);
    const t = track();
    synth.tune(t);
    accents.length = 0;
    lastBeatIndex = -1;
    lastSectionIndex = -1;
    lastLampOn = null;
    ui.setTrack(trackIndex, t, tracks.length);
    applyMode(t.sections[0].mode, false);
    if (wasPlaying) {
      player.start(t, 0);
      announce(`Loop ${t.title}, ${t.bpm} BPM`);
    } else {
      announce(`Loop ${t.title}, ${t.bpm} BPM`);
    }
    dirty = true;
    tick(true);
  }

  function setVolume(v: number): void {
    prefs.volume = v;
    synth.setOutput(v, prefs.muted);
    ui.setVolume(v, prefs.muted);
    savePrefs(prefs);
  }

  function toggleMute(): void {
    prefs.muted = !prefs.muted;
    synth.setOutput(prefs.volume, prefs.muted);
    ui.setVolume(prefs.volume, prefs.muted);
    savePrefs(prefs);
    announce(prefs.muted ? 'Muted' : 'Sound on');
  }

  function toggleMotion(): void {
    const reduced = !isReduced();
    prefs.motion = reduced ? 'reduced' : 'full';
    savePrefs(prefs);
    setMotionReduced(reduced);
    announce(reduced ? 'Motion reduced — static poster' : 'Full motion');
  }

  function resetPrefs(): void {
    clearPrefs();
    prefs.volume = DEFAULT_PREFS.volume;
    prefs.muted = DEFAULT_PREFS.muted;
    prefs.motion = null;
    prefs.trackIndex = DEFAULT_PREFS.trackIndex;
    synth.setOutput(prefs.volume, prefs.muted);
    ui.setVolume(prefs.volume, prefs.muted);
    setMotionReduced(systemPrefersReduced());
    announce('Preferences reset');
  }

  // -- accents -----------------------------------------------------------------

  function addAccent(x: number, y: number): void {
    synth.ensure(); // first tap is a user gesture — the context may be born here
    accents.push({ x, y, t: playhead() });
    if (accents.length > 24) accents.shift();
    synth.tapBlip();
    dirty = true;
    if (isReduced()) tick(true);
  }

  // -- UI build ------------------------------------------------------------------

  const ui = new TransportConsole(
    document.getElementById('mode-nav')!,
    document.getElementById('transport')!,
    copy,
    {
      onTogglePlay: togglePlay,
      onSeek: seekTo,
      onSeekBy: seekBy,
      onTrackCycle: cycleTrack,
      onVolume: setVolume,
      onMuteToggle: toggleMute,
      onMotionToggle: toggleMotion,
      onModePick: pickMode,
    },
  );
  ui.build();
  ui.setTrack(trackIndex, track(), tracks.length);
  ui.setPlaying(false);
  ui.setVolume(prefs.volume, prefs.muted);
  ui.setProgress(0, track().duration);

  const aboutEl = document.getElementById('about-sheet')!;
  const about = new AboutSheet(aboutEl, copy, {
    onReset: resetPrefs,
    onClose: () => about.close(),
  });

  const infoBtn = document.getElementById('about-btn') as HTMLButtonElement;
  infoBtn.addEventListener('click', () => {
    if (about.isOpen) about.close();
    else about.open(infoBtn);
  });

  ctaEl.innerHTML = `<span class="cta-play" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34" focusable="false"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg></span><span class="cta-word">${copy.playCta}</span><span class="cta-hint mono">${copy.stageHint} · SPACE</span>`;
  ctaEl.addEventListener('click', togglePlay);

  stageEl.addEventListener('pointerdown', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, [role="slider"], a, input')) return;
    const rect = canvas.getBoundingClientRect();
    addAccent(e.clientX - rect.left, e.clientY - rect.top);
  });

  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    const tag = t?.tagName ?? '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (about.isOpen) {
      // The dialog owns the keyboard while open — Esc closes, Tab is trapped
      // inside the sheet. No stage shortcuts leak through a modal.
      if (e.key === 'Escape') about.close();
      return;
    }
    if (e.key === 'Escape') {
      if (about.isOpen) about.close();
      return;
    }
    if (
      t?.closest('[role="slider"]') &&
      (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown')
    ) {
      return; // the progress slider owns its arrow keys
    }
    switch (e.key) {
      case ' ':
        if (t?.closest('button')) return; // native activation
        e.preventDefault();
        togglePlay();
        return;
      case '1':
        pickMode('pulse');
        return;
      case '2':
        pickMode('orbit');
        return;
      case '3':
        pickMode('type');
        return;
      case 't':
      case 'T':
        addAccent(stage.width / 2, stage.height / 2);
        return;
      case 'm':
      case 'M':
        toggleMute();
        return;
      case 'ArrowLeft':
        seekBy(-1);
        e.preventDefault();
        return;
      case 'ArrowRight':
        seekBy(1);
        e.preventDefault();
        return;
      default:
        return;
    }
  });

  // -- motion-mode plumbing ---------------------------------------------------

  onMotionChange(() => {
    document.body.dataset.motion = isReduced() ? 'reduced' : 'full';
    ui.setMotion(isReduced());
    if (isReduced()) {
      gsap.globalTimeline.clear();
      killTweens(modeBlend);
      modeBlend.v = 1;
      typeLayer.settle();
    }
    dirty = true;
    startLoop();
  });
  document.body.dataset.motion = isReduced() ? 'reduced' : 'full';
  ui.setMotion(isReduced());

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', (e) => {
    if (prefs.motion === null) setMotionReduced(e.matches);
  });

  // -- layout -------------------------------------------------------------------

  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        stage.resize(width, height);
        dirty = true;
        if (isReduced()) tick(true);
      }
    }
  });
  ro.observe(stageEl);
  stage.resize(stageEl.clientWidth, stageEl.clientHeight);

  // -- initial poster -------------------------------------------------------------

  applyMode(track().sections[0].mode, false);
  startLoop();
  tick(true);
}

void boot();
