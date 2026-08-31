# __TITLE__

> Shiplo Showcase #__NUMBER_PADDED__ — __SUMMARY__

**Live demo:** _deployed URL will be linked here after verification_
**Category:** __CATEGORY__ · **License:** Apache-2.0 (original work)

<!-- Fill this section from the showcase spec. One short paragraph:
     what it is, who it is for, what the interaction is. -->

## Highlights

<!-- 3-5 bullets: the signature interaction(s), the art direction,
     what makes it feel authored rather than generated. -->

## Development

```bash
npm install
npm run dev
npm run build
```

<!-- Build-free project? Replace the block above with how to open/serve
     the source directly and how the artifact is assembled. -->

## Project structure

```text
__SLUG__/
├── README.md
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES.md
├── package.json + lockfile        # committed (when the project has dependencies)
├── src/
├── public/
│   ├── data/                      # local JSON content — no API, no database
│   └── assets/                    # local, redistributable assets only
├── showcase/
│   ├── cover.webp / desktop.webp / tablet.webp / mobile.webp
│   ├── metadata.json
│   └── deployment.json
└── dist/                          # generated, gitignored — the deploy artifact
```

## Open source

This project is part of the Shiplo Showcase and is distributed under the
Apache License 2.0. See `LICENSE` and `NOTICE`.

Shiplo names, logos and brand assets are handled separately from the
source-code license. See the repository `TRADEMARKS.md`.

Third-party material redistributed with this project is documented in
`THIRD_PARTY_NOTICES.md` (policy: repository `THIRD_PARTY_POLICY.md`).

## Security and production use

This project is a demonstration/reference implementation, not a security
audit or a production-readiness guarantee.

If you adapt it for production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository for the reporting policy and the
production-use checklist.
