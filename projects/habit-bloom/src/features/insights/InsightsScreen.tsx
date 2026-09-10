// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Insights — the phenology strip (spec IA screen 4): consistency pattern as
// a botanical calendar, one row per habit, one cell per day for the last 28
// days. Leaf = check-in, small dot = resting, ring = today. Descriptive
// only — no streak column, no red heatmap, no percentage shame.

import { useMemo } from 'react';
import { leafSpec } from '../../lib/stems';
import { dayWindow, formatShort } from '../../lib/dates';
import type { Habit } from '../../lib/types';

interface Props {
  habits: Habit[];
  today: string;
}

const WINDOW = 28;
const WEEKS = 4;

export function InsightsScreen({ habits, today }: Props) {
  const days = useMemo(() => dayWindow(today, WINDOW), [today]);

  const rows = useMemo(
    () =>
      habits.map((habit) => {
        const done = new Set(habit.history);
        return { habit, done };
      }),
    [habits],
  );

  const totalLeaves = habits.reduce((sum, h) => sum + new Set(h.history).size, 0);

  return (
    <section className="insights" aria-label="Insights — field calendar">
      <p className="insights__lead">
        A field calendar of the last four weeks. Every leaf is a day you
        checked in; the quiet dots are rest days — they never take anything
        away from the plant.
      </p>

      <div className="pheno">
        <div className="pheno__axis" aria-hidden="true">
          {Array.from({ length: WEEKS }, (_, w) => (
            <span key={w} className="pheno__week">
              {formatShort(days[w * 7])}
            </span>
          ))}
        </div>

        {rows.map(({ habit, done }) => {
          const spec = leafSpec(habit.plant);
          return (
            <div
              key={habit.id}
              className="pheno__row"
              role="img"
              aria-label={`${habit.name}: ${days.filter((d) => done.has(d)).length} leaves in the last ${WINDOW} days.`}
            >
              <span className="pheno__name">{habit.name}</span>
              <span className="pheno__cells">
                {days.map((day) => {
                  const isToday = day === today;
                  const weekBreak = day !== days[0] && days.indexOf(day) % 7 === 0;
                  return (
                    <span
                      key={day}
                      className={
                        'pheno__cell' +
                        (weekBreak ? ' pheno__cell--week-break' : '') +
                        (isToday ? ' is-today' : '')
                      }
                    >
                      {done.has(day) ? (
                        <svg viewBox="0 0 20 20" className="pheno__leaf" aria-hidden="true">
                          <g transform="translate(4 10) rotate(-38) scale(0.62)">
                            <path
                              d={spec.paths[0]}
                              className={`pheno__blade pheno__blade--${spec.colorKey}`}
                            />
                          </g>
                        </svg>
                      ) : (
                        <span className="pheno__rest" aria-hidden="true" />
                      )}
                    </span>
                  );
                })}
              </span>
            </div>
          );
        })}
      </div>

      <p className="insights__summary">
        The garden holds{' '}
        <strong>{totalLeaves}</strong>{' '}
        {totalLeaves === 1 ? 'leaf' : 'leaves'} across {habits.length}{' '}
        {habits.length === 1 ? 'plant' : 'plants'}. Resting days are part of growing.
      </p>
    </section>
  );
}
