# Habit Bloom

> Shiplo Showcase #20 — A gentle habit tracker where each habit grows a stem and daily check-ins add leaves — no streak shaming.

**Live demo:** _deployed URL will be linked here after verification_
**Category:** productivity · **License:** Apache-2.0 (original work)

Habit Bloom is a local-first habit notebook for people who are tired of
streak counters. Each habit is a plant in a botanical field-notebook: every
day you check in, a leaf unfolds on that habit's stem. Miss a day and
nothing withers — the stem just grows a longer internode, the way real
plants rest between growth. There are no accounts, no cloud and no
"you broke your streak": the whole app runs client-side from static files,
with an explicit opt-in before anything is written to `localStorage`.

Art-directed and maintained by Shiplo HQ with AI-assisted implementation.

## Highlights

- **Procedural botanical stems, 100% code-native SVG** — each habit's stem is
  a deterministic S-curve seeded from its id; leaves follow the plant family
  (fern / sprout / blossom / marigold), and every 7th check-in blooms a
  flower on flowering families.
- **No streak shaming, by design** — quiet days render as resting buds and
  longer internodes. No red, no guilt copy, no lost progress. Toggling a leaf
  off is a neutral "folded away".
- **A phenology calendar instead of a dashboard** — Insights draws the last
  four weeks as a field calendar (leaf = check-in, dot = rest, ring = today);
  no percentage tiles, no heatmap shame.
- **Reorder two ways (WCAG 2.2)** — pointer drag on the handle plus Move
  up / Move down buttons for keyboard and single-pointer users, with GSAP
  Flip keeping spatial continuity.
- **Honest local storage** — a one-question banner explains that the garden
  lives in this browser before anything is persisted; Export JSON and Reset
  demo garden are always available.

## Development

```bash
npm install
npm run dev
npm run build     # tsc -b && vite build → dist/
npm run preview
```

The build output in `dist/` is fully static — serve it from any static host.
Content (the demo habits) comes from `public/data/habits.seed.json`; no API,
no database, no runtime CDN.

## Demo path checklist

1. Open the app → the Today garden loads five sample habits with grown stems.
2. Answer the storage banner (either choice; nothing is written before it).
3. Toggle "Add today's leaf" on a habit → a leaf unfurls on the stem; the
   button flips to "Leaf added today".
4. Open a habit name → the 14-day bloom detail with resting buds and today's
   marker; toggle and go back.
5. Switch to Insights → the phenology calendar; hover nothing required.
6. Drag a row's handle (or use Move up / Move down) → rows reorder with a
   Flip transition.
7. "+ New habit" → the modal with plant family previews; plant it, check in.
8. Footer: Export JSON downloads the garden; Reset restores the seed.

## Project structure

```text
habit-bloom/
├── README.md
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES.md
├── package.json + lockfile        # committed (when the project has dependencies)
├── src/
│   ├── components/                # StemPlot, StorageBanner, AddHabitDialog
│   ├── features/                  # garden (today), detail (14-day bloom), insights
│   ├── lib/                       # types, dates, data loader, storage, gsap, stems
│   └── styles/                    # tokens.css, base.css, motion.css
├── public/
│   ├── data/habits.seed.json      # local JSON content — no API, no database
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
