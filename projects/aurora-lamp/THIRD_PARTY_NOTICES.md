# Third-Party Notices

Third-party material redistributed with Aurora Lamp. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

## Vendored runtimes (shipped as-is in `vendor/`, loaded locally — no CDN)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| GSAP core | 3.15.0 | `vendor/gsap/gsap.min.js` | GreenSock Standard "No Charge" License — free for commercial use; bundling/redistribution as part of a larger work permitted | https://github.com/greensock/GSAP · https://gsap.com/standard-license/ | No | Animation runtime |
| ScrollTrigger (GSAP plugin) | 3.15.0 | `vendor/gsap/ScrollTrigger.min.js` | GreenSock Standard "No Charge" License (free plugin) | https://github.com/greensock/GSAP | No | Pins the exploded-anatomy panel and drives the scrub; never created under `prefers-reduced-motion` |

GSAP keeps its upstream copyright header inside the vendored files; no
Shiplo headers were added to them. `vendor/` is gitignored in this repo
(regenerated after clone: `npm install` at the repo root, then copy
`node_modules/gsap/dist/{gsap,ScrollTrigger}.min.js` into
`projects/aurora-lamp/vendor/gsap/`) — the deployed `dist/` always carries
the vendored files.

## Fonts (self-hosted woff2, committed under `fonts/`)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Fraunces (typeface), weights 600/700 | fontsource latin woff2 file set | `fonts/fraunces-latin-{600,700}-normal.woff2` | SIL Open Font License 1.1 | Undercase Type — https://fonts.google.com/specimen/Fraunces (files via `@fontsource/fraunces`) | No | Display face (hero, section titles); full license text in `fonts/OFL-Fraunces.txt` |
| Instrument Sans (typeface), weights 400/500/600 | fontsource latin woff2 file set | `fonts/instrument-sans-latin-{400,500,600}-normal.woff2` | SIL Open Font License 1.1 | Rodrigo Fuenzalida / Greek Type Foundry — https://fonts.google.com/specimen/Instrument+Sans (files via `@fontsource/instrument-sans`) | No | Body/UI face; license text in `fonts/OFL-InstrumentSans.txt` |
| IBM Plex Mono (typeface), weights 400/500 | fontsource latin woff2 file set | `fonts/ibm-plex-mono-latin-{400,500}-normal.woff2` | SIL Open Font License 1.1 | IBM — https://github.com/IBM/plex (files via `@fontsource/ibm-plex-mono`) | No | Technical annotations: part callouts, dimension readouts, section indices; license text in `fonts/OFL-IBMPlexMono.txt` |

The UI ships English text only; the `latin` subsets cover everything
rendered. OFL 1.1 fonts cannot be sold by themselves and must keep their
name when modified; embedding and redistribution in an app is permitted.
The three OFL license texts ship alongside the woff2 files in `fonts/`.
The `@fontsource/*` npm packages are install-time sources only — nothing
from `node_modules/` is bundled into `dist/`.

## Artwork and data

All product drawings (lamp part library, exploded anatomy, dusk-room
scene, materials study, dimensioned elevation), icons and the favicon are
original inline SVG authored in this repository (Apache-2.0, Shiplo
headers). `data/product.json` is original fictional copy. No external
images, textures, audio or icon sets are redistributed.
