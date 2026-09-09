# DESIGN_DECISIONS — RoboRoute (Showcase #15)

> Locked design system for showcase #15. Source: spec `.showcase/15_roboroute.md`
> (friendly-industrial-blueprint / grid-museum thesis already locked) cross-checked
> against UI UX Pro Max (queries: `blueprint industrial technical drawing schematic`,
> `drag and drop block programming touch targets children`, `keyboard reorder
> accessibility drag alternative`, `non punitive error feedback children game`,
> `children learning game progress motivation`, `prefers reduced motion accessibility
> animation`, `gsap flip list reorder`, `technical monospace engineering font`,
> `space grotesk font pairing`). The brief wins: every skill suggestion that
> contradicts the spec's flat-paper drafting-sheet thesis is dropped (§15).
> Huashu NOT invoked — art direction is locked by spec (allowed by spec §Skill
> choreography: "không invoke Huashu như generator mới").

## 1. Visual thesis

**A drafting sheet that became a museum.** The whole app is one large sheet of
warm bone-white drafting paper. Museum rooms are blueprint-line floor plans
(1.5px graphite/blue hairline walls, faint 8px graph grid inside). The robot is
a **paper model** — flat 2D geometric shapes with crease lines, two flat faces
and no gradients — as if a child's cut-and-fold paper toy was placed on the
plan. Command tiles are **physical tokens**: bone-paper chips with a punched
corner notch, stencil icon, small caps label, and a 2px hard offset shadow
(paper stacked on paper). Orange is the single loud accent — it marks the
energy that flows through the museum (sparks, dock charge, RUN state).

Keywords: drafting sheet · bone white · blueprint blue (not neon) · signal
orange · graphite linework · paper model robot · physical command tokens ·
museum floor plan · annotations and tag numbers · flat, no glow.

