// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Mission log — the local-only mastery matrix: 11 galaxies × their facts,
// cells as orbit glyphs with text values (never color-only). Houses the
// explicit Reset for anonymous local progress (spec acceptance item).

import { useState } from 'react';
import { OrbitGlyph } from '../../components/Icons';
import { galaxyProgress } from '../mission/engine';
import type { Content } from '../../lib/types';

interface MissionLogProps {
  content: Content;
  locked: Record<string, boolean>;
  onBack: () => void;
  onReset: () => void;
}

export function MissionLog({ content, locked, onBack, onReset }: MissionLogProps): JSX.Element {
  const [confirmReset, setConfirmReset] = useState(false);
  const totalDone = content.galaxies.reduce(
    (acc, g) => acc + galaxyProgress(content.missions.filter((m) => m.galaxyId === g.id), locked).lockedCount,
    0,
  );

  return (
    <section className="log chart-fade-in" aria-label="Mission log — mastery matrix">
      <header className="mission-header">
        <button type="button" className="btn btn-quiet" onClick={onBack}>
          ← Star chart
        </button>
        <p className="margin-label">Mission log · {totalDone} / {content.missions.length} orbits locked</p>
      </header>
      <h2 className="log-heading">Mastery matrix</h2>

      <p className="log-sub">
        The mastery matrix records which fact orbits hold stable. Solid orbits locked on the first try;
        ringed ones locked after a retry. This chart lives only in this browser.
      </p>

      <div className="log-table-wrap" role="region" aria-label="Mastery matrix" tabIndex={0}>
        <table className="log-table">
          <caption className="sr-only">
            Mastery matrix: one row per table, one column per fact in that table's survey.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="margin-label">Table</th>
              <th scope="col" className="margin-label">Constellation</th>
              {Array.from({ length: 6 }, (_, i) => (
                <th key={i} scope="col" className="margin-label" aria-label={`Fact ${i + 1}`}>
                  F{i + 1}
                </th>
              ))}
              <th scope="col" className="margin-label">
                Done
              </th>
            </tr>
          </thead>
          <tbody>
            {content.galaxies.map((g) => {
              const missions = content.missions.filter((m) => m.galaxyId === g.id);
              const prog = galaxyProgress(missions, locked);
              return (
                <tr key={g.id}>
                  <th scope="row" className="log-row-head">
                    <span className="log-table-num">{g.tableNumber}</span>
                  </th>
                  <td className="log-constellation">{g.constellation}</td>
                  {missions.map((m) => {
                    const present = Object.prototype.hasOwnProperty.call(locked, m.id);
                    const state = present ? (locked[m.id] === true ? 'locked' : 'drifted') : 'unvisited';
                    const label =
                      state === 'locked'
                        ? `${m.factors[0]} × ${m.factors[1]} locked on the first try`
                        : state === 'drifted'
                          ? `${m.factors[0]} × ${m.factors[1]} locked after a retry`
                          : `${m.factors[0]} × ${m.factors[1]} not yet visited`;
                    return (
                      <td key={m.id} className="log-cell">
                        <span title={label} aria-label={label} role="img">
                          <OrbitGlyph state={state} size={20} />
                        </span>
                        <span className="log-cell-value" aria-hidden="true">
                          {m.factors[0]}×{m.factors[1]}
                        </span>
                      </td>
                    );
                  })}
                  <td className="log-row-total">{prog.lockedCount}/{prog.total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="sr-only">
        Column headers F1 through F6 are the survey order of each table: times 2, times 6, find the ring
        count for times 5, times 9, find the per-ring count for times 7, and times 12.
      </p>

      <div className="log-tools">
        {confirmReset ? (
          <>
            <span id="reset-confirm-text" className="log-confirm-text">
              Clear all local progress?
            </span>
            <button
              type="button"
              className="btn"
              aria-describedby="reset-confirm-text"
              onClick={() => {
                onReset();
                setConfirmReset(false);
              }}
            >
              Yes, reset the chart
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setConfirmReset(false)}>
              Keep it
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-quiet" onClick={() => setConfirmReset(true)}>
            Reset progress
          </button>
        )}
      </div>
    </section>
  );
}
