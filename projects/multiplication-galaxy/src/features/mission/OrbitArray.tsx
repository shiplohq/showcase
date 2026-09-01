// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// The array IS the orbit system: a rings × b satellites drawn as a pre-lock
// drifting ellipse system (spec: correct = messy ellipse → stable circle).
// Geometry comes from the pure engine (arrayGeometry) so map miniatures and
// the mission stage draw the same system. Drift is a per-ring GROUP transform
// (tilt + squash) — satellites are children, so they ride the same ellipse as
// their ring and follow the lock morph exactly (critique P0 fix). Dense
// systems (≥90) carry cumulative ring tally labels so the chart stays
// countable by text. All motion goes through the GSAP wrapper (reduced-motion
// collapses to final states).

import { useEffect, useRef, useState } from 'react';
import { Planet } from '../../components/Planet';
import { arrayGeometry, needsTally, satelliteRadius } from './engine';
import { gsap, prefersReducedMotion, tween } from '../../lib/gsap';
import type { Galaxy, Mission } from '../../lib/types';

interface OrbitArrayProps {
  mission: Mission;
  galaxy: Galaxy;
  /** -1 idle; 0..a-1 rings lit by the skip-count control. */
  countStep: number;
  phase: 'question' | 'locked' | 'drifted';
  /** Changes → play the lock morph. */
  lockKey: number;
  /** Changes → play the drift wobble. */
  driftKey: number;
  /** Changes → replay the array build-up (spatial comprehension, spec). */
  buildKey: number;
  /** Ring hover/touch → running-group label near the stage (null on leave). */
  onRingFocus?: (ring: number | null) => void;
}

const SIZE = 640;

