#!/usr/bin/env node
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Headless interaction test: drives every mission through the SAME pure
// engine the UI uses (no browser). Verifies data authoring (slot geometry,
// no overlaps, tray budgets, symmetry of authored blueprints), the full
// solve/nudge/undo paths, blueprint outline computation (edge cancellation),
// and the perimeter walk.
//
// Usage: npm run test:engine   (node >= 23 strips TS types natively)

import { readFileSync } from 'node:fs';

const mod = await import('../src/app/features/workbench/engine.ts');

const {
  worldPolygon,
  polygonArea,
  polygonPerimeter,
  polyKey,
  reflectPolyX,
  matchesSlot,
  validate,
  checkSymmetry,
  nextHintSlot,
  computeOutline,
  walkEdges,
  interiorAngleAt,
  isRightAngle,
  formatLength,
  initialWalk,
  measureEdge,
  createSession,
  placeFromTray,
  addPiece,
  nudgePiece,
  rotatePieceBy,
  dragPieceTo,
  endDrag,
  removePiece,
  undo,
  redo,
  bumpHint,
  canUndo,
  canRedo,
  feedbackFor,
  findFreeSpot,
  pieceAtPoint,
  validateShapes,
  validateMission,
  normalizeWinding,
  setMirrorX,
  nudgeMirrorX,
  resetMirrorX,
  mirrorMoved,
  defaultMirrorX,
} = mod;

const shapesJson = JSON.parse(readFileSync(new URL('../public/data/shapes.json', import.meta.url), 'utf8'));
const missionsJson = JSON.parse(readFileSync(new URL('../public/data/challenges.json', import.meta.url), 'utf8'));

let failures = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ✖ ${msg}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Data authoring validation
// ---------------------------------------------------------------------------

console.log('— Data authoring');
const shapeList = shapesJson.shapes.map((s) => ({ ...s, pts: normalizeWinding(s.pts.map((p) => ({ ...p }))) }));
const shapes = new Map(shapeList.map((s) => [s.id, s]));
for (const err of validateShapes(shapeList)) check(false, `shapes.json: ${err}`);
check(shapeList.length >= 10, `expected a full shape kit, got ${shapeList.length}`);

// Cross-check declared interior angles against computed geometry (±0.5°).
for (const s of shapeList) {
  const poly = s.pts;
  const computed = poly.map((_, i) => interiorAngleAt(poly, i));
  for (let i = 0; i < computed.length; i++) {
    check(
      Math.abs(computed[i] - s.properties.angles[i]) < 0.5,
      `${s.id}: declared angle ${s.properties.angles[i]} != computed ${computed[i].toFixed(2)} at vertex ${i}`,
    );
  }
}

check(missionsJson.missions.length === 8, `expected 8 missions, got ${missionsJson.missions.length}`);
const tracks = new Set(missionsJson.missions.map((m) => m.track));
check(tracks.size === 3, `expected 3 tracks, got ${[...tracks]}`);

for (const mission of missionsJson.missions) {
  for (const err of validateMission(mission, shapes)) check(false, err);
}
console.log(`  ✔ ${missionsJson.missions.length} missions validated against shape kit`);

// ---------------------------------------------------------------------------
// 2. Rotation authoring spot-checks (hand-derived expectations)
// ---------------------------------------------------------------------------

