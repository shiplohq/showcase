/*!
 * Aurora Lamp — content loader (content state layer, spec §State model).
 * Copyright 2026 Shiplo HQ
 * SPDX-License-Identifier: Apache-2.0
 *
 * Fetches data/product.json, validates the contract at dev-time (cheap
 * structural checks — this is a static showcase, not a schema library) and
 * hands a frozen copy to the app. Failure degrades to a clear inline
 * message, never a blank page: headings, leads and the drawings live in
 * index.html, so the story stays readable even without data.
 */
(function (global) {
  'use strict';

  function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

  /** Structural validation. Returns array of human-readable problems. */
  function validate(d) {
    var problems = [];
    function need(cond, msg) { if (!cond) problems.push(msg); }

    need(isObj(d), 'root must be an object');
    if (!isObj(d)) return problems;
    need(isNonEmptyString(d.name), 'name');
    need(isNonEmptyString(d.studio), 'studio');
    need(Array.isArray(d.modes) && d.modes.length >= 2, 'modes: need at least 2');
    (d.modes || []).forEach(function (m, i) {
      need(isObj(m) && isNonEmptyString(m.id), 'modes[' + i + '].id');
      need(isObj(m) && isNonEmptyString(m.label), 'modes[' + i + '].label');
      need(isObj(m) && isNonEmptyString(m.temperature), 'modes[' + i + '].temperature');
    });
    need(Array.isArray(d.materials) && d.materials.length >= 2, 'materials: need at least 2');
    (d.materials || []).forEach(function (m, i) {
      need(isObj(m) && isNonEmptyString(m.id), 'materials[' + i + '].id');
      need(isObj(m) && isNonEmptyString(m.name), 'materials[' + i + '].name');
      need(isObj(m) && Array.isArray(m.pieces), 'materials[' + i + '].pieces (array of SVG piece ids)');
    });
    need(Array.isArray(d.parts) && d.parts.length >= 2, 'parts: need at least 2');
    need(isObj(d.dimensions), 'dimensions');
    need(Array.isArray(d.spec) && d.spec.length >= 1, 'spec rows');
    return problems;
  }

  function loadProduct() {
    return fetch('data/product.json', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' fetching data/product.json');
        return res.json();
      })
      .then(function (d) {
        var problems = validate(d);
        if (problems.length) {
          throw new Error('product.json failed its contract: ' + problems.join('; '));
        }
        return d;
      });
  }

  global.AuroraData = { loadProduct: loadProduct, validate: validate };
})(typeof globalThis !== 'undefined' ? globalThis : this);
