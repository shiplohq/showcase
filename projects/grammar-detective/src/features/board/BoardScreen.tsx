// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Case board — masthead + dossier folders + case index cards. This is the
// landing screen; rows are full-width paper rows, not a dashboard grid.

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRightIcon,
  BoardIcon,
  BureauSeal,
  FolderIcon,
  ResetIcon,
  StampIcon,
} from '../../components/art';
import { dossierProgress, resolvedCount, totalCases } from '../investigation/engine';
import type { Dossier } from '../../lib/types';
import { tweenFrom } from '../../lib/gsap';

interface Props {
  dossiers: Dossier[];
  resolved: string[];
  onSelect: (caseId: string) => void;
  onReset: () => void;
}

export function BoardScreen({ dossiers, resolved, onSelect, onReset }: Props) {
  const done = resolvedCount(dossiers, resolved);
  const total = totalCases(dossiers);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Coming back from a case lands here silently otherwise — speak the
  // transition (title + focus) like the case screen does.
  useEffect(() => {
    document.title = 'Grammar Detective — Case Files Bureau';
    titleRef.current?.focus();
  }, []);

  // Reset is a two-tap action: first tap arms it ("tap again"), second tap
  // sweeps. No modal dialogs, no accidental data loss (progress is anonymous).
  const [armed, setArmed] = useState(false);
  const armTimer = useRef<number | null>(null);

  function armOrReset() {
    if (armed) {
      if (armTimer.current) window.clearTimeout(armTimer.current);
      setArmed(false);
      onReset();
      return;
    }
    setArmed(true);
    armTimer.current = window.setTimeout(() => setArmed(false), 4000);
  }

  useEffect(() => () => {
    if (armTimer.current) window.clearTimeout(armTimer.current);
  }, []);

  // Spatial entrance: dossier folders settle onto the desk, one after another.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (rootRef.current) {
      tweenFrom(rootRef.current.querySelectorAll('.dossier'), {
        opacity: 0,
        y: 10,
        duration: 0.18,
        stagger: 0.09,
        ease: 'power2.out',
        clearProps: 'all',
      });
    }
  }, []);

  return (
    <div className="app-frame" ref={rootRef}>
      <header className="masthead">
        <span className="masthead__seal">
          <BureauSeal width={56} height={56} />
        </span>
        <div>
          <h1 className="masthead__title" ref={titleRef} tabIndex={-1}>
            Grammar <em>Detective</em>
          </h1>
          <p className="masthead__sub">Case Files Bureau · English A1/A2</p>
        </div>
        <div className="masthead__meta">
          <p className="masthead__progress">
            <strong>{done}</strong> / {total} cases resolved
          </p>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={armOrReset}
            aria-label={
              armed
                ? 'Tap again to clear all resolved stamps'
                : 'Clear resolved stamps and start the files again'
            }
          >
            <ResetIcon width={18} height={18} />
            {armed ? 'Tap again to reset' : 'Reset progress'}
          </button>
        </div>
      </header>

      <main>
        <p className="board__intro">
          {done === total ? (
            <>
              <b>Bureau commendation</b> — every case file in the bureau is{' '}
              <b>RESOLVED</b>. The detectives' desk is clear. Reopen any file to
              practice again; the stamps stay yours.
            </>
          ) : (
            <>
              Every case file holds one broken sentence. Mark the evidence with
              your pens, rebuild the word order, then read the verdict — a case
              is only <b>RESOLVED</b> after you have read how the rule works.
            </>
          )}
        </p>

        {dossiers.map((d) => {
          const prog = dossierProgress(d, resolved);
          return (
            <section className="dossier" key={d.id} aria-labelledby={`${d.id}-title`}>
              <span className="dossier__tab">
                <FolderIcon width={16} height={16} />
                {d.code}
              </span>
              <div className="dossier__body">
                <div className="dossier__head">
                  <h2 className="dossier__title" id={`${d.id}-title`}>
                    {d.title}
                  </h2>
                  <p className="dossier__brief">{d.brief}</p>
                  <span className="dossier__count">
                    {prog.done}/{prog.total} resolved
                  </span>
                </div>

                {d.cases.map((c) => {
                  const isResolved = resolved.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      className={`case-row${isResolved ? ' case-row--resolved' : ''}`}
                      onClick={() => onSelect(c.id)}
                      aria-label={`Open case ${c.title}, ${
                        c.kind === 'highlight' ? 'mark the evidence' : 'rebuild the word order'
                      }${isResolved ? ', resolved' : ''}`}
                    >
                      <span className="case-row__no">Nº {caseNumber(dossiers, d, c.id)}</span>
                      <span className="case-row__title">{c.title}</span>
                      <span className="case-row__task">
                        {c.kind === 'highlight' ? 'Mark evidence' : 'Rebuild order'}
                      </span>
                      {isResolved ? (
                        <span className="case-row__stamp">
                          <StampIcon width={14} height={14} />
                          RESOLVED
                        </span>
                      ) : (
                        <span className="case-row__task">Open</span>
                      )}
                      <span className="case-row__chevron" aria-hidden="true">
                        <ArrowRightIcon width={18} height={18} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="footline">
        <BoardIcon width={14} height={14} style={{ verticalAlign: '-2px' }} /> Shiplo Showcase #09
        · Grammar Detective
      </footer>
    </div>
  );
}

/** Sequential case number across the whole bureau (Nº 01…12). */
function caseNumber(dossiers: Dossier[], current: Dossier, caseId: string): string {
  let n = 0;
  for (const d of dossiers) {
    for (const c of d.cases) {
      n++;
      if (d === current && c.id === caseId) return String(n).padStart(2, '0');
    }
  }
  return '00';
}