console.log('— Rotation math');
const tri4 = shapes.get('tri-right-4x4');
const roofLeft = worldPolygon(tri4, 10, 6, 180);
check(
  polyKey(roofLeft) === polyKey([{ x: 8, y: 8 }, { x: 12, y: 8 }, { x: 12, y: 4 }]),
  `tri-right-4x4 rot180 @(10,6) expected {(8,8),(12,8),(12,4)}, got ${JSON.stringify(roofLeft)}`,
);
const roofRight = worldPolygon(tri4, 14, 6, 270);
check(
  polyKey(roofRight) === polyKey([{ x: 16, y: 8 }, { x: 12, y: 8 }, { x: 12, y: 4 }]),
  `tri-right-4x4 rot270 @(14,6) mirrored roof half unexpected: ${JSON.stringify(roofRight)}`,
);
check(
  polyKey(reflectPolyX(roofLeft, 12)) === polyKey(roofRight),
  'mirror-house roof halves must be reflections across x=12',
);
const legLeft = worldPolygon(tri4, 10, 11, 0);
const legRight = worldPolygon(tri4, 14, 11, 90);
check(
  polyKey(reflectPolyX(legLeft, 12)) === polyKey(legRight),
  'bridge-02 legs must be reflections across x=12',
);
console.log('  ✔ rotation + reflection conventions verified');

// ---------------------------------------------------------------------------
// 3. Solve / nudge / symmetry per mission
// ---------------------------------------------------------------------------

for (const mission of missionsJson.missions) {
  console.log(`\n— ${mission.id} “${mission.title}” (${mission.slots.filter((s) => s.buildable).length} buildable)`);
  const buildable = mission.slots.filter((s) => s.buildable);
  const solvedPieces = buildable.map((s, i) => ({ uid: `q${i}`, shapeId: s.shapeId, x: s.x, y: s.y, rot: s.rot }));

  // Solved by slot-exact placements.
  let v = validate(mission, shapes, solvedPieces);
  check(v.complete, `${mission.id}: solved placement must be complete (got ${JSON.stringify({ f: v.filledCount, t: v.totalSlots, u: v.unmatchedPieces.length, sym: v.symmetryOk })})`);
  check(v.filledCount === v.totalSlots, `${mission.id}: all slots filled`);
  if (mission.constraints.symmetry === 'vertical') {
    check(v.symmetryOk === true, `${mission.id}: symmetric mission must pass symmetry when solved`);
  }
  const fb = feedbackFor(v, mission);
  check(fb.kind === 'complete' && fb.text.includes('CHECKED'), `${mission.id}: complete feedback says CHECKED`);

  // Nudge: shift one piece one unit off its slot.
  const nudgedPieces = solvedPieces.map((p, i) => (i === 0 ? { ...p, x: p.x + 1 } : p));
  v = validate(mission, shapes, nudgedPieces);
  check(!v.complete, `${mission.id}: shifted piece must fail`);
  check(v.filledCount === v.totalSlots - 1, `${mission.id}: one slot opens when a piece shifts`);
  const nudgeFb = feedbackFor(v, mission);
  check(nudgeFb.kind === 'nudge', `${mission.id}: nudge feedback kind`);
  check(nudgeFb.text.includes('of'), `${mission.id}: nudge feedback mentions progress counts`);
  const hintSlot = nextHintSlot(mission, v);
  check(hintSlot && hintSlot.id === buildable[0].id, `${mission.id}: hint points at the first unfilled slot`);

  // Wrong rotation: rotate one piece 90° where possible (square symmetric —
  // find a piece whose rotated polygon truly differs).
  for (const delta of [90, 15]) {
    const rotPieces = solvedPieces.map((p, i) =>
      i === 0 && polyKey(worldPolygon(shapes.get(p.shapeId), p.x, p.y, p.rot + delta)) !== polyKey(worldPolygon(shapes.get(p.shapeId), p.x, p.y, p.rot))
        ? { ...p, rot: p.rot + delta }
        : p,
    );
    if (rotPieces.some((p, i) => p.rot !== solvedPieces[i].rot)) {
      v = validate(mission, shapes, rotPieces);
      check(!v.complete, `${mission.id}: wrong rotation (Δ${delta}) must fail`);
      break;
    }
  }

  // Extra piece off-blueprint → not complete.
  const spot = findFreeSpot(mission, shapes, solvedPieces, 'square-2x2');
  const extraPieces = [...solvedPieces, { uid: 'extra', shapeId: 'square-2x2', x: spot.x, y: spot.y, rot: 0 }];
  v = validate(mission, shapes, extraPieces);
  check(!v.complete && v.unmatchedPieces.includes('extra'), `${mission.id}: off-blueprint extra piece blocks completion`);

  // Outline of the finished structure (buildable + printed pieces).
  const printed = mission.slots.filter((s) => !s.buildable).map((s, i) => ({ uid: `print${i}`, shapeId: s.shapeId, x: s.x, y: s.y, rot: s.rot }));
  const all = [...solvedPieces, ...printed];
  const outline = computeOutline(shapes, all);
  check(outline.outer && outline.outer.length >= 4, `${mission.id}: outer outline computed (${outline.loops.length} loop(s))`);
  const areaSum = all.reduce((sum, p) => sum + Math.abs(polygonArea(worldPolygon(shapes.get(p.shapeId), p.x, p.y, p.rot))), 0);
  const outerArea = Math.abs(polygonArea(outline.outer));
  check(Math.abs(outerArea - areaSum) < 1e-6, `${mission.id}: outline area ${outerArea} == Σ piece areas ${areaSum}`);
  const angleSum = outline.outer.reduce((s, _, i) => s + interiorAngleAt(outline.outer, i), 0);
  const nVerts = outline.outer.length;
  check(Math.abs(angleSum - (nVerts - 2) * 180) < 0.01, `${mission.id}: outline interior angles sum ${angleSum.toFixed(2)} == (n-2)·180 with n=${nVerts}`);

  // Perimeter walk.
  const walk = walkEdges(outline.outer);
  const perimeter = polygonPerimeter(outline.outer);
  check(Math.abs(walk.perimeter - perimeter) < 1e-9, `${mission.id}: walk perimeter consistent`);
  let ws = initialWalk(walk.edges.length);
  for (let i = 0; i < walk.edges.length; i++) {
    ws = measureEdge(ws, i, walk.edges);
    check(formatLength(walk.edges[i].length).length > 0, 'edge label formats');
  }
  check(ws.complete && Math.abs(ws.total - perimeter) < 1e-9, `${mission.id}: full walk total == perimeter (${formatLength(perimeter)} u)`);
  const rightAngles = outline.outer.filter((_, i) => isRightAngle(interiorAngleAt(outline.outer, i))).length;
  // Exact silhouette right-angle counts (regression): derived from geometry —
  // e.g. the house pentagon has exactly 2 right angles at its base corners.
  const expectedRightAngles = {
    'house-01': 2,
    'house-02': 2,
    'tower-01': 5,
    'bridge-01': 6,
    'bridge-02': 4,
    'robot-01': 12,
    'robot-02': 4,
    'mirror-house': 3,
  };
  check(rightAngles === expectedRightAngles[mission.id], `${mission.id}: silhouette has ${rightAngles} right angles (expected ${expectedRightAngles[mission.id]})`);
  console.log(`  ✔ solve / nudge / hint / outline (${nVerts} verts, perimeter ${formatLength(perimeter)} u, ${rightAngles} right angles) / walk`);
}

