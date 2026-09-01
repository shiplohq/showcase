/*!
 * Clock Quest — content loader (JSON fetch + validation).
 * Copyright 2026 Shiplo HQ
 * SPDX-License-Identifier: Apache-2.0
 *
 * Content state layer: lessons.json + schedule.json. A fetch or validation
 * failure must degrade into a readable error screen with a retry — never a
 * white page (spec: runtime error → clear message).
 */
(function (global) {
  'use strict';

  var E = global.ClockQuestEngine;

  function ContentError(message, detail) {
    var err = new Error(message);
    err.name = 'ContentError';
    err.detail = detail || '';
    return err;
  }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw ContentError('Could not load ' + url + ' (HTTP ' + res.status + ').');
      return res.text();
    }).then(function (text) {
      try {
        return JSON.parse(text);
      } catch (e) {
        throw ContentError(url + ' is not valid JSON.', e.message);
      }
    });
  }

  /**
   * Loads and validates both content files. Resolves { lessons, schedule }.
   * Rejects with a ContentError carrying a child-friendly message.
   */
  function loadContent() {
    return Promise.all([fetchJson('data/lessons.json'), fetchJson('data/schedule.json')])
      .then(function (files) {
        var lessons = files[0];
        var schedule = files[1];
        var errors = []
          .concat(E.validateLessons(lessons).errors)
          .concat(E.validateSchedule(schedule).errors)
          .concat(E.validateReferences(lessons, schedule).errors);
        if (errors.length) {
          throw ContentError(
            'The island data has a few torn pages.',
            errors.slice(0, 6).join(' | ')
          );
        }
        return { lessons: lessons, schedule: schedule };
      })
      .catch(function (err) {
        if (err && err.name === 'ContentError') throw err;
        // network failure / file:// fetch rejection / offline
        throw ContentError(
          'The island map could not be loaded.',
          String(err && err.message ? err.message : err)
        );
      });
  }

  global.ClockQuestData = { loadContent: loadContent, ContentError: ContentError };
})(typeof globalThis !== 'undefined' ? globalThis : this);
