// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Ledger — the mission index (spec IA: element mission list). A poster-style
// table, not a card grid: each mission is a full-width row with a big mono
// index, isotope notation and a stamped status.

import { useEffect, useRef, useState } from 'react';
import { PeriodicStrip } from '../../components/PeriodicStrip';
import type { Content } from '../../lib/types';
import { missionRowStatus, targetOf } from '../forge/engine';

interface LedgerScreenProps {
  content: Content;
  completed: string[];
  onSelect: (index: number) => void;
  onReset: () => void;
}

const STATUS_TEXT: Record<'forged' | 'open' | 'locked', string> = {
  forged: 'FORGED',
  open: 'OPEN',
  locked: 'LOCKED — forge the previous mission',
};

export function LedgerScreen({ content, completed, onSelect, onReset }: LedgerScreenProps) {
  const { missions, elements } = content;
  const [confirmReset, setConfirmReset] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const forgedSymbols = new Set(
    missions.filter((m) => completed.includes(m.id)).map((m) => m.targetElement),
  );
  const nextIndex = missions.findIndex((m) => !completed.includes(m.id));

  return (
    <div className="ledger">
      <header className="ledger__hero">
        <div>
          <h1 className="ledger__title">
            ATOM<span className="tick">/</span>FORGE
          </h1>
          <p className="ledger__subtitle">
            A workshop bench for the first 20 elements. Drag protons and neutrons into the nucleus,
            set electrons on the shells, and forge each mission — element by element, isotope by
            isotope, ion by ion.
          </p>
        </div>
        <div className="ledger__progress">
          <span className="mono-label">Forged</span>
          <span className="numeral">
            {completed.length}
            <em>/{missions.length}</em>
          </span>
          <button
            type="button"
            className="btn btn--danger-quiet"
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                resetTimer.current = window.setTimeout(() => setConfirmReset(false), 3500);
                return;
              }
              setConfirmReset(false);
              onReset();
            }}
          >
            {confirmReset ? 'Really clear? Tap again' : 'Reset progress'}
          </button>
        </div>
      </header>

      <div className="mission-rows" aria-label="Missions">
        {missions.map((mission, i) => {
          const status = missionRowStatus(missions, completed, i);
          const target = targetOf(elements, mission);
          const disabled = status === 'locked';
          return (
            <button
              key={mission.id}
              type="button"
              className="mission-row"
              disabled={disabled}
              data-testid={`mission-row-${i}`}
              aria-label={`Mission ${i + 1}: ${mission.title}. Target ${target.isotopeNotation} ${target.element.name}. ${STATUS_TEXT[status]}`}
              onClick={() => onSelect(i)}
            >
              <span className="mission-row__index" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="mission-row__name">
                <span className="mission-row__title">
                  {mission.title}
                  {i === nextIndex ? <span className="sr-only"> — next up</span> : null}
                </span>
                <span className="mission-row__meta">
                  {target.isotopeNotation} · {target.element.name} · {target.element.atomicNumber}p{' '}
                  {target.neutrons}n {target.electrons}e
                  {target.charge !== 0
                    ? target.charge > 0
                      ? ` · charge +${target.charge}`
                      : ` · charge −${Math.abs(target.charge)}`
                    : ''}
                </span>
              </span>
              <span
                className={`mission-row__status mission-row__status--${status}`}
                aria-hidden="true"
              >
                {status === 'forged' ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2 6.5 L4.8 9 L10 2.5" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                  </svg>
                ) : null}
                {status.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      <PeriodicStrip elements={elements} forgedSymbols={forgedSymbols} targetSymbol={null} />
    </div>
  );
}
