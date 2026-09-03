// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// The corridor — hero surface of the exhibit: a horizontal, arrow- and
// keyboard-operable walk along the ecliptic. The page body never scrolls
// sideways; this contained region is the intentional, accessible exception
// (DESIGN_DECISIONS §7/§12/§15). View morphs tween the same stations between
// layouts (spatial continuity — GSAP, reduced-motion aware).

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AtlasCopy, PlanetData } from '../../lib/types';
import type { CorridorLayout, ViewMode } from './engine';
import { byOrder, layoutCorridor, starField } from './engine';
import { Station } from './Station';
import { IconArrowLeft, IconArrowRight } from '../../components/Icons';
import { gsap, motionFrom, prefersReducedMotion } from '../../lib/gsap';

interface CorridorProps {
  planets: readonly PlanetData[];
  mode: ViewMode;
  copy: AtlasCopy;
  selectedId: string | null;
  visitedIds: ReadonlySet<string>;
  compareIds: readonly string[];
  onOpen: (planet: PlanetData, button: HTMLButtonElement) => void;
}

export function Corridor({ planets, mode, copy, selectedId, visitedIds, compareIds, onOpen }: CorridorProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stationEls = useRef(new Map<string, HTMLLIElement>());
  const sphereEls = useRef(new Map<string, HTMLElement>());
  const prevLayout = useRef<CorridorLayout | null>(null);
  const resizing = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const view = copy.views.find((v) => v.id === mode) ?? copy.views[0];
  const ordered = useMemo(() => byOrder(planets), [planets]);

  // measure the corridor walkway itself (not the wrapper — the note strip and
  // controls row are chrome; laying out plates for a taller box clipped them)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      resizing.current = true;
      setSize({ w: Math.round(box.width), h: Math.round(box.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(
    () => layoutCorridor(planets, mode, Math.max(320, size.w), Math.max(300, size.h)),
    [planets, mode, size.w, size.h],
  );

  const stars = useMemo(
    () => (size.w > 0 ? starField(20260911, layout.totalWidth, layout.height) : []),
    [layout.totalWidth, layout.height, size.w],
  );

  // the view morph — same specimens, new hang (spatial continuity)
  useLayoutEffect(() => {
    const prev = prevLayout.current;
    prevLayout.current = layout;
    if (!prev || prev === layout) return;
    if (resizing.current) {
      resizing.current = false; // resize: re-place instantly, no theatre
      return;
    }

    // keep whichever station is nearest the viewport centre centred after the hang
    const scroller = scrollRef.current;
    let anchorId: string | null = null;
    if (scroller) {
      const centre = scroller.scrollLeft + scroller.clientWidth / 2;
      let best = Infinity;
      for (const s of prev.stations) {
        const d = Math.abs(s.x - centre);
        if (d < best) {
          best = d;
          anchorId = s.id;
        }
      }
    }

    const reduced = prefersReducedMotion();
    layout.stations.forEach((st, i) => {
      const old = prev.stations.find((p) => p.id === st.id);
      const el = stationEls.current.get(st.id);
      if (!old || !el) return;
      const delay = i * 0.018;
      motionFrom(el, {
        left: old.x - old.boxW / 2,
        top: old.boxTop,
        width: old.boxW,
        height: old.boxH,
        duration: 0.38,
        ease: 'power3.inOut',
        delay,
        overwrite: true,
      });
      const sphere = sphereEls.current.get(st.id);
      if (sphere) {
        const oldSize = prev.mode === 'time' ? old.ringR * 1.5625 : old.sphereR * 2;
        motionFrom(sphere, {
          width: oldSize,
          height: oldSize,
          top: prev.datumY - old.boxTop - oldSize / 2,
          duration: 0.38,
          ease: 'power3.inOut',
          delay,
          overwrite: true,
        });
      }
    });

    if (scroller && anchorId) {
      const target = layout.stations.find((s) => s.id === anchorId);
      if (target) {
        const to = Math.max(0, target.x - scroller.clientWidth / 2);
        if (reduced) {
          scroller.scrollLeft = to;
        } else {
          gsap.to(scroller, {
            scrollLeft: to,
            duration: 0.42,
            ease: 'power2.out',
            overwrite: true,
          });
        }
      }
    }
  }, [layout]);

  // progress rail
  const updateProgress = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const p = max <= 0 ? 1 : el.scrollLeft / max;
    setProgress(p);
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= max - 4);
  }, []);

  useEffect(() => {
    updateProgress();
  }, [layout.totalWidth, updateProgress]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const target = Math.max(
      0,
      Math.min(el.scrollWidth - el.clientWidth, el.scrollLeft + dir * el.clientWidth * 0.8),
    );
    if (prefersReducedMotion()) {
      el.scrollLeft = target;
    } else {
      gsap.to(el, { scrollLeft: target, duration: 0.42, ease: 'power2.out', overwrite: true });
    }
  };

  const focusStation = (id: string) => {
    const btn = stationEls.current.get(id)?.querySelector<HTMLButtonElement>('button');
    btn?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const ids = ordered.map((p) => p.id);
    const active = document.activeElement as HTMLElement | null;
    const activeLi = active?.closest?.('.station') as HTMLElement | null;
    const idx = activeLi ? ids.indexOf(activeLi.dataset.id ?? '') : -1;
    if (e.key === 'ArrowRight' && idx >= 0 && idx < ids.length - 1) {
      e.preventDefault();
      focusStation(ids[idx + 1]);
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      focusStation(ids[idx - 1]);
    } else if (e.key === 'Home' && idx >= 0) {
      e.preventDefault();
      focusStation(ids[0]);
    } else if (e.key === 'End' && idx >= 0) {
      e.preventDefault();
      focusStation(ids[ids.length - 1]);
    }
  };

  const registerEl = useCallback((id: string, el: HTMLLIElement | null) => {
    if (el) stationEls.current.set(id, el);
    else stationEls.current.delete(id);
  }, []);

  const registerSphere = useCallback((id: string, el: HTMLElement | null) => {
    if (el) sphereEls.current.set(id, el);
    else sphereEls.current.delete(id);
  }, []);

  const sunR = Math.min(layout.sunW * 0.62, layout.height * 0.42);
  const sunCx = layout.sunW * 0.18;

  return (
    <div className="corridor-wrap">
      <p className="corridor-note" id="corridor-note">
        <span className="tick-mark">▸</span> {view.caveat}
      </p>
      <div
        className="corridor"
        ref={scrollRef}
        onScroll={updateProgress}
        role="group"
        aria-label={copy.stations.corridorLabel.replace('{count}', String(planets.length))}
      >
        <div className="corridor-track" style={{ width: layout.totalWidth }}>
          <svg
            key={`bg-${mode}-${layout.totalWidth}-${layout.height}`}
            className="corridor-bg"
            width={layout.totalWidth}
            height={layout.height}
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <radialGradient id="sun-grad" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#f4e3b2" />
                <stop offset="55%" stopColor="#dfa955" />
                <stop offset="100%" stopColor="#8a5a22" />
              </radialGradient>
            </defs>
            {stars.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e9e3d2" opacity={s.opacity} />
            ))}
            {/* the Sun — lit doorway at the start of the hall */}
            <circle cx={sunCx} cy={layout.datumY} r={sunR} fill="url(#sun-grad)" />
            <text
              x={Math.max(10, sunCx - 18)}
              y={layout.datumY - sunR - 10}
              className="mono"
              fontSize="10.5"
              fill="#b4af9e"
              letterSpacing="2"
            >
              {(copy.stations.sunCaption ?? 'SOL · G2V').toUpperCase()}
            </text>
            {/* the ecliptic — one long datum line with station ticks */}
            <line
              x1={sunCx + sunR * 0.72}
              y1={layout.datumY}
              x2={layout.totalWidth - 16}
              y2={layout.datumY}
              stroke="var(--line)"
              strokeWidth="1.5"
            />
            {layout.stations.map((st) => {
              const p = ordered.find((pl) => pl.id === st.id);
              if (!p) return null;
              return (
                <g key={st.id}>
                  <line
                    x1={st.x}
                    y1={layout.datumY + 2}
                    x2={st.x}
                    y2={layout.height - 132}
                    stroke="var(--line-soft)"
                    strokeWidth="1"
                  />
                  <text
                    x={st.x}
                    y={layout.datumY + 18}
                    textAnchor="middle"
                    className="mono"
                    fontSize="10.5"
                    fill="#8b8676"
                    letterSpacing="1"
                  >
                    {st.tick}
                  </text>
                </g>
              );
            })}
          </svg>
          <ul
            className="corridor-stations"
            style={{ position: 'absolute', inset: 0, listStyle: 'none', margin: 0, padding: 0 }}
            onKeyDown={onKeyDown}
            onFocusCapture={(e) => {
              const li = (e.target as HTMLElement).closest?.('.station') as HTMLElement | null;
              li?.scrollIntoView({
                behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                inline: 'center',
                block: 'nearest',
              });
            }}
          >
            {ordered.map((p) => {
              const st = layout.stations.find((s) => s.id === p.id);
              if (!st) return null;
              return (
                <Station
                  key={p.id}
                  planet={p}
                  layout={st}
                  datumY={layout.datumY}
                  allPlanets={planets}
                  mode={mode}
                  selected={selectedId === p.id}
                  visited={visitedIds.has(p.id)}
                  inCompare={compareIds.includes(p.id)}
                  openLabel={copy.stations.openLabel}
                  onOpen={onOpen}
                  registerEl={registerEl}
                  registerSphere={registerSphere}
                />
              );
            })}
          </ul>
        </div>
      </div>
      <div className="corridor-controls">
        <button
          type="button"
          className="corridor-arrow"
          onClick={() => scrollByPage(-1)}
          disabled={atStart}
          aria-label={copy.stations.scrollLeft}
        >
          <IconArrowLeft />
        </button>
        <div className="progress-rail" aria-hidden="true">
          <div className="progress-fill" style={{ transform: `scaleX(${progress})` }} />
        </div>
        <span className="mono progress-pct" aria-hidden="true">
          {String(Math.round(progress * 100)).padStart(2, '0')}%
        </span>
        <span className="sr-only" role="status" aria-live="polite">
          {copy.stations.progressLabel.replace('{percent}', String(Math.round(progress * 100)))}
        </span>
        <button
          type="button"
          className="corridor-arrow"
          onClick={() => scrollByPage(1)}
          disabled={atEnd}
          aria-label={copy.stations.scrollRight}
        >
          <IconArrowRight />
        </button>
      </div>
    </div>
  );
}
