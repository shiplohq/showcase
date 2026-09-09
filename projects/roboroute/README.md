# RoboRoute

> Shiplo Showcase #15 — A paper robot on a grid museum: lay down command tiles — forward, turn, repeat — then step through and debug.

**Live demo:** _deployed URL will be linked here after verification_
**Category:** education-computing · **License:** Apache-2.0 (original work)

RoboRoute teaches sequence, loops and debugging to children 7–12. A paper
robot waits on a blueprint floor plan of the "Museum of Ways"; the player
builds its program from physical-feeling command tokens (Forward, Turn left,
Turn right, Repeat), runs it step by step, and debugs the route when the
robot bumps. All content — 8 missions across two wings, concepts notebook —
lives in local JSON; the interpreter is a deterministic pure engine with no
backend, no database and no runtime CDN.

Art-directed and maintained by Shiplo HQ with AI-assisted implementation.

## Highlights

- **Step-through interpreter with a visible program counter** — the
  executing tile lights up, repeat rounds badge `2 of 3`, and every run can
  be stepped (S), paused (R), rewound one step (W) and re-edited (E).
- **Bump is a clue, not a mistake** — walking into a wall or exhibit stops
  the robot, marks the offending tile and the wall edge, and asks "which
  tile should change?". No red, no shake, no punitive copy anywhere.
- **REPEAT as a container token** — loops hold up to 4 inner tiles with
  ±round controls and an inside-editing mode; one mental model, no nesting.
- **Friendly industrial blueprint art direction** — bone drafting paper,
  engineering blue, one signal orange; a folded-paper robot drawn entirely
  in original inline SVG. No emoji, no gradients, no dashboard chrome.
- **Fully keyboard- and touch-operable** — tap/Enter places tokens, the
  tile toolbar reorders without dragging (WCAG 2.2), and
  `prefers-reduced-motion` collapses every tween to instant states.

## Development

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run test:engine  # headless engine simulation (178 checks)
```

Deploy `dist/` to any static host. The build is fully self-contained:
relative asset paths, bundled fonts, local JSON content.


## Project structure

```text
roboroute/
├── README.md
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES.md
├── package.json + lockfile        # committed (when the project has dependencies)
├── src/
├── public/
│   ├── data/                      # local JSON content — no API, no database
│   └── assets/                    # local, redistributable assets only
├── showcase/
│   ├── cover.webp / desktop.webp / tablet.webp / mobile.webp
│   ├── metadata.json
│   └── deployment.json
└── dist/                          # generated, gitignored — the deploy artifact
```

## Open source

This project is part of the Shiplo Showcase and is distributed under the
Apache License 2.0. See `LICENSE` and `NOTICE`.

Shiplo names, logos and brand assets are handled separately from the
source-code license. See the repository `TRADEMARKS.md`.

Third-party material redistributed with this project is documented in
`THIRD_PARTY_NOTICES.md` (policy: repository `THIRD_PARTY_POLICY.md`).

## Security and production use

This project is a demonstration/reference implementation, not a security
audit or a production-readiness guarantee.

If you adapt it for production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository for the reporting policy and the
production-use checklist.
