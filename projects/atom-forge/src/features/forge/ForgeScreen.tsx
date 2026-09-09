// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Forge — the atom builder (spec IA). Three input paths are first-class:
//   1. pointer drag from the tray (mouse / touch / pen),
//   2. tap a tray token → particle flies to its default zone,
//   3. keyboard + touch steppers on every zone (nucleus, each shell).
// Live counters (Z · N · e · A · charge) and the identity readout update on
// every particle; a build that matches the mission auto-forges (spec).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AtomCanvas, CENTER, VIEW, zoneAnchor, zoneFromDistance } from './AtomCanvas';
import { ParticleTray } from './ParticleTray';
import {
  addElectron,
  addNeutron,
  addProton,
  buildSummary,
  capacityOf,
  chargeCopy,
  chargeOf,
  electronCount,
  emptyBuild,
  evaluate,
  isotopeNotation,
  massNumberOf,
  removeElectron,
  removeNeutron,
  removeProton,
  targetOf,
  MAX_NEUTRONS,
  MAX_PROTONS,
  type BuildState,
  type ParticleKind,
} from './engine';
import { RevealOverlay } from '../reveal/RevealOverlay';
import { PeriodicStrip } from '../../components/PeriodicStrip';
import type { Content, Mission } from '../../lib/types';
import { animate, gsap, prefersReducedMotion } from '../../lib/gsap';

interface ForgeScreenProps {
  content: Content;
  mission: Mission;
  missionIndex: number;
  isLast: boolean;
  completed: string[];
  onForged: (missionId: string) => void;
  onExit: () => void;
  onNext: () => void;
}

type Ghost = { kind: ParticleKind; x: number; y: number; origin: DOMRect } | null;

