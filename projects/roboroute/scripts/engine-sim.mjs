#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless interaction test: simulates every mission through the SAME pure
// engine the UI uses (no browser). Verifies:
//   - every level's reference solution completes (mission solvable),
//   - deterministic re-runs,
//   - failing programs behave per spec: wall/obstacle bumps, ending off-dock,
//     docking with sparks missing, empty program — all non-terminal for the
//     child (rewind/edit paths work),
//   - program editing ops (add/move/remove/reorder/repeat rounds/caret),
//   - rotation and repeat-expansion correctness.
//
// Usage: npm run test:engine   (from the project dir)

import { readFileSync } from 'node:fs';

const mod = await import('../src/features/board/engine.ts');
const {
  makeTile,
  addTileAt,
  removeTile,
  moveTile,
  adjustRepeatTimes,
  topLevelCount,
  locateTile,
  programToText,
  expandProgram,
  rotate,
  dirAngle,
  beginRun,
  stepOnce,
  rewind,
  canStep,
  canRewind,
  stepCell,
  inBounds,
  MAX_BODY,
  MAX_EXPANDED_STEPS,
} = mod;

const data = JSON.parse(readFileSync(new URL('../public/data/levels.json', import.meta.url), 'utf8'));

let failures = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ✖ ${msg}`);
  }
}

/** Build a Tile[] program from a solution-shaped JSON array (stable ids). */
function programFromSolution(solution) {
  let n = 0;
  const id = () => `sim-${++n}`;
  const program = [];
  for (const node of solution) {
    if (node.op === 'REPEAT') {
      program.push({
        id: id(),
        op: 'REPEAT',
        times: node.times,
        body: node.body.map((b) => ({ id: id(), op: b.op })),
      });
    } else {
      program.push({ id: id(), op: node.op });
    }
  }
  return program;
}

/** Run a program to its terminal state (stepping like the UI does). */
function runProgram(level, program, maxSteps = 500) {
  let s = beginRun(level, program);
  let guard = 0;
  while (canStep(s) && guard++ < maxSteps) {
    s = stepOnce(s, level); // stepOnce itself resolves an exhausted program
  }
  return s;
}

// ---------------------------------------------------------------- rotation
console.log('— rotation + angles');
const L = { E: 'N', N: 'W', W: 'S', S: 'E' };
const R = { E: 'S', S: 'W', W: 'N', N: 'E' };
for (const d of ['N', 'E', 'S', 'W']) {
  check(rotate(d, 'L') === L[d], `rotate(${d}, L) = ${rotate(d, 'L')} (want ${L[d]})`);
  check(rotate(d, 'R') === R[d], `rotate(${d}, R) = ${rotate(d, 'R')} (want ${R[d]})`);
}
check(dirAngle('E') === 0 && dirAngle('S') === 90 && dirAngle('W') === 180 && dirAngle('N') === 270, 'dirAngle mapping');
check(JSON.stringify(stepCell([3, 2], 'N')) === '[3,1]', 'stepCell north');
check(JSON.stringify(stepCell([3, 2], 'E')) === '[4,2]', 'stepCell east');

// ------------------------------------------------------------- program ops
console.log('— program editing ops');
{
  let program = [];
  let caret = { scope: 'root', index: 0 };
  for (const op of ['F', 'F', 'REPEAT', 'F']) {
    const res = addTileAt(program, caret, op, `p${program.length}-${op}`);
    check(!!res, `addTileAt(${op}) succeeds`);
    program = res.program;
    caret = res.caret;
  }
  check(topLevelCount(program) === 4, `4 top-level tiles (got ${topLevelCount(program)})`);
  const rep = program.find((t) => t.op === 'REPEAT');
  check(rep && rep.times === 3, 'new REPEAT defaults to x3');
  check(locateTile(program, rep.id)?.scope === 'root', 'locate repeat at root');

  // insert inside the repeat body
  let inner = addTileAt(program, { scope: rep.id, index: 0 }, 'F', 'inner-1');
  check(!!inner, 'insert into repeat body');
  program = inner.program;
  check(program.find((t) => t.id === rep.id).body.length === 1, 'repeat body grew');

  // nested repeat must be rejected
  check(addTileAt(program, { scope: rep.id, index: 1 }, 'REPEAT', 'nope') === null, 'nested REPEAT rejected');

  // body cap
  let bodyLen = program.find((t) => t.id === rep.id).body.length;
  while (bodyLen < MAX_BODY) {
    const r = addTileAt(program, { scope: rep.id, index: bodyLen }, 'L', `fill-${bodyLen}`);
    program = r.program;
    bodyLen = program.find((t) => t.id === rep.id).body.length;
  }
  check(addTileAt(program, { scope: rep.id, index: bodyLen }, 'F', 'overflow') === null, `body capped at ${MAX_BODY}`);

  // move within root + within body
  const first = program[0].id;
  const moved = moveTile(program, first, -1);
  check(moved === program, 'move at left edge is a no-op (returns same ref)');
  const movedRight = moveTile(program, first, 1);
  check(movedRight[0].id === program[1].id, 'Move right swaps neighbors');

  // repeat rounds clamp
  const up = adjustRepeatTimes(program, rep.id, +99);
  check(up.find((t) => t.id === rep.id).times === mod.MAX_REPEAT, `rounds clamp to ${mod.MAX_REPEAT}`);
  const down = adjustRepeatTimes(program, rep.id, -99);
  check(down.find((t) => t.id === rep.id).times === mod.MIN_REPEAT, `rounds clamp to ${mod.MIN_REPEAT}`);

  // remove a body tile, then the whole repeat
  const bodyId = program.find((t) => t.id === rep.id).body[0].id;
  const afterBodyRemove = removeTile(program, bodyId);
  check(afterBodyRemove.find((t) => t.id === rep.id).body.length === bodyLen - 1, 'remove body tile');
  const afterRepRemove = removeTile(afterBodyRemove, rep.id);
  check(!afterRepRemove.some((t) => t.id === rep.id) && topLevelCount(afterRepRemove) === topLevelCount(afterBodyRemove) - 1, 'remove repeat takes its body');

  // text rendering resolves
  const text = programToText(program);
  check(/repeat 3 times/.test(text) && /forward/.test(text), `programToText readable: "${text}"`);
}

// ---------------------------------------------------------------- expansion
console.log('— repeat expansion');
{
  const program = [
    { id: 'a', op: 'F' },
    { id: 'rep', op: 'REPEAT', times: 3, body: [{ id: 'b', op: 'F' }, { id: 'c', op: 'L' }] },
  ];
  const steps = expandProgram(program);
  check(steps.length === 7, `1 + 3x2 = 7 steps (got ${steps.length})`);
  check(steps[1].repeat?.round === 1 && steps[1].repeat?.rounds === 3, 'round metadata 1/3');
  check(steps[6].repeat?.round === 3, 'round metadata 3/3');
  check(steps[6].tileId === 'c', 'inner tile id preserved');

  // runaway guard: 13 top-level repeats x 8 rounds x 4 body = 416 steps > 400
  let threw = false;
  try {
    const big = [];
    for (let i = 0; i < 13; i++) {
      big.push({ id: `x${i}`, op: 'REPEAT', times: 8, body: [{ id: `y${i}a`, op: 'F' }, { id: `y${i}b`, op: 'F' }, { id: `y${i}c`, op: 'F' }, { id: `y${i}d`, op: 'F' }] });
    }
    expandProgram(big);
  } catch {
    threw = true;
  }
  check(threw, `expansion guard throws past ${MAX_EXPANDED_STEPS} steps`);
}

// ---------------------------------------------------------------- missions
console.log(`\n— ${data.levels.length} missions: reference solutions must complete`);
for (const level of data.levels) {
  const program = programFromSolution(level.solution);
  check(topLevelCount(program) <= level.maxCommands, `${level.id}: solution fits maxCommands (${topLevelCount(program)}/${level.maxCommands})`);
  for (const cmd of programToText(program).split(', ')) {
    void cmd;
  }
  // every command used must be allowed
  const used = new Set(level.solution.map((n) => n.op));
  for (const op of used) {
    check(level.allowedCommands.includes(op), `${level.id}: solution uses allowed op ${op}`);
  }

  const final = runProgram(level, program);
  check(final.status === 'complete', `${level.id}: solution completes (status=${final.status})`);
  check(final.collected.length === level.collectibles.length, `${level.id}: all sparks collected (${final.collected.length}/${level.collectibles.length})`);
  check(final.pos[0] === level.goal[0] && final.pos[1] === level.goal[1], `${level.id}: robot ends on the dock`);

  // determinism: same program twice → identical trajectory
  const again = runProgram(level, program);
  check(again.status === final.status && again.pos.join() === final.pos.join() && again.collected.length === final.collected.length, `${level.id}: deterministic re-run`);
}

// ------------------------------------------------------------ failing paths
console.log('\n— failing + debug paths (non-punitive)');
{
  const seq01 = data.levels[0]; // straight hall, F only
  // wall bump: run east past the dock into the east wall
  let s = runProgram(seq01, [{ id: 'w1', op: 'F' }, { id: 'w2', op: 'F' }, { id: 'w3', op: 'F' }, { id: 'w4', op: 'F' }, { id: 'w5', op: 'F' }]);
  // seq-01 goal at (4,2); one more F reaches (5,2) dock → completes; the 5th F never runs.
  check(s.status === 'complete', `seq-01: docking mid-program stops the run (status=${s.status})`);

  // a true wall bump: from seq-02 start turn north and walk past the top wall
  // (column 1 is clear of the benches and of the dock at (4,1))
  const seq02 = data.levels[1];
  const bumpProgram = [{ id: 'l', op: 'L' }];
  for (let i = 0; i < 9; i++) bumpProgram.push({ id: `n${i}`, op: 'F' }); // rows 4→0 clear, then the wall
  let b = beginRun(seq02, bumpProgram);
  let guard = 0;
  while (canStep(b) && guard++ < 50) b = stepOnce(b, seq02);
  check(b.status === 'bumped' && b.bump?.kind === 'wall', `wall bump detected (status=${b.status}, kind=${b.bump?.kind})`);
  check(b.bump.tileId === `n${b.pc - 1}`, `bump blames the offending tile (${b.bump.tileId}, pc=${b.pc})`);
  check(b.pos[1] === 0, `robot stays inside the room at row ${b.pos[1]}`);

  // obstacle bump: seq-02 benches sit at (2,3)/(3,3); from start face north immediately
  const obsProgram = [{ id: 'l0', op: 'L' }, { id: 'f0', op: 'F' }]; // (1,4)->(1,3) ok
  let o = beginRun(seq02, obsProgram);
  o = stepOnce(o, seq02);
  o = stepOnce(o, seq02);
  check(o.pos.join() === '1,3', `north step into (1,3) ok (${o.pos})`);
  const obsProgram2 = [{ id: 'l1', op: 'L' }, { id: 'f1', op: 'F' }, { id: 'r1', op: 'R' }, { id: 'f2', op: 'F' }]; // then east into bench (2,3)
  let o2 = beginRun(seq02, obsProgram2);
  o2 = stepOnce(o2, seq02);
  o2 = stepOnce(o2, seq02);
  o2 = stepOnce(o2, seq02);
  o2 = stepOnce(o2, seq02);
  check(o2.status === 'bumped' && o2.bump?.kind === 'obstacle', `obstacle bump detected (status=${o2.status})`);

  // empty program
  const empty = runProgram(seq01, []);
  check(empty.status === 'ended-incomplete', `empty program ends incomplete (${empty.status})`);

  // ended off-dock
  const short = runProgram(seq01, [{ id: 's1', op: 'F' }]);
  check(short.status === 'ended-incomplete' && short.pos.join() === '2,2', `short program ends off-dock (${short.status} @ ${short.pos})`);

  // dock with sparks missing (loop-02: dock at start; do one side only)
  const loop02 = data.levels.find((l) => l.id === 'loop-02');
  const partial = [];
  for (let i = 0; i < 3; i++) partial.push({ id: `p${i}`, op: 'F' });
  partial.push({ id: 'pr', op: 'R' });
  for (let i = 0; i < 3; i++) partial.push({ id: `q${i}`, op: 'F' });
  partial.push({ id: 'qr', op: 'R' });
  for (let i = 0; i < 3; i++) partial.push({ id: `w${i}`, op: 'F' });
  partial.push({ id: 'wr', op: 'R' });
  for (let i = 0; i < 3; i++) partial.push({ id: `h${i}`, op: 'F' }); // returns to dock (2,2)
  const docked = runProgram(loop02, partial);
  check(docked.status === 'complete', `loop-02 full lap without REPEAT also completes (${docked.status})`);
  const half = runProgram(loop02, partial.slice(0, 7)); // 3F R 3F — ends at (5,5) not dock
  check(half.status === 'ended-incomplete', `loop-02 half lap ends off-dock (${half.status})`);

  // docked-incomplete: loop-03 route along row 0 straight to dock, no sparks
  const loop03 = data.levels.find((l) => l.id === 'loop-03');
  const straight = [
    { id: 'd0', op: 'L' }, // E->N at (1,4)
    { id: 'd1', op: 'F' }, // (1,3)
    { id: 'd2', op: 'F' }, // (1,2)
    { id: 'd3', op: 'F' }, // (1,1)
    { id: 'd4', op: 'F' }, // (1,0)
    { id: 'd5', op: 'R' }, // face east
    { id: 'd6', op: 'F' }, // (2,0)
    { id: 'd7', op: 'F' }, // (3,0)
    { id: 'd8', op: 'F' }, // (4,0)
    { id: 'd9', op: 'F' }, // (5,0)
    { id: 'd10', op: 'F' }, // (6,0)
    { id: 'd11', op: 'R' }, // face south
    { id: 'd12', op: 'F' }, // (6,1) = dock, 0 sparks
  ];
  const di = runProgram(loop03, straight);
  check(di.status === 'docked-incomplete', `docking without sparks = docked-incomplete (${di.status})`);
  check(di.collected.length === 0, `no sparks collected on the row-0 route (${di.collected.length})`);

  // rewind: undo the last step from a bump, then from mid-run
  let rw = beginRun(seq01, programFromSolution(seq01.solution));
  rw = stepOnce(rw, seq01);
  rw = stepOnce(rw, seq01);
  check(rw.pos.join() === '3,2', `two steps forward → (3,2) (${rw.pos})`);
  rw = rewind(rw);
  check(rw.pos.join() === '2,2' && rw.pc === 1 && rw.status === 'paused', `rewind restores one step (${rw.pos}, pc=${rw.pc}, ${rw.status})`);
  rw = rewind(rw);
  check(rw.pc === 0 && rw.status === 'ready', 'rewind to start = ready');
  check(rewind(rw) === rw || rewind(rw).pc === 0, 'rewind at start is a no-op');
  check(!canRewind({ ...rw, status: 'complete' }), 'no rewind after complete');

  // rewind after a bump clears the bump and restores the pre-bump pose
  let wb = beginRun(seq02, bumpProgram);
  guard = 0;
  while (canStep(wb) && guard++ < 50) wb = stepOnce(wb, seq02);
  check(wb.status === 'bumped', 'setup: bumped');
  const beforeBumpPos = wb.history[wb.history.length - 1].pos;
  wb = rewind(wb);
  check(wb.status !== 'bumped' && wb.pos.join() === beforeBumpPos.join(), `rewind clears bump (${wb.status} @ ${wb.pos})`);
}

// ------------------------------------------------------------ bounds sanity
console.log('— level geometry sanity');
for (const level of data.levels) {
  const [cols, rows] = level.grid;
  check(cols > 0 && rows > 0, `${level.id}: grid positive`);
  check(inBounds(level, level.start) && inBounds(level, level.goal), `${level.id}: start/goal in bounds`);
  for (const o of level.obstacles) {
    check(!inBounds(level, o.cell) === false, `${level.id}: obstacle ${o.cell} inside grid`);
    check(o.cell.join() !== level.start.join() && o.cell.join() !== level.goal.join(), `${level.id}: obstacle not on start/goal`);
  }
  for (const c of level.collectibles) {
    check(inBounds(level, c.cell), `${level.id}: spark ${c.cell} in bounds`);
  }
  check(data.wings.some((w) => w.id === level.wing), `${level.id}: wing exists`);
}

console.log(failures === 0 ? `\n✔ Engine simulation passed — ${checks} checks.` : `\n✖ ${failures} failure(s) of ${checks} checks.`);
process.exit(failures === 0 ? 0 : 1);
