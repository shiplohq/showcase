/*!
 * Clock Quest — application orchestration (jQuery).
 * Copyright 2026 Shiplo HQ
 * SPDX-License-Identifier: Apache-2.0
 *
 * Wires the three layers together: JSON content → engine state → UI.
 * Screens: island map (home) · quest ticket overlay · finale journal · error.
 * Anonymous progress in localStorage with a visible reset (spec). No network
 * beyond the two local JSON fetches. No timers, no scores, no penalties.
 */
(function (global) {
  'use strict';

  var $ = global.jQuery;
  var E = global.ClockQuestEngine;
  var M = global.ClockQuestMotion;
  var Icons = global.ClockQuestIcons;
  var Data = global.ClockQuestData;

  var STORAGE_KEY = 'clock-quest-progress-v1';

  var content = null;   // { lessons, schedule }
  var state = null;     // engine session
  var map = null;       // island map instance
  var clockCmp = null;  // clock instance while a set-clock mission is open
  var boardClock = null; // read-only clock shown beside a departure board
  var lastFocus = null;
  var carriedChip = null;

  // ---------------------------------------------------------------------------
  $(function () {
    if (!E || !Data) {
      showError({ message: 'The island data could not be loaded.', detail: 'engine/data modules missing' });
      return;
    }
    bindHeader();
    $('#errorRetry').on('click', function () {
      $('#errorScreen').attr('hidden', 'hidden');
      boot();
    });
    boot();
  });

  function boot() {
    $('#loadingScreen').removeAttr('hidden');
    Data.loadContent().then(function (loaded) {
      content = loaded;
      state = E.createSession(content.lessons, content.schedule, loadSaved());
      buildHome();
      $('#loadingScreen').attr('hidden', 'hidden');
    }).catch(function (err) {
      showError(err);
    });
  }

  function showError(err) {
    $('#loadingScreen').attr('hidden', 'hidden');
    $('#errorMessage').text(err && err.message ? err.message : 'Something went wrong.');
    var detail = err && err.detail ? String(err.detail) : '';
    $('#errorDetail').text(detail).toggle(!!detail);
    $('#errorScreen').removeAttr('hidden');
  }

  // -- persistence (anonymous, resettable) ------------------------------------

  function saveProgress() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(E.serialize(state)));
    } catch (e) { /* private mode / disabled storage — session-only progress */ }
  }

  function loadSaved() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function clearProgress() {
    try { global.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  // -- header ------------------------------------------------------------------

  function bindHeader() {
    $('#resetBtn').on('click', function () {
      var $confirm = $('#resetConfirm');
      if ($confirm.attr('hidden')) {
        $confirm.removeAttr('hidden');
        $confirm.find('.reset-ok').trigger('focus');
      } else {
        $confirm.attr('hidden', 'hidden');
      }
    });
    $('#resetConfirm').on('click', function (ev) {
      ev.stopPropagation();
    });
    $('#resetConfirm .reset-ok').on('click', function () {
      clearProgress();
      state = E.createSession(content.lessons, content.schedule, null);
      closeOverlay(true);
      $('#finaleScreen').attr('hidden', 'hidden');
      $('#resetConfirm').attr('hidden', 'hidden');
      buildHome();
      announce('Journal cleared. A fresh day on Clock Island!');
    });
    $('#resetConfirm .reset-cancel').on('click', function () {
      $('#resetConfirm').attr('hidden', 'hidden');
      $('#resetBtn').trigger('focus');
    });
    $(document).on('click', function (ev) {
      var $confirm = $('#resetConfirm');
      if ($confirm.attr('hidden')) return;
      if ($(ev.target).closest('.reset-wrap').length) return;
      $confirm.attr('hidden', 'hidden');
      $('#resetBtn').trigger('focus'); // don't strand keyboard users on <body>
    });
  }

  function renderPassport() {
    var $strip = $('#passport');
    if (!$strip.children().length) {
      var html = '';
      content.lessons.quest.stops.forEach(function (stop) {
        var place = placeOf(stop);
        html += '<span class="stamp stamp-slot" data-stop="' + stop.id + '" aria-hidden="true">' +
          Icons.icon(place.icon, 22) + '</span>';
      });
      $strip.html(html);
      $strip.before('<span class="passport-label" aria-hidden="true">Journal stamps</span>');
    }
    $strip.children().each(function () {
      var has = state.stamps.indexOf($(this).data('stop')) !== -1;
      $(this).toggleClass('is-stamped', has);
    });
  }

  function stampArrives(stopId) {
    var $stamp = $('#passport .stamp[data-stop="' + stopId + '"]');
    if (!$stamp.length) return;
    $stamp.addClass('is-stamped is-arriving');
    if (M.available) {
      M.t($stamp[0], { scale: 1.5, rotation: -14, duration: 0.01 })
        .eventCallback('onComplete', function () {
          M.t($stamp[0], { scale: 1, rotation: -6, duration: M.dur(450), ease: 'back.out(1.2)' })
            .eventCallback('onComplete', function () { $stamp.removeClass('is-arriving'); });
        });
    }
  }

  // -- home (island map) ---------------------------------------------------------

  function buildHome() {
    var $mount = $('#mapMount');
    $mount.empty();
    map = global.ClockQuestMap.mount($mount, content.schedule, {
      onOpenStop: openStop,
      getStopState: function (stopId) {
        var idx = stopIndexById(stopId);
        if (E.isStopDone(state, content.lessons, idx)) return 'done';
        if (idx === E.nextStopIndex(state, content.lessons)) return 'next';
        if (E.isStopUnlocked(state, content.lessons, idx)) return 'open';
        return 'locked';
      }
    });
    var openIdx = E.nextStopIndex(state, content.lessons);
    map.placeFerryInstant(openIdx === -1 ? content.lessons.quest.stops.length - 1 : openIdx);
    map.setPhase(phaseForStop(Math.max(0, openIdx === -1 ? content.lessons.quest.stops.length - 1 : openIdx)));
    renderPassport();
    renderJournalPanel();
    map.refresh();
  }

  function renderJournalPanel() {
    var quest = content.lessons.quest;
    var openIdx = E.nextStopIndex(state, content.lessons);
    var prog = E.progress(state, content.lessons);
    var $panel = $('#journalPanel');
    var $progress = $('#journeyProgress');

    if (openIdx === -1) {
      $panel.html(
        '<h2 class="panel-title">A perfect day!</h2>' +
        '<p class="panel-copy">Every stop visited, every clock set just right. Your journal is full of stamps.</p>' +
        '<button type="button" class="btn btn--primary" id="panelOpen">Open your journal</button>'
      );
    } else {
      var stop = quest.stops[openIdx];
      var place = placeOf(stop);
      var sp = E.stopProgress(state, content.lessons, openIdx);
      var intro = prog.solved === 0 ? '<p class="panel-intro">' + quest.intro + '</p>' : '';
      $panel.html(
        intro +
        '<p class="panel-kicker">Next stop</p>' +
        '<h2 class="panel-title">' + place.name + '</h2>' +
        '<p class="panel-copy">' + stop.brief + '</p>' +
        '<p class="panel-meta">' + sp.solved + ' of ' + sp.total + ' missions done</p>' +
        '<button type="button" class="btn btn--primary" id="panelOpen">Sail there</button>'
      );
    }
    $('#panelOpen').on('click', function () {
      var idx = E.nextStopIndex(state, content.lessons);
      if (idx === -1) showFinale();
      else openStop(quest.stops[idx].id);
    });
    // progress speaks in the child's unit (stops); aria keeps mission detail
    var stopsDone = quest.stops.filter(function (s, i) { return E.isStopDone(state, content.lessons, i); }).length;
    $progress.attr('aria-label', 'Journey progress: ' + stopsDone + ' of ' + quest.stops.length +
        ' stops done, ' + prog.solved + ' of ' + prog.total + ' missions')
      .find('.progress-fill').css('transform', 'scaleX(' + (quest.stops.length ? stopsDone / quest.stops.length : 0) + ')');
    $progress.find('.progress-text').text(stopsDone + ' of ' + quest.stops.length + ' stops');
  }

  // -- quest overlay --------------------------------------------------------------

  function stopIndexById(stopId) {
    return content.lessons.quest.stops.findIndex(function (s) { return s.id === stopId; });
  }

  function openStop(stopId) {
    var idx = stopIndexById(stopId);
    if (idx === -1) return;
    // a stamped stop is a happy dead end, not a flash-open-close
    if (E.isStopDone(state, content.lessons, idx)) {
      toast(placeOf(content.lessons.quest.stops[idx]).name + ' is already stamped — sail on!');
      announce(placeOf(content.lessons.quest.stops[idx]).name + ' is already stamped. Choose the next stop.');
      return;
    }
    state = E.startStop(state, content.lessons, idx);
    map.setPhase(phaseForStop(idx));
    var $overlay = $('#questOverlay');
    lastFocus = document.activeElement;
    $overlay.removeAttr('hidden');
    $('body').addClass('has-overlay');
    renderMission();
    if (M.available && !M.reduced()) {
      global.gsap.fromTo($overlay.find('.ticket')[0], { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: 'power1.out' });
    }
    trapFocus($overlay);
    $overlay.find('.ticket-close').trigger('focus');
  }

  function closeOverlay(silent) {
    var $overlay = $('#questOverlay');
    if ($overlay.attr('hidden')) return;
    destroyClock();
    $overlay.attr('hidden', 'hidden');
    $('body').removeClass('has-overlay');
    $(document).off('keydown.escclose');
    if (lastFocus && lastFocus.focus && !silent) $(lastFocus).trigger('focus');
    renderJournalPanel();
    map.refresh();
  }

  function trapFocus($scope) {
    $scope.off('keydown.focusguard').on('keydown.focusguard', function (ev) {
      if (ev.key !== 'Tab') return;
      var $focusable = $scope.find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        .filter(':visible');
      if (!$focusable.length) return;
      var first = $focusable[0];
      var last = $focusable[$focusable.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
    $scope.off('keydown.escclose');
    $(document).off('keydown.escclose').on('keydown.escclose', function (ev) {
      if (ev.key !== 'Escape') return;
      if ($('#questOverlay').attr('hidden')) return;
      ev.stopPropagation();
      closeOverlay();
    });
  }

  function phaseForStop(stopIndex) {
    return content.lessons.quest.stops[stopIndex].phase || 'morning';
  }

  function placeOf(stop) {
    var id = stop.placeId || stop.id;
    return content.schedule.places.find(function (p) { return p.id === id; }) ||
      { id: id, name: stop.title, icon: 'compass' };
  }

  function renderMission() {
    destroyClock();
    carriedChip = null;
    var stop = E.currentStop(state, content.lessons);
    var mission = E.currentMission(state, content.lessons);
    if (!mission) { closeOverlay(); return; }
    var place = placeOf(stop);
    var sp = E.stopProgress(state, content.lessons, state.stopIndex);

    var $ticket = $('#ticket');
    $ticket.attr('data-mode', mission.mode);
    $ticket.html(
      '<div class="ticket-head">' +
      '<span class="ticket-place">' + Icons.icon(place.icon, 26) + '<span>' + place.name + '</span></span>' +
      '<span class="ticket-count">Mission ' + (state.missionIndex + 1) + ' of ' + sp.total + '</span>' +
      '<button type="button" class="ticket-close" aria-label="Close mission and return to the map">' +
      Icons.icon('hourglass', 20) + ' Back to map</button>' +
      '</div>' +
      '<h2 class="ticket-prompt" id="ticketPrompt">' + mission.prompt + '</h2>' +
      '<div class="ticket-body" id="ticketBody"></div>' +
      '<div class="ticket-foot" id="ticketFoot"></div>' +
      '<div class="feedback" id="feedback" role="status" aria-live="polite" data-feedback="idle"></div>'
    );
    $ticket.find('.ticket-close').on('click', function () { closeOverlay(); });

    if (mission.mode === 'set-clock') renderSetClock(mission);
    else if (mission.mode === 'read-schedule') renderBoard(mission);
    else renderRecap(mission);

    $ticket.find('.cta-hint').on('click', function () {
      if (mission.mode === 'set-clock' && clockCmp) clockCmp.showMeasureArc();
      setFeedback('hint', mission.hint);
    });

    // keyboard continuity: if the button that solved the last mission removed
    // itself, land focus on the ticket instead of dropping to <body>
    if (!document.activeElement || document.activeElement === document.body) {
      $ticket.find('.ticket-close').trigger('focus');
    }
  }

  function destroyClock() {
    if (clockCmp) { clockCmp.destroy(); clockCmp = null; }
    if (boardClock) { boardClock.destroy(); boardClock = null; }
  }

  // -- mode: set-clock ------------------------------------------------------------

  function renderSetClock(mission) {
    var snap = mission.snapMinutes || 5;
    var stepLabel = snap + ' minutes';

    $('#ticketBody').html(
      '<div class="clock-zone">' +
      '<div class="clock-mount" id="clockMount"></div>' +
      '<div class="clock-side">' +
      '<div class="digital-readout"><span class="digital-target">Be there by <strong>' + E.format12(mission.targetTime) + '</strong></span>' +
      '<span class="digital-now" id="digitalNow">' + E.formatDigital(state.clock) + '</span></div>' +
      '<fieldset class="hand-select"><legend class="sr-only">Which hand will you turn?</legend>' +
      '<input type="radio" name="hand" id="handMin" value="minute" checked><label for="handMin"><span class="hand-swatch hand-swatch--minute" aria-hidden="true"></span>Minute hand</label>' +
      '<input type="radio" name="hand" id="handHour" value="hour"><label for="handHour"><span class="hand-swatch hand-swatch--hour" aria-hidden="true"></span>Hour hand</label>' +
      '</fieldset>' +
      '<div class="steppers" role="group" aria-label="Move the selected hand">' +
      '<button type="button" class="stepper-btn" data-dir="-1" aria-label="Move the selected hand back by one step">−</button>' +
      '<span class="stepper-note" id="stepperNote">by ' + stepLabel + '</span>' +
      '<button type="button" class="stepper-btn" data-dir="1" aria-label="Move the selected hand forward by one step">+</button>' +
      '</div>' +
      '<p class="clock-help">Drag a hand on the clock. Or press the arrow keys.</p>' +
      '</div></div>'
    );

    clockCmp = global.ClockQuestClock.mount($('#clockMount'), {
      snap: snap,
      selected: 'minute',
      onHandPicked: function (hand) {
        $('input[name="hand"][value="' + hand + '"]').prop('checked', true).trigger('change');
      },
      onChange: function (clock) {
        state = E.setClock(state, clock);
        $('#digitalNow').text(E.formatDigital(clock));
      },
      onRelease: function (clock) {
        announce(E.ariaClockStatus(state));
      },
      onFocus: function (clock) {
        announce(E.ariaClockStatus(state));
      }
    });

    $('input[name="hand"]').on('change', function () {
      var hand = $('input[name="hand"]:checked').val();
      state = E.selectHand(state, hand);
      if (clockCmp) clockCmp.setSelected(hand);
      $('#stepperNote').text(hand === 'minute' ? 'by ' + stepLabel : 'by one hour');
      var $note = $('.clock-help');
      $note.text(hand === 'minute'
        ? 'The red hand counts the minutes in fives round the face.'
        : 'The navy hand points at the hour. Short and stout.');
    });

    // press-and-hold repeats — a 5-minute snap run should not be 8 taps.
    // el.click()/keyboard still work: a real pointer press flags itself so the
    // synthetic click that follows doesn't double-step.
    $('.stepper-btn').each(function () {
      var dir = Number($(this).data('dir'));
      var timer = null;
      var usedPointer = false;
      var $btn = $(this);
      function step() {
        if (state.feedback === 'correct') { stop(); return; }
        if (clockCmp) clockCmp.nudge(dir);
        $('#digitalNow').text(E.formatDigital(state.clock));
        announce(E.ariaClockStatus(state));
      }
      function stop() {
        clearInterval(timer);
        timer = null;
      }
      $btn.on('pointerdown.clockquest', function () {
        usedPointer = true;
        step();
        timer = setInterval(step, 190);
      });
      $btn.on('pointerup.clockquest pointercancel.clockquest pointerleave.clockquest', stop);
      $btn.on('click.clockquest', function () {
        if (usedPointer) { usedPointer = false; return; }
        step(); // keyboard Space/Enter and programmatic clicks
      });
    });

    $('#ticketFoot').html(
      '<button type="button" class="btn btn--ghost cta-hint">Show me a hint</button>' +
      '<button type="button" class="btn btn--primary cta-check">Check the clock</button>'
    );
    $('.cta-check').on('click', function () {
      var next = E.submitClock(state, content.lessons, content.schedule);
      handleVerdict(next, mission, function () {
        if (clockCmp) clockCmp.setEnabled(false);
        $('#digitalNow').addClass('is-right');
      });
    });
  }

  // -- mode: read-schedule ----------------------------------------------------------

  function renderBoard(mission) {
    var board = content.schedule.timetable[mission.boardId];
    var rows = E.boardRows(content.schedule, mission);
    var target = E.parseTime(mission.targetTime);
    var boardIcon = board.icon || 'boat';
    $('#ticketBody').html(
      '<div class="board-zone">' +
      '<div class="board-clock" id="boardClockMount"></div>' +
      '<div class="board" aria-label="' + board.title + '">' +
      '<div class="board-head"><span>Departs</span><span>Destination</span></div>' +
      rows.map(function (row) {
        var meridiem = E.parseTime(row.time).hour < 12 ? 'AM' : 'PM';
        return '<button type="button" class="board-row" data-row="' + row.id + '" ' +
          'aria-label="' + row.label + ', departs ' + E.format12(row.time) + '">' +
          '<span class="board-time">' + E.formatDigital(E.parseTime(row.time)) +
          '<span class="board-meridiem">' + meridiem + '</span></span>' +
          '<span class="board-dest">' + row.label + '</span>' +
          Icons.icon(boardIcon, 20) + '</button>';
      }).join('') +
      '</div></div>'
    );
    $('#ticketFoot').html(
      '<button type="button" class="btn btn--ghost cta-hint">Show me a hint</button>'
    );
    // analog ↔ digital always pair (§3.2): a small read-only clock shows the
    // spoken time so reading the quarters off the face IS the skill
    boardClock = global.ClockQuestClock.mount($('#boardClockMount'), {
      snap: 15,
      selected: 'minute',
      focusable: false
    });
    boardClock.setTime(target, false);
    boardClock.setEnabled(false);
    $('.board-row').on('click', function () {
      if (state.feedback === 'correct') return;
      var $row = $(this);
      var next = E.pickOption(state, content.lessons, content.schedule, $row.data('row'));
      var row = rows.find(function (r) { return r.id === $row.data('row'); });
      if (next.feedback === 'nudge') {
        $row.addClass('is-nudged');
        setTimeout(function () { $row.removeClass('is-nudged'); }, 900);
        var specific = 'Not that one — the ' + row.label + ' leaves at ' +
          E.format12(row.time) + '. Count the quarters on the little clock and try another row.';
        handleVerdict(next, mission, null, specific);
        announce(specific);
        return;
      }
      handleVerdict(next, mission, function () {
        $row.addClass('is-correct');
        $('.board-row').not($row).prop('disabled', true).addClass('is-dimmed');
      });
    });
  }

  // -- mode: day-recap ----------------------------------------------------------------

  function renderRecap(mission) {
    var slots = [
      { id: 'morning', label: 'Morning', note: 'before 12:00' },
      { id: 'midday', label: 'Midday', note: 'around 12:00' },
      { id: 'evening', label: 'Evening', note: 'after 6:00 PM' }
    ];
    var activities = mission.activityIds.map(function (id) { return E.activityById(content.schedule, id); });

    function chipsHtml() {
      var placed = {};
      mission.activityIds.forEach(function (id) {
        if (state.lockedPlacements[id]) placed[id] = state.lockedPlacements[id];
        else if (state.placements[id]) placed[id] = state.placements[id];
      });
      var tray = activities.filter(function (a) { return !placed[a.id]; });
      return tray.map(function (a) {
        return '<button type="button" class="chip" data-activity="' + a.id + '" ' +
          'aria-label="' + a.label + ' — select, then choose a part of the day"' +
          (carriedChip === a.id ? ' aria-pressed="true"' : '') + '>' +
          Icons.icon(a.icon, 20) + '<span>' + a.label + '</span></button>';
      }).join('');
    }

    function slotsHtml() {
      return slots.map(function (slot) {
        var inSlot = activities.filter(function (a) {
          return (state.lockedPlacements[a.id] || state.placements[a.id]) === slot.id;
        });
        return '<div class="slot" data-slot="' + slot.id + '">' +
          '<div class="slot-head"><h3>' + slot.label + '</h3><span class="slot-note">' + slot.note + '</span></div>' +
          '<button type="button" class="slot-drop" data-slot="' + slot.id + '" ' +
          'aria-label="Place the selected card in the ' + slot.label.toLowerCase() + '">' +
          (carriedChip ? 'Place here' : 'Drop a card here') + '</button>' +
          '<div class="slot-cards">' +
          inSlot.map(function (a) {
            var locked = !!state.lockedPlacements[a.id];
            return '<span class="placed-card' + (locked ? ' is-locked' : '') + '" data-activity="' + a.id + '">' +
              Icons.icon(a.icon, 18) + '<span>' + a.label + '</span>' +
              (locked ? '<span class="placed-tick" aria-hidden="true">✓</span>' : '') + '</span>';
          }).join('') +
          '</div></div>';
      }).join('');
    }

    function renderTray() {
      $('#recapTray').html(chipsHtml());
      bindChips();
    }

    function renderSlots() {
      $('#recapSlots').html(slotsHtml());
      bindSlots();
    }

    function refreshBoth() {
      renderTray();
      renderSlots();
    }

    function place(activityId, slotId) {
      state = E.placeActivity(state, activityId, slotId);
      carriedChip = null;
      refreshBoth();
      var a = E.activityById(content.schedule, activityId);
      announce(a.label + ' pinned to ' + slotId + '.');
    }

    function bindChips() {
      $('#recapTray .chip').on('click', function () {
        var id = $(this).data('activity');
        if (state.feedback === 'correct') return;
        carriedChip = carriedChip === id ? null : id;
        renderTray();
        renderSlots();
        if (carriedChip) {
          var a = E.activityById(content.schedule, id);
          announce(a.label + ' picked up. Now choose morning, midday or evening.');
        }
      });
    }

    function bindSlots() {
      $('#recapSlots .slot-drop').on('click', function () {
        if (!carriedChip) return;
        place(carriedChip, $(this).data('slot'));
      });
    }

    $('#ticketBody').html(
      '<div class="recap">' +
      '<div class="recap-slots" id="recapSlots"></div>' +
      '<div class="recap-tray" id="recapTray" aria-label="Memory cards waiting to be pinned"></div>' +
      '</div>'
    );
    refreshBoth();

    $('#ticketFoot').html(
      '<button type="button" class="btn btn--ghost cta-hint">Show me a hint</button>' +
      '<button type="button" class="btn btn--primary cta-check">Pin the day</button>'
    );
    $('.cta-check').on('click', function () {
      var unplaced = mission.activityIds.filter(function (id) {
        return !state.lockedPlacements[id] && !state.placements[id];
      });
      if (unplaced.length) {
        setFeedback('nudge', unplaced.length + ' card' + (unplaced.length > 1 ? 's are' : ' is') +
          ' still in the tray — pin every card first.');
        return;
      }
      var before = Object.keys(state.lockedPlacements).length;
      var next = E.submitRecap(state, content.lessons, content.schedule);
      var after = Object.keys(next.lockedPlacements).length;
      state = next;
      if (state.feedback === 'correct') {
        handleVerdict(next, mission, function () { refreshBoth(); });
      } else {
        refreshBoth();
        var wrong = state.recapWrongIds || [];
        setFeedback('nudge', after > before
          ? (after - before) + ' more card' + (after - before > 1 ? 's' : '') +
            ' found ' + (after - before > 1 ? 'their homes' : 'its home') + '!' +
            (wrong.length ? ' ' + wrong.length + ' sailed back to the tray — try a different part of the day.' : '')
          : 'No new cards fit there. Look at the clock times on each card and try again.');
        announce('Some cards came back. ' + wrong.length + ' to retry.');
      }
    });
  }

  // -- verdict / feedback ----------------------------------------------------------------

  function handleVerdict(next, mission, decorate, nudgeText) {
    var wasCorrect = next.feedback === 'correct';
    state = next;
    // celebrate only on a solve — a nudge must NEVER disable controls
    // (the pilot-run driver caught this: one wrong pick locked the board)
    if (wasCorrect && typeof decorate === 'function') decorate();
    if (wasCorrect) {
      var spoken = '';
      if (mission.mode === 'set-clock') spoken = 'Right on time! The clock shows ' + E.formatDigital(state.clock) + '.';
      else if (mission.mode === 'read-schedule') spoken = 'Well read! That one leaves at ' + E.format12(mission.targetTime) + '.';
      else spoken = 'A perfect day, pinned just right!';
      setFeedback('correct', spoken);
      announce(spoken);
      saveProgress();
      showContinue();
    } else {
      var nudgeCopy = nudgeText || (mission.mode === 'set-clock'
        ? 'Not quite — have another turn. ' + (mission.hint || 'Check both hands.')
        : 'Have another look. ' + (mission.hint || ''));
      setFeedback('nudge', nudgeCopy);
    }
  }

  function setFeedback(kind, text) {
    var $fb = $('#feedback');
    if (!$fb.length) return;
    $fb.attr('data-feedback', kind)
      .html((kind === 'correct' ? Icons.icon('anchor', 20) : Icons.icon('compass', 20)) +
        '<span>' + text + '</span>');
  }

  function showContinue() {
    var stop = E.currentStop(state, content.lessons);
    var isLast = state.missionIndex + 1 >= stop.missions.length;
    $('#ticketFoot').append(
      '<button type="button" class="btn btn--primary cta-continue">' +
      (isLast ? 'Finish the stop' : 'Next mission') + '</button>'
    );
    $('.cta-check').prop('disabled', true).addClass('is-dimmed');
    $('#ticketFoot .cta-continue').on('click', continueAfterSolve);
    // keep the keyboard journey inside the ticket (Check just disabled itself)
    $('#ticketFoot .cta-continue').trigger('focus');
  }

  function continueAfterSolve() {
    var stop = E.currentStop(state, content.lessons);
    var res = E.advance(state, content.lessons);
    state = res.state;
    saveProgress();
    if (res.questFinished) {
      closeOverlay(true);
      showFinale();
      return;
    }
    if (res.stopCompleted) {
      closeOverlay(true);
      stampArrives(stop.id);
      renderPassport();
      var nextIdx = E.nextStopIndex(state, content.lessons);
      if (nextIdx !== -1) {
        map.moveFerry(nextIdx, function () {
          map.setPhase(phaseForStop(nextIdx));
          renderJournalPanel();
          map.refresh();
        });
      }
      toast('New stamp: ' + placeOf(stop).name + '!');
      announce('Stamp collected: ' + placeOf(stop).name + '. Next stop unlocked.');
      renderJournalPanel();
      return;
    }
    // next mission in the same stop — soft transition
    var $ticket = $('#ticket');
    var go = function () { renderMission(); };
    if (M.available && !M.reduced()) {
      global.gsap.to($ticket[0], {
        opacity: 0, duration: 0.12, ease: 'power1.in', onComplete: function () {
          go();
          global.gsap.fromTo($ticket[0], { opacity: 0 }, { opacity: 1, duration: 0.15 });
        }
      });
    } else go();
  }

  // -- finale -----------------------------------------------------------------------------

  function showFinale() {
    map.setPhase('dusk');
    var stamps = content.lessons.quest.stops.map(function (stop) {
      var place = placeOf(stop);
      return '<span class="stamp is-stamped finale-stamp" aria-hidden="true">' + Icons.icon(place.icon, 30) + '</span>';
    }).join('');
    var lines = E.SLOTS.map(function (slot) {
      var cards = content.schedule.activities.filter(function (a) {
        return (state.lockedPlacements[a.id] || state.placements[a.id]) === slot;
      });
      if (!cards.length) return '';
      var label = { morning: 'Morning', midday: 'Midday', evening: 'Evening' }[slot];
      return '<li><strong>' + label + '</strong> — ' +
        cards.map(function (c) { return c.label.toLowerCase(); }).join(' · ') + '</li>';
    }).join('');
    $('#finaleBody').html(
      '<h2 class="finale-title">A perfect day on Clock Island</h2>' +
      '<div class="finale-stamps">' + stamps + '</div>' +
      '<ol class="finale-list">' + lines + '</ol>' +
      '<p class="finale-copy">Five stamps, one well-timed day. You can read a clock as well as any ferry captain now.</p>' +
      '<button type="button" class="btn btn--primary" id="finaleAgain">Sail again tomorrow</button>'
    );
    $('#finaleAgain').on('click', function () {
      clearProgress();
      state = E.createSession(content.lessons, content.schedule, null);
      $('#finaleScreen').attr('hidden', 'hidden');
      buildHome();
    });
    $('#finaleScreen').removeAttr('hidden');
    $('#finaleScreen').off('keydown.escclose').on('keydown.escclose', function (ev) {
      if (ev.key === 'Escape') $('#finaleScreen').attr('hidden', 'hidden');
    });
    announce('Journey complete! A perfect day on Clock Island.');
  }

  // -- misc ----------------------------------------------------------------------------------

  function toast(text) {
    var $t = $('#toast');
    $t.text(text).addClass('is-visible');
    clearTimeout($t.data('timer'));
    $t.data('timer', setTimeout(function () { $t.removeClass('is-visible'); }, 2600));
  }

  function announce(text) {
    $('#liveRegion').text(text);
  }

})(typeof globalThis !== 'undefined' ? globalThis : this);
