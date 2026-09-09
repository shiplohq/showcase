// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Periodic mini-strip — the first 20 elements as a reference rail (spec IA).
// Forged elements are stamped ultramarine; the current mission target is
// outlined safety-orange. Focus/tap on a tile reads its note aloud in the
// readout line — informational only, never hover-only.

import { useState } from 'react';
import type { ElementData } from '../lib/types';

interface PeriodicStripProps {
  elements: ElementData[];
  forgedSymbols: Set<string>;
  targetSymbol: string | null;
}

export function PeriodicStrip({ elements, forgedSymbols, targetSymbol }: PeriodicStripProps) {
  const [note, setNote] = useState<string | null>(null);

  return (
    <section className="strip" aria-label="Periodic table — first 20 elements">
      <a className="skip-link" href="#app-footer-end" onClick={(e) => { e.preventDefault(); (document.getElementById('app-footer-end') as HTMLElement | null)?.focus(); }}>
        Skip the element strip
      </a>
      <div className="strip__row">
        {elements.map((el) => {
          const forged = forgedSymbols.has(el.symbol);
          const isTarget = el.symbol === targetSymbol;
          const classes = ['strip-tile'];
          if (forged) classes.push('strip-tile--forged');
          if (isTarget) classes.push('strip-tile--target');
          return (
            <button
              key={el.symbol}
              type="button"
              className={classes.join(' ')}
              aria-label={`${el.name}, symbol ${el.symbol}, atomic number ${el.atomicNumber}.${forged ? ' Forged.' : ''}${isTarget ? ' Current mission target.' : ''} ${el.note}`}
              data-testid={`tile-${el.symbol}`}
              onFocus={() => setNote(`${el.symbol} · ${el.name} · Z=${el.atomicNumber} — ${el.note}`)}
              onClick={() => setNote(`${el.symbol} · ${el.name} · Z=${el.atomicNumber} — ${el.note}`)}
            >
              <span className="strip-tile__z" aria-hidden="true">{el.atomicNumber}</span>
              <span className="strip-tile__symbol" aria-hidden="true">{el.symbol}</span>
              {forged && (
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style={{ marginTop: 1 }}>
                  <path d="M1 5.5 L4 8 L9 2" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              )}
              {isTarget && !forged && (
                <svg width="10" height="8" viewBox="0 0 10 8" aria-hidden="true" style={{ marginTop: 1 }}>
                  <path d="M5 0 L10 8 L0 8 Z" fill="var(--orange)" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      <p className="strip__readout" aria-live="polite">
        {note ?? <span>Focus or tap an element to read its note.</span>}
      </p>
    </section>
  );
}
