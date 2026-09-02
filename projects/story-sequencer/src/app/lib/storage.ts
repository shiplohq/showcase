// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

/**
 * Anonymous local progress (layer 3 of the state model). Stores only which
 * stories were sequenced — never any personal data — and always offers a
 * reset (spec + pre-publish checklist).
 */

const STORAGE_KEY = 'ss.progress.v1';

export interface Progress {
  completed: string[];
}

const EMPTY: Progress = { completed: [] };

function read(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed.filter((x) => typeof x === 'string') : [],
    };
  } catch {
    // Private mode / storage disabled — degrade to in-memory (still playable).
    return { ...EMPTY };
  }
}

function write(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore — the app stays fully usable without persistence.
  }
}

export class ProgressStore {
  private progress: Progress = read();

  get snapshot(): Progress {
    return { ...this.progress };
  }

  isCompleted(storyId: string): boolean {
    return this.progress.completed.includes(storyId);
  }

  complete(storyId: string): void {
    if (!this.isCompleted(storyId)) {
      this.progress = { completed: [...this.progress.completed, storyId] };
      write(this.progress);
    }
  }

  reset(): void {
    this.progress = { ...EMPTY };
    write(this.progress);
  }

  /** Re-read storage — another store instance (the board) may have written. */
  reload(): void {
    this.progress = read();
  }
}
