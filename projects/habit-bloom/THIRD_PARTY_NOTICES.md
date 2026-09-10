# Third-Party Notices

Third-party material redistributed with Habit Bloom. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

This file lists **exactly what ships in the build output** (`dist/`). The
production bundle is 40 files / ~1.04 MB: one HTML shell, one JS bundle, one
CSS bundle, 36 bundled font files (18 woff2 + 18 woff), the JSON seed, and
the favicon (data-URI, no file).

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| React | 18.3.1 | npm → bundled JS | MIT | https://react.dev | No | Runtime UI library |
| React DOM | 18.3.1 | npm → bundled JS | MIT | https://react.dev | No | Renderer |
| Scheduler | 0.23.2 | npm → bundled JS | MIT | https://github.com/facebook/react (react-dom dep) | No | React internals |
| GSAP | 3.15.0 | npm → bundled JS | GreenSock Standard "No Charge" License | https://gsap.com/standard-license | No | Motion runtime (core + Flip plugin only; leaf drag is native pointer events) |
| Lora (font family) | 5.3.0 (@fontsource) | `dist/assets/*.woff2` + `.woff` (latin 400/500/600/700 + 400/600 italic, latin-ext 400/600, vietnamese 400/600) | SIL OFL 1.1 | Copyright 2011 The Lora Project Authors (Cyreal), https://github.com/cyrealtype/Lora | No | Display serif — habit names, headings, counts |
| Raleway (font family) | 5.3.0 (@fontsource) | `dist/assets/*.woff2` + `.woff` (latin 400/500/600/700, latin-ext 400/600, vietnamese 400/600) | SIL OFL 1.1 | Copyright 2010 Matt McInerney (larabiefonts), https://github.com/theleagueof/raleway | No | Body / UI sans |
| Fragment Mono (font family) | 5.3.0 (@fontsource) | `dist/assets/*.woff2` + `.woff` (latin 400 + 400 italic, latin-ext 400) | SIL OFL 1.1 | Copyright 2014 The Fragment Mono Project Authors (Etcetera Type Company), https://fonts.google.com/specimen/Fragment+Mono | No | Specimen tags / dates / mono annotations |

Notes:

- **Fonts are the only external assets bundled.** No images, audio, textures,
  icons, external SVGs or vendored JS/CSS ship with the build — every
  illustration (stems, leaves, blooms, resting buds, drag grips, check marks,
  plant previews) is original inline SVG authored in this project, and all
  texture/graphics are CSS/SVG code-native.
- **No AI-generated raster assets** ship with this project (the art direction
  is code-native vector; the Codex image pipeline was not needed).
- Dev-only tooling (Vite, TypeScript, @vitejs/plugin-react, @types/*) is not
  redistributed in the build output and carries no runtime obligation.

Rules honored:

- Upstream copyright and license notices preserved; no Shiplo headers added
  to third-party files.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