// ---------------------------------------------------------------------------
// 4. Session lifecycle: place, move, rotate, remove, undo/redo, drag
// ---------------------------------------------------------------------------

console.log('\n— Session lifecycle');
{
  const mission = missionsJson.missions.find((m) => m.id === 'house-01');
  let s = createSession(mission);
  check(s.pieces.length === 0 && canUndo(s) === false, 'session starts empty');
  const wall = mission.slots.find((x) => x.id === 'wall');
  const roof = mission.slots.find((x) => x.id === 'roof');

  s = placeFromTray(s, mission, shapes, 'rect-6x4');
  check(s.pieces.length === 1 && s.tray['rect-6x4'] === 0, 'placeFromTray spawns piece + empties tray');
  check(pieceAtPoint(shapes, s.pieces, { x: s.pieces[0].x, y: s.pieces[0].y })?.uid === s.pieces[0].uid, 'pieceAtPoint finds piece');

  const uid = s.pieces[0].uid;
  s = nudgePiece(s, uid, wall.x - s.pieces[0].x, wall.y - s.pieces[0].y, mission);
  check(s.pieces[0].x === wall.x && s.pieces[0].y === wall.y, 'nudge moves piece to slot');
  check(matchesSlot(shapes, s.pieces[0], wall), 'moved piece matches wall slot');

  s = placeFromTray(s, mission, shapes, 'tri-iso-6x4');
  const roofUid = s.pieces[1].uid;
  s = nudgePiece(s, roofUid, roof.x - s.pieces[1].x, roof.y - s.pieces[1].y, mission);
  s = rotatePieceBy(s, roofUid, 180);
  check(s.pieces[1].rot === 180, 'rotatePieceBy adds 180');
  check(!matchesSlot(shapes, s.pieces[1], roof), 'rotated roof does not match slot');
  s = rotatePieceBy(s, roofUid, 180);
  check(matchesSlot(shapes, s.pieces[1], roof), 'rotating back restores match');
  s = nudgePiece(s, roofUid, roof.x - s.pieces[1].x, roof.y - s.pieces[1].y, mission);
  let v = validate(mission, shapes, s.pieces);
  check(v.complete, 'session solution complete');

  // Undo path back to empty, redo forward again.
  let steps = 0;
  while (canUndo(s)) { s = undo(s); steps++; }
  check(s.pieces.length === 0 && s.tray['rect-6x4'] === 1, `undo chain returns to empty (${steps} steps)`);
  while (canRedo(s)) s = redo(s);
  check(validate(mission, shapes, s.pieces).complete, 'redo chain restores the solution');

  // Drag: continuous moves then commit snaps to grid.
  s = dragPieceTo(s, s.pieces[0].uid, 12.4, 10.7);
  check(s.pieces[0].x === 12.4, 'dragPieceTo updates without snapping');
  s = endDrag(s, s.pieces[0].uid, false, shapes);
  check(s.pieces[0].x === 12 && s.pieces[0].y === 11, 'endDrag snaps to integer grid');

  // Remove returns the piece to the tray; undo brings it back.
  s = removePiece(s, s.pieces[0].uid, shapes);
  check(s.pieces.length === 1 && s.tray['rect-6x4'] === 1, 'removePiece refills tray');
  s = undo(s);
  check(s.pieces.length === 2 && s.tray['rect-6x4'] === 0, 'undo after remove restores piece');

  // Hint ladder caps at 3.
  s = bumpHint(s); s = bumpHint(s); s = bumpHint(s); s = bumpHint(s);
  check(s.hintLevel === 3, 'hint level caps at 3');
  console.log('  ✔ place / move / rotate / drag-snap / remove / undo / redo / hints');
}

