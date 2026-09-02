# Third-Party Notices

Third-party material redistributed with Phonics Forest. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

## Bundled npm dependencies (runtime, shipped in `dist/`)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| gsap | 3.15.0 | bundled in `dist/assets/*.js` (incl. Flip + MotionPathPlugin) | GreenSock Standard "No Charge" License — free for commercial use; bundling/redistribution as part of a larger work permitted | https://github.com/greensock/GSAP · https://gsap.com/standard-license/ | No | Animation runtime; Flip and MotionPathPlugin are part of the public package since GSAP 3.13 |

## Fonts (bundled as woff2/woff via @fontsource)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Fraunces (typeface) | v4.004 (via @fontsource/fraunces 5.3.0) | bundled in `dist/assets/` (woff2 + inlined data-URI subsets: latin + vietnamese) | SIL Open Font License 1.1 | Undercase Type / Phaedra Charles, Flavia Zimbardi — https://fonts.google.com/specimen/Fraunces | No | Display/storytelling serif (weights 600, 900) |
| Andika (typeface) | v6.200 (via @fontsource/andika 5.3.0) | bundled in `dist/assets/` (woff2 + woff subsets: latin + latin-ext + vietnamese) | SIL Open Font License 1.1 (fonts), OFL-compatible release by SIL International | SIL International — https://software.sil.org/andika/ · https://fonts.google.com/specimen/Andika | No | Beginning-reader font: graphemes, IPA captions, UI text (weights 400, 700) |
| @fontsource/fraunces | 5.3.0 | build-time dependency (self-hosts the font files) | MIT (package), OFL-1.1 (font files) | https://github.com/fontsource/fontsource | No | No runtime CDN; files are bundled |
| @fontsource/andika | 5.3.0 | build-time dependency (self-hosts the font files) | MIT (package), OFL-1.1 (font files) | https://github.com/fontsource/fontsource | No | No runtime CDN; files are bundled |

OFL 1.1 fonts cannot be sold by themselves and must keep their name when
modified; embedding and redistribution in an app is permitted. The OFL text
ships with the fontsource packages.

## Artwork

All artwork (sound trees, hatch textures, word-creature sprites, sound
stone, fireflies, hills/fog backdrop, UI icons) is **original SVG authored
in this project** (`src/components/art.ts`) under Apache-2.0 — no
third-party rights involved. **No raster assets and no AI-generated images
are shipped** (the woodcut identity is line-based and fully vector; see
`design/DESIGN_DECISIONS.md` §9).

## Audio

**No audio files are shipped.** Word cues use the browser's built-in
`speechSynthesis` (platform voices); feedback chimes are synthesized at
runtime with the Web Audio API (oscillators, `src/lib/audio.ts`). Neither
involves third-party assets or rights.

## Dev-only tooling (NOT bundled into `dist/`; listed for transparency)

vite 7.3.6 (MIT), typescript 5.9.3 (Apache-2.0).

---

Rules honored:

- Upstream copyright and license notices preserved (fonts keep OFL headers
  inside the fontsource packages; npm packages ship in full in
  `node_modules`, only their bundled output is redistributed here).
- No Shiplo headers were added to any third-party file.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
