// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// End screen — the garden blooms in proportion to correct answers. No score
// table, no leaderboard: the reward is the garden itself.

import { useEffect, useRef } from 'react';
import { FlowerArt, type FlowerVariant } from '../../components/art';
import { gsap, prefersReducedMotion } from '../../lib/gsap';
import { playBloom } from '../../lib/audio';
import type { Unit } from '../../lib/types';

const VARIANTS: FlowerVariant[] = ['tulip', 'daisy', 'sunflower', 'rose'];

export function EndScreen({
  unit,
  correct,
  soundOn,
  onReplay,
  onHome,
}: {
  unit: Unit;
  correct: number;
  soundOn: boolean;
  onReplay: () => void;
  onHome: () => void;
}): JSX.Element {
  const gardenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (soundOn) playBloom();
    const el = gardenRef.current;
    if (!el || prefersReducedMotion()) return;
    const flowers = el.querySelectorAll('.end-flower');
    const tl = gsap.fromTo(
      flowers,
      { opacity: 0, scale: 0.4, transformOrigin: '50% 100%' },
      {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: 'back.out(1.4)',
        stagger: 0.09,
      },
    );
    return () => {
      tl.kill();
    };
  }, [soundOn]);

  return (
    <section className="app-screen end" aria-label="Hoàn thành">
      <h2>
        {correct === unit.questions.length ? 'Vườn nở rộ!' : 'Vườn của bạn nở hoa!'}
      </h2>
      <p>
        {unit.title} — bạn đã trả lời đúng <strong>{correct}</strong>/{unit.questions.length} câu.
      </p>
      <div className="end-garden" ref={gardenRef} aria-hidden="true">
        {Array.from({ length: correct }, (_, i) => (
          <div key={i} className="end-flower">
            <FlowerArt variant={VARIANTS[i % VARIANTS.length]} />
          </div>
        ))}
        {correct === 0 && <p className="end-empty">Lần này chưa có hoa — trồng lại nhé!</p>}
      </div>
      <div className="end-actions">
        <button type="button" className="cta-check" onClick={onReplay}>
          Trồng lại
        </button>
        <button type="button" className="why-continue" onClick={onHome}>
          Về khu vườn
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        Hoàn thành {unit.title}: đúng {correct} trên {unit.questions.length} câu.
      </p>
    </section>
  );
}
