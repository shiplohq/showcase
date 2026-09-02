// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

/**
 * Content loader — fetches the local JSON content (public/data/stories.json),
 * validates it at dev-time against the pure engine validators plus the scene
 * registry, and exposes it to the app. Content stays data-only: a new story
 * is added by adding JSON + a scene renderer, never by touching components
 * (spec: 3-layer state model).
 *
 * URLs are document-relative so the artifact works from any base path
 * (pilot #01 lesson: never build absolute paths).
 */

import { signal } from '@angular/core';
import { validateStories, type Story } from '../features/board/engine';
import { knownScene } from '../features/board/scenes';

export interface ContentData {
  stories: Story[];
}

export class ContentError extends Error {
  constructor(
    message: string,
    readonly details: string[] = [],
  ) {
    super(details.length > 0 ? `${message} ${details.slice(0, 4).join(' | ')}` : message);
  }
}

function relativeUrl(doc: Document, path: string): string {
  // document-relative: works at root, sub-path and local dev
  return new URL(path, doc.baseURI).href;
}

export async function loadContent(): Promise<ContentData> {
  const res = await fetch(relativeUrl(document, 'data/stories.json'));
  if (!res.ok) {
    throw new ContentError(`Could not load the storyboard pages (status ${res.status}).`);
  }
  const json = (await res.json()) as { stories: Story[] };
  const problems = validateStories(json.stories ?? []);
  if (problems.length > 0) {
    throw new ContentError('The storyboard data failed validation.', problems);
  }
  for (const story of json.stories) {
    const sceneProblems: string[] = [];
    if (!knownScene(story.coverScene)) sceneProblems.push(`cover scene '${story.coverScene}' is unknown`);
    for (const p of story.panels) {
      if (!knownScene(p.scene)) sceneProblems.push(`panel '${p.id}' scene '${p.scene}' is unknown`);
    }
    if (sceneProblems.length > 0) {
      throw new ContentError(`Story '${story.id}' references scenes that cannot be drawn.`, sceneProblems);
    }
  }
  return { stories: json.stories };
}

/** App-wide content state (loaded once at startup). */
export class ContentStore {
  private readonly _state = signal<{ status: 'loading' | 'ready' | 'error'; data: ContentData | null; error: string | null }>({
    status: 'loading',
    data: null,
    error: null,
  });
  readonly state = this._state.asReadonly();

  async init(): Promise<void> {
    try {
      const data = await loadContent();
      this._state.set({ status: 'ready', data, error: null });
    } catch (e) {
      this._state.set({ status: 'error', data: null, error: e instanceof Error ? e.message : String(e) });
    }
  }
}
