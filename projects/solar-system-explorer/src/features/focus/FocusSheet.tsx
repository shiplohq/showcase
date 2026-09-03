// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Planet specimen sheet — dialog overlay (right-side sheet on desktop,
// bottom sheet on tablet portrait / mobile). Full keyboard path: opens with
// focus inside, Tab cycles within, ESC closes and restores focus to the
// invoking station button. Every measurement is text — the sheet itself is
// the accessible alternative to the corridor's visual scales.

import { useEffect, useLayoutEffect, useRef } from 'react';
import type { AtlasCopy, PlanetData } from '../../lib/types';
import { formatAu, formatDayHours, formatKm, formatNum, formatYearDays } from '../atlas/engine';
import { Sphere } from '../../components/Sphere';
import { IconClose, IconColumns } from '../../components/Icons';
import { motionFrom } from '../../lib/gsap';

interface FocusSheetProps {
  planet: PlanetData;
  copy: AtlasCopy;
  inCompare: boolean;
  compareFull: boolean;
  onClose: () => void;
  onToggleCompare: (planet: PlanetData) => void;
}

export function FocusSheet({ planet, copy, inCompare, compareFull, onClose, onToggleCompare }: FocusSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const headRef = useRef<HTMLHeadingElement | null>(null);
  const f = copy.focus;

  useLayoutEffect(() => {
    if (!sheetRef.current) return;
    motionFrom(sheetRef.current, { xPercent: 104, duration: 0.32, ease: 'power3.out' });
  }, []);

  useEffect(() => {
    // open on the heading (DESIGN_DECISIONS §13.3) — the close button is the
    // first Tab stop after it
    headRef.current?.focus();
    const sheet = sheetRef.current;
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        // keep focus inside the sheet while it is open
        const focusables = sheet.querySelectorAll<HTMLElement>(
          'button, [href], summary, input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
    sheet.addEventListener('keydown', onKey);
    return () => sheet.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows: Array<[string, string]> = [
    [f.rows.radius, formatKm(planet.radiusKm)],
    [f.rows.day, formatDayHours(planet.dayHours)],
    [f.rows.year, formatYearDays(planet.yearDays)],
    [f.rows.moons, planet.moons === 0 ? 'no moons' : planet.moons === 1 ? '1 moon' : formatNum(planet.moons, 0)],
    [f.rows.distance, formatAu(planet.distanceAu)],
  ];

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className="sheet sheet--side"
        role="dialog"
        aria-modal="true"
        aria-label={`${planet.name} specimen sheet`}
        style={{ ['--pigment' as string]: planet.pigment }}
      >
        <div className="sheet-head">
          <div>
            <h2 ref={headRef} tabIndex={-1} style={{ outline: 'none' }}>
              {planet.name}
            </h2>
            <span className="cat-no label-mono" style={{ color: 'var(--text-soft)' }}>
              {f.catalogue.replace('{order}', String(planet.order).padStart(2, '0'))}
            </span>
          </div>
          <button ref={closeRef} type="button" className="sheet-close" onClick={onClose} aria-label={f.close}>
            <IconClose />
          </button>
        </div>
        <div className="sheet-body">
          <div className="sheet-hero">
            <Sphere planet={planet} size={190} idPrefix={`focus-${planet.id}`} />
          </div>
          <section className="sheet-section">
            <h3 className="label-mono">{f.measurementsTitle}</h3>
            <table className="measure-table">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row">{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="sheet-section">
            <h3 className="label-mono">{f.factsTitle}</h3>
            <ul className="fact-list">
              {planet.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </section>
          <div className="sheet-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => onToggleCompare(planet)}
              disabled={!inCompare && compareFull}
            >
              <IconColumns />
              {inCompare ? f.inCompare : f.addCompare}
            </button>
          </div>
          <p className="sheet-note">
            {f.sourceTitle}: {planet.sourceNote}
          </p>
        </div>
      </div>
    </>
  );
}
