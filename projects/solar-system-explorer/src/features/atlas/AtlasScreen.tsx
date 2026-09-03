// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Atlas screen: intro wall text, the corridor, and the disclosed data table
// (full text alternative of every visual scale — spec a11y requirement).

import { useMemo, useState } from 'react';
import type { AtlasCopy, PlanetData } from '../../lib/types';
import type { ViewMode } from './engine';
import { formatAu, formatDayHours, formatNum, tableRows } from './engine';
import { Corridor } from './Corridor';

interface AtlasScreenProps {
  planets: readonly PlanetData[];
  copy: AtlasCopy;
  mode: ViewMode;
  selectedId: string | null;
  visitedIds: ReadonlySet<string>;
  compareIds: readonly string[];
  onOpen: (planet: PlanetData, button: HTMLButtonElement) => void;
}

export function AtlasScreen({ planets, copy, mode, selectedId, visitedIds, compareIds, onOpen }: AtlasScreenProps) {
  const rows = useMemo(() => tableRows(planets), [planets]);
  const dt = copy.dataTable;
  const [tableOpen, setTableOpen] = useState(false);

  return (
    <div className="atlas-screen" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="exhibit-intro">
        <span className="label-mono">The permanent collection</span>
        <p>{copy.exhibit.intro}</p>
      </div>
      <Corridor
        planets={planets}
        mode={mode}
        copy={copy}
        selectedId={selectedId}
        visitedIds={visitedIds}
        compareIds={compareIds}
        onOpen={onOpen}
      />
      <details
        className="data-table-area"
        open={tableOpen}
        onToggle={(e) => setTableOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary>{tableOpen ? dt.hide : dt.toggle}</summary>
        <div className="data-table-wrap">
          <table className="data-table">
            <caption className="sr-only">{dt.caption}</caption>
            <thead>
              <tr>
                <th scope="col">{dt.headName}</th>
                <th scope="col">{dt.headOrder}</th>
                <th scope="col">{dt.headRadius}</th>
                <th scope="col">{dt.headDay}</th>
                <th scope="col">{dt.headYear}</th>
                <th scope="col">{dt.headMoons}</th>
                <th scope="col">{dt.headDistance}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.name}</th>
                  <td>{r.order}</td>
                  <td>{formatNum(r.radiusKm)}</td>
                  <td>{formatDayHours(r.dayHours)}</td>
                  <td>{formatNum(Math.round(r.yearDays))}</td>
                  <td>{r.moons}</td>
                  <td>{formatAu(r.distanceAu)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
