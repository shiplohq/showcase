// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Why-it-works — after every 3rd correct answer the number bond appears as
// a branch tree: total on top, two parts below (part–whole made visible).
// Escape/continue returns to the next question.

import { useEffect, useRef } from 'react';
import { BondTreeArt } from '../../components/art';
import { template } from '../play/engine';
import type { Question } from '../../lib/types';

export function WhyOverlay({
  question,
  onContinue,
}: {
  question: Question;
  onContinue: () => void;
}): JSX.Element {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    btnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onContinue();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onContinue]);

  const [p0, p1] = question.bond.parts;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="why-title">
      <div className="overlay-paper">
        <h2 id="why-title">Vì sao đúng vậy?</h2>
        <BondTreeArt total={question.bond.total} parts={question.bond.parts} />
        <p className="why-copy">
          <strong>{p0}</strong> và <strong>{p1}</strong> là hai phần ghép lại thành{' '}
          <strong>{question.bond.total}</strong>.
        </p>
        <p className="why-sub">{template(question.explanation, question)}</p>
        <button ref={btnRef} type="button" className="why-continue" onClick={onContinue}>
          Tiếp tục trồng
        </button>
      </div>
    </div>
  );
}
