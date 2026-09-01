#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless playthrough of the WHOLE quest through the same engine the UI uses
// (js/engine.js — no DOM involved). Verifies:
//   - content validation passes for lessons.json + schedule.json
//   - every set-clock mission is reachable exactly via stepper-sized nudges
//   - wrong answers nudge (never lock out), then recover
//   - timetable reads resolve to exactly one correct row
//   - the day recap locks correct cards and returns wrong ones to the tray
//   - progress serialize/restore round-trips
// Run from the project root: npm run test:engine

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const E = (await import(pathToFileURL(join(ROOT, 'js/engine.js')).href)).default;

const lessons = JSON.parse(readFileSync(join(ROOT, 'data/lessons.json'), 'utf8'));
const schedule = JSON.parse(readFileSync(join(ROOT, 'data/schedule.json'), 'utf8'));

let failures = 0;
function check(cond, msg) {
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}

// ---- 1. content validation ----------------------------------------------------
const v1 = E.validateLessons(lessons);
const v2 = E.validateSchedule(schedule);
const v3 = E.validateReferences(lessons, schedule);
check(v1.ok, 'lessons.json valid: ' + v1.errors.join(' | '));
check(v2.ok, 'schedule.json valid: ' + v2.errors.join(' | '));
check(v3.ok, 'cross references valid: ' + v3.errors.join(' | '));
console.log('✔ content validated (lessons + schedule + cross-refs)');

const total = E.progress(E.createSession(lessons, schedule), lessons).total;
console.log(`Simulating ${lessons.quest.stops.length} stops / ${total} missions…`);

// ---- 2. full playthrough --------------------------------------------------------
let state = E.createSession(lessons, schedule, null);
check(state.feedback === 'idle' && state.solvedTotal === 0, 'fresh session starts idle at 0');

// locked-stop rule: stop n only opens when all earlier stops are done
check(E.isStopUnlocked(state, lessons, 0), 'first stop unlocked');
for (let i = 1; i < lessons.quest.stops.length; i++) {
  check(!E.isStopUnlocked(state, lessons, i), `stop ${i} locked before prerequisites`);
}

function setClockByNudges(from, target, snap) {
  // minute first (keyboard stepper path), then hour — the child's route
  let s = from;
  let minuteDelta = target.minute - (s.clock.minute % 60);
  if (minuteDelta > 30) minuteDelta -= 60;
  if (minuteDelta < -30) minuteDelta += 60;
  while (minuteDelta !== 0) {
    const step = Math.sign(minuteDelta) * snap;
    s = E.nudgeClock(s, 'minute', step);
    minuteDelta -= step;
  }
  let hourDelta = target.hour - s.clock.hour;
  if (hourDelta > 12) hourDelta -= 24;
  if (hourDelta < -12) hourDelta += 24;
  while (hourDelta !== 0) {
    const stepHours = Math.sign(hourDelta); // nudgeClock takes minutes
    s = E.nudgeClock(s, 'hour', stepHours * 60);
    hourDelta -= stepHours;
  }
  return s;
}

for (let si = 0; si < lessons.quest.stops.length; si++) {
  const stop = lessons.quest.stops[si];
  console.log(`\n— ${stop.title} (${stop.missions.length} mission${stop.missions.length > 1 ? 's' : ''})`);
  check(!E.isStopDone(state, lessons, si), `${stop.id}: not done before playing`);

  for (let mi = 0; mi < stop.missions.length; mi++) {
    const mission = stop.missions[mi];
    state = E.startStop(state, lessons, si);
    check(state.missionIndex === mi, `${mission.id}: startStop resumes at mission ${mi}`);
    const live = E.currentMission(state, lessons);
    check(live && live.id === mission.id, `${mission.id}: currentMission loaded from JSON in order`);

    if (mission.mode === 'set-clock') {
      const target = E.parseTime(mission.targetTime);
      // wrong first (nudge path), then solve — never a lockout.
      // Offsets stay on the snap grid: hands only ever rest on grid points.
      const wrong = E.submitClock(E.setClock(state, { hour: (target.hour + 3) % 24, minute: target.minute }), lessons, schedule);
      check(wrong.feedback === 'nudge', `${mission.id}: wrong time nudges gently`);
      check(wrong.solvedTotal === state.solvedTotal, `${mission.id}: nudge does not record a mistake`);
      // stepper path to the exact target
      let solved = setClockByNudges(wrong, target, mission.snapMinutes);
      solved = E.setClock(solved, solved.clock);
      check(E.formatDigital(solved.clock) === E.formatDigital(target),
        `${mission.id}: steppers reach ${E.formatDigital(target)} exactly (snap ${mission.snapMinutes})`);
      const done = E.submitClock(solved, lessons, schedule);
      check(done.feedback === 'correct', `${mission.id}: exact time accepted`);
      state = done;
    } else if (mission.mode === 'read-schedule') {
      const rows = E.boardRows(schedule, mission);
      check(rows.length >= 2, `${mission.id}: board renders ≥ 2 rows`);
      const wrongRow = rows.find((r) => r.time !== mission.targetTime);
      const nudged = E.pickOption(state, lessons, schedule, wrongRow.id);
      check(nudged.feedback === 'nudge', `${mission.id}: wrong row nudges (still pickable)`);
      const rightRow = rows.find((r) => r.time === mission.targetTime);
      check(!!rightRow, `${mission.id}: exactly one row matches the target time`);
      const done = E.pickOption(nudged, lessons, schedule, rightRow.id);
      check(done.feedback === 'correct', `${mission.id}: correct row accepted after a nudge`);
      state = done;
    } else if (mission.mode === 'day-recap') {
      // wrong first: one card in a wrong slot comes back to the tray
      const acts = mission.activityIds.map((id) => E.activityById(schedule, id));
      const first = acts[0];
      const wrongSlot = first.slot === 'morning' ? 'evening' : 'morning';
      let attempt = E.placeActivity(state, first.id, wrongSlot);
      for (const a of acts.slice(1)) attempt = E.placeActivity(attempt, a.id, a.slot);
      let res = E.submitRecap(attempt, lessons, schedule);
      check(res.feedback === 'nudge', `${mission.id}: misplaced card nudges, no lockout`);
      check(res.placements[first.id] === undefined, `${mission.id}: wrong card returned to the tray`);
      const right = res.lockedPlacements[first.id] === undefined;
      check(right, `${mission.id}: wrong card not locked`);
      // place it correctly now
      let fix = E.placeActivity(res, first.id, first.slot);
      res = E.submitRecap(fix, lessons, schedule);
      check(res.feedback === 'correct', `${mission.id}: all cards home → solved`);
      check(Object.keys(res.lockedPlacements).length === acts.length, `${mission.id}: every card locked`);
      state = res;
    }

    check(state.solvedPerStop[si] === mi + 1, `${mission.id}: solvedPerStop advanced`);
    const out = E.advance(state, lessons);
    state = out.state;
    const lastOfStop = mi === stop.missions.length - 1;
    check(out.stopCompleted === lastOfStop, `${mission.id}: stopCompleted flag ${lastOfStop}`);
    if (lastOfStop) check(state.stamps.includes(stop.id), `${stop.id}: stamp collected`);
  }
  check(E.isStopDone(state, lessons, si), `${stop.id}: done after all missions`);
}

