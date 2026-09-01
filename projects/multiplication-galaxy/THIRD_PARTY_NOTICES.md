# Third-Party Notices

Third-party material redistributed with Multiplication Galaxy. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

## Bundled npm dependencies (runtime, shipped in `dist/`)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| react | 18.3.1 | bundled in `dist/assets/*.js` | MIT | https://github.com/facebook/react | No | UI runtime |
| react-dom | 18.3.1 | bundled in `dist/assets/*.js` | MIT | https://github.com/facebook/react | No | DOM renderer |
| gsap | 3.15.0 | bundled in `dist/assets/*.js` (incl. MotionPathPlugin) | GreenSock Standard "No Charge" License — free for commercial use; bundling/redistribution as part of a larger work permitted | https://github.com/greensock/GSAP · https://gsap.com/standard-license/ | No | Animation runtime (orbit lock morph, probe transfer, array build-up) |

## Fonts (bundled as woff/woff2 via @fontsource, subsets: latin + latin-ext + vietnamese)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Space Grotesk (typeface) | via @fontsource/space-grotesk 5.3.0 | bundled in `dist/assets/*.css` / woff2 | SIL Open Font License 1.1 | Florian Karsten — https://fonts.google.com/specimen/Space+Grotesk | No | Display / fact numerals font |
| Work Sans (typeface) | via @fontsource/work-sans 5.3.0 | bundled in `dist/assets/*.css` / woff2 | SIL Open Font License 1.1 | Wei Huang — https://fonts.google.com/specimen/Work+Sans | No | Body/UI font |
| @fontsource/space-grotesk | 5.3.0 | build-time dependency (self-hosts the font files) | MIT (package), OFL-1.1 (font files) | https://github.com/fontsource/fontsource | No | No runtime CDN; files are bundled |
| @fontsource/work-sans | 5.3.0 | build-time dependency (self-hosts the font files) | MIT (package), OFL-1.1 (font files) | https://github.com/fontsource/fontsource | No | No runtime CDN; files are bundled |

OFL 1.1 fonts cannot be sold by themselves and must keep their name when
modified; embedding and redistribution in an app is permitted. The OFL text
ships with the fontsource packages.

## Images / textures

None from third parties. All artwork — planets, satellites, probe craft,
orbit glyphs, icons, starfield (procedural canvas) and print grain (inline
SVG `feTurbulence`) — is **original SVG/canvas code authored in this
project** (`src/components/`, `src/features/*/`) under Apache-2.0. No
AI-generated raster assets are used in this showcase (art direction is
code-native by decision — `design/DESIGN_DECISIONS.md` §9).

## Dev-only tooling (NOT bundled into `dist/`; listed for transparency)

vite 7.3.6 (MIT), @vitejs/plugin-react 5.2.0 (MIT), typescript 5.9.3
(Apache-2.0), @types/react 18.3.31 / @types/react-dom 18.3.7 (MIT).

---

Rules honored:

- Upstream copyright and license notices preserved (fonts keep OFL headers
  inside the fontsource packages; npm packages ship in full in `node_modules`,
  only their bundled output is redistributed here).
- No Shiplo headers were added to any third-party file.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
