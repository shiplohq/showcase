// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Concept notebook — sequence/loop explanations from concepts.json with
// mini diagrams. Opens as a side sheet; ESC and the close button dismiss.

import { useEffect, useRef } from 'react';
import type { Concept } from '../../lib/types';
import { ConceptDiagram } from '../../components/art';

interface Props {
  concepts: Concept[];
  open: boolean;
  focusConcept?: string;
  onClose: () => void;
}

export function NotebookPanel({ concepts, open, focusConcept, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="rr-notebook-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside
        className="rr-notebook"
        role="dialog"
        aria-modal="false"
        aria-label="Concept notebook"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="rr-notebook-head">
          <div>
            <span className="rr-kicker">Concept notebook</span>
            <h2>How robot programs work</h2>
          </div>
          <button type="button" className="rr-btn rr-btn--ghost" ref={closeRef} onClick={onClose}>
            Close ✕
          </button>
        </header>
        {concepts.map((c, i) => (
          <article key={c.id} className={`rr-notebook-entry${focusConcept === c.id ? ' is-focus' : ''}`} id={`concept-${c.id}`}>
            <div className="rr-notebook-no" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </div>
            <div>
              <h3>{c.title}</h3>
              <p className="rr-notebook-tag">{c.tagline}</p>
              {c.lines.map((line, k) => (
                <p key={k}>{line}</p>
              ))}
              <ConceptDiagram kind={c.diagram} />
            </div>
          </article>
        ))}
        <footer className="rr-notebook-foot">
          <p>Both ideas live in every mission: the Sequence Hall teaches order, the Loop Gallery teaches folding.</p>
        </footer>
      </aside>
    </div>
  );
}
