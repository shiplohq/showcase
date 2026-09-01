// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ShapeDef } from '../features/workbench/engine';

/**
 * A single polygon piece rendered as SVG content. The host is a real <g>
 * element (`<svg:g appShape …>`) — custom-named SVG elements are hidden by
 * the UA stylesheet (display:none), which bit us once: polygons existed in
 * the DOM but never painted. Draws the Bauhaus hard-offset shadow then the
 * body.
 */
@Component({
  selector: 'g[appShape]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg:polygon
      class="shape-shadow"
      [attr.points]="points()"
      [attr.transform]="shadowTransform()"
    />
    <svg:polygon
      class="shape-body"
      [attr.points]="points()"
      [attr.transform]="bodyTransform()"
      [style.fill]="fillVar()"
    />
  `,
  styles: `
    .shape-shadow {
      fill: rgba(33, 30, 25, 0.16);
      stroke: none;
    }
    .shape-body {
      stroke: var(--ink);
      stroke-width: 0.14;
      stroke-linejoin: round;
    }
  `,
})
export class ShapeView {
  readonly shape = input.required<ShapeDef>();
  readonly x = input(0);
  readonly y = input(0);
  readonly rot = input(0);
  /** Offset of the hard shadow in world units (0 disables the shadow). */
  readonly shadow = input(0.35);
  readonly mode = input<'solid' | 'ghost' | 'printed' | 'mini'>('solid');

  protected readonly points = computed(() =>
    this.shape()
      .pts.map((p) => `${round(p.x)},${round(p.y)}`)
      .join(' '),
  );

  protected readonly bodyTransform = computed(
    () => `translate(${this.x()} ${this.y()}) rotate(${this.rot()})`,
  );

  protected readonly shadowTransform = computed(
    () => `translate(${this.x() + this.shadow()} ${this.y() + this.shadow()}) rotate(${this.rot()})`,
  );

  protected readonly fillVar = computed(() => `var(--fill-${this.shape().fill}, var(--fill-cobalt))`);
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
