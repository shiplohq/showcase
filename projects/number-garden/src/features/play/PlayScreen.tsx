// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// PlayScreen — the core learning loop. Garden stage (~70% of the area) with
// soil plots, a low tool dock, and a short question banner. Three input paths
// on equal footing (mouse / touch+pen / keyboard):
//   • drag: pointer-based, works for mouse & touch uniformly, forgiving
//     targets (plots swell while dragging, 48px snap radius)
//   • tap: bag → plant into the focused plot; seed → remove (reversible)
//   • keyboard: steppers ±1 per plot are real buttons; Enter/Space on the
//     bag plants into the active plot; no pixel-drag emulation anywhere.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  BagArt,
  CloudArt,
  FenceArt,
  LeafPip,
  LeafTiltIcon,
  SeedArt,
  SproutIcon,
  SunArt,
  WateringCanArt,
} from '../../components/art';
import { Flip, prefersReducedMotion } from '../../lib/gsap';
import { playCorrect, playPlant } from '../../lib/audio';
import type { Question, Unit } from '../../lib/types';
import { TenFrame } from './TenFrame';
import { Plot } from './Plot';
import {
  ariaStatus,
  canPlant,
  canRemove,
  currentQuestion,
  isLastQuestion,
  plantSeed,
  questionState,
  removeSeed,
  shouldShowWhy,
  submit,
  template,
  type PlotId,
  type RunState,
} from './engine';
import { WhyOverlay } from '../why/WhyOverlay';

export interface PlayScreenProps {
  unit: Unit;
  soundOn: boolean;
  /** Persists correct-so-far after every correct answer (leaving mid-run
   *  never loses progress — critique P1). */
  onProgress: (unit: Unit, correct: number) => void;
  onFinish: (unit: Unit, correct: number) => void;
}

interface DragState {
  pointerId: number;
  from: 'bag' | PlotId;
  seedIndex: number;
  x: number;
  y: number;
  moved: boolean;
}

