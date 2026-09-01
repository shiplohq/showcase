// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Silk overlay layer — chapter intro / survey-complete plates. Full cover,
// focus moves to the primary control, ESC returns to the map, focus restores
// to the opener on close (DESIGN_DECISIONS §13).

import { useEffect, useRef } from 'react';
import { OrbitGlyph, Probe } from '../../components/Icons';
import type { Galaxy } from '../../lib/types';

interface OverlayProps {
  kind: 'chapter' | 'complete';
  galaxy: Galaxy;
  facts: { total: number; lockedCount: number };
  onBegin: () => void;
  onExit: () => void;
}

export function Overlay({ kind, galaxy, facts, onBegin, onExit }: OverlayProps): JSX.Element {
  const primaryRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement;
    primaryRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeAndExit();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeAndExit = () => {
    (openerRef.current as HTMLElement | null)?.focus?.();
    onExit();
  };

  const chapter = kind === 'chapter';

  return (
    <div className="overlay chart-fade-in" role="dialog" aria-modal="true" aria-labelledby="overlay-title">
      <div className="overlay-plate">
        <p className="margin-label">{chapter ? 'Entering sector' : 'Sector charted'}</p>
        <h2 id="overlay-title">
          {chapter ? `${galaxy.title} · ${galaxy.constellation}` : `${galaxy.constellation} holds steady`}
        </h2>
        <p className="overlay-copy">{chapter ? galaxy.chapterCopy : `Every fact orbit in this system is locked. ${facts.lockedCount} of ${facts.total} orbits stable — the chart is yours.`}</p>
        <div className="overlay-art" aria-hidden="true">
          <Probe size={40} />
          <OrbitGlyph state={chapter ? 'unvisited' : 'locked'} size={30} />
        </div>
        <div className="overlay-actions">
          {chapter ? (
            <button ref={primaryRef} type="button" className="btn btn-primary" onClick={onBegin}>
              Begin the survey
            </button>
          ) : (
            <button ref={primaryRef} type="button" className="btn btn-primary" onClick={closeAndExit}>
              Back to the star chart
            </button>
          )}
          {chapter && (
            <button type="button" className="btn btn-quiet" onClick={closeAndExit}>
              Not now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
