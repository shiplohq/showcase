// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// About panel — explains the client-only instrument (synthesized audio, no
// mic, no server), lists shortcuts and offers the preference reset. Focus
// moves in with the dialog and back to the opener on close; Esc closes.

import type { AppCopy } from '../lib/types';
import { motion } from '../lib/gsap';

export class AboutSheet {
  private panel: HTMLElement;
  private opener: HTMLElement | null = null;
  private closeBtn!: HTMLButtonElement;
  private onReset: () => void;

  constructor(
    root: HTMLElement,
    copy: AppCopy,
    callbacks: { onReset: () => void; onClose: () => void },
  ) {
    this.panel = root;
    this.onReset = callbacks.onReset;
    this.build(copy);
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        callbacks.onClose();
        return;
      }
      // Minimal focus trap — the modal sheet owns Tab while open.
      if (e.key === 'Tab') {
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
        ).filter((el) => !el.hasAttribute('disabled'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    root.addEventListener('pointerdown', (e) => {
      if (e.target === root) callbacks.onClose();
    });
  }

  private build(copy: AppCopy): void {
    const shortcuts = copy.shortcuts
      .map((s) => `<div class="sc-row"><kbd>${s.keys}</kbd><span>${s.action}</span></div>`)
      .join('');
    const body = copy.aboutBody.map((p) => `<p>${p}</p>`).join('');
    this.panel.innerHTML = `
      <div class="sheet" role="document">
        <div class="sheet-head">
          <h2 id="about-title">${copy.aboutTitle}</h2>
          <button type="button" class="ctl ctl-close" aria-label="Close panel">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
          </button>
        </div>
        ${body}
        <p class="sheet-client mono">${copy.aboutClientOnly}</p>
        <p>${copy.aboutMotion}</p>
        <h3 class="sheet-sub mono">${copy.shortcutsTitle}</h3>
        <div class="sc-list">${shortcuts}</div>
        <button type="button" class="ctl ctl-reset mono">${copy.resetLabel}</button>
      </div>`;
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-modal', 'true');
    this.panel.setAttribute('aria-labelledby', 'about-title');
    this.closeBtn = this.panel.querySelector('.ctl-close')!;
    this.closeBtn.addEventListener('click', () => this.close());
    const reset = this.panel.querySelector('.ctl-reset')!;
    reset.addEventListener('click', () => this.onReset());
  }

  get isOpen(): boolean {
    return !this.panel.hidden;
  }

  open(from: HTMLElement): void {
    this.opener = from;
    this.panel.hidden = false;
    motion(this.panel, { opacity: 1, duration: 0.2, ease: 'power1.out' });
    const sheet = this.panel.querySelector('.sheet') as HTMLElement | null;
    if (sheet) {
      sheet.style.transform = 'translateY(14px)';
      sheet.style.transition = 'transform 260ms cubic-bezier(0.22,0.9,0.12,1)';
      requestAnimationFrame(() => {
        sheet.style.transform = 'translateY(0)';
      });
    }
    this.closeBtn.focus();
  }

  close(): void {
    this.panel.hidden = true;
    const to = this.opener;
    this.opener = null;
    if (to && document.contains(to)) {
      to.focus();
    }
  }
}