export function PlayScreen({ unit, soundOn, onProgress, onFinish }: PlayScreenProps): JSX.Element {
  const [state, setState] = useState<RunState>(() => ({
    unit,
    index: 0,
    a: 0,
    b: 0,
    bag: 0,
    correct: 0,
    feedback: 'idle',
    growKey: 0,
  }));
  const [drag, setDrag] = useState<DragState | null>(null);
  const [showWhy, setShowWhy] = useState<Question | null>(null);
  const [announced, setAnnounced] = useState('');
  /** Where a bag tap plants: the plot the child adjusted last (critique P2 —
   *  predictable mapping across units; make10 defaults to B since A is locked). */
  const [activePlot, setActivePlot] = useState<PlotId>(unit.questions[0]?.operation === 'make10' ? 'b' : 'a');

  const stageRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const advanceTimer = useRef<number | undefined>(undefined);

  // Load the first question's arrangement once content is ready.
  useEffect(() => {
    setState(questionState(unit, 0, { correct: 0 }));
  }, [unit]);

  useEffect(
    () => () => {
      window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  const q = currentQuestion(state);

  // ---- FLIP: capture seed layout before any mutation re-renders ---------- */
  const captureFlip = useCallback(() => {
    if (prefersReducedMotion() || !stageRef.current) return;
    flipState.current = Flip.getState(stageRef.current.querySelectorAll('.seed'));
  }, []);

  useLayoutEffect(() => {
    if (!flipState.current || !stageRef.current) return;
    const st = flipState.current;
    flipState.current = null;
    if (prefersReducedMotion()) return;
    Flip.from(st, {
      duration: 0.34,
      ease: 'power2.out',
      absolute: true,
      scale: true,
      onEnter: (els) => Flip.from(Flip.getState(els as unknown as Element[]), { clearProps: 'all' }),
    });
  }, [state.a, state.b]);

  // ---- actions -------------------------------------------------------------
  const mutate = useCallback(
    (fn: (s: RunState) => RunState, options?: { noFlip?: boolean }) => {
      if (!options?.noFlip) captureFlip();
      setState((s) => fn(s));
    },
    [captureFlip],
  );

  const handlePlant = useCallback(
    (plot: PlotId) => {
      if (!canPlant(state, plot)) return;
      if (soundOn) playPlant(plot === 'a' ? state.a + 1 : state.b + 1);
      mutate((s) => plantSeed(s, plot));
    },
    [state, soundOn, mutate],
  );

  const handleRemove = useCallback(
    (plot: PlotId) => {
      if (!canRemove(state, plot)) return;
      mutate((s) => removeSeed(s, plot));
    },
    [state, mutate],
  );

  const handleSubmit = useCallback(() => {
    const next = submit(state);
    if (next.feedback === 'correct') {
      if (soundOn) playCorrect();
      setState(next);
      setAnnounced(`Đúng rồi! ${template(currentQuestion(next).explanation, currentQuestion(next))}`);
      onProgress(next.unit, next.correct); // persist per answer — leaving never loses progress
      advanceTimer.current = window.setTimeout(
        () => {
          if (shouldShowWhy(next)) {
            setShowWhy(currentQuestion(next));
          } else if (isLastQuestion(next)) {
            onFinish(next.unit, next.correct);
          } else {
            setState(questionState(next.unit, next.index + 1, { correct: next.correct }));
          }
        },
        prefersReducedMotion() ? 500 : 1250,
      );
    } else {
      setState(next);
      setAnnounced('Chưa đúng — hãy đếm lại số hạt nhé.');
    }
  }, [state, soundOn, onFinish, onProgress]);

  const continueFromWhy = useCallback(() => {
    const q2 = showWhy;
    setShowWhy(null);
    if (!q2) return;
    if (isLastQuestion(state)) onFinish(state.unit, state.correct);
    else setState(questionState(state.unit, state.index + 1, { correct: state.correct }));
  }, [showWhy, state, onFinish]);

  // ---- drag (pointer events: mouse + touch + pen) ---------------------------
  const beginSeedDrag = useCallback(
    (plot: PlotId, seedIndex: number, e: React.PointerEvent) => {
      if (state.feedback === 'correct') return;
      if (plot === 'a' && q.operation === 'make10') return; // locked
      e.preventDefault();
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      setDrag({ pointerId: e.pointerId, from: plot, seedIndex, x: e.clientX, y: e.clientY, moved: false });
    },
    [state.feedback, q.operation],
  );

  const beginBagDrag = useCallback(
    (e: React.PointerEvent) => {
      if (state.bag <= 0 || state.feedback === 'correct' || q.operation === 'subtract') return;
      e.preventDefault();
      setDrag({ pointerId: e.pointerId, from: 'bag', seedIndex: -1, x: e.clientX, y: e.clientY, moved: false });
    },
    [state.bag, state.feedback, q.operation],
  );

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY, moved: true } : d));
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      const drop = hitTestPlot(e.clientX, e.clientY);
      const overBag = hitTestBag(e.clientX, e.clientY);
      const src = drag.from; // narrow once; closures keep the narrowed type
      setDrag(null);
      if (!drag.moved) {
        // A tap, not a drag — tap semantics handled by click handlers.
        return;
      }
      if (src === 'bag') {
        if (drop) handlePlant(drop);
      } else if (drop && drop !== src) {
        // Move a seed between plots: remove from source, plant in target.
        captureFlip();
        setState((s) => {
          const removed = removeSeed(s, src);
          return removed === s ? s : plantSeed(removed, drop);
        });
      } else if (overBag) {
        handleRemove(src);
      }
      // Dropped nowhere → the seed simply stays (nothing is lost, no penalty).
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, handlePlant, handleRemove, captureFlip]);

  const dropTarget = drag?.moved ? hitTestPlot(drag.x, drag.y) : null;

  // ---- derived view data -----------------------------------------------------
  const total = q.operation === 'count' ? state.a : state.a + state.b;
  const showPlotB = q.operation !== 'count';
  const plotBIsBasket = q.operation === 'subtract';
  const sumText =
    q.operation === 'count'
      ? `→ ${q.target}`
      : q.operation === 'make10'
        ? `${state.a} + ${state.b} = ${state.a + state.b}`
        : q.operation === 'add'
          ? `${state.a} + ${state.b} = ${state.a + state.b}`
          : `${state.a} + ${state.b} = ${q.operands[0]}`;
  const nudgeHint = state.feedback === 'nudge' ? template(q.hint, q) : '';
  const correctText =
    state.feedback === 'correct' ? `Đúng rồi! ${template(q.explanation, q)}` : '';

  // What the ten-frame should highlight on nudge: the cells still missing
  // toward the goal (count: target; make10: 10; add: a+b; subtract: total).
  const goalCells =
    q.operation === 'count'
      ? q.target
      : q.operation === 'make10'
        ? 10
        : q.operation === 'add'
          ? q.operands[0] + q.operands[1]
          : q.operands[0];

  return (
    <section className="app-screen play" aria-label="Màn chơi">
      <div className="q-banner">
        <h1 className="q-text" id="question-heading">
          {template(q.prompt, q)
            .split(/(\d+)/)
            .map((part, i) => (/\d/.test(part) ? <span key={i} className="q-numeral">{part}</span> : part))}
        </h1>
        <div className="pips" aria-hidden="true">
          {unit.questions.map((_, i) => {
            const done = i < state.index + (state.feedback === 'correct' ? 1 : 0);
            const active = !done && i === state.index;
            return <LeafPip key={i} state={done ? 'done' : active ? 'active' : 'todo'} />;
          })}
        </div>
      </div>

      <div className="stage" ref={stageRef}>
        <div className="stage-hill" aria-hidden="true" />
        <div className="stage-scene-art stage-clouds" aria-hidden="true">
          <CloudArt />
        </div>
        <div className="stage-scene-art stage-sun" aria-hidden="true">
          <SunArt />
        </div>
        <div className="stage-fence" aria-hidden="true">
          <FenceArt />
        </div>
        <div className="stage-watering" aria-hidden="true">
          <WateringCanArt />
        </div>

        <div className="plots">
          <Plot
            id="a"
            count={state.a}
            label="Ô đất A"
            locked={q.operation === 'make10'}
            basket={false}
            isTarget={dropTarget === 'a'}
            nudge={state.feedback === 'nudge'}
            growKey={state.growKey}
            onSeedPointerDown={beginSeedDrag}
            onSeedTap={handleRemove}
          />

          {showPlotB && (
            <>
              <div className="sum-chip" aria-hidden="true">
                <span className="sum-op">{sumText}</span>
                <span className="sum-cap">
                  {q.operation === 'subtract' ? 'luống + giỏ' : 'tổng'}
                </span>
              </div>
              <Plot
                id="b"
                count={state.b}
                label={plotBIsBasket ? 'Giỏ hạt' : 'Ô đất B'}
                locked={false}
                basket={plotBIsBasket}
                isTarget={dropTarget === 'b'}
                nudge={state.feedback === 'nudge'}
                growKey={state.growKey}
                onSeedPointerDown={beginSeedDrag}
                onSeedTap={handleRemove}
              />
            </>
          )}
        </div>
      </div>

      <div
        className="feedback"
        aria-live="polite"
        data-feedback={state.feedback}
      >
        {state.feedback === 'idle' && state.index < 2 && (
          <span className="assist">
            Chạm túi hạt để gieo — hoặc kéo hạt vào luống. Dùng nút + − cũng được nhé!
          </span>
        )}
        {state.feedback === 'correct' && (
          <span className="correct">
            <SproutIcon /> {correctText}
          </span>
        )}
        {state.feedback === 'nudge' && (
          <span className="nudge">
            <LeafTiltIcon /> {nudgeHint}
          </span>
        )}
      </div>

      <div className="dock">
        <div className="dock-bag">
          <button
            type="button"
            className={'bag-btn' + (drag?.moved && hitTestBag(drag.x, drag.y) ? ' is-target' : '')}
            aria-label={
              q.operation === 'subtract'
                ? 'Túi hạt (trống — bài này chỉ bốc hạt ra giỏ)'
                : `Túi hạt, còn ${state.bag} hạt. Chạm để gieo một hạt vào ${activePlot === 'a' ? 'ô A' : plotBIsBasket ? 'giỏ' : 'ô B'}, hoặc kéo hạt vào ô đất.`
            }
            disabled={state.bag <= 0 || q.operation === 'subtract'}
            onPointerDown={beginBagDrag}
            onClick={() => handlePlant(activePlot)}
          >
            <BagArt />
            <span className="bag-count" aria-hidden="true">
              {state.bag}
            </span>
          </button>
          <span className="bag-label" aria-hidden="true">
            túi hạt
          </span>
        </div>

        <Stepper
          caption="Ô A"
          value={state.a}
          canAdd={canPlant(state, 'a')}
          canSub={canRemove(state, 'a')}
          onAdd={() => {
            setActivePlot('a');
            handlePlant('a');
          }}
          onSub={() => {
            setActivePlot('a');
            handleRemove('a');
          }}
          addLabel="Thêm một hạt vào ô A"
          subLabel="Bớt một hạt khỏi ô A"
        />

        {showPlotB && (
          <Stepper
            caption={plotBIsBasket ? 'Giỏ' : 'Ô B'}
            value={state.b}
            canAdd={
              plotBIsBasket
                ? canRemove(state, 'a') // basket grows by taking from the bed
                : canPlant(state, 'b')
            }
            canSub={
              plotBIsBasket
                ? state.b > 0 // basket → bed
                : canRemove(state, 'b')
            }
            onAdd={() => {
              setActivePlot('b');
              if (plotBIsBasket) handleRemove('a');
              else handlePlant('b');
            }}
            onSub={() => {
              setActivePlot('b');
              if (plotBIsBasket) handlePutBackBasket();
              else handleRemove('b');
            }}
            addLabel={plotBIsBasket ? 'Bốc một hạt vào giỏ' : 'Thêm một hạt vào ô B'}
            subLabel={plotBIsBasket ? 'Trả một hạt từ giỏ vào luống' : 'Bớt một hạt khỏi ô B'}
          />
        )}

        <TenFrame
          value={total}
          hintedFrom={state.feedback === 'nudge' ? Math.min(total, goalCells) : undefined}
          label={q.operation === 'subtract' ? 'Số hạt còn lại trên luống' : 'Tổng số hạt'}
        />

        <button
          type="button"
          className="cta-check"
          onClick={handleSubmit}
          disabled={state.feedback === 'correct'}
        >
          Kiểm tra
        </button>
      </div>

      {/* Screen-reader mirror of the scene state */}
      <p className="sr-only" aria-live="polite">
        {announced}
      </p>
      <p className="sr-only" aria-live="polite">
        {ariaStatus(state)}
      </p>

      {drag?.moved && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <SeedArt />
        </div>
      )}

      {showWhy && <WhyOverlay question={showWhy} onContinue={continueFromWhy} />}
    </section>
  );

  function handlePutBackBasket() {
    // basket → bed (undo a removal)
    mutate((s) => removeSeed(s, 'b'));
  }
}

function Stepper(props: {
  caption: string;
  value: number;
  canAdd: boolean;
  canSub: boolean;
  onAdd: () => void;
  onSub: () => void;
  addLabel: string;
  subLabel: string;
}): JSX.Element {
  return (
    <div className="stepper">
      <div>
        <span className="stepper-caption">{props.caption}</span>
        <div className="stepper-row">
          <button
            type="button"
            className="step-btn"
            onClick={props.onSub}
            disabled={!props.canSub}
            aria-label={props.subLabel}
          >
            −
          </button>
          <span className="step-value" aria-hidden="true">
            {props.value}
          </span>
          <button
            type="button"
            className="step-btn"
            onClick={props.onAdd}
            disabled={!props.canAdd}
            aria-label={props.addLabel}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function hitTestPlot(x: number, y: number): PlotId | null {
  const els = document.elementsFromPoint(x, y);
  for (const el of els) {
    const plot = (el as HTMLElement).closest?.('.plot');
    if (plot) return (plot as HTMLElement).dataset.plot === 'b' ? 'b' : 'a';
  }
  return null;
}

function hitTestBag(x: number, y: number): boolean {
  return document.elementsFromPoint(x, y).some((el) => (el as HTMLElement).closest?.('.bag-btn'));
}
