// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Plot — one soil bed (or the wicker basket for subtraction). Renders seeds
// at deterministic organic positions; each seed is draggable AND tappable
// (tap = remove → bag/basket — always reversible, never punished).
// The seed→sprout→flower reward plays inside .plot-growth.

import { useEffect, useRef } from 'react';
import { SeedArt, SproutStageArt } from '../../components/art';
import { gsap, prefersReducedMotion } from '../../lib/gsap';
import { seedPosition, type PlotId } from './engine';

export interface PlotProps {
  id: PlotId;
  count: number;
  label: string;
  locked: boolean;
  basket: boolean;
  isTarget: boolean;
  nudge: boolean;
  growKey: number;
  onSeedPointerDown: (plot: PlotId, seedIndex: number, e: React.PointerEvent) => void;
  onSeedTap: (plot: PlotId, seedIndex: number) => void;
}

export function Plot({
  id,
  count,
  label,
  locked,
  basket,
  isTarget,
  nudge,
  growKey,
  onSeedPointerDown,
  onSeedTap,
}: PlotProps): JSX.Element {
  const growthRef = useRef<HTMLDivElement>(null);
  const prevGrowKey = useRef(0);

  // seed → sprout → flower reward (~700ms, three stages; reduced = final).
  useEffect(() => {
    if (growKey === prevGrowKey.current) return;
    prevGrowKey.current = growKey;
    const el = growthRef.current;
    if (!el) return;
    const stages = Array.from(el.querySelectorAll<HTMLElement>('.growth-stage'));
    if (prefersReducedMotion()) {
      stages.forEach((s, i) => {
        gsap.set(s, { opacity: i === stages.length - 1 ? 1 : 0 });
      });
      return;
    }
    const tl = gsap.timeline();
    tl.set(stages, { xPercent: -50, opacity: 0, scale: 0.35, transformOrigin: '50% 100%' });
    stages.forEach((stage, i) => {
      const last = i === stages.length - 1;
      tl.to(stage, {
        opacity: 1,
        scale: 1,
        duration: last ? 0.36 : 0.18,
        ease: last ? 'back.out(1.4)' : 'power2.out',
      });
      if (!last) tl.to(stage, { opacity: 0, duration: 0.06 });
    });
    return () => {
      tl.kill();
    };
  }, [growKey]);

  return (
    <div className="plot-col">
      <div
        className={
          'plot' +
          (isTarget ? ' is-target' : '') +
          (locked ? ' is-locked' : '') +
          (basket ? ' plot-basket' : '') +
          (nudge ? ' nudge-tilt' : '')
        }
        data-plot={id}
      >
        <span className="plot-badge" aria-hidden="true">
          {count}
        </span>
        <div className="plot-seeds">
          {Array.from({ length: count }, (_, i) => {
            const pos = seedPosition(i, count);
            return (
              <button
                key={i}
                type="button"
                className="seed"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                aria-label={`${label}, hạt thứ ${i + 1}. Chạm hoặc kéo để bốc hạt ra.`}
                onPointerDown={(e) => onSeedPointerDown(id, i, e)}
                onClick={() => onSeedTap(id, i)}
              >
                <SeedArt />
              </button>
            );
          })}
        </div>
        <div className="plot-growth" ref={growthRef} aria-hidden="true">
          <div className="growth-stage" style={{ width: '58%', opacity: 0 }}>
            <SproutStageArt stage={1} />
          </div>
          <div className="growth-stage" style={{ width: '74%', opacity: 0 }}>
            <SproutStageArt stage={2} />
          </div>
          <div className="growth-stage" style={{ width: '88%', opacity: 0 }}>
            <SproutStageArt stage={3} />
          </div>
        </div>
      </div>
      <span className="plot-label">{label}</span>
    </div>
  );
}
