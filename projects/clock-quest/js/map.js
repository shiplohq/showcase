/*!
 * Clock Quest — island map (nautical chart SVG, generated from schedule.json).
 * Copyright 2026 Shiplo HQ
 * SPDX-License-Identifier: Apache-2.0
 *
 * The map is the lesson menu: five stop markers on a dashed ferry route.
 * Built entirely from data (places x/y), so new content = new JSON, no code.
 * GSAP MotionPath sails the ferry between stops; the day-phase palette shifts
 * morning → midday → evening → dusk as the quest progresses (§11).
 */
(function (global) {
  'use strict';

  var $ = global.jQuery;
  var Icons = global.ClockQuestIcons;
  var M = global.ClockQuestMotion;

  var VB_W = 1000, VB_H = 700;

  // Hand-authored island silhouette containing all five stops (coastal on
  // purpose: lighthouses belong on the shore). Contour bands come from
  // stroking the same path at three widths.
  var LAND_PATH =
    'M 150,560 C 90,470 100,380 190,340 C 240,250 330,220 430,190 ' +
    'C 540,110 660,90 770,120 C 880,150 950,240 930,330 C 950,430 850,500 760,500 ' +
    'C 680,560 560,540 480,570 C 380,610 240,630 150,560 Z';

  var PHASES = {
    dawn:    { sea: '#C7DAD5', wave: '#A6C6C0', land: '#EFE5C3', sun: '#E8D28E', sunLabel: 'early sun' },
    morning: { sea: '#B9D6D2', wave: '#93BCB6', land: '#F0E6C6', sun: '#F2CB5C', sunLabel: 'morning sun' },
    midday:  { sea: '#AFD4CF', wave: '#8AB4AE', land: '#F2EACA', sun: '#F5C542', sunLabel: 'noon sun' },
    evening: { sea: '#CFCBB0', wave: '#ADA789', land: '#EFE0B9', sun: '#E09A4E', sunLabel: 'evening sun' },
    dusk:    { sea: '#BFC5CB', wave: '#98A2AC', land: '#E6D9B4', sun: '#E8E4D8', sunLabel: 'moon' }
  };

  function routePathFor(places) {
    // smooth ferry route through the stops, in quest order
    var d = 'M ' + places[0].x + ',' + places[0].y;
    for (var i = 1; i < places.length; i++) {
      var prev = places[i - 1];
      var cur = places[i];
      var mx = (prev.x + cur.x) / 2;
      var my = (prev.y + cur.y) / 2;
      var nx = my < Math.min(prev.y, cur.y) ? 0 : 18; // gentle bow away from land
      d += ' Q ' + (mx + nx) + ',' + (my - 24) + ' ' + cur.x + ',' + cur.y;
    }
    return d;
  }

  /** Fractions (0..1 of route length) closest to each stop — sampled once. */
  function stopFractions(pathEl, places) {
    var total = pathEl.getTotalLength();
    var fracs = [];
    var SAMPLES = 400;
    for (var p = 0; p < places.length; p++) {
      var best = 0, bestD = Infinity;
      for (var i = 0; i <= SAMPLES; i++) {
        var s = (i / SAMPLES) * total;
        var pt = pathEl.getPointAtLength(s);
        var dx = pt.x - places[p].x, dy = pt.y - places[p].y;
        var dd = dx * dx + dy * dy;
        if (dd < bestD) { bestD = dd; best = s / total; }
      }
      fracs.push(best);
    }
    fracs[0] = 0;
    fracs[fracs.length - 1] = 1;
    return fracs;
  }

  /**
   * mount($mount, schedule, opts) → instance
   * opts: { onOpenStop(stopId), getStopState(stopId) → 'locked'|'next'|'open'|'done' }
   */
  function mount($mount, schedule, opts) {
    opts = opts || {};
    var places = schedule.places;
    var onOpenStop = opts.onOpenStop || function () {};
    var getStopState = opts.getStopState || function () { return 'open'; };

    var $svg = $('<svg class="island-map" viewBox="0 0 ' + VB_W + ' ' + VB_H +
      '" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Map of Clock Island with five stops"></svg>');

    var html = '';
    // sea
    html += '<rect class="m-sea" x="0" y="0" width="' + VB_W + '" height="' + VB_H + '" rx="18"/>';
    // engraved wave pattern
    html += '<defs><pattern id="wavepat" width="130" height="64" patternUnits="userSpaceOnUse">' +
      '<path d="M 8,18 q 14,-11 28,0 t 28,0 t 28,0" class="m-wave"></path>' +
      '<path d="M 42,50 q 14,-11 28,0 t 28,0" class="m-wave"></path>' +
      '</pattern></defs>';
    html += '<rect x="0" y="0" width="' + VB_W + '" height="' + VB_H + '" rx="18" fill="url(#wavepat)"/>';
    // contour bands + land
    html += '<path class="m-land m-land--outer" d="' + LAND_PATH + '"/>';
    html += '<path class="m-land m-land--mid" d="' + LAND_PATH + '"/>';
    html += '<path class="m-land m-land--face" d="' + LAND_PATH + '"/>';
    // little islets + buoys (decorative)
    html += '<g class="m-deco" aria-hidden="true">' +
      '<path class="m-islet" d="M 70,210 c 18,-26 52,-24 62,-4 c 12,22 -14,40 -36,34 c -18,-5 -34,-14 -26,-30 z"/>' +
      '<path class="m-islet" d="M 905,540 c 14,-18 40,-16 48,0 c 8,16 -10,30 -26,26 c -14,-4 -26,-10 -22,-26 z"/>' +
      '<g class="m-buoy" transform="translate(255,640)"><circle r="5"/><path d="M 0,-5 L 0,-16 L 10,-13 Z"/></g>' +
      '<g class="m-buoy" transform="translate(60,430)"><circle r="5"/><path d="M 0,-5 L 0,-16 L 10,-13 Z"/></g>' +
      '<g class="m-buoy" transform="translate(960,120)"><circle r="5"/><path d="M 0,-5 L 0,-16 L 10,-13 Z"/></g>' +
      '</g>';
    // sun / moon disc
    html += '<g class="m-sun" aria-hidden="true"><circle cx="905" cy="70" r="26"/><path class="m-sun-ray" d="M 905,32 v -10 M 943,70 h 10 M 905,108 v 10 M 867,70 h -10"/></g>';
    // compass rose
    html += '<g class="m-compass" aria-hidden="true" transform="translate(92,600)">' +
      '<circle r="40"/><circle r="30"/>' +
      '<path d="M 0,-36 L 7,0 L 0,36 L -7,0 Z" class="m-compass-needle"/>' +
      '<path d="M -36,0 L 0,-7 L 36,0 L 0,7 Z" class="m-compass-needle m-compass-needle--ew"/>' +
      '<text class="m-compass-n" x="0" y="-46" text-anchor="middle">N</text>' +
      '</g>';
    // route
    var routeD = routePathFor(places);
    html += '<path class="m-route" id="m-route" d="' + routeD + '"/>';
    // stops
    html += '<g class="m-stops">';
    places.forEach(function (place) {
      html += '<g class="m-stop" data-stop="' + place.id + '" transform="translate(' + place.x + ',' + place.y + ')" role="button" tabindex="0" aria-label="' + place.name + '">' +
        '<rect class="m-stop-hit" x="-70" y="-62" width="140" height="140" fill="transparent"/>' +
        '<circle class="m-stop-halo" r="36"/>' +
        '<circle class="m-stop-disc" r="27"/>' +
        '<g class="m-stop-icon" transform="translate(-13,-13)">' + Icons.icon(place.icon, 26) + '</g>' +
        '<g class="m-stop-flag" transform="translate(14,-30)"><path d="M 0,0 L 0,-16 L 12,-12 L 0,-8"/></g>' +
        '<g class="m-stop-stamp" transform="rotate(-10)"><rect x="-19" y="-19" width="38" height="38" rx="4"/><path d="M -8,2 L -2,8 L 10,-7"/></g>' +
        '<text class="m-stop-label" y="48" text-anchor="middle">' + place.name + '</text>' +
        '</g>';
    });
    html += '</g>';
    // ferry token (above everything)
    html += '<g class="m-ferry" aria-hidden="true"><g transform="scale(1.15)">' +
      Icons.icon('boat', 30)
      + '</g></g>';
    $svg.html(html);
    $mount.append($svg);

    var $route = $svg.find('.m-route');
    var $ferry = $svg.find('.m-ferry');
    var fracs = stopFractions($route[0], places);
    var currentFracIndex = 0;
    var phase = 'morning';

    // park the ferry on the first stop
    if (global.gsap && global.MotionPathPlugin && M.available) {
      global.gsap.set($ferry[0], {
        motionPath: { path: $route[0], start: 0, end: 0, align: $route[0], alignOrigin: [0.5, 0.5] }
      });
    }

    function placeFerryInstant(index) {
      currentFracIndex = index;
      if (global.gsap && global.MotionPathPlugin && M.available) {
        global.gsap.set($ferry[0], {
          motionPath: { path: $route[0], start: fracs[index], end: fracs[index], align: $route[0], alignOrigin: [0.5, 0.5] }
        });
      }
    }

    function moveFerry(toIndex, done) {
      if (toIndex === currentFracIndex) { if (done) done(); return; }
      var from = fracs[currentFracIndex];
      var to = fracs[toIndex];
      currentFracIndex = toIndex;
      if (!(global.gsap && global.MotionPathPlugin) || M.reduced()) {
        placeFerryInstant(toIndex);
        if (done) done();
        return;
      }
      M.t($ferry[0], {
        duration: 0.46,
        ease: 'power1.inOut',
        motionPath: { path: $route[0], start: from, end: to, align: $route[0], alignOrigin: [0.5, 0.5], autoRotate: true }
      }).eventCallback('onComplete', function () { if (done) done(); });
    }

    function setPhase(newPhase) {
      var pal = PHASES[newPhase] || PHASES.morning;
      phase = newPhase;
      var mapEl = $svg[0];
      if (M.reduced() || !M.available) {
        mapEl.style.setProperty('--sea', pal.sea);
        mapEl.style.setProperty('--wave', pal.wave);
        mapEl.style.setProperty('--land', pal.land);
        $svg.find('.m-sun circle').attr('fill', pal.sun);
        return;
      }
      global.gsap.to(mapEl, { '--sea': pal.sea, '--wave': pal.wave, '--land': pal.land, duration: 0.4, ease: 'power1.inOut' });
      global.gsap.to($svg.find('.m-sun circle')[0], { attr: { fill: pal.sun }, duration: 0.4 });
    }

    function refresh() {
      $svg.find('.m-stop').each(function () {
        var stopId = $(this).data('stop');
        var state = getStopState(stopId);
        var place = places.find(function (p) { return p.id === stopId; });
        var spoken = {
          next: 'next stop',
          done: 'done, stamped',
          open: 'ready to visit',
          locked: 'locked, finish the earlier stops first'
        }[state];
        $(this).attr('data-state', state)
          .attr('aria-label', (place ? place.name : stopId) + ' — ' + spoken)
          .attr('aria-disabled', state === 'locked' ? 'true' : null)
          .attr('tabindex', state === 'locked' ? -1 : 0);
      });
    }

    $svg.on('click', '.m-stop', function () {
      var stopId = $(this).data('stop');
      if ($(this).attr('data-state') === 'locked') return;
      onOpenStop(stopId);
    });
    $svg.on('keydown', '.m-stop', function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ' && ev.key !== 'Spacebar') return;
      ev.preventDefault();
      $(this).trigger('click');
    });

    setPhase('dawn');
    refresh();

    return {
      $svg: $svg,
      refresh: refresh,
      moveFerry: moveFerry,
      placeFerryInstant: placeFerryInstant,
      setPhase: setPhase,
      getPhase: function () { return phase; },
      ferryIndex: function () { return currentFracIndex; }
    };
  }

  global.ClockQuestMap = { mount: mount, PHASES: PHASES };
})(typeof globalThis !== 'undefined' ? globalThis : this);
