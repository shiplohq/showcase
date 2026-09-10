// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Habit detail — the 14-day bloom (spec IA screen 2): a horizontal branch
// where each of the last 14 days is a node. Done days carry a leaf; quiet
// days carry a resting bud. Rest is spacing and dormancy, never damage.

import { useMemo } from 'react';
import { StemPlot } from '../../components/StemPlot';
import { habitStats, leafSpec, budPath } from '../../lib/stems';
import { dayWindow, formatLong, formatShort, weekdayLetter } from '../../lib/dates';
import type { Habit } from '../../lib/types';

interface Props {
  habit: Habit;
  today: string;
  onBack: () => void;
  onToggle: (id: string) => void;
}

const DAYS = 14;

export function DetailScreen({ habit, today, onBack, onToggle }: Props) {
  const days = useMemo(() => dayWindow(today, DAYS), [today]);
  const doneSet = useMemo(() => new Set(habit.history), [habit.history]);
  const stats = habitStats(habit, today);
  const spec = leafSpec(habit.plant);

  // Branch geometry: nodes spaced along a gentle arc, oldest → newest (L→R).
  const nodes = days.map((day, i) => {
    const t = i / (DAYS - 1);
    const x = 14 + t * 172; // viewBox 200 wide
    const y = 58 - Math.sin(t * Math.PI) * 14; // slight upward arc
    return { day, x, y, done: doneSet.has(day) };
  });
  const branchPath = nodes.reduce(
    (d, n, i) =>
      i === 0
        ? `M ${n.x.toFixed(1)} ${n.y.toFixed(1)}`
        : `${d} L ${n.x.toFixed(1)} ${n.y.toFixed(1)}`,
    '',
  );

  const doneCount = nodes.filter((n) => n.done).length;

  return (
    <section className="detail" aria-label={`${habit.name} — 14-day bloom`}>
      <button type="button" className="back-btn" onClick={onBack} autoFocus>
        ← Back to the garden
      </button>

      <div className="detail__grid">
        <div className="detail__stem">
          <StemPlot habit={habit} today={today} className="stemplot stemplot--detail" />
          <p className="stem-caption">{habit.plant} · grows one leaf per check-in</p>
        </div>

        <div className="detail__body">
          <header className="detail__header">
            <h2 className="detail__name">{habit.name}</h2>
            <p className="detail__tags">
              <span className="tag">{habit.plant}</span>
              <span className="tag tag--dim">{habit.cadence}</span>
              {stats.plantedOn ? (
                <span className="tag tag--dim">planted {formatShort(stats.plantedOn)}</span>
              ) : null}
            </p>
          </header>

          <p className="detail__lead">
            {stats.leaves === 0
              ? 'A seedling waiting for its first leaf — today is a fine day to start.'
              : `${stats.leaves} ${stats.leaves === 1 ? 'leaf' : 'leaves'} so far, ${doneCount} of the last ${DAYS} days in leaf. Resting days are part of growing.`}
          </p>

          <div className="branch-wrap">
            <svg
              className="branch"
              viewBox="0 0 200 96"
              role="img"
              aria-label={`Last ${DAYS} days: ${doneCount} with leaves, ${DAYS - doneCount} resting.`}
            >
              <path d={branchPath} className="branch__stem" />
              {nodes.map((node) => (
                <g key={node.day}>
                  {node.done ? (
                    <g
                      className={`leaf-node leaf-node--${spec.colorKey}`}
                      transform={`translate(${node.x.toFixed(1)} ${node.y.toFixed(1)}) rotate(${node.day === days[days.length - 1] ? -60 : -45}) scale(0.85)`}
                    >
                      <path d={spec.paths[0]} className="leaf-blade" />
                    </g>
                  ) : (
                    <g transform={`translate(${node.x.toFixed(1)} ${node.y.toFixed(1)}) scale(0.72)`}>
                      <path d={budPath()} className="rest-bud" />
                    </g>
                  )}
                  {node.day === today ? (
                    <circle
                      cx={node.x.toFixed(1)}
                      cy={(node.y + (node.done ? 10 : 7)).toFixed(1)}
                      r="1.6"
                      className="branch__today"
                    />
                  ) : null}
                </g>
              ))}
            </svg>
            <div className="branch__axis" aria-hidden="true">
              {days.map((day) => (
                <span key={day} className={day === today ? 'axis-day is-today' : 'axis-day'}>
                  {weekdayLetter(day)}
                  <i>{formatShort(day).split(' ')[0]}</i>
                </span>
              ))}
            </div>
          </div>

          <div className="detail__actions">
            <button
              type="button"
              className={`check-btn${stats.doneToday ? ' is-done' : ''}`}
              aria-pressed={stats.doneToday}
              onClick={() => onToggle(habit.id)}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" className="check-btn__mark">
                <path d="M3.5 8.5 L6.8 11.8 L12.5 4.5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="check-btn__label">
                {stats.doneToday ? 'Leaf added today' : "Add today's leaf"}
              </span>
            </button>
            <p className="detail__dateline mono-note">{formatLong(today)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
