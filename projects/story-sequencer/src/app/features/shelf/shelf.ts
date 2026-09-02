// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FrameScene } from '../../shared/frame-scene';
import type { Story } from '../board/engine';

@Component({
  selector: 'app-shelf',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FrameScene],
  templateUrl: './shelf.html',
  styleUrl: './shelf.css',
})
export class Shelf {
  readonly stories = input.required<Story[]>();
  readonly completed = input.required<Set<string>>();
  readonly pickStory = output<string>();
  readonly resetProgress = output<void>();

  confirmingReset = false;

  onResetClick(): void {
    if (this.confirmingReset) {
      this.confirmingReset = false;
      this.resetProgress.emit();
    } else {
      this.confirmingReset = true;
    }
  }

  onResetLeave(): void {
    this.confirmingReset = false;
  }

  /** Completed issues reveal the story's true title on their cover. */
  storyTitle(story: Story): string {
    return story.titles.find((t) => t.correct)?.text ?? `Issue ${story.issueNo}`;
  }
}