export function ForgeScreen({
  content,
  mission,
  missionIndex,
  isLast,
  completed,
  onForged,
  onExit,
  onNext,
}: ForgeScreenProps) {
  const { elements } = content;
  const [build, setBuild] = useState<BuildState>(() => emptyBuild());
  const [ghost, setGhost] = useState<Ghost>(null);
  const [dragOver, setDragOver] = useState<'nucleus' | number | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [shellFlash, setShellFlash] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const flyLayerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastForgedMission = useRef<string | null>(null);
  const dragKindRef = useRef<ParticleKind | null>(null);
  const dragOriginRef = useRef<DOMRect | null>(null);
  const clearTimer = useRef<number | undefined>(undefined);
  // Always-fresh mirror of `build`: `place()` must read the CURRENT build even
  // when two placements land inside one React batch (rapid clicks / script
  // bursts) — otherwise the second silently overwrites the first (assessment
  // Riley: six same-tick clicks produced Z=1).
  const buildRef = useRef(build);
  buildRef.current = build;

  const target = useMemo(() => targetOf(elements, mission), [elements, mission]);
  const visibleShells = Math.max(target.config.length, 2);
  const evaluation = useMemo(() => evaluate(elements, mission, build), [elements, mission, build]);
  const identity = evaluation.identity;
  const summary = useMemo(() => buildSummary(build, elements), [build, elements]);

  // Reset the bench when the mission changes. Keyboard users get a
  // predictable focus start point at the top of the new bench.
  useEffect(() => {
    setBuild(emptyBuild());
    setReveal(false);
    setBlocked(null);
    setConfirmClear(false);
    setBriefOpen(false);
    lastForgedMission.current = null;
    rootRef.current?.focus({ preventScroll: true });
    return () => window.clearTimeout(clearTimer.current);
  }, [mission.id]);

  // While the reveal dialog is open the bench beneath is inert (a11y: the
  // modal owns focus; background controls are unreachable).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (reveal) {
      root.setAttribute('inert', '');
      root.setAttribute('aria-hidden', 'true');
    } else {
      root.removeAttribute('inert');
      root.removeAttribute('aria-hidden');
    }
  }, [reveal]);

  // Focus must land on the bench AFTER the re-render clears `inert` — an
  // inert element silently refuses .focus() and keyboard users drop to <body>.
  const returnFocusToBench = useCallback(() => {
    requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
  }, []);

  // Auto-forge the moment the build matches (spec: valid → reveal). After the
  // overlay has been dismissed for this visit, a matching build still earns
  // an inline FORGED stamp in the readout — no dead-end on rebuild.
  useEffect(() => {
    if (evaluation.status === 'forged' && lastForgedMission.current !== mission.id) {
      lastForgedMission.current = mission.id;
      setReveal(true);
      onForged(mission.id);
    }
  }, [evaluation.status, mission.id, onForged]);

  // ------------------------------------------------------------------
  // Placement
  // ------------------------------------------------------------------

  const shellJustFilled = useCallback((prev: BuildState, next: BuildState) => {
    for (let i = 0; i < Math.max(prev.shells.length, next.shells.length); i++) {
      const before = prev.shells[i] ?? 0;
      const after = next.shells[i] ?? 0;
      if (after > before && after === capacityOf(i)) return i;
    }
    return null;
  }, []);

  const commit = useCallback(
    (prev: BuildState, next: BuildState) => {
      const flash = shellJustFilled(prev, next);
      if (flash !== null) setShellFlash(flash);
      setBuild(next);
    },
    [shellJustFilled],
  );

  const place = useCallback(
    (kind: ParticleKind, zone: 'nucleus' | number): boolean => {
      if (reveal) return false;
      const current = buildRef.current;
      if (kind === 'proton' || kind === 'neutron') {
        if (zone !== 'nucleus') {
          setBlocked(
            kind === 'proton'
              ? 'Protons belong in the nucleus — drop them on the centre zone.'
              : 'Neutrons belong in the nucleus — drop them on the centre zone.',
          );
          return false;
        }
        const outcome = kind === 'proton' ? addProton(current) : addNeutron(current);
        if (!outcome.ok) {
          setBlocked(outcome.reason ?? null);
          return false;
        }
        setBlocked(null);
        buildRef.current = outcome.build;
        commit(current, outcome.build);
        return true;
      }
      if (typeof zone !== 'number') {
        setBlocked('Electrons ride the shells — drop them on a ring, not the nucleus.');
        return false;
      }
      const outcome = addElectron(current, zone, visibleShells);
      if (!outcome.ok) {
        setBlocked(outcome.reason ?? null);
        return false;
      }
      setBlocked(null);
      buildRef.current = outcome.build;
      commit(current, outcome.build);
      return true;
    },
    [commit, reveal, visibleShells],
  );

  const removeParticle = useCallback(
    (kind: 'proton' | 'neutron' | 'electron', shellIndex?: number) => {
      if (reveal) return;
      setBuild((b) => {
        if (kind === 'proton') return removeProton(b);
        if (kind === 'neutron') return removeNeutron(b);
        return removeElectron(b, shellIndex ?? b.shells.length - 1);
      });
      setBlocked(null);
    },
    [reveal],
  );

  /** Default zone for tap-to-place: p/n → nucleus; e → innermost free shell. */
  const defaultZone = useCallback(
    (kind: ParticleKind): 'nucleus' | number | null => {
      if (kind !== 'electron') return 'nucleus';
      for (let i = 0; i < visibleShells; i++) {
        if ((build.shells[i] ?? 0) < capacityOf(i)) return i;
      }
      return null;
    },
    [build.shells, visibleShells],
  );

  // ------------------------------------------------------------------
  // Fly-disc (spatial continuity: tray/stepper → zone), 280ms power2.out
  // ------------------------------------------------------------------

  const flyToZone = useCallback(
    (kind: ParticleKind, from: { x: number; y: number }, zone: 'nucleus' | number) => {
      const canvas = canvasRef.current;
      const layer = flyLayerRef.current;
      if (!canvas || !layer) return;
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width / VIEW;
      const anchor = zoneAnchor(zone);
      const to = {
        x: rect.left + (CENTER + (anchor.x - CENTER)) * scale,
        y: rect.top + (CENTER + (anchor.y - CENTER)) * scale,
      };
      const disc = document.createElement('div');
      disc.className = 'fly-ghost';
      disc.style.left = '0';
      disc.style.top = '0';
      disc.style.transform = `translate(${from.x - 12}px, ${from.y - 12}px)`;
      disc.innerHTML = kindDiscHtml(kind);
      layer.appendChild(disc);
      animate(
        () => {
          gsap.to(disc, {
            x: to.x - from.x,
            y: to.y - from.y,
            duration: 0.28,
            ease: 'power2.out',
            onComplete: () => disc.remove(),
          });
        },
        () => disc.remove(),
      );
    },
    [],
  );

  const flyBack = useCallback((g: NonNullable<Ghost>) => {
    const layer = flyLayerRef.current;
    if (!layer) return;
    const disc = document.createElement('div');
    disc.className = 'fly-ghost';
    disc.style.left = '0';
    disc.style.top = '0';
    disc.style.transform = `translate(${g.x - 12}px, ${g.y - 12}px)`;
    disc.innerHTML = kindDiscHtml(g.kind);
    layer.appendChild(disc);
    animate(
      () => {
        gsap.to(disc, {
          x: g.origin.left + g.origin.width / 2 - g.x,
          y: g.origin.top + g.origin.height / 2 - g.y,
          duration: 0.22,
          ease: 'power2.in',
          onComplete: () => disc.remove(),
        });
      },
      () => disc.remove(),
    );
  }, []);

  // ------------------------------------------------------------------
  // Pointer drag plumbing
  // ------------------------------------------------------------------

  const zoneAt = useCallback(
    (clientX: number, clientY: number): 'nucleus' | number | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width / VIEW || 1;
      const dx = (clientX - (rect.left + rect.width / 2)) / scale;
      const dy = (clientY - (rect.top + rect.height / 2)) / scale;
      return zoneFromDistance(Math.hypot(dx, dy), visibleShells);
    },
    [visibleShells],
  );

  const handleDragStart = useCallback((kind: ParticleKind, origin: DOMRect) => {
    dragKindRef.current = kind;
    dragOriginRef.current = origin;
    setBlocked(null);
    setGhost({ kind, x: origin.left + origin.width / 2, y: origin.top + origin.height / 2, origin });
  }, []);

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      setGhost((g) => (g ? { ...g, x: clientX, y: clientY } : g));
      setDragOver(zoneAt(clientX, clientY));
    },
    [zoneAt],
  );

  const handleDragEnd = useCallback(
    (clientX: number, clientY: number) => {
      const kind = dragKindRef.current;
      const origin = dragOriginRef.current;
      dragKindRef.current = null;
      dragOriginRef.current = null;
      setDragOver(null);
      setGhost((g) => {
        if (g && origin) flyBack(g);
        return null;
      });
      if (!kind || clientX < 0) return; // cancelled
      const zone = zoneAt(clientX, clientY);
      if (zone === null) return;
      place(kind, zone);
    },
    [flyBack, place, zoneAt],
  );

  const handleTap = useCallback(
    (kind: ParticleKind) => {
      const zone = defaultZone(kind);
      if (zone === null) {
        setBlocked('Every shell is full — remove an electron first.');
        return;
      }
      const tokenEl = document.querySelector(`[data-testid="tray-${kind}"]`);
      const rect = tokenEl?.getBoundingClientRect();
      if (rect) flyToZone(kind, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, zone);
      place(kind, zone);
    },
    [defaultZone, flyToZone, place],
  );

  // Stepper handlers (keyboard/touch path) — fly from the button.
  const stepperAdd = useCallback(
    (kind: ParticleKind, zone: 'nucleus' | number, fromRect: DOMRect | null) => {
      if (fromRect) {
        flyToZone(kind, { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 }, zone);
      }
      place(kind, zone);
    },
    [flyToZone, place],
  );

  // Gentle thermal jitter on the NUCLEUS ONLY (design §12 — electrons never
  // move: no animation may pretend to be physical orbit). Killed by the
  // wrapper under reduced motion and paused when the tab is hidden.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;
    const discs = canvas.querySelectorAll<SVGGElement>('g.af-nucleon');
    if (discs.length === 0) return; // empty NodeList would log a GSAP warning
    const tweens: Array<gsap.core.Tween> = [];
    discs.forEach((disc, i) => {
      tweens.push(
        gsap.to(disc, {
          x: `+=${i % 2 === 0 ? 1.4 : -1.4}`,
          y: `+=${i % 3 === 0 ? -1.2 : 1.2}`,
          duration: 0.9 + (i % 4) * 0.15,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          repeatRefresh: true,
          paused: document.hidden,
        }),
      );
    });
    const onVisibility = () => tweens.forEach((t) => (document.hidden ? t.pause() : t.resume()));
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      tweens.forEach((t) => t.kill());
      gsap.set(discs, { x: 0, y: 0 }); // never leave accumulated drift behind
    };
  }, [build]);

  const electrons = electronCount(build);
  const charge = chargeOf(build);
  const currentNotation = identity
    ? isotopeNotation(identity.symbol, massNumberOf(build), charge)
    : null;

  const forgedSymbols = useMemo(
    () => new Set(content.missions.filter((m) => completed.includes(m.id)).map((m) => m.targetElement)),
    [content.missions, completed],
  );

  return (
    <>
    <div className="forge" data-testid="forge-screen" ref={rootRef} tabIndex={-1}>
      <section className="forge__brief" aria-labelledby="forge-title">
        <div className="forge__brief-top">
          <span className="mono-label">Mission {String(missionIndex + 1).padStart(2, '0')}</span>
          <span className={`focus-tag focus-tag--${mission.focus}`}>
            {mission.focus === 'build' && 'Concept · structure'}
            {mission.focus === 'shells' && 'Concept · shells'}
            {mission.focus === 'isotope' && 'Concept · isotope'}
            {mission.focus === 'ion' && 'Concept · ion'}
          </span>
          <span className="forge__brief-actions">
            <button
              type="button"
              className="btn btn--ghost forge__brief-toggle"
              aria-expanded={briefOpen}
              aria-controls="forge-brief-copy"
              onClick={() => setBriefOpen((v) => !v)}
            >
              {briefOpen ? 'Brief ▴' : 'Brief ▾'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onExit}
            >
              ← Ledger
            </button>
            <button
              type="button"
              className={`btn btn--danger-quiet${confirmClear ? ' is-armed' : ''}`}
              onClick={() => {
                if (!confirmClear) {
                  setConfirmClear(true);
                  clearTimer.current = window.setTimeout(() => setConfirmClear(false), 3500);
                  return;
                }
                setConfirmClear(false);
                window.clearTimeout(clearTimer.current);
                setBuild(emptyBuild());
                setBlocked(null);
              }}
            >
              {confirmClear ? 'Really clear? Tap again' : 'Clear bench'}
            </button>
          </span>
        </div>
        <h2 className="forge__title" id="forge-title">
          {mission.title}
        </h2>
        <p className={`forge__brief-copy${briefOpen ? ' forge__brief-copy--open' : ''}`} id="forge-brief-copy">
          {mission.brief}
        </p>
        <p className="forge__target">
          TARGET <strong>{target.isotopeNotation}</strong> · {target.element.atomicNumber} proton
          {target.element.atomicNumber === 1 ? '' : 's'} · {target.neutrons} neutron
          {target.neutrons === 1 ? '' : 's'} · {target.electrons} electron
          {target.electrons === 1 ? '' : 's'} · charge{' '}
          {target.charge === 0 ? '0' : target.charge > 0 ? `+${target.charge}` : `−${Math.abs(target.charge)}`}
        </p>
      </section>

      <div className="forge__main">
        <section className="readout" aria-label="Live atom readout">
          <div className="identity">
            {identity ? (
              <>
                <p className="mono-label">On the bench</p>
                <p className="identity__name" data-testid="identity-name">
                  {identity.name}
                </p>
                <p className="identity__notation">
                  {currentNotation} · {identity.name}-{massNumberOf(build)}
                  {charge !== 0 ? (charge > 0 ? ` · ${charge}+ ion` : ` · ${Math.abs(charge)}− ion`) : ''}
                </p>
                <p className="identity__charge">
                  Charge <strong>{charge === 0 ? '0' : charge > 0 ? `+${charge}` : `−${Math.abs(charge)}`}</strong>
                </p>
              </>
            ) : (
              <>
                <p className="mono-label">On the bench</p>
                <p className="identity__name identity__name--empty" data-testid="identity-name">
                  Empty nucleus — add protons to begin.
                </p>
              </>
            )}
            {evaluation.status === 'forged' && !reveal && (
              <p className="identity__stamp" role="status">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <rect width="14" height="14" fill="var(--ultramarine)" />
                  <path d="M3 7.5 L5.8 10 L11 3.8" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
                FORGED — {target.isotopeNotation} matches the mission
              </p>
            )}
          </div>

          <div className="counters" aria-label="Particle counters">
            <div className="counter">
              <span className="mono-label">Protons Z</span>
              <span className="counter__value numeral" data-testid="count-protons">{build.protons}</span>
            </div>
            <div className="counter">
              <span className="mono-label">Neutrons N</span>
              <span className="counter__value numeral">{build.neutrons}</span>
            </div>
            <div className="counter">
              <span className="mono-label">Electrons</span>
              <span className="counter__value numeral" data-testid="count-electrons">{electrons}</span>
            </div>
            <div className="counter">
              <span className="mono-label">Mass A</span>
              <span className="counter__value numeral">{massNumberOf(build)}</span>
            </div>
            <div className={`counter counter--charge${charge !== 0 ? ' is-nonzero' : ''}`}>
              <span className="mono-label">Charge</span>
              <span className="counter__value numeral">
                {charge === 0 ? '0' : charge > 0 ? `+${charge}` : `−${Math.abs(charge)}`}
              </span>
              <span className="counter__sub">
                {/* A bare electron cloud is not an ion — say so honestly. */}
                {build.protons === 0 && charge !== 0 ? 'no nucleus yet — free electrons' : chargeCopy(charge)}
              </span>
            </div>
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {summary}
          </p>

          {(evaluation.issues.length > 0 || blocked) && (
            <div className="teach" data-testid="teach-note">
              <p className="teach__lead">Forge notes</p>
              {blocked ? <p>{blocked}</p> : null}
              {evaluation.issues.slice(0, blocked ? 1 : 2).map((issue) => (
                <p key={issue}>{issue}</p>
              ))}
            </div>
          )}
        </section>

        <div className="canvas-wrap" ref={canvasRef} data-testid="canvas-wrap">
          <AtomCanvas
            build={build}
            visibleShells={visibleShells}
            dragOver={dragOver}
            summary={summary}
            onRemoveParticle={removeParticle}
          />
          {shellFlash !== null && <span className="sr-only">{`Shell ${shellFlash + 1} is full.`}</span>}
        </div>

        <section className="controls" aria-label="Zone controls and particle tray">
          <div className="zones">
            <div className="zone zone--nucleus">
              <div className="zone__info">
                <span className="zone__title">NUCLEUS</span>
                <span className="zone__count" data-testid="zone-nucleus-count">
                  {build.protons} p⁺ · {build.neutrons} n⁰
                </span>
              </div>
              <div className="zone__buttons">
                <button
                  type="button"
                  className="stepper stepper--proton"
                  aria-label="Add one proton to the nucleus"
                  disabled={reveal || build.protons >= MAX_PROTONS}
                  onClick={(e) => stepperAdd('proton', 'nucleus', e.currentTarget.getBoundingClientRect())}
                >
                  +p
                </button>
                <button
                  type="button"
                  className="stepper stepper--proton"
                  aria-label="Remove one proton from the nucleus"
                  disabled={reveal || build.protons <= 0}
                  onClick={() => removeParticle('proton')}
                >
                  −p
                </button>
                <button
                  type="button"
                  className="stepper"
                  aria-label="Add one neutron to the nucleus"
                  disabled={reveal || build.neutrons >= MAX_NEUTRONS}
                  onClick={(e) => stepperAdd('neutron', 'nucleus', e.currentTarget.getBoundingClientRect())}
                >
                  +n
                </button>
                <button
                  type="button"
                  className="stepper"
                  aria-label="Remove one neutron from the nucleus"
                  disabled={reveal || build.neutrons <= 0}
                  onClick={() => removeParticle('neutron')}
                >
                  −n
                </button>
              </div>
            </div>

            {Array.from({ length: visibleShells }, (_, i) => {
              const count = build.shells[i] ?? 0;
              const cap = capacityOf(i);
              const full = count >= cap;
              return (
                <div className="zone" key={`zone-${i}`}>
                  <div className="zone__info">
                    <span className="zone__title">SHELL {i + 1}</span>
                    <span className={`zone__count${full ? ' is-full' : ''}`} data-testid={`zone-shell-${i}-count`}>
                      {count}/{cap} e{full ? ' · FULL' : ''}
                    </span>
                  </div>
                  <div className="zone__buttons">
                    <button
                      type="button"
                      className="stepper stepper--electron"
                      aria-label={`Add one electron to shell ${i + 1}`}
                      disabled={reveal || count >= cap}
                      onClick={(e) => stepperAdd('electron', i, e.currentTarget.getBoundingClientRect())}
                    >
                      +e
                    </button>
                    <button
                      type="button"
                      className="stepper stepper--electron"
                      aria-label={`Remove one electron from shell ${i + 1}`}
                      disabled={reveal || count <= 0}
                      onClick={() => removeParticle('electron', i)}
                    >
                      −e
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <ParticleTray
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onTap={handleTap}
            disabled={reveal}
          />
        </section>
      </div>

      <PeriodicStrip elements={elements} forgedSymbols={forgedSymbols} targetSymbol={target.element.symbol} />

      {ghost && (
        <div className="fly-layer" aria-hidden="true">
          <div
            className="fly-ghost"
            style={{ transform: `translate(${ghost.x - 12}px, ${ghost.y - 12}px)` }}
            dangerouslySetInnerHTML={{ __html: kindDiscHtml(ghost.kind) }}
          />
        </div>
      )}
      <div className="fly-layer" ref={flyLayerRef} aria-hidden="true" />
    </div>

    {/* The reveal dialog is a SIBLING of the inert bench root — rendering it
        inside .forge would make the dialog itself unfocusable/unclickable
        (inert applies to the whole subtree; script .click() masked this in
        tests while real keyboard/pointer users were locked out). */}
    {reveal && (
      <RevealOverlay
        mission={mission}
        evaluation={evaluation}
        isLast={isLast}
        onNext={() => {
          setReveal(false);
          onNext();
        }}
        onReplay={() => {
          setReveal(false);
          setBuild(emptyBuild());
          lastForgedMission.current = mission.id;
          // Focus returns to the bench the learner is about to rebuild.
          returnFocusToBench();
        }}
        onDismiss={() => {
          setReveal(false);
          // The modal released focus — bring it back onto the forge, never
          // dump keyboard users onto <body>.
          returnFocusToBench();
        }}
        onLedger={() => {
          setReveal(false);
          onExit();
        }}
      />
    )}
    </>
  );
}

function kindDiscHtml(kind: ParticleKind): string {
  const color = kind === 'proton' ? 'var(--orange)' : kind === 'neutron' ? 'var(--neutron)' : 'var(--ultramarine)';
  const sign =
    kind === 'proton'
      ? '<path d="M -4 0 L 4 0 M 0 -4 L 0 4" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>'
      : kind === 'electron'
        ? '<path d="M -4 0 L 4 0" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>'
        : '<circle r="1.8" fill="#fff" opacity="0.85"/>';
  return `<svg width="24" height="24" viewBox="-12 -12 24 24"><circle r="10.5" fill="${color}"/>${sign}</svg>`;
}
