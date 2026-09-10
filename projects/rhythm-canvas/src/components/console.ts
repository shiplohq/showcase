// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Transport console — mode selector + transport rail. Vanilla DOM built once
// here so main.ts stays a state orchestrator. Every control is a real button
// or ARIA slider: keyboard-operable, >=44 px touch targets, visible focus.

import type { AppCopy, ModeId, TrackDef } from '../lib/types';

export interface ConsoleCallbacks {
  onTogglePlay(): void;
  onSeek(toPlayhead: number): void;
  onSeekBy(deltaBeats: number): void;
  onTrackCycle(): void;
  onVolume(v: number): void;
  onMuteToggle(): void;
  onMotionToggle(): void;
  onModePick(mode: ModeId): void;
}

function svg(path: string, label: string): string {
  return `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">${path}</svg><span class="vh">${label}</span>`;
}

const ICONS = {
  play: svg('<path d="M7 4.5v15l13-7.5z" fill="currentColor"/>', 'Play'),
  pause: svg(
    '<rect x="6" y="4.5" width="4" height="15" fill="currentColor"/><rect x="14" y="4.5" width="4" height="15" fill="currentColor"/>',
    'Pause',
  ),
  mute: svg(
    '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" fill="none"/>',
    'Muted',
  ),
  sound: svg(
    '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    'Sound on',
  ),
};

export class TransportConsole {
  private playBtn!: HTMLButtonElement;
  private trackBtn!: HTMLButtonElement;
  private sliderEl!: HTMLElement;
  private sliderFill!: HTMLElement;
  private timeEl!: HTMLElement;
  private muteBtn!: HTMLButtonElement;
  private volumeEl!: HTMLInputElement;
  private motionBtn!: HTMLButtonElement;
  private modeBtns = new Map<ModeId, HTMLButtonElement>();
  private modeChip!: HTMLElement;
  private duration = 1;

  constructor(
    private modeNav: HTMLElement,
    private transport: HTMLElement,
    private copy: AppCopy,
    private cb: ConsoleCallbacks,
  ) {}

  build(): void {
    this.buildModeNav();
    this.buildTransport();
  }

