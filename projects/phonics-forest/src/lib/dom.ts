// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Tiny DOM helpers for the vanilla-TS UI (no framework — showcase #08 is the
// "pure TS" entry of the framework-diversity set).

export type Child = Node | string | null | undefined | false;

/** Create an element with attributes/properties and children in one call. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<Record<string, string | boolean | number>> & {
    class?: string;
    text?: string;
    html?: string;
  } = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key === 'class') el.className = String(value);
    else if (key === 'text') el.textContent = String(value);
    else if (key === 'html') el.innerHTML = String(value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, String(value));
  }
  for (const child of children) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return el;
}

/** SVG element builder (namespace-correct). */
export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** Parse an inline-SVG string into a live element (svg must be the root). */
export function svgFragment(markup: string): SVGSVGElement {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup.trim();
  const root = tpl.content.firstElementChild;
  if (!root || root.tagName.toLowerCase() !== 'svg') throw new Error('svgFragment: root must be <svg>');
  return root as SVGSVGElement;
}

/** Center point of an element in viewport coordinates (for drag hit-testing). */
export function center(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

/** Move focus and announce a screen change politely. */
export function moveFocus(el: HTMLElement): void {
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

/** Visible text inside an element, for aria assertions in tests. */
export function textOf(el: Element | null | undefined): string {
  return (el?.textContent ?? '').trim();
}