// ---------------------------------------------------------------------------
// 5. Mirror mission: reflected pieces must validate
// ---------------------------------------------------------------------------

console.log('\n— Mirror mission specifics');
{
  const mission = missionsJson.missions.find((m) => m.id === 'mirror-house');
  const printed = mission.slots.filter((x) => !x.buildable);
  // Build the right half by mirroring each printed piece across the line.
  const mirrored = printed.map((slot, i) => {
    const shape = shapes.get(slot.shapeId);
    const poly = worldPolygon(shape, slot.x, slot.y, slot.rot);
    const refl = reflectPolyX(poly, mission.constraints.mirrorLine);
    // find the authored buildable slot this reflection equals
    const twin = mission.slots
      .filter((x) => x.buildable)
      .find((x) => x.shapeId === slot.shapeId && polyKey(worldPolygon(shapes.get(x.shapeId), x.x, x.y, x.rot)) === polyKey(refl));
    check(twin, `mirror-house: printed ${slot.id} has a mirrored buildable twin`);
    return { uid: `m${i}`, shapeId: slot.shapeId, x: twin.x, y: twin.y, rot: twin.rot };
  });
  const v = validate(mission, shapes, mirrored);
  check(v.complete, 'mirrored half validates as complete');
  check(checkSymmetry(mission, shapes, mirrored), 'mirrored half passes symmetry check');
  // Asymmetry must be caught: shift one mirrored piece.
  const bad = mirrored.map((p, i) => (i === 0 ? { ...p, x: p.x + 2 } : p));
  check(!checkSymmetry(mission, shapes, bad), 'asymmetric build fails symmetry check');
  console.log('  ✔ mirror twins validate; asymmetry rejected');
}

