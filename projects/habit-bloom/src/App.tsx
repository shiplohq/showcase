// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// App shell — single-page state (no router; spec static-hosting rules).
// Three state layers stay separated (spec): content state from the seed
// JSON, interaction state in this shell, anonymous personal state in
// localStorage strictly after opt-in.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContentError, loadSeed } from './lib/data';
import {
  clearAll,
  exportGarden,
  loadConsent,
  loadGarden,
  saveConsent,
  saveGarden,
} from './lib/storage';
import type { Cadence, Consent, Habit, PlantKind } from './lib/types';
import { formatLong, todayIso } from './lib/dates';
import { StorageBanner } from './components/StorageBanner';
import { AddHabitDialog } from './components/AddHabitDialog';
import { TodayScreen } from './features/garden/TodayScreen';
import { DetailScreen } from './features/detail/DetailScreen';
import { InsightsScreen } from './features/insights/InsightsScreen';

type Phase =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; seed: Habit[] };

type View = { kind: 'today' | 'insights' } | { kind: 'detail'; id: string };

function slugId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
  const safe = base.length >= 2 ? base : 'habit';
  return `${safe}-${Date.now().toString(36).slice(-4)}`;
}

export function App() {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [view, setView] = useState<View>({ kind: 'today' });
  const [habits, setHabits] = useState<Habit[]>([]);
  const [consent, setConsentState] = useState<Consent>('unset');
  const [addOpen, setAddOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [resetArmed, setResetArmed] = useState(false);
  const today = useMemo(() => todayIso(), []);
  const gardenRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadSeed()
      .then((seed) => {
        const storedConsent = loadConsent();
        setConsentState(storedConsent);
        const stored = storedConsent === 'local' ? loadGarden() : null;
        setHabits(stored ? stored.habits : seed.habits.map((h) => ({ ...h, history: [...h.history] })));
        setPhase({ kind: 'ready', seed: seed.habits });
      })
      .catch((err: unknown) => {
        const message =
          err instanceof ContentError ? err.message : 'Something went wrong while opening the notebook.';
        setPhase({ kind: 'error', message });
      });
  }, []);

  // Persist only after the user opted in ("keep on this device").
  useEffect(() => {
    if (consent === 'local' && habits.length > 0) saveGarden({ habits });
  }, [habits, consent]);

  const announce = useCallback((message: string) => setStatus(message), []);

  const handleToggle = useCallback(
    (id: string) => {
      setHabits((prev) =>
        prev.map((habit) => {
          if (habit.id !== id) return habit;
          const has = habit.history.includes(today);
          announce(
            has
              ? `Folded away today's leaf on ${habit.name}.`
              : `A leaf unfolded on ${habit.name}.`,
          );
          return {
            ...habit,
            history: has
              ? habit.history.filter((d) => d !== today)
              : [...habit.history, today],
          };
        }),
      );
    },
    [today, announce],
  );

  const handleReorder = useCallback((id: string, toIndex: number) => {
    setHabits((prev) => {
      const from = prev.findIndex((h) => h.id === id);
      if (from < 0 || toIndex < 0 || toIndex >= prev.length || from === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const handleAdd = useCallback(
    (draft: { name: string; plant: PlantKind; cadence: Cadence }) => {
      const habit: Habit = { id: slugId(draft.name), ...draft, history: [] };
      setHabits((prev) => [...prev, habit]);
      setAddOpen(false);
      setView({ kind: 'today' });
      announce(`Planted ${habit.name}. Its first leaf is waiting.`);
    },
    [announce],
  );

  const chooseConsent = useCallback(
    (choice: 'local' | 'session') => {
      setConsentState(choice);
      saveConsent(choice);
      if (choice === 'local') {
        saveGarden({ habits });
        announce('Your garden now stays on this device.');
      } else {
        announce('The garden lives in this session only — nothing is stored.');
      }
    },
    [habits, announce],
  );

  const handleReset = useCallback(() => {
    if (phase.kind !== 'ready') return;
    const fresh = phase.seed.map((h) => ({ ...h, history: [...h.history] }));
    setHabits(fresh);
    clearAll();
    setConsentState('unset');
    setResetArmed(false);
    setView({ kind: 'today' });
    announce('The garden is fresh again — the sample plants are back.');
  }, [phase, announce]);

  const handleExport = useCallback(() => {
    const ok = exportGarden({ habits });
    announce(
      ok
        ? 'Your garden was exported as JSON.'
        : 'Export is not available in this browser — nothing was lost.',
    );
  }, [habits, announce]);

  if (phase.kind === 'loading') {
    return (
      <div className="app-frame">
        <header className="app-header">
          <p className="app-header__wordmark">Habit Bloom</p>
        </header>
        <p className="mono-note" role="status">
          Unfolding the garden…
        </p>
      </div>
    );
  }

  if (phase.kind === 'error') {
    return (
      <div className="error-screen" role="alert">
        <h1>The notebook will not open</h1>
        <p>{phase.message}</p>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  const detailId = view.kind === 'detail' ? view.id : null;
  const detailHabit = detailId ? habits.find((h) => h.id === detailId) : null;

  return (
    <div className="app-frame">
      <header className="app-header">
        <div className="app-header__ident">
          <p className="app-header__series">Shiplo field notes · no. 20</p>
          <button
            type="button"
            className="app-header__wordmark"
            onClick={() => setView({ kind: 'today' })}
            aria-label="Habit Bloom — back to today's garden"
          >
            Habit Bloom
          </button>
          <p className="app-header__date">{formatLong(today)}</p>
        </div>
        <nav className="app-header__nav" aria-label="Views">
          <button
            type="button"
            className={view.kind === 'today' ? 'nav-btn is-current' : 'nav-btn'}
            aria-current={view.kind === 'today' ? 'page' : undefined}
            onClick={() => setView({ kind: 'today' })}
          >
            Today
          </button>
          <button
            type="button"
            className={view.kind === 'insights' ? 'nav-btn is-current' : 'nav-btn'}
            aria-current={view.kind === 'insights' ? 'page' : undefined}
            onClick={() => setView({ kind: 'insights' })}
          >
            Insights
          </button>
          <button type="button" className="btn btn--primary nav-btn" onClick={() => setAddOpen(true)}>
            + New habit
          </button>
        </nav>
      </header>

      {consent === 'unset' ? (
        <StorageBanner
          onKeepOnDevice={() => chooseConsent('local')}
          onSessionOnly={() => chooseConsent('session')}
        />
      ) : null}

      <main className="app-main" ref={gardenRef} aria-live="off">
        {view.kind === 'today' ? (
          <TodayScreen
            habits={habits}
            today={today}
            onToggle={handleToggle}
            onOpenDetail={(id) => setView({ kind: 'detail', id })}
            onReorder={handleReorder}
          />
        ) : null}
        {view.kind === 'insights' ? <InsightsScreen habits={habits} today={today} /> : null}
        {view.kind === 'detail' && detailHabit ? (
          <DetailScreen
            habit={detailHabit}
            today={today}
            onBack={() => setView({ kind: 'today' })}
            onToggle={handleToggle}
          />
        ) : null}
        {view.kind === 'detail' && !detailHabit ? (
          <p className="mono-note">This plant is no longer in the garden.</p>
        ) : null}
      </main>

      <footer className="app-footer">
        <p className="app-footer__status">
          <span className="tag tag--dim">
            {consent === 'local'
              ? 'garden kept on this device'
              : consent === 'session'
                ? 'session garden — nothing stored'
                : 'storage not chosen yet'}
          </span>
        </p>
        <div className="app-footer__actions">
          <button type="button" className="btn btn--quiet" onClick={handleExport}>
            Export JSON
          </button>
          {resetArmed ? (
            <>
              <button type="button" className="btn" onClick={handleReset}>
                Yes, start fresh
              </button>
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => setResetArmed(false)}
              >
                Keep my garden
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--quiet" onClick={() => setResetArmed(true)}>
              Reset demo garden
            </button>
          )}
        </div>
        <p className="app-footer__note">
          Demo data only — habits live in this browser, never on a server.
          Shiplo Showcase #20.
        </p>
      </footer>

      <p className="sr-status" role="status" aria-live="polite">
        {status}
      </p>

      {addOpen ? (
        <AddHabitDialog onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      ) : null}
    </div>
  );
}
