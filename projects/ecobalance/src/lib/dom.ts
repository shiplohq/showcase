// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Tiny DOM helpers for the vanilla-TS UI (no framework — EcoBalance is the
// pure-TS diversity entry alongside #08).

export type Child = Node | string | null | undefined | false;

/** Create an element with attributes and children in one call. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<Record<string, string | boolean | number>> & {
    class?: string;
    text?: string;
  } = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key === 'class') el.className = String(value);
    else if (key === 'text') el.textContent = String(value);
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

/** Clear all children of an element. */
export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/** Move focus without scrolling the page. */
export function moveFocus(el: HTMLElement): void {
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}
