# Clock Quest

> Shiplo Showcase #05 — an island of train schedules, markets and a lighthouse.
> Turn the clock hands to arrive at the right place at the right time.
> Live demo: **<https://clock-quest.shiplo.site>**

A telling-time journey for young travellers (ages 6–9): read a real departure
board, set a station clock by dragging its hands, and pin the day's memories to
a morning-midday-evening timeline. Five island stops, fifteen missions, one
journal that fills with stamps.

**Category:** education-math · **License:** Apache-2.0 (original work)

## Highlights

- **The island map is the menu** — a hand-drawn nautical chart (SVG, data-driven
  from `schedule.json`) with a dashed ferry route; the ferry token physically
  sails to each stop you unlock, and the chart's light shifts morning → midday →
  evening → dusk as the day progresses.
- **A clock you operate like a clock** — drag either hand (the face itself is the
  grab area; the pointer picks the nearest hand), step it with big − / + buttons,
  or focus the clock and use the arrow keys. Crossing 12 o'clock carries the hour
  forward exactly like the real object. Every analog change updates a digital
  twin right beside it — analog ↔ digital are never separated.
- **Hints that measure, don't tell** — the hint button sweeps an amber arc from
  12 to the minute hand with 5-10-15 counting labels, so children count their own
  way to the answer. Wrong answers nudge gently and never disable anything.
- **A quest loop with three mission types** — `set-clock` (drag/step to a target
  time), `read-schedule` (pick the right row on a station departure board) and
  `day-recap` (pin activity cards to the right part of the day) — all defined in
  local JSON, zero hard-coded content in the UI.
- **No build step at runtime** — plain HTML/CSS/JS with jQuery + GSAP vendored
  locally; this project exists to show a rich, animated, data-driven learning
  game shipping as raw static files.

## How to run it

Any static file server works (the game fetches its JSON at runtime, so don't
open `index.html` via `file://`):

```bash
cd projects/clock-quest
python -m http.server 8080        # or: npx --yes serve .
# → http://localhost:8080
```

To assemble and validate the deployable artifact:

```bash
npm install      # no runtime dependencies — generates the lockfile only
npm run build    # copies + verifies dist/ (local refs, JSON, size caps)
npm run test:engine   # headless playthrough of all 15 missions via js/engine.js
```

`dist/` is generated and gitignored; deploy that folder. The build script only
assembles and validates — nothing is transpiled, so source and artifact are the
same files.

## Development notes

- **Stack (locked by spec):** jQuery 3.7.1 + vanilla HTML/CSS/JS + GSAP 3.15
  (Draggable, MotionPath), all vendored under `vendor/`. Zero npm dependencies.
- **Three state layers** (`js/engine.js`, pure and DOM-free): content state from
  `data/lessons.json` + `data/schedule.json`, interaction state per session, and
  an optional anonymous `localStorage` snapshot (completed missions + stamps)
  with a visible "Start over" reset.
- **The engine is testable headless:** `npm run test:engine` plays every mission
  through the same functions the UI calls, including nudge-and-recover paths —
  it caught two real bugs during development (a snap-grid-inconsistent start
  pose, and a success-decorate callback that locked the board after one wrong
  pick).
- **Verification tooling:** `scripts/cdp-driver.mjs` drives the whole quest in a
  real headless Chrome (mouse drag, keyboard steppers, board picks, recap,
  finale, reset) at 1440×900, 1024×768 and 390×844 with zero console errors.
- **Design system:** `design/DESIGN_DECISIONS.md` — travel journal + nautical
  chart; parchment / navy ink / seafoam / buoy red / brass; Hepta Slab (display,
  clock numerals) + Lexend (body) self-hosted as woff2; motion budget feedback
  120–220 ms, spatial 250–500 ms, delight ≤ 900 ms, all `prefers-reduced-motion`
  aware.

## Demo path checklist

1. Land on the island map — the Ferry Pier marker pulses; the journal panel
   says "Next stop".
2. Click the pier → mission 1 (set 9:00): drag or step, press
   **Check the clock** — the teal "Right on time!" strip appears and the first
   stamp lands in the header passport.
3. Continue twice to finish the pier; watch the ferry sail the dashed route to
   Salty Market as the chart light warms.
4. At Clang Station, read the departure board and pick the train the prompt
   asks for (a wrong pick flashes amber and invites another try).
5. After the lighthouse, pin six memory cards to Morning / Midday / Evening at
   Clocktower Green.
6. The finale journal recaps the whole day; **Sail again tomorrow** resets.

## Screenshots

Captured from the live deployment ([clock-quest.shiplo.site](https://clock-quest.shiplo.site));
tablet is the hero viewport for this learning game. Source PNGs from the
verification run live in the internal `showcase/.shots/` archive.

| Shot | Viewport | What it shows |
|---|---|---|
| `showcase/cover.webp` | 1440×900 | Staged teaching moment (art-directed): the quest ticket open over the island chart, station clock mid-lesson with the amber measuring arc sweeping from 12 and 5-10-15 counting labels |
| `showcase/desktop.webp` | 1440×900 | Honest landing: nautical island chart with five stops on the dashed ferry route, compass rose, journal panel and the stamp passport |
| `showcase/tablet.webp` | 1024×768 | Hero tablet view: chart on top, journal panel with the "Sail there" call-to-action above the fold, "0 of 5 stops" journey bar |
| `showcase/mobile.webp` | 390×844 | Honest mobile landing: wrapped journal header, scaled chart with all five markers legible, panel stacked below |

## Project structure

```text
clock-quest/
├── index.html               # the whole app shell
├── css/                     # tokens · base · motion
├── js/
│   ├── engine.js            # pure quest logic (no DOM)
│   ├── data.js              # JSON fetch + validation + error screen
│   ├── clock.js             # SVG station clock + GSAP Draggable
│   ├── map.js               # nautical chart + ferry MotionPath + day phases
│   ├── icons.js             # original SVG icon library
│   ├── motion.js            # GSAP registration + reduced-motion gate
│   └── app.js               # jQuery orchestration (screens, feedback)
├── data/                    # lessons.json · schedule.json (all content)
├── fonts/                   # self-hosted woff2 + OFL license texts
├── vendor/                  # jquery 3.7.1 · gsap 3.15 (local, no CDN)
├── scripts/                 # build.mjs · engine-sim.mjs · cdp-driver.mjs · capture-cover.mjs
├── design/DESIGN_DECISIONS.md
├── showcase/                # deployment.json · metadata.json · screenshots
└── dist/                    # generated, gitignored — the deploy artifact
```

## Open source

This project is part of the [Shiplo Showcase](https://github.com/shiplohq/showcase)
and is distributed under the Apache License 2.0. See `LICENSE` and `NOTICE`.

This showcase is art-directed and maintained by Shiplo HQ with AI-assisted
implementation.

Shiplo names, logos and brand assets are handled separately from the
source-code license. See the repository `TRADEMARKS.md`.

Third-party material redistributed with this project — vendored jQuery (MIT),
GSAP (GreenSock Standard No-Charge license) and the OFL-licensed Hepta Slab +
Lexend fonts — is documented in `THIRD_PARTY_NOTICES.md`.

## Security and production use

This project is a demonstration/reference implementation, not a security audit
or a production-readiness guarantee.

If you adapt it for production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository root for the reporting policy and the
production-use checklist.