// ---------------------------------------------------------------------------
// 6. Draggable mirror line (deploy #2 — spec IA "đường gương kéo được")
// ---------------------------------------------------------------------------

console.log('\n— Draggable mirror line');
{
  const mission = missionsJson.missions.find((m) => m.id === 'mirror-house');
  const printed = mission.slots.filter((x) => !x.buildable);
  const solved = printed.map((slot, i) => {
    const shape = shapes.get(slot.shapeId);
    const refl = reflectPolyX(worldPolygon(shape, slot.x, slot.y, slot.rot), mission.constraints.mirrorLine);
    const twin = mission.slots
      .filter((x) => x.buildable)
      .find((x) => polyKey(worldPolygon(shapes.get(x.shapeId), x.x, x.y, x.rot)) === polyKey(refl));
    return { uid: `m${i}`, shapeId: slot.shapeId, x: twin.x, y: twin.y, rot: twin.rot };
  });

  let s = createSession(mission);
  check(s.mirrorX === defaultMirrorX(mission) && s.mirrorX === 12, `session starts at the blueprint line (12), got ${s.mirrorX}`);
  check(validate(mission, shapes, solved, s.mirrorX).complete, 'solved build validates at the authored line');
  check(mirrorMoved(s, mission) === false, 'line not flagged as moved at start');

  s = setMirrorX(s, 14.4, mission); // pointer drop snaps
  check(s.mirrorX === 14, `drag snaps to whole units (14), got ${s.mirrorX}`);
  check(mirrorMoved(s, mission) === true, 'moved line detected');
  const vMoved = validate(mission, shapes, solved, s.mirrorX);
  check(!vMoved.complete && vMoved.symmetryOk === false, 'moved line correctly fails symmetry on the solved build');
  const fbMoved = feedbackFor(vMoved, mission, mirrorMoved(s, mission));
  check(fbMoved.kind === 'nudge' && /mirror line/i.test(fbMoved.text), `feedback points at the moved line: "${fbMoved.text.slice(0, 60)}"`);

  s = nudgeMirrorX(s, -2, mission);
  check(s.mirrorX === 12, 'keyboard nudge −2 returns to 12');
  check(validate(mission, shapes, solved, s.mirrorX).complete, 'symmetry passes again at 12');

  s = setMirrorX(s, 99, mission);
  check(s.mirrorX === mission.canvas.w - 1, `line clamps inside the sheet (${mission.canvas.w - 1}), got ${s.mirrorX}`);
  s = resetMirrorX(s, mission);
  check(s.mirrorX === 12 && mirrorMoved(s, mission) === false, 'reset restores the blueprint line');
  check(validate(mission, shapes, solved, s.mirrorX).complete, 'solved build validates after reset');

  // The line is a tool setting: undo of piece moves must not roll it back.
  s = addPiece(s, shapes, 'square-4x4', 5, 5, 0);
  s = setMirrorX(s, 15, mission);
  s = undo(s);
  check(s.mirrorX === 15, 'undo keeps the moved mirror line (tool setting, not history)');
  console.log('  ✔ drag/snap/clamp/keyboard/reset + validation + feedback + undo independence');
}

// ---------------------------------------------------------------------------

console.log(`\n${failures === 0 ? `✔ Engine simulation passed — ${checks} checks.` : `✖ ${failures} failure(s) of ${checks} checks.`}`);
process.exit(failures === 0 ? 0 : 1);
