// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Content-state loader: fetches local JSON (static host), validates shape at
// dev-time, degrades to a clear message instead of a white screen (spec).

import type { Lessons, Question, Rewards, Unit } from './types';

const OPERATIONS = ['count', 'make10', 'add', 'subtract'];

export class ContentError extends Error {}

async function fetchJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ContentError(`Không tải được dữ liệu bài học (${url}).`);
  }
  if (!res.ok) throw new ContentError(`Dữ liệu bài học trả về ${res.status} (${url}).`);
  try {
    return await res.json();
  } catch {
    throw new ContentError(`Dữ liệu bài học không phải JSON hợp lệ (${url}).`);
  }
}

function assertUnit(raw: unknown, index: number): Unit {
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`unit ${index} không hợp lệ.`);
  const u = raw as Record<string, unknown>;
  if (typeof u.id !== 'string' || !u.id) throw new ContentError(`unit ${index} thiếu id.`);
  if (!Array.isArray(u.questions) || u.questions.length === 0) {
    throw new ContentError(`unit "${u.id}" không có câu hỏi.`);
  }
  return {
    id: u.id,
    title: String(u.title ?? u.id),
    subtitle: String(u.subtitle ?? ''),
    emojiFreePlant: validatePlant(u.emojiFreePlant),
    questions: u.questions.map((q, i) => assertQuestion(q, `${u.id}#${i}`)),
  };
}

function validatePlant(v: unknown): Unit['emojiFreePlant'] {
  const plants = ['apple', 'tulip', 'daisy', 'sunflower'];
  if (typeof v === 'string' && plants.includes(v)) return v as Unit['emojiFreePlant'];
  throw new ContentError(`plant "${String(v)}" không nằm trong danh sách minh hoạ.`);
}

function assertQuestion(raw: unknown, where: string): Question {
  if (typeof raw !== 'object' || raw === null) throw new ContentError(`câu hỏi ${where} không hợp lệ.`);
  const q = raw as Record<string, unknown>;
  const op = String(q.operation ?? '');
  if (!OPERATIONS.includes(op)) throw new ContentError(`câu hỏi ${where}: operation "${op}" không hỗ trợ.`);
  if (!Array.isArray(q.operands) || !q.operands.every((n) => typeof n === 'number' && n >= 0)) {
    throw new ContentError(`câu hỏi ${where}: operands không hợp lệ.`);
  }
  if (typeof q.bond !== 'object' || q.bond === null) {
    throw new ContentError(`câu hỏi ${where}: thiếu number bond.`);
  }
  const b = q.bond as { total?: unknown; parts?: unknown };
  if (typeof b.total !== 'number' || !Array.isArray(b.parts) || b.parts.length !== 2) {
    throw new ContentError(`câu hỏi ${where}: bond không hợp lệ.`);
  }
  return {
    id: String(q.id ?? where),
    prompt: String(q.prompt ?? ''),
    operation: op as Question['operation'],
    target: Number(q.target ?? 0),
    operands: q.operands as number[],
    manipulatives: Array.isArray(q.manipulatives) ? (q.manipulatives as string[]) : ['seed'],
    hint: String(q.hint ?? ''),
    explanation: String(q.explanation ?? ''),
    bond: { total: b.total, parts: b.parts as [number, number] },
  };
}

/** Build the asset URL relative to the deployed base (subpath-safe). */
function assetUrl(path: string): string {
  // BASE_URL is './' for this build — resolve it against the document first
  // (new URL needs an absolute base, and relative asset paths must follow
  // wherever the artifact is hosted, including subpaths).
  const base = new URL(import.meta.env.BASE_URL ?? './', document.baseURI);
  return new URL(path, base).href;
}

export async function loadContent(): Promise<{ lessons: Lessons; rewards: Rewards }> {
  const [lessonsRaw, rewardsRaw] = await Promise.all([
    fetchJson(assetUrl('data/lessons.json')),
    fetchJson(assetUrl('data/rewards.json')),
  ]);

  if (typeof lessonsRaw !== 'object' || lessonsRaw === null || !Array.isArray((lessonsRaw as { units?: unknown }).units)) {
    throw new ContentError('lessons.json thiếu mảng "units".');
  }
  const lessons: Lessons = {
    units: (lessonsRaw as { units: unknown[] }).units.map(assertUnit),
  };

  const r = (rewardsRaw ?? {}) as { plants?: unknown };
  if (!Array.isArray(r.plants)) throw new ContentError('rewards.json thiếu mảng "plants".');
  const rewards: Rewards = {
    plants: r.plants.map((p, i) => {
      const plant = (p ?? {}) as Record<string, unknown>;
      return {
        plantId: String(plant.plantId ?? `plant-${i}`),
        requiredStars: Number(plant.requiredStars ?? 0),
        svgAsset: String(plant.svgAsset ?? ''),
        label: String(plant.label ?? ''),
      };
    }),
  };

  return { lessons, rewards };
}
