# Third-Party License Policy

Every showcase in this repository is redistributed in source form and, as a
built artifact, on Shiplo. Anything the project did not originate must have
a known license and a recorded provenance before the showcase is published.

**Hard rule: unknown or unclear licensing blocks publication.** The fact
that an asset is downloadable from the internet does not mean it is
redistributable. "I found it on a free site" is not a license.

## 1. What must be tracked

Each project maintains `THIRD_PARTY_NOTICES.md` (template:
`templates/project/THIRD_PARTY_NOTICES.md`) recording:

| Material | Track it when |
|---|---|
| npm dependencies | **if bundled into build output** (runtime deps of the app). Dev/build tooling that never reaches the browser does not need a notice row, but must be license-compatible to use as tooling. |
| Fonts | always, including "free" web fonts; record license (OFL, Apache, MIT, …) |
| Icons / icon sets | always, including sets with separate trademark terms |
| Images / illustrations | always, including AI-generated ones |
| Audio | always (music, SFX, narration) |
| Textures / 3D / shaders | always |
| Copied code snippets | always — even a few lines from a blog, docs or another repo |
| Vendored JS/CSS | always — file, upstream version, upstream license |
| SVG assets from external sources | always — including "free SVG" sites; check both the artwork license and any embedded font/content licenses |

## 2. License categories

**Pre-approved** (record them and ship):

- MIT, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Apache-2.0, Unlicense, CC0-1.0
- SIL Open Font License 1.1 (fonts)

**Allowed with conditions** (record them, satisfy the condition, keep the
evidence in the notices file):

- CC-BY-4.0 / CC-BY-3.0 — attribution must be present in
  `THIRD_PARTY_NOTICES.md` (and in the app if the license requires it)
- GSAP Standard "no charge" license — free use including commercial use and
  bundling into a product; do not strip its notices from minified files and
  do not redistribute GSAP itself as a standalone library
- Public-domain claims — only with a credible source statement; state where
  the claim comes from

**Blocked** (do not ship; find an alternative):

- GPL, AGPL, LGPL for anything bundled into build output
- CC BY-NC, CC BY-ND, CC BY-NC-SA, and any "non-commercial" or
  "no-derivatives" license (showcases are distributed by a commercial entity)
- "Free for personal use only"
- Custom licenses that have not been reviewed by Shiplo HQ
- Unknown, missing, or self-contradictory licensing

Edge cases are resolved by Shiplo HQ maintainers before publication — when
in doubt, the material does not ship.

## 3. Provenance rules

For every tracked item, record: component/asset name, version, path in the
project, license, source/origin (URL or registry), whether it was modified,
and notes (e.g. attribution text, review date).

Additional rules:

- **Never strip or overwrite third-party copyright/license headers** — not
  in vendored files, not in minified bundles, not in fonts.
- **Never add Shiplo headers to third-party files.** Original Shiplo
  source carries the centralized `Copyright 2026 Shiplo HQ` +
  `SPDX-License-Identifier: Apache-2.0` header; third-party files keep
  their own notices untouched.
- Prefer assets whose license explicitly permits commercial use and
  redistribution.
- AI-generated assets: record the generating tool/model and confirm its
  terms allow commercial redistribution of outputs; note the generation
  date. Treat outputs of other people's prompts/uploads as unlicensed
  unless terms say otherwise.
- Vendored code: record the upstream repository and exact version; keep a
  way to re-sync (URL in the notices file).
- Snippets: record the source URL and the license of the surrounding work;
  if the source has no stated license, do not copy it.
- Local data files (`public/data/*.json`) authored by Shiplo are original
  content; they are *not* third-party material — but factual data compiled
  from external sources must cite its origin in a `sources` note.

## 4. Where this is enforced

- the pre-publication checklist (maintained by Shiplo HQ) — the human/agent
  gate before the SECURITY/LICENSE REVIEW stage passes;
- `scripts/validate-registry.mjs` — checks that each existing project has
  `THIRD_PARTY_NOTICES.md`;
- `scripts/check-repo.mjs` — no committed `node_modules/`, no
  committed `dist/`.

This policy cannot be fully automated: the pre-publish license review is a
manual gate performed by Shiplo HQ, and the repository scripts are a
safety net, not a substitute.
