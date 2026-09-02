# Third-Party Notices

Third-party material redistributed with Grammar Detective. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

## Bundled npm dependencies (runtime, shipped in `dist/`)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| react | 18.3.1 | bundled in `dist/assets/*.js` | MIT | https://github.com/facebook/react | No | UI runtime |
| react-dom | 18.3.1 | bundled in `dist/assets/*.js` | MIT | https://github.com/facebook/react | No | DOM renderer |
| gsap | 3.15.0 | bundled in `dist/assets/*.js` (incl. Flip plugin) | GreenSock Standard "No Charge" License — free for commercial use; bundling/redistribution as part of a larger work permitted | https://github.com/greensock/GSAP · https://gsap.com/standard-license/ | No | Animation runtime; Flip plugin is part of the public package since GSAP 3.13 |

## Fonts (bundled as woff2 + woff fallback via @fontsource; subsets: latin + latin-ext)

The UI ships English only; `latin` and `latin-ext` are the only subsets
imported and the only font files emitted into `dist/assets/` (18 woff2 +
18 woff files). Every weight below maps to an actually-imported CSS entry
in `src/main.tsx`.

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Fraunces (typeface), weights 700, 900, subsets latin + latin-ext | via @fontsource/fraunces 5.3.0 | bundled in `dist/assets/*.woff2` / `.woff` | SIL Open Font License 1.1 | Undercase Type — https://fonts.google.com/specimen/Fraunces · https://undercase.type.com | No | Display serif (masthead, titles) |
| Atkinson Hyperlegible (typeface), weights 400, 700, subsets latin + latin-ext | via @fontsource/atkinson-hyperlegible 5.3.0 | bundled in `dist/assets/*.woff2` / `.woff` | SIL Open Font License 1.1 | Braille Institute — https://fonts.google.com/specimen/Atkinson+Hyperlegible | No | Body + evidence-sentence font, designed for low-vision readers |
| IBM Plex Mono (typeface), weights 400, 500, 600, subsets latin + latin-ext | via @fontsource/ibm-plex-mono 5.3.0 | bundled in `dist/assets/*.woff2` / `.woff` | SIL Open Font License 1.1 | IBM — https://fonts.google.com/specimen/IBM+Plex+Mono | No | Metadata/labels only (spec: monospace chỉ dùng metadata) |
| @fontsource/fraunces | 5.3.0 | build-time dependency (self-hosts the font files) | MIT (package), OFL-1.1 (font files) | https://github.com/fontsource/fontsource | No | No runtime CDN; files are bundled |
| @fontsource/atkinson-hyperlegible | 5.3.0 | build-time dependency (self-hosts the font files) | MIT (package), OFL-1.1 (font files) | https://github.com/fontsource/fontsource | No | No runtime CDN; files are bundled |
| @fontsource/ibm-plex-mono | 5.3.0 | build-time dependency (self-hosts the font files) | MIT (package), OFL-1.1 (font files) | https://github.com/fontsource/fontsource | No | No runtime CDN; files are bundled |

OFL 1.1 fonts cannot be sold by themselves and must keep their name when
modified; embedding and redistribution in an app is permitted. The OFL text
ships with the fontsource packages.

## Images / textures / icons

All artwork is **original and authored in this project** under Apache-2.0 —
no third-party rights involved:

- SVG icons (magnifier, stamp, paperclip, pen nib, folder, arrows, reset,
  check, clue note, board, bureau seal): `src/components/art.tsx`.
- Paper grain: procedural SVG filter (`src/assets/paper-grain.svg`).
- Favicon: `public/favicon.svg`.
- Case-file, folder, highlighter-mark and card visuals: CSS
  (`src/styles/*.css`).
- No raster assets ship; no AI-generated assets are used.

## Dev-only tooling (NOT bundled into `dist/`; listed for transparency)

vite 7.3.6 (MIT), @vitejs/plugin-react 5.2.0 (MIT), typescript 5.9.3
(Apache-2.0), @types/react 18.3.31 (MIT), @types/react-dom 18.3.7 (MIT).

---

Rules honored:

- Upstream copyright and license notices preserved (fonts keep OFL headers
  inside the fontsource packages; npm packages ship in full in
  `node_modules`, only their bundled output is redistributed here).
- No Shiplo headers were added to any third-party file.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
