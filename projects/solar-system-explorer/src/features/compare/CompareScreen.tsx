// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Compare screen — aligned specimen columns (spec: "planet cards không dùng
// generic cards; dùng aligned specimen columns"). Rows share one label
// column; bars are log-scaled against ALL planets (stable across
// selections); exact mono values sit beside every bar.

import { useMemo } from 'react';
import type { AtlasCopy, PlanetData } from '../../lib/types';
import { formatAu, formatDayHours, formatNum, formatYearDays, logBarFraction } from '../atlas/engine';
import { Sphere } from '../../components/Sphere';
import { IconClose } from '../../components/Icons';

interface CompareScreenProps {
  planets: readonly PlanetData[];
  copy: AtlasCopy;
  compareIds: readonly string[];
  onToggleCompare: (planet: PlanetData) => void;
  onBack: () => void;
}

export function CompareScreen({ planets, copy, compareIds, onToggleCompare, onBack }: CompareScreenProps) {
  const c = copy.compare;
  const selected = useMemo(
    () => compareIds.map((id) => planets.find((p) => p.id === id)).filter((p): p is PlanetData => Boolean(p)),
    [compareIds, planets],
  );
  const full = selected.length >= 3;

  const allRadius = planets.map((p) => p.radiusKm);
  const allDay = planets.map((p) => p.dayHours);
  const allYear = planets.map((p) => p.yearDays);
  const allMoons = planets.map((p) => p.moons);
  const allAu = planets.map((p) => p.distanceAu);

  const rows: Array<{
    key: string;
    label: string;
    value: (p: PlanetData) => string;
    frac?: (p: PlanetData) => number;
  }> = [
    { key: 'radius', label: c.rows.radius, value: (p) => formatNum(p.radiusKm), frac: (p) => logBarFraction(p.radiusKm, allRadius) },
    { key: 'day', label: c.rows.day, value: (p) => formatDayHours(p.dayHours), frac: (p) => logBarFraction(p.dayHours, allDay) },
    { key: 'year', label: c.rows.year, value: (p) => formatYearDays(p.yearDays), frac: (p) => logBarFraction(p.yearDays, allYear) },
    {
      key: 'moons',
      label: c.rows.moons,
      value: (p) => (p.moons === 0 ? 'no moons' : p.moons === 1 ? '1 moon' : formatNum(p.moons, 0)),
      frac: (p) => Math.max(0.02, p.moons / Math.max(...allMoons)),
    },
    { key: 'distance', label: c.rows.distance, value: (p) => formatAu(p.distanceAu), frac: (p) => logBarFraction(p.distanceAu, allAu) },
  ];

  return (
    <div className="screen" role="region" aria-label={c.title}>
      <div className="screen-head">
        <h2>{c.title}</h2>
        <button type="button" className="action-btn back-btn" onClick={onBack}>
          {c.back}
        </button>
      </div>
      <p className="screen-intro">{c.intro}</p>

      <div className="compare-picker" role="group" aria-label={c.pick}>
        <span className="label-mono">{c.pick}</span>
        {planets.map((p) => {
          const active = compareIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              className="chip"
              aria-pressed={active}
              disabled={!active && full}
              style={{ ['--pigment' as string]: p.pigment }}
              onClick={() => onToggleCompare(p)}
            >
              <span className="dot" aria-hidden="true" />
              {p.name}
            </button>
          );
        })}
        <span className="sr-only" role="status">
          {full ? c.maxNote : ''}
        </span>
      </div>
      <p className="compare-note">{c.logNote}</p>

      {selected.length === 0 ? (
        <p className="screen-intro" style={{ fontStyle: 'italic' }}>
          {c.pickNone}
        </p>
      ) : (
        <div className="specimens-scroll">
        <div
          className="specimens"
          style={{
            gridTemplateColumns: `minmax(110px, 150px) repeat(${selected.length}, minmax(170px, 1fr))`,
          }}
        >
          <div className="specimen-label-col" aria-hidden="true">
            <div className="row-label" />
            {rows.map((r) => (
              <div className="row-label" key={r.key}>
                {r.label}
              </div>
            ))}
          </div>
          {selected.map((p) => (
            <div key={p.id} className="specimen" style={{ ['--pigment' as string]: p.pigment }}>
              <div className="spec-head">
                <Sphere planet={p} size={86} idPrefix={`cmp-${p.id}`} />
                <span className="name">{p.name}</span>
                <span className="cat label-mono" style={{ color: 'var(--text-soft)' }}>
                  no. {String(p.order).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  className="link-btn"
                  style={{ minHeight: 44 }}
                  onClick={() => onToggleCompare(p)}
                  aria-label={c.remove.replace('{name}', p.name)}
                >
                  <IconClose />
                </button>
              </div>
              {rows.map((r) => (
                <div
                  className={`spec-row${r.key === 'moons' ? ' moons-row' : ''}${r.key === 'distance' ? ' dist-row' : ''}`}
                  key={r.key}
                >
                  <span className="val">{r.value(p)}</span>
                  {r.frac && (
                    <div
                      className="spec-bar"
                      role="img"
                      aria-label={`${p.name} ${r.label}: ${r.value(p)} — bar length ${Math.round(
                        r.frac(p) * 100,
                      )}% of the widest value shown`}
                    >
                      <span style={{ width: `${Math.round(r.frac(p) * 100)}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        </div>
      )}
      <div className="sr-only">
        <table>
          <caption>{c.title}</caption>
          <thead>
            <tr>
              <th scope="col">{copy.dataTable.headName}</th>
              <th scope="col">{c.rows.radius}</th>
              <th scope="col">{c.rows.day}</th>
              <th scope="col">{c.rows.year}</th>
              <th scope="col">{c.rows.moons}</th>
              <th scope="col">{c.rows.distance}</th>
            </tr>
          </thead>
          <tbody>
            {selected.map((p) => (
              <tr key={p.id}>
                <th scope="row">{p.name}</th>
                <td>{formatNum(p.radiusKm)}</td>
                <td>{formatDayHours(p.dayHours)}</td>
                <td>{formatYearDays(p.yearDays)}</td>
                <td>{p.moons}</td>
                <td>{formatAu(p.distanceAu)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