export function OrbitArray({
  mission,
  galaxy,
  countStep,
  phase,
  lockKey,
  driftKey,
  buildKey,
  onRingFocus,
}: OrbitArrayProps): JSX.Element {
  const [hoverRing, setHoverRing] = useState<number | null>(null);
  const rootRef = useRef<SVGGElement>(null);
  const [a, b] = mission.factors;
  const geo = arrayGeometry(a, b);
  const satR = satelliteRadius(a, b);
  const tally = needsTally(a, b);

  // Drift transforms are owned by GSAP, never by JSX (critique-fix lesson:
  // ctx.revert() in cleanups ran AFTER React committed fresh transform
  // attributes and clobbered them with stale matrices — satellites stuck
  // mid-scale, ring tilt lost). JSX renders .ring-drift with NO transform;
  // this set re-applies fresh drift for every mission / replay.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const drifts = root.querySelectorAll<SVGGElement>('.ring-drift');
    drifts.forEach((g, i) => {
      const ring = geo.rings[i];
      if (!ring) return;
      gsap.set(g, { x: ring.ox, y: ring.oy, rotation: ring.tilt, scaleY: ring.squash, svgOrigin: '0 0' });
    });
    gsap.set(root.querySelectorAll('.lock-tick'), { opacity: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id, buildKey]);

  // Build-up on mission change / replay: rings grow from the center outward,
  // satellites fade in last (comprehension: the system is BUILT group by
  // group). Satellites animate opacity only — their translate stays JSX-owned.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const rings = root.querySelectorAll<SVGGElement>('.ring-group');
    const sats = root.querySelectorAll<SVGGElement>('.sat');
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from(rings, {
        scale: 0.55,
        opacity: 0,
        svgOrigin: '0 0',
        duration: 0.24,
        ease: 'power2.out',
        stagger: 0.09,
      });
      tl.from(sats, { opacity: 0, duration: 0.14, ease: 'power2.out', stagger: 0.012 }, '-=0.1');
    }, root);
    // kill, NOT revert — React re-renders fresh state on mission change;
    // reverting here would overwrite it with stale captured values.
    return () => ctx.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id, buildKey]);

  // Lock: every drift group levels out (tilt→0, squash→1) — ellipse becomes
  // a true circle and the satellites ride it exactly; registration ticks draw.
  useEffect(() => {
    if (lockKey === 0) return;
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      root.querySelectorAll<SVGGElement>('.ring-drift').forEach((g, i) => {
        const ring = geo.rings[i];
        tween(g, {
          x: ring?.ox ?? 0,
          y: ring?.oy ?? 0,
          rotation: 0,
          scaleY: 1,
          svgOrigin: '0 0',
          duration: 0.32,
          ease: 'back.out(1.2)',
          delay: i * 0.03,
        });
      });
      const ticks = root.querySelectorAll('.lock-tick');
      if (ticks.length) {
        tween(ticks, { opacity: 1, duration: 0.3, ease: 'power2.out', stagger: 0.04 });
      }
      const sats = root.querySelectorAll('.sat');
      if (sats.length) {
        tween(sats, { opacity: 0.45, duration: 0.12, yoyo: true, repeat: 1, stagger: 0.008, ease: 'sine.inOut', delay: 0.18 });
      }
    }, root);
    return () => ctx.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockKey]);

  // Drift: two gentle sways of the whole system — never a shake (non-punitive).
  useEffect(() => {
    if (driftKey === 0) return;
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      tween(root.querySelector('.system'), {
        rotation: 1.4,
        svgOrigin: '0 0',
        duration: 0.36,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1,
      });
    }, root);
    return () => ctx.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driftKey]);

  const ringLit = (i: number): boolean => countStep >= i;
  const ringHot = (i: number): boolean => hoverRing === i;

  return (
    <svg viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`} className="orbit-array" aria-hidden="true">
      <g ref={rootRef} className="array-root">
        <g className="system">
          {/* Graticule plate rings — faint furniture behind the system. */}
          <circle r={310} fill="none" stroke="var(--rule-dim)" strokeWidth="1" strokeDasharray="1 6" />
          <circle r={34} fill="none" stroke="var(--rule-dim)" strokeWidth="1" />

          {geo.rings.map((ring, i) => {
            const lit = ringLit(i) || phase === 'locked';
            const hot = ringHot(i);
            return (
              <g key={i} className={`ring-group${lit ? ' lit' : ''}${hot ? ' hot' : ''}`}>
                {/* Drift transform applied by GSAP (see effect above). */}
                <g className="ring-drift">
                  <circle
                    className="ring-path"
                    r={ring.radius}
                    fill="none"
                    stroke={phase === 'locked' ? 'var(--mineral)' : 'var(--cream-dim)'}
                    strokeWidth={lit || hot ? 2 : 1.2}
                    strokeDasharray={phase === 'locked' ? undefined : '3 5'}
                    opacity={lit || hot ? 1 : 0.75}
                  />
                  {/* Hit band — generous touch/hover target on the ring itself. */}
                  <circle
                    className="ring-hit"
                    r={ring.radius}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={18}
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onPointerEnter={(e) => {
                      if (e.pointerType === 'mouse') {
                        setHoverRing(i);
                        onRingFocus?.(i);
                      }
                    }}
                    onPointerLeave={() => {
                      setHoverRing((cur) => {
                        if (cur === i) onRingFocus?.(null);
                        return cur === i ? null : cur;
                      });
                    }}
                    onClick={() => {
                      setHoverRing(i);
                      onRingFocus?.(i);
                    }}
                  />
                  {/* Satellites on this ring — children of the drift group, so
                      they follow the lock morph exactly (critique P0). */}
                  {geo.satellites
                    .filter((s) => s.ring === i)
                    .map((s, j) => (
                      <g key={j} className="sat" transform={`translate(${s.x} ${s.y})`}>
                        <Planet base={galaxy.planetStyle.base} band={galaxy.planetStyle.band} r={satR} seed={i * 16 + j} uid={`${mission.id}-${i}-${j}`} />
                      </g>
                    ))}
                </g>
                {/* Dense systems: cumulative tally label per ring — the chart
                    stays countable by text when dots get small (§12). */}
                {tally && (
                  <text
                    className={`ring-tally${lit ? ' lit' : ''}`}
                    x={ring.radius + 8 + ring.ox}
                    y={4 + ring.oy}
                  >
                    {(i + 1) * b}
                  </text>
                )}
              </g>
            );
          })}

          {/* Central body — the system's planet. */}
          <g className="core">
            <Planet base={galaxy.planetStyle.base} band={galaxy.planetStyle.band} r={26} seed={99} uid={`${mission.id}-core`} />
          </g>

          {/* Registration crosses drawn in on lock. */}
          {[
            [0, -304],
            [304, 0],
            [0, 304],
            [-304, 0],
          ].map(([x, y], i) => (
            <g key={i} className="lock-tick" opacity={0} transform={`translate(${x} ${y})`} style={{ transform: 'scale(1)' }}>
              <path d="M-7 0H7M0 -7V7" stroke="var(--mineral)" strokeWidth="1.6" />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
