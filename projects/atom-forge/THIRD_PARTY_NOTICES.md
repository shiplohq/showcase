# Third-Party Notices

Third-party material redistributed with Atom Forge. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

This file lists **exactly what ships in the build output** (`dist/`). The
production bundle is 29 files / ~638 KB: one HTML shell, one JS bundle, one
CSS bundle, 22 bundled font files (11 woff2 + 11 woff), JSON content and the
favicon (data-URI, no file).

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| React | 18.3.1 | npm → bundled JS | MIT | https://react.dev | No | Runtime UI library |
| React DOM | 18.3.1 | npm → bundled JS | MIT | https://react.dev | No | Renderer |
| Scheduler | 0.23.2 | npm → bundled JS | MIT | https://github.com/facebook/react (react-dom dep) | No | React internals |
| GSAP | 3.15.0 | npm → bundled JS | GreenSock Standard "No Charge" License | https://gsap.com/standard-license | No | Motion runtime (core only; no plugins) |
| Archivo (font family) | 5.3.0 (@fontsource) | `dist/assets/*.woff2` + `.woff` (latin 400/600/700/800, latin-ext 400/700, vietnamese 400/700) | SIL OFL 1.1 | Copyright 2020 The Archivo Project Authors (Omnibus-Type), https://github.com/Omnibus-Type/Archivo | No | Display/body grotesque |
| Spline Sans Mono (font family) | 5.3.0 (@fontsource) | `dist/assets/*.woff2` + `.woff` (latin 400/500/600, latin-ext 400/500) | SIL OFL 1.1 | Copyright 2022 The Spline Sans Mono Project Authors (SorkinType), https://github.com/SorkinType/SplineSansMono | No | Data labels / annotations |

Notes:

- **Fonts are the only external assets bundled.** No images, audio, textures,
  icons, external SVGs or vendored JS/CSS ship with the build — every
  illustration (particle discs, shell rings, nucleus, stamps, markers) is
  original inline SVG authored in this project, and all texture/graphics are
  CSS/SVG code-native.
- **No AI-generated raster assets** ship with this project (Codex image
  pipeline was not needed — the art direction is code-native vector).
- Dev-only tooling (Vite, TypeScript, @vitejs/plugin-react, @types/*) is not
  redistributed in the build output and carries no runtime obligation.

Rules honored:

- Upstream copyright and license notices preserved; no Shiplo headers added
  to third-party files.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
