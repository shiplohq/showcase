// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Resolution memo — the readable verdict that explains the rule (spec:
// verdict/feedback EXPLAINS the rule readably). Rendered inside the case
// sheet in place of the task once the verdict is correct: the RESOLVED
// stamp lands here, after the explanation — never right after the answer.

import { useEffect, useRef } from 'react';
import type { CaseFile } from '../../lib/types';
import { categoryLabel, isPunctuation, solvedMarks } from '../investigation/engine';
import { tweenFrom } from '../../lib/gsap';
import { ArrowRightIcon, BoardIcon, PaperclipIcon } from '../../components/art';

interface Props {
  caseFile: CaseFile;
  hasNext: boolean;
  onNext: () => void;
  onBack: () => void;
}

export function ResolvePanel({ caseFile, hasNext, onNext, onBack }: Props) {
  const stampRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelRef.current) {
      tweenFrom(panelRef.current, { opacity: 0, y: 10, duration: 0.32, ease: 'power2.out' });
    }
    if (stampRef.current) {
      tweenFrom(stampRef.current, {
        scale: 1.5,
        rotate: -18,
        opacity: 0,
        duration: 0.48,
        ease: 'power3.out',
        transformOrigin: 'center center',
      });
    }
  }, []);

  return (
    <div className="resolve-panel" ref={panelRef} aria-labelledby="resolve-heading">
      <span className="resolve-panel__clip" aria-hidden="true">
        <PaperclipIcon width={24} height={24} />
      </span>
      <p className="resolve-panel__rule">{caseFile.rule}</p>
      <h2 id="resolve-heading" className="resolve-panel__heading">
        How this case works
      </h2>
      <p className="resolve-panel__text">{caseFile.explanation}</p>

      <p className="resolve-panel__fixed">
        {caseFile.kind === 'highlight' ? mendedTokens(caseFile) : caseFile.sentence}
      </p>

      <span className="resolve-panel__stamp" ref={stampRef}>
        RESOLVED
      </span>

      <div className="resolve-panel__actions">
        {hasNext ? (
          <button type="button" className="btn btn--primary" onClick={onNext}>
            Next case
            <ArrowRightIcon width={18} height={18} />
          </button>
        ) : null}
        <button type="button" className="btn" onClick={onBack}>
          <BoardIcon width={18} height={18} />
          Back to the board
        </button>
      </div>
    </div>
  );
}

/**
 * The worked example for highlight cases: the sentence with every expected
 * mark already inked in (read-only spans reusing the token classes).
 */
function mendedTokens(caseFile: Extract<CaseFile, { kind: 'highlight' }>) {
  const marks = solvedMarks(caseFile);
  const nodes: React.ReactNode[] = [];
  let pendingSpace = false;
  caseFile.tokens.forEach((word, i) => {
    const cat = marks[i];
    const punct = isPunctuation(word);
    if (!punct && pendingSpace) nodes.push(' ');
    pendingSpace = !punct;
    if (punct || !cat) {
      nodes.push(word);
      return;
    }
    nodes.push(
      <span key={i} className="token" data-cat={cat}>
        <span className="token__word">{word}</span>
        <span className="token__mark" aria-hidden="true" />
        <span className="token__chip">{categoryLabel(cat)}</span>
      </span>,
    );
  });
  return nodes;
}
