// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// "Reading this atlas" — the scale-honesty panel (spec IA: scale
// explainer / caveat panel; acceptance item #1). A parchment museum card.

import { useEffect, useLayoutEffect, useRef } from 'react';
import type { AtlasCopy } from '../../lib/types';
import { IconClose } from '../../components/Icons';
import { motionFrom } from '../../lib/gsap';

interface CaveatPanelProps {
  copy: AtlasCopy;
  onClose: () => void;
}

export function CaveatPanel({ copy, onClose }: CaveatPanelProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const c = copy.caveatPanel;

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    motionFrom(cardRef.current, { opacity: 0, y: 14, duration: 0.22, ease: 'power2.out' });
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
    const card = cardRef.current;
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        // same trap as the specimen sheet — focus stays inside the dialog
        const focusables = card.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
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
    };
    card.addEventListener('keydown', onKey);
    return () => card.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={cardRef}
        className="panel-card"
        role="dialog"
        aria-modal="true"
        aria-label={c.title}
      >
        <button ref={closeRef} type="button" className="panel-close" onClick={onClose} aria-label={c.close}>
          <IconClose />
        </button>
        <h2>{c.title}</h2>
        {c.body.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
        <p style={{ fontSize: 13.5, color: 'var(--plate-ink-soft)' }}>{copy.expedition.storageNote}</p>
      </div>
    </>
  );
}
