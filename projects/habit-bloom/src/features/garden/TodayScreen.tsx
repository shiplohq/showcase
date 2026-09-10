// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Today garden (spec IA screen 1): every habit is a full-width specimen row
// — controls, stem plot, name/tags, check-in toggle. Reorder works two ways
// (WCAG 2.2): pointer drag on the handle AND Move up / Move down buttons.

import { useEffect, useRef } from 'react';
import { StemPlot } from '../../components/StemPlot';
import { habitStats } from '../../lib/stems';
import { formatShort } from '../../lib/dates';
import type { Habit } from '../../lib/types';
import { captureFlip, playFlip, type FlipStateLike } from '../../lib/gsap';

interface Props {
  habits: Habit[];
  today: string;
  onToggle: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onReorder: (id: string, toIndex: number) => void;
}

export function TodayScreen({ habits, today, onToggle, onOpenDetail, onReorder }: Props) {
  const listRef = useRef<HTMLUListElement | null>(null);
  // Flip pattern for React: capture before the state change, play in an
  // effect after React commits the new DOM order.
  const flipRef = useRef<FlipStateLike | null>(null);

  useEffect(() => {
    if (flipRef.current) {
      playFlip(flipRef.current);
      flipRef.current = null;
    }
  }, [habits]);

  /** Capture positions, then swap (the effect above plays the animation). */
  function reorder(id: string, to: number) {
    flipRef.current = captureFlip(listRef.current);
    onReorder(id, to);
  }

  function move(id: string, dir: -1 | 1) {
    const from = habits.findIndex((h) => h.id === id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= habits.length) return;
    reorder(id, to);
  }

  function startDrag(event: React.PointerEvent, id: string) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();
    document.body.classList.add('is-dragging');

    const onMove = (ev: PointerEvent) => {
      const rows = habits
        .map((h) => listRef.current?.querySelector<HTMLLIElement>(`[data-habit-id="${CSS.escape(h.id)}"]`))
        .filter((el): el is HTMLLIElement => el !== null && el !== undefined);
      const from = habits.findIndex((h) => h.id === id);
      let to = from;
      for (let i = 0; i < rows.length; i++) {
        const rect = rows[i].getBoundingClientRect();
        if (ev.clientY < rect.top + rect.height / 2) {
          to = i;
          break;
        }
      }
      if (to !== from && to >= 0 && to < habits.length) {
        reorder(id, to);
      }
    };
    const stop = () => {
      document.body.classList.remove('is-dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
  }

  return (
    <section className="garden" aria-label="Today's garden">
      <ul className="garden__list" ref={listRef}>
        {habits.map((habit, index) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            today={today}
            first={index === 0}
            last={index === habits.length - 1}
            onToggle={() => onToggle(habit.id)}
            onOpenDetail={() => onOpenDetail(habit.id)}
            onMoveUp={() => move(habit.id, -1)}
            onMoveDown={() => move(habit.id, 1)}
            onDragStart={(e) => startDrag(e, habit.id)}
          />
        ))}
      </ul>
    </section>
  );
}

interface RowProps {
  habit: Habit;
  today: string;
  first: boolean;
  last: boolean;
  onToggle: () => void;
  onOpenDetail: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: (e: React.PointerEvent) => void;
}

function HabitRow({
  habit,
  today,
  first,
  last,
  onToggle,
  onOpenDetail,
  onMoveUp,
  onMoveDown,
  onDragStart,
}: RowProps) {
  const stats = habitStats(habit, today);
  const done = stats.doneToday;
  const latest = stats.leaves > 0 ? [...habit.history].sort().pop() : null;

  return (
    <li className="habit-row" data-habit-id={habit.id}>
      <div className="habit-row__controls">
        <span
          className="drag-handle"
          aria-hidden="true"
          title="Drag to reorder"
          onPointerDown={onDragStart}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="5" cy="3.5" r="1.3" />
            <circle cx="11" cy="3.5" r="1.3" />
            <circle cx="5" cy="8" r="1.3" />
            <circle cx="11" cy="8" r="1.3" />
            <circle cx="5" cy="12.5" r="1.3" />
            <circle cx="11" cy="12.5" r="1.3" />
          </svg>
        </span>
        <div className="move-buttons">
          <button
            type="button"
            className="move-btn"
            onClick={onMoveUp}
            disabled={first}
            aria-label={`Move ${habit.name} up`}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 3 L8 13 M4 7 L8 3 L12 7" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="move-btn"
            onClick={onMoveDown}
            disabled={last}
            aria-label={`Move ${habit.name} down`}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 13 L8 3 M4 9 L8 13 L12 9" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="habit-row__stem">
        <StemPlot habit={habit} today={today} />
      </div>

      <div className="habit-row__main">
        <button type="button" className="habit-row__name" onClick={onOpenDetail}>
          {habit.name}
        </button>
        <p className="habit-row__tags">
          <span className="tag">{habit.plant}</span>
          <span className="tag tag--dim">{habit.cadence}</span>
          {stats.plantedOn ? (
            <span className="tag tag--dim">planted {formatShort(stats.plantedOn)}</span>
          ) : (
            <span className="tag tag--dim">a seedling</span>
          )}
        </p>
      </div>

      <div className="habit-row__side">
        <p className="habit-row__count" aria-hidden="true">
          {stats.leaves}
        </p>
        <p className="habit-row__count-label">
          {stats.leaves === 1 ? 'leaf' : 'leaves'}
          {latest ? ` · last ${formatShort(latest)}` : ''}
        </p>
        <button
          type="button"
          className={`check-btn${done ? ' is-done' : ''}`}
          aria-pressed={done}
          onClick={onToggle}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="check-btn__mark">
            <path d="M3.5 8.5 L6.8 11.8 L12.5 4.5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="check-btn__label">{done ? 'Leaf added today' : "Add today's leaf"}</span>
        </button>
      </div>
    </li>
  );
}