  private buildModeNav(): void {
    this.modeNav.setAttribute('role', 'radiogroup');
    this.modeNav.setAttribute('aria-label', 'Visual mode');
    for (const mode of this.copy.modes) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mode-btn';
      btn.setAttribute('role', 'radio');
      btn.dataset.mode = mode.id;
      btn.innerHTML = `<span class="mode-key" aria-hidden="true">${mode.key}</span><span class="mode-label">${mode.label}</span>`;
      btn.title = mode.blurb;
      btn.addEventListener('click', () => this.cb.onModePick(mode.id));
      this.modeNav.appendChild(btn);
      this.modeBtns.set(mode.id, btn);
    }
    this.modeChip = document.createElement('span');
    this.modeChip.className = 'mode-chip mono';
    this.modeNav.appendChild(this.modeChip);
  }

  private buildTransport(): void {
    const t = this.transport;
    t.innerHTML = '';

    this.playBtn = mkButton('ctl ctl-play', this.copy.playCta, ICONS.play);
    this.playBtn.setAttribute('aria-pressed', 'false');
    this.playBtn.addEventListener('click', () => this.cb.onTogglePlay());
    t.appendChild(this.playBtn);

    this.trackBtn = mkButton('ctl ctl-track', 'Switch loop', '');
    this.trackBtn.addEventListener('click', () => this.cb.onTrackCycle());
    t.appendChild(this.trackBtn);

    const progressWrap = document.createElement('div');
    progressWrap.className = 'progress-wrap';
    this.sliderEl = document.createElement('div');
    this.sliderEl.className = 'progress';
    this.sliderEl.setAttribute('role', 'slider');
    this.sliderEl.setAttribute('tabindex', '0');
    this.sliderEl.setAttribute('aria-label', 'Playback position');
    this.sliderEl.setAttribute('aria-orientation', 'horizontal');
    this.sliderEl.setAttribute('aria-valuemin', '0');
    this.sliderFill = document.createElement('div');
    this.sliderFill.className = 'progress-fill';
    this.sliderEl.appendChild(this.sliderFill);
    progressWrap.appendChild(this.sliderEl);
    this.timeEl = document.createElement('span');
    this.timeEl.className = 'time mono';
    progressWrap.appendChild(this.timeEl);
    t.appendChild(progressWrap);

    this.wireSlider();

    this.muteBtn = mkButton('ctl ctl-mute', 'Mute', ICONS.sound);
    this.muteBtn.setAttribute('aria-pressed', 'false');
    this.muteBtn.addEventListener('click', () => this.cb.onMuteToggle());
    t.appendChild(this.muteBtn);

    const volWrap = document.createElement('div');
    volWrap.className = 'vol-wrap';
    const volLabel = document.createElement('span');
    volLabel.className = 'vol-label mono';
    volLabel.textContent = 'VOL';
    this.volumeEl = document.createElement('input');
    this.volumeEl.type = 'range';
    this.volumeEl.min = '0';
    this.volumeEl.max = '100';
    this.volumeEl.value = '80';
    this.volumeEl.setAttribute('aria-label', 'Volume');
    this.volumeEl.addEventListener('input', () => this.cb.onVolume(Number(this.volumeEl.value) / 100));
    volWrap.appendChild(volLabel);
    volWrap.appendChild(this.volumeEl);
    t.appendChild(volWrap);

    this.motionBtn = mkButton('ctl ctl-motion mono', 'Toggle motion mode', '');
    this.motionBtn.addEventListener('click', () => this.cb.onMotionToggle());
    t.appendChild(this.motionBtn);
  }

  private wireSlider(): void {
    const el = this.sliderEl;
    let dragging = false;

    const ratioToPlayhead = (clientX: number): number => {
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      return ratio * this.duration;
    };

    el.addEventListener('pointerdown', (e) => {
      dragging = true;
      el.setPointerCapture(e.pointerId);
      this.cb.onSeek(ratioToPlayhead(e.clientX));
    });
    el.addEventListener('pointermove', (e) => {
      if (dragging) this.cb.onSeek(ratioToPlayhead(e.clientX));
    });
    const end = (e: PointerEvent) => {
      if (dragging) {
        dragging = false;
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // pointer already released
        }
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);

    el.addEventListener('keydown', (e) => {
      let handled = true;
      switch (e.key) {
        case 'ArrowLeft':
          this.cb.onSeekBy(-1);
          break;
        case 'ArrowRight':
          this.cb.onSeekBy(1);
          break;
        case 'PageDown':
          this.cb.onSeekBy(-4);
          break;
        case 'PageUp':
          this.cb.onSeekBy(4);
          break;
        case 'Home':
          this.cb.onSeek(0);
          break;
        case 'End':
          this.cb.onSeek(this.duration - 0.01);
          break;
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    });
  }

  // -- reflect state --------------------------------------------------------

  setPlaying(playing: boolean): void {
    this.playBtn.setAttribute('aria-pressed', String(playing));
    this.playBtn.innerHTML = playing ? ICONS.pause : ICONS.play;
    this.playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  setTrack(index: number, track: TrackDef, total: number): void {
    this.trackBtn.innerHTML = `<span class="ctl-kicker mono">${this.copy.loopLabel} ${index + 1}/${total}</span><span class="ctl-track-name">${track.title}</span><span class="ctl-track-bpm mono">${track.bpm} BPM</span>`;
    this.trackBtn.setAttribute(
      'aria-label',
      `Switch loop — currently ${track.title}, loop ${index + 1} of ${total}, ${track.bpm} beats per minute`,
    );
    this.duration = track.duration;
  }

  setMode(mode: ModeId, manual: boolean): void {
    for (const [id, btn] of this.modeBtns) {
      btn.setAttribute('aria-checked', String(id === mode));
      btn.classList.toggle('is-active', id === mode);
    }
    this.modeChip.textContent = manual ? this.copy.manualLabel : this.copy.autoLabel;
    this.modeChip.classList.toggle('is-manual', manual);
  }

  setProgress(playhead: number, duration: number): void {
    const ratio = Math.min(Math.max(playhead / duration, 0), 1);
    this.sliderFill.style.transform = `scaleX(${ratio})`;
    this.sliderEl.setAttribute('aria-valuenow', playhead.toFixed(1));
    this.sliderEl.setAttribute('aria-valuetext', `${fmtTime(playhead)} of ${fmtTime(duration)}`);
    this.sliderEl.setAttribute('aria-valuemax', duration.toFixed(1));
    this.timeEl.textContent = `${fmtTime(playhead)} / ${fmtTime(duration)}`;
  }

  setVolume(v: number, muted: boolean): void {
    this.volumeEl.value = String(Math.round(v * 100));
    this.muteBtn.setAttribute('aria-pressed', String(muted));
    this.muteBtn.innerHTML = muted ? ICONS.mute : ICONS.sound;
    this.muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  }

  setMotion(reduced: boolean): void {
    this.motionBtn.innerHTML = `${this.copy.motionLabel} <span class="motion-state">${reduced ? this.copy.motionOff : this.copy.motionOn}</span>`;
    this.motionBtn.setAttribute('aria-pressed', String(reduced));
    this.motionBtn.setAttribute(
      'aria-label',
      reduced ? 'Motion reduced — switch to full motion' : 'Full motion — switch to reduced motion',
    );
  }

  focusPlay(): void {
    this.playBtn.focus();
  }
}

function mkButton(cls: string, label: string, inner: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = cls;
  btn.innerHTML = inner;
  btn.setAttribute('aria-label', label);
  return btn;
}

export function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${m}:${sec < 10 ? '0' : ''}${sec.toFixed(1)}`;
}
