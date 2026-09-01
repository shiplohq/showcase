/*!
 * Clock Quest — pure quest engine (no DOM, no jQuery, no fetch).
 * Copyright 2026 Shiplo HQ
 * SPDX-License-Identifier: Apache-2.0
 *
 * Three state layers (per spec):
 *   - content state: lessons.json + schedule.json (read-only, validated)
 *   - interaction state: the session object produced here
 *   - personal state: serialize()/deserialize() feed an anonymous localStorage
 * Every action returns a NEW state object (immutability keeps the UI honest and
 * lets scripts/engine-sim.mjs replay the whole quest without a browser).
 */
(function (global) {
  'use strict';

  var MODES = ['set-clock', 'read-schedule', 'day-recap'];
  var SLOTS = ['morning', 'midday', 'evening'];
  var SNAP_STEPS = [1, 5, 15, 30];
  // Mission-start pose. Minute 45 keeps the clock ON every snap grid used by
  // the game (5 and 15): steppers step relatively, so an off-grid start (e.g.
  // ten-past-ten with snap 15) could never reach :00/:30/:45 — the sim caught
  // it. 10:45 ("quarter to eleven") is also the one pose no mission targets.
  var START_CLOCK = { hour: 10, minute: 45 };

  // ---- time helpers ---------------------------------------------------------

  function parseTime(value) {
    if (typeof value !== 'string') return null;
    var m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!m) return null;
    var hour = Number(m[1]);
    var minute = Number(m[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return { hour: hour, minute: minute };
  }

  function timeToMinutes(t) {
    return t.hour * 60 + t.minute;
  }

  /** Distance between two wall-clock times measured on the 12-hour dial the
   *  child actually sees (14:45 and 2:45 are the same face). */
  function dialMinutesDiff(a, b) {
    var da = ((a % 720) + 720) % 720;
    var db = ((b % 720) + 720) % 720;
    var d = Math.abs(da - db);
    return Math.min(d, 720 - d);
  }

  function normalizeClock(clock) {
    var hour = Math.round(clock.hour);
    var minute = Math.round(clock.minute);
    hour = ((hour % 24) + 24) % 24;
    minute = ((minute % 60) + 60) % 60;
    return { hour: hour, minute: minute };
  }

  function formatDigital(clock) {
    var h12 = clock.hour % 12 === 0 ? 12 : clock.hour % 12;
    return h12 + ':' + String(clock.minute).padStart(2, '0');
  }

  function format12(time) {
    var t = typeof time === 'string' ? parseTime(time) : normalizeClock(time);
    if (!t) return '';
    var h12 = t.hour % 12 === 0 ? 12 : t.hour % 12;
    var suffix = t.hour < 12 ? 'AM' : 'PM';
    return h12 + ':' + String(t.minute).padStart(2, '0') + ' ' + suffix;
  }

  /** Hour-hand angle in degrees (continuous: includes the minute fraction). */
  function hourAngle(clock) {
    return (((clock.hour % 12) + clock.minute / 60) * 30 + 360) % 360;
  }

  /** Minute-hand angle in degrees. */
  function minuteAngle(clock) {
    return (clock.minute * 6 + 360) % 360;
  }

  // ---- content validation (dev-time + boot-time) ----------------------------

  function validateLessons(data) {
    var errors = [];
    if (!data || typeof data !== 'object') return { ok: false, errors: ['lessons.json: expected an object'] };
    var quest = data.quest;
    if (!quest || !Array.isArray(quest.stops) || quest.stops.length === 0) {
      return { ok: false, errors: ['lessons.json: quest.stops must be a non-empty array'] };
    }
    var stopIds = {};
    quest.stops.forEach(function (stop, i) {
      var where = 'lessons.json stop[' + i + ']';
      if (!stop.id || typeof stop.id !== 'string') errors.push(where + ': missing id');
      else if (stopIds[stop.id]) errors.push(where + ': duplicate stop id "' + stop.id + '"');
      else stopIds[stop.id] = true;
      if (!Array.isArray(stop.missions) || stop.missions.length === 0) {
        errors.push(where + ': missions must be a non-empty array');
        return;
      }
      stop.missions.forEach(function (mission, j) {
        var tag = where + ' mission[' + j + '] (' + (mission && mission.id ? mission.id : '?') + ')';
        if (!mission || typeof mission !== 'object') { errors.push(tag + ': not an object'); return; }
        if (!mission.id) errors.push(tag + ': missing id');
        if (MODES.indexOf(mission.mode) === -1) errors.push(tag + ': unknown mode "' + mission.mode + '"');
        if (!mission.prompt) errors.push(tag + ': missing prompt');
        if (!mission.hint) errors.push(tag + ': missing hint');
        if (mission.mode === 'set-clock') validateSetClock(mission, tag, errors);
        if (mission.mode === 'read-schedule') validateReadSchedule(mission, tag, errors);
        if (mission.mode === 'day-recap') validateRecap(mission, tag, errors);
      });
    });
    return { ok: errors.length === 0, errors: errors };
  }

  function validateSetClock(mission, tag, errors) {
    var t = parseTime(mission.targetTime || '');
    if (!t) errors.push(tag + ': invalid targetTime "' + mission.targetTime + '"');
    if (SNAP_STEPS.indexOf(mission.snapMinutes) === -1) {
      errors.push(tag + ': snapMinutes must be one of ' + SNAP_STEPS.join('/'));
    }
    var tol = mission.toleranceMinutes == null ? 0 : mission.toleranceMinutes;
    if (typeof tol !== 'number' || tol < 0) errors.push(tag + ': invalid toleranceMinutes');
    if (t && SNAP_STEPS.indexOf(mission.snapMinutes) !== -1 && t.minute % mission.snapMinutes !== 0) {
      errors.push(tag + ': targetTime minute ' + t.minute + ' is not on the ' + mission.snapMinutes + '-minute snap grid');
    }
  }

  function validateReadSchedule(mission, tag, errors) {
    var t = parseTime(mission.targetTime || '');
    if (!t) errors.push(tag + ': invalid targetTime "' + mission.targetTime + '"');
    if (!Array.isArray(mission.options) || mission.options.length < 2) {
      errors.push(tag + ': needs at least 2 options');
      return;
    }
    var matches = 0;
    mission.options.forEach(function (id) {
      if (typeof id !== 'string') errors.push(tag + ': option ids must be strings');
      if (typeof id === 'string' && id.length === 5 && /^\d{1,2}:\d{2}$/.test(id)) {
        // option may be inline "HH:MM"
        if (id === mission.targetTime) matches++;
      }
    });
    if (matches > 1) errors.push(tag + ': ' + matches + ' inline options share the targetTime — ambiguity');
  }

  function validateRecap(mission, tag, errors) {
    if (!Array.isArray(mission.activityIds) || mission.activityIds.length < 2) {
      errors.push(tag + ': needs at least 2 activityIds');
    }
  }

  function validateSchedule(data) {
    var errors = [];
    if (!data || typeof data !== 'object') return { ok: false, errors: ['schedule.json: expected an object'] };
    if (!Array.isArray(data.places) || data.places.length === 0) errors.push('schedule.json: places must be a non-empty array');
    (data.places || []).forEach(function (p, i) {
      if (!p.id || !p.name) errors.push('schedule.json places[' + i + ']: needs id and name');
      if (typeof p.x !== 'number' || typeof p.y !== 'number') errors.push('schedule.json places[' + i + ']: needs numeric x/y');
    });
    var placeIds = {};
    (data.places || []).forEach(function (p) { placeIds[p.id] = true; });
    var tt = data.timetable || {};
    Object.keys(tt).forEach(function (boardId) {
      var board = tt[boardId];
      if (!board.title || !Array.isArray(board.rows) || board.rows.length === 0) {
        errors.push('schedule.json timetable.' + boardId + ': needs title and rows');
        return;
      }
      var seen = {};
      board.rows.forEach(function (row) {
        if (!row.id || seen[row.id]) errors.push('schedule.json timetable.' + boardId + ': missing/duplicate row id');
        seen[row.id] = true;
        if (!parseTime(row.time || '')) errors.push('schedule.json timetable.' + boardId + ' row ' + row.id + ': invalid time');
        if (!row.label) errors.push('schedule.json timetable.' + boardId + ' row ' + row.id + ': missing label');
      });
    });
    var acts = data.activities || [];
    var actIds = {};
    acts.forEach(function (a, i) {
      if (!a.id) errors.push('schedule.json activities[' + i + ']: missing id');
      if (actIds[a.id]) errors.push('schedule.json activities[' + i + ']: duplicate id');
      actIds[a.id] = true;
      if (!a.label) errors.push('schedule.json activities[' + i + ']: missing label');
      if (!parseTime(a.time || '')) errors.push('schedule.json activities[' + i + ']: invalid time');
      if (SLOTS.indexOf(a.slot) === -1) errors.push('schedule.json activities[' + i + ']: slot must be ' + SLOTS.join('|'));
    });
    return { ok: errors.length === 0, errors: errors };
  }

  /** Cross-file references (board rows exist, activities exist, …). */
  function validateReferences(lessons, schedule) {
    var errors = [];
    var tt = (schedule && schedule.timetable) || {};
    var actIds = {};
    (schedule.activities || []).forEach(function (a) { actIds[a.id] = a; });
    (lessons.quest.stops).forEach(function (stop, si) {
      stop.missions.forEach(function (mission, j) {
        var tag = 'lessons stop[' + si + '] mission ' + (mission.id || j);
        if (mission.mode === 'read-schedule') {
          var board = tt[mission.boardId];
          if (!board) { errors.push(tag + ': unknown boardId "' + mission.boardId + '"'); return; }
          var rowIds = {};
          board.rows.forEach(function (r) { rowIds[r.id] = r; });
          var matches = 0;
          mission.options.forEach(function (optId) {
            if (!rowIds[optId]) errors.push(tag + ': option "' + optId + '" not on board "' + mission.boardId + '"');
            else if (rowIds[optId].time === mission.targetTime) matches++;
          });
          if (matches !== 1) errors.push(tag + ': exactly one board row must match targetTime "' + mission.targetTime + '", found ' + matches);
        }
        if (mission.mode === 'day-recap') {
          (mission.activityIds || []).forEach(function (id) {
            if (!actIds[id]) errors.push(tag + ': unknown activity "' + id + '"');
          });
        }
      });
    });
    return { ok: errors.length === 0, errors: errors };
  }

  // ---- session ---------------------------------------------------------------

  function totalMissions(lessons) {
    return lessons.quest.stops.reduce(function (n, s) { return n + s.missions.length; }, 0);
  }

  function createSession(lessons, schedule, saved) {
    var state = {
      stopIndex: 0,
      missionIndex: 0,
      clock: clone(START_CLOCK),
      selectedHand: 'minute',
      feedback: 'idle', // idle | correct | nudge
      pickedOption: null,
      placements: {},   // activityId -> slot
      lockedPlacements: {}, // activityId -> slot (confirmed correct during a recap)
      stamps: [],       // stop ids with a passport stamp
      solvedPerStop: lessons.quest.stops.map(function () { return 0; }),
      solvedTotal: 0,
      finished: false
    };
    if (saved) state = restore(state, saved, lessons);
    return state;
  }

  function restore(state, saved, lessons) {
    var next = clone(state);
    if (Array.isArray(saved.stamps)) {
      next.stamps = saved.stamps.filter(function (id) {
        return lessons.quest.stops.some(function (s) { return s.id === id; });
      });
    }
    if (Array.isArray(saved.solvedPerStop)) {
      next.solvedPerStop = lessons.quest.stops.map(function (s, i) {
        var n = Number(saved.solvedPerStop[i]);
        if (!isFinite(n) || n < 0) n = 0;
        return Math.min(Math.floor(n), s.missions.length);
      });
    }
    next.solvedTotal = next.solvedPerStop.reduce(function (a, b) { return a + b; }, 0);
    var firstOpen = lessons.quest.stops.findIndex(function (s, i) {
      return next.solvedPerStop[i] < s.missions.length;
    });
    if (next.solvedTotal >= totalMissions(lessons)) {
      next.finished = true;
      next.stopIndex = Math.max(0, lessons.quest.stops.length - 1);
      next.missionIndex = 0;
    } else {
      next.stopIndex = firstOpen === -1 ? 0 : firstOpen;
      next.missionIndex = next.solvedPerStop[next.stopIndex];
      // resume an in-progress day-recap: pinned cards survive a refresh
      var mission = lessons.quest.stops[next.stopIndex].missions[next.missionIndex];
      if (mission && mission.mode === 'day-recap') {
        var validIds = {};
        (mission.activityIds || []).forEach(function (id) { validIds[id] = true; });
        ['placements', 'lockedPlacements'].forEach(function (key) {
          if (saved[key] && typeof saved[key] === 'object') {
            Object.keys(saved[key]).forEach(function (id) {
              if (validIds[id] && SLOTS.indexOf(saved[key][id]) !== -1) {
                next[key][id] = saved[key][id];
              }
            });
          }
        });
      }
    }
    return next;
  }

  function serialize(state) {
    return {
      stamps: state.stamps.slice(),
      solvedPerStop: state.solvedPerStop.slice(),
      // keep an in-progress day-recap alive across a refresh (pilot-style
      // resume: mission granularity, plus pinned cards)
      placements: state.placements || {},
      lockedPlacements: state.lockedPlacements || {},
      v: 1
    };
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ---- selectors --------------------------------------------------------------

  function currentStop(state, lessons) {
    return lessons.quest.stops[state.stopIndex];
  }

  function currentMission(state, lessons) {
    var stop = currentStop(state, lessons);
    if (state.missionIndex >= stop.missions.length) return null;
    return stop.missions[state.missionIndex];
  }

  function stopProgress(state, lessons, stopIndex) {
    var stop = lessons.quest.stops[stopIndex];
    return { solved: state.solvedPerStop[stopIndex], total: stop.missions.length };
  }

  function isStopDone(state, lessons, stopIndex) {
    return stopProgress(state, lessons, stopIndex).solved >= stopProgress(state, lessons, stopIndex).total;
  }

  /** A stop can be opened when every earlier stop is finished. */
  function isStopUnlocked(state, lessons, stopIndex) {
    for (var i = 0; i < stopIndex; i++) if (!isStopDone(state, lessons, i)) return false;
    return true;
  }

  function nextStopIndex(state, lessons) {
    for (var i = 0; i < lessons.quest.stops.length; i++) {
      if (!isStopDone(state, lessons, i)) return i;
    }
    return -1;
  }

  function boardFor(schedule, boardId) {
    return schedule.timetable[boardId];
  }

  function boardRows(schedule, mission) {
    var board = boardFor(schedule, mission.boardId);
    var byId = {};
    (board ? board.rows : []).forEach(function (r) { byId[r.id] = r; });
    return mission.options.map(function (id) { return byId[id]; }).filter(Boolean);
  }

  function activityById(schedule, id) {
    return (schedule.activities || []).find(function (a) { return a.id === id; }) || null;
  }

  function progress(state, lessons) {
    return { solved: state.solvedTotal, total: totalMissions(lessons) };
  }

  // ---- actions ----------------------------------------------------------------

  /** Opening (or re-opening) a stop. Resumes at the first unsolved mission. */
  function startStop(state, lessons, stopIndex) {
    var next = clone(state);
    next.stopIndex = stopIndex;
    next.missionIndex = Math.min(next.solvedPerStop[stopIndex] || 0, lessons.quest.stops[stopIndex].missions.length);
    next.feedback = 'idle';
    next.pickedOption = null;
    next.placements = {};
    next.lockedPlacements = {};
    next.clock = clone(START_CLOCK);
    next.selectedHand = 'minute'; // fresh mission, fresh radio state — no desync
    return next;
  }

  function idle(state) {
    if (state.feedback === 'idle') return state;
    var next = clone(state);
    next.feedback = 'idle';
    return next;
  }

  /** Direct set (drag path). Normalizes; clears stale feedback. */
  function setClock(state, clock) {
    var next = clone(idle(state));
    next.clock = normalizeClock(clock);
    return next;
  }

  /** Keyboard/stepper path. hand: 'hour' | 'minute'; delta in minutes.
   *  Minute overflow carries into the hour, exactly like a real clock: drag
   *  the minute hand past the 12 and the hour hand follows to the next hour. */
  function nudgeClock(state, hand, deltaMinutes) {
    var next = clone(idle(state));
    var clock = next.clock;
    if (hand === 'hour') {
      clock.hour = clock.hour + Math.round(deltaMinutes / 60);
    } else {
      var total = clock.hour * 60 + clock.minute + deltaMinutes;
      clock.hour = Math.floor(total / 60);
      clock.minute = ((total % 60) + 60) % 60;
    }
    next.clock = normalizeClock(clock);
    return next;
  }

  function selectHand(state, hand) {
    if (hand !== 'hour' && hand !== 'minute') return state;
    var next = clone(state);
    next.selectedHand = hand;
    return next;
  }

  function clockAnswer(state, lessons, schedule) {
    var mission = currentMission(state, lessons);
    var target = parseTime(mission.targetTime);
    var tol = mission.toleranceMinutes == null ? 0 : mission.toleranceMinutes;
    var diff = dialMinutesDiff(timeToMinutes(state.clock), timeToMinutes(target));
    return { diff: diff, correct: diff <= tol, target: target };
  }

  /** Evaluate a set-clock mission. */
  function submitClock(state, lessons, schedule) {
    var mission = currentMission(state, lessons);
    if (!mission || mission.mode !== 'set-clock') return state;
    var answer = clockAnswer(state, lessons, schedule);
    if (answer.correct) return solve(state, lessons);
    var next = clone(state);
    next.feedback = 'nudge';
    return next;
  }

  /** Evaluate a timetable pick (single tap = the answer, per spec). */
  function pickOption(state, lessons, schedule, optionId) {
    var mission = currentMission(state, lessons);
    if (!mission || mission.mode !== 'read-schedule') return state;
    var rows = boardRows(schedule, mission);
    var row = rows.find(function (r) { return r.id === optionId; });
    if (!row) return state;
    var next = clone(state);
    next.pickedOption = optionId;
    if (row.time === mission.targetTime) return solve(next, lessons);
    next.feedback = 'nudge';
    return next;
  }

  /** Recap: place / withdraw an activity card (never judged until submit). */
  function placeActivity(state, activityId, slot) {
    var next = clone(idle(state));
    if (slot === null || slot === undefined) delete next.placements[activityId];
    else next.placements[activityId] = slot;
    return next;
  }

  /** Submit the recap: correct cards lock in, wrong cards return to the tray.
   *  The mission is solved only once every activity is locked in place. */
  function submitRecap(state, lessons, schedule) {
    var mission = currentMission(state, lessons);
    if (!mission || mission.mode !== 'day-recap') return state;
    var next = clone(state);
    var wrongIds = [];
    mission.activityIds.forEach(function (id) {
      var activity = activityById(schedule, id);
      var placed = next.placements[id];
      if (activity && placed === activity.slot && placed != null) {
        next.lockedPlacements[id] = placed; // confirmed — stays on the timeline
      } else {
        wrongIds.push(id);
        delete next.placements[id]; // gently back to the tray
      }
    });
    var solvedAll = mission.activityIds.every(function (id) {
      return next.lockedPlacements[id] != null;
    });
    if (solvedAll) return solve(next, lessons);
    next.feedback = 'nudge';
    next.recapWrongIds = wrongIds;
    return next;
  }

  function solve(state, lessons) {
    var next = clone(state);
    next.feedback = 'correct';
    next.solvedPerStop[next.stopIndex] = next.solvedPerStop[next.stopIndex] + 1;
    next.solvedTotal = next.solvedTotal + 1;
    return next;
  }

  /** After the reward beat: move to the next mission / finish the stop. */
  function advance(state, lessons) {
    var stop = currentStop(state, lessons);
    var next = clone(state);
    next.feedback = 'idle';
    next.pickedOption = null;
    next.clock = clone(START_CLOCK);
    next.selectedHand = 'minute';
    if (next.missionIndex + 1 < stop.missions.length) {
      next.missionIndex = next.missionIndex + 1;
      return { state: next, stopCompleted: false, questFinished: false };
    }
    // stop finished → stamp it
    if (next.stamps.indexOf(stop.id) === -1) next.stamps.push(stop.id);
    next.finished = next.solvedTotal >= totalMissions(lessons);
    return { state: next, stopCompleted: true, questFinished: next.finished };
  }

  function ariaClockStatus(state) {
    return 'The clock shows ' + formatDigital(state.clock) + '.';
  }

  var api = {
    MODES: MODES,
    SLOTS: SLOTS,
    START_CLOCK: START_CLOCK,
    parseTime: parseTime,
    timeToMinutes: timeToMinutes,
    dialMinutesDiff: dialMinutesDiff,
    normalizeClock: normalizeClock,
    formatDigital: formatDigital,
    format12: format12,
    hourAngle: hourAngle,
    minuteAngle: minuteAngle,
    validateLessons: validateLessons,
    validateSchedule: validateSchedule,
    validateReferences: validateReferences,
    createSession: createSession,
    serialize: serialize,
    currentStop: currentStop,
    currentMission: currentMission,
    stopProgress: stopProgress,
    isStopDone: isStopDone,
    isStopUnlocked: isStopUnlocked,
    nextStopIndex: nextStopIndex,
    boardRows: boardRows,
    activityById: activityById,
    progress: progress,
    startStop: startStop,
    idle: idle,
    setClock: setClock,
    nudgeClock: nudgeClock,
    selectHand: selectHand,
    clockAnswer: clockAnswer,
    submitClock: submitClock,
    pickOption: pickOption,
    placeActivity: placeActivity,
    submitRecap: submitRecap,
    advance: advance,
    ariaClockStatus: ariaClockStatus
  };

  global.ClockQuestEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
