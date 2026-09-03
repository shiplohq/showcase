// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Curator's challenge — two quiz kinds from the spec IA:
//   sort  — drag medallions into orbital order, with a full keyboard path
//           (Enter to lift, arrow keys/buttons to move) per WCAG 2.2
//           dragging-movements: drag is never the only way.
//   match — pick the planet holding a record; feedback names the fact.
// Non-punitive by design: nothing is lost on a miss, no timers anywhere.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AtlasCopy, PlanetData } from '../../lib/types';
import {
  buildMatchQuestions,
  gradeSort,
  planetById,
  seededRandom,
  shuffle,
  type SortGrade,
} from '../atlas/engine';
import { MedallionSphere } from '../../components/Sphere';
import { IconArrowLeft, IconArrowRight, IconCheck, IconReturn } from '../../components/Icons';

interface QuizScreenProps {
  planets: readonly PlanetData[];
  copy: AtlasCopy;
  bestMatch: number;
  onMatchSolved: (solved: number) => void;
  onBack: () => void;
}

type Lifted =
  | { kind: 'pool'; id: string }
  | { kind: 'slot'; id: string; slot: number }
  | null;

const DRAG_THRESHOLD = 7;

export function QuizScreen({ planets, copy, bestMatch, onMatchSolved, onBack }: QuizScreenProps) {
  const c = copy.quiz;
  const [mode, setMode] = useState<'sort' | 'match'>('sort');

  /* ---------------- sort mode ---------------- */
  const [seed, setSeed] = useState(() => 20260911);
  const ids = useMemo(() => planets.map((p) => p.id), [planets]);
  const [pool, setPool] = useState<string[]>(() => shuffle(ids, seededRandom(20260911)));
  const [placed, setPlaced] = useState<(string | null)[]>(() => Array(8).fill(null));
  const [lifted, setLifted] = useState<Lifted>(null);
  const [grade, setGrade] = useState<SortGrade | null>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);
  const [dragOver, setDragOver] = useState<number | 'pool' | null>(null);
  const drag = useRef<{
    id: string;
    from: Lifted;
    startX: number;
    startY: number;
    moved: boolean;
    pointerId: number;
  } | null>(null);

  const resort = useCallback(
    (newSeed: number) => {
      setPool(shuffle(ids, seededRandom(newSeed)));
      setPlaced(Array(8).fill(null));
      setLifted(null);
      setGrade(null);
    },
    [ids],
  );

  const placeIntoSlot = useCallback(
    (slotIndex: number) => {
      if (!lifted) return;
      setGrade(null);
      if (lifted.kind === 'pool') {
        setPool((prev) => prev.filter((id) => id !== lifted.id));
        setPlaced((prev) => {
          const next = [...prev];
          const occupant = next[slotIndex];
          if (occupant) setPool((p) => [...p, occupant]);
          next[slotIndex] = lifted.id;
          return next;
        });
      } else {
        setPlaced((prev) => {
          const next = [...prev];
          const occupant = next[slotIndex];
          next[lifted.slot] = occupant ?? null;
          next[slotIndex] = lifted.id;
          return next;
        });
      }
      setLifted(null);
    },
    [lifted],
  );

  const returnToPool = useCallback(
    (slotIndex: number, id: string) => {
      setGrade(null);
      setPlaced((prev) => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
      setPool((prev) => [...prev, id]);
      setLifted(null);
    },
    [],
  );

  const moveLiftedSlot = useCallback(
    (dir: -1 | 1) => {
      if (!lifted || lifted.kind !== 'slot') return;
      const target = lifted.slot + dir;
      if (target < 0 || target > 7) return;
      setGrade(null);
      setPlaced((prev) => {
        const next = [...prev];
        const occupant = next[target];
        next[target] = lifted.id;
        next[lifted.slot] = occupant ?? null;
        return next;
      });
      setLifted({ kind: 'slot', id: lifted.id, slot: target });
    },
    [lifted],
  );

  // pointer drag (single pointer) — tap still works; keyboard path covers the rest
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      const ghost = dragGhostRef.current;
      if (ghost) {
        ghost.style.transform = `translate(${e.clientX - 34}px, ${e.clientY - 34}px)`;
        ghost.style.opacity = '1';
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const slotEl = el?.closest?.('[data-slot]');
      const poolEl = el?.closest?.('[data-pool]');
      if (slotEl) setDragOver(Number((slotEl as HTMLElement).dataset.slot));
      else if (poolEl) setDragOver('pool');
      else setDragOver(null);
    };
    const onUp = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointerId) return;
      drag.current = null;
      const ghost = dragGhostRef.current;
      if (ghost) ghost.style.opacity = '0';
      if (!d.moved) return; // tap — let click handling do the work
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const slotEl = el?.closest?.('[data-slot]') as HTMLElement | null;
      const poolEl = el?.closest?.('[data-pool]');
      setDragOver(null);
      const id = d.id;
      if (slotEl) {
        const slotIndex = Number(slotEl.dataset.slot);
        setGrade(null);
        if (d.from?.kind === 'pool') {
          setPool((prev) => prev.filter((p) => p !== id));
          setPlaced((prev) => {
            const next = [...prev];
            const occupant = next[slotIndex];
            if (occupant) setPool((p) => [...p, occupant]);
            next[slotIndex] = id;
            return next;
          });
        } else if (d.from?.kind === 'slot') {
          const from = d.from.slot;
          setPlaced((prev) => {
            const next = [...prev];
            const occupant = next[slotIndex];
            next[slotIndex] = id;
            next[from] = occupant ?? null;
            return next;
          });
        }
        setLifted(null);
      } else if (poolEl && d.from?.kind === 'slot') {
        returnToPool(d.from.slot, id);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [returnToPool]);

  const startDrag = (e: React.PointerEvent, id: string, from: Lifted) => {
    drag.current = {
      id,
      from,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      pointerId: e.pointerId,
    };
  };

  const dragPlanet = drag.current?.id ? planetById(planets, drag.current.id) : null;

  // arrow keys move a lifted medallion between slots
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== 'sort' || !lifted || lifted.kind !== 'slot') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveLiftedSlot(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveLiftedSlot(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, lifted, moveLiftedSlot]);

  const allPlaced = placed.every((id) => id !== null);
  const sortFeedback =
    grade === null
      ? null
      : grade.complete
        ? { ok: true, text: c.correct.replace('{first}', planetById(planets, placed[0] ?? '')?.name ?? '').replace('{last}', planetById(planets, placed[7] ?? '')?.name ?? '') }
        : { ok: false, text: c.incorrect.replace('{count}', String(grade.correct)) };

  /* ---------------- match mode ---------------- */
  const [matchSeed, setMatchSeed] = useState(() => 20260911);
  const questions = useMemo(() => buildMatchQuestions(planets, seededRandom(matchSeed)), [planets, matchSeed]);
  const [qIndex, setQIndex] = useState(0);
  const [solvedIds, setSolvedIds] = useState<ReadonlySet<string>>(new Set());
  const [choice, setChoice] = useState<{ qId: string; chosenId: string; correct: boolean } | null>(null);
  const question = questions[qIndex];
  const solvedCount = solvedIds.size;

  useEffect(() => {
    onMatchSolved(solvedIds.size);
  }, [solvedIds, onMatchSolved]);

  const choose = (chosenId: string) => {
    if (!question || choice?.qId === question.id) return;
    const correct = chosenId === question.answerId;
    setChoice({ qId: question.id, chosenId, correct });
    if (correct) {
      const next = new Set(solvedIds);
      next.add(question.id);
      setSolvedIds(next);
    }
  };

  const nextRecord = () => {
    setChoice(null);
    if (qIndex + 1 < questions.length) {
      setQIndex(qIndex + 1);
    } else if (solvedCount < questions.length) {
      setQIndex(0); // another lap for the unsolved ones
    }
  };

  const reshuffleMatch = () => {
    const ns = Date.now() % 2147483647;
    setMatchSeed(ns);
    setQIndex(0);
    setSolvedIds(new Set());
    setChoice(null);
  };

  const matchFeedback = choice
    ? choice.correct
      ? { ok: true, text: c.matchCorrect.replace('{fact}', question?.fact ?? '') }
      : {
          ok: false,
          text: c.matchIncorrect
            .replace('{name}', question?.answerName ?? '')
            .replace('{fact}', question?.fact ?? ''),
        }
    : null;

  const medallion = (p: PlanetData) => (
    <>
      <MedallionSphere planet={p} />
      <span className="m-name">{p.name}</span>
      <span className="m-no">no. {String(p.order).padStart(2, '0')}</span>
    </>
  );

  return (
    <div className="screen" role="region" aria-label={c.title}>
      <div className="screen-head">
        <h2>{c.title}</h2>
        <button type="button" className="action-btn back-btn" onClick={onBack}>
          {c.back}
        </button>
      </div>
      <p className="screen-intro">{c.intro}</p>
      <div className="quiz-mode-switch" role="group" aria-label={c.title}>
        <button type="button" aria-pressed={mode === 'sort'} onClick={() => setMode('sort')}>
          {c.modeOrder}
        </button>
        <button type="button" aria-pressed={mode === 'match'} onClick={() => setMode('match')}>
          {c.modeMatch}
        </button>
      </div>

      {mode === 'sort' ? (
        <div className="quiz-deck">
          <div>
            <p className="quiz-prompt">Order the planets from the Sun outwards</p>
            <p className="quiz-sub">{c.sortIntro}</p>
            <div className="sort-slots">
              {placed.map((id, i) => {
                const p = id ? planetById(planets, id) : null;
                const isLiftedHere = lifted?.kind === 'slot' && lifted.slot === i;
                const settled = grade?.settled[i] ?? false;
                return (
                  <div
                    key={i}
                    data-slot={i}
                    className={`slot${p ? ' filled' : ''}${settled && p ? ' settled' : ''}${
                      dragOver === i ? ' slot-drop-hint' : ''
                    }`}
                  >
                    <span className="slot-no">{String(i + 1).padStart(2, '0')}</span>
                    {p ? (
                      <button
                        type="button"
                        className={`medallion${isLiftedHere ? ' lifting' : ''}${settled ? ' correct' : ''}`}
                        aria-pressed={isLiftedHere}
                        aria-label={
                          isLiftedHere
                            ? `${c.lift.replace('{name}', p.name)} — ${c.moveLeft.replace('{name}', p.name)} / ${c.moveRight.replace('{name}', p.name)} with arrow keys`
                            : `${c.lift.replace('{name}', p.name)}`
                        }
                        onPointerDown={(e) => startDrag(e, p.id, { kind: 'slot', id: p.id, slot: i })}
                        onClick={() =>
                          setLifted((prev) =>
                            prev && prev.kind === 'slot' && prev.slot === i ? null : { kind: 'slot', id: p.id, slot: i },
                          )
                        }
                        style={{ ['--pigment' as string]: p.pigment }}
                      >
                        {medallion(p)}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="medallion"
                        disabled={!lifted}
                        aria-label={
                          lifted
                            ? `${c.drop.replace('{name}', planetById(planets, lifted.id)?.name ?? '')} — ${c.sortSlot.replace('{n}', String(i + 1))}`
                            : c.sortSlot.replace('{n}', String(i + 1))
                        }
                        onClick={() => placeIntoSlot(i)}
                        style={{ borderStyle: 'dashed', opacity: lifted ? 1 : 0.35 }}
                      >
                        <span className="m-no">{c.place.replace('{name}', '')}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <span className="label-mono" style={{ color: 'var(--text-soft)', display: 'block', marginBottom: 8 }}>
              {c.sortPool}
            </span>
            <div className="pool" data-pool={true} onPointerDown={() => undefined}>
              {pool.length === 0 && (
                <span className="quiz-progress">{allPlaced ? c.allPlacedHint : c.sortPool}</span>
              )}
              {pool.map((id) => {
                const p = planetById(planets, id);
                if (!p) return null;
                const isLifted = lifted?.kind === 'pool' && lifted.id === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`medallion${isLifted ? ' lifting' : ''}`}
                    aria-pressed={isLifted}
                    aria-label={
                      isLifted
                        ? `${c.lift.replace('{name}', p.name)} — now choose a position`
                        : c.lift.replace('{name}', p.name)
                    }
                    onPointerDown={(e) => startDrag(e, id, { kind: 'pool', id })}
                    onClick={() =>
                      setLifted((prev) => (prev?.kind === 'pool' && prev.id === id ? null : { kind: 'pool', id }))
                    }
                    style={{ ['--pigment' as string]: p.pigment }}
                  >
                    {medallion(p)}
                  </button>
                );
              })}
            </div>
          </div>

          {lifted?.kind === 'slot' && (
            <div
              className="move-controls"
              role="group"
              aria-label={`${c.moveLeft.replace('{name}', planetById(planets, lifted.id)?.name ?? '')} / ${c.moveRight.replace('{name}', planetById(planets, lifted.id)?.name ?? '')}`}
            >
              <button
                type="button"
                className="corridor-arrow"
                onClick={() => moveLiftedSlot(-1)}
                disabled={lifted.slot === 0}
                aria-label={c.moveLeft.replace('{name}', planetById(planets, lifted.id)?.name ?? '')}
              >
                <IconArrowLeft />
              </button>
              <button
                type="button"
                className="corridor-arrow"
                onClick={() => moveLiftedSlot(1)}
                disabled={lifted.slot === 7}
                aria-label={c.moveRight.replace('{name}', planetById(planets, lifted.id)?.name ?? '')}
              >
                <IconArrowRight />
              </button>
              <span className="quiz-progress">
                {c.moveLeft.replace('{name}', planetById(planets, lifted.id)?.name ?? '')} · {c.moveRight.replace('{name}', planetById(planets, lifted.id)?.name ?? '')}
              </span>
            </div>
          )}
          {lifted?.kind === 'pool' && (
            <p className="quiz-progress">
              {c.lift.replace('{name}', planetById(planets, lifted.id)?.name ?? '')} — now tap a numbered position.
            </p>
          )}

          <div className="quiz-actions">
            <button
              type="button"
              className="primary-btn"
              disabled={!placed.some(Boolean)}
              onClick={() => setGrade(gradeSort(placed, planets))}
            >
              <IconCheck />
              {c.check}
            </button>
            <button
              type="button"
              className="action-btn"
              onClick={() => {
                const ns = (seed + 1) % 2147483647;
                setSeed(ns);
                resort(ns);
              }}
            >
              <IconReturn />
              {c.reset}
            </button>
          </div>
          <div className={`quiz-feedback${sortFeedback ? (sortFeedback.ok ? ' ok' : ' retry') : ''}`} role="status" aria-live="polite">
            {sortFeedback && (
              <>
                {sortFeedback.ok ? <IconCheck /> : <IconReturn />}
                <span>{sortFeedback.text}</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="quiz-deck">
          <div>
            <p className="quiz-prompt quiz-plaque">{question?.prompt}</p>
            <p className="quiz-sub">{c.matchIntro}</p>
            <div className="match-choices">
              {question?.choices.map((id) => {
                const p = planetById(planets, id);
                if (!p) return null;
                const isChoice = choice?.qId === question.id && choice.chosenId === id;
                const isAnswer = choice?.qId === question.id && id === question.answerId;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`medallion${isAnswer ? ' correct' : ''}${isChoice && !isAnswer ? ' wrong' : ''}`}
                    onClick={() => choose(id)}
                    disabled={choice?.qId === question.id}
                    aria-label={`Choose ${p.name}`}
                    style={{ ['--pigment' as string]: p.pigment }}
                  >
                    {medallion(p)}
                    {isAnswer && (
                      <span className="m-no" style={{ color: 'var(--ok)' }}>
                        <IconCheck />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={`quiz-feedback${matchFeedback ? (matchFeedback.ok ? ' ok' : ' retry') : ''}`} role="status" aria-live="polite">
            {matchFeedback && (
              <>
                {matchFeedback.ok ? <IconCheck /> : <IconReturn />}
                <span>{matchFeedback.text}</span>
              </>
            )}
          </div>
          <div className="quiz-actions">
            <button type="button" className="primary-btn" onClick={nextRecord} disabled={!choice}>
              {c.matchCheck}
            </button>
            {!choice && <span className="quiz-hint">Choose a medallion first, then continue.</span>}
            <button type="button" className="action-btn" onClick={reshuffleMatch}>
              <IconReturn />
              {c.reset}
            </button>
          </div>
          <p className="quiz-progress">
            {c.progress.replace('{solved}', String(solvedCount)).replace('{total}', String(questions.length))}
            {bestMatch > 0 ? ` · ${c.bestNote.replace('{solved}', String(bestMatch)).replace('{total}', String(questions.length))}` : ''}
          </p>
        </div>
      )}

      {/* drag ghost — follows one pointer, never traps keyboard users */}
      <div ref={dragGhostRef} className="drag-ghost" aria-hidden="true">
        {dragPlanet && <MedallionSphere planet={dragPlanet} size={68} />}
      </div>
    </div>
  );
}
