// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { ContentStore } from './lib/data';
import { connectHashRoute, goShelf, goStory, type Route } from './lib/hash';
import { ProgressStore } from './lib/storage';
import { Shelf } from './features/shelf/shelf';
import { Board } from './features/board/board';
import type { Story } from './features/board/engine';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Shelf, Board],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  readonly content = new ContentStore();
  private readonly progress = new ProgressStore();
  private readonly progressTick = signal(0);

  private readonly routing = connectHashRoute();
  readonly route = this.routing.route as typeof this.routing.route;

  readonly stories = computed<Story[]>(() => this.content.state().data?.stories ?? []);
  readonly completedIds = computed<Set<string>>(() => {
    void this.progressTick();
    return new Set(this.progress.snapshot.completed);
  });
  readonly completedCount = computed(() => this.completedIds().size);
  readonly activeStory = computed<Story | null>(() => {
    const r: Route = this.route();
    if (r.view !== 'story') return null;
    return this.stories().find((s) => s.id === r.id) ?? null;
  });
  readonly storyMissing = computed(() => {
    const r: Route = this.route();
    return r.view === 'story' && !this.activeStory();
  });

  readonly nextStory = computed<Story | null>(() => {
    const active = this.activeStory();
    const list = this.stories();
    if (!active) return null;
    const idx = list.findIndex((s) => s.id === active.id);
    return list.length > 0 ? list[(idx + 1) % list.length] : null;
  });

  ngOnInit(): void {
    void this.content.init();
  }

  onStoryCompleted(): void {
    // The board persisted via its own ProgressStore instance; re-read storage.
    this.progress.reload();
    this.progressTick.set(this.progressTick() + 1);
  }

  onResetProgress(): void {
    this.progress.reset();
    this.progressTick.set(this.progressTick() + 1);
  }

  openStory(id: string): void {
    goStory(id);
  }

  exitToShelf(): void {
    goShelf();
  }

  retry(): void {
    void this.content.init();
  }
}