This is intentionally distinct from every shipped identity: not paper-cut
organic collage (#01), not Bauhaus primary-shape poster (#03), not vintage star
chart (#04) — the differentiators are the drafting annotation language
(dimension ticks, tag numbers, title block), the engineering mono labels and
the folded-paper robot.

## 2. Users

Children 7–12 learning sequence, loops and debugging at an intuitive level
(spec). Reading is fluent enough for short English sentences; UI copy is
**English**, ≤ 12 words per sentence, no jargon without the concept notebook.
Design consequences:

- Tiles carry icon + word + key hint; meaning is never text-only or color-only.
- No timers, no scores-as-pressure; progress = missions stamped + sparks
  collected, all reversible, all stored anonymously in localStorage with a
  visible reset.
- Debugging is the game, not a failure state: a bump is an engineering finding
  with a guided question, never a red error.

## 3. Interaction model

1. **Program = a line of tokens.** Pick tiles from a palette (tap, Enter, or
   drag with pointer) onto the program strip; a caret shows where the next tile
   lands. Tap a placed tile to select it; a token toolbar offers Move left /
   Move right / Remove / (repeat: +1 round, −1 round, Edit body). Fully
   keyboard-operable (WCAG 2.2 dragging-movements rule — skill finding kept).
2. **REPEAT is a container token**: shows `REPEAT × 3 [ F F ]` with its body
   nested inside the token; the caret can sit inside a selected repeat
   ("Edit body") or at top level. No repeat-inside-repeat (one mental model).
3. **Run is step-through.** STEP executes one expanded command with the
   program counter highlighting the executing tile — including the inner tile
   and a `round 2 of 3` badge inside repeats. RUN auto-steps with PAUSE.
4. **Bump ≠ fail.** Walking into a wall/exhibit stops the robot in place,
   marks the offending tile and the obstacle, and asks a debugging question
   ("The robot bumped into the plinth — which tile should change?"). REWIND
   undoes one executed step; EDIT returns to editing with the program intact.
5. **Mission complete** = robot reaches the charging dock with every spark in
   the room collected (rooms without sparks: reach the dock). Reaching the
   dock early stops the run — it is a dock, the robot plugs in.
6. **Concept notebook** (sequence / loop) is reachable from the map and the
   board; short entries from `concepts.json` with mini diagrams.

## 4. Color tokens

Friendly industrial blueprint — bone paper, engineering blue, signal orange,
graphite. Flat fills; no gradients anywhere; shadows are hard 2px offsets.

### Neutrals (paper & graphite)

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#F2EEE2` | Sheet background (bone white) |
| `--paper-raised` | `#FBF8EF` | Raised paper (tiles, plaques, notebook) |
| `--paper-well` | `#E7E2D0` | Recessed wells (program tray, palette dock) |
| `--ink` | `#26251F` | Graphite text / linework (contrast 13:1 on paper) |
| `--ink-soft` | `#5C584B` | Secondary text (≥ 15px or bold ≥ 14px) |
| `--hairline` | `#CFC9B4` | Paper hairlines, tray edges |

### Blueprint blue (structure, robot, plan)

| Token | Hex | Role |
|---|---|---|
| `--blueprint` | `#2C5FA8` | Walls, robot body, primary buttons (white text 5.6:1) |
| `--blueprint-deep` | `#1E4478` | Pressed, focus ring, wall depth |
| `--blueprint-wash` | `#DCE5F2` | Grid cell wash, selected tile tint |
| `--plan-line` | `#9DB3D6` | Faint interior graph lines |

### Signal orange (energy, run state, debug)

| Token | Hex | Role |
|---|---|---|
| `--orange` | `#E2620B` | Sparks, dock charge, RUN active (white text 3.9:1 — always paired with icon+text; large text only) |
| `--orange-deep` | `#B14E07` | Orange text on paper (4.9:1), pressed |
| `--orange-wash` | `#F8E3CE` | Bump/debug highlight wash |

### Greens (success — never the only cue)

| Token | Hex | Role |
|---|---|---|
| `--moss` | `#3F7A4E` | Mission-complete stamp, success banner (white text 4.9:1) |
| `--moss-wash` | `#DFEADF` | Success wash |

Status rules: success = moss + stamp icon + sentence; bump/debug = orange wash
+ bump icon + question + marked tile; focus = 2px `--blueprint-deep` ring +
2px paper gap. **No red anywhere; no color-only meaning.**

## 5. Typography

| Role | Font | Weights | Notes |
|---|---|---|---|
| Display / headings / numbers | **Space Grotesk** (OFL, Florian Karsten) | 500 / 700 | Geometric with technical character — drafting-poster voice |
| Command tiles, coordinates, debug log, labels | **IBM Plex Mono** (OFL, IBM) | 400 / 500 / 600 | Engineering-tag voice; very legible lowercase for kids |

- Self-hosted via `@fontsource/space-grotesk` + `@fontsource/ibm-plex-mono`,
  subsets `latin` + `latin-ext` only — **UI copy is English; no Vietnamese
  subset needed** (repo font rule: vietnamese subset only when Vietnamese text
  exists). No runtime Google Fonts.
- Scale (tablet-first): screen title `clamp(24px, 3.4vw, 36px)/1.1` Grotesk
  700 · section label 13–14px Mono 600 uppercase +0.08em · body 16–18px/1.5
  Grotesk 500 · tile labels 12–13px Mono 600 · debug log 14px Mono 400.
- Numerals `font-variant-numeric: tabular-nums` (round counters, coordinates).

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`.
Screen gutters 16 (mobile) / 24 (tablet) / 32 (desktop). ≥ 8px gap between
adjacent touch targets (skill: Touch Spacing — kept).

## 7. Layout / grid

- **Map screen**: the museum floor plan as a wide corridor — two exhibition
  wings (Sequence Hall, Loop Gallery) drawn as floor-plan rooms with mission
  plaques hung along the walls; NOT a card grid. Header band with title block
  (drafting title-block pattern: project, sheet no., mission count).
- **Board screen** (hero): two columns at ≥ 900px — left: museum room (SVG
  floor plan, square-ish, max ~58% width); right: command palette on top +
  program tray below + run controls. At < 900px: room on top, palette and
  program become a bottom dock (spec: side panel → bottom sheet).
- **Concept notebook**: overlay panel on the right (desktop) / full sheet
  (tablet portrait, mobile).
- Board screen must fit **without page scroll at 1024×768 and 1440×900** —
  the room SVG sizes to remaining height (`aspect-ratio` + `max-height`).
- Content max-width 1180px desktop; reading measure ≤ 68ch in notebook.

## 8. Illustration language

- **Robot**: original SVG paper model — blueprint-blue body panels with
  crease hairlines, bone-white face plate, two round eyes (graphite), orange
  antenna bead; direction shown by the face plate + a nose marker (never
  color-only). Flat, 2D, geometric; ~0.72 cell size, centered on its cell.
- **Museum obstacles**: flat paper exhibits — plinth with statue, bench,
  planter, rope stanchion — graphite line + one blue or bone fill each,
  readable at 48px.
- **Sparks**: orange paper lightning bolts with a graphite outline, slight
  bob ≤ 900ms loop (disabled under reduced motion).
- **Dock**: charging pad outline + orange charge ring that fills as sparks
  are collected (shape + number cue, e.g. `2/3`).
- **Tiles**: token chips 56px min height, punched corner, stencil icon
  (arrow / curved arrow / loop arrows), mono label, hard offset shadow.
- No emoji as visual language; all icons inline SVG (asset class B).

## 9. Component primitives

`Button` (primary/ghost/danger-free), `TokenTile` (palette + program),
`RepeatToken` (container), `TokenToolbar`, `RunControls` (Step/Run/Pause/
Rewind/Reset/Edit), `RoomGrid` (SVG), `Robot`, `MissionPlaque`, `StampBadge`,
`NotebookPanel`, `DebugBanner`, `TitleBlock`. One `<main>` per screen; screens
switch by app state (no router — spec static-hosting rule).

## 10. Feedback states

- Tile placed: token pops in (180ms) + tray slot counter `4/7`.
- Program counter: executing tile lifts 2px + blueprint-wash + white dot
  marker; repeat round badge `2 of 3`.
- Bump: robot recoils 4px (150ms) + obstacle flashes orange-wash + debug
  banner question + offending tile marked with orange corner tag + REWIND /
  EDIT actions. Never red, never shake-hard, no error sound.
- Success: dock ring completes, moss stamp on plaque, ≤ 900ms confetti-free
  reveal (sparks fly to the header tally — comprehension, not decoration).
- All states have text equivalents in an aria-live status line (§12).

## 11. Motion budget (GSAP, purposeful only)

| Motion | Duration | Purpose |
|---|---|---|
| Robot step between cells | 300–420ms power2.inOut | Spatial continuity on the grid |
| Robot turn (90°) | 260ms power2.out | Direction change comprehension |
| Tile pop-in / remove | 160–200ms back.out(1.6) | Placement feedback |
| Token reorder (Flip) | 280ms power2.out | Track where a tile went |
| Program-counter lift | 150ms | Tracking comprehension |
| Bump recoil | 150ms (≤ 2 small oscillations) | Cause = obstacle |
| Spark fly-to-tally | ≤ 900ms power1.in | Reward continuity |

Reduced motion (spec + skill): robot teleports between cells with ≤ 150ms
opacity fades; counter highlight stays (static lift + wash); sparks appear in
tally instantly; no bob loops, no Flip — final layout renders at once.
Single wrapper `src/lib/gsap.ts` registers plugins once and collapses tweens
under `prefers-reduced-motion` (pilot pattern).

## 12. Accessibility

- Semantic HTML first: buttons for every operable control; the room is
  `role="img"` with a text description; program strip is a list.
- Keyboard: palette tiles are buttons (Enter/Space add at caret); placed
  tiles are buttons (Enter selects); toolbar Move/Remove/(±rounds) buttons;
  ArrowLeft/Right move the caret; Run controls are real buttons with
  shortcuts S (step) / R (run-pause) / W (rewind) / E (edit) — never
  trapping focus; a visible skip-to-program link on the board.
- Screen readers: aria-live status line ("Robot at column 3, row 2, facing
  east. Executing Forward, tile 2 of 5. 2 of 3 sparks collected."). Program
  readable as text via a visually-hidden ordered list.
- Focus ring 2px blueprint-deep + 2px paper gap on every focusable element.
- No hover-only affordances; drag is an enhancement (tap + toolbar is the
  guaranteed path).
- No time pressure anywhere.

## 13. Responsive behavior

- **Mobile 360–479**: declared `mobileSupport: "limited"`-style honesty — the
  full loop works (tap tiles, run, debug) with room on top and a bottom
  program dock; drag is de-emphasized in favor of tap+toolbar. Verified at
  390×844; note that tablet is the hero target (spec: game with complex
  editing may prioritize tablet).
- **Tablet 768–1199 (hero)**: two-column board at ≥ 900px, stacked room+dock
  at 768–899; all targets ≥ 44px, spacing ≥ 8px.
- **Desktop 1200+**: more whitespace, room grows, notebook as side overlay;
  reading measure capped.
- 200% zoom reflow: columns stack before 400px effective width overflow.

## 14. Forbidden patterns (quality bar + spec)

- No purple/blue AI gradient, no neon/glow, no glassmorphism, no 3D, no thick
  soft shadows, no card-inside-card soup, no rounded-card-everything.
- No emoji as primary visual language; no fake dashboard chrome.
- No red punitive error styling; no shake-the-child feedback; no countdowns.
- No color-only status; no hover-only controls; no drag-only interactions.
- No runtime CDN, no font CDN, no eval, no network API.

## 15. Skill recommendations vs locked spec (keep/drop)

| UI UX Pro Max suggestion | Verdict | Reason |
|---|---|---|
| Touch targets ≥ 44px, 8px gaps, touch-friendly sizing | **Keep** | Matches spec tablet bar; asserted on activity screens at 1024×768 |
| WCAG 2.2: single-pointer/keyboard alternative to dragging (Move buttons) | **Keep** | Spec requires keyboard path; toolbar implements it |
| Reduced-motion via media query, final state immediate; animate 1–2 key elements | **Keep** | Matches spec motion direction §Motion |
| Stagger lists 0.02–0.04s, stable selectors for React re-renders | **Keep** | Tile pop-in uses data-attributes, not indexes |
| Duration depends on context; shared motion tokens | **Keep** | §11 budget table is the token source |
| Flip reorder with matchMedia guard | **Keep** | Spec choreography names Flip token reorder |
| HUD / Sci-Fi FUI style (neon cyan on black, glow) | **Drop** | Spec: bone white, no neon, no glow — HUD is the near-opposite palette |
| Claymorphism for children's apps (soft 3D, pastel, 24px radius, double shadows) | **Drop** | Spec forbids soft shadows/3D; flat paper thesis |
| Micro-interaction default success green / error red feedback colors | **Drop red half** | No punitive red; orange debug + moss success with icon+text |
| Share Tech Mono / Kode Mono fonts | **Drop** | IBM Plex Mono chosen: friendlier lowercase for kids, OFL, fuller weights |
| Kinetic Brutalism (all-caps, oversized, aggressive) | **Drop tone** | Keep Space Grotesk family idea (technical geometric) but friendly scale/case; 7–12 audience |

## 16. Keep/drop vs locked spec (spec wins)

All spec constraints are carried unchanged: command set F/L/R/REPEAT; repeat
holds nested simple commands; step-through with current-command highlight;
error never "fails" — robot stops at obstacle, rewind one step; JSON contract
`levels.json` (grid, start, direction, goal, obstacles, collectibles,
allowedCommands, maxCommands) + `concepts.json`; three-layer state
(content JSON / session / anonymous localStorage with reset); no backend/CDN;
static hosting; keyboard+touch+responsive as definition of done.
