// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// App shell — screen state (map / mission / log), content loading with a
// clear degrade state, anonymous personal state + streak pips. Single-page
// state (no router) per the spec's static-hosting rules.

import { useCallback, useEffect, useState } from 'react';
import { GalaxyMap } from './features/map/GalaxyMap';
import { MissionLog } from './features/log/MissionLog';
import { MissionScreen } from './features/mission/MissionScreen';
import { Overlay } from './features/shared/Overlay';
import { Starfield } from './components/Starfield';
import { ContentError, loadContent } from './lib/data';
import { loadPersonal, resetPersonal, savePersonal } from './lib/storage';
import { galaxyProgress, streakAfter } from './features/mission/engine';
import type { Content, PersonalState } from './lib/types';

type Screen = { name: 'map' } | { name: 'mission'; galaxyId: string } | { name: 'log' };

export default function App(): JSX.Element {
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'map' });
  const [overlay, setOverlay] = useState<'chapter' | 'complete' | null>(null);
  const [personal, setPersonal] = useState<PersonalState>(() => loadPersonal());

  useEffect(() => {
    loadContent()
      .then((c) => setContent(c))
      .catch((e: unknown) => setError(e instanceof ContentError ? e.message : 'Chart data failed to load.'));
  }, []);

  // Persist the anonymous slice whenever it changes (side effect kept out of
  // the state updaters).
  useEffect(() => {
    savePersonal(personal);
  }, [personal]);

  const persist = useCallback((next: PersonalState) => setPersonal(next), []);

  const onLock = useCallback((missionId: string, firstTry: boolean) => {
    setPersonal((prev) => {
      if (Object.prototype.hasOwnProperty.call(prev.locked, missionId)) return prev;
      return {
        locked: { ...prev.locked, [missionId]: firstTry },
        streak: streakAfter(prev.streak, firstTry),
      };
    });
  }, []);

  const enterGalaxy = (galaxyId: string) => {
    setScreen({ name: 'mission', galaxyId });
    setOverlay('chapter');
  };

  if (error) {
    return (
      <main className="plate" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="content-error">
          <h2>The star chart failed to load</h2>
          <p>{error}</p>
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!content) {
    return (
      <main className="plate" style={{ display: 'grid', placeItems: 'center' }} role="status" aria-live="polite">
        <p className="margin-label">Charting the sky…</p>
      </main>
    );
  }

  const missionsOf = (galaxyId: string) => content.missions.filter((m) => m.galaxyId === galaxyId);
  const activeGalaxy = screen.name === 'mission' ? content.galaxies.find((g) => g.id === screen.galaxyId) : null;

  return (
    <>
      {/* Font probe: visually hidden, aria-hidden — forces the bundled
          latin AND vietnamese subset faces to load at every shipped weight
          so document.fonts.check (scripts/font-check.mjs) measures the real
          faces, not lazy-load absences. Also warm for future localization. */}
      <span className="font-probe" aria-hidden="true">
        <span className="fp-display-700">ưỡng ệ ữ đ ơ ư 0123456789</span>
        <span className="fp-display-600">ưỡng ệ ữ đ ơ ư 0123456789</span>
        <span className="fp-display-500">ưỡng ệ ữ đ ơ ư 0123456789</span>
        <span className="fp-body-600">ưỡng ệ ữ đ ơ ư 0123456789</span>
        <span className="fp-body-500">ưỡng ệ ữ đ ơ ư 0123456789</span>
        <span className="fp-body-400">ưỡng ệ ữ đ ơ ư 0123456789</span>
      </span>
      <Starfield />
      <svg className="grain-overlay" aria-hidden="true" data-testid="grain">
        <filter id="grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>
      <div className="plate-frame" aria-hidden="true" />
      <div className="app-shell">
        <header className="app-header">
          <div className="app-title">
            <span className="margin-label">Orbital fact charts · tables 2–12</span>
            <strong>MULTIPLICATION GALAXY</strong>
          </div>
          <div className="header-tools">
            <span className="signal" role="img" aria-label={`Signal strength ${personal.streak} of 3`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={`signal-pip${i < personal.streak ? ' lit' : ''}`} />
              ))}
            </span>
            {/* One contextual nav control — screens carry their own back. */}
            {screen.name !== 'log' && (
              <button type="button" className="btn btn-quiet" onClick={() => setScreen({ name: 'log' })}>
                Mission log
              </button>
            )}
          </div>
        </header>

        <main className="app-main">
          {screen.name === 'map' && (
            <GalaxyMap
              content={content}
              locked={personal.locked}
              onEnter={enterGalaxy}
              onOpenLog={() => setScreen({ name: 'log' })}
            />
          )}
          {screen.name === 'log' && (
            <MissionLog
              content={content}
              locked={personal.locked}
              onBack={() => setScreen({ name: 'map' })}
              onReset={() => persist(resetPersonal())}
            />
          )}
          {screen.name === 'mission' && activeGalaxy && (
            <MissionScreen
              key={activeGalaxy.id}
              galaxy={activeGalaxy}
              missions={missionsOf(activeGalaxy.id)}
              locked={personal.locked}
              onLock={onLock}
              onExit={() => {
                setScreen({ name: 'map' });
                setOverlay(null);
              }}
              onComplete={() => setOverlay('complete')}
            />
          )}
        </main>
      </div>

      {overlay && activeGalaxy && screen.name === 'mission' && (
        <Overlay
          kind={overlay}
          galaxy={activeGalaxy}
          facts={galaxyProgress(missionsOf(activeGalaxy.id), personal.locked)}
          onBegin={() => setOverlay(null)}
          onExit={() => {
            setOverlay(null);
            setScreen({ name: 'map' });
          }}
        />
      )}
    </>
  );
}
