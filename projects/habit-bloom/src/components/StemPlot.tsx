// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Procedural botanical stem (design §1, §3): renders the deterministic
// geometry from lib/stems as flat line-art — one node per check-in, a bloom
// every 7th leaf for flowering families. Pure SVG, no raster.

import { useEffect, useMemo, useRef } from 'react';
import { buildStem, habitStats, leafSpec, bloomPath, stemDescription } from '../lib/stems';
import { fromTween } from '../lib/gsap';
import type { Habit } from '../lib/types';
import { todayIso } from '../lib/dates';

interface Props {
  habit: Habit;
  today?: string;
  /** Extra class for sizing contexts. */
  className?: string;
}

/**
 * Deterministic per-node jitter so no two leaves sit at the exact same angle.
 * Stable across renders (index-derived, no RNG state in the renderer).
 */
function nodeAngle(side: 1 | -1, index: number): number {
  const jitter = ((index * 37) % 9) - 4; // −4…+4
  return side === 1 ? -50 + jitter : -130 - jitter;
}

export function StemPlot({ habit, today = todayIso(), className }: Props) {
  const geo = useMemo(() => buildStem(habit), [habit]);
  const spec = useMemo(() => leafSpec(habit.plant), [habit.plant]);
  const stats = useMemo(() => habitStats(habit, today), [habit, today]);

  // Dense histories shrink leaves gently so a long-lived stem reads as a
  // leafy shrub instead of an unreadable overlap.
  const leafScale =
    spec.scale * (geo.nodes.length > 20 ? 0.62 : geo.nodes.length > 12 ? 0.8 : 1);

  // The freshly-added leaf (today's, when done) unfurls on mount.
  const newestRef = useRef<SVGGElement | null>(null);
  const leafCount = geo.nodes.length;
  const prevCount = useRef(leafCount);
  useEffect(() => {
    if (leafCount > prevCount.current && newestRef.current) {
      fromTween(newestRef.current, {
        scale: 0.15,
        opacity: 0,
        transformOrigin: 'left center',
        duration: 0.26,
        ease: 'power2.out',
      });
    }
    prevCount.current = leafCount;
  }, [leafCount]);

  const bloomable = habit.plant === 'blossom' || habit.plant === 'marigold';
  const description = stemDescription(habit, today);

  return (
    <svg
      className={className ?? 'stemplot'}
      viewBox="0 0 100 140"
      role="img"
      aria-label={description}
      preserveAspectRatio="xMidYMax meet"
    >
      {/* Soil line — a hairline the stem rises from. */}
      <line x1="6" y1="134" x2="94" y2="134" className="stemplot__soil" />
      <path d={geo.path} className="stemplot__stem" />
      {/* Apex bud: the growing tip. */}
      <circle cx={geo.apex.x} cy={geo.apex.y - 1.4} r={1.8} className="stemplot__apex" />

      {geo.nodes.map((node) => {
        const isNew = stats.doneToday && node.index === geo.nodes.length;
        const showBloom = node.bloom && bloomable;
        return (
          <g
            key={node.index}
            ref={isNew ? newestRef : undefined}
            className={`leaf-node leaf-node--${spec.colorKey}`}
            transform={
              showBloom
                ? `translate(${node.x.toFixed(2)} ${node.y.toFixed(2)})`
                : `translate(${node.x.toFixed(2)} ${node.y.toFixed(2)}) rotate(${nodeAngle(node.side, node.index)}) scale(${leafScale.toFixed(2)})`
            }
          >
            {showBloom ? (
              <>
                <path d={bloomPath()} className="leaf-bloom" />
                <circle r="1.5" className="leaf-bloom__heart" />
              </>
            ) : (
              <>
                <path d={spec.paths[0]} className="leaf-blade" />
                {spec.paths.slice(1).map((d, i) => (
                  <path key={i} d={d} className="leaf-vein" />
                ))}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
