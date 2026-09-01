/*!
 * Clock Quest — analog clock component (SVG + GSAP Draggable).
 * Copyright 2026 Shiplo HQ
 * SPDX-License-Identifier: Apache-2.0
 *
 * The teaching object: a station clock whose hands can be dragged (pointer),
 * stepped (buttons/arrow keys) and read (digital twin is rendered by the app).
 * The whole face is the grab area: Draggable rotates a proxy pinned to the
 * dial centre (rotary-knob pattern); the pointer's proximity to a hand picks
 * WHICH hand turns. Keyboard users drive the same selected hand with arrows,
 * so no one has to simulate a pixel drag (DESIGN_DECISIONS §13).
 */
(function (global) {
  'use strict';

  var $ = global.jQuery;
  var M = global.ClockQuestMotion;
  var E = global.ClockQuestEngine;

  var CX = 150, CY = 150;
  var R_FACE = 138, R_TICK_OUT = 126, R_TICK_IN_HOUR = 112, R_TICK_IN_MIN = 119, R_NUM = 96, R_ARC = 118;

  function pt(angleDeg, radius) {
    var a = (angleDeg - 90) * Math.PI / 180; // 0° = 12 o'clock, clockwise
    return {
      x: CX + radius * Math.cos(a),
      y: CY + radius * Math.sin(a)
    };
  }

  function buildSvg() {
    var s = '';
    // face
    s += '<circle class="c-face" cx="' + CX + '" cy="' + CY + '" r="' + R_FACE + '"/>';
    s += '<circle class="c-face-ring" cx="' + CX + '" cy="' + CY + '" r="' + (R_FACE - 7) + '"/>';
    // ticks
    s += '<g class="c-ticks">';
    for (var i = 0; i < 60; i++) {
      var isHour = i % 5 === 0;
      var a = i * 6;
      var p1 = pt(a, isHour ? R_TICK_IN_HOUR : R_TICK_IN_MIN);
      var p2 = pt(a, R_TICK_OUT);
      s += '<line class="' + (isHour ? 'c-tick c-tick--hour' : 'c-tick') +
        '" x1="' + p1.x.toFixed(2) + '" y1="' + p1.y.toFixed(2) +
        '" x2="' + p2.x.toFixed(2) + '" y2="' + p2.y.toFixed(2) + '"/>';
    }
    s += '</g>';
    // numerals
    s += '<g class="c-numerals">';
    for (var n = 1; n <= 12; n++) {
      var np = pt(n * 30, R_NUM);
      s += '<text class="c-numeral" x="' + np.x.toFixed(2) + '" y="' + np.y.toFixed(2) +
        '" text-anchor="middle" dominant-baseline="central">' + n + '</text>';
    }
    s += '</g>';
    // measure arc (hint) — drawn dynamically
    s += '<g class="c-arc-group" hidden><path class="c-arc" id="c-arc-path"/><g class="c-arc-labels"></g></g>';
    // hands (drawn hour-first so the minute hand sits above near the centre)
    s += '<g class="c-hand c-hand--hour" data-hand="hour">' +
      '<line class="c-hand-hit" x1="' + CX + '" y1="' + CY + '" x2="' + CX + '" y2="' + (CY - 92) + '"/>' +
      '<line class="c-hand-line" x1="' + CX + '" y1="' + (CY + 18) + '" x2="' + CX + '" y2="' + (CY - 88) + '"/>' +
      '</g>';
    s += '<g class="c-hand c-hand--minute" data-hand="minute">' +
      '<line class="c-hand-hit" x1="' + CX + '" y1="' + CY + '" x2="' + CX + '" y2="' + (CY - 136) + '"/>' +
      '<line class="c-hand-line" x1="' + CX + '" y1="' + (CY + 26) + '" x2="' + CX + '" y2="' + (CY - 128) + '"/>' +
      '</g>';
    s += '<circle class="c-cap" cx="' + CX + '" cy="' + CY + '" r="10"/>';
    return s;
  }

  /**
   * mount($wrap, opts) → instance
   * opts: { snap, selected, onChange(clock, source), onRelease(clock), labels }
   */
  function mount($wrap, opts) {
    opts = opts || {};
    var snap = opts.snap || 5;
    var selected = opts.selected || 'minute';
    var onChange = opts.onChange || function () {};
    var onRelease = opts.onRelease || function () {};
    var enabled = true;
    var current = E.normalizeClock(E.START_CLOCK);
    var drag = null;
    var arcTimer = null;

    var $svg = $('<svg class="clock" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" role="img"></svg>')
      .attr('aria-label', 'Analog clock. Use the hand buttons and steppers below, or focus the clock and press the arrow keys.');
    $svg.html(buildSvg());
    $wrap.addClass('clock-wrap');
    if (opts.focusable !== false) $wrap.attr('tabindex', '0'); // read-only clocks are not tab stops
    $wrap.append($svg);

    var $hour = $svg.find('.c-hand--hour');
    var $minute = $svg.find('.c-hand--minute');
    var $arcGroup = $svg.find('.c-arc-group');
    var $arcPath = $svg.find('.c-arc');
    var $arcLabels = $svg.find('.c-arc-labels');

    // rotary proxy pinned to the dial centre
    var $proxy = $('<div class="clock-proxy" aria-hidden="true"></div>');
    $wrap.append($proxy);

    M.set([$hour[0], $minute[0]], { svgOrigin: CX + ' ' + CY });

    function handAngle(clock, hand) {
      return hand === 'hour' ? E.hourAngle(clock) : E.minuteAngle(clock);
    }

    function applyClock(clock, animate) {
      current = E.normalizeClock(clock);
      var varsHour = { rotation: handAngle(current, 'hour') };
      var varsMin = { rotation: handAngle(current, 'minute') };
      if (animate) {
        M.t($hour[0], Object.assign({ duration: 0.18, ease: 'power2.out' }, varsHour));
        M.t($minute[0], Object.assign({ duration: 0.18, ease: 'power2.out' }, varsMin));
      } else {
        M.set($hour[0], varsHour);
        M.set($minute[0], varsMin);
      }
      syncProxy();
    }

    function syncProxy() {
      if (drag && drag.isDragging) return;
      M.set($proxy[0], { rotation: handAngle(current, selected) });
    }

    function setSelected(hand) {
      if (hand !== 'hour' && hand !== 'minute') return;
      selected = hand;
      $svg.toggleClass('is-hour-selected', hand === 'hour');
      $svg.toggleClass('is-minute-selected', hand === 'minute');
      $hour.toggleClass('is-active', hand === 'hour');
      $minute.toggleClass('is-active', hand === 'minute');
      syncProxy();
    }

    function setSnap(step) { snap = step; }

    function setEnabled(on) {
      enabled = !!on;
      $wrap.toggleClass('is-disabled', !enabled);
      if (drag) drag.enabled(enabled);
    }

    // -- pointer → which hand? nearest by radius+angle ----------------------
    function pickHand(ev) {
      var rect = $svg[0].getBoundingClientRect();
      var scale = rect.width / 300;
      var x = (ev.clientX - (rect.left + rect.width / 2)) / scale;
      var y = (ev.clientY - (rect.top + rect.height / 2)) / scale;
      var radius = Math.sqrt(x * x + y * y);
      var angle = ((Math.atan2(x, -y) * 180 / Math.PI) + 360) % 360;
      function angDiff(a, b) { var d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); }
      var dHour = Math.abs(radius - 92) * 0.9 + angDiff(angle, handAngle(current, 'hour')) * 1.1;
      var dMin = Math.abs(radius - 132) * 0.9 + angDiff(angle, handAngle(current, 'minute')) * 1.1;
      return dMin < dHour ? 'minute' : 'hour';
    }

    function rotationToClock(rotation) {
      var clock = E.normalizeClock(current);
      if (selected === 'minute') {
        var stepDeg = 6 * snap;
        var snapped = Math.round(rotation / stepDeg) * stepDeg;
        var minutes = Math.round((snapped % 360 + 360) % 360 / 6) % 60;
        clock.minute = minutes;
      } else {
        var hour12 = Math.round((((rotation % 360) + 360) % 360) / 30) % 12;
        var base = clock.hour >= 12 ? 12 : 0;
        clock.hour = base + hour12;
      }
      return clock;
    }

    // -- Draggable (rotary proxy, trigger = the face) ------------------------
    if (global.gsap && global.Draggable && M.available) {
      drag = global.Draggable.create($proxy[0], {
        trigger: $svg[0],
        type: 'rotation',
        minimumMovement: 2,
        cursor: 'grab',
        activeCursor: 'grabbing',
        onPress: function (ev) {
          if (!enabled) { this.endDrag(ev); return; }
          var hand = pickHand(ev);
          if (hand !== selected) {
            selected = hand;
            setSelected(hand);
            if (typeof opts.onHandPicked === 'function') opts.onHandPicked(hand);
          }
          $wrap.addClass('is-dragging');
        },
        onDrag: function () {
          if (!enabled) return;
          var clock = rotationToClock(this.rotation);
          // carry the hour when the minute hand sweeps past the 12 (real-clock feel)
          var d = clock.minute - current.minute;
          if (d < -30) clock.hour += 1;
          else if (d > 30) clock.hour -= 1;
          clock = E.normalizeClock(clock);
          applyClock(clock, false);
          onChange(clock, 'drag');
        },
        onDragEnd: function () {
          $wrap.removeClass('is-dragging');
          if (!enabled) return;
          var stepDeg = selected === 'minute' ? 6 * snap : 30;
          var target = Math.round(this.rotation / stepDeg) * stepDeg;
          M.t($proxy[0], { rotation: target, duration: 0.16, ease: 'power2.out' });
          var clock = rotationToClock(target);
          applyClock(clock, true);
          onRelease(clock);
          onChange(clock, 'release');
        }
      })[0];
    }

    // -- keyboard: arrows nudge the selected hand (snap-sized, hour-carrying) ---
    function nudge(dir) {
      if (!enabled) return;
      var clock = E.normalizeClock(current);
      if (selected === 'minute') {
        var total = clock.hour * 60 + clock.minute + snap * dir;
        clock.hour = Math.floor(total / 60);
        clock.minute = ((total % 60) + 60) % 60;
      } else {
        clock.hour += dir;
      }
      var norm = E.normalizeClock(clock);
      applyClock(norm, true);
      onRelease(norm);
      onChange(norm, 'keys');
    }

    $wrap.on('keydown.clockquest', function (ev) {
      var map = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 };
      if (!(ev.key in map)) return;
      ev.preventDefault();
      nudge(map[ev.key]);
    });

    // -- measuring arc (the hint: 12 → hand, counted in fives) -----------------
    function showMeasureArc() {
      if (arcTimer) { clearTimeout(arcTimer); arcTimer = null; }
      var minute = current.minute;
      var endAngle = minute * 6;
      if (endAngle === 0) endAngle = 360; // full sweep when the hand is on 12
      var p0 = pt(0, R_ARC);
      var p1 = pt(endAngle, R_ARC);
      var large = endAngle - 0 > 180 ? 1 : 0;
      var d = 'M ' + p0.x.toFixed(2) + ' ' + p0.y.toFixed(2) +
        ' A ' + R_ARC + ' ' + R_ARC + ' 0 ' + large + ' 1 ' + p1.x.toFixed(2) + ' ' + p1.y.toFixed(2);
      $arcPath.attr('d', d);
      // counting labels every 5 minutes along the swept arc
      var labels = '';
      for (var m = 5; m <= Math.round(endAngle / 6); m += 5) {
        var lp = pt(m * 6, R_ARC + 19);
        labels += '<text class="c-arc-label" x="' + lp.x.toFixed(1) + '" y="' + lp.y.toFixed(1) +
          '" text-anchor="middle" dominant-baseline="central">' + m + '</text>';
      }
      $arcLabels.html(labels);
      $arcGroup.removeAttr('hidden');

      if (M.reduced()) {
        $arcGroup.css('opacity', 1);
        arcTimer = setTimeout(hideArc, 2600);
        return;
      }
      var len = $arcPath[0].getTotalLength();
      $arcPath.css({ strokeDasharray: len, strokeDashoffset: len });
      global.gsap.fromTo($arcPath[0],
        { strokeDashoffset: len, opacity: 0.95 },
        {
          strokeDashoffset: 0, opacity: 0.95, duration: 0.6, ease: 'power1.inOut',
          onComplete: function () { $arcPath.css({ strokeDasharray: 'none', strokeDashoffset: 0 }); }
        });
      global.gsap.fromTo($arcLabels.children().toArray(), { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: 0.03 });
      arcTimer = setTimeout(hideArc, 2200);
    }

    function hideArc() {
      if (arcTimer) { clearTimeout(arcTimer); arcTimer = null; }
      if (M.reduced()) { $arcGroup.attr('hidden', 'hidden'); return; }
      global.gsap.to($arcGroup[0], {
        opacity: 0, duration: 0.15, onComplete: function () {
          $arcGroup.attr('hidden', 'hidden').css('opacity', '');
        }
      });
    }

    // announce the time once when a keyboard user lands on the clock
    $wrap.on('focus.clockquest', function () {
      if (typeof opts.onFocus === 'function') opts.onFocus(E.normalizeClock(current));
    });

    setSelected(selected);
    applyClock(current, false);

    return {
      $wrap: $wrap,
      $svg: $svg,
      getTime: function () { return E.normalizeClock(current); },
      setTime: function (clock, animate) { applyClock(clock, animate !== false); },
      setSelected: setSelected,
      getSelected: function () { return selected; },
      setSnap: setSnap,
      setEnabled: setEnabled,
      nudge: nudge,
      showMeasureArc: showMeasureArc,
      focus: function () { $wrap.trigger('focus'); },
      destroy: function () {
        if (arcTimer) clearTimeout(arcTimer);
        if (drag && drag.kill) drag.kill();
        $wrap.off('keydown.clockquest focus.clockquest');
        $wrap.removeClass('clock-wrap is-disabled').removeAttr('tabindex');
      }
    };
  }

  global.ClockQuestClock = { mount: mount };
})(typeof globalThis !== 'undefined' ? globalThis : this);
