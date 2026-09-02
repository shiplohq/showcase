// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Case screen — shared chrome for both task types (mark evidence / rebuild
// order): metadata strip, the task itself, clue docket, verdict, and the
// resolution memo. A case only becomes RESOLVED after its explanation has
// been shown (spec: stamp sau giải thích, không chỉ sau answer).

import { useEffect, useRef, useState } from 'react';
import type {
  CaseFile,
  Category,
  Dossier,
  MarkMap,
  ReorderCase,
  Verdict,
} from '../../lib/types';
import {
  categoryLongLabel,
  highlightVerdict,
  joinTokens,
  moveCard,
  reorderVerdict,
  shuffledOrder,
  toggleMark,
} from '../investigation/engine';
import { HighlightTask } from './HighlightTask';
import { ReorderTask } from './ReorderTask';
import { ClueDocket } from './ClueDocket';
import { VerdictStrip } from './VerdictStrip';
import { ResolvePanel } from './ResolvePanel';
import { BoardIcon } from '../../components/art';

interface Props {
  dossier: Dossier;
  caseFile: CaseFile;
  caseNumber: number;
  resolved: boolean;
  onResolved: (caseId: string) => void;
  onBack: () => void;
  onNext: () => void;
  hasNext: boolean;
}

export function CaseScreen({
  dossier,
  caseFile,
  caseNumber,
  resolved,
  onResolved,
  onBack,
  onNext,
  hasNext,
}: Props) {
  const [phase, setPhase] = useState<'investigating' | 'resolved'>('investigating');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [verdictSeq, setVerdictSeq] = useState(0);
  const [clueMask, setClueMask] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Screen changes must speak: move focus to the case title and update the
  // tab title, or keyboard/SR users land on <body> after every transition
  // (impeccable Assessment A, P1).
  useEffect(() => {
    document.title = `${caseFile.title} — Grammar Detective`;
    headingRef.current?.focus();
    return () => {
      document.title = 'Grammar Detective — Case Files Bureau';
    };
  }, [caseFile.id, caseFile.title]);

  // task state
  const [marks, setMarks] = useState<MarkMap>({});
  const [activePen, setActivePen] = useState<Category>(
    caseFile.kind === 'highlight' ? caseFile.categories[0] : 'noun',
  );
  const [order, setOrder] = useState<number[]>(
    caseFile.kind === 'reorder' ? shuffledOrder(caseFile) : [],
  );

  // The stamp lands only once the explanation memo is on the desk. Fires for
  // this transition only; App's markResolved is idempotent per case id.
  useEffect(() => {
    if (phase === 'resolved') onResolved(caseFile.id);
    // eslint's exhaustive-deps is not configured in this project; phase is
    // intentionally the only trigger.
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function fileVerdict() {
    const v =
      caseFile.kind === 'highlight'
        ? highlightVerdict(caseFile, marks)
        : reorderVerdict(caseFile, order);
    setVerdict(v);
    setVerdictSeq((n) => n + 1);
    if (v.status === 'correct') setPhase('resolved');
  }

  // Touch devices have no HTML5 drag — the brief must not promise it
  // (impeccable Assessment A, P3).
  const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const taskBrief =
    (caseFile.kind === 'highlight'
      ? `Mark every ${caseFile.categories.map(categoryLongLabel).join(' and ')} in the evidence. Tap a word with the active pen — tap it again to lift the mark off.`
      : coarse
        ? 'The cards fell off the desk. Rebuild the sentence with the move buttons on each card.'
        : 'The cards fell off the desk. Rebuild the sentence — drag the cards, or use the move buttons.') +
    (resolved ? ' You resolved this file before — solving it again is good practice.' : '');

  return (
    <div className="app-frame">
      <header className="case-top">
        <button type="button" className="btn btn--ghost btn--small" onClick={onBack}>
          <BoardIcon width={18} height={18} />
          Board
        </button>
        <p className="case-top__meta">
          <span>
            Case <b>Nº {String(caseNumber).padStart(2, '0')}</b>
          </span>
          <span>{dossier.code}</span>
          <span>{dossier.title}</span>
          <span>
            Task:{' '}
            <b>{caseFile.kind === 'highlight' ? 'Mark the evidence' : 'Rebuild the order'}</b>
          </span>
          {resolved ? <span>RESOLVED</span> : null}
        </p>
      </header>

      <main>
        <section className="case-sheet" aria-labelledby="case-title">
          <div className="case-sheet__heading">
            <h1 className="case-sheet__title" id="case-title" ref={headingRef} tabIndex={-1}>
              {caseFile.title}
            </h1>
            <span className="case-sheet__task">
              {caseFile.kind === 'highlight' ? 'Mark evidence' : 'Rebuild order'}
            </span>
          </div>
          <p className="case-sheet__brief">{taskBrief}</p>

          {phase === 'investigating' ? (
            <>
              {caseFile.kind === 'highlight' ? (
                <HighlightTask
                  caseFile={caseFile}
                  marks={marks}
                  activePen={activePen}
                  onToggle={(i) => setMarks((m) => toggleMark(m, i, activePen))}
                  onClear={(i) =>
                    setMarks((m) => {
                      if (!(i in m)) return m;
                      const next = { ...m };
                      delete next[i];
                      return next;
                    })
                  }
                  onPenChange={setActivePen}
                />
              ) : (
                <ReorderTask
                  caseFile={caseFile}
                  order={order}
                  onMove={(f, t) => setOrder((o) => moveCard(o, f, t))}
                />
              )}

              <ClueDocket
                clues={caseFile.clues}
                mask={clueMask}
                onOpen={(level) => setClueMask((m) => m | (1 << (level - 1)))}
              />

              {verdict ? <VerdictStrip verdict={verdict} seq={verdictSeq} /> : null}

              <div className="case-actions">
                <button type="button" className="btn btn--primary" onClick={fileVerdict}>
                  File verdict
                </button>
              </div>
            </>
          ) : (
            <>
              <VerdictStrip verdict={verdict ?? { status: 'correct', message: 'Case closed!' }} seq={verdictSeq} />
              {caseFile.kind === 'reorder' ? (
                <SolvedRay caseFile={caseFile} order={order} />
              ) : null}
              <ResolvePanel
                caseFile={caseFile}
                hasNext={hasNext}
                onNext={onNext}
                onBack={onBack}
              />
            </>
          )}
        </section>
      </main>

      <footer className="footline">Shiplo Showcase #09 · Grammar Detective</footer>
    </div>
  );
}

/**
 * The child's own artifact, kept on the desk at resolution: the card ray in
 * the exact order they built it, controls removed (impeccable Assessment A,
 * P2 — highlight cases keep their mended sentence; reorder keeps the ray).
 */
function SolvedRay({ caseFile, order }: { caseFile: ReorderCase; order: number[] }) {
  return (
    <div className="card-ray card-ray--solved" aria-label={`Your rebuilt sentence: ${joinTokens(order.map((i) => caseFile.tokens[i]))}`}>
      {order.map((tokenIdx) => (
        <span className="word-card word-card--solved" key={tokenIdx}>
          <span className="word-card__word">{caseFile.tokens[tokenIdx]}</span>
        </span>
      ))}
    </div>
  );
}
