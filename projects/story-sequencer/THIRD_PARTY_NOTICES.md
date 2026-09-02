# Third-Party Notices

Third-party material redistributed with Story Sequencer. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Angular (framework packages: core, common, compiler, platform-browser, forms) | 21.2.22 | bundled into `dist/main-*.js` | MIT | https://angular.io — npm `@angular/*` | No | Runtime framework code compiled into the static bundle. |
| RxJS | 7.8.2 | bundled into `dist/main-*.js` | Apache-2.0 | https://rxjs.dev — npm `rxjs` | No | Transitive of Angular. |
| tslib | 2.8.1 | bundled into `dist/main-*.js` | 0BSD | https://github.com/microsoft/tslib — npm `tslib` | No | TypeScript runtime helpers. |
| GSAP (incl. Flip plugin) | 3.15.0 | bundled into `dist/main-*.js` | GreenSock Standard "No Charge" License | https://gsap.com — npm `gsap` | No | Free-for-use license; standard no-charge terms apply, not MIT. |
| Andika font (latin, latin-ext, vietnamese subsets; weights 400 + 700; woff2 + woff) | 5.3.0 package / Andika 6.003 upstream | `dist/media/andika-*` | SIL Open Font License 1.1 | SIL International — npm `@fontsource/andika` (Google Fonts) | No | Early-literacy body face. Subsets shipped: exactly latin, latin-ext, vietnamese. |
| Bangers font (latin, latin-ext, vietnamese subsets; weight 400; woff2 + woff) | 5.3.0 package / Bangers 1.007 upstream | `dist/media/bangers-*` | SIL Open Font License 1.1 | Vernon Adams — npm `@fontsource/bangers` (Google Fonts) | No | Comic display face (masthead, titles, stamps, step chips). Subsets shipped: exactly latin, latin-ext, vietnamese. |

Notes:

- Dev-only tooling (`@angular/cli`, `@angular/build`, `@angular/compiler-cli`,
  `typescript`) is not bundled into the artifact and therefore has no row.
- All 26 story-frame illustrations, the favicon and every decorative SVG in
  the app are original artwork authored in this repository
  (`src/app/features/board/scenes.ts`) — no third-party imagery or icon sets
  ship. No Codex/AI-generated raster assets are used.
- The JSON content (`public/data/stories.json`) is original work.
- Preserve upstream copyright and license notices; never add Shiplo headers
  to third-party files. Font copyright and OFL notices are embedded in the
  @fontsource packages the build copies from.