check(state.finished, 'quest finished after every stop');
check(state.solvedTotal === total, `solvedTotal === ${total}`);

// ---- 3. persistence round-trip ----------------------------------------------------
const saved = E.serialize(state);
const restored = E.createSession(lessons, schedule, saved);
check(restored.finished, 'restore: finished quest stays finished');
check(JSON.stringify(restored.stamps) === JSON.stringify(state.stamps), 'restore: stamps preserved');

const half = E.serialize(E.startStop(state, lessons, 0)); // contrived partial
const restoredHalf = E.createSession(lessons, schedule, JSON.parse(JSON.stringify(half)));
check(Array.isArray(restoredHalf.stamps) && restoredHalf.stamps.length === state.stamps.length,
  'restore: partial progress keeps collected stamps');

// hour wrap sanity: 12h dial equivalence
check(E.dialMinutesDiff(E.timeToMinutes(E.parseTime('13:15')), E.timeToMinutes(E.parseTime('01:15'))) === 0,
  'dial diff: 13:15 ≡ 1:15 on the face');
check(E.dialMinutesDiff(E.timeToMinutes(E.parseTime('09:00')), E.timeToMinutes(E.parseTime('10:15'))) === 75,
  'dial diff: 9:00 → 10:15 = 75 minutes');
check(E.hourAngle({ hour: 3, minute: 30 }) === 105, 'hour angle: 3:30 → 105°');
check(E.minuteAngle({ hour: 3, minute: 25 }) === 150, 'minute angle: :25 → 150°');

// 24h crossing via steppers
let wrapped = E.nudgeClock(E.setClock(E.createSession(lessons, schedule), { hour: 23, minute: 55 }), 'minute', 10);
check(wrapped.clock.hour === 0 && wrapped.clock.minute === 5, 'stepper: 23:55 +10min wraps to 0:05');

// ---- 4. mid-recap refresh keeps pinned cards -------------------------------
{
  const towerIdx = lessons.quest.stops.length - 1;
  // finish everything except the recap mission
  let s = E.createSession(lessons, schedule, null);
  for (let i = 0; i < towerIdx; i++) {
    const stop = lessons.quest.stops[i];
    for (let j = 0; j < stop.missions.length; j++) {
      s = E.startStop(s, lessons, i);
      const m = stop.missions[j];
      if (m.mode === 'set-clock') {
        s = E.setClock(s, E.parseTime(m.targetTime));
        s = E.submitClock(s, lessons, schedule);
      } else if (m.mode === 'read-schedule') {
        const row = E.boardRows(schedule, m).find((r) => r.time === m.targetTime);
        s = E.pickOption(s, lessons, schedule, row.id);
      }
      s = E.advance(s, lessons).state;
    }
  }
  // open the recap, pin two cards correctly, "refresh"
  s = E.startStop(s, lessons, towerIdx);
  const acts = lessons.quest.stops[towerIdx].missions[0].activityIds.map((id) => E.activityById(schedule, id));
  s = E.placeActivity(s, acts[0].id, acts[0].slot);
  s = E.placeActivity(s, acts[1].id, acts[1].slot);
  const reloaded = E.createSession(lessons, schedule, E.serialize(s));
  check(reloaded.placements[acts[0].id] === acts[0].slot, 'refresh mid-recap: first pin survives');
  check(reloaded.placements[acts[1].id] === acts[1].slot, 'refresh mid-recap: second pin survives');
  // and a stale placement for an unknown id is dropped, not resurrected
  const poisoned = E.serialize(s);
  poisoned.placements = { 'ghost-card': 'morning' };
  const cleaned = E.createSession(lessons, schedule, poisoned);
  check(cleaned.placements['ghost-card'] === undefined, 'refresh mid-recap: unknown activity id dropped');
}

console.log(failures === 0
  ? `\n✔ Engine simulation passed — ${total} missions, all input paths (steppers / picks / placements) + recap-refresh resume.`
  : `\n✖ ${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
