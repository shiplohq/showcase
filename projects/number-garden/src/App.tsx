// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// App shell — a single-page state machine (no history routing: static-host
// friendly). Screens: home → play → (why overlay) → end. Personal state is
// anonymous localStorage progress + sound preference, always resettable.

import { useCallback, useEffect, useState } from 'react';
import { HomeIcon, LoadingSprout, SoundOffIcon, SoundOnIcon } from './components/art';
import { ContentError, loadContent } from './lib/data';
import { loadPersonal, savePersonal } from './lib/storage';
import type { Lessons, PersonalState, Rewards, Unit } from './lib/types';
import { HomeScreen } from './features/home/HomeScreen';
import { PlayScreen } from './features/play/PlayScreen';
import { EndScreen } from './features/end/EndScreen';

type Screen =
  | { kind: 'home' }
  | { kind: 'play'; unitIndex: number; attempt: number }
  | { kind: 'end'; unitIndex: number; correct: number };

export function App(): JSX.Element {
  const [content, setContent] = useState<{ lessons: Lessons; rewards: Rewards } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [personal, setPersonal] = useState<PersonalState>(() => loadPersonal());

  useEffect(() => {
    let alive = true;
    loadContent()
      .then((c) => {
        if (alive) setContent(c);
      })
      .catch((err) => {
        if (alive) setError(err instanceof ContentError ? err.message : 'Dữ liệu không tải được.');
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    savePersonal(personal);
  }, [personal]);

  const toggleSound = useCallback(() => {
    setPersonal((p) => ({ ...p, soundOn: !p.soundOn }));
  }, []);

  const resetProgress = useCallback(() => {
    setPersonal((p) => ({ ...p, stars: {} }));
  }, []);

  if (error) {
    return (
      <div className="app">
        <main className="loading" role="alert">
          <LoadingSprout />
          <p>Ối, khu vườn chưa mở được.</p>
          <p className="why-sub">{error}</p>
        </main>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="app">
        <main className="loading" aria-label="Đang tải">
          <LoadingSprout />
          <p>Đang gieo hạt…</p>
        </main>
      </div>
    );
  }

  const inPlay = screen.kind === 'play';
  const unit: Unit | null =
    screen.kind === 'play' || screen.kind === 'end' ? content.lessons.units[screen.unitIndex] : null;

  return (
    <div className="app">
      {/* Paper grain — the single generated raster asset (design/IMAGE_BRIEF.md).
          Resolved from BASE_URL so the build works under any static subpath. */}
      <div
        className="paper-grain"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}assets/generated/paper-texture.png)`,
        }}
      />
      <header className="topbar">
        {inPlay || screen.kind === 'end' ? (
          <button
            type="button"
            className="topbar-home"
            onClick={() => setScreen({ kind: 'home' })}
            aria-label="Về màn chọn luống cây"
          >
            <HomeIcon />
            <span>Khu vườn</span>
          </button>
        ) : (
          <span className="topbar-home" aria-hidden="true" style={{ visibility: 'hidden' }}>
            <HomeIcon />
          </span>
        )}
        <span className="topbar-title" aria-hidden={inPlay}>
          {screen.kind === 'end' ? 'Vườn nở hoa' : inPlay ? (unit?.title ?? '') : 'Khu vườn số học'}
        </span>
        <button
          type="button"
          className="icon-btn"
          onClick={toggleSound}
          aria-pressed={personal.soundOn}
          aria-label={personal.soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
        >
          {personal.soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>
      </header>

      <main className="app-main">
        {screen.kind === 'home' && (
          <HomeScreen
            lessons={content.lessons}
            personal={personal}
            onPick={(unitIndex) => setScreen({ kind: 'play', unitIndex, attempt: Date.now() })}
            onResetProgress={resetProgress}
          />
        )}
        {screen.kind === 'play' && unit && (
          <PlayScreen
            key={`${unit.id}-${screen.attempt}`}
            unit={unit}
            soundOn={personal.soundOn}
            onProgress={(u, correct) => {
              setPersonal((p) => ({
                ...p,
                stars: { ...p.stars, [u.id]: Math.max(p.stars[u.id] ?? 0, correct) },
              }));
            }}
            onFinish={(u, correct) => {
              setPersonal((p) => ({
                ...p,
                stars: { ...p.stars, [u.id]: Math.max(p.stars[u.id] ?? 0, correct) },
              }));
              setScreen({ kind: 'end', unitIndex: screen.unitIndex, correct });
            }}
          />
        )}
        {screen.kind === 'end' && unit && (
          <EndScreen
            unit={unit}
            correct={screen.correct}
            soundOn={personal.soundOn}
            onReplay={() =>
              setScreen({ kind: 'play', unitIndex: screen.unitIndex, attempt: Date.now() })
            }
            onHome={() => setScreen({ kind: 'home' })}
          />
        )}
      </main>
    </div>
  );
}
