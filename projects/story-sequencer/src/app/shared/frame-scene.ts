// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

/**
 * Frame scene renderer — mounts the original SVG illustration for a scene id.
 * The markup comes exclusively from the compiled scene registry (never from
 * JSON), so bypassing the sanitizer here only ever injects authored strings.
 * The art is decorative: the panel caption is the text equivalent (spec §a11y).
 */

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { renderScene } from '../features/board/scenes';

@Component({
  selector: 'app-frame-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <g [innerHTML]="markup()"></g>
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      svg {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class FrameScene {
  readonly sceneId = input.required<string>({ alias: 'scene' });
  private readonly sanitizer = inject(DomSanitizer);

  readonly markup = computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(renderScene(this.sceneId())));
}
