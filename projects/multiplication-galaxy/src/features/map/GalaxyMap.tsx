// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Galaxy map — the 11 tables as constellation groups along a chart path
// (positions from galaxies.json constellationLayout; a chart, not a card
// grid, DESIGN_DECISIONS §7). The chart-arc layout runs ≥1200px; narrower
// viewports (incl. the whole tablet band) get the expedition grid so
// constellation hit-areas never overlap (critique P1). Arrow keys walk the
// chart path; a newly completed constellation solidifies dotted→solid once.

import { useEffect, useRef } from 'react';
import { Planet } from '../../components/Planet';
import { OrbitGlyph } from '../../components/Icons';
import { galaxyProgress } from '../mission/engine';
import { tween } from '../../lib/gsap';
import type { Content } from '../../lib/types';

interface GalaxyMapProps {
  content: Content;
  locked: Record<string, boolean>;
  onEnter: (galaxyId: string) => void;
  onOpenLog: () => void;
}

/** Miniature orbit system for a constellation group (shared geometry, tiny). */
function MiniSystem({ rings, base, band, complete }: { rings: number; base: string; band: string; complete: boolean }): JSX.Element {
  const shown = Math.min(rings, 6);
  const items: JSX.Element[] = [];
  for (let i = 0; i < shown; i++) {
    const r = 8 + i * 5.5;
    items.push(
      <circle
        key={i}
        r={r}
        fill="none"
        stroke={complete ? 'var(--mineral)' : 'var(--rule)'}
        strokeWidth="1"
        strokeDasharray={complete ? undefined : '2 3'}
      />,
    );
    // one satellite per ring, staggered angles
    const ang = (i * 2.4) % (Math.PI * 2);
    items.push(
      <circle key={`s${i}`} cx={Math.cos(ang) * r} cy={Math.sin(ang) * r} r="2.1" fill={complete ? 'var(--mineral-bright)' : 'var(--cream-dim)'} />,
    );
  }
  return (
    <svg viewBox="-34 -34 68 68" width="72" height="72" aria-hidden="true" className="mini-system">
      {items}
      <g transform="translate(-6.5 -6.5)">
        <Planet base={base} band={band} r={6.5} seed={rings} uid={`mini-${rings}-${base.slice(1)}`} />
      </g>
    </svg>
  );
}

export function GalaxyMap({ content, locked, onEnter, onOpenLog }: GalaxyMapProps): JSX.Element {
  const listRef = useRef<HTMLUListElement>(null);
  const prevComplete = useRef<Set<string> | null>(null);

  const missionsOf = (galaxyId: string) => content.missions.filter((m) => m.galaxyId === galaxyId);
  const isComplete = (galaxyId: string) => galaxyProgress(missionsOf(galaxyId), locked).complete;

  // Map lock payoff (DESIGN_DECISIONS §10): a constellation that completed
  // since the last map visit solidifies dotted→solid once, 500ms.
  useEffect(() => {
    const completeNow = new Set(content.galaxies.filter((g) => isComplete(g.id)).map((g) => g.id));
    if (prevComplete.current) {
      for (const g of content.galaxies) {
        if (completeNow.has(g.id) && !prevComplete.current.has(g.id)) {
          const group = listRef.current?.querySelector<SVGSVGElement>(`[data-galaxy="${g.id}"]`);
          if (group) {
            tween(group.querySelectorAll('circle'), { attr: { stroke: 'var(--mineral)' }, duration: 0.5, ease: 'power2.out', stagger: 0.04 });
          }
        }
      }
    }
    prevComplete.current = completeNow;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  // Arrow keys walk the chart path (roving focus across constellations).
  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('.constellation-btn') ?? []);
    if (!buttons.length) return;
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1 + buttons.length) % buttons.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    if (next >= 0) {
      e.preventDefault();
      buttons[next].focus();
    }
  };

  const totalDone = content.galaxies.reduce((acc, g) => acc + galaxyProgress(missionsOf(g.id), locked).lockedCount, 0);

  return (
    <section className="map chart-fade-in" aria-label="Galaxy map — choose a table">
      <header className="map-header">
        <div>
          <p className="margin-label">Orbital fact charts</p>
          <h1>Survey the multiplication galaxy</h1>
          <p className="map-sub">
            Eleven constellations, one per table. Fly to a system, read its planet arrays, and lock every
            orbit by answering the fact. {totalDone} of {content.missions.length} orbits locked.
          </p>
        </div>
        <button type="button" className="btn btn-quiet" onClick={onOpenLog}>
          Mission log
        </button>
      </header>

      <div className="map-stage">
        <svg className="map-path chart-fade-in" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path
            className="chart-path"
            d={content.galaxies
              .map((g, i) => {
                const cmd = i === 0 ? 'M' : 'L';
                return `${cmd}${g.constellationLayout.x} ${g.constellationLayout.y - 6}`;
              })
              .join(' ')}
            fill="none"
            stroke="var(--rule-dim)"
            strokeWidth="0.4"
            strokeDasharray="1.5 1.5"
          />
        </svg>
        <ul className="constellations" ref={listRef} onKeyDown={onKeyDown}>
          {content.galaxies.map((g) => {
            const prog = galaxyProgress(missionsOf(g.id), locked);
            return (
              <li key={g.id} className="constellation" style={{ left: `${g.constellationLayout.x}%`, top: `${g.constellationLayout.y}%` }}>
                <button
                  type="button"
                  className="constellation-btn"
                  onClick={() => onEnter(g.id)}
                  aria-label={`Table of ${g.tableNumber}, ${g.constellation}. ${prog.lockedCount} of ${prog.total} orbits locked.`}
                >
                  <span data-galaxy={g.id}>
                    <MiniSystem rings={g.tableNumber} base={g.planetStyle.base} band={g.planetStyle.band} complete={prog.complete} />
                  </span>
                  <span className={`constellation-num${prog.complete ? ' complete' : ''}`}>{g.tableNumber}</span>
                  <span className="constellation-name">{g.constellation}</span>
                  <span className="constellation-progress">
                    <OrbitGlyph state={prog.complete ? 'locked' : prog.lockedCount > 0 ? 'drifted' : 'unvisited'} size={16} />
                    <span aria-hidden="true">{prog.lockedCount}/{prog.total}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
