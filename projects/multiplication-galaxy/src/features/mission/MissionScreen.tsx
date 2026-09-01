// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Mission stage — the array chart (OrbitArray), the fact readout, orbital
// answer nodes and the skip-count instrument. Child-paced: no timers, no
// auto-advance; "Next fact" appears after a lock and owns the pacing.

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnswerNodes } from './AnswerNodes';
import { OrbitArray } from './OrbitArray';
import { DriftIcon, LockRingIcon, Probe } from '../../components/Icons';
import {
  ariaChart,
  choose,
  countStep as stepCount,
  countValue,
  currentMission,
  feedbackCopy,
  headline,
  isLastMission,
  next as nextMission,
  startRun,
} from './engine';
import { tween } from '../../lib/gsap';
import type { Galaxy, Mission } from '../../lib/types';

interface MissionScreenProps {
  galaxy: Galaxy;
  missions: Mission[];
  /** Start at the first uncompleted fact (from anonymous local progress). */
  locked: Record<string, boolean>;
  onLock: (missionId: string, firstTry: boolean) => void;
  onExit: () => void;
  onComplete: () => void;
}

/** Auto skip-count cadence (spec motion direction: 260ms per ring). */
const COUNT_CADENCE_MS = 260;

export function MissionScreen({ galaxy, missions, locked, onLock, onExit, onComplete }: MissionScreenProps): JSX.Element {
  // Resume where the child left off — initialized directly in state (no flash
  // of the wrong fact, critique P2).
  const startIndex = useMemo(() => {
    const first = missions.findIndex((m) => locked[m.id] !== true);
    return first === -1 ? 0 : first;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [run, setRun] = useState(() => {
    const r = startRun(galaxy, missions);
    return startIndex > 0 ? { ...r, index: startIndex } : r;
  });
  const [buildKey, setBuildKey] = useState(0);
  const [ringLabel, setRingLabel] = useState<number | null>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const announced = useRef(-1);
  const countTimer = useRef<number | undefined>(undefined);

  const mission = currentMission(run);
  const feedback = feedbackCopy(run);
  const countLabel = countValue(run);
  const counting = run.countStep >= 0;

  const stopCountTimer = () => {
    window.clearInterval(countTimer.current);
    countTimer.current = undefined;
  };

  // Probe transfer: eases in along a shallow arc when the stage mounts
  // (spatial continuity between map and mission — spec: MotionPath cho probe).
  useEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    tween(probe, {
      opacity: 1,
      duration: 0.42,
      ease: 'power3.inOut',
      motionPath: { path: [{ x: 0, y: 0 }, { x: 140, y: -110 }, { x: 300, y: -60 }], curviness: 1.4 },
    });
  }, []);

  // Lock side effects: record progress exactly once per mission.
  useEffect(() => {
    if (run.phase === 'locked' && announced.current !== run.index) {
      announced.current = run.index;
      onLock(mission.id, run.attempts === 1);
    }
  }, [run.phase, run.index, run.attempts, mission.id, onLock]);

  // Stop the auto skip-count when leaving the screen / changing mission.
  useEffect(() => stopCountTimer, []);

  const pick = (value: number) => {
    setRun((r) => choose(r, value));
  };

  /** Auto skip-count: rings light one at a time at a 260ms cadence, with the
   *  running total narrated — cancelable (spec §3.2, critique P2). */
  const startAutoCount = () => {
    stopCountTimer();
    setRun((r) => stepCount({ ...r, countStep: -1 }, 1));
    countTimer.current = window.setInterval(() => {
      setRun((r) => {
        const rings = currentMission(r).factors[0];
        if (r.countStep >= rings - 1) {
          stopCountTimer();
          return r;
        }
        return stepCount(r, 1);
      });
    }, COUNT_CADENCE_MS);
  };

  const resetCount = () => {
    stopCountTimer();
    setRun((r) => ({ ...r, countStep: -1 }));
  };

  const replayArray = () => {
    if (run.phase === 'locked') return;
    resetCount();
    setBuildKey((k) => k + 1);
  };

  const advance = () => {
    if (isLastMission(run)) {
      onComplete();
      return;
    }
    announced.current = -1;
    stopCountTimer();
    setRingLabel(null);
    setRun((r) => nextMission(r));
    setBuildKey((k) => k + 1);
  };

  const [a, b] = mission.factors;
  const totalBadge =
    mission.representation === 'missingFactor'
      ? `${a * b} satellites · ${mission.missing === 'a' ? '? rings' : '? per ring'}`
      : null;

  return (
    <section className="mission chart-fade-in" aria-label={`Mission: ${galaxy.title}`}>
      <header className="mission-header">
        <button type="button" className="btn btn-quiet" onClick={onExit}>
          ← Star chart
        </button>
        <p className="margin-label">
          {galaxy.constellation} · Table of {galaxy.tableNumber} · Fact {run.index + 1} of {missions.length}
        </p>
      </header>

      <div className="mission-body">
        <div className="stage">
          <div className="probe" ref={probeRef} aria-hidden="true">
            <Probe size={34} />
          </div>
          <h1 className="fact-headline">{headline(mission)}</h1>
          <div className="stage-chart">
            <OrbitArray
              mission={mission}
              galaxy={galaxy}
              countStep={run.countStep}
              phase={run.phase}
              lockKey={run.lockKey}
              driftKey={run.driftKey}
              buildKey={buildKey}
              onRingFocus={setRingLabel}
            />
            <p className={`skip-label${counting ? ' on' : ''}`} aria-hidden={counting ? undefined : true}>
              {counting ? `${countLabel}` : ''}
            </p>
            {totalBadge && (
              <p className="total-badge margin-label" aria-hidden="true">
                {totalBadge}
              </p>
            )}
            <p className="sr-only" role="status" aria-live="polite">
              {counting ? `${countLabel} satellites` : ''}
            </p>
          </div>
          <p className="mission-prompt">{mission.prompt}</p>
          <p className="sr-only">{ariaChart(run)}</p>
          <div
            className={`live-feedback stage-feedback${feedback ? ' ' + feedback.kind : ''}`}
            role="status"
            aria-live="polite"
          >
            {feedback?.kind === 'locked' && <LockRingIcon />}
            {feedback?.kind === 'drift' && <DriftIcon className="drift-sway" />}
            <span>{feedback?.text ?? ''}</span>
          </div>
        </div>

        <aside className="instruments" aria-label="Instruments">
          <p className="margin-label">Answer nodes</p>
          <AnswerNodes
            options={mission.distractors}
            answer={mission.answer}
            picked={run.picked}
            phase={run.phase}
            onPick={pick}
            driftKey={run.driftKey}
          />
          <div className="instrument-row">
            {counting ? (
              <>
                <button type="button" className="btn" onClick={resetCount}>
                  Reset count
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn count-btn" onClick={startAutoCount}>
                  Count by rings
                </button>
                <button type="button" className="btn btn-quiet replay-btn" onClick={replayArray} disabled={run.phase === 'locked'}>
                  Rebuild the array
                </button>
              </>
            )}
          </div>
          {/* Compact feedback beside the answer nodes on narrow screens (the
              stage-side strip can be scrolled out of view there). */}
          <div
            className={`live-feedback dock-feedback${feedback ? ' ' + feedback.kind : ''}`}
            role="status"
            aria-live="polite"
          >
            {feedback?.kind === 'locked' && <LockRingIcon size={18} />}
            {feedback?.kind === 'drift' && <DriftIcon size={18} className="drift-sway" />}
            <span>{feedback?.text ?? ''}</span>
          </div>
          {run.phase === 'locked' && (
            <button type="button" className="btn btn-primary next-fact" onClick={advance} autoFocus>
              {isLastMission(run) ? 'Complete the survey →' : 'Next fact →'}
            </button>
          )}
          <p className="instrument-note">
            {ringLabel !== null
              ? `${ringLabel + 1} ring${ringLabel > 0 ? 's' : ''} · ${(ringLabel + 1) * b} satellites`
              : mission.representation === 'array'
                ? `${a} rings · ${b} satellites each`
                : mission.missing === 'a'
                  ? `? rings · ${b} satellites each`
                  : `${a} rings · ? satellites each`}
          </p>
        </aside>
      </div>
    </section>
  );
}
