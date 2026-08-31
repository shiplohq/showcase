# Contributing to Shiplo Showcase

This repository is the canonical home of the **Shiplo Showcase**: a curated
collection of open-source, production-quality **static web showcases** —
education experiences, creative tools and microsites — built and published
by Shiplo HQ.

Every showcase follows the same lifecycle and the same definition of done.
This document is the hub; the detailed policies live in the files it links.

## Repository layout

```text
showcase/
├── LICENSE / NOTICE / TRADEMARKS.md / SECURITY.md
├── CONTRIBUTING.md / THIRD_PARTY_POLICY.md / README.md
├── showcase.json                  # registry of all showcases (single source of status)
├── schemas/                       # JSON Schema for the registry
├── templates/project/             # scaffold for a new showcase
├── scripts/                       # registry/scaffold/build/secrets tooling (dependency-free Node)
└── projects/<slug>/               # one directory per showcase (created on demand)
```

## The lifecycle (definition of done)

Every showcase moves through these stages, in order:

```text
SPEC → DESIGN → IMPLEMENT → TEST → IMPECCABLE REVIEW → BUILD →
SECURITY/LICENSE REVIEW → DEPLOY TO SHIPLO → VERIFY LIVE DEPLOYMENT →
CAPTURE SCREENSHOTS → UPDATE METADATA → UPDATE README GALLERY → LIVE
```

| Stage | What happens | Registry status |
|---|---|---|
| SPEC | Product requirements are written down by Shiplo HQ and frozen as the source of truth | `planned` |
| DESIGN | Design-system reasoning (UI UX Pro Max); optional art-direction exploration (Huashu) | `designing` |
| IMPLEMENT | Working, real interaction logic — not a mockup | `building` |
| TEST | Behavior, keyboard/touch/responsive, reduced-motion, console | `building` |
| IMPECCABLE REVIEW | Final design/UX quality gate (Impeccable): audit, harden, polish | `polishing` |
| BUILD | Production build; static output verified (`scripts/verify-static-build.mjs`) | `deploying` |
| SECURITY/LICENSE REVIEW | Publication gate: secrets, private data, dependency audit, third-party notices, source headers, console/static-asset review | `deploying` |
| DEPLOY TO SHIPLO | Production build deployed; the returned URL is recorded verbatim | `deploying` |
| VERIFY LIVE DEPLOYMENT | Live URL fetched and checked; `showcase/deployment.json` completed (commit SHA, artifact hash, timestamps) | `deploying` |
| CAPTURE SCREENSHOTS | From the **live** URL only — cover/desktop/tablet/mobile into `showcase/` | `deploying` |
| UPDATE METADATA | `showcase/metadata.json` + `showcase.json` | `deploying` |
| UPDATE README GALLERY | `npm run gallery` renders live projects into the root README | `deploying` |
| LIVE | Done. The root README gallery shows it | `live` |

Allowed statuses in `showcase.json`: `planned`, `designing`, `building`,
`polishing`, `deploying`, `live`, `archived`.

## Starting a showcase

1. Product specs are written and maintained by Shiplo HQ. Each showcase
   starts from a written spec; the spec is the source of truth for product
   requirements. Do not change scope without updating the spec first.
2. Register the showcase in `showcase.json` with status `planned` (entries
   for the current roadmap are pre-registered).
3. Scaffold the project:

   ```bash
   npm run new -- <slug>
   ```

   This creates `projects/<slug>/` from `templates/project/` with the
   legal files, `showcase/` metadata skeleton and source directories, and
   moves the registry entry to `building`.
4. Add the stack scaffolding the spec calls for (e.g. `npm create vite`),
   or go build-free if the spec calls for plain HTML/CSS/JS.
5. Work the lifecycle above. `npm run validate` tells you what the
   registry thinks is missing.

## Canonical source policy

Human-readable source is canonical. For React/Vue/Angular/Vite projects:

- **Commit:** source, `package.json`, lockfile, local JSON data,
  redistributable local assets, README/legal/provenance files.
- **Do not commit:** `dist/` (generated; gitignored — it is the deploy
  artifact). `npm run check:repo` rejects committed `dist/` and
  `node_modules/`.
- Build-free HTML/CSS/JS showcases may keep production source close to the
  deployed artifact — they still need README, LICENSE, NOTICE and
  `THIRD_PARTY_NOTICES.md`.

Expected per-project structure is documented in `templates/project/`.

## Governance files

| File | Governs |
|---|---|
| `LICENSE` | Apache-2.0 for all original source in this repo |
| `NOTICE` | Repo-level attribution, third-party and trademark pointers |
| `TRADEMARKS.md` | Shiplo names/logos/brand assets — separate from the code license |
| `THIRD_PARTY_POLICY.md` | What must be tracked, allowed/blocked licenses, provenance |
| `SECURITY.md` | What a showcase guarantees (and does not); reporting |

Key conventions enforced by tooling: original source files carry the
centralized Shiplo copyright + `SPDX-License-Identifier: Apache-2.0`
header (never third-party files, never JSON); the Shiplo demo URL is only
ever the exact value returned by the deployment system; final screenshots
are captured only from the verified live deployment.

## Pull requests

- Use conventional commit messages (`feat:`, `fix:`, `chore:`, `docs:`…).
- Before opening a PR, `npm run ci` must pass locally: registry
  validation, repo hygiene, secret scan, gallery freshness — and, for
  projects that exist, a clean install + production build.
- Changes to a showcase never bypass the pre-publish checklist when they
  change what gets deployed.

## About this project

Showcases in this repository are created for Shiplo HQ and developed using
an AI-assisted engineering workflow. Product direction, acceptance
criteria, art direction, review and release are maintained by Shiplo HQ.
All original source is Apache-2.0 (see `LICENSE`); Shiplo names and brand
assets are governed separately (`TRADEMARKS.md`).
