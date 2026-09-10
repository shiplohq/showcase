// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Date helpers — everything is a plain ISO day string (YYYY-MM-DD), computed
// in local time so "today" is what the user actually lives in.

const MS_DAY = 86_400_000;

/** Local-time ISO day string for a Date (no UTC drift). */
export function toIsoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayIso(): string {
  return toIsoDay(new Date());
}

export function isValidIsoDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Whole days between two ISO days (b − a), local time. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / MS_DAY);
}

/** The n ISO days ending at `end` (inclusive), oldest first. */
export function dayWindow(end: string, n: number): string[] {
  const [y, m, d] = end.split('-').map(Number);
  const base = new Date(y, m - 1, d).getTime();
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(toIsoDay(new Date(base - i * MS_DAY)));
  }
  return days;
}

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "Thursday · 10 September 2026" — field-note style date line. */
export function formatLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAY[date.getDay()]} · ${d} ${MONTH[m - 1]} ${y}`;
}

/** "10 Sep" — compact tag for calendar axes. */
export function formatShort(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH[m - 1].slice(0, 3)}`;
}

/** Two-letter weekday marker for the phenology strip. */
export function weekdayLetter(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return WEEKDAY[new Date(y, m - 1, d).getDay()].slice(0, 2).toUpperCase();
}
