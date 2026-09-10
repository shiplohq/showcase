# Third-Party Notices

Third-party material redistributed with Rhythm Canvas. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

This file lists **exactly what ships in the build output** (`dist/`). The
production bundle is 41 files / ~705 KB: one HTML shell, one JS bundle, one
CSS bundle, JSON content, an SVG favicon and 36 bundled font files
(18 woff2 + 18 woff — latin, latin-ext and vietnamese subsets declared by the
font packages; browsers fetch only the subsets a page needs).

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| GSAP | 3.15.0 | npm → bundled JS | GreenSock Standard "No Charge" License | https://gsap.com/standard-license | No | Motion runtime — core + CustomEase + SplitText only |
| Anton (font family) | 5.3.0 (@fontsource) | `dist/assets/anton-*.woff2` + `.woff` (400) | SIL OFL 1.1 | Copyright 2016 The Anton Project Authors (Google Fonts), https://github.com/googlefonts/AntonFont | No | Poster display face |
| Space Grotesk (font family) | 5.3.0 (@fontsource) | `dist/assets/space-grotesk-*.woff2` + `.woff` (400/500/700) | SIL OFL 1.1 | Copyright 2020 The Space Grotesk Project Authors (Florian Karsten), https://github.com/floriankarsten/space-grotesk | No | UI/body face |
| Space Mono (font family) | 5.3.0 (@fontsource) | `dist/assets/space-mono-*.woff2` + `.woff` (400/700) | SIL OFL 1.1 | Copyright 2016 Colophon Foundry (for Google Fonts), https://github.com/googlefonts/spacemono | No | Mono annotations / readouts |
| @fontsource packages | 5.3.0 | npm → bundled CSS/JS references | MIT (packaging) | https://fontsource.org | No | Font packaging only; the fonts themselves carry OFL 1.1 |

Notes:

- **No audio files ship with this project.** Every sound is synthesized at
  runtime with the Web Audio API (oscillators and a generated noise buffer)
  from the note/pattern data in `public/data/tracks.json` — there is no
  recorded, sampled or downloaded audio, so no audio licensing applies.
- **Fonts are the only external assets bundled.** No images, textures, icons,
  external SVGs or vendored JS/CSS ship with the build — the favicon is an
  original inline SVG authored in this project, and every mark on the canvas
  is code-drawn geometry.
- **No AI-generated raster assets** ship with this project (the art direction
  is code-native vector; the Codex image pipeline was not needed).
- Dev-only tooling (Vite, TypeScript) is not redistributed in the build output
  and carries no runtime obligation.

Rules honored:

- Upstream copyright and license notices preserved; no Shiplo headers added
  to third-party files.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
