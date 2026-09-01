/*!
 * Clock Quest — original SVG icon library (line-art nautical, DESIGN_DECISIONS §9).
 * Copyright 2026 Shiplo HQ
 * SPDX-License-Identifier: Apache-2.0
 *
 * Every icon is a 24×24 viewBox fragment drawn for this project — stroke-based
 * ink line-art, no fills except tiny accents. Rendered with stroke="currentColor"
 * so CSS colors them. No emoji, no raster, no third-party icon set.
 */
(function (global) {
  'use strict';

  var ICONS = {
    anchor:
      '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="4.6" r="2"/>' +
      '<path d="M12 6.6v13"/>' +
      '<path d="M7.5 9.5h9"/>' +
      '<path d="M4.5 14a7.5 7.5 0 0 0 15 0"/>' +
      '<path d="M4.5 14l-2 1.5M4.5 14l2.2 1.2M19.5 14l2 1.5M19.5 14l-2.2 1.2"/>' +
      '</g>',
    train:
      '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="6" y="3.5" width="12" height="12.5" rx="3"/>' +
      '<path d="M6 10h12"/>' +
      '<circle cx="9.2" cy="13" r=".9" fill="currentColor" stroke="none"/>' +
      '<circle cx="14.8" cy="13" r=".9" fill="currentColor" stroke="none"/>' +
      '<path d="M8.5 16.5L6 21M15.5 16.5L18 21M7 19h10"/>' +
      '</g>',
    basket:
      '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M4 9.5h16l-1.8 9a2 2 0 0 1-2 1.5H7.8a2 2 0 0 1-2-1.5z"/>' +
      '<path d="M8.5 9.5C8.5 6.5 10 4 12 4s3.5 2.5 3.5 5.5"/>' +
      '<path d="M9 13.5l.8 3.5M12 13.5v3.5M15 13.5l-.8 3.5"/>' +
      '</g>',
    bread:
      '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M5 10c0-2.8 3.1-5 7-5s7 2.2 7 5c0 1.4-.6 2-1.5 2v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-6c-.9 0-1.5-.6-1.5-2z"/>' +
      '<path d="M10 12v4M14 12v4"/>' +
      '</g>',
    lighthouse:
      '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M9.5 21h5l1-11h-7z"/>' +
      '<path d="M9.8 14h4.4M10.2 10h3.6"/>' +
      '<path d="M12 6.5L9.5 10h5z" fill="currentColor" stroke-width="1"/>' +
      '<path d="M12 3v1.5"/>' +
      '<path d="M2.5 5.5L6 7M21.5 5.5L18 7M2.5 11.5L6 10M21.5 11.5L18 10"/>' +
      '</g>',
    bell:
      '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3.5c3.2 0 5.2 2.3 5.2 5.2 0 4 1.3 5.6 2.3 6.8H4.5c1-1.2 2.3-2.8 2.3-6.8C6.8 5.8 8.8 3.5 12 3.5z"/>' +
      '<path d="M10 18.8a2 2 0 0 0 4 0"/>' +
      '<path d="M12 1.8v1.7"/>' +
      '</g>',
    boat:
      '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M4 15.5h16l-2.2 3.6a2 2 0 0 1-1.7 1H8a2 2 0 0 1-1.7-1z"/>' +
      '<path d="M12 15.5V3.5"/>' +
      '<path d="M12 4.5l5.5 8.5H12z" fill="currentColor" stroke-width="1"/>' +
      '<path d="M12 8l-4 5h4"/>' +
      '</g>',
    lunch:
      '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M3.5 11a8.5 8.5 0 0 1 17 0z"/>' +
      '<path d="M3.5 11h17v2.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>' +
      '<path d="M12 15.5V18M8.5 21l2-3M15.5 21l-2-3"/>' +
      '</g>',
    lamp:
      '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M9 10h6l1.5 8h-9z"/>' +
      '<path d="M12 10V6.5"/>' +
      '<circle cx="12" cy="4.8" r="1.7"/>' +
      '<path d="M6 20.5h12"/>' +
      '<path d="M4.5 7l1.8 1M19.5 7l-1.8 1M4.5 12h2M17.5 12h2"/>' +
      '</g>',
    wheel:
      '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="7.5"/>' +
      '<circle cx="12" cy="12" r="2.4"/>' +
      '<path d="M12 4.5v5M12 14.5v5M4.5 12h5M14.5 12h5M6.7 6.7l3.2 3.2M14.1 14.1l3.2 3.2M17.3 6.7l-3.2 3.2M9.9 14.1l-3.2 3.2"/>' +
      '</g>',
    compass:
      '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="9"/>' +
      '<path d="M15.5 8.5l-2.2 5.3-5.3 2.2 2.2-5.3z" fill="currentColor" stroke-width="1"/>' +
      '</g>',
    hourglass:
      '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M6.5 3.5h11M6.5 20.5h11"/>' +
      '<path d="M7.5 3.5c0 4 4.5 5 4.5 8.5s-4.5 4.5-4.5 8.5M16.5 3.5c0 4-4.5 5-4.5 8.5s4.5 4.5 4.5 8.5"/>' +
      '</g>'
  };

  /** Render an icon into an inline <svg> string. */
  function icon(name, size, cls) {
    var body = ICONS[name] || ICONS.compass;
    var s = size || 24;
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" width="' + s + '" height="' + s +
      '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  global.ClockQuestIcons = { icon: icon, names: Object.keys(ICONS) };
})(typeof globalThis !== 'undefined' ? globalThis : this);
