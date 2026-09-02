// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content loader: fetches public/data/phonics.json (relative path — safe under
// any subpath, unlike `new URL(path, import.meta.env.BASE_URL)` with base './',
// pilot #01 lesson #4) and validates it. Dev-time: full issues in console.
// Runtime: a fatal load/validate failure renders a friendly ranger message —
// never a white screen.

import { validatePhonics } from '../engine/types';
import type { PhonicsData } from '../engine/types';

export async function loadPhonics(): Promise<PhonicsData> {
  let data: unknown;
  try {
    const res = await fetch('data/phonics.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    throw new Error(`The forest map could not be opened (${(err as Error).message}). Check your connection and reload.`);
  }
  const issues = validatePhonics(data);
  if (issues.length > 0) {
    if (import.meta.env.DEV) {
      console.error('[phonics-forest] data validation issues:\n' + issues.map((i) => `  - ${i}`).join('\n'));
    }
    throw new Error('The forest map is smudged — some lesson data is missing. Please reload.');
  }
  return data as PhonicsData;
}
