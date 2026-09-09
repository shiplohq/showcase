# Third-Party Notices

Third-party material redistributed with RoboRoute. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

## npm dependencies bundled into the build output

| Component | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| React | 18.3.1 | npm → bundled JS (`dist/assets/*.js`) | MIT | https://react.dev · https://github.com/facebook/react | No | UI runtime |
| ReactDOM | 18.3.1 | npm → bundled JS (`dist/assets/*.js`) | MIT | https://react.dev · https://github.com/facebook/react | No | DOM renderer |
| Scheduler (react-dom dependency) | 0.23.2 | npm → bundled JS (`dist/assets/*.js`) | MIT | https://github.com/facebook/react (react-dom dep) | No | React internals |
| GSAP core | 3.15.0 | npm → bundled JS (`dist/assets/*.js`) | GreenSock Standard "No Charge" License — free for commercial use; bundling/redistribution as part of a larger work permitted | https://github.com/greensock/GSAP · https://gsap.com/standard-license/ | No | Motion runtime (robot steps, tile turns) |
| Flip (GSAP plugin) | 3.15.0 | npm → bundled JS (`dist/assets/*.js`) | GreenSock Standard "No Charge" License | https://github.com/greensock/GSAP | No | Program-tile reorder animation |

## Fonts (self-hosted via @fontsource, bundled into `dist/assets/`)

| Component | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Space Grotesk (font family) | 5.3.0 (@fontsource) | `dist/assets/*.woff2` / `.woff` (latin + latin-ext, 400/500/700) | SIL OFL 1.1 | Copyright 2020 The Space Grotesk Project Authors (Florian Karsten), https://github.com/floriankarsten/space-grotesk | No | Display / headings / body |
| IBM Plex Mono (font family) | 5.3.0 (@fontsource) | `dist/assets/*.woff2` / `.woff` (latin + latin-ext, 400/500/600) | SIL OFL 1.1 | Copyright 2017 IBM Corp. All rights reserved., https://github.com/IBM/plex | No | Command tiles, coordinates, labels |

UI copy is English; only `latin` + `latin-ext` subsets are bundled. No
runtime font CDN is used — all font files are bundled locally.

## Illustrations, icons, audio, textures

None from third parties. All artwork (robot, museum exhibits, sparks, dock,
command-tile icons, concept diagrams, mission plaques) is original inline
SVG authored in this project (`src/components/art.tsx`) — asset class B,
no third-party rights. No raster assets, audio or textures ship with the
build. No AI-generated assets are used.

## Notes

- Upstream copyright and license notices are preserved inside the bundled
  libraries (React/Scheduler MIT notices and the GSAP license banner remain
  in the minified output comments); no Shiplo headers were added to any
  third-party file.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
