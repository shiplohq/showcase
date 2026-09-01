// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Procedural starfield — deterministic canvas draw, capped element count
// (≤140 points, no per-star animation — spec's 60fps/DOM-star warning).
// Print-calm: stars are cream points at three opacities plus a few
// diffraction crosses. Static by design; nothing animates here ever.

import { useEffect, useRef } from 'react';

const STAR_COUNT = 132;
const CROSS_COUNT = 7;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Starfield(): JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let disposed = false;

    const draw = () => {
      if (disposed || !canvas.isConnected) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const rand = mulberry32(0x5104);
      // Star points — three opacity tiers, cream ink.
      for (let i = 0; i < STAR_COUNT; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const tier = rand();
        const r = tier < 0.62 ? 0.8 : tier < 0.9 ? 1.2 : 1.7;
        const alpha = tier < 0.62 ? 0.22 : tier < 0.9 ? 0.4 : 0.6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(241, 232, 210, ${alpha})`;
        ctx.fill();
      }
      // A few 4-point diffraction crosses — atlas plate flavor.
      for (let i = 0; i < CROSS_COUNT; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const s = 3 + rand() * 3;
        ctx.strokeStyle = 'rgba(241, 232, 210, 0.5)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(x - s, y);
        ctx.lineTo(x + s, y);
        ctx.moveTo(x, y - s);
        ctx.lineTo(x, y + s);
        ctx.stroke();
      }
    };

    draw();
    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(draw, 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      disposed = true;
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
