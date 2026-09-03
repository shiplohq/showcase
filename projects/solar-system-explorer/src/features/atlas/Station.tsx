// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// One specimen station: sphere on the datum line + parchment label plate.
// Purely presentational — geometry comes from the engine layout; the
// corridor drives the view-morph tween on this element via refs.

import { useEffect, useRef } from 'react';
import type { PlanetData } from '../../lib/types';
import type { StationLayout } from './engine';
import { spinSeconds, yearArcFraction } from './engine';
import { Sphere } from '../../components/Sphere';

interface StationProps {
  planet: PlanetData;
  layout: StationLayout;
  datumY: number;
  allPlanets: readonly PlanetData[];
  mode: 'distance' | 'size' | 'time';
  selected: boolean;
  visited: boolean;
  inCompare: boolean;
  openLabel: string;
  onOpen: (planet: PlanetData, button: HTMLButtonElement) => void;
  registerEl: (id: string, el: HTMLLIElement | null) => void;
  registerSphere: (id: string, el: HTMLElement | null) => void;
}

export function Station({
  planet,
  layout,
  datumY,
  allPlanets,
  mode,
  selected,
  visited,
  inCompare,
  openLabel,
  onOpen,
  registerEl,
  registerSphere,
}: StationProps) {
  const sphereWrapRef = useRef<HTMLDivElement | null>(null);
  const isTime = mode === 'time';
  // gauges sit at 128/200 of the svg box → box = ringR × 200/128
  const size = isTime ? Math.round(layout.ringR * 1.5625) : Math.round(layout.sphereR * 2);
  // the specimen rides the ecliptic: sphere centre pinned to the datum line
  const sphereTop = Math.round(datumY - layout.boxTop - size / 2);

  useEffect(() => {
    registerSphere(planet.id, sphereWrapRef.current?.firstElementChild as HTMLElement | null ?? null);
    return () => registerSphere(planet.id, null);
  }, [planet.id, registerSphere]);

  return (
    <li
      ref={(el) => registerEl(planet.id, el)}
      className={`station${selected ? ' selected' : ''}${visited ? ' visited' : ''}`}
      style={{
        left: layout.x - layout.boxW / 2,
        top: layout.boxTop,
        width: layout.boxW,
        height: layout.boxH,
        ['--pigment' as string]: planet.pigment,
      }}
    >
      <button
        type="button"
        className="station-btn"
        aria-label={`${openLabel.replace('{name}', planet.name)}${visited ? ` (${planet.name} visited)` : ''}${
          inCompare ? ` — ${planet.name} is in compare` : ''
        }`}
        onClick={(e) => onOpen(planet, e.currentTarget)}
      >
        <span className="station-visual" ref={sphereWrapRef}>
          <Sphere
            planet={planet}
            size={size}
            idPrefix={`st-${planet.id}`}
            className="station-sphere"
            style={{ position: 'absolute', left: '50%', top: sphereTop, transform: 'translateX(-50%)' }}
            gauges={
              isTime
                ? {
                    spinSeconds: spinSeconds(planet.dayHours),
                    yearFrac: yearArcFraction(planet.yearDays, allPlanets),
                    retrograde: planet.retrograde,
                  }
                : undefined
            }
          />
        </span>
        <span className="plate">
          <span className="name">{planet.name}</span>
          <span className="cat">
            no. {String(planet.order).padStart(2, '0')} ·{' '}
            {planet.moons === 0 ? 'no moons' : planet.moons === 1 ? '1 moon' : `${planet.moons} moons`}
          </span>
          <span className="readout">
            {layout.primary}
            <br />
            <span className="sub">{layout.secondary}</span>
          </span>
        </span>
      </button>
    </li>
  );
}
