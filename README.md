# Shiplo Showcase

A curated collection of open-source, production-quality **static web showcases** —
education experiences, creative tools and microsites — built and published by
[Shiplo HQ](https://github.com/shiplohq).

Every showcase is a self-contained static project: local JSON data, local assets,
no backend, no database, no SSR. Human-readable source is Apache-2.0
([LICENSE](LICENSE)); Shiplo names and brand assets are governed separately
([TRADEMARKS.md](TRADEMARKS.md)).

## Live showcases

<!-- showcase:gallery:start -->
> Nothing is live yet. Showcases appear here — with their real Shiplo URLs —
> only after they complete the full lifecycle (see [CONTRIBUTING.md](CONTRIBUTING.md)).
<!-- showcase:gallery:end -->

## Catalog

All planned and in-progress showcases. Status lives in
[showcase.json](showcase.json) — this table is generated from it
(`npm run gallery`).

<!-- showcase:catalog:start -->
| # | Showcase | Category | Stack | Status |
|---|---|---|---|---|
| 01 | **Number Garden** | education-math | react · vite · typescript | planned |
| 02 | **Fraction Bistro** | education-math | vue · vite · typescript | planned |
| 03 | **Geometry Builder** | education-math | angular · typescript | planned |
| 04 | **Multiplication Galaxy** | education-math | react · vite · typescript | planned |
| 05 | **Clock Quest** | education-math | jquery · html · css · gsap | planned |
| 06 | **Money Market Junior** | education-math | angular · typescript | planned |
| 07 | **Vocabulary Expedition** | education-language | vue · vite · typescript | planned |
| 08 | **Phonics Forest** | education-language | typescript · vite | planned |
| 09 | **Grammar Detective** | education-language | react · vite · typescript | planned |
| 10 | **Story Sequencer** | education-language | angular · typescript | planned |
| 11 | **Solar System Explorer** | education-science | react · vite · typescript | planned |
| 12 | **Human Body Lab** | education-science | vue · vite · typescript | planned |
| 13 | **EcoBalance** | education-science | typescript · vite | planned |
| 14 | **Atom Forge** | education-science | react · vite · typescript | planned |
| 15 | **RoboRoute** | education-computing | react · vite · typescript | planned |
| 16 | **GeoTrail** | education-geography | vue · vite · typescript | planned |
| 17 | **Rhythm Canvas** | creative-tool | typescript · vite · web-audio-api · gsap | planned |
| 18 | **Aurora Lamp** | marketing | html · css · javascript · gsap | planned |
| 19 | **Paper & Pixel** | portfolio | vue · vite · typescript | planned |
| 20 | **Habit Bloom** | productivity | react · vite · typescript | planned |
<!-- showcase:catalog:end -->

## The lifecycle

Every showcase follows the same path from idea to live demo:

```text
SPEC → DESIGN → IMPLEMENT → TEST → IMPECCABLE REVIEW → BUILD →
SECURITY/LICENSE REVIEW → DEPLOY TO SHIPLO → VERIFY LIVE DEPLOYMENT →
CAPTURE SCREENSHOTS → UPDATE METADATA → UPDATE README GALLERY → LIVE
```

The process, stage requirements and definition of done are documented in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Governance

| File | What it covers |
|---|---|
| [LICENSE](LICENSE) | Apache-2.0 for all original source |
| [NOTICE](NOTICE) | Attribution and third-party/trademark pointers |
| [TRADEMARKS.md](TRADEMARKS.md) | Shiplo names, logos and brand assets |
| [SECURITY.md](SECURITY.md) | What these demos are (and are not); vulnerability reporting |
| [THIRD_PARTY_POLICY.md](THIRD_PARTY_POLICY.md) | Third-party licenses, provenance and blocked material |
| [CONTRIBUTING.md](CONTRIBUTING.md) | The lifecycle and how to build a showcase |
| [showcase.json](showcase.json) | Registry of all showcases — single source of status |

## Repository tooling

Dependency-free Node scripts (Node 20+):

```bash
npm run validate          # validate showcase.json + live-project gates
npm run check:repo        # required files, forbidden paths, secret scan
npm run new -- <slug>     # scaffold projects/<slug>/ from templates/
npm run verify:static -- <slug>   # verify the built dist/ artifact
npm run gallery           # regenerate the README gallery/catalog
```

`npm run ci` runs the full local gate: registry validation, hygiene
checks, the secret scan, gallery freshness and — for projects that exist —
a clean install plus production build of each.

## Disclaimer

Showcases are demonstration and reference implementations, not security
audits or production-readiness guarantees. See [SECURITY.md](SECURITY.md).
